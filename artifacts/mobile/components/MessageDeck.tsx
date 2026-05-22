import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useState } from "react";
import {
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

const CARD_W = 240;
const CARD_H = 340;

// Fan angles for the decorative stack behind the active card
const FAN_ANGLES = [-14, -7, -1, 5, 11];
const FAN_OPACITY = [0.38, 0.52, 0.62, 0.72, 0.82];

type Phase = "idle" | "flipping-in" | "revealed" | "flipping-out";

function CardBack() {
  return (
    <LinearGradient
      colors={["#2E1B0A", "#18110C"]}
      style={styles.cardFace}
    >
      <View style={styles.cardBorder} pointerEvents="none" />
      <View style={styles.cardBackContent}>
        <Text style={styles.backOrnamentTop}>✦  ◈  ✦</Text>
        <View style={styles.backCenterBlock}>
          <Text style={styles.backMoonSymbols}>☽  ✧  ☾</Text>
          <View style={styles.backDividerLine} />
          <Text style={styles.backTitle}>RESONANCIA</Text>
          <View style={styles.backDividerLine} />
          <Text style={styles.backSubLabel}>mensaje del día</Text>
        </View>
        <Text style={styles.backOrnamentBottom}>❋  ◈  ❋</Text>
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
      colors={["#2A1508", "#18110C"]}
      style={styles.cardFace}
    >
      <View style={[styles.cardBorder, { borderColor: "#C69B4F" }]} pointerEvents="none" />
      <View style={styles.cardFrontContent}>
        <Text style={styles.frontTopLabel}>✦  Un mensaje para ti  ✦</Text>
        <View style={styles.frontDivider} />
        <Text style={styles.frontQuoteSymbol}>"</Text>
        <Text style={styles.frontMessage}>{message}"</Text>
        <View style={styles.frontDivider} />
        <Text style={styles.frontDate}>RESONANCIA · {today}</Text>
      </View>
    </LinearGradient>
  );
}

export function MessageDeck() {
  const [phase, setPhase] = useState<Phase>("idle");
  const [message, setMessage] = useState("");
  const flip = useSharedValue(0); // 0 = back, 1 = front

  const pickRandom = useCallback(
    () => DAILY_MESSAGES[Math.floor(Math.random() * DAILY_MESSAGES.length)],
    []
  );

  const revealCard = useCallback(() => {
    if (phase !== "idle") return;
    const msg = pickRandom();
    setMessage(msg);
    setPhase("flipping-in");
    flip.value = withTiming(
      1,
      { duration: 650, easing: Easing.inOut(Easing.cubic) },
      (done) => {
        if (done) runOnJS(setPhase)("revealed");
      }
    );
  }, [phase, pickRandom, flip]);

  const resetDeck = useCallback(() => {
    if (phase !== "revealed") return;
    setPhase("flipping-out");
    flip.value = withTiming(
      0,
      { duration: 500, easing: Easing.inOut(Easing.cubic) },
      (done) => {
        if (done) runOnJS(setPhase)("idle");
      }
    );
  }, [phase, flip]);

  // Back face: rotates from 0 → 90 and fades out at midpoint
  const backStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateY: `${interpolate(flip.value, [0, 0.5], [0, 90])}deg` },
    ],
    opacity: interpolate(flip.value, [0.3, 0.5], [1, 0], "clamp"),
  }));

  // Front face: rotates from -90 → 0 and fades in at midpoint
  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1200 },
      { rotateY: `${interpolate(flip.value, [0.5, 1], [-90, 0])}deg` },
    ],
    opacity: interpolate(flip.value, [0.5, 0.7], [0, 1], "clamp"),
  }));

  const isFlipping = phase === "flipping-in" || phase === "flipping-out";

  return (
    <View style={styles.wrapper}>
      {/* Deck container: fan + active card stacked */}
      <View style={styles.deckContainer}>
        {/* Decorative fan cards behind */}
        {FAN_ANGLES.map((angle, i) => (
          <View
            key={i}
            style={[
              StyleSheet.absoluteFill,
              {
                transform: [{ rotate: `${angle}deg` }],
                opacity: FAN_OPACITY[i],
                borderRadius: 20,
                overflow: "hidden",
              },
            ]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={["#2A1608", "#18110C"]}
              style={StyleSheet.absoluteFill}
            />
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: 20,
                  borderWidth: 1.5,
                  borderColor: "#7A5228",
                  alignItems: "center",
                  justifyContent: "center",
                },
              ]}
            >
              <Text style={{ color: "#6A4018", fontSize: 18 }}>◈</Text>
            </View>
          </View>
        ))}

        {/* Active card — back face */}
        <Animated.View style={[StyleSheet.absoluteFill, backStyle]}>
          <Pressable
            onPress={revealCard}
            disabled={isFlipping}
            style={{ flex: 1 }}
          >
            <CardBack />
          </Pressable>
        </Animated.View>

        {/* Active card — front face */}
        <Animated.View style={[StyleSheet.absoluteFill, frontStyle]} pointerEvents="none">
          <CardFront message={message} />
        </Animated.View>
      </View>

      {/* Action area below the deck */}
      <View style={styles.actionArea}>
        {phase === "idle" && (
          <Text style={styles.hintText}>Toca la baraja para revelar tu mensaje</Text>
        )}
        {isFlipping && <View style={{ height: 36 }} />}
        {phase === "revealed" && (
          <Pressable
            onPress={resetDeck}
            style={({ pressed }) => [styles.newCardBtn, { opacity: pressed ? 0.75 : 1 }]}
          >
            <Text style={styles.newCardBtnText}>✦  Elegir otra carta</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: "center",
    paddingVertical: 8,
  },
  deckContainer: {
    width: CARD_W,
    height: CARD_H,
  },

  // ── Card shell ──────────────────────────────────────────────
  cardFace: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 20,
    overflow: "hidden",
  },
  cardBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#8A5A28",
  },

  // ── Card back ───────────────────────────────────────────────
  cardBackContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 28,
    paddingHorizontal: 20,
  },
  backOrnamentTop: {
    color: "#8A6030",
    fontSize: 13,
    letterSpacing: 4,
  },
  backCenterBlock: {
    alignItems: "center",
    gap: 10,
  },
  backMoonSymbols: {
    color: "#C69B4F",
    fontSize: 22,
    letterSpacing: 6,
  },
  backDividerLine: {
    width: 80,
    height: 1,
    backgroundColor: "#8A6030",
    opacity: 0.6,
  },
  backTitle: {
    color: "#C69B4F",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 5,
  },
  backSubLabel: {
    color: "#7A5828",
    fontSize: 10,
    letterSpacing: 2.5,
  },
  backOrnamentBottom: {
    color: "#8A6030",
    fontSize: 13,
    letterSpacing: 4,
  },

  // ── Card front ──────────────────────────────────────────────
  cardFrontContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 28,
    paddingHorizontal: 22,
    gap: 0,
  },
  frontTopLabel: {
    color: "#C69B4F",
    fontSize: 9,
    letterSpacing: 1.5,
    fontWeight: "600",
    textAlign: "center",
    marginBottom: 12,
  },
  frontDivider: {
    width: 60,
    height: 1,
    backgroundColor: "#C69B4F",
    opacity: 0.4,
    marginVertical: 14,
  },
  frontQuoteSymbol: {
    color: "#C69B4F",
    fontSize: 42,
    lineHeight: 36,
    fontFamily: "serif",
    opacity: 0.6,
    alignSelf: "flex-start",
  },
  frontMessage: {
    color: "#EDE1D3",
    fontSize: 14,
    lineHeight: 22,
    textAlign: "center",
    fontStyle: "italic",
    flexShrink: 1,
  },
  frontDate: {
    color: "#7A5828",
    fontSize: 9,
    letterSpacing: 1.5,
    textAlign: "center",
  },

  // ── Action area ─────────────────────────────────────────────
  actionArea: {
    marginTop: 24,
    alignItems: "center",
    minHeight: 48,
    justifyContent: "center",
  },
  hintText: {
    color: "#7A5828",
    fontSize: 12,
    letterSpacing: 0.5,
    textAlign: "center",
  },
  newCardBtn: {
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#C69B4F",
    backgroundColor: "rgba(198,155,79,0.08)",
  },
  newCardBtnText: {
    color: "#C69B4F",
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 1,
  },
});
