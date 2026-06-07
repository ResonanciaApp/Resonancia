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
  Alert,
  type ImageSourcePropType,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeOut,
  LinearTransition,
  runOnJS,
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
import { GEOMETRIES, PALETTE, type GeometryId, type GeometryMeta } from "@/data/geometries";

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
        // Ovnimoon — Process of Life (WAV original comprimido a AAC 160k).
        sound: require("@/assets/audio/geometrix/track-1.m4a"),
      },
      {
        id: "cosmos-2",
        image: require("@/assets/images/geometrix/cosmos-2.png"),
        // Toxeed — Connect to Light (AAC original, carátula removida).
        sound: require("@/assets/audio/geometrix/track-2.m4a"),
      },
      {
        id: "cosmos-3",
        image: require("@/assets/images/geometrix/cosmos-3.png"),
        // Toxeed — SARASWATI (AAC original, carátula removida).
        sound: require("@/assets/audio/geometrix/track-3.m4a"),
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

/** Ajustes editables por geometría. Los sliders guardan 0–1. */
type GeoSettings = {
  color: string;
  /** Giro on/off (toggle de cabecera). */
  rotate: boolean;
  /** Velocidad de giro 0–1: 0 = muy lento, 1 = rápido. */
  rotateSpeed: number;
  opacity: number;
  /** Respiración on/off (toggle de cabecera). */
  breathe: boolean;
  /** Intensidad de la respiración 0–1: 0 = sutil, 1 = profunda. */
  breatheAmount: number;
  /** Fundido cíclico: la geometría aparece y desaparece suavemente en bucle. */
  fadeLoop: boolean;
  /** Glow propio 0–1: halo aditivo del trazo (se suma al glow general). */
  glow: number;
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
    // Estática por defecto: el usuario activa el movimiento (giro/respirar/
    // fade) en los ajustes por capa cuando quiera.
    rotate: false,
    rotateSpeed: 0.5,
    opacity: 1,
    breathe: false,
    breatheAmount: 0.5,
    fadeLoop: false,
    glow: 0,
    thickness: 0,
    scale: 1,
    zoom: 1,
  };
}

/** Ajustes generales (panel maestro) que afectan a todas las capas a la vez. */
type GlobalSettings = {
  /** Opacidad maestra 0–1: multiplica la opacidad propia de cada capa. */
  opacity: number;
  /** Movimiento global on/off: congela giro + respiración de todas las capas. */
  motion: boolean;
  /** Glow maestro 0–1: halo aditivo en los trazos de todas las capas. */
  glow: number;
};

// ── Interruptor sutil (on/off) ────────────────────────────────────
function Toggle({
  value,
  onChange,
  color,
  compact = false,
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  color: string;
  compact?: boolean;
}) {
  return (
    <Pressable
      onPress={() => onChange(!value)}
      style={[
        compact ? styles.toggleCompact : styles.toggle,
        { backgroundColor: value ? color : "rgba(255,255,255,0.10)" },
      ]}
      accessibilityRole="switch"
      accessibilityState={{ checked: value }}
    >
      <View
        style={[
          compact ? styles.toggleKnobCompact : styles.toggleKnob,
          value && (compact ? styles.toggleKnobCompactOn : styles.toggleKnobOn),
        ]}
      />
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
  masterOpacity = 1,
  motion = true,
  glow = 0,
}: {
  geo: GeometryMeta;
  index: number;
  size: number;
  settings: GeoSettings;
  /** Zoom en vivo (pellizco) como número: si se pasa, manda sobre settings.zoom
      y REDIBUJA el SVG a ese tamaño en tiempo real (lo usa solo la geometría
      seleccionada en el lienzo). No se aplica por transform → trazo nítido. */
  liveZoom?: number;
  /** Opacidad maestra (panel general): multiplica la de esta capa. */
  masterOpacity?: number;
  /** Movimiento global (panel general): si es false, congela giro + respiración. */
  motion?: boolean;
  /** Glow maestro (panel general) 0–1: halo aditivo en el trazo. */
  glow?: number;
}) {
  const rot = useSharedValue(0);
  const pulse = useSharedValue(0);
  const fade = useSharedValue(1);
  const {
    color,
    rotate,
    rotateSpeed,
    opacity,
    breathe,
    breatheAmount,
    fadeLoop,
    glow: geoGlow,
    thickness,
    scale,
    zoom,
  } = settings;

  // Velocidad de giro: a mayor rotateSpeed, menor duración (más rápido).
  // 0 → ~2× más lento, 0.5 → base, 1 → ~5× más rápido. Nunca se detiene aquí
  // (el on/off lo maneja el toggle `rotate`).
  const safeSpeed = Number.isFinite(rotateSpeed) ? Math.max(0, Math.min(1, rotateSpeed)) : 0.5;
  const spinDuration = (38000 + index * 6000) / (0.5 + safeSpeed * 2.5);

  // El movimiento general (panel maestro) detiene las animaciones de TODAS las
  // capas a la vez. Al apagarlo se cancela y se vuelve al reposo (0deg / sin
  // pulso); al encenderlo arranca desde cero, así no hay salto al reanudar.
  // El giro vuelve a sembrarse al cambiar la velocidad: como no se resetea
  // rot.value, continúa desde su ángulo actual sin salto de posición.
  useEffect(() => {
    if (!motion) {
      cancelAnimation(rot);
      cancelAnimation(pulse);
      rot.value = 0;
      pulse.value = 0;
      return;
    }
    rot.value = withRepeat(
      withTiming(1, { duration: spinDuration, easing: Easing.linear }),
      -1,
      false,
    );
    pulse.value = withRepeat(
      withTiming(1, { duration: 6000 + index * 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, [index, pulse, rot, motion, spinDuration]);

  // Fundido cíclico: la capa baja a un mínimo tenue y vuelve, en bucle suave.
  // Se congela junto con el movimiento general; al apagarlo vuelve a opacidad 1.
  useEffect(() => {
    if (fadeLoop && motion) {
      fade.value = withRepeat(
        withTiming(0.15, { duration: 4200 + index * 600, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      cancelAnimation(fade);
      fade.value = withTiming(1, { duration: 400 });
    }
  }, [fadeLoop, motion, fade, index]);

  const dir = index % 2 === 0 ? 1 : -1;
  // Defensa ante estado corrupto/parcial: nunca dejar pasar NaN al worklet/SVG.
  const safeScale = Number.isFinite(scale) ? scale : 1;
  const safeThickness = Number.isFinite(thickness) ? thickness : 0;
  const safeZoom = Number.isFinite(zoom) && zoom > 0 ? zoom : 1;
  // Tamaño base ("fit"): 0 → 0.4×, 1 → 1.0× (no corta contra los bordes).
  const userScale = 0.4 + safeScale * 0.6;
  // Zoom efectivo: durante el pellizco EN VIVO manda el valor en curso (número
  // que llega por prop); en reposo, el confirmado en settings. El zoom NO se
  // aplica por transform sino plegándolo al tamaño REAL del SVG (effectiveSize),
  // para que la geometría se REDIBUJE nítida en tiempo real, el grosor del trazo
  // no engorde y no haya parpadeo en el traspaso transform→tamaño al soltar.
  const effZoom = liveZoom != null && liveZoom > 0 ? liveZoom : safeZoom;
  const committedMag = userScale * effZoom;
  // Movimiento general (panel maestro): congela giro + respiración de TODAS las
  // capas a la vez sin borrar el ajuste propio de cada una.
  const spin = rotate && motion;
  const breath = breathe && motion;
  // Profundidad de la respiración: 0.04 (sutil) → 0.24 (profunda). Define cuánto
  // se encoge en el valle del pulso (el pico siempre es 1.0).
  const safeAmount = Number.isFinite(breatheAmount) ? Math.max(0, Math.min(1, breatheAmount)) : 0.5;
  const breatheDepth = 0.04 + safeAmount * 0.2;
  const safeMaster = Number.isFinite(masterOpacity) ? masterOpacity : 1;
  const aStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: spin ? `${rot.value * 360 * dir}deg` : "0deg" },
        // Respiración (1 - profundidad … 1). El zoom NO viaja en el transform:
        // se aplica redibujando el SVG (effectiveSize) para que quede nítido.
        {
          scale: breath ? 1 - breatheDepth + pulse.value * breatheDepth : 1,
        },
      ],
      // Opacidad propia × general (maestra) × fundido cíclico.
      opacity: opacity * safeMaster * fade.value,
    };
  });

  // Tamaño REAL al que se redibuja el SVG = tamaño base × magnificación
  // confirmada. Al crecer el size, el SVG (vector) queda nítido a cualquier
  // escala (sin pixelado por estiramiento de un transform).
  const effectiveSize = size * committedMag;
  // Trazo base de 1px real: el viewBox es 0–100, así que 1px = 100 / size.
  // Se calcula sobre effectiveSize → el grosor VISUAL se mantiene constante
  // aunque se amplíe (el trazo no engorda al hacer zoom).
  const base1px = effectiveSize > 0 ? 100 / effectiveSize : 1;
  const sw = base1px * (1 + safeThickness * 5);
  // Glow efectivo: el propio de la capa se suma al general (panel maestro),
  // acotado a 0–1. Halo aditivo detrás del trazo (copias más anchas y tenues).
  const safeGeoGlow = Number.isFinite(geoGlow) ? Math.max(0, Math.min(1, geoGlow)) : 0;
  const safeMasterGlow = Number.isFinite(glow) ? Math.max(0, Math.min(1, glow)) : 0;
  const safeGlow = Math.min(1, safeGeoGlow + safeMasterGlow);

  return (
    <Animated.View style={[styles.layer, aStyle]} pointerEvents="none">
      {safeGlow > 0 && (
        <>
          <View style={[styles.layer, { opacity: 0.16 * safeGlow }]}>
            <SacredGlyph
              id={geo.id}
              color={color}
              size={effectiveSize}
              strokeWidth={sw * (3 + safeGlow * 3)}
            />
          </View>
          <View style={[styles.layer, { opacity: 0.26 * safeGlow }]}>
            <SacredGlyph
              id={geo.id}
              color={color}
              size={effectiveSize}
              strokeWidth={sw * (1.8 + safeGlow * 1.6)}
            />
          </View>
        </>
      )}
      <SacredGlyph id={geo.id} color={color} size={effectiveSize} strokeWidth={sw} />
    </Animated.View>
  );
}

export default function GeometrixScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  // Alto de la tab bar inferior (réplica del cálculo en (tabs)/_layout.tsx),
  // para que el lienzo no quede tapado por el menú de la app.
  const bottomPb = Platform.OS === "web" ? 8 : insets.bottom;
  const tabBarHeight = 56 + Math.round(bottomPb / 2) + bottomPb;

  const [active, setActive] = useState<GeometryId[]>([]);
  // Módulo de música con su desplegable abierto (null = ninguno).
  const [openModule, setOpenModule] = useState<string | null>(null);
  // Pista activa por módulo: { [moduleKey]: trackId | null }. Solo "está sonando".
  const [activeTracks, setActiveTracks] = useState<Record<string, string | null>>({});
  // Última pista ELEGIDA por módulo (persiste aunque se apague): mantiene la
  // imagen del thumbnail tras detener la música (no vuelve a la 1ª por defecto).
  const [lastTrack, setLastTrack] = useState<Record<string, string | null>>({});
  const [settings, setSettings] = useState<Record<string, GeoSettings>>({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Geometría que se está personalizando (la de la flechita pulsada). El panel
  // por capa muestra SOLO esta, no todas las activas.
  const [settingsGeoId, setSettingsGeoId] = useState<GeometryId | null>(null);
  // Ajustes generales (panel maestro): se aplican sobre TODAS las capas.
  const [master, setMaster] = useState<GlobalSettings>({
    opacity: 1,
    motion: true,
    glow: 0,
  });
  const [generalOpen, setGeneralOpen] = useState(false);
  const [generalSheetHeight, setGeneralSheetHeight] = useState(0);
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
  // Desplegable de acciones (flecha bajo la divisora): colapsado por defecto.
  const [pillOpen, setPillOpen] = useState(false);
  // Opacidad de la píldora de acciones: fade puro (sin movimiento) al plegar.
  // Se mantiene SIEMPRE montada (pointerEvents none al cerrar) para que el
  // layout no se reacomode y solo cambie la opacidad.
  const pillOpacity = useSharedValue(0);
  const pillStyle = useAnimatedStyle(() => ({ opacity: pillOpacity.value }));
  useEffect(() => {
    pillOpacity.value = withTiming(pillOpen ? 1 : 0, {
      duration: pillOpen ? 240 : 160,
    });
  }, [pillOpen, pillOpacity]);
  // Zoom en vivo del pellizco (UI thread); se confirma a settings al soltar.
  const livePinch = useSharedValue(1);
  const pinchStart = useSharedValue(1);
  // Zoom en vivo del objetivo como NÚMERO (no transform): redibuja el SVG en
  // cada frame para que el trazo quede nítido durante el pellizco y no haya
  // parpadeo al soltar. null = no se está pellizcando (usa el confirmado).
  const [livePinchNum, setLivePinchNum] = useState<number | null>(null);

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

  // El thumbnail principal queda "con opacidad" (atenuado) mientras el
  // desplegable está COLAPSADO, y se ILUMINA al abrirlo para elegir pista.
  // Una sola capa de oscurecido animada cubre ambos estados (reposo + activo).
  const rest = useSharedValue(1);
  const restStyle = useAnimatedStyle(() => ({ opacity: rest.value }));
  useEffect(() => {
    rest.value = withTiming(openModule ? 0 : 1, {
      duration: 450,
      easing: Easing.inOut(Easing.ease),
    });
  }, [openModule, rest]);

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
        setSettingsGeoId(null);
        setGeneralOpen(false);
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
        // Recordar la elección: la imagen del thumbnail persiste tras apagar.
        setLastTrack((prev) => ({ ...prev, [moduleKey]: track.id }));
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

  // Confirmar el zoom del pellizco a settings (corre en JS thread). El "en vivo"
  // se limpia aparte en onFinalize (que SIEMPRE corre, también al cancelarse el
  // gesto) y siempre DESPUÉS de este commit, así el objetivo pasa del tamaño en
  // vivo al confirmado (idéntico valor) sin un frame intermedio.
  const commitZoom = useCallback(
    (id: GeometryId, z: number) => updateSetting(id, "zoom", z),
    [updateSetting],
  );

  // Guardar la composición actual (placeholder hasta tener persistencia real).
  const saveComposition = useCallback(() => {
    Alert.alert(
      "Composición guardada",
      "Tu composición de geometrías se guardó en este dispositivo.",
    );
  }, []);

  const [canvas, setCanvas] = useState({ w: 0, h: 0 });
  // Fila horizontal: 3 tiles completas + asomo de la 4ta para invitar al scroll.
  const tileW = (width - 20 * 2 - 12 * 3) / 3.3;
  // Lienzo cuadrado y centrado: lado = lado menor del espacio disponible.
  const canvasSide = canvas.w > 0 ? Math.min(canvas.w, canvas.h) : 0;
  // La capa se ajusta al lado del lienzo para que la geometría entre
  // completa al rotar (no se corta contra los bordes).
  const layerSize = canvasSide * 0.96;
  const activeMetas = GEOMETRIES.filter((g) => active.includes(g.id));
  const hasActive = activeMetas.length > 0;
  // Acciones de la píldora desplegable (flecha bajo la divisora). Solo iconos.
  const pillActions: { key: string; icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void }[] = [
    { key: "settings", icon: "sliders", label: "Ajustes generales", onPress: () => setGeneralOpen(true) },
    { key: "immersive", icon: "maximize", label: "Pantalla completa", onPress: () => setImmersive(true) },
    { key: "save", icon: "save", label: "Guardar", onPress: saveComposition },
  ];
  // Sin geometrías activas se colapsa el desplegable (la flecha desaparece).
  useEffect(() => {
    if (!hasActive) setPillOpen(false);
  }, [hasActive]);
  // Lo que se pinta en el lienzo: si hay "Aislar", solo esa geometría.
  const visibleMetas = soloId
    ? activeMetas.filter((g) => g.id === soloId)
    : activeMetas;
  const menuGeo = menuGeoId
    ? GEOMETRIES.find((g) => g.id === menuGeoId)
    : undefined;
  // Geometría que muestra el panel por capa (solo si sigue activa).
  const settingsGeo =
    settingsGeoId && active.includes(settingsGeoId)
      ? GEOMETRIES.find((g) => g.id === settingsGeoId)
      : undefined;

  // Si una geometría se quita, limpiar su aislamiento / menú abierto y
  // reasignar la selección del pellizco a otra activa (o ninguna).
  useEffect(() => {
    if (soloId && !active.includes(soloId)) setSoloId(null);
    if (menuGeoId && !active.includes(menuGeoId)) setMenuGeoId(null);
    // Si se quita la geometría en edición, cerrar su panel por capa.
    if (settingsGeoId && !active.includes(settingsGeoId)) {
      setSettingsOpen(false);
      setSettingsGeoId(null);
    }
    if (selectedId && !active.includes(selectedId)) {
      setSelectedId(active.length ? active[active.length - 1] : null);
    }
  }, [active, soloId, menuGeoId, settingsGeoId, selectedId]);

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
      const z = Math.min(6, Math.max(0.3, pinchStart.value * e.scale));
      livePinch.value = z;
      // Redibuja el SVG del objetivo en tiempo real (zoom = tamaño, no transform).
      runOnJS(setLivePinchNum)(z);
    })
    .onEnd(() => {
      if (pinchTargetId) runOnJS(commitZoom)(pinchTargetId, livePinch.value);
    })
    // SIEMPRE corre (éxito o cancelación), después de onEnd. Limpia el zoom en
    // vivo → el objetivo vuelve al confirmado; si el gesto se canceló sin
    // confirmar, revierte al último zoom guardado (no queda pegado al en vivo).
    .onFinalize(() => {
      runOnJS(setLivePinchNum)(null);
    });

  // Vista previa lo más grande posible: cuadrado que llena el aire libre entre
  // el tope seguro y el sheet de ajustes (medido), limitado por el ancho.
  const previewFree = height - sheetHeight - insets.top - 12 - 36;
  // Vista previa más grande (los controles del panel se compactaron para
  // dejarle más aire), limitada por el ancho y el espacio libre medido.
  const previewSize = sheetHeight
    ? Math.max(96, Math.min((width - 32) * 0.744, previewFree * 0.936))
    : 0;
  // Vista previa del panel general (mismo cálculo, anclada a su propio sheet).
  const generalPreviewFree = height - generalSheetHeight - insets.top - 12 - 36;
  const generalPreviewSize = generalSheetHeight
    ? Math.max(120, Math.min(width - 32, generalPreviewFree))
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
              // Imagen del thumbnail = última pista ELEGIDA (persiste tras
              // apagar); si nunca se eligió, la 1ª por defecto. NO depende de
              // si está sonando.
              const coverId = lastTrack[mod.key] ?? activeId;
              const coverTrack = mod.tracks.find((t) => t.id === coverId);
              const cover = coverTrack?.image ?? mod.tracks[0].image;
              const isActive = !!activeId;
              return (
                <Pressable
                  key={mod.key}
                  onPress={() => {
                    // Si ya hay una pista sonando, este tap la APAGA (y quita el
                    // icono). El siguiente tap reabre el desplegable para elegir
                    // otra desde cero.
                    if (isActive) {
                      stopModule(mod.key);
                      setActiveTracks((prev) => ({ ...prev, [mod.key]: null }));
                      setOpenModule(null);
                      return;
                    }
                    setOpenModule((cur) => (cur === mod.key ? null : mod.key));
                  }}
                  style={styles.soundThumb}
                  accessibilityRole="button"
                  accessibilityLabel={mod.label}
                >
                  <Image
                    source={cover}
                    style={styles.soundThumbImg}
                    contentFit="cover"
                    transition={0}
                    cachePolicy="memory-disk"
                    recyclingKey="geometrix-sound-thumb"
                  />
                  {/* "Con opacidad" al estar colapsado; se ilumina al abrir. */}
                  <Animated.View
                    pointerEvents="none"
                    style={[styles.thumbOverlay, restStyle]}
                  />
                  {isActive ? (
                    /* Icono de audio: hay una pista sonando (sobre la imagen). */
                    <View style={styles.thumbAudioBadge} pointerEvents="none">
                      <Feather name="volume-2" size={16} color="#fff" />
                    </View>
                  ) : (
                    /* Glow pulsante para llamar la atención (sin pista). */
                    <Animated.View
                      pointerEvents="none"
                      style={[styles.thumbGlow, glowStyle]}
                    />
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
                </Pressable>
              );
            })}
          </View>
        </ScrollView>

        {/* Línea divisora */}
        <View style={styles.divider} />

        {/* Fondo interactivo: animación centrada en el espacio entre la
            divisora y la tab bar; thumbnails anclados 10px sobre la tab bar.
            paddingBottom despeja la tab bar para que el lienzo no se recorte. */}
        <View style={[styles.canvasWrap, { paddingBottom: tabBarHeight }]}>
          {/* Escenario: centra la animación en el espacio sobre los thumbnails. */}
          <View
            style={styles.stage}
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
                      liveZoom={
                        g.id === pinchTargetId && livePinchNum != null
                          ? livePinchNum
                          : undefined
                      }
                      masterOpacity={master.opacity}
                      motion={master.motion}
                      glow={master.glow}
                    />
                  ))}

                {active.length === 0 && (
                  <View style={styles.empty} pointerEvents="none">
                    <Animated.View
                      entering={FadeIn.duration(2000)}
                      style={styles.emptyLogoWrap}
                    >
                      <Image
                        source={require("@/assets/images/geometrix/cubo-2.png")}
                        style={styles.emptyLogo}
                        contentFit="contain"
                      />
                    </Animated.View>
                    <Text style={styles.emptyText}>Toca una geometría para comenzar</Text>
                    <Text style={styles.emptySub}>Combina varias y crea tu composición</Text>
                  </View>
                )}
              </View>
            </GestureDetector>
          )}

          </View>

          {/* Flecha a 10px de la divisora: aparece al activar la primera
              geometría. Despliega/colapsa el carrusel de acciones. Vive fuera
              del "stage" (no la afecta su translateY), como overlay absoluto
              de canvasWrap, para que la animación no se mueva. */}
          {hasActive && (
            <Animated.View
              entering={FadeIn.duration(360)}
              exiting={FadeOut.duration(220)}
              style={styles.actionTop}
            >
              <Animated.View
                pointerEvents={pillOpen ? "auto" : "none"}
                style={[styles.pillRow, pillStyle]}
              >
                {pillActions.map((a, i) => (
                  <React.Fragment key={a.key}>
                    {i > 0 && <View style={styles.pillDivider} />}
                    <Pressable
                      onPress={() => {
                        a.onPress();
                        setPillOpen(false);
                      }}
                      style={styles.pillBtn}
                      accessibilityRole="button"
                      accessibilityLabel={a.label}
                      hitSlop={6}
                    >
                      <Feather name={a.icon} size={18} color={colors.mutedForeground} />
                    </Pressable>
                  </React.Fragment>
                ))}
              </Animated.View>

              <Pressable
                onPress={() => setPillOpen((o) => !o)}
                style={styles.chevronBtn}
                accessibilityRole="button"
                accessibilityLabel={pillOpen ? "Ocultar acciones" : "Mostrar acciones"}
                hitSlop={8}
              >
                <Feather
                  name={pillOpen ? "chevron-right" : "chevron-left"}
                  size={20}
                  color={colors.mutedForeground}
                />
              </Pressable>
            </Animated.View>
          )}

          {/* Thumbnails de geometrías activas: fila centrada anclada 15px sobre
              la tab bar; se reacomoda al agregar/quitar (LinearTransition). */}
          {activeMetas.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={[styles.thumbsScroll, { bottom: tabBarHeight + 15 }]}
              contentContainerStyle={styles.thumbsRow}
            >
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
                      style={[styles.thumb, { opacity: isSelected ? 1 : 0.4 }]}
                      accessibilityRole="button"
                      accessibilityLabel={`Seleccionar ${g.name} para ajustar el tamaño`}
                    >
                      <SacredGlyph id={g.id} color={s.color} size={30} strokeWidth={1.4} />
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
                        size={16}
                        color={colors.mutedForeground}
                      />
                    </Pressable>
                  </Animated.View>
                );
              })}
            </ScrollView>
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
                masterOpacity={master.opacity}
                motion={master.motion}
                glow={master.glow}
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
        <Pressable
          style={[styles.menuBackdrop, { paddingBottom: tabBarHeight + 94 }]}
          onPress={() => setMenuGeoId(null)}
        >
          {menuGeo && (
            <Pressable style={styles.menuCard} onPress={() => {}}>
              <View style={styles.menuList}>
                <Pressable
                  style={styles.menuItem}
                  onPress={() => {
                    setSettingsGeoId(menuGeoId);
                    setMenuGeoId(null);
                    setSettingsOpen(true);
                  }}
                >
                  <Feather name="sliders" size={18} color="#FFFFFF" />
                  <Text style={[styles.menuItemText, { color: "#FFFFFF" }]}>Personalizar</Text>
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
                    color="#FFFFFF"
                  />
                  <Text style={[styles.menuItemText, { color: "#FFFFFF" }]}>
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
                  <Feather name="trash-2" size={18} color="#FFFFFF" />
                  <Text style={[styles.menuItemText, { color: "#FFFFFF" }]}>Quitar</Text>
                </Pressable>
              </View>

              <View style={styles.menuDivider} />

              <View style={styles.menuGlyphWrap}>
                <SacredGlyph
                  id={menuGeo.id}
                  color={getSettings(menuGeo.id).color}
                  size={85}
                  strokeWidth={1.4}
                />
                <Text style={styles.menuGlyphName} numberOfLines={1}>
                  {menuGeo.name}
                </Text>
              </View>
            </Pressable>
          )}
        </Pressable>
      </Modal>

      {/* Panel de ajustes GENERALES (maestro): afecta a todas las capas. */}
      <Modal
        visible={generalOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setGeneralOpen(false)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setGeneralOpen(false)} />

        {/* Vista previa en vivo de toda la composición con los ajustes generales. */}
        {activeMetas.length > 0 && generalPreviewSize > 0 && (
          <View
            pointerEvents="none"
            style={[styles.previewWrap, { bottom: generalSheetHeight + 12 }]}
          >
            <Text style={styles.previewLabel}>Vista previa</Text>
            <View
              style={[
                styles.previewBox,
                { width: generalPreviewSize, height: generalPreviewSize },
              ]}
            >
              {activeMetas.map((g, i) => (
                <GeometryLayer
                  key={g.id}
                  geo={g}
                  index={i}
                  size={generalPreviewSize * 0.96}
                  settings={getSettings(g.id)}
                  masterOpacity={master.opacity}
                  motion={master.motion}
                  glow={master.glow}
                />
              ))}
            </View>
          </View>
        )}

        <View
          onLayout={(e) => {
            const h = e.nativeEvent.layout.height;
            setGeneralSheetHeight((prev) => (prev === h ? prev : h));
          }}
          style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}
        >
          <LinearGradient
            colors={HOME_GRADIENT}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.sheetHandle} />
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Ajustes generales</Text>
            <Pressable
              onPress={() => setGeneralOpen(false)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Cerrar ajustes generales"
            >
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {activeMetas.length === 0 ? (
            <View style={styles.sheetEmpty}>
              <Feather name="hexagon" size={26} color="rgba(190,150,80,0.4)" />
              <Text style={styles.sheetEmptyText}>
                Activa una geometría para ajustar la animación
              </Text>
            </View>
          ) : (
            <View style={styles.geoCard}>
              {/* Opacidad general */}
              <View style={styles.fieldRow}>
                <Text style={styles.fieldLabel}>Opacidad general</Text>
                <Text style={styles.fieldValue}>{Math.round(master.opacity * 100)}%</Text>
              </View>
              <VolumeSlider
                value={master.opacity}
                onChange={(v) =>
                  setMaster((m) => ({
                    ...m,
                    opacity: Number.isFinite(v) ? Math.min(1, Math.max(0.1, v)) : m.opacity,
                  }))
                }
                color={colors.accent}
                trackColor="rgba(255,255,255,0.12)"
              />

              {/* Movimiento general */}
              <View style={[styles.fieldRow, { marginTop: 18 }]}>
                <Text style={styles.fieldLabel}>Movimiento</Text>
                <Toggle
                  value={master.motion}
                  onChange={(v) => setMaster((m) => ({ ...m, motion: v }))}
                  color={colors.accent}
                />
              </View>

              {/* Glow general */}
              <View style={[styles.fieldRow, { marginTop: 18 }]}>
                <Text style={styles.fieldLabel}>Glow</Text>
                <Text style={styles.fieldValue}>{Math.round(master.glow * 100)}%</Text>
              </View>
              <VolumeSlider
                value={master.glow}
                onChange={(v) =>
                  setMaster((m) => ({
                    ...m,
                    glow: Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : m.glow,
                  }))
                }
                color={colors.accent}
                trackColor="rgba(255,255,255,0.12)"
              />
            </View>
          )}
        </View>
      </Modal>

      {/* Panel de ajustes por geometría */}
      <Modal
        visible={settingsOpen}
        transparent
        animationType="slide"
        onRequestClose={() => {
          setSettingsOpen(false);
          setSettingsGeoId(null);
        }}
      >
        <Pressable
          style={styles.sheetBackdrop}
          onPress={() => {
            setSettingsOpen(false);
            setSettingsGeoId(null);
          }}
        />

        {/* Vista previa en vivo: flota arriba para no tapar los controles del
            sheet. Vive dentro del Modal, así se cierra junto con los ajustes. */}
        {settingsGeo && previewSize > 0 && (
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
              <GeometryLayer
                geo={settingsGeo}
                index={0}
                size={previewSize * 0.96}
                settings={getSettings(settingsGeo.id)}
                masterOpacity={master.opacity}
                motion={master.motion}
                glow={master.glow}
              />
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
              onPress={() => {
                setSettingsOpen(false);
                setSettingsGeoId(null);
              }}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Cerrar ajustes"
            >
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <View style={styles.sheetHeaderDivider} />

          {!settingsGeo ? (
            <View style={styles.sheetEmpty}>
              <Feather name="hexagon" size={26} color="rgba(190,150,80,0.4)" />
              <Text style={styles.sheetEmptyText}>
                Activa una geometría para personalizarla
              </Text>
            </View>
          ) : (
            (() => {
              const g = settingsGeo;
              const s = getSettings(g.id);
              return (
                <ScrollView
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 8 }}
                >
                <View style={styles.geoCard}>
                  {/* Cabecera: ícono + título (texto simple, sin píldora) */}
                  <View style={styles.geoCardHead}>
                    <SacredGlyph id={g.id} color={s.color} size={24} strokeWidth={2.4} />
                    <View style={styles.geoNamePill}>
                      <Text style={styles.geoCardName} numberOfLines={1}>
                        {g.name}
                      </Text>
                    </View>
                  </View>

                  {/* Tres toggles (on/off) en una fila, debajo del título */}
                  <View style={styles.toggleTriRow}>
                    <View style={styles.toggleTriItem}>
                      <Text style={styles.toggleTriLabel} numberOfLines={1}>
                        Fade in/out
                      </Text>
                      <Toggle
                        value={s.fadeLoop}
                        onChange={(v) => updateSetting(g.id, "fadeLoop", v)}
                        color={s.color}
                        compact
                      />
                    </View>
                    <View style={styles.toggleTriItem}>
                      <Text style={styles.toggleTriLabel} numberOfLines={1}>
                        Respirar
                      </Text>
                      <Toggle
                        value={s.breathe}
                        onChange={(v) => updateSetting(g.id, "breathe", v)}
                        color={s.color}
                        compact
                      />
                    </View>
                    <View style={styles.toggleTriItem}>
                      <Text style={styles.toggleTriLabel} numberOfLines={1}>
                        Girar
                      </Text>
                      <Toggle
                        value={s.rotate}
                        onChange={(v) => updateSetting(g.id, "rotate", v)}
                        color={s.color}
                        compact
                      />
                    </View>
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

                  {/* Girar (velocidad) */}
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Girar</Text>
                    <Text style={styles.fieldValue}>{Math.round(s.rotateSpeed * 100)}%</Text>
                  </View>
                  <VolumeSlider
                    value={s.rotateSpeed}
                    onChange={(v) => updateSetting(g.id, "rotateSpeed", v)}
                    color={s.color}
                    trackColor="rgba(255,255,255,0.12)"
                  />

                  {/* Respiración (intensidad) */}
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Respiración</Text>
                    <Text style={styles.fieldValue}>{Math.round(s.breatheAmount * 100)}%</Text>
                  </View>
                  <VolumeSlider
                    value={s.breatheAmount}
                    onChange={(v) => updateSetting(g.id, "breatheAmount", v)}
                    color={s.color}
                    trackColor="rgba(255,255,255,0.12)"
                  />

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

                  {/* Grosor */}
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

                  {/* Glow propio */}
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Glow</Text>
                    <Text style={styles.fieldValue}>{Math.round(s.glow * 100)}%</Text>
                  </View>
                  <VolumeSlider
                    value={s.glow}
                    onChange={(v) => updateSetting(g.id, "glow", v)}
                    color={s.color}
                    trackColor="rgba(255,255,255,0.12)"
                  />
                </View>
                </ScrollView>
              );
            })()
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
                style={[styles.soundMenu, { top: insets.top + 68, right: rightOffset }]}
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
                      {/* No seleccionada → overlay oscuro; la elegida se ilumina. */}
                      {!sel && (
                        <View style={styles.soundTileDim} pointerEvents="none" />
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
  title: { fontSize: 30, fontWeight: "700", color: "#FFFFFF", letterSpacing: 0.3 },
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
  soundThumbImg: { width: "100%", height: "100%" },
  thumbOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.45)",
  },
  thumbAudioBadge: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
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

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginTop: 14,
    marginBottom: 0,
  },

  canvasWrap: {
    flex: 1,
    alignItems: "center",
  },
  stage: {
    flex: 1,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateY: -15 }],
  },
  canvas: {
    alignItems: "center",
    justifyContent: "center",
  },
  layer: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },

  actionTop: {
    position: "absolute",
    top: 10,
    right: 0,
    zIndex: 6,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  chevronBtn: {
    width: 40,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(122,143,168,0.35)",
    backgroundColor: "rgba(11,15,20,0.55)",
  },
  pillRow: {
    marginRight: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 0,
    paddingHorizontal: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  pillBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  pillDivider: {
    width: 1,
    height: 18,
    backgroundColor: CARD_BORDER,
  },
  thumbsScroll: {
    position: "absolute",
    left: 0,
    right: 0,
    maxHeight: 56,
  },
  thumbsRow: {
    flexGrow: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingHorizontal: 16,
  },
  thumb: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
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
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingHorizontal: 24,
  },
  menuCard: {
    width: "100%",
    maxWidth: 320,
    flexDirection: "row",
    alignItems: "stretch",
    overflow: "hidden",
    borderRadius: 18,
    backgroundColor: "#080A18",
    borderWidth: 1,
    borderColor: "#1b1f41",
  },
  menuList: {
    flex: 1,
    paddingVertical: 8,
    justifyContent: "center",
  },
  menuDivider: {
    width: 1,
    backgroundColor: "#1b1f41",
    marginVertical: 16,
  },
  menuGlyphWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 22,
    gap: 10,
  },
  menuGlyphName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#7A8FA8",
    textAlign: "center",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 18,
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
  toggleCompact: {
    width: 32,
    height: 16,
    borderRadius: 8,
    padding: 2,
    justifyContent: "center",
  },
  toggleKnobCompact: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#EDE1D3",
  },
  toggleKnobCompactOn: { transform: [{ translateX: 16 }] },

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
    marginBottom: 10,
  },
  sheetHeaderDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 14,
  },
  sheetTitle: { fontSize: 20, fontWeight: "700", color: colors.foreground },
  sheetEmpty: { alignItems: "center", gap: 10, paddingVertical: 40 },
  sheetEmptyText: { fontSize: 14, color: colors.mutedForeground, textAlign: "center" },

  geoCard: {
    gap: 8,
  },
  geoCardHead: { flexDirection: "row", alignItems: "center", gap: 8 },
  geoNamePill: {
    flexShrink: 1,
  },
  geoCardName: { minWidth: 0, fontSize: 13, fontWeight: "700", color: "#FFFFFF" },
  toggleTriRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
    marginTop: 4,
    marginBottom: 6,
  },
  toggleTriItem: { flexDirection: "row", alignItems: "center", gap: 7 },
  toggleTriLabel: { fontSize: 12, fontWeight: "600", color: colors.foreground, flexShrink: 1 },

  fieldLabel: { fontSize: 12, fontWeight: "600", color: colors.mutedForeground },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  twoCol: { flexDirection: "row", gap: 16 },
  col: { flex: 1, minWidth: 0 },
  fieldValue: { fontSize: 12, fontWeight: "600", color: colors.foreground },

  swatchRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  swatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "transparent",
  },
  swatchOn: { borderColor: "#EDE1D3" },

  empty: { alignItems: "center", gap: 6 },
  emptyLogoWrap: { marginBottom: 10 },
  emptyLogo: { width: 43, height: 43, opacity: 0.9 },
  emptyText: { fontSize: 14, fontWeight: "600", color: colors.foreground, marginTop: 4 },
  emptySub: { fontSize: 12, color: colors.mutedForeground },

  soundMenu: {
    position: "absolute",
    right: 20,
    flexDirection: "column",
    alignItems: "flex-end",
    gap: 12,
  },
  soundTile: {
    width: 44,
    height: 44,
    borderRadius: 14,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#181c37",
  },
  soundTileActive: { borderColor: "#2c304f" },
  soundTileImg: { width: "100%", height: "100%" },
  soundTileDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
});
