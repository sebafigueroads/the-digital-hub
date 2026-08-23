// Shared handle to the cinema <video> element so the HTML overlay
// ("Escuchar con voz") can control the same element that feeds the
// THREE.VideoTexture inside the canvas. Mutable module state on purpose —
// mirrors the store.ts pattern (no React re-renders needed).

export const videoBus: { el: HTMLVideoElement | null } = { el: null };
