import { useColorScheme } from "react-native";

import colors from "@/constants/colors";
import { useSceneTheme } from "@/context/SceneThemeContext";

/**
 * Returns the design tokens for the current color scheme,
 * with `primary` overridden per active scene theme.
 */
export function useColors() {
  const scheme = useColorScheme();
  const palette =
    scheme === "dark" && "dark" in colors
      ? (colors as Record<string, typeof colors.light>).dark
      : colors.light;

  const { activeSceneId } = useSceneTheme();
  const primary =
    activeSceneId === "tibet" || activeSceneId === "indigo" || activeSceneId === "indigo2" ? "#ACACC1" : palette.primary;

  return { ...palette, primary, radius: colors.radius };
}
