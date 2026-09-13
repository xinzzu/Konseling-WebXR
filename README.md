# Konseling VR — "Pelajaran Kedamaian bersama Kiai Ahmad Dahlan"

Game konseling berbasis WebXR: **5 episode × 10 scene** materi kedamaian, dengan suara (TTS), dukungan VR (Quest/Pico/emulator iwer), dan **Dashboard Peneliti** untuk memantau data riset.

## Fitur

- **5 episode** materi kedamaian, masing-masing **10 scene** (pembuka → dialog → keputusan → konsekuensi → renungan → refleksi diri → situasimu → penutup) — konten diambil dari backend (`/api/episodes`).
- **Dua mode main**: Website (2D, klik) dan VR immersive (controller/gaze) — satu alur cerita yang sama.
- **Text-to-Speech**: mode `edge` (mp3 on-the-fly, gratis, tanpa key) + fallback Web Speech API; ada waveform suara.
- **Pesan pribadi "dari Kiai"** via OpenRouter LLM (opsional; otomatis jatuh ke pesan statis bila key kosong).
- **Dashboard Peneliti** di `/riset`: login JWT, ringkasan per episode, riwayat jawaban per scene, filter, export CSV.
- **Emulator WebXR** (iwer + DevUI) untuk pengembangan desktop; environment 3D custom (sawah, pantai, hutan, dll).
- Musik latar, skip dicentang manual sesuai brief (tanpa label benar/salah, skor tersembunyi).

## Quick Start

```bash
npm install
npm run dev      # http://localhost:3000
```

Backend harus berjalan dulu (repo `backend/` pada port 3100). Bila API di tempat lain:

```bash
# .env.local
VITE_API_URL=https://be-konseling.vercel.app
```

## Struktur

```
src/
  App.jsx                  # routing game + dashboard (/riset, URL-driven)
  components/
    screens/               # UI 2D: Start, EpisodeSelect, EpisodePlay, EpisodeFinished, ResearchDashboard, dll
    xr/                    # UI 3D: EpisodePlay3D, Button3D, environments, NPC, dll
    ui/                    # ConversationPanel, VoiceWaveform, MockModeBadge
  services/                # dataService, episodeService, ttsService, speechService, researchService, soundService
  store/useGameStore.js    # state game (Zustand)
  hooks/useAudioOwner.js   # satu sumber audio aktif
```

## Flow game

```
Start → Pilih Episode → EpisodePlay (2D / VR) → Finish → Kembali Menu
   │
   └── mode legacy (lingkungan → topik → masalah → cerita) masih ada di store
```

Tombol **"📊 Dashboard Peneliti"** di menu start membuka `#/riset` (atau akses langsung `/riset`).

## Dashboard Peneliti

- Akses: `localhost:3000/riset` (path) atau `#/riset` (hash).
- Login dengan kredensial peneliti (`RESEARCH_USERNAME` / `RESEARCH_PASSWORD` dari backend).
- Isi: kartu ringkasan (sesi, selesai, data jawaban, % selesai), tabel per episode (distribusi skor 0/1/2), riwayat jawaban (filter episode/sesi/tanggal + pencarian lokal), export CSV ringkas & mentah.
- Data dikirim frontend ke `/api/progress`; disimpan backend ke **Postgres Neon** (persisten) atau file JSONL (dev).

## Testing VR

1. **Desktop**: klik tombol "Enter VR" → emulator iwer (Meta Quest 3 device preset) langsung pakai environment custom.
2. **Headset asli** (Quest/Pico): buka URL **HTTPS** (deploy Vercel) atau IP lokal; browser headset harus mendukung WebXR.

## Build

```bash
npm run build        # output dist/
npm run vercel-build # build khusus Vercel (vercel.json sudah set; /riset tidak 404)
```