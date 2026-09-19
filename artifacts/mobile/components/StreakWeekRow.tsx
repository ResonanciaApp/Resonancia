import MaskedView from "@react-native-masked-view/masked-view";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { useStreak } from "@/hooks/useStreak";

const DAY_INITIALS = ["L", "M", "X", "J", "V", "S", "D"];
const POSITIONED_DAY_GRADIENT = ["#C5A7F2", "#8260B5", "#62428F"] as const;

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
              <Feather name="check" size={22} color="#FFFFFF" />
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  ringHost: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  ringMask: {
    flex: 1,
    borderRadius: 20,
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
});