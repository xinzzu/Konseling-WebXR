import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

/**
 * NPCCounselor - Avatar 3D konselor yang berbicara
 * 
 * Fitur:
 * - Animasi idle (bernafas, berkedip)
 * - Animasi berbicara (mulut bergerak)
 * - Ekspresi ramah
 * 
 * Props:
 * - position: [x, y, z] posisi NPC
 * - isSpeaking: boolean apakah sedang berbicara
 * - mood: 'neutral' | 'happy' | 'concerned' - ekspresi wajah
 */
export default function NPCCounselor({ 
  position = [0, 0, 0], 
  isSpeaking = false,
  mood = 'neutral',
  scale = 1 
}) {
  const groupRef = useRef();
  const headRef = useRef();
  const bodyRef = useRef();
  const leftEyeRef = useRef();
  const rightEyeRef = useRef();
  const mouthRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  
  // Blink state - menggunakan waktu mulai blink untuk timing yang tepat
  const blinkRef = useRef({ nextBlink: 2, blinkStartTime: 0 });
  
  // Colors based on mood
  const colors = useMemo(() => ({
    skin: '#FFE0BD',
    hair: '#4A3728',
    shirt: mood === 'happy' ? '#4CAF50' : mood === 'concerned' ? '#FF9800' : '#2196F3',
    pants: '#37474F',
    eyes: '#3E2723',
    mouth: '#C62828',
    blush: mood === 'happy' ? '#FFCDD2' : 'transparent',
  }), [mood]);

  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    
    // Idle breathing animation - body moves up/down slightly
    if (bodyRef.current) {
      bodyRef.current.position.y = Math.sin(time * 1.5) * 0.01;
    }
    
    // Head slight movement - looks more alive
    if (headRef.current) {
      headRef.current.rotation.y = Math.sin(time * 0.5) * 0.05;
      headRef.current.rotation.z = Math.sin(time * 0.7) * 0.02;
    }
    
    // Blinking animation - HANYA scale Y untuk pupil, bukan seluruh mata
    if (leftEyeRef.current && rightEyeRef.current) {
      // Cek apakah waktunya berkedip
      if (time > blinkRef.current.nextBlink) {
        blinkRef.current.blinkStartTime = time;
        blinkRef.current.nextBlink = time + 3 + Math.random() * 2; // Kedip lagi dalam 3-5 detik
      }
      
      // Hitung progress blink (0-1 tutup, 1-2 buka)
      const blinkDuration = 0.15; // 150ms untuk kedip
      const timeSinceBlink = time - blinkRef.current.blinkStartTime;
      
      if (timeSinceBlink < blinkDuration * 2) {
        // Sedang berkedip
        let eyeScale;
        if (timeSinceBlink < blinkDuration) {
          // Menutup mata
          eyeScale = 1 - (timeSinceBlink / blinkDuration);
        } else {
          // Membuka mata
          eyeScale = (timeSinceBlink - blinkDuration) / blinkDuration;
        }
        // Clamp nilai antara 0.1 dan 1 (tidak benar-benar 0 agar tidak hilang)
        eyeScale = Math.max(0.1, Math.min(1, eyeScale));
        leftEyeRef.current.scale.setScalar(eyeScale);
        rightEyeRef.current.scale.setScalar(eyeScale);
      } else {
        // Mata terbuka normal - pastikan scale 1
        leftEyeRef.current.scale.setScalar(1);
        rightEyeRef.current.scale.setScalar(1);
      }
    }
    
    // Speaking animation - mouth opens and closes
    if (mouthRef.current) {
      if (isSpeaking) {
        // Animate mouth when speaking
        const mouthOpen = 0.5 + Math.sin(time * 15) * 0.3 + Math.sin(time * 23) * 0.2;
        mouthRef.current.scale.y = Math.max(0.3, Math.min(1.2, mouthOpen));
        mouthRef.current.scale.x = 1 + Math.sin(time * 12) * 0.1;
      } else {
        // Slight smile when not speaking
        mouthRef.current.scale.y = 0.3;
        mouthRef.current.scale.x = 1.2;
      }
    }
    
    // Arm gestures when speaking
    if (leftArmRef.current && rightArmRef.current) {
      if (isSpeaking) {
        leftArmRef.current.rotation.z = -0.3 + Math.sin(time * 2) * 0.15;
        rightArmRef.current.rotation.z = 0.3 + Math.sin(time * 2.5) * 0.15;
        leftArmRef.current.rotation.x = Math.sin(time * 1.8) * 0.1;
        rightArmRef.current.rotation.x = Math.sin(time * 2.2) * 0.1;
      } else {
        // Return to rest position
        leftArmRef.current.rotation.z = -0.2;
        rightArmRef.current.rotation.z = 0.2;
        leftArmRef.current.rotation.x = 0;
        rightArmRef.current.rotation.x = 0;
      }
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale}>
      {/* Body Group */}
      <group ref={bodyRef}>
        
        {/* === BODY === */}
        {/* Torso */}
        <mesh position={[0, 0.1, 0]}>
          <capsuleGeometry args={[0.18, 0.35, 8, 16]} />
          <meshStandardMaterial color={colors.shirt} />
        </mesh>
        
        {/* Collar/Neck area */}
        <mesh position={[0, 0.35, 0]}>
          <cylinderGeometry args={[0.08, 0.1, 0.08, 16]} />
          <meshStandardMaterial color={colors.skin} />
        </mesh>
        
        {/* === ARMS === */}
        {/* Left Arm */}
        <group ref={leftArmRef} position={[-0.22, 0.15, 0]}>
          <mesh rotation={[0, 0, -0.2]}>
            <capsuleGeometry args={[0.05, 0.25, 8, 16]} />
            <meshStandardMaterial color={colors.shirt} />
          </mesh>
          {/* Left Hand */}
          <mesh position={[-0.08, -0.18, 0]}>
            <sphereGeometry args={[0.045, 16, 16]} />
            <meshStandardMaterial color={colors.skin} />
          </mesh>
        </group>
        
        {/* Right Arm */}
        <group ref={rightArmRef} position={[0.22, 0.15, 0]}>
          <mesh rotation={[0, 0, 0.2]}>
            <capsuleGeometry args={[0.05, 0.25, 8, 16]} />
            <meshStandardMaterial color={colors.shirt} />
          </mesh>
          {/* Right Hand */}
          <mesh position={[0.08, -0.18, 0]}>
            <sphereGeometry args={[0.045, 16, 16]} />
            <meshStandardMaterial color={colors.skin} />
          </mesh>
        </group>
        
        {/* === LEGS === */}
        {/* Left Leg */}
        <mesh position={[-0.08, -0.25, 0]}>
          <capsuleGeometry args={[0.06, 0.25, 8, 16]} />
          <meshStandardMaterial color={colors.pants} />
        </mesh>
        
        {/* Right Leg */}
        <mesh position={[0.08, -0.25, 0]}>
          <capsuleGeometry args={[0.06, 0.25, 8, 16]} />
          <meshStandardMaterial color={colors.pants} />
        </mesh>
        
        {/* === HEAD === */}
        <group ref={headRef} position={[0, 0.55, 0]}>
          {/* Head base */}
          <mesh>
            <sphereGeometry args={[0.15, 32, 32]} />
            <meshStandardMaterial color={colors.skin} />
          </mesh>
          
          {/* Hair */}
          <mesh position={[0, 0.08, -0.02]}>
            <sphereGeometry args={[0.14, 32, 32, 0, Math.PI * 2, 0, Math.PI * 0.6]} />
            <meshStandardMaterial color={colors.hair} />
          </mesh>
          
          {/* Hair bangs */}
          <mesh position={[0, 0.1, 0.08]} rotation={[0.3, 0, 0]}>
            <boxGeometry args={[0.2, 0.06, 0.08]} />
            <meshStandardMaterial color={colors.hair} />
          </mesh>
          
          {/* Left Eye */}
          <group position={[-0.05, 0.02, 0.12]}>
            {/* Eye white */}
            <mesh>
              <sphereGeometry args={[0.025, 16, 16]} />
              <meshStandardMaterial color="white" />
            </mesh>
            {/* Eye pupil */}
            <mesh ref={leftEyeRef} position={[0, 0, 0.015]}>
              <sphereGeometry args={[0.015, 16, 16]} />
              <meshStandardMaterial color={colors.eyes} />
            </mesh>
            {/* Eye highlight */}
            <mesh position={[0.005, 0.005, 0.022]}>
              <sphereGeometry args={[0.005, 8, 8]} />
              <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
            </mesh>
          </group>
          
          {/* Right Eye */}
          <group position={[0.05, 0.02, 0.12]}>
            {/* Eye white */}
            <mesh>
              <sphereGeometry args={[0.025, 16, 16]} />
              <meshStandardMaterial color="white" />
            </mesh>
            {/* Eye pupil */}
            <mesh ref={rightEyeRef} position={[0, 0, 0.015]}>
              <sphereGeometry args={[0.015, 16, 16]} />
              <meshStandardMaterial color={colors.eyes} />
            </mesh>
            {/* Eye highlight */}
            <mesh position={[0.005, 0.005, 0.022]}>
              <sphereGeometry args={[0.005, 8, 8]} />
              <meshStandardMaterial color="white" emissive="white" emissiveIntensity={0.5} />
            </mesh>
          </group>
          
          {/* Eyebrows */}
          <mesh position={[-0.05, 0.06, 0.12]} rotation={[0, 0, mood === 'concerned' ? 0.2 : -0.1]}>
            <boxGeometry args={[0.04, 0.008, 0.01]} />
            <meshStandardMaterial color={colors.hair} />
          </mesh>
          <mesh position={[0.05, 0.06, 0.12]} rotation={[0, 0, mood === 'concerned' ? -0.2 : 0.1]}>
            <boxGeometry args={[0.04, 0.008, 0.01]} />
            <meshStandardMaterial color={colors.hair} />
          </mesh>
          
          {/* Nose */}
          <mesh position={[0, -0.01, 0.14]}>
            <sphereGeometry args={[0.02, 16, 16]} />
            <meshStandardMaterial color={colors.skin} />
          </mesh>
          
          {/* Mouth */}
          <mesh ref={mouthRef} position={[0, -0.06, 0.13]}>
            <capsuleGeometry args={[0.01, 0.03, 8, 16]} rotation={[0, 0, Math.PI / 2]} />
            <meshStandardMaterial color={colors.mouth} />
          </mesh>
          
          {/* Blush (when happy) */}
          {mood === 'happy' && (
            <>
              <mesh position={[-0.08, -0.02, 0.11]}>
                <circleGeometry args={[0.02, 16]} />
                <meshStandardMaterial color="#FFCDD2" transparent opacity={0.5} />
              </mesh>
              <mesh position={[0.08, -0.02, 0.11]}>
                <circleGeometry args={[0.02, 16]} />
                <meshStandardMaterial color="#FFCDD2" transparent opacity={0.5} />
              </mesh>
            </>
          )}
          
          {/* Ears */}
          <mesh position={[-0.14, 0, 0]}>
            <sphereGeometry args={[0.03, 16, 16]} />
            <meshStandardMaterial color={colors.skin} />
          </mesh>
          <mesh position={[0.14, 0, 0]}>
            <sphereGeometry args={[0.03, 16, 16]} />
            <meshStandardMaterial color={colors.skin} />
          </mesh>
        </group>
      </group>
      
      {/* Name tag */}
      <Text
        position={[0, -0.55, 0]}
        fontSize={0.05}
        color="white"
        anchorX="center"
        anchorY="middle"
        outlineWidth={0.003}
        outlineColor="#000000"
      >
        Konselor Maya
      </Text>
      
      {/* Speaking indicator */}
      {isSpeaking && (
        <group position={[0, 0.85, 0]}>
          <SpeakingBubble />
        </group>
      )}
    </group>
  );
}

/**
 * SpeakingBubble - Gelembung bicara animasi
 */
function SpeakingBubble() {
  const bubblesRef = useRef([]);
  
  useFrame(({ clock }) => {
    bubblesRef.current.forEach((bubble, i) => {
      if (bubble) {
        const offset = i * 0.3;
        const scale = 0.5 + Math.sin(clock.elapsedTime * 5 + offset) * 0.3;
        bubble.scale.set(scale, scale, scale);
        bubble.material.opacity = 0.3 + Math.sin(clock.elapsedTime * 5 + offset) * 0.3;
      }
    });
  });
  
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          ref={(el) => (bubblesRef.current[i] = el)}
          position={[(i - 1) * 0.05, 0, 0]}
        >
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshStandardMaterial 
            color="#4fc3f7" 
            transparent 
            opacity={0.5}
            emissive="#4fc3f7"
            emissiveIntensity={0.3}
          />
        </mesh>
      ))}
    </group>
  );
}
