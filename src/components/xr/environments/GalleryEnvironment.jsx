import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Sky, Cloud } from "@react-three/drei";
import * as THREE from "three";

/**
 * GalleryEnvironment - Sunset environment yang menenangkan
 * Suasana senja dengan warna hangat orange/pink
 */
export default function GalleryEnvironment() {
  return (
    <group>
      {/* Sunset Sky */}
      <Sky 
        distance={450000}
        sunPosition={[0, 2, -100]}
        inclination={0.49}
        azimuth={0.25}
        turbidity={10}
        rayleigh={2}
        mieCoefficient={0.1}
        mieDirectionalG={0.8}
      />

      {/* Warm sunset clouds */}
      <Cloud position={[-30, 8, -40]} speed={0.1} opacity={0.6} color="#ff9e80" width={25} depth={8} />
      <Cloud position={[25, 10, -50]} speed={0.08} opacity={0.5} color="#ffab91" width={20} depth={6} />
      <Cloud position={[0, 12, -60]} speed={0.12} opacity={0.4} color="#ffccbc" width={30} depth={10} />
      <Cloud position={[-20, 6, -35]} speed={0.15} opacity={0.5} color="#ff8a65" width={15} depth={5} />
      <Cloud position={[35, 9, -45]} speed={0.1} opacity={0.45} color="#ffab91" width={18} depth={7} />

      {/* Ground - grass meadow */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#4a5d23" roughness={1} />
      </mesh>

      {/* Distant hills silhouette */}
      <Hills />

      {/* Sun glow effect */}
      <SunGlow />

      {/* Trees silhouettes */}
      <TreeSilhouette position={[-15, 0, -20]} scale={1.5} />
      <TreeSilhouette position={[18, 0, -25]} scale={1.2} />
      <TreeSilhouette position={[-25, 0, -30]} scale={1.8} />
      <TreeSilhouette position={[30, 0, -35]} scale={1.4} />
      <TreeSilhouette position={[-8, 0, -40]} scale={2} />
      <TreeSilhouette position={[10, 0, -45]} scale={1.6} />

      {/* Grass patches around player */}
      <GrassField position={[0, -0.5, 0]} />

      {/* Fireflies/particles for magical atmosphere */}
      <Fireflies />

      {/* Flowers scattered */}
      <FlowerField />

      {/* Wooden bench for relaxation */}
      <WoodenBench position={[3, 0, 2]} rotation={[0, -0.5, 0]} />
      <WoodenBench position={[-4, 0, 3]} rotation={[0, 0.3, 0]} />

      {/* Lanterns */}
      <Lantern position={[-2, 0, -1]} />
      <Lantern position={[2.5, 0, 0]} />

      {/* Birds flying in distance */}
      <BirdFlock position={[0, 15, -30]} />

      {/* Warm sunset lighting */}
      <directionalLight
        position={[0, 10, -50]}
        intensity={1.2}
        color="#ff6f00"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <ambientLight intensity={0.4} color="#ffccbc" />
      <hemisphereLight
        skyColor="#ff8a65"
        groundColor="#4a5d23"
        intensity={0.5}
      />

      {/* Rim light from sunset */}
      <pointLight position={[0, 5, -40]} intensity={2} color="#ff5722" distance={100} />
    </group>
  );
}

// Hills silhouette in background
function Hills() {
  return (
    <group>
      {/* Main hill */}
      <mesh position={[0, -2, -60]}>
        <sphereGeometry args={[30, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color="#2d3a1a" />
      </mesh>
      {/* Left hill */}
      <mesh position={[-40, -5, -50]}>
        <sphereGeometry args={[25, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color="#3d4a2a" />
      </mesh>
      {/* Right hill */}
      <mesh position={[45, -3, -55]}>
        <sphereGeometry args={[28, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshBasicMaterial color="#354020" />
      </mesh>
    </group>
  );
}

// Sun glow effect
function SunGlow() {
  const ref = useRef();
  
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.material.opacity = 0.6 + Math.sin(clock.elapsedTime * 0.5) * 0.1;
    }
  });

  return (
    <group position={[0, 5, -80]}>
      {/* Core sun */}
      <mesh>
        <sphereGeometry args={[8, 32, 32]} />
        <meshBasicMaterial color="#ff6f00" />
      </mesh>
      {/* Outer glow */}
      <mesh ref={ref}>
        <sphereGeometry args={[12, 32, 32]} />
        <meshBasicMaterial color="#ffab40" transparent opacity={0.6} />
      </mesh>
      {/* Halo */}
      <mesh>
        <sphereGeometry args={[18, 32, 32]} />
        <meshBasicMaterial color="#ffe0b2" transparent opacity={0.2} />
      </mesh>
    </group>
  );
}

// Tree silhouette
function TreeSilhouette({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 1.5, 0]}>
        <cylinderGeometry args={[0.15, 0.25, 3, 8]} />
        <meshBasicMaterial color="#1a1a1a" />
      </mesh>
      {/* Foliage - multiple layers */}
      <mesh position={[0, 4, 0]}>
        <sphereGeometry args={[1.5, 8, 8]} />
        <meshBasicMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[0.5, 3.2, 0.3]}>
        <sphereGeometry args={[1, 8, 8]} />
        <meshBasicMaterial color="#1a1a1a" />
      </mesh>
      <mesh position={[-0.5, 3.5, -0.2]}>
        <sphereGeometry args={[0.9, 8, 8]} />
        <meshBasicMaterial color="#1a1a1a" />
      </mesh>
    </group>
  );
}

// Grass field around player
function GrassField({ position }) {
  const grassBlades = useMemo(() => {
    const blades = [];
    for (let i = 0; i < 200; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 2 + Math.random() * 10;
      blades.push({
        x: Math.cos(angle) * dist,
        z: Math.sin(angle) * dist,
        height: 0.2 + Math.random() * 0.3,
        rotation: Math.random() * Math.PI,
        offset: Math.random() * Math.PI * 2,
      });
    }
    return blades;
  }, []);

  return (
    <group position={position}>
      {grassBlades.map((blade, i) => (
        <GrassBlade key={i} blade={blade} />
      ))}
    </group>
  );
}

function GrassBlade({ blade }) {
  const ref = useRef();
  
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.x = Math.sin(clock.elapsedTime * 2 + blade.offset) * 0.15;
    }
  });

  return (
    <mesh
      ref={ref}
      position={[blade.x, blade.height / 2, blade.z]}
      rotation={[0, blade.rotation, 0]}
    >
      <coneGeometry args={[0.02, blade.height, 4]} />
      <meshStandardMaterial color="#5d6d2a" />
    </mesh>
  );
}

// Magical fireflies
function Fireflies() {
  const ref = useRef();
  
  const fireflies = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 40; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 20,
        y: 0.5 + Math.random() * 3,
        z: (Math.random() - 0.5) * 20,
        speed: 0.5 + Math.random() * 1,
        offset: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, []);

  return (
    <group ref={ref}>
      {fireflies.map((f, i) => (
        <Firefly key={i} data={f} />
      ))}
    </group>
  );
}

function Firefly({ data }) {
  const ref = useRef();
  
  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.elapsedTime * data.speed + data.offset;
      ref.current.position.x = data.x + Math.sin(t) * 0.5;
      ref.current.position.y = data.y + Math.sin(t * 1.5) * 0.3;
      ref.current.position.z = data.z + Math.cos(t) * 0.5;
      // Pulsing glow
      ref.current.material.opacity = 0.5 + Math.sin(t * 3) * 0.4;
    }
  });

  return (
    <mesh ref={ref} position={[data.x, data.y, data.z]}>
      <sphereGeometry args={[0.03, 8, 8]} />
      <meshBasicMaterial color="#ffeb3b" transparent opacity={0.8} />
    </mesh>
  );
}

// Flower field
function FlowerField() {
  const flowers = useMemo(() => {
    const arr = [];
    const colors = ['#e91e63', '#9c27b0', '#ff9800', '#ffeb3b', '#f44336', '#ff5722'];
    for (let i = 0; i < 50; i++) {
      const angle = Math.random() * Math.PI * 2;
      const dist = 2 + Math.random() * 12;
      arr.push({
        x: Math.cos(angle) * dist,
        z: Math.sin(angle) * dist,
        color: colors[Math.floor(Math.random() * colors.length)],
        scale: 0.5 + Math.random() * 0.5,
      });
    }
    return arr;
  }, []);

  return (
    <group>
      {flowers.map((f, i) => (
        <Flower key={i} position={[f.x, -0.45, f.z]} color={f.color} scale={f.scale} />
      ))}
    </group>
  );
}

function Flower({ position, color, scale = 1 }) {
  const ref = useRef();
  const offset = useMemo(() => Math.random() * Math.PI * 2, []);
  
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.z = Math.sin(clock.elapsedTime * 1.5 + offset) * 0.1;
    }
  });

  return (
    <group ref={ref} position={position} scale={scale}>
      {/* Stem */}
      <mesh position={[0, 0.15, 0]}>
        <cylinderGeometry args={[0.01, 0.01, 0.3, 6]} />
        <meshStandardMaterial color="#4a5d23" />
      </mesh>
      {/* Petals */}
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh
          key={i}
          position={[
            Math.cos((i / 5) * Math.PI * 2) * 0.04,
            0.32,
            Math.sin((i / 5) * Math.PI * 2) * 0.04,
          ]}
        >
          <sphereGeometry args={[0.03, 6, 6]} />
          <meshStandardMaterial color={color} />
        </mesh>
      ))}
      {/* Center */}
      <mesh position={[0, 0.32, 0]}>
        <sphereGeometry args={[0.02, 6, 6]} />
        <meshStandardMaterial color="#ffeb3b" />
      </mesh>
    </group>
  );
}

// Wooden bench
function WoodenBench({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Seat */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[1, 0.08, 0.4]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      {/* Back rest */}
      <mesh position={[0, 0.65, -0.15]} rotation={[0.2, 0, 0]}>
        <boxGeometry args={[1, 0.4, 0.05]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      {/* Legs */}
      {[[-0.4, 0.15, 0.12], [0.4, 0.15, 0.12], [-0.4, 0.15, -0.12], [0.4, 0.15, -0.12]].map((pos, i) => (
        <mesh key={i} position={pos}>
          <boxGeometry args={[0.08, 0.35, 0.08]} />
          <meshStandardMaterial color="#4e342e" />
        </mesh>
      ))}
    </group>
  );
}

// Lantern
function Lantern({ position }) {
  const lightRef = useRef();
  
  useFrame(({ clock }) => {
    if (lightRef.current) {
      lightRef.current.intensity = 1 + Math.sin(clock.elapsedTime * 3) * 0.3;
    }
  });

  return (
    <group position={position}>
      {/* Post */}
      <mesh position={[0, 0.6, 0]}>
        <cylinderGeometry args={[0.03, 0.04, 1.2, 8]} />
        <meshStandardMaterial color="#3e2723" />
      </mesh>
      {/* Lamp housing */}
      <mesh position={[0, 1.3, 0]}>
        <boxGeometry args={[0.15, 0.2, 0.15]} />
        <meshStandardMaterial color="#5d4037" />
      </mesh>
      {/* Glass */}
      <mesh position={[0, 1.3, 0]}>
        <boxGeometry args={[0.12, 0.15, 0.12]} />
        <meshBasicMaterial color="#ffcc80" transparent opacity={0.7} />
      </mesh>
      {/* Light */}
      <pointLight ref={lightRef} position={[0, 1.3, 0]} color="#ff9800" intensity={1} distance={5} />
    </group>
  );
}

// Birds flying
function BirdFlock({ position }) {
  const ref = useRef();
  
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.x = position[0] + Math.sin(clock.elapsedTime * 0.2) * 30;
    }
  });

  return (
    <group ref={ref} position={position}>
      {[...Array(7)].map((_, i) => (
        <Bird 
          key={i} 
          position={[
            (Math.random() - 0.5) * 5,
            (Math.random() - 0.5) * 2,
            (Math.random() - 0.5) * 3
          ]} 
          delay={i * 0.2}
        />
      ))}
    </group>
  );
}

function Bird({ position, delay }) {
  const ref = useRef();
  const wingRef = useRef();
  
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = position[1] + Math.sin(clock.elapsedTime * 2 + delay) * 0.3;
    }
    if (wingRef.current) {
      wingRef.current.rotation.z = Math.sin(clock.elapsedTime * 10 + delay) * 0.5;
    }
  });

  return (
    <group ref={ref} position={position}>
      {/* Body - simple V shape for distant bird */}
      <mesh ref={wingRef}>
        <boxGeometry args={[0.3, 0.02, 0.05]} />
        <meshBasicMaterial color="#1a1a1a" />
      </mesh>
    </group>
  );
}
