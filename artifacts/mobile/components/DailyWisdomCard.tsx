import { Feather } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";

import { useSceneTheme } from "@/context/SceneThemeContext";
import { isIndigoThemeId } from "@/config/scene-themes";
import { getDailyWisdomQuote } from "@/data/dailyWisdomQuotes";
import { useColors } from "@/hooks/useColors";

export function DailyWisdomCard() {
  const colors = useColors();
  const { theme } = useSceneTheme();
  const quote = useMemo(() => getDailyWisdomQuote(), []);
  const accent = theme.accent ?? colors.primary;

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
        isIndigoThemeId(theme.id) && { backgroundColor: "rgba(181,211,255,0.045)" },
      ]}
      testID="inicio2-daily-wisdom"
    >
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
    backgroundColor: "rgba(255,255,255,0.025)",
    alignItems: "flex-start",
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