import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { CinematicFadeSlide } from "@/components/CinematicFadeSlide";
import { useStreak } from "@/hooks/useStreak";

const DAY_INITIALS = ["L", "M", "M", "J", "V", "S", "D"];
const POSITIONED_DAY_GRADIENT = ["#9380E7", "#9EA5EF"] as const;

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
          <View
            style={[
              styles.day,
              !active && (isToday ? styles.positionedInactiveDay : styles.inactiveDay),
            ]}
          >
            {active ? (
              <Svg width={27} height={27} viewBox="0 0 24 24" style={styles.checkMark}>
                <Path
                  d="M20 6 9 17l-5-5"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            ) : (
              <Text style={[styles.dayLabel, isToday && styles.positionedDayLabel]}>
                {initial}
              </Text>
            )}
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
  },
  day: {
    width: 39,
    height: 39,
    borderRadius: 19.5,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  inactiveDay: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 0,
  },
  positionedInactiveDay: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  ringHost: {
    width: 39,
    height: 39,
    borderRadius: 19.5,
  },
  ringMask: {
    flex: 1,
    borderRadius: 19.5,
    borderWidth: 2.5,
    borderColor: "#000000",
    backgroundColor: "transparent",
  },
  dayLabel: {
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Manrope",
    fontSize: 17,
    lineHeight: 20,
    fontWeight: "700",
    transform: [{ translateY: 1 }],
  },
  positionedDayLabel: {
    color: "rgba(252,252,252,0.7)",
  },
  checkMark: {
    transform: [{ translateY: 1 }],
  },
});