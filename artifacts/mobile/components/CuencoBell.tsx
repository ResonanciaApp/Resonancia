import React, { useCallback, useEffect, useRef } from "react";
import { Animated, Easing, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useNotifications } from "@/context/NotificationsContext";

const CUENCO_ICON = require("@/assets/images/cuenco-icon.png");

const MUTED_OPACITY = 0.38;
const GOLD = "#D4AF37";

export function CuencoBell() {
  const { unreadCount } = useNotifications();
  const hasBadge = unreadCount > 0;

  const glowOpacity  = useRef(new Animated.Value(0)).current;
  const goldOpacity  = useRef(new Animated.Value(0)).current;
  const iconOpacity  = useRef(new Animated.Value(hasBadge ? 1 : MUTED_OPACITY)).current;
  const scaleAnim    = useRef(new Animated.Value(1)).current;

  const timersRef  = useRef<ReturnType<typeof setTimeout>[]>([]);
  const firedRef   = useRef(false);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const runGlow = useCallback(() => {
    clearTimers();

    glowOpacity.setValue(0);
    goldOpacity.setValue(0);
    scaleAnim.setValue(1);
    iconOpacity.setValue(1);

    // ── Encendido: aparece oro + glow + leve pulso de escala ──
    const FADE_IN = 480;
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
          toValue: 1.18,
          duration: 240,
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

    // ── Apagado después de hold ──
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
      ]).start();
    }, FADE_IN + 1800);
    timersRef.current.push(t);
  }, [clearTimers, glowOpacity, goldOpacity, scaleAnim, iconOpacity]);

  useEffect(() => {
    if (hasBadge && !firedRef.current) {
      firedRef.current = true;
      const t = setTimeout(runGlow, 320);
      timersRef.current.push(t);
    } else if (!hasBadge) {
      firedRef.current = false;
      clearTimers();
      iconOpacity.setValue(MUTED_OPACITY);
      glowOpacity.setValue(0);
      goldOpacity.setValue(0);
      scaleAnim.setValue(1);
    }
  }, [hasBadge, runGlow, clearTimers, iconOpacity, glowOpacity, goldOpacity, scaleAnim]);

  return (
    <Pressable
      onPress={() => router.push("/notificaciones" as never)}
      hitSlop={10}
      style={styles.btn}
    >
      {/* ── Glow dorado detrás del ícono ── */}
      <Animated.View
        pointerEvents="none"
        style={[styles.glow, { opacity: glowOpacity }]}
      />

      {/* ── Ícono base (blanco, atenuado sin badge) ── */}
      <Animated.Image
        source={CUENCO_ICON}
        style={[styles.icon, { opacity: iconOpacity, transform: [{ scale: scaleAnim }] }]}
        resizeMode="contain"
      />

      {/* ── Capa dorada encima: se funde sobre el blanco ── */}
      <Animated.Image
        source={CUENCO_ICON}
        // @ts-ignore tintColor no está en los typings de Animated.Image pero funciona
        style={[styles.icon, styles.goldOverlay, { opacity: goldOpacity, tintColor: GOLD }]}
        resizeMode="contain"
      />

      {/* ── Badge de conteo ── */}
      {hasBadge && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {unreadCount > 9 ? "9+" : String(unreadCount)}
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "transparent",
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 14,
    elevation: 0,
  },
  icon: {
    width: 26,
    height: 26,
  },
  goldOverlay: {
    position: "absolute",
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: GOLD,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#1B060F",
    fontSize: 8,
    fontWeight: "800",
    lineHeight: 11,
  },
});
