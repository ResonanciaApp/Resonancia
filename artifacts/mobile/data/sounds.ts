import { SOUND_MAP } from "@/config/sound-map";

/**
 * Catálogo de sonidos del mixer "Mi Música".
 * Los archivos de audio viven en config/sound-map.ts (SOUND_MAP).
 * Un sonido sin archivo en SOUND_MAP se muestra como "Próximamente".
 *
 * Los sonidos se agrupan por categoría. En la pantalla "Mi Música" estas
 * categorías se muestran como tabs (más "Todos") para filtrar la biblioteca.
 *
 * NOTA: muchos sonidos de abajo son de PRUEBA (placeholders sin archivo de
 * audio) — aparecen como "Próximamente" hasta que se carguen los audios
 * finales en SOUND_MAP. Sirven para ver las categorías pobladas.
 */

export type SoundIconSet = "feather" | "ionicons";
export type SoundCategoryId =
  | "naturaleza"
  | "agua"
  | "cuencos_tibetanos"
  | "cuencos_cuarzo"
  | "gongs"
  | "campanas_viento"
  | "mantras"
  | "solfeggio"
  | "ruidos"
  | "frecuencias";

export interface SoundCategory {
  id: SoundCategoryId;
  label: string;
}

export const SOUND_CATEGORIES: SoundCategory[] = [
  { id: "naturaleza", label: "Naturaleza" },
  { id: "agua", label: "Agua" },
  { id: "cuencos_tibetanos", label: "Cuencos Tibetanos" },
  { id: "cuencos_cuarzo", label: "Cuencos de Cuarzo" },
  { id: "gongs", label: "Gongs" },
  { id: "campanas_viento", label: "Campanas de Viento" },
  { id: "mantras", label: "Mantras" },
  { id: "solfeggio", label: "Solfeggio" },
  { id: "ruidos", label: "Ruidos" },
  { id: "frecuencias", label: "Frecuencias" },
];

export interface MixSound {
  id: string;
  name: string;
  /** Nombre del ícono (según iconSet) */
  icon: string;
  iconSet: SoundIconSet;
  category: SoundCategoryId;
  /** Si es true, requiere premium para usarse */
  isPremium?: boolean;
}

export const SOUNDS: MixSound[] = [
  // ── Naturaleza ──────────────────────────────────────────────
  { id: "viento", name: "Viento", icon: "wind", iconSet: "feather", category: "naturaleza" },
  { id: "fogata", name: "Fogata", icon: "flame", iconSet: "ionicons", category: "naturaleza", isPremium: true },
  { id: "bosque", name: "Bosque", icon: "leaf", iconSet: "ionicons", category: "naturaleza" },
  { id: "noche", name: "Noche", icon: "moon", iconSet: "feather", category: "naturaleza", isPremium: true },
  { id: "tormenta", name: "Tormenta", icon: "thunderstorm", iconSet: "ionicons", category: "naturaleza" },
  { id: "pajaros", name: "Pájaros", icon: "leaf", iconSet: "ionicons", category: "naturaleza" },
  { id: "grillos", name: "Grillos", icon: "moon", iconSet: "feather", category: "naturaleza" },

  // ── Agua ────────────────────────────────────────────────────
  { id: "lluvia", name: "Lluvia", icon: "rainy", iconSet: "ionicons", category: "agua" },
  { id: "oceano", name: "Océano", icon: "water", iconSet: "ionicons", category: "agua" },
  { id: "rio", name: "Río", icon: "droplet", iconSet: "feather", category: "agua" },
  { id: "arroyo", name: "Arroyo", icon: "droplet", iconSet: "feather", category: "agua" },
  { id: "cascada", name: "Cascada", icon: "water", iconSet: "ionicons", category: "agua", isPremium: true },

  // ── Cuencos Tibetanos ───────────────────────────────────────
  { id: "cuencos", name: "Cuenco tibetano", icon: "musical-notes", iconSet: "ionicons", category: "cuencos_tibetanos" },
  { id: "cuenco_grave", name: "Cuenco grave", icon: "musical-notes", iconSet: "ionicons", category: "cuencos_tibetanos" },
  { id: "cuenco_agudo", name: "Cuenco agudo", icon: "musical-notes", iconSet: "ionicons", category: "cuencos_tibetanos", isPremium: true },

  // ── Cuencos de Cuarzo ───────────────────────────────────────
  { id: "cuarzo_do", name: "Cuarzo · Do", icon: "disc", iconSet: "feather", category: "cuencos_cuarzo" },
  { id: "cuarzo_sol", name: "Cuarzo · Sol", icon: "disc", iconSet: "feather", category: "cuencos_cuarzo" },
  { id: "cuarzo_corazon", name: "Cuarzo · Corazón", icon: "disc", iconSet: "feather", category: "cuencos_cuarzo", isPremium: true },

  // ── Gongs ───────────────────────────────────────────────────
  { id: "gong", name: "Gong", icon: "radio", iconSet: "feather", category: "gongs" },
  { id: "gong_planetario", name: "Gong planetario", icon: "radio", iconSet: "feather", category: "gongs", isPremium: true },

  // ── Campanas de Viento ──────────────────────────────────────
  { id: "campanas_viento", name: "Campanas de viento", icon: "musical-note", iconSet: "ionicons", category: "campanas_viento" },
  { id: "campanas_bambu", name: "Campanas de bambú", icon: "musical-note", iconSet: "ionicons", category: "campanas_viento" },

  // ── Mantras ─────────────────────────────────────────────────
  { id: "mantra_om", name: "Om", icon: "mic", iconSet: "feather", category: "mantras" },
  { id: "mantra_soham", name: "So Ham", icon: "mic", iconSet: "feather", category: "mantras", isPremium: true },

  // ── Solfeggio ───────────────────────────────────────────────
  { id: "solfeggio_528", name: "528 Hz", icon: "activity", iconSet: "feather", category: "solfeggio" },
  { id: "solfeggio_432", name: "432 Hz", icon: "activity", iconSet: "feather", category: "solfeggio" },
  { id: "solfeggio_396", name: "396 Hz", icon: "activity", iconSet: "feather", category: "solfeggio", isPremium: true },

  // ── Ruidos (de color) ───────────────────────────────────────
  { id: "ruido_blanco", name: "Ruido blanco", icon: "radio", iconSet: "feather", category: "ruidos" },
  { id: "ruido_rosa", name: "Ruido rosa", icon: "radio", iconSet: "feather", category: "ruidos" },
  { id: "ruido_marron", name: "Ruido marrón", icon: "radio", iconSet: "feather", category: "ruidos" },
  { id: "ruido_azul", name: "Ruido azul", icon: "radio", iconSet: "feather", category: "ruidos" },

  // ── Frecuencias (ondas cerebrales isocrónicas) ──────────────
  { id: "onda_delta", name: "Delta · Sueño", icon: "activity", iconSet: "feather", category: "frecuencias" },
  { id: "onda_theta", name: "Theta · Meditar", icon: "activity", iconSet: "feather", category: "frecuencias" },
  { id: "onda_alpha", name: "Alpha · Calma", icon: "activity", iconSet: "feather", category: "frecuencias" },
  { id: "onda_beta", name: "Beta · Enfoque", icon: "activity", iconSet: "feather", category: "frecuencias" },
  { id: "onda_gamma", name: "Gamma · Claridad", icon: "activity", iconSet: "feather", category: "frecuencias" },
];

export function getSoundById(id: string): MixSound | undefined {
  return SOUNDS.find((s) => s.id === id);
}

/** True si el sonido ya tiene un archivo de audio cargado en SOUND_MAP */
export function hasSoundFile(id: string): boolean {
  return !!SOUND_MAP[id];
}

export function getSoundsByCategory(category: SoundCategoryId): MixSound[] {
  return SOUNDS.filter((s) => s.category === category);
}
