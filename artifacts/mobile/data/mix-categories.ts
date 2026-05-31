/**
 * CATEGORÍAS DE MEZCLAS — "Mi Música"
 * ─────────────────────────────────────────────────────────────────
 * Las 3 categorías a las que el usuario asigna sus mezclas creadas.
 * Cada categoría tiene su imagen de portada (assets/images/mixer/categories).
 * ─────────────────────────────────────────────────────────────────
 */
import { Feather } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import type { ImageSourcePropType } from "react-native";

type FeatherIconName = ComponentProps<typeof Feather>["name"];

export type MixCategory = "dormir" | "trabajar" | "motivarme";

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
    label: "Para Dormir",
    subtitle: "Mezclas para descansar",
    icon: "moon",
    image: require("@/assets/images/mixer/categories/dormir.png"),
  },
  {
    id: "trabajar",
    label: "Para Trabajar",
    subtitle: "Concentración y enfoque",
    icon: "briefcase",
    image: require("@/assets/images/mixer/categories/trabajar.png"),
  },
  {
    id: "motivarme",
    label: "Para Motivarme",
    subtitle: "Energía e inspiración",
    icon: "zap",
    image: require("@/assets/images/mixer/categories/motivarme.png"),
  },
];

export function getCategoryMeta(id: MixCategory): MixCategoryMeta | undefined {
  return MIX_CATEGORIES.find((c) => c.id === id);
}
