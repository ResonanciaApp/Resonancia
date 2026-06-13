import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Image,
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
import {
  TabBarVisibilityProvider,
  useTabBarVisibility,
} from "@/context/TabBarVisibilityContext";

const ACTIVE_COLOR = "#FFFFFF";
const INACTIVE_COLOR = "#F4DAD5";
const PILL_BG = "rgba(244,218,213,0.18)";
const BAR_BORDER = "rgba(244,218,213,0.10)";

// Rutas que nunca aparecen en el menú inferior
const HIDDEN_ROUTES = new Set(["musica2", "musica3", "descanzo", "profile"]);

const TAB_CONFIG: Record<
  string,
  {
    label: string;
    sfIcon: string;
    sfIconFill: string;
    featherIcon: string;
    /** Si está presente, se usa esta imagen (tintada) en vez del ícono. */
    image?: number;
  }
> = {
  index:      { label: "Inicio",     sfIcon: "house",               sfIconFill: "house.fill",              featherIcon: "home" },
  explore:    { label: "Buscar",     sfIcon: "magnifyingglass",     sfIconFill: "magnifyingglass",         featherIcon: "search" },
  musica:     { label: "Mezclador",  sfIcon: "slider.horizontal.3", sfIconFill: "slider.horizontal.3",    featherIcon: "sliders" },
  musica2:    { label: "Música 2",   sfIcon: "slider.horizontal.3", sfIconFill: "slider.horizontal.3",    featherIcon: "sliders" },
  musica3:    { label: "Mi Música",  sfIcon: "slider.horizontal.3", sfIconFill: "slider.horizontal.3",    featherIcon: "sliders" },
  geometrix:  { label: "Geometrix", sfIcon: "hexagon",              sfIconFill: "hexagon.fill",            featherIcon: "hexagon", image: require("@/assets/images/geometrix/cubo-1.png") },
  biblioteca: { label: "Biblioteca", sfIcon: "books.vertical",      sfIconFill: "books.vertical.fill",    featherIcon: "bookmark" },
  profile:    { label: "Perfil",     sfIcon: "person",              sfIconFill: "person.fill",             featherIcon: "user" },
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
        {conf.image ? (
          <Image
            source={conf.image}
            style={{ width: 23, height: 23 }}
            tintColor={iconColor}
            resizeMode="contain"
          />
        ) : isIOS ? (
          <SymbolView
            name={(isFocused ? conf.sfIconFill : conf.sfIcon) as never}
            tintColor={iconColor}
            size={23}
          />
        ) : (
          <Feather name={conf.featherIcon as never} size={23} color={iconColor} />
        )}
      </View>
      <Text style={[styles.label, { color: iconColor }]}>{conf.label}</Text>
    </Pressable>
  );
}

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>["tabBar"]>>[0];

function CustomTabBar({ state, navigation, descriptors }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const pb = isWeb ? 8 : insets.bottom;
  const extra = Math.round(pb / 2);

  // Alto total de la barra: se desliza esa distancia (+ holgura) para esconderse.
  const barHeight = 31 + extra + pb;
  const { hidden } = useTabBarVisibility();
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: hidden ? barHeight + 40 : 0,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [hidden, barHeight, translateY]);

  return (
    <>
      {/* Tab bar principal — se desliza hacia abajo al ocultarse */}
      <Animated.View
        style={[styles.bar, { paddingBottom: pb, transform: [{ translateY }] }]}
      >
        <LinearGradient
          colors={["#4A0C0C", "#27070E", "#1B060F"]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.barBorder, { borderTopColor: BAR_BORDER }]} />
        <View style={[styles.row, isWeb && styles.rowWeb, { paddingTop: 8 + extra, height: 31 + extra }]}>
          {state.routes.map((route: { key: string; name: string; params?: object }, index: number) => {
            if (HIDDEN_ROUTES.has(route.name)) return null;

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
      </Animated.View>

    </>
  );
}

function TabLayoutInner() {
  const { currentSession } = usePlayer();
  const { activeSounds } = useMixer();
  const insets = useSafeAreaInsets();
  const isWeb = Platform.OS === "web";
  const bottomPb = isWeb ? 8 : insets.bottom;
  const tabBarHeight = 31 + Math.round(bottomPb / 2) + bottomPb;
  const { hidden } = useTabBarVisibility();

  // La barra flotante (sesión o mezcla) abre el editor en hoja inferior; se
  // muestra en todas las tabs, incluida "Mi Música".
  const mixActive = !currentSession && activeSounds.length > 0;
  const showMiniPlayer = currentSession || mixActive;
  // Cuando el menú está oculto (Geometrix), el mini player baja para no quedar
  // flotando sobre el espacio vacío que dejó la tab bar.
  const miniPlayerBottom = hidden ? bottomPb : tabBarHeight;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: "#0B0F14" } }}
        tabBar={(props) => <CustomTabBar {...props} />}
      >
        <Tabs.Screen name="index"          options={{ title: "Inicio" }} />
        <Tabs.Screen name="musica"         options={{ title: "Mezclador" }} />
        <Tabs.Screen name="coleccion/[id]" options={{ href: null }} />
        <Tabs.Screen name="explore"        options={{ title: "Buscar" }} />
        <Tabs.Screen name="biblioteca"     options={{ title: "Biblioteca" }} />
        <Tabs.Screen name="geometrix"      options={{ title: "Geometrix" }} />
        <Tabs.Screen name="musica2"        options={{ title: "Música 2", href: null }} />
        <Tabs.Screen name="musica3"        options={{ title: "Mi Música", href: null }} />
        <Tabs.Screen name="descanzo"       options={{ title: "Descanso", href: null }} />
        <Tabs.Screen name="profile"        options={{ title: "Perfil" }} />
      </Tabs>

      {showMiniPlayer && (
        <View style={[styles.miniPlayerFloat, { bottom: miniPlayerBottom }]}>
          <MiniPlayer />
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  return (
    <TabBarVisibilityProvider>
      <TabLayoutInner />
    </TabBarVisibilityProvider>
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
    height: 31,
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
    marginTop: -3,
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
    fontSize: 11,
    letterSpacing: 0.3,
    fontWeight: "500",
  },
  miniPlayerFloat: {
    position: "absolute",
    left: 0,
    right: 0,
  },
});
