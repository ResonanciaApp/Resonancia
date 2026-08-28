import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Dimensions,
  Image,
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
import { PremiumBadge } from "@/components/PremiumBadge";
import {
  SESSION_CARD_METADATA_HEIGHT_SCALE,
  SessionCardMetadataOverlay,
} from "@/components/SessionCardMetadataOverlay";
import { usePremium } from "@/context/PremiumContext";
import { usePlayer } from "@/context/PlayerContext";
import { DESCANSO_TAG_CARDS } from "@/data/tags";
import { getSessionsByDescansoTag } from "@/data/sessions";
import { getArtist } from "@/data/artists";
import { getGuide } from "@/data/guides";
import { useCatalog } from "@/context/CatalogContext";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");
const H_PAD = 20;
const COL_GAP = 12;
const CARD_W = (width - H_PAD * 2 - COL_GAP) / 2;
const CARD_H = Math.round((CARD_W + 50) * SESSION_CARD_METADATA_HEIGHT_SCALE);

export default function SleepTagDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { isPremium } = usePremium();
  const { playSession } = usePlayer();
  useCatalog();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const tag = DESCANSO_TAG_CARDS.find((t) => t.id === id);

  if (!tag) return null;

  const sessions = getSessionsByDescansoTag(tag.label);

  const rows: (typeof sessions)[] = [];
  for (let i = 0; i < sessions.length; i += 2) {
    rows.push(sessions.slice(i, i + 2));
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar hidden />
      <SacredBackground />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 60 + bottomPad }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={[styles.header, { paddingTop: topPad + 8 }]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={({ pressed }) => [
              styles.backBtn,
              {
                backgroundColor: colors.card,
                borderColor: "rgba(212,175,55,0.2)",
                opacity: pressed ? 0.7 : 1,
                top: topPad + 8,
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

        {/* ── Sessions grid or empty ── */}
        {sessions.length === 0 ? (
          <View style={[styles.emptySlot, { borderColor: colors.border, marginHorizontal: H_PAD }]}>
            <Feather name="moon" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Próximamente
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Estamos preparando estas sesiones para ti
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {rows.map((row, rowIdx) => (
              <View key={rowIdx} style={styles.row}>
                {row.map((session) => {
                  const locked = !!session.isPremium && !isPremium;
                  return (
                  <Pressable
                    key={session.id}
                    onPress={() => {
                      if (locked) { router.push("/membresia" as never); return; }
                      if (session.skipMiniPlayer) { playSession(session); return; }
                      if (session.skipDetail) { playSession(session); router.push("/player" as never); return; }
                      router.push(`/session/${session.id}` as never);
                    }}
                    style={({ pressed }) => [
                      styles.card,
                      { width: CARD_W, opacity: pressed ? 0.82 : 1 },
                    ]}
                  >
                    <View
                      style={[
                        styles.cardImg,
                         { height: CARD_H, backgroundColor: colors.card },
                      ]}
                    >
                      <Image
                        source={session.image as number}
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                      />
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
                  );
                })}
                {row.length === 1 && <View style={{ width: CARD_W }} />}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    fontFamily: "Manrope",
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  grid: {
    paddingHorizontal: H_PAD,
    paddingTop: 16,
    gap: COL_GAP,
  },
  row: {
    flexDirection: "row",
    gap: COL_GAP,
  },

  card: {
    marginBottom: 4,
  },
  cardImg: {
    borderRadius: 14,
    overflow: "hidden",
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
