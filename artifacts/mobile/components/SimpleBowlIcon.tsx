import React from "react";
import Svg, { Ellipse, Path } from "react-native-svg";

/** Plain singing bowl: rim and body only, without stand, mallet or ornaments. */
export function SimpleBowlIcon({ size = 53, color = "#FFFFFF" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9 C3 15.5 6.5 19 12 19 C17.5 19 21 15.5 21 9"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <Ellipse cx={12} cy={9} rx={9} ry={2.5} stroke={color} strokeWidth={1.6} />
    </Svg>
  );
}
