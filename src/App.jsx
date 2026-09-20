import { useEffect, useState } from "react";
import useGameStore from "./store/useGameStore";
import XRCanvas from "./components/xr/XRCanvas";
import VRButton from "./components/xr/VRButton";
import MainScene from "./components/xr/MainScene";
import StartScreen from "./components/screens/StartScreen";
import EnvironmentSelectScreen from "./components/screens/EnvironmentSelectScreen";
import TopicSelectScreen from "./components/screens/TopicSelectScreen";
import ProblemSelectScreen from "./components/screens/ProblemSelectScreen";
import StoryScreen from "./components/screens/StoryScreen";
import EpisodeSelectScreen from "./components/screens/EpisodeSelectScreen";
import EpisodePlayScreen from "./components/screens/EpisodePlayScreen";
import EpisodeFinishedScreen from "./components/screens/EpisodeFinishedScreen";
import ResearchDashboard from "./components/screens/ResearchDashboard";
import ConversationPanel from "./components/ui/ConversationPanel";
import MockModeBadge from "./components/ui/MockModeBadge";

const RISET_PATHS = new Set(["/riset", "/auth", "/dashboard"]);
const RISET_HASHES = new Set(["#/riset", "#/auth", "#/dashboard"]);

function isRisetLocation() {
  const path = (window.location.pathname || "/").replace(/\/+$/, "") || "/";
  const hash = (window.location.hash || "").toLowerCase();
  return RISET_PATHS.has(path) || RISET_HASHES.has(hash);
}

/**
 * App - Main application component
 * Mengatur flow game: Start → Topic Select → Conversation
 *
 * Mode 2D: UI HTML overlay di atas canvas
 * Mode VR: UI 3D di dalam scene (controllers click)
 *
 * Dashboard peneliti (/riset) digerakkan oleh URL path/hash — bukan gameState —
 * supaya stabil dan tidak ikut ter-reset saat game di-reset / ESC.
 */
export default function App() {
  const gameState = useGameStore((s) => s.gameState);
  const resetGame = useGameStore((s) => s.resetGame);
  const isInVR = useGameStore((s) => s.isInVR);

  const [isAdmin, setIsAdmin] = useState(isRisetLocation());

  useEffect(() => {
    const sync = () => setIsAdmin(isRisetLocation());
    sync();
    window.addEventListener("hashchange", sync);
    window.addEventListener("popstate", sync);
    return () => {
      window.removeEventListener("hashchange", sync);
      window.removeEventListener("popstate", sync);
    };
  }, []);

  // Setup iwer untuk WebXR emulation (development only)
  // Dikecualikan untuk Dashboard Peneliti (/riset, /auth, /dashboard) —
  // halaman itu murni 2D, gak butuh tombol "Enter XR"/toolbar emulator.
  useEffect(() => {
    if (isRisetLocation()) return;

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

  // Keyboard shortcuts (ESC tidak boleh mereset admin dashboard)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && !isAdmin) {
        resetGame();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [resetGame, isAdmin]);

  // Dashboard peneliti (URL-driven)
  if (isAdmin) {
    return <ResearchDashboard />;
  }

  return (
    <div style={styles.app}>
      {/* 3D Canvas - always rendered, UI 3D di dalam saat VR mode */}
      <XRCanvas>
        <MainScene />
      </XRCanvas>

      {/* UI 2D Layers - hanya tampil saat TIDAK dalam VR */}
      {!isInVR && (
        <>
          {/* Dark overlay untuk fokus ke UI - tampil setelah start screen */}
          {gameState !== 'start' && <div style={styles.overlay} />}

          {gameState === 'start' && <StartScreen />}
          {gameState === 'environment_select' && <EnvironmentSelectScreen />}
          {gameState === 'topic_select' && <TopicSelectScreen />}
          {gameState === 'problem_select' && <ProblemSelectScreen />}
          {gameState === 'story' && <StoryScreen />}
          {gameState === 'episode_select' && <EpisodeSelectScreen />}
          {gameState === 'episode_play' && <EpisodePlayScreen />}
          {gameState === 'episode_finished' && <EpisodeFinishedScreen />}
          {(gameState === 'conversation' || gameState === 'finished') && <ConversationPanel />}
        </>
      )}

      {/* VR Button - disembunyikan saat episode selesai supaya tidak menumpuk tombol aksi */}
      {gameState !== "episode_finished" && <VRButton />}

      {/* Indikator Mode Mockup */}
      <MockModeBadge />
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
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    pointerEvents: 'none',
    zIndex: 5,
  },
};
