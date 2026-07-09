import { useFocusEffect } from "expo-router";
import React, { useCallback, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 6 && hour < 12) return "Buenos días";
  if (hour >= 12 && hour < 19) return "Buenas tardes";
  return "Buenas noches";
}

export function GreetingHeader() {
  const greetingOpacity = useRef(new Animated.Value(0)).current;
  const greeting = getGreeting();

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
    color: "#FBFBFB",
    fontSize: 25,
    fontWeight: "700",
    letterSpacing: 0.3,
    textAlign: "center",
  },
  descText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    marginTop: 3,
    lineHeight: 15,
  },
});
