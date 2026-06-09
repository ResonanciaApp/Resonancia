import React from "react";
import AuroraBase from "./_shared/AuroraBase";

export default function AuroraEquilibrado() {
  return (
    <AuroraBase
      config={{
        label: "Equilibrado",
        subtitle: "Aurora equilibrada · media",
        flow: 1.1,
        glowBlur: 22,
        glowAlpha: "66",
        entryBlur: 10,
        auroraSpeed: 15,
        auroraOpacity: 0.85,
        carouselGlow: 0.25,
      }}
    />
  );
}
