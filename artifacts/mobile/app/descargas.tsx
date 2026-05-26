import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { SessionCard } from "@/components/SessionCard";
import { SESSIONS } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";
import { useDownloads } from "@/context/DownloadsContext";

export default function DescargasScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { downloads } = useDownloads();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const sessions = useMemo(
    () => SESSIONS.filter((s) => downloads.includes(s.id)),
    [downloads],
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
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Descargas</Text>
          <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
            Sesiones disponibles para escuchar sin conexión
          </Text>
        </View>

        {sessions.length === 0 ? (
          <View style={[styles.empty, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="download-cloud" size={26} color={"rgba(198,155,79,0.4)"} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sin descargas todavía</Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Abre una sesión y pulsa{" "}
              <Text style={{ fontWeight: "700" }}>Descargar</Text> para tenerla aquí.
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
              {sessions.length} sesión{sessions.length !== 1 ? "es" : ""} descargada{sessions.length !== 1 ? "s" : ""}
            </Text>
            {sessions.map((s) => (
              <SessionCard key={s.id} session={s} horizontal />
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
