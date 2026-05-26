import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useState } from "react";
import {
  Dimensions,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  Easing,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

import { DAILY_MESSAGES } from "@/data/messages";

const { width } = Dimensions.get("window");
const CARD_W = width - 48;
const CARD_H = 192;

// Corner ornament — thin L-shaped bracket
function Corner({
  position,
}: {
  position: "tl" | "tr" | "bl" | "br";
}) {
  const s = 14;
  const off = 12;
  const borderColor = "#7A5228";
  const bw = 0.8;

  const pos: Record<string, object> = {
    tl: { top: off, left: off, borderTopWidth: bw, borderLeftWidth: bw },
    tr: { top: off, right: off, borderTopWidth: bw, borderRightWidth: bw },
    bl: { bottom: off, left: off, borderBottomWidth: bw, borderLeftWidth: bw },
    br: { bottom: off, right: off, borderBottomWidth: bw, borderRightWidth: bw },
  };

  return (
    <View
      style={[
        styles.corner,
        { width: s, height: s, borderColor },
        pos[position],
      ]}
      pointerEvents="none"
    />
  );
}

function CardBack() {
  return (
    <LinearGradient
      colors={["#221209", "#18100A", "#221209"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardFace}
    >
      {/* Outer border */}
      <View style={styles.outerBorder} pointerEvents="none" />
      {/* Inner border */}
      <View style={styles.innerBorder} pointerEvents="none" />

      {/* Corner ornaments */}
      <Corner position="tl" />
      <Corner position="tr" />
      <Corner position="bl" />
      <Corner position="br" />

      {/* Center content */}
      <View style={styles.backCenter}>
        <Text style={styles.backTitle}>TU MENSAJE DEL DÍA</Text>
      </View>
    </LinearGradient>
  );
}

function CardFront({ message }: { message: string }) {
  const today = new Date().toLocaleDateString("es-ES", {
    day: "numeric",
    month: "long",
  });

  return (
    <LinearGradient
      colors={["#261509", "#1C1008", "#261509"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardFace}
    >
      {/* Outer border — warmer on front */}
      <View style={[styles.outerBorder, { borderColor: "#8A6030" }]} pointerEvents="none" />
      <View style={[styles.innerBorder, { borderColor: "rgba(138,96,48,0.3)" }]} pointerEvents="none" />

      <Corner position="tl" />
      <Corner position="tr" />
      <Corner position="bl" />
      <Corner position="br" />

      {/* Top label */}
      <Text style={styles.frontTopLabel}>Un mensaje para ti</Text>

      {/* Message */}
      <View style={styles.frontBody}>
        <View style={[styles.thinRule, { width: 40 }]} />
        <Text style={styles.frontMessage}>"{message}"</Text>
        <View style={[styles.thinRule, { width: 40 }]} />
      </View>

      {/* Date footer */}
      <Text style={styles.frontDate}>Casa del Cuenco  ·  {today}</Text>
    </LinearGradient>
  );
}

type Phase = "idle" | "flipping-in" | "revealed" | "flipping-out";

export function MessageDeck() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const flip = useSharedValue(0);

  const pickRandom = useCallback(
    () => DAILY_MESSAGES[Math.floor(Math.random() * DAILY_MESSAGES.length)],
    []
  );

  const revealCard = useCallback(() => {
    if (phase !== "idle") return;
    setMessage(pickRandom());
    setPhase("flipping-in");
    flip.value = withTiming(
      1,
      { duration: 680, easing: Easing.inOut(Easing.cubic) },
      (done) => { if (done) runOnJS(setPhase)("revealed"); }
    );
  }, [phase, pickRandom, flip]);

  const resetDeck = useCallback(() => {
    if (phase !== "revealed") return;
    setPhase("flipping-out");
    flip.value = withTiming(
      0,
      { duration: 520, easing: Easing.inOut(Easing.cubic) },
      (done) => { if (done) runOnJS(setPhase)("idle"); }
    );
  }, [phase, flip]);

  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1400 },
      { rotateY: `${interpolate(flip.value, [0, 0.5], [0, 90])}deg` },
    ],
    opacity: interpolate(flip.value, [0.3, 0.5], [1, 0], "clamp"),
  }));

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1400 },
      { rotateY: `${interpolate(flip.value, [0.5, 1], [-90, 0])}deg` },
    ],
    opacity: interpolate(flip.value, [0.5, 0.7], [0, 1], "clamp"),
  }));

  const isFlipping = phase === "flipping-in" || phase === "flipping-out";

  return (
    <View style={styles.wrapper}>
      {/* Shadow cards behind — two barely-visible copies */}
      {[4, 8].map((offset, i) => (
        <View
          key={i}
          style={[
            styles.shadowCard,
            {
              top: offset,
              left: offset / 2,
              right: offset / 2,
              opacity: i === 0 ? 0.45 : 0.28,
            },
          ]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={["#1C0E07", "#130C06"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, { borderWidth: 0.8, borderColor: "#4A2C10", borderRadius: 10 }]} />
        </View>
      ))}

      {/* Active card */}
      <View style={styles.cardContainer}>
        <Animated.View style={[StyleSheet.absoluteFill, backStyle]}>
          <Pressable
            onPress={revealCard}
            disabled={isFlipping}
            style={{ flex: 1 }}
          >
            <CardBack />
          </Pressable>
        </Animated.View>

        <Animated.View style={[StyleSheet.absoluteFill, frontStyle]} pointerEvents="none">
          <CardFront message={message} />
        </Animated.View>
      </View>

      {/* Action area */}
      <View style={styles.actionArea}>
        {phase === "idle" && (
          <Text style={styles.hintText}>Toca para revelar tu mensaje</Text>
        )}
        {isFlipping && <View style={{ height: 32 }} />}
        {phase === "revealed" && (
          <Pressable
            onPress={resetDeck}
            style={({ pressed }) => [styles.newBtn, { opacity: pressed ? 0.72 : 1 }]}
          >
            <Text style={styles.newBtnText}>Revelar otro mensaje</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    paddingVertical: 4,
  },

  // Shadow cards
  shadowCard: {
    position: "absolute",
    height: CARD_H,
    borderRadius: 10,
    overflow: "hidden",
    zIndex: 0,
  },

  // Active card
  cardContainer: {
    width: CARD_W,
    height: CARD_H,
    zIndex: 1,
  },

  cardFace: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 10,
    overflow: "hidden",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 28,
  },

  outerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
    borderWidth: 0.8,
    borderColor: "#5A3418",
  },
  innerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
    margin: 6,
    borderWidth: 0.5,
    borderColor: "rgba(90,52,24,0.4)",
  },

  // Corner L-brackets
  corner: {
    position: "absolute",
  },

  // Card back
  backCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  thinRule: {
    width: 56,
    height: 0.8,
    backgroundColor: "#7A5228",
    opacity: 0.7,
  },
  backTitle: {
    color: "#C4944A",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 4,
    textAlign: "center",
  },
  backSub: {
    color: "#8A6030",
    fontSize: 10,
    letterSpacing: 2.5,
    fontStyle: "italic",
    textAlign: "center",
  },

  // Card front
  frontTopLabel: {
    color: "#8A6030",
    fontSize: 9,
    letterSpacing: 2,
    textAlign: "center",
    alignSelf: "center",
  },
  frontBody: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 14,
    paddingHorizontal: 8,
  },
  frontMessage: {
    color: "#D4B483",
    fontSize: 13,
    lineHeight: 21,
    textAlign: "center",
    fontStyle: "italic",
    fontFamily: "serif",
  },
  frontDate: {
    color: "#6A4820",
    fontSize: 8,
    letterSpacing: 1.2,
    textAlign: "center",
  },

  // Action area
  actionArea: {
    marginTop: 20,
    alignItems: "center",
    minHeight: 40,
    justifyContent: "center",
  },
  hintText: {
    color: "#6A4820",
    fontSize: 11,
    letterSpacing: 0.8,
    textAlign: "center",
    fontStyle: "italic",
  },
  newBtn: {
    paddingHorizontal: 22,
    paddingVertical: 9,
    borderRadius: 6,
    borderWidth: 0.8,
    borderColor: "#7A5228",
    backgroundColor: "rgba(122,82,40,0.08)",
  },
  newBtnText: {
    color: "#A07840",
    fontSize: 11,
    letterSpacing: 1.5,
    textAlign: "center",
  },
});
