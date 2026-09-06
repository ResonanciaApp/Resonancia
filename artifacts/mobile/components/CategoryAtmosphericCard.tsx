import React from "react";
import { StyleSheet, View, type ViewStyle, type StyleProp } from "react-native";
import Svg, {
  Defs,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

const CATEGORY_GLOW_COLORS: Record<string, {
  primary: string;
  diffuse: string;
}> = {
  "sonidos-ancestrales": {
    primary: "#FFAA68",
    diffuse: "#E85045",
  },
  "meditaciones-guiadas": {
    primary: "#A989D8",
    diffuse: "#7251A3",
  },
  "musica-sonidos": {
    primary: "#63B7BA",
    diffuse: "#287F83",
  },
  descanso: {
    primary: "#76ADD0",
    diffuse: "#32708E",
  },
  ambientales: {
    primary: "#78A982",
    diffuse: "#3F704D",
  },
  historias: {
    primary: "#B46AAA",
    diffuse: "#691E5E",
  },
  charlas: {
    primary: "#C36B62",
    diffuse: "#78221E",
  },
};

const FALLBACK_GLOW_COLORS = {
  primary: "#D9B66F",
  diffuse: "#9A7340",
};

type Props = {
  categoryId?: string;
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
};

export function CategoryAtmosphericCard({
  categoryId,
  children,
  style,
}: Props) {
  const gradientId = React.useId().replace(/:/g, "");
  const primaryGradientId = `categoryGlowPrimary-${gradientId}`;
  const diffuseGradientId = `categoryGlowDiffuse-${gradientId}`;
  const glow = categoryId
    ? CATEGORY_GLOW_COLORS[categoryId] ?? FALLBACK_GLOW_COLORS
    : FALLBACK_GLOW_COLORS;
  const emphasizeGlow =
    categoryId === "meditaciones-guiadas" || categoryId === "musica-sonidos";
  const primaryCenterOpacity = emphasizeGlow ? 0.18 : 0.13;
  const primaryDiffuseOpacity = emphasizeGlow ? 0.1 : 0.07;
  const secondaryCenterOpacity = emphasizeGlow ? 0.16 : 0.12;
  const secondaryDiffuseOpacity = emphasizeGlow ? 0.07 : 0.05;

  return (
    <View style={[styles.card, style]}>
      <Svg
        pointerEvents="none"
        width="100%"
        height="100%"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={StyleSheet.absoluteFill}
      >
        <Defs>
          <RadialGradient
            id={primaryGradientId}
            cx="78%"
            cy="18%"
            rx="76%"
            ry="112%"
          >
            <Stop offset="0" stopColor={glow.primary} stopOpacity={primaryCenterOpacity} />
            <Stop offset="0.3" stopColor={glow.primary} stopOpacity={primaryDiffuseOpacity} />
            <Stop offset="0.78" stopColor={glow.primary} stopOpacity={0} />
          </RadialGradient>
          <RadialGradient
            id={diffuseGradientId}
            cx="18%"
            cy="92%"
            rx="82%"
            ry="120%"
          >
            <Stop offset="0" stopColor={glow.diffuse} stopOpacity={secondaryCenterOpacity} />
            <Stop offset="0.32" stopColor={glow.diffuse} stopOpacity={secondaryDiffuseOpacity} />
            <Stop offset="0.8" stopColor={glow.diffuse} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100" height="100" fill="rgba(255,255,255,0.045)" />
        <Rect width="100" height="100" fill={`url(#${primaryGradientId})`} />
        <Rect width="100" height="100" fill={`url(#${diffuseGradientId})`} />
      </Svg>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    overflow: "hidden",
  },
});