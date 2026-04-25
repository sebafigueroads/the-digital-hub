"use client";

/**
 * Full-viewport film-grain texture overlay.
 * Uses an SVG noise pattern animated via CSS keyframes (defined in globals.css).
 */
export function GrainOverlay() {
  return <div className="grain" aria-hidden="true" />;
}
