/**
 * Sección de Comunidad Geometrix para la pantalla de Inicio.
 * Muestra las últimas 10 composiciones compartidas (2 columnas),
 * con previews animables (play/pause por card) y enlace a la pantalla completa.
 */
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import {
  getGetSharedGlyphsQueryKey,
  useGetSharedGlyphs,
  type SharedGlyph,
} from "@workspace/api-client-react";

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

const GRID_PAD = 20;
const GRID_GAP = 12;
const MAX_PREVIEW = 10;

// ── ¿Tiene movimiento animable? ──────────────────────────────────────────────
function glyphHasMotion(glyph: SharedGlyph): boolean {
  if (!glyph.recipe.master.motion) return false;
  return glyph.recipe.active.some((id) => {
    const s = glyph.recipe.settings[id] as GeoSettings | undefined;
    return !!s && (s.rotate || s.rotateLeft || s.breathe || s.fadeLoop);
  });
}

// ── Capa animable (mismo patrón que geometrix-comunidad) ─────────────────────
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

// ── Preview (estática cuando no está en play, animada cuando sí) ─────────────
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

  const glyphSize = previewH * 0.72;

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
        const geoId = id as GeometryId;
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

// ── Card individual ───────────────────────────────────────────────────────────
function GlyphCard({
  glyph,
  cardW,
  playing,
  onTogglePlay,
}: {
  glyph: SharedGlyph;
  cardW: number;
  playing: boolean;
  onTogglePlay: () => void;
}) {
  const colors = useColors();
  const previewH = cardW * 0.9;
  const canPlay = glyphHasMotion(glyph);

  return (
    <Pressable
      onPress={() => router.push("/geometrix-comunidad" as never)}
      style={[styles.card, { width: cardW, borderColor: "#151c3a" }]}
    >
      {/* Preview */}
      <View style={[styles.preview, { height: previewH }]}>
        <GlyphPreview glyph={glyph} previewH={previewH} playing={playing} />

        {/* Botón play/pause — solo si tiene movimiento */}
        {canPlay && (
          <Pressable
            onPress={(e) => { e.stopPropagation(); onTogglePlay(); }}
            hitSlop={8}
            style={styles.playBtn}
          >
            <Feather
              name={playing ? "pause" : "play"}
              size={13}
              color="#EDE1D3"
              style={playing ? undefined : { marginLeft: 1 }}
            />
          </Pressable>
        )}
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>
            {glyph.name}
          </Text>
          <Pressable
            onPress={(e) => {
              e.stopPropagation();
              router.push({ pathname: "/usuario/[id]", params: { id: glyph.author.id } } as never);
            }}
            hitSlop={6}
          >
            <Text style={[styles.cardAuthor, { color: colors.mutedForeground }]} numberOfLines={1}>
              {glyph.author.displayName ?? glyph.author.username}
            </Text>
          </Pressable>
        </View>
        {glyph.likes > 0 && (
          <View style={styles.likes}>
            <Feather name="heart" size={11} color="#BE9650" />
            <Text style={[styles.likeCount, { color: colors.mutedForeground }]}>{glyph.likes}</Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

// ── Sección principal ─────────────────────────────────────────────────────────
export function GeometrixCommunitySection() {
  const colors = useColors();
  const { width } = useWindowDimensions();
  const cardW = (width - GRID_PAD * 2 - GRID_GAP) / 2;
  const [playingId, setPlayingId] = useState<number | null>(null);

  const { data, isLoading } = useGetSharedGlyphs(
    { page: 1 },
    { query: { queryKey: getGetSharedGlyphsQueryKey({ page: 1 }), refetchInterval: 5 * 60_000 } },
  );

  const glyphs = (data?.glyphs ?? []).slice(0, MAX_PREVIEW);

  if (!isLoading && glyphs.length === 0) return null;

  return (
    <View style={styles.section}>
      {/* Header */}
      <View style={styles.headerLeft}>
        <Image
          source={require("@/assets/images/geometrix/cubo-3.png")}
          style={styles.cuboIcon}
        />
        <Text style={styles.sectionTitle}>Geometrixs de la comunidad</Text>
      </View>

      {/* Cargando */}
      {isLoading && (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />
      )}

      {/* Grilla 2 × N */}
      {!isLoading && glyphs.length > 0 && (
        <View style={[styles.grid, { gap: GRID_GAP }]}>
          {glyphs.map((g) => (
            <GlyphCard
              key={g.id}
              glyph={g}
              cardW={cardW}
              playing={playingId === g.id}
              onTogglePlay={() => setPlayingId((prev) => (prev === g.id ? null : g.id))}
            />
          ))}
        </View>
      )}

      {/* Ver todas — solo si hay más de 10 */}
      {!isLoading && (data?.total ?? 0) > MAX_PREVIEW && (
        <Pressable
          onPress={() => router.push("/geometrix-comunidad" as never)}
          style={({ pressed }) => [styles.verTodasBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Text style={[styles.verTodasText, { color: colors.primary }]}>Ver todas</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: GRID_PAD,
    marginBottom: 0,
  },
  cuboIcon: { width: 18, height: 18, resizeMode: "contain", opacity: 0.9 },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.3,
    color: "#FFFFFF",
  },
  verTodasBtn: {
    alignItems: "center",
    marginTop: 14,
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(190,150,80,0.28)",
  },
  verTodasText: { fontSize: 14, fontWeight: "600" },

  grid: { flexDirection: "row", flexWrap: "wrap" },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
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
    paddingTop: 7,
    paddingBottom: 9,
  },
  cardName: { fontSize: 12, fontWeight: "700", marginBottom: 1 },
  cardAuthor: { fontSize: 11 },

  likes: { flexDirection: "row", alignItems: "center", gap: 3, flexShrink: 0 },
  likeCount: { fontSize: 11 },
});
