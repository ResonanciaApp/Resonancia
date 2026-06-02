/**
 * MAPA DE SONIDOS NATURALEZA → SONIDOS BASE DEL MEZCLADOR
 * ─────────────────────────────────────────────────────────────────
 * Cada sesión "Sonidos Naturaleza" de Música y Sonidos (data/sessions.ts)
 * se mapea a uno o más sonidos del mezclador "Mi Música" (data/sounds.ts /
 * SOUND_MAP). La pantalla inmersiva (app/inmersivo.tsx) reutiliza el motor
 * multicapa del mixer en vez de duplicarlo.
 *
 * El PRIMER id de la lista es la capa base (arranca al tocar la card y define
 * la imagen de fondo). Las capas extra se suman automáticamente al abrir la
 * pantalla inmersiva (p. ej. "Riachuelo con Pájaros" = río + pájaros).
 * ─────────────────────────────────────────────────────────────────
 */
export const NATURE_BASE_MAP: Record<string, string[]> = {
  "20": ["bosque"],
  "21": ["lluvia"],
  "22": ["oceano"],
  "27": ["rio", "pajaros"],
};

/** Sonidos base de una sesión natural (o undefined si no está mapeada). */
export function getNatureBaseSounds(sessionId: string): string[] | undefined {
  return NATURE_BASE_MAP[sessionId];
}
