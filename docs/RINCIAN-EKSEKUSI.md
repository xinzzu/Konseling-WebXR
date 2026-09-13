# RINCIAN EKSEKUSI — Major Update 5 Episode

Sumber: brief 5 episode (paste client) + PDF RIIM Kompetisi 2025 + kontrak
`scripts/validate-episodes.mjs`. Kriteria terima data = `LOLOS`.

## 0. Sumber kebenaran

1. **Brief 5 episode (paste client)** = naskah final. Teks di bawah disalin/dipadatkan
   dari brief tanpa ubah makna.
2. **PDF RIIM Kompetisi 2025** = payung riset (5 nilai, 5 SMK DIY, skala kedamaian
   7 item / 3 aspek harmoni diri-sosial-alam, R&D Borg & Gall 2 tahun, Quest 3).
3. **Kontrak data** = `scripts/validate-episodes.mjs` (tepat 10 scene/episode,
   decision→consequence berurutan, feedback per opsi, questions, transfer items,
   quote).

## 1. Aturan umum semua episode

- `id`: `ikhlas | rendah-hati | berpikir-kritis | welas-asih | toleransi`.
  `subtitle` = tema dari brief.
- S1 `opening`, S2–S4 `dialog` (S2/S3 speaker Kiai/Narator/Sudja, S4 Narator),
  S5 `decision` (4 opsi A–D), S6 `consequence` + `feedback{A,B,C,D}`,
  S7 `refleksi_kiai`, S8 `refleksi_diri` + 3 `questions`,
  S9 `transfer` (5 `items{situation,options,feedback}`), S10 `penutup` + `quote`.
- Micro-pilihan S2 (Ep1 biola, Ep2 respons ke Sudja) = flavor text dialog,
  bukan decision (jatah 10 scene tidak cukup untuk decision kedua).
- Opsi C = sikap yang diteladani ("Kiai tersenyum"). **Tidak ada label
  benar/salah di UI** (konseling reflektif, bukan ujian).
- Skor tersembunyi untuk bahan kesimpulan riset (tidak ditampilkan ke siswa):
  C=2 (selaras), B=1 (sebagian), A/D=0 (kurang selaras), konsisten semua
  episode. Dikirim via `POST /api/progress {sessionId,episodeId,sceneNo,choiceId,score}`.
- Transfer: tiap item 3 opsi (A=kurang selaras, B=sebagian, C=selaras) +
  feedback reflektif per opsi, skor 0/1/2 sama.

## 2. Episode 1 — `ikhlas` / "Berbuat karena Allah, bukan karena pujian."

- S1 opening: Kauman 1915, adzan, santri ke langgar, kamera ke tempat Kiai
  mengajar. Narator: selamat datang, pelajaran untuk dirasakan.
- S2 dialog (Kiai Ahmad Dahlan): main biola, bertanya "Apa yang kalian
  rasakan?" (indah/damai/tenang/nyaman sebagai suasana).
- S3 dialog (Kiai): agama membawa ketenangan seperti musik indah; keindahan
  harus diwujudkan dalam perbuatan.
- S4 dialog (Narator): warga miskin bawa anak sakit; Santri A membantu sambil
  "Semoga Kiai melihat aku"; Santri B diam langsung mengangkat barang;
  Kiai memperhatikan.
- S5 decision: A membantu agar dipuji teman / B agar diperhatikan Kiai /
  C membantu karena iba sesama / D tidak membantu.
- S6 consequence: A/B "Kebaikan yang menunggu pujian akan berhenti ketika
  pujian hilang." / D "Ilmu belum menjadi amal apabila hanya berhenti dalam
  pikiran." / C "Itulah ikhlas. Berbuat karena Allah, bukan karena manusia."
  (tersenyum).
- S7 refleksi_kiai: tidak sibuk menghitung siapa melihat amal; tidak marah
  saat tidak dihargai; keikhlasan awal kedamaian.
- S8 questions: pernah berbuat baik demi pujian? / rasa saat tak dihargai? /
  apa yang dilakukan setelah pelajaran ini?
- S9 transfer (5): bantu teman belajar / bersihkan kelas / kembalikan barang
  hilang / jadi ketua kelompok / bantu korban bullying.
- S10 penutup + quote: "Ilmu tanpa amal tidak sempurna. Amal tanpa ikhlas
  tidak bernilai..." / "Ikhlas adalah fondasi kedamaian..."

## 3. Episode 2 — `rendah-hati` / "Orang berilmu tetap mau belajar dari siapa pun."

- S1 opening: Kauman sore, Langgar Kidul sepi, santri absen karena isu Kiai
  dekat Budi Utomo.
- S2 dialog (Sudja): "Beberapa santri tidak mau datang lagi..." (3 respons
  user = flavor text).
- S3 dialog (Kiai): "Belajar tidak mengenal batas. Selama ada kebaikan, kita
  dapat mengambil pelajaran darinya."
- S4 dialog (Narator): ikuti Kiai ke pertemuan Budi Utomo — amati kelola
  organisasi, musyawarah, hargai pendapat, kerja sama. Datang bukan
  kehilangan keyakinan.
- S5 decision: A tak mau belajar dari yang berbeda / B mau jika sama denganku /
  C mau dari siapa pun selama kebaikan / D ejek kelompok lain.
- S6: A/B "Kesombongan sering membuat seseorang berhenti belajar." /
  D "Merendahkan orang lain tidak akan membuat ilmu bertambah." /
  C tersenyum + pujian rendah hati.
- S7: ilmu cahaya dari banyak jalan; jangan nilai dari kelompok; ambil hikmah
  di mana pun; makin berilmu makin rendah hati.
- S8: pernah tolak pendapat karena tak suka? / merasa selalu paling benar? /
  rendah hati damai kan hubungan?
- S9 (5): diskusi beda pendapat / belajar dari yang nilainya baik / organisasi
  beragam / dengar kritik guru / akui kesalahan.
- S10: "Orang rendah hati tidak kehilangan kehormatan saat belajar..." /
  "Rendah hati adalah keberanian untuk terus belajar..."

## 4. Episode 3 — `berpikir-kritis` / "Mencari kebenaran dengan ilmu, bukti, dan dialog yang santun."

- S1 opening: Masjid Gedhe Kauman malam, ulama + kitab/naskah, bahas arah kiblat.
- S2 dialog (Ulama): "Kiblat bukan persoalan arah, melainkan hati." Sebagian setuju.
- S3 dialog (Kiai): "Saya tidak akan membantah..." lalu bertanya: mengapa Allah
  tetapkan Ka'bah? mengapa kiblat pindah dari Aqsa? (ajak berpikir, bukan
  serang orang).
- S4 dialog (Narator): buka kitab, peta, kompas, astronomi sederhana. Kritis =
  cari bukti agar yakin makin kuat.
- S5 decision: A ikut mayoritas tanpa berpikir / B tolak semua pendapat /
  C cari bukti lalu sampaikan sopan / D ejek yang beda.
- S6: A "Banyaknya orang percaya belum tentu ukuran kebenaran." /
  B "ditimbang dengan ilmu." / D "dialog santun, bukan ejekan." /
  C tersenyum + pujian.
- S7: Allah beri akal untuk berpikir; jangan terima karena banyak yang bilang;
  jangan tolak karena dari yang beda; cari bukti lalu putuskan bijaksana.
- S8: pernah percaya info tanpa cek? / berani bertanya? / beda pendapat tanpa
  ribut caranya?
- S9 (5): berita medsos tanpa cek sumber / diskusi beda pendapat / tugas
  multi-referensi / isu viral sekolah / kritik sopan ke teman.
- S10: "Bertanyalah untuk memahami, bukan menjatuhkan..." /
  "Berpikir kritis adalah keberanian mencari kebenaran..."

## 5. Episode 4 — `welas-asih` / "Kasih sayang diwujudkan melalui tindakan yang memberi manfaat."

- S1 opening: Kauman pagi, rumah sederhana, Kiai susun 3 meja + kursi + papan
  tulis. Bukan soal bangunan, tapi kasih sayang.
- S2 dialog: santri heran ("sekolah?"), Kiai: Madrasah Ibtidaiyah Diniyah agar
  pendidikan mudah diakses.
- S3 dialog (Kiai): "Masih banyak anak Kauman belum bersekolah. Mari kita
  mencari mereka."
- S4 dialog (Narator): susuri gang; anak bantu ortu kerja / tak mampu beli alat /
  merasa tak pintar / malu belum sekolah. Mereka butuh kesempatan, bukan belas
  kasihan.
- S5 decision: anak "Aku ingin belajar... tapi tak punya biaya." A abaikan bukan
  urusanku / B sekolah hanya untuk tertentu / C ajak ke madrasah, tiap anak
  berhak belajar / D tertawakan.
- S6: A "Ketika mampu membantu tapi diam, kesempatan menebar kebaikan ikut
  hilang." / B/D "Kasih sayang tidak memilih siapa yang layak ditolong." /
  C tersenyum + pujian.
- S7: ilmu bukan untuk yang mampu; cahaya untuk tiap anak; kasih = tindakan
  berharapan; makin bermanfaat makin welas asih.
- S8: pernah abai teman butuh? / rasa saat dibantu? / tindakan sederhana apa?
- S9 (5): ajak yang menyendiri / bantu tertinggal / donasi musibah / dampingi
  korban rundung / bagi alat tulis.
- S10: "Kasih sejati menggerakkan tangan, pikiran, hati..." /
  "Welas asih adalah keberanian peduli..."

## 6. Episode 5 — `toleransi` / "Menghargai perbedaan tanpa kehilangan keyakinan."

- S1 opening: beranda rumah Kiai sepulang mengajar; Nyai + keluarga cemas;
  Kauman ramai soal pembaruan.
- S2 dialog: Nyai sedih; warga "Kiai sudah menyimpang / mengapa ubah kebiasaan
  lama"; bisik + sinis; tegang.
- S3 dialog (Kiai): tenang, "Tugas kita bukan membenci, tapi menjelaskan dengan
  sabar." Pembaruan agar Islam mudah dipahami, bukan rendahkan tradisi.
- S4 dialog (Narator): dialog dengan tokoh masyarakat; Kiai dengar sampai
  selesai tanpa memotong, jawab santun. Toleransi = tetap hormat meski beda.
- S5 decision: "Kalau ada yang beda pendapat, apa yang kau lakukan?"
  A ejek + putus hubungan / B paksa semua ikut aku / C dengar lalu sampaikan
  sopan / D sebar kebencian.
- S6: A "Ejekan memperbesar permusuhan." / B "Kebenaran tidak tumbuh lewat
  paksaan." / D "Kebencian melahirkan kebencian baru." / C tersenyum + pujian.
- S7: perbedaan bagian hidup; boleh beda cara pikir, jangan hilang hormat;
  jelaskan berilmu; jawab benci dengan akhlak; damai lahir saat berdampingan.
- S8: sikap saat teman beda? / mau dengar dulu? / jaga persahabatan beda
  pandangan?
- S9 (5): diskusi beda pendapat / kelompok beragam / hargai latar beda / tolak
  ajakan mengejek / musyawarah selesaikan konflik.
- S10: "Perbedaan tidak harus memisahkan..." /
  "Toleransi adalah kemampuan menghargai perbedaan..."

## 7. LLM via OpenRouter gratis (sudah direalisasikan)

- **Master prompt persona sudah ditune**: `backend/src/ai/master-prompt.js`
  (Kiai Ahmad Dahlan sebagai **konselor bijak** — hangat, santun, tidak
  menghakimi, tanpa menyebut benar/salah/skor, bahasa Indonesia dekat remaja,
  1–3 kalimat + sesekali pertanyaan reflektif, boleh singgung kisah Kauman/
  langgar/biola, tanda bahaya → arahkan ke guru BK). Ada fallback statis.
- **Endpoint**: `POST /api/ai/kiai` → `{ fallback, reply }`. Body opsional:
  `{ episodeId, tema, decisionLabel, transferLabels }` — dikirim FE dari
  ringkasan pilihan siswa (2D: `EpisodeFinishedScreen.jsx`, VR:
  `EpisodeFinished3D.jsx`, tombol "🌾 Pesan Pribadi dari Kiai").
- **Respon disuarakan**: teks LLM Kiai otomatis dibacakan via Edge TTS
  (`/api/tts/speak`) di layar 2D maupun VR, dengan tombol
  🔊 Putar / ⏹ Hentikan Suara dan status "Menyiapkan suara…".
  Fallback statis bila tanpa hasil.
- Klien `backend/src/services/llm.service.js` (fetch ke
  `openrouter.ai/api/v1/chat/completions`, retry 1× saat 5xx, timeout 45s,
  tanpa key → fallback statis, tidak pernah mengganggu alur episode inti).
- Default model (`OPENROUTER_MODEL` di `.env`): **`nvidia/nemotron-3-super-120b-a12b:free`** —
  dipilih setelah uji live (nemotron-3-ultra:free sering 502 overloaded;
  gemma-4-31b & lightning :free gagal/bocor reasoning).
- Daftar gratis bisa berubah — cek `GET https://openrouter.ai/api/v1/models`
  filter `pricing.prompt == 0`. Key dari client via env, tidak pernah di-commit.
- Alur episode inti tetap 100% statis — LLM opsional dan additive.

## 8. Kontrak API + lingkungan + UX (ringkas)

- `GET /api/episodes` (pilih), `GET /api/episodes/:id` (main),
  `POST /api/progress` tiap S5 + tiap item S9 (+ S8 opsional),
  `GET /api/tts/config`, `POST /api/tts/speak` (Edge TTS: `{text}` → mp3
  base64, on-the-fly, tanpa file di project), `POST /api/ai/kiai` (LLM opsional).
- **Riset**: `GET /api/research/summary` (agregat), `GET /api/research/data`
  (baris ter-enrich), `GET /api/research/export.csv` (unduh CSV BOM-Excel;
  `?raw=1` kolom lengkap, filter `episodeId/sessionId/from/to`). Opsional
  proteksi via env `RESEARCH_TOKEN` (header `x-research-token`).
  Sumber data saat ini `data/sessions/sessions.jsonl` (append-only);
  keputusan 2026-09: tetap JSONL, cadangan Neon (Postgres) bila perlu skala/deploy.
- Setting auto-link prosedural (id scene dari `episodeMeta.js`): `kauman`
  (Ep1) / `langgar-sore` (Ep2) / `masjid-malam` (Ep3) / `madrasah-pagi` (Ep4) /
  `beranda` (Ep5) untuk S1–S8, dan `modern` (sekolah masa kini) untuk S9–S10.
  Ganti otomatis per sceneNo. Environment lama pensiun dari pilihan.
- UX: Start → Pilih Episode → Kartu Peran ("kamu santri...") → S1–S4 Lanjut →
  S5 pilih → S6 respons Kiai → S7–S8 refleksi → S9 tutup peran
  ("kembali jadi siswa") + 5 situasi → S10 quote → Selesai
  (pesan Kiai berbunyi / ulangi / episode lain / menu). Lencana peran 🎭/🎒 +
  progress X/10 + tombol Lewati audio di semua layar (2D & 3D). Frontend:
  adapter ganda — flow real via `episodeService.js` (backend episode di
  `http://localhost:3100`), dan tombol "🧪 MODE MOCKUP (Dummy)" untuk demo
  tanpa backend memakai flow legacy `/chat` (fake LLM lokal, tetap ada).

## 9. Kriteria terima + backlog

- Terima: `node scripts/validate-episodes.mjs data/episodes.json` → `LOLOS`;
  playtest 5×10 scene browser + 1x VR; tidak ada label benar/salah di UI;
  S9 selalu tutup peran.
- Backlog fase 2: skala kedamaian pre/post 7 item (3 aspek), hapus flow `/chat`
  lama (rewrite bersih), upgrade visual GLB/360 bila diminta.
