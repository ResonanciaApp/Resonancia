import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import { CinematicFadeSlide } from "@/components/CinematicFadeSlide";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useStreak } from "@/hooks/useStreak";

const DAY_INITIALS = ["L", "M", "M", "J", "V", "S", "D"];
// Conserva la luminosidad especial del anillo sin cambiar la dirección cromática del tema.
const RING_BRIGHTNESS_OFFSET = 125;
const RING_BRIGHTNESS_GAIN = 1.21;

function brightenRingColor(hex: string): string {
  return `#${[1, 3, 5].map((index) =>
    Math.min(255, Math.round(
      (Number.parseInt(hex.slice(index, index + 2), 16) + RING_BRIGHTNESS_OFFSET) * RING_BRIGHTNESS_GAIN,
    ))
      .toString(16).padStart(2, "0"),
  ).join("")}`;
}

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
  const { theme } = useSceneTheme();
  const ringGradient = useMemo(
    () => theme.gradient.map(brightenRingColor) as [string, string, ...string[]],
    [theme.gradient],
  );

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
                    colors={ringGradient}
                    locations={theme.gradientLocations}
                    start={theme.gradientStart ?? { x: 0.5, y: 0 }}
                    end={theme.gradientEnd ?? { x: 0.5, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                </MaskedView>
              </View>
            ) : (
              dayCircle
            )}
            <Text style={[
              styles.dayLabel,
              styles.outsideDayLabel,
            ]}>
              {initial}
            </Text>
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
    color: "#FFFFFF",
    fontFamily: "Manrope",
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "400",
  },
  outsideDayLabel: {
    marginTop: 5,
  },
  checkMark: {
    transform: [{ translateY: 1 }],
  },
});