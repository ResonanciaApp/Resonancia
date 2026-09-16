import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
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

import { ContextSearchModal } from "@/components/ContextSearchModal";
import { CategoryLandingSections } from "@/components/CategoryLandingSections";
import { useBackOverride } from "@/context/BackOverrideContext";
import { useCatalog } from "@/context/CatalogContext";
import { useCategoryOverlayOptional } from "@/context/CategoryOverlayContext";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useAmbientalDuration } from "@/context/AmbientalDurationContext";
import { CATEGORIES } from "@/data/categories";
import { getCategoryPopularSearchTerms } from "@/data/category-search";
import { getCategorySessionTags, getCategoryTabs } from "@/data/category-tabs";
import { getSessionsByCategory, type Session } from "@/data/sessions";
import { isIndigoThemeId } from "@/config/scene-themes";
import { useSoundPreview } from "@/hooks/useSoundPreview";

const H_PAD = 14;
const CARD_GAP = 12;
const TEXT = "#FBFBFB";
const MUTED = "#c2c2c2";

function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
    >
      <Animated.View
        style={[
          styles.chip,
          selected && styles.chipSelected,
        ]}
      >
        <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
          {label}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

function ChipRow({
  tabs,
  activeTab,
  onSelect,
}: {
  tabs: string[];
  activeTab: string | null | undefined;
  onSelect: (tab: string | null) => void;
}) {
  return (
    <View style={styles.chipRowWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        contentContainerStyle={styles.chipRowContent}
      >
        <Chip
          label="Ver todo"
          selected={activeTab === null}
          onPress={() => onSelect(null)}
        />
        {tabs.map((tab) => (
          <Chip
            key={tab}
            label={tab}
            selected={activeTab === tab}
            onPress={() => onSelect(tab)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

export default function CategoryScreen({ categoryId }: { categoryId?: string } = {}) {
  const { id: routeId } = useLocalSearchParams<{ id: string }>();
  const id = categoryId ?? routeId ?? "";
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { version } = useCatalog();
  const { activeSceneId, theme } = useSceneTheme();
  const { playSession } = usePlayer();
  const { openForSession } = useAmbientalDuration();
  const soundPreview = useSoundPreview();
  useFocusEffect(
    useCallback(() => () => soundPreview.stop(), [soundPreview.stop]),
  );
  const { isPremium } = usePremium();
  const backOverride = useBackOverride();
  const categoryOverlay = useCategoryOverlayOptional();

  const category = CATEGORIES.find((candidate) => candidate.id === id);
  const allSessions = useMemo(() => getSessionsByCategory(id), [id, version]);
  const tabs = useMemo(
    () => getCategoryTabs(allSessions, id),
    [allSessions, id],
  );
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [searchVisible, setSearchVisible] = useState(false);
  const searchItems = useMemo(
    () => allSessions.map((session) => ({
      id: session.id,
      title: session.title,
      meta: session.categoryLabel,
      subtitle: session.subtitle,
      searchText: [
        session.title,
        session.subtitle,
        session.categoryLabel,
        ...getCategorySessionTags(session, id),
      ].join(" "),
      image: session.image,
    })),
    [allSessions, id],
  );
  const popularSearchTerms = useMemo(
    () => getCategoryPopularSearchTerms(allSessions, id, tabs),
    [allSessions, id, tabs],
  );

  const [stickyHeaderHeight, setStickyHeaderHeight] = useState(0);
  const stickyBorderOpacity = useRef(new Animated.Value(0)).current;
  const stickyBorderActiveRef = useRef(false);
  const handleScroll = useCallback((event: {
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
  const useDiscoverStickyStyle = isIndigoThemeId(theme.id) || theme.id === "indigo2";

  const profileSectionBackground = "rgba(0,0,0,0.28)";
  const title = category?.title ?? "Categoría";

  const goBack = backOverride ?? (() => router.back());
  const handleSessionPress = (session: Session) => {
    if (session.isPremium && !isPremium) {
      router.push("/membresia" as never);
      return;
    }
    if (openForSession(session)) return;
    if (session.skipMiniPlayer) {
      playSession(session);
      return;
    }
    if (session.skipDetail) {
      playSession(session);
      router.push("/player" as never);
      return;
    }
    if (categoryOverlay) {
      categoryOverlay.openCategory(`/session/${session.id}`);
      return;
    }
    router.push(`/session/${session.id}` as never);
  };

  const openSubcategory = (tag: string) => {
    const route = `/category-tag/${encodeURIComponent(id)}/${encodeURIComponent(tag)}`;
    if (categoryOverlay) {
      categoryOverlay.openCategory(route);
    } else {
      router.push(route as never);
    }
  };

  const renderSessions = () => {
    if (allSessions.length === 0 || tabs.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Feather name="headphones" size={48} color="#F9F9F9" style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>Próximamente en {title}</Text>
          <Text style={styles.emptySub}>
            {category?.subtitle ?? "Estamos preparando nuevas sesiones para ti."}
          </Text>
        </View>
      );
    }

    return (
      <CategoryLandingSections
        categoryId={id}
        sessions={allSessions}
        tabs={tabs}
        isPremium={isPremium}
        onPress={handleSessionPress}
        onOpenSubcategory={openSubcategory}
        soundPreview={id === "ambientales" ? {
          activeId: soundPreview.activeId,
          isPlaying: soundPreview.isPlaying,
          progress: soundPreview.progress,
          onToggle: soundPreview.toggle,
        } : undefined}
      />
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.gradient[theme.gradient.length - 1] as string }]}>
      <StatusBar hidden />
      <LinearGradient
        colors={theme.gradient as unknown as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingTop: stickyHeaderHeight,
          paddingBottom: 140 + bottomPad,
        }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={handleScroll}
      >
        <Animated.View key={activeTab ?? "all"} style={styles.content}>
          {renderSessions()}
        </Animated.View>
      </ScrollView>

      <View
        style={[
          styles.stickyHeader,
          useDiscoverStickyStyle && styles.stickyHeaderFadeOverflow,
          {
            paddingTop: topPad + 2,
            backgroundColor: theme.gradient[0] as string,
          },
        ]}
        onLayout={(event) => setStickyHeaderHeight(event.nativeEvent.layout.height)}
      >
        <View style={styles.stickyHeaderRow}>
          <View style={styles.stickyHeaderSpacer} />
          <View style={styles.stickyTitleCol}>
            <Text style={styles.stickyTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
              {title}
            </Text>
          </View>
          <View style={styles.stickyHeaderSpacer}>
            <Pressable
              onPress={() => setSearchVisible(true)}
              hitSlop={10}
              style={[
                styles.headerSearchButton,
                isIndigoThemeId(theme.id) && { backgroundColor: "rgba(0,0,0,0.28)" },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Buscar en ${title}`}
            >
              <Feather name="search" size={24} color={TEXT} />
            </Pressable>
          </View>
        </View>
        <Pressable
          onPress={goBack}
          hitSlop={10}
          style={({ pressed }) => [
            styles.backBtn,
            {
              backgroundColor: profileSectionBackground,
              opacity: pressed ? 0.7 : 1,
              top: topPad + 2,
            },
          ]}
        >
          <Feather name="chevron-left" size={26} color={TEXT} />
        </Pressable>
        <View style={styles.stickyChipsArea}>
          <ChipRow
            tabs={tabs}
            activeTab={undefined}
            onSelect={(tab) => tab === null ? setActiveTab(null) : openSubcategory(tab)}
          />
        </View>
        <Animated.View
          pointerEvents="none"
          style={[styles.stickyBottomBorder, { opacity: stickyBorderOpacity }]}
        />
      </View>

      <ContextSearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        items={searchItems}
        placeholder={`Buscar en ${title}...`}
        emptyTitle={`Busca en ${title}`}
        emptySubtitle={category?.subtitle ?? "Encuentra una sesión para ti"}
        contextKey={`category:${id}`}
        popularTerms={popularSearchTerms}
        onSelect={(item) => {
          const session = allSessions.find((candidate) => candidate.id === item.id);
          if (session) handleSessionPress(session);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  header: {
    paddingHorizontal: H_PAD,
    paddingBottom: 12,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtn: {
    position: "absolute",
    left: H_PAD,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    fontFamily: "Manrope",
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "700",
    color: TEXT,
    letterSpacing: 0.2,
  },
  headerSearchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  chipsArea: {
    paddingTop: 10,
    paddingBottom: 5,
    marginTop: 6,
    overflow: "visible",
    paddingHorizontal: H_PAD,
  },
  chipRowWrapper: { position: "relative", marginHorizontal: -H_PAD },
  chipRow: { flexGrow: 0 },
  chipRowContent: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 2,
    paddingHorizontal: H_PAD,
  },
  chip: {
    height: 51,
    paddingHorizontal: 16,
    borderRadius: 27,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  chipTibet: { backgroundColor: "rgba(0,0,0,0.28)" },
  chipIndigo: { backgroundColor: "rgba(0,0,0,0.28)" },
  chipIndigo2Inactive: {
    backgroundColor: "rgba(0,0,0,0.28)",
    borderColor: "rgba(255,255,255,0.2)",
  },
  chipSelected: {
    backgroundColor: "#F9F9F9",
    borderWidth: 0,
  },
  chipText: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
    color: "#F4F4F4",
    textAlign: "center",
  },
  chipTextSelected: {
    color: "#060A0F",
  },
  content: { minHeight: 200 },
  sessionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CARD_GAP,
    paddingHorizontal: H_PAD,
    marginTop: 18,
    marginBottom: 6,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: H_PAD,
  },
  emptyIcon: { marginBottom: 16 },
  emptyTitle: {
    fontFamily: "Manrope",
    fontSize: 17,
    fontWeight: "700",
    color: TEXT,
    textAlign: "center",
    marginBottom: 8,
  },
  emptySub: {
    fontFamily: "Manrope",
    fontSize: 13,
    color: MUTED,
    textAlign: "center",
    lineHeight: 20,
  },
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    minHeight: 48,
    paddingHorizontal: H_PAD,
    paddingBottom: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  stickyHeaderFadeOverflow: { overflow: "visible" },
  stickyBottomBorder: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  stickyHeaderRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 6,
  },
  stickyHeaderSpacer: { width: 40 },
  stickyTitleCol: { flex: 1, alignItems: "center" },
  stickyTitle: {
    fontFamily: "Manrope",
    fontSize: 18,
    lineHeight: 21,
    fontWeight: "700",
    color: TEXT,
    letterSpacing: 0.2,
    textAlign: "center",
  },
  stickyChipsArea: { width: "100%", marginTop: 14 },
});