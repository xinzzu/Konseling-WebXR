import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

/**
 * KiaiSpeaker3D — Figur Kiai Ahmad Dahlan (duduk bersila) yang "berbicara".
 * Muncul di episode_play: saat isSpeaking, mulut & tangan bergerak seperti
 * bercerita. Menghadap kamera setiap frame (aman untuk VR & latar 2D).
 *
 * Gaya: primitif low-poly (quest-safe, tanpa GLB). Props ikonik: peci,
 * sarung, dan biola kecil di pangkuan — rujukan "Biola Kiai".
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
  const leftArmRef = useRef();
  const rightArmRef = useRef();

  useFrame(({ clock, camera }) => {
    const t = clock.getElapsedTime();
    // Menghadap kamera
    if (lookRef.current) {
      lookRef.current.lookAt(camera.position);
    }
    if (bodyRef.current) {
      bodyRef.current.position.y = Math.sin(t * 1.4) * 0.008;
    }
    if (headRef.current) {
      headRef.current.rotation.x = 0.06 + Math.sin(t * 0.9) * 0.03;
      headRef.current.rotation.y = Math.sin(t * 0.6) * 0.06;
    }
    if (mouthRef.current) {
      if (isSpeaking) {
        const open = 0.5 + Math.sin(t * 14) * 0.3 + Math.sin(t * 23) * 0.18;
        mouthRef.current.scale.y = Math.max(0.3, Math.min(1.1, open));
        mouthRef.current.scale.x = 1 + Math.sin(t * 11) * 0.1;
      } else {
        mouthRef.current.scale.y = 0.3;
        mouthRef.current.scale.x = 1.1;
      }
    }
    // Gestur tangan saat bercerita
    if (leftArmRef.current && rightArmRef.current) {
      if (isSpeaking) {
        leftArmRef.current.rotation.z = -0.25 + Math.sin(t * 2.1) * 0.14;
        rightArmRef.current.rotation.z = 0.25 + Math.sin(t * 2.6) * 0.14;
        leftArmRef.current.rotation.x = Math.sin(t * 1.7) * 0.08;
        rightArmRef.current.rotation.x = Math.sin(t * 2.0) * 0.08;
      } else {
        leftArmRef.current.rotation.z = -0.22;
        rightArmRef.current.rotation.z = 0.22;
        leftArmRef.current.rotation.x = 0;
        rightArmRef.current.rotation.x = 0;
      }
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

          {/* Lengan kiri */}
          <group ref={leftArmRef} position={[-0.16, 0.44, 0]}>
            <mesh rotation={[0, 0, 0.2]}>
              <capsuleGeometry args={[0.045, 0.22, 8, 12]} />
              <meshStandardMaterial color="#f0ead8" roughness={0.72} />
            </mesh>
            <mesh position={[-0.09, -0.17, 0]}>
              <sphereGeometry args={[0.038, 12, 12]} />
              <meshStandardMaterial color="#e8b08a" roughness={0.8} />
            </mesh>
          </group>

          {/* Lengan kanan */}
          <group ref={rightArmRef} position={[0.16, 0.44, 0]}>
            <mesh rotation={[0, 0, -0.2]}>
              <capsuleGeometry args={[0.045, 0.22, 8, 12]} />
              <meshStandardMaterial color="#f0ead8" roughness={0.72} />
            </mesh>
            <mesh position={[0.09, -0.17, 0]}>
              <sphereGeometry args={[0.038, 12, 12]} />
              <meshStandardMaterial color="#e8b08a" roughness={0.8} />
            </mesh>
          </group>

          {/* Biola di pangkuan depan-kiri */}
          <group position={[-0.13, 0.24, 0.12]} rotation={[0.2, 0.35, 0.15]}>
            <mesh>
              <boxGeometry args={[0.2, 0.045, 0.075]} />
              <meshStandardMaterial color="#7a401e" roughness={0.5} metalness={0.2} />
            </mesh>
            <mesh position={[0.12, 0.01, 0]}>
              <boxGeometry args={[0.2, 0.012, 0.014]} />
              <meshStandardMaterial color="#5a2f14" roughness={0.6} />
            </mesh>
            {/* Busur */}
            <mesh position={[0.06, 0.06, 0.05]} rotation={[0, 0, -0.4]}>
              <cylinderGeometry args={[0.004, 0.004, 0.28, 6]} />
              <meshStandardMaterial color="#3d2312" roughness={0.6} />
            </mesh>
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