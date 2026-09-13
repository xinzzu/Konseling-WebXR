import { useState, useEffect } from "react";
import { Text } from "@react-three/drei";
import Panel3D from "./Panel3D";
import Button3D from "./Button3D";
import useGameStore from "../../store/useGameStore";
import {
  fetchEpisodes,
  fetchEpisode,
  fetchTTSConfig,
} from "../../services/episodeService";
import { EPISODE_META } from "../../services/episodeMeta";

/**
 * EpisodeSelect3D - Layar pilih episode dalam VR (REAL APP).
 */
export default function EpisodeSelect3D() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const episodes = useGameStore((s) => s.episodes);
  const setEpisodes = useGameStore((s) => s.setEpisodes);
  const setSelectedEpisode = useGameStore((s) => s.setSelectedEpisode);
  const setTtsConfig = useGameStore((s) => s.setTtsConfig);
  const setGameState = useGameStore((s) => s.setGameState);

  useEffect(() => {
    setTtsConfig(null);
    (async () => {
      try {
        const [list, tts] = await Promise.all([fetchEpisodes(), fetchTTSConfig()]);
        setEpisodes(list);
        setTtsConfig(tts);
      } catch (err) {
        console.error("EpisodeSelect3D load error:", err);
        setError("Gagal memuat episode.");
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelect = async (ep) => {
    setError(null);
    try {
      const full = await fetchEpisode(ep.id);
      setSelectedEpisode(full);
      setGameState("episode_play");
    } catch (err) {
      console.error("EpisodeSelect3D select error:", err);
      setError("Gagal memuat episode.");
    }
  };

  if (loading) {
    return (
      <group position={[0, 1.5, -2]}>
        <Text fontSize={0.08} color="white" anchorX="center" anchorY="middle">
          Menyiapkan episode...
        </Text>
      </group>
    );
  }

  return (
    <group position={[0, 1.7, -1.4]}>
      <Panel3D
        position={[0, 0, 0]}
        width={2.5}
        height={2.1}
        backgroundColor="#0a0a1a"
        followCamera
      >
        <Text position={[0, 0.9, 0.04]} fontSize={0.07} color="white" anchorX="center" anchorY="middle">
          Pilih Pelajaran
        </Text>
        <Text position={[0, 0.8, 0.04]} fontSize={0.028} color="#aaa" anchorX="center" anchorY="middle">
          Lima nilai kedamaian bersama Kiai Ahmad Dahlan
        </Text>

        {error && (
          <Text position={[0, 0.3, 0.05]} fontSize={0.03} color="#ffb4b4" anchorX="center" anchorY="middle">
            {error}
          </Text>
        )}

        {(episodes || []).map((ep, i) => {
          const accent = EPISODE_META[ep.id]?.accent || "#4CAF50";
          return (
            <group key={ep.id}>
              <Button3D
                position={[0, 0.55 - i * 0.27, 0.04]}
                size={[2.2, 0.22, 0.03]}
                color={accent}
                hoverColor={accent}
                text={`${i + 1}. ${ep.tema} — ${ep.subtitle}`}
                textSize={0.032}
                onClick={() => handleSelect(ep)}
              />
            </group>
          );
        })}

        <Button3D
          position={[-1.05, 0.95, 0.04]}
          size={[0.5, 0.1, 0.03]}
          color="#333"
          hoverColor="#555"
          text="← Menu"
          textSize={0.032}
          onClick={() => setGameState("start")}
        />
      </Panel3D>
    </group>
  );
}