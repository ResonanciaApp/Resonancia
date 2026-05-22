import { Feather } from "@expo/vector-icons";
import { Cinzel_400Regular, Cinzel_900Black, useFonts } from "@expo-google-fonts/cinzel";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
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

import { DiarioEntryCard } from "@/components/DiarioEntryCard";
import { MessageDeck } from "@/components/MessageDeck";
import { GlowRing } from "@/components/GlowRing";
import { SacredBackground } from "@/components/SacredBackground";
import { SessionCard } from "@/components/SessionCard";
import { usePlayer } from "@/context/PlayerContext";
import { getPrimaryCategories, getSecondaryCategories } from "@/data/categories";
import { SESSIONS, getFeaturedSessions, type Session } from "@/data/sessions";
import { useDiarioFavoritesCtx } from "@/context/DiarioFavoritesContext";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");
const GRID_GAP = 12;
const GRID_PAD = 20;
const CARD_W = (width - GRID_PAD * 2 - GRID_GAP) / 2;
const CARD_H = CARD_W * 0.72;
const HERO_HEIGHT = 320;

const INTENCION_SEEN_KEY = "cdc_intencion_onboarding_seen";
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
  const insets = useSafeAreaInsets();
  const { playSession } = usePlayer();
  const [fontsLoaded] = useFonts({ Cinzel_900Black, Cinzel_400Regular });

  async function handleIntentionPress() {
    const seen = await AsyncStorage.getItem(INTENCION_SEEN_KEY);
    if (seen === "true") {
      router.push("/intencion" as never);
    } else {
      router.push("/intencion-onboarding" as never);
    }
  }

  const { favoriteEntries } = useDiarioFavoritesCtx();
  const topDiarioFavs = favoriteEntries.slice(0, 5);

  const featured = getFeaturedSessions();
  const featuredSession = featured[0];
  // Last 5 sessions (most recently added = highest index)
  const newSessions = [...SESSIONS].reverse().slice(0, 5);
  // 6 random sessions — shuffled once on mount via useMemo
  const recommended = React.useMemo<Session[]>(() => {
    const pool = [...SESSIONS];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 6);
  }, []);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 160 + bottomPad, paddingTop: topPad + 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. INTENCIÓN DEL DÍA ── */}
        <View style={styles.header}>
          {/* Avatar — esquina derecha */}
          <Pressable
            onPress={() => router.push("/(tabs)/profile" as never)}
            style={[styles.avatarBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="user" size={18} color={colors.accent} />
          </Pressable>

          {/* Widget de intención — centrado, sin fondo */}
          <Pressable
            onPress={handleIntentionPress}
            style={({ pressed }) => [styles.intentionCard, { opacity: pressed ? 0.75 : 1 }]}
          >
            <Text style={[styles.intentionLabel, { color: colors.mutedForeground }]}>
              Hoy voy a ...
            </Text>
            <View style={styles.intentionRow}>
              <BlinkingCursor color={colors.primary} />
              <Text style={[styles.intentionPlaceholder, { color: "#FFFFFF" }]}>
                Establece tu intención aquí
              </Text>
            </View>
          </Pressable>
        </View>

        {/* ── 2. CATEGORÍAS ── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Categorías</Text>
            <Pressable onPress={() => router.push("/(tabs)/explore" as never)}>
              <Text style={[styles.seeAll, { color: colors.accent }]}>Ver todas</Text>
            </Pressable>
          </View>

          {/* Primarias — banners anchos */}
          <View style={styles.primaryCats}>
            {getPrimaryCategories().map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => router.push(`/category/${cat.id}` as never)}
                style={({ pressed }) => [styles.primaryCard, { opacity: pressed ? 0.82 : 1 }]}
              >
                <LinearGradient
                  colors={cat.gradient as [string, string]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                />
                <View style={styles.primaryBorder} />
                <View style={[styles.primaryIconWrap, { backgroundColor: "rgba(255,255,255,0.14)", borderColor: "rgba(255,255,255,0.22)" }]}>
                  <Feather name={cat.icon as React.ComponentProps<typeof Feather>["name"]} size={22} color={cat.color} />
                </View>
                <View style={styles.primaryText}>
                  <Text style={styles.primaryLabel}>PRINCIPAL</Text>
                  <Text style={styles.primaryTitle} numberOfLines={1}>{cat.title}</Text>
                  <Text style={styles.primarySub} numberOfLines={1}>{cat.subtitle}</Text>
                </View>
                <Feather name="chevron-right" size={18} color="rgba(255,237,195,0.5)" style={styles.primaryChevron} />
              </Pressable>
            ))}
          </View>

          {/* Secundarias — grid 2×2 */}
          <View style={styles.grid}>
            {getSecondaryCategories().map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => router.push(`/category/${cat.id}` as never)}
                style={({ pressed }) => [styles.gridCard, { opacity: pressed ? 0.82 : 1 }]}
              >
                <LinearGradient
                  colors={cat.gradient as [string, string]}
                  style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                />
                <View style={[styles.gridIconBg, { backgroundColor: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.18)" }]}>
                  <Feather name={cat.icon as React.ComponentProps<typeof Feather>["name"]} size={16} color={cat.color} />
                </View>
                <Text style={[styles.gridTitle, { color: "#F5EDD8" }]} numberOfLines={2}>
                  {cat.title}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── 3. SESIÓN DESTACADA ── */}
        {featuredSession && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 14 }]}>
              Sesión Destacada
            </Text>
            <View style={[styles.heroCard, { borderColor: "rgba(198,155,79,0.22)" }]}>
              <Image source={featuredSession.image as number} style={styles.heroImage} />
              <LinearGradient
                colors={["transparent", "rgba(24,17,12,0.65)", colors.background]}
                locations={[0, 0.5, 1]}
                style={StyleSheet.absoluteFill}
              />
              <View style={styles.glowCenter}>
                <GlowRing size={110} color="rgba(198,155,79,0.18)" delay={0} duration={3500} />
                <GlowRing size={170} color="rgba(198,155,79,0.1)" delay={600} duration={3500} />
              </View>
              <View style={styles.heroContent}>
                <Text style={[styles.heroLabel, { color: colors.accent }]}>SESIÓN DESTACADA</Text>
                <Text style={[styles.heroTitle, { color: colors.foreground }]}>
                  {featuredSession.title}
                </Text>
                <Text style={[styles.heroSub, { color: "#D9C5AE" }]}>
                  {featuredSession.subtitle} · {featuredSession.durationLabel}
                </Text>
                <Pressable
                  onPress={() => playSession(featuredSession)}
                  style={({ pressed }) => [
                    styles.heroBtn,
                    { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
                  ]}
                >
                  <Feather name="play" size={15} color={colors.primaryForeground} style={{ paddingLeft: 2 }} />
                  <Text style={[styles.heroBtnText, { color: colors.primaryForeground }]}>
                    Comenzar a Escuchar
                  </Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}

        {/* ── 4. MENSAJE DEL DÍA ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Un mensaje para ti
          </Text>
          <Text style={[styles.sectionSub, { color: colors.mutedForeground }]}>
            Deja que el universo te hable hoy
          </Text>
          <MessageDeck />
        </View>

        {/* ── 5. NUEVAS SESIONES ── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Nuevas Sesiones</Text>
            <Pressable onPress={() => router.push("/(tabs)/explore" as never)}>
              <Text style={[styles.seeAll, { color: colors.accent }]}>Ver todo</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hScroll}
          >
            {newSessions.map((s) => (
              <SessionCard key={s.id} session={s} width={175} />
            ))}
          </ScrollView>
        </View>

        {/* ── 5. RECOMENDADAS PARA TI ── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Recomendadas para ti
            </Text>
            <Pressable onPress={() => router.push("/(tabs)/explore" as never)}>
              <Text style={[styles.seeAll, { color: colors.accent }]}>Ver todo</Text>
            </Pressable>
          </View>
          {recommended.map((s) => (
            <SessionCard key={s.id} session={s} horizontal />
          ))}
        </View>

        {/* ── 6. REFLEXIONES FAVORITAS (top 5) ── */}
        {topDiarioFavs.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionRow}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                Reflexiones favoritas
              </Text>
              <Pressable onPress={() => router.push("/(tabs)/favorites" as never)}>
                <Text style={[styles.seeAll, { color: colors.accent }]}>Ver todas</Text>
              </Pressable>
            </View>
            <View style={styles.diarioList}>
              {topDiarioFavs.map((entry) => (
                <DiarioEntryCard key={entry.id} entry={entry} showHeart />
              ))}
            </View>
          </View>
        )}
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
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-end",
    marginBottom: 14,
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

  // Primary categories (full-width banners)
  primaryCats: { gap: 10, marginBottom: 10 },
  primaryCard: {
    width: "100%",
    height: 76,
    borderRadius: 20,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    overflow: "hidden",
  },
  primaryBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,220,140,0.18)",
  },
  primaryIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  primaryText: { flex: 1, marginLeft: 14 },
  primaryLabel: {
    fontSize: 9,
    fontWeight: "700",
    letterSpacing: 1.8,
    color: "rgba(255,220,140,0.7)",
    marginBottom: 2,
  },
  primaryTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F5EDD8",
    letterSpacing: 0.2,
  },
  primarySub: {
    fontSize: 11,
    color: "rgba(245,237,216,0.6)",
    marginTop: 2,
  },
  primaryChevron: { marginLeft: 8 },

  // Secondary category grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },
  gridCard: {
    width: CARD_W,
    height: CARD_H * 0.88,
    borderRadius: 16,
    padding: 12,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  gridIconBg: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  gridTitle: { fontSize: 12, fontWeight: "700", lineHeight: 17, marginTop: 6 },
  gridCount: { fontSize: 11, marginTop: 2 },

  // Hero
  heroCard: {
    height: HERO_HEIGHT,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
  },
  heroImage: { width: "100%", height: "100%", resizeMode: "cover" },
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
});
