/**
 * CommunityMixesCarousel — carrusel de mezclas compartidas por la comunidad.
 * ─────────────────────────────────────────────────────────────────
 * Aparece en Inicio (debajo de las secciones). Cualquiera puede ver y
 * reproducir. Dar like requiere cuenta (Clerk); un invitado es enviado
 * a registrarse. Tocar una card carga la mezcla y abre el mezclador.
 * ─────────────────────────────────────────────────────────────────
 */
import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useCallback, useRef } from "react";
import {
  Alert,
  ImageBackground,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  getGetSharedMixesQueryKey,
  useGetSharedMixes,
  useToggleSharedMixLike,
} from "@workspace/api-client-react";
import type { SharedMix, SharedMixesPage } from "@workspace/api-client-react";

import { getMixImage } from "@/config/mix-images";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

export function CommunityMixesCarousel() {
  const colors = useColors();
  const { isSignedIn } = useAuth();
  const queryClient = useQueryClient();

  const { data } = useGetSharedMixes();
  const toggleLike = useToggleSharedMixLike();
  // IDs de mezclas con un like en vuelo, para ignorar taps repetidos.
  const pendingLikes = useRef<Set<number>>(new Set());

  const mixes = data?.mixes ?? [];

  const applyOptimistic = useCallback(
    (id: number, liked: boolean) => {
      const key = getGetSharedMixesQueryKey();
      queryClient.setQueryData<SharedMixesPage>(key, (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          mixes: prev.mixes.map((m) =>
            m.id === id
              ? { ...m, likedByMe: liked, likes: Math.max(0, m.likes + (liked ? 1 : -1)) }
              : m,
          ),
        };
      });
    },
    [queryClient],
  );

  const handleLike = useCallback(
    (mix: SharedMix) => {
      if (!isSignedIn) {
        Alert.alert(
          "Crea tu cuenta",
          "Necesitas una cuenta para dar me gusta a las mezclas de la comunidad.",
          [
            { text: "Ahora no", style: "cancel" },
            { text: "Registrarme", onPress: () => router.push("/(auth)/sign-up" as never) },
          ],
        );
        return;
      }
      if (pendingLikes.current.has(mix.id)) return;
      pendingLikes.current.add(mix.id);
      const nextLiked = !mix.likedByMe;
      applyOptimistic(mix.id, nextLiked);
      toggleLike.mutate(
        { id: mix.id },
        {
          onError: () => {
            applyOptimistic(mix.id, !nextLiked);
          },
          onSettled: () => {
            pendingLikes.current.delete(mix.id);
          },
          onSuccess: (updated) => {
            const key = getGetSharedMixesQueryKey();
            queryClient.setQueryData<SharedMixesPage>(key, (prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                mixes: prev.mixes.map((m) =>
                  m.id === updated.id
                    ? { ...m, likes: updated.likes, likedByMe: updated.likedByMe }
                    : m,
                ),
              };
            });
          },
        },
      );
    },
    [isSignedIn, applyOptimistic, toggleLike, queryClient],
  );

  const handlePlay = useCallback((mix: SharedMix) => {
    // Abre el reproductor de la mezcla de la comunidad (la presenta como un
    // todo, sin exponer las pistas/volúmenes del creador).
    router.push(`/mezcla/${mix.id}` as never);
  }, []);

  if (mixes.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Mezclas de la comunidad
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hScroll}
      >
        {mixes.map((mix) => (
          <View
            key={mix.id}
            style={[styles.card, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: colors.border }]}
          >
            <Pressable onPress={() => handlePlay(mix)}>
              <ImageBackground
                source={getMixImage(mix.image ?? undefined)}
                style={styles.thumb}
                imageStyle={styles.thumbInner}
              >
                <View style={styles.playBubble}>
                  <Feather name="play" size={16} color="#FFFFFF" />
                </View>
              </ImageBackground>
            </Pressable>

            <View style={styles.cardBody}>
              <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>
                {mix.name}
              </Text>
              <Text style={[styles.cardAuthor, { color: colors.mutedForeground }]} numberOfLines={1}>
                {mix.author.displayName}
              </Text>

              <Pressable onPress={() => handleLike(mix)} hitSlop={8} style={styles.likeRow}>
                <Feather
                  name="heart"
                  size={14}
                  color={mix.likedByMe ? colors.primary : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.likeCount,
                    { color: mix.likedByMe ? colors.primary : colors.mutedForeground },
                  ]}
                >
                  {mix.likes}
                </Text>
              </Pressable>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 22, paddingHorizontal: 20 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "700", letterSpacing: 0.3 },
  hScroll: { paddingRight: 12, gap: 12 },
  card: { width: 150, borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  thumb: { height: 96, justifyContent: "center", alignItems: "center" },
  thumbInner: {},
  playBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(24,17,12,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { padding: 10 },
  cardName: { fontSize: 14, fontWeight: "700" },
  cardAuthor: { fontSize: 12, marginTop: 2 },
  likeRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 8 },
  likeCount: { fontSize: 12, fontWeight: "600" },
});
