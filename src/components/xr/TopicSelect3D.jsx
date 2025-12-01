import React, { useEffect, useState } from "react";
import { Text, RoundedBox } from "@react-three/drei";
import Panel3D from "./Panel3D";
import Button3D from "./Button3D";
import useGameStore from "../../store/useGameStore";
import { loadTopics } from "../../services/dataService";

/**
 * TopicSelect3D - Pilihan topik dalam bentuk 3D untuk VR
 */
export default function TopicSelect3D() {
  const [loading, setLoading] = useState(true);
  
  const topics = useGameStore((s) => s.topics);
  const setTopics = useGameStore((s) => s.setTopics);
  const startSession = useGameStore((s) => s.startSession);
  const setGameState = useGameStore((s) => s.setGameState);

  useEffect(() => {
    async function fetchTopics() {
      try {
        const data = await loadTopics();
        setTopics(data);
      } catch (err) {
        console.error('Failed to load topics:', err);
      }
      setLoading(false);
    }
    
    if (topics.length === 0) {
      fetchTopics();
    } else {
      setLoading(false);
    }
  }, [topics.length, setTopics]);

  const handleSelectTopic = (topic) => {
    startSession(topic);
  };

  const handleBack = () => {
    // Kembali ke environment select
    setGameState('environment_select');
  };

  if (loading) {
    return (
      <group position={[0, 1.5, -2]}>
        <Text
          fontSize={0.08}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          Memuat topik...
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
    <group position={[0, 1.8, -1.5]}>
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
          Pilih Topik Konseling
        </Text>
        <Text
          position={[0, 0.42, 0.02]}
          fontSize={0.03}
          color="#aaaaaa"
          anchorX="center"
          anchorY="middle"
        >
          Pilih topik yang ingin kamu bicarakan
        </Text>

        {/* Topic Cards - di dalam panel utama */}
        {topics.map((topic, index) => (
          <TopicCard3D
            key={topic.id}
            topic={topic}
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
      </Panel3D>
    </group>
  );
}

/**
 * TopicCard3D - Card untuk setiap topik (inner card, tanpa Panel3D terpisah)
 */
function TopicCard3D({ topic, position, onSelect }) {
  const icons = {
    akademik: '📚',
    sosial: '👥',
    keluarga: '🏠',
  };

  return (
    <group position={position}>
      {/* Card background */}
      <RoundedBox args={[0.55, 0.7, 0.02]} radius={0.03}>
        <meshStandardMaterial color="#1a1a2e" />
      </RoundedBox>
      
      {/* Colored top bar */}
      <mesh position={[0, 0.28, 0.02]}>
        <boxGeometry args={[0.53, 0.1, 0.01]} />
        <meshStandardMaterial color={topic.color} />
      </mesh>

      {/* Icon */}
      <Text
        position={[0, 0.12, 0.03]}
        fontSize={0.1}
        anchorX="center"
        anchorY="middle"
      >
        {icons[topic.id] || '💭'}
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
        fontSize={0.022}
        color="#aaaaaa"
        anchorX="center"
        anchorY="middle"
        maxWidth={0.48}
        textAlign="center"
      >
        {topic.description}
      </Text>

      {/* Select Button */}
      <Button3D
        position={[0, -0.27, 0.03]}
        size={[0.4, 0.09, 0.03]}
        color={topic.color}
        hoverColor={topic.color}
        text="Pilih"
        textSize={0.032}
        onClick={onSelect}
      />
    </group>
  );
}
