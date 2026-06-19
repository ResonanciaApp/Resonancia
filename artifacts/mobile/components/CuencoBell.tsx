import React, { useCallback, useEffect } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import Svg, { Ellipse, Line, Path } from "react-native-svg";
import { router } from "expo-router";
import { useNotifications } from "@/context/NotificationsContext";

function CuencoSvg({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      {/* Rim superior — elipse plana */}
      <Ellipse
        cx="12"
        cy="7"
        rx="9"
        ry="2.2"
        stroke={color}
        strokeWidth="1.6"
        fill="none"
      />
      {/* Cuerpo del cuenco — curva hacia abajo */}
      <Path
        d="M 3 7 C 2.5 13 4.5 19.5 12 19.5 C 19.5 19.5 21.5 13 21 7"
        stroke={color}
        strokeWidth="1.6"
        fill="none"
        strokeLinecap="round"
      />
      {/* Patas del soporte */}
      <Line
        x1="9.5"
        y1="19.5"
        x2="9"
        y2="22"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <Line
        x1="14.5"
        y1="19.5"
        x2="15"
        y2="22"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Base horizontal */}
      <Line
        x1="7"
        y1="22"
        x2="17"
        y2="22"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </Svg>
  );
}

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
  const iconColor = hasBadge ? "#D4AF37" : "rgba(244,218,213,0.55)";

  return (
    <Pressable
      onPress={() => router.push("/notificaciones" as never)}
      hitSlop={10}
      style={styles.btn}
    >
      <Animated.View style={animStyle}>
        <CuencoSvg color={iconColor} />
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
  badge: {
    position: "absolute",
    top: 3,
    right: 3,
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
