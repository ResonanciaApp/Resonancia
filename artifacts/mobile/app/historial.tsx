import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack } from "expo-router";
import { useBackOverride } from "@/context/BackOverrideContext";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { HistorialCalendar } from "@/components/HistorialCalendar";
import { isIndigoThemeId } from "@/config/scene-themes";
import { useSceneTheme } from "@/context/SceneThemeContext";

export default function HistorialScreen() {
  const goBack = useBackOverride();
  const insets = useSafeAreaInsets();
  const { theme: sceneTheme, activeSceneId } = useSceneTheme();

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = insets.bottom + 24;
  const libraryHeaderButtonBackground = isIndigoThemeId(activeSceneId)
    ? "rgba(181,211,255,0.057)"
    : "rgba(255,255,255,0.12)";

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

      <View style={styles.contentShift}>
        <View style={[styles.stickyHeader, { paddingTop: topPad + 8 }]}>
          <View style={[styles.stickyHeaderRow, styles.libraryTabHeaderRow]}>
            <Pressable
              onPress={goBack ?? (() => router.canGoBack() ? router.back() : router.replace("/(tabs)" as never))}
              hitSlop={6}
              style={styles.libraryTabBackHitArea}
              accessibilityRole="button"
              accessibilityLabel="Volver a Inicio"
            >
              {({ pressed }) => (
                <View
                  style={[
                    styles.libraryTabBackBtn,
                    { backgroundColor: libraryHeaderButtonBackground, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Feather name="chevron-left" size={26} color="#FBFBFB" />
                </View>
              )}
            </Pressable>
            <Text style={styles.stickyTitleLibraryTab}>Historial</Text>
          </View>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={{
            paddingBottom: 160 + bottomPad,
            paddingTop: 23,
            paddingHorizontal: 19,
          }}
          showsVerticalScrollIndicator={false}
        >
          <HistorialCalendar />
        </ScrollView>
      </View>
    </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  contentShift: {
    flex: 1,
    transform: [{ translateY: -5 }],
  },
  stickyHeader: {
    zIndex: 10,
    backgroundColor: "transparent",
  },
  stickyHeaderRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 19,
    paddingBottom: 10,
  },
  libraryTabHeaderRow: {
    minHeight: 48,
    paddingBottom: 12,
  },
  libraryTabBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  libraryTabBackHitArea: {
    position: "absolute",
    left: 13,
    top: -6,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    elevation: 20,
  },
  stickyTitleLibraryTab: {
    fontFamily: "Manrope",
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    color: "#FBFBFB",
    letterSpacing: 0.2,
    textAlign: "center",
    flex: 1,
    marginLeft: 0,
  },
  scroll: { flex: 1 },
});
