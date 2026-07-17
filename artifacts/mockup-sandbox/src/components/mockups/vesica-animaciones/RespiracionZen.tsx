import {
  Frame,
  REST_DX,
  VesicaDefs,
  VesicaGlyph,
  useCycle,
} from "./_shared/vesica";

// Variante 2 — Respiración Zen: los círculos se acercan (inhalar) y vuelven
// a su lugar (exhalar) en un solo ciclo suave de 1 s. La lente se ensancha
// y se ilumina al acercarse, como una respiración de luz.
export function RespiracionZen() {
  const t = useCycle(1000, 1600);
  // seno de ida y vuelta: 0 → 1 → 0
  const breath = Math.sin(Math.PI * t);
  const dx = REST_DX - 6 * breath; // 12 → 6 → 12
  const overlap = 1 - dx / REST_DX;
  return (
    <Frame
      title="Respiración Zen"
      subtitle="Inhalar: los círculos se acercan y la lente se ensancha y brilla. Exhalar: regresan a su reposo. Un ciclo de 1 s."
    >
      <VesicaDefs />
      <VesicaGlyph
        c1={{ x: 50 - dx, y: 50 }}
        c2={{ x: 50 + dx, y: 50 }}
        glow={overlap * 0.9}
        strokeOpacity={0.5 + 0.2 * breath}
      />
    </Frame>
  );
}
