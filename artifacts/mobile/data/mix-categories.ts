/**
 * CATEGORÍAS DE MEZCLAS — "Mi Música"
 * ─────────────────────────────────────────────────────────────────
 * Las 3 categorías a las que el usuario asigna sus mezclas creadas.
 * Cada categoría tiene su imagen de portada (assets/images/mixer/categories).
 * Nota: los IDs internos se mantienen por compatibilidad con el backend;
 * las etiquetas visibles son las que se muestran al usuario.
 * ─────────────────────────────────────────────────────────────────
 */
import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import type { ImageSourcePropType } from "react-native";

type FeatherIconName = ComponentProps<typeof Feather>["name"];

export type MixCategory = "dormir" | "trabajar" | "motivarme" | "concentracion";

export type MixCategoryMeta = {
  id: MixCategory;
  label: string;
  subtitle: string;
  icon: FeatherIconName;
  image: ImageSourcePropType;
};

export const MIX_CATEGORIES: MixCategoryMeta[] = [
  {
    id: "dormir",
    label: "Descanso profundo",
    subtitle: "Mezclas para descansar",
    icon: "moon",
    image: require("@/assets/images/mixer/categories/dormir.jpg"),
  },
  {
    id: "motivarme",
    label: "Meditación",
    subtitle: "Calma y presencia",
    icon: "feather",
    image: require("@/assets/images/mixer/categories/motivarme.jpg"),
  },
  {
    id: "concentracion",
    label: "Concentración",
    subtitle: "Foco y claridad mental",
    icon: "zap",
    image: require("@/assets/images/mixer/categories/concentracion.jpg"),
  },
];

export function getCategoryMeta(id: MixCategory): MixCategoryMeta | undefined {
  return MIX_CATEGORIES.find((c) => c.id === id);
}
