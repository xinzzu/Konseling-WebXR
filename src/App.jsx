import { useEffect } from "react";
import useGameStore from "./store/useGameStore";
import XRCanvas from "./components/xr/XRCanvas";
import VRButton from "./components/xr/VRButton";
import MainScene from "./components/xr/MainScene";
import StartScreen from "./components/screens/StartScreen";
import EnvironmentSelectScreen from "./components/screens/EnvironmentSelectScreen";
import TopicSelectScreen from "./components/screens/TopicSelectScreen";
import ProblemSelectScreen from "./components/screens/ProblemSelectScreen";
import StoryScreen from "./components/screens/StoryScreen";
import ConversationPanel from "./components/ui/ConversationPanel";

/**
 * App - Main application component
 * Mengatur flow game: Start → Topic Select → Conversation
 * 
 * Mode 2D: UI HTML overlay di atas canvas
 * Mode VR: UI 3D di dalam scene (controllers click)
 */
export default function App() {
  const gameState = useGameStore((s) => s.gameState);
  const resetGame = useGameStore((s) => s.resetGame);
  const isInVR = useGameStore((s) => s.isInVR);

  // Setup iwer untuk WebXR emulation (development only)
  useEffect(() => {
    async function setupXREmulator() {
      // Check if native WebXR is supported
      if (navigator.xr) {
        try {
          const supported = await navigator.xr.isSessionSupported('immersive-vr');
          if (supported) {
            console.log('Native WebXR supported - skipping emulator');
            return;
          }
        } catch (e) {
          // Continue to setup emulator
        }
      }
      
      // Setup iwer emulator for development (Meta's official way)
      // TANPA SEM - kita pakai environment sendiri (Sunset Meadow, Pantai, Hutan)
      try {
        const { XRDevice, metaQuest3 } = await import('iwer');
        const { DevUI } = await import('@iwer/devui');
        
        window.CustomWebXRPolyfill = true;
        const xrDevice = new XRDevice(metaQuest3);
        xrDevice.installRuntime();
        xrDevice.installDevUI(DevUI);
        
        // Tidak install SEM - kita pakai environment custom sendiri
        // xrDevice.installSEM(SyntheticEnvironmentModule);
        
        // Store reference globally for debugging
        window.xrDevice = xrDevice;
        console.log('WebXR Emulator (iwer 2.x + DevUI) initialized - using custom environments');
      } catch (e) {
        console.warn('Could not initialize WebXR emulator:', e);
      }
    }
    
    setupXREmulator();
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      // ESC to go back
      if (e.key === 'Escape') {
        resetGame();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [resetGame]);

  return (
    <div style={styles.app}>
      {/* 3D Canvas - always rendered, UI 3D di dalam saat VR mode */}
      <XRCanvas>
        <MainScene />
      </XRCanvas>

      {/* UI 2D Layers - hanya tampil saat TIDAK dalam VR */}
      {!isInVR && (
        <>
          {gameState === 'start' && <StartScreen />}
          {gameState === 'environment_select' && <EnvironmentSelectScreen />}
          {gameState === 'topic_select' && <TopicSelectScreen />}
          {gameState === 'problem_select' && <ProblemSelectScreen />}
          {gameState === 'story' && <StoryScreen />}
          {(gameState === 'conversation' || gameState === 'finished') && <ConversationPanel />}
        </>
      )}

      {/* VR Button - selalu tampil untuk toggle VR mode */}
      <VRButton />
    </div>
  );
}

const styles = {
  app: {
    width: '100vw',
    height: '100vh',
    overflow: 'hidden',
    position: 'relative',
  },
};
