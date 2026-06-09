import React from "react";
import MagnetBase from "./_shared/MagnetBase";

export default function MagnetSuave() {
  return (
    <MagnetBase
      config={{
        label: "Suave",
        subtitle: "Imán suave · mínimo y zen",
        glide: { duration: 1.25, bounce: 0 },
        glowAlpha: "30",
        glowBlur: 18,
        rippleCount: 1,
        rippleScale: 2.2,
        activatePulse: 1.06,
        lienzoGlow: 0.22,
      }}
    />
  );
}
