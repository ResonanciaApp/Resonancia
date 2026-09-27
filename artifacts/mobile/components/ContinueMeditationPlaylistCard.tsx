import { Feather, FontAwesome } from "@expo/vector-icons";
import { Image as ExpoImage, type ImageSource } from "expo-image";
import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  View,
  type ViewStyle,
} from "react-native";

import type { PlaylistCompletion } from "@/lib/editorial-playlist-helpers";
import { usePremium } from "@/context/PremiumContext";
import { CARD_TEXT_BELOW } from "@/constants/colors";

type Props = {
  title: string;
  description: string;
  coverSource: unknown;
  completion: PlaylistCompletion;
  onPress: () => void;
  sectionStyle?: StyleProp<ViewStyle>;
};

export function ContinueMeditationPlaylistCard({
  title,
  description,
  coverSource,
  completion,
  onPress,
  sectionStyle,
}: Props) {
  const { isPremium } = usePremium();
  return (
    <View
      style={[styles.section, sectionStyle]}
      testID="continue-meditation-playlist-section"
    >
      <Text style={styles.sectionTitle}>Continua tu programa</Text>
      <Pressable
        onPress={onPress}
        accessibilityRole="button"
        accessibilityLabel={`Continuar ${title}. ${completion.completed} de ${completion.total} sesiones completadas, ${completion.percentage} por ciento`}
        testID="continue-meditation-playlist-card"
        style={({ pressed }) => [
          styles.card,
          { opacity: pressed ? 0.84 : 1 },
        ]}
      >
        <View style={styles.coverStack}>
          <View style={styles.stackStripFront} />
          <View style={styles.stackStripBack} />
          <View style={styles.stackStripThird} />
          <ExpoImage
            source={coverSource as ImageSource}
            style={styles.cover}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
           {!isPremium && (
             <FontAwesome
               name="star"
               size={20}
               color="#E5B84B"
               style={styles.premiumStar}
             />
           )}
        </View>
        <View style={styles.copy}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={[styles.description, { color: CARD_TEXT_BELOW }]} numberOfLines={2}>
            {description}
          </Text>
          <View style={styles.progressRow}>
            <Text style={[styles.progressCount, { color: CARD_TEXT_BELOW }]}>
              {completion.completed}/{completion.total}
            </Text>
            <View
              style={styles.progressTrack}
              accessibilityRole="progressbar"
              accessibilityValue={{
                min: 0,
                max: 100,
                now: completion.percentage,
              }}
            >
              <View
                style={[
                  styles.progressFill,
                  { width: `${completion.percentage}%` },
                ]}
              />
            </View>
          </View>
        </View>
        <Feather
          name="chevron-right"
          size={22}
          color="rgba(249,249,249,0.72)"
          style={styles.chevron}
        />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 16,
    marginTop: 5,
    marginBottom: 53,
  },
  sectionTitle: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 17,
  },
  card: {
    minHeight: 97,
    flexDirection: "row",
    alignItems: "center",
    gap: 19,
  },
  coverStack: {
    width: 87,
    height: 97,
  },
  stackStripFront: {
    position: "absolute",
    top: 87,
    left: 8,
    right: 8,
    height: 2,
    borderRadius: 1.5,
    backgroundColor: "#717172",
  },
  stackStripBack: {
    position: "absolute",
    top: 90,
    left: 11,
    right: 11,
    height: 1.5,
    borderRadius: 1,
    backgroundColor: "#48474D",
  },
  stackStripThird: {
    position: "absolute",
    top: 93,
    left: 14,
    right: 14,
    height: 1,
    borderRadius: 0.75,
    backgroundColor: "#38373D",
  },
  cover: {
    width: 87,
    height: 87,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  premiumStar: {
    position: "absolute",
    top: 8,
    left: 8,
    zIndex: 10,
    textShadowColor: "rgba(0,0,0,0.65)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    alignSelf: "stretch",
    justifyContent: "center",
  },
  title: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 15,
    lineHeight: 19,
    fontWeight: "700",
  },
  description: {
    width: "88%",
    color: "rgba(249,249,249,0.68)",
    fontFamily: "Manrope",
    fontSize: 11,
    lineHeight: 15,
    marginTop: 3,
  },
  chevron: {
    marginLeft: -5,
    marginRight: -2,
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    marginTop: 9,
  },
  progressCount: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "700",
    minWidth: 24,
  },
  progressTrack: {
    width: "60%",
    height: 4,
    borderRadius: 2,
    overflow: "hidden",
    backgroundColor: "rgba(249,249,249,0.18)",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
    backgroundColor: "#F9F9F9",
  },
});