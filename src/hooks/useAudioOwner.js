import useGameStore from "../store/useGameStore";

/**
 * useAudioOwner — siapa yang boleh memutar audio pada mode saat ini.
 *
 * Aturan: hanya SATU lapisan yang memutar suara pada satu waktu.
 * - layer "vr" → hanya saat masuk VR (isInVR true)
 * - layer "2d" → hanya saat mode 2D (isInVR false)
 *
 * Ini mencegah suara dobel & race condition saat 2D dan 3D sama-sama
 * ter-mount (canvas 3D selalu render, overlay 2D transparan di atasnya).
 */
export function useAudioOwner(layer) {
  return useGameStore((s) => (layer === "vr" ? s.isInVR : !s.isInVR));
}

export default useAudioOwner;
