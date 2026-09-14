import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Text } from "@react-three/drei";
import * as THREE from "three";

/**
 * KiaiSpeaker3D — Figur tokoh episode (duduk bersila) yang "berbicara".
 * Rig lengan 3 segmen: upper arm → elbow → forearm → hand (tangan di paha).
 * Mulut & gestur tangan bergerak halus saat isSpeaking, diam saat idle.
 *
 * Persona menentukan penampilan & nama sesuai pembicara scene (audit-friendly):
 *   kiai (default) | sudja | ulama | nyai  — dipilih lewat personaForSpeaker().
 */
export const PERSONAS = {
  kiai: {
    key: "kiai",
    name: "Kiai Ahmad Dahlan",
    skin: "#e8b08a",
    nose: "#dc9f76",
    shirt: "#f0ead8",
    sarung: "#6b4f34",
    sarungDark: "#54402c",
    shawl: "#6b4f34",
    head: "peci",
    peci: "#241a10",
    peciBand: "#3a2c16",
    beard: true,
    moustache: true,
  },
  sudja: {
    key: "sudja",
    name: "Sudja",
    skin: "#e2a97a",
    nose: "#d99a6c",
    shirt: "#f5f3ec",
    sarung: "#2f6b4f",
    sarungDark: "#24563e",
    shawl: "#2f6b4f",
    head: "peci",
    peci: "#f4f0e6",
    peciBand: "#2f6b4f",
    beard: false,
    moustache: false,
  },
  ulama: {
    key: "ulama",
    name: "Ulama",
    skin: "#e0a880",
    nose: "#d69a6e",
    shirt: "#e8e4da",
    sarung: "#3f5a78",
    sarungDark: "#334a63",
    shawl: "#3f5a78",
    head: "sorban",
    sorban: "#f2efe4",
    sorbanDark: "#dcd7c6",
    beard: true,
    moustache: true,
  },
  nyai: {
    key: "nyai",
    name: "Nyai Ahmad Dahlan",
    skin: "#ecc3a0",
    nose: "#dfa57c",
    shirt: "#5b8a8a",
    sarung: "#4a7070",
    sarungDark: "#3e5f5f",
    shawl: "#5b8a8a",
    head: "hijab",
    hijab: "#5b8a8a",
    hijabDark: "#48706e",
    beard: false,
    moustache: false,
  },
};

// Speaker → persona. Yang tidak dikenal (mis. "Narator") kembali ke Kiai.
export function personaForSpeaker(speaker) {
  const s = String(speaker || "").toLowerCase();
  if (s.includes("nyai")) return PERSONAS.nyai;
  if (s.includes("ulama")) return PERSONAS.ulama;
  if (s.includes("sudja")) return PERSONAS.sudja;
  return PERSONAS.kiai;
}

export default function KiaiSpeaker3D({
  isSpeaking = false,
  persona = PERSONAS.kiai,
  label,
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

    // --- Badan bernafas halus + condong saat bicara ---
    if (bodyRef.current) {
      bodyRef.current.position.y = Math.sin(t * 1.2) * 0.006;
      bodyRef.current.rotation.x = isSpeaking ? Math.sin(t * 1.1) * 0.03 : 0;
    }

    // --- Kepala (mengangguk/bergeleng halus saat menjelaskan) ---
    if (headRef.current) {
      headRef.current.rotation.x =
        0.05 + Math.sin(t * 0.8) * 0.025 + (isSpeaking ? Math.sin(t * 1.4) * 0.03 : 0);
      headRef.current.rotation.y = Math.sin(t * 0.55) * 0.045;
      headRef.current.rotation.z =
        Math.sin(t * 0.4) * 0.015 + (isSpeaking ? Math.sin(t * 0.9) * 0.02 : 0);
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

    // --- Lengan kiri: gerak "menjelaskan" sambil ngobrol ---
    if (lUpperRef.current) {
      const sway = isSpeaking ? Math.sin(t * 1.3) * 0.12 : 0;
      lUpperRef.current.rotation.z = -0.38 + sway;
      lUpperRef.current.rotation.x = isSpeaking ? 0.1 + Math.sin(t * 1.9) * 0.22 : 0.18;
    }
    if (lForeRef.current) {
      // Siku ditekuk, forearm terangkat naik-turun saat menjelaskan
      lForeRef.current.rotation.x = isSpeaking ? 0.32 + Math.sin(t * 2.9) * 0.3 : 0.42;
      lForeRef.current.rotation.z = isSpeaking ? Math.sin(t * 3.3) * 0.12 : 0;
    }
    if (lHandRef.current) {
      // Tangan mengomentari (waggle) seperti sedang mengobrol
      lHandRef.current.rotation.x = isSpeaking ? 0.2 + Math.sin(t * 4.4) * 0.55 : 0;
      lHandRef.current.rotation.z = isSpeaking ? Math.sin(t * 2.6) * 0.22 : 0;
      lHandRef.current.rotation.y = isSpeaking ? Math.sin(t * 3.8) * 0.18 : 0;
    }

    // --- Lengan kanan (mirror; fase beda → bergantian kiri-kanan) ---
    if (rUpperRef.current) {
      const sway = isSpeaking ? Math.sin(t * 1.3 + 0.8) * 0.12 : 0;
      rUpperRef.current.rotation.z = 0.38 + sway;
      rUpperRef.current.rotation.x = isSpeaking ? 0.1 + Math.sin(t * 1.9 + 0.8) * 0.22 : 0.18;
    }
    if (rForeRef.current) {
      rForeRef.current.rotation.x = isSpeaking ? 0.32 + Math.sin(t * 2.9 + 0.8) * 0.3 : 0.42;
      rForeRef.current.rotation.z = isSpeaking ? Math.sin(t * 3.3 + 0.8) * 0.12 : 0;
    }
    if (rHandRef.current) {
      rHandRef.current.rotation.x = isSpeaking ? 0.2 + Math.sin(t * 4.4 + 0.8) * 0.55 : 0;
      rHandRef.current.rotation.z = isSpeaking ? Math.sin(t * 2.6 + 0.8) * 0.22 : 0;
      rHandRef.current.rotation.y = isSpeaking ? Math.sin(t * 3.8 + 0.8) * 0.18 : 0;
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
            <meshStandardMaterial color={persona.sarung} roughness={0.9} />
          </mesh>
          {/* Sarung batik samar */}
          <mesh position={[0, 0.22, 0]}>
            <cylinderGeometry args={[0.17, 0.24, 0.2, 12]} />
            <meshStandardMaterial color={persona.sarungDark} roughness={0.9} />
          </mesh>

          {/* Badan: kemeja / gamis */}
          <mesh position={[0, 0.42, 0]}>
            <capsuleGeometry args={[0.14, 0.3, 8, 16]} />
            <meshStandardMaterial color={persona.shirt} roughness={0.72} />
          </mesh>
          {/* Kain samping / selendang bahu */}
          <mesh position={[0, 0.5, 0.02]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.15, 0.035, 8, 16, Math.PI]} />
            <meshStandardMaterial color={persona.shawl} roughness={0.9} />
          </mesh>

          {/* ======== Lengan kiri (3 segmen) ======== */}
          <group ref={lUpperRef} position={[-0.17, 0.47, 0]}>
            {/* Upper arm */}
            <mesh rotation={[0.18, 0, -0.38]}>
              <capsuleGeometry args={[0.044, 0.14, 8, 12]} />
              <meshStandardMaterial color={persona.shirt} roughness={0.72} />
            </mesh>
            <group ref={lForeRef} position={[0.06, -0.14, 0.05]}>
              {/* Forearm */}
              <mesh rotation={[0.42, 0, 0.18]}>
                <capsuleGeometry args={[0.038, 0.12, 8, 12]} />
                <meshStandardMaterial color={persona.shirt} roughness={0.72} />
              </mesh>
              <group ref={lHandRef} position={[0.04, -0.11, 0.06]}>
                {/* Tangan: agak membulat, sedikit pipih */}
                <mesh scale={[1.15, 0.85, 0.9]}>
                  <capsuleGeometry args={[0.03, 0.04, 6, 8]} />
                  <meshStandardMaterial color={persona.skin} roughness={0.8} />
                </mesh>
                {/* Telapak (bantalan tangan) */}
                <mesh position={[0.01, -0.02, 0]} scale={[1.0, 0.7, 1.0]}>
                  <sphereGeometry args={[0.022, 8, 8]} />
                  <meshStandardMaterial color={persona.nose} roughness={0.82} />
                </mesh>
              </group>
            </group>
          </group>

          {/* ======== Lengan kanan (3 segmen, mirror) ======== */}
          <group ref={rUpperRef} position={[0.17, 0.47, 0]}>
            <mesh rotation={[0.18, 0, 0.38]}>
              <capsuleGeometry args={[0.044, 0.14, 8, 12]} />
              <meshStandardMaterial color={persona.shirt} roughness={0.72} />
            </mesh>
            <group ref={rForeRef} position={[-0.06, -0.14, 0.05]}>
              <mesh rotation={[0.42, 0, -0.18]}>
                <capsuleGeometry args={[0.038, 0.12, 8, 12]} />
                <meshStandardMaterial color={persona.shirt} roughness={0.72} />
              </mesh>
              <group ref={rHandRef} position={[-0.04, -0.11, 0.06]}>
                <mesh scale={[1.15, 0.85, 0.9]}>
                  <capsuleGeometry args={[0.03, 0.04, 6, 8]} />
                  <meshStandardMaterial color={persona.skin} roughness={0.8} />
                </mesh>
                <mesh position={[-0.01, -0.02, 0]} scale={[1.0, 0.7, 1.0]}>
                  <sphereGeometry args={[0.022, 8, 8]} />
                  <meshStandardMaterial color={persona.nose} roughness={0.82} />
                </mesh>
              </group>
            </group>
          </group>

          {/* Kepala */}
          <group ref={headRef} position={[0, 0.66, 0]}>
            <mesh>
              <sphereGeometry args={[0.13, 24, 24]} />
              <meshStandardMaterial color={persona.skin} roughness={0.8} />
            </mesh>

            {/* Penutup kepala sesuai persona */}
            {persona.head === "peci" && (
              <>
                {/* Peci (songkok) */}
                <mesh position={[0, 0.14, -0.01]}>
                  <cylinderGeometry args={[0.085, 0.095, 0.07, 16]} />
                  <meshStandardMaterial color={persona.peci} roughness={0.6} />
                </mesh>
                {/* Lingkar peci */}
                <mesh position={[0, 0.1, 0]}>
                  <cylinderGeometry args={[0.1, 0.1, 0.015, 16]} />
                  <meshStandardMaterial color={persona.peciBand} roughness={0.6} />
                </mesh>
              </>
            )}

            {persona.head === "sorban" && (
              <>
                {/* Sorban menutup kepala (cap dari puncak sampai atas alis) */}
                <mesh position={[0, 0.04, 0.005]}>
                  <sphereGeometry args={[0.135, 24, 20, 0, Math.PI * 2, 0, Math.PI * 0.38]} />
                  <meshStandardMaterial color={persona.sorban} roughness={0.95} />
                </mesh>
                {/* Lingkar sorban */}
                <mesh position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[0.135, 0.045, 12, 24]} />
                  <meshStandardMaterial color={persona.sorbanDark} roughness={0.9} />
                </mesh>
                {/* Ekor sorban */}
                <mesh position={[0.1, 0.04, -0.02]} rotation={[0.7, 0, -0.3]}>
                  <boxGeometry args={[0.045, 0.05, 0.14]} />
                  <meshStandardMaterial color={persona.sorban} roughness={0.95} />
                </mesh>
              </>
            )}

            {persona.head === "hijab" && (
              <>
                {/* Dome hijab (tutup kepala, wajah tetap terbuka) */}
                <mesh position={[0, 0.05, 0]}>
                  <sphereGeometry args={[0.14, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.5]} />
                  <meshStandardMaterial color={persona.hijab} roughness={0.95} />
                </mesh>
                {/* Kain belakang (cape ke bahu) */}
                <mesh position={[0, -0.06, -0.1]}>
                  <boxGeometry args={[0.3, 0.26, 0.02]} />
                  <meshStandardMaterial color={persona.hijab} roughness={0.95} />
                </mesh>
              </>
            )}

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
              <meshStandardMaterial color={persona.nose} roughness={0.8} />
            </mesh>
            {/* Kumis */}
            {persona.moustache && (
              <>
                <mesh position={[-0.03, -0.05, 0.124]} rotation={[0.15, 0, -0.08]}>
                  <boxGeometry args={[0.05, 0.014, 0.02]} />
                  <meshStandardMaterial color="#8b7b7e" />
                </mesh>
                <mesh position={[0.03, -0.05, 0.124]} rotation={[0.15, 0, 0.08]}>
                  <boxGeometry args={[0.05, 0.014, 0.02]} />
                  <meshStandardMaterial color="#8b7b7e" />
                </mesh>
              </>
            )}
            {/* Mulut (bergerak saat bicara) */}
            <mesh ref={mouthRef} position={[0, -0.07, 0.115]}>
              <capsuleGeometry args={[0.012, 0.028, 8, 10]} rotation={[0, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#7a4a3a" />
            </mesh>
            {/* Jenggot */}
            {persona.beard && (
              <mesh position={[0, -0.1, 0.1]}>
                <sphereGeometry args={[0.045, 14, 14, 0, Math.PI * 2, Math.PI * 0.25, Math.PI * 0.75]} />
                <meshStandardMaterial color="#c9c4c0" roughness={0.9} />
              </mesh>
            )}
            {/* Telinga */}
            {[-0.13, 0.13].map((x, i) => (
              <mesh key={i} position={[x, 0, 0]}>
                <sphereGeometry args={[0.026, 10, 10]} />
                <meshStandardMaterial color={persona.skin} roughness={0.8} />
              </mesh>
            ))}
          </group>
        </group>

        {/* Nama (label null = disembunyikan, mis. saat narator) */}
        {label !== null && label !== undefined && (
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
            {label || persona.name}
          </Text>
        )}

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