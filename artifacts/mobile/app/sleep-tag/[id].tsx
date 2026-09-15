import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
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
import { SupercategoryFilterTabs } from "@/components/SupercategoryFilterTabs";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { DESCANSO_TAG_CARDS } from "@/data/tags";
import { getSessionsByDescansoTag } from "@/data/sessions";
import {
  collectSupercategoryEditorialTags,
  matchesSupercategoryFilter,
  type SupercategoryFilter,
} from "@/data/supercategory-editorial-tags";
import { useCatalog } from "@/context/CatalogContext";
import { isIndigoThemeId } from "@/config/scene-themes";
import { useColors } from "@/hooks/useColors";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useBackOverride } from "@/context/BackOverrideContext";
import { useCategoryOverlayOptional } from "@/context/CategoryOverlayContext";

const H_PAD = 16;

export default function SleepTagDetailScreen({ id: idProp }: { id?: string } = {}) {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = idProp ?? params.id;
  const id = Array.isArray(rawId) ? rawId[0] : rawId;
  const colors = useColors();
  const { playSession } = usePlayer();
  const { isPremium } = usePremium();
  const { activeSceneId, theme } = useSceneTheme();
  const overlayBack = useBackOverride();
  const overlay = useCategoryOverlayOptional();
  const { version } = useCatalog();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const profileSectionBackground = activeSceneId === "tibet"
    ? "rgba(0,0,0,0.15)"
    : isIndigoThemeId(activeSceneId)
      ? "rgba(181,211,255,0.057)"
      : "rgba(181,211,255,0.057)";
  const [stickyActive, setStickyActive] = React.useState(false);
  const [headerBottomY, setHeaderBottomY] = React.useState(Number.POSITIVE_INFINITY);
  const stickyHeaderOpacity = React.useRef(new Animated.Value(0)).current;
  const [activeFilter, setActiveFilter] = React.useState<SupercategoryFilter>("all");

  React.useEffect(() => {
    Animated.timing(stickyHeaderOpacity, {
      toValue: stickyActive ? 1 : 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [stickyActive, stickyHeaderOpacity]);

  const tag = DESCANSO_TAG_CARDS.find((t) => t.id === id);
  const sessions = React.useMemo(
    () => tag ? getSessionsByDescansoTag(tag.label) : [],
    [tag, version],
  );
  const editorialTags = React.useMemo(
    () => collectSupercategoryEditorialTags(sessions, "descanso"),
    [sessions],
  );
  const filteredSessions = React.useMemo(
    () => sessions.filter((session) =>
      matchesSupercategoryFilter(session, "descanso", activeFilter)),
    [activeFilter, sessions],
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
          const y = event.nativeEvent.contentOffset.y;
          const active = y > headerBottomY - topPad - 8;
          if (active !== stickyActive) setStickyActive(active);
        }}
      >
        {/* ── Header ── */}
        <View
          style={[styles.header, { paddingTop: topPad + 8 }]}
          onLayout={(event) => {
            const { y, height } = event.nativeEvent.layout;
            setHeaderBottomY(y + height);
          }}
        >
          <Pressable
            onPress={goBack}
            hitSlop={10}
            style={({ pressed }) => [
              styles.backBtn,
              {
                backgroundColor: profileSectionBackground,
                opacity: pressed ? 0.7 : 1,
                top: topPad + 3,
              },
            ]}
          >
            <Feather name="chevron-left" size={26} color={colors.foreground} />
          </Pressable>
          <Text
            style={[styles.pageTitle, { color: colors.foreground }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.85}
          >
            {tag.label}
          </Text>
        </View>

        <SupercategoryFilterTabs
          editorialTags={editorialTags}
          active={activeFilter}
          onSelect={setActiveFilter}
          showBottomBorder={false}
        />

        {/* ── Sessions grid or empty ── */}
        {filteredSessions.length === 0 ? (
          <View style={[styles.emptySlot, { borderColor: colors.border, marginHorizontal: H_PAD }]}>
            <Feather name="moon" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              {sessions.length === 0 ? "Próximamente" : "Sin resultados"}
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              {sessions.length === 0
                ? "Estamos preparando estas sesiones para ti"
                : "No hay sesiones para este filtro"}
            </Text>
          </View>
        ) : (
          <SessionCarousel
            title=""
            sessions={filteredSessions}
            isPremium={isPremium}
            onPress={(session) => {
              if (session.skipMiniPlayer) {
                playSession(session);
                return;
              }
              if (session.skipDetail) {
                playSession(session);
                router.push("/player" as never);
                return;
              }
              if (overlay) overlay.openCategory(`/session/${session.id}`);
              else router.push(`/session/${session.id}` as never);
            }}
            style={styles.sessionGrid}
            showHeader={false}
            gridLayout
            fillGridWidth
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
        style={[
          styles.stickyHeader,
          {
            paddingTop: topPad + 8,
            backgroundColor: theme.gradient[0] as string,
            opacity: stickyHeaderOpacity,
          },
        ]}
        pointerEvents={stickyActive ? "auto" : "none"}
      >
        <View style={styles.stickyHeaderRow}>
          <View style={styles.stickyHeaderSpacer} />
          <View style={styles.stickyTitleCol}>
            <Text
              style={[styles.stickyTitle, { color: colors.foreground }]}
              numberOfLines={1}
              adjustsFontSizeToFit
              minimumFontScale={0.85}
            >
              {tag.label}
            </Text>
          </View>
          <View style={styles.stickyHeaderSpacer} />
        </View>
        <Pressable
          onPress={() => router.back()}
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
          <Feather name="chevron-left" size={26} color={colors.foreground} />
        </Pressable>
        <View style={styles.stickyTabs}>
          <SupercategoryFilterTabs
            editorialTags={editorialTags}
            active={activeFilter}
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
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    minHeight: 48,
    paddingBottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  stickyHeaderRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: H_PAD,
  },
  stickyHeaderSpacer: {
    width: 40,
  },
  stickyTabs: {
    width: "100%",
    marginTop: 12,
  },
  stickyTitleCol: {
    flex: 1,
    alignItems: "center",
  },
  stickyTitle: {
    fontFamily: "Manrope",
    fontSize: 16,
    lineHeight: 19,
    fontWeight: "700",
    letterSpacing: 0.2,
    textAlign: "center",
  },

  sessionGrid: {
    paddingHorizontal: 0,
    marginBottom: 0,
  },
  card: {
    marginBottom: 4,
  },
  cardImg: {
    borderRadius: 14,
    overflow: "hidden",
  },
  categoryDurationBadge: {
    position: "absolute",
    left: 8,
    bottom: 8,
    paddingHorizontal: 9,
  },
  cardMetadata: {
    marginTop: 8,
  },
  cardSecondary: {
    fontFamily: "Manrope",
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "500",
  },
  cardTitle: {
    marginTop: 2,
    marginBottom: 2,
    fontFamily: "Manrope",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
  },

  emptySlot: {
    marginTop: 8,
    height: 160,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  emptyTitle: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
  },
  emptySub: {
    fontFamily: "Manrope",
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 24,
  },
});
