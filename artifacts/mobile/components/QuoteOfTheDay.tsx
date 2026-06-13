import { useState } from "react";
import { View, Text, Pressable, StyleSheet, Share } from "react-native";
import { Feather } from "@expo/vector-icons";
import { getQuoteOfTheDay } from "@/data/quotes";

const BLUE_ACCENT = "#D4AF37";
const BLUE_MUTED  = "rgba(242,231,228,0.45)";

export default function QuoteOfTheDay() {
  const quote = getQuoteOfTheDay();
  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);

  async function handleShare() {
    try {
      await Share.share({
        message: `"${quote.text}"\n\n— ${quote.author}\n\nVía RESONANCIA`,
      });
    } catch {
      // ignore
    }
  }

  return (
    <View style={styles.card}>
      <Text
        style={[styles.quoteText, { color: "#FFFFFF" }]}
        numberOfLines={expanded ? undefined : 3}
        onTextLayout={(e) => {
          if (!expanded) setIsTruncated(e.nativeEvent.lines.length >= 3);
        }}
      >
        "{quote.text}"
      </Text>

      {!expanded && isTruncated && (
        <Pressable onPress={() => setExpanded(true)} hitSlop={8} style={styles.readMore}>
          <Text style={[styles.readMoreText, { color: BLUE_ACCENT }]}>Leer más</Text>
        </Pressable>
      )}

      <Text style={[styles.author, { color: BLUE_ACCENT }]}>{quote.author}</Text>

      <View style={styles.footer}>
        <Pressable
          onPress={handleShare}
          hitSlop={12}
          style={({ pressed }) => [styles.shareBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Feather name="share-2" size={18} color={BLUE_MUTED} />
          <Text style={[styles.shareText, { color: BLUE_MUTED }]}>Compartir</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 16,
    backgroundColor: "rgba(100,185,230,0.09)",
    borderRadius: 16,
  },
  quoteText: {
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 25,
    marginBottom: 8,
  },
  readMore: {
    marginBottom: 8,
  },
  readMoreText: {
    fontSize: 13,
    fontWeight: "600",
  },
  author: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 16,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
  },
  shareBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  shareText: {
    fontSize: 13,
  },
});
