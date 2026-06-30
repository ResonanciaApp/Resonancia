/**
 * CommunityMixesCarousel — sección "Mezclas de la comunidad"
 * Diseño V2D (minimalista líneas): ranking, nombre, autor, 3-dot menu.
 * Tabs = píldoras (mismo diseño que "Mi Música").
 */
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGetSharedMixes, useReportSharedMix } from "@workspace/api-client-react";
import type { SharedMix } from "@workspace/api-client-react";

import { type MixPreset, useMixer } from "@/context/MixerContext";
import { type MixCategory, MIX_CATEGORIES } from "@/data/mix-categories";
import { resolveAvatarUrl } from "@/lib/avatar";
import { useColors } from "@/hooks/useColors";


const GOLD = "#D4AF37";
const STACK_THUMB = 62;
const MAX_VISIBLE = 8;

const DEFAULT_COVER: [string, string] = ["#1B060F", "#2E0A18"];

// ── Componente principal ───────────────────────────────────────────
export function CommunityMixesCarousel() {
  const colors = useColors();
  const { data } = useGetSharedMixes();
  const allMixes = data?.mixes ?? [];
  const { importPreset, presets } = useMixer();
  const reportMix = useReportSharedMix();

  // ── 3-dot menu state ──────────────────────────────────────────
  const [menuMix, setMenuMix] = useState<SharedMix | null>(null);

  const visible = allMixes.slice(0, MAX_VISIBLE);
  const remaining = allMixes.length - visible.length;

  // ── Helpers ───────────────────────────────────────────────────
  const isFavorited = useCallback(
    (mix: SharedMix) => presets.some((p) => p.id === `community-fav-${mix.id}`),
    [presets],
  );

  const handleAddFavorite = useCallback(
    (mix: SharedMix) => {
      if (isFavorited(mix)) {
        Alert.alert("Ya en favoritos", "Esta mezcla ya está en tus mezclas favoritas.");
        return;
      }
      const preset: MixPreset = {
        id: `community-fav-${mix.id}`,
        name: mix.name,
        description: mix.description ?? undefined,
        image: mix.image ?? undefined,
        category: mix.category as MixCategory,
        sounds: mix.sounds.map((s) => ({ id: s.id, volume: s.volume })),
        createdAt: mix.createdAt,
        favorited: true,
      };
      importPreset(preset);
      setMenuMix(null);
      Alert.alert("Guardada", `"${mix.name}" se agregó a tus mezclas favoritas.`);
    },
    [importPreset, isFavorited],
  );

  const handleViewCreator = useCallback((mix: SharedMix) => {
    setMenuMix(null);
    router.push({
      pathname: "/mezcla-creador/[userId]",
      params: { userId: String(mix.author.id), name: mix.author.displayName },
    } as never);
  }, []);

  const handleOpenMix = useCallback((mix: SharedMix) => {
    router.push({ pathname: "/mezcla/[id]", params: { id: String(mix.id) } } as never);
  }, []);

  const handleReport = useCallback(
    (mix: SharedMix) => {
      setMenuMix(null);
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
            onPress: () =>
              reportMix.mutate(
                { id: mix.id, data: { reason: r.key } },
                {
                  onSuccess: () =>
                    Alert.alert(
                      "Gracias",
                      "Recibimos tu reporte. Nuestro equipo lo revisará.",
                    ),
                  onError: () =>
                    Alert.alert("Ups", "No pudimos enviar el reporte. Intentá de nuevo."),
                },
              ),
          })),
          { text: "Cancelar", style: "cancel" as const },
        ],
      );
    },
    [reportMix],
  );

  // ── Render ────────────────────────────────────────────────────
  return (
    <View style={styles.section}>
      {/* Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: "#FFFFFF" }]}>
          Mezclas de la comunidad
        </Text>
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

      {/* ── Lista V2D ── */}
      {visible.length > 0 && (
        <View style={{ marginTop: 4 }}>
          {visible.map((mix, i) => (
            <MixRow
              key={mix.id}
              mix={mix}
              colors={colors}
              onPress={() => handleOpenMix(mix)}
              onDotsPress={() => setMenuMix(mix)}
              onAuthorPress={() => handleViewCreator(mix)}
            />
          ))}
        </View>
      )}

      {/* Ver más */}
      {remaining > 0 && (
        <Pressable
          onPress={() => router.push("/mezclas-comunidad" as never)}
          style={({ pressed }) => [
            styles.verMasBtn,
            { borderColor: "rgba(212,175,55,0.20)", opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.verMasText, { color: colors.mutedForeground }]}>
            Ver las {allMixes.length} mezclas →
          </Text>
        </Pressable>
      )}
      </View>

      {/* ── 3-dot Menu Modal ── */}
      <MixContextMenu
        mix={menuMix}
        onClose={() => setMenuMix(null)}
        onAddFavorite={handleAddFavorite}
        onViewCreator={handleViewCreator}
        onReport={handleReport}
        colors={colors}
      />
    </View>
  );
}

// ── Fila de mezcla (V2D) ───────────────────────────────────────────
type Colors = ReturnType<typeof import("@/hooks/useColors").useColors>;

function MixRow({
  mix,
  colors,
  onPress,
  onDotsPress,
  onAuthorPress,
}: {
  mix: SharedMix;
  colors: Colors;
  onPress: () => void;
  onDotsPress: () => void;
  onAuthorPress: () => void;
}) {
  const trending = mix.trending === true;
  const dividerColor = "rgba(61,14,22,0.40)";
  const avatarUri = resolveAvatarUrl(mix.author.avatarUrl ?? null);
  const initial = mix.author.displayName?.trim()?.[0]?.toUpperCase() ?? "·";

  return (
    <View>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
      >
        {/* Portada de la mezcla */}
        <MixCover category={mix.category} />

        {/* Info */}
        <View style={styles.info}>
          {/* Autor — tappable */}
          <Pressable
            onPress={onAuthorPress}
            hitSlop={6}
            style={styles.authorRow}
          >
            {avatarUri ? (
              <ExpoImage source={{ uri: avatarUri }} style={styles.authorAvatar} contentFit="cover" />
            ) : (
              <View style={[styles.authorAvatar, styles.authorAvatarFallback]}>
                <Text style={styles.authorInitial}>{initial}</Text>
              </View>
            )}
            <Text style={[styles.mixCreator, { color: colors.mutedForeground }]} numberOfLines={1}>
              {mix.author.displayName}
            </Text>
          </Pressable>
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
          <Text
            style={[styles.mixAuthor, { color: colors.mutedForeground }]}
            numberOfLines={1}
          >
            {mix.sounds.length} sonido{mix.sounds.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* Likes */}
        {mix.likes > 0 && (
          <View style={styles.likeChip}>
            <Feather name="heart" size={11} color={GOLD} />
            <Text style={styles.likeCount}>{mix.likes}</Text>
          </View>
        )}

        {/* 3 puntitos */}
        <Pressable
          onPress={onDotsPress}
          hitSlop={12}
          style={({ pressed }) => [styles.dotsBtn, { opacity: pressed ? 0.5 : 1 }]}
        >
          <Feather name="more-vertical" size={18} color={colors.mutedForeground} />
        </Pressable>
      </Pressable>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: dividerColor }]} />
    </View>
  );
}

// ── Portada de la mezcla ───────────────────────────────────────────
function MixCover({ category }: { category?: string | null }) {
  const catMeta = category ? MIX_CATEGORIES.find((c) => c.id === category) : undefined;

  return (
    <View style={styles.avatarWrap}>
      {catMeta ? (
        <ExpoImage
          source={catMeta.image as number}
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
function MixContextMenu({
  mix,
  onClose,
  onAddFavorite,
  onViewCreator,
  onReport,
  colors,
}: {
  mix: SharedMix | null;
  onClose: () => void;
  onAddFavorite: (mix: SharedMix) => void;
  onViewCreator: (mix: SharedMix) => void;
  onReport: (mix: SharedMix) => void;
  colors: Colors;
}) {
  const insets = useSafeAreaInsets();

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

      <View style={[menuStyles.sheet, { paddingBottom: insets.bottom + 8 }]}>
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

        {/* Agregar a favoritos */}
        <Pressable
          onPress={() => onAddFavorite(mix)}
          style={({ pressed }) => [menuStyles.action, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="heart" size={20} color={GOLD} style={menuStyles.actionIcon} />
          <Text style={[menuStyles.actionLabel, { color: colors.foreground }]}>
            Agregar a favoritos
          </Text>
          <Feather name="chevron-right" size={16} color="rgba(244,218,213,0.20)" />
        </Pressable>

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
          <Feather name="chevron-right" size={16} color="rgba(244,218,213,0.20)" />
        </Pressable>

        <View style={[menuStyles.sep, { backgroundColor: "rgba(61,14,22,0.40)" }]} />

        {/* Reportar mezcla */}
        <Pressable
          onPress={() => onReport(mix)}
          style={({ pressed }) => [menuStyles.action, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="flag" size={20} color="#D08B7A" style={menuStyles.actionIcon} />
          <Text style={[menuStyles.actionLabel, { color: "#D08B7A" }]}>
            Reportar mezcla
          </Text>
          <Feather name="chevron-right" size={16} color="rgba(244,218,213,0.20)" />
        </Pressable>
      </View>
      </View>
    </Modal>
  );
}

// ── Estilos ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  section: { paddingHorizontal: 0, paddingTop: 18 },
  panel: {
    backgroundColor: "transparent",
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingTop: 4,
    paddingBottom: 25,
    marginHorizontal: 0,
  },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 3,
  },
  sectionTitle: { fontSize: 20, fontWeight: "700", letterSpacing: 0.5 },
  verTodas: { fontSize: 13, fontWeight: "500" },

  // Portada / Avatar
  avatarWrap: { flexShrink: 0 },
  avatarImg: {
    width: STACK_THUMB,
    height: STACK_THUMB,
    borderRadius: STACK_THUMB / 2,
    overflow: "hidden",
  },
  coverImg: {
    width: STACK_THUMB,
    height: STACK_THUMB,
    borderRadius: 10,
    overflow: "hidden",
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
  avatarInitial: { fontSize: 13, fontWeight: "700", color: GOLD },

  // Empty
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 6,
    borderRadius: 14,
    marginTop: 12,
  },
  emptyText: { fontSize: 14, fontWeight: "600" },
  emptySub: { fontSize: 12, textAlign: "center", paddingHorizontal: 20 },

  // Fila
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 11,
  },
  info: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 2 },
  mixName: { fontSize: 13, fontWeight: "600", flexShrink: 1 },
  trendBadge: {
    backgroundColor: "rgba(212,175,55,0.12)",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    flexShrink: 0,
  },
  trendText: { fontSize: 8, fontWeight: "700", letterSpacing: 0.5 },
  authorRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 2 },
  authorAvatar: { width: 16, height: 16, borderRadius: 8, overflow: "hidden", flexShrink: 0 },
  authorAvatarFallback: { backgroundColor: "rgba(212,175,55,0.20)", alignItems: "center", justifyContent: "center" },
  authorInitial: { fontSize: 8, fontWeight: "700", color: GOLD },
  mixCreator: { fontSize: 9, flexShrink: 1 },
  mixAuthor: { fontSize: 10, marginTop: 2 },
  mixCount: { fontSize: 12, fontWeight: "500" },
  likeChip: { flexDirection: "row", alignItems: "center", gap: 3, flexShrink: 0 },
  likeCount: { fontSize: 10, fontWeight: "600", color: GOLD },
  dotsBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  divider: { height: 1, marginLeft: 34 },

  // Ver más
  verMasBtn: {
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 20,
    alignItems: "center",
    marginTop: 8,
  },
  verMasText: { fontSize: 13 },
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
    backgroundColor: "rgba(74,12,12,0.35)",
    alignSelf: "center", marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  mixName: { fontSize: 15, fontWeight: "700", marginBottom: 2 },
  mixMeta: { fontSize: 12 },
  closeBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  sep: { height: StyleSheet.hairlineWidth },
  action: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
  },
  actionIcon: { width: 32, marginRight: 12 },
  actionLabel: { flex: 1, fontSize: 16 },
});
