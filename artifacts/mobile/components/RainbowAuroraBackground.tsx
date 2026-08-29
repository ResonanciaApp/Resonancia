import React from "react";
import { StyleSheet } from "react-native";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";

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
        <RadialGradient id={gradientId("corona")} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#A776D6" stopOpacity={0.2} />
          <Stop offset="100%" stopColor="#A776D6" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={gradientId("tercer-ojo")} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#6F68B6" stopOpacity={0.2} />
          <Stop offset="100%" stopColor="#6F68B6" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={gradientId("garganta")} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#5998BB" stopOpacity={0.18} />
          <Stop offset="100%" stopColor="#5998BB" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={gradientId("corazon")} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#60A186" stopOpacity={0.18} />
          <Stop offset="100%" stopColor="#60A186" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={gradientId("plexo")} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#F9F9F9" stopOpacity={0.17} />
          <Stop offset="100%" stopColor="#F9F9F9" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={gradientId("sacro")} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#DE9363" stopOpacity={0.17} />
          <Stop offset="100%" stopColor="#DE9363" stopOpacity={0} />
        </RadialGradient>
        <RadialGradient id={gradientId("raiz")} cx="50%" cy="50%" r="50%">
          <Stop offset="0%" stopColor="#C65860" stopOpacity={0.17} />
          <Stop offset="100%" stopColor="#C65860" stopOpacity={0} />
        </RadialGradient>
      </Defs>

      <Ellipse cx="20%" cy="4%" rx="55%" ry="34%" fill={`url(#${gradientId("corona")})`} />
      <Ellipse cx="85%" cy="18%" rx="52%" ry="34%" fill={`url(#${gradientId("tercer-ojo")})`} />
      <Ellipse cx="14%" cy="34%" rx="52%" ry="34%" fill={`url(#${gradientId("garganta")})`} />
      <Ellipse cx="86%" cy="50%" rx="52%" ry="34%" fill={`url(#${gradientId("corazon")})`} />
      <Ellipse cx="14%" cy="66%" rx="52%" ry="34%" fill={`url(#${gradientId("plexo")})`} />
      <Ellipse cx="86%" cy="82%" rx="52%" ry="34%" fill={`url(#${gradientId("sacro")})`} />
      <Ellipse cx="30%" cy="98%" rx="55%" ry="34%" fill={`url(#${gradientId("raiz")})`} />
    </Svg>
  );
}