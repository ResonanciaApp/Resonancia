import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { CardCaptionText as Text } from "@/components/CardCaptionText";
import {
  Dimensions,
  ScrollView,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";

import { CARD_TEXT_ABOVE, CARD_TEXT_BELOW } from "@/constants/colors";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import type { EditorialPlaylist } from "@/data/playlists";
import {
  SessionBadgeGlass,
  SessionDurationBadge,
} from "@/components/SessionDurationBadge";
import { PressScale } from "@/components/PressScale";
import { usePremium } from "@/context/PremiumContext";
const H_PAD = 16;
const CARD_GAP = 14;
const CARD_WIDTH = Math.round(
  (Dimensions.get("window").width - H_PAD - CARD_GAP) / 1.9,
);
const CARD_HEIGHT = CARD_WIDTH;

function editorialLabel(type: string): string | null {
  if (type === "none") return null;
  if (type === "meditative") return "Meditativa";
  if (type === "relaxation") return "Relajación";
  if (type === "ritual") return "Ritual";
  return type || null;
}

export function EditorialPlaylistCarousel({
  title,
  titleSize = 17,
  playlists,
  onPress,
  style,
  showPremiumBadge = false,
  stackTypeAboveDuration = false,
  gridLayout = false,
  titleLift = 0,
  showDurationClock = false,
  editorialTextPlacement = "cover",
}: {
  title: string;
  titleSize?: number;
  playlists: EditorialPlaylist[];
  onPress?: (playlist: EditorialPlaylist) => void;
  style?: StyleProp<ViewStyle>;
  showPremiumBadge?: boolean;
  stackTypeAboveDuration?: boolean;
  gridLayout?: boolean;
  titleLift?: number;
  showDurationClock?: boolean;
  editorialTextPlacement?: "cover" | "below-title";
}) {
  const { isPremium } = usePremium();
  if (playlists.length === 0) return null;
  const cardSize = gridLayout
    ? (Dimensions.get("window").width - H_PAD * 2 - CARD_GAP) / 2
    : CARD_WIDTH;

  const cards = playlists.map((playlist) => (
    <PressScale
      key={playlist.id}
      onPress={() => onPress?.(playlist)}
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${playlist.title}`}
      testID={`editorial-playlist-${playlist.id}`}
      style={[styles.card, { width: cardSize }]}
    >
      <View style={[styles.stack, { width: cardSize, height: cardSize + 14 }]}>
        <View style={[styles.stackStripFront, { top: cardSize }]} />
        <View style={[styles.stackStripBack, { top: cardSize + 5 }]} />
        <View style={[styles.stackStripThird, { top: cardSize + 9 }]} />
        <View style={[styles.cover, { width: cardSize, height: cardSize }]}>
          {playlist.coverUrl ? (
            <Image
              source={{ uri: playlist.coverUrl }}
              style={StyleSheet.absoluteFill}
              contentFit="cover"
              placeholder={BLUR_PLACEHOLDER}
              transition={IMAGE_TRANSITION}
              cachePolicy="memory-disk"
            />
          ) : (
            <View style={styles.missingCover}>
              <Feather name="image" size={28} color="rgba(251,251,251,0.55)" />
              <Text style={styles.missingCoverText}>Sin portada</Text>
            </View>
          )}
          <LinearGradient
            pointerEvents="none"
            colors={["rgba(0,0,0,0.02)", "rgba(0,0,0,0.08)", "rgba(0,0,0,0.42)"]}
            style={StyleSheet.absoluteFill}
          />
          {editorialTextPlacement === "cover" && editorialLabel(playlist.editorialType) ? (
            <View
              style={[
                styles.typePill,
                stackTypeAboveDuration && styles.typePillAboveDuration,
              ]}
            >
              <SessionBadgeGlass showBlackTint={false} />
              <View style={styles.whitePillTint} />
              <Text style={[styles.typeText, { color: CARD_TEXT_ABOVE }]}>
                {editorialLabel(playlist.editorialType)}
              </Text>
            </View>
          ) : null}
          <SessionDurationBadge
            label={playlist.durationLabel}
            showClock={showDurationClock}
            style={styles.duration}
            whiteGlass
            textStyle={{ color: CARD_TEXT_ABOVE }}
          />
          {showPremiumBadge && !isPremium ? (
            <Image
              source={require("@/assets/images/estrella-premium.png")}
              style={styles.premiumStar}
              contentFit="contain"
            />
          ) : null}
        </View>
      </View>
      <Text
        style={[
          styles.cardTitle,
          titleLift !== 0 && { transform: [{ translateY: -titleLift }] },
        ]}
        numberOfLines={2}
      >
        {playlist.title}
      </Text>
      {editorialTextPlacement === "below-title" && editorialLabel(playlist.editorialType) ? (
        <Text
          testID={`editorial-playlist-description-${playlist.id}`}
          style={[
            styles.cardDescription,
            titleLift !== 0 && { transform: [{ translateY: -titleLift }] },
          ]}
          numberOfLines={2}
        >
          {editorialLabel(playlist.editorialType)}
        </Text>
      ) : null}
    </PressScale>
  ));

  return (
    <View style={[styles.section, style]}>
      <View style={styles.titleRow}>
        <Text style={[styles.title, { fontSize: titleSize }]}>{title}</Text>
      </View>
      {gridLayout ? (
        <View style={styles.gridContent}>{cards}</View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.carousel}
          contentContainerStyle={styles.content}
        >
          {cards}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: H_PAD,
    marginTop: 0,
    marginBottom: 53,
  },
  titleRow: {
    marginBottom: 17,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  title: {
    color: "#FBFBFB",
    fontFamily: "Manrope",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  carousel: {
    marginHorizontal: -H_PAD,
  },
  content: {
    paddingHorizontal: H_PAD,
    gap: CARD_GAP,
  },
  gridContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
  },
  stack: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT + 14,
  },
  stackStripFront: {
    position: "absolute",
    top: CARD_HEIGHT,
    left: 12,
    right: 12,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#717172",
  },
  stackStripBack: {
    position: "absolute",
    top: CARD_HEIGHT + 5,
    left: 17,
    right: 17,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#48474D",
  },
  stackStripThird: {
    position: "absolute",
    top: CARD_HEIGHT + 9,
    left: 22,
    right: 22,
    height: 1.5,
    borderRadius: 0.75,
    backgroundColor: "#38373D",
  },
  cover: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(190,150,80,0.06)",
    justifyContent: "flex-end",
  },
  missingCover: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  missingCoverText: {
    color: "rgba(251,251,251,0.55)",
    fontFamily: "Manrope",
    fontSize: 11,
  },
  duration: {
    position: "absolute",
    left: 15,
    bottom: 15,
  },
  typePill: {
    position: "absolute",
    top: 15,
    left: 15,
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 5,
    overflow: "hidden",
  },
  typePillAboveDuration: {
    top: undefined,
    bottom: 45,
  },
  premiumStar: {
    position: "absolute",
    top: 16,
    left: 16,
    width: 22,
    height: 22,
  },
  whitePillTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.15)",
  },
  typeText: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 10,
    fontWeight: "700",
  },
  cardTitle: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 14,
    lineHeight: 18,
    fontWeight: "600",
    marginTop: 3,
  },
  cardDescription: {
    fontFamily: "Manrope",
    fontSize: 10,
    lineHeight: 15,
    fontWeight: "500",
    color: CARD_TEXT_BELOW,
    marginTop: 4,
  },
});
