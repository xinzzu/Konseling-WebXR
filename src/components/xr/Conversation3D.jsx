import React, { useEffect, useState, useCallback, useRef } from "react";
import { Text, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import Panel3D from "./Panel3D";
import Button3D from "./Button3D";
import useGameStore from "../../store/useGameStore";
import speechService from "../../services/speechService";
import backgroundMusic from "../../services/backgroundMusic";

/**
 * Conversation3D - Panel percakapan dalam bentuk 3D untuk VR
 */
export default function Conversation3D() {
  const selectedTopic = useGameStore((s) => s.selectedTopic);
  const conversations = useGameStore((s) => s.conversations);
  const currentIndex = useGameStore((s) => s.currentConversationIndex);
  const nextConversation = useGameStore((s) => s.nextConversation);
  const addUserResponse = useGameStore((s) => s.addUserResponse);
  const setGameState = useGameStore((s) => s.setGameState);
  const resetGame = useGameStore((s) => s.resetGame);
  const startSession = useGameStore((s) => s.startSession);
  const setIsSpeakingGlobal = useGameStore((s) => s.setIsSpeaking);

  const [isSpeaking, setIsSpeakingLocal] = useState(false);
  const [showChoices, setShowChoices] = useState(false);
  const [hasSpoken, setHasSpoken] = useState(false);
  const [needsFirstClick, setNeedsFirstClick] = useState(true);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const lastSpokenIndex = useRef(-1);
  
  // Sync isSpeaking ke global store untuk NPC
  const setIsSpeaking = useCallback((speaking) => {
    setIsSpeakingLocal(speaking);
    setIsSpeakingGlobal(speaking);
  }, [setIsSpeakingGlobal]);

  const currentMessage = conversations[currentIndex];
  const isUserChoice = currentMessage?.role === 'user_choice';
  const isFinished = currentIndex >= conversations.length || !currentMessage;

  // Setup speech callbacks
  useEffect(() => {
    speechService.setSpeakingCallback(setIsSpeaking);
    return () => speechService.stop();
  }, []);

  // Start background music saat conversation dimulai
  useEffect(() => {
    // Mulai musik relaksasi saat conversation aktif
    if (selectedTopic && !isFinished) {
      backgroundMusic.playAmbient();
    }
    
    // Stop musik saat unmount atau selesai
    return () => {
      // Jangan stop langsung, biarkan musik terus berjalan sampai user keluar
    };
  }, [selectedTopic]);

  // Speak function
  const speakMessage = useCallback((text) => {
    if (!text) return;
    setNeedsFirstClick(false);
    
    speechService.speak(text, {
      onEnd: () => {
        setIsSpeaking(false);
        setHasSpoken(true);
        const nextMsg = conversations[currentIndex + 1];
        if (nextMsg?.role === 'user_choice') {
          setTimeout(() => setShowChoices(true), 400);
        }
      }
    }).catch(() => {
      setIsSpeaking(false);
      setHasSpoken(true);
    });
  }, [conversations, currentIndex]);

  // Auto-speak after first interaction
  useEffect(() => {
    console.log('Conversation3D useEffect:', {
      currentIndex,
      currentMessageRole: currentMessage?.role,
      needsFirstClick,
      lastSpokenIndex: lastSpokenIndex.current,
      totalConversations: conversations.length
    });
    
    if (currentMessage?.role === 'assistant' && !needsFirstClick && lastSpokenIndex.current !== currentIndex) {
      lastSpokenIndex.current = currentIndex;
      setShowChoices(false);
      setHasSpoken(false);
      setTimeout(() => speakMessage(currentMessage.text), 300);
    } else if (isUserChoice) {
      setShowChoices(true);
    }
  }, [currentIndex, currentMessage, isUserChoice, needsFirstClick, speakMessage]);

  const handleFirstPlay = () => {
    if (currentMessage?.text) {
      lastSpokenIndex.current = currentIndex;
      speakMessage(currentMessage.text);
    }
  };

  const handleChoice = (choice) => {
    console.log('handleChoice called:', { choice, currentIndex });
    addUserResponse(choice);
    setShowChoices(false);
    setHasSpoken(false);
    lastSpokenIndex.current = -1;
    
    // Saat ini currentIndex menunjuk ke assistant message
    // Pilihan ditampilkan dari conversations[currentIndex + 1] (user_choice)
    // Kita perlu loncat ke conversations[currentIndex + 2] (assistant berikutnya)
    // Jadi perlu 2x nextConversation:
    // 1. currentIndex -> currentIndex + 1 (user_choice)
    // 2. currentIndex + 1 -> currentIndex + 2 (assistant)
    const moved1 = nextConversation(); // pindah ke user_choice
    console.log('After first nextConversation:', { moved1 });
    const hasMore = nextConversation(); // pindah ke assistant berikutnya
    console.log('After second nextConversation:', { hasMore });
    
    if (!hasMore) {
      // Tidak ada lagi conversation, tampilkan finished screen
      console.log('Setting gameState to finished');
      setGameState('finished');
    }
  };

  const handleContinue = () => {
    speechService.stop();
    setHasSpoken(false);
    lastSpokenIndex.current = -1;
    
    // Cek apakah ini pesan terakhir
    const nextMsg = conversations[currentIndex + 1];
    
    if (!nextMsg) {
      // Tidak ada pesan lagi, selesai!
      console.log('No more messages, finishing conversation');
      setGameState('finished');
      return;
    }
    
    if (nextMsg?.role === 'user_choice') {
      setShowChoices(true);
    } else {
      const hasNext = nextConversation();
      if (!hasNext) setGameState('finished');
    }
  };

  const handleReplay = () => {
    if (currentMessage?.text) speakMessage(currentMessage.text);
  };

  const handleExit = () => {
    speechService.stop();
    backgroundMusic.stop(); // Stop musik saat keluar
    resetGame();
  };

  const handleRestart = () => {
    speechService.stop();
    const topic = selectedTopic;
    resetGame();
    setTimeout(() => startSession(topic), 100);
  };

  const handleDifferentTopic = () => {
    speechService.stop();
    // Biarkan musik tetap berjalan saat pindah topik
    setGameState('topic_select');
    useGameStore.setState({
      selectedTopic: null,
      conversations: [],
      currentConversationIndex: 0,
      userResponses: [],
    });
  };

  // Toggle background music
  const handleToggleMusic = () => {
    backgroundMusic.toggleMute();
    setIsMusicMuted(!isMusicMuted);
  };

  // Gunakan selector untuk gameState agar reaktif
  const gameState = useGameStore((s) => s.gameState);
  
  // Finished Screen - tampil saat conversation selesai
  const showFinished = gameState === 'finished' || !selectedTopic || isFinished;
  
  if (showFinished) {
    return (
      // === KUSTOMISASI POSISI PANEL FINISHED ===
      // position={[x, y, z]} dimana:
      // - x: posisi horizontal (kiri/kanan), 0 = tengah
      // - y: TINGGI panel, 1.8 = eye level VR
      // - z: jarak dari user, -1.5 = 1.5 meter di depan
      <group position={[0, 1.8, -1.5]}>
        <Panel3D width={1.6} height={1.2} backgroundColor="#0a0a1a">
          <Text position={[0, 0.4, 0.02]} fontSize={0.12}>
            ✨
          </Text>
          <Text position={[0, 0.22, 0.02]} fontSize={0.08} color="white">
            Sesi Selesai!
          </Text>
          <Text position={[0, 0.05, 0.02]} fontSize={0.03} color="#aaa" maxWidth={1.3} textAlign="center">
            Terima kasih sudah mau berbagi.{'\n'}Ingat, kamu tidak sendirian!
          </Text>
          
          {/* Ulangi Topik - restart dengan topik yang sama */}
          <Button3D 
            position={[0, -0.12, 0.02]} 
            size={[0.7, 0.1, 0.03]} 
            color="#4CAF50" 
            hoverColor="#66BB6A" 
            text={`🔄 Ulangi: ${selectedTopic?.label || 'Topik'}`}
            textSize={0.028} 
            onClick={handleRestart} 
          />
          
          {/* Pilih Topik Lain - kembali ke topic select */}
          <Button3D 
            position={[0, -0.26, 0.02]} 
            size={[0.7, 0.1, 0.03]} 
            color="#2196F3" 
            hoverColor="#42A5F5" 
            text="📝 Pilih Topik Lain" 
            textSize={0.028} 
            onClick={handleDifferentTopic} 
          />
          
          {/* Menu Utama - kembali ke start screen */}
          <Button3D 
            position={[0, -0.40, 0.02]} 
            size={[0.7, 0.1, 0.03]} 
            color="#555" 
            hoverColor="#777" 
            text="🏠 Menu Utama" 
            textSize={0.028} 
            onClick={handleExit} 
          />
        </Panel3D>
      </group>
    );
  }

  const nextIsChoice = conversations[currentIndex + 1]?.role === 'user_choice';
  const progress = (currentIndex + 1) / conversations.length;

  return (
    // === KUSTOMISASI POSISI PANEL UTAMA ===
    // position={[x, y, z]} dimana:
    // - x: posisi horizontal (kiri/kanan), 0 = tengah
    // - y: TINGGI panel, 1.8 = eye level VR (ubah ke 2.0 untuk lebih tinggi)
    // - z: jarak dari user, -1.5 = 1.5 meter di depan
    <group position={[0, 1.8, -1.5]}>
      {/* Main Container Panel */}
      <Panel3D 
        position={[0, 0, 0]} 
        width={1.8} 
        height={1.4} 
        backgroundColor="#0a0a1a"
      >
        {/* Topic Badge - top */}
        <group position={[0, 0.55, 0.02]}>
          <RoundedBox args={[0.5, 0.08, 0.02]} radius={0.02}>
            <meshStandardMaterial color={selectedTopic.color} />
          </RoundedBox>
          <Text position={[0, 0, 0.015]} fontSize={0.03} color="white">
            {selectedTopic.label}
          </Text>
        </group>

        {/* Exit Button - top right */}
        <Button3D
          position={[0.75, 0.55, 0.02]}
          size={[0.12, 0.08, 0.03]}
          color="#ff4444"
          hoverColor="#ff6666"
          text="✕"
          textSize={0.04}
          onClick={handleExit}
        />

        {/* Music Toggle Button - di sebelah kiri exit */}
        <Button3D
          position={[0.58, 0.55, 0.02]}
          size={[0.12, 0.08, 0.03]}
          color={isMusicMuted ? "#555" : "#9C27B0"}
          hoverColor={isMusicMuted ? "#777" : "#BA68C8"}
          text={isMusicMuted ? "🔇" : "🎵"}
          textSize={0.04}
          onClick={handleToggleMusic}
        />

        {/* Voice Indicator */}
        <VoiceIndicator3D position={[0, 0.38, 0.02]} isActive={isSpeaking} color={selectedTopic.color} />

        {/* Message Content */}
        {currentMessage?.role === 'assistant' && (
          <group position={[0, 0.05, 0.02]}>
            {/* Message Text Box */}
            <RoundedBox args={[1.6, 0.4, 0.02]} radius={0.02}>
              <meshStandardMaterial color="#1a1a2e" />
            </RoundedBox>
            <Text
              position={[0, 0, 0.02]}
              fontSize={0.032}
              color="white"
              maxWidth={1.45}
              textAlign="center"
              lineHeight={1.4}
            >
              {currentMessage.text}
            </Text>
          </group>
        )}

        {/* Control Buttons - HANYA tampil jika TIDAK ada pilihan */}
        {!(showChoices && nextIsChoice) && (
          <group position={[0, -0.22, 0.02]}>
            {needsFirstClick && !hasSpoken && (
              <Button3D
                position={[0, 0, 0]}
                size={[0.45, 0.1, 0.03]}
                color="#4CAF50"
                hoverColor="#66BB6A"
                text="▶️ Putar"
                textSize={0.035}
                onClick={handleFirstPlay}
              />
            )}
            
            {!needsFirstClick && (
              <>
                <Button3D
                  position={[-0.28, 0, 0]}
                  size={[0.4, 0.09, 0.03]}
                  color="#555"
                  hoverColor="#777"
                  text={isSpeaking ? "🔊..." : "🔈 Ulang"}
                  textSize={0.028}
                  onClick={handleReplay}
                  disabled={isSpeaking}
                />
                {hasSpoken && !nextIsChoice && (
                  <Button3D
                    position={[0.28, 0, 0]}
                    size={[0.4, 0.09, 0.03]}
                    color="#2196F3"
                    hoverColor="#42A5F5"
                    text="Lanjut →"
                    textSize={0.028}
                    onClick={handleContinue}
                  />
                )}
              </>
            )}
          </group>
        )}

        {/* User Choices - Tampil sebagai pengganti control buttons */}
        {showChoices && nextIsChoice && (
          <group position={[0, -0.18, 0.02]}>
            <Text position={[0, 0.08, 0]} fontSize={0.025} color="#aaa">
              Pilih responsmu:
            </Text>
            {conversations[currentIndex + 1].options.map((option, idx) => (
              <Button3D
                key={idx}
                position={[0, -0.02 - idx * 0.11, 0]}
                size={[1.5, 0.09, 0.03]}
                color="#222"
                hoverColor={selectedTopic.color}
                text={option}
                textSize={0.025}
                onClick={() => handleChoice(option)}
              />
            ))}
          </group>
        )}

        {/* Progress Bar - bottom */}
        <group position={[0, -0.6, 0.02]}>
          <Text position={[0, 0.04, 0]} fontSize={0.02} color="#666">
            Progress: {Math.round(progress * 100)}%
          </Text>
          <RoundedBox args={[1.5, 0.025, 0.01]} radius={0.005}>
            <meshStandardMaterial color="#333" />
          </RoundedBox>
          <RoundedBox 
            args={[1.5 * progress, 0.025, 0.015]} 
            radius={0.005}
            position={[-1.5 * (1 - progress) / 2, 0, 0.005]}
          >
            <meshStandardMaterial color={selectedTopic.color} emissive={selectedTopic.color} emissiveIntensity={0.3} />
          </RoundedBox>
        </group>
      </Panel3D>
    </group>
  );
}

/**
 * VoiceIndicator3D - Indikator suara 3D
 */
function VoiceIndicator3D({ position, isActive, color }) {
  const barsRef = useRef([]);
  
  useFrame(({ clock }) => {
    if (!isActive) return;
    barsRef.current.forEach((bar, i) => {
      if (bar) {
        const scale = 0.3 + Math.sin(clock.elapsedTime * 8 + i * 0.5) * 0.7;
        bar.scale.y = Math.max(0.2, scale);
      }
    });
  });

  return (
    <group position={position}>
      {[...Array(7)].map((_, i) => (
        <mesh
          key={i}
          ref={(el) => (barsRef.current[i] = el)}
          position={[(i - 3) * 0.04, 0, 0]}
        >
          <boxGeometry args={[0.02, 0.05, 0.01]} />
          <meshStandardMaterial 
            color={isActive ? color : "#444"} 
            emissive={isActive ? color : "#000"}
            emissiveIntensity={isActive ? 0.3 : 0}
          />
        </mesh>
      ))}
      <Text position={[0, -0.06, 0]} fontSize={0.02} color="#888">
        {isActive ? "Berbicara..." : "Menunggu..."}
      </Text>
    </group>
  );
}
