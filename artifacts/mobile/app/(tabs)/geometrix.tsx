/**
 * GEOMETRIX — galería de geometrías sagradas + fondo animado interactivo.
 * El usuario activa geometrías por capas para componer un fondo en vivo.
 */
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
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
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Rect,
  Stop,
} from "react-native-svg";

import { GeometrixPatternBg } from "@/components/GeometrixPatternBg";
import { SacredGlyph } from "@/components/SacredGlyph";
import { VolumeSlider } from "@/components/VolumeSlider";
import {
  playGeometrixIntroOnce,
  stopGeometrixIntro,
} from "@/lib/geometrixIntro";
import colorsConst from "@/constants/colors";
import { SOUND_MAP } from "@/config/sound-map";
import { GEOMETRIES, PALETTE, type GeometryId, type GeometryMeta } from "@/data/geometries";
import {
  BG_GRADIENTS,
  bgGradientColors,
  brightnessFactor,
  gradientColors,
  HOME_GRADIENT,
  scaleColors,
  STROKE_GRADIENTS,
  type BgPattern,
  type CanvasGuide,
  type GeoSettings,
  type GlobalSettings,
} from "@/data/geometrix-creations";
import { usePremium } from "@/context/PremiumContext";
import { useGeometrixCreations } from "@/hooks/useGeometrixCreations";

const colors = colorsConst.light;
const CARD_BORDER = "#161f33";


/** Muestra circular de un degradado (para el selector). RN no soporta
    gradientes en `backgroundColor`, así que se dibuja con SVG. */
function GradientSwatch({
  colors: [from, to],
  size,
}: {
  colors: readonly [string, string];
  size: number;
}) {
  const id = `sw-grad-${React.useId().replace(/:/g, "")}`;
  return (
    <Svg width={size} height={size}>
      <Defs>
        <SvgLinearGradient id={id} x1="0%" y1="0%" x2="100%" y2="100%">
          <Stop offset="0%" stopColor={from} />
          <Stop offset="100%" stopColor={to} />
        </SvgLinearGradient>
      </Defs>
      <Rect
        x={0.5}
        y={0.5}
        width={size - 1}
        height={size - 1}
        rx={(size - 1) / 2}
        ry={(size - 1) / 2}
        fill={`url(#${id})`}
        stroke="#4b4f5c"
        strokeWidth={1}
      />
    </Svg>
  );
}

/** Ajustes editables por geometría. Los sliders guardan 0–1. */
function defaultSettings(id: GeometryId): GeoSettings {
  const meta = GEOMETRIES.find((g) => g.id === id);
  return {
    color: meta?.color ?? colors.primary,
    gradientId: null,
    // Estática por defecto: el usuario activa el movimiento (giro/respirar/
    // fade) en los ajustes por capa cuando quiera.
    rotate: false,
    rotateLeft: false,
    rotateSpeed: 0.5,
    opacity: 1,
    breathe: false,
    breatheAmount: 0.5,
    fadeLoop: false,
    glow: 0,
    thickness: 0,
    scale: 1,
    zoom: 1,
    manualAngle: 0,
    offsetX: 0,
    offsetY: 0,
    kaleidoscope: false,
    kaleidSegments: 6,
  };
}

// Color fijo del fondo del toggle cuando está activado (estático, no usa el color de la geometría).
const TOGGLE_ON_COLOR = "#a1adcf";
// Color de las guías persistentes del usuario (azul visible sobre fondos oscuros).
const GUIDE_COLOR = "#4B9EFF";

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
  liveAngle,
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
  /** Ángulo en vivo (gesto de rotación) en grados: si se pasa, manda sobre
      settings.manualAngle. Solo lo usa la geometría seleccionada en el lienzo y
      solo tiene efecto cuando el giro automático está apagado. */
  liveAngle?: number;
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
  // Aparición suave: al montar la capa (al seleccionar la geometría) entra con
  // fade in en lugar de aparecer de golpe.
  const enter = useSharedValue(0);
  useEffect(() => {
    enter.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.ease) });
  }, [enter]);
  const {
    color,
    gradientId,
    rotate,
    rotateLeft,
    rotateSpeed,
    opacity,
    breathe,
    breatheAmount,
    fadeLoop,
    glow: geoGlow,
    thickness,
    scale,
    zoom,
    manualAngle,
    kaleidoscope,
    kaleidSegments,
  } = settings;
  const grad = gradientColors(gradientId);

  // Velocidad de giro: a mayor rotateSpeed, menor duración (más rápido).
  // 0 → ~2× más lento, 0.5 → base, 1 → ~5× más rápido. Nunca se detiene aquí
  // (el on/off lo maneja el toggle `rotate`).
  const safeSpeed = Number.isFinite(rotateSpeed) ? Math.max(0, Math.min(1, rotateSpeed)) : 0.5;
  // Más lento que la versión original (mayor duración = giro más lento):
  // factor 1.6 ≈ 1.12 previo / 0.7 (otro 30% menos de velocidad).
  const spinDuration = ((38000 + index * 6000) / (0.5 + safeSpeed * 2.5)) * 1.6;

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

  // Sentido del giro: derecha (horario, +1) o izquierda (antihorario, -1).
  // Los toggles son excluyentes; si ambos quedaran apagados no hay giro.
  const dir = rotateLeft ? -1 : 1;
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
  const spin = (rotate || rotateLeft) && motion;
  const breath = breathe && motion;
  // Profundidad de la respiración: 0.04 (sutil) → 0.24 (profunda). Define cuánto
  // se encoge en el valle del pulso (el pico siempre es 1.0).
  const safeAmount = Number.isFinite(breatheAmount) ? Math.max(0, Math.min(1, breatheAmount)) : 0.5;
  const breatheDepth = 0.04 + safeAmount * 0.2;
  const safeMaster = Number.isFinite(masterOpacity) ? masterOpacity : 1;
  // Ángulo manual (gesto de dos dedos): solo aplica cuando el giro automático
  // está apagado. En vivo manda `liveAngle`; en reposo el confirmado en settings.
  const committedAngle = Number.isFinite(manualAngle) ? manualAngle : 0;
  const effAngle = liveAngle != null && Number.isFinite(liveAngle) ? liveAngle : committedAngle;
  const aStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { rotate: spin ? `${rot.value * 360 * dir}deg` : `${effAngle}deg` },
        // Respiración (1 - profundidad … 1). El zoom NO viaja en el transform:
        // se aplica redibujando el SVG (effectiveSize) para que quede nítido.
        {
          scale: breath ? 1 - breatheDepth + pulse.value * breatheDepth : 1,
        },
      ],
      // Opacidad propia × general (maestra) × fundido cíclico × aparición.
      opacity: opacity * safeMaster * fade.value * enter.value,
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
              gradient={grad}
              size={effectiveSize}
              strokeWidth={sw * (3 + safeGlow * 3)}
              kaleidoscope={kaleidoscope}
              kaleidSegments={kaleidSegments}
            />
          </View>
          <View style={[styles.layer, { opacity: 0.26 * safeGlow }]}>
            <SacredGlyph
              id={geo.id}
              color={color}
              gradient={grad}
              size={effectiveSize}
              strokeWidth={sw * (1.8 + safeGlow * 1.6)}
              kaleidoscope={kaleidoscope}
              kaleidSegments={kaleidSegments}
            />
          </View>
        </>
      )}
      <SacredGlyph
        id={geo.id}
        color={color}
        gradient={grad}
        size={effectiveSize}
        strokeWidth={sw}
        kaleidoscope={kaleidoscope}
        kaleidSegments={kaleidSegments}
      />
    </Animated.View>
  );
}


// ── GuideHandle ────────────────────────────────────────────────────────────
// Guía del lienzo arrastrable. La línea se mueve en el hilo UI (useAnimatedStyle);
// el porcentaje se actualiza via runOnJS para el label.
type GuideHandleProps = {
  guide: CanvasGuide;
  canvasSide: number;
  onMove: (id: string, pct: number) => void;
};
function GuideHandle({ guide, canvasSide, onMove }: GuideHandleProps) {
  const isH = guide.orientation === "h";
  const livePct = useSharedValue(guide.pct);
  const startPct = useSharedValue(guide.pct);
  const [displayPct, setDisplayPct] = useState(guide.pct);

  useEffect(() => {
    livePct.value = guide.pct;
    setDisplayPct(guide.pct);
  }, [guide.pct, livePct]);

  const pan = Gesture.Pan()
    .minDistance(2)
    .onStart(() => {
      startPct.value = livePct.value;
    })
    .onUpdate((e) => {
      const delta = isH ? e.translationY : e.translationX;
      const raw = startPct.value + (delta / canvasSide) * 100;
      const clamped = Math.min(100, Math.max(0, raw));
      livePct.value = clamped;
      runOnJS(setDisplayPct)(Math.round(clamped));
    })
    .onEnd(() => {
      runOnJS(onMove)(guide.id, Math.round(livePct.value));
    });

  const lineStyle = useAnimatedStyle(() => {
    const px = (livePct.value / 100) * canvasSide;
    return isH ? { top: px } : { left: px };
  });

  const handleStyle = useAnimatedStyle(() => {
    const px = (livePct.value / 100) * canvasSide;
    return isH
      ? { top: Math.max(0, px - 32), left: 4 }
      : { left: Math.min(canvasSide - 38, px + 4), top: 4 };
  });

  return (
    <>
      {/* Línea: solo visual, se mueve en el hilo UI */}
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            backgroundColor: GUIDE_COLOR,
            opacity: 0.65,
            ...(isH
              ? { left: -999, right: -999, height: 1 }
              : { top: -999, bottom: -999, width: 1 }),
          },
          lineStyle,
        ]}
      />
      {/* Handle interactivo: icono move + etiqueta % */}
      <GestureDetector gesture={pan}>
        <Animated.View style={[{ position: "absolute" }, handleStyle]}>
          <View
            style={{
              backgroundColor: GUIDE_COLOR + "38",
              borderRadius: 4,
              paddingHorizontal: 5,
              paddingVertical: 3,
              alignItems: "center",
              gap: 1,
            }}
          >
            <Feather name="move" size={9} color={GUIDE_COLOR} />
            <Text style={{ color: GUIDE_COLOR, fontSize: 8, fontWeight: "600" }}>
              {displayPct}%
            </Text>
          </View>
        </Animated.View>
      </GestureDetector>
    </>
  );
}

export default function GeometrixScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  // Alto de la tab bar inferior (réplica del cálculo en (tabs)/_layout.tsx),
  // para que el lienzo no quede tapado por el menú de la app.
  const bottomPb = Platform.OS === "web" ? 8 : insets.bottom;
  const tabBarHeight = 56 + Math.round(bottomPb / 2) + bottomPb;

  // Persistencia local de composiciones ("Mis creaciones").
  const { creations, saveCreation, updateCreation, getCreation } = useGeometrixCreations();
  // Param de ruta: id de una creación a abrir (lo manda la pantalla de la lista).
  const params = useLocalSearchParams<{ load?: string; play?: string; new?: string }>();

  const [active, setActive] = useState<GeometryId[]>([]);
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
    bgColor: null,
    bgGradientId: null,
    bgBrightness: 0.5,
    bgPattern: null,
  });
  const { isPremium } = usePremium();
  const [guidesOpen, setGuidesOpen] = useState(false);
  const [guides, setGuides] = useState<CanvasGuide[]>([]);
  const onMoveGuide = useCallback((id: string, pct: number) => {
    setGuides((prev) => prev.map((g) => g.id === id ? { ...g, pct } : g));
  }, []);
  const [guideOrientation, setGuideOrientation] = useState<"h" | "v">("h");
  const [guidePct, setGuidePct] = useState("50");
  const [generalOpen, setGeneralOpen] = useState(false);
  const [generalSheetHeight, setGeneralSheetHeight] = useState(0);
  // Alto real del sheet de ajustes, para anclar la vista previa justo encima.
  const [sheetHeight, setSheetHeight] = useState(0);
  // Modo inmersión: solo el fondo animado, sin interfaz.
  const [immersive, setImmersive] = useState(false);
  // Nombre de la composición recién guardada → muestra el popup temático.
  const [savedName, setSavedName] = useState<string | null>(null);
  const [updatedName, setUpdatedName] = useState<string | null>(null);
  const [showEmptyAlert, setShowEmptyAlert] = useState(false);
  // Geometría con su menú contextual abierto (tap en miniatura).
  const [menuGeoId, setMenuGeoId] = useState<GeometryId | null>(null);
  // "Aislar": muestra solo esta geometría en el lienzo (sin quitar las demás).
  const [hiddenIds, setHiddenIds] = useState<GeometryId[]>([]);
  // Geometría seleccionada para el pellizco (pinch) que ajusta su zoom.
  const [selectedId, setSelectedId] = useState<GeometryId | null>(null);
  // Cuando los thumbnails desbordan el ancho visible, alineamos a la izquierda
  // (en vez de centrar) para que se pueda deslizar y se asome el último.
  const [thumbsOverflow, setThumbsOverflow] = useState(false);
  const thumbsViewW = useRef(0);
  const thumbsScrollRef = useRef<ScrollView>(null);
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
  // Rotación manual en vivo (gesto de dos dedos). El ángulo en curso se lleva en
  // grados; se confirma a settings al soltar. null = no se está rotando.
  const liveRot = useSharedValue(0);
  const rotStart = useSharedValue(0);
  // true cuando el gesto terminó con éxito (onEnd); permite revertir en cancelación.
  const rotSucceeded = useSharedValue(false);
  const [liveRotNum, setLiveRotNum] = useState<number | null>(null);

  // ── Drag (arrastrar con un dedo) ─────────────────────────────────────────
  const liveDragX = useSharedValue(0);
  const liveDragY = useSharedValue(0);
  const dragStartX = useSharedValue(0);
  const dragStartY = useSharedValue(0);
  // null = sin drag en curso; objeto = posición en vivo mientras se arrastra.
  // snapX/snapY: offsets donde se detectó alineación (guía vertical/horizontal).
  const [liveDragPos, setLiveDragPos] = useState<{
    x: number; y: number;
    snapX?: number; snapY?: number;
  } | null>(null);
  // Offsets de todas las geometrías no-objetivo + el centro del lienzo (0,0);
  // usados en el worklet del drag para calcular snap sin llamar a getSettings.
  // null en un eje = ese eje no snap (para guías de un solo eje).
  const snapTargets = useSharedValue<Array<{ offsetX: number | null; offsetY: number | null }>>([]);

  // Creación cargada desde "Mis creaciones" (null = lienzo nuevo o no cargado).
  // Reactivo para poder mostrar/ocultar el botón "Actualizar" en la UI.
  const [editingCreation, setEditingCreation] = useState<{ id: string; name: string } | null>(null);
  // true cuando el usuario modificó algo desde que se cargó la creación.
  const [isDirty, setIsDirty] = useState(false);
  // Suprime el primer disparo del efecto dirty (causado por el propio loadCreation).
  const justLoadedRef = useRef(false);

  // Audio de intro ("logo reveal" de cubo-3): gestionado por un singleton de
  // módulo (lib/geometrixIntro). Se precarga al arrancar la app y suena UNA sola
  // vez por lanzamiento. Aquí solo disparamos play (one-shot) y pausa.
  const stopIntro = useCallback(() => {
    stopGeometrixIntro();
  }, []);

  const playIntro = useCallback(() => {
    playGeometrixIntroOnce();
  }, []);

  // Espejo de `active` para leerlo dentro de callbacks de foco sin re-suscribir.
  const activeRef = useRef(active);
  useEffect(() => {
    activeRef.current = active;
    // Al salir del estado vacío (aparece la primera geometría) el logo desaparece:
    // cortar el intro para mantener la sincronía con su "reveal".
    if (active.length > 0) {
      stopIntro();
    }
  }, [active, stopIntro]);

  // Al salir de Geometrix (las pestañas quedan montadas): resetear la UI.
  // Al entrar: disparar el intro de audio si el lienzo está vacío.
  useFocusEffect(
    useCallback(() => {
      // Audio de intro sincronizado con el "logo reveal" (cubo-3): solo cuando
      // el lienzo está vacío, que es cuando aparece el logo.
      if (activeRef.current.length === 0) {
        playIntro();
      }
      return () => {
        stopIntro();
        setSettingsOpen(false);
        setSettingsGeoId(null);
        setGeneralOpen(false);
        setImmersive(false);
        setSavedName(null);
        setMenuGeoId(null);
        setHiddenIds([]);
        setMaster({ opacity: 1, motion: true, glow: 0, bgColor: null, bgGradientId: null, bgBrightness: 0.5, bgPattern: null });
      };
    }, [playIntro, stopIntro]),
  );


  const toggleGeometry = useCallback((id: GeometryId) => {
    const removing = active.includes(id);
    setActive((prev) =>
      removing ? prev.filter((g) => g !== id) : [...prev, id],
    );
    if (removing) {
      // Al quitar, limpiar los ajustes para que vuelva a los defaults si se re-agrega.
      setSettings((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } else {
      // Al agregar, sembrar ajustes por defecto.
      setSettings((prev) => (prev[id] ? prev : { ...prev, [id]: defaultSettings(id) }));
    }
    // Seleccionarla para el pellizco (si se quita, el effect reasigna).
    setSelectedId(id);
  }, [active]);

  // Vacía por completo el lienzo: quita todas las geometrías activas, resetea
  // sus ajustes por capa (quedan en defaults al re-agregar) y resetea los
  // ajustes generales (fondo, brillo, opacidad, glow, movimiento).
  const clearCanvas = useCallback(() => {
    // El intro suena una sola vez por lanzamiento de app: al vaciar el lienzo NO
    // se vuelve a disparar.
    setActive([]);
    setHiddenIds([]);
    setSelectedId(null);
    setSettings({});
    setEditingCreation(null);
    setMaster({
      opacity: 1,
      motion: true,
      glow: 0,
      bgColor: null,
      bgGradientId: null,
      bgBrightness: 0.5,
      bgPattern: null,
    });
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

  // Confirmar el ángulo manual del gesto de rotación a settings (JS thread).
  // Saneado final: nunca guardar NaN en settings.
  const commitAngle = useCallback(
    (id: GeometryId, deg: number) =>
      updateSetting(id, "manualAngle", Number.isFinite(deg) ? deg : 0),
    [updateSetting],
  );

  // Confirmar el desplazamiento del drag (un dedo) a settings (JS thread).
  const commitOffset = useCallback(
    (id: GeometryId, x: number, y: number) => {
      updateSetting(id, "offsetX", Number.isFinite(x) ? x : 0);
      updateSetting(id, "offsetY", Number.isFinite(y) ? y : 0);
    },
    [updateSetting],
  );

  // Helpers para construir el snapshot de la composición actual.
  const buildSnapshot = useCallback(() => {
    const activeSettings: Record<string, GeoSettings> = {};
    active.forEach((id) => {
      activeSettings[id] = getSettings(id);
    });
    return { active, master, settings: activeSettings, audio: null };
  }, [active, getSettings, master]);

  // Guardar SIEMPRE como composición nueva.
  const saveComposition = useCallback(async () => {
    if (active.length === 0) {
      setShowEmptyAlert(true);
      return;
    }
    try {
      const name = `Composición ${creations.length + 1}`;
      await saveCreation({ name, ...buildSnapshot() });
      setSavedName(name);
    } catch {
      Alert.alert("Error", "No se pudo guardar la composición.");
    }
  }, [active, creations.length, saveCreation, buildSnapshot]);

  // Actualizar la creación cargada (patch in-place, preserva ID y nombre).
  const updateComposition = useCallback(async () => {
    if (!editingCreation) return;
    if (active.length === 0) {
      setShowEmptyAlert(true);
      return;
    }
    try {
      const { id, name } = editingCreation;
      await updateCreation(id, buildSnapshot());
      setUpdatedName(name);
      setIsDirty(false); // vuelve a "limpio" hasta el próximo cambio
    } catch {
      Alert.alert("Error", "No se pudo actualizar la composición.");
    }
  }, [editingCreation, active, updateCreation, buildSnapshot]);

  // Abrir una creación guardada: restaurar capas, ajustes, fondo y sonido.
  // `enterImmersive` → abrir directo en pantalla completa ("Play").
  const loadCreation = useCallback(
    async (id: string, enterImmersive = false) => {
      const c = await getCreation(id);
      if (!c) return;
      // Suprimir el disparo del efecto dirty causado por los setStates que siguen.
      justLoadedRef.current = true;
      // Registrar la creación cargada para habilitar el botón "Actualizar".
      setEditingCreation({ id: c.id, name: c.name });
      // Reset de la sesión actual antes de aplicar la receta.
      stopIntro();
      setSettings(c.settings);
      setMaster(c.master);
      setActive(c.active);
      setHiddenIds(c.hiddenIds ?? []);
      setSelectedId(c.active.length ? c.active[c.active.length - 1] : null);
      // "Play": abrir directo en pantalla completa (solo si hay algo que mostrar).
      if (enterImmersive && c.active.length > 0) {
        setImmersive(true);
      }
    },
    [getCreation, stopIntro],
  );

  // Cuando llega un id por la ruta (desde "Mis creaciones"), abrir esa creación
  // y limpiar el param para no reaplicarla en cada render.
  useEffect(() => {
    if (params.load) {
      loadCreation(params.load, params.play === "1");
      // Limpiar a "" (no undefined): así reabrir la MISMA creación vuelve a
      // disparar el efecto (el param cambia de "" → id otra vez).
      router.setParams({ load: "", play: "" });
    }
  }, [params.load, params.play, loadCreation]);

  // "Nueva composición" (desde la lista): vaciar el lienzo y volver a los
  // ajustes por defecto, parando el sonido. Así se empieza una receta en limpio.
  useEffect(() => {
    if (params.new === "1") {
      setEditingCreation(null); // lienzo en blanco → ocultar botón "Actualizar"
      stopIntro();
      setActive([]);
      setSettings({});
      setHiddenIds([]);
      setSelectedId(null);
      setImmersive(false);
      setSavedName(null);
      setMaster({
        opacity: 1,
        motion: true,
        glow: 0,
        bgColor: null,
        bgGradientId: null,
        bgBrightness: 0.5,
        bgPattern: null,
      });
      router.setParams({ new: "" });
    }
  }, [params.new, stopIntro]);

  const [canvas, setCanvas] = useState({ w: 0, h: 0 });
  // Fila horizontal: 3 tiles completas + asomo de la 4ta para invitar al scroll.
  const tileW = (width - 20 * 2 - 8 * 3) / 3.3;
  // Lienzo cuadrado y centrado: lado = lado menor del espacio disponible.
  const canvasSide = canvas.w > 0 ? Math.min(canvas.w, canvas.h) : 0;
  // La capa se ajusta al lado del lienzo para que la geometría entre
  // completa al rotar (no se corta contra los bordes).
  const layerSize = canvasSide * 0.96;
  const activeMetas = GEOMETRIES.filter((g) => active.includes(g.id));
  const hasActive = activeMetas.length > 0;
  // Acciones de la píldora desplegable (flecha bajo la divisora). Solo iconos.
  const pillActions: { key: string; icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void }[] = [
    { key: "immersive", icon: "maximize", label: "Pantalla completa", onPress: () => setImmersive(true) },
    { key: "save", icon: "save", label: "Guardar", onPress: saveComposition },
    { key: "guias", icon: "crosshair", label: "Guías", onPress: () => setGuidesOpen(true) },
    { key: "comunidad", icon: "users", label: "Comunidad", onPress: () => router.push("/geometrix-comunidad") },
  ];
  // Sin geometrías activas se colapsa el desplegable (la flecha desaparece).
  useEffect(() => {
    if (!hasActive) setPillOpen(false);
  }, [hasActive]);
  // Lo que se pinta en el lienzo: todas las activas menos las ocultas.
  const visibleMetas = hiddenIds.length
    ? activeMetas.filter((g) => !hiddenIds.includes(g.id))
    : activeMetas;
  const menuGeo = menuGeoId
    ? GEOMETRIES.find((g) => g.id === menuGeoId)
    : undefined;
  // Geometría que muestra el panel por capa (solo si sigue activa).
  const settingsGeo =
    settingsGeoId && active.includes(settingsGeoId)
      ? GEOMETRIES.find((g) => g.id === settingsGeoId)
      : undefined;

  // Efecto 1: al cambiar (o limpiar) la creación cargada → resetear dirty.
  useEffect(() => {
    setIsDirty(false);
  }, [editingCreation]);

  // Efecto 2: vigila el contenido del lienzo. Si hay creación cargada y NO fue
  // un reset de carga (justLoadedRef), marcar dirty para mostrar "Actualizar".
  useEffect(() => {
    if (!editingCreation) return;
    if (justLoadedRef.current) {
      justLoadedRef.current = false;
      return;
    }
    setIsDirty(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, settings, master]);

  // Si una geometría se quita, limpiar su aislamiento / menú abierto y
  // reasignar la selección del pellizco a otra activa (o ninguna).
  useEffect(() => {
    setHiddenIds((prev) => prev.filter((id) => active.includes(id)));
    if (menuGeoId && !active.includes(menuGeoId)) setMenuGeoId(null);
    // Si se quita la geometría en edición, cerrar su panel por capa.
    if (settingsGeoId && !active.includes(settingsGeoId)) {
      setSettingsOpen(false);
      setSettingsGeoId(null);
    }
    if (selectedId && !active.includes(selectedId)) {
      setSelectedId(active.length ? active[active.length - 1] : null);
    }
  }, [active, menuGeoId, settingsGeoId, selectedId]);

  // Geometría que responde al pellizco: la seleccionada, o la última activa.
  const pinchTargetId =
    selectedId && active.includes(selectedId)
      ? selectedId
      : active.length
        ? active[active.length - 1]
        : null;

  // Mantener el zoom en vivo sincronizado con el valor confirmado del objetivo
  // (al cambiar de geometría o tras confirmar un pellizco).
  useEffect(() => {
    livePinch.value = pinchTargetId ? getSettings(pinchTargetId).zoom : 1;
  }, [pinchTargetId, getSettings, livePinch]);

  // Sincronizar liveDragX/Y con el offset confirmado del objetivo cuando cambia.
  // Así el onStart del panGesture (worklet, hilo UI) puede leer liveDragX/Y
  // directamente sin llamar a getSettings (función JS, no worklet).
  useEffect(() => {
    const s = pinchTargetId ? getSettings(pinchTargetId) : null;
    liveDragX.value = s?.offsetX ?? 0;
    liveDragY.value = s?.offsetY ?? 0;
  }, [pinchTargetId, getSettings, liveDragX, liveDragY]);

  // Precalcular targets de snap: centros de todas las geometrías no-objetivo
  // más el centro del lienzo (0,0). Se actualiza cuando cambia la selección o
  // cualquier offset de settings para que el worklet siempre tenga datos frescos.
  useEffect(() => {
    const targets: Array<{ offsetX: number | null; offsetY: number | null }> = [
      { offsetX: 0, offsetY: 0 }, // centro del lienzo
    ];
    active.forEach((id) => {
      if (id === pinchTargetId) return;
      const s = getSettings(id);
      targets.push({ offsetX: s.offsetX ?? 0, offsetY: s.offsetY ?? 0 });
    });
    // Guías del usuario: solo snap en su eje (null = no snap en el otro).
    if (canvasSide > 0) {
      guides.forEach((g) => {
        const off = canvasSide * (g.pct / 100 - 0.5);
        if (g.orientation === "h") {
          targets.push({ offsetX: null, offsetY: off });
        } else {
          targets.push({ offsetX: off, offsetY: null });
        }
      });
    }
    snapTargets.value = targets;
  }, [pinchTargetId, active, settings, getSettings, snapTargets, guides, canvasSide]);

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

  // Solo se permite rotar con los dedos cuando el objetivo NO tiene giro
  // automático activado (ni derecha ni izquierda). Con giro activo, el gesto
  // queda deshabilitado.
  const rotTargetSettings = pinchTargetId ? getSettings(pinchTargetId) : null;
  const canManualRotate =
    !!rotTargetSettings && !rotTargetSettings.rotate && !rotTargetSettings.rotateLeft;

  // Mantener el ángulo en vivo sincronizado con el confirmado del objetivo
  // (al cambiar de geometría o tras confirmar una rotación).
  useEffect(() => {
    liveRot.value = pinchTargetId ? getSettings(pinchTargetId).manualAngle : 0;
  }, [pinchTargetId, getSettings, liveRot]);

  // Gesto de rotación con dos dedos: gira el objetivo en tiempo real. Se confirma
  // a settings al soltar. Deshabilitado cuando hay giro automático.
  const rotationGesture = Gesture.Rotation()
    .enabled(canManualRotate)
    .onStart(() => {
      rotStart.value = liveRot.value;
      rotSucceeded.value = false;
    })
    .onUpdate((e) => {
      // e.rotation viene en radianes; el ángulo manual se guarda en grados.
      const deg = rotStart.value + (e.rotation * 180) / Math.PI;
      // Defensa ante valores corruptos: nunca propagar NaN al transform/settings.
      if (!Number.isFinite(deg)) return;
      liveRot.value = deg;
      runOnJS(setLiveRotNum)(deg);
    })
    .onEnd(() => {
      rotSucceeded.value = true;
      if (pinchTargetId && Number.isFinite(liveRot.value)) {
        runOnJS(commitAngle)(pinchTargetId, liveRot.value);
      }
    })
    // SIEMPRE corre (éxito o cancelación). Si el gesto se canceló sin confirmar,
    // revierte al ángulo de partida para no acumular un valor sin guardar en el
    // próximo gesto. Limpia el ángulo en vivo en ambos casos.
    .onFinalize(() => {
      if (!rotSucceeded.value) liveRot.value = rotStart.value;
      runOnJS(setLiveRotNum)(null);
    });

  // Gesto de drag (un solo dedo) para desplazar la geometría seleccionada
  // libremente por el lienzo. Al soltar, el nuevo offset queda confirmado en
  // settings. `minPointers(1).maxPointers(1)` evita conflictos con el pellizco
  // (dos dedos) y la rotación (dos dedos).
  const panGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .onStart(() => {
      // liveDragX/Y ya están sincronizados con el offset confirmado del objetivo
      // via useEffect — leerlos desde el worklet es seguro (son shared values).
      dragStartX.value = liveDragX.value;
      dragStartY.value = liveDragY.value;
    })
    .onUpdate((e) => {
      if (!pinchTargetId) return;
      let rx = dragStartX.value + e.translationX;
      let ry = dragStartY.value + e.translationY;

      // ── Snap a centros ─────────────────────────────────────────────────────
      // Compara el offset candidato contra cada target (otras geometrías y el
      // centro del lienzo). Si entra en el umbral, engancha y guarda el valor
      // para dibujar la línea guía.
      const SNAP = 8;
      let sx: number | null = null;
      let sy: number | null = null;
      const targets = snapTargets.value;
      for (let i = 0; i < targets.length; i++) {
        const t = targets[i];
        if (sx === null && t.offsetX !== null && Math.abs(rx - t.offsetX) < SNAP) {
          rx = t.offsetX;
          sx = rx;
        }
        if (sy === null && t.offsetY !== null && Math.abs(ry - t.offsetY) < SNAP) {
          ry = t.offsetY;
          sy = ry;
        }
        if (sx !== null && sy !== null) break;
      }

      liveDragX.value = rx;
      liveDragY.value = ry;
      runOnJS(setLiveDragPos)({
        x: rx, y: ry,
        snapX: sx !== null ? sx : undefined,
        snapY: sy !== null ? sy : undefined,
      });
    })
    .onEnd(() => {
      if (pinchTargetId) {
        runOnJS(commitOffset)(pinchTargetId, liveDragX.value, liveDragY.value);
      }
    })
    .onFinalize(() => {
      runOnJS(setLiveDragPos)(null);
    });

  // Pellizco, rotación y drag corren a la vez sobre el objetivo seleccionado.
  // Doble toque en el lienzo → entra en modo inmersivo directamente.
  const doubleTapGesture = Gesture.Tap()
    .numberOfTaps(2)
    .onEnd(() => runOnJS(setImmersive)(true));

  const canvasGesture = Gesture.Simultaneous(doubleTapGesture, pinchGesture, rotationGesture, panGesture);

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
  // Vista previa general reducida un 30% para dejar más aire a los ajustes.
  const generalPreviewSize = generalSheetHeight
    ? Math.max(84, Math.min(width - 32, generalPreviewFree) * 0.7)
    : 0;
  // En inmersión la geometría llena la pantalla, centrada.
  const immersiveSize = Math.min(width, height) * 0.96;

  // Color del fondo del lienzo (lienzo, vista previa e inmersión). Es el
  // degradado seleccionado o, por defecto, el de Inicio; ambos modulados por
  // el slider de brillo de Ajustes generales.
  const bgFactor = brightnessFactor(master.bgBrightness);
  const selectedBg = bgGradientColors(master.bgGradientId);
  const canvasBgColors = scaleColors(selectedBg ?? HOME_GRADIENT, bgFactor);

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={HOME_GRADIENT}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.content}>
        {/* ── Zona superior con fondo de Inicio ── */}
        <LinearGradient
          colors={["#090D20", "#080A18", "#06070F"]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.topPanel, { paddingTop: insets.top + 12 }]}
        >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>Geometrix</Text>
            <Text style={styles.subtitle}>Crea, anima, personaliza y comparte.</Text>
          </View>

          <Pressable
            onPress={() => router.push("/geometrix-creaciones")}
            style={styles.creacionesBtn}
            accessibilityRole="button"
            accessibilityLabel="Mis creaciones"
            hitSlop={6}
          >
            <Feather name="grid" size={18} color={colors.foreground} />
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
                    { width: tileW, borderColor: sel ? "#1c234c" : CARD_BORDER },
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

        </LinearGradient>

        {/* Fondo interactivo: animación centrada en el espacio entre la
            divisora y la tab bar; thumbnails anclados 10px sobre la tab bar.
            paddingBottom despeja la tab bar para que el lienzo no se recorte. */}
        <View style={[styles.canvasWrap, { paddingBottom: tabBarHeight }]}>
          {/* Fondo del lienzo (solo de la divisora hacia abajo). Se extiende
              edge-to-edge (left/right -20 rompe el padding del content); el
              color elegido llega justo a la divisora, sin degradado. */}
          <View pointerEvents="none" style={styles.canvasBgLayer}>
            {/* Color de fondo a pleno desde la divisora hacia abajo (sin
                degradado de transición). */}
            <LinearGradient
              colors={canvasBgColors}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {master.bgPattern && (
              <GeometrixPatternBg
                geoId={master.bgPattern.geoId}
                opacity={master.bgPattern.opacity}
                tileSize={master.bgPattern.tileSize}
                spacing={master.bgPattern.spacing}
                color={colors.primary}
              />
            )}
          </View>
          {/* Escenario: centra la animación en el espacio sobre los thumbnails. */}
          <View
            style={styles.stage}
            onLayout={(e) => {
              const { width: w, height: h } = e.nativeEvent.layout;
              setCanvas((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
            }}
          >
            {canvasSide > 0 && (
              <GestureDetector gesture={canvasGesture}>
                <View style={[styles.canvas, { width: canvasSide, height: canvasSide }]}>
                {layerSize > 0 &&
                  visibleMetas.map((g, i) => {
                    const s = getSettings(g.id);
                    const isDragging = g.id === pinchTargetId && liveDragPos != null;
                    const tx = isDragging ? liveDragPos.x : (s.offsetX ?? 0);
                    const ty = isDragging ? liveDragPos.y : (s.offsetY ?? 0);
                    return (
                    // Wrapper con salida en fade out: al deseleccionar la
                    // geometría, la capa se desvanece antes de desmontarse (la
                    // entrada la maneja el `enter` interno de GeometryLayer).
                    <Animated.View
                      key={g.id}
                      exiting={FadeOut.duration(600)}
                      style={[styles.layer, (tx || ty) ? { transform: [{ translateX: tx }, { translateY: ty }] } : null]}
                      pointerEvents="none"
                    >
                      <GeometryLayer
                        geo={g}
                        index={i}
                        size={layerSize}
                        settings={getSettings(g.id)}
                        liveZoom={
                          g.id === pinchTargetId && livePinchNum != null
                            ? livePinchNum
                            : undefined
                        }
                        liveAngle={
                          g.id === pinchTargetId && liveRotNum != null
                            ? liveRotNum
                            : undefined
                        }
                        masterOpacity={master.opacity}
                        motion={master.motion}
                        glow={master.glow}
                      />
                    </Animated.View>
                    );
                  })}

                {/* ── Guías persistentes del usuario ─────────────────────────
                    Arrastrables: cada GuideHandle tiene su propio Gesture.Pan()
                    y mueve la línea en el hilo UI vía useAnimatedStyle. */}
                {guides.map((g) => (
                  <GuideHandle
                    key={g.id}
                    guide={g}
                    canvasSide={canvasSide}
                    onMove={onMoveGuide}
                  />
                ))}

                {/* ── Líneas guía de snap ─────────────────────────────────────
                    Aparecen mientras se arrastra y hay alineación detectada.
                    snapY → guía horizontal (misma altura) en rosa.
                    snapX → guía vertical  (misma posición X) en rosa.
                    canvasSide/2 + snapOffset convierte offset de capa a px del lienzo. */}
                {liveDragPos?.snapY !== undefined && (
                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      left: 0, right: 0,
                      top: canvasSide / 2 + liveDragPos.snapY,
                      height: 1,
                      backgroundColor: "#FF4B8D",
                    }}
                  />
                )}
                {liveDragPos?.snapX !== undefined && (
                  <View
                    pointerEvents="none"
                    style={{
                      position: "absolute",
                      top: 0, bottom: 0,
                      left: canvasSide / 2 + liveDragPos.snapX,
                      width: 1,
                      backgroundColor: "#FF4B8D",
                    }}
                  />
                )}

                {active.length === 0 && (
                  // Logo + título + bajada entran JUNTOS y con un retardo (650ms)
                  // que espera a que termine el fade out de la geometría (600ms),
                  // así no se topan ni se ve cortado el desvanecido.
                  <Animated.View
                    entering={FadeIn.duration(1100).delay(650)}
                    style={styles.empty}
                    pointerEvents="none"
                  >
                    <View style={styles.emptyLogoWrap}>
                      <Image
                        source={require("@/assets/images/geometrix/cubo-3.png")}
                        style={styles.emptyLogo}
                        contentFit="contain"
                      />
                    </View>
                    <Text style={styles.emptyText}>Toca una geometría para comenzar</Text>
                    <Text style={styles.emptySub}>Combina varias y crea tu composición</Text>
                  </Animated.View>
                )}
              </View>
            </GestureDetector>
          )}

          </View>

          {/* Fila de controles arriba a la derecha: flecha drop-down.
              Vive fuera del "stage" como overlay absoluto de canvasWrap. */}
          <View style={styles.actionTop}>
            {/* Header: píldora con [icono ajustes] | [divisor] | [flecha] */}
            <View style={styles.actionTopRow}>
              <Pressable
                onPress={() => setGeneralOpen(true)}
                style={styles.actionTopBtn}
                accessibilityRole="button"
                accessibilityLabel="Ajustes generales"
                hitSlop={4}
              >
                <Feather name="sliders" size={16} color={colors.mutedForeground} />
              </Pressable>
              <View style={styles.actionTopDivider} />
              <Pressable
                onPress={() => setPillOpen((o) => !o)}
                style={styles.actionTopBtn}
                accessibilityRole="button"
                accessibilityLabel={pillOpen ? "Ocultar acciones" : "Mostrar acciones"}
                hitSlop={4}
              >
                <Feather
                  name={pillOpen ? "chevron-up" : "chevron-down"}
                  size={20}
                  color={colors.mutedForeground}
                />
              </Pressable>
            </View>

            {/* Píldora que se despliega hacia abajo */}
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
          </View>

          {/* "Borrar lienzo": esquina superior izquierda, aparece al activar la
              primera geometría. Letras suaves; limpia todo el lienzo. */}
          {hasActive && (
            <Animated.View
              entering={FadeIn.duration(360)}
              exiting={FadeOut.duration(220)}
              style={styles.clearTop}
            >
              <Pressable
                onPress={clearCanvas}
                style={styles.clearBtn}
                accessibilityRole="button"
                accessibilityLabel="Borrar lienzo"
                hitSlop={8}
              >
                <Feather name="trash-2" size={18} color={colors.mutedForeground} />
              </Pressable>
              {editingCreation && isDirty && (
                <Animated.View entering={FadeIn.duration(260)} exiting={FadeOut.duration(180)} style={{ marginLeft: -5 }}>
                  <Pressable
                    onPress={updateComposition}
                    style={styles.clearBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Actualizar composición"
                    hitSlop={8}
                  >
                    <Feather name="refresh-cw" size={18} color={colors.mutedForeground} />
                  </Pressable>
                </Animated.View>
              )}
            </Animated.View>
          )}

          {/* Thumbnails de geometrías activas: fila centrada anclada 15px sobre
              la tab bar; se reacomoda al agregar/quitar (LinearTransition). */}
          {activeMetas.length > 0 && (
            <ScrollView
              ref={thumbsScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={[styles.thumbsScroll, { bottom: tabBarHeight + 5 }]}
              contentContainerStyle={[
                styles.thumbsRow,
                thumbsOverflow && styles.thumbsRowStart,
              ]}
              onLayout={(e) => {
                thumbsViewW.current = e.nativeEvent.layout.width;
              }}
              onContentSizeChange={(w) => {
                const overflow = w > thumbsViewW.current + 1;
                setThumbsOverflow(overflow);
                if (overflow) {
                  setTimeout(
                    () => thumbsScrollRef.current?.scrollToEnd({ animated: true }),
                    60,
                  );
                }
              }}
            >
              {activeMetas.map((g) => {
                const s = getSettings(g.id);
                const isHidden = hiddenIds.includes(g.id);
                const isSelected = pinchTargetId === g.id;
                return (
                  <Animated.View
                    key={g.id}
                    entering={FadeIn.duration(320)}
                    exiting={FadeOut.duration(200)}
                    layout={LinearTransition.duration(320).easing(
                      Easing.inOut(Easing.ease),
                    )}
                    style={styles.thumbItem}
                  >
                    {/* Tap en la imagen: seleccionar. Si está oculta, tap → mostrar. */}
                    <Pressable
                      onPress={() => {
                        if (isHidden) {
                          setHiddenIds((prev) => prev.filter((id) => id !== g.id));
                        } else {
                          setSelectedId(g.id);
                        }
                      }}
                      style={[styles.thumb, { opacity: isHidden ? 1 : isSelected ? 1 : 0.4 }]}
                      accessibilityRole="button"
                      accessibilityLabel={isHidden ? `Mostrar ${g.name}` : `Seleccionar ${g.name}`}
                    >
                      <SacredGlyph
                        id={g.id}
                        color={s.color}
                        gradient={gradientColors(s.gradientId)}
                        size={37}
                        strokeWidth={1.4}
                      />
                      {/* Overlay oscuro + ojo-tachado cuando la geometría está oculta */}
                      {isHidden && (
                        <View style={styles.thumbHiddenOverlay}>
                          <Feather name="eye-off" size={14} color="rgba(255,255,255,0.85)" />
                        </View>
                      )}
                    </Pressable>
                    {/* Flechita: abre ajustes personalizados directamente. */}
                    <Pressable
                      onPress={() => {
                        setSelectedId(g.id);
                        setSettingsGeoId(g.id);
                        setSettingsOpen(true);
                      }}
                      style={styles.thumbCaret}
                      hitSlop={8}
                      accessibilityRole="button"
                      accessibilityLabel={`Ajustes de ${g.name}`}
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
            colors={canvasBgColors}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {master.bgPattern && (
            <GeometrixPatternBg
              geoId={master.bgPattern.geoId}
              opacity={master.bgPattern.opacity}
              tileSize={master.bgPattern.tileSize}
              spacing={master.bgPattern.spacing}
              color={colors.primary}
            />
          )}
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

      {/* Popup temático de "Guardada" (reemplaza el Alert nativo). */}
      <Modal
        visible={!!savedName}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setSavedName(null)}
      >
        <Pressable style={styles.savedBackdrop} onPress={() => setSavedName(null)}>
          <Pressable style={styles.savedCard} onPress={() => {}}>
            <LinearGradient
              colors={HOME_GRADIENT}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View style={styles.savedIcon}>
              <Feather name="check" size={26} color={colors.primary} />
            </View>
            <Text style={styles.savedTitle}>Guardada</Text>
            <Text style={styles.savedSubtitle}>
              <Text style={styles.savedName}>“{savedName}”</Text> se guardó en este dispositivo.
            </Text>
            <View style={styles.savedActions}>
              <Pressable
                style={styles.savedBtnGhost}
                onPress={() => setSavedName(null)}
                accessibilityRole="button"
              >
                <Text style={styles.savedBtnGhostText}>Seguir editando</Text>
              </Pressable>
              <Pressable
                style={styles.savedBtnPrimary}
                onPress={() => {
                  setSavedName(null);
                  router.push("/geometrix-creaciones");
                }}
                accessibilityRole="button"
              >
                <Text style={styles.savedBtnPrimaryText}>Ver mis creaciones</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Popup "¡Actualizada!" — aparece al hacer patch de una creación existente. */}
      <Modal
        visible={!!updatedName}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setUpdatedName(null)}
      >
        <Pressable style={styles.savedBackdrop} onPress={() => setUpdatedName(null)}>
          <Pressable style={styles.savedCard} onPress={() => {}}>
            <LinearGradient
              colors={HOME_GRADIENT}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View style={styles.savedIcon}>
              <Feather name="refresh-cw" size={24} color={colors.primary} />
            </View>
            <Text style={styles.savedTitle}>¡Actualizada!</Text>
            <Text style={styles.savedSubtitle}>
              <Text style={styles.savedName}>"{updatedName}"</Text> se actualizó correctamente en tus creaciones.
            </Text>
            <View style={styles.savedActions}>
              <Pressable
                style={styles.savedBtnGhost}
                onPress={() => setUpdatedName(null)}
                accessibilityRole="button"
              >
                <Text style={styles.savedBtnGhostText}>Seguir editando</Text>
              </Pressable>
              <Pressable
                style={styles.savedBtnPrimary}
                onPress={() => {
                  setUpdatedName(null);
                  router.push("/geometrix-creaciones");
                }}
                accessibilityRole="button"
              >
                <Text style={styles.savedBtnPrimaryText}>Ver mis creaciones</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Popup "Lienzo vacío" — reemplaza el Alert nativo al guardar sin geometrías. */}
      <Modal
        visible={showEmptyAlert}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowEmptyAlert(false)}
      >
        <Pressable style={styles.savedBackdrop} onPress={() => setShowEmptyAlert(false)}>
          <Pressable style={styles.savedCard} onPress={() => {}}>
            <LinearGradient
              colors={HOME_GRADIENT}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <Text style={styles.savedTitle}>Lienzo vacío</Text>
            <Text style={styles.savedSubtitle}>
              Activá al menos una geometría antes de guardar.
            </Text>
            <View style={styles.savedActions}>
              <Pressable
                style={styles.savedBtnPrimary}
                onPress={() => setShowEmptyAlert(false)}
                accessibilityRole="button"
              >
                <Text style={styles.savedBtnPrimaryText}>Entendido</Text>
              </Pressable>
            </View>
          </Pressable>
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
                    setHiddenIds((prev) =>
                      prev.includes(menuGeo.id)
                        ? prev.filter((id) => id !== menuGeo.id)
                        : [...prev, menuGeo.id],
                    );
                    setMenuGeoId(null);
                  }}
                >
                  <Feather
                    name={hiddenIds.includes(menuGeo.id) ? "eye" : "eye-off"}
                    size={18}
                    color="#FFFFFF"
                  />
                  <Text style={[styles.menuItemText, { color: "#FFFFFF" }]}>
                    {hiddenIds.includes(menuGeo.id) ? "Mostrar" : "Ocultar"}
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
                  <Feather name="trash-2" size={18} color="#8a4646" />
                  <Text style={[styles.menuItemText, { color: "#8a4646" }]}>Quitar</Text>
                </Pressable>
              </View>

              <View style={styles.menuDivider} />

              <View style={styles.menuGlyphWrap}>
                <SacredGlyph
                  id={menuGeo.id}
                  color={getSettings(menuGeo.id).color}
                  gradient={gradientColors(getSettings(menuGeo.id).gradientId)}
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
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.55)" }]}
          onPress={() => setGeneralOpen(false)}
        />

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
              <LinearGradient
                colors={canvasBgColors}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={StyleSheet.absoluteFill}
              />
              {master.bgPattern && (
                <GeometrixPatternBg
                  geoId={master.bgPattern.geoId}
                  opacity={master.bgPattern.opacity}
                  tileSize={master.bgPattern.tileSize * (generalPreviewSize / (canvasSide || generalPreviewSize))}
                  spacing={master.bgPattern.spacing}
                  color={colors.primary}
                />
              )}
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
            style={[StyleSheet.absoluteFill, styles.sheetGradient]}
          />
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

          {/* Línea divisora sutil */}
          <View style={styles.sheetHeaderDivider} />

          <View style={[styles.geoCard, { marginTop: -10 }]}>
            {/* Color de fondo del lienzo: indigo por defecto + degradados
                (oscurecidos). Sin colores sólidos. */}
            <Text style={styles.fieldLabel}>Color de fondo</Text>
            <View style={styles.swatchRow}>
              {/* Opción por defecto (fondo indigo original) */}
              <Pressable
                onPress={() =>
                  setMaster((m) => ({ ...m, bgColor: null, bgGradientId: null }))
                }
                style={[styles.swatch, !master.bgGradientId && styles.swatchOn]}
                accessibilityRole="button"
                accessibilityLabel="Fondo por defecto"
              >
                <GradientSwatch
                  colors={[HOME_GRADIENT[0], HOME_GRADIENT[2]]}
                  size={20}
                />
              </Pressable>
              {BG_GRADIENTS.map((gr) => {
                const on = master.bgGradientId === gr.id;
                return (
                  <Pressable
                    key={`bg-${gr.id}`}
                    onPress={() =>
                      setMaster((m) => ({ ...m, bgColor: null, bgGradientId: gr.id }))
                    }
                    style={[styles.swatch, on && styles.swatchOn]}
                    accessibilityRole="button"
                    accessibilityLabel={`Fondo degradado ${gr.id}`}
                  >
                    <GradientSwatch colors={gr.colors} size={20} />
                  </Pressable>
                );
              })}
            </View>

            {/* ── Patrón de fondo (Premium) ──────────────────────── */}
            <View style={{ marginTop: 20 }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.fieldLabel}>Patrón de fondo</Text>
                  {!isPremium && (
                    <View style={{ backgroundColor: colors.primary + "22", borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2, borderWidth: 1, borderColor: colors.primary + "55" }}>
                      <Text style={{ color: colors.primary, fontSize: 10, fontWeight: "700" }}>✦ PREMIUM</Text>
                    </View>
                  )}
                </View>
                <Toggle
                  value={!!master.bgPattern}
                  onChange={(v) => {
                    if (!isPremium) { router.push("/membresia"); return; }
                    setMaster((m) => ({
                      ...m,
                      bgPattern: v
                        ? { geoId: "flor-vida", opacity: 0.08, tileSize: 40, spacing: 1 }
                        : null,
                    }));
                  }}
                  color={colors.primary}
                  compact
                />
              </View>

              {master.bgPattern && (
                <>
                  {/* Selector de geometría */}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    style={{ marginBottom: 12 }}
                    contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}
                  >
                    {GEOMETRIES.map((g) => {
                      const on = master.bgPattern?.geoId === g.id;
                      return (
                        <Pressable
                          key={g.id}
                          onPress={() =>
                            setMaster((m) => ({
                              ...m,
                              bgPattern: m.bgPattern
                                ? { ...m.bgPattern, geoId: g.id }
                                : null,
                            }))
                          }
                          style={{
                            width: 44, height: 52,
                            alignItems: "center", justifyContent: "center",
                            backgroundColor: on ? colors.primary + "22" : "rgba(255,255,255,0.04)",
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: on ? colors.primary + "88" : "rgba(255,255,255,0.08)",
                            gap: 3,
                          }}
                        >
                          <SacredGlyph id={g.id} color={on ? colors.primary : colors.mutedForeground} size={30} strokeWidth={1.4} />
                          <Text numberOfLines={1} style={{ color: on ? colors.primary : colors.mutedForeground, fontSize: 7, width: 42, textAlign: "center" }}>{g.name}</Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                  {/* Tamaño del tile */}
                  <Text style={[styles.fieldLabel, { marginBottom: 8 }]}>Tamaño</Text>
                  <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
                    {([["Pequeño", 22], ["Mediano", 42], ["Grande", 72]] as [string, number][]).map(([label, size]) => {
                      const on = master.bgPattern?.tileSize === size;
                      return (
                        <Pressable
                          key={size}
                          onPress={() =>
                            setMaster((m) => ({
                              ...m,
                              bgPattern: m.bgPattern ? { ...m.bgPattern, tileSize: size } : null,
                            }))
                          }
                          style={{
                            flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center",
                            backgroundColor: on ? colors.primary + "25" : "rgba(255,255,255,0.04)",
                            borderWidth: 1,
                            borderColor: on ? colors.primary + "88" : "rgba(255,255,255,0.09)",
                          }}
                        >
                          <Text style={{ color: on ? colors.primary : colors.mutedForeground, fontWeight: "600", fontSize: 13 }}>
                            {label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Espaciado entre tiles */}
                  <Text style={[styles.fieldLabel, { marginBottom: 8 }]}>Espaciado</Text>
                  <View style={{ flexDirection: "row", gap: 8, marginBottom: 14 }}>
                    {([["Separadas", 1], ["Pegadas", 0.82], ["Superpuestas", 0.67]] as [string, number][]).map(([label, sp]) => {
                      const on = master.bgPattern?.spacing === sp;
                      return (
                        <Pressable
                          key={sp}
                          onPress={() =>
                            setMaster((m) => ({
                              ...m,
                              bgPattern: m.bgPattern ? { ...m.bgPattern, spacing: sp } : null,
                            }))
                          }
                          style={{
                            flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: "center",
                            backgroundColor: on ? colors.primary + "25" : "rgba(255,255,255,0.04)",
                            borderWidth: 1,
                            borderColor: on ? colors.primary + "88" : "rgba(255,255,255,0.09)",
                          }}
                        >
                          <Text style={{ color: on ? colors.primary : colors.mutedForeground, fontWeight: "600", fontSize: 13 }}>
                            {label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Opacidad del patrón */}
                  <Text style={[styles.fieldLabel, { marginBottom: 6 }]}>Intensidad del patrón</Text>
                  <VolumeSlider
                    value={master.bgPattern.opacity}
                    onChange={(v) =>
                      setMaster((m) => ({
                        ...m,
                        bgPattern: m.bgPattern ? { ...m.bgPattern, opacity: Math.min(0.4, Math.max(0, v)) } : null,
                      }))
                    }
                    color={colors.primary}
                    trackColor="rgba(255,255,255,0.12)"
                  />
                </>
              )}
            </View>

            {/* Opacidad de las animaciones */}
            <View style={[styles.fieldRow, { marginTop: 18 }]}>
              <Text style={styles.fieldLabel}>Opacidad animaciones</Text>
            </View>
            <VolumeSlider
              value={master.opacity}
              onChange={(v) =>
                setMaster((m) => ({
                  ...m,
                  opacity: Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : m.opacity,
                }))
              }
              color="#FFFFFF"
              trackColor="rgba(255,255,255,0.12)"
            />

            {/* Brillo del fondo seleccionado */}
            <View style={[styles.fieldRow, { marginTop: 18 }]}>
              <Text style={styles.fieldLabel}>Brillo del fondo</Text>
            </View>
            <VolumeSlider
              value={master.bgBrightness}
              onChange={(v) =>
                setMaster((m) => ({
                  ...m,
                  bgBrightness: Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : m.bgBrightness,
                }))
              }
              color="#FFFFFF"
              trackColor="rgba(255,255,255,0.12)"
            />

            {/* Glow general */}
            <View style={[styles.fieldRow, { marginTop: 18 }]}>
              <Text style={styles.fieldLabel}>Glow general</Text>
            </View>
            <VolumeSlider
              value={master.glow}
              onChange={(v) =>
                setMaster((m) => ({
                  ...m,
                  glow: Number.isFinite(v) ? Math.min(1, Math.max(0, v)) : m.glow,
                }))
              }
              color="#FFFFFF"
              trackColor="rgba(255,255,255,0.12)"
            />

            {/* ── Caleidoscopio global ──────────────────────────────── */}
            {activeMetas.length > 0 && (() => {
              const allOn = activeMetas.every((g) => getSettings(g.id).kaleidoscope === true);
              const anyOn = activeMetas.some((g) => getSettings(g.id).kaleidoscope === true);
              const segs  = getSettings(activeMetas[0].id).kaleidSegments ?? 6;
              return (
                <View style={{ marginTop: 18 }}>
                  <View style={{
                    flexDirection: "row", alignItems: "center",
                    justifyContent: "space-between",
                    paddingVertical: 8, paddingHorizontal: 10,
                    backgroundColor: anyOn ? colors.primary + "14" : "rgba(255,255,255,0.03)",
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: anyOn ? colors.primary + "55" : "rgba(255,255,255,0.07)",
                  }}>
                    <Text style={{ color: anyOn ? colors.primary : colors.mutedForeground, fontWeight: "600", fontSize: 13 }}>
                      Caleidoscopio (todas las capas)
                    </Text>
                    <Toggle
                      value={allOn}
                      onChange={(v) => {
                        activeMetas.forEach((g) => updateSetting(g.id, "kaleidoscope", v));
                      }}
                      color={colors.primary}
                      compact
                    />
                  </View>
                  {anyOn && (
                    <View style={{ marginTop: 10 }}>
                      <Text style={[styles.fieldLabel, { marginBottom: 8 }]}>Segmentos</Text>
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        {[4, 6, 8, 12, 16].map((n) => {
                          const on = segs === n;
                          return (
                            <Pressable
                              key={n}
                              onPress={() => activeMetas.forEach((g) => updateSetting(g.id, "kaleidSegments", n))}
                              style={{
                                flex: 1, paddingVertical: 8, borderRadius: 10,
                                alignItems: "center",
                                backgroundColor: on ? colors.primary + "25" : "rgba(255,255,255,0.04)",
                                borderWidth: 1,
                                borderColor: on ? colors.primary + "88" : "rgba(255,255,255,0.09)",
                              }}
                            >
                              <Text style={{ color: on ? colors.primary : colors.mutedForeground, fontWeight: "700", fontSize: 14 }}>
                                {n}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  )}
                </View>
              );
            })()}
          </View>
        </View>
        </View>
      </Modal>

      {/* ── Panel de guías del usuario ──────────────────────────────────── */}
      <Modal
        visible={guidesOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setGuidesOpen(false)}
      >
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
          <Pressable
            style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.55)" }]}
            onPress={() => setGuidesOpen(false)}
          />
          <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <LinearGradient
              colors={HOME_GRADIENT}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={[StyleSheet.absoluteFill, styles.sheetGradient]}
            />
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Guías</Text>
              <Pressable onPress={() => setGuidesOpen(false)} hitSlop={10}
                accessibilityRole="button" accessibilityLabel="Cerrar guías">
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <View style={styles.sheetHeaderDivider} />

            {/* ── Crear nueva guía ─────────────────────────────────── */}
            <View style={{ marginTop: 14 }}>
              <Text style={styles.fieldLabel}>Orientación</Text>
              <View style={{ flexDirection: "row", gap: 10, marginTop: 8 }}>
                {(["h", "v"] as const).map((ori) => (
                  <Pressable
                    key={ori}
                    onPress={() => setGuideOrientation(ori)}
                    style={{
                      flex: 1, paddingVertical: 10, borderRadius: 10,
                      alignItems: "center",
                      backgroundColor: guideOrientation === ori ? colors.primary + "25" : "rgba(255,255,255,0.04)",
                      borderWidth: 1,
                      borderColor: guideOrientation === ori ? colors.primary + "88" : "rgba(255,255,255,0.09)",
                    }}
                  >
                    <Text style={{
                      color: guideOrientation === ori ? colors.primary : colors.mutedForeground,
                      fontWeight: "600", fontSize: 14,
                    }}>
                      {ori === "h" ? "Horizontal" : "Vertical"}
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Text style={[styles.fieldLabel, { marginTop: 14 }]}>Posición</Text>
              <View style={{ flexDirection: "row", gap: 6, marginTop: 8 }}>
                {[0, 25, 50, 75, 100].map((p) => (
                  <Pressable
                    key={p}
                    onPress={() => setGuidePct(String(p))}
                    style={{
                      flex: 1, paddingVertical: 8, borderRadius: 20, alignItems: "center",
                      backgroundColor: guidePct === String(p) ? colors.primary + "25" : "rgba(255,255,255,0.04)",
                      borderWidth: 1,
                      borderColor: guidePct === String(p) ? colors.primary + "88" : "rgba(255,255,255,0.08)",
                    }}
                  >
                    <Text style={{
                      color: guidePct === String(p) ? colors.primary : colors.mutedForeground,
                      fontSize: 13,
                    }}>
                      {p}%
                    </Text>
                  </Pressable>
                ))}
              </View>

              <Pressable
                onPress={() => {
                  const pct = Math.min(100, Math.max(0, parseInt(guidePct, 10) || 0));
                  const newGuide: CanvasGuide = {
                    id: String(Date.now()),
                    orientation: guideOrientation,
                    pct,
                  };
                  setGuides((prev) => [...prev, newGuide]);
                  setGuidesOpen(false);
                }}
                style={{
                  marginTop: 14,
                  backgroundColor: colors.primary + "1A",
                  borderRadius: 12, paddingVertical: 12, alignItems: "center",
                  borderWidth: 1, borderColor: colors.primary + "44",
                }}
              >
                <Text style={{ color: colors.primary, fontWeight: "600" }}>Agregar guía</Text>
              </Pressable>
            </View>

            {/* ── Lista de guías activas ────────────────────────── */}
            {guides.length > 0 && (
              <>
                <View style={[styles.sheetHeaderDivider, { marginTop: 18 }]} />
                <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Guías activas</Text>
                {guides.map((g) => (
                  <View
                    key={g.id}
                    style={{ flexDirection: "row", alignItems: "center", marginTop: 10, justifyContent: "space-between" }}
                  >
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                      <View style={{
                        width: 30, height: 30, borderRadius: 8,
                        backgroundColor: GUIDE_COLOR + "22",
                        alignItems: "center", justifyContent: "center",
                      }}>
                        <Text style={{ color: GUIDE_COLOR, fontWeight: "700", fontSize: 11 }}>
                          {g.orientation.toUpperCase()}
                        </Text>
                      </View>
                      <Text style={{ color: colors.foreground, fontSize: 14 }}>{g.pct}%</Text>
                    </View>
                    <Pressable
                      hitSlop={12}
                      accessibilityRole="button"
                      accessibilityLabel={`Borrar guía ${g.orientation === "h" ? "horizontal" : "vertical"} ${g.pct}%`}
                      onPress={() => setGuides((prev) => prev.filter((x) => x.id !== g.id))}
                    >
                      <Feather name="trash-2" size={16} color={colors.mutedForeground} />
                    </Pressable>
                  </View>
                ))}
              </>
            )}
          </View>
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
        <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <Pressable
          style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.55)" }]}
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
              {master.bgPattern && (
                <GeometrixPatternBg
                  geoId={master.bgPattern.geoId}
                  opacity={master.bgPattern.opacity}
                  tileSize={master.bgPattern.tileSize * (previewSize / (canvasSide || previewSize))}
                  spacing={master.bgPattern.spacing}
                  color={colors.primary}
                />
              )}
              {/* Se muestran TODAS las geometrías seleccionadas (no solo la que se
                  personaliza) para ver la composición completa en vivo. */}
              {visibleMetas.map((g, i) => (
                <GeometryLayer
                  key={g.id}
                  geo={g}
                  index={i}
                  size={previewSize * 0.96}
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
            style={[
              StyleSheet.absoluteFill,
              { borderTopLeftRadius: 24, borderTopRightRadius: 24 },
            ]}
          />
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderLeft}>
              {settingsGeo ? (
                <>
                  <SacredGlyph
                    id={settingsGeo.id}
                    color={getSettings(settingsGeo.id).color}
                    size={22}
                    strokeWidth={2.4}
                  />
                  <Text style={styles.geoCardName} numberOfLines={1}>
                    {settingsGeo.name}
                  </Text>
                </>
              ) : (
                <Text style={styles.sheetTitle}>Ajustes</Text>
              )}
            </View>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              {/* Ocultar / mostrar */}
              {settingsGeo && (
                <>
                  <Pressable
                    onPress={() => {
                      const id = settingsGeo.id;
                      setHiddenIds((prev) =>
                        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
                      );
                      setSettingsOpen(false);
                      setSettingsGeoId(null);
                    }}
                    hitSlop={10}
                    style={{ paddingHorizontal: 10 }}
                    accessibilityRole="button"
                    accessibilityLabel={hiddenIds.includes(settingsGeo.id) ? "Mostrar geometría" : "Ocultar geometría"}
                  >
                    <Feather
                      name={hiddenIds.includes(settingsGeo.id) ? "eye" : "eye-off"}
                      size={19}
                      color={colors.mutedForeground}
                    />
                  </Pressable>
                  <View style={styles.sheetHeaderVDivider} />
                  {/* Borrar */}
                  <Pressable
                    onPress={() => {
                      const id = settingsGeo.id;
                      setSettingsOpen(false);
                      setSettingsGeoId(null);
                      toggleGeometry(id);
                    }}
                    hitSlop={10}
                    style={{ paddingHorizontal: 10 }}
                    accessibilityRole="button"
                    accessibilityLabel="Borrar geometría"
                  >
                    <Feather name="trash-2" size={18} color="#8a4646" />
                  </Pressable>
                  <View style={styles.sheetHeaderVDivider} />
                </>
              )}
              <Pressable
                onPress={() => {
                  setSettingsOpen(false);
                  setSettingsGeoId(null);
                }}
                hitSlop={10}
                style={{ paddingLeft: 10 }}
                accessibilityRole="button"
                accessibilityLabel="Cerrar ajustes"
              >
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>
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
                  {/* ── Caleidoscopio ─────────────────────────────────────── */}
                  <View style={{
                    flexDirection: "row", alignItems: "center",
                    justifyContent: "space-between", marginBottom: 10,
                    paddingVertical: 8, paddingHorizontal: 10,
                    backgroundColor: s.kaleidoscope ? colors.primary + "14" : "rgba(255,255,255,0.03)",
                    borderRadius: 10,
                    borderWidth: 1,
                    borderColor: s.kaleidoscope ? colors.primary + "55" : "rgba(255,255,255,0.07)",
                  }}>
                    <Text style={{ color: s.kaleidoscope ? colors.primary : colors.mutedForeground, fontWeight: "600", fontSize: 13 }}>
                      Caleidoscopio
                    </Text>
                    <Toggle
                      value={s.kaleidoscope ?? false}
                      onChange={(v) => updateSetting(g.id, "kaleidoscope", v)}
                      color={colors.primary}
                      compact
                    />
                  </View>
                  {s.kaleidoscope && (
                    <View style={{ marginBottom: 12 }}>
                      <Text style={[styles.fieldLabel, { marginBottom: 8 }]}>Segmentos</Text>
                      <View style={{ flexDirection: "row", gap: 8 }}>
                        {[4, 6, 8, 12, 16].map((n) => {
                          const on = (s.kaleidSegments ?? 6) === n;
                          return (
                            <Pressable
                              key={n}
                              onPress={() => updateSetting(g.id, "kaleidSegments", n)}
                              style={{
                                flex: 1, paddingVertical: 8, borderRadius: 10,
                                alignItems: "center",
                                backgroundColor: on ? colors.primary + "25" : "rgba(255,255,255,0.04)",
                                borderWidth: 1,
                                borderColor: on ? colors.primary + "88" : "rgba(255,255,255,0.09)",
                              }}
                            >
                              <Text style={{ color: on ? colors.primary : colors.mutedForeground, fontWeight: "700", fontSize: 14 }}>
                                {n}
                              </Text>
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  )}

                  {/* Toggles (on/off) en cuadrícula 2 cols: etiqueta izq, switch der */}
                  <View style={styles.toggleGrid}>
                    <View style={styles.toggleGridItem}>
                      <Text style={styles.toggleTriLabel} numberOfLines={2}>
                        Fade
                      </Text>
                      <Toggle
                        value={s.fadeLoop}
                        onChange={(v) => updateSetting(g.id, "fadeLoop", v)}
                        color={TOGGLE_ON_COLOR}
                        compact
                      />
                    </View>
                    <View style={styles.toggleGridItem}>
                      <Text style={styles.toggleTriLabel} numberOfLines={2}>
                        Girar izquierda
                      </Text>
                      <Toggle
                        value={s.rotateLeft}
                        onChange={(v) => {
                          updateSetting(g.id, "rotateLeft", v);
                          if (v) updateSetting(g.id, "rotate", false);
                        }}
                        color={TOGGLE_ON_COLOR}
                        compact
                      />
                    </View>
                    <View style={styles.toggleGridItem}>
                      <Text style={styles.toggleTriLabel} numberOfLines={2}>
                        Respirar
                      </Text>
                      <Toggle
                        value={s.breathe}
                        onChange={(v) => updateSetting(g.id, "breathe", v)}
                        color={TOGGLE_ON_COLOR}
                        compact
                      />
                    </View>
                    <View style={styles.toggleGridItem}>
                      <Text style={styles.toggleTriLabel} numberOfLines={2}>
                        Girar derecha
                      </Text>
                      <Toggle
                        value={s.rotate}
                        onChange={(v) => {
                          updateSetting(g.id, "rotate", v);
                          if (v) updateSetting(g.id, "rotateLeft", false);
                        }}
                        color={TOGGLE_ON_COLOR}
                        compact
                      />
                    </View>
                  </View>

                  {/* Color */}
                  <Text style={styles.fieldLabel}>Color sólido</Text>
                  <View style={styles.swatchRow}>
                    {PALETTE.map((c) => {
                      const on =
                        !s.gradientId &&
                        s.color.toLowerCase() === c.toLowerCase();
                      return (
                        <Pressable
                          key={c}
                          onPress={() => {
                            updateSetting(g.id, "color", c);
                            updateSetting(g.id, "gradientId", null);
                          }}
                          style={[styles.swatch, on && styles.swatchOn]}
                          accessibilityRole="button"
                          accessibilityLabel={`Color ${c}`}
                        >
                          <View
                            style={[styles.swatchFill, { backgroundColor: c }]}
                          />
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Degradado: 7 opciones de la misma paleta */}
                  <Text style={[styles.fieldLabel, styles.gradientLabel]}>
                    Color degradado
                  </Text>
                  <View style={styles.swatchRow}>
                    {STROKE_GRADIENTS.map((gr) => {
                      const on = s.gradientId === gr.id;
                      return (
                        <Pressable
                          key={gr.id}
                          onPress={() =>
                            updateSetting(
                              g.id,
                              "gradientId",
                              on ? null : gr.id,
                            )
                          }
                          style={[styles.swatch, on && styles.swatchOn]}
                          accessibilityRole="button"
                          accessibilityLabel={`Degradado ${gr.id}`}
                        >
                          <GradientSwatch colors={gr.colors} size={20} />
                        </Pressable>
                      );
                    })}
                  </View>

                  {/* Opacidad */}
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Opacidad</Text>
                  </View>
                  <VolumeSlider
                    value={s.opacity}
                    onChange={(v) => updateSetting(g.id, "opacity", Math.max(0, v))}
                    color="#FFFFFF"
                    trackColor="rgba(255,255,255,0.12)"
                  />

                  {/* Grosor */}
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Grosor</Text>
                  </View>
                  <VolumeSlider
                    value={s.thickness}
                    onChange={(v) => updateSetting(g.id, "thickness", v)}
                    color="#FFFFFF"
                    trackColor="rgba(255,255,255,0.12)"
                  />

                  {/* Tamaño */}
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Tamaño</Text>
                  </View>
                  <VolumeSlider
                    value={s.scale}
                    onChange={(v) => updateSetting(g.id, "scale", v)}
                    color="#FFFFFF"
                    trackColor="rgba(255,255,255,0.12)"
                  />

                  {/* Glow propio */}
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Glow</Text>
                  </View>
                  <VolumeSlider
                    value={s.glow}
                    onChange={(v) => updateSetting(g.id, "glow", v)}
                    color="#FFFFFF"
                    trackColor="rgba(255,255,255,0.12)"
                  />
                </View>
                </ScrollView>
              );
            })()
          )}
        </View>
        </View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#06070F" },
  content:  { flex: 1, paddingHorizontal: 20 },
  topPanel: { marginHorizontal: -20 },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    marginBottom: 14,
    paddingHorizontal: 20,
  },
  headerText: { flex: 1, paddingRight: 12 },
  creacionesBtn: {
    width: 39,
    height: 39,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 30, fontWeight: "700", color: "#FFFFFF", letterSpacing: 0.3 },
  subtitle: { fontSize: 13, color: colors.mutedForeground, marginTop: 3 },

  grid: { flexGrow: 0 },
  gridContent: { paddingVertical: 2, paddingLeft: 20, paddingRight: 20 },
  gridRow: { flexDirection: "row", gap: 8 },
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
    marginHorizontal: -20,
  },

  canvasWrap: {
    flex: 1,
    alignItems: "center",
  },
  // Capa de fondo del lienzo: edge-to-edge (left/right -20 rompe el padding
  // del content). Empieza en la divisora (top: 0); el color llega justo a la
  // línea, sin degradado.
  canvasBgLayer: {
    position: "absolute",
    left: -20,
    right: -20,
    top: 0,
    bottom: 0,
  },
  stage: {
    flex: 1,
    alignSelf: "stretch",
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateY: -28 }],
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
    flexDirection: "column",
    alignItems: "flex-end",
  },
  actionTopRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(122,143,168,0.45)",
    backgroundColor: "rgba(255,255,255,0.02)",
    overflow: "hidden",
  },
  actionTopBtn: {
    width: 38,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTopDivider: {
    width: StyleSheet.hairlineWidth,
    height: 16,
    backgroundColor: "rgba(122,143,168,0.4)",
  },
  clearTop: {
    position: "absolute",
    top: 10,
    left: 0,
    zIndex: 6,
    flexDirection: "row",
    alignItems: "center",
  },
  clearBtn: {
    width: 40,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  chevronBtn: {
    width: 40,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(122,143,168,0.45)",
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  pillRow: {
    marginTop: 6,
    flexDirection: "column",
    alignItems: "center",
    gap: 2,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
  pillBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
  },
  pillDivider: {
    width: 18,
    height: StyleSheet.hairlineWidth,
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
  thumbsRowStart: {
    justifyContent: "flex-start",
  },
  thumb: {
    width: 44,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbHiddenOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  thumbItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#101532",
    borderRadius: 16,
    backgroundColor: "transparent",
    paddingVertical: 1,
    paddingHorizontal: 6,
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

  // Popup "Guardada" (estilo navy + dorado, igual al resto de la UI).
  savedBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  savedCard: {
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
  savedIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(190,150,80,0.12)",
    borderWidth: 1,
    borderColor: "rgba(190,150,80,0.4)",
    marginBottom: 2,
  },
  savedTitle: { fontSize: 19, fontWeight: "700", color: colors.foreground },
  savedSubtitle: {
    fontSize: 13.5,
    color: colors.mutedForeground,
    textAlign: "center",
    lineHeight: 20,
  },
  savedName: { color: colors.foreground, fontWeight: "600" },
  savedActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    alignSelf: "stretch",
  },
  savedBtnGhost: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: CARD_BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  savedBtnGhostText: { fontSize: 14, fontWeight: "600", color: colors.mutedForeground },
  savedBtnPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  savedBtnPrimaryText: { fontSize: 14, fontWeight: "700", color: colors.primaryForeground },

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
    paddingTop: 15,
    maxHeight: "78%",
  },
  // overflow:"hidden" en el sheet ya clipea el gradient — no se necesita borderRadius aquí
  sheetGradient: {},
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
    marginBottom: 15,
  },
  sheetHeaderLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
  },
  sheetHeaderVDivider: {
    width: 1,
    height: 18,
    backgroundColor: "rgba(255,255,255,0.18)",
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
  geoCardName: {
    flexShrink: 1,
    minWidth: 0,
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  toggleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    rowGap: 14,
    columnGap: 14,
    marginTop: 6,
    marginBottom: 8,
  },
  toggleGridItem: {
    width: "46%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  toggleTriLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: colors.mutedForeground,
    textAlign: "left",
    flexShrink: 1,
  },

  gradientLabel: { marginTop: 10 },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: colors.mutedForeground },
  fieldRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fieldRowGap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 15,
  },
  twoCol: { flexDirection: "row", gap: 16 },
  col: { flex: 1, minWidth: 0 },

  swatchRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  swatch: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  swatchFill: { width: 20, height: 20, borderRadius: 10, borderWidth: 1, borderColor: "#4b4f5c" },
  swatchOn: { borderColor: "#EDE1D3" },

  empty: { alignItems: "center", gap: 6 },
  emptyLogoWrap: { marginBottom: 10 },
  emptyLogo: { width: 43, height: 43, opacity: 0.9 },
  emptyText: { fontSize: 14, fontWeight: "600", color: "#FFFFFF", marginTop: 4 },
  emptySub: { fontSize: 12, color: colors.mutedForeground },

});
