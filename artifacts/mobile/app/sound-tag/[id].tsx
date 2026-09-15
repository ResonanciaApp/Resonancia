import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { useFocusEffect } from "expo-router";
import React, { useCallback, useMemo } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SessionCarousel } from "@/components/SessionCarousel";
import { SupercategoryFilterTabs } from "@/components/SupercategoryFilterTabs";
import { useCatalog } from "@/context/CatalogContext";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import {
  getSessionsBySonidosTag,
  getSonidosVisibleSessions,
  type Session,
} from "@/data/sessions";
import { SONIDOS_TAG_CARDS } from "@/data/tags";
import {
  collectSupercategoryEditorialTags,
  matchesSupercategoryFilter,
  type SupercategoryFilter,
} from "@/data/supercategory-editorial-tags";
import { useColors } from "@/hooks/useColors";
import { useBackOverride } from "@/context/BackOverrideContext";
import { useCategoryOverlayOptional } from "@/context/CategoryOverlayContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useSoundPreview } from "@/hooks/useSoundPreview";

const H_PAD = 16;

export default function SoundTagDetailScreen({ id: idProp }: { id?: string } = {}) {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = idProp ?? params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const colors = useColors();
  const { theme } = useSceneTheme();
  const insets = useSafeAreaInsets();
  const { isPremium } = usePremium();
  const { currentSession, playSessionInPlaylist } = usePlayer();
  const { version } = useCatalog();
  const overlayBack = useBackOverride();
  const overlay = useCategoryOverlayOptional();
  const soundPreview = useSoundPreview();
  const [activeFilter, setActiveFilter] = React.useState<SupercategoryFilter>("all");
  const filterBorderOpacity = React.useRef(new Animated.Value(0)).current;
  const filterBorderActiveRef = React.useRef(false);
  const handleGridScroll = useCallback((event: {
    nativeEvent: { contentOffset: { y: number } };
  }) => {
    const active = event.nativeEvent.contentOffset.y > 2;
    if (active === filterBorderActiveRef.current) return;
    filterBorderActiveRef.current = active;
    filterBorderOpacity.stopAnimation();
    Animated.timing(filterBorderOpacity, {
      toValue: active ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [filterBorderOpacity]);
  useFocusEffect(
    useCallback(() => () => soundPreview.stop(), [soundPreview.stop]),
  );
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const tag = SONIDOS_TAG_CARDS.find((candidate) => candidate.id === id);
  const sessions = useMemo(
    () => tag ? getSessionsBySonidosTag(tag.label) : [],
    [tag, version],
  );
  const editorialTags = useMemo(
    () => collectSupercategoryEditorialTags(sessions, "sonidos"),
    [sessions],
  );
  const filteredSessions = useMemo(
    () => sessions.filter((session) =>
      matchesSupercategoryFilter(session, "sonidos", activeFilter)),
    [activeFilter, sessions],
  );
  const queueIds = useMemo(
    () => getSonidosVisibleSessions().map((session) => session.id),
    [version],
  );
  React.useEffect(() => {
    setActiveFilter("all");
  }, [id]);
  React.useEffect(() => {
    if (
      activeFilter.startsWith("editorial:") &&
      !editorialTags.includes(activeFilter.slice("editorial:".length))
    ) {
      setActiveFilter("all");
    }
  }, [activeFilter, editorialTags]);

  if (!tag) return null;

  const goBack = () => (overlayBack ? overlayBack() : router.back());

  const openSession = (session: Session) => {
    if (session.isPremium && !isPremium) {
      router.push("/membresia" as never);
      return;
    }
    const playWithQueue = () => {
      if (currentSession?.id !== session.id) {
        playSessionInPlaylist(session, queueIds);
      }
    };
    if (session.skipMiniPlayer) {
      playWithQueue();
      return;
    }
    const directPlayer =
      session.skipDetail !== false &&
      (session.skipDetail === true ||
        ["sonidos-ancestrales", "musica-sonidos"].includes(session.categoryId));
    if (directPlayer) {
      playWithQueue();
      router.push("/player" as never);
      return;
    }
    if (overlay) {
      overlay.openCategory(`/session/${session.id}`);
    } else {
      router.push({
        pathname: "/session/[id]",
        params: { id: session.id, source: "sonidos" },
      } as never);
    }
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
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
         <Pressable onPress={goBack} hitSlop={10} style={styles.back}>
          <Feather name="chevron-left" size={26} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
          {tag.label}
        </Text>
      </View>
      <SupercategoryFilterTabs
        editorialTags={editorialTags}
        active={activeFilter}
        onSelect={setActiveFilter}
        includeDurationFilters={false}
        hideWithoutEditorialTags
        bottomBorderOpacity={filterBorderOpacity}
      />
      {filteredSessions.length === 0 ? (
        <View style={styles.scroll}>
          <View style={[styles.empty, { borderColor: colors.border }]}>
            <Feather name="headphones" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {sessions.length === 0 ? "Próximamente" : "Sin resultados"}
            </Text>
          </View>
        </View>
      ) : (
        <SessionCarousel
          title=""
          sessions={filteredSessions}
          isPremium={isPremium}
          onPress={openSession}
          style={styles.scroll}
          showHeader={false}
          gridLayout
          fillGridWidth
          gridBottomPadding={60 + bottomPad}
          onGridScroll={handleGridScroll}
          presentation="editorial"
          cardVariant="ambiental"
          ambientalTitleOnly
          soundPreview={{
            activeId: soundPreview.activeId,
            isPlaying: soundPreview.isPlaying,
            progress: soundPreview.progress,
            onToggle: soundPreview.toggle,
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    minHeight: 58,
    paddingHorizontal: H_PAD,
    paddingBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  back: {
    position: "absolute",
    left: H_PAD,
    bottom: 10,
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    paddingHorizontal: 48,
    fontFamily: "Manrope",
    fontSize: 16,
    lineHeight: 22,
    fontWeight: "700",
  },
  scroll: { flex: 1 },
  empty: {
    marginHorizontal: H_PAD,
    marginTop: 32,
    height: 160,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  emptyTitle: { fontFamily: "Manrope", fontSize: 16, fontWeight: "700" },
});