import React, { useState, useRef, useCallback } from "react";
import { Text, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import soundService from "../../services/soundService";

const GLOW_COLOR = new THREE.Color("#b9e9ff");

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
  useFrame(({ clock }) => {
    if (!meshRef.current) return;

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

  const handlePointerUp = (e) => {
    if (disabled) return;
    e.stopPropagation();
    setPressed(false);
    handleClick(e);
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
