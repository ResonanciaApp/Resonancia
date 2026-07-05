import { Feather } from "@expo/vector-icons";
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

import { SacredBackground } from "@/components/SacredBackground";
import { VideoCard } from "@/components/VideoCard";
import { useVideos } from "@/hooks/useVideos";
import { useColors } from "@/hooks/useColors";

const FILTER_CHIPS = ["Todos", "Movimiento", "Respiración", "Naturaleza", "Música"] as const;

type SortOption = "recientes" | "az" | "duracion";
const SORT_LABELS: Record<SortOption, string> = {
  recientes: "Más recientes",
  az: "Título (A-Z)",
  duracion: "Duración",
};

function parseDurationToSeconds(label: string): number {
  const [m, s] = label.split(":").map((n) => parseInt(n, 10) || 0);
  return m * 60 + s;
}

export default function VideoTabScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { videos, isLoading } = useVideos();

  const [query, setQuery] = useState("");
  const [activeChip, setActiveChip] = useState<(typeof FILTER_CHIPS)[number]>("Todos");
  const [sortOpen, setSortOpen] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>("recientes");
  const sortBtnRef = useRef<View>(null);
  const [sortMenuPos, setSortMenuPos] = useState({ top: 0, right: 0 });

  const topPad = Platform.OS === "web" ? 16 : insets.top;
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = q
      ? videos.filter(
          (v) =>
            v.title.toLowerCase().includes(q) ||
            (v.author ?? "").toLowerCase().includes(q),
        )
      : videos;

    if (sortBy === "az") {
      list = [...list].sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === "duracion") {
      list = [...list].sort(
        (a, b) => parseDurationToSeconds(a.durationLabel) - parseDurationToSeconds(b.durationLabel),
      );
    }

    return list;
  }, [videos, query, sortBy]);

  const openSortMenu = () => {
    sortBtnRef.current?.measureInWindow((x, y, w, h) => {
      setSortMenuPos({
        top: y + h + 6,
        right: Dimensions.get("window").width - (x + w),
      });
      setSortOpen(true);
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Video</Text>

        <View style={styles.searchRow}>
          <View style={[styles.searchBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar videos"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.searchInput, { color: colors.foreground }]}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <Feather name="x-circle" size={15} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>

          <Pressable
            style={[styles.settingsBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            hitSlop={8}
            accessibilityLabel="Ajustes"
          >
            <Feather name="sliders" size={17} color={colors.foreground} />
          </Pressable>
        </View>

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
                style={[
                  styles.chip,
                  {
                    backgroundColor: sel ? colors.primary : colors.card,
                    borderColor: sel ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipText,
                    { color: sel ? colors.primaryForeground : colors.mutedForeground },
                  ]}
                >
                  {chip}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.resultsRow}>
          <Text style={[styles.resultsCount, { color: colors.mutedForeground }]}>
            {filtered.length} {filtered.length === 1 ? "resultado" : "resultados"}
          </Text>
          <Pressable ref={sortBtnRef} onPress={openSortMenu} style={styles.sortBtn} hitSlop={8}>
            <Text style={[styles.sortText, { color: colors.foreground }]}>{SORT_LABELS[sortBy]}</Text>
            <Feather name="chevron-down" size={14} color={colors.mutedForeground} />
          </Pressable>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 + bottomPad, paddingTop: 4, gap: 20 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.empty}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="film" size={36} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {query ? "Sin resultados" : "Próximamente"}
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              {query
                ? "Probá con otra búsqueda."
                : "Pronto vas a encontrar videos aquí."}
            </Text>
          </View>
        ) : (
          filtered.map((v) => <VideoCard key={v.id} video={v} width={Dimensions.get("window").width - 40} />)
        )}
      </ScrollView>

      <Modal visible={sortOpen} transparent animationType="fade" onRequestClose={() => setSortOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setSortOpen(false)}>
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
                  onPress={() => {
                    setSortBy(opt);
                    setSortOpen(false);
                  }}
                  style={styles.sortItem}
                >
                  <Text
                    style={[
                      styles.sortItemText,
                      { color: sel ? colors.accent : colors.foreground, fontWeight: sel ? "700" : "500" },
                    ]}
                  >
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
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 14, gap: 14 },
  pageTitle: { fontSize: 26, fontWeight: "700", letterSpacing: 0.4 },

  searchRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  searchBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    height: 44,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: "center",
    justifyContent: "center",
  },

  chipsRow: { gap: 8, paddingRight: 20 },
  chip: {
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipText: { fontSize: 13, fontWeight: "600" },

  resultsRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  resultsCount: { fontSize: 13 },
  sortBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  sortText: { fontSize: 13, fontWeight: "600" },

  empty: { alignItems: "center", paddingVertical: 80, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptySub: { fontSize: 13, textAlign: "center" },

  backdrop: { flex: 1 },
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
  sortItemText: { fontSize: 14 },
});
