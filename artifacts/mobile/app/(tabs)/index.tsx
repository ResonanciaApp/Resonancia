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
import { DrawerMenu } from "@/components/DrawerMenu";
import { NoOlvidarCard, type NoOlvidarItem } from "@/components/NoOlvidarCard";
import { MensajesAnonimosPanel } from "@/components/MensajesAnonimosPanel";
import { MessageDeck } from "@/components/MessageDeck";
import { GlowRing } from "@/components/GlowRing";
import { SacredBackground } from "@/components/SacredBackground";
import { SessionCard } from "@/components/SessionCard";
import { useAuth } from "@/context/AuthContext";
import { usePlayer } from "@/context/PlayerContext";
import { CATEGORIES } from "@/data/categories";
import { SESSIONS, getFeaturedSessions, type Session } from "@/data/sessions";
import { useDiarioFavoritesCtx } from "@/context/DiarioFavoritesContext";
import { useVozInterior } from "@/hooks/useVozInterior";
import { useColors } from "@/hooks/useColors";
import PremiumBanner from "@/components/PremiumBanner";
import QuoteOfTheDay from "@/components/QuoteOfTheDay";

const { width } = Dimensions.get("window");
const GRID_GAP = 12;
const GRID_PAD = 20;

const TIME_BUCKETS = [
  { label: "5 min",   min: 0,  max: 5    },
  { label: "10 min",  min: 6,  max: 10   },
  { label: "15 min",  min: 11, max: 15   },
  { label: "20 min",  min: 16, max: 20   },
  { label: "30 min",  min: 21, max: 30   },
  { label: "30+ min", min: 31, max: 9999 },
];
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
  const insets = useSafeAreaInsets();
  const { playSession } = usePlayer();
  const { isRegistered } = useAuth();
  const [fontsLoaded] = useFonts({ Cinzel_900Black, Cinzel_400Regular });

  function handleIntentionPress() {
    router.push("/intencion-onboarding" as never);
  }

  function handleTimeBucket(bucket: typeof TIME_BUCKETS[number]) {
    router.push({
      pathname: "/medita-tiempo",
      params: { min: String(bucket.min), max: String(bucket.max), label: bucket.label },
    } as never);
  }

  const { favoriteEntries, toggleFavorite } = useDiarioFavoritesCtx();
  const {
    entries: vozEntries,
    playEntry,
    playingId,
    playingPositionMs,
    updateEntry: updateVozEntry,
  } = useVozInterior();

  const noOlvidarItems = React.useMemo<NoOlvidarItem[]>(() => {
    const diarioFavs: NoOlvidarItem[] = favoriteEntries.filter((e) => e.sectionKey !== "aprendizaje").map((e) => ({
      kind: "diary" as const,
      id: `ref-${e.id}`,
      rawId: e.id,
      text: e.text,
      createdAt: e.createdAt,
      sectionTitle: e.sectionTitle,
      accentColor: e.accentColor,
      sectionKey: e.sectionKey,
    }));
    const vozFavs: NoOlvidarItem[] = vozEntries
      .filter((e) => e.isFavorite)
      .map((e) => ({
        kind: "voz" as const,
        id: `voz-${e.id}`,
        rawId: e.id,
        title: e.title?.trim() ?? "",
        durationMs: e.durationMs,
        createdAt: e.createdAt,
      }));
    return [...diarioFavs, ...vozFavs]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4);
  }, [favoriteEntries, vozEntries]);

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
  // 6 random sessions — shuffled once on mount via useMemo
  const recommended = React.useMemo<Session[]>(() => {
    const pool = [...SESSIONS];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 6);
  }, []);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [noOlvidarOpen, setNoOlvidarOpen] = useState(false);

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
          {/* Fila superior: hamburger izquierda + avatar derecha */}
          <View style={styles.headerTopRow}>
            <Pressable
              onPress={() => setDrawerOpen(true)}
              hitSlop={12}
              style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            >
              <Feather name="menu" size={18} color={colors.accent} />
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
              <BlinkingCursor color={colors.primary} />
              <Text style={[styles.intentionPlaceholder, { color: "#FFFFFF" }]}>
                Establece tu intención aquí
              </Text>
            </View>
          </Pressable>
        </View>

        {/* ── 2. CATEGORÍAS ── */}
        <View style={[styles.section, { marginBottom: 20 }]}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Categorías</Text>
            <Pressable onPress={() => router.push("/(tabs)/explore" as never)}>
              <Text style={[styles.seeAll, { color: colors.accent }]}>Ver todas</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.catPillRow}
          >
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.id}
                onPress={() => router.push(`/category/${cat.id}` as never)}
                style={({ pressed }) => [styles.catPillItem, { opacity: pressed ? 0.7 : 1 }]}
              >
                <View style={[styles.catPillCircle, { backgroundColor: cat.gradient[1] + "CC" }]}>
                  {cat.iconFamily === "MaterialCommunityIcons" ? (
                    <MaterialCommunityIcons
                      name={cat.icon as React.ComponentProps<typeof MaterialCommunityIcons>["name"]}
                      size={20}
                      color={cat.color}
                    />
                  ) : (
                    <Feather
                      name={cat.icon as React.ComponentProps<typeof Feather>["name"]}
                      size={20}
                      color={cat.color}
                    />
                  )}
                </View>
                <Text style={[styles.catPillLabel, { color: cat.color }]} numberOfLines={2}>
                  {cat.title}
                </Text>
              </Pressable>
            ))}
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
                <Text style={[styles.heroLabel, { color: colors.accent }]}>SESIÓN DESTACADA DEL DÍA</Text>
                <Text style={[styles.heroTitle, { color: colors.foreground }]}>
                  {featuredSession.title}
                </Text>
                <Text style={[styles.heroSub, { color: "#C8C1B5" }]}>
                  {featuredSession.subtitle} · {featuredSession.durationLabel}
                </Text>
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
          {recommended.slice(0, 4).map((s) => (
            <SessionCard key={s.id} session={s} horizontal />
          ))}
        </View>

        {/* ── 4b. ¿CUÁNTO TIEMPO TIENES HOY? ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>¿Cuánto tiempo tienes hoy?</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.timeRow}
          >
            {TIME_BUCKETS.map((bucket) => (
              <Pressable
                key={bucket.label}
                onPress={() => handleTimeBucket(bucket)}
                style={({ pressed }) => [
                  styles.timeChip,
                  { backgroundColor: colors.card, opacity: pressed ? 0.78 : 1 },
                ]}
              >
                <LinearGradient
                  colors={["rgba(182,149,95,0.1)", "rgba(182,149,95,0.03)"]}
                  style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                />
                <Feather name="clock" size={13} color={colors.primary} style={{ marginRight: 5 }} />
                <Text style={[styles.timeLabel, { color: colors.foreground }]}>{bucket.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ── 5. FRASE DEL DÍA ── */}
        <QuoteOfTheDay />

        {/* ── 6. A NO OLVIDAR ── */}
        <View style={styles.section}>
            {/* Cabecera tappable */}
            <Pressable
              onPress={() => noOlvidarItems.length > 0 && setNoOlvidarOpen((v) => !v)}
              style={({ pressed }) => [styles.noOlvidarHeader, { opacity: pressed ? 0.75 : 1 }]}
            >
              <View style={styles.noOlvidarTitleRow}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  A no olvidar
                </Text>
                {!noOlvidarOpen && noOlvidarItems.length > 0 && (
                  <View style={[styles.countBadge, { backgroundColor: colors.primary + "22" }]}>
                    <Text style={[styles.countText, { color: colors.primary }]}>
                      {noOlvidarItems.length}
                    </Text>
                  </View>
                )}
              </View>
              {noOlvidarItems.length > 0 && (
                <View style={styles.noOlvidarRight}>
                  {noOlvidarOpen && (
                    <Pressable onPress={() => router.push("/(tabs)/diario" as never)}>
                      <Text style={[styles.seeAll, { color: colors.accent }]}>Ver todas</Text>
                    </Pressable>
                  )}
                  <Feather
                    name={noOlvidarOpen ? "chevron-up" : "chevron-down"}
                    size={18}
                    color={colors.accent}
                  />
                </View>
              )}
            </Pressable>

            {/* Estado vacío */}
            {noOlvidarItems.length === 0 && (
              <View style={[styles.noOlvidarPeek, { backgroundColor: colors.card, borderColor: colors.border, justifyContent: "center" }]}>
                <Text style={[styles.peekLabel, { color: colors.mutedForeground, textAlign: "center" }]}>
                  Aún no has guardado nada de tu diario
                </Text>
              </View>
            )}

            {/* Peek colapsado */}
            {noOlvidarItems.length > 0 && !noOlvidarOpen && (
              <Pressable
                onPress={() => setNoOlvidarOpen(true)}
                style={[styles.noOlvidarPeek, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                {/* Mini apilado de tarjetas */}
                <View style={styles.peekStack}>
                  {noOlvidarItems.slice(0, 3).map((_, i) => (
                    <View
                      key={i}
                      style={[
                        styles.peekCard,
                        {
                          backgroundColor: colors.card,
                          borderColor: colors.border,
                          left: i * 6,
                          top: i === 0 ? 0 : -i * 2,
                          zIndex: 3 - i,
                          opacity: 1 - i * 0.25,
                        },
                      ]}
                    />
                  ))}
                </View>
                <Text style={[styles.peekLabel, { color: colors.mutedForeground }]}>
                  {noOlvidarItems.length === 1
                    ? "1 nota guardada — toca para ver"
                    : `${noOlvidarItems.length} notas guardadas — toca para ver`}
                </Text>
                <Feather name="chevron-down" size={15} color={colors.accent} />
              </Pressable>
            )}

            {/* Lista expandida */}
            {noOlvidarItems.length > 0 && noOlvidarOpen && (
              <View style={styles.diarioList}>
                {noOlvidarItems.map((item) => {
                  const vozEntry =
                    item.kind === "voz"
                      ? vozEntries.find((e) => e.id === item.rawId)
                      : undefined;
                  return (
                    <NoOlvidarCard
                      key={item.id}
                      item={item}
                      isPlaying={item.kind === "voz" && playingId === item.rawId}
                      positionMs={item.kind === "voz" && playingId === item.rawId ? playingPositionMs : 0}
                      onPlay={
                        item.kind === "voz" && vozEntry
                          ? () => playEntry(vozEntry)
                          : undefined
                      }
                      onRemove={() => {
                        if (item.kind === "voz") {
                          updateVozEntry(item.rawId, { isFavorite: false });
                        } else {
                          toggleFavorite(
                            { id: item.rawId, text: item.text, createdAt: item.createdAt },
                            item.sectionKey,
                          );
                        }
                      }}
                    />
                  );
                })}
              </View>
            )}
          </View>

        {/* ── 6. MENSAJE DEL DÍA ── */}
        <View style={styles.section}>
          <MessageDeck />
        </View>

        {/* ── 7. NUEVAS SESIONES ── */}
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
              <SessionCard key={s.id} session={s} width={110} />
            ))}
          </ScrollView>
        </View>

        {/* ── 8. MENSAJES DEL ALMA ── */}
        <View style={styles.section}>
          <MensajesAnonimosPanel />
        </View>

        {/* ── 9. BANNER PREMIUM ── */}
        <PremiumBanner />


      </ScrollView>

      <DrawerMenu visible={drawerOpen} onClose={() => setDrawerOpen(false)} />
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
    gap: 16,
    paddingRight: 20,
  },
  catPillItem: {
    alignItems: "center",
    width: 62,
    gap: 6,
  },
  catPillCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  catPillLabel: {
    fontSize: 10,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 13,
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
  timeRow: { flexDirection: "row", gap: 8, paddingRight: 4, marginTop: 6 },
  timeChip: {
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
    justifyContent: "center",
  },
  timeLabel: { fontSize: 13, fontWeight: "600" },

  // Diary favorites
  diarioList: { gap: 10 },

  // A no olvidar colapsable
  noOlvidarHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },
  noOlvidarTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  noOlvidarRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  countBadge: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countText: {
    fontSize: 12,
    fontWeight: "700",
  },
  noOlvidarPeek: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 13,
    paddingHorizontal: 16,
  },
  peekStack: {
    width: 32,
    height: 22,
    position: "relative",
  },
  peekCard: {
    position: "absolute",
    width: 22,
    height: 16,
    borderRadius: 5,
    borderWidth: 1,
  },
  peekLabel: {
    flex: 1,
    fontSize: 13,
    fontWeight: "500",
  },
});
