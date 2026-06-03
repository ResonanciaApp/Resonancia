import { View, Text, Image, Pressable, StyleSheet, Share } from "react-native";
import { Feather } from "@expo/vector-icons";
import { getQuoteOfTheDay, getShareCountForDay } from "@/data/quotes";

const BLUE_BG       = "#090E17";
const BLUE_CHIP_BG  = "#0F1A2A";
const BLUE_ACCENT   = "#98825A";
const BLUE_MUTED    = "#7A8FA8";

const AVATARS = [
  require("@/assets/images/sessions/session-1.jpg"),
  require("@/assets/images/sessions/session-7.jpg"),
  require("@/assets/images/sessions/session-7.jpg"),
];

function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export default function QuoteOfTheDay() {
  const quote = getQuoteOfTheDay();
  const shareCount = getShareCountForDay();

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
      {/* Chip */}
      <View style={[styles.chip, { backgroundColor: BLUE_CHIP_BG }]}>
        <Text style={[styles.chipText, { color: BLUE_ACCENT }]}>Frase del día</Text>
      </View>

      {/* Quote */}
      <Text style={[styles.quoteText, { color: "#C8C1B5" }]}>
        "{quote.text}"
      </Text>

      {/* Author */}
      <Text style={[styles.author, { color: BLUE_ACCENT }]}>{quote.author}</Text>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Avatars + count */}
        <View style={styles.countChip}>
          <View style={styles.avatarRow}>
            {AVATARS.map((src, i) => (
              <Image
                key={i}
                source={src}
                style={[styles.avatar, { marginLeft: i === 0 ? 0 : -10, borderColor: BLUE_BG }]}
              />
            ))}
          </View>
          <Text style={[styles.countText, { color: BLUE_MUTED }]}>
            {formatCount(shareCount)} compartieron
          </Text>
        </View>

        {/* Share — solo icono */}
        <Pressable
          onPress={handleShare}
          hitSlop={12}
          style={({ pressed }) => [{ opacity: pressed ? 0.6 : 1 }]}
        >
          <Feather name="share-2" size={20} color={BLUE_ACCENT} />
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
  },
  chip: {
    alignSelf: "flex-start",
    borderRadius: 50,
    paddingHorizontal: 12,
    paddingVertical: 5,
    marginBottom: 16,
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
  quoteText: {
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 25,
    marginBottom: 12,
  },
  author: {
    fontSize: 14,
    fontWeight: "500",
    marginBottom: 20,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  countChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarRow: {
    flexDirection: "row",
  },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
  },
  countText: {
    fontSize: 13,
  },
});
