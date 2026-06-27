import React, { useCallback, useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useNotifications } from "@/context/NotificationsContext";

const ICON_SIZE = 24;
const GOLD = "#D4AF37";
const WHITE = "#FFFFFF";
const MUTED = "rgba(242,231,228,0.40)";

export function CuencoBell() {
  const { unreadCount, shouldAnimate, clearAnimation } = useNotifications();
  const hasUnread = unreadCount > 0;

  // Animated values para el glow dorado de llegada (solo efecto visual)
  const glowOpacity  = useRef(new Animated.Value(0)).current;
  const goldOpacity  = useRef(new Animated.Value(0)).current;
  const scaleAnim    = useRef(new Animated.Value(1)).current;

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const runGlow = useCallback(() => {
    clearTimers();
    glowOpacity.setValue(0);
    goldOpacity.setValue(0);
    scaleAnim.setValue(1);

    const FADE_IN = 480;
    Animated.parallel([
      Animated.timing(glowOpacity, { toValue: 1, duration: FADE_IN, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(goldOpacity, { toValue: 1, duration: FADE_IN, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(scaleAnim, { toValue: 1.2, duration: 220, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, friction: 5, tension: 80, useNativeDriver: true }),
      ]),
    ]).start();

    const t = setTimeout(() => {
      Animated.parallel([
        Animated.timing(glowOpacity, { toValue: 0, duration: 900, easing: Easing.in(Easing.quad), useNativeDriver: true }),
        Animated.timing(goldOpacity, { toValue: 0, duration: 900, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]).start(() => clearAnimation());
    }, FADE_IN + 1800);

    timersRef.current.push(t);
  }, [clearTimers, clearAnimation, glowOpacity, goldOpacity, scaleAnim]);

  useEffect(() => {
    if (shouldAnimate) runGlow();
  }, [shouldAnimate, runGlow]);

  // Color del ícono base: blanco con no-leídas, gris apagado al leer
  const iconColor = hasUnread ? WHITE : MUTED;

  return (
    <Pressable onPress={() => router.push("/notificaciones" as never)} hitSlop={10} style={styles.btn}>

      {/* Glow dorado detrás */}
      <Animated.View pointerEvents="none" style={[styles.glow, { opacity: glowOpacity }]} />

      {/* Ícono base — color cambia directamente: blanco (no-leídas) / gris (leídas) */}
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Ionicons name="notifications" size={ICON_SIZE} color={iconColor} />
      </Animated.View>

      {/* Overlay dorado de llegada — se desvanece solo */}
      <Animated.View pointerEvents="none" style={[styles.overlay, { opacity: goldOpacity, transform: [{ scale: scaleAnim }] }]}>
        <Ionicons name="notifications" size={ICON_SIZE} color={GOLD} />
      </Animated.View>

      {/* Badge con número */}
      {hasUnread && (
        <View style={styles.badge}>
          <Text style={styles.badgeText} numberOfLines={1}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  glow: {
    position: "absolute",
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "transparent",
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 0,
  },
  overlay: {
    position: "absolute",
    alignSelf: "center",
  },
  badge: {
    position: "absolute",
    top: -2,
    right: -3,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: GOLD,
    borderWidth: 1,
    borderColor: "#1B060F",
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#1B060F",
    textAlign: "center",
  },
});
