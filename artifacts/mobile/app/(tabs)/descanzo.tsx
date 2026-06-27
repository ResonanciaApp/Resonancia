import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { SessionCard } from "@/components/SessionCard";
import { getSessionsByDescansoTag } from "@/data/sessions";
import { DESCANSO_TAG_CARDS } from "@/data/tags";
import { useColors } from "@/hooks/useColors";

const H_PAD = 20;
const { width: W, height: H } = Dimensions.get("window");
const CARD_W = Math.round((W - 30) / 2.2);

/* ─── Estrellas estáticas pre-generadas ─────────────────────────────── */
const STAR_COUNT = 100;
const COLS = 10;
const ROWS = Math.ceil(STAR_COUNT / COLS);
const STARS = [
  // Grilla con jitter para el área principal
  ...Array.from({ length: STAR_COUNT }, (_, i) => {
    const col = i % COLS;
    const row = Math.floor(i / COLS);
    return {
      key: i,
      x: (col / COLS) * W + (Math.random() - 0.5) * (W / COLS) * 0.9,
      y: (row / ROWS) * H + (Math.random() - 0.5) * (H / ROWS) * 0.9,
      size: 0.8 + Math.random() * 1.8,
      minOpacity: 0.12 + Math.random() * 0.22,
      maxOpacity: 0.5 + Math.random() * 0.5,
      duration: 1200 + Math.random() * 2800,
      delay: Math.random() * 4000,
    };
  }),
  // Franja derecha explícita (últimos 8% del ancho)
  ...Array.from({ length: 14 }, (_, i) => ({
    key: STAR_COUNT + i,
    x: W * 0.92 + Math.random() * W * 0.06,
    y: Math.random() * H,
    size: 0.8 + Math.random() * 1.5,
    minOpacity: 0.15 + Math.random() * 0.2,
    maxOpacity: 0.5 + Math.random() * 0.4,
    duration: 1400 + Math.random() * 2400,
    delay: Math.random() * 3500,
  })),
];

function NightSky() {
  const twinkles = useRef(STARS.map((s) => new Animated.Value(s.minOpacity))).current;
  const shootX   = useRef(new Animated.Value(0)).current;
  const shootY   = useRef(new Animated.Value(0)).current;
  const shootOp  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    /* Twinkle */
    STARS.forEach((star, i) => {
      const loop = () => {
        Animated.sequence([
          Animated.timing(twinkles[i], {
            toValue: star.maxOpacity,
            duration: star.duration,
            delay: star.delay,
            useNativeDriver: true,
          }),
          Animated.timing(twinkles[i], {
            toValue: star.minOpacity,
            duration: star.duration,
            useNativeDriver: true,
          }),
        ]).start(({ finished }) => { if (finished) loop(); });
      };
      loop();
    });

    /* Shooting star */
    const fire = () => {
      const sx = Math.random() * W * 0.5;
      const sy = 30 + Math.random() * H * 0.25;
      shootX.setValue(sx);
      shootY.setValue(sy);
      shootOp.setValue(0);
      Animated.sequence([
        Animated.timing(shootOp, { toValue: 0.9, duration: 120, useNativeDriver: true }),
        Animated.parallel([
          Animated.timing(shootX,  { toValue: sx + 130, duration: 550, useNativeDriver: true }),
          Animated.timing(shootY,  { toValue: sy + 90,  duration: 550, useNativeDriver: true }),
          Animated.timing(shootOp, { toValue: 0,        duration: 550, useNativeDriver: true }),
        ]),
      ]).start();
    };

    fire();
    const id = setInterval(fire, 3800);
    return () => clearInterval(id);
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {STARS.map((star, i) => (
        <Animated.View
          key={star.key}
          style={{
            position: "absolute",
            left: star.x,
            top: star.y,
            width: star.size,
            height: star.size,
            borderRadius: star.size / 2,
            backgroundColor: "#ffffff",
            opacity: twinkles[i],
          }}
        />
      ))}
      {/* Estrella fugaz */}
      <Animated.View
        style={{
          position: "absolute",
          width: 70,
          height: 1.5,
          borderRadius: 1,
          backgroundColor: "#ffffff",
          opacity: shootOp,
          transform: [
            { translateX: shootX },
            { translateY: shootY },
            { rotate: "32deg" },
          ],
        }}
      />
    </View>
  );
}

/* ─── Pantalla ──────────────────────────────────────────────────────── */
export default function DescansoScreen() {
  const colors    = useColors();
  const insets    = useSafeAreaInsets();
  const topPad    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const router    = useRouter();

  return (
    <LinearGradient
      style={styles.root}
      colors={["#080808", "#020202"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBar barStyle="light-content" />
      <SacredBackground />
      <NightSky />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 140 + bottomPad, paddingTop: topPad + 10 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={styles.hero}>
          <Ionicons name="moon" size={34} color="#C4A8F5" style={styles.heroIcon} />
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>Descanso</Text>
          <Text style={[styles.heroSubtitle, { color: colors.mutedForeground }]}>
            El descanso que mereces,{"\n"}encuéntralo aquí.
          </Text>
        </View>

        {/* ── Banner Mezclador ── */}
        <Pressable
          style={({ pressed }) => [styles.bannerWrap, pressed && { opacity: 0.82 }]}
          onPress={() => router.push("/escenas-mixer" as never)}
        >
          <LinearGradient
            style={styles.banner}
            colors={["#3D0E16", "#5C1520"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.bannerIconWrap}>
              <Feather name="moon" size={22} color="#D4AF37" />
            </View>
            <View style={styles.bannerText}>
              <Text style={[styles.bannerTitle, { color: colors.foreground }]}>
                Mezclador para dormir
              </Text>
              <Text style={[styles.bannerSub, { color: colors.mutedForeground }]}>
                Crea tu propia mezcla de sonidos
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
          </LinearGradient>
        </Pressable>

        {/* ── Carruseles ── */}
        <View style={styles.carouselsWrap}>
          {DESCANSO_TAG_CARDS.map((tag) => {
            const sessions = getSessionsByDescansoTag(tag.label);
            return (
              <View key={tag.id} style={styles.section}>
                <View style={styles.catHeader}>
                  <Text style={[styles.catTitle, { color: colors.foreground }]} numberOfLines={1}>
                    {tag.label}
                  </Text>
                  <Pressable style={styles.verTodosBtn} hitSlop={10}>
                    <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
                  </Pressable>
                </View>

                {sessions.length > 0 ? (
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.carousel}
                  >
                    {sessions.map((s) => (
                      <SessionCard key={s.id} session={s} width={CARD_W} />
                    ))}
                  </ScrollView>
                ) : (
                  <View style={[styles.emptySlot, { borderColor: colors.border }]}>
                    <Feather name="moon" size={22} color={colors.mutedForeground} />
                    <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                      Próximamente
                    </Text>
                  </View>
                )}
              </View>
            );
          })}
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { flex: 1 },

  /* Hero */
  hero: {
    alignItems: "center",
    paddingHorizontal: H_PAD,
    paddingBottom: 28,
  },
  heroIcon: {
    marginTop: 7,
    marginBottom: 14,
    transform: [{ translateY: 7 }],
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },

  /* Banner Mezclador */
  bannerWrap: {
    marginHorizontal: H_PAD,
    marginBottom: 36,
    borderRadius: 16,
    overflow: "hidden",
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 14,
  },
  bannerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(212,175,55,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerText: { flex: 1 },
  bannerTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 3,
  },
  bannerSub: { fontSize: 12 },

  /* Carruseles */
  carouselsWrap: { paddingTop: 6 },
  section:       { marginBottom: 62 },
  catHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: H_PAD,
    marginBottom: 14,
  },
  catTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.2,
    flex: 1,
  },
  verTodosBtn:  { paddingLeft: 8 },
  carousel:     { paddingLeft: H_PAD, paddingRight: 6 },
  emptySlot: {
    marginHorizontal: H_PAD,
    height: 100,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyText: { fontSize: 13 },
});
