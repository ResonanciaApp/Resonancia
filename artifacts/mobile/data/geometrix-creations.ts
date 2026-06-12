/**
 * Tipos compartidos de Geometrix — usados por la pantalla del editor
 * (`app/(tabs)/geometrix.tsx`), el hook de persistencia
 * (`hooks/useGeometrixCreations.ts`) y la pantalla "Mis creaciones"
 * (`app/geometrix-creaciones.tsx`).
 *
 * Una "creación" es SOLO datos (la receta): qué capas, sus ajustes/colores,
 * el fondo y el sonido elegido. No es un video ni una imagen — guardarla es
 * barato y se puede volver a dibujar en vivo idéntica.
 */
import { PALETTE, type GeometryId } from "@/data/geometries";

/** Ajustes por capa (una geometría). Mismo shape que usa el editor. */
export type GeoSettings = {
  color: string;
  /** Degradado del trazo (id de STROKE_GRADIENTS) o null = color sólido. */
  gradientId: string | null;
  /** Giro a la derecha on/off (sentido horario). */
  rotate: boolean;
  /** Giro a la izquierda on/off (sentido antihorario). Excluyente con `rotate`. */
  rotateLeft: boolean;
  /** Velocidad de giro 0–1: 0 = muy lento, 1 = rápido. */
  rotateSpeed: number;
  opacity: number;
  /** Respiración 0–1: la geometría pulsa suavemente. 0 = off, >0 = profundidad. */
  breatheAmount: number;
  /** Fundido cíclico 0–1: la geometría aparece y desaparece en bucle. 0 = off. */
  fadeLoopAmount: number;
  /** Glow propio 0–1: halo aditivo del trazo (se suma al glow general). */
  glow: number;
  /** Grosor de línea: 0 = 1px, 1 = ~6px. */
  thickness: number;
  /** Tamaño: 0 = más chica, 1 = tamaño completo. */
  scale: number;
  /** Zoom de pellizco (pinch): multiplicador libre, 1 = sin zoom. */
  zoom: number;
  /** Ángulo manual en grados (gesto de rotación con dos dedos). */
  manualAngle: number;
  /** Desplazamiento horizontal (arrastrar con un dedo), en px del lienzo. */
  offsetX: number;
  /** Desplazamiento vertical (arrastrar con un dedo), en px del lienzo. */
  offsetY: number;
  /** Modo caleidoscopio: replica la geometría en simetría radial de N segmentos. */
  kaleidoscope: boolean;
  /** Número de segmentos del caleidoscopio (4, 6, 8, 12). Solo activo si kaleidoscope=true. */
  kaleidSegments: number;
  /** Saturación del color 0–1: 0.5 = original, 0 = gris, 1 = sobresaturado. */
  saturation: number;
  /** Bloom 0–1: resplandor intenso y blanquecino (sobreexposición). 0 = off. */
  bloom: number;
  /** Halo 0–1: aura radial suave detrás del glifo. 0 = off. */
  halo: number;
  /** Onda 0–1: cizalla (skew) oscilante que ondula la figura. 0 = off. */
  onda: number;
  /** Ripple 0–1: anillos concéntricos que emanan del centro en bucle. 0 = off. */
  ripple: number;
  /** Expansión 0–1: eco del glifo que crece y se desvanece en bucle. 0 = off. */
  expansionAmount: number;
  /** Perspectiva 3D 0–1: inclina la capa en 3D (rotateX/Y oscilantes). 0 = plano. */
  threeDAmount: number;
};

/** Patrón de fondo: geometría teselada detrás del lienzo. */
export type BgPattern = {
  /** ID de la geometría a teselar. */
  geoId: GeometryId;
  /** Opacidad 0–1 del patrón (generalmente bajo, 0.04–0.18). */
  opacity: number;
  /** Tamaño de cada tesela en px del lienzo (20 = pequeño, 40 = mediano, 70 = grande). */
  tileSize: number;
  /**
   * Espaciado entre tiles: multiplica el intervalo de repetición del patrón.
   * 1.0 = espaciadas (default), 0.82 = pegadas, 0.67 = superpuestas.
   */
  spacing: number;
};

/** Ajustes generales (panel maestro) que afectan a todas las capas a la vez. */
export type GlobalSettings = {
  /** Opacidad maestra 0–1: multiplica la opacidad propia de cada capa. */
  opacity: number;
  /** Movimiento global on/off: congela giro + respiración de todas las capas. */
  motion: boolean;
  /** Glow maestro 0–1: halo aditivo en los trazos de todas las capas. */
  glow: number;
  /** Color sólido de fondo del lienzo; null = usar fondo por defecto o degradado. */
  bgColor: string | null;
  /** Degradado de fondo del lienzo (id de BG_GRADIENTS); null = sólido o por defecto. */
  bgGradientId: string | null;
  /** Brillo del fondo (valor del slider 0–1; 0.5 = brillo original). */
  bgBrightness: number;
  /** Patrón de fondo (geometría teselada). null = sin patrón. */
  bgPattern: BgPattern | null;
};

/** Guía manual del lienzo: línea persistente creada por el usuario. */
export type CanvasGuide = {
  id: string;
  /** 'h' = horizontal (línea de altura), 'v' = vertical (línea de posición X). */
  orientation: "h" | "v";
  /** Posición 0–100 % sobre el eje correspondiente del lienzo. */
  pct: number;
};

/** Sonido elegido en la composición: módulo + pista. null = sin sonido. */
export type GeometrixAudio = { moduleKey: string; trackId: string } | null;

// ───────────────────────────────────────────────────────────────────────────
// Degradados + brillo (compartidos entre editor y previews)
//
// Viven acá (no en la pantalla del editor) para que "Mis creaciones" pueda
// redibujar cada preview con la MISMA receta: degradado de trazo, degradado de
// fondo y brillo. Así la miniatura coincide con lo que se ve al reabrir.
// ───────────────────────────────────────────────────────────────────────────

/** Degradado por defecto del lienzo (fondo de Inicio). */
export const HOME_GRADIENT = ["#0C122C", "#0C0F24", "#0A0C1A"] as const;

/** Degradados de TRAZO (Ajustes personalizados de cada capa). */
export const STROKE_GRADIENTS: { id: string; colors: readonly [string, string] }[] = [
  { id: "dorado-rosa", colors: [PALETTE[0], PALETTE[5]] },
  { id: "rosa-lavanda", colors: [PALETTE[5], PALETTE[4]] },
  { id: "lavanda-azul", colors: [PALETTE[4], PALETTE[3]] },
  { id: "azul-verdeagua", colors: [PALETTE[3], PALETTE[2]] },
  { id: "verdeagua-verde", colors: [PALETTE[2], PALETTE[6]] },
  { id: "verde-dorado", colors: [PALETTE[6], PALETTE[0]] },
  { id: "crema-dorado", colors: [PALETTE[1], PALETTE[0]] },
];

/** Degradados de FONDO del lienzo (Ajustes generales). Todos terminan en el
    mismo tono profundo de Inicio (#06070F) para cohesión. */
export const BG_GRADIENTS: { id: string; colors: readonly [string, string] }[] = [
  { id: "indigo-noche", colors: ["#0C1430", "#06070F"] },
  { id: "verdeagua-noche", colors: ["#072623", "#06070F"] },
  { id: "violeta-noche", colors: ["#1A1030", "#06070F"] },
  { id: "vino-noche", colors: ["#280B16", "#06070F"] },
  { id: "bosque-noche", colors: ["#0A2614", "#06070F"] },
  { id: "ambar-noche", colors: ["#2A1A05", "#06070F"] },
  { id: "brasa-negra", colors: ["#040404", "#1C0E02"] },
];

/** Resolver del degradado de TRAZO. null/desconocido → undefined (color sólido). */
export function gradientColors(id: string | null): readonly [string, string] | undefined {
  if (!id) return undefined;
  return STROKE_GRADIENTS.find((gr) => gr.id === id)?.colors;
}

/** Resolver del degradado de FONDO. null/desconocido → undefined. */
export function bgGradientColors(id: string | null): readonly [string, string] | undefined {
  if (!id) return undefined;
  return BG_GRADIENTS.find((gr) => gr.id === id)?.colors;
}

/** Escala el RGB de un hex por un factor (clamp 0–255). f>1 aclara, f<1 oscurece. */
export function scaleHex(hex: string, f: number): string {
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if ([0, 2, 4].some((i) => Number.isNaN(parseInt(h.slice(i, i + 2), 16)))) return hex;
  const ch = (i: number) => {
    const n = Math.round(parseInt(h.slice(i, i + 2), 16) * f);
    return Math.max(0, Math.min(255, n)).toString(16).padStart(2, "0");
  };
  return `#${ch(0)}${ch(2)}${ch(4)}`;
}

/** Mapea el slider de brillo (0–1; 0.5 = original) a factor: 0→0.4×, 0.5→1×, 1→2.2×. */
export function brightnessFactor(v: number): number {
  const x = Number.isFinite(v) ? Math.max(0, Math.min(1, v)) : 0.5;
  return x <= 0.5 ? 0.4 + x * 1.2 : 1 + (x - 0.5) * 2.4;
}

/** Aplica un factor de brillo a cada color de un degradado. */
export function scaleColors(
  colors: readonly string[],
  f: number,
): readonly [string, string, ...string[]] {
  return colors.map((c) => scaleHex(c, f)) as unknown as [string, string, ...string[]];
}

/** Una composición de Geometrix guardada como datos (receta). */
export type GeometrixCreation = {
  id: string;
  name: string;
  /** ISO. */
  createdAt: string;
  /** ISO. */
  updatedAt: string;
  /** Marcada como favorita por el usuario. */
  liked: boolean;
  /** Capas activas, en orden. Ids de instancia (`baseId` o `baseId::sufijo`). */
  active: string[];
  /** Ajustes generales (fondo, movimiento, glow, opacidad maestra). */
  master: GlobalSettings;
  /** Ajustes por capa (solo de las capas activas). */
  settings: Record<string, GeoSettings>;
  /** IDs de capas ocultas (no se renderizan en el lienzo). Opcional para compatibilidad con creaciones antiguas. */
  hiddenIds?: string[];
  /** Pista de audio elegida. */
  audio: GeometrixAudio;
};
