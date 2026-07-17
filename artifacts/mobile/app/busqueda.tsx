import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
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
  { label: "Sesiones",     categoryId: "sonidos-ancestrales" },
  { label: "Música",       categoryId: "musica-sonidos" },
  { label: "Dormir",       categoryId: "descanso" },
] as const;
type CategoryLabel = (typeof CATEGORY_OPTIONS)[number]["label"];

const OPTION_W = (width - H_PAD * 2 - 12) / 2;

function getSessionAuthor(s: Session): string | null {
  if (s.guideId) return getGuide(s.guideId).name;
  if (s.artistId) return getArtist(s.artistId).name;
  return s.subtitle ?? null;
}

// ── Bottom sheet de filtro (grilla 2 columnas) ─────────────────────────────
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
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={StyleSheet.absoluteFill}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.55)" }]} onPress={onClose} />
        <View style={sheetStyles.container} pointerEvents="box-none">
          <View style={[sheetStyles.sheet, { paddingBottom: (Platform.OS === "web" ? 24 : insets.bottom) + 20 }]}>
            <View style={sheetStyles.headerRow}>
              <Text style={sheetStyles.title}>{title}</Text>
              <Pressable onPress={onClose} hitSlop={10} style={sheetStyles.closeBtn}>
                <Feather name="x" size={20} color="#F4F4F4" />
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
                      sel && sheetStyles.optionSelected,
                      { opacity: pressed ? 0.75 : 1 },
                    ]}
                  >
                    <Text style={[sheetStyles.optionText, sel && sheetStyles.optionTextSelected]} numberOfLines={1}>
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
              <Text style={sheetStyles.clearText}>Borrar</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

// ── Pantalla de búsqueda ───────────────────────────────────────────────────
export default function BusquedaScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 56 : insets.top;
  const { tiempo } = useLocalSearchParams<{ tiempo?: string }>();
  const { isPremium } = usePremium();
  const { playSession } = usePlayer();

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
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Header: back + título centrado */}
      <View style={[styles.topBar, { paddingTop: topPad + 6 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Feather name="chevron-left" size={24} color="#F4F4F4" />
        </Pressable>
        <Text style={styles.pageTitle}>Búsqueda</Text>
        <View style={styles.backBtn} />
      </View>

      {/* Barra de búsqueda */}
      <View style={styles.searchWrap}>
        <View style={[styles.searchBox, { overflow: "hidden" }]}>
          <CardTint />
          <Feather name="search" size={16} color="#F4F4F4" />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar sesiones, músicas, sonidos..."
            placeholderTextColor="#F4F4F4"
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
          style={({ pressed }) => [styles.filterPill, selectedCat && styles.filterPillActive, { opacity: pressed ? 0.75 : 1 }]}
        >
          <Text style={[styles.filterPillText, selectedCat && styles.filterPillTextActive]} numberOfLines={1}>
            {selectedCat ?? "Categoría"}
          </Text>
          <Feather name="chevron-down" size={14} color={selectedCat ? "#1B060F" : "#F4F4F4"} />
        </Pressable>
        <Pressable
          onPress={() => setDurSheetOpen(true)}
          style={({ pressed }) => [styles.filterPill, selectedDur && styles.filterPillActive, { opacity: pressed ? 0.75 : 1 }]}
        >
          <Text style={[styles.filterPillText, selectedDur && styles.filterPillTextActive]} numberOfLines={1}>
            {selectedDur ?? "Tiempo"}
          </Text>
          <Feather name="chevron-down" size={14} color={selectedDur ? "#1B060F" : "#F4F4F4"} />
        </Pressable>
        <View style={{ flex: 1 }} />
        {hasFilters && (
          <Pressable onPress={clearAll} hitSlop={8} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
            <Text style={styles.clearAllText}>Borrar todo</Text>
          </Pressable>
        )}
      </View>

      {/* Resultados */}
      {!hasFilters ? (
        <View style={styles.empty}>
          <Feather name="headphones" size={48} color="#F7CB6B" style={{ marginBottom: 16 }} />
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
                      <Feather name="star" size={9} color="#F7CB6B" />
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#190913" },

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
    borderColor: "#ffffff",
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
    borderColor: "rgba(255,255,255,0.55)",
    paddingHorizontal: 14,
    height: 36,
  },
  filterPillActive: { backgroundColor: "#F7CB6B", borderColor: "#F7CB6B" },
  filterPillText: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600", color: "#F4F4F4" },
  filterPillTextActive: { color: "#1B060F" },
  clearAllText: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600", color: "#F7CB6B" },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, paddingBottom: 80 },
  emptyTitle: { fontFamily: "Manrope", fontSize: 18, fontWeight: "700", color: "#FBFBFB", textAlign: "center", marginBottom: 10 },
  emptySub: { fontFamily: "Manrope", fontSize: 14, color: "rgba(242,231,228,0.45)", textAlign: "center", lineHeight: 20 },

  resultRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 6 },
  thumb: { width: 75, height: 75, borderRadius: 14, backgroundColor: "rgba(255,255,255,0.025)" },
  premiumBadge: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(6,10,15,0.72)",
    borderRadius: 9,
    padding: 3,
  },
  resultCat: { fontFamily: "Manrope", fontSize: 12, color: "rgba(242,231,228,0.45)", marginBottom: 3 },
  resultTitle: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700", color: "#FBFBFB", marginBottom: 3 },
  resultAuthor: { fontFamily: "Manrope", fontSize: 12, color: "rgba(242,231,228,0.45)" },
});

const sheetStyles = StyleSheet.create({
  container: { ...StyleSheet.absoluteFillObject, justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#27070E",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: H_PAD,
    paddingTop: 18,
  },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 18 },
  title: { fontFamily: "Manrope", fontSize: 17, fontWeight: "700", color: "#FBFBFB" },
  closeBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  option: {
    width: OPTION_W,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center",
    justifyContent: "center",
  },
  optionSelected: { borderColor: "#F7CB6B", borderWidth: 1.5, backgroundColor: "rgba(247,203,107,0.08)" },
  optionText: { fontFamily: "Manrope", fontSize: 14, fontWeight: "600", color: "#F4F4F4" },
  optionTextSelected: { color: "#F7CB6B" },
  clearBtn: { alignSelf: "center", marginTop: 22, paddingVertical: 6, paddingHorizontal: 12 },
  clearText: { fontFamily: "Manrope", fontSize: 14, fontWeight: "600", color: "#F7CB6B" },
});
