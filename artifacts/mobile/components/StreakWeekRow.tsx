import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { CinematicFadeSlide } from "@/components/CinematicFadeSlide";
import { POSITIONED_DAY_GRADIENT } from "@/constants/colors";
import { useStreak } from "@/hooks/useStreak";

const DAY_INITIALS = ["L", "M", "M", "J", "V", "S", "D"];

export function StreakWeekRow({
  animateEntrance = false,
  entranceReplayKey = "streak-week",
  entranceBaseDelay = 0,
  smallLabels = false,
}: {
  animateEntrance?: boolean;
  entranceReplayKey?: string | number;
  entranceBaseDelay?: number;
  smallLabels?: boolean;
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
              <Svg width={smallLabels ? 20 : 26} height={smallLabels ? 20 : 26} viewBox="0 0 24 24" style={styles.checkMark}>
                <Path
                  d="M20 6 9 17l-5-5"
                  fill="none"
                  stroke="#FFFFFF"
                  strokeWidth={1.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </Svg>
            ) : !smallLabels ? (
              <Text style={[styles.dayLabel, isToday && styles.positionedDayLabel]}>
                {initial}
              </Text>
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
            {smallLabels && (
              <Text style={[styles.dayLabel, isToday && styles.positionedDayLabel, styles.smallDayLabel, styles.outsideDayLabel]}>
                {initial}
              </Text>
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  inactiveDay: {
    backgroundColor: "rgba(255,255,255,0.15)",
    borderWidth: 0,
  },
  positionedInactiveDay: {
    backgroundColor: "rgba(255,255,255,0.15)",
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
    color: "rgba(255,255,255,0.7)",
    fontFamily: "Manrope",
    fontSize: 16,
    lineHeight: 19,
    fontWeight: "700",
    transform: [{ translateY: 1 }],
  },
  smallDayLabel: {
    color: "#FFFFFF",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "400",
  },
  outsideDayLabel: {
    marginTop: 4,
    transform: [],
  },
  positionedDayLabel: {
    color: "rgba(252,252,252,0.7)",
  },
  checkMark: {
    transform: [{ translateY: 1 }],
  },
});