import { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { xrStore } from "./XRCanvas";

/**
 * VRControllerExit - Keluar sesi VR via tombol controller fisik.
 *
 * Kombinasi: TAHAN tombol A + B (controller kanan) atau X + Y (kiri)
 * selama ~0.8 detik → session.end().
 *
 * Catatan pemetaan WebXR (oculus-touch, dipakai Quest & umum):
 * - buttons[0] = trigger  → JANGAN dipakai (itu tombol "klik" Button3D)
 * - buttons[1] = squeeze/grip
 * - buttons[3] = klik thumbstick
 * - buttons[4] = A (kanan) / X (kiri)
 * - buttons[5] = B (kanan) / Y (kiri)
 * - Tombol Meta/Oculus TIDAK terbaca app (dicadangkan sistem → menu Quit).
 *
 * Kombinasi dua tombol + tahan: mustahil kepencet tak sengaja saat main,
 * tapi mudah diingat. Tanpa UI (return null); hint ada di StartScreen3D.
 */
const HOLD_MS = 800;

export default function VRControllerExit() {
  const holdRef = useRef(0);

  useFrame((_, delta) => {
    const session = xrStore.getState().session;
    if (!session) {
      holdRef.current = 0;
      return;
    }

    let combo = false;
    for (const src of session.inputSources) {
      const b = src.gamepad?.buttons;
      if (b && b[4]?.pressed && b[5]?.pressed) {
        combo = true;
        break;
      }
    }

    if (!combo) {
      holdRef.current = 0;
      return;
    }

    holdRef.current += delta;
    if (holdRef.current * 1000 >= HOLD_MS) {
      holdRef.current = 0;
      session.end().catch(() => {});
    }
  });

  return null;
}
