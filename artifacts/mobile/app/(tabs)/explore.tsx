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
import { SacredBackground } from "@/components/SacredBackground";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { SessionCard } from "@/components/SessionCard";
import { SESSIONS, getSessionById } from "@/data/sessions";
import { getArtist } from "@/data/artists";
import { getGuide } from "@/data/guides";
import { TEMAS } from "@/data/temas";
import { TAG_CARDS } from "@/data/tags";
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
const TEMA_COL_W = Math.floor((width - H_PAD * 2 - GAP) / 2);
const TEMA3_W    = Math.floor((width - H_PAD * 2 - TEMA_GAP * 2) / 3);

const CAT_CARD_GAP = 16;
const CAT_CARD_W = Math.round(((width - H_PAD * 2 - CAT_CARD_GAP) / 2.2 - 30) * 1.625);
const HERO_HEIGHT = 320;

const BREATHING_EXERCISES = [
  { id: "478", name: "4-7-8", subtitle: "Calma y sueño" },
  { id: "box", name: "Cuadrada", subtitle: "Foco y equilibrio" },
  { id: "coherence", name: "Coherencia", subtitle: "Equilibrio cardíaco" },
] as const;

type Session = (typeof SESSIONS)[number];

const DURATION_SLOTS = [
  { label: "5 min",   min: 0,  max: 5  },
  { label: "10 min",  min: 6,  max: 10 },
  { label: "20 min",  min: 11, max: 25 },
  { label: "30 min",  min: 26, max: 35 },
  { label: "60 min",  min: 36, max: Infinity },
] as const;
type DurSlot = (typeof DURATION_SLOTS)[number]["label"];
const DUR_PILL_W = Math.round((width - H_PAD * 2 - 6 * 4) / 4.3);

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
            <Feather name="search" size={16} color="rgba(242,231,228,0.45)" />
            <TextInput
              ref={inputRef}
              style={srStyles.input}
              placeholder="Buscar sesiones, músicas, sonidos..."
              placeholderTextColor="rgba(242,231,228,0.45)"
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
  bar:         { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.09)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11 },
  input:       { flex: 1, fontSize: 14, color: "#FBFBFB" },
  cancel:      { paddingVertical: 6 },
  cancelText:  { color: "#F7CB6B", fontSize: 14, fontWeight: "600" },
  empty:       { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingTop: 60 },
  emptyTitle:  { fontSize: 18, fontWeight: "700", color: "#FBFBFB", textAlign: "center", marginBottom: 10 },
  emptySub:    { fontSize: 14, color: "rgba(242,231,228,0.45)", textAlign: "center", lineHeight: 20 },
  resultRow:   { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 5 },
  thumb:       { width: 75, height: 75, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.025)" },
  resultCat:   { fontSize: 12, color: "rgba(242,231,228,0.45)", marginBottom: 3 },
  resultTitle: { fontSize: 15, fontWeight: "700", color: "#FBFBFB", marginBottom: 3 },
  resultAuthor:{ fontSize: 12, color: "rgba(242,231,228,0.45)" },
});

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
  const { theme: activeTheme } = useSceneTheme();

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

  // ¿Cuánto tiempo tienes hoy?
  const [selectedDur, setSelectedDur] = useState<DurSlot | null>(null);
  const [durSort, setDurSort] = useState<"recientes" | "populares">("recientes");
  const durationSessions = React.useMemo(() => {
    if (!selectedDur) return [];
    const slot = DURATION_SLOTS.find((s) => s.label === selectedDur)!;
    const list = SESSIONS.filter((s) => s.duration >= slot.min && s.duration <= slot.max);
    if (durSort === "recientes") {
      return [...list].sort((a, b) => parseInt(b.id) - parseInt(a.id));
    }
    return list;
  }, [selectedDur, durSort]);

  const topPad    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;


  function handleSessionPress(s: Session) {
    const locked = s.isPremium && !isPremium;
    if (locked) { router.push("/membresia" as never); return; }
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
      <StatusBar barStyle="light-content" />

      {/* ── Header fijo — igual que Perfil ── */}
      <View style={[styles.fixedHeader, { paddingTop: topPad }]}>
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Explorar</Text>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 160 + bottomPad, paddingTop: 4 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >

        {/* ── Barra de búsqueda ── */}
        <View style={styles.searchWrap}>
          <BlurView intensity={28} tint="dark" style={[styles.searchBox, { overflow: "hidden", borderColor: "rgba(255,255,255,0.22)", borderWidth: 1 }]}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255,255,255,0.07)" }]} />
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Titulo, voz guía, artista o tema"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.searchInput, { color: colors.foreground }]}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <Feather name="x-circle" size={15} color={colors.mutedForeground} />
              </Pressable>
            )}
          </BlurView>
        </View>

        {/* ── Para este momento ── */}
        {featuredHoy && (
          <View style={[styles.section, { marginBottom: SECTION_GAP, marginTop: 26 }]}>
            <Text style={[styles.sectionTitle, { marginBottom: 24 }]}>Para este momento</Text>
            <Pressable onPress={() => handleSessionPress(featuredHoy)}>
              <View style={styles.heroImageContainer}>
                <Image source={featuredHoy.image as number} style={styles.heroImage} contentFit="cover" />
              </View>
              <View style={{ marginTop: 12 }}>
                <Text style={styles.heroMetaText}>
                  {featuredHoy.categoryLabel} · {featuredHoy.durationLabel}
                </Text>
                <Text style={styles.heroTitle} numberOfLines={2}>{featuredHoy.title}</Text>
                <Text style={styles.heroAuthor} numberOfLines={1}>{getSessionAuthor(featuredHoy)}</Text>
              </View>
            </Pressable>
          </View>
        )}

            {/* ── Explorar todo (TEMAS) ── */}
            <View style={[styles.section, { marginBottom: SECTION_GAP, marginTop: 0 }]}>
              <View style={[styles.temaGrid, { marginTop: 0 }]}>
                {TEMAS.map((t) => (
                  <Pressable
                    key={t.id}
                    onPress={() => router.push((t.route ?? `/tema/${t.id}`) as never)}
                    style={[styles.temaCell, { width: TEMA3_W, height: TEMA3_W, borderRadius: 11, overflow: "hidden", borderColor: "rgba(255,255,255,0.22)", borderWidth: 1 }]}
                  >
                    {({ pressed }) => (
                      <>
                        <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
                        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255,255,255,0.07)" }]} />
                        {pressed && <View style={[StyleSheet.absoluteFill, { backgroundColor: hexTint(t.color, 0.22) }]} />}
                        {t.image != null ? (
                          <Image
                            source={t.image}
                            style={styles.temaCellIcon}
                            contentFit="contain"
                          />
                        ) : (
                          <MaterialCommunityIcons name={t.icon} size={28} color={t.color} />
                        )}
                        <Text style={[styles.temaCellLabel, { color: "#FBFBFB" }]} numberOfLines={2}>
                          {t.label}
                        </Text>
                      </>
                    )}
                  </Pressable>
                ))}
              </View>
            </View>

            {/* ── ¿Cuánto tiempo tienes hoy? ── */}
            <View style={[styles.durSection, { marginTop: 0, marginBottom: SECTION_GAP }]}>
              <Text style={[styles.sectionTitle, { marginBottom: 24 }]}>
                ¿Cuánto tiempo tienes hoy?
              </Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.durPillRow}
              >
                {DURATION_SLOTS.map((slot) => {
                  const sel = selectedDur === slot.label;
                  return (
                    <Pressable
                      key={slot.label}
                      onPress={() => setSelectedDur(sel ? null : slot.label)}
                      style={({ pressed }) => [
                        styles.durPill,
                        sel && styles.durPillActive,
                        { opacity: pressed ? 0.75 : 1 },
                      ]}
                    >
                      {sel && (
                        <LinearGradient
                          colors={["#D6A45C", "#F7CB6B"]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 0, y: 1 }}
                          style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
                        />
                      )}
                      <Text
                        style={[styles.durPillText, sel && styles.durPillTextActive]}
                        numberOfLines={1}
                        adjustsFontSizeToFit
                        minimumFontScale={0.7}
                      >
                        {slot.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>

              {selectedDur && (
                <View style={styles.durResults}>
                  {/* Filtro de orden */}
                  <View style={styles.durSortRow}>
                    <Pressable onPress={() => setDurSort("recientes")}>
                      <Text style={[styles.durSortOption, durSort === "recientes" && styles.durSortActive]}>
                        Recientes
                      </Text>
                    </Pressable>
                    <Text style={styles.durSortSep}>·</Text>
                    <Pressable onPress={() => setDurSort("populares")}>
                      <Text style={[styles.durSortOption, durSort === "populares" && styles.durSortActive]}>
                        Más escuchadas
                      </Text>
                    </Pressable>
                  </View>
                  {durationSessions.length === 0 ? (
                    <Text style={[styles.durEmpty, { color: "#c2c2c2" }]}>
                      Sin sesiones para este rango
                    </Text>
                  ) : (
                    durationSessions.map((s, i) => (
                      <React.Fragment key={s.id}>
                        {i > 0 && <View style={styles.recoDivider} />}
                        <SessionCard session={s} horizontal />
                      </React.Fragment>
                    ))
                  )}
                </View>
              )}
            </View>




            {/* ── Las más escuchadas ── */}
            {masEscuchadasMeditaciones.length > 0 &&
              renderCarousel("Las más escuchadas", masEscuchadasMeditaciones, "/category/meditaciones-guiadas")}

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
  titleRow:     { alignItems: "center", paddingHorizontal: 15, paddingBottom: 10, paddingTop: 6 },
  header:       { paddingHorizontal: H_PAD, marginBottom: 0 },
  headerRow:    { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pageTitle:    { fontSize: 18, fontWeight: "700", letterSpacing: 0.3, color: "#F4F4F4", textAlign: "center", marginTop: 10 },
  searchWrap:   { paddingHorizontal: H_PAD, paddingTop: 13, paddingBottom: 8 },
  searchBox:    { flexDirection: "row" as "row", alignItems: "center" as "center", gap: 10, borderRadius: 999, borderWidth: 1.5, paddingHorizontal: 18, height: 45 },
  searchInput:  { flex: 1, fontSize: 15, fontWeight: "300", padding: 0 },
  pageSubtitle: { fontSize: 14, color: "#F4F4F4", marginTop: 2 },

  section:      { paddingHorizontal: H_PAD, marginBottom: SECTION_GAP },
  sectionRow:   { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: "600", letterSpacing: 0.5, color: "#FBFBFB", marginBottom: 24 },

  // Recomendado para ti
  recoSection: {
    paddingHorizontal: H_PAD,
    marginBottom: SECTION_GAP,
  },
  recoSub: {
    fontSize: 12,
    marginBottom: 14,
    marginTop: 2,
  },
  recoList: {
    gap: 6,
  },
  recoDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
    marginHorizontal: 4,
  },

  // ¿Cuánto tiempo tienes hoy?
  durSection: {
    paddingHorizontal: H_PAD,
    marginBottom: SECTION_GAP,
  },
  durPillRow: {
    flexDirection: "row",
    paddingHorizontal: 0,
    paddingRight: DUR_PILL_W * 0.3,
    gap: 6,
    paddingBottom: 2,
  },
  durPill: {
    borderRadius: 20,
    paddingHorizontal: 10,
    minWidth: 76,
    height: 38,
    backgroundColor: "rgba(255,255,255,0.11)",
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  durPillActive: {
    borderColor: "transparent",
  },
  durPillText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FBFBFB",
    letterSpacing: 0.2,
  },
  durPillTextActive: {
    color: "#1B060F",
  },
  durResults: {
    marginTop: 16,
    marginHorizontal: H_PAD,
    gap: 6,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 15,
    padding: 12,
  },
  durSortRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  durSortOption: {
    fontSize: 13,
    fontWeight: "500",
    color: "#c2c2c2",
  },
  durSortActive: {
    color: "#F7CB6B",
    fontWeight: "700",
  },
  durSortSep: {
    fontSize: 13,
    color: "#c2c2c2",
  },
  durEmpty: {
    fontSize: 13,
    textAlign: "center",
    paddingVertical: 16,
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
  heroMetaText: { fontSize: 11, lineHeight: 14, color: "#c2c2c2", marginBottom: 6 },
  heroTitle: { fontSize: 18, fontWeight: "600", lineHeight: 24, color: "#FBFBFB", marginBottom: 4 },
  heroAuthor: { fontSize: 12, color: "#c2c2c2", marginTop: 2 },

  sqAuthor: {
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
    fontSize: 26,
    fontWeight: "700",
    color: "#FBFBFB",
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  introHeroSubtitle: {
    fontSize: 14,
    color: "rgba(244,218,213,0.75)",
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
    fontSize: 15,
    fontWeight: "700",
    color: "#FBFBFB",
    marginBottom: 3,
  },
  breathingDesc: {
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
    fontSize: 13,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 17,
  },

  // Otras temáticas
  tagCard: {
    width: CAT_CARD_W,
  },
  tagCardImage: {
    width: CAT_CARD_W,
    height: Math.round(CAT_CARD_W * 1.25),
    borderRadius: 15,
    overflow: "hidden",
    backgroundColor: "rgba(74,12,12,0.08)",
  },
  tagCardOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 10,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  tagCardLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FBFBFB",
    lineHeight: 17,
  },

});
