import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { SessionActionsSheet } from "@/components/SessionActionsSheet";
import { useFoldersPlaylists } from "@/context/FoldersPlaylistsContext";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { SESSIONS, type Session } from "@/data/sessions";
import { getGuideById } from "@/data/guides";
import { getVoiceLabel } from "@/config/audio-map";
import { useColors } from "@/hooks/useColors";

export default function PlaylistDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isPremium } = usePremium();
  const { playlists, deletePlaylist, removeFromPlaylist } = useFoldersPlaylists();
  const { playSession } = usePlayer();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  const [actionsSession, setActionsSession] = useState<Session | null>(null);

  const playlist = playlists.find((p) => p.id === id);

  if (!playlist) {
    return (
      <View style={[styles.root, { backgroundColor: "#090F17", alignItems: "center", justifyContent: "center" }]}>
        <Feather name="list" size={48} color="#7A8FA8" style={{ marginBottom: 16 }} />
        <Text style={{ color: "#7A8FA8", fontSize: 16 }}>Playlist no encontrada</Text>
        <Pressable onPress={() => router.back()} style={{ marginTop: 24 }}>
          <Text style={{ color: "#BE9650", fontSize: 15 }}>← Volver</Text>
        </Pressable>
      </View>
    );
  }

  const sessions = playlist.sessionIds
    .map((sid) => SESSIONS.find((s) => s.id === sid))
    .filter(Boolean) as Session[];

  const handleDelete = () => {
    Alert.alert(
      "Eliminar playlist",
      `¿Eliminar "${playlist.name}"? Las sesiones no se borran, solo se quitan de esta playlist.`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            deletePlaylist(playlist.id);
            router.back();
          },
        },
      ]
    );
  };

  const handlePlayAll = () => {
    const first = sessions.find((s) => !s.isPremium || isPremium);
    if (!first) return;
    playSession(first);
    router.push("/player" as never);
  };

  const handleRemove = (sessionId: string) => {
    removeFromPlaylist(playlist.id, sessionId);
  };

  return (
    <View style={[styles.root, { backgroundColor: "#090F17" }]}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <View style={styles.headerCenter}>
          <Feather name="list" size={14} color={colors.primary} style={{ marginRight: 6 }} />
          <Text style={[styles.headerTitle, { color: colors.foreground }]} numberOfLines={1}>
            {playlist.name}
          </Text>
        </View>
        <Pressable onPress={handleDelete} style={styles.iconBtn} hitSlop={8}>
          <Feather name="trash-2" size={18} color="#7A8FA8" />
        </Pressable>
      </View>

      {/* Reproducir todo */}
      {sessions.length > 0 && (
        <Pressable
          onPress={handlePlayAll}
          style={({ pressed }) => [
            styles.playAllBtn,
            { backgroundColor: colors.primary, opacity: pressed ? 0.8 : 1 },
          ]}
        >
          <Feather name="play" size={18} color="#090F17" style={{ marginRight: 8 }} />
          <Text style={styles.playAllLabel}>
            Reproducir todo · {sessions.length} sesión{sessions.length !== 1 ? "es" : ""}
          </Text>
        </Pressable>
      )}

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 32 }}
        showsVerticalScrollIndicator={false}
      >
        {sessions.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Feather name="inbox" size={40} color={colors.mutedForeground} style={{ marginBottom: 14 }} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Esta playlist está vacía.{"\n"}Añadí sesiones desde los 3 puntitos.
            </Text>
          </View>
        ) : (
          sessions.map((session, idx) => (
            <PlaylistSessionRow
              key={session.id}
              session={session}
              index={idx + 1}
              isPremium={isPremium}
              colors={colors}
              onPlay={() => {
                playSession(session);
                router.push("/player" as never);
              }}
              onActionsPress={() => setActionsSession(session)}
              onRemove={() => handleRemove(session.id)}
            />
          ))
        )}
      </ScrollView>

      <SessionActionsSheet
        session={actionsSession}
        visible={actionsSession !== null}
        onClose={() => setActionsSession(null)}
      />
    </View>
  );
}

// ─── Session row ──────────────────────────────────────────────────────────────

type Colors = ReturnType<typeof import("@/hooks/useColors").useColors>;

function PlaylistSessionRow({
  session,
  index,
  isPremium,
  colors,
  onPlay,
  onActionsPress,
  onRemove,
}: {
  session: Session;
  index: number;
  isPremium: boolean;
  colors: Colors;
  onPlay: () => void;
  onActionsPress: () => void;
  onRemove: () => void;
}) {
  const locked = !!session.isPremium && !isPremium;
  const voiceLabel = getVoiceLabel(session);
  const guide = session.guideId ? getGuideById(session.guideId) : null;
  const author = guide?.name ?? "Casa del Cuenco";

  return (
    <View style={styles.row}>
      {/* Número de orden */}
      <Text style={[styles.orderNum, { color: colors.mutedForeground }]}>{index}</Text>

      {/* Thumbnail */}
      <Pressable
        onPress={locked ? () => router.push("/membresia" as never) : onPlay}
        style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}
      >
        <Image
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          source={session.image as any}
          style={styles.thumb}
          placeholder={BLUR_PLACEHOLDER}
          transition={IMAGE_TRANSITION}
          contentFit="cover"
        />
        {/* Play overlay */}
        <View style={styles.thumbPlay}>
          <Feather name="play" size={13} color="rgba(255,255,255,0.85)" />
        </View>
      </Pressable>

      {/* Info */}
      <Pressable
        onPress={locked ? () => router.push("/membresia" as never) : onPlay}
        style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.75 : 1 }]}
      >
        <Text style={[styles.rowName, { color: colors.foreground }]} numberOfLines={2}>
          {session.title}
        </Text>
        <Text style={[styles.rowMeta, { color: colors.mutedForeground }]}>
          {author}{voiceLabel ? ` · ${voiceLabel}` : ""} · {session.durationLabel}
        </Text>
      </Pressable>

      <Pressable onPress={onActionsPress} hitSlop={10} style={styles.moreBtn}>
        <Feather name="more-vertical" size={18} color={colors.mutedForeground} />
      </Pressable>
      <Pressable onPress={onRemove} hitSlop={10} style={styles.removeBtn}>
        <Feather name="x" size={16} color="#7A8FA8" />
      </Pressable>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.08)",
  },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontWeight: "700", flexShrink: 1 },
  playAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 20,
    marginTop: 14,
    marginBottom: 4,
    paddingVertical: 14,
    borderRadius: 14,
  },
  playAllLabel: { fontSize: 15, fontWeight: "700", color: "#090F17" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.06)",
  },
  orderNum: { width: 20, fontSize: 13, textAlign: "center", fontWeight: "600" },
  thumb: { width: 56, height: 56, borderRadius: 10 },
  thumbPlay: {
    position: "absolute",
    inset: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.3)",
    borderRadius: 10,
  },
  rowName: { fontSize: 15, fontWeight: "600", lineHeight: 20 },
  rowMeta: { fontSize: 12, marginTop: 3 },
  moreBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  removeBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  emptyWrap: { alignItems: "center", paddingTop: 60 },
  emptyText: { fontSize: 14, lineHeight: 20, textAlign: "center" },
});
