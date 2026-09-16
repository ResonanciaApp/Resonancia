import MaskedView from "@react-native-masked-view/masked-view";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { useSceneTheme } from "@/context/SceneThemeContext";
import { useStreak } from "@/hooks/useStreak";

const DAY_INITIALS = ["L", "M", "X", "J", "V", "S", "D"];

function brightenColor(hex: string, pct: number): string {
  const value = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(value)) return hex;
  const channels = [0, 2, 4].map((offset) =>
    Number.parseInt(value.slice(offset, offset + 2), 16),
  );
  return `rgb(${channels
    .map((channel) => Math.round(channel + (255 - channel) * (pct / 100)))
    .join(",")})`;
}

export function StreakWeekRow() {
  const { weekFlags, todayIndex } = useStreak();
  const { theme } = useSceneTheme();
  const borderGradient = useMemo(
    () =>
      theme.gradient.map((color) =>
        brightenColor(color, 47),
      ) as unknown as [string, string, ...string[]],
    [theme.gradient],
  );

  return (
    <View style={styles.row}>
      {DAY_INITIALS.map((initial, index) => {
        const active = weekFlags[index];
        const isToday = todayIndex === index;
        const hasGradientRing = isToday || active;
        const dayCircle = (
          <View style={styles.day}>
            {active ? <Feather name="check" size={22} color="#F9F9F9" /> : null}
          </View>
        );

        return (
          <View key={`${initial}-${index}`} style={styles.dayWrapper}>
            {hasGradientRing ? (
              <View style={styles.ringHost}>
                {dayCircle}
                <MaskedView
                  pointerEvents="none"
                  style={StyleSheet.absoluteFill}
                  maskElement={<View style={styles.ringMask} />}
                >
                  <LinearGradient
                    colors={borderGradient}
                    locations={theme.gradientLocations}
                    start={theme.gradientStart}
                    end={theme.gradientEnd}
                    style={StyleSheet.absoluteFill}
                  />
                </MaskedView>
              </View>
            ) : (
              dayCircle
            )}
            <Text style={styles.dayLabel}>{initial}</Text>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayWrapper: {
    alignItems: "center",
    gap: 6,
  },
  day: {
    width: 37,
    height: 37,
    borderRadius: 18.5,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  ringHost: {
    width: 37,
    height: 37,
    borderRadius: 18.5,
  },
  ringMask: {
    flex: 1,
    borderRadius: 18.5,
    borderWidth: 2,
    borderColor: "#000000",
    backgroundColor: "transparent",
  },
  dayLabel: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "500",
  },
});