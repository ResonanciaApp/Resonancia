import { Feather } from "@expo/vector-icons";
import { useAuth as useClerkAuth } from "@clerk/expo";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetConversationsQueryKey,
  getGetDirectMessagesQueryKey,
  getGetFriendsQueryKey,
  getGetUnreadNotificationCountQueryKey,
  useGetDirectMessages,
  useGetFriends,
  useGetTypingStatus,
  useMarkConversationRead,
  usePingTyping,
  useSendDirectMessage,
  type DirectMessage,
  type UserProfile,
} from "@workspace/api-client-react";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { SESSIONS } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

const AVATAR_PALETTE = ["#D4709A", "#8AAAD4", "#E8C87A", "#A8C4A8", "#C8B4E0", "#EDD9B8"];
function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase() || "·";
}
function colorFor(id: number) {
  return AVATAR_PALETTE[Math.abs(id) % AVATAR_PALETTE.length];
}
function timeFor(iso: string): string {
  const d = new Date(iso);
  const hh = d.getHours().toString().padStart(2, "0");
  const mm = d.getMinutes().toString().padStart(2, "0");
  return `${hh}:${mm}`;
}

export default function ChatScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 18 : insets.bottom;
  const params = useLocalSearchParams<{ userId: string }>();
  const otherId = Number(params.userId);
  const qc = useQueryClient();
  const { isSignedIn, isLoaded } = useClerkAuth();

  const friendsQ = useGetFriends({
    query: { queryKey: getGetFriendsQueryKey(), enabled: !!isSignedIn },
  });
  const friend: UserProfile | undefined = useMemo(
    () => (friendsQ.data ?? []).find((f) => f.id === otherId),
    [friendsQ.data, otherId],
  );

  const messagesQ = useGetDirectMessages(
    otherId,
    {},
    {
      query: {
        queryKey: getGetDirectMessagesQueryKey(otherId, {}),
        enabled: !!isSignedIn && Number.isFinite(otherId),
        refetchInterval: 4000,
      },
    },
  );

  const typingQ = useGetTypingStatus(otherId, {
    query: {
      queryKey: ["typing", otherId] as const,
      enabled: !!isSignedIn && Number.isFinite(otherId),
      refetchInterval: 2500,
    },
  });

  const sendMsg = useSendDirectMessage({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetDirectMessagesQueryKey(otherId, {}) });
        qc.invalidateQueries({ queryKey: getGetConversationsQueryKey() });
      },
    },
  });
  const markRead = useMarkConversationRead();
  const pingTyping = usePingTyping();

  // Mark as read whenever new incoming messages arrive
  const lastReadKeyRef = useRef<string>("");
  useEffect(() => {
    const incoming = (messagesQ.data ?? []).filter(
      (m) => m.recipientId !== otherId && !m.readAt,
    );
    if (incoming.length === 0) return;
    const key = incoming.map((m) => m.id).join(",");
    if (key === lastReadKeyRef.current) return;
    lastReadKeyRef.current = key;
    markRead.mutate(
      { userId: otherId },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetConversationsQueryKey() });
          qc.invalidateQueries({ queryKey: getGetUnreadNotificationCountQueryKey() });
        },
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messagesQ.data, otherId]);

  const [draft, setDraft] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const lastTypingPingRef = useRef(0);

  const onChangeDraft = (text: string) => {
    setDraft(text);
    const now = Date.now();
    if (text.length > 0 && now - lastTypingPingRef.current > 2500) {
      lastTypingPingRef.current = now;
      pingTyping.mutate({ userId: otherId });
    }
  };

  const send = () => {
    const body = draft.trim();
    if (!body) return;
    setDraft("");
    sendMsg.mutate({ userId: otherId, data: { body } });
  };

  const shareSession = (sessionId: number) => {
    setShowShareModal(false);
    sendMsg.mutate({ userId: otherId, data: { sessionId } });
  };

  const messages = useMemo(() => {
    const list = messagesQ.data ?? [];
    // server returns newest first; FlatList inverted expects newest first
    return list;
  }, [messagesQ.data]);

  if (!isLoaded) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} />
      </View>
    );
  }

  const fetchError = messagesQ.error as { status?: number } | null | undefined;
  const isForbidden = fetchError?.status === 403 || fetchError?.status === 404;

  if (!isSignedIn || !Number.isFinite(otherId) || isForbidden) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, paddingTop: topPad }]}>
        <Pressable onPress={() => router.back()} style={{ padding: 16 }} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.empty, { color: colors.mutedForeground }]}>
          {isForbidden
            ? "Ya no podés escribirle a esta persona."
            : "No podés ver este chat."}
        </Text>
      </View>
    );
  }

  const friendName = friend?.displayName ?? "Cargando…";
  const friendTint = colorFor(otherId);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 8, borderColor: colors.border, backgroundColor: "#1A0E06EE" },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ padding: 6 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <View style={[styles.headerAvatar, { backgroundColor: friendTint + "33" }]}>
          {friend?.avatarUrl ? (
            <Image source={{ uri: friend.avatarUrl }} style={styles.headerAvatarImg} contentFit="cover" />
          ) : (
            <Text style={[styles.headerInitials, { color: friendTint }]}>
              {initialsFor(friendName)}
            </Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerName, { color: colors.foreground }]} numberOfLines={1}>
            {friendName}
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {typingQ.data?.typing ? "escribiendo…" : friend ? `@${friend.username}` : ""}
          </Text>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        style={{ flex: 1 }}
      >
        {messagesQ.isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : messages.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Text style={[styles.empty, { color: colors.mutedForeground }]}>
              Aún no hay mensajes. Saludá a {friend?.displayName ?? "tu amigo"} 🌙
            </Text>
          </View>
        ) : (
          <FlatList
            data={messages}
            inverted
            keyExtractor={(m) => String(m.id)}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 }}
            renderItem={({ item, index }) => {
              const prev = messages[index + 1]; // older
              const isMine = item.recipientId === otherId;
              const showTime =
                !prev ||
                new Date(item.createdAt).getTime() - new Date(prev.createdAt).getTime() > 5 * 60_000;
              return (
                <MessageBubble
                  message={item}
                  isMine={isMine}
                  showTime={showTime}
                  isLastMine={
                    isMine && messages.slice(0, index).every((m) => m.recipientId !== otherId)
                  }
                />
              );
            }}
          />
        )}

        {/* Input bar */}
        <View
          style={[
            styles.inputBar,
            {
              paddingBottom: bottomPad + 8,
              borderColor: colors.border,
              backgroundColor: "#1A0E06EE",
            },
          ]}
        >
          <Pressable
            onPress={() => setShowShareModal(true)}
            hitSlop={10}
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="paperclip" size={16} color={colors.accent} />
          </Pressable>
          <TextInput
            value={draft}
            onChangeText={onChangeDraft}
            placeholder="Escribí un mensaje…"
            placeholderTextColor={colors.mutedForeground}
            style={[
              styles.input,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                color: colors.foreground,
              },
            ]}
            multiline
            maxLength={2000}
            onSubmitEditing={send}
          />
          <Pressable
            onPress={send}
            disabled={draft.trim().length === 0 || sendMsg.isPending}
            style={[styles.sendBtn, { opacity: draft.trim().length === 0 ? 0.5 : 1 }]}
          >
            <LinearGradient colors={["#D6A85B", "#C69B4F"]} style={styles.sendGrad}>
              <Feather name="send" size={16} color="#1A0E06" />
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>

      <ShareSessionModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        onPick={shareSession}
      />
    </View>
  );
}

function MessageBubble({
  message,
  isMine,
  showTime,
  isLastMine,
}: {
  message: DirectMessage;
  isMine: boolean;
  showTime: boolean;
  isLastMine: boolean;
}) {
  const colors = useColors();
  const session = message.sessionId != null
    ? SESSIONS.find((s) => Number(s.id) === message.sessionId)
    : undefined;

  return (
    <View style={{ alignItems: isMine ? "flex-end" : "flex-start", marginBottom: 4 }}>
      {showTime && (
        <Text style={[styles.timeLabel, { color: colors.mutedForeground }]}>
          {timeFor(message.createdAt)}
        </Text>
      )}
      {session ? (
        <Pressable
          onPress={() => router.push(`/session/${session.id}`)}
          style={[
            styles.sessionCard,
            {
              backgroundColor: isMine ? "#C69B4F" : colors.card,
              borderColor: isMine ? "transparent" : colors.border,
            },
          ]}
        >
          <Image source={session.image as never} style={styles.sessionImg} contentFit="cover" />
          <View style={{ flex: 1, padding: 10 }}>
            <Text
              style={[
                styles.sessionLabel,
                { color: isMine ? "#1A0E06" : colors.mutedForeground },
              ]}
            >
              {session.categoryLabel.toUpperCase()}
            </Text>
            <Text
              style={[styles.sessionTitle, { color: isMine ? "#1A0E06" : colors.foreground }]}
              numberOfLines={2}
            >
              {session.title}
            </Text>
            <Text
              style={[
                styles.sessionDuration,
                { color: isMine ? "#1A0E06" : colors.mutedForeground },
              ]}
            >
              {session.durationLabel}
            </Text>
          </View>
        </Pressable>
      ) : (
        <View
          style={[
            styles.bubble,
            isMine
              ? { backgroundColor: "#C69B4F", borderBottomRightRadius: 4 }
              : {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderBottomLeftRadius: 4,
                },
          ]}
        >
          <Text
            style={[
              styles.bubbleText,
              { color: isMine ? "#1A0E06" : colors.foreground },
            ]}
          >
            {message.body}
          </Text>
        </View>
      )}
      {isMine && isLastMine && (
        <View style={styles.readReceipt}>
          <Feather
            name={message.readAt ? "check-circle" : "check"}
            size={11}
            color={message.readAt ? "#C69B4F" : colors.mutedForeground}
          />
          <Text style={[styles.readText, { color: colors.mutedForeground }]}>
            {message.readAt ? "Visto" : "Enviado"}
          </Text>
        </View>
      )}
    </View>
  );
}

function ShareSessionModal({
  visible,
  onClose,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (sessionId: number) => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const trimmed = search.trim().toLowerCase();
  const list = useMemo(() => {
    if (!trimmed) return SESSIONS.slice(0, 40);
    return SESSIONS.filter(
      (s) =>
        s.title.toLowerCase().includes(trimmed) ||
        s.categoryLabel.toLowerCase().includes(trimmed),
    ).slice(0, 60);
  }, [trimmed]);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.modalRoot, { backgroundColor: colors.background, paddingTop: insets.top + 12 }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: colors.foreground }]}>Compartir sesión</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Feather name="x" size={22} color={colors.foreground} />
          </Pressable>
        </View>
        <View
          style={[styles.searchRow, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar sesión…"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <FlatList
          data={list}
          keyExtractor={(s) => String(s.id)}
          contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 24 }}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => onPick(Number(item.id))}
              style={({ pressed }) => [
                styles.pickerRow,
                {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Image source={item.image as never} style={styles.pickerImg} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.pickerLabel, { color: colors.mutedForeground }]}>
                  {item.categoryLabel.toUpperCase()}
                </Text>
                <Text style={[styles.pickerTitle, { color: colors.foreground }]} numberOfLines={2}>
                  {item.title}
                </Text>
              </View>
              <Feather name="send" size={16} color={colors.accent} />
            </Pressable>
          )}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  headerAvatarImg: { width: 38, height: 38 },
  headerInitials: { fontSize: 13, fontWeight: "700" },
  headerName: { fontSize: 15, fontWeight: "700" },
  headerSub: { fontSize: 12, marginTop: 2 },
  empty: { fontSize: 13, textAlign: "center", paddingHorizontal: 32 },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  timeLabel: { fontSize: 10, marginTop: 12, marginBottom: 4, alignSelf: "center" },
  bubble: {
    maxWidth: "78%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginBottom: 2,
  },
  bubbleText: { fontSize: 14, lineHeight: 19 },
  readReceipt: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  readText: { fontSize: 10 },
  sessionCard: {
    flexDirection: "row",
    width: 240,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 2,
  },
  sessionImg: { width: 70, height: 70 },
  sessionLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 0.8, marginBottom: 2 },
  sessionTitle: { fontSize: 13, fontWeight: "700", marginBottom: 2 },
  sessionDuration: { fontSize: 11 },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
    paddingHorizontal: 12,
    paddingTop: 10,
    borderTopWidth: 1,
  },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom: 10,
    fontSize: 14,
    maxHeight: 120,
  },
  sendBtn: { width: 36, height: 36, borderRadius: 18, overflow: "hidden" },
  sendGrad: { flex: 1, alignItems: "center", justifyContent: "center" },
  modalRoot: { flex: 1, paddingHorizontal: 16 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  modalTitle: { fontSize: 20, fontWeight: "700" },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 14 },
  pickerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 10,
    marginBottom: 10,
  },
  pickerImg: { width: 50, height: 50, borderRadius: 10 },
  pickerLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 0.8, marginBottom: 2 },
  pickerTitle: { fontSize: 13, fontWeight: "600" },
});
