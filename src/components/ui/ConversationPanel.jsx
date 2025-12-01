import React, { useEffect, useState, useCallback, useRef } from "react";
import useGameStore from "../../store/useGameStore";
import speechService from "../../services/speechService";
import VoiceWaveform from "./VoiceWaveform";

/**
 * ConversationPanel - Panel percakapan dengan LLM
 * Menampilkan pesan LLM, pilihan user, dan kontrol speech
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
  const isUserChoice = currentMessage?.role === 'user_choice';
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
  const speakCurrentMessage = useCallback((text) => {
    if (!text) return;
    setNeedsFirstClick(false);
    
    speechService.speak(text, {
      onStart: () => setIsSpeaking(true),
      onEnd: () => {
        setIsSpeaking(false);
        setHasSpoken(true);
        // Show choices if next is user_choice
        const nextMsg = conversations[currentIndex + 1];
        if (nextMsg?.role === 'user_choice') {
          setTimeout(() => setShowChoices(true), 400);
        }
      }
    }).catch(err => {
      console.warn('Speech error:', err);
      setIsSpeaking(false);
      setHasSpoken(true);
    });
  }, [conversations, currentIndex]);

  // Handle message change - only auto-speak after first interaction
  useEffect(() => {
    if (currentMessage?.role === 'assistant' && !needsFirstClick && lastSpokenIndex.current !== currentIndex) {
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

  // Handle user choice selection
  const handleChoice = useCallback((choice) => {
    addUserResponse(choice);
    setShowChoices(false);
    setHasSpoken(false);
    lastSpokenIndex.current = -1;
    
    // Move past user_choice to next assistant message
    nextConversation(); // Skip user_choice
    const hasMore = nextConversation(); // Move to next assistant
    
    if (!hasMore) {
      setGameState('finished');
    }
  }, [addUserResponse, nextConversation, setGameState]);

  // Handle continue button
  const handleContinue = useCallback(() => {
    speechService.stop();
    setHasSpoken(false);
    lastSpokenIndex.current = -1;
    
    const nextMsg = conversations[currentIndex + 1];
    if (nextMsg?.role === 'user_choice') {
      setShowChoices(true);
    } else {
      const hasNext = nextConversation();
      if (!hasNext) {
        setGameState('finished');
      }
    }
  }, [nextConversation, setGameState, conversations, currentIndex]);

  // Handle replay speech
  const handleReplay = useCallback(() => {
    if (currentMessage?.text) {
      speakCurrentMessage(currentMessage.text);
    }
  }, [currentMessage, speakCurrentMessage]);

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
    setGameState('topic_select');
    useGameStore.setState({
      selectedTopic: null,
      conversations: [],
      currentConversationIndex: 0,
      userResponses: [],
    });
  }, [setGameState]);

  if (!selectedTopic || isFinished) {
    return (
      <div style={styles.container}>
        <div style={styles.finishedPanel} className="fade-in">
          <div style={styles.finishedIcon}>✨</div>
          <h2 style={styles.finishedTitle}>Sesi Selesai!</h2>
          <p style={styles.finishedText}>
            Terima kasih sudah mau berbagi. Ingat, kamu tidak sendirian!
            Setiap langkah kecil adalah kemajuan.
          </p>
          <div style={styles.finishedActions}>
            <button style={{...styles.actionButton, background: '#4CAF50'}} onClick={handleRestart}>
              🔄 Ulangi Topik Ini
            </button>
            <button style={{...styles.actionButton, background: '#2196F3'}} onClick={handleDifferentTopic}>
              📝 Pilih Topik Lain
            </button>
            <button style={{...styles.actionButton, background: '#666'}} onClick={handleExit}>
              🏠 Menu Utama
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.topicBadge} className="fade-in">
          <span style={{
            ...styles.topicDot,
            background: selectedTopic.color
          }} />
          {selectedTopic.label}
        </div>
        <button style={styles.exitBtn} onClick={handleExit}>
          ✕
        </button>
      </div>

      {/* Main Content */}
      <div style={styles.content}>
        {/* Voice Waveform */}
        <div style={styles.waveformContainer}>
          <VoiceWaveform 
            audioData={audioData} 
            isActive={isSpeaking}
            color={selectedTopic.color}
          />
        </div>

        {/* Message Display */}
        {currentMessage?.role === 'assistant' && (
          <div style={styles.messageContainer} className="fade-in" key={currentIndex}>
            <div style={styles.assistantAvatar}>
              <svg width="40" height="40" viewBox="0 0 50 50" fill="none">
                <circle cx="25" cy="25" r="23" fill={selectedTopic.color} opacity="0.2"/>
                <circle cx="18" cy="22" r="3" fill={selectedTopic.color}/>
                <circle cx="32" cy="22" r="3" fill={selectedTopic.color}/>
                <path d="M 17 32 Q 25 38 33 32" stroke={selectedTopic.color} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
              </svg>
            </div>
            <div style={styles.messageContent}>
              <div style={styles.messageText}>
                {currentMessage.text}
              </div>
              <div style={styles.messageControls}>
                {/* First time - need to click to start speech */}
                {needsFirstClick && !hasSpoken && (
                  <button 
                    style={{...styles.controlButton, ...styles.playButton}}
                    onClick={handleFirstPlay}
                  >
                    ▶️ Putar Pesan
                  </button>
                )}
                
                {/* After first interaction */}
                {!needsFirstClick && (
                  <>
                    <button 
                      style={styles.controlButton}
                      onClick={handleReplay}
                      disabled={isSpeaking}
                    >
                      {isSpeaking ? '🔊 Berbicara...' : '🔈 Putar Ulang'}
                    </button>
                    
                    {hasSpoken && conversations[currentIndex + 1]?.role !== 'user_choice' && (
                      <button 
                        style={{...styles.controlButton, ...styles.continueButton}}
                        onClick={handleContinue}
                      >
                        Lanjut →
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* User Choices */}
        {showChoices && currentMessage?.role === 'user_choice' && (
          <div style={styles.choicesContainer} className="fade-in">
            <p style={styles.choicesLabel}>Pilih responsmu:</p>
            {currentMessage.options.map((option, idx) => (
              <button
                key={idx}
                style={{
                  ...styles.choiceButton,
                  animationDelay: `${idx * 0.1}s`
                }}
                onClick={() => handleChoice(option)}
                className="fade-in"
              >
                {option}
              </button>
            ))}
          </div>
        )}

        {/* Show choices after assistant message if next is user_choice */}
        {showChoices && currentMessage?.role === 'assistant' && conversations[currentIndex + 1]?.role === 'user_choice' && (
          <div style={styles.choicesContainer} className="fade-in">
            <p style={styles.choicesLabel}>Pilih responsmu:</p>
            {conversations[currentIndex + 1].options.map((option, idx) => (
              <button
                key={idx}
                style={{
                  ...styles.choiceButton,
                  animationDelay: `${idx * 0.1}s`
                }}
                onClick={() => {
                  nextConversation(); // Move to user_choice
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

      {/* Progress indicator */}
      <div style={styles.progress}>
        <div style={{
          ...styles.progressBar,
          width: `${((currentIndex + 1) / conversations.length) * 100}%`,
          background: selectedTopic.color
        }} />
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.6) 100%)',
    zIndex: 90,
    color: 'white',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '20px 30px',
  },
  topicBadge: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    padding: '10px 20px',
    background: 'rgba(255,255,255,0.1)',
    borderRadius: '30px',
    fontSize: '14px',
    fontWeight: '500',
  },
  topicDot: {
    width: '10px',
    height: '10px',
    borderRadius: '50%',
  },
  exitBtn: {
    width: '40px',
    height: '40px',
    borderRadius: '50%',
    border: 'none',
    background: 'rgba(255,255,255,0.1)',
    color: 'white',
    fontSize: '18px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '20px',
    gap: '30px',
    overflow: 'auto',
  },
  waveformContainer: {
    width: '100%',
    maxWidth: '400px',
    height: '80px',
  },
  messageContainer: {
    display: 'flex',
    gap: '15px',
    maxWidth: '600px',
    width: '100%',
    alignItems: 'flex-start',
  },
  assistantAvatar: {
    flexShrink: 0,
  },
  messageContent: {
    flex: 1,
  },
  messageText: {
    fontSize: '18px',
    lineHeight: '1.6',
    background: 'rgba(255,255,255,0.1)',
    padding: '20px',
    borderRadius: '0 20px 20px 20px',
  },
  messageControls: {
    display: 'flex',
    gap: '10px',
    marginTop: '15px',
  },
  controlButton: {
    padding: '10px 20px',
    background: 'rgba(255,255,255,0.1)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '20px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
  },
  continueButton: {
    background: 'rgba(76,175,80,0.3)',
    borderColor: 'rgba(76,175,80,0.5)',
  },
  choicesContainer: {
    maxWidth: '600px',
    width: '100%',
  },
  choicesLabel: {
    fontSize: '14px',
    opacity: 0.7,
    marginBottom: '15px',
    textAlign: 'center',
  },
  choiceButton: {
    width: '100%',
    padding: '15px 20px',
    marginBottom: '10px',
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '15px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '15px',
    textAlign: 'left',
    transition: 'all 0.2s ease',
    opacity: 0,
    animation: 'fadeIn 0.3s ease forwards',
  },
  progress: {
    height: '4px',
    background: 'rgba(255,255,255,0.1)',
  },
  progressBar: {
    height: '100%',
    transition: 'width 0.5s ease',
  },
  finishedPanel: {
    textAlign: 'center',
    padding: '40px',
  },
  finishedIcon: {
    fontSize: '60px',
    marginBottom: '20px',
  },
  finishedTitle: {
    fontSize: '32px',
    marginBottom: '15px',
  },
  finishedText: {
    fontSize: '16px',
    opacity: 0.8,
    marginBottom: '30px',
    lineHeight: '1.6',
  },
  finishedActions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  actionButton: {
    padding: '15px 35px',
    border: 'none',
    borderRadius: '30px',
    color: 'white',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    fontWeight: '500',
  },
  playButton: {
    background: 'rgba(76,175,80,0.4)',
    borderColor: '#4CAF50',
    fontSize: '16px',
    padding: '14px 28px',
  },
};
