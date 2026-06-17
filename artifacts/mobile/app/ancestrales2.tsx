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

import { SessionCard } from "@/components/SessionCard";
import { SESSIONS } from "@/data/sessions";

// ── Constantes ─────────────────────────────────────────────────────────────────
const { width } = Dimensions.get("window");
const H_PAD = 15;
const GOLD  = "#D4AF37";
const TEXT  = "#F4DAD5";
const MUTED = "rgba(242,231,228,0.45)";
const HERO_HEIGHT = 230;
const GRID_GAP    = 10;
const cellW = (width - H_PAD * 2 - GRID_GAP) / 2;

const HERO_IMG = require("@/assets/images/ancestrales-hero.jpg");

// ── Tipos ──────────────────────────────────────────────────────────────────────
type AncestralTab = "cuencos" | "gongs" | "campanas" | "mix";
type SortMode     = "recientes" | "agregado" | "alfabetico";
type ViewMode     = "list" | "grid";

const TABS: { id: AncestralTab; label: string }[] = [
  { id: "cuencos",  label: "Cuencos" },
  { id: "gongs",    label: "Gongs" },
  { id: "campanas", label: "Campanas" },
  { id: "mix",      label: "Mix Sonoterapia" },
];

const SORT_OPTIONS: { id: SortMode; label: string; icon: string }[] = [
  { id: "recientes",  label: "Recientes",              icon: "clock" },
  { id: "agregado",   label: "Agregado recientemente", icon: "plus-circle" },
  { id: "alfabetico", label: "Alfabéticamente",         icon: "type" },
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

function applySort(arr: ReturnType<typeof getSessionsForTab>, sort: SortMode) {
  if (sort === "alfabetico") return [...arr].sort((a, b) => a.title.localeCompare(b.title, "es"));
  if (sort === "agregado")   return [...arr].sort((a, b) => parseInt(b.id) - parseInt(a.id));
  return arr; // recientes = orden natural
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
              <SessionCard key={s.id} session={s} horizontal />
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

// ── Pantalla principal ─────────────────────────────────────────────────────────
export default function Ancestrales2Screen() {
  const insets    = useSafeAreaInsets();
  const topPad    = Platform.OS === "web" ? 0 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [activeTab,     setActiveTab]     = useState<AncestralTab | null>(null);
  const [sort,          setSort]          = useState<SortMode>("recientes");
  const [sortVisible,   setSortVisible]   = useState(false);
  const [viewMode,      setViewMode]      = useState<ViewMode>("list");
  const [searchVisible, setSearchVisible] = useState(false);

  const toggleView = useCallback(() => setViewMode((v) => (v === "list" ? "grid" : "list")), []);

  const sessions = useMemo(
    () => applySort(getSessionsForTab(activeTab), sort),
    [activeTab, sort],
  );

  const sortLabel =
    sort === "recientes"  ? "Recientes"
    : sort === "agregado" ? "Agregado recientemente"
    : "Alfabéticamente";

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
      return (
        <View style={styles.gridWrap}>
          {sessions.map((s) => (
            <SessionCard key={s.id} session={s} width={cellW} />
          ))}
        </View>
      );
    }

    // list mode — horizontal cards (igual que Biblioteca)
    return (
      <View style={{ paddingHorizontal: H_PAD, gap: 9 }}>
        {sessions.map((s) => (
          <SessionCard key={s.id} session={s} horizontal />
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
        {/* Degradado inferior hacia el fondo del contenido */}
        <LinearGradient
          colors={["transparent", "rgba(39,7,14,0.7)", "#27070E"]}
          locations={[0.3, 0.72, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        {/* Degradado superior para barra */}
        <LinearGradient
          colors={["rgba(0,0,0,0.40)", "transparent"]}
          locations={[0, 1]}
          style={[StyleSheet.absoluteFill, { height: 90 + topPad }]}
          pointerEvents="none"
        />

        {/* Safe area spacer */}
        <View style={{ height: topPad }} />

        {/* Barra superior: ← (izq) y + (der) */}
        <View style={styles.headerTopRow}>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </Pressable>
          <Pressable hitSlop={10} style={styles.headerIconBtn}>
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
    backgroundColor: "#0E1326",
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
