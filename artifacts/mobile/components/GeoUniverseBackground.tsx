/**
 * GeoUniverseBackground — fondo animado de geometrías sagradas.
 *
 * Usa el mismo sistema BgGlyph del perfil (rotación + respiración + fundido
 * cíclico) con una creación preset. Se activa/desactiva desde EscenasSheet
 * a través de GeoUniverseContext.
 */
import { useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Animated, AppState, Easing, StyleSheet, useWindowDimensions, View } from "react-native";

import { gradientColors, type GeoSettings } from "@/data/geometrix-creations";
import { type GeometryId } from "@/data/geometries";
import { SacredGlyph } from "@/components/SacredGlyph";
import { useGeoUniverse } from "@/context/GeoUniverseContext";

// ─── BgGlyph — copia fiel del componente en profile.tsx ──────────────────────
function BgGlyph({
  id,
  settings,
  masterOpacity,
  size,
  index,
  isActive,
}: {
  id: GeometryId;
  settings: GeoSettings;
  masterOpacity: number;
  size: number;
  index: number;
  isActive: boolean;
}) {
  const rot   = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const fade  = useRef(new Animated.Value(1)).current;

  const spinning     = settings.rotate || settings.rotateLeft;
  const dir          = settings.rotateLeft ? -1 : 1;
  const safeSpeed    = Number.isFinite(settings.rotateSpeed)
    ? Math.max(0, Math.min(1, settings.rotateSpeed)) : 0.5;
  const spinDuration = ((38000 + index * 6000) / (0.5 + safeSpeed * 2.5)) * 1.6;
  const safeAmount   = Number.isFinite(settings.breatheAmount)
    ? Math.max(0, Math.min(1, settings.breatheAmount)) : 0;
  const breatheDepth = 0.04 + safeAmount * 0.2;
  const safeScale    = Number.isFinite(settings.scale) ? settings.scale : 1;
  const safeZoom     = Number.isFinite(settings.zoom) && settings.zoom > 0 ? settings.zoom : 1;
  const safeThick    = Number.isFinite(settings.thickness) ? settings.thickness : 0;
  const userScale    = 0.4 + safeScale * 0.6;
  const glyphSize    = size * userScale * safeZoom;
  const base1px      = glyphSize > 0 ? 100 / glyphSize : 1;
  const sw           = base1px * (1 + safeThick * 5);

  useEffect(() => {
    if (isActive && spinning) {
      const a = Animated.loop(
        Animated.timing(rot, { toValue: 1, duration: spinDuration, easing: Easing.linear, useNativeDriver: true })
      );
      a.start();
      return () => a.stop();
    }
    rot.setValue(0);
  }, [isActive, spinning, spinDuration, rot]);

  useEffect(() => {
    if (isActive && (settings.breatheAmount ?? 0) > 0) {
      const a = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 6000 + index * 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 6000 + index * 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      a.start();
      return () => a.stop();
    }
    pulse.setValue(0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, (settings.breatheAmount ?? 0) > 0, index, pulse]);

  useEffect(() => {
    const fadeOn = (settings.fadeLoopAmount ?? 0) > 0;
    if (isActive && fadeOn) {
      const safeFadeAmt = Math.max(0, Math.min(1, settings.fadeLoopAmount ?? 0));
      const minOpacity  = 1 - safeFadeAmt * 0.85;
      const a = Animated.loop(
        Animated.sequence([
          Animated.timing(fade, { toValue: minOpacity, duration: 4000 + index * 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(fade, { toValue: 1,          duration: 4000 + index * 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      a.start();
      return () => a.stop();
    }
    fade.setValue(1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isActive, (settings.fadeLoopAmount ?? 0) > 0, index, fade]);

  const layerOpacity = Math.max(0.1, settings.opacity * masterOpacity);
  const rotDeg       = rot.interpolate({ inputRange: [0, 1], outputRange: [`${settings.manualAngle}deg`, `${settings.manualAngle + 360 * dir}deg`] });
  const scalePulse   = pulse.interpolate({ inputRange: [0, 1], outputRange: [1 - breatheDepth, 1] });

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          alignItems: "center",
          justifyContent: "center",
          opacity: (settings.fadeLoopAmount ?? 0) > 0
            ? Animated.multiply(fade, layerOpacity)
            : layerOpacity,
          transform: [
            { rotate: spinning ? rotDeg : `${settings.manualAngle}deg` },
            { scale:  (settings.breatheAmount ?? 0) > 0 ? scalePulse : 1 },
          ],
        },
      ]}
      pointerEvents="none"
    >
      <SacredGlyph
        id={id}
        color={settings.color}
        gradient={gradientColors(settings.gradientId)}
        size={glyphSize}
        strokeWidth={sw}
      />
    </Animated.View>
  );
}

// ─── Configuración preset (3 capas) ──────────────────────────────────────────
function makeSettings(overrides: Partial<GeoSettings>): GeoSettings {
  return {
    color: "#FFFFFF",
    gradientId: null,
    rotate: false,
    rotateLeft: false,
    rotateSpeed: 0.3,
    opacity: 0.25,
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
    ...overrides,
  };
}

const PRESET: Array<{ id: GeometryId; settings: GeoSettings; index: number }> = [
  {
    id: "flor-vida",
    settings: makeSettings({
      rotate:          true,
      rotateSpeed:     0.22,
      opacity:         0.28,
      breatheAmount:   0.35,
      fadeLoopAmount:  0.9,
      scale:           0.85,
      manualAngle:     0,
    }),
    index: 0,
  },
  {
    id: "metatron",
    settings: makeSettings({
      rotateLeft:      true,
      rotateSpeed:     0.18,
      opacity:         0.22,
      breatheAmount:   0,
      fadeLoopAmount:  1.0,
      scale:           0.6,
      manualAngle:     30,
    }),
    index: 3,
  },
  {
    id: "mandala",
    settings: makeSettings({
      rotate:          true,
      rotateSpeed:     0.12,
      opacity:         0.18,
      breatheAmount:   0.55,
      fadeLoopAmount:  0.75,
      scale:           0.42,
      manualAngle:     15,
    }),
    index: 5,
  },
];

// ─── Componente público ───────────────────────────────────────────────────────
export function GeoUniverseBackground({ paused = false }: { paused?: boolean }) {
  const { enabled } = useGeoUniverse();
  const { width }   = useWindowDimensions();
  const [isScreenFocused, setIsScreenFocused] = useState(false);
  const [appState, setAppState] = useState(AppState.currentState);
  const isActive = enabled && !paused && isScreenFocused && appState === "active";

  useFocusEffect(
    useCallback(() => {
      setIsScreenFocused(true);
      return () => setIsScreenFocused(false);
    }, []),
  );

  useEffect(() => {
    const subscription = AppState.addEventListener("change", setAppState);
    return () => subscription.remove();
  }, []);

  if (!enabled) return null;

  const glyphContainerSize = width * 0.96;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {PRESET.map((p) => (
        <BgGlyph
          key={p.id}
          id={p.id}
          settings={p.settings}
          masterOpacity={1}
          size={glyphContainerSize}
          index={p.index}
          isActive={isActive}
        />
      ))}
    </View>
  );
}
