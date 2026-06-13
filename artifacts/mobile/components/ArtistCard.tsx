import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image as ExpoImage } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import type { Artist } from "@/data/artists";
import { useColors } from "@/hooks/useColors";

const PHOTO_SIZE = 96;

export function ArtistCard({ artist }: { artist: Artist }) {
  const colors = useColors();

  return (
    <Pressable
      onPress={() => router.push(`/artista/${artist.id}` as never)}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={styles.photoWrap}>
        <ExpoImage
          source={artist.photo as any}
          style={styles.photo}
          contentFit="cover"
          placeholder={BLUR_PLACEHOLDER}
          transition={IMAGE_TRANSITION}
        />
        {artist.certified && (
          <View style={[styles.badge, { backgroundColor: colors.primary, borderColor: "#1B060F" }]}>
            <Feather name="check" size={12} color="#1B060F" />
          </View>
        )}
      </View>
      <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
        {artist.name}
      </Text>
      <Text style={[styles.genre, { color: colors.mutedForeground }]} numberOfLines={1}>
        {artist.genre}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: { width: PHOTO_SIZE + 20, alignItems: "center", marginRight: 14 },
  photoWrap: { width: PHOTO_SIZE, height: PHOTO_SIZE, marginBottom: 10 },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
    backgroundColor: "rgba(74,12,12,0.08)",
  },
  badge: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 13, fontWeight: "700", textAlign: "center", width: PHOTO_SIZE + 20 },
  genre: { fontSize: 11, textAlign: "center", marginTop: 2, width: PHOTO_SIZE + 20 },
});
