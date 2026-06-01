import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image as ExpoImage } from "expo-image";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import type { Guide } from "@/data/guides";
import { useColors } from "@/hooks/useColors";

const PHOTO_SIZE = 96;

export function GuideCard({ guide }: { guide: Guide }) {
  const colors = useColors();

  return (
    <Pressable
      onPress={() => router.push(`/guiador/${guide.id}` as never)}
      style={({ pressed }) => [styles.card, { opacity: pressed ? 0.85 : 1 }]}
    >
      <View style={styles.photoWrap}>
        <ExpoImage
          source={guide.photo as any}
          style={styles.photo}
          contentFit="cover"
          placeholder={BLUR_PLACEHOLDER}
          transition={IMAGE_TRANSITION}
        />
        {guide.certified && (
          <View style={[styles.badge, { backgroundColor: colors.primary, borderColor: "#060905" }]}>
            <Feather name="check" size={12} color="#1A120A" />
          </View>
        )}
      </View>
      <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
        {guide.name}
      </Text>
      <Text style={[styles.specialty, { color: colors.mutedForeground }]} numberOfLines={1}>
        {guide.specialty}
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
    backgroundColor: "rgba(255,255,255,0.05)",
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
  name: { fontSize: 13, fontWeight: "700", textAlign: "center" },
  specialty: { fontSize: 11, textAlign: "center", marginTop: 2 },
});
