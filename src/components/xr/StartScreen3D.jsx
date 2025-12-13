import { useState, useEffect } from "react";
import { Text } from "@react-three/drei";
import Panel3D from "./Panel3D";
import Button3D from "./Button3D";
import useGameStore from "../../store/useGameStore";
import backgroundMusic from "../../services/backgroundMusic";

/**
 * StartScreen3D - Layar start dalam bentuk 3D untuk VR
 * Posisi di depan user: Z negatif = depan, Y=1.5 = eye level di VR
 */
export default function StartScreen3D() {
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const setGameState = useGameStore((s) => s.setGameState);

  // Start background music on mount
  useEffect(() => {
    // Auto-start backsound saat masuk
    backgroundMusic.playAmbient();
    setIsMusicPlaying(true);

    return () => {
      // Jangan stop musik saat pindah screen, biarkan terus jalan
      // backgroundMusic.stop();
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
    console.log('StartScreen3D: MULAI clicked!');
    // Ke environment select dulu, baru topic select
    setGameState('environment_select');
  };

  return (
    // === KUSTOMISASI POSISI PANEL ===
    // position={[x, y, z]} dimana:
    // - x: posisi horizontal (kiri/kanan), 0 = tengah
    // - y: TINGGI panel, tambah nilai untuk naik (misal 1.8 lebih tinggi dari 1.5)
    // - z: jarak dari user, nilai negatif = di depan user (-1.5 = 1.5 meter di depan)
    <group position={[0, 1.5, -0.8]}>
      {/* Main Panel */}
      <Panel3D
        position={[0, 0, 0]}
        width={1.6}
        height={1.0}
        backgroundColor="#0a0a1a"
      >
        {/* Title */}
        <Text
          position={[0, 0.25, 0.02]}
          fontSize={0.12}
          color="#ffffff"
          anchorX="center"
          anchorY="middle"
        >
          Konseling VR
        </Text>

        {/* Subtitle */}
        <Text
          position={[0, 0.1, 0.02]}
          fontSize={0.04}
          color="#4fc3f7"
          anchorX="center"
          anchorY="middle"
        >
          Ruang Aman untuk Berbagi Cerita
        </Text>

        {/* Description */}
        <Text
          position={[0, -0.05, 0.02]}
          fontSize={0.028}
          color="#cccccc"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.3}
          textAlign="center"
        >
          Selamat datang! Pilih suasana dan topik yang ingin kamu bicarakan.
        </Text>

        {/* Start Button */}
        <Button3D
          position={[0, -0.25, 0.02]}
          size={[0.5, 0.14, 0.04]}
          color="#4CAF50"
          hoverColor="#66BB6A"
          text="MULAI"
          textSize={0.05}
          onClick={handleStart}
        />

        {/* Music Toggle Button */}
        <Button3D
          position={[0.55, 0.35, 0.02]}
          size={[0.35, 0.1, 0.03]}
          color={isMusicPlaying ? "#9C27B0" : "#555"}
          hoverColor={isMusicPlaying ? "#BA68C8" : "#777"}
          text={isMusicPlaying ? "🎵 ON" : "🔇 OFF"}
          textSize={0.03}
          onClick={handleToggleMusic}
        />
      </Panel3D>
    </group>
  );
}
