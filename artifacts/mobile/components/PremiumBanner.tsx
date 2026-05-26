import { View, Text, Image, Pressable, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

const IMAGES = [
  require("@/assets/images/sessions/session-1.jpg"),
  require("@/assets/images/sessions/session-2.jpg"),
  require("@/assets/images/sessions/session-5.jpg"),
  require("@/assets/images/sessions/session-8.jpg"),
];

export default function PremiumBanner() {
  const colors = useColors();

  return (
    <View style={[styles.card, { backgroundColor: colors.background }]}>
      <Text style={[styles.heading, { color: colors.foreground }]}>
        Únete a la comunidad
      </Text>
      <Text style={[styles.headingGold, { color: colors.primary }]}>
        Premium
      </Text>
      <Text style={[styles.sub, { color: colors.mutedForeground }]}>
        Comienza tu camino hacia el bienestar con más de 500 meditaciones y sonidos relajantes.
      </Text>

      <View style={styles.images}>
        {IMAGES.map((src, i) => (
          <Image key={i} source={src} style={styles.thumb} />
        ))}
      </View>

      <Pressable
        style={({ pressed }) => [
          styles.btn,
          { backgroundColor: colors.primary, opacity: pressed ? 0.85 : 1 },
        ]}
      >
        <Text style={styles.btnText}>Probar gratis</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: "center",
  },
  heading: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    letterSpacing: 0.2,
  },
  headingGold: {
    fontSize: 26,
    fontWeight: "800",
    textAlign: "center",
    marginTop: 2,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  sub: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 20,
    maxWidth: 280,
  },
  images: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 24,
  },
  thumb: {
    width: 70,
    height: 70,
    borderRadius: 12,
    backgroundColor: "#2A1A3A",
  },
  btn: {
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 50,
  },
  btnText: {
    color: "#141B26",
    fontWeight: "700",
    fontSize: 16,
  },
});
