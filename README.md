# WebXR Konseling Game

Game konseling berbasis WebXR dengan integrasi LLM (Language Learning Model).

## 🎮 Fitur

- **Mode Website**: Bisa dimainkan langsung di browser
- **Mode VR**: Masuk ke mode immersive VR untuk pengalaman lebih immersive
- **Text-to-Speech**: Respon AI dibacakan dengan voice synthesis
- **Voice Waveform**: Animasi visualisasi suara saat berbicara
- **Topic Selection**: Pilih topik konseling yang diinginkan
- **Interactive Conversation**: Percakapan interaktif dengan pilihan respons

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm atau pnpm

### Installation

```bash
# Masuk ke folder project
cd webxr-game

# Install dependencies
npm install

# Jalankan development server
npm run dev
```

Buka http://localhost:3000 di browser.

### VR Testing

1. Untuk testing VR di desktop, project sudah include `iwer` emulator
2. Klik tombol "Enter VR" untuk masuk mode VR
3. Untuk testing di VR headset sungguhan:
   - Pastikan device dan komputer di network yang sama
   - Akses via IP lokal (misal: http://192.168.1.x:3000)
   - Browser VR headset harus support WebXR

## 📁 Struktur Project

```
webxr-game/
├── public/
│   └── data.json          # Data dummy untuk LLM responses
├── src/
│   ├── main.jsx           # Entry point
│   ├── App.jsx            # Main app component
│   ├── index.css          # Global styles
│   ├── components/
│   │   ├── screens/
│   │   │   ├── StartScreen.jsx      # Layar start
│   │   │   └── TopicSelectScreen.jsx # Layar pilih topik
│   │   ├── ui/
│   │   │   ├── ConversationPanel.jsx # Panel percakapan
│   │   │   └── VoiceWaveform.jsx     # Animasi waveform
│   │   └── xr/
│   │       ├── XRCanvas.jsx    # Canvas 3D + WebXR
│   │       ├── VRButton.jsx    # Tombol masuk VR
│   │       └── MainScene.jsx   # Scene 3D utama
│   ├── services/
│   │   ├── speechService.js   # Text-to-Speech service
│   │   └── dataService.js     # Data/API service
│   └── store/
│       └── useGameStore.js    # Zustand state management
├── package.json
├── vite.config.js
└── README.md
```

## 🎯 Flow Aplikasi

```
┌─────────────┐     ┌──────────────┐     ┌─────────────────┐
│ Start Screen│ --> │ Topic Select │ --> │ Conversation    │
│   (MULAI)   │     │  (3 topik)   │     │ (4x tanya-jawab)│
└─────────────┘     └──────────────┘     └─────────────────┘
                                                  │
                                                  v
                                         ┌─────────────────┐
                                         │    Finished     │
                                         │ (Kembali Menu)  │
                                         └─────────────────┘
```

## 🔧 Customization

### Menambah/Edit Topik

Edit file `public/data.json`:

```json
{
  "topics": [
    {
      "id": "unique-id",
      "label": "Nama Topik",
      "color": "#HexColor",
      "description": "Deskripsi singkat",
      "conversations": [
        { "role": "assistant", "text": "Pesan dari AI" },
        { "role": "user_choice", "options": ["Pilihan 1", "Pilihan 2"] },
        // ... dst
      ]
    }
  ]
}
```

### Menghubungkan ke Backend LLM

Edit `src/services/dataService.js`:

```javascript
// Ganti API_BASE_URL dengan URL backend Anda
const API_BASE_URL = 'https://your-api.com';

// Implementasi sendMessage() untuk komunikasi dengan LLM
export async function sendMessage(topicId, message, sessionId) {
  const response = await fetch(`${API_BASE_URL}/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ topicId, message, sessionId }),
  });
  return await response.json();
}
```

## 🛠️ Tech Stack

- **React 19** - UI Framework
- **Vite** - Build tool
- **Three.js** - 3D graphics
- **@react-three/fiber** - React renderer for Three.js
- **@react-three/xr** - WebXR support
- **@react-three/drei** - Useful helpers
- **Zustand** - State management
- **Web Speech API** - Text-to-Speech
- **iwer** - WebXR emulator untuk development

## 📱 Browser Support

- Chrome 79+ (Desktop & Android)
- Firefox 98+ (Desktop)
- Edge 79+
- Meta Quest Browser
- Pico Browser

## 🚧 TODO

- [ ] Integrasi dengan backend LLM (OpenAI, dll)
- [ ] 3D avatar dengan lip-sync
- [ ] Hand tracking support
- [ ] Spatial audio
- [ ] Save/load session
- [ ] Multi-language support

## 📄 License

MIT
