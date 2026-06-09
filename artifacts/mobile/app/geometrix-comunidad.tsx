/**
 * Muro de la comunidad — composiciones Geometrix compartidas por los usuarios.
 * Grilla 2-col con previews en vivo (animables), nombre del autor, me gusta y
 * opción de eliminar las propias. Pull-to-refresh recarga el feed.
 */
import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useEffect, useState } from "react";
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
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import {
  useGetSharedGlyphs,
  useToggleSharedGlyphLike,
  useUnshareGlyph,
  type SharedGlyph,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { getGetSharedGlyphsQueryKey } from "@workspace/api-client-react";

import { SacredGlyph } from "@/components/SacredGlyph";
import { baseOf, GEOMETRIES, type GeometryId } from "@/data/geometries";
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

// ── Capa animable (misma lógica que PreviewGlyph en geometrix-creaciones) ──
function GlyphLayer({
  id,
  settings,
  masterOpacity,
  motion,
  index,
  glyphSize,
  playing,
}: {
  id: GeometryId;
  settings: GeoSettings;
  masterOpacity: number;
  motion: boolean;
  index: number;
  glyphSize: number;
  playing: boolean;
}) {
  const rot = useSharedValue(0);
  const pulse = useSharedValue(0);
  const fade = useSharedValue(1);

  const { rotate, rotateLeft, rotateSpeed, breathe, breatheAmount, fadeLoop } = settings;
  const active = playing && motion;
  const spin = (rotate || rotateLeft) && active;
  const breath = breathe && active;
  const dir = rotateLeft ? -1 : 1;

  const safeSpeed = Number.isFinite(rotateSpeed) ? Math.max(0, Math.min(1, rotateSpeed)) : 0.5;
  const spinDuration = ((38000 + index * 6000) / (0.5 + safeSpeed * 2.5)) * 1.6;
  const safeAmount = Number.isFinite(breatheAmount) ? Math.max(0, Math.min(1, breatheAmount)) : 0.5;
  const breatheDepth = 0.04 + safeAmount * 0.2;
  const restAngle = Number.isFinite(settings.manualAngle) ? settings.manualAngle : 0;

  useEffect(() => {
    if (!spin) { cancelAnimation(rot); rot.value = 0; return; }
    rot.value = withRepeat(withTiming(1, { duration: spinDuration, easing: Easing.linear }), -1, false);
    return () => cancelAnimation(rot);
  }, [spin, spinDuration, rot]);

  useEffect(() => {
    if (!breath) { cancelAnimation(pulse); pulse.value = 0; return; }
    pulse.value = withRepeat(withTiming(1, { duration: 6000 + index * 800, easing: Easing.inOut(Easing.ease) }), -1, true);
    return () => cancelAnimation(pulse);
  }, [breath, index, pulse]);

  useEffect(() => {
    if (fadeLoop && active) {
      fade.value = withRepeat(withTiming(0.15, { duration: 4200 + index * 600, easing: Easing.inOut(Easing.ease) }), -1, true);
      return () => cancelAnimation(fade);
    }
    cancelAnimation(fade);
    fade.value = withTiming(1, { duration: 400 });
  }, [fadeLoop, active, index, fade]);

  const baseOpacity = Math.max(0.15, settings.opacity * masterOpacity);
  const aStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: spin ? `${rot.value * 360 * dir}deg` : `${restAngle}deg` },
      { scale: breath ? 1 - breatheDepth + pulse.value * breatheDepth : 1 },
    ],
    opacity: baseOpacity * fade.value,
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.layerCenter, aStyle]} pointerEvents="none">
      <SacredGlyph
        id={id}
        color={settings.color ?? "#BE9650"}
        gradient={gradientColors(settings.gradientId ?? null)}
        size={glyphSize}
        strokeWidth={1 + (settings.thickness ?? 0.5) * 2}
      />
    </Animated.View>
  );
}

// ── ¿Tiene movimiento animable? ──────────────────────────────────────────────
function glyphHasMotion(glyph: SharedGlyph): boolean {
  if (!glyph.recipe.master.motion) return false;
  return glyph.recipe.active.some((id) => {
    const s = glyph.recipe.settings[id] as GeoSettings | undefined;
    return !!s && (s.rotate || s.rotateLeft || s.breathe || s.fadeLoop);
  });
}

// ── Preview de card: llena el contenedor parent ──────────────────────────────
function GlyphPreview({
  glyph,
  previewH,
  playing,
}: {
  glyph: SharedGlyph;
  previewH: number;
  playing: boolean;
}) {
  const { recipe } = glyph;
  const bgFactor = brightnessFactor(recipe.master.bgBrightness);
  const bgGrad = bgGradientColors(recipe.master.bgGradientId ?? null);
  const bgColors = recipe.master.bgColor
    ? ([scaleHex(recipe.master.bgColor, bgFactor), scaleHex(recipe.master.bgColor, bgFactor)] as const)
    : scaleColors(bgGrad ?? HOME_GRADIENT, bgFactor);

  // El glyphSize se basa en previewH (altura del contenedor), igual que en
  // geometrix-creaciones donde se usa previewH * 0.78 para que quepan los glifos.
  const glyphSize = previewH * 0.78;

  return (
    <>
      <LinearGradient
        colors={bgColors as readonly [string, string, ...string[]]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {recipe.active.map((id, i) => {
        const geoId = baseOf(id);
        const s = recipe.settings[id] as GeoSettings | undefined;
        if (!s) return null;
        if (!GEOMETRIES.find((g) => g.id === geoId)) return null;
        return (
          <GlyphLayer
            key={id}
            id={geoId}
            settings={s}
            masterOpacity={recipe.master.opacity}
            motion={recipe.master.motion}
            index={i}
            glyphSize={glyphSize}
            playing={playing}
          />
        );
      })}
    </>
  );
}

export default function GeometrixComunidadScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const qc = useQueryClient();

  const [page] = useState(1);
  const [deletingFor, setDeletingFor] = useState<SharedGlyph | null>(null);
  const [playingId, setPlayingId] = useState<number | null>(null);

  const { data, isLoading, refetch, isRefetching } = useGetSharedGlyphs({ page });
  const glyphs = data?.glyphs ?? [];

  const likeMutation = useToggleSharedGlyphLike();
  const deleteMutation = useUnshareGlyph();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const GAP = 14;
  const H_PAD = 20;
  const cardW = (width - H_PAD * 2 - GAP) / 2;
  const previewH = cardW * 0.9;

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
          <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#BE9650" />
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
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="arrow-left" size={18} color={colors.foreground} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Feather name="users" size={17} color={colors.primary} />
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Comunidad</Text>
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
            <Text style={[styles.stateText, { color: colors.mutedForeground }]}>Cargando…</Text>
          </View>
        )}

        {/* Empty state */}
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
            {glyphs.map((g) => {
              const canPlay = glyphHasMotion(g);
              const isPlaying = playingId === g.id;
              return (
                <View
                  key={g.id}
                  style={[styles.card, { width: cardW, borderColor: "#151c3a" }]}
                >
                  {/* Preview: ocupa todo el ancho de la card */}
                  <View style={[styles.preview, { height: previewH }]}>
                    <GlyphPreview glyph={g} previewH={previewH} playing={isPlaying} />

                    {/* Botón play/pause — solo si la composición tiene movimiento */}
                    {canPlay && (
                      <Pressable
                        onPress={() => setPlayingId((prev) => (prev === g.id ? null : g.id))}
                        hitSlop={8}
                        style={styles.playBtn}
                      >
                        <Feather
                          name={isPlaying ? "pause" : "play"}
                          size={13}
                          color="#EDE1D3"
                          style={isPlaying ? undefined : { marginLeft: 1 }}
                        />
                      </Pressable>
                    )}
                  </View>

                  {/* Info */}
                  <View style={styles.info}>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
                        {g.name}
                      </Text>
                      <Pressable
                        onPress={() =>
                          router.push({
                            pathname: "/usuario/[id]",
                            params: { id: g.author.id },
                          } as never)
                        }
                        hitSlop={6}
                      >
                        <Text style={[styles.author, styles.authorLink, { color: colors.primary }]} numberOfLines={1}>
                          {g.author.displayName ?? g.author.username}
                        </Text>
                      </Pressable>
                    </View>

                    {/* Like */}
                    <Pressable onPress={() => handleLike(g)} hitSlop={8} style={styles.likeBtn}>
                      <Feather
                        name="heart"
                        size={14}
                        color={g.likedByMe ? "#BE9650" : "#7A8FA8"}
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
                  </View>
                </View>
              );
            })}
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
              <Text style={styles.confirmName}>"{deletingFor?.name}"</Text> del muro de la comunidad?
            </Text>
            <View style={styles.confirmActions}>
              <Pressable style={styles.btnGhost} onPress={() => setDeletingFor(null)}>
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

  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
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

  centerState: { alignItems: "center", gap: 12, marginTop: 60, paddingHorizontal: 20 },
  stateTitle: { fontSize: 17, fontWeight: "700", textAlign: "center" },
  stateText: { fontSize: 13, textAlign: "center", lineHeight: 20 },

  grid: { flexDirection: "row", flexWrap: "wrap" },
  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },

  // Preview llena el 100% del ancho de la card (no tiene width fijo propio)
  preview: { width: "100%", overflow: "hidden" },
  layerCenter: { alignItems: "center", justifyContent: "center" },

  playBtn: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.18)",
    alignItems: "center",
    justifyContent: "center",
  },

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

  likeBtn: { flexDirection: "row", alignItems: "center", gap: 3 },
  likeCount: { fontSize: 11, fontWeight: "600" },
  authorLink: { textDecorationLine: "underline", opacity: 0.9 },

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
  confirmSubtitle: { fontSize: 13.5, color: "#7A8FA8", textAlign: "center", lineHeight: 20 },
  confirmName: { color: "#EDE1D3", fontWeight: "600" },
  confirmActions: { flexDirection: "row", gap: 10, marginTop: 14, alignSelf: "stretch" },
  btnGhost: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#161f33",
    alignItems: "center",
  },
  btnGhostText: { fontSize: 14, fontWeight: "600", color: "#7A8FA8" },
  btnDanger: { flex: 1, paddingVertical: 12, borderRadius: 12, backgroundColor: "#ef4444", alignItems: "center" },
  btnDangerText: { fontSize: 14, fontWeight: "700", color: "#ffffff" },
});
