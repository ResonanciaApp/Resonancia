import React from "react";
import Svg, { Path } from "react-native-svg";

export function MoonCrescentIcon({ color, size = 26 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M21 12.79A9 9 0 1111.21 3a7 7 0 009.79 9.79z" fill={color} />
    </Svg>
  );
}
