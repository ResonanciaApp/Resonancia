import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { StyleSheet, Text, View } from "react-native";

type AstralGuidanceSectionProps = {
  backgroundColor?: string;
};

export function AstralGuidanceSection({
  backgroundColor = "rgba(38,3,84,0.15)",
}: AstralGuidanceSectionProps) {
  return (
    <View style={styles.section} testID="astral-guidance-section">
      <Text style={styles.title}>Orientación personalizada</Text>
      <View style={[styles.banner, { backgroundColor }]}>
        <View style={styles.botAvatar}>
          <MaterialCommunityIcons name="robot-outline" size={26} color="#F9F9F9" />
        </View>
        <View style={styles.bannerCopy}>
          <Text style={styles.bannerText} numberOfLines={1}>
            Conversa con Astral AI
          </Text>
          <Text style={styles.bannerDescription}>
            ¿Tienes algo que compartir? Yo puedo ayudarte...
          </Text>
        </View>
        <Feather name="chevron-right" size={16} color="#F9F9F9" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: 0,
    marginTop: 44,
    marginBottom: 34,
  },
  title: {
    marginHorizontal: 0,
    marginBottom: 22,
    fontFamily: "Manrope",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.3,
    color: "#FBFBFB",
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 0,
    marginBottom: 8,
    borderRadius: 27,
    overflow: "hidden",
    paddingHorizontal: 16,
    paddingVertical: 29,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  botAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(181,211,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(190,150,80,0.42)",
  },
  bannerCopy: {
    flex: 1,
    justifyContent: "center",
    gap: 3,
    transform: [{ translateX: 10 }],
  },
  bannerText: {
    fontFamily: "Manrope",
    color: "#F9F9F9",
    fontSize: 16,
    fontWeight: "600",
  },
  bannerDescription: {
    fontFamily: "Manrope",
    color: "rgba(244,244,244,0.62)",
    fontSize: 12,
    lineHeight: 17,
  },
});