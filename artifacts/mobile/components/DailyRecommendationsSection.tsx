import React from "react";
import { useFocusEffect } from "expo-router";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  StyleProp,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { CategoryAtmosphericCard } from "@/components/CategoryAtmosphericCard";
import { SessionRow } from "@/components/SessionRow";
import type { Session } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";
import { useSceneTheme } from "@/context/SceneThemeContext";

type Props = {
  sessions: Session[];
  dayKey?: string;
  style?: StyleProp<ViewStyle>;
  inicio3Compact?: boolean;
  onRefreshRecommendations?: () => void;
  nextSessions?: Session[];
  roulettePool?: Session[];
};

type RouletteSlotHandle = {
  run: (
    sequence: Session[],
    durations: number[],
    initialDelay: number,
    reduceMotion: boolean,
  ) => Promise<void>;
  stop: (resetDisplay?: boolean) => void;
};

const ROULETTE_DURATIONS = [100, 110, 120, 140, 170, 210, 260, 320, 400, 500, 650];

function runTiming(
  value: Animated.Value,
  toValue: number,
  duration: number,
  easing: (value: number) => number,
) {
  return new Promise<void>((resolve) => {
    Animated.timing(value, {
      toValue,
      duration,
      easing,
      useNativeDriver: true,
    }).start(() => resolve());
  });
}

const RouletteRecommendationSlot = React.forwardRef<RouletteSlotHandle, {
  session: Session;
  slotIndex: number;
  inicio3Compact: boolean;
  themeAccent: string;
  indigo2: boolean;
  interactive: boolean;
}>(({
  session,
  slotIndex,
  inicio3Compact,
  themeAccent,
  indigo2,
  interactive,
}, ref) => {
  const [animatedSession, setAnimatedSession] = React.useState<Session | null>(null);
  const translateY = React.useRef(new Animated.Value(0)).current;
  const opacity = React.useRef(new Animated.Value(1)).current;
  const scale = React.useRef(new Animated.Value(1)).current;
  const generationRef = React.useRef(0);
  const timerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const delayResolveRef = React.useRef<(() => void) | null>(null);

  React.useEffect(() => {
    setAnimatedSession(null);
  }, [session.id]);

  const stop = React.useCallback((resetDisplay = true) => {
    generationRef.current += 1;
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
    delayResolveRef.current?.();
    delayResolveRef.current = null;
    translateY.stopAnimation();
    opacity.stopAnimation();
    scale.stopAnimation();
    translateY.setValue(0);
    opacity.setValue(1);
    scale.setValue(1);
    if (resetDisplay) setAnimatedSession(null);
  }, [opacity, scale, translateY]);

  React.useEffect(() => () => stop(false), [stop]);

  React.useImperativeHandle(ref, () => ({
    stop,
    run: async (sequence, durations, initialDelay, reduceMotion) => {
      stop();
      const generation = generationRef.current;
      if (initialDelay > 0) {
        await new Promise<void>((resolve) => {
          delayResolveRef.current = resolve;
          timerRef.current = setTimeout(() => {
            timerRef.current = null;
            delayResolveRef.current = null;
            resolve();
          }, initialDelay);
        });
      }
      if (generation !== generationRef.current) return;

      if (reduceMotion) {
        await runTiming(opacity, 0, 120, Easing.out(Easing.quad));
        if (generation !== generationRef.current) return;
        setAnimatedSession(sequence[sequence.length - 1]);
        await runTiming(opacity, 1, 180, Easing.out(Easing.cubic));
        return;
      }

      for (let index = 0; index < sequence.length; index += 1) {
        const duration = durations[index] ?? durations[durations.length - 1] ?? 180;
        const outgoingDuration = Math.max(40, Math.round(duration * 0.42));
        const incomingDuration = Math.max(50, duration - outgoingDuration);
        await Promise.all([
          runTiming(translateY, -18, outgoingDuration, Easing.in(Easing.quad)),
          runTiming(opacity, 0.18, outgoingDuration, Easing.in(Easing.quad)),
          runTiming(scale, 0.97, outgoingDuration, Easing.in(Easing.quad)),
        ]);
        if (generation !== generationRef.current) return;
        setAnimatedSession(sequence[index]);
        translateY.setValue(18);
        scale.setValue(0.97);
        await Promise.all([
          runTiming(translateY, 0, incomingDuration, Easing.out(Easing.cubic)),
          runTiming(opacity, 1, incomingDuration, Easing.out(Easing.cubic)),
          runTiming(scale, 1, incomingDuration, Easing.out(Easing.cubic)),
        ]);
        if (generation !== generationRef.current) return;
      }
    },
  }), [opacity, scale, stop, translateY]);

  const visibleSession = animatedSession ?? session;
  return (
    <>
      <Animated.View
        pointerEvents={interactive ? "auto" : "none"}
        style={{
          opacity,
          transform: [{ translateY }, { scale }],
        }}
      >
        <CategoryAtmosphericCard
          categoryId={visibleSession.categoryId}
          style={[
            styles.recommendationCard,
            inicio3Compact && styles.inicio3RecommendationCard,
          ]}
        >
          <SessionRow
            session={visibleSession}
            imageSize={inicio3Compact ? 81.9 : 103.7}
            imageOffsetX={inicio3Compact ? 0 : -4}
            metaText={
              inicio3Compact
                ? visibleSession.categoryLabel
                : `${visibleSession.categoryLabel} · ${visibleSession.durationLabel}`
            }
            showDurationBadge={inicio3Compact}
            showChevron
            titleFontSize={inicio3Compact ? 15 : undefined}
            titleFontWeight={inicio3Compact ? "600" : undefined}
            authorColor={themeAccent}
            authorFontSize={indigo2 ? 11 : undefined}
            chevronColor={inicio3Compact ? "#F9F9F9" : indigo2 ? themeAccent : undefined}
            style={[styles.row, inicio3Compact && styles.inicio3Row]}
          />
        </CategoryAtmosphericCard>
      </Animated.View>
      {inicio3Compact && slotIndex < 2 ? (
        <View style={styles.inicio3CardDivider} />
      ) : null}
    </>
  );
});

RouletteRecommendationSlot.displayName = "RouletteRecommendationSlot";

const WEEKDAYS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

const MONTHS = [
  "ene.",
  "feb.",
  "mar.",
  "abr.",
  "may.",
  "jun.",
  "jul.",
  "ago.",
  "sep.",
  "oct.",
  "nov.",
  "dic.",
];

function formatDailyDate(dayKey?: string): string {
  const parts = dayKey?.split("-").map(Number);
  const date = parts?.length === 3
    ? new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1)
    : new Date();
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function DailyRecommendationsSection({
  sessions,
  dayKey,
  style,
  inicio3Compact = false,
  onRefreshRecommendations,
  nextSessions = [],
  roulettePool = [],
}: Props) {
  const colors = useColors();
  const { theme } = useSceneTheme();
  const recommendations = sessions.slice(0, 3);
  const themeAccent = theme.accent ?? colors.accent;
  const [isSpinning, setIsSpinning] = React.useState(false);
  const slotRefs = React.useRef<Array<RouletteSlotHandle | null>>([]);
  const spinCounterRef = React.useRef(0);
  const activeRunRef = React.useRef(0);
  const mountedRef = React.useRef(true);
  const focusedRef = React.useRef(false);
  const inputSignature = `${dayKey ?? ""}|${recommendations
    .map((session) => session.id)
    .join(",")}|${nextSessions.map((session) => session.id).join(",")}`;
  const inputSignatureRef = React.useRef(inputSignature);
  inputSignatureRef.current = inputSignature;
  const previousInputSignatureRef = React.useRef(inputSignature);

  React.useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      activeRunRef.current += 1;
      slotRefs.current.forEach((slot) => slot?.stop());
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      focusedRef.current = true;
      return () => {
        focusedRef.current = false;
        activeRunRef.current += 1;
        slotRefs.current.forEach((slot) => slot?.stop());
        setIsSpinning(false);
      };
    }, []),
  );

  React.useEffect(() => {
    const inputChanged = previousInputSignatureRef.current !== inputSignature;
    previousInputSignatureRef.current = inputSignature;
    if (!inputChanged || !isSpinning) return;
    activeRunRef.current += 1;
    slotRefs.current.forEach((slot) => slot?.stop(true));
    setIsSpinning(false);
  }, [inputSignature, isSpinning]);

  const startRoulette = React.useCallback(async () => {
    if (
      isSpinning ||
      !onRefreshRecommendations ||
      nextSessions.length < 3 ||
      roulettePool.length < 3
    ) return;

    setIsSpinning(true);
    const runId = activeRunRef.current + 1;
    activeRunRef.current = runId;
    const startingInputSignature = inputSignatureRef.current;
    spinCounterRef.current += 1;
    const spinNumber = spinCounterRef.current;
    const reduceMotion = await AccessibilityInfo.isReduceMotionEnabled().catch(() => false);
    if (
      !mountedRef.current ||
      !focusedRef.current ||
      runId !== activeRunRef.current ||
      startingInputSignature !== inputSignatureRef.current
    ) return;

    const runs = recommendations.map((current, slotIndex) => {
      const target = nextSessions[slotIndex];
      const interimPool = roulettePool.filter(
        (candidate) => candidate.id !== current.id && candidate.id !== target.id,
      );
      const sequence = ROULETTE_DURATIONS.map((_, stepIndex) => {
        if (stepIndex === ROULETTE_DURATIONS.length - 1) return target;
        if (interimPool.length === 0) return target;
        const candidateIndex =
          (spinNumber * 7 + slotIndex * 5 + stepIndex * 3) % interimPool.length;
        return interimPool[candidateIndex];
      });
      return slotRefs.current[slotIndex]?.run(
        sequence,
        ROULETTE_DURATIONS,
        reduceMotion ? 0 : slotIndex * 250,
        reduceMotion,
      ) ?? Promise.resolve();
    });

    await Promise.all(runs);
    if (
      !mountedRef.current ||
      !focusedRef.current ||
      runId !== activeRunRef.current ||
      startingInputSignature !== inputSignatureRef.current
    ) return;
    onRefreshRecommendations();
    setIsSpinning(false);
  }, [
    isSpinning,
    nextSessions,
    onRefreshRecommendations,
    recommendations,
    roulettePool,
  ]);

  if (recommendations.length < 3) return null;

  return (
    <View style={[styles.section, style]} testID="inicio2-daily-recommendations">
      <View style={[styles.headerRow, inicio3Compact && styles.inicio3HeaderShift]}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Recomendaciones diarias
        </Text>
        <Text style={[styles.date, { color: theme.id === "indigo2" ? colors.accent : colors.mutedForeground }]}>
          {formatDailyDate(dayKey)}
        </Text>
      </View>

      <View
        style={[
          styles.recommendationsList,
          inicio3Compact && styles.inicio3RecommendationsList,
        ]}
      >
        {recommendations.map((session, index) => (
          <RouletteRecommendationSlot
            key={index}
            ref={(slot) => {
              slotRefs.current[index] = slot;
            }}
            session={session}
            slotIndex={index}
            inicio3Compact={inicio3Compact}
            themeAccent={themeAccent}
            indigo2={theme.id === "indigo2"}
            interactive={!isSpinning}
          />
        ))}
        {onRefreshRecommendations ? (
          <Pressable
            onPress={() => void startRoulette()}
            disabled={isSpinning}
            accessibilityRole="button"
            accessibilityLabel="Actualizar recomendaciones"
            accessibilityState={{ disabled: isSpinning, busy: isSpinning }}
            style={({ pressed }) => [
              styles.refreshButton,
              inicio3Compact && styles.inicio3RefreshButton,
              { opacity: isSpinning ? 0.58 : pressed ? 0.78 : 1 },
            ]}
          >
            <Text style={styles.refreshButtonText}>
              {isSpinning ? "Buscando recomendaciones..." : "Actualizar recomendaciones"}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 53,
  },
  headerRow: {
    marginBottom: 27,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    flexShrink: 1,
    fontFamily: "Manrope",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  date: {
    flexShrink: 0,
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "400",
  },
  inicio3HeaderShift: {
    transform: [{ translateY: 10 }],
  },
  recommendationsList: {
    gap: 12,
  },
  inicio3RecommendationsList: {
    gap: 0,
    paddingTop: 8,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    overflow: "hidden",
  },
  recommendationCard: {
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  inicio3RecommendationCard: {
    borderRadius: 16,
    backgroundColor: "transparent",
    borderWidth: 0,
    borderColor: "transparent",
  },
  inicio3CardDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 11,
    marginVertical: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  refreshButton: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: "rgba(184,117,240,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  inicio3RefreshButton: {
    marginHorizontal: 11,
    marginBottom: 3,
  },
  refreshButtonText: {
    fontFamily: "Manrope",
    fontSize: 15,
    color: "#F9F9F9",
    fontWeight: "600",
  },
  row: {
    paddingVertical: 9.3,
    paddingHorizontal: 16,
  },
  inicio3Row: {
    paddingVertical: 8.3,
    paddingHorizontal: 11,
  },
});