/**
 * GEOMETRIX — galería de geometrías sagradas + fondo animado interactivo.
 * El usuario activa geometrías por capas para componer un fondo en vivo.
 */
import { Feather } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { GoldGradientFill } from "@/components/GoldGradient";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  BackHandler,
  InteractionManager,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  unstable_batchedUpdates,
  useWindowDimensions,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  Easing,
  FadeIn,
  FadeInDown,
  FadeOut,
  interpolateColor,
  LinearTransition,
  runOnJS,
  scrollTo,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useDerivedValue,
  useFrameCallback,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";

// TextInput animable: el badge de ángulo actualiza su texto en el UI thread
// (vía animatedProps) sin re-render de React por frame — evita el microlag al
// rotar con los dedos. Patrón "ReText".
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackPill } from "@/components/BackPill";

import Svg, {
  Circle,
  Defs,
  G,
  Line,
  LinearGradient as SvgLinearGradient,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
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
import { GEOMETRIES, GEOMETRY_CATEGORIES, PALETTE, baseOf, categoryOf, getGeometry, INSTANCE_SEP, type GeometryId, type GeometryMeta, type GeometryCategory } from "@/data/geometries";
import { type GeometryMetaExtended } from "@/hooks/useGeometrixCatalog";
import {
  BG_GRADIENTS,
  bgGradientColors,
  HEADER_GRADIENT,
  brightnessFactor,
  gradientColors,
  HOME_GRADIENT,
  scaleColors,
  scaleHex,
  STROKE_GRADIENTS,
  type BgPattern,
  type CanvasGuide,
  type GeoSettings,
  type GlobalSettings,
} from "@/data/geometrix-creations";
import { usePremium } from "@/context/PremiumContext";
import { sendHeartbeat } from "@/lib/communityApi";
import { usePlayer } from "@/context/PlayerContext";
import { useTabBarVisibility } from "@/context/TabBarVisibilityContext";
import { useGeometrixPanel } from "@/context/GeometrixPanelContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { getSceneTabSurface } from "@/utils/scene-tab";
import { useGeometrixCreations } from "@/hooks/useGeometrixCreations";
import { useGeometrixCatalog } from "@/hooks/useGeometrixCatalog";
import { AUDIO_MAP } from "@/config/audio-map";
import { SESSIONS, type Session } from "@/data/sessions";

const colors = colorsConst.light;
const CARD_BORDER = "rgba(123,100,255,0.08)";
const CANVAS_ICON = "rgba(251,249,241,0.50)";

// Snapshot inmutable de una composición, para el historial de "Atrás".
type CompSnapshot = {
  active: string[];
  settings: Record<string, GeoSettings>;
  master: GlobalSettings;
  hiddenIds: string[];
};
// Máximo de pasos guardados en la pila de deshacer.
const HISTORY_LIMIT = 50;
// Ventana de agrupado (ms): cambios dentro de este lapso = un solo paso.
const HISTORY_DEBOUNCE_MS = 350;

// hex (#rrggbb) → rgba con alpha. Usado para los bordes de las cards del carrusel.
const hexAlpha = (hex: string, a: number) => {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${a})`;
};

// Carrusel de geometrías — animación de selección estilo "Aurora".
// HOLD = activación "en el lugar" (color + resplandor) antes de deslizarse al
// frente; FLOW = duración del glide/reorden; EASE = curva fluida sin rebote.
const CAROUSEL_HOLD_MS = 1000;
const CAROUSEL_FLOW_MS = 1100;
const CAROUSEL_EASE = Easing.bezier(0.25, 0.1, 0.25, 1);
const LOUPE_SIZE = 130;
const LOUPE_M = 2.6;


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
    breatheAmount: 0,
    fadeLoopAmount: 0,
    glow: 0,
    thickness: 0,
    scale: 1,
    zoom: 1,
    manualAngle: 0,
    offsetX: 0,
    offsetY: 0,
    kaleidoscope: false,
    kaleidSegments: 6,
    saturation: 0.5,
    bloom: 0,
    halo: 0,
    ripple: 0,
    expansionAmount: 0,
  };
}

// Claves de transformación por gesto (posición/zoom/ángulo/tamaño): NO son
// "ajustes personalizados", así que no cuentan para detectar cambios ni se
// restablecen (Restablecer no debe mover la geometría del lienzo).
const TRANSFORM_KEYS: (keyof GeoSettings)[] = [
  "scale",
  "zoom",
  "manualAngle",
  "offsetX",
  "offsetY",
];

// Color fijo del fondo del toggle cuando está activado (estático, no usa el color de la geometría).
const TOGGLE_ON_COLOR = "#BBA8E8";
// Color de las guías persistentes del usuario (violeta visible sobre fondos oscuros).
const GUIDE_COLOR = "#7B64FF";

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

// ── Helpers de color (saturación / mezcla) ───────────────────────────────────
function clamp01(n: number) {
  return Math.max(0, Math.min(1, n));
}
function parseHex(hex: string): [number, number, number] {
  let h = (hex || "").replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  const n = parseInt(h || "000000", 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function toHex(r: number, g: number, b: number): string {
  const h = (v: number) => Math.round(clamp01(v / 255) * 255).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}
function mixHex(a: string, b: string, t: number): string {
  const [ar, ag, ab] = parseHex(a);
  const [br, bg, bb] = parseHex(b);
  return toHex(ar + (br - ar) * t, ag + (bg - ag) * t, ab + (bb - ab) * t);
}
/** Ajusta la saturación. amount 0–1: 0.5 = original, 0 = gris, 1 = sobresaturado. */
function adjustSaturation(hex: string, amount: number): string {
  if (!hex || hex[0] !== "#") return hex;
  const [r, g, b] = parseHex(hex);
  const gray = 0.299 * r + 0.587 * g + 0.114 * b;
  const m = clamp01(amount) * 2;
  return toHex(gray + (r - gray) * m, gray + (g - gray) * m, gray + (b - gray) * m);
}
function saturateGrad(
  grad: readonly [string, string] | undefined,
  amount: number,
): readonly [string, string] | undefined {
  if (!grad || amount === 0.5) return grad;
  return [adjustSaturation(grad[0], amount), adjustSaturation(grad[1], amount)] as const;
}

// ── Halo: aura radial suave detrás del glifo ─────────────────────────────────
function HaloGlow({ size, color, amount }: { size: number; color: string; amount: number }) {
  const a = clamp01(amount);
  // Id único por instancia: dos capas con halo + colores distintos no deben
  // compartir el id del gradiente (choque → color equivocado). Saneado sin ":".
  const gid = `geo-halo-${React.useId().replace(/:/g, "")}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 100 100" pointerEvents="none">
      <Defs>
        <RadialGradient id={gid} cx="50%" cy="50%" r="50%">
          <Stop offset="0" stopColor={color} stopOpacity={0.5 * a} />
          <Stop offset="0.5" stopColor={color} stopOpacity={0.2 * a} />
          <Stop offset="1" stopColor={color} stopOpacity={0} />
        </RadialGradient>
      </Defs>
      <Circle cx="50" cy="50" r="50" fill={`url(#${gid})`} />
    </Svg>
  );
}

// ── Ripple: anillos concéntricos que emanan en bucle ─────────────────────────
function RippleRings({ size, color, amount }: { size: number; color: string; amount: number }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 2600, easing: Easing.out(Easing.ease) }), -1, false);
    return () => cancelAnimation(t);
  }, [t]);
  const a = clamp01(amount);
  const ring1 = useAnimatedStyle(() => {
    const p = t.value;
    return { transform: [{ scale: 0.4 + p * 0.9 }], opacity: (1 - p) * 0.6 * a };
  });
  const ring2 = useAnimatedStyle(() => {
    const p = (t.value + 0.5) % 1;
    return { transform: [{ scale: 0.4 + p * 0.9 }], opacity: (1 - p) * 0.6 * a };
  });
  return (
    <>
      <Animated.View style={[styles.layer, ring1]} pointerEvents="none">
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="46" stroke={color} strokeWidth={1.6} fill="none" />
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.layer, ring2]} pointerEvents="none">
        <Svg width={size} height={size} viewBox="0 0 100 100">
          <Circle cx="50" cy="50" r="46" stroke={color} strokeWidth={1.6} fill="none" />
        </Svg>
      </Animated.View>
    </>
  );
}

// ── Expansión: eco del glifo que crece y se desvanece en bucle ───────────────
function ExpansionEcho({
  geoId,
  color,
  grad,
  size,
  strokeWidth,
  strokeScale = 1,
  kaleidoscope,
  kaleidSegments,
  liveScaleSV,
  amount,
}: {
  geoId: GeometryId;
  color: string;
  grad: readonly [string, string] | undefined;
  size: number;
  strokeWidth: number;
  strokeScale?: number;
  kaleidoscope: boolean;
  kaleidSegments: number;
  liveScaleSV?: SharedValue<number>;
  amount: number;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 3200, easing: Easing.out(Easing.ease) }), -1, false);
    return () => cancelAnimation(t);
  }, [t]);
  const safeAmount = Math.max(0, Math.min(1, amount));
  const maxOpacity = 0.15 + safeAmount * 0.45;
  const st = useAnimatedStyle(() => ({
    transform: [{ scale: 1 + t.value * 0.6 }],
    opacity: (1 - t.value) * maxOpacity,
  }));
  return (
    <Animated.View style={[styles.layer, st]} pointerEvents="none">
      <SacredGlyph
        id={geoId}
        color={color}
        gradient={grad}
        size={size}
        strokeWidth={strokeWidth}
        strokeScale={strokeScale}
        kaleidoscope={kaleidoscope}
        kaleidSegments={kaleidSegments}
        liveScaleSV={liveScaleSV}
      />
    </Animated.View>
  );
}

// ── Partículas: puntos que emanan radialmente desde el centro ────────────────
const PARTICLE_COUNT = 20;
const PARTICLE_DOT_PX = 4;
const PARTICLE_DURATION_MS = 1900;
// Ángulos distribuidos uniformemente con jitter determinista (sin Math.random
// para que no cambien entre renders/recargas).
const PARTICLE_ANGLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => {
  const base = (i / PARTICLE_COUNT) * Math.PI * 2;
  const jitter = (((i * 6271 + 3) % 100) / 100 - 0.5) * 0.4;
  return base + jitter;
});

function Particle({
  angle, delay, maxRadius, color, amount,
}: {
  angle: number; delay: number; maxRadius: number; color: string; amount: number;
}) {
  const phaseSV = useSharedValue(0);
  const on = amount > 0;
  useEffect(() => {
    if (on) {
      phaseSV.value = withDelay(
        delay,
        withRepeat(withTiming(1, { duration: PARTICLE_DURATION_MS, easing: Easing.linear }), -1, false),
      );
    } else {
      cancelAnimation(phaseSV);
      phaseSV.value = withTiming(0, { duration: 300 });
    }
  }, [on, delay, phaseSV]);
  const aStyle = useAnimatedStyle(() => {
    const p = phaseSV.value;
    const r = p * maxRadius;
    // Desvanecer con curva acelerada: brillante al nacer, rápido al final.
    const opacity = Math.pow(Math.max(0, 1 - p), 1.3) * 0.85 * amount;
    // Crece levemente mientras se aleja del centro.
    const sc = 0.35 + p * 0.55;
    return {
      opacity,
      transform: [
        { translateX: Math.cos(angle) * r },
        { translateY: Math.sin(angle) * r },
        { scale: sc },
      ],
    };
  });
  return (
    <Animated.View
      pointerEvents="none"
      style={[
        {
          position: "absolute",
          width: PARTICLE_DOT_PX,
          height: PARTICLE_DOT_PX,
          borderRadius: PARTICLE_DOT_PX / 2,
          // Centrar el punto en el origen (wrapper de tamaño cero).
          left: -PARTICLE_DOT_PX / 2,
          top: -PARTICLE_DOT_PX / 2,
          backgroundColor: color,
        },
        aStyle,
      ]}
    />
  );
}

function ParticleField({ size, color, amount }: { size: number; color: string; amount: number }) {
  // Mezcla con blanco para dar luminosidad tipo sparkle.
  const particleColor = mixHex(color, "#FFFFFF", 0.3);
  const maxRadius = size * 0.52;
  return (
    // Wrapper de tamaño cero: el flex del padre lo centra en el lienzo.
    // Cada Particle es position:absolute con left/top:-2 → origen = centro exacto.
    <View style={{ width: 0, height: 0 }} pointerEvents="none">
      {PARTICLE_ANGLES.map((angle, i) => (
        <Particle
          key={i}
          angle={angle}
          delay={Math.round((i / PARTICLE_COUNT) * PARTICLE_DURATION_MS)}
          maxRadius={maxRadius}
          color={particleColor}
          amount={amount}
        />
      ))}
    </View>
  );
}

// ── Capa animada del fondo ────────────────────────────────────────
function GeometryLayerInner({
  geo,
  index,
  size,
  settings,
  liveZoomSV,
  pinchActiveSV,
  liveAngleSV,
  rotActiveSV,
  holdModeSV,
  holdScaleSV,
  holdScaleActive,
  holdRotDeltaDeg,
  holdRotActive,
  masterOpacity = 1,
  motion = true,
  glow = 0,
}: {
  geo: GeometryMeta;
  index: number;
  size: number;
  settings: GeoSettings;
  /** Zoom en vivo (pellizco) como SharedValue: el UI thread redibuja el SVG a su
      tamaño en vivo (size × liveZoomSV/safeZoom) → 60 fps sin runOnJS por frame
      y con trazo nítido (no transform). safeZoom queda capturado en el closure
      del último render; al confirmar el zoom, el nuevo render actualiza safeZoom
      → la escala → 1 sin salto. Solo lo usa la geometría seleccionada. */
  liveZoomSV?: SharedValue<number>;
  /** Bandera 1/0 (UI thread): el escalado en vivo solo se aplica cuando vale 1
      (pellizco en curso o esperando el commit). En reposo/selección vale 0 → la
      capa usa su tamaño confirmado aunque `liveZoomSV` esté momentáneamente
      desincronizado (evita el "pop" gigante al cambiar de objetivo). */
  pinchActiveSV?: SharedValue<number>;
  /** Ángulo en vivo (gesto de rotación) en grados como SharedValue: el UI thread
      aplica el giro sin runOnJS por frame (mismo principio que liveZoomSV). Solo
      lo usa la geometría seleccionada y solo cuando el giro automático está
      apagado. Manda sobre settings.manualAngle mientras rotActiveSV vale 1. */
  liveAngleSV?: SharedValue<number>;
  /** Bandera 1/0 (UI thread): el ángulo en vivo solo se aplica cuando vale 1
      (rotación en curso o esperando el commit). En reposo vale 0 → la capa usa
      su manualAngle confirmado aunque liveAngleSV esté desincronizado (evita el
      "pop" al cambiar de objetivo). */
  rotActiveSV?: SharedValue<number>;
  /** Modo Hold: 1 cuando todas las capas se transforman a la vez. */
  holdModeSV?: SharedValue<number>;
  /** Factor de escala del pellizco Hold (1=sin cambio). */
  holdScaleSV?: SharedValue<number>;
  /** Gate del pellizco Hold: 1 durante el gesto. */
  holdScaleActive?: SharedValue<number>;
  /** Delta de rotación Hold en grados. */
  holdRotDeltaDeg?: SharedValue<number>;
  /** Gate de rotación Hold: 1 durante el gesto. */
  holdRotActive?: SharedValue<number>;
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
  // Glow de aparición: resplandor que crece al montar y luego se apaga del todo
  // (sin efecto residual). Halo de sombra alrededor del glifo.
  const appearGlow = useSharedValue(0);
  useEffect(() => {
    appearGlow.value = withSequence(
      withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) }),
      withTiming(0, { duration: 700, easing: Easing.inOut(Easing.ease) }),
    );
  }, [appearGlow]);
  const {
    color,
    gradientId,
    rotate,
    rotateLeft,
    rotateSpeed,
    opacity,
    breatheAmount,
    fadeLoopAmount,
    glow: geoGlow,
    thickness,
    scale,
    zoom,
    manualAngle,
    kaleidoscope,
    kaleidSegments,
    saturation,
    bloom,
    halo,
    ripple,
    expansionAmount,
  } = settings;
  const grad = gradientColors(gradientId);
  // Saturación: transforma el color (y el degradado) por luminancia. 0.5 = original.
  const safeSat = Number.isFinite(saturation) ? clamp01(saturation) : 0.5;
  const dispColor = adjustSaturation(color, safeSat);
  const dispGrad = saturateGrad(grad, safeSat);
  // Efectos nuevos saneados (0 = off; saturación 0.5 = neutro).
  const safeBloom = Number.isFinite(bloom) ? clamp01(bloom) : 0;
  const safeHalo = Number.isFinite(halo) ? clamp01(halo) : 0;
  const safeRipple = Number.isFinite(ripple) ? clamp01(ripple) : 0;
  const bloomColor = mixHex(dispColor, "#FFFFFF", 0.55);

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
    const safeFade = Number.isFinite(fadeLoopAmount) ? Math.max(0, Math.min(1, fadeLoopAmount)) : 0;
    if (safeFade > 0 && motion) {
      const minOpacity = 1 - safeFade * 0.85;
      fade.value = withRepeat(
        withTiming(minOpacity, { duration: 4200 + index * 600, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
    } else {
      cancelAnimation(fade);
      fade.value = withTiming(1, { duration: 400 });
    }
  }, [fadeLoopAmount, motion, fade, index]);


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
  const committedMag = userScale * safeZoom;
  // Movimiento general (panel maestro): congela giro + respiración de TODAS las
  // capas a la vez sin borrar el ajuste propio de cada una.
  const spin = (rotate || rotateLeft) && motion;
  const breath = breatheAmount > 0 && motion;
  // Profundidad de la respiración: 0.04 (sutil) → 0.24 (profunda). Define cuánto
  // se encoge en el valle del pulso (el pico siempre es 1.0).
  const safeAmount = Number.isFinite(breatheAmount) ? Math.max(0, Math.min(1, breatheAmount)) : 0;
  const breatheDepth = 0.04 + safeAmount * 0.2;
  const safeMaster = Number.isFinite(masterOpacity) ? masterOpacity : 1;
  // Ángulo manual (gesto de dos dedos): solo aplica cuando el giro automático
  // está apagado. En vivo manda `liveAngleSV` (UI thread); en reposo el
  // confirmado en settings.
  const committedAngle = Number.isFinite(manualAngle) ? manualAngle : 0;
  // ── Hold mode: bases CONGELADAS al iniciar cada gesto grupal ──────────────
  // Drag/rotación usan base+delta y zoom usa un ratio auto-corrector contra
  // holdBaseMag. Las bases se recapturan SOLO en la transición 0→1 del gate del
  // gesto (los flags *Frozen evitan re-congelar cuando el committed salta a B
  // mid-transición). Esto enmascara el cambio committed A→B → sin parpadeo al
  // soltar (mismo patrón que posStyle de CanvasLayer para el drag).
  const holdBaseMag = useSharedValue(committedMag);
  const holdScaleFrozen = useSharedValue(0);
  const holdBaseAngle = useSharedValue(committedAngle);
  const holdRotFrozen = useSharedValue(0);
  useAnimatedReaction(
    () => (holdModeSV != null && holdModeSV.value === 1 ? (holdScaleActive?.value ?? 0) : 0),
    (act) => {
      if (act === 1 && holdScaleFrozen.value === 0) {
        holdBaseMag.value = committedMag;
        holdScaleFrozen.value = 1;
      } else if (act === 0 && holdScaleFrozen.value === 1) {
        holdScaleFrozen.value = 0;
      }
    },
  );
  useAnimatedReaction(
    () => (holdModeSV != null && holdModeSV.value === 1 ? (holdRotActive?.value ?? 0) : 0),
    (act) => {
      if (act === 1 && holdRotFrozen.value === 0) {
        holdBaseAngle.value = committedAngle;
        holdRotFrozen.value = 1;
      } else if (act === 0 && holdRotFrozen.value === 1) {
        holdRotFrozen.value = 0;
      }
    },
  );
  // Escala de pellizco EN VIVO (UI thread): ratio entre el zoom en curso y el
  // confirmado (capturado en el closure). NO se aplica como transform (engorda
  // el trazo); se pasa a SacredGlyph para que redibuje el SVG a su tamaño real
  // (trazo nítido, sin parpadeo). Solo el objetivo del pellizco recibe liveZoomSV.
  // pinchActiveSV gatea: en reposo/selección vale 0 → escala 1 (sin "pop" aunque
  // livePinch esté momentáneamente desincronizado). Al confirmar, safeZoom se
  // actualiza al nuevo valor → ratio → 1 sin salto.
  // deps: incluir liveZoomSV y pinchActiveSV (no solo safeZoom). Al seleccionar
  // otra geometría, liveZoomSV pasa de undefined → livePinch; si no está en deps,
  // el worklet conserva el closure viejo (liveZoomSV undefined → retorna 1) y el
  // pellizco no escalaría el nuevo objetivo cuando dos geometrías comparten zoom.
  const pinchScaleSV = useDerivedValue(() => {
    // Hold mode: ratio auto-corrector. El tamaño absoluto objetivo =
    // holdBaseMag (magnif. congelada al iniciar el gesto) × factor de pellizco.
    // Se divide por el committedMag ACTUAL: durante el gesto committedMag == base
    // → ratio == factor; cuando setSettings confirma el nuevo zoom y committedMag
    // alcanza al objetivo, el ratio cae a 1 solo (effectiveSize × ratio queda
    // invariante) → sin flash de retroceso al soltar, sin importar el orden
    // exacto entre el re-render y el reset del gate.
    if (holdModeSV != null && holdModeSV.value === 1 && holdScaleActive != null && holdScaleActive.value === 1 && holdScaleSV != null) {
      const target = holdBaseMag.value * holdScaleSV.value;
      return committedMag > 0 && Number.isFinite(target) ? target / committedMag : holdScaleSV.value;
    }
    // Modo normal: solo la capa objetivo (liveZoomSV pasado solo al target).
    if (liveZoomSV == null) return 1;
    if (pinchActiveSV != null && pinchActiveSV.value === 0) return 1;
    const r = liveZoomSV.value / safeZoom;
    return Number.isFinite(r) && r > 0 ? r : 1;
  }, [safeZoom, committedMag, liveZoomSV, pinchActiveSV, holdModeSV, holdScaleSV, holdScaleActive, holdBaseMag]);
  const aStyle = useAnimatedStyle(() => {
    const breatheScale = breath ? 1 - breatheDepth + pulse.value * breatheDepth : 1;
    // Giro: automático (rot) > rotación en vivo (liveAngleSV mientras rotActiveSV
    // vale 1, UI thread, sin re-render por frame) > ángulo confirmado en settings.
    let angleDeg: number;
    if (holdModeSV != null && holdModeSV.value === 1 && holdRotActive != null && holdRotActive.value === 1 && holdRotDeltaDeg != null) {
      // Hold mode: ángulo CONGELADO al iniciar el gesto + delta compartido (NO el
      // committedAngle actual): cuando setSettings confirma el nuevo ángulo, el
      // worklet sigue mostrando base+delta = ángulo final → sin parpadeo al soltar.
      angleDeg = holdBaseAngle.value + holdRotDeltaDeg.value;
    } else if (spin) {
      angleDeg = rot.value * 360 * dir;
    } else if (liveAngleSV != null && rotActiveSV != null && rotActiveSV.value === 1) {
      angleDeg = liveAngleSV.value;
    } else {
      angleDeg = committedAngle;
    }
    return {
      transform: [
        { rotate: `${angleDeg}deg` },
        { scale: breatheScale },
      ],
      // Opacidad propia × general (maestra) × fundido cíclico × aparición.
      opacity: opacity * safeMaster * fade.value * enter.value,
    };
  });
  // Pasar SIEMPRE pinchScaleSV (ref estable): así el SacredGlyph de cada capa
  // del lienzo usa SIEMPRE el camino animado (AnimatedSvg) y el TIPO de
  // componente nunca cambia (Svg↔AnimatedSvg) al seleccionar — un cambio de
  // tipo remontaría el subárbol SVG y causaría un flash. Las capas no objetivo /
  // en reposo reciben pinchScaleSV = 1 constante (worklet corre una vez, sin
  // trabajo por frame) → visualmente idéntico al estático. Las miniaturas de la
  // galería NO pasan por aquí (llaman a SacredGlyph sin liveScaleSV) → estáticas.
  const liveScaleForGlyph = pinchScaleSV;
  // Tamaño REAL al que se redibuja el SVG = tamaño base × magnificación
  // confirmada. Debe declararse ANTES de los worklets que lo usan (ghostAStyle,
  // expansionEcho, etc.) porque Reanimated captura los valores del closure en el
  // momento en que se llama a useAnimatedStyle; si effectiveSize estuviera
  // declarado después, el worklet capturaría undefined y los cálculos darían NaN.
  const effectiveSize = size * committedMag;
  // Trazo base de 1px real: el viewBox es 0–100, así que 1px = 100 / size.
  const base1px = effectiveSize > 0 ? 100 / effectiveSize : 1;
  // strokeMode "thin" (ajustado desde el admin) adelgaza el trazo a ~45%.
  const thinFactor = (geo as { strokeMode?: string }).strokeMode === "thin" ? 0.45 : 1;
  const sw = base1px * (1 + safeThickness * 5) * thinFactor;
  // outlineWidth (admin): grosor de contorno exterior en px reales (mosaicos).
  // Se convierte a unidades viewBox (viewBox=100×100) para pasar a SacredGlyph.
  const outlineWidthPx = (geo as { outlineWidth?: number }).outlineWidth ?? 0;
  const outlineWidthSvg =
    outlineWidthPx > 0 && effectiveSize > 0 ? outlineWidthPx * (100 / effectiveSize) : 0;
  // wireframe: el usuario puede invertir el modo relleno↔contorno fino en la sesión.
  // El default viene del admin (wireframeDefault); el usuario lo sobreescribe en Transformación.
  const geoWireframeDefault = (geo as { wireframeDefault?: boolean }).wireframeDefault ?? false;
  const isWireframe =
    (settings.wireframe !== undefined ? settings.wireframe : geoWireframeDefault) &&
    (geo as { geometryType?: string }).geometryType === "mosaic";
  // Estilo del halo de aparición (shadowOpacity animado), igual que las cards.
  const glowStyle = useAnimatedStyle(() => ({ shadowOpacity: appearGlow.value }));
  // Glow efectivo: el propio de la capa se suma al general (panel maestro),
  // acotado a 0–1. Halo aditivo detrás del trazo (copias más anchas y tenues).
  const safeGeoGlow = Number.isFinite(geoGlow) ? Math.max(0, Math.min(1, geoGlow)) : 0;
  const safeMasterGlow = Number.isFinite(glow) ? Math.max(0, Math.min(1, glow)) : 0;
  const safeGlow = Math.min(1, safeGeoGlow + safeMasterGlow);

  return (
    <Animated.View style={[styles.layer, aStyle]} pointerEvents="none">
      {/* Halo: aura radial suave detrás de todo. */}
      {safeHalo > 0 && (
        <View style={styles.layer} pointerEvents="none">
          <HaloGlow size={effectiveSize * 1.25} color={dispColor} amount={safeHalo} />
        </View>
      )}
      {/* Ripple: anillos concéntricos que emanan (se congelan con el movimiento). */}
      {safeRipple > 0 && motion && (
        <RippleRings size={effectiveSize} color={dispColor} amount={safeRipple} />
      )}
      {/* Bloom: resplandor intenso y blanquecino (copias anchas sobreexpuestas). */}
      {safeBloom > 0 && (
        <>
          <View style={[styles.layer, { opacity: 0.14 * safeBloom }]} pointerEvents="none">
            <SacredGlyph
              id={geo.id}
              color={bloomColor}
              size={effectiveSize}
              strokeWidth={sw * (5 + safeBloom * 5)}
              strokeScale={thinFactor}
              outlineWidth={outlineWidthSvg}
              wireframe={isWireframe}
              kaleidoscope={kaleidoscope}
              kaleidSegments={kaleidSegments}
              liveScaleSV={liveScaleForGlyph}
            />
          </View>
          <View style={[styles.layer, { opacity: 0.22 * safeBloom }]} pointerEvents="none">
            <SacredGlyph
              id={geo.id}
              color={bloomColor}
              size={effectiveSize}
              strokeWidth={sw * (2.4 + safeBloom * 2.6)}
              strokeScale={thinFactor}
              outlineWidth={outlineWidthSvg}
              wireframe={isWireframe}
              kaleidoscope={kaleidoscope}
              kaleidSegments={kaleidSegments}
              liveScaleSV={liveScaleForGlyph}
            />
          </View>
        </>
      )}
      {safeGlow > 0 && (
        <>
          <View style={[styles.layer, { opacity: 0.16 * safeGlow }]}>
            <SacredGlyph
              id={geo.id}
              color={dispColor}
              gradient={dispGrad}
              size={effectiveSize}
              strokeWidth={sw * (3 + safeGlow * 3)}
              strokeScale={thinFactor}
              outlineWidth={outlineWidthSvg}
              wireframe={isWireframe}
              kaleidoscope={kaleidoscope}
              kaleidSegments={kaleidSegments}
              liveScaleSV={liveScaleForGlyph}
            />
          </View>
          <View style={[styles.layer, { opacity: 0.26 * safeGlow }]}>
            <SacredGlyph
              id={geo.id}
              color={dispColor}
              gradient={dispGrad}
              size={effectiveSize}
              strokeWidth={sw * (1.8 + safeGlow * 1.6)}
              strokeScale={thinFactor}
              outlineWidth={outlineWidthSvg}
              wireframe={isWireframe}
              kaleidoscope={kaleidoscope}
              kaleidSegments={kaleidSegments}
              liveScaleSV={liveScaleForGlyph}
            />
          </View>
        </>
      )}
      {/* Expansión: eco del glifo que crece y se desvanece en bucle. */}
      {(expansionAmount ?? 0) > 0 && motion && (
        <ExpansionEcho
          geoId={geo.id}
          color={dispColor}
          grad={dispGrad}
          size={effectiveSize}
          strokeWidth={sw}
          strokeScale={thinFactor}
          kaleidoscope={kaleidoscope}
          kaleidSegments={kaleidSegments}
          liveScaleSV={liveScaleForGlyph}
          amount={expansionAmount ?? 0}
        />
      )}
      <Animated.View
        style={[
          styles.layer,
          {
            shadowColor: dispColor,
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: Math.max(12, Math.min(30, effectiveSize * 0.1)),
          },
          glowStyle,
        ]}
        pointerEvents="none"
      >
        <SacredGlyph
          id={geo.id}
          color={dispColor}
          gradient={dispGrad}
          size={effectiveSize}
          strokeWidth={sw}
          strokeScale={thinFactor}
          outlineWidth={outlineWidthSvg}
          wireframe={isWireframe}
          kaleidoscope={kaleidoscope}
          kaleidSegments={kaleidSegments}
          liveScaleSV={liveScaleForGlyph}
        />
      </Animated.View>
    </Animated.View>
  );
}


// ── CanvasLayer ─────────────────────────────────────────────────────────────
// Envoltura de posición de cada capa del lienzo. El desplazamiento (drag) se
// aplica en el HILO UI vía useAnimatedStyle leyendo shared values, NO por estado
// de React: así arrastrar la geometría no re-renderiza el lienzo por frame (mismo
// principio que el zoom y la rotación). La capa arrastrada (isTarget && dragActive
// == 1) sigue a liveDragX/Y; en reposo usa su offset confirmado (committedX/Y).
// La salida en fade out vive aquí para que la capa se desvanezca al deseleccionar.
type CanvasLayerProps = {
  isTarget: boolean;
  committedX: number;
  committedY: number;
  liveDragX: SharedValue<number>;
  liveDragY: SharedValue<number>;
  dragActive: SharedValue<number>;
  geo: GeometryMeta;
  index: number;
  size: number;
  settings: GeoSettings;
  liveZoomSV?: SharedValue<number>;
  pinchActiveSV?: SharedValue<number>;
  liveAngleSV?: SharedValue<number>;
  rotActiveSV?: SharedValue<number>;
  holdModeSV?: SharedValue<number>;
  holdScaleSV?: SharedValue<number>;
  holdScaleActive?: SharedValue<number>;
  holdDragDeltaX?: SharedValue<number>;
  holdDragDeltaY?: SharedValue<number>;
  holdDragActive?: SharedValue<number>;
  holdRotDeltaDeg?: SharedValue<number>;
  holdRotActive?: SharedValue<number>;
  masterOpacity?: number;
  motion?: boolean;
  glow?: number;
};

function CanvasLayerInner({
  isTarget,
  committedX,
  committedY,
  liveDragX,
  liveDragY,
  dragActive,
  geo,
  index,
  size,
  settings,
  liveZoomSV,
  pinchActiveSV,
  liveAngleSV,
  rotActiveSV,
  holdModeSV,
  holdScaleSV,
  holdScaleActive,
  holdDragDeltaX,
  holdDragDeltaY,
  holdDragActive,
  holdRotDeltaDeg,
  holdRotActive,
  masterOpacity,
  motion,
  glow,
}: CanvasLayerProps) {
  // Base CONGELADA del offset al iniciar un drag Hold. Durante el gesto y hasta
  // que setSettings confirme el nuevo offset, la capa se dibuja en base+delta (NO
  // committedX+delta): así el cambio committedX A→B queda enmascarado y al soltar
  // no hay parpadeo a la posición inicial. Se recaptura SOLO en la transición
  // 0→1 de holdDragActive (holdDragFrozen evita re-congelar cuando committedX
  // pasa a B mid-transición).
  const holdBaseOffsetX = useSharedValue(committedX);
  const holdBaseOffsetY = useSharedValue(committedY);
  const holdDragFrozen = useSharedValue(0);
  useAnimatedReaction(
    () => (holdModeSV != null && holdModeSV.value === 1 ? (holdDragActive?.value ?? 0) : 0),
    (act) => {
      if (act === 1 && holdDragFrozen.value === 0) {
        holdBaseOffsetX.value = committedX;
        holdBaseOffsetY.value = committedY;
        holdDragFrozen.value = 1;
      } else if (act === 0 && holdDragFrozen.value === 1) {
        holdDragFrozen.value = 0;
      }
    },
  );
  const posStyle = useAnimatedStyle(() => {
    // Hold mode: todas las capas se desplazan en grupo con el mismo delta.
    if (holdModeSV != null && holdModeSV.value === 1 && holdDragActive != null && holdDragActive.value === 1 && holdDragDeltaX != null && holdDragDeltaY != null) {
      return {
        transform: [
          { translateX: holdBaseOffsetX.value + holdDragDeltaX.value },
          { translateY: holdBaseOffsetY.value + holdDragDeltaY.value },
        ],
      };
    }
    const dragging = isTarget && dragActive.value === 1;
    const tx = dragging ? liveDragX.value : committedX;
    const ty = dragging ? liveDragY.value : committedY;
    return { transform: [{ translateX: tx }, { translateY: ty }] };
  });
  return (
    <Animated.View
      exiting={FadeOut.duration(600)}
      style={[styles.layer, posStyle]}
      pointerEvents="none"
    >
      <GeometryLayer
        geo={geo}
        index={index}
        size={size}
        settings={settings}
        liveZoomSV={liveZoomSV}
        pinchActiveSV={pinchActiveSV}
        liveAngleSV={liveAngleSV}
        rotActiveSV={rotActiveSV}
        holdModeSV={holdModeSV}
        holdScaleSV={holdScaleSV}
        holdScaleActive={holdScaleActive}
        holdRotDeltaDeg={holdRotDeltaDeg}
        holdRotActive={holdRotActive}
        masterOpacity={masterOpacity}
        motion={motion}
        glow={glow}
      />
    </Animated.View>
  );
}

// Memoizadas: al seleccionar una geometría (setActivatingIds/setActive) o al
// arrastrar un slider, el componente raíz (~6500 líneas) se re-renderiza, pero
// estas capas solo re-reconcilian si SUS props cambian. Como `settings` ahora se
// pasa con identidad estable por id (getStableSettings), las capas no afectadas
// se saltan → arranca la animación del tile sin retraso (sin microlag) y el
// drag de un slider solo re-renderiza la capa tocada.
const GeometryLayer = React.memo(GeometryLayerInner);
const CanvasLayer = React.memo(CanvasLayerInner);


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

type CarouselTileProps = {
  id: string;
  name: string;
  tileW: number;
  isSelected: boolean;
  isActivating: boolean;
  color: string;
  onToggle: (id: string) => void;
  // Reordenamiento por arrastre (long-press + drag).
  draggable: boolean;
  isDragging: boolean;
  itemW: number;
  frontCount: number;
  onDragStart: (id: string) => void;
  onDragEnd: (id: string, targetIdx: number) => void;
  // Orden VISUAL compartido (FLIP). Cada tile deriva su slot con orderSV.indexOf(id)
  // en el UI thread (siempre actual, sin desfase de prop JS) y se posiciona por
  // transform. `instantOrderFlag`=1 hace INSTANTÁNEO el reposicionamiento del commit
  // del arrastre (sin deslizar); en 0 las selecciones deslizan 1100ms.
  orderSV: SharedValue<string[]>;
  instantOrderFlag: SharedValue<number>;
  // Estado de arrastre compartido (modelo "pin + hueco"): origin/target son slots del
  // frente (-1 = sin arrastre). Las hermanas los leen para abrir el hueco.
  dragOriginIdx: SharedValue<number>;
  dragTargetIdx: SharedValue<number>;
  // Auto-scroll del carrusel durante el arrastre (ver bloque del padre).
  screenW: number;
  scrollX: SharedValue<number>;
  dragActive: SharedValue<number>;
  edgeIntent: SharedValue<number>;
};

// Tile del carrusel de geometrías. Maneja su propia animación de selección al
// estilo "Aurora": pulso de escala + resplandor del color de la geometría. El
// glide a su posición lo resuelve solo (modelo FLIP): deriva su slot de orderSV
// y se posiciona con translateX; el deslizamiento al cambiar de slot es slideOffset.
function CarouselTileInner({
  id,
  name,
  tileW,
  isSelected,
  isActivating,
  color,
  onToggle,
  draggable,
  isDragging,
  itemW,
  frontCount,
  onDragStart,
  onDragEnd,
  orderSV,
  instantOrderFlag,
  dragOriginIdx,
  dragTargetIdx,
  screenW,
  scrollX,
  dragActive,
  edgeIntent,
}: CarouselTileProps) {


  // ── Reordenamiento por arrastre ───────────────────────────────────────────
  // Long-press (~250 ms) + drag horizontal. Mientras se arrastra, la card sigue
  // al dedo (translateX). Modelo "pin + hueco": la card arrastrada NO se reordena
  // en el DOM durante el gesto — se queda en su slot de origen y sigue al dedo con
  // dragX; las hermanas abren el hueco con un offset (±itemW). El reordenamiento
  // real de `active` se confirma UNA sola vez al soltar (onDragEnd). Así se elimina
  // el desfase de 1 frame entre dragX (UI thread) y el reordenamiento del DOM
  // (round-trip a JS por setActive) que causaba el "fantasma" que saltaba.
  const dragX = useSharedValue(0);
  const lift = useSharedValue(0);
  // Slot VISUAL de esta tile, derivado del orden compartido en el UI thread (siempre
  // actual, sin el desfase de 1 frame de un prop JS). -1 mientras aún no entró al
  // orden (frame de montaje de un duplicado recién creado).
  const slotSV = useDerivedValue(() => orderSV.value.indexOf(id));
  // Desfase de deslizamiento (FLIP). En reposo 0; al cambiar el slot por SELECCIÓN se
  // pone en (prevSlot-slot)*itemW y se anima a 0 (1100ms) → la tile parece salir de su
  // lugar viejo y deslizar al nuevo. En el commit del arrastre queda 0 (instantáneo).
  const slideOffset = useSharedValue(0);
  // Desfase de "hueco" mientras OTRA card se arrastra: esta hermana se corre ±itemW
  // para abrir espacio en el destino. Animado con withTiming (o instantáneo en el
  // commit, cuando instantOrderFlag=1, porque el slot ya absorbió el corrimiento).
  const gapSV = useSharedValue(0);
  const frontCountSV = useSharedValue(frontCount);
  // Offset de scroll del carrusel al iniciar el arrastre + último translationX
  // del dedo. Sirven para recomputar el destino cuando el dedo está quieto en el
  // borde y el carrusel se auto-desplaza (la posición efectiva cambia por scroll).
  const scrollStartX = useSharedValue(0);
  const lastTransX = useSharedValue(0);
  // 1 solo en la card que se está arrastrando AHORA: así la reacción al scroll y
  // el estilo (dragX vs hueco) aplican únicamente a esta card.
  const selfDragging = useSharedValue(0);
  // 1 mientras el pan estuvo ACTIVADO (entre onStart y onFinalize). A diferencia de
  // selfDragging —que un efecto de JS resetea según isDragging (timing de render)—,
  // este flag lo controla SOLO el gesto en el UI thread, así onFinalize sabe con
  // certeza si hubo un arrastre real antes de confirmar el reorder.
  const didActivate = useSharedValue(0);
  useEffect(() => {
    frontCountSV.value = frontCount;
  }, [frontCount, frontCountSV]);
  // Red de seguridad: deja el estado de arrastre en reposo si una cancelación no pasó
  // por el commit. El commit del arrastre ya resetea selfDragging/dragX/origin/target
  // en el worklet de soltado; esto cubre el resto (cuando isDragging pasa a false).
  useEffect(() => {
    if (isDragging) return;
    selfDragging.value = 0;
    dragX.value = 0;
    dragOriginIdx.value = -1;
    dragTargetIdx.value = -1;
  }, [isDragging, selfDragging, dragX, dragOriginIdx, dragTargetIdx]);

  // La card arrastrada sigue al dedo (dragX = desplazamiento efectivo puro, sin
  // compensación de slot porque su slot del DOM no cambia) y propone su slot
  // destino. NO reordena `active`: solo escribe dragTargetIdx para que las
  // hermanas abran el hueco. El commit ocurre al soltar.
  const applyDrag = useCallback(
    (effectiveTx: number) => {
      "worklet";
      dragX.value = effectiveTx;
      const maxIdx = Math.max(0, frontCountSV.value - 1);
      let proposed = Math.round(dragOriginIdx.value + effectiveTx / itemW);
      if (proposed < 0) proposed = 0;
      if (proposed > maxIdx) proposed = maxIdx;
      dragTargetIdx.value = proposed;
    },
    [dragX, dragOriginIdx, dragTargetIdx, frontCountSV, itemW],
  );

  // Mientras el dedo está parado en el borde, el carrusel sigue desplazándose
  // (frame loop del padre actualiza scrollX). Esta reacción recomputa la posición
  // efectiva con el nuevo scroll para que el destino siga avanzando sin frenarse.
  // Clave: `selfDragging` Y `dragActive`. `dragActive` se apaga en onFinalize ANTES
  // de iniciar el glide de soltado; `selfDragging` recién se apaga tras el commit.
  // Si la reacción siguiera viva durante el glide (180 ms), cualquier cambio de
  // scrollX (carrusel asentándose tras un auto-scroll de arrastre largo) dispararía
  // applyDrag → SOBREESCRIBE el dragX del withTiming del glide y RECALCULA
  // dragTargetIdx → la card aterriza un slot corrida (se "enroca" con la vecina de
  // la derecha). Acotarla a la fase de arrastre activo evita esa corrupción.
  useAnimatedReaction(
    () =>
      selfDragging.value === 1 && dragActive.value === 1 ? scrollX.value : null,
    (sx, prev) => {
      if (sx === null || sx === prev) return;
      applyDrag(lastTransX.value + (sx - scrollStartX.value));
    },
    [applyDrag],
  );

  const dragGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(draggable)
        .activateAfterLongPress(250)
        .onStart(() => {
          const slot = slotSV.value;
          dragOriginIdx.value = slot;
          dragTargetIdx.value = slot;
          dragX.value = 0;
          slideOffset.value = 0;
          scrollStartX.value = scrollX.value;
          lastTransX.value = 0;
          edgeIntent.value = 0;
          dragActive.value = 1;
          selfDragging.value = 1;
          didActivate.value = 1;
          lift.value = withTiming(1, { duration: 160 });
          runOnJS(onDragStart)(id);
        })
        .onUpdate((e) => {
          lastTransX.value = e.translationX;
          // Intención de auto-scroll según qué tan cerca del borde está el dedo.
          // Zona de 64px; velocidad lineal hasta ~16px/frame. Hacia la izquierda
          // negativo, hacia la derecha positivo.
          const EDGE = 64;
          const MAXV = 16;
          if (e.absoluteX < EDGE) {
            edgeIntent.value = -MAXV * ((EDGE - e.absoluteX) / EDGE);
          } else if (e.absoluteX > screenW - EDGE) {
            edgeIntent.value = MAXV * ((e.absoluteX - (screenW - EDGE)) / EDGE);
          } else {
            edgeIntent.value = 0;
          }
          applyDrag(e.translationX + (scrollX.value - scrollStartX.value));
        })
        .onFinalize(() => {
          edgeIntent.value = 0;
          dragActive.value = 0;
          // El pan se "finaliza" aunque NUNCA se haya activado (toque corto sin
          // long-press de 250ms): en ese caso onStart no corrió, origin/target
          // quedaron en -1. NO confirmar reorder: dispararía onDragEnd con target=-1
          // → la card saltaría al frente con solo tocarla. Se usa didActivate (no
          // selfDragging, que un efecto de JS puede resetear según isDragging) para
          // que la decisión dependa solo del UI thread del gesto.
          if (didActivate.value !== 1) {
            return;
          }
          didActivate.value = 0;
          const origin = dragOriginIdx.value;
          const target = dragTargetIdx.value;
          lift.value = withTiming(0, { duration: 180 });
          // Planea la card hasta el slot destino (su slot del orden NO cambió aún) y al
          // terminar CONFIRMA el reorden en el UI thread, atómicamente: reescribe el
          // orden compartido (orderSV) y apaga el estado de arrastre en el MISMO
          // worklet. Como NO hay reflow de Fabric (las tiles están en orden de DOM
          // estable, posicionadas por transform), el reposicionamiento ocurre en un
          // único frame sin carrera mapper-vs-layout → sin parpadeo. instantOrderFlag=1
          // hace que el cambio de slot sea instantáneo (sin deslizar). El dato (`active`)
          // se sincroniza en JS vía onDragEnd; el efecto espejo reescribe orderSV con
          // contenido idéntico → no-op.
          dragX.value = withTiming(
            (target - origin) * itemW,
            { duration: 180, easing: Easing.out(Easing.ease) },
            (finished) => {
              if (finished) {
                instantOrderFlag.value = 1;
                const arr = orderSV.value.slice();
                if (origin >= 0 && origin < arr.length) {
                  const moved = arr[origin];
                  arr.splice(origin, 1);
                  const dest = Math.max(0, Math.min(target, arr.length));
                  arr.splice(dest, 0, moved);
                  orderSV.value = arr;
                }
                dragX.value = 0;
                selfDragging.value = 0;
                dragOriginIdx.value = -1;
                dragTargetIdx.value = -1;
              }
              runOnJS(onDragEnd)(id, target);
            },
          );
        }),
    [
      applyDrag,
      draggable,
      id,
      onDragStart,
      onDragEnd,
      dragOriginIdx,
      dragTargetIdx,
      dragActive,
      didActivate,
      dragX,
      edgeIntent,
      slotSV,
      slideOffset,
      orderSV,
      instantOrderFlag,
      itemW,
      lastTransX,
      lift,
      screenW,
      scrollStartX,
      scrollX,
      selfDragging,
    ],
  );

  // FLIP de SELECCIÓN: cuando el slot de esta tile cambia por un reorden de datos
  // (selección/deselección, NO un commit de arrastre), arranca el deslizamiento desde
  // su posición vieja (slideOffset = (prev-slot)*itemW) y lo anima a 0 → parece salir
  // de su lugar viejo y deslizar al nuevo. En el commit del arrastre instantOrderFlag=1
  // → salto instantáneo (sin animar), porque la card arrastrada ya llegó por dragX y
  // las hermanas ya estaban corridas por gapSV en lockstep.
  useAnimatedReaction(
    () => slotSV.value,
    (slot, prev) => {
      if (slot < 0 || prev === null || prev < 0 || slot === prev) return;
      if (selfDragging.value === 1) return; // la arrastrada se posiciona con dragX
      if (instantOrderFlag.value === 1) {
        slideOffset.value = 0;
        return;
      }
      slideOffset.value = (prev - slot) * itemW;
      slideOffset.value = withTiming(0, {
        duration: CAROUSEL_FLOW_MS,
        easing: CAROUSEL_EASE,
      });
    },
  );

  // HUECO de arrastre: mientras OTRA card se arrastra, esta hermana se corre ±itemW
  // para abrir espacio en el destino. Se recomputa cuando cambia el destino (o el slot
  // propio). En el commit (instantOrderFlag=1) el corrimiento se aplica INSTANTÁNEO a 0
  // porque el slot ya absorbió el ±itemW → sin salto. Fuera del commit anima suave.
  useAnimatedReaction(
    () => ({
      slot: slotSV.value,
      origin: dragOriginIdx.value,
      target: dragTargetIdx.value,
      self: selfDragging.value,
    }),
    (cur) => {
      if (cur.self === 1) {
        gapSV.value = 0;
        return;
      }
      let off = 0;
      if (
        cur.origin >= 0 &&
        cur.target >= 0 &&
        cur.origin !== cur.target &&
        cur.slot >= 0
      ) {
        if (cur.target > cur.origin) {
          if (cur.slot > cur.origin && cur.slot <= cur.target) off = -itemW;
        } else if (cur.slot >= cur.target && cur.slot < cur.origin) {
          off = itemW;
        }
      }
      if (instantOrderFlag.value === 1) {
        gapSV.value = off;
      } else {
        // Respuesta rápida al cambio de slot destino: las hermanas abren/cierran el hueco
        // en 180ms con ease-out (arranca rápido, desacelera suave). CAROUSEL_FLOW_MS (1100ms)
        // era demasiado lento y causaba que las hermanas siempre se quedaran atrás del dedo.
        gapSV.value = withTiming(off, {
          duration: 180,
          easing: Easing.out(Easing.cubic),
        });
      }
    },
  );

  // Estilo del wrap (modelo FLIP). Las tiles se renderizan en un orden de DOM ESTABLE
  // (domOrder) y se posicionan SOLO con translateX = slot*itemW (+ deslizamientos). Así
  // NO hay reflow de Fabric al reordenar → se elimina la carrera mapper-vs-layout que
  // causaba el parpadeo. La posición se lee DIRECTO de slotSV (UI thread, sin desfase).
  const wrapStyle = useAnimatedStyle(() => {
    // "Lift" al tomar la card = ELEVARLA (translateY), NO escalarla. Un transform scale
    // magnifica la rasterización del glifo SVG → se pixela mientras dura el arrastre y
    // recién al soltar (scale→1) vuelve a verse nítido. translateY da el mismo gesto de
    // "levantar" sin tocar la nitidez del vector (convención: geometrix-zoom-vector).
    const liftY = -lift.value * 10;
    const slot = slotSV.value;
    // Aún no entró al orden compartido (frame de montaje de un duplicado): oculto para
    // no destellar en el slot 0 antes de que el efecto espejo actualice orderSV.
    if (slot < 0) {
      return { opacity: 0, transform: [{ translateX: 0 }, { translateY: liftY }] };
    }
    // Posición base = slot * itemW desplazada por el FLIP de selección (slideOffset).
    const base = slot * itemW + slideOffset.value;
    // Card que se arrastra (incluido el glide al soltar): sigue al dedo sumando dragX
    // sobre su base. Su slot NO cambia hasta el commit, así que base+dragX la coloca
    // bien; al confirmar, base salta al slot destino y dragX vuelve a 0 → continuo.
    if (selfDragging.value === 1) {
      return {
        opacity: 1,
        transform: [{ translateX: base + dragX.value }, { translateY: liftY }],
        zIndex: 20,
      };
    }
    // Resto de las tiles: base + el hueco animado (gapSV, 0 salvo cuando se arrastra).
    return {
      opacity: 1,
      transform: [{ translateX: base + gapSV.value }, { translateY: liftY }],
    };
  }, [selfDragging, dragX, lift, itemW, slotSV, slideOffset, gapSV]);

  return (
    <Animated.View
      style={[
        styles.tileWrap,
        { width: tileW },
        wrapStyle,
        isDragging && styles.tileDragging,
      ]}
    >
      <GestureDetector gesture={dragGesture}>
        <Pressable
          onPress={() => onToggle(id)}
          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
          renderToHardwareTextureAndroid
          style={[
            styles.tile,
            { width: tileW, height: tileW },
            isSelected && { backgroundColor: "rgba(255,255,255,0.04)" },
          ]}
        >
          <View style={[styles.tileGlyph, !isSelected && { opacity: 0.5 }]}>
            <SacredGlyph
              id={baseOf(id)}
              color={isSelected ? color : "#c7caec"}
              size={tileW * 0.72}
              strokeWidth={isSelected ? 1.5 : 1.4}
            />
          </View>
        </Pressable>
      </GestureDetector>
    </Animated.View>
  );
}

// Memoizada: al arrastrar un slider o al seleccionar una geometría, el root
// (~6500 líneas) se re-renderiza, pero cada tile solo se reconcilia si SUS props
// cambian. Por eso `onToggle` es un callback ESTABLE del padre (antes era un
// `onPress` inline nuevo por render → rompía el memo y re-renderizaba las ~44
// tiles, con su SVG + gesto, en CADA tick del slider).
const CarouselTile = React.memo(CarouselTileInner);

// Icono "sliders" (ajustes generales) pintado con el degradado dorado del
// logo Cubo 3, en vez de un color plano. react-native-svg permite stroke con
// gradiente, así que no hace falta masked-view.
// Ícono de bocina con animación de "vibraciones" para el reproductor de tema de fondo.
function AnimatedSpeaker({ size = 16, color }: { size?: number; color: string }) {
  const scale = useSharedValue(1);
  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.28, { duration: 190, easing: Easing.out(Easing.quad) }),
        withTiming(0.82, { duration: 160, easing: Easing.in(Easing.quad) }),
        withTiming(1.18, { duration: 160, easing: Easing.out(Easing.quad) }),
        withTiming(0.94, { duration: 130 }),
        withTiming(1,    { duration: 240, easing: Easing.out(Easing.ease) }),
      ),
      -1,
      false,
    );
    return () => { cancelAnimation(scale); };
  }, []);
  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));
  return (
    <Animated.View style={animStyle}>
      <Feather name="volume-2" size={size} color={color} />
    </Animated.View>
  );
}

// Texto con relleno en degradado (sin masked-view): SVG <Text> con LinearGradient.
function GradientText({
  text,
  width,
  height = 18,
  fontSize = 13,
  gradId,
  stops,
}: {
  text: string;
  width: number;
  height?: number;
  fontSize?: number;
  gradId: string;
  stops: { offset: number; color: string }[];
}) {
  return (
    <Svg width={width} height={height}>
      <Defs>
        <SvgLinearGradient id={gradId} x1="0" y1="0" x2="1" y2="0">
          {stops.map((s, i) => (
            <Stop key={i} offset={s.offset} stopColor={s.color} />
          ))}
        </SvgLinearGradient>
      </Defs>
      <SvgText
        x={0}
        y={fontSize + 1}
        fontSize={fontSize}
        fontWeight="700"
        fill={`url(#${gradId})`}
      >
        {text}
      </SvgText>
    </Svg>
  );
}

function HandIcon({ size = 18, color = "#7a879d" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M18 11V6a2 2 0 0 0-4 0v5M14 10V4a2 2 0 0 0-4 0v6M10 10.5V6a2 2 0 0 0-4 0v8l-1.5-1.5a2 2 0 0 0-2.83 2.83L4 17a6 6 0 0 0 4.24 1.75L10 19a6 6 0 0 0 6-6v-2a2 2 0 0 0-4 0Z"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function GoldSlidersIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <SvgLinearGradient id="pillGoldGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#5ed1e1" />
          <Stop offset="0.5" stopColor="#bfc2fe" />
          <Stop offset="1" stopColor="#e8bddb" />
        </SvgLinearGradient>
      </Defs>
      <G
        stroke="url(#pillGoldGrad)"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <Line x1="4" y1="21" x2="4" y2="14" />
        <Line x1="4" y1="10" x2="4" y2="3" />
        <Line x1="12" y1="21" x2="12" y2="12" />
        <Line x1="12" y1="8" x2="12" y2="3" />
        <Line x1="20" y1="21" x2="20" y2="16" />
        <Line x1="20" y1="12" x2="20" y2="3" />
        <Line x1="1" y1="14" x2="7" y2="14" />
        <Line x1="9" y1="8" x2="15" y2="8" />
        <Line x1="17" y1="16" x2="23" y2="16" />
      </G>
    </Svg>
  );
}

// ── Sección colapsable de ajustes personalizados ────────────────────────────
const SECTION_ICONS: Record<string, React.ComponentProps<typeof Feather>["name"]> = {
  "Fondo":          "image",
  "Color":          "droplet",
  "Energía":        "zap",
  "Luminosidad":    "sun",
  "Transformación": "refresh-cw",
  "Calidoscopio":   "aperture",
};

function SettingsSection({
  title,
  children,
  defaultOpen = false,
  isModified,
  onReset,
  onOpen,
}: {
  title: string;
  children?: React.ReactNode;
  defaultOpen?: boolean;
  isModified?: boolean;
  onReset?: () => void;
  onOpen?: (y: number) => void;
}) {
  const hasContent = React.Children.count(children) > 0;
  const [open, setOpen] = useState(defaultOpen && hasContent);
  const chevronRot = useSharedValue(defaultOpen && hasContent ? 1 : 0);
  const sectionY = useRef(0);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${chevronRot.value * 180}deg` }],
  }));

  const toggle = useCallback(() => {
    if (!hasContent) return;
    const next = !open;
    setOpen(next);
    chevronRot.value = withTiming(next ? 1 : 0, { duration: 200 });
    if (next && onOpen) {
      const y = sectionY.current;
      setTimeout(() => onOpen(y), 90);
    }
  }, [open, hasContent, chevronRot, onOpen]);

  return (
    <View
      style={{ marginBottom: 2 }}
      onLayout={(e) => { sectionY.current = e.nativeEvent.layout.y; }}
    >
      <Pressable
        onPress={toggle}
        style={{
          flexDirection: "row", alignItems: "center",
          paddingVertical: 11, paddingHorizontal: 2,
          opacity: hasContent ? 1 : 0.32,
        }}
        accessibilityRole="button"
        accessibilityLabel={`${title} — ${open ? "colapsar" : "expandir"}`}
      >
        <View style={{ flex: 1, flexDirection: "row", alignItems: "center", gap: 7 }}>
          {SECTION_ICONS[title] != null && (
            <Feather name={SECTION_ICONS[title]!} size={13} color="#f9f9f9" />
          )}
          <Text style={{ fontSize: 12, fontWeight: "700", letterSpacing: 0.8, textTransform: "uppercase", color: "#f9f9f9" }}>
            {title}
          </Text>
        </View>
        {isModified && onReset && (
          <Pressable
            onPress={onReset}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel={`Restablecer ${title}`}
            style={{ marginRight: 28 }}
          >
            <Text style={{ fontSize: 10, fontWeight: "700", color: "#bfc2fe", letterSpacing: 0.2 }}>
              Restablecer
            </Text>
          </Pressable>
        )}
        <Animated.View style={chevronStyle}>
          <Feather name="chevron-down" size={15} color="#f9f9f9" />
        </Animated.View>
      </Pressable>
      {/* Línea separadora */}
      <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.03)", marginBottom: open && hasContent ? 10 : 0 }} />
      {open && hasContent && (
        <Animated.View
          entering={FadeInDown.duration(220).easing(Easing.out(Easing.quad))}
          style={{
            backgroundColor: "rgba(255,255,255,0.03)",
            borderRadius: 12,
            paddingHorizontal: 10,
            paddingTop: 8,
            paddingBottom: 10,
            marginBottom: 4,
          }}
        >
          {children}
        </Animated.View>
      )}
    </View>
  );
}

// ── GeometrixCarousel ─────────────────────────────────────────────────────────
// Sub-componente memo'd que posee `activeCategory` y todo el estado interno del
// carrusel. Al pulsar una píldora de categoría SOLO se re-renderiza este
// componente (~300 líneas), NO el GeometrixScreen completo (6700+ líneas).
type GeometrixCarouselProps = {
  active: string[];
  effActivating: Set<string>;
  orderSV: SharedValue<string[]>;
  instantOrderFlag: SharedValue<number>;
  draggingId: string | null;
  activeCategory: GeometryCategory;
  onCategoryChange: (id: GeometryCategory) => void;
  toggleGeometry: (id: string) => void;
  handleDragStart: (id: string) => void;
  commitReorder: (id: string, idx: number) => void;
  getSettings: (id: string) => GeoSettings;
  catalogGeometries: GeometryMetaExtended[];
  tabFocused: boolean;
};
const GeometrixCarousel = React.memo(function GeometrixCarousel({
  active,
  effActivating,
  orderSV,
  instantOrderFlag,
  draggingId,
  activeCategory,
  onCategoryChange,
  toggleGeometry,
  handleDragStart,
  commitReorder,
  getSettings,
  catalogGeometries,
  tabFocused,
}: GeometrixCarouselProps) {
  const { width } = useWindowDimensions();
  const tileW = (width - 20 * 2 - 8 * 3) / 3.3;
  const tileItemW = tileW + 8;

  const carouselScrollRef = useAnimatedRef<Animated.ScrollView>();
  const carScrollX = useSharedValue(0);
  const carMaxScrollX = useSharedValue(0);
  const carDragActive = useSharedValue(0);
  const carEdgeIntent = useSharedValue(0);
  const dragOriginIdx = useSharedValue(-1);
  const dragTargetIdx = useSharedValue(-1);
  const carScrollHandler = useAnimatedScrollHandler((e) => {
    carScrollX.value = e.contentOffset.x;
  });
  // Frame callback para auto-scroll de arrastre en el borde del carrusel.
  // Se pausa al salir de la pestaña (tabFocused=false): las tabs quedan montadas
  // en Expo Router y este callback corría 60fps en el hilo UI de fondo → lag.
  const edgeScrollCb = useFrameCallback(() => {
    if (carDragActive.value !== 1) return;
    const v = carEdgeIntent.value;
    if (v === 0) return;
    const next = Math.min(Math.max(carScrollX.value + v, 0), carMaxScrollX.value);
    if (next !== carScrollX.value) {
      carScrollX.value = next;
      scrollTo(carouselScrollRef, next, 0, false);
    }
  });
  useEffect(() => {
    edgeScrollCb.setActive(tabFocused);
  }, [tabFocused, edgeScrollCb]);

  // activeCategory viene del padre; al cambiar se resetea el scroll del carrusel.
  useEffect(() => {
    carScrollX.value = 0;
    carouselScrollRef.current?.scrollTo?.({ x: 0, animated: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  const carouselOrder = useMemo<string[]>(() => {
    const front = active.filter((id) => !effActivating.has(id));
    const frontSet = new Set(front);
    const tail = catalogGeometries.filter(
      (g) => g.category === activeCategory && !frontSet.has(g.id),
    ).map((g) => g.id);
    return [...front, ...tail];
  }, [active, effActivating, activeCategory, catalogGeometries]);
  useEffect(() => {
    instantOrderFlag.value = 0;
    orderSV.value = carouselOrder;
  }, [carouselOrder, instantOrderFlag, orderSV]);

  const domOrder = useMemo<string[]>(() => {
    const activeSet = new Set(active);
    const catBases = catalogGeometries.filter((g) => g.category === activeCategory).map(
      (g) => g.id,
    );
    const otherActiveBases = catalogGeometries.filter(
      (g) => g.category !== activeCategory && activeSet.has(g.id),
    ).map((g) => g.id);
    const activeDups = active.filter((id) => id.includes("::")).sort();
    return [...catBases, ...otherActiveBases, ...activeDups];
  }, [active, activeCategory, catalogGeometries]);

  const CAROUSEL_BATCH = 6;
  const mountedIdsRef = useRef<Set<string>>(new Set<string>());
  const [newMountCount, setNewMountCount] = useState(0);
  const [bgPreloadedIds, setBgPreloadedIds] = useState<ReadonlySet<string>>(
    () => new Set<string>(),
  );
  const newTilesInDom = useMemo(
    () => domOrder.filter((id) => !mountedIdsRef.current.has(id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [domOrder],
  );
  useEffect(() => {
    if (newTilesInDom.length === 0) return;
    setNewMountCount(0);
    let raf = 0;
    const isFirstMount = mountedIdsRef.current.size === 0;
    const startBatch = () => {
      const addBatch = () => {
        setNewMountCount((prev) => {
          const next = prev + CAROUSEL_BATCH;
          if (next < newTilesInDom.length) {
            raf = requestAnimationFrame(addBatch);
          }
          return next;
        });
      };
      raf = requestAnimationFrame(addBatch);
    };
    if (isFirstMount) {
      const task = InteractionManager.runAfterInteractions(startBatch);
      return () => {
        task.cancel();
        if (raf) cancelAnimationFrame(raf);
      };
    }
    startBatch();
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [newTilesInDom]);
  useEffect(() => {
    if (newTilesInDom.length > 0) return;
    const allIds = catalogGeometries.map((g) => g.id);
    const notMounted = allIds.filter((id) => !mountedIdsRef.current.has(id));
    if (notMounted.length === 0) return;
    let raf = 0;
    let bgIdx = 0;
    const timer = setTimeout(() => {
      const addBatch = () => {
        const batch = notMounted.slice(bgIdx, bgIdx + 4);
        if (batch.length === 0) return;
        bgIdx += 4;
        setBgPreloadedIds((prev) => {
          const next = new Set(prev);
          batch.forEach((id) => next.add(id));
          return next;
        });
        if (bgIdx < notMounted.length) {
          raf = requestAnimationFrame(addBatch);
        }
      };
      raf = requestAnimationFrame(addBatch);
    }, 400);
    return () => {
      clearTimeout(timer);
      if (raf) cancelAnimationFrame(raf);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newTilesInDom.length]);
  const tilesToRender = useMemo(() => {
    const alreadyMounted = domOrder.filter((id) => mountedIdsRef.current.has(id));
    const alreadySet = new Set(alreadyMounted);
    const newBatch = newTilesInDom
      .slice(0, newMountCount)
      .filter((id) => !alreadySet.has(id));
    const visible = [...alreadyMounted, ...newBatch];
    const visibleSet = new Set(visible);
    const preloaded = Array.from(bgPreloadedIds).filter(
      (id) => !visibleSet.has(id),
    );
    return [...visible, ...preloaded];
  }, [domOrder, newTilesInDom, newMountCount, bgPreloadedIds]);
  useEffect(() => {
    tilesToRender.forEach((id) => mountedIdsRef.current.add(id));
  }, [tilesToRender]);

  const frontIds = active.filter((id) => !effActivating.has(id));

  const goCategory = useCallback((id: GeometryCategory) => {
    carScrollX.value = 0;
    carouselScrollRef.current?.scrollTo?.({ x: 0, animated: false });
    onCategoryChange(id);
  }, [carScrollX, carouselScrollRef, onCategoryChange]);

  return (
    <>
      {/* Galería de geometrías (una fila horizontal, scrolleable).
          onScrollEndDrag detecta swipe de cambio de categoría sin GestureDetector. */}
      <Animated.ScrollView
        ref={carouselScrollRef}
        horizontal
        scrollEnabled={draggingId === null}
        onScroll={carScrollHandler}
        scrollEventThrottle={16}
        onContentSizeChange={(w) => {
          carMaxScrollX.value = Math.max(0, w - width);
        }}
        style={styles.grid}
        contentContainerStyle={styles.gridContent}
        showsHorizontalScrollIndicator={false}
      >
        <View
          style={[
            styles.gridRow,
            { width: carouselOrder.length * tileItemW, height: tileW },
          ]}
        >
          {tilesToRender.map((gid: string) => {
            const g = getGeometry(baseOf(gid));
            if (!g) return null;
            const selected = active.includes(gid);
            const activating = effActivating.has(gid);
            return (
              <CarouselTile
                key={gid}
                id={gid}
                name={g.name}
                tileW={tileW}
                isSelected={selected}
                isActivating={activating}
                color={getSettings(gid).color}
                onToggle={toggleGeometry}
                draggable={selected && !activating}
                isDragging={draggingId === gid}
                itemW={tileItemW}
                frontCount={frontIds.length}
                onDragStart={handleDragStart}
                onDragEnd={commitReorder}
                screenW={width}
                scrollX={carScrollX}
                dragActive={carDragActive}
                edgeIntent={carEdgeIntent}
                orderSV={orderSV}
                instantOrderFlag={instantOrderFlag}
                dragOriginIdx={dragOriginIdx}
                dragTargetIdx={dragTargetIdx}
              />
            );
          })}
        </View>
      </Animated.ScrollView>

    </>
  );
});

/* ─── Ícono con degradado para las cards del landing ─────────────────────── */
function LandingGradientIcon({ name }: { name: React.ComponentProps<typeof Feather>["name"] }) {
  return (
    <MaskedView maskElement={<Feather name={name} size={20} color="white" />}>
      <LinearGradient
        colors={["#fffeff", "#d7fffe"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ width: 20, height: 20 }}
      />
    </MaskedView>
  );
}

/* ─── Crear Geometría Card — Crystal Nebula ──────────────────────────────── */
const CB_BLUE  = "#6584d4";
const CB_BLUE2 = "#c7caec";
const CB_GOLD  = "#F9F9F9";

// Puntos de estrella de 12 vértices (alternando r=16 y r=8)
const STAR_PTS = Array.from({ length: 12 }, (_, i) => {
  const a   = ((i * 30) - 90) * Math.PI / 180;
  const rad = i % 2 === 0 ? 16 : 8;
  return `${29 + rad * Math.cos(a)},${29 + rad * Math.sin(a)}`;
}).join(" ");

function CrearGeometriaCard({ onPress }: { onPress: () => void }) {

  const PARTICLES = [
    { l: 160, t: 10, r: 1.5, op: 0.55 },
    { l: 228, t: 28, r: 1.0, op: 0.35 },
    { l: 120, t: 48, r: 1.2, op: 0.42 },
    { l: 250, t: 54, r: 0.9, op: 0.28 },
  ] as const;

  return (
    <Pressable
      style={({ pressed }) => [{ opacity: pressed ? 0.78 : 1 }]}
      onPress={onPress}
      accessibilityRole="button"
    >
      {/* Sombra exterior azul */}
      <View style={styles.cbOuter}>
        <View style={styles.cbCard}>
          {/* Cuadrícula de fondo */}
          <Svg style={StyleSheet.absoluteFillObject} pointerEvents="none">
            {[86, 172, 258].map((x, i) => (
              <Line key={`v${i}`} x1={x} y1={0} x2={x} y2={90}
                stroke={CB_BLUE} strokeWidth={0.4} opacity={0.07} />
            ))}
            {[29, 58].map((y, i) => (
              <Line key={`h${i}`} x1={0} y1={y} x2={342} y2={y}
                stroke={CB_BLUE} strokeWidth={0.4} opacity={0.07} />
            ))}
          </Svg>

          {/* Partículas de luz */}
          {PARTICLES.map((p, i) => (
            <View key={i} style={{
              position: "absolute", left: p.l, top: p.t,
              width: p.r * 2, height: p.r * 2, borderRadius: p.r,
              backgroundColor: CB_BLUE2, opacity: p.op,
            }} />
          ))}

          {/* Fila de contenido */}
          <View style={styles.cbRow}>
            {/* Ícono */}
            <View style={styles.cbIconWrap}>
              {/* Base estática: círculo + plus + punto dorado */}
              <Svg width={58} height={58} viewBox="0 0 58 58"
                style={StyleSheet.absoluteFillObject}>
                <Circle cx={29} cy={29} r={26}
                  fill="rgba(101,132,212,0.12)"
                  stroke={CB_BLUE} strokeWidth={0.8} opacity={0.65} />
                <Line x1={29} y1={21} x2={29} y2={37}
                  stroke={CB_BLUE2} strokeWidth={2.2} strokeLinecap="round" />
                <Line x1={21} y1={29} x2={37} y2={29}
                  stroke={CB_BLUE2} strokeWidth={2.2} strokeLinecap="round" />
                <Circle cx={29} cy={29} r={2.8} fill={CB_GOLD} opacity={0.9} />
              </Svg>
            </View>

            {/* Texto */}
            <View style={styles.cbText}>
              <Text style={styles.cbTitle}>Crear Geometría</Text>
              <Text style={styles.cbDesc}>Comienza desde cero</Text>
            </View>

            {/* Chevron en círculo */}
            <View style={styles.cbChevron}>
              <Feather name="chevron-right" size={12} color={CB_BLUE2} />
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function GeometrixScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  // Alto de la tab bar inferior (réplica del cálculo en (tabs)/_layout.tsx),
  // para que el lienzo no quede tapado por el menú de la app.
  const bottomPb = Platform.OS === "web" ? 8 : insets.bottom;
  const tabBarHeight = 56 + Math.round(bottomPb / 2) + bottomPb;
  const { requestHide, showMenu, hidden: menuHidden } = useTabBarVisibility();
  const bottomReserve = tabBarHeight;

  // Ocultar la tab bar siempre que el usuario esté en Geometrix (landing o lienzo).
  // Se restaura automáticamente al cambiar de tab gracias al cleanup de useFocusEffect.
  useFocusEffect(
    useCallback(() => {
      requestHide();
      return () => { showMenu(); };
    }, [requestHide, showMenu])
  );

  // Lo mismo cuando Geometrix se abre como panel deslizante (overlay):
  const { isGeometrixOpen: panelOpen } = useGeometrixPanel();
  useEffect(() => {
    if (!panelOpen) return;
    requestHide();
    return () => { showMenu(); };
  }, [panelOpen, requestHide, showMenu]);

  // Catálogo de geometrías con ajustes del servidor (orden, visibilidad, nombre).
  const { geometries: catalogGeometries } = useGeometrixCatalog();

  // Persistencia local de composiciones ("Mis creaciones").
  const { creations, saveCreation, updateCreation, getCreation } = useGeometrixCreations();
  // Param de ruta: id de una creación a abrir (lo manda la pantalla de la lista).
  const params = useLocalSearchParams<{ load?: string; play?: string; new?: string; preloadId?: string }>();

  // Landing screen: se muestra al entrar con el canvas vacío. Se oculta al
  // tocar "Crear Geometría" o al cargar una creación existente.
  // Arranca en true: el panel se monta en la primera apertura y debe pintar el
  // landing desde el PRIMER frame (con false había un flash del lienzo antes
  // de que el efecto lo activara). Si llega una creación a cargar, el efecto
  // de params lo apaga antes de que se note.
  const [showLanding, setShowLanding] = useState(true);
  // Pausa todas las animaciones de Reanimated (withRepeat) cuando el usuario
  // abandona la pestaña. Las tabs quedan montadas en React Navigation, así que
  // sin esta guarda rot/pulse/fade/ripple/expansión siguen corriendo en el fondo
  // y generan lag en el resto de la app. Se activa en useFocusEffect.
  const [routeFocused, setTabFocused] = useState(false);
  // El panel deslizante (estilo Mezclador) también cuenta como "enfocado":
  // cuando Geometrix vive como overlay, useFocusEffect no dispara.
  const { isGeometrixOpen, closeGeometrix, consumePendingParams, pendingVersion } = useGeometrixPanel();
  const tabFocused = routeFocused || isGeometrixOpen;

  // `active` guarda IDs de instancia (ver `baseOf`): el original de cada
  // geometría usa el id base pelado; los duplicados usan `${base}::${sufijo}`.
  const [active, setActive] = useState<string[]>([]);

  // ── Community heartbeat: report Geometrix activity every 60 s ──────────
  // Only fires when the tab is focused AND at least one layer is active.
  useEffect(() => {
    if (!tabFocused || active.length === 0) return;
    void sendHeartbeat("geometrix_active");
    const id = setInterval(() => void sendHeartbeat("geometrix_active"), 60_000);
    return () => clearInterval(id);
  }, [tabFocused, active.length > 0]); // eslint-disable-line react-hooks/exhaustive-deps

  // Card que se está arrastrando (long-press + drag) para reordenar. Mientras
  // hay un drag activo se desactiva el scroll horizontal del carrusel.
  const [draggingId, setDraggingId] = useState<string | null>(null);
  // Orden VISUAL compartido del carrusel (modelo FLIP). Espeja `carouselOrder` y vive
  // en el UI thread para que cada tile derive su slot con `orderSV.indexOf(id)` sin el
  // desfase de 1 frame de un prop JS. Las tiles se posicionan SOLO con translateX según
  // su slot → NO hay reflow de Fabric al reordenar → sin la carrera que causaba el
  // parpadeo. Init = orden natural de las geometrías base.
  const orderSV = useSharedValue<string[]>(GEOMETRIES.map((g) => g.id));
  // 1 = el próximo cambio de `orderSV` es un commit de arrastre → reposicionar INSTANTE
  // (sin deslizar), porque la card arrastrada ya llegó por dragX y las hermanas por el
  // hueco. La pone en 1 el worklet de soltado y la baja a 0 el efecto espejo (en la
  // sincronización JS posterior, donde las selecciones vuelven a animar).
  const instantOrderFlag = useSharedValue(0);
  // Congela el set de "activándose" mientras dura un drag: si otra card termina
  // su activación a mitad de un arrastre, el orden del carrusel no debe saltar.
  const frozenActivatingRef = useRef<Set<string> | null>(null);
  // Mueve una card a la posición `idx` dentro del orden de selección (`active`).
  // Como el orden de `active` define el orden de las capas (primera = atrás),
  // reordenar aquí reordena también las capas del lienzo.
  const moveActiveTo = useCallback((id: string, idx: number) => {
    // Destino inválido (p. ej. un toque corto que no activó el long-press: origin/
    // target quedaron en -1): NO mover. Sin esta guarda, idx<0 se clampa a 0 y la
    // card salta al frente al solo tocarla.
    if (idx < 0) return;
    setActive((prev) => {
      if (!prev.includes(id)) return prev;
      // `idx` es el slot destino RELATIVO al frente de la categoría visible (el
      // carrusel está filtrado), no al array `active` completo. Para no alterar el
      // z-order entre categorías, se REORDENA SOLO la categoría del item dentro de
      // los slots que esa categoría ya ocupa en `active`; los items de otras
      // categorías quedan exactamente en su índice (su capa no se mueve).
      const cat = categoryOf(id);
      const catSlots: number[] = [];
      const catItems: string[] = [];
      prev.forEach((x, i) => {
        if (categoryOf(x) === cat) {
          catSlots.push(i);
          catItems.push(x);
        }
      });
      const reordered = catItems.filter((x) => x !== id);
      const clamped = Math.max(0, Math.min(idx, reordered.length));
      reordered.splice(clamped, 0, id);
      const next = prev.slice();
      let changed = false;
      catSlots.forEach((slot, k) => {
        if (next[slot] !== reordered[k]) changed = true;
        next[slot] = reordered[k];
      });
      return changed ? next : prev;
    });
  }, []);
  // Geometrías en "activación en el lugar" (pulso + resplandor antes del glide).
  // Mientras una geometría está aquí, NO se mueve al frente: se queda en su slot
  // natural mostrando el resplandor; al terminar el HOLD sale del set y el orden
  // (derivado) la lleva al frente. Es estado para que el orden se recalcule.
  const [activatingIds, setActivatingIds] = useState<Set<string>>(
    () => new Set(),
  );
  // Espejo para leer/escribir el set dentro de los timers sin closures obsoletas.
  const activatingIdsRef = useRef<Set<string>>(activatingIds);
  useEffect(() => {
    activatingIdsRef.current = activatingIds;
  }, [activatingIds]);
  // Timers de activación en curso, para poder cancelarlos al deseleccionar/limpiar.
  const carouselTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(
    new Map(),
  );
  // Orden del carrusel DERIVADO de forma determinista: al frente las seleccionadas
  // que ya terminaron su activación (en orden de selección), y el resto —incluidas
  // las que están activándose— en su orden natural. Así, deseleccionar siempre
  // devuelve la geometría a su lugar natural, aun con otras activaciones en curso.
  // Set de "activándose" efectivo: el congelado durante un drag, o el real.
  const effActivating =
    draggingId !== null && frozenActivatingRef.current
      ? frozenActivatingRef.current
      : activatingIds;
  const handleDragStart = useCallback(
    (id: string) => {
      frozenActivatingRef.current = activatingIdsRef.current;
      setDraggingId(id);
    },
    [],
  );
  // Commit del reordenamiento al soltar (modelo FLIP). El reposicionamiento VISUAL ya
  // lo hizo el worklet de soltado en el UI thread (reescribió orderSV + reseteó dragX/
  // origin/target), así que acá SOLO se sincroniza el dato (`active`) y se limpia el
  // estado de React. `moveActiveTo` produce un `active` cuyo `carouselOrder` coincide
  // con el orderSV que ya escribió el worklet → el efecto espejo lo reescribe con el
  // mismo contenido (no-op visual). Se batea para entrar en un único render.
  const commitReorder = useCallback(
    (id: string, idx: number) => {
      unstable_batchedUpdates(() => {
        moveActiveTo(id, idx);
        frozenActivatingRef.current = null;
        setDraggingId(null);
      });
    },
    [moveActiveTo],
  );
  const [settings, setSettings] = useState<Record<string, GeoSettings>>({});
  const [settingsOpen, setSettingsOpen] = useState(false);
  // Geometría que se está personalizando (la de la flechita pulsada). El panel
  // por capa muestra SOLO esta, no todas las activas.
  const [settingsGeoId, setSettingsGeoId] = useState<string | null>(null);
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
  // Alto CONGELADO del sheet: se mide una vez al abrir (con las secciones
  // colapsadas) y se fija, así el sheet ajusta su tamaño al contenido (sin
  // vacío) pero NO crece al desplegar una sección — el contenido scrollea y la
  // vista previa (anclada a este alto) mantiene tamaño y posición.
  const [frozenSheetH, setFrozenSheetH] = useState<number | null>(null);
  // Mismo congelado de alto para el panel de ajustes generales.
  const [frozenGeneralSheetH, setFrozenGeneralSheetH] = useState<number | null>(
    null,
  );
  // Modo inmersión: solo el fondo animado, sin interfaz.
  const [immersive, setImmersive] = useState(false);
  // Modo lienzo expandido: pantalla completa editable (gestos + 3 controles).
  const [fullscreenEdit, setFullscreenEdit] = useState(false);
  // Contador que fuerza remount del GestureDetector tras salir del fullscreen.
  // RNGH deja estado nativo sucio cuando el Modal desmonta mid-gesture; un key
  // nuevo crea reconocedores nativos completamente frescos.
  const [gestureKey, setGestureKey] = useState(0);
  // Nombre de la composición recién guardada → muestra el popup temático.
  const [savedName, setSavedName] = useState<string | null>(null);
  const [updatedName, setUpdatedName] = useState<string | null>(null);
  const [showEmptyAlert, setShowEmptyAlert] = useState(false);
  // Confirmación explícita antes de descartar el lienzo y salir de Geometrix.
  const [closeConfirmOpen, setCloseConfirmOpen] = useState(false);
  // Geometría con su menú contextual abierto (tap en miniatura).
  const [menuGeoId, setMenuGeoId] = useState<string | null>(null);
  // "Aislar": muestra solo esta geometría en el lienzo (sin quitar las demás).
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  // Geometría seleccionada para el pellizco (pinch) que ajusta su zoom.
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // ── Historial "Atrás" (deshacer) ─────────────────────────────────────────
  // Una composición = { active, settings, master, hiddenIds }. Guardamos
  // snapshots inmutables (las setStates siempre reemplazan, nunca mutan) en una
  // pila. Cada "cambio" (agregar/quitar/transformar/limpiar/ajustes) empuja el
  // estado PREVIO; "Atrás" lo restaura. La captura es con debounce para que un
  // arrastre de slider (muchos sets seguidos) cuente como UN solo paso.
  const undoStackRef = useRef<CompSnapshot[]>([]);
  const redoStackRef = useRef<CompSnapshot[]>([]);
  // Último estado confirmado (baseline). En reposo refleja el lienzo actual.
  const prevCompRef = useRef<CompSnapshot | null>(null);
  // Estado anterior al inicio de la ráfaga actual (se empuja al asentarse).
  const burstBaseRef = useRef<CompSnapshot | null>(null);
  const historyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Marca que el próximo cambio proviene de un "Atrás" / "Adelante" (no re-grabar historial).
  const isUndoingRef = useRef(false);
  const isRedoingRef = useRef(false);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  // Limpia el historial al cargar otra creación o empezar en blanco. Definido
  // acá (antes de loadCreation) para que esté disponible sin TDZ.
  const resetHistory = useCallback(() => {
    if (historyTimerRef.current) {
      clearTimeout(historyTimerRef.current);
      historyTimerRef.current = null;
    }
    undoStackRef.current = [];
    redoStackRef.current = [];
    burstBaseRef.current = null;
    prevCompRef.current = null; // próximo efecto fija baseline sin grabar
    setCanUndo(false);
    setCanRedo(false);
  }, []);
  // Cuando los thumbnails desbordan el ancho visible, alineamos a la izquierda
  // (en vez de centrar) para que se pueda deslizar y se asome el último.
  const [thumbsOverflow, setThumbsOverflow] = useState(false);
  const thumbsViewW = useRef(0);
  const thumbsScrollRef = useRef<ScrollView>(null);
  const settingsScrollRef = useRef<ScrollView>(null);
  const generalScrollRef  = useRef<ScrollView>(null);
  // Aparición escalonada de thumbnails: solo la primera tanda (al poblarse el
  // lienzo) entra de izquierda a derecha; las que se agregan luego, al instante.
  const thumbsInitialIdsRef = useRef<Set<string> | null>(null);
  // Desplegable de acciones (flecha bajo la divisora): colapsado por defecto.
  const [pillOpen, setPillOpen] = useState(false);
  // Vira el badge de rotación y la píldora a azul (#171e5a) cuando el ángulo del
  // objetivo entra en zona cardinal (0/90/180/270/360°). Lo maneja 100% el UI
  // thread (useAnimatedReaction sobre liveRot), sin estado React → sin re-render
  // por frame al rotar.
  const pillCardinalSV = useSharedValue(0);
  // 1 cuando hay objetivo de pellizco/rotación; deja que la reacción apague el
  // color cardinal cuando no hay ninguna geometría seleccionada.
  const rotHasTargetSV = useSharedValue(0);
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
  // Activa el escalado en vivo SOLO desde el onStart del pellizco hasta que el
  // valor confirmado se vuelve a sincronizar (useEffect tras el commit). En
  // reposo/selección vale 0 → la capa muestra su tamaño confirmado aunque
  // `livePinch` aún no esté sincronizado (evita el "pop" al cambiar de objetivo).
  const pinchActive = useSharedValue(0);

  // ── Lupa de magnificación ─────────────────────────────────────────────────
  // Aparece al mantener el dedo sobre la geometría seleccionada.
  const loupeX = useSharedValue(0);
  const loupeY = useSharedValue(0);
  const loupeReveal = useSharedValue(0);
  // Flag UI-thread para que longPress no active la lupa durante un pellizco.
  const isPinching = useSharedValue(false);
  // Flag inmediato (UI-thread, sin animación) que indica que la lupa está activa.
  // Se usa como guard en panGesture para bloquear el drag desde el primer frame.
  const isLoupeActive = useSharedValue(false);
  const [loupeVisible, setLoupeVisible] = useState(false);
  const [loupeGeoId, setLoupeGeoId] = useState<string | null>(null);
  // Rotación manual en vivo (gesto de dos dedos). El ángulo en curso se lleva en
  // grados; se confirma a settings al soltar. null = no se está rotando.
  const liveRot = useSharedValue(0);
  const rotStart = useSharedValue(0);
  // true cuando el gesto terminó con éxito (onEnd); permite revertir en cancelación.
  const rotSucceeded = useSharedValue(false);
  // Activa la rotación en vivo SOLO durante el gesto (igual que pinchActive para el
  // zoom): en reposo la capa usa su manualAngle confirmado aunque liveRot esté
  // momentáneamente desincronizado → sin "pop" al cambiar de objetivo y sin
  // re-render por frame (el ángulo se aplica en el UI thread vía useAnimatedStyle).
  const rotActive = useSharedValue(0);
  // Estado cardinal previo (UI thread) para animar el color del badge SOLO al
  // cruzar el umbral, no en cada frame. -1 = sin evaluar (fuerza el primer set).
  const rotCardGuard = useSharedValue(-1);
  // El indicador cardinal solo se activa si el usuario realmente rotó en este
  // objetivo (se pone a 1 en onStart del gesto; se limpia al cambiar selección).
  // Evita que la píldora vire a morado solo por seleccionar una geometría que
  // esté a 0° (su ángulo por defecto), sin haberla girado nunca.
  const rotDidRotate = useSharedValue(0);

  // ── Drag (arrastrar con un dedo) ─────────────────────────────────────────
  const liveDragX = useSharedValue(0);
  const liveDragY = useSharedValue(0);
  const dragStartX = useSharedValue(0);
  const dragStartY = useSharedValue(0);
  // Activa el desplazamiento en vivo SOLO durante el gesto (igual que pinchActive
  // para el zoom): la capa arrastrada sigue a liveDragX/Y en el UI thread sin
  // re-render por frame; en reposo usa su offset confirmado. Se apaga tras el
  // commit (useEffect de sync) para no "popear" a la posición previa.
  const dragActive = useSharedValue(0);
  // ── Pausa de animaciones al tocar el carrusel / tab de categorías ─────────
  // Si hay más de 4 geometrías activas y el usuario está tocando el carrusel
  // o los pills de categoría, se congela el movimiento para evitar lag.

  // ── Hold mode (transformación grupal) ────────────────────────────────────
  // Estado React + mirror SharedValue (para worklets sin re-render por frame).
  const [holdMode, setHoldMode] = useState(false);
  const holdModeSV = useSharedValue(0);
  useEffect(() => { holdModeSV.value = holdMode ? 1 : 0; }, [holdMode, holdModeSV]);
  // Auto-desactivar si queda menos de 2 capas activas.
  useEffect(() => { if (active.length < 2 && holdMode) setHoldMode(false); }, [active.length, holdMode]);
  // Pellizco Hold: factor de escala incremental (no ratio, sino el e.scale del gesto).
  const holdScaleSV = useSharedValue(1);
  const holdScaleActive = useSharedValue(0);
  // Rotación Hold: delta en grados desde el inicio del gesto.
  const holdRotDeltaDeg = useSharedValue(0);
  const holdRotActive = useSharedValue(0);
  // Drag Hold: desplazamiento incremental desde el inicio del gesto.
  const holdDragDeltaX = useSharedValue(0);
  const holdDragDeltaY = useSharedValue(0);
  const holdDragActive = useSharedValue(0);
  // Contadores de commit Hold: cada commit los incrementa para disparar el
  // effect que apaga el gate del gesto DESPUÉS del re-render con el valor
  // confirmado (evita el parpadeo A→B del reset síncrono). Ver commitHold*.
  const [holdDragCommitN, setHoldDragCommitN] = useState(0);
  const [holdZoomCommitN, setHoldZoomCommitN] = useState(0);
  const [holdAngleCommitN, setHoldAngleCommitN] = useState(0);

  // Líneas guía de snap (UI thread): offset detectado + on/off, sin estado React.
  const snapXSV = useSharedValue(0);
  const snapXOn = useSharedValue(0);
  const snapYSV = useSharedValue(0);
  const snapYOn = useSharedValue(0);
  // Offsets de todas las geometrías no-objetivo + el centro del lienzo (0,0);
  // usados en el worklet del drag para calcular snap sin llamar a getSettings.
  // null en un eje = ese eje no snap (para guías de un solo eje).
  const snapTargets = useSharedValue<Array<{ offsetX: number | null; offsetY: number | null }>>([]);
  // Centroide del grupo en hold mode (promedio de offsets de todas las capas activas).
  // Permite calcular el snap al centro del lienzo durante un drag de grupo sin
  // necesitar getSettings en el worklet.
  const holdCentroidX = useSharedValue(0);
  const holdCentroidY = useSharedValue(0);

  // Creación cargada desde "Mis creaciones" (null = lienzo nuevo o no cargado).
  // Reactivo para poder mostrar/ocultar el botón "Actualizar" en la UI.
  const [editingCreation, setEditingCreation] = useState<{ id: string; name: string } | null>(null);
  // true cuando el usuario modificó algo desde que se cargó la creación.
  const [isDirty, setIsDirty] = useState(false);
  // Suprime el primer disparo del efecto dirty (causado por el propio loadCreation).
  const justLoadedRef = useRef(false);

  // ── Tema de fondo: audio PROPIO de Geometrix ───────────────────────────────
  // El usuario elige una sesión/música de toda la biblioteca para que suene
  // mientras crea. Es un reproductor SEPARADO del global: no usa el MiniPlayer y
  // no persiste fuera de Geometrix (se corta al salir de la pestaña y se libera
  // al desmontar). Para evitar audio doble, al elegir un tema se corta el
  // reproductor global de la app.
  const { stop: stopGlobalPlayer } = usePlayer();
  const themePlayerRef = useRef<AudioPlayer | null>(null);
  const [themeSession, setThemeSession] = useState<Session | null>(null);
  const [themeSearchOpen, setThemeSearchOpen] = useState(false);
  const [activeCategory, setActiveCategory] = useState<GeometryCategory>(GEOMETRY_CATEGORIES[0].id);
  const [themeQuery, setThemeQuery] = useState("");
  // Glow blanco del botón: 0 = apagado, 1 = plena intensidad. Al sonar arranca
  // una respiración muy sutil (75–100%) con periodo de 3 s; al parar vuelve a 0.
  const themeGlow = useSharedValue(0);

  // Resultados de búsqueda sobre TODA la biblioteca; solo sesiones reproducibles
  // (con audio bundleado o remoto), para que toda fila suene al tocarla.
  const themeResults = useMemo(() => {
    const q = themeQuery.trim().toLowerCase();
    if (!q) return [];
    return SESSIONS.filter((s) => {
      if (!(AUDIO_MAP[s.id] ?? s.audioUri)) return false;
      return (
        s.title.toLowerCase().includes(q) ||
        s.categoryLabel.toLowerCase().includes(q) ||
        s.subtitle.toLowerCase().includes(q)
      );
    }).slice(0, 50);
  }, [themeQuery]);

  const stopTheme = useCallback(() => {
    const p = themePlayerRef.current;
    if (p) {
      try {
        p.pause();
      } catch {
        /* ignore */
      }
    }
    setThemeSession(null);
  }, []);

  const playTheme = useCallback(
    (session: Session) => {
      const audioFile =
        AUDIO_MAP[session.id] ?? (session.audioUri ? { uri: session.audioUri } : undefined);
      if (!audioFile) return;
      // Audio exclusivo dentro de Geometrix: cortar el reproductor global y el
      // intro one-shot para que no suenen dos audios a la vez.
      try {
        stopGlobalPlayer();
      } catch {
        /* ignore */
      }
      try {
        stopGeometrixIntro();
      } catch {
        /* ignore */
      }
      let p = themePlayerRef.current;
      if (!p) {
        try {
          p = createAudioPlayer(null, { updateInterval: 1000 });
          themePlayerRef.current = p;
        } catch {
          return;
        }
      }
      try {
        p.loop = true;
        p.volume = 1;
        p.replace(audioFile);
        p.play();
        setThemeSession(session);
      } catch {
        /* ignore */
      }
    },
    [stopGlobalPlayer],
  );

  // Animación del glow del botón: fade-in al arrancar, respiración sutil mientras
  // suena (75→100%), fade-out al parar. Vive en el UI thread (shared value).
  useEffect(() => {
    if (themeSession) {
      themeGlow.value = withTiming(1, { duration: 700, easing: Easing.out(Easing.ease) }, () => {
        "worklet";
        themeGlow.value = withRepeat(
          withTiming(0.75, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
          -1,
          true,
        );
      });
    } else {
      cancelAnimation(themeGlow);
      themeGlow.value = withTiming(0, { duration: 400 });
    }
  }, [themeSession, themeGlow]);

  // Cortar el tema al salir de la pestaña Geometrix (las pestañas quedan montadas,
  // así que el cleanup de desmontaje no corre al cambiar de tab).
  useFocusEffect(
    useCallback(() => {
      return () => stopTheme();
    }, [stopTheme]),
  );

  // Liberar el reproductor de tema al desmontar la pantalla.
  useEffect(() => {
    return () => {
      const p = themePlayerRef.current;
      if (p) {
        try {
          p.remove();
        } catch {
          /* ignore */
        }
        themePlayerRef.current = null;
      }
    };
  }, []);

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
      // Marcar la pestaña como activa → las animaciones de Reanimated se reanudan.
      setTabFocused(true);
      // Landing oculto: el acceso va directo al lienzo.
      // Audio de intro sincronizado con el "logo reveal" (cubo-3): solo cuando
      // el lienzo está vacío, que es cuando aparece el logo.
      if (activeRef.current.length === 0) {
        playIntro();
      }
      return () => {
        // Marcar la pestaña como inactiva → pausa todos los withRepeat de Reanimated
        // (rot, pulse, fade, ripple, expansión) para que no consuman CPU en el fondo.
        setTabFocused(false);
        stopIntro();
        setSettingsOpen(false);
        setSettingsGeoId(null);
        setGeneralOpen(false);
        setImmersive(false);
        setFullscreenEdit(false);
        setSavedName(null);
        setMenuGeoId(null);
        setHiddenIds([]);
        // Cancelar activaciones en curso: el orden derivado deja las seleccionadas
        // al frente al limpiarse activatingIds, coherente por si se vuelve a entrar.
        carouselTimers.current.forEach((t) => clearTimeout(t));
        carouselTimers.current.clear();
        const emptyActivating = new Set<string>();
        activatingIdsRef.current = emptyActivating;
        setActivatingIds(emptyActivating);
        setMaster({ opacity: 1, motion: true, glow: 0, bgColor: null, bgGradientId: null, bgBrightness: 0.5, bgPattern: null });
      };
    }, [playIntro, stopIntro]),
  );

  // Mismo ciclo entrar/salir cuando Geometrix se abre como panel deslizante
  // (overlay estilo Mezclador): useFocusEffect no dispara en ese modo.
  useEffect(() => {
    if (!isGeometrixOpen) return;
    if (activeRef.current.length === 0) {
      // Al entrar por el panel con el lienzo vacío → mostrar el landing
      setShowLanding(true);
      playIntro();
    }
    return () => {
      stopIntro();
      setSettingsOpen(false);
      setSettingsGeoId(null);
      setGeneralOpen(false);
      setImmersive(false);
      setFullscreenEdit(false);
      setSavedName(null);
      setMenuGeoId(null);
      setHiddenIds([]);
      carouselTimers.current.forEach((t) => clearTimeout(t));
      carouselTimers.current.clear();
      const emptyActivating = new Set<string>();
      activatingIdsRef.current = emptyActivating;
      setActivatingIds(emptyActivating);
      setMaster({ opacity: 1, motion: true, glow: 0, bgColor: null, bgGradientId: null, bgBrightness: 0.5, bgPattern: null });
    };
  }, [isGeometrixOpen, playIntro, stopIntro]);


  // Quita una geometría del set de "activándose" (estado + ref espejo).
  const dropActivating = useCallback((id: string) => {
    setActivatingIds((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (activatingIdsRef.current.has(id)) {
      const next = new Set(activatingIdsRef.current);
      next.delete(id);
      activatingIdsRef.current = next;
    }
  }, []);

  const toggleGeometry = useCallback((id: string) => {
    // Derivar add/remove del valor comprometido más reciente (no del closure).
    const removing = activeRef.current.includes(id);
    setActive((prev) =>
      prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id],
    );
    if (removing) {
      // Al quitar, limpiar los ajustes para que vuelva a los defaults si se re-agrega.
      setSettings((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      // Si se deselecciona durante su activación, cancelar el timer pendiente.
      // El orden (derivado) devuelve la geometría a su lugar natural al cambiar
      // `active`, aun si hay otras activaciones en curso.
      const pendingT = carouselTimers.current.get(id);
      if (pendingT) {
        clearTimeout(pendingT);
        carouselTimers.current.delete(id);
      }
      dropActivating(id);
    } else {
      // Al agregar, sembrar ajustes por defecto.
      setSettings((prev) => (prev[id] ? prev : { ...prev, [id]: defaultSettings(baseOf(id)) }));
      // Activación "en el lugar" (~1s): la geometría se enciende con su color y un
      // resplandor sin moverse (sigue en su slot natural por estar en activatingIds);
      // pasado el HOLD sale del set y el orden derivado la lleva al frente, y el
      // carrusel la acompaña con scroll hasta dejar visible el slot donde aterriza.
      setActivatingIds((prev) => {
        const next = new Set(prev);
        next.add(id);
        return next;
      });
      {
        const next = new Set(activatingIdsRef.current);
        next.add(id);
        activatingIdsRef.current = next;
      }
      // Reemplazar cualquier timer previo de este id (re-tap rápido).
      const prevT = carouselTimers.current.get(id);
      if (prevT) clearTimeout(prevT);
      const t = setTimeout(() => {
        carouselTimers.current.delete(id);
        // Sale del estado "activándose": el orden derivado lo mueve al frente.
        // El carrusel NO acompaña con scroll: la vista se queda estática en su
        // lugar (preferencia del usuario); solo la tile se desliza al frente.
        const nextSet = new Set(activatingIdsRef.current);
        nextSet.delete(id);
        activatingIdsRef.current = nextSet;
        setActivatingIds(nextSet);
      }, CAROUSEL_HOLD_MS);
      carouselTimers.current.set(id, t);
    }
    // Seleccionarla para el pellizco (si se quita, el effect reasigna).
    setSelectedId(id);
  }, [dropActivating]);

  // Contador monótono para garantizar ids de instancia únicos aun creando varios
  // duplicados en el mismo milisegundo.
  const dupSeqRef = useRef(0);
  // Duplica una capa (instancia): inserta una copia INMEDIATAMENTE a la derecha
  // del original en `active` (= a la derecha de su card) con ajustes POR DEFECTO
  // (sin efectos preestablecidos), y la deja seleccionada.
  const duplicateGeometry = useCallback((iid: string) => {
    const base = baseOf(iid);
    const newId = `${base}${INSTANCE_SEP}${Date.now().toString(36)}${(dupSeqRef.current++).toString(36)}`;
    setSettings((prev) => ({ ...prev, [newId]: defaultSettings(base) }));
    // Si el original sigue en su ventana de activación (HOLD), el orden derivado
    // lo saca del frente y el duplicado quedaría separado de él. Forzar que el
    // original se asiente ya (cancelar su timer y sacarlo de activatingIds) para
    // que ambos queden en el frente, adyacentes.
    const t = carouselTimers.current.get(iid);
    if (t) {
      clearTimeout(t);
      carouselTimers.current.delete(iid);
    }
    if (activatingIdsRef.current.has(iid)) {
      const settled = new Set(activatingIdsRef.current);
      settled.delete(iid);
      activatingIdsRef.current = settled;
      setActivatingIds(settled);
    }
    setActive((prev) => {
      const i = prev.indexOf(iid);
      if (i === -1) return [...prev, newId];
      const next = [...prev];
      next.splice(i + 1, 0, newId);
      return next;
    });
    setSelectedId(newId);
  }, []);

  // Vacía por completo el lienzo: quita todas las geometrías activas, resetea
  // sus ajustes por capa (quedan en defaults al re-agregar) y resetea los
  // ajustes generales (fondo, brillo, opacidad, glow, movimiento).
  const clearCanvas = useCallback(() => {
    // El intro suena una sola vez por lanzamiento de app: al vaciar el lienzo NO
    // se vuelve a disparar.
    setActive([]);
    // Resetear el carrusel: cancelar activaciones en curso. El orden (derivado de
    // `active` + activatingIds) vuelve solo al natural al vaciarse `active`.
    carouselTimers.current.forEach((t) => clearTimeout(t));
    carouselTimers.current.clear();
    const emptyActivating = new Set<string>();
    activatingIdsRef.current = emptyActivating;
    setActivatingIds(emptyActivating);
    setHiddenIds([]);
    setSelectedId(null);
    setSettings({});
    setEditingCreation(null);
    setMaster((m) => ({
      opacity: 1,
      motion: true,
      glow: 0,
      bgColor: m.bgColor,
      bgGradientId: m.bgGradientId,
      bgBrightness: m.bgBrightness,
      bgPattern: m.bgPattern,
    }));
  }, []);

  // No modifica las creaciones guardadas: sólo destruye la sesión efímera que
  // está renderizando el lienzo antes de cerrar el panel o abandonar la ruta.
  const discardCanvasAndClose = useCallback(() => {
    setCloseConfirmOpen(false);
    stopIntro();
    stopTheme();
    resetHistory();
    clearCanvas();
    setMaster({
      opacity: 1,
      motion: true,
      glow: 0,
      bgColor: null,
      bgGradientId: null,
      bgBrightness: 0.5,
      bgPattern: null,
    });
    setGuides([]);
    setSelectedId(null);
    setSettingsOpen(false);
    setSettingsGeoId(null);
    setGeneralOpen(false);
    setGuidesOpen(false);
    setThemeSearchOpen(false);
    setThemeQuery("");
    setMenuGeoId(null);
    setPillOpen(false);
    setLoupeVisible(false);
    setImmersive(false);
    setFullscreenEdit(false);
    setShowLanding(true);

    if (isGeometrixOpen) {
      closeGeometrix();
    } else {
      router.back();
    }
  }, [
    clearCanvas,
    closeGeometrix,
    isGeometrixOpen,
    resetHistory,
    router,
    stopIntro,
    stopTheme,
  ]);

  const updateSetting = useCallback(
    <K extends keyof GeoSettings>(id: string, key: K, value: GeoSettings[K]) => {
      setSettings((prev) => ({
        ...prev,
        [id]: { ...(prev[id] ?? defaultSettings(baseOf(id))), [key]: value },
      }));
    },
    [],
  );

  const getSettings = useCallback(
    // Merge contra defaults para tolerar settings parciales (ej. estado
    // creado antes de que existieran `scale`/`thickness`).
    (id: string): GeoSettings => ({ ...defaultSettings(baseOf(id)), ...(settings[id] ?? {}) }),
    [settings],
  );

  // Versión con IDENTIDAD ESTABLE del merge: devuelve el MISMO objeto mientras
  // `settings[id]` no cambie de referencia. `updateSetting` reemplaza solo la
  // entrada tocada (spread de `prev`), así que al arrastrar un slider únicamente
  // ESA capa recibe un objeto nuevo; las demás conservan su referencia. Junto con
  // React.memo en CanvasLayer, esto evita re-reconciliar todas las capas en cada
  // tick (drag) y en cada selección del carrusel → sin microlag. NO usar para
  // leer valores que luego se mutan (es de solo lectura, como getSettings).
  const stableSettingsCache = useRef<
    Map<string, { src: GeoSettings | undefined; merged: GeoSettings }>
  >(new Map());
  const getStableSettings = useCallback(
    (id: string): GeoSettings => {
      const src = settings[id];
      const cached = stableSettingsCache.current.get(id);
      if (cached && cached.src === src) return cached.merged;
      const merged = { ...defaultSettings(baseOf(id)), ...(src ?? {}) };
      stableSettingsCache.current.set(id, { src, merged });
      return merged;
    },
    [settings],
  );

  // ¿La geometría tiene algún parámetro del panel distinto de sus defaults?
  // (Ignora las transformaciones por gesto — ver TRANSFORM_KEYS.)
  const isGeoModified = useCallback(
    (id: string): boolean => {
      if (!settings[id]) return false;
      const def = defaultSettings(baseOf(id));
      // Fusionar contra defaults para tolerar settings parciales (creaciones
      // guardadas antes de que existieran ciertas claves): una clave ausente
      // debe contar como su default, no como "modificada".
      const cur = { ...def, ...settings[id] };
      return (Object.keys(def) as (keyof GeoSettings)[]).some(
        (k) => !TRANSFORM_KEYS.includes(k) && cur[k] !== def[k],
      );
    },
    [settings],
  );

  // Restablecer los ajustes personalizados de una geometría a sus defaults,
  // preservando su transformación por gesto (posición/zoom/ángulo/tamaño).
  const resetGeometry = useCallback((id: string) => {
    setSettings((prev) => {
      const cur = prev[id] ?? defaultSettings(baseOf(id));
      const def = defaultSettings(baseOf(id));
      return {
        ...prev,
        [id]: {
          ...def,
          scale: cur.scale,
          zoom: cur.zoom,
          manualAngle: cur.manualAngle,
          offsetX: cur.offsetX,
          offsetY: cur.offsetY,
        },
      };
    });
  }, []);

  const isSectionModified = useCallback(
    (id: string, keys: (keyof GeoSettings)[]): boolean => {
      if (!settings[id]) return false;
      const def = defaultSettings(baseOf(id));
      const cur = { ...def, ...settings[id] };
      return keys.some((k) => cur[k] !== def[k]);
    },
    [settings],
  );

  const resetSection = useCallback((id: string, keys: (keyof GeoSettings)[]) => {
    setSettings((prev) => {
      const def = defaultSettings(baseOf(id));
      const cur = prev[id] ?? def;
      const patch: Partial<GeoSettings> = {};
      for (const k of keys) {
        (patch as any)[k] = def[k];
      }
      return { ...prev, [id]: { ...cur, ...patch } };
    });
  }, []);

  // Confirmar el zoom del pellizco a settings (corre en JS thread). El "en vivo"
  // se limpia aparte en onFinalize (que SIEMPRE corre, también al cancelarse el
  // gesto) y siempre DESPUÉS de este commit, así el objetivo pasa del tamaño en
  // vivo al confirmado (idéntico valor) sin un frame intermedio.
  const commitZoom = useCallback(
    (id: string, z: number) => updateSetting(id, "zoom", z),
    [updateSetting],
  );

  // Confirmar el ángulo manual del gesto de rotación a settings (JS thread).
  // Saneado final: nunca guardar NaN en settings.
  const commitAngle = useCallback(
    (id: string, deg: number) =>
      updateSetting(id, "manualAngle", Number.isFinite(deg) ? deg : 0),
    [updateSetting],
  );

  // Confirmar el desplazamiento del drag (un dedo) a settings (JS thread).
  const commitOffset = useCallback(
    (id: string, x: number, y: number) => {
      updateSetting(id, "offsetX", Number.isFinite(x) ? x : 0);
      updateSetting(id, "offsetY", Number.isFinite(y) ? y : 0);
    },
    [updateSetting],
  );

  // ── Commits del modo Hold ────────────────────────────────────────────────
  // Aplican la transformación incremental a TODAS las capas activas a la vez.

  const commitHoldZoom = useCallback(
    (scale: number) => {
      if (!Number.isFinite(scale) || scale <= 0) return;
      setSettings((prev) => {
        const next = { ...prev };
        active.forEach((id) => {
          const base = baseOf(id);
          const cur = prev[id] ?? defaultSettings(base);
          const prevZoom = Number.isFinite(cur.zoom) && (cur.zoom ?? 0) > 0 ? (cur.zoom ?? 1) : 1;
          const newZoom = Math.min(6, Math.max(0.1, prevZoom * scale));
          next[id] = { ...cur, zoom: newZoom };
        });
        return next;
      });
      // NO resetear holdScaleSV/holdScaleActive aquí: el reset síncrono llega al
      // hilo UI ANTES del re-render con el nuevo zoom → flash de retroceso. El
      // ratio auto-corrector de pinchScaleSV mantiene el tamaño invariante; el
      // gate se apaga en el effect [holdZoomCommitN] (tras el re-render).
      setHoldZoomCommitN((n) => n + 1);
    },
    [active, setSettings],
  );

  const commitHoldAngle = useCallback(
    (deltaDeg: number) => {
      if (!Number.isFinite(deltaDeg)) return;
      setSettings((prev) => {
        const next = { ...prev };
        active.forEach((id) => {
          const base = baseOf(id);
          const cur = prev[id] ?? defaultSettings(base);
          const prevAngle = Number.isFinite(cur.manualAngle) ? (cur.manualAngle ?? 0) : 0;
          next[id] = { ...cur, manualAngle: prevAngle + deltaDeg };
        });
        return next;
      });
      // Reset diferido al effect [holdAngleCommitN] (ver commitHoldZoom): el
      // worklet usa holdBaseAngle congelado, así que mantiene base+delta = ángulo
      // final hasta que el gate se apaga tras el re-render → sin parpadeo.
      setHoldAngleCommitN((n) => n + 1);
    },
    [active, setSettings],
  );

  const commitHoldOffset = useCallback(
    (dx: number, dy: number) => {
      if (!Number.isFinite(dx) || !Number.isFinite(dy)) return;
      setSettings((prev) => {
        const next = { ...prev };
        active.forEach((id) => {
          const base = baseOf(id);
          const cur = prev[id] ?? defaultSettings(base);
          const px = Number.isFinite(cur.offsetX) ? (cur.offsetX ?? 0) : 0;
          const py = Number.isFinite(cur.offsetY) ? (cur.offsetY ?? 0) : 0;
          next[id] = { ...cur, offsetX: px + dx, offsetY: py + dy };
        });
        return next;
      });
      // Reset diferido al effect [holdDragCommitN] (ver commitHoldZoom): cada
      // CanvasLayer usa holdBaseOffsetX/Y congelado → muestra base+delta = pos
      // final hasta que el gate se apaga tras el re-render → sin parpadeo.
      setHoldDragCommitN((n) => n + 1);
    },
    [active, setSettings],
  );

  // Reset diferido de los gates de gesto Hold. Corren DESPUÉS del re-render con
  // el valor confirmado (committedX/zoom/ángulo ya = B). Hasta entonces el
  // worklet muestra base+delta (drag/rot) o el ratio auto-corrector (zoom), que
  // ya valen B → apagar el gate ahora es invisible (sin parpadeo A→B). El guard
  // `=== 0` evita correr en el montaje inicial.
  useEffect(() => {
    if (holdDragCommitN === 0) return;
    holdDragDeltaX.value = 0;
    holdDragDeltaY.value = 0;
    holdDragActive.value = 0;
  }, [holdDragCommitN, holdDragDeltaX, holdDragDeltaY, holdDragActive]);
  useEffect(() => {
    if (holdZoomCommitN === 0) return;
    holdScaleSV.value = 1;
    holdScaleActive.value = 0;
  }, [holdZoomCommitN, holdScaleSV, holdScaleActive]);
  useEffect(() => {
    if (holdAngleCommitN === 0) return;
    holdRotDeltaDeg.value = 0;
    holdRotActive.value = 0;
  }, [holdAngleCommitN, holdRotDeltaDeg, holdRotActive]);

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
      // Empezar el historial de "Atrás" desde cero para esta creación.
      resetHistory();
      // Registrar la creación cargada para habilitar el botón "Actualizar".
      setEditingCreation({ id: c.id, name: c.name });
      // Ocultar el landing — la creación abre el canvas directamente.
      setShowLanding(false);
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
    [getCreation, stopIntro, resetHistory],
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
      resetHistory();
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
  }, [params.new, stopIntro, resetHistory]);

  // Params que llegan vía el panel deslizante (openGeometrix({...})): mismos
  // efectos que los params de ruta, pero consumidos del contexto.
  useEffect(() => {
    if (!isGeometrixOpen) return;
    const p = consumePendingParams();
    if (!p) return;
    if (p.load) {
      setShowLanding(false);
      loadCreation(p.load, p.play === "1");
    } else if (p.new === "1") {
      setShowLanding(false);
      setEditingCreation(null);
      resetHistory();
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
    }
    // p.preloadId: la ruta tampoco lo consumía; se acepta y se ignora igual.
  }, [isGeometrixOpen, pendingVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  const [canvas, setCanvas] = useState({ w: 0, h: 0 });
  // Lienzo cuadrado y centrado: lado = lado menor del espacio disponible.
  const canvasSide = canvas.w > 0 ? Math.min(canvas.w, canvas.h) : 0;
  // La capa se ajusta al lado del lienzo para que la geometría entre
  // completa al rotar (no se corta contra los bordes).
  const layerSize = canvasSide * 0.96;
  // El orden de las capas del lienzo sigue el orden de `active` (= orden de las
  // cards): la PRIMERA card es la capa más atrás (se pinta primero), la última
  // queda al frente. Reordenar las cards (drag) reordena las capas.
  // Cada capa activa es una INSTANCIA (`iid`): puede haber varias del mismo tipo
  // (duplicados). `geo` es la metadata base (glifo, nombre) resuelta vía `baseOf`.
  // Mapa rápido del catálogo del servidor (tiene strokeMode, color, etc.)
  // Fallback: getGeometry con metadata estática (sin overrides).
  const catalogGeoMap = useMemo(
    () => new Map(catalogGeometries.map((g) => [g.id, g])),
    [catalogGeometries],
  );
  const activeMetas: { iid: string; geo: GeometryMeta }[] = active
    .map((iid) => {
      const base = baseOf(iid);
      const geo = (catalogGeoMap.get(base) ?? getGeometry(base)) as GeometryMeta | undefined;
      return geo ? { iid, geo } : null;
    })
    .filter((m): m is { iid: string; geo: GeometryMeta } => m !== null);
  const hasActive = activeMetas.length > 0;
  // Al vaciarse el lienzo, reseteamos la "primera tanda" para que la próxima
  // vez que se pueble vuelva a entrar escalonada de izquierda a derecha.
  useEffect(() => {
    if (activeMetas.length === 0) thumbsInitialIdsRef.current = null;
  }, [activeMetas.length]);
  // En el primer render con thumbnails, fijamos qué ids forman la tanda inicial.
  if (thumbsInitialIdsRef.current === null && activeMetas.length > 0) {
    thumbsInitialIdsRef.current = new Set(activeMetas.map((m) => m.iid));
  }
  // Posición + aparición de la lupa (todo en el hilo UI para que sea fluido).
  const loupeWrapStyle = useAnimatedStyle(() => ({
    opacity: loupeReveal.value,
    transform: [
      { translateX: loupeX.value - LOUPE_SIZE / 2 },
      { translateY: loupeY.value - LOUPE_SIZE - 28 },
      { scale: 0.55 + loupeReveal.value * 0.45 },
    ],
  }));
  useEffect(() => {
    loupeReveal.value = withTiming(loupeVisible ? 1 : 0, {
      duration: loupeVisible ? 200 : 150,
      easing: Easing.out(Easing.ease),
    });
  }, [loupeVisible, loupeReveal]);

  // Aleatoriza los ajustes visuales de todas las capas activas.
  // Preserva las transformaciones de gesto (zoom, manualAngle, offsetX, offsetY, scale).
  // El estado anterior se guarda en la pila de deshacer (Atrás).
  const randomizeSettings = useCallback(() => {
    if (active.length === 0) return;
    if (prevCompRef.current) {
      undoStackRef.current.push(prevCompRef.current);
      if (undoStackRef.current.length > HISTORY_LIMIT) undoStackRef.current.shift();
      setCanUndo(true);
      redoStackRef.current = [];
      setCanRedo(false);
    }
    const rnd  = () => Math.random();
    const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(rnd() * arr.length)];
    const maybe = (prob: number, lo: number, hi: number) =>
      rnd() < prob ? lo + rnd() * (hi - lo) : 0;
    const gradIds = STROKE_GRADIENTS.map((g) => g.id);
    setSettings((prev) => {
      const next = { ...prev };
      for (const iid of active) {
        const cur = next[iid] ?? defaultSettings(baseOf(iid));
        const rotRoll = rnd();
        next[iid] = {
          ...cur,
          color:           pick(PALETTE),
          gradientId:      rnd() < 0.35 ? pick(gradIds) : null,
          saturation:      0.35 + rnd() * 0.30,
          rotate:          rotRoll < 0.40,
          rotateLeft:      rotRoll >= 0.40 && rotRoll < 0.60,
          opacity:         0.65 + rnd() * 0.35,
          glow:            rnd() * 0.55,
          thickness:       maybe(0.22, 0.0, 0.10),
          breatheAmount:   maybe(0.50, 0.1, 0.70),
          fadeLoopAmount:  maybe(0.25, 0.1, 0.50),
          bloom:           maybe(0.25, 0.1, 0.55),
          halo:            maybe(0.30, 0.1, 0.65),
          ripple:          maybe(0.25, 0.1, 0.50),
          expansionAmount: maybe(0.25, 0.1, 0.55),
          kaleidoscope:    false,
          kaleidSegments:  cur.kaleidSegments,
          // Transformaciones de gesto: intactas
          scale:       cur.scale,
          zoom:        cur.zoom,
          manualAngle: cur.manualAngle,
          offsetX:     cur.offsetX,
          offsetY:     cur.offsetY,
        };
      }
      return next;
    });
  }, [active]);

  // Acciones de la píldora desplegable (flecha bajo la divisora). Solo iconos.
  // `divider: true` dibuja una línea sutil ANTES del ítem (separadores de grupo).
  const pillActions: { key: string; icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void; gradient?: boolean; color?: string; divider?: boolean }[] = [
    { key: "audio", icon: "volume-2", label: "Audio de fondo", onPress: () => { if (themeSession) stopTheme(); else setThemeSearchOpen(true); } },
    { key: "general", icon: "sliders", label: "Ajustes", onPress: () => setGeneralOpen(true) },
    { key: "save", icon: "save", label: "Guardar", onPress: saveComposition },
    { key: "immersive", icon: "maximize", label: "Pantalla inmersiva", onPress: () => setImmersive(true), divider: true },
    { key: "fullscreen-edit", icon: "edit-2", label: "Lienzo expandido", onPress: () => setFullscreenEdit(true) },
    { key: "guias", icon: "crosshair", label: "Guías", onPress: () => setGuidesOpen(true) },
    { key: "randomize", icon: "shuffle", label: "Aleatorizar", onPress: randomizeSettings, divider: true },
    { key: "borrar", icon: "trash-2", label: "Borrar", onPress: clearCanvas },
  ];
  // Sin geometrías activas se colapsa el desplegable; si el menú está oculto
  // se mantiene para que el usuario siempre pueda restaurarlo con la X.
  useEffect(() => {
    if (!hasActive && !menuHidden) setPillOpen(false);
  }, [hasActive, menuHidden]);
  // Lo que se pinta en el lienzo: todas las activas menos las ocultas.
  const visibleMetas = hiddenIds.length
    ? activeMetas.filter((m) => !hiddenIds.includes(m.iid))
    : activeMetas;
  const menuGeo = menuGeoId
    ? getGeometry(baseOf(menuGeoId))
    : undefined;
  // Geometría que muestra el panel por capa (solo si sigue activa).
  const settingsGeo =
    settingsGeoId && active.includes(settingsGeoId)
      ? getGeometry(baseOf(settingsGeoId))
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

  // Efecto 3: historial de "Atrás". Cada cambio del lienzo empuja (con debounce)
  // el estado PREVIO a la pila. Una ráfaga (p. ej. arrastrar un slider) cuenta
  // como un solo paso: se recuerda la base al iniciar la ráfaga y se confirma al
  // asentarse. Un cambio causado por el propio "Atrás" no se vuelve a grabar.
  useEffect(() => {
    const current: CompSnapshot = { active, settings, master, hiddenIds };
    if (isUndoingRef.current) {
      isUndoingRef.current = false;
      prevCompRef.current = current;
      return;
    }
    if (isRedoingRef.current) {
      isRedoingRef.current = false;
      prevCompRef.current = current;
      return;
    }
    // Primer render (o justo tras cargar/nueva): fijar baseline sin grabar.
    if (prevCompRef.current === null) {
      prevCompRef.current = current;
      return;
    }
    // Cualquier cambio manual limpia la pila de redo.
    if (redoStackRef.current.length > 0) {
      redoStackRef.current = [];
      setCanRedo(false);
    }
    // Inicio de una ráfaga: recordar el estado anterior al primer cambio.
    if (burstBaseRef.current === null) burstBaseRef.current = prevCompRef.current;
    prevCompRef.current = current;
    if (historyTimerRef.current) clearTimeout(historyTimerRef.current);
    historyTimerRef.current = setTimeout(() => {
      historyTimerRef.current = null;
      if (burstBaseRef.current === null) return;
      undoStackRef.current.push(burstBaseRef.current);
      if (undoStackRef.current.length > HISTORY_LIMIT) undoStackRef.current.shift();
      burstBaseRef.current = null;
      setCanUndo(true);
    }, HISTORY_DEBOUNCE_MS);
    return () => {
      if (historyTimerRef.current) clearTimeout(historyTimerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, settings, master, hiddenIds]);

  // Restaura el último estado guardado. Antes confirma cualquier ráfaga pendiente
  // (para deshacer un cambio en curso) y luego saca el tope de la pila.
  const undo = useCallback(() => {
    // Confirmar una ráfaga aún sin asentar (su timer todavía no disparó).
    if (historyTimerRef.current) {
      clearTimeout(historyTimerRef.current);
      historyTimerRef.current = null;
    }
    if (burstBaseRef.current !== null) {
      undoStackRef.current.push(burstBaseRef.current);
      if (undoStackRef.current.length > HISTORY_LIMIT) undoStackRef.current.shift();
      burstBaseRef.current = null;
    }
    const snap = undoStackRef.current.pop();
    if (!snap) {
      setCanUndo(false);
      return;
    }
    // Guardar estado actual en redo antes de restaurar.
    if (prevCompRef.current) {
      redoStackRef.current.push(prevCompRef.current);
      if (redoStackRef.current.length > HISTORY_LIMIT) redoStackRef.current.shift();
      setCanRedo(true);
    }
    isUndoingRef.current = true;
    setActive(snap.active);
    setSettings(snap.settings);
    setMaster(snap.master);
    setHiddenIds(snap.hiddenIds);
    setSelectedId(snap.active.length ? snap.active[snap.active.length - 1] : null);
    setCanUndo(undoStackRef.current.length > 0);
  }, []);

  const redo = useCallback(() => {
    const snap = redoStackRef.current.pop();
    if (!snap) {
      setCanRedo(false);
      return;
    }
    // Guardar estado actual en undo antes de avanzar.
    if (prevCompRef.current) {
      undoStackRef.current.push(prevCompRef.current);
      if (undoStackRef.current.length > HISTORY_LIMIT) undoStackRef.current.shift();
      setCanUndo(true);
    }
    isRedoingRef.current = true;
    setActive(snap.active);
    setSettings(snap.settings);
    setMaster(snap.master);
    setHiddenIds(snap.hiddenIds);
    setSelectedId(snap.active.length ? snap.active[snap.active.length - 1] : null);
    setCanRedo(redoStackRef.current.length > 0);
  }, []);

  // Si una geometría se quita, limpiar su aislamiento / menú abierto y
  // reasignar la selección del pellizco a otra activa (o ninguna).
  useEffect(() => {
    // Mantener la MISMA referencia si nada cambió: así no dispara un paso de
    // historial extra (la pila de "Atrás" vigila hiddenIds).
    setHiddenIds((prev) => {
      const next = prev.filter((id) => active.includes(id));
      return next.length === prev.length ? prev : next;
    });
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

  // Al cerrar el panel de ajustes, descongelar el alto para que vuelva a
  // medirse (colapsado) la próxima vez que se abra.
  useEffect(() => {
    if (settingsGeoId == null) setFrozenSheetH(null);
  }, [settingsGeoId]);

  // Mismo descongelado al cerrar el panel de ajustes generales.
  useEffect(() => {
    if (!generalOpen) setFrozenGeneralSheetH(null);
  }, [generalOpen]);

  // Geometría que responde al pellizco: la seleccionada, o la última activa.
  const pinchTargetId =
    selectedId && active.includes(selectedId)
      ? selectedId
      : active.length
        ? active[active.length - 1]
        : null;

  // El color cardinal (pillCardinalSV) lo escribe ÚNICAMENTE la reacción del UI
  // thread (ver más abajo), que lee liveRot y rotHasTargetSV. Al cambiar de
  // objetivo o tras un commit, el useEffect de sync actualiza liveRot y la
  // reacción reconcilia el color con el ángulo confirmado (umbral exacto 0.5°).

  // Settings confirmados del objetivo activo (una sola lectura). De aquí salen
  // los ESCALARES que usan los effects de sync como deps. CLAVE: los effects
  // dependen del valor concreto (zoom/offset/manualAngle), NO de `getSettings`.
  // `getSettings` es useCallback([settings]) → su referencia cambia con CUALQUIER
  // mutación de settings; y como pinch/rotación/drag comparten Gesture.Simultaneous,
  // al soltar dos dedos el onEnd del pinch siempre commitea zoom → setSettings →
  // si el effect dependiera de getSettings se dispararía y pisaría el gesto en
  // vuelo leyendo un valor VIEJO (el commit del otro gesto puede no estar aplicado
  // en ese render) → "gira/cambia y vuelve". Ver geometrix-rotation-sync-effect.
  const pinchTargetSettings = pinchTargetId ? getSettings(pinchTargetId) : null;
  const targetZoom = pinchTargetSettings?.zoom ?? 1;
  const targetOffsetX = pinchTargetSettings?.offsetX ?? 0;
  const targetOffsetY = pinchTargetSettings?.offsetY ?? 0;
  const targetManualAngle = pinchTargetSettings?.manualAngle ?? 0;

  // Mantener el zoom en vivo sincronizado con el valor confirmado del objetivo
  // (al cambiar de geometría o tras confirmar un pellizco).
  useEffect(() => {
    livePinch.value = targetZoom;
    // El valor confirmado ya está sincronizado (tras commit o cambio de
    // objetivo) → desactivar el escalado en vivo: la capa muestra su tamaño
    // confirmado vía `size` (effectiveSize), sin depender de `livePinch`.
    pinchActive.value = 0;
  }, [pinchTargetId, targetZoom, livePinch, pinchActive]);

  // Sincronizar liveDragX/Y con el offset confirmado del objetivo cuando cambia.
  // Así el onStart del panGesture (worklet, hilo UI) puede leer liveDragX/Y
  // directamente sin llamar a getSettings (función JS, no worklet).
  useEffect(() => {
    liveDragX.value = targetOffsetX;
    liveDragY.value = targetOffsetY;
    // Tras el commit del drag (o al cambiar de objetivo) el offset confirmado ya
    // está sincronizado → apagar el gate: la capa usa committedX/Y (sin "pop").
    dragActive.value = 0;
  }, [pinchTargetId, targetOffsetX, targetOffsetY, liveDragX, liveDragY, dragActive]);

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

    // Centroide del grupo para snap en hold mode (promedio de todos los offsets).
    if (active.length > 0) {
      let sumX = 0, sumY = 0;
      active.forEach((id) => {
        const s = getSettings(id);
        sumX += s.offsetX ?? 0;
        sumY += s.offsetY ?? 0;
      });
      holdCentroidX.value = sumX / active.length;
      holdCentroidY.value = sumY / active.length;
    } else {
      holdCentroidX.value = 0;
      holdCentroidY.value = 0;
    }
  }, [pinchTargetId, active, settings, getSettings, snapTargets, holdCentroidX, holdCentroidY, guides, canvasSide]);

  // Gesto de pellizco: escala libre del objetivo (o todas en Hold mode).
  const pinchGesture = Gesture.Pinch()
    .onStart(() => {
      isPinching.value = true;
      isLoupeActive.value = false;
      runOnJS(setLoupeVisible)(false);
      if (holdModeSV.value === 1) {
        holdScaleSV.value = 1;
        holdScaleActive.value = 1;
      } else {
        pinchActive.value = 1;
        pinchStart.value = livePinch.value;
      }
    })
    .onUpdate((e) => {
      if (holdModeSV.value === 1) {
        const s = e.scale;
        holdScaleSV.value = Number.isFinite(s) && s > 0 ? s : 1;
      } else {
        livePinch.value = Math.min(6, Math.max(0.1, pinchStart.value * e.scale));
      }
    })
    .onEnd(() => {
      if (holdModeSV.value === 1) {
        runOnJS(commitHoldZoom)(holdScaleSV.value);
      } else {
        if (pinchTargetId) runOnJS(commitZoom)(pinchTargetId, livePinch.value);
      }
    })
    .onFinalize((_e, success) => {
      isPinching.value = false;
      if (holdModeSV.value === 1) {
        // Los resets de holdScaleSV/holdScaleActive se hacen en commitHoldZoom
        // (hilo JS, mismo tick que setSettings) para evitar el flash de retroceso.
      } else if (!success) {
        livePinch.value = pinchStart.value;
        pinchActive.value = 0;
      }
    });

  // Mantener el dedo quieto sobre la geometría activa → aparece la lupa circular.
  // Corre simultáneamente con panGesture (el drag sigue funcionando mientras la
  // lupa está visible). isPinching evita que el pellizco active la lupa.
  const longPressGesture = Gesture.LongPress()
    .minDuration(380)
    .onStart((e) => {
      if (isPinching.value) return;
      isLoupeActive.value = true;
      // Reiniciar la baseline del drag para que cuando la lupa se cierre
      // la geometría no salte a una posición acumulada del gesto previo.
      dragStartX.value = liveDragX.value;
      dragStartY.value = liveDragY.value;
      loupeX.value = e.x;
      loupeY.value = e.y;
      runOnJS(setLoupeGeoId)(pinchTargetId);
      runOnJS(setLoupeVisible)(true);
    })
    .onFinalize(() => {
      isLoupeActive.value = false;
      runOnJS(setLoupeVisible)(false);
    });

  // Solo se permite rotar con los dedos cuando el objetivo NO tiene giro
  // automático activado (ni derecha ni izquierda). Con giro activo, el gesto
  // queda deshabilitado.
  const canManualRotate =
    !!pinchTargetSettings && !pinchTargetSettings.rotate && !pinchTargetSettings.rotateLeft;

  // Mantener el ángulo en vivo sincronizado con el confirmado del objetivo
  // (al cambiar de geometría o tras confirmar una rotación).
  //
  // CLAVE: la dep es `targetManualAngle` (escalar), NO `getSettings` (ver el
  // bloque de escalares más arriba). Así el effect SOLO corre cuando cambia el
  // ángulo confirmado de ESTE objetivo (swap atómico tras commitAngle) o cambia
  // la selección — los commits de zoom u otras geometrías ya no lo tocan, por lo
  // que el pinch simultáneo deja de pisar la rotación en vuelo.
  useEffect(() => {
    liveRot.value = targetManualAngle;
    // Avisar a la reacción cardinal si hay objetivo (apaga el color sin objetivo).
    rotHasTargetSV.value = pinchTargetId ? 1 : 0;
    // Tras el commit del ángulo (o al cambiar de objetivo) el manualAngle ya está
    // sincronizado → apagar el gate: la capa usa su ángulo confirmado (sin "pop").
    rotActive.value = 0;
  }, [pinchTargetId, targetManualAngle, liveRot, rotActive, rotHasTargetSV]);

  // Limpiar el gate del indicador cardinal al cambiar de objetivo: sin esto la
  // píldora quedaría morada al seleccionar una geometría nueva cuyo ángulo
  // coincida con un cardinal (0°) sin que el usuario la haya girado nunca.
  useEffect(() => {
    rotDidRotate.value = 0;
    rotCardGuard.value = -1; // fuerza re-evaluación limpia con el nuevo objetivo
  }, [pinchTargetId, rotDidRotate, rotCardGuard]);

  // Gesto de rotación con dos dedos: gira el objetivo (o todas en Hold mode).
  const rotationGesture = Gesture.Rotation()
    .enabled(holdMode || canManualRotate)
    .onStart(() => {
      rotCardGuard.value = -1;
      rotSucceeded.value = false;
      if (holdModeSV.value === 1) {
        holdRotDeltaDeg.value = 0;
        holdRotActive.value = 1;
      } else {
        rotStart.value = liveRot.value;
        rotActive.value = 1;
        rotDidRotate.value = 1;
      }
    })
    .onUpdate((e) => {
      const deltaDeg = (e.rotation * 180) / Math.PI;
      if (!Number.isFinite(deltaDeg)) return;
      if (holdModeSV.value === 1) {
        holdRotDeltaDeg.value = deltaDeg;
      } else {
        const raw = rotStart.value + deltaDeg;
        if (!Number.isFinite(raw)) return;
        liveRot.value = raw;
      }
    })
    .onEnd(() => {
      rotSucceeded.value = true;
      if (holdModeSV.value === 1) {
        runOnJS(commitHoldAngle)(holdRotDeltaDeg.value);
      } else {
        if (pinchTargetId && Number.isFinite(liveRot.value)) {
          runOnJS(commitAngle)(pinchTargetId, liveRot.value);
        }
      }
    })
    .onFinalize(() => {
      if (holdModeSV.value === 1) {
        // Los resets de holdRotDeltaDeg/holdRotActive se hacen en commitHoldAngle
        // (hilo JS, mismo tick que setSettings) para evitar el flash de retroceso.
      } else if (!rotSucceeded.value) {
        liveRot.value = rotStart.value;
        rotActive.value = 0;
      }
    });

  // Gesto de drag (un solo dedo) para desplazar la geometría seleccionada
  // libremente por el lienzo. Al soltar, el nuevo offset queda confirmado en
  // settings. `minPointers(1).maxPointers(1)` evita conflictos con el pellizco
  // (dos dedos) y la rotación (dos dedos).
  const panGesture = Gesture.Pan()
    .minPointers(1)
    .maxPointers(1)
    .onStart(() => {
      if (isLoupeActive.value) return;
      if (holdModeSV.value === 1) {
        holdDragDeltaX.value = 0;
        holdDragDeltaY.value = 0;
        holdDragActive.value = 1;
      } else {
        dragStartX.value = liveDragX.value;
        dragStartY.value = liveDragY.value;
        dragActive.value = 1;
      }
    })
    .onUpdate((e) => {
      if (isLoupeActive.value) {
        loupeX.value = e.x;
        loupeY.value = e.y;
        return;
      }
      if (holdModeSV.value === 1) {
        // Snap al centro del lienzo (0,0) basado en el centroide del grupo.
        const SNAP = 8;
        let dx = e.translationX;
        let dy = e.translationY;
        const newCx = holdCentroidX.value + e.translationX;
        const newCy = holdCentroidY.value + e.translationY;
        if (Math.abs(newCx) < SNAP) {
          dx = -holdCentroidX.value;
          snapXSV.value = 0;
          snapXOn.value = 1;
        } else {
          snapXOn.value = 0;
        }
        if (Math.abs(newCy) < SNAP) {
          dy = -holdCentroidY.value;
          snapYSV.value = 0;
          snapYOn.value = 1;
        } else {
          snapYOn.value = 0;
        }
        holdDragDeltaX.value = dx;
        holdDragDeltaY.value = dy;
        return;
      }
      if (!pinchTargetId) return;
      let rx = dragStartX.value + e.translationX;
      let ry = dragStartY.value + e.translationY;

      // ── Snap a centros ─────────────────────────────────────────────────────
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
      if (sx !== null) { snapXSV.value = sx; snapXOn.value = 1; } else { snapXOn.value = 0; }
      if (sy !== null) { snapYSV.value = sy; snapYOn.value = 1; } else { snapYOn.value = 0; }
    })
    .onEnd(() => {
      if (holdModeSV.value === 1) {
        runOnJS(commitHoldOffset)(holdDragDeltaX.value, holdDragDeltaY.value);
      } else if (pinchTargetId) {
        runOnJS(commitOffset)(pinchTargetId, liveDragX.value, liveDragY.value);
      }
    })
    .onFinalize((_e, success) => {
      snapXOn.value = 0;
      snapYOn.value = 0;
      if (holdModeSV.value === 1) {
        // Los resets de holdDragDeltaX/Y/holdDragActive se hacen en commitHoldOffset
        // (hilo JS, mismo tick que setSettings) para evitar el flash de retroceso.
      } else if (!success) {
        liveDragX.value = dragStartX.value;
        liveDragY.value = dragStartY.value;
        dragActive.value = 0;
      }
    });

  // Pellizco, rotación y drag corren a la vez sobre el objetivo seleccionado.
  const canvasGesture = Gesture.Simultaneous(longPressGesture, pinchGesture, rotationGesture, panGesture);

  // Limpia TODO el estado de gestos al salir del fullscreen.
  // El View overlay se desmonta antes de que RNGH dispare onFinalize → los
  // shared values quedan sucios y bloquean el primer toque en el lienzo normal.
  const exitFullscreen = useCallback(() => {
    dragActive.value = 0;
    pinchActive.value = 0;
    isPinching.value = false;
    isLoupeActive.value = false;
    holdDragActive.value = 0;
    rotActive.value = 0;
    snapXOn.value = 0;
    snapYOn.value = 0;
    setLoupeVisible(false);
    setFullscreenEdit(false);
    setGestureKey((k) => k + 1);
  }, [dragActive, pinchActive, isPinching, isLoupeActive, holdDragActive, rotActive, snapXOn, snapYOn]);

  // Botón Atrás de Android cierra el fullscreen si está abierto.
  useEffect(() => {
    if (!fullscreenEdit) return;
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      exitFullscreen();
      return true;
    });
    return () => sub.remove();
  }, [fullscreenEdit, exitFullscreen]);

  // Indicador de ángulo cardinal, 100% en el UI thread (sin runOnJS ni estado
  // React por frame → sin microlag). ÚNICO escritor de pillCardinalSV: durante
  // el giro usa una zona amplia (8°) como "pista"; en reposo (tras commit,
  // cancelación o cambio de objetivo, cuando liveRot ya refleja el ángulo
  // confirmado) exige el cardinal exacto (0.5°). El guard evita reiniciar el
  // withTiming en cada frame: solo anima al CRUZAR el umbral.
  useAnimatedReaction(
    // guard se incluye en el selector para que, cuando Effect 2 lo ponga a -1
    // al cambiar de objetivo, la reacción se dispare aunque angle/has/active
    // no hayan cambiado (ej: dos geometrías distintas ambas a 0°). Así la
    // píldora siempre se reconcilia con el nuevo objetivo.
    // holdActive/holdDelta añadidos para que la reacción se dispare también
    // frame a frame durante la rotación en hold mode.
    () => ({
      active: rotActive.value,
      angle: liveRot.value,
      has: rotHasTargetSV.value,
      guard: rotCardGuard.value,
      holdActive: holdRotActive.value,
      holdDelta: holdRotDeltaDeg.value,
    }),
    ({ active, angle, has, holdActive, holdDelta }) => {
      "worklet";
      let isCard = 0;
      // En hold mode, el ángulo efectivo es la base (liveRot) + el delta en curso.
      const isHold = holdActive > 0;
      const effectiveAngle = isHold ? angle + holdDelta : angle;
      const effectiveActive = active + holdActive;
      // Solo activar el cardinal si el usuario REALMENTE rotó en este objetivo
      // (rotDidRotate se pone a 1 en onStart del gesto normal) o si está en
      // hold mode (siempre que haya un objetivo activo).
      if (has > 0 && (rotDidRotate.value > 0 || isHold)) {
        const nearest90 = Math.round(effectiveAngle / 90) * 90;
        // Umbral fijo 0.5°: la píldora solo vira al llegar al cardinal exacto.
        const thresh = 0.5;
        isCard = Math.abs(effectiveAngle - nearest90) < thresh ? 1 : 0;
      }
      if (isCard !== rotCardGuard.value) {
        rotCardGuard.value = isCard;
        pillCardinalSV.value = withTiming(isCard, { duration: effectiveActive > 0 ? 160 : 350 });
      }
    },
  );

  // Texto del badge (ángulo en vivo) sin re-render: animatedProps escribe el
  // texto del TextInput directamente en el UI thread. En hold mode lee
  // liveRot + holdRotDeltaDeg para reflejar el delta en curso frame a frame;
  // en rotación normal usa solo liveRot.
  const rotBadgeAngleProps = useAnimatedProps(() => {
    const angle =
      holdRotActive.value > 0
        ? liveRot.value + holdRotDeltaDeg.value
        : liveRot.value;
    return { text: `${Math.round(((angle % 360) + 360) % 360)}°` } as any;
  });

  // Líneas guía de snap: posición + visibilidad en el UI thread (shared values),
  // sin estado React por frame. canvasSide/2 + offset convierte offset de capa a
  // px del lienzo; opacity = on/off.
  const snapYLineStyle = useAnimatedStyle(() => ({
    opacity: snapYOn.value,
    transform: [{ translateY: canvasSide / 2 + snapYSV.value }],
  }));
  const snapXLineStyle = useAnimatedStyle(() => ({
    opacity: snapXOn.value,
    transform: [{ translateX: canvasSide / 2 + snapXSV.value }],
  }));
  // Versiones fullscreen: parten de top:0/left:0 y usan el centro de pantalla.
  const snapYLineStyleFS = useAnimatedStyle(() => ({
    opacity: snapYOn.value,
    transform: [{ translateY: height / 2 + snapYSV.value }],
  }));
  const snapXLineStyleFS = useAnimatedStyle(() => ({
    opacity: snapXOn.value,
    transform: [{ translateX: width / 2 + snapXSV.value }],
  }));

  // Badge flotante: ícono + ángulo actual; fade rápido al entrar/salir del giro.
  // El fondo y el borde viran a azul/dorado al llegar a un ángulo cardinal
  // (misma regla que la píldora, pero visible durante el giro). UI thread.
  const rotBadgeStyle = useAnimatedStyle(() => ({
    opacity: withTiming(Math.max(rotActive.value, holdRotActive.value), { duration: 120 }),
    backgroundColor: interpolateColor(
      pillCardinalSV.value,
      [0, 1],
      ["rgba(0,0,0,0.58)", "#171e5a"],
    ),
    borderColor: interpolateColor(
      pillCardinalSV.value,
      [0, 1],
      ["rgba(255,255,255,0.12)", "#F9F9F9"],
    ),
  }));
  // Píldora de acciones: fondo azul (#171e5a) al llegar a ángulo cardinal.
  const pillCardinalStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(
      pillCardinalSV.value,
      [0, 1],
      ["rgba(255,255,255,0.02)", "#171e5a"],
    ),
    borderColor: interpolateColor(
      pillCardinalSV.value,
      [0, 1],
      [CARD_BORDER, "#3B2080"],
    ),
  }));

  // Glow blanco del icono de audio: sombra difusa que respira cuando suena.
  const themeGlowStyle = useAnimatedStyle(() => ({
    shadowColor: "#FFFFFF",
    shadowRadius: 10,
    shadowOpacity: 0.65 * themeGlow.value,
    shadowOffset: { width: 0, height: 0 },
  }));

  // Vista previa: cuadrado lo más grande posible, anclado a 50 px del top
  // y llegando hasta el sheet de ajustes (medido). Resta 24 px para la etiqueta
  // "Vista previa" + gap.
  const previewSize = sheetHeight
    ? Math.max(96, Math.min(width - 32, height - sheetHeight - 74))
    : 0;
  // Vista previa del panel general: misma fórmula.
  const generalPreviewSize = generalSheetHeight
    ? Math.max(96, Math.min(width - 32, height - generalSheetHeight - 74))
    : 0;
  // En inmersión la geometría llena la pantalla, centrada.
  const immersiveSize = Math.min(width, height) * 0.96;

  // Color del fondo del lienzo (lienzo, vista previa e inmersión). Es el
  // degradado seleccionado o, por defecto, el de Inicio; ambos modulados por
  // el slider de brillo de Ajustes generales.
  const { theme: sceneTheme } = useSceneTheme();
  const bgFactor = brightnessFactor(master.bgBrightness);
  const selectedBg = master.bgColor
    ? ([master.bgColor, master.bgColor] as string[])
    : bgGradientColors(master.bgGradientId);
  // Un solo degradado para toda la pantalla (landing + lienzo). Default según
  // tema activo: Índigo usa el mismo degradado del Inicio de ese tema; los
  // demás mantienen el degradado fijo tipo Tibet (pedido del usuario).
  const themeDefaultBg: [string, string, ...string[]] =
    sceneTheme.id === "indigo"
      ? ([...sceneTheme.gradient] as [string, string, ...string[]])
      : (["#2D1C52", "#261F57", "#1F255A", "#1F2A62"] as [string, string, ...string[]]);
  const canvasBgColors: [string, string, ...string[]] = selectedBg
    ? (scaleColors(selectedBg, bgFactor) as [string, string, ...string[]])
    : themeDefaultBg;
  // locations=undefined → LinearGradient distribuye stops de forma uniforme (válido para 2 ó 4 stops).
  const canvasBgLocations = undefined;


  // Fondo de los sheets que responde al tono del degradado seleccionado.
  const sheetBgColor = useMemo(() => {
    if (master.bgGradientId) {
      const cols = bgGradientColors(master.bgGradientId);
      return cols ? scaleHex(cols[0], 0.55) : "#060d1f";
    }
    if (master.bgColor) return scaleHex(master.bgColor, 0.25);
    return "#060d1f";
  }, [master.bgGradientId, master.bgColor]);

  return (
    <View style={[styles.root, { backgroundColor: canvasBgColors[canvasBgColors.length - 1] as string }]}>
      {/* Fondo único — cubre header y lienzo sin costura */}
      <LinearGradient
        colors={canvasBgColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />
      {/* Oculta la barra de estado en pantalla completa (View absoluto, no Modal). */}
      <StatusBar hidden translucent />

      <View style={styles.content}>
        {/* ── Zona superior: header + carrusel ── */}
        <View style={[styles.topPanel, { paddingTop: insets.top + 4 }]}>
        {/* ── Buscador de tema de fondo (audio propio de Geometrix) ── */}
        <Modal
          visible={themeSearchOpen}
          transparent
          animationType="fade"
          statusBarTranslucent
          onRequestClose={() => setThemeSearchOpen(false)}
        >
          <Pressable
            style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.6)" }]}
            onPress={() => setThemeSearchOpen(false)}
          />
          <View style={[styles.themeSheet, { paddingTop: insets.top + 16 }]}>
            <View style={styles.themeHeaderRow}>
              <Text style={styles.themeTitle}>Tu tema de fondo</Text>
              <Pressable onPress={() => setThemeSearchOpen(false)} hitSlop={10}>
                <Feather name="x" size={22} color={colors.mutedForeground} />
              </Pressable>
            </View>
            <Text style={styles.themeSub}>
              Elegí una sesión o música para que suene mientras creás. Suena solo aquí, en Geometrix.
            </Text>

            <View style={styles.themeSearchBar}>
              <Feather name="search" size={16} color={colors.mutedForeground} />
              <TextInput
                value={themeQuery}
                onChangeText={setThemeQuery}
                placeholder="Buscar sesiones, músicas, sonidos..."
                placeholderTextColor={colors.mutedForeground}
                style={styles.themeSearchInput}
                autoFocus
              />
              {themeQuery.length > 0 ? (
                <Pressable onPress={() => setThemeQuery("")} hitSlop={8}>
                  <Feather name="x" size={16} color={colors.mutedForeground} />
                </Pressable>
              ) : null}
            </View>

            {themeSession ? (
              <Pressable style={styles.themeStopRow} onPress={stopTheme}>
                <View style={styles.themeRowIcon}>
                  <Feather name="volume-x" size={16} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.themeRowTitle} numberOfLines={1}>
                    Sonando: {themeSession.title}
                  </Text>
                  <Text style={styles.themeRowSub}>Tocá para silenciar</Text>
                </View>
              </Pressable>
            ) : null}

            <ScrollView
              style={styles.themeResults}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {themeQuery.trim().length === 0 ? (
                <Text style={styles.themeHint}>Escribí para buscar en toda la biblioteca.</Text>
              ) : themeResults.length === 0 ? (
                <Text style={styles.themeHint}>Sin resultados. Probá con otro término.</Text>
              ) : (
                themeResults.map((s) => {
                  const isCurrent = themeSession?.id === s.id;
                  return (
                    <Pressable
                      key={s.id}
                      style={[styles.themeRow, isCurrent ? styles.themeRowOn : null]}
                      onPress={() => playTheme(s)}
                    >
                      <View style={styles.themeRowIcon}>
                        {isCurrent ? (
                          <AnimatedSpeaker size={16} color={colors.primary} />
                        ) : (
                          <Feather name="music" size={16} color={colors.mutedForeground} />
                        )}
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.themeRowTitle} numberOfLines={1}>
                          {s.title}
                        </Text>
                        <Text style={styles.themeRowSub} numberOfLines={1}>
                          {s.categoryLabel}
                        </Text>
                      </View>
                      {isCurrent && (
                        <Pressable
                          style={styles.themeSelectBtn}
                          onPress={() => setThemeSearchOpen(false)}
                          hitSlop={6}
                          accessibilityRole="button"
                          accessibilityLabel="Seleccionar este tema de fondo"
                        >
                          <Text style={styles.themeSelectBtnText}>Seleccionar</Text>
                        </Pressable>
                      )}
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </View>
        </Modal>

        {/* Tab de categorías + cierre destructivo del lienzo */}
        <View style={styles.catRow}>
          {/* Título centrado, a la altura del botón de cierre. */}
          <View pointerEvents="none" style={styles.lienzoTitleWrap}>
            <Text style={[styles.lienzoTitle, { transform: [{ translateY: 15 }] }]}>Lienzo</Text>
          </View>
          <View style={styles.exitBtn}>
            <Pressable
              style={styles.canvasCloseBtn}
              onPress={() => setCloseConfirmOpen(true)}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Cerrar y descartar el lienzo"
              accessibilityHint="Pide confirmación antes de perder los cambios no guardados"
            >
              <Feather name="x" size={22} color={colors.foreground} />
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.catScroll}
            contentContainerStyle={styles.catScrollContent}
          >
            {GEOMETRY_CATEGORIES.map((c) => {
              const on = activeCategory === c.id;
              return (
                <Pressable
                  key={c.id}
                  onPress={() => setActiveCategory(c.id)}
                  style={[styles.catChip, sceneTheme.id === "indigo" ? styles.catChipIndigo : null, { borderColor: getSceneTabSurface(sceneTheme.id) }]}
                  accessibilityRole="button"
                  accessibilityState={{ selected: on }}
                  accessibilityLabel={`Filtrar geometrías: ${c.label}`}
                >
                  {on && (
                    <LinearGradient
                      colors={sceneTheme.id === "indigo" ? ["#784576", "#50326E"] : ["#FFFFFF", "#F5F5F5"]}
                      start={{ x: 0, y: 0.5 }}
                      end={{ x: 1, y: 0.5 }}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  <Text style={[styles.catChipText, on ? styles.catChipTextOn : null, on && sceneTheme.id === "indigo" ? styles.catChipTextIndigoOn : null]} numberOfLines={1}>
                    {c.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        <GeometrixCarousel
          active={active}
          effActivating={effActivating}
          orderSV={orderSV}
          instantOrderFlag={instantOrderFlag}
          draggingId={draggingId}
          activeCategory={activeCategory}
          onCategoryChange={setActiveCategory}
          toggleGeometry={toggleGeometry}
          handleDragStart={handleDragStart}
          commitReorder={commitReorder}
          getSettings={getSettings}
          catalogGeometries={catalogGeometries}
          tabFocused={tabFocused}
        />
        <View style={styles.carouselDivider} />

        </View>

        {/* Fondo interactivo: animación centrada en el espacio entre la
            divisora y la tab bar. paddingBottom despeja la tab bar para que el
            lienzo no se recorte. */}
        <View style={[styles.canvasWrap, { paddingBottom: bottomReserve }]}>
          {/* Patrón decorativo — el fondo lo provee el LinearGradient raíz */}
          {master.bgPattern && (
            <View pointerEvents="none" style={styles.canvasBgLayer}>
              <GeometrixPatternBg
                geoId={master.bgPattern.geoId}
                opacity={master.bgPattern.opacity}
                tileSize={master.bgPattern.tileSize}
                spacing={master.bgPattern.spacing}
                color={colors.primary}
              />
            </View>
          )}
          {/* Caja de clip independiente del transform del stage.
              - marginHorizontal:-20 → extiende hasta el borde de pantalla (cancela el paddingH del content)
              - overflow:hidden sin translateY → el clip superior cae exactamente en la divisora
              - marginBottom negativo → extiende el clip hacia abajo, detrás de los thumbnails,
                y corta ~10 px antes de llegar a ellos */}
          <View style={[styles.stageClip, { marginBottom: -(10 + Math.round(bottomPb / 2)) }]}>
          {/* Escenario: centra la animación en el espacio del lienzo. */}
          <View
            style={styles.stage}
            onLayout={(e) => {
              const { width: w, height: h } = e.nativeEvent.layout;
              setCanvas((prev) => (prev.w === w && prev.h === h ? prev : { w, h }));
            }}
          >
            {canvasSide > 0 && !fullscreenEdit && (
              // GestureDetector solo montado cuando el canvas normal está activo.
              // El Modal fullscreen desmonta sus hijos cuando visible=false → nunca
              // hay dos GestureDetectors con el mismo canvasGesture a la vez.
              // exitFullscreen() limpia todos los shared values antes de cerrar.
              <GestureDetector key={gestureKey} gesture={canvasGesture}>
                <View
                  style={[styles.canvas, { width: canvasSide, height: canvasSide }]}
                >
                {layerSize > 0 &&
                  visibleMetas.map((m, i) => {
                    const { iid, geo: g } = m;
                    const s = getStableSettings(iid);
                    const isTarget = iid === pinchTargetId;
                    return (
                      // CanvasLayer aplica el desplazamiento (drag) en el UI thread
                      // vía useAnimatedStyle (sin re-render por frame). Salida en
                      // fade out al deseleccionar; la entrada la maneja el `enter`
                      // interno de GeometryLayer.
                      <CanvasLayer
                        key={iid}
                        isTarget={isTarget}
                        committedX={s.offsetX ?? 0}
                        committedY={s.offsetY ?? 0}
                        liveDragX={liveDragX}
                        liveDragY={liveDragY}
                        dragActive={dragActive}
                        geo={g}
                        index={i}
                        size={layerSize}
                        settings={s}
                        liveZoomSV={isTarget ? livePinch : undefined}
                        pinchActiveSV={pinchActive}
                        liveAngleSV={isTarget ? liveRot : undefined}
                        rotActiveSV={rotActive}
                        holdModeSV={holdModeSV}
                        holdScaleSV={holdScaleSV}
                        holdScaleActive={holdScaleActive}
                        holdDragDeltaX={holdDragDeltaX}
                        holdDragDeltaY={holdDragDeltaY}
                        holdDragActive={holdDragActive}
                        holdRotDeltaDeg={holdRotDeltaDeg}
                        holdRotActive={holdRotActive}
                        masterOpacity={master.opacity}
                        motion={master.motion && tabFocused}
                        glow={master.glow}
                      />
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
                <Animated.View
                  pointerEvents="none"
                  style={[
                    {
                      position: "absolute",
                      left: 0, right: 0, top: 0,
                      height: 1,
                      backgroundColor: "#FF4B8D",
                    },
                    snapYLineStyle,
                  ]}
                />
                <Animated.View
                  pointerEvents="none"
                  style={[
                    {
                      position: "absolute",
                      top: 0, bottom: 0, left: 0,
                      width: 1,
                      backgroundColor: "#FF4B8D",
                    },
                    snapXLineStyle,
                  ]}
                />

                {/* ── Badge de rotación ────────────────────────────────────────
                    Ícono + ángulo actual visible solo mientras el usuario rota
                    (rotActive = 1). Aparece en la esquina superior derecha del
                    lienzo con fade; desaparece al soltar. */}
                <Animated.View
                  pointerEvents="none"
                  style={[styles.rotBadge, rotBadgeStyle]}
                >
                  <Feather name="rotate-cw" size={12} color="rgba(255,255,255,0.9)" />
                  <AnimatedTextInput
                    editable={false}
                    caretHidden
                    pointerEvents="none"
                    underlineColorAndroid="transparent"
                    style={styles.rotBadgeText}
                    animatedProps={rotBadgeAngleProps}
                  />
                </Animated.View>

                {/* ── Lupa de magnificación ───────────────────────────────────
                    Aparece al mantener el dedo sobre la geometría activa.
                    Muestra el glifo a LOUPE_M veces su tamaño actual, recortado
                    por un círculo dorado. pointerEvents="none" para no bloquear
                    los demás gestos. */}
                {loupeGeoId != null && layerSize > 0 && (() => {
                  const s = getSettings(loupeGeoId);
                  const glyphSize = layerSize * (s.zoom ?? 1) * LOUPE_M;
                  return (
                    <Animated.View
                      pointerEvents="none"
                      style={[styles.loupeWrap, loupeWrapStyle]}
                    >
                      {/* Contenido: glifo a máxima magnificación, clipeado por el círculo */}
                      <SacredGlyph
                        id={baseOf(loupeGeoId)}
                        color={s.color}
                        size={Math.min(glyphSize, LOUPE_SIZE * 3)}
                        strokeWidth={0.7}
                      />
                      {/* Reborde dorado interior encima del contenido */}
                      <View style={styles.loupeRim} pointerEvents="none" />
                    </Animated.View>
                  );
                })()}

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
                        source={require("@/assets/images/geometrix/cubo-4.png")}
                        style={styles.emptyLogo}
                        contentFit="contain"
                      />
                    </View>
                    <Text style={styles.emptyText}>Las geometrías animadas</Text>
                    <Text style={styles.emptySub}>Achícalas hasta el tamaño de los thumbnails</Text>
                  </Animated.View>
                )}
              </View>
            </GestureDetector>
          )}

          </View>
          </View>{/* /stageClip */}

          {/* Barra unificada: controles de edición (izq) + herramientas + ojo (der).
              Una sola fila plana; los iconos de herramientas hacen fade puro. */}
          <View pointerEvents="box-none" style={styles.actionBar}>
            {/* Izquierda: undo fijo, redo en absoluto debajo + actualizar al lado */}
            <View style={styles.actionBarLeft}>
              <View style={{ width: 38, height: 32 }}>
                {canUndo && (
                  <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(160)} style={styles.actionBarItem}>
                    <Pressable onPress={undo} style={styles.actionTopBtn} accessibilityRole="button" accessibilityLabel="Atrás (deshacer el último cambio)" hitSlop={4}>
                      <Feather name="corner-up-left" size={16} color={CANVAS_ICON} />
                    </Pressable>
                  </Animated.View>
                )}
                {canRedo && (
                  <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(160)} style={{ position: "absolute", top: 32, left: 0, right: 0 }}>
                    <Pressable onPress={redo} style={styles.actionTopBtn} accessibilityRole="button" accessibilityLabel="Adelantar (rehacer el último cambio)" hitSlop={4}>
                      <Feather name="corner-up-right" size={16} color={CANVAS_ICON} />
                    </Pressable>
                  </Animated.View>
                )}
              </View>
              {editingCreation && isDirty && (
                <Animated.View entering={FadeIn.duration(260)} exiting={FadeOut.duration(180)} style={styles.actionBarItem}>
                  <Pressable onPress={updateComposition} style={styles.actionTopBtn} accessibilityRole="button" accessibilityLabel="Actualizar composición" hitSlop={4}>
                    <Feather name="refresh-cw" size={16} color={CANVAS_ICON} />
                  </Pressable>
                </Animated.View>
              )}
            </View>
            {/* Derecha: herramientas en fade + ojo + hold (columna) */}
            <View style={styles.actionBarRight}>
              <Animated.View pointerEvents={pillOpen ? "auto" : "none"} style={[styles.actionBarFadeGroup, pillStyle]}>
                {pillActions.map((a) => (
                  <Pressable
                    key={a.key}
                    onPress={() => { a.onPress(); setPillOpen(false); }}
                    style={styles.actionTopBtn}
                    accessibilityRole="button"
                    accessibilityLabel={a.label}
                    hitSlop={4}
                  >
                    {a.gradient ? (
                      <GoldSlidersIcon size={16} />
                    ) : (
                      <Feather name={a.icon} size={16} color={a.color ?? CANVAS_ICON} />
                    )}
                  </Pressable>
                ))}
              </Animated.View>
              <View style={{ width: 38, height: 32 }}>
                <Pressable
                  onPress={() => setPillOpen((o) => !o)}
                  style={styles.actionTopBtn}
                  accessibilityRole="button"
                  accessibilityLabel={pillOpen ? "Ocultar herramientas" : "Mostrar herramientas"}
                  hitSlop={8}
                >
                  <Feather name={pillOpen ? "eye" : "eye-off"} size={16} color={CANVAS_ICON} />
                </Pressable>
                {active.length >= 2 && (
                  <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(160)} style={{ position: "absolute", top: 32, left: 0, right: 0 }}>
                    <Pressable
                      onPress={() => setHoldMode((v) => !v)}
                      style={styles.actionTopBtn}
                      accessibilityRole="button"
                      accessibilityLabel={holdMode ? "Desactivar modo Hold" : "Activar modo Hold (transforma todas las capas)"}
                      hitSlop={4}
                    >
                      <HandIcon size={16} color={holdMode ? colors.primary : CANVAS_ICON} />
                    </Pressable>
                  </Animated.View>
                )}
              </View>
            </View>
          </View>

          {/* Thumbnails de geometrías activas: fila centrada anclada justo sobre
              la línea redondeada para subir el menú; se reacomoda al
              agregar/quitar (LinearTransition). */}
          {activeMetas.length > 0 && (
            <ScrollView
              ref={thumbsScrollRef}
              horizontal
              showsHorizontalScrollIndicator={false}
              style={[styles.thumbsScroll, { bottom: bottomPb - 20 }]}
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
              {activeMetas.map((m, index) => {
                const { iid, geo: g } = m;
                const s = getStableSettings(iid);
                const isHidden = hiddenIds.includes(iid);
                const isSelected = pinchTargetId === iid;
                // Tanda inicial → escalonado izquierda→derecha; agregados luego → al instante.
                const enterDelay = thumbsInitialIdsRef.current?.has(iid)
                  ? (activeMetas.length - 1 - index) * 80
                  : 0;
                return (
                  <Animated.View
                    key={iid}
                    entering={FadeIn.duration(320).delay(enterDelay)}
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
                          setHiddenIds((prev) => prev.filter((id) => id !== iid));
                        } else {
                          setSelectedId(iid);
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
                    {/* Flechita: abre ajustes personalizados para esta geometría */}
                    <Pressable
                      onPress={() => {
                        setSettingsGeoId(iid);
                        setMenuGeoId(null);
                        setSettingsOpen(true);
                      }}
                      hitSlop={8}
                      style={styles.thumbChevronBtn}
                      accessibilityRole="button"
                      accessibilityLabel={`Ajustes de ${g.name}`}
                    >
                      <Feather name="chevron-right" size={11} color={s.color} />
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
            locations={canvasBgLocations}
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
            {visibleMetas.map((m, i) => (
              <GeometryLayer
                key={m.iid}
                geo={m.geo}
                index={i}
                size={immersiveSize}
                settings={getSettings(m.iid)}
                masterOpacity={master.opacity}
                motion={master.motion && tabFocused}
                glow={master.glow}
              />
            ))}
          </View>
        </Pressable>
      </Modal>

      {/* ── Lienzo expandido editable ────────────────────────────────────────────
          View absolutamente posicionado (NO Modal) para que el GestureDetector
          viva en el mismo árbol nativo que el canvas principal. Un Modal crea
          una ventana nativa separada (UIViewController en iOS) → RNGH pierde
          estado al cerrar y bloquea el lienzo. Con un View absoluto todo queda
          en el mismo contexto nativo y el GestureDetector funciona. */}
      {fullscreenEdit && (
        <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(180)} style={styles.fullscreenEditRoot}>
          {/* Fondo */}
          <LinearGradient
            colors={canvasBgColors}
            locations={canvasBgLocations}
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

          {/* Canvas interactivo: mismos gestos y SVs que el lienzo principal */}
          <GestureDetector gesture={canvasGesture}>
            <View style={StyleSheet.absoluteFill}>
              {immersiveSize > 0 && visibleMetas.map((m, i) => {
                const { iid, geo: g } = m;
                const s = getStableSettings(iid);
                const isTarget = iid === pinchTargetId;
                return (
                  <CanvasLayer
                    key={iid}
                    isTarget={isTarget}
                    committedX={s.offsetX ?? 0}
                    committedY={s.offsetY ?? 0}
                    liveDragX={liveDragX}
                    liveDragY={liveDragY}
                    dragActive={dragActive}
                    geo={g}
                    index={i}
                    size={immersiveSize}
                    settings={s}
                    liveZoomSV={isTarget ? livePinch : undefined}
                    pinchActiveSV={pinchActive}
                    liveAngleSV={isTarget ? liveRot : undefined}
                    rotActiveSV={rotActive}
                    holdModeSV={holdModeSV}
                    holdScaleSV={holdScaleSV}
                    holdScaleActive={holdScaleActive}
                    holdDragDeltaX={holdDragDeltaX}
                    holdDragDeltaY={holdDragDeltaY}
                    holdDragActive={holdDragActive}
                    holdRotDeltaDeg={holdRotDeltaDeg}
                    holdRotActive={holdRotActive}
                    masterOpacity={master.opacity}
                    motion={master.motion && tabFocused}
                    glow={master.glow}
                  />
                );
              })}

              {/* Guías de snap (rosa) — estilos FS con centro de pantalla */}
              <Animated.View
                pointerEvents="none"
                style={[{ position: "absolute", left: 0, right: 0, top: 0, height: 1, backgroundColor: "#FF4B8D" }, snapYLineStyleFS]}
              />
              <Animated.View
                pointerEvents="none"
                style={[{ position: "absolute", top: 0, bottom: 0, left: 0, width: 1, backgroundColor: "#FF4B8D" }, snapXLineStyleFS]}
              />

              {/* Badge de ángulo */}
              <Animated.View pointerEvents="none" style={[styles.rotBadge, rotBadgeStyle]}>
                <Feather name="rotate-cw" size={12} color="rgba(255,255,255,0.9)" />
                <AnimatedTextInput
                  editable={false}
                  caretHidden
                  pointerEvents="none"
                  underlineColorAndroid="transparent"
                  style={styles.rotBadgeText}
                  animatedProps={rotBadgeAngleProps}
                />
              </Animated.View>
            </View>
          </GestureDetector>

          {/* Controles flotantes — solo los 3 permitidos */}
          <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
            {/* Izquierda: undo fijo, redo en absoluto debajo */}
            <View pointerEvents="box-none" style={[{ position: "absolute", left: 16, top: insets.top + 12, width: 38, height: 32 }]}>
              {canUndo && (
                <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(160)}>
                  <Pressable onPress={undo} style={styles.actionTopBtn} hitSlop={4} accessibilityRole="button" accessibilityLabel="Deshacer">
                    <Feather name="corner-up-left" size={16} color={CANVAS_ICON} />
                  </Pressable>
                </Animated.View>
              )}
              {canRedo && (
                <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(160)} style={{ position: "absolute", top: 32, left: 0, right: 0 }}>
                  <Pressable onPress={redo} style={styles.actionTopBtn} hitSlop={4} accessibilityRole="button" accessibilityLabel="Adelantar">
                    <Feather name="corner-up-right" size={16} color={CANVAS_ICON} />
                  </Pressable>
                </Animated.View>
              )}
            </View>

            {/* Derecha: minimizar + ojo + hold (columna) */}
            <View style={[styles.fullscreenEditControls, { right: 16, top: insets.top + 12 }]}>
              <Pressable
                onPress={exitFullscreen}
                style={styles.actionTopBtn}
                hitSlop={4}
                accessibilityRole="button"
                accessibilityLabel="Salir del lienzo expandido"
              >
                <Feather name="minimize-2" size={16} color={CANVAS_ICON} />
              </Pressable>
              <Pressable
                onPress={() => setPillOpen((o) => !o)}
                style={styles.actionTopBtn}
                hitSlop={4}
                accessibilityRole="button"
                accessibilityLabel={pillOpen ? "Ocultar acciones" : "Mostrar acciones"}
              >
                <Feather
                  name={pillOpen ? "eye-off" : "eye"}
                  size={16}
                  color={pillOpen ? colors.primary : CANVAS_ICON}
                />
              </Pressable>
              {active.length >= 2 && (
                <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(160)}>
                  <Pressable
                    onPress={() => setHoldMode((v) => !v)}
                    style={styles.actionTopBtn}
                    hitSlop={4}
                    accessibilityRole="button"
                    accessibilityLabel={holdMode ? "Desactivar Hold" : "Activar Hold"}
                  >
                    <HandIcon size={17} color={holdMode ? colors.primary : CANVAS_ICON} />
                  </Pressable>
                </Animated.View>
              )}
            </View>

            {/* Barra horizontal (fullscreen): misma lógica de fade, sin contenedor */}
            <View pointerEvents="box-none" style={{ position: "absolute", bottom: insets.bottom + 100, right: 16, zIndex: 6, flexDirection: "row", alignItems: "center" }}>
              <Animated.View
                pointerEvents={pillOpen ? "auto" : "none"}
                style={[styles.actionBarFadeGroup, pillStyle]}
              >
                {pillActions.map((a) => (
                  <Pressable
                    key={a.key}
                    onPress={() => { a.onPress(); setPillOpen(false); }}
                    style={styles.actionTopBtn}
                    accessibilityRole="button"
                    accessibilityLabel={a.label}
                    hitSlop={4}
                  >
                    {a.gradient ? (
                      <GoldSlidersIcon size={16} />
                    ) : (
                      <Feather name={a.icon} size={16} color={a.color ?? CANVAS_ICON} />
                    )}
                  </Pressable>
                ))}
              </Animated.View>
            </View>
          </View>

          {/* Thumbnails de geometrías activas en fullscreen */}
          {activeMetas.length > 0 && (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={[styles.thumbsScroll, { bottom: insets.bottom + 16 }]}
              contentContainerStyle={styles.thumbsRow}
            >
              {activeMetas.map((m) => {
                const { iid, geo: g } = m;
                const s = getStableSettings(iid);
                const isHidden = hiddenIds.includes(iid);
                const isSelected = pinchTargetId === iid;
                return (
                  <View key={iid} style={styles.thumbItem}>
                    <Pressable
                      onPress={() => {
                        if (isHidden) {
                          setHiddenIds((prev) => prev.filter((id) => id !== iid));
                        } else {
                          setSelectedId(iid);
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
                      {isHidden && (
                        <View style={styles.thumbHiddenOverlay}>
                          <Feather name="eye-off" size={14} color="rgba(255,255,255,0.85)" />
                        </View>
                      )}
                    </Pressable>
                    {/* Flechita: abre ajustes personalizados para esta geometría */}
                    <Pressable
                      onPress={() => {
                        setSettingsGeoId(iid);
                        setMenuGeoId(null);
                        setSettingsOpen(true);
                      }}
                      hitSlop={8}
                      style={styles.thumbChevronBtn}
                      accessibilityRole="button"
                      accessibilityLabel={`Ajustes de ${g.name}`}
                    >
                      <Feather name="chevron-right" size={11} color={s.color} />
                    </Pressable>
                  </View>
                );
              })}
            </ScrollView>
          )}
        </Animated.View>
      )}

      {/* Confirmación destructiva antes de cerrar y descartar el lienzo. */}
      <Modal
        visible={closeConfirmOpen}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setCloseConfirmOpen(false)}
      >
        <Pressable
          style={styles.savedBackdrop}
          onPress={() => setCloseConfirmOpen(false)}
          accessibilityRole="button"
          accessibilityLabel="Cancelar cierre del lienzo"
        >
          <Pressable style={styles.savedCard} onPress={() => {}}>
            <LinearGradient
              colors={HOME_GRADIENT}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View style={styles.closeConfirmIcon}>
              <Feather name="x" size={25} color={colors.primary} />
            </View>
            <Text style={styles.savedTitle}>¿Estás seguro que quieres cerrar?</Text>
            <Text style={styles.savedSubtitle}>
              Guarda el lienzo si no quieres perder tu Geometrix.
            </Text>
            <View style={styles.savedActions}>
              <Pressable
                style={styles.savedBtnGhost}
                onPress={() => setCloseConfirmOpen(false)}
                accessibilityRole="button"
                accessibilityLabel="Cancelar y seguir editando"
              >
                <Text style={styles.savedBtnGhostText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={styles.savedBtnPrimary}
                onPress={discardCanvasAndClose}
                accessibilityRole="button"
                accessibilityLabel="Confirmar cierre y descartar lienzo"
              >
                <GoldGradientFill />
                <Text style={styles.savedBtnPrimaryText}>Sí, seguro</Text>
              </Pressable>
            </View>
          </Pressable>
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
                <GoldGradientFill />
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
                <GoldGradientFill />
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
                <GoldGradientFill />
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
          style={[styles.menuBackdrop, { paddingBottom: bottomReserve + 94 }]}
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
                  <Feather name="sliders" size={18} color={CANVAS_ICON} />
                  <Text style={styles.menuItemText}>Personalizar</Text>
                </Pressable>

                <Pressable
                  style={styles.menuItem}
                  onPress={() => {
                    setHiddenIds((prev) =>
                      prev.includes(menuGeoId!)
                        ? prev.filter((id) => id !== menuGeoId!)
                        : [...prev, menuGeoId!],
                    );
                    setMenuGeoId(null);
                  }}
                >
                  <Feather
                    name={hiddenIds.includes(menuGeoId!) ? "eye" : "eye-off"}
                    size={18}
                    color={CANVAS_ICON}
                  />
                  <Text style={styles.menuItemText}>
                    {hiddenIds.includes(menuGeoId!) ? "Mostrar" : "Ocultar"}
                  </Text>
                </Pressable>

                <Pressable
                  style={styles.menuItem}
                  onPress={() => {
                    const id = menuGeoId!;
                    setMenuGeoId(null);
                    toggleGeometry(id);
                  }}
                >
                  <Feather name="trash-2" size={18} color={CANVAS_ICON} />
                  <Text style={styles.menuItemText}>Quitar</Text>
                </Pressable>
              </View>

              <View style={styles.menuDivider} />

              <View style={styles.menuGlyphWrap}>
                <SacredGlyph
                  id={menuGeo.id}
                  color={getSettings(menuGeoId!).color}
                  gradient={gradientColors(getSettings(menuGeoId!).gradientId)}
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
              {master.bgPattern && (
                <GeometrixPatternBg
                  geoId={master.bgPattern.geoId}
                  opacity={master.bgPattern.opacity}
                  tileSize={master.bgPattern.tileSize * (generalPreviewSize / (canvasSide || generalPreviewSize))}
                  spacing={master.bgPattern.spacing}
                  color={colors.primary}
                />
              )}
              {activeMetas.map((m, i) => (
                <GeometryLayer
                  key={m.iid}
                  geo={m.geo}
                  index={i}
                  size={generalPreviewSize * 0.96}
                  settings={getSettings(m.iid)}
                  masterOpacity={master.opacity}
                  motion={master.motion && tabFocused}
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
            // Congelar el alto en la primera medición (secciones colapsadas).
            if (generalOpen)
              setFrozenGeneralSheetH((prev) => (prev == null ? h : prev));
          }}
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + 16 },
            // Una vez congelado, alto FIJO: al desplegar una sección el contenido
            // scrollea dentro del sheet (arrastra hacia abajo) en vez de crecer
            // hacia arriba, y la vista previa mantiene tamaño y posición.
            frozenGeneralSheetH != null && { height: frozenGeneralSheetH },
          ]}
        >
          <LinearGradient
            colors={canvasBgColors}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[StyleSheet.absoluteFill, styles.sheetGradient]}
          />
          <View style={styles.sheetHeader}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={styles.sheetTitle}>Ajustes generales</Text>
              <Feather name="sliders" size={20} color={colors.foreground} />
            </View>
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

          <ScrollView
            ref={generalScrollRef}
            // Tras congelar el alto: flex:1 para llenar el sheet fijo y scrollear.
            style={frozenGeneralSheetH != null ? { flex: 1 } : undefined}
            contentContainerStyle={{ paddingBottom: 20 }}
            showsVerticalScrollIndicator={false}
          >
          <View style={[styles.geoCard, { marginTop: -10 }]}>

            {/* ── Fondo ────────────────────────────────────────────────── */}
            <SettingsSection
              title="Fondo"
              isModified={
                master.bgColor != null ||
                master.bgGradientId != null ||
                master.bgBrightness !== 0.5 ||
                master.bgPattern != null
              }
              onReset={() =>
                setMaster((m) => ({
                  ...m,
                  bgColor: null,
                  bgGradientId: null,
                  bgBrightness: 0.5,
                  bgPattern: null,
                }))
              }
              onOpen={(y) => generalScrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true })}
            >
              <Text style={styles.fieldLabel}>Color de fondo</Text>
              {/* Degradados */}
              <View style={[styles.swatchRow, { marginTop: 10 }]}>
                {BG_GRADIENTS.filter((gr) => ["violeta-noche", "verdeagua-noche", "vino-noche"].includes(gr.id))
                  .sort((a, b) => ["violeta-noche", "verdeagua-noche", "vino-noche"].indexOf(a.id) - ["violeta-noche", "verdeagua-noche", "vino-noche"].indexOf(b.id))
                  .map((gr) => {
                  const on = master.bgGradientId === gr.id;
                  return (
                    <Pressable
                      key={`bg-${gr.id}`}
                      onPress={() =>
                        setMaster((m) => ({
                          ...m,
                          bgColor: null,
                          bgGradientId: gr.id,
                          bgBrightness: m.bgGradientId === gr.id ? m.bgBrightness : 0.13,
                        }))
                      }
                      style={[styles.swatch, on && styles.swatchOn]}
                      accessibilityRole="button"
                      accessibilityLabel={`Fondo degradado ${gr.id}`}
                    >
                      <GradientSwatch colors={gr.colors} size={24} />
                    </Pressable>
                  );
                })}
              </View>
              <View style={[styles.fieldRow, { marginTop: 12 }]}>
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
              <View style={{ marginTop: 12 }}>
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
                          ? { geoId: "flor-vida", opacity: 0.08, tileSize: 22, spacing: 1 }
                          : null,
                      }));
                    }}
                    color={colors.primary}
                    compact
                  />
                </View>
                {master.bgPattern && (
                  <>
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
            </SettingsSection>

            {/* ── Color ────────────────────────────────────────────────── */}
            <SettingsSection
              title="Color"
              isModified={activeMetas.length > 0 && activeMetas.some((m) => isSectionModified(m.iid, ["color", "gradientId", "saturation"]))}
              onReset={() => activeMetas.forEach((m) => resetSection(m.iid, ["color", "gradientId", "saturation"]))}
              onOpen={(y) => generalScrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true })}
            >
              {(() => {
                const g0 = activeMetas.length > 0 ? getSettings(activeMetas[0].iid) : null;
                return (
                  <>
                    <Text style={styles.fieldLabel}>Color sólido</Text>
                    <View style={[styles.swatchRow, { marginTop: 10 }]}>
                      {PALETTE.map((c) => {
                        const on = !g0?.gradientId && g0?.color?.toLowerCase() === c.toLowerCase();
                        return (
                          <Pressable
                            key={c}
                            onPress={() => {
                              activeMetas.forEach((m) => {
                                updateSetting(m.iid, "color", c);
                                updateSetting(m.iid, "gradientId", null);
                              });
                            }}
                            style={[styles.swatch, on && styles.swatchOn]}
                            accessibilityRole="button"
                            accessibilityLabel={`Color ${c}`}
                          >
                            <View style={[styles.swatchFill, { backgroundColor: c }]} />
                          </Pressable>
                        );
                      })}
                    </View>
                    <Text style={[styles.fieldLabel, styles.gradientLabel]}>Color degradado</Text>
                    <View style={[styles.swatchRow, { marginTop: 10 }]}>
                      {STROKE_GRADIENTS.map((gr) => {
                        const on = g0?.gradientId === gr.id;
                        return (
                          <Pressable
                            key={gr.id}
                            onPress={() => activeMetas.forEach((m) => updateSetting(m.iid, "gradientId", on ? null : gr.id))}
                            style={[styles.swatch, on && styles.swatchOn]}
                            accessibilityRole="button"
                            accessibilityLabel={`Degradado ${gr.id}`}
                          >
                            <GradientSwatch colors={gr.colors} size={20} />
                          </Pressable>
                        );
                      })}
                    </View>
                    <Text style={[styles.fieldLabel, styles.gradientLabel]}>Saturación</Text>
                    <VolumeSlider
                      value={g0?.saturation ?? 0.5}
                      onChange={(v) => activeMetas.forEach((m) => updateSetting(m.iid, "saturation", v))}
                      color="#FFFFFF"
                      trackColor="rgba(255,255,255,0.12)"
                    />
                  </>
                );
              })()}
            </SettingsSection>

            {/* ── Energía ───────────────────────────────────────────────── */}
            <SettingsSection
              title="Energía"
              isModified={activeMetas.length > 0 && activeMetas.some((m) => isSectionModified(m.iid, ["fadeLoopAmount", "breatheAmount", "expansionAmount", "ripple"]))}
              onReset={() => activeMetas.forEach((m) => resetSection(m.iid, ["fadeLoopAmount", "breatheAmount", "expansionAmount", "ripple"]))}
              onOpen={(y) => generalScrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true })}
            >
              {(() => {
                const g0 = activeMetas.length > 0 ? getSettings(activeMetas[0].iid) : null;
                return (
                  <>
                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Fade</Text>
                    </View>
                    <VolumeSlider
                      value={g0?.fadeLoopAmount ?? 0}
                      onChange={(v) => activeMetas.forEach((m) => updateSetting(m.iid, "fadeLoopAmount", v))}
                      color="#FFFFFF"
                      trackColor="rgba(255,255,255,0.12)"
                    />
                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Respirar</Text>
                    </View>
                    <VolumeSlider
                      value={g0?.breatheAmount ?? 0}
                      onChange={(v) => activeMetas.forEach((m) => updateSetting(m.iid, "breatheAmount", v))}
                      color="#FFFFFF"
                      trackColor="rgba(255,255,255,0.12)"
                    />
                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Expansión</Text>
                    </View>
                    <VolumeSlider
                      value={g0?.expansionAmount ?? 0}
                      onChange={(v) => activeMetas.forEach((m) => updateSetting(m.iid, "expansionAmount", v))}
                      color="#FFFFFF"
                      trackColor="rgba(255,255,255,0.12)"
                    />
                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Ripple</Text>
                    </View>
                    <VolumeSlider
                      value={g0?.ripple ?? 0}
                      onChange={(v) => activeMetas.forEach((m) => updateSetting(m.iid, "ripple", v))}
                      color="#FFFFFF"
                      trackColor="rgba(255,255,255,0.12)"
                    />
                  </>
                );
              })()}
            </SettingsSection>

            {/* ── Luminosidad ───────────────────────────────────────────── */}
            <SettingsSection
              title="Luminosidad"
              isModified={activeMetas.length > 0 && activeMetas.some((m) => isSectionModified(m.iid, ["opacity", "glow", "bloom", "halo"]))}
              onReset={() => activeMetas.forEach((m) => resetSection(m.iid, ["opacity", "glow", "bloom", "halo"]))}
              onOpen={(y) => generalScrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true })}
            >
              {(() => {
                const g0 = activeMetas.length > 0 ? getSettings(activeMetas[0].iid) : null;
                return (
                  <>
                    <View style={styles.fieldRow}>
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
                    <View style={styles.fieldRow}>
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
                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Bloom</Text>
                    </View>
                    <VolumeSlider
                      value={g0?.bloom ?? 0}
                      onChange={(v) => activeMetas.forEach((m) => updateSetting(m.iid, "bloom", v))}
                      color="#FFFFFF"
                      trackColor="rgba(255,255,255,0.12)"
                    />
                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Halo</Text>
                    </View>
                    <VolumeSlider
                      value={g0?.halo ?? 0}
                      onChange={(v) => activeMetas.forEach((m) => updateSetting(m.iid, "halo", v))}
                      color="#FFFFFF"
                      trackColor="rgba(255,255,255,0.12)"
                    />
                  </>
                );
              })()}
            </SettingsSection>

            {/* ── Transformación ────────────────────────────────────────── */}
            <SettingsSection
              title="Transformación"
              isModified={activeMetas.length > 0 && activeMetas.some((m) => isSectionModified(m.iid, ["thickness", "rotateLeft", "rotate", "wireframe"]))}
              onReset={() => activeMetas.forEach((m) => resetSection(m.iid, ["thickness", "rotateLeft", "rotate", "wireframe"]))}
              onOpen={(y) => generalScrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true })}
            >
              {(() => {
                const g0 = activeMetas.length > 0 ? getSettings(activeMetas[0].iid) : null;
                const allMosaic = activeMetas.length > 0 && activeMetas.every(
                  (m) => (catalogGeoMap.get(baseOf(m.iid)) as { geometryType?: string } | undefined)?.geometryType === "mosaic"
                );
                const wfDefault0 = (catalogGeoMap.get(baseOf(activeMetas[0]?.iid ?? "")) as { wireframeDefault?: boolean } | undefined)?.wireframeDefault ?? false;
                const isWf0 = g0 ? (g0.wireframe !== undefined ? g0.wireframe : wfDefault0) : false;
                return (
                  <>
                    {allMosaic && (
                      <View style={{
                        flexDirection: "row", alignItems: "center",
                        justifyContent: "space-between", marginBottom: 10,
                        paddingVertical: 8, paddingHorizontal: 10,
                        backgroundColor: isWf0 ? colors.primary + "14" : "rgba(255,255,255,0.03)",
                        borderRadius: 10,
                        borderWidth: 1,
                        borderColor: isWf0 ? colors.primary + "55" : "rgba(255,255,255,0.07)",
                      }}>
                        <Text style={{ color: isWf0 ? colors.primary : colors.mutedForeground, fontWeight: "600", fontSize: 13 }}>
                          Calado
                        </Text>
                        <Toggle
                          value={isWf0}
                          onChange={(v) => activeMetas.forEach((m) => updateSetting(m.iid, "wireframe", v))}
                          color={colors.primary}
                          compact
                        />
                      </View>
                    )}
                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Girar izquierda</Text>
                      <Toggle
                        value={g0?.rotateLeft ?? false}
                        onChange={(v) => {
                          activeMetas.forEach((m) => {
                            updateSetting(m.iid, "rotateLeft", v);
                            if (v) updateSetting(m.iid, "rotate", false);
                          });
                        }}
                        color={TOGGLE_ON_COLOR}
                        compact
                      />
                    </View>
                    <View style={[styles.fieldRow, { marginTop: 8 }]}>
                      <Text style={styles.fieldLabel}>Girar derecha</Text>
                      <Toggle
                        value={g0?.rotate ?? false}
                        onChange={(v) => {
                          activeMetas.forEach((m) => {
                            updateSetting(m.iid, "rotate", v);
                            if (v) updateSetting(m.iid, "rotateLeft", false);
                          });
                        }}
                        color={TOGGLE_ON_COLOR}
                        compact
                      />
                    </View>
                    {!allMosaic && (
                      <>
                        <View style={[styles.fieldRow, { marginTop: 8 }]}>
                          <Text style={styles.fieldLabel}>Grosor</Text>
                        </View>
                        <VolumeSlider
                          value={g0?.thickness ?? 0.5}
                          onChange={(v) => activeMetas.forEach((m) => updateSetting(m.iid, "thickness", v))}
                          color="#FFFFFF"
                          trackColor="rgba(255,255,255,0.12)"
                        />
                      </>
                    )}
                  </>
                );
              })()}
            </SettingsSection>

            {/* ── Calidoscopio ──────────────────────────────────────────── */}
            <SettingsSection
              title="Calidoscopio"
              isModified={activeMetas.length > 0 && activeMetas.some((m) => isSectionModified(m.iid, ["kaleidoscope", "kaleidSegments"]))}
              onReset={() => activeMetas.forEach((m) => resetSection(m.iid, ["kaleidoscope", "kaleidSegments"]))}
              onOpen={(y) => generalScrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true })}
            >
              {activeMetas.length > 0 && (() => {
                const allOn = activeMetas.every((m) => getSettings(m.iid).kaleidoscope === true);
                const anyOn = activeMetas.some((m) => getSettings(m.iid).kaleidoscope === true);
                const segs  = getSettings(activeMetas[0].iid).kaleidSegments ?? 6;
                return (
                  <>
                    <View style={{
                      flexDirection: "row", alignItems: "center",
                      justifyContent: "space-between", marginBottom: 10,
                      paddingVertical: 8, paddingHorizontal: 10,
                      backgroundColor: anyOn ? colors.primary + "14" : "rgba(255,255,255,0.03)",
                      borderRadius: 10,
                      borderWidth: 1,
                      borderColor: anyOn ? colors.primary + "55" : "rgba(255,255,255,0.07)",
                    }}>
                      <Text style={{ color: anyOn ? colors.primary : colors.mutedForeground, fontWeight: "600", fontSize: 13 }}>
                        Activar caleidoscopio (todas)
                      </Text>
                      <Toggle
                        value={allOn}
                        onChange={(v) => activeMetas.forEach((m) => updateSetting(m.iid, "kaleidoscope", v))}
                        color={colors.primary}
                        compact
                      />
                    </View>
                    {anyOn && (
                      <View style={{ marginBottom: 4 }}>
                        <Text style={[styles.fieldLabel, { marginBottom: 8 }]}>Segmentos</Text>
                        <View style={{ flexDirection: "row", gap: 8 }}>
                          {[4, 6, 8, 12, 16].map((n) => {
                            const on = segs === n;
                            return (
                              <Pressable
                                key={n}
                                onPress={() => activeMetas.forEach((m) => updateSetting(m.iid, "kaleidSegments", n))}
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
                  </>
                );
              })()}
            </SettingsSection>

          </View>
          </ScrollView>
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
              {visibleMetas.map((m, i) => (
                <GeometryLayer
                  key={m.iid}
                  geo={m.geo}
                  index={i}
                  size={previewSize * 0.96}
                  settings={getSettings(m.iid)}
                  masterOpacity={master.opacity}
                  motion={master.motion && tabFocused}
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
            // Congelar el alto en la primera medición (secciones colapsadas).
            if (settingsGeo) setFrozenSheetH((prev) => (prev == null ? h : prev));
          }}
          style={[
            styles.sheet,
            { paddingBottom: insets.bottom + 16 },
            // Una vez congelado, alto FIJO: la vista previa (anclada a este alto)
            // no cambia de tamaño/posición y, al desplegar una sección, el
            // contenido scrollea dentro del sheet en vez de crecer hacia arriba.
            // Antes de congelar, el sheet se ajusta al contenido (sin vacío).
            settingsGeo && frozenSheetH != null && { height: frozenSheetH },
          ]}
        >
          <LinearGradient
            colors={canvasBgColors}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={[StyleSheet.absoluteFill, styles.sheetGradient]}
          />
          <View style={styles.sheetHeader}>
            <View style={styles.sheetHeaderLeft}>
              {settingsGeo ? (
                <>
                  <SacredGlyph
                    id={settingsGeo.id}
                    color={getSettings(settingsGeoId!).color}
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
                      const id = settingsGeoId!;
                      setHiddenIds((prev) =>
                        prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
                      );
                      setSettingsOpen(false);
                      setSettingsGeoId(null);
                    }}
                    hitSlop={10}
                    style={{ paddingHorizontal: 10 }}
                    accessibilityRole="button"
                    accessibilityLabel={hiddenIds.includes(settingsGeoId!) ? "Mostrar geometría" : "Ocultar geometría"}
                  >
                    <Feather
                      name={hiddenIds.includes(settingsGeoId!) ? "eye" : "eye-off"}
                      size={19}
                      color={CANVAS_ICON}
                    />
                  </Pressable>
                  <View style={styles.sheetHeaderVDivider} />
                  {/* Duplicar: crea una copia a la derecha con ajustes por defecto */}
                  <Pressable
                    onPress={() => duplicateGeometry(settingsGeoId!)}
                    hitSlop={10}
                    style={{ paddingHorizontal: 10 }}
                    accessibilityRole="button"
                    accessibilityLabel="Duplicar geometría"
                  >
                    <Feather name="copy" size={18} color={CANVAS_ICON} />
                  </Pressable>
                  <View style={styles.sheetHeaderVDivider} />
                  {/* Borrar */}
                  <Pressable
                    onPress={() => {
                      const id = settingsGeoId!;
                      setSettingsOpen(false);
                      setSettingsGeoId(null);
                      toggleGeometry(id);
                    }}
                    hitSlop={10}
                    style={{ paddingHorizontal: 10 }}
                    accessibilityRole="button"
                    accessibilityLabel="Borrar geometría"
                  >
                    <Feather name="trash-2" size={18} color={CANVAS_ICON} />
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
                <Feather name="x" size={20} color={CANVAS_ICON} />
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
              const iid = settingsGeoId!;
              const s = getSettings(iid);
              return (
                <ScrollView
                  ref={settingsScrollRef}
                  // Antes de congelar el alto: contenido natural (para medirlo).
                  // Después: flex:1 para llenar el sheet fijo y scrollear.
                  style={frozenSheetH != null ? { flex: 1 } : undefined}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingBottom: 8 }}
                >
                <View style={styles.geoCard}>

                  {/* ── Color ─────────────────────────────────────────────── */}
                  <SettingsSection
                    title="Color"
                    isModified={isSectionModified(iid, ["color", "gradientId", "saturation"])}
                    onReset={() => resetSection(iid, ["color", "gradientId", "saturation"])}
                    onOpen={(y) => settingsScrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true })}
                  >
                    <Text style={styles.fieldLabel}>Color sólido</Text>
                    <View style={[styles.swatchRow, { marginTop: 10 }]}>
                      {PALETTE.map((c) => {
                        const on = !s.gradientId && s.color.toLowerCase() === c.toLowerCase();
                        return (
                          <Pressable
                            key={c}
                            onPress={() => {
                              updateSetting(iid, "color", c);
                              updateSetting(iid, "gradientId", null);
                            }}
                            style={[styles.swatch, on && styles.swatchOn]}
                            accessibilityRole="button"
                            accessibilityLabel={`Color ${c}`}
                          >
                            <View style={[styles.swatchFill, { backgroundColor: c }]} />
                          </Pressable>
                        );
                      })}
                    </View>
                    <Text style={[styles.fieldLabel, styles.gradientLabel]}>Color degradado</Text>
                    <View style={[styles.swatchRow, { marginTop: 10 }]}>
                      {STROKE_GRADIENTS.map((gr) => {
                        const on = s.gradientId === gr.id;
                        return (
                          <Pressable
                            key={gr.id}
                            onPress={() => updateSetting(iid, "gradientId", on ? null : gr.id)}
                            style={[styles.swatch, on && styles.swatchOn]}
                            accessibilityRole="button"
                            accessibilityLabel={`Degradado ${gr.id}`}
                          >
                            <GradientSwatch colors={gr.colors} size={20} />
                          </Pressable>
                        );
                      })}
                    </View>
                    <Text style={[styles.fieldLabel, styles.gradientLabel]}>Saturación</Text>
                    <VolumeSlider
                      value={s.saturation ?? 0.5}
                      onChange={(v) => updateSetting(iid, "saturation", v)}
                      color="#FFFFFF"
                      trackColor="rgba(255,255,255,0.12)"
                    />
                  </SettingsSection>

                  {/* ── Energía ───────────────────────────────────────────── */}
                  <SettingsSection
                    title="Energía"
                    isModified={isSectionModified(iid, ["fadeLoopAmount", "breatheAmount", "expansionAmount", "ripple"])}
                    onReset={() => resetSection(iid, ["fadeLoopAmount", "breatheAmount", "expansionAmount", "ripple"])}
                    onOpen={(y) => settingsScrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true })}
                  >
                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Fade</Text>
                    </View>
                    <VolumeSlider
                      value={s.fadeLoopAmount ?? 0}
                      onChange={(v) => updateSetting(iid, "fadeLoopAmount", v)}
                      color="#FFFFFF"
                      trackColor="rgba(255,255,255,0.12)"
                    />
                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Respirar</Text>
                    </View>
                    <VolumeSlider
                      value={s.breatheAmount ?? 0}
                      onChange={(v) => updateSetting(iid, "breatheAmount", v)}
                      color="#FFFFFF"
                      trackColor="rgba(255,255,255,0.12)"
                    />
                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Expansión</Text>
                    </View>
                    <VolumeSlider
                      value={s.expansionAmount ?? 0}
                      onChange={(v) => updateSetting(iid, "expansionAmount", v)}
                      color="#FFFFFF"
                      trackColor="rgba(255,255,255,0.12)"
                    />
                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Ripple</Text>
                    </View>
                    <VolumeSlider
                      value={s.ripple ?? 0}
                      onChange={(v) => updateSetting(iid, "ripple", v)}
                      color="#FFFFFF"
                      trackColor="rgba(255,255,255,0.12)"
                    />
                  </SettingsSection>

                  {/* ── Luminosidad ───────────────────────────────────────── */}
                  <SettingsSection
                    title="Luminosidad"
                    isModified={isSectionModified(iid, ["opacity", "glow", "bloom", "halo"])}
                    onReset={() => resetSection(iid, ["opacity", "glow", "bloom", "halo"])}
                    onOpen={(y) => settingsScrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true })}
                  >
                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Opacidad</Text>
                    </View>
                    <VolumeSlider
                      value={s.opacity}
                      onChange={(v) => updateSetting(iid, "opacity", Math.max(0, v))}
                      color="#FFFFFF"
                      trackColor="rgba(255,255,255,0.12)"
                    />
                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Glow</Text>
                    </View>
                    <VolumeSlider
                      value={s.glow}
                      onChange={(v) => updateSetting(iid, "glow", v)}
                      color="#FFFFFF"
                      trackColor="rgba(255,255,255,0.12)"
                    />
                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Bloom</Text>
                    </View>
                    <VolumeSlider
                      value={s.bloom ?? 0}
                      onChange={(v) => updateSetting(iid, "bloom", v)}
                      color="#FFFFFF"
                      trackColor="rgba(255,255,255,0.12)"
                    />
                    <View style={styles.fieldRow}>
                      <Text style={styles.fieldLabel}>Halo</Text>
                    </View>
                    <VolumeSlider
                      value={s.halo ?? 0}
                      onChange={(v) => updateSetting(iid, "halo", v)}
                      color="#FFFFFF"
                      trackColor="rgba(255,255,255,0.12)"
                    />
                  </SettingsSection>

                  {/* ── Transformación ────────────────────────────────────── */}
                  {(() => {
                    const settingsGeo = catalogGeoMap.get(baseOf(iid));
                    const isMosaicSingle = (settingsGeo as { geometryType?: string } | undefined)?.geometryType === "mosaic";
                    const wfDefaultSingle = (settingsGeo as { wireframeDefault?: boolean } | undefined)?.wireframeDefault ?? false;
                    const isWfSingle = s.wireframe !== undefined ? s.wireframe : wfDefaultSingle;
                    return (
                      <SettingsSection
                        title="Transformación"
                        isModified={isSectionModified(iid, ["thickness", "rotateLeft", "rotate", "wireframe"])}
                        onReset={() => resetSection(iid, ["thickness", "rotateLeft", "rotate", "wireframe"])}
                        onOpen={(y) => settingsScrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true })}
                      >
                        {isMosaicSingle && (
                          <View style={{
                            flexDirection: "row", alignItems: "center",
                            justifyContent: "space-between", marginBottom: 10,
                            paddingVertical: 8, paddingHorizontal: 10,
                            backgroundColor: isWfSingle ? colors.primary + "14" : "rgba(255,255,255,0.03)",
                            borderRadius: 10,
                            borderWidth: 1,
                            borderColor: isWfSingle ? colors.primary + "55" : "rgba(255,255,255,0.07)",
                          }}>
                            <Text style={{ color: isWfSingle ? colors.primary : colors.mutedForeground, fontWeight: "600", fontSize: 13 }}>
                              Calado
                            </Text>
                            <Toggle
                              value={isWfSingle}
                              onChange={(v) => updateSetting(iid, "wireframe", v)}
                              color={colors.primary}
                              compact
                            />
                          </View>
                        )}
                        <View style={styles.fieldRow}>
                          <Text style={styles.fieldLabel}>Girar izquierda</Text>
                          <Toggle
                            value={s.rotateLeft}
                            onChange={(v) => {
                              updateSetting(iid, "rotateLeft", v);
                              if (v) updateSetting(iid, "rotate", false);
                            }}
                            color={TOGGLE_ON_COLOR}
                            compact
                          />
                        </View>
                        <View style={[styles.fieldRow, { marginTop: 8 }]}>
                          <Text style={styles.fieldLabel}>Girar derecha</Text>
                          <Toggle
                            value={s.rotate}
                            onChange={(v) => {
                              updateSetting(iid, "rotate", v);
                              if (v) updateSetting(iid, "rotateLeft", false);
                            }}
                            color={TOGGLE_ON_COLOR}
                            compact
                          />
                        </View>
                        {!isMosaicSingle && (
                          <>
                            <View style={[styles.fieldRow, { marginTop: 8 }]}>
                              <Text style={styles.fieldLabel}>Grosor</Text>
                            </View>
                            <VolumeSlider
                              value={s.thickness}
                              onChange={(v) => updateSetting(iid, "thickness", v)}
                              color="#FFFFFF"
                              trackColor="rgba(255,255,255,0.12)"
                            />
                          </>
                        )}
                      </SettingsSection>
                    );
                  })()}

                  {/* ── Calidoscopio ──────────────────────────────────────── */}
                  <SettingsSection
                    title="Calidoscopio"
                    isModified={isSectionModified(iid, ["kaleidoscope", "kaleidSegments"])}
                    onReset={() => resetSection(iid, ["kaleidoscope", "kaleidSegments"])}
                    onOpen={(y) => settingsScrollRef.current?.scrollTo({ y: Math.max(0, y - 16), animated: true })}
                  >
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
                        Activar caleidoscopio
                      </Text>
                      <Toggle
                        value={s.kaleidoscope ?? false}
                        onChange={(v) => updateSetting(iid, "kaleidoscope", v)}
                        color={colors.primary}
                        compact
                      />
                    </View>
                    {s.kaleidoscope && (
                      <View style={{ marginBottom: 4 }}>
                        <Text style={[styles.fieldLabel, { marginBottom: 8 }]}>Segmentos</Text>
                        <View style={{ flexDirection: "row", gap: 8 }}>
                          {[4, 6, 8, 12, 16].map((n) => {
                            const on = (s.kaleidSegments ?? 6) === n;
                            return (
                              <Pressable
                                key={n}
                                onPress={() => updateSetting(iid, "kaleidSegments", n)}
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
                  </SettingsSection>

                </View>
                </ScrollView>
              );
            })()
          )}
        </View>
        </View>
      </Modal>

      {/* ── Landing screen: aparece al entrar con canvas vacío ── */}
      {showLanding && (
        <View style={styles.landingOverlay}>
          <LinearGradient
            colors={canvasBgColors as [string, string, ...string[]]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Botón volver (mismo chevron/fondo que Música) */}
          <View style={[styles.landingBackBtn, { top: insets.top + 3 }]}>
            <View style={{ width: 40, height: 40, borderRadius: 20, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
              <BackPill
                onPress={() => { if (isGeometrixOpen) closeGeometrix(); else router.back(); }}
                size={28}
                bgColor="rgba(255,255,255,0.10)"
                iconOffsetX={-1}
                style={{ transform: [{ translateX: -1 }] }}
              />
            </View>
          </View>

          {/* Logo + título */}
          <View style={styles.landingHero}>
            <Image
              source={require("@/assets/images/geometrix/cubo-3.png")}
              style={styles.landingLogo}
              contentFit="contain"
            />
            <Text style={styles.landingTitle}>GEOMETRIX</Text>
            <View style={styles.landingSep} />
          </View>

          {/* Menú de opciones */}
          <View style={styles.landingMenu}>
            {/* Crear Geometría — Crystal Nebula */}
            <CrearGeometriaCard
              onPress={() => {
                setShowLanding(false);
                stopIntro();
              }}
            />

            {/* Mis Creaciones */}
            <Pressable
              style={({ pressed }) => [styles.landingItem, { opacity: pressed ? 0.75 : 1 }]}
              onPress={() => router.push("/geometrix-creaciones")}
            >
              <View style={styles.landingItemIcon}>
                <LandingGradientIcon name="grid" />
              </View>
              <View style={styles.landingItemText}>
                <Text style={styles.landingItemTitle}>Mis Creaciones</Text>
                <Text style={styles.landingItemDesc}>Tus obras guardadas</Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </Pressable>

            {/* Comunidad */}
            <Pressable
              style={({ pressed }) => [styles.landingItem, { opacity: pressed ? 0.75 : 1 }]}
              onPress={() => router.push("/geometrix-comunidad")}
            >
              <View style={styles.landingItemIcon}>
                <LandingGradientIcon name="users" />
              </View>
              <View style={styles.landingItemText}>
                <Text style={styles.landingItemTitle}>Comunidad</Text>
                <Text style={styles.landingItemDesc}>Explora y comparte</Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </Pressable>

            {/* Aprende */}
            <Pressable
              style={({ pressed }) => [styles.landingItem, { opacity: pressed ? 0.75 : 1 }]}
              onPress={() => router.push("/geometrix-aprende")}
            >
              <View style={styles.landingItemIcon}>
                <LandingGradientIcon name="book-open" />
              </View>
              <View style={styles.landingItemText}>
                <Text style={styles.landingItemTitle}>Aprende</Text>
                <Text style={styles.landingItemDesc}>Descubre y profundiza</Text>
              </View>
              <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {/* Hint */}
          <Text style={styles.landingHint}>Explora la geometría del universo</Text>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#10091F" },
  content:  { flex: 1, paddingHorizontal: 20 },

  // ── Landing overlay ───────────────────────────────────────────────────────
  landingOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 200,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  landingBackBtn: {
    position: "absolute",
    left: 20,
    zIndex: 10,
  },
  landingHero: {
    alignItems: "center",
    marginBottom: 36,
  },
  landingLogo: {
    width: 80,
    height: 80,
    marginBottom: 16,
    opacity: 0.95,
  },
  landingTitle: {
    fontFamily: "Manrope",
    fontSize: 26,
    fontWeight: "700",
    color: "#EDE1D3",
    letterSpacing: 6,
    marginBottom: 4,
  },
  landingSubtitle: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "500",
    color: "#e8e6f5",
    letterSpacing: 4,
    marginBottom: 20,
  },
  landingSep: {
    width: 48,
    height: 1,
    backgroundColor: "rgba(190,150,80,0.4)",
  },
  landingMenu: {
    gap: 10,
  },
  /* ── Crystal Nebula card styles ── */
  cbOuter: {
    borderRadius: 18,
    shadowColor: "#7B64FF",
    shadowOpacity: 0.28,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 3 },
    elevation: 10,
  },
  cbCard: {
    backgroundColor: "rgba(16,9,31,0.5)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(123,100,255,0.45)",
    overflow: "hidden",
  },
  cbRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 15,
  },
  cbIconWrap: {
    width: 58,
    height: 58,
    flexShrink: 0,
    position: "relative",
  },
  cbText: { flex: 1 },
  cbTitle: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "700" as const,
    color: "#EDE1D3",
    marginBottom: 3,
    letterSpacing: 0.3,
  },
  cbDesc: {
    fontFamily: "Manrope",
    fontSize: 12,
    color: "#a79fb8",
    lineHeight: 17,
  },
  cbTag: {
    marginTop: 6,
    alignSelf: "flex-start" as const,
    backgroundColor: "rgba(123,100,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(123,100,255,0.22)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  cbTagText: {
    fontFamily: "Manrope",
    fontSize: 10,
    color: "#dbd1f3",
    letterSpacing: 0.5,
  },
  cbChevron: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(123,100,255,0.10)",
    borderWidth: 1,
    borderColor: "rgba(123,100,255,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },

  landingItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 15,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  landingItemIcon: {
    width: 46,
    height: 46,
    borderRadius: 13,
    backgroundColor: "rgba(54,41,97,0.5)",
    alignItems: "center",
    justifyContent: "center",
  },
  landingItemIconPrimary: {
    backgroundColor: "rgba(11,15,20,0.2)",
  },
  landingItemText: { flex: 1 },
  landingItemTitle: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "700",
    color: "#EDE1D3",
    marginBottom: 2,
  },
  landingItemDesc: {
    fontFamily: "Manrope",
    fontSize: 12,
    color: "#a79fb8",
  },
  landingHint: {
    fontFamily: "Manrope",
    textAlign: "center",
    fontSize: 11,
    color: "rgba(122,143,168,0.6)",
    marginTop: 28,
    letterSpacing: 0.3,
  },

  topPanel: { marginHorizontal: -20 },
  carouselDivider: {
    height: 1,
    marginHorizontal: -20,
    backgroundColor: "rgba(255,255,255,0.03)",
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 0,
    paddingLeft: 20,
    paddingRight: 0,
    // El carrusel (styles.grid) sube con marginTop:-25 y solapa la mitad inferior
    // del header → tapaba el botón de audio (había que tocar por encima del icono
    // para abrir el buscador). zIndex eleva el header por encima del carrusel para
    // que TODO el botón sea tocable. El header no tiene relleno, así que no oculta
    // las tiles (que viven más abajo por el paddingTop del contenido).
    zIndex: 10,
  },
  backBtn: { marginRight: 10, padding: 2 },
  headerText: { flex: 1, paddingRight: 12 },
  // Título + logo cubo-3 en línea; el logo a la altura del texto del título.
  titleRow: { flexDirection: "row", alignItems: "center" },
  titleLogo: { width: 18, height: 18, marginLeft: 5, opacity: 0.92 },
  title: { fontFamily: "Manrope", fontSize: 25, fontWeight: "700", color: "#FFFFFF", letterSpacing: 0.3, lineHeight: 25 },
  titleDesc: { fontFamily: "Manrope", fontSize: 12, color: "#BBA8E8", marginTop: 3, letterSpacing: 0.2 },
  subtitle: { fontFamily: "Manrope", fontSize: 13, color: "#BBA8E8", marginTop: 3 },

  // ── Botón "tema de fondo" (top-right del header) ──
  // Mismo tamaño y fondo que el botón Fuego de Inicio (40×40, borderRadius 20)
  // para que el círculo quede alineado a la misma distancia del borde de pantalla.
  themeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  themeBtnOn: { backgroundColor: hexAlpha("#7A8FA8", 0.10) },

  // ── Buscador de tema de fondo (modal) ──
  themeSheet: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#040404",
    paddingHorizontal: 20,
  },
  themeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  themeTitle: { fontFamily: "Manrope", fontSize: 20, fontWeight: "700", color: colors.foreground },
  themeSub: { fontFamily: "Manrope", fontSize: 13, color: "#BBA8E8", marginTop: 4, marginBottom: 14 },
  themeSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  themeSearchInput: { fontFamily: "Manrope", flex: 1, fontSize: 15, color: colors.foreground, paddingVertical: 0 },
  themeResults: { marginTop: 12, flex: 1 },
  themeHint: { fontFamily: "Manrope", color: "#BBA8E8", fontSize: 13, textAlign: "center", marginTop: 24 },
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  themeRowOn: { backgroundColor: hexAlpha("#F9F9F9", 0.08) },
  themeStopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: hexAlpha("#F9F9F9", 0.1),
    marginTop: 12,
  },
  themeRowIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  themeRowTitle: { fontFamily: "Manrope", fontSize: 14, fontWeight: "600", color: colors.foreground },
  themeRowSub: { fontFamily: "Manrope", fontSize: 12, color: "#BBA8E8", marginTop: 2 },
  themeSelectBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: hexAlpha(colors.primary, 0.18),
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: hexAlpha(colors.primary, 0.5),
  },
  themeSelectBtnText: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "700",
    color: colors.primary,
  },

  catFilterRow: {
    flexDirection: "row",
    gap: 8,
    paddingLeft: 10,
    paddingRight: 8,
    marginTop: 17,
    marginBottom: 3,
  },
  catChip: {
    paddingHorizontal: 13,
    height: 42,
    borderRadius: 999,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
     borderWidth: 2,
  },
  catChipIndigo: {
    backgroundColor: "rgba(42,40,64,0.65)",
  },
  catChipText: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "400",
    color: "#F4F4F4",
    letterSpacing: 0.3,
  },
  catChipTextOn: {
    color: "#0D0A1E",
    fontWeight: "600",
  },
  catChipTextIndigoOn: {
    color: "#F9F9F9",
  },
  grid: { flexGrow: 0 },
  gridContent: { paddingTop: 6, paddingBottom: 6, paddingLeft: 10, paddingRight: 20 },
  // Modelo FLIP: contenedor relativo de altura/ancho fijos (dados inline). Las tiles
  // se posicionan en absoluto y se ubican SOLO con translateX según su slot (orderSV)
  // → el árbol nunca se reordena, no hay reflow de Fabric y el espaciado lo da itemW.
  gridRow: { position: "relative" },
  tileWrap: { position: "absolute", left: 0, top: 0 },
  tileDragging: { zIndex: 50, elevation: 8 },
  tileTitle: {
    fontFamily: "Manrope",
    marginTop: 3,
    paddingHorizontal: 4,
    paddingBottom: 1,
    textAlign: "center",
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.75)",
  },
  tile: {
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.02)",
    alignItems: "center",
    justifyContent: "center",
  },
  tileGlyph: { flex: 1, alignItems: "center", justifyContent: "center" },
  tileHaloWrap: { alignItems: "center", justifyContent: "center" },
  tileLabel: { fontFamily: "Manrope", fontSize: 11, fontWeight: "600", textAlign: "center", paddingHorizontal: 4 },

  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginTop: 5,
    marginBottom: 0,
    marginHorizontal: -20,
  },

  canvasWrap: {
    flex: 1,
    alignItems: "center",
  },
  // Fondo del header (topPanel): topPanel ya tiene marginHorizontal:-20 → absoluteFill directo.
  headerBgLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  // Fondo del lienzo (canvasWrap): edge-to-edge, igual que headerBgLayer.
  canvasBgLayer: {
    position: "absolute",
    top: 0, bottom: 0, left: -20, right: -20,
  },
  // Caja de clip sin transform: los límites de clip coinciden exactamente
  // con la divisora (arriba), el borde de pantalla (lados) y los thumbnails-10px (abajo).
  // El marginHorizontal:-20 cancela el paddingHorizontal:20 de content.
  // El marginBottom negativo es dinámico (calculado en JSX con bottomPb).
  stageClip: {
    flex: 1,
    alignSelf: "stretch",
    marginHorizontal: -20,
    overflow: "hidden",
  },
  stage: {
    flex: 1,
    // marginHorizontal:20 cancela el -20 del stageClip → el stage mide el ancho del content
    // para que canvasSide se calcule igual que antes.
    marginHorizontal: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  canvas: {
    alignItems: "center",
    justifyContent: "center",
  },
  layer: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },

  actionBar: {
    position: "absolute",
    top: 0,
    left: -21,
    right: -19,
    height: 32,
    zIndex: 6,
  },
  actionBarLeft: {
    position: "absolute",
    left: 2,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  actionBarHold: {
    position: "absolute",
    left: 2,
    top: 32,
    width: 38,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBarRight: {
    position: "absolute",
    right: 0,
    top: 0,
    bottom: 0,
    flexDirection: "row",
    alignItems: "center",
  },
  actionBarFadeGroup: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 20,
  },
  actionBarItem: {
    width: 38,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    // Alineado con el margen donde parten las tiles de geometrías (gridContent)
    paddingLeft: 10,
    paddingTop: 45,
    paddingBottom: 4,
  },
  lienzoTitleWrap: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 10,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateY: -36 }],
    zIndex: 9,
  },
  lienzoTitle: {
    fontFamily: "Manrope",
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: 0.3,
    color: "#FBFBFB",
  },
  exitBtn: {
    position: "absolute",
    left: 9,
    top: 10,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    transform: [{ translateY: -36 }],
  },
  canvasCloseBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.12)",
  },
  catScroll: {
    flex: 1,
  },
  catScrollContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingLeft: 0,
    paddingRight: 8,
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
    justifyContent: "flex-start",
    gap: 0,
    paddingHorizontal: 0,
  },
  thumbsRowStart: {
    justifyContent: "flex-start",
    paddingHorizontal: 16,
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
    borderRadius: 16,
    backgroundColor: "transparent",
    paddingVertical: 1,
    paddingHorizontal: 1,
  },
  thumbChevronBtn: {
    width: 16,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 2,
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
    backgroundColor: "#0C0518",
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
    fontFamily: "Manrope",
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
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "400",
    color: CANVAS_ICON,
  },
  immersiveRoot: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Lienzo expandido editable — View absoluto (NO Modal) para no romper RNGH
  fullscreenEditRoot: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
    backgroundColor: "#0B0F14",
  },
  fullscreenEditControls: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
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
    backgroundColor: "#040404",
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
  closeConfirmIcon: {
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
  savedTitle: { fontFamily: "Manrope", fontSize: 19, fontWeight: "700", color: colors.foreground },
  savedSubtitle: {
    fontFamily: "Manrope",
    fontSize: 13.5,
    color: "#BBA8E8",
    textAlign: "center",
    lineHeight: 20,
  },
  savedName: { fontFamily: "Manrope", color: colors.foreground, fontWeight: "600" },
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
  savedBtnGhostText: { fontFamily: "Manrope", fontSize: 14, fontWeight: "600", color: colors.mutedForeground },
  savedBtnPrimary: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  savedBtnPrimaryText: { fontFamily: "Manrope", fontSize: 14, fontWeight: "700", color: colors.primaryForeground },

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
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewLabel: {
    fontFamily: "Manrope",
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
    backgroundColor: "#060d1f",
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
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  sheetHeaderDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    marginBottom: 14,
  },
  sheetTitle: { fontFamily: "Manrope", fontSize: 20, fontWeight: "700", color: "#f4f4f4" },
  sheetEmpty: { alignItems: "center", gap: 10, paddingVertical: 40 },
  sheetEmptyText: { fontFamily: "Manrope", fontSize: 14, color: colors.mutedForeground, textAlign: "center" },

  geoCard: {
    gap: 8,
  },
  geoCardName: {
    fontFamily: "Manrope",
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
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "600",
    color: colors.mutedForeground,
    textAlign: "left",
    flexShrink: 1,
  },

  gradientLabel: { marginTop: 10 },
  fieldLabel: { fontFamily: "Manrope", fontSize: 12, fontWeight: "600", color: "#f4f4f4" },
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

  rotBadge: {
    position: "absolute",
    top: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(0,0,0,0.58)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 9,
    paddingVertical: 5,
    zIndex: 20,
  },
  rotBadgeText: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "600" as const,
    color: "#FBFBFB",
    letterSpacing: 0.3,
    padding: 0,
    width: 38,
    textAlign: "left",
    includeFontPadding: false,
  },
  loupeWrap: {
    position: "absolute",
    width: LOUPE_SIZE,
    height: LOUPE_SIZE,
    borderRadius: LOUPE_SIZE / 2,
    backgroundColor: "rgba(11,15,20,0.88)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    zIndex: 30,
    shadowColor: "#F9F9F9",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
    elevation: 16,
  },
  loupeRim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: LOUPE_SIZE / 2,
    borderWidth: 1.5,
    borderColor: "rgba(190,150,80,0.55)",
  },

  empty: { alignItems: "center", gap: 6 },
  emptyLogoWrap: { marginBottom: 10 },
  emptyLogo: { width: 43, height: 43, opacity: 0.9 },
  emptyText: { fontFamily: "Manrope", fontSize: 14, fontWeight: "600", color: "#FFFFFF", marginTop: 4 },
  emptySub: { fontFamily: "Manrope", fontSize: 12, color: colors.mutedForeground },

});
