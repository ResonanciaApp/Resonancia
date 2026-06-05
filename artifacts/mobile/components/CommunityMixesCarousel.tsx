import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image as ExpoImage } from "expo-image";

import { useGetSharedMixes } from "@workspace/api-client-react";
import type { SharedMix } from "@workspace/api-client-react";

import { getMixImage } from "@/config/mix-images";
import { type MixPreset, useMixer } from "@/context/MixerContext";
import { MIX_CATEGORIES, type MixCategory } from "@/data/mix-categories";
import { useColors } from "@/hooks/useColors";
import { useLoadMix } from "@/hooks/useLoadMix";

const CARD_W = 172;
const CARD_H = 210;

const CATEGORY_GRADIENTS: Record<string, [string, string]> = {
  dormir:        ["#1a3040", "#0d1820"],
  motivarme:     ["#2a2040", "#110d20"],
  concentracion: ["#1e3428", "#0d1a10"],
};
const DEFAULT_GRADIENT: [string, string] = ["#1a2030", "#0d1218"];

const MAX_VISIBLE = 8;

type ChipId = "todos" | MixCategory;

export function CommunityMixesCarousel() {
  const colors = useColors();
  const { data } = useGetSharedMixes();
  const allMixes = data?.mixes ?? [];
  const loadMix = useLoadMix();
  const { loadedPresetId } = useMixer();

  const [activeChip, setActiveChip] = useState<ChipId>("todos");
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

  const filtered =
    activeChip === "todos"
      ? allMixes
      : allMixes.filter((m) => m.category === activeChip);

  const visible = filtered.slice(0, MAX_VISIBLE);
  const remaining = filtered.length - visible.length;

  // Stats
  const uniqueCreators = new Set(allMixes.map((m) => m.author.displayName)).size;
  const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const thisWeek = allMixes.filter((m) => new Date(m.createdAt).getTime() > oneWeekAgo).length;

  return (
    <View style={styles.section}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Mezclas de la comunidad
        </Text>
        {allMixes.length > MAX_VISIBLE && (
          <Pressable onPress={() => router.push("/mezclas-comunidad" as never)} hitSlop={8}>
            <Text style={[styles.verTodas, { color: colors.primary }]}>Ver todos</Text>
          </Pressable>
        )}
      </View>

      {/* Filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipsScroll}
        contentContainerStyle={styles.chipsContent}
      >
        {([{ id: "todos", label: "Todos" }, ...MIX_CATEGORIES.map((c) => ({ id: c.id, label: c.label }))] as { id: ChipId; label: string }[]).map(
          (chip) => {
            const active = activeChip === chip.id;
            return (
              <Pressable
                key={chip.id}
                onPress={() => setActiveChip(chip.id)}
                style={[
                  styles.chip,
                  {
                    backgroundColor: active ? "rgba(190,150,80,0.18)" : "rgba(255,255,255,0.06)",
                    borderColor: active ? "rgba(190,150,80,0.5)" : "rgba(255,255,255,0.09)",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipLabel,
                    { color: active ? colors.primary : colors.mutedForeground, fontWeight: active ? "600" : "400" },
                  ]}
                >
                  {chip.label}
                </Text>
              </Pressable>
            );
          },
        )}
      </ScrollView>

      {/* Empty state */}
      {allMixes.length === 0 && (
        <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
          <Feather name="music" size={28} color="rgba(190,150,80,0.35)" />
          <Text style={styles.emptyText}>Aún no hay mezclas compartidas</Text>
          <Text style={styles.emptySub}>Sé el primero en compartir tu ambiente sonoro</Text>
        </View>
      )}

      {/* Cards carousel */}
      {visible.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.cardsScroll}
          contentContainerStyle={styles.cardsContent}
        >
          {visible.map((mix) => {
            const isLoaded = loadedPresetId === `community-${mix.id}`;
            const soundCount = mix.sounds.length;
            const image = getMixImage(mix.image ?? undefined);
            const grad = CATEGORY_GRADIENTS[mix.category] ?? DEFAULT_GRADIENT;

            return (
              <Pressable
                key={mix.id}
                onPress={() => handlePlay(mix)}
                style={({ pressed }) => [styles.card, { opacity: pressed ? 0.82 : 1 }]}
              >
                {/* Background: image or gradient */}
                {image ? (
                  <ExpoImage
                    source={image}
                    style={StyleSheet.absoluteFill}
                    contentFit="cover"
                  />
                ) : (
                  <View style={[StyleSheet.absoluteFill, { backgroundColor: grad[1] }]} />
                )}

                {/* Wave decoration */}
                <View style={styles.waveContainer} pointerEvents="none">
                  {[10, 20, 32, 22, 12, 18, 28, 16, 10].map((h, j) => (
                    <View
                      key={j}
                      style={[styles.waveBar, { height: h }]}
                    />
                  ))}
                </View>

                {/* Bottom gradient overlay */}
                <LinearGradient
                  colors={["transparent", "rgba(11,15,20,0.92)"]}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0.35 }}
                  end={{ x: 0, y: 1 }}
                  pointerEvents="none"
                />

                {/* Sound count badge */}
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{soundCount} son.</Text>
                </View>

                {/* Active indicator */}
                {isLoaded && (
                  <View style={[styles.activeDot, { backgroundColor: colors.primary }]} />
                )}

                {/* Play button */}
                <View style={styles.playBtn}>
                  <View style={[styles.playCircle, { backgroundColor: colors.primary }]}>
                    <View style={styles.playTriangle} />
                  </View>
                </View>

                {/* Info overlay */}
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName} numberOfLines={1}>{mix.name}</Text>
                  <View style={styles.cardMeta}>
                    <Text style={styles.cardAuthor} numberOfLines={1}>{mix.author.displayName}</Text>
                  </View>
                </View>
              </Pressable>
            );
          })}

          {/* Peek card */}
          {remaining > 0 && (
            <Pressable
              onPress={() => router.push("/mezclas-comunidad" as never)}
              style={[styles.peekCard, { backgroundColor: "rgba(21,26,35,0.6)", borderColor: "rgba(190,150,80,0.1)" }]}
            >
              <Text style={[styles.peekArrow, { color: colors.mutedForeground }]}>›</Text>
              <Text style={[styles.peekLabel, { color: colors.mutedForeground }]}>{remaining}{"\n"}más</Text>
            </Pressable>
          )}
        </ScrollView>
      )}

      {/* Stats row */}
      {allMixes.length > 0 && (
        <View style={[styles.statsRow, { backgroundColor: "rgba(190,150,80,0.06)", borderColor: "rgba(190,150,80,0.12)" }]}>
          {[
            { label: "Mezclas", value: String(allMixes.length) },
            { label: "Creadores", value: String(uniqueCreators) },
            { label: "Esta semana", value: thisWeek > 0 ? `+${thisWeek}` : "—" },
          ].map((stat) => (
            <View key={stat.label} style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
            </View>
          ))}
        </View>
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

  // Chips
  chipsScroll: { marginHorizontal: -20, marginBottom: 14 },
  chipsContent: { paddingHorizontal: 20, gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  chipLabel: { fontSize: 12 },

  // Empty
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 6,
    borderRadius: 14,
  },
  emptyText: { fontSize: 14, fontWeight: "600", color: "#FFFFFF" },
  emptySub: { fontSize: 12, color: "#7A8FA8", textAlign: "center", paddingHorizontal: 20 },

  // Cards carousel
  cardsScroll: { marginHorizontal: -20, marginBottom: 14 },
  cardsContent: { paddingHorizontal: 20, gap: 10 },

  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 18,
    overflow: "hidden",
    position: "relative",
  },

  // Wave decoration
  waveContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    opacity: 0.2,
  },
  waveBar: {
    width: 4,
    borderRadius: 2,
    backgroundColor: "#BE9650",
    marginHorizontal: 2,
  },

  // Badge
  badge: {
    position: "absolute",
    top: 10,
    right: 10,
    backgroundColor: "rgba(11,15,20,0.7)",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  badgeText: { color: "#7A8FA8", fontSize: 10 },

  // Active dot
  activeDot: {
    position: "absolute",
    top: 10,
    left: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // Play button
  playBtn: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 52,
    alignItems: "center",
    justifyContent: "center",
  },
  playCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  playTriangle: {
    width: 0,
    height: 0,
    borderTopWidth: 8,
    borderBottomWidth: 8,
    borderLeftWidth: 13,
    borderTopColor: "transparent",
    borderBottomColor: "transparent",
    borderLeftColor: "#0B0F14",
    marginLeft: 3,
  },

  // Info overlay
  cardInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 12,
    paddingBottom: 10,
    gap: 2,
  },
  cardName: { color: "#EDE1D3", fontSize: 12, fontWeight: "700" },
  cardMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardAuthor: { color: "#7A8FA8", fontSize: 10, flex: 1 },

  // Peek card
  peekCard: {
    width: 56,
    height: CARD_H,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
  },
  peekArrow: { fontSize: 22, lineHeight: 24 },
  peekLabel: { fontSize: 9, textAlign: "center", lineHeight: 13 },

  // Stats
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
  },
  statItem: { alignItems: "center" },
  statValue: { fontSize: 16, fontWeight: "700" },
  statLabel: { fontSize: 10, marginTop: 2 },
});
