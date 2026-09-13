import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import useGameStore from "../../store/useGameStore";
import {
  submitProgress,
  scoreFor,
} from "../../services/episodeService";
import {
  EPISODE_META,
  roleBadgeForScene,
  progressLabelForScene,
  environmentForScene,
  stageLabelForScene,
  avatarForSpeaker,
} from "../../services/episodeMeta";
import ttsService from "../../services/ttsService";
import VoiceWaveform from "../ui/VoiceWaveform";

/**
 * ============================================
 * DEVELOPER CONFIG
 * ============================================
 * OPTIONS_DISPLAY_MODE:
 * - "instant"     : Konten langsung muncul (development cepat)
 * - "after_audio" : Konten muncul setelah audio selesai (production)
 */
const OPTIONS_DISPLAY_MODE = "after_audio";

const SLOW_SCENES = new Set(["decision", "transfer"]);

function stripMarker(t) {
  return (t || "").replace(/^\s*Narator\s*:\s*/, "");
}

/**
 * EpisodePlayScreen - Layar main episode (REAL APP).
 * Menangani kartu peran (sceneIndex 0) + 10 adegan dari backend.
 * Semua jawaban score dicatat via POST /api/progress (tanpa label benar/salah).
 */
export default function EpisodePlayScreen() {
  const selectedEpisode = useGameStore((s) => s.selectedEpisode);
  const sceneIndex = useGameStore((s) => s.sceneIndex);
  const episodeSub = useGameStore((s) => s.episodeSub);
  const episodeChoices = useGameStore((s) => s.episodeChoices);
  const ttsConfig = useGameStore((s) => s.ttsConfig);
  const setSceneIndex = useGameStore((s) => s.setSceneIndex);
  const setEpisodeSub = useGameStore((s) => s.setEpisodeSub);
  const goNextScene = useGameStore((s) => s.goNextScene);
  const goPrevScene = useGameStore((s) => s.goPrevScene);
  const recordEpisodeChoice = useGameStore((s) => s.recordEpisodeChoice);
  const setIsSpeaking = useGameStore((s) => s.setIsSpeaking);
  const setGameState = useGameStore((s) => s.setGameState);

  const scenes = selectedEpisode?.scenes || [];
  const epId = selectedEpisode?.id || "";

  // Scene saat ini (sceneIndex 0 = kartu peran, 1..10 = adegan)
  const sceneNo = sceneIndex;
  const scene = sceneNo > 0 ? scenes[sceneNo - 1] : null;

  // Decision → consequence: ambil pilihan terakhir di scene decision
  const decisionScene = useMemo(
    () => scenes.find((s) => s.type === "decision"),
    [scenes]
  );

  const [audioData, setAudioData] = useState(new Uint8Array(32));
  const [showContent, setShowContent] = useState(OPTIONS_DISPLAY_MODE === "instant");
  const [isPlaying, setIsPlaying] = useState(false);
  const [lastAnswered, setLastAnswered] = useState(null); // { choiceId, feedback }
  const [flavorAck, setFlavorAck] = useState(null); // tanggapan scene dialog ber-opsi (S2, tanpa skor)
  const audioStartedRef = useRef(false);

  const accent = EPISODE_META[epId]?.accent || "#4CAF50";

  // Reset per-scene state saat scene berubah
  useEffect(() => {
    setShowContent(OPTIONS_DISPLAY_MODE === "instant");
    setLastAnswered(null);
    setFlavorAck(null);
  }, [sceneNo, episodeSub]);

  // Teks yang dibacakan untuk scene aktif
  const speechText = useMemo(() => {
    if (sceneNo === 0) {
      return EPISODE_META[epId]?.roleCard || "";
    }
    if (!scene) return "";
    switch (scene.type) {
      case "opening":
      case "refleksi_kiai":
      case "penutup":
        return scene.text;
      case "decision":
        return scene.text;
      case "dialog":
        // Scene dialog ber-opsi (S2): setelah memilih, yang dibacakan = tanggapan.
        if (scene.options?.length && flavorAck) return flavorAck;
        return scene.text;
      case "consequence": {
        // Suara harus sama dengan yang ditampilkan: feedback spesifik pilihanmu.
        const fb = scene.feedback?.[episodeChoices[String(decisionScene?.no)]?.choiceId];
        return fb || scene.text;
      }
      case "refleksi_diri": {
        // Sub 0 = intro narator (dibacakan), sisanya = pertanyaan ke-(sub).
        if (episodeSub === 0) return scene.text;
        const q = scene.questions?.[episodeSub - 1];
        return q || scene.text;
      }
      case "transfer": {
        if (lastAnswered) return lastAnswered.feedback;
        const item = scene.items?.[episodeSub];
        if (item) return item.situation;
        return scene.text;
      }
      default:
        return scene.text || "";
    }
  }, [sceneNo, scene, episodeSub, lastAnswered, epId, flavorAck]);

  const isSlowScene =
    sceneNo > 0 && scene && SLOW_SCENES.has(scene.type);

  // Auto-play audio (TTS) saat scene/text berubah
  useEffect(() => {
    ttsService.stop();
    setShowContent(OPTIONS_DISPLAY_MODE === "instant");
    audioStartedRef.current = false;
    const timer = setTimeout(() => {
      ttsService.play({
        ttsConfig,
        audio: null,
        speechText,
        onStart: () => {
          audioStartedRef.current = true;
          setIsPlaying(true);
          setIsSpeaking(true);
        },
        onEnd: () => {
          setIsPlaying(false);
          setIsSpeaking(false);
          if (OPTIONS_DISPLAY_MODE === "after_audio") {
            setShowContent(true);
          }
        },
        onError: () => {
          setIsPlaying(false);
          setIsSpeaking(false);
          setShowContent(true);
        },
      });
    }, 250);
    // Jaring pengaman: kalau audio tidak pernah mulai, jangan menggantung di
    // "Berbicara..." — tampilkan konten supaya alur selalu lanjut.
    const watchdog = setTimeout(() => {
      if (!audioStartedRef.current) {
        setIsPlaying(false);
        setIsSpeaking(false);
        setShowContent(true);
      }
    }, 4000);
    return () => {
      clearTimeout(timer);
      clearTimeout(watchdog);
      ttsService.stop();
      setIsSpeaking(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speechText]);

  const handleToggleAudio = () => {
    if (isPlaying) {
      ttsService.stop();
      setIsPlaying(false);
      setIsSpeaking(false);
      setShowContent(true);
    } else {
      ttsService.play({
        ttsConfig,
        audio: null,
        speechText,
        onStart: () => {
          setIsPlaying(true);
          setIsSpeaking(true);
        },
        onEnd: () => {
          setIsPlaying(false);
          setIsSpeaking(false);
          setShowContent(true);
        },
        onError: () => {
          setIsPlaying(false);
          setIsSpeaking(false);
          setShowContent(true);
        },
      });
    }
  };

  const handleSkipAudio = () => {
    ttsService.stop();
    setIsPlaying(false);
    setIsSpeaking(false);
    setShowContent(true);
  };

  const handleBack = () => {
    if (sceneNo <= 1) {
      setGameState("episode_select");
      return;
    }
    goPrevScene();
  };

  const handleExit = () => {
    ttsService.stop();
    setGameState("episode_select");
  };

  // Decision: pilih salah satu opsi → catat + kirim progress → next (consequence)
  const handleDecision = (option) => {
    const score = scoreFor(option.id);
    recordEpisodeChoice(String(scene.no), option.id, score);
    submitProgress({ episodeId: epId, sceneNo: scene.no, choiceId: option.id, score });
    goNextScene();
  };

  // S2 (dialog ber-opsi, tanpa skor): pilih rasa/respons → bacakan tanggapan lalu lanjut.
  const handleFlavorPick = (option) => {
    ttsService.stop();
    setIsPlaying(false);
    setIsSpeaking(false);
    setShowContent(true);
    setFlavorAck(option.feedback || scene.text);
  };

  // Transfer item: pilih opsi → catat + kirim → tampilkan feedback inline
  const handleTransferItem = (itemIdx, option) => {
    const score = scoreFor(option.id);
    const key = `9:${itemIdx}`;
    recordEpisodeChoice(key, option.id, score);
    submitProgress({
      episodeId: epId,
      sceneNo: 9,
      choiceId: `transfer:${itemIdx}:${option.id}`,
      score,
    });
    setLastAnswered({
      choiceId: option.id,
      feedback: scene.items[itemIdx].feedback?.[option.id] || scene.items[itemIdx].feedback,
    });
  };

  const handleTransferNext = () => {
    const total = scene.items.length;
    if (episodeSub + 1 < total) {
      setEpisodeSub(episodeSub + 1);
    } else {
      setEpisodeSub(0);
      goNextScene();
    }
  };

  const handleRefleksiNext = () => {
    const total = scene.questions.length;
    if (episodeSub + 1 < total) {
      setEpisodeSub(episodeSub + 1);
    } else {
      setEpisodeSub(0);
      goNextScene();
    }
  };

  const handleFinish = () => {
    submitProgress({ episodeId: epId, sceneNo: 10, choiceId: "complete" });
    ttsService.stop();
    setGameState("episode_finished");
  };

  if (!selectedEpisode) return null;

  // ---------- KARTU PERAN (sceneIndex 0) ----------
  if (sceneNo === 0) {
    return (
      <Shell
        epId={epId}
        sceneNo={sceneNo}
        accent={accent}
        isPlaying={isPlaying}
        audioData={audioData}
        onToggleAudio={handleToggleAudio}
        onSkip={handleSkipAudio}
        onBack={handleExit}
        onExit={handleExit}
      >
        <Bubble
          avatar="🎭"
          title={`Peranmu — ${EPISODE_META[epId]?.label || ""}`}
          text={EPISODE_META[epId]?.roleCard || ""}
          style={{ background: `${accent}cc` }}
        />
        <ActionButton
          label="Saya siap — masuk ▸"
          onClick={() => goNextScene()}
          color={accent}
          pulse={!isPlaying}
        />
      </Shell>
    );
  }

  // ---------- ADEGAN ----------
  const currentConsequenceFeedback = scene?.type === "consequence"
    ? scene.feedback?.[episodeChoices[String(decisionScene?.no)]?.choiceId]
    : null;

  return (
    <Shell
      epId={epId}
      sceneNo={sceneNo}
      accent={accent}
      isPlaying={isPlaying}
      audioData={audioData}
      onToggleAudio={handleToggleAudio}
      onSkip={handleSkipAudio}
      onBack={handleBack}
      onExit={handleExit}
    >
      {scene.type === "opening" && (
        <>
          <Bubble
            avatar="🎙️"
            title="Narator"
            text={scene.text}
            style={{ background: "#1a1a3ecc" }}
          />
          <ActionButton
            label="Lanjut ▸"
            onClick={() => goNextScene()}
            color="#4CAF50"
            pulse={!isPlaying}
          />
        </>
      )}

      {scene.type === "dialog" && (
        <>
          {!flavorAck ? (
            <>
              <Bubble
                avatar={avatarForSpeaker(scene.speaker)}
                title={scene.speaker}
                text={scene.text}
                style={{ background: `${accent}cc` }}
              />
              {!scene.options?.length ? (
                <ActionButton
                  label="Lanjut ▸"
                  onClick={() => goNextScene()}
                  color="#4CAF50"
                  pulse={!isPlaying}
                />
              ) : !showContent ? (
                <WaitingHint onSkip={handleSkipAudio} />
              ) : (
                <OptionsList
                  options={scene.options}
                  color={accent}
                  onSelect={handleFlavorPick}
                />
              )}
            </>
          ) : (
            <>
              <Bubble
                avatar={avatarForSpeaker(scene.speaker)}
                title={scene.speaker}
                text={flavorAck}
                style={{ background: `${accent}cc` }}
              />
              <ActionButton
                label="Lanjut ▸"
                onClick={() => goNextScene()}
                color="#4CAF50"
                pulse={!isPlaying}
              />
            </>
          )}
        </>
      )}

      {scene.type === "decision" && (
        <>
          <Bubble
            avatar={speakerAvatar("Narator")}
            title="Narator — Kini giliranmu bertindak"
            text={scene.text}
            style={{ background: "#1a1a3ecc" }}
          />
          {!showContent ? (
            <WaitingHint onSkip={handleSkipAudio} />
          ) : (
            <OptionsList
              options={scene.options}
              color={accent}
              onSelect={handleDecision}
            />
          )}
        </>
      )}

      {scene.type === "consequence" && (
        <>
          <Bubble
            avatar="👳"
            title="Tanggapan Kiai"
            text={currentConsequenceFeedback || scene.text}
            style={{ background: `${accent}dd` }}
          />
          <ActionButton
            label="Renungkan ▸"
            onClick={() => goNextScene()}
            color={accent}
            pulse={!isPlaying}
          />
        </>
      )}

      {scene.type === "refleksi_kiai" && (
        <>
          <Bubble
            avatar="👳"
            title="Renungan Kiai"
            text={scene.text}
            style={{ background: `${accent}cc` }}
          />
          <ActionButton
            label="Lanjut merenung ▸"
            onClick={() => goNextScene()}
            color={accent}
            pulse={!isPlaying}
          />
        </>
      )}

      {scene.type === "refleksi_diri" && (
        <>
          {episodeSub === 0 && (
            <Bubble
              avatar="🎙️"
              title="Refleksi Diri"
              text={stripMarker(scene.text)}
              style={{ background: "#1a1a3ecc" }}
            />
          )}
          {episodeSub > 0 && (
            <Bubble
              avatar="💭"
              title={`Pertanyaan ${episodeSub}/${scene.questions.length}`}
              text={scene.questions[episodeSub - 1]}
              style={{ background: `${accent}cc` }}
            />
          )}
          {episodeSub === 0 ? (
            <ActionButton
              label="Merenung ▸"
              onClick={() => setEpisodeSub(1)}
              color={accent}
              pulse={!isPlaying}
            />
          ) : scene.answerOptions?.[episodeSub - 1]?.options ? (
            !showContent ? (
              <WaitingHint onSkip={handleSkipAudio} />
            ) : (
              <OptionsList
                options={scene.answerOptions[episodeSub - 1].options}
                color={accent}
                onSelect={() => handleRefleksiNext()}
              />
            )
          ) : episodeSub < scene.questions.length ? (
            <ActionButton
              label="Lanjut ▸"
              onClick={handleRefleksiNext}
              color={accent}
              pulse={!isPlaying}
            />
          ) : (
            <ActionButton
              label="✓ Selesai merenung"
              onClick={handleRefleksiNext}
              color={accent}
              pulse={!isPlaying}
            />
          )}
        </>
      )}

      {scene.type === "transfer" && (
        <>
          <Bubble
            avatar="🎒"
            title={`Situasi ${Math.min(episodeSub + 1, scene.items.length)}/${scene.items.length} — Sekolah masa kini`}
            text={
              lastAnswered
                ? "Bagaimana perasaanmu? Ini hanya cerminan sikap, bukan penilaian benar-salah."
                : scene.items[episodeSub]?.situation
            }
            style={{ background: "#0f2838cc" }}
          />
          {lastAnswered ? (
            <>
              <Bubble
                avatar="💡"
                title="Umpan balik"
                text={lastAnswered.feedback}
                style={{ background: `${accent}88`, minHeight: 0 }}
                compact
              />
              <ActionButton
                label={
                  episodeSub + 1 < scene.items.length ? "Situasi berikutnya ▸" : "Lanjut ▸"
                }
                onClick={handleTransferNext}
                color="#2196F3"
              />
            </>
          ) : !showContent ? (
            <WaitingHint onSkip={handleSkipAudio} />
          ) : (
            <OptionsList
              options={scene.items[episodeSub]?.options}
              color="#2196F3"
              onSelect={(opt) => handleTransferItem(episodeSub, opt)}
            />
          )}
        </>
      )}

      {scene.type === "penutup" && (
        <>
          <Bubble
            avatar="👳"
            title="Kata Kiai"
            text={stripMarker(scene.text)}
            style={{ background: `${accent}cc` }}
          />
          <QuoteCard quote={scene.quote} accent={accent} />
          <div style={{ marginTop: "14px" }}>
            <ActionButton
              label="✓ Selesai"
              onClick={handleFinish}
              color={accent}
              pulse={!isPlaying}
            />
          </div>
        </>
      )}
    </Shell>
  );
}

/* ================== Sub-components 2D ================== */

function Shell({ epId, sceneNo, accent, audioData, isPlaying, onToggleAudio, onSkip, onBack, onExit, children }) {
  const meta = EPISODE_META[epId];
  const isVerboseScene = sceneNo > 0;
  const showAudioControls = isVerboseScene || sceneNo === 0;
  const progressLabel =
    sceneNo === 0 ? progressLabelForScene(sceneNo) : `${stageLabelForScene(sceneNo)} · ${progressLabelForScene(sceneNo)}`;

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.headerBar}>
        <div style={styles.headerLeft}>
          <button style={styles.backButton} onClick={onBack}>
            ← {sceneNo <= 1 ? "Episode" : "Adegan sebelumnya"}
          </button>
        </div>
        <div style={styles.headerCenter}>
          <span style={{ ...styles.epChip, color: accent, borderColor: `${accent}88`, background: `${accent}18` }}>
            {meta?.label || "Episode"}
          </span>
          <span style={styles.progressChip}>{progressLabel}</span>
        </div>
        <div style={styles.headerRight}>
          <button style={styles.backButton} onClick={onExit}>✕ Keluar</button>
        </div>
      </div>

      {/* Role badge */}
      <div style={{ ...styles.roleBadge, background: `${accent}26`, color: "#fff" }}>
        {roleBadgeForScene(sceneNo)}
      </div>

      <div style={styles.content}>
        {/* Audio controls */}
        {showAudioControls && (
          <div style={styles.audioRow}>
            <div style={styles.waveArea}>
              {isPlaying && <VoiceWaveform audioData={audioData} isActive color={accent} />}
            </div>
            <div style={styles.audioButtons}>
              {isPlaying ? null : (
                <button style={styles.audioMini} onClick={onToggleAudio}>
                  🔈 Putar
                </button>
              )}
              <button style={styles.audioMini} onClick={onSkip}>
                ⏭️ Lewati
              </button>
            </div>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}

function Bubble({ avatar, title, text, style, compact }) {
  return (
    <div style={{ ...styles.bubbleRow, marginBottom: compact ? "10px" : "16px" }}>
      <div style={styles.avatar}>{avatar}</div>
      <div style={styles.bubbleWrap}>
        {title && <div style={styles.bubbleTitle}>{title}</div>}
        <div style={{ ...styles.bubble, ...style }}>{text}</div>
      </div>
    </div>
  );
}

function ActionButton({ label, onClick, color, pulse }) {
  return (
    <button
      style={{ ...styles.actionButton, background: color }}
      className={pulse ? "ui-pulse" : undefined}
      onClick={onClick}
    >
      {label}
    </button>
  );
}

function OptionsList({ options, color, onSelect }) {
  const letters = ["A", "B", "C", "D"];
  return (
    <div style={styles.optionsList}>
      {(options || []).map((opt, i) => (
        <button
          key={opt.id}
          style={{
            ...styles.optionButton,
            borderLeft: `4px solid ${color}`,
          }}
          onClick={() => onSelect(opt)}
        >
          <span style={{ ...styles.optionLetter, background: color }}>{opt.id}</span>
          <span style={styles.optionLabel}>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

function WaitingHint({ onSkip }) {
  return (
    <div style={styles.waitingHint}>
      <p style={styles.waitingText}>
        Audio sedang diputar… opsi akan muncul setelahnya.
      </p>
      <button style={styles.skipButton} onClick={onSkip}>
        ⏭️ Lewati audio
      </button>
    </div>
  );
}

function QuoteCard({ quote, accent }) {
  return (
    <div style={{ ...styles.quoteCard, borderLeft: `4px solid ${accent}` }}>
      <div style={styles.quoteMark}>“</div>
      <div style={styles.quoteText}>{quote}</div>
    </div>
  );
}

const styles = {
  container: {
    position: "fixed",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-end",
    background: "transparent",
    zIndex: 100,
    overflow: "auto",
    padding: "20px",
    paddingBottom: "80px",
    pointerEvents: "none",
  },
  headerBar: {
    position: "fixed",
    top: "18px",
    left: "18px",
    right: "18px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    gap: "10px",
    pointerEvents: "auto",
    zIndex: 110,
  },
  headerLeft: {},
  headerCenter: { display: "flex", gap: "8px", alignItems: "center", flex: 1, justifyContent: "center" },
  headerRight: {},
  backButton: {
    padding: "8px 14px",
    background: "rgba(0,0,0,0.55)",
    color: "white",
    border: "none",
    borderRadius: "20px",
    cursor: "pointer",
    fontSize: "12px",
    backdropFilter: "blur(10px)",
  },
  epChip: {
    padding: "6px 12px",
    borderRadius: "16px",
    fontSize: "11px",
    fontWeight: "600",
    border: "1px solid",
    whiteSpace: "nowrap",
  },
  progressChip: {
    padding: "6px 12px",
    borderRadius: "16px",
    fontSize: "12px",
    background: "rgba(0,0,0,0.5)",
    color: "white",
    whiteSpace: "nowrap",
  },
  roleBadge: {
    position: "fixed",
    top: "64px",
    left: "18px",
    padding: "6px 14px",
    borderRadius: "14px",
    fontSize: "12px",
    fontWeight: "600",
    zIndex: 110,
    backdropFilter: "blur(8px)",
  },
  content: {
    maxWidth: "560px",
    width: "100%",
    margin: "0 auto",
    pointerEvents: "auto",
  },
  audioRow: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    marginBottom: "8px",
  },
  waveArea: {
    flex: 1,
    minWidth: 0,
    display: "flex",
    justifyContent: "flex-end",
  },
  audioButtons: {
    display: "flex",
    gap: "8px",
    flexShrink: 0,
  },
  audioMini: {
    padding: "6px 12px",
    fontSize: "12px",
    background: "rgba(0,0,0,0.5)",
    color: "white",
    border: "none",
    borderRadius: "14px",
    cursor: "pointer",
    backdropFilter: "blur(8px)",
  },
  bubbleRow: { display: "flex", alignItems: "flex-start", gap: "10px" },
  avatar: {
    width: "42px",
    height: "42px",
    borderRadius: "50%",
    background: "rgba(66,165,245,0.9)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: "20px",
    flexShrink: 0,
    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
  },
  bubbleWrap: { flex: 1, minWidth: 0 },
  bubbleTitle: {
    fontSize: "12px",
    fontWeight: "700",
    color: "rgba(255,255,255,0.85)",
    marginBottom: "4px",
  },
  bubble: {
    fontSize: "14px",
    color: "white",
    padding: "14px 18px",
    borderRadius: "18px",
    borderTopLeftRadius: "4px",
    textAlign: "left",
    lineHeight: "1.5",
    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
    backdropFilter: "blur(15px)",
  },
  actionButton: {
    width: "100%",
    padding: "14px 20px",
    fontSize: "16px",
    fontWeight: "600",
    color: "white",
    border: "none",
    borderRadius: "18px",
    cursor: "pointer",
    boxShadow: "0 6px 20px rgba(0,0,0,0.35)",
    transition: "all 0.2s ease",
  },
  optionsList: { display: "flex", flexDirection: "column", gap: "10px" },
  optionButton: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    padding: "12px 14px",
    borderRadius: "14px",
    background: "rgba(15,15,35,0.88)",
    border: "none",
    borderLeft: "4px solid #4CAF50",
    cursor: "pointer",
    textAlign: "left",
    color: "white",
    backdropFilter: "blur(12px)",
    boxShadow: "0 4px 14px rgba(0,0,0,0.3)",
    transition: "transform 0.15s ease",
  },
  optionLetter: {
    width: "30px",
    height: "30px",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "700",
    fontSize: "14px",
    color: "white",
    flexShrink: 0,
  },
  optionLabel: { fontSize: "13px", lineHeight: "1.4" },
  waitingHint: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "12px",
    padding: "14px",
  },
  waitingText: {
    margin: 0,
    fontSize: "13px",
    color: "rgba(255,255,255,0.75)",
  },
  skipButton: {
    padding: "10px 22px",
    fontSize: "13px",
    background: "rgba(0,0,0,0.5)",
    color: "white",
    border: "none",
    borderRadius: "18px",
    cursor: "pointer",
    backdropFilter: "blur(8px)",
  },
  quoteCard: {
    background: "rgba(15,15,35,0.8)",
    borderRadius: "14px",
    padding: "14px 16px",
    marginTop: "10px",
    position: "relative",
    backdropFilter: "blur(10px)",
  },
  quoteMark: { fontSize: "34px", lineHeight: 1, color: "rgba(255,255,255,0.4)" },
  quoteText: {
    fontSize: "14px",
    fontStyle: "italic",
    color: "rgba(255,255,255,0.95)",
    lineHeight: "1.5",
  },
};