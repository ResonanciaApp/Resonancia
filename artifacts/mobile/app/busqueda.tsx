import { Feather } from "@expo/vector-icons";
import { BackPill } from "@/components/BackPill";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
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
  TextInput,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CardTint } from "@/components/CardTint";
import { SESSIONS, type Session } from "@/data/sessions";
import { getArtist } from "@/data/artists";
import { getGuide } from "@/data/guides";
import { usePremium } from "@/context/PremiumContext";
import { usePlayer } from "@/context/PlayerContext";
import { useSceneTheme } from "@/context/SceneThemeContext";

const { width } = Dimensions.get("window");
const H_PAD = 20;

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
  bg: string;         // fondo raíz
  sheetBg: string;    // fondo del bottom sheet
  accent: string;     // color de acento (borde, seleccionado, dorado equivalente)
  accentBg: string;   // fondo de opción seleccionada (accent + alpha)
  pillActiveBg: string; // fondo de pill activa
  pillActiveText: string; // texto de pill activa (legible sobre pillActiveBg)
  borderFaint: string;  // borde sutil
};

function deriveThemeColors(solid: string, gradient: readonly [string, string, ...string[]]): ThemeColors {
  const lastStop = gradient[gradient.length - 1];
  const accent = brighten(lastStop, 2.8);
  return {
    bg: solid,
    sheetBg: brighten(solid, 1.35),
    accent,
    accentBg: accent + "18",
    // Pills activas siempre #f9f9f9 con texto oscuro (igual en todos los temas)
    pillActiveBg: "#f9f9f9",
    pillActiveText: "#1B060F",
    borderFaint: accent + "44",
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
  tc,
  gradient,
}: {
  visible: boolean;
  title: string;
  options: readonly string[];
  selected: string | null;
  onSelect: (v: string) => void;
  onClear: () => void;
  onClose: () => void;
  tc: ThemeColors;
  gradient: readonly [string, string, ...string[]];
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.55)" }]} onPress={onClose} />
        <View style={sheetStyles.container} pointerEvents="box-none">
          {/* Degradado del tema como fondo del sheet: mismo orden que Inicio */}
          <LinearGradient
            colors={gradient as unknown as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[sheetStyles.sheet, {
              paddingBottom: (Platform.OS === "web" ? 24 : insets.bottom) + 20,
            }]}
          >
            <View style={sheetStyles.headerRow}>
              <Text style={[sheetStyles.title, { color: tc.accent }]}>{title}</Text>
              <Pressable onPress={onClose} hitSlop={10} style={sheetStyles.closeBtn}>
                <Feather name="x" size={20} color={tc.accent} />
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
                        borderColor: sel ? tc.accent : tc.borderFaint,
                        backgroundColor: sel ? tc.accentBg : "rgba(255,255,255,0.04)",
                        borderWidth: sel ? 1.5 : 1,
                        opacity: pressed ? 0.75 : 1,
                      },
                    ]}
                  >
                    <Text style={[sheetStyles.optionText, { color: sel ? tc.accent : "#F4F4F4" }]} numberOfLines={1}>
                      {opt}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            <Pressable
              onPress={() => { onClear(); onClose(); }}
              style={({ pressed }) => [sheetStyles.clearBtn, { opacity: pressed ? 0.7 : 1 }]}
            >
              <Text style={[sheetStyles.clearText, { color: tc.accent }]}>Borrar</Text>
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
  const topPad = Platform.OS === "web" ? 56 : insets.top;
  const { tiempo: tiempoParam } = useLocalSearchParams<{ tiempo?: string }>();
  const tiempo = tiempoProp ?? tiempoParam;
  const overlayBack = useBackOverride();
  const goBack = () => (overlayBack ? overlayBack() : router.back());
  const { isPremium } = usePremium();
  const { playSession } = usePlayer();
  const { theme } = useSceneTheme();

  const tc = useMemo(() => deriveThemeColors(theme.solid, theme.gradient), [theme]);

  const initialDur = DURATION_SLOTS.find((s) => s.label === tiempo)?.label ?? null;
  const [q, setQ] = useState("");
  const [selectedCat, setSelectedCat] = useState<CategoryLabel | null>(null);
  const [selectedDur, setSelectedDur] = useState<DurSlotLabel | null>(initialDur);
  const [catSheetOpen, setCatSheetOpen] = useState(false);
  const [durSheetOpen, setDurSheetOpen] = useState(false);

  const hasFilters = q.trim().length > 0 || selectedCat !== null || selectedDur !== null;

  const results = useMemo(() => {
    if (!hasFilters) return [] as Session[];
    const term = q.trim().toLowerCase();
    const catId = CATEGORY_OPTIONS.find((c) => c.label === selectedCat)?.categoryId;
    const slot = DURATION_SLOTS.find((s) => s.label === selectedDur);
    return SESSIONS.filter((s) => {
      if (catId && s.categoryId !== catId) return false;
      if (slot && !(s.duration >= slot.min && s.duration <= slot.max)) return false;
      if (term) {
        const hit =
          s.title.toLowerCase().includes(term) ||
          s.categoryLabel.toLowerCase().includes(term) ||
          (s.subtitle ?? "").toLowerCase().includes(term);
        if (!hit) return false;
      }
      return true;
    });
  }, [q, selectedCat, selectedDur, hasFilters]);

  function handleSessionPress(s: Session) {
    const locked = s.isPremium && !isPremium;
    if (locked) { router.push("/membresia" as never); return; }
    if (s.skipMiniPlayer) { playSession(s); return; }
    if (s.skipDetail) { playSession(s); router.push("/player" as never); return; }
    router.push(`/session/${s.id}` as never);
  }

  function clearAll() {
    setQ("");
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

      {/* Barra de búsqueda */}
      <View style={styles.searchWrap}>
        <View style={[styles.searchBox, { borderColor: tc.borderFaint, overflow: "hidden" }]}>
          <CardTint />
          <Feather name="search" size={16} color="#F4F4F4" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar sesiones, músicas, sonidos..."
            placeholderTextColor="rgba(244,244,244,0.5)"
            value={q}
            onChangeText={setQ}
            returnKeyType="search"
            autoCorrect={false}
          />
          {q.length > 0 && (
            <Pressable onPress={() => setQ("")} hitSlop={10}>
              <Feather name="x" size={15} color="rgba(242,231,228,0.6)" />
            </Pressable>
          )}
        </View>
      </View>

      {/* Pills de filtro + Borrar todo */}
      <View style={styles.filterRow}>
        <Pressable
          onPress={() => setCatSheetOpen(true)}
          style={({ pressed }) => [
            styles.filterPill,
            {
              borderColor: selectedCat ? tc.accent : "rgba(80,42,247,0.1)",
              backgroundColor: selectedCat ? tc.pillActiveBg : "rgba(255,255,255,0.03)",
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Text style={[styles.filterPillText, { color: selectedCat ? tc.pillActiveText : "#F4F4F4" }]} numberOfLines={1}>
            {selectedCat ?? "Categoría"}
          </Text>
          <Feather name="chevron-down" size={14} color={selectedCat ? tc.pillActiveText : "#F4F4F4"} />
        </Pressable>
        <Pressable
          onPress={() => setDurSheetOpen(true)}
          style={({ pressed }) => [
            styles.filterPill,
            {
              borderColor: selectedDur ? tc.accent : "rgba(80,42,247,0.1)",
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
            <Text style={[styles.clearAllText, { color: "#f9f9f9" }]}>Borrar todo</Text>
          </Pressable>
        )}
      </View>

      {/* Resultados */}
      {!hasFilters ? (
        <View style={styles.empty}>
          <Feather name="headphones" size={48} color={tc.accent} style={{ marginBottom: 16 }} />
          <Text style={styles.emptyTitle}>Encuentra tus sesiones favoritas</Text>
          <Text style={styles.emptySub}>Busca por texto o filtra por categoría y tiempo</Text>
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(s) => s.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: H_PAD, paddingTop: 8, paddingBottom: 40 + insets.bottom }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather name="search" size={36} color="rgba(242,231,228,0.45)" style={{ marginBottom: 12 }} />
              <Text style={styles.emptyTitle}>Sin resultados</Text>
              <Text style={styles.emptySub}>Intenta con otro término o cambia los filtros</Text>
            </View>
          }
          renderItem={({ item }) => {
            const authorName = getSessionAuthor(item);
            return (
              <Pressable
                onPress={() => handleSessionPress(item)}
                style={({ pressed }) => [styles.resultRow, { opacity: pressed ? 0.7 : 1 }]}
              >
                <View>
                  <Image source={item.image as number} style={styles.thumb} contentFit="cover" />
                  {item.isPremium && !isPremium && (
                    <View style={styles.premiumBadge}>
                      <Feather name="star" size={9} color={tc.accent} />
                    </View>
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.resultCat} numberOfLines={1}>
                    {item.categoryLabel}{item.durationLabel ? ` · ${item.durationLabel}` : ""}
                  </Text>
                  <Text style={styles.resultTitle} numberOfLines={1}>{item.title}</Text>
                  {authorName && <Text style={styles.resultAuthor} numberOfLines={1}>{authorName}</Text>}
                </View>
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
        tc={tc}
        gradient={theme.gradient}
      />
      <FilterSheet
        visible={durSheetOpen}
        title="Tiempo"
        options={DURATION_SLOTS.map((s) => s.label)}
        selected={selectedDur}
        onSelect={(v) => setSelectedDur(v as DurSlotLabel)}
        onClear={() => setSelectedDur(null)}
        onClose={() => setDurSheetOpen(false)}
        tc={tc}
        gradient={theme.gradient}
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

  searchWrap: { paddingHorizontal: H_PAD, paddingTop: 8, paddingBottom: 4 },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 18,
    height: 45,
  },
  searchInput: { fontFamily: "Manrope", flex: 1, fontSize: 15, fontWeight: "300", color: "#FBFBFB", padding: 0 },

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
    gap: 6,
    borderRadius: 999,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 36,
  },
  filterPillText: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600" },
  clearAllText: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600" },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingBottom: 80 },
  emptyTitle: { fontFamily: "Manrope", fontSize: 18, fontWeight: "700", color: "#FBFBFB", textAlign: "center", marginBottom: 10 },
  emptySub: { fontFamily: "Manrope", fontSize: 14, color: "rgba(242,231,228,0.45)", textAlign: "center", lineHeight: 20 },

  resultRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 11 },
  thumb: { width: 75, height: 75, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.025)" },
  premiumBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(6,10,15,0.72)",
    borderRadius: 9,
    padding: 3,
  },
  resultCat: { fontFamily: "Manrope", fontSize: 12, color: "#f4f4f4", marginBottom: 3 },
  resultTitle: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700", color: "#FBFBFB", marginBottom: 3 },
  resultAuthor: { fontFamily: "Manrope", fontSize: 12, color: "#f4f4f4" },
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
  title: { fontFamily: "Manrope", fontSize: 17, fontWeight: "700" },
  closeBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  option: {
    width: OPTION_W,
    height: 48,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  optionText: { fontFamily: "Manrope", fontSize: 14, fontWeight: "600" },
  clearBtn: { alignSelf: "center", marginTop: 22, paddingVertical: 6, paddingHorizontal: 12 },
  clearText: { fontFamily: "Manrope", fontSize: 14, fontWeight: "600" },
});
