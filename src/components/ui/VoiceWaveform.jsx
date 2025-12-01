import React, { useMemo } from "react";

/**
 * VoiceWaveform - Animasi grafik suara saat berbicara
 * Menampilkan visualisasi audio data seperti waveform
 */
export default function VoiceWaveform({ audioData, isActive, color = '#4CAF50' }) {
  const bars = useMemo(() => {
    const barCount = 32;
    const result = [];
    
    for (let i = 0; i < barCount; i++) {
      const value = audioData?.[i] || 0;
      const height = isActive ? Math.max(5, (value / 255) * 100) : 5;
      result.push(height);
    }
    
    return result;
  }, [audioData, isActive]);

  return (
    <div style={styles.container}>
      <div style={styles.waveform}>
        {bars.map((height, index) => (
          <div
            key={index}
            style={{
              ...styles.bar,
              height: `${height}%`,
              background: isActive 
                ? `linear-gradient(180deg, ${color} 0%, ${color}88 100%)`
                : 'rgba(255,255,255,0.2)',
              animationDelay: `${index * 0.02}s`,
            }}
          />
        ))}
      </div>
      
      {/* Speaking indicator */}
      <div style={styles.indicator}>
        <span style={{
          ...styles.dot,
          background: isActive ? color : 'rgba(255,255,255,0.3)',
          boxShadow: isActive ? `0 0 10px ${color}` : 'none',
        }} />
        <span style={styles.text}>
          {isActive ? 'Berbicara...' : 'Menunggu...'}
        </span>
      </div>
    </div>
  );
}

const styles = {
  container: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '15px',
  },
  waveform: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '3px',
    height: '60px',
    padding: '0 20px',
  },
  bar: {
    width: '6px',
    borderRadius: '3px',
    transition: 'height 0.05s ease, background 0.3s ease',
    minHeight: '5px',
  },
  indicator: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  dot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    transition: 'all 0.3s ease',
  },
  text: {
    fontSize: '12px',
    opacity: 0.7,
    letterSpacing: '0.5px',
  },
};
