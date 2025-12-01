import React, { Suspense } from "react";
import { OrbitControls, Environment } from "@react-three/drei";
import { useXR } from "@react-three/xr";
import useGameStore from "../../store/useGameStore";
import StartScreen3D from "./StartScreen3D";
import EnvironmentSelect3D from "./EnvironmentSelect3D";
import TopicSelect3D from "./TopicSelect3D";
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

      {/* 3D UI - tampil di VR mode ATAU untuk testing */}
      {(isPresenting || true) && (
        <>
          {gameState === 'start' && <StartScreen3D />}
          {gameState === 'environment_select' && <EnvironmentSelect3D />}
          {gameState === 'topic_select' && <TopicSelect3D />}
          {(gameState === 'conversation' || gameState === 'finished') && (
            <>
              {/* NPC Counselor - di samping panel conversation */}
              <ConversationNPC />
              <Conversation3D />
            </>
          )}
        </>
      )}

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
 * Posisi di samping kiri panel conversation
 */
function ConversationNPC() {
  const isSpeaking = useGameStore((s) => s.isSpeaking);
  const gameState = useGameStore((s) => s.gameState);
  
  // Tentukan mood berdasarkan gameState
  const mood = gameState === 'finished' ? 'happy' : 'neutral';
  
  return (
    <NPCCounselor
      // Posisi: di samping kiri panel conversation
      // Panel ada di [0, 1.8, -1.5], NPC di sebelah kiri
      position={[-1.2, 1.0, -1.2]}
      isSpeaking={isSpeaking}
      mood={mood}
      scale={1.2}
    />
  );
}
