/**
 * GhostPill — contenedor en forma de píldora con borde de luz asimétrica.
 * Al tocar (cualquier elemento adentro o el propio pill) anima: scale up + flash blanco.
 */
import React, { useId, useRef, useState } from "react";
import { Animated, StyleSheet, View, ViewStyle } from "react-native";
import { DURATION, easeOutCubic } from "@/constants/motion";
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Rect,
  Stop,
} from "react-native-svg";

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
  noBorder?: boolean;
}

export function GhostPill({ children, style, noBorder = false }: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const rawId = useId();
  const gradId = `ghostPill-${rawId.replace(/:/g, "")}`;

  const scale  = useRef(new Animated.Value(1)).current;
  const bright = useRef(new Animated.Value(0)).current;

  // Separa transform del resto del style para fusionarlo con la animación de scale
  const { transform: styleTransform, ...restStyle } = (style ?? {}) as ViewStyle & { transform?: object[] };

  function animateIn() {
    Animated.parallel([
      Animated.timing(scale,  { toValue: 0.97, duration: DURATION.BUTTON_PRESS,   easing: easeOutCubic, useNativeDriver: true }),
      Animated.timing(bright, { toValue: 1,    duration: DURATION.BUTTON_PRESS,   easing: easeOutCubic, useNativeDriver: true }),
    ]).start();
  }

  function animateOut() {
    Animated.parallel([
      Animated.timing(scale,  { toValue: 1, duration: DURATION.BUTTON_RELEASE, easing: easeOutCubic, useNativeDriver: true }),
      Animated.timing(bright, { toValue: 0, duration: DURATION.FADE,           easing: easeOutCubic, useNativeDriver: true }),
    ]).start();
  }

  const sw = 1.5;
  const radius = size.h / 2;
  const gradId2 = `${gradId}-b`;

  return (
    <Animated.View
      style={[styles.wrap, restStyle, { transform: [...(styleTransform ?? []), { scale }] }]}
      onTouchStart={animateIn}
      onTouchEnd={animateOut}
      onTouchCancel={animateOut}
      onLayout={(e) =>
        setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })
      }
    >
      {!noBorder && size.w > 0 && size.h > 0 && (
        <Svg
          width={size.w}
          height={size.h}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <Defs>
            <SvgLinearGradient id={gradId} x1="0" y1="0" x2="0.65" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.22} />
              <Stop offset="0.4" stopColor="#FFFFFF" stopOpacity={0.05} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.01} />
            </SvgLinearGradient>
            <SvgLinearGradient id={gradId2} x1="1" y1="1" x2="0.3" y2="0">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.08} />
              <Stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0.02} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
            </SvgLinearGradient>
          </Defs>
          <Rect
            x={sw / 2} y={sw / 2}
            width={size.w - sw} height={size.h - sw}
            rx={radius} ry={radius}
            fill="none" stroke={`url(#${gradId})`} strokeWidth={sw}
          />
          <Rect
            x={sw / 2} y={sw / 2}
            width={size.w - sw} height={size.h - sw}
            rx={radius} ry={radius}
            fill="none" stroke={`url(#${gradId2})`} strokeWidth={sw}
          />
        </Svg>
      )}
      {/* Flash blanco al tocar */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: 999, backgroundColor: "rgba(255,255,255,0.18)", opacity: bright },
        ]}
      />
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 2,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "rgba(190,150,80,0.06)",
  },
});
