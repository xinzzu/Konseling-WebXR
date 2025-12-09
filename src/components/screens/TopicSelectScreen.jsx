import { useState, useEffect } from "react";
import useGameStore from "../../store/useGameStore";
import { selectTopic } from "../../services/chatService";
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

// Fallback topics kalau backend belum response
const FALLBACK_TOPICS = [
  { id: 'diri', label: 'Damai dengan Diri', description: 'Ketenangan batin, penerimaan diri, keseimbangan emosi, dan kemampuan mengelola stres.' },
  { id: 'sosial', label: 'Damai dengan Sosial', description: 'Kemampuan hidup rukun, menghargai perbedaan, dan berempati dalam interaksi sosial.' },
  { id: 'alam', label: 'Damai dengan Alam', description: 'Hubungan harmonis dengan lingkungan hidup, kepedulian, dan perilaku ramah lingkungan.' },
];

/**
 * TopicSelectScreen - Layar pemilihan topik konseling
 * Data topik diambil dari backend response
 */
export default function TopicSelectScreen() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showOptions, setShowOptions] = useState(OPTIONS_DISPLAY_MODE === "instant");
  const [audioData, setAudioData] = useState(new Uint8Array(32));
  
  const topicsFromStore = useGameStore((s) => s.topics);
  const currentResponse = useGameStore((s) => s.currentResponse);
  const currentAudio = useGameStore((s) => s.currentAudio);
  const ttsConfig = useGameStore((s) => s.ttsConfig);
  const setIsSpeaking = useGameStore((s) => s.setIsSpeaking);
  
  // Gunakan topics dari store, atau fallback jika kosong
  const topics = topicsFromStore?.length > 0 ? topicsFromStore : FALLBACK_TOPICS;
  const setGameState = useGameStore((s) => s.setGameState);
  const setSelectedTopic = useGameStore((s) => s.setSelectedTopic);
  const handleBackendResponse = useGameStore((s) => s.handleBackendResponse);

  // Pesan dari backend
  const message = currentResponse?.message || 'Pilih topik yang ingin kamu bicarakan';
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

  // Auto-play audio saat masuk halaman
  useEffect(() => {
    ttsService.stop();
    
    // Reset showOptions jika bukan instant
    if (OPTIONS_DISPLAY_MODE !== "instant") {
      setShowOptions(false);
    } else {
      setShowOptions(true);
    }

    // Jika tidak ada speechText dari backend, tunggu dulu
    if (!currentResponse?.speechText) {
      console.log('TopicSelect: Waiting for speechText from backend...');
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
          // Tampilkan options setelah audio selesai
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
  }, [currentAudio, ttsConfig, speechText, setIsSpeaking, currentResponse]);

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

  const handleSelectTopic = async (topic) => {
    setIsLoading(true);
    setError(null);
    setSelectedTopic(topic);
    
    try {
      // Panggil API backend untuk memilih topik
      const response = await selectTopic(topic.id);
      // Reset loading SEBELUM handle response agar UI responsive
      setIsLoading(false);
      handleBackendResponse(response);
      // State akan otomatis berubah ke 'problem_select' via handleBackendResponse
    } catch (err) {
      console.error('Failed to select topic:', err);
      setError('Gagal memilih topik. Silakan coba lagi.');
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setGameState('environment_select');
  };

  // Topic colors mapping
  const topicColors = {
    diri: '#66BB6A',
    sosial: '#42A5F5', 
    alam: '#FFA726',
  };

  return (
    <div style={styles.container}>
      {/* Fixed Header Buttons - terpisah dari content */}
      <div style={styles.headerButtons}>
        <button style={styles.backButton} onClick={handleBack}>
          ← Kembali
        </button>
        {ttsConfig?.mode !== 'off' && (
          <button 
            style={{
              ...styles.audioButton,
              background: isPlaying ? 'rgba(66,165,245,0.8)' : 'rgba(0,0,0,0.5)',
            }} 
            onClick={handleToggleAudio}
          >
            {isPlaying ? '🔊 Berbicara...' : '🔈 Putar'}
          </button>
        )}
      </div>

      <div style={styles.content} className="fade-in">
        {/* NPC Message Bubble */}
        <div style={styles.messageRow}>
          <div style={styles.avatar}>🧑‍⚕️</div>
          <div style={styles.bubble}>{message}</div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div style={styles.loadingOverlay}>
            <div style={styles.spinner} />
            <p>Memproses pilihan...</p>
          </div>
        )}

        {/* Error message */}
        {error && <div style={styles.error}>{error}</div>}

        {/* Waiting for audio - saat audio sedang diputar dan options belum muncul */}
        {!showOptions && (
          <div style={styles.waitingContainer}>
            <VoiceWaveform 
              audioData={audioData} 
              isActive={isPlaying} 
              color="#42A5F5"
            />
            <button style={styles.skipButton} onClick={handleSkipAudio}>
              ⏭️ Lewati
            </button>
          </div>
        )}

        {/* Topic Cards - muncul setelah audio selesai */}
        {showOptions && (
          <div style={styles.topicGrid}>
            {topics.map((topic, index) => (
              <TopicCard 
                key={topic.id} 
                topic={{
                  ...topic,
                  color: topicColors[topic.id] || '#666',
                }} 
                index={index}
                onSelect={() => handleSelectTopic(topic)}
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
 * TopicCard - Kartu untuk setiap topik (tanpa emoji)
 */
function TopicCard({ topic, index, onSelect, disabled }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      style={{
        ...styles.topicCard,
        background: `linear-gradient(135deg, ${topic.color}ee, ${topic.color}aa)`,
        animationDelay: `${index * 0.1}s`,
        transform: hovered && !disabled ? 'translateY(-2px)' : 'translateY(0)',
        boxShadow: hovered && !disabled
          ? `0 8px 25px ${topic.color}50`
          : `0 4px 15px rgba(0,0,0,0.3)`,
        opacity: disabled ? 0.6 : 1,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
      onClick={disabled ? undefined : onSelect}
      onMouseEnter={() => !disabled && setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
    >
      <h3 style={styles.topicLabel}>{topic.label}</h3>
      <p style={styles.topicDescription}>{topic.description}</p>
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
    background: 'transparent',
    zIndex: 100,
    overflow: 'auto',
    padding: '20px',
    paddingBottom: '80px',
    pointerEvents: 'none',
  },
  headerButtons: {
    position: 'fixed',
    top: '20px',
    left: '20px',
    right: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    pointerEvents: 'auto',
    zIndex: 110,
  },
  content: {
    maxWidth: '500px',
    width: '100%',
    margin: '0 auto',
    pointerEvents: 'auto',
  },
  backButton: {
    padding: '10px 20px',
    background: 'rgba(0,0,0,0.6)',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
    fontSize: '14px',
    backdropFilter: 'blur(10px)',
  },
  audioButton: {
    padding: '10px 20px',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
    fontSize: '14px',
    backdropFilter: 'blur(10px)',
  },
  messageRow: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '12px',
    marginBottom: '15px',
  },
  avatar: {
    width: '45px',
    height: '45px',
    borderRadius: '50%',
    background: 'rgba(66,165,245,0.9)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '22px',
    flexShrink: 0,
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
  },
  bubble: {
    flex: 1,
    fontSize: '14px',
    color: 'white',
    background: 'rgba(66, 165, 245, 0.9)',
    padding: '14px 18px',
    borderRadius: '18px',
    borderTopLeftRadius: '4px',
    textAlign: 'left',
    lineHeight: '1.5',
    boxShadow: '0 4px 15px rgba(0,0,0,0.3)',
  },
  title: {
    display: 'none',
  },
  subtitle: {
    display: 'none',
  },
  loading: {
    fontSize: '18px',
    color: 'white',
  },
  error: {
    color: '#ff6b6b',
    marginBottom: '20px',
    padding: '10px',
    background: 'rgba(255,107,107,0.1)',
    borderRadius: '8px',
  },
  topicGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  topicCard: {
    padding: '14px 18px',
    borderRadius: '15px',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    color: 'white',
    transition: 'all 0.3s ease',
    animation: 'fadeIn 0.5s ease forwards',
    opacity: 0,
    animationFillMode: 'forwards',
    backdropFilter: 'blur(10px)',
  },
  topicLabel: {
    fontSize: '15px',
    fontWeight: '600',
    marginBottom: '4px',
    margin: 0,
  },
  topicDescription: {
    fontSize: '12px',
    opacity: 0.9,
    lineHeight: '1.4',
    marginBottom: '0',
  },
  topicArrow: {
    display: 'none', // Hide arrow
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
