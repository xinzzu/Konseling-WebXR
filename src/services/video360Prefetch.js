// Prefetch ringan untuk video 360 — dipanggil saat user MASUK ke layar pilih
// environment (bukan saat app pertama kali load), supaya initial load tetap cepat
// tapi begitu user pilih salah satu environment video, videonya sudah (sebagian)
// ada di cache browser.

export const VIDEO_SRC = "/videos/sample-360.mp4";
export const VIDEO_SRC_2 = "/videos/sample-360-2.mp4";
export const VIDEO_SRC_3 = "/videos/sample-360-3.mp4";

const prefetched = new Set();

function prefetchOne(src) {
  if (prefetched.has(src) || typeof document === "undefined") return;
  prefetched.add(src);

  // Warm HTTP cache pakai fetch (same-origin, no-cors). Sengaja TIDAK pakai
  // <link rel="preload" as="video"> karena Chrome log warning
  // "uses an unsupported `as` value" untuk as="video".
  try {
    fetch(src, { mode: "no-cors", cache: "force-cache" }).catch(() => {});
  } catch {
    // abaikan — prefetch best-effort, video tetap di-load saat mount
  }
}

export function prefetchVideo360() {
  prefetchOne(VIDEO_SRC);
  prefetchOne(VIDEO_SRC_2);
  prefetchOne(VIDEO_SRC_3);
}
