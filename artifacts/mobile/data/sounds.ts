/**
 * Tipos y metadatos compartidos del catálogo de sonidos. La API administrada
 * es la única fuente de filas; SOUNDS se actualiza con el último snapshot para
 * mantener compatibles los lookups de vistas antiguas.
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
  | "bpm"
  | "binaural";

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
  { id: "binaural", label: "Binaurales" },
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
  /**
   * BPM del loop. Solo sonidos de category "bpm".
   * Los sonidos del mismo BPM se pueden mezclar entre sí; no se pueden mezclar
   * sonidos de BPM distintos (el mixer lo rechaza automáticamente).
   * Puede ser un array si el sonido aplica a varios BPM (ej. binaurales).
   */
  bpm?: 44 | 50 | 68 | 72 | readonly (44 | 50 | 68 | 72)[];
  /**
   * Número de compases del loop (4/4). Default asumido: 2.
   * Sirve para calcular la cuantización exacta al entrar al siguiente compás.
   */
  loopBars?: number;
  /** URL de audio servido por la API (cuando el sonido no está bundleado). */
  audioUrl?: string;
  /** URL de imagen servida por la API (cuando existe). */
  imageUrl?: string;
  /** El sonido aparece en el selector de fondos de meditación. */
  showInMeditationBackgrounds?: boolean;
  /** Estado publicado en el catálogo remoto. */
  isActive?: boolean;
}

export const SOUNDS: MixSound[] = [];

export function replaceSoundCatalog(sounds: readonly MixSound[]): void {
  SOUNDS.splice(0, SOUNDS.length, ...sounds);
}

export function getMeditationBackgroundSounds(
  sounds: readonly MixSound[],
): MixSound[] {
  return sounds.filter(
    (sound) =>
      sound.showInMeditationBackgrounds === true &&
      typeof sound.audioUrl === "string" &&
      sound.audioUrl.length > 0,
  );
}

/** True when an active catalog row points at a new resolved audio source. */
export function hasAudioSourceRevision(
  previous: MixSound | undefined,
  current: MixSound,
): boolean {
  return (
    !!previous &&
    previous.audioUrl !== current.audioUrl &&
    (!!previous.audioUrl || !!current.audioUrl)
  );
}

export function getSoundById(id: string): MixSound | undefined {
  return SOUNDS.find((s) => s.id === id);
}

/** True si el sonido es compatible con el BPM dado (soporta bpm array). */
export function soundMatchesBpm(sound: MixSound, bpm: number): boolean {
  if (sound.bpm === undefined) return false;
  if (Array.isArray(sound.bpm)) return (sound.bpm as readonly number[]).includes(bpm);
  return sound.bpm === bpm;
}

/**
 * Resuelve el BPM escalar de un sonido. Si bpm es array, elige el que coincide
 * con currentBpm; si no hay coincidencia o currentBpm es null, usa el primero.
 */
export function resolveSoundBpm(sound: MixSound, currentBpm: number | null): 44 | 50 | 68 | 72 | undefined {
  if (sound.bpm === undefined) return undefined;
  if (!Array.isArray(sound.bpm)) return sound.bpm as 44 | 50 | 68 | 72;
  const arr = sound.bpm as readonly (44 | 50 | 68 | 72)[];
  if (currentBpm !== null && arr.some((b) => b === currentBpm)) return arr.find((b) => b === currentBpm)!;
  return arr[0];
}

/** True si el sonido administrado tiene audio remoto disponible. */
export function hasSoundFile(id: string): boolean {
  return !!getSoundById(id)?.audioUrl;
}

export function getSoundsByCategory(category: SoundCategoryId): MixSound[] {
  return SOUNDS.filter((s) => s.category === category);
}
