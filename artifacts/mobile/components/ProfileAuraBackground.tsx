import { StyleSheet, View } from "react-native";
import Svg, { Defs, RadialGradient, Rect, Stop } from "react-native-svg";

type Props = {
  topInset: number;
};

/** Luces estáticas sobre el degradado de Escena: no interceptan toques ni animan. */
export function ProfileAuraBackground({ topInset }: Props) {
  return (
    <View
      pointerEvents="none"
      style={[StyleSheet.absoluteFillObject, { top: -topInset }]}
    >
      <Svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none">
        <Defs>
          <RadialGradient id="profileAuraBlue" cx="32" cy="58" rx="56" ry="44" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#456BFF" stopOpacity="0.84" />
            <Stop offset="0.34" stopColor="#3158F3" stopOpacity="0.61" />
            <Stop offset="0.72" stopColor="#283DAE" stopOpacity="0.22" />
            <Stop offset="1" stopColor="#283DAE" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="profileAuraViolet" cx="55" cy="58" rx="43" ry="39" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#7625DA" stopOpacity="0.72" />
            <Stop offset="0.46" stopColor="#5A24C2" stopOpacity="0.42" />
            <Stop offset="1" stopColor="#5A24C2" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="profileAuraPink" cx="82" cy="62" rx="35" ry="34" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#E24AA6" stopOpacity="0.75" />
            <Stop offset="0.44" stopColor="#C447AD" stopOpacity="0.40" />
            <Stop offset="1" stopColor="#C447AD" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="profileAuraWarm" cx="102" cy="59" rx="36" ry="34" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor="#FF9961" stopOpacity="0.70" />
            <Stop offset="0.42" stopColor="#F27B7D" stopOpacity="0.38" />
            <Stop offset="1" stopColor="#F27B7D" stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="profileAuraVignette" cx="50" cy="56" rx="74" ry="66" gradientUnits="userSpaceOnUse">
            <Stop offset="0.38" stopColor="#080C34" stopOpacity="0" />
            <Stop offset="0.78" stopColor="#080C34" stopOpacity="0.10" />
            <Stop offset="1" stopColor="#080C34" stopOpacity="0.38" />
          </RadialGradient>
        </Defs>
        <Rect width="100" height="100" fill="url(#profileAuraBlue)" />
        <Rect width="100" height="100" fill="url(#profileAuraViolet)" />
        <Rect width="100" height="100" fill="url(#profileAuraPink)" />
        <Rect width="100" height="100" fill="url(#profileAuraWarm)" />
        <Rect width="100" height="100" fill="url(#profileAuraVignette)" />
      </Svg>
    </View>
  );
}