/**
 * Reproductor de una mezcla de la comunidad — diseño glassmorphism.
 * Grid 4 columnas de sonidos + panel glass + glow en play button.
 */
import { Feather } from "@expo/vector-icons";
import { useQueryClient } from "@tanstack/react-query";
import * as Haptics from "expo-haptics";

import { router, useLocalSearchParams } from "expo-router";
import { GoldGradient, GoldGradientFill } from "@/components/GoldGradient";
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
import { LinearGradient } from "expo-linear-gradient";

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
    if (isThisLoaded) { togglePlay(); return; }
    const preset: MixPreset = {
      id: presetId,
      name: mix.name,
      description: mix.description ?? undefined,
      image: mix.image ?? undefined,
      category: mix.category as MixCategory,
      sounds: mix.sounds.map((s) => ({ id: s.id, volume: s.volume })),
      createdAt: mix.createdAt,
    };
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
        onSettled: () => { pendingLike.current = false; },
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
        onSuccess: () => { setDraft(""); refreshComments(); },
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
      <LinearGradient colors={["#4A0C0C", "#27070E", "#1B060F"]} style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </LinearGradient>
    );
  }

  if (!mix) {
    return (
      <LinearGradient colors={["#4A0C0C", "#27070E", "#1B060F"]} style={[styles.center, { paddingHorizontal: 32 }]}>
        <Feather name="cloud-off" size={32} color={colors.mutedForeground} />
        <Text style={[styles.notFound, { color: colors.foreground }]}>
          Esta mezcla ya no está disponible.
        </Text>
        <Pressable onPress={() => router.back()} style={[styles.backPill, { borderColor: colors.border }]}>
          <Text style={{ color: colors.accent, fontWeight: "600" }}>Volver</Text>
        </Pressable>
      </LinearGradient>
    );
  }

  const categoryMeta = getCategoryMeta(mix.category as MixCategory);
  const authorInitial = mix.author.displayName?.trim()?.[0]?.toUpperCase() ?? "·";
  const authorAvatar = resolveAvatarUrl(mix.author.avatarUrl) ?? (mix.isMine ? photoUri : null);

  return (
    <LinearGradient
      colors={["#4A0C0C", "#27070E", "#1B060F"]}
      style={styles.root}
    >
    <KeyboardAvoidingView
      style={styles.root}
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

        {/* Fila de sonidos — scroll horizontal, una sola fila */}
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

        {/* Glass panel */}
        <View style={[styles.glassPanel, { backgroundColor: "rgba(27,6,15,0.88)", borderColor: "rgba(61,14,22,0.50)" }]}>

          {/* Categoría + título */}
          {categoryMeta && (
            <Text style={[styles.category, { color: colors.accent }]}>
              {categoryMeta.label.toUpperCase()}
            </Text>
          )}
          <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={2}>
            {mix.name}
          </Text>

          {/* Autor */}
          <View style={[styles.authorRow, { borderBottomColor: "rgba(61,14,22,0.40)" }]}>
            {authorAvatar ? (
              <Image
                source={{ uri: authorAvatar }}
                style={[styles.avatar, { borderColor: `${colors.primary}44` }]}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatar, { backgroundColor: "rgba(212,175,55,0.12)", borderColor: `${colors.primary}44` }]}>
                <Text style={[styles.avatarTxt, { color: colors.accent }]}>{authorInitial}</Text>
              </View>
            )}
            <View>
              <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Creada por</Text>
              <Text style={[styles.authorName, { color: colors.foreground }]} numberOfLines={1}>
                {mix.author.displayName}
              </Text>
            </View>
          </View>

          {/* Botón reproducir con glow */}
          <View style={styles.playWrap}>
            <GoldGradient style={styles.playGlow} />
            <Pressable
              onPress={handlePlayPause}
              style={({ pressed }) => [
                styles.playBtn,
                { overflow: "hidden", opacity: pressed ? 0.88 : 1 },
              ]}
            >
              <GoldGradientFill />
              <Feather name={isPlayingThis ? "pause" : "play"} size={24} color={colors.background} />
              <Text style={[styles.playTxt, { color: colors.background }]}>
                {isPlayingThis ? "Pausar" : isThisLoaded ? "Reanudar" : "Reproducir mezcla"}
              </Text>
            </Pressable>
          </View>

          {/* Me gusta + Compartir — sin borde */}
          <View style={styles.actions}>
            <Pressable
              onPress={handleLike}
              style={[styles.actionBtn, { backgroundColor: "rgba(74,12,12,0.08)" }]}
            >
              <Feather
                name="heart"
                size={20}
                color={mix.likedByMe ? colors.primary : colors.mutedForeground}
              />
              <Text style={[styles.actionTxt, { color: mix.likedByMe ? colors.primary : colors.foreground }]}>
                {mix.likes > 0 ? mix.likes : "Me gusta"}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleShare}
              style={[styles.actionBtn, { backgroundColor: "rgba(74,12,12,0.08)" }]}
            >
              <Feather name="share-2" size={20} color={colors.mutedForeground} />
              <Text style={[styles.actionTxt, { color: colors.foreground }]}>Compartir</Text>
            </Pressable>
          </View>

          {/* Comentarios */}
          <View style={styles.commentsHeader}>
            <Feather name="message-circle" size={15} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Comentarios
            </Text>
            {comments.length > 0 && (
              <Text style={[styles.commentsCount, { color: colors.mutedForeground }]}>
                {comments.length}
              </Text>
            )}
          </View>

          {/* Caja para escribir — sin borde */}
          <View style={[styles.composer, { backgroundColor: "rgba(74,12,12,0.08)" }]}>
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
                  backgroundColor: draft.trim() ? undefined : colors.card,
                  overflow: "hidden",
                  opacity: addComment.isPending ? 0.6 : 1,
                },
              ]}
            >
              {!!draft.trim() && <GoldGradientFill />}
              <Feather name="send" size={16} color={colors.background} />
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
                <View style={[styles.avatar, { backgroundColor: colors.card, borderColor: colors.border }]}>
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
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 14 },
  notFound: { fontSize: 16, fontWeight: "600", textAlign: "center" },
  backPill: { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 22, borderWidth: 1 },

  topBar: { paddingHorizontal: 12, paddingBottom: 8 },
  backBtn: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(74,12,12,0.08)",
  },

  soundsRow: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 10,
  },
  soundCard: { width: 72, alignItems: "center", gap: 6 },
  soundImg: { width: 72, height: 72, borderRadius: 12 },
  soundLabel: { fontSize: 10, textAlign: "center", width: 72 },

  glassPanel: {
    marginHorizontal: 16,
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
    borderWidth: 1,
  },

  category: { fontSize: 11, fontWeight: "700", letterSpacing: 1.8, marginBottom: 6 },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: 0.3, lineHeight: 32, marginBottom: 18 },

  authorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingBottom: 18,
    marginBottom: 22,
    borderBottomWidth: 1,
  },
  avatar: {
    width: 34, height: 34, borderRadius: 17,
    borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  avatarTxt: { fontSize: 15, fontWeight: "700" },
  authorName: { fontSize: 14, fontWeight: "600" },

  playWrap: { position: "relative", marginBottom: 14 },
  playGlow: {
    position: "absolute",
    top: 4, left: 16, right: 16, bottom: 4,
    borderRadius: 29,
    opacity: 0.35,
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 22,
    shadowOpacity: 1,
  },
  playBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 56,
    borderRadius: 28,
  },
  playTxt: { fontSize: 16, fontWeight: "700" },

  actions: { flexDirection: "row", gap: 12, marginBottom: 28 },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 16,
  },
  actionTxt: { fontSize: 15, fontWeight: "600" },

  commentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", flex: 1 },
  commentsCount: { fontSize: 14, fontWeight: "600" },

  composer: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 10,
    padding: 10,
    borderRadius: 16,
    marginBottom: 16,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 6,
    paddingHorizontal: 6,
    maxHeight: 120,
  },
  sendBtn: {
    width: 38, height: 38, borderRadius: 19,
    alignItems: "center", justifyContent: "center",
  },

  emptyComments: { fontSize: 13.5, lineHeight: 19 },
  commentRow: { flexDirection: "row", gap: 12, marginTop: 20 },
  commentBody: { flex: 1, gap: 4 },
  commentTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  commentAuthor: { flex: 1, fontSize: 14, fontWeight: "600" },
  commentTxt: { fontSize: 14, lineHeight: 19 },
});
