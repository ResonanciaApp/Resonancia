import { Feather } from "@expo/vector-icons";
import { BackPill } from "@/components/BackPill";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack } from "expo-router";
import { useBackOverride } from "@/context/BackOverrideContext";
import React from "react";
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HistorialCalendar } from "@/components/HistorialCalendar";
import { useSceneTheme } from "@/context/SceneThemeContext";

const FOREGROUND = "#F9F9F9";

export default function HistorialScreen() {
  const goBack = useBackOverride();
  const insets = useSafeAreaInsets();
  const { theme: sceneTheme } = useSceneTheme();

  const topPad = insets.top + 8;
  const bottomPad = insets.bottom + 24;

  return (
    <>
    <Stack.Screen options={{ contentStyle: { backgroundColor: sceneTheme.gradient[0] } }} />
    <LinearGradient
      style={[styles.root, { backgroundColor: sceneTheme.solid }]}
      colors={sceneTheme.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBar hidden />

      {/* Floating back */}
      <BackPill onPress={goBack ?? (() => router.canGoBack() ? router.back() : router.replace("/(tabs)" as never))} size={28} bgColor="rgba(255,255,255,0.10)" iconOffsetX={-1} style={{ position: "absolute", left: 20, top: topPad + 8, zIndex: 10 }} />

      {/* Page title */}
      <Text
        style={{
          fontFamily: "Manrope",
          fontSize: 27,
          fontWeight: "700",
          color: FOREGROUND,
          letterSpacing: 0.3,
          paddingHorizontal: 20,
          paddingTop: topPad + 60,
          marginBottom: 8,
        }}
      >
        Historial
      </Text>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: 160 + bottomPad,
          paddingTop: 16,
          paddingHorizontal: 19,
        }}
        showsVerticalScrollIndicator={false}
      >
        <HistorialCalendar />
      </ScrollView>
    </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
});
