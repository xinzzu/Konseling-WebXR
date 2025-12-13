import React, { Suspense } from "react";
import { OrbitControls, Environment } from "@react-three/drei";
import { useXR } from "@react-three/xr";
import useGameStore from "../../store/useGameStore";
import StartScreen3D from "./StartScreen3D";
import EnvironmentSelect3D from "./EnvironmentSelect3D";
import TopicSelect3D from "./TopicSelect3D";
import ProblemSelect3D from "./ProblemSelect3D";
import Story3D from "./Story3D";
import Conversation3D from "./Conversation3D";
import XRPointer from "./XRPointer";
import NPCCounselor from "./NPCCounselor";

// Environments
import { 
  GalleryEnvironment, 
  BeachEnvironment, 
  ForestEnvironment 
} from "./environments";

/**
 * MainScene - Scene 3D utama
 * Berisi environment, lighting, dan objek 3D
 * Saat VR mode, tampilkan UI 3D
 */
export default function MainScene() {
  const { isPresenting } = useXR();
  const gameState = useGameStore((s) => s.gameState);
  const selectedEnvironment = useGameStore((s) => s.selectedEnvironment);

  // Debug log
  React.useEffect(() => {
    console.log('MainScene - isPresenting:', isPresenting, 'gameState:', gameState, 'env:', selectedEnvironment);
  }, [isPresenting, gameState, selectedEnvironment]);

  return (
    <Suspense fallback={null}>
      {/* Controls - hanya untuk desktop */}
      {!isPresenting && (
        <OrbitControls 
          makeDefault 
          enablePan={false}
          minDistance={2}
          maxDistance={10}
          target={[0, 1, 0]}
        />
      )}

      {/* Base Lighting - untuk semua environment */}
      <ambientLight intensity={0.5} />
      
      {/* Environment-specific lighting ditambahkan di masing-masing component */}
      {selectedEnvironment === 'gallery' && (
        <>
          <directionalLight 
            position={[5, 10, 5]} 
            intensity={1.5} 
            castShadow
            shadow-mapSize={[2048, 2048]}
          />
          <pointLight position={[-5, 5, -5]} intensity={0.8} color="#a8d8ff" />
          <pointLight position={[0, 3, 0]} intensity={0.5} color="#ffffff" />
          <Environment preset="sunset" />
        </>
      )}

      {/* Selected Environment */}
      <SelectedEnvironment environmentId={selectedEnvironment} />

      {/* NPC - selalu tampil di state tertentu (visible di background mode 2D) */}
      {(gameState === 'topic_select' || gameState === 'problem_select' || 
        gameState === 'story' || gameState === 'conversation' || gameState === 'finished') && (
        <ConversationNPC />
      )}

      {/* 3D UI Panels - SELALU render berdasarkan gameState
          Ini memastikan saat user switch ke VR di tengah flow,
          panel 3D langsung tersedia dan sinkron dengan state saat ini */}
      {gameState === 'start' && <StartScreen3D />}
      {gameState === 'environment_select' && <EnvironmentSelect3D />}
      {gameState === 'topic_select' && <TopicSelect3D />}
      {gameState === 'problem_select' && <ProblemSelect3D />}
      {gameState === 'story' && <Story3D />}
      {(gameState === 'conversation' || gameState === 'finished') && <Conversation3D />}

      {/* XR Pointer rays untuk VR interaction */}
      <XRPointer />
    </Suspense>
  );
}

/**
 * SelectedEnvironment - Render environment yang dipilih
 */
function SelectedEnvironment({ environmentId }) {
  switch (environmentId) {
    case 'beach':
      return <BeachEnvironment />;
    case 'forest':
      return <ForestEnvironment />;
    case 'gallery':
    default:
      return <GalleryEnvironment />;
  }
}

/**
 * ConversationNPC - NPC Konselor yang tampil saat conversation
 * 
 * ============================================
 * CUSTOMIZATION - Ubah sesuai kebutuhan per state
 * ============================================
 * position: [x, y, z] - posisi NPC dalam scene
 *   - x: kiri/kanan (negatif = kiri)
 *   - y: tinggi
 *   - z: depan/belakang (negatif = depan user)
 * 
 * rotation: [x, y, z] - rotasi dalam RADIAN
 *   - y positif = rotate ke kanan (searah jarum jam dari atas)
 *   - y negatif = rotate ke kiri
 *   - Math.PI = 180 derajat
 *   - Math.PI / 2 = 90 derajat
 *   - Math.PI / 4 = 45 derajat
 *   - Math.PI / 6 = 30 derajat
 */
const NPC_CONFIG = {
  // Default config untuk conversation/finished
  default: {
    position: [-1.2, 1.0, -1.2],
    rotation: [0, Math.PI / 6, 0],
    scale: 1.2,
  },
  // Config untuk topic_select - panel lebih kecil
  topic_select: {
    position: [-1.5, 1.0, -1.0],
    rotation: [0, Math.PI / 5, 0],
    scale: 1.2,
  },
  // Config untuk problem_select - panel lebih lebar, NPC lebih ke kiri
  problem_select: {
    position: [-2.0, 1.0, -0.5],
    rotation: [0, Math.PI / 4, 0],
    scale: 1.2,
  },
  // Config untuk story - panel lebar
  story: {
    position: [-2.0, 1.0, -0.5],
    rotation: [0, Math.PI / 4, 0],
    scale: 1.2,
  },
};

function ConversationNPC() {
  const isSpeaking = useGameStore((s) => s.isSpeaking);
  const gameState = useGameStore((s) => s.gameState);
  
  // Tentukan mood berdasarkan gameState
  const mood = gameState === 'finished' ? 'happy' : 'neutral';
  
  // Pilih config berdasarkan gameState
  const config = NPC_CONFIG[gameState] || NPC_CONFIG.default;
  
  return (
    <NPCCounselor
      position={config.position}
      rotation={config.rotation}
      isSpeaking={isSpeaking}
      mood={mood}
      scale={config.scale}
    />
  );
}
