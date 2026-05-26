import { View, Text, Image, Pressable, StyleSheet, Share } from "react-native";
import { Feather } from "@expo/vector-icons";
import { getQuoteOfTheDay, getShareCountForDay } from "@/data/quotes";

const GREEN_BG      = "#1A2E1A";
const GREEN_ACCENT  = "#A8C4A8";
const GREEN_CHIP_BG = "#2E4A2E";
const GREEN_MUTED   = "#7A9E7A";
const GREEN_BORDER  = "rgba(168,196,168,0.2)";

const AVATARS = [
  require("@/assets/images/sessions/session-3.jpg"),
  require("@/assets/images/sessions/session-7.jpg"),
  require("@/assets/images/sessions/session-12.jpg"),
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
    <View style={[styles.card, { backgroundColor: GREEN_BG, borderColor: GREEN_BORDER }]}>
      {/* Chip */}
      <View style={[styles.chip, { backgroundColor: GREEN_CHIP_BG }]}>
        <Text style={[styles.chipText, { color: GREEN_ACCENT }]}>Frase del día</Text>
      </View>

      {/* Quote */}
      <Text style={[styles.quoteText, { color: "#EDE1D3" }]}>
        "{quote.text}"
      </Text>

      {/* Author */}
      <Text style={[styles.author, { color: GREEN_ACCENT }]}>{quote.author}</Text>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Avatars + count */}
        <View style={styles.footerLeft}>
          <View style={styles.avatarRow}>
            {AVATARS.map((src, i) => (
              <Image
                key={i}
                source={src}
                style={[styles.avatar, { marginLeft: i === 0 ? 0 : -10, borderColor: GREEN_BG }]}
              />
            ))}
          </View>
          <Text style={[styles.countText, { color: GREEN_MUTED }]}>
            {formatCount(shareCount)} compartieron
          </Text>
        </View>

        {/* Share button */}
        <Pressable
          onPress={handleShare}
          style={({ pressed }) => [
            styles.shareBtn,
            { backgroundColor: GREEN_CHIP_BG, borderColor: GREEN_BORDER, opacity: pressed ? 0.75 : 1 },
          ]}
        >
          <Feather name="share-2" size={18} color={GREEN_ACCENT} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 20,
    borderWidth: 1,
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
    fontSize: 15,
    fontWeight: "500",
    marginBottom: 20,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  footerLeft: {
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
  shareBtn: {
    width: 42,
    height: 42,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
