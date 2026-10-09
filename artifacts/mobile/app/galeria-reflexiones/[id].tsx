import React, { useRef } from "react";
import { View, StyleSheet, ActivityIndicator, Text, Pressable, Alert } from "react-native";
import { useLocalSearchParams, router } from "expo-router";
import {
  createMyReflectionStory,
  useDeleteMyReflectionStory,
  useGetMyReflectionStory,
  getGetMyReflectionStoryQueryKey,
  type ReflectionStoryInput,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { StoryShareModal } from "@/components/StoryShareModal";
import { StoryArtworkFrame } from "@/components/StoryArtworkFrame";
import { resolveProfileAvatarSource } from "@/lib/profile-avatar-logic";
import { useCoverPresetCatalogState } from "@/lib/cover-preset-catalog";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { Feather } from "@expo/vector-icons";
import { canShareReflection, getStableIdempotencyKey } from "@/lib/reflection-story-logic";

export default function GalleryDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const { authLoading, isSignedIn, clerkUserId } = useAuth();
  const qc = useQueryClient();
  const idempotencyState = useRef({ hash: "", key: "" });
  const { items: coverCatalog } = useCoverPresetCatalogState("reflection-story");
  const storyId = Number(id);
  const validStoryId = Number.isInteger(storyId) && storyId > 0;
  const deleteMutation = useDeleteMyReflectionStory();

  const { data: story, isLoading, isError, refetch } = useGetMyReflectionStory(storyId, {
    query: {
      enabled: validStoryId && !authLoading && isSignedIn && Boolean(clerkUserId),
      queryKey: [...getGetMyReflectionStoryQueryKey(storyId), clerkUserId],
    }
  });

  if (isLoading) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (isError || !story) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.destructive }]}>No se pudo cargar la historia.</Text>
        <Pressable style={styles.retryButton} onPress={() => refetch()}>
           <Text style={{ color: colors.primary }}>Reintentar</Text>
        </Pressable>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
           <Feather name="chevron-left" size={20} color={colors.foreground} />
           <Text style={{ color: colors.foreground, marginLeft: 4 }}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const selectedImageSource = coverCatalog.find(
    (candidate) => candidate.key === story.backgroundPresetKey,
  )?.source;

  const checkConstraints = () => {
    if (!canShareReflection(story.message)) {
      throw new Error("La reflexión supera el límite de 160 caracteres para una historia.");
    }
  };

  const handleBeforeInstagramShare = async () => {
    const payload: ReflectionStoryInput = {
      message: story.message,
      category: story.category,
      backgroundPresetKey: story.backgroundPresetKey,
      backgroundScale: story.backgroundScale,
      backgroundX: story.backgroundX,
      backgroundY: story.backgroundY,
      textX: story.textX,
      textY: story.textY,
      textScale: story.textScale ?? 1,
      avatarImagePath: story.avatarImagePath ?? null,
      avatarX: story.avatarX ?? null,
      avatarY: story.avatarY ?? null,
    };
    idempotencyState.current = getStableIdempotencyKey(payload, idempotencyState.current);
    try {
      await createMyReflectionStory(payload, {
        headers: { "Idempotency-Key": idempotencyState.current.key },
      });
      await qc.invalidateQueries({
        predicate: (query) => query.queryKey[0] === "/api/me/reflection-stories",
      });
    } catch {
      throw new Error("No se pudo guardar el nuevo envío en la galería.");
    }
  };

  const requestDelete = () => {
    Alert.alert(
      "¿Quieres borrar esta historia?",
      "La historia se eliminará de tu galería.",
      [
        { text: "Conservar", style: "cancel" },
        {
          text: "Sí, borrar",
          style: "destructive",
          onPress: () => {
            const cachedQueries = qc.getQueriesData({
              predicate: (query) => query.queryKey[0] === "/api/me/reflection-stories",
            });

            cachedQueries.forEach(([queryKey, data]) => {
              if (!data || typeof data !== "object") return;
              if ("items" in data && Array.isArray(data.items)) {
                qc.setQueryData(queryKey, {
                  ...data,
                  items: data.items.filter(
                    (item) => typeof item !== "object" || item === null || !("id" in item) || item.id !== story.id,
                  ),
                });
                return;
              }
              if ("id" in data && data.id === story.id) {
                qc.removeQueries({ queryKey, exact: true });
              }
            });

            router.back();
            deleteMutation.mutate(
              { id: story.id },
              {
                onError: () => {
                  cachedQueries.forEach(([queryKey, data]) => {
                    qc.setQueryData(queryKey, data);
                  });
                  Alert.alert(
                    "No se pudo borrar",
                    "La historia volvió a aparecer en tu galería. Inténtalo nuevamente.",
                  );
                },
                onSettled: () => {
                  void qc.invalidateQueries({
                    predicate: (query) => query.queryKey[0] === "/api/me/reflection-stories",
                  });
                },
              },
            );
          },
        },
      ],
    );
  };

  return (
    <StoryShareModal
      title="Historia"
      onClose={() => router.back()}
      checkConstraints={checkConstraints}
      onBeforeInstagramShare={handleBeforeInstagramShare}
      captureKey={story.id.toString()}
      showGenericShare={false}
      previewScale={0.8}
      previewOffsetY={0}
      closeOnLeft
      headerRightAction={(
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Borrar historia"
          disabled={deleteMutation.isPending}
          onPress={requestDelete}
          style={({ pressed }) => [
            styles.deleteButton,
            (pressed || deleteMutation.isPending) && styles.buttonPressed,
          ]}
        >
          <Feather name="trash-2" size={19} color="#F9F9F9" />
        </Pressable>
      )}
      titleFontSize={15}
      lightInstagramButton
      compactFooter
      embedded
      renderArtwork={(width, isExport, callbacks) => {
        return (
          <StoryArtworkFrame
            avatarSource={resolveProfileAvatarSource({ avatarUrl: story.avatarImagePath }, [])}
            avatarPosition={story.avatarX != null && story.avatarY != null ? { x: story.avatarX, y: story.avatarY } : undefined}
            message={story.message}
            width={width}
            bgImageSource={selectedImageSource}
            composition={{
              backgroundScale: story.backgroundScale,
              backgroundX: story.backgroundX,
              backgroundY: story.backgroundY,
              textX: story.textX,
              textY: story.textY,
              textScale: story.textScale ?? 1,
            }}
            onReady={callbacks.onReady}
            onFailure={callbacks.onFailure}
          />
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Manrope",
    marginBottom: 12,
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginBottom: 20,
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  deleteButton: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.16)",
    borderWidth: 0,
    borderColor: "transparent",
  },
  buttonPressed: {
    opacity: 0.58,
  },
});