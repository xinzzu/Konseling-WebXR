import { useState, useEffect, useRef } from "react";
import useGameStore from "../../store/useGameStore";
import { resetSession, restartSession } from "../../services/chatService";
import backgroundMusic from "../../services/backgroundMusic";
import VoiceWaveform from "../ui/VoiceWaveform";

/**
 * StoryScreen - Layar cerita relaksasi
 * Menampilkan cerita FULL dengan scroll, audio jalan di background
 */
export default function StoryScreen() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioData, setAudioData] = useState(new Uint8Array(32));
  const [hasFinished, setHasFinished] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const audioRef = useRef(null);
  const analyzerRef = useRef(null);

  const storyText = useGameStore((s) => s.storyText);
  const baseStoryMeta = useGameStore((s) => s.baseStoryMeta);
  const currentAudio = useGameStore((s) => s.currentAudio);
  const selectedTopic = useGameStore((s) => s.selectedTopic);
  const resetGame = useGameStore((s) => s.resetGame);
  const setGameState = useGameStore((s) => s.setGameState);
  const handleBackendResponse = useGameStore((s) => s.handleBackendResponse);

  // Topic colors
  const topicColors = {
    diri: "#66BB6A",
    sosial: "#42A5F5",
    alam: "#FFA726",
  };
  const currentColor = topicColors[selectedTopic?.id] || "#66BB6A";

  // Start background music on mount
  useEffect(() => {
    backgroundMusic.playAmbient();
    setIsMusicPlaying(true);
    
    return () => {
      // Stop music when leaving story screen
      backgroundMusic.stop();
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Audio analyzer for waveform
  useEffect(() => {
    if (!audioRef.current || !isPlaying) return;

    try {
      const audioContext = new (window.AudioContext ||
        window.webkitAudioContext)();
      const source = audioContext.createMediaElementSource(audioRef.current);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 64;

      source.connect(analyzer);
      analyzer.connect(audioContext.destination);
      analyzerRef.current = analyzer;

      const updateWaveform = () => {
        if (!analyzerRef.current || !isPlaying) return;
        const data = new Uint8Array(analyzerRef.current.frequencyBinCount);
        analyzerRef.current.getByteFrequencyData(data);
        setAudioData(data);
        requestAnimationFrame(updateWaveform);
      };
      updateWaveform();
    } catch (err) {
      console.warn("Audio analyzer error:", err);
    }
  }, [isPlaying]);

  const handlePlayAudio = async () => {
    if (!currentAudio?.enabled || !currentAudio?.base64) {
      return;
    }

    try {
      setIsPlaying(true);
      const audio = new Audio(
        `data:${currentAudio.mimeType};base64,${currentAudio.base64}`
      );
      audioRef.current = audio;

      audio.onended = () => {
        setIsPlaying(false);
      };

      audio.onerror = () => {
        setIsPlaying(false);
      };

      await audio.play();
    } catch (err) {
      console.error("Failed to play audio:", err);
      setIsPlaying(false);
    }
  };

  const handleStopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const handleFinish = () => {
    handleStopAudio();
    setHasFinished(true);
  };

  const handleToggleMusic = () => {
    if (isMusicPlaying) {
      backgroundMusic.stop();
      setIsMusicPlaying(false);
    } else {
      backgroundMusic.playAmbient();
      setIsMusicPlaying(true);
    }
  };

  // Restart dengan topik yang sama
  const handleRestartSameTopic = async () => {
    handleStopAudio();
    setHasFinished(false);

    try {
      const response = await restartSession(selectedTopic?.id);
      handleBackendResponse(response);
    } catch (err) {
      console.error("Failed to restart session:", err);
      resetSession();
      resetGame();
      setGameState("environment_select");
    }
  };

  // Restart dengan topik baru
  const handleRestartNewTopic = () => {
    handleStopAudio();
    resetSession();
    resetGame();
    setGameState("environment_select");
  };

  const handleBackToMenu = () => {
    handleStopAudio();
    resetSession();
    resetGame();
  };

  return (
    <div style={styles.container}>
      <div style={styles.content} className="fade-in">
        {/* Header */}
        <div style={styles.header}>
          <div style={{ ...styles.badge, background: currentColor }}>
            {selectedTopic?.label || "Cerita Relaksasi"}
          </div>
          {baseStoryMeta && (
            <p style={styles.storyTitle}>{baseStoryMeta.title}</p>
          )}
        </div>

        {/* Waveform */}
        <div style={styles.waveformContainer}>
          <VoiceWaveform
            audioData={audioData}
            isActive={isPlaying}
            color={currentColor}
          />
        </div>

        {/* Story Text - Full dengan Scroll */}
        <div style={styles.storyContainer}>
          <div style={styles.storyText}>
            {storyText || "Cerita sedang dimuat..."}
          </div>
        </div>

        {/* Controls */}
        {!hasFinished ? (
          <div style={styles.controls}>
            <button
              style={{
                ...styles.audioButton,
                background: isPlaying ? "#ff5252" : currentColor,
              }}
              onClick={isPlaying ? handleStopAudio : handlePlayAudio}
            >
              {isPlaying ? "⏹️ Stop Narasi" : "🔊 Putar Narasi"}
            </button>

            <button
              style={{
                ...styles.musicButton,
                background: isMusicPlaying ? "#9C27B0" : "#555",
              }}
              onClick={handleToggleMusic}
            >
              {isMusicPlaying ? "🎵 Musik: ON" : "🔇 Musik: OFF"}
            </button>

            <button
              style={{ ...styles.finishButton }}
              onClick={handleFinish}
            >
              ✓ Selesai Membaca
            </button>
          </div>
        ) : (
          <div style={styles.finishedActions}>
            <p style={styles.finishedText}>
              ✨ Sesi selesai. Semoga kamu merasa lebih tenang.
            </p>
            <button
              style={{ ...styles.actionButton, background: currentColor }}
              onClick={handleRestartSameTopic}
            >
              🔄 Ulangi Topik: {selectedTopic?.label || "Ini"}
            </button>
            <button
              style={{ ...styles.actionButton, background: "#2196F3" }}
              onClick={handleRestartNewTopic}
            >
              📝 Pilih Topik Lain
            </button>
            <button
              style={{ ...styles.actionButton, background: "#555" }}
              onClick={handleBackToMenu}
            >
              🏠 Menu Utama
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: "fixed",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    background: "transparent", // Transparan - 3D scene terlihat
    zIndex: 100,
    overflow: "auto",
    padding: "20px",
    paddingBottom: "80px",
    pointerEvents: "none",
  },
  content: {
    textAlign: "center",
    maxWidth: "550px",
    width: "100%",
    margin: "0 auto",
    pointerEvents: "auto",
  },
  header: {
    marginBottom: "12px",
  },
  badge: {
    display: "inline-block",
    padding: "8px 18px",
    borderRadius: "20px",
    color: "white",
    fontSize: "13px",
    fontWeight: "600",
    marginBottom: "6px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
  },
  storyTitle: {
    fontSize: "13px",
    color: "rgba(255,255,255,0.7)",
    margin: 0,
  },
  waveformContainer: {
    width: "100%",
    maxWidth: "280px",
    height: "40px",
    margin: "0 auto 12px",
  },
  storyContainer: {
    background: "rgba(20,20,40,0.9)",
    borderRadius: "16px",
    padding: "16px 20px",
    marginBottom: "15px",
    maxHeight: "35vh",
    overflow: "auto",
    textAlign: "left",
    backdropFilter: "blur(15px)",
    boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
  },
  storyText: {
    fontSize: "14px",
    lineHeight: "1.7",
    color: "rgba(255,255,255,0.9)",
    whiteSpace: "pre-wrap",
  },
  controls: {
    display: "flex",
    gap: "10px",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  audioButton: {
    padding: "10px 20px",
    fontSize: "13px",
    color: "white",
    border: "none",
    borderRadius: "20px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontWeight: "500",
    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
  },
  musicButton: {
    padding: "10px 20px",
    fontSize: "13px",
    color: "white",
    border: "none",
    borderRadius: "20px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontWeight: "500",
    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
  },
  finishButton: {
    padding: "10px 24px",
    fontSize: "14px",
    background: "#4CAF50",
    color: "white",
    border: "none",
    borderRadius: "20px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontWeight: "500",
    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
  },
  finishedActions: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "10px",
  },
  finishedText: {
    fontSize: "15px",
    color: "white",
    marginBottom: "8px",
    background: "rgba(76,175,80,0.8)",
    padding: "12px 20px",
    borderRadius: "15px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
  },
  actionButton: {
    padding: "12px 24px",
    fontSize: "14px",
    color: "white",
    border: "none",
    borderRadius: "20px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    fontWeight: "500",
    minWidth: "200px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
  },
};
