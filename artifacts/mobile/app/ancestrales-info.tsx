import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { GoldGradient, GoldGradientFill } from "@/components/GoldGradient";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// ── Constantes ────────────────────────────────────────────────────────────────
const { width: W, height: H } = Dimensions.get("window");
const GOLD   = "#D4AF37";
const GOLD2  = "#E9C46A";
const TEXT   = "#F4DAD5";
const MUTED  = "rgba(242,231,228,0.5)";
const BG     = "#1B060F";
const BG_MID = "#27070E";

// Scroll offset donde cada sección entra al viewport = contentY - H
// (cuando el borde inferior del viewport toca el tope de la sección)
const R2 = 0;      // sec2 a contentY=H  → entra al desplazo 0
const R3 = 420;    // sec3 a contentY=H+420
const R4 = 900;    // sec4 a contentY=H+900
const R5 = 1420;   // sec5 a contentY=H+1420
const R6 = 1860;   // sec6 a contentY=H+1860
const TOTAL_SCROLL = H + 2180;

const HERO_IMG  = require("@/assets/images/ancestrales-hero.jpg");
const INST_IMG  = require("@/assets/images/sessions/ancestral-instrumentos.jpg");
const BOWL_IMG  = require("@/assets/images/sessions/session-2.jpg");
const GONG_IMG  = require("@/assets/images/sessions/session-9.jpg");
const BELL_IMG  = require("@/assets/images/sessions/session-7.jpg");

// ── Helper: crea opacity + translateY interpolados desde scrollY ──────────────
function mkReveal(
  scrollY: Animated.Value,
  start: number,
  range = 180,
  dy = 40,
) {
  return {
    opacity:    scrollY.interpolate({ inputRange: [start, start + range], outputRange: [0, 1], extrapolate: "clamp" }),
    translateY: scrollY.interpolate({ inputRange: [start, start + range], outputRange: [dy, 0], extrapolate: "clamp" }),
  };
}

// ── Benefit card ─────────────────────────────────────────────────────────────
const BENEFITS = [
  { icon: "wind",        label: "Reduce el estrés",       sub: "Las vibraciones disuelven la tensión acumulada en el cuerpo y la mente." },
  { icon: "moon",        label: "Mejora el sueño",         sub: "Las frecuencias Delta inducen los estados más profundos de descanso." },
  { icon: "cpu",         label: "Claridad mental",         sub: "Silencia el ruido interno y despierta tu foco natural." },
  { icon: "activity",   label: "Equilibrio nervioso",     sub: "Regula el sistema nervioso autónomo con ondas sonoras precisas." },
];

// ── Frecuencias ───────────────────────────────────────────────────────────────
const FREQS = [
  { name: "Delta",  hz: "0.5 – 4 Hz",  color: "#8E44AD", desc: "Sueño profundo y regeneración celular. El cuerpo sana mientras la mente descansa." },
  { name: "Theta",  hz: "4 – 8 Hz",    color: "#1A6AA0", desc: "Meditación profunda, creatividad y acceso al inconsciente." },
  { name: "Alpha",  hz: "8 – 14 Hz",   color: "#1A7A5E", desc: "Relajación despierta, aprendizaje acelerado y claridad." },
];

// ── Instrumentos ──────────────────────────────────────────────────────────────
const INSTRUMENTS = [
  { name: "Cuencos Tibetanos",  img: BOWL_IMG, desc: "Tallados en aleaciones de siete metales sagrados. Sus armónicos envuelven el cuerpo en capas de vibración que penetran hasta los tejidos." },
  { name: "Gongs",              img: GONG_IMG, desc: "El instrumento más poderoso de la sonoterapia. Su onda expansiva reinicia el sistema nervioso y lleva la mente al silencio total." },
  { name: "Campanas y Tingsha", img: BELL_IMG, desc: "Pequeñas pero precisas. Sus notas cristalinas limpian el espacio sonoro y anclan la atención al momento presente." },
];

// ── Pantalla ──────────────────────────────────────────────────────────────────
export default function AncestralInfoScreen() {
  const insets  = useSafeAreaInsets();
  const scrollY = useRef(new Animated.Value(0)).current;

  // ── Parallax del hero ──────────────────────────────────────────────────────
  const heroParallax = scrollY.interpolate({
    inputRange: [0, H],
    outputRange: [0, -H * 0.32],
    extrapolate: "clamp",
  });

  // ── Barra de progreso ──────────────────────────────────────────────────────
  const progressH = scrollY.interpolate({
    inputRange: [0, TOTAL_SCROLL - H],
    outputRange: [0, H - insets.top - insets.bottom - 40],
    extrapolate: "clamp",
  });

  // ── Scroll indicator (rebote) ──────────────────────────────────────────────
  const bounce = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: 10, duration: 700, useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0,  duration: 700, useNativeDriver: true }),
      ]),
    ).start();
  }, [bounce]);

  // ── Reveals por sección ────────────────────────────────────────────────────
  // Cada trigger = R(n) + cuántos px dentro de la sección está el elemento
  const intro    = mkReveal(scrollY, R2 + 10,  220);
  const introImg = mkReveal(scrollY, R2 + 120, 260, 60);

  const benTitle = mkReveal(scrollY, R3 - 20,  200);
  const ben = BENEFITS.map((_, i) => mkReveal(scrollY, R3 + 60 + i * 55, 200));

  const instTitle = mkReveal(scrollY, R4 - 20,  200);
  const inst = INSTRUMENTS.map((_, i) => mkReveal(scrollY, R4 + 60 + i * 65, 200, 50));

  const sciTitle  = mkReveal(scrollY, R5 - 20,  200);
  const sci = FREQS.map((_, i) => mkReveal(scrollY, R5 + 60 + i * 65, 200));

  const cta = mkReveal(scrollY, R6 + 20, 250);

  return (
    <View style={styles.root}>
      {/* ── Barra de progreso (derecha) ──────────────────────────────────── */}
      <View style={[styles.progressTrack, { top: insets.top + 20 }]}>
        <Animated.View style={[styles.progressFill, { height: progressH }]}>
          <GoldGradientFill />
        </Animated.View>
      </View>

      {/* ── Botón X (cierre) ─────────────────────────────────────────────── */}
      <Pressable
        onPress={() => router.back()}
        hitSlop={12}
        style={[styles.closeBtn, { top: insets.top + 12 }]}
      >
        <Feather name="x" size={20} color="#fff" />
      </Pressable>

      <Animated.ScrollView
        scrollEventThrottle={16}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false },
        )}
      >
        {/* ══════════════════════════════════════════════════════════════════
            SECCIÓN 1 — Hero fullscreen con parallax
        ══════════════════════════════════════════════════════════════════ */}
        <View style={[styles.heroWrap, { height: H }]}>
          <Animated.View style={[styles.heroImgWrap, { transform: [{ translateY: heroParallax }] }]}>
            <Image source={HERO_IMG} style={styles.heroImg} contentFit="cover" />
          </Animated.View>

          {/* Degradado superior → texto legible */}
          <LinearGradient
            colors={["rgba(27,6,15,0.55)", "transparent"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 0.4 }}
          />
          {/* Degradado inferior → transición al bg */}
          <LinearGradient
            colors={["transparent", BG]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0.6 }} end={{ x: 0, y: 1 }}
          />

          {/* Contenido del hero */}
          <View style={[styles.heroContent, { paddingTop: insets.top + 16, paddingBottom: 60 }]}>
            <View style={styles.heroCategoryTag}>
              <Text style={styles.heroCategoryText}>SONIDOS ANCESTRALES</Text>
            </View>
            <Text style={styles.heroTitle}>El Lenguaje{"\n"}de lo Sagrado</Text>
            <Text style={styles.heroTagline}>
              Descubrí el poder transformador de los instrumentos que la humanidad ha usado
              para sanar durante milenios.
            </Text>

            {/* Indicador de scroll */}
            <Animated.View style={[styles.scrollIndicator, { transform: [{ translateY: bounce }] }]}>
              <Feather name="chevrons-down" size={22} color={GOLD} />
              <Text style={styles.scrollText}>Deslizá para descubrir</Text>
            </Animated.View>
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            SECCIÓN 2 — ¿Qué son?
        ══════════════════════════════════════════════════════════════════ */}
        <View style={[styles.section, { backgroundColor: BG }]}>
          <Animated.View style={{ opacity: intro.opacity, transform: [{ translateY: intro.translateY }] }}>
            <GoldGradient style={styles.goldAccent} />
            <Text style={styles.sectionTag}>ORIGEN</Text>
            <Text style={styles.sectionTitle}>¿Qué son los{"\n"}Sonidos Ancestrales?</Text>
            <Text style={styles.sectionBody}>
              Son composiciones sonoras creadas con instrumentos milenarios —cuencos, gongs,
              campanas— cuyas vibraciones no se limitan al oído: se sienten en cada célula
              del cuerpo.{"\n\n"}
              Civilizaciones como la tibetana, la celta y la amazónica los usaron para sanar,
              meditar y entrar en contacto con estados expandidos de conciencia. Hoy, la
              ciencia respalda lo que estas tradiciones ya sabían.
            </Text>
          </Animated.View>

          <Animated.View style={[styles.introImgWrap, { opacity: introImg.opacity, transform: [{ translateY: introImg.translateY }] }]}>
            <Image source={INST_IMG} style={styles.introImg} contentFit="cover" />
            <LinearGradient
              colors={["transparent", BG]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0.6 }} end={{ x: 0, y: 1 }}
            />
          </Animated.View>
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            SECCIÓN 3 — Beneficios
        ══════════════════════════════════════════════════════════════════ */}
        <View style={[styles.section, { backgroundColor: BG_MID, paddingBottom: 50 }]}>
          <Animated.View style={{ opacity: benTitle.opacity, transform: [{ translateY: benTitle.translateY }] }}>
            <Text style={styles.sectionTag}>BENEFICIOS</Text>
            <Text style={styles.sectionTitle}>Lo que el sonido{"\n"}hace por vos</Text>
          </Animated.View>

          <View style={styles.benefitsGrid}>
            {BENEFITS.map((b, i) => (
              <Animated.View
                key={b.label}
                style={[
                  styles.benefitCard,
                  { opacity: ben[i].opacity, transform: [{ translateY: ben[i].translateY }] },
                ]}
              >
                <View style={styles.benefitIcon}>
                  <Feather name={b.icon as never} size={20} color={GOLD} />
                </View>
                <Text style={styles.benefitLabel}>{b.label}</Text>
                <Text style={styles.benefitSub}>{b.sub}</Text>
              </Animated.View>
            ))}
          </View>
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            SECCIÓN 4 — Instrumentos
        ══════════════════════════════════════════════════════════════════ */}
        <View style={[styles.section, { backgroundColor: BG }]}>
          <Animated.View style={{ opacity: instTitle.opacity, transform: [{ translateY: instTitle.translateY }] }}>
            <Text style={styles.sectionTag}>INSTRUMENTOS</Text>
            <Text style={styles.sectionTitle}>Voces de metal,{"\n"}cristal y bronce</Text>
            <Text style={styles.sectionBody}>
              Cada instrumento tiene una frecuencia única. Su combinación crea campos
              sonoros que llevan la mente a estados difíciles de alcanzar de otra manera.
            </Text>
          </Animated.View>

          {INSTRUMENTS.map((ins, i) => (
            <Animated.View
              key={ins.name}
              style={[
                styles.instCard,
                { opacity: inst[i].opacity, transform: [{ translateY: inst[i].translateY }] },
              ]}
            >
              <View style={styles.instImgWrap}>
                <Image source={ins.img} style={styles.instImg} contentFit="cover" />
                <LinearGradient
                  colors={["transparent", "rgba(27,6,15,0.9)"]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0.4 }} end={{ x: 0, y: 1 }}
                />
                <Text style={styles.instName}>{ins.name}</Text>
              </View>
              <Text style={styles.instDesc}>{ins.desc}</Text>
            </Animated.View>
          ))}
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            SECCIÓN 5 — La ciencia (frecuencias)
        ══════════════════════════════════════════════════════════════════ */}
        <View style={[styles.section, { backgroundColor: BG_MID, paddingBottom: 50 }]}>
          <Animated.View style={{ opacity: sciTitle.opacity, transform: [{ translateY: sciTitle.translateY }] }}>
            <Text style={styles.sectionTag}>NEUROCIENCIA</Text>
            <Text style={styles.sectionTitle}>El cerebro que{"\n"}escucha</Text>
            <Text style={styles.sectionBody}>
              Los sonidos ancestrales sincronizan las ondas cerebrales con frecuencias
              específicas —un proceso llamado <Text style={{ color: GOLD }}>arrastre neuronal</Text>—
              guiando la mente hacia estados de profunda restauración.
            </Text>
          </Animated.View>

          {FREQS.map((f, i) => (
            <Animated.View
              key={f.name}
              style={[
                styles.freqCard,
                { opacity: sci[i].opacity, transform: [{ translateY: sci[i].translateY }] },
              ]}
            >
              <View style={[styles.freqBar, { backgroundColor: f.color }]} />
              <View style={styles.freqContent}>
                <View style={styles.freqHeader}>
                  <Text style={styles.freqName}>{f.name}</Text>
                  <Text style={styles.freqHz}>{f.hz}</Text>
                </View>
                <Text style={styles.freqDesc}>{f.desc}</Text>
              </View>
            </Animated.View>
          ))}
        </View>

        {/* ══════════════════════════════════════════════════════════════════
            SECCIÓN 6 — CTA
        ══════════════════════════════════════════════════════════════════ */}
        <View style={[styles.ctaSection, { paddingBottom: insets.bottom + 50 }]}>
          <Image source={HERO_IMG} style={styles.ctaBg} contentFit="cover" />
          <LinearGradient
            colors={[BG_MID, "rgba(27,6,15,0.6)", "rgba(27,6,15,0.75)"]}
            style={StyleSheet.absoluteFill}
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          />

          <Animated.View style={[styles.ctaContent, { opacity: cta.opacity, transform: [{ translateY: cta.translateY }] }]}>
            <Text style={styles.ctaEyebrow}>YA ESTÁS LISTO</Text>
            <Text style={styles.ctaTitle}>Tu primera sesión{"\n"}te espera</Text>
            <Text style={styles.ctaBody}>
              Cada escucha es una oportunidad de conocerte más profundo. No necesitás
              experiencia previa — solo un lugar tranquilo y auriculares.
            </Text>

            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.ctaBtn, { opacity: pressed ? 0.85 : 1 }]}
            >
              <LinearGradient
                colors={[GOLD, GOLD2]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              />
              <Text style={styles.ctaBtnText}>Comenzar a explorar</Text>
              <Feather name="arrow-right" size={18} color={BG} />
            </Pressable>
          </Animated.View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },

  // ── Progreso + cierre ──────────────────────────────────────────────────────
  progressTrack: {
    position: "absolute", right: 10, width: 2,
    height: "100%", zIndex: 10,
    backgroundColor: "rgba(212,175,55,0.15)",
    borderRadius: 1,
  },
  progressFill: {
    width: 2, borderRadius: 1, overflow: "hidden",
  },
  closeBtn: {
    position: "absolute", right: 18, zIndex: 20,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(27,6,15,0.6)",
    alignItems: "center", justifyContent: "center",
  },

  // ── Hero ───────────────────────────────────────────────────────────────────
  heroWrap:      { overflow: "hidden" },
  heroImgWrap:   { ...StyleSheet.absoluteFillObject, height: H * 1.35 },
  heroImg:       { width: "100%", height: "100%" },
  heroContent:   {
    flex: 1, paddingHorizontal: 24,
    justifyContent: "flex-end",
  },
  heroCategoryTag: {
    alignSelf: "flex-start",
    borderWidth: 1, borderColor: GOLD,
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 4,
    marginBottom: 18,
  },
  heroCategoryText: { color: GOLD, fontSize: 10, fontWeight: "700", letterSpacing: 1.5 },
  heroTitle: {
    fontSize: 46, fontWeight: "800",
    color: TEXT, lineHeight: 52,
    marginBottom: 16,
  },
  heroTagline: {
    fontSize: 15, color: "rgba(244,218,213,0.75)",
    lineHeight: 22, marginBottom: 48,
  },
  scrollIndicator: { alignItems: "center", gap: 6 },
  scrollText: { fontSize: 11, color: GOLD, letterSpacing: 0.8 },

  // ── Secciones genéricas ────────────────────────────────────────────────────
  section: { paddingHorizontal: 24, paddingTop: 52, paddingBottom: 20 },
  goldAccent: {
    width: 36, height: 3, borderRadius: 2,
    marginBottom: 14,
  },
  sectionTag: {
    fontSize: 10, fontWeight: "700", letterSpacing: 2,
    color: GOLD, marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 32, fontWeight: "800",
    color: TEXT, lineHeight: 38, marginBottom: 18,
  },
  sectionBody: {
    fontSize: 15, color: MUTED, lineHeight: 24,
  },

  // ── Intro imagen ───────────────────────────────────────────────────────────
  introImgWrap: {
    marginTop: 32, borderRadius: 18, overflow: "hidden",
    height: 220,
  },
  introImg: { width: "100%", height: "100%" },

  // ── Beneficios ─────────────────────────────────────────────────────────────
  benefitsGrid: {
    marginTop: 32, gap: 14,
  },
  benefitCard: {
    backgroundColor: "rgba(74,12,12,0.18)",
    borderWidth: 1, borderColor: "rgba(212,175,55,0.12)",
    borderRadius: 16, padding: 18,
  },
  benefitIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(212,175,55,0.1)",
    alignItems: "center", justifyContent: "center",
    marginBottom: 12,
  },
  benefitLabel: { fontSize: 16, fontWeight: "700", color: TEXT, marginBottom: 6 },
  benefitSub:   { fontSize: 13, color: MUTED, lineHeight: 19 },

  // ── Instrumentos ───────────────────────────────────────────────────────────
  instCard: { marginTop: 28 },
  instImgWrap: { borderRadius: 16, overflow: "hidden", height: 200, justifyContent: "flex-end" },
  instImg:  { ...StyleSheet.absoluteFillObject },
  instName: {
    fontSize: 22, fontWeight: "800",
    color: TEXT, padding: 16,
  },
  instDesc: {
    fontSize: 14, color: MUTED, lineHeight: 21,
    marginTop: 12,
  },

  // ── Frecuencias ────────────────────────────────────────────────────────────
  freqCard: {
    flexDirection: "row", marginTop: 20,
    backgroundColor: "rgba(74,12,12,0.18)",
    borderRadius: 16, overflow: "hidden",
  },
  freqBar:     { width: 5 },
  freqContent: { flex: 1, padding: 18 },
  freqHeader:  { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 },
  freqName:    { fontSize: 18, fontWeight: "800", color: TEXT },
  freqHz:      { fontSize: 11, color: GOLD, fontWeight: "600", letterSpacing: 0.5 },
  freqDesc:    { fontSize: 13, color: MUTED, lineHeight: 20 },

  // ── CTA ────────────────────────────────────────────────────────────────────
  ctaSection: {
    minHeight: 380, justifyContent: "flex-end",
    overflow: "hidden",
  },
  ctaBg: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.35,
  },
  ctaContent: { paddingHorizontal: 24, paddingTop: 60, paddingBottom: 20 },
  ctaEyebrow: {
    fontSize: 10, fontWeight: "700", letterSpacing: 2,
    color: GOLD, marginBottom: 10,
  },
  ctaTitle: {
    fontSize: 36, fontWeight: "800",
    color: TEXT, lineHeight: 42, marginBottom: 16,
  },
  ctaBody: {
    fontSize: 14, color: MUTED, lineHeight: 22, marginBottom: 36,
  },
  ctaBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, height: 52, borderRadius: 26,
    overflow: "hidden",
  },
  ctaBtnText: { fontSize: 16, fontWeight: "700", color: BG },
});
