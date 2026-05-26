import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { useUserProfile } from "@/context/UserProfileContext";
import { useColors } from "@/hooks/useColors";
import { formatRelativeTime, useGrupoPosts } from "@/hooks/useGrupoPosts";

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase().slice(0, 2) || "?";
}

export default function GrupoPostScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { username } = useUserProfile();
  const params = useLocalSearchParams<{ postId?: string; grupoId?: string }>();
  const postId = params.postId ?? "";
  const grupoId = params.grupoId ?? "";

  const userName = username || "Explorador de Sonido";

  const { posts, addComment, togglePostLike, deletePost, deleteComment } = useGrupoPosts(grupoId || undefined);
  const post = useMemo(() => posts.find((p) => p.id === postId), [posts, postId]);
  const comments = post?.comments ?? [];

  const [commentText, setCommentText] = useState("");
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [postLiked, setPostLiked] = useState(false);

  const toggleCommentLike = (commentId: string) => {
    setLikedComments((prev) => {
      const next = new Set(prev);
      if (next.has(commentId)) next.delete(commentId);
      else next.add(commentId);
      return next;
    });
  };

  const handleTogglePostLike = () => {
    if (!post) return;
    const willLike = !postLiked;
    setPostLiked(willLike);
    togglePostLike(post.id, willLike);
  };

  const handleSharePost = async () => {
    if (!post) return;
    try {
      await Share.share({
        message: `${post.author}:\n\n${post.text}\n\n— Compartido desde RESONANCIA`,
      });
    } catch {
      // cancelado
    }
  };

  const openPostMenu = () => {
    if (!post) return;
    Alert.alert("Opciones", undefined, [
      { text: "Compartir", onPress: handleSharePost },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () =>
          Alert.alert(
            "Eliminar publicación",
            "¿Seguro que quieres eliminarla? Esta acción no se puede deshacer.",
            [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Eliminar",
                style: "destructive",
                onPress: async () => {
                  await deletePost(post.id);
                  router.back();
                },
              },
            ],
          ),
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const openCommentMenu = (commentId: string, author: string, text: string) => {
    Alert.alert("Opciones", undefined, [
      {
        text: "Compartir",
        onPress: async () => {
          try {
            await Share.share({
              message: `${author}:\n\n${text}\n\n— Compartido desde RESONANCIA`,
            });
          } catch {}
        },
      },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () =>
          Alert.alert(
            "Eliminar respuesta",
            "¿Seguro que quieres eliminar esta respuesta?",
            [
              { text: "Cancelar", style: "cancel" },
              {
                text: "Eliminar",
                style: "destructive",
                onPress: () => post && deleteComment(post.id, commentId),
              },
            ],
          ),
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  };

  const topPad = Math.max(insets.top, 12);
  const bottomPad = Math.max(insets.bottom, 12);

  const handleSend = async () => {
    const txt = commentText.trim();
    if (!txt || !postId) return;
    await addComment(postId, {
      author: userName,
      initials: initialsFrom(userName),
      color: "#B6955F",
      text: txt,
    });
    setCommentText("");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />
        <SacredBackground />

        {/* Header */}
        <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: colors.border }]}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Comentarios</Text>
          <View style={{ width: 22 }} />
        </View>

        {!post ? (
          <View style={styles.notFound}>
            <Feather name="alert-circle" size={28} color={colors.mutedForeground} />
            <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>
              Publicación no encontrada
            </Text>
          </View>
        ) : (
          <ScrollView
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingBottom: 24 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Parent post */}
            <View style={[styles.parentPost, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={styles.postHeader}>
                <View style={[styles.avatar, { backgroundColor: post.color + "30" }]}>
                  <Text style={[styles.avatarText, { color: post.color }]}>{post.initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.postAuthor, { color: colors.foreground }]}>{post.author}</Text>
                  <Text style={[styles.postTime, { color: colors.mutedForeground }]}>
                    {formatRelativeTime(post.createdAt)}
                  </Text>
                </View>
                <Pressable hitSlop={10} onPress={openPostMenu} style={{ padding: 4 }}>
                  <Feather name="more-horizontal" size={18} color={colors.mutedForeground} />
                </Pressable>
              </View>
              <Text style={[styles.postText, { color: colors.foreground }]}>{post.text}</Text>
              <View style={[styles.postMeta, { borderTopColor: colors.border }]}>
                <Pressable onPress={handleTogglePostLike} hitSlop={6} style={styles.metaItem}>
                  <Feather
                    name="heart"
                    size={14}
                    color={postLiked ? "#D4709A" : colors.mutedForeground}
                  />
                  <Text
                    style={[
                      styles.metaText,
                      { color: postLiked ? "#D4709A" : colors.mutedForeground },
                    ]}
                  >
                    {post.likes + (postLiked ? 1 : 0)}
                  </Text>
                </Pressable>
                <View style={styles.metaItem}>
                  <Feather name="message-square" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{comments.length}</Text>
                </View>
                <Pressable onPress={handleSharePost} hitSlop={6} style={styles.metaItem}>
                  <Feather name="share" size={14} color={colors.mutedForeground} />
                  <Text style={[styles.metaText, { color: colors.mutedForeground }]}>Compartir</Text>
                </Pressable>
              </View>
            </View>

            {/* Comments section header */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeader, { color: colors.foreground }]}>
                {comments.length === 0
                  ? "Aún no hay respuestas"
                  : `${comments.length} ${comments.length === 1 ? "respuesta" : "respuestas"}`}
              </Text>
            </View>

            {/* Comments list */}
            {comments.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="message-circle" size={26} color={colors.mutedForeground} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Sé la primera persona en responder.
                </Text>
              </View>
            ) : (
              <View style={{ paddingHorizontal: 16 }}>
                {comments.map((c) => {
                  const liked = likedComments.has(c.id);
                  return (
                    <View key={c.id} style={[styles.commentCard, { borderBottomColor: colors.border }]}>
                      <View style={[styles.commentAvatar, { backgroundColor: c.color + "30" }]}>
                        <Text style={[styles.commentInitials, { color: c.color }]}>{c.initials}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.commentHeader}>
                          <Text style={[styles.commentAuthor, { color: colors.foreground }]} numberOfLines={1}>
                            {c.author}
                          </Text>
                          <Text style={[styles.commentTime, { color: colors.mutedForeground }]}>
                            {formatRelativeTime(c.createdAt)}
                          </Text>
                          <View style={{ flex: 1 }} />
                          <Pressable
                            hitSlop={8}
                            onPress={() => openCommentMenu(c.id, c.author, c.text)}
                          >
                            <Feather name="more-horizontal" size={16} color={colors.mutedForeground} />
                          </Pressable>
                        </View>
                        <Text style={[styles.commentText, { color: colors.foreground }]}>{c.text}</Text>
                        <Pressable
                          onPress={() => toggleCommentLike(c.id)}
                          hitSlop={8}
                          style={styles.commentLikeBtn}
                        >
                          <Feather
                            name="heart"
                            size={13}
                            color={liked ? "#D4709A" : colors.mutedForeground}
                          />
                          <Text
                            style={[
                              styles.commentLikeText,
                              { color: liked ? "#D4709A" : colors.mutedForeground },
                            ]}
                          >
                            {liked ? "1" : "Me gusta"}
                          </Text>
                        </Pressable>
                      </View>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>
        )}

        {/* Compose bar */}
        {post && (
          <View
            style={[
              styles.composeBar,
              {
                paddingBottom: bottomPad + 8,
                backgroundColor: colors.background,
                borderTopColor: colors.border,
              },
            ]}
          >
            <View style={[styles.composeInput, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Escribir una respuesta..."
                placeholderTextColor={colors.mutedForeground}
                style={[styles.composeText, { color: colors.foreground }]}
                multiline
              />
            </View>
            <Pressable
              onPress={handleSend}
              disabled={!commentText.trim()}
              style={[
                styles.sendBtn,
                {
                  backgroundColor: commentText.trim() ? colors.primary : colors.card,
                  borderColor: colors.border,
                },
              ]}
            >
              <Feather
                name="send"
                size={18}
                color={commentText.trim() ? "#080F0A" : colors.mutedForeground}
              />
            </Pressable>
          </View>
        )}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 16, fontWeight: "700" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  notFoundText: { fontSize: 14 },
  parentPost: { margin: 16, borderRadius: 14, borderWidth: 1, padding: 16 },
  postHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 13, fontWeight: "700" },
  postAuthor: { fontSize: 14, fontWeight: "700" },
  postTime: { fontSize: 12, marginTop: 2 },
  postText: { fontSize: 15, lineHeight: 22, marginBottom: 12 },
  postMeta: { flexDirection: "row", gap: 18, paddingTop: 10, borderTopWidth: 1 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontSize: 12 },
  sectionHeaderRow: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 10 },
  sectionHeader: { fontSize: 13, fontWeight: "600", letterSpacing: 0.3 },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyText: { fontSize: 13 },
  commentCard: { flexDirection: "row", gap: 10, paddingVertical: 14, borderBottomWidth: 1 },
  commentAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  commentInitials: { fontSize: 12, fontWeight: "700" },
  commentHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 3 },
  commentAuthor: { fontSize: 13, fontWeight: "700" },
  commentTime: { fontSize: 11 },
  commentText: { fontSize: 14, lineHeight: 20 },
  commentLikeBtn: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6, alignSelf: "flex-start" },
  commentLikeText: { fontSize: 12, fontWeight: "600" },
  composeBar: {
    flexDirection: "row",
    gap: 10,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    alignItems: "flex-end",
  },
  composeInput: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxHeight: 100,
  },
  composeText: { fontSize: 14 },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
