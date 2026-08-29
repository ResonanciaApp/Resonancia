import React from "react";
import { StyleSheet } from "react-native";
import Svg, {
  Defs,
  Ellipse,
  RadialGradient,
  Stop,
} from "react-native-svg";

type RainbowAuroraBackgroundProps = {
  idPrefix?: string;
};

export function RainbowAuroraBackground({
  idPrefix = "aurora",
}: RainbowAuroraBackgroundProps) {
  const gradientId = (name: string) => `${idPrefix}-${name}`;

  return (
    <Svg
      width="100%"
      height="100%"
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      <Defs>
        <RadialGradient id={gradientId("violeta")} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#A776D6" stopOpacity={0.2} />
          <Stop offset="100%" stopColor="#A776D6" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={gradientId("indigo")} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#6F68B6" stopOpacity={0.2} />
          <Stop offset="100%" stopColor="#6F68B6" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={gradientId("azul")} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#5998BB" stopOpacity={0.18} />
          <Stop offset="100%" stopColor="#5998BB" stopOpacity={0} />
        </RadialGradient>
      </Defs>

      <Ellipse cx="20%" cy="4%" rx="55%" ry="34%" fill={`url(#${gradientId("violeta")})`} />
      <Ellipse cx="85%" cy="18%" rx="52%" ry="34%" fill={`url(#${gradientId("indigo")})`} />
      <Ellipse cx="14%" cy="34%" rx="52%" ry="34%" fill={`url(#${gradientId("azul")})`} />
      <Ellipse cx="86%" cy="50%" rx="52%" ry="34%" fill={`url(#${gradientId("violeta")})`} />
      <Ellipse cx="14%" cy="66%" rx="52%" ry="34%" fill={`url(#${gradientId("azul")})`} />
      <Ellipse cx="86%" cy="82%" rx="52%" ry="34%" fill={`url(#${gradientId("indigo")})`} />
      <Ellipse cx="30%" cy="98%" rx="55%" ry="34%" fill={`url(#${gradientId("violeta")})`} />
    </Svg>
  );
}