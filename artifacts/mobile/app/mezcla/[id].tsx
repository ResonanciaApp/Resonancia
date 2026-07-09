/**
 * Reproductor de una mezcla de la comunidad — diseño glassmorphism.
 * Grid 4 columnas de sonidos + panel glass + glow en play button.
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

  const onAuthorPress = () => {
    if (!mix) return;
    router.push(`/mezcla-creador/${mix.author.userId}` as never);
  };

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
      <LinearGradient colors={["#340D1A", "#190913"]} style={styles.center}>
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
      colors={["#340D1A", "#190913"]}
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
        <View style={[styles.glassPanel, { backgroundColor: "transparent", borderColor: "transparent" }]}>

          {/* Categoría + título */}
          {categoryMeta && (
            <Text style={[styles.category, { color: "#F7CB6B" }]}>
              {categoryMeta.label.toUpperCase()}
            </Text>
          )}
          <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
            <Text style={[styles.title, { color: colors.foreground, flex: 1 }]} numberOfLines={2}>
              {mix.name}
            </Text>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 15 }}>
              <Pressable onPress={handleShare} hitSlop={10}>
                <Feather name="share" size={22} color="#FFFFFF" />
              </Pressable>
              <Pressable onPress={handleLike} hitSlop={10}>
                <Feather
                  name="heart"
                  size={22}
                  color={mix.likedByMe ? "#F7CB6B" : "#FFFFFF"}
                />
              </Pressable>
            </View>
          </View>

          {/* Autor */}
          <Pressable
            onPress={onAuthorPress}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text style={styles.authorNameInline}>
              {"Por "}
              <Text style={styles.authorNameLink}>{mix.author.displayName}</Text>
            </Text>
          </Pressable>

          {/* Botón reproducir */}
          <Pressable
            onPress={handlePlayPause}
            style={({ pressed }) => [
              styles.playBtn,
              { overflow: "hidden", opacity: pressed ? 0.88 : 1, marginTop: 24, marginBottom: 14 },
            ]}
          >
            <LinearGradient
              colors={["#D6A45C", "#F7CB6B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Feather name={isPlayingThis ? "pause" : "play"} size={18} color={colors.primaryForeground} />
              <Text style={[styles.playTxt, { color: colors.primaryForeground }]}>
                {isPlayingThis ? "Pausar" : isThisLoaded ? "Reanudar" : "Reproducir mezcla"}
              </Text>
            </View>
          </Pressable>

          {/* Botón compartir */}
          <Pressable
            onPress={handleShare}
            style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1, marginBottom: 14 })}
          >
            <LinearGradient
              colors={["#D6A45C", "#F7CB6B"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={styles.shareBtnGradientBorder}
            >
              <View style={styles.shareBtnInner}>
                <Text style={styles.shareBtnText}>Compartir</Text>
                <Feather name="send" size={15} color="#D6A45C" />
              </View>
            </LinearGradient>
          </Pressable>


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
          <View style={[styles.composer, { backgroundColor: "rgba(190,150,80,0.06)" }]}>
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
              style={{ opacity: draft.trim() && !addComment.isPending ? 1 : 0.3, padding: 4 }}
            >
              <Feather name="corner-down-left" size={20} color="#F7CB6B" />
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    height: 38,
    width: 42,
    borderRadius: 19,
  },

  soundsRow: {
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 20,
    gap: 10,
  },
  soundCard: { width: 72, alignItems: "center", gap: 6 },
  soundImg: { width: 72, height: 72, borderRadius: 12 },
  soundLabel: { fontSize: 10, textAlign: "center", width: 72 },

  glassPanel: {
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 24,
  },

  category: { fontSize: 11, fontWeight: "700", letterSpacing: 1.8, marginBottom: 6 },
  title: { fontSize: 26, fontWeight: "800", letterSpacing: 0.3, lineHeight: 32, marginBottom: 18 },

  authorNameInline: {
    fontSize: 14,
    fontWeight: "500",
    color: "#FFFFFF",
    marginTop: -11,
    marginBottom: 16,
  },
  authorNameLink: {
    textDecorationLine: "underline",
    textDecorationColor: "#FFFFFF",
  },

  playBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 30,
    shadowColor: "#F7CB6B",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  playTxt: { fontSize: 16, fontWeight: "700", letterSpacing: 0.5 },
  shareBtnGradientBorder: { borderRadius: 30, padding: 1.5 },
  shareBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 9,
    borderRadius: 29,
    backgroundColor: "#210911",
    paddingHorizontal: 24,
  },
  shareBtnText: { fontSize: 16, fontWeight: "600", color: "#D6AD5F", letterSpacing: 0.5 },

  commentsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
    marginTop: 22,
  },
  sectionTitle: { fontSize: 16, fontWeight: "700", letterSpacing: 0.5, flex: 1 },
  commentsCount: { fontSize: 10, fontWeight: "600" },

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
