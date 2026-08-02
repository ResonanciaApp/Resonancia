import { Feather } from "@expo/vector-icons";
import { GoldGradientFill } from "@/components/GoldGradient";
import { LinearGradient } from "expo-linear-gradient";
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

import { useUserProfile } from "@/context/UserProfileContext";
import { useColors } from "@/hooks/useColors";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { formatRelativeTime, useGrupoPosts } from "@/hooks/useGrupoPosts";

function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase().slice(0, 2) || "?";
}

export default function GrupoPostScreen() {
  const colors = useColors();
  const { theme: sceneTheme } = useSceneTheme();
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
      color: "#dad4ec",
      text: txt,
    });
    setCommentText("");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: sceneTheme.gradient[0] }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.root}>
        <StatusBar hidden />
        <LinearGradient colors={sceneTheme.gradient} style={StyleSheet.absoluteFill} />

        {/* Header */}
        <View style={[styles.header, { paddingTop: topPad + 8, borderBottomColor: "rgba(255,255,255,0.1)" }]}>
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={"#F9F9F9"} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: "#F9F9F9" }]}>Comentarios</Text>
          <View style={{ width: 22 }} />
        </View>

        {!post ? (
          <View style={styles.notFound}>
            <Feather name="alert-circle" size={28} color={"#F4F4F4"} />
            <Text style={[styles.notFoundText, { color: "#F4F4F4" }]}>
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
            <View style={[styles.parentPost, { backgroundColor: "rgba(255,255,255,0.075)", borderColor: "rgba(255,255,255,0.1)" }]}>
              <View style={styles.postHeader}>
                <View style={[styles.avatar, { backgroundColor: post.color + "30" }]}>
                  <Text style={[styles.avatarText, { color: post.color }]}>{post.initials}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.postAuthor, { color: "#F9F9F9" }]}>{post.author}</Text>
                  <Text style={[styles.postTime, { color: "#F4F4F4" }]}>
                    {formatRelativeTime(post.createdAt)}
                  </Text>
                </View>
                <Pressable hitSlop={10} onPress={openPostMenu} style={{ padding: 4 }}>
                  <Feather name="more-horizontal" size={18} color={"#F4F4F4"} />
                </Pressable>
              </View>
              <Text style={[styles.postText, { color: "#F9F9F9" }]}>{post.text}</Text>
              <View style={[styles.postMeta, { borderTopColor: "rgba(255,255,255,0.1)" }]}>
                <Pressable onPress={handleTogglePostLike} hitSlop={6} style={styles.metaItem}>
                  <Feather
                    name="heart"
                    size={14}
                    color={postLiked ? "#D4709A" : "#F4F4F4"}
                  />
                  <Text
                    style={[
                      styles.metaText,
                      { color: postLiked ? "#D4709A" : "#F4F4F4" },
                    ]}
                  >
                    {post.likes + (postLiked ? 1 : 0)}
                  </Text>
                </Pressable>
                <View style={styles.metaItem}>
                  <Feather name="message-square" size={14} color={"#F4F4F4"} />
                  <Text style={[styles.metaText, { color: "#F4F4F4" }]}>{comments.length}</Text>
                </View>
                <Pressable onPress={handleSharePost} hitSlop={6} style={styles.metaItem}>
                  <Feather name="share" size={14} color={"#F4F4F4"} />
                  <Text style={[styles.metaText, { color: "#F4F4F4" }]}>Compartir</Text>
                </Pressable>
              </View>
            </View>

            {/* Comments section header */}
            <View style={styles.sectionHeaderRow}>
              <Text style={[styles.sectionHeader, { color: "#F9F9F9" }]}>
                {comments.length === 0
                  ? "Aún no hay respuestas"
                  : `${comments.length} ${comments.length === 1 ? "respuesta" : "respuestas"}`}
              </Text>
            </View>

            {/* Comments list */}
            {comments.length === 0 ? (
              <View style={styles.emptyState}>
                <Feather name="message-circle" size={26} color={"#F4F4F4"} />
                <Text style={[styles.emptyText, { color: "#F4F4F4" }]}>
                  Sé la primera persona en responder.
                </Text>
              </View>
            ) : (
              <View style={{ paddingHorizontal: 16 }}>
                {comments.map((c) => {
                  const liked = likedComments.has(c.id);
                  return (
                    <View key={c.id} style={[styles.commentCard, { borderBottomColor: "rgba(255,255,255,0.1)" }]}>
                      <View style={[styles.commentAvatar, { backgroundColor: c.color + "30" }]}>
                        <Text style={[styles.commentInitials, { color: c.color }]}>{c.initials}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <View style={styles.commentHeader}>
                          <Text style={[styles.commentAuthor, { color: "#F9F9F9" }]} numberOfLines={1}>
                            {c.author}
                          </Text>
                          <Text style={[styles.commentTime, { color: "#F4F4F4" }]}>
                            {formatRelativeTime(c.createdAt)}
                          </Text>
                          <View style={{ flex: 1 }} />
                          <Pressable
                            hitSlop={8}
                            onPress={() => openCommentMenu(c.id, c.author, c.text)}
                          >
                            <Feather name="more-horizontal" size={16} color={"#F4F4F4"} />
                          </Pressable>
                        </View>
                        <Text style={[styles.commentText, { color: "#F9F9F9" }]}>{c.text}</Text>
                        <Pressable
                          onPress={() => toggleCommentLike(c.id)}
                          hitSlop={8}
                          style={styles.commentLikeBtn}
                        >
                          <Feather
                            name="heart"
                            size={13}
                            color={liked ? "#D4709A" : "#F4F4F4"}
                          />
                          <Text
                            style={[
                              styles.commentLikeText,
                              { color: liked ? "#D4709A" : "#F4F4F4" },
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
                backgroundColor: sceneTheme.gradient[0],
                borderTopColor: "rgba(255,255,255,0.1)",
              },
            ]}
          >
            <View style={[styles.composeInput, { backgroundColor: "rgba(255,255,255,0.075)", borderColor: "rgba(255,255,255,0.1)" }]}>
              <TextInput
                value={commentText}
                onChangeText={setCommentText}
                placeholder="Escribir una respuesta..."
                placeholderTextColor={"#F4F4F4"}
                style={[styles.composeText, { color: "#F9F9F9" }]}
                multiline
              />
            </View>
            <Pressable
              onPress={handleSend}
              disabled={!commentText.trim()}
              style={[
                styles.sendBtn,
                {
                  backgroundColor: commentText.trim() ? undefined : "rgba(255,255,255,0.075)",
                  overflow: "hidden",
                  borderColor: "rgba(255,255,255,0.1)",
                },
              ]}
            >
              {commentText.trim() && <GoldGradientFill />}
              <Feather
                name="send"
                size={18}
                color={commentText.trim() ? "#080F0A" : "#F4F4F4"}
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
  headerTitle: { fontFamily: "Manrope", fontSize: 16, fontWeight: "700" },
  notFound: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  notFoundText: { fontFamily: "Manrope", fontSize: 14 },
  parentPost: { margin: 16, borderRadius: 14, borderWidth: 1, padding: 16 },
  postHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  avatarText: { fontFamily: "Manrope", fontSize: 13, fontWeight: "700" },
  postAuthor: { fontFamily: "Manrope", fontSize: 14, fontWeight: "700" },
  postTime: { fontFamily: "Manrope", fontSize: 12, marginTop: 2 },
  postText: { fontFamily: "Manrope", fontSize: 15, lineHeight: 22, marginBottom: 12 },
  postMeta: { flexDirection: "row", gap: 18, paddingTop: 10, borderTopWidth: 1 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { fontFamily: "Manrope", fontSize: 12 },
  sectionHeaderRow: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 10 },
  sectionHeader: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600", letterSpacing: 0.3 },
  emptyState: { alignItems: "center", paddingVertical: 40, gap: 10 },
  emptyText: { fontFamily: "Manrope", fontSize: 13 },
  commentCard: { flexDirection: "row", gap: 10, paddingVertical: 14, borderBottomWidth: 1 },
  commentAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  commentInitials: { fontFamily: "Manrope", fontSize: 12, fontWeight: "700" },
  commentHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 3 },
  commentAuthor: { fontFamily: "Manrope", fontSize: 13, fontWeight: "700" },
  commentTime: { fontFamily: "Manrope", fontSize: 11 },
  commentText: { fontFamily: "Manrope", fontSize: 14, lineHeight: 20 },
  commentLikeBtn: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6, alignSelf: "flex-start" },
  commentLikeText: { fontFamily: "Manrope", fontSize: 12, fontWeight: "600" },
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
  composeText: { fontFamily: "Manrope", fontSize: 14 },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
});
