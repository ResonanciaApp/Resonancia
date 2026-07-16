import { StyleSheet, View } from "react-native";

/**
 * Fondo de card/módulo sensible al tema activo.
 * Tinte negro 0.27 opacidad sobre cualquier tema.
 */
export function CardTint() {
  return <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.27)" }]} />;
}
