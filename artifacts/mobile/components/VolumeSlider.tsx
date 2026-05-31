import React, { useCallback, useRef } from "react";
import {
  type GestureResponderEvent,
  type LayoutChangeEvent,
  StyleSheet,
  View,
} from "react-native";

function clamp01(n: number): number {
  if (n < 0) return 0;
  if (n > 1) return 1;
  return n;
}

type Props = {
  value: number;
  onChange: (value: number) => void;
  /** Color de relleno y thumb */
  color: string;
  /** Color del track de fondo */
  trackColor: string;
};

/**
 * Slider horizontal de volumen (0–1) basado en el responder system,
 * replicando el patrón usado en app/player.tsx (sin dependencias externas).
 */
export function VolumeSlider({ value, onChange, color, trackColor }: Props) {
  const trackRef = useRef<View>(null);
  const widthRef = useRef(0);
  const pageXRef = useRef(0);

  const handleGrant = useCallback(
    (e: GestureResponderEvent) => {
      trackRef.current?.measure((_x, _y, _w, _h, px) => {
        pageXRef.current = px;
        onChange(clamp01((e.nativeEvent.pageX - px) / (widthRef.current || 1)));
      });
    },
    [onChange],
  );

  const handleMove = useCallback(
    (e: GestureResponderEvent) => {
      onChange(clamp01((e.nativeEvent.pageX - pageXRef.current) / (widthRef.current || 1)));
    },
    [onChange],
  );

  return (
    <View
      ref={trackRef}
      style={styles.hitArea}
      onLayout={(e: LayoutChangeEvent) => {
        widthRef.current = e.nativeEvent.layout.width;
      }}
      onStartShouldSetResponder={() => true}
      onMoveShouldSetResponder={() => true}
      onResponderGrant={handleGrant}
      onResponderMove={handleMove}
    >
      <View style={[styles.track, { backgroundColor: trackColor }]}>
        <View
          pointerEvents="none"
          style={[styles.fill, { width: `${value * 100}%`, backgroundColor: color }]}
        />
        <View
          pointerEvents="none"
          style={[styles.thumb, { left: `${value * 100}%`, backgroundColor: color }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hitArea: {
    paddingVertical: 10,
    justifyContent: "center",
  },
  track: {
    height: 6,
    borderRadius: 3,
    justifyContent: "center",
  },
  fill: {
    position: "absolute",
    left: 0,
    height: 6,
    borderRadius: 3,
  },
  thumb: {
    position: "absolute",
    width: 16,
    height: 16,
    borderRadius: 8,
    marginLeft: -8,
    top: -5,
  },
});
