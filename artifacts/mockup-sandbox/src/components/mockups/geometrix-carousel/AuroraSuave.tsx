import React from "react";
import AuroraBase from "./_shared/AuroraBase";

export default function AuroraSuave() {
  return (
    <AuroraBase
      config={{
        label: "Suave",
        subtitle: "Aurora suave · mínimo y zen",
        flow: 1.6,
        glowBlur: 14,
        glowAlpha: "44",
        entryBlur: 6,
        auroraSpeed: 22,
        auroraOpacity: 0.5,
        carouselGlow: 0.15,
      }}
    />
  );
}
