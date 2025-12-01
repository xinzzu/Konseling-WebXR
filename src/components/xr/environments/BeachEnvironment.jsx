import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Sky, Cloud } from "@react-three/drei";
import * as THREE from "three";

/**
 * BeachEnvironment - Pantai yang menenangkan dengan ombak
 */
export default function BeachEnvironment() {
  const waterRef = useRef();
  const time = useRef(0);

  // Animated water shader
  useFrame((state, delta) => {
    time.current += delta;
    if (waterRef.current) {
      waterRef.current.position.y = Math.sin(time.current * 0.5) * 0.05 - 0.1;
    }
  });

  // Sand color gradient
  const sandMaterial = useMemo(() => 
    new THREE.MeshStandardMaterial({
      color: "#f4e4bc",
      roughness: 0.9,
      metalness: 0,
    }), []
  );

  // Water material
  const waterMaterial = useMemo(() => 
    new THREE.MeshStandardMaterial({
      color: "#4fc3f7",
      transparent: true,
      opacity: 0.7,
      roughness: 0.1,
      metalness: 0.3,
    }), []
  );

  return (
    <group>
      {/* Sky with sun */}
      <Sky 
        distance={450000}
        sunPosition={[100, 20, 100]}
        inclination={0.6}
        azimuth={0.25}
        turbidity={8}
        rayleigh={0.5}
      />

      {/* Clouds */}
      <Cloud
        position={[-20, 15, -30]}
        speed={0.2}
        opacity={0.5}
        width={20}
        depth={5}
      />
      <Cloud
        position={[20, 18, -40]}
        speed={0.15}
        opacity={0.4}
        width={15}
        depth={4}
      />
      <Cloud
        position={[0, 20, -50]}
        speed={0.1}
        opacity={0.3}
        width={25}
        depth={6}
      />

      {/* Sand/Beach floor */}
      <mesh 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.5, 0]}
        receiveShadow
      >
        <planeGeometry args={[100, 100]} />
        <primitive object={sandMaterial} />
      </mesh>

      {/* Ocean water */}
      <mesh 
        ref={waterRef}
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.1, -30]}
        receiveShadow
      >
        <planeGeometry args={[100, 60]} />
        <primitive object={waterMaterial} />
      </mesh>

      {/* Waves effect - multiple layers */}
      {[0, 1, 2].map((i) => (
        <WaveLayer key={i} index={i} />
      ))}

      {/* Beach decorations */}
      <PalmTree position={[-8, 0, -5]} />
      <PalmTree position={[10, 0, -8]} scale={0.8} />
      <PalmTree position={[-12, 0, -10]} scale={1.2} />
      <PalmTree position={[15, 0, -12]} scale={0.9} />
      <PalmTree position={[-15, 0, 3]} scale={1.1} />

      {/* Rocks */}
      <Rock position={[5, -0.3, -3]} scale={0.5} />
      <Rock position={[-6, -0.3, -2]} scale={0.3} />
      <Rock position={[8, -0.3, -6]} scale={0.7} />
      <Rock position={[-10, -0.35, -8]} scale={0.4} />
      <Rock position={[12, -0.25, -10]} scale={0.6} />

      {/* Shells scattered */}
      {[...Array(20)].map((_, i) => (
        <Shell 
          key={i} 
          position={[
            (Math.random() - 0.5) * 20, 
            -0.45, 
            (Math.random() - 0.5) * 15 - 2
          ]} 
        />
      ))}

      {/* Beach chairs and umbrella */}
      <BeachChair position={[-3, 0, 2]} rotation={[0, 0.3, 0]} />
      <BeachChair position={[3, 0, 3]} rotation={[0, -0.2, 0]} />
      <BeachUmbrella position={[0, 0, 2.5]} color="#e53935" />
      <BeachUmbrella position={[6, 0, 1]} color="#1e88e5" />

      {/* Beach towel */}
      <BeachTowel position={[-1, -0.48, 4]} rotation={[0, 0.5, 0]} color="#ff7043" />
      <BeachTowel position={[4, -0.48, 5]} rotation={[0, -0.3, 0]} color="#26a69a" />

      {/* Beach ball */}
      <BeachBall position={[2, 0, 4]} />

      {/* Sandcastle */}
      <Sandcastle position={[-4, -0.5, 6]} />

      {/* Seagulls flying */}
      <Seagull position={[5, 8, -10]} delay={0} />
      <Seagull position={[-3, 10, -15]} delay={1} />
      <Seagull position={[8, 9, -20]} delay={2} />

      {/* Driftwood */}
      <Driftwood position={[7, -0.4, 0]} rotation={[0, 0.8, 0.1]} />
      <Driftwood position={[-8, -0.4, 5]} rotation={[0, -0.5, -0.1]} scale={0.7} />

      {/* Beach grass patches */}
      <BeachGrass position={[-10, -0.5, 8]} />
      <BeachGrass position={[12, -0.5, 7]} />
      <BeachGrass position={[-14, -0.5, 5]} />
      <BeachGrass position={[14, -0.5, 4]} />

      {/* Starfish */}
      <Starfish position={[1, -0.48, 1]} />
      <Starfish position={[-2, -0.48, 3]} rotation={[0, 1.2, 0]} />
      <Starfish position={[6, -0.48, 2]} rotation={[0, 2.5, 0]} />

      {/* Coconuts under palm trees */}
      <Coconut position={[-8.3, -0.4, -4.5]} />
      <Coconut position={[-7.7, -0.4, -5.2]} />
      <Coconut position={[9.8, -0.4, -7.5]} />

      {/* Footprints in sand */}
      <Footprints startPosition={[0, -0.49, 8]} direction={-1} count={8} />

      {/* Ambient sounds visual indicator - floating particles */}
      <BeachParticles />

      {/* Sunlight */}
      <directionalLight
        position={[50, 30, 50]}
        intensity={1.5}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <ambientLight intensity={0.6} color="#fff5e6" />
      
      {/* Sun glow */}
      <mesh position={[50, 20, -50]}>
        <sphereGeometry args={[5, 16, 16]} />
        <meshBasicMaterial color="#fff9c4" transparent opacity={0.8} />
      </mesh>
    </group>
  );
}

// Wave animation layer
function WaveLayer({ index }) {
  const ref = useRef();
  
  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.elapsedTime;
      ref.current.position.z = -25 + Math.sin(t * 0.8 + index * 2) * 3;
      ref.current.scale.x = 1 + Math.sin(t + index) * 0.1;
    }
  });

  return (
    <mesh 
      ref={ref}
      rotation={[-Math.PI / 2, 0, 0]} 
      position={[0, -0.05, -25 + index * 2]}
    >
      <planeGeometry args={[100, 2]} />
      <meshStandardMaterial 
        color="#81d4fa" 
        transparent 
        opacity={0.5 - index * 0.1}
      />
    </mesh>
  );
}

// Simple palm tree
function PalmTree({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      {/* Trunk */}
      <mesh position={[0, 2, 0]}>
        <cylinderGeometry args={[0.15, 0.25, 4, 8]} />
        <meshStandardMaterial color="#8B4513" roughness={0.9} />
      </mesh>
      {/* Leaves */}
      {[0, 72, 144, 216, 288].map((angle, i) => (
        <mesh 
          key={i}
          position={[
            Math.cos(angle * Math.PI / 180) * 0.5,
            4,
            Math.sin(angle * Math.PI / 180) * 0.5
          ]}
          rotation={[0.5, angle * Math.PI / 180, 0.3]}
        >
          <coneGeometry args={[0.3, 2, 4]} />
          <meshStandardMaterial color="#2e7d32" />
        </mesh>
      ))}
    </group>
  );
}

// Simple rock
function Rock({ position, scale = 1 }) {
  return (
    <mesh position={position} scale={scale}>
      <dodecahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#666" roughness={0.8} />
    </mesh>
  );
}

// Shell decoration
function Shell({ position }) {
  return (
    <mesh position={position} rotation={[0, Math.random() * Math.PI * 2, 0]}>
      <coneGeometry args={[0.05, 0.08, 8]} />
      <meshStandardMaterial color="#fff5ee" />
    </mesh>
  );
}

// Beach atmosphere particles
function BeachParticles() {
  const ref = useRef();
  
  const particles = useMemo(() => {
    const arr = [];
    for (let i = 0; i < 50; i++) {
      arr.push({
        x: (Math.random() - 0.5) * 30,
        y: Math.random() * 10,
        z: (Math.random() - 0.5) * 30,
        speed: 0.1 + Math.random() * 0.2,
      });
    }
    return arr;
  }, []);

  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.y = clock.elapsedTime * 0.02;
    }
  });

  return (
    <group ref={ref}>
      {particles.map((p, i) => (
        <mesh key={i} position={[p.x, p.y, p.z]}>
          <sphereGeometry args={[0.02, 4, 4]} />
          <meshBasicMaterial color="#ffffff" transparent opacity={0.3} />
        </mesh>
      ))}
    </group>
  );
}

// Beach Chair
function BeachChair({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Frame */}
      <mesh position={[0, 0.3, 0]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.6, 0.05, 1]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      {/* Back rest */}
      <mesh position={[0, 0.55, -0.35]} rotation={[0.8, 0, 0]}>
        <boxGeometry args={[0.6, 0.05, 0.5]} />
        <meshStandardMaterial color="#8B4513" />
      </mesh>
      {/* Legs */}
      {[[-0.25, 0, 0.3], [0.25, 0, 0.3], [-0.25, 0, -0.3], [0.25, 0, -0.3]].map((pos, i) => (
        <mesh key={i} position={pos}>
          <cylinderGeometry args={[0.02, 0.02, 0.4, 8]} />
          <meshStandardMaterial color="#5D4037" />
        </mesh>
      ))}
      {/* Fabric */}
      <mesh position={[0, 0.32, 0]} rotation={[0.3, 0, 0]}>
        <boxGeometry args={[0.55, 0.02, 0.95]} />
        <meshStandardMaterial color="#1565C0" />
      </mesh>
    </group>
  );
}

// Beach Umbrella
function BeachUmbrella({ position, color = "#e53935" }) {
  return (
    <group position={position}>
      {/* Pole */}
      <mesh position={[0, 1, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 2, 8]} />
        <meshStandardMaterial color="#FAFAFA" />
      </mesh>
      {/* Canopy */}
      <mesh position={[0, 2, 0]} rotation={[0, 0, 0]}>
        <coneGeometry args={[1.2, 0.4, 8, 1, true]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      {/* Stripes on umbrella */}
      <mesh position={[0, 1.95, 0]}>
        <coneGeometry args={[1.15, 0.35, 8, 1, true]} />
        <meshStandardMaterial color="#FFFFFF" side={THREE.DoubleSide} transparent opacity={0.5} />
      </mesh>
    </group>
  );
}

// Beach Towel
function BeachTowel({ position, rotation = [0, 0, 0], color = "#ff7043" }) {
  return (
    <group position={position} rotation={rotation}>
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.8, 1.5]} />
        <meshStandardMaterial color={color} side={THREE.DoubleSide} />
      </mesh>
      {/* Stripe */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, 0]}>
        <planeGeometry args={[0.8, 0.2]} />
        <meshStandardMaterial color="#FFFFFF" side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// Beach Ball
function BeachBall({ position }) {
  const ref = useRef();
  
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.position.y = 0.15 + Math.sin(clock.elapsedTime * 2) * 0.05;
      ref.current.rotation.y = clock.elapsedTime * 0.5;
    }
  });

  return (
    <group ref={ref} position={position}>
      <mesh>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      {/* Color stripes */}
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} rotation={[0, (i * Math.PI) / 2, 0]}>
          <sphereGeometry args={[0.152, 16, 16, 0, Math.PI / 2]} />
          <meshStandardMaterial 
            color={i % 2 === 0 ? "#e53935" : "#1e88e5"} 
          />
        </mesh>
      ))}
    </group>
  );
}

// Sandcastle
function Sandcastle({ position }) {
  return (
    <group position={position}>
      {/* Main tower */}
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.2, 0.25, 0.4, 8]} />
        <meshStandardMaterial color="#d4b896" />
      </mesh>
      {/* Tower top */}
      <mesh position={[0, 0.45, 0]}>
        <coneGeometry args={[0.15, 0.15, 8]} />
        <meshStandardMaterial color="#c4a882" />
      </mesh>
      {/* Side towers */}
      {[[-0.3, 0], [0.3, 0], [0, -0.3], [0, 0.3]].map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.12, 0]}>
            <cylinderGeometry args={[0.1, 0.12, 0.25, 8]} />
            <meshStandardMaterial color="#d4b896" />
          </mesh>
          <mesh position={[0, 0.28, 0]}>
            <coneGeometry args={[0.08, 0.1, 8]} />
            <meshStandardMaterial color="#c4a882" />
          </mesh>
        </group>
      ))}
      {/* Base */}
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.5, 0.55, 0.05, 8]} />
        <meshStandardMaterial color="#e0c9a6" />
      </mesh>
    </group>
  );
}

// Seagull
function Seagull({ position, delay = 0 }) {
  const ref = useRef();
  
  useFrame(({ clock }) => {
    if (ref.current) {
      const t = clock.elapsedTime + delay;
      // Circular flying pattern
      ref.current.position.x = position[0] + Math.sin(t * 0.3) * 10;
      ref.current.position.z = position[2] + Math.cos(t * 0.3) * 10;
      ref.current.position.y = position[1] + Math.sin(t * 0.5) * 1;
      // Face direction of movement
      ref.current.rotation.y = -t * 0.3 + Math.PI / 2;
    }
  });

  return (
    <group ref={ref} position={position}>
      {/* Body */}
      <mesh>
        <capsuleGeometry args={[0.05, 0.15, 4, 8]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#FAFAFA" />
      </mesh>
      {/* Wings */}
      <WingAnimated side={-1} />
      <WingAnimated side={1} />
      {/* Head */}
      <mesh position={[0.1, 0.02, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color="#FAFAFA" />
      </mesh>
      {/* Beak */}
      <mesh position={[0.16, 0, 0]} rotation={[0, 0, -0.2]}>
        <coneGeometry args={[0.015, 0.05, 4]} />
        <meshStandardMaterial color="#FFA000" />
      </mesh>
    </group>
  );
}

// Animated wing for seagull
function WingAnimated({ side }) {
  const ref = useRef();
  
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.z = side * (0.3 + Math.sin(clock.elapsedTime * 8) * 0.4);
    }
  });

  return (
    <mesh ref={ref} position={[0, 0, side * 0.05]}>
      <boxGeometry args={[0.1, 0.01, 0.15]} />
      <meshStandardMaterial color="#E0E0E0" />
    </mesh>
  );
}

// Driftwood
function Driftwood({ position, rotation = [0, 0, 0], scale = 1 }) {
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.08, 1, 8]} />
        <meshStandardMaterial color="#8D6E63" roughness={1} />
      </mesh>
      {/* Branch */}
      <mesh position={[0.2, 0.1, 0]} rotation={[0, 0, 0.5]}>
        <cylinderGeometry args={[0.02, 0.04, 0.4, 6]} />
        <meshStandardMaterial color="#795548" roughness={1} />
      </mesh>
    </group>
  );
}

// Beach grass patch
function BeachGrass({ position }) {
  return (
    <group position={position}>
      {[...Array(15)].map((_, i) => {
        const angle = (i / 15) * Math.PI * 2;
        const dist = Math.random() * 0.5;
        return (
          <GrassBlade 
            key={i}
            position={[
              Math.cos(angle) * dist,
              0,
              Math.sin(angle) * dist
            ]}
            rotation={[0, Math.random() * Math.PI, 0]}
          />
        );
      })}
    </group>
  );
}

// Single grass blade with animation
function GrassBlade({ position, rotation }) {
  const ref = useRef();
  const offset = useMemo(() => Math.random() * Math.PI * 2, []);
  
  useFrame(({ clock }) => {
    if (ref.current) {
      ref.current.rotation.x = Math.sin(clock.elapsedTime * 2 + offset) * 0.1;
    }
  });

  return (
    <mesh ref={ref} position={position} rotation={rotation}>
      <coneGeometry args={[0.02, 0.5 + Math.random() * 0.3, 4]} />
      <meshStandardMaterial color="#7CB342" />
    </mesh>
  );
}

// Starfish
function Starfish({ position, rotation = [0, 0, 0] }) {
  return (
    <group position={position} rotation={rotation}>
      {[0, 1, 2, 3, 4].map((i) => (
        <mesh 
          key={i} 
          position={[
            Math.cos((i / 5) * Math.PI * 2) * 0.06,
            0,
            Math.sin((i / 5) * Math.PI * 2) * 0.06
          ]}
          rotation={[Math.PI / 2, 0, (i / 5) * Math.PI * 2]}
        >
          <coneGeometry args={[0.02, 0.08, 4]} />
          <meshStandardMaterial color="#FF7043" />
        </mesh>
      ))}
      {/* Center */}
      <mesh position={[0, 0.01, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.02, 8]} />
        <meshStandardMaterial color="#FF5722" />
      </mesh>
    </group>
  );
}

// Coconut
function Coconut({ position }) {
  return (
    <mesh position={position}>
      <sphereGeometry args={[0.1, 16, 16]} />
      <meshStandardMaterial color="#5D4037" roughness={0.9} />
    </mesh>
  );
}

// Footprints in sand
function Footprints({ startPosition, direction = 1, count = 5 }) {
  return (
    <group>
      {[...Array(count)].map((_, i) => (
        <group 
          key={i}
          position={[
            startPosition[0] + (i % 2 === 0 ? 0.15 : -0.15) * direction,
            startPosition[1],
            startPosition[2] - i * 0.5
          ]}
          rotation={[-Math.PI / 2, 0, (i % 2 === 0 ? 0.1 : -0.1) * direction]}
        >
          {/* Foot shape */}
          <mesh>
            <capsuleGeometry args={[0.04, 0.08, 4, 8]} />
            <meshStandardMaterial color="#d4c4a8" />
          </mesh>
          {/* Toes */}
          {[0, 1, 2, 3, 4].map((t) => (
            <mesh 
              key={t} 
              position={[0.08, (t - 2) * 0.02, 0]}
            >
              <sphereGeometry args={[0.015 - t * 0.001, 6, 6]} />
              <meshStandardMaterial color="#d4c4a8" />
            </mesh>
          ))}
        </group>
      ))}
    </group>
  );
}
