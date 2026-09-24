import React from "react";
import { View } from "react-native";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import {
  getListReflectionCategoriesQueryKey,
  useListReflectionCategories,
  type ReflectionCategory,
  type ReflectionCategoryConfig,
} from "@workspace/api-client-react";

type ReflectionCategoryPresentation = {
    id: ReflectionCategory;
    label: string;
    icon: string;
    iconFamily: "MaterialCommunityIcons" | "Feather";
    color: string;
    bg: string;
};

export const REFLECTION_CATEGORIES: Record<
  string,
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

const DEFAULT_SORT_ORDER = [ "gratitude", "purpose", "acceptance", "calm", "clarity" ];

function presentation(config: ReflectionCategoryConfig): ReflectionCategoryPresentation {
  const legacy = REFLECTION_CATEGORIES[config.id];
  const color = config.color || legacy?.color || "#B875F0";
  const background = legacy?.bg ?? (
    color.startsWith("rgba(")
      ? color
      : color.startsWith("rgb(")
        ? `${color.slice(0, -1)}, 0.15)`
        : color.startsWith("#") && (color.length === 7 || color.length === 4)
      ? (() => {
        const hex = color.length === 4
          ? color.slice(1).split("").map((part) => part + part).join("")
          : color.slice(1);
        const red = Number.parseInt(hex.slice(0, 2), 16);
        const green = Number.parseInt(hex.slice(2, 4), 16);
        const blue = Number.parseInt(hex.slice(4, 6), 16);
        return `rgba(${red}, ${green}, ${blue}, 0.15)`;
        })()
        : "rgba(184, 117, 240, 0.15)"
  );
  return {
    id: config.id,
    label: config.label,
    icon: config.icon,
    iconFamily: config.iconFamily,
    color,
    bg: background,
  };
}

/**
 * The catalog is server-owned, while this legacy presentation map intentionally
 * remains available for historical reflections and offline rendering.
 */
export function useReflectionCategories() {
  const query = useListReflectionCategories({
    query: {
      queryKey: getListReflectionCategoriesQueryKey(),
      staleTime: 5 * 60 * 1000,
      gcTime: 30 * 60 * 1000,
      retry: 1,
      refetchInterval: 60 * 1000,
      refetchOnWindowFocus: true,
    },
  });
  const catalog = query.data?.items ?? [];
  const active = catalog
    .filter((item) => item.active)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id.localeCompare(b.id))
    .map(presentation);
  const fallback = DEFAULT_SORT_ORDER
    .map((id) => REFLECTION_CATEGORIES[id])
    .filter(Boolean);
  const options = active.length > 0 || query.data ? active : fallback;
  const categories: Record<string, ReflectionCategoryPresentation> = {
    ...REFLECTION_CATEGORIES,
    ...Object.fromEntries(catalog.map((item) => [item.id, presentation(item)])),
  };
  return {
    options,
    categories,
    icons: query.data?.icons ?? [],
    isCatalogLoading: query.isLoading,
    isCatalogError: query.isError,
    isCatalogEmpty: Boolean(query.data && active.length === 0),
    isCatalogStale: Boolean(query.data && query.isFetching),
    refetchCatalog: query.refetch,
  };
}

export function CategoryIcon({
  category,
  categoryConfig,
  size = 24,
  containerSize,
  active = false,
  neutralWhenInactive = false,
  inactiveColor = "#F9F9F9",
}: {
  category: ReflectionCategory;
  categoryConfig?: ReflectionCategoryPresentation;
  size?: number;
  containerSize?: number;
  active?: boolean;
  neutralWhenInactive?: boolean;
  inactiveColor?: string;
}) {
  const cat = categoryConfig ?? REFLECTION_CATEGORIES[category] ?? REFLECTION_CATEGORIES.clarity;
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