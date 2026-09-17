import { Feather } from "@expo/vector-icons";
import { Image, type ImageSource } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import { Pressable, Share, StyleSheet, Text, View } from "react-native";

type Props = {
  author: string;
  background: ImageSource;
  quote: string;
};

export function EmotionalQuoteCard({ author, background, quote }: Props) {
  async function shareQuote() {
    try {
      await Share.share({
        message: `“${quote}”\n\n— ${author}\n\nVía RESONANCIA`,
      });
    } catch {
      // Cerrar la hoja de compartir no requiere feedback.
    }
  }

  return (
    <View style={styles.card} testID="emotional-quote-card">
      <Image
        source={background}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={250}
      />
      <LinearGradient
        colors={["rgba(6,10,15,0.16)", "rgba(6,10,15,0.58)", "rgba(6,10,15,0.88)"]}
        locations={[0, 0.55, 1]}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <Text style={styles.author}>{author}</Text>
      <Text style={styles.quote}>“{quote}”</Text>

      <Pressable
        onPress={shareQuote}
        accessibilityRole="button"
        accessibilityLabel="Compartir frase para este momento"
        hitSlop={10}
        style={({ pressed }) => [
          styles.shareButton,
          { opacity: pressed ? 0.58 : 1 },
        ]}
      >
        <Feather name="share" size={22} color="#F9F9F9" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    minHeight: 262,
    marginTop: 22,
    borderRadius: 20,
    overflow: "hidden",
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 20,
    justifyContent: "flex-end",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "#15282B",
  },
  author: {
    fontFamily: "Manrope",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    color: "rgba(249,249,249,0.76)",
    marginBottom: 17,
  },
  quote: {
    maxWidth: "94%",
    fontFamily: "Manrope",
    fontSize: 19,
    lineHeight: 29,
    fontWeight: "700",
    color: "#F9F9F9",
    textAlign: "left",
    textShadowColor: "rgba(0,0,0,0.35)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 5,
  },
  shareButton: {
    width: 38,
    height: 38,
    marginTop: 18,
    marginLeft: -8,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
  },
});