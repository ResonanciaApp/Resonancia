import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { SessionCard } from "@/components/SessionCard";
import { useDiarioFavoritesCtx, type FavoriteDiarioEntry } from "@/context/DiarioFavoritesContext";
import { usePlayer } from "@/context/PlayerContext";
import { SESSIONS } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

const LINE_H = 20; // matches entryText lineHeight
const MAX_LINES = 3;

function DiarioEntryCard({ entry }: { entry: FavoriteDiarioEntry }) {
  const colors = useColors();
  const [expanded, setExpanded] = useState(false);
  // fullHeight: natural height of the text (measured on first render without line limit)
  const [fullHeight, setFullHeight] = useState<number | null>(null);

  const isTruncated = fullHeight !== null && fullHeight > LINE_H * MAX_LINES + 4;

  // On first render numberOfLines is undefined → text is full → onLayout captures real height
  // After measurement, apply MAX_LINES if truncated
  const numberOfLines = fullHeight === null || expanded || !isTruncated ? undefined : MAX_LINES;

  return (
    <Pressable
      onPress={() => isTruncated && setExpanded((v) => !v)}
      style={[styles.entryCard, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={styles.entryCardTop}>
        <View style={[styles.sectionBadge, { borderColor: entry.accentColor + "55", backgroundColor: entry.accentColor + "18" }]}>
          <Text style={[styles.sectionBadgeText, { color: entry.accentColor }]}>
            {entry.sectionTitle}
          </Text>
        </View>
        <Text style={[styles.entryDate, { color: colors.mutedForeground }]}>
          {formatDate(entry.createdAt)}
        </Text>
      </View>

      <View
        onLayout={(e) => {
          // Only capture the first measurement (full-height render)
          if (fullHeight === null) {
            setFullHeight(e.nativeEvent.layout.height);
          }
        }}
      >
        <Text
          style={[styles.entryText, { color: colors.foreground }]}
          numberOfLines={numberOfLines}
          ellipsizeMode="tail"
        >
          {entry.text}
        </Text>
      </View>

      {isTruncated && !expanded && (
        <Text style={[styles.expandHint, { color: colors.mutedForeground }]}>
          Toca para leer más
        </Text>
      )}
      {isTruncated && expanded && (
        <Text style={[styles.expandHint, { color: colors.mutedForeground }]}>
          Toca para colapsar
        </Text>
      )}
    </Pressable>
  );
}

export default function FavoritesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { favorites } = usePlayer();
  const { favoriteEntries } = useDiarioFavoritesCtx();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const favSessions = SESSIONS.filter((s) => favorites.includes(s.id));

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: 160 + bottomPad,
          paddingTop: topPad + 12,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Favoritos</Text>
          <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
            Tus viajes sonoros y reflexiones guardados
          </Text>
        </View>

        {/* ── Sesiones ── */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionTitleRow}>
            <Feather name="headphones" size={15} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Sesiones
            </Text>
          </View>

          {favSessions.length === 0 ? (
            <View style={[styles.emptySmall, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="music" size={20} color={colors.border} />
              <Text style={[styles.emptySmallText, { color: colors.mutedForeground }]}>
                Aún no guardaste sesiones
              </Text>
              <Pressable
                onPress={() => router.push("/(tabs)/explore" as never)}
                style={[styles.emptyLink, { borderColor: colors.border }]}
              >
                <Text style={[styles.emptyLinkText, { color: colors.accent }]}>Explorar</Text>
              </Pressable>
            </View>
          ) : (
            <View>
              <Text style={[styles.countLabel, { color: colors.mutedForeground }]}>
                {favSessions.length} sesión{favSessions.length !== 1 ? "es" : ""} guardada{favSessions.length !== 1 ? "s" : ""}
              </Text>
              {favSessions.map((s) => (
                <SessionCard key={s.id} session={s} horizontal />
              ))}
            </View>
          )}
        </View>

        {/* ── Reflexiones del diario ── */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionTitleRow}>
            <Feather name="book-open" size={15} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Reflexiones del diario
            </Text>
          </View>

          {favoriteEntries.length === 0 ? (
            <View style={[styles.emptySmall, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="heart" size={20} color={colors.border} />
              <Text style={[styles.emptySmallText, { color: colors.mutedForeground }]}>
                Marca reflexiones con ♥ en el diario
              </Text>
            </View>
          ) : (
            <View style={styles.entriesList}>
              <Text style={[styles.countLabel, { color: colors.mutedForeground }]}>
                {favoriteEntries.length} reflexión{favoriteEntries.length !== 1 ? "es" : ""} guardada{favoriteEntries.length !== 1 ? "s" : ""}
              </Text>
              {favoriteEntries.map((entry) => (
                <DiarioEntryCard key={entry.id} entry={entry} />
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  header: { marginBottom: 28 },
  pageTitle: { fontSize: 30, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },
  pageSub: { fontSize: 13 },

  sectionBlock: { marginBottom: 32 },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", letterSpacing: 0.3 },

  countLabel: { fontSize: 12, marginBottom: 12 },

  emptySmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  emptySmallText: { fontSize: 13, flex: 1 },
  emptyLink: {
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  emptyLinkText: { fontSize: 12, fontWeight: "600" },

  entriesList: { gap: 10 },
  entryCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 8,
    position: "relative",
  },
  entryCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  sectionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  sectionBadgeText: { fontSize: 10, fontWeight: "700", letterSpacing: 0.5 },
  entryDate: { fontSize: 10 },
  entryText: { fontSize: 13, lineHeight: 20 },
  expandHint: { fontSize: 10, marginTop: 2, letterSpacing: 0.3 },
});
