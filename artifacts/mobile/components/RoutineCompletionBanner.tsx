import React, { useEffect, useRef, useState } from "react";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { getTabBarGlassOverlay, TAB_PILL_BLUR_INTENSITY, TAB_PILL_BLUR_TINT } from "@/constants/tab-bar";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { CONFIRMATION_ENTRY_DELAY_MS } from "@/constants/confirmation-banner";
import { RoutineGradientFill } from "@/components/RoutineGradientFill";
import { useRoutineCompletionBanner } from "@/context/RoutineCompletionBannerContext";

const ENTRY_DISTANCE = 86;
const ENTRY_DELAY = 500;
const ADDED_ENTRY_DELAY = CONFIRMATION_ENTRY_DELAY_MS;
const ENTRY_DURATION = 380;
const COUNT_DURATION = 350;
const HOLD_DURATION = 1800;
const EXIT_DURATION = 320;
const INTERRUPT_EXIT_DURATION = 160;
const COUNTER_SIZE = 32;

type Props = {
  bottom: number;
  visible: boolean;
  entryDistance?: number;
  enteredOffset?: number;
  onAddedPress?: () => void;
  addedTitle?: string;
  showAddedAction?: boolean;
};

export function RoutineCompletionBanner({
  bottom,
  visible,
  entryDistance = ENTRY_DISTANCE,
  enteredOffset = 0,
  onAddedPress,
  addedTitle = "Actividad añadida",
  showAddedAction = true,
}: Props) {
  const { activeSceneId } = useSceneTheme();
  const glassOverlay = getTabBarGlassOverlay(activeSceneId);
  const { activeEvent, hasPendingCompletion, dismissActiveEvent, emotionWidgetOpacity } =
    useRoutineCompletionBanner();
  const translateY = useRef(new Animated.Value(entryDistance)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const countProgress = useRef(new Animated.Value(0)).current;
  const waveProgress = useRef(new Animated.Value(0)).current;
  const startedEventIdRef = useRef<number | null>(null);
  const committedEventIdRef = useRef<number | null>(null);
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const entryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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
    if (!activeEvent || !visible) {
      emotionWidgetOpacity.stopAnimation();
      emotionWidgetOpacity.setValue(1);
      return;
    }

    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    startedEventIdRef.current = activeEvent.id;
    committedEventIdRef.current = null;
    translateY.stopAnimation();
    opacity.stopAnimation();
    countProgress.stopAnimation();
    waveProgress.stopAnimation();
    emotionWidgetOpacity.stopAnimation();
    translateY.setValue(entryDistance);
    opacity.setValue(0);
    countProgress.setValue(0);
    waveProgress.setValue(0);
    setSubtitleCount(activeEvent.kind === "completed" ? activeEvent.previousCount : 0);

    const entryEasing = activeEvent.kind === "added"
      ? Easing.inOut(Easing.cubic)
      : Easing.out(Easing.cubic);
    const entryAnimation = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: ENTRY_DURATION,
        easing: entryEasing,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: enteredOffset,
        duration: ENTRY_DURATION,
        easing: entryEasing,
        useNativeDriver: true,
      }),
      Animated.timing(emotionWidgetOpacity, {
        toValue: 0,
        duration: ENTRY_DURATION,
        easing: entryEasing,
        useNativeDriver: true,
      }),
    ]);
    const handleEntryFinished = ({ finished: entered }: { finished: boolean }) => {
      if (!entered) return;
      if (activeEvent.kind === "added") {
        committedEventIdRef.current = activeEvent.id;
        holdTimerRef.current = setTimeout(() => {
          holdTimerRef.current = null;
          Animated.parallel([
            Animated.timing(emotionWidgetOpacity, {
              toValue: 1,
              duration: EXIT_DURATION,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: entryDistance,
              duration: EXIT_DURATION,
              easing: Easing.in(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: EXIT_DURATION,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]).start(({ finished: exited }) => {
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
        holdTimerRef.current = setTimeout(() => {
          holdTimerRef.current = null;
          Animated.parallel([
            Animated.timing(emotionWidgetOpacity, {
              toValue: 1,
              duration: EXIT_DURATION,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(translateY, {
              toValue: entryDistance,
              duration: EXIT_DURATION,
              easing: Easing.in(Easing.cubic),
              useNativeDriver: true,
            }),
            Animated.timing(opacity, {
              toValue: 0,
              duration: EXIT_DURATION,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
          ]).start(({ finished: exited }) => {
            if (exited) {
              startedEventIdRef.current = null;
              committedEventIdRef.current = null;
              dismissActiveEvent();
            }
          });
        }, HOLD_DURATION);
      });
    };
    entryTimerRef.current = setTimeout(() => {
      entryTimerRef.current = null;
      if (Platform.OS !== "web") {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch((error) => {
          console.warn("No se pudo activar la vibración del aviso de rutina", error);
        });
      }
      entryAnimation.start(handleEntryFinished);
    }, activeEvent.kind === "added" ? ADDED_ENTRY_DELAY : ENTRY_DELAY);

    return () => {
      if (entryTimerRef.current) {
        clearTimeout(entryTimerRef.current);
        entryTimerRef.current = null;
      }
      if (holdTimerRef.current) {
        clearTimeout(holdTimerRef.current);
        holdTimerRef.current = null;
      }
      translateY.stopAnimation();
      opacity.stopAnimation();
      countProgress.stopAnimation();
      waveProgress.stopAnimation();
      emotionWidgetOpacity.stopAnimation();
    };
  }, [
    activeEvent,
    countProgress,
    dismissActiveEvent,
    entryDistance,
    enteredOffset,
    emotionWidgetOpacity,
    opacity,
    translateY,
    visible,
    waveProgress,
  ]);

  useEffect(() => {
    if (
      !hasPendingCompletion ||
      !activeEvent ||
      activeEvent.kind !== "completed" ||
      startedEventIdRef.current !== activeEvent.id
    ) {
      return;
    }
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (entryTimerRef.current) {
      clearTimeout(entryTimerRef.current);
      entryTimerRef.current = null;
    }
    translateY.stopAnimation();
    opacity.stopAnimation();
    countProgress.stopAnimation();
    waveProgress.stopAnimation();
    emotionWidgetOpacity.stopAnimation();
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 0,
        duration: INTERRUPT_EXIT_DURATION,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(emotionWidgetOpacity, {
        toValue: 1,
        duration: INTERRUPT_EXIT_DURATION,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished || startedEventIdRef.current !== activeEvent.id) return;
      startedEventIdRef.current = null;
      committedEventIdRef.current = null;
      dismissActiveEvent();
    });
  }, [
    activeEvent,
    countProgress,
    dismissActiveEvent,
    emotionWidgetOpacity,
    hasPendingCompletion,
    opacity,
    translateY,
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
      pointerEvents={activeEvent.kind === "added" ? "box-none" : "none"}
      style={[
        styles.banner,
        {
          bottom,
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      <View pointerEvents="none" style={styles.glassSurface}>
        <BlurView
          pointerEvents="none"
          tint={TAB_PILL_BLUR_TINT}
          intensity={TAB_PILL_BLUR_INTENSITY}
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: glassOverlay }]}
        />
      </View>
      <View style={[styles.copy, activeEvent.kind === "added" && styles.addedCopy]}>
        {activeEvent.kind === "added" ? (
          <View style={styles.addedTitleRow}>
            <View style={styles.addedCheckSurface}>
              <Feather name="check" size={17} color="#F9F9F9" />
            </View>
            <Text accessibilityLiveRegion="polite" style={styles.title}>{addedTitle}</Text>
          </View>
        ) : (
          <>
            <Text style={styles.title}>Actividad finalizada</Text>
            <Text style={styles.subtitle}>
              {subtitleCount} {subtitleCount === 1 ? "tarea" : "tareas"} hoy
            </Text>
          </>
        )}
      </View>
      <View style={styles.counterWrap}>
        {activeEvent.kind === "completed" ? (
          <>
            <Animated.View style={[styles.wave, waveStyle]} />
            <View style={styles.counter}>
              <RoutineGradientFill />
              <>
                <Animated.Text style={[styles.counterNumber, oldNumberStyle]}>
                  {activeEvent.previousCount}
                </Animated.Text>
                <Animated.Text style={[styles.counterNumber, styles.nextNumber, newNumberStyle]}>
                  {activeEvent.nextCount}
                </Animated.Text>
              </>
            </View>
          </>
        ) : showAddedAction ? (
          <Pressable
            onPress={() => {
              dismissActiveEvent();
              onAddedPress?.();
            }}
            accessibilityRole="button"
            accessibilityLabel="Ver actividad añadida"
            hitSlop={10}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Text style={styles.addedButtonText}>Ver</Text>
          </Pressable>
        ) : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    left: 39,
    right: 39,
    height: 56,
    borderRadius: 28,
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
  glassSurface: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    overflow: "hidden",
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  addedCopy: {
    justifyContent: "center",
  },
  addedTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  addedCheckSurface: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
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
    width: COUNTER_SIZE + 4,
    height: COUNTER_SIZE + 4,
    alignItems: "center",
    justifyContent: "center",
  },
  wave: {
    position: "absolute",
    width: COUNTER_SIZE,
    height: COUNTER_SIZE,
    borderRadius: COUNTER_SIZE / 2,
    borderWidth: 1,
    borderColor: "#F9F9F9",
  },
  counter: {
    width: COUNTER_SIZE,
    height: COUNTER_SIZE,
    borderRadius: COUNTER_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  counterNumber: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "700",
    lineHeight: 18,
  },
  nextNumber: {
    position: "absolute",
  },
  addedButtonText: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "700",
  },
});