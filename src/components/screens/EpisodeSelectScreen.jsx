import { useState, useEffect } from "react";
import useGameStore from "../../store/useGameStore";
import {
  fetchEpisodes,
  fetchEpisode,
  fetchTTSConfig,
} from "../../services/episodeService";
import { EPISODE_META } from "../../services/episodeMeta";
import backgroundMusic from "../../services/backgroundMusic";

/**
 * EpisodeSelectScreen - Layar pilih episode (REAL APP, live backend).
 * Jalur live: Start → [episode_select] → episode_play → episode_finished.
 * Mode mockup tidak lewat sini (tetap flow lama untuk demo client).
 *
 * Desain: "Papan Nama Langgar" — lima nilai digantung sebagai papan kayu di
 * sebatang balok, seperti papan nama di gang Kauman. Material kayu & kuningan,
 * bukan kaca gelap. Nomor urut sengaja tak dipakai: lima nilai sederajat,
 * identitasnya nama nilai.
 */
export default function EpisodeSelectScreen() {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const episodes = useGameStore((s) => s.episodes);
  const setEpisodes = useGameStore((s) => s.setEpisodes);
  const setSelectedEpisode = useGameStore((s) => s.setSelectedEpisode);
  const setTtsConfig = useGameStore((s) => s.setTtsConfig);
  const setGameState = useGameStore((s) => s.setGameState);
  const setMockMode = useGameStore((s) => s.setMockMode);

  useEffect(() => {
    backgroundMusic.playAmbient();
    setTtsConfig(null);
    loadEpisodes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadEpisodes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const list = await fetchEpisodes();
      const tts = await fetchTTSConfig();
      setEpisodes(list);
      setTtsConfig(tts);
    } catch (err) {
      console.error("Failed to load episodes:", err);
      setError(
        `Tidak dapat memuat episode dari backend (${err.message}). Pastikan backend berjalan lalu coba lagi.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = async (ep) => {
    setIsLoading(true);
    setError(null);
    try {
      const full = await fetchEpisode(ep.id);
      if (!full) throw new Error("episode_tidak_ada");
      setSelectedEpisode(full);
      setGameState("episode_play");
    } catch (err) {
      console.error("Failed to load episode:", err);
      setError("Gagal memuat episode. Silakan coba lagi.");
      setIsLoading(false);
    }
  };

  const handleBack = () => setGameState("start");

  const handleOpenMock = () => {
    setMockMode(true);
    setGameState("environment_select");
  };

  const accentOf = (id) => EPISODE_META[id]?.accent || "#C9A24A";

  return (
    <div style={styles.container}>
      <div style={styles.content} className="fade-in">
        <button style={styles.backButton} onClick={handleBack}>
          ← Menu
        </button>

        <header style={styles.header}>
          <p style={styles.eyebrow}>Kauman · Yogyakarta · 1915</p>
          <h1 style={styles.title}>Pilih Pelajaran</h1>
          <p style={styles.subtitle}>
            Lima papan di langgar, lima nilai kedamaian. Sentuh salah satunya
            untuk mendengarkan Kiai.
          </p>
        </header>

        {isLoading && (
          <div style={styles.loadingOverlay}>
            <div style={styles.spinner} />
            <p style={styles.loadingText}>Menyiapkan pelajaran…</p>
          </div>
        )}

        {error && (
          <div style={styles.errorBox}>
            <p style={styles.error}>{error}</p>
            <div style={styles.errorActions}>
              <button style={styles.retryButton} onClick={loadEpisodes}>
                🔄 Coba Lagi
              </button>
              <button style={styles.mockButton} onClick={handleOpenMock}>
                🧪 Buka Mockup (Demo)
              </button>
            </div>
          </div>
        )}

        {!isLoading && !error && (
          <div className="langgar">
            <div className="beam" />
            <div className="plaques">
              {episodes.map((ep, index) => {
                const accent = accentOf(ep.id);
                const meta = EPISODE_META[ep.id];
                return (
                  <button
                    key={ep.id}
                    className="plaque"
                    style={{ "--accent": accent, animationDelay: `${index * 0.09}s` }}
                    onClick={() => handleSelect(ep)}
                  >
                    <span className="rope" />
                    <span className="ring" />
                    <span className="board">
                      <span className="name">{ep.tema}</span>
                      <span className="rule" />
                      <span className="theme">{meta?.theme}</span>
                      <span className="meta">
                        <span>{(ep.scenes?.length || ep.totalScenes || 10)} adegan</span>
                        <span className="start">Mulai →</span>
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    position: "fixed",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    background: "transparent",
    zIndex: 100,
    overflow: "auto",
    padding: "28px 20px 48px",
    pointerEvents: "none",
  },
  content: {
    maxWidth: "920px",
    width: "100%",
    margin: "0 auto",
    pointerEvents: "auto",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  backButton: {
    alignSelf: "flex-end",
    padding: "9px 18px",
    background: "rgba(0,0,0,0.45)",
    color: "rgba(255,255,255,0.9)",
    border: "1px solid rgba(255,255,255,0.18)",
    borderRadius: "22px",
    cursor: "pointer",
    fontSize: "13px",
    backdropFilter: "blur(8px)",
    marginBottom: "18px",
  },
  header: { textAlign: "center", marginBottom: "30px" },
  eyebrow: {
    fontSize: "11px",
    fontWeight: "600",
    letterSpacing: "0.32em",
    textTransform: "uppercase",
    color: "rgba(255,235,205,0.6)",
    margin: "0 0 10px 0",
  },
  title: {
    fontSize: "44px",
    fontWeight: "600",
    margin: "0 0 10px 0",
    color: "#fff4e2",
    fontFamily: '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif',
    letterSpacing: "0.01em",
  },
  subtitle: {
    fontSize: "14px",
    color: "rgba(255,238,214,0.72)",
    margin: 0,
  },
  loadingOverlay: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
    padding: "40px 0",
    color: "white",
  },
  loadingText: { fontSize: "14px", color: "rgba(255,255,255,0.75)" },
  spinner: {
    width: "42px",
    height: "42px",
    border: "3px solid rgba(255,255,255,0.2)",
    borderTop: "3px solid white",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },
  errorBox: {
    background: "rgba(20,20,40,0.92)",
    borderRadius: "16px",
    padding: "20px",
    backdropFilter: "blur(15px)",
    boxShadow: "0 8px 30px rgba(0,0,0,0.4)",
    maxWidth: "460px",
  },
  error: { color: "#ffb4b4", fontSize: "14px", lineHeight: "1.5", margin: "0 0 16px 0" },
  errorActions: { display: "flex", gap: "10px", flexWrap: "wrap" },
  retryButton: {
    padding: "10px 20px",
    fontSize: "13px",
    background: "#2196F3",
    color: "white",
    border: "none",
    borderRadius: "20px",
    cursor: "pointer",
  },
  mockButton: {
    padding: "10px 20px",
    fontSize: "13px",
    background: "#FFA726",
    color: "#1a1a2e",
    border: "none",
    borderRadius: "20px",
    cursor: "pointer",
  },
};

/* Papan kayu & balok langgar — gaya visual inti layar ini. */
const plaqueCSS = `
  .langgar { width: 100%; }
  .beam {
    height: 12px;
    margin: 0 2%;
    border-radius: 4px;
    background: linear-gradient(180deg, #8a5a2e, #5c3a1b);
    box-shadow: inset 0 1px 0 rgba(255,235,200,0.32), inset 0 -3px 4px rgba(0,0,0,0.35),
                0 8px 16px rgba(0,0,0,0.4);
  }
  .plaques {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 10px;
    flex-wrap: wrap;
    padding: 0 1%;
  }
  .plaque {
    flex: 1 1 138px;
    min-width: 126px;
    max-width: 168px;
    display: flex;
    flex-direction: column;
    align-items: center;
    background: transparent;
    border: none;
    padding: 0;
    cursor: pointer;
    font-family: inherit;
    opacity: 0;
    animation: fadeIn 0.5s ease forwards;
  }
  .langgar .plaque:hover { transform: none; }
  .plaque .rope {
    width: 2px;
    height: 18px;
    background: linear-gradient(#6b4a2a, #8a6238);
  }
  .plaque .ring {
    width: 11px;
    height: 11px;
    border: 2px solid #c9a24a;
    border-radius: 50%;
    margin: -1px 0 1px;
    background: rgba(201,162,74,0.12);
  }
  .plaque .board {
    width: 100%;
    border-radius: 6px;
    padding: 16px 12px 13px;
    border: 1px solid rgba(40,22,8,0.65);
    background:
      linear-gradient(180deg, rgba(255,255,255,0.08), rgba(0,0,0,0.12)),
      linear-gradient(160deg, #8a5a2e 0%, #744a24 55%, #5a3819 100%);
    box-shadow: inset 0 1px 0 rgba(255,235,200,0.35),
                inset 0 -2px 0 rgba(0,0,0,0.35),
                0 10px 18px rgba(0,0,0,0.35);
    transform-origin: 50% -30%;
    transition: transform 0.3s cubic-bezier(.34,1.56,.64,1),
                box-shadow 0.3s ease, filter 0.3s ease;
    text-align: center;
  }
  .plaque:hover .board,
  .plaque:focus-visible .board {
    transform: rotate(-1.5deg) translateY(-3px);
    filter: brightness(1.08);
    box-shadow: inset 0 1px 0 rgba(255,235,200,0.5),
                inset 0 -2px 0 rgba(0,0,0,0.35),
                0 16px 26px rgba(0,0,0,0.45);
  }
  .plaque:focus-visible { outline: 2px solid #ffe6b0; outline-offset: 4px; border-radius: 6px; }
  .plaque .name {
    display: block;
    font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
    font-size: 18px;
    font-weight: 700;
    letter-spacing: 0.02em;
    color: #fff4e2;
    text-shadow: 0 1px 0 rgba(0,0,0,0.5), 0 -1px 0 rgba(255,255,255,0.10);
  }
  .plaque .rule {
    display: block;
    width: 34px;
    height: 2px;
    margin: 8px auto 7px;
    border-radius: 2px;
    background: var(--accent, #c9a24a);
    opacity: 0.9;
  }
  .plaque .theme {
    display: block;
    font-size: 11px;
    font-style: italic;
    color: rgba(255,238,214,0.74);
    line-height: 1.35;
    min-height: 30px;
  }
  .plaque .meta {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 2px;
    margin-top: 8px;
    font-size: 11px;
    color: rgba(255,238,214,0.58);
  }
  .plaque .start {
    font-weight: 700;
    color: #ffe6b0;
    opacity: 0;
    transform: translateY(3px);
    transition: opacity 0.2s ease, transform 0.2s ease;
  }
  .plaque:hover .start,
  .plaque:focus-visible .start {
    opacity: 1;
    transform: none;
  }
  @media (max-width: 700px) {
    .plaques { justify-content: center; }
    .beam { margin: 0 6%; }
  }
  @media (prefers-reduced-motion: reduce) {
    .plaque { animation-duration: 0.01s; }
    .plaque .board { transition: none; }
  }
`;

if (typeof document !== "undefined" && !document.getElementById("plaque-styles")) {
  const el = document.createElement("style");
  el.id = "plaque-styles";
  el.textContent = plaqueCSS;
  document.head.appendChild(el);
}