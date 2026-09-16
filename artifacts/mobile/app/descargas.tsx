import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack } from "expo-router";
import React, { useMemo } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useDownloads } from "@/context/DownloadContext";
import { usePlayer } from "@/context/PlayerContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { getSessionById } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

function formatBytes(bytes: number) {
  return bytes > 1_048_576
    ? `${(bytes / 1_048_576).toFixed(1)} MB`
    : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

export default function DownloadsScreen() {
  const colors = useColors();
  const { theme } = useSceneTheme();
  const insets = useSafeAreaInsets();
  const { downloads, loading, supported, download, remove, clear } = useDownloads();
  const { playSession } = usePlayer();
  const entries = useMemo(
    () =>
      downloads
        .map((item) => ({ item, session: getSessionById(item.sessionId) }))
        .filter(
          (
            entry,
          ): entry is {
            item: (typeof downloads)[number];
            session: NonNullable<ReturnType<typeof getSessionById>>;
          } => !!entry.session,
        ),
    [downloads],
  );
  const completedEntries = entries.filter(({ item }) => item.status === "complete");
  const totalBytes = completedEntries.reduce(
    (sum, { item }) => sum + item.bytesDownloaded,
    0,
  );

  const clearAll = () =>
    Alert.alert(
      "Borrar descargas",
      "Eliminarás todas las copias guardadas en este dispositivo.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Borrar", style: "destructive", onPress: () => void clear() },
      ],
    );

  return (
    <LinearGradient
      colors={theme.gradient as unknown as [string, string, ...string[]]}
      locations={theme.gradientLocations}
      style={[
        styles.root,
        {
          paddingTop: Platform.OS === "web" ? 67 : insets.top,
          paddingBottom: (Platform.OS === "web" ? 34 : insets.bottom) + 16,
        },
      ]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={styles.iconButton}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Feather name="chevron-left" size={26} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>Descargas</Text>
        {entries.length ? (
          <Pressable
            onPress={clearAll}
            style={styles.clearButton}
            accessibilityRole="button"
            accessibilityLabel="Borrar todas las descargas"
          >
            <Text style={[styles.clearText, { color: colors.primary }]}>Borrar todo</Text>
          </Pressable>
        ) : (
          <View style={styles.rightSpacer} />
        )}
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {supported && completedEntries.length > 0 && (
          <Text style={[styles.storageSummary, { color: colors.mutedForeground }]}>
            {completedEntries.length} {completedEntries.length === 1 ? "sesión" : "sesiones"}
            {" · "}
            {formatBytes(totalBytes)} guardados en este dispositivo
          </Text>
        )}
        {!supported ? (
          <View style={styles.empty}>
            <Feather name="smartphone" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Disponible en la app instalada
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Las descargas offline requieren un dispositivo iOS o Android.
            </Text>
          </View>
        ) : loading ? (
          <Text style={[styles.loading, { color: colors.mutedForeground }]}>
            Cargando descargas…
          </Text>
        ) : entries.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="download-cloud" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Todavía no hay descargas
            </Text>
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Guarda una sesión para escucharla sin conexión.
            </Text>
          </View>
        ) : (
          entries.map(({ item, session }) => {
            const progress = Math.round(item.progress * 100);
            const secondary =
              item.status === "complete"
                ? [session.categoryLabel, session.durationLabel, formatBytes(item.bytesDownloaded)]
                    .filter(Boolean)
                    .join(" · ")
                : item.status === "downloading"
                  ? `Descargando · ${progress}%`
                  : item.error ?? "No se pudo completar la descarga.";

            return (
              <View
                key={item.sessionId}
                style={[
                  styles.row,
                  {
                    backgroundColor: "rgba(181,211,255,0.08)",
                    borderColor: "rgba(255,255,255,0.08)",
                  },
                ]}
              >
                <Image source={session.image as never} style={styles.cover} contentFit="cover" />
                <Pressable
                  style={styles.info}
                  disabled={item.status !== "complete"}
                  onPress={() => {
                    playSession(session);
                    router.push("/player");
                  }}
                  accessibilityRole="button"
                  accessibilityLabel={`Reproducir ${session.title}`}
                >
                  <Text
                    numberOfLines={2}
                    style={[styles.name, { color: colors.foreground }]}
                  >
                    {session.title}
                  </Text>
                  <Text
                    numberOfLines={2}
                    style={[
                      styles.secondary,
                      {
                        color:
                          item.status === "failed"
                            ? colors.destructive
                            : colors.mutedForeground,
                      },
                    ]}
                  >
                    {secondary}
                  </Text>
                  {item.status === "downloading" && (
                    <View style={styles.progressTrack}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${progress}%`, backgroundColor: colors.primary },
                        ]}
                      />
                    </View>
                  )}
                </Pressable>

                {item.status === "downloading" ? (
                  <Pressable
                    onPress={() => void remove(item.sessionId)}
                    style={styles.iconButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Cancelar descarga de ${session.title}`}
                  >
                    <Feather name="x" color={colors.primary} size={20} />
                  </Pressable>
                ) : item.status === "failed" ? (
                  <Pressable
                    onPress={() => void download(session)}
                    style={styles.iconButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Reintentar descarga de ${session.title}`}
                  >
                    <Feather name="refresh-cw" color={colors.primary} size={19} />
                  </Pressable>
                ) : (
                  <Pressable
                    onPress={() => void remove(item.sessionId)}
                    style={styles.iconButton}
                    accessibilityRole="button"
                    accessibilityLabel={`Eliminar descarga de ${session.title}`}
                  >
                    <Feather name="trash-2" color={colors.mutedForeground} size={19} />
                  </Pressable>
                )}
              </View>
            );
          })
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    height: 58,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    justifyContent: "space-between",
  },
  iconButton: { padding: 9 },
  clearButton: {
    minWidth: 76,
    minHeight: 44,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  rightSpacer: { width: 44 },
  title: { fontSize: 21, fontWeight: "800" },
  clearText: { fontSize: 13, fontWeight: "700" },
  content: { padding: 16, gap: 12 },
  storageSummary: { fontSize: 12, marginBottom: 2 },
  loading: { paddingTop: 32, textAlign: "center" },
  empty: { alignItems: "center", paddingTop: 90, paddingHorizontal: 30, gap: 10 },
  emptyTitle: { fontSize: 17, fontWeight: "800" },
  emptyText: { fontSize: 14, textAlign: "center" },
  row: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cover: { width: 64, height: 64, borderRadius: 11 },
  info: { flex: 1, gap: 5 },
  name: { fontSize: 14, fontWeight: "700" },
  secondary: { fontSize: 12, lineHeight: 16 },
  progressTrack: {
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  progressFill: { height: "100%", borderRadius: 2 },
});