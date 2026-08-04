/**
 * Mezclas del creador — pantalla pública.
 * Se abre desde el menú contextual de una mezcla ("Ver mezclas del creador").
 * Lista todas las mezclas públicas de ese autor usando el filtro `author`.
 */
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import { Image as ExpoImage } from "expo-image";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGetSharedMixes } from "@workspace/api-client-react";
import type { SharedMix } from "@workspace/api-client-react";

import { MIX_CATEGORIES } from "@/data/mix-categories";
import { useColors } from "@/hooks/useColors";
import { resolveAvatarUrl } from "@/lib/avatar";

const BG_GRADIENT = ["#340D1A", "#190913"] as const;
const COVER_SIZE = 46;
const GOLD = "#dad4ec";

function CategoryCover({ category }: { category?: string | null }) {
  const catMeta = category ? MIX_CATEGORIES.find((c) => c.id === category) : undefined;
  if (catMeta) {
    return (
      <ExpoImage
        source={catMeta.image as number}
        style={styles.cover}
        contentFit="cover"
      />
    );
  }
  return (
    <View style={[styles.cover, styles.coverFallback]}>
      <Feather name="music" size={18} color="rgba(212,175,55,0.55)" />
    </View>
  );
}

export default function CreatorProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userId, name } = useLocalSearchParams<{ userId: string; name?: string }>();
  const authorId = Number(userId);

  const { data, isLoading } = useGetSharedMixes(
    Number.isFinite(authorId) ? { author: authorId } : undefined,
    { query: { refetchOnMount: "always" } },
  );
  const mixes = data?.mixes ?? [];
  const author = mixes[0]?.author;
  const displayName = author?.displayName ?? name ?? "Creador";
  const avatar = resolveAvatarUrl(author?.avatarUrl);
  const initial = displayName?.trim()?.[0]?.toUpperCase() ?? "·";
  const totalLikes = mixes.reduce((sum, m) => sum + m.likes, 0);

  return (
    <LinearGradient colors={BG_GRADIENT} style={styles.root}>
      <ScrollView
        contentContainerStyle={{
          paddingTop: insets.top + 8,
          paddingBottom: insets.bottom + 28,
          paddingHorizontal: 24,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header con botón volver */}
        <Pressable
          onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/explore" as never))}
          hitSlop={12}
          style={[styles.backBtn, { backgroundColor: "rgba(74,12,12,0.25)", borderColor: colors.border }]}
        >
          <Feather name="chevron-left" size={22} color={colors.foreground} />
        </Pressable>

        {/* Perfil */}
        <View style={styles.profile}>
          <Pressable
            onPress={() => router.push(`/usuario/${authorId}` as never)}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            {avatar ? (
              <ExpoImage
                source={{ uri: avatar }}
                style={[styles.avatar, { borderColor: colors.border }]}
                contentFit="cover"
              />
            ) : (
              <View style={[styles.avatar, { backgroundColor: "rgba(74,12,12,0.35)", borderColor: colors.border }]}>
                <Text style={[styles.avatarTxt, { color: GOLD }]}>{initial}</Text>
              </View>
            )}
          </Pressable>
          <Pressable
            onPress={() => router.push(`/usuario/${authorId}` as never)}
            style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
          >
            <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
              {displayName}
            </Text>
          </Pressable>
          <Text style={[styles.stats, { color: colors.mutedForeground }]}>
            {mixes.length} mezcla{mixes.length !== 1 ? "s" : ""}
            {totalLikes > 0 ? ` · ${totalLikes} me gusta` : ""}
          </Text>
        </View>

        {/* Lista de mezclas */}
        {isLoading ? (
          <ActivityIndicator color={GOLD} style={{ marginTop: 40 }} />
        ) : mixes.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="music" size={28} color="rgba(212,175,55,0.35)" />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              Este creador todavía no tiene mezclas públicas.
            </Text>
          </View>
        ) : (
          <View style={styles.list}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Sus mezclas</Text>
            {mixes.map((mix) => (
              <Pressable
                key={mix.id}
                onPress={() =>
                  router.push({ pathname: "/mezcla/[id]", params: { id: String(mix.id) } } as never)
                }
                style={({ pressed }) => [
                  styles.mixRow,
                  { backgroundColor: "rgba(74,12,12,0.20)", opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <CategoryCover category={mix.category} />
                <View style={styles.mixInfo}>
                  <Text style={[styles.mixName, { color: colors.foreground }]} numberOfLines={1}>
                    {mix.name}
                  </Text>
                  <Text style={[styles.mixMeta, { color: colors.mutedForeground }]}>
                    {mix.sounds.length} sonido{mix.sounds.length !== 1 ? "s" : ""}
                    {mix.likes > 0 ? ` · ${mix.likes} me gusta` : ""}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color="rgba(255,255,255,0.25)" />
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  profile: { alignItems: "center", marginTop: 18, marginBottom: 28, gap: 8 },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTxt: { fontFamily: "Manrope", fontSize: 34, fontWeight: "700" },
  name: { fontFamily: "Manrope", fontSize: 22, fontWeight: "800", letterSpacing: 0.3, marginTop: 6 },
  stats: { fontFamily: "Manrope", fontSize: 14 },
  empty: { alignItems: "center", gap: 10, marginTop: 48, paddingHorizontal: 20 },
  emptyText: { fontFamily: "Manrope", fontSize: 14, textAlign: "center", lineHeight: 20 },
  list: { gap: 10 },
  sectionTitle: { fontFamily: "Manrope", fontSize: 20, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },
  mixRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  cover: {
    width: COVER_SIZE,
    height: COVER_SIZE,
    borderRadius: 10,
    overflow: "hidden",
    flexShrink: 0,
  },
  coverFallback: {
    backgroundColor: "rgba(212,175,55,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  mixInfo: { flex: 1, minWidth: 0 },
  mixName: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700" },
  mixMeta: { fontFamily: "Manrope", fontSize: 12, marginTop: 3 },
});
