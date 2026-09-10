import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import {
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

import { PremiumBadge } from "@/components/PremiumBadge";
import { SessionCard } from "@/components/SessionCard";
import { useCatalog } from "@/context/CatalogContext";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import {
  getSessionsBySonidosTag,
  getSonidosVisibleSessions,
  type Session,
} from "@/data/sessions";
import { SONIDOS_TAG_CARDS } from "@/data/tags";
import { useColors } from "@/hooks/useColors";
import { useBackOverride } from "@/context/BackOverrideContext";
import { useCategoryOverlayOptional } from "@/context/CategoryOverlayContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { isIndigoThemeId } from "@/config/scene-themes";
import {
  CONTENT_CAROUSEL_GAP,
  getTwoCardCarouselCardWidth,
} from "@/constants/carousel";

const { width } = Dimensions.get("window");
const H_PAD = 20;
const GAP = CONTENT_CAROUSEL_GAP;
const CARD_W = getTwoCardCarouselCardWidth(width, 14, 25);
const AMBIENTAL_IMAGE_SIZE = Math.round(CARD_W * 0.72);

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
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const cardBackground = theme.id === "tibet"
    ? "rgba(0,0,0,0.1)"
    : isIndigoThemeId(theme.id)
      ? "rgba(181,211,255,0.1)"
      : theme.id === "indigo2"
        ? "rgba(191,207,255,0.1)"
        : "rgba(181,211,255,0.1)";
  const tag = SONIDOS_TAG_CARDS.find((candidate) => candidate.id === id);
  const sessions = useMemo(
    () => tag ? getSessionsBySonidosTag(tag.label) : [],
    [tag, version],
  );
  const queueIds = useMemo(
    () => getSonidosVisibleSessions().map((session) => session.id),
    [version],
  );

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
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 60 + bottomPad }}
        showsVerticalScrollIndicator={false}
      >
        {sessions.length === 0 ? (
          <View style={[styles.empty, { borderColor: colors.border }]}>
            <Feather name="headphones" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Próximamente</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {sessions.map((session) => (
              <SessionCard
                key={session.id}
                session={session}
                width={CARD_W}
                cardVariant="ambiental"
                editorialPresentation
                showAuthor={false}
                showAuthorAvatar={false}
                style={styles.card}
                overridePress={() => openSession(session)}
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    minHeight: 58,
    paddingHorizontal: H_PAD,
    paddingBottom: 22,
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
  grid: {
    paddingHorizontal: H_PAD,
    paddingTop: 30,
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    columnGap: GAP,
    rowGap: 18,
  },
  card: { marginRight: 0, marginBottom: 4 },
  image: {
    width: CARD_W,
    height: CARD_W,
    borderRadius: 18,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  ambientalImage: {
    width: AMBIENTAL_IMAGE_SIZE,
    height: AMBIENTAL_IMAGE_SIZE,
    borderRadius: AMBIENTAL_IMAGE_SIZE / 2,
  },
  cardTitle: {
    marginTop: 8,
    fontFamily: "Manrope",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "700",
  },
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