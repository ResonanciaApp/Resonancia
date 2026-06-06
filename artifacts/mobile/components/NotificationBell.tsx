import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { usePlayer } from "@/context/PlayerContext";

/** Minutos que hay que escuchar en el día para "completar la racha". */
const GOAL_MINUTES = 5;

/** Opacidad de reposo del fuego y del número (estado atenuado). */
const REST_OPACITY = 0.2;

const GOLD = "#BE9650";
const STREAK_ANIM_KEY = "@resonance_streak_anim_date";

function dayKey(d: Date): string {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Suma de minutos escuchados por día. */
function minutesByDay(events: { playedAt: string; minutes: number }[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const e of events) {
    const k = dayKey(new Date(e.playedAt));
    map.set(k, (map.get(k) ?? 0) + (e.minutes ?? 0));
  }
  return map;
}

/** Racha = días consecutivos (terminando hoy o ayer) que alcanzan la meta de minutos. */
function computeStreak(map: Map<string, number>, goal: number): number {
  const today = new Date();
  const todayK = dayKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);
  const yKey = dayKey(yesterday);

  let cursor: Date;
  if ((map.get(todayK) ?? 0) >= goal) cursor = today;
  else if ((map.get(yKey) ?? 0) >= goal) cursor = yesterday;
  else return 0;

  let count = 0;
  const walk = new Date(cursor);
  while ((map.get(dayKey(walk)) ?? 0) >= goal) {
    count++;
    walk.setDate(walk.getDate() - 1);
  }
  return count;
}

export function NotificationBell() {
  const { statEvents } = usePlayer();

  const byDay = useMemo(() => minutesByDay(statEvents), [statEvents]);
  const streak = useMemo(() => computeStreak(byDay, GOAL_MINUTES), [byDay]);
  const todayMinutes = useMemo(
    () => byDay.get(dayKey(new Date())) ?? 0,
    [byDay],
  );
  const todayMet = todayMinutes >= GOAL_MINUTES;

  // Animated values: fuego (opacidad + escala) y número (opacidad).
  const fireOpacity = useRef(new Animated.Value(REST_OPACITY)).current;
  const fireScale = useRef(new Animated.Value(1)).current;
  const numOpacity = useRef(new Animated.Value(0)).current;

  const [displayNumber, setDisplayNumber] = useState<number | null>(null);

  // Guardas anti re-disparo dentro de la sesión + limpieza de timers.
  const animatedDateRef = useRef<string | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const runAnimation = useCallback(
    (finalStreak: number) => {
      clearTimers();
      const target = Math.max(1, finalStreak);

      // 1. Se enciende el fuego + aparece el número en 1.
      setDisplayNumber(1);
      fireOpacity.setValue(REST_OPACITY);
      numOpacity.setValue(0);
      fireScale.setValue(1);

      Animated.parallel([
        Animated.timing(fireOpacity, {
          toValue: 1,
          duration: 450,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(fireScale, {
            toValue: 1.2,
            duration: 240,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.spring(fireScale, {
            toValue: 1,
            friction: 4,
            tension: 80,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(numOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // 2. Conteo 1 → racha.
      const stepMs = target <= 1 ? 0 : Math.min(220, Math.max(70, Math.round(700 / (target - 1))));
      let n = 1;
      if (target > 1) {
        for (let i = 2; i <= target; i++) {
          const value = i;
          const t = setTimeout(() => setDisplayNumber(value), stepMs * (i - 1));
          timersRef.current.push(t);
        }
        n = target;
      }
      const countDur = target <= 1 ? 0 : stepMs * (target - 1);

      // 3. Tras unos segundos, fuego y número quedan atenuados.
      const fade = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fireOpacity, {
            toValue: REST_OPACITY,
            duration: 700,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(numOpacity, {
            toValue: REST_OPACITY,
            duration: 700,
            useNativeDriver: true,
          }),
        ]).start();
      }, countDur + 2000);
      timersRef.current.push(fade);

      void n;
    },
    [clearTimers, fireOpacity, fireScale, numOpacity],
  );

  // Mostrar estado de reposo (ya animado hoy): fuego + número atenuados.
  const showRestingNumber = useCallback(
    (value: number) => {
      clearTimers();
      setDisplayNumber(value);
      fireOpacity.setValue(REST_OPACITY);
      numOpacity.setValue(REST_OPACITY);
      fireScale.setValue(1);
    },
    [clearTimers, fireOpacity, fireScale, numOpacity],
  );

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const todayK = dayKey(new Date());

      (async () => {
        const last = await AsyncStorage.getItem(STREAK_ANIM_KEY).catch(() => null);
        if (cancelled) return;

        const alreadyToday = last === todayK || animatedDateRef.current === todayK;

        if (alreadyToday) {
          // Ya se mostró hoy: número atenuado junto al fuego.
          if (todayMet && streak > 0) showRestingNumber(streak);
          return;
        }

        if (todayMet && streak > 0) {
          animatedDateRef.current = todayK;
          AsyncStorage.setItem(STREAK_ANIM_KEY, todayK).catch(() => {});
          runAnimation(streak);
        }
      })();

      return () => {
        cancelled = true;
        clearTimers();
      };
    }, [todayMet, streak, runAnimation, showRestingNumber, clearTimers]),
  );

  return (
    <Pressable
      onPress={() => router.push("/progreso" as never)}
      hitSlop={12}
      style={styles.btn}
    >
      {displayNumber != null && (
        <Animated.Text style={[styles.num, { opacity: numOpacity }]}>
          {displayNumber}
        </Animated.Text>
      )}
      <Animated.Image
        source={require("@/assets/images/fuego.png")}
        style={[styles.fire, { opacity: fireOpacity, transform: [{ scale: fireScale }] }]}
        resizeMode="contain"
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minWidth: 38,
    height: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 5,
  },
  num: {
    color: GOLD,
    fontSize: 16,
    fontWeight: "700",
  },
  fire: {
    width: 26,
    height: 26,
  },
});
