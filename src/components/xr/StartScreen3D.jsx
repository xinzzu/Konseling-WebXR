import { useState, useEffect } from "react";
import { Text, RoundedBox } from "@react-three/drei";
import Panel3D from "./Panel3D";
import Button3D from "./Button3D";
import useGameStore from "../../store/useGameStore";
import backgroundMusic from "../../services/backgroundMusic";

/**
 * StartScreen3D - Gerbang langgar Kauman (1915) versi 3D/VR.
 * Disinergikan dengan StartScreen 2D:
 * - "Masuk Langgar" = mode real (mock OFF) -> episode_select
 * - "Mode Mockup"   = demo tanpa backend (mock ON) -> environment_select
 * - Dashboard peneliti tetap bisa dibuka via hash #/riset
 * Visual: kayu (#8a5a2e), kuningan (#c9a24a), tinta krem (#f8edda).
 */
export default function StartScreen3D() {
  const [isMusicPlaying, setIsMusicPlaying] = useState(false);
  const setGameState = useGameStore((s) => s.setGameState);
  const setMockMode = useGameStore((s) => s.setMockMode);

  useEffect(() => {
    backgroundMusic.playAmbient();
    setIsMusicPlaying(true);
    return () => {};
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

  // 2D: handleStart — mode real, tanpa mock
  const handleEnterLanggar = () => {
    setMockMode(false);
    setGameState("episode_select");
  };

  // 2D: handleStartMock — demo tanpa backend
  const handleStartMock = () => {
    setMockMode(true);
    setGameState("environment_select");
  };

  const handleOpenDashboard = () => {
    window.location.hash = "#/riset";
  };

  return (
    <group position={[0, 1.55, -0.9]}>
      <Panel3D
        position={[0, 0, 0]}
        width={1.9}
        height={1.6}
        backgroundColor="#1D1626"
      >
        {/* Tombol suara — tengah atas */}
        <Button3D
          position={[0, 0.62, 0.04]}
          size={[0.4, 0.09, 0.03]}
          color={isMusicPlaying ? "#9C27B0" : "#555"}
          hoverColor={isMusicPlaying ? "#BA68C8" : "#777"}
          text={isMusicPlaying ? "suara" : "senyap"}
          textSize={0.028}
          playSound={false}
          onClick={handleToggleMusic}
        />

        {/* Papan nama kayu */}
        <RoundedBox args={[1.25, 0.34, 0.03]} radius={0.02} position={[0, 0.4, 0.03]}>
          <meshStandardMaterial color="#6e4520" roughness={0.65} />
        </RoundedBox>
        <Text
          position={[0, 0.45, 0.05]}
          fontSize={0.085}
          color="#f8edda"
          anchorX="center"
          anchorY="middle"
        >
          Konseling VR
        </Text>
        <Text
          position={[0, 0.32, 0.05]}
          fontSize={0.028}
          color="#e7c87e"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.15}
          textAlign="center"
          lineHeight={1.3}
        >
          PELAJARAN KEDAMAIAN BERSAMA KIAI AHMAD DAHLAN
        </Text>

        <Text
          position={[0, 0.06, 0.04]}
          fontSize={0.028}
          color="#f6ead4"
          anchorX="center"
          anchorY="middle"
          maxWidth={1.6}
          textAlign="center"
          lineHeight={1.4}
        >
          Dengarkan Kiai bercerita, ambil keputusanmu, bawa ke sekolahmu.
        </Text>

        {/* CTA utama — sama seperti 2D */}
        <Button3D
          position={[0, -0.12, 0.04]}
          size={[0.95, 0.14, 0.04]}
          color="#7b4f28"
          hoverColor="#8a5a2e"
          text="Masuk Langgar"
          textSize={0.045}
          pulse
          onClick={handleEnterLanggar}
        />
        <Text
          position={[0, -0.23, 0.04]}
          fontSize={0.024}
          color="#e7c87e"
          anchorX="center"
          anchorY="middle"
        >
          Lima pelajaran menantimu
        </Text>

        {/* Mode mockup — sama seperti 2D */}
        <Button3D
          position={[0, -0.36, 0.04]}
          size={[0.95, 0.1, 0.03]}
          color="#333333"
          hoverColor="#555555"
          text="Mode Mockup — demo tanpa backend"
          textSize={0.026}
          playSound={false}
          onClick={handleStartMock}
        />

        {/* Dashboard peneliti */}
        <Button3D
          position={[0, -0.49, 0.04]}
          size={[0.7, 0.08, 0.03]}
          color="#333333"
          hoverColor="#555555"
          text="Dashboard Peneliti"
          textSize={0.024}
          playSound={false}
          onClick={handleOpenDashboard}
        />

        {/* Hint keluar VR via controller (teks saja, bukan tombol) */}
        <Text
          position={[0, -0.64, 0.04]}
          fontSize={0.022}
          color="#aaaaaa"
          anchorX="center"
          anchorY="middle"
        >
          Di dalam VR: tahan A+B untuk keluar
        </Text>
      </Panel3D>
    </group>
  );
}
