/**
 * GALERÍA DE IMÁGENES PARA MEZCLAS — "Mi Música"
 * ─────────────────────────────────────────────────────────────────
 * El usuario elige una de estas imágenes como portada de su mezcla.
 * Reutilizamos las imágenes de los sonidos (assets/images/mixer/*.png)
 * vía SOUND_IMAGE_MAP — son livianas y ya se bundlean.
 *
 * `MIX_IMAGE_GALLERY` es el orden en que se muestran en el selector.
 * El valor guardado en `MixPreset.image` es la KEY (ej: "lluvia").
 * ─────────────────────────────────────────────────────────────────
 */
import type { ImageSourcePropType } from "react-native";

import { SOUND_IMAGE_MAP } from "./sound-images";

export const MIX_IMAGE_GALLERY: string[] = [
  "noche",
  "oceano",
  "lluvia",
  "bosque",
  "fogata",
  "cuencos",
  "drone",
  "cafe",
  "rio",
  "viento",
  "tormenta",
  "tren",
];

export function getMixImage(key?: string): ImageSourcePropType | undefined {
  if (!key) return undefined;
  return SOUND_IMAGE_MAP[key] as ImageSourcePropType | undefined;
}

/** Imagen por defecto cuando una mezcla no tiene portada asignada. */
export const DEFAULT_MIX_IMAGE_KEY = "noche";
