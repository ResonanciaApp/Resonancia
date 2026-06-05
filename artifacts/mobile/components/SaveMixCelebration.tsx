/**
 * SaveMixCelebration — overlay de confirmación al guardar una mezcla.
 * ─────────────────────────────────────────────────────────────────
 * Muestra una animación donde la mezcla (token con su imagen) "vuela"
 * hacia arriba y se mete en la categoría destino, junto con el mensaje
 * "Guardaste tu mezcla en {categoría}". Al terminar llama onDone().
 *
 * Usa solo la Animated API de React Native (sin dependencias extra).
 * ─────────────────────────────────────────────────────────────────
 */
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import { Animated, Dimensions, Easing, Modal, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getMixImage } from "@/config/mix-images";
import type { MixCategoryMeta } from "@/data/mix-categories";
import { useColors } from "@/hooks/useColors";

type Props = {
  visible: boolean;
  category: MixCategoryMeta | undefined;
  imageKey?: string;
  onDone: () => void;
};

export function SaveMixCelebration({ visible, category, imageKey, onDone }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { height } = Dimensions.get("window");

  const pillCenterY = insets.top + 64;
  const flyDistance = height / 2 - pillCenterY;

  const root = useRef(new Animated.Value(0)).current;
  const tokenScale = useRef(new Animated.Value(0.4)).current;
  const tokenY = useRef(new Animated.Value(0)).current;
  const tokenOpacity = useRef(new Animated.Value(1)).current;
  const pillScale = useRef(new Animated.Value(1)).current;
  const pillGlow = useRef(new Animated.Value(0)).current;
  const msgOpacity = useRef(new Animated.Value(0)).current;
  const msgY = useRef(new Animated.Value(10)).current;

  useEffect(() => {
    if (!visible || !category) return;

    root.setValue(0);
    tokenScale.setValue(0.4);
    tokenY.setValue(0);
    tokenOpacity.setValue(1);
    pillScale.setValue(1);
    pillGlow.setValue(0);
    msgOpacity.setValue(0);
    msgY.setValue(10);

    const anim = Animated.sequence([
      // 1) aparece el overlay + el token crece en el centro
      Animated.parallel([
        Animated.timing(root, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(tokenScale, { toValue: 1, friction: 6, tension: 80, useNativeDriver: true }),
      ]),
      Animated.delay(240),
      // 2) el token vuela hacia la categoría (arriba), encogiéndose
      Animated.parallel([
        Animated.timing(tokenY, {
          toValue: -flyDistance,
          duration: 640,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(tokenScale, {
          toValue: 0.3,
          duration: 640,
          easing: Easing.in(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.delay(380),
          Animated.timing(tokenOpacity, { toValue: 0, duration: 280, useNativeDriver: true }),
        ]),
        // el mensaje entra mientras el token vuela
        Animated.sequence([
          Animated.delay(160),
          Animated.parallel([
            Animated.timing(msgOpacity, { toValue: 1, duration: 320, useNativeDriver: true }),
            Animated.timing(msgY, {
              toValue: 0,
              duration: 320,
              easing: Easing.out(Easing.cubic),
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]),
      // 3) la categoría "recibe" el token (pulso + brillo)
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pillScale, { toValue: 1.18, duration: 160, useNativeDriver: true }),
          Animated.spring(pillScale, { toValue: 1, friction: 4, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(pillGlow, { toValue: 1, duration: 150, useNativeDriver: true }),
          Animated.timing(pillGlow, { toValue: 0, duration: 520, useNativeDriver: true }),
        ]),
      ]),
      // 4) se mantiene un momento y se va
      Animated.delay(950),
      Animated.timing(root, { toValue: 0, duration: 280, useNativeDriver: true }),
    ]);

    anim.start(({ finished }) => {
      if (finished) onDone();
    });

    return () => anim.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible]);

  if (!category) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={() => {}}>
      <Animated.View style={[styles.overlay, { opacity: root }]} pointerEvents="none">
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(12,8,5,0.82)" }]} />

        {/* Categoría destino (arriba) */}
        <Animated.View
          style={[
            styles.pill,
            {
              top: insets.top + 40,
              backgroundColor: colors.card,
              borderColor: colors.primary,
              transform: [{ scale: pillScale }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.pillGlow,
              { borderColor: colors.accent, opacity: pillGlow, transform: [{ scale: 1.25 }] },
            ]}
          />
          <Text style={[styles.pillLabel, { color: colors.foreground }]}>{category.label}</Text>
        </Animated.View>

        {/* Token de la mezcla que vuela */}
        <Animated.View
          style={[
            styles.token,
            {
              borderColor: colors.primary,
              opacity: tokenOpacity,
              transform: [{ translateY: tokenY }, { scale: tokenScale }],
            },
          ]}
        >
          <Animated.Image source={getMixImage(imageKey)} style={styles.tokenImg} />
        </Animated.View>

        {/* Mensaje */}
        <Animated.View
          style={[
            styles.message,
            { opacity: msgOpacity, transform: [{ translateY: msgY }] },
          ]}
        >
          <View style={styles.checkWrap}>
            <MaterialCommunityIcons name="heart" size={28} color="#E05252" />
          </View>
          <Text style={[styles.msgTitle, { color: colors.foreground }]}>¡Mezcla guardada!</Text>
          <Text style={[styles.msgSub, { color: colors.mutedForeground }]}>
            Guardaste tu mezcla en{" "}
            <Text style={{ color: colors.accent, fontWeight: "700" }}>{category.label}</Text>
          </Text>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, alignItems: "center", justifyContent: "center" },

  pill: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1.5,
  },
  pillGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 999,
    borderWidth: 2,
  },
  pillIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  pillLabel: { fontSize: 14, fontWeight: "700", paddingRight: 4 },

  token: {
    width: 96,
    height: 96,
    borderRadius: 22,
    borderWidth: 2,
    overflow: "hidden",
  },
  tokenImg: { width: "100%", height: "100%" },
  tokenBadge: {
    position: "absolute",
    right: -6,
    bottom: -6,
  },
  tokenBadgeInner: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(12,8,5,0.9)",
  },

  message: {
    position: "absolute",
    alignSelf: "center",
    top: "58%",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  checkWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  msgTitle: { fontSize: 19, fontWeight: "700", letterSpacing: 0.3, marginBottom: 6 },
  msgSub: { fontSize: 14, lineHeight: 20, textAlign: "center" },
});
