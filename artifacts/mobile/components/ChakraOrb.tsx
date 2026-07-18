import React from "react";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";

type Props = {
  color: string;
  size?: number;
};

export function ChakraOrb({ color, size = 38 }: Props) {
  const r = size / 2;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <RadialGradient id="cog" cx="50%" cy="40%" r="55%" fx="50%" fy="38%">
          <Stop offset="0%"   stopColor="#FFFFFF" stopOpacity="1" />
          <Stop offset="22%"  stopColor="#FFFFFF" stopOpacity="0.9" />
          <Stop offset="50%"  stopColor={color}   stopOpacity="1" />
          <Stop offset="100%" stopColor={color}   stopOpacity="0.75" />
        </RadialGradient>
      </Defs>
      <Circle cx={r} cy={r} r={r} fill="url(#cog)" />
    </Svg>
  );
}
