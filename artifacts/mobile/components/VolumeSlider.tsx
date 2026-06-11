import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedReaction,
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
 * Slider horizontal (0–1) que corre íntegramente en el UI thread mediante
 * Gesture.Pan() + useSharedValue. No hay lag ni microlag de JS thread.
 *
 * Anti-rebote: `isDragging` es un SharedValue (UI thread), no un React.ref
 * (JS thread). La reacción que sincroniza el prop externo se ejecuta en el
 * mismo hilo que el gesto, por lo que no hay race condition entre el worklet
 * que pone isDragging=1 y el useEffect del prop que llega en un tick posterior.
 */
export function VolumeSlider({ value, onChange, color, trackColor }: Props) {
  const fraction = useSharedValue(value);
  const trackWidth = useSharedValue(1);
  const lastEmit = useSharedValue(value);

  // UI-thread drag flag. Se pone a 1 en onBegin (worklet) ANTES de que se
  // encole ningún runOnJS(emit) → la reacción abajo nunca ve un cambio externo
  // mientras se arrastra. Se limpia a 0 en onFinalize (worklet).
  const isDragging = useSharedValue(0);

  // Espejo del prop `value` en el UI thread para que la reacción pueda
  // comparar sin cruzar al JS thread.
  const externalFraction = useSharedValue(value);
  useEffect(() => {
    externalFraction.value = value;
  }, [value, externalFraction]);

  // Sincroniza cambios externos (p. ej. botón "restablecer") SOLO cuando el
  // usuario no está arrastrando. Corre en el UI thread → garantizado que lee
  // el isDragging actualizado por el gesto en el mismo hilo.
  useAnimatedReaction(
    () => externalFraction.value,
    (next, prev) => {
      if (
        isDragging.value === 0 &&
        prev !== null &&
        Math.abs(next - fraction.value) > 0.001
      ) {
        fraction.value = next;
      }
    },
    [fraction, isDragging],
  );

  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;
  const emit = React.useCallback((v: number) => {
    onChangeRef.current(v);
  }, []);

  // Limpia el flag en el hilo JS, después de que todos los runOnJS(emit) de
  // onUpdate hayan corrido (FIFO). Si se limpiara en el worklet (UI thread),
  // quedaría a 0 ANTES de que las emisiones pendientes lleguen al JS thread;
  // la reacción las procesaría con isDragging=0 y snapearía fraction.value
  // a cada valor intermedio → bounce visible en releases rápidos.
  const clearDragging = React.useCallback(() => {
    isDragging.value = 0;
  }, [isDragging]);

  const gesture = React.useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .onBegin((e) => {
          isDragging.value = 1; // worklet (UI thread) — inmediato, antes de cualquier runOnJS
          const raw = (e.x - TRACK_PAD) / trackWidth.value;
          const f = Math.min(1, Math.max(0, raw));
          fraction.value = f;
          lastEmit.value = f;
          runOnJS(emit)(f);
        })
        .onUpdate((e) => {
          const raw = (e.x - TRACK_PAD) / trackWidth.value;
          const f = Math.min(1, Math.max(0, raw));
          fraction.value = f;
          if (Math.abs(f - lastEmit.value) >= EMIT_EPS) {
            lastEmit.value = f;
            runOnJS(emit)(f);
          }
        })
        .onFinalize(() => {
          if (fraction.value !== lastEmit.value) {
            lastEmit.value = fraction.value;
            runOnJS(emit)(fraction.value); // encola ANTES que clearDragging (FIFO)
          }
          runOnJS(clearDragging)(); // FIFO: corre después de todos los emit pendientes
        }),
    [emit, clearDragging, isDragging, fraction, trackWidth, lastEmit],
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
