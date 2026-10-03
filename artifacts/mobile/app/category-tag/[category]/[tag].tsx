import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { SymbolView } from "expo-symbols";
import { router, useLocalSearchParams } from "expo-router";
import { openPremiumPlans } from "@/lib/premiumGate";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SessionCarousel } from "@/components/SessionCarousel";
import { ContextSearchModal } from "@/components/ContextSearchModal";
import {
  CategoryEditorialFilterTabs,
  type CategoryEditorialFilter,
} from "@/components/CategoryEditorialFilterTabs";
import { useAmbientalDuration } from "@/context/AmbientalDurationContext";
import { useBackOverride } from "@/context/BackOverrideContext";
import { useCatalog } from "@/context/CatalogContext";
import { useCategoryOverlayOptional } from "@/context/CategoryOverlayContext";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import {
  getCategoryEditorialTags,
  getCategoryTagRouteNamespace,
  getCategorySessionTags,
} from "@/data/category-tabs";
import { getCategoryPopularSearchTerms } from "@/data/category-search";
import { getSessionsByCategory, type Session } from "@/data/sessions";
import { useSoundPreview } from "@/hooks/useSoundPreview";

const H_PAD = 20;
const HEADER_H_PAD = 14;
const { height: SCREEN_HEIGHT } = Dimensions.get("window");
type FilterId = CategoryEditorialFilter;

function decodeRoutePart(value: string) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export default function CategoryTagScreen({
  categoryId: categoryProp,
  tag: tagProp,
  source: sourceProp,
}: {
  categoryId?: string;
  tag?: string;
  source?: "editorial";
} = {}) {
  const params = useLocalSearchParams<{
    category?: string | string[];
    tag?: string | string[];
    source?: string | string[];
  }>();
  const rawCategory = categoryProp ?? params.category;
  const rawTag = tagProp ?? params.tag;
  const categoryId = Array.isArray(rawCategory) ? rawCategory[0] : rawCategory;
  const tag = Array.isArray(rawTag) ? rawTag[0] : rawTag;
  const rawSource = sourceProp ?? params.source;
  const source = Array.isArray(rawSource) ? rawSource[0] : rawSource;
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
  const [searchVisible, setSearchVisible] = useState(false);
  const [stickyHeaderHeight, setStickyHeaderHeight] = useState(0);
  const stickyBorderOpacity = useRef(new Animated.Value(0)).current;
  const stickyBorderActiveRef = useRef(false);
  const handleScroll = React.useCallback((event: {
    nativeEvent: { contentOffset: { y: number } };
  }) => {
    const active = event.nativeEvent.contentOffset.y > 2;
    if (active === stickyBorderActiveRef.current) return;
    stickyBorderActiveRef.current = active;
    stickyBorderOpacity.stopAnimation();
    Animated.timing(stickyBorderOpacity, {
      toValue: active ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [stickyBorderOpacity]);

  const routeSessions = useMemo(
    () => getSessionsByCategory(decodedCategory),
    [decodedCategory, version],
  );
  const routeNamespace = useMemo(
    () => getCategoryTagRouteNamespace(
      routeSessions,
      decodedCategory,
      decodedTag,
      source === "editorial" ? "editorial" : undefined,
    ),
    [decodedCategory, decodedTag, routeSessions, source],
  );
  const sessions = useMemo(
    () => routeSessions.filter((session) =>
      routeNamespace === "legacy"
        ? getCategorySessionTags(session, decodedCategory).includes(decodedTag)
        : getCategoryEditorialTags(session, decodedCategory).includes(decodedTag),
    ),
    [decodedCategory, decodedTag, routeNamespace, routeSessions],
  );
  const editorialTags = useMemo(
    () => [...new Set(sessions.flatMap((session) => getCategoryEditorialTags(session, decodedCategory)))],
    [decodedCategory, sessions],
  );
  const searchItems = useMemo(
    () =>
      sessions.map((session) => ({
        id: session.id,
        title: session.title,
        meta: session.categoryLabel,
        subtitle: session.subtitle,
        searchText: [
          session.title,
          session.subtitle,
          session.categoryLabel,
          ...getCategorySessionTags(session, decodedCategory),
          ...getCategoryEditorialTags(session, decodedCategory),
        ].join(" "),
        image: session.image,
      })),
    [decodedCategory, sessions],
  );
  const popularSearchTerms = useMemo(
    () =>
      getCategoryPopularSearchTerms(
        sessions,
        decodedCategory,
        editorialTags,
      ),
    [decodedCategory, editorialTags, sessions],
  );
  const filteredSessions = useMemo(() => sessions.filter((session) => {
    if (activeFilter === "all") return true;
    if (activeFilter.startsWith("editorial:")) {
      const editorialTag = activeFilter.slice("editorial:".length);
      return getCategoryEditorialTags(session, decodedCategory).includes(editorialTag);
    }
    return true;
  }), [activeFilter, sessions]);

  useEffect(() => {
    setActiveFilter("all");
  }, [decodedCategory, decodedTag]);
  useEffect(() => {
    if (
      activeFilter.startsWith("editorial:") &&
      !editorialTags.includes(activeFilter.slice("editorial:".length))
    ) {
      setActiveFilter("all");
    }
  }, [activeFilter, editorialTags]);
  useEffect(() => () => soundPreview.stop(), [soundPreview.stop]);

  if (!decodedCategory || !decodedTag) return null;
  const title = decodedTag;
  const goBack = backOverride ?? (() => router.back());
  const openSession = (session: Session) => {
    if (session.isPremium && !isPremium) {
      openPremiumPlans();
      return;
    }
    if (
      decodedCategory === "ambientales" &&
      openForSession(session, { forceAmbiental: true })
    ) {
      return;
    }
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
      <LinearGradient
        colors={theme.gradient as unknown as [string, string, ...string[]]}
        locations={theme.gradientLocations}
        start={theme.gradientStart}
        end={theme.gradientEnd}
        style={StyleSheet.absoluteFill}
      />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: stickyHeaderHeight,
          paddingBottom: 80 + bottomPad,
        }}
        scrollEventThrottle={16}
        onScroll={handleScroll}
      >
        {list}
      </ScrollView>
      <View
        style={[styles.stickyHeader, { paddingTop: topPad + 4 }]}
        onLayout={(event) => setStickyHeaderHeight(event.nativeEvent.layout.height)}
      >
        <View pointerEvents="none" style={styles.stickyGradientClip}>
          <LinearGradient
            colors={theme.gradient as unknown as [string, string, ...string[]]}
            locations={theme.gradientLocations}
            start={theme.gradientStart}
            end={theme.gradientEnd}
            style={styles.stickyScreenGradient}
          />
        </View>
        <View style={styles.stickyHeaderRow}>
          <View style={styles.stickySpacer} />
          <Text style={styles.stickyTitle} numberOfLines={1}>{title}</Text>
          <View style={styles.stickySpacer}>
            <Pressable
              onPress={() => setSearchVisible(true)}
              hitSlop={10}
              style={styles.headerSearchButton}
              accessibilityRole="button"
              accessibilityLabel={`Buscar en ${title}`}
            >
              {Platform.OS === "ios" ? (
                <SymbolView name="magnifyingglass" tintColor="#FBFBFB" size={24} />
              ) : (
                <Feather name="search" size={24} color="#FBFBFB" />
              )}
            </Pressable>
          </View>
        </View>
        <Pressable
          onPress={goBack}
          hitSlop={10}
          style={({ pressed }) => [
            styles.backButton,
            {
              top: topPad + 4,
              opacity: pressed ? 0.7 : 1,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Feather name="chevron-left" size={28} color="#FBFBFB" style={{ transform: [{ translateX: -1 }] }} />
        </Pressable>
        {editorialTags.length > 0 && (
          <View style={styles.stickyTabs}>
            <CategoryEditorialFilterTabs
              editorialTags={editorialTags}
              active={activeFilter}
              onSelect={setActiveFilter}
            />
          </View>
        )}
        <Animated.View
          pointerEvents="none"
          style={[styles.stickyBottomBorder, { opacity: stickyBorderOpacity }]}
        />
      </View>
      <ContextSearchModal
        visible={searchVisible}
        fullThemeBackground
        onClose={() => setSearchVisible(false)}
        items={searchItems}
        placeholder={`Buscar en ${title}...`}
        emptyTitle={`Busca en ${title}`}
        emptySubtitle="Encuentra una sesión para ti"
        contextKey={`category:${decodedCategory}:${decodedTag}`}
        popularTerms={popularSearchTerms}
        onSelect={(item) => {
          const session = sessions.find((candidate) => candidate.id === item.id);
          if (session) openSession(session);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { minHeight: 48, paddingHorizontal: H_PAD, paddingBottom: 12, alignItems: "center", justifyContent: "center" },
  backButton: { position: "absolute", left: HEADER_H_PAD, width: 43, height: 43, borderRadius: 21.5, borderWidth: 0, borderColor: "transparent", backgroundColor: "rgba(0,0,0,0.16)", alignItems: "center", justifyContent: "center" },
  tabsArea: { paddingTop: 9, paddingBottom: 15, paddingHorizontal: H_PAD },
  chipRowWrapper: {},
  chipRowContent: { flexDirection: "row", gap: 8, paddingVertical: 2, paddingHorizontal: HEADER_H_PAD },
  chip: { height: 46, paddingHorizontal: 16, borderRadius: 27, borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.16)" },
  chipSelected: { backgroundColor: "#F9F9F9", borderWidth: 0 },
  chipText: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600", color: "#FBFBFB" },
  chipTextSelected: { color: "#060A0F" },
  sessionGrid: { marginTop: -2, marginBottom: 6 },
  emptyState: { marginHorizontal: H_PAD, marginTop: 28, minHeight: 180, borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.25)", borderRadius: 18, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 28 },
  emptyTitle: { fontFamily: "Manrope", fontSize: 17, fontWeight: "700", color: "#FBFBFB" },
  emptyText: { fontFamily: "Manrope", fontSize: 13, lineHeight: 19, textAlign: "center", color: "#c2c2c2" },
  stickyHeader: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 20, minHeight: 48, paddingHorizontal: HEADER_H_PAD, paddingBottom: 6 },
  stickyGradientClip: { ...StyleSheet.absoluteFillObject, overflow: "hidden" },
  stickyScreenGradient: { position: "absolute", top: 0, left: 0, right: 0, height: SCREEN_HEIGHT },
  stickyBottomBorder: { position: "absolute", left: 0, right: 0, bottom: 0, height: 1, backgroundColor: "rgba(255,255,255,0.07)" },
  stickyHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 6 },
  stickySpacer: { width: 40, alignItems: "center", justifyContent: "center" },
  headerSearchButton: {
     width: 43,
     height: 43,
     borderRadius: 21.5,
    borderWidth: 0,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
     backgroundColor: "rgba(0,0,0,0.16)",
  },
  stickyTitle: { flex: 1, textAlign: "center", fontFamily: "Manrope", fontSize: 18, lineHeight: 21, fontWeight: "700", color: "#FBFBFB", letterSpacing: 0.2 },
  stickyTabs: { marginTop: 13, marginHorizontal: -HEADER_H_PAD },
});