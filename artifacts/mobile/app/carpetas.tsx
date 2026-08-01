import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
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

import { useFoldersPlaylists } from "@/context/FoldersPlaylistsContext";
import { useColors } from "@/hooks/useColors";

const BG_GRADIENT = ["#340D1A", "#190913"] as const;

export default function CarpetasScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { folders } = useFoldersPlaylists();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  return (
        <LinearGradient
      style={styles.root}
      colors={BG_GRADIENT}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBar hidden />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 }}>
          <Feather name="folder" size={20} color={colors.primary} />
          <Text style={[styles.title, { flex: 0, color: colors.foreground }]}>Mis Carpetas</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[styles.list, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {folders.length === 0 ? (
          <View style={styles.emptyWrap}>
            <View style={[styles.emptyIcon, { backgroundColor: "rgba(212,175,55,0.10)" }]}>
              <Feather name="folder" size={40} color={colors.primary} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Todavía no tenés carpetas
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Usá los 3 puntitos junto a cualquier sesión{"\n"}para crear tu primera carpeta.
            </Text>
          </View>
        ) : (
          folders.map((folder) => (
            <Pressable
              key={folder.id}
              onPress={() => router.push(`/carpeta/${folder.id}` as never)}
              style={({ pressed }) => [
                styles.row,
                { borderBottomColor: "rgba(61,14,22,0.40)", opacity: pressed ? 0.75 : 1 },
              ]}
            >
              <View style={[styles.folderIcon, { backgroundColor: "rgba(212,175,55,0.12)" }]}>
                <Feather name="folder" size={22} color={colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowName, { color: colors.foreground }]} numberOfLines={1}>
                  {folder.name}
                </Text>
                <Text style={[styles.rowMeta, { color: colors.mutedForeground }]}>
                  {folder.sessionIds.length === 0
                    ? "Vacía"
                    : `${folder.sessionIds.length} sesión${folder.sessionIds.length !== 1 ? "es" : ""}`}
                </Text>
              </View>
              <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.25)" />
            </Pressable>
          ))
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(61,14,22,0.40)",
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  title: { fontFamily: "Manrope", flex: 1, fontSize: 18, fontWeight: "700", textAlign: "center" },
  list: { paddingHorizontal: 20, paddingTop: 8 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  folderIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  rowName: { fontFamily: "Manrope", fontSize: 16, fontWeight: "600" },
  rowMeta: { fontFamily: "Manrope", fontSize: 13, marginTop: 2 },
  emptyWrap: { alignItems: "center", paddingTop: 80, paddingHorizontal: 32 },
  emptyIcon: {
    width: 80, height: 80,
    borderRadius: 24,
    alignItems: "center", justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: { fontFamily: "Manrope", fontSize: 18, fontWeight: "700", textAlign: "center", marginBottom: 10 },
  emptySubtitle: { fontFamily: "Manrope", fontSize: 14, lineHeight: 20, textAlign: "center" },
});
