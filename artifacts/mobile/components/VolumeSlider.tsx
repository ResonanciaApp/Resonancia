import React, { useEffect } from "react";
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
 * Slider horizontal (0–1) que corre íntegramente en el UI thread mediante
 * Gesture.Pan() + useSharedValue. No hay lag ni microlag de JS thread.
 *
 * Anti-rebote: comparamos el prop `value` con `lastEmit.value` en el useEffect.
 * Durante el arrastre, el padre refleja exactamente lo que emitimos → la
 * diferencia es ~0 y el efecto no toca fraction. Solo si un agente externo
 * (p. ej. "restablecer") cambia el valor a algo distinto de lo que emitimos,
 * el efecto sincroniza el thumb. Sin flags de hilo ni races posibles.
 */
export function VolumeSlider({ value, onChange, color, trackColor }: Props) {
  const fraction = useSharedValue(value);
  const trackWidth = useSharedValue(1);
  const lastEmit = useSharedValue(value);

  // Sincroniza cambios EXTERNOS al thumb. Durante el arrastre, `value` es el
  // eco de lo que acabamos de emitir → lastEmit.value ≈ value → skip.
  // Un reset externo (p. ej. botón "restablecer") produce value ≠ lastEmit →
  // se aplica.
  useEffect(() => {
    if (Math.abs(value - lastEmit.value) > 0.001) {
      fraction.value = value;
      lastEmit.value = value;
    }
  }, [value, fraction, lastEmit]);

  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;
  const emit = React.useCallback((v: number) => {
    onChangeRef.current(v);
  }, []);

  const gesture = React.useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .onBegin((e) => {
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
          if (Math.abs(fraction.value - lastEmit.value) > 0.001) {
            lastEmit.value = fraction.value;
            runOnJS(emit)(fraction.value);
          }
        }),
    [emit, fraction, trackWidth, lastEmit],
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
