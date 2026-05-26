import { LinearGradient } from "expo-linear-gradient";
import { Image, StyleSheet, View } from "react-native";

export function SacredBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Imagen de textura base */}
      <Image
        source={require("../assets/images/bg-texture.png")}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />
      {/* Overlay oscuro para contraste */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(4,8,5,0.72)" }]} />
      {/* Glow cálido dorado — esquina superior derecha */}
      <LinearGradient
        colors={["rgba(182,149,95,0.05)", "rgba(182,149,95,0.00)"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.2, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Vignette sutil en los bordes */}
      <LinearGradient
        colors={["rgba(0,0,0,0.12)", "rgba(0,0,0,0.00)", "rgba(0,0,0,0.18)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
