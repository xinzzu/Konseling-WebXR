import { useEffect, useState, useCallback, useRef } from "react";
import useGameStore from "../../store/useGameStore";
import speechService from "../../services/speechService";
import VoiceWaveform from "./VoiceWaveform";

/**
 * ConversationPanel - Panel percakapan dengan LLM
 * Layout seperti TopicSelectScreen - full screen dengan background gradient
 */
export default function ConversationPanel() {
  const selectedTopic = useGameStore((s) => s.selectedTopic);
  const conversations = useGameStore((s) => s.conversations);
  const currentIndex = useGameStore((s) => s.currentConversationIndex);
  const nextConversation = useGameStore((s) => s.nextConversation);
  const addUserResponse = useGameStore((s) => s.addUserResponse);
  const setGameState = useGameStore((s) => s.setGameState);
  const resetGame = useGameStore((s) => s.resetGame);
  const startSession = useGameStore((s) => s.startSession);

  const [isSpeaking, setIsSpeaking] = useState(false);
  const [audioData, setAudioData] = useState(new Uint8Array(32));
  const [showChoices, setShowChoices] = useState(false);
  const [hasSpoken, setHasSpoken] = useState(false);
  const [needsFirstClick, setNeedsFirstClick] = useState(true);
  const lastSpokenIndex = useRef(-1);

  const currentMessage = conversations[currentIndex];
  const isUserChoice = currentMessage?.role === "user_choice";
  const isFinished = currentIndex >= conversations.length || !currentMessage;

  // Setup speech service callbacks
  useEffect(() => {
    speechService.setSpeakingCallback(setIsSpeaking);
    speechService.setAudioDataCallback(setAudioData);

    return () => {
      speechService.stop();
    };
  }, []);

  // Speak function
  const speakCurrentMessage = useCallback(
    (text) => {
      if (!text) return;
      setNeedsFirstClick(false);

      speechService
        .speak(text, {
          onStart: () => setIsSpeaking(true),
          onEnd: () => {
            setIsSpeaking(false);
            setHasSpoken(true);
            // Show choices if next is user_choice
            const nextMsg = conversations[currentIndex + 1];
            if (nextMsg?.role === "user_choice") {
              setTimeout(() => setShowChoices(true), 400);
            }
          },
        })
        .catch((err) => {
          console.warn("Speech error:", err);
          setIsSpeaking(false);
          setHasSpoken(true);
        });
    },
    [conversations, currentIndex]
  );

  // Handle message change - only auto-speak after first interaction
  useEffect(() => {
    if (
      currentMessage?.role === "assistant" &&
      !needsFirstClick &&
      lastSpokenIndex.current !== currentIndex
    ) {
      lastSpokenIndex.current = currentIndex;
      setShowChoices(false);
      setHasSpoken(false);

      const timer = setTimeout(() => {
        speakCurrentMessage(currentMessage.text);
      }, 300);

      return () => clearTimeout(timer);
    } else if (isUserChoice) {
      setShowChoices(true);
    }
  }, [currentIndex, currentMessage, isUserChoice, needsFirstClick, speakCurrentMessage]);

  // Handle first play click
  const handleFirstPlay = useCallback(() => {
    if (currentMessage?.text) {
      lastSpokenIndex.current = currentIndex;
      speakCurrentMessage(currentMessage.text);
    }
  }, [currentMessage, currentIndex, speakCurrentMessage]);

  // Skip audio
  const handleSkip = useCallback(() => {
    speechService.stop();
    setIsSpeaking(false);
    setHasSpoken(true);
    setNeedsFirstClick(false);
    // Show choices if next is user_choice
    const nextMsg = conversations[currentIndex + 1];
    if (nextMsg?.role === "user_choice") {
      setShowChoices(true);
    }
  }, [conversations, currentIndex]);

  // Handle user choice selection
  const handleChoice = useCallback(
    (choice) => {
      addUserResponse(choice);
      setShowChoices(false);
      setHasSpoken(false);
      lastSpokenIndex.current = -1;

      // Move past user_choice to next assistant message
      nextConversation(); // Skip user_choice
      const hasMore = nextConversation(); // Move to next assistant

      if (!hasMore) {
        setGameState("finished");
      }
    },
    [addUserResponse, nextConversation, setGameState]
  );

  // Handle exit / back to menu
  const handleExit = useCallback(() => {
    speechService.stop();
    resetGame();
  }, [resetGame]);

  // Handle restart same topic
  const handleRestart = useCallback(() => {
    speechService.stop();
    const topic = selectedTopic;
    resetGame();
    setTimeout(() => startSession(topic), 100);
  }, [resetGame, selectedTopic, startSession]);

  // Handle choose different topic
  const handleDifferentTopic = useCallback(() => {
    speechService.stop();
    setGameState("topic_select");
    useGameStore.setState({
      selectedTopic: null,
      conversations: [],
      currentConversationIndex: 0,
      userResponses: [],
    });
  }, [setGameState]);

  // Topic colors
  const topicColors = {
    diri: "#66BB6A",
    sosial: "#42A5F5",
    alam: "#FFA726",
  };
  const currentColor = topicColors[selectedTopic?.id] || "#42A5F5";

  if (!selectedTopic || isFinished) {
    return (
      <div style={styles.container}>
        <div style={styles.content}>
          <div style={styles.finishedPanel} className="fade-in">
            <div style={styles.finishedIcon}>✨</div>
            <h2 style={styles.finishedTitle}>Sesi Selesai!</h2>
            <p style={styles.finishedText}>
              Terima kasih sudah mau berbagi. Ingat, kamu tidak sendirian! Setiap
              langkah kecil adalah kemajuan.
            </p>
            <div style={styles.finishedActions}>
              <button
                style={{ ...styles.actionButton, background: "#4CAF50" }}
                onClick={handleRestart}
              >
                🔄 Ulangi Topik Ini
              </button>
              <button
                style={{ ...styles.actionButton, background: "#2196F3" }}
                onClick={handleDifferentTopic}
              >
                📝 Pilih Topik Lain
              </button>
              <button
                style={{ ...styles.actionButton, background: "#666" }}
                onClick={handleExit}
              >
                🏠 Menu Utama
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Back Button */}
      <button style={styles.backButton} onClick={handleExit}>
        ← Kembali
      </button>

      {/* Exit Button */}
      <button style={styles.exitButton} onClick={handleExit}>
        ✕
      </button>

      {/* Audio Button */}
      <button
        style={{
          ...styles.audioButton,
          background: isSpeaking ? currentColor : "rgba(255,255,255,0.1)",
        }}
        onClick={handleFirstPlay}
        disabled={isSpeaking}
      >
        {isSpeaking ? "🔊 ..." : "🔈 Putar"}
      </button>

      <div style={styles.content}>
        {/* Header */}
        <h2 style={styles.title}>{selectedTopic?.label || "Percakapan"}</h2>

        {/* Message Text */}
        {currentMessage?.role === "assistant" && (
          <p style={styles.subtitle}>{currentMessage.text}</p>
        )}

        {/* Waveform & Speaking State */}
        {!showChoices && (
          <div style={styles.waitingContainer}>
            <VoiceWaveform
              audioData={audioData}
              isActive={isSpeaking}
              color={currentColor}
            />
            <div style={styles.speakingText}>
              {isSpeaking
                ? "🔊 Berbicara..."
                : needsFirstClick
                  ? "Klik tombol putar untuk mendengarkan"
                  : hasSpoken
                    ? "✓ Selesai"
                    : "⏳ Memuat..."}
            </div>
            {(isSpeaking || needsFirstClick) && (
              <button style={styles.skipButton} onClick={handleSkip}>
                ⏭️ Lewati
              </button>
            )}
          </div>
        )}

        {/* User Choices - muncul setelah audio selesai */}
        {showChoices && conversations[currentIndex + 1]?.role === "user_choice" && (
          <div style={styles.choicesContainer} className="fade-in">
            {conversations[currentIndex + 1].options.map((option, idx) => (
              <button
                key={idx}
                style={{
                  ...styles.choiceButton,
                  animationDelay: `${idx * 0.1}s`,
                }}
                onClick={() => {
                  nextConversation();
                  handleChoice(option);
                }}
                className="fade-in"
              >
                {option}
              </button>
            ))}
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
    paddingBottom: "100px",
    pointerEvents: "none",
  },
  content: {
    textAlign: "center",
    maxWidth: "700px",
    width: "100%",
    margin: "0 auto",
    pointerEvents: "auto",
  },
  backButton: {
    position: "fixed",
    top: "20px",
    left: "20px",
    padding: "10px 20px",
    background: "rgba(0,0,0,0.5)",
    color: "white",
    border: "none",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.2s ease",
    pointerEvents: "auto",
    backdropFilter: "blur(10px)",
  },
  exitButton: {
    position: "fixed",
    top: "20px",
    right: "70px",
    width: "40px",
    height: "40px",
    borderRadius: "50%",
    border: "none",
    background: "rgba(0,0,0,0.5)",
    color: "white",
    fontSize: "18px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    pointerEvents: "auto",
    backdropFilter: "blur(10px)",
  },
  audioButton: {
    position: "fixed",
    top: "20px",
    right: "20px",
    padding: "10px 20px",
    color: "white",
    border: "none",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "14px",
    transition: "all 0.2s ease",
    pointerEvents: "auto",
    backdropFilter: "blur(10px)",
  },
  title: {
    display: "none", // Hide title
  },
  subtitle: {
    fontSize: "15px",
    color: "white",
    background: "rgba(66, 165, 245, 0.9)", // Bubble biru
    padding: "16px 20px",
    borderRadius: "20px",
    marginBottom: "15px",
    textAlign: "left",
    lineHeight: "1.5",
    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
  },
  waitingContainer: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "15px",
    padding: "20px",
  },
  speakingText: {
    fontSize: "14px",
    color: "rgba(255,255,255,0.8)",
  },
  skipButton: {
    padding: "10px 24px",
    fontSize: "14px",
    background: "rgba(0,0,0,0.5)",
    color: "white",
    border: "none",
    borderRadius: "20px",
    cursor: "pointer",
    transition: "all 0.3s ease",
    backdropFilter: "blur(10px)",
  },
  choicesContainer: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  choiceButton: {
    width: "100%",
    padding: "12px 16px",
    background: "rgba(30, 30, 50, 0.85)",
    border: "none",
    borderRadius: "12px",
    color: "white",
    cursor: "pointer",
    fontSize: "14px",
    textAlign: "left",
    transition: "all 0.2s ease",
    opacity: 0,
    animation: "fadeIn 0.3s ease forwards",
    backdropFilter: "blur(10px)",
    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
  },
  finishedPanel: {
    textAlign: "center",
    padding: "30px",
    background: "rgba(20, 20, 40, 0.9)",
    borderRadius: "20px",
    maxWidth: "400px",
    margin: "0 auto",
    backdropFilter: "blur(10px)",
    boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
  },
  finishedIcon: {
    fontSize: "60px",
    marginBottom: "20px",
  },
  finishedTitle: {
    fontSize: "32px",
    marginBottom: "15px",
    color: "white",
  },
  finishedText: {
    fontSize: "16px",
    color: "rgba(255,255,255,0.7)",
    marginBottom: "30px",
    lineHeight: "1.6",
  },
  finishedActions: {
    display: "flex",
    flexDirection: "column",
    gap: "12px",
  },
  actionButton: {
    padding: "15px 35px",
    border: "none",
    borderRadius: "30px",
    color: "white",
    fontSize: "16px",
    cursor: "pointer",
    transition: "all 0.2s ease",
    fontWeight: "500",
  },
};
