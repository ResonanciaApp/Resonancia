import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  Animated,
  Dimensions,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Svg, { Defs, RadialGradient, Stop, Ellipse } from "react-native-svg";
import { SacredBackground } from "@/components/SacredBackground";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { SessionCard } from "@/components/SessionCard";
import { SessionCarousel } from "@/components/SessionCarousel";
import { SESSIONS, getSessionById } from "@/data/sessions";
import { getArtist } from "@/data/artists";
import { getGuide } from "@/data/guides";
import { TEMAS } from "@/data/temas";
import { PLAYLISTS } from "@/data/playlists";
import { TAG_CARDS } from "@/data/tags";
import { CHAKRAS, isChakraTag, type Chakra } from "@/data/chakras";
import { SacredGlyph } from "@/components/SacredGlyph";
import { usePremium } from "@/context/PremiumContext";
import { usePlayer } from "@/context/PlayerContext";
import { useColors } from "@/hooks/useColors";
import { useDrawer } from "@/context/DrawerContext";
import { useUserProfile } from "@/context/UserProfileContext";
import { useCatalog } from "@/context/CatalogContext";
import { useGetPopularSessions, getGetPopularSessionsQueryKey, useGetPinnedFeatured } from "@workspace/api-client-react";

const { width } = Dimensions.get("window");
const H_PAD = 20;
const GAP = 16;
const TEMA_GAP = 10;
const SECTION_GAP = 60;

/** Convierte un color hex + alpha a rgba() para usar como fondo tintado. */
function hexTint(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return `rgba(74,12,12,0.08)`;
  return `rgba(${r},${g},${b},${alpha})`;
}

const SQCARD_W = Math.round((width - H_PAD * 2) / 1.85);
const CHAKRA_PANEL_H = 580;
const CHAKRA_ORB_SIZE = 64;
const CHAKRA_ORB_CENTER_X = Math.round(width / 2);
const CHAKRA_LINE_W = 36; // longitud fija del conector a cada lado
const CHAKRAS_VISUAL = [...CHAKRAS].reverse(); // Sahasrara (corona) primero → Muladhara (raíz) último
// +8 px de separación acumulada entre cada chakra respecto a los originales
const CHAKRA_TOP_PCTS = [0.087, 0.233, 0.380, 0.527, 0.673, 0.820, 0.966] as const;
// Textos izquierda — mismo orden que CHAKRAS_VISUAL (Sahasrara → Muladhara)
const CHAKRA_LEFT_LABELS = [
  "Consciencia cósmica",
  "Visión interior",
  "Voz auténtica",
  "Amor incondicional",
  "Voluntad",
  "Fluir creativo",
  "Fuerza interior",
] as const;
const TEMA_COL_W = Math.floor((width - H_PAD * 2 - GAP) / 2);
const TEMA3_W    = Math.floor((width - H_PAD * 2 - TEMA_GAP * 2) / 3);

const CAT_CARD_GAP = 16;
const CAT_CARD_W = Math.round(((width - H_PAD * 2 - CAT_CARD_GAP) / 2.2 - 30) * 1.625);
const TAG_CARD_GAP = 6;
const TAG_CARD_W = Math.floor((width - H_PAD * 2 - TAG_CARD_GAP) / 2);
const HERO_HEIGHT = 270;

const DURATION_SLOTS = [
  { label: "5 min",  min: 0,  max: 5 },
  { label: "10 min", min: 6,  max: 10 },
  { label: "20 min", min: 11, max: 25 },
  { label: "30 min", min: 26, max: 35 },
  { label: "60 min", min: 36, max: Infinity },
] as const;

const BREATHING_EXERCISES = [
  { id: "478", name: "4-7-8", subtitle: "Calma y sueño" },
  { id: "box", name: "Cuadrada", subtitle: "Foco y equilibrio" },
  { id: "coherence", name: "Coherencia", subtitle: "Equilibrio cardíaco" },
] as const;

type Session = (typeof SESSIONS)[number];

/** Seed numérico basado en la fecha (YYYYMMDD) → mismo resultado todo el día */
function dateSeed(): number {
  const d = new Date();
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate();
}

function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function getDailyRecommendations(count = 5): Session[] {
  const pool = SESSIONS.filter((s) => s.categoryId === "meditaciones-guiadas");
  const rng = seededRandom(dateSeed());
  const shuffled = [...pool].sort(() => rng() - 0.5);
  return shuffled.slice(0, count);
}

function getSessionAuthor(s: Session): string {
  if (s.guideId) return getGuide(s.guideId).name;
  return getArtist(s.artistId).name;
}

// ── Overlay de búsqueda ────────────────────────────────────────────────────
function SearchOverlay({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const inputRef  = useRef<TextInput>(null);
  const [kbHeight, setKbHeight] = useState(0);
  const [kbReady,  setKbReady]  = useState(false);
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const insets    = useSafeAreaInsets();

  useEffect(() => {
    if (!visible) { setQ(""); setKbReady(false); setKbHeight(0); fadeAnim.setValue(0); return; }
    const show = Keyboard.addListener("keyboardWillShow", (e) => {
      setKbHeight(e.endCoordinates.height);
      setKbReady(true);
      Animated.timing(fadeAnim, { toValue: 1, duration: e.duration ?? 250, useNativeDriver: true }).start();
    });
    const showFallback = Keyboard.addListener("keyboardDidShow", (e) => {
      setKbHeight(e.endCoordinates.height);
      setKbReady(true);
      fadeAnim.setValue(1);
    });
    const hide = Keyboard.addListener("keyboardWillHide", () => { setKbReady(false); fadeAnim.setValue(0); });
    return () => { show.remove(); showFallback.remove(); hide.remove(); };
  }, [visible, fadeAnim]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return SESSIONS.slice(0, 0);
    return SESSIONS.filter((s) =>
      s.title.toLowerCase().includes(term) ||
      s.categoryLabel.toLowerCase().includes(term) ||
      (s.subtitle ?? "").toLowerCase().includes(term)
    ).slice(0, 30);
  }, [q]);

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose} onShow={() => inputRef.current?.focus()}>
      <View style={[srStyles.root, { paddingBottom: kbHeight }]}>
        {/* Barra */}
        <View style={[srStyles.overlay, { paddingTop: insets.top + 14 }]}>
          <View style={srStyles.bar}>
            <Feather name="search" size={16} color="#F9F9F9" />
            <TextInput
              ref={inputRef}
              style={srStyles.input}
              placeholder="Buscar sesiones, músicas, sonidos..."
              placeholderTextColor="#F9F9F9"
              value={q}
              onChangeText={setQ}
              returnKeyType="search"
              autoCorrect={false}
            />
            {q.length > 0 && (
              <Pressable onPress={() => setQ("")} hitSlop={10}>
                <Feather name="x" size={15} color="rgba(242,231,228,0.45)" />
              </Pressable>
            )}
          </View>
          <Pressable onPress={onClose} style={srStyles.cancel}>
            <Text style={srStyles.cancelText}>Cancelar</Text>
          </Pressable>
        </View>

        {/* Placeholder vacío */}
        {q.length === 0 && kbReady && (
          <Animated.View style={[srStyles.empty, { opacity: fadeAnim }]}>
            <Feather name="headphones" size={48} color="#F7CB6B" style={{ marginBottom: 16 }} />
            <Text style={srStyles.emptyTitle}>Encuentra tus sesiones favoritas</Text>
            <Text style={srStyles.emptySub}>Busca meditaciones, sonidos, historias…</Text>
          </Animated.View>
        )}

        {/* Resultados */}
        {q.length > 0 && (
          <FlatList
            data={results}
            keyExtractor={(s) => s.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 8, paddingBottom: 24 }}
            ListEmptyComponent={
              <View style={srStyles.empty}>
                <Feather name="search" size={36} color="rgba(242,231,228,0.45)" style={{ marginBottom: 12 }} />
                <Text style={srStyles.emptyTitle}>Sin resultados</Text>
                <Text style={srStyles.emptySub}>Intenta con otro término</Text>
              </View>
            }
            renderItem={({ item }) => {
              const authorName = item.guideId
                ? getGuide(item.guideId).name
                : item.artistId
                ? getArtist(item.artistId).name
                : item.subtitle ?? null;
              return (
                <Pressable
                  onPress={() => { onClose(); router.push(`/session/${item.id}` as never); }}
                  style={({ pressed }) => [srStyles.resultRow, { opacity: pressed ? 0.7 : 1 }]}
                >
                  <Image source={item.image as number} style={srStyles.thumb} contentFit="cover" />
                  <View style={{ flex: 1 }}>
                    <Text style={srStyles.resultCat} numberOfLines={1}>{item.categoryLabel}</Text>
                    <Text style={srStyles.resultTitle} numberOfLines={1}>{item.title}</Text>
                    {authorName && (
                      <Text style={srStyles.resultAuthor} numberOfLines={1}>{authorName}</Text>
                    )}
                  </View>
                </Pressable>
              );
            }}
          />
        )}
      </View>
    </Modal>
  );
}

const srStyles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: "#190913" },
  overlay:     { flexDirection: "row", alignItems: "center", backgroundColor: "#190913", paddingHorizontal: H_PAD, paddingBottom: 14, gap: 10 },
  bar:         { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.09)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11, borderWidth: 1, borderColor: "#ffffff" },
  input:       { fontFamily: "Manrope", flex: 1, fontSize: 14, color: "#FBFBFB" },
  cancel:      { paddingVertical: 6 },
  cancelText:  { fontFamily: "Manrope", color: "#F7CB6B", fontSize: 14, fontWeight: "600" },
  empty:       { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingTop: 60 },
  emptyTitle:  { fontFamily: "Manrope", fontSize: 18, fontWeight: "700", color: "#FBFBFB", textAlign: "center", marginBottom: 10 },
  emptySub:    { fontFamily: "Manrope", fontSize: 14, color: "rgba(242,231,228,0.45)", textAlign: "center", lineHeight: 20 },
  resultRow:   { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 5 },
  thumb:       { width: 75, height: 75, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.025)" },
  resultCat:   { fontFamily: "Manrope", fontSize: 12, color: "rgba(242,231,228,0.45)", marginBottom: 3 },
  resultTitle: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700", color: "#FBFBFB", marginBottom: 3 },
  resultAuthor:{ fontFamily: "Manrope", fontSize: 12, color: "rgba(242,231,228,0.45)" },
});

// ── ChakraBodyRow ──────────────────────────────────────────────────────────────
const GLOW_R = 34;
const ROW_H = 72;

function ChakraBodyRow({ chakra, topPct, side, colorAnim }: { chakra: Chakra; topPct: number; side: "left" | "right"; colorAnim: Animated.Value }) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const dimAnim   = useRef(new Animated.Value(0.75)).current;

  const handlePress = () => {
    scaleAnim.setValue(1);
    // Color (JS driver — no puede mezclarse con native)
    Animated.sequence([
      Animated.timing(colorAnim, { toValue: 1, duration: 300, useNativeDriver: false }),
      Animated.timing(colorAnim, { toValue: 0, duration: 500, useNativeDriver: false }),
    ]).start();
    // Scale + dim (native driver)
    Animated.parallel([
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.07, duration: 230, useNativeDriver: true }),
        Animated.timing(scaleAnim, { toValue: 1,    duration: 230, useNativeDriver: true }),
      ]),
      Animated.sequence([
        Animated.timing(dimAnim,   { toValue: 1,    duration: 230, useNativeDriver: true }),
        Animated.timing(dimAnim,   { toValue: 0.75, duration: 230, useNativeDriver: true }),
      ]),
    ]).start(() => router.push(`/chakra/${chakra.id}` as never));
  };

  const rowTop = Math.round(topPct * CHAKRA_PANEL_H) - ROW_H / 2;

  const glyphAnimStyle = {
    transform: [{ scale: scaleAnim }],
    opacity: dimAnim,
  };

  if (side === "right") {
    return (
      <Pressable
        onPress={handlePress}
        hitSlop={6}
        style={{
          position: "absolute",
          top: rowTop,
          left: CHAKRA_ORB_CENTER_X - GLOW_R,
          right: 0,
          height: ROW_H,
          flexDirection: "row",
          alignItems: "center",
        }}
      >
        <Animated.View style={[{ marginLeft: GLOW_R - CHAKRA_ORB_SIZE / 2 }, glyphAnimStyle]}>
          <SacredGlyph id={chakra.geometryId} color={chakra.color} size={CHAKRA_ORB_SIZE} />
        </Animated.View>
        <View style={{ marginLeft: 23 }}>
          <Text style={{ color: "#FBFBFB", fontFamily: "Manrope", fontSize: 13, fontWeight: "700" }}>
            {chakra.name}
          </Text>
          <Text style={{ color: "rgba(255,255,255,0.58)", fontFamily: "Manrope", fontSize: 11, marginTop: 2 }}>
            {chakra.subtitle}
          </Text>
        </View>
      </Pressable>
    );
  }

  // side === "left" — espejo: label → línea → orb
  return (
    <Pressable
      onPress={handlePress}
      hitSlop={6}
      style={{
        position: "absolute",
        top: rowTop,
        left: 0,
        right: width - CHAKRA_ORB_CENTER_X - GLOW_R,
        height: ROW_H,
        flexDirection: "row-reverse",
        alignItems: "center",
      }}
    >
      <Animated.View style={[{ marginRight: GLOW_R - CHAKRA_ORB_SIZE / 2 }, glyphAnimStyle]}>
        <SacredGlyph id={chakra.geometryId} color={chakra.color} size={CHAKRA_ORB_SIZE} />
      </Animated.View>
      <View style={{ width: CHAKRA_LINE_W, height: 1, backgroundColor: chakra.color, opacity: 0.3, marginRight: 4 }} />
      <View style={{ marginRight: 9, alignItems: "flex-end" }}>
        <Text style={{ color: "#FBFBFB", fontFamily: "Manrope", fontSize: 13, fontWeight: "700", textAlign: "right" }}>
          {chakra.name}
        </Text>
        <Text style={{ color: "rgba(255,255,255,0.58)", fontFamily: "Manrope", fontSize: 11, marginTop: 2, textAlign: "right" }}>
          {chakra.subtitle}
        </Text>
      </View>
    </Pressable>
  );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function ExploreScreen() {
  const colors   = useColors();
  const insets   = useSafeAreaInsets();
  const { photoUri } = useUserProfile();
  const { open: openDrawer } = useDrawer();
  const [searchVisible, setSearchVisible] = useState(false);
  const [query, setQuery] = useState("");

  const { isPremium } = usePremium();
  const { playSession, history } = usePlayer();
  const { version: catalogVersion } = useCatalog();
  const { theme: activeTheme, activeSceneId } = useSceneTheme();
  const temaCardBg = activeSceneId === "indigo"
    ? "rgba(255,255,255,0.045)"
    : activeSceneId === "profundo"
      ? "rgba(255,255,255,0.06)"
      : "rgba(255,255,255,0.07)";
  // Rituales para ti — playlists del catálogo (admin, showOnHome)
  const ritualItems = useMemo(
    () =>
      PLAYLISTS.slice(0, 4).map((pl) => ({
        id: pl.id,
        title: pl.title,
        durationLabel: pl.durationLabel,
        image: pl.coverUrl ? { uri: pl.coverUrl } : (pl.cover as number),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [catalogVersion],
  );

  // Animated values para el color de los textos izquierda de cada chakra
  const chakraColorAnims = useRef(CHAKRAS_VISUAL.map(() => new Animated.Value(0))).current;

  const ancestralesSessions  = SESSIONS.filter(s => s.categoryId === "sonidos-ancestrales").slice(0, 10);
  const musicaSessions       = SESSIONS.filter(s => s.categoryId === "musica-sonidos").slice(0, 10);
  const meditacionesSessions = SESSIONS.filter(s => s.categoryId === "meditaciones-guiadas").slice(0, 10);
  const dailyRecs = React.useMemo(() => getDailyRecommendations(5), []);

  // ── Recientes (últimas meditaciones agregadas) ──
  const recientesMeditaciones = React.useMemo(() => {
    return SESSIONS
      .filter((s) => s.categoryId === "meditaciones-guiadas")
      .sort((a, b) => parseInt(b.id) - parseInt(a.id))
      .slice(0, 10);
  }, [catalogVersion]);

  // ── Escuchadas recientemente (historial local, más reciente primero) ──
  const escuchadasRecientemente = React.useMemo(() => {
    const meditIds = new Set(SESSIONS.filter((s) => s.categoryId === "meditaciones-guiadas").map((s) => s.id));
    const seen = new Set<string>();
    const list: Session[] = [];
    for (const entry of history) {
      if (!meditIds.has(entry.sessionId) || seen.has(entry.sessionId)) continue;
      const s = SESSIONS.find((se) => se.id === entry.sessionId);
      if (!s) continue;
      seen.add(entry.sessionId);
      list.push(s);
      if (list.length >= 10) break;
    }
    return list;
  }, [history, catalogVersion]);

  // ── Destacada de hoy (solo meditaciones) ──
  const { data: pinnedFeaturedData } = useGetPinnedFeatured();

  // ── Orden de carruseles desde la API ──
  // null = todavía cargando (no mostrar nada aún)
  // [] o array = respuesta recibida (respetar visibilidad)
  const [exploreSections, setExploreSections] = React.useState<
    { slug: string; label: string; visible: boolean; sortOrder: number }[] | null
  >(null);
  React.useEffect(() => {
    const API_URL = process.env.EXPO_PUBLIC_API_URL ?? "";
    fetch(`${API_URL}/api/explore-sections`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        // Tanto si la API respondió con secciones como con lista vacía,
        // establecer el estado para que el useMemo use la respuesta real.
        setExploreSections(data?.sections ?? []);
      })
      .catch(() => {
        // Si falla la red, tratar como lista vacía (no mostrar nada
        // en lugar de mostrar todas las secciones sin filtrar).
        setExploreSections([]);
      });
  }, []);

  const themeCarousels = React.useMemo(() => {
    // Mientras carga, no mostrar carruseles para evitar el flash de
    // todas las temáticas sin filtrar de visibilidad.
    if (exploreSections === null) return [];

    const sessionLabels: string[] = Array.from(
      new Set<string>(SESSIONS.flatMap((s) => s.themeTag ?? [])),
    ).filter((t) => !isChakraTag(t));

    if (exploreSections.length > 0) {
      const seen = new Set<string>();
      return exploreSections
        .filter((sec) => {
          if (!sec.visible || !sessionLabels.includes(sec.label)) return false;
          if (seen.has(sec.label)) return false;
          seen.add(sec.label);
          return true;
        })
        .map((sec) => ({
          label: sec.label,
          sessions: SESSIONS.filter((s) =>
            (s.themeTag as readonly string[] | undefined)?.includes(sec.label),
          ),
        }));
    }

    // API respondió con lista vacía: no hay configuración → mostrar todas
    // las temáticas locales como fallback solo en este caso.
    const knownOrder = TAG_CARDS.map((tc) => tc.label as string);
    const allTags = [...sessionLabels].sort((a, b) => {
      const ia = knownOrder.indexOf(a);
      const ib = knownOrder.indexOf(b);
      if (ia === -1 && ib === -1) return 0;
      if (ia === -1) return 1;
      if (ib === -1) return -1;
      return ia - ib;
    });
    return allTags.map((tag) => ({
      label: tag,
      sessions: SESSIONS.filter((s) =>
        (s.themeTag as readonly string[] | undefined)?.includes(tag),
      ),
    }));
  }, [catalogVersion, exploreSections]); // eslint-disable-line react-hooks/exhaustive-deps

  const featuredHoy = React.useMemo(() => {
    const pinned = pinnedFeaturedData?.session;
    if (pinned && pinned.categoryId === "meditaciones-guiadas") {
      return getSessionById(pinned.id) ?? undefined;
    }
    const pool = SESSIONS.filter((s) => s.categoryId === "meditaciones-guiadas" && s.isFeatured);
    if (!pool.length) return undefined;
    const now = new Date();
    const start = new Date(now.getFullYear(), 0, 0);
    const dayOfYear = Math.floor((now.getTime() - start.getTime()) / 86_400_000);
    return pool[dayOfYear % pool.length];
  }, [pinnedFeaturedData, catalogVersion]);

  // ── Las más escuchadas (ranking real de GET /catalog/popular) ──
  const { data: popularData } = useGetPopularSessions(
    { limit: 30 },
    { query: { queryKey: getGetPopularSessionsQueryKey({ limit: 30 }), staleTime: 5 * 60_000 } },
  );
  const masEscuchadasMeditaciones = React.useMemo(() => {
    const ids = (popularData?.sessions ?? []).map((s) => s.id);
    return ids
      .map((id) => SESSIONS.find((s) => s.id === id))
      .filter((s): s is Session => !!s && s.categoryId === "meditaciones-guiadas")
      .slice(0, 10);
  }, [popularData, catalogVersion]);

  const topPad    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;


  function handleSessionPress(s: Session) {
    const locked = s.isPremium && !isPremium;
    if (locked) { router.push("/membresia" as never); return; }
    if (s.skipMiniPlayer) { playSession(s); return; }
    if (s.skipDetail) { playSession(s); router.push("/player" as never); return; }
    router.push(`/session/${s.id}` as never);
  }

  function renderCarousel(title: string, sessions: Session[], categoryRoute: string, contentPaddingTop = 0) {
    return (
      <View style={styles.section} key={title}>
        <Pressable
          onPress={() => router.push(categoryRoute as never)}
          style={({ pressed }) => [styles.sectionRow, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>{title}</Text>
          <Feather name="chevron-right" size={18} color="#c2c2c2" />
        </Pressable>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -H_PAD }}
          contentContainerStyle={[styles.carouselContent, contentPaddingTop > 0 && { paddingTop: contentPaddingTop }]}
        >
          {sessions.map((s) => (
            <Pressable
              key={s.id}
              onPress={() => handleSessionPress(s)}
              style={({ pressed }) => [styles.sqCard, { opacity: pressed ? 0.82 : 1 }]}
            >
              <View style={styles.sqImageWrap}>
                <Image
                  source={s.image as number}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                  placeholder={BLUR_PLACEHOLDER}
                  transition={IMAGE_TRANSITION}
                  cachePolicy="memory-disk"
                />
                {s.isPremium && (
                  <View style={styles.premiumBadge}>
                    <Feather name="star" size={10} color="#F7CB6B" />
                  </View>
                )}
              </View>
              <Text style={[styles.sqTitle, { color: "#FBFBFB" }]} numberOfLines={2}>
                {s.title}
              </Text>
              <Text style={[styles.sqAuthor, { color: "#c2c2c2" }]} numberOfLines={1}>
                {getSessionAuthor(s)}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: activeTheme.gradient[0] as string }]}>
      <LinearGradient colors={activeTheme.gradient} style={styles.rootGradient} />
      <StatusBar hidden />

      {/* ── Header fijo — título + barra de búsqueda sticky ── */}
      <View style={[styles.fixedHeader, { paddingTop: topPad + 2 }]}>
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Descubrir</Text>
        </View>
        {/* Barra de búsqueda pegada al header */}
        <Pressable style={styles.searchWrap} onPress={() => setSearchVisible(true)}>
          <View style={[styles.searchBox, { backgroundColor: "rgba(0,0,0,0.2)", borderColor: "rgba(255,255,255,0.7)", borderWidth: 1 }]} pointerEvents="none">
            <Feather name="search" size={16} color="#F9F9F9" />
            <Text style={[styles.searchInput, { color: "#F9F9F9", flex: 1 }]} numberOfLines={1}>
              Titulo, voz guía, artista o tema
            </Text>
          </View>
        </Pressable>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 160 + bottomPad, paddingTop: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Para este momento ── */}
        {featuredHoy && (
          <View style={[styles.section, { marginBottom: 0, marginTop: 10 }]}>
            <Text style={styles.sectionTitle}>Para este momento</Text>
            <Pressable
              onPress={() => {
                if (featuredHoy.skipMiniPlayer) { handleSessionPress(featuredHoy); return; }
                if (featuredHoy.skipDetail) { handleSessionPress(featuredHoy); return; }
                handleSessionPress(featuredHoy);
              }}
            >
              <View style={styles.heroImageContainer}>
                <Image source={featuredHoy.image as number} style={styles.heroImage} contentFit="cover" />
              </View>
              {(() => {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const s = featuredHoy as any;
                const guide  = s.guideId  ? getGuide(s.guideId)   : undefined;
                const artist = s.artistId ? getArtist(s.artistId) : undefined;
                const heroAuthorName = guide?.name ?? artist?.name ?? "Casa del Cuenco";
                const heroPhoto      = guide?.photo ?? artist?.photo ?? null;
                return (
                  <View style={{ marginTop: 12, flexDirection: "row", alignItems: "center", gap: 10 }}>
                    {heroPhoto && (
                      <Image source={heroPhoto} style={styles.heroAvatar} contentFit="cover" />
                    )}
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.heroAuthor, { marginBottom: 4 }]} numberOfLines={1}>
                        {featuredHoy.categoryLabel}{featuredHoy.durationLabel ? ` · ${featuredHoy.durationLabel}` : ""}
                      </Text>
                      <Text style={styles.heroTitle} numberOfLines={2}>{featuredHoy.title}</Text>
                      <Text style={[styles.heroAuthor, { marginTop: -1 }]} numberOfLines={1}>{heroAuthorName}</Text>
                    </View>
                  </View>
                );
              })()}
            </Pressable>
          </View>
        )}

        {/* ── Explorar todo ── */}
        <View style={[styles.section, { marginBottom: SECTION_GAP, marginTop: SECTION_GAP }]}>
          <Text style={styles.sectionTitle}>Explorar todo</Text>
          <View style={styles.temaGrid}>
            {TEMAS.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => router.push((t.route ?? `/tema/${t.id}`) as never)}
                style={({ pressed }) => [
                  styles.temaCell,
                  { width: TEMA3_W, height: TEMA3_W, backgroundColor: "rgba(255,255,255,0.03)", opacity: pressed ? 0.75 : 1 },
                ]}
              >
                {t.image ? (
                  <Image source={t.image as number} style={styles.temaCellIcon} contentFit="contain" />
                ) : (
                  <MaterialCommunityIcons name={t.icon} size={26} color={t.color} />
                )}
                <Text style={[styles.temaCellLabel, { color: "#FBFBFB" }]}>{t.label}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* ── ¿Cuánto tiempo tienes hoy? ── */}
        <View style={[styles.section, { marginBottom: SECTION_GAP, marginTop: SECTION_GAP }]}>
          <Text style={styles.sectionTitle}>¿Cuánto tiempo tienes hoy?</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -H_PAD }}
            contentContainerStyle={{ paddingHorizontal: H_PAD, gap: 10 }}
          >
            {DURATION_SLOTS.map((slot) => (
              <Pressable
                key={slot.label}
                onPress={() => router.push(`/busqueda?tiempo=${encodeURIComponent(slot.label)}` as never)}
                style={({ pressed }) => [styles.durPill, { opacity: pressed ? 0.75 : 1 }]}
              >
                <Text style={styles.durPillText}>{slot.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* ── Para la ansiedad (antes de chakras) ── */}
        {(() => {
          const tc = themeCarousels.find((c) => c.label === "Para la ansiedad");
          if (!tc) return null;
          return (
            <SessionCarousel
              title={tc.label}
              sessions={tc.sessions}
              isPremium={isPremium}
              onPress={(s) => handleSessionPress(s)}
              style={{ marginTop: 0, marginBottom: SECTION_GAP }}
              cardWidth={299}
              cardHeight={187}
              titleSize={20}
            />
          );
        })()}

        {/* ── Chakras ── */}
        <View style={{ marginTop: 0, marginBottom: SECTION_GAP }}>
          {/* Título encima */}
          <View style={{ paddingHorizontal: H_PAD, marginTop: 7, marginBottom: 21 }}>
            <Text style={{ fontFamily: "Manrope", fontSize: 22, fontWeight: "700", color: "#FBFBFB" }}>
              Tus chakras, tu energía
            </Text>
            <Text style={{ fontFamily: "Manrope", fontSize: 13, color: "rgba(255,255,255,0.58)", marginTop: 3, lineHeight: 19 }}>
              Selecciona un chakra para comenzar tu armonización.
            </Text>
          </View>

          {/* Panel de orbs — ancho completo para que CHAKRA_ORB_CENTER_X calce */}
          <View style={{ width, height: CHAKRA_PANEL_H + 25, position: "relative" }}>
            {/* Fondo redondeado inset */}
            <View style={{
              position: "absolute",
              top: 0, bottom: 0,
              left: H_PAD, right: H_PAD,
              backgroundColor: "rgba(255,255,255,0.024)",
              borderRadius: 25,
              borderWidth: 1,
              borderColor: "rgba(255,255,255,0.07)",
              overflow: "hidden",
            }}>
              {/* Aurora iridiscente — blobs radiales muy sutiles */}
              <Svg width="100%" height="100%" style={StyleSheet.absoluteFill} pointerEvents="none">
                <Defs>
                  {/* Colores de los 7 chakras, corona (arriba) → raíz (abajo) */}
                  <RadialGradient id="aurCorona" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor="#A776D6" stopOpacity={0.20} />
                    <Stop offset="100%" stopColor="#A776D6" stopOpacity={0} />
                  </RadialGradient>
                  <RadialGradient id="aurTercerOjo" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor="#6F68B6" stopOpacity={0.20} />
                    <Stop offset="100%" stopColor="#6F68B6" stopOpacity={0} />
                  </RadialGradient>
                  <RadialGradient id="aurGarganta" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor="#5998BB" stopOpacity={0.18} />
                    <Stop offset="100%" stopColor="#5998BB" stopOpacity={0} />
                  </RadialGradient>
                  <RadialGradient id="aurCorazon" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor="#60A186" stopOpacity={0.18} />
                    <Stop offset="100%" stopColor="#60A186" stopOpacity={0} />
                  </RadialGradient>
                  <RadialGradient id="aurPlexo" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor="#DFC26B" stopOpacity={0.17} />
                    <Stop offset="100%" stopColor="#DFC26B" stopOpacity={0} />
                  </RadialGradient>
                  <RadialGradient id="aurSacro" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor="#DE9363" stopOpacity={0.17} />
                    <Stop offset="100%" stopColor="#DE9363" stopOpacity={0} />
                  </RadialGradient>
                  <RadialGradient id="aurRaiz" cx="50%" cy="50%" r="50%">
                    <Stop offset="0%" stopColor="#C65860" stopOpacity={0.17} />
                    <Stop offset="100%" stopColor="#C65860" stopOpacity={0} />
                  </RadialGradient>
                </Defs>
                <Ellipse cx="20%" cy="4%"  rx="55%" ry="34%" fill="url(#aurCorona)" />
                <Ellipse cx="85%" cy="18%" rx="52%" ry="34%" fill="url(#aurTercerOjo)" />
                <Ellipse cx="14%" cy="34%" rx="52%" ry="34%" fill="url(#aurGarganta)" />
                <Ellipse cx="86%" cy="50%" rx="52%" ry="34%" fill="url(#aurCorazon)" />
                <Ellipse cx="14%" cy="66%" rx="52%" ry="34%" fill="url(#aurPlexo)" />
                <Ellipse cx="86%" cy="82%" rx="52%" ry="34%" fill="url(#aurSacro)" />
                <Ellipse cx="30%" cy="98%" rx="55%" ry="34%" fill="url(#aurRaiz)" />
              </Svg>
            </View>
            {CHAKRA_LEFT_LABELS.map((label, i) => {
              const rowTop = Math.round(CHAKRA_TOP_PCTS[i] * CHAKRA_PANEL_H) - ROW_H / 2;
              const animColor = chakraColorAnims[i].interpolate({
                inputRange: [0, 1],
                outputRange: ["rgba(249,249,249,0.5)", CHAKRAS_VISUAL[i].color],
              });
              return (
                <View key={`lbl-${i}`} style={{
                  position: "absolute",
                  top: rowTop,
                  left: H_PAD + 8,
                  right: width - CHAKRA_ORB_CENTER_X + 62,
                  height: ROW_H,
                  justifyContent: "center",
                  alignItems: "flex-end",
                }}>
                  <Animated.Text style={{ color: animColor, fontFamily: "Manrope", fontSize: 11, textAlign: "right" }}>
                    {label}
                  </Animated.Text>
                </View>
              );
            })}
            {CHAKRAS_VISUAL.map((c, i) => (
              <ChakraBodyRow key={c.id} chakra={c} topPct={CHAKRA_TOP_PCTS[i]} side="right" colorAnim={chakraColorAnims[i]} />
            ))}
          </View>
        </View>


        {/* ── Energiza tus mañanas + Foco y concentración (antes de chakras) ── */}
        {["Energiza tus mañanas", "Foco y concentración"].map((label) => {
          const tc = themeCarousels.find((c) => c.label === label);
          if (!tc) return null;
          return (
            <SessionCarousel
              key={tc.label}
              title={tc.label}
              sessions={tc.sessions}
              isPremium={isPremium}
              onPress={(s) => handleSessionPress(s)}
              style={{ marginTop: 0, marginBottom: SECTION_GAP }}
              cardWidth={SQCARD_W}
              titleSize={20}
            />
          );
        })}

        {/* ── Carruseles por temática ── */}
        {themeCarousels.length > 0 && (
          <>
            {themeCarousels
              .filter((tc) =>
                tc.label !== "Para la ansiedad" &&
                tc.label !== "Energiza tus mañanas" &&
                tc.label !== "Foco y concentración")
              .map((tc) => (
                <SessionCarousel
                  key={tc.label}
                  title={tc.label}
                  sessions={tc.sessions}
                  isPremium={isPremium}
                  onPress={(s) => handleSessionPress(s)}
                  style={{ marginTop: 0, marginBottom: SECTION_GAP }}
                  cardWidth={SQCARD_W}
                  titleSize={20}
                />
              ))}
            <>
                      {/* ── Otras temáticas ── */}
                      <View style={[styles.section, { marginBottom: SECTION_GAP }]}>
                        <Pressable
                          onPress={() => router.push("/todas-las-tematicas" as never)}
                          style={({ pressed }) => [styles.sectionRow, { opacity: pressed ? 0.7 : 1 }]}
                        >
                          <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Otras temáticas</Text>
                          <Feather name="chevron-right" size={18} color="#c2c2c2" />
                        </Pressable>
                        <View style={styles.tagGrid}>
                          {TAG_CARDS.filter((t) => !themeCarousels.some((tc) => tc.label === t.label)).slice(0, 8).map((tag) => (
                            <Pressable
                              key={tag.id}
                              onPress={() => router.push(`/tag/${tag.id}` as never)}
                              style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1, width: TAG_CARD_W - 4 }]}
                            >
                              <View style={styles.tagCard}>
                                <Image
                                  source={tag.image}
                                  style={StyleSheet.absoluteFill}
                                  contentFit="cover"
                                  cachePolicy="memory-disk"
                                />
                              </View>
                              <Text style={styles.tagCardLabel} numberOfLines={2}>{tag.label}</Text>
                            </Pressable>
                          ))}
                        </View>
                      </View>

            </>
          </>
        )}

        {/* ── Descubre algo nuevo (al final de la página) — oculta a pedido del usuario ── */}
        {false && (
        <View style={[styles.section, { marginBottom: SECTION_GAP }]}>
          <Text style={styles.sectionTitle}>Descubre algo nuevo</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={{ marginHorizontal: -H_PAD }}
            contentContainerStyle={{ paddingHorizontal: H_PAD, gap: 10 }}
          >
            {([
              ["Cuencos", "Meditaciones"],
              ["Energízate", "Gongs"],
              ["Rituales", "Paisajes sonoros"],
            ] as [string, string][]).map(([top, bottom]) => (
              <View key={top} style={{ gap: 10 }}>
                {[top, bottom].map((label) => (
                  <View
                    key={label}
                    style={{
                      width: 148,
                      height: 70,
                      backgroundColor: "rgba(247,203,107,0.05)",
                      borderRadius: 12,
                      borderWidth: 2,
                      borderColor: "rgba(255,255,255,0.7)",
                      justifyContent: "center",
                      alignItems: "center",
                    }}
                  >
                    <Text style={{ fontFamily: "Manrope", fontSize: 13, fontWeight: "600", color: "#F9F9F9", textAlign: "center" }}>
                      {label}
                    </Text>
                  </View>
                ))}
              </View>
            ))}
          </ScrollView>
        </View>
        )}
      </ScrollView>

      <SearchOverlay visible={searchVisible} onClose={() => setSearchVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: "#210911" },
  rootGradient: { ...StyleSheet.absoluteFillObject },
  scroll: { flex: 1 },

  fixedHeader:  { zIndex: 10 },
  titleRow:     { alignItems: "stretch", paddingHorizontal: 19, paddingBottom: 10, paddingTop: 7 },
  header:       { paddingHorizontal: H_PAD, marginBottom: 0 },
  headerRow:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pageTitle:    { fontFamily: "Manrope", fontSize: 27, fontWeight: "700", letterSpacing: 0.3, color: "#F4F4F4", textAlign: "center", marginTop: 0, transform: [{ translateY: 1 }] },
  searchWrap:   { paddingHorizontal: H_PAD, paddingTop: 16, paddingBottom: 15 },
  searchBox:    { flexDirection: "row" as "row", alignItems: "center" as "center", gap: 10, borderRadius: 999, borderWidth: 1.5, paddingHorizontal: 18, height: 45 },
  searchInput:  { fontFamily: "Manrope", flex: 1, fontSize: 15, fontWeight: "300", padding: 0 },
  pageSubtitle: { fontFamily: "Manrope", fontSize: 14, color: "#F4F4F4", marginTop: 2 },

  section:      { paddingHorizontal: H_PAD, marginBottom: SECTION_GAP },

  sectionRow:   { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 21 },
  sectionTitle: { fontFamily: "Manrope", fontSize: 20, fontWeight: "700", letterSpacing: 0.3, color: "#FBFBFB", marginBottom: 21 },
  // Rituales para ti
  ritualGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 14,
  },
  ritualCard: {
    width: (width - H_PAD * 2 - 14) / 2,
    borderRadius: 14,
    overflow: "hidden",
  },
  ritualImage: {
    width: "100%",
    aspectRatio: 1.35,
  },
  ritualTextWrap: {
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  ritualTitle: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "600",
    color: "#FBFBFB",
    lineHeight: 19,
  },
  ritualSub: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "400",
    color: "rgba(255,255,255,0.60)",
    marginTop: 3,
  },

  // Recomendado para ti
  recoSection: {
    paddingHorizontal: H_PAD,
    marginBottom: SECTION_GAP,
  },
  recoSub: {
    fontFamily: "Manrope",
    fontSize: 12,
    marginBottom: 14,
    marginTop: 2,
  },
  recoList: {
    gap: 6,
  },
  recoDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginHorizontal: 4,
  },

  // Carrusel cuadrado
  carouselContent: {
    paddingHorizontal: H_PAD,
    gap: GAP,
    paddingBottom: 4,
  },
  sqCard: {
    width: SQCARD_W,
  },
  sqImageWrap: {
    width: SQCARD_W,
    height: SQCARD_W,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "rgba(74,12,12,0.08)",
  },
  premiumBadge: {
    position: "absolute",
    top: 7,
    right: 7,
    backgroundColor: "rgba(6,10,15,0.72)",
    borderRadius: 10,
    padding: 4,
  },
  sqTitle: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 10,
  },
  // Hero — sesión destacada del día
  heroImageContainer: {
    width: "100%",
    height: HERO_HEIGHT,
    borderRadius: 15,
    overflow: "hidden",
  },
  heroImage: { width: "100%", height: "100%" },
  heroMetaText: { fontFamily: "Manrope", fontSize: 11, lineHeight: 14, color: "#c2c2c2", marginBottom: 6 },
  heroTitle: { fontFamily: "Manrope", fontSize: 18, fontWeight: "600", lineHeight: 24, color: "#FBFBFB", marginBottom: 4 },
  heroAuthor: { fontFamily: "Manrope", fontSize: 12, color: "#c2c2c2", marginTop: 2 },
  heroAvatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.05)" },

  sqAuthor: {
    fontFamily: "Manrope",
    fontSize: 11,
    marginTop: 3,
  },

  // Hero: Vuelve a ti
  introHeroContainer: {
    width: "100%",
    aspectRatio: 1536 / 1024,
    borderRadius: 15,
    overflow: "hidden",
    justifyContent: "center",
  },
  introHeroImage: { ...StyleSheet.absoluteFillObject },
  introHeroTextWrap: {
    paddingHorizontal: 20,
  },
  introHeroTitle: {
    fontFamily: "Manrope",
    fontSize: 26,
    fontWeight: "700",
    color: "#FBFBFB",
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  introHeroSubtitle: {
    fontFamily: "Manrope",
    fontSize: 14,
    color: "rgba(244,218,213,0.75)",
  },

  // Pills de duración → /busqueda
  durPill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    minWidth: 80,
    height: 42,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  durPillText: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "600",
    color: "#FBFBFB",
    letterSpacing: 0.2,
    marginTop: -3,
  },

  // Ejercicios de respiración
  breathingRow: {
    paddingHorizontal: H_PAD,
    gap: 12,
    paddingBottom: 4,
  },
  breathingCard: {
    width: 132,
    alignItems: "center",
    borderRadius: 16,
    paddingVertical: 18,
    paddingHorizontal: 10,
    backgroundColor: "rgba(190,150,80,0.05)",
  },
  breathingIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(190,150,80,0.12)",
    marginBottom: 10,
  },
  breathingName: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "700",
    color: "#FBFBFB",
    marginBottom: 3,
  },
  breathingDesc: {
    fontFamily: "Manrope",
    fontSize: 12,
    color: "#c2c2c2",
    textAlign: "center",
  },

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
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 17,
  },

  // Otras temáticas — grilla 2×4
  tagGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 25,
    marginTop: 0,
  },
  tagCard: {
    width: TAG_CARD_W - 4,
    height: 115,
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "rgba(74,12,12,0.08)",
  },
  tagCardOverlay: {},
  tagCardLabel: {
    marginTop: 7,
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "700",
    color: "#FBFBFB",
    lineHeight: 17,
  },

});
