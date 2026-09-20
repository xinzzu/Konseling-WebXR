#!/usr/bin/env node
/**
 * e2e-episode-flow.mjs — Automation test alur episode 2D (HTML) end-to-end.
 * Menjalankan Episode 1..5 (atau satu episode via --episode=<id>) dari
 * Start → Masuk Langgar → pilih episode → kartu peran → Adegan 1-10 →
 * selesai, dengan asersi label progress tiap langkah dan isi kunci narasi.
 * Jalur jawaban: selalu opsi C (jalur selaras nilai) + opsi pertama S2.
 *
 * Cara pakai:
 *   node scripts/e2e-episode-flow.mjs --episode=ikhlas
 *   node scripts/e2e-episode-flow.mjs --all
 *
 * Prasyarat: backend hidup (API_URL, default http://localhost:3100)
 * dan frontend dev server hidup (APP_URL, default http://localhost:3000).
 *
 * Exit code 0 = lolos, 1 = gagal.
 */
import { chromium } from "playwright";

const API = process.env.API_URL || "http://localhost:3100";
const APP = process.env.APP_URL || "http://localhost:3000";
const args = Object.fromEntries(process.argv.slice(2).map((a) => {
  const [k, v] = a.replace(/^--/, "").split("=");
  return [k, v ?? true];
}));

const ALL = ["ikhlas", "rendah-hati", "berpikir-kritis", "welas-asih", "toleransi"];
const EPISODES = args.all ? ALL : [args.episode || "ikhlas"];
const HEADLESS = args.headless !== "false";

let failures = 0;
function ok(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
  if (!cond) failures++;
}

async function clickBtn(page, name, timeout = 15000) {
  const btn = page.getByRole("button", { name, exact: false });
  await btn.first().waitFor({ state: "visible", timeout });
  // force: tombol 2D beranimasi ui-pulse (infinite) sehingga tidak stabil;
  // klik manusia normal, hanya Playwright yang menunggu stabilitas.
  await btn.first().click({ force: true });
}

async function expectChip(page, n, timeout = 20000) {
  const label = n === 0 ? "Peranmu / 10" : `Adegan ${n} / 10`;
  await page.getByText(label, { exact: false }).first().waitFor({ state: "visible", timeout });
  return label;
}

async function lewati(page) {
  // Paksa konten muncul tanpa menunggu audio (klik Lewati bila ada).
  const skip = page.getByRole("button", { name: "⏭️ Lewati", exact: true });
  try {
    await skip.first().waitFor({ state: "visible", timeout: 2500 });
    await skip.first().click({ force: true });
  } catch { /* audio sudah selesai / watchdog */ }
}

// Dialog S2/S3/S4: ada yang ber-opsi (EP1+EP2 S2), ada yang polos.
async function stepDialog(page, scene) {
  await lewati(page);
  if ((scene.options || []).length) {
    await clickBtn(page, scene.options[0].label.slice(0, 24));
  }
  await clickBtn(page, "Lanjut");
}

async function runEpisode(browser, epId) {
  console.log(`\n===== EPISODE: ${epId} =====`);
  const res = await fetch(`${API}/api/episodes/${epId}`);
  if (!res.ok) { ok(false, `${epId}: backend ${res.status}`); return; }
  const { episode: ep } = await res.json();
  const by = Object.fromEntries(ep.scenes.map((s) => [s.no, s]));
  const pickC = (opts) => opts.find((o) => o.id === "C").label;

  const page = await browser.newPage();
  page.on("pageerror", (e) => console.log(`[pageerror] ${String(e.message).slice(0, 160)}`));
  try {
    await page.goto(APP, { waitUntil: "load" });
    await page.waitForTimeout(1200);

    // Start → Masuk Langgar (jalur real backend)
    await clickBtn(page, "Masuk Langgar");
    await page.getByText("Pilih Pelajaran").first().waitFor({ timeout: 20000 });
    ok(true, `${epId}: Start → episode_select`);

    // Pilih episode
    await clickBtn(page, ep.tema);
    await expectChip(page, 0);
    ok(true, `${epId}: kartu peran tampil`);

    // Kartu peran → S1
    await clickBtn(page, "Saya siap");
    await expectChip(page, 1);

    // S1 opening → S2
    await clickBtn(page, "Lanjut");
    await expectChip(page, 2);

    // S2/S3/S4 dialog (S2 ber-opsi di EP1+EP2, polos di lainnya)
    await stepDialog(page, by[2]);
    await expectChip(page, 3);
    await stepDialog(page, by[3]);
    await expectChip(page, 4);
    await stepDialog(page, by[4]);
    await expectChip(page, 5);

    // S5 decision: pilih C (jalur selaras)
    await lewati(page);
    await clickBtn(page, pickC(by[5].options).slice(0, 28));
    await expectChip(page, 6);

    // S6 consequence: REGRESI UTAMA — Renungkan harus ke 7, bukan 8
    const fbC = by[6].feedback.C;
    await page.getByText(fbC.slice(0, 40), { exact: false }).first()
      .waitFor({ timeout: 15000 });
    ok(true, `${epId}: S6 feedback C tampil (umpan balik spesifik pilihan)`);
    await clickBtn(page, "Renungkan");
    const chip7 = await expectChip(page, 7);
    ok(chip7.includes("7 / 10"), `${epId}: S6 Renungkan → Adegan 7/10 (tidak loncat ke 8)`);
    // Pastikan bukan 8
    const chip8 = await page.getByText("Adegan 8 / 10", { exact: false }).count();
    ok(chip8 === 0, `${epId}: tidak ada loncat ke 8/10`);

    // S7 refleksi kiai → S8
    await clickBtn(page, "Lanjut merenung");
    await expectChip(page, 8);

    // S8 refleksi diri: intro → 3 pertanyaan ber-opsi
    await clickBtn(page, "Merenung");
    for (let q = 0; q < 3; q++) {
      await lewati(page);
      const label = by[8].answerOptions[q].options[0].label;
      await clickBtn(page, label.slice(0, 30));
    }
    await expectChip(page, 9);

    // S9 transfer: 5 item, pilih C tiap item
    const items = by[9].items;
    for (let i = 0; i < items.length; i++) {
      await lewati(page);
      await clickBtn(page, pickC(items[i].options).slice(0, 30));
      // feedback inline muncul
      await page.getByText(items[i].feedback.C.slice(0, 32), { exact: false }).first()
        .waitFor({ timeout: 15000 });
      await clickBtn(page, i + 1 < items.length ? "Situasi berikutnya" : "Lanjut", 15000);
    }
    await expectChip(page, 10);

    // S10 penutup: kutipan tampil → selesai
    await page.getByText((by[10].quote || "").slice(0, 36), { exact: false }).first()
      .waitFor({ timeout: 15000 });
    ok(true, `${epId}: S10 kutipan penutup tampil`);
    await clickBtn(page, "Selesai");
    await page.getByText(`Episode ${ep.tema} Selesai`).first()
      .waitFor({ timeout: 15000 });
    ok(true, `${epId}: episode_finished tercapai`);
  } catch (e) {
    ok(false, `${epId}: EXCEPTION ${String(e.message).split("\n")[0].slice(0, 220)}`);
    await page.screenshot({ path: `/tmp/e2e-fail-${epId}.png` }).catch(() => {});
  } finally {
    await page.close();
  }
}

const browser = await chromium.launch({ headless: HEADLESS });
for (const ep of EPISODES) await runEpisode(browser, ep);
await browser.close();
console.log(failures ? `\nHASIL: ${failures} KEGAGALAN` : "\nHASIL: LOLOS semua");
process.exit(failures ? 1 : 0);
