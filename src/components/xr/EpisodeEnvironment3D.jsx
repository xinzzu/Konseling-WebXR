import React, { useEffect, useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Sky, Stars } from "@react-three/drei";
import * as THREE from "three";
import useGameStore from "../../store/useGameStore";
import { environmentForScene } from "../../services/episodeMeta";

/**
 * EpisodeEnvironment3D — Setting 3D PROSEDURAL per scene (auto-link, tanpa menu).
 *   ikhlas → Kauman malam        rendah-hati → Langgar Kidul sore
 *   berpikir-kritis → Masjid Gedhe malam   welas-asih → madrasah pagi
 *   toleransi → beranda senja              scene 9/10 → sekolah masa kini
 *
 * Ditingkatkan dibanding versi awal: langit gradasi (Sky/stars), fog untuk
 * kedalaman, tumpang roof masjid, lentera bergoyang, api-api, halaman
 * pekarangan, pohon & properti khas tiap setting. Tetap primitif ringan
 * (aman untuk Quest Browser / WebXR), tanpa file GLB eksternal.
 */

const ENV = {
  kauman: {
    night: true,
    sky: "#241a32",
    fog: "#241a32",
    ground: "#4a3a28",
    accent: "#ffcf7a",
    fogDensity: 0.042,
    label: "Kauman, 1915 — langgar",
  },
  "langgar-sore": {
    day: true,
    sunPosition: [-7, 2.5, -8],
    turbidity: 7,
    rayleigh: 3,
    fog: "#c37a4e",
    ground: "#5f4a34",
    accent: "#ffb066",
    fogDensity: 0.028,
    label: "Langgar Kidul, sore",
  },
  "masjid-malam": {
    night: true,
    sky: "#0b1233",
    fog: "#0b1233",
    ground: "#2b3550",
    accent: "#ffd27a",
    fogDensity: 0.04,
    label: "Masjid Gedhe, malam",
  },
  "madrasah-pagi": {
    day: true,
    sunPosition: [8, 11, -7],
    turbidity: 5,
    rayleigh: 2,
    fog: "#cfe0cf",
    ground: "#78865c",
    accent: "#7ec8ff",
    fogDensity: 0.026,
    label: "Madrasah diniyah, pagi",
  },
  beranda: {
    day: true,
    sunPosition: [-5, 4, -7],
    turbidity: 6,
    rayleigh: 2.4,
    fog: "#b98a6a",
    ground: "#6b5848",
    accent: "#ffd9a0",
    fogDensity: 0.026,
    label: "Beranda rumah Kiai, senja",
  },
  modern: {
    day: true,
    sunPosition: [6, 13, -8],
    turbidity: 4,
    rayleigh: 1.6,
    fog: "#b9cfe4",
    ground: "#96a2b0",
    accent: "#4fc3f7",
    fogDensity: 0.024,
    label: "Sekolah masa kini",
  },
};

export default function EpisodeEnvironment3D() {
  const selectedEpisode = useGameStore((s) => s.selectedEpisode);
  const sceneIndex = useGameStore((s) => s.sceneIndex);
  const epId = selectedEpisode?.id || "ikhlas";
  const scene = useThree((s) => s.scene);

  const envKey = useMemo(
    () => environmentForScene(epId, Math.max(1, sceneIndex)),
    [epId, sceneIndex]
  );
  const cfg = ENV[envKey] || ENV.kauman;

  // Fog per setting — kedalaman & suasana. Dihilangkan begitu keluar episode flow.
  useEffect(() => {
    const fog = new THREE.FogExp2(cfg.fog, cfg.fogDensity ?? 0.03);
    scene.fog = fog;
    return () => {
      scene.fog = null;
    };
  }, [envKey, scene, cfg.fog, cfg.fogDensity]);

  return (
    <group>
      {cfg.night ? <NightSky cfg={cfg} /> : <DaySky cfg={cfg} />}
      <Ground
        color={cfg.ground}
        courtyard={cfg.night ? "#55452f" : trim(cfg.ground, 22)}
        night={cfg.night}
      />
      <GroundDecor cfg={cfg} />
      <Structures env={envKey} cfg={cfg} />
      <Ambience env={envKey} cfg={cfg} />
    </group>
  );
}

function trim(hex, pct) {
  const c = new THREE.Color(hex);
  c.offsetHSL(0, 0, (pct - 10) / 100);
  return "#" + c.getHexString();
}

/* ---------- Langit ---------- */

function DaySky({ cfg }) {
  return (
    <>
      <Sky
        distance={450000}
        sunPosition={cfg.sunPosition}
        turbidity={cfg.turbidity}
        rayleigh={cfg.rayleigh}
        mieCoefficient={0.004}
        mieDirectionalG={0.82}
      />
      {/* Matahari (siluet lembut saat senja) */}
      <mesh position={[cfg.sunPosition[0] * 0.6, Math.max(2, cfg.sunPosition[1]), cfg.sunPosition[2] * 0.6]}>
        <sphereGeometry args={[1.6, 16, 16]} />
        <meshBasicMaterial color={cfg.accent} transparent opacity={0.85} fog={false} />
      </mesh>
      <hemisphereLight intensity={0.65} color="#fff2d8" groundColor="#3a2c1f" />
    </>
  );
}

function NightSky({ cfg }) {
  return (
    <>
      <mesh position={[0, 8, 0]}>
        <sphereGeometry args={[26, 24, 16]} />
        <meshBasicMaterial color={cfg.sky} side={THREE.BackSide} fog={false} />
      </mesh>
      <Stars radius={70} depth={40} count={1600} factor={4} saturation={0} fade speed={0.3} />
      {/* Bulan + cahaya bulan */}
      <mesh position={[-7, 9.5, -17]} fog={false}>
        <sphereGeometry args={[0.7, 20, 20]} />
        <meshBasicMaterial color="#e8ecf5" />
      </mesh>
      <mesh position={[-6.8, 9.55, -16.9]} fog={false}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshBasicMaterial color={cfg.sky} />
      </mesh>
      <directionalLight position={[-7, 9.5, -17]} intensity={0.5} color="#8ea2d8" />
    </>
  );
}

/* ---------- Tanah ---------- */

function Ground({ color, courtyard, night }) {
  return (
    <group>
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[32, 48]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
      {/* Pekarangan (halaman) */}
      <mesh position={[0, 0.001, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[8.5, 48]} />
        <meshStandardMaterial color={courtyard} roughness={1} />
      </mesh>
      {/* Jalan setapak menuju bangunan */}
      <mesh position={[0, 0.004, -6.5]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.6, 9]} />
        <meshStandardMaterial color={night ? "#3f3122" : trim(color, 2)} roughness={1} />
      </mesh>
      {/* Batu tepi halaman */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const a = (i / 6) * Math.PI * 2 + 0.26;
        return (
          <mesh key={i} position={[Math.cos(a) * 8.6, 0.02, Math.sin(a) * 8.6]} rotation={[0, -a, 0]}>
            <boxGeometry args={[1.2, 0.06, 0.5]} />
            <meshStandardMaterial color={night ? "#4e3f2d" : trim(color, -6)} roughness={1} />
          </mesh>
        );
      })}
    </group>
  );
}

/* ---------- Alat bantu sketsa ---------- */

function Box({ position, args, color, emissive }) {
  return (
    <mesh position={position}>
      <boxGeometry args={args} />
      <meshStandardMaterial
        color={color}
        emissive={emissive || "#000000"}
        emissiveIntensity={emissive ? 1 : 0}
        roughness={0.9}
      />
    </mesh>
  );
}

function Cyl({ position, args, color, emissive }) {
  return (
    <mesh position={position}>
      <cylinderGeometry args={args} />
      <meshStandardMaterial
        color={color}
        emissive={emissive || "#000000"}
        emissiveIntensity={emissive ? 1 : 0}
        roughness={0.85}
      />
    </mesh>
  );
}

function Glow({ position, color, size = 0.18 }) {
  return (
    <mesh position={position} fog={false}>
      <sphereGeometry args={[size, 10, 10]} />
      <meshBasicMaterial color={color} />
    </mesh>
  );
}

function TumpangRoof({ position, base, deep, dark, top }) {
  return (
    <group position={position}>
      <mesh position={[0, deep / 2, 0]}>
        <cylinderGeometry args={[base * 0.62, base, deep, 12]} />
        <meshStandardMaterial color={dark} roughness={0.8} />
      </mesh>
      <mesh position={[0, deep + deep * 0.35, 0]}>
        <cylinderGeometry args={[base * 0.4, base * 0.62, deep * 0.7, 12]} />
        <meshStandardMaterial color={dark} roughness={0.8} />
      </mesh>
      <mesh position={[0, deep + deep * 0.7 + deep * 0.2, 0]}>
        <coneGeometry args={[top, deep * 0.4, 10]} />
        <meshStandardMaterial color={dark} roughness={0.8} />
      </mesh>
    </group>
  );
}

function Tree({ position, scale = 1 }) {
  return (
    <group position={position} scale={scale}>
      <Cyl position={[0, 0.8, 0]} args={[0.18, 0.26, 1.6, 8]} color="#5a4632" />
      <mesh position={[0, 2.1, 0]}>
        <sphereGeometry args={[1.1, 10, 10]} />
        <meshStandardMaterial color="#3f5d32" roughness={1} />
      </mesh>
      <mesh position={[0.6, 1.9, 0.2]}>
        <sphereGeometry args={[0.7, 8, 8]} />
        <meshStandardMaterial color="#4a6b3a" roughness={1} />
      </mesh>
      <mesh position={[-0.6, 1.8, -0.2]}>
        <sphereGeometry args={[0.6, 8, 8]} />
        <meshStandardMaterial color="#36522b" roughness={1} />
      </mesh>
    </group>
  );
}

function HangingLanterns({ color = "#ffd27a", night = true }) {
  const count = 5;
  return (
    <group>
      {/* Tali */}
      <Box position={[0, 2.9, -5.2]} args={[7, 0.02, 0.02]} color="#2c1c10" />
      {Array.from({ length: count }, (_, i) => {
        const t = count === 1 ? 0 : i / (count - 1);
        const x = -3.2 + t * 6.4;
        const y = 2.9 - Math.sin(t * Math.PI) * 0.55;
        return (
          <group key={i} position={[x, y, -5.2]}>
            <Cyl position={[0, 0.02, 0]} args={[0.008, 0.008, 0.06, 6]} color="#2c1c10" />
            <mesh position={[0, -0.06, 0]}>
              <boxGeometry args={[0.06, 0.09, 0.06]} />
              <meshStandardMaterial color="#6b4a24" emissive={color} emissiveIntensity={night ? 1 : 0.25} />
            </mesh>
            <Glow position={[0, -0.075, 0]} color={color} size={night ? 0.09 : 0.05} />
          </group>
        );
      })}
    </group>
  );
}

function Fireflies({ count = 14, color = "#cfe8a0", area = 7 }) {
  const refs = useRef([]);
  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    refs.current.forEach((m, i) => {
      if (!m) return;
      m.position.y = 0.4 + Math.sin(t * 0.8 + i) * 0.45;
      m.position.x = Math.sin(t * 0.23 + i * 2.1) * area * 0.5;
      m.position.z = -2 + Math.cos(t * 0.19 + i * 1.7) * area;
      const flicker = 0.35 + 0.65 * Math.abs(Math.sin(t * 3 + i));
      m.scale.setScalar(flicker);
    });
  });
  return (
    <group>
      {Array.from({ length: count }, (_, i) => (
        <mesh key={i} ref={(el) => (refs.current[i] = el)} position={[0, 0.5, -2]} fog={false}>
          <sphereGeometry args={[0.045, 6, 6]} />
          <meshBasicMaterial color={color} transparent opacity={0.85} />
        </mesh>
      ))}
    </group>
  );
}

function PrayMats({ rows = 3, from = -2.2, step = 0.62, width = 1.1, color = "#b9a06b" }) {
  return (
    <group>
      {Array.from({ length: rows }, (_, i) =>
        Array.from({ length: 6 }, (_, j) => (
          <Box
            key={`${i}-${j}`}
            position={[-3.4 + j * 1.15, 0.02, from - i * step]}
            args={[width, 0.02, step * 0.6]}
            color={j % 2 === 0 ? color : "#a18a5a"}
          />
        ))
      )}
    </group>
  );
}

function PulsingLight({ position, color, base = 0.6, amp = 0.2, speed = 2 }) {
  const ref = useRef();
  useFrame(({ clock }) => {
    if (ref.current) ref.current.intensity = base + amp * Math.sin(clock.getElapsedTime() * speed);
  });
  return <pointLight ref={ref} position={position} color={color} distance={9} decay={1.6} />;
}

/* ---------- Pembangkit dekorasi deterministik ---------- */
/* Pseudo-random dari indeks — stabil antar render, tanpa Math.random di render. */

function settle(i) {
  const a = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return a - Math.floor(a);
}

/* ---------- Detail kecil yang mengisi halaman ---------- */

function Grass({ position, color = "#5d6b3a", scale = 1 }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} position={[(i - 1) * 0.07, 0.1, i * 0.05]} rotation={[0, 0, (i - 1) * 0.18]}>
          <coneGeometry args={[0.02, 0.2, 4]} />
          <meshStandardMaterial color={color} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function Stone({ position, color = "#7d7365", args = [0.22, 0.1, 0.18] }) {
  return (
    <mesh position={[position[0], position[1] + args[1] / 2, position[2]]} rotation={[0.15, 0.3, 0.08]}>
      <boxGeometry args={args} />
      <meshStandardMaterial color={color} roughness={1} />
    </mesh>
  );
}

function Bush({ position, scale = 1, color = "#3b542e" }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.22, 0]}>
        <sphereGeometry args={[0.36, 8, 8]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
      <mesh position={[0.29, 0.16, 0.06]}>
        <sphereGeometry args={[0.23, 8, 8]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
      <mesh position={[-0.27, 0.15, -0.05]}>
        <sphereGeometry args={[0.21, 8, 8]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
    </group>
  );
}

function LowFlower({ position, petal = "#e6735a" }) {
  return (
    <group position={position}>
      <Cyl position={[0, 0.07, 0]} args={[0.008, 0.014, 0.14, 5]} color="#4f6b3a" />
      <Glow position={[0, 0.15, 0]} color={petal} size={0.06} />
    </group>
  );
}

function KampungHouse({ position, rotationY = 0, color = "#7a5f45", dark = "#4c3928", lit = false, scale = 1 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]} scale={[scale, scale, scale]}>
      <Box position={[0, 0.95, 0]} args={[3, 1.9, 2.3]} color={color} />
      {/* Atap pelana (limas) */}
      <mesh position={[0, 1.9, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[2.15, 1.1, 4]} />
        <meshStandardMaterial color={dark} roughness={0.9} />
      </mesh>
      {/* Pintu */}
      <Box position={[0, 0.85, 1.17]} args={[0.95, 1.5, 0.1]} color="#3b2c1c" />
      {/* Jendela + cahaya (untuk malam) */}
      <Box position={[-0.85, 1.45, 1.18]} args={[0.42, 0.42, 0.08]} color="#2c1f14" />
      <Box position={[0.85, 1.45, 1.18]} args={[0.42, 0.42, 0.08]} color="#2c1f14" />
      {lit && <Glow position={[-0.85, 1.45, 1.2]} color="#ffd27a" size={0.16} />}
      {lit && <Glow position={[0.85, 1.45, 1.2]} color="#ffd27a" size={0.16} />}
    </group>
  );
}

function PalmTree({ position, scale = 1 }) {
  const leaves = [
    [0.9, 0.18],
    [-0.75, 0.4],
    [0.35, -0.95],
    [-0.4, -0.8],
    [0.15, 0.95],
  ];
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <Cyl position={[0, 1.2, 0]} args={[0.13, 0.22, 2.5, 7]} color="#6f5337" />
      {leaves.map(([dx, dz], i) => {
        const ang = Math.atan2(dz, dx);
        const tilt = 0.62;
        return (
          <group key={i} position={[0, 2.55, 0]} rotation={[Math.sin(ang) * tilt, ang, Math.cos(ang) * -tilt]}>
            <mesh position={[0.5, 0.05, 0]}>
              <coneGeometry args={[0.14, 1.05, 4]} />
              <meshStandardMaterial color="#3a5f3a" roughness={1} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function CagedBird({ position, scale = 1 }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <Cyl position={[0, 0.24, 0]} args={[0.004, 0.004, 0.24, 4]} color="#2c1c10" />
      <mesh position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.12, 0.12, 0.2, 10, 1, true]} />
        <meshBasicMaterial color="#caa567" transparent opacity={0.75} side={THREE.DoubleSide} />
      </mesh>
      <Cyl position={[0, -0.11, 0]} args={[0.12, 0.12, 0.02, 10]} color="#caa567" />
      <Glow position={[0, 0.02, 0]} color="#6b4a2a" size={0.06} />
    </group>
  );
}

function ClothesLine({ position, length = 3.2 }) {
  return (
    <group position={position}>
      <Box position={[0, 0, 0]} args={[length, 0.015, 0.015]} color="#2c1c10" />
      {[0, 1, 2, 3].map((i) => (
        <Box
          key={i}
          position={[-length / 2 + 0.55 + i * 0.75, -0.24, 0]}
          args={[0.3, 0.42, 0.025]}
          color={["#d8c9b4", "#a9c1d8", "#e6d9c2", "#c9a67a"][i]}
        />
      ))}
    </group>
  );
}

function Well({ position, scale = 1 }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <Cyl position={[0, 0.3, 0]} args={[0.42, 0.5, 0.6, 10]} color="#9a8a70" />
      <Cyl position={[0, 0.63, 0]} args={[0.5, 0.52, 0.06, 10]} color="#8a7a64" />
      <Cyl position={[0.66, 0.52, 0]} args={[0.05, 0.06, 0.95, 6]} color="#6b4a24" />
      <Cyl position={[-0.66, 0.52, 0]} args={[0.05, 0.06, 0.95, 6]} color="#6b4a24" />
      <TumpangRoof position={[0, 1.06, 0]} base={0.92} deep={0.36} dark="#4c3928" top={0.2} />
      <Cyl position={[0, 0.55, 0]} args={[0.012, 0.012, 0.5, 5]} color="#3a2a18" />
    </group>
  );
}

function KayuBakar({ position, rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <Box position={[0, 0.12, 0]} args={[0.9, 0.24, 0.75]} color="#6b4a24" />
      <Box position={[0, 0.27, 0.05]} args={[0.95, 0.24, 0.2]} color="#7a5630" />
      <Box position={[0.12, 0.42, 0.05]} args={[0.7, 0.2, 0.18]} color="#6b4a24" />
      <Cyl position={[0, 0.5, 0]} args={[0.02, 0.03, 0.5, 6]} color="#3a2a18" />
    </group>
  );
}

function Gentong({ position, scale = 1 }) {
  return (
    <group position={position} scale={[scale, scale, scale]}>
      <mesh position={[0, 0.28, 0]}>
        <cylinderGeometry args={[0.14, 0.11, 0.5, 8]} />
        <meshStandardMaterial color="#8a4f36" roughness={1} />
      </mesh>
      <Cyl position={[0, 0.54, 0]} args={[0.17, 0.17, 0.05, 8]} color="#7a452e" />
      <Glow position={[0, 0.1, 0]} color="#4a3a2c" size={0.09} />
    </group>
  );
}

function SandalRow({ position, n = 5, rotationY = 0 }) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} position={[i * 0.15 - n * 0.075, 0.02, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <boxGeometry args={[0.11, 0.025, 0.07]} />
          <meshStandardMaterial color="#3f2e1c" roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function RiceField({ over = -13, color = "#c9b87a", dry = "#b1a05e" }) {
  const cropRows = [];
  for (let i = 0; i < 9; i += 1) {
    for (let j = 0; j < 5; j += 1) {
      cropRows.push([-7 + i * 1.55 + settle(i * 9 + j) * 0.6, over + 2 - j * 3.2 + settle(i + j + 4) * 0.8]);
    }
  }
  return (
    <group>
      {/* Hamparan sawah */}
      <mesh position={[0, 0.004, over]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[42, 20]} />
        <meshStandardMaterial color={color} roughness={1} />
      </mesh>
      {/* Pematang */}
      {[0, 1, 2, 3, 4].map((j) => (
        <Box key={j} position={[-14, 0.012, over + 2 - j * 3.2]} args={[42, 0.02, 0.16]} color={dry} />
      ))}
      {/* Rumpun padi */}
      {cropRows.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.03, z]}>
          <coneGeometry args={[0.14, settle(i) * 0.35 + 0.25, 5]} />
          <meshStandardMaterial color={i % 3 === 0 ? "#a9a868" : "#bfb06a"} roughness={1} />
        </mesh>
      ))}
    </group>
  );
}

function GroundDecor({ cfg }) {
  const scrub = cfg.night ? "#2c3f26" : "#4a5f3a";
  return (
    <group>
      {/* Semak pembatas tepi halaman */}
      {Array.from({ length: 16 }, (_, i) => {
        const a = (i / 16) * Math.PI * 2;
        const r = 7.8 + settle(i + 21) * 1.7;
        return (
          <Bush
            key={i}
            position={[Math.cos(a) * r, 0, Math.sin(a) * r]}
            scale={0.65 + settle(i + 40) * 0.75}
            color={scrub}
          />
        );
      })}
      {/* Batu & rumput tersebar di halaman */}
      {Array.from({ length: 30 }, (_, i) => {
        const a = settle(i + 7) * Math.PI * 2;
        const r = 1.4 + settle(i + 13) * 6.6;
        const x = Math.cos(a) * r;
        const z = Math.sin(a) * r;
        return settle(i + 3) > 0.45 ? (
          <Stone
            key={i}
            position={[x, 0, z]}
            color={cfg.night ? "#4e4438" : "#8a8072"}
            args={[0.16 + settle(i) * 0.22, 0.06 + settle(i) * 0.08, 0.14 + settle(i) * 0.12]}
          />
        ) : (
          <Grass
            key={i}
            position={[x, 0, z]}
            color={cfg.night ? "#5c5536" : "#6b7a4a"}
            scale={0.75 + settle(i) * 0.7}
          />
        );
      })}
    </group>
  );
}

/* ---------- Bangunan tiap setting ---------- */

function Structures({ env, cfg }) {
  switch (env) {
    case "kauman":
      return <KaumanScene cfg={cfg} />;
    case "langgar-sore":
      return <LanggarSoreScene cfg={cfg} />;
    case "masjid-malam":
      return <MasjidScene cfg={cfg} />;
    case "madrasah-pagi":
      return <MadrasahScene cfg={cfg} />;
    case "beranda":
      return <BerandaScene cfg={cfg} />;
    case "modern":
    default:
      return <ModernScene cfg={cfg} />;
  }
}

const CREAM = "#e8dcc0";
const DARK = "#8a7a5c";
const WOOD = "#6b4a24";

function KaumanScene({ cfg }) {
  return (
    <group>
      {/* Langgar: dinding + tumpang roof */}
      <Box position={[-3.6, 1.3, -4.6]} args={[4.2, 2.6, 3.2]} color={CREAM} />
      <TumpangRoof position={[-3.6, 3.2, -4.6]} base={3.4} deep={0.8} dark="#4b3520" top={0.35} />
      {/* Pintu & cahaya dalam */}
      <Box position={[-3.6, 0.9, -3.05]} args={[1.1, 1.8, 0.15]} color="#3b2f1f" />
      <Glow position={[-3.6, 1.25, -2.98]} color="#ffd27a" size={0.32} />
      <PulsingLight position={[-3.6, 1.5, -2.8]} color="#ffcf7a" base={1.4} amp={0.3} />
      {/* Bianglala di jendela langgar */}
      <Glow position={[-2.2, 1.7, -3.0]} color="#ffcf7a" size={0.22} />
      <Glow position={[-5.0, 1.7, -3.0]} color="#ffcf7a" size={0.22} />

      {/* Gerbang Kauman */}
      <Cyl position={[-5.6, 1.4, -8]} args={[0.18, 0.24, 2.8, 8]} color={DARK} />
      <Cyl position={[-1.4, 1.4, -8]} args={[0.18, 0.24, 2.8, 8]} color={DARK} />
      <Box position={[-3.5, 2.9, -8]} args={[4.6, 0.35, 0.35]} color={DARK} />
      <Glow position={[-3.5, 2.55, -7.8]} color={cfg.accent} size={0.12} />
      {/* Pohon kelapa di pintu gerbang */}
      <PalmTree position={[-2.0, 0, -7.7]} scale={1.05} />
      <PalmTree position={[0.4, 0, -7.9]} scale={0.85} />

      {/* Pagar gang */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Cyl key={`p${i}`} position={[-1.3 + i * 2.2, 0.5, -3.4]} args={[0.05, 0.07, 1, 6]} color={WOOD} />
      ))}
      <Box position={[-1.3, 1.05, -3.4]} args={[11, 0.08, 0.06]} color={WOOD} />
      {/* Sentir kecil di pagar */}
      {[0, 2, 4].map((i) => (
        <Glow key={`s${i}`} position={[-1.3 + i * 2.2, 1.03, -3.38]} color="#ffcf7a" size={0.07} />
      ))}

      {/* Rumah-rumah kampung — jendela menyala (gang hidup) */}
      <KampungHouse position={[-6.9, 0, -4.5]} rotationY={0.42} lit color="#7a5f45" dark="#4c3928" />
      <KampungHouse position={[1.4, 0, -6.2]} rotationY={-0.35} lit color="#8a6a44" dark="#533d26" />
      <KampungHouse position={[-8.4, 0, -7.6]} rotationY={0.25} lit color="#6f5138" dark="#41301f" scale={0.92} />
      <KampungHouse position={[5.6, 0, -7.0]} rotationY={-0.25} color="#7a5f45" dark="#4c3928" scale={0.85} />

      <WoodFence />
      <LenteraLorong />

      {/* Kehidupan halaman langgar */}
      <Tree position={[2.6, 0, -3.2]} scale={1.1} />
      <Tree position={[-0.8, 0, -5.4]} scale={0.9} />
      <Well position={[3.5, 0, -5.1]} />
      <Gentong position={[-4.9, 0, -3.2]} />
      <KayuBakar position={[5.4, 0, -5.2]} rotationY={0.5} />
      <SandalRow position={[-3.6, 0, -3.0]} n={6} />
      <ClothesLine position={[5.1, 1.35, -4.6]} />
      {/* Burung di atap langgar */}
      {[[-4.1, 3.85, -4.7], [-3.3, 3.85, -4.5], [-2.7, 3.85, -4.8]].map((p, i) => (
        <Glow key={i} position={p} color="#2c2020" size={0.06} />
      ))}

      <PrayMats rows={2} from={-2.4} step={0.62} />
      <Fireflies count={12} color="#ffd9a0" />

      {/* Siluet masjid jauh */}
      <group position={[-8.5, 0, -15]} fog={false}>
        <Box position={[0, 1.2, 0]} args={[3.4, 2.4, 2.4]} color="#1d1426" />
        <mesh position={[0, 3.1, 0]}>
          <sphereGeometry args={[1.2, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshBasicMaterial color="#19101f" />
        </mesh>
        <Cyl position={[2.6, 2.4, 0]} args={[0.16, 0.2, 4.4, 8]} color="#1d1426" />
      </group>

      {/* Lentera jalan utama */}
      <PulsingLight position={[0, 2.2, 0.5]} color="#ffd9a0" base={0.5} amp={0.15} />
      <PulsingLight position={[0, 2.2, -4]} color="#ffcf7a" base={0.7} amp={0.25} />
      <PulsingLight position={[3.5, 1.3, -5.1]} color="#ffd27a" base={0.6} amp={0.18} />
      <PulsingLight position={[5.4, 1.2, -5.2]} color="#ffcf7a" base={0.5} amp={0.2} />
    </group>
  );
}

function WoodFence() {
  return (
    <group>
      {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
        <Cyl key={i} position={[-5.6 + i * 1.6, 0.45, -2.6]} args={[0.05, 0.06, 0.9, 6]} color={WOOD} />
      ))}
      <Box position={[-5.6, 0.95, -2.6]} args={[11.5, 0.06, 0.05]} color={WOOD} />
    </group>
  );
}

function LenteraLorong() {
  return (
    <group>
      <Box position={[2.2, 2.9, -0.6]} args={[7, 0.02, 0.02]} color="#2c1c10" />
      {[0, 1, 2].map((i) => (
        <group key={i} position={[2.5 + i * 1.9, 2.72, -0.6]}>
          <Glow position={[0, -0.06, 0]} color="#ffd27a" size={0.07} />
        </group>
      ))}
    </group>
  );
}

function LanggarSoreScene({ cfg }) {
  return (
    <group>
      {/* Langgar sore — jendela copot, serambi luas */}
      <Box position={[-3.4, 1.2, -5]} args={[4, 2.4, 3.2]} color="#e2d2ae" />
      <TumpangRoof position={[-3.4, 3.0, -5]} base={3.2} deep={0.7} dark="#5a3e22" top={0.32} />
      {/* Serambi (tampak sepi — satu santri belum datang) */}
      <Box position={[-5.6, 0.12, -4.4]} args={[0.5, 0.24, 2.8]} color="#8a6a44" />
      <Cyl position={[-5.6, 0.9, -4.4]} args={[0.07, 0.09, 1.5, 6]} color={DARK} />
      {/* Sajadah di serambi */}
      <Box position={[-5.4, 0.16, -4.4]} args={[0.42, 0.03, 0.5]} color="#c9a67a" />
      /* Pohon rindang */}
      <Tree position={[2.6, 0, -3.6]} scale={1.35} />
      <Tree position={[0.6, 0, -5.9]} scale={0.95} />
      <PalmTree position={[-1.2, 0, -7.6]} scale={0.9} />
      {/* Sumur dahulu & gentong */}
      <Well position={[3.6, 0, -6.2]} />
      <Gentong position={[-5.2, 0, -3.6]} scale={0.9} />

      {/* Rumah kampung berjajar masuk gang sore */}
      <KampungHouse position={[1.8, 0, -6.6]} rotationY={-0.2} color="#ad9268" dark="#4c3928" />
      <KampungHouse position={[6.2, 0, -5.2]} rotationY={-0.18} color="#bfa276" dark="#533d26" />
      <KampungHouse position={[-6.6, 0, -6.2]} rotationY={0.35} color="#a08a62" dark="#4c3928" scale={0.95} />
      <KampungHouse position={[3.4, 0, -8.6]} rotationY={-0.3} color="#8a7552" dark="#41301f" scale={0.9} />
      <KampungHouse position={[-5.4, 0, -9.4]} rotationY={0.15} color="#9a8460" dark="#453320" scale={0.8} />
      {/* Jemuran di samping rumah */}
      <ClothesLine position={[5.2, 1.2, -5.3]} />
      {/* Sandal santri di serambi */}
      <SandalRow position={[-5.4, 0, -4.05]} n={4} rotationY={Math.PI / 2} />
      {/* Kebun sayur */}
      {[[-6.8, 0.04, -3.6], [-6.55, 0.04, -3.2], [-7.05, 0.04, -3.1], [-6.35, 0.04, -3.7]].map((p, i) => (
        <Glow key={i} position={p} color={["#6f7f45", "#7d8a4e", "#687839", "#7d8a4e"][i]} size={0.08} />
      ))}

      {/* Asap mengepul tipis */}
      <Cyl position={[4.8, 1.6, -5.4]} args={[0.08, 0.02, 0.9, 6]} color="#6b5a48" transparent opacity={0.4} />
      {/* Burung di atap */}
      {[[-3.8, 3.6, -5.2], [-3.2, 3.6, -4.8], [-2.6, 3.6, -5.4], [1.8, 2.5, -6.4]].map((p, i) => (
        <Glow key={i} position={p} color="#3a2e22" size={0.07} />
      ))}

      {/* Sawah menghijau di kejauhan */}
      <RiceField over={-13} color="#cdb97e" dry="#b09a57" />
      <PrayMats rows={2} from={-2.6} step={0.66} color="#c9a67a" />
      <Fireflies count={8} color="#ffd9a0" />
      <PulsingLight position={[-3.4, 1.6, -3.6]} color="#ffb066" base={1.2} amp={0.2} />
    </group>
  );
}

function MasjidScene({ cfg }) {
  return (
    <group>
      {/* Masjid Gedhe: bangun, kubah, menara */}
      <Box position={[-2.8, 1.5, -6]} args={[6, 3, 4.5]} color="#cdc2a4" />
      <TumpangRoof position={[-2.8, 3.6, -6]} base={3.6} deep={0.9} dark="#3f2f18" top={0.5} />
      {/* Kubah + mustaka */}
      <mesh position={[-2.8, 4.5, -6]}>
        <sphereGeometry args={[0.85, 18, 14, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#5d563f" roughness={0.5} metalness={0.4} />
      </mesh>
      <Cyl position={[-2.8, 5.15, -6]} args={[0.06, 0.1, 0.55, 6]} color="#3f3522" />
      {/* Dua menara */}
      {[[-5.6, 3.1, -6.4], [0.6, 3.2, -6.2]].map((p, i) => (
        <group key={i} position={p}>
          <Cyl position={[0, 1.6, 0]} args={[0.26, 0.36, 3.6, 10]} color="#b7ab8a" />
          <Box position={[0, 3.5, 0]} args={[0.8, 0.18, 0.8]} color="#8f8466" />
          <Glow position={[0, 3.52, 0]} color="#ffd27a" size={0.09} />
        </group>
      ))}
      {/* Jendela & pintu menerangi malam */}
      {[0, 1, 2, 3].map((i) => (
        <Glow key={i} position={[-4.2 + i * 1.05, 2.0, -3.8]} color="#ffd27a" size={0.22} />
      ))}
      <Glow position={[-2.8, 1.0, -3.75]} color="#ffd27a" size={0.5} />
      <PulsingLight position={[-2.8, 2.4, -3.6]} color="#ffd27a" base={1.6} amp={0.4} />
      {/* Lilin-lilin kecil sepanjang dinding */}
      {[[-4.6, 0.12, -3.7], [-3.9, 0.12, -3.7], [-3.1, 0.12, -3.7], [-2.5, 0.12, -3.7], [1.4, 0.12, -3.7], [2.2, 0.12, -3.7], [3.0, 0.12, -3.7]].map((p, i) => (
        <Glow key={`c${i}`} position={p} color="#ffd27a" size={0.05} />
      ))}
      {/* Halaman — sajadah panjang */}
      <PrayMats rows={4} from={-2.4} step={0.72} width={1.3} color="#bfa977" />
      {/* Kolam wudhu */}
      <group position={[-5.0, 0, -4.2]}>
        <Cyl position={[0, 0.1, 0]} args={[0.8, 0.92, 0.2, 12]} color="#a99c82" />
        <Cyl position={[0, 0.1, 0]} args={[0.62, 0.62, 0.035, 12]} color="#7fb8d4" transparent opacity={0.9} />
        <Cyl position={[0, 0.22, 0]} args={[0.18, 0.22, 0.16, 10]} color="#8a7f68" />
        <Glow position={[0, 0.32, 0]} color="#bcdce8" size={0.06} />
      </group>
      {/* Gerbang gapura sisi timur + pagar lampu */}
      {[0, 1, 2, 3, 4, 5, 6].map((i) => (
        <group key={i}>
          <Cyl position={[-4.6 + i * 1.5, 0.5, -1.6]} args={[0.04, 0.05, 1, 6]} color="#72664a" />
          {i % 2 === 0 && <Glow position={[-4.6 + i * 1.5, 1.05, -1.58]} color="#ffd27a" size={0.06} />}
        </group>
      ))}
      <Box position={[-7.3, 0.9, -1.6]} args={[0.3, 1.8, 0.16]} color="#5d563f" />
      <Box position={[-7.3, 1.85, -1.6]} args={[2.4, 0.22, 0.16]} color="#4c4633" />
      <Glow position={[-7.3, 1.9, -1.58]} color="#ffd27a" size={0.1} />
      <Box position={[2.2, 0.62, -1.6]} args={[0.3, 1.2, 0.14]} color="#5d563f" />
      <Glow position={[2.2, 1.3, -1.6]} color="#ffd27a" size={0.11} />
      {/* Pohon di halaman masjid */}
      <Tree position={[-5.6, 0, -3.0]} scale={0.9} />
      <Tree position={[4.4, 0, -3]} scale={0.9} />
      <Tree position={[5.4, 0, -5.4]} scale={1.1} />
      <PalmTree position={[-3.2, 0, -8.6]} scale={0.85} />
      <PalmTree position={[-1.4, 0, -9.0]} scale={0.95} />
      {/* Burung di puncak menara */}
      <Glow position={[-5.55, 4.4, -6.35]} color="#22201c" size={0.07} />
      <Glow position={[-5.68, 4.35, -6.4]} color="#22201c" size={0.06} />
      {/* Siluet kota Kauman jauh — lampu-lampu kecil */}
      <group position={[8.5, 0, -15]} fog={false}>
        <Box position={[0, 1.1, 0]} args={[3, 2.2, 2]} color="#131024" />
        <Box position={[3.6, 0.8, 0.4]} args={[2.4, 1.6, 1.6]} color="#161229" />
        <mesh position={[0, 2.4, 0]}>
          <sphereGeometry args={[0.8, 12, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshBasicMaterial color="#110f1c" />
        </mesh>
        <Glow position={[-1.1, 1.6, 1.05]} color="#ffd27a" size={0.06} />
        <Glow position={[-0.6, 1.3, 1.05]} color="#ffcf8a" size={0.05} />
        <Glow position={[3.3, 1.1, 1.22]} color="#ffd9a0" size={0.05} />
        <Glow position={[4.2, 1.5, 1.22]} color="#ffcf8a" size={0.05} />
      </group>
      <Fireflies count={10} color="#ffd27a" />
      <PulsingLight position={[0, 2, 0]} color="#ffd9a0" base={0.45} amp={0.12} />
    </group>
  );
}

function MadrasahScene({ cfg }) {
  return (
    <group>
      {/* Ruang madrasah sederhana + tumpang roof tipis */}
      <Box position={[-3, 1.2, -5]} args={[5, 2.4, 3.4]} color="#e8dab8" />
      <TumpangRoof position={[-3, 3.1, -5]} base={3.4} deep={0.7} dark="#6b4a24" top={0.38} />
      <Box position={[-3, 1.1, -3.32]} args={[1.5, 2.2, 0.12]} color="#4a3a26" />
      {/* Meja-kursi anak-anak + kitab & tas */}
      {[0, 1, 2].map((i) => (
        <group key={i} position={[-3.9 + i * 2.1, 0, -3.6]}>
          <Box position={[0, 0.42, 0]} args={[1.2, 0.06, 0.8]} color={WOOD} />
          <Cyl position={[-0.5, 0.21, 0.3]} args={[0.03, 0.04, 0.42, 6]} color="#4a3320" />
          <Cyl position={[0.5, 0.21, -0.3]} args={[0.03, 0.04, 0.42, 6]} color="#4a3320" />
          {/* Kitab kecil di meja */}
          <Box position={[-0.3, 0.46, -0.1]} args={[0.18, 0.03, 0.25]} color="#c9a25c" />
          <Box position={[0.25, 0.46, 0.05]} args={[0.16, 0.03, 0.22]} color="#a8803f" />
          {/* Tas gantung di sisi meja */}
          <Box position={[0.52, 0.36, 0]} args={[0.09, 0.14, 0.06]} color={i % 2 === 0 ? "#8a3b2a" : "#3a4a6a"} />
        </group>
      ))}
      {/* Meja guru + papan tulis */}
      <Box position={[-4.6, 0.4, -4.6]} args={[1.0, 0.06, 0.6]} color={WOOD} />
      <Cyl position={[-4.2, 0.21, -4.6]} args={[0.03, 0.04, 0.42, 6]} color="#4a3320" />
      <Cyl position={[-5.0, 0.21, -4.6]} args={[0.03, 0.04, 0.42, 6]} color="#4a3320" />
      <Box position={[-4.6, 1.1, -4.95]} args={[1.3, 1.1, 0.05]} color="#3b4a3a" />
      <Box position={[-4.92, 1.6, -4.95]} args={[0.3, 0.05, 0.02]} color="#e8dcc0" />
      <Box position={[-4.28, 1.0, -4.95]} args={[0.28, 0.05, 0.02]} color="#e8dcc0" />
      {/* Sandal anak-anak di pintu */}
      <SandalRow position={[-3.8, 0, -3.28]} n={8} rotationY={0} />
      {/* Tiang bendera */}
      <Cyl position={[2.4, 2.1, -6.4]} args={[0.05, 0.07, 4.2, 8]} color="#8b8b8b" />
      <Box position={[2.47, 3.7, -6.4]} args={[0.55, 0.32, 0.03]} color="#c0392b" />
      <Box position={[2.47, 3.94, -6.4]} args={[0.55, 0.18, 0.03]} color="#f5f5f5" />
      {/* Taman bunga sederhana + semak */}
      {[[-4.6, 0.06, -3.2], [-4.2, 0.06, -3.4], [0.4, 0.06, -3.3], [0.8, 0.06, -3.4]].map((p, i) => (
        <Glow key={i} position={p} color={["#e67e22", "#d35400", "#f6b93b", "#e67e22"][i]} size={0.09} />
      ))}
      {[[0.05, -3.1], [1.2, -3.2], [-5.3, -3.0], [5.6, -3.4]].map(([x, z], i) => (
        <LowFlower key={`f${i}`} position={[x, 0, z]} petal={["#e91e63", "#f6b93b", "#9ccc65", "#e91e63"][i]} />
      ))}
      <Bush position={[-5.4, 0, -3.6]} scale={0.9} color="#5f7a3d" />
      <Bush position={[5.2, 0, -2.9]} scale={1.1} color="#5f7a3d" />
      {/* Kentongan — papan kayu + pemukul */}
      <Cyl position={[-0.6, 1.05, -5.4]} args={[0.03, 0.03, 1.6, 8]} color="#6b4a24" />
      <Cyl position={[-0.98, 0.5, -5.4]} args={[0.06, 0.09, 0.5, 8]} color="#4c341f" />
      <Cyl position={[-0.72, 0.8, -5.4]} args={[0.02, 0.03, 0.6, 6]} color="#3a2a18" />
      <Tree position={[1.4, 0, -2.8]} scale={0.8} />
      <Tree position={[4.6, 0, -4.6]} scale={1} />
      <PalmTree position={[3.4, 0, -7.4]} scale={0.85} />
      {/* Cahaya pagi dari celah pintu */}
      <PulsingLight position={[-3, 1.4, -3.1]} color="#fff2c9" base={0.9} amp={0.15} />
    </group>
  );
}

function BerandaScene({ cfg }) {
  return (
    <group>
      {/* Rumah Kiai + beranda kayu */}
      <Box position={[-2.6, 1.1, -5]} args={[5, 2.2, 3.4]} color="#d8c7a4" />
      <TumpangRoof position={[-2.6, 2.9, -5]} base={3.4} deep={0.9} dark="#4a3320" top={0.42} />
      {/* Beranda: lantai tinggi */}
      <Box position={[-2.6, 0.4, -4]} args={[4.6, 0.8, 3.4]} color="#7a5a3c" />
      {/* Tiang-tiang */}
      {[0, 1, 2, 3].map((i) => (
        <Cyl key={i} position={[-4.3 + i * 2.1, 2.0, -5.4]} args={[0.1, 0.12, 2.6, 8]} color="#8a6a44" />
      ))}
      {/* Atap beranda */}
      <Box position={[-2.6, 3.3, -4]} args={[5.4, 0.22, 3.6]} color="#4a3320" />
      {/* Pintu rumah + lampu pendinggul */}
      <Box position={[-2.6, 1.0, -3.32]} args={[1.2, 1.9, 0.1]} color="#3b2c1c" />
      <Glow position={[-2.6, 1.6, -3.25]} color="#ffd9a0" size={0.3} />
      <PulsingLight position={[-2.6, 2.1, -3.2]} color="#ffd9a0" base={1.1} amp={0.25} />
      {/* Meja tamu & dua kursi + perangkat teh */}
      <Box position={[-2.6, 0.55, -3.1]} args={[1.2, 0.08, 0.7]} color={WOOD} />
      <Box position={[-3.3, 0.35, -3.2]} args={[0.4, 0.55, 0.4]} color="#4d3a24" />
      <Box position={[-1.9, 0.35, -3.2]} args={[0.4, 0.55, 0.4]} color="#4d3a24" />
      <Cyl position={[-2.82, 0.65, -3.15]} args={[0.055, 0.075, 0.14, 8]} color="#8a5a34" />
      <Cyl position={[-2.36, 0.64, -3.06]} args={[0.045, 0.05, 0.06, 8]} color="#e8dcc0" />
      <Cyl position={[-3.36, 0.66, -3.28]} args={[0.05, 0.07, 0.12, 8]} color="#8a5a34" />
      <Glow position={[-2.82, 0.76, -3.15]} color="#ffd9a0" size={0.045} />
      {/* Kain panjang digantung di birai */}
      <Box position={[-4.15, 0.42, -2.78]} args={[0.05, 0.84, 0.5]} color="#b0713e" />
      <Box position={[-4.18, 0.42, -2.8]} args={[0.03, 0.6, 0.4]} color="#c9a67a" />
      {/* Burung perkutut tergantung */}
      <CagedBird position={[-4.7, 2.7, -4.5]} scale={0.9} />
      {/* Hio mengepul di pelataran */}
      <Glow position={[-4.3, 0.4, -3.9]} color="#e85d3a" size={0.05} />
      <Cyl position={[-4.38, 0.75, -4.14]} args={[0.03, 0.012, 0.8, 6]} color="#b9a9a0" transparent opacity={0.35} />
      {/* Tanaman hias */}
      {[[-4.6, 0.16, -2.9], [-0.6, 0.16, -2.9], [-4.6, 0.16, -3.6], [-1.1, 0.16, -3.5], [0.8, 0.16, -3.7]].map((p, i) => (
        <group key={i} position={p}>
          <Cyl position={[0, 0.1, 0]} args={[0.08, 0.11, 0.28, 6]} color="#6b4f2a" />
          <Glow position={[0, 0.3, 0]} color="#c94f4f" size={0.12} />
          <Glow position={[0.08, 0.28, 0.03]} color="#e67e22" size={0.09} />
        </group>
      ))}
      <Bush position={[-5.0, 0, -2.1]} scale={1.1} color="#4d6340" />
      <Bush position={[-5.0, 0, -3.6]} scale={0.9} color="#4d6340" />

      {/* Tali lentera merentang di pelataran */}
      <Box position={[-2.4, 2.9, -2.0]} args={[5.4, 0.02, 0.02]} color="#2c1c10" />
      <Cyl position={[-5.0, 1.35, -2.0]} args={[0.06, 0.08, 2.7, 8]} color={WOOD} />
      <Cyl position={[0.2, 1.35, -2.0]} args={[0.06, 0.08, 2.7, 8]} color={WOOD} />
      {[-3.7, -2.4, -1.1].map((x, i) => (
        <group key={`ln${i}`} position={[x, 2.78, -2.0]}>
          <Cyl position={[0, 0.03, 0]} args={[0.007, 0.007, 0.06, 5]} color="#2c1c10" />
          <Glow position={[0, -0.05, 0]} color="#ffd9a0" size={i % 2 ? 0.09 : 0.06} />
          <PulsingLight position={[x, 1.9, -2.0]} color="#ffd9a0" base={0.35} amp={0.14} />
        </group>
      ))}

      <Tree position={[3.8, 0, -2.4]} scale={0.9} />
      <Tree position={[-5.3, 0, -5.0]} scale={1.05} />
      <PalmTree position={[2.2, 0, -6.9]} scale={0.8} />
      <Fireflies count={9} color="#ffd9a0" />
    </group>
  );
}

function ModernScene({ cfg }) {
  return (
    <group>
      {/* Gedung sekolah */}
      <Box position={[-3, 2.2, -5.6]} args={[7, 4.4, 3.4]} color="#cfd8dc" />
      {/* Jendela kaca */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Box key={i} position={[-4.5 + i * 1.15, 3.3, -3.95]} args={[0.7, 1.1, 0.08]} emissive="#b3e5fc" />
      ))}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <Box key={`b${i}`} position={[-4.5 + i * 1.15, 1.5, -3.95]} args={[0.7, 1.1, 0.08]} emissive="#cde7f5" />
      ))}
      {/* Pintu masuk + anak tangga */}
      <Box position={[-3, 0.7, -3.95]} args={[1.6, 1.4, 0.1]} color="#5d7f8f" />
      <Box position={[-3, -0.03, -4.1]} args={[3.4, 0.12, 1.2]} color="#9aa4ae" />
      <Box position={[-3, -0.03, -4.55]} args={[3.8, 0.12, 0.9]} color="#a7b0b8" />
      {/* Papan nama sekolah */}
      <Box position={[-0.4, 4.55, -3.95]} args={[2.6, 0.5, 0.06]} color={cfg.accent} />
      {/* Tiang bendera + bendera */}
      <Cyl position={[3, 2.5, -7]} args={[0.06, 0.08, 5, 8]} color="#8b8b8b" />
      <Box position={[3.08, 4.1, -7]} args={[0.7, 0.4, 0.03]} color="#c0392b" />
      <Box position={[3.08, 4.35, -7]} args={[0.7, 0.2, 0.03]} color="#f5f5f5" />
      {/* Halaman sekolah */}
      <PrayMats rows={1} from={-2.8} step={0} width={1} color="#a7b0b8" />
      {[[-2.4, 0.06, -3.1], [-1.6, 0.06, -2.9], [-0.8, 0.06, -3.1], [0.3, 0.06, -2.9]].map((p, i) => (
        <Glow key={i} position={p} color="#66bb6a" size={0.1} />
      ))}
      {[[-4.8, -2.9], [-5.3, -3.1], [1.6, -2.8], [2.2, -3.0]].map(([x, z], i) => (
        <LowFlower key={`f${i}`} position={[x, 0, z]} petal={["#ef6c4b", "#ef6c4b", "#e67e22", "#e67e22"][i]} />
      ))}
      {/* Bangku taman */}
      {[[-1.2, -1.6], [2.6, -1.6]].map(([x, z], i) => (
        <group key={`bn${i}`} position={[x, 0, z]} rotation={[0, 0.35, 0]}>
          <Box position={[0, 0.34, 0]} args={[1.5, 0.12, 0.5]} color="#8a6a44" />
          <Box position={[-0.6, 0.16, 0]} args={[0.12, 0.34, 0.5]} color="#4a5560" />
          <Box position={[0.6, 0.16, 0]} args={[0.12, 0.34, 0.5]} color="#4a5560" />
        </group>
      ))}
      {/* Tempat sampah */}
      <Cyl position={[-4.0, 0.32, -1.7]} args={[0.22, 0.18, 0.64, 10]} color="#7a8b5a" />
      <Cyl position={[3.4, 0.32, -1.7]} args={[0.2, 0.16, 0.58, 10]} color="#7a8b5a" />
      {/* Lapangan basket + bola */}
      <Cyl position={[1.0, 1.5, -2.1]} args={[0.05, 0.06, 3, 8]} color="#8b8b8b" />
      <Box position={[1.0, 2.8, -2.45]} args={[1.2, 0.85, 0.05]} color="#dde4eb" />
      <Box position={[1.0, 2.5, -2.46]} args={[0.15, 0.5, 0.02]} color="#c0392b" />
      <mesh position={[1.0, 2.42, -2.52]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.14, 0.02, 8, 18]} />
        <meshStandardMaterial color="#e05b3b" roughness={0.4} />
      </mesh>
      <Glow position={[1.42, 0.12, -2.3]} color="#e88a3a" size={0.13} />
      {/* Sepeda santai diparkir */}
      <group position={[-4.7, 0, -2.7]} rotation={[0, -0.4, 0]}>
        <mesh position={[0, 0.36, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.34, 0.028, 8, 18]} />
          <meshStandardMaterial color="#2f353c" roughness={0.6} />
        </mesh>
        <mesh position={[0.72, 0.36, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.34, 0.028, 8, 18]} />
          <meshStandardMaterial color="#2f353c" roughness={0.6} />
        </mesh>
        <Cyl position={[0.36, 0.68, 0]} args={[0.02, 0.025, 0.66, 6]} color="#3a6a8a" />
        <Cyl position={[0.22, 0.95, 0.1]} args={[0.016, 0.016, 0.35, 6]} color="#3a6a8a" />
        <Cyl position={[0.08, 0.5, 0.06]} args={[0.016, 0.016, 0.62, 6]} color="#3a6a8a" />
      </group>
      {/* Gerbang + papan nama */}
      <Cyl position={[-6.5, 1.1, -1.3]} args={[0.09, 0.11, 2.2, 8]} color="#8a8f96" />
      <Box position={[-6.5, 2.1, -1.3]} args={[2.0, 0.4, 0.08]} color={cfg.accent} />
      <Box position={[-6.5, 2.34, -1.3]} args={[2.0, 0.1, 0.08]} color="#5d7f8f" />
      <Tree position={[4.4, 0, -3]} scale={1} />
      <Tree position={[4.8, 0, -4.8]} scale={0.8} />
      <Tree position={[-5.8, 0, -4.6]} scale={0.95} />
      <PalmTree position={[5.9, 0, -6.9]} scale={0.85} />
      <Box position={[5.6, 0.5, -6]} args={[1.6, 1, 0.9]} color="#c9c9c9" />
    </group>
  );
}

/* ---------- Suasana tambahan ---------- */

function Ambience({ env, cfg }) {
  const warm =
    env === "kauman" || env === "masjid-malam" || env === "beranda" || env === "langgar-sore";
  return (
    <group>
      {/* Cahaya pemain (di sekitar panel) */}
      <ambientLight intensity={cfg.night ? 0.25 : 0.5} />
      {warm && <PulsingLight position={[0, 2.4, 0.6]} color="#ffd9a0" base={0.5} amp={0.12} />}
    </group>
  );
}