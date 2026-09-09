import React, { useEffect, useRef, useState } from "react";
import { Animated, Easing, StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";

import { useRoutineCompletionBanner } from "@/context/RoutineCompletionBannerContext";

const ENTRY_DISTANCE = 86;
const ENTRY_DURATION = 380;
const COUNT_DURATION = 350;
const HOLD_DURATION = 1800;
const EXIT_DURATION = 320;
const COUNTER_SURFACE = "#2E1C50";

type Props = {
  bottom: number;
  backgroundColor: string;
  visible: boolean;
};

export function RoutineCompletionBanner({ bottom, backgroundColor, visible }: Props) {
  const { activeEvent, dismissActiveEvent } = useRoutineCompletionBanner();
  const translateY = useRef(new Animated.Value(ENTRY_DISTANCE)).current;
  const countProgress = useRef(new Animated.Value(0)).current;
  const waveProgress = useRef(new Animated.Value(0)).current;
  const startedEventIdRef = useRef<number | null>(null);
  const committedEventIdRef = useRef<number | null>(null);
  const [subtitleCount, setSubtitleCount] = useState(0);

  useEffect(() => {
    if (
      !visible &&
      activeEvent &&
      startedEventIdRef.current === activeEvent.id
    ) {
      startedEventIdRef.current = null;
      if (committedEventIdRef.current === activeEvent.id) {
        committedEventIdRef.current = null;
        dismissActiveEvent();
      }
    }
  }, [activeEvent, dismissActiveEvent, visible]);

  useEffect(() => {
    if (!activeEvent || !visible) return;

    let holdTimer: ReturnType<typeof setTimeout> | null = null;
    startedEventIdRef.current = activeEvent.id;
    committedEventIdRef.current = null;
    translateY.stopAnimation();
    countProgress.stopAnimation();
    waveProgress.stopAnimation();
    translateY.setValue(ENTRY_DISTANCE);
    countProgress.setValue(0);
    waveProgress.setValue(0);
    setSubtitleCount(activeEvent.kind === "completed" ? activeEvent.previousCount : 0);

    Animated.timing(translateY, {
      toValue: 0,
      duration: ENTRY_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished: entered }) => {
      if (!entered) return;
      if (activeEvent.kind === "added") {
        committedEventIdRef.current = activeEvent.id;
        holdTimer = setTimeout(() => {
          Animated.timing(translateY, {
            toValue: ENTRY_DISTANCE,
            duration: EXIT_DURATION,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }).start(({ finished: exited }) => {
            if (exited) {
              startedEventIdRef.current = null;
              committedEventIdRef.current = null;
              dismissActiveEvent();
            }
          });
        }, HOLD_DURATION);
        return;
      }
      Animated.timing(countProgress, {
        toValue: 1,
        duration: COUNT_DURATION,
        easing: Easing.inOut(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished: counted }) => {
        if (!counted) return;
        committedEventIdRef.current = activeEvent.id;
        setSubtitleCount(activeEvent.nextCount);
        Animated.timing(waveProgress, {
          toValue: 1,
          duration: 520,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start();
        holdTimer = setTimeout(() => {
          Animated.timing(translateY, {
            toValue: ENTRY_DISTANCE,
            duration: EXIT_DURATION,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }).start(({ finished: exited }) => {
            if (exited) {
              startedEventIdRef.current = null;
              committedEventIdRef.current = null;
              dismissActiveEvent();
            }
          });
        }, HOLD_DURATION);
      });
    });

    return () => {
      if (holdTimer) clearTimeout(holdTimer);
      translateY.stopAnimation();
      countProgress.stopAnimation();
      waveProgress.stopAnimation();
    };
  }, [
    activeEvent,
    countProgress,
    dismissActiveEvent,
    translateY,
    visible,
    waveProgress,
  ]);

  if (!activeEvent || !visible) return null;

  const oldNumberStyle = {
    opacity: countProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0],
    }),
    transform: [
      {
        translateY: countProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -18],
        }),
      },
    ],
  };
  const newNumberStyle = {
    opacity: countProgress,
    transform: [
      {
        translateY: countProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [18, 0],
        }),
      },
    ],
  };
  const waveStyle = {
    opacity: waveProgress.interpolate({
      inputRange: [0, 0.15, 1],
      outputRange: [0, 0.26, 0],
    }),
    transform: [
      {
        scale: waveProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [1, 1.75],
        }),
      },
    ],
  };

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.banner,
        {
          bottom,
          backgroundColor,
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.copy}>
        <Text style={styles.title}>
          {activeEvent.kind === "completed" ? "Actividad finalizada" : "Actividad añadida"}
        </Text>
        {activeEvent.kind === "completed" ? (
          <Text style={styles.subtitle}>
            {subtitleCount} {subtitleCount === 1 ? "tarea" : "tareas"} hoy
          </Text>
        ) : null}
      </View>
      <View style={styles.counterWrap}>
        {activeEvent.kind === "completed" ? (
          <Animated.View style={[styles.wave, waveStyle]} />
        ) : null}
        <View style={styles.counter}>
          {activeEvent.kind === "completed" ? (
            <>
              <Animated.Text style={[styles.counterNumber, oldNumberStyle]}>
                {activeEvent.previousCount}
              </Animated.Text>
              <Animated.Text style={[styles.counterNumber, styles.nextNumber, newNumberStyle]}>
                {activeEvent.nextCount}
              </Animated.Text>
            </>
          ) : (
            <View style={styles.addedTicket}>
              <Feather name="check" size={20} color="#060A0F" />
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    left: 12,
    right: 12,
    height: 68,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.10)",
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -3 },
    zIndex: 40,
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "700",
  },
  subtitle: {
    color: "rgba(249,249,249,0.68)",
    fontFamily: "Manrope",
    fontSize: 11,
    marginTop: 3,
  },
  counterWrap: {
    width: 42,
    height: 42,
    alignItems: "center",
    justifyContent: "center",
  },
  wave: {
    position: "absolute",
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    borderColor: "#F9F9F9",
  },
  counter: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COUNTER_SURFACE,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  counterNumber: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  nextNumber: {
    position: "absolute",
  },
  addedTicket: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F9F9F9",
    alignItems: "center",
    justifyContent: "center",
  },
});