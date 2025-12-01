import React, { useEffect, useState } from "react";
import useGameStore from "../../store/useGameStore";
import { loadTopics } from "../../services/dataService";

/**
 * TopicSelectScreen - Layar pemilihan topik konseling
 */
export default function TopicSelectScreen() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const topics = useGameStore((s) => s.topics);
  const setTopics = useGameStore((s) => s.setTopics);
  const startSession = useGameStore((s) => s.startSession);
  const setGameState = useGameStore((s) => s.setGameState);

  useEffect(() => {
    async function fetchTopics() {
      try {
        const data = await loadTopics();
        setTopics(data);
        setLoading(false);
      } catch (err) {
        setError('Gagal memuat topik');
        setLoading(false);
      }
    }
    
    if (topics.length === 0) {
      fetchTopics();
    } else {
      setLoading(false);
    }
  }, [topics.length, setTopics]);

  const handleSelectTopic = (topic) => {
    startSession(topic);
  };

  const handleBack = () => {
    setGameState('start');
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loading} className="pulse">
          Memuat topik...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.content} className="fade-in">
        {/* Back Button */}
        <button style={styles.backButton} onClick={handleBack}>
          ← Kembali
        </button>

        {/* Header */}
        <h2 style={styles.title}>Pilih Topik Konseling</h2>
        <p style={styles.subtitle}>
          Pilih topik yang ingin kamu bicarakan hari ini
        </p>

        {/* Error message */}
        {error && <div style={styles.error}>{error}</div>}

        {/* Topic Cards */}
        <div style={styles.topicGrid}>
          {topics.map((topic, index) => (
            <TopicCard 
              key={topic.id} 
              topic={topic} 
              index={index}
              onSelect={() => handleSelectTopic(topic)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * TopicCard - Kartu untuk setiap topik
 */
function TopicCard({ topic, index, onSelect }) {
  const [hovered, setHovered] = useState(false);

  return (
    <button
      style={{
        ...styles.topicCard,
        background: `linear-gradient(135deg, ${topic.color}ee, ${topic.color}aa)`,
        animationDelay: `${index * 0.1}s`,
        transform: hovered ? 'translateY(-5px) scale(1.02)' : 'translateY(0)',
        boxShadow: hovered 
          ? `0 20px 40px ${topic.color}40`
          : `0 10px 30px ${topic.color}30`,
      }}
      onClick={onSelect}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Icon based on topic */}
      <div style={styles.topicIcon}>
        {topic.id === 'akademik' && '📚'}
        {topic.id === 'sosial' && '👥'}
        {topic.id === 'keluarga' && '🏠'}
        {!['akademik', 'sosial', 'keluarga'].includes(topic.id) && '💭'}
      </div>
      
      <h3 style={styles.topicLabel}>{topic.label}</h3>
      <p style={styles.topicDescription}>{topic.description}</p>
      
      <div style={styles.topicArrow}>
        Mulai →
      </div>
    </button>
  );
}

const styles = {
  container: {
    position: 'fixed',
    inset: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
    zIndex: 100,
    overflow: 'auto',
    padding: '20px',
  },
  content: {
    textAlign: 'center',
    maxWidth: '900px',
    width: '100%',
  },
  backButton: {
    position: 'absolute',
    top: '20px',
    left: '20px',
    padding: '10px 20px',
    background: 'rgba(255,255,255,0.1)',
    color: 'white',
    border: '1px solid rgba(255,255,255,0.2)',
    borderRadius: '20px',
    cursor: 'pointer',
    fontSize: '14px',
    transition: 'all 0.2s ease',
  },
  title: {
    fontSize: '36px',
    fontWeight: '700',
    marginBottom: '10px',
    color: 'white',
  },
  subtitle: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.7)',
    marginBottom: '40px',
  },
  loading: {
    fontSize: '18px',
    color: 'white',
  },
  error: {
    color: '#ff6b6b',
    marginBottom: '20px',
    padding: '10px',
    background: 'rgba(255,107,107,0.1)',
    borderRadius: '8px',
  },
  topicGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: '20px',
    padding: '0 20px',
  },
  topicCard: {
    padding: '30px',
    borderRadius: '20px',
    border: 'none',
    cursor: 'pointer',
    textAlign: 'left',
    color: 'white',
    transition: 'all 0.3s ease',
    animation: 'fadeIn 0.5s ease forwards',
    opacity: 0,
    animationFillMode: 'forwards',
  },
  topicIcon: {
    fontSize: '40px',
    marginBottom: '15px',
  },
  topicLabel: {
    fontSize: '22px',
    fontWeight: '600',
    marginBottom: '10px',
  },
  topicDescription: {
    fontSize: '14px',
    opacity: 0.9,
    lineHeight: '1.5',
    marginBottom: '15px',
  },
  topicArrow: {
    fontSize: '14px',
    fontWeight: '500',
    opacity: 0.8,
  },
};
