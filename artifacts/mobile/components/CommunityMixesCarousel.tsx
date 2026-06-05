/**
 * CommunityMixesCarousel — sección "Mezclas de la comunidad"
 * Diseño V2D (minimalista líneas): ranking, nombre, autor, 3-dot menu.
 * Tabs con indicador dorado animado (estilo musica-sonidos.tsx).
 */
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Alert,
  Animated,
  LayoutChangeEvent,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGetSharedMixes } from "@workspace/api-client-react";
import type { SharedMix } from "@workspace/api-client-react";

import { getSoundImage } from "@/config/sound-images";
import { type MixPreset, useMixer } from "@/context/MixerContext";
import { MIX_CATEGORIES, type MixCategory } from "@/data/mix-categories";
import { useColors } from "@/hooks/useColors";

// ── Tipos ──────────────────────────────────────────────────────────
type CategoryFilter = "todos" | MixCategory;

const TABS: { id: CategoryFilter; label: string }[] = [
  { id: "todos",         label: "Todos"      },
  { id: "dormir",        label: "Descanso"   },
  { id: "motivarme",     label: "Meditación" },
  { id: "concentracion", label: "Enfoque"    },
];

const GOLD = "#BE9650";
const STACK_THUMB = 30;
const STACK_SHIFT = 19;
const MAX_VISIBLE = 8;

// ── Componente principal ───────────────────────────────────────────
export function CommunityMixesCarousel() {
  const colors = useColors();
  const { data } = useGetSharedMixes();
  const allMixes = data?.mixes ?? [];
  const { importPreset, presets } = useMixer();

  // ── Tab state ─────────────────────────────────────────────────
  const [activeTab, setActiveTab] = useState<CategoryFilter>("todos");
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const [indicatorWidth, setIndicatorWidth] = useState(0);
  const tabLayouts = useRef<Record<number, { x: number; width: number }>>({});

  const onTabLayout = (idx: number, e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    tabLayouts.current[idx] = { x, width };
    if (idx === 0) {
      setIndicatorWidth(width);
      indicatorAnim.setValue(x);
    }
  };

  const selectTab = (id: CategoryFilter, idx: number) => {
    setActiveTab(id);
    const layout = tabLayouts.current[idx];
    if (layout) {
      setIndicatorWidth(layout.width);
      Animated.spring(indicatorAnim, {
        toValue: layout.x,
        useNativeDriver: true,
        tension: 60,
        friction: 9,
      }).start();
    }
  };

  // ── 3-dot menu state ──────────────────────────────────────────
  const [menuMix, setMenuMix] = useState<SharedMix | null>(null);

  // ── Filtrado ──────────────────────────────────────────────────
  const filtered = activeTab === "todos"
    ? allMixes
    : allMixes.filter((m) => m.category === activeTab);

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
    // Navegar al perfil del creador cuando exista la ruta
    router.push({ pathname: "/mezcla/[id]", params: { id: String(mix.id) } } as never);
  }, []);

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

      {/* ── Tabs ── */}
      <View style={[styles.tabBar, { borderBottomColor: "rgba(255,255,255,0.08)" }]}>
        {TABS.map(({ id, label }, idx) => (
          <Pressable
            key={id}
            onLayout={(e) => onTabLayout(idx, e)}
            onPress={() => selectTab(id, idx)}
            style={styles.tabItem}
          >
            <Text
              style={[
                styles.tabLabel,
                {
                  color: id === activeTab ? colors.foreground : colors.mutedForeground,
                  fontWeight: id === activeTab ? "600" : "400",
                },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        ))}
        {indicatorWidth > 0 && (
          <Animated.View
            style={[
              styles.tabIndicator,
              { width: indicatorWidth, backgroundColor: GOLD, transform: [{ translateX: indicatorAnim }] },
            ]}
          />
        )}
      </View>

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

      {/* ── 3-dot Menu Modal ── */}
      <MixContextMenu
        mix={menuMix}
        onClose={() => setMenuMix(null)}
        onAddFavorite={handleAddFavorite}
        onViewCreator={handleViewCreator}
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
  onDotsPress,
}: {
  mix: SharedMix;
  rank: number;
  colors: Colors;
  onDotsPress: () => void;
}) {
  const trending = (mix as any).trending === true;
  const isFirst = rank === 1;
  const dividerColor = "rgba(255,255,255,0.05)";

  return (
    <View>
      <View style={styles.row}>
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
          <Text style={[styles.mixMeta, { color: colors.mutedForeground }]}>
            {mix.author.displayName} · {mix.sounds.length} sonido{mix.sounds.length !== 1 ? "s" : ""}
          </Text>
        </View>

        {/* 3 puntitos */}
        <Pressable
          onPress={onDotsPress}
          hitSlop={12}
          style={({ pressed }) => [styles.dotsBtn, { opacity: pressed ? 0.5 : 1 }]}
        >
          <Feather name="more-vertical" size={18} color={colors.mutedForeground} />
        </Pressable>
      </View>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: dividerColor }]} />
    </View>
  );
}

// ── Miniaturas apiladas de los sonidos ─────────────────────────────
function SoundStack({ sounds }: { sounds: SharedMix["sounds"] }) {
  if (!sounds || sounds.length === 0) return null;
  return (
    <View style={[styles.stack, { width: STACK_THUMB + (sounds.length - 1) * STACK_SHIFT }]}>
      {sounds.map((s, i) => {
        const img = getSoundImage(s.id);
        return (
          <View
            key={`${s.id}-${i}`}
            style={[
              styles.stackThumb,
              { left: i * STACK_SHIFT, zIndex: sounds.length - i },
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
  colors,
}: {
  mix: SharedMix | null;
  onClose: () => void;
  onAddFavorite: (mix: SharedMix) => void;
  onViewCreator: (mix: SharedMix) => void;
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
      </View>
    </Modal>
  );
}

// ── Estilos ────────────────────────────────────────────────────────
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

  // Tabs
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
    position: "relative",
    marginBottom: 4,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: { fontSize: 13, letterSpacing: 0.2 },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    height: 2,
    borderRadius: 1,
  },

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
  mixMeta: { fontSize: 10, marginTop: 2 },
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
