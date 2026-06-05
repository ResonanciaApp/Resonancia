import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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

const CATEGORY_GRADIENTS: Record<string, readonly [string, string, string]> = {
  dormir:        ["#1e3a2a", "#0e1f15", "#0B0F14"],
  motivarme:     ["#2a2040", "#160d28", "#0B0F14"],
  concentracion: ["#1e2a3a", "#0f1520", "#0B0F14"],
};
const DEFAULT_GRADIENT: readonly [string, string, string] = ["#1a2030", "#0e141e", "#0B0F14"];

const CATEGORY_LABELS: Record<string, string> = {
  dormir:        "DESCANSO",
  motivarme:     "MEDITACIÓN",
  concentracion: "ENFOQUE",
};

const MAX_LIST = 3;

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

  const hero = mixes[0] ?? null;
  const listItems = mixes.slice(1, 1 + MAX_LIST);
  const remaining = mixes.length - 1 - listItems.length;

  // ── Helper: iniciales del autor ──────────────────────────────
  const initials = (name: string) =>
    name
      .split(" ")
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase() ?? "")
      .join("");

  return (
    <View style={styles.section}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Mezclas de la comunidad
        </Text>
        {mixes.length > 1 + MAX_LIST && (
          <Pressable onPress={() => router.push("/mezclas-comunidad" as never)} hitSlop={8}>
            <Text style={[styles.verTodas, { color: colors.primary }]}>Ver todos</Text>
          </Pressable>
        )}
      </View>

      {/* Empty state */}
      {mixes.length === 0 && (
        <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
          <Feather name="music" size={28} color="rgba(190,150,80,0.35)" />
          <Text style={styles.emptyText}>Aún no hay mezclas compartidas</Text>
          <Text style={styles.emptySub}>Sé el primero en compartir tu ambiente sonoro</Text>
        </View>
      )}

      {/* ── Hero card ── */}
      {hero && (() => {
        const heroImage = getMixImage(hero.image ?? undefined);
        const grad = CATEGORY_GRADIENTS[hero.category] ?? DEFAULT_GRADIENT;
        const heroAvatar = resolveAvatarUrl(hero.author.avatarUrl);
        const isLoaded = loadedPresetId === `community-${hero.id}`;
        const catLabel = CATEGORY_LABELS[hero.category] ?? hero.category.toUpperCase();

        return (
          <Pressable
            onPress={() => handlePlay(hero)}
            style={({ pressed }) => [styles.heroCard, { opacity: pressed ? 0.88 : 1 }]}
          >
            {/* Background */}
            {heroImage ? (
              <ExpoImage
                source={heroImage}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
              />
            ) : (
              <LinearGradient
                colors={grad as unknown as [string, string, string]}
                style={StyleSheet.absoluteFill}
                start={{ x: 0.15, y: 0 }}
                end={{ x: 1, y: 1 }}
              />
            )}

            {/* Bottom overlay */}
            <LinearGradient
              colors={["transparent", "rgba(11,15,20,0.92)"]}
              style={StyleSheet.absoluteFill}
              start={{ x: 0, y: 0.35 }}
              end={{ x: 0, y: 1 }}
              pointerEvents="none"
            />

            {/* Category badge */}
            <View style={styles.catBadge}>
              <Text style={[styles.catBadgeText, { color: colors.primary }]}>{catLabel}</Text>
            </View>

            {/* Sounds badge */}
            <View style={styles.soundsBadge}>
              <Text style={styles.soundsBadgeText}>🎵 {hero.sounds.length} sonidos</Text>
            </View>

            {/* Active dot */}
            {isLoaded && (
              <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
            )}

            {/* Bottom content */}
            <View style={styles.heroBottom}>
              <Text style={styles.heroName} numberOfLines={2}>{hero.name}</Text>
              <View style={styles.heroMeta}>
                <View style={styles.heroAuthorRow}>
                  {heroAvatar && !failedAvatars[hero.id] ? (
                    <Image
                      source={{ uri: heroAvatar }}
                      style={[styles.heroAvatar, { backgroundColor: colors.border }]}
                      onError={() => setFailedAvatars((p) => ({ ...p, [hero.id]: true }))}
                    />
                  ) : (
                    <View style={styles.heroAvatarFallback}>
                      <Text style={[styles.heroAvatarInitials, { color: colors.primary }]}>
                        {initials(hero.author.displayName)}
                      </Text>
                    </View>
                  )}
                  <Text style={styles.heroAuthorName} numberOfLines={1}>
                    {hero.author.displayName}
                  </Text>
                </View>

                {/* Play button */}
                <View style={[styles.heroPlayBtn, { backgroundColor: colors.primary }]}>
                  <View style={styles.playTriangle} />
                </View>
              </View>
            </View>
          </Pressable>
        );
      })()}

      {/* ── Compact list ── */}
      {listItems.length > 0 && (
        <View style={styles.list}>
          {listItems.map((mix) => {
            const image = getMixImage(mix.image ?? undefined);
            const avatar = resolveAvatarUrl(mix.author.avatarUrl);
            const isLoaded = loadedPresetId === `community-${mix.id}`;
            const grad = CATEGORY_GRADIENTS[mix.category] ?? DEFAULT_GRADIENT;

            return (
              <Pressable
                key={mix.id}
                onPress={() => handlePlay(mix)}
                style={({ pressed }) => [styles.row, { opacity: pressed ? 0.72 : 1 }]}
              >
                {/* Thumbnail */}
                <View style={styles.thumbWrap}>
                  {image ? (
                    <ExpoImage
                      source={image}
                      style={StyleSheet.absoluteFill}
                      contentFit="cover"
                    />
                  ) : (
                    <LinearGradient
                      colors={grad as unknown as [string, string]}
                      style={StyleSheet.absoluteFill}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                    />
                  )}
                </View>

                <View style={styles.meta}>
                  <Text style={[styles.mixName, { color: colors.foreground }]} numberOfLines={1}>
                    {mix.name}
                  </Text>
                  <Text style={[styles.soundCount, { color: colors.mutedForeground }]}>
                    Pista con {mix.sounds.length} {mix.sounds.length === 1 ? "sonido" : "sonidos"}
                  </Text>
                  <View style={styles.authorRow}>
                    {avatar && !failedAvatars[mix.id] ? (
                      <Image
                        source={{ uri: avatar }}
                        style={[styles.avatar, { backgroundColor: colors.border }]}
                        onError={() => setFailedAvatars((p) => ({ ...p, [mix.id]: true }))}
                      />
                    ) : (
                      <Feather name="user" size={11} color={colors.mutedForeground} />
                    )}
                    <Text style={[styles.authorName, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {mix.author.displayName}
                    </Text>
                  </View>
                </View>

                {isLoaded && (
                  <View style={[styles.rowActiveDot, { backgroundColor: colors.primary }]} />
                )}
              </Pressable>
            );
          })}
        </View>
      )}

      {/* Ver más */}
      {remaining > 0 && (
        <Pressable
          onPress={() => router.push("/mezclas-comunidad" as never)}
          style={({ pressed }) => [
            styles.verMasBtn,
            {
              borderColor: "rgba(190,150,80,0.2)",
              opacity: pressed ? 0.7 : 1,
            },
          ]}
        >
          <Text style={[styles.verMasText, { color: colors.mutedForeground }]}>
            Ver los {mixes.length} ambientes de la comunidad →
          </Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { paddingHorizontal: 20 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
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

  // ── Hero ──
  heroCard: {
    height: 190,
    borderRadius: 18,
    overflow: "hidden",
    marginBottom: 16,
    position: "relative",
  },
  catBadge: {
    position: "absolute",
    top: 14,
    left: 14,
    backgroundColor: "rgba(190,150,80,0.2)",
    borderWidth: 1,
    borderColor: "rgba(190,150,80,0.3)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  catBadgeText: { fontSize: 9, fontWeight: "700", letterSpacing: 1.2 },
  soundsBadge: {
    position: "absolute",
    top: 14,
    right: 14,
    backgroundColor: "rgba(11,15,20,0.65)",
    borderWidth: 1,
    borderColor: "rgba(237,225,211,0.15)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },
  soundsBadgeText: { color: "#7A8FA8", fontSize: 10 },
  activeDot: {
    position: "absolute",
    top: 14,
    left: "50%",
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  heroBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
    gap: 6,
  },
  heroName: { color: "#EDE1D3", fontSize: 17, fontWeight: "700", lineHeight: 22 },
  heroMeta: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  heroAuthorRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  heroAvatar: { width: 22, height: 22, borderRadius: 11 },
  heroAvatarFallback: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "rgba(190,150,80,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroAvatarInitials: { fontSize: 9, fontWeight: "700" },
  heroAuthorName: { color: "#7A8FA8", fontSize: 12 },
  heroPlayBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderTopWidth: 7,
    borderBottomWidth: 7,
    borderLeftWidth: 12,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "#0B0F14",
    marginLeft: 2,
  },

  // ── List ──
  list: { gap: 14, marginBottom: 16 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  thumbWrap: {
    width: 56,
    height: 56,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(190,150,80,0.1)",
    flexShrink: 0,
  },
  meta: { flex: 1, gap: 2 },
  mixName: { fontSize: 14, fontWeight: "600" },
  soundCount: { fontSize: 11, fontWeight: "500" },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  avatar: { width: 14, height: 14, borderRadius: 7 },
  authorName: { fontSize: 11, flexShrink: 1 },
  rowActiveDot: { width: 8, height: 8, borderRadius: 4, flexShrink: 0 },

  // Ver más
  verMasBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  verMasText: { fontSize: 13 },
});
