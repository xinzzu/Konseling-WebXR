import useGameStore from "../../store/useGameStore";

/**
 * MockModeBadge - Indikator kecil saat Mode Mockup aktif.
 * Klik untuk keluar (reset ke menu awal, mode live).
 * Hanya tampil jika isMockMode = true.
 */
export default function MockModeBadge() {
  const isMockMode = useGameStore((s) => s.isMockMode);
  const resetGame = useGameStore((s) => s.resetGame);

  if (!isMockMode) return null;

  return (
    <div style={styles.badge} title="Mode Mockup: data dummy lokal, tanpa backend LLM">
      <span>🧪 MOCKUP</span>
      <button style={styles.exitButton} onClick={resetGame}>
        Keluar ✕
      </button>
    </div>
  );
}

const styles = {
  badge: {
    position: "fixed",
    top: "12px",
    left: "50%",
    transform: "translateX(-50%)",
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "6px 8px 6px 14px",
    background: "rgba(255, 167, 38, 0.95)",
    color: "#1a1a2e",
    fontSize: "12px",
    fontWeight: "700",
    letterSpacing: "1px",
    borderRadius: "20px",
    zIndex: 1000,
    boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
  },
  exitButton: {
    padding: "4px 10px",
    fontSize: "11px",
    fontWeight: "600",
    background: "#1a1a2e",
    color: "white",
    border: "none",
    borderRadius: "12px",
    cursor: "pointer",
  },
};
