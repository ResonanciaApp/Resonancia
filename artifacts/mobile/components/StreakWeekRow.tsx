import MaskedView from "@react-native-masked-view/masked-view";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";

import { CinematicFadeSlide } from "@/components/CinematicFadeSlide";
import { useStreak } from "@/hooks/useStreak";

const DAY_INITIALS = ["L", "M", "X", "J", "V", "S", "D"];
const POSITIONED_DAY_GRADIENT = ["#3F2D8A", "#3C45B0", "#444EC0"] as const;

export function StreakWeekRow({
  animateEntrance = false,
  entranceReplayKey = "streak-week",
  entranceBaseDelay = 0,
}: {
  animateEntrance?: boolean;
  entranceReplayKey?: string | number;
  entranceBaseDelay?: number;
} = {}) {
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
                size={22}
                color="#FFFFFF"
                style={styles.checkMark}
              />
            ) : null}
          </View>
        );

        const content = (
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
            <Text style={styles.dayLabel}>{initial}</Text>
          </View>
        );

        if (!animateEntrance) return content;

        return (
          <CinematicFadeSlide
            key={`${initial}-${index}`}
            replayKey={`${entranceReplayKey}:${index}`}
            delay={entranceBaseDelay + index * 140}
            duration={1200}
            scaleFrom={0.9}
            translateYFrom={14}
          >
            {content}
          </CinematicFadeSlide>
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
    gap: 5,
  },
  day: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  ringHost: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  ringMask: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: "#000000",
    backgroundColor: "transparent",
  },
  dayLabel: {
    color: "#FFFFFF",
    fontFamily: "Manrope",
    fontSize: 10,
    lineHeight: 13,
    fontWeight: "500",
    transform: [{ translateY: -1 }],
  },
  checkMark: {
    transform: [{ translateY: 1 }],
  },
});