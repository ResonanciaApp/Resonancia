import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Pressable,
  StyleSheet,
  Text,
  type StyleProp,
  type ViewStyle,
  View,
} from "react-native";

import { useIntencion } from "@/context/IntencionContext";

export function IntentionPrompt({ style }: { style?: StyleProp<ViewStyle> }) {
  const { savedEntries, favorites } = useIntencion();
  const currentIntention = savedEntries[0]?.text ?? favorites[0] ?? null;
  const cursorOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(cursorOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(cursorOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    );
    blink.start();
    return () => blink.stop();
  }, [cursorOpacity]);

  return (
    <Pressable
      onPress={() => router.push("/intencion-onboarding" as never)}
      style={({ pressed }) => [styles.wrap, style, { opacity: pressed ? 0.75 : 1 }]}
      accessibilityRole="button"
      accessibilityLabel="Establecer mi intención"
    >
      <Text style={styles.super}>Hoy quiero…</Text>
      <View style={styles.row}>
        <Animated.View style={[styles.cursor, { opacity: cursorOpacity }]} />
        {currentIntention ? (
          <Text style={styles.text} numberOfLines={2}>{currentIntention}</Text>
        ) : (
          <Text style={styles.text}>Proyecta tu propósito</Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 20,
  },
  super: {
    fontFamily: "Manrope",
    fontSize: 13,
    color: "rgba(237,225,211,0.45)",
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  cursor: {
    width: 2,
    height: 26,
    borderRadius: 1,
    backgroundColor: "#F9F9F9",
    marginRight: 6,
  },
  text: {
    fontFamily: "Manrope",
    fontSize: 20,
    color: "rgba(255,255,255,0.9)",
    fontWeight: "600",
    textAlign: "center",
    flexShrink: 1,
  },
});