/**
 * GEOMETRIX — galería de geometrías sagradas + fondo animado interactivo.
 * El usuario activa geometrías por capas para componer un fondo en vivo.
 */
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { createAudioPlayer, type AudioPlayer } from "expo-audio";
import { router, useFocusEffect, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
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
  FadeOut,
  LinearTransition,
  runOnJS,
  scrollTo,
  useAnimatedReaction,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useFrameCallback,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import Svg, {
  Defs,
  G,
  Line,
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
import { GEOMETRIES, PALETTE, baseOf, getGeometry, INSTANCE_SEP, type GeometryId, type GeometryMeta } from "@/data/geometries";
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
import { usePlayer } from "@/context/PlayerContext";
import { useTabBarVisibility } from "@/context/TabBarVisibilityContext";
import { useGeometrixCreations } from "@/hooks/useGeometrixCreations";
import { AUDIO_MAP } from "@/config/audio-map";
import { SESSIONS, type Session } from "@/data/sessions";

const colors = colorsConst.light;
const CARD_BORDER = "#161f33";

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
  // Estilo del halo de aparición (shadowOpacity animado), igual que las cards.
  const glowStyle = useAnimatedStyle(() => ({ shadowOpacity: appearGlow.value }));

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
      <Animated.View
        style={[
          styles.layer,
          {
            shadowColor: color,
            shadowOffset: { width: 0, height: 0 },
            shadowRadius: Math.max(12, Math.min(30, effectiveSize * 0.1)),
          },
          glowStyle,
        ]}
        pointerEvents="none"
      >
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

type CarouselTileProps = {
  id: string;
  name: string;
  tileW: number;
  isSelected: boolean;
  isActivating: boolean;
  color: string;
  onPress: () => void;
  // Reordenamiento por arrastre (long-press + drag).
  draggable: boolean;
  isDragging: boolean;
  itemW: number;
  frontCount: number;
  indexInFront: number;
  onDragStart: (id: string) => void;
  onDragEnd: (id: string, targetIdx: number) => void;
  // Estado de arrastre compartido: lo escribe la card que se arrastra y lo leen
  // las hermanas para abrir el hueco. origin/target son slots del frente (-1 = sin
  // arrastre). `instantLayout` desactiva la animación de LinearTransition durante
  // el arrastre y el frame del commit; `dragSettling` es true SOLO en el frame del
  // commit (para snapear el hueco al instante, no animarlo 1100 ms).
  instantLayout: boolean;
  dragSettling: boolean;
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
// glide a su posición lo resuelve el padre reordenando + LinearTransition.
function CarouselTile({
  id,
  name,
  tileW,
  isSelected,
  isActivating,
  color,
  onPress,
  draggable,
  isDragging,
  itemW,
  frontCount,
  indexInFront,
  onDragStart,
  onDragEnd,
  instantLayout,
  dragSettling,
  dragOriginIdx,
  dragTargetIdx,
  screenW,
  scrollX,
  dragActive,
  edgeIntent,
}: CarouselTileProps) {
  const scale = useSharedValue(isSelected ? 1.1 : 1);
  const glow = useSharedValue(isSelected ? 0.66 : 0);

  useEffect(() => {
    if (isActivating) {
      // Activación en el lugar: el resplandor crece y se asienta (~1s).
      scale.value = withSequence(
        withTiming(1.18, { duration: 500, easing: Easing.out(Easing.ease) }),
        withTiming(1.1, { duration: 500, easing: Easing.inOut(Easing.ease) }),
      );
      glow.value = withSequence(
        withTiming(1, { duration: 500, easing: Easing.out(Easing.ease) }),
        withTiming(0.66, { duration: 500, easing: Easing.inOut(Easing.ease) }),
      );
    } else if (isSelected) {
      scale.value = withTiming(1.1, { duration: CAROUSEL_FLOW_MS, easing: CAROUSEL_EASE });
      glow.value = withTiming(0.66, { duration: CAROUSEL_FLOW_MS, easing: CAROUSEL_EASE });
    } else {
      scale.value = withTiming(1, { duration: CAROUSEL_FLOW_MS, easing: CAROUSEL_EASE });
      glow.value = withTiming(0, { duration: CAROUSEL_FLOW_MS, easing: CAROUSEL_EASE });
    }
  }, [isActivating, isSelected, scale, glow]);

  const glyphStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    shadowOpacity: glow.value,
  }));

  // Título de la geometría sobre la card: aparece con fade-in al unísono de la
  // selección (activación) y se desvanece 0,15 s después de que la geometría se
  // estaciona en su posición (fin del HOLD + glide al frente).
  const titleOpacity = useSharedValue(0);
  useEffect(() => {
    if (isActivating) {
      const FADE_IN = 900;
      const PARK = CAROUSEL_HOLD_MS + CAROUSEL_FLOW_MS;
      titleOpacity.value = withSequence(
        withTiming(0.95, { duration: FADE_IN, easing: Easing.inOut(Easing.quad) }),
        withDelay(
          PARK - FADE_IN + 150,
          withTiming(0, { duration: 320, easing: Easing.in(Easing.ease) }),
        ),
      );
    }
  }, [isActivating, titleOpacity]);
  const titleStyle = useAnimatedStyle(() => ({ opacity: titleOpacity.value }));

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
  const idxSV = useSharedValue(indexInFront);
  const frontCountSV = useSharedValue(frontCount);
  // Offset de scroll del carrusel al iniciar el arrastre + último translationX
  // del dedo. Sirven para recomputar el destino cuando el dedo está quieto en el
  // borde y el carrusel se auto-desplaza (la posición efectiva cambia por scroll).
  const scrollStartX = useSharedValue(0);
  const lastTransX = useSharedValue(0);
  // 1 solo en la card que se está arrastrando AHORA: así la reacción al scroll y
  // el estilo (dragX vs hueco) aplican únicamente a esta card.
  const selfDragging = useSharedValue(0);
  useEffect(() => {
    idxSV.value = indexInFront;
  }, [indexInFront, idxSV]);
  useEffect(() => {
    frontCountSV.value = frontCount;
  }, [frontCount, frontCountSV]);
  // Limpieza del estado de arrastre DESPUÉS del commit (cuando isDragging pasa a
  // false porque el padre ya hizo draggingId=null). Recién acá apagamos
  // selfDragging y reseteamos dragX + origin/target: hacerlo antes (en el callback
  // de withTiming) dejaría un frame en la rama de hueco antes de que el DOM
  // reordene → micro-salto. En este punto el worklet (siempre adjunto) ya devuelve
  // translateX 0 en su slot final, así que estos resets no cambian nada visual.
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
          dragOriginIdx.value = idxSV.value;
          dragTargetIdx.value = idxSV.value;
          dragX.value = 0;
          scrollStartX.value = scrollX.value;
          lastTransX.value = 0;
          edgeIntent.value = 0;
          dragActive.value = 1;
          selfDragging.value = 1;
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
          const origin = dragOriginIdx.value;
          const target = dragTargetIdx.value;
          lift.value = withTiming(0, { duration: 180 });
          // Planea la card hasta el slot destino (aún en su slot de origen del DOM)
          // y SOLO al terminar confirma el reordenamiento. selfDragging se mantiene
          // en 1 (la card sigue en la rama propia, fija en (target-origin)*itemW)
          // hasta DESPUÉS del commit: limpiarlo aquí la metería un frame en la rama
          // de hueco (translateX→0 vía withTiming) antes de que el DOM reordene →
          // micro-salto. El reset lo hace el efecto de isDragging tras el commit. En
          // ese commit (un único render con active reordenado + draggingId=null) el
          // estilo cambia a `tileRest` (translateX 0) en lockstep con el DOM, así
          // que la posición visual no cambia → sin "fantasma".
          dragX.value = withTiming(
            (target - origin) * itemW,
            { duration: 180, easing: Easing.out(Easing.ease) },
            () => {
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
      dragX,
      edgeIntent,
      idxSV,
      itemW,
      lastTransX,
      lift,
      screenW,
      scrollStartX,
      scrollX,
      selfDragging,
    ],
  );

  // Estilo del wrap. Se mantiene SIEMPRE adjunto (nunca se conmuta a una style
  // estática): conmutar entre un useAnimatedStyle y una style estática deja la
  // ÚLTIMA transform del worklet pegada en el nodo nativo (Reanimated no la
  // resetea y la style estática no la pisa) → cada card enrocada quedaba con su
  // offset de hueco (±itemW) y se solapaba con la vecina. Al estar siempre
  // adjunto, translateX refleja exactamente lo que devuelve el worklet.
  const wrapStyle = useAnimatedStyle(() => {
    const scale = 1 + lift.value * 0.08;
    // Frame del commit del enroque: el DOM ya colocó a TODAS las tiles —incluida la
    // arrastrada— en su slot final, así que translateX 0 para TODAS, por
    // construcción. Se chequea ANTES que `selfDragging` a propósito: si la card
    // arrastrada usara `dragX` (o una fórmula relativa al slot) en este frame,
    // quedaría corrida respecto del slot que el DOM ya reordenó y, al desincronizar
    // origin/selfDragging/dragX durante la limpieza, las dos cards se "re-enrocaban"
    // de vuelta a su posición original. dragSettling es true en el MISMO render del
    // commit (baterizado con el reorden), por lo que cubre exactamente esa ventana.
    if (dragSettling) {
      return { transform: [{ translateX: 0 }, { scale }] };
    }
    // Card que se arrastra (incluido el glide al soltar): sigue al dedo con dragX
    // puro. Su slot del DOM NO cambia hasta el commit, así que dragX la coloca bien
    // sin necesidad de compensar el slot.
    if (selfDragging.value === 1) {
      return { transform: [{ translateX: dragX.value }, { scale }], zIndex: 20 };
    }
    const origin = dragOriginIdx.value;
    const target = dragTargetIdx.value;
    // En reposo (sin arrastre): sin transform.
    if (origin < 0 || target < 0 || origin === target) {
      return { transform: [{ translateX: 0 }, { scale }] };
    }
    // Hermanas: abren el hueco según su slot (indexInFront, en lockstep con el DOM)
    // y se desliza suave con withTiming mientras dura el arrastre.
    let off = 0;
    if (indexInFront >= 0) {
      if (target > origin) {
        if (indexInFront > origin && indexInFront <= target) off = -itemW;
      } else if (indexInFront >= target && indexInFront < origin) {
        off = itemW;
      }
    }
    return {
      transform: [
        { translateX: withTiming(off, { duration: CAROUSEL_FLOW_MS, easing: CAROUSEL_EASE }) },
        { scale },
      ],
    };
  }, [
    selfDragging,
    dragX,
    dragOriginIdx,
    dragTargetIdx,
    lift,
    itemW,
    indexInFront,
    dragSettling,
  ]);

  return (
    <Animated.View
      layout={LinearTransition.duration(instantLayout ? 0 : CAROUSEL_FLOW_MS).easing(CAROUSEL_EASE)}
      style={[styles.tileWrap, wrapStyle, isDragging && styles.tileDragging]}
    >
      <Animated.Text
        pointerEvents="none"
        numberOfLines={1}
        style={[styles.tileTitle, titleStyle]}
      >
        {name}
      </Animated.Text>
      <GestureDetector gesture={dragGesture}>
        <Pressable
          onPress={onPress}
          style={[
            styles.tile,
            { width: tileW, borderColor: hexAlpha(isSelected ? color : CARD_BORDER, isSelected ? 0.2 : 0.8) },
            isSelected && { backgroundColor: "rgba(255,255,255,0.04)" },
          ]}
        >
          <View style={styles.tileGlyph}>
            <Animated.View
              style={[
                glyphStyle,
                {
                  shadowColor: color,
                  shadowOffset: { width: 0, height: 0 },
                  shadowRadius: 11,
                },
              ]}
            >
              <SacredGlyph
                id={baseOf(id)}
                color={isSelected ? color : "#7A8FA8"}
                size={tileW * 0.66}
                strokeWidth={isSelected ? 1.5 : 1.4}
              />
            </Animated.View>
          </View>
        </Pressable>
      </GestureDetector>
    </Animated.View>
  );
}

// Icono "sliders" (ajustes generales) pintado con el degradado dorado del
// logo Cubo 3, en vez de un color plano. react-native-svg permite stroke con
// gradiente, así que no hace falta masked-view.
function GoldSlidersIcon({ size = 18 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Defs>
        <SvgLinearGradient id="pillGoldGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#EFD8A6" />
          <Stop offset="0.5" stopColor="#C99E57" />
          <Stop offset="1" stopColor="#9C7634" />
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

export default function GeometrixScreen() {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  // Alto de la tab bar inferior (réplica del cálculo en (tabs)/_layout.tsx),
  // para que el lienzo no quede tapado por el menú de la app.
  const bottomPb = Platform.OS === "web" ? 8 : insets.bottom;
  const tabBarHeight = 56 + Math.round(bottomPb / 2) + bottomPb;
  // El menú inferior se esconde al entrar a Geometrix (más espacio para el
  // lienzo); cuando está oculto solo hay que despejar la safe area + la
  // pestañita de reaparición, no la tab bar completa.
  const { requestHide, showMenu, hidden: menuHidden } = useTabBarVisibility();
  const bottomReserve = menuHidden ? bottomPb + 28 : tabBarHeight;

  // Persistencia local de composiciones ("Mis creaciones").
  const { creations, saveCreation, updateCreation, getCreation } = useGeometrixCreations();
  // Param de ruta: id de una creación a abrir (lo manda la pantalla de la lista).
  const params = useLocalSearchParams<{ load?: string; play?: string; new?: string }>();

  // `active` guarda IDs de instancia (ver `baseOf`): el original de cada
  // geometría usa el id base pelado; los duplicados usan `${base}::${sufijo}`.
  const [active, setActive] = useState<string[]>([]);
  // Card que se está arrastrando (long-press + drag) para reordenar. Mientras
  // hay un drag activo se desactiva el scroll horizontal del carrusel.
  const [draggingId, setDraggingId] = useState<string | null>(null);
  // True durante el ÚNICO render del commit de un reordenamiento por arrastre:
  // mantiene LinearTransition instantáneo (duration 0) ese frame para que el
  // reordenamiento del DOM no se anime (las transforms ya dejaron todo en su
  // sitio). Se limpia en el siguiente frame para volver a animar las selecciones.
  const [dragSettling, setDragSettling] = useState(false);
  useEffect(() => {
    if (!dragSettling) return;
    const r = requestAnimationFrame(() => setDragSettling(false));
    return () => cancelAnimationFrame(r);
  }, [dragSettling]);
  // Congela el set de "activándose" mientras dura un drag: si otra card termina
  // su activación a mitad de un arrastre, el orden del carrusel no debe saltar.
  const frozenActivatingRef = useRef<Set<string> | null>(null);
  // Mueve una card a la posición `idx` dentro del orden de selección (`active`).
  // Como el orden de `active` define el orden de las capas (primera = atrás),
  // reordenar aquí reordena también las capas del lienzo.
  const moveActiveTo = useCallback((id: string, idx: number) => {
    setActive((prev) => {
      if (!prev.includes(id)) return prev;
      const without = prev.filter((x) => x !== id);
      const clamped = Math.max(0, Math.min(idx, without.length));
      without.splice(clamped, 0, id);
      return without;
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
  const carouselScrollRef = useAnimatedRef<Animated.ScrollView>();
  // Auto-scroll del carrusel mientras se arrastra una card hacia el borde.
  // scrollX: offset actual (lo actualiza el scrollHandler); maxScrollX: tope
  // (contentW - viewport); dragActive: 1 mientras hay drag; edgeIntent: px/frame
  // a desplazar (firmado) según cercanía al borde. El frame loop avanza el scroll.
  const carScrollX = useSharedValue(0);
  const carMaxScrollX = useSharedValue(0);
  const carDragActive = useSharedValue(0);
  const carEdgeIntent = useSharedValue(0);
  // Estado de arrastre compartido por TODAS las tiles (modelo "pin + hueco"):
  // la card arrastrada escribe origin/target (slots del frente); las hermanas los
  // leen para abrir el hueco. -1 = sin arrastre.
  const dragOriginIdx = useSharedValue(-1);
  const dragTargetIdx = useSharedValue(-1);
  const carScrollHandler = useAnimatedScrollHandler((e) => {
    carScrollX.value = e.contentOffset.x;
  });
  useFrameCallback(() => {
    if (carDragActive.value !== 1) return;
    const v = carEdgeIntent.value;
    if (v === 0) return;
    const next = Math.min(Math.max(carScrollX.value + v, 0), carMaxScrollX.value);
    if (next !== carScrollX.value) {
      carScrollX.value = next;
      scrollTo(carouselScrollRef, next, 0, false);
    }
  });
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
  // Commit del reordenamiento al soltar (modelo "pin + hueco"). Las tres
  // actualizaciones de estado se baten en un único render (React 18): `active`
  // reordenado + draggingId=null + dragSettling=true (LinearTransition instantáneo
  // ese frame, y el hueco de las hermanas snapea a 0 sin animar). El worklet
  // (siempre adjunto) devuelve translateX 0 en lockstep con el slot final vía la
  // prop indexInFront → la posición visual no cambia en ese render → sin "fantasma".
  const commitReorder = useCallback(
    (id: string, idx: number) => {
      // Las cuatro transiciones del "soltar" DEBEN entrar en un único commit de
      // React. Como esto se invoca desde el callback de un withTiming (vía
      // runOnJS), el auto-batch de React no es confiable en ese contexto: si se
      // aplican en renders separados queda un frame intermedio sin dragSettling y
      // con el `active` ya reordenado → se arma una animación de 1100 ms
      // (LinearTransition / hueco) que separa las dos cards al terminar el enroque.
      // unstable_batchedUpdates fuerza el render único.
      unstable_batchedUpdates(() => {
        setDragSettling(true);
        moveActiveTo(id, idx);
        // Reset SÍNCRONO de origin/target (en el MISMO batch que el reorden, antes
        // de que React renderice el frame del commit). Si se dejara solo al efecto
        // de limpieza por-tile (corre un tick DESPUÉS del commit), queda una ventana
        // donde la card recién soltada —ya sin selfDragging— cae en la rama del
        // hueco con origin/target viejos → off=+itemW → se corre un slot a la
        // derecha (enroque con la vecina). Ponerlos en -1 acá mata esa rama desde
        // el frame del commit para TODAS las tiles.
        dragOriginIdx.value = -1;
        dragTargetIdx.value = -1;
        frozenActivatingRef.current = null;
        setDraggingId(null);
      });
    },
    [moveActiveTo, dragOriginIdx, dragTargetIdx],
  );
  const carouselOrder = useMemo<string[]>(() => {
    const front = active.filter((id) => !effActivating.has(id));
    const tail = GEOMETRIES.map((g) => g.id).filter((id) => !front.includes(id));
    return [...front, ...tail];
  }, [active, effActivating]);
  // Fila horizontal: 3 tiles completas + asomo de la 4ta para invitar al scroll.
  const tileW = (width - 20 * 2 - 8 * 3) / 3.3;
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
  // Modo inmersión: solo el fondo animado, sin interfaz.
  const [immersive, setImmersive] = useState(false);
  // Nombre de la composición recién guardada → muestra el popup temático.
  const [savedName, setSavedName] = useState<string | null>(null);
  const [updatedName, setUpdatedName] = useState<string | null>(null);
  const [showEmptyAlert, setShowEmptyAlert] = useState(false);
  // Geometría con su menú contextual abierto (tap en miniatura).
  const [menuGeoId, setMenuGeoId] = useState<string | null>(null);
  // "Aislar": muestra solo esta geometría en el lienzo (sin quitar las demás).
  const [hiddenIds, setHiddenIds] = useState<string[]>([]);
  // Geometría seleccionada para el pellizco (pinch) que ajusta su zoom.
  const [selectedId, setSelectedId] = useState<string | null>(null);
  // Cuando los thumbnails desbordan el ancho visible, alineamos a la izquierda
  // (en vez de centrar) para que se pueda deslizar y se asome el último.
  const [thumbsOverflow, setThumbsOverflow] = useState(false);
  const thumbsViewW = useRef(0);
  const thumbsScrollRef = useRef<ScrollView>(null);
  // Aparición escalonada de thumbnails: solo la primera tanda (al poblarse el
  // lienzo) entra de izquierda a derecha; las que se agregan luego, al instante.
  const thumbsInitialIdsRef = useRef<Set<string> | null>(null);
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
  const [themeQuery, setThemeQuery] = useState("");

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


  // Al entrar a Geometrix: esconder el menú inferior (más espacio para el
  // lienzo). Al salir: restaurarlo para el resto de la app.
  useFocusEffect(
    useCallback(() => {
      requestHide();
      return () => showMenu();
    }, [requestHide, showMenu]),
  );

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
  const activeMetas: { iid: string; geo: GeometryMeta }[] = active
    .map((iid) => {
      const geo = getGeometry(baseOf(iid));
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
  // Opacidad del grupo trash: siempre montado para evitar glitch de layout.
  const trashAnim = useSharedValue(0);
  const trashAnimStyle = useAnimatedStyle(() => ({ opacity: trashAnim.value }));

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
    trashAnim.value = withTiming(hasActive ? 1 : 0, {
      duration: hasActive ? 360 : 220,
      easing: Easing.inOut(Easing.ease),
    });
  }, [hasActive, trashAnim]);

  useEffect(() => {
    loupeReveal.value = withTiming(loupeVisible ? 1 : 0, {
      duration: loupeVisible ? 200 : 150,
      easing: Easing.out(Easing.ease),
    });
  }, [loupeVisible, loupeReveal]);

  // Acciones de la píldora desplegable (flecha bajo la divisora). Solo iconos.
  const pillActions: { key: string; icon: keyof typeof Feather.glyphMap; label: string; onPress: () => void; gradient?: boolean }[] = [
    { key: "general", icon: "sliders", label: "Ajustes generales", onPress: () => setGeneralOpen(true), gradient: true },
    { key: "immersive", icon: "maximize", label: "Pantalla completa", onPress: () => setImmersive(true) },
    { key: "save", icon: "save", label: "Guardar", onPress: saveComposition },
    { key: "creaciones", icon: "grid", label: "Mis creaciones", onPress: () => router.push("/geometrix-creaciones") },
    { key: "guias", icon: "crosshair", label: "Guías", onPress: () => setGuidesOpen(true) },
    { key: "comunidad", icon: "users", label: "Comunidad", onPress: () => router.push("/geometrix-comunidad") },
    { key: "borrar", icon: "trash-2", label: "Borrar lienzo", onPress: clearCanvas },
  ];
  // Sin geometrías activas se colapsa el desplegable (la flecha desaparece).
  useEffect(() => {
    if (!hasActive) setPillOpen(false);
  }, [hasActive]);
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
      isPinching.value = true;
      isLoupeActive.value = false;
      pinchStart.value = livePinch.value;
      // Ocultar la lupa en cuanto entra el segundo dedo: evita que el estado
      // mixto (lupa + pellizco simultáneo) bloquee el zoom.
      runOnJS(setLoupeVisible)(false);
    })
    .onUpdate((e) => {
      const z = Math.min(6, Math.max(0.1, pinchStart.value * e.scale));
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
      isPinching.value = false;
      runOnJS(setLivePinchNum)(null);
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
      // Lupa activa → no capturar nueva baseline; longPress.onStart ya la reseteó.
      if (isLoupeActive.value) return;
      // liveDragX/Y ya están sincronizados con el offset confirmado del objetivo
      // via useEffect — leerlos desde el worklet es seguro (son shared values).
      dragStartX.value = liveDragX.value;
      dragStartY.value = liveDragY.value;
    })
    .onUpdate((e) => {
      // Lupa activa → solo seguir al dedo; la geometría queda completamente bloqueada.
      if (isLoupeActive.value) {
        loupeX.value = e.x;
        loupeY.value = e.y;
        return;
      }
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
  const canvasGesture = Gesture.Simultaneous(longPressGesture, pinchGesture, rotationGesture, panGesture);

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
  // Cards reordenables = las del frente (seleccionadas que ya no están
  // "activándose"). El orden de esta lista coincide con el de `active`.
  const frontIds = active.filter((id) => !effActivating.has(id));
  const tileItemW = tileW + 8; // ancho de slot = tile + marginRight (tileWrap)

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
            <View style={styles.titleRow}>
              {/* Logo cubo-3 inline, a la izquierda del título. */}
              <Image
                source={require("@/assets/images/geometrix/cubo-3.png")}
                style={styles.titleLogo}
                contentFit="contain"
              />
              <Text style={styles.title}>Geometrix</Text>
            </View>
          </View>
          {/* Tema de fondo: abre el buscador de toda la biblioteca para elegir un
              audio que suene SOLO dentro de Geometrix. */}
          <Pressable
            onPress={() => setThemeSearchOpen(true)}
            hitSlop={10}
            style={[styles.themeBtn, themeSession ? styles.themeBtnOn : null]}
            accessibilityRole="button"
            accessibilityLabel="Elegir audio de fondo"
          >
            <Feather name="volume-2" size={18} color={colors.mutedForeground} />
          </Pressable>
        </View>

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
                      onPress={() => {
                        playTheme(s);
                        setThemeSearchOpen(false);
                      }}
                    >
                      <View style={styles.themeRowIcon}>
                        <Feather
                          name={isCurrent ? "volume-2" : "music"}
                          size={16}
                          color={isCurrent ? colors.primary : colors.mutedForeground}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.themeRowTitle} numberOfLines={1}>
                          {s.title}
                        </Text>
                        <Text style={styles.themeRowSub} numberOfLines={1}>
                          {s.categoryLabel}
                        </Text>
                      </View>
                    </Pressable>
                  );
                })
              )}
            </ScrollView>
          </View>
        </Modal>

        {/* Galería de geometrías (una fila horizontal, scrolleable) */}
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
          <View style={styles.gridRow}>
            {carouselOrder.map((gid: string) => {
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
                  onPress={() => toggleGeometry(gid)}
                  draggable={selected && !activating}
                  isDragging={draggingId === gid}
                  itemW={tileItemW}
                  frontCount={frontIds.length}
                  indexInFront={frontIds.indexOf(gid)}
                  onDragStart={handleDragStart}
                  onDragEnd={commitReorder}
                  screenW={width}
                  scrollX={carScrollX}
                  dragActive={carDragActive}
                  edgeIntent={carEdgeIntent}
                  instantLayout={draggingId !== null || dragSettling}
                  dragSettling={dragSettling}
                  dragOriginIdx={dragOriginIdx}
                  dragTargetIdx={dragTargetIdx}
                />
              );
            })}
          </View>
        </Animated.ScrollView>

        {/* Línea divisora */}
        <View style={styles.divider} />

        </LinearGradient>

        {/* Fondo interactivo: animación centrada en el espacio entre la
            divisora y la tab bar. paddingBottom despeja la tab bar para que el
            lienzo no se recorte. */}
        <View style={[styles.canvasWrap, { paddingBottom: bottomReserve }]}>
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
          {/* Escenario: centra la animación en el espacio del lienzo. */}
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
                  visibleMetas.map((m, i) => {
                    const { iid, geo: g } = m;
                    const s = getSettings(iid);
                    const isDragging = iid === pinchTargetId && liveDragPos != null;
                    const tx = isDragging ? liveDragPos.x : (s.offsetX ?? 0);
                    const ty = isDragging ? liveDragPos.y : (s.offsetY ?? 0);
                    return (
                    // Wrapper con salida en fade out: al deseleccionar la
                    // geometría, la capa se desvanece antes de desmontarse (la
                    // entrada la maneja el `enter` interno de GeometryLayer).
                    <Animated.View
                      key={iid}
                      exiting={FadeOut.duration(600)}
                      style={[styles.layer, (tx || ty) ? { transform: [{ translateX: tx }, { translateY: ty }] } : null]}
                      pointerEvents="none"
                    >
                      <GeometryLayer
                        geo={g}
                        index={i}
                        size={layerSize}
                        settings={s}
                        liveZoom={
                          iid === pinchTargetId && livePinchNum != null
                            ? livePinchNum
                            : undefined
                        }
                        liveAngle={
                          iid === pinchTargetId && liveRotNum != null
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
                        source={require("@/assets/images/geometrix/cubo-3.png")}
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

          {/* Refresh (actualizar composición) — lado izquierdo, espejo de
              actionTop. El borrar lienzo vive ahora en el desplegable. */}
          <Animated.View
            pointerEvents={hasActive ? "auto" : "none"}
            style={[styles.actionLeft, trashAnimStyle]}
          >
            <View style={styles.actionTopRow}>
              {editingCreation && isDirty && (
                <Animated.View
                  entering={FadeIn.duration(260)}
                  exiting={FadeOut.duration(180)}
                  style={{ flexDirection: "row", alignItems: "center" }}
                >
                  <Pressable
                    onPress={updateComposition}
                    style={styles.actionTopBtn}
                    accessibilityRole="button"
                    accessibilityLabel="Actualizar composición"
                    hitSlop={4}
                  >
                    <Feather name="refresh-cw" size={16} color={colors.mutedForeground} />
                  </Pressable>
                </Animated.View>
              )}
            </View>
          </Animated.View>

          {/* Fila de controles arriba a la derecha: ajustes + flecha drop-down.
              Vive fuera del "stage" como overlay absoluto de canvasWrap. */}
          <View style={styles.actionTop}>
            {/* Header: solo la flecha desplegable. Los ajustes generales viven
                ahora como primera opción dentro del desplegable. */}
            <View style={styles.actionTopRow}>
              <Pressable
                onPress={() => setPillOpen((o) => !o)}
                style={styles.actionTopBtn}
                accessibilityRole="button"
                accessibilityLabel={pillOpen ? "Ocultar acciones" : "Mostrar acciones"}
                hitSlop={4}
              >
                <Feather
                  name={pillOpen ? "chevron-up" : "chevron-down"}
                  size={16}
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
                    {a.gradient ? (
                      <GoldSlidersIcon size={18} />
                    ) : (
                      <Feather name={a.icon} size={18} color={colors.mutedForeground} />
                    )}
                  </Pressable>
                </React.Fragment>
              ))}
            </Animated.View>
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
                const s = getSettings(iid);
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
                    {/* Flechita: abre ajustes personalizados directamente. */}
                    <Pressable
                      onPress={() => {
                        setSelectedId(iid);
                        setSettingsGeoId(iid);
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
            {visibleMetas.map((m, i) => (
              <GeometryLayer
                key={m.iid}
                geo={m.geo}
                index={i}
                size={immersiveSize}
                settings={getSettings(m.iid)}
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
                  <Feather name="sliders" size={18} color="#FFFFFF" />
                  <Text style={[styles.menuItemText, { color: "#FFFFFF" }]}>Personalizar</Text>
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
                    color="#FFFFFF"
                  />
                  <Text style={[styles.menuItemText, { color: "#FFFFFF" }]}>
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
                  <Feather name="trash-2" size={18} color="#8a4646" />
                  <Text style={[styles.menuItemText, { color: "#8a4646" }]}>Quitar</Text>
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
              {activeMetas.map((m, i) => (
                <GeometryLayer
                  key={m.iid}
                  geo={m.geo}
                  index={i}
                  size={generalPreviewSize * 0.96}
                  settings={getSettings(m.iid)}
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
              const allOn = activeMetas.every((m) => getSettings(m.iid).kaleidoscope === true);
              const anyOn = activeMetas.some((m) => getSettings(m.iid).kaleidoscope === true);
              const segs  = getSettings(activeMetas[0].iid).kaleidSegments ?? 6;
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
                        activeMetas.forEach((m) => updateSetting(m.iid, "kaleidoscope", v));
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
              {visibleMetas.map((m, i) => (
                <GeometryLayer
                  key={m.iid}
                  geo={m.geo}
                  index={i}
                  size={previewSize * 0.96}
                  settings={getSettings(m.iid)}
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
                      color={colors.mutedForeground}
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
                    <Feather name="copy" size={18} color={colors.mutedForeground} />
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
              const iid = settingsGeoId!;
              const s = getSettings(iid);
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
                      onChange={(v) => updateSetting(iid, "kaleidoscope", v)}
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

                  {/* Toggles (on/off) en cuadrícula 2 cols: etiqueta izq, switch der */}
                  <View style={styles.toggleGrid}>
                    <View style={styles.toggleGridItem}>
                      <Text style={styles.toggleTriLabel} numberOfLines={2}>
                        Fade
                      </Text>
                      <Toggle
                        value={s.fadeLoop}
                        onChange={(v) => updateSetting(iid, "fadeLoop", v)}
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
                          updateSetting(iid, "rotateLeft", v);
                          if (v) updateSetting(iid, "rotate", false);
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
                        onChange={(v) => updateSetting(iid, "breathe", v)}
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
                          updateSetting(iid, "rotate", v);
                          if (v) updateSetting(iid, "rotateLeft", false);
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
                            updateSetting(iid, "color", c);
                            updateSetting(iid, "gradientId", null);
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
                              iid,
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
                    onChange={(v) => updateSetting(iid, "opacity", Math.max(0, v))}
                    color="#FFFFFF"
                    trackColor="rgba(255,255,255,0.12)"
                  />

                  {/* Grosor */}
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Grosor</Text>
                  </View>
                  <VolumeSlider
                    value={s.thickness}
                    onChange={(v) => updateSetting(iid, "thickness", v)}
                    color="#FFFFFF"
                    trackColor="rgba(255,255,255,0.12)"
                  />

                  {/* Tamaño */}
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Tamaño</Text>
                  </View>
                  <VolumeSlider
                    value={s.scale}
                    onChange={(v) => updateSetting(iid, "scale", v)}
                    color="#FFFFFF"
                    trackColor="rgba(255,255,255,0.12)"
                  />

                  {/* Glow propio */}
                  <View style={styles.fieldRow}>
                    <Text style={styles.fieldLabel}>Glow</Text>
                  </View>
                  <VolumeSlider
                    value={s.glow}
                    onChange={(v) => updateSetting(iid, "glow", v)}
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
    marginBottom: 0,
    paddingHorizontal: 20,
  },
  headerText: { flex: 1, paddingRight: 12 },
  // Título + logo cubo-3 en línea; el logo a la altura del texto del título.
  titleRow: { flexDirection: "row", alignItems: "center" },
  titleLogo: { width: 26, height: 26, marginRight: 6, opacity: 0.92 },
  title: { fontSize: 25, fontWeight: "700", color: "#FFFFFF", letterSpacing: 0.3 },
  subtitle: { fontSize: 13, color: colors.mutedForeground, marginTop: 3 },

  // ── Botón "tema de fondo" (top-right del header) ──
  // Círculo sin relleno, borde punteado celeste (= mutedForeground) con ícono de
  // sonido al centro. Al estar sonando, un tinte celeste sutil lo marca activo.
  themeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderStyle: "dotted",
    borderColor: colors.mutedForeground,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    backgroundColor: "transparent",
  },
  themeBtnOn: { backgroundColor: hexAlpha("#7A8FA8", 0.12) },

  // ── Buscador de tema de fondo (modal) ──
  themeSheet: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#0B0F14",
    paddingHorizontal: 20,
  },
  themeHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  themeTitle: { fontSize: 20, fontWeight: "700", color: colors.foreground },
  themeSub: { fontSize: 13, color: colors.mutedForeground, marginTop: 4, marginBottom: 14 },
  themeSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 44,
  },
  themeSearchInput: { flex: 1, fontSize: 15, color: colors.foreground, paddingVertical: 0 },
  themeResults: { marginTop: 12, flex: 1 },
  themeHint: { color: colors.mutedForeground, fontSize: 13, textAlign: "center", marginTop: 24 },
  themeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 12,
  },
  themeRowOn: { backgroundColor: hexAlpha("#BE9650", 0.08) },
  themeStopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 11,
    paddingHorizontal: 10,
    borderRadius: 12,
    backgroundColor: hexAlpha("#BE9650", 0.1),
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
  themeRowTitle: { fontSize: 14, fontWeight: "600", color: colors.foreground },
  themeRowSub: { fontSize: 12, color: colors.mutedForeground, marginTop: 2 },

  grid: { flexGrow: 0, marginTop: -25 },
  gridContent: { paddingTop: 36, paddingBottom: 2, paddingLeft: 0, paddingRight: 20 },
  // Sin `gap`: las animaciones de layout (LinearTransition) miden mal el reordenamiento
  // con `gap` (el tile no vuelve a su lugar al deseleccionar). Se usa margen por tile.
  gridRow: { flexDirection: "row" },
  tileWrap: { marginRight: 8 },
  tileRest: { transform: [{ translateX: 0 }, { scale: 1 }] },
  tileDragging: { zIndex: 50, elevation: 8 },
  tileTitle: {
    position: "absolute",
    bottom: "100%",
    left: -8,
    right: -8,
    marginBottom: 6,
    textAlign: "center",
    fontSize: 11,
    fontWeight: "700",
    color: colors.foreground,
  },
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
    marginTop: 5,
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
    transform: [{ translateY: -3 }],
  },
  canvas: {
    alignItems: "center",
    justifyContent: "center",
  },
  layer: { ...StyleSheet.absoluteFillObject, alignItems: "center", justifyContent: "center" },

  actionTop: {
    position: "absolute",
    top: 0,
    right: -19,
    zIndex: 6,
    flexDirection: "column",
    alignItems: "flex-end",
  },
  actionLeft: {
    position: "absolute",
    top: 0,
    left: -21,
    zIndex: 6,
    flexDirection: "column",
    alignItems: "flex-start",
  },
  actionTopRow: {
    flexDirection: "row",
    alignItems: "center",
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
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "transparent",
    paddingVertical: 1,
    paddingHorizontal: 1,
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
    shadowColor: "#BE9650",
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
  emptyText: { fontSize: 14, fontWeight: "600", color: "#FFFFFF", marginTop: 4 },
  emptySub: { fontSize: 12, color: colors.mutedForeground },

});
