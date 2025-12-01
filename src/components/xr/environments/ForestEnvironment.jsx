import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Sky } from "@react-three/drei";
import * as THREE from "three";

/**
 * ForestEnvironment - Hutan yang tenang dan sejuk
 */
export default function ForestEnvironment() {
  return (
    <group>
      {/* Sky - brighter daytime */}
      <Sky 
        distance={450000}
        sunPosition={[50, 30, -50]}
        inclination={0.4}
        azimuth={0.25}
        turbidity={6}
        rayleigh={1}
      />

      {/* Fog for atmosphere - lighter */}
      <fog attach="fog" args={["#7a9f70", 20, 80]} />

      {/* Ground - forest floor - brighter */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.5, 0]}
        receiveShadow
      >
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial 
          color="#4d7a48"
          roughness={1}
        />
      </mesh>

      {/* Grass patches */}
      <GrassPatches />

      {/* Trees - arranged in a clearing */}
      <TreeCircle />

      {/* Mushrooms */}
      {[...Array(15)].map((_, i) => (
        <Mushroom 
          key={i}
          position={[
            (Math.random() - 0.5) * 20,
            -0.45,
            (Math.random() - 0.5) * 20
          ]}
          scale={0.3 + Math.random() * 0.5}
        />
      ))}

      {/* Flowers */}
      {[...Array(20)].map((_, i) => (
        <Flower 
          key={i}
          position={[
            (Math.random() - 0.5) * 15,
            -0.3,
            (Math.random() - 0.5) * 15
          ]}
          color={['#ff9999', '#ffcc99', '#cc99ff', '#99ccff'][i % 4]}
        />
      ))}

      {/* Rocks */}
      {[...Array(8)].map((_, i) => (
        <ForestRock 
          key={i}
          position={[
            (Math.random() - 0.5) * 25,
            -0.3,
            (Math.random() - 0.5) * 25
          ]}
          scale={0.5 + Math.random()}
        />
      ))}

      {/* Fireflies / particles */}
      <Fireflies />

      {/* Fallen log for sitting */}
      <FallenLog position={[3, -0.2, 2]} />

      {/* Lighting - brighter and warmer */}
      <ambientLight intensity={0.6} color="#a8d5a2" />
      <directionalLight
        position={[20, 30, 10]}
        intensity={1.5}
        color="#fff8e7"
        castShadow
      />
      {/* Sun rays through trees */}
      <pointLight position={[5, 8, 3]} intensity={1} color="#ffffcc" />
      <pointLight position={[-5, 6, -3]} intensity={0.8} color="#ffffaa" />
      <pointLight position={[0, 5, 0]} intensity={0.6} color="#ffffff" />
      
      {/* Hemisphere light untuk pencahayaan merata */}
      <hemisphereLight 
        skyColor="#87ceeb" 
        groundColor="#4d7a48" 
        intensity={0.5} 
      />
    </group>
  );
}

// Tree component
function Tree({ position, scale = 1, type = "pine" }) {
  const trunkColor = "#5a4738";
  const leafColor = type === "pine" ? "#2d5a3a" : "#3d7a3d";
  
  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 2, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.35, 4, 8]} />
        <meshStandardMaterial color={trunkColor} roughness={0.9} />
      </mesh>
      
      {type === "pine" ? (
        // Pine tree - layered cones
        <>
          <mesh position={[0, 4.5, 0]} castShadow>
            <coneGeometry args={[1.5, 3, 8]} />
            <meshStandardMaterial color={leafColor} />
          </mesh>
          <mesh position={[0, 6, 0]} castShadow>
            <coneGeometry args={[1, 2.5, 8]} />
            <meshStandardMaterial color={leafColor} />
          </mesh>
          <mesh position={[0, 7.2, 0]} castShadow>
            <coneGeometry args={[0.6, 2, 8]} />
            <meshStandardMaterial color={leafColor} />
          </mesh>
        </>
      ) : (
        // Deciduous tree - sphere crown
        <mesh position={[0, 5, 0]} castShadow>
          <sphereGeometry args={[2, 8, 8]} />
          <meshStandardMaterial color={leafColor} />
        </mesh>
      )}
    </group>
  );
}

// Circle of trees around clearing
function TreeCircle() {
  const trees = useMemo(() => {
    const arr = [];
    const count = 20;
    const radius = 12;
    
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = radius + (Math.random() - 0.5) * 4;
      arr.push({
        position: [
          Math.cos(angle) * r,
          0,
          Math.sin(angle) * r
        ],
        scale: 0.8 + Math.random() * 0.6,
        type: Math.random() > 0.5 ? "pine" : "deciduous"
      });
    }
    
    // Add some trees further back
    for (let i = 0; i < 15; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 18 + Math.random() * 10;
      arr.push({
        position: [
          Math.cos(angle) * r,
          0,
          Math.sin(angle) * r
        ],
        scale: 1 + Math.random() * 0.8,
        type: Math.random() > 0.3 ? "pine" : "deciduous"
      });
    }
    
    return arr;
  }, []);

  return (
    <group>
      {trees.map((tree, i) => (
        <Tree 
          key={i}
          position={tree.position}
          scale={tree.scale}
          type={tree.type}
        />
      ))}
    </group>
  );
}

// Grass patches
function GrassPatches() {
  const patches = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 100; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 25,
        z: (Math.random() - 0.5) * 25,
        scale: 0.5 + Math.random(),
        rotation: Math.random() * Math.PI * 2
      });
    }
    return arr;
  }, []);

  return (
    <group>
      {patches.map((p, i) => (
        <mesh 
          key={i} 
          position={[p.x, -0.4, p.z]}
          rotation={[0, p.rotation, 0]}
          scale={p.scale}
        >
          <coneGeometry args={[0.1, 0.3, 4]} />
          <meshStandardMaterial color="#4a7c47" />
        </mesh>
      ))}
    </group>
  );
}

// Mushroom
function Mushroom({ position, scale = 1 }) {
  const colors = ["#ff6b6b", "#ffd93d", "#6bcb77", "#4d96ff"];
  const color = colors[Math.floor(Math.random() * colors.length)];
  
  return (
    <group position={position} scale={scale}>
      {/* Stem */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.05, 0.08, 0.3, 8]} />
        <meshStandardMaterial color="#f5f5dc" />
      </mesh>
      {/* Cap */}
      <mesh position={[0, 0.35, 0]}>
        <sphereGeometry args={[0.15, 8, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );
}

// Flower
function Flower({ position, color }) {
  return (
    <group position={position}>
      {/* Stem */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.02, 0.02, 0.3, 4]} />
        <meshStandardMaterial color="#228b22" />
      </mesh>
      {/* Petals */}
      {[0, 72, 144, 216, 288].map((angle, i) => (
        <mesh 
          key={i}
          position={[
            Math.cos(angle * Math.PI / 180) * 0.08,
            0.3,
            Math.sin(angle * Math.PI / 180) * 0.08
          ]}
        >
          <sphereGeometry args={[0.05, 4, 4]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
      {/* Center */}
      <mesh position={[0, 0.3, 0]}>
        <sphereGeometry args={[0.04, 4, 4]} />
        <meshStandardMaterial color="#ffd700" />
      </mesh>
    </group>
  );
}

// Forest rock
function ForestRock({ position, scale }) {
  return (
    <mesh position={position} scale={scale} rotation={[0, Math.random() * Math.PI, 0]}>
      <dodecahedronGeometry args={[0.5, 0]} />
      <meshStandardMaterial color="#5a5a5a" roughness={0.9} />
    </mesh>
  );
}

// Fallen log
function FallenLog({ position }) {
  return (
    <group position={position} rotation={[0, 0.5, 0]}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.3, 0.35, 3, 8]} />
        <meshStandardMaterial color="#5c4033" roughness={0.95} />
      </mesh>
    </group>
  );
}

// Fireflies
function Fireflies() {
  const ref = useRef();
  
  const fireflies = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 30; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 20,
        y: 0.5 + Math.random() * 3,
        z: (Math.random() - 0.5) * 20,
        speed: 0.5 + Math.random() * 1,
        phase: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.children.forEach((child, i) => {
        const ff = fireflies[i];
        if (ff) {
          const t = clock.elapsedTime * ff.speed + ff.phase;
          child.position.y = ff.y + Math.sin(t) * 0.5;
          child.position.x = ff.x + Math.sin(t * 0.5) * 0.3;
          // Pulsing glow
          const intensity = 0.5 + Math.sin(t * 3) * 0.5;
          child.material.emissiveIntensity = intensity;
        }
      });
    }
  });

  return (
    <group ref={ref}>
      {fireflies.map((ff, i) => (
        <mesh key={i} position={[ff.x, ff.y, ff.z]}>
          <sphereGeometry args={[0.03, 4, 4]} />
          <meshStandardMaterial 
            color="#ffff00" 
            emissive="#ffff00"
            emissiveIntensity={0.5}
          />
        </mesh>
      ))}
    </group>
  );
}
