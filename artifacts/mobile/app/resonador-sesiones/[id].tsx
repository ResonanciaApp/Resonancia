import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { openPremiumPlans } from "@/lib/premiumGate";
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
import { useAmbientalDuration } from "@/context/AmbientalDurationContext";
import { useCatalog } from "@/context/CatalogContext";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { getSessionById, type Session } from "@/data/sessions";
import { useResonadorById } from "@/hooks/useResonadores";

const H_PAD = 20;
const HEADER_H_PAD = 14;

export default function ResonadorSesionesScreen() {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const resonadorId = Array.isArray(params.id) ? params.id[0] : params.id;
  const { resonador } = useResonadorById(resonadorId);
  const { version } = useCatalog();
  const { theme } = useSceneTheme();
  const { isPremium } = usePremium();
  const { playSession } = usePlayer();
  const { openForSession } = useAmbientalDuration();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [headerHeight, setHeaderHeight] = useState(0);
  const borderOpacity = useRef(new Animated.Value(0)).current;
  const borderVisibleRef = useRef(false);

  const sessions = useMemo(
    () =>
      (resonador?.sessionIds ?? [])
        .map((sessionId) => getSessionById(sessionId))
        .filter((session): session is Session => !!session)
        .sort((a, b) => Number.parseInt(b.id, 10) - Number.parseInt(a.id, 10)),
    [resonador?.sessionIds, version],
  );

  const handleScroll = React.useCallback(
    (event: { nativeEvent: { contentOffset: { y: number } } }) => {
      const visible = event.nativeEvent.contentOffset.y > 2;
      if (visible === borderVisibleRef.current) return;
      borderVisibleRef.current = visible;
      borderOpacity.stopAnimation();
      Animated.timing(borderOpacity, {
        toValue: visible ? 1 : 0,
        duration: 220,
        useNativeDriver: true,
      }).start();
    },
    [borderOpacity],
  );

  const openSession = React.useCallback(
    (session: Session) => {
      if (session.isPremium && !isPremium) {
        openPremiumPlans();
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
      router.push(`/session/${session.id}` as never);
    },
    [isPremium, openForSession, playSession],
  );

  return (
    <View style={[styles.root, { backgroundColor: theme.gradient[theme.gradient.length - 1] as string }]}>
      <StatusBar hidden />
      <LinearGradient
        colors={theme.gradient as unknown as [string, string, ...string[]]}
        locations={theme.gradientLocations}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: headerHeight,
          paddingBottom: 80 + bottomPad,
        }}
        scrollEventThrottle={16}
        onScroll={handleScroll}
      >
        {sessions.length > 0 ? (
          <SessionCarousel
            title=""
            sessions={sessions}
            isPremium={isPremium}
            onPress={openSession}
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
            hideCategoryAboveTitle
            showSleepCategoryPillWithInlineDuration
          />
        ) : (
          <View style={styles.emptyState}>
            <Feather name="headphones" size={30} color="#F9F9F9" />
            <Text style={styles.emptyTitle}>Sin sesiones</Text>
            <Text style={styles.emptyText}>
              Este Resonador todavía no tiene sesiones publicadas.
            </Text>
          </View>
        )}
      </ScrollView>

      <View
        style={[
          styles.stickyHeader,
          {
            paddingTop: topPad + 4,
            backgroundColor: theme.gradient[0] as string,
          },
        ]}
        onLayout={(event) => setHeaderHeight(event.nativeEvent.layout.height)}
      >
        <View style={styles.stickyHeaderRow}>
          <View style={styles.stickySpacer} />
          <Text style={styles.stickyTitle} numberOfLines={1}>
            Mis sesiones
          </Text>
          <View style={styles.stickySpacer} />
        </View>
        <Pressable
          onPress={() => router.back()}
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
          <Feather
            name="chevron-left"
            size={32}
            color="#FBFBFB"
            style={{ transform: [{ translateX: -1 }] }}
          />
        </Pressable>
        <Animated.View
          pointerEvents="none"
          style={[styles.stickyBottomBorder, { opacity: borderOpacity }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  sessionGrid: { marginTop: -2, marginBottom: 6 },
  emptyState: {
    marginHorizontal: H_PAD,
    marginTop: 28,
    minHeight: 180,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.25)",
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
    color: "#FBFBFB",
  },
  emptyText: {
    fontFamily: "Manrope",
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
    color: "#c2c2c2",
  },
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    minHeight: 48,
    paddingHorizontal: HEADER_H_PAD,
    paddingBottom: 6,
  },
  stickyHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 6,
  },
  stickySpacer: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  stickyTitle: {
    flex: 1,
    textAlign: "center",
    fontFamily: "Manrope",
    fontSize: 18,
    lineHeight: 21,
    fontWeight: "700",
    color: "#FBFBFB",
    letterSpacing: 0.2,
  },
  backButton: {
    position: "absolute",
    left: HEADER_H_PAD,
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 0,
    borderColor: "transparent",
    backgroundColor: "rgba(0,0,0,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  stickyBottomBorder: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
});