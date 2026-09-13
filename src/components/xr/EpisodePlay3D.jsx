import { useState, useEffect, useMemo, useRef } from "react";
import { Text, RoundedBox } from "@react-three/drei";
import Panel3D from "./Panel3D";
import Button3D from "./Button3D";
import VoiceWaveform3D from "./VoiceWaveform3D";
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
import KiaiSpeaker3D from "./KiaiSpeaker3D";

const SLOW_SCENES = new Set(["decision", "transfer"]);

const stripMarker = (t) => (t || "").replace(/^\s*Narator\s*:\s*/, "");

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

  const decisionScene = useMemo(
    () => scenes.find((s) => s.type === "decision"),
    [scenes]
  );

  const [showContent, setShowContent] = useState(false);
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
      // Sub 0 = intro narator, sisanya = pertanyaan ke-(sub).
      if (episodeSub === 0) return scene.text;
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
    setShowContent(false);
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
          setShowContent(true);
        },
        onError: () => {
          setIsPlaying(false);
          setIsSpeaking(false);
          setShowContent(true);
        },
      });
    }, 250);
    // Jaring pengaman: kalau audio tidak kunjung mulai (mis. Web Speech/XA
    // diblokir di sesi immersive, atau autoplay gagal diam-diam), jangan biarkan
    // layar menggantung — tampilkan opsi/isi supaya alur selalu lanjut.
    const watchdog = setTimeout(() => {
      if (!startedRef.current) {
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
  }, [speechText, isAudioOwner]);

  if (!selectedEpisode) return null;

  const handleSkip = () => {
    ttsService.stop();
    setIsPlaying(false);
    setIsSpeaking(false);
    setShowContent(true);
  };

  const handleDecision = (option) => {
    const score = scoreFor(option.id);
    recordEpisodeChoice(String(scene.no), option.id, score);
    submitProgress({ episodeId: epId, sceneNo: scene.no, choiceId: option.id, score });
    goNextScene();
  };

  // S2 (dialog ber-opsi, tanpa skor): pilih rasa/respons → bacakan tanggapan lalu lanjut.
  const handleFlavorPick = (option) => {
    setShowContent(true);
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
    setLastAnswered({
      choiceId: option.id,
      feedback: scene.items[itemIdx].feedback?.[option.id] || scene.items[itemIdx].feedback,
    });
  };

  const handleTransferNext = () => {
    if (episodeSub + 1 < scene.items.length) setEpisodeSub(episodeSub + 1);
    else {
      setEpisodeSub(0);
      goNextScene();
    }
  };

  const handleRefleksiNext = () => {
    if (episodeSub + 1 < scene.questions.length) setEpisodeSub(episodeSub + 1);
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
              position={[0, 0.62, 0.04]}
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
              position={[0, -0.75, 0.05]}
              size={[1.5, 0.12, 0.03]}
              color={accent}
              hoverColor={accent}
              text="Saya siap — masuk"
              textSize={0.04}
              pulse={!isPlaying}
              onClick={() => goNextScene()}
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
                  yTop={0.72}
                />
                <Button3D
                  position={[0, -0.78, 0.05]}
                  size={[1.2, 0.12, 0.03]}
                  color="#4CAF50"
                  hoverColor="#66BB6A"
                  text="Lanjut ▸"
                  textSize={0.04}
                  pulse={!isPlaying}
                  onClick={() => goNextScene()}
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
                      yTop={0.72}
                    />
                    {!scene.options?.length ? (
                      <Button3D
                        position={[0, -0.78, 0.05]}
                        size={[1.2, 0.12, 0.03]}
                        color="#4CAF50"
                        hoverColor="#66BB6A"
                        text="Lanjut ▸"
                        textSize={0.04}
                        pulse={!isPlaying}
                        onClick={() => goNextScene()}
                      />
                    ) : !showContent ? (
                      <WaitingState onSkip={handleSkip} isPlaying={isPlaying} accent={accent} />
                    ) : (
                      <OptionRows
                        options={scene.options}
                        color={accent}
                        yStart={0.38}
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
                      yTop={0.72}
                    />
                    <Button3D
                      position={[0, -0.78, 0.05]}
                      size={[1.2, 0.12, 0.03]}
                      color="#4CAF50"
                      hoverColor="#66BB6A"
                      text="Lanjut ▸"
                      textSize={0.04}
                      pulse={!isPlaying}
                      onClick={() => goNextScene()}
                    />
                  </>
                )}
              </>
            )}

            {scene.type === "decision" && (
              <>
                <BodyText title="🎙️ Kini giliranmu bertindak" text={scene.text} accent={accent} yTop={0.72} />
                {!showContent ? (
                  <WaitingState onSkip={handleSkip} isPlaying={isPlaying} accent={accent} />
                ) : (
                  <OptionRows options={scene.options} color={accent} yStart={0.38} onSelect={handleDecision} />
                )}
              </>
            )}

            {scene.type === "consequence" && (
              <>
                <BodyText
                  title="👳 Tanggapan Kiai"
                  text={currentConsequenceFeedback || scene.text}
                  accent={accent}
                  yTop={0.72}
                />
                <Button3D
                  position={[0, -0.78, 0.05]}
                  size={[1.2, 0.12, 0.03]}
                  color={accent}
                  hoverColor={accent}
                  text="Renungkan ▸"
                  textSize={0.04}
                  pulse={!isPlaying}
                  onClick={() => goNextScene()}
                />
              </>
            )}

            {scene.type === "refleksi_kiai" && (
              <>
                <BodyText title="👳 Renungan Kiai" text={scene.text} accent={accent} yTop={0.72} />
                <Button3D
                  position={[0, -0.78, 0.05]}
                  size={[1.3, 0.12, 0.03]}
                  color={accent}
                  hoverColor={accent}
                  text="Lanjut merenung ▸"
                  textSize={0.04}
                  pulse={!isPlaying}
                  onClick={() => goNextScene()}
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
                  yTop={0.72}
                />
                {episodeSub === 0 ? (
                  <Button3D
                    position={[0, -0.78, 0.05]}
                    size={[1.2, 0.12, 0.03]}
                    color={accent}
                    hoverColor={accent}
                    text="Merenung ▸"
                    textSize={0.04}
                    pulse={!isPlaying}
                    onClick={() => setEpisodeSub(1)}
                  />
                ) : scene.answerOptions?.[episodeSub - 1]?.options ? (
                  !showContent ? (
                    <WaitingState onSkip={handleSkip} isPlaying={isPlaying} accent={accent} />
                  ) : (
                    <OptionRows
                      options={scene.answerOptions[episodeSub - 1].options}
                      color={accent}
                      yStart={0.30}
                      onSelect={handleRefleksiNext}
                    />
                  )
                ) : episodeSub < scene.questions.length ? (
                  <Button3D
                    position={[0, -0.78, 0.05]}
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
                    position={[0, -0.78, 0.05]}
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

            {scene.type === "transfer" && (
              <>
                <BodyText
                  title={`🎒 Situasi ${Math.min(episodeSub + 1, scene.items.length)}/${scene.items.length}`}
                  text={
                    lastAnswered
                      ? "Umpan balik — cerminan sikap, bukan benar-salah."
                      : scene.items[episodeSub]?.situation || scene.text
                  }
                  accent="#2196F3"
                  yTop={0.72}
                />
                {lastAnswered ? (
                  <>
                    <BodyText title="💡" text={lastAnswered.feedback} accent={accent} yTop={0.30} compact />
                    <Button3D
                      position={[0, -0.78, 0.05]}
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
                ) : !showContent ? (
                  <WaitingState onSkip={handleSkip} isPlaying={isPlaying} accent="#2196F3" />
                ) : (
                  <OptionRows
                    options={scene.items[episodeSub]?.options}
                    color="#2196F3"
                    yStart={0.38}
                    onSelect={(opt) => handleTransferItem(episodeSub, opt)}
                  />
                )}
              </>
            )}

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
                  position={[0, -0.82, 0.05]}
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
          position={[-1.05, 0.95, 0.04]}
          size={[0.55, 0.1, 0.03]}
          color="#333333"
          hoverColor="#555555"
          text="← Kembali"
          textSize={0.032}
          onClick={() => {
            if (sceneIndex <= 1) setGameState("episode_select");
            else goPrevScene();
          }}
        />
        <Button3D
          position={[1.05, 0.95, 0.04]}
          size={[0.5, 0.1, 0.03]}
          color={isPlaying ? "#42A5F5" : "#333333"}
          hoverColor="#555555"
          text={isPlaying ? "🔊 ..." : "🔈 Putar"}
          textSize={0.032}
          onClick={() => {
            if (isPlaying) handleSkip();
            else {
              setShowContent(true);
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

      {/* Figur Kiai — narator episode yang "berbicara" */}
      <KiaiSpeaker3D
        isSpeaking={isSpeaking}
        position={[1.45, -1.55, 0.1]}
        scale={0.92}
      />
    </group>
  );
}

/* ================== Sub-components 3D ================== */

function BodyText({ title, text, accent, yTop, compact }) {
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

function WaitingState({ onSkip, isPlaying, accent }) {
  return (
    <group position={[0, 0.12, 0.04]}>
      {isPlaying ? (
        <VoiceWaveform3D position={[0, 0, 0]} color={accent} isActive barCount={7} maxHeight={0.1} />
      ) : (
        <Text position={[0, 0, 0]} fontSize={0.035} color="#aaa" anchorX="center" anchorY="middle">
          ⏳ Menyiapkan…
        </Text>
      )}
      {/* Narasi selalu terlihat — bukan layar kosong saat suara berjalan */}
      <Text position={[0, -0.16, 0]} fontSize={0.028} color="#e8dcc0" anchorX="center" anchorY="middle">
        🎙️ Narator sedang bercerita…
      </Text>
      <Button3D
        position={[0, -0.36, 0]}
        size={[0.8, 0.1, 0.03]}
        color="#555"
        hoverColor="#777"
        text="⏭️ Lewati"
        textSize={0.032}
        onClick={onSkip}
      />
    </group>
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