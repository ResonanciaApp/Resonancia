import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

/** Color sólido cálido por defecto para el modo `solid` (estilo Calm/Pura Mente). */
const SOLID_BG = "#18110C";

type SacredBackgroundProps = {
  /**
   * Modo de fondo:
   * - "texture" (default): textura + glow dorado + viñeta (look original).
   * - "solid": color plano cálido, sin textura ni degradados (look Calm).
   */
  variant?: "texture" | "solid";
  /** Color del fondo sólido (solo aplica con variant="solid"). */
  solidColor?: string;
};

export function SacredBackground({ variant = "texture", solidColor = SOLID_BG }: SacredBackgroundProps) {
  if (variant === "solid") {
    return (
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: solidColor }]}
        pointerEvents="none"
      />
    );
  }

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image
        source={require("../assets/images/bg-texture.jpg")}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        priority="high"
        cachePolicy="memory-disk"
      />
      {/* Overlay ligero — la imagen ya es oscura */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(8,4,2,0.72)" }]} />
      {/* Glow cálido dorado — esquina superior derecha */}
      <LinearGradient
        colors={["rgba(182,149,95,0.05)", "rgba(182,149,95,0.00)"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.2, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Vignette sutil en los bordes */}
      <LinearGradient
        colors={["rgba(0,0,0,0.10)", "rgba(0,0,0,0.00)", "rgba(0,0,0,0.14)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
