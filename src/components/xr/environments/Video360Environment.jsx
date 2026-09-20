import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { VIDEO_SRC } from "../../../services/video360Prefetch";

/**
 * Video360Environment - background 360° dari video equirectangular
 * Video di-map ke bagian dalam sphere besar (BackSide) yang mengelilingi user.
 *
 * Video di-load lazy (baru fetch saat komponen ini mount, yaitu saat user
 * memilih environment ini) — lihat services/video360Prefetch.js untuk
 * prefetch opsional saat user berada di layar pilih environment.
 */
export default function Video360Environment() {
  const [videoEl, setVideoEl] = useState(null);
  const [isReady, setIsReady] = useState(false);
  const textureRef = useRef(null);

  useEffect(() => {
    const video = document.createElement("video");
    // Video same-origin (dari public/), crossOrigin tidak diperlukan dan
    // di beberapa setup dev server justru bikin request diperlakukan sebagai
    // CORS request yang gagal diam-diam (video tidak pernah "canplay").
    video.loop = true;
    video.muted = true; // wajib untuk autoplay di browser/headset
    video.playsInline = true;
    video.preload = "auto";
    // Sembunyikan tapi tetap attach ke DOM — beberapa browser tidak reliable
    // memicu event loading (canplay/loadeddata) untuk <video> yang lepas dari DOM.
    video.style.position = "fixed";
    video.style.width = "1px";
    video.style.height = "1px";
    video.style.opacity = "0";
    video.style.pointerEvents = "none";
    document.body.appendChild(video);

    const handleReady = () => setIsReady(true);
    const handleError = () => {
      console.error("Video360Environment: gagal load video.", video.error);
    };
    video.addEventListener("canplay", handleReady);
    video.addEventListener("loadeddata", handleReady);
    video.addEventListener("error", handleError);

    // Set src TERAKHIR, setelah listener terpasang, biar tidak race
    // dengan event yang keburu fire sebelum listener sempat nempel.
    video.src = VIDEO_SRC;
    video.load();
    video.play().catch((err) => {
      // AbortError disini normal di React.StrictMode (dev only): effect
      // dipanggil, dibatalkan, lalu dipanggil ulang — play() pertama sengaja
      // di-interrupt oleh pause() dari cleanup dummy tsb. Instance kedua
      // (yang beneran dipakai) tetap play seperti biasa, jadi aman diabaikan.
      if (err?.name !== "AbortError") {
        console.warn("Video360Environment: gagal autoplay, menunggu interaksi user.", err);
      }
    });
    setVideoEl(video);

    return () => {
      video.removeEventListener("canplay", handleReady);
      video.removeEventListener("loadeddata", handleReady);
      video.removeEventListener("error", handleError);
      video.pause();
      video.src = "";
      video.load();
      video.remove();
    };
  }, []);

  const texture = useMemo(() => {
    if (!videoEl) return null;
    const tex = new THREE.VideoTexture(videoEl);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    textureRef.current = tex;
    return tex;
  }, [videoEl]);

  useEffect(() => {
    return () => {
      textureRef.current?.dispose();
    };
  }, []);

  return (
    <group>
      {/* Sphere besar, dilihat dari dalam (BackSide) */}
      <mesh scale={[-1, 1, 1]}>
        <sphereGeometry args={[500, 60, 40]} />
        {isReady && texture ? (
          <meshBasicMaterial map={texture} side={THREE.BackSide} toneMapped={false} />
        ) : (
          // Placeholder solid color selama video masih buffering,
          // supaya tidak muncul frame hitam/rusak sesaat sebelum siap.
          <meshBasicMaterial color="#0a0a14" side={THREE.BackSide} toneMapped={false} />
        )}
      </mesh>

      {/* Lighting minimal supaya NPC/panel 3D di atasnya tetap terlihat wajar */}
      <ambientLight intensity={0.8} />
      <hemisphereLight skyColor="#ffffff" groundColor="#444444" intensity={0.6} />
    </group>
  );
}
