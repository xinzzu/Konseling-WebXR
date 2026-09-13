import { useEffect, useState } from "react";
import useGameStore from "../../store/useGameStore";
import { EPISODE_META } from "../../services/episodeMeta";
import backgroundMusic from "../../services/backgroundMusic";
import ttsService from "../../services/ttsService";
import VoiceWaveform from "../ui/VoiceWaveform";

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
      const item =
        scene.items?.find((it) => it.no === record.choiceId) || scene.items?.[record.choiceId];
      const label = item?.options?.find((o) => o.id === record.choiceId)?.label;
      if (label) transferLabels.push(label);
    }
  }
  return { decisionLabel, transferLabels };
}

/**
 * EpisodeFinishedScreen - Layar selesai episode (REAL APP).
 * Pesan pribadi dari Kiai (LLM opsional), ulangi / pilih episode lain / menu.
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
  const quote = selectedEpisode?.scenes?.find((s) => s.type === "penutup")?.quote || "";

  useEffect(() => {
    return () => ttsService.stop();
  }, []);

  const speakKiai = (text) => {
    if (!text) return;
    ttsService.stop();
    setAudioState("loading");
    // Suara Kiai selalu via backend (Edge TTS, id-ID-ArdiNeural = pria),
    // bukan Web Speech yang suka jatuh ke voice perempuan lokal.
    const kiaiConfig =
      ttsConfig?.mode === "off" ? ttsConfig : { ...(ttsConfig || {}), mode: "edge" };
    ttsService
      .play({
        ttsConfig: kiaiConfig,
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
        {/* Kepala */}
        <div style={styles.hero}>
          <div style={styles.badgeRing}>
            <div style={styles.badge}><span style={styles.badgeLeaf}>✓</span></div>
          </div>
          <h1 style={styles.title}>Episode {epTitle} Selesai</h1>
          <p style={styles.subtitle}>
            Terima kasih sudah belajar bersama Kiai Ahmad Dahlan.
            Jawabanmu dicatat sebagai bahan renungan — bukan penilaian benar-salah.
          </p>
        </div>

        {/* Kartu kutipan */}
        {quote && (
          <div style={{ ...styles.quoteCard, borderTopColor: accent }}>
            <div style={styles.quoteMark}>“</div>
            <div style={styles.quote}>{quote}</div>
          </div>
        )}

        {/* Pesan pribadi dari Kiai */}
        {!kiaiState.reply && !kiaiState.loading && (
          <button style={styles.primaryBtn} onClick={handleKiai} disabled={kiaiState.loading}>
            🌾&nbsp; Pesan Pribadi dari Kiai
          </button>
        )}
        {kiaiState.loading && (
          <div style={styles.kiaiCard}>
            <div style={styles.kiaiHeader}>
              <span style={styles.kiaiAvatar}>👳</span>
              <span style={styles.kiaiName}>Kiai Ahmad Dahlan</span>
            </div>
            <div style={styles.kiaiPulse}>⏳ Kiai sedang merangkai kata untukmu…</div>
          </div>
        )}
        {kiaiState.reply && (
          <div style={styles.kiaiCard}>
            <div style={styles.kiaiHeader}>
              <span style={styles.kiaiAvatar}>👳</span>
              <span style={styles.kiaiName}>Pesan pribadi untukmu</span>
            </div>
            <div style={styles.kiaiReply}>{kiaiState.reply}</div>
            {audioState === "speaking" && (
              <div style={styles.kiaiWave}>
                <VoiceWaveform isActive color="#E7C87E" />
              </div>
            )}
            <button
              style={styles.speakBtn}
              onClick={handleToggleAudio}
              disabled={audioState === "loading"}
            >
              {audioState === "loading"
                ? "⏳ Menyiapkan suara…"
                : audioState === "speaking"
                  ? "⏹ Hentikan Suara"
                  : "🔊 Putar Suara Kiai"}
            </button>
          </div>
        )}

        <div style={styles.actions}>
          <button style={{ ...styles.btn, background: accent }} onClick={handleRepeat}>
            🔄&nbsp; Ulangi Episode {epTitle}
          </button>
          <button style={{ ...styles.btn, background: "#2196F3" }} onClick={handleOtherEpisode}>
            📚&nbsp; Pilih Episode Lain
          </button>
          <button style={{ ...styles.btn, background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.18)" }} onClick={handleMenu}>
            🏠&nbsp; Menu Utama
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
    overflow: "auto",
    padding: "24px",
    paddingBottom: "90px",
    zIndex: 100,
  },
  content: {
    maxWidth: "440px",
    width: "100%",
    textAlign: "center",
  },
  hero: { marginBottom: "20px" },
  badgeRing: {
    width: "78px",
    height: "78px",
    margin: "0 auto 14px",
    borderRadius: "50%",
    background: "radial-gradient(circle, rgba(76,201,160,0.25) 0%, transparent 70%)",
    border: "1px solid rgba(76,201,160,0.35)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    boxShadow: "0 12px 40px rgba(76,201,160,0.25)",
  },
  badge: {
    width: "56px",
    height: "56px",
    borderRadius: "50%",
    background: "linear-gradient(160deg, #37906f, #1f5c45)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeLeaf: { color: "#eafff4", fontSize: "26px", fontWeight: 800 },
  title: {
    fontSize: "26px",
    fontWeight: 800,
    color: "#f4f8fb",
    letterSpacing: "-0.01em",
    margin: 0,
  },
  subtitle: {
    fontSize: "13.5px",
    color: "rgba(255,255,255,0.72)",
    lineHeight: "1.65",
    margin: "10px auto 0",
    maxWidth: "360px",
  },
  quoteCard: {
    background: "rgba(15,20,32,0.82)",
    borderTop: "3px solid #4CAF50",
    borderRadius: "14px",
    padding: "16px 18px",
    marginBottom: "14px",
    position: "relative",
    backdropFilter: "blur(12px)",
    boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
  },
  quoteMark: {
    position: "absolute",
    top: "6px",
    left: "12px",
    fontSize: "38px",
    lineHeight: 1,
    color: "rgba(255,255,255,0.12)",
    fontFamily: "Georgia, serif",
  },
  quote: {
    fontSize: "15px",
    fontStyle: "italic",
    color: "rgba(255,255,255,0.95)",
    lineHeight: "1.65",
    paddingLeft: "4px",
  },
  primaryBtn: {
    width: "100%",
    padding: "15px 20px",
    fontSize: "14.5px",
    fontWeight: 700,
    color: "#2b1d06",
    background: "#E7C87E",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    boxShadow: "0 8px 26px rgba(231,200,126,0.35)",
    marginBottom: "12px",
    transition: "transform .15s, filter .2s",
  },
  kiaiCard: {
    background: "rgba(22,28,40,0.92)",
    border: "1px solid rgba(231,200,126,0.25)",
    borderRadius: "14px",
    padding: "14px 16px",
    textAlign: "left",
    marginBottom: "12px",
    backdropFilter: "blur(12px)",
    boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
  },
  kiaiHeader: { display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" },
  kiaiAvatar: {
    width: "34px",
    height: "34px",
    borderRadius: "50%",
    background: "rgba(231,200,126,0.16)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "17px",
    flexShrink: 0,
  },
  kiaiName: { fontSize: "13px", fontWeight: 700, color: "#E7C87E", flex: 1 },
  kiaiWave: { marginTop: "4px" },
  speakBtn: {
    width: "100%",
    padding: "12px 16px",
    fontSize: "13.5px",
    fontWeight: 600,
    background: "rgba(231,200,126,0.12)",
    border: "1px solid rgba(231,200,126,0.4)",
    color: "#F3D9A4",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "background .2s",
  },
  kiaiReply: {
    fontSize: "14px",
    color: "rgba(255,255,255,0.92)",
    lineHeight: "1.7",
    whiteSpace: "pre-wrap",
  },
  kiaiPulse: {
    fontSize: "13.5px",
    color: "rgba(255,255,255,0.6)",
    animation: "uiPulse 1.6s ease-in-out infinite",
  },
  actions: { display: "flex", flexDirection: "column", gap: "10px", marginTop: "2px" },
  btn: {
    padding: "14px 20px",
    fontSize: "14.5px",
    fontWeight: 600,
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
    transition: "transform .15s, filter .2s",
  },
};