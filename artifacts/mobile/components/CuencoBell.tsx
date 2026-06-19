import React, { useCallback, useEffect } from "react";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { router } from "expo-router";
import { useNotifications } from "@/context/NotificationsContext";

const CUENCO_ICON = require("@/assets/images/cuenco-icon.png");

export function CuencoBell() {
  const { unreadCount, shouldAnimate, clearAnimation } = useNotifications();
  const rotation = useSharedValue(0);

  const triggerGong = useCallback(() => {
    rotation.value = withSequence(
      withTiming(7, { duration: 70, easing: Easing.out(Easing.quad) }),
      withTiming(-6, { duration: 110, easing: Easing.inOut(Easing.quad) }),
      withTiming(4.5, { duration: 95, easing: Easing.inOut(Easing.quad) }),
      withTiming(-3.5, { duration: 90 }),
      withTiming(2, { duration: 75 }),
      withTiming(-1, { duration: 65 }),
      withTiming(0, { duration: 80, easing: Easing.in(Easing.quad) }),
    );
  }, [rotation]);

  useEffect(() => {
    if (shouldAnimate) {
      triggerGong();
      clearAnimation();
    }
  }, [shouldAnimate, triggerGong, clearAnimation]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const hasBadge = unreadCount > 0;

  return (
    <Pressable
      onPress={() => router.push("/notificaciones" as never)}
      hitSlop={10}
      style={styles.btn}
    >
      <Animated.View style={animStyle}>
        <Image
          source={CUENCO_ICON}
          style={[styles.icon, !hasBadge && styles.iconMuted]}
          resizeMode="contain"
        />
      </Animated.View>
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
  icon: {
    width: 26,
    height: 26,
  },
  iconMuted: {
    opacity: 0.42,
  },
  badge: {
    position: "absolute",
    top: 2,
    right: 2,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: "#D4AF37",
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
