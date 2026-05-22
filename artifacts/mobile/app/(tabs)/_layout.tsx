import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MiniPlayer } from "@/components/MiniPlayer";
import { usePlayer } from "@/context/PlayerContext";
import { useColors } from "@/hooks/useColors";

function NativeTabLayout() {
  const { currentSession } = usePlayer();
  return (
    <View style={{ flex: 1 }}>
      <NativeTabs>
        <NativeTabs.Trigger name="index">
          <Icon sf={{ default: "house", selected: "house.fill" }} />
          <Label>Inicio</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="explore">
          <Icon sf={{ default: "safari", selected: "safari.fill" }} />
          <Label>Explorar</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="favorites">
          <Icon sf={{ default: "heart", selected: "heart.fill" }} />
          <Label>Favoritos</Label>
        </NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile">
          <Icon sf={{ default: "person", selected: "person.fill" }} />
          <Label>Perfil</Label>
        </NativeTabs.Trigger>
      </NativeTabs>
      {currentSession && (
        <View style={styles.miniPlayerFloat}>
          <MiniPlayer />
        </View>
      )}
    </View>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { currentSession } = usePlayer();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  const tabBarHeight = 50 + (isWeb ? 34 : insets.bottom);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.mutedForeground,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: isIOS ? "transparent" : colors.background,
            borderTopWidth: 1,
            borderTopColor: colors.border,
            elevation: 0,
            height: tabBarHeight,
          },
          tabBarBackground: () =>
            isIOS ? (
              <BlurView
                intensity={90}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
            ) : (
              <View
                style={[StyleSheet.absoluteFill, { backgroundColor: colors.background }]}
              />
            ),
          tabBarLabelStyle: {
            fontSize: 10,
            letterSpacing: 0.5,
            marginBottom: isWeb ? 8 : 0,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: "Inicio",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="house" tintColor={color} size={22} />
              ) : (
                <Feather name="home" size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: "Explorar",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="safari" tintColor={color} size={22} />
              ) : (
                <Feather name="compass" size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="favorites"
          options={{
            title: "Favoritos",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="heart" tintColor={color} size={22} />
              ) : (
                <Feather name="heart" size={22} color={color} />
              ),
          }}
        />
        <Tabs.Screen
          name="profile"
          options={{
            title: "Perfil",
            tabBarIcon: ({ color }) =>
              isIOS ? (
                <SymbolView name="person" tintColor={color} size={22} />
              ) : (
                <Feather name="user" size={22} color={color} />
              ),
          }}
        />
      </Tabs>

      {/* Mini Player floats above tab bar */}
      {currentSession && (
        <View style={[styles.miniPlayerFloat, { bottom: tabBarHeight + 8 }]}>
          <MiniPlayer />
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}

const styles = StyleSheet.create({
  miniPlayerFloat: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 90,
  },
});
