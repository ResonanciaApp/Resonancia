import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

import { useMilestones } from "@/context/MilestonesContext";

const GOLD = "#BE9650";
const NAVY = "#060A0F";

/**
 * Ventana de celebración de hito. Una sola instancia global (dentro del
 * provider); muestra la cola de hitos uno por uno.
 * Gotcha conocido: Modal animationType="none" + Animated → resetear los
 * Animated.Value al estado CERRADO antes de cada apertura, o el primer
 * frame aparece "abierto" (ver memoria modal-first-frame-flash).
 */
export function MilestoneCelebration() {
  const { celebrating, dismissCelebration } = useMilestones();
  const [visible, setVisible] = useState(false);

  const dim = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.7)).current;
  const cardOpacity = useRef(new Animated.Value(0)).current;
  const badgePulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (celebrating) {
      // reset a CERRADO antes del primer frame
      dim.setValue(0);
      scale.setValue(0.7);
      cardOpacity.setValue(0);
      badgePulse.setValue(0);
      setVisible(true);
      Animated.parallel([
        Animated.timing(dim, { toValue: 1, duration: 260, useNativeDriver: true }),
        Animated.timing(cardOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 6,
          tension: 60,
          useNativeDriver: true,
        }),
      ]).start(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(badgePulse, {
              toValue: 1,
              duration: 1200,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(badgePulse, {
              toValue: 0,
              duration: 1200,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ]),
        ).start();
      });
    }
  }, [celebrating, dim, scale, cardOpacity, badgePulse]);

  const close = () => {
    Animated.parallel([
      Animated.timing(dim, { toValue: 0, duration: 200, useNativeDriver: true }),
      Animated.timing(cardOpacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) {
        setVisible(false);
        dismissCelebration();
      }
    });
  };

  if (!celebrating || !visible) return null;

  const badgeScale = badgePulse.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 1.08],
  });

  return (
    <Modal transparent visible animationType="none" onRequestClose={close}>
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, { opacity: dim }]} />
      <View style={styles.center} pointerEvents="box-none">
        <Animated.View style={[styles.card, { opacity: cardOpacity, transform: [{ scale }] }]}>
          <LinearGradient
            colors={[NAVY, "#0B1220"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.kicker}>
            {celebrating.superHito ? "✦ SUPER HITO ✦" : "HITO CONSEGUIDO"}
          </Text>
          <Animated.View style={[styles.badge, { transform: [{ scale: badgeScale }] }]}>
            <View style={styles.badgeRing} />
            <Text style={styles.badgeIcon}>{celebrating.icon}</Text>
          </Animated.View>
          <Text style={styles.title}>{celebrating.title}</Text>
          <Text style={styles.desc}>{celebrating.description}</Text>
          <Pressable onPress={close} style={({ pressed }) => [styles.btn, pressed && { opacity: 0.8 }]}>
            <Text style={styles.btnText}>Continuar</Text>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { backgroundColor: "rgba(0,0,0,0.72)" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  card: {
    width: "100%",
    maxWidth: 340,
    borderRadius: 24,
    overflow: "hidden",
    alignItems: "center",
    paddingVertical: 32,
    paddingHorizontal: 24,
    borderWidth: 1,
    borderColor: "rgba(190,150,80,0.45)",
  },
  kicker: {
    color: GOLD,
    fontSize: 12,
    letterSpacing: 3,
    fontWeight: "700",
    marginBottom: 20,
  },
  badge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    backgroundColor: "rgba(190,150,80,0.10)",
  },
  badgeRing: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: GOLD,
    shadowColor: GOLD,
    shadowOpacity: 0.6,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 0 },
  },
  badgeIcon: { fontSize: 42 },
  title: {
    color: "#F5EFE3",
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  desc: {
    color: "rgba(245,239,227,0.72)",
    fontSize: 15,
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 26,
  },
  btn: {
    backgroundColor: GOLD,
    borderRadius: 24,
    paddingHorizontal: 36,
    paddingVertical: 12,
  },
  btnText: { color: NAVY, fontWeight: "700", fontSize: 15 },
});
