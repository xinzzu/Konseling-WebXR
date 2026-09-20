#!/usr/bin/env node
/**
 * audit-episodes-live.mjs — Audit otomatis konten 5 episode vs narasi client.
 * Menarik data live dari backend lalu memeriksa:
 *  1. Struktur: 10 scene, no 1-10 berurutan, urutan tipe baku.
 *  2. Decision S5: 4 opsi A-D + opsi C selaras narasi tiap episode.
 *  3. Consequence S6: feedback tiap cabang selaras narasi.
 *  4. Refleksi S8: 3 pertanyaan. Transfer S9: 5 item + opsi + feedback.
 *  5. Penutup S10: teks + kutipan selaras narasi.
 *
 * Cara pakai:
 *   API_URL=http://localhost:3100 node scripts/audit-episodes-live.mjs
 *
 * Exit code 0 = lolos semua, 1 = ada temuan.
 */
const API = process.env.API_URL || "http://localhost:3100";
const EPS = ["ikhlas", "rendah-hati", "berpikir-kritis", "welas-asih", "toleransi"];
const EXPECTED_TYPES = ["opening", "dialog", "dialog", "dialog", "decision",
  "consequence", "refleksi_kiai", "refleksi_diri", "transfer", "penutup"];

// Fragmen teks narasi client yang WAJIB muncul (case-insensitive).
const DECISION_C = {
  "ikhlas": "iba",
  "rendah-hati": "siapa pun",
  "berpikir-kritis": "bukti",
  "welas-asih": "berhak belajar",
  "toleransi": "kudengarkan",
};
const CONSEQ = {
  "ikhlas": { A: "pujian akan berhenti", C: "itulah ikhlas", D: "ilmu belum menjadi amal" },
  "rendah-hati": { C: "rendah hati", D: "merendahkan" },
  "berpikir-kritis": { A: "banyaknya orang", C: "mencari kebenaran dengan ilmu", D: "dialog yang santun" },
  "welas-asih": { C: "menggerakkan tanganmu", A: "tetapi diam" },
  "toleransi": { C: "menghargai perbedaan", B: "paksaan", D: "kebencian" },
};
const QUOTE = {
  "ikhlas": "Ikhlas adalah fondasi kedamaian",
  "rendah-hati": "terus belajar",
  "berpikir-kritis": "mencari kebenaran melalui ilmu",
  "welas-asih": "peduli, bertindak",
  "toleransi": "menghargai perbedaan",
};

const fails = [];
function check(cond, msg) {
  console.log(`${cond ? "PASS" : "FAIL"} ${msg}`);
  if (!cond) fails.push(msg);
}

for (const ep of EPS) {
  const res = await fetch(`${API}/api/episodes/${ep}`);
  if (!res.ok) {
    check(false, `${ep}: backend ${res.status} (API hidup? ${API})`);
    continue;
  }
  const { episode: e } = await res.json();
  const ss = e?.scenes || [];
  check(ss.length === 10, `${ep}: 10 scenes (dapat ${ss.length})`);
  check(ss.map((s) => s.type).join(",") === EXPECTED_TYPES.join(","),
    `${ep}: urutan tipe baku`);
  check(ss.map((s) => s.no).join(",") === "1,2,3,4,5,6,7,8,9,10",
    `${ep}: no 1-10 berurutan`);
  const by = Object.fromEntries(ss.map((s) => [s.no, s]));

  const opts = by[5]?.options || [];
  check(opts.length === 4 && opts.map((o) => o.id).join("") === "ABCD",
    `${ep}: S5 decision 4 opsi A-D`);
  check((opts.find((o) => o.id === "C")?.label || "").toLowerCase().includes(DECISION_C[ep]),
    `${ep}: S5 opsi C ≈ narasi ('${DECISION_C[ep]}')`);

  const fb = by[6]?.feedback || {};
  for (const [k, frag] of Object.entries(CONSEQ[ep])) {
    check((fb[k] || "").toLowerCase().includes(frag),
      `${ep}: S6 feedback ${k} ≈ narasi ('${frag}')`);
  }

  check((by[8]?.questions || []).length === 3, `${ep}: S8 punya 3 pertanyaan`);
  const items = by[9]?.items || [];
  check(items.length === 5, `${ep}: S9 punya 5 situasi`);
  check(items.every((it) => (it.options || []).length >= 3 && it.feedback),
    `${ep}: S9 tiap item punya opsi + feedback`);

  check(Boolean(by[10]?.text) && (by[10]?.quote || "").toLowerCase().includes(QUOTE[ep].toLowerCase()),
    `${ep}: S10 penutup + kutipan ≈ narasi ('${QUOTE[ep]}')`);
}

console.log(fails.length ? `\nHASIL: ${fails.length} TEMUAN` : "\nHASIL: LOLOS semua");
process.exit(fails.length ? 1 : 0);
