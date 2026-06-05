import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { Image as ExpoImage } from "expo-image";

import { useGetSharedMixes } from "@workspace/api-client-react";
import type { SharedMix } from "@workspace/api-client-react";

import { getMixImage } from "@/config/mix-images";
import { type MixPreset, useMixer } from "@/context/MixerContext";
import { type MixCategory } from "@/data/mix-categories";
import { useColors } from "@/hooks/useColors";
import { useLoadMix } from "@/hooks/useLoadMix";
import { resolveAvatarUrl } from "@/lib/avatar";

const MAX_VISIBLE = 5;

export function CommunityMixesCarousel() {
  const colors = useColors();
  const { data } = useGetSharedMixes();
  const mixes = data?.mixes ?? [];
  const loadMix = useLoadMix();
  const { loadedPresetId } = useMixer();

  const [failedAvatars, setFailedAvatars] = useState<Record<number, boolean>>({});

  const handlePlay = useCallback(
    (mix: SharedMix) => {
      const presetId = `community-${mix.id}`;
      const preset: MixPreset = {
        id: presetId,
        name: mix.name,
        description: mix.description ?? undefined,
        image: mix.image ?? undefined,
        category: mix.category as MixCategory,
        sounds: mix.sounds.map((s) => ({ id: s.id, volume: s.volume })),
        createdAt: mix.createdAt,
      };
      loadMix(preset);
    },
    [loadMix],
  );

  const visible = mixes.slice(0, MAX_VISIBLE);
  const hasMore = mixes.length > MAX_VISIBLE;

  return (
    <View style={styles.section}>
      <View style={styles.sectionRow}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Mezclas de la comunidad
        </Text>
        {hasMore && (
          <Pressable onPress={() => router.push("/mezclas-comunidad" as never)} hitSlop={8}>
            <Text style={[styles.verTodas, { color: colors.primary }]}>Ver todos</Text>
          </Pressable>
        )}
      </View>

      {mixes.length === 0 && (
        <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
          <Feather name="music" size={28} color="rgba(190,150,80,0.35)" />
          <Text style={styles.emptyText}>Aún no hay mezclas compartidas</Text>
          <Text style={styles.emptySub}>Sé el primero en compartir tu ambiente sonoro</Text>
        </View>
      )}

      <View style={styles.list}>
        {visible.map((mix) => {
          const avatar = resolveAvatarUrl(mix.author.avatarUrl);
          const isLoaded = loadedPresetId === `community-${mix.id}`;
          const soundCount = mix.sounds.length;

          return (
            <Pressable
              key={mix.id}
              onPress={() => handlePlay(mix)}
              style={({ pressed }) => [
                styles.row,
                { opacity: pressed ? 0.72 : 1 },
              ]}
            >
              {/* Thumbnail sin botón play */}
              <ExpoImage
                source={getMixImage(mix.image ?? undefined)}
                style={styles.thumb}
                contentFit="cover"
              />

              <View style={styles.meta}>
                <Text style={[styles.mixName, { color: colors.foreground }]} numberOfLines={1}>
                  {mix.name}
                </Text>
                <Text style={[styles.soundCount, { color: colors.mutedForeground }]}>
                  Pista con {soundCount} {soundCount === 1 ? "sonido" : "sonidos"}
                </Text>
                <View style={styles.authorRow}>
                  {avatar && !failedAvatars[mix.id] ? (
                    <Image
                      source={{ uri: avatar }}
                      style={[styles.avatar, { backgroundColor: colors.border }]}
                      onError={() =>
                        setFailedAvatars((prev) => ({ ...prev, [mix.id]: true }))
                      }
                    />
                  ) : (
                    <Feather name="user" size={11} color={colors.mutedForeground} />
                  )}
                  <Text style={[styles.authorName, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {mix.author.displayName}
                  </Text>
                </View>
              </View>

              {/* Indicador de mezcla activa */}
              {isLoaded && (
                <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 20 },
  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 11,
  },
  sectionTitle: { fontSize: 20, fontWeight: "700", letterSpacing: 0.3 },
  verTodas: { fontSize: 13, fontWeight: "500" },

  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 6,
    borderRadius: 14,
  },
  emptyText: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
  emptySub: { fontSize: 12, color: "#7A8FA8", textAlign: "center", paddingHorizontal: 20 },

  list: { gap: 14 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "rgba(190,150,80,0.12)",
  },
  meta: { flex: 1, gap: 2 },
  mixName: { fontSize: 14, fontWeight: "600" },
  soundCount: { fontSize: 11, fontWeight: "500" },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  avatar: { width: 14, height: 14, borderRadius: 7 },
  authorName: { fontSize: 11, flexShrink: 1 },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    flexShrink: 0,
  },
});
