import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

/**
 * KiaiSpeaker3D — Figur Kiai Ahmad Dahlan (duduk bersila) yang "berbicara".
 * Rig 3 segmen: upper arm → elbow → forearm → hand (tangan di atas paha).
 * Mulut & gestur tangan bergerak halus saat isSpeaking, diam saat idle.
 */
export default function KiaiSpeaker3D({
  isSpeaking = false,
  position = [0, 0, 0],
  scale = 1,
}) {
  const lookRef = useRef();
  const bodyRef = useRef();
  const headRef = useRef();
  const mouthRef = useRef();
  const lUpperRef = useRef();   // lengan kiri atas
  const rUpperRef = useRef();   // lengan kanan atas
  const lForeRef = useRef();    // forearm kiri
  const rForeRef = useRef();    // forearm kanan
  const lHandRef = useRef();    // tangan kiri
  const rHandRef = useRef();    // tangan kanan

  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime();

    // --- Menghadap kamera ---
    if (lookRef.current) lookRef.current.lookAt(camera.position);

    // --- Badan bernafas halus ---
    if (bodyRef.current) {
      bodyRef.current.position.y = Math.sin(t * 1.2) * 0.006;
    }

    // --- Kepala ---
    if (headRef.current) {
      headRef.current.rotation.x = 0.05 + Math.sin(t * 0.8) * 0.025;
      headRef.current.rotation.y = Math.sin(t * 0.55) * 0.045;
      headRef.current.rotation.z = Math.sin(t * 0.4) * 0.015;
    }

    // --- Mulut ---
    if (mouthRef.current) {
      if (isSpeaking) {
        const open = 0.5 + Math.sin(t * 13) * 0.28 + Math.sin(t * 22) * 0.14;
        mouthRef.current.scale.y = Math.max(0.35, Math.min(1.05, open));
        mouthRef.current.scale.x = 1 + Math.sin(t * 10) * 0.06;
      } else {
        mouthRef.current.scale.y = 0.35;
        mouthRef.current.scale.x = 1.06;
      }
    }

    // --- Lengan kiri ---
    if (lUpperRef.current) {
      // Posisi dasar: di atas paha, lengan bawah menghadap depan
      const base = -0.38;
      const sway = isSpeaking ? Math.sin(t * 1.9) * 0.06 : 0;
      lUpperRef.current.rotation.z = base + sway;
      lUpperRef.current.rotation.x = isSpeaking ? Math.sin(t * 2.3) * 0.08 : 0.18;
    }
    if (lForeRef.current) {
      // Siku ditekuk ~60°, tangan menghadap paha depan
      lForeRef.current.rotation.x = isSpeaking ? 0.35 + Math.sin(t * 2.7) * 0.1 : 0.42;
      lForeRef.current.rotation.z = isSpeaking ? Math.sin(t * 3.1) * 0.06 : 0;
    }
    if (lHandRef.current) {
      // Tangan sedikit mengepal/membuka saat bicara
      lHandRef.current.rotation.x = isSpeaking ? 0.2 + Math.sin(t * 4.2) * 0.25 : 0;
      lHandRef.current.rotation.z = isSpeaking ? Math.sin(t * 2.5) * 0.1 : 0;
    }

    // --- Lengan kanan (mirror) ---
    if (rUpperRef.current) {
      const base = 0.38;
      const sway = isSpeaking ? Math.sin(t * 2.1 + 0.5) * 0.06 : 0;
      rUpperRef.current.rotation.z = base + sway;
      rUpperRef.current.rotation.x = isSpeaking ? Math.sin(t * 2.5 + 0.3) * 0.08 : 0.18;
    }
    if (rForeRef.current) {
      rForeRef.current.rotation.x = isSpeaking ? 0.35 + Math.sin(t * 2.9 + 0.4) * 0.1 : 0.42;
      rForeRef.current.rotation.z = isSpeaking ? Math.sin(t * 3.3 + 0.2) * 0.06 : 0;
    }
    if (rHandRef.current) {
      rHandRef.current.rotation.x = isSpeaking ? 0.2 + Math.sin(t * 4.4 + 0.3) * 0.25 : 0;
      rHandRef.current.rotation.z = isSpeaking ? Math.sin(t * 2.7 + 0.1) * 0.1 : 0;
    }
  });

  return (
    <group position={position} scale={scale}>
      <group ref={lookRef}>
        {/* Tikar */}
        <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.34, 24]} />
          <meshStandardMaterial color="#8a6a44" roughness={1} />
        </mesh>
        <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.27, 24]} />
          <meshStandardMaterial color="#9c7c52" roughness={1} />
        </mesh>

        <group ref={bodyRef}>
          {/* Sarung (bawah, duduk bersila) */}
          <mesh position={[0, 0.18, 0]}>
            <cylinderGeometry args={[0.16, 0.26, 0.36, 12]} />
            <meshStandardMaterial color="#6b4f34" roughness={0.9} />
          </mesh>
          {/* Sarung batik samar */}
          <mesh position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.17, 0.24, 0.2, 12]} />
            <meshStandardMaterial color="#54402c" roughness={0.9} />
          </mesh>

          {/* Badan: kemeja putih */}
          <mesh position={[0, 0.42, 0]}>
            <capsuleGeometry args={[0.14, 0.3, 8, 16]} />
            <meshStandardMaterial color="#f0ead8" roughness={0.72} />
          </mesh>
          {/* Kain samping / sorban bahu */}
          <mesh position={[0, 0.5, 0.02]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.15, 0.035, 8, 16, Math.PI]} />
            <meshStandardMaterial color="#6b4f34" roughness={0.9} />
          </mesh>

          {/* ======== Lengan kiri (3 segmen) ======== */}
          <group ref={lUpperRef} position={[-0.17, 0.47, 0]}>
            {/* Upper arm */}
            <mesh rotation={[0.18, 0, -0.38]}>
              <capsuleGeometry args={[0.044, 0.14, 8, 12]} />
              <meshStandardMaterial color="#f0ead8" roughness={0.72} />
            </mesh>
            <group ref={lForeRef} position={[0.06, -0.14, 0.05]}>
              {/* Forearm */}
              <mesh rotation={[0.42, 0, 0.18]}>
                <capsuleGeometry args={[0.038, 0.12, 8, 12]} />
                <meshStandardMaterial color="#f0ead8" roughness={0.72} />
              </mesh>
              <group ref={lHandRef} position={[0.04, -0.11, 0.06]}>
                {/* Tangan: agak membulat, sedikit pipih */}
                <mesh scale={[1.15, 0.85, 0.9]}>
                  <capsuleGeometry args={[0.03, 0.04, 6, 8]} />
                  <meshStandardMaterial color="#e8b08a" roughness={0.8} />
                </mesh>
                {/* Telapak (bantalan tangan) */}
                <mesh position={[0.01, -0.02, 0]} scale={[1.0, 0.7, 1.0]}>
                  <sphereGeometry args={[0.022, 8, 8]} />
                  <meshStandardMaterial color="#e2a67a" roughness={0.82} />
                </mesh>
              </group>
            </group>
          </group>

          {/* ======== Lengan kanan (3 segmen, mirror) ======== */}
          <group ref={rUpperRef} position={[0.17, 0.47, 0]}>
            <mesh rotation={[0.18, 0, 0.38]}>
              <capsuleGeometry args={[0.044, 0.14, 8, 12]} />
              <meshStandardMaterial color="#f0ead8" roughness={0.72} />
            </mesh>
            <group ref={rForeRef} position={[-0.06, -0.14, 0.05]}>
              <mesh rotation={[0.42, 0, -0.18]}>
                <capsuleGeometry args={[0.038, 0.12, 8, 12]} />
                <meshStandardMaterial color="#f0ead8" roughness={0.72} />
              </mesh>
              <group ref={rHandRef} position={[-0.04, -0.11, 0.06]}>
                <mesh scale={[1.15, 0.85, 0.9]}>
                  <capsuleGeometry args={[0.03, 0.04, 6, 8]} />
                  <meshStandardMaterial color="#e8b08a" roughness={0.8} />
                </mesh>
                <mesh position={[-0.01, -0.02, 0]} scale={[1.0, 0.7, 1.0]}>
                  <sphereGeometry args={[0.022, 8, 8]} />
                  <meshStandardMaterial color="#e2a67a" roughness={0.82} />
                </mesh>
              </group>
            </group>
          </group>

          {/* Kepala */}
          <group ref={headRef} position={[0, 0.66, 0]}>
            <mesh>
              <sphereGeometry args={[0.13, 24, 24]} />
              <meshStandardMaterial color="#e8b08a" roughness={0.8} />
            </mesh>
            {/* Peci (songkok) */}
            <mesh position={[0, 0.14, -0.01]}>
              <cylinderGeometry args={[0.085, 0.095, 0.07, 16]} />
              <meshStandardMaterial color="#241a10" roughness={0.6} />
            </mesh>
            {/* Lingkar peci */}
            <mesh position={[0, 0.1, 0]}>
              <cylinderGeometry args={[0.1, 0.1, 0.015, 16]} />
              <meshStandardMaterial color="#3a2c16" roughness={0.6} />
            </mesh>
            {/* Alis */}
            <mesh position={[-0.045, 0.05, 0.11]} rotation={[0, 0, -0.12]}>
              <boxGeometry args={[0.045, 0.012, 0.012]} />
              <meshStandardMaterial color="#5e5154" />
            </mesh>
            <mesh position={[0.045, 0.05, 0.11]} rotation={[0, 0, 0.12]}>
              <boxGeometry args={[0.045, 0.012, 0.012]} />
              <meshStandardMaterial color="#5e5154" />
            </mesh>
            {/* Mata */}
            {[-0.05, 0.05].map((x, i) => (
              <group key={i} position={[x, 0.02, 0.115]}>
                <mesh>
                  <sphereGeometry args={[0.022, 12, 12]} />
                  <meshStandardMaterial color="#ffffff" />
                </mesh>
                <mesh position={[0, 0, 0.012]}>
                  <sphereGeometry args={[0.012, 10, 10]} />
                  <meshStandardMaterial color="#2c2c2c" />
                </mesh>
              </group>
            ))}
            {/* Hidung */}
            <mesh position={[0, -0.02, 0.13]}>
              <sphereGeometry args={[0.016, 12, 12]} />
              <meshStandardMaterial color="#dc9f76" roughness={0.8} />
            </mesh>
            {/* Kumis */}
            <mesh position={[-0.03, -0.05, 0.124]} rotation={[0.15, 0, -0.08]}>
              <boxGeometry args={[0.05, 0.014, 0.02]} />
              <meshStandardMaterial color="#8b7b7e" />
            </mesh>
            <mesh position={[0.03, -0.05, 0.124]} rotation={[0.15, 0, 0.08]}>
              <boxGeometry args={[0.05, 0.014, 0.02]} />
              <meshStandardMaterial color="#8b7b7e" />
            </mesh>
            {/* Mulut (bergerak saat bicara) */}
            <mesh ref={mouthRef} position={[0, -0.07, 0.115]}>
              <capsuleGeometry args={[0.012, 0.028, 8, 10]} rotation={[0, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#7a4a3a" />
            </mesh>
            {/* Jenggot */}
            <mesh position={[0, -0.1, 0.1]}>
              <sphereGeometry args={[0.045, 14, 14, 0, Math.PI * 2, Math.PI * 0.25, Math.PI * 0.75]} />
              <meshStandardMaterial color="#c9c4c0" roughness={0.9} />
            </mesh>
            {/* Telinga */}
            {[-0.13, 0.13].map((x, i) => (
              <mesh key={i} position={[x, 0, 0]}>
                <sphereGeometry args={[0.026, 10, 10]} />
                <meshStandardMaterial color="#e8b08a" roughness={0.8} />
              </mesh>
            ))}
          </group>
        </group>

        {/* Nama */}
        <Text
          position={[0, -0.16, 0]}
          fontSize={0.045}
          color="#ffe6b0"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.004}
          outlineColor="#000000"
          fillOpacity={0.95}
        >
          Kiai Ahmad Dahlan
        </Text>

        {/* Gelembung bicara */}
        {isSpeaking && (
          <group position={[0, 0.95, 0]}>
            <SpeakingBubble />
          </group>
        )}
      </group>
    </group>
  );
}

function SpeakingBubble() {
  const refs = useRef([]);
  useFrame(({ clock }) => {
    refs.current.forEach((b, i) => {
      if (!b) return;
      const off = i * 0.27;
      const s = 0.5 + Math.sin(clock.getElapsedTime() * 5 + off) * 0.28;
      b.scale.setScalar(s);
      b.material.opacity = 0.3 + Math.sin(clock.getElapsedTime() * 5 + off) * 0.3;
    });
  });
  return (
    <group>
      {[0, 1, 2].map((i) => (
        <mesh
          key={i}
          ref={(el) => (refs.current[i] = el)}
          position={[(i - 1) * 0.05, -0.06 + i * 0.02, 0]}
        >
          <sphereGeometry args={[0.015, 8, 8]} />
          <meshStandardMaterial
            color="#ffd27a"
            transparent
            opacity={0.5}
            emissive="#ffcf7a"
            emissiveIntensity={0.4}
          />
        </mesh>
      ))}
    </group>
  );
}
