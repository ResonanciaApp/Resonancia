import { useState } from "react";
import { View, Text, Pressable, StyleSheet, Share, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";
import { getQuoteOfTheDay } from "@/data/quotes";

const GOLD  = "#dad4ec";
const WHITE = "#FFFFFF";
const MUTED = "#c2c2c2";

export default function QuoteOfTheDay() {
  const quote = getQuoteOfTheDay();
  const [menuVisible, setMenuVisible] = useState(false);

  const shareMessage = `"${quote.text}"\n\n— ${quote.author}\n\nVía RESONANCIA`;

  async function handleSendFriend() {
    setMenuVisible(false);
    try {
      await Share.share({ message: shareMessage });
    } catch { /* ignore */ }
  }

  async function handleShare() {
    setMenuVisible(false);
    try {
      await Share.share({ message: shareMessage });
    } catch { /* ignore */ }
  }

  return (
    <View style={styles.card}>
      {/* Autor arriba-izquierda + ··· arriba-derecha */}
      <View style={styles.header}>
        <Text style={styles.author}>{quote.author}</Text>
        <Pressable
          onPress={() => setMenuVisible(true)}
          hitSlop={12}
          style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
        >
          <Feather name="more-horizontal" size={20} color={MUTED} />
        </Pressable>
      </View>

      <Text style={styles.quoteText} numberOfLines={4}>
        "{quote.text}"
      </Text>

      {/* Mini menú */}
      <Modal
        transparent
        visible={menuVisible}
        animationType="fade"
        onRequestClose={() => setMenuVisible(false)}
      >
        <Pressable style={styles.menuBackdrop} onPress={() => setMenuVisible(false)}>
          <View style={styles.menuSheet}>
            <Pressable
              style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.7 : 1 }]}
              onPress={handleSendFriend}
            >
              <Feather name="send" size={16} color={GOLD} />
              <Text style={styles.menuItemText}>Enviar a un amigo</Text>
            </Pressable>
            <View style={styles.menuDivider} />
            <Pressable
              style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.7 : 1 }]}
              onPress={handleShare}
            >
              <Feather name="share-2" size={16} color={GOLD} />
              <Text style={styles.menuItemText}>Compartir</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
    </View>
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
  menuBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.45)",
    justifyContent: "flex-end",
  },
  menuSheet: {
    backgroundColor: "#1E0A12",
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 36,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
  },
  menuItemText: {
    fontFamily: "Manrope",
    fontSize: 16,
    color: "#FAF0EE",
    fontWeight: "500",
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(190,150,80,0.2)",
  },
});
