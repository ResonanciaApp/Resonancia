import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";

export function NotificationBell() {
  return (
    <Pressable
      onPress={() => router.push("/progreso" as never)}
      hitSlop={12}
      style={styles.btn}
    >
      <Feather name="bar-chart-2" size={18} color="rgba(244,218,213,0.7)" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    height: 32,
    width: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
