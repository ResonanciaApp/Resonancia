import { Feather } from "@expo/vector-icons";
import React from "react";
import { Alert, Pressable, StyleSheet } from "react-native";

import { useColors } from "@/hooks/useColors";

export function NotificationBell() {
  const colors = useColors();

  const handlePress = () => {
    Alert.alert(
      "Próximamente",
      "Las notificaciones llegan en una próxima versión. Vas a poder recibir recordatorios de práctica y avisos de contenido nuevo.",
    );
  };

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={12}
      style={[styles.btn, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <Feather name="bell" size={18} color={colors.accent} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
