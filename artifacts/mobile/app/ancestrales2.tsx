import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { createAudioPlayer, type AudioPlayer } from "expo-audio";

import { AddToPlaylistSheet } from "@/components/AddToPlaylistSheet";
import { AUDIO_MAP } from "@/config/audio-map";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { getArtist } from "@/data/artists";
import { getGuide } from "@/data/guides";
import { SESSIONS, type Session } from "@/data/sessions";

// ── Constantes ─────────────────────────────────────────────────────────────────
const { width } = Dimensions.get("window");
const H_PAD = 15;
const GOLD  = "#D4AF37";
const TEXT  = "#F4DAD5";
const MUTED = "rgba(242,231,228,0.45)";
const HERO_HEIGHT = 160;
const GRID_GAP    = 10;
const cellW = (width - H_PAD * 2 - GRID_GAP * 2) / 3;

const HERO_IMG = require("@/assets/images/ancestrales-hero.jpg");

// ── Tipos ──────────────────────────────────────────────────────────────────────
type AncestralTab = "cuencos" | "gongs" | "campanas" | "mix";
type SortMode     = "recientes" | "nuevas" | "populares";
type ViewMode     = "list" | "grid";

const TABS: { id: AncestralTab; label: string }[] = [
  { id: "cuencos",  label: "Cuencos" },
  { id: "gongs",    label: "Gongs" },
  { id: "campanas", label: "Campanas" },
  { id: "mix",      label: "Mix Sonoterapia" },
];

const SORT_OPTIONS: { id: SortMode; label: string; icon: string }[] = [
  { id: "recientes",  label: "Escuchadas recientemente", icon: "clock" },
  { id: "nuevas",     label: "Nuevas sesiones",          icon: "plus-circle" },
  { id: "populares",  label: "Las más escuchadas",       icon: "headphones" },
];

// ── Filtro de sesiones ─────────────────────────────────────────────────────────
function getSessionsForTab(tab: AncestralTab | null) {
  const all = SESSIONS.filter((s) => s.categoryId === "sonidos-ancestrales");
  if (!tab) return all;
  switch (tab) {
    case "cuencos":
      return all.filter((s) => s.ancestralTag?.toLowerCase().includes("cuenco"));
    case "gongs":
      return all.filter(
        (s) => s.ancestralTag?.toLowerCase().includes("gong") || s.ancestralTag === "Gongs",
      );
    case "campanas":
      return all.filter((s) => s.ancestralTag?.toLowerCase().includes("campana"));
    case "mix":
      return all.filter((s) => {
        const t = s.ancestralTag;
        return (
          t === "Full Instrumentos" ||
          t === "Vientos" ||
          t === "Cantos" ||
          t === "Percusión" ||
          t === "Selva" ||
          t === "Mix de Cuencos"
        );
      });
  }
}

function applySort(
  arr: ReturnType<typeof getSessionsForTab>,
  sort: SortMode,
  playCounts: Record<string, number> = {},
) {
  if (sort === "nuevas")     return [...arr].sort((a, b) => parseInt(b.id) - parseInt(a.id));
  if (sort === "populares")  return [...arr].sort((a, b) => (playCounts[b.id] ?? 0) - (playCounts[a.id] ?? 0));
  // "recientes" — orden por última escucha (ids en playCounts en orden de history, no disponible aquí → orden natural)
  return arr;
}

// ── SortSheet ─────────────────────────────────────────────────────────────────
function SortSheet({
  visible,
  current,
  onSelect,
  onClose,
}: {
  visible: boolean;
  current: SortMode;
  onSelect: (s: SortMode) => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={[styles.sortSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.sortSheetHandle} />
        <Text style={styles.sortSheetTitle}>Ordenar por</Text>
        {SORT_OPTIONS.map((opt) => {
          const active = opt.id === current;
          return (
            <Pressable
              key={opt.id}
              style={({ pressed }) => [styles.sortSheetRow, { opacity: pressed ? 0.7 : 1 }]}
              onPress={() => { onSelect(opt.id); onClose(); }}
            >
              <Feather name={opt.icon as never} size={17} color={active ? GOLD : MUTED} />
              <Text style={[styles.sortSheetLabel, active && styles.sortSheetLabelActive]}>
                {opt.label}
              </Text>
              {active && <Feather name="check" size={17} color={GOLD} style={{ marginLeft: "auto" }} />}
            </Pressable>
          );
        })}
      </View>
    </Modal>
  );
}

// ── AnimatedTabContent ─────────────────────────────────────────────────────────
function AnimatedTabContent({
  animKey,
  children,
}: {
  animKey: string;
  children: React.ReactNode;
}) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }).start();
  }, [animKey]); // eslint-disable-line react-hooks/exhaustive-deps
  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}

// ── Chip individual ────────────────────────────────────────────────────────────
function AncestralChip({
  label,
  sel,
  onPress,
}: {
  label: string;
  sel: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.chip, { opacity: pressed ? 0.7 : 1 }]}
    >
      {sel && (
        <LinearGradient
          colors={["#D6AD5F", "#B47344"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <Text style={[styles.chipText, sel && styles.chipTextSel]}>{label}</Text>
    </Pressable>
  );
}

// ── Fila animada de chips ──────────────────────────────────────────────────────
const CHIP_ANIM_DURATION = 600;
const CLOSE_SLOT = 38;

function AnimatedChipRow({
  activeTab,
  onSelect,
  onClear,
}: {
  activeTab: AncestralTab | null;
  onSelect: (id: AncestralTab) => void;
  onClear: () => void;
}) {
  const progress      = useRef(new Animated.Value(activeTab ? 1 : 0)).current;
  const offsetsRef    = useRef<Record<string, number>>({});
  const scrollXRef    = useRef(0);
  const [displayTab,  setDisplayTab]  = useState<AncestralTab | null>(activeTab);
  const [colorTab,    setColorTab]    = useState<AncestralTab | null>(activeTab);
  const [targetTranslate, setTargetTranslate] = useState(0);
  const filtered = displayTab !== null;

  const animate = (toValue: number, onDone?: () => void) => {
    Animated.timing(progress, {
      toValue,
      duration: CHIP_ANIM_DURATION,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => { if (finished) onDone?.(); });
  };

  const handleSelect = (id: AncestralTab) => {
    const off = offsetsRef.current[id] ?? 0;
    const visualLeft = off - scrollXRef.current;
    setTargetTranslate(CLOSE_SLOT - visualLeft);
    setDisplayTab(id);
    setColorTab(id);
    onSelect(id);
    animate(1);
  };

  const handleClear = () => {
    setColorTab(null);
    onClear();
    animate(0, () => setDisplayTab(null));
  };

  useEffect(() => () => progress.stopAnimation(), [progress]);

  return (
    <View style={styles.animChipWrap}>
      <Animated.View
        pointerEvents={filtered ? "auto" : "none"}
        style={[styles.animCloseBtn, { opacity: progress }]}
      >
        <Pressable onPress={handleClear} hitSlop={10} style={styles.chipCloseBtn}>
          <Feather name="x" size={15} color={MUTED} />
        </Pressable>
      </Animated.View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        scrollEnabled={!filtered}
        scrollEventThrottle={16}
        onScroll={(e) => { scrollXRef.current = e.nativeEvent.contentOffset.x; }}
        style={styles.chipRow}
        contentContainerStyle={styles.chipRowContent}
      >
        {TABS.map((t) => {
          const isSelected = displayTab === t.id;
          const chipStyle = isSelected
            ? {
                opacity: 1,
                zIndex: 2,
                transform: [
                  {
                    translateX: progress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, targetTranslate],
                    }),
                  },
                ],
              }
            : {
                opacity: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [1, 0],
                }),
              };

          return (
            <Animated.View
              key={t.id}
              pointerEvents={filtered && !isSelected ? "none" : "auto"}
              onLayout={(e) => { offsetsRef.current[t.id] = e.nativeEvent.layout.x; }}
              style={chipStyle}
            >
              <AncestralChip
                label={t.label}
                sel={colorTab === t.id}
                onPress={() => (isSelected ? handleClear() : handleSelect(t.id))}
              />
            </Animated.View>
          );
        })}
      </ScrollView>
    </View>
  );
}

// ── Modal de búsqueda ──────────────────────────────────────────────────────────
function SearchOverlay({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [q, setQ]           = useState("");
  const inputRef            = useRef<TextInput>(null);
  const [kbHeight, setKbHeight]   = useState(0);
  const [kbReady,  setKbReady]    = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const results = useMemo(
    () =>
      q.length >= 2
        ? SESSIONS.filter(
            (s) =>
              s.categoryId === "sonidos-ancestrales" &&
              s.title.toLowerCase().includes(q.toLowerCase()),
          )
        : [],
    [q],
  );

  useEffect(() => {
    if (!visible) { setKbReady(false); setKbHeight(0); fadeAnim.setValue(0); return; }
    const show = Keyboard.addListener("keyboardDidShow", (e) => {
      setKbHeight(e.endCoordinates.height);
      setKbReady(true);
      Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }).start();
    });
    const hide = Keyboard.addListener("keyboardDidHide", () => { setKbReady(false); fadeAnim.setValue(0); });
    return () => { show.remove(); hide.remove(); };
  }, [visible, fadeAnim]);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
      onShow={() => inputRef.current?.focus()}
    >
      <View style={[styles.searchModalRoot, { paddingBottom: kbHeight }]}>
        <View style={styles.searchOverlay}>
          <View style={styles.searchBar}>
            <Feather name="search" size={16} color={MUTED} />
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Buscar en Ancestrales..."
              placeholderTextColor={MUTED}
              value={q}
              onChangeText={setQ}
              returnKeyType="search"
            />
          </View>
          <Pressable onPress={onClose} style={styles.cancelBtn}>
            <Text style={styles.cancelText}>Cancelar</Text>
          </Pressable>
        </View>
        {q.length === 0 && kbReady && (
          <Animated.View style={[styles.searchEmpty, { opacity: fadeAnim }]}>
            <Feather name="music" size={48} color={GOLD} style={{ marginBottom: 16 }} />
            <Text style={styles.searchEmptyTitle}>Busca sonidos ancestrales</Text>
            <Text style={styles.searchEmptySub}>Cuencos, gongs, campanas y más.</Text>
          </Animated.View>
        )}
        {results.length > 0 && (
          <ScrollView
            style={{ flex: 1, backgroundColor: "#1B060F" }}
            contentContainerStyle={{ padding: H_PAD, gap: 9 }}
          >
            {results.map((s) => (
              <AncestralCard key={s.id} session={s} horizontal />
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

// ── Card personalizada para Ancestrales 2 ─────────────────────────────────────
const PREVIEW_SECS = 19;

function AncestralCard({
  session,
  width: cardWidth = 200,
  horizontal = false,
  onLongPress,
  isPreviewPlaying = false,
  previewProgress,
  onPreviewTap,
}: {
  session: Session;
  width?: number;
  horizontal?: boolean;
  onLongPress?: () => void;
  isPreviewPlaying?: boolean;
  previewProgress?: Animated.Value;
  onPreviewTap?: () => void;
}) {
  const { isPremium } = usePremium();
  const locked = !!session.isPremium && !isPremium;
  const hasAudio = !!AUDIO_MAP[session.id];

  const handlePress = () => {
    if (locked) router.push("/membresia" as never);
    else router.push(`/session/${session.id}` as never);
  };

  const author = (() => {
    if (session.guideId) return getGuide(session.guideId).name;
    if (session.artistId) return getArtist(session.artistId).name;
    return "Casa del Cuenco";
  })();

  if (horizontal) {
    const barW = previewProgress?.interpolate({
      inputRange: [0, 1], outputRange: [0, 70], extrapolate: "clamp",
    });
    return (
      <Pressable
        onPress={handlePress}
        onLongPress={onLongPress}
        style={({ pressed }) => [acStyles.hRow, { opacity: pressed ? 0.8 : 1 }]}
      >
        <View style={acStyles.hImgWrap}>
          <Image source={session.image} style={acStyles.hImage} contentFit="cover" />
          {locked && (
            <View style={acStyles.lockDot}>
              <Feather name="lock" size={9} color="#fff" />
            </View>
          )}
          {/* Botón preview */}
          {hasAudio && (
            <Pressable onPress={onPreviewTap} hitSlop={6} style={acStyles.hPlayBtn}>
              <Feather name={isPreviewPlaying ? "pause" : "play"} size={15} color="#fff" />
            </Pressable>
          )}
          {/* Barra de progreso inferior */}
          {isPreviewPlaying && barW && (
            <Animated.View style={[acStyles.progressBar, { width: barW }]} />
          )}
        </View>
        <View style={acStyles.hContent}>
          <Text style={acStyles.hDuration}>{session.durationLabel}</Text>
          <Text style={acStyles.hTitle} numberOfLines={2}>{session.title}</Text>
          {!!author && <Text style={acStyles.hAuthor} numberOfLines={1}>{author}</Text>}
        </View>
      </Pressable>
    );
  }

  const barW = previewProgress?.interpolate({
    inputRange: [0, 1], outputRange: [0, cardWidth], extrapolate: "clamp",
  });

  return (
    <Pressable
      onPress={handlePress}
      onLongPress={onLongPress}
      style={({ pressed }) => [acStyles.card, { width: cardWidth, opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={acStyles.imgContainer}>
        <Image source={session.image} style={acStyles.cardImage} contentFit="cover" />
        {locked && (
          <View style={acStyles.lockDot}>
            <Feather name="lock" size={9} color="#fff" />
          </View>
        )}
        <View style={acStyles.durationBadge}>
          <Text style={acStyles.durationBadgeText}>{session.durationLabel}</Text>
        </View>
        {/* Botón preview centrado */}
        {hasAudio && (
          <Pressable onPress={onPreviewTap} hitSlop={8} style={acStyles.gridPlayOverlay}>
            <View style={[acStyles.gridPlayBtn, isPreviewPlaying && acStyles.gridPlayBtnActive]}>
              <Feather
                name={isPreviewPlaying ? "pause" : "play"}
                size={14}
                color={isPreviewPlaying ? "#1B060F" : "#fff"}
              />
            </View>
          </Pressable>
        )}
        {/* Barra de progreso inferior */}
        {isPreviewPlaying && barW && (
          <Animated.View style={[acStyles.progressBar, { width: barW }]} />
        )}
      </View>
      <Text style={acStyles.cardTitle} numberOfLines={2}>{session.title}</Text>
      {!!author && <Text style={acStyles.cardAuthor} numberOfLines={1}>{author}</Text>}
    </Pressable>
  );
}

const acStyles = StyleSheet.create({
  // ── Horizontal ──────────────────────────────────────────────────────────────
  hRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 6,
  },
  hImgWrap: { width: 70, height: 62, borderRadius: 8, overflow: "hidden" },
  hImage:   { width: 70, height: 62 },
  hContent: { flex: 1, justifyContent: "center", gap: 2 },
  hDuration: {
    fontSize: 9,
    fontWeight: "500",
    color: "rgba(255,255,255,0.8)",
  },
  hTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: TEXT,
    lineHeight: 17,
  },
  hAuthor: {
    fontSize: 11,
    color: MUTED,
    marginTop: 1,
  },
  // ── Grid ────────────────────────────────────────────────────────────────────
  card:       { gap: 6 },
  imgContainer: { width: "100%", aspectRatio: 1, borderRadius: 10, overflow: "hidden" },
  cardImage:  { width: "100%", height: "100%" },
  cardTitle:  { fontSize: 13, fontWeight: "600", color: TEXT, lineHeight: 17 },
  cardAuthor: { fontSize: 11, color: MUTED },
  durationBadge: {
    position: "absolute", bottom: 8, left: 8,
    backgroundColor: "rgba(27,6,15,0.72)",
    borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3,
  },
  durationBadgeText: { fontSize: 11, fontWeight: "600", color: "#fff" },
  lockDot: {
    position: "absolute", top: 6, right: 6,
    width: 20, height: 20, borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center", justifyContent: "center",
  },
  // ── Preview ─────────────────────────────────────────────────────────────────
  progressBar: {
    position: "absolute", bottom: 0, left: 0,
    height: 3, backgroundColor: GOLD,
  },
  // Horizontal card
  hPlayBtn: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.38)",
  },
  // Grid card
  gridPlayOverlay: {
    position: "absolute",
    bottom: 10, right: 8,
  },
  gridPlayBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "rgba(27,6,15,0.65)",
    alignItems: "center", justifyContent: "center",
  },
  gridPlayBtnActive: {
    backgroundColor: GOLD,
  },
});

// ── Sheet de acciones rápidas de sesión ───────────────────────────────────────
function SessionQuickSheet({
  session,
  onClose,
  onPlaylist,
  isFavorite,
  onToggleFavorite,
}: {
  session: Session | null;
  onClose: () => void;
  onPlaylist: () => void;
  isFavorite: (id: string) => boolean;
  onToggleFavorite: (id: string) => void;
}) {
  const insets = useSafeAreaInsets();
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (session) {
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [session, slideAnim]);

  if (!session) return null;

  const favorited = isFavorite(session.id);

  const handleFavorite = () => {
    onToggleFavorite(session.id);
    onClose();
  };

  return (
    <Modal visible={!!session} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.qsBackdrop} onPress={onClose} />
      <Animated.View
        style={[styles.qsSheet, { paddingBottom: Math.max(insets.bottom, 24), transform: [{ translateY: slideAnim }] }]}
      >
        <View style={styles.qsHandle} />

        {/* Cabecera: thumb + info + X */}
        <View style={styles.qsHeader}>
          <Image
            source={session.image as never}
            style={styles.qsThumb}
            contentFit="cover"
          />
          <View style={{ flex: 1 }}>
            <Text style={styles.qsTitle} numberOfLines={2}>{session.title}</Text>
            <Text style={styles.qsSub}>{session.categoryLabel} · {session.durationLabel}</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={10} style={styles.qsClose}>
            <Feather name="x" size={20} color={MUTED} />
          </Pressable>
        </View>

        <View style={styles.qsDivider} />

        {/* Opción: Playlist */}
        <Pressable
          onPress={onPlaylist}
          style={({ pressed }) => [styles.qsRow, styles.qsRowBorder, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="list" size={20} color={TEXT} style={styles.qsIcon} />
          <Text style={styles.qsLabel}>Agregar a una Playlist</Text>
          <Feather name="chevron-right" size={16} color={MUTED} />
        </Pressable>

        {/* Opción: Favorito */}
        <Pressable
          onPress={handleFavorite}
          style={({ pressed }) => [styles.qsRow, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather
            name="heart"
            size={20}
            color={favorited ? "#E05C5C" : TEXT}
            style={styles.qsIcon}
          />
          <Text style={[styles.qsLabel, favorited && { color: "#E05C5C" }]}>
            {favorited ? "Quitar de favoritos" : "Agregar a favoritos"}
          </Text>
          <Feather name="chevron-right" size={16} color={MUTED} />
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

// ── Pantalla principal ─────────────────────────────────────────────────────────
export default function Ancestrales2Screen() {
  const insets    = useSafeAreaInsets();
  const topPad    = Platform.OS === "web" ? 0 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { isFavorite, toggleFavorite, history } = usePlayer();

  const [activeTab,         setActiveTab]         = useState<AncestralTab | null>(null);
  const [sort,              setSort]              = useState<SortMode>("recientes");
  const [sortVisible,       setSortVisible]       = useState(false);
  const [viewMode,          setViewMode]          = useState<ViewMode>("list");
  const [searchVisible,     setSearchVisible]     = useState(false);
  const [selectedSession,   setSelectedSession]   = useState<Session | null>(null);
  const [playlistSessionId, setPlaylistSessionId] = useState<string | null>(null);

  // ── Preview de 12 s ───────────────────────────────────────────────────────
  const [previewingId,  setPreviewingId]  = useState<string | null>(null);
  const previewProgress = useRef(new Animated.Value(0)).current;
  const previewPlayer   = useRef<AudioPlayer | null>(null);
  const previewAnim     = useRef<Animated.CompositeAnimation | null>(null);
  const previewTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stopPreview = useCallback(() => {
    if (previewTimer.current) clearTimeout(previewTimer.current);
    previewAnim.current?.stop();
    previewProgress.setValue(0);
    previewPlayer.current?.pause();
    setPreviewingId(null);
  }, [previewProgress]);

  const togglePreview = useCallback((session: Session) => {
    if (previewingId === session.id) { stopPreview(); return; }
    stopPreview();
    const src = AUDIO_MAP[session.id];
    if (!src) return;

    setPreviewingId(session.id);
    previewProgress.setValue(0);

    if (!previewPlayer.current) {
      previewPlayer.current = createAudioPlayer(src);
    } else {
      previewPlayer.current.replace(src);
    }
    previewPlayer.current.play();

    previewAnim.current = Animated.timing(previewProgress, {
      toValue: 1,
      duration: PREVIEW_SECS * 1000,
      useNativeDriver: false,
      easing: Easing.linear,
    });
    previewAnim.current.start(({ finished }) => { if (finished) stopPreview(); });
    previewTimer.current = setTimeout(stopPreview, PREVIEW_SECS * 1000 + 300);
  }, [previewingId, stopPreview, previewProgress]);

  // Limpieza al desmontar
  useEffect(() => () => { stopPreview(); }, []);

  const toggleView = useCallback(() => setViewMode((v) => (v === "list" ? "grid" : "list")), []);

  const playCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of history) counts[e.sessionId] = (counts[e.sessionId] ?? 0) + 1;
    return counts;
  }, [history]);

  const sessions = useMemo(
    () => applySort(getSessionsForTab(activeTab), sort, playCounts),
    [activeTab, sort, playCounts],
  );

  const sortLabel =
    sort === "recientes"  ? "Escuchadas recientemente"
    : sort === "nuevas"   ? "Nuevas sesiones"
    : "Las más escuchadas";

  const renderContent = () => {
    if (sessions.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Feather name="music" size={48} color={GOLD} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>
            Próximamente en{" "}
            {activeTab ? TABS.find((t) => t.id === activeTab)?.label : "Ancestrales"}
          </Text>
          <Text style={styles.emptySub}>
            Estamos preparando este espacio con las mejores sesiones sonoras.
          </Text>
        </View>
      );
    }

    if (viewMode === "grid") {
      const triples: (typeof sessions)[] = [];
      for (let i = 0; i < sessions.length; i += 3) triples.push(sessions.slice(i, i + 3));
      return (
        <View style={styles.gridOuter}>
          {triples.map((triple, ri) => (
            <View key={ri} style={styles.gridRow}>
              {triple.map((s) => (
                <AncestralCard
                  key={s.id}
                  session={s}
                  width={cellW}
                  onLongPress={() => setSelectedSession(s)}
                  isPreviewPlaying={previewingId === s.id}
                  previewProgress={previewProgress}
                  onPreviewTap={() => togglePreview(s)}
                />
              ))}
            </View>
          ))}
        </View>
      );
    }

    // list mode
    return (
      <View style={{ paddingHorizontal: H_PAD }}>
        {sessions.map((s) => (
          <AncestralCard
            key={s.id}
            session={s}
            horizontal
            onLongPress={() => setSelectedSession(s)}
            isPreviewPlaying={previewingId === s.id}
            previewProgress={previewProgress}
            onPreviewTap={() => togglePreview(s)}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.root}>

      {/* ── HEADER CON HERO ─────────────────────────────────────────────── */}
      <View style={[styles.header, { height: HERO_HEIGHT + topPad }]}>
        <Image
          source={HERO_IMG}
          style={[StyleSheet.absoluteFill, { width: "100%", height: "100%" }]}
          contentFit="cover"
          contentPosition="top"
        />
        {/* Overlay oscuro sutil para mejorar contraste */}
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.28)" }]} pointerEvents="none" />

        {/* Safe area spacer */}
        <View style={{ height: topPad }} />

        {/* Barra superior: ← (izq) y + (der) */}
        <View style={styles.headerTopRow}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </Pressable>
          <Pressable hitSlop={10} style={styles.headerIconBtn} onPress={() => router.push("/ancestrales-info" as never)}>
            <Feather name="plus" size={24} color="#fff" />
          </Pressable>
        </View>

        {/* Título + búsqueda al pie del hero */}
        <View style={styles.heroTitleArea}>
          <View style={styles.heroTitleRow}>
            <Text style={styles.heroTitle}>Ancestrales</Text>
            <Pressable hitSlop={10} onPress={() => setSearchVisible(true)} style={styles.heroSearchBtn}>
              <Feather name="search" size={21} color="rgba(255,255,255,0.85)" />
            </Pressable>
          </View>
          <Text style={styles.heroSubtitle}>
            {`${sessions.length} sesione${sessions.length !== 1 ? "s" : ""}`}
          </Text>
        </View>
      </View>

      {/* ── CHIPS STICKY (entre hero y scroll) ─────────────────────────── */}
      <View style={styles.chipsArea}>
        <AnimatedChipRow
          activeTab={activeTab}
          onSelect={(id) => setActiveTab(id)}
          onClear={() => setActiveTab(null)}
        />
      </View>

      {/* ── CONTENIDO ───────────────────────────────────────────────────── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 140 + bottomPad, paddingTop: 0 }}
        showsVerticalScrollIndicator={false}
      >
        <AnimatedTabContent animKey={activeTab ?? "all"}>
          {/* Barra de control: ordenar + toggle vista */}
          <View style={styles.controlRow}>
            <Pressable onPress={() => setSortVisible(true)} style={styles.sortBtn} hitSlop={8}>
              <Feather name="chevrons-down" size={14} color={MUTED} />
              <Text style={styles.sortText}>{sortLabel}</Text>
            </Pressable>
            <Pressable onPress={toggleView} hitSlop={10} style={styles.viewToggleBtn}>
              {viewMode === "list"
                ? <MaterialCommunityIcons name="view-grid-outline" size={21} color={MUTED} />
                : <MaterialCommunityIcons name="view-list-outline" size={21} color={MUTED} />
              }
            </Pressable>
          </View>

          {renderContent()}
        </AnimatedTabContent>
      </ScrollView>

      {/* Overlays */}
      <SearchOverlay visible={searchVisible} onClose={() => setSearchVisible(false)} />
      <SortSheet
        visible={sortVisible}
        current={sort}
        onSelect={setSort}
        onClose={() => setSortVisible(false)}
      />

      {/* ── Sheets de sesión ───────────────────────────────────────────── */}
      <SessionQuickSheet
        session={selectedSession}
        onClose={() => setSelectedSession(null)}
        onPlaylist={() => {
          if (selectedSession) setPlaylistSessionId(selectedSession.id);
          setSelectedSession(null);
        }}
        isFavorite={isFavorite}
        onToggleFavorite={toggleFavorite}
      />
      <AddToPlaylistSheet
        visible={playlistSessionId !== null}
        sessionId={playlistSessionId ?? ""}
        onClose={() => setPlaylistSessionId(null)}
      />
    </View>
  );
}

// ── Estilos ────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#27070E" },

  // ── Hero ─────────────────────────────────────────────────────────────────────
  header: { overflow: "hidden", backgroundColor: "#27070E" },
  headerTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: H_PAD,
    paddingTop: 8,
  },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerIcons: { flexDirection: "row", alignItems: "center", gap: 4 },
  headerIconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },

  heroTitleArea: {
    flex: 1,
    justifyContent: "flex-end",
    paddingHorizontal: H_PAD,
    paddingBottom: 12,
  },
  heroTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "800",
    color: "#fff",
    letterSpacing: 0.5,
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 6,
    flex: 1,
  },
  heroSearchBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  heroSubtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.72)",
    marginTop: 3,
  },

  chipsArea: {
    paddingHorizontal: H_PAD,
    paddingTop: 12,
    paddingBottom: 8,
  },

  // ── Chips ────────────────────────────────────────────────────────────────────
  animChipWrap: { flexDirection: "row", alignItems: "center" },
  animCloseBtn: {
    position: "absolute", left: 0, top: 0, bottom: 0,
    justifyContent: "center", zIndex: 3,
  },
  chipCloseBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: "rgba(74,12,12,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  chipRow: { flexGrow: 0 },
  chipRowContent: { flexDirection: "row", gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.08)",
    overflow: "hidden",
  },
  chipText: { fontSize: 13, fontWeight: "500", color: TEXT },
  chipTextSel: { color: "#1B060F", fontWeight: "700" },

  // ── Control Row ──────────────────────────────────────────────────────────────
  scroll: { flex: 1 },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: H_PAD,
    paddingVertical: 10,
  },
  sortBtn:      { flexDirection: "row", alignItems: "center", gap: 4 },
  sortText:     { fontSize: 13, color: MUTED, fontWeight: "500" },
  viewToggleBtn: { padding: 2 },

  // ── Grilla ───────────────────────────────────────────────────────────────────
  gridWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: GRID_GAP,
    paddingHorizontal: H_PAD,
    paddingTop: 4,
  },
  gridOuter: { paddingHorizontal: H_PAD, gap: GRID_GAP },
  gridRow:   { flexDirection: "row", gap: GRID_GAP },

  // ── Estado vacío ─────────────────────────────────────────────────────────────
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: H_PAD,
  },
  emptyTitle: {
    fontSize: 17, fontWeight: "700", color: TEXT,
    textAlign: "center", marginBottom: 8,
  },
  emptySub: {
    fontSize: 13, color: MUTED,
    textAlign: "center", lineHeight: 20,
  },

  // ── SortSheet ────────────────────────────────────────────────────────────────
  sortSheet: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    backgroundColor: "#1B060F",
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingTop: 10, paddingHorizontal: 20,
  },
  sortSheetHandle: {
    alignSelf: "center", width: 36, height: 4,
    borderRadius: 2, backgroundColor: "rgba(74,12,12,0.35)", marginBottom: 16,
  },
  sortSheetTitle: { color: TEXT, fontSize: 15, fontWeight: "700", marginBottom: 12 },
  sortSheetRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(61,14,22,0.40)",
  },
  sortSheetLabel:       { color: MUTED, fontSize: 15, flex: 1 },
  sortSheetLabelActive: { color: TEXT, fontWeight: "600" },

  // ── SessionQuickSheet ────────────────────────────────────────────────────────
  qsBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  qsSheet: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    backgroundColor: "#1B060F",
    borderTopLeftRadius: 22, borderTopRightRadius: 22,
    paddingTop: 10,
    paddingHorizontal: 20,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderColor: "#3D0E16",
  },
  qsHandle: {
    alignSelf: "center", width: 36, height: 4,
    borderRadius: 2, backgroundColor: "rgba(212,175,55,0.25)", marginBottom: 14,
  },
  qsHeader: {
    flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14,
  },
  qsThumb: {
    width: 54, height: 54, borderRadius: 10,
  },
  qsTitle: {
    fontSize: 15, fontWeight: "700", color: TEXT, marginBottom: 2,
  },
  qsSub: {
    fontSize: 12, color: MUTED,
  },
  qsClose: {
    padding: 4,
  },
  qsDivider: {
    height: StyleSheet.hairlineWidth, backgroundColor: "#3D0E16", marginBottom: 6,
  },
  qsRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 16, gap: 14,
  },
  qsRowBorder: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "#3D0E16",
  },
  qsIcon: {
    width: 22,
  },
  qsLabel: {
    flex: 1, fontSize: 15, color: TEXT,
  },

  // ── Búsqueda ─────────────────────────────────────────────────────────────────
  searchModalRoot:  { flex: 1, backgroundColor: "#4A0C0C" },
  searchOverlay: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#4A0C0C",
    paddingTop: Platform.OS === "ios" ? 56 : 36,
    paddingHorizontal: H_PAD, paddingBottom: 14, gap: 10,
  },
  searchBar: {
    flex: 1, flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#FFFFFF", borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 12,
  },
  searchInput:  { flex: 1, fontSize: 14, color: "#111" },
  cancelBtn:    { paddingVertical: 6 },
  cancelText:   { color: GOLD, fontSize: 14, fontWeight: "600" },
  searchEmpty: {
    flex: 1, backgroundColor: "#4A0C0C",
    alignItems: "center", justifyContent: "center", paddingHorizontal: 32,
  },
  searchEmptyTitle: {
    fontSize: 18, fontWeight: "700", color: TEXT, textAlign: "center", marginBottom: 10,
  },
  searchEmptySub: { fontSize: 14, color: MUTED, textAlign: "center", lineHeight: 20 },
});
