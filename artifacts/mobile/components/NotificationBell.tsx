import { router } from "expo-router";
import React, { useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";

import { usePlayer } from "@/context/PlayerContext";

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function computeStreak(events: { playedAt: string }[]): number {
  if (events.length === 0) return 0;
  const days = new Set(events.map((e) => dayKey(new Date(e.playedAt))));
  const today = new Date();
  const todayKey = dayKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yKey = dayKey(yesterday);
  let cursor: Date;
  if (days.has(todayKey)) cursor = today;
  else if (days.has(yKey)) cursor = yesterday;
  else return 0;
  let count = 0;
  const walk = new Date(cursor);
  while (days.has(dayKey(walk))) {
    count++;
    walk.setDate(walk.getDate() - 1);
  }
  return count;
}

export function NotificationBell() {
  const { statEvents } = usePlayer();
  const streak = useMemo(() => computeStreak(statEvents), [statEvents]);

  return (
    <Pressable
      onPress={() => router.push("/progreso" as never)}
      hitSlop={12}
      style={styles.btn}
    >
      <Image
        source={require("@/assets/images/flor-de-loto.png")}
        style={styles.lotus}
        resizeMode="contain"
      />
      {streak > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{streak}</Text>
        </View>
      )}
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
  lotus: {
    width: 26,
    height: 26,
    tintColor: "#FFFFFF",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    backgroundColor: "#BE9650",
    borderRadius: 10,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#0B0F14",
    fontSize: 10,
    fontWeight: "700",
    lineHeight: 13,
  },
});
