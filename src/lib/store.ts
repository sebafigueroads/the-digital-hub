// Shared mutable state between DOM event listeners and the R3F render loop.
// useFrame reads these values every frame — no React re-renders needed.

export const store = {
  // Lenis scroll progress 0 → 1
  scrollProgress: 0,
  // Normalised mouse position (-1 to 1)
  mouseX: 0,
  mouseY: 0,
  // Mouse speed (pixels/frame, decayed)
  mouseVelocity: 0,
  // Portal zoom-in transition · 0 = off, 0→1 = animating into the room
  portalProgress: 0,
};
