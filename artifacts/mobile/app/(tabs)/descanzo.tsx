import { Feather, Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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

import { useColors } from "@/hooks/useColors";

/* ─── Sleep tabs ────────────────────────────────────────────────────── */
const SLEEP_TABS = [
  { id: "dormirme", emoji: "😴", line1: "Dormirme",    line2: "rápido"    },
  { id: "zen",      emoji: "🙏", line1: "Modo",        line2: "zen"       },
  { id: "relax",    emoji: "🌿", line1: "Full",        line2: "relax"     },
  { id: "ruido",    emoji: "⛈️", line1: "Ruido",       line2: "ambiental" },
] as const;

type SleepTabId = typeof SLEEP_TABS[number]["id"];

const TAB_UNSEL_COLORS: [string, string] = ["#1b0924", "#0f0514"];
const TAB_SEL_COLORS:   [string, string] = ["#2d1240", "#1a0828"];
const TAB_BORDER_SEL  = "#401950";
const TAB_TEXT_SEL    = "#E8D4FF";
const TAB_TEXT_UNSEL  = "rgba(232,212,255,0.45)";

const H_PAD = 20;
const { width: W, height: H } = Dimensions.get("window");
const CARD_W = Math.round((W - 30) / 2.2);

/* ─── Estrellas estáticas pre-generadas ─────────────────────────────── */
// Estrellas solo en el área superior (hasta ~42% de pantalla)
// Densidad decae hacia abajo para un fade natural sin borde
const STAR_ZONE = H * 0.42;
const STAR_COUNT = 110;
const COLS = 10;
const ROWS = Math.ceil(STAR_COUNT / COLS);
const STARS = Array.from({ length: STAR_COUNT }, (_, i) => {
  const col = i % COLS;
  const row = Math.floor(i / COLS);
  const normalizedRow = row / ROWS; // 0..1
  // Opacidad máxima decrece linealmente hacia la zona baja
  const rowFade = 1 - normalizedRow * 0.85;
  return {
    key: i,
    x: (col / COLS) * W + (Math.random() - 0.5) * (W / COLS) * 0.95,
    y: normalizedRow * STAR_ZONE + (Math.random() - 0.5) * (STAR_ZONE / ROWS) * 0.9,
    size: 0.8 + Math.random() * 1.6,
    minOpacity: (0.08 + Math.random() * 0.15) * rowFade,
    maxOpacity: (0.45 + Math.random() * 0.45) * rowFade,
    duration: 1200 + Math.random() * 2800,
    delay: Math.random() * 4000,
  };
});

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

  const [activeTab, setActiveTab] = useState<SleepTabId>("dormirme");

  return (
    <View style={[styles.root, { backgroundColor: "#08010C" }]}>
      <StatusBar barStyle="light-content" />
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
          <Text style={[styles.heroSubtitle, { color: "rgba(255,255,255,0.8)" }]}>
            El descanso que mereces,{"\n"}encuéntralo aquí.
          </Text>
        </View>

        {/* ── Tabs de modo ── */}
        <View style={styles.tabGrid}>
          {SLEEP_TABS.map((tab) => {
            const sel = activeTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                style={({ pressed }) => [styles.tabCell, pressed && { opacity: 0.85 }]}
              >
                <LinearGradient
                  colors={sel ? TAB_SEL_COLORS : TAB_UNSEL_COLORS}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={[styles.tabGradient, sel && styles.tabGradientSel]}
                >
                  <Text style={[styles.tabEmoji, { opacity: sel ? 1 : 0.45 }]}>{tab.emoji}</Text>
                  <Text style={[styles.tabLine, { color: sel ? TAB_TEXT_SEL : TAB_TEXT_UNSEL }]}>{tab.line1}</Text>
                  <Text style={[styles.tabLine, { color: sel ? TAB_TEXT_SEL : TAB_TEXT_UNSEL }]}>{tab.line2}</Text>
                </LinearGradient>
              </Pressable>
            );
          })}
        </View>

        {/* ── Banner Prepara tu noche ── */}
        <Pressable
          style={({ pressed }) => [styles.nightBannerWrap, pressed && { opacity: 0.82 }]}
          onPress={() => {}}
        >
          <BlurView intensity={50} tint="dark" style={styles.nightBanner}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.12)", borderRadius: 14 }]} />
            {/* Icono luna */}
            <View style={styles.nightBannerIconWrap}>
              <BlurView intensity={40} tint="light" style={StyleSheet.absoluteFill} />
              <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255,255,255,0.07)", borderRadius: 40 }]} />
              <Ionicons name="moon" size={22} color="#C4A8F5" />
            </View>
            {/* Texto */}
            <View style={{ flex: 1 }}>
              <Text style={styles.nightBannerTitle}>Prepara tu noche</Text>
              <Text style={styles.nightBannerSub}>Crea tu atmósfera perfecta</Text>
            </View>
            {/* Chevron */}
            <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.6)" />
          </BlurView>
        </Pressable>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { flex: 1 },

  /* Banner Prepara tu noche */
  nightBannerWrap: {
    marginHorizontal: H_PAD,
    marginTop: 10,
    marginBottom: 24,
    borderRadius: 14,
    overflow: "hidden",
  },
  nightBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  nightBannerIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  nightBannerTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "rgba(255,255,255,0.9)",
    marginBottom: 3,
  },
  nightBannerSub: {
    fontSize: 12,
    lineHeight: 17,
    color: "rgba(255,255,255,0.5)",
  },

  /* Sleep tabs */
  tabGrid: {
    flexDirection: "row",
    paddingHorizontal: H_PAD,
    gap: 8,
    marginBottom: 16,
  },
  tabCell: {
    width: Math.floor((W - H_PAD * 2 - 8 * 3) / 4),
    aspectRatio: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
  tabGradient: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "transparent",
  },
  tabGradientSel: {
    borderColor: TAB_BORDER_SEL,
  },
  tabEmoji: {
    fontSize: 26,
  },
  tabLine: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
  },

  /* Hero */
  hero: {
    alignItems: "center",
    paddingHorizontal: H_PAD,
    paddingBottom: 28,
  },
  heroIcon: {
    marginTop: 14,
    marginBottom: 14,
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
