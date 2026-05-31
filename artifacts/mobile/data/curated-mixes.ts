/**
 * MEZCLAS CURADAS — "Mi Música"
 * ─────────────────────────────────────────────────────────────────
 * Mezclas que vienen con la app para que las categorías nunca estén
 * vacías. Son de solo lectura (isCurated: true → no se pueden borrar).
 *
 * IMPORTANTE: usar solo sonidos GRATIS y con archivo disponible
 * (ver SOUND_MAP en config/sound-map.ts). Hoy activos y free:
 * lluvia, oceano, viento, ruido_blanco, cuencos. (fogata es premium).
 * ─────────────────────────────────────────────────────────────────
 */
import type { MixPreset } from "@/context/MixerContext";

export const CURATED_MIXES: MixPreset[] = [
  // ── Para Dormir ─────────────────────────────────────────────
  {
    id: "curated-dormir-1",
    name: "Lluvia para dormir",
    description: "Lluvia suave con un fondo de ruido blanco para conciliar el sueño.",
    image: "lluvia",
    category: "dormir",
    sounds: [
      { id: "lluvia", volume: 0.7 },
      { id: "ruido_blanco", volume: 0.35 },
    ],
    createdAt: "2025-01-01T00:00:00.000Z",
    isCurated: true,
  },
  {
    id: "curated-dormir-2",
    name: "Olas nocturnas",
    description: "El vaivén del océano con cuencos lejanos para soltar el día.",
    image: "oceano",
    category: "dormir",
    sounds: [
      { id: "oceano", volume: 0.6 },
      { id: "cuencos", volume: 0.3 },
    ],
    createdAt: "2025-01-01T00:00:00.000Z",
    isCurated: true,
  },
  // ── Para Trabajar ───────────────────────────────────────────
  {
    id: "curated-trabajar-1",
    name: "Concentración profunda",
    description: "Ruido blanco y viento para enfocarte y bloquear distracciones.",
    image: "viento",
    category: "trabajar",
    sounds: [
      { id: "ruido_blanco", volume: 0.55 },
      { id: "viento", volume: 0.3 },
    ],
    createdAt: "2025-01-01T00:00:00.000Z",
    isCurated: true,
  },
  {
    id: "curated-trabajar-2",
    name: "Tarde de lluvia",
    description: "Lluvia constante, ideal para leer, estudiar o escribir.",
    image: "cafe",
    category: "trabajar",
    sounds: [{ id: "lluvia", volume: 0.6 }],
    createdAt: "2025-01-01T00:00:00.000Z",
    isCurated: true,
  },
  // ── Para Motivarme ──────────────────────────────────────────
  {
    id: "curated-motivarme-1",
    name: "Mañana clara",
    description: "Viento fresco y cuencos que despiertan la energía del día.",
    image: "bosque",
    category: "motivarme",
    sounds: [
      { id: "viento", volume: 0.5 },
      { id: "cuencos", volume: 0.4 },
    ],
    createdAt: "2025-01-01T00:00:00.000Z",
    isCurated: true,
  },
  {
    id: "curated-motivarme-2",
    name: "Impulso sereno",
    description: "Océano y cuencos para encontrar foco y calma activa.",
    image: "drone",
    category: "motivarme",
    sounds: [
      { id: "cuencos", volume: 0.55 },
      { id: "oceano", volume: 0.4 },
    ],
    createdAt: "2025-01-01T00:00:00.000Z",
    isCurated: true,
  },
];

export function getCuratedByCategory(category: MixPreset["category"]): MixPreset[] {
  return CURATED_MIXES.filter((m) => m.category === category);
}
