import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, View, type StyleProp, type ViewStyle } from "react-native";
import { CardCaptionText as Text } from "@/components/CardCaptionText";
import Svg, { Defs, LinearGradient, RadialGradient, Rect, Stop } from "react-native-svg";

import { CARD_TEXT_BELOW } from "@/constants/colors";

export function ResonadoresBanner({
  onPress,
  style,
}: {
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel="Conoce a los Resonadores"
      style={({ pressed }) => [styles.banner, style, { opacity: pressed ? 0.82 : 1 }]}
    >
      <View style={styles.icon}>
        <Svg
          width="100%"
          height="100%"
          viewBox="0 0 100 100"
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <Defs>
            <LinearGradient id="auroraBase" x1="0%" y1="0%" x2="100%" y2="100%">
              <Stop offset="0" stopColor="#3155D9" />
              <Stop offset="0.55" stopColor="#7257D9" />
              <Stop offset="1" stopColor="#C9B6F4" />
            </LinearGradient>
            <RadialGradient id="auroraMint" cx="88%" cy="10%" r="72%">
              <Stop offset="0" stopColor="#C9B6F4" stopOpacity="0.95" />
              <Stop offset="0.48" stopColor="#C9B6F4" stopOpacity="0.42" />
              <Stop offset="1" stopColor="#C9B6F4" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="auroraPink" cx="92%" cy="92%" r="76%">
              <Stop offset="0" stopColor="#7257D9" stopOpacity="0.95" />
              <Stop offset="0.5" stopColor="#7257D9" stopOpacity="0.38" />
              <Stop offset="1" stopColor="#7257D9" stopOpacity="0" />
            </RadialGradient>
            <RadialGradient id="auroraLilac" cx="8%" cy="72%" r="82%">
              <Stop offset="0" stopColor="#3155D9" stopOpacity="0.72" />
              <Stop offset="0.55" stopColor="#3155D9" stopOpacity="0.24" />
              <Stop offset="1" stopColor="#3155D9" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Rect width="100" height="100" fill="url(#auroraBase)" />
          <Rect width="100" height="100" fill="url(#auroraLilac)" />
          <Rect width="100" height="100" fill="url(#auroraMint)" />
          <Rect width="100" height="100" fill="url(#auroraPink)" />
        </Svg>
        <Feather name="users" color="#F9F9F9" size={27} />
      </View>
      <View style={styles.copy}>
        <Text style={styles.title}>Conoce a los Resonadores</Text>
        <Text style={styles.subtitle}>
          La esencia que le da vida a este espacio, las personas detrás de Resonancia.
        </Text>
      </View>
      <Feather name="chevron-right" size={20} color="rgba(249,249,249,0.7)" style={styles.chevron} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    minHeight: 110,
    marginTop: 3,
    marginBottom: 53,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  icon: {
    width: 51,
    height: 51,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    transform: [{ translateY: 0 }],
  },
  copy: {
    flex: 1,
    minWidth: 0,
    transform: [{ translateY: -2 }],
  },
  chevron: { transform: [{ translateY: -2 }] },
  title: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
    color: "#F9F9F9",
    marginBottom: 5,
  },
  subtitle: {
    fontFamily: "Manrope",
    fontSize: 12,
    color: CARD_TEXT_BELOW,
  },
});