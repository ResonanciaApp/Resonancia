import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
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

import { SacredBackground } from "@/components/SacredBackground";
import { SessionCard } from "@/components/SessionCard";
import { useBackOverride } from "@/context/BackOverrideContext";
import { useCatalog } from "@/context/CatalogContext";
import { useCategoryOverlayOptional } from "@/context/CategoryOverlayContext";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { SESSIONS, type Session } from "@/data/sessions";
import { TAG_CARDS, slugifyThemeTag } from "@/data/tags";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");
const H_PAD = 20;
const COL_GAP = 12;
const CARD_W = (width - H_PAD * 2 - COL_GAP) / 2;

/**
 * The API stores the display label on each session and exposes a slug on the
 * Explore section. Resolve the slug back to that exact label before filtering
 * so custom labels work just like the predefined thematic tags.
 */
function resolveThemeLabel(slug: string | undefined): string | undefined {
  if (!slug) return undefined;

  const predefined = TAG_CARDS.find((tag) => tag.id === slug);
  if (predefined) return predefined.label;

  const labels = new Set(
    SESSIONS.flatMap((session) => session.themeTag ?? []),
  );
  const dynamicLabel = [...labels].find((label) => slugifyThemeTag(label) === slug);
  if (dynamicLabel) return dynamicLabel;

  const readableSlug = slug.replace(/-+/g, " ").trim();
  return readableSlug
    ? readableSlug.charAt(0).toUpperCase() + readableSlug.slice(1)
    : undefined;
}

export default function ThemeTagScreen({ id: idProp }: { id?: string } = {}) {
  const params = useLocalSearchParams<{ id?: string | string[] }>();
  const rawId = idProp ?? params.id;
  const slug = Array.isArray(rawId) ? rawId[0] : rawId;
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const overlayBack = useBackOverride();
  const overlay = useCategoryOverlayOptional();
  const { isPremium } = usePremium();
  const { playSession } = usePlayer();
  const { version: catalogVersion } = useCatalog();
  const { theme } = useSceneTheme();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const tagLabel = useMemo(
    () => resolveThemeLabel(slug ? decodeURIComponent(slug) : undefined),
    [slug, catalogVersion],
  );
  const sessions = useMemo(
    () =>
      tagLabel
        ? SESSIONS.filter((session) =>
            (session.themeTag as readonly string[] | undefined)?.includes(tagLabel),
          )
        : [],
    [tagLabel, catalogVersion],
  );

  const [stickyActive, setStickyActive] = React.useState(false);
  const [headerBottomY, setHeaderBottomY] = React.useState(Number.POSITIVE_INFINITY);
  const stickyHeaderOpacity = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(stickyHeaderOpacity, {
      toValue: stickyActive ? 1 : 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [stickyActive, stickyHeaderOpacity]);

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
    if (session.skipDetail) {
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

  if (!tagLabel) return null;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar hidden />
      <SacredBackground />

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
              { backgroundColor: "rgba(255,255,255,0.08)", opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="chevron-left" size={26} color={colors.foreground} />
          </Pressable>
          <Text
            style={[styles.pageTitle, { color: colors.foreground }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
          >
            {tagLabel}
          </Text>
        </View>

        {sessions.length === 0 ? (
          <View style={[styles.emptySlot, { borderColor: colors.border }]}>
            <Feather name="inbox" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Aún no hay sesiones
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Estamos preparando nuevas experiencias para esta temática
            </Text>
          </View>
        ) : (
          <View style={styles.sessionGrid}>
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                width={CARD_W}
                style={{ marginRight: 0 }}
                showCardMetadata
                showAuthorAvatar={false}
                overridePress={() => openSession(session)}
              />
            ))}
          </View>
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
              minimumFontScale={0.75}
            >
              {tagLabel}
            </Text>
          </View>
          <View style={styles.stickyHeaderSpacer} />
        </View>
        <Pressable
          onPress={goBack}
          hitSlop={10}
          style={({ pressed }) => [
            styles.backBtn,
            {
              backgroundColor: "rgba(255,255,255,0.08)",
              opacity: pressed ? 0.7 : 1,
              top: topPad + 2,
            },
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
    paddingHorizontal: H_PAD,
    paddingBottom: 12,
    minHeight: 48,
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
    maxWidth: width - H_PAD * 2 - 56,
    textAlign: "center",
  },
  sessionGrid: {
    paddingHorizontal: H_PAD,
    paddingTop: 36,
    paddingBottom: 40,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    rowGap: 35,
  },
  emptySlot: {
    marginHorizontal: H_PAD,
    marginTop: 36,
    minHeight: 160,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 24,
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
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  stickyHeaderRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  stickyHeaderSpacer: { width: 40 },
  stickyTitleCol: {
    flex: 1,
    alignItems: "center",
  },
  stickyTitle: {
    fontFamily: "Manrope",
    fontSize: 20,
    lineHeight: 23,
    fontWeight: "700",
    letterSpacing: 0.2,
    textAlign: "center",
  },
});