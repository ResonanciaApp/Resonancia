/**
 * Muro de la comunidad — composiciones Geometrix compartidas por los usuarios.
 * Muestra una grilla 2-col con previews en vivo (sin movimiento para ahorrar
 * recursos), nombre del autor, y botón de me gusta. Las propias composiciones
 * se pueden eliminar. Pull-to-refresh recarga el feed.
 */
import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  useGetSharedGlyphs,
  useToggleSharedGlyphLike,
  useUnshareGlyph,
  type SharedGlyph,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetSharedGlyphsQueryKey } from "@workspace/api-client-react";

import { SacredGlyph } from "@/components/SacredGlyph";
import { GEOMETRIES, type GeometryId } from "@/data/geometries";
import {
  bgGradientColors,
  brightnessFactor,
  gradientColors,
  HOME_GRADIENT,
  scaleColors,
  scaleHex,
  type GeoSettings,
} from "@/data/geometrix-creations";
import { useColors } from "@/hooks/useColors";

const MURAL_BG = ["#020205", "#030207", "#040309", "#030206", "#010102"] as const;

function GlyphPreview({
  glyph,
  size,
}: {
  glyph: SharedGlyph;
  size: number;
}) {
  const { recipe } = glyph;
  const bgFactor = brightnessFactor(recipe.master.bgBrightness);
  const bgGrad = bgGradientColors(recipe.master.bgGradientId ?? null);
  const bgColors = recipe.master.bgColor
    ? ([
        scaleHex(recipe.master.bgColor, bgFactor),
        scaleHex(recipe.master.bgColor, bgFactor),
      ] as const)
    : scaleColors(bgGrad ?? HOME_GRADIENT, bgFactor);

  return (
    <View style={{ width: size, height: size, overflow: "hidden" }}>
      <LinearGradient
        colors={bgColors as readonly [string, string, ...string[]]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {recipe.active.map((id) => {
        const geoId = id as GeometryId;
        const s = recipe.settings[id] as GeoSettings | undefined;
        if (!s) return null;
        if (!GEOMETRIES.find((g) => g.id === geoId)) return null;
        const opacity = Math.max(0.15, (s.opacity ?? 1) * (recipe.master.opacity ?? 1));
        const angle = s.manualAngle ?? 0;
        return (
          <View
            key={id}
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { alignItems: "center", justifyContent: "center", opacity },
              { transform: [{ rotate: `${angle}deg` }] },
            ]}
          >
            <SacredGlyph
              id={geoId}
              color={s.color ?? "#BE9650"}
              gradient={gradientColors(s.gradientId ?? null)}
              size={size * 0.78}
              strokeWidth={1 + (s.thickness ?? 0.5) * 2}
            />
          </View>
        );
      })}
    </View>
  );
}

export default function GeometrixComunidadScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const qc = useQueryClient();

  const [page] = useState(1);
  const [deletingFor, setDeletingFor] = useState<SharedGlyph | null>(null);

  const { data, isLoading, refetch, isRefetching } = useGetSharedGlyphs({ page });
  const glyphs = data?.glyphs ?? [];

  const likeMutation = useToggleSharedGlyphLike();
  const deleteMutation = useUnshareGlyph();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const GAP = 14;
  const H_PAD = 20;
  const cardW = (width - H_PAD * 2 - GAP) / 2;
  const previewH = cardW * 0.82;

  useFocusEffect(
    useCallback(() => {
      refetch();
    }, [refetch]),
  );

  function handleLike(g: SharedGlyph) {
    likeMutation.mutate(
      { id: g.id },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetSharedGlyphsQueryKey() });
        },
        onError: () => {
          Alert.alert("Error", "No se pudo procesar el me gusta. Intentá de nuevo.");
        },
      },
    );
  }

  function handleDelete(g: SharedGlyph) {
    setDeletingFor(null);
    deleteMutation.mutate(
      { id: g.id },
      {
        onSuccess: () => {
          qc.invalidateQueries({ queryKey: getGetSharedGlyphsQueryKey() });
        },
        onError: () => {
          Alert.alert("Error", "No se pudo eliminar la composición.");
        },
      },
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: "#010102" }]}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={MURAL_BG}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: 100 + bottomPad,
          paddingTop: topPad + 12,
          paddingHorizontal: H_PAD,
        }}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor="#BE9650"
          />
        }
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() =>
              router.canGoBack()
                ? router.back()
                : router.replace("/(tabs)/geometrix" as never)
            }
            hitSlop={10}
            style={[
              styles.iconBtn,
              { backgroundColor: colors.card, borderColor: colors.border },
            ]}
          >
            <Feather name="arrow-left" size={18} color={colors.foreground} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Feather name="users" size={17} color={colors.primary} />
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>
              Comunidad
            </Text>
          </View>
          <View style={{ width: 38 }} />
        </View>

        {glyphs.length > 0 && (
          <Text style={[styles.count, { color: colors.mutedForeground }]}>
            {data?.total ?? glyphs.length} composici
            {(data?.total ?? glyphs.length) === 1 ? "ón" : "ones"}
          </Text>
        )}

        {/* Cargando */}
        {isLoading && (
          <View style={styles.centerState}>
            <ActivityIndicator color="#BE9650" size="large" />
            <Text style={[styles.stateText, { color: colors.mutedForeground }]}>
              Cargando…
            </Text>
          </View>
        )}

        {/* Feed vacío */}
        {!isLoading && glyphs.length === 0 && (
          <View style={styles.centerState}>
            <Feather name="users" size={40} color="#BE9650" style={{ opacity: 0.4 }} />
            <Text style={[styles.stateTitle, { color: colors.foreground }]}>
              Todavía no hay composiciones
            </Text>
            <Text style={[styles.stateText, { color: colors.mutedForeground }]}>
              Sé el primero en compartir una creación desde "Mis creaciones".
            </Text>
          </View>
        )}

        {/* Grilla 2 columnas */}
        {glyphs.length > 0 && (
          <View style={[styles.grid, { gap: GAP }]}>
            {glyphs.map((g) => (
              <View
                key={g.id}
                style={[
                  styles.card,
                  { width: cardW, borderColor: "#151c3a" },
                ]}
              >
                {/* Preview */}
                <View style={[styles.previewWrap, { height: previewH }]}>
                  <GlyphPreview glyph={g} size={previewH} />
                </View>

                {/* Info */}
                <View style={styles.info}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text
                      style={[styles.name, { color: colors.foreground }]}
                      numberOfLines={1}
                    >
                      {g.name}
                    </Text>
                    <Text
                      style={[styles.author, { color: colors.mutedForeground }]}
                      numberOfLines={1}
                    >
                      {g.author.displayName ?? g.author.username}
                    </Text>
                  </View>

                  {/* Acciones */}
                  <View style={styles.actions}>
                    {/* Like */}
                    <Pressable
                      onPress={() => handleLike(g)}
                      hitSlop={8}
                      style={styles.likeBtn}
                    >
                      <Feather
                        name="heart"
                        size={14}
                        color={g.likedByMe ? "#BE9650" : "#7A8FA8"}
                        style={g.likedByMe ? styles.likedHeart : undefined}
                      />
                      {g.likes > 0 && (
                        <Text
                          style={[
                            styles.likeCount,
                            { color: g.likedByMe ? "#BE9650" : colors.mutedForeground },
                          ]}
                        >
                          {g.likes}
                        </Text>
                      )}
                    </Pressable>

                    {/* Eliminar (solo propias) */}
                    {g.isMine && (
                      <Pressable
                        onPress={() => setDeletingFor(g)}
                        hitSlop={8}
                        style={styles.deleteBtn}
                      >
                        <Feather name="trash-2" size={13} color="#7A8FA8" />
                      </Pressable>
                    )}
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Confirmación de borrado */}
      <Modal
        visible={!!deletingFor}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setDeletingFor(null)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setDeletingFor(null)}>
          <Pressable style={styles.confirmCard} onPress={() => {}}>
            <LinearGradient
              colors={HOME_GRADIENT}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View style={styles.confirmIcon}>
              <Feather name="trash-2" size={24} color="#ef4444" />
            </View>
            <Text style={styles.confirmTitle}>Quitar del muro</Text>
            <Text style={styles.confirmSubtitle}>
              ¿Eliminás{" "}
              <Text style={styles.confirmName}>"{deletingFor?.name}"</Text> del muro
              de la comunidad?
            </Text>
            <View style={styles.confirmActions}>
              <Pressable
                style={styles.btnGhost}
                onPress={() => setDeletingFor(null)}
              >
                <Text style={styles.btnGhostText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={styles.btnDanger}
                onPress={() => deletingFor && handleDelete(deletingFor)}
              >
                <Text style={styles.btnDangerText}>Eliminar</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 16,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  headerTitle: { fontSize: 22, fontWeight: "700" },
  count: { fontSize: 13, marginBottom: 14 },

  centerState: {
    alignItems: "center",
    gap: 12,
    marginTop: 60,
    paddingHorizontal: 20,
  },
  stateTitle: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  stateText: { fontSize: 13, textAlign: "center", lineHeight: 20 },

  grid: { flexDirection: "row", flexWrap: "wrap" },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  previewWrap: { width: "100%", overflow: "hidden" },

  info: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingTop: 8,
    paddingBottom: 10,
  },
  name: { fontSize: 12, fontWeight: "700", marginBottom: 1 },
  author: { fontSize: 11 },

  actions: { flexDirection: "row", alignItems: "center", gap: 6, flexShrink: 0 },
  likeBtn: { flexDirection: "row", alignItems: "center", gap: 3 },
  likedHeart: { opacity: 1 },
  likeCount: { fontSize: 11, fontWeight: "600" },
  deleteBtn: { padding: 2 },

  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  confirmCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#151c3a",
    backgroundColor: "#06070F",
    overflow: "hidden",
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    alignItems: "center",
    gap: 10,
  },
  confirmIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.4)",
    marginBottom: 2,
  },
  confirmTitle: { fontSize: 19, fontWeight: "700", color: "#EDE1D3" },
  confirmSubtitle: {
    fontSize: 13.5,
    color: "#7A8FA8",
    textAlign: "center",
    lineHeight: 20,
  },
  confirmName: { color: "#EDE1D3", fontWeight: "600" },
  confirmActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    alignSelf: "stretch",
  },
  btnGhost: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#161f33",
    alignItems: "center",
  },
  btnGhostText: { fontSize: 14, fontWeight: "600", color: "#7A8FA8" },
  btnDanger: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#ef4444",
    alignItems: "center",
  },
  btnDangerText: { fontSize: 14, fontWeight: "700", color: "#ffffff" },
});
