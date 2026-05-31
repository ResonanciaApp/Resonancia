import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { useColors } from "@/hooks/useColors";

const ND = Platform.OS !== "web";
const CIRCLE_SIZE = 210;
const MIN_SCALE = 0.3;
const MAX_SCALE = 1.0;

type Phase = {
  label: string;
  duration: number;
  targetScale: number;
};

type PatternConfig = {
  id: string;
  name: string;
  description: string;
  phases: Phase[];
  recommendedCycles: number;
};

const PATTERNS: PatternConfig[] = [
  {
    id: "478",
    name: "4-7-8",
    description: "Inhala 4 · Mantené 7 · Exhala 8\nReduce ansiedad y facilita el sueño",
    phases: [
      { label: "Inhala", duration: 4, targetScale: 1 },
      { label: "Mantené", duration: 7, targetScale: 1 },
      { label: "Exhala", duration: 8, targetScale: 0 },
    ],
    recommendedCycles: 4,
  },
  {
    id: "box",
    name: "Cuadrada",
    description: "Inhala 4 · Mantené 4 · Exhala 4 · Suelta 4\nCalma el sistema nervioso y mejora el foco",
    phases: [
      { label: "Inhala", duration: 4, targetScale: 1 },
      { label: "Mantené", duration: 4, targetScale: 1 },
      { label: "Exhala", duration: 4, targetScale: 0 },
      { label: "Suelta", duration: 4, targetScale: 0 },
    ],
    recommendedCycles: 4,
  },
  {
    id: "coherence",
    name: "Coherencia",
    description: "Inhala 5 · Exhala 5\nEquilibra la variabilidad cardíaca",
    phases: [
      { label: "Inhala", duration: 5, targetScale: 1 },
      { label: "Exhala", duration: 5, targetScale: 0 },
    ],
    recommendedCycles: 6,
  },
];

function getPhaseStartScale(pattern: PatternConfig, idx: number): number {
  if (idx === 0) return MIN_SCALE;
  return pattern.phases[idx - 1].targetScale > 0 ? MAX_SCALE : MIN_SCALE;
}

export default function RespiracionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [patternData, setPatternData] = useState<PatternConfig>(PATTERNS[0]);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [countdown, setCountdown] = useState(PATTERNS[0].phases[0].duration);
  const [cycles, setCycles] = useState(0);
  const [running, setRunning] = useState(false);
  const [started, setStarted] = useState(false);
  const [completed, setCompleted] = useState(false);

  const cyclesRef = useRef(0);
  const scale = useRef(new Animated.Value(MIN_SCALE)).current;

  useEffect(() => {
    cyclesRef.current = cycles;
  }, [cycles]);

  useEffect(() => {
    if (!running) return;

    const safeIdx = Math.min(phaseIdx, patternData.phases.length - 1);
    const phase = patternData.phases[safeIdx];
    const startVal = getPhaseStartScale(patternData, safeIdx);
    const targetVal = phase.targetScale > 0 ? MAX_SCALE : MIN_SCALE;

    scale.setValue(startVal);
    setCountdown(phase.duration);

    const anim = Animated.timing(scale, {
      toValue: targetVal,
      duration: phase.duration * 1000,
      useNativeDriver: ND,
    });
    anim.start();

    let remaining = phase.duration - 1;
    const interval = setInterval(() => {
      setCountdown(remaining);
      remaining -= 1;
      if (remaining < 0) clearInterval(interval);
    }, 1000);

    const advance = setTimeout(() => {
      clearInterval(interval);
      const isLast = safeIdx === patternData.phases.length - 1;
      const nextIdx = (safeIdx + 1) % patternData.phases.length;
      const newCycles = isLast ? cyclesRef.current + 1 : cyclesRef.current;

      if (isLast && newCycles >= patternData.recommendedCycles) {
        setRunning(false);
        setCompleted(true);
      } else {
        if (isLast) setCycles(newCycles);
        setPhaseIdx(nextIdx);
      }
    }, phase.duration * 1000);

    return () => {
      clearInterval(interval);
      clearTimeout(advance);
      anim.stop();
    };
  }, [running, phaseIdx, patternData, scale]);

  function selectPattern(p: PatternConfig) {
    setRunning(false);
    setStarted(false);
    setPatternData(p);
    setPhaseIdx(0);
    setCycles(0);
    setCompleted(false);
    setCountdown(p.phases[0].duration);
    scale.setValue(MIN_SCALE);
  }

  function handleToggle() {
    if (completed) {
      setCompleted(false);
      setPhaseIdx(0);
      setCycles(0);
      setCountdown(patternData.phases[0].duration);
      scale.setValue(MIN_SCALE);
      setStarted(true);
      setRunning(true);
      return;
    }
    if (!started) setStarted(true);
    setRunning((r) => !r);
  }

  const safePhase = patternData.phases[Math.min(phaseIdx, patternData.phases.length - 1)];
  const btnIcon = completed ? "rotate-ccw" : running ? "pause" : "play";
  const btnLabel = completed ? "Repetir" : running ? "Pausar" : started ? "Continuar" : "Comenzar";

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={14} style={styles.backBtn}>
          <Feather name="chevron-left" size={26} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Respiración</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
      >
        {/* Pattern chips */}
        <View style={styles.chipWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipRow}
          >
            {PATTERNS.map((p) => {
              const active = patternData.id === p.id;
              return (
                <Pressable
                  key={p.id}
                  onPress={() => selectPattern(p)}
                  style={[
                    styles.chip,
                    {
                      borderColor: active ? "#C69B4F" : "rgba(255,255,255,0.14)",
                      backgroundColor: active ? "rgba(198,155,79,0.18)" : "rgba(255,255,255,0.06)",
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: active ? "#C69B4F" : colors.mutedForeground }]}>
                    {p.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Description */}
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          {patternData.description}
        </Text>

        {/* Circle area */}
        <View style={styles.circleContainer}>
          <View style={[styles.ghostRing, { borderColor: "rgba(198,155,79,0.12)" }]} />
          <Animated.View
            style={[
              styles.circle,
              { borderColor: "rgba(198,155,79,0.6)", transform: [{ scale }] },
            ]}
          >
            <LinearGradient
              colors={["rgba(198,155,79,0.32)", "rgba(198,155,79,0.07)"]}
              style={StyleSheet.absoluteFill}
            />

            {running && !completed && (
              <View style={styles.circleContent} pointerEvents="none">
                <Text style={styles.phaseLabel}>{safePhase.label}</Text>
                <Text style={styles.countdownNum}>{countdown}</Text>
              </View>
            )}
            {!running && !completed && (
              <Feather name="wind" size={34} color="rgba(198,155,79,0.65)" />
            )}
            {completed && (
              <Text style={styles.completedIcon}>✓</Text>
            )}
          </Animated.View>
        </View>

        {/* Cycle dots */}
        <View style={styles.cycleRow}>
          {Array.from({ length: patternData.recommendedCycles }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.cycleDot,
                {
                  backgroundColor:
                    i < cycles
                      ? "#C69B4F"
                      : i === cycles && running
                        ? "rgba(198,155,79,0.45)"
                        : "rgba(255,255,255,0.14)",
                },
              ]}
            />
          ))}
        </View>

        <Text style={[styles.cycleLabel, { color: colors.mutedForeground }]}>
          {completed
            ? "¡Sesión completada!"
            : running
              ? `Ciclo ${cycles + 1} de ${patternData.recommendedCycles}`
              : "Listo para comenzar"}
        </Text>

        {/* Phase legend */}
        <View style={styles.legend}>
          {patternData.phases.map((p, i) => {
            const active = i === phaseIdx && running;
            return (
              <View key={i} style={styles.legendItem}>
                <View
                  style={[
                    styles.legendDot,
                    { backgroundColor: active ? "#C69B4F" : "rgba(255,255,255,0.2)" },
                  ]}
                />
                <Text style={[styles.legendText, { color: active ? colors.foreground : colors.mutedForeground }]}>
                  {p.label} {p.duration}s
                </Text>
              </View>
            );
          })}
        </View>

        {/* Main button */}
        <Pressable
          onPress={handleToggle}
          style={({ pressed }) => [styles.mainBtn, { opacity: pressed ? 0.82 : 1 }]}
        >
          <LinearGradient
            colors={["#D6A85B", "#C69B4F"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 50 }]}
          />
          <Feather
            name={btnIcon}
            size={22}
            color="#18110C"
            style={!running && !completed ? { marginLeft: 3 } : undefined}
          />
          <Text style={styles.mainBtnText}>{btnLabel}</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  backBtn: { width: 40, alignItems: "flex-start" },
  headerTitle: { fontSize: 17, fontWeight: "600", letterSpacing: 0.3 },

  scroll: { paddingTop: 10 },

  chipWrap: { marginHorizontal: 0, marginBottom: 4 },
  chipRow: { paddingHorizontal: 20, gap: 10 },
  chip: { paddingHorizontal: 20, paddingVertical: 9, borderRadius: 20, borderWidth: 1 },
  chipText: { fontSize: 14, fontWeight: "600" },

  description: {
    fontSize: 13,
    textAlign: "center",
    lineHeight: 20,
    marginTop: 14,
    marginBottom: 30,
    paddingHorizontal: 32,
  },

  circleContainer: {
    width: CIRCLE_SIZE + 70,
    height: CIRCLE_SIZE + 70,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 28,
  },
  ghostRing: {
    ...StyleSheet.absoluteFillObject,
    margin: 28,
    borderRadius: (CIRCLE_SIZE + 14) / 2,
    borderWidth: 1,
  },
  circle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    borderRadius: CIRCLE_SIZE / 2,
    borderWidth: 1.5,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  circleContent: { alignItems: "center" },
  phaseLabel: {
    fontSize: 22,
    fontWeight: "700",
    color: "#EDE1D3",
    letterSpacing: 0.4,
  },
  countdownNum: {
    fontSize: 38,
    fontWeight: "200",
    color: "#C69B4F",
    marginTop: 2,
    lineHeight: 44,
  },
  completedIcon: {
    fontSize: 44,
    color: "#C69B4F",
  },

  cycleRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginBottom: 10,
  },
  cycleDot: { width: 9, height: 9, borderRadius: 5 },
  cycleLabel: { fontSize: 13, textAlign: "center", marginBottom: 30, letterSpacing: 0.2 },

  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 14,
    marginBottom: 44,
    paddingHorizontal: 20,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 7 },
  legendDot: { width: 6, height: 6, borderRadius: 3 },
  legendText: { fontSize: 12.5 },

  mainBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    alignSelf: "center",
    paddingVertical: 16,
    paddingHorizontal: 44,
    borderRadius: 50,
    overflow: "hidden",
  },
  mainBtnText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#18110C",
    letterSpacing: 0.3,
  },
});
