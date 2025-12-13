import { useState, useEffect } from "react";
import useGameStore from "../../store/useGameStore";
import { selectProblem } from "../../services/chatService";
import ttsService from "../../services/ttsService";
import speechService from "../../services/speechService";
import VoiceWaveform from "../ui/VoiceWaveform";

/**
 * ============================================
 * DEVELOPMENT CONFIG - Ubah sesuai kebutuhan
 * ============================================
 * 
 * OPTIONS_DISPLAY_MODE:
 * - "instant"     : Pilihan langsung muncul (untuk development/testing cepat)
 * - "after_audio" : Pilihan muncul setelah audio selesai (production)
 * - "delayed"     : Pilihan muncul setelah delay tertentu (DELAY_MS)
 */
const OPTIONS_DISPLAY_MODE = "after_audio"; // "instant" | "after_audio" | "delayed"
const DELAY_MS = 3000; // Delay dalam ms jika mode "delayed"

/**
 * ProblemSelectScreen - Layar pemilihan masalah (3 kali)
 * User memilih 3 masalah yang paling relevan dengan kondisinya
 */
export default function ProblemSelectScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showOptions, setShowOptions] = useState(OPTIONS_DISPLAY_MODE === "instant");
  const [audioData, setAudioData] = useState(new Uint8Array(32));
  
  const problems = useGameStore((s) => s.problems);
  const problemRound = useGameStore((s) => s.problemRound);
  const selectedTopic = useGameStore((s) => s.selectedTopic);
  const currentResponse = useGameStore((s) => s.currentResponse);
  const currentAudio = useGameStore((s) => s.currentAudio);
  const ttsConfig = useGameStore((s) => s.ttsConfig);
  const setIsSpeaking = useGameStore((s) => s.setIsSpeaking);
  const handleBackendResponse = useGameStore((s) => s.handleBackendResponse);
  const setGameState = useGameStore((s) => s.setGameState);

  // Pesan dari backend
  const message = currentResponse?.message || 'Pilih masalah yang paling menggambarkan kondisimu';
  const speechText = currentResponse?.speechText || message;

  // Setup audio data callback untuk waveform
  useEffect(() => {
    speechService.setAudioDataCallback((data) => {
      setAudioData(new Uint8Array(data));
    });
    return () => {
      speechService.setAudioDataCallback(null);
    };
  }, []);

  // Auto-play audio saat masuk halaman atau round berubah
  useEffect(() => {
    ttsService.stop();

    // Reset showOptions berdasarkan mode
    if (OPTIONS_DISPLAY_MODE === "instant") {
      setShowOptions(true);
    } else {
      // Mode after_audio atau delayed - hide dulu
      setShowOptions(false);
    }

    // Jika tidak ada speechText dari backend, jangan play - tunggu data
    if (!currentResponse?.speechText) {
      console.log('ProblemSelect: Waiting for speechText from backend...');
      return;
    }

    // Jika mode delayed, set timer
    let delayTimer;
    if (OPTIONS_DISPLAY_MODE === "delayed") {
      delayTimer = setTimeout(() => setShowOptions(true), DELAY_MS);
    }

    // Play audio (ttsService akan handle mode webspeech/elevenlabs/off)
    const timer = setTimeout(() => {
      ttsService.play({
        ttsConfig,
        audio: currentAudio,
        speechText,
        onStart: () => {
          setIsPlaying(true);
          setIsSpeaking(true);
        },
        onEnd: () => {
          setIsPlaying(false);
          setIsSpeaking(false);
          if (OPTIONS_DISPLAY_MODE === "after_audio") {
            setShowOptions(true);
          }
        },
        onError: (err) => {
          console.warn('TTS play error:', err);
          setIsPlaying(false);
          setIsSpeaking(false);
          // Tetap tampilkan options meski error
          setShowOptions(true);
        },
      });
    }, 300);

    return () => {
      clearTimeout(timer);
      if (delayTimer) clearTimeout(delayTimer);
      ttsService.stop();
      setIsSpeaking(false);
    };
  }, [currentAudio, ttsConfig, speechText, problemRound, setIsSpeaking, currentResponse]);

  // Handle play/stop audio manual
  const handleToggleAudio = () => {
    if (isPlaying) {
      ttsService.stop();
      setIsPlaying(false);
      setIsSpeaking(false);
      if (OPTIONS_DISPLAY_MODE === "after_audio") {
        setShowOptions(true);
      }
    } else {
      ttsService.play({
        ttsConfig,
        audio: currentAudio,
        speechText,
        onStart: () => {
          setIsPlaying(true);
          setIsSpeaking(true);
        },
        onEnd: () => {
          setIsPlaying(false);
          setIsSpeaking(false);
          if (OPTIONS_DISPLAY_MODE === "after_audio") {
            setShowOptions(true);
          }
        },
        onError: (err) => {
          console.warn('TTS play error:', err);
          setIsPlaying(false);
          setIsSpeaking(false);
          setShowOptions(true);
        },
      });
    }
  };

  // Skip audio dan langsung tampilkan options
  const handleSkipAudio = () => {
    ttsService.stop();
    setIsPlaying(false);
    setIsSpeaking(false);
    setShowOptions(true);
  };

  // Topic colors
  const topicColors = {
    diri: '#66BB6A',
    sosial: '#42A5F5', 
    alam: '#FFA726',
  };
  const currentColor = topicColors[selectedTopic?.id] || '#666';

  const handleSelectProblem = async (problem) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await selectProblem(problem.id);
      // Reset loading SEBELUM handle response agar UI responsive
      setIsLoading(false);
      handleBackendResponse(response);
      // State akan berubah ke 'problem_select' (round berikutnya) atau 'story'
    } catch (err) {
      console.error('Failed to select problem:', err);
      setError('Gagal memilih. Silakan coba lagi.');
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setGameState('topic_select');
  };

  return (
    <div style={styles.container}>
      <div style={styles.content} className="fade-in">
        {/* Back Button */}
        <button style={styles.backButton} onClick={handleBack}>
          ← Kembali
        </button>

        {/* Progress Indicator */}
        <div style={styles.progressContainer}>
          <div style={styles.progressLabel}>Langkah {problemRound} dari 3</div>
          <div style={styles.progressBar}>
            <div 
              style={{
                ...styles.progressFill,
                width: `${(problemRound / 3) * 100}%`,
                background: currentColor,
              }} 
            />
          </div>
        </div>

        {/* Header */}
        <h2 style={styles.title}>
          {selectedTopic?.label || 'Pilih Masalah'}
        </h2>
        <p style={styles.subtitle}>{message}</p>

        {/* Audio Control */}
        {ttsConfig?.mode !== 'off' && (
          <button 
            style={{
              ...styles.audioButton,
              background: isPlaying ? currentColor : 'rgba(255,255,255,0.1)',
            }}
            onClick={handleToggleAudio}
          >
            {isPlaying ? '🔊 Sedang Berbicara...' : '🔈 Putar Pesan'}
          </button>
        )}

        {/* Loading State */}
        {isLoading && (
          <div style={styles.loadingOverlay}>
            <div style={styles.spinner} />
            <p>{problemRound === 3 ? 'Menyiapkan cerita untukmu...' : 'Memproses pilihan...'}</p>
          </div>
        )}

        {/* Error message */}
        {error && <div style={styles.error}>{error}</div>}

        {/* Waiting for audio - saat audio sedang diputar dan options belum muncul */}
        {!isLoading && !showOptions && (
          <div style={styles.waitingContainer}>
            <VoiceWaveform 
              audioData={audioData} 
              isActive={isPlaying} 
              color={currentColor}
            />
            <button style={styles.skipButton} onClick={handleSkipAudio}>
              ⏭️ Lewati
            </button>
          </div>
        )}

        {/* Problem Cards - muncul setelah audio selesai */}
        {!isLoading && showOptions && (
          <div style={styles.problemGrid}>
            {problems.map((problem, index) => (
              <ProblemCard 
                key={problem.id} 
                problem={problem}
                color={currentColor}
                index={index}
                onSelect={() => handleSelectProblem(problem)}
                disabled={isLoading}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * ProblemCard - Kartu untuk setiap masalah
 */
function ProblemCard({ problem, color, index, onSelect, disabled }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      style={{
        ...styles.problemCard,
        animationDelay: `${index * 0.1}s`,
        transform: hovered && !disabled ? 'translateY(-3px)' : 'translateY(0)',
        borderColor: hovered && !disabled ? color : 'rgba(255,255,255,0.1)',
        boxShadow: hovered && !disabled ? `0 10px 30px ${color}30` : 'none',
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onClick={disabled ? undefined : onSelect}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
    >
      <h3 style={styles.problemTitle}>{problem.label}</h3>
      <p style={styles.problemDescription}>{problem.description}</p>
    </button>
  );
}


const styles = {
  container: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    background: 'transparent', // Transparan - 3D scene terlihat
    zIndex: 100,
    overflow: 'auto',
    padding: '20px',
    paddingBottom: '100px',
    pointerEvents: 'none',
  },
  content: {
    textAlign: 'center',
    maxWidth: '700px',
    width: '100%',
    margin: '0 auto',
    pointerEvents: 'auto',
  },
  backButton: {
    position: 'fixed',
    top: '20px',
    left: '20px',
    padding: '10px 20px',
    background: 'rgba(0,0,0,0.5)',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
    pointerEvents: 'auto',
    backdropFilter: 'blur(10px)',
  },
  progressContainer: {
    marginBottom: '15px',
  },
  progressLabel: {
    fontSize: '12px',
    color: 'rgba(255,255,255,0.8)',
    marginBottom: '6px',
  },
  progressBar: {
    width: '150px',
    height: '4px',
    background: 'rgba(255,255,255,0.2)',
    borderRadius: '2px',
    margin: '0 auto',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: '2px',
    transition: 'width 0.3s ease',
  },
  title: {
    display: 'none', // Hide title
  },
  subtitle: {
    fontSize: '15px',
    color: 'white',
    background: 'rgba(66, 165, 245, 0.9)', // Bubble biru
    padding: '16px 20px',
    borderRadius: '20px',
    marginBottom: '15px',
    textAlign: 'left',
    lineHeight: '1.5',
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
  },
  loadingOverlay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px',
    marginBottom: '20px',
    color: 'white',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid rgba(255,255,255,0.2)',
    borderTop: '3px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  error: {
    color: '#ff6b6b',
    marginBottom: '20px',
    padding: '10px',
    background: 'rgba(255,107,107,0.1)',
    borderRadius: '8px',
  },
  problemGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  problemCard: {
    padding: '12px 16px',
    borderRadius: '12px',
    border: 'none',
    background: 'rgba(30, 30, 50, 0.85)',
    cursor: 'pointer',
    textAlign: 'left',
    color: 'white',
    transition: 'all 0.3s ease',
    animation: 'fadeIn 0.5s ease forwards',
    opacity: 0,
    animationFillMode: 'forwards',
    backdropFilter: 'blur(10px)',
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
  },
  problemTitle: {
    fontSize: '14px',
    fontWeight: '600',
    marginBottom: '4px',
    margin: 0,
  },
  problemDescription: {
    fontSize: '12px',
    opacity: 0.7,
    lineHeight: '1.3',
    margin: 0,
  },
  audioButton: {
    position: 'fixed',
    top: '20px',
    right: '20px',
    padding: '10px 20px',
    borderRadius: '20px',
    border: 'none',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.3s ease',
    pointerEvents: 'auto',
    backdropFilter: 'blur(10px)',
  },
  waitingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px',
    padding: '20px',
  },
  waitingText: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.7)',
  },
  skipButton: {
    padding: '10px 24px',
    fontSize: '14px',
    background: 'rgba(0,0,0,0.5)',
    color: 'white',
    border: 'none',
    borderRadius: '20px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    backdropFilter: 'blur(10px)',
  },
};
