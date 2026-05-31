import { SOUND_MAP } from "@/config/sound-map";

/**
 * Catálogo de sonidos del mixer "Mi Música".
 * Los archivos de audio viven en config/sound-map.ts (SOUND_MAP).
 * Un sonido sin archivo en SOUND_MAP se muestra como "Próximamente".
 */

export type SoundIconSet = "feather" | "ionicons";
export type SoundCategoryId = "naturaleza" | "tonales" | "lugares";

export interface SoundCategory {
  id: SoundCategoryId;
  label: string;
}

export const SOUND_CATEGORIES: SoundCategory[] = [
  { id: "naturaleza", label: "Naturaleza" },
  { id: "tonales", label: "Tonales" },
  { id: "lugares", label: "Lugares" },
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
  { id: "lluvia", name: "Lluvia", icon: "rainy", iconSet: "ionicons", category: "naturaleza" },
  { id: "tormenta", name: "Tormenta", icon: "thunderstorm", iconSet: "ionicons", category: "naturaleza" },
  { id: "oceano", name: "Océano", icon: "water", iconSet: "ionicons", category: "naturaleza" },
  { id: "rio", name: "Río", icon: "droplet", iconSet: "feather", category: "naturaleza" },
  { id: "viento", name: "Viento", icon: "wind", iconSet: "feather", category: "naturaleza" },
  { id: "fogata", name: "Fogata", icon: "flame", iconSet: "ionicons", category: "naturaleza", isPremium: true },
  { id: "bosque", name: "Bosque", icon: "leaf", iconSet: "ionicons", category: "naturaleza" },
  { id: "noche", name: "Noche", icon: "moon", iconSet: "feather", category: "naturaleza", isPremium: true },

  // ── Tonales ─────────────────────────────────────────────────
  { id: "ruido_blanco", name: "Ruido blanco", icon: "radio", iconSet: "feather", category: "tonales" },
  { id: "ruido_rosa", name: "Ruido rosa", icon: "radio", iconSet: "feather", category: "tonales", isPremium: true },
  { id: "ruido_marron", name: "Ruido marrón", icon: "radio", iconSet: "feather", category: "tonales", isPremium: true },
  { id: "cuencos", name: "Cuencos", icon: "musical-notes", iconSet: "ionicons", category: "tonales" },
  { id: "drone", name: "Drone cósmico", icon: "disc", iconSet: "feather", category: "tonales", isPremium: true },

  // ── Lugares ─────────────────────────────────────────────────
  { id: "cafe", name: "Café", icon: "cafe", iconSet: "ionicons", category: "lugares" },
  { id: "tren", name: "Tren", icon: "train", iconSet: "ionicons", category: "lugares", isPremium: true },
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
