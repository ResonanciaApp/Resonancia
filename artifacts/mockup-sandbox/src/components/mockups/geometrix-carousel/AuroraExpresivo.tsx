import React from "react";
import AuroraBase from "./_shared/AuroraBase";

export default function AuroraExpresivo() {
  return (
    <AuroraBase
      config={{
        label: "Expresivo",
        subtitle: "Aurora expresiva · viva",
        flow: 0.7,
        glowBlur: 34,
        glowAlpha: "99",
        entryBlur: 16,
        auroraSpeed: 9,
        auroraOpacity: 1.2,
        carouselGlow: 0.4,
      }}
    />
  );
}
