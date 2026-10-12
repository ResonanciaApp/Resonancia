import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { MEMBERSHIP_AURORA } from "@/constants/colors";
import { usePremiumContent } from "@/hooks/usePremiumContent";

export function SoundPremiumBanner() {
  const { content: { sounds } } = usePremiumContent();
  return (
    <Pressable
      onPress={() => router.push("/membresia" as never)}
      accessibilityRole="button"
      accessibilityLabel={sounds.title}
      style={({ pressed }) => [
        styles.banner,
        { opacity: pressed ? 0.82 : 1 },
      ]}
    >
      <View style={styles.icon}>
        <MaterialCommunityIcons
          name="star"
          color={MEMBERSHIP_AURORA.premium.accent}
          size={30}
        />
      </View>
      <View style={styles.copy}>
        <View style={styles.titleRow}>
          <Text style={styles.title}>{sounds.title.split(/(Plan Premium)/).map((part, i) =>
            <Text key={i} style={part === "Plan Premium" ? styles.premiumTitle : undefined}>{part}</Text>)}</Text>
        </View>
        <Text style={styles.subtitle}>
          {sounds.description}
        </Text>
      </View>
      <Feather name="chevron-right" size={20} color="rgba(249,249,249,0.7)" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  banner: {
    minHeight: 110,
    marginTop: 26,
    marginHorizontal: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "rgba(241,224,255,0.25)",
    backgroundColor: "rgba(0,0,0,0.34)",
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  icon: {
    width: 51,
    height: 51,
    borderRadius: 13,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  copy: {
    flex: 1,
    minWidth: 0,
  },
  title: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "700",
  },
  premiumTitle: {
    color: MEMBERSHIP_AURORA.premium.accent,
  },
  titleRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 4,
    marginBottom: 5,
  },
  subtitle: {
    color: "#F4F4F4",
    fontFamily: "Manrope",
    fontSize: 12,
  },
});