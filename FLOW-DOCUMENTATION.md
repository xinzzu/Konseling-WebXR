# Flow Documentation - Konseling VR App

## Overview

Aplikasi konseling VR berbasis cerita Kiai Ahmad Dahlan untuk siswa SMA. Menggunakan teknik relaksasi dan storytelling untuk membantu siswa mengatasi masalah.

---

## Backend Structure (Updated)

```
webxr-be/
├── src/
│   ├── app.js          # Main server & routes
│   ├── tts.js          # ElevenLabs TTS service
│   ├── groqClient.js   # Groq AI client
│   ├── stories.js      # (legacy)
│   └── topics.js       # (legacy)
├── prompts/
│   ├── greetingprompt.js      # Prompt untuk greeting
│   ├── optionsprompt.js       # Prompt untuk spoken options
│   ├── storyprompt.js         # Prompt untuk generate story
│   └── optionrewriteprompt.js # Prompt untuk rewrite options dengan AI
├── data/
│   ├── topics.js       # Data topics & problems
│   └── basestories.js  # Base stories Kiai Dahlan
└── package.json
```

---

## TTS Configuration (Global)

Backend sekarang support 3 mode TTS:

| Mode | Description |
|------|-------------|
| `elevenlabs` | Backend generate audio via ElevenLabs API (default) |
| `webspeech` | Backend kirim text, frontend pakai Web Speech API |
| `off` | Tidak ada audio, hanya text |

**Get TTS Config:**
```http
GET /tts/config
```

**Update TTS Config:**
```http
POST /tts/config
{
  "mode": "webspeech",
  "webSpeechConfig": {
    "lang": "id-ID",
    "rate": 0.95,
    "pitch": 1.0,
    "volume": 1.0
  }
}
```

---

## Backend Flow (State Machine)

Backend menggunakan state machine dengan 4 state utama:

```
┌─────────────┐
│   START     │
└──────┬──────┘
       │ POST /chat (state: "greeting")
       ▼
┌─────────────────┐
│ IDENTIFY_TOPIC  │ ◄─── User belum pilih topic / topic invalid
│                 │
│ Response:       │
│ - 3 topic options│
│ - Greeting msg  │
│ - Audio TTS     │
└──────┬──────────┘
       │ POST /chat (state: "identify_topic", payload: {topicId})
       ▼
┌────────────────────┐
│ COLLECTING_PROBLEM │ ◄─── Loop 3x (round 1, 2, 3)
│                    │
│ Response:          │
│ - Problem options  │
│ - Round number     │
│ - Message + Audio  │
└──────┬─────────────┘
       │ POST /chat (state: "collecting_problem", payload: {problemId})
       │ (setelah 3 problem dipilih)
       ▼
┌─────────────┐
│   STORY     │
│             │
│ Response:   │
│ - storyText │
│ - Audio TTS │
└─────────────┘
```

---

## State Details

### 1. GREETING → IDENTIFY_TOPIC

**Request:**
```json
{
  "sessionId": null,
  "state": "greeting"
}
```

**Response:**
```json
{
  "sessionId": "uuid-xxx",
  "currentState": "identify_topic",
  "type": "topic_selection",
  "message": "Assalamualaikum... (greeting dari AI)",
  "speechText": "...",
  "options": [
    { "id": "diri", "label": "Damai dengan Diri", "description": "..." },
    { "id": "sosial", "label": "Damai dengan Sosial", "description": "..." },
    { "id": "alam", "label": "Damai dengan Alam", "description": "..." }
  ],
  "audio": {
    "enabled": true,
    "mimeType": "audio/mpeg",
    "base64": "..."
  }
}
```

---

### 2. IDENTIFY_TOPIC → COLLECTING_PROBLEM

**Request:**
```json
{
  "sessionId": "uuid-xxx",
  "state": "identify_topic",
  "payload": { "topicId": "diri" }
}
```

**Response:**
```json
{
  "sessionId": "uuid-xxx",
  "currentState": "collecting_problem",
  "type": "problem_selection",
  "round": 1,
  "message": "...(AI menjelaskan pilihan masalah)...",
  "speechText": "...",
  "options": [
    { "id": "tekanan_kecemasan_akademik", "label": "Tekanan dan kecemasan akademik", "description": "..." },
    { "id": "krisis_identitas_arah_hidup", "label": "Krisis identitas dan arah hidup", "description": "..." },
    ...
  ],
  "audio": { "enabled": true, "mimeType": "audio/mpeg", "base64": "..." }
}
```

---

### 3. COLLECTING_PROBLEM (Round 1-3)

User memilih 3 masalah secara bertahap. Setiap round, options yang sudah dipilih akan di-filter.

**Request (Round 1, 2, 3):**
```json
{
  "sessionId": "uuid-xxx",
  "state": "collecting_problem",
  "payload": { "problemId": "tekanan_kecemasan_akademik" }
}
```

**Response Round 1-2:** (lanjut ke round berikutnya)
```json
{
  "currentState": "collecting_problem",
  "round": 2,
  "options": [...remaining problems...],
  ...
}
```

**Response Round 3:** (setelah 3 problem dipilih → ke STORY)
```json
{
  "currentState": "story",
  "type": "story",
  "storyText": "...(cerita personalized dari AI)...",
  "baseStoryMeta": { "id": "biola_ikhlas", "title": "Biola Kiai Dahlan..." },
  "selectedProblems": [...3 problems yang dipilih...],
  "audio": { "enabled": true, "mimeType": "audio/mpeg", "base64": "..." }
}
```

---

### 4. RESTART_SESSION

Untuk mengulang sesi dengan topik yang sama atau baru.

**Request:**
```json
{
  "sessionId": "uuid-xxx",
  "state": "restart_session",
  "payload": { "keepTopic": true }
}
```

- `keepTopic: true` → kembali ke COLLECTING_PROBLEM dengan topik sama
- `keepTopic: false` → kembali ke GREETING (mulai dari awal)

---

## Topics & Problems Data

### Topic: Diri (diri)
| Problem ID | Label |
|------------|-------|
| tekanan_kecemasan_akademik | Tekanan dan kecemasan akademik |
| krisis_identitas_arah_hidup | Krisis identitas dan arah hidup |
| kesehatan_mental_belum_tertangani | Kesehatan mental yang belum tertangani |
| paparan_media_sosial | Paparan media sosial |
| kehilangan_spiritualitas | Kehilangan spiritualitas |

### Topic: Sosial (sosial)
| Problem ID | Label |
|------------|-------|
| intoleransi_stereotip | Intoleransi dan stereotip |
| bullying_perundungan_digital | Bullying dan perundungan digital |
| kurang_empati_komunikasi | Kurangnya empati dan komunikasi sehat |
| kesenjangan_sosial_ekonomi | Kesenjangan sosial dan ekonomi |
| budaya_kompetitif_ego | Budaya kompetitif dan egosentris |

### Topic: Alam (alam)
| Problem ID | Label |
|------------|-------|
| rendah_kesadaran_ekologis | Menurunnya kesadaran ekologis |
| konsumtivisme_tidak_ramah_lingkungan | Konsumtivisme dan perilaku tidak ramah lingkungan |
| minim_praktik_cinta_lingkungan | Minimnya praktik cinta lingkungan di sekolah |
| urbanisasi_alienasi_alam | Urbanisasi dan alienasi dari alam |

---

## Base Stories (Cerita Kiai Dahlan)

| Topic | Story ID | Title |
|-------|----------|-------|
| diri | biola_ikhlas | Biola Kiai Dahlan Memberi Jawaban (Ikhlas) |
| sosial | budi_utomo | Belajar dari Budi Utomo (Rendah Hati) |
| alam | madrasah_welas_asih | Mendirikan Madrasah Ibtidaiyah Diniyah (Welas Asih) |

---

## Audio (TTS)

Backend sekarang support multiple TTS modes. Response selalu include `tts` config:

**Response format:**
```json
{
  "tts": {
    "mode": "elevenlabs",
    "webSpeechConfig": {
      "lang": "id-ID",
      "rate": 0.95,
      "pitch": 1.0,
      "volume": 1.0
    }
  },
  "audio": {
    "enabled": true,
    "mimeType": "audio/mpeg",
    "base64": "...base64 encoded MP3..."
  }
}
```

**Frontend handling berdasarkan mode:**
- `elevenlabs`: Play audio dari `audio.base64`
- `webspeech`: Gunakan Web Speech API dengan `speechText` dan `webSpeechConfig`
- `off`: Tidak ada audio

**Environment Variables (Backend):**
```
ELEVENLABS_API_KEY=your_api_key
ELEVENLABS_VOICE_ID=your_voice_id
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
DEFAULT_TTS_MODE=elevenlabs
```

---

## Frontend Flow Mapping

| Backend State | Frontend gameState | Screen Component |
|---------------|-------------------|------------------|
| - | start | StartScreen |
| - | environment_select | EnvironmentSelectScreen |
| identify_topic | topic_select | TopicSelectScreen / TopicSelect3D |
| collecting_problem | problem_select | ProblemSelectScreen / ProblemSelect3D |
| story | story | StoryScreen / Story3D |
| - | conversation | ConversationPanel / Conversation3D |
| - | finished | ConversationPanel / Conversation3D |

---

## API Endpoint

**Base URL:** `https://webxr-be.vercel.app`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Health check |
| POST | /chat | Main chat endpoint (state machine) |

---

## Sequence Diagram

```
User          Frontend              Backend
  │               │                    │
  │ Click Start   │                    │
  │──────────────>│                    │
  │               │ setGameState       │
  │               │ ('environment')    │
  │               │                    │
  │ Select Env    │                    │
  │──────────────>│                    │
  │               │ POST /chat         │
  │               │ (greeting)         │
  │               │───────────────────>│
  │               │                    │ Generate greeting
  │               │                    │ + TTS audio
  │               │<───────────────────│
  │               │ handleBackendResponse
  │               │ gameState='topic_select'
  │               │                    │
  │ Select Topic  │                    │
  │──────────────>│                    │
  │               │ POST /chat         │
  │               │ (identify_topic)   │
  │               │───────────────────>│
  │               │                    │ Validate topic
  │               │                    │ + Generate problems
  │               │<───────────────────│
  │               │ gameState='problem_select'
  │               │                    │
  │ Select Problem│                    │
  │ (3x)          │                    │
  │──────────────>│ POST /chat         │
  │               │ (collecting_problem)│
  │               │───────────────────>│
  │               │                    │ After 3 problems:
  │               │                    │ Generate story
  │               │<───────────────────│
  │               │ gameState='story'  │
  │               │                    │
  │ View Story    │                    │
  │<──────────────│                    │
```


---

## Session Management (Admin)

**Delete single session:**
```http
DELETE /sessions/:sessionId
```

**Delete all sessions:**
```http
DELETE /sessions?all=true
```

---

## AI Features

### 1. AI Rewrite Options
Setiap options (topic/problem) di-rewrite oleh AI supaya lebih natural dan hangat. ID tetap sama, hanya label dan description yang di-rewrite.

### 2. Dynamic Greeting
Greeting message di-generate oleh AI setiap sesi baru, bukan hardcoded.

### 3. Spoken Options Prompt
AI generate teks yang akan dibacakan untuk menjelaskan pilihan-pilihan yang tersedia.

### 4. Personalized Story
Cerita di-generate berdasarkan:
- Base story (sesuai topic)
- 3 masalah yang dipilih user
- AI menggabungkan dan mempersonalisasi cerita

---

## Response Structure

Setiap response dari `/chat` memiliki struktur:

```json
{
  "sessionId": "uuid",
  "currentState": "identify_topic | collecting_problem | story",
  "type": "topic_selection | problem_selection | story",
  "message": "...",
  "speechText": "...",
  "options": [...],  // hanya untuk selection states
  "round": 1,        // hanya untuk collecting_problem
  "storyText": "...", // hanya untuk story state
  "baseStoryMeta": {...}, // hanya untuk story state
  "selectedProblems": [...], // hanya untuk story state
  "tts": {
    "mode": "elevenlabs | webspeech | off",
    "webSpeechConfig": {...}
  },
  "audio": {
    "enabled": true/false,
    "mimeType": "audio/mpeg",
    "base64": "..."
  }
}
```


---

## Frontend TTS Service

Frontend sekarang menggunakan `ttsService.js` untuk handle semua TTS modes:

```javascript
import ttsService from '../../services/ttsService';

// Play audio
ttsService.play({
  ttsConfig,      // dari store (response.tts)
  audio,          // dari store (response.audio)
  speechText,     // text untuk webspeech mode
  onStart: () => {},
  onEnd: () => {},
  onError: (err) => {},
});

// Stop audio
ttsService.stop();

// Check if playing
ttsService.isPlaying();
```

**Supported modes:**
- `elevenlabs`: Play base64 audio dari backend
- `webspeech`: Gunakan browser Web Speech API
- `off`: Tidak ada audio

---

## Updated Components

Components yang sudah di-update untuk support multi-mode TTS:

| Component | Type | TTS Support |
|-----------|------|-------------|
| TopicSelect3D | 3D/VR | ✅ |
| TopicSelectScreen | 2D | ✅ |
| ProblemSelect3D | 3D/VR | ✅ |
| Story3D | 3D/VR | ✅ |


---

## Development Config - Options Display Mode

Di `TopicSelect3D.jsx` dan `ProblemSelect3D.jsx` ada config untuk mengatur kapan pilihan muncul:

```javascript
/**
 * OPTIONS_DISPLAY_MODE:
 * - "instant"     : Pilihan langsung muncul (untuk development/testing cepat)
 * - "after_audio" : Pilihan muncul setelah audio selesai (production)
 * - "delayed"     : Pilihan muncul setelah delay tertentu (DELAY_MS)
 */
const OPTIONS_DISPLAY_MODE = "after_audio"; // Ubah sesuai kebutuhan
const DELAY_MS = 3000; // Delay dalam ms jika mode "delayed"
```

**Cara mengubah:**
1. Buka file `src/components/xr/TopicSelect3D.jsx` atau `ProblemSelect3D.jsx`
2. Cari `OPTIONS_DISPLAY_MODE` di bagian atas file
3. Ubah nilai sesuai kebutuhan:
   - `"instant"` - untuk testing cepat tanpa tunggu audio
   - `"after_audio"` - untuk production (default)
   - `"delayed"` - untuk delay custom (atur `DELAY_MS`)

**Fitur tambahan:**
- Tombol "⏭️ Lewati" untuk skip audio dan langsung tampilkan pilihan
- Indikator "🎧 Mendengarkan..." saat audio sedang diputar
