import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
import { Platform, Pressable, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useSceneTheme } from "@/context/SceneThemeContext";
import { useColors } from "@/hooks/useColors";

export default function MembresiaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { theme } = useSceneTheme();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const backgroundColors = theme.gradient as unknown as [string, string, ...string[]];

  return (
    <LinearGradient
      style={styles.root}
      colors={backgroundColors}
      locations={theme.gradientLocations as unknown as [number, number, ...number[]] | undefined}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Feather
            name="chevron-left"
            size={28}
            color={colors.foreground}
            style={styles.backChevron}
          />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Suscripción</Text>
        <View style={styles.headerSpacer} />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  backButton: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(0,0,0,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  backChevron: {
    transform: [{ translateX: -1 }],
  },
  headerTitle: {
    flex: 1,
    fontFamily: "Manrope",
    fontSize: 20,
    lineHeight: 42,
    fontWeight: "700",
    textAlign: "center",
  },
  headerSpacer: {
    width: 43,
    height: 43,
  },
  pressed: {
    opacity: 0.72,
  },
});