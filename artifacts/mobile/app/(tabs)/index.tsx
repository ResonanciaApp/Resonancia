import { Feather } from "@expo/vector-icons";
import { Cinzel_400Regular, Cinzel_900Black, useFonts } from "@expo-google-fonts/cinzel";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
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

import { GlowRing } from "@/components/GlowRing";
import { SacredBackground } from "@/components/SacredBackground";
import { SessionCard } from "@/components/SessionCard";
import { usePlayer } from "@/context/PlayerContext";
import { CATEGORIES } from "@/data/categories";
import { SESSIONS, getFeaturedSessions, type Session } from "@/data/sessions";
import { useDiarioFavoritesCtx } from "@/context/DiarioFavoritesContext";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");
const GRID_GAP = 12;
const GRID_PAD = 20;
const CARD_W = (width - GRID_PAD * 2 - GRID_GAP) / 2;
const CARD_H = CARD_W * 0.72;
const HERO_HEIGHT = 320;

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { playSession } = usePlayer();
  const [fontsLoaded] = useFonts({ Cinzel_900Black, Cinzel_400Regular });

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
        {/* ── 1. LOGO ── */}
        <View style={styles.header}>
          <Image
            source={require("@/assets/images/logo-resonancia-gold.png")}
            style={styles.logoImage}
            resizeMode="contain"
          />
          <Pressable
            onPress={() => router.push("/(tabs)/profile" as never)}
            style={[styles.avatarBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="user" size={18} color={colors.accent} />
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
          <View style={styles.grid}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => router.push(`/category/${cat.id}` as never)}
                style={({ pressed }) => [styles.gridCard, { opacity: pressed ? 0.82 : 1 }]}
              >
                <LinearGradient
                  colors={cat.gradient as [string, string]}
                  style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
                />
                <View style={[styles.gridIconBg, { backgroundColor: "rgba(255,255,255,0.12)", borderColor: "rgba(255,255,255,0.18)" }]}>
                  <Feather name={cat.icon as React.ComponentProps<typeof Feather>["name"]} size={18} color={cat.color} />
                </View>
                <Text style={[styles.gridTitle, { color: "#F5EDD8" }]} numberOfLines={2}>
                  {cat.title}
                </Text>
                <Text style={[styles.gridCount, { color: "rgba(255,237,195,0.7)" }]}>
                  {cat.sessionCount} {cat.sessionCount === 1 ? "sesión" : "sesiones"}
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
              <Image source={featuredSession.image} style={styles.heroImage} />
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

        {/* ── 4. NUEVAS SESIONES ── */}
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
                <View
                  key={entry.id}
                  style={[styles.diarioCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={styles.diarioCardTop}>
                    <View
                      style={[
                        styles.diarioBadge,
                        { backgroundColor: entry.accentColor + "20", borderColor: entry.accentColor + "55" },
                      ]}
                    >
                      <Text style={[styles.diarioBadgeText, { color: entry.accentColor }]}>
                        {entry.sectionTitle}
                      </Text>
                    </View>
                    <Feather name="heart" size={11} color="#E07070" />
                  </View>
                  <Text
                    style={[styles.diarioText, { color: colors.foreground }]}
                    numberOfLines={2}
                  >
                    {entry.text}
                  </Text>
                </View>
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: GRID_PAD,
    marginBottom: 24,
  },
  logoImage: { width: 190, height: 47 },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
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
  seeAll: { fontSize: 13 },

  // Category grid
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
  },
  gridCard: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 18,
    padding: 14,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  gridIconBg: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  gridTitle: { fontSize: 13, fontWeight: "700", lineHeight: 18, marginTop: 8 },
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
  diarioCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  diarioCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  diarioBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  diarioBadgeText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.4 },
  diarioText: { fontSize: 13, lineHeight: 20 },
});
