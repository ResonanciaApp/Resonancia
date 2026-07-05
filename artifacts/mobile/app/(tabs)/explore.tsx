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

import { LinearGradient } from "expo-linear-gradient";
import { SacredBackground } from "@/components/SacredBackground";
import { CommunityMixesCarousel } from "@/components/CommunityMixesCarousel";
import { SessionCard } from "@/components/SessionCard";
import { SESSIONS } from "@/data/sessions";
import { getArtist } from "@/data/artists";
import { getGuide } from "@/data/guides";
import { TEMAS } from "@/data/temas";
import { TAG_CARDS } from "@/data/tags";
import { usePremium } from "@/context/PremiumContext";
import { usePlayer } from "@/context/PlayerContext";
import { useColors } from "@/hooks/useColors";
import { useDrawer } from "@/context/DrawerContext";
import { useUserProfile } from "@/context/UserProfileContext";

const { width } = Dimensions.get("window");
const H_PAD = 15;
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

type Session = (typeof SESSIONS)[number];

const RITUAL_GRID_PAD = H_PAD;
const RITUAL_CARD_W   = width - RITUAL_GRID_PAD * 2;
const RITUAL_IMG_H    = Math.round(RITUAL_CARD_W * (9 / 16));

const DURACION_OPTS_EX = [
  { label: "Todos",  min: 0,  max: Infinity },
  { label: "5 min",  min: 0,  max: 5        },
  { label: "10 min", min: 6,  max: 10       },
  { label: "15 min", min: 11, max: 15       },
  { label: "20 min", min: 16, max: 25       },
  { label: "30 min", min: 26, max: 60       },
] as const;
type DurOptEx = (typeof DURACION_OPTS_EX)[number]["label"];

const DURATION_SLOTS = [
  { label: "5 min",   min: 0,  max: 5  },
  { label: "10 min",  min: 6,  max: 10 },
  { label: "20 min",  min: 11, max: 25 },
  { label: "30 min",  min: 26, max: 35 },
  { label: "60 min",  min: 36, max: Infinity },
] as const;
type DurSlot = (typeof DURATION_SLOTS)[number]["label"];
const DUR_PILL_W = Math.round((width - H_PAD * 2 - 6 * 4) / 4.3);

function ExpRitualCard({ session, onPress }: { session: Session; onPress: () => void }) {
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
      <View style={{ width: RITUAL_CARD_W, height: RITUAL_IMG_H, borderRadius: 13, overflow: "hidden", marginBottom: 10, backgroundColor: "rgba(255,255,255,0.025)" }}>
        <Image source={session.image as never} style={{ width: RITUAL_CARD_W, height: RITUAL_IMG_H }} contentFit="cover" />
      </View>
      <View style={exStyles.ritualMeta}>
        <Text style={exStyles.ritualMetaText}>{session.categoryLabel}</Text>
        <Text style={exStyles.ritualDot}>·</Text>
        <Text style={exStyles.ritualMetaText}>{session.durationLabel}</Text>
      </View>
      <Text style={exStyles.ritualTitle} numberOfLines={2}>{session.title}</Text>
      <Text style={exStyles.ritualAuthor} numberOfLines={1}>{author}</Text>
    </Pressable>
  );
}

const exStyles = StyleSheet.create({
  ritualMeta:     { flexDirection: "row", alignItems: "center", marginBottom: 5, flexWrap: "wrap" },
  ritualStar:     { fontSize: 12, color: "#D4AF37", marginRight: 5 },
  ritualDot:      { fontSize: 12, color: "rgba(255,255,255,0.35)", marginRight: 5 },
  ritualMetaText: { fontSize: 12, color: "rgba(255,255,255,0.55)" },
  ritualTitle:    { fontSize: 16, fontWeight: "700", color: "#FFFFFF", marginBottom: 4, lineHeight: 21 },
  ritualAuthor:   { fontSize: 13, color: "rgba(255,255,255,0.55)" },
  durOptRow:      { flexDirection: "row", alignItems: "center", paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  durOptLabel:    { fontSize: 16, color: "#FFFFFF", flex: 1 },
  durOptCheck:    { fontSize: 16, color: "#D4AF37" },
});

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
            <Feather name="headphones" size={48} color="#BE8744" style={{ marginBottom: 16 }} />
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
  root:        { flex: 1, backgroundColor: "#230C14" },
  overlay:     { flexDirection: "row", alignItems: "center", backgroundColor: "#230C14", paddingHorizontal: H_PAD, paddingBottom: 14, gap: 10 },
  bar:         { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.09)", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 11 },
  input:       { flex: 1, fontSize: 14, color: "#F4DAD5" },
  cancel:      { paddingVertical: 6 },
  cancelText:  { color: "#BE8744", fontSize: 14, fontWeight: "600" },
  empty:       { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingTop: 60 },
  emptyTitle:  { fontSize: 18, fontWeight: "700", color: "#F4DAD5", textAlign: "center", marginBottom: 10 },
  emptySub:    { fontSize: 14, color: "rgba(242,231,228,0.45)", textAlign: "center", lineHeight: 20 },
  resultRow:   { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 5 },
  thumb:       { width: 75, height: 75, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.025)" },
  resultCat:   { fontSize: 12, color: "rgba(242,231,228,0.45)", marginBottom: 3 },
  resultTitle: { fontSize: 15, fontWeight: "700", color: "#F4DAD5", marginBottom: 3 },
  resultAuthor:{ fontSize: 12, color: "rgba(242,231,228,0.45)" },
});

// ─────────────────────────────────────────────────────────────────────────────

export default function ExploreScreen() {
  const colors   = useColors();
  const insets   = useSafeAreaInsets();
  const { photoUri } = useUserProfile();
  const { open: openDrawer } = useDrawer();
  const [searchVisible, setSearchVisible] = useState(false);
  const [ritualesFilter, setRitualesFilter] = useState<DurOptEx>("Todos");
  const [ritualesSheet, setRitualesSheet] = useState(false);
  const [tempRitualesFilter, setTempRitualesFilter] = useState<DurOptEx>("Todos");

  const { isPremium } = usePremium();
  const { playSession } = usePlayer();

  const ancestralesSessions  = SESSIONS.filter(s => s.categoryId === "sonidos-ancestrales").slice(0, 10);
  const musicaSessions       = SESSIONS.filter(s => s.categoryId === "musica-sonidos").slice(0, 10);
  const meditacionesSessions = SESSIONS.filter(s => s.categoryId === "meditaciones-guiadas").slice(0, 10);
  const dailyRecs = React.useMemo(() => getDailyRecommendations(5), []);

  const ritualesSessions = useMemo(() => {
    const opt = DURACION_OPTS_EX.find(o => o.label === ritualesFilter)!;
    const base = SESSIONS.filter(s => s.duration >= opt.min && s.duration <= opt.max);
    return base.slice(0, 10);
  }, [ritualesFilter]);

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
                    <Feather name="star" size={10} color="#BE8744" />
                  </View>
                )}
              </View>
              <Text style={[styles.sqTitle, { color: "#e8e8e8" }]} numberOfLines={2}>
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
    <View style={styles.root}>
      <LinearGradient colors={["#230610", "#16040A"]} style={styles.rootGradient} />
      <StatusBar barStyle="light-content" />
      <SacredBackground variant="solid" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 160 + bottomPad, paddingTop: topPad + 2 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.pageTitle, { transform: [{ translateY: 2 }] }]}>Meditación</Text>
              <Text style={styles.pageSubtitle}>Encuentra lo que necesitas</Text>
            </View>
            <Pressable
              hitSlop={12}
              onPress={() => setSearchVisible(true)}
              style={styles.searchIconBtn}
            >
              <Feather name="search" size={25} color="#FFFFFF" />
            </Pressable>
          </View>
        </View>

            {/* ── Explorar todo (TEMAS 6×2) ── */}
            <View style={[styles.section, { marginBottom: SECTION_GAP, marginTop: 0 }]}>
              <View style={styles.sectionRow}>
                <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Explorar todo</Text>
              </View>
              <View style={[styles.temaGrid, { marginTop: 0 }]}>
                {TEMAS.map((t, i) => (
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
                      <Image
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
                          colors={["#D6A45C", "#BE8744"]}
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

            {/* ── Meditaciones recomendadas ── */}
            {renderCarousel("Meditaciones recomendadas", dailyRecs, "/category/meditaciones-guiadas")}

            {/* ── Mezclas de la comunidad ── */}
            <View style={[styles.communityWrap, { marginTop: -7 }]}>
              <CommunityMixesCarousel />
            </View>

            {/* ── Para tus rituales sagrados ── */}
            <View style={{ marginBottom: SECTION_GAP }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: RITUAL_GRID_PAD, marginBottom: 24 }}>
                <Text style={{ fontSize: 20, fontWeight: "700", color: "#FFFFFF", letterSpacing: 0.3 }}>
                  Para tus rituales sagrados
                </Text>
                <Pressable
                  onPress={() => { setTempRitualesFilter(ritualesFilter); setRitualesSheet(true); }}
                  style={({ pressed }) => ({
                    opacity: pressed ? 0.7 : 1,
                    flexDirection: "row", alignItems: "center", gap: 5,
                    backgroundColor: "rgba(255,255,255,0.035)",
                    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6,
                  })}
                >
                  <Text style={{ fontSize: 13, color: "#BE9650", fontWeight: "600" }}>
                    {ritualesFilter}
                  </Text>
                  <Feather name="chevron-down" size={12} color="#BE8744" />
                </Pressable>
              </View>
              <View style={{ paddingHorizontal: RITUAL_GRID_PAD }}>
                {ritualesSessions.map((s, i) => (
                  <View key={s.id} style={i < ritualesSessions.length - 1 ? { marginBottom: 60 } : undefined}>
                    <ExpRitualCard session={s} onPress={() => handleSessionPress(s)} />
                  </View>
                ))}
              </View>
            </View>

      </ScrollView>

      {/* Modal picker duración */}
      <Modal
        visible={ritualesSheet}
        transparent
        animationType="slide"
        onRequestClose={() => setRitualesSheet(false)}
      >
        <Pressable
          style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.55)" }}
          onPress={() => setRitualesSheet(false)}
        />
        <View style={{ backgroundColor: "#1B060F", borderTopLeftRadius: 20, borderTopRightRadius: 20, borderTopWidth: 1, borderColor: "rgba(212,175,55,0.15)", paddingBottom: 32 }}>
          <View style={{ alignItems: "center", paddingVertical: 12 }}>
            <View style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.15)" }} />
          </View>
          <Text style={{ fontSize: 15, fontWeight: "700", color: "#FFFFFF", textAlign: "center", marginBottom: 8 }}>
            Duración
          </Text>
          {DURACION_OPTS_EX.map(opt => (
            <Pressable
              key={opt.label}
              onPress={() => setTempRitualesFilter(opt.label)}
              style={({ pressed }) => [exStyles.durOptRow, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={exStyles.durOptLabel}>{opt.label}</Text>
              {tempRitualesFilter === opt.label && <Text style={exStyles.durOptCheck}>✓</Text>}
            </Pressable>
          ))}
          <View style={{ paddingHorizontal: 20, marginTop: 16 }}>
            <Pressable
              onPress={() => { setRitualesFilter(tempRitualesFilter); setRitualesSheet(false); }}
              style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
            >
              <LinearGradient
                colors={["#D4AF37", "#BE9650"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ borderRadius: 14, paddingVertical: 14, alignItems: "center" }}
              >
                <Text style={{ fontSize: 15, fontWeight: "700", color: "#1B060F" }}>Aplicar</Text>
              </LinearGradient>
            </Pressable>
          </View>
        </View>
      </Modal>

      <SearchOverlay visible={searchVisible} onClose={() => setSearchVisible(false)} />
    </View>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: "#230610" },
  rootGradient: { ...StyleSheet.absoluteFillObject },
  scroll: { flex: 1 },
  communityWrap: {
    marginBottom: SECTION_GAP,
    marginHorizontal: H_PAD,
  },

  header:         { paddingHorizontal: H_PAD, marginBottom: 18 },
  headerPillBtn:  { width: 43, height: 43, alignItems: "center", justifyContent: "center" },
  searchIconBtn:  { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerRow:      { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pageTitle:    { fontSize: 27, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4, color: "#e8e8e8" },
  pageSubtitle: { fontSize: 14, color: "rgba(255,255,255,0.55)", marginTop: 2 },

  section:      { paddingHorizontal: H_PAD, marginBottom: SECTION_GAP },
  sectionRow:   { flexDirection: "row", alignItems: "baseline", justifyContent: "space-between", marginBottom: 24 },
  sectionTitle: { fontSize: 20, fontWeight: "600", letterSpacing: 0.5, color: "#e8e8e8", marginBottom: 24 },

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
    backgroundColor: "rgba(255,255,255,0.055)",
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
    color: "#e8e8e8",
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
    color: "#BE8744",
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
  sqAuthor: {
    fontSize: 11,
    marginTop: 3,
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
    color: "#e8e8e8",
    lineHeight: 17,
  },

});
