import { useState, useEffect } from "react";
import useGameStore from "../../store/useGameStore";
import backgroundMusic from "../../services/backgroundMusic";

/**
 * StartScreen - Layar pertama saat aplikasi dibuka
 * Menampilkan judul game dan tombol Start
 */
export default function StartScreen() {
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const setGameState = useGameStore((s) => s.setGameState);
  const setMockMode = useGameStore((s) => s.setMockMode);

  // Start background music on mount
  useEffect(() => {
    // Auto-start backsound saat masuk
    backgroundMusic.playAmbient();
    setIsMusicPlaying(true);

    return () => {
      // Jangan stop musik saat pindah screen
    };
  }, []);

  const handleToggleMusic = () => {
    if (isMusicPlaying) {
      backgroundMusic.stop();
      setIsMusicPlaying(false);
    } else {
      backgroundMusic.playAmbient();
      setIsMusicPlaying(true);
    }
  };

  const handleStart = () => {
    // Mode live (backend VITE_API_URL)
    setMockMode(false);
    // Ke environment select dulu
    setGameState('environment_select');
  };

  const handleStartMock = () => {
    // Mode mockup/dummy (data lokal, tanpa backend LLM)
    setMockMode(true);
    setGameState('environment_select');
  };

  return (
    <div style={styles.container}>
      <div style={styles.content} className="fade-in">
        {/* Logo/Icon */}
        <div style={styles.iconContainer}>
          <svg width="80" height="80" viewBox="0 0 100 100" fill="none">
            <circle cx="50" cy="50" r="45" stroke="white" strokeWidth="2" fill="none" />
            <circle cx="35" cy="40" r="8" fill="white" />
            <circle cx="65" cy="40" r="8" fill="white" />
            <path d="M 30 65 Q 50 80 70 65" stroke="white" strokeWidth="3" fill="none" strokeLinecap="round" />
          </svg>
        </div>

        {/* Title */}
        <h1 style={styles.title}>Konseling VR</h1>
        <p style={styles.subtitle}>Ruang Aman untuk Berbagi Cerita</p>

        {/* Description */}
        <p style={styles.description}>
          Selamat datang di pengalaman konseling virtual! 
          Pilih topik yang ingin kamu bicarakan dan nikmati 
          sesi percakapan yang mendukung.
        </p>

        {/* Start Button */}
        <button 
          style={styles.startButton}
          onClick={handleStart}
          onMouseEnter={(e) => {
            e.target.style.background = '#45a049';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#4CAF50';
            e.target.style.transform = 'scale(1)';
          }}
        >
          MULAI
        </button>

        {/* Mockup Mode Button - data dummy lokal, alur sama persis */}
        <button
          style={styles.mockButton}
          onClick={handleStartMock}
          onMouseEnter={(e) => {
            e.target.style.background = '#FF8F00';
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#FFA726';
            e.target.style.transform = 'scale(1)';
          }}
        >
          🧪 MODE MOCKUP (Dummy)
        </button>
        <p style={styles.mockHint}>
          Tanpa backend LLM — pilihan topik, masalah & cerita sudah tersedia
        </p>

        {/* VR Info */}
        <p style={styles.vrInfo}>
          💡 Klik tombol "Enter VR" di bawah untuk pengalaman immersive
        </p>

        {/* Music Toggle Button */}
        <button
          style={{
            ...styles.musicButton,
            background: isMusicPlaying ? '#9C27B0' : '#555',
          }}
          onClick={handleToggleMusic}
          onMouseEnter={(e) => {
            e.target.style.opacity = '0.8';
          }}
          onMouseLeave={(e) => {
            e.target.style.opacity = '1';
          }}
        >
          {isMusicPlaying ? '🎵 Musik ON' : '🔇 Musik OFF'}
        </button>
      </div>

      {/* Background decoration */}
      <div style={styles.bgCircle1} />
      <div style={styles.bgCircle2} />
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    zIndex: 100,
    overflow: 'hidden',
  },
  content: {
    textAlign: 'center',
    padding: '40px',
    maxWidth: '500px',
    zIndex: 1,
  },
  iconContainer: {
    marginBottom: '20px',
    opacity: 0.9,
  },
  title: {
    fontSize: '48px',
    fontWeight: '700',
    margin: '0 0 10px 0',
    background: 'linear-gradient(90deg, #fff, #a8d8ff)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    backgroundClip: 'text',
  },
  subtitle: {
    fontSize: '18px',
    color: '#a8d8ff',
    margin: '0 0 30px 0',
    fontWeight: '300',
  },
  description: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.8)',
    lineHeight: '1.6',
    marginBottom: '40px',
  },
  startButton: {
    padding: '18px 60px',
    fontSize: '20px',
    fontWeight: '600',
    background: '#4CAF50',
    color: 'white',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    boxShadow: '0 10px 30px rgba(76, 175, 80, 0.4)',
    transition: 'all 0.3s ease',
    letterSpacing: '2px',
  },
  mockButton: {
    marginTop: '14px',
    padding: '14px 40px',
    fontSize: '16px',
    fontWeight: '600',
    background: '#FFA726',
    color: '#1a1a2e',
    border: 'none',
    borderRadius: '50px',
    cursor: 'pointer',
    boxShadow: '0 10px 30px rgba(255, 167, 38, 0.35)',
    transition: 'all 0.3s ease',
    letterSpacing: '1px',
  },
  mockHint: {
    marginTop: '10px',
    fontSize: '13px',
    color: 'rgba(255,255,255,0.55)',
  },
  vrInfo: {
    marginTop: '30px',
    fontSize: '14px',
    color: 'rgba(255,255,255,0.5)',
  },
  musicButton: {
    position: 'absolute',
    top: '20px',
    right: '20px',
    padding: '10px 20px',
    fontSize: '14px',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  bgCircle1: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(76,175,80,0.1) 0%, transparent 70%)',
    top: '-100px',
    right: '-100px',
  },
  bgCircle2: {
    position: 'absolute',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(66,165,245,0.1) 0%, transparent 70%)',
    bottom: '-50px',
    left: '-50px',
  },
};
