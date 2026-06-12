import { Feather } from "@expo/vector-icons";
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
import { SessionActionsSheet } from "@/components/SessionActionsSheet";
import { SessionCard } from "@/components/SessionCard";
import { SessionRow } from "@/components/SessionRow";
import { VideoCard } from "@/components/VideoCard";
import { EqualizerBars } from "@/components/EqualizerBars";
import { SessionCarousel, CoverCarousel } from "@/components/SessionCarousel";
import { useDrawer } from "@/context/DrawerContext";
import { useCatalog } from "@/context/CatalogContext";
import { useFoldersPlaylists } from "@/context/FoldersPlaylistsContext";
import { useMixer } from "@/context/MixerContext";
import { getVoiceLabel } from "@/config/audio-map";
import { getSoundImage } from "@/config/sound-images";
import { usePlayer } from "@/context/PlayerContext";
import { useIntencion } from "@/context/IntencionContext";
import { CATEGORIES } from "@/data/categories";
import { useGetPopularSessions, getGetPopularSessionsQueryKey } from "@workspace/api-client-react";
import { SESSIONS, getFeaturedSessions, getSessionById, type Session } from "@/data/sessions";
import { getArtist } from "@/data/artists";
import { getGuide } from "@/data/guides";
import { usePremium } from "@/context/PremiumContext";
import { VIDEOS } from "@/data/videos";
import { PLAYLISTS } from "@/data/playlists";
import { useColors } from "@/hooks/useColors";
import { useUserProfile } from "@/context/UserProfileContext";
import PremiumBanner from "@/components/PremiumBanner";
import QuoteOfTheDay from "@/components/QuoteOfTheDay";

const { width } = Dimensions.get("window");

const NAV_TABS = [
  { id: "todas",    label: "Todas",    cats: [] as string[] },
  { id: "sesiones", label: "Sesiones", cats: ["sonidos-ancestrales", "meditaciones-guiadas"] },
  { id: "musica",   label: "Música",   cats: ["musica-sonidos"] },
];
const SES_SUB_FILTERS = [
  { id: "sonidos-ancestrales",  label: "Sonoterapia"  },
  { id: "meditaciones-guiadas", label: "Meditaciones" },
];
// #BE9650 × 0.96 ≈ 4% más oscuro
const SUB_CHIP_ACTIVE_BG = "#B6904D";
const GRID_GAP = 12;
const GRID_PAD = 15;

const CARD_W = (width - GRID_PAD * 2 - GRID_GAP) / 2;
const CARD_H = CARD_W * 0.72;
const HERO_HEIGHT = 320;

const VIDEO_HERO_W = width - GRID_PAD * 2 - 56;
const VIDEO_REG_W = 200;
const RECENT_CARD_W = 150;

const SECTION_GAP = 33;
const BG_GRADIENT = ["#080B1A", "#080B1A", "#080B1A"] as const;

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
  const { playSession, currentSession, isPlaying, history } = usePlayer();
  const { isPremium } = usePremium();
  const { playlists } = useFoldersPlaylists();
  const { presets, loadPreset, openSheet } = useMixer();
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

  const { version: catalogVersion } = useCatalog();
  // Recientes — últimas sesiones agregadas al catálogo
  const recentSessions = React.useMemo<Session[]>(
    () => [...SESSIONS].sort((a, b) => parseInt(b.id) - parseInt(a.id)).slice(0, 10),
    [catalogVersion],
  );

  const { data: popular } = useGetPopularSessions(
    { limit: 10 },
    { query: { queryKey: getGetPopularSessionsQueryKey({ limit: 10 }), staleTime: 5 * 60_000 } },
  );
  const popularSessions = React.useMemo(
    () =>
      (popular?.sessions ?? [])
        .map((s) => getSessionById(s.id))
        .filter((s): s is NonNullable<ReturnType<typeof getSessionById>> => s != null),
    [popular],
  );

  const [actionsSession, setActionsSession] = useState<Session | null>(null);
  const [activeFilter, setActiveFilter] = useState<string[] | null>(null);
  const [sesionesOpen, setSesionesOpen] = useState(false);
  const [sesionesVisible, setSesionesVisible] = useState(false);
  const [sesSubFilter, setSesSubFilter] = useState<string | null>(null);
  const subFilterAnim = useRef(new Animated.Value(0)).current;
  const subFilterWidthAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (sesionesOpen) {
      setSesionesVisible(true);
      Animated.parallel([
        Animated.timing(subFilterAnim, {
          toValue: 1, duration: 220, useNativeDriver: true,
        }),
        Animated.timing(subFilterWidthAnim, {
          toValue: 1, duration: 220, useNativeDriver: false,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(subFilterAnim, {
          toValue: 0, duration: 180, useNativeDriver: true,
        }),
        Animated.timing(subFilterWidthAnim, {
          toValue: 0, duration: 180, useNativeDriver: false,
        }),
      ]).start(({ finished }) => {
        if (finished) setSesionesVisible(false);
      });
    }
  }, [sesionesOpen]);

  // Sesiones recomendadas — no escuchadas aún, barajadas con semilla diaria
  const recommendedSessions = React.useMemo<Session[]>(() => {
    const historyIds = new Set(history.map((h) => h.sessionId));
    const pool = SESSIONS.filter((s) => !historyIds.has(s.id));
    const seed = new Date().toDateString();
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) & 0x7fffffff;
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.abs(hash ^ (i * 2654435761)) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 10);
  }, [history, catalogVersion]);

  // Escuchadas recientemente — historial deduplicado, más recientes primero
  const listenedRecently = React.useMemo<Session[]>(() => {
    const seen = new Set<string>();
    const result: Session[] = [];
    for (let i = history.length - 1; i >= 0; i--) {
      const h = history[i];
      if (seen.has(h.sessionId)) continue;
      seen.add(h.sessionId);
      const s = getSessionById(h.sessionId);
      if (s) result.push(s);
      if (result.length === 10) break;
    }
    return result;
  }, [history]);

  // Más de lo que te gusta — categoría más frecuente en historial, sesiones no escuchadas
  const moreLikeSessions = React.useMemo<Session[]>(() => {
    if (history.length < 3) return [];
    const catCount: Record<string, number> = {};
    for (const h of history) {
      const s = getSessionById(h.sessionId);
      if (s) catCount[s.categoryId] = (catCount[s.categoryId] ?? 0) + 1;
    }
    const topCat = Object.entries(catCount).sort((a, b) => b[1] - a[1])[0]?.[0];
    if (!topCat) return [];
    const historyIds = new Set(history.map((h) => h.sessionId));
    return SESSIONS.filter((s) => s.categoryId === topCat && !historyIds.has(s.id)).slice(0, 10);
  }, [history, catalogVersion]);

  // Tus playlist — playlists del usuario, foto de la primera sesión
  const playlistItems = React.useMemo(() =>
    playlists.slice(0, 10).map((pl) => ({
      id: pl.id,
      title: pl.name,
      image: pl.sessionIds[0]
        ? (getSessionById(pl.sessionIds[0])?.image as number | undefined)
        : undefined,
    })),
    [playlists],
  );

  // Tus mezclas — presets guardados, foto del primer sonido
  const mezclaItems = React.useMemo(() =>
    presets.slice(0, 10).map((p) => ({
      id: p.id,
      title: p.name,
      image: p.sounds[0]
        ? (getSoundImage(p.sounds[0].id) as number | undefined)
        : undefined,
    })),
    [presets],
  );

  // ── Filtros por categoría ─────────────────────────────────────────────────
  const filteredPlaylists = React.useMemo(() => {
    if (!activeFilter) return PLAYLISTS;
    return PLAYLISTS.filter((pl) =>
      pl.sessionIds.some((sid) => activeFilter!.includes(getSessionById(sid)?.categoryId ?? ""))
    );
  }, [activeFilter]);

  const filteredRecommended = React.useMemo(() => {
    if (!activeFilter) return recommendedSessions;
    return recommendedSessions.filter((s) => activeFilter.includes(s.categoryId));
  }, [recommendedSessions, activeFilter]);

  const filteredRecent = React.useMemo(() => {
    if (!activeFilter) return recentSessions;
    return recentSessions.filter((s) => activeFilter.includes(s.categoryId));
  }, [recentSessions, activeFilter]);

  const filteredListened = React.useMemo(() => {
    if (!activeFilter) return listenedRecently;
    return listenedRecently.filter((s) => activeFilter.includes(s.categoryId));
  }, [listenedRecently, activeFilter]);

  const filteredMoreLike = React.useMemo(() => {
    if (!activeFilter) return moreLikeSessions;
    return moreLikeSessions.filter((s) => activeFilter.includes(s.categoryId));
  }, [moreLikeSessions, activeFilter]);

  const filteredFeatured = React.useMemo(() => {
    if (!activeFilter) return featuredSession;
    const pool = SESSIONS.filter((s) => activeFilter.includes(s.categoryId));
    if (!pool.length) return undefined;
    const seed = new Date().toDateString() + activeFilter.join();
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) & 0x7fffffff;
    return pool[Math.abs(hash) % pool.length];
  }, [activeFilter, featuredSession]);

  const { open: openDrawer } = useDrawer();
  const { photoUri } = useUserProfile();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <LinearGradient
      style={styles.root}
      colors={BG_GRADIENT}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBar barStyle="light-content" />
      <SacredBackground variant="solid" />

      {/* ── STICKY HEADER: avatar + nav-tabs — permanece visible al hacer scroll ── */}
      <View style={[styles.stickyHeader, { paddingTop: topPad + 2 }]}>
        <View style={styles.headerTopRow}>
          <Pressable onPress={() => openDrawer()} hitSlop={8} style={styles.avatarBtn}>
            {photoUri ? (
              <Image
                source={{ uri: photoUri }}
                style={styles.avatarSmall}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.avatarFallback}>
                <Feather name="user" size={15} color="#7A8FA8" />
              </View>
            )}
          </Pressable>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.headerTabs}
            contentContainerStyle={styles.headerTabsContent}
          >
            {NAV_TABS.map((tab) => {
              const sel = tab.id === "sesiones"
                ? activeFilter !== null && tab.cats.some(c => activeFilter.includes(c))
                : tab.cats.length === 0
                  ? activeFilter === null
                  : activeFilter?.join() === tab.cats.join();
              return (
                <React.Fragment key={tab.id}>
                  <Pressable
                    onPress={() => {
                      if (tab.id === "sesiones") {
                        // toggle sub-chips, pero Sesiones SIEMPRE queda seleccionado
                        setSesionesOpen(prev => !prev);
                        setSesSubFilter(null);
                        setActiveFilter(tab.cats);
                      } else {
                        setSesionesOpen(false);
                        setSesSubFilter(null);
                        setActiveFilter(tab.cats.length === 0 ? null : tab.cats);
                      }
                    }}
                    style={({ pressed }) => [
                      styles.headerTabChip,
                      sel && styles.headerTabChipActive,
                      tab.id === "sesiones" && sesionesOpen && styles.headerTabChipOnTop,
                      { opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Text style={[styles.headerTabText, sel && styles.headerTabTextActive]}>
                      {tab.label}
                    </Text>
                  </Pressable>

                  {/* Sub-filtros: aparecen justo después de "Sesiones" */}
                  {tab.id === "sesiones" && sesionesVisible && (
                    /* Capa externa: maxWidth (JS driver) empuja "Música" */
                    <Animated.View style={{
                      maxWidth: subFilterWidthAnim.interpolate({
                        inputRange: [0, 1], outputRange: [0, 300],
                      }),
                      overflow: "visible",
                      marginLeft: -32,
                    }}>
                      {/* Capa interna: opacity + translateX (native driver) */}
                      <Animated.View
                        style={[
                          styles.sesSegPill,
                          {
                            opacity: subFilterAnim,
                            transform: [{
                              translateX: subFilterAnim.interpolate({
                                inputRange: [0, 1], outputRange: [-24, 0],
                              }),
                            }],
                          },
                        ]}
                      >
                        {SES_SUB_FILTERS.map((sf, i) => {
                          const subSel = sesSubFilter === sf.id;
                          return (
                            <Pressable
                              key={sf.id}
                              onPress={() => {
                                const next = subSel ? null : sf.id;
                                setSesSubFilter(next);
                                setActiveFilter(next ? [next] : NAV_TABS[1].cats);
                              }}
                              style={({ pressed }) => [
                                styles.sesSegBtn,
                                i === 0 && styles.sesSegBtnFirst,
                                i === 0 && subSel
                                  ? styles.sesSegBtnFirstActive
                                  : subSel && styles.sesSegBtnActive,
                                { opacity: pressed ? 0.75 : 1 },
                              ]}
                            >
                              <Text style={[styles.headerTabText, subSel && styles.headerTabTextActive]}>
                                {sf.label}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </Animated.View>
                    </Animated.View>
                  )}
                </React.Fragment>
              );
            })}
          </ScrollView>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 160 + bottomPad, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. COLECCIONES ── */}
        {filteredPlaylists.length > 0 && (
        <View style={styles.header}>
          <View style={styles.coleccionGrid}>
              {filteredPlaylists.map((pl) => (
                <Pressable
                  key={pl.id}
                  onPress={() => router.push(`/coleccion/${pl.id}` as never)}
                  style={({ pressed }) => [styles.coleccionCard, { opacity: pressed ? 0.75 : 1 }]}
                >
                  <Image source={pl.cover as number} style={styles.coleccionThumb} resizeMode="cover" />
                  <View style={styles.coleccionTitleRow}>
                    <Text style={styles.coleccionTitle} numberOfLines={2}>{pl.title}</Text>
                    {isPlaying && currentSession && pl.sessionIds.includes(currentSession.id) && (
                      <EqualizerBars color="#BE9650" size="sm" />
                    )}
                  </View>
                </Pressable>
              ))}
          </View>

        </View>
        )}

        {/* ── 3. VIDEOS DESTACADOS ── */}
        <View style={styles.section}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle]}>
              Videos destacados
            </Text>
            {VIDEOS.length > 0 && (
              <Pressable onPress={() => router.push("/videos" as never)} hitSlop={8}>
                <Text style={[styles.verTodasLink, { color: colors.accent }]}>Ver todos</Text>
              </Pressable>
            )}
          </View>

          {VIDEOS.length === 0 ? (
            <View style={[styles.videosEmpty, { borderColor: "rgba(100,140,210,0.15)", backgroundColor: "rgba(255,255,255,0.03)" }]}>
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

        {/* ── 4-9. CARRUSELES PERSONALIZADOS ── */}
        <SessionCarousel
          title="Sesiones recomendadas"
          sessions={filteredRecommended}
          isPremium={isPremium}
          onPress={(s) => { playSession(s); router.push("/player" as never); }}
        />
        <SessionCarousel
          title="Recientes"
          sessions={filteredRecent}
          isPremium={isPremium}
          onPress={(s) => { playSession(s); router.push("/player" as never); }}
        />
        <SessionCarousel
          title="Escuchadas recientemente"
          sessions={filteredListened}
          isPremium={isPremium}
          onPress={(s) => { playSession(s); router.push("/player" as never); }}
        />
        <SessionCarousel
          title="Más de lo que te gusta"
          sessions={filteredMoreLike}
          isPremium={isPremium}
          onPress={(s) => { playSession(s); router.push("/player" as never); }}
        />
        {!activeFilter && (
          <View style={{ marginBottom: SECTION_GAP }}>
            <CoverCarousel
              title="Tus playlist"
              items={playlistItems}
              onPress={(id) => router.push(`/playlist/${id}` as never)}
            />
          </View>
        )}
        {!activeFilter && (
          <View style={{ marginBottom: SECTION_GAP }}>
            <CoverCarousel
              title="Tus mezclas"
              items={mezclaItems}
              onPress={(id) => {
                const preset = presets.find((p) => p.id === id);
                if (preset) { loadPreset(preset); openSheet(); }
              }}
            />
          </View>
        )}

        {/* ── 5. FRASE DEL DÍA ── */}
        <View style={{ marginBottom: SECTION_GAP }}>
          <QuoteOfTheDay />
        </View>

        {/* ── 6. SESIÓN DESTACADA ── */}
        {filteredFeatured && (
          <View style={[styles.section, { marginBottom: SECTION_GAP + 45 }]}>
            <Text style={[styles.sectionTitle, { marginBottom: 14 }]}>
              Sesión destacada
            </Text>
            <Pressable
              style={styles.heroCard}
              onPress={() => router.push(`/session/${filteredFeatured.id}` as never)}
            >
              <Image source={filteredFeatured.image as number} style={styles.heroImage} resizeMode="cover" />
              {/* Frosted glass panel */}
              {(() => {
                const voiceLabel = getVoiceLabel(filteredFeatured);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const guideId = (filteredFeatured as any).guideId as string | undefined;
                const heroAuthor = guideId ? (getGuide(guideId)?.name ?? "Casa del Cuenco") : "Casa del Cuenco";
                return (
                  <View style={styles.heroFrosted}>
                    {/* Meta: ★ rating · Guiada/Sin voz · duración — dorado */}
                    <View style={styles.heroMetaRow}>
                      <Feather name="star" size={11} color={colors.primary} />
                      <Text style={[styles.heroMetaText, { color: colors.primary }]}>
                        {" "}4.7{voiceLabel ? ` · ${voiceLabel}` : ""} · {filteredFeatured.durationLabel}
                      </Text>
                    </View>
                    {/* Fila inferior: título+autor a la izq, botón a la der */}
                    <View style={styles.heroBottom}>
                      <View style={{ flex: 1, minWidth: 0 }}>
                        <Text style={[styles.heroTitle, { color: "#e4e6f5" }]} numberOfLines={2}>
                          {filteredFeatured.title}
                        </Text>
                        <Text style={[styles.heroAuthor, { color: "#8BBDD4" }]} numberOfLines={1}>
                          {heroAuthor}
                        </Text>
                      </View>
                      <Pressable
                        onPress={(e) => { e.stopPropagation(); playSession(filteredFeatured); }}
                        style={({ pressed }) => [styles.heroBtn, { opacity: pressed ? 0.75 : 1 }]}
                      >
                        <Feather name="play" size={20} color="#FFFFFF" style={{ marginLeft: 2 }} />
                      </Pressable>
                    </View>
                  </View>
                );
              })()}
            </Pressable>
          </View>
        )}


        {/* ── 8. MURO DE AGRADECIMIENTOS ── */}
        <View style={{ marginBottom: SECTION_GAP }}>
          <AlmaCommunitySection />
        </View>


        {/* ── 10. BANNER PREMIUM ── */}
        <View style={{ marginBottom: SECTION_GAP }}>
          <PremiumBanner />
        </View>

      </ScrollView>

      <SessionActionsSheet
        session={actionsSession}
        visible={actionsSession !== null}
        onClose={() => setActionsSession(null)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  stickyHeader: {
    paddingHorizontal: GRID_PAD,
    paddingBottom: 0,
    backgroundColor: "#080B1A",
    zIndex: 10,
  },
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
    gap: 15,
  },
  avatarBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
  },
  avatarSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  avatarFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(190,150,80,0.12)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(190,150,80,0.25)",
  },
  headerTabs: {
    flex: 1,
    marginHorizontal: -GRID_PAD,
    overflow: "visible",
  },
  headerTabsContent: {
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    paddingHorizontal: GRID_PAD,
  },
  sesSegPill: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 20,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.06)",
    overflow: "hidden",
    paddingRight: 3,
    gap: 1,
  },
  sesSegBtn: {
    paddingHorizontal: 6,
    height: 32,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sesSegBtnFirst: {
    paddingLeft: 34,
  },
  sesSegBtnFirstActive: {
    backgroundColor: SUB_CHIP_ACTIVE_BG,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
  },
  sesSegBtnActive: {
    backgroundColor: SUB_CHIP_ACTIVE_BG,
  },
  headerTabChip: {
    borderRadius: 20,
    paddingHorizontal: 10,
    height: 32,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTabChipActive: {
    backgroundColor: "#BE9650",
  },
  headerTabChipOnTop: {
    zIndex: 2,
    elevation: 2,
  },
  headerTabChipSubActive: {
    backgroundColor: SUB_CHIP_ACTIVE_BG,
  },
  headerTabText: {
    fontSize: 13,
    fontWeight: "400",
    color: "#FFFFFF",
    letterSpacing: 0.1,
  },
  headerTabTextActive: {
    color: "#0B0F14",
    fontWeight: "600",
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
    marginBottom: 11,
  },
  sectionTitle: { fontSize: 20, fontWeight: "700", letterSpacing: 0.3, marginBottom: 7, color: "#e4e6f5" },
  verTodasLink: { fontSize: 13, fontWeight: "400" },
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
  coleccionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  coleccionCard: {
    flexBasis: "47%",
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
    borderRadius: 8,
    overflow: "hidden",
    height: 62,
  },
  coleccionThumb: {
    width: 62,
    height: 62,
  },
  coleccionTitleRow: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 6,
  },
  coleccionTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#e4e6f5",
    lineHeight: 18,
  },
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
    justifyContent: "flex-start",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  catCardRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  catCardIcon: {
    width: 32,
    height: 32,
  },
  catCardLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#e4e6f5",
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
    backgroundColor: "rgba(255,255,255,0.03)",
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
    left: 8,
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
    color: "#e4e6f5",
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
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  recentCreatorName: {
    fontSize: 11,
    color: "#7A8FA8",
    flex: 1,
    marginTop: 4,
  },

  // Hero — sesión destacada del día
  heroCard: {
    height: HERO_HEIGHT,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#0e132f",
  },
  heroImage: { width: "100%", height: "100%" },
  glowCenter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: 100,
  },
  heroFrosted: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 18,
    paddingTop: 16,
    paddingBottom: 18,
    backgroundColor: "rgba(9,15,23,0.80)",
    borderTopWidth: 1,
    borderTopColor: "rgba(70,130,220,0.22)",
  },
  heroMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  heroMetaText: { fontSize: 11, lineHeight: 14 },
  heroTitle: { fontSize: 20, fontWeight: "700", lineHeight: 26, marginBottom: 4 },
  heroAuthor: { fontSize: 12, marginTop: 2 },
  heroBottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  heroBtn: {
    flexShrink: 0,
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#111634",
    borderWidth: 1,
    borderColor: "#191f45",
    transform: [{ translateY: -10 }],
  },

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
  squareTitle: { fontSize: 16, fontWeight: "700", letterSpacing: 0.2, marginTop: 12, textAlign: "center", color: "#e4e6f5" },
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
