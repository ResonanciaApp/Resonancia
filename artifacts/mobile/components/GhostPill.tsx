/**
 * GhostPill — contenedor en forma de píldora con borde de luz asimétrica.
 * El trazo se dibuja con un degradado SVG (centro transparente) para simular
 * luz que llega con más fuerza por arriba/izquierda y se desvanece hacia
 * abajo/derecha, dando un efecto "ghost".
 */
import React, { useId, useState } from "react";
import { StyleSheet, View, ViewStyle } from "react-native";
import Svg, {
  Defs,
  LinearGradient as SvgLinearGradient,
  Rect,
  Stop,
} from "react-native-svg";

interface Props {
  children: React.ReactNode;
  style?: ViewStyle;
}

export function GhostPill({ children, style }: Props) {
  const [size, setSize] = useState({ w: 0, h: 0 });
  const rawId = useId();
  const gradId = `ghostPill-${rawId.replace(/:/g, "")}`;

  const sw = 1.5; // grosor del trazo
  const radius = size.h / 2;
  const gradId2 = `${gradId}-b`;

  return (
    <View
      style={[styles.wrap, style]}
      onLayout={(e) =>
        setSize({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })
      }
    >
      {size.w > 0 && size.h > 0 && (
        <Svg
          width={size.w}
          height={size.h}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <Defs>
            {/* Luz principal: entra por arriba/izquierda */}
            <SvgLinearGradient id={gradId} x1="0" y1="0" x2="0.65" y2="1">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.22} />
              <Stop offset="0.4" stopColor="#FFFFFF" stopOpacity={0.05} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0.01} />
            </SvgLinearGradient>
            {/* Luz secundaria sutil: roza la esquina derecha y un poco abajo */}
            <SvgLinearGradient id={gradId2} x1="1" y1="1" x2="0.3" y2="0">
              <Stop offset="0" stopColor="#FFFFFF" stopOpacity={0.08} />
              <Stop offset="0.45" stopColor="#FFFFFF" stopOpacity={0.02} />
              <Stop offset="1" stopColor="#FFFFFF" stopOpacity={0} />
            </SvgLinearGradient>
          </Defs>
          <Rect
            x={sw / 2}
            y={sw / 2}
            width={size.w - sw}
            height={size.h - sw}
            rx={radius}
            ry={radius}
            fill="none"
            stroke={`url(#${gradId})`}
            strokeWidth={sw}
          />
          <Rect
            x={sw / 2}
            y={sw / 2}
            width={size.w - sw}
            height={size.h - sw}
            rx={radius}
            ry={radius}
            fill="none"
            stroke={`url(#${gradId2})`}
            strokeWidth={sw}
          />
        </Svg>
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 2,
    borderRadius: 999,
    backgroundColor: "rgba(255,255,255,0.02)",
  },
});
