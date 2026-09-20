#!/usr/bin/env node
/**
 * e2e-3d-episodes-smoke.mjs — Smoke test 3D semua episode.
 * Per episode: Start3D → Masuk Langgar → pilih episode → kartu peran →
 * S1 → S2 (semua via klik 3D). Memastikan tiap episode bisa dimuat dan
 * dirender di mode 3D (logika play penuh sudah diuji di e2e-3d-episode).
 *
 * Cara pakai: node scripts/e2e-3d-episodes-smoke.mjs [--episode=<id>]
 * Exit code 0 = lolos, 1 = gagal.
 */
import { chromium } from "playwright";
import { hideOverlay, domAttached, enableE2E, click3D } from "./tdrive.mjs";

const APP = process.env.APP_URL || "http://localhost:3000";
const HEADLESS = process.env.HEADLESS !== "false";
const ALL = ["ikhlas", "rendah-hati", "berpikir-kritis", "welas-asih", "toleransi"];
const argEp = (process.argv.find((a) => a.startsWith("--episode=")) || "").split("=")[1];
const EPS = argEp ? [argEp] : ALL;
const TEMA = {
  "ikhlas": "Ikhlas",
  "rendah-hati": "Rendah Hati",
  "berpikir-kritis": "Berpikir Kritis",
  "welas-asih": "Welas Asih",
  "toleransi": "Toleransi",
};

let failures = 0;
function ok(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
  if (!cond) failures++;
}

const browser = await chromium.launch({ headless: HEADLESS });

for (const ep of EPS) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  page.on("pageerror", (e) => console.log(`[pageerror] ${String(e.message).slice(0, 120)}`));
  try {
    await enableE2E(page);
    await page.goto(APP, { waitUntil: "load" });
    await page.waitForTimeout(1500);
    await hideOverlay(page);

    let done = await click3D(page, (l) => l === "Masuk Langgar", 0);
    ok(done, `${ep}: Start3D Masuk Langgar`);
    await domAttached(page, "Pilih Pelajaran");
    done = await click3D(page, (l) => l.includes(TEMA[ep]), 0);
    ok(done, `${ep}: pilih episode 3D`);
    await domAttached(page, "Peranmu / 10");
    done = await click3D(page, (l) => l === "Saya siap — masuk", 0);
    ok(done, `${ep}: kartu peran 3D`);
    await domAttached(page, "Adegan 1 / 10");
    done = await click3D(page, (l) => l === "Lanjut ▸", 0);
    ok(done, `${ep}: S1 Lanjut 3D`);
    await domAttached(page, "Adegan 2 / 10");
    ok(true, `${ep}: 3D sampai S2`);
  } catch (e) {
    ok(false, `${ep}: EXCEPTION ${String(e.message).split("\n")[0].slice(0, 160)}`);
  } finally {
    await page.close();
  }
}

await browser.close();
console.log(failures ? `\nHASIL: ${failures} KEGAGALAN` : "\nHASIL: LOLOS semua");
process.exit(failures ? 1 : 0);
