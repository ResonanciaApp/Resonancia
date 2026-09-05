import React, { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Image as ExpoImage } from "expo-image";
import { router } from "expo-router";
import { useCategoryOverlayOptional } from "@/context/CategoryOverlayContext";
import { SESSIONS } from "@/data/sessions";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import type { CommunityFeedEvent } from "@/lib/communityApi";

// ── Helpers ────────────────────────────────────────────────────────────────

function plainActionText(event: CommunityFeedEvent): string {
  const { eventType, payload } = event;
  switch (eventType) {
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
): number | null {
  if (!sessionId) return null;
  const session = SESSIONS.find((s) => s.id === sessionId);
  return (session?.image as number | undefined) ?? null;
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

function ActionText({ event }: { event: CommunityFeedEvent }): React.JSX.Element {
  const { eventType, payload } = event;

  if (eventType === "session_play") {
    const sessionName =
      typeof payload.sessionName === "string" ? payload.sessionName : "una sesión";
    const artistName =
      typeof payload.artistName === "string" ? payload.artistName : null;
    return (
      <Text style={styles.action} numberOfLines={2}>
        <Text style={styles.actionMuted}>{"está escuchando la sesión "}</Text>
        <Text style={styles.actionGold}>{sessionName}</Text>
        {artistName ? (
          <>
            <Text style={styles.actionMuted}>{" de "}</Text>
            <Text style={styles.actionBright}>{artistName}</Text>
          </>
        ) : null}
      </Text>
    );
  }

  return (
    <Text style={styles.action} numberOfLines={2}>
      {plainActionText(event)}
    </Text>
  );
}

export function ActivityFeedCard({ event }: Props) {
  const overlay = useCategoryOverlayOptional();
  const { playSession } = usePlayer();
  const { isPremium } = usePremium();
  const { user } = event;
  const isLive = event.isLive === true;
  const thumb = sessionThumbnail(event.payload.sessionId);
  const displayName =
    typeof user.displayName === "string" && user.displayName.trim()
      ? user.displayName
      : "Alguien";
  const location = typeof user.location === "string" ? user.location : null;
  const nameLine = location ? `${displayName} en ${location}` : displayName;

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
        <ActionText event={event} />
      </View>

      {/* Session thumbnail — tappable, navega a la sesión */}
      {thumb && event.payload.sessionId && (
        <Pressable
          onPress={() => {
            const s = SESSIONS.find((x) => String(x.id) === String(event.payload.sessionId));
            if (s?.skipMiniPlayer && !(s.isPremium && !isPremium)) { playSession(s); return; }
            if (s?.skipDetail) { playSession(s); router.push("/player" as never); return; }
            if (overlay) overlay.openCategory(`/session/${event.payload.sessionId}`);
            else router.push(`/session/${event.payload.sessionId}` as never);
          }}
          hitSlop={8}
        >
          <ExpoImage
            source={thumb}
            style={styles.thumb}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        </Pressable>
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
    paddingVertical: 12,
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
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(244,244,244,0.55)",
    transform: [{ translateY: 1 }],
  },
  action: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "400",
    color: "rgba(244,244,244,0.55)",
    lineHeight: 17,
  },
  actionMuted: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "400",
    color: "rgba(249,249,249,0.9)",
  },
  actionGold: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "600",
    color: "#BE9650",
  },
  actionBright: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "500",
    color: "rgba(249,249,249,0.9)",
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: "rgba(181,211,255,0.045)",
  },
});
