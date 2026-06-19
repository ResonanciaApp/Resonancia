import React from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useNotifications } from "@/context/NotificationsContext";

const CUENCO_ICON = require("@/assets/images/cuenco-icon.png");

export function CuencoBell() {
  const { unreadCount } = useNotifications();
  const hasBadge = unreadCount > 0;

  return (
    <Pressable
      onPress={() => router.push("/notificaciones" as never)}
      hitSlop={10}
      style={styles.btn}
    >
      <Image
        source={CUENCO_ICON}
        style={[styles.icon, !hasBadge && styles.iconMuted]}
        resizeMode="contain"
      />
      {hasBadge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 9 ? "9+" : String(unreadCount)}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  icon: {
    width: 28,
    height: 28,
  },
  iconMuted: {
    opacity: 0.42,
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: "#D4AF37",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#1B060F",
    fontSize: 8,
    fontWeight: "800",
    lineHeight: 11,
  },
});
