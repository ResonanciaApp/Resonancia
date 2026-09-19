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

export function CategoryIcon({
  category,
  size = 24,
  active = false,
  neutralWhenInactive = false,
}: {
  category: ReflectionCategory;
  size?: number;
  active?: boolean;
  neutralWhenInactive?: boolean;
}) {
  const cat = REFLECTION_CATEGORIES[category];
  const IconComp = cat.iconFamily === "Feather" ? Feather : MaterialCommunityIcons;
  const isNeutral = neutralWhenInactive && !active;
  return (
    <View
      style={[
        {
          backgroundColor: isNeutral ? "transparent" : cat.bg,
          width: size * 2.2,
          height: size * 2.2,
          borderRadius: size * 1.1,
          alignItems: "center",
          justifyContent: "center",
        },
      ]}
    >
      <IconComp name={cat.icon as any} size={size} color={isNeutral ? "#F9F9F9" : cat.color} />
    </View>
  );
}