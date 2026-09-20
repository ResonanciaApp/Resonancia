import { useFocusEffect } from "expo-router";
import React, { useCallback, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useGreeting } from "@/hooks/useGreeting";
import { getAutomaticGreeting } from "@/lib/greeting";

export function getGreeting(): string {
  return getAutomaticGreeting();
}

export function GreetingHeader() {
  const greetingOpacity = useRef(new Animated.Value(0)).current;
  const greeting = useGreeting();

  useFocusEffect(
    useCallback(() => {
      greetingOpacity.setValue(0);
      Animated.timing(greetingOpacity, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }).start();
      return () => {
        greetingOpacity.setValue(0);
      };
    }, [])
  );

  return (
    <Animated.View style={[styles.container, { opacity: greetingOpacity }]} pointerEvents="none">
      <Text style={styles.greetingText}>{greeting}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingHorizontal: 8,
  },
  greetingText: {
    fontFamily: "Manrope",
    color: "#FBFBFB",
    fontSize: 25,
    fontWeight: "700",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  descText: {
    fontFamily: "Manrope",
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    marginTop: 3,
    lineHeight: 15,
  },
});
