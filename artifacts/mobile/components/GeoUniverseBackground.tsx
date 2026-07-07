import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, StyleSheet, View } from "react-native";

import { SacredGlyph } from "@/components/SacredGlyph";
import type { GeometryId } from "@/data/geometries";
import { useGeoUniverse } from "@/context/GeoUniverseContext";

const { height: H } = Dimensions.get("window");

interface GlyphConfig {
  id: GeometryId;
  size: number;
  pos: { top?: number; bottom?: number; left?: number; right?: number };
  /** Retraso inicial antes del primer ciclo (ms) */
  delay: number;
  /** Tiempo visible en pantalla (ms) */
  visibleMs: number;
  /** Tiempo oculto entre ciclos (ms) */
  hiddenMs: number;
  /** Duración de una vuelta completa (ms). 0 = sin rotación */
  spinMs: number;
  spinDir: 1 | -1;
}

const CONFIGS: GlyphConfig[] = [
  {
    id: "flor-vida",
    size: 230,
    pos: { top: -50, right: -65 },
    delay: 0,
    visibleMs: 14000,
    hiddenMs: 7000,
    spinMs: 65000,
    spinDir: 1,
  },
  {
    id: "metatron",
    size: 200,
    pos: { bottom: 90, left: -70 },
    delay: 6000,
    visibleMs: 12000,
    hiddenMs: 10000,
    spinMs: 82000,
    spinDir: -1,
  },
  {
    id: "mandala",
    size: 170,
    pos: { top: H * 0.38, right: -45 },
    delay: 13000,
    visibleMs: 10000,
    hiddenMs: 12000,
    spinMs: 55000,
    spinDir: 1,
  },
  {
    id: "vesica",
    size: 185,
    pos: { top: H * 0.18, left: -55 },
    delay: 8000,
    visibleMs: 11000,
    hiddenMs: 9000,
    spinMs: 0,
    spinDir: 1,
  },
  {
    id: "espiral-fibonacci",
    size: 155,
    pos: { bottom: 160, right: -35 },
    delay: 17000,
    visibleMs: 9000,
    hiddenMs: 11000,
    spinMs: 72000,
    spinDir: 1,
  },
];

function GlyphParticle({ cfg }: { cfg: GlyphConfig }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const rot     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let cancelled = false;

    // Rotación continua (sin relación con la visibilidad)
    const spinAnim = cfg.spinMs > 0
      ? Animated.loop(
          Animated.timing(rot, {
            toValue: 1,
            duration: cfg.spinMs,
            easing: Easing.linear,
            useNativeDriver: true,
          })
        )
      : null;
    spinAnim?.start();

    // Ciclo: aparecer → pausa → desaparecer → pausa → repetir
    // Usamos "animación de valor estático" para la pausa (evita Animated.delay
    // que no garantiza useNativeDriver en todas las versiones de RN).
    const runCycle = () => {
      Animated.sequence([
        // Fade in
        Animated.timing(opacity, { toValue: 0.35, duration: 4000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        // Pausa visible (anima al mismo valor → sin cambio visual)
        Animated.timing(opacity, { toValue: 0.35, duration: cfg.visibleMs, useNativeDriver: true }),
        // Fade out
        Animated.timing(opacity, { toValue: 0,    duration: 3500, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        // Pausa oculto
        Animated.timing(opacity, { toValue: 0,    duration: cfg.hiddenMs, useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished && !cancelled) runCycle();
      });
    };

    // Retraso inicial para escalonar los glyphs
    const tId = setTimeout(() => {
      if (!cancelled) runCycle();
    }, cfg.delay);

    return () => {
      cancelled = true;
      clearTimeout(tId);
      spinAnim?.stop();
      opacity.stopAnimation();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const rotDeg = rot.interpolate({
    inputRange:  [0, 1],
    outputRange: ["0deg", `${360 * cfg.spinDir}deg`],
  });

  return (
    <Animated.View
      style={[
        { position: "absolute", ...cfg.pos },
        {
          opacity,
          transform: cfg.spinMs > 0 ? [{ rotate: rotDeg }] : [],
        },
      ]}
      pointerEvents="none"
    >
      <SacredGlyph
        id={cfg.id}
        color="#FFFFFF"
        size={cfg.size}
        strokeScale={0.65}
      />
    </Animated.View>
  );
}

export function GeoUniverseBackground() {
  const { enabled } = useGeoUniverse();
  if (!enabled) return null;
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {CONFIGS.map((cfg) => (
        <GlyphParticle key={cfg.id} cfg={cfg} />
      ))}
    </View>
  );
}
