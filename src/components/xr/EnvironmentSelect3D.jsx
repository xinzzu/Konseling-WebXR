import React from "react";
import { Text, RoundedBox } from "@react-three/drei";
import Panel3D from "./Panel3D";
import Button3D from "./Button3D";
import useGameStore from "../../store/useGameStore";
import { ENVIRONMENTS } from "./environments";

/**
 * EnvironmentSelect3D - Pilihan environment dalam bentuk 3D untuk VR
 */
export default function EnvironmentSelect3D() {
  const setSelectedEnvironment = useGameStore((s) => s.setSelectedEnvironment);
  const selectedEnvironment = useGameStore((s) => s.selectedEnvironment);
  const setGameState = useGameStore((s) => s.setGameState);

  const handleSelectEnvironment = (envId) => {
    setSelectedEnvironment(envId);
    setGameState('topic_select');
  };

  const handleBack = () => {
    setGameState('start');
  };

  // Calculate positions for environment cards
  const cardWidth = 0.55;
  const cardSpacing = 0.12;
  const totalWidth = ENVIRONMENTS.length * cardWidth + (ENVIRONMENTS.length - 1) * cardSpacing;
  const startX = -totalWidth / 2 + cardWidth / 2;

  return (
    // === KUSTOMISASI POSISI PANEL ===
    // position={[x, y, z]} dimana:
    // - x: posisi horizontal (kiri/kanan), 0 = tengah
    // - y: TINGGI panel, tambah nilai untuk naik (misal 1.8 lebih tinggi dari 1.5)
    // - z: jarak dari user, nilai negatif = di depan user (-1.5 = 1.5 meter di depan)
    <group position={[0, 1.5, -1.5]}>
      {/* Main Container Panel */}
      <Panel3D
        position={[0, 0, 0]}
        width={2.2}
        height={1.4}
        backgroundColor="#0a0a1a"
      >
        {/* Header */}
        <Text
          position={[0, 0.52, 0.02]}
          fontSize={0.08}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          🌍 Pilih Suasana
        </Text>
        <Text
          position={[0, 0.4, 0.02]}
          fontSize={0.03}
          color="#aaaaaa"
          anchorX="center"
          anchorY="middle"
        >
          Pilih tempat yang membuatmu nyaman
        </Text>

        {/* Back Button - Kiri Atas */}
        <Button3D
          position={[-0.85, 0.55, 0.02]}
          size={[0.32, 0.08, 0.03]}
          color="#333333"
          hoverColor="#555555"
          text="← Kembali"
          textSize={0.03}
          onClick={handleBack}
        />

        {/* Environment Cards */}
        {ENVIRONMENTS.map((env, index) => (
          <EnvironmentCard3D
            key={env.id}
            environment={env}
            position={[startX + index * (cardWidth + cardSpacing), -0.05, 0.02]}
            isSelected={selectedEnvironment === env.id}
            onSelect={() => handleSelectEnvironment(env.id)}
          />
        ))}
      </Panel3D>
    </group>
  );
}

/**
 * EnvironmentCard3D - Card untuk setiap environment
 */
function EnvironmentCard3D({ environment, position, isSelected, onSelect }) {
  return (
    <group position={position}>
      {/* Card Background - selalu gelap */}
      <RoundedBox 
        args={[0.52, 0.7, 0.02]} 
        radius={0.03}
      >
        <meshStandardMaterial 
          color="#1a1a2e"
          emissive={isSelected ? environment.color : "#000"}
          emissiveIntensity={isSelected ? 0.15 : 0}
        />
      </RoundedBox>

      {/* Selected border/outline */}
      {isSelected && (
        <RoundedBox 
          args={[0.56, 0.74, 0.01]} 
          radius={0.035}
          position={[0, 0, -0.01]}
        >
          <meshStandardMaterial 
            color={environment.color}
            emissive={environment.color}
            emissiveIntensity={0.5}
          />
        </RoundedBox>
      )}

      {/* Colored top bar */}
      <mesh position={[0, 0.28, 0.016]}>
        <boxGeometry args={[0.48, 0.1, 0.01]} />
        <meshStandardMaterial 
          color={environment.color} 
          emissive={environment.color}
          emissiveIntensity={0.3}
        />
      </mesh>

      {/* Icon background circle */}
      <mesh position={[0, 0.1, 0.025]}>
        <circleGeometry args={[0.065, 32]} />
        <meshStandardMaterial 
          color={environment.color} 
          transparent
          opacity={0.2}
        />
      </mesh>
      
      {/* Icon */}
      <Text
        position={[0, 0.1, 0.03]}
        fontSize={0.07}
        anchorX="center"
        anchorY="middle"
      >
        {environment.icon}
      </Text>

      {/* Label */}
      <Text
        position={[0, -0.02, 0.03]}
        fontSize={0.045}
        color="#ffffff"
        anchorX="center"
        anchorY="middle"
        maxWidth={0.48}
        textAlign="center"
        fontWeight="bold"
      >
        {environment.label}
      </Text>

      {/* Description */}
      <Text
        position={[0, -0.12, 0.03]}
        fontSize={0.022}
        color="#aaaaaa"
        anchorX="center"
        anchorY="middle"
        maxWidth={0.45}
        textAlign="center"
        lineHeight={1.3}
      >
        {environment.description}
      </Text>

      {/* Select Button */}
      <Button3D
        position={[0, -0.27, 0.03]}
        size={[0.4, 0.08, 0.03]}
        color={isSelected ? "#333333" : environment.color}
        hoverColor={isSelected ? "#555555" : environment.color}
        text={isSelected ? "✓ Terpilih" : "Pilih"}
        textSize={0.028}
        onClick={onSelect}
      />
    </group>
  );
}
