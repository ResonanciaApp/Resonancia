/**
 * CommunityMixesCarousel — sección "Mezclas de la comunidad"
 * Diseño V2D (minimalista líneas): ranking, nombre, autor, 3-dot menu.
 * Tabs = píldoras (mismo diseño que "Mi Música").
 */
import { Feather, Ionicons } from "@expo/vector-icons";
import { useMixLike } from "@/hooks/useMixLike";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  ActivityIndicator,
  Animated,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

import {
  useGetSharedMixes,
  getGetSharedMixesQueryKey,
  useToggleSharedMixLike,
  useReportSharedMix,
} from "@workspace/api-client-react";
import type { SharedMix } from "@workspace/api-client-react";
import { getMixImage } from "@/config/mix-images";
import { catalogImage, useCoverPresetCatalog, useCoverPresetCatalogState } from "@/lib/cover-preset-catalog";
import { resolveAvatarUrl } from "@/lib/avatar";

import { useProfileAvatarSource } from "@/lib/profile-avatar";
import { getTopCommunityMixes, selectRandomCommunityAvatars } from "@/lib/community-mixes-ranking";
import { useColors } from "@/hooks/useColors";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { getThemeStyleId, isIndigo2ThemeId, isIndigoThemeId } from "@/config/scene-themes";
import { useCategoryOverlay } from "@/context/CategoryOverlayContext";
import { useAuth } from "@/context/AuthContext";
import { WIDGET_GREEN_SOLID } from "@/constants/colors";


import { Dimensions } from "react-native";

const GOLD = "#F9F9F9";
const STACK_THUMB = 93;
const GRID_GAP = 10;
const CELL_W = (Dimensions.get("window").width - 40 - GRID_GAP * 2) / 3;
const SHARED_MIXES_CACHE_KEY = "cdc_shared_mixes_v1";

const DEFAULT_COVER: [string, string] = ["#1B060F", "#2E0A18"];

// ── Componente principal ───────────────────────────────────────────
export function CommunityMixesCarousel() {
  const { items: profileCatalog, hydrated: profileCatalogHydrated } = useCoverPresetCatalogState("profile");
  // Temporary preview from the same catalog as Profile; stable across likes/rerenders.
  const previewAvatarSources = React.useMemo(
    () => __DEV__ && profileCatalogHydrated
      ? selectRandomCommunityAvatars(profileCatalog.map(preset => preset.source))
      : [],
    [profileCatalog, profileCatalogHydrated],
  );
  const { openCategory } = useCategoryOverlay();
  const colors = useColors();
  const { theme } = useSceneTheme();
   const { isSignedIn, clerkUserId } = useAuth();
   const [focused, setFocused] = useState(false);
   useFocusEffect(useCallback(() => {
     setFocused(true);
     return () => setFocused(false);
   }, []));
   const cacheKey = `${SHARED_MIXES_CACHE_KEY}:${clerkUserId ?? "guest"}`;
   const { data, isLoading, isError, refetch } = useGetSharedMixes(undefined, {
     query: {
       queryKey: [...getGetSharedMixesQueryKey(), clerkUserId ?? "guest"],
       enabled: focused,
       staleTime: 30_000,
       refetchInterval: focused ? 60_000 : false,
     },
   });
   const [cached, setCached] = useState<{ key: string; mixes: SharedMix[] }>({ key: "", mixes: [] });
   const allMixes = data?.mixes ?? (cached.key === cacheKey ? cached.mixes : []);
  const toggleLike = useToggleSharedMixLike();
  const pendingLike = useRef<Record<number, boolean>>({});

  React.useEffect(() => {
    let cancelled = false;
     AsyncStorage.getItem(cacheKey)
      .then((raw) => {
        if (!raw || cancelled) return;
        const parsed = JSON.parse(raw);
         if (Array.isArray(parsed)) setCached({ key: cacheKey, mixes: parsed });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
   }, [cacheKey]);

  React.useEffect(() => {
    if (!Array.isArray(data?.mixes)) return;
     setCached({ key: cacheKey, mixes: data.mixes });
    AsyncStorage.setItem(
       cacheKey,
      JSON.stringify(data.mixes),
    ).catch(() => {});
   }, [data, cacheKey]);


  const visible = getTopCommunityMixes(allMixes);

  // ── Like toggle ───────────────────────────────────────────────
  const { applyOptimistic, patchAll: patchMixLike } = useMixLike();

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
            patchMixLike(updated.id, (m) => ({ ...m, likes: updated.likes, likedByMe: updated.likedByMe }));
          },
        },
      );
    },
    [isSignedIn, applyOptimistic, patchMixLike, toggleLike],
  );

  const handleViewCreator = useCallback((mix: SharedMix) => {
    router.push(`/usuario/${mix.author.id}` as never);
  }, []);

  const handleOpenMix = useCallback((mix: SharedMix) => {
    openCategory(`/mezcla/${mix.id}`);
  }, [openCategory]);

  // ── Render ────────────────────────────────────────────────────
  return (
    <View style={styles.section}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: "#FFFFFF" }]}>
          Mezclas comunidad
        </Text>
        <Pressable
          onPress={() => router.push("/mezclas-comunidad" as never)}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Text style={[styles.verTodas, { color: isIndigo2ThemeId(theme.id) ? WIDGET_GREEN_SOLID : colors.primary }]}>Ver todos</Text>
        </Pressable>
      </View>

      <View style={styles.panel}>
      {/* Empty state */}
       {visible.length === 0 && isLoading && (
         <View style={styles.emptyState}>
           <ActivityIndicator color={colors.primary} />
           <Text style={[styles.emptyText, { color: colors.foreground }]}>Cargando mezclas…</Text>
         </View>
       )}
       {visible.length === 0 && isError && (
         <Pressable style={styles.emptyState} onPress={() => refetch()} accessibilityRole="button">
           <Text style={[styles.emptyText, { color: colors.foreground }]}>No se pudieron cargar las mezclas</Text>
           <Text style={[styles.emptySub, { color: colors.primary }]}>Reintentar</Text>
         </Pressable>
       )}
       {visible.length === 0 && !isLoading && !isError && (
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
          {visible.map((mix, index) => (
            <MixRow
              key={mix.id}
              mix={mix}
              rank={index + 1}
              previewAvatarSource={previewAvatarSources[index]}
              colors={colors}
              onPress={() => handleOpenMix(mix)}
              onDotsPress={() => {}}
              onAuthorPress={() => handleViewCreator(mix)}
              favorited={mix.likedByMe ?? false}
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
function AnimatedHeart({ favorited, onPress, count, mixId }: {
  favorited: boolean; onPress: () => void; count: number; mixId: number;
}) {
  const scale = useRef(new Animated.Value(1)).current;
  const heartFill = "#F9F9F9";

  const handlePress = () => {
    onPress();
    scale.setValue(1);
    Animated.sequence([
      Animated.timing(scale, { toValue: 1.35, duration: 120, useNativeDriver: true }),
      Animated.spring(scale, { toValue: 1, friction: 3, tension: 140, useNativeDriver: true }),
    ]).start();
  };

  return (
    <Pressable testID="community-mix-heart" onPress={handlePress} hitSlop={4}
      style={[styles.heartBtn, { width: undefined, minWidth: 44, flexDirection: "row", gap: 6,
        transform: [{ translateX: -5 }] }]}
      accessibilityRole="button" accessibilityLabel={`${favorited ? "Quitar de" : "Añadir a"} favoritos, ${count} favoritos`}
      accessibilityState={{ selected: favorited }}>
      <Text testID={`community-mix-likes-${mixId}`} style={styles.rowLikes} numberOfLines={1}>{count}</Text>
      <Animated.View style={{ transform: [{ scale }] }}>
        {favorited ? (
          <Ionicons name="heart" size={16} color={heartFill} />
        ) : (
          <Ionicons name="heart-outline" size={16} color="#f9f9f9" />
        )}
      </Animated.View>
    </Pressable>
  );
}

// ── Fila de mezcla (V2D) ───────────────────────────────────────────
export type Colors = ReturnType<typeof import("@/hooks/useColors").useColors>;

export function MixRow({
  mix,
  rank,
  previewAvatarSource,
  colors,
  onPress,
  onDotsPress,
  onAuthorPress,
  favorited,
  onHeartPress,
}: {
  mix: SharedMix;
  rank?: number;
  previewAvatarSource?: number | { uri: string };
  colors: Colors;
  onPress: () => void;
  onDotsPress: () => void;
  onAuthorPress: () => void;
  favorited?: boolean;
  onHeartPress?: () => void;
}) {
  const { activeSceneId } = useSceneTheme();
  const realAvatarSource = useProfileAvatarSource(mix.author);
  const avatarSource = previewAvatarSource ?? realAvatarSource;
  const initial = mix.author.displayName?.trim()?.[0]?.toUpperCase() ?? "·";

  return (
    <Pressable
      testID={`community-mix-row-${mix.id}`}
      onPress={onPress}
      onLongPress={onDotsPress}
      style={({ pressed }) => [
        styles.row,
        activeSceneId === "tibet" && { backgroundColor: "rgba(0,0,0,0.15)" },
        isIndigoThemeId(activeSceneId) && { backgroundColor: "rgba(181,211,255,0.057)" },
        isIndigo2ThemeId(activeSceneId) && { backgroundColor: "rgba(0,0,0,0.16)" },
        getThemeStyleId(activeSceneId) === "cloudy" && { backgroundColor: "rgba(0,0,0,0.19)" },
        { opacity: pressed ? 0.6 : 1 },
      ]}
    >
      {rank != null && <View style={styles.rankSlot} pointerEvents="none">
        <Text style={[styles.rankText, rank <= 3 && {
          fontWeight: "700", color: "#F9F9F9",
        }]}>{rank}.</Text>
      </View>}
      <Pressable
        testID={`community-mix-author-${mix.id}`}
        onPress={onAuthorPress}
        hitSlop={6}
        accessibilityRole="button"
        accessibilityLabel={`Perfil de ${mix.author.displayName}`}
        style={styles.rowAvatar}
      >
        {avatarSource ? (
          <ExpoImage source={avatarSource} style={styles.rowAvatarImg} contentFit="cover" />
        ) : (
          <View style={[styles.rowAvatarImg, styles.authorAvatarFallback]}>
            <Text style={styles.authorInitial}>{initial}</Text>
          </View>
        )}
      </Pressable>
      <View style={styles.rowName}>
        <Text style={[styles.mixName, { color: colors.foreground, lineHeight: 16 }]} numberOfLines={1}>
          {mix.name}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {mix.author.displayName}
        </Text>
      </View>
       <AnimatedHeart count={mix.likes ?? 0} mixId={mix.id}
         favorited={favorited ?? false} onPress={onHeartPress ?? (() => {})} />
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
  const catalog = useCoverPresetCatalog("mix");
  const resolvedImg = mix.image
    ? catalog.find((item) => item.key === mix.image || item.id === mix.image)?.source
      ?? catalogImage("mix", mix.image)
      ?? getMixImage(mix.image)
    : undefined;

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
  const catalog = useCoverPresetCatalog("mix");
  const resolvedImg = image
    ? (/^(https?:\/\/|\/)/.test(image) ? { uri: resolveAvatarUrl(image) ?? image } : undefined)
      ?? catalog.find((item) => item.key === image || item.id === image)?.source
      ?? catalogImage("mix", image)
      ?? getMixImage(image, false)
    : undefined;

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
    marginBottom: 17,
  },
  sectionTitle: { fontFamily: "Manrope", fontSize: 20, fontWeight: "700", letterSpacing: 0.5 },
  verTodas: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600" },

  // Portada / Avatar
  avatarWrap: {
    flexShrink: 0,
    width: 68,
    height: 68,
    borderRadius: 12,
    overflow: "hidden",
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
    gap: 8,
    paddingVertical: 10,
    minHeight: 59,
    height: 59,
    paddingHorizontal: 12,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.045)",
  },
  rankSlot: { width: 26, height: 26, alignItems: "center", justifyContent: "center", flexShrink: 0 },
  rankText: { fontFamily: "Manrope", fontSize: 10, fontWeight: "500", color: "#F9F9F9", transform: [{ translateX: -3 }] },
  rowAvatar: { width: 37, height: 37, borderRadius: 18.5, flexShrink: 0, transform: [{ translateX: -7 }] },
  rowAvatarImg: { width: 37, height: 37, borderRadius: 18.5, overflow: "hidden" },
  rowName: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 40, gap: 4, transform: [{ translateX: -7 }] },
  rowMeta: { fontFamily: "Manrope", fontSize: 9, lineHeight: 10, color: "#CFCFCF" },
  rowCount: { flexShrink: 0, maxWidth: 70 },
  rowCategory: { flexShrink: 2, maxWidth: 80 },
  rowLikes: { fontFamily: "Manrope", fontSize: 11, fontWeight: "600", color: "#f9f9f9", flexShrink: 0, minWidth: 14, textAlign: "right" },
  info: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  mixName: { fontFamily: "Manrope", fontSize: 13, fontWeight: "700", flexShrink: 1 },
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
