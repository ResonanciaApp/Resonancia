import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useAmbientPlayer } from "@/context/AmbientPlayerContext";
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
const BG       = "#4A0C0C";
const CARD     = "rgba(74,12,12,0.08)";
const GOLD     = "#D4AF37";
const GOLD_LT  = "#D4AF37";
const MUTED    = "rgba(242,231,228,0.45)";
const FG       = "#FFFFFF";
const BORDER   = "rgba(212,175,55,0.25)";

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
    title: "¿Cuándo prefieres meditar?",
    subtitle: "Puedes elegir más de uno",
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
    title: "¿Cuánto tiempo tienes por sesión?",
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
              backgroundColor: i === current ? GOLD : "rgba(212,175,55,0.30)",
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
  const { stopAmbient } = useAmbientPlayer();

  // Ensure ambient widget sound never plays during onboarding
  useEffect(() => { stopAmbient(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // step: -1 = welcome, 0-4 = questions, 5 = closing
  const [step, setStep] = useState(-1);
  const [answers, setAnswers] = useState<Record<string, string | string[]>>({});

  // ── Audio ─────────────────────────────────────────────────────────────────
  const soundRef = useRef<Audio.Sound | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        await Audio.setAudioModeAsync({ playsInSilentModeIOS: true });
        const { sound } = await Audio.Sound.createAsync(
          require("@/assets/audio/om_mani_padme_hum.mp3"),
          { isLooping: true, volume: 0, shouldPlay: true }
        );
        if (!mounted) { await sound.unloadAsync(); return; }
        soundRef.current = sound;
        // Fade in over 4 seconds
        let vol = 0;
        const step = 0.05;
        const interval = setInterval(async () => {
          vol = Math.min(vol + step, 0.55);
          try { await sound.setVolumeAsync(vol); } catch {}
          if (vol >= 0.55) clearInterval(interval);
        }, 350);
      } catch {}
    })();
    return () => {
      mounted = false;
      soundRef.current?.unloadAsync().catch(() => {});
      soundRef.current = null;
    };
  }, []);

  // Welcome screen only: fades in from 0
  const welcomeOpacity = useRef(new Animated.Value(0)).current;
  const logoScale      = useRef(new Animated.Value(0.85)).current;
  // Survey/closing: always visible, only slides up
  const stepSlideY     = useRef(new Animated.Value(0)).current;
  const ripple         = useRef(new Animated.Value(0)).current;

  // Welcome fade-in — runs once on mount
  useEffect(() => {
    Animated.parallel([
      Animated.timing(welcomeOpacity, { toValue: 1, duration: 400, useNativeDriver: ND }),
      Animated.timing(logoScale, { toValue: 1, duration: 350, useNativeDriver: ND }),
    ]).start();
  }, []);

  // Slide-in for survey steps — content always visible, just slides up
  useEffect(() => {
    if (step < 0) return;
    stepSlideY.setValue(32);
    Animated.timing(stepSlideY, { toValue: 0, duration: 300, useNativeDriver: ND }).start();

    if (step === QUESTIONS.length) {
      ripple.setValue(0);
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
    // Fade out audio before navigating
    const sound = soundRef.current;
    if (sound) {
      let vol = 0.55;
      const interval = setInterval(async () => {
        vol = Math.max(vol - 0.07, 0);
        try { await sound.setVolumeAsync(vol); } catch {}
        if (vol <= 0) {
          clearInterval(interval);
          sound.unloadAsync().catch(() => {});
          soundRef.current = null;
        }
      }, 120);
      await new Promise((r) => setTimeout(r, 1000));
    }
    router.replace("/(tabs)");
  };

  // ── Welcome ────────────────────────────────────────────────────────────────
  if (step === -1) {
    return (
      <LinearGradient
        colors={["#2A040C", "#1B060F", "#27070E", "#1B060F"]}
        style={[styles.fill, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      >
        <StatusBar barStyle="light-content" />
        <Animated.View
          style={[styles.welcomeContent, { opacity: welcomeOpacity, transform: [{ scale: logoScale }] }]}
        >
          <View style={styles.welcomeGlow}>
            <View style={styles.glowRing} />
            <Image
              source={require("@/assets/images/logo-vinyl.png")}
              style={styles.welcomeLogo}
              resizeMode="contain"
            />
          </View>

          <View style={{ paddingHorizontal: 32, width: "100%" }}>
            <Text style={styles.welcomeTitle}>Bienvenido/a a tu refugio</Text>
            <Text style={styles.welcomeSubtitle}>
              Un espacio de sonido, silencio y presencia.{"\n"}
              Estamos aquí para acompañarte.
            </Text>
          </View>
        </Animated.View>

        <Animated.View
          style={[styles.welcomeBottom, { paddingBottom: insets.bottom + 24, opacity: welcomeOpacity }]}
        >
          <Text style={styles.welcomeHint}>
            Te haremos unas preguntas para personalizar tu experiencia
          </Text>
          <Pressable onPress={goNext} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>Comenzar   →</Text>
          </Pressable>
          <Pressable onPress={finish} style={styles.skipBtn}>
            <Text style={styles.skipBtnText}>SKIP</Text>
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
        colors={["#4A0C0C", "#27070E", "#1B060F"]}
        style={[styles.fill, { paddingTop: insets.top, paddingBottom: insets.bottom }]}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      >
        <StatusBar barStyle="light-content" />
        <Animated.View style={[styles.closingContent, { transform: [{ translateY: stepSlideY }] }]}>
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
          <Text style={styles.accountHint}>
            ¿Quieres agregar amigos y guardar tu progreso?{"\n"}Crea tu cuenta gratis (opcional).
          </Text>
          <Pressable
            onPress={async () => {
              await AsyncStorage.setItem(STORAGE_KEY, "true");
              await AsyncStorage.setItem(PROFILE_KEY, JSON.stringify(answers));
              const sound = soundRef.current;
              if (sound) {
                try { await sound.setVolumeAsync(0); await sound.unloadAsync(); } catch {}
                soundRef.current = null;
              }
              router.replace("/(auth)/sign-up");
            }}
            style={styles.primaryBtn}
          >
            <Text style={styles.primaryBtnText}>Crear cuenta gratis   →</Text>
          </Pressable>
          <Pressable onPress={finish} style={styles.skipBtn}>
            <Text style={styles.skipBtnText}>ENTRAR SIN CUENTA</Text>
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
      colors={["#4A0C0C", "#27070E", "#1B060F"]}
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
        style={[styles.questionContent, { transform: [{ translateY: stepSlideY }] }]}
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
        <Animated.View style={{ transform: [{ translateY: stepSlideY }] }}>
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
              !canContinue && { color: "rgba(244,218,213,0.40)" },
            ]}
          >
            {step === QUESTIONS.length - 1 ? "Ver mi espacio   →" : "Continuar   →"}
          </Text>
        </Pressable>
        {q.multi && (
          <Text style={styles.multiHint}>Puedes seleccionar varias opciones</Text>
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
    gap: 40,
  },
  welcomeGlow: {
    width: 280,
    height: 280,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  glowRing: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 140,
    backgroundColor: "rgba(212,175,55,0.06)",
  },
  welcomeLogo: { width: 165, height: 165, alignSelf: "center" },
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
  accountHint: {
    color: MUTED,
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
    fontFamily: "Inter_400Regular",
    paddingHorizontal: 16,
    marginBottom: 4,
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
    backgroundColor: "rgba(212,175,55,0.12)",
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
    backgroundColor: "rgba(212,175,55,0.15)",
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
    backgroundColor: "rgba(212,175,55,0.08)",
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
    backgroundColor: "rgba(212,175,55,0.08)",
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
  primaryBtnDisabled: { backgroundColor: "rgba(212,175,55,0.2)" },
  skipBtn: {
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 4,
  },
  skipBtnText: {
    color: "rgba(212,175,55,0.5)",
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 2,
  },
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
