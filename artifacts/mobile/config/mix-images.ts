/**
 * GALERÍA DE IMÁGENES PARA MEZCLAS — "Mi Música"
 * ─────────────────────────────────────────────────────────────────
 * El usuario elige una de estas imágenes como portada de su mezcla.
 * Reutilizamos las imágenes de los sonidos (assets/images/mixer/*.jpg)
 * vía SOUND_IMAGE_MAP — son livianas y ya se bundlean.
 *
 * `MIX_IMAGE_GALLERY` incluye todas las imágenes disponibles.
 * El valor guardado en `MixPreset.image` es la KEY (ej: "lluvia").
 * ─────────────────────────────────────────────────────────────────
 */
import type { ImageSourcePropType } from "react-native";

import { SOUND_IMAGE_MAP } from "./sound-images";

export const MIX_IMAGE_GALLERY: string[] = Object.keys(SOUND_IMAGE_MAP);

export function getMixImage(key?: string): ImageSourcePropType | undefined {
  if (!key) return undefined;
  return SOUND_IMAGE_MAP[key] as ImageSourcePropType | undefined;
}

/** Formatea una key para mostrarla como etiqueta legible.
 *  "cuenco_grave" → "Cuenco Grave" */
export function formatMixImageLabel(key: string): string {
  return key
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
}

/** Imagen por defecto cuando una mezcla no tiene portada asignada.
 *  String vacío → getMixImage("") devuelve undefined → MixCover muestra
 *  el fallback (fondo dorado sutil + ícono de mezclador). */
export const DEFAULT_MIX_IMAGE_KEY = "";
