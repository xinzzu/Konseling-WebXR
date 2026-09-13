import React, { useEffect, useMemo, useRef, useState } from "react";

/**
 * VoiceWaveform - Visualizer suara 2D.
 * Bar-bar selalu beranimasi halus ketika `isActive` (audio sedang diputar),
 * dengan profil SIMETRIS dari tengah ke luar (seperti equalizer suara) —
 * bukan condong ke kiri.
 *
 * `audioData` opsional: bila berisi energi riil (Uint8Array dari AnalyserNode),
 * dipakai sebagai amplitudo; bila kosong/nol, dipakai sinyal sintetis halus
 * sehingga wave tetap "hidup" tanpa menyentuh routing audio asli.
 *
 * Penting: nilai bar hidup DI STATE (bukan ref) dan diupdate setiap frame lewat
 * requestAnimationFrame, supaya React benar-benar merender ulang bar-nya.
 */
export default function VoiceWaveform({
  audioData,
  isActive,
  color = "#4CAF50",
  barCount = 32,
}) {
  const halfCount = useMemo(() => Math.floor(barCount / 2), [barCount]);
  const [levels, setLevels] = useState(() => Array(barCount).fill(6));
  const stateRef = useRef(Array(barCount).fill(6));
  const tRef = useRef(0);
  const lastTsRef = useRef(0);

  useEffect(() => {
    if (!isActive) return;
    let raf = 0;
    tRef.current = 0;
    lastTsRef.current = 0;

    const step = (ts) => {
      if (!lastTsRef.current) lastTsRef.current = ts;
      tRef.current += (ts - lastTsRef.current) * 0.001;
      lastTsRef.current = ts;

      // Amplitudo real dari audio bila tersedia (bukan nol semua).
      let energy = 0;
      if (audioData && audioData.length) {
        let sum = 0;
        for (let i = 0; i < audioData.length; i++) sum += audioData[i];
        energy = sum / audioData.length / 255;
      }

      const s = stateRef.current;
      const t = tRef.current;

      const targets = new Array(barCount);
      // Setengah kiri (0..half-1) — profil "suara" naik-turun organik.
      for (let i = 0; i < halfCount; i++) {
        const x = i / halfCount;
        const a = Math.sin(x * 5.2 - t * 3.4) + Math.sin(x * 2.1 + t * 2.2);
        const b = Math.sin(t * 7 + i * 0.9);
        const base = 8 + 74 * (0.35 + 0.65 * energy) * Math.abs(a) * 0.62;
        const v = Math.min(100, base + 16 * (b + 1) * 0.5 * (0.22 + 0.78 * energy));
        targets[i] = Math.max(6, v);
      }
      // Setengah kanan — cermin simetris setengah kiri.
      for (let i = 0; i < halfCount; i++) {
        targets[halfCount + i] = targets[halfCount - 1 - i];
      }

      // Smoothing: bar bergerak lembut menuju target, tidak menghentak.
      let changed = false;
      for (let i = 0; i < barCount; i++) {
        const next = s[i] + (targets[i] - s[i]) * 0.18;
        if (Math.abs(next - s[i]) > 0.02) changed = true;
        s[i] = next;
      }

      setLevels([...s]);
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [isActive, audioData, barCount, halfCount]);

  return (
    <div style={styles.container}>
      <div style={styles.waveform}>
        {levels.map((height, index) => (
          <div
            key={index}
            style={{
              ...styles.bar,
              height: `${height}%`,
              background: isActive
                ? `linear-gradient(180deg, ${color} 0%, ${color}88 100%)`
                : "rgba(255,255,255,0.2)",
            }}
          />
        ))}
      </div>

      {/* Speaking indicator */}
      <div style={styles.indicator}>
        <span
          style={{
            ...styles.dot,
            background: isActive ? color : "rgba(255,255,255,0.3)",
            boxShadow: isActive ? `0 0 10px ${color}` : "none",
          }}
        />
        <span style={styles.text}>
          {isActive ? "Berbicara..." : "Menunggu..."}
        </span>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: "100%",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "8px",
  },
  waveform: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "3px",
    height: "46px",
    padding: "0 12px",
    width: "100%",
    maxWidth: "340px",
  },
  bar: {
    width: "6px",
    borderRadius: "3px",
    transition: "background 0.3s ease",
    minHeight: "5px",
  },
  indicator: { display: "flex", alignItems: "center", gap: "8px" },
  dot: {
    width: "8px",
    height: "8px",
    borderRadius: "50%",
    transition: "all 0.3s ease",
  },
  text: {
    fontSize: "12px",
    opacity: 0.7,
    letterSpacing: "0.5px",
  },
};