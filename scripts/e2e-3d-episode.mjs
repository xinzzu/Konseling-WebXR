#!/usr/bin/env node
/**
 * e2e-3d-episode.mjs — Walkthrough 3D penuh satu episode via klik canvas.
 * Start3D → Masuk Langgar → pilih episode → kartu peran → Adegan 1-10 →
 * selesai. Semua klik memakai test-hook Button3D (window.__buttons3d,
 * aktif via addInitScript — nol efek di production); state dibaca dari
 * DOM 2D tersembunyi.
 *
 * Cara pakai: node scripts/e2e-3d-episode.mjs [--episode=ikhlas]
 * Prasyarat: backend (API_URL) + frontend dev (APP_URL) hidup.
 * Exit code 0 = lolos, 1 = gagal.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import { hideOverlay, readChips, domAttached, enableE2E, click3D } from "./tdrive.mjs";

const API = process.env.API_URL || "http://localhost:3100";
const APP = process.env.APP_URL || "http://localhost:3000";
const HEADLESS = process.env.HEADLESS !== "false";
const argEp = (process.argv.find((a) => a.startsWith("--episode=")) || "").split("=")[1] || "ikhlas";

let failures = 0;
function ok(cond, msg) {
  const line = `${cond ? "PASS" : "FAIL"} ${msg}`;
  console.log(line);
  try { fs.appendFileSync("/tmp/e2e3d-progress.log", line + "\n"); } catch {}
  if (!cond) failures++;
}

const browser = await chromium.launch({ headless: HEADLESS });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("pageerror", (e) => console.log(`[pageerror] ${String(e.message).slice(0, 160)}`));

async function clickLabel(label, extra, idx = 0, exact = true) {
  const done = await click3D(page,
    (l) => exact ? l === label : l.includes(label), idx);
  ok(done, `${extra}: klik 3D "${label}" tereksekusi`);
  return done;
}

async function expectChip(n, extra = "") {
  const label = n === 0 ? "Peranmu / 10" : `Adegan ${n} / 10`;
  try {
    await domAttached(page, label);
    ok(true, `${extra} → ${label}`);
    return true;
  } catch {
    ok(false, `${extra} → ${label} (gagal; chip: ${JSON.stringify(await readChips(page))})`);
    return false;
  }
}

try {
  const { episode: ep } = await (await fetch(`${API}/api/episodes/${argEp}`)).json();
  const by = Object.fromEntries(ep.scenes.map((s) => [s.no, s]));

  await enableE2E(page);
  await page.goto(APP, { waitUntil: "load" });
  await page.waitForTimeout(2500);
  await hideOverlay(page);
  await page.waitForTimeout(1000);

  await clickLabel("Masuk Langgar", "Start3D");
  await domAttached(page, "Pilih Pelajaran");
  ok(true, "Start3D → episode_select");

  await clickLabel(ep.tema, "EpisodeSelect3D", 0, false);
  await expectChip(0, "pilih episode");

  await clickLabel("Saya siap — masuk", "kartu peran");
  await expectChip(1, "kartu peran");

  await clickLabel("Lanjut ▸", "S1");
  await expectChip(2, "S1");

  // S2 dialog ber-opsi (bila ada): opsi pertama lalu Lanjut
  if ((by[2].options || []).length) {
    const s2o = by[2].options[0];
    await clickLabel(`${s2o.id}. ${s2o.label}`, "S2 opsi pertama");
    await clickLabel("Lanjut ▸", "S2 Lanjut");
  } else {
    await clickLabel("Lanjut ▸", "S2");
  }
  await expectChip(3, "S2");

  await clickLabel("Lanjut ▸", "S3");
  await expectChip(4, "S3");
  await clickLabel("Lanjut ▸", "S4");
  await expectChip(5, "S4");

  // S5 decision: opsi C
  const cOpt = by[5].options.find((o) => o.id === "C");
  await clickLabel(`${cOpt.id}. ${cOpt.label}`, "S5 opsi C");
  await expectChip(6, "S5 decision");
  // Diagnostik: feedback milik siapa yang tampil?
  for (const oid of ["A", "B", "C", "D"]) {
    const frag = (by[6].feedback[oid] || "").slice(0, 40);
    if (!frag) continue;
    try {
      await domAttached(page, frag, 3000);
      ok(oid === "C", `S6 feedback milik opsi ${oid} (harap C)`);
    } catch { /* bukan yang ini */ }
  }

  // S6 consequence → 7 (REGRESI double-fire)
  await clickLabel("Renungkan ▸", "S6");
  await expectChip(7, "S6 Renungkan");
  ok(!(await readChips(page)).includes("Adegan 8 / 10"), "tidak loncat ke 8/10");

  await clickLabel("Lanjut merenung ▸", "S7");
  await expectChip(8, "S7");

  // S8: Merenung lalu jawab tiap pertanyaan (opsi pertama)
  await clickLabel("Merenung ▸", "S8 intro");
  for (let q = 0; q < by[8].questions.length; q++) {
    const s8o = by[8].answerOptions[q].options[0];
    await clickLabel(`${s8o.id}. ${s8o.label}`, `S8 Q${q + 1}`);
  }
  await expectChip(9, "S8");

  // S9: jawab tiap item. Self-sync via judul "Situasi N/5": hanya bisa maju
  // dengan menjawab (tombol lanjut butuh lastAnswered), dan loncatan idx
  // >1 = bug skip. Pilihan C seperti jalur 2D.
  async function currentTransferIdx() {
    const t = await page.evaluate(() => document.body.textContent || "");
    const m = t.match(/Situasi (\d)\/(\d+)/);
    return m ? parseInt(m[1], 10) - 1 : -1;
  }
  const visited = [];
  for (let step = 0; step < 14; step++) {
    const idx = await currentTransferIdx();
    if (idx < 0 || idx >= by[9].items.length) break;
    visited.push(idx);
    const ci = by[9].items[idx].options.find((o) => o.id === "C") || by[9].items[idx].options[0];
    await click3D(page, (l) => l === `${ci.id}. ${ci.label}`, 0, 8000);
    const nextBtn = (await click3D(page, (l) => l === "Situasi berikutnya ▸", 0, 6000))
      ? "Situasi berikutnya ▸" : (await click3D(page, (l) => l === "Lanjut ▸", 0, 6000) ? "Lanjut ▸" : null);
    if (!nextBtn) break;
  }
  const jumps = visited.slice(1).filter((v, i) => v > visited[i] + 1);
  ok(jumps.length === 0, `S9 tanpa skip (kunjungan: ${visited.join(",") || "-"})`);
  await expectChip(10, "S9");

  await domAttached(page, (by[10].quote || "").slice(0, 36));
  ok(true, "S10 kutipan tampil");
  for (let r = 0; r < 3; r++) {
    await clickLabel("✓ Selesai", `S10 (coba ${r + 1})`);
    try {
      await domAttached(page, `Episode ${ep.tema} Selesai`, 8000);
      break;
    } catch { /* klik meleset — ulangi */ }
  }
  await domAttached(page, `Episode ${ep.tema} Selesai`);
  ok(true, "episode_finished tercapai (3D penuh)");
} catch (e) {
  ok(false, `EXCEPTION ${String(e.message).split("\n")[0].slice(0, 220)}`);
  await page.screenshot({ path: "/tmp/e2e-3dep-fail.png" }).catch(() => {});
} finally {
  await page.close();
  await browser.close();
}

console.log(failures ? `\nHASIL: ${failures} KEGAGALAN` : "\nHASIL: LOLOS semua");
process.exit(failures ? 1 : 0);
