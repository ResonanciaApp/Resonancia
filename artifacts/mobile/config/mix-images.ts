/**
 * GALERÍA DE IMÁGENES PARA MEZCLAS — "Mi Música"
 * ─────────────────────────────────────────────────────────────────
 * El usuario elige una de estas imágenes como portada de su mezcla.
 * Usa únicamente portadas genéricas de categoría. Las imágenes por-sonido se
 * administran desde Admin y no forman parte del bundle.
 *
 * `MIX_IMAGE_GALLERY` incluye todas las imágenes disponibles.
 * El valor guardado en `MixPreset.image` es la KEY (ej: "lluvia").
 * ─────────────────────────────────────────────────────────────────
 */
import type { ImageSourcePropType } from "react-native";

const MIX_IMAGE_MAP: Record<string, ImageSourcePropType> = {
  concentracion: require("@/assets/images/mixer/categories/concentracion.jpg"),
  dormir: require("@/assets/images/mixer/categories/dormir.jpg"),
  motivarme: require("@/assets/images/mixer/categories/motivarme.jpg"),
};

export const MIX_IMAGE_GALLERY: string[] = Object.keys(MIX_IMAGE_MAP);

export function getMixImage(key?: string): ImageSourcePropType | undefined {
  if (!key) return undefined;
  return MIX_IMAGE_MAP[key] ?? MIX_IMAGE_MAP[DEFAULT_MIX_IMAGE_KEY];
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
export const DEFAULT_MIX_IMAGE_KEY = "dormir";
