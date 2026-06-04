import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import { Image, ImageBackground, Pressable, StyleSheet, Text, View } from "react-native";

import { useGetSharedMixes } from "@workspace/api-client-react";
import type { SharedMix } from "@workspace/api-client-react";

import { getMixImage } from "@/config/mix-images";
import { useColors } from "@/hooks/useColors";
import { resolveAvatarUrl } from "@/lib/avatar";

const MAX_VISIBLE = 5;

export function CommunityMixesCarousel() {
  const colors = useColors();
  const { data } = useGetSharedMixes();
  const mixes = data?.mixes ?? [];

  const [failedAvatars, setFailedAvatars] = useState<Record<number, boolean>>({});

  const handlePlay = useCallback((mix: SharedMix) => {
    router.push(`/mezcla/${mix.id}` as never);
  }, []);

  if (mixes.length === 0) return null;

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

      <View style={styles.list}>
        {visible.map((mix) => {
          const avatar = resolveAvatarUrl(mix.author.avatarUrl);
          return (
            <Pressable
              key={mix.id}
              onPress={() => handlePlay(mix)}
              style={({ pressed }) => [
                styles.row,
                { backgroundColor: "#151A23", opacity: pressed ? 0.75 : 1 },
              ]}
            >
              <ImageBackground
                source={getMixImage(mix.image ?? undefined)}
                style={styles.thumb}
                imageStyle={styles.thumbInner}
              >
                <View style={styles.playBubble}>
                  <Feather name="play" size={13} color="#FFFFFF" />
                </View>
              </ImageBackground>

              <View style={styles.meta}>
                <Text style={[styles.mixName, { color: colors.foreground }]} numberOfLines={1}>
                  {mix.name}
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

              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
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

  list: { gap: 10 },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    padding: 10,
  },
  thumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(190,150,80,0.15)",
  },
  thumbInner: { borderRadius: 10 },
  playBubble: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "rgba(24,17,12,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  meta: { flex: 1 },
  mixName: { fontSize: 14, fontWeight: "600", marginBottom: 3 },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  avatar: { width: 14, height: 14, borderRadius: 7 },
  authorName: { fontSize: 12, flexShrink: 1 },
});
