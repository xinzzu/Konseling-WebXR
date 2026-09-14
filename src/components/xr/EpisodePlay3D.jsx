import { useState, useEffect, useMemo, useRef } from "react";
import { Text, RoundedBox } from "@react-three/drei";
import Panel3D from "./Panel3D";
import Button3D from "./Button3D";
import useGameStore from "../../store/useGameStore";
import {
  submitProgress,
  scoreFor,
} from "../../services/episodeService";
import {
  EPISODE_META,
  roleBadgeForScene,
  progressLabelForScene,
  stageLabelForScene,
  avatarForSpeaker,
} from "../../services/episodeMeta";
import ttsService from "../../services/ttsService";
import { useAudioOwner } from "../../hooks/useAudioOwner";
import KiaiSpeaker3D, { personaForSpeaker } from "./KiaiSpeaker3D";

const SLOW_SCENES = new Set(["decision", "transfer"]);

const stripMarker = (t) => (t || "").replace(/^\s*Narator\s*:\s*/, "");

// ===== Layout teks panel episode =====
// BodyText pakai maxWidth 2.2, fontSize 0.027, lineHeight 1.35, anchorY top di yTop-0.05.
// Semua komposisi dihitung sebagai SATU BLOK UTUH (judul + isi + tombol/opsi) lalu
// titik tengah blok itu di-vertikal-tengah area panel — bukan teks saja yang ditengah.
const CONTENT_TOP = 0.76;     // batas atas area konten (di bawah header panel)
const CONTENT_BOTTOM = -0.80; // batas bawah area konten
const CONTENT_CENTER = (CONTENT_TOP + CONTENT_BOTTOM) / 2;
const BODY_FONT = 0.027;
const BODY_LINE_H = BODY_FONT * 1.35;

function blockLines(text, font = BODY_FONT, lineHeight = 1.35) {
  const cpl = Math.max(1, Math.floor(2.2 / (font * 0.55)));
  return Math.max(1, Math.ceil(String(text || "").length / cpl));
}

function textEndYFor(text, yTop = 0.72, fontSize = BODY_FONT, lineHeight = 1.35) {
  return yTop - 0.05 - blockLines(text, fontSize, lineHeight) * (fontSize * lineHeight);
}

// Narasi + SATU tombol di bawahnya (opening/dialog/refleksi/sub intro).
function narrationY(text) {
  const bodyH = 0.05 + blockLines(text) * BODY_LINE_H; // judul + jarak + isi
  const totalH = bodyH + 0.15 + 0.12;                  // + gap + tinggi tombol
  const titleY = CONTENT_CENTER + totalH / 2 - bodyH;
  const buttonY = titleY - 0.05 - blockLines(text) * BODY_LINE_H - 0.15;
  return { titleY, buttonY };
}
function narrationTitleY(text) {
  return narrationY(text).titleY;
}
function narrationButtonY(text) {
  return narrationY(text).buttonY;
}

// Narasi + N baris opsi di bawahnya (decision/dialog-opsi/refleksi-opsi/transfer).
function optionSceneY(text, optsCount) {
  const bodyH = 0.05 + blockLines(text) * BODY_LINE_H;
  const totalH = bodyH + 0.12 + (optsCount || 0) * ROW_H;
  const titleY = CONTENT_CENTER + totalH / 2 - bodyH;
  const optionsY = titleY - 0.05 - blockLines(text) * BODY_LINE_H - 0.12;
  return { titleY, optionsY };
}
function optionSceneTitleY(text, optsCount) {
  return optionSceneY(text, optsCount).titleY;
}
function optionSceneOptionsY(text, optsCount) {
  return optionSceneY(text, optsCount).optionsY;
}

// Kartu peran (teks tanpa judul) + tombol — rata-tengah sebagai satu blok.
function centerRoleY(text) {
  const lines = blockLines(text, 0.03, 1.3);
  const bodyH = lines * 0.03 * 1.3;
  const totalH = bodyH + 0.15 + 0.12;
  const topY = CONTENT_CENTER + totalH / 2 - bodyH;
  const buttonY = topY - bodyH - 0.15;
  return { topY, buttonY };
}
function centerRoleTopY(text) {
  return centerRoleY(text).topY;
}
function centerRoleButtonY(text) {
  return centerRoleY(text).buttonY;
}

/**
 * EpisodePlay3D - Alur episode dalam VR (REAL APP).
 * State scene (sceneIndex/episodeSub/pilihan) dibaca dari store yang sama
 * dengan layar 2D, jadi berpindah mode 2D↔VR tidak memutus alur.
 */
export default function EpisodePlay3D() {
  const selectedEpisode = useGameStore((s) => s.selectedEpisode);
  const sceneIndex = useGameStore((s) => s.sceneIndex);
  const episodeSub = useGameStore((s) => s.episodeSub);
  const episodeChoices = useGameStore((s) => s.episodeChoices);
  const ttsConfig = useGameStore((s) => s.ttsConfig);
  const setEpisodeSub = useGameStore((s) => s.setEpisodeSub);
  const goNextScene = useGameStore((s) => s.goNextScene);
  const goPrevScene = useGameStore((s) => s.goPrevScene);
  const recordEpisodeChoice = useGameStore((s) => s.recordEpisodeChoice);
  const setIsSpeaking = useGameStore((s) => s.setIsSpeaking);
  const isSpeaking = useGameStore((s) => s.isSpeaking);
  const setGameState = useGameStore((s) => s.setGameState);
  const isAudioOwner = useAudioOwner("vr");

  const scenes = selectedEpisode?.scenes || [];
  const epId = selectedEpisode?.id || "";
  const scene = sceneIndex > 0 ? scenes[sceneIndex - 1] : null;

  // Siapa yang sedang "berbicara" — menentukan persona figur & gerak mulutnya.
  // Narator = suara latar (VO), jadi figur tampil diam tanpa lip-sync.
  const { speakerName, isNarrator } = useMemo(() => {
    let sp = "Narator";
    if (scene) {
      if (
        scene.type === "consequence" ||
        scene.type === "refleksi_kiai" ||
        scene.type === "penutup"
      ) {
        sp = "Kiai Ahmad Dahlan";
      } else if (scene.type === "dialog") {
        sp = scene.speaker || "Narator";
      }
    }
    return { speakerName: sp, isNarrator: /narator/i.test(sp) };
  }, [scene]);

  const persona = personaForSpeaker(speakerName);

  const decisionScene = useMemo(
    () => scenes.find((s) => s.type === "decision"),
    [scenes]
  );

  const [isPlaying, setIsPlaying] = useState(false);
  const [lastAnswered, setLastAnswered] = useState(null);
  const [flavorAck, setFlavorAck] = useState(null); // tanggapan dialog ber-opsi (S2, tanpa skor)
  const startedRef = useRef(false);

  const accent = EPISODE_META[epId]?.accent || "#4CAF50";

  const speechText = useMemo(() => {
    if (sceneIndex === 0) return EPISODE_META[epId]?.roleCard || "";
    if (!scene) return "";
    if (scene.type === "dialog") {
      // Dialog ber-opsi (S2): setelah memilih, yang dibacakan = tanggapan.
      if (scene.options?.length && flavorAck) return flavorAck;
      return scene.text;
    }
if (scene.type === "refleksi_diri") {
      // Sub 0 = intro narator (dibacakan), sisanya = pertanyaan ke-(sub).
      // Prefix "Narator:" di-strip supaya audio sama dengan yang ditampilkan.
      if (episodeSub === 0) return stripMarker(scene.text);
      const q = scene.questions?.[episodeSub - 1];
      return q || scene.text;
    }
    if (scene.type === "consequence") {
      // Suara harus sama dengan yang ditampilkan: feedback spesifik pilihanmu.
      const fb =
        scene.feedback?.[episodeChoices[String(decisionScene?.no)]?.choiceId];
      return fb || scene.text;
    }
    if (scene.type === "transfer") {
      if (lastAnswered) return lastAnswered.feedback;
      const item = scene.items?.[episodeSub];
      return item ? item.situation : scene.text;
    }
    return scene.text || "";
  }, [sceneIndex, scene, episodeSub, lastAnswered, epId, episodeChoices, decisionScene, flavorAck]);

  useEffect(() => {
    // 3D hanya pemilik audio saat VR. Di mode 2D jangan sentuh ttsService
    // sama sekali — 2D yang memutar, dan sentuhan di sini akan memicu suara dobel.
    if (!isAudioOwner) return;
    ttsService.stop();
    setLastAnswered(null);
    setFlavorAck(null);
    startedRef.current = false;

    const timer = setTimeout(() => {
      ttsService.play({
        ttsConfig,
        audio: null,
        speechText,
        onStart: () => {
          startedRef.current = true;
          setIsPlaying(true);
          setIsSpeaking(true);
        },
        onEnd: () => {
          setIsPlaying(false);
          setIsSpeaking(false);
        },
        onError: () => {
          setIsPlaying(false);
          setIsSpeaking(false);
        },
      });
    }, 250);
    // Jaring pengaman 1: audio tidak kunjung mulai (mis. autoplay diblokir
    // di sesi immersive) — jangan biarkan tombol Putar menggantung.
    const watchdog = setTimeout(() => {
      if (!startedRef.current) {
        setIsPlaying(false);
        setIsSpeaking(false);
      }
    }, 4500);
    // Jaring pengaman 2: narasi macet di tengah (audio hang / tak kunjung
    // selesai) — hentikan suara supaya alur selalu lanjut.
    const estSafe = Math.max(
      6000,
      Math.round((speechText || "").length / 13) * 1000 + 16000
    );
    const stuckTimer = setTimeout(() => {
      setIsPlaying(false);
      setIsSpeaking(false);
      ttsService.stop();
    }, estSafe);
    return () => {
      clearTimeout(timer);
      clearTimeout(watchdog);
      clearTimeout(stuckTimer);
      ttsService.stop();
      setIsSpeaking(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speechText, isAudioOwner]);

  if (!selectedEpisode) return null;

  const handleSkip = () => {
    ttsService.stop();
    setIsPlaying(false);
    setIsSpeaking(false);
  };

  // Stop audio SECARA LANGSUNG sebelum pindah scene — mencegah sisa audio
  // scene sebelumnya tetap berbunyi saat teks scene baru sudah muncul.
  const stopAudio = () => {
    ttsService.stop();
    setIsPlaying(false);
    setIsSpeaking(false);
  };

  const stopAndGo = () => {
    stopAudio();
    goNextScene();
  };

  const stopAndBack = () => {
    stopAudio();
    if (sceneIndex <= 1) setGameState("episode_select");
    else goPrevScene();
  };

  const handleDecision = (option) => {
    const score = scoreFor(option.id);
    recordEpisodeChoice(String(scene.no), option.id, score);
    submitProgress({ episodeId: epId, sceneNo: scene.no, choiceId: option.id, score });
    stopAudio();
    goNextScene();
  };

  // S2 (dialog ber-opsi, tanpa skor): pilih rasa/respons → bacakan tanggapan lalu lanjut.
  const handleFlavorPick = (option) => {
    stopAudio();
    setFlavorAck(option.feedback || scene.text);
  };

  const handleTransferItem = (itemIdx, option) => {
    const score = scoreFor(option.id);
    recordEpisodeChoice(`9:${itemIdx}`, option.id, score);
    submitProgress({
      episodeId: epId,
      sceneNo: 9,
      choiceId: `transfer:${itemIdx}:${option.id}`,
      score,
    });
    stopAudio();
    setLastAnswered({
      choiceId: option.id,
      feedback: scene.items[itemIdx].feedback?.[option.id] || scene.items[itemIdx].feedback,
    });
  };

  const handleTransferNext = () => {
    stopAudio();
    if (episodeSub + 1 < scene.items.length) setEpisodeSub(episodeSub + 1);
    else {
      setEpisodeSub(0);
      goNextScene();
    }
  };

  const handleRefleksiNext = () => {
    stopAudio();
    // Lanjut sub hanya sampai pertanyaan terakhir; setelahnya pindah scene.
    if (episodeSub < scene.questions.length) setEpisodeSub(episodeSub + 1);
    else {
      setEpisodeSub(0);
      goNextScene();
    }
  };

  const currentConsequenceFeedback =
    scene?.type === "consequence"
      ? scene.feedback?.[episodeChoices[String(decisionScene?.no)]?.choiceId]
      : null;

  const isSlow = scene && SLOW_SCENES.has(scene.type);
  const label = EPISODE_META[epId]?.label || "Episode";

  return (
    <group position={[0, 1.55, -1.6]}>
      <Panel3D
        position={[0, 0, 0]}
        width={2.5}
        height={2.15}
        backgroundColor="#0a0a1a"
        followCamera
      >
        {/* Header */}
        <Text position={[0, 0.95, 0.03]} fontSize={0.05} color="white" anchorX="center" anchorY="middle">
          {label}
        </Text>
        <Text position={[0, 0.86, 0.03]} fontSize={0.026} color="white" anchorX="center" anchorY="middle">
          {roleBadgeForScene(sceneIndex)}
        </Text>
        <Text position={[0, 0.78, 0.03]} fontSize={0.026} color={accent} anchorX="center" anchorY="middle">
          {sceneIndex === 0
            ? progressLabelForScene(sceneIndex)
            : `${stageLabelForScene(sceneIndex)} · ${progressLabelForScene(sceneIndex)}`}
        </Text>

        {/* ===== KARTU PERAN (sceneIndex 0) ===== */}
        {sceneIndex === 0 && (
          <>
            <Text
              position={[0, centerRoleTopY(EPISODE_META[epId]?.roleCard), 0.04]}
              fontSize={0.03}
              color="white"
              anchorX="center"
              anchorY="top"
              maxWidth={2.2}
              textAlign="center"
              lineHeight={1.3}
            >
              {EPISODE_META[epId]?.roleCard}
            </Text>
            <Button3D
              position={[0, centerRoleButtonY(EPISODE_META[epId]?.roleCard), 0.05]}
              size={[1.5, 0.12, 0.03]}
              color={accent}
              hoverColor={accent}
              text="Saya siap — masuk"
              textSize={0.04}
              pulse={!isPlaying}
              onClick={stopAndGo}
            />
          </>
        )}

        {scene && (
          <>
            {/* Body text */}
            {scene.type === "opening" && (
              <>
                <BodyText
                  title={`🎙️ Narator`}
                  text={scene.text}
                  accent={accent}
                  yTop={narrationTitleY(scene.text)}
                />
                <Button3D
                  position={[0, narrationButtonY(scene.text), 0.05]}
                  size={[1.2, 0.12, 0.03]}
                  color="#4CAF50"
                  hoverColor="#66BB6A"
                  text="Lanjut ▸"
                  textSize={0.04}
                  pulse={!isPlaying}
                  onClick={stopAndGo}
                />
              </>
            )}

            {scene.type === "dialog" && (
              <>
                {!flavorAck ? (
                  <>
                    <BodyText
                      title={`${avatarForSpeaker(scene.speaker)} ${scene.speaker}`}
                      text={scene.text}
                      accent={accent}
                      yTop={narrationTitleY(scene.text)}
                    />
                    {!scene.options?.length ? (
                      <Button3D
                        position={[0, narrationButtonY(scene.text), 0.05]}
                        size={[1.2, 0.12, 0.03]}
                        color="#4CAF50"
                        hoverColor="#66BB6A"
                        text="Lanjut ▸"
                        textSize={0.04}
                        pulse={!isPlaying}
                        onClick={stopAndGo}
                      />
                    ) : (
                      <OptionRows
                        options={scene.options}
                        color={accent}
yStart={optionSceneOptionsY(scene.text, scene.options.length)}
                        onSelect={handleFlavorPick}
                      />
                    )}
                  </>
                ) : (
                  <>
                    <BodyText
                      title={`${avatarForSpeaker(scene.speaker)} ${scene.speaker}`}
                      text={flavorAck}
                      accent={accent}
                      yTop={narrationTitleY(flavorAck)}
                    />
                    <Button3D
                      position={[0, narrationButtonY(flavorAck), 0.05]}
                      size={[1.2, 0.12, 0.03]}
                      color="#4CAF50"
                      hoverColor="#66BB6A"
                      text="Lanjut ▸"
                      textSize={0.04}
                      pulse={!isPlaying}
                      onClick={stopAndGo}
                    />
                  </>
                )}
              </>
            )}

            {scene.type === "decision" && (
              <>
                <BodyText title="🎙️ Kini giliranmu bertindak" text={scene.text} accent={accent} yTop={optionSceneTitleY(scene.text, scene.options.length)} />
                <OptionRows options={scene.options} color={accent} yStart={optionSceneOptionsY(scene.text, scene.options.length)} onSelect={handleDecision} />
              </>
            )}

            {scene.type === "consequence" && (
              <>
                <BodyText
                  title="👳 Tanggapan Kiai"
                  text={currentConsequenceFeedback || scene.text}
                  accent={accent}
                  yTop={narrationTitleY(currentConsequenceFeedback || scene.text)}
                />
                <Button3D
                  position={[0, narrationButtonY(currentConsequenceFeedback || scene.text), 0.05]}
                  size={[1.2, 0.12, 0.03]}
                  color={accent}
                  hoverColor={accent}
                  text="Renungkan ▸"
                  textSize={0.04}
                  pulse={!isPlaying}
                  onClick={stopAndGo}
                />
              </>
            )}

            {scene.type === "refleksi_kiai" && (
              <>
                <BodyText title="👳 Renungan Kiai" text={scene.text} accent={accent} yTop={narrationTitleY(scene.text)} />
                <Button3D
                  position={[0, narrationButtonY(scene.text), 0.05]}
                  size={[1.3, 0.12, 0.03]}
                  color={accent}
                  hoverColor={accent}
                  text="Lanjut merenung ▸"
                  textSize={0.04}
                  pulse={!isPlaying}
                  onClick={stopAndGo}
                />
              </>
            )}

            {scene.type === "refleksi_diri" && (
              <>
                <BodyText
                  title={
                    episodeSub === 0
                      ? "🎙️ Refleksi Diri"
                      : `💭 Pertanyaan ${episodeSub}/${scene.questions.length}`
                  }
                  text={
                    episodeSub === 0
                      ? stripMarker(scene.text)
                      : scene.questions[episodeSub - 1]
                  }
                  accent={accent}
                  yTop={
                    episodeSub === 0
                      ? narrationTitleY(stripMarker(scene.text))
                      : scene.answerOptions?.[episodeSub - 1]?.options
                        ? optionSceneTitleY(
                            scene.questions[episodeSub - 1],
                            scene.answerOptions[episodeSub - 1].options.length
                          )
                        : narrationTitleY(scene.questions[episodeSub - 1])
                  }
                />
                {episodeSub === 0 ? (
                  <Button3D
                    position={[0, narrationButtonY(stripMarker(scene.text)), 0.05]}
                    size={[1.2, 0.12, 0.03]}
                    color={accent}
                    hoverColor={accent}
                    text="Merenung ▸"
                    textSize={0.04}
                    pulse={!isPlaying}
                    onClick={() => {
                      stopAudio();
                      setEpisodeSub(1);
                    }}
                  />
                ) : scene.answerOptions?.[episodeSub - 1]?.options ? (
                  <OptionRows
                    options={scene.answerOptions[episodeSub - 1].options}
                    color={accent}
                    yStart={optionSceneOptionsY(
                      scene.questions[episodeSub - 1],
                      scene.answerOptions[episodeSub - 1].options.length
                    )}
                    onSelect={handleRefleksiNext}
                  />
                ) : episodeSub < scene.questions.length ? (
                  <Button3D
                    position={[0, narrationButtonY(scene.questions[episodeSub - 1]), 0.05]}
                    size={[1.2, 0.12, 0.03]}
                    color={accent}
                    hoverColor={accent}
                    text="Lanjut ▸"
                    textSize={0.04}
                    pulse={!isPlaying}
                    onClick={handleRefleksiNext}
                  />
                ) : (
                  <Button3D
                    position={[0, narrationButtonY(scene.questions[episodeSub - 1]), 0.05]}
                    size={[1.4, 0.12, 0.03]}
                    color={accent}
                    hoverColor={accent}
                    text="✓ Selesai merenung"
                    textSize={0.04}
                    pulse={!isPlaying}
                    onClick={handleRefleksiNext}
                  />
                )}
              </>
            )}

            {scene.type === "transfer" && (() => {
              const sitText = lastAnswered
                ? "Umpan balik — cerminan sikap, bukan benar-salah."
                : scene.items[episodeSub]?.situation || scene.text;
              const feedbackY = textEndYFor(sitText, narrationTitleY(sitText)) - 0.05;
              return (
                <>
                  <BodyText
                    title={`🎒 Situasi ${Math.min(episodeSub + 1, scene.items.length)}/${scene.items.length}`}
                    text={sitText}
                    accent="#2196F3"
                    yTop={narrationTitleY(sitText)}
                  />
                  {lastAnswered ? (
                    <>
                      <BodyText title="💡" text={lastAnswered.feedback} accent={accent} yTop={feedbackY} />
                      <Button3D
                        position={[0, textEndYFor(lastAnswered.feedback, feedbackY) - 0.15, 0.05]}
                        size={[1.6, 0.12, 0.03]}
                        color="#2196F3"
                        hoverColor="#42A5F5"
                        text={
                          episodeSub + 1 < scene.items.length
                            ? "Situasi berikutnya ▸"
                            : "Lanjut ▸"
                        }
                        textSize={0.04}
                        onClick={handleTransferNext}
                      />
                    </>
                  ) : (
                    <OptionRows
                      options={scene.items[episodeSub]?.options}
                      color="#2196F3"
                      yStart={optionSceneOptionsY(
                        sitText,
                        scene.items[episodeSub]?.options?.length || 0
                      )}
                      onSelect={(opt) => handleTransferItem(episodeSub, opt)}
                    />
                  )}
                </>
              );
            })()}

            {scene.type === "penutup" && (
              <>
                <BodyText title="👳 Kata Kiai" text={stripMarker(scene.text)} accent={accent} yTop={0.72} />
                <Text
                  position={[0, -0.45, 0.04]}
                  fontSize={0.028}
                  color="white"
                  anchorX="center"
                  anchorY="top"
                  maxWidth={2.2}
                  textAlign="center"
                  lineHeight={1.3}
                  fontStyle="italic"
                >
                  “{scene.quote}”
                </Text>
                <Button3D
                  position={[0, textEndYFor(scene.quote, -0.45, 0.028, 1.3) - 0.15, 0.05]}
                  size={[1.2, 0.12, 0.03]}
                  color={accent}
                  hoverColor={accent}
                  text="✓ Selesai"
                  textSize={0.04}
                  pulse={!isPlaying}
                  onClick={() => {
                    submitProgress({ episodeId: epId, sceneNo: 10, choiceId: "complete" });
                    ttsService.stop();
                    setGameState("episode_finished");
                  }}
                />
              </>
            )}
          </>
        )}

        {/* Nav buttons */}
        <Button3D
          position={[-0.92, 0.95, 0.04]}
          size={[0.55, 0.1, 0.03]}
          color="#333333"
          hoverColor="#555555"
          text="← Kembali"
          textSize={0.032}
          onClick={stopAndBack}
        />
        <Button3D
          position={[0.92, 0.95, 0.04]}
          size={[0.5, 0.1, 0.03]}
          color={isPlaying ? "#42A5F5" : "#333333"}
          hoverColor="#555555"
          text={isPlaying ? "🔊 ..." : "🔈 Putar"}
          textSize={0.032}
          onClick={() => {
            if (isPlaying) handleSkip();
            else {
              ttsService.play({
                ttsConfig,
                audio: null,
                speechText,
                onStart: () => setIsPlaying(true),
                onEnd: () => setIsPlaying(false),
                onError: () => setIsPlaying(false),
              });
            }
          }}
        />
      </Panel3D>

      {/* Figur tokoh episode — persona mengikuti speaker scene;
          diam (tanpa lip-sync) saat Narator yang membacakan */}
      <KiaiSpeaker3D
        isSpeaking={isSpeaking && !isNarrator}
        persona={persona}
        label={isNarrator ? null : persona.name}
        position={[1.45, -1.55, 0.1]}
        scale={2.0}
      />
    </group>
  );
}

/* ================== Sub-components 3D ================== */

function BodyText({ title, text, accent, yTop }) {
  return (
    <>
      <Text position={[0, yTop, 0.04]} fontSize={0.032} color={accent} anchorX="center" anchorY="middle">
        {title}
      </Text>
      <Text
        position={[0, yTop - 0.05, 0.04]}
        fontSize={0.027}
        color="white"
        anchorX="center"
        anchorY="top"
        maxWidth={2.2}
        textAlign="center"
        lineHeight={1.35}
      >
        {text}
      </Text>
    </>
  );
}

const ROW_H = 0.16;

function OptionRows({ options, color, yStart, onSelect }) {
  const list = options || [];
  const maxY = yStart;
  return (
    <group position={[0, 0, 0]}>
      {list.map((opt, i) => (
        <Button3D
          key={opt.id}
          position={[0, maxY - i * ROW_H, 0.04]}
          size={[2.2, 0.13, 0.03]}
          color={color}
          hoverColor={color}
          text={`${opt.id}. ${opt.label}`}
          textSize={0.033}
          onClick={() => onSelect(opt)}
        />
      ))}
    </group>
  );
}