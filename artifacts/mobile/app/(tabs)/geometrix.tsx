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
  type ImageSourcePropType,
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
  FadeIn,
  FadeOut,
  LinearTransition,
  runOnJS,
  type SharedValue,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredGlyph } from "@/components/SacredGlyph";
import { VolumeSlider } from "@/components/VolumeSlider";
import colorsConst from "@/constants/colors";
import { SOUND_MAP } from "@/config/sound-map";
import { GEOMETRIES, type GeometryId, type GeometryMeta } from "@/data/geometries";

const colors = colorsConst.light;
const HOME_GRADIENT = ["#090D20", "#080A18", "#06070F"] as const;
const CARD_BORDER = "#161f33";

/**
 * Dos módulos de música, lado a lado. Cada uno abre un desplegable con 3
 * opciones (solo imágenes) y reproduce su pista en loop, de forma
 * independiente del otro módulo.
 *
 * NOTA: los archivos de audio son provisorios (se reutilizan loops existentes
 * del mixer). Para las pistas reales, reemplazar el `sound` de cada track por
 * el require del .mp3 correspondiente en assets/audio/.
 */
type MusicTrack = {
  id: string;
  image: ImageSourcePropType;
  sound: ReturnType<typeof require> | undefined;
};
type MusicModule = { key: string; label: string; tracks: MusicTrack[] };

const MUSIC_MODULES: MusicModule[] = [
  {
    key: "music",
    label: "Música de fondo",
    tracks: [
      // ── Universo ──────────────────────────────────────────────
      {
        id: "cosmos-1",
        image: require("@/assets/images/geometrix/cosmos-1.png"),
        sound: SOUND_MAP["onda_gamma"],
      },
      {
        id: "cosmos-2",
        image: require("@/assets/images/geometrix/cosmos-2.png"),
        sound: SOUND_MAP["onda_beta"],
      },
      {
        id: "cosmos-3",
        image: require("@/assets/images/geometrix/cosmos-3.png"),
        sound: SOUND_MAP["solfeggio_528"],
      },
      // ── Naturaleza ────────────────────────────────────────────
      {
        id: "nature-1",
        image: require("@/assets/images/geometrix/nature-1.png"),
        sound: SOUND_MAP["bosque"],
      },
      {
        id: "nature-2",
        image: require("@/assets/images/geometrix/nature-2.png"),
        sound: SOUND_MAP["oceano"],
      },
      {
        id: "nature-3",
        image: require("@/assets/images/geometrix/nature-3.png"),
        sound: SOUND_MAP["lluvia"],
      },
      // ── Frecuencias ───────────────────────────────────────────
      {
        id: "freq-1",
        image: require("@/assets/images/geometrix/freq-1.png"),
        sound: SOUND_MAP["onda_alpha"],
      },
      {
        id: "freq-2",
        image: require("@/assets/images/geometrix/freq-2.png"),
        sound: SOUND_MAP["onda_theta"],
      },
      {
        id: "freq-3",
        image: require("@/assets/images/geometrix/freq-3.png"),
        sound: SOUND_MAP["onda_delta"],
      },
    ],
  },
];

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
  /** Zoom de pellizco (pinch): multiplicador libre, 1 = sin zoom. Permite
      pasar los márgenes (efecto wallpaper). */
  zoom: number;
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
    zoom: 1,
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
  liveZoom,
}: {
  geo: GeometryMeta;
  index: number;
  size: number;
  settings: GeoSettings;
  /** Shared value de zoom en vivo (pellizco). Si se pasa, manda sobre
      settings.zoom (lo usa solo la geometría seleccionada en el lienzo). */
  liveZoom?: SharedValue<number>;
}) {
  const rot = useSharedValue(0);
  const pulse = useSharedValue(0);
  const { color, rotate, opacity, breathe, thickness, scale, zoom } = settings;

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
  const safeZoom = Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
  // Tamaño base ("fit"): 0 → 0.4×, 1 → 1.0× (no corta contra los bordes).
  const userScale = 0.4 + safeScale * 0.6;
  // Zoom de pellizco: si hay shared value en vivo (geometría seleccionada en
  // el lienzo) manda ese; si no, el valor confirmado en settings. Espejo local
  // para reflejar cambios de settings cuando no hay pellizco activo.
  const localZoom = useSharedValue(safeZoom);
  useEffect(() => {
    if (!liveZoom) localZoom.value = safeZoom;
  }, [safeZoom, liveZoom, localZoom]);
  const zoomSV = liveZoom ?? localZoom;
  const aStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: rotate ? `${rot.value * 360 * dir}deg` : "0deg" },
      // Respiración (0.9–1.0) × tamaño elegido × zoom de pellizco.
      { scale: (breathe ? 0.9 + pulse.value * 0.1 : 1) * userScale * zoomSV.value },
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
  // Módulo de música con su desplegable abierto (null = ninguno).
  const [openModule, setOpenModule] = useState<string | null>(null);
  // Pista activa por módulo: { [moduleKey]: trackId | null }.
  const [activeTracks, setActiveTracks] = useState<Record<string, string | null>>({});
  const [settings, setSettings] = useState<Record<string, GeoSettings>>({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Alto medido de una tarjeta de ajustes para limitar el desplegable.
  const [cardHeight, setCardHeight] = useState<number | null>(null);
  // Alto real del sheet de ajustes, para anclar la vista previa justo encima.
  const [sheetHeight, setSheetHeight] = useState(0);
  // Modo inmersión: solo el fondo animado, sin interfaz.
  const [immersive, setImmersive] = useState(false);
  // Geometría con su menú contextual abierto (tap en miniatura).
  const [menuGeoId, setMenuGeoId] = useState<GeometryId | null>(null);
  // "Aislar": muestra solo esta geometría en el lienzo (sin quitar las demás).
  const [soloId, setSoloId] = useState<GeometryId | null>(null);
  // Geometría seleccionada para el pellizco (pinch) que ajusta su zoom.
  const [selectedId, setSelectedId] = useState<GeometryId | null>(null);
  // Zoom en vivo del pellizco (UI thread); se confirma a settings al soltar.
  const livePinch = useSharedValue(1);
  const pinchStart = useSharedValue(1);

  // Un reproductor por módulo (reproducen de forma independiente).
  const playersRef = useRef<Record<string, AudioPlayer | null>>({});

  const stopModule = useCallback((moduleKey: string) => {
    const p = playersRef.current[moduleKey];
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
    playersRef.current[moduleKey] = null;
  }, []);

  const stopAllSound = useCallback(() => {
    Object.keys(playersRef.current).forEach((k) => stopModule(k));
  }, [stopModule]);

  useEffect(() => {
    return () => stopAllSound();
  }, [stopAllSound]);

  // Glow de bienvenida: aparece y desaparece una sola vez al entrar (sutil).
  const glow = useSharedValue(0);
  const glowStyle = useAnimatedStyle(() => ({ opacity: glow.value }));

  // Al salir de Geometrix (las pestañas quedan montadas): detener el sonido y
  // resetear la UI. Al entrar: disparar el glow de bienvenida una sola vez.
  useFocusEffect(
    useCallback(() => {
      // Un único fade in/out al entrar a la pantalla (no se repite).
      glow.value = 0;
      glow.value = withDelay(
        150,
        withSequence(
          withTiming(0.85, { duration: 700, easing: Easing.out(Easing.ease) }),
          withTiming(0, { duration: 1100, easing: Easing.in(Easing.ease) }),
        ),
      );
      return () => {
        stopAllSound();
        setActiveTracks({});
        setOpenModule(null);
        setSettingsOpen(false);
        setImmersive(false);
        setMenuGeoId(null);
        setSoloId(null);
      };
    }, [stopAllSound, glow]),
  );

  const selectTrack = useCallback(
    async (moduleKey: string, track: MusicTrack) => {
      // Re-tap a la pista activa → apagar ese módulo.
      if (activeTracks[moduleKey] === track.id) {
        stopModule(moduleKey);
        setActiveTracks((prev) => ({ ...prev, [moduleKey]: null }));
        return;
      }
      // Solo un módulo puede sonar a la vez: apagar cualquier otro antes.
      stopAllSound();
      const src = track.sound;
      if (!src) {
        setActiveTracks({});
        return;
      }
      try {
        await setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true });
      } catch {
        /* ignore */
      }
      try {
        const p = createAudioPlayer(src, { updateInterval: 500 });
        p.loop = true;
        p.volume = 1;
        p.play();
        playersRef.current[moduleKey] = p;
        // Reemplazar el estado por completo: el otro módulo queda apagado.
        setActiveTracks({ [moduleKey]: track.id });
      } catch {
        stopAllSound();
        setActiveTracks({});
      }
    },
    [activeTracks, stopModule, stopAllSound],
  );

  const toggleGeometry = useCallback((id: GeometryId) => {
    setActive((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
    // Sembrar ajustes por defecto la primera vez que se activa (conservar si re-activa).
    setSettings((prev) => (prev[id] ? prev : { ...prev, [id]: defaultSettings(id) }));
    // Seleccionarla para el pellizco (si se quita, el effect reasigna).
    setSelectedId(id);
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

  // Confirmar el zoom del pellizco a settings al soltar (corre en JS thread).
  const commitZoom = useCallback(
    (id: GeometryId, z: number) => updateSetting(id, "zoom", z),
    [updateSetting],
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
  // Lo que se pinta en el lienzo: si hay "Aislar", solo esa geometría.
  const visibleMetas = soloId
    ? activeMetas.filter((g) => g.id === soloId)
    : activeMetas;
  const menuGeo = menuGeoId
    ? GEOMETRIES.find((g) => g.id === menuGeoId)
    : undefined;

  // Si una geometría se quita, limpiar su aislamiento / menú abierto y
  // reasignar la selección del pellizco a otra activa (o ninguna).
  useEffect(() => {
    if (soloId && !active.includes(soloId)) setSoloId(null);
    if (menuGeoId && !active.includes(menuGeoId)) setMenuGeoId(null);
    if (selectedId && !active.includes(selectedId)) {
      setSelectedId(active.length ? active[active.length - 1] : null);
    }
  }, [active, soloId, menuGeoId, selectedId]);

  // Geometría que responde al pellizco. Si hay "Aislar", solo esa es visible,
  // así que el pellizco debe apuntar a ella; si no, la seleccionada (o la
  // última activa).
  const pinchTargetId = soloId
    ? soloId
    : selectedId && active.includes(selectedId)
      ? selectedId
      : active.length
        ? active[active.length - 1]
        : null;

  // Mantener el zoom en vivo sincronizado con el valor confirmado del objetivo
  // (al cambiar de geometría o tras confirmar un pellizco).
  useEffect(() => {
    livePinch.value = pinchTargetId ? getSettings(pinchTargetId).zoom : 1;
  }, [pinchTargetId, getSettings, livePinch]);

  // Gesto de pellizco: escala libre del objetivo, permitiendo pasar los
  // márgenes (efecto wallpaper). Se confirma a settings al soltar.
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      pinchStart.value = livePinch.value;
    })
    .onUpdate((e) => {
      livePinch.value = Math.min(6, Math.max(0.3, pinchStart.value * e.scale));
    })
    .onEnd(() => {
      if (pinchTargetId) runOnJS(commitZoom)(pinchTargetId, livePinch.value);
    });

  // Vista previa lo más grande posible: cuadrado que llena el aire libre entre
  // el tope seguro y el sheet de ajustes (medido), limitado por el ancho.
  const previewFree = height - sheetHeight - insets.top - 12 - 36;
  const previewSize = sheetHeight
    ? Math.max(120, Math.min(width - 32, previewFree))
    : 0;
  // En inmersión la geometría llena la pantalla, centrada.
  const immersiveSize = Math.min(width, height) * 0.96;

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

          <View style={styles.soundModules}>
            {MUSIC_MODULES.map((mod) => {
              const activeId = activeTracks[mod.key] ?? null;
              const activeTrack = mod.tracks.find((t) => t.id === activeId);
              const cover = activeTrack?.image ?? mod.tracks[0].image;
              const isActive = !!activeId;
              return (
                <Pressable
                  key={mod.key}
                  onPress={() =>
                    setOpenModule((cur) => (cur === mod.key ? null : mod.key))
                  }
                  style={[styles.soundThumb, isActive && styles.soundThumbActive]}
                  accessibilityRole="button"
                  accessibilityLabel={mod.label}
                >
                  <Image source={cover} style={styles.soundThumbImg} contentFit="cover" />
                  {!isActive && (
                    <>
                      {/* Overlay negro sutil mientras está en reposo. */}
                      <View style={styles.thumbOverlay} pointerEvents="none" />
                      {/* Glow pulsante para llamar la atención. */}
                      <Animated.View
                        pointerEvents="none"
                        style={[styles.thumbGlow, glowStyle]}
                      />
                    </>
                  )}
                </Pressable>
              );
            })}
          </View>
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
            <GestureDetector gesture={pinchGesture}>
              <View style={[styles.canvas, { width: canvasSide, height: canvasSide }]}>
                {layerSize > 0 &&
                  visibleMetas.map((g, i) => (
                    <GeometryLayer
                      key={g.id}
                      geo={g}
                      index={i}
                      size={layerSize}
                      settings={getSettings(g.id)}
                      liveZoom={g.id === pinchTargetId ? livePinch : undefined}
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
            </GestureDetector>
          )}

          {/* Aparece en fade al activar la primera geometría */}
          {activeMetas.length > 0 && (
            <Animated.View
              entering={FadeIn.duration(360)}
              exiting={FadeOut.duration(220)}
              style={styles.actionPill}
            >
              <Pressable
                onPress={() => setSettingsOpen(true)}
                style={styles.pillBtn}
                accessibilityRole="button"
                accessibilityLabel="Personaliza las geometrías"
              >
                <Feather name="sliders" size={18} color={colors.mutedForeground} />
              </Pressable>
              <View style={styles.pillDivider} />
              <Pressable
                onPress={() => setImmersive(true)}
                style={styles.pillBtn}
                accessibilityRole="button"
                accessibilityLabel="Pantalla completa"
              >
                <Feather name="maximize" size={18} color={colors.mutedForeground} />
              </Pressable>
            </Animated.View>
          )}

          {/* Thumbnails de geometrías activas: fila centrada que se reacomoda
              al agregar/quitar (LinearTransition desplaza para dar espacio). */}
          {activeMetas.length > 0 && (
            <View style={styles.thumbsRow}>
              {activeMetas.map((g) => {
                const s = getSettings(g.id);
                const isSolo = soloId === g.id;
                const isSelected = pinchTargetId === g.id;
                const dimmed = soloId !== null && !isSolo;
                return (
                  <Animated.View
                    key={g.id}
                    entering={FadeIn.duration(320)}
                    exiting={FadeOut.duration(200)}
                    layout={LinearTransition.duration(320).easing(
                      Easing.inOut(Easing.ease),
                    )}
                    style={[styles.thumbItem, dimmed && { opacity: 0.4 }]}
                  >
                    {/* Tap en la imagen: solo seleccionar para ajustar tamaño. */}
                    <Pressable
                      onPress={() => setSelectedId(g.id)}
                      style={[
                        styles.thumb,
                        {
                          borderColor:
                            isSolo || isSelected ? s.color : s.color + "55",
                        },
                        (isSolo || isSelected) && { borderWidth: 2 },
                        isSelected && styles.thumbSelected,
                      ]}
                      accessibilityRole="button"
                      accessibilityLabel={`Seleccionar ${g.name} para ajustar el tamaño`}
                    >
                      <SacredGlyph id={g.id} color={s.color} size={26} strokeWidth={2} />
                    </Pressable>
                    {/* Flechita: abre el menú de opciones. */}
                    <Pressable
                      onPress={() => {
                        setSelectedId(g.id);
                        setMenuGeoId(g.id);
                      }}
                      style={styles.thumbCaret}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`Opciones de ${g.name}`}
                    >
                      <Feather
                        name="chevron-down"
                        size={18}
                        color={colors.mutedForeground}
                      />
                    </Pressable>
                  </Animated.View>
                );
              })}
            </View>
          )}
        </View>
      </View>

      {/* Modo inmersión: pantalla completa, solo fondo animado. Tap para salir.
          El fade del Modal da la transición zen sutil; la música sigue sonando. */}
      <Modal
        visible={immersive}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setImmersive(false)}
      >
        <Pressable
          style={styles.immersiveRoot}
          onPress={() => setImmersive(false)}
          accessibilityRole="button"
          accessibilityLabel="Salir de pantalla completa"
        >
          <LinearGradient
            colors={HOME_GRADIENT}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={StyleSheet.absoluteFill} pointerEvents="none">
            {visibleMetas.map((g, i) => (
              <GeometryLayer
                key={g.id}
                geo={g}
                index={i}
                size={immersiveSize}
                settings={getSettings(g.id)}
              />
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* Menú contextual de una miniatura: Personalizar / Aislar / Quitar. */}
      <Modal
        visible={!!menuGeo}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuGeoId(null)}
      >
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuGeoId(null)}>
          {menuGeo && (
            <Pressable style={styles.menuCard} onPress={() => {}}>
              <View style={styles.menuHeader}>
                <View
                  style={[
                    styles.menuGlyph,
                    { borderColor: getSettings(menuGeo.id).color + "55" },
                  ]}
                >
                  <SacredGlyph
                    id={menuGeo.id}
                    color={getSettings(menuGeo.id).color}
                    size={30}
                    strokeWidth={2}
                  />
                </View>
                <Text style={styles.menuTitle}>{menuGeo.name}</Text>
              </View>

              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setMenuGeoId(null);
                  setSettingsOpen(true);
                }}
              >
                <Feather name="sliders" size={18} color={colors.foreground} />
                <Text style={styles.menuItemText}>Personalizar</Text>
              </Pressable>

              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  setSoloId((prev) => (prev === menuGeo.id ? null : menuGeo.id));
                  setMenuGeoId(null);
                }}
              >
                <Feather
                  name={soloId === menuGeo.id ? "eye" : "eye-off"}
                  size={18}
                  color={colors.foreground}
                />
                <Text style={styles.menuItemText}>
                  {soloId === menuGeo.id ? "Mostrar todas" : "Ver solo esta"}
                </Text>
              </Pressable>

              <Pressable
                style={styles.menuItem}
                onPress={() => {
                  const id = menuGeo.id;
                  setMenuGeoId(null);
                  toggleGeometry(id);
                }}
              >
                <Feather name="trash-2" size={18} color="#D98A8A" />
                <Text style={[styles.menuItemText, { color: "#D98A8A" }]}>Quitar</Text>
              </Pressable>
            </Pressable>
          )}
        </Pressable>
      </Modal>

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
        {activeMetas.length > 0 && previewSize > 0 && (
          <View
            pointerEvents="none"
            style={[
              styles.previewWrap,
              // Anclado justo encima del sheet real (medido), llenando el aire
              // libre lo más posible.
              { bottom: sheetHeight + 12 },
            ]}
          >
            <Text style={styles.previewLabel}>Vista previa</Text>
            <View style={[styles.previewBox, { width: previewSize, height: previewSize }]}>
              {activeMetas.map((g, i) => (
                <GeometryLayer
                  key={g.id}
                  geo={g}
                  index={i}
                  size={previewSize * 0.96}
                  settings={getSettings(g.id)}
                />
              ))}
            </View>
          </View>
        )}

        <View
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            setSheetHeight((prev) => (prev === h ? prev : h));
          }}
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + 16 },
            // Reservar aire arriba para el preview y que nunca tape el header.
            activeMetas.length > 0 && { maxHeight: "68%" },
          ]}
        >
          {/* Mismo fondo que la pantalla de inicio, recortado al radius. */}
          <LinearGradient
            colors={HOME_GRADIENT}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
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
              style={[
                styles.sheetScroll,
                // Con 2+ geometrías, mostrar la primera tarjeta + un asomo de la
                // siguiente para que el desplegable no sea tan alto.
                activeMetas.length >= 2 && cardHeight
                  ? { maxHeight: cardHeight + 14 + 52 }
                  : null,
              ]}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 14 }}
            >
              {activeMetas.map((g, i) => {
                const s = getSettings(g.id);
                return (
                  <View
                    key={g.id}
                    style={styles.geoCard}
                    onLayout={
                      i === 0
                        ? (e) => {
                            const h = e.nativeEvent.layout.height;
                            setCardHeight((prev) => (prev === h ? prev : h));
                          }
                        : undefined
                    }
                  >
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

                    {/* Girar + Respiración (dos columnas) */}
                    <View style={styles.twoCol}>
                      <View style={[styles.col, styles.fieldRow]}>
                        <Text style={styles.fieldLabel}>Girar</Text>
                        <Toggle
                          value={s.rotate}
                          onChange={(v) => updateSetting(g.id, "rotate", v)}
                          color={s.color}
                        />
                      </View>
                      <View style={[styles.col, styles.fieldRow]}>
                        <Text style={styles.fieldLabel}>Respiración</Text>
                        <Toggle
                          value={s.breathe}
                          onChange={(v) => updateSetting(g.id, "breathe", v)}
                          color={s.color}
                        />
                      </View>
                    </View>

                    {/* Opacidad + Grosor (dos columnas) */}
                    <View style={styles.twoCol}>
                      <View style={styles.col}>
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
                      </View>
                      <View style={styles.col}>
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
                    </View>

                    {/* Tamaño (ancho completo) */}
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
                  </View>
                );
              })}
            </ScrollView>
          )}
        </View>
      </Modal>

      {/* Desplegable de música del módulo abierto (solo imágenes, drop-left) */}
      {openModule &&
        (() => {
          const mod = MUSIC_MODULES.find((m) => m.key === openModule);
          if (!mod) return null;
          // Anclar el desplegable bajo el thumbnail de su propio módulo.
          // Los thumbnails (44px, gap 10) están alineados a la derecha; el
          // último queda a right:20 y cada anterior se corre 54px más.
          const modIndex = MUSIC_MODULES.findIndex((m) => m.key === mod.key);
          const rightOffset =
            20 + (MUSIC_MODULES.length - 1 - modIndex) * (44 + 10);
          return (
            <>
              <Pressable
                style={StyleSheet.absoluteFill}
                onPress={() => setOpenModule(null)}
              />
              <View
                style={[styles.soundMenu, { top: insets.top + 61, right: rightOffset }]}
              >
                {mod.tracks.map((t) => {
                  const sel = activeTracks[mod.key] === t.id;
                  return (
                    <Pressable
                      key={t.id}
                      onPress={() => selectTrack(mod.key, t)}
                      style={[styles.soundTile, sel && styles.soundTileActive]}
                      accessibilityRole="button"
                      accessibilityLabel={`${mod.label} ${t.id}`}
                    >
                      <Image
                        source={t.image}
                        style={styles.soundTileImg}
                        contentFit="cover"
                      />
                      {sel && (
                        <View style={styles.soundTileSel} pointerEvents="none">
                          <Feather name="volume-2" size={16} color="#fff" />
                        </View>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </>
          );
        })()}
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

  soundModules: { flexDirection: "row", gap: 10 },
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
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  thumbGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#181c37",
  },

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

  actionPill: {
    marginTop: 16,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(122,143,168,0.35)",
  },
  pillBtn: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 18,
  },
  pillDivider: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    marginVertical: 6,
    backgroundColor: "rgba(122,143,168,0.35)",
  },
  thumbsRow: {
    marginTop: 14,
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  thumbItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  thumbCaret: {
    marginLeft: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbSelected: {
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  menuCard: {
    width: "100%",
    maxWidth: 280,
    borderRadius: 20,
    backgroundColor: "#10141C",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(122,143,168,0.25)",
    paddingVertical: 8,
  },
  menuHeader: {
    alignItems: "center",
    gap: 8,
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(122,143,168,0.18)",
  },
  menuGlyph: {
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: "500",
    color: colors.foreground,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  menuItemText: {
    fontSize: 15,
    fontWeight: "400",
    color: colors.foreground,
  },
  immersiveRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
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
    backgroundColor: "#06070F",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: "hidden",
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
  twoCol: { flexDirection: "row", gap: 16 },
  col: { flex: 1, minWidth: 0 },
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
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 5,
  },
  soundTile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#181c37",
  },
  soundTileActive: { borderColor: colors.primary },
  soundTileImg: { width: "100%", height: "100%" },
  soundTileSel: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.35)",
  },
});
