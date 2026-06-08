/**
 * Sección de Comunidad Geometrix para la pantalla de Inicio.
 * Muestra las últimas 4 composiciones compartidas (2 columnas × 2 filas),
 * con previews estáticas de color y glifos, y un enlace a la pantalla completa.
 */
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

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
const MAX_PREVIEW = 4;

// ── Preview estática (sin animación, más liviana para el home) ────────────────
function StaticGlyphPreview({
  glyph,
  previewH,
}: {
  glyph: SharedGlyph;
  previewH: number;
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
      {recipe.active.map((id) => {
        const geoId = id as GeometryId;
        const s = recipe.settings[id] as GeoSettings | undefined;
        if (!s) return null;
        if (!GEOMETRIES.find((g) => g.id === geoId)) return null;
        const angle = Number.isFinite(s.manualAngle) ? s.manualAngle : 0;
        return (
          <View
            key={id}
            style={[StyleSheet.absoluteFill, styles.layerCenter]}
            pointerEvents="none"
          >
            <View
              style={{
                opacity: Math.max(0.15, s.opacity * recipe.master.opacity),
                transform: [{ rotate: `${angle}deg` }],
              }}
            >
              <SacredGlyph
                id={geoId}
                color={s.color ?? "#BE9650"}
                gradient={gradientColors(s.gradientId ?? null)}
                size={glyphSize}
                strokeWidth={1 + (s.thickness ?? 0.5) * 2}
              />
            </View>
          </View>
        );
      })}
    </>
  );
}

// ── Card individual ───────────────────────────────────────────────────────────
function GlyphCard({ glyph, cardW }: { glyph: SharedGlyph; cardW: number }) {
  const colors = useColors();
  const previewH = cardW * 0.9;

  return (
    <Pressable
      onPress={() => router.push("/geometrix-comunidad" as never)}
      style={[styles.card, { width: cardW, borderColor: "#151c3a" }]}
    >
      {/* Preview */}
      <View style={[styles.preview, { height: previewH }]}>
        <StaticGlyphPreview glyph={glyph} previewH={previewH} />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.cardName, { color: colors.foreground }]} numberOfLines={1}>
            {glyph.name}
          </Text>
          <Text style={[styles.cardAuthor, { color: colors.mutedForeground }]} numberOfLines={1}>
            {glyph.author.displayName ?? glyph.author.username}
          </Text>
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

  const { data, isLoading } = useGetSharedGlyphs(
    { page: 1 },
    { query: { queryKey: getGetSharedGlyphsQueryKey({ page: 1 }), refetchInterval: 5 * 60_000 } },
  );

  const glyphs = (data?.glyphs ?? []).slice(0, MAX_PREVIEW);

  if (!isLoading && glyphs.length === 0) return null;

  return (
    <View style={styles.section}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <Feather name="users" size={15} color={colors.primary} />
          <Text style={styles.sectionTitle}>Comunidad</Text>
        </View>
        <Pressable onPress={() => router.push("/geometrix-comunidad" as never)} hitSlop={8}>
          <Text style={[styles.verTodo, { color: colors.primary }]}>Ver todo</Text>
        </Pressable>
      </View>

      {/* Cargando */}
      {isLoading && (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />
      )}

      {/* Grilla 2 × 2 */}
      {!isLoading && glyphs.length > 0 && (
        <View style={[styles.grid, { gap: GRID_GAP }]}>
          {glyphs.map((g) => (
            <GlyphCard key={g.id} glyph={g} cardW={cardW} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: GRID_PAD,
    marginBottom: 0,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 11,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.3,
    color: "#FFFFFF",
  },
  verTodo: { fontSize: 13, fontWeight: "400" },

  grid: { flexDirection: "row", flexWrap: "wrap" },

  card: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  preview: { width: "100%", overflow: "hidden" },
  layerCenter: { alignItems: "center", justifyContent: "center" },

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
