import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
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
import { SacredBackground } from "@/components/SacredBackground";
import {
  SESSION_CARD_METADATA_HEIGHT_SCALE,
  SessionCardMetadataOverlay,
} from "@/components/SessionCardMetadataOverlay";
import { useCatalog } from "@/context/CatalogContext";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { getArtist } from "@/data/artists";
import { getGuide } from "@/data/guides";
import {
  getSessionsBySonidosTag,
  getSonidosVisibleSessions,
  type Session,
} from "@/data/sessions";
import { SONIDOS_TAG_CARDS } from "@/data/tags";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");
const H_PAD = 20;
const GAP = 12;
const CARD_W = (width - H_PAD * 2 - GAP) / 2;
const CARD_H = Math.round((CARD_W + 50) * SESSION_CARD_METADATA_HEIGHT_SCALE);

export default function SoundTagDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isPremium } = usePremium();
  const { currentSession, playSessionInPlaylist } = usePlayer();
  const { version } = useCatalog();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
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
    router.push({
      pathname: "/session/[id]",
      params: { id: session.id, source: "sonidos" },
    } as never);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar hidden />
      <SacredBackground />
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.back}>
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
        <Text style={[styles.description, { color: colors.mutedForeground }]}>
          {tag.description}
        </Text>
        {sessions.length === 0 ? (
          <View style={[styles.empty, { borderColor: colors.border }]}>
            <Feather name="headphones" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Próximamente</Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {sessions.map((session) => (
              <Pressable
                key={session.id}
                onPress={() => openSession(session)}
                style={({ pressed }) => [
                  styles.card,
                  { width: CARD_W, opacity: pressed ? 0.82 : 1 },
                ]}
              >
                <View style={[styles.image, { height: CARD_H, backgroundColor: colors.card }]}>
                  <Image source={session.image} style={StyleSheet.absoluteFill} contentFit="cover" />
                  <SessionCardMetadataOverlay
                    categoryId={session.categoryId}
                    durationLabel={session.durationLabel}
                    title={session.title}
                    authorName={
                      session.guideId
                        ? getGuide(session.guideId).name
                        : getArtist(session.artistId).name
                    }
                  />
                  <PremiumBadge session={session} />
                </View>
              </Pressable>
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
  description: {
    marginHorizontal: H_PAD,
    marginTop: 8,
    fontFamily: "Manrope",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
  grid: {
    paddingHorizontal: H_PAD,
    paddingTop: 30,
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: GAP,
    rowGap: 18,
  },
  card: { marginBottom: 4 },
  image: { borderRadius: 14, overflow: "hidden" },
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