/**
 * CATEGORÍAS DE MEZCLAS — "Mi Música"
 * ─────────────────────────────────────────────────────────────────
 * Las 3 categorías a las que el usuario asigna sus mezclas creadas.
 * Cada categoría tiene su imagen de portada (assets/images/mixer/categories).
 * Nota: los IDs internos se mantienen por compatibilidad con el backend;
 * las etiquetas visibles son las que se muestran al usuario.
 * ─────────────────────────────────────────────────────────────────
 */
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import type { ImageSourcePropType } from "react-native";

type FeatherIconName = ComponentProps<typeof Feather>["name"];
type MCIIconName = ComponentProps<typeof MaterialCommunityIcons>["name"];

export type MixCategory = "dormir" | "trabajar" | "motivarme" | "concentracion";

export type MixCategoryMeta = {
  id: MixCategory;
  label: string;
  subtitle: string;
  icon: FeatherIconName | MCIIconName | string;
  iconFamily?: "Feather" | "MaterialCommunityIcons" | "Custom";
  color?: string;
  image: ImageSourcePropType;
};

export const MIX_CATEGORIES: MixCategoryMeta[] = [
  {
    id: "dormir",
    label: "Descanso",
    subtitle: "Sonidos para un descanso reparador.",
    icon: "moon-crescent",
    iconFamily: "Custom",
    color: "#B2DFDB",
    image: require("@/assets/images/mixer/categories/dormir.jpg"),
  },
  {
    id: "motivarme",
    label: "Meditación",
    subtitle: "Sonidos que te recuerdan quien eres.",
    icon: "zen-stones",
    iconFamily: "Custom",
    color: "#F7D6E7",
    image: require("@/assets/images/mixer/categories/motivarme.jpg"),
  },
  {
    id: "concentracion",
    label: "Enfoque",
    subtitle: "Sonidos que te alinean con tus metas.",
    icon: "image-filter-hdr",
    iconFamily: "MaterialCommunityIcons",
    color: "#d49f6b",
    image: require("@/assets/images/mixer/categories/concentracion.jpg"),
  },
];

export function getCategoryMeta(id: MixCategory): MixCategoryMeta | undefined {
  return MIX_CATEGORIES.find((c) => c.id === id);
}
