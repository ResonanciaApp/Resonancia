import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { SessionBadgeGlass } from "@/components/SessionDurationBadge";

const ENTRY_DISTANCE = 86;
const ENTRY_DURATION = 380;
const HOLD_DURATION = 1800;
const EXIT_DURATION = 320;

export function SavedConfirmationBanner({
  trigger,
  bottom,
  title,
  actionLabel,
  onPress,
}: {
  trigger: number;
  bottom: number;
  title: string;
  actionLabel?: string;
  onPress?: () => void;
}) {
  const [visible, setVisible] = useState(false);
  const translateY = useRef(new Animated.Value(ENTRY_DISTANCE)).current;
  const opacity = useRef(new Animated.Value(1)).current;
  const holdTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (trigger <= 0) return;
    if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
    translateY.stopAnimation();
    opacity.stopAnimation();
    translateY.setValue(ENTRY_DISTANCE);
    opacity.setValue(1);
    setVisible(true);

    Animated.timing(translateY, {
      toValue: 0,
      duration: ENTRY_DURATION,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (!finished) return;
      holdTimerRef.current = setTimeout(() => {
        holdTimerRef.current = null;
        Animated.parallel([
          Animated.timing(translateY, {
            toValue: ENTRY_DISTANCE,
            duration: EXIT_DURATION,
            easing: Easing.in(Easing.cubic),
            useNativeDriver: true,
          }),
          Animated.timing(opacity, {
            toValue: 0,
            duration: EXIT_DURATION,
            easing: Easing.out(Easing.quad),
            useNativeDriver: true,
          }),
        ]).start(({ finished: exited }) => {
          if (exited) setVisible(false);
        });
      }, HOLD_DURATION);
    });

    return () => {
      if (holdTimerRef.current) clearTimeout(holdTimerRef.current);
      translateY.stopAnimation();
      opacity.stopAnimation();
    };
  }, [opacity, translateY, trigger]);

  if (!visible) return null;

  const handlePress = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    translateY.stopAnimation();
    opacity.stopAnimation();
    setVisible(false);
    onPress?.();
  };

  return (
    <Animated.View
      style={[
        styles.banner,
        { bottom, opacity, transform: [{ translateY }] },
      ]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={title}
        onPress={handlePress}
        style={({ pressed }) => [
          styles.pressable,
          pressed && styles.pressed,
        ]}
      >
        <View pointerEvents="none" style={styles.glassSurface}>
          <SessionBadgeGlass showBlackTint={false} showWhiteTint />
        </View>
        <View style={styles.titleRow}>
          <View style={styles.checkSurface}>
            <Feather name="check" size={17} color="#F9F9F9" />
          </View>
          <Text style={styles.title} numberOfLines={2}>{title}</Text>
        </View>
        {actionLabel ? <Text style={styles.action}>{actionLabel}</Text> : null}
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: "absolute",
    left: 12,
    right: 12,
    height: 64,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.10)",
    shadowColor: "#000000",
    shadowOpacity: 0.3,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: -3 },
    zIndex: 40,
    elevation: 40,
  },
  pressable: {
    flex: 1,
    borderRadius: 18,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
  },
  pressed: { opacity: 0.6 },
  glassSurface: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 18,
    overflow: "hidden",
  },
  titleRow: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  checkSurface: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    flex: 1,
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "700",
  },
  action: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "700",
  },
});