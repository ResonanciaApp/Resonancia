import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CategoryScreenHeader } from "@/components/CategoryScreenHeader";
import { SessionCarousel } from "@/components/SessionCarousel";
import { useAmbientalDuration } from "@/context/AmbientalDurationContext";
import { useBackOverride } from "@/context/BackOverrideContext";
import { useCatalog } from "@/context/CatalogContext";
import { useCategoryOverlayOptional } from "@/context/CategoryOverlayContext";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import {
  getCategoryEditorialTags,
  getCategorySessionTags,
} from "@/data/category-tabs";
import { CATEGORIES } from "@/data/categories";
import { getSessionsByCategory, type Session } from "@/data/sessions";
import { useSoundPreview } from "@/hooks/useSoundPreview";

const H_PAD = 20;
type DurationFilter = "all" | "duration-5" | "duration-10" | "duration-11";
type FilterId = DurationFilter | `editorial:${string}`;

function durationMinutes(label: string) {
  const match = label.match(/(\d+(?:[.,]\d+)?)\s*min/i);
  if (match) return Number(match[1].replace(",", "."));
  const parts = label.split(":").map(Number);
  if (parts.length === 2 && parts.every(Number.isFinite)) return parts[0] + parts[1] / 60;
  return Number.parseFloat(label.replace(",", "."));
}

function decodeRoutePart(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

function tagsForSession(session: Session, categoryId: string) {
  return getCategorySessionTags(session, categoryId);
}

function FilterTabs({
  editorialTags,
  active,
  onSelect,
}: {
  editorialTags: string[];
  active: FilterId;
  onSelect: (filter: FilterId) => void;
}) {
  const tabs: { id: FilterId; label: string }[] = [
    { id: "all", label: "Ver todo" },
    { id: "duration-5", label: "5 min" },
    { id: "duration-10", label: "10 min" },
    { id: "duration-11", label: "11+ min" },
    ...editorialTags.map((tag) => ({
      id: `editorial:${tag}` as const,
      label: tag,
    })),
  ];
  return (
    <View style={styles.chipRowWrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRowContent}>
        {tabs.map((tab) => (
          <Pressable
            key={tab.id}
            onPress={() => onSelect(tab.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active === tab.id }}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <View style={[styles.chip, active === tab.id && styles.chipSelected]}>
              <Text style={[styles.chipText, active === tab.id && styles.chipTextSelected]}>{tab.label}</Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}

export default function CategoryTagScreen({
  categoryId: categoryProp,
  tag: tagProp,
}: {
  categoryId?: string;
  tag?: string;
} = {}) {
  const params = useLocalSearchParams<{ category?: string | string[]; tag?: string | string[] }>();
  const rawCategory = categoryProp ?? params.category;
  const rawTag = tagProp ?? params.tag;
  const categoryId = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory;
  const tag = Array.isArray(rawTag) ? rawTag[0] : rawTag;
  const decodedCategory = categoryId ? decodeRoutePart(categoryId) : "";
  const decodedTag = tag ? decodeRoutePart(tag) : "";
  const { version } = useCatalog();
  const { theme } = useSceneTheme();
  const { isPremium } = usePremium();
  const { playSession } = usePlayer();
  const { openForSession } = useAmbientalDuration();
  const soundPreview = useSoundPreview();
  const overlay = useCategoryOverlayOptional();
  const backOverride = useBackOverride();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [activeFilter, setActiveFilter] = useState<FilterId>("all");
  const [stickyActive, setStickyActive] = useState(false);
  const [tabsOffsetY, setTabsOffsetY] = useState(Number.POSITIVE_INFINITY);
  const stickyOpacity = useRef(new Animated.Value(0)).current;

  const category = CATEGORIES.find((candidate) => candidate.id === decodedCategory);
  const sessions = useMemo(
    () => getSessionsByCategory(decodedCategory).filter((session) => tagsForSession(session, decodedCategory).includes(decodedTag)),
    [decodedCategory, decodedTag, version],
  );
  const editorialTags = useMemo(
    () => [...new Set(sessions.flatMap((session) => getCategoryEditorialTags(session, decodedCategory)))],
    [decodedCategory, sessions],
  );
  const filteredSessions = useMemo(() => sessions.filter((session) => {
    if (activeFilter === "all") return true;
    if (activeFilter.startsWith("editorial:")) {
      const editorialTag = activeFilter.slice("editorial:".length);
      return getCategoryEditorialTags(session, decodedCategory).includes(editorialTag);
    }
    const minutes = durationMinutes(session.durationLabel);
    if (activeFilter === "duration-5") return minutes <= 5;
    if (activeFilter === "duration-10") return minutes > 5 && minutes <= 10;
    return minutes > 10;
  }), [activeFilter, sessions]);

  useEffect(() => {
    setActiveFilter("all");
  }, [decodedCategory, decodedTag]);
  useEffect(() => {
    Animated.timing(stickyOpacity, {
      toValue: stickyActive ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [stickyActive, stickyOpacity]);
  useEffect(() => () => soundPreview.stop(), [soundPreview.stop]);

  if (!decodedCategory || !decodedTag) return null;
  const title = decodedTag;
  const goBack = backOverride ?? (() => router.back());
  const openSession = (session: Session) => {
    if (session.isPremium && !isPremium) {
      router.push("/membresia" as never);
      return;
    }
    if (decodedCategory === "ambientales" && openForSession(session)) return;
    if (session.skipMiniPlayer) {
      playSession(session);
      return;
    }
    if (session.skipDetail || decodedCategory === "sonidos-ancestrales") {
      playSession(session);
      router.push("/player" as never);
      return;
    }
    if (overlay) {
      overlay.openCategory(`/session/${session.id}`);
    } else {
      router.push(`/session/${session.id}` as never);
    }
  };

  const list = filteredSessions.length > 0 ? (
    <SessionCarousel
      title=""
       sessions={filteredSessions}
      isPremium={isPremium}
      onPress={openSession}
      style={styles.sessionGrid}
      showHeader={false}
      gridLayout
      fillGridWidth
      gridScrollEnabled={false}
      eagerRender
      presentation="editorial"
      disableAmbientalVariant={decodedCategory !== "ambientales"}
      sleepMetadataBelow={decodedCategory !== "ambientales"}
      categoryGridPresentation={decodedCategory !== "ambientales"}
      whiteMetadataGlass={decodedCategory !== "ambientales"}
      showDurationClock={decodedCategory !== "ambientales"}
      hideCategoryAboveTitle={decodedCategory !== "ambientales"}
      showSleepCategoryPillWithInlineDuration={decodedCategory !== "ambientales"}
      ambientalTitleOnly={decodedCategory === "ambientales"}
      soundPreview={decodedCategory === "ambientales" ? {
        activeId: soundPreview.activeId,
        isPlaying: soundPreview.isPlaying,
        progress: soundPreview.progress,
        onToggle: soundPreview.toggle,
      } : undefined}
    />
  ) : (
    <View style={styles.emptyState}>
      <Feather name="headphones" size={30} color="#F9F9F9" />
       <Text style={styles.emptyTitle}>{sessions.length === 0 ? "Próximamente" : "Sin resultados"}</Text>
      <Text style={styles.emptyText}>
         {sessions.length === 0 ? "Estamos preparando nuevas sesiones para esta etiqueta." : "No hay sesiones para este filtro."}
      </Text>
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.gradient[theme.gradient.length - 1] as string }]}>
      <StatusBar hidden />
      <LinearGradient colors={theme.gradient as unknown as [string, string, ...string[]]} locations={theme.gradientLocations} style={StyleSheet.absoluteFill} />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 80 + bottomPad }}
        scrollEventThrottle={16}
        onScroll={(event) => {
          const active = event.nativeEvent.contentOffset.y > tabsOffsetY - topPad - 8;
          if (active !== stickyActive) setStickyActive(active);
        }}
      >
        <View style={[styles.header, { paddingTop: topPad + 8 }]}>
          <Pressable onPress={goBack} hitSlop={10} style={[styles.backButton, { top: topPad + 3 }]}>
            <Feather name="chevron-left" size={26} color="#FBFBFB" />
          </Pressable>
          <CategoryScreenHeader categoryId={decodedCategory} title={title} description={category?.subtitle} />
        </View>
        <View style={styles.tabsArea} onLayout={(event) => setTabsOffsetY(event.nativeEvent.layout.y)}>
          <FilterTabs editorialTags={editorialTags} active={activeFilter} onSelect={setActiveFilter} />
        </View>
        {list}
      </ScrollView>
      <Animated.View pointerEvents={stickyActive ? "auto" : "none"} style={[styles.stickyHeader, { paddingTop: topPad + 8, opacity: stickyOpacity, backgroundColor: theme.gradient[0] as string }]}>
        <View style={styles.stickyHeaderRow}>
          <View style={styles.stickySpacer} />
          <Text style={styles.stickyTitle} numberOfLines={1}>{title}</Text>
          <View style={styles.stickySpacer} />
        </View>
        <Pressable onPress={goBack} hitSlop={10} style={[styles.backButton, { top: topPad + 2 }]}>
          <Feather name="chevron-left" size={26} color="#FBFBFB" />
        </Pressable>
        <View style={styles.stickyTabs}>
          <FilterTabs editorialTags={editorialTags} active={activeFilter} onSelect={setActiveFilter} />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { minHeight: 48, paddingHorizontal: H_PAD, paddingBottom: 12, alignItems: "center", justifyContent: "center" },
  backButton: { position: "absolute", left: H_PAD, width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(0,0,0,0.28)", alignItems: "center", justifyContent: "center", zIndex: 2 },
  tabsArea: { paddingTop: 9, paddingBottom: 15, paddingHorizontal: H_PAD },
  chipRowWrapper: { marginHorizontal: -H_PAD },
  chipRowContent: { flexDirection: "row", gap: 8, paddingVertical: 2, paddingHorizontal: H_PAD },
  chip: { height: 46, paddingHorizontal: 16, borderRadius: 27, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.28)" },
  chipSelected: { backgroundColor: "#F9F9F9", borderWidth: 0 },
  chipText: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600", color: "#FBFBFB" },
  chipTextSelected: { color: "#060A0F" },
  sessionGrid: { marginTop: -17, marginBottom: 6 },
  emptyState: { marginHorizontal: H_PAD, marginTop: 28, minHeight: 180, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.25)", borderRadius: 18, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 28 },
  emptyTitle: { fontFamily: "Manrope", fontSize: 17, fontWeight: "700", color: "#FBFBFB" },
  emptyText: { fontFamily: "Manrope", fontSize: 13, lineHeight: 19, textAlign: "center", color: "#c2c2c2" },
  stickyHeader: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 20, minHeight: 48, paddingHorizontal: H_PAD, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.07)" },
  stickyHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 6 },
  stickySpacer: { width: 44 },
  stickyTitle: { flex: 1, textAlign: "center", fontFamily: "Manrope", fontSize: 20, lineHeight: 23, fontWeight: "700", color: "#FBFBFB" },
  stickyTabs: { marginTop: 19 },
});