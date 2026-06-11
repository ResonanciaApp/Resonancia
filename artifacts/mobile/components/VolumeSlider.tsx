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
 * Anti-rebote: `lastEmitRef` es un useRef JS-puro (no SharedValue). Se
 * actualiza en `emit` (hilo JS) ANTES de llamar a `onChange`, así que cuando
 * React re-renderiza con el nuevo `value` prop y el useEffect compara, el ref
 * ya vale exactamente lo que acabamos de emitir → diff = 0 → skip.
 *
 * Un SharedValue leído en useEffect sufre una ventana de inconsistencia
 * cross-thread (el hilo UI puede haber avanzado más que la copia JS), lo que
 * produce el rebote. El useRef no tiene ese problema porque vive sólo en JS.
 *
 * `lastEmitSV` sigue siendo un SharedValue sólo para el throttle de onUpdate
 * (comparación dentro del worklet, en el hilo UI).
 */
export function VolumeSlider({ value, onChange, color, trackColor }: Props) {
  const fraction = useSharedValue(value);
  const trackWidth = useSharedValue(1);

  // UI-thread throttle: evitar runOnJS excesivos durante el arrastre
  const lastEmitSV = useSharedValue(value);
  // JS-thread echo-guard: previene que useEffect sincronice el thumb con sus
  // propios ecos. DEBE ser useRef (JS-puro) — un SharedValue aquí introduce
  // la race cross-thread que causaba el rebote.
  const lastEmitRef = useRef(value);

  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const emit = React.useCallback((v: number) => {
    // Actualizar ANTES de onChange para que cuando React re-renderice con el
    // nuevo value, el useEffect vea lastEmitRef.current === value → skip.
    lastEmitRef.current = v;
    onChangeRef.current(v);
  }, []);

  // Sincroniza el thumb sólo cuando el padre cambia el valor externamente
  // (p. ej. "restablecer"). Durante el arrastre, value === lastEmitRef.current
  // → diff ≈ 0 → skip. Sin races posibles porque todo corre en el hilo JS.
  useEffect(() => {
    if (Math.abs(value - lastEmitRef.current) > 0.001) {
      fraction.value = value;
      lastEmitRef.current = value;
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
          runOnJS(emit)(f);
        })
        .onUpdate((e) => {
          const raw = (e.x - TRACK_PAD) / trackWidth.value;
          const f = Math.min(1, Math.max(0, raw));
          fraction.value = f;
          if (Math.abs(f - lastEmitSV.value) >= EMIT_EPS) {
            lastEmitSV.value = f;
            runOnJS(emit)(f);
          }
        })
        .onFinalize(() => {
          const f = fraction.value;
          // Siempre emitir el valor final: garantiza que el padre quede en sync
          // aunque onUpdate no haya llegado a emitir el último valor (por el
          // throttle EMIT_EPS). El eco de este emit llegará con
          // lastEmitRef.current === f → useEffect → skip. Sin rebote.
          lastEmitSV.value = f;
          runOnJS(emit)(f);
        }),
    [emit, fraction, trackWidth, lastEmitSV],
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
