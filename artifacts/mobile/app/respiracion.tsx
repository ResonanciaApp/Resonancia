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
import { router, useLocalSearchParams } from "expo-router";
import { Feather } from "@expo/vector-icons";
import { BackPill } from "@/components/BackPill";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
  const { pattern } = useLocalSearchParams<{ pattern?: string }>();

  const initialPattern = PATTERNS.find((p) => p.id === pattern) ?? PATTERNS[0];

  const [patternData, setPatternData] = useState<PatternConfig>(initialPattern);
  const [phaseIdx, setPhaseIdx] = useState(0);
  const [countdown, setCountdown] = useState(initialPattern.phases[0].duration);
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
  const btnIcon = completed ? "rotate-ccw" : running ? "pause" : "wind";
  const btnLabel = completed ? "Repetir" : running ? "Pausar" : started ? "Continuar" : "Comenzar";

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar hidden />
      <LinearGradient
        colors={[
          "#4A7D48",
          "#3B6D3C",
          "#326740",
          "#285E3E",
          "#175543",
          "#0B4B3D",
          "#073B32",
        ]}
        locations={[0, 0.16, 0.33, 0.5, 0.68, 0.84, 1]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={[
          "rgba(126,170,101,0.22)",
          "rgba(40,94,62,0.04)",
          "rgba(3,37,31,0.28)",
        ]}
        locations={[0, 0.52, 1]}
        start={{ x: 0, y: 0.15 }}
        end={{ x: 1, y: 0.82 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <BackPill
          onPress={() => router.back()}
          size={28}
          bgColor="rgba(0,0,0,0.28)"
          borderWidth={1}
          borderColor="rgba(255,255,255,0.2)"
          iconOffsetX={-1}
        />
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
                      borderColor: "rgba(255,255,255,0.2)",
                      backgroundColor: active ? "#F9F9F9" : "rgba(0,0,0,0.28)",
                    },
                  ]}
                >
                  <Text style={[styles.chipText, { color: active ? "#060A0F" : "#F4F4F4" }]}>
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
          <View style={[styles.ghostRing, { borderColor: "rgba(249,249,249,0.20)" }]} />
          <Animated.View
            style={[
              styles.circleGlowWrap,
              { transform: [{ scale }] },
            ]}
          >
            <View pointerEvents="none" style={styles.circleGlowHalo} />
            <View
              style={[
                styles.circle,
                {
                  borderColor: "rgba(249,249,249,0.72)",
                  backgroundColor: "rgba(0,0,0,0.28)",
                },
              ]}
            >
              {running && !completed && (
                <View style={styles.circleContent} pointerEvents="none">
                  <Text style={styles.phaseLabel}>{safePhase.label}</Text>
                  <Text style={styles.countdownNum}>{countdown}</Text>
                </View>
              )}
              {!running && !completed && (
                <Feather name="wind" size={34} color="#F9F9F9" />
              )}
              {completed && (
                <Text style={styles.completedIcon}>✓</Text>
              )}
            </View>
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
                      ? "#F9F9F9"
                      : i === cycles && running
                        ? "rgba(249,249,249,0.50)"
                        : "rgba(249,249,249,0.18)",
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
                    { backgroundColor: active ? undefined : "rgba(249,249,249,0.20)", overflow: "hidden" },
                  ]}
                >
                  {active && <View style={[StyleSheet.absoluteFill, styles.activeLegendDot]} />}
                </View>
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
            colors={["#F9F9F9", "#F9F9F9"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[StyleSheet.absoluteFill, { borderRadius: 50 }]}
          />
          <Feather
            name={btnIcon}
            size={22}
            color="#060A0F"
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
  headerTitle: { fontFamily: "Manrope", fontSize: 17, fontWeight: "600", letterSpacing: 0.3 },

  scroll: { paddingTop: 10 },

  chipWrap: { marginHorizontal: 0, marginTop: 30, marginBottom: 4 },
  chipRow: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: 16,
    gap: 8,
  },
  chip: {
    height: 51,
    paddingHorizontal: 16,
    borderRadius: 27,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chipText: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600" },

  description: {
    fontFamily: "Manrope",
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
  circleGlowWrap: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0B4B3D",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 24,
    elevation: 14,
  },
  circleGlowHalo: {
    position: "absolute",
    top: -13,
    right: -13,
    bottom: -13,
    left: -13,
    borderRadius: (CIRCLE_SIZE + 26) / 2,
    backgroundColor: "rgba(11,75,61,0.22)",
  },
  circleContent: { alignItems: "center" },
  phaseLabel: {
    fontFamily: "Manrope",
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.4,
  },
  countdownNum: {
    fontFamily: "Manrope",
    fontSize: 38,
    fontWeight: "200",
    color: "#F9F9F9",
    marginTop: 2,
    lineHeight: 44,
  },
  completedIcon: {
    fontFamily: "Manrope",
    fontSize: 44,
    color: "#BE9650",
  },

  cycleRow: {
    flexDirection: "row",
    gap: 10,
    justifyContent: "center",
    marginBottom: 10,
  },
  cycleDot: { width: 9, height: 9, borderRadius: 5 },
  cycleLabel: { fontFamily: "Manrope", fontSize: 13, textAlign: "center", marginBottom: 30, letterSpacing: 0.2 },

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
  activeLegendDot: { backgroundColor: "#F9F9F9" },
  legendText: { fontFamily: "Manrope", fontSize: 12.5 },

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
    fontFamily: "Manrope",
    fontSize: 17,
    fontWeight: "700",
    color: "#060A0F",
    letterSpacing: 0.3,
  },
});
