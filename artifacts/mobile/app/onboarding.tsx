import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const ND = Platform.OS !== "web";

const { width: SW, height: SH } = Dimensions.get("window");

const STORAGE_KEY = "cdc_onboarding_done";
const PROFILE_KEY = "cdc_onboarding_profile";

// ── Palette ──────────────────────────────────────────────────────────────────
const BG       = "#18110C";
const CARD     = "#24160F";
const GOLD     = "#C69B4F";
const GOLD_LT  = "#E8C97A";
const MUTED    = "#7A6040";
const FG       = "#EDE1D3";
const BORDER   = "rgba(198,155,79,0.25)";

// ── Survey definition ─────────────────────────────────────────────────────────
type Question = {
  key: string;
  title: string;
  subtitle: string;
  multi?: boolean;
  options: { emoji: string; label: string; value: string }[];
};

const QUESTIONS: Question[] = [
  {
    key: "intention",
    title: "¿Qué te trajo aquí?",
    subtitle: "Tu intención es el primer paso",
    options: [
      { emoji: "🌙", label: "Dormir mejor", value: "sleep" },
      { emoji: "💆", label: "Reducir el estrés", value: "stress" },
      { emoji: "🧘", label: "Profundizar mi meditación", value: "meditation" },
      { emoji: "🔔", label: "Explorar el sonido sanador", value: "sound" },
    ],
  },
  {
    key: "experience",
    title: "¿Cuál es tu relación con la meditación?",
    subtitle: "Todos los caminos son válidos",
    options: [
      { emoji: "🌱", label: "Nunca he meditado", value: "beginner" },
      { emoji: "🌿", label: "Medito de vez en cuando", value: "occasional" },
      { emoji: "🌳", label: "Tengo una práctica regular", value: "regular" },
    ],
  },
  {
    key: "time_of_day",
    title: "¿Cuándo preferís meditar?",
    subtitle: "Podés elegir más de uno",
    multi: true,
    options: [
      { emoji: "🌅", label: "Por la mañana", value: "morning" },
      { emoji: "☀️", label: "Al mediodía", value: "noon" },
      { emoji: "🌆", label: "Por la tarde", value: "afternoon" },
      { emoji: "🌙", label: "Por la noche", value: "night" },
    ],
  },
  {
    key: "duration",
    title: "¿Cuánto tiempo tenés por sesión?",
    subtitle: "Unos minutos ya cambian todo",
    options: [
      { emoji: "⚡", label: "5 a 10 minutos", value: "short" },
      { emoji: "🕐", label: "15 a 20 minutos", value: "medium" },
      { emoji: "🌊", label: "30 minutos o más", value: "long" },
    ],
  },
  {
    key: "feeling",
    title: "¿Cómo estás llegando hoy?",
    subtitle: "Sin juicio, solo honestidad",
    options: [
      { emoji: "🌀", label: "Con la mente agitada", value: "restless" },
      { emoji: "😮‍💨", label: "Cansado/a y necesito calma", value: "tired" },
      { emoji: "😰", label: "Con ansiedad o tensión", value: "anxious" },
      { emoji: "✨", label: "Bien, y quiero ir más profundo", value: "curious" },
    ],
  },
];

// ── Dot indicator ─────────────────────────────────────────────────────────────
function Dots({ total, current }: { total: number; current: number }) {
  return (
    <View style={styles.dots}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.dot,
            {
              backgroundColor: i === current ? GOLD : "rgba(198,155,79,0.3)",
              width: i === current ? 20 : 7,
            },
          ]}
        />
      ))}
    </View>
  );
}

// ── Option card ───────────────────────────────────────────────────────────────
function OptionCard({
  emoji,
  label,
  selected,
  onPress,
}: {
  emoji: string;
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const scale = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.sequence([
      Animated.timing(scale, { toValue: 0.95, duration: 80, useNativeDriver: ND }),
      Animated.timing(scale, { toValue: 1, duration: 120, useNativeDriver: ND }),
    ]).start();
    onPress();
  };

  return (
    <Pressable onPress={handlePress} style={{ width: "100%" }}>
      <Animated.View
        style={[
          styles.optionCard,
          selected && styles.optionCardSelected,
          { transform: [{ scale }] },
        ]}
      >
        <Text style={styles.optionEmoji}>{emoji}</Text>
        <Text style={[styles.optionLabel, selected && { color: GOLD_LT }]}>{label}</Text>
        {selected && (
          <View style={styles.checkBadge}>
            <Text style={styles.checkText}>✓</Text>
          </View>
        )}
      </Animated.View>
    </Pressable>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function Onboarding() {
  const insets = useSafeAreaInsets();

  // step: -1 = welcome, 0-4 = questions, 5 = closing
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  const opacity   = useRef(new Animated.Value(0)).current;
  const slideY    = useRef(new Animated.Value(30)).current;
  const logoScale = useRef(new Animated.Value(0.8)).current;
  const ripple    = useRef(new Animated.Value(0)).current;

  // Animate in on step change
  useEffect(() => {
    opacity.setValue(0);
    slideY.setValue(step === -1 ? 0 : 30);
    logoScale.setValue(step === -1 ? 0.85 : 1);

    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: step === -1 ? 1000 : 350, useNativeDriver: ND }),
      Animated.timing(slideY, { toValue: 0, duration: 350, useNativeDriver: ND }),
      Animated.timing(logoScale, { toValue: 1, duration: 800, useNativeDriver: ND }),
    ]).start();

    if (step === QUESTIONS.length) {
      // closing ripple
      Animated.loop(
        Animated.timing(ripple, { toValue: 1, duration: 3000, useNativeDriver: ND })
      ).start();
    }
  }, [step]);

  const currentQ = step >= 0 && step < QUESTIONS.length ? QUESTIONS[step] : null;

  const toggleAnswer = (q: Question, value: string) => {
    setAnswers((prev) => {
      if (q.multi) {
        const current = (prev[q.key] as string[] | undefined) ?? [];
        const exists = current.includes(value);
        return {
          ...prev,
          [q.key]: exists ? current.filter((v) => v !== value) : [...current, value],
        };
      }
      return { ...prev, [q.key]: value };
    });
  };

  const isSelected = (q: Question, value: string): boolean => {
    const ans = answers[q.key];
    if (q.multi) return Array.isArray(ans) && ans.includes(value);
    return ans === value;
  };

  const hasAnswer = (q: Question): boolean => {
    const ans = answers[q.key];
    if (q.multi) return Array.isArray(ans) && ans.length > 0;
    return !!ans;
  };

  const goNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setStep((s) => s + 1);
  };

  const finish = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await AsyncStorage.setItem(STORAGE_KEY, "true");
    await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(answers));
    router.replace("/(tabs)");
  };

  // ── Welcome ────────────────────────────────────────────────────────────────
  if (step === -1) {
    return (
      <LinearGradient
        colors={["#0E0907", "#1A100A", "#2A1708", "#1E1208"]}
        style={[styles.fill, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      >
        <StatusBar barStyle="light-content" />
        <Animated.View
          style={[styles.welcomeContent, { opacity, transform: [{ scale: logoScale }] }]}
        >
          <View style={styles.welcomeGlow}>
            <View style={styles.glowRing} />
            <Image
              source={require("@/assets/images/logo-cdc-square.png")}
              style={styles.welcomeLogo}
              resizeMode="contain"
            />
          </View>

          <Animated.View style={{ opacity, transform: [{ translateY: slideY }] }}>
            <Text style={styles.welcomeTitle}>Bienvenido/a a tu refugio</Text>
            <Text style={styles.welcomeSubtitle}>
              Un espacio de sonido, silencio y presencia.{"\n"}
              Estamos aquí para acompañarte.
            </Text>
          </Animated.View>
        </Animated.View>

        <Animated.View
          style={[styles.welcomeBottom, { paddingBottom: insets.bottom + 24, opacity }]}
        >
          <Text style={styles.welcomeHint}>
            Te haremos unas preguntas para personalizar tu experiencia
          </Text>
          <Pressable onPress={goNext} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Comenzar   →</Text>
          </Pressable>
        </Animated.View>
      </LinearGradient>
    );
  }

  // ── Closing ────────────────────────────────────────────────────────────────
  if (step === QUESTIONS.length) {
    const rippleScale = ripple.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.25, 1] });
    const rippleOp    = ripple.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.4, 0.0, 0.4] });

    return (
      <LinearGradient
        colors={["#0E0907", "#1A100A", "#2A1708"]}
        style={[styles.fill, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      >
        <StatusBar barStyle="light-content" />
        <Animated.View style={[styles.closingContent, { opacity }]}>
          {/* Animated ripple */}
          <View style={styles.rippleContainer}>
            <Animated.View
              style={[
                styles.rippleRing,
                { transform: [{ scale: rippleScale }], opacity: rippleOp },
              ]}
            />
            <View style={styles.rippleCore}>
              <Text style={styles.rippleEmoji}>🔔</Text>
            </View>
          </View>

          <Text style={styles.closingTitle}>Tu espacio está listo</Text>
          <Text style={styles.closingSubtitle}>
            Las frecuencias sagradas te esperan.{"\n"}
            Cada sesión es un viaje hacia adentro.
          </Text>
        </Animated.View>

        <View style={[styles.welcomeBottom, { paddingBottom: insets.bottom + 24 }]}>
          <Pressable onPress={finish} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Entrar a Casa del Cuenco   →</Text>
          </Pressable>
        </View>
      </LinearGradient>
    );
  }

  // ── Survey steps ──────────────────────────────────────────────────────────
  const q = currentQ!;
  const canContinue = hasAnswer(q);

  return (
    <LinearGradient
      colors={["#0E0907", "#1A100A", "#2A1708"]}
      style={[styles.fill, { paddingTop: insets.top }]}
      start={{ x: 0.3, y: 0 }}
      end={{ x: 0.7, y: 1 }}
    >
      <StatusBar barStyle="light-content" />

      {/* Progress bar */}
      <View style={styles.progressBar}>
        <View
          style={[
            styles.progressFill,
            { width: `${((step + 1) / QUESTIONS.length) * 100}%` },
          ]}
        />
      </View>

      {/* Back + dots */}
      <View style={styles.topNav}>
        <Pressable
          onPress={() => setStep((s) => s - 1)}
          style={styles.backBtn}
          hitSlop={12}
        >
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Dots total={QUESTIONS.length} current={step} />
        <View style={{ width: 40 }} />
      </View>

      <Animated.View
        style={[styles.questionContent, { opacity, transform: [{ translateY: slideY }] }]}
      >
        <Text style={styles.stepCounter}>
          {step + 1} / {QUESTIONS.length}
        </Text>
        <Text style={styles.questionTitle}>{q.title}</Text>
        <Text style={styles.questionSubtitle}>{q.subtitle}</Text>
      </Animated.View>

      <ScrollView
        contentContainerStyle={[
          styles.optionsScroll,
          { paddingBottom: insets.bottom + 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity, transform: [{ translateY: slideY }] }}>
          {q.options.map((opt) => (
            <OptionCard
              key={opt.value}
              emoji={opt.emoji}
              label={opt.label}
              selected={isSelected(q, opt.value)}
              onPress={() => toggleAnswer(q, opt.value)}
            />
          ))}
        </Animated.View>
      </ScrollView>

      {/* CTA */}
      <View
        style={[
          styles.ctaContainer,
          { paddingBottom: insets.bottom + 20 },
        ]}
      >
        <Pressable
          onPress={goNext}
          disabled={!canContinue}
          style={[styles.primaryBtn, !canContinue && styles.primaryBtnDisabled]}
        >
          <Text
            style={[
              styles.primaryBtnText,
              !canContinue && { color: "rgba(255,255,255,0.4)" },
            ]}
          >
            {step === QUESTIONS.length - 1 ? "Ver mi espacio   →" : "Continuar   →"}
          </Text>
        </Pressable>
        {q.multi && (
          <Text style={styles.multiHint}>Podés seleccionar varias opciones</Text>
        )}
      </View>
    </LinearGradient>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  fill: { flex: 1 },

  // Welcome
  welcomeContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 40,
  },
  welcomeGlow: { alignItems: "center", justifyContent: "center" },
  glowRing: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(198,155,79,0.06)",
  },
  welcomeLogo: { width: 260, height: 260 },
  welcomeTitle: {
    color: FG,
    fontSize: 26,
    fontFamily: "PlayfairDisplay_700Bold",
    textAlign: "center",
    lineHeight: 34,
  },
  welcomeSubtitle: {
    color: MUTED,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 24,
    marginTop: 12,
    fontFamily: "Inter_400Regular",
  },
  welcomeBottom: {
    paddingHorizontal: 28,
    gap: 14,
  },
  welcomeHint: {
    color: MUTED,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 16,
  },

  // Closing
  closingContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    gap: 28,
  },
  rippleContainer: { alignItems: "center", justifyContent: "center", marginBottom: 8 },
  rippleRing: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 1.5,
    borderColor: GOLD,
  },
  rippleCore: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(198,155,79,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  rippleEmoji: { fontSize: 36 },
  closingTitle: {
    color: FG,
    fontSize: 28,
    fontFamily: "PlayfairDisplay_700Bold",
    textAlign: "center",
  },
  closingSubtitle: {
    color: MUTED,
    fontSize: 15,
    textAlign: "center",
    lineHeight: 24,
    fontFamily: "Inter_400Regular",
  },

  // Progress
  progressBar: {
    height: 2,
    backgroundColor: "rgba(198,155,79,0.15)",
    marginTop: 4,
  },
  progressFill: {
    height: 2,
    backgroundColor: GOLD,
    borderRadius: 1,
  },

  // Top nav
  topNav: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(198,155,79,0.08)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: BORDER,
  },
  backArrow: { color: GOLD, fontSize: 18 },

  // Dots
  dots: { flexDirection: "row", alignItems: "center", gap: 5 },
  dot: { height: 7, borderRadius: 4 },

  // Question
  questionContent: { paddingHorizontal: 24, paddingBottom: 20, gap: 6 },
  stepCounter: {
    color: MUTED,
    fontSize: 11,
    letterSpacing: 2,
    fontFamily: "Inter_500Medium",
    marginBottom: 4,
  },
  questionTitle: {
    color: FG,
    fontSize: 24,
    fontFamily: "PlayfairDisplay_700Bold",
    lineHeight: 32,
  },
  questionSubtitle: {
    color: MUTED,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },

  // Options
  optionsScroll: { paddingHorizontal: 20, gap: 10 },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: CARD,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BORDER,
    marginBottom: 10,
  },
  optionCardSelected: {
    borderColor: GOLD,
    backgroundColor: "rgba(198,155,79,0.08)",
  },
  optionEmoji: { fontSize: 26 },
  optionLabel: {
    flex: 1,
    color: FG,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    lineHeight: 22,
  },
  checkBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
  },
  checkText: { color: "#fff", fontSize: 12, fontWeight: "700" },

  // CTA
  ctaContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 16,
    backgroundColor: "rgba(14,9,7,0.92)",
    gap: 8,
  },
  primaryBtn: {
    backgroundColor: GOLD,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
  },
  primaryBtnDisabled: { backgroundColor: "rgba(198,155,79,0.2)" },
  primaryBtnText: {
    color: "#1A0E08",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.3,
  },
  multiHint: {
    color: MUTED,
    fontSize: 11,
    textAlign: "center",
    fontFamily: "Inter_400Regular",
  },
});
