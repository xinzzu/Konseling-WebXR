#!/usr/bin/env node
/**
 * e2e-3d-mock.mjs — Walkthrough 3D penuh alur mockup via klik canvas.
 * Start3D → Mode Mockup → pilih suasana → pilih topik → 3x pilih masalah →
 * cerita → selesai → Menu Utama. Semua klik tombol 3D; state dibaca dari
 * DOM 2D tersembunyi.
 *
 * Cara pakai: node scripts/e2e-3d-mock.mjs
 * Prasyarat: frontend dev (APP_URL) hidup. Mockup murni lokal (tanpa backend).
 * Exit code 0 = lolos, 1 = gagal.
 */
import { chromium } from "playwright";
import fs from "node:fs";
import { hideOverlay, domAttached, enableE2E, click3D, clickXY, find3D, dragLook } from "./tdrive.mjs";

const APP = process.env.APP_URL || "http://localhost:3000";
const HEADLESS = process.env.HEADLESS !== "false";

let failures = 0;
function ok(cond, msg) {
  const line = `${cond ? "PASS" : "FAIL"} ${msg}`;
  console.log(line);
  try { fs.appendFileSync("/tmp/e2e3dmock-progress.log", line + "\n"); } catch {}
  if (!cond) failures++;
}

const browser = await chromium.launch({ headless: HEADLESS });
const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
page.on("pageerror", (e) => console.log(`[pageerror] ${String(e.message).slice(0, 160)}`));

async function clickLabel(label, extra, idx = 0, exact = true, timeout = 15000) {
  const done = await click3D(page, (l) => (exact ? l === label : l.includes(label)), idx, timeout);
  ok(done, `${extra}: klik 3D "${label}" tereksekusi`);
  return done;
}

try {
  await enableE2E(page);
  await page.goto(APP, { waitUntil: "load" });
  await page.waitForTimeout(1500);
  await hideOverlay(page);
  await page.waitForTimeout(600);

  // Start3D → Mode Mockup (demo tanpa backend)
  await clickLabel("Mode Mockup — demo tanpa backend", "Start3D Mockup");
  await domAttached(page, "Pilih Suasana");
  ok(true, "Start3D → environment_select");

  // EnvironmentSelect3D: kartu paling kiri
  {
    const list = await find3D(page, (l) => l === "Pilih", { timeout: 20000 });
    const left = [...list].sort((a, b) => a.x - b.x)[0];
    ok(!!left, "EnvironmentSelect3D: kartu Pilih ketemu");
    if (left) {
      await clickXY(page, left.x, left.y);
    }
  }
  await domAttached(page, "ruang yang aman untuk berbagi");
  ok(true, "pilih suasana → topic_select");

  // TopicSelect3D: kartu paling kiri (tunggu opsi 3D muncul)
  {
    const list = await find3D(page, (l) => l === "Pilih", { timeout: 30000 });
    const left = [...list].sort((a, b) => a.x - b.x)[0];
    ok(!!left, "TopicSelect3D: kartu Pilih ketemu");
    if (left) {
      await clickXY(page, left.x, left.y);
    }
  }
  await domAttached(page, "Langkah 1 dari 3");
  ok(true, "pilih topik → problem_select");

  // ProblemSelect3D: 3 ronde, baris teratas (tombol label kosong)
  for (let r = 1; r <= 3; r++) {
    const list = await find3D(page, (l) => l === "", { timeout: 30000 });
    const top = [...list].sort((a, b) => a.y - b.y)[0];
    ok(!!top, `Problem ronde ${r}: baris masalah ketemu`);
    if (top) {
      await clickXY(page, top.x, top.y);
      await page.waitForTimeout(1000);
    }
    if (r < 3) {
      await domAttached(page, `Langkah ${r + 1} dari 3`);
      ok(true, `ronde ${r} → ronde ${r + 1}`);
    }
  }
  await domAttached(page, "Selesai Membaca");
  ok(true, "3 ronde → story");

  // Story3D: panel bawah terpotong viewport → arahkan kamera bertahap
  // sampai tombol terlihat (drag kecil-kecil, cek tiap langkah).
  async function revealStoryButton(label, timeout = 12000) {
    const t0 = Date.now();
    while (Date.now() - t0 < 90000) {
      await hideOverlay(page);
      const list = await find3D(page, (l) => l === label, { timeout: 4000 });
      if (list.length) return true;
      await dragLook(page, 0, 80);
    }
    return false;
  }
  ok(await revealStoryButton("✓ Selesai"), "Story3D: tombol Selesai terlihat");
  await clickLabel("✓ Selesai", "Story3D");
  // State selesai: tombol Menu Utama muncul (kamera sudah mengarah ke bawah)
  ok(await revealStoryButton("🏠 Menu Utama"), "Story3D selesai: tombol Menu terlihat");
  await clickLabel("🏠 Menu Utama", "Story3D selesai", 0, true, 20000);
  await domAttached(page, "Masuk Langgar");
  ok(true, "Menu Utama → start (siklus mockup 3D penuh)");
} catch (e) {
  ok(false, `EXCEPTION ${String(e.message).split("\n")[0].slice(0, 220)}`);
  await page.screenshot({ path: "/tmp/e2e-3dmock-fail.png" }).catch(() => {});
} finally {
  await page.close();
  await browser.close();
}

console.log(failures ? `\nHASIL: ${failures} KEGAGALAN` : "\nHASIL: LOLOS semua");
process.exit(failures ? 1 : 0);
