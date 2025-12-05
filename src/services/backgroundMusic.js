/**
 * Background Music Service
 * Memutar musik relaksasi sebagai backsound
 */

class BackgroundMusicService {
  constructor() {
    this.audioContext = null;
    this.gainNode = null;
    this.oscillators = [];
    this.isPlaying = false;
    // Volume rendah untuk backsound (0.0 - 1.0)
    // === KUSTOMISASI VOLUME ===
    // Ubah nilai ini untuk mengatur volume backsound (0.0 = mute, 1.0 = max)
    this.volume = 0.2; // 8% volume - sangat pelan untuk relaksasi
    this.intervalId = null;
  }

  /**
   * Initialize Audio Context
   */
  init() {
    if (this.audioContext) return;
    
    try {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
      this.gainNode = this.audioContext.createGain();
      this.gainNode.connect(this.audioContext.destination);
      this.gainNode.gain.value = this.volume;
      console.log('BackgroundMusic: Initialized');
    } catch (error) {
      console.error('BackgroundMusic: Failed to initialize', error);
    }
  }

  /**
   * Generate ambient relaxation tones
   * Menggunakan chord yang menenangkan dengan sine waves
   */
  playAmbient() {
    if (this.isPlaying) return;
    
    this.init();
    if (!this.audioContext) return;

    // Resume context jika suspended
    if (this.audioContext.state === 'suspended') {
      this.audioContext.resume();
    }

    this.isPlaying = true;

    // Frequencies untuk chord yang menenangkan (C major 7 - sangat relaxing)
    // C3, E3, G3, B3 dengan octave variations
    const baseFrequencies = [
      130.81, // C3
      164.81, // E3
      196.00, // G3
      246.94, // B3
    ];

    // Mulai dengan fade in
    this.gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
    this.gainNode.gain.linearRampToValueAtTime(this.volume, this.audioContext.currentTime + 3);

    // Create layered ambient tones
    this.createAmbientLayer(baseFrequencies);

    // Rotate through different chord voicings setiap 8 detik
    this.intervalId = setInterval(() => {
      if (this.isPlaying) {
        this.transitionToNextChord();
      }
    }, 8000);

    console.log('BackgroundMusic: Playing ambient relaxation');
  }

  /**
   * Create ambient layer with multiple oscillators
   */
  createAmbientLayer(frequencies) {
    // Stop existing oscillators with fade out
    this.stopOscillators(true);

    frequencies.forEach((freq, index) => {
      // Main tone
      const osc = this.audioContext.createOscillator();
      const oscGain = this.audioContext.createGain();
      
      osc.type = 'sine';
      osc.frequency.value = freq;
      
      // Stagger the gain for each frequency
      oscGain.gain.value = 0.15 - (index * 0.02);
      
      osc.connect(oscGain);
      oscGain.connect(this.gainNode);
      
      osc.start();
      this.oscillators.push({ osc, gain: oscGain });

      // Add subtle detuned layer for warmth
      const osc2 = this.audioContext.createOscillator();
      const osc2Gain = this.audioContext.createGain();
      
      osc2.type = 'sine';
      osc2.frequency.value = freq * 1.002; // Slight detune
      osc2Gain.gain.value = 0.05;
      
      osc2.connect(osc2Gain);
      osc2Gain.connect(this.gainNode);
      
      osc2.start();
      this.oscillators.push({ osc: osc2, gain: osc2Gain });
    });

    // Add very low sub bass for warmth
    const subBass = this.audioContext.createOscillator();
    const subGain = this.audioContext.createGain();
    subBass.type = 'sine';
    subBass.frequency.value = 65.41; // C2
    subGain.gain.value = 0.08;
    subBass.connect(subGain);
    subGain.connect(this.gainNode);
    subBass.start();
    this.oscillators.push({ osc: subBass, gain: subGain });
  }

  /**
   * Smoothly transition to next chord
   */
  transitionToNextChord() {
    if (!this.audioContext || !this.isPlaying) return;

    // Different relaxing chord progressions
    const chordProgressions = [
      [130.81, 164.81, 196.00, 246.94], // Cmaj7
      [146.83, 174.61, 220.00, 261.63], // Dm7
      [164.81, 196.00, 246.94, 293.66], // Em7
      [174.61, 220.00, 261.63, 329.63], // Fmaj7
      [196.00, 246.94, 293.66, 369.99], // G7
      [220.00, 261.63, 329.63, 392.00], // Am7
    ];

    const randomChord = chordProgressions[Math.floor(Math.random() * chordProgressions.length)];
    
    // Crossfade to new chord
    const fadeTime = 2;
    
    // Fade out current
    this.oscillators.forEach(({ gain }) => {
      gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + fadeTime);
    });

    // Schedule stop and create new after fade
    setTimeout(() => {
      this.stopOscillators(false);
      if (this.isPlaying) {
        this.createAmbientLayer(randomChord);
      }
    }, fadeTime * 1000);
  }

  /**
   * Stop all oscillators
   */
  stopOscillators(immediate = false) {
    this.oscillators.forEach(({ osc, gain }) => {
      try {
        if (!immediate && this.audioContext) {
          gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5);
          setTimeout(() => {
            try { osc.stop(); } catch (e) {}
          }, 500);
        } else {
          osc.stop();
        }
      } catch (e) {
        // Oscillator might already be stopped
      }
    });
    this.oscillators = [];
  }

  /**
   * Stop background music
   */
  stop() {
    if (!this.isPlaying) return;

    this.isPlaying = false;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    // Fade out
    if (this.gainNode && this.audioContext) {
      this.gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 2);
    }

    setTimeout(() => {
      this.stopOscillators(true);
    }, 2000);

    console.log('BackgroundMusic: Stopped');
  }

  /**
   * Set volume (0.0 - 1.0)
   */
  setVolume(value) {
    // === KUSTOMISASI VOLUME ===
    // value: 0.0 = mute, 1.0 = max
    // Untuk backsound, disarankan antara 0.05 - 0.15
    this.volume = Math.max(0, Math.min(1, value));
    if (this.gainNode) {
      this.gainNode.gain.linearRampToValueAtTime(
        this.volume, 
        this.audioContext.currentTime + 0.5
      );
    }
    console.log(`BackgroundMusic: Volume set to ${Math.round(this.volume * 100)}%`);
  }

  /**
   * Toggle mute
   */
  toggleMute() {
    if (this.gainNode) {
      const currentVolume = this.gainNode.gain.value;
      if (currentVolume > 0) {
        this._previousVolume = currentVolume;
        this.setVolume(0);
      } else {
        this.setVolume(this._previousVolume || this.volume);
      }
    }
  }

  /**
   * Check if playing
   */
  getIsPlaying() {
    return this.isPlaying;
  }
}

// Singleton instance
const backgroundMusic = new BackgroundMusicService();
export default backgroundMusic;
