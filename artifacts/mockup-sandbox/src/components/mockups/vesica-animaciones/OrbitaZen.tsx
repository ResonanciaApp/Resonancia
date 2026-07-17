import {
  Frame,
  REST_DX,
  VesicaDefs,
  VesicaGlyph,
  easeInOutCubic,
  useCycle,
} from "./_shared/vesica";

// Variante 4 — Órbita Zen: los círculos giran media vuelta alrededor del
// centro (como dos lunas) e intercambian de lado sin atravesarse. La lente
// gira con ellos manteniendo su forma y su luz constante.
export function OrbitaZen() {
  const t = useCycle(1000, 1600);
  const theta = Math.PI * easeInOutCubic(t); // 0 → 180°
  const dx = REST_DX * Math.cos(theta);
  const dy = REST_DX * Math.sin(theta);
  return (
    <Frame
      title="Órbita Zen"
      subtitle="Media vuelta orbital en 1 s: los círculos giran como dos lunas e intercambian de lado; la lente rota intacta con su luz."
    >
      <VesicaDefs />
      <VesicaGlyph
        c1={{ x: 50 - dx, y: 50 - dy }}
        c2={{ x: 50 + dx, y: 50 + dy }}
        glow={0.25}
      />
    </Frame>
  );
}
