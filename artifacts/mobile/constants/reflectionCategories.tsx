import React from "react";
import { View } from "react-native";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import type { ReflectionCategory } from "@workspace/api-client-react";

export const REFLECTION_CATEGORIES: Record<
  ReflectionCategory,
  {
    id: ReflectionCategory;
    label: string;
    icon: string;
    iconFamily: "MaterialCommunityIcons" | "Feather";
    color: string;
    bg: string;
  }
> = {
  gratitude: { id: "gratitude", label: "Gratitud", icon: "cards-heart", iconFamily: "MaterialCommunityIcons", color: "#F075B3", bg: "rgba(240, 117, 179, 0.15)" },
  understanding: { id: "understanding", label: "Entendimiento", icon: "brain", iconFamily: "MaterialCommunityIcons", color: "#8B95EE", bg: "rgba(139, 149, 238, 0.15)" },
  clarity: { id: "clarity", label: "Claridad", icon: "white-balance-sunny", iconFamily: "MaterialCommunityIcons", color: "#F2C94C", bg: "rgba(242, 201, 76, 0.15)" },
  calm: { id: "calm", label: "Calma", icon: "flower-tulip", iconFamily: "MaterialCommunityIcons", color: "#B875F0", bg: "rgba(184, 117, 240, 0.15)" },
  purpose: { id: "purpose", label: "Propósito", icon: "sprout", iconFamily: "MaterialCommunityIcons", color: "#5FCA81", bg: "rgba(95, 202, 129, 0.15)" },
  acceptance: { id: "acceptance", label: "Aceptación", icon: "triangle", iconFamily: "Feather", color: "#5FA1CA", bg: "rgba(95, 161, 202, 0.15)" },
};

export const REFLECTION_CATEGORY_OPTIONS = [
  REFLECTION_CATEGORIES.gratitude,
  REFLECTION_CATEGORIES.purpose,
  REFLECTION_CATEGORIES.acceptance,
  REFLECTION_CATEGORIES.calm,
  REFLECTION_CATEGORIES.clarity,
];

export function CategoryIcon({
  category,
  size = 24,
  containerSize,
  active = false,
  neutralWhenInactive = false,
  inactiveColor = "#F9F9F9",
}: {
  category: ReflectionCategory;
  size?: number;
  containerSize?: number;
  active?: boolean;
  neutralWhenInactive?: boolean;
  inactiveColor?: string;
}) {
  const cat = REFLECTION_CATEGORIES[category];
  const IconComp = cat.iconFamily === "Feather" ? Feather : MaterialCommunityIcons;
  const isNeutral = neutralWhenInactive && !active;
  const resolvedContainerSize = containerSize ?? size * 2.2;
  return (
    <View
      style={[
        {
          backgroundColor: neutralWhenInactive ? "transparent" : cat.bg,
          width: neutralWhenInactive ? size : resolvedContainerSize,
          height: neutralWhenInactive ? size : resolvedContainerSize,
          borderRadius: neutralWhenInactive ? 0 : resolvedContainerSize / 2,
          alignSelf: "center",
          alignItems: "center",
          justifyContent: "center",
        },
      ]}
    >
      <IconComp name={cat.icon as any} size={size} color={isNeutral ? inactiveColor : cat.color} />
    </View>
  );
}