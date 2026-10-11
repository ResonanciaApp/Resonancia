import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { CardCaptionText as Text } from "@/components/CardCaptionText";

import { CARD_TEXT_ABOVE, CARD_TEXT_BELOW } from "@/constants/colors";
import { useCatalog } from "@/context/CatalogContext";
import { useDownloads } from "@/context/DownloadContext";
import { usePlayerBrowse } from "@/context/PlayerContext";
import { getSessionById } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

export function ProfileDownloadsSection({
  linkColor,
  descriptionColor,
}: {
  linkColor: string;
  descriptionColor: string;
}) {
  const colors = useColors();
  const { downloads, loading, supported } = useDownloads();
  const { version: catalogVersion } = useCatalog();
  const { playSession } = usePlayerBrowse();
  const entries = useMemo(
    () => downloads
      .filter((item) => item.status === "complete" && !!item.localUri)
      .flatMap((item) => {
        const session = getSessionById(item.sessionId);
        return session ? [{ item, session }] : [];
      }),
    [downloads, catalogVersion],
  );

  return (
    <View testID="profile-downloads-section" style={styles.section}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Descargas</Text>
        <Pressable
          onPress={() => router.push("/descargas")}
          accessibilityRole="button"
          accessibilityLabel="Ver todas las descargas"
          hitSlop={8}
        >
          <Text style={[styles.link, { color: linkColor }]}>Ver todo</Text>
        </Pressable>
      </View>
      {!supported ? (
        <Text style={[styles.description, { color: descriptionColor }]}>
          Las descargas se guardan en la app instalada para escucharlas sin conexión.
        </Text>
      ) : loading ? (
        <Text style={[styles.description, { color: descriptionColor }]}>Cargando descargas…</Text>
      ) : entries.length === 0 ? (
        <Text style={[styles.description, { color: descriptionColor }]}>
          Aquí aparecerán las sesiones que descargues para escucharlas sin conexión.
        </Text>
      ) : (
        <View style={styles.cards}>
          {entries.map(({ item, session }) => (
            <Pressable
              key={item.sessionId}
              style={({ pressed }) => [styles.card, { opacity: pressed ? 0.75 : 1 }]}
              accessibilityRole="button"
              accessibilityLabel={`Abrir ${session.title}`}
              onPress={() => {
                if (session.skipMiniPlayer) {
                  playSession(session);
                  return;
                }
                if (session.skipDetail) {
                  playSession(session);
                  router.push("/player");
                  return;
                }
                router.push(`/session/${session.id}` as never);
              }}
            >
              <View>
                <Image source={session.image as never} style={styles.cover} contentFit="cover" />
                <Text style={styles.duration}>{session.durationLabel}</Text>
              </View>
              <View style={styles.copy}>
                <Text style={[styles.sessionTitle, { color: colors.foreground }]} numberOfLines={2}>
                  {session.title}
                </Text>
                <Text style={styles.category} numberOfLines={1}>{session.categoryLabel || "Contenido"}</Text>
              </View>
            </Pressable>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { borderRadius: 14, backgroundColor: "rgba(0,0,0,0.16)", padding: 16, paddingVertical: 18, marginBottom: 32 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  title: { fontFamily: "Manrope", fontSize: 16, fontWeight: "800" },
  link: { fontFamily: "Manrope", fontSize: 13, fontWeight: "700" },
  description: { fontFamily: "Manrope", fontSize: 13, lineHeight: 20 },
  cards: { marginTop: 7, gap: 16 },
  card: { flexDirection: "row", alignItems: "center", gap: 12 },
  cover: { width: 68, height: 68, borderRadius: 10 },
  duration: {
    position: "absolute", bottom: 4, right: 4, color: CARD_TEXT_ABOVE, fontSize: 10,
    backgroundColor: "rgba(0,0,0,0.62)", paddingHorizontal: 4, borderRadius: 4,
  },
  copy: { flex: 1, minWidth: 0, gap: 4 },
  sessionTitle: { fontFamily: "Manrope", fontSize: 14, fontWeight: "700" },
  category: { fontFamily: "Manrope", fontSize: 12, color: CARD_TEXT_BELOW },
});