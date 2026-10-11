import { router } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { CardCaptionText as Text } from "@/components/CardCaptionText";
import { Image } from "expo-image";

import { SessionDurationBadge } from "@/components/SessionDurationBadge";
import { useCatalog } from "@/context/CatalogContext";
import { usePlayer, usePlayerBrowse } from "@/context/PlayerContext";
import { getSessionById } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";
import { useDayRollover } from "@/hooks/useDayRollover";
import { CARD_TEXT_ABOVE, CARD_TEXT_BELOW } from "@/constants/colors";
import { getWeeklyCompletedSessions } from "@/utils/weekly-completed-sessions";

export function WeeklyCompletedSessions() {
  const colors = useColors();
  const { statEvents } = usePlayer();
  const { playSession } = usePlayerBrowse();
  const { version: catalogVersion } = useCatalog();
  const todayKey = useDayRollover();

  const sessions = useMemo(
    () =>
      getWeeklyCompletedSessions(statEvents, new Date()).flatMap((event) => {
        const session = getSessionById(event.sessionId);
        return session ? [{ event, session }] : [];
      }),
    [statEvents, todayKey, catalogVersion],
  );

  if (sessions.length === 0) return null;

  const openSession = (session: NonNullable<ReturnType<typeof getSessionById>>) => {
    if (session.skipMiniPlayer) {
      playSession(session);
      return;
    }
    if (session.skipDetail) {
      playSession(session);
      router.push("/player" as never);
      return;
    }
    router.push(`/session/${session.id}` as never);
  };

  return (
    <View testID="weekly-completed-sessions">
      <View
        testID="weekly-completed-sessions-divider"
        style={styles.divider}
      />
      <View testID="weekly-completed-sessions-header" style={styles.header}>
        <Text
          testID="weekly-completed-sessions-title"
          style={[styles.title, { color: colors.foreground }]}
        >
          Sesiones completadas
        </Text>
      </View>
      <View
        testID="weekly-completed-sessions-cards"
        style={styles.cards}
      >
        {sessions.map(({ event, session }) => (
          <Pressable
            key={`${event.sessionId}:${event.playedAt}`}
            testID={`weekly-completed-session-${event.sessionId}-${event.playedAt}`}
            accessibilityRole="button"
            accessibilityLabel={`Abrir ${session.title}`}
            onPress={() => openSession(session)}
            style={({ pressed }) => [
              styles.card,
              { opacity: pressed ? 0.78 : 1 },
            ]}
          >
            <View style={styles.coverWrap}>
              <Image
                source={session.image}
                style={styles.cover}
                contentFit="cover"
              />
              <SessionDurationBadge
                label={session.durationLabel}
                showClock
                style={styles.duration}
                textStyle={styles.durationText}
              />
            </View>
            <View style={styles.copy}>
              <Text
                style={[styles.sessionTitle, { color: colors.foreground }]}
                numberOfLines={2}
              >
                {session.title}
              </Text>
              <Text
                style={[styles.category, { color: CARD_TEXT_BELOW }]}
                numberOfLines={1}
              >
                {session.categoryLabel || "Contenido"}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.05)",
    marginBottom: 21,
  },
  header: {
    marginBottom: 21,
  },
  title: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "800",
  },
  cards: {
    flexDirection: "column",
    gap: 16,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  coverWrap: {
    width: 78,
    height: 78,
    position: "relative",
  },
  cover: {
    width: 78,
    height: 78,
    borderRadius: 10,
  },
  duration: {
    position: "absolute",
    bottom: 4,
    left: 4,
    alignSelf: "flex-start",
    height: 23,
    paddingHorizontal: 7,
    paddingVertical: 0,
    justifyContent: "center",
  },
  durationText: {
    fontSize: 10,
    fontWeight: "600",
    color: CARD_TEXT_ABOVE,
  },
  copy: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  sessionTitle: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "700",
  },
  category: {
    fontFamily: "Manrope",
    fontSize: 12,
  },
});