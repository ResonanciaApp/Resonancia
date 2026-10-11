import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { CardCaptionText as Text } from "@/components/CardCaptionText";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { CARD_TEXT_BELOW, MEMBERSHIP_AURORA } from "@/constants/colors";
import { openPremiumPlans } from "@/lib/premiumGate";
import { router } from "expo-router";

export function ProfileMembershipBanner({
  isPremium,
  foregroundColor,
}: {
  isPremium: boolean;
  foregroundColor: string;
}) {
  return (
      <Pressable
        testID="profile-premium-banner"
        onPress={() => isPremium ? router.push("/membresia") : openPremiumPlans()}
        style={({ pressed }) => [styles.row, !isPremium && styles.trialCard, { opacity: pressed ? 0.78 : 1 }]}
        accessibilityRole="button"
        accessibilityLabel={isPremium ? "Abrir Tu Premium" : "Prueba Premium"}
      >
        <View style={[styles.icon, !isPremium && styles.centeredAdornment]}>
          <Image source={require("../assets/images/estrella-premium.png")} style={{ width: 31, height: 31 }} contentFit="contain" />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: MEMBERSHIP_AURORA.premium.accent }]}>
            {isPremium ? "Tu Premium" : "Prueba Premium"}
          </Text>
          <Text style={[styles.subtitle, { color: CARD_TEXT_BELOW }]}>
            {isPremium ? "Gestiona tu suscripción y beneficios" : "Tu transformación comienza acá"}
          </Text>
        </View>
        <View style={[styles.chevron, !isPremium && styles.centeredAdornment]}>
          <Feather name="chevron-right" size={24} color={foregroundColor} />
        </View>
      </Pressable>
  );
}

const styles = StyleSheet.create({
  trialCard: {
    backgroundColor: "rgba(0,0,0,0.16)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  centeredAdornment: {
    transform: [],
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 13,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  icon: {
    width: 31,
    height: 31,
    transform: [{ translateY: -3 }],
    borderRadius: 15.5,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: MEMBERSHIP_AURORA.premium.glow,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 18,
  },
  copy: {
    minWidth: 0,
    flex: 1,
    paddingRight: 3,
  },
  title: { fontFamily: "Manrope", fontSize: 14, fontWeight: "700", letterSpacing: -0.5 },
  subtitle: { fontFamily: "Manrope", fontSize: 12, lineHeight: 16, marginTop: 2 },
  chevron: {
    width: 32,
    height: 44,
    alignItems: "flex-end",
    justifyContent: "center",
    transform: [{ translateY: 3.5 }],
  },
});