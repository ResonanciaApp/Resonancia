import { useState } from "react";
import { View, Text, Pressable, StyleSheet, Share, Modal } from "react-native";
import { Feather } from "@expo/vector-icons";
import { getQuoteOfTheDay } from "@/data/quotes";

const GOLD    = "#D4AF37";
const MUTED   = "rgba(242,231,228,0.45)";
const CARD_BG = "rgba(100,185,230,0.09)";

export default function QuoteOfTheDay() {
  const quote = getQuoteOfTheDay();
  const [expanded, setExpanded]       = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);

  async function handleSendFriend() {
    setMenuVisible(false);
    try {
      await Share.share({
        message: `"${quote.text}"\n\n— ${quote.author}\n\nVía RESONANCIA`,
      });
    } catch { /* ignore */ }
  }

  function handleShareProfile() {
    setMenuVisible(false);
    // TODO: integrar con perfil
  }

  return (
    <View style={styles.card}>
      {/* Frase */}
      <Text
        style={styles.quoteText}
        numberOfLines={expanded ? undefined : 3}
        onTextLayout={(e) => {
          if (!expanded) setIsTruncated(e.nativeEvent.lines.length >= 3);
        }}
      >
        "{quote.text}"
      </Text>

      {/* Autor centrado */}
      <Text style={styles.author}>— {quote.author}</Text>

      {/* Leer más / Leer menos — debajo del autor */}
      {(isTruncated || expanded) && (
        <Pressable
          onPress={() => setExpanded((v) => !v)}
          style={({ pressed }) => [styles.readMoreBtn, { opacity: pressed ? 0.8 : 1 }]}
        >
          <Text style={styles.readMoreText}>
            {expanded ? "Leer menos" : "Leer más"}
          </Text>
        </Pressable>
      )}

      {/* Footer: ··· izquierda */}
      <View style={styles.footer}>
        <Pressable
          onPress={() => setMenuVisible(true)}
          hitSlop={12}
          style={({ pressed }) => [styles.menuBtn, { opacity: pressed ? 0.6 : 1 }]}
        >
          <Feather name="more-horizontal" size={20} color={MUTED} />
        </Pressable>
      </View>

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
              onPress={handleShareProfile}
            >
              <Feather name="user" size={16} color={GOLD} />
              <Text style={styles.menuItemText}>Compartir en mi perfil</Text>
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
    marginBottom: 8,
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    backgroundColor: CARD_BG,
    borderRadius: 16,
  },
  quoteText: {
    fontSize: 17,
    fontWeight: "700",
    lineHeight: 25,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 8,
  },
  readMoreBtn: {
    alignSelf: "center",
    marginBottom: 14,
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(190,150,80,0.15)",
    borderWidth: 1,
    borderColor: "rgba(190,150,80,0.35)",
  },
  readMoreText: {
    fontSize: 13,
    fontWeight: "600",
    color: GOLD,
  },
  author: {
    fontSize: 13,
    fontWeight: "500",
    color: GOLD,
    textAlign: "center",
    marginBottom: 14,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  menuBtn: {
    padding: 2,
  },

  // Mini menú
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
    fontSize: 16,
    color: "#F4DAD5",
    fontWeight: "500",
  },
  menuDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(190,150,80,0.2)",
  },
});
