import React from "react";
import useGameStore from "../../store/useGameStore";
import { ENVIRONMENTS } from "../xr/environments";

/**
 * EnvironmentSelectScreen - Pilihan environment untuk mode 2D
 */
export default function EnvironmentSelectScreen() {
  const setGameState = useGameStore((s) => s.setGameState);
  const selectedEnvironment = useGameStore((s) => s.selectedEnvironment);
  const setSelectedEnvironment = useGameStore((s) => s.setSelectedEnvironment);

  const handleSelectEnvironment = (envId) => {
    setSelectedEnvironment(envId);
    setGameState('topic_select');
  };

  const handleBack = () => {
    setGameState('start');
  };

  return (
    <div style={styles.container}>
      <div style={styles.content} className="fade-in">
        {/* Header */}
        <h1 style={styles.title}>🌍 Pilih Suasana</h1>
        <p style={styles.subtitle}>Pilih tempat yang membuatmu nyaman</p>

        {/* Environment Cards */}
        <div style={styles.cardsContainer}>
          {ENVIRONMENTS.map((env) => (
            <div
              key={env.id}
              style={{
                ...styles.card,
                borderColor: selectedEnvironment === env.id ? env.color : 'transparent',
                background: selectedEnvironment === env.id 
                  ? `linear-gradient(135deg, ${env.color}20 0%, #1a1a2e 100%)`
                  : '#1a1a2e',
              }}
              onClick={() => handleSelectEnvironment(env.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-5px)';
                e.currentTarget.style.boxShadow = `0 10px 30px ${env.color}40`;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              {/* Color Bar */}
              <div style={{ ...styles.colorBar, background: env.color }} />
              
              {/* Icon */}
              <div style={styles.icon}>{env.icon}</div>
              
              {/* Label */}
              <h3 style={styles.cardTitle}>{env.label}</h3>
              
              {/* Description */}
              <p style={styles.cardDescription}>{env.description}</p>
              
              {/* Select indicator */}
              {selectedEnvironment === env.id && (
                <div style={{ ...styles.selectedBadge, background: env.color }}>
                  ✓ Terpilih
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Back Button */}
        <button 
          style={styles.backButton}
          onClick={handleBack}
          onMouseEnter={(e) => {
            e.target.style.background = '#555';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = '#333';
          }}
        >
          ← Kembali
        </button>
      </div>

      {/* Background decoration */}
      <div style={styles.bgCircle1} />
      <div style={styles.bgCircle2} />
    </div>
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
    overflow: 'hidden',
  },
  content: {
    textAlign: 'center',
    padding: '40px',
    maxWidth: '900px',
    zIndex: 1,
  },
  title: {
    fontSize: '36px',
    fontWeight: '700',
    margin: '0 0 10px 0',
    color: 'white',
  },
  subtitle: {
    fontSize: '16px',
    color: 'rgba(255,255,255,0.6)',
    margin: '0 0 40px 0',
  },
  cardsContainer: {
    display: 'flex',
    gap: '20px',
    justifyContent: 'center',
    flexWrap: 'wrap',
    marginBottom: '30px',
  },
  card: {
    width: '240px',
    padding: '20px',
    borderRadius: '16px',
    border: '2px solid transparent',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  colorBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '4px',
  },
  icon: {
    fontSize: '48px',
    marginBottom: '15px',
    marginTop: '10px',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: 'white',
    margin: '0 0 10px 0',
  },
  cardDescription: {
    fontSize: '14px',
    color: 'rgba(255,255,255,0.6)',
    lineHeight: '1.4',
    margin: 0,
  },
  selectedBadge: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    padding: '4px 10px',
    borderRadius: '20px',
    fontSize: '12px',
    fontWeight: '600',
    color: 'white',
  },
  backButton: {
    padding: '12px 30px',
    fontSize: '16px',
    background: '#333',
    color: 'white',
    border: 'none',
    borderRadius: '25px',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  bgCircle1: {
    position: 'absolute',
    width: '400px',
    height: '400px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(102,187,106,0.1) 0%, transparent 70%)',
    top: '-100px',
    right: '-100px',
  },
  bgCircle2: {
    position: 'absolute',
    width: '300px',
    height: '300px',
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(79,195,247,0.1) 0%, transparent 70%)',
    bottom: '-50px',
    left: '-50px',
  },
};
