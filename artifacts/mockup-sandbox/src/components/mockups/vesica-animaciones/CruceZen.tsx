import {
  Frame,
  REST_DX,
  VesicaDefs,
  VesicaGlyph,
  easeInOutCubic,
  useCycle,
} from "./_shared/vesica";

// Variante 1 — Cruce Zen: los círculos intercambian de lado atravesándose.
// Al superponerse por completo, la luz de la lente llena todo el círculo
// y se desvanece de nuevo al separarse (la lógica de luz central se respeta:
// la lente se recalcula geométricamente en cada cuadro).
export function CruceZen() {
  const t = useCycle(1000, 1600);
  const e = easeInOutCubic(t);
  // dx: +12 → −12 (cruce completo)
  const dx = REST_DX * (1 - 2 * e);
  const overlap = 1 - Math.abs(dx) / REST_DX; // 0 en reposo, 1 al coincidir
  return (
    <Frame
      title="Cruce Zen"
      subtitle="Los círculos intercambian de lado en 1 s; al fundirse, la luz interior llena el círculo entero y vuelve a ser lente."
    >
      <VesicaDefs />
      <VesicaGlyph
        c1={{ x: 50 - dx, y: 50 }}
        c2={{ x: 50 + dx, y: 50 }}
        glow={overlap * 0.55}
      />
    </Frame>
  );
}
