import { Feather } from "@expo/vector-icons";
import { useAuth as useClerkAuth } from "@clerk/expo";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetConversationsQueryKey,
  getGetDirectMessagesQueryKey,
  getGetFriendsQueryKey,
  getGetUnreadNotificationCountQueryKey,
  requestUploadUrl,
  useGetDirectMessages,
  useGetFriends,
  useGetTypingStatus,
  useMarkConversationRead,
  usePingTyping,
  useSendDirectMessage,
  type DirectMessage,
  type UserProfile,
} from "@workspace/api-client-react";
import { Audio } from "expo-av";
import * as FileSystem from "expo-file-system/legacy";
import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
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

// Resolve an object path returned by the upload endpoint (e.g. `/objects/uploads/uuid`)
// into a full URL we can fetch from the mobile client.
function resolveAttachmentUrl(objectPath: string): string {
  if (/^https?:\/\//i.test(objectPath)) return objectPath;
  const base = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
  if (!objectPath.startsWith("/")) objectPath = `/${objectPath}`;
  if (base.endsWith("/api")) return `${base}/storage${objectPath}`;
  return `${base}/api/storage${objectPath}`;
}

const GIPHY_API_KEY = process.env.EXPO_PUBLIC_GIPHY_API_KEY ?? "";
type GiphyGif = {
  id: string;
  title: string;
  images: {
    fixed_width: { url: string; width: string; height: string };
    original: { url: string; width: string; height: string };
  };
};

// Upload a local file (uri) to GCS via presigned URL and return the objectPath
// (e.g. `/objects/uploads/uuid`) that the server stores in the DB.
async function uploadLocalFile(
  uri: string,
  contentType: string,
  fileName: string,
  hintSize: number,
): Promise<string> {
  console.log("[upload] preparing", { fileName, contentType, hintSize, platform: Platform.OS });
  let realSize = hintSize || 1;
  if (Platform.OS !== "web") {
    try {
      const info = await FileSystem.getInfoAsync(uri, { size: true });
      if (info.exists && typeof info.size === "number") realSize = info.size;
    } catch {
      // ignore, fall back to hintSize
    }
  }
  console.log("[upload] requesting URL", { size: realSize });
  const { uploadURL, objectPath } = await requestUploadUrl({
    name: fileName,
    size: realSize,
    contentType,
  });
  console.log("[upload] got URL");

  if (Platform.OS === "web") {
    const fileResp = await fetch(uri);
    const blob = await fileResp.blob();
    const putResp = await fetch(uploadURL, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: blob,
    });
    console.log("[upload] PUT done (web)", { status: putResp.status, size: blob.size });
    if (!putResp.ok) {
      const text = await putResp.text().catch(() => "");
      throw new Error(`Upload falló (${putResp.status}): ${text.slice(0, 120)}`);
    }
    return objectPath;
  }

  // Native: use FileSystem.uploadAsync to send raw bytes
  const result = await FileSystem.uploadAsync(uploadURL, uri, {
    httpMethod: "PUT",
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: { "Content-Type": contentType },
  });
  console.log("[upload] PUT done (native)", { status: result.status });
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Upload falló (${result.status}): ${result.body?.slice(0, 120) ?? ""}`);
  }
  return objectPath;
}

function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
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

  // Haptic feedback when a new incoming message arrives
  const lastIncomingIdRef = useRef<number | null>(null);
  useEffect(() => {
    const list = messagesQ.data ?? [];
    const newestIncoming = list.find((m) => m.recipientId !== otherId);
    if (!newestIncoming) return;
    if (lastIncomingIdRef.current === null) {
      lastIncomingIdRef.current = newestIncoming.id;
      return;
    }
    if (newestIncoming.id !== lastIncomingIdRef.current) {
      lastIncomingIdRef.current = newestIncoming.id;
      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      }
    }
  }, [messagesQ.data, otherId]);

  // Auto-scroll to bottom when a new message (mine or theirs) appears
  const listRef = useRef<FlatList<DirectMessage>>(null);
  const lastMsgIdRef = useRef<number | null>(null);
  useEffect(() => {
    const list = messagesQ.data ?? [];
    if (list.length === 0) return;
    const newestId = list[0].id;
    if (lastMsgIdRef.current !== newestId) {
      lastMsgIdRef.current = newestId;
      requestAnimationFrame(() => {
        listRef.current?.scrollToOffset({ offset: 0, animated: true });
      });
    }
  }, [messagesQ.data]);

  const [draft, setDraft] = useState("");
  const [showShareModal, setShowShareModal] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [recElapsedMs, setRecElapsedMs] = useState(0);
  const recStartRef = useRef<number>(0);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
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

  const pickImage = async () => {
    try {
      if (Platform.OS !== "web") {
        const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!perm.granted) {
          setShowAttachMenu(false);
          Alert.alert("Permiso", "Necesitamos acceso a tus fotos para enviarlas.");
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        quality: 0.85,
        allowsEditing: false,
        exif: false,
      });
      setShowAttachMenu(false);
      if (result.canceled || result.assets.length === 0) return;
      const asset = result.assets[0];
      console.log("[chat] pickImage selected", {
        uri: asset.uri.slice(0, 60),
        mimeType: asset.mimeType,
        fileSize: asset.fileSize,
        width: asset.width,
        height: asset.height,
      });
      const isGif =
        (asset.mimeType ?? "").toLowerCase() === "image/gif" ||
        (asset.fileName ?? asset.uri).toLowerCase().endsWith(".gif");
      const contentType = isGif ? "image/gif" : (asset.mimeType ?? "image/jpeg");
      const ext = isGif ? "gif" : contentType.split("/")[1] ?? "jpg";
      const fileName = asset.fileName ?? `photo-${Date.now()}.${ext}`;
      const size = asset.fileSize ?? 0;
      setUploading(true);
      const objectPath = await uploadLocalFile(asset.uri, contentType, fileName, size || 1);
      sendMsg.mutate({
        userId: otherId,
        data: {
          attachmentUrl: objectPath,
          attachmentType: "image",
          attachmentMeta: {
            mime: contentType,
            width: asset.width,
            height: asset.height,
            sizeBytes: size || undefined,
          },
        },
      });
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "No se pudo enviar la foto.");
    } finally {
      setUploading(false);
    }
  };

  const startRecording = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        setShowAttachMenu(false);
        Alert.alert("Permiso", "Necesitamos acceso al micrófono para grabar.");
        return;
      }
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const rec = new Audio.Recording();
      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await rec.startAsync();
      setShowAttachMenu(false);
      recStartRef.current = Date.now();
      setRecElapsedMs(0);
      setRecording(rec);
      recTimerRef.current = setInterval(() => {
        setRecElapsedMs(Date.now() - recStartRef.current);
      }, 200);
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "No se pudo iniciar la grabación.");
    }
  };

  const cancelRecording = async () => {
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    recTimerRef.current = null;
    setRecElapsedMs(0);
    if (!recording) return;
    try {
      await recording.stopAndUnloadAsync();
    } catch {
      // ignore
    }
    setRecording(null);
  };

  const sendRecording = async () => {
    if (!recording) return;
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    recTimerRef.current = null;
    const durationMs = Date.now() - recStartRef.current;
    const rec = recording;
    setRecording(null);
    setRecElapsedMs(0);
    try {
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      if (!uri) throw new Error("No se pudo obtener el audio.");
      if (durationMs < 600) {
        Alert.alert("Muy corto", "Grabá al menos 1 segundo.");
        return;
      }
      const contentType = Platform.OS === "ios" ? "audio/m4a" : "audio/mp4";
      const ext = "m4a";
      setUploading(true);
      const objectPath = await uploadLocalFile(uri, contentType, `voice-${Date.now()}.${ext}`, 1);
      sendMsg.mutate({
        userId: otherId,
        data: {
          attachmentUrl: objectPath,
          attachmentType: "audio",
          attachmentMeta: { mime: contentType, durationMs },
        },
      });
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "No se pudo enviar el audio.");
    } finally {
      setUploading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (recTimerRef.current) clearInterval(recTimerRef.current);
      if (recording) {
        recording.stopAndUnloadAsync().catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
            ref={listRef}
            data={messages}
            inverted
            keyExtractor={(m) => String(m.id)}
            contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 16 }}
            ListHeaderComponent={
              typingQ.data?.typing ? (
                <TypingBubble name={friend?.displayName ?? "…"} tint={friendTint} />
              ) : null
            }
            renderItem={({ item, index }) => {
              const prev = messages[index + 1]; // older
              const next = messages[index - 1]; // newer (visually below since inverted)
              const isMine = item.recipientId === otherId;
              const prevSameSender = !!prev && prev.recipientId === item.recipientId;
              const nextSameSender = !!next && next.recipientId === item.recipientId;
              const gapToPrev = prev
                ? new Date(item.createdAt).getTime() - new Date(prev.createdAt).getTime()
                : Infinity;
              const gapToNext = next
                ? new Date(next.createdAt).getTime() - new Date(item.createdAt).getTime()
                : Infinity;
              const groupedWithPrev = prevSameSender && gapToPrev < 60_000;
              const groupedWithNext = nextSameSender && gapToNext < 60_000;
              const showTime = !prev || gapToPrev > 5 * 60_000;
              return (
                <MessageBubble
                  message={item}
                  isMine={isMine}
                  showTime={showTime}
                  groupedWithPrev={groupedWithPrev}
                  groupedWithNext={groupedWithNext}
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
          {recording ? (
            <>
              <Pressable
                onPress={cancelRecording}
                hitSlop={10}
                style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <Feather name="x" size={16} color="#E07A7A" />
              </Pressable>
              <View
                style={[
                  styles.recBar,
                  { backgroundColor: colors.card, borderColor: colors.border },
                ]}
              >
                <View style={styles.recDot} />
                <Text style={[styles.recTime, { color: colors.foreground }]}>
                  Grabando · {formatDuration(recElapsedMs)}
                </Text>
              </View>
              <Pressable onPress={sendRecording} style={styles.sendBtn}>
                <LinearGradient colors={["#D6A85B", "#C69B4F"]} style={styles.sendGrad}>
                  <Feather name="send" size={16} color="#1A0E06" />
                </LinearGradient>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                onPress={() => setShowAttachMenu(true)}
                hitSlop={10}
                disabled={uploading}
                style={[
                  styles.iconBtn,
                  {
                    backgroundColor: colors.card,
                    borderColor: colors.border,
                    opacity: uploading ? 0.5 : 1,
                  },
                ]}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color={colors.accent} />
                ) : (
                  <Feather name="plus" size={18} color={colors.accent} />
                )}
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
            </>
          )}
        </View>
      </KeyboardAvoidingView>

      <ShareSessionModal
        visible={showShareModal}
        onClose={() => setShowShareModal(false)}
        onPick={shareSession}
      />

      <AttachMenuModal
        visible={showAttachMenu}
        onClose={() => setShowAttachMenu(false)}
        onPickImage={pickImage}
        onPickGif={() => {
          setShowAttachMenu(false);
          setShowGifPicker(true);
        }}
        onRecordVoice={startRecording}
        onShareSession={() => {
          setShowAttachMenu(false);
          setShowShareModal(true);
        }}
      />

      <GifPickerModal
        visible={showGifPicker}
        onClose={() => setShowGifPicker(false)}
        onPick={(gif) => {
          setShowGifPicker(false);
          const w = parseInt(gif.images.original.width, 10) || undefined;
          const h = parseInt(gif.images.original.height, 10) || undefined;
          sendMsg.mutate({
            userId: otherId,
            data: {
              attachmentUrl: gif.images.original.url,
              attachmentType: "image",
              attachmentMeta: { mime: "image/gif", width: w, height: h },
            },
          });
        }}
      />
    </View>
  );
}

function MessageBubble({
  message,
  isMine,
  showTime,
  groupedWithPrev,
  groupedWithNext,
  isLastMine,
}: {
  message: DirectMessage;
  isMine: boolean;
  showTime: boolean;
  groupedWithPrev: boolean;
  groupedWithNext: boolean;
  isLastMine: boolean;
}) {
  const colors = useColors();
  const session = message.sessionId != null
    ? SESSIONS.find((s) => Number(s.id) === message.sessionId)
    : undefined;
  const marginBottom = groupedWithNext ? 2 : 8;
  const tailRadius = 4;
  const compactRadius = 14;
  const isImage = message.attachmentType === "image" && !!message.attachmentUrl;
  const isAudio = message.attachmentType === "audio" && !!message.attachmentUrl;

  return (
    <View style={{ alignItems: isMine ? "flex-end" : "flex-start", marginBottom }}>
      {showTime && (
        <Text style={[styles.timeLabel, { color: colors.mutedForeground }]}>
          {timeFor(message.createdAt)}
        </Text>
      )}
      {isImage ? (
        <ImageAttachment
          objectPath={message.attachmentUrl!}
          width={message.attachmentMeta?.width}
          height={message.attachmentMeta?.height}
        />
      ) : isAudio ? (
        <AudioAttachment
          objectPath={message.attachmentUrl!}
          durationMs={message.attachmentMeta?.durationMs ?? 0}
          isMine={isMine}
        />
      ) : session ? (
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
              ? {
                  backgroundColor: "#C69B4F",
                  borderTopRightRadius: groupedWithPrev ? compactRadius : 18,
                  borderBottomRightRadius: groupedWithNext ? compactRadius : tailRadius,
                }
              : {
                  backgroundColor: colors.card,
                  borderColor: colors.border,
                  borderWidth: 1,
                  borderTopLeftRadius: groupedWithPrev ? compactRadius : 18,
                  borderBottomLeftRadius: groupedWithNext ? compactRadius : tailRadius,
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

function TypingBubble({ name, tint }: { name: string; tint: string }) {
  const colors = useColors();
  const dotAnim = useRef(0);
  const [step, setStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => {
      dotAnim.current = (dotAnim.current + 1) % 3;
      setStep(dotAnim.current);
    }, 350);
    return () => clearInterval(id);
  }, []);
  const dots = ".".repeat(step + 1);
  return (
    <View style={{ alignItems: "flex-start", marginBottom: 8 }}>
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: colors.card,
            borderColor: colors.border,
            borderWidth: 1,
            borderBottomLeftRadius: 4,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          },
        ]}
      >
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tint }} />
        <Text style={[styles.bubbleText, { color: colors.mutedForeground, minWidth: 110 }]}>
          {name} está escribiendo{dots}
        </Text>
      </View>
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

function ImageAttachment({
  objectPath,
  width,
  height,
}: {
  objectPath: string;
  width?: number;
  height?: number;
}) {
  const url = useMemo(() => resolveAttachmentUrl(objectPath), [objectPath]);
  const maxW = 220;
  const maxH = 280;
  let w = maxW;
  let h = maxH;
  if (width && height && width > 0 && height > 0) {
    const ratio = width / height;
    if (ratio >= 1) {
      w = maxW;
      h = Math.round(maxW / ratio);
      if (h > maxH) {
        h = maxH;
        w = Math.round(maxH * ratio);
      }
    } else {
      h = maxH;
      w = Math.round(maxH * ratio);
      if (w > maxW) {
        w = maxW;
        h = Math.round(maxW / ratio);
      }
    }
  }
  return (
    <View style={{ borderRadius: 14, overflow: "hidden" }}>
      <Image
        source={{ uri: url }}
        style={{ width: w, height: h }}
        contentFit="cover"
      />
    </View>
  );
}

function AudioAttachment({
  objectPath,
  durationMs,
  isMine,
}: {
  objectPath: string;
  durationMs: number;
  isMine: boolean;
}) {
  const colors = useColors();
  const url = useMemo(() => resolveAttachmentUrl(objectPath), [objectPath]);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [loading, setLoading] = useState(false);
  const totalMs = durationMs > 0 ? durationMs : 0;

  useEffect(() => {
    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, []);

  const webAudioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (Platform.OS !== "web") return;
    const AudioCtor = (globalThis as unknown as { Audio: new (src?: string) => HTMLAudioElement }).Audio;
    const audio = new AudioCtor();
    audio.src = url;
    audio.preload = "auto";
    const onPlay = () => { setIsPlaying(true); setLoading(false); };
    const onPause = () => setIsPlaying(false);
    const onTime = () => setPositionMs(Math.round(audio.currentTime * 1000));
    const onEnded = () => {
      setIsPlaying(false);
      setPositionMs(0);
      audio.currentTime = 0;
    };
    const onError = () => {
      console.log("[audio] error", audio.error?.code, audio.error?.message, "src:", audio.src);
      setLoading(false);
      setIsPlaying(false);
      Alert.alert(
        "Audio no compatible",
        "Este formato de audio no se puede reproducir en el navegador. Probá desde la app móvil.",
      );
    };
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("timeupdate", onTime);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);
    webAudioRef.current = audio;
    return () => {
      audio.pause();
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("timeupdate", onTime);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
      webAudioRef.current = null;
    };
  }, [url]);

  const toggle = async () => {
    try {
      if (Platform.OS === "web") {
        const a = webAudioRef.current;
        if (!a) return;
        if (a.paused) {
          setLoading(true);
          try {
            await a.play();
          } finally {
            setLoading(false);
          }
        } else {
          a.pause();
        }
        return;
      }
      if (!soundRef.current) {
        setLoading(true);
        const { sound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: true },
          (status) => {
            if (!status.isLoaded) return;
            setPositionMs(status.positionMillis ?? 0);
            setIsPlaying(status.isPlaying);
            if (status.didJustFinish) {
              setIsPlaying(false);
              setPositionMs(0);
              soundRef.current?.setPositionAsync(0).catch(() => {});
            }
          },
        );
        soundRef.current = sound;
        setLoading(false);
        setIsPlaying(true);
        return;
      }
      const status = await soundRef.current.getStatusAsync();
      if (status.isLoaded && status.isPlaying) {
        await soundRef.current.pauseAsync();
        setIsPlaying(false);
      } else {
        await soundRef.current.playAsync();
        setIsPlaying(true);
      }
    } catch (err) {
      console.log("[audio] toggle error", err);
      setLoading(false);
      Alert.alert("Error", "No se pudo reproducir el audio.");
    }
  };

  const progressPct = totalMs > 0 ? Math.min(1, positionMs / totalMs) : 0;
  const bg = isMine ? "#C69B4F" : colors.card;
  const fg = isMine ? "#1A0E06" : colors.foreground;
  const trackBg = isMine ? "#1A0E0633" : colors.border;
  const trackFill = isMine ? "#1A0E06" : colors.primary;

  return (
    <View
      style={[
        styles.audioBubble,
        {
          backgroundColor: bg,
          borderColor: isMine ? "transparent" : colors.border,
          borderWidth: isMine ? 0 : 1,
        },
      ]}
    >
      <Pressable onPress={toggle} hitSlop={6} style={styles.audioPlayBtn}>
        {loading ? (
          <ActivityIndicator size="small" color={fg} />
        ) : (
          <Feather name={isPlaying ? "pause" : "play"} size={18} color={fg} />
        )}
      </Pressable>
      <View style={{ flex: 1 }}>
        <View style={[styles.audioTrack, { backgroundColor: trackBg }]}>
          <View
            style={{
              width: `${progressPct * 100}%`,
              height: "100%",
              backgroundColor: trackFill,
              borderRadius: 2,
            }}
          />
        </View>
        <Text style={[styles.audioTime, { color: fg }]}>
          {formatDuration(totalMs > 0 ? totalMs - positionMs : positionMs)}
        </Text>
      </View>
    </View>
  );
}

function AttachMenuModal({
  visible,
  onClose,
  onPickImage,
  onPickGif,
  onRecordVoice,
  onShareSession,
}: {
  visible: boolean;
  onClose: () => void;
  onPickImage: () => void;
  onPickGif: () => void;
  onRecordVoice: () => void;
  onShareSession: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.attachBackdrop} onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[
            styles.attachSheet,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <View style={styles.attachHandle} />
          <Text style={[styles.attachTitle, { color: colors.foreground }]}>Adjuntar</Text>
          <AttachOption
            icon="image"
            label="Foto"
            sublabel="De tu galería"
            tint={colors.primary}
            onPress={onPickImage}
          />
          <AttachOption
            icon="film"
            label="Buscar GIF"
            sublabel="Animaciones desde Giphy"
            tint="#B57AD4"
            onPress={onPickGif}
          />
          <AttachOption
            icon="mic"
            label="Grabar mensaje de voz"
            sublabel="Mantenés grabando hasta 5 min"
            tint="#D6A85B"
            onPress={onRecordVoice}
          />
          <AttachOption
            icon="play-circle"
            label="Compartir una sesión"
            sublabel="Buscá entre todas las sesiones"
            tint="#8AAAD4"
            onPress={onShareSession}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function AttachOption({
  icon,
  label,
  sublabel,
  tint,
  onPress,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  sublabel: string;
  tint: string;
  onPress: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.attachOption,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={[styles.attachIcon, { backgroundColor: tint + "22" }]}>
        <Feather name={icon} size={20} color={tint} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.attachLabel, { color: colors.foreground }]}>{label}</Text>
        <Text style={[styles.attachSub, { color: colors.mutedForeground }]}>{sublabel}</Text>
      </View>
      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
    </Pressable>
  );
}

function GifPickerModal({
  visible,
  onClose,
  onPick,
}: {
  visible: boolean;
  onClose: () => void;
  onPick: (gif: GiphyGif) => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");
  const [gifs, setGifs] = useState<GiphyGif[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqIdRef = useRef(0);

  useEffect(() => {
    if (!visible) return;
    const myReq = ++reqIdRef.current;
    if (!GIPHY_API_KEY) {
      setError("Falta configurar la API key de Giphy.");
      setGifs([]);
      return;
    }
    setError(null);
    setLoading(true);
    const isSearch = query.trim().length > 0;
    const url = isSearch
      ? `https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&limit=24&rating=pg-13&lang=es&q=${encodeURIComponent(query.trim())}`
      : `https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=24&rating=pg-13`;
    const t = setTimeout(() => {
      fetch(url)
        .then((r) => r.json())
        .then((j: { data?: GiphyGif[] }) => {
          if (reqIdRef.current !== myReq) return;
          setGifs(j.data ?? []);
        })
        .catch(() => {
          if (reqIdRef.current !== myReq) return;
          setError("No se pudo cargar los GIFs.");
        })
        .finally(() => {
          if (reqIdRef.current !== myReq) return;
          setLoading(false);
        });
    }, isSearch ? 300 : 0);
    return () => clearTimeout(t);
  }, [visible, query]);

  useEffect(() => {
    if (!visible) {
      setQuery("");
      setGifs([]);
      setError(null);
    }
  }, [visible]);

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View
        style={[
          styles.pickerRoot,
          { backgroundColor: colors.background, paddingTop: insets.top },
        ]}
      >
        <View style={styles.pickerHeader}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Feather name="x" size={22} color={colors.foreground} />
          </Pressable>
          <Text style={[styles.pickerHeaderTitle, { color: colors.foreground }]}>
            Buscar GIF
          </Text>
          <View style={{ width: 22 }} />
        </View>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <Feather name="search" size={16} color={colors.mutedForeground} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar en Giphy…"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.searchInput, { color: colors.foreground }]}
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
          />
        </View>
        {error ? (
          <Text style={{ color: "#E07A7A", textAlign: "center", marginTop: 24 }}>{error}</Text>
        ) : null}
        {loading && gifs.length === 0 ? (
          <ActivityIndicator color={colors.accent} style={{ marginTop: 24 }} />
        ) : null}
        <FlatList
          data={gifs}
          keyExtractor={(g) => g.id}
          numColumns={2}
          contentContainerStyle={{
            paddingHorizontal: 8,
            paddingBottom: insets.bottom + 16,
            paddingTop: 8,
          }}
          columnWrapperStyle={{ gap: 8 }}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => {
            const w = parseInt(item.images.fixed_width.width, 10) || 200;
            const h = parseInt(item.images.fixed_width.height, 10) || 200;
            const ratio = h / w;
            return (
              <Pressable
                onPress={() => onPick(item)}
                style={({ pressed }) => ({
                  flex: 1,
                  borderRadius: 12,
                  overflow: "hidden",
                  backgroundColor: colors.card,
                  opacity: pressed ? 0.7 : 1,
                  aspectRatio: 1 / ratio,
                })}
              >
                <Image
                  source={{ uri: item.images.fixed_width.url }}
                  style={{ width: "100%", height: "100%" }}
                  contentFit="cover"
                />
              </Pressable>
            );
          }}
          ListFooterComponent={
            <Text
              style={{
                color: colors.mutedForeground,
                fontSize: 11,
                textAlign: "center",
                marginTop: 16,
              }}
            >
              Powered by GIPHY
            </Text>
          }
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  recBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 14,
    height: 40,
  },
  recDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: "#E07A7A" },
  recTime: { fontSize: 13, fontWeight: "600" },
  audioBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    minWidth: 180,
    maxWidth: 240,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 2,
  },
  audioPlayBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  audioTrack: { width: "100%", height: 4, borderRadius: 2, overflow: "hidden" },
  audioTime: { fontSize: 11, marginTop: 4 },
  attachBackdrop: { flex: 1, backgroundColor: "#0008", justifyContent: "flex-end" },
  attachSheet: {
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    borderTopWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
    gap: 10,
  },
  attachHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#FFFFFF33",
    alignSelf: "center",
    marginBottom: 8,
  },
  attachTitle: { fontSize: 18, fontWeight: "700", marginBottom: 6 },
  attachOption: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  attachIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  attachLabel: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  attachSub: { fontSize: 12 },
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
  pickerRoot: { flex: 1 },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerHeaderTitle: { fontSize: 16, fontWeight: "700" },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginBottom: 8,
  },
});
