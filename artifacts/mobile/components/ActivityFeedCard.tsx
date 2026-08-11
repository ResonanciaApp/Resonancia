import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { SESSIONS } from "@/data/sessions";
import type { CommunityFeedEvent } from "@/lib/communityApi";

// ── Helpers ────────────────────────────────────────────────────────────────

function actionText(event: CommunityFeedEvent): string {
  const { eventType, payload } = event;
  switch (eventType) {
    case "session_play": {
      const name = payload.sessionName ?? "una sesión";
      const cat = payload.category ? ` · ${payload.category}` : "";
      return `está escuchando "${name}"${cat}`;
    }
    case "mixer_active":
      return "está creando en el Mezclador";
    case "geometrix_active":
      return "está creando en Geometrix";
    case "mix_shared": {
      const name = payload.mixName ?? "una mezcla";
      return `compartió "${name}"`;
    }
    case "glyph_shared":
      return "compartió una creación de Geometrix";
    case "user_joined":
      return "se unió a RESONANCIA ✦";
    default:
      return "está en RESONANCIA";
  }
}

function sessionThumbnail(
  sessionId?: string,
): ReturnType<typeof require> | null {
  if (!sessionId) return null;
  const session = SESSIONS.find((s) => s.id === sessionId);
  return session?.image ?? null;
}

// ── Live dot ───────────────────────────────────────────────────────────────

function LiveDot() {
  const anim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 0.25, duration: 800, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true }),
      ]),
    ).start();
  }, [anim]);

  return (
    <Animated.View style={[styles.liveDot, { opacity: anim }]} />
  );
}

// ── Card ───────────────────────────────────────────────────────────────────

interface Props {
  event: CommunityFeedEvent;
}

export function ActivityFeedCard({ event }: Props) {
  const { user, isLive } = event;
  const thumb = sessionThumbnail(event.payload.sessionId);
  const nameLine = user.location
    ? `${user.displayName} · ${user.location}`
    : user.displayName;

  return (
    <View style={styles.card}>
      {/* Avatar */}
      <View style={styles.avatarWrap}>
        <ExpoImage
          source={{ uri: user.avatarUrl }}
          style={styles.avatar}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
        {isLive && <LiveDot />}
      </View>

      {/* Text */}
      <View style={styles.textCol}>
        <Text style={styles.name} numberOfLines={1}>
          {nameLine}
        </Text>
        <Text style={styles.action} numberOfLines={2}>
          {actionText(event)}
        </Text>
      </View>

      {/* Session thumbnail (only for session_play) */}
      {thumb && (
        <ExpoImage
          source={thumb}
          style={styles.thumb}
          contentFit="cover"
          cachePolicy="memory-disk"
        />
      )}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 14,
    backgroundColor: "rgba(190,150,80,0.06)",
    borderWidth: 1,
    borderColor: "rgba(190,150,80,0.12)",
    marginBottom: 10,
  },
  avatarWrap: {
    position: "relative",
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  liveDot: {
    position: "absolute",
    bottom: 1,
    right: 1,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#4ADE80",
    borderWidth: 2,
    borderColor: "#060A0F",
  },
  textCol: {
    flex: 1,
    gap: 3,
  },
  name: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(244,244,244,0.9)",
  },
  action: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "400",
    color: "rgba(190,150,80,0.9)",
    lineHeight: 16,
  },
  thumb: {
    width: 42,
    height: 42,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
});
