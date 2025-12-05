/**
 * TTS Service - Handle multiple TTS modes
 * Modes: elevenlabs, webspeech, off
 * 
 * ============================================
 * DEVELOPMENT CONFIG
 * ============================================
 * DEFAULT_TTS_MODE: Mode TTS yang digunakan jika backend tidak kirim config
 * - "elevenlabs" : Gunakan audio dari backend (ElevenLabs)
 * - "webspeech"  : Gunakan Web Speech API browser (gratis, untuk development)
 * - "off"        : Tidak ada audio
 */
const DEFAULT_TTS_MODE = "webspeech"; // Ubah ke "elevenlabs" jika token tersedia

import speechService from "./speechService";

class TTSService {
  constructor() {
    this.currentAudio = null;
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

    // Stop any current playback first
    this.stop();

    switch (mode) {
      case 'elevenlabs':
        return this.playElevenLabs({ audio, onStart, onEnd, onError });
      
      case 'webspeech':
        return this.playWebSpeech({ 
          text: speechText, 
          config: ttsConfig?.webSpeechConfig,
          onStart, 
          onEnd, 
          onError 
        });
      
      case 'off':
      default:
        // No audio - langsung trigger onEnd
        onEnd?.();
        return Promise.resolve();
    }
  }

  /**
   * Play ElevenLabs audio from base64
   */
  playElevenLabs({ audio, onStart, onEnd, onError }) {
    return new Promise((resolve, reject) => {
      if (!audio?.enabled || !audio?.base64) {
        onEnd?.();
        resolve(null);
        return;
      }

      try {
        const audioElement = new Audio(`data:${audio.mimeType};base64,${audio.base64}`);
        this.currentAudio = audioElement;

        audioElement.onplay = () => {
          onStart?.();
        };

        audioElement.onended = () => {
          this.currentAudio = null;
          onEnd?.();
          resolve(audioElement);
        };

        audioElement.onerror = (err) => {
          this.currentAudio = null;
          onError?.(err);
          reject(err);
        };

        audioElement.play().catch((err) => {
          console.warn('ElevenLabs auto-play blocked:', err);
          onError?.(err);
          reject(err);
        });
      } catch (err) {
        onError?.(err);
        reject(err);
      }
    });
  }

  /**
   * Play using Web Speech API via speechService
   */
  playWebSpeech({ text, config, onStart, onEnd, onError }) {
    if (!text) {
      onEnd?.();
      return Promise.resolve();
    }

    // Gunakan speechService yang sudah ada
    return speechService.speak(text, {
      rate: config?.rate ?? 0.95,
      pitch: config?.pitch ?? 1.0,
      volume: config?.volume ?? 1.0,
      onStart,
      onEnd,
    }).catch((err) => {
      console.warn('Web Speech error:', err);
      onError?.(err);
    });
  }

  /**
   * Stop current playback
   */
  stop() {
    // Stop ElevenLabs audio
    if (this.currentAudio) {
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
