import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";

/**
 * VoiceWaveform3D - Animasi waveform 3D untuk menunjukkan audio sedang diputar
 */
export default function VoiceWaveform3D({ 
  position = [0, 0, 0], 
  color = "#42A5F5", 
  isActive = false,
  barCount = 5,
  barWidth = 0.03,
  barSpacing = 0.05,
  maxHeight = 0.15,
  minHeight = 0.02,
}) {
  const barsRef = useRef([]);
  const phasesRef = useRef(Array(barCount).fill(0).map(() => Math.random() * Math.PI * 2));

  useFrame((state) => {
    if (!isActive) return;
    
    const time = state.clock.elapsedTime;
    
    barsRef.current.forEach((bar, i) => {
      if (bar) {
        // Animasi naik turun dengan fase berbeda untuk setiap bar
        const phase = phasesRef.current[i];
        const speed = 3 + i * 0.5;
        const height = minHeight + (maxHeight - minHeight) * (0.5 + 0.5 * Math.sin(time * speed + phase));
        bar.scale.y = height / minHeight;
        bar.position.y = (height - minHeight) / 2;
      }
    });
  });

  const totalWidth = (barCount - 1) * barSpacing;
  const startX = -totalWidth / 2;

  return (
    <group position={position}>
      {Array(barCount).fill(0).map((_, i) => (
        <RoundedBox
          key={i}
          ref={(el) => (barsRef.current[i] = el)}
          args={[barWidth, minHeight, 0.01]}
          radius={0.005}
          position={[startX + i * barSpacing, 0, 0]}
        >
          <meshStandardMaterial 
            color={color} 
            emissive={color} 
            emissiveIntensity={isActive ? 0.5 : 0.1} 
          />
        </RoundedBox>
      ))}
    </group>
  );
}
