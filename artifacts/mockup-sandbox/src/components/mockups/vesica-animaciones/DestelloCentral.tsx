import {
  Frame,
  REST_DX,
  VesicaDefs,
  VesicaGlyph,
  useCycle,
} from "./_shared/vesica";

// Variante 3 — Destello Central: la geometría no se mueve; solo la luz de la
// lente "late" una vez (bloom suave que crece y se apaga en 1 s). La opción
// más discreta: nada se desplaza, solo respira la luz interior.
export function DestelloCentral() {
  const t = useCycle(1000, 1600);
  const pulse = Math.sin(Math.PI * t); // 0 → 1 → 0
  return (
    <Frame
      title="Destello Central"
      subtitle="Nada se mueve: solo la luz de la lente late una vez (1 s). La variante más sutil y contemplativa."
    >
      <VesicaDefs />
      <g transform={`translate(50 50) scale(${1 + 0.03 * pulse}) translate(-50 -50)`}>
        <VesicaGlyph
          c1={{ x: 50 - REST_DX, y: 50 }}
          c2={{ x: 50 + REST_DX, y: 50 }}
          glow={pulse * 0.7}
          lensOpacity={0.85 + 0.15 * pulse}
          strokeOpacity={0.5 + 0.25 * pulse}
        />
      </g>
    </Frame>
  );
}
