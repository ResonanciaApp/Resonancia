import { BlurView } from "expo-blur";
import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MiniPlayer } from "@/components/MiniPlayer";
import { usePlayer } from "@/context/PlayerContext";
import { useMixer } from "@/context/MixerContext";

const ACTIVE_COLOR = "#FFFFFF";
const INACTIVE_COLOR = "rgba(255,255,255,0.42)";
const PILL_BG = "rgba(107,154,181,0.18)";
const BAR_BORDER = "rgba(182,149,95,0.18)";

const TAB_CONFIG: Record<
  string,
  {
    label: string;
    sfIcon: string;
    sfIconFill: string;
    featherIcon: string;
  }
> = {
  index:   { label: "Inicio",     sfIcon: "house",          sfIconFill: "house.fill",          featherIcon: "home" },
  explore: { label: "Biblioteca", sfIcon: "books.vertical", sfIconFill: "books.vertical.fill", featherIcon: "book-open" },
  musica:  { label: "Mezclador",  sfIcon: "slider.horizontal.3", sfIconFill: "slider.horizontal.3", featherIcon: "sliders" },
  profile: { label: "Perfil",     sfIcon: "person",         sfIconFill: "person.fill",         featherIcon: "user" },
};

function TabItem({
  route,
  isFocused,
  onPress,
}: {
  route: { key: string; name: string };
  isFocused: boolean;
  onPress: () => void;
}) {
  const conf = TAB_CONFIG[route.name];
  if (!conf) return null;

  const pillOpacity = useRef(new Animated.Value(isFocused ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(pillOpacity, {
      toValue: isFocused ? 1 : 0,
      duration: 180,
      useNativeDriver: true,
    }).start();
  }, [isFocused]);

  const isIOS = Platform.OS === "ios";
  const iconColor = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;

  return (
    <Pressable
      onPress={onPress}
      style={styles.tab}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
    >
      <View style={styles.iconWrap}>
        <Animated.View style={[styles.pill, { opacity: pillOpacity }]} />
        {isIOS ? (
          <SymbolView
            name={(isFocused ? conf.sfIconFill : conf.sfIcon) as never}
            tintColor={iconColor}
            size={22}
          />
        ) : (
          <Feather name={conf.featherIcon as never} size={22} color={iconColor} />
        )}
      </View>
      <Text style={[styles.label, { color: iconColor }]}>{conf.label}</Text>
    </Pressable>
  );
}

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>["tabBar"]>>[0];

function CustomTabBar({ state, navigation, descriptors }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const pb = isWeb ? 8 : insets.bottom;

  return (
    <View style={[styles.bar, { paddingBottom: pb }]}>
      {isIOS ? (
        <>
          <BlurView intensity={85} tint="dark" style={StyleSheet.absoluteFill} />
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(3, 6, 29, 0.65)" }]} />
        </>
      ) : (
        <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(3, 6, 29, 0.90)" }]} />
      )}
      <View style={[styles.barBorder, { borderTopColor: BAR_BORDER }]} />
      <View style={[styles.row, isWeb && styles.rowWeb]}>
        {state.routes.map((route: { key: string; name: string; params?: object }, index: number) => {
          const { options } = descriptors[route.key];
          if ((options as { href?: null }).href === null) return null;

          const isFocused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params as never);
            }
          };

          return (
            <TabItem
              key={route.key}
              route={route}
              isFocused={isFocused}
              onPress={onPress}
            />
          );
        })}
      </View>
    </View>
  );
}

export default function TabLayout() {
  const { currentSession } = usePlayer();
  const { activeSounds } = useMixer();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const tabBarHeight = 56 + (isWeb ? 34 : insets.bottom);

  // La barra flotante (sesión o mezcla) abre el editor en hoja inferior; se
  // muestra en todas las tabs, incluida "Mi Música".
  const mixActive = !currentSession && activeSounds.length > 0;
  const showMiniPlayer = currentSession || mixActive;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: "#090F17" } }}
        tabBar={(props) => <CustomTabBar {...props} />}
      >
        <Tabs.Screen name="index"    options={{ title: "Inicio" }} />
        <Tabs.Screen name="musica"   options={{ title: "Mezclador" }} />
        <Tabs.Screen name="descanzo" options={{ title: "Descanso", href: null }} />
        <Tabs.Screen name="explore"  options={{ title: "Biblioteca" }} />
        <Tabs.Screen name="profile"  options={{ title: "Perfil" }} />
      </Tabs>

      {showMiniPlayer && (
        <View style={[styles.miniPlayerFloat, { bottom: tabBarHeight + 6 }]}>
          <MiniPlayer />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  barBorder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  row: {
    flexDirection: "row",
    paddingTop: 8,
    paddingHorizontal: 8,
    height: 56,
  },
  rowWeb: {
    maxWidth: 430,
    width: "100%",
    alignSelf: "center",
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  iconWrap: {
    width: 52,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 10,
    backgroundColor: PILL_BG,
  },
  label: {
    fontSize: 10,
    letterSpacing: 0.3,
    fontWeight: "500",
  },
  miniPlayerFloat: {
    position: "absolute",
    left: 0,
    right: 0,
  },
});
