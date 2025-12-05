/**
 * Chat Service - Integrasi dengan backend konseling AI
 * Endpoint: https://webxr-be.vercel.app/chat
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://webxr-be.vercel.app';

/**
 * Session state untuk tracking conversation
 */
let currentSessionId = null;

/**
 * Reset session
 */
export function resetSession() {
  currentSessionId = null;
}

/**
 * Get current session ID
 */
export function getSessionId() {
  return currentSessionId;
}

/**
 * Send chat request ke backend
 * @param {string} state - State saat ini: 'greeting' | 'identify_topic' | 'collecting_problem' | 'story'
 * @param {object} payload - Data payload (topicId atau problemId)
 * @returns {Promise<object>} Response dari backend
 */
export async function sendChatRequest(state, payload = {}) {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        sessionId: currentSessionId,
        state,
        payload,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    
    // Update session ID dari response
    if (data.sessionId) {
      currentSessionId = data.sessionId;
    }

    return data;
  } catch (error) {
    console.error('Chat API Error:', error);
    throw error;
  }
}

/**
 * Start greeting - Memulai sesi baru
 * Dipanggil saat user memilih environment/suasana
 */
export async function startGreeting() {
  resetSession();
  return sendChatRequest('greeting');
}

/**
 * Select topic - Memilih topik (diri/sosial/alam)
 * @param {string} topicId - 'diri' | 'sosial' | 'alam'
 */
export async function selectTopic(topicId) {
  return sendChatRequest('identify_topic', { topicId });
}

/**
 * Select problem - Memilih masalah (dipanggil 3x)
 * @param {string} problemId - ID masalah yang dipilih
 */
export async function selectProblem(problemId) {
  return sendChatRequest('collecting_problem', { problemId });
}

/**
 * Restart session - Kembali ke problem selection dengan topik yang sama
 * @param {string} topicId - ID topik (opsional, jika tidak ada akan gunakan topik sebelumnya)
 */
export async function restartSession(topicId = null) {
  return sendChatRequest('restart_session', { topicId });
}

/**
 * Play audio dari base64
 * @param {object} audioData - { enabled, mimeType, base64 }
 * @returns {Promise<HTMLAudioElement|null>}
 */
export function playAudioFromResponse(audioData) {
  return new Promise((resolve, reject) => {
    if (!audioData?.enabled || !audioData?.base64) {
      resolve(null);
      return;
    }

    try {
      const audio = new Audio(`data:${audioData.mimeType};base64,${audioData.base64}`);
      audio.play()
        .then(() => resolve(audio))
        .catch(reject);
    } catch (error) {
      reject(error);
    }
  });
}

export default {
  resetSession,
  getSessionId,
  sendChatRequest,
  startGreeting,
  selectTopic,
  selectProblem,
  restartSession,
  playAudioFromResponse,
};
