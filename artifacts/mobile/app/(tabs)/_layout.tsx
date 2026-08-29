import { Tabs } from "expo-router";
import { SymbolView } from "expo-symbols";
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef, useCallback, useLayoutEffect, useState } from "react";
import { useMixerPanel, MIXER_PANEL_W } from "@/context/MixerPanelContext";
import { useGeometrixPanel, GEOMETRIX_PANEL_W } from "@/context/GeometrixPanelContext";
import MezcladorScreen from "./musica";
import GeometrixScreen from "./geometrix";
import { DURATION, easeOutCubic } from "@/constants/motion";
import {
  Animated,
  Dimensions,
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
import { DormirMiniPlayer } from "@/components/DormirMiniPlayer";
import { DormirExpandedPlayer } from "@/components/DormirExpandedPlayer";
import { useMixer } from "@/context/MixerContext";
import { useDescansoPlayerContext } from "@/context/DescansoPlayerContext";
import { DESCANSO_SOUNDS } from "@/data/descanso-sounds";
import {
  TabBarVisibilityProvider,
  useTabBarVisibility,
} from "@/context/TabBarVisibilityContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useDrawer } from "@/context/DrawerContext";
import { useBrightness, applyBrightSat } from "@/context/BrightnessContext";
import { CategoryOverlayProvider, useCategoryOverlay } from "@/context/CategoryOverlayContext";
import { CategoryOverlay } from "@/components/CategoryOverlay";

const ACTIVE_COLOR   = "#F9F9F9";
const INACTIVE_COLOR = "#A9A9C3";
const GRAD_END       = "#F9F9F9";
const GHOST_PILL_BG  = "rgba(255,255,255,0.12)";

const ICON_SIZE      = 27;
const PILL_H         = 68;   // altura fija de la píldora flotante
const PILL_MARGIN_H  = 15;   // margen horizontal de la píldora


// Rutas que nunca aparecen en el menú inferior
const HIDDEN_ROUTES = new Set(["inicio8", "musica", "biblioteca", "video", "emocion", "encuentros", "herramientas"]);

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
  inicio8:    { label: "Inicio 1",   sfIcon: "house",               sfIconFill: "house.fill",           featherIcon: "home" },
  "inicio-copia": { label: "Inicio 2", sfIcon: "house",              sfIconFill: "house.fill",           featherIcon: "home" },
  explore:    { label: "Descubrir",  sfIcon: "magnifyingglass",     sfIconFill: "magnifyingglass",       featherIcon: "search" },
  herramientas: { label: "Recursos", sfIcon: "square.grid.2x2", sfIconFill: "square.grid.2x2.fill", featherIcon: "grid", iconSize: 25 },
  musica:     { label: "Mezclador",  sfIcon: "slider.horizontal.3", sfIconFill: "slider.horizontal.3", mciIcon: "tune-variant", mciIconFill: "tune-variant", featherIcon: "sliders", activeColor: "#F9F9F9" },
  biblioteca: { label: "Biblioteca", sfIcon: "books.vertical",      sfIconFill: "books.vertical.fill",  featherIcon: "bookmark" },
  video:      { label: "Videos",     sfIcon: "video",               sfIconFill: "video.fill",           featherIcon: "video" },
  descanzo:   { label: "Dormir",     sfIcon: "moon",                sfIconFill: "moon.fill",             featherIcon: "moon" },
  sonidos:    { label: "Sonidos",    sfIcon: "waveform",  sfIconFill: "waveform", mciIcon: "waveform", mciIconFill: "waveform", featherIcon: "headphones", activeColor: "#F9F9F9" },
  emocion:    { label: "Emoción",    sfIcon: "face.smiling",        sfIconFill: "face.smiling.fill",     featherIcon: "smile", emoji: "🙂" },
  profile:    { label: "Perfil",     sfIcon: "person.crop.circle",   sfIconFill: "person.crop.circle.fill", featherIcon: "user" },
};


function TabItem({
  route,
  isFocused,
  onPress,
  tibetMode = false,
}: {
  route: { key: string; name: string };
  isFocused: boolean;
  onPress: () => void;
  tibetMode?: boolean;
}) {
  const conf = TAB_CONFIG[route.name];
  if (!conf) return null;

  const isIOS      = Platform.OS === "ios";
  const iconSize   = conf.iconSize ?? ICON_SIZE;
  const iconOffset = conf.iconOffset ?? 0;
  const labelOffset = conf.labelOffset ?? 0;
  const tOffset    = [{ translateY: iconOffset }];

  const activeCol   = tibetMode ? "#ffffff" : (conf.activeColor ?? ACTIVE_COLOR);
  const inactiveCol = tibetMode ? "#A9A9C3" : INACTIVE_COLOR;

  const makeIcon = useCallback((active: boolean) => {
    const color  = active ? activeCol : inactiveCol;
    const sfName = active ? conf.sfIconFill : conf.sfIcon;
    const mciName = active ? conf.mciIconFill : conf.mciIcon;
    return conf.emoji ? (
      <Text style={{ fontSize: 22, lineHeight: 26, transform: tOffset }}>{conf.emoji}</Text>
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
      accessibilityRole="button"
      accessibilityState={{ selected: isFocused }}
    >
      <View style={styles.pillWrap}>
        <View style={{ width: iconSize, height: ICON_SIZE, alignItems: "center", justifyContent: "center", overflow: "visible" }}>
          {makeIcon(isFocused)}
        </View>
        <View style={[styles.labelWrap, { transform: [{ translateY: labelOffset }] }]}>
          <Text style={[styles.label, { color: isFocused ? activeCol : inactiveCol }]} numberOfLines={1}>
            {conf.label}
          </Text>
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
  const { openMixer, isMixerOpen } = useMixerPanel();
  // Compensa el parallax del wrapper de Tabs (la barra vive dentro de él).
  const { isGeometrixOpen } = useGeometrixPanel();
  const { closeAllCategories } = useCategoryOverlay();

  // 8 px de separación con el borde inferior de la pantalla
  const barBottom = Math.max(3, pb - 10 - 5) - 1;
  // Altura total que ocupa la píldora (para la animación de hide)
  const barHeight = PILL_H + barBottom + 40;

  const { hidden, showMenu } = useTabBarVisibility();
  const { activeSceneId } = useSceneTheme();
  const translateY    = useRef(new Animated.Value(0)).current;
  const handleOpacity = useRef(new Animated.Value(0)).current;

  // ── Sliding ghost pill ──────────────────────────────────────────
  // Solo contar rutas que tienen entrada en TAB_CONFIG y no están ocultas
  const ROW_H_PAD = 6; // paddingHorizontal del row (debe coincidir con styles.row)

  const isRenderedTab = (name: string) => name in TAB_CONFIG && !HIDDEN_ROUTES.has(name);

  const visibleCount = state.routes.filter((r: { name: string }) => isRenderedTab(r.name)).length;

  const currentIsRendered = isRenderedTab(state.routes[state.index]?.name ?? "");

  const computeVisibleIndex = (routeIndex: number) => {
    let idx = 0;
    for (let i = 0; i < routeIndex; i++) {
      if (isRenderedTab(state.routes[i].name)) idx++;
    }
    return idx;
  };

  // Cuando el route actual es href:null (categorías, coleccion, etc.) el índice
  // del tabs navigator apunta a esa pantalla en lugar de al tab real — guardamos
  // el último tab real activo y lo usamos como referencia.
  const lastRealRouteIndex = useRef(state.index);
  if (currentIsRendered) {
    lastRealRouteIndex.current = state.index;
  }
  const effectiveRouteIndex = currentIsRendered ? state.index : lastRealRouteIndex.current;

  const visibleIndex = computeVisibleIndex(effectiveRouteIndex);

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
    Animated.timing(translateY, {
      toValue: hidden ? barHeight + 40 : 0,
      duration: DURATION.SHEET_CLOSE,
      easing: easeOutCubic,
      useNativeDriver: true,
    }).start();
    // La pestañita NO debe aparecer cuando la barra se ocultó por el panel del
    // Mezclador o Geometrix (al cerrar el panel se veía un flash del chevron-up).
    const panelOpen = isMixerOpen || isGeometrixOpen;
    if (panelOpen || !hidden) {
      // Ocultar de inmediato (sin fade) para que no quede visible durante la
      // transición de cierre de los paneles.
      handleOpacity.stopAnimation();
      handleOpacity.setValue(0);
    } else {
      // Mostrar con un pequeño delay: al cerrar Mezclador/Geometrix hay unos
      // milisegundos donde hidden sigue true antes de que el panel llame a
      // showMenu(); el delay evita que la pestañita alcance a aparecer.
      Animated.timing(handleOpacity, {
        toValue: 1,
        delay: 350,
        duration: DURATION.SHEET_CLOSE,
        easing: easeOutCubic,
        useNativeDriver: true,
      }).start();
    }
  }, [hidden, barHeight, translateY, handleOpacity, isMixerOpen, isGeometrixOpen]);

  return (
    <>
      <Animated.View
        style={[styles.bar, { bottom: barBottom, transform: [{ translateY }] }]}
      >
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

            const isFocused = effectiveRouteIndex === index;
            const onPress   = () => {
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
                tibetMode={activeSceneId === "tibet"}
              />
            );
          })}
        </View>
      </Animated.View>

      {/* Pestañita para recuperar el menú cuando está oculto (todos los tabs menos Mezclador y Geometrix) */}
      {state.routes[state.index]?.name !== "musica" && state.routes[state.index]?.name !== "geometrix" && (
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
  const { activeSounds }   = useMixer();
  const insets             = useSafeAreaInsets();
  const isWeb              = Platform.OS === "web";
  const bottomPb           = isWeb ? 8 : insets.bottom;
  const tabBarHeight       = PILL_H + Math.max(8, bottomPb - 10);
  const { hidden }         = useTabBarVisibility();
  const [barProps, setBarProps] = useState<any>(null);
  const { isMixerOpen, closeMixer, panelAnim } = useMixerPanel();
  const { isGeometrixOpen, hasOpenedGeometrix, closeGeometrix, panelAnim: geoPanelAnim } = useGeometrixPanel();

  const geoTranslateX = geoPanelAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [GEOMETRIX_PANEL_W, 0],
  });
  const geoBackdropOpacity = geoPanelAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, 0.55],
  });
  const { theme } = useSceneTheme();
  const { brightMode } = useBrightness();
  const bg = brightMode ? applyBrightSat(theme.solid) : theme.solid;

  const panelTranslateX = panelAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [MIXER_PANEL_W, 0],
  });
  const backdropOpacity = panelAnim.interpolate({
    inputRange:  [0, 1],
    outputRange: [0, 0.55],
  });

  const miniPlayerBottom = hidden ? bottomPb + 10 : tabBarHeight - 10;
  const topPad         = isWeb ? 67 : Math.max(insets.top, 40);

  const descansoPlayer = useDescansoPlayerContext();
  const selectedSound = descansoPlayer.selectedId
    ? (DESCANSO_SOUNDS.find((s) => s.id === descansoPlayer.selectedId) ?? null)
    : null;
  const { isExpanded, setIsExpanded } = descansoPlayer;

  // Navegar entre sonidos de Dormir desde el reproductor expandido
  const dormirSoundIdx = descansoPlayer.selectedId
    ? DESCANSO_SOUNDS.findIndex((s) => s.id === descansoPlayer.selectedId)
    : -1;
  const handleDormirPrev = useCallback(() => {
    if (dormirSoundIdx < 0) return;
    const prev = DESCANSO_SOUNDS[(dormirSoundIdx - 1 + DESCANSO_SOUNDS.length) % DESCANSO_SOUNDS.length];
    descansoPlayer.toggle(prev.id, prev.audioUri ?? null);
  }, [dormirSoundIdx, descansoPlayer]);
  const handleDormirNext = useCallback(() => {
    if (dormirSoundIdx < 0) return;
    const next = DESCANSO_SOUNDS[(dormirSoundIdx + 1) % DESCANSO_SOUNDS.length];
    descansoPlayer.toggle(next.id, next.audioUri ?? null);
  }, [dormirSoundIdx, descansoPlayer]);


  // Parallax sutil: el contenido de fondo se corre un poco a la izquierda
  // cuando entra un panel derecha→izquierda (estilo Insight Timer).
  const { parallaxAnim: overlayParallax } = useCategoryOverlay();
  const bgParallaxX = Animated.add(
    Animated.add(
      panelAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -56], extrapolate: "clamp" }),
      geoPanelAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -56], extrapolate: "clamp" }),
    ),
    overlayParallax.interpolate({ inputRange: [0, 1], outputRange: [0, -56], extrapolate: "clamp" }),
  );

  return (
    <View style={{ flex: 1, backgroundColor: bg }}>
      <Animated.View style={{ flex: 1, transform: [{ translateX: bgParallaxX }] }}>
      <Tabs
        screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: bg } }}
        tabBar={(props) => <TabBarPropsBridge props={props} onProps={setBarProps} />}
      >
        <Tabs.Screen name="index"          options={{ href: null }} />
        <Tabs.Screen name="inicio8"        options={{ title: "Inicio" }} />
        <Tabs.Screen name="inicio-copia"   options={{ title: "Inicio 2" }} />
        <Tabs.Screen name="musica"         options={{ title: "Creación" }} />
        <Tabs.Screen name="category/meditaciones-guiadas" options={{ href: null }} />
        <Tabs.Screen name="category/musica-sonidos"       options={{ href: null }} />
        <Tabs.Screen name="category/sonidos-ancestrales"  options={{ href: null }} />
        <Tabs.Screen name="category/mananas"              options={{ href: null }} />
        <Tabs.Screen name="category/noches"               options={{ href: null }} />
        <Tabs.Screen name="category/[id]"                 options={{ href: null }} />
        <Tabs.Screen name="explore"        options={{ title: "Medita" }} />
        <Tabs.Screen name="descanzo"       options={{ title: "Dormir" }} />
        <Tabs.Screen name="herramientas"  options={{ title: "Recursos" }} />
        <Tabs.Screen name="sonidos"        options={{ title: "Sonidos" }} />
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
      {barProps && <CustomTabBar {...barProps} />}

      {/* ── Mixer Drawer Panel — siempre montado, desliza desde la izquierda ── */}
      <Animated.View
        pointerEvents={isMixerOpen ? "box-none" : "none"}
        style={[styles.mixerPanel, { transform: [{ translateX: panelTranslateX }] }]}
      >
        <MezcladorScreen />
        {activeSounds.length > 0 && (
          <View style={styles.miniPlayerFloat} pointerEvents="box-none">
            <MiniPlayer forceMix />
          </View>
        )}
      </Animated.View>
      <Animated.View
        pointerEvents={isMixerOpen ? "auto" : "none"}
        style={[styles.mixerBackdrop, { opacity: backdropOpacity }]}
      >
        <Pressable style={{ flex: 1 }} onPress={closeMixer} />
      </Animated.View>

      {/* ── Geometrix Panel — se monta en la primera apertura, desliza derecha→izquierda ── */}
      {hasOpenedGeometrix && (
        <>
          <Animated.View
            pointerEvents={isGeometrixOpen ? "box-none" : "none"}
            style={[styles.mixerPanel, { transform: [{ translateX: geoTranslateX }] }]}
          >
            <GeometrixScreen />
          </Animated.View>
          <Animated.View
            pointerEvents={isGeometrixOpen ? "auto" : "none"}
            style={[styles.mixerBackdrop, { opacity: geoBackdropOpacity }]}
          >
            <Pressable style={{ flex: 1 }} onPress={closeGeometrix} />
          </Animated.View>
        </>
      )}


      {/* ── DormirMiniPlayer persistente (binaurales/ambientales) ───────── */}
      {selectedSound && (
        <>
          <DormirMiniPlayer
            sound={selectedSound}
            isPlaying={descansoPlayer.isPlaying}
            isLoading={descansoPlayer.isLoading}
            onToggle={() => descansoPlayer.toggle(selectedSound.id, selectedSound.audioUri ?? null)}
            onStop={() => { setIsExpanded(false); descansoPlayer.stop(); }}
            bottomOffset={miniPlayerBottom}
            closeColor="#ffffff"
            isExpanded={isExpanded}
            topOffset={topPad}
            onExpand={() => setIsExpanded(true)}
          />
          <DormirExpandedPlayer
            sound={selectedSound}
            isPlaying={descansoPlayer.isPlaying}
            isLoading={descansoPlayer.isLoading}
            isExpanded={isExpanded}
            onToggle={() => descansoPlayer.toggle(selectedSound.id, selectedSound.audioUri ?? null)}
            onCollapse={() => setIsExpanded(false)}
            onStop={() => { setIsExpanded(false); descansoPlayer.stop(); }}
            onPrev={handleDormirPrev}
            onNext={handleDormirNext}
            timerMinutes={descansoPlayer.timerMinutes}
            onSetTimer={descansoPlayer.setTimerMinutes}
            bottomInset={bottomPb}
            topInset={topPad}
          />
        </>
      )}


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
      <TabBarVisibilityProvider>
        <TabLayoutInner />
      </TabBarVisibilityProvider>
    </CategoryOverlayProvider>
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
    backgroundColor: "rgba(42,40,64,0.95)",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 24,
    // elevation rompe el blur dimezis en Android (capa separada → no captura el fondo)
    ...(Platform.OS === "android" ? {} : { elevation: 20 }),
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
    gap: 0,
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
    letterSpacing: 0.3,
    fontWeight: "500",
  },
  labelWrap: {
    width: "100%",
    paddingHorizontal: 2,
    alignItems: "center",
    marginTop: 2,
  },
  labelActive: {
    fontFamily: "Manrope",
    color: GRAD_END,
    fontWeight: "600",
  },
  slidingPill: {
    position: "absolute",
    // Píldora horizontal de 57px centrada verticalmente en el bar
    top: (PILL_H - 57) / 2 - 1,
    height: 57,
    // left = ROW_H_PAD(6) + (tabWidth - pillWidth)/2 = 6 + (-3/2) ≈ 5
    left: 5,
    borderRadius: 28,
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
    left: PILL_MARGIN_H,
    right: PILL_MARGIN_H,
    bottom: 29,
  },
  mixerPanel: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: MIXER_PANEL_W,
    zIndex: 500,
    elevation: 0,
    backgroundColor: "#1B060F",
    overflow: "hidden",
  },
  mixerBackdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    backgroundColor: "#000",
    zIndex: 499,
    elevation: 0,
  },
});
