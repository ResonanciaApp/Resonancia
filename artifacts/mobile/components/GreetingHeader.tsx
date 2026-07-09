import AsyncStorage from "@react-native-async-storage/async-storage";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

import { getWeeklyDescription, getWeeklyPhrase } from "@/data/greeting-phrases";

const STORAGE_KEY = "@greeting_shown_date";
const FORCE_ANIMATION = true;

function getLocalDateString(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return "Buenos días";
  if (hour >= 12 && hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function GreetingHeader() {
  const [phase, setPhase] = useState<"loading" | "a" | "b">("loading");

  const cardOpacity = useRef(new Animated.Value(0)).current;
  const cardTranslateY = useRef(new Animated.Value(20)).current;
  const phraseOpacity = useRef(new Animated.Value(0)).current;
  const greetingOpacity = useRef(new Animated.Value(0)).current;

  const weeklyPhrase = useRef(getWeeklyPhrase()).current;
  const weeklyDesc = useRef(getWeeklyDescription()).current;
  const greeting = useRef(getGreeting()).current;

  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    const addTimer = (fn: () => void, ms: number) => {
      const t = setTimeout(() => { if (!cancelled) fn(); }, ms);
      timers.push(t);
      return t;
    };

    const runPhaseA = () => {
      setPhase("a");

      Animated.parallel([
        Animated.spring(cardOpacity, {
          toValue: 1,
          speed: 10,
          bounciness: 4,
          useNativeDriver: true,
        }),
        Animated.spring(cardTranslateY, {
          toValue: 0,
          speed: 10,
          bounciness: 4,
          useNativeDriver: true,
        }),
      ]).start();

      addTimer(() => {
        Animated.timing(phraseOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }).start();
      }, 300);

      addTimer(() => {
        Animated.parallel([
          Animated.timing(cardOpacity, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(phraseOpacity, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start(() => {
          if (cancelled) return;
          setPhase("b");
          Animated.timing(greetingOpacity, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }).start();
        });
      }, 10000);
    };

    (async () => {
      try {
        const today = getLocalDateString();
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (cancelled) return;

        if (FORCE_ANIMATION || stored !== today) {
          await AsyncStorage.setItem(STORAGE_KEY, today);
          runPhaseA();
        } else {
          setPhase("b");
          greetingOpacity.setValue(1);
        }
      } catch {
        if (!cancelled) {
          setPhase("b");
          greetingOpacity.setValue(1);
        }
      }
    })();

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
  }, []);

  if (phase === "loading") return <View style={styles.container} />;

  return (
    <View style={styles.container} pointerEvents="none">
      {phase === "a" && (
        <Animated.View
          style={[
            styles.card,
            {
              opacity: cardOpacity,
              transform: [{ translateY: cardTranslateY }],
            },
          ]}
        >
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
          <LinearGradient
            colors={["rgba(255,255,255,0.07)", "rgba(255,255,255,0)"]}
            style={StyleSheet.absoluteFill}
          />
          <Animated.Text style={[styles.phraseText, { opacity: phraseOpacity }]}>
            {weeklyPhrase}
          </Animated.Text>
        </Animated.View>
      )}

      {phase === "b" && (
        <Animated.View style={{ opacity: greetingOpacity }}>
          <Text style={styles.greetingText}>{greeting}</Text>
          <Text style={styles.descText} numberOfLines={2}>
            {weeklyDesc}
          </Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingRight: 8,
    justifyContent: "center",
    minHeight: 52,
  },
  card: {
    overflow: "hidden",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.25)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignSelf: "flex-start",
  },
  phraseText: {
    color: "rgba(255,255,255,0.88)",
    fontSize: 12,
    fontStyle: "italic",
    lineHeight: 17,
    maxWidth: 170,
  },
  greetingText: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  descText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    marginTop: 3,
    lineHeight: 15,
    maxWidth: 160,
  },
});
