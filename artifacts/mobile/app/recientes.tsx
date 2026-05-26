import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { SessionCard } from "@/components/SessionCard";
import { usePlayer } from "@/context/PlayerContext";
import { getSessionById } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

function relativeLabel(iso: string) {
  const t = new Date(iso).getTime();
  const diffMs = Date.now() - t;
  const min = Math.floor(diffMs / 60000);
  if (min < 1) return "hace un momento";
  if (min < 60) return `hace ${min} min`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `hace ${hr} h`;
  const d = Math.floor(hr / 24);
  if (d < 7) return `hace ${d} d`;
  return new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "short" });
}

export default function RecientesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { history } = usePlayer();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const entries = useMemo(
    () =>
      history
        .map((e) => ({ entry: e, session: getSessionById(e.sessionId) }))
        .filter((x) => x.session),
    [history],
  );

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
        <View style={styles.headerTop}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/profile" as never))}
            hitSlop={10}
            style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="chevron-left" size={20} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Recientes</Text>
          <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
            Tu historial de sesiones
          </Text>
        </View>

        {entries.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="clock" size={26} color={"rgba(198,155,79,0.4)"} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Aún no hay historial</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Las sesiones que escuches aparecerán aquí.
            </Text>
            <Pressable
              onPress={() => router.push("/(tabs)/explore" as never)}
              style={[styles.emptyLink, { borderColor: colors.border }]}
            >
              <Text style={[styles.emptyLinkText, { color: colors.accent }]}>Explorar sesiones</Text>
            </Pressable>
          </View>
        ) : (
          <View>
            <Text style={[styles.countLabel, { color: colors.mutedForeground }]}>
              {entries.length} sesión{entries.length !== 1 ? "es" : ""} reciente{entries.length !== 1 ? "s" : ""}
            </Text>
            {entries.map(({ entry, session }) => (
              <View key={`${entry.sessionId}-${entry.playedAt}`} style={styles.row}>
                <Text style={[styles.timeLabel, { color: colors.mutedForeground }]}>
                  {relativeLabel(entry.playedAt)}
                </Text>
                <SessionCard session={session!} horizontal />
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  headerTop: { marginBottom: 14 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  header: { marginBottom: 20 },
  pageTitle: { fontSize: 30, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },
  pageSub: { fontSize: 13 },
  countLabel: { fontSize: 12, marginBottom: 12 },
  row: { marginBottom: 6 },
  timeLabel: { fontSize: 11, marginBottom: 4, marginLeft: 4, letterSpacing: 0.4 },
  empty: {
    borderRadius: 18, borderWidth: 1, padding: 24, alignItems: "center", gap: 10,
  },
  emptyTitle: { fontSize: 15, fontWeight: "700" },
  emptyText: { fontSize: 13, lineHeight: 19, textAlign: "center" },
  emptyLink: {
    marginTop: 6, borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 8,
  },
  emptyLinkText: { fontSize: 13, fontWeight: "600" },
});
