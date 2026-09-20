import React, { useState, useRef, useCallback, useEffect } from "react";
import { Text, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import soundService from "../../services/soundService";

const GLOW_COLOR = new THREE.Color("#b9e9ff");

// Counter id unik per instance tombol (untuk test-hook E2E).
let e2eCounter = 0;
const e2eVec = new THREE.Vector3();

/**
 * Button3D - Tombol 3D yang bisa diklik dengan controller, pointer, atau hand tracking
 * Support: mouse click, controller trigger, hand pinch gesture
 * Dengan sound effects untuk hover dan click
 */
export default function Button3D({ 
  position = [0, 0, 0],
  size = [0.4, 0.12, 0.02],
  color = "#4CAF50",
  hoverColor = "#66BB6A",
  text = "Button",
  textSize = 0.04,
  onClick,
  disabled = false,
  playSound = true, // Enable/disable sound per button
  pulse = false, // Berdenyut halus = sinyal "sudah boleh dilanjut" (audio selesai)
}) {
  const meshRef = useRef();
  const groupRef = useRef();
  const boxRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);
  // Guard anti double-fire: satu gestur fisik (klik mouse / tap / trigger
  // controller) bisa membangkitkan onPointerUp + onClick + onSelect untuk
  // tombol yang sama. Tanpa guard, satu pencet = 2-4x onClick → adegan loncat.
  const lastFireRef = useRef(0);
  // Test-hook E2E (HANYA aktif bila window.__E2E3D diset via addInitScript
  // oleh script automation; nol efek di production): laporkan posisi layar
  // tiap tombol ke window.__buttons3d supaya test tak perlu hover-sweep.
  const e2eIdRef = useRef(null);
  const e2eTickRef = useRef(0);
  if (e2eIdRef.current === null) {
    e2eIdRef.current = `b${++e2eCounter}`;
  }
  const e2eId = e2eIdRef.current;

  // Bersihkan registry saat tombol unmount (biar test tak klik tombol basi).
  useEffect(() => {
    return () => {
      try {
        if (typeof window !== "undefined" && window.__buttons3d) {
          delete window.__buttons3d[e2eId];
        }
      } catch { /* abaikan */ }
    };
  }, [e2eId]);

  // Lebar teks kira-kira (glyph rata-rata ≈ 0.55 × fontSize) → auto-shrink
  // supaya label panjang tidak keluar dari tombol/panel (terpotong).
  const label = text == null ? "" : String(text);
  const textMaxWidth = size[0] * 0.92;
  let fittedTextSize = textSize;
  if (label.length * 0.55 * textSize > textMaxWidth) {
    fittedTextSize = Math.max(textSize * 0.6, textMaxWidth / (label.length * 0.55));
  }

  // Animation: denyut "siap dilanjut" via glow (emissive), BUKAN scale —
  // supaya tulisan di tombol tidak mengecil/membesar saat berdenyut.
  useFrame(({ clock, camera, size }) => {
    if (!meshRef.current) return;

    // Test-hook E2E: proyeksikan posisi tombol ke layar (frame pertama +
    // throttle tiap ~6 frame agar segar di headless fps rendah).
    if (typeof window !== "undefined" && window.__E2E3D && groupRef.current) {
      e2eTickRef.current += 1;
      if ((e2eTickRef.current === 1 || e2eTickRef.current % 6 === 0) && camera && size) {
        groupRef.current.getWorldPosition(e2eVec);
        e2eVec.project(camera);
        const reg = (window.__buttons3d = window.__buttons3d || {});
        reg[e2eIdRef.current] = {
          label,
          x: Math.round((e2eVec.x * 0.5 + 0.5) * size.width),
          y: Math.round((-e2eVec.y * 0.5 + 0.5) * size.height),
          behind: e2eVec.z > 1,
          t: Date.now(),
        };
      }
    }

    const t = clock?.elapsedTime ?? 0;
    const targetScale = pressed ? 0.96 : hovered ? 1.06 : 1;
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale),
      0.2
    );

    const mat = boxRef.current?.material;
    if (mat && !Array.isArray(mat)) {
      const glow =
        pressed
          ? 0.3
          : hovered
            ? 0.18
            : pulse
              ? 0.12 + Math.sin(t * 2.5) * 0.08
              : 0;
      if (mat.emissiveIntensity === 1) mat.emissiveIntensity = 0; // default material
      mat.emissiveIntensity = THREE.MathUtils.lerp(mat.emissiveIntensity || 0, glow, 0.15);
      mat.emissive.lerp(GLOW_COLOR, 0.08);
    }
  });

  // Handle click - unified untuk semua input methods
  const handleClick = useCallback((e) => {
    if (disabled) return;
    const now = typeof performance !== "undefined" ? performance.now() : Date.now();
    if (now - lastFireRef.current < 600) return; // abaikan event ganda 1 gestur
    lastFireRef.current = now;
    if (e) e.stopPropagation();

    // Play click sound
    if (playSound) {
      soundService.playClick();
    }

    if (onClick) onClick();
  }, [disabled, onClick, playSound]);

  const handlePointerDown = (e) => {
    if (disabled) return;
    e.stopPropagation();
    setPressed(true);
  };

  // pointerUp HANYA melepas status pressed — eksekusi onClick cukup lewat
  // onClick (mouse/touch) atau onSelect (controller VR). Kalau pointerUp ikut
  // menembak onClick, satu klik = 2x aksi (adegan loncat).
  const handlePointerUp = (e) => {
    if (disabled) return;
    e.stopPropagation();
    setPressed(false);
  };

  const handlePointerOver = (e) => {
    if (disabled) return;
    e.stopPropagation();
    setHovered(true);
    document.body.style.cursor = 'pointer';
    
    // Play hover sound
    if (playSound) {
      soundService.playHover();
    }
  };

  const handlePointerOut = (e) => {
    e.stopPropagation();
    setHovered(false);
    setPressed(false);
    document.body.style.cursor = 'auto';
  };

  // XR Select event (for both controller trigger and hand pinch)
  const handleSelect = (e) => {
    if (disabled) return;
    if (e) e.stopPropagation();
    setPressed(true);
    setTimeout(() => {
      setPressed(false);
      handleClick(e);
    }, 100);
  };

  return (
    <group position={position} ref={groupRef}>
      <group ref={meshRef}>
        <RoundedBox
          ref={boxRef}
          args={size}
          radius={0.02}
          smoothness={4}
          // Standard pointer events (mouse, touch, controller ray)
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onPointerDown={handlePointerDown}
          onPointerUp={handlePointerUp}
          // Direct click fallback
          onClick={handleClick}
          // XR specific events - works with both controller and hand
          onSelect={handleSelect}
          onSelectStart={() => !disabled && setPressed(true)}
          onSelectEnd={() => setPressed(false)}
          // Squeeze event (grip button / hand squeeze)
          onSqueeze={handleSelect}
        >
          <meshStandardMaterial 
            color={disabled ? "#666" : (hovered ? hoverColor : color)}
            roughness={0.4}
            metalness={0.1}
          />
        </RoundedBox>
        <Text
          position={[0, 0, size[2] / 2 + 0.005]}
          fontSize={fittedTextSize}
          color="white"
          anchorX="center"
          anchorY="middle"
          maxWidth={textMaxWidth}
          textAlign="center"
        >
          {text}
        </Text>
      </group>
    </group>
  );
}
