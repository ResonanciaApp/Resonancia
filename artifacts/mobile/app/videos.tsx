import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Stack, router } from "expo-router";
import React, { useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
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
import { VIDEO_THEMES, type VideoTheme } from "@/data/videos";

const SEARCH_H = 60;  // search bar + vertical margins
const PILLS_H  = 50;  // pills row + vertical margins

export default function VideosScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { videos, isLoading } = useVideos();

  const topPad   = Platform.OS === "web" ? 16 : insets.top;
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;

  // header height = safe-area + back button row
  const HEADER_H = topPad + 46;

  const [selectedTheme, setSelectedTheme] = useState<VideoTheme | null>(null);
  const [searchQuery, setSearchQuery]     = useState("");

  const scrollY = useRef(new Animated.Value(0)).current;

  // The whole sticky area (search + pills) slides up by SEARCH_H
  const stickyTranslateY = scrollY.interpolate({
    inputRange: [0, SEARCH_H],
    outputRange: [0, -SEARCH_H],
    extrapolate: "clamp",
  });

  // Search bar fades out as it slides off
  const searchOpacity = scrollY.interpolate({
    inputRange: [0, SEARCH_H * 0.55],
    outputRange: [1, 0],
    extrapolate: "clamp",
  });

  const filtered = videos.filter((v) => {
    const matchTheme  = selectedTheme == null || v.theme === selectedTheme;
    const q = searchQuery.trim().toLowerCase();
    const matchSearch = q === ""
      || v.title.toLowerCase().includes(q)
      || (v.author?.toLowerCase().includes(q) ?? false);
    return matchTheme && matchSearch;
  });

  const hasFilter = !!selectedTheme || searchQuery.trim() !== "";

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      {/* ── Scrollable content ── */}
      <Animated.ScrollView
        style={StyleSheet.absoluteFill}
        contentContainerStyle={{
          paddingTop: HEADER_H + SEARCH_H + PILLS_H,
          paddingBottom: 80 + bottomPad,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true },
        )}
      >
        {isLoading ? (
          <View style={styles.empty}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="film" size={36} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {hasFilter ? "Sin resultados" : "Próximamente"}
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              {hasFilter
                ? "Probá con otra búsqueda o categoría."
                : "Pronto vas a encontrar videos aquí."}
            </Text>
          </View>
        ) : (
          filtered.map((v) => <VideoCard key={v.id} video={v} horizontal />)
        )}
      </Animated.ScrollView>

      {/* ── Fixed header: back btn only ── */}
      <View style={[styles.header, { paddingTop: topPad + 4, height: HEADER_H }]}
        pointerEvents="box-none"
      >
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="chevron-left" size={26} color={colors.foreground} />
        </Pressable>
      </View>

      {/* ── Sticky area: search (hides) + pills (stick) ── */}
      <Animated.View
        style={[
          styles.stickyArea,
          { top: HEADER_H, transform: [{ translateY: stickyTranslateY }] },
        ]}
        pointerEvents="box-none"
      >
        {/* Search bar */}
        <Animated.View
          style={[styles.searchWrap, { opacity: searchOpacity }]}
        >
          <BlurView intensity={40} tint="light" style={[styles.searchBar, { overflow: "hidden", borderColor: "rgba(255,255,255,0.18)", borderWidth: 1 }]}>
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255,255,255,0.13)" }]} />
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="Buscar videos..."
              placeholderTextColor={colors.mutedForeground}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery("")} hitSlop={8}>
                <Feather name="x-circle" size={15} color={colors.mutedForeground} />
              </Pressable>
            )}
          </BlurView>
        </Animated.View>

        {/* Category pills — full-bleed horizontal scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.pillsScroll}
          contentContainerStyle={styles.pillsContent}
        >
          <Pressable
            onPress={() => setSelectedTheme(null)}
            style={[styles.pill, selectedTheme === null && styles.pillSel]}
          >
            {selectedTheme === null && <LinearGradient colors={["rgb(247,203,107)", "rgb(251,169,128)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
            <Text style={[styles.pillText, { color: selectedTheme === null ? "#2D0D3A" : colors.mutedForeground }]}>
              Todos
            </Text>
          </Pressable>

          {VIDEO_THEMES.map((t) => (
            <Pressable
              key={t}
              onPress={() => setSelectedTheme(selectedTheme === t ? null : t)}
              style={[styles.pill, selectedTheme === t && styles.pillSel]}
            >
              {selectedTheme === t && <LinearGradient colors={["rgb(247,203,107)", "rgb(251,169,128)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />}
              <Text style={[styles.pillText, { color: selectedTheme === t ? "#2D0D3A" : colors.mutedForeground }]}>
                {t}
              </Text>
            </Pressable>
          ))}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 4,
    zIndex: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },

  stickyArea: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 10,
  },

  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 8,
    height: SEARCH_H,
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    paddingHorizontal: 18,
    height: 45,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },

  pillsScroll: {
    height: PILLS_H,
  },
  pillsContent: {
    paddingHorizontal: 16,
    alignItems: "center",
    gap: 8,
  },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.035)",
    borderWidth: 2,
    borderColor: "rgba(244,244,244,0.1)",
  },
  pillSel: { borderWidth: 0 },
  pillText: {
    fontSize: 13,
    fontWeight: "600",
  },

  empty: { alignItems: "center", paddingVertical: 80, gap: 10 },
  emptyTitle: { fontSize: 16, fontWeight: "700" },
  emptySub: { fontSize: 13, textAlign: "center" },
});
