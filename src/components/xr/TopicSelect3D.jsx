import { useState, useEffect } from "react";
import { Text, RoundedBox } from "@react-three/drei";
import Panel3D from "./Panel3D";
import Button3D from "./Button3D";
import VoiceWaveform3D from "./VoiceWaveform3D";
import useGameStore from "../../store/useGameStore";
import { selectTopic } from "../../services/chatService";
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
 * TopicSelect3D - Pilihan topik dalam bentuk 3D untuk VR
 * Data topik diambil dari backend response
 */
// Fallback topics kalau backend belum response
const FALLBACK_TOPICS = [
  { id: 'diri', label: 'Damai dengan Diri', description: 'Ketenangan batin, penerimaan diri, keseimbangan emosi, dan kemampuan mengelola stres.' },
  { id: 'sosial', label: 'Damai dengan Sosial', description: 'Kemampuan hidup rukun, menghargai perbedaan, dan berempati dalam interaksi sosial.' },
  { id: 'alam', label: 'Damai dengan Alam', description: 'Hubungan harmonis dengan lingkungan hidup, kepedulian, dan perilaku ramah lingkungan.' },
];

export default function TopicSelect3D() {
  const [isLoading, setIsLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [showOptions, setShowOptions] = useState(OPTIONS_DISPLAY_MODE === "instant");
  
  const topicsFromStore = useGameStore((s) => s.topics);
  const currentResponse = useGameStore((s) => s.currentResponse);
  const currentAudio = useGameStore((s) => s.currentAudio);
  const ttsConfig = useGameStore((s) => s.ttsConfig);
  const setSelectedTopic = useGameStore((s) => s.setSelectedTopic);
  const handleBackendResponse = useGameStore((s) => s.handleBackendResponse);
  const setGameState = useGameStore((s) => s.setGameState);
  const setIsSpeaking = useGameStore((s) => s.setIsSpeaking);

  // Gunakan topics dari store, atau fallback jika kosong
  const topics = topicsFromStore?.length > 0 ? topicsFromStore : FALLBACK_TOPICS;

  const message = currentResponse?.message || 'Pilih area kedamaian yang ingin kamu fokuskan';
  const speechText = currentResponse?.speechText || message;

  // Auto-play audio saat masuk halaman
  useEffect(() => {
    ttsService.stop();
    
    // Reset showOptions jika bukan instant
    if (OPTIONS_DISPLAY_MODE !== "instant") {
      setShowOptions(false);
    } else {
      setShowOptions(true);
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
  }, [currentAudio, ttsConfig, speechText, setIsSpeaking]);

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

  // Topic colors & icons mapping
  const topicColors = {
    diri: '#66BB6A',
    sosial: '#42A5F5', 
    alam: '#FFA726',
  };
  const topicIcons = {
    diri: '🧘',
    sosial: '👥',
    alam: '🌿',
  };

  const handleSelectTopic = async (topic) => {
    setIsLoading(true);
    setSelectedTopic(topic);
    
    try {
      const response = await selectTopic(topic.id);
      // Reset loading SEBELUM handle response agar UI responsive
      setIsLoading(false);
      handleBackendResponse(response);
    } catch (err) {
      console.error('Failed to select topic:', err);
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    setGameState('environment_select');
  };

  if (isLoading) {
    return (
      <group position={[0, 1.5, -2]}>
        <Text fontSize={0.08} color="white" anchorX="center" anchorY="middle">
          Memproses pilihan...
        </Text>
      </group>
    );
  }

  // Calculate positions for topic cards
  const cardWidth = 0.55;
  const cardSpacing = 0.1;
  const totalWidth = topics.length * cardWidth + (topics.length - 1) * cardSpacing;
  const startX = -totalWidth / 2 + cardWidth / 2;

  return (
    // === KUSTOMISASI POSISI PANEL ===
    // position={[x, y, z]} dimana:
    // - x: posisi horizontal (kiri/kanan), 0 = tengah
    // - y: TINGGI panel, 1.8 = eye level VR (ubah ke 2.0 untuk lebih tinggi)
    // - z: jarak dari user, -1.5 = 1.5 meter di depan
    <group position={[0, 1.8, -1.0]}>
      {/* Container Panel - membungkus semua elemen */}
      <Panel3D
        position={[0, 0, 0]}
        width={2.2}
        height={1.5}
        backgroundColor="#0a0a1a"
      >
        {/* Header Title */}
        <Text
          position={[0, 0.55, 0.02]}
          fontSize={0.08}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          Pilih Area Kedamaian
        </Text>
        <Text
          position={[0, 0.42, 0.02]}
          fontSize={0.025}
          color="#aaaaaa"
          anchorX="center"
          anchorY="middle"
          maxWidth={2}
          textAlign="center"
        >
          {message}
        </Text>

        {/* Waiting for audio - saat audio sedang diputar dan options belum muncul */}
        {!showOptions && (
          <group position={[0, -0.05, 0.02]}>
            {/* Waveform saat audio playing, text saat loading */}
            {isPlaying ? (
              <VoiceWaveform3D 
                position={[0, 0.1, 0]} 
                color="#42A5F5" 
                isActive={isPlaying}
                barCount={7}
                maxHeight={0.12}
              />
            ) : (
              <Text position={[0, 0.1, 0]} fontSize={0.04} color="#aaa">
                ⏳ Memuat...
              </Text>
            )}
            {/* Skip Button */}
            <Button3D
              position={[0, -0.05, 0]}
              size={[0.5, 0.1, 0.03]}
              color="#555"
              hoverColor="#777"
              text="⏭️ Lewati"
              textSize={0.03}
              onClick={handleSkipAudio}
            />
          </group>
        )}

        {/* Topic Cards - muncul setelah audio selesai atau sesuai config */}
        {showOptions && topics.map((topic, index) => (
          <TopicCard3D
            key={topic.id}
            topic={topic}
            color={topicColors[topic.id] || '#666'}
            icon={topicIcons[topic.id] || '💭'}
            position={[startX + index * (cardWidth + cardSpacing), -0.05, 0.02]}
            onSelect={() => handleSelectTopic(topic)}
          />
        ))}

        {/* Back Button */}
        <Button3D
          position={[-0.80, 0.55, 0.02]}
          size={[0.5, 0.1, 0.03]}
          color="#333333"
          hoverColor="#555555"
          text="← Kembali"
          textSize={0.035}
          onClick={handleBack}
        />

        {/* Audio Button */}
        {ttsConfig?.mode !== 'off' && (
          <Button3D
            position={[0.80, 0.55, 0.02]}
            size={[0.4, 0.1, 0.03]}
            color={isPlaying ? "#42A5F5" : "#333333"}
            hoverColor={isPlaying ? "#42A5F5" : "#555555"}
            text={isPlaying ? "🔊 ..." : "🔈 Putar"}
            textSize={0.03}
            onClick={handleToggleAudio}
          />
        )}
      </Panel3D>
    </group>
  );
}

/**
 * TopicCard3D - Card untuk setiap topik (inner card, tanpa Panel3D terpisah)
 */
function TopicCard3D({ topic, position, onSelect, color, icon }) {
  return (
    <group position={position}>
      {/* Card background */}
      <RoundedBox args={[0.55, 0.7, 0.02]} radius={0.03}>
        <meshStandardMaterial color="#1a1a2e" />
      </RoundedBox>
      
      {/* Colored top bar */}
      <mesh position={[0, 0.28, 0.02]}>
        <boxGeometry args={[0.53, 0.1, 0.01]} />
        <meshStandardMaterial color={color} />
      </mesh>

      {/* Icon */}
      <Text
        position={[0, 0.12, 0.03]}
        fontSize={0.1}
        anchorX="center"
        anchorY="middle"
      >
        {icon}
      </Text>

      {/* Label */}
      <Text
        position={[0, -0.02, 0.03]}
        fontSize={0.045}
        color="white"
        anchorX="center"
        anchorY="middle"
        maxWidth={0.5}
        textAlign="center"
      >
        {topic.label}
      </Text>

      {/* Description */}
      <Text
        position={[0, -0.14, 0.03]}
        fontSize={0.02}
        color="#aaaaaa"
        anchorX="center"
        anchorY="middle"
        maxWidth={0.48}
        textAlign="center"
        lineHeight={1.2}
      >
        {topic.description?.substring(0, 60)}...
      </Text>

      {/* Select Button */}
      <Button3D
        position={[0, -0.27, 0.03]}
        size={[0.4, 0.09, 0.03]}
        color={color}
        hoverColor={color}
        text="Pilih"
        textSize={0.032}
        onClick={onSelect}
      />
    </group>
  );
}
