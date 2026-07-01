import { View, Text, StyleSheet } from "react-native";
import { getQuoteOfTheDay } from "@/data/quotes";

const GOLD  = "#BE8744";
const WHITE = "#FFFFFF";

export default function QuoteOfTheDay() {
  const quote = getQuoteOfTheDay();

  return (
    <View style={styles.card}>
      <Text style={styles.author}>{quote.author}</Text>
      <Text style={styles.quoteText} numberOfLines={4}>
        "{quote.text}"
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 22,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 15,
  },
  author: {
    fontSize: 12,
    fontWeight: "600",
    color: GOLD,
    marginBottom: 12,
    textAlign: "left",
  },
  quoteText: {
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 26,
    color: WHITE,
    textAlign: "left",
  },
});
