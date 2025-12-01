/**
 * Speech Service - Text-to-Speech dengan Web Speech API
 * Support untuk speech synthesis dan audio visualization
 */

class SpeechService {
  constructor() {
    this.synth = typeof window !== 'undefined' ? window.speechSynthesis : null;
    this.voices = [];
    this.currentUtterance = null;
    this.audioContext = null;
    this.analyser = null;
    this.onSpeakingChange = null;
    this.onAudioData = null;
    
    // Load voices
    this.loadVoices();
  }

  loadVoices() {
    if (!this.synth) return;
    
    const setVoices = () => {
      this.voices = this.synth.getVoices();
    };
    
    setVoices();
    
    if (this.synth.onvoiceschanged !== undefined) {
      this.synth.onvoiceschanged = setVoices;
    }
  }

  getVoices() {
    return this.voices;
  }

  // Get Indonesian voice or fallback
  getPreferredVoice() {
    // Prefer Indonesian voice
    let voice = this.voices.find(v => v.lang.includes('id') || v.lang.includes('ID'));
    
    // Fallback to English
    if (!voice) {
      voice = this.voices.find(v => v.lang.includes('en'));
    }
    
    return voice || this.voices[0];
  }

  /**
   * Speak text with optional callbacks
   * @param {string} text - Text to speak
   * @param {object} options - { rate, pitch, volume, onStart, onEnd, onBoundary }
   */
  speak(text, options = {}) {
    if (!this.synth || !text) return Promise.resolve();
    
    return new Promise((resolve, reject) => {
      // Cancel any ongoing speech
      this.stop();
      
      const utterance = new SpeechSynthesisUtterance(text);
      
      // Set voice
      const voice = options.voice || this.getPreferredVoice();
      if (voice) utterance.voice = voice;
      
      // Set properties
      utterance.rate = options.rate ?? 0.9;
      utterance.pitch = options.pitch ?? 1;
      utterance.volume = options.volume ?? 1;
      
      // Event handlers
      utterance.onstart = () => {
        if (this.onSpeakingChange) this.onSpeakingChange(true);
        if (options.onStart) options.onStart();
        this.startFakeAnalyzer();
      };
      
      utterance.onend = () => {
        if (this.onSpeakingChange) this.onSpeakingChange(false);
        if (options.onEnd) options.onEnd();
        this.stopFakeAnalyzer();
        resolve();
      };
      
      utterance.onerror = (event) => {
        if (this.onSpeakingChange) this.onSpeakingChange(false);
        this.stopFakeAnalyzer();
        reject(event);
      };
      
      utterance.onboundary = (event) => {
        if (options.onBoundary) options.onBoundary(event);
      };
      
      this.currentUtterance = utterance;
      this.synth.speak(utterance);
    });
  }

  /**
   * Stop current speech
   */
  stop() {
    if (this.synth) {
      this.synth.cancel();
    }
    if (this.onSpeakingChange) {
      this.onSpeakingChange(false);
    }
    this.stopFakeAnalyzer();
    this.currentUtterance = null;
  }

  /**
   * Check if currently speaking
   */
  isSpeaking() {
    return this.synth ? this.synth.speaking : false;
  }

  /**
   * Fake audio analyzer untuk waveform visualization
   * (Web Speech API tidak punya real audio data)
   */
  fakeAnalyzerInterval = null;
  fakeAudioData = new Uint8Array(32);

  startFakeAnalyzer() {
    if (this.fakeAnalyzerInterval) return;
    
    this.fakeAnalyzerInterval = setInterval(() => {
      // Generate fake waveform data
      for (let i = 0; i < this.fakeAudioData.length; i++) {
        // Create wave-like pattern
        const wave = Math.sin(Date.now() * 0.01 + i * 0.5) * 0.5 + 0.5;
        const random = Math.random() * 0.3;
        this.fakeAudioData[i] = Math.floor((wave + random) * 200);
      }
      
      if (this.onAudioData) {
        this.onAudioData(this.fakeAudioData);
      }
    }, 50);
  }

  stopFakeAnalyzer() {
    if (this.fakeAnalyzerInterval) {
      clearInterval(this.fakeAnalyzerInterval);
      this.fakeAnalyzerInterval = null;
    }
    // Reset to zeros
    this.fakeAudioData.fill(0);
    if (this.onAudioData) {
      this.onAudioData(this.fakeAudioData);
    }
  }

  /**
   * Get current audio data for visualization
   */
  getAudioData() {
    return this.fakeAudioData;
  }

  /**
   * Set callback for speaking state changes
   */
  setSpeakingCallback(callback) {
    this.onSpeakingChange = callback;
  }

  /**
   * Set callback for audio data updates (for waveform)
   */
  setAudioDataCallback(callback) {
    this.onAudioData = callback;
  }
}

// Singleton instance
const speechService = new SpeechService();
export default speechService;
