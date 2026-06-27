import { LinearGradient } from "expo-linear-gradient";
import { useCallback, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { DAILY_MESSAGES } from "../data/messages";

const CARD_W = 300;
const CARD_H = 185;

// Corner ornament — thin L-shaped bracket
function Corner({ position }: { position: "tl" | "tr" | "bl" | "br" }) {
  const s = 14;
  const off = 12;
  const borderColor = "#3E6B48";
  const bw = 0.8;

  const pos: Record<string, object> = {
    tl: { top: off, left: off, borderTopWidth: bw, borderLeftWidth: bw },
    tr: { top: off, right: off, borderTopWidth: bw, borderRightWidth: bw },
    bl: { bottom: off, left: off, borderBottomWidth: bw, borderLeftWidth: bw },
    br: { bottom: off, right: off, borderBottomWidth: bw, borderRightWidth: bw },
  };

  return (
    <View
      style={[styles.corner, { width: s, height: s, borderColor }, pos[position]]}
      pointerEvents="none"
    />
  );
}

function CardBack() {
  return (
    <LinearGradient
      colors={["#0B1A0E", "#07100A", "#0B1A0E"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardFace}
    >
      <View style={styles.outerBorder} pointerEvents="none" />
      <View style={styles.innerBorder} pointerEvents="none" />
      <Corner position="tl" />
      <Corner position="tr" />
      <Corner position="bl" />
      <Corner position="br" />
      <View style={styles.backCenter}>
        <Text style={styles.backTitle}>RECIBE UNA SEÑAL</Text>
      </View>
    </LinearGradient>
  );
}

function CardFront({ message }: { message: string }) {
  return (
    <LinearGradient
      colors={["#0F1E12", "#0A1510", "#0F1E12"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.cardFace}
    >
      <View style={[styles.outerBorder, { borderWidth: 0.8, borderColor: "#4A7A55" }]} pointerEvents="none" />
      <View style={[styles.innerBorder, { borderWidth: 0.8, borderColor: "rgba(74,122,85,0.3)" }]} pointerEvents="none" />
      <Corner position="tl" />
      <Corner position="tr" />
      <Corner position="bl" />
      <Corner position="br" />
      <View style={styles.frontBody}>
        <Text style={styles.frontMessage}>"{message}"</Text>
      </View>
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
      { rotateY: `${flip.value * 180}deg` },
    ],
    backfaceVisibility: "hidden",
  }));

  const frontStyle = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1400 },
      { rotateY: `${flip.value * 180 - 180}deg` },
    ],
    backfaceVisibility: "hidden",
  }));

  const isFlipping = phase === "flipping-in" || phase === "flipping-out";

  return (
    <View style={styles.wrapper}>
      {[4, 8].map((offset, i) => (
        <View
          key={i}
          style={[
            styles.shadowCard,
            { top: offset, left: offset / 2, right: offset / 2, opacity: i === 0 ? 0.45 : 0.28 },
          ]}
          pointerEvents="none"
        >
          <LinearGradient
            colors={["#091510", "#060E08"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={[StyleSheet.absoluteFill, { borderWidth: 0.8, borderColor: "#1A3520", borderRadius: 10 }]} />
        </View>
      ))}

      <View style={styles.cardContainer}>
        <Animated.View style={[StyleSheet.absoluteFill, backStyle]}>
          <Pressable onPress={revealCard} disabled={isFlipping} style={{ flex: 1 }}>
            <CardBack />
          </Pressable>
        </Animated.View>
        <Animated.View style={[StyleSheet.absoluteFill, frontStyle]} pointerEvents="none">
          <CardFront message={message} />
        </Animated.View>
      </View>

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
  wrapper: { width: CARD_W, alignSelf: "center", paddingVertical: 4 },
  shadowCard: {
    position: "absolute",
    height: CARD_H,
    borderRadius: 10,
    overflow: "hidden",
    zIndex: 0,
  },
  cardContainer: { width: CARD_W, height: CARD_H, zIndex: 1 },
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
  },
  innerBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 8,
    margin: 6,
  },
  corner: { position: "absolute" },
  backCenter: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  thinRule: { width: 56, height: 0.8, backgroundColor: "#4A7A55", opacity: 0.7 },
  backTitle: {
    color: "#A8C8B0",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 4,
    textAlign: "center",
  },
  frontTopLabel: {
    color: "#5A8A65",
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
    color: "#D8EDE0",
    fontSize: 17,
    lineHeight: 26,
    textAlign: "center",
    fontStyle: "italic",
    fontFamily: "serif",
  },
  frontDate: {
    color: "#3A6A45",
    fontSize: 8,
    letterSpacing: 1.2,
    textAlign: "center",
  },
  actionArea: {
    marginTop: 20,
    alignItems: "center",
    minHeight: 40,
    justifyContent: "center",
  },
  hintText: {
    color: "#4A7055",
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
    borderColor: "#4A7A55",
    backgroundColor: "rgba(74,122,85,0.10)",
  },
  newBtnText: {
    color: "#7AAA85",
    fontSize: 11,
    letterSpacing: 1.5,
    textAlign: "center",
  },
});
