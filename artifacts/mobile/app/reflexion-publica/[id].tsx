import React from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { getGetUserReflectionStoryQueryKey, useGetUserReflectionStory } from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { SceneThemeBackground } from "@/components/SceneThemeBackground";
import { StoryArtworkFrame } from "@/components/StoryArtworkFrame";
import { useCoverPresetCatalog, reflectionStoryImage } from "@/lib/cover-preset-catalog";
import { resolveProfileAvatarSource } from "@/lib/profile-avatar-logic";

export default function PublicReflectionScreen() {
  const params = useLocalSearchParams<{ id: string; userId: string }>();
  const id = Number(params.id), userId = Number(params.userId);
  const { clerkUserId, isSignedIn } = useAuth();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const catalog = useCoverPresetCatalog("reflection-story");
  const query = useGetUserReflectionStory(userId, id, { query: {
    queryKey: [...getGetUserReflectionStoryQueryKey(userId, id), clerkUserId],
    enabled: isSignedIn && Number.isInteger(id) && id > 0 && Number.isInteger(userId) && userId > 0,
    staleTime: 0, refetchOnMount: "always", retry: false,
  } });
  const story = query.data;
  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <SceneThemeBackground />
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 40) + 8 }]}>
        <Pressable onPress={() => router.back()} accessibilityLabel="Volver" style={styles.back}>
          <Feather name="chevron-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Reflexión</Text>
      </View>
      {query.isPending || query.isFetching ? <ActivityIndicator color={colors.primary} /> :
        query.isError || !story ? <Text style={[styles.unavailable, { color: colors.foreground }]}>Esta reflexión ya no está disponible.</Text> :
          <ScrollView contentContainerStyle={{ alignItems: "center", paddingBottom: insets.bottom + 24 }}>
            <StoryArtworkFrame width={width - 40} message={story.message}
              bgImageSource={reflectionStoryImage(catalog, story.backgroundPresetKey)}
              composition={story}
              avatarSource={resolveProfileAvatarSource({ avatarUrl: story.avatarImagePath }, [])}
              avatarPosition={story.avatarX != null && story.avatarY != null ? { x: story.avatarX, y: story.avatarY } : undefined} />
          </ScrollView>}
    </View>
  );
}
const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", gap: 12, alignItems: "center", paddingHorizontal: 20, paddingBottom: 20 },
  back: { width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(0,0,0,0.16)", alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Manrope", fontSize: 17, fontWeight: "700" },
  unavailable: { margin: 20, fontFamily: "Manrope", fontSize: 14 },
});
