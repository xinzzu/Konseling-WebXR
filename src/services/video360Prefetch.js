// Prefetch ringan untuk video 360 — dipanggil saat user MASUK ke layar pilih
// environment (bukan saat app pertama kali load), supaya initial load tetap cepat
// tapi begitu user pilih "Video 360°" videonya sudah (sebagian) ada di cache browser.

const VIDEO_SRC = "/videos/sample-360.mp4";

let prefetched = false;

export function prefetchVideo360() {
  if (prefetched || typeof document === "undefined") return;
  prefetched = true;

  const link = document.createElement("link");
  link.rel = "preload";
  link.as = "video";
  link.href = VIDEO_SRC;
  link.type = "video/mp4";
  document.head.appendChild(link);
}

export { VIDEO_SRC };
