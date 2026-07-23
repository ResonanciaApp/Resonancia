import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Stack } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GeoUniverseBackground } from "@/components/GeoUniverseBackground";
import { VideoCard } from "@/components/VideoCard";
import { CardTint } from "@/components/CardTint";
import { useVideos } from "@/hooks/useVideos";
import { useColors } from "@/hooks/useColors";
import { useSceneTheme } from "@/context/SceneThemeContext";

const CHIP_BORDER = "rgba(255,255,255,0.1)";
const FILTER_CHIPS = ["Todos", "Movimiento", "Respiración", "Naturaleza", "Música"] as const;

type SortOption = "popular" | "puntuacion" | "novedades" | "corto" | "largo";
const SORT_LABELS: Record<SortOption, string> = {
  popular:    "Popular",
  puntuacion: "Máxima puntuación",
  novedades:  "Novedades",
  corto:      "Más corto",
  largo:      "El más largo",
};

function parseDurationToSeconds(label: string): number {
  const [m, s] = label.split(":").map((n) => parseInt(n, 10) || 0);
  return m * 60 + s;
}

// Heights of each sticky section
const SEARCH_H = 63; // search box + top/bottom margin
const CHIPS_H  = 52; // chips row + top/bottom margin

export default function VideoTabScreen() {
  const colors = useColors();
  const { theme: activeTheme } = useSceneTheme();
  const insets = useSafeAreaInsets();
  const { videos, isLoading } = useVideos();

  const [query, setQuery]         = useState("");
  const [activeChip, setActiveChip] = useState<(typeof FILTER_CHIPS)[number]>("Todos");
  const [sortOpen, setSortOpen]   = useState(false);
  const [sortBy, setSortBy]       = useState<SortOption>("popular");
  const sortBtnRef  = useRef<View>(null);
  const [sortMenuPos, setSortMenuPos] = useState({ top: 0, right: 0 });

  const topPad    = Platform.OS === "web" ? 16 : insets.top;
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;


  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = q
      ? videos.filter(
          (v) => v.title.toLowerCase().includes(q) || (v.author ?? "").toLowerCase().includes(q),
        )
      : videos;

    if (activeChip !== "Todos") list = list.filter((v) => v.theme === activeChip);

    if (sortBy === "puntuacion") list = [...list].sort((a, b) => (b.rating ?? 4.8) - (a.rating ?? 4.8));
    else if (sortBy === "novedades") list = [...list].sort((a, b) => parseInt(b.id, 10) - parseInt(a.id, 10));
    else if (sortBy === "corto") list = [...list].sort((a, b) => parseDurationToSeconds(a.durationLabel) - parseDurationToSeconds(b.durationLabel));
    else if (sortBy === "largo")  list = [...list].sort((a, b) => parseDurationToSeconds(b.durationLabel) - parseDurationToSeconds(a.durationLabel));

    return list;
  }, [videos, query, sortBy, activeChip]);

  const openSortMenu = () => {
    sortBtnRef.current?.measureInWindow((x, y, w, h) => {
      setSortMenuPos({ top: y + h + 6, right: Dimensions.get("window").width - (x + w) });
      setSortOpen(true);
    });
  };

  return (
    <View style={styles.root}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={activeTheme.gradient} style={StyleSheet.absoluteFill} />
      <GeoUniverseBackground />

      {/* ── Sticky header: normal flow — transparent over gradient ── */}
      <View style={[styles.stickyHeader, { paddingTop: topPad + 2 }]}>
        {/* Title row — igual que Perfil */}
        <View style={styles.titleRow}>
          <Text style={[styles.pageTitle, { color: "#F4F4F4" }]}>Videos</Text>
        </View>
        {/* Search bar */}
        <View style={styles.searchWrap}>
          <View style={[styles.searchBox, { backgroundColor: "rgba(0,0,0,0.2)", borderColor: "rgba(255,255,255,0.7)", borderWidth: 1 }]}>
            <Feather name="search" size={16} color="#F9F9F9" />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Titulo, voz guía, artista o tema"
              placeholderTextColor="#F9F9F9"
              style={[styles.searchInput, { color: colors.foreground }]}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <Feather name="x-circle" size={15} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Chips row */}
        <View style={styles.chipsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsRow}
          >
            {FILTER_CHIPS.map((chip) => {
              const sel = chip === activeChip;
              return (
                <Pressable
                  key={chip}
                  onPress={() => setActiveChip(chip)}
                  style={[styles.chip, sel && styles.chipSel]}
                >
                  {sel && <LinearGradient colors={["#FFFFFF", "#F5F5F5"]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />}
                  <Text style={[styles.chipText, { color: sel ? "#0D0A1E" : "#F4F4F4" }]}>
                    {chip}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      </View>

      {/* ── Scrollable content ── */}
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 19,
          paddingTop: 8,
          paddingBottom: 100 + bottomPad,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.resultsRow, { marginBottom: 15 }]}>
          <Text style={[styles.resultsCount, { color: colors.mutedForeground }]}>
            {filtered.length} {filtered.length === 1 ? "resultado" : "resultados"}
          </Text>
          <Pressable ref={sortBtnRef} onPress={openSortMenu} style={styles.sortBtn} hitSlop={8}>
            <Text style={[styles.sortText, { color: colors.foreground }]}>{SORT_LABELS[sortBy]}</Text>
            <Feather name="chevron-down" size={14} color={colors.mutedForeground} />
          </Pressable>
        </View>

        {isLoading ? (
          <View style={styles.empty}><ActivityIndicator color={colors.primary} /></View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="film" size={36} color="rgba(255,255,255,0.3)" />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {query || activeChip !== "Todos" ? "Sin resultados" : "Próximamente"}
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              {query || activeChip !== "Todos"
                ? "Probá con otra búsqueda o categoría."
                : "Pronto vas a encontrar videos aquí."}
            </Text>
          </View>
        ) : (
          filtered.map((v) => <VideoCard key={v.id} video={v} feed />)
        )}
      </ScrollView>

      {/* Sort menu */}
      <Modal visible={sortOpen} transparent animationType="fade" onRequestClose={() => setSortOpen(false)}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setSortOpen(false)}>
          <View
            style={[
              styles.sortMenu,
              { top: sortMenuPos.top, right: sortMenuPos.right, backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            {(Object.keys(SORT_LABELS) as SortOption[]).map((opt) => {
              const sel = sortBy === opt;
              return (
                <Pressable
                  key={opt}
                  onPress={() => { setSortBy(opt); setSortOpen(false); }}
                  style={styles.sortItem}
                >
                  <Text style={[styles.sortItemText, { color: sel ? colors.accent : colors.foreground, fontWeight: sel ? "700" : "500" }]}>
                    {SORT_LABELS[opt]}
                  </Text>
                  {sel && <Feather name="check" size={16} color={colors.accent} />}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#210911" },

  stickyHeader: {
    backgroundColor: "transparent",
  },
  titleRow: { alignItems: "stretch", paddingHorizontal: 19, paddingBottom: 10, paddingTop: 7 },
  pageTitle: { fontFamily: "Manrope", fontSize: 27, fontWeight: "700", letterSpacing: 0.3, color: "#F4F4F4", textAlign: "center", marginTop: 0, transform: [{ translateY: 1 }] },

  searchWrap: {
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 8,
    marginTop: 7,
    height: SEARCH_H,
    justifyContent: "center",
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    height: 45,
  },
  searchInput: { fontFamily: "Manrope", flex: 1, fontSize: 15, fontWeight: "300", padding: 0 },

  chipsWrap: { height: CHIPS_H, justifyContent: "center" },
  chipsRow: { paddingHorizontal: 19, gap: 8, alignItems: "center" },
  chipBorder: {},
  chipBorderSel: {},
  chip: {
    borderRadius: 999,
    paddingHorizontal: 13,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.053)",
    borderWidth: 1.5,
    borderColor: "rgba(247,203,107,0.1)",
  },
  chipSel: { borderWidth: 0 },
  chipText: { fontFamily: "Manrope", fontSize: 14, fontWeight: "450", letterSpacing: 0.3 },
  chipsDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.035)",
    marginHorizontal: 0,
    marginTop: 4,
  },

  resultsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  resultsCount: { fontFamily: "Manrope", fontSize: 11 },
  sortBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  sortText: { fontFamily: "Manrope", fontSize: 11, fontWeight: "400" },

  empty: { alignItems: "center", paddingVertical: 80, gap: 10 },
  emptyTitle: { fontFamily: "Manrope", fontSize: 16, fontWeight: "700" },
  emptySub: { fontFamily: "Manrope", fontSize: 13, textAlign: "center" },

  sortMenu: {
    position: "absolute",
    minWidth: 190,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  sortItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sortItemText: { fontFamily: "Manrope", fontSize: 14 },
});
