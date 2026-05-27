import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { StyleSheet, View } from "react-native";

import { usePremium } from "@/context/PremiumContext";
import { type Session } from "@/data/sessions";

export function useSessionGate(session: Session) {
  const { isPremium } = usePremium();
  const locked = !!session.isPremium && !isPremium;
  const openSession = () => {
    if (locked) router.push("/membresia" as never);
    else router.push(`/session/${session.id}` as never);
  };
  return { locked, openSession };
}

type Props = {
  session: Session;
  size?: number;
  top?: number;
  right?: number;
};

export function PremiumBadge({ session, size = 24, top = 8, right = 8 }: Props) {
  const { isPremium } = usePremium();
  if (!session.isPremium || isPremium) return null;
  return (
    <View
      style={[
        styles.badge,
        { width: size, height: size, borderRadius: size / 2, top, right },
      ]}
    >
      <Feather name="star" size={size * 0.5} color="#0C0908" />
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: "absolute",
    backgroundColor: "#D6A85B",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.35,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    zIndex: 10,
  },
});
