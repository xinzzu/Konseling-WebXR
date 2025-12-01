/**
 * Data Service - Load data from JSON (dummy LLM)
 * Nanti bisa diganti dengan real API call ke backend LLM
 */

const API_BASE_URL = '/api'; // Untuk nanti kalau ada backend

/**
 * Load topics dari data.json
 */
export async function loadTopics() {
  try {
    const response = await fetch('/data.json', { cache: 'no-store' });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const text = await response.text();
    
    // Check if response is HTML (error page)
    if (text.trim().startsWith('<')) {
      throw new Error('Server returned HTML instead of JSON');
    }
    
    const data = JSON.parse(text);
    return data.topics || [];
  } catch (error) {
    console.error('Failed to load topics:', error);
    // Return fallback data
    return getFallbackTopics();
  }
}

/**
 * Fallback topics jika gagal load dari file
 */
function getFallbackTopics() {
  return [
    {
      id: 'akademik',
      label: 'Tekanan Akademik',
      color: '#EF5350',
      description: 'Perasaan cemas terkait sekolah',
      conversations: [
        { role: 'assistant', text: 'Halo! Bagaimana perasaanmu hari ini?' },
        { role: 'user_choice', options: ['Baik', 'Kurang baik', 'Sangat buruk'] },
        { role: 'assistant', text: 'Terima kasih sudah mau berbagi.' },
        { role: 'assistant', text: 'Semoga harimu menyenangkan!' },
      ]
    },
    {
      id: 'sosial',
      label: 'Masalah Sosial',
      color: '#42A5F5',
      description: 'Konflik dengan teman',
      conversations: [
        { role: 'assistant', text: 'Hai! Apa yang sedang terjadi?' },
        { role: 'user_choice', options: ['Konflik', 'Kesepian', 'Lainnya'] },
        { role: 'assistant', text: 'Aku mengerti perasaanmu.' },
        { role: 'assistant', text: 'Kamu hebat!' },
      ]
    },
  ];
}

/**
 * Simulate LLM response (untuk development)
 * Nanti diganti dengan real API call
 */
export async function getLLMResponse(message, context) {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Return dummy response
  return {
    role: 'assistant',
    text: `Terima kasih atas responsmu: "${message}". Saya mengerti perasaanmu.`,
  };
}

/**
 * Send message to backend (untuk nanti)
 */
export async function sendMessage(topicId, message, sessionId) {
  try {
    const response = await fetch(`${API_BASE_URL}/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        topicId,
        message,
        sessionId,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to send message');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    // Fallback to dummy response
    return getLLMResponse(message, { topicId });
  }
}

export default {
  loadTopics,
  getLLMResponse,
  sendMessage,
};
