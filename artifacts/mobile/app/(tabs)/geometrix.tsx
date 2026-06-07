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
  Modal,
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
import { VolumeSlider } from "@/components/VolumeSlider";
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

/** Tamaño del recuadro de vista previa en el panel de Ajustes. */
const PREVIEW_BOX = 150;
const PREVIEW_LAYER = PREVIEW_BOX * 0.96;

/** Paleta de colores para personalizar cada geometría. */
const PALETTE = [
  "#BE9650",
  "#D6A85B",
  "#EDE1D3",
  "#7FD1C0",
  "#7AA8E0",
  "#B69BE0",
  "#E0989B",
  "#9BD6A8",
] as const;

/** Ajustes editables por geometría. Los sliders guardan 0–1. */
type GeoSettings = {
  color: string;
  rotate: boolean;
  opacity: number;
  breathe: boolean;
  /** Grosor de línea: 0 = 1px, 1 = ~6px. */
  thickness: number;
  /** Tamaño: 0 = más chica, 1 = tamaño completo. */
  scale: number;
};

function defaultSettings(id: GeometryId): GeoSettings {
  const meta = GEOMETRIES.find((g) => g.id === id);
  return {
    color: meta?.color ?? colors.primary,
    rotate: true,
    opacity: 1,
    breathe: true,
    thickness: 0,
    scale: 1,
  };
}

// ── Interruptor sutil (on/off) ────────────────────────────────────
function Toggle({
  value,
  onChange,
  color,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  color: string;
}) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      style={[styles.toggle, { backgroundColor: value ? color : "rgba(255,255,255,0.10)" }]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
    >
      <View style={[styles.toggleKnob, value && styles.toggleKnobOn]} />
    </Pressable>
  );
}

// ── Capa animada del fondo ────────────────────────────────────────
function GeometryLayer({
  geo,
  index,
  size,
  settings,
}: {
  geo: GeometryMeta;
  index: number;
  size: number;
  settings: GeoSettings;
}) {
  const rot = useSharedValue(0);
  const pulse = useSharedValue(0);
  const { color, rotate, opacity, breathe, thickness, scale } = settings;

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
  // Defensa ante estado corrupto/parcial: nunca dejar pasar NaN al worklet/SVG.
  const safeScale = Number.isFinite(scale) ? scale : 1;
  const safeThickness = Number.isFinite(thickness) ? thickness : 0;
  // Tamaño: 0 → 0.4×, 1 → 1.0× (tope en 1.0 para no cortar contra los bordes).
  const userScale = 0.4 + safeScale * 0.6;
  const aStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: rotate ? `${rot.value * 360 * dir}deg` : "0deg" },
      // Respiración: escala 0.9–1.0, multiplicada por el tamaño elegido.
      { scale: (breathe ? 0.9 + pulse.value * 0.1 : 1) * userScale },
    ],
    opacity,
  }));

  // Trazo base de 1px real: el viewBox es 0–100, así que 1px = 100 / size.
  // El grosor escala de 1px (thickness 0) a ~6px (thickness 1).
  const base1px = size > 0 ? 100 / size : 1;
  const sw = base1px * (1 + safeThickness * 5);

  return (
    <Animated.View style={[styles.layer, aStyle]} pointerEvents="none">
      <SacredGlyph id={geo.id} color={color} size={size} strokeWidth={sw} />
    </Animated.View>
  );
}

export default function GeometrixScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();

  const [active, setActive] = useState<GeometryId[]>([]);
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSound, setActiveSound] = useState<string | null>(null);
  const [settings, setSettings] = useState<Record<string, GeoSettings>>({});
  const [settingsOpen, setSettingsOpen] = useState(false);

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
        setSettingsOpen(false);
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
    // Sembrar ajustes por defecto la primera vez que se activa (conservar si re-activa).
    setSettings((prev) => (prev[id] ? prev : { ...prev, [id]: defaultSettings(id) }));
  }, []);

  const updateSetting = useCallback(
    <K extends keyof GeoSettings>(id: GeometryId, key: K, value: GeoSettings[K]) => {
      setSettings((prev) => ({
        ...prev,
        [id]: { ...(prev[id] ?? defaultSettings(id)), [key]: value },
      }));
    },
    [],
  );

  const getSettings = useCallback(
    // Merge contra defaults para tolerar settings parciales (ej. estado
    // creado antes de que existieran `scale`/`thickness`).
    (id: GeometryId): GeoSettings => ({ ...defaultSettings(id), ...(settings[id] ?? {}) }),
    [settings],
  );

  const [canvas, setCanvas] = useState({ w: 0, h: 0 });
  // Fila horizontal: 3 tiles completas + asomo de la 4ta para invitar al scroll.
  const tileW = (width - 20 * 2 - 12 * 3) / 3.3;
  // Lienzo cuadrado y centrado: lado = lado menor del espacio disponible.
  const canvasSide = canvas.w > 0 ? Math.min(canvas.w, canvas.h) : 0;
  // La capa se ajusta al lado del lienzo para que la geometría entre
  // completa al rotar (no se corta contra los bordes).
  const layerSize = canvasSide * 0.96;
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

        {/* Galería de geometrías (una fila horizontal, scrolleable) */}
        <ScrollView
          horizontal
          style={styles.grid}
          contentContainerStyle={styles.gridContent}
          showsHorizontalScrollIndicator={false}
        >
          <View style={styles.gridRow}>
            {GEOMETRIES.map((g) => {
              const sel = active.includes(g.id);
              // Reflejar el color personalizado en el tile cuando está activo.
              const tileColor = sel ? getSettings(g.id).color : "#7A8FA8";
              return (
                <Pressable
                  key={g.id}
                  onPress={() => toggleGeometry(g.id)}
                  style={[
                    styles.tile,
                    { width: tileW, borderColor: sel ? tileColor : CARD_BORDER },
                    sel && { backgroundColor: "rgba(255,255,255,0.04)" },
                  ]}
                >
                  <View style={styles.tileGlyph}>
                    <SacredGlyph
                      id={g.id}
                      color={tileColor}
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
                    <View style={[styles.tileCheck, { backgroundColor: tileColor }]}>
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

        {/* Fondo interactivo (cuadrado, centrado) */}
        <View
          style={styles.canvasWrap}
          onLayout={(e) => {
            const { width: w, height: h } = e.nativeEvent.layout;
            setCanvas((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
          }}
        >
          {canvasSide > 0 && (
            <View style={[styles.canvas, { width: canvasSide, height: canvasSide }]}>
              {layerSize > 0 &&
                activeMetas.map((g, i) => (
                  <GeometryLayer
                    key={g.id}
                    geo={g}
                    index={i}
                    size={layerSize}
                    settings={getSettings(g.id)}
                  />
                ))}

              {active.length === 0 && (
                <View style={styles.empty} pointerEvents="none">
                  <Feather name="hexagon" size={30} color="rgba(190,150,80,0.4)" />
                  <Text style={styles.emptyText}>Toca una geometría para comenzar</Text>
                  <Text style={styles.emptySub}>Combina varias y crea tu composición</Text>
                </View>
              )}
            </View>
          )}

          {/* Acceso sutil a los ajustes por geometría */}
          <Pressable
            onPress={() => setSettingsOpen(true)}
            style={styles.settingsBtn}
            accessibilityRole="button"
            accessibilityLabel="Ajustes de geometrías"
          >
            <Feather name="settings" size={18} color={colors.mutedForeground} />
            <Text style={styles.settingsBtnText}>Ajustes</Text>
          </Pressable>
        </View>
      </View>

      {/* Panel de ajustes por geometría */}
      <Modal
        visible={settingsOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setSettingsOpen(false)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setSettingsOpen(false)} />

        {/* Vista previa en vivo: flota arriba para no tapar los controles del
            sheet. Vive dentro del Modal, así se cierra junto con los ajustes. */}
        {activeMetas.length > 0 && (
          <View
            pointerEvents="none"
            style={[
              styles.previewWrap,
              // Anclar justo encima del sheet (68% del alto), no pegado al tope.
              { top: Math.max(insets.top + 8, height * 0.32 - PREVIEW_BOX - 32) },
            ]}
          >
            <View style={styles.previewBox}>
              {activeMetas.map((g, i) => (
                <GeometryLayer
                  key={g.id}
                  geo={g}
                  index={i}
                  size={PREVIEW_LAYER}
                  settings={getSettings(g.id)}
                />
              ))}
            </View>
            <Text style={styles.previewLabel}>Vista previa</Text>
          </View>
        )}

        <View
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + 16 },
            // Reservar aire arriba para el preview y que nunca tape el header.
            activeMetas.length > 0 && { maxHeight: "68%" },
          ]}
        >
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Ajustes</Text>
            <Pressable
              onPress={() => setSettingsOpen(false)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Cerrar ajustes"
            >
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {activeMetas.length === 0 ? (
            <View style={styles.sheetEmpty}>
              <Feather name="hexagon" size={26} color="rgba(190,150,80,0.4)" />
              <Text style={styles.sheetEmptyText}>
                Activa una geometría para personalizarla
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.sheetScroll}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 14 }}
            >
              {activeMetas.map((g) => {
                const s = getSettings(g.id);
                return (
                  <View key={g.id} style={styles.geoCard}>
                    <View style={styles.geoCardHead}>
                      <SacredGlyph id={g.id} color={s.color} size={26} strokeWidth={2.4} />
                      <Text style={styles.geoCardName}>{g.name}</Text>
                    </View>

                    {/* Color */}
                    <Text style={styles.fieldLabel}>Color</Text>
                    <View style={styles.swatchRow}>
                      {PALETTE.map((c) => {
                        const on = s.color.toLowerCase() === c.toLowerCase();
                        return (
                          <Pressable
                            key={c}
                            onPress={() => updateSetting(g.id, "color", c)}
                            style={[
                              styles.swatch,
                              { backgroundColor: c },
                              on && styles.swatchOn,
                            ]}
                            accessibilityRole="button"
                            accessibilityLabel={`Color ${c}`}
                          />
                        );
                      })}
                    </View>

                    {/* Girar */}
                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Girar</Text>
                      <Toggle
                        value={s.rotate}
                        onChange={(v) => updateSetting(g.id, "rotate", v)}
                        color={s.color}
                      />
                    </View>

                    {/* Respiración */}
                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Respiración</Text>
                      <Toggle
                        value={s.breathe}
                        onChange={(v) => updateSetting(g.id, "breathe", v)}
                        color={s.color}
                      />
                    </View>

                    {/* Opacidad */}
                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Opacidad</Text>
                      <Text style={styles.fieldValue}>{Math.round(s.opacity * 100)}%</Text>
                    </View>
                    <VolumeSlider
                      value={s.opacity}
                      onChange={(v) => updateSetting(g.id, "opacity", Math.max(0.1, v))}
                      color={s.color}
                      trackColor="rgba(255,255,255,0.12)"
                    />

                    {/* Tamaño */}
                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Tamaño</Text>
                      <Text style={styles.fieldValue}>{Math.round(s.scale * 100)}%</Text>
                    </View>
                    <VolumeSlider
                      value={s.scale}
                      onChange={(v) => updateSetting(g.id, "scale", v)}
                      color={s.color}
                      trackColor="rgba(255,255,255,0.12)"
                    />

                    {/* Grosor de línea */}
                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Grosor</Text>
                      <Text style={styles.fieldValue}>{Math.round(s.thickness * 100)}%</Text>
                    </View>
                    <VolumeSlider
                      value={s.thickness}
                      onChange={(v) => updateSetting(g.id, "thickness", v)}
                      color={s.color}
                      trackColor="rgba(255,255,255,0.12)"
                    />
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </Modal>

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

  grid: { flexGrow: 0 },
  gridContent: { paddingVertical: 2, paddingRight: 20 },
  gridRow: { flexDirection: "row", gap: 12 },
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

  canvasWrap: {
    flex: 1,
    marginBottom: 12,
    alignItems: "center",
    justifyContent: "flex-start",
  },
  canvas: {
    alignItems: "center",
    justifyContent: "center",
  },
  layer: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },

  settingsBtn: {
    marginTop: 16,
    alignItems: "center",
    gap: 3,
    paddingVertical: 4,
    paddingHorizontal: 12,
  },
  settingsBtnText: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.mutedForeground,
    letterSpacing: 0.3,
  },

  // Interruptor
  toggle: {
    width: 42,
    height: 24,
    borderRadius: 12,
    padding: 3,
    justifyContent: "center",
  },
  toggleKnob: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EDE1D3",
  },
  toggleKnobOn: { transform: [{ translateX: 18 }] },

  // Bottom sheet de ajustes
  sheetBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)" },
  previewWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    gap: 6,
  },
  previewBox: {
    width: PREVIEW_BOX,
    height: PREVIEW_BOX,
    borderRadius: 18,
    overflow: "hidden",
    backgroundColor: "rgba(8,10,24,0.88)",
    borderWidth: 1,
    borderColor: CARD_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  previewLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: colors.mutedForeground,
    backgroundColor: "rgba(8,10,24,0.7)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: "hidden",
  },
  sheet: {
    backgroundColor: "#0B0F14",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: CARD_BORDER,
    paddingHorizontal: 18,
    paddingTop: 10,
    maxHeight: "78%",
  },
  sheetHandle: {
    alignSelf: "center",
    width: 38,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginBottom: 10,
  },
  sheetHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sheetTitle: { fontSize: 20, fontWeight: "700", color: colors.foreground },
  sheetScroll: { flexGrow: 0 },
  sheetEmpty: { alignItems: "center", gap: 10, paddingVertical: 40 },
  sheetEmptyText: { fontSize: 14, color: colors.mutedForeground, textAlign: "center" },

  geoCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: "rgba(255,255,255,0.02)",
    padding: 14,
    gap: 10,
  },
  geoCardHead: { flexDirection: "row", alignItems: "center", gap: 10 },
  geoCardName: { fontSize: 15, fontWeight: "700", color: colors.foreground },

  fieldLabel: { fontSize: 13, fontWeight: "600", color: colors.mutedForeground },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fieldValue: { fontSize: 13, fontWeight: "600", color: colors.foreground },

  swatchRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  swatch: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: "transparent",
  },
  swatchOn: { borderColor: "#EDE1D3" },

  empty: { alignItems: "center", gap: 6 },
  emptyText: { fontSize: 14, fontWeight: "600", color: colors.foreground, marginTop: 4 },
  emptySub: { fontSize: 12, color: colors.mutedForeground },

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
