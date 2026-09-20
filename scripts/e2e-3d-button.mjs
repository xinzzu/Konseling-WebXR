#!/usr/bin/env node
/**
 * e2e-3d-button.mjs — Regression test tombol 3D (Button3D) anti double-fire.
 *
 * Latar: satu klik fisik di tombol 3D pernah memajukan 2-4 adegan sekaligus
 * (laporan manual: "Renungkan" di Adegan 6/10 loncat ke 8/10; automation
 * mengukur 6/10 → 10/10). Penyebab: onPointerUp + onClick + onSelect semua
 * menembak props.onClick untuk satu gestur yang sama.
 *
 * Test: drive 2D sampai S6 consequence (Episode ikhlas, pilih C),
 * sembunyikan overlay HTML, temukan tombol "Renungkan" 3D via hover-sweep
 * (cursor pointer), klik SEKALI via mouse di canvas, asersi mendarat di 7/10.
 *
 * Cara pakai:
 *   node scripts/e2e-3d-button.mjs
 *
 * Prasyarat: backend hidup (API_URL) dan frontend dev server (APP_URL).
 * Exit code 0 = lolos, 1 = gagal.
 */
import { chromium } from "playwright";

const API = process.env.API_URL || "http://localhost:3100";
const APP = process.env.APP_URL || "http://localhost:3000";
const HEADLESS = process.env.HEADLESS !== "false";

let failures = 0;
function ok(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
  if (!cond) failures++;
}

const browser = await chromium.launch({ headless: HEADLESS });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("pageerror", (e) => console.log(`[pageerror] ${String(e.message).slice(0, 160)}`));

async function clickBtn(name, timeout = 15000) {
  const b = page.getByRole("button", { name, exact: false });
  await b.first().waitFor({ state: "visible", timeout });
  await b.first().click({ force: true });
}
async function chip(n) {
  const label = n === 0 ? "Peranmu / 10" : `Adegan ${n} / 10`;
  await page.getByText(label, { exact: false }).first().waitFor({ timeout: 20000 });
}
async function lewati() {
  try {
    const sk = page.getByRole("button", { name: "⏭️ Lewati", exact: true });
    await sk.first().waitFor({ timeout: 2500 });
    await sk.first().click({ force: true });
  } catch { /* audio sudah selesai */ }
}
async function readChips() {
  return page.evaluate(() => {
    const out = new Set();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walker.nextNode())) {
      const m = (n.textContent || "").match(/((Peranmu|Adegan \d+) \/ 10)/);
      if (m) out.add(m[1]);
    }
    return [...out];
  });
}

try {
  const { episode: ep } = await (await fetch(`${API}/api/episodes/ikhlas`)).json();
  const by = Object.fromEntries(ep.scenes.map((s) => [s.no, s]));

  await page.goto(APP, { waitUntil: "load" });
  await page.waitForTimeout(1200);
  await clickBtn("Masuk Langgar");
  await page.getByText("Pilih Pelajaran").first().waitFor({ timeout: 20000 });
  await clickBtn("Ikhlas");
  await chip(0);
  await clickBtn("Saya siap");
  await chip(1);
  await clickBtn("Lanjut");
  await chip(2);
  await lewati();
  await clickBtn(by[2].options[0].label.slice(0, 24));
  await clickBtn("Lanjut");
  await chip(3);
  await clickBtn("Lanjut");
  await chip(4);
  await clickBtn("Lanjut");
  await chip(5);
  await lewati();
  await clickBtn(by[5].options.find((o) => o.id === "C").label.slice(0, 28));
  await chip(6);
  ok(true, "drive 2D sampai S6 consequence");

  // Singkap canvas 3D
  await page.evaluate(() => {
    document.querySelectorAll("div").forEach((d) => {
      const s = getComputedStyle(d);
      if (s.position === "fixed" && parseInt(s.zIndex || "0") >= 5) d.style.display = "none";
    });
    document.querySelectorAll("button").forEach((b) => {
      const s = getComputedStyle(b);
      if (s.position === "fixed" || s.position === "absolute") b.style.display = "none";
    });
  });
  await page.waitForTimeout(1200);

  // Hover-sweep: cari baris sel dengan cursor pointer (= tombol 3D).
  // Kandidat diurut dari run terlebar; tiap kandidat diverifikasi ulang
  // (hover tengah → cursor pointer) sebelum diklik — anti raycast-lag.
  const rows = [];
  for (let y = 60; y <= 220; y += 20) {
    const hits = [];
    for (let x = 480; x <= 800; x += 20) {
      await page.mouse.move(x, y);
      await page.waitForTimeout(200);
      if ((await page.evaluate(() => document.body.style.cursor)) === "pointer") hits.push(x);
    }
    // run berurutan terpanjang di baris ini
    let run = [];
    let bestRun = [];
    for (const x of hits) {
      run = run.length && x - run[run.length - 1] <= 40 ? [...run, x] : [x];
      if (run.length > bestRun.length) bestRun = run;
    }
    if (bestRun.length >= 3) rows.push({ y, hits: bestRun });
  }
  rows.sort((a, b) => b.hits.length - a.hits.length);
  ok(rows.length > 0, `tombol 3D ditemukan via hover (${rows.length} kandidat)`);

  let chips = await readChips();
  let clicked = false;
  for (const cand of rows.slice(0, 3)) {
    const cx = Math.round((cand.hits[0] + cand.hits[cand.hits.length - 1]) / 2);
    await page.mouse.move(cx, cand.y);
    await page.waitForTimeout(300);
    const cur = await page.evaluate(() => document.body.style.cursor);
    if (cur !== "pointer") continue; // lag raycast — lewati kandidat palsu
    await page.mouse.click(cx, cand.y);
    await page.waitForTimeout(2500);
    chips = await readChips();
    clicked = true;
    break;
  }
  ok(clicked, "klik 3D tereksekusi pada tombol terverifikasi");
  ok(chips.includes("Adegan 7 / 10"),
    `1 klik 3D Renungkan → Adegan 7/10 (dapat ${JSON.stringify(chips)})`);
  ok(!chips.includes("Adegan 8 / 10"), "tidak loncat ke 8/10 (regresi manual)");
} catch (e) {
  ok(false, `EXCEPTION ${String(e.message).split("\n")[0].slice(0, 220)}`);
  await page.screenshot({ path: "/tmp/e2e-3d-fail.png" }).catch(() => {});
} finally {
  await page.close();
  await browser.close();
}

console.log(failures ? `\nHASIL: ${failures} KEGAGALAN` : "\nHASIL: LOLOS semua");
process.exit(failures ? 1 : 0);
