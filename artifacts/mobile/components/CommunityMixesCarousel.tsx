/**
 * CommunityMixesCarousel — carrusel de mezclas compartidas por la comunidad.
 * ─────────────────────────────────────────────────────────────────
 * Aparece en Inicio (debajo de las secciones). Cualquiera puede ver y
 * reproducir. Dar like requiere cuenta (Clerk); un invitado es enviado
 * a registrarse. Tocar una card carga la mezcla y abre el mezclador.
 * ─────────────────────────────────────────────────────────────────
 */
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback } from "react";
import { ImageBackground, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

import { useGetSharedMixes } from "@workspace/api-client-react";
import type { SharedMix } from "@workspace/api-client-react";

import { getMixImage } from "@/config/mix-images";
import { useColors } from "@/hooks/useColors";

export function CommunityMixesCarousel() {
  const colors = useColors();

  const { data } = useGetSharedMixes();

  const mixes = data?.mixes ?? [];

  const handlePlay = useCallback((mix: SharedMix) => {
    // Abre el reproductor de la mezcla de la comunidad (la presenta como un
    // todo, sin exponer las pistas/volúmenes del creador).
    router.push(`/mezcla/${mix.id}` as never);
  }, []);

  if (mixes.length === 0) return null;

  return (
    <View style={styles.section}>
      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Mezclas de la comunidad
        </Text>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.hScroll}
      >
        {mixes.map((mix) => (
          <View
            key={mix.id}
            style={[styles.card, { backgroundColor: "rgba(255,255,255,0.05)", borderColor: colors.border }]}
          >
            <Pressable onPress={() => handlePlay(mix)}>
              <ImageBackground
                source={getMixImage(mix.image ?? undefined)}
                style={styles.thumb}
                imageStyle={styles.thumbInner}
              >
                <View style={styles.playBubble}>
                  <Feather name="play" size={16} color="#FFFFFF" />
                </View>
              </ImageBackground>
            </Pressable>

            <View style={styles.cardBody}>
              <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>
                {mix.name}
              </Text>
              <View style={styles.authorRow}>
                <Feather name="user" size={12} color={colors.mutedForeground} />
                <Text
                  style={[styles.cardAuthor, { color: colors.mutedForeground }]}
                  numberOfLines={1}
                >
                  {mix.author.displayName}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginBottom: 22, paddingHorizontal: 20 },
  sectionRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 12 },
  sectionTitle: { fontSize: 17, fontWeight: "700", letterSpacing: 0.3 },
  hScroll: { paddingRight: 12, gap: 12 },
  card: { width: 150, borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  thumb: { height: 96, justifyContent: "center", alignItems: "center" },
  thumbInner: {},
  playBubble: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(24,17,12,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardBody: { padding: 10 },
  cardName: { fontSize: 14, fontWeight: "700" },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 4 },
  cardAuthor: { fontSize: 12, flexShrink: 1 },
});
