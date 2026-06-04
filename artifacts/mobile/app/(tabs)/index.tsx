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
import { AlmaCommunitySection } from "@/components/AlmaCommunitySection";
import { MessageDeck } from "@/components/MessageDeck";
import { GlowRing } from "@/components/GlowRing";
import { SacredBackground } from "@/components/SacredBackground";
import { SessionCard } from "@/components/SessionCard";
import { VideoCard } from "@/components/VideoCard";
import { useDrawer } from "@/context/DrawerContext";
import { usePlayer } from "@/context/PlayerContext";
import { useIntencion } from "@/context/IntencionContext";
import { CATEGORIES } from "@/data/categories";
import { SESSIONS, getFeaturedSessions, type Session } from "@/data/sessions";
import { getArtist } from "@/data/artists";
import { getGuide } from "@/data/guides";
import { usePremium } from "@/context/PremiumContext";
import { VIDEOS } from "@/data/videos";
import { useColors } from "@/hooks/useColors";
import PremiumBanner from "@/components/PremiumBanner";
import QuoteOfTheDay from "@/components/QuoteOfTheDay";

const { width } = Dimensions.get("window");
const GRID_GAP = 12;
const GRID_PAD = 20;

const CARD_W = (width - GRID_PAD * 2 - GRID_GAP) / 2;
const CARD_H = CARD_W * 0.72;
const HERO_HEIGHT = 320;

const VIDEO_HERO_W = width - GRID_PAD * 2 - 56;
const VIDEO_REG_W = 200;
const RECENT_CARD_W = 150;

const SECTION_GAP = 57;

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
  const { playSession } = usePlayer();
  const { isPremium } = usePremium();
  const [fontsLoaded] = useFonts({ Cinzel_900Black, Cinzel_400Regular });

  function handleIntentionPress() {
    router.push("/intencion-onboarding" as never);
  }

  const featured = getFeaturedSessions();
  const featuredSession = React.useMemo(() => {
    if (!featured.length) return undefined;
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
    return featured[dayOfYear % featured.length];
  }, []);

  const recentSessions = React.useMemo(() => [...SESSIONS].reverse().slice(0, 6), []);

  const recommended = React.useMemo<Session[]>(() => {
    const pool = [...SESSIONS];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 4);
  }, []);

  const { open: openDrawer } = useDrawer();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: "#090F17" }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground variant="solid" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 160 + bottomPad, paddingTop: topPad + 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. INTENCIÓN ── */}
        <View style={styles.header}>
          <View style={styles.headerTopRow}>
            <Pressable onPress={() => openDrawer()} hitSlop={12} style={styles.iconBtnBare}>
              <Feather name="menu" size={22} color="white" />
            </Pressable>
            <NotificationBell />
          </View>

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
        <View style={styles.section}>
          <View style={styles.catGrid}>
            {CATEGORIES.filter((cat) => cat.id !== "sabiduria-dia").map((cat, idx) => {
              const R = 20; const r = 4;
              const radii = [
                { borderTopLeftRadius: R,  borderTopRightRadius: R,  borderBottomLeftRadius: R,  borderBottomRightRadius: r }, // fila 1 izq
                { borderTopLeftRadius: R,  borderTopRightRadius: R,  borderBottomLeftRadius: r,  borderBottomRightRadius: R }, // fila 1 der
                { borderTopLeftRadius: R,  borderTopRightRadius: r,  borderBottomLeftRadius: R,  borderBottomRightRadius: r }, // fila 2 izq
                { borderTopLeftRadius: r,  borderTopRightRadius: R,  borderBottomLeftRadius: r,  borderBottomRightRadius: R }, // fila 2 der
                { borderTopLeftRadius: R,  borderTopRightRadius: r,  borderBottomLeftRadius: R,  borderBottomRightRadius: R }, // fila 3 izq
                { borderTopLeftRadius: r,  borderTopRightRadius: R,  borderBottomLeftRadius: R,  borderBottomRightRadius: R }, // fila 3 der
              ];
              const iconColors: Record<string, string> = {
                "sonidos-ancestrales": "#C4956A",
                "meditaciones-guiadas": "#8B82BE",
                "musica-sonidos": "#5B9E7A",
                "podcast": "#6B9AB5",
                "mananas": "#f4c993",
                "noches": "#C87BB5",
              };
              const iconColor = iconColors[cat.id] ?? colors.primary;
              return (
                <Pressable
                  key={cat.id}
                  onPress={() => router.push(`/category/${cat.id}` as never)}
                  style={({ pressed }) => [styles.catCard, radii[idx], { opacity: pressed ? 0.75 : 1 }]}
                >
                  {cat.iconFamily === "MaterialCommunityIcons" ? (
                    <MaterialCommunityIcons
                      name={cat.icon as React.ComponentProps<typeof MaterialCommunityIcons>["name"]}
                      size={26}
                      color={iconColor}
                    />
                  ) : (
                    <Feather
                      name={cat.icon as React.ComponentProps<typeof Feather>["name"]}
                      size={26}
                      color={iconColor}
                    />
                  )}
                  <Text style={styles.catCardLabel} numberOfLines={2}>
                    {cat.title}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* ── 3. VIDEOS DESTACADOS ── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Videos destacados
            </Text>
            {VIDEOS.length > 0 && (
              <Pressable onPress={() => router.push("/videos" as never)} hitSlop={8}>
                <Text style={[styles.verTodasLink, { color: colors.accent }]}>Ver todos</Text>
              </Pressable>
            )}
          </View>

          {VIDEOS.length === 0 ? (
            <View style={[styles.videosEmpty, { borderColor: "rgba(100,140,210,0.15)", backgroundColor: "#151A23" }]}>
              <Feather name="film" size={28} color={colors.primary} style={{ marginBottom: 10 }} />
              <Text style={[styles.historyEmptyTitle, { color: colors.foreground }]}>Próximamente</Text>
              <Text style={[styles.historyEmptySub, { color: colors.mutedForeground }]}>
                Pronto vas a encontrar videos aquí.
              </Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{ marginHorizontal: -GRID_PAD }}
              contentContainerStyle={{ paddingHorizontal: GRID_PAD, gap: 12 }}
            >
              {VIDEOS.map((v) => (
                <VideoCard
                  key={v.id}
                  video={v}
                  width={VIDEO_HERO_W}
                />
              ))}
            </ScrollView>
          )}
        </View>

        {/* ── 4. ESCUCHADOS RECIENTEMENTE ── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Escuchados recientemente
            </Text>
            <Pressable onPress={() => router.push("/explore" as never)} hitSlop={8}>
              <Text style={[styles.verTodasLink, { color: colors.accent }]}>Ver todos</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -GRID_PAD }}
            contentContainerStyle={{ paddingHorizontal: GRID_PAD, gap: 10 }}
          >
            {recentSessions.map((s) => {
              const locked = !!s.isPremium && !isPremium;
              const creator =
                s.categoryId === "meditaciones-guiadas"
                  ? getGuide(s.guideId)
                  : getArtist(s.artistId);
              return (
                <Pressable
                  key={s.id}
                  onPress={() => {
                    if (locked) { router.push("/membresia" as never); return; }
                    playSession(s); router.push("/player" as never);
                  }}
                  style={({ pressed }) => [styles.recentCard, { opacity: pressed ? 0.85 : 1 }]}
                >
                  <View style={styles.recentThumbWrap}>
                    <Image
                      source={s.image as number}
                      style={styles.recentThumb}
                      resizeMode="cover"
                    />
                    {locked && (
                      <Image
                        source={require("@/assets/images/estrella-premium.png")}
                        style={styles.recentStar}
                        resizeMode="contain"
                      />
                    )}
                    <View style={styles.recentDurBadge}>
                      <Text style={styles.recentDurText}>{s.durationLabel}</Text>
                    </View>
                  </View>
                  <Text style={styles.recentTitle} numberOfLines={2}>{s.title}</Text>
                  <View style={styles.recentCreatorRow}>
                    <Image
                      source={creator.photo as number}
                      style={styles.recentAvatar}
                      resizeMode="cover"
                    />
                    <Text style={styles.recentCreatorName} numberOfLines={1}>
                      {creator.name}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* ── 5. SESIÓN DESTACADA DEL DÍA ── */}
        {featuredSession && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, marginBottom: 14 }]}>
              Sesión destacada del día
            </Text>
            <Pressable
              style={styles.heroCard}
              onPress={() => router.push(`/session/${featuredSession.id}` as never)}
            >
              <Image source={featuredSession.image as number} style={styles.heroImage} resizeMode="cover" />
              <View style={styles.glowCenter}>
                <GlowRing size={110} color="rgba(182,149,95,0.18)" delay={0} duration={3500} />
                <GlowRing size={170} color="rgba(182,149,95,0.1)" delay={600} duration={3500} />
              </View>
              <View style={styles.heroContent}>
                <Text style={[styles.heroTitle, { color: colors.foreground }]}>
                  {featuredSession.title}
                </Text>
                <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 14, marginTop: 2 }}>
                  <Feather name="clock" size={12} color="#FFFFFF" style={{ marginRight: 4, marginTop: 1 }} />
                  <Text style={{ fontSize: 13, color: "#FFFFFF", opacity: 0.85, lineHeight: 16 }}>
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

        {/* ── 6. FRASE DEL DÍA ── */}
        <View style={{ marginBottom: SECTION_GAP }}>
          <QuoteOfTheDay />
        </View>

        {/* ── 7. DESCUBRÍ ALGO NUEVO ── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Descubrí algo nuevo
            </Text>
          </View>
          {recommended.map((s) => (
            <SessionCard key={s.id} session={s} horizontal />
          ))}
        </View>

        {/* ── 8. MURO DE AGRADECIMIENTOS ── */}
        <View style={{ marginBottom: SECTION_GAP }}>
          <AlmaCommunitySection />
        </View>

        {/* ── 9. BANNER PREMIUM ── */}
        <View style={{ marginBottom: SECTION_GAP }}>
          <PremiumBanner />
        </View>

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
    marginBottom: SECTION_GAP,
  },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  iconBtnBare: {
    width: 38,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  intentionCard: {
    paddingVertical: 10,
    marginBottom: 0,
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

  // Section — igual para todas las secciones
  section: { marginBottom: SECTION_GAP, paddingHorizontal: GRID_PAD },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 20, fontWeight: "700", letterSpacing: 0.3, marginBottom: 10 },
  verTodasLink: { fontSize: 13, fontWeight: "600" },
  videosEmpty: {
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  historyEmptyTitle: { fontSize: 16, fontWeight: "700", marginBottom: 8 },
  historyEmptySub: { fontSize: 13, textAlign: "center", lineHeight: 19 },

  // Categories — 2×2 grid cards
  catGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  catCard: {
    flexBasis: "40%",
    flexGrow: 1,
    minWidth: 140,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#151A23",
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  catCardLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    flex: 1,
    lineHeight: 18,
  },

  // Escuchados recientemente — foto + título + creador
  recentCard: {
    width: RECENT_CARD_W,
  },
  recentThumbWrap: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "#151A23",
  },
  recentThumb: {
    width: "100%",
    height: "100%",
  },
  recentStar: {
    position: "absolute",
    top: 8,
    left: 8,
    width: 24,
    height: 24,
  },
  recentDurBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    backgroundColor: "rgba(6,10,15,0.72)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  recentDurText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  recentTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 17,
    marginTop: 8,
  },
  recentCreatorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
  },
  recentAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#151A23",
  },
  recentCreatorName: {
    fontSize: 11,
    color: "#7A8FA8",
    flex: 1,
  },

  // Hero — sesión destacada del día
  heroCard: {
    height: HERO_HEIGHT,
    borderRadius: 16,
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
  heroTitle: { fontSize: 26, fontWeight: "700", marginBottom: 4, lineHeight: 32 },
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

  // Square cards (kept for potential reuse)
  squareRow: { flexDirection: "row", gap: 12 },
  squareCard: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 18,
    overflow: "hidden",
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(100,140,210,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  diarioIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(100,140,210,0.14)",
    alignItems: "center",
    justifyContent: "center",
  },
  squareTitle: { fontSize: 16, fontWeight: "700", letterSpacing: 0.2, marginTop: 12, textAlign: "center" },
  squareSub: { fontSize: 12.5, lineHeight: 17, marginTop: 4, textAlign: "center" },
  diarioList: { gap: 10 },

  // Legacy
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionSub: { fontSize: 12, marginTop: 4, marginBottom: 16 },
  seeAll: { fontSize: 13 },
  heroLabel: { fontSize: 10, letterSpacing: 2, marginBottom: 6, fontWeight: "600" },
  heroSub: { fontSize: 13, marginBottom: 18, opacity: 0.85 },
});
