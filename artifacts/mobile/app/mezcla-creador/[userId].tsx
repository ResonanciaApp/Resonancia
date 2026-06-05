/**
 * Perfil del creador de mezclas de la comunidad.
 * ─────────────────────────────────────────────────────────────────
 * Se abre desde el menú contextual de una mezcla ("Ver perfil del
 * creador"). Lista todas las mezclas públicas de ese autor usando el
 * filtro `author` del endpoint GET /mixes.
 * ─────────────────────────────────────────────────────────────────
 */
import { Feather } from "@expo/vector-icons";
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

import { getSoundImage } from "@/config/sound-images";
import { useColors } from "@/hooks/useColors";
import { resolveAvatarUrl } from "@/lib/avatar";

const STACK_THUMB = 34;
const STACK_SHIFT = 21;
const STACK_MAX = 3;

function SoundStack({ sounds }: { sounds: SharedMix["sounds"] }) {
  if (!sounds || sounds.length === 0) return null;
  const visible = sounds.slice(0, STACK_MAX);
  return (
    <View style={[styles.stack, { width: STACK_THUMB + (visible.length - 1) * STACK_SHIFT }]}>
      {visible.map((s, i) => {
        const img = getSoundImage(s.id);
        return (
          <View
            key={`${s.id}-${i}`}
            style={[styles.stackThumb, { left: i * STACK_SHIFT, zIndex: visible.length - i }]}
          >
            {img ? (
              <ExpoImage source={img} style={styles.stackImg} contentFit="cover" />
            ) : (
              <View style={[styles.stackImg, { backgroundColor: "#1F2937" }]} />
            )}
          </View>
        );
      })}
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
  );
  const mixes = data?.mixes ?? [];
  const author = mixes[0]?.author;
  const displayName = author?.displayName ?? name ?? "Creador";
  const avatar = resolveAvatarUrl(author?.avatarUrl);
  const initial = displayName?.trim()?.[0]?.toUpperCase() ?? "·";
  const totalLikes = mixes.reduce((sum, m) => sum + m.likes, 0);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
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
          style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
        >
          <Feather name="chevron-left" size={22} color={colors.foreground} />
        </Pressable>

        {/* Perfil */}
        <View style={styles.profile}>
          {avatar ? (
            <ExpoImage
              source={{ uri: avatar }}
              style={[styles.avatar, { borderColor: colors.border }]}
              contentFit="cover"
            />
          ) : (
            <View style={[styles.avatar, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.avatarTxt, { color: colors.accent }]}>{initial}</Text>
            </View>
          )}
          <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
            {displayName}
          </Text>
          <Text style={[styles.stats, { color: colors.mutedForeground }]}>
            {mixes.length} mezcla{mixes.length !== 1 ? "s" : ""}
            {totalLikes > 0 ? ` · ${totalLikes} me gusta` : ""}
          </Text>
        </View>

        {/* Lista de mezclas */}
        {isLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: 40 }} />
        ) : mixes.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="music" size={28} color="rgba(190,150,80,0.35)" />
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
                  { backgroundColor: "rgba(255,255,255,0.05)", opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <SoundStack sounds={mix.sounds} />
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
    </View>
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
  avatarTxt: { fontSize: 34, fontWeight: "700" },
  name: { fontSize: 22, fontWeight: "800", letterSpacing: 0.3, marginTop: 6 },
  stats: { fontSize: 14 },
  empty: { alignItems: "center", gap: 10, marginTop: 48, paddingHorizontal: 20 },
  emptyText: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  list: { gap: 10 },
  sectionTitle: { fontSize: 17, fontWeight: "700", letterSpacing: 0.3, marginBottom: 4 },
  mixRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  stack: { height: STACK_THUMB, flexShrink: 0 },
  stackThumb: {
    position: "absolute",
    top: 0,
    width: STACK_THUMB,
    height: STACK_THUMB,
    borderRadius: STACK_THUMB / 2,
    borderWidth: 1.5,
    borderColor: "#0B0F14",
    overflow: "hidden",
  },
  stackImg: { width: "100%", height: "100%" },
  mixInfo: { flex: 1, minWidth: 0 },
  mixName: { fontSize: 15, fontWeight: "700" },
  mixMeta: { fontSize: 12, marginTop: 3 },
});
