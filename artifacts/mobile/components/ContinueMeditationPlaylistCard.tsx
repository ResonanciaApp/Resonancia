import { Feather } from "@expo/vector-icons";
import { Image as ExpoImage, type ImageSource } from "expo-image";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { PlaylistCompletion } from "@/lib/editorial-playlist-helpers";

type Props = {
  title: string;
  description: string;
  coverSource: unknown;
  completion: PlaylistCompletion;
  onPress: () => void;
};

export function ContinueMeditationPlaylistCard({
  title,
  description,
  coverSource,
  completion,
  onPress,
}: Props) {
  return (
    <View style={styles.section} testID="continue-meditation-playlist-section">
      <Text style={styles.sectionTitle}>Continúa tu Playlist meditativa</Text>
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
        </View>
        <View style={styles.copy}>
          <Text style={styles.title} numberOfLines={1}>{title}</Text>
          <Text style={styles.description} numberOfLines={2}>
            {description}
          </Text>
          <View style={styles.progressRow}>
            <Text style={styles.progressCount}>
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
    marginTop: -25,
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
    minHeight: 138,
    flexDirection: "row",
    alignItems: "center",
    gap: 19,
  },
  coverStack: {
    width: 124,
    height: 138,
  },
  stackStripFront: {
    position: "absolute",
    top: 124,
    left: 11,
    right: 11,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#717172",
  },
  stackStripBack: {
    position: "absolute",
    top: 129,
    left: 16,
    right: 16,
    height: 2,
    borderRadius: 1,
    backgroundColor: "#48474D",
  },
  stackStripThird: {
    position: "absolute",
    top: 133,
    left: 20,
    right: 20,
    height: 1.5,
    borderRadius: 0.75,
    backgroundColor: "#38373D",
  },
  cover: {
    width: 124,
    height: 124,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
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