#!/usr/bin/env node
/**
 * validate-episodes.mjs — Validasi otomatis data episode (5 episode x 10 scene).
 * Dipakai sebelum manual testing di perangkat, supaya bug data ketahuan duluan.
 *
 * Cara pakai:
 *   node scripts/validate-episodes.mjs <path-ke-episodes.json>
 *   node scripts/validate-episodes.mjs src/data/episodes.json
 *
 * Keluar dengan exit code 0 = lolos, 1 = ada error.
 * Kontrak schema: lihat FLOW episode (opening, dialog, decision, consequence,
 * refleksi_kiai, refleksi_diri, transfer, penutup).
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const VALID_TYPES = new Set([
  "opening",
  "dialog",
  "decision",
  "consequence",
  "refleksi_kiai",
  "refleksi_diri",
  "transfer",
  "penutup",
]);

const errors = [];
const err = (loc, msg) => errors.push(`[ERROR] ${loc}: ${msg}`);

function isNonEmptyString(v) {
  return typeof v === "string" && v.trim().length > 0;
}

function validateOptionList(options, loc, min = 2, max = 4) {
  if (!Array.isArray(options) || options.length < min || options.length > max) {
    err(loc, `options harus array berisi ${min}-${max} item`);
    return null;
  }
  const ids = new Set();
  for (const [i, o] of options.entries()) {
    if (!o || typeof o !== "object") {
      err(loc, `options[${i}] harus object {id, label}`);
      continue;
    }
    if (!isNonEmptyString(o.id)) err(loc, `options[${i}].id kosong`);
    if (!isNonEmptyString(o.label)) err(loc, `options[${i}].label kosong`);
    if (o.id && ids.has(o.id)) err(loc, `options id duplikat: "${o.id}"`);
    ids.add(o.id);
  }
  return [...ids].filter(Boolean);
}

function validateFeedback(feedback, optionIds, loc) {
  if (!feedback || typeof feedback !== "object" || Array.isArray(feedback)) {
    err(loc, `feedback harus object {optionId: teks}`);
    return;
  }
  for (const id of optionIds || []) {
    if (!isNonEmptyString(feedback[id])) {
      err(loc, `feedback hilang/kosong untuk pilihan "${id}"`);
    }
  }
  for (const key of Object.keys(feedback)) {
    if (optionIds && !optionIds.includes(key)) {
      err(loc, `feedback "${key}" tidak merujuk ke pilihan manapun`);
    }
  }
}

function validateScene(epId, scene, idx, prevDecisionOptions) {
  const loc = `episode "${epId}" scene index-${idx}`;
  if (!scene || typeof scene !== "object") {
    err(loc, "scene harus object");
    return null;
  }
  const where = `episode "${epId}" scene ${scene.no ?? `(index ${idx})`}`;

  if (scene.no !== idx + 1) {
    err(loc, `nomor scene harus ${idx + 1}, ketemu ${scene.no}`);
  }
  if (!VALID_TYPES.has(scene.type)) {
    err(where, `type tidak dikenal: "${scene.type}" (harus salah satu: ${[...VALID_TYPES].join(", ")})`);
    return null;
  }
  if (!isNonEmptyString(scene.text)) {
    err(where, "text kosong (semua scene wajib ada teks)");
  }

  switch (scene.type) {
    case "dialog":
      if (!isNonEmptyString(scene.speaker)) {
        err(where, 'dialog wajib ada "speaker" (Narator/Kiai/Sudja/...)');
      }
      return null;
    case "decision": {
      const ids = validateOptionList(scene.options, where);
      return ids; // diteruskan ke consequence berikutnya
    }
    case "consequence":
      if (!prevDecisionOptions) {
        err(where, "consequence tanpa decision sebelumnya");
      } else {
        validateFeedback(scene.feedback, prevDecisionOptions, where);
      }
      return null;
    case "refleksi_diri":
      if (!Array.isArray(scene.questions) || scene.questions.length === 0) {
        err(where, "refleksi_diri wajib ada questions (array, min 1)");
      } else {
        scene.questions.forEach((q, i) => {
          if (!isNonEmptyString(q)) err(where, `questions[${i}] kosong`);
        });
      }
      return null;
    case "transfer": {
      if (!Array.isArray(scene.items) || scene.items.length === 0) {
        err(where, "transfer wajib ada items (situasi sekolah, min 1)");
        return null;
      }
      scene.items.forEach((item, i) => {
        const iloc = `${where} items[${i}]`;
        if (!isNonEmptyString(item?.situation)) err(iloc, "situation kosong");
        const ids = validateOptionList(item?.options, iloc);
        validateFeedback(item?.feedback, ids, iloc);
      });
      return null;
    }
    case "penutup":
      if (!isNonEmptyString(scene.quote)) {
        err(where, 'penutup wajib ada "quote" (kutipan penutup)');
      }
      return null;
    default:
      return null; // opening, refleksi_kiai cukup text
  }
}

function validateEpisodes(data) {
  const episodes = Array.isArray(data) ? data : data?.episodes;
  if (!Array.isArray(episodes) || episodes.length === 0) {
    err("root", "file harus berisi array episode atau {episodes: [...]} (min 1)");
    return;
  }
  const epIds = new Set();
  for (const [i, ep] of episodes.entries()) {
    const loc = `episodes[${i}]`;
    if (!ep || typeof ep !== "object") {
      err(loc, "episode harus object");
      continue;
    }
    if (!isNonEmptyString(ep.id)) err(loc, "episode.id kosong");
    if (ep.id && epIds.has(ep.id)) err(loc, `episode id duplikat: "${ep.id}"`);
    epIds.add(ep.id);
    if (!isNonEmptyString(ep.tema)) err(loc, `episode "${ep.id || i}" wajib ada "tema"`);
    if (!Array.isArray(ep.scenes) || ep.scenes.length !== 10) {
      err(loc, `episode "${ep.id || i}" harus tepat 10 scenes, ketemu ${ep.scenes?.length ?? 0}`);
      continue;
    }
    let prevDecisionOptions = null;
    ep.scenes.forEach((s, idx) => {
      const out = validateScene(ep.id || `#${i}`, s, idx, prevDecisionOptions);
      // hanya decision yang menghasilkan options untuk consequence berikut
      prevDecisionOptions = s?.type === "decision" ? out : null;
    });
  }
}

// ---- main ----
const target = process.argv[2];
if (!target) {
  console.error("Pakai: node scripts/validate-episodes.mjs <path-ke-episodes.json>");
  process.exit(2);
}
const full = resolve(process.cwd(), target);
if (!existsSync(full)) {
  console.error(`File tidak ketemu: ${full}`);
  process.exit(2);
}
let data;
try {
  data = JSON.parse(readFileSync(full, "utf8"));
} catch (e) {
  console.error(`JSON tidak valid: ${e.message}`);
  process.exit(2);
}

validateEpisodes(data);

if (errors.length > 0) {
  console.error(`\nGAGAL — ${errors.length} masalah di ${target}:\n`);
  errors.forEach((e) => console.error(`  ${e}`));
  console.error("");
  process.exit(1);
}
const nEp = Array.isArray(data) ? data.length : data.episodes.length;
console.log(`LOLOS — ${nEp} episode x 10 scene valid, semua cabang decision ada feedback-nya.`);
