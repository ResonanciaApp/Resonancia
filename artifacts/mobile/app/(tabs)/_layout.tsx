import { LinearGradient } from "expo-linear-gradient";
import { Image as ExpoImage } from "expo-image";
import { Tabs, usePathname } from "expo-router";
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
import { useFoldersPlaylists } from "@/context/FoldersPlaylistsContext";
import {
  TabBarVisibilityProvider,
  useTabBarVisibility,
} from "@/context/TabBarVisibilityContext";
import { getGuideById } from "@/data/guides";
import { getArtist } from "@/data/artists";

const ACTIVE_COLOR   = "#E9C46A";
const INACTIVE_COLOR = "rgba(244,218,213,0.55)";
const GRAD_END       = "#E9C46A";

const ICON_SIZE = 23;
const PILL_BG   = "rgba(255,255,255,0.075)";


// Rutas que nunca aparecen en el menú inferior
const HIDDEN_ROUTES = new Set(["descanzo", "profile"]);

const TAB_CONFIG: Record<
  string,
  {
    label: string;
    sfIcon: string;
    sfIconFill: string;
    featherIcon: string;
    image?: number;
  }
> = {
  index:      { label: "Inicio",     sfIcon: "house",               sfIconFill: "house.fill",           featherIcon: "home" },
  explore:    { label: "Buscar",     sfIcon: "magnifyingglass",     sfIconFill: "magnifyingglass",       featherIcon: "search" },
  musica:     { label: "Mezclador",  sfIcon: "slider.horizontal.3", sfIconFill: "slider.horizontal.3",  featherIcon: "sliders" },
  biblioteca:   { label: "Biblioteca",  sfIcon: "books.vertical",      sfIconFill: "books.vertical.fill",  featherIcon: "bookmark" },
  resonadores:  { label: "Equipo",       sfIcon: "person.2",            sfIconFill: "person.2.fill",         featherIcon: "users" },
  profile:      { label: "Perfil",      sfIcon: "person",              sfIconFill: "person.fill",           featherIcon: "user" },
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

  const isIOS     = Platform.OS === "ios";
  const iconColor = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;

  const icon = conf.image ? (
    <Image source={conf.image} style={{ width: ICON_SIZE, height: ICON_SIZE }} tintColor={iconColor} resizeMode="contain" />
  ) : isIOS ? (
    <SymbolView name={(isFocused ? conf.sfIconFill : conf.sfIcon) as never} tintColor={iconColor} size={ICON_SIZE} />
  ) : (
    <Feather name={conf.featherIcon as never} size={ICON_SIZE} color={iconColor} />
  );

  return (
    <Pressable
      onPress={onPress}
      style={styles.tab}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
    >
      <View style={styles.pillWrap}>
        {/* Ícono con glow dorado cuando está activo */}
        <View style={isFocused ? styles.iconGlow : undefined}>
          {icon}
        </View>

        <Text
          style={[
            styles.label,
            {
              color: isFocused ? GRAD_END : INACTIVE_COLOR,
              fontWeight: isFocused ? "700" : "400",
              ...(isFocused && {
                textShadowColor: "rgba(212,175,55,0.55)",
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 5,
              }),
            },
          ]}
        >
          {conf.label}
        </Text>
      </View>
    </Pressable>
  );
}

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>["tabBar"]>>[0];

function CustomTabBar({ state, navigation, descriptors }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const isWeb  = Platform.OS === "web";
  const pb     = isWeb ? 8 : insets.bottom;
  const extra  = Math.round(pb / 2);

  const barHeight = 31 + extra + pb;
  const { hidden, showMenu, tabBarColors } = useTabBarVisibility();
  const translateY    = useRef(new Animated.Value(0)).current;
  const handleOpacity = useRef(new Animated.Value(0)).current;
  const accentOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(accentOpacity, {
      toValue: tabBarColors ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [tabBarColors]);

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: hidden ? barHeight + 40 : 0,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    Animated.timing(handleOpacity, {
      toValue: hidden ? 1 : 0,
      duration: 280,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [hidden, barHeight, translateY, handleOpacity]);

  return (
    <>
      <Animated.View
        style={[styles.bar, { paddingBottom: pb, transform: [{ translateY }] }]}
      >
        {/* Fondo: degradado de Inicio */}
        <LinearGradient
          colors={["#21040C", "#100105"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Acento del tab activo (crossfade) */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: accentOpacity }]}>
          <LinearGradient
            colors={tabBarColors ? [tabBarColors[0], tabBarColors[1]] : ["#21040C", "#100105"]}
            locations={[0, 1]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>


        <View style={[styles.row, isWeb && styles.rowWeb, { paddingTop: 8 + extra, height: 31 + extra }]}>
          {state.routes.map((route: { key: string; name: string; params?: object }, index: number) => {
            if (HIDDEN_ROUTES.has(route.name)) return null;

            const isFocused = state.index === index;
            const onPress   = () => {
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

      {/* Pestañita para recuperar el menú cuando está oculto */}
      <Animated.View
        pointerEvents={hidden ? "auto" : "none"}
        style={{
          position: "absolute",
          bottom: pb + 6,
          alignSelf: "center",
          opacity: handleOpacity,
        }}
      >
        <Pressable
          onPress={showMenu}
          hitSlop={12}
          style={{
            backgroundColor: "rgba(255,255,255,0.10)",
            borderRadius: 999,
            paddingHorizontal: 18,
            paddingVertical: 5,
            borderWidth: 0.5,
            borderColor: "rgba(255,255,255,0.25)",
          }}
        >
          <MaterialCommunityIcons name="chevron-up" size={14} color="rgba(255,255,255,0.75)" />
        </Pressable>
      </Animated.View>
    </>
  );
}

function TabLayoutInner() {
  const { currentSession, isPlaying, pauseResume, stop } = usePlayer();
  const { activeSounds }   = useMixer();
  const { playlists }      = useFoldersPlaylists();
  const insets             = useSafeAreaInsets();
  const isWeb              = Platform.OS === "web";
  const bottomPb           = isWeb ? 8 : insets.bottom;
  const tabBarHeight       = 31 + Math.round(bottomPb / 2) + bottomPb;
  const { hidden }         = useTabBarVisibility();

  const pathname       = usePathname();
  const onMezclador    = pathname === "/musica";
  const mixActive      = !currentSession && activeSounds.length > 0;
  const miniPlayerBottom = hidden ? bottomPb : tabBarHeight;

  // ¿La sesión actual pertenece a alguna playlist? → PlaylistMiniPlayer persistente
  const activePlaylist = currentSession
    ? (playlists.find((p) => p.sessionIds.includes(currentSession.id)) ?? null)
    : null;

  // El MiniPlayer global del Mezclador no aparece cuando hay playlist activa
  const showMiniPlayer = onMezclador && !activePlaylist && (currentSession || mixActive);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: "#160108" } }}
        tabBar={(props) => <CustomTabBar {...props} />}
      >
        <Tabs.Screen name="index"          options={{ title: "Inicio" }} />
        <Tabs.Screen name="musica"         options={{ title: "Mezclador" }} />
        <Tabs.Screen name="coleccion/[id]" options={{ href: null }} />
        <Tabs.Screen name="explore"        options={{ title: "Buscar" }} />
        <Tabs.Screen name="biblioteca"     options={{ title: "Biblioteca" }} />
        <Tabs.Screen name="resonadores"    options={{ title: "Equipo" }} />
        <Tabs.Screen name="geometrix"      options={{ title: "Geometrix", href: null }} />
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

      {/* ── PlaylistMiniPlayer persistente (visible en todos los tabs) ─────── */}
      {activePlaylist && currentSession && (
        <View style={[styles.playlistBar, { bottom: miniPlayerBottom }]}>
          <Pressable
            onPress={stop}
            hitSlop={12}
            style={({ pressed }) => [styles.playlistCloseBtn, { opacity: pressed ? 0.6 : 1 }]}
          >
            <Feather name="x" size={18} color="rgba(242,231,228,0.45)" />
          </Pressable>
          <ExpoImage
            source={currentSession.image as never}
            style={styles.playlistCover}
            contentFit="cover"
          />
          <View style={{ flex: 1, gap: 3 }}>
            <Text style={styles.playlistTitle} numberOfLines={1}>{currentSession.title}</Text>
            <Text style={styles.playlistArtist} numberOfLines={1}>
              {currentSession.guideId
                ? (getGuideById(currentSession.guideId)?.name ?? "Casa del Cuenco")
                : currentSession.artistId
                  ? (getArtist(currentSession.artistId)?.name ?? "Resonancia")
                  : "Casa del Cuenco"}
            </Text>
          </View>
          <Pressable
            onPress={pauseResume}
            hitSlop={12}
            style={({ pressed }) => [styles.playlistPlayBtn, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Feather name={isPlaying ? "pause" : "play"} size={26} color="#FFFFFF" />
          </Pressable>
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
    marginTop: -12,
  },
  pillWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 2,
  },
  iconGlow: {
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 6,
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
  playlistBar: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 68,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.8)",
    paddingHorizontal: 16,
    gap: 12,
    zIndex: 100,
    elevation: 100,
  },
  playlistCover: {
    width: 44,
    height: 44,
    borderRadius: 8,
    backgroundColor: "rgba(212,175,55,0.08)",
  },
  playlistTitle: {
    color: "#F4DAD5",
    fontSize: 14,
    fontWeight: "700",
  },
  playlistArtist: {
    color: "rgba(242,231,228,0.45)",
    fontSize: 12,
  },
  playlistCloseBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  playlistPlayBtn: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
});
