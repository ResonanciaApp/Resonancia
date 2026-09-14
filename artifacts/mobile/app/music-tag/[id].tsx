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
  const [headerBottomY, setHeaderBottomY] = useState(Number.POSITIVE_INFINITY);
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
            event.nativeEvent.contentOffset.y > headerBottomY - topPad - 8;
          if (active !== stickyActive) setStickyActive(active);
        }}
      >
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

        {sessions.length === 0 ? (
          <View style={[styles.emptyState, { borderColor: colors.border }]}>
            <Feather name="music" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Próximamente
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Estamos preparando nuevas sesiones para esta categoría
            </Text>
          </View>
        ) : (
          <SessionCarousel
            title=""
            sessions={sessions}
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
    backgroundColor: "rgba(181,211,255,0.057)",
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
});