import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet } from "react-native";
import { Image as ExpoImage } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";

import { usePlayer } from "@/context/PlayerContext";

/** Minutos que hay que escuchar en el día para "completar la racha". */
const GOAL_MINUTES = 5;

/** Opacidad de reposo del fuego y del número (estado atenuado). */
const REST_OPACITY = 0.2;

const STREAK_ANIM_KEY = "@resonance_streak_anim_date";
/** Flag DEV: fuerza la animación la próxima vez que se abre el Inicio. */
const STREAK_FORCE_KEY = "@resonance_streak_force";

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

  // Readiness del fuego: si la animación se dispara antes de que el PNG esté
  // decodificado, se difiere hasta onLoad (evita que píldora/número aparezcan
  // antes que el fuego).
  const fireReadyRef = useRef(false);
  const pendingStreakRef = useRef<number | null>(null);
  const pendingRestingRef = useRef<number | null>(null);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const runAnimation = useCallback(
    (finalStreak: number) => {
      if (!fireReadyRef.current) {
        pendingStreakRef.current = finalStreak;
        return;
      }
      clearTimers();
      const target = Math.max(1, finalStreak);

      // 1. Se enciende el fuego y aparece el número del día (sin progresión).
      setDisplayNumber(target);
      fireOpacity.setValue(REST_OPACITY);
      numOpacity.setValue(0);
      fireScale.setValue(1);

      const FADE_IN = 400;
      Animated.parallel([
        Animated.timing(fireOpacity, {
          toValue: 1,
          duration: FADE_IN,
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
          duration: FADE_IN,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();

      // 2. Tras unos segundos, fuego y número se atenúan juntos (mismo timing).
      const FADE_OUT = 700;
      const fade = setTimeout(() => {
        Animated.parallel([
          Animated.timing(fireOpacity, {
            toValue: REST_OPACITY,
            duration: FADE_OUT,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
          Animated.timing(numOpacity, {
            toValue: REST_OPACITY,
            duration: FADE_OUT,
            easing: Easing.in(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start();
      }, FADE_IN + 2000);
      timersRef.current.push(fade);
    },
    [clearTimers, fireOpacity, fireScale, numOpacity],
  );

  // Mostrar estado de reposo (ya animado hoy): fuego + número atenuados.
  // También se difiere hasta que el fuego esté listo.
  const showRestingNumber = useCallback(
    (value: number) => {
      if (!fireReadyRef.current) {
        pendingRestingRef.current = value;
        return;
      }
      clearTimers();
      setDisplayNumber(value);
      fireOpacity.setValue(REST_OPACITY);
      numOpacity.setValue(REST_OPACITY);
      fireScale.setValue(1);
    },
    [clearTimers, fireOpacity, fireScale, numOpacity],
  );

  // El fuego ya está decodificado (o falló): se marca listo y se drena
  // cualquier animación/estado de reposo en espera.
  const markFireReady = useCallback(() => {
    fireReadyRef.current = true;
    if (pendingStreakRef.current != null) {
      const s = pendingStreakRef.current;
      pendingStreakRef.current = null;
      pendingRestingRef.current = null;
      runAnimation(s);
    } else if (pendingRestingRef.current != null) {
      const v = pendingRestingRef.current;
      pendingRestingRef.current = null;
      showRestingNumber(v);
    }
  }, [runAnimation, showRestingNumber]);

  useFocusEffect(
    useCallback(() => {
      let cancelled = false;
      const todayK = dayKey(new Date());

      (async () => {
        const [last, force] = await Promise.all([
          AsyncStorage.getItem(STREAK_ANIM_KEY).catch(() => null),
          AsyncStorage.getItem(STREAK_FORCE_KEY).catch(() => null),
        ]);
        if (cancelled) return;

        // DEV: disparo forzado para probar la animación (ignora meta y gating).
        // Pequeño retraso para que termine la transición de pantalla y se vea
        // completa la fase brillante del fuego.
        if (force) {
          AsyncStorage.removeItem(STREAK_FORCE_KEY).catch(() => {});
          const t = setTimeout(() => runAnimation(streak > 0 ? streak : 3), 550);
          timersRef.current.push(t);
          return;
        }

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
      <Animated.View
        style={[styles.fire, { opacity: fireOpacity, transform: [{ scale: fireScale }] }]}
      >
        <ExpoImage
          source={require("@/assets/images/fuego.png")}
          style={styles.fireImg}
          contentFit="contain"
          cachePolicy="memory-disk"
          onLoad={markFireReady}
          onError={markFireReady}
        />
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    minWidth: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#1A2336",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingHorizontal: 10,
  },
  num: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
  fire: {
    width: 18,
    height: 18,
  },
  fireImg: {
    width: "100%",
    height: "100%",
  },
});
