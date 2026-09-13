/**
 * Episode Service - Integrasi frontend dengan backend KONTRAK EPISODE (real app).
 * Endpoint: VITE_API_URL (default http://localhost:3100)
 *   GET  /api/episodes          -> daftar episode (layar pilih episode)
 *   GET  /api/episodes/:id      -> satu episode lengkap (10 scene)
 *   POST /api/progress          -> catat jawaban siswa untuk riset
 *   GET  /api/tts/config        -> konfigurasi TTS backend
 *
 * MODE MOCKUP: flow episode TIDAK dipakai di mode mockup. Mockup/dummy tetap
 * memakai flow lama (chatService + mockChatService) untuk demo ke client.
 * Konsekuensinya: file ini murni live/kontrak backend.
 */
import useGameStore from "../store/useGameStore";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3100";

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const detail = await res.json().catch(() => null);
    throw new Error(detail?.error || `HTTP ${res.status} — ${path}`);
  }
  return res.json();
}

/** Ambil daftar episode (ringkas) untuk layar pilih episode. */
export async function fetchEpisodes() {
  const data = await request("/api/episodes");
  return data.episodes || [];
}

/** Ambil satu episode lengkap (10 scene). */
export async function fetchEpisode(id) {
  const data = await request(`/api/episodes/${id}`);
  return data.episode || null;
}

/** Catat jawaban/progress siswa ke backend untuk riset. */
export async function submitProgress({ episodeId, sceneNo, choiceId, score }) {
  const sessionId =
    useGameStore.getState().sessionId || `ep-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  if (!useGameStore.getState().sessionId) {
    useGameStore.setState({ sessionId });
  }
  const payload = { sessionId, episodeId, sceneNo, choiceId };
  if (typeof score === "number") payload.score = score;
  try {
    await request("/api/progress", { method: "POST", body: JSON.stringify(payload) });
  } catch (err) {
    // Progress penting untuk riset: kalau gagal kirim, log saja agar main tidak berhenti.
    console.warn("Progress not saved:", err.message, payload);
  }
}

/** Ambil konfigurasi TTS backend. */
export async function fetchTTSConfig() {
  try {
    const data = await request("/api/tts/config");
    return {
      mode: data.defaultMode || "webspeech",
      webSpeechConfig: { lang: "id-ID", rate: 0.95, pitch: 1.0, volume: 1.0 },
    };
  } catch {
    return { mode: "webspeech", webSpeechConfig: { lang: "id-ID", rate: 0.95, pitch: 1.0, volume: 1.0 } };
  }
}

/**
 * Skor keselarasan nilai (tersembunyi, tidak pernah ditampilkan ke siswa).
 * Dipakai sebagai bahan kesimpulan riset: C = selaras (2), B = sebagian (1),
 * A/D = kurang selaras (0). Berlaku untuk decision (A-D) & transfer (A-C).
 */
export function scoreFor(choiceId) {
  const map = { A: 0, B: 1, C: 2, D: 0 };
  return typeof choiceId === "string" ? map[choiceId] ?? 0 : 0;
}

export default {
  fetchEpisodes,
  fetchEpisode,
  submitProgress,
  fetchTTSConfig,
  scoreFor,
};