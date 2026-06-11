import React, { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated";

const TRACK_PAD = 8;
const THUMB_SIZE = 14;
const EMIT_EPS = 0.01;

type Props = {
  value: number;
  onChange: (value: number) => void;
  color: string;
  trackColor: string;
};

/**
 * Slider horizontal (0–1) sin rebote.
 *
 * SOLUCIÓN AL REBOTE:
 * La causa era que dos runOnJS (uno de onUpdate y uno de onFinalize) podían
 * correr en el mismo tick de JS antes de cualquier render de React. Cualquier
 * intento de comparar "lo que emitimos" con "lo que recibimos de vuelta" fallaba
 * porque el ref ya apuntaba al valor final cuando React renderizaba el valor
 * intermedio.
 *
 * Fix: `gestureActive.current` (useRef JS-puro) bloquea el useEffect durante
 * TODO el gesto. Se activa con `startGesture` (primer runOnJS de onBegin) y se
 * desactiva con `endGesture` (único runOnJS de onFinalize). FIFO garantizado por
 * RNGH → startGesture siempre corre antes que cualquier emit, endGesture siempre
 * corre después de todos los emits. Así:
 *   - Cualquier render de React con un valor intermedio encuentra
 *     gestureActive=true → useEffect skip ✓
 *   - El único render con gestureActive=false es el que usa el valor final →
 *     fraction.value ya es el valor final → diff=0 → skip ✓
 *   - Resets externos (p. ej. "restablecer") encuentran gestureActive=false y
 *     valor≠fracción → sync ✓
 */
export function VolumeSlider({ value, onChange, color, trackColor }: Props) {
  const fraction = useSharedValue(value);
  const trackWidth = useSharedValue(1);
  const lastEmitSV = useSharedValue(value);

  const gestureActive = useRef(false);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const startGesture = React.useCallback(() => {
    gestureActive.current = true;
  }, []);

  const emitLive = React.useCallback((v: number) => {
    onChangeRef.current(v);
  }, []);

  const endGesture = React.useCallback((v: number) => {
    gestureActive.current = false;
    onChangeRef.current(v);
  }, []);

  // Sincroniza el thumb solo en cambios EXTERNOS (reset de ajustes, etc.).
  // Durante el gesto gestureActive=true bloquea todos los renders intermedios.
  // Cuando gestureActive=false, fraction.value ya contiene el valor final del
  // gesto → diff≈0 → skip.
  useEffect(() => {
    if (!gestureActive.current && Math.abs(value - fraction.value) > 0.002) {
      fraction.value = value;
    }
  }, [value, fraction]);

  const gesture = React.useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .onBegin((e) => {
          const raw = (e.x - TRACK_PAD) / trackWidth.value;
          const f = Math.min(1, Math.max(0, raw));
          fraction.value = f;
          lastEmitSV.value = f;
          // startGesture DEBE ir primero (FIFO) para que gestureActive=true
          // esté activo antes de cualquier render provocado por emitLive.
          runOnJS(startGesture)();
          runOnJS(emitLive)(f);
        })
        .onUpdate((e) => {
          const raw = (e.x - TRACK_PAD) / trackWidth.value;
          const f = Math.min(1, Math.max(0, raw));
          fraction.value = f;
          if (Math.abs(f - lastEmitSV.value) >= EMIT_EPS) {
            lastEmitSV.value = f;
            runOnJS(emitLive)(f);
          }
        })
        .onFinalize(() => {
          const f = fraction.value;
          lastEmitSV.value = f;
          // endGesture DEBE ser el último runOnJS (FIFO): desactiva gestureActive
          // y emite el valor final en una sola llamada.
          runOnJS(endGesture)(f);
        }),
    [startGesture, emitLive, endGesture, fraction, trackWidth, lastEmitSV],
  );

  const fillStyle = useAnimatedStyle(() => ({
    width: fraction.value * trackWidth.value,
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: fraction.value * trackWidth.value - THUMB_SIZE / 2 }],
  }));

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={styles.hitArea}
        onLayout={(e) => {
          trackWidth.value = Math.max(1, e.nativeEvent.layout.width - TRACK_PAD * 2);
        }}
      >
        <View style={[styles.track, { backgroundColor: trackColor }]}>
          <Animated.View
            pointerEvents="none"
            style={[styles.fill, { backgroundColor: color }, fillStyle]}
          />
          <Animated.View
            pointerEvents="none"
            style={[styles.thumb, { backgroundColor: color }, thumbStyle]}
          />
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  hitArea: {
    paddingVertical: 18,
    paddingHorizontal: TRACK_PAD,
    justifyContent: "center",
  },
  track: {
    height: 2,
    borderRadius: 1,
    justifyContent: "center",
  },
  fill: {
    position: "absolute",
    left: 0,
    height: 2,
    borderRadius: 1,
    opacity: 0.5,
  },
  thumb: {
    position: "absolute",
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    top: -(THUMB_SIZE / 2 - 1),
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
});
