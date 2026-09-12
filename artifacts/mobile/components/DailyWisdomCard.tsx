import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";

import { getDailyWisdomQuote } from "@/data/dailyWisdomQuotes";
import { useRoutineTheme } from "@/hooks/useRoutineTheme";

export function DailyWisdomCard({
  backgroundColor,
  decorativeGradient = false,
}: {
  backgroundColor?: string;
  decorativeGradient?: boolean;
}) {
  const routineTheme = useRoutineTheme();
  const quote = useMemo(() => getDailyWisdomQuote(), []);
  const accent = routineTheme.accent;

  const shareQuote = async () => {
    try {
      await Share.share({
        message: `“${quote.text}”\n\n— ${quote.author}\n\nVía RESONANCIA`,
      });
    } catch {
      // Cerrar la hoja de compartir no requiere feedback.
    }
  };

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: backgroundColor ?? routineTheme.surface },
      ]}
      testID="inicio2-daily-wisdom"
    >
      {decorativeGradient && (
        <>
          <LinearGradient
            colors={["#4A285F", "#A85F62"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.decorativeSphereLarge} pointerEvents="none" />
          <View style={styles.decorativeSphereSmall} pointerEvents="none" />
          <View style={styles.decorativeSphereSoft} pointerEvents="none" />
        </>
      )}
      <Text style={[styles.author, { color: accent }]}>{quote.author}</Text>
      <Text style={styles.quote}>{quote.text}</Text>
      <Pressable
        onPress={shareQuote}
        accessibilityRole="button"
        accessibilityLabel="Compartir frase del día"
        hitSlop={10}
        style={({ pressed }) => [styles.shareButton, { opacity: pressed ? 0.55 : 1 }]}
      >
        <Feather name="share" size={23} color={accent} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 14,
    marginBottom: 53,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 22,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.025)",
    alignItems: "flex-start",
  },
  decorativeSphereLarge: {
    position: "absolute",
    width: 170,
    height: 170,
    borderRadius: 85,
    top: -88,
    right: -42,
    backgroundColor: "rgba(255,255,255,0.07)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  decorativeSphereSmall: {
    position: "absolute",
    width: 82,
    height: 82,
    borderRadius: 41,
    right: 48,
    bottom: -45,
    backgroundColor: "rgba(255,220,218,0.08)",
  },
  decorativeSphereSoft: {
    position: "absolute",
    width: 112,
    height: 112,
    borderRadius: 56,
    left: -72,
    bottom: -46,
    backgroundColor: "rgba(245,225,255,0.055)",
  },
  author: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 22,
  },
  quote: {
    fontFamily: "Manrope",
    fontSize: 19,
    lineHeight: 29,
    fontWeight: "700",
    color: "#F9F9F9",
    textAlign: "left",
  },
  shareButton: {
    marginTop: 28,
    alignItems: "flex-start",
    justifyContent: "center",
  },
});