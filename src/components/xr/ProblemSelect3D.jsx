import { useState, useEffect } from "react";
import { Text, RoundedBox } from "@react-three/drei";
import Panel3D from "./Panel3D";
import Button3D from "./Button3D";
import VoiceWaveform3D from "./VoiceWaveform3D";
import useGameStore from "../../store/useGameStore";
import { selectProblem } from "../../services/chatService";
import ttsService from "../../services/ttsService";

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
 * ProblemSelect3D - Pilihan masalah dalam bentuk 3D untuk VR
 */
export default function ProblemSelect3D() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showOptions, setShowOptions] = useState(OPTIONS_DISPLAY_MODE === "instant");
  
  const problems = useGameStore((s) => s.problems);
  const problemRound = useGameStore((s) => s.problemRound);
  const selectedTopic = useGameStore((s) => s.selectedTopic);
  const currentResponse = useGameStore((s) => s.currentResponse);
  const currentAudio = useGameStore((s) => s.currentAudio);
  const ttsConfig = useGameStore((s) => s.ttsConfig);
  const handleBackendResponse = useGameStore((s) => s.handleBackendResponse);
  const setGameState = useGameStore((s) => s.setGameState);
  const setIsSpeaking = useGameStore((s) => s.setIsSpeaking);

  const message = currentResponse?.message || 'Pilih masalah yang paling menggambarkan kondisimu';
  const speechText = currentResponse?.speechText || message;

  // Auto-play audio saat masuk halaman atau round berubah
  useEffect(() => {
    // Stop previous audio
    ttsService.stop();

    // Reset showOptions berdasarkan mode
    if (OPTIONS_DISPLAY_MODE === "instant") {
      setShowOptions(true);
    } else {
      // Mode after_audio atau delayed - hide dulu
      setShowOptions(false);
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
  }, [currentAudio, ttsConfig, speechText, problemRound, setIsSpeaking]);

  const handleToggleAudio = () => {
    if (isPlaying) {
      ttsService.stop();
      setIsPlaying(false);
      setIsSpeaking(false);
      // Tampilkan options saat user stop audio manual
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
    try {
      const response = await selectProblem(problem.id);
      // Reset loading SEBELUM handle response agar UI responsive
      setIsLoading(false);
      handleBackendResponse(response);
    } catch (err) {
      console.error('Failed to select problem:', err);
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setGameState('topic_select');
  };

  // Calculate card positions
  const cardHeight = 0.18;
  const cardSpacing = 0.05;
  const startY = -0.1;

  return (
    <group position={[0, 0.0, 0.6]}>
      <Panel3D width={2.9} height={2.4} backgroundColor="#0a0a1a">
        {/* Progress */}
        <group position={[0, 0.90, 0.0]}>
          <Text fontSize={0.025} color="#888">
            Langkah {problemRound} dari 3
          </Text>
          <RoundedBox args={[0.8, 0.02, 0.01]} radius={0.005} position={[0, -0.04, 0]}>
            <meshStandardMaterial color="#333" />
          </RoundedBox>
          <RoundedBox 
            args={[0.8 * (problemRound / 3), 0.02, 0.015]} 
            radius={0.005}
            position={[-0.8 * (1 - problemRound / 3) / 2, -0.04, 0.005]}
          >
            <meshStandardMaterial color={currentColor} emissive={currentColor} emissiveIntensity={0.3} />
          </RoundedBox>
        </group>

        {/* Header */}
        <Text position={[0, 0.75, 0.02]} fontSize={0.06} color="white">
          {selectedTopic?.label || 'Pilih Masalah'}
        </Text>
        <Text 
          position={[0, 0.38, 0.02]} 
          fontSize={0.03} 
          color="white" 
          maxWidth={2.5}
          textAlign="justify"
        >
          {message}
        </Text>

        {/* Back Button */}
        <Button3D
          position={[-1.1, 0.85, 0.02]}
          size={[0.4, 0.09, 0.03]}
          color="#333"
          hoverColor="#555"
          text="← Kembali"
          textSize={0.025}
          onClick={handleBack}
        />

        {/* Audio Button - tampil jika TTS mode bukan 'off' */}
        {ttsConfig?.mode !== 'off' && (
          <Button3D
            position={[1.1, 0.85, 0.02]}
            size={[0.4, 0.08, 0.03]}
            color={isPlaying ? currentColor : "#333"}
            hoverColor={isPlaying ? currentColor : "#555"}
            text={isPlaying ? "🔊 ..." : "🔈 Putar"}
            textSize={0.025}
            onClick={handleToggleAudio}
          />
        )}

        {/* Loading indicator - saat memproses pilihan */}
        {isLoading && (
          <Text position={[0, 0, 0.02]} fontSize={0.04} color={currentColor}>
            {problemRound === 3 ? 'Menyiapkan cerita...' : 'Memproses...'}
          </Text>
        )}

        {/* Waiting for audio - saat audio sedang diputar dan options belum muncul */}
        {!isLoading && !showOptions && (
          <group position={[0, 0, 0.02]}>
            {/* Waveform saat audio playing, text saat loading */}
            {isPlaying ? (
              <VoiceWaveform3D 
                position={[0, 0.05, 0]} 
                color={currentColor} 
                isActive={isPlaying}
                barCount={7}
                maxHeight={0.12}
              />
            ) : (
              <Text position={[0, 0.05, 0]} fontSize={0.035} color="#aaa">
                ⏳ Memuat...
              </Text>
            )}
            {/* Skip Button */}
            <Button3D
              position={[0, -0.1, 0]}
              size={[0.5, 0.08, 0.03]}
              color="#555"
              hoverColor="#777"
              text="⏭️ Lewati"
              textSize={0.025}
              onClick={handleSkipAudio}
            />
          </group>
        )}

        {/* Problem Cards - muncul setelah audio selesai atau sesuai config */}
        {!isLoading && showOptions && problems.map((problem, index) => (
          <ProblemCard3D
            key={problem.id}
            problem={problem}
            color={currentColor}
            position={[0, startY - index * (cardHeight + cardSpacing), 0.02]}
            onSelect={() => handleSelectProblem(problem)}
          />
        ))}
      </Panel3D>
    </group>
  );
}

function ProblemCard3D({ problem, color, position, onSelect }) {
  return (
    <group position={position}>
      <Button3D
        position={[0, 0, 0 ]}
        size={[2.5, 0.16, 0.03]}
        color="#1a1a2e"
        hoverColor={color}
        text=""
        onClick={onSelect}
      />
      <Text
        position={[-1.15, 0.035, 0.025]}
        fontSize={0.032}
        color="white"
        anchorX="left"
        maxWidth={2.2}
      >
        {problem.label}
      </Text>
      <Text
        position={[-1.15, -0.025, 0.025]}
        fontSize={0.03}
        color="#888"
        anchorX="left"
        maxWidth={2.5}
      >
        {problem.description?.substring(0, 400)}...
      </Text>
    </group>
  );
}
