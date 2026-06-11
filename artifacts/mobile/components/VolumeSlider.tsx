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
// Umbral de emisión: durante el arrastre solo se llama onChange cuando la
// fracción se movió al menos esto desde la última emisión. El thumb sigue al
// dedo a 60 fps (hilo UI, SharedValue) pase lo que pase; lo que se acota es el
// número de re-renders de React (setState → re-render del componente padre).
// 0.01 = a lo sumo ~100 emisiones a lo largo de toda la pista (imperceptible en
// el preview) en vez de una por frame. NO se usa reloj en el worklet (Date.now/
// performance.now no son fiables ahí); el gate es puramente por delta.
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
 */
export function VolumeSlider({ value, onChange, color, trackColor }: Props) {
  const fraction = useSharedValue(value);
  const trackWidth = useSharedValue(1);
  // Última fracción EMITIDA a React (gate de throttle). Se reinicia en cada
  // onBegin, así que su valor entre arrastres no importa.
  const lastEmit = useSharedValue(value);
  // Flag en hilo JS: indica si el usuario está arrastrando. Se setea/limpia vía
  // runOnJS (no en el hilo UI) para quedar FIFO-ordenado respecto a los ecos de
  // onChange: al soltar, endDrag corre DESPUÉS de todos los ecos en cola, así
  // ningún eco stale se cuela tras limpiar el flag (race post-release).
  const draggingRef = React.useRef(false);
  const startDrag = React.useCallback(() => {
    draggingRef.current = true;
  }, []);
  const endDrag = React.useCallback(() => {
    draggingRef.current = false;
  }, []);

  // onChange en un ref + dispatcher estable: el gesto (useMemo abajo) NO se
  // reconstruye cuando el padre re-renderiza por frame durante el arrastre. Si
  // el gesto se rearmara con un onChange inline nuevo, el GestureDetector
  // cambiaría el handler activo a mitad de gesto → stutter/rebote.
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;
  const emit = React.useCallback((v: number) => {
    onChangeRef.current(v);
  }, []);

  // Sincroniza el prop externo SOLO cuando el cambio viene de fuera (p. ej. el
  // botón "restablecer"). Mientras se arrastra no se toca (draggingRef) para no
  // pelear con el gesto, y al soltar se ignoran los ecos de nuestro propio
  // onChange (el prop ya coincide con la posición del thumb) → sin rebote.
  useEffect(() => {
    if (draggingRef.current) return;
    if (Math.abs(value - fraction.value) > 0.001) {
      fraction.value = value;
    }
  }, [value, fraction]);

  // El gesto se construye UNA sola vez (deps estables: callbacks y SharedValues).
  const gesture = React.useMemo(
    () =>
      Gesture.Pan()
        .minDistance(0)
        .onBegin((e) => {
          runOnJS(startDrag)();
          // e.x es local al GestureDetector; la pista empieza en TRACK_PAD
          const raw = (e.x - TRACK_PAD) / trackWidth.value;
          const f = Math.min(1, Math.max(0, raw));
          fraction.value = f;
          lastEmit.value = f;
          runOnJS(emit)(f);
        })
        .onUpdate((e) => {
          const raw = (e.x - TRACK_PAD) / trackWidth.value;
          const f = Math.min(1, Math.max(0, raw));
          fraction.value = f; // hilo UI: el thumb siempre fluido
          // Throttle por delta: solo cruzamos a JS (setState → re-render) cuando
          // el valor cambió lo suficiente. Acota los re-renders sin afectar el
          // movimiento visual del thumb.
          if (Math.abs(f - lastEmit.value) >= EMIT_EPS) {
            lastEmit.value = f;
            runOnJS(emit)(f);
          }
        })
        .onFinalize(() => {
          // Emisión final garantizada: el valor comprometido coincide con la
          // posición exacta del thumb (si el último delta no llegó al umbral).
          // Va ANTES de endDrag para preservar el orden FIFO anti-rebote: cuando
          // endDrag limpia el flag, el prop `value` ya igualó al thumb.
          if (fraction.value !== lastEmit.value) {
            lastEmit.value = fraction.value;
            runOnJS(emit)(fraction.value);
          }
          runOnJS(endDrag)();
        }),
    [emit, startDrag, endDrag, fraction, trackWidth, lastEmit],
  );

  // Píxeles absolutos + translateX en lugar de porcentajes → sin pase de
  // layout por frame → cero flicker en el thumb circular.
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
