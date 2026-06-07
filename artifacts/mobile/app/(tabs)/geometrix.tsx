/**
 * GEOMETRIX — galería de geometrías sagradas + fondo animado interactivo.
 * El usuario activa geometrías por capas para componer un fondo en vivo,
 * con un sonido de fondo opcional (menú drop-left arriba a la derecha).
 */
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useFocusEffect } from "expo-router";
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from "expo-audio";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredGlyph } from "@/components/SacredGlyph";
import colorsConst from "@/constants/colors";
import { SOUND_MAP } from "@/config/sound-map";
import { getSoundImage } from "@/config/sound-images";
import { GEOMETRIES, type GeometryId, type GeometryMeta } from "@/data/geometries";
import { getSoundById } from "@/data/sounds";

const colors = colorsConst.light;
const HOME_GRADIENT = ["#090D20", "#080A18", "#06070F"] as const;
const CARD_BORDER = "#161f33";

/** Los 5 sonidos de fondo del menú (todos con archivo + imagen). */
const SOUND_PICKS = ["lluvia", "bosque", "oceano", "fogata", "grillos"] as const;

// ── Capa animada del fondo ────────────────────────────────────────
function GeometryLayer({
  geo,
  index,
  size,
}: {
  geo: GeometryMeta;
  index: number;
  size: number;
}) {
  const rot = useSharedValue(0);
  const pulse = useSharedValue(0);

  useEffect(() => {
    rot.value = withRepeat(
      withTiming(1, { duration: 38000 + index * 6000, easing: Easing.linear }),
      -1,
      false,
    );
    pulse.value = withRepeat(
      withTiming(1, { duration: 6000 + index * 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [index, pulse, rot]);

  const dir = index % 2 === 0 ? 1 : -1;
  const aStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: `${rot.value * 360 * dir}deg` },
      { scale: 0.94 + pulse.value * 0.08 },
    ],
    opacity: 0.5 + pulse.value * 0.4,
  }));

  return (
    <Animated.View style={[styles.layer, aStyle]} pointerEvents="none">
      <SacredGlyph id={geo.id} color={geo.color} size={size} strokeWidth={1.1} />
    </Animated.View>
  );
}

export default function GeometrixScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const [active, setActive] = useState<GeometryId[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSound, setActiveSound] = useState<string | null>(null);

  const playerRef = useRef<AudioPlayer | null>(null);

  const stopSound = useCallback(() => {
    const p = playerRef.current;
    if (p) {
      try {
        p.pause();
      } catch {
        /* ignore */
      }
      try {
        p.remove();
      } catch {
        /* ignore */
      }
    }
    playerRef.current = null;
  }, []);

  useEffect(() => {
    return () => stopSound();
  }, [stopSound]);

  // Las pestañas quedan montadas: detener el sonido al salir de Geometrix
  // (no alcanza con el cleanup de unmount).
  useFocusEffect(
    useCallback(() => {
      return () => {
        stopSound();
        setActiveSound(null);
        setMenuOpen(false);
      };
    }, [stopSound]),
  );

  const selectSound = useCallback(
    async (id: string) => {
      if (activeSound === id) {
        stopSound();
        setActiveSound(null);
        return;
      }
      stopSound();
      const src = SOUND_MAP[id];
      if (!src) {
        setActiveSound(null);
        return;
      }
      try {
        await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true });
      } catch {
        /* ignore */
      }
      const p = createAudioPlayer(src, { updateInterval: 500 });
      p.loop = true;
      p.volume = 1;
      p.play();
      playerRef.current = p;
      setActiveSound(id);
    },
    [activeSound, stopSound],
  );

  const toggleGeometry = useCallback((id: GeometryId) => {
    setActive((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
  }, []);

  const tileW = (width - 20 * 2 - 12 * 2) / 3;
  const layerSize = Math.min(width * 0.92, 460);
  const activeMetas = GEOMETRIES.filter((g) => active.includes(g.id));
  const soundImg = activeSound ? getSoundImage(activeSound) : undefined;

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={HOME_GRADIENT}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={[styles.content, { paddingTop: insets.top + 12 }]}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Geometrix</Text>
            <Text style={styles.subtitle}>Crea tus geometrías relajantes</Text>
          </View>

          <Pressable
            onPress={() => setMenuOpen((v) => !v)}
            style={[styles.soundThumb, activeSound && styles.soundThumbActive]}
            accessibilityRole="button"
            accessibilityLabel="Elegir sonido de fondo"
          >
            {soundImg ? (
              <Image source={soundImg} style={styles.soundThumbImg} contentFit="cover" />
            ) : (
              <Feather name="music" size={20} color={colors.foreground} />
            )}
          </Pressable>
        </View>

        {/* Galería de geometrías (3 columnas, scrolleable) */}
        <ScrollView
          style={styles.grid}
          contentContainerStyle={styles.gridContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.gridRow}>
            {GEOMETRIES.map((g) => {
              const sel = active.includes(g.id);
              return (
                <Pressable
                  key={g.id}
                  onPress={() => toggleGeometry(g.id)}
                  style={[
                    styles.tile,
                    { width: tileW, borderColor: sel ? g.color : CARD_BORDER },
                    sel && { backgroundColor: "rgba(255,255,255,0.04)" },
                  ]}
                >
                  <View style={styles.tileGlyph}>
                    <SacredGlyph
                      id={g.id}
                      color={sel ? g.color : "#7A8FA8"}
                      size={tileW * 0.66}
                      strokeWidth={1.4}
                    />
                  </View>
                  <Text
                    numberOfLines={1}
                    style={[styles.tileLabel, { color: sel ? colors.foreground : colors.mutedForeground }]}
                  >
                    {g.name}
                  </Text>
                  {sel && (
                    <View style={[styles.tileCheck, { backgroundColor: g.color }]}>
                      <Feather name="check" size={11} color="#0B0F14" />
                    </View>
                  )}
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Línea divisora */}
        <View style={styles.divider} />

        {/* Fondo interactivo */}
        <View style={styles.canvas}>
          <LinearGradient
            colors={["rgba(86,97,168,0.10)", "rgba(6,7,15,0.0)"]}
            style={StyleSheet.absoluteFill}
          />
          {activeMetas.map((g, i) => (
            <GeometryLayer key={g.id} geo={g} index={i} size={layerSize} />
          ))}

          {active.length === 0 ? (
            <View style={styles.empty} pointerEvents="none">
              <Feather name="hexagon" size={30} color="rgba(190,150,80,0.4)" />
              <Text style={styles.emptyText}>Toca una geometría para comenzar</Text>
              <Text style={styles.emptySub}>Combina varias y crea tu composición</Text>
            </View>
          ) : (
            <Pressable
              onPress={() => setActive([])}
              style={styles.clearBtn}
              accessibilityRole="button"
              accessibilityLabel="Limpiar composición"
            >
              <Feather name="x" size={13} color={colors.mutedForeground} />
              <Text style={styles.clearText}>Limpiar ({active.length})</Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Menú de sonidos (drop-left) */}
      {menuOpen && (
        <>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => setMenuOpen(false)} />
          <View style={[styles.soundMenu, { top: insets.top + 58 }]}>
            {SOUND_PICKS.map((id) => {
              const snd = getSoundById(id);
              const img = getSoundImage(id);
              const sel = activeSound === id;
              return (
                <Pressable
                  key={id}
                  onPress={() => selectSound(id)}
                  style={[styles.soundRow, sel && styles.soundRowActive]}
                >
                  {img ? (
                    <Image source={img} style={styles.soundRowImg} contentFit="cover" />
                  ) : (
                    <View style={[styles.soundRowImg, styles.soundRowImgFallback]}>
                      <Feather name="music" size={14} color={colors.mutedForeground} />
                    </View>
                  )}
                  <Text
                    numberOfLines={1}
                    style={[styles.soundRowText, { color: sel ? colors.foreground : colors.mutedForeground }]}
                  >
                    {snd?.name ?? id}
                  </Text>
                  {sel && <Feather name="volume-2" size={14} color={colors.primary} />}
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#06070F" },
  content: { flex: 1, paddingHorizontal: 20 },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  headerText: { flex: 1, paddingRight: 12 },
  title: { fontSize: 30, fontWeight: "700", color: colors.foreground, letterSpacing: 0.3 },
  subtitle: { fontSize: 14, color: colors.mutedForeground, marginTop: 3 },

  soundThumb: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: CARD_BORDER,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  soundThumbActive: { borderColor: colors.primary },
  soundThumbImg: { width: "100%", height: "100%" },

  grid: { maxHeight: "40%", flexGrow: 0 },
  gridContent: { paddingBottom: 4 },
  gridRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  tile: {
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.02)",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  tileGlyph: { flex: 1, alignItems: "center", justifyContent: "center" },
  tileLabel: { fontSize: 11, fontWeight: "600", textAlign: "center", paddingHorizontal: 4 },
  tileCheck: {
    position: "absolute",
    top: 7,
    right: 7,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginVertical: 14,
  },

  canvas: {
    flex: 1,
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: "rgba(8,10,24,0.5)",
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  layer: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },

  empty: { alignItems: "center", gap: 6 },
  emptyText: { fontSize: 14, fontWeight: "600", color: colors.foreground, marginTop: 4 },
  emptySub: { fontSize: 12, color: colors.mutedForeground },

  clearBtn: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: "rgba(8,10,24,0.7)",
    borderWidth: 1,
    borderColor: CARD_BORDER,
  },
  clearText: { fontSize: 12, fontWeight: "600", color: colors.mutedForeground },

  soundMenu: {
    position: "absolute",
    right: 20,
    width: 196,
    borderRadius: 16,
    backgroundColor: "#0B0F14",
    borderWidth: 1,
    borderColor: CARD_BORDER,
    padding: 6,
    gap: 2,
  },
  soundRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: 11,
  },
  soundRowActive: { backgroundColor: "rgba(255,255,255,0.05)" },
  soundRowImg: { width: 30, height: 30, borderRadius: 8 },
  soundRowImgFallback: {
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  soundRowText: { flex: 1, fontSize: 13, fontWeight: "600" },
});
