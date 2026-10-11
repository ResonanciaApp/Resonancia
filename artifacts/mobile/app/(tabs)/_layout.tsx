import { router, Tabs, usePathname } from "expo-router";
import { SymbolView } from "expo-symbols";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef, useCallback, useLayoutEffect, useState } from "react";
import { useMixerPanel } from "@/context/MixerPanelContext";
import { useGeometrixPanel } from "@/context/GeometrixPanelContext";
import { DURATION, easeOutCubic } from "@/constants/motion";
import {
  Animated,
  Dimensions,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  useTabBarVisibility,
} from "@/context/TabBarVisibilityContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { isIndigo2ThemeId } from "@/config/scene-themes";
import { useDrawerDestinations } from "@/context/DrawerContext";
import { CategoryOverlayProvider, useCategoryOverlay } from "@/context/CategoryOverlayContext";
import { CategoryOverlay } from "@/components/CategoryOverlay";
import { SacredBackground } from "@/components/SacredBackground";
import { WIDGET_GREEN_SOLID } from "@/constants/colors";
import { TAB_BAR_INACTIVE_COLOR, TAB_PILL_BAR_H, TAB_PILL_BLUR_INTENSITY, TAB_PILL_BLUR_TINT, TAB_PILL_SIDE_MARGIN, getTabBarGlassOverlay, getTabBarInactiveColor } from "@/constants/tab-bar";
import { TabSelectionIndicator } from "@/components/TabSelectionIndicator";
import { TAB_ROW_PADDING } from "@/constants/tab-selection";
import { RoutineCompletionBanner } from "@/components/RoutineCompletionBanner";
import { RoutineCompletionBannerProvider } from "@/context/RoutineCompletionBannerContext";
import { useTabBarLabels } from "@/context/TabBarLabelsContext";

const ACTIVE_COLOR   = "#FFFFFF";
const INACTIVE_COLOR = TAB_BAR_INACTIVE_COLOR;
const INDIGO2_COLOR  = "#DEDEDE";
const GRAD_END       = "#F9F9F9";

const ICON_SIZE      = 25;
const PILL_H         = TAB_PILL_BAR_H; // altura del bloque de navegación, sin safe area

// Rutas que nunca aparecen en el menú inferior
const HIDDEN_ROUTES = new Set(["musica", "biblioteca", "video", "emocion", "herramientas", "explore", "encuentros"]);
const MAIN_HAPTIC_ROUTES = new Set([
  "inicio3",
  "explore-copia",
  "descanzo",
  "sonidos",
  "profile",
]);

const TAB_CONFIG: Record<
  string,
  {
    label: string;
    sfIcon: string;
    sfIconFill: string;
    featherIcon: string;
    mciIcon?: string;
    mciIconFill?: string;
    image?: number;
    emoji?: string;
    iconSize?: number;
    iconOffset?: number;
    labelOffset?: number;
    activeColor?: string;
  }
> = {
  inicio3:    { label: "Inicio",     sfIcon: "house",               sfIconFill: "house.fill",           featherIcon: "home" },
  explore:    { label: "Descubrir",  sfIcon: "magnifyingglass",     sfIconFill: "magnifyingglass",       featherIcon: "search" },
  "explore-copia": { label: "Descubrir", sfIcon: "magnifyingglass", sfIconFill: "magnifyingglass", featherIcon: "search" },
  herramientas: { label: "Recursos", sfIcon: "square.grid.2x2", sfIconFill: "square.grid.2x2.fill", featherIcon: "grid", iconSize: 22 },
  musica:     { label: "Mezclador",  sfIcon: "slider.horizontal.3", sfIconFill: "slider.horizontal.3", mciIcon: "tune-variant", mciIconFill: "tune-variant", featherIcon: "sliders", activeColor: "#F9F9F9" },
  biblioteca: { label: "Biblioteca", sfIcon: "books.vertical",      sfIconFill: "books.vertical.fill",  featherIcon: "bookmark" },
  video:      { label: "Videos",     sfIcon: "video",               sfIconFill: "video.fill",           featherIcon: "video" },
  descanzo:   { label: "Dormir",     sfIcon: "moon",                sfIconFill: "moon.fill",             featherIcon: "moon", iconSize: 25 },
  sonidos:    { label: "Sonidos",    sfIcon: "waveform",  sfIconFill: "waveform", mciIcon: "waveform", mciIconFill: "waveform", featherIcon: "headphones", iconSize: 28, activeColor: "#F9F9F9" },
  emocion:    { label: "Emoción",    sfIcon: "face.smiling",        sfIconFill: "face.smiling.fill",     featherIcon: "smile", emoji: "🙂" },
  encuentros: { label: "Comunidad",  sfIcon: "person.3",            sfIconFill: "person.3.fill",          featherIcon: "users", iconSize: 27 },
  profile:    { label: "Perfil",     sfIcon: "person.crop.circle",   sfIconFill: "person.crop.circle.fill", featherIcon: "user" },
};


function TabItem({
  route,
  isFocused,
  onPress,
  tibetMode = false,
  lightNeutralColors = false,
  inactiveColor = INACTIVE_COLOR,
}: {
  route: { key: string; name: string };
  isFocused: boolean;
  onPress: () => void;
  tibetMode?: boolean;
  lightNeutralColors?: boolean;
  inactiveColor?: string;
}) {
  const conf = TAB_CONFIG[route.name];
  const { enabled: showLabels } = useTabBarLabels();
  if (!conf) return null;

  const isIOS      = Platform.OS === "ios";
  const iconSize   = (conf.iconSize ?? ICON_SIZE) + 1.5;
  const iconOffset = conf.iconOffset ?? 0;
  const tOffset    = [{ translateY: iconOffset }];

  const activeCol   = ACTIVE_COLOR;
  const inactiveCol = inactiveColor;

  const makeIcon = useCallback((active: boolean) => {
    const color  = active ? activeCol : inactiveCol;
    // El icono conserva su forma base; la selección cambia su tinte y
    // muestra la cápsula de vidrio detrás, sin alterar su tamaño.
    const sfName = conf.sfIcon;
    const mciName = conf.mciIcon;
    return conf.emoji ? (
      <Text style={{ fontSize: 19, lineHeight: 23, transform: tOffset }}>{conf.emoji}</Text>
    ) : conf.image ? (
      <Image source={conf.image} style={{ width: iconSize, height: iconSize, transform: tOffset }} tintColor={color} resizeMode="contain" />
    ) : mciName ? (
      <MaterialCommunityIcons name={mciName as never} size={iconSize} color={color} style={{ transform: tOffset }} />
    ) : isIOS ? (
      <SymbolView name={sfName as never} tintColor={color} size={iconSize} style={{ transform: tOffset }} />
    ) : (
      <Feather name={conf.featherIcon as never} size={iconSize} color={color} style={{ transform: tOffset }} />
    );
  }, [conf, iconSize, isIOS, tOffset, activeCol, inactiveCol]);

  return (
    <Pressable
      onPress={onPress}
      style={styles.tab}
      accessibilityRole="tab"
      accessibilityLabel={conf.label}
      accessibilityState={{ selected: isFocused }}
      testID={`tab-${route.name}`}
    >
      <View style={styles.pillWrap}>
        <View style={{ width: Math.max(iconSize, ICON_SIZE), height: Math.max(iconSize, ICON_SIZE), alignItems: "center", justifyContent: "center", overflow: "visible" }}>
          {makeIcon(isFocused)}
        </View>
        {showLabels && <Text
          numberOfLines={1}
          style={[styles.label, { color: isFocused ? activeCol : inactiveCol }]}
          testID={`tab-label-${route.name}`}
        >
          {conf.label}
        </Text>}
      </View>
    </Pressable>
  );
}

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>["tabBar"]>>[0];

function CustomTabBar({ state, navigation, descriptors }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const pathname = usePathname();
  const isWeb  = Platform.OS === "web";
  const pb     = isWeb ? 8 : insets.bottom;
  const { openMixer, isMixerOpen } = useMixerPanel();
  // Compensa el parallax del wrapper de Tabs (la barra vive dentro de él).
  const { isGeometrixOpen } = useGeometrixPanel();
  const { closeAllCategories, stack: categoryStack } = useCategoryOverlay();
  const { libOpen, closeLib, libraryParallax } = useDrawerDestinations();

  // El bloque llega hasta el borde inferior e incluye el área segura.
  const { enabled: showLabels } = useTabBarLabels();
  const pillHeight = PILL_H + (showLabels ? 10 : 0);
  const barHeight = pillHeight + pb;
  const pillShape = { borderRadius: (pillHeight + 1) / 2 };

  const { hidden, showMenu, revealHandleHidden } = useTabBarVisibility();
  const { activeSceneId } = useSceneTheme();
  const inactiveColor = getTabBarInactiveColor(activeSceneId);
  const indigo2Mode = isIndigo2ThemeId(activeSceneId);
  const tabBarGlassOverlay = getTabBarGlassOverlay(activeSceneId);
  const [rowWidth, setRowWidth] = useState(0);
  const translateY    = useRef(new Animated.Value(0)).current;
  const handleOpacity = useRef(new Animated.Value(0)).current;
  const isLibraryRoute = state.routes[state.index]?.name === "biblioteca";
  const librarySurface = libOpen || isLibraryRoute;
  const sessionOverlayOpen = categoryStack.some((entry) => entry.route.startsWith("/session/"));
  const routeForcesHidden =
    pathname === "/player" ||
    pathname.startsWith("/session/") ||
    sessionOverlayOpen;
  const tabBarHidden = hidden || librarySurface || routeForcesHidden;
  const libraryBarOffset = libraryParallax.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 56],
    extrapolate: "clamp",
  });

  // Solo contar rutas que tienen entrada en TAB_CONFIG y no están ocultas
  const isRenderedTab = (name: string) => name in TAB_CONFIG && !HIDDEN_ROUTES.has(name);

  const currentIsRendered = isRenderedTab(state.routes[state.index]?.name ?? "");

  // Cuando el route actual es href:null (categorías, coleccion, etc.) el índice
  // del tabs navigator apunta a esa pantalla en lugar de al tab real — guardamos
  // el último tab real activo y lo usamos como referencia.
  const lastRealRouteIndex = useRef(state.index);
  if (currentIsRendered) {
    lastRealRouteIndex.current = state.index;
  }
  const effectiveRouteIndex = currentIsRendered ? state.index : lastRealRouteIndex.current;
  const visibleRoutes = state.routes.filter((route) => isRenderedTab(route.name));
  const selectedVisibleIndex = visibleRoutes.findIndex((route) => route.key === state.routes[effectiveRouteIndex]?.key);
  // ────────────────────────────────────────────────────────────────

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: tabBarHidden ? barHeight + 40 : 0,
      duration: DURATION.SHEET_CLOSE,
      easing: easeOutCubic,
      useNativeDriver: true,
    }).start();
    // La pestañita NO debe aparecer cuando la barra se ocultó por el panel del
    // Mezclador o Geometrix (al cerrar el panel se veía un flash del chevron-up).
    const panelOpen = isMixerOpen || isGeometrixOpen;
    if (panelOpen || !tabBarHidden || librarySurface || revealHandleHidden || routeForcesHidden) {
      // Ocultar de inmediato (sin fade) para que no quede visible durante la
      // transición de cierre de los paneles.
      handleOpacity.stopAnimation();
      handleOpacity.setValue(0);
    } else {
      // Mostrar con un pequeño delay: al cerrar Mezclador/Geometrix hay unos
      // milisegundos donde el estado sigue true antes de que el panel llame a
      // showMenu(); el delay evita que la pestañita alcance a aparecer.
      Animated.timing(handleOpacity, {
        toValue: 1,
        delay: 350,
        duration: DURATION.SHEET_CLOSE,
        easing: easeOutCubic,
        useNativeDriver: true,
      }).start();
    }
  }, [tabBarHidden, librarySurface, revealHandleHidden, routeForcesHidden, barHeight, translateY, handleOpacity, isMixerOpen, isGeometrixOpen]);

  return (
    <>
      <Animated.View
        style={[
          styles.bar,
          {
            height: barHeight,
            transform: [
              { translateX: libraryBarOffset },
              { translateY: routeForcesHidden ? barHeight + 40 : translateY },
            ],
          },
        ]}
      >
        <View style={[styles.pill, pillShape, { height: pillHeight + 1 }]}>
        {/* The shadow samples only the static glass, never the moving indicator/icons. */}
        <View pointerEvents="none" collapsable={false} style={[styles.glassLayer, styles.pillShadow, pillShape]}>
        <View style={[styles.pillClip, pillShape]}>
        <BlurView
          pointerEvents="none"
          tint={TAB_PILL_BLUR_TINT}
          intensity={TAB_PILL_BLUR_INTENSITY}
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: tabBarGlassOverlay },
          ]}
        />
        </View>
        </View>
        <View style={[styles.pillClip, styles.controlsLayer, pillShape]}>
        <View onLayout={(event) => setRowWidth(event.nativeEvent.layout.width)} style={[styles.row, isWeb && styles.rowWeb, { height: pillHeight }]}>
          <TabSelectionIndicator width={rowWidth} count={visibleRoutes.length} index={selectedVisibleIndex} barHeight={pillHeight} />
          {state.routes.map((route: { key: string; name: string; params?: object }, index: number) => {
            if (HIDDEN_ROUTES.has(route.name)) return null;

            const isFocused = effectiveRouteIndex === index;
            const onPress   = () => {
              if (MAIN_HAPTIC_ROUTES.has(route.name)) {
                void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
              }
              if (libOpen) closeLib();
              if (route.name === "musica") {
                openMixer();
                return;
              }
              // Cerrar la pila de overlays (playlist, categoría, sesión…) al
              // cambiar de tab; si no, el overlay tapa la nueva pantalla y el
              // tab bar parece "trabado".
              closeAllCategories();
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
                inactiveColor={inactiveColor}
                tibetMode={activeSceneId === "tibet"}
                lightNeutralColors={
                  indigo2Mode || activeSceneId === "resonancia"
                }
              />
            );
          })}
        </View>
        </View>
        </View>
      </Animated.View>

      {/* Pestañita para recuperar el menú cuando está oculto (todos los tabs menos Mezclador y Geometrix) */}
      {!routeForcesHidden && !revealHandleHidden && state.routes[state.index]?.name !== "musica" && state.routes[state.index]?.name !== "geometrix" && (
        <Animated.View
          pointerEvents={hidden && !librarySurface ? "auto" : "none"}
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
  const pathname           = usePathname();
  const insets             = useSafeAreaInsets();
  const isWeb              = Platform.OS === "web";
  const bottomPb           = isWeb ? 8 : insets.bottom;
  const { enabled: showLabels } = useTabBarLabels();
  const tabBarHeight       = PILL_H + (showLabels ? 10 : 0) + bottomPb;
  const { libOpen }        = useDrawerDestinations();
  const [barProps, setBarProps] = useState<any>(null);
  const { isMixerOpen, openedFromDrawer: mixerFromDrawer, panelAnim } = useMixerPanel();
  const { isGeometrixOpen, openedFromDrawer: geometrixFromDrawer, panelAnim: geoPanelAnim } = useGeometrixPanel();
  const { activeSceneId, theme } = useSceneTheme();
  const bg = theme.solid;

  // Parallax sutil: el contenido de fondo se corre un poco a la izquierda
  // cuando entra un panel derecha→izquierda (estilo Insight Timer).
  const { parallaxAnim: overlayParallax, stack: categoryStack } = useCategoryOverlay();
  const sessionOverlayOpen = categoryStack.some((entry) => entry.route.startsWith("/session/"));
  const routeForcesTabBarHidden =
    pathname === "/player" ||
    pathname.startsWith("/session/") ||
    sessionOverlayOpen;
  const completionBannerVisible =
    !libOpen &&
    barProps?.state?.routes?.[barProps.state.index]?.name !== "biblioteca" &&
    !routeForcesTabBarHidden &&
    !isMixerOpen &&
    !isGeometrixOpen;
  const bgParallaxX = Animated.add(
    Animated.add(
      panelAnim.interpolate({ inputRange: [0, 1], outputRange: mixerFromDrawer ? [0, 0] : [0, -56], extrapolate: "clamp" }),
      geoPanelAnim.interpolate({ inputRange: [0, 1], outputRange: geometrixFromDrawer ? [0, 0] : [0, -56], extrapolate: "clamp" }),
    ),
    overlayParallax.interpolate({ inputRange: [0, 1], outputRange: [0, -56], extrapolate: "clamp" }),
  );

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <SacredBackground variant="gradient" noImage />
      <Animated.View style={{ flex: 1, transform: [{ translateX: bgParallaxX }] }}>
      <Tabs
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: "transparent" } }}
        tabBar={(props) => <TabBarPropsBridge props={props} onProps={setBarProps} />}
      >
        <Tabs.Screen name="index"          options={{ href: null }} />
        <Tabs.Screen name="inicio3"        options={{ title: "Inicio" }} />
        <Tabs.Screen name="musica"         options={{ title: "Creación" }} />
        <Tabs.Screen name="category/meditaciones-guiadas" options={{ href: null }} />
        <Tabs.Screen name="category/musica-sonidos"       options={{ href: null }} />
        <Tabs.Screen name="category/sonidos-ancestrales"  options={{ href: null }} />
        <Tabs.Screen name="category/mananas"              options={{ href: null }} />
        <Tabs.Screen name="category/noches"               options={{ href: null }} />
        <Tabs.Screen name="category/[id]"                 options={{ href: null }} />
        <Tabs.Screen name="explore"        options={{ title: "Descubrir", href: null }} />
        <Tabs.Screen name="explore-copia"  options={{ title: "Descubrir" }} />
        <Tabs.Screen name="descanzo"       options={{ title: "Dormir" }} />
        <Tabs.Screen name="herramientas"  options={{ title: "Recursos" }} />
        <Tabs.Screen name="sonidos"        options={{ title: "Sonidos" }} />
        <Tabs.Screen name="encuentros"     options={{ title: "Comunidad" }} />
        <Tabs.Screen name="emocion"        options={{ title: "Emoción" }} />
        <Tabs.Screen name="biblioteca"     options={{ title: "Biblioteca" }} />
        <Tabs.Screen name="geometrix"      options={{ title: "Geometrix", href: null }} />
        <Tabs.Screen name="video"          options={{ title: "Videos" }} />
        <Tabs.Screen name="profile"        options={{ title: "Perfil" }} />
      </Tabs>
      </Animated.View>

      {/* El overlay de categorías va DEBAJO de la barra: así el tab bar queda
          visible sobre Música/Meditaciones/etc. Ambos viven FUERA del wrapper
          con parallax: la barra no debe tener ancestros con transform (el blur
          de Android duplica la barra) y las capas ya no necesitan compensar. */}
      <CategoryOverlay />
      <RoutineCompletionBanner
        bottom={tabBarHeight + 15}
        visible={completionBannerVisible}
        onAddedPress={() => router.push("/rutina-calendario" as never)}
      />
      {barProps && <CustomTabBar {...barProps} />}

    </View>
  );
}

/** Captura las props del tabBar de <Tabs> para renderizar la barra fuera del
 *  wrapper con parallax (evita el fantasma del blur en Android). */
function TabBarPropsBridge({ props, onProps }: { props: any; onProps: (p: any) => void }) {
  const lastStateRef = useRef<unknown>(null);
  useLayoutEffect(() => {
    // La barra vive fuera del árbol transformado de Tabs. Publicar este snapshot
    // antes de pintar evita un frame con la pestaña anterior al cambiar de menú.
    if (lastStateRef.current !== props.state) {
      lastStateRef.current = props.state;
      onProps(props);
    }
  });
  return null;
}

export default function TabLayout() {
  return (
    <CategoryOverlayProvider>
      <RoutineCompletionBannerProvider>
        <TabLayoutInner />
      </RoutineCompletionBannerProvider>
    </CategoryOverlayProvider>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 50,
  },
  pill: {
    position: "absolute",
    top: -1,
    left: TAB_PILL_SIDE_MARGIN,
    right: TAB_PILL_SIDE_MARGIN,
    height: PILL_H + 1,
    borderRadius: (PILL_H + 1) / 2,
  },
  pillShadow: {
    elevation: 18,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.28,
    shadowRadius: 12,
  },
  glassLayer: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: (PILL_H + 1) / 2,
  },
  controlsLayer: {
    // Match the glass border's layout inset without drawing it twice.
    borderColor: "transparent",
  },
  pillClip: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: (PILL_H + 1) / 2,
    overflow: "hidden",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.16)",
  },
  row: {
    height: PILL_H,
    marginTop: 1,
    flexDirection: "row",
    paddingHorizontal: TAB_ROW_PADDING,
    alignItems: "center",
    overflow: "visible",
  },
  rowWeb: {
    width: "100%",
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
    gap: 4,
    width: "100%",
  },
  iconGlow: {
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.30,
    shadowRadius: 4,
  },
  label: {
    fontFamily: "Manrope",
    fontSize: 9,
    lineHeight: 11,
    letterSpacing: 0.3,
    fontWeight: "500",
  },
  labelWrap: {
    width: "100%",
    paddingHorizontal: 2,
    alignItems: "center",
    marginTop: -1,
  },
  labelActive: {
    fontFamily: "Manrope",
    color: GRAD_END,
    fontWeight: "700",
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
});
