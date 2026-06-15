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
  | "animales"
  | "bosque"
  | "mar"
  | "fuego"
  | "desierto"
  | "cuencos_tibetanos"
  | "cuencos_cuarzo"
  | "gongs"
  | "campanas_viento"
  | "vientos"
  | "cantos"
  | "percusion"
  | "mantras"
  | "solfeggio"
  | "ruidos"
  | "frecuencias"
  | "asmr"
  | "bpm";

export interface SoundCategory {
  id: SoundCategoryId;
  label: string;
}

/**
 * Etiquetas/atributos transversales de un sonido (independientes de la
 * categoría). Un sonido puede tener varias. Sirven para filtrar en los
 * Ajustes del Mezclador. Estos 5 son valores por defecto editables.
 */
export type SoundTagId =
  | "armonicos"
  | "psicodelicas"
  | "solfeggio"
  | "naturaleza"
  | "binaural";

export interface SoundTag {
  id: SoundTagId;
  label: string;
}

export const SOUND_TAGS: SoundTag[] = [
  { id: "armonicos",    label: "Armónicos" },
  { id: "psicodelicas", label: "Atmósferas psicodélicas" },
  { id: "solfeggio",    label: "Solfeggio" },
  { id: "naturaleza",   label: "Naturaleza" },
  { id: "binaural",     label: "Binaural" },
];

export const SOUND_CATEGORIES: SoundCategory[] = [
  { id: "animales", label: "Animales" },
  { id: "bosque",   label: "Bosque" },
  { id: "mar",      label: "Mar" },
  { id: "fuego",    label: "Fuego" },
  { id: "desierto", label: "Desierto" },
  { id: "cuencos_tibetanos", label: "Cuencos Tibetanos" },
  { id: "cuencos_cuarzo", label: "Cuencos de Cuarzo" },
  { id: "gongs", label: "Gongs" },
  { id: "campanas_viento", label: "Campanas de Viento" },
  { id: "vientos", label: "Vientos" },
  { id: "cantos", label: "Cantos" },
  { id: "percusion", label: "Percusión" },
  { id: "mantras", label: "Mantras" },
  { id: "solfeggio", label: "Solfeggio" },
  { id: "ruidos", label: "Ruidos" },
  { id: "frecuencias", label: "Frecuencias" },
  { id: "asmr", label: "ASMR" },
  { id: "bpm", label: "BPM" },
];

export interface MixSound {
  id: string;
  name: string;
  /** Nombre del ícono (según iconSet) */
  icon: string;
  iconSet: SoundIconSet;
  category: SoundCategoryId;
  /** Etiquetas/atributos transversales (un sonido puede tener varias) */
  tags?: SoundTagId[];
  /** Si es true, requiere premium para usarse */
  isPremium?: boolean;
}

export const SOUNDS: MixSound[] = [
  // ── Animales ────────────────────────────────────────────────
  { id: "pajaros",  name: "Pájaros",  icon: "leaf",        iconSet: "ionicons", category: "animales", tags: ["naturaleza"] },
  { id: "grillos",  name: "Grillos",  icon: "moon",        iconSet: "feather",  category: "animales", tags: ["naturaleza"] },

  // ── Bosque ──────────────────────────────────────────────────
  { id: "bosque",   name: "Bosque",   icon: "leaf",        iconSet: "ionicons", category: "bosque", tags: ["naturaleza"] },
  { id: "viento",   name: "Viento",   icon: "wind",        iconSet: "feather",  category: "bosque", tags: ["naturaleza"] },

  // ── Mar ─────────────────────────────────────────────────────
  { id: "oceano",   name: "Océano",   icon: "water",       iconSet: "ionicons", category: "mar", tags: ["naturaleza"] },
  { id: "lluvia",   name: "Lluvia",   icon: "rainy",       iconSet: "ionicons", category: "mar", tags: ["naturaleza"] },
  { id: "rio",      name: "Río",      icon: "droplet",     iconSet: "feather",  category: "mar", tags: ["naturaleza"] },
  { id: "arroyo",   name: "Arroyo",   icon: "droplet",     iconSet: "feather",  category: "mar", tags: ["naturaleza"] },
  { id: "cascada",  name: "Cascada",  icon: "water",       iconSet: "ionicons", category: "mar", tags: ["naturaleza"], isPremium: true },

  // ── Fuego ───────────────────────────────────────────────────
  { id: "fogata",   name: "Fogata",   icon: "flame",       iconSet: "ionicons", category: "fuego", tags: ["naturaleza"], isPremium: true },

  // ── Desierto ────────────────────────────────────────────────
  { id: "tormenta", name: "Tormenta", icon: "thunderstorm", iconSet: "ionicons", category: "desierto", tags: ["naturaleza"] },
  { id: "noche",    name: "Noche",    icon: "moon",         iconSet: "feather",  category: "desierto", tags: ["naturaleza"], isPremium: true },

  // ── Cuencos Tibetanos ───────────────────────────────────────
  { id: "cuencos", name: "Cuenco tibetano", icon: "musical-notes", iconSet: "ionicons", category: "cuencos_tibetanos", tags: ["armonicos"] },
  { id: "cuenco_grave", name: "Cuenco grave", icon: "musical-notes", iconSet: "ionicons", category: "cuencos_tibetanos", tags: ["armonicos"] },
  { id: "cuenco_agudo", name: "Cuenco agudo", icon: "musical-notes", iconSet: "ionicons", category: "cuencos_tibetanos", tags: ["armonicos"], isPremium: true },

  // ── Cuencos de Cuarzo ───────────────────────────────────────
  { id: "cuarzo_do", name: "Cuarzo · Do", icon: "disc", iconSet: "feather", category: "cuencos_cuarzo", tags: ["armonicos", "psicodelicas"] },
  { id: "cuarzo_sol", name: "Cuarzo · Sol", icon: "disc", iconSet: "feather", category: "cuencos_cuarzo", tags: ["armonicos", "psicodelicas"] },
  { id: "cuarzo_corazon", name: "Cuarzo · Corazón", icon: "disc", iconSet: "feather", category: "cuencos_cuarzo", tags: ["armonicos", "psicodelicas"], isPremium: true },

  // ── Gongs ───────────────────────────────────────────────────
  { id: "gong", name: "Gong", icon: "radio", iconSet: "feather", category: "gongs", tags: ["armonicos"] },
  { id: "gong_planetario", name: "Gong planetario", icon: "radio", iconSet: "feather", category: "gongs", tags: ["armonicos", "psicodelicas"], isPremium: true },

  // ── Campanas de Viento ──────────────────────────────────────
  { id: "campanas_viento", name: "Campanas de viento", icon: "musical-note", iconSet: "ionicons", category: "campanas_viento", tags: ["armonicos"] },
  { id: "campanas_bambu", name: "Campanas de bambú", icon: "musical-note", iconSet: "ionicons", category: "campanas_viento", tags: ["armonicos"] },

  // ── Mantras ─────────────────────────────────────────────────
  { id: "mantra_om", name: "Om", icon: "mic", iconSet: "feather", category: "mantras", tags: ["armonicos"] },
  { id: "mantra_soham", name: "So Ham", icon: "mic", iconSet: "feather", category: "mantras", tags: ["armonicos"], isPremium: true },

  // ── Solfeggio ───────────────────────────────────────────────
  { id: "solfeggio_528", name: "528 Hz", icon: "activity", iconSet: "feather", category: "solfeggio", tags: ["solfeggio", "binaural"] },
  { id: "solfeggio_432", name: "432 Hz", icon: "activity", iconSet: "feather", category: "solfeggio", tags: ["solfeggio", "binaural"] },
  { id: "solfeggio_396", name: "396 Hz", icon: "activity", iconSet: "feather", category: "solfeggio", tags: ["solfeggio", "binaural"], isPremium: true },

  // ── Ruidos (de color) ───────────────────────────────────────
  { id: "ruido_blanco", name: "Ruido blanco", icon: "radio", iconSet: "feather", category: "ruidos", tags: ["psicodelicas"] },
  { id: "ruido_rosa", name: "Ruido rosa", icon: "radio", iconSet: "feather", category: "ruidos", tags: ["psicodelicas"] },
  { id: "ruido_marron", name: "Ruido marrón", icon: "radio", iconSet: "feather", category: "ruidos", tags: ["psicodelicas"] },
  { id: "ruido_azul", name: "Ruido azul", icon: "radio", iconSet: "feather", category: "ruidos", tags: ["psicodelicas"] },

  // ── Frecuencias (ondas cerebrales isocrónicas) ──────────────
  { id: "onda_delta", name: "Delta · Sueño", icon: "activity", iconSet: "feather", category: "frecuencias", tags: ["binaural"] },
  { id: "onda_theta", name: "Theta · Meditar", icon: "activity", iconSet: "feather", category: "frecuencias", tags: ["binaural", "psicodelicas"] },
  { id: "onda_alpha", name: "Alpha · Calma", icon: "activity", iconSet: "feather", category: "frecuencias", tags: ["binaural"] },
  { id: "onda_beta", name: "Beta · Enfoque", icon: "activity", iconSet: "feather", category: "frecuencias", tags: ["binaural"] },
  { id: "onda_gamma", name: "Gamma · Claridad", icon: "activity", iconSet: "feather", category: "frecuencias", tags: ["binaural", "psicodelicas"] },
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
