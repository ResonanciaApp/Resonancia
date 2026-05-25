import { Feather } from "@expo/vector-icons";
import { useAuth as useClerkAuth } from "@clerk/expo";
import {
  getGetUnreadNotificationCountQueryKey,
  useGetUnreadNotificationCount,
} from "@workspace/api-client-react";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { useColors } from "@/hooks/useColors";

export function NotificationBell() {
  const colors = useColors();
  const { isSignedIn } = useClerkAuth();

  const q = useGetUnreadNotificationCount({
    query: {
      queryKey: getGetUnreadNotificationCountQueryKey(),
      enabled: !!isSignedIn,
      refetchInterval: 10_000,
      refetchOnWindowFocus: true,
    },
  });

  const count = q.data?.count ?? 0;

  return (
    <Pressable
      onPress={() => router.push("/notificaciones")}
      hitSlop={12}
      style={[styles.btn, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <Feather name="bell" size={18} color={colors.accent} />
      {isSignedIn && count > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.primary, borderColor: colors.background }]}>
          <Text style={styles.badgeText}>{count > 9 ? "9+" : count}</Text>
        </View>
      )}
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
  badge: {
    position: "absolute",
    top: -3,
    right: -3,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
    paddingHorizontal: 4,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { color: "#1A0E06", fontSize: 10, fontWeight: "700" },
});
