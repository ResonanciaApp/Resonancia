import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Image as ExpoImage } from "expo-image";
import { Tabs, usePathname } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef, useCallback } from "react";
import { DURATION, easeOutCubic } from "@/constants/motion";
import {
  Animated,
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

const ACTIVE_COLOR   = "#BE8744";
const INACTIVE_COLOR = "rgba(255,255,255,0.80)";
const GRAD_END       = "#BE8744";

const ICON_SIZE = 24;
const PILL_BG   = "rgba(255,255,255,0.075)";


// Rutas que nunca aparecen en el menú inferior
const HIDDEN_ROUTES = new Set(["profile"]);

const TAB_CONFIG: Record<
  string,
  {
    label: string;
    sfIcon: string;
    sfIconFill: string;
    featherIcon: string;
    image?: number;
    iconSize?: number;
    iconOffset?: number;
  }
> = {
  index:      { label: "Inicio",     sfIcon: "house",               sfIconFill: "house.fill",           featherIcon: "home" },
  explore:    { label: "Explorar",   sfIcon: "magnifyingglass",     sfIconFill: "magnifyingglass",       featherIcon: "search" },
  musica:     { label: "Mezclador",  sfIcon: "slider.horizontal.3", sfIconFill: "slider.horizontal.3",  featherIcon: "sliders" },
  biblioteca: { label: "Biblioteca", sfIcon: "books.vertical",      sfIconFill: "books.vertical.fill",  featherIcon: "bookmark" },
  descanzo:   { label: "Descanso",   sfIcon: "moon.stars",          sfIconFill: "moon.stars.fill",      featherIcon: "moon" },
  profile:    { label: "Perfil",     sfIcon: "person",              sfIconFill: "person.fill",          featherIcon: "user" },
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

  const focusAnim  = useRef(new Animated.Value(isFocused ? 1 : 0)).current;
  const isIOS      = Platform.OS === "ios";
  const iconSize   = conf.iconSize ?? ICON_SIZE;
  const iconOffset = conf.iconOffset ?? 0;
  const tOffset    = [{ translateY: iconOffset }];

  useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: DURATION.TAB,
      easing: easeOutCubic,
      useNativeDriver: true,
    }).start();
  }, [isFocused, focusAnim]);

  const makeIcon = useCallback((active: boolean) => {
    const color = active ? ACTIVE_COLOR : INACTIVE_COLOR;
    const sfName = active ? conf.sfIconFill : conf.sfIcon;
    return conf.image ? (
      <Image source={conf.image} style={{ width: iconSize, height: iconSize, transform: tOffset }} tintColor={color} resizeMode="contain" />
    ) : isIOS ? (
      <SymbolView name={sfName as never} tintColor={color} size={iconSize} style={{ transform: tOffset }} />
    ) : (
      <Feather name={conf.featherIcon as never} size={iconSize} color={color} style={{ transform: tOffset }} />
    );
  }, [conf, iconSize, isIOS, tOffset]);

  return (
    <Pressable
      onPress={onPress}
      style={styles.tab}
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
    >
      <View style={styles.pillWrap}>
        {/* Íconos apilados: inactivo base, activo con fade-in animado */}
        <View style={{ width: iconSize, height: iconSize }}>
          <View style={StyleSheet.absoluteFill}>{makeIcon(false)}</View>
          <Animated.View style={[StyleSheet.absoluteFill, styles.iconGlow, { opacity: focusAnim }]}>
            {makeIcon(true)}
          </Animated.View>
        </View>

        {/* Labels apiladas: inactiva base, activa con fade-in animado */}
        <View style={styles.labelWrap}>
          <Text style={[styles.label, { color: INACTIVE_COLOR }]} numberOfLines={1}>
            {conf.label}
          </Text>
          <Animated.Text style={[styles.label, styles.labelActive, { opacity: focusAnim }]} numberOfLines={1}>
            {conf.label}
          </Animated.Text>
        </View>
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
      duration: DURATION.SHEET_CLOSE,
      easing: easeOutCubic,
      useNativeDriver: true,
    }).start();
    Animated.timing(handleOpacity, {
      toValue: hidden ? 1 : 0,
      duration: DURATION.SHEET_CLOSE,
      easing: easeOutCubic,
      useNativeDriver: true,
    }).start();
  }, [hidden, barHeight, translateY, handleOpacity]);

  return (
    <>
      <Animated.View
        style={[styles.bar, { paddingBottom: pb, transform: [{ translateY }] }]}
      >
        {/* Fondo base: blur + overlay semitransparente siempre activos */}
        <BlurView intensity={22} tint="dark" style={StyleSheet.absoluteFill} />
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(22,4,10,0.72)" }]} />
        {/* Acento del tab activo (crossfade) */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: accentOpacity, backgroundColor: tabBarColors ? tabBarColors[0] : "transparent" }]} />


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

      {/* Pestañita para recuperar el menú cuando está oculto (todos los tabs menos Mezclador) */}
      {state.routes[state.index]?.name !== "musica" && (
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
      )}

      {/* Espacio pasivo de 50 px para el Mezclador — sin indicador visual */}
      {state.routes[state.index]?.name === "musica" && (
        <View pointerEvents="none" style={styles.mezcladorHandle} />
      )}
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
  const miniPlayerBottom = hidden ? bottomPb + 10 : tabBarHeight - 10;

  // ¿La sesión actual pertenece a alguna playlist? → PlaylistMiniPlayer persistente
  const activePlaylist = currentSession
    ? (playlists.find((p) => p.sessionIds.includes(currentSession.id)) ?? null)
    : null;

  // El MiniPlayer global del Mezclador no aparece cuando hay playlist activa
  const showMiniPlayer = onMezclador && !activePlaylist && (currentSession || mixActive);

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: "#16040A" } }}
        tabBar={(props) => <CustomTabBar {...props} />}
      >
        <Tabs.Screen name="index"          options={{ title: "Inicio" }} />
        <Tabs.Screen name="musica"         options={{ title: "Mezclador" }} />
        <Tabs.Screen name="coleccion/[id]" options={{ href: null }} />
        <Tabs.Screen name="explore"        options={{ title: "Explorar" }} />
        <Tabs.Screen name="biblioteca"     options={{ title: "Biblioteca" }} />
        <Tabs.Screen name="resonadores"    options={{ title: "Equipo" }} />
        <Tabs.Screen name="geometrix"      options={{ title: "Geometrix", href: null }} />
        <Tabs.Screen name="musica2"        options={{ title: "Música 2", href: null }} />
        <Tabs.Screen name="musica3"        options={{ title: "Mi Música", href: null }} />
        <Tabs.Screen name="descanzo"       options={{ title: "Descanso" }} />
        <Tabs.Screen name="profile"        options={{ title: "Perfil" }} />
      </Tabs>

      {showMiniPlayer && (
        <View style={[styles.miniPlayerFloat, { bottom: 0 }]}>
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
            <Feather name="x" size={18} color="rgba(250,240,238,0.45)" />
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
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -8 },
    shadowOpacity: 0.18,
    shadowRadius: 15,
    elevation: 10,
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
    alignSelf: "stretch",
    gap: 2,
  },
  iconGlow: {
    shadowColor: "#BE8744",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 6,
  },
  label: {
    fontSize: 11,
    letterSpacing: 0.3,
    fontWeight: "500",
  },
  labelWrap: {
    width: "100%",
    alignItems: "center",
  },
  labelActive: {
    ...StyleSheet.absoluteFillObject,
    textAlign: "center",
    color: GRAD_END,
    fontWeight: "600",
    textShadowColor: "rgba(212,175,55,0.55)",
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 5,
  },
  mezcladorHandle: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  mezcladorPill: {
    width: 36,
    height: 4,
    borderRadius: 99,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  miniPlayerFloat: {
    position: "absolute",
    left: 10,
    right: 10,
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
    color: "#FAF0EE",
    fontSize: 14,
    fontWeight: "700",
  },
  playlistArtist: {
    color: "rgba(250,240,238,0.45)",
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
