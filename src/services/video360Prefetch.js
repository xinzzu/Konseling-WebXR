// Prefetch ringan untuk video 360 — dipanggil saat user MASUK ke layar pilih
// environment (bukan saat app pertama kali load), supaya initial load tetap cepat
// tapi begitu user pilih "Video 360°" videonya sudah (sebagian) ada di cache browser.

const VIDEO_SRC = "/videos/sample-360.mp4";

let prefetched = false;

export function prefetchVideo360() {
  if (prefetched || typeof document === "undefined") return;
  prefetched = true;

  // Warm HTTP cache pakai fetch (same-origin, no-cors). Sengaja TIDAK pakai
  // <link rel="preload" as="video"> karena Chrome log warning
  // "uses an unsupported `as` value" untuk as="video".
  try {
    fetch(VIDEO_SRC, { mode: "no-cors", cache: "force-cache" }).catch(() => {});
  } catch {
    // abaikan — prefetch best-effort, video tetap di-load saat mount
  }
}

export { VIDEO_SRC };
