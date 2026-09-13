/**
 * TTS Service - Handle multiple TTS modes
 * Modes: edge, elevenlabs, webspeech, off
 * 
 * ============================================
 * DEVELOPMENT CONFIG
 * ============================================
 * DEFAULT_TTS_MODE: Mode TTS yang digunakan jika backend tidak kirim config
 * - "edge"       : Sintesis on-the-fly di backend (Edge TTS, mp3 base64, gratis, tanpa key)
 * - "elevenlabs" : Gunakan audio dari backend (ElevenLabs)
 * - "webspeech"  : Gunakan Web Speech API browser (gratis, untuk development/fallback)
 * - "off"        : Tidak ada audio
 */
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3100";
const DEFAULT_TTS_MODE = "webspeech"; // fallback bersuara lokal bila backend tidak ada

import speechService from "./speechService";

class TTSService {
  constructor() {
    this.currentAudio = null;
    this.edgeCache = new Map(); // cache teks -> base64 (teks sama tidak di-sintesis ulang)
    // Token generasi: setiap play()/stop() menaikkannya. Callback async yang
    // gen-nya sudah basi tidak boleh menyalakan suara atau memanggil onEnd —
    // ini mencegah race condition (mis. 2D & 3D memutar teks yang sama).
    this.gen = 0;
  }

  /**
   * Play audio based on TTS config from backend
   * @param {object} params
   * @param {object} params.ttsConfig - { mode, webSpeechConfig }
   * @param {object} params.audio - { enabled, mimeType, base64 }
   * @param {string} params.speechText - Text to speak (for webspeech mode)
   * @param {function} params.onStart - Callback when audio starts
   * @param {function} params.onEnd - Callback when audio ends
   * @param {function} params.onError - Callback on error
   */
  play({ ttsConfig, audio, speechText, onStart, onEnd, onError }) {
    // Gunakan mode dari backend, atau fallback ke DEFAULT_TTS_MODE
    let mode = ttsConfig?.mode || DEFAULT_TTS_MODE;
    
    // Jika mode elevenlabs tapi audio tidak tersedia, fallback ke webspeech
    if (mode === 'elevenlabs' && (!audio?.enabled || !audio?.base64)) {
      console.log('TTS: ElevenLabs audio not available, falling back to webspeech');
      mode = 'webspeech';
    }

    // Stop any current playback first, lalu ambil generasi baru.
    this.stop();
    const gen = this.gen;

    switch (mode) {
      case 'edge':
        return this.playEdge({ text: speechText, onStart, onEnd, onError, gen });

      case 'elevenlabs':
        return this.playElevenLabs({ audio, onStart, onEnd, onError, gen });
      
      case 'webspeech':
        return this.playWebSpeech({ 
          text: speechText, 
          config: ttsConfig?.webSpeechConfig,
          onStart, 
          onEnd, 
          onError,
          gen,
        });
      
      case 'off':
      default:
        // No audio - langsung trigger onEnd
        onEnd?.();
        return Promise.resolve();
    }
  }

  /**
   * Fellback: panggil backend sintesis (Edge TTS) → putar mp3 base64.
   * Tidak ada file audio yang disimpan — semuanya di memori & dibuang setelah selesai.
   * Bila backend tidak bisa, otomatis jatuh ke Web Speech (offline-safe).
   */
  playEdge({ text, onStart, onEnd, onError, gen }) {
    if (!text) {
      onEnd?.();
      return Promise.resolve();
    }
    // Sudah basi sejak awal (mis. pemilik audio berganti) — jangan sentuh apa pun.
    if (gen !== undefined && gen !== this.gen) return Promise.resolve();

    return this.getEdgeSpeech(text)
      .then((base64) => {
        // Superseded saat menunggu sintesis: batalkan total.
        if (gen !== undefined && gen !== this.gen) return;
        return new Promise((resolve) => {
          const audioElement = new Audio(`data:audio/mpeg;base64,${base64}`);
          this.currentAudio = audioElement;

          audioElement.onplay = () => {
            if (gen === undefined || gen === this.gen) onStart?.();
          };
          audioElement.onended = () => {
            if (this.currentAudio === audioElement) this.currentAudio = null;
            if (gen === undefined || gen === this.gen) onEnd?.();
            resolve(audioElement);
          };
          audioElement.onerror = (err) => {
            if (this.currentAudio === audioElement) this.currentAudio = null;
            if (gen === undefined || gen === this.gen) onError?.(err);
            resolve(audioElement);
          };

          audioElement.play().catch((err) => {
            if (gen === undefined || gen === this.gen) {
              console.warn('Edge TTS auto-play blocked:', err);
              onError?.(err);
            }
            resolve(audioElement);
          });
        });
      })
      .catch((err) => {
        if (gen !== undefined && gen !== this.gen) return;
        console.warn('Edge TTS gagal, fallback webspeech:', err);
        this.currentAudio = null;
        onError?.(err);
        return this.playWebSpeech({ text, onStart, onEnd, onError, gen });
      });
  }

  /**
   * Minta audio base64 ke POST /api/tts/speak, dengan cache per teks.
   */
  async getEdgeSpeech(text) {
    const cached = this.edgeCache.get(text);
    if (cached) return cached;

    const res = await fetch(`${API_BASE}/api/tts/speak`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) throw new Error(`tts speak ${res.status}`);
    const data = await res.json();
    if (!data?.base64) throw new Error("tts tanpa audio");

    this.edgeCache.set(text, data.base64);
    const size = this.edgeCache.size;
    if (size % 40 === 0) {
      this.edgeCache.clear(); // biar ramai tak membengkak (50 scene x ~5 teks)
    }
    return data.base64;
  }

  /**
   * Play ElevenLabs audio from base64
   */
  playElevenLabs({ audio, onStart, onEnd, onError, gen }) {
    return new Promise((resolve) => {
      if (!audio?.enabled || !audio?.base64) {
        onEnd?.();
        resolve(null);
        return;
      }
      if (gen !== undefined && gen !== this.gen) {
        resolve(null);
        return;
      }

      try {
        const audioElement = new Audio(`data:${audio.mimeType};base64,${audio.base64}`);
        this.currentAudio = audioElement;

        audioElement.onplay = () => {
          if (gen === undefined || gen === this.gen) onStart?.();
        };

        audioElement.onended = () => {
          if (this.currentAudio === audioElement) this.currentAudio = null;
          if (gen === undefined || gen === this.gen) onEnd?.();
          resolve(audioElement);
        };

        audioElement.onerror = (err) => {
          if (this.currentAudio === audioElement) this.currentAudio = null;
          if (gen === undefined || gen === this.gen) onError?.(err);
          resolve(audioElement);
        };

        audioElement.play().catch((err) => {
          if (gen === undefined || gen === this.gen) {
            console.warn('ElevenLabs auto-play blocked:', err);
            onError?.(err);
          }
          resolve(audioElement);
        });
      } catch (err) {
        if (gen === undefined || gen === this.gen) onError?.(err);
        resolve(null);
      }
    });
  }

  /**
   * Play using Web Speech API via speechService
   */
  playWebSpeech({ text, config, onStart, onEnd, onError, gen }) {
    if (!text) {
      onEnd?.();
      return Promise.resolve();
    }
    if (gen !== undefined && gen !== this.gen) return Promise.resolve();

    const guard = (fn) => (...args) => {
      if (gen === undefined || gen === this.gen) fn?.(...args);
    };

    // Gunakan speechService yang sudah ada
    return speechService.speak(text, {
      rate: config?.rate ?? 0.95,
      pitch: config?.pitch ?? 1.0,
      volume: config?.volume ?? 1.0,
      onStart: guard(onStart),
      onEnd: guard(onEnd),
    }).catch((err) => {
      if (gen === undefined || gen === this.gen) {
        console.warn('Web Speech error:', err);
        onError?.(err);
      }
    });
  }

  /**
   * Stop current playback
   */
  stop() {
    // Batalkan semua callback async yang masih menggantung.
    this.gen++;

    if (this.currentAudio) {
      this.currentAudio.onplay = null;
      this.currentAudio.onended = null;
      this.currentAudio.onerror = null;
      this.currentAudio.pause();
      this.currentAudio.currentTime = 0;
      this.currentAudio = null;
    }

    // Stop Web Speech via speechService
    speechService.stop();
  }

  /**
   * Check if currently playing
   */
  isPlaying() {
    if (this.currentAudio && !this.currentAudio.paused) {
      return true;
    }
    return speechService.isSpeaking();
  }

  /**
   * Pause current playback
   */
  pause() {
    if (this.currentAudio) {
      this.currentAudio.pause();
    }
    // Web Speech API doesn't have good pause support
  }

  /**
   * Resume paused playback
   */
  resume() {
    if (this.currentAudio && this.currentAudio.paused) {
      this.currentAudio.play();
    }
  }
}

// Singleton instance
const ttsService = new TTSService();
export default ttsService;
