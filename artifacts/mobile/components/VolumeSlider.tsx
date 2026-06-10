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

  // Sincroniza el prop externo cuando el padre resetea el valor
  useEffect(() => {
    fraction.value = value;
  }, [value, fraction]);

  const gesture = Gesture.Pan()
    .minDistance(0)
    .onBegin((e) => {
      // e.x es local al GestureDetector; la pista empieza en TRACK_PAD
      const raw = (e.x - TRACK_PAD) / trackWidth.value;
      fraction.value = Math.min(1, Math.max(0, raw));
      runOnJS(onChange)(fraction.value);
    })
    .onUpdate((e) => {
      const raw = (e.x - TRACK_PAD) / trackWidth.value;
      fraction.value = Math.min(1, Math.max(0, raw));
      runOnJS(onChange)(fraction.value);
    });

  const fillStyle = useAnimatedStyle(() => ({
    width: `${fraction.value * 100}%` as `${number}%`,
  }));

  const thumbStyle = useAnimatedStyle(() => ({
    left: `${fraction.value * 100}%` as `${number}%`,
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
    marginLeft: -(THUMB_SIZE / 2),
    top: -(THUMB_SIZE / 2 - 1),
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
    elevation: 4,
  },
});
