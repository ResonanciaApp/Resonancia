import React from "react";
import MagnetBase from "./_shared/MagnetBase";

export default function MagnetEquilibrado() {
  return (
    <MagnetBase
      config={{
        label: "Equilibrado",
        subtitle: "Imán equilibrado · medio",
        glide: { duration: 0.85, bounce: 0.18 },
        glowAlpha: "55",
        glowBlur: 26,
        rippleCount: 2,
        rippleScale: 2.6,
        activatePulse: 1.12,
        lienzoGlow: 0.42,
      }}
    />
  );
}
