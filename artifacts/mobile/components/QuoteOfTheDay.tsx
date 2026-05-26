import { View, Text, Image, Pressable, StyleSheet, Share } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { getQuoteOfTheDay, getShareCountForDay } from "@/data/quotes";

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
  const colors = useColors();
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
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: "rgba(198,155,79,0.18)",
        },
      ]}
    >
      {/* Chip */}
      <View style={[styles.chip, { backgroundColor: colors.foreground }]}>
        <Text style={[styles.chipText, { color: colors.background }]}>Frase del día</Text>
      </View>

      {/* Quote */}
      <Text style={[styles.quoteText, { color: colors.foreground }]}>
        "{quote.text}"
      </Text>

      {/* Author */}
      <Text style={[styles.author, { color: colors.primary }]}>{quote.author}</Text>

      {/* Footer */}
      <View style={styles.footer}>
        {/* Avatars + count */}
        <View style={styles.footerLeft}>
          <View style={styles.avatarRow}>
            {AVATARS.map((src, i) => (
              <Image
                key={i}
                source={src}
                style={[
                  styles.avatar,
                  { marginLeft: i === 0 ? 0 : -10, borderColor: colors.card },
                ]}
              />
            ))}
          </View>
          <Text style={[styles.countText, { color: colors.mutedForeground }]}>
            {formatCount(shareCount)} compartieron
          </Text>
        </View>

        {/* Share button */}
        <Pressable
          onPress={handleShare}
          style={({ pressed }) => [
            styles.shareBtn,
            {
              backgroundColor: colors.background,
              borderColor: "rgba(198,155,79,0.25)",
              opacity: pressed ? 0.75 : 1,
            },
          ]}
        >
          <Feather name="share-2" size={18} color={colors.primary} />
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
