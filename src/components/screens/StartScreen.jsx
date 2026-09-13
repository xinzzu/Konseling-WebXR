import { useState, useEffect } from "react";
import useGameStore from "../../store/useGameStore";
import backgroundMusic from "../../services/backgroundMusic";

/**
 * StartScreen — Gerbang langgar Kauman (1915).
 * Rebranch identik dengan layar "Pilih Pelajaran": kayu, kuningan, tinta,
 * dan lampu-lampu lentera. Signatura: pintu langgar yang menyala hangat
 * dengan lentera yang bergoyang — undangan untuk "masuk".
 */
export default function StartScreen() {
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

  const handleStart = () => {
    setMockMode(false);
    setGameState("episode_select");
  };

  const handleStartMock = () => {
    setMockMode(true);
    setGameState("environment_select");
  };

  return (
    <div style={styles.container}>
      <div style={styles.content} className="fade-in">
        {/* Balok kayu tempat papan nama digantung */}
        <div className="sg-beam" />

        {/* Papan nama (signboard) yang digantung tali + cincin kuningan */}
        <div className="sg-sign">
          <span className="sg-sign-rope" />
          <span className="sg-sign-hook" />
          <div className="sg-sign-board">
            <h1 className="sg-title">Konseling VR</h1>
            <p className="sg-tagline">Pelajaran Kedamaian bersama Kiai Ahmad Dahlan</p>
          </div>
        </div>

        {/* Pintu langgar yang menyala */}
        <div
          className="sg-entrance"
          role="button"
          tabIndex={0}
          onClick={handleStart}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleStart();
            }
          }}
        >
          <span className="sg-lantern" />
          <div className="sg-door">
            <span className="sg-door-post sg-post-l" />
            <span className="sg-door-post sg-post-r" />
            <span className="sg-door-glow" />
          </div>
          <span className="sg-pool" />
        </div>

        <p className="sg-micro">
          Dengarkan Kiai bercerita, ambil keputusanmu, lalu bawa pelajarannya ke sekolahmu.
        </p>

        <button className="sg-cta" onClick={handleStart}>
          Masuk Langgar →
        </button>
        <p className="sg-cta-hint">Lima pelajaran menantimu</p>

        <div className="sg-mock">
          <button className="sg-mock-link" onClick={handleStartMock}>
            🧪 Mode Mockup — demo tanpa backend
          </button>
          <p className="sg-mock-hint">Topik, masalah &amp; cerita sudah tersedia</p>
          <button className="sg-mock-link sg-dash-link" onClick={() => { window.location.hash = "#/riset"; }}>
            📊 Dashboard Peneliti
          </button>
          <p className="sg-mock-hint">Login JWT untuk memantau riwayat jawaban siswa</p>
        </div>
      </div>

      {/* Toggle musik */}
      <button
        style={{
          ...styles.musicButton,
          color: isMusicPlaying ? "#E7C87E" : "rgba(246,234,212,0.55)",
        }}
        onClick={handleToggleMusic}
      >
        {isMusicPlaying ? "🎵 suara" : "🔇 senyap"}
      </button>

      {/* Keterangan VR — ditaruh kiri bawah biar tidak ketimpa tombol Masuk VR */}
      <p style={styles.vrInfo}>🥽 Tombol “Masuk VR” selalu di sudut layar</p>
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
    background:
      "radial-gradient(130% 120% at 50% 24%, #2A2134 0%, #1D1626 52%, #120D18 100%)",
    zIndex: 100,
    overflow: "auto",
    padding: "28px 16px 118px",
  },
  content: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    maxWidth: "440px",
    width: "100%",
  },
  musicButton: {
    position: "absolute",
    top: "18px",
    right: "18px",
    padding: "8px 14px",
    fontSize: "12px",
    letterSpacing: "0.08em",
    background: "rgba(0,0,0,0.35)",
    border: "1px solid rgba(231,200,126,0.35)",
    borderRadius: "18px",
    cursor: "pointer",
    transition: "opacity .2s, color .2s, transform .2s",
  },
  vrInfo: {
    position: "absolute",
    left: "18px",
    right: "auto",
    bottom: "18px",
    maxWidth: "44%",
    textAlign: "left",
    fontSize: "11px",
    letterSpacing: "0.04em",
    lineHeight: 1.5,
    color: "rgba(246,234,212,0.4)",
    margin: 0,
    pointerEvents: "none",
  },
};

/* Gaya inti gerbang langgar — kayu, kuningan, lentera. */
const gateCSS = `
  .sg-beam {
    width: 360px;
    max-width: 88vw;
    height: 10px;
    border-radius: 4px;
    background: linear-gradient(180deg, #8a5a2e, #55371a);
    box-shadow: inset 0 1px 0 rgba(255,235,200,0.35), inset 0 -3px 4px rgba(0,0,0,0.4),
                0 8px 18px rgba(0,0,0,0.5);
    margin-bottom: -4px;
    animation: sgDrop .6s cubic-bezier(.22,1,.36,1) both;
  }

  .sg-sign {
    display: flex;
    flex-direction: column;
    align-items: center;
    margin-bottom: 34px;
    animation: sgDrop .6s cubic-bezier(.22,1,.36,1) .12s both;
  }
  .sg-sign-rope {
    width: 2px;
    height: 22px;
    background: linear-gradient(#6b4a2a, #8a6238);
  }
  .sg-sign-hook {
    width: 14px;
    height: 6px;
    border: 2px solid #c9a24a;
    border-bottom: none;
    border-radius: 8px 8px 0 0;
    margin-bottom: -1px;
  }
  .sg-sign-board {
    width: 300px;
    max-width: 86vw;
    border-radius: 9px;
    border: 1px solid rgba(40,22,8,0.7);
    padding: 18px 22px 16px;
    text-align: center;
    background:
      linear-gradient(180deg, rgba(255,255,255,0.06), rgba(0,0,0,0.14)),
      linear-gradient(160deg, #8a5a2e 0%, #6e4520 55%, #55371a 100%);
    box-shadow: inset 0 1px 0 rgba(255,235,200,0.4), inset 0 -2px 0 rgba(0,0,0,0.4),
                0 12px 22px rgba(0,0,0,0.45);
  }
  .sg-title {
    margin: 0;
    font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
    font-size: 33px;
    font-weight: 700;
    letter-spacing: 0.03em;
    color: #f8edda;
    text-shadow: 0 1px 0 rgba(0,0,0,0.55), 0 -1px 0 rgba(255,255,255,0.08);
  }
  .sg-tagline {
    margin: 7px 0 0;
    font-size: 10px;
    letter-spacing: 0.28em;
    text-transform: uppercase;
    color: #e7c87e;
  }

  /* ---- Pintu langgar (signaturad) ---- */
  .sg-entrance {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    cursor: pointer;
    outline: none;
    margin-bottom: 20px;
    animation: sgDoorIn .7s cubic-bezier(.22,1,.36,1) .18s both;
  }
  .sg-entrance:focus-visible {
    outline: 2px solid #ffd27a;
    outline-offset: 6px;
    border-radius: 12px;
  }

  .sg-lantern {
    width: 26px;
    height: 40px;
    margin-bottom: 6px;
    position: relative;
    transform-origin: 50% 0%;
    animation: sgSwing 4.5s ease-in-out infinite;
    filter: drop-shadow(0 0 14px rgba(255,158,94,0.55));
  }
  .sg-lantern::before {
    content: "";
    position: absolute;
    left: 3px; top: 0;
    width: 20px; height: 8px;
    background: linear-gradient(180deg, #e7c87e, #b68a3c);
    border-radius: 4px;
  }
  .sg-lantern::after {
    content: "";
    position: absolute;
    left: 6px; top: 8px;
    width: 14px; height: 24px;
    border-radius: 3px 3px 6px 6px;
    background: radial-gradient(circle at 50% 45%, #ffe3b0 0%, #ff9e5e 55%, #8a4a20 100%);
    box-shadow: inset 0 0 10px rgba(255,220,170,0.9);
    animation: sgFlicker 3s ease-in-out infinite;
  }

  .sg-door {
    position: relative;
    width: 226px;
    max-width: 78vw;
    height: 300px;
    border-top-left-radius: 120px;
    border-top-right-radius: 120px;
    background: #150d19;
    border: 4px solid #4e2f16;
    box-shadow: 0 0 0 2px rgba(46,28,13,0.9), inset 0 0 40px rgba(0,0,0,0.9),
                0 0 60px rgba(255,158,94,0.28), 0 0 90px rgba(255,158,94,0.16);
    transition: box-shadow .35s ease, filter .35s ease;
  }
  .sg-door-glow {
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background:
      radial-gradient(circle at 50% 46%, rgba(255,190,120,0.55) 0%, rgba(255,150,80,0.18) 42%, transparent 72%);
    animation: sgDoorBreath 4.5s ease-in-out infinite;
  }
  .sg-entrance:hover .sg-door,
  .sg-entrance:focus-visible .sg-door {
    box-shadow: 0 0 0 2px rgba(46,28,13,0.9), inset 0 0 40px rgba(0,0,0,0.85),
                0 0 80px rgba(255,190,120,0.45), 0 0 120px rgba(255,158,94,0.26);
  }
  .sg-door-post {
    position: absolute;
    top: -2px;
    bottom: -2px;
    width: 10px;
    background: linear-gradient(90deg, #6e4520, #8a5a2e 45%, #55371a);
    box-shadow: 0 4px 10px rgba(0,0,0,0.5);
  }
  .sg-post-l { left: -14px; border-radius: 3px 1px 1px 3px; }
  .sg-post-r { right: -14px; border-radius: 1px 3px 3px 1px; }

  .sg-pool {
    width: 340px;
    max-width: 90vw;
    height: 42px;
    margin-top: 2px;
    background: radial-gradient(ellipse at 50% 0%, rgba(255,166,90,0.32) 0%, transparent 68%);
    animation: sgPoolIn .8s ease .4s both;
  }

  .sg-micro {
    margin: 0 0 18px;
    max-width: 360px;
    text-align: center;
    font-size: 13px;
    line-height: 1.6;
    color: rgba(246,234,212,0.78);
    animation: sgDrop .6s ease .3s both;
  }

  .sg-cta {
    font-family: "Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif;
    font-size: 17px;
    font-weight: 600;
    letter-spacing: 0.02em;
    color: #f8edda;
    padding: 13px 42px;
    border-radius: 6px;
    border: 1px solid #c9a24a;
    background: linear-gradient(160deg, #7b4f28, #5c3a1b);
    box-shadow: inset 0 1px 0 rgba(255,235,200,0.4), inset 0 -2px 0 rgba(0,0,0,0.4),
                0 10px 20px rgba(0,0,0,0.45);
    cursor: pointer;
    transition: transform .25s cubic-bezier(.34,1.56,.64,1), filter .25s ease, box-shadow .25s ease;
    animation: sgDrop .6s ease .42s both;
  }
  .sg-cta:hover {
    transform: translateY(-2px);
    filter: brightness(1.1);
  }
  .sg-cta:focus-visible {
    outline: 2px solid #ffd27a;
    outline-offset: 3px;
  }
  .sg-cta-hint {
    margin: 9px 0 0;
    font-size: 11px;
    letter-spacing: 0.14em;
    text-transform: uppercase;
    color: rgba(231,200,126,0.6);
    animation: sgDrop .6s ease .5s both;
  }

  .sg-mock {
    margin-top: 30px;
    padding-top: 14px;
    border-top: 1px solid rgba(231,200,126,0.22);
    text-align: center;
    animation: sgDrop .6s ease .58s both;
  }
  .sg-mock-link {
    font-size: 12px;
    color: rgba(246,234,212,0.6);
    background: transparent;
    border: none;
    cursor: pointer;
    letter-spacing: 0.03em;
    text-decoration: underline dotted rgba(246,234,212,0.4);
    text-underline-offset: 3px;
  }
  .sg-mock-link:hover { color: #e7c87e; }
  .sg-mock-link:focus-visible {
    outline: 2px solid #ffd27a;
    outline-offset: 3px;
    border-radius: 4px;
  }
  .sg-mock-hint {
    margin: 6px 0 0;
    font-size: 11px;
    color: rgba(246,234,212,0.42);
  }
  .sg-dash-link {
    margin-top: 14px;
    display: inline-block;
  }

  @keyframes sgDrop {
    from { opacity: 0; transform: translateY(-14px); }
    to { opacity: 1; transform: translateY(0); }
  }
  @keyframes sgDoorIn {
    from { opacity: 0; transform: scale(0.97) translateY(6px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes sgPoolIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes sgSwing {
    0%, 100% { transform: rotate(2.4deg); }
    50% { transform: rotate(-2.4deg); }
  }
  @keyframes sgFlicker {
    0%, 100% { opacity: 1; }
    8% { opacity: 0.7; }
    12% { opacity: 0.95; }
    70% { opacity: 0.82; }
  }
  @keyframes sgDoorBreath {
    0%, 100% { opacity: 0.9; }
    50% { opacity: 1; }
  }

  @media (max-width: 520px) {
    .sg-title { font-size: 27px; }
    .sg-door { height: 250px; width: 196px; }
    .sg-sign-board { padding: 15px 16px 13px; }
    .sg-pool { height: 30px; }
  }

  @media (max-height: 720px) {
    .sg-sign { margin-bottom: 20px; }
    .sg-door { height: 218px; width: 178px; }
    .sg-entrance { margin-bottom: 12px; }
    .sg-micro { margin-bottom: 12px; font-size: 12px; line-height: 1.45; }
    .sg-mock { margin-top: 18px; padding-top: 10px; }
    .sg-sign-board { padding: 12px 16px 10px; }
  }

  @media (prefers-reduced-motion: reduce) {
    .sg-beam, .sg-sign, .sg-cta, .sg-cta-hint, .sg-mock, .sg-micro, .sg-entrance, .sg-pool {
      animation-duration: 0.01s;
    }
    .sg-lantern, .sg-lantern::after, .sg-door-glow {
      animation: none;
    }
    .sg-cta { transition: none; }
  }
`;

if (typeof document !== "undefined" && !document.getElementById("start-gate-styles")) {
  const el = document.createElement("style");
  el.id = "start-gate-styles";
  el.textContent = gateCSS;
  document.head.appendChild(el);
}