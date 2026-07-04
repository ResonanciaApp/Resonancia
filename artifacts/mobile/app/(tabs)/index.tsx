import { Feather, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { Cinzel_400Regular, Cinzel_900Black, useFonts } from "@expo-google-fonts/cinzel";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import RAnimated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AlmaCommunitySection } from "@/components/AlmaCommunitySection";
import { MessageDeck } from "@/components/MessageDeck";
import { GlowRing } from "@/components/GlowRing";
import { MoodPickerSheet } from "@/components/MoodPickerSheet";
import { SessionActionsSheet } from "@/components/SessionActionsSheet";
import { SessionCard } from "@/components/SessionCard";
import { SessionRow } from "@/components/SessionRow";
import { EqualizerBars } from "@/components/EqualizerBars";
import { SessionCarousel, CoverCarousel } from "@/components/SessionCarousel";
import { useUser } from "@clerk/expo";
import { Image as ExpoImage } from "expo-image";
import { useAuth } from "@/context/AuthContext";
import { useDrawer } from "@/context/DrawerContext";
import { useCatalog } from "@/context/CatalogContext";
import { useFoldersPlaylists } from "@/context/FoldersPlaylistsContext";
import { useMixer } from "@/context/MixerContext";
// voiceLabel no usado en hero
import { getSoundImage } from "@/config/sound-images";
import { usePlayer } from "@/context/PlayerContext";
import { useIntencion } from "@/context/IntencionContext";
import { CATEGORIES } from "@/data/categories";
import { TEMAS } from "@/data/temas";
import { useGetPopularSessions, getGetPopularSessionsQueryKey, useGetPinnedFeatured } from "@workspace/api-client-react";
import { SESSIONS, getFeaturedSessions, getSessionById, type Session } from "@/data/sessions";
import { getMoodById, type Mood, type MoodId } from "@/data/moods";
import { getArtist } from "@/data/artists";
import { getGuide } from "@/data/guides";
import { usePremium } from "@/context/PremiumContext";
import { PLAYLISTS } from "@/data/playlists";
import { useColors } from "@/hooks/useColors";
import { useUserProfile } from "@/context/UserProfileContext";
import PremiumBanner from "@/components/PremiumBanner";
import QuoteOfTheDay from "@/components/QuoteOfTheDay";
import { CuencoBell } from "@/components/CuencoBell";
import { LiveSessionCard } from "@/components/LiveSessionCard";
import { useLiveSessions } from "@/hooks/useLiveSessions";

const { width } = Dimensions.get("window");

const NAV_TABS = [
  { id: "todas",    label: "Todas",    cats: [] as string[] },
  { id: "sesiones", label: "Sesiones", cats: ["sonidos-ancestrales", "meditaciones-guiadas", "reflexiones"] },
  { id: "musica",   label: "Música",   cats: ["musica-sonidos"] },
];
const GRID_GAP = 12;
const GRID_PAD = 15;

const CARD_W = (width - GRID_PAD * 2 - GRID_GAP) / 2;
const CARD_H = CARD_W * 0.72;
const HERO_HEIGHT = 320;

const VIDEO_REG_W = 200;
// 1 card completa + 25% del siguiente visible: W = (screenWidth - leftPad - gap) / 1.25
const RECENT_CARD_W = Math.round((width - GRID_PAD * 2) / 1.85);

const SECTION_GAP = 60;
const TEMA_GAP = 10;
const TEMA3_W = Math.floor((width - GRID_PAD * 2 - TEMA_GAP * 2) / 3);

/** Convierte un color hex + alpha a rgba() para usar como fondo tintado. */
function hexTint(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(74,12,12,0.08)`;
  return `rgba(${r},${g},${b},${alpha})`;
}

const RITUAL_CARD_W = Math.round(width * 0.74);
const RITUAL_IMG_H  = Math.round(RITUAL_CARD_W * (9 / 16));

const DURACION_OPTS: { label: string; value: number | null }[] = [
  { label: "Todos",   value: null },
  { label: "5 min",  value: 5    },
  { label: "10 min", value: 10   },
  { label: "15 min", value: 15   },
  { label: "20 min", value: 20   },
  { label: "30 min", value: 30   },
];

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


function NavTabChip({ sel, label, onPress }: { sel: boolean; label: string; onPress: () => void }) {
  const selOpacity = useRef(new Animated.Value(sel ? 1 : 0)).current;
  useEffect(() => {
    Animated.timing(selOpacity, { toValue: sel ? 1 : 0, duration: 180, useNativeDriver: true }).start();
  }, [sel]);
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.headerTabChip, { opacity: pressed ? 0.7 : 1 }]}
    >
      <LinearGradient
        colors={["rgba(255,255,255,0.06)", "rgba(255,255,255,0.06)"]}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <Animated.View style={[StyleSheet.absoluteFill, { opacity: selOpacity }]}>
        <LinearGradient
          colors={["#D6A45C", "#BE8744"]}
          start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      </Animated.View>
      <Text style={[styles.headerTabText, sel && styles.headerTabTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function RitualCard({ session, onPress }: { session: Session; onPress: () => void }) {
  const cardW  = width - GRID_PAD * 2;
  const imgH   = Math.round(cardW * (9 / 16));
  const idNum  = parseInt(session.id, 10);
  const rating = (4.5 + (isNaN(idNum) ? 0 : (idNum % 5) * 0.08)).toFixed(1);
  const author = session.guideIds
    ? (getGuide(session.guideIds[0])?.name ?? "Casa del Cuenco")
    : session.guideId
      ? (getGuide(session.guideId)?.name ?? "Casa del Cuenco")
      : session.artistId
        ? (getArtist(session.artistId)?.name ?? "Resonancia")
        : "Casa del Cuenco";
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
    >
      <View style={{ width: cardW, height: imgH, borderRadius: 13, overflow: "hidden", marginBottom: 10, backgroundColor: "rgba(255,255,255,0.025)" }}>
        <Image source={session.image as never} style={{ width: cardW, height: imgH }} resizeMode="cover" />
      </View>
      <View style={styles.ritualMeta}>
        <Text style={styles.ritualMetaText}>{session.categoryLabel}</Text>
        <Text style={styles.ritualDot}>·</Text>
        <Text style={styles.ritualMetaText}>{session.durationLabel}</Text>
      </View>
      <Text style={styles.ritualTitle} numberOfLines={2}>{session.title}</Text>
      <Text style={styles.ritualAuthor} numberOfLines={1}>{author}</Text>
    </Pressable>
  );
}

export default function HomeScreen2() {
  const colors = useColors();
  const { savedEntries: intencionSaved, favorites: intencionFavs } = useIntencion();
  const currentIntencion = intencionSaved[0]?.text ?? intencionFavs[0] ?? null;
  const insets = useSafeAreaInsets();
  const { playSession, currentSession, isPlaying, pauseResume, history } = usePlayer();
  const { isPremium } = usePremium();
  const { upcoming: upcomingLiveSessions } = useLiveSessions();
  const nextLiveSession = upcomingLiveSessions[0] ?? null;
  const { playlists } = useFoldersPlaylists();
  const { presets, loadPreset, openSheet } = useMixer();
  const [fontsLoaded] = useFonts({ Cinzel_900Black, Cinzel_400Regular });

  const [moodSheetVisible, setMoodSheetVisible] = useState(false);
  const [selectedMood, setSelectedMood] = useState<Mood | null>(null);
  const [ritualesFilter,       setRitualesFilter]       = useState<number | null>(null);
  const [ritualesSheetVisible, setRitualesSheetVisible] = useState(false);
  const [tempRitualesFilter,   setTempRitualesFilter]   = useState<number | null>(null);

  function handleMoodSelect(moodId: MoodId) {
    setSelectedMood(getMoodById(moodId) ?? null);
  }

  function handleIntentionPress() {
    router.push("/intencion-onboarding" as never);
  }

  const cursorOpacity = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(cursorOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ])
    );
    blink.start();
    return () => blink.stop();
  }, [cursorOpacity]);

  const { data: pinnedFeaturedData } = useGetPinnedFeatured();

  const featuredSession = React.useMemo(() => {
    // Si el admin pineó una sesión, usarla directamente.
    const pinned = pinnedFeaturedData?.session;
    if (pinned) {
      return getSessionById(pinned.id) ?? {
        id: pinned.id,
        title: pinned.title,
        subtitle: pinned.subtitle ?? "",
        description: pinned.description ?? "",
        categoryId: pinned.categoryId ?? "",
        categoryLabel: pinned.categoryLabel ?? "",
        duration: pinned.duration ?? 0,
        durationLabel: pinned.durationLabel ?? "",
        isPremium: pinned.isPremium ?? false,
        isFeatured: true,
        imageKey: pinned.imageUrl ?? undefined,
        themeTag: [],
      } as unknown as Session;
    }
    // Fallback: sesión aleatoria del día desde las marcadas isFeatured.
    const featured = getFeaturedSessions();
    if (!featured.length) return undefined;
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
    return featured[dayOfYear % featured.length];
  }, [pinnedFeaturedData]);

  const { version: catalogVersion } = useCatalog();
  // Recientes — últimas sesiones agregadas al catálogo
  const recentSessions = React.useMemo<Session[]>(() => {
    return [...SESSIONS].sort((a, b) => {
      const aNum = parseInt(a.id); const bNum = parseInt(b.id);
      const aIsNum = !isNaN(aNum);  const bIsNum = !isNaN(bNum);
      if (!aIsNum && bIsNum)  return -1; // usr_* (admin) primero
      if (aIsNum  && !bIsNum) return  1;
      if (!aIsNum && !bIsNum) {
        const aT = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bT = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bT - aT;
      }
      return bNum - aNum;
    }).slice(0, 10);
  }, [catalogVersion]);

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

  // Fallback cuando aún no hay plays sincronizados: sesiones destacadas
  const popularFallback = React.useMemo<Session[]>(
    () => SESSIONS.filter((s) => s.isFeatured).slice(0, 10),
    [catalogVersion],
  );
  const usingPopularFallback = popularSessions.length === 0;

  const [actionsSession, setActionsSession] = useState<Session | null>(null);
  const [activeFilter, setActiveFilter] = useState<string[] | null>(null);

  // Sub-filtros de Sesiones
  const [sesionesOpen,    setSesionesOpen]    = useState(false);
  const [sesionesVisible, setSesionesVisible] = useState(false);
  const [sesAncestral,    setSesAncestral]    = useState(false);
  const [sesMeditacion,   setSesMeditacion]   = useState(false);
  const spacerWidthSV  = useSharedValue(0);
  const pillOpacitySV  = useSharedValue(0);
  const pillTranslateSV = useSharedValue(20);
  const spacerAnimStyle = useAnimatedStyle(() => ({ width: spacerWidthSV.value }));
  const pillAnimStyle   = useAnimatedStyle(() => ({
    opacity:   pillOpacitySV.value,
    transform: [{ translateX: pillTranslateSV.value }],
  }));

  useEffect(() => {
    const easeOut = { duration: 200, easing: Easing.out(Easing.quad) };
    if (sesionesOpen) {
      spacerWidthSV.value   = 0;
      pillOpacitySV.value   = 0;
      pillTranslateSV.value = 20;
      setSesionesVisible(true);
      spacerWidthSV.value   = withTiming(188, easeOut);
      pillOpacitySV.value   = withDelay(80, withTiming(1, { duration: 160 }));
      pillTranslateSV.value = withDelay(80, withTiming(0, { duration: 180, easing: Easing.out(Easing.quad) }));
    } else {
      pillOpacitySV.value   = withTiming(0, { duration: 110 });
      pillTranslateSV.value = withTiming(20, { duration: 130, easing: Easing.in(Easing.quad) });
      spacerWidthSV.value   = withDelay(80, withTiming(0, { duration: 160 }, (finished) => {
        if (finished) runOnJS(setSesionesVisible)(false);
      }));
    }
  }, [sesionesOpen]);

  const updateSesFilter = (anc: boolean, med: boolean) => {
    if (anc && !med)  setActiveFilter(["sonidos-ancestrales"]);
    else if (!anc && med) setActiveFilter(["meditaciones-guiadas"]);
    else              setActiveFilter(NAV_TABS[1].cats);
  };

  // Sesiones para "Recomendado para ti" / "Para tu estado de ánimo"
  const RECO_CATS = ["meditaciones-guiadas", "reflexiones", "sonidos-ancestrales", "musica-sonidos"];
  const moodRecommended = React.useMemo<Session[]>(() => {
    if (selectedMood) {
      const cats = new Set(selectedMood.categoryIds);
      const themes = new Set<string>(selectedMood.themeTags);
      const pool = SESSIONS.filter((s) => cats.has(s.categoryId));
      const boosted = pool.filter((s) => s.themeTag?.some((t) => themes.has(t)));
      const rest = pool.filter((s) => !s.themeTag?.some((t) => themes.has(t)));
      return [...boosted, ...rest].slice(0, 5);
    }
    const pool = SESSIONS.filter((s) => RECO_CATS.includes(s.categoryId));
    const seed = new Date().toDateString();
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) & 0x7fffffff;
    const shuffled = [...pool];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.abs(hash ^ (i * 2654435761)) % (i + 1);
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, 5);
  }, [selectedMood, catalogVersion]);

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
  // (history ya viene ordenado con el más reciente al inicio, ver addToHistory)
  const listenedRecently = React.useMemo<Session[]>(() => {
    const seen = new Set<string>();
    const result: Session[] = [];
    for (let i = 0; i < history.length; i++) {
      const h = history[i];
      if (seen.has(h.sessionId)) continue;
      seen.add(h.sessionId);
      const s = getSessionById(h.sessionId);
      if (s) result.push(s);
      if (result.length === 10) break;
    }
    return result;
  }, [history]);

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

  const filteredPopular = React.useMemo(() => {
    const base = usingPopularFallback ? popularFallback : popularSessions.slice(0, 10);
    if (!activeFilter) return base;
    return base.filter((s) => activeFilter.includes(s.categoryId));
  }, [popularSessions, popularFallback, usingPopularFallback, activeFilter]);

  const filteredFeatured = React.useMemo(() => {
    if (!activeFilter) return featuredSession;
    const pool = SESSIONS.filter((s) => activeFilter.includes(s.categoryId));
    if (!pool.length) return undefined;
    const seed = new Date().toDateString() + activeFilter.join();
    let hash = 0;
    for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) & 0x7fffffff;
    return pool[Math.abs(hash) % pool.length];
  }, [activeFilter, featuredSession]);

  const isFeaturedPlaying =
    !!currentSession && !!filteredFeatured &&
    currentSession.id === filteredFeatured.id && isPlaying;


  const { open: openDrawer } = useDrawer();
  const { photoUri, username } = useUserProfile();
  const { user: clerkUser } = useUser();
  const { isRegistered, isSignedIn } = useAuth();
  const headerLoggedIn = isRegistered || isSignedIn;
  const headerPhoto = photoUri || clerkUser?.imageUrl || null;
  const headerInitial = (
    clerkUser?.firstName || clerkUser?.username || username || ""
  ).charAt(0).toUpperCase() || null;
  const [headerPhotoError, setHeaderPhotoError] = useState(false);
  useEffect(() => { setHeaderPhotoError(false); }, [headerPhoto]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={styles.root}>
      <LinearGradient colors={["#230610", "#16040A"]} style={styles.rootGradient} />
      <StatusBar barStyle="light-content" />

      {/* ── STICKY HEADER: avatar + nav-tabs — permanece visible al hacer scroll ── */}
      <View style={[styles.stickyHeader, { paddingTop: topPad + 2 }]}>
        <View style={styles.headerTopRow}>
          <Pressable
            onPress={() => openDrawer()}
            hitSlop={8}
            style={[styles.avatarBtn, headerLoggedIn && styles.avatarBtnLoggedIn]}
          >
            {headerPhoto && !headerPhotoError ? (
              <ExpoImage
                source={{ uri: headerPhoto }}
                style={styles.avatarSmall}
                contentFit="cover"
                onError={() => setHeaderPhotoError(true)}
              />
            ) : headerLoggedIn && headerInitial ? (
              <View style={styles.avatarInitial}>
                <Text style={styles.avatarInitialText}>{headerInitial}</Text>
              </View>
            ) : (
              <View style={styles.avatarFallback}>
                <Feather name="user" size={15} color="#c2c2c2" />
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
              const sel = tab.cats.length === 0
                ? activeFilter === null
                : activeFilter?.join() === tab.cats.join();
              return (
                <React.Fragment key={tab.id}>
                  <NavTabChip
                    sel={sel}
                    label={tab.label}
                    onPress={() => {
                      setSesionesOpen(false);
                      setSesAncestral(false);
                      setSesMeditacion(false);
                      setActiveFilter(sel || tab.cats.length === 0 ? null : tab.cats);
                    }}
                  />
                </React.Fragment>
              );
            })}
          </ScrollView>
          <CuencoBell />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 160 + bottomPad, paddingTop: 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── INTENCIÓN ── */}
        <Pressable
          onPress={handleIntentionPress}
          style={({ pressed }) => [styles.intencionWrap, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={styles.intencionSuper}>Hoy voy a…</Text>
          <View style={styles.intencionRow}>
            <Animated.View style={[styles.intencionCursor, { opacity: cursorOpacity }]} />
            {currentIntencion ? (
              <Text style={styles.intencionText} numberOfLines={3}>
                {currentIntencion}
              </Text>
            ) : (
              <Text style={styles.intencionPlaceholder}>
                Establece tu intención aquí
              </Text>
            )}
          </View>
        </Pressable>

        {/* ── SESIÓN EN VIVO PRÓXIMA ── */}
        {nextLiveSession && (
          <View style={{ paddingHorizontal: GRID_PAD, marginBottom: SECTION_GAP }}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text style={styles.sectionTitle}>Tu próxima sesión</Text>
              <Pressable
                onPress={() => router.push("/mis-sesiones" as never)}
                hitSlop={8}
              >
                <Text style={{ color: "#BE8744", fontSize: 13, fontFamily: "Inter_400Regular" }}>
                  Ver todas
                </Text>
              </Pressable>
            </View>
            <LiveSessionCard
              session={nextLiveSession}
              onEnter={(s) => {
                router.push({
                  pathname: "/sesion-vivo/[id]" as never,
                  params: {
                    id: String(s.id),
                    roomUrl: s.dailyRoomUrl ?? "",
                    guideDisplayName: s.guideDisplayName ?? "",
                  },
                } as never);
              }}
            />
          </View>
        )}

        {/* ── 1. COLECCIONES ── */}
        {filteredPlaylists.length > 0 && (
        <View style={[styles.header, { marginTop: -3 }]}>

          <View style={styles.coleccionGrid}>
              {filteredPlaylists.map((pl) => (
                <Pressable
                  key={pl.id}
                  onPress={() => router.push(`/coleccion/${pl.id}` as never)}
                  style={({ pressed }) => [styles.coleccionCard, { opacity: pressed ? 0.75 : 1 }]}
                >
                  <Image
                    source={pl.coverUrl ? { uri: pl.coverUrl } : pl.cover as number}
                    style={styles.coleccionThumb}
                    resizeMode="cover"
                  />
                  <View style={styles.coleccionTitleRow}>
                    <Text style={styles.coleccionTitle} numberOfLines={2}>{pl.title}</Text>
                    {isPlaying && currentSession && pl.sessionIds.includes(currentSession.id) && (
                      <EqualizerBars color="#BE8744" size="sm" />
                    )}
                  </View>
                </Pressable>
              ))}
          </View>

        </View>
        )}

        {/* ── SESIÓN DESTACADA ── */}
        {filteredFeatured && (
          <View style={[styles.section, { marginBottom: SECTION_GAP }]}>
            <Text style={styles.sectionTitle}>
              Destacada de hoy
            </Text>
            <Pressable
              onPress={() => {
                if (filteredFeatured.skipDetail) { playSession(filteredFeatured); router.push("/player" as never); }
                else router.push(`/session/${filteredFeatured.id}` as never);
              }}
            >
              <View style={styles.heroImageContainer}>
                <Image source={filteredFeatured.image as number} style={styles.heroImage} resizeMode="cover" />
              </View>
              {(() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const guideId = (filteredFeatured as any).guideId as string | undefined;
                const heroAuthor = guideId ? (getGuide(guideId)?.name ?? "Casa del Cuenco") : "Casa del Cuenco";
                return (
                  <View style={{ marginTop: 12 }}>
                    <Text style={styles.heroMetaText}>
                      {filteredFeatured.categoryLabel} · {filteredFeatured.durationLabel}
                    </Text>
                    <Text style={styles.heroTitle} numberOfLines={2}>
                      {filteredFeatured.title}
                    </Text>
                    <Text style={styles.heroAuthor} numberOfLines={1}>
                      {heroAuthor}
                    </Text>
                  </View>
                );
              })()}
            </Pressable>
          </View>
        )}

        {/* ── Explorar todo (TEMAS 6×2) ── */}
        <View style={[styles.section, { marginBottom: SECTION_GAP, marginTop: 0 }]}>
          <View style={styles.sectionRow}>
            <Text style={[styles.sectionTitle, { marginBottom: 24 }]}>Explorar todo</Text>
          </View>
          <View style={[styles.temaGrid, { marginTop: 0 }]}>
            {TEMAS.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => router.push((t.route ?? `/tema/${t.id}`) as never)}
                style={({ pressed }) => [
                  styles.temaCell,
                  {
                    width: TEMA3_W,
                    height: TEMA3_W,
                    backgroundColor: pressed
                      ? hexTint(t.color, 0.22)
                      : "rgba(255,255,255,0.055)",
                    borderRadius: 11,
                  },
                ]}
              >
                {t.image != null ? (
                  <ExpoImage
                    source={t.image}
                    style={styles.temaCellIcon}
                    contentFit="contain"
                  />
                ) : (
                  <MaterialCommunityIcons name={t.icon} size={28} color={t.color} />
                )}
                <Text style={[styles.temaCellLabel, { color: "#e8e8e8" }]} numberOfLines={2}>
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── ESCUCHADAS RECIENTEMENTE ── */}
        <SessionCarousel
          title="Escuchadas recientemente"
          sessions={filteredListened}
          isPremium={isPremium}
          onPress={(s) => { if (s.skipDetail) { playSession(s); router.push("/player" as never); return; } router.push(`/session/${s.id}` as never); }}
          style={{ marginBottom: SECTION_GAP }}
          titleOffset={10}
          cardWidth={RECENT_CARD_W}
        />

        {/* ── ESTADO DE ÁNIMO ── */}
        <View style={{ paddingHorizontal: 16 }}>
          <Text style={styles.sectionTitle}>Personaliza tus recomendaciones</Text>
        </View>

        {selectedMood ? (
          <Pressable
            onPress={() => setMoodSheetVisible(true)}
            style={({ pressed }) => [styles.moodRow, styles.moodRowActive, { opacity: pressed ? 0.78 : 1 }]}
          >
            <Text style={styles.moodSientesLabel}>Sientes:</Text>
            <View style={{ flex: 1 }} />
            <LinearGradient
              colors={["rgba(190,100,80,0.55)", "rgba(120,60,160,0.55)"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.moodPill}
            >
              <Text style={styles.moodPillEmoji}>{selectedMood.emoji}</Text>
              <Text style={styles.moodPillLabel}>{selectedMood.label}</Text>
              <Pressable
                onPress={(e) => { e.stopPropagation?.(); setSelectedMood(null); }}
                hitSlop={10}
                style={{ marginLeft: 2 }}
              >
                <Feather name="x-circle" size={14} color="rgba(255,255,255,0.75)" />
              </Pressable>
            </LinearGradient>
          </Pressable>
        ) : (
          <Pressable
            onPress={() => setMoodSheetVisible(true)}
            style={({ pressed }) => [styles.moodRow, { opacity: pressed ? 0.78 : 1 }]}
          >
            <Text style={styles.moodEmoji}>🙂</Text>
            <Text style={styles.moodRowLabel}>¿Cómo te sientes hoy?</Text>
            <Feather name="chevron-right" size={16} color="rgba(190,150,80,0.6)" />
          </Pressable>
        )}

        {/* ── RECOMENDADO PARA TI ── */}
        <View style={{ paddingHorizontal: 16 }}>
          <Text style={[styles.sectionTitle, { marginTop: 24 }]}>
            {selectedMood ? "Para tu estado de ánimo" : "Recomendado para ti"}
          </Text>
        </View>
        <View style={styles.recoSection}>
          {moodRecommended.map((s) => (
            <SessionRow
              key={s.id}
              session={s}
              style={styles.recoCard}
              imageSize={84}
              metaText={s.categoryLabel}
              onPress={() => {
                if (s.isPremium && !isPremium) { router.push("/membresia" as never); return; }
                if (s.skipDetail) { playSession(s); router.push("/player" as never); return; }
                router.push(`/session/${s.id}` as never);
              }}
            />
          ))}
        </View>

        {/* ── BANNER PREMIUM ── */}
        {!isPremium && (
          <View style={styles.premBannerOuter}>
            <Pressable
              onPress={() => router.push("/membresia" as never)}
              style={({ pressed }) => [styles.premBannerWrap, { opacity: pressed ? 0.82 : 1 }]}
            >
              <LinearGradient
                colors={["#4A1212", "#2C0909", "#1E0608"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
              />
              <LinearGradient
                colors={["rgba(255,255,255,0.06)", "transparent"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 0.6, y: 1 }}
                style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
                pointerEvents="none"
              />
              <View style={styles.premCrownCircle}>
                <Text style={{ fontSize: 18 }}>👑</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.premTitle}>Prueba Premium</Text>
                <Text style={styles.premSub}>Desbloquea todo el contenido</Text>
              </View>
              <View style={styles.premChevron}>
                <Feather name="chevron-right" size={14} color="#BE8744" />
              </View>
            </Pressable>
          </View>
        )}

        {/* ── RECIENTES ── */}
        <SessionCarousel
          title="Recientes"
          sessions={filteredRecent}
          isPremium={isPremium}
          onPress={(s) => { if (s.skipDetail) { playSession(s); router.push("/player" as never); return; } router.push(`/session/${s.id}` as never); }}
          style={{ marginBottom: SECTION_GAP }}
          titleOffset={10}
          cardWidth={RECENT_CARD_W}
        />

        {/* ── LAS MÁS ESCUCHADAS ── */}
        <SessionCarousel
          title={usingPopularFallback ? "Sesiones destacadas" : "Las más escuchadas"}
          sessions={filteredPopular}
          isPremium={isPremium}
          onPress={(s) => { if (s.skipDetail) { playSession(s); router.push("/player" as never); return; } router.push(`/session/${s.id}` as never); }}
          style={{ marginBottom: SECTION_GAP }}
          titleOffset={10}
          cardWidth={RECENT_CARD_W}
        />

        {/* ── 5. REFLEXIÓN DE LA SEMANA ── */}
        <View style={{ marginBottom: SECTION_GAP }}>
          <QuoteOfTheDay />
        </View>

        {/* ── 6. RITUALES SAGRADOS ── */}
        {(() => {
          const pool = ritualesFilter
            ? SESSIONS.filter(s => s.duration <= ritualesFilter)
            : SESSIONS;
          const ritualesSessions = pool.slice(0, 10);
          return (
            <View style={{ marginBottom: SECTION_GAP }}>
              <View style={[styles.sectionRow, { paddingHorizontal: GRID_PAD, marginBottom: 16 }]}>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Para tus rituales sagrados</Text>
                <Pressable
                  onPress={() => { setTempRitualesFilter(ritualesFilter); setRitualesSheetVisible(true); }}
                  style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
                >
                  <View style={styles.ritualFilterPill}>
                    <Text style={styles.ritualFilterPillText}>
                      {ritualesFilter ? `${ritualesFilter} min` : "Todos"}
                    </Text>
                    <Feather name="chevron-down" size={12} color="#BE8744" />
                  </View>
                </Pressable>
              </View>
              <View style={{ paddingHorizontal: GRID_PAD }}>
                {ritualesSessions.map((s, i) => (
                  <View key={s.id} style={i < ritualesSessions.length - 1 ? { marginBottom: 60 } : undefined}>
                    <RitualCard
                      session={s}
                      onPress={() => {
                        if (s.isPremium && !isPremium) { router.push("/membresia" as never); return; }
                        if (s.skipDetail) { playSession(s); router.push("/player" as never); return; }
                        router.push(`/session/${s.id}` as never);
                      }}
                    />
                  </View>
                ))}
              </View>
            </View>
          );
        })()}

        {/* ── 8. MURO DE AGRADECIMIENTOS ── */}
        <View style={styles.sectionDivider} />
        <View style={{ marginBottom: SECTION_GAP }}>
          <AlmaCommunitySection />
        </View>


        {/* ── 10. BANNER PREMIUM ── */}
        <View style={{ marginBottom: SECTION_GAP }}>
          <PremiumBanner />
        </View>

      </ScrollView>

      <MoodPickerSheet
        visible={moodSheetVisible}
        onClose={() => setMoodSheetVisible(false)}
        onSelect={handleMoodSelect}
      />

      <SessionActionsSheet
        session={actionsSession}
        visible={actionsSession !== null}
        onClose={() => setActionsSession(null)}
      />

      {/* ── Filtro de duración — Rituales Sagrados ── */}
      <Modal
        transparent
        visible={ritualesSheetVisible}
        animationType="slide"
        onRequestClose={() => setRitualesSheetVisible(false)}
      >
        <Pressable style={styles.ritualBackdrop} onPress={() => setRitualesSheetVisible(false)} />
        <View style={styles.ritualSheet}>
          <View style={styles.ritualSheetHandle} />
          {DURACION_OPTS.map(opt => {
            const sel = tempRitualesFilter === opt.value;
            return (
              <Pressable
                key={String(opt.value)}
                onPress={() => setTempRitualesFilter(opt.value)}
                style={({ pressed }) => [styles.ritualSheetItem, { opacity: pressed ? 0.7 : 1 }]}
              >
                <View style={sel ? styles.ritualSheetItemSelWrap : undefined}>
                  <Text style={[styles.ritualSheetItemText, sel && styles.ritualSheetItemSel]}>
                    {opt.label}
                  </Text>
                </View>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => { setRitualesFilter(tempRitualesFilter); setRitualesSheetVisible(false); }}
            style={({ pressed }) => [styles.ritualApplyBtn, { opacity: pressed ? 0.85 : 1 }]}
          >
            <LinearGradient
              colors={["#D6A45C", "#BE8744"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.ritualApplyText}>Aplicar</Text>
          </Pressable>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#230610" },
  rootGradient: { ...StyleSheet.absoluteFillObject },
  stickyHeader: {
    paddingHorizontal: GRID_PAD,
    paddingBottom: 0,
    backgroundColor: "transparent",
    zIndex: 10,
  },
  scroll: { flex: 1 },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(190,150,80,0.18)",
    marginHorizontal: 20,
    marginVertical: 8,
  },

  // Estado de ánimo
  moodRow: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginBottom: 8,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 10,
  },
  moodRowActive: {
    paddingVertical: 11,
  },
  moodEmoji: {
    fontSize: 22,
  },
  moodRowLabel: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
    color: "#e8e8e8",
  },
  moodSientesLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#e8e8e8",
  },
  moodPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: "hidden",
  },
  moodPillEmoji: {
    fontSize: 16,
  },
  moodPillLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#fff",
  },
  recoSection: {
    marginHorizontal: 16,
    marginBottom: SECTION_GAP,
    flexDirection: "column",
    gap: 16,
  },
  recoCard: {
    backgroundColor: "rgba(255,255,255,0.045)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
    shadowOpacity: 0,
    elevation: 0,
  },

  // Intención
  intencionWrap: {
    alignItems: "center",
    paddingHorizontal: GRID_PAD,
    paddingVertical: 20,
    marginTop: 7,
    marginBottom: SECTION_GAP,
    transform: [{ translateY: 8 }],
  },
  intencionSuper: {
    fontSize: 13,
    color: "rgba(237,225,211,0.45)",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  intencionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  intencionCursor: {
    width: 2,
    height: 26,
    borderRadius: 1,
    backgroundColor: "#BE9650",
    marginRight: 6,
  },
  intencionText: {
    fontSize: 22,
    color: "#e8e8e8",
    fontWeight: "300",
    textAlign: "center",
    flexShrink: 1,
  },
  intencionPlaceholder: {
    fontSize: 20,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
    textAlign: "center",
    flexShrink: 1,
  },

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
    width: 33,
    height: 33,
    borderRadius: 16.5,
    overflow: "hidden",
  },
  avatarBtnLoggedIn: {
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.7)",
  },
  avatarSmall: {
    width: 33,
    height: 33,
    borderRadius: 16.5,
  },
  avatarFallback: {
    width: 33,
    height: 33,
    borderRadius: 16.5,
    backgroundColor: "rgba(255,255,255,0.025)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.25)",
  },
  avatarInitial: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(212,175,55,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarInitialText: {
    color: "#BE8744",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.3,
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
  headerTabChip: {
    borderRadius: 20,
    paddingHorizontal: 17,
    height: 34,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  sesSubSpacer: {
    height: 34,
    overflow: "visible",
    marginLeft: -6,
  },
  sesSubRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingLeft: 6,
  },
  headerTabText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#e8e8e8",
    letterSpacing: 0.1,
  },
  headerTabTextActive: {
    color: "#1B060F",
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
  sectionDivider: {
    marginHorizontal: GRID_PAD * 2,
    marginBottom: SECTION_GAP,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.025)",
  },
  sectionRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    marginBottom: 0,
  },
  sectionTitle: { fontSize: 20, fontWeight: "600", letterSpacing: 0.3, marginBottom: 24, color: "#e8e8e8" },
  verTodasLink: { fontSize: 13, fontWeight: "400" },

  // Explorar todo — grid 2 columnas, icono arriba + texto centrado
  temaGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: TEMA_GAP,
    marginTop: 2,
  },
  temaCell: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 15,
    paddingHorizontal: 8,
    paddingVertical: 12,
  },
  temaCellIcon: {
    width: 28,
    height: 28,
  },
  temaCellLabel: {
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 17,
  },

  // Categories — 2×2 grid cards
  coleccionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  coleccionCard: {
    width: "48.5%",
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
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    gap: 6,
    backgroundColor: "rgba(27,6,15,0.30)",
  },
  coleccionTitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: "700",
    color: "#e8e8e8",
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
    backgroundColor: "#230610",
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
    color: "#e8e8e8",
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
    backgroundColor: "rgba(74,12,12,0.08)",
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
    backgroundColor: "rgba(27,6,15,0.72)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  recentDurText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#e8e8e8",
  },
  recentTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#e8e8e8",
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
    backgroundColor: "rgba(74,12,12,0.08)",
  },
  recentCreatorName: {
    fontSize: 11,
    color: "#c2c2c2",
    flex: 1,
    marginTop: 4,
  },

  // Hero — sesión destacada del día
  heroImageContainer: {
    width: "100%",
    height: HERO_HEIGHT,
    borderRadius: 15,
    overflow: "hidden",
  },
  heroImage: { width: "100%", height: "100%" },
  heroMetaText: { fontSize: 11, lineHeight: 14, color: "#c2c2c2", marginBottom: 6 },
  heroTitle: { fontSize: 18, fontWeight: "600", lineHeight: 24, color: "#e8e8e8", marginBottom: 4 },
  heroAuthor: { fontSize: 12, color: "#c2c2c2", marginTop: 2 },
  heroBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
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
    borderColor: "rgba(61,14,22,0.40)",
    alignItems: "center",
    justifyContent: "center",
  },
  diarioIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "rgba(74,12,12,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  squareTitle: { fontSize: 16, fontWeight: "700", letterSpacing: 0.2, marginTop: 12, textAlign: "center", color: "#e8e8e8" },
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

  // Banner premium compacto
  premBannerOuter: {
    marginHorizontal: GRID_PAD,
    marginTop: 7,
    marginBottom: SECTION_GAP,
  },
  premBannerWrap: {
    height: 68,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.35)",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 14,
  },
  premCrownCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1.5,
    borderColor: "rgba(212,175,55,0.45)",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },
  premTitle: { fontSize: 15, fontWeight: "700", color: "#e8e8e8", lineHeight: 20, marginBottom: 2 },
  premSub:   { fontSize: 12, color: "rgba(255,255,255,0.52)" },
  premChevron: {
    width: 26, height: 26, borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.025)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.35)",
    alignItems: "center", justifyContent: "center",
    flexShrink: 0,
  },

  // ── Rituales Sagrados ─────────────────────────────────────────────────────
  ritualCard: {
    width: RITUAL_CARD_W,
  },
  ritualImgWrap: {
    width: RITUAL_CARD_W,
    height: RITUAL_IMG_H,
    borderRadius: 13,
    overflow: "hidden",
    marginBottom: 10,
    backgroundColor: "rgba(255,255,255,0.025)",
  },
  ritualImg: {
    width: RITUAL_CARD_W,
    height: RITUAL_IMG_H,
  },
  ritualMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 5,
  },
  ritualStar: {
    fontSize: 12,
    fontWeight: "600",
    color: "#E9C46A",
  },
  ritualDot: {
    fontSize: 12,
    color: "rgba(255,255,255,0.30)",
  },
  ritualMetaText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.50)",
  },
  ritualTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#FFFFFF",
    lineHeight: 21,
    marginBottom: 4,
  },
  ritualAuthor: {
    fontSize: 12,
    color: "rgba(255,255,255,0.45)",
  },
  ritualFilterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(255,255,255,0.035)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  ritualFilterPillText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#BE8744",
  },
  ritualBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  ritualSheet: {
    backgroundColor: "#230610",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 14,
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  ritualSheetHandle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginBottom: 18,
  },
  ritualSheetItem: {
    paddingVertical: 10,
    alignItems: "center",
  },
  ritualSheetItemSelWrap: {
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    paddingHorizontal: 32,
    paddingVertical: 10,
  },
  ritualSheetItemText: {
    fontSize: 18,
    color: "rgba(255,255,255,0.45)",
    fontWeight: "400",
  },
  ritualSheetItemSel: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  ritualApplyBtn: {
    marginTop: 20,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  ritualApplyText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
