import { Feather } from "@expo/vector-icons";
import { usePollingInterval } from "@/hooks/usePollingInterval";
import { GoldGradientFill } from "@/components/GoldGradient";
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

import { SESSIONS } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { uploadLocalFile } from "@/lib/upload";

const AVATAR_PALETTE = ["#D4709A", "#8AAAD4", "#f4c993", "#A8C4A8", "#C8B4E0", "#EDD9B8"];
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

// uploadLocalFile vive en "@/lib/upload" (compartido con la sync de avatar).

type PendingAttachment = {
  tempId: string;
  kind: "image" | "audio";
  localUri: string;
  width?: number;
  height?: number;
  durationMs?: number;
  // Server objectPath set once the upload completes — used to dedupe against
  // the server message once the next refetch returns it.
  serverObjectPath?: string;
  failed?: boolean;
};

function formatDuration(ms: number): string {
  const total = Math.round(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function ChatScreen() {
  const colors = useColors();
  const { theme: sceneTheme } = useSceneTheme();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 18 : insets.bottom;
  const params = useLocalSearchParams<{ userId: string }>();
  const otherId = Number(params.userId);
  const qc = useQueryClient();
  // Sondeo solo con la pantalla en foco (pausa al salir del chat).
  const msgPoll = usePollingInterval(3000);
  const typingPoll = usePollingInterval(4000);
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
        staleTime: 0,
        refetchInterval: msgPoll,
      },
    },
  );

  const typingQ = useGetTypingStatus(otherId, {
    query: {
      queryKey: ["typing", otherId] as const,
      enabled: !!isSignedIn && Number.isFinite(otherId),
      refetchInterval: typingPoll,
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
  const [pending, setPending] = useState<PendingAttachment[]>([]);
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
        quality: 0.7,
        allowsEditing: false,
        exif: false,
      });
      setShowAttachMenu(false);
      if (result.canceled || result.assets.length === 0) return;
      const asset = result.assets[0];
      const isGif =
        (asset.mimeType ?? "").toLowerCase() === "image/gif" ||
        (asset.fileName ?? asset.uri).toLowerCase().endsWith(".gif");
      const contentType = isGif ? "image/gif" : (asset.mimeType ?? "image/jpeg");
      const ext = isGif ? "gif" : contentType.split("/")[1] ?? "jpg";
      const fileName = asset.fileName ?? `photo-${Date.now()}.${ext}`;
      const size = asset.fileSize ?? 0;

      // Optimistic: show bubble immediately with local URI; upload in background
      const tempId = `tmp-img-${Date.now()}`;
      setPending((p) => [
        ...p,
        {
          tempId,
          kind: "image",
          localUri: asset.uri,
          width: asset.width,
          height: asset.height,
        },
      ]);

      (async () => {
        try {
          const objectPath = await uploadLocalFile(asset.uri, contentType, fileName, size || 1);
          // Tag pending with serverObjectPath so the dedup effect can remove it
          // once the server message arrives via refetch.
          setPending((p) =>
            p.map((x) => (x.tempId === tempId ? { ...x, serverObjectPath: objectPath } : x)),
          );
          await sendMsg.mutateAsync({
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
          console.log("[chat] image upload failed", err);
          setPending((p) =>
            p.map((x) => (x.tempId === tempId ? { ...x, failed: true } : x)),
          );
        }
      })();
    } catch (err) {
      Alert.alert("Error", err instanceof Error ? err.message : "No se pudo enviar la foto.");
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
      // Voice-grade AAC: 22050Hz mono 48kbps — ~8x smaller than the
      // previous 44.1kHz stereo 192kbps, perfectly fine for voice messages.
      await rec.prepareToRecordAsync({
        isMeteringEnabled: false,
        android: {
          extension: ".m4a",
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 22050,
          numberOfChannels: 1,
          bitRate: 48000,
        },
        ios: {
          extension: ".m4a",
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.MEDIUM,
          sampleRate: 22050,
          numberOfChannels: 1,
          bitRate: 48000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: "audio/webm",
          bitsPerSecond: 48000,
        },
      });
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

  const sendRecording = () => {
    if (!recording) return;
    if (recTimerRef.current) clearInterval(recTimerRef.current);
    recTimerRef.current = null;
    const durationMs = Date.now() - recStartRef.current;
    const rec = recording;
    setRecording(null);
    setRecElapsedMs(0);

    if (durationMs < 600) {
      Alert.alert("Muy corto", "Grabá al menos 1 segundo.");
      rec.stopAndUnloadAsync().catch(() => {});
      return;
    }

    // Get URI immediately — it's set by prepareToRecordAsync and is the same
    // path stopAndUnloadAsync will finalize the audio to.
    const uri = rec.getURI();
    if (!uri) {
      Alert.alert("Error", "No se pudo obtener el audio.");
      rec.stopAndUnloadAsync().catch(() => {});
      return;
    }

    const contentType = "audio/mp4";
    const ext = "m4a";
    const tempId = `tmp-aud-${Date.now()}`;

    // Optimistic bubble appears instantly — no awaiting stopAndUnloadAsync.
    setPending((p) => [
      ...p,
      { tempId, kind: "audio", localUri: uri, durationMs },
    ]);

    // Everything below runs in the background.
    (async () => {
      try {
        await rec.stopAndUnloadAsync();
        Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
        }).catch(() => {});

        const objectPath = await uploadLocalFile(
          uri,
          contentType,
          `voice-${Date.now()}.${ext}`,
          1,
        );
        setPending((p) =>
          p.map((x) => (x.tempId === tempId ? { ...x, serverObjectPath: objectPath } : x)),
        );
        await sendMsg.mutateAsync({
          userId: otherId,
          data: {
            attachmentUrl: objectPath,
            attachmentType: "audio",
            attachmentMeta: { mime: contentType, durationMs },
          },
        });
      } catch (err) {
        console.log("[chat] audio send failed", err);
        setPending((p) =>
          p.map((x) => (x.tempId === tempId ? { ...x, failed: true } : x)),
        );
      }
    })();
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

  // Dedup: once the server message with our objectPath shows up in the list,
  // drop the matching pending bubble. Prevents the brief "double bubble" gap
  // between mutateAsync resolving and the refetch returning.
  useEffect(() => {
    if (pending.length === 0) return;
    const serverPaths = new Set(
      (messagesQ.data ?? [])
        .map((m) => m.attachmentUrl)
        .filter((u): u is string => !!u),
    );
    setPending((p) =>
      p.filter((x) => !x.serverObjectPath || !serverPaths.has(x.serverObjectPath)),
    );
  }, [messagesQ.data, pending.length]);

  if (!isLoaded) {
    return (
      <View style={[styles.root, { backgroundColor: sceneTheme.gradient[0] }]}>
        <ActivityIndicator color={colors.primary} style={{ marginTop: 80 }} />
      </View>
    );
  }

  const fetchError = messagesQ.error as { status?: number } | null | undefined;
  const isForbidden = fetchError?.status === 403 || fetchError?.status === 404;

  if (!isSignedIn || !Number.isFinite(otherId) || isForbidden) {
    return (
      <View style={[styles.root, { backgroundColor: sceneTheme.gradient[0], paddingTop: topPad }]}>
        <Pressable onPress={() => router.back()} style={{ padding: 16 }} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={"#F9F9F9"} />
        </Pressable>
        <Text style={[styles.empty, { color: "#F4F4F4" }]}>
          {isForbidden
            ? "Ya no puedes escribirle a esta persona."
            : "No puedes ver este chat."}
        </Text>
      </View>
    );
  }

  const friendName = friend?.displayName ?? "Cargando…";
  const friendTint = colorFor(otherId);

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <LinearGradient colors={sceneTheme.gradient} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 8, borderColor: "rgba(255,255,255,0.1)", backgroundColor: sceneTheme.gradient[0] },
        ]}
      >
        <Pressable onPress={() => router.back()} hitSlop={12} style={{ padding: 6 }}>
          <Feather name="arrow-left" size={22} color={"#F9F9F9"} />
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
          <Text style={[styles.headerName, { color: "#F9F9F9" }]} numberOfLines={1}>
            {friendName}
          </Text>
          <Text style={[styles.headerSub, { color: "#F4F4F4" }]}>
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
            <Text style={[styles.empty, { color: "#F4F4F4" }]}>
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
              <>
                {typingQ.data?.typing ? (
                  <TypingBubble name={friend?.displayName ?? "…"} tint={friendTint} />
                ) : null}
                {/* Pending uploads — render newest at bottom (inverted) */}
                {pending.map((p) => (
                  <PendingBubble key={p.tempId} item={p} />
                ))}
              </>
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
              borderColor: "rgba(255,255,255,0.1)",
              backgroundColor: sceneTheme.gradient[0],
            },
          ]}
        >
          {recording ? (
            <>
              <Pressable
                onPress={cancelRecording}
                hitSlop={10}
                style={[styles.iconBtn, { backgroundColor: "rgba(255,255,255,0.075)", borderColor: "rgba(255,255,255,0.1)" }]}
              >
                <Feather name="x" size={16} color="#E07A7A" />
              </Pressable>
              <View
                style={[
                  styles.recBar,
                  { backgroundColor: "rgba(255,255,255,0.075)", borderColor: "rgba(255,255,255,0.1)" },
                ]}
              >
                <View style={styles.recDot} />
                <Text style={[styles.recTime, { color: "#F9F9F9" }]}>
                  Grabando · {formatDuration(recElapsedMs)}
                </Text>
              </View>
              <Pressable onPress={sendRecording} style={styles.sendBtn}>
                <LinearGradient colors={["#F9F9F9", "#F9F9F9"]} style={styles.sendGrad}>
                  <Feather name="send" size={16} color="#1B060F" />
                </LinearGradient>
              </Pressable>
            </>
          ) : (
            <>
              <Pressable
                onPress={() => setShowAttachMenu(true)}
                hitSlop={10}
                style={[
                  styles.iconBtn,
                  { backgroundColor: "rgba(255,255,255,0.075)", borderColor: "rgba(255,255,255,0.1)" },
                ]}
              >
                <Feather name="plus" size={18} color={colors.accent} />
              </Pressable>
              <TextInput
                value={draft}
                onChangeText={onChangeDraft}
                placeholder="Escribí un mensaje…"
                placeholderTextColor={"#F4F4F4"}
                style={[
                  styles.input,
                  {
                    backgroundColor: "rgba(255,255,255,0.075)",
                    borderColor: "rgba(255,255,255,0.1)",
                    color: "#F9F9F9",
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
                <LinearGradient colors={["#F9F9F9", "#F9F9F9"]} style={styles.sendGrad}>
                  <Feather name="send" size={16} color="#1B060F" />
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
  const { theme: sceneTheme } = useSceneTheme();
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
        <Text style={[styles.timeLabel, { color: "#F4F4F4" }]}>
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
              backgroundColor: isMine ? undefined : "rgba(255,255,255,0.075)",
              overflow: "hidden",
              borderColor: isMine ? "transparent" : "rgba(255,255,255,0.1)",
            },
          ]}
        >
          {isMine && <GoldGradientFill />}
          <Image source={session.image as never} style={styles.sessionImg} contentFit="cover" />
          <View style={{ flex: 1, padding: 10 }}>
            <Text
              style={[
                styles.sessionLabel,
                { color: isMine ? "#080F0A" : "#F4F4F4" },
              ]}
            >
              {session.categoryLabel.toUpperCase()}
            </Text>
            <Text
              style={[styles.sessionTitle, { color: isMine ? "#080F0A" : "#F9F9F9" }]}
              numberOfLines={2}
            >
              {session.title}
            </Text>
            <Text
              style={[
                styles.sessionDuration,
                { color: isMine ? "#080F0A" : "#F4F4F4" },
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
                  backgroundColor: undefined,
                  overflow: "hidden",
                  borderTopRightRadius: groupedWithPrev ? compactRadius : 18,
                  borderBottomRightRadius: groupedWithNext ? compactRadius : tailRadius,
                }
              : {
                  backgroundColor: "rgba(255,255,255,0.075)",
                  borderColor: "rgba(255,255,255,0.1)",
                  borderWidth: 1,
                  borderTopLeftRadius: groupedWithPrev ? compactRadius : 18,
                  borderBottomLeftRadius: groupedWithNext ? compactRadius : tailRadius,
                },
          ]}
        >
          {isMine && <GoldGradientFill />}
          <Text
            style={[
              styles.bubbleText,
              { color: isMine ? "#080F0A" : "#F9F9F9" },
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
            color={message.readAt ? "#F9F9F9" : "#F4F4F4"}
          />
          <Text style={[styles.readText, { color: "#F4F4F4" }]}>
            {message.readAt ? "Visto" : "Enviado"}
          </Text>
        </View>
      )}
    </View>
  );
}

function TypingBubble({ name, tint }: { name: string; tint: string }) {
  const colors = useColors();
  const { theme: sceneTheme } = useSceneTheme();
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
            backgroundColor: "rgba(255,255,255,0.075)",
            borderColor: "rgba(255,255,255,0.1)",
            borderWidth: 1,
            borderBottomLeftRadius: 4,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          },
        ]}
      >
        <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: tint }} />
        <Text style={[styles.bubbleText, { color: "#F4F4F4", minWidth: 110 }]}>
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
  const { theme: sceneTheme } = useSceneTheme();
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
      <View style={[styles.modalRoot, { backgroundColor: sceneTheme.gradient[0], paddingTop: insets.top + 12 }]}>
        <View style={styles.modalHeader}>
          <Text style={[styles.modalTitle, { color: "#F9F9F9" }]}>Compartir sesión</Text>
          <Pressable onPress={onClose} hitSlop={12}>
            <Feather name="x" size={22} color={"#F9F9F9"} />
          </Pressable>
        </View>
        <View
          style={[styles.searchRow, { backgroundColor: "rgba(255,255,255,0.075)", borderColor: "rgba(255,255,255,0.1)" }]}
        >
          <Feather name="search" size={16} color={"#F4F4F4"} />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Buscar sesión…"
            placeholderTextColor={"#F4F4F4"}
            style={[styles.searchInput, { color: "#F9F9F9" }]}
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
                  backgroundColor: "rgba(255,255,255,0.075)",
                  borderColor: "rgba(255,255,255,0.1)",
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Image source={item.image as never} style={styles.pickerImg} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text style={[styles.pickerLabel, { color: "#F4F4F4" }]}>
                  {item.categoryLabel.toUpperCase()}
                </Text>
                <Text style={[styles.pickerTitle, { color: "#F9F9F9" }]} numberOfLines={2}>
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

function PendingBubble({ item }: { item: PendingAttachment }) {
  const colors = useColors();
  const { theme: sceneTheme } = useSceneTheme();
  return (
    <View style={{ alignItems: "flex-end", marginBottom: 8 }}>
      <View style={{ position: "relative", opacity: item.failed ? 0.55 : 0.85 }}>
        {item.kind === "image" ? (
          <View style={{ borderRadius: 14, overflow: "hidden" }}>
            <Image
              source={{ uri: item.localUri }}
              style={{
                width: 220,
                height:
                  item.width && item.height
                    ? Math.min(280, Math.round((220 * item.height) / item.width))
                    : 220,
              }}
              contentFit="cover"
            />
          </View>
        ) : (
          <View
            style={[
              styles.audioBubble,
              { backgroundColor: undefined, overflow: "hidden", borderWidth: 0 },
            ]}
          >
            <GoldGradientFill />
            <View style={styles.audioPlayBtn}>
              <Feather name="mic" size={18} color="#080F0A" />
            </View>
            <View style={{ flex: 1 }}>
              <View style={[styles.audioTrack, { backgroundColor: "#080F0A33" }]} />
              <Text style={[styles.audioTime, { color: "#080F0A" }]}>
                {formatDuration(item.durationMs ?? 0)}
              </Text>
            </View>
          </View>
        )}
        {/* Upload overlay */}
        <View
          style={{
            position: "absolute",
            right: 6,
            bottom: 6,
            backgroundColor: "#000000AA",
            borderRadius: 10,
            paddingHorizontal: 6,
            paddingVertical: 3,
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
          }}
        >
          {item.failed ? (
            <>
              <Feather name="alert-circle" size={11} color="#E07A7A" />
              <Text style={{ color: "#E07A7A", fontSize: 10, fontWeight: "600" }}>
                Error
              </Text>
            </>
          ) : (
            <>
              <ActivityIndicator size="small" color={colors.accent} />
              <Text style={{ color: "#FFFFFFCC", fontSize: 10, fontWeight: "600" }}>
                Enviando
              </Text>
            </>
          )}
        </View>
      </View>
    </View>
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
  const { theme: sceneTheme } = useSceneTheme();
  const url = useMemo(() => resolveAttachmentUrl(objectPath), [objectPath]);
  const soundRef = useRef<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [positionMs, setPositionMs] = useState(0);
  const [loading, setLoading] = useState(false);
  const totalMs = durationMs > 0 ? durationMs : 0;

  // Native: preload Sound on mount so first tap plays instantly
  useEffect(() => {
    if (Platform.OS === "web") return;
    let cancelled = false;
    (async () => {
      try {
        const { sound } = await Audio.Sound.createAsync(
          { uri: url },
          { shouldPlay: false },
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
        if (cancelled) {
          sound.unloadAsync().catch(() => {});
          return;
        }
        soundRef.current = sound;
      } catch (err) {
        console.log("[audio] preload error", err);
      }
    })();
    return () => {
      cancelled = true;
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
      }
    };
  }, [url]);

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
  const fg = isMine ? "#080F0A" : "#F9F9F9";
  const trackBg = isMine ? "#080F0A33" : "rgba(255,255,255,0.1)";
  const trackFill = isMine ? "#080F0A" : colors.primary;

  return (
    <View
      style={[
        styles.audioBubble,
        {
          backgroundColor: isMine ? undefined : "rgba(255,255,255,0.075)",
          overflow: isMine ? "hidden" : undefined,
          borderColor: isMine ? "transparent" : "rgba(255,255,255,0.1)",
          borderWidth: isMine ? 0 : 1,
        },
      ]}
    >
      {isMine && <GoldGradientFill />}
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
  const { theme: sceneTheme } = useSceneTheme();
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.attachBackdrop} onPress={onClose}>
        <Pressable
          onPress={(e) => e.stopPropagation()}
          style={[
            styles.attachSheet,
            {
              backgroundColor: sceneTheme.gradient[0],
              borderColor: "rgba(255,255,255,0.1)",
              paddingBottom: insets.bottom + 16,
            },
          ]}
        >
          <View style={styles.attachHandle} />
          <Text style={[styles.attachTitle, { color: "#F9F9F9" }]}>Adjuntar</Text>
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
            sublabel="Mantén grabando hasta 5 min"
            tint="#FFFFFF"
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
  const { theme: sceneTheme } = useSceneTheme();
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.attachOption,
        {
          backgroundColor: "rgba(255,255,255,0.075)",
          borderColor: "rgba(255,255,255,0.1)",
          opacity: pressed ? 0.85 : 1,
        },
      ]}
    >
      <View style={[styles.attachIcon, { backgroundColor: tint + "22" }]}>
        <Feather name={icon} size={20} color={tint} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.attachLabel, { color: "#F9F9F9" }]}>{label}</Text>
        <Text style={[styles.attachSub, { color: "#F4F4F4" }]}>{sublabel}</Text>
      </View>
      <Feather name="chevron-right" size={18} color={"#F4F4F4"} />
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
  const { theme: sceneTheme } = useSceneTheme();
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
          { backgroundColor: sceneTheme.gradient[0], paddingTop: insets.top },
        ]}
      >
        <View style={styles.pickerHeader}>
          <Pressable onPress={onClose} hitSlop={12}>
            <Feather name="x" size={22} color={"#F9F9F9"} />
          </Pressable>
          <Text style={[styles.pickerHeaderTitle, { color: "#F9F9F9" }]}>
            Buscar GIF
          </Text>
          <View style={{ width: 22 }} />
        </View>
        <View
          style={[
            styles.searchBox,
            { backgroundColor: "rgba(255,255,255,0.075)", borderColor: "rgba(255,255,255,0.1)" },
          ]}
        >
          <Feather name="search" size={16} color={"#F4F4F4"} />
          <TextInput
            value={query}
            onChangeText={setQuery}
            placeholder="Buscar en Giphy…"
            placeholderTextColor={"#F4F4F4"}
            style={[styles.searchInput, { color: "#F9F9F9" }]}
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
                  backgroundColor: "rgba(255,255,255,0.075)",
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
                color: "#F4F4F4",
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
  recTime: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600" },
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
  audioTime: { fontFamily: "Manrope", fontSize: 11, marginTop: 4 },
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
  attachTitle: { fontFamily: "Manrope", fontSize: 18, fontWeight: "700", marginBottom: 6 },
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
  attachLabel: { fontFamily: "Manrope", fontSize: 14, fontWeight: "700", marginBottom: 2 },
  attachSub: { fontFamily: "Manrope", fontSize: 12 },
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
  headerInitials: { fontFamily: "Manrope", fontSize: 13, fontWeight: "700" },
  headerName: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700" },
  headerSub: { fontFamily: "Manrope", fontSize: 12, marginTop: 2 },
  empty: { fontFamily: "Manrope", fontSize: 13, textAlign: "center", paddingHorizontal: 32 },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center" },
  timeLabel: { fontFamily: "Manrope", fontSize: 10, marginTop: 12, marginBottom: 4, alignSelf: "center" },
  bubble: {
    maxWidth: "78%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginBottom: 2,
  },
  bubbleText: { fontFamily: "Manrope", fontSize: 14, lineHeight: 19 },
  readReceipt: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 2 },
  readText: { fontFamily: "Manrope", fontSize: 10 },
  sessionCard: {
    flexDirection: "row",
    width: 240,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 2,
  },
  sessionImg: { width: 70, height: 70 },
  sessionLabel: { fontFamily: "Manrope", fontSize: 9, fontWeight: "700", letterSpacing: 0.8, marginBottom: 2 },
  sessionTitle: { fontFamily: "Manrope", fontSize: 13, fontWeight: "700", marginBottom: 2 },
  sessionDuration: { fontFamily: "Manrope", fontSize: 11 },
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
    fontFamily: "Manrope",
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
  modalTitle: { fontFamily: "Manrope", fontSize: 20, fontWeight: "700" },
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
  searchInput: { fontFamily: "Manrope", flex: 1, fontSize: 14 },
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
  pickerLabel: { fontFamily: "Manrope", fontSize: 9, fontWeight: "700", letterSpacing: 0.8, marginBottom: 2 },
  pickerTitle: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600" },
  pickerRoot: { flex: 1 },
  pickerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  pickerHeaderTitle: { fontFamily: "Manrope", fontSize: 16, fontWeight: "700" },
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
