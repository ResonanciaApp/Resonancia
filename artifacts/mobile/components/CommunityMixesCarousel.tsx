/**
 * CommunityMixesCarousel — sección "Mezclas de la comunidad"
 * Diseño V2D (minimalista líneas): ranking, nombre, autor, 3-dot menu.
 * Tabs = píldoras (mismo diseño que "Mi Música").
 */
import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useQueryClient } from "@tanstack/react-query";
import {
  useGetSharedMixes,
  useToggleSharedMixLike,
  useReportSharedMix,
  getGetSharedMixesQueryKey,
} from "@workspace/api-client-react";
import type { SharedMix, SharedMixesPage } from "@workspace/api-client-react";
import { getMixImage } from "@/config/mix-images";

import { resolveAvatarUrl } from "@/lib/avatar";
import { useColors } from "@/hooks/useColors";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useAuth } from "@/context/AuthContext";


import { Dimensions } from "react-native";

const GOLD = "#F9F9F9";
const STACK_THUMB = 93;
const MAX_VISIBLE = 5;
const GRID_GAP = 10;
const CELL_W = (Dimensions.get("window").width - 40 - GRID_GAP * 2) / 3;

const DEFAULT_COVER: [string, string] = ["#1B060F", "#2E0A18"];

// ── Componente principal ───────────────────────────────────────────
export function CommunityMixesCarousel() {
  const colors = useColors();
  const { data } = useGetSharedMixes();
  const allMixes = data?.mixes ?? [];
  const { isSignedIn } = useAuth();
  const queryClient = useQueryClient();
  const toggleLike = useToggleSharedMixLike();
  const pendingLike = useRef<Record<number, boolean>>({});


  const sorted = [...allMixes].sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));
  const visible = sorted.slice(0, MAX_VISIBLE);
  const remaining = sorted.length - visible.length;

  // ── Like toggle ───────────────────────────────────────────────
  const applyOptimistic = useCallback(
    (mixId: number, liked: boolean) => {
      queryClient.setQueryData<SharedMixesPage>(getGetSharedMixesQueryKey(), (prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          mixes: prev.mixes.map((m) =>
            m.id === mixId
              ? { ...m, likedByMe: liked, likes: Math.max(0, m.likes + (liked ? 1 : -1)) }
              : m,
          ),
        };
      });
    },
    [queryClient],
  );

  const handleLike = useCallback(
    (mix: SharedMix) => {
      if (!isSignedIn) {
        Alert.alert(
          "Crea tu cuenta",
          "Necesitas una cuenta para dar me gusta a las mezclas de la comunidad.",
          [
            { text: "Ahora no", style: "cancel" },
            { text: "Registrarme", onPress: () => router.push("/(auth)/sign-up" as never) },
          ],
        );
        return;
      }
      if (pendingLike.current[mix.id]) return;
      pendingLike.current[mix.id] = true;
      const nextLiked = !mix.likedByMe;
      applyOptimistic(mix.id, nextLiked);
      toggleLike.mutate(
        { id: mix.id },
        {
          onError: () => applyOptimistic(mix.id, !nextLiked),
          onSettled: () => { pendingLike.current[mix.id] = false; },
          onSuccess: (updated) => {
            queryClient.setQueryData<SharedMixesPage>(getGetSharedMixesQueryKey(), (prev) => {
              if (!prev) return prev;
              return {
                ...prev,
                mixes: prev.mixes.map((m) =>
                  m.id === updated.id
                    ? { ...m, likes: updated.likes, likedByMe: updated.likedByMe }
                    : m,
                ),
              };
            });
          },
        },
      );
    },
    [isSignedIn, applyOptimistic, toggleLike, queryClient],
  );

  const handleViewCreator = useCallback((mix: SharedMix) => {
    router.push({
      pathname: "/mezcla-creador/[userId]",
      params: { userId: String(mix.author.id), name: mix.author.displayName },
    } as never);
  }, []);

  const handleOpenMix = useCallback((mix: SharedMix) => {
    router.push({ pathname: "/mezcla/[id]", params: { id: String(mix.id) } } as never);
  }, []);

  // ── Render ────────────────────────────────────────────────────
  return (
    <View style={styles.section}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: "#FFFFFF" }]}>
          Top 5 Mezclas
        </Text>
        <Pressable
          onPress={() => router.push("/mezclas-comunidad" as never)}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Text style={styles.verTodas}>Ver todos</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
      {/* Empty state */}
      {visible.length === 0 && (
        <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
          <Feather name="music" size={28} color="rgba(212,175,55,0.35)" />
          <Text style={[styles.emptyText, { color: colors.foreground }]}>
            Aún no hay mezclas compartidas
          </Text>
          <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
            Sé el primero en compartir tu ambiente sonoro
          </Text>
        </View>
      )}

      {/* ── Lista vertical ── */}
      {visible.length > 0 && (
        <View style={styles.listWrap}>
          {visible.map((mix) => (
            <MixRow
              key={mix.id}
              mix={mix}
              colors={colors}
              onPress={() => handleOpenMix(mix)}
              onDotsPress={() => {}}
              onAuthorPress={() => handleViewCreator(mix)}
              favorited={(mix.likedByMe ?? false) || (mix.likes ?? 0) > 0}
              onHeartPress={() => handleLike(mix)}
            />
          ))}
        </View>
      )}

      </View>

    </View>
  );
}

// ── Corazón animado ───────────────────────────────────────────────
function AnimatedHeart({ favorited, onPress }: { favorited: boolean; onPress: () => void }) {
  const scale = useRef(new Animated.Value(1)).current;
  const { theme: heartTheme } = useSceneTheme();
  const heartFill = heartTheme.id === "tibet" ? "#F9F9F9" : "#BEA3E6";

  const handlePress = () => {
    onPress();
    scale.setValue(1);
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.35, duration: 120, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 3, tension: 140, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Pressable onPress={handlePress} hitSlop={10} style={styles.heartBtn}>
      <Animated.View style={{ transform: [{ scale }] }}>
        {favorited ? (
          <Ionicons name="heart" size={18} color={heartFill} />
        ) : (
          <Ionicons name="heart-outline" size={18} color="#f9f9f9" />
        )}
      </Animated.View>
    </Pressable>
  );
}

// ── Fila de mezcla (V2D) ───────────────────────────────────────────
export type Colors = ReturnType<typeof import("@/hooks/useColors").useColors>;

export function MixRow({
  mix,
  colors,
  onPress,
  onDotsPress,
  onAuthorPress,
  favorited,
  onHeartPress,
}: {
  mix: SharedMix;
  colors: Colors;
  onPress: () => void;
  onDotsPress: () => void;
  onAuthorPress: () => void;
  favorited?: boolean;
  onHeartPress?: () => void;
}) {
  const trending = mix.trending === true;
  const avatarUri = resolveAvatarUrl(mix.author.avatarUrl ?? null);
  const initial = mix.author.displayName?.trim()?.[0]?.toUpperCase() ?? "·";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
    >
      {/* Portada de la mezcla */}
      <MixCover image={mix.image} />

      {/* Info */}
      <View style={styles.info}>
        {/* Título */}
        <View style={styles.nameRow}>
          <Text
            style={[styles.mixName, { color: colors.foreground }]}
            numberOfLines={1}
          >
            {mix.name}
          </Text>
          {trending && (
            <View style={styles.trendBadge}>
              <Text style={[styles.trendText, { color: GOLD }]}>↑</Text>
            </View>
          )}
        </View>
        {/* Autor — debajo del título */}
        <Pressable
          onPress={onAuthorPress}
          hitSlop={6}
          style={styles.authorRow}
        >
          <Text style={[styles.mixCreator, { color: colors.mutedForeground }]} numberOfLines={1}>
            {mix.author.displayName}
          </Text>
        </Pressable>
      </View>

      {/* Likes */}
      {mix.likes > 0 && (
        <Text style={styles.likeCount}>{mix.likes}</Text>
      )}

      {/* Corazón animado */}
      <AnimatedHeart
        favorited={favorited ?? false}
        onPress={onHeartPress ?? (() => {})}
      />

    </Pressable>
  );
}

// ── Celda de grilla 3×3 ────────────────────────────────────────────
function MixGridCell({
  mix,
  colors,
  onPress,
  onLongPress,
}: {
  mix: SharedMix;
  colors: Colors;
  onPress: () => void;
  onLongPress: () => void;
}) {
  const resolvedImg = mix.image ? getMixImage(mix.image) : undefined;

  return (
    <Pressable
      onPress={onPress}
      onLongPress={onLongPress}
      style={({ pressed }) => [styles.gridCell, { opacity: pressed ? 0.6 : 1 }]}
    >
      {resolvedImg ? (
        <ExpoImage source={resolvedImg as number} style={styles.gridCover} contentFit="cover" />
      ) : (
        <LinearGradient
          colors={DEFAULT_COVER}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gridCover, { alignItems: "center", justifyContent: "center" }]}
        >
          <Feather name="music" size={20} color="rgba(212,175,55,0.55)" />
        </LinearGradient>
      )}
      <View style={styles.gridAuthorRow}>
        <Text style={[styles.gridAuthorName, { color: colors.foreground }]} numberOfLines={1}>
          {mix.author.displayName}
        </Text>
      </View>
    </Pressable>
  );
}

// ── Portada de la mezcla ───────────────────────────────────────────
function MixCover({ image }: { image?: string | null }) {
  const resolvedImg = image ? getMixImage(image) : undefined;

  return (
    <View style={styles.avatarWrap}>
      {resolvedImg ? (
        <ExpoImage
          source={resolvedImg as number}
          style={styles.coverImg}
          contentFit="cover"
        />
      ) : (
        <LinearGradient
          colors={DEFAULT_COVER}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.coverImg}
        >
          <Feather name="music" size={20} color="rgba(212,175,55,0.55)" />
        </LinearGradient>
      )}
    </View>
  );
}

// ── Menú contextual (3 puntitos) ───────────────────────────────────
export function MixContextMenu({
  mix,
  onClose,
  onViewCreator,
  colors,
}: {
  mix: SharedMix | null;
  onClose: () => void;
  onViewCreator: (mix: SharedMix) => void;
  colors: Colors;
}) {
  const insets = useSafeAreaInsets();
  const { theme } = useSceneTheme();
  const sheetBg = theme.gradient[0] as string;
  const reportMix = useReportSharedMix();

  if (!mix) return null;

  return (
    <Modal
      visible={!!mix}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.55)" }]} onPress={onClose} />

      <View style={[menuStyles.sheet, { paddingBottom: insets.bottom + 8, backgroundColor: sheetBg }]}>
        {/* Handle */}
        <View style={menuStyles.handle} />

        {/* Título de la mezcla */}
        <View style={menuStyles.header}>
          <View style={{ flex: 1 }}>
            <Text style={[menuStyles.mixName, { color: colors.foreground }]} numberOfLines={1}>
              {mix.name}
            </Text>
            <Text style={[menuStyles.mixMeta, { color: colors.mutedForeground }]}>
              {mix.author.displayName} · {mix.sounds.length} sonidos
            </Text>
          </View>
          <Pressable onPress={onClose} style={menuStyles.closeBtn} hitSlop={8}>
            <Feather name="x" size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <View style={[menuStyles.sep, { backgroundColor: "rgba(61,14,22,0.40)" }]} />

        {/* Ver mezclas del creador */}
        <Pressable
          onPress={() => onViewCreator(mix)}
          style={({ pressed }) => [menuStyles.action, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="user" size={20} color={colors.foreground} style={menuStyles.actionIcon} />
          <Text style={[menuStyles.actionLabel, { color: colors.foreground }]}>
            Ver mezclas del creador
          </Text>
          <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.20)" />
        </Pressable>

        <View style={[menuStyles.sep, { backgroundColor: "rgba(61,14,22,0.40)" }]} />

        {/* Reportar mezcla */}
        <Pressable
          onPress={() => {
            onClose();
            const reasons: { key: "spam" | "inapropiado" | "ofensivo" | "otro"; label: string }[] = [
              { key: "spam", label: "Spam o engañosa" },
              { key: "inapropiado", label: "Contenido inapropiado" },
              { key: "ofensivo", label: "Lenguaje ofensivo" },
              { key: "otro", label: "Otro motivo" },
            ];
            Alert.alert(
              "Reportar mezcla",
              `¿Por qué querés reportar "${mix.name}"?`,
              [
                ...reasons.map((r) => ({
                  text: r.label,
                  onPress: () => reportMix.mutate(
                    { id: mix.id, data: { reason: r.key } },
                    {
                      onSuccess: () => Alert.alert("Gracias", "Recibimos tu reporte. Nuestro equipo lo revisará."),
                      onError: () => Alert.alert("Ups", "No pudimos enviar el reporte. Intentá de nuevo."),
                    },
                  ),
                })),
                { text: "Cancelar", style: "cancel" as const },
              ],
            );
          }}
          style={({ pressed }) => [menuStyles.action, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="flag" size={20} color="#D08B7A" style={menuStyles.actionIcon} />
          <Text style={[menuStyles.actionLabel, { color: "#D08B7A" }]}>
            Reportar mezcla
          </Text>
          <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.20)" />
        </Pressable>
      </View>
      </View>
    </Modal>
  );
}

// ── Estilos ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  section: { paddingHorizontal: 20, paddingTop: 18 },
  panel: {
    backgroundColor: "transparent",
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 25,
    marginHorizontal: 0,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  sectionTitle: { fontFamily: "Manrope", fontSize: 20, fontWeight: "700", letterSpacing: 0.5 },
  verTodas: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600", color: "#F9F9F9" },

  // Portada / Avatar
  avatarWrap: {
    flexShrink: 0,
    width: 68,
    height: 68,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "rgba(212,175,55,0.3)",
  },
  avatarImg: {
    width: STACK_THUMB,
    height: STACK_THUMB,
    borderRadius: STACK_THUMB / 2,
    overflow: "hidden",
  },
  coverImg: {
    width: "100%",
    height: "100%",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarFallback: {
    backgroundColor: "rgba(212,175,55,0.18)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.30)",
  },
  avatarInitial: { fontFamily: "Manrope", fontSize: 13, fontWeight: "700", color: GOLD },

  // Empty
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 6,
    borderRadius: 14,
    marginTop: 12,
  },
  emptyText: { fontFamily: "Manrope", fontSize: 14, fontWeight: "600" },
  emptySub: { fontFamily: "Manrope", fontSize: 12, textAlign: "center", paddingHorizontal: 20 },

  // Lista vertical
  listWrap: {
    flexDirection: "column",
    gap: 14,
  },
  gridCell: { width: CELL_W },
  gridCover: {
    width: CELL_W,
    height: CELL_W,
    borderRadius: 12,
    overflow: "hidden",
  },
  gridAuthorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 7,
    paddingHorizontal: 2,
  },
  gridAuthorName: { fontFamily: "Manrope", fontSize: 13.5, fontWeight: "600", flexShrink: 1 },

  // Fila
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.045)",
  },
  info: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  mixName: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600", flexShrink: 1 },
  trendBadge: {
    backgroundColor: "rgba(212,175,55,0.12)",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    flexShrink: 0,
  },
  trendText: { fontFamily: "Manrope", fontSize: 8, fontWeight: "700", letterSpacing: 0.5 },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 2 },
  authorAvatar: { width: 16, height: 16, borderRadius: 8, overflow: "hidden", flexShrink: 0 },
  authorAvatarFallback: { backgroundColor: "rgba(212,175,55,0.20)", alignItems: "center", justifyContent: "center" },
  authorInitial: { fontFamily: "Manrope", fontSize: 8, fontWeight: "700", color: GOLD },
  mixCreator: { fontFamily: "Manrope", fontSize: 11, flexShrink: 1 },
  mixAuthor: { fontFamily: "Manrope", fontSize: 10, marginTop: 2 },
  mixCount: { fontFamily: "Manrope", fontSize: 12, fontWeight: "500" },
  likeChip: { flexDirection: "row", alignItems: "center", gap: 3, flexShrink: 0 },
  likeCount: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600", color: "#f9f9f9", marginRight: -12 },
  heartBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  dotsBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  // Ver más
  verMasBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
    marginTop: 8,
  },
  verMasText: { fontFamily: "Manrope", fontSize: 13 },
});

const menuStyles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: {
    backgroundColor: "#1A060C",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    overflow: "hidden",
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignSelf: "center", marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  mixName: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700", marginBottom: 2 },
  mixMeta: { fontFamily: "Manrope", fontSize: 12 },
  closeBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  sep: { height: StyleSheet.hairlineWidth },
  action: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  actionIcon: { width: 32, marginRight: 12 },
  actionLabel: { fontFamily: "Manrope", flex: 1, fontSize: 16 },
});
