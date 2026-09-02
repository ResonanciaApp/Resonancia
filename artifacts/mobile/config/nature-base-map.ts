/**
 * MAPA DE SONIDOS NATURALEZA → SONIDOS DEL MEZCLADOR
 * ─────────────────────────────────────────────────────────────────
 * Cada sesión "Sonidos Naturaleza" de Música y Sonidos (data/sessions.ts)
 * trae DOS sonidos fijos del mezclador (data/sounds.ts / SOUND_MAP):
 *
 *   - `base`:    la pista principal / "fondo". Arranca al tocar la card,
 *                define la imagen de fondo de la pantalla inmersiva y suena
 *                siempre. Equivale a la pista de una sesión de Sonidos
 *                Ancestrales.
 *   - `ambient`: una capa ambiente que viene YA CARGADA en la sesión
 *                (opcional). El usuario NO la elige: se carga sola y solo
 *                puede subir/bajar su volumen (estilo Pura Mente).
 *
 * NO hay picker "+ Sonidos" en la inmersiva: para armar mezclas libres está
 * la sección "Mi Música". Cada sesión nueva la define el usuario pasando
 * ambos sonidos (cuál es base y cuál es ambiente) al subirla.
 * ─────────────────────────────────────────────────────────────────
 */
export type NatureSounds = {
  /** Pista principal / fondo (siempre presente). */
  base: string;
  /** Capa ambiente precargada (opcional). */
  ambient?: string;
};

export const NATURE_BASE_MAP: Record<string, NatureSounds> = {
};

/** Sonidos (base + ambiente) de una sesión natural (o undefined si no está mapeada). */
export function getNatureSounds(sessionId: string): NatureSounds | undefined {
  return NATURE_BASE_MAP[sessionId];
}
