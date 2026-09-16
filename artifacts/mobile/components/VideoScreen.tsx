import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import { SymbolView } from "expo-symbols";
import { useBackOverride } from "@/context/BackOverrideContext";
import React, { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GeoUniverseBackground } from "@/components/GeoUniverseBackground";
import { ContextSearchModal } from "@/components/ContextSearchModal";
import { VideoActionsSheet } from "@/components/VideoActionsSheet";
import { VideoCard } from "@/components/VideoCard";
import { useVideos } from "@/hooks/useVideos";
import { useColors } from "@/hooks/useColors";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { isIndigoThemeId } from "@/config/scene-themes";
import type { VideoItem } from "@/data/videos";

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

const CHIPS_H  = 65;

interface Props {
  showBack?: boolean;
}

export function VideoScreen({ showBack = false }: Props) {
  const overlayBack = useBackOverride();
  const goBack = () => (overlayBack ? overlayBack() : router.back());
  const colors = useColors();
  const { theme: activeTheme, activeSceneId } = useSceneTheme();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { videos, isLoading } = useVideos();

  const [searchVisible, setSearchVisible] = useState(false);
  const [activeChip, setActiveChip]     = useState<(typeof FILTER_CHIPS)[number]>("Todos");
  const [sortOpen, setSortOpen]         = useState(false);
  const [sortBy, setSortBy]             = useState<SortOption>("popular");
  const [actionsVideo, setActionsVideo] = useState<VideoItem | null>(null);
  const sortBtnRef  = useRef<View>(null);
  const [sortMenuPos, setSortMenuPos]   = useState({ top: 0, left: 0 });

  const topPad    = Platform.OS === "web" ? 16 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;

  const filtered = useMemo(() => {
    let list = videos;

    if (activeChip !== "Todos") list = list.filter((v) => v.theme === activeChip);

    if (sortBy === "popular") list = [...list].sort((a, b) => (a.sortOrder ?? Number.MAX_SAFE_INTEGER) - (b.sortOrder ?? Number.MAX_SAFE_INTEGER));
    else if (sortBy === "puntuacion") list = [...list].sort((a, b) => (b.rating ?? 4.8) - (a.rating ?? 4.8));
    else if (sortBy === "novedades") list = [...list].sort((a, b) => parseInt(b.id, 10) - parseInt(a.id, 10));
    else if (sortBy === "corto") list = [...list].sort((a, b) => parseDurationToSeconds(a.durationLabel) - parseDurationToSeconds(b.durationLabel));
    else if (sortBy === "largo")  list = [...list].sort((a, b) => parseDurationToSeconds(b.durationLabel) - parseDurationToSeconds(a.durationLabel));

    return list;
  }, [videos, sortBy, activeChip]);

  const searchItems = useMemo(
    () =>
      videos.map((video) => ({
        id: video.id,
        title: video.title,
        meta: video.theme ?? undefined,
        subtitle: video.author,
        searchText: `${video.title} ${video.author ?? ""} ${video.theme ?? ""}`,
        image: video.thumbnail,
      })),
    [videos],
  );

  const openSortMenu = () => {
    sortBtnRef.current?.measureInWindow((x, y, w, h) => {
      setSortMenuPos({ top: y + h + 6, left: x });
      setSortOpen(true);
    });
  };

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <LinearGradient colors={activeTheme.gradient} style={StyleSheet.absoluteFill} />
      <GeoUniverseBackground />

      {/* ── Sticky header ── */}
      <View style={[styles.stickyHeader, { paddingTop: topPad + 2 }]}>
        {/* Title row */}
        <View style={styles.titleRow}>
          {showBack ? (
            <Pressable onPress={goBack} hitSlop={10} style={styles.backBtn}>
              <Feather
                name="chevron-left"
                size={28}
                color="#F4F4F4"
                style={{ transform: [{ translateX: -1 }] }}
              />
            </Pressable>
          ) : (
            <View style={styles.backPlaceholder} />
          )}
          <Text style={[styles.pageTitle, { color: "#F4F4F4" }]}>Videos</Text>
          <Pressable
            onPress={() => setSearchVisible(true)}
            hitSlop={10}
            style={styles.searchButton}
            accessibilityRole="button"
            accessibilityLabel="Buscar videos"
          >
            {Platform.OS === "ios" ? (
              <SymbolView name="magnifyingglass" tintColor="#F4F4F4" size={24} />
            ) : (
              <Feather name="search" size={24} color="#F4F4F4" />
            )}
          </Pressable>
        </View>

        {/* Chips row */}
        <View style={styles.chipsWrap}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipsScroll}
            contentContainerStyle={styles.chipsRow}
          >
            {FILTER_CHIPS.map((chip) => {
              const sel = chip === activeChip;
              return (
                <Pressable
                  key={chip}
                  onPress={() => setActiveChip(chip)}
                  style={[styles.chip, activeTheme.id === "tibet" && styles.chipTibet, isIndigoThemeId(activeSceneId) && styles.chipIndigo, sel && styles.chipSel]}
                >
                  {sel && isIndigoThemeId(activeSceneId) && (
                    <LinearGradient
                      colors={["#784576", "#50326E"]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  <Text style={[styles.chipText, { color: sel ? (isIndigoThemeId(activeSceneId) ? "#F9F9F9" : "#0D0A1E") : "#F4F4F4" }]}>
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
          paddingTop: 23,
          paddingBottom: 100 + bottomPad,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.resultsRow, { marginBottom: 15 }]}>
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
              {activeChip !== "Todos" ? "Sin resultados" : "Próximamente"}
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              {activeChip !== "Todos"
                ? "Probá con otra categoría."
                : "Pronto vas a encontrar videos aquí."}
            </Text>
          </View>
        ) : (
          filtered.map((v) => (
            <VideoCard key={v.id} video={v} feed onOptionsPress={() => setActionsVideo(v)} />
          ))
        )}
      </ScrollView>

      <ContextSearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        items={searchItems}
        placeholder="Buscar videos..."
        emptyTitle="Encuentra un video"
        emptySubtitle="Busca por título, artista o tema"
        showDurationFilters={false}
        onSelect={(item) => {
          setSearchVisible(false);
          router.push(`/video/${item.id}` as never);
          return true;
        }}
      />

      {/* Sort menu */}
      <Modal visible={sortOpen} transparent animationType="fade" onRequestClose={() => setSortOpen(false)}>
        <Pressable style={StyleSheet.absoluteFill} onPress={() => setSortOpen(false)}>
          <View
            style={[
              styles.sortMenu,
              { top: sortMenuPos.top, left: sortMenuPos.left, borderColor: colors.border },
            ]}
          >
            <View pointerEvents="none" style={styles.sortMenuGlassSurface}>
              <BlurView
                intensity={32}
                tint="dark"
                experimentalBlurMethod="dimezisBlurView"
                style={StyleSheet.absoluteFill}
              />
              <View style={[StyleSheet.absoluteFill, styles.sortMenuGlassTint]} />
            </View>
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

      {/* ── Menú "..." ── */}
      <VideoActionsSheet
        video={actionsVideo}
        visible={actionsVideo !== null}
        onClose={() => setActionsVideo(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#210911" },

  stickyHeader: { backgroundColor: "transparent" },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    paddingBottom: 12,
    paddingTop: 7,
    gap: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  backPlaceholder: { width: 40, height: 40 },
  searchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  pageTitle: {
    flex: 1,
    fontFamily: "Manrope",
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    letterSpacing: 0.2,
    color: "#F4F4F4",
    textAlign: "center",
  },

  chipsWrap: { height: CHIPS_H, justifyContent: "center" },
  chipsScroll: { overflow: "visible" },
  chipsRow: {
    paddingHorizontal: 16,
    paddingVertical: 7,
    gap: 8,
    alignItems: "center",
  },
  chip: {
    borderRadius: 27,
    paddingHorizontal: 16,
    height: 51,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  chipTibet: { backgroundColor: "rgba(0,0,0,0.28)" },
  chipIndigo: { backgroundColor: "rgba(0,0,0,0.28)" },
  chipSel: { borderColor: "transparent", backgroundColor: "#F9F9F9" },
  chipText: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600" },

  resultsRow: { flexDirection: "row", alignItems: "center" },
  sortBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  sortText: { fontFamily: "Manrope", fontSize: 11, fontWeight: "400" },

  empty: { alignItems: "center", paddingVertical: 80, gap: 10 },
  emptyTitle: { fontFamily: "Manrope", fontSize: 16, fontWeight: "700" },
  emptySub: { fontFamily: "Manrope", fontSize: 13, textAlign: "center" },

  sortMenu: {
    position: "absolute",
    minWidth: 190,
    backgroundColor: "transparent",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: 6,
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },
  sortMenuGlassSurface: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 12,
    overflow: "hidden",
  },
  sortMenuGlassTint: {
    backgroundColor: "#0E0821",
    opacity: 0.42,
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
