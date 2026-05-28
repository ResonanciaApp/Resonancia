import { Feather } from "@expo/vector-icons";
import React from "react";
import { Alert, Pressable, StyleSheet } from "react-native";

type Props = {
  hasUnread?: boolean;
};

export function NotificationBell({ hasUnread = false }: Props) {
  const handlePress = () => {
    Alert.alert(
      "Próximamente",
      "Las notificaciones llegan en una próxima versión. Vas a poder recibir recordatorios de práctica y avisos de contenido nuevo.",
    );
  };

  const color = hasUnread ? "#E6C66A" : "#9A8A78";

  return (
    <Pressable onPress={handlePress} hitSlop={12} style={styles.btn}>
      <Feather name="bell" size={22} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
});
