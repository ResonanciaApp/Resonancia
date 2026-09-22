import type { DailyQuoteDecoration } from "@workspace/api-client-react";
import React from "react";
import { StyleSheet, View } from "react-native";
import Svg, { Circle, G, Line } from "react-native-svg";

type Point = readonly [number, number];

const SEED_CENTERS: readonly Point[] = [
  [80, 68], [80, 42], [102, 55], [102, 81], [80, 94], [58, 81], [58, 55],
];

const FLOWER_CENTERS: readonly Point[] = [
  ...SEED_CENTERS,
  [80, 16], [124, 42], [124, 94], [80, 120], [36, 94], [36, 42],
];

const HEX_POINTS: readonly Point[] = [
  [80, 18], [124, 43], [124, 93], [80, 118], [36, 93], [36, 43],
];

function SacredGeometry({ id }: { id: Exclude<DailyQuoteDecoration, "circles"> }) {
  return (
    <Svg width="100%" height="100%" viewBox="0 0 160 136">
      <G fill="none" stroke="rgba(255,255,255,0.88)" strokeWidth={1.15}>
        {id === "vesica" && (
          <>
            <Circle cx={68} cy={66} r={42} />
            <Circle cx={94} cy={66} r={42} />
            <Circle cx={81} cy={66} r={55} opacity={0.42} />
          </>
        )}
        {id === "seed" && SEED_CENTERS.map(([cx, cy]) => (
          <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={26} />
        ))}
        {id === "flower" && FLOWER_CENTERS.map(([cx, cy]) => (
          <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={26} />
        ))}
        {id === "metatron" && (
          <>
            <Circle cx={80} cy={68} r={9} />
            {HEX_POINTS.map(([x, y]) => (
              <React.Fragment key={`${x}-${y}`}>
                <Circle cx={x} cy={y} r={9} />
                <Line x1={80} y1={68} x2={x} y2={y} />
              </React.Fragment>
            ))}
            <Line x1={80} y1={18} x2={124} y2={93} />
            <Line x1={124} y1={43} x2={80} y2={118} />
            <Line x1={124} y1={93} x2={36} y2={93} />
            <Line x1={80} y1={118} x2={36} y2={43} />
            <Line x1={36} y1={93} x2={80} y2={18} />
            <Line x1={36} y1={43} x2={124} y2={43} />
            <Circle cx={80} cy={68} r={51} opacity={0.55} />
          </>
        )}
      </G>
    </Svg>
  );
}

const DECORATION_MOTIFS: Record<
  Exclude<DailyQuoteDecoration, "circles">,
  readonly [
    Exclude<DailyQuoteDecoration, "circles">,
    Exclude<DailyQuoteDecoration, "circles">,
    Exclude<DailyQuoteDecoration, "circles">,
  ]
> = {
  vesica: ["vesica", "metatron", "seed"],
  seed: ["seed", "metatron", "vesica"],
  flower: ["flower", "metatron", "vesica"],
  metatron: ["metatron", "seed", "vesica"],
};

export function DailyQuoteDecorationLayer({ id }: { id: DailyQuoteDecoration }) {
  if (id === "circles") {
    return (
      <>
        <View style={styles.circleLarge} pointerEvents="none" />
        <View style={styles.circleSmall} pointerEvents="none" />
        <View style={styles.circleSoft} pointerEvents="none" />
      </>
    );
  }

  const [largeMotif, smallMotif, softMotif] = DECORATION_MOTIFS[id];

  return (
    <>
      <View style={styles.geometryLarge} pointerEvents="none">
        <SacredGeometry id={largeMotif} />
      </View>
      <View style={styles.geometrySmall} pointerEvents="none">
        <SacredGeometry id={smallMotif} />
      </View>
      <View style={styles.geometrySoft} pointerEvents="none">
        <SacredGeometry id={softMotif} />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  circleLarge: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    top: -88,
    right: -42,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  circleSmall: {
    position: "absolute",
    width: 82,
    height: 82,
    borderRadius: 41,
    right: 48,
    bottom: -45,
    backgroundColor: "rgba(255,220,218,0.08)",
  },
  circleSoft: {
    position: "absolute",
    width: 112,
    height: 112,
    borderRadius: 56,
    left: -72,
    bottom: -46,
    backgroundColor: "rgba(245,225,255,0.055)",
  },
  geometryLarge: {
    position: "absolute",
    width: 170,
    height: 170,
    top: -88,
    right: -42,
    opacity: 0.11,
    transform: [{ rotate: "7deg" }],
  },
  geometrySmall: {
    position: "absolute",
    width: 82,
    height: 82,
    right: 48,
    bottom: -45,
    opacity: 0.085,
    transform: [{ rotate: "-8deg" }],
  },
  geometrySoft: {
    position: "absolute",
    width: 112,
    height: 112,
    left: -72,
    bottom: -46,
    opacity: 0.065,
    transform: [{ rotate: "-10deg" }],
  },
});