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
    <View style={styles.container} pointerEvents="none">
      <Animated.View style={{ opacity: greetingOpacity }}>
        <Text style={styles.greetingText}>{greeting}</Text>
        <Text style={styles.descText} numberOfLines={1}>
          Grandes cosas tienen pequeños inicios
        </Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingRight: 8,
    justifyContent: "center",
    minHeight: 52,
  },
  greetingText: {
    color: "rgba(255,255,255,0.92)",
    fontSize: 22,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  descText: {
    color: "rgba(255,255,255,0.45)",
    fontSize: 11,
    marginTop: 3,
    lineHeight: 15,
  },
});
