import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { GoldGradientFill } from "@/components/GoldGradient";
import { BackPill } from "@/components/BackPill";
import { SessionCarousel } from "@/components/SessionCarousel";
import { SessionDurationBadge } from "@/components/SessionDurationBadge";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "react-native";
import {
  Animated,
  Easing,
  LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  Dimensions,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CategoryInfoPanel } from "@/components/CategoryInfoPanel";
import { SessionActionsSheet } from "@/components/SessionActionsSheet";
import { SessionRow } from "@/components/SessionRow";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { SESSIONS, getSessionById } from "@/data/sessions";
import type { Session } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";
import { LinearGradient } from "expo-linear-gradient";
import { useSceneTheme } from "@/context/SceneThemeContext";
import {
  CONTENT_CAROUSEL_HEIGHT_SCALE,
  getContentCarouselCardWidth,
} from "@/constants/carousel";

const H_PAD = 14;
const { width: W } = Dimensions.get("window");
const RECENT_CARD_W = Math.round((W - H_PAD * 2) / 1.85);
const FEATURED_CARD_W = getContentCarouselCardWidth(W, H_PAD);
const FEATURED_CARD_H = Math.round(187 * CONTENT_CAROUSEL_HEIGHT_SCALE);
const ICON_COLOR = "#f4c993";
const RATINGS_KEY = "@resonance_ratings";

const MANANAS_SESSIONS = SESSIONS.filter((s) => s.categoryId === "mananas");

const matchTag = (s: Session, tag: string) =>
  (s as Session & { meditationTag?: string }).meditationTag === tag ||
  (s as Session & { soundTag?: string }).soundTag === tag ||
  (s as Session & { ancestralTag?: string }).ancestralTag === tag ||
  ((s as Session & { themeTag?: string[] }).themeTag?.includes(tag) ?? false);

type SubDef = {
  tag: string;
  icon: string;
  family: "Feather" | "MaterialCommunityIcons";
  description: string;
  longDescription: string;
};

const SUBCATEGORIES: SubDef[] = [
  {
    tag: "Meditación",
    icon: "meditation",
    family: "MaterialCommunityIcons",
    description: "Calma y presencia para abrir el día",
    longDescription:
      "Cinco minutos de silencio consciente antes del primer café cambian la calidad de todo lo que viene después. La mente se asienta, las prioridades se clarifican y el cuerpo entra al día desde la calma, no desde el apuro.",
  },
  {
    tag: "Respiración",
    icon: "wind",
    family: "Feather",
    description: "Respira y oxigena cuerpo y mente",
    longDescription:
      "La respiración es la única función automática que también podemos controlar. Usarla conscientemente al despertar oxigena el cerebro, activa la energía y establece un estado de presencia que se prolonga durante horas.",
  },
  {
    tag: "Afirmaciones",
    icon: "message-circle",
    family: "Feather",
    description: "Palabras que siembran tu día",
    longDescription:
      "Las palabras que elegimos al abrir el día moldean el filtro con el que percibimos todo lo que sigue. Una afirmación bien elegida no es autoengaño — es entrenamiento de enfoque hacia lo que queremos cultivar.",
  },
  {
    tag: "Gratitud",
    icon: "heart",
    family: "Feather",
    description: "Agradece y eleva tu energía",
    longDescription:
      "La ciencia confirma lo que las tradiciones sabían: registrar lo bueno activa el sistema de recompensa y eleva el estado de ánimo de forma duradera. Un minuto de gratitud genuina al despertar transforma la perspectiva del día.",
  },
  {
    tag: "Optimismo",
    icon: "sun",
    family: "Feather",
    description: "Una mirada luminosa hacia adelante",
    longDescription:
      "No es negar lo difícil — es elegir dónde poner la atención. Una mirada optimista entrenada no niega los problemas, los ve con más recursos para resolverlos. Empieza aquí, empieza ahora.",
  },
];

function FeaturedCard({ session }: { session: Session }) {
  const { isPremium } = usePremium();
  const { playSession } = usePlayer();
  const locked = !!session.isPremium && !isPremium;
  const handlePress = () => {
    if (locked) { router.push("/membresia" as never); return; }
    if (session.skipMiniPlayer) { playSession(session); return; }
    playSession(session);
    router.push("/player" as never);
  };
  return (
    <Pressable onPress={handlePress}
      style={({ pressed }) => [fcStyles.card, { opacity: pressed ? 0.85 : 1 }]}>
      <View style={fcStyles.imgWrap}>
        <Image source={session.image as number} style={fcStyles.img} resizeMode="cover" />
        <SessionDurationBadge label={session.durationLabel} style={fcStyles.durPill} textStyle={fcStyles.dur} />
        {locked && (
          <View style={fcStyles.lock}>
            <Feather name="lock" size={9} color="#fff" />
          </View>
        )}
      </View>
      <Text style={fcStyles.title} numberOfLines={2}>{session.title}</Text>
    </Pressable>
  );
}
const fcStyles = StyleSheet.create({
  card:    { width: FEATURED_CARD_W },
  imgWrap: { width: FEATURED_CARD_W, height: FEATURED_CARD_H, borderRadius: 14, overflow: "hidden" },
  img:     { width: FEATURED_CARD_W, height: FEATURED_CARD_H },
  durPill: { position: "absolute", bottom: 8, left: 8, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  dur:     { fontFamily: "Manrope", fontSize: 11, fontWeight: "600", color: "#fff" },
  title:   { fontFamily: "Manrope", fontSize: 13, fontWeight: "600", color: "#F4DAD5", lineHeight: 17, marginTop: 10 },
  lock:    { position: "absolute", top: 6, right: 6, width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" },
});

function SubIcon({ sub, size }: { sub: SubDef; size: number }) {
  return sub.family === "MaterialCommunityIcons" ? (
    <MaterialCommunityIcons
      name={sub.icon as React.ComponentProps<typeof MaterialCommunityIcons>["name"]}
      size={size}
      color={ICON_COLOR}
    />
  ) : (
    <Feather
      name={sub.icon as React.ComponentProps<typeof Feather>["name"]}
      size={size}
      color={ICON_COLOR}
    />
  );
}

type ActiveTab = "Todos" | "Audios" | "Videos" | "Maestros";
const TABS: ActiveTab[] = ["Todos", "Audios", "Videos", "Maestros"];


export default function MananasScreen() {
  const colors = useColors();
  const { theme } = useSceneTheme();
  const insets = useSafeAreaInsets();
  const { history, playSession } = usePlayer();
  const { isPremium } = usePremium();
  const recentInCategory = useMemo(() => {
    const seen = new Set<string>(); const result: Session[] = [];
    for (const h of history) {
      if (seen.has(h.sessionId)) continue;
      seen.add(h.sessionId);
      const s = getSessionById(h.sessionId);
      if (s && s.categoryId === "mananas") result.push(s);
      if (result.length === 10) break;
    }
    return result;
  }, [history]);

  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [descExpanded, setDescExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("Audios");
  const [actionsSession, setActionsSession] = useState<Session | null>(null);

  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const [indicatorWidth, setIndicatorWidth] = useState(0);
  const tabLayouts = useRef<{ x: number; width: number }[]>([]);

  const onTabLayout = (idx: number, e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    tabLayouts.current[idx] = { x, width };
    if (idx === 0 && indicatorWidth === 0) {
      setIndicatorWidth(width);
      indicatorAnim.setValue(x);
    }
  };

  const selectTab = (tab: ActiveTab, idx: number) => {
    setActiveTab(tab);
    const layout = tabLayouts.current[idx];
    if (layout) {
      setIndicatorWidth(layout.width);
      Animated.timing(indicatorAnim, {
        toValue: layout.x,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  };

  useEffect(() => {
    AsyncStorage.getItem(RATINGS_KEY).then((val) => {
      if (val) setRatings(JSON.parse(val));
    });
  }, []);

  useEffect(() => {
    setDescExpanded(false);
    setActiveTab("Audios");
    const layout = tabLayouts.current[0];
    if (layout) {
      setIndicatorWidth(layout.width);
      indicatorAnim.setValue(layout.x);
    }
  }, [selectedTag]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filteredSessions = useMemo(() => {
    if (!selectedTag) return MANANAS_SESSIONS;
    return MANANAS_SESSIONS.filter((s) => matchTag(s, selectedTag));
  }, [selectedTag]);

  const countByTag = useMemo(() => {
    const map: Record<string, number> = {};
    for (const sub of SUBCATEGORIES) {
      map[sub.tag] = MANANAS_SESSIONS.filter((s) => matchTag(s, sub.tag)).length;
    }
    return map;
  }, []);

  const selectedSub = SUBCATEGORIES.find((c) => c.tag === selectedTag);

  const recentlyPlayed = useMemo(() => {
    if (!selectedTag) return null;
    const subIds = new Set(filteredSessions.map((s) => s.id));
    const entry = [...history]
      .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())
      .find((e) => subIds.has(e.sessionId));
    return entry ? filteredSessions.find((s) => s.id === entry.sessionId) ?? null : null;
  }, [history, filteredSessions, selectedTag]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Escuchá "${selectedTag}" en Resonancia — rituales matutinos para empezar el día.`,
      });
    } catch {
      // silent
    }
  };

  return (
        <View style={[styles.root, { backgroundColor: theme.gradient[theme.gradient.length - 1] as string }]}>
      <LinearGradient colors={theme.gradient as unknown as [string, string, ...string[]]} style={StyleSheet.absoluteFill} />
      <StatusBar hidden />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 40 + bottomPad }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ════════════════════════════════════
            VISTA LISTA DE SUBCATEGORÍAS
        ════════════════════════════════════ */}
        {!selectedTag && (
          <>
            <View style={[styles.header, { paddingHorizontal: H_PAD, paddingTop: topPad + 8 }]}>
              <BackPill onPress={() => router.back()} size={28} bgColor="rgba(255,255,255,0.10)" iconOffsetX={-1} />
              <View style={[styles.catIconCircle, { backgroundColor: ICON_COLOR + "1A" }]}>
                <Image
                  source={require("../../assets/images/cat-mananas.png")}
                  style={{ width: 34, height: 34 }}
                  resizeMode="contain"
                />
              </View>
              <Text style={[styles.pageTitle, { color: colors.foreground }]}>Mañanas</Text>
              <View style={styles.searchBar}>
                <Feather name="search" size={17} color={colors.mutedForeground} />
                <TextInput
                  style={[styles.searchInput, { color: colors.foreground }]}
                  placeholder="Buscar en Mañanas…"
                  placeholderTextColor={colors.mutedForeground}
                  value={query}
                  onChangeText={setQuery}
                  returnKeyType="search"
                />
              </View>
            </View>

            <View style={[styles.catList, { paddingHorizontal: H_PAD }]}>
              {SUBCATEGORIES.filter((c) => {
                const q = query.trim().toLowerCase();
                return !q || c.tag.toLowerCase().includes(q);
              }).length === 0 && (
                <Text style={[styles.noResults, { color: colors.mutedForeground }]}>
                  Sin resultados para “{query.trim()}”
                </Text>
              )}
              {SUBCATEGORIES.filter((c) => {
                const q = query.trim().toLowerCase();
                return !q || c.tag.toLowerCase().includes(q);
              }).map((sub, idx, arr) => {
                const isLast = idx === arr.length - 1;
                return (
                  <Pressable
                    key={sub.tag}
                    onPress={() => setSelectedTag(sub.tag)}
                    style={({ pressed }) => [
                      styles.catRow,
                      !isLast && { borderBottomWidth: 1, borderBottomColor: "rgba(212,175,55,0.08)" },
                      { opacity: pressed ? 0.75 : 1 },
                    ]}
                  >
                    <View style={styles.iconCircle}>
                      <SubIcon sub={sub} size={22} />
                    </View>
                    <Text style={[styles.catName, { color: colors.foreground }]}>{sub.tag}</Text>
                    <View style={styles.catRight}>
                      <Text style={[styles.catCount, { color: colors.foreground }]}>
                        {countByTag[sub.tag] ?? 0}
                      </Text>
                      <Feather name="chevron-right" size={17} color={colors.foreground} />
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <CategoryInfoPanel
              accentColor={ICON_COLOR}
              heading="¿Por qué empezar el día así?"
              items={[
                {
                  icon: "sunrise",
                  title: "Marca el tono del día",
                  body: "Los primeros minutos tras despertar moldean tu estado mental. Un ritual breve te ancla en calma y claridad antes del ruido.",
                },
                {
                  icon: "wind",
                  title: "Cuerpo y mente despiertos",
                  body: "Respiración y movimiento suave activan tu energía de forma natural, sin sobresaltos ni pantallas.",
                },
                {
                  icon: "heart",
                  title: "Intención y gratitud",
                  body: "Afirmar y agradecer al inicio del día entrena una mirada más optimista y resiliente.",
                },
              ]}
              quote="Cada amanecer es una nueva oportunidad para volver a ti."
              whyItems={[
                { icon: "sun", text: "Porque la forma en que empiezas el día tiñe todo lo que sigue." },
                { icon: "heart", text: "Porque unos minutos de calma valen más que una hora de prisa." },
              ]}
            />
          </>
        )}

        {/* ════════════════════════════════════
            VISTA DETALLE DE SUBCATEGORÍA
        ════════════════════════════════════ */}
        {selectedTag && selectedSub && (
          <>
            {/* Top bar */}
            <View style={[styles.detailTopBar, { paddingTop: topPad + 8, paddingHorizontal: H_PAD }]}>
              <Pressable onPress={() => setSelectedTag(null)} style={styles.iconBtn}>
                <Feather name="arrow-left" size={22} color={colors.foreground} />
              </Pressable>
              <Pressable onPress={handleShare} style={styles.iconBtn}>
                <Feather name="share" size={20} color={colors.foreground} />
              </Pressable>
            </View>

            {/* Título */}
            <Text style={[styles.detailTitle, { color: colors.foreground, paddingHorizontal: H_PAD }]}>
              {selectedTag}
            </Text>

            {/* Descripción colapsable */}
            <Pressable
              onPress={() => setDescExpanded((v) => !v)}
              style={{ paddingHorizontal: H_PAD, marginBottom: 20 }}
            >
              <Text
                style={[styles.detailDesc, { color: colors.foreground }]}
                numberOfLines={descExpanded ? undefined : 3}
              >
                {selectedSub.longDescription}
              </Text>
            </Pressable>

            {/* Tabs */}
            <View style={[styles.tabBar, { borderBottomColor: "rgba(61,14,22,0.40)", paddingHorizontal: H_PAD }]}>
              {TABS.map((tab, idx) => (
                <Pressable
                  key={tab}
                  onLayout={(e) => onTabLayout(idx, e)}
                  onPress={() => selectTab(tab, idx)}
                  style={styles.tabItem}
                >
                  <Text style={[
                    styles.tabLabel,
                    { color: tab === activeTab ? colors.foreground : colors.mutedForeground },
                  ]}>
                    {tab}
                  </Text>
                </Pressable>
              ))}
              {indicatorWidth > 0 && (
                <Animated.View
                  style={[
                    styles.tabIndicator,
                    { width: indicatorWidth, transform: [{ translateX: indicatorAnim }] },
                  ]}
                >
                  <GoldGradientFill />
                </Animated.View>
              )}
            </View>

            {/* ── Tab: Todos ── */}
            {activeTab === "Todos" && (
              <View style={{ paddingTop: 21 }}>
                {filteredSessions.some((s) => s.isFeaturedCategory) && (
                  <>
                    <Text style={[styles.sectionTitle, { color: colors.foreground, paddingHorizontal: H_PAD, marginBottom: 24, marginTop: 10 }]}>
                      Contenido destacado
                    </Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ paddingHorizontal: H_PAD, gap: 14, paddingBottom: 4 }}>
                      {filteredSessions.filter((s) => s.isFeaturedCategory).map((s) => (
                        <FeaturedCard key={`feat-${s.id}`} session={s} />
                      ))}
                    </ScrollView>
                    <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginHorizontal: H_PAD, marginTop: 20 }} />
                  </>
                )}
                {recentInCategory.length > 0 && (
                  <SessionCarousel
                    title="Escuchadas recientemente"
                    sessions={recentInCategory}
                    isPremium={isPremium}
                    onPress={(s) => { if (s.skipMiniPlayer) { playSession(s); return; } playSession(s); router.push("/player" as never); }}
                    style={{ marginTop: 24, marginBottom: 0 }}
                    cardWidth={RECENT_CARD_W}
                  />
                )}
                {filteredSessions.length === 0 ? (
                  <View style={styles.emptyWrap}>
                    <Feather name="sunrise" size={32} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
                    <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Próximamente</Text>
                  </View>
                ) : (
                  filteredSessions.map((s) => (
                    <SessionRow
                      key={s.id}
                      session={s}
                      rating={ratings[s.id]}
                      style={{ marginHorizontal: H_PAD }}
                      onActionsPress={() => setActionsSession(s)}
                    />
                  ))
                )}
              </View>
            )}

            {/* ── Tab: Audios ── */}
            {activeTab === "Audios" && (
              <View style={{ paddingTop: 21 }}>
                <Text style={[styles.sectionTitle, { color: colors.foreground, paddingHorizontal: H_PAD }]}>
                  Escuchado Recientemente
                </Text>
                {recentlyPlayed ? (
                  <SessionRow
                    session={recentlyPlayed}
                    rating={ratings[recentlyPlayed.id]}
                    style={{ marginHorizontal: H_PAD, marginTop: 10, marginBottom: 24 }}
                    onActionsPress={() => setActionsSession(recentlyPlayed)}
                  />
                ) : (
                  <View style={[styles.recentPlaceholder, { marginHorizontal: H_PAD, backgroundColor: "rgba(74,12,12,0.08)" }]}>
                    <Feather name="headphones" size={28} color={colors.mutedForeground} />
                    <Text style={[styles.placeholderText, { color: colors.mutedForeground }]}>
                      Aún no escuchaste ninguna sesión en esta categoría
                    </Text>
                  </View>
                )}

                <Text style={[styles.sectionTitle, { color: colors.foreground, paddingHorizontal: H_PAD, marginBottom: 10 }]}>
                  Recientes
                </Text>
                {filteredSessions.length === 0 ? (
                  <View style={styles.emptyWrap}>
                    <Feather name="sunrise" size={32} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
                    <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Próximamente</Text>
                  </View>
                ) : (
                  filteredSessions.map((s) => (
                    <SessionRow
                      key={s.id}
                      session={s}
                      rating={ratings[s.id]}
                      style={{ marginHorizontal: H_PAD }}
                      onActionsPress={() => setActionsSession(s)}
                    />
                  ))
                )}
              </View>
            )}

            {/* ── Tab: Videos ── */}
            {activeTab === "Videos" && (
              <View style={styles.emptyWrap}>
                <Feather name="video" size={36} color={colors.mutedForeground} style={{ marginBottom: 14 }} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Próximamente</Text>
              </View>
            )}

            {/* ── Tab: Maestros ── */}
            {activeTab === "Maestros" && (
              <View style={styles.emptyWrap}>
                <Feather name="users" size={36} color={colors.mutedForeground} style={{ marginBottom: 14 }} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Próximamente</Text>
              </View>
            )}
          </>
        )}
      </ScrollView>

      <SessionActionsSheet
        session={actionsSession}
        visible={actionsSession !== null}
        onClose={() => setActionsSession(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },

  header: { alignItems: "center", marginBottom: 28, paddingTop: 4 },
  backBtn: {
    alignSelf: "flex-start",
    width: 40, height: 40,
    alignItems: "center", justifyContent: "center",
    marginBottom: 16,
  },
  catIconCircle: {
    width: 60, height: 60,
    borderRadius: 30,
    alignItems: "center", justifyContent: "center",
    marginBottom: 12,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    alignSelf: "stretch",
    backgroundColor: "rgba(74,12,12,0.08)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    marginTop: 18,
  },
  searchInput: { fontFamily: "Manrope", flex: 1, fontSize: 14, padding: 0 },
  noResults: { fontFamily: "Manrope", fontSize: 14, textAlign: "center", paddingVertical: 24 },
  pageTitle: { fontFamily: "Manrope", fontSize: 21, fontWeight: "700", letterSpacing: 0.2, marginTop: -15, marginBottom: 4, textAlign: "center" },
  pageSub: { fontFamily: "Manrope", fontSize: 13, lineHeight: 19, textAlign: "center" },

  catList: {},
  catRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 14 },
  iconCircle: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  catName: { fontFamily: "Manrope", flex: 1, fontSize: 15, fontWeight: "600", letterSpacing: 0.1 },
  catRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  catCount: { fontFamily: "Manrope", fontSize: 13, fontWeight: "500" },

  detailTopBar: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 18,
  },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  detailTitle: {
    fontFamily: "Manrope",
    fontSize: 32, fontWeight: "800", letterSpacing: -0.3,
    lineHeight: 38, marginBottom: 12,
  },
  detailDesc: { fontFamily: "Manrope", fontSize: 14, lineHeight: 21 },

  tabBar: { flexDirection: "row", borderBottomWidth: 1, position: "relative", marginTop: 31 },
  tabItem: { paddingVertical: 10, paddingHorizontal: 4, marginRight: 22 },
  tabLabel: { fontFamily: "Manrope", fontSize: 15, fontWeight: "600" },
  tabIndicator: {
    position: "absolute", bottom: 0, height: 2,
    overflow: "hidden", borderRadius: 1,
  },

  sectionTitle: { fontFamily: "Manrope", fontSize: 20, fontWeight: "700", letterSpacing: 0.5, marginBottom: 0 },
  recentPlaceholder: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderRadius: 14, padding: 16, marginBottom: 28,
  },
  placeholderText: { fontFamily: "Manrope", flex: 1, fontSize: 13, lineHeight: 18 },

  emptyWrap: { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontFamily: "Manrope", fontSize: 16, textAlign: "center" },
});
