import React, { useCallback, useEffect, useRef } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useNotifications } from "@/context/NotificationsContext";

const ICON_SIZE = 24;
const MUTED_OPACITY = 0.38;
const GOLD = "#D4AF37";

export function CuencoBell() {
  const { unreadCount, shouldAnimate, clearAnimation, devSeedAndAnimate } = useNotifications();

  // ── DEV: auto-disparo al montar — siembra notificaciones y anima ──
  useEffect(() => {
    const t = setTimeout(() => { devSeedAndAnimate(); }, 800);
    return () => clearTimeout(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const hasBadge = unreadCount > 0 || shouldAnimate;

  // Animated values — todos usables con native driver
  const glowOpacity = useRef(new Animated.Value(0)).current;
  const goldOpacity = useRef(new Animated.Value(0)).current;
  const scaleAnim   = useRef(new Animated.Value(1)).current;
  const iconOpacity = useRef(new Animated.Value(hasBadge ? 1 : MUTED_OPACITY)).current;
  const dotOpacity  = useRef(new Animated.Value(hasBadge ? 1 : 0)).current;

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const runGlow = useCallback(() => {
    clearTimers();

    // Reset — NO tocar iconOpacity (el ícono base se queda donde está)
    glowOpacity.setValue(0);
    goldOpacity.setValue(0);
    scaleAnim.setValue(1);

    const FADE_IN = 480;

    // ── Encendido: aparece glow dorado + pulso de escala ──
    Animated.parallel([
      Animated.timing(glowOpacity, {
        toValue: 1,
        duration: FADE_IN,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(goldOpacity, {
        toValue: 1,
        duration: FADE_IN,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 1.2,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 5,
          tension: 80,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // ── Apagado del glow/dorado después del hold ──
    const t = setTimeout(() => {
      const FADE_OUT = 900;
      Animated.parallel([
        Animated.timing(glowOpacity, {
          toValue: 0,
          duration: FADE_OUT,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(goldOpacity, {
          toValue: 0,
          duration: FADE_OUT,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start(() => clearAnimation());
    }, FADE_IN + 1800);

    timersRef.current.push(t);
  }, [clearTimers, clearAnimation, glowOpacity, goldOpacity, scaleAnim]);

  // Reacciona a shouldAnimate (notificación real o botón forzado)
  useEffect(() => {
    if (shouldAnimate) {
      runGlow();
    }
  }, [shouldAnimate, runGlow]);

  // Sincroniza iconOpacity y dotOpacity con hasBadge, con transición suave
  useEffect(() => {
    if (!shouldAnimate) {
      const targetIcon = hasBadge ? 1 : MUTED_OPACITY;
      const targetDot  = hasBadge ? 1 : 0;
      const duration   = hasBadge ? 200 : 500;
      Animated.parallel([
        Animated.timing(iconOpacity, {
          toValue: targetIcon,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(dotOpacity, {
          toValue: targetDot,
          duration,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [hasBadge, shouldAnimate, iconOpacity, dotOpacity]);

  return (
    <Pressable
      onPress={() => router.push("/notificaciones" as never)}
      hitSlop={10}
      style={styles.btn}
    >
      {/* Glow dorado detrás */}
      <Animated.View
        pointerEvents="none"
        style={[styles.glow, { opacity: glowOpacity }]}
      />

      {/* Ícono base — blanco, atenuado sin badge */}
      <Animated.View style={{ opacity: iconOpacity, transform: [{ scale: scaleAnim }] }}>
        <Ionicons name="notifications" size={ICON_SIZE} color="#FFFFFF" />
      </Animated.View>

      {/* Capa dorada: View animado con el ícono dorado adentro */}
      <Animated.View
        pointerEvents="none"
        style={[styles.iconAbsolute, { opacity: goldOpacity, transform: [{ scale: scaleAnim }] }]}
      >
        <Ionicons name="notifications" size={ICON_SIZE} color={GOLD} />
      </Animated.View>

      {/* Badge con el número de notificaciones — entra/sale suavemente */}
      {unreadCount > 0 && (
        <Animated.View style={[styles.badge, { opacity: dotOpacity }]}>
          <Text style={styles.badgeText} numberOfLines={1}>
            {unreadCount > 99 ? "99+" : unreadCount}
          </Text>
        </Animated.View>
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
  iconAbsolute: {
    position: "absolute",
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
