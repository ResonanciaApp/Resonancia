import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

import { useSceneTheme } from "@/context/SceneThemeContext";

/**
 * Fondo de card/módulo sensible al tema activo.
 * - "vino-tinto" → blur oscuro + tinte del tema (look original)
 * - resto         → tinte negro 0.27 opacidad
 */
export function CardTint() {
  const { theme } = useSceneTheme();

  if (theme.id === "vino-tinto") {
    return (
      <>
        <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} pointerEvents="none" />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255,255,255,0.07)" }]} />
        <View style={[StyleSheet.absoluteFill, { backgroundColor: `${theme.gradient[0]}73` }]} />
        <LinearGradient
          colors={["rgba(255,255,255,0.01)", "rgba(255,255,255,0)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      </>
    );
  }

  return <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.27)" }]} />;
}
