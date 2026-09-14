import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
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

import { SessionCarousel } from "@/components/SessionCarousel";
import { useBackOverride } from "@/context/BackOverrideContext";
import { useCategoryOverlayOptional } from "@/context/CategoryOverlayContext";
import { useCatalog } from "@/context/CatalogContext";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import {
  SESSIONS,
  sortSessionsNewestFirst,
  type Session,
} from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

const H_PAD = 20;
const LEVEL_ONE_THEME_TAGS = new Set([
  "Yoga",
  "Respiración",
  "Ansiedad",
  "Rituales",
  "Crecimiento",
  "ASMR",
  "Estrés",
  "Spa",
  "Familia",
]);

type MusicFilterId = "all" | "duration-5" | "duration-10" | "duration-11" | `theme:${string}`;

type MusicFilterTab = {
  id: MusicFilterId;
  label: string;
};

function durationMinutes(label: string): number {
  const minuteMatch = label.match(/(\d+(?:[.,]\d+)?)\s*min/i);
  if (minuteMatch) return Number(minuteMatch[1].replace(",", "."));

  const clockParts = label.split(":").map((part) => Number(part));
  if (clockParts.length === 2 && clockParts.every(Number.isFinite)) {
    return clockParts[0] + clockParts[1] / 60;
  }

  return Number.parseFloat(label.replace(",", "."));
}

function MusicFilterTabs({
  tabs,
  activeFilter,
  onSelect,
}: {
  tabs: MusicFilterTab[];
  activeFilter: MusicFilterId;
  onSelect: (id: MusicFilterId) => void;
}) {
  return (
    <View style={styles.chipRowWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        contentContainerStyle={styles.chipRowContent}
      >
        {tabs.map((tab) => {
          const selected = tab.id === activeFilter;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onSelect(tab.id)}
              style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
            >
              <View style={[styles.chip, selected && styles.chipSelected]}>
                <Text style={[styles.chipText, selected && styles.chipTextSelected]}>
                  {tab.label}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}

export default function MusicTagDetailScreen({ id: idProp }: { id?: string } = {}) {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = idProp ?? params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const colors = useColors();
  const { theme } = useSceneTheme();
  const { version } = useCatalog();
  const { playSession } = usePlayer();
  const { isPremium } = usePremium();
  const overlayBack = useBackOverride();
  const overlay = useCategoryOverlayOptional();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [stickyActive, setStickyActive] = useState(false);
  const [tabsOffsetY, setTabsOffsetY] = useState(Number.POSITIVE_INFINITY);
  const [activeFilter, setActiveFilter] = useState<MusicFilterId>("all");
  const stickyHeaderOpacity = useRef(new Animated.Value(0)).current;

  const sessions = useMemo(
    () =>
      SESSIONS.filter(
        (session) =>
          session.categoryId === "musica-sonidos" &&
          session.soundTag === id,
      ).sort(sortSessionsNewestFirst),
    [id, version],
  );

  const filterTabs = useMemo<MusicFilterTab[]>(() => {
    const themeTags = Array.from(
      new Set(
        sessions.flatMap((session) =>
          [...(session.themeTag ?? []), ...(session.temaTag ?? [])]
            .map((tag) => tag.trim())
            .filter((tag) => LEVEL_ONE_THEME_TAGS.has(tag)),
        ),
      ),
    );

    return [
      { id: "all", label: "Ver todo" },
      { id: "duration-5", label: "5 min" },
      { id: "duration-10", label: "10 min" },
      { id: "duration-11", label: "11+ min" },
      ...themeTags.map((tag) => ({
        id: `theme:${tag}` as const,
        label: tag,
      })),
    ];
  }, [sessions]);

  const filteredSessions = useMemo(() => {
    if (activeFilter === "all") return sessions;
    if (activeFilter.startsWith("theme:")) {
      const tag = activeFilter.slice("theme:".length);
      return sessions.filter((session) =>
        [
          ...(session.themeTag ?? []),
          ...(session.temaTag ?? []),
        ].includes(tag),
      );
    }

    return sessions.filter((session) => {
      const minutes = durationMinutes(session.durationLabel);
      if (activeFilter === "duration-5") return minutes <= 5;
      if (activeFilter === "duration-10") return minutes > 5 && minutes <= 10;
      return minutes > 10;
    });
  }, [activeFilter, sessions]);

  React.useEffect(() => {
    setActiveFilter("all");
  }, [id]);

  React.useEffect(() => {
    stickyHeaderOpacity.stopAnimation();
    Animated.timing(stickyHeaderOpacity, {
      toValue: stickyActive ? 1 : 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [stickyActive, stickyHeaderOpacity]);

  if (!id) return null;

  const goBack = () => (overlayBack ? overlayBack() : router.back());
  const openSession = (session: Session) => {
    if (session.isPremium && !isPremium) {
      router.push("/membresia" as never);
      return;
    }
    if (session.skipMiniPlayer) {
      playSession(session);
      return;
    }
    playSession(session);
    router.push("/player" as never);
  };

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: theme.gradient[theme.gradient.length - 1] as string },
      ]}
    >
      <StatusBar hidden />
      <LinearGradient
        colors={theme.gradient as unknown as [string, string, ...string[]]}
        locations={theme.gradientLocations}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 60 + bottomPad }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(event) => {
          const active =
            event.nativeEvent.contentOffset.y > tabsOffsetY - topPad - 8;
          if (active !== stickyActive) setStickyActive(active);
        }}
      >
        <View style={[styles.header, { paddingTop: topPad + 8 }]}>
          <Pressable
            onPress={goBack}
            hitSlop={10}
            style={({ pressed }) => [
              styles.backButton,
              { top: topPad + 3, opacity: pressed ? 0.7 : 1 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Volver a Música"
          >
            <Feather name="chevron-left" size={26} color={colors.foreground} />
          </Pressable>
          <Text
            style={[styles.pageTitle, { color: colors.foreground }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            {id}
          </Text>
        </View>

        <View
          style={styles.chipsArea}
          onLayout={(event) => {
            setTabsOffsetY(event.nativeEvent.layout.y);
          }}
        >
          <MusicFilterTabs
            tabs={filterTabs}
            activeFilter={activeFilter}
            onSelect={setActiveFilter}
          />
        </View>

        {filteredSessions.length === 0 ? (
          <View style={[styles.emptyState, { borderColor: colors.border }]}>
            <Feather name="music" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {sessions.length === 0 ? "Próximamente" : "Sin resultados"}
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {sessions.length === 0
                ? "Estamos preparando nuevas sesiones para esta categoría"
                : "No hay sesiones para este filtro"}
            </Text>
          </View>
        ) : (
          <SessionCarousel
            title=""
            sessions={filteredSessions}
            isPremium={isPremium}
            onPress={openSession}
            style={styles.sessionGrid}
            showHeader={false}
            gridLayout
            gridScrollEnabled={false}
            eagerRender
            presentation="editorial"
            disableAmbientalVariant
            sleepMetadataBelow
            categoryGridPresentation
            whiteMetadataGlass
            showDurationClock
            sleepBelowMetadataStyle={{
              marginTop: 3,
              transform: [{ translateX: 3 }],
            }}
            trailingPeek={20}
            cardBorderRadius={16}
            hideCategoryAboveTitle
            showSleepCategoryPillWithInlineDuration
            ambientalTitleOnly
          />
        )}
      </ScrollView>

      <Animated.View
        pointerEvents={stickyActive ? "auto" : "none"}
        style={[
          styles.stickyHeader,
          {
            paddingTop: topPad + 8,
            backgroundColor: theme.gradient[0] as string,
            opacity: stickyHeaderOpacity,
          },
        ]}
      >
        <View style={styles.stickyHeaderRow}>
          <View style={styles.stickySpacer} />
          <Text
            style={[styles.stickyTitle, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {id}
          </Text>
          <View style={styles.stickySpacer} />
        </View>
        <Pressable
          onPress={goBack}
          hitSlop={10}
          style={({ pressed }) => [
            styles.backButton,
            { top: topPad + 2, opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="chevron-left" size={26} color={colors.foreground} />
        </Pressable>
        <View style={styles.stickyTabs}>
          <MusicFilterTabs
            tabs={filterTabs}
            activeFilter={activeFilter}
            onSelect={setActiveFilter}
          />
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  header: {
    minHeight: 48,
    paddingHorizontal: H_PAD,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    position: "absolute",
    left: H_PAD,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.28)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  pageTitle: {
    paddingHorizontal: 52,
    fontFamily: "Manrope",
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  chipsArea: {
    paddingTop: 9,
    paddingBottom: 15,
    paddingHorizontal: H_PAD,
    overflow: "visible",
  },
  chipRowWrapper: {
    position: "relative",
    marginHorizontal: -H_PAD,
  },
  chipRow: { flexGrow: 0 },
  chipRowContent: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 2,
    paddingHorizontal: H_PAD,
  },
  chip: {
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 27,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
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
    color: "#FBFBFB",
    textAlign: "center",
  },
  chipTextSelected: {
    color: "#060A0F",
  },
  sessionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: H_PAD,
    rowGap: 35,
    marginTop: -17,
    marginBottom: 6,
  },
  emptyState: {
    marginHorizontal: H_PAD,
    marginTop: 28,
    minHeight: 180,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 28,
  },
  emptyTitle: {
    fontFamily: "Manrope",
    fontSize: 17,
    fontWeight: "700",
  },
  emptyText: {
    fontFamily: "Manrope",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    minHeight: 48,
    paddingHorizontal: H_PAD,
    paddingBottom: 12,
  },
  stickyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stickySpacer: { width: 44 },
  stickyTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: "Manrope",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
  },
  stickyTabs: {
    marginTop: 19,
  },
});