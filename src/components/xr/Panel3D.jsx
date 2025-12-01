import React, { useRef } from "react";
import { Text, RoundedBox } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import Button3D from "./Button3D";

/**
 * Panel3D - Panel floating untuk menampilkan UI dalam VR
 */
export default function Panel3D({
  position = [0, 1.8, -1.5],
  rotation = [0, 0, 0],
  width = 1.2,
  height = 0.8,
  title,
  children,
  backgroundColor = "#1a1a2e",
  followCamera = false,
}) {
  const groupRef = useRef();

  useFrame(({ camera }) => {
    if (followCamera && groupRef.current) {
      // Make panel face the camera
      groupRef.current.lookAt(camera.position);
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Background panel - solid dark color */}
      <RoundedBox
        args={[width, height, 0.03]}
        radius={0.03}
        smoothness={4}
      >
        <meshStandardMaterial 
          color={backgroundColor}
          roughness={0.3}
          metalness={0.1}
        />
      </RoundedBox>

      {/* Title */}
      {title && (
        <Text
          position={[0, height / 2 - 0.08, 0.02]}
          fontSize={0.06}
          color="white"
          anchorX="center"
          anchorY="middle"
          fontWeight="bold"
        >
          {title}
        </Text>
      )}

      {/* Content */}
      <group position={[0, 0, 0.02]}>
        {children}
      </group>
    </group>
  );
}
