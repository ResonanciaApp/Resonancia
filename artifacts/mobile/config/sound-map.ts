/**
 * Compatibilidad para consumidores antiguos del motor.
 *
 * El catálogo y los audios del Mezclador se administran exclusivamente desde
 * Admin. No se deben agregar assets bundleados en este mapa.
 */
export const SOUND_MAP: Record<string, ReturnType<typeof require> | undefined> = {};
