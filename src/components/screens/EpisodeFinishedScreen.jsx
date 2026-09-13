import { useEffect, useState } from "react";
import useGameStore from "../../store/useGameStore";
import { EPISODE_META } from "../../services/episodeMeta";
import backgroundMusic from "../../services/backgroundMusic";
import ttsService from "../../services/ttsService";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:3100";

const LOCAL_FALLBACK =
  "Anakku, terima kasih sudah menyelesaikan pelajaran ini dengan sungguh-sungguh. Ambillah satu kebaikan dari pelajaran tadi dan bawa ia ke sekolahmu dengan hati yang lapang. Pelan-pelan saja — Kiai selalu mendoakan yang terbaik untukmu.";

/** Rangkum pilihan siswa jadi konteks untuk "pesan pribadi dari Kiai". */
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
 * EpisodeFinishedScreen - Layar selesai episode (REAL APP).
 * Menawarkan: pesan pribadi dari Kiai (LLM opsional, persona tertune),
 * ulangi episode ini / pilih episode lain / kembali ke menu.
 * Semua jawaban sudah tercatat di backend (POST /api/progress).
 */
export default function EpisodeFinishedScreen() {
  const [kiaiState, setKiaiState] = useState({ loading: false, reply: null });
  const [audioState, setAudioState] = useState("idle"); // idle | loading | speaking
  const selectedEpisode = useGameStore((s) => s.selectedEpisode);
  const episodeChoices = useGameStore((s) => s.episodeChoices);
  const ttsConfig = useGameStore((s) => s.ttsConfig);
  const setGameState = useGameStore((s) => s.setGameState);
  const resetGame = useGameStore((s) => s.resetGame);
  const resetEpisodeFlow = useGameStore((s) => s.resetEpisodeFlow);
  const setSelectedEpisode = useGameStore((s) => s.setSelectedEpisode);

  const accent = EPISODE_META[selectedEpisode?.id]?.accent || "#4CAF50";
  const epTitle = selectedEpisode?.tema || "Episode";

  // Hentikan suara saat meninggalkan layar
  useEffect(() => {
    return () => ttsService.stop();
  }, []);

  const speakKiai = (text) => {
    if (!text) return;
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

  const handleKiai = async () => {
    if (kiaiState.loading) return;
    setKiaiState({ loading: true, reply: null });
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
      setKiaiState({ loading: false, reply });
      speakKiai(reply);
    } catch {
      setKiaiState({ loading: false, reply: LOCAL_FALLBACK });
      speakKiai(LOCAL_FALLBACK);
    }
  };

  const handleToggleAudio = () => {
    if (audioState === "speaking") {
      ttsService.stop();
      setAudioState("idle");
    } else {
      speakKiai(kiaiState.reply);
    }
  };

  const handleRepeat = () => {
    ttsService.stop();
    // Ulangi episode yang sama: set sceneIndex ke 0 (kartu peran) tanpa fetch ulang
    setSelectedEpisode(selectedEpisode);
    setGameState("episode_play");
  };

  const handleOtherEpisode = () => {
    ttsService.stop();
    resetEpisodeFlow();
    setGameState("episode_select");
  };

  const handleMenu = () => {
    ttsService.stop();
    backgroundMusic.stop();
    resetEpisodeFlow();
    resetGame();
    setGameState("start");
  };

  return (
    <div style={styles.container}>
      <div style={styles.content} className="fade-in">
        <div style={styles.icon}>🌿</div>
        <h1 style={styles.title}>Episode {epTitle} selesai</h1>
        <p style={styles.subtitle}>
          Kamu telah menyelesaikan pelajaran kali ini bersama Kiai Ahmad Dahlan.
          Jawabanmu sudah dicatat untuk bahan renungan, bukan penilaian benar-salah.
        </p>

        <div style={{ ...styles.quoteCard, borderTop: `3px solid ${accent}` }}>
          <div style={styles.quote}>
            “{selectedEpisode?.scenes?.find((s) => s.type === "penutup")?.quote || ""}”
          </div>
        </div>

        <div style={styles.actions}>
          {!kiaiState.reply && (
            <button
              style={{ ...styles.action, background: "#FF9800" }}
              onClick={handleKiai}
              disabled={kiaiState.loading}
            >
              {kiaiState.loading ? "⏳ Kiai sedang menyampaikan pesan…" : "🌾 Pesan Pribadi dari Kiai"}
            </button>
          )}
          {kiaiState.reply && (
            <div style={{ ...styles.kiaiCard, borderLeft: `3px solid ${accent}` }}>
              <div style={styles.kiaiLabel}>🌾 Pesan dari Kiai Ahmad Dahlan</div>
              <div style={styles.kiaiReply}>{kiaiState.reply}</div>
              <button style={styles.audioToggle} onClick={handleToggleAudio}>
                {audioState === "loading"
                  ? "⏳ Menyiapkan suara…"
                  : audioState === "speaking"
                    ? "⏹ Hentikan Suara"
                    : "🔊 Putar Suara"}
              </button>
            </div>
          )}
          <button style={{ ...styles.action, background: accent }} onClick={handleRepeat}>
            🔄 Ulangi Episode {epTitle}
          </button>
          <button style={{ ...styles.action, background: "#2196F3" }} onClick={handleOtherEpisode}>
            📚 Pilih Episode Lain
          </button>
          <button style={{ ...styles.action, background: "#555" }} onClick={handleMenu}>
            🏠 Menu Utama
          </button>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: "fixed",
    inset: 0,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "transparent",
    zIndex: 100,
    overflow: "auto",
    padding: "20px",
    pointerEvents: "none",
  },
  content: {
    maxWidth: "460px",
    width: "100%",
    textAlign: "center",
    pointerEvents: "auto",
  },
  icon: { fontSize: "48px", marginBottom: "8px" },
  title: {
    fontSize: "26px",
    fontWeight: "700",
    color: "white",
    margin: "0 0 10px 0",
  },
  subtitle: {
    fontSize: "14px",
    color: "rgba(255,255,255,0.8)",
    lineHeight: "1.6",
    margin: "0 0 20px 0",
  },
  quoteCard: {
    background: "rgba(15,15,35,0.88)",
    borderRadius: "16px",
    padding: "18px 20px",
    marginBottom: "20px",
    backdropFilter: "blur(12px)",
    boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
  },
  quote: {
    fontSize: "15px",
    fontStyle: "italic",
    color: "rgba(255,255,255,0.95)",
    lineHeight: "1.6",
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: "10px",
  },
  action: {
    padding: "14px 18px",
    fontSize: "14px",
    fontWeight: "600",
    color: "white",
    border: "none",
    borderRadius: "16px",
    cursor: "pointer",
    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
  },
  kiaiCard: {
    background: "rgba(20,20,45,0.9)",
    borderRadius: "16px",
    padding: "16px 18px",
    textAlign: "left",
    boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
  },
  kiaiLabel: {
    fontSize: "12px",
    fontWeight: "700",
    color: "#FFC107",
    marginBottom: "8px",
  },
  kiaiReply: {
    fontSize: "14px",
    color: "rgba(255,255,255,0.95)",
    lineHeight: "1.7",
    whiteSpace: "pre-wrap",
  },
  audioToggle: {
    marginTop: "12px",
    width: "100%",
    padding: "10px 14px",
    fontSize: "13px",
    fontWeight: "600",
    color: "white",
    background: "#FF9800",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
  },
};