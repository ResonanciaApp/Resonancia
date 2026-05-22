import { Feather } from "@expo/vector-icons";
import { Cinzel_400Regular, Cinzel_900Black, useFonts } from "@expo-google-fonts/cinzel";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useRef } from "react";
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
import { SESSIONS, getFeaturedSessions, getSleepSessions, getShortSessions } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");
const HERO_HEIGHT = 340;

export default function HomeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentSession, playSession } = usePlayer();
  const scrollRef = useRef<ScrollView>(null);
  const [fontsLoaded] = useFonts({ Cinzel_900Black, Cinzel_400Regular });

  const featured = getFeaturedSessions();
  const sleepSessions = getSleepSessions();
  const shortSessions = getShortSessions();
  const dailySession = SESSIONS[5] ?? SESSIONS[0];

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: 160 + bottomPad,
          paddingTop: topPad + 12,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
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

        {/* Hero Section */}
        <View style={[styles.heroCard, { borderColor: "rgba(198,155,79,0.2)" }]}>
          <Image
            source={require("@/assets/images/hero-bowl.png")}
            style={styles.heroImage}
          />
          <LinearGradient
            colors={["transparent", "rgba(24,17,12,0.7)", colors.background]}
            locations={[0, 0.5, 1]}
            style={StyleSheet.absoluteFill}
          />
          {/* Glow rings centered on bowl */}
          <View style={styles.glowCenter}>
            <GlowRing size={120} color="rgba(198,155,79,0.2)" delay={0} duration={3500} />
            <GlowRing size={180} color="rgba(198,155,79,0.12)" delay={500} duration={3500} />
            <GlowRing size={240} color="rgba(198,155,79,0.07)" delay={1000} duration={3500} />
          </View>
          <View style={styles.heroContent}>
            <Text style={[styles.heroLabel, { color: colors.accent }]}>SESIÓN DESTACADA</Text>
            <Text style={[styles.heroTitle, { color: colors.foreground }]}>
              {featured[0]?.title}
            </Text>
            <Text style={[styles.heroSub, { color: colors.softSand ?? "#D9C5AE" }]}>
              {featured[0]?.subtitle} · {featured[0]?.durationLabel}
            </Text>
            <Pressable
              onPress={() => featured[0] && playSession(featured[0])}
              style={({ pressed }) => [
                styles.heroBtn,
                { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
              ]}
            >
              <Feather name="play" size={16} color={colors.primaryForeground} />
              <Text style={[styles.heroBtnText, { color: colors.primaryForeground }]}>
                Comenzar a Escuchar
              </Text>
            </Pressable>
          </View>
        </View>

        {/* Daily Ritual */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Ritual Diario
          </Text>
          <Pressable
            onPress={() => router.push(`/session/${dailySession.id}` as never)}
            style={[styles.ritualCard, { backgroundColor: colors.card, borderColor: "rgba(198,155,79,0.18)" }]}
          >
            <LinearGradient
              colors={["rgba(198,155,79,0.06)", "transparent"]}
              style={StyleSheet.absoluteFill}
            />
            <View style={[styles.ritualBadge, { backgroundColor: "rgba(198,155,79,0.15)" }]}>
              <Feather name="sun" size={14} color={colors.accent} />
            </View>
            <View style={styles.ritualInfo}>
              <Text style={[styles.ritualLabel, { color: colors.accent }]}>
                SUGERIDO PARA HOY
              </Text>
              <Text style={[styles.ritualTitle, { color: colors.foreground }]}>
                {dailySession.title}
              </Text>
              <Text style={[styles.ritualSub, { color: colors.mutedForeground }]}>
                {dailySession.subtitle} · {dailySession.durationLabel}
              </Text>
            </View>
            <Pressable
              onPress={() => playSession(dailySession)}
              style={[styles.ritualPlay, { backgroundColor: colors.primary }]}
            >
              <Feather name="play" size={14} color={colors.primaryForeground} />
            </Pressable>
          </Pressable>
        </View>

        {/* Featured Sessions */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Sesiones Destacadas
            </Text>
            <Pressable onPress={() => router.push("/(tabs)/explore" as never)}>
              <Text style={[styles.seeAll, { color: colors.accent }]}>Ver todo</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hScroll}
          >
            {featured.map((s) => (
              <SessionCard key={s.id} session={s} width={180} />
            ))}
          </ScrollView>
        </View>

        {/* Sleep Sessions */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Cuencos Tibetanos
            </Text>
            <Feather name="moon" size={14} color={colors.accent} />
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hScroll}
          >
            {sleepSessions.map((s) => (
              <SessionCard key={s.id} session={s} width={180} />
            ))}
          </ScrollView>
        </View>

        {/* Quick Sessions */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Para Reflexionar
            </Text>
            <Text style={[styles.seeAll, { color: colors.mutedForeground }]}>
              Sesiones cortas
            </Text>
          </View>
          {shortSessions.map((s) => (
            <SessionCard key={s.id} session={s} horizontal />
          ))}
        </View>

        {/* Explore Categories */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Explorar
            </Text>
            <Pressable onPress={() => router.push("/(tabs)/explore" as never)}>
              <Text style={[styles.seeAll, { color: colors.accent }]}>Todas las categorías</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.hScroll}
          >
            {CATEGORIES.slice(0, 6).map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => router.push("/(tabs)/explore" as never)}
                style={({ pressed }) => [
                  styles.miniCat,
                  {
                    backgroundColor: colors.card,
                    borderColor: "rgba(198,155,79,0.18)",
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <LinearGradient
                  colors={cat.gradient as [string, string]}
                  style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                />
                <Feather name={cat.icon as React.ComponentProps<typeof Feather>["name"]} size={20} color={cat.color} />
                <Text style={[styles.miniCatText, { color: colors.foreground }]} numberOfLines={2}>
                  {cat.title}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  logoImage: {
    width: 190,
    height: 47,
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  heroCard: {
    marginHorizontal: 20,
    height: HERO_HEIGHT,
    borderRadius: 26,
    overflow: "hidden",
    borderWidth: 1,
    marginBottom: 28,
  },
  heroImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
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
  heroLabel: {
    fontSize: 10,
    letterSpacing: 2,
    marginBottom: 6,
    fontWeight: "600",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 4,
    lineHeight: 34,
  },
  heroSub: {
    fontSize: 13,
    marginBottom: 18,
    opacity: 0.85,
  },
  heroBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 30,
  },
  heroBtnText: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  section: {
    marginBottom: 28,
    paddingHorizontal: 20,
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  seeAll: {
    fontSize: 13,
  },
  hScroll: {
    paddingRight: 20,
  },
  ritualCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    overflow: "hidden",
    marginTop: 10,
  },
  ritualBadge: {
    width: 40,
    height: 40,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  ritualInfo: {
    flex: 1,
  },
  ritualLabel: {
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: "700",
    marginBottom: 3,
  },
  ritualTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 2,
  },
  ritualSub: {
    fontSize: 12,
  },
  ritualPlay: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  miniCat: {
    width: 110,
    height: 110,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 10,
    padding: 14,
    justifyContent: "space-between",
    overflow: "hidden",
  },
  miniCatText: {
    fontSize: 12,
    fontWeight: "600",
    lineHeight: 16,
  },
});
