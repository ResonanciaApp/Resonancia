import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import { useSceneTheme } from "@/context/SceneThemeContext";

type SacredBackgroundProps = {
  /**
   * Modo de fondo:
   * - "solid" (default): plano, sin textura ni degradados (look Calm/Pura Mente).
   *   Si no se pasa `solidColor`, pinta el color sólido del tema de Escena
   *   activo (Task #82) — así las pantallas que ya usan este componente sin
   *   color propio reaccionan automáticamente al cambiar de Escena. Las
   *   pantallas que SÍ pasan `solidColor` (identidad de categoría) conservan
   *   su color explícito por ahora — la migración de esas es progresiva.
   * - "texture": textura + glow dorado + viñeta (look original, legacy).
   * - "gradient": degradado del tema de Escena activo (`theme.gradient`),
   *   el mismo look que usa Inicio (`LinearGradient` de arriba a abajo).
   */
  variant?: "texture" | "solid" | "gradient";
  /** Color del fondo sólido (solo aplica con variant="solid"). */
  solidColor?: string;
};

export function SacredBackground({ variant = "solid", solidColor }: SacredBackgroundProps) {
  const { theme } = useSceneTheme();

  if (variant === "solid") {
    return (
      <View
        style={[StyleSheet.absoluteFill, { backgroundColor: solidColor ?? theme.solid }]}
        pointerEvents="none"
      />
    );
  }

  if (variant === "gradient") {
    if (theme.backgroundImage != null) {
      return (
        <View style={StyleSheet.absoluteFill} pointerEvents="none">
          <Image
            source={theme.backgroundImage}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            priority="high"
            cachePolicy="memory-disk"
          />
          {/* Overlay oscuro para mantener legibilidad */}
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.52)" }]} />
          {/* Degradado del tema encima — aporta el tinte de color */}
          <LinearGradient
            colors={[`${theme.gradient[0]}99`, `${theme.gradient[1]}CC`]}
            style={StyleSheet.absoluteFill}
          />
        </View>
      );
    }
    return (
      <LinearGradient
        colors={theme.gradient}
        style={StyleSheet.absoluteFill}
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
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(27,6,15,0.72)" }]} />
      {/* Glow cálido dorado — esquina superior derecha */}
      <LinearGradient
        colors={["rgba(212,175,55,0.05)", "rgba(212,175,55,0.00)"]}
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
