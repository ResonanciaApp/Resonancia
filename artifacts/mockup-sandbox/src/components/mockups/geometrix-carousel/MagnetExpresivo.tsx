import React from "react";
import MagnetBase from "./_shared/MagnetBase";

export default function MagnetExpresivo() {
  return (
    <MagnetBase
      config={{
        label: "Expresivo",
        subtitle: "Imán expresivo · vivo",
        glide: { duration: 0.6, bounce: 0.4 },
        glowAlpha: "85",
        glowBlur: 36,
        rippleCount: 3,
        rippleScale: 3.0,
        activatePulse: 1.2,
        lienzoGlow: 0.7,
      }}
    />
  );
}
