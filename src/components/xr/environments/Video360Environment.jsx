import React, { useRef, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { VIDEO_SRC } from "../../../services/video360Prefetch";

// Singleton video + texture per-src — tahan StrictMode double-mount, tanpa
// suspend (useVideoTexture pakai suspend-react yang bikin scene blank saat
// fallback null). Di-keyed by src supaya beberapa video 360 bisa hidup
// berdampingan (masing-masing environment punya video sendiri).
const videoCache = new Map();
const textureCache = new Map();

function getVideo(src) {
  if (videoCache.has(src)) return videoCache.get(src);
  const video = document.createElement("video");
  video.loop = true;
  video.muted = true;
  video.defaultMuted = true;
  video.playsInline = true;
  video.preload = "auto";
  video.setAttribute("muted", "");
  video.setAttribute("playsinline", "");
  video.src = src;
  video.load();
  video.style.cssText = "position:fixed;width:1px;height:1px;opacity:0;pointer-events:none";
  document.body.appendChild(video);
  video.play().catch(() => {});
  const retry = () => video.play().catch(() => {});
  window.addEventListener("pointerdown", retry, { once: true });
  window.addEventListener("keydown", retry, { once: true });
  videoCache.set(src, video);
  return video;
}

function getTexture(src) {
  if (textureCache.has(src)) return textureCache.get(src);
  const texture = new THREE.VideoTexture(getVideo(src));
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  textureCache.set(src, texture);
  return texture;
}

export default function Video360Environment({ src = VIDEO_SRC }) {
  const textureRef = useRef(null);
  const videoRef = useRef(null);
  const srcRef = useRef(null);

  if (srcRef.current !== src) {
    srcRef.current = src;
    textureRef.current = getTexture(src);
    videoRef.current = videoCache.get(src);
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
