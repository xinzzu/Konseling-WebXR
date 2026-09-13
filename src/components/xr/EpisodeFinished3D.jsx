import { useEffect, useState } from "react";
import { Text } from "@react-three/drei";
import Panel3D from "./Panel3D";
import Button3D from "./Button3D";
import useGameStore from "../../store/useGameStore";
import { EPISODE_META } from "../../services/episodeMeta";
import ttsService from "../../services/ttsService";
import { useAudioOwner } from "../../hooks/useAudioOwner";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3100";

const LOCAL_FALLBACK =
  "Anakku, terima kasih sudah menyelesaikan pelajaran ini dengan sungguh-sungguh. Ambillah satu kebaikan dari pelajaran tadi dan bawa ia ke sekolahmu dengan hati yang lapang. Pelan-pelan saja — Kiai selalu mendoakan yang terbaik untukmu.";

function buildKiaiSummary(episode, choices) {
  const scenes = episode?.scenes || [];
  let decisionLabel = null;
  const transferLabels = [];

  for (const scene of scenes) {
    const record = choices?.[scene.no];
    if (!record) continue;
    if (scene.type === "decision") {
      decisionLabel = scene.options?.find((o) => o.id === record.choiceId)?.label || null;
    } else if (scene.type === "transfer") {
      const item = scene.items?.find((it) => it.no === record.choiceId) ||
        scene.items?.[record.choiceId];
      const label = item?.options?.find((o) => o.id === record.choiceId)?.label;
      if (label) transferLabels.push(label);
    }
  }
  return { decisionLabel, transferLabels };
}

/**
 * EpisodeFinished3D - Layar selesai episode dalam VR (REAL APP).
 * Termasuk "pesan pribadi dari Kiai" (LLM opsional, persona tertune).
 */
export default function EpisodeFinished3D() {
  const selectedEpisode = useGameStore((s) => s.selectedEpisode);
  const episodeChoices = useGameStore((s) => s.episodeChoices);
  const ttsConfig = useGameStore((s) => s.ttsConfig);
  const setGameState = useGameStore((s) => s.setGameState);
  const resetGame = useGameStore((s) => s.resetGame);
  const resetEpisodeFlow = useGameStore((s) => s.resetEpisodeFlow);
  const setSelectedEpisode = useGameStore((s) => s.setSelectedEpisode);
  const isAudioOwner = useAudioOwner("vr");

  const [mode, setMode] = useState("menu");
  const [kiaiReply, setKiaiReply] = useState(null);
  const [loading, setLoading] = useState(false);
  const [audioState, setAudioState] = useState("idle"); // idle | loading | speaking

  const accent = EPISODE_META[selectedEpisode?.id]?.accent || "#4CAF50";
  const epTitle = selectedEpisode?.tema || "Episode";
  const quote = selectedEpisode?.scenes?.find((s) => s.type === "penutup")?.quote || "";

  useEffect(() => {
    return () => ttsService.stop();
  }, []);

  // Keluar dari VR = 3D bukan lagi pemilik audio. Hentikan suara 3D agar
  // tidak berbunyi dobel dengan layar 2D.
  useEffect(() => {
    if (isAudioOwner) return;
    ttsService.stop();
    setAudioState("idle");
  }, [isAudioOwner]);

  const speakKiai = (text) => {
    if (!text || !isAudioOwner) return;
    ttsService.stop();
    setAudioState("loading");
    ttsService
      .play({
        ttsConfig,
        audio: null,
        speechText: text,
        onStart: () => setAudioState("speaking"),
        onEnd: () => setAudioState("idle"),
        onError: () => setAudioState("idle"),
      })
      .finally(() => setAudioState((s) => (s === "loading" ? "idle" : s)));
  };

  const handleToggleAudio = () => {
    if (audioState === "speaking") {
      ttsService.stop();
      setAudioState("idle");
    } else {
      speakKiai(kiaiReply);
    }
  };

  const handleKiai = async () => {
    if (loading) return;
    setLoading(true);
    setAudioState("idle");
    const { decisionLabel, transferLabels } = buildKiaiSummary(selectedEpisode, episodeChoices);
    try {
      const res = await fetch(`${API_BASE}/api/ai/kiai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          episodeId: selectedEpisode?.id,
          tema: selectedEpisode?.tema,
          decisionLabel,
          transferLabels,
        }),
      });
      const data = await res.json();
      const reply = data?.reply || LOCAL_FALLBACK;
      setKiaiReply(reply);
      setMode("kiai");
      speakKiai(reply);
    } catch {
      setKiaiReply(LOCAL_FALLBACK);
      setMode("kiai");
      speakKiai(LOCAL_FALLBACK);
    } finally {
      setLoading(false);
    }
  };

  return (
    <group position={[0, 1.6, -1.5]}>
      <Panel3D
        position={[0, 0, 0]}
        width={mode === "kiai" ? 2.8 : 2.3}
        height={mode === "kiai" ? 2.2 : 1.9}
        backgroundColor="#0a0a1a"
        followCamera
      >
        {mode === "menu" && (
          <>
            <Text position={[0, 0.75, 0.05]} fontSize={0.07} color="white" anchorX="center" anchorY="middle">
              🌿 Selesai
            </Text>
            <Text position={[0, 0.62, 0.05]} fontSize={0.045} color={accent} anchorX="center" anchorY="middle">
              Episode {epTitle}
            </Text>
            <Text
              position={[0, 0.3, 0.05]}
              fontSize={0.028}
              color="rgba(255,255,255,0.9)"
              anchorX="center"
              anchorY="top"
              maxWidth={2.1}
              textAlign="center"
              lineHeight={1.35}
            >
              “{quote}”
            </Text>

            <Button3D
              position={[0, -0.05, 0.05]}
              size={[1.7, 0.11, 0.03]}
              color="#FF9800"
              hoverColor="#FFB74D"
              text={loading ? "⏳ …" : "🌾 Pesan Pribadi dari Kiai"}
              textSize={0.032}
              onClick={handleKiai}
            />
            <Button3D
              position={[0, -0.42, 0.05]}
              size={[1.7, 0.11, 0.03]}
              color={accent}
              hoverColor={accent}
              text={`🔄 Ulangi Episode ${epTitle}`}
              textSize={0.034}
              onClick={() => {
                ttsService.stop();
                setSelectedEpisode(selectedEpisode);
                setGameState("episode_play");
              }}
            />
            <Button3D
              position={[0, -0.62, 0.05]}
              size={[1.7, 0.11, 0.03]}
              color="#2196F3"
              hoverColor="#42A5F5"
              text="📚 Pilih Episode Lain"
              textSize={0.034}
              onClick={() => {
                ttsService.stop();
                resetEpisodeFlow();
                setGameState("episode_select");
              }}
            />
            <Button3D
              position={[0, -0.82, 0.05]}
              size={[1.7, 0.11, 0.03]}
              color="#555"
              hoverColor="#777"
              text="🏠 Menu Utama"
              textSize={0.034}
              onClick={() => {
                ttsService.stop();
                resetEpisodeFlow();
                resetGame();
                setGameState("start");
              }}
            />
          </>
        )}

        {mode === "kiai" && (
          <>
            <Text position={[0, 0.85, 0.05]} fontSize={0.042} color="#FFC107" anchorX="center" anchorY="middle">
              🌾 Pesan dari Kiai
            </Text>
            <Text
              position={[0, 0.62, 0.05]}
              fontSize={0.023}
              color="rgba(255,255,255,0.95)"
              anchorX="center"
              anchorY="top"
              maxWidth={2.6}
              textAlign="center"
              lineHeight={1.4}
            >
              {kiaiReply || "…Kiai sedang merangkai kata untukmu…"}
            </Text>
            <Button3D
              position={[0, -0.78, 0.05]}
              size={[1.5, 0.11, 0.03]}
              color={audioState === "speaking" ? "#E53935" : "#FF9800"}
              hoverColor="#FFB74D"
              text={
                audioState === "loading"
                  ? "⏳ Menyiapkan suara…"
                  : audioState === "speaking"
                    ? "⏹ Hentikan Suara"
                    : "🔊 Putar Suara"
              }
              textSize={0.032}
              onClick={handleToggleAudio}
            />
            <Button3D
              position={[0, -0.98, 0.05]}
              size={[1.4, 0.11, 0.03]}
              color="#555"
              hoverColor="#777"
              text="⟨ Kembali"
              textSize={0.034}
              onClick={() => {
                ttsService.stop();
                setAudioState("idle");
                setMode("menu");
              }}
            />
          </>
        )}
      </Panel3D>
    </group>
  );
}