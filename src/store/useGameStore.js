import { create } from "zustand";

/**
 * Game States:
 * - 'start' : Start screen
 * - 'environment_select' : Environment selection screen
 * - 'topic_select' : Topic selection screen  
 * - 'conversation' : In conversation with LLM
 * - 'finished' : Conversation ended
 */

const useGameStore = create((set, get) => ({
  // Game state
  gameState: 'start', // 'start' | 'environment_select' | 'topic_select' | 'conversation' | 'finished'
  setGameState: (state) => set({ gameState: state }),

  // Environment state
  selectedEnvironment: 'gallery', // 'gallery' | 'beach' | 'forest'
  setSelectedEnvironment: (env) => set({ selectedEnvironment: env }),

  // Topic data
  topics: [],
  setTopics: (topics) => set({ topics }),
  
  selectedTopic: null,
  setSelectedTopic: (topic) => set({ selectedTopic: topic }),

  // Conversation state
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

  // XR/VR state - sync dari XRCanvas
  isInVR: false,
  setIsInVR: (inVR) => set({ isInVR: inVR }),

  // Reset everything
  resetGame: () => set({
    gameState: 'start',
    selectedTopic: null,
    conversations: [],
    currentConversationIndex: 0,
    userResponses: [],
    isSpeaking: false,
  }),

  // Start new session with topic
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
}));

export default useGameStore;
