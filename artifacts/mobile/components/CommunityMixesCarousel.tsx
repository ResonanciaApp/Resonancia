/**
 * CommunityMixesCarousel — sección "Mezclas de la comunidad"
 * Diseño V2D (minimalista líneas): ranking, nombre, autor, 3-dot menu.
 * Tabs = bloques tipo tarjeta con ícono arriba (mismo diseño que Mis Mezclas).
 */
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
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
import Svg, { Ellipse, Path } from "react-native-svg";
import { Image as ExpoImage } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGetSharedMixes, useReportSharedMix } from "@workspace/api-client-react";
import type { SharedMix } from "@workspace/api-client-react";

import { getSoundImage } from "@/config/sound-images";
import { type MixPreset, useMixer } from "@/context/MixerContext";
import { type MixCategory } from "@/data/mix-categories";
import { useColors } from "@/hooks/useColors";

// ── Tipos ──────────────────────────────────────────────────────────
type CategoryFilter = MixCategory;

const TABS: { id: CategoryFilter; label: string }[] = [
  { id: "dormir",        label: "Descanso"   },
  { id: "motivarme",     label: "Meditación" },
  { id: "concentracion", label: "Enfoque"    },
];

const GOLD = "#BE9650";
const STACK_THUMB = 30;
const STACK_SHIFT = 19;
const MAX_VISIBLE = 8;

// ── Íconos de categoría (mismos que Mis Mezclas) ───────────────────
function MoonIcon({ color, size = 26 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" fill={color} />
    </Svg>
  );
}

function ZenStonesIcon({ color, size = 26 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 30 30">
      <Ellipse cx="15"   cy="23.5" rx="8"   ry="4.2" fill={color} opacity={0.95} />
      <Ellipse cx="15.6" cy="16.5" rx="5.8" ry="3.3" fill={color} opacity={0.85} />
      <Ellipse cx="14.8" cy="10.8" rx="3.8" ry="2.6" fill={color} opacity={0.75} />
    </Svg>
  );
}

function CategoryIcon({ id, color, size = 26 }: { id: CategoryFilter; color: string; size?: number }) {
  if (id === "dormir")    return <MoonIcon color={color} size={size} />;
  if (id === "motivarme") return <ZenStonesIcon color={color} size={size} />;
  return <MaterialCommunityIcons name="image-filter-hdr" size={size} color={color} />;
}

// ── Componente principal ───────────────────────────────────────────
export function CommunityMixesCarousel() {
  const colors = useColors();
  const { data } = useGetSharedMixes();
  const allMixes = data?.mixes ?? [];
  const { importPreset, presets } = useMixer();
  const reportMix = useReportSharedMix();

  // ── Tab state ─────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<CategoryFilter>("dormir");

  // ── 3-dot menu state ──────────────────────────────────────────
  const [menuMix, setMenuMix] = useState<SharedMix | null>(null);

  // ── Filtrado ──────────────────────────────────────────────────
  const filtered = allMixes.filter((m) => m.category === activeTab);

  const visible = filtered.slice(0, MAX_VISIBLE);
  const remaining = filtered.length - visible.length;

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
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Mezclas de la comunidad
        </Text>
        {filtered.length > MAX_VISIBLE && (
          <Pressable onPress={() => router.push("/mezclas-comunidad" as never)} hitSlop={8}>
            <Text style={[styles.verTodas, { color: colors.primary }]}>Ver todos</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.panel}>
      {/* ── Tabs — 3 bloques con ícono arriba ── */}
      <View style={styles.tabRow}>
        {TABS.map(({ id, label }) => {
          const sel = id === activeTab;
          return (
            <Pressable
              key={id}
              onPress={() => setActiveTab(id)}
              style={[styles.tabBlock, sel && styles.tabBlockActive]}
              accessibilityRole="tab"
              accessibilityState={{ selected: sel }}
            >
              <CategoryIcon id={id} color={sel ? "#FFFFFF" : colors.mutedForeground} size={26} />
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: sel ? colors.foreground : colors.mutedForeground,
                    fontWeight: sel ? "700" : "400",
                  },
                ]}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Divisor tabs → lista */}
      <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.07)", marginBottom: 4 }} />

      {/* Empty state */}
      {visible.length === 0 && (
        <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
          <Feather name="music" size={28} color="rgba(190,150,80,0.35)" />
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
              rank={i + 1}
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
            { borderColor: "rgba(190,150,80,0.2)", opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Text style={[styles.verMasText, { color: colors.mutedForeground }]}>
            Ver las {filtered.length} mezclas →
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
  rank,
  colors,
  onPress,
  onDotsPress,
}: {
  mix: SharedMix;
  rank: number;
  colors: Colors;
  onPress: () => void;
  onDotsPress: () => void;
}) {
  const trending = mix.trending === true;
  const isFirst = rank === 1;
  const dividerColor = "rgba(255,255,255,0.05)";

  return (
    <View>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.row, { opacity: pressed ? 0.6 : 1 }]}
      >
        {/* Rank */}
        <Text style={[styles.rank, { color: isFirst ? GOLD : "#3A4A5A" }]}>
          {rank}
        </Text>

        {/* Miniaturas apiladas de los sonidos */}
        <SoundStack sounds={mix.sounds} />

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
          <Text
            style={[styles.mixCount, { color: colors.foreground }]}
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

// ── Miniaturas apiladas de los sonidos ─────────────────────────────
const STACK_MAX = 2;

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
            style={[
              styles.stackThumb,
              { left: i * STACK_SHIFT, zIndex: visible.length - i },
            ]}
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

        <View style={[menuStyles.sep, { backgroundColor: "rgba(255,255,255,0.07)" }]} />

        {/* Agregar a favoritos */}
        <Pressable
          onPress={() => onAddFavorite(mix)}
          style={({ pressed }) => [menuStyles.action, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="heart" size={20} color={GOLD} style={menuStyles.actionIcon} />
          <Text style={[menuStyles.actionLabel, { color: colors.foreground }]}>
            Agregar a favoritos
          </Text>
          <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.2)" />
        </Pressable>

        <View style={[menuStyles.sep, { backgroundColor: "rgba(255,255,255,0.07)" }]} />

        {/* Ver perfil del creador */}
        <Pressable
          onPress={() => onViewCreator(mix)}
          style={({ pressed }) => [menuStyles.action, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="user" size={20} color={colors.foreground} style={menuStyles.actionIcon} />
          <Text style={[menuStyles.actionLabel, { color: colors.foreground }]}>
            Ver perfil del creador
          </Text>
          <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.2)" />
        </Pressable>

        <View style={[menuStyles.sep, { backgroundColor: "rgba(255,255,255,0.07)" }]} />

        {/* Reportar mezcla */}
        <Pressable
          onPress={() => onReport(mix)}
          style={({ pressed }) => [menuStyles.action, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="flag" size={20} color="#D08B7A" style={menuStyles.actionIcon} />
          <Text style={[menuStyles.actionLabel, { color: "#D08B7A" }]}>
            Reportar mezcla
          </Text>
          <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.2)" />
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

  // Tabs (bloques con ícono)
  tabRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  tabBlock: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    paddingTop: 14,
    paddingBottom: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  tabBlockActive: { backgroundColor: "rgba(255,255,255,0.08)" },
  tabLabel: { fontSize: 12, letterSpacing: 0.1 },

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
  rank: {
    width: 20,
    textAlign: "right",
    fontSize: 13,
    fontWeight: "700",
    flexShrink: 0,
  },
  stack: {
    height: STACK_THUMB,
    flexShrink: 0,
  },
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
  stackImg: {
    width: "100%",
    height: "100%",
  },
  info: { flex: 1, minWidth: 0 },
  nameRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  mixName: { fontSize: 13, fontWeight: "600", flexShrink: 1 },
  trendBadge: {
    backgroundColor: "rgba(190,150,80,0.12)",
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
    flexShrink: 0,
  },
  trendText: { fontSize: 8, fontWeight: "700", letterSpacing: 0.5 },
  mixAuthor: { fontSize: 10, marginTop: 2 },
  mixCount: { fontSize: 10, fontWeight: "500", marginTop: 2 },
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
    backgroundColor: "rgba(255,255,255,0.15)",
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
