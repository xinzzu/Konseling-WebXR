/**
 * Mock Chat Service - Pengganti backend saat Mode Mockup aktif.
 * API-nya SAMA PERSIS dengan chatService.js (startGreeting, selectTopic,
 * selectProblem, restartSession, resetSession, getSessionId) sehingga
 * semua screen 2D maupun 3D tidak perlu diubah.
 *
 * State machine lokal: greeting → identify_topic → collecting_problem (3x) → story
 * Response mengikuti struktur backend (lihat FLOW-DOCUMENTATION.md).
 */

import {
  MOCK_TOPICS,
  MOCK_PROBLEMS,
  MOCK_BASE_STORIES,
  MOCK_GREETING,
  MOCK_PROBLEM_INTRO,
  MOCK_ROUND_MESSAGE,
  MOCK_TTS,
  MOCK_AUDIO_OFF,
  buildMockStory,
} from "./mockData";

// Simulasi latency jaringan biar loading spinner tetap kepakai
const MOCK_DELAY_MS = 600;
const delay = (ms = MOCK_DELAY_MS) =>
  new Promise((resolve) => setTimeout(resolve, ms));

// Session lokal (in-memory, terpisah dari session live backend)
let mockSessionId = null;
let mockSession = null;

function newSession() {
  mockSessionId = `mock-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 7)}`;
  mockSession = { topicId: null, selectedProblems: [] };
  return mockSessionId;
}

function ensureSession() {
  if (!mockSession) newSession();
  return mockSession;
}

function problemOptions(topicId, excludeIds = []) {
  return (MOCK_PROBLEMS[topicId] || []).filter(
    (p) => !excludeIds.includes(p.id)
  );
}

function findProblem(topicId, problemId) {
  return (MOCK_PROBLEMS[topicId] || []).find((p) => p.id === problemId);
}

export function resetSession() {
  mockSessionId = null;
  mockSession = null;
}

export function getSessionId() {
  return mockSessionId;
}

/**
 * Memulai sesi baru → response seperti backend state "greeting"
 * (currentState: identify_topic + daftar topik)
 */
export async function startGreeting() {
  await delay();
  newSession();
  return {
    sessionId: mockSessionId,
    currentState: "identify_topic",
    type: "topic_selection",
    message: MOCK_GREETING,
    speechText: MOCK_GREETING,
    options: MOCK_TOPICS,
    tts: MOCK_TTS,
    audio: MOCK_AUDIO_OFF,
    _mock: true,
  };
}

/**
 * Memilih topik → response round 1 problem_selection
 */
export async function selectTopic(topicId) {
  await delay();
  const session = ensureSession();

  if (!topicId || !MOCK_PROBLEMS[topicId]) {
    return {
      sessionId: mockSessionId,
      currentState: "identify_topic",
      type: "topic_selection",
      message: MOCK_GREETING,
      speechText: MOCK_GREETING,
      options: MOCK_TOPICS,
      tts: MOCK_TTS,
      audio: MOCK_AUDIO_OFF,
      _mock: true,
    };
  }

  session.topicId = topicId;
  session.selectedProblems = [];

  const intro = MOCK_PROBLEM_INTRO[topicId];
  return {
    sessionId: mockSessionId,
    currentState: "collecting_problem",
    type: "problem_selection",
    round: 1,
    message: intro,
    speechText: intro,
    options: problemOptions(topicId, []),
    tts: MOCK_TTS,
    audio: MOCK_AUDIO_OFF,
    _mock: true,
  };
}

/**
 * Memilih masalah (dipanggil 3x). Setelah 3 → story.
 */
export async function selectProblem(problemId) {
  await delay();
  const session = ensureSession();

  // Guard: belum pilih topik → balik ke topic selection
  if (!session.topicId || !MOCK_PROBLEMS[session.topicId]) {
    return {
      sessionId: mockSessionId,
      currentState: "identify_topic",
      type: "topic_selection",
      message: MOCK_GREETING,
      speechText: MOCK_GREETING,
      options: MOCK_TOPICS,
      tts: MOCK_TTS,
      audio: MOCK_AUDIO_OFF,
      _mock: true,
    };
  }

  const { topicId } = session;
  const valid = findProblem(topicId, problemId);

  // Guard: problemId invalid → kirim ulang options round saat ini
  if (!valid) {
    const round = session.selectedProblems.length + 1;
    const msg = round === 1 ? MOCK_PROBLEM_INTRO[topicId] : MOCK_ROUND_MESSAGE[round];
    return {
      sessionId: mockSessionId,
      currentState: "collecting_problem",
      type: "problem_selection",
      round,
      message: msg,
      speechText: msg,
      options: problemOptions(topicId, session.selectedProblems),
      tts: MOCK_TTS,
      audio: MOCK_AUDIO_OFF,
      _mock: true,
    };
  }

  if (!session.selectedProblems.includes(problemId)) {
    session.selectedProblems.push(problemId);
  }

  // Masih kurang dari 3 → lanjut round berikutnya
  if (session.selectedProblems.length < 3) {
    const round = session.selectedProblems.length + 1;
    const msg = MOCK_ROUND_MESSAGE[round];
    return {
      sessionId: mockSessionId,
      currentState: "collecting_problem",
      type: "problem_selection",
      round,
      message: msg,
      speechText: msg,
      options: problemOptions(topicId, session.selectedProblems),
      tts: MOCK_TTS,
      audio: MOCK_AUDIO_OFF,
      _mock: true,
    };
  }

  // Sudah 3 → story personalized
  const selectedFull = session.selectedProblems
    .map((id) => findProblem(topicId, id))
    .filter(Boolean);
  const labels = selectedFull.map((p) => p.label);
  const storyText = buildMockStory(topicId, labels);

  return {
    sessionId: mockSessionId,
    currentState: "story",
    type: "story",
    storyText,
    speechText: storyText,
    baseStoryMeta: MOCK_BASE_STORIES[topicId],
    selectedProblems: selectedFull.map((p) => ({
      id: p.id,
      title: p.label,
      detail: p.description,
    })),
    tts: MOCK_TTS,
    audio: MOCK_AUDIO_OFF,
    _mock: true,
  };
}

/**
 * Restart sesi. Dipanggil StoryScreen dengan topicId (string).
 * Kompatibel juga dengan format backend { keepTopic }.
 */
export async function restartSession(topicIdOrPayload = null) {
  await delay();
  const session = ensureSession();

  const topicId =
    typeof topicIdOrPayload === "string"
      ? topicIdOrPayload
      : topicIdOrPayload?.topicId || session.topicId;

  // keepTopic false / tanpa topik → mulai dari greeting
  if (
    topicIdOrPayload?.keepTopic === false ||
    (!topicId && !session.topicId)
  ) {
    return startGreeting();
  }

  const target = topicId || session.topicId;
  if (!target || !MOCK_PROBLEMS[target]) {
    return startGreeting();
  }

  session.topicId = target;
  session.selectedProblems = [];

  const intro = MOCK_PROBLEM_INTRO[target];
  return {
    sessionId: mockSessionId,
    currentState: "collecting_problem",
    type: "problem_selection",
    round: 1,
    message: `Baik, mari kita mulai sesi baru dengan topik yang sama. ${intro}`,
    speechText: `Baik, mari kita mulai sesi baru dengan topik yang sama. ${intro}`,
    options: problemOptions(target, []),
    topicId: target,
    tts: MOCK_TTS,
    audio: MOCK_AUDIO_OFF,
    _mock: true,
  };
}

export default {
  resetSession,
  getSessionId,
  startGreeting,
  selectTopic,
  selectProblem,
  restartSession,
};
