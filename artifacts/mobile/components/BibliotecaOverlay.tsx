import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, Platform, Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BibliotecaScreen, type LibHeaderActions } from "@/components/BibliotecaScreen";
import { SacredBackground } from "@/components/SacredBackground";
import { useDrawer } from "@/context/DrawerContext";
import { DURATION, easeOutCubic } from "@/constants/motion";

const W = Dimensions.get("window").width;

/**
 * Pantalla de Biblioteca que se desliza desde la derecha SOBRE el menú drawer.
 * El drawer queda abierto debajo: al replegarse el overlay, el menú sigue visible.
 */
export function BibliotecaOverlay() {
  const { libOpen, closeLib } = useDrawer();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;

  // Montado mientras anima la salida (para que el repliegue se vea)
  const [rendered, setRendered] = useState(false);
  const slideAnim = useRef(new Animated.Value(W)).current;
  const [libActions, setLibActions] = useState<LibHeaderActions | null>(null);

  useEffect(() => {
    if (libOpen) {
      setRendered(true);
      slideAnim.stopAnimation();
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: DURATION.DRAWER,
        easing: easeOutCubic,
        useNativeDriver: true,
      }).start();
    } else if (rendered) {
      slideAnim.stopAnimation();
      Animated.timing(slideAnim, {
        toValue: W,
        duration: DURATION.DRAWER,
        easing: easeOutCubic,
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) setRendered(false);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [libOpen]);

  if (!rendered) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ translateX: slideAnim }] }]}>
      <LinearGradient
        colors={["#340D1A", "#190913"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.root}
      >
        <StatusBar barStyle="light-content" />
        <SacredBackground variant="solid" />

        {/* ── Header: atrás + título + lupa/+ ── */}
        <View style={[styles.header, { paddingTop: topPad + 2 }]}>
          <View style={styles.headerRow}>
            <Pressable onPress={closeLib} style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]} hitSlop={10}>
              <Feather name="chevron-left" size={28} color="#FBFBFB" />
            </Pressable>
            <Text style={styles.title}>Biblioteca</Text>
            {libActions && !libActions.hidden ? (
              <View style={styles.actionsPill}>
                <Pressable onPress={libActions.onSearch} hitSlop={10} style={styles.actionBtn}>
                  <Feather name="search" size={22} color="#f9f9f9" />
                </Pressable>
                <Pressable onPress={libActions.onAdd} hitSlop={10} style={styles.actionBtn}>
                  <Feather name="plus" size={29} color="#f9f9f9" />
                </Pressable>
              </View>
            ) : (
              <View style={{ width: 41 }} />
            )}
          </View>
        </View>

        <BibliotecaScreen embedded onHeaderActions={setLibActions} />
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingBottom: 4, zIndex: 10 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 19,
  },
  backBtn: {
    width: 41,
    height: 41,
    borderRadius: 20.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  title: {
    fontFamily: "Manrope",
    fontSize: 27,
    fontWeight: "700",
    color: "#F4F4F4",
    letterSpacing: 0.3,
    flex: 1,
    marginLeft: 12,
  },
  actionsPill: { flexDirection: "row", alignItems: "center", gap: 2, height: 48, marginRight: -5, borderRadius: 100 },
  actionBtn: { width: 32, height: 32, justifyContent: "center", alignItems: "center" },
});
