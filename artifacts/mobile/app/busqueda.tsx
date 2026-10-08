import { Feather } from "@expo/vector-icons";
import { BackPill } from "@/components/BackPill";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { openPremiumPlans } from "@/lib/premiumGate";
import { useBackOverride } from "@/context/BackOverrideContext";
import React, { useMemo, useState } from "react";
import {
  Dimensions,
  FlatList,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SESSIONS, type Session } from "@/data/sessions";
import { getArtist } from "@/data/artists";
import { getGuide } from "@/data/guides";
import { usePremium } from "@/context/PremiumContext";
import { usePlayer } from "@/context/PlayerContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useCategoryOverlayOptional } from "@/context/CategoryOverlayContext";
import { getThemeStyleId, SCENE_THEMES } from "@/config/scene-themes";

const { width } = Dimensions.get("window");
const H_PAD = 20;
const RESULT_CARD_GAP = 12;

const DURATION_SLOTS = [
  { label: "5 min",  min: 0,  max: 5 },
  { label: "10 min", min: 6,  max: 10 },
  { label: "20 min", min: 11, max: 25 },
  { label: "30 min", min: 26, max: 35 },
  { label: "60 min", min: 36, max: Infinity },
] as const;
export type DurSlotLabel = (typeof DURATION_SLOTS)[number]["label"];

const CATEGORY_OPTIONS = [
  { label: "Meditaciones", categoryId: "meditaciones-guiadas" },
  { label: "Sonoterapia",  categoryId: "sonidos-ancestrales" },
  { label: "Música",       categoryId: "musica-sonidos" },
  { label: "Dormir",       categoryId: "descanso" },
  { label: "Historias",    categoryId: "historias" },
  { label: "Reflexiones",  categoryId: "charlas" },
] as const;
type CategoryLabel = (typeof CATEGORY_OPTIONS)[number]["label"];

const OPTION_W = (width - H_PAD * 2 - 12) / 2;

/** Aclara un color hex multiplicando canales (clamp 255). */
function brighten(hex: string, factor = 1.5): string {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex.trim());
  if (!m) return hex;
  const n = parseInt(m[1], 16);
  const ch = (v: number) => Math.min(255, Math.round(v * factor));
  const r = ch((n >> 16) & 255);
  const g = ch((n >> 8) & 255);
  const b = ch(n & 255);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

function getSessionAuthor(s: Session): string | null {
  if (s.guideId) return getGuide(s.guideId).name;
  if (s.artistId) return getArtist(s.artistId).name;
  return s.subtitle ?? null;
}

// ── Colores derivados del tema de Escena ─────────────────────────────────────
type ThemeColors = {
  accent: string;
  pillActiveBg: string;
  pillActiveText: string;
};

function deriveThemeColors(gradient: readonly [string, string, ...string[]]): ThemeColors {
  const lastStop = gradient[gradient.length - 1];
  const accent = brighten(lastStop, 2.8);
  return {
    accent,
    pillActiveBg: "#f9f9f9",
    pillActiveText: "#1B060F",
  };
}

// ── Bottom sheet de filtro ───────────────────────────────────────────────────
function FilterSheet({
  visible,
  title,
  options,
  selected,
  onSelect,
  onClear,
  onClose,
}: {
  visible: boolean;
  title: string;
  options: readonly string[];
  selected: string | null;
  onSelect: (v: string) => void;
  onClear: () => void;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { theme } = useSceneTheme();
  const sheetGradient: [string, string] = getThemeStyleId(theme.id) === "indigo2"
    ? [SCENE_THEMES.tibet.gradient[1], SCENE_THEMES.tibet.gradient[2]]
    : [theme.gradient[1], theme.gradient[2]];
  const optionBackground = getThemeStyleId(theme.id) === "cloudy" ? "rgba(0,0,0,0.19)" : "rgba(0,0,0,0.16)";
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.55)" }]} onPress={onClose} />
        <View style={sheetStyles.container} pointerEvents="box-none">
          <LinearGradient
            colors={sheetGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[sheetStyles.sheet, {
              paddingBottom: (Platform.OS === "web" ? 24 : insets.bottom) + 20,
            }]}
          >
            <View style={sheetStyles.headerRow}>
              <Text style={sheetStyles.title}>{title}</Text>
              <Pressable onPress={onClose} hitSlop={10} style={sheetStyles.closeBtn}>
                <Feather name="x" size={20} color="#F9F9F9" />
              </Pressable>
            </View>
            <View style={sheetStyles.grid}>
              {options.map((opt) => {
                const sel = selected === opt;
                return (
                  <Pressable
                    key={opt}
                    onPress={() => { onSelect(opt); onClose(); }}
                    style={({ pressed }) => [
                      sheetStyles.option,
                      {
                        backgroundColor: optionBackground,
                        opacity: pressed ? 0.75 : 1,
                      },
                    ]}
                  >
                    <Text style={sheetStyles.optionText} numberOfLines={1}>
                      {opt}
                    </Text>
                    {sel && <Feather name="check" size={15} color="#F9F9F9" style={sheetStyles.selectedCheck} />}
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              onPress={() => { onClear(); onClose(); }}
              style={({ pressed }) => [sheetStyles.clearBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={sheetStyles.clearText}>Limpiar</Text>
            </Pressable>
          </LinearGradient>
        </View>
      </View>
    </Modal>
  );
}

// ── Pantalla de búsqueda ─────────────────────────────────────────────────────
export default function BusquedaScreen({ tiempo: tiempoProp }: { tiempo?: string } = {}) {
  const insets = useSafeAreaInsets();
  const { width: windowWidth } = useWindowDimensions();
  const resultCardWidth = (windowWidth - H_PAD * 2 - RESULT_CARD_GAP) / 2;
  const topPad = Platform.OS === "web" ? 56 : insets.top;
  const { tiempo: tiempoParam } = useLocalSearchParams<{ tiempo?: string }>();
  const tiempo = tiempoProp ?? tiempoParam;
  const overlayBack = useBackOverride();
  const goBack = () => (overlayBack ? overlayBack() : router.back());
  const { isPremium } = usePremium();
  const { playSession } = usePlayer();
  const { theme } = useSceneTheme();
  const categoryOverlay = useCategoryOverlayOptional();

  const tc = useMemo(() => deriveThemeColors(theme.gradient), [theme.gradient]);

  const initialDur = DURATION_SLOTS.find((s) => s.label === tiempo)?.label ?? null;
  const [selectedCat, setSelectedCat] = useState<CategoryLabel | null>(null);
  const [selectedDur, setSelectedDur] = useState<DurSlotLabel | null>(initialDur);
  const [catSheetOpen, setCatSheetOpen] = useState(false);
  const [durSheetOpen, setDurSheetOpen] = useState(false);

  const hasFilters = selectedCat !== null || selectedDur !== null;

  const results = useMemo(() => {
    if (!hasFilters) return [] as Session[];
    const catId = CATEGORY_OPTIONS.find((c) => c.label === selectedCat)?.categoryId;
    const slot = DURATION_SLOTS.find((s) => s.label === selectedDur);
    return SESSIONS.filter((s) => {
      if (catId && s.categoryId !== catId) return false;
      if (slot && !(s.duration >= slot.min && s.duration <= slot.max)) return false;
      return true;
    });
  }, [selectedCat, selectedDur, hasFilters]);

  function handleSessionPress(s: Session) {
    const locked = s.isPremium && !isPremium;
    if (locked) { openPremiumPlans(); return; }
    if (s.skipMiniPlayer) { playSession(s); return; }
    if (s.skipDetail) { playSession(s); router.push("/player" as never); return; }
    if (categoryOverlay) { categoryOverlay.openCategory(`/session/${s.id}`); return; }
    router.push(`/session/${s.id}` as never);
  }

  function clearAll() {
    setSelectedCat(null);
    setSelectedDur(null);
  }

  return (
    <LinearGradient
      colors={theme.gradient as unknown as [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
      style={styles.root}
    >
      <StatusBar hidden />

      {/* Header */}
      <View style={[styles.topBar, { paddingTop: topPad + 6 }]}>
        <BackPill onPress={goBack} size={28} bgColor="rgba(255,255,255,0.10)" iconOffsetX={-1} />
        <Text style={styles.pageTitle}>Búsqueda</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Pills de filtro + Limpiar todo */}
      <View style={styles.filterRow}>
        <Pressable
          testID="search-category-filter"
          onPress={() => setCatSheetOpen(true)}
          style={({ pressed }) => [
            styles.filterPill,
            {
              backgroundColor: "rgba(0,0,0,0.16)",
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Text style={[styles.filterPillText, { color: "#F9F9F9" }]} numberOfLines={1}>
            {selectedCat ?? "Categoría"}
          </Text>
          <Feather name="chevron-down" size={14} color="#F9F9F9" />
        </Pressable>
        <Pressable
          testID="search-duration-filter"
          onPress={() => setDurSheetOpen(true)}
          style={({ pressed }) => [
            styles.filterPill,
            {
              borderWidth: selectedDur ? 0 : 1,
              borderColor: "rgba(80,42,247,0.1)",
              backgroundColor: selectedDur ? tc.pillActiveBg : "rgba(255,255,255,0.03)",
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Text style={[styles.filterPillText, { color: selectedDur ? tc.pillActiveText : "#F4F4F4" }]} numberOfLines={1}>
            {selectedDur ?? "Tiempo"}
          </Text>
          <Feather name="chevron-down" size={14} color={selectedDur ? tc.pillActiveText : "#F4F4F4"} />
        </Pressable>
        <View style={{ flex: 1 }} />
        {hasFilters && (
          <Pressable onPress={clearAll} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <Text style={[styles.clearAllText, { color: "#f9f9f9" }]}>Limpiar todo</Text>
          </Pressable>
        )}
      </View>

      {/* Resultados */}
      {!hasFilters ? (
        <View testID="search-initial-placeholder" style={[styles.empty, styles.initialPlaceholderOffset]}>
          <Feather name="headphones" size={48} color="#F9F9F9" style={{ marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>Encuentra tus sesiones favoritas</Text>
          <Text style={styles.emptySub}>Filtra por categoría y tiempo</Text>
        </View>
      ) : (
        <FlatList
          showsVerticalScrollIndicator={false}
          data={results}
          keyExtractor={(s) => s.id}
          numColumns={2}
          columnWrapperStyle={styles.resultGridRow}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[styles.resultsContent, { paddingBottom: 40 + insets.bottom }]}
          ListEmptyComponent={
            <View style={[styles.empty, { width: windowWidth - H_PAD * 2 }]}>
              <Feather name="search" size={36} color="rgba(242,231,228,0.45)" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>Sin resultados</Text>
              <Text style={styles.emptySub}>Prueba con otra categoría o duración</Text>
            </View>
          }
          renderItem={({ item }) => {
            const authorName = getSessionAuthor(item);
            return (
              <Pressable
                onPress={() => handleSessionPress(item)}
                style={({ pressed }) => [styles.resultCard, { width: resultCardWidth, opacity: pressed ? 0.7 : 1 }]}
              >
                <View style={styles.resultImageWrap}>
                  <Image source={item.image as number} style={styles.resultImage} contentFit="cover" />
                  {item.isPremium && !isPremium && (
                    <View style={styles.premiumBadge}>
                      <Feather name="star" size={12} color="#F9F9F9" />
                    </View>
                  )}
                </View>
                <Text style={styles.resultCat} numberOfLines={1}>{item.categoryLabel}</Text>
                <Text style={styles.resultTitle} numberOfLines={2}>{item.title}</Text>
                {authorName && <Text style={styles.resultAuthor} numberOfLines={1}>{authorName}</Text>}
              </Pressable>
            );
          }}
        />
      )}

      {/* Sheets */}
      <FilterSheet
        visible={catSheetOpen}
        title="Categoría"
        options={CATEGORY_OPTIONS.map((c) => c.label)}
        selected={selectedCat}
        onSelect={(v) => setSelectedCat(v as CategoryLabel)}
        onClear={() => setSelectedCat(null)}
        onClose={() => setCatSheetOpen(false)}
      />
      <FilterSheet
        visible={durSheetOpen}
        title="Tiempo"
        options={DURATION_SLOTS.map((s) => s.label)}
        selected={selectedDur}
        onSelect={(v) => setSelectedDur(v as DurSlotLabel)}
        onClear={() => setSelectedDur(null)}
        onClose={() => setDurSheetOpen(false)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: H_PAD - 8,
    paddingBottom: 8,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  pageTitle: {
    fontFamily: "Manrope",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.3,
    color: "#F4F4F4",
    textAlign: "center",
  },

  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: H_PAD,
    paddingTop: 14,
    paddingBottom: 10,
  },
  filterPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 27,
    paddingHorizontal: 16,
    height: 51,
  },
  filterPillText: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600" },
  clearAllText: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600" },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingBottom: 80 },
  initialPlaceholderOffset: { transform: [{ translateY: -80 }] },
  emptyTitle: { fontFamily: "Manrope", fontSize: 18, fontWeight: "700", color: "#FBFBFB", textAlign: "center", marginBottom: 10 },
  emptySub: { fontFamily: "Manrope", fontSize: 14, color: "rgba(242,231,228,0.45)", textAlign: "center", lineHeight: 20 },

  resultsContent: { paddingHorizontal: H_PAD, paddingTop: 12 },
  resultGridRow: { gap: RESULT_CARD_GAP, marginBottom: 24 },
  resultCard: { alignSelf: "flex-start" },
  resultImageWrap: { width: "100%", aspectRatio: 1, borderRadius: 16, overflow: "hidden" },
  resultImage: { width: "100%", height: "100%" },
  premiumBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(6,10,15,0.72)",
    borderRadius: 9,
    padding: 3,
  },
  resultCat: { fontFamily: "Manrope", fontSize: 11, lineHeight: 15, color: "#F9F9F9", marginTop: 8 },
  resultTitle: { fontFamily: "Manrope", fontSize: 14, lineHeight: 18, fontWeight: "700", color: "#F9F9F9", marginTop: 2 },
  resultAuthor: { fontFamily: "Manrope", fontSize: 11, lineHeight: 15, color: "rgba(249,249,249,0.82)", marginTop: 2 },
});

const sheetStyles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, justifyContent: "flex-end" },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: H_PAD,
    paddingTop: 18,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  title: { fontFamily: "Manrope", fontSize: 17, fontWeight: "700", color: "#F9F9F9" },
  closeBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  option: {
    width: OPTION_W,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: { fontFamily: "Manrope", fontSize: 14, fontWeight: "600", color: "#F9F9F9" },
  selectedCheck: { position: "absolute", right: 12 },
  clearBtn: { alignSelf: "center", marginTop: 22, paddingVertical: 6, paddingHorizontal: 12 },
  clearText: { fontFamily: "Manrope", fontSize: 14, fontWeight: "600", color: "#F9F9F9" },
});
