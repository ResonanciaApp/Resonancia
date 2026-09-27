import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import { POSITIONED_DAY_GRADIENT } from "@/constants/colors";

const brightenBorderColor = (hex: string) =>
  `#${[1, 3, 5].map((i) =>
    Math.round(Number.parseInt(hex.slice(i, i + 2), 16) * 0.4 + 255 * 0.6)
      .toString(16).padStart(2, "0"),
  ).join("")}`;

const SEARCH_BORDER_GRADIENT: [string, string] = [
  brightenBorderColor(POSITIONED_DAY_GRADIENT[0]),
  brightenBorderColor(POSITIONED_DAY_GRADIENT[1]),
];

export function DiscoverSearchBorder({
  borderRadius = 999,
  borderWidth = 2,
}: {
  borderRadius?: number;
  borderWidth?: number;
}) {
  return (
    <MaskedView
      pointerEvents="none"
      style={styles.gradient}
      maskElement={<View style={[styles.mask, { borderRadius, borderWidth }]} />}
    >
      <LinearGradient
        colors={SEARCH_BORDER_GRADIENT}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  gradient: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.99,
  },
  mask: {
    flex: 1,
    borderColor: "#000000",
    backgroundColor: "transparent",
  },
});