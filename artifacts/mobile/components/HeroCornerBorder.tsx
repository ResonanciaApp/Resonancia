import React from "react";
import { StyleSheet } from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Path,
  Stop,
} from "react-native-svg";

type HeroCornerBorderProps = {
  width: number;
  height: number;
};

/**
 * A 1px outline outside the image, with independent light falling off from
 * each corner. Coordinates are inset half a pixel inside the SVG viewport so
 * the stroke never overlaps the image.
 */
export const HeroCornerBorder = React.memo(function HeroCornerBorder({
  width,
  height,
}: HeroCornerBorderProps) {
  if (width <= 0 || height <= 0) return null;

  const w = width + 2;
  const h = height + 2;
  const edge = 0.5;
  const corner = 22;
  const radius = corner - edge;
  const xRight = w - edge;
  const yBottom = h - edge;
  const xBeforeRight = w - corner;
  const yBeforeBottom = h - corner;
  const segments = [
    { id: "tl-top", opacity: 0.1, x1: corner, y1: edge, x2: w * 0.54, y2: edge, d: `M ${corner} ${edge} H ${w * 0.54}` },
    { id: "tr-top", opacity: 0.075, x1: xBeforeRight, y1: edge, x2: w * 0.68, y2: edge, d: `M ${xBeforeRight} ${edge} H ${w * 0.68}` },
    { id: "bl-bottom", opacity: 0.055, x1: corner, y1: yBottom, x2: w * 0.37, y2: yBottom, d: `M ${corner} ${yBottom} H ${w * 0.37}` },
    { id: "br-bottom", opacity: 0.09, x1: xBeforeRight, y1: yBottom, x2: w * 0.48, y2: yBottom, d: `M ${xBeforeRight} ${yBottom} H ${w * 0.48}` },
    { id: "tl-left", opacity: 0.1, x1: edge, y1: corner, x2: edge, y2: h * 0.44, d: `M ${edge} ${corner} V ${h * 0.44}` },
    { id: "bl-left", opacity: 0.055, x1: edge, y1: yBeforeBottom, x2: edge, y2: h * 0.72, d: `M ${edge} ${yBeforeBottom} V ${h * 0.72}` },
    { id: "tr-right", opacity: 0.075, x1: xRight, y1: corner, x2: xRight, y2: h * 0.34, d: `M ${xRight} ${corner} V ${h * 0.34}` },
    { id: "br-right", opacity: 0.09, x1: xRight, y1: yBeforeBottom, x2: xRight, y2: h * 0.53, d: `M ${xRight} ${yBeforeBottom} V ${h * 0.53}` },
  ] as const;

  return (
    <Svg
      width={w}
      height={h}
      style={styles.outline}
      pointerEvents="none"
      accessible={false}
    >
      <Defs>
        {segments.map(({ id, opacity, x1, y1, x2, y2 }) => (
          <LinearGradient
            key={id}
            id={id}
            x1={x1}
            y1={y1}
            x2={x2}
            y2={y2}
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="0%" stopColor="#FFFFFF" stopOpacity={opacity} />
            <Stop offset="42%" stopColor="#FFFFFF" stopOpacity={opacity * 0.65} />
            <Stop offset="78%" stopColor="#FFFFFF" stopOpacity={opacity * 0.18} />
            <Stop offset="100%" stopColor="#FFFFFF" stopOpacity={0} />
          </LinearGradient>
        ))}
      </Defs>
      {segments.map(({ id, d }) => (
        <Path key={id} d={d} stroke={`url(#${id})`} strokeWidth={1} fill="none" />
      ))}
      <Path d={`M ${edge} ${corner} A ${radius} ${radius} 0 0 1 ${corner} ${edge}`} stroke="rgba(255,255,255,0.1)" strokeWidth={1} fill="none" />
      <Path d={`M ${xBeforeRight} ${edge} A ${radius} ${radius} 0 0 1 ${xRight} ${corner}`} stroke="rgba(255,255,255,0.075)" strokeWidth={1} fill="none" />
      <Path d={`M ${edge} ${yBeforeBottom} A ${radius} ${radius} 0 0 0 ${corner} ${yBottom}`} stroke="rgba(255,255,255,0.055)" strokeWidth={1} fill="none" />
      <Path d={`M ${xBeforeRight} ${yBottom} A ${radius} ${radius} 0 0 0 ${xRight} ${yBeforeBottom}`} stroke="rgba(255,255,255,0.09)" strokeWidth={1} fill="none" />
    </Svg>
  );
});

const styles = StyleSheet.create({
  outline: {
    position: "absolute",
    top: -1,
    left: -1,
  },
});