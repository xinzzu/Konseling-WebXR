import React, { useState, useRef, useCallback } from "react";
import { Text, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import soundService from "../../services/soundService";

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
}) {
  const meshRef = useRef();
  const groupRef = useRef();
  const [hovered, setHovered] = useState(false);
  const [pressed, setPressed] = useState(false);

  // Animation
  useFrame(() => {
    if (!meshRef.current) return;
    
    const targetScale = pressed ? 0.95 : hovered ? 1.05 : 1;
    meshRef.current.scale.lerp(
      new THREE.Vector3(targetScale, targetScale, targetScale), 
      0.2
    );
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
          fontSize={textSize}
          color="white"
          anchorX="center"
          anchorY="middle"
        >
          {text}
        </Text>
      </group>
    </group>
  );
}
