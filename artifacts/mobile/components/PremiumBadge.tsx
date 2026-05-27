import { Feather, FontAwesome } from "@expo/vector-icons";
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
  left?: number;
};

const GOLD = "#E5B84B";

export function PremiumBadge({ session, size = 20, top = 8, right, left }: Props) {
  const { isPremium } = usePremium();
  if (!session.isPremium || isPremium) return null;
  const pos = right != null ? { right } : { left: left ?? 8 };
  return (
    <FontAwesome
      name="star"
      size={size}
      color={GOLD}
      style={[styles.star, { top, ...pos }]}
    />
  );
}

const styles = StyleSheet.create({
  star: {
    position: "absolute",
    textShadowColor: "rgba(0,0,0,0.65)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
    zIndex: 10,
  },
});
