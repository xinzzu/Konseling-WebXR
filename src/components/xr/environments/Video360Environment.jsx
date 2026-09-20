import React, { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { VIDEO_SRC } from "../../../services/video360Prefetch";

// Singleton video + texture — tahan StrictMode double-mount, tanpa suspend
// (useVideoTexture pakai suspend-react yang membuat scene blank saat fallback null).
let _video = null;
let _texture = null;

function getVideo() {
  if (_video) return _video;
  _video = document.createElement("video");
  _video.loop = true;
  _video.muted = true;
  _video.defaultMuted = true;
  _video.playsInline = true;
  _video.preload = "auto";
  _video.setAttribute("muted", "");
  _video.setAttribute("playsinline", "");
  _video.src = VIDEO_SRC;
  _video.load();
  _video.style.cssText = "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none";
  document.body.appendChild(_video);
  _video.play().catch(() => {});
  const retry = () => _video.play().catch(() => {});
  window.addEventListener("pointerdown", retry, { once: true });
  window.addEventListener("keydown", retry, { once: true });
  return _video;
}

function getTexture() {
  if (_texture) return _texture;
  _texture = new THREE.VideoTexture(getVideo());
  _texture.colorSpace = THREE.SRGBColorSpace;
  _texture.minFilter = THREE.LinearFilter;
  _texture.magFilter = THREE.LinearFilter;
  _texture.generateMipmaps = false;
  return _texture;
}

export default function Video360Environment() {
  const textureRef = useRef(null);
  const videoRef = useRef(null);

  if (!textureRef.current) {
    textureRef.current = getTexture();
    videoRef.current = _video;
  }

  const texture = textureRef.current;
  const video = videoRef.current;

  useFrame(() => {
    if (video && video.readyState >= 3) {
      texture.needsUpdate = true;
    }
  });

  useEffect(() => {
    const v = video;
    if (!v) return;
    const onCanPlay = () => { v.play().catch(() => {}); };
    v.addEventListener("canplay", onCanPlay);
    v.addEventListener("loadedmetadata", onCanPlay);
    return () => {
      v.removeEventListener("canplay", onCanPlay);
      v.removeEventListener("loadedmetadata", onCanPlay);
    };
  }, [video]);

  return (
    <group>
      <mesh frustumCulled={false} renderOrder={-1}>
        <sphereGeometry args={[50, 60, 40]} />
        <meshBasicMaterial
          map={texture}
          side={THREE.BackSide}
          toneMapped={false}
          depthWrite={false}
        />
      </mesh>

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
        <planeGeometry args={[100, 100]} />
        <meshStandardMaterial color="#1a1a2e" roughness={1} transparent opacity={0.3} />
      </mesh>

      <directionalLight position={[50, 30, 50]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} />
      <ambientLight intensity={0.6} color="#fff5e6" />
    </group>
  );
}
