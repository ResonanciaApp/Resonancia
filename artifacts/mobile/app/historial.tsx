import { Feather } from "@expo/vector-icons";
import { GhostPill } from "@/components/GhostPill";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
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
    <View style={styles.root}>
      <StatusBar hidden />
      <LinearGradient colors={sceneTheme.gradient} style={StyleSheet.absoluteFill} />

      {/* Floating back */}
      <View
        style={{ position: "absolute", left: 16, top: topPad + 8, zIndex: 10 }}
        pointerEvents="box-none"
      >
        <GhostPill>
          <Pressable
            onPress={goBack ?? (() => router.back())}
            hitSlop={10}
            style={{
              paddingHorizontal: 12,
              paddingVertical: 8,
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Feather name="arrow-left" size={16} color="#FFFFFF" />
          </Pressable>
        </GhostPill>
      </View>

      {/* Page title */}
      <Text
        style={{
          fontFamily: "Manrope",
          fontSize: 30,
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
});
