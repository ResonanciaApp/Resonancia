import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuoteOfTheDay } from "@/hooks/useQuoteOfTheDay";
import { DAILY_QUOTE_PALETTE_COLORS } from "@/constants/daily-quote-palettes";
import { DailyQuoteShareSheet } from "@/components/DailyQuoteShareSheet";
import { useDailyQuoteShare } from "@/hooks/useDailyQuoteShare";

const GOLD = "#F9F9F9";
const WHITE = "#FFFFFF";
const MUTED = "#c2c2c2";
export default function QuoteOfTheDay() {
  const { quote } = useQuoteOfTheDay();
  const sharing = useDailyQuoteShare(quote);

  return (
    <>
    <LinearGradient
      colors={DAILY_QUOTE_PALETTE_COLORS[quote.paletteId]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.card, quote.paletteId === "black16" && { backgroundColor: "transparent" }]}
    >
      {/* Autor arriba-izquierda + ··· arriba-derecha */}
      <View style={styles.header}>
        <Text style={styles.author}>{quote.author}</Text>
        <Pressable
          onPress={sharing.open}
          accessibilityRole="button"
          accessibilityLabel="Compartir frase del día"
          hitSlop={12}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Feather name="more-horizontal" size={20} color={MUTED} />
        </Pressable>
      </View>

      <Text style={styles.quoteText} numberOfLines={4}>
        "{quote.text}"
      </Text>

    </LinearGradient>
    <DailyQuoteShareSheet {...sharing.sheetProps} />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 22,
    backgroundColor: "rgba(0,0,0,0.14)",
    borderRadius: 15,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  author: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "600",
    color: GOLD,
  },
  quoteText: {
    fontFamily: "Manrope",
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 26,
    color: WHITE,
    textAlign: "left",
  },
});
