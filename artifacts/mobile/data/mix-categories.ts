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

export type MixCategory = "dormir" | "trabajar" | "motivarme" | "concentracion" | "energizar";

export type MixCategoryMeta = {
  id: MixCategory;
  label: string;
  subtitle: string;
  icon: FeatherIconName | MCIIconName;
  iconFamily?: "Feather" | "MaterialCommunityIcons";
  image: ImageSourcePropType;
};

export const MIX_CATEGORIES: MixCategoryMeta[] = [
  {
    id: "dormir",
    label: "Descanso",
    subtitle: "Mezclas para descansar",
    icon: "moon",
    image: require("@/assets/images/mixer/categories/dormir.jpg"),
  },
  {
    id: "motivarme",
    label: "Meditación",
    subtitle: "Calma y presencia",
    icon: "meditation",
    iconFamily: "MaterialCommunityIcons",
    image: require("@/assets/images/mixer/categories/motivarme.jpg"),
  },
  {
    id: "concentracion",
    label: "Enfoque",
    subtitle: "Foco y claridad mental",
    icon: "image-filter-hdr",
    iconFamily: "MaterialCommunityIcons",
    image: require("@/assets/images/mixer/categories/concentracion.jpg"),
  },
  {
    id: "energizar",
    label: "Energizar",
    subtitle: "Activa tu energía",
    icon: "zap",
    // Placeholder: reutiliza la imagen de "motivarme" hasta tener una propia.
    image: require("@/assets/images/mixer/categories/motivarme.jpg"),
  },
];

export function getCategoryMeta(id: MixCategory): MixCategoryMeta | undefined {
  return MIX_CATEGORIES.find((c) => c.id === id);
}
