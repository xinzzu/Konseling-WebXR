/** Shared helper untuk automation test 3D (klik tombol 3D via canvas).
 * Prinsip: overlay HTML disembunyikan, tombol 3D ditemukan via hover-sweep
 * (R3F mengubah cursor jadi pointer saat hover), diverifikasi, lalu diklik.
 * State dibaca dari DOM 2D yang tersembunyi (tetap ter-update via store).
 */
export async function hideOverlay(page) {
  // Agresif: sembunyikan SEMUA elemen fixed kecuali canvas itu sendiri.
  // Layar 2D me-mount ulang tiap pindah gameState, jadi harus dipanggil
  // ulang sebelum setiap klik 3D (teks DOM tetap bisa dibaca).
  await page.evaluate(() => {
    document.querySelectorAll("body *").forEach((el) => {
      if (el.tagName === "CANVAS") return;
      if (el.querySelector && el.querySelector("canvas")) return;
      if (getComputedStyle(el).position === "fixed") el.style.display = "none";
    });
  });
}

export async function isHover(page) {
  return (await page.evaluate(() => document.body.style.cursor)) === "pointer";
}

/** Sweep region → cluster hoverable, urut dari run terlebar. */
export async function sweepButtons(page, { x0 = 400, x1 = 880, y0 = 40, y1 = 740, step = 25, settle = 120 } = {}) {
  const rows = [];
  for (let y = y0; y <= y1; y += step) {
    const hits = [];
    for (let x = x0; x <= x1; x += step) {
      await page.mouse.move(x, y);
      await page.waitForTimeout(settle);
      if (await isHover(page)) hits.push(x);
    }
    let run = [];
    let bestRun = [];
    for (const x of hits) {
      run = run.length && x - run[run.length - 1] <= step * 2 ? [...run, x] : [x];
      if (run.length > bestRun.length) bestRun = run;
    }
    if (bestRun.length >= 2) {
      rows.push({
        y,
        x0: bestRun[0],
        x1: bestRun[bestRun.length - 1],
        cx: Math.round((bestRun[0] + bestRun[bestRun.length - 1]) / 2),
        w: bestRun[bestRun.length - 1] - bestRun[0],
      });
    }
  }
  // Gabungkan baris berdekatan (satu tombol kena 2 baris sweep)
  const merged = [];
  for (const r of rows) {
    const prev = merged[merged.length - 1];
    if (prev && r.y - prev.y <= step && Math.abs(r.cx - prev.cx) < 120) {
      prev.y = Math.round((prev.y + r.y) / 2);
      prev.x0 = Math.min(prev.x0, r.x0);
      prev.x1 = Math.max(prev.x1, r.x1);
      prev.cx = Math.round((prev.x0 + prev.x1) / 2);
      prev.w = prev.x1 - prev.x0;
    } else merged.push({ ...r });
  }
  merged.sort((a, b) => b.w - a.w);
  return merged;
}

/** Klik cluster terverifikasi (hover tengah → pointer). Return true bila diklik. */
export async function clickCluster(page, c) {
  await page.mouse.move(c.cx, c.y);
  await page.waitForTimeout(300);
  if (!(await isHover(page))) return false;
  await page.mouse.click(c.cx, c.y);
  await page.waitForTimeout(2200);
  return true;
}

/** Baca chip progress dari DOM (2D tersembunyi tapi tetap update). */
export async function readChips(page) {
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

export async function domAttached(page, text, timeout = 25000) {
  await page.getByText(text, { exact: false }).first().waitFor({ state: "attached", timeout });
}

/** Drag di area kosong canvas untuk mengarahkan kamera OrbitControls. */
export async function dragLook(page, dx, dy) {
  await page.mouse.move(640, 400);
  await page.mouse.down();
  await page.mouse.move(640 + dx, 400 + dy, { steps: 12 });
  await page.mouse.up();
  await page.waitForTimeout(800);
}

/** Aktifkan test-hook Button3D (window.__E2E3D) sebelum goto. */
export async function enableE2E(page) {
  await page.addInitScript(() => {
    window.__E2E3D = true;
    window.__buttons3d = {};
  });
}

/** Baca registry tombol 3D yang segar; match(label) di-Node. Urut atas→bawah. */
export async function find3D(page, match, { timeout = 15000, freshMs = 8000 } = {}) {
  const t0 = Date.now();
  let lastSeen = [];
  while (Date.now() - t0 < timeout) {
    const all = await page.evaluate(() => Object.entries(window.__buttons3d || {}));
    const now = Date.now();
    lastSeen = all.filter(([, e]) => e && !e.behind && now - e.t < freshMs &&
      e.x > -50 && e.x < 1340 && e.y > -50 && e.y < 850).map(([, e]) => e.label);
    const list = all.filter(
      ([, e]) => e && !e.behind && now - e.t < freshMs &&
        e.x > -50 && e.x < 1340 && e.y > -50 && e.y < 850 && match(e.label)
    ).map(([id, e]) => ({ id, ...e }));
    if (list.length) return list.sort((a, b) => a.y - b.y || a.x - b.x);
    await page.waitForTimeout(200);
  }
  console.log(`  [find3D] tak ketemu. Label segar saat ini: ${JSON.stringify(lastSeen)}`);
  return [];
}

/** Klik entri registry ke-idx yang cocok. Return true bila diklik. */
export async function click3D(page, match, idx = 0, timeout = 15000) {
  const list = await find3D(page, match, { timeout });
  if (list.length <= idx) return false;
  const id = list[idx].id;
  await hideOverlay(page); // layar 2D me-mount ulang tiap state → singkap lagi
  // Baca ulang koordinat id yang sama persis sebelum klik (anti-basi).
  const fresh = await page.evaluate((eid) => (window.__buttons3d || {})[eid] || null, id);
  const t = fresh && !fresh.behind ? fresh : list[idx];
  await page.mouse.click(t.x, t.y);
  await page.waitForTimeout(1200);
  return true;
}

/** Klik koordinat mentah (untuk kartu tanpa label unik). */
export async function clickXY(page, x, y) {
  await hideOverlay(page);
  await page.mouse.click(x, y);
  await page.waitForTimeout(1500);
}

/** Sweep strip vertikal cepat (x.verbose sempit) → daftar baris y hoverable. */
export async function sweepStrip(page, { x0 = 600, x1 = 680, y0 = 60, y1 = 700, step = 12, settle = 30 } = {}) {
  const rows = [];
  for (let y = y0; y <= y1; y += step) {
    let hit = false;
    for (let x = x0; x <= x1; x += step) {
      await page.mouse.move(x, y);
      await page.waitForTimeout(settle);
      if (await isHover(page)) { hit = true; break; }
    }
    if (hit) rows.push(y);
  }
  // Gabungkan baris berdekatan
  const merged = [];
  for (const y of rows) {
    const prev = merged[merged.length - 1];
    if (prev && y - prev.y <= step) prev.y = Math.round((prev.y + y) / 2);
    else merged.push({ y });
  }
  return merged;
}

/** Ukur lebar horizontal tombol pada baris y → center x. */
export async function measureRow(page, y, { x0 = 380, x1 = 900, step = 25, settle = 30 } = {}) {
  const hits = [];
  for (let x = x0; x <= x1; x += step) {
    await page.mouse.move(x, y);
    await page.waitForTimeout(settle);
    if (await isHover(page)) hits.push(x);
  }
  if (hits.length < 2) return null;
  return { y, x0: hits[0], x1: hits[hits.length - 1], cx: Math.round((hits[0] + hits[hits.length - 1]) / 2), w: hits[hits.length - 1] - hits[0] };
}

/** Cari semua tombol di strip tengah (untuk panel terpusat). */
export async function findCenterButtons(page, stripOpts, measureOpts) {
  const rows = await sweepStrip(page, stripOpts);
  const out = [];
  for (const r of rows) {
    const m = await measureRow(page, r.y, measureOpts);
    if (m) out.push(m);
  }
  out.sort((a, b) => b.w - a.w);
  return out;
}
