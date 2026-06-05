/**
 * Reproductor de una mezcla de la comunidad.
 * ─────────────────────────────────────────────────────────────────
 * Se abre al tocar una card en el carrusel "Mezclas de la comunidad".
 * Presenta la mezcla como un TODO (no muestra las pistas ni sus
 * volúmenes) para mantener en privado la composición de cada creador.
 * Permite: reproducir/pausar, dar me gusta y compartir.
 * ─────────────────────────────────────────────────────────────────
 */
import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";

import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  getGetMixCommentsQueryKey,
  getGetSharedMixesQueryKey,
  useAddMixComment,
  useDeleteMixComment,
  useGetMixComments,
  useGetSharedMixes,
  useToggleSharedMixLike,
} from "@workspace/api-client-react";
import type { MixComment, SharedMixesPage } from "@workspace/api-client-react";

import { Image } from "expo-image";

import { getSoundImage } from "@/config/sound-images";
import { SOUNDS } from "@/data/sounds";
import { useAuth } from "@/context/AuthContext";
import { type MixPreset, useMixer } from "@/context/MixerContext";
import { useUserProfile } from "@/context/UserProfileContext";
import { getCategoryMeta, type MixCategory } from "@/data/mix-categories";
import { useColors } from "@/hooks/useColors";
import { resolveAvatarUrl } from "@/lib/avatar";
import { useLoadMix } from "@/hooks/useLoadMix";

export default function CommunityMixScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const mixId = Number(id);

  const { isSignedIn } = useAuth();
  const { photoUri } = useUserProfile();
  const { isPlaying, togglePlay, loadedPresetId, stopAll } = useMixer();

  // Parar reproducción al salir de la pantalla
  useEffect(() => () => { stopAll(); }, []);
  const loadMix = useLoadMix();
  const queryClient = useQueryClient();
  const toggleLike = useToggleSharedMixLike();
  const pendingLike = useRef(false);

  const { data, isLoading } = useGetSharedMixes();
  const mix = data?.mixes.find((m) => m.id === mixId);

  const { data: commentsData } = useGetMixComments(mixId);
  const comments = commentsData?.comments ?? [];
  const addComment = useAddMixComment();
  const deleteComment = useDeleteMixComment();
  const [draft, setDraft] = useState("");

  const presetId = `community-${mixId}`;
  const isThisLoaded = loadedPresetId === presetId;
  const isPlayingThis = isThisLoaded && isPlaying;

  const handlePlayPause = useCallback(() => {
    if (!mix) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (isThisLoaded) {
      togglePlay();
      return;
    }
    const preset: MixPreset = {
      id: presetId,
      name: mix.name,
      description: mix.description ?? undefined,
      image: mix.image ?? undefined,
      category: mix.category as MixCategory,
      sounds: mix.sounds.map((s) => ({ id: s.id, volume: s.volume })),
      createdAt: mix.createdAt,
    };
    // loadMix filtra sonidos premium/no disponibles y arranca la reproducción.
    loadMix(preset);
  }, [mix, isThisLoaded, togglePlay, presetId, loadMix]);

  const applyOptimistic = useCallback(
    (liked: boolean) => {
      const key = getGetSharedMixesQueryKey();
      queryClient.setQueryData<SharedMixesPage>(key, (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          mixes: prev.mixes.map((m) =>
            m.id === mixId
              ? { ...m, likedByMe: liked, likes: Math.max(0, m.likes + (liked ? 1 : -1)) }
              : m,
          ),
        };
      });
    },
    [queryClient, mixId],
  );

  const handleLike = useCallback(() => {
    if (!mix) return;
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
    if (pendingLike.current) return;
    pendingLike.current = true;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const nextLiked = !mix.likedByMe;
    applyOptimistic(nextLiked);
    toggleLike.mutate(
      { id: mix.id },
      {
        onError: () => applyOptimistic(!nextLiked),
        onSettled: () => {
          pendingLike.current = false;
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
  }, [mix, isSignedIn, applyOptimistic, toggleLike, queryClient]);

  const handleShare = useCallback(async () => {
    if (!mix) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Share.share({
      title: mix.name,
      message: `🎧 Escuchá "${mix.name}", una mezcla de sonidos creada por ${mix.author.displayName} en RESONANCIA. ¿Te sumás?`,
    });
  }, [mix]);

  const refreshComments = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getGetMixCommentsQueryKey(mixId) });
  }, [queryClient, mixId]);

  const handleSendComment = useCallback(() => {
    const body = draft.trim();
    if (!body) return;
    if (!isSignedIn) {
      Alert.alert(
        "Crea tu cuenta",
        "Necesitas una cuenta para dejar un comentario.",
        [
          { text: "Ahora no", style: "cancel" },
          { text: "Registrarme", onPress: () => router.push("/(auth)/sign-up" as never) },
        ],
      );
      return;
    }
    if (addComment.isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    addComment.mutate(
      { id: mixId, data: { body } },
      {
        onSuccess: () => {
          setDraft("");
          refreshComments();
        },
        onError: () =>
          Alert.alert("Ups", "No pudimos publicar tu comentario. Intentá de nuevo."),
      },
    );
  }, [draft, isSignedIn, addComment, mixId, refreshComments]);

  const handleDeleteComment = useCallback(
    (comment: MixComment) => {
      Alert.alert("Eliminar comentario", "¿Querés eliminar este comentario?", [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () =>
            deleteComment.mutate(
              { id: mixId, commentId: comment.id },
              { onSuccess: refreshComments },
            ),
        },
      ]);
    },
    [deleteComment, mixId, refreshComments],
  );

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!mix) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, paddingHorizontal: 32 }]}>
        <Feather name="cloud-off" size={32} color={colors.mutedForeground} />
        <Text style={[styles.notFound, { color: colors.foreground }]}>
          Esta mezcla ya no está disponible.
        </Text>
        <Pressable onPress={() => router.back()} style={[styles.backPill, { borderColor: colors.border }]}>
          <Text style={{ color: colors.accent, fontWeight: "600" }}>Volver</Text>
        </Pressable>
      </View>
    );
  }

  const categoryMeta = getCategoryMeta(mix.category as MixCategory);
  const authorInitial = mix.author.displayName?.trim()?.[0]?.toUpperCase() ?? "·";
  // Foto del autor: la del server si ya está sincronizada; si es mi mezcla,
  // uso la local para verla al instante en mi propio dispositivo.
  const authorAvatar = resolveAvatarUrl(mix.author.avatarUrl) ?? (mix.isMine ? photoUri : null);

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.root}
        contentContainerStyle={{ paddingBottom: insets.bottom + 28 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Botón volver */}
        <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={12}
            style={styles.backBtn}
          >
            <Feather name="chevron-left" size={26} color={colors.foreground} />
          </Pressable>
        </View>

        {/* Fila de sonidos del creador */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.soundsRow}
        >
          {mix.sounds.map((s) => {
            const soundMeta = SOUNDS.find((x) => x.id === s.id);
            const img = getSoundImage(s.id);
            return (
              <View key={s.id} style={styles.soundCard}>
                {img ? (
                  <Image source={img} style={styles.soundImg} contentFit="cover" />
                ) : (
                  <View style={[styles.soundImg, { backgroundColor: colors.card }]} />
                )}
                <Text
                  style={[styles.soundLabel, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  {soundMeta?.name ?? s.id}
                </Text>
              </View>
            );
          })}
        </ScrollView>

        {/* Contenido */}
        <View style={styles.content}>
        {categoryMeta && (
          <Text style={[styles.category, { color: colors.accent }]}>
            {categoryMeta.label.toUpperCase()}
          </Text>
        )}
        <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
          {mix.name}
        </Text>

        {/* Autor */}
        <View style={styles.authorRow}>
          {authorAvatar ? (
            <Image
              source={{ uri: authorAvatar }}
              style={[styles.avatar, { borderColor: colors.border }]}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.avatarTxt, { color: colors.accent }]}>{authorInitial}</Text>
            </View>
          )}
          <Text style={[styles.authorName, { color: colors.mutedForeground }]} numberOfLines={1}>
            Creada por {mix.author.displayName}
          </Text>
        </View>

        {/* Botón reproducir */}
        <Pressable
          onPress={handlePlayPause}
          style={({ pressed }) => [
            styles.playBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
          ]}
        >
          <Feather name={isPlayingThis ? "pause" : "play"} size={26} color={colors.background} />
          <Text style={[styles.playTxt, { color: colors.background }]}>
            {isPlayingThis ? "Pausar" : isThisLoaded ? "Reanudar" : "Reproducir mezcla"}
          </Text>
        </Pressable>

        {/* Acciones: me gusta + compartir */}
        <View style={styles.actions}>
          <Pressable
            onPress={handleLike}
            style={[styles.actionBtn, { backgroundColor: "rgba(198,155,79,0.1)", borderColor: "rgba(198,155,79,0.22)" }]}
          >
            <Feather
              name="heart"
              size={20}
              color={mix.likedByMe ? colors.primary : colors.mutedForeground}
            />
            <Text
              style={[
                styles.actionTxt,
                { color: mix.likedByMe ? colors.primary : colors.foreground },
              ]}
            >
              {mix.likes > 0 ? mix.likes : "Me gusta"}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleShare}
            style={[styles.actionBtn, { backgroundColor: "rgba(198,155,79,0.1)", borderColor: "rgba(198,155,79,0.22)" }]}
          >
            <Feather name="share-2" size={20} color={colors.mutedForeground} />
            <Text style={[styles.actionTxt, { color: colors.foreground }]}>Compartir</Text>
          </Pressable>
        </View>

        {/* Comentarios */}
        <View style={styles.commentsHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Comentarios
          </Text>
          {comments.length > 0 && (
            <Text style={[styles.commentsCount, { color: colors.mutedForeground }]}>
              {comments.length}
            </Text>
          )}
        </View>

        {/* Caja para escribir */}
        <View style={[styles.composer, { backgroundColor: "rgba(198,155,79,0.08)", borderColor: "rgba(198,155,79,0.22)" }]}>
          <TextInput
            value={draft}
            onChangeText={setDraft}
            placeholder="Deja un comentario…"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { color: colors.foreground }]}
            multiline
            maxLength={500}
          />
          <Pressable
            onPress={handleSendComment}
            disabled={!draft.trim() || addComment.isPending}
            style={[
              styles.sendBtn,
              {
                backgroundColor: draft.trim() ? colors.primary : colors.border,
                opacity: addComment.isPending ? 0.6 : 1,
              },
            ]}
          >
            <Feather name="send" size={18} color={colors.background} />
          </Pressable>
        </View>

        {/* Lista de comentarios */}
        {comments.length === 0 ? (
          <Text style={[styles.emptyComments, { color: colors.mutedForeground }]}>
            Sé el primero en comentar esta mezcla.
          </Text>
        ) : (
          comments.map((c) => (
            <View key={c.id} style={styles.commentRow}>
              <View
                style={[styles.avatar, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Text style={[styles.avatarTxt, { color: colors.accent }]}>
                  {c.author.displayName?.trim()?.[0]?.toUpperCase() ?? "·"}
                </Text>
              </View>
              <View style={styles.commentBody}>
                <View style={styles.commentTop}>
                  <Text style={[styles.commentAuthor, { color: colors.foreground }]} numberOfLines={1}>
                    {c.author.displayName}
                  </Text>
                  {c.isMine && (
                    <Pressable onPress={() => handleDeleteComment(c)} hitSlop={8}>
                      <Feather name="trash-2" size={15} color={colors.mutedForeground} />
                    </Pressable>
                  )}
                </View>
                <Text style={[styles.commentTxt, { color: colors.mutedForeground }]}>{c.body}</Text>
              </View>
            </View>
          ))
        )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  notFound: { fontSize: 16, fontWeight: "600", textAlign: "center" },
  backPill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 22, borderWidth: 1 },
  topBar: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  soundsRow: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    gap: 12,
  },
  soundCard: {
    width: 80,
    alignItems: "center",
    gap: 6,
  },
  soundImg: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  soundLabel: {
    fontSize: 11,
    textAlign: "center",
    width: 80,
  },
  content: { flex: 1, paddingHorizontal: 24 },
  category: { fontSize: 12, fontWeight: "700", letterSpacing: 1.5, marginBottom: 8 },
  title: { fontSize: 28, fontWeight: "800", letterSpacing: 0.3, lineHeight: 34 },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 16 },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTxt: { fontSize: 15, fontWeight: "700" },
  authorName: { flex: 1, fontSize: 14 },
  playBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 58,
    borderRadius: 29,
    marginTop: 30,
  },
  playTxt: { fontSize: 16, fontWeight: "700" },
  actions: { flexDirection: "row", gap: 12, marginTop: 16 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 52,
    borderRadius: 16,
    borderWidth: 1,
  },
  actionTxt: { fontSize: 15, fontWeight: "600" },
  commentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 36,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700" },
  commentsCount: { fontSize: 14, fontWeight: "600" },
  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    padding: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 6,
    paddingHorizontal: 6,
    maxHeight: 120,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyComments: { fontSize: 13.5, marginTop: 18, lineHeight: 19 },
  commentRow: { flexDirection: "row", gap: 12, marginTop: 20 },
  commentBody: { flex: 1, gap: 4 },
  commentTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  commentAuthor: { flex: 1, fontSize: 14, fontWeight: "600" },
  commentTxt: { fontSize: 14, lineHeight: 19 },
});
