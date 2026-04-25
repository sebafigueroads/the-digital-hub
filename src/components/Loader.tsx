"use client";

import { useProgress, Html } from "@react-three/drei";

export function Loader() {
  const { progress } = useProgress();

  return (
    <Html fullscreen>
      <div className="loader-screen">
        <div className="loader-inner">
          <h1 className="loader-title">DIGITALS</h1>
          <div className="loader-bar-track">
            <div
              className="loader-bar-fill"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="loader-pct">{progress.toFixed(0)}%</p>
        </div>
      </div>
    </Html>
  );
}
