/**
 * CommunityMixesCarousel — sección "Mezclas de la comunidad"
 * Diseño V2D (minimalista líneas): ranking, nombre, autor, 3-dot menu.
 * Tabs = píldoras (mismo diseño que "Mi Música").
 */
import { Feather } from "@expo/vector-icons";
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
import { type MixCategory } from "@/data/mix-categories";
import { resolveAvatarUrl } from "@/lib/avatar";
import { useColors } from "@/hooks/useColors";


const GOLD = "#D4AF37";
const STACK_THUMB = 30;

const MAX_VISIBLE = 8;

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
}: {
  mix: SharedMix;
  colors: Colors;
  onPress: () => void;
  onDotsPress: () => void;
}) {
  const trending = mix.trending === true;
  const dividerColor = "rgba(61,14,22,0.40)";

  return (
    <View>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
      >
        {/* Avatar del creador */}
        <CreatorAvatar author={mix.author} />

        {/* Info */}
        <View style={styles.info}>
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
            {mix.author.displayName}
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

// ── Avatar del creador ─────────────────────────────────────────────
function CreatorAvatar({ author }: { author: SharedMix["author"] }) {
  const initial = author.displayName?.charAt(0)?.toUpperCase() ?? "?";
  const uri = resolveAvatarUrl(author.avatarUrl);
  return (
    <View style={styles.avatarWrap}>
      {uri ? (
        <ExpoImage
          source={{ uri }}
          style={styles.avatarImg}
          contentFit="cover"
        />
      ) : (
        <View style={[styles.avatarImg, styles.avatarFallback]}>
          <Text style={styles.avatarInitial}>{initial}</Text>
        </View>
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
      <Pressable style={menuStyles.backdrop} onPress={onClose} />

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

        {/* Ver perfil del creador */}
        <Pressable
          onPress={() => onViewCreator(mix)}
          style={({ pressed }) => [menuStyles.action, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="user" size={20} color={colors.foreground} style={menuStyles.actionIcon} />
          <Text style={[menuStyles.actionLabel, { color: colors.foreground }]}>
            Ver perfil del creador
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
    </Modal>
  );
}

// ── Estilos ────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  section: { paddingHorizontal: 20 },
  panel: {},

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 20, fontWeight: "700", letterSpacing: 0.3 },
  verTodas: { fontSize: 13, fontWeight: "500" },

  // Avatar del creador
  avatarWrap: { flexShrink: 0 },
  avatarImg: {
    width: STACK_THUMB,
    height: STACK_THUMB,
    borderRadius: STACK_THUMB / 2,
    overflow: "hidden",
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
    backgroundColor: "#151A23",
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
