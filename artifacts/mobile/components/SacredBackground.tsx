import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";

export function SacredBackground() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {/* Glow cálido dorado — esquina superior derecha */}
      <LinearGradient
        colors={["rgba(182,149,95,0.10)", "rgba(182,149,95,0.00)"]}
        start={{ x: 1, y: 0 }}
        end={{ x: 0.2, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Glow verde profundo — centro-izquierda */}
      <LinearGradient
        colors={["rgba(62,83,70,0.00)", "rgba(62,83,70,0.18)", "rgba(62,83,70,0.00)"]}
        start={{ x: 0, y: 0.3 }}
        end={{ x: 1, y: 0.8 }}
        style={StyleSheet.absoluteFill}
      />
      {/* Vignette sutil en los bordes */}
      <LinearGradient
        colors={["rgba(0,0,0,0.18)", "rgba(0,0,0,0.00)", "rgba(0,0,0,0.22)"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
    </View>
  );
}
