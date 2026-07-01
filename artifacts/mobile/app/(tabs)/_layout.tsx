import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { Image as ExpoImage } from "expo-image";
import { Tabs, usePathname } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef, useCallback, useState } from "react";
import { DURATION, easeOutCubic } from "@/constants/motion";
import {
  Animated,
  Image,
  LayoutChangeEvent,
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

const ACTIVE_COLOR   = "#FFFFFF";
const INACTIVE_COLOR = "rgba(244,218,213,0.45)";
const GRAD_END       = "#FFFFFF";
const GHOST_PILL_BG  = "rgba(255,255,255,0.08)";

const ICON_SIZE      = 24;
const PILL_H         = 72;   // altura fija de la píldora flotante
const PILL_MARGIN_H  = 20;   // margen horizontal de la píldora


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

  // Pegado al safe area, sin margen extra
  const barBottom = Math.max(0, pb - 10);
  // Altura total que ocupa la píldora (para la animación de hide)
  const barHeight = PILL_H + barBottom + 40;

  const { hidden, showMenu, tabBarColors } = useTabBarVisibility();
  const translateY    = useRef(new Animated.Value(0)).current;
  const handleOpacity = useRef(new Animated.Value(0)).current;
  const accentOpacity = useRef(new Animated.Value(0)).current;

  // ── Sliding ghost pill ──────────────────────────────────────────
  // Solo contar rutas que tienen entrada en TAB_CONFIG y no están ocultas
  const ROW_H_PAD = 6; // paddingHorizontal del row (debe coincidir con styles.row)

  const isRenderedTab = (name: string) => name in TAB_CONFIG && !HIDDEN_ROUTES.has(name);

  const visibleCount = state.routes.filter((r: { name: string }) => isRenderedTab(r.name)).length;

  const visibleIndex = (() => {
    let idx = 0;
    for (let i = 0; i < state.index; i++) {
      if (isRenderedTab(state.routes[i].name)) idx++;
    }
    return idx;
  })();

  const [tabWidth, setTabWidth] = useState(0);
  const pillX          = useRef(new Animated.Value(0)).current;
  const initialPillSet = useRef(false);

  const setPillPosition = useCallback(
    (tw: number, vi: number, animate: boolean) => {
      if (tw === 0) return;
      const target = vi * tw;
      if (!animate || !initialPillSet.current) {
        pillX.setValue(target);
        initialPillSet.current = true;
      } else {
        Animated.spring(pillX, {
          toValue: target,
          useNativeDriver: true,
          damping: 22,
          stiffness: 220,
          mass: 0.9,
        }).start();
      }
    },
    [pillX],
  );

  useEffect(() => {
    setPillPosition(tabWidth, visibleIndex, true);
  }, [visibleIndex, tabWidth, setPillPosition]);

  const onRowLayout = useCallback(
    (e: LayoutChangeEvent) => {
      // Descontar paddingHorizontal×2 para obtener el ancho real de cada tab
      const tw = (e.nativeEvent.layout.width - ROW_H_PAD * 2) / visibleCount;
      setTabWidth(tw);
      setPillPosition(tw, visibleIndex, false);
    },
    [visibleCount, visibleIndex, setPillPosition],
  );
  // ────────────────────────────────────────────────────────────────

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
        style={[styles.bar, { bottom: barBottom, transform: [{ translateY }] }]}
      >
        {/* Fondo base: blur + overlay semitransparente */}
        <BlurView intensity={28} tint="dark" style={StyleSheet.absoluteFill} />
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(35,6,16,0.92)" }]} />
        {/* Acento del tab activo (crossfade) */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: accentOpacity, backgroundColor: tabBarColors ? tabBarColors[0] : "transparent" }]} />

        <View
          style={[styles.row, isWeb && styles.rowWeb]}
          onLayout={onRowLayout}
        >
          {/* ── Ghost pill deslizante ── */}
          {tabWidth > 0 && (
            <Animated.View
              pointerEvents="none"
              style={[
                styles.slidingPill,
                {
                  width: tabWidth + 3,
                  transform: [{ translateX: pillX }],
                },
              ]}
            />
          )}

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
  const tabBarHeight       = PILL_H + Math.max(0, bottomPb - 10);
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
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: "#230610" } }}
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
            <Feather name="x" size={18} color="#c2c2c2" />
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
    left: PILL_MARGIN_H,
    right: PILL_MARGIN_H,
    height: PILL_H,
    borderRadius: 999,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(74,12,12,0.04)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 18,
  },
  row: {
    flex: 1,
    flexDirection: "row",
    paddingHorizontal: 6,
    alignItems: "center",
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
    height: "100%",
  },
  pillWrap: {
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    width: "100%",
  },
  iconGlow: {
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.30,
    shadowRadius: 4,
  },
  label: {
    fontSize: 10.5,
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
  },
  slidingPill: {
    position: "absolute",
    // Píldora horizontal de 61px centrada verticalmente en el bar
    top: (PILL_H - 61) / 2 - 2,
    height: 61,
    // left = ROW_H_PAD(6) + (tabWidth - pillWidth)/2 = 6 + (-3/2) ≈ 5
    left: 5,
    borderRadius: 999,
    backgroundColor: GHOST_PILL_BG,
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
    color: "#c2c2c2",
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
