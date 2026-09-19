import MaskedView from "@react-native-masked-view/masked-view";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useStreak } from "@/hooks/useStreak";

const DAY_INITIALS = ["L", "M", "X", "J", "V", "S", "D"];
const POSITIONED_DAY_GRADIENT = ["#D1B9F5", "#9B80C4", "#8168A5"] as const;

export function StreakWeekRow() {
  const { weekFlags, todayIndex } = useStreak();

  return (
    <View style={styles.row}>
      {DAY_INITIALS.map((initial, index) => {
        const active = weekFlags[index];
        const isToday = todayIndex === index;
        const dayCircle = (
          <View style={styles.day}>
            {active ? (
              <Feather
                name="check"
                size={24}
                color="#FFFFFF"
                style={styles.checkMark}
              />
            ) : (
              <Text style={styles.dayLabel}>{initial}</Text>
            )}
          </View>
        );

        return (
          <View key={`${initial}-${index}`} style={styles.dayWrapper}>
            {isToday ? (
              <View style={styles.ringHost}>
                {dayCircle}
                <MaskedView
                  pointerEvents="none"
                  style={StyleSheet.absoluteFill}
                  maskElement={<View style={styles.ringMask} />}
                >
                  <LinearGradient
                    colors={POSITIONED_DAY_GRADIENT}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                </MaskedView>
              </View>
            ) : (
              dayCircle
            )}
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
  },
  day: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  ringHost: {
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  ringMask: {
    flex: 1,
    borderRadius: 19,
    borderWidth: 2,
    borderColor: "#000000",
    backgroundColor: "transparent",
  },
  dayLabel: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 19,
    fontWeight: "700",
    opacity: 0.6,
  },
  checkMark: {
    transform: [{ translateY: 1 }],
  },
});