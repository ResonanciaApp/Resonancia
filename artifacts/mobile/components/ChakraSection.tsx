import React, { useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import Svg, { Defs, Ellipse, RadialGradient, Stop } from "react-native-svg";

import { SacredGlyph } from "@/components/SacredGlyph";
import { useCategoryOverlayOptional } from "@/context/CategoryOverlayContext";
import { CHAKRAS, type Chakra } from "@/data/chakras";
import { router } from "expo-router";

const PANEL_H = 580;
const PANEL_BOTTOM_PAD = 25;
const GLYPH_SIZE = 64;
const GLOW_R = 34;
const ROW_H = 72;
const CHAKRAS_VISUAL = [...CHAKRAS].reverse();
const CHAKRA_TOP_PCTS = [0.087, 0.233, 0.38, 0.527, 0.673, 0.82, 0.966] as const;
const CHAKRA_LEFT_LABELS = [
  "Consciencia cósmica",
  "Visión interior",
  "Voz auténtica",
  "Amor incondicional",
  "Voluntad",
  "Fluir creativo",
  "Fuerza interior",
] as const;

type ChakraRowProps = {
  chakra: Chakra;
  topPct: number;
  panelWidth: number;
  colorAnim: Animated.Value;
  onOpen: (id: string) => void;
};

function ChakraRow({ chakra, topPct, panelWidth, colorAnim, onOpen }: ChakraRowProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const dimAnim = useRef(new Animated.Value(0.75)).current;
  const centerX = panelWidth / 2;
  const rowTop = Math.round(topPct * PANEL_H) - ROW_H / 2;

  const handlePress = () => {
    scaleAnim.setValue(1);
    Animated.sequence([
      Animated.timing(colorAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: false,
      }),
      Animated.timing(colorAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: false,
      }),
    ]).start();
    Animated.parallel([
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.07,
          duration: 230,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 230,
          useNativeDriver: true,
        }),
      ]),
      Animated.sequence([
        Animated.timing(dimAnim, {
          toValue: 1,
          duration: 230,
          useNativeDriver: true,
        }),
        Animated.timing(dimAnim, {
          toValue: 0.75,
          duration: 230,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => onOpen(chakra.id));
  };

  return (
    <Pressable
      onPress={handlePress}
      hitSlop={6}
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${chakra.name}`}
      style={[
        styles.chakraRow,
        {
          top: rowTop,
          left: centerX - GLOW_R,
        },
      ]}
    >
      <Animated.View
        style={{
          marginLeft: GLOW_R - GLYPH_SIZE / 2,
          opacity: dimAnim,
          transform: [{ scale: scaleAnim }],
        }}
      >
        <SacredGlyph
          id={chakra.geometryId}
          color={chakra.color}
          size={GLYPH_SIZE}
        />
      </Animated.View>
      <View style={styles.chakraCopy}>
        <Text style={styles.chakraName}>{chakra.name}</Text>
        <Text style={styles.chakraSubtitle}>{chakra.subtitle}</Text>
      </View>
    </Pressable>
  );
}

export function ChakraSection() {
  const { width: screenWidth } = useWindowDimensions();
  const panelWidth = Math.max(280, screenWidth - 38);
  const centerX = panelWidth / 2;
  const categoryOverlay = useCategoryOverlayOptional();
  const chakraColorAnims = useRef(
    CHAKRAS_VISUAL.map(() => new Animated.Value(0)),
  ).current;

  const openChakra = (id: string) => {
    const route = `/chakra/${id}`;
    if (categoryOverlay) {
      categoryOverlay.openCategory(route);
    } else {
      router.push(route as never);
    }
  };

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Armoniza tus chakras</Text>
      <View style={styles.panel}>
        <Svg
          width="100%"
          height="100%"
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        >
          <Defs>
            <RadialGradient id="profileAurCorona" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#A776D6" stopOpacity={0.2} />
              <Stop offset="100%" stopColor="#A776D6" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="profileAurTercerOjo" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#6F68B6" stopOpacity={0.2} />
              <Stop offset="100%" stopColor="#6F68B6" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="profileAurGarganta" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#5998BB" stopOpacity={0.18} />
              <Stop offset="100%" stopColor="#5998BB" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="profileAurCorazon" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#60A186" stopOpacity={0.18} />
              <Stop offset="100%" stopColor="#60A186" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="profileAurPlexo" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#F9F9F9" stopOpacity={0.17} />
              <Stop offset="100%" stopColor="#F9F9F9" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="profileAurSacro" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#DE9363" stopOpacity={0.17} />
              <Stop offset="100%" stopColor="#DE9363" stopOpacity={0} />
            </RadialGradient>
            <RadialGradient id="profileAurRaiz" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#C65860" stopOpacity={0.17} />
              <Stop offset="100%" stopColor="#C65860" stopOpacity={0} />
            </RadialGradient>
          </Defs>
          <Ellipse cx="20%" cy="4%" rx="55%" ry="34%" fill="url(#profileAurCorona)" />
          <Ellipse cx="85%" cy="18%" rx="52%" ry="34%" fill="url(#profileAurTercerOjo)" />
          <Ellipse cx="14%" cy="34%" rx="52%" ry="34%" fill="url(#profileAurGarganta)" />
          <Ellipse cx="86%" cy="50%" rx="52%" ry="34%" fill="url(#profileAurCorazon)" />
          <Ellipse cx="14%" cy="66%" rx="52%" ry="34%" fill="url(#profileAurPlexo)" />
          <Ellipse cx="86%" cy="82%" rx="52%" ry="34%" fill="url(#profileAurSacro)" />
          <Ellipse cx="30%" cy="98%" rx="55%" ry="34%" fill="url(#profileAurRaiz)" />
        </Svg>

        {CHAKRA_LEFT_LABELS.map((label, index) => {
          const rowTop = Math.round(CHAKRA_TOP_PCTS[index] * PANEL_H) - ROW_H / 2;
          const animatedColor = chakraColorAnims[index].interpolate({
            inputRange: [0, 1],
            outputRange: ["rgba(249,249,249,0.5)", CHAKRAS_VISUAL[index].color],
          });
          return (
            <View
              key={label}
              pointerEvents="none"
              style={[
                styles.leftLabel,
                {
                  top: rowTop,
                  right: panelWidth - centerX + 62,
                },
              ]}
            >
              <Animated.Text style={[styles.leftLabelText, { color: animatedColor }]}>
                {label}
              </Animated.Text>
            </View>
          );
        })}

        {CHAKRAS_VISUAL.map((chakra, index) => (
          <ChakraRow
            key={chakra.id}
            chakra={chakra}
            topPct={CHAKRA_TOP_PCTS[index]}
            panelWidth={panelWidth}
            colorAnim={chakraColorAnims[index]}
            onOpen={openChakra}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
    marginBottom: 10,
  },
  sectionTitle: {
    fontFamily: "Manrope",
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: 0.3,
    color: "#FBFBFB",
    marginBottom: 21,
  },
  panel: {
    width: "100%",
    height: PANEL_H + PANEL_BOTTOM_PAD,
    position: "relative",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.024)",
    borderRadius: 25,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  leftLabel: {
    position: "absolute",
    left: 8,
    height: ROW_H,
    justifyContent: "center",
    alignItems: "flex-end",
  },
  leftLabelText: {
    fontFamily: "Manrope",
    fontSize: 11,
    textAlign: "right",
  },
  chakraRow: {
    position: "absolute",
    right: 0,
    height: ROW_H,
    flexDirection: "row",
    alignItems: "center",
  },
  chakraCopy: {
    marginLeft: 23,
  },
  chakraName: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "700",
    color: "#FBFBFB",
  },
  chakraSubtitle: {
    fontFamily: "Manrope",
    fontSize: 11,
    color: "rgba(255,255,255,0.58)",
    marginTop: 2,
  },
});