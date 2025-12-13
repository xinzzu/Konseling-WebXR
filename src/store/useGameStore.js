import { create } from "zustand";

/**
 * Game States:
 * - 'start' : Start screen
 * - 'environment_select' : Environment selection screen
 * - 'topic_select' : Topic selection (backend: identify_topic)
 * - 'problem_select' : Problem selection 3x rounds (backend: collecting_problem)
 * - 'story' : Story/relaxation session (backend: story)
 * - 'conversation' : Legacy conversation panel
 * - 'finished' : Session ended
 */

const useGameStore = create((set, get) => ({
  // Game state
  gameState: 'start',
  setGameState: (state) => set({ gameState: state }),

  // Environment state
  selectedEnvironment: 'gallery',
  setSelectedEnvironment: (env) => set({ selectedEnvironment: env }),

  // Backend session state
  sessionId: null,
  setSessionId: (id) => set({ sessionId: id }),
  
  // Current backend response
  currentResponse: null,
  setCurrentResponse: (response) => set({ currentResponse: response }),

  // Topic data (dari backend)
  topics: [], // Options dari backend untuk topic selection
  setTopics: (topics) => set({ topics }),
  
  selectedTopic: null,
  setSelectedTopic: (topic) => set({ selectedTopic: topic }),

  // Problem selection state
  problems: [], // Options dari backend untuk problem selection
  setProblems: (problems) => set({ problems }),
  
  selectedProblems: [], // Array of selected problem IDs
  addSelectedProblem: (problemId) => set((state) => ({
    selectedProblems: [...state.selectedProblems, problemId]
  })),
  
  problemRound: 1, // Current round (1-3)
  setProblemRound: (round) => set({ problemRound: round }),

  // Story state
  storyText: null,
  setStoryText: (text) => set({ storyText: text }),
  
  baseStoryMeta: null,
  setBaseStoryMeta: (meta) => set({ baseStoryMeta: meta }),

  // Audio state dari backend
  currentAudio: null, // { enabled, mimeType, base64 }
  setCurrentAudio: (audio) => set({ currentAudio: audio }),

  // Legacy conversation state (untuk backward compatibility)
  conversations: [],
  currentConversationIndex: 0,
  userResponses: [],
  
  setConversations: (convs) => set({ 
    conversations: convs, 
    currentConversationIndex: 0,
    userResponses: [] 
  }),
  
  nextConversation: () => {
    const { currentConversationIndex, conversations } = get();
    if (currentConversationIndex < conversations.length - 1) {
      set({ currentConversationIndex: currentConversationIndex + 1 });
      return true;
    }
    return false;
  },
  
  addUserResponse: (response) => set((state) => ({
    userResponses: [...state.userResponses, response]
  })),
  
  getCurrentMessage: () => {
    const { conversations, currentConversationIndex } = get();
    return conversations[currentConversationIndex] || null;
  },

  // Speech state
  isSpeaking: false,
  setIsSpeaking: (speaking) => set({ isSpeaking: speaking }),
  
  // Audio analyzer for waveform
  audioAnalyzer: null,
  setAudioAnalyzer: (analyzer) => set({ audioAnalyzer: analyzer }),

  // Loading state
  isLoading: false,
  setIsLoading: (loading) => set({ isLoading: loading }),

  // Error state
  error: null,
  setError: (error) => set({ error }),

  // XR/VR state
  isInVR: false,
  setIsInVR: (inVR) => set({ isInVR: inVR }),

  // Reset everything
  resetGame: () => set({
    gameState: 'start',
    sessionId: null,
    currentResponse: null,
    selectedTopic: null,
    topics: [],
    problems: [],
    selectedProblems: [],
    problemRound: 1,
    storyText: null,
    baseStoryMeta: null,
    currentAudio: null,
    conversations: [],
    currentConversationIndex: 0,
    userResponses: [],
    isSpeaking: false,
    isLoading: false,
    error: null,
  }),

  // Legacy: Start new session with topic (untuk backward compatibility)
  startSession: (topic) => {
    if (!topic) return;
    set({
      selectedTopic: topic,
      conversations: topic.conversations || [],
      currentConversationIndex: 0,
      userResponses: [],
      gameState: 'conversation',
    });
  },

  // TTS config dari backend
  ttsConfig: null,
  setTtsConfig: (config) => set({ ttsConfig: config }),

  // New: Handle backend response - map backend state ke frontend gameState
  handleBackendResponse: (response) => {
    const updates = {
      sessionId: response.sessionId,
      currentResponse: response,
      currentAudio: response.audio || null,
      ttsConfig: response.tts || null,
      isLoading: false,
      error: null,
    };

    // Map backend currentState ke frontend gameState
    switch (response.currentState) {
      case 'identify_topic':
        updates.gameState = 'topic_select';
        updates.topics = response.options || [];
        break;
      case 'collecting_problem':
        updates.gameState = 'problem_select';
        updates.problems = response.options || [];
        updates.problemRound = response.round || 1;
        break;
      case 'story':
        updates.gameState = 'story';
        updates.storyText = response.storyText || response.speechText;
        updates.baseStoryMeta = response.baseStoryMeta || null;
        break;
      default:
        // Fallback ke conversation untuk state lain
        updates.gameState = 'conversation';
        break;
    }

    set(updates);
    return response;
  },
}));

export default useGameStore;
