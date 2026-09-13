/**
 * Episode Meta — Metadata per episode untuk fitur auto-link:
 * - tema visual environment (EpisodeEnvironment3D)
 * - kartu peran (role card) yang tampil sebelum Adegan 1
 * - lencana peran (santri vs siswa) — dipakai oleh layar 2D & 3D
 *
 * Setting historis diambil dari naskah brief (S1 tiap episode).
 */

export const EPISODE_META = {
  ikhlas: {
    env: "kauman",
    accent: "#D4A017",
    label: "Kauman, Yogyakarta — 1915",
    roleCard:
      "Kauman, 1915. Kamu adalah santri baru di langgar Kauman. Duduklah bersama santri lain, dengarkan biola Kiai, dan rasakan pelajaran yang beliau sampaikan lewat hati.",
    theme: "Biola Kiai & Langgar",
  },
  "rendah-hati": {
    env: "langgar-sore",
    accent: "#7E57C2",
    label: "Kauman, Langgar Kidul — Sore hari",
    roleCard:
      "Kauman, sore hari. Kamu santri Langgar Kidul yang resah karena sebagian santri enggan mengaji. Ikuti Kiai, dan saksikan bagaimana beliau menyikapi perbedaan tanpa kehilangan keyakinan.",
    theme: "Belajar dari Budi Utomo",
  },
  "berpikir-kritis": {
    env: "masjid-malam",
    accent: "#26A69A",
    label: "Masjid Gedhe Kauman — Malam hari",
    roleCard:
      "Masjid Gedhe Kauman, malam hari. Kamu santri yang hadir dalam perdebatan arah kiblat. Saksikan bagaimana para ulama, dipimpin Kiai, mencari kebenaran dengan ilmu dan dialog yang santun.",
    theme: "Perdebatan Arah Kiblat",
  },
  "welas-asih": {
    env: "madrasah-pagi",
    accent: "#EF6C00",
    label: "Kauman — Pagi hari",
    roleCard:
      "Kauman, pagi hari. Kamu santri yang ikut Kiai menata madrasah sederhana, lalu menyusuri gang-gang untuk mencari anak-anak yang belum bersekolah. Kasih sayang bisa dimulai dari tindakan kecil.",
    theme: "Madrasah Ibtidaiyah Diniyah",
  },
  toleransi: {
    env: "beranda",
    accent: "#5C6BC0",
    label: "Beranda rumah Kiai — Kauman",
    roleCard:
      "Beranda rumah Kiai Ahmad Dahlan, sepulang beliau mengajar. Kamu santri yang mendampingi Kiai menghadapi kecaman warga atas pembaruan yang beliau bawa. Mampukah kamu mendengarkan dan menjelaskan dengan sabar?",
    theme: "Menjelaskan dengan Sabar",
  },
};

/** Setting sekolah masa kini — dipakai scene 9 & 10 semua episode. */
export const MODERN_ENV = "modern";

/** Tentukan environment id untuk sebuah scene (auto-link per sceneNo). */
export function environmentForScene(episodeId, sceneNo) {
  const meta = EPISODE_META[episodeId] || EPISODE_META.ikhlas;
  if (sceneNo >= 9) return MODERN_ENV;
  return meta.env;
}

/** Lencana peran — S1-S8 santri, S9-S10 siswa masa kini (keluar peran). */
export function roleBadgeForScene(sceneNo) {
  if (sceneNo >= 9) return "🎒 Kamu: Siswa masa kini";
  if (sceneNo === 0) return "🎭 Kamu: Santri — siap masuk";
  return "🎭 Kamu: Santri";
}

/** Judul singkat progress ("Adegan X/10"), termasuk kartu peran (0). */
export function progressLabelForScene(sceneNo) {
  if (sceneNo === 0) return "Peranmu / 10";
  return `Adegan ${sceneNo} / 10`;
}