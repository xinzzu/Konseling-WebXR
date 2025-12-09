import { useState, useEffect, useRef } from "react";
import { Text, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useXR } from "@react-three/xr";
import Panel3D from "./Panel3D";
import Button3D from "./Button3D";
import useGameStore from "../../store/useGameStore";
import { resetSession, restartSession } from "../../services/chatService";
import backgroundMusic from "../../services/backgroundMusic";
import ttsService from "../../services/ttsService";

/**
 * Story3D - Panel cerita relaksasi dalam bentuk 3D untuk VR
 * Menampilkan FULL text dengan font kecil agar muat
 */
export default function Story3D() {
  const { isPresenting } = useXR();
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasFinished, setHasFinished] = useState(false);
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);

  const storyText = useGameStore((s) => s.storyText);
  const baseStoryMeta = useGameStore((s) => s.baseStoryMeta);
  const currentAudio = useGameStore((s) => s.currentAudio);
  const ttsConfig = useGameStore((s) => s.ttsConfig);
  const selectedTopic = useGameStore((s) => s.selectedTopic);
  const resetGame = useGameStore((s) => s.resetGame);
  const setGameState = useGameStore((s) => s.setGameState);
  const setIsSpeaking = useGameStore((s) => s.setIsSpeaking);
  const handleBackendResponse = useGameStore((s) => s.handleBackendResponse);
  const isInVR = useGameStore((s) => s.isInVR);

  // Topic colors
  const topicColors = {
    diri: "#66BB6A",
    sosial: "#42A5F5",
    alam: "#FFA726",
  };
  const currentColor = topicColors[selectedTopic?.id] || "#66BB6A";

  // Start background music on mount (hanya jika dalam VR)
  useEffect(() => {
    if (!isPresenting && !isInVR) return;
    
    backgroundMusic.playAmbient();
    setIsMusicPlaying(true);
    
    return () => {
      if (isPresenting || isInVR) {
        backgroundMusic.stop();
        ttsService.stop();
        setIsSpeaking(false);
      }
    };
  }, [setIsSpeaking, isPresenting, isInVR]);

  // Auto-play audio on load (hanya jika dalam VR)
  useEffect(() => {
    if (!isPresenting && !isInVR) return;
    
    const mode = ttsConfig?.mode || 'elevenlabs';
    if (mode === 'off') return;

    const timer = setTimeout(() => {
      handlePlayAudio();
    }, 500);

    return () => clearTimeout(timer);
  }, [isPresenting, isInVR]);

  const handlePlayAudio = () => {
    // Hanya handle audio jika dalam VR mode
    if (!isPresenting && !isInVR) return;
    
    const mode = ttsConfig?.mode || 'elevenlabs';
    if (mode === 'off') return;

    ttsService.play({
      ttsConfig,
      audio: currentAudio,
      speechText: storyText,
      onStart: () => {
        setIsPlaying(true);
        setIsSpeaking(true);
      },
      onEnd: () => {
        setIsPlaying(false);
        setIsSpeaking(false);
      },
      onError: (err) => {
        console.warn("TTS play error:", err);
        setIsPlaying(false);
        setIsSpeaking(false);
      },
    });
  };

  const handleStopAudio = () => {
    // Hanya handle jika dalam VR mode
    if (!isPresenting && !isInVR) return;
    
    ttsService.stop();
    setIsPlaying(false);
    setIsSpeaking(false);
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

  // Truncate text jika terlalu panjang untuk VR (max ~2000 chars)
  const displayText = storyText
    ? storyText.length > 2000
      ? storyText.substring(0, 2000) + "..."
      : storyText
    : "Cerita sedang dimuat...";

  return (
    <group position={[0, 0.0, 0.9]}>
      <Panel3D width={2.2} height={1.9} backgroundColor="#0a0a1a">
        {/* Header */}
        <group position={[0, 0.82, 0.02]}>
          <RoundedBox args={[0.6, 0.07, 0.02]} radius={0.01}>
            <meshStandardMaterial color={currentColor} />
          </RoundedBox>
          <Text position={[0, 0, 0.015]} fontSize={0.030} color="black">
            {selectedTopic?.label || "Cerita Relaksasi"}
          </Text>
        </group>

        {baseStoryMeta && (
          <Text position={[0, 0.7, 0.02]} fontSize={0.050} color="white">
            {baseStoryMeta.title}
          </Text>
        )}

        {/* Voice Indicator */}
        <VoiceIndicator3D
          position={[0, 0.6, 0.02]}
          isActive={isPlaying}
          color={currentColor}
        />

        {/* Story Text Box - Full text dengan font kecil */}
        <group position={[0, 0.05, 0.02]}>
          <RoundedBox args={[2.05, 0.9, 0.02]} radius={0.02}>
            <meshStandardMaterial color="#1a1a2e" />
          </RoundedBox>
          <Text
            position={[0, 0, 0.015]}
            fontSize={0.028}
            color="white"
            maxWidth={1.95}
            textAlign="left"
            lineHeight={1.4}
            anchorX="center"
            anchorY="middle"
          >
            {displayText}
          </Text>
        </group>

        {/* Controls */}
        {!hasFinished ? (
          <group position={[0, -0.55, 0.02]}>
            {/* Play/Stop Narration */}
            <Button3D
              position={[-0.55, 0, 0]}
              size={[0.45, 0.09, 0.03]}
              color={isPlaying ? "#ff5252" : currentColor}
              hoverColor={isPlaying ? "#ff7070" : currentColor}
              text={isPlaying ? "⏹️ Stop" : "🔊 Narasi"}
              textSize={0.022}
              onClick={isPlaying ? handleStopAudio : handlePlayAudio}
            />

            {/* Toggle Background Music */}
            <Button3D
              position={[0, 0, 0]}
              size={[0.45, 0.09, 0.03]}
              color={isMusicPlaying ? "#9C27B0" : "#555"}
              hoverColor={isMusicPlaying ? "#BA68C8" : "#777"}
              text={isMusicPlaying ? "🎵 ON" : "🔇 OFF"}
              textSize={0.022}
              onClick={handleToggleMusic}
            />

            {/* Finish Button */}
            <Button3D
              position={[0.55, 0, 0]}
              size={[0.45, 0.09, 0.03]}
              color="#4CAF50"
              hoverColor="#66BB6A"
              text="✓ Selesai"
              textSize={0.022}
              onClick={handleFinish}
            />
          </group>
        ) : (
          /* Finished State */
          <group position={[0, -0.5, 0.02]}>
            <Text position={[0, 0.18, 0]} fontSize={0.02} color="white">
              ✨ Sesi selesai. Semoga kamu merasa lebih tenang.
            </Text>
            <Button3D
              position={[0, 0.05, 0]}
              size={[0.75, 0.08, 0.03]}
              color={currentColor}
              hoverColor={currentColor}
              text={`🔄 Ulangi: ${selectedTopic?.label || "Topik"}`}
              textSize={0.02}
              onClick={handleRestartSameTopic}
            />
            <Button3D
              position={[0, -0.06, 0]}
              size={[0.75, 0.08, 0.03]}
              color="#2196F3"
              hoverColor="#42A5F5"
              text="📝 Pilih Topik Lain"
              textSize={0.02}
              onClick={handleRestartNewTopic}
            />
            <Button3D
              position={[0, -0.17, 0]}
              size={[0.75, 0.08, 0.03]}
              color="#555"
              hoverColor="#777"
              text="🏠 Menu Utama"
              textSize={0.02}
              onClick={handleBackToMenu}
            />
          </group>
        )}
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
          position={[(i - 3) * 0.035, 0, 0]}
        >
          <boxGeometry args={[0.018, 0.035, 0.01]} />
          <meshStandardMaterial
            color={isActive ? color : "#444"}
            emissive={isActive ? color : "#000"}
            emissiveIntensity={isActive ? 0.3 : 0}
          />
        </mesh>
      ))}
      <Text position={[0, -0.04, 0]} fontSize={0.014} color="#888">
        {isActive ? "Berbicara..." : ""}
      </Text>
    </group>
  );
}
