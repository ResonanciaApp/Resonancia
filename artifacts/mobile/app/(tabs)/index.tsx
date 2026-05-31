import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Cinzel_400Regular, Cinzel_900Black, useFonts } from "@expo-google-fonts/cinzel";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
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

import { NotificationBell } from "@/components/NotificationBell";
import { MensajesAnonimosPanel } from "@/components/MensajesAnonimosPanel";
import { MessageDeck } from "@/components/MessageDeck";
import { GlowRing } from "@/components/GlowRing";
import { SacredBackground } from "@/components/SacredBackground";
import { SessionCard } from "@/components/SessionCard";
import { useDrawer } from "@/context/DrawerContext";
import { usePlayer } from "@/context/PlayerContext";
import { useIntencion } from "@/context/IntencionContext";
import { CATEGORIES } from "@/data/categories";
import { SESSIONS, getFeaturedSessions, getSessionById, type Session } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";
import PremiumBanner from "@/components/PremiumBanner";
import QuoteOfTheDay from "@/components/QuoteOfTheDay";

const { width } = Dimensions.get("window");
const GRID_GAP = 12;
const GRID_PAD = 20;


const CARD_W = (width - GRID_PAD * 2 - GRID_GAP) / 2;
const CARD_H = CARD_W * 0.72;
const HERO_HEIGHT = 320;

const ND = Platform.OS !== "web";

function BlinkingCursor({ color }: { color: string }) {
  const opacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0, duration: 480, useNativeDriver: ND }),
        Animated.timing(opacity, { toValue: 1, duration: 480, useNativeDriver: ND }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [opacity]);
  return (
    <Animated.Text style={{ opacity, color, fontSize: 17, lineHeight: 24, fontWeight: "300" }}>
      |
    </Animated.Text>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const { savedEntries: intencionSaved, favorites: intencionFavs } = useIntencion();
  const currentIntencion = intencionSaved[0]?.text ?? intencionFavs[0] ?? null;
  const insets = useSafeAreaInsets();
  const { playSession, history } = usePlayer();
  const [fontsLoaded] = useFonts({ Cinzel_900Black, Cinzel_400Regular });

  function handleIntentionPress() {
    router.push("/intencion-onboarding" as never);
  }


  const featured = getFeaturedSessions();
  // Rotate daily: pick a different featured session each day of the year.
  const featuredSession = React.useMemo(() => {
    if (!featured.length) return undefined;
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
    return featured[dayOfYear % featured.length];
  }, []);
  // Last 5 sessions (most recently added = highest index)
  const newSessions = [...SESSIONS].reverse().slice(0, 5);
  // Descubrí algo nuevo — shuffled once on mount via useMemo
  const recommended = React.useMemo<Session[]>(() => {
    const pool = [...SESSIONS];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 4);
  }, []);

  // Últimas sesiones únicas escuchadas (max 5)
  const recentSessions = React.useMemo(() => {
    const seen = new Set<string>();
    const result: Session[] = [];
    for (const entry of history) {
      if (seen.has(entry.sessionId)) continue;
      seen.add(entry.sessionId);
      const s = getSessionById(entry.sessionId);
      if (s) result.push(s);
      if (result.length === 5) break;
    }
    return result;
  }, [history]);

  const { open: openDrawer } = useDrawer();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: "#2A1D14" }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 160 + bottomPad, paddingTop: topPad + 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. INTENCIÓN DEL DÍA ── */}
        <View style={styles.header}>
          {/* Fila superior: hamburger izquierda + avatar derecha */}
          <View style={styles.headerTopRow}>
            <Pressable
              onPress={() => openDrawer()}
              hitSlop={12}
              style={styles.iconBtnBare}
            >
              <Feather name="menu" size={22} color="#BCAE9C" />
            </Pressable>
            <NotificationBell />
          </View>

          {/* Widget de intención — centrado, sin fondo */}
          <Pressable
            onPress={handleIntentionPress}
            style={({ pressed }) => [styles.intentionCard, { opacity: pressed ? 0.75 : 1 }]}
          >
            <Text style={[styles.intentionLabel, { color: colors.mutedForeground }]}>
              Hoy voy a ...
            </Text>
            <View style={styles.intentionRow}>
              {currentIntencion ? (
                <Text style={[styles.intentionPlaceholder, { color: colors.primary, fontStyle: "italic" }]} numberOfLines={2}>
                  {currentIntencion}
                </Text>
              ) : (
                <>
                  <BlinkingCursor color={colors.primary} />
                  <Text style={[styles.intentionPlaceholder, { color: "#FFFFFF" }]}>
                    Establece tu intención aquí
                  </Text>
                </>
              )}
            </View>
          </Pressable>
        </View>

        {/* ── 2. CATEGORÍAS ── */}
        <View style={[styles.section, { marginBottom: 20 }]}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Categorías</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catPillRow}
          >
            {CATEGORIES.filter((cat) => cat.id !== "sabiduria-dia").map((cat) => {
              const bgColor = cat.gradient[1] + "CC";
              const fgColor = cat.color;
              return (
              <Pressable
                key={cat.id}
                onPress={() => router.push(`/category/${cat.id}` as never)}
                style={({ pressed }) => [styles.catPillItem, { opacity: pressed ? 0.7 : 1 }]}
              >
                <View style={[styles.catPillCircle, { backgroundColor: "#18110C" }]}>
                  <View style={[StyleSheet.absoluteFillObject, { backgroundColor: bgColor, borderRadius: 32 }]} />
                  {cat.iconFamily === "MaterialCommunityIcons" ? (
                    <MaterialCommunityIcons
                      name={cat.icon as React.ComponentProps<typeof MaterialCommunityIcons>["name"]}
                      size={26}
                      color={fgColor}
                    />
                  ) : (
                    <Feather
                      name={cat.icon as React.ComponentProps<typeof Feather>["name"]}
                      size={26}
                      color={fgColor}
                    />
                  )}
                </View>
                <Text style={[styles.catPillLabel, { color: fgColor }]} numberOfLines={2}>
                  {cat.title}
                </Text>
              </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── 3. SESIÓN DESTACADA ── */}
        {featuredSession && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 14 }]}>
              Sesión destacada del día
            </Text>
            <Pressable
              style={[styles.heroCard]}
              onPress={() => router.push(`/session/${featuredSession.id}` as never)}
            >
              <Image source={featuredSession.image as number} style={styles.heroImage} resizeMode="cover" />
              <LinearGradient
                colors={["transparent", "rgba(24,17,12,0.65)", colors.background]}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.glowCenter}>
                <GlowRing size={110} color="rgba(182,149,95,0.18)" delay={0} duration={3500} />
                <GlowRing size={170} color="rgba(182,149,95,0.1)" delay={600} duration={3500} />
              </View>
              <View style={styles.heroContent}>
                <Text style={[styles.heroTitle, { color: colors.foreground }]}>
                  {featuredSession.title}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14, marginTop: 2 }}>
                  <Feather name="clock" size={12} color="#EDE1D3" style={{ marginRight: 4, marginTop: 1 }} />
                  <Text style={{ fontSize: 13, color: "#EDE1D3", opacity: 0.85, lineHeight: 16 }}>
                    {featuredSession.durationLabel}
                  </Text>
                </View>
                <Pressable
                  onPress={() => playSession(featuredSession)}
                  style={({ pressed }) => [
                    styles.heroBtn,
                    { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Text style={[styles.heroBtnText, { color: colors.primaryForeground }]}>
                    Escuchar ahora
                  </Text>
                </Pressable>
              </View>
            </Pressable>
          </View>
        )}

        {/* ── 5. DESCUBRÍ ALGO NUEVO ── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Descubrí algo nuevo
            </Text>
          </View>
          {recommended.map((s) => (
            <SessionCard key={s.id} session={s} horizontal cardBg="rgba(255,255,255,0.05)" />
          ))}
        </View>

        {/* ── 5. FRASE DEL DÍA ── */}
        <QuoteOfTheDay />

        {/* ── 7. NUEVAS SESIONES ── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Nuevas sesiones</Text>
            <Pressable onPress={() => router.push("/nuevas-sesiones" as never)}>
              <Text style={[styles.seeAll, { color: colors.accent }]}>Ver todo</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hScroll}
          >
            {newSessions.map((s) => (
              <SessionCard key={s.id} session={s} width={110} />
            ))}
          </ScrollView>
        </View>

        {/* ── 11. HISTORIAL RECIENTE ── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Escuchado recientemente
            </Text>
            {recentSessions.length > 0 && (
              <Pressable onPress={() => router.push("/recientes" as never)}>
                <Text style={[styles.seeAll, { color: colors.accent }]}>Ver todo</Text>
              </Pressable>
            )}
          </View>
          {recentSessions.length === 0 ? (
            <Pressable
              onPress={() => router.push("/(tabs)/explore" as never)}
              style={[styles.recentEmpty, { backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(182,149,95,0.15)" }]}
            >
              <Feather name="headphones" size={28} color="rgba(182,149,95,0.35)" />
              <Text style={[styles.recentEmptyTitle, { color: colors.foreground }]}>
                Tu historial está vacío
              </Text>
              <Text style={[styles.recentEmptyText, { color: colors.mutedForeground }]}>
                Las sesiones que escuches aparecerán aquí para que puedas volver a ellas fácilmente.
              </Text>
              <View style={[styles.recentEmptyBtn, { borderColor: "rgba(182,149,95,0.3)" }]}>
                <Text style={[styles.recentEmptyBtnText, { color: colors.accent }]}>Explorar sesiones</Text>
              </View>
            </Pressable>
          ) : (
            recentSessions.map((s) => (
              <SessionCard key={s.id} session={s} horizontal cardBg="rgba(255,255,255,0.05)" />
            ))
          )}
        </View>

        {/* ── 10. BANNER PREMIUM ── */}
        <PremiumBanner />


      </ScrollView>

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },

  // Header
  header: {
    paddingHorizontal: GRID_PAD,
    marginBottom: 20,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  iconBtnBare: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  intentionCard: {
    paddingVertical: 10,
    alignItems: "center",
  },
  intentionLabel: {
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginBottom: 6,
    textAlign: "center",
  },
  intentionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  intentionPlaceholder: {
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.1,
    textAlign: "center",
  },

  // Section
  section: { marginBottom: 28, paddingHorizontal: GRID_PAD },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", letterSpacing: 0.3 },
  sectionSub: { fontSize: 12, marginTop: 4, marginBottom: 16 },
  seeAll: { fontSize: 13 },

  // Categories — pill icons row
  catPillRow: {
    gap: 14,
    paddingRight: 20,
  },
  catPillItem: {
    alignItems: "center",
    width: 78,
    gap: 8,
  },
  catPillCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  catPillLabel: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 14,
    letterSpacing: 0.1,
  },

  // Hero
  heroCard: {
    height: HERO_HEIGHT,
    borderRadius: 24,
    overflow: "hidden",
  },
  heroImage: { width: "100%", height: "100%" },
  glowCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  heroContent: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 22,
  },
  heroLabel: { fontSize: 10, letterSpacing: 2, marginBottom: 6, fontWeight: "600" },
  heroTitle: { fontSize: 26, fontWeight: "700", marginBottom: 4, lineHeight: 32 },
  heroSub: { fontSize: 13, marginBottom: 18, opacity: 0.85 },
  heroBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 30,
  },
  heroBtnText: { fontSize: 14, fontWeight: "700", letterSpacing: 0.5 },

  // Horizontal scroll
  hScroll: { paddingRight: 20 },

  // Diary favorites
  diarioList: { gap: 10 },

  // Historial vacío
  recentEmpty: {
    borderWidth: 1,
    borderRadius: 18,
    borderStyle: "dashed",
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
    gap: 8,
  },
  recentEmptyTitle: { fontSize: 15, fontWeight: "700", marginTop: 4 },
  recentEmptyText: { fontSize: 13, lineHeight: 19, textAlign: "center", maxWidth: 280 },
  recentEmptyBtn: {
    marginTop: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  recentEmptyBtnText: { fontSize: 13, fontWeight: "600" },
});
