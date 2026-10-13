import "@/lib/fix-http-assets";
import "@/lib/configure-scroll";
import { Asset } from "expo-asset";
import * as Font from "expo-font";
import { useFonts } from "expo-font";
import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { CormorantGaramond_500Medium } from "@expo-google-fonts/cormorant-garamond";
import { ClerkProvider, ClerkLoaded, useAuth as useClerkAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { QueryClient, QueryClientProvider, focusManager } from "@tanstack/react-query";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import { setCommunityTokenGetter } from "@/lib/communityApi";
import { router, Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { Animated, AppState, Dimensions, I18nManager, Text, TextInput } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { BibliotecaOverlay } from "@/components/BibliotecaOverlay";
import { libraryScreenLayout } from "@/components/LibraryDetailTransition";
import { libraryDetailOptions } from "@/lib/library-detail-navigation";
import { LibraryMixOverlay } from "@/components/LibraryMixOverlay";
import { DrawerScreenOverlay } from "@/components/DrawerScreenOverlay";
import { ChatOverlay } from "@/components/ChatOverlay";
import { DrawerMenu } from "@/components/DrawerMenu";
import { DrawerForeground } from "@/components/DrawerForeground";
import { CreationPanelsOverlay } from "@/components/CreationPanelsOverlay";
import { MixerSheet } from "@/components/MixerSheet";
import { EscenasSheet } from "@/components/EscenasSheet";
import { SceneAnimationModal } from "@/components/SceneAnimationModal";
import { PremiumPlansOverlay } from "@/components/PremiumPlansOverlay";
import { SelectedSceneProvider, useSelectedScene } from "@/context/SelectedSceneContext";
import { TabBarVisibilityProvider } from "@/context/TabBarVisibilityContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { SacredBackground } from "@/components/SacredBackground";
import { AmbientPlayerProvider } from "@/context/AmbientPlayerContext";
import { SceneThemeProvider, loadPersistedSceneId, useSceneTheme } from "@/context/SceneThemeContext";
import type { VisualThemeId } from "@/config/scene-themes";
import { BrightnessProvider, loadPersistedBrightMode } from "@/context/BrightnessContext";
import { CatalogProvider } from "@/context/CatalogContext";
import { MoodQuotesProvider } from "@/context/MoodQuotesContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { InspirationProvider } from "@/context/InspirationContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { preloadGeometrixIntro } from "@/lib/geometrixIntro";
import { initializePracticeNotifications } from "@/lib/practiceNotifications";
import { DiarioFavoritesProvider } from "@/context/DiarioFavoritesContext";
import { FoldersPlaylistsProvider } from "@/context/FoldersPlaylistsContext";
import { VideosProvider } from "@/context/VideosContext";
import {
  DrawerProvider,
  DRAWER_OVERLAY_PARALLAX_X,
  useDrawerDestinations,
} from "@/context/DrawerContext";
import { MixerPanelProvider } from "@/context/MixerPanelContext";
import { GeometrixPanelProvider } from "@/context/GeometrixPanelContext";
import { GreetingVisibleProvider } from "@/context/GreetingVisibleContext";
import { EmojiWidgetProvider } from "@/context/EmojiWidgetContext";
import { HomeWeekPreferenceProvider } from "@/context/HomeWeekPreferenceContext";
import { TabBarLabelsProvider } from "@/context/TabBarLabelsContext";
import { IntencionProvider } from "@/context/IntencionContext";
import { MixerProvider } from "@/context/MixerContext";
import { SoundsProvider } from "@/context/SoundsContext";
import { SaveEventProvider } from "@/context/SaveEventContext";
import { MilestonesProvider } from "@/context/MilestonesContext";
import { MilestoneCelebration } from "@/components/MilestoneCelebration";
import { StreakCelebrationProvider } from "@/context/StreakCelebrationContext";
import { StreakCelebrationFlow } from "@/components/StreakCelebrationFlow";
import { PlayerProvider } from "@/context/PlayerContext";
import { GrowthProvider } from "@/context/GrowthContext";
import { AmbientalDurationProvider } from "@/context/AmbientalDurationContext";
import { GeoUniverseProvider } from "@/context/GeoUniverseContext";
import { RachaProvider } from "@/context/RachaContext";
import { IntencionDiariaProvider } from "@/context/IntencionDiariaContext";
import { RutinaProvider } from "@/context/RutinaContext";
import { PremiumProvider } from "@/context/PremiumContext";
import { UserProfileProvider } from "@/context/UserProfileContext";
import { ProfileSync } from "@/components/ProfileSync";
import { CommunityPresenceTracker } from "@/components/CommunityPresenceTracker";
import { NotificationsProvider } from "@/context/NotificationsContext";
import { DownloadProvider } from "@/context/DownloadContext";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;
if (apiUrl) setBaseUrl(apiUrl);

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
const proxyUrl = process.env.EXPO_PUBLIC_CLERK_PROXY_URL || undefined;

SplashScreen.preventAutoHideAsync().catch(() => {});

// ── Manrope por defecto sin alterar StyleSheet.create ───────────────────────
// Alterar StyleSheet.create elimina la inferencia específica de cada estilo
// (TextStyle/ViewStyle/ImageStyle) y rompe tanto el typecheck como los íconos.
// El estilo base va primero para que cualquier fuente explícita lo sobrescriba.
type FontPatchedComponent = {
  render?: (props: { style?: unknown; [key: string]: unknown }, ref: unknown) => unknown;
  __manropePatched?: boolean;
};

function applyDefaultFont(component: unknown) {
  const target = component as FontPatchedComponent;
  if (!target.render || target.__manropePatched) return;

  const originalRender = target.render;
  target.render = (props, ref) =>
    originalRender(
      { ...props, style: [{ fontFamily: "Manrope" }, props.style] },
      ref,
    );
  target.__manropePatched = true;
}

applyDefaultFont(Text);
applyDefaultFont(TextInput);

// Defaults globales (auditoría): datos frescos por 60 s antes de refetch,
// reintentos acotados, y sondeos pausados cuando la app está en background
// (refetchIntervalInBackground=false + focusManager cableado a AppState).
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      retry: 2,
      refetchIntervalInBackground: false,
    },
  },
});

// React Query no conoce el AppState de React Native por sí solo: sin esto,
// "focused" queda siempre true y los refetchInterval siguen corriendo con la
// app minimizada. El listener vive dentro del árbol para liberarlo al desmontar
// el layout (el listener de módulo anterior nunca se limpiaba).
function ReactQueryAppStateBridge() {
  useEffect(() => {
    focusManager.setFocused(AppState.currentState === "active");
    const subscription = AppState.addEventListener("change", (state) => {
      focusManager.setFocused(state === "active");
    });
    return () => subscription.remove();
  }, []);
  return null;
}

/** Attach Clerk session token to all generated API client requests and community helpers. */
function ApiAuthBridge() {
  const { getToken } = useClerkAuth();
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
    setCommunityTokenGetter(() => getToken());
  }, [getToken]);
  return null;
}

/** Sends new users (no local onboarding yet) to the onboarding screen.
 *  Does NOT force Clerk sign-in — guests can use the whole app. Clerk
 *  sign-in is only triggered explicitly from social features. */
function AuthGate() {
  const segments = useSegments();
  const redirected = React.useRef(false);
  const { isRegistered, authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;
    if (redirected.current) return;
    if (isRegistered) return;
    if (segments[0] === "onboarding") return;
    if (segments[0] === "(auth)") return; // user explicitly opened sign-in
    redirected.current = true;
    // TEMP: onboarding (logo + encuesta) deshabilitado por pedido del usuario.
    // Para reactivar, descomentar la línea de abajo.
    // router.replace("/onboarding");
  }, [segments, isRegistered, authLoading]);

  return null;
}

function PushBridge() {
  usePushNotifications();
  return null;
}

/** El fondo y el degradado proceden del único tema visual. */
function ThemedGestureRoot({ children }: { children: React.ReactNode }) {
  const { theme } = useSceneTheme();
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: theme.solid }}>
      <SacredBackground variant="gradient" noImage />
      {children}
    </GestureHandlerRootView>
  );
}

/** Pantalla activa: solo ella recibe el parallax de overlays abiertos fuera
 *  del drawer. El drawer estilo X vive en DrawerForeground (sin velo negro). */
function NavParallax({ children }: { children: React.ReactNode }) {
  const { overlayParallax } = useDrawerDestinations();
  const backgroundParallaxX = overlayParallax.interpolate({
    inputRange: [0, 1],
    outputRange: [0, DRAWER_OVERLAY_PARALLAX_X],
    extrapolate: "clamp",
  });
  return (
    <Animated.View style={{ flex: 1, transform: [{ translateX: backgroundParallaxX }] }}>
      {children}
    </Animated.View>
  );
}

function NavStack() {
  // Navegación desde el menú: las pantallas destino del drawer entran sin slide
  // propio (instantáneo), así el único movimiento es el cierre del drawer y no se
  // alcanza a ver Inicio antes de la página. Desde otros lados, slide normal.
  const { instantNav } = useDrawerDestinations();
  const { theme } = useSceneTheme();
  const drawerScreenAnim = instantNav ? "none" : "slide_from_right";
  return (
      <Stack
        screenLayout={libraryScreenLayout}
        screenOptions={({ route }) => ({
          headerShown: false,
          contentStyle: { backgroundColor: "transparent" },
          ...libraryDetailOptions(route.params),
        })}
      >
        <Stack.Screen name="(auth)" options={{ headerShown: false, animation: "fade" }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="onboarding"
          options={{ headerShown: false, animation: "fade", gestureEnabled: false }}
        />
        <Stack.Screen
          name="player"
          options={{ headerShown: false, presentation: "fullScreenModal", animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="inmersivo"
          options={{ headerShown: false, presentation: "fullScreenModal", animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="inmersivo-mixer"
          options={{ headerShown: false, presentation: "fullScreenModal", animation: "fade" }}
        />
        <Stack.Screen
          name="escenas-mixer"
          options={{ headerShown: false, presentation: "fullScreenModal", animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="sesion-vivo/[id]"
          options={{ headerShown: false, presentation: "fullScreenModal", animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="reservar-sesion/[guideId]"
          options={{ headerShown: false, animation: "slide_from_bottom", presentation: "modal" }}
        />
        <Stack.Screen
          name="mis-sesiones"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="session/[id]"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="artista/[id]"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="encuentro/[id]"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="coleccion/[id]"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="chakra/[id]"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="guiador/[id]"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="playlist/[id]"
          options={({ route }) => ({ headerShown: false, animation: "slide_from_right", ...libraryDetailOptions(route.params) })}
        />
        <Stack.Screen
          name="editorial-playlist/[slug]"
          options={({ route }) => ({ headerShown: false, animation: "slide_from_right", ...libraryDetailOptions(route.params) })}
        />
        <Stack.Screen
          name="mezclas-comunidad"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="medita-tiempo"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="busqueda"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="tag/[id]"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="sleep-tag/[id]"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="music-tag/[id]"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="historial"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen name="descargas" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen
          name="historial-emociones"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="mensajes-del-alma"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="notificaciones"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="notificaciones-practica"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="personalizar-notificaciones"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="nuevas-sesiones"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="terminos"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="todas-las-tematicas"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="intencion-onboarding"
          options={{ headerShown: false, presentation: "modal", animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="intencion"
          options={{ headerShown: false, presentation: "modal", animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="registro"
          options={{ headerShown: false, animation: "slide_from_bottom", presentation: "modal" }}
        />
        <Stack.Screen name="category/musica-sonidos"       options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="category/meditaciones-guiadas"  options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="category/sonidos-ancestrales"   options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="videos"  options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen
          name="chat/[userId]"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen name="respiracion" options={{ headerShown: false, animation: drawerScreenAnim }} />
        <Stack.Screen name="progreso" options={{ headerShown: false, animation: drawerScreenAnim }} />
        <Stack.Screen name="mi-perfil" options={{ headerShown: false, animation: drawerScreenAnim }} />
        <Stack.Screen name="mi-espacio-interior" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="galeria-reflexiones/index" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="galeria-reflexiones/[id]" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="diario" options={{ headerShown: false, animation: drawerScreenAnim }} />
        <Stack.Screen name="crear-rutina" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="rutina/[id]" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="rutina-calendario" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen
          name="diario-entrada"
          options={{ headerShown: false, presentation: "modal", animation: "slide_from_bottom" }}
        />
        <Stack.Screen name="favorites" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="favoritos-todos" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="amigos" options={{ headerShown: false, animation: drawerScreenAnim }} />
        <Stack.Screen name="grupos" options={{ headerShown: false, animation: drawerScreenAnim }} />
        <Stack.Screen name="reflexiones" options={{ headerShown: false, animation: drawerScreenAnim }} />
        <Stack.Screen name="ayuda" options={{ headerShown: false, animation: drawerScreenAnim }} />
        <Stack.Screen name="invitar" options={{ headerShown: false, animation: drawerScreenAnim }} />
        <Stack.Screen name="configuraciones" options={{ headerShown: false, animation: drawerScreenAnim }} />
        <Stack.Screen name="membresia" options={{ headerShown: false, animation: drawerScreenAnim }} />
      </Stack>
  );
}

function GlobalSceneModal() {
  const { selectedScene, setSelectedScene } = useSelectedScene();
  return (
    <SceneAnimationModal
      scene={selectedScene}
      onClose={() => setSelectedScene(null)}
    />
  );
}

function RootLayoutNav() {
  return (
    <SelectedSceneProvider>
      <DrawerProvider>
        <MixerPanelProvider>
          <GeometrixPanelProvider>
          <ApiAuthBridge />
          <AuthGate />
          <PushBridge />
          {/* Menu fijo detras; la superficie frontal se desplaza y lo revela. */}
          <DrawerMenu />
          <DrawerForeground>
            <NavParallax>
              <NavStack />
            </NavParallax>
            <CreationPanelsOverlay />
            <BibliotecaOverlay />
            <LibraryMixOverlay />
            <DrawerScreenOverlay />
            <ChatOverlay />
          </DrawerForeground>
          <MixerSheet />
          <EscenasSheet />
          <GlobalSceneModal />
           <PremiumPlansOverlay />
          </GeometrixPanelProvider>
        </MixerPanelProvider>
      </DrawerProvider>
    </SelectedSceneProvider>
  );
}

export default function RootLayout() {
  // Cargar explícitamente las tipografías de íconos junto con Manrope.
  // Sin esto dependen de una carga perezosa que en algunos dispositivos
  // Android falla en silencio y los íconos quedan como cajitas (tofu).
  const [fontsLoaded, fontError] = useFonts({
    Manrope: require("../assets/fonts/Manrope.ttf"),
    Manrope550: require("../assets/fonts/Manrope550.ttf"),
    Manrope630: require("../assets/fonts/Manrope630.ttf"),
    Manrope620: require("../assets/fonts/Manrope620.ttf"),
    Manrope650: require("../assets/fonts/Manrope650.ttf"),
    CormorantGaramond: CormorantGaramond_500Medium,
    ...Feather.font,
    ...MaterialCommunityIcons.font,
    ...Ionicons.font,
    ...FontAwesome5.font,
    ...MaterialIcons.font,
  });

  useEffect(() => {
    if (__DEV__) {
      const win = Dimensions.get("window");
      const scr = Dimensions.get("screen");
      console.log(
        `[device] RTL=${I18nManager.isRTL} allowRTL=${(I18nManager as any).getConstants?.().doLeftAndRightSwapInRTL ?? "?"} ` +
        `window=${Math.round(win.width)}x${Math.round(win.height)} screen=${Math.round(scr.width)}x${Math.round(scr.height)} ` +
        `scale=${win.scale} fontScale=${win.fontScale}`
      );
    }
    console.log(`[fonts] loaded=${fontsLoaded} error=${fontError ? String(fontError) : "none"}`);
    if (fontsLoaded) {
      try {
        // Preguntar al lado NATIVO qué familias quedaron registradas de verdad.
        const native = (Font as unknown as { getLoadedFonts?: () => string[] }).getLoadedFonts?.();
        console.log(`[fonts] nativas registradas: ${JSON.stringify(native)}`);
      } catch (e) {
        console.log(`[fonts] getLoadedFonts falló: ${String(e)}`);
      }
      // Verificar que el ARCHIVO de la fuente llega íntegro al dispositivo
      // (Android registra fuentes corruptas en silencio con la letra genérica).
      if (!__DEV__) return;
      (async () => {
        try {
          const mod = Object.values(Feather.font)[0] as number;
          const asset = Asset.fromModule(mod);
          await asset.downloadAsync();
          console.log(`[fonts] feather uri=${asset.uri} localUri=${asset.localUri}`);
          const res = await fetch(asset.localUri || asset.uri);
          const buf = await res.arrayBuffer();
          const head = Array.from(new Uint8Array(buf.slice(0, 4)))
            .map((b) => b.toString(16).padStart(2, "0"))
            .join(" ");
          console.log(`[fonts] feather bytes=${buf.byteLength} head=${head} (ttf válido = 00 01 00 00)`);
        } catch (e) {
          console.log(`[fonts] verificación de archivo falló: ${String(e)}`);
        }
      })();
    }
  }, [fontsLoaded, fontError]);

  // Carga el tema visual y Luz/Noche antes del primer render para evitar destellos.
  const [initialBrightMode, setInitialBrightMode] = React.useState<boolean | null>(null);
  const [initialSceneId, setInitialSceneId] = React.useState<VisualThemeId | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadPersistedBrightMode().then((enabled) => {
      if (!cancelled) setInitialBrightMode(enabled);
    });
    loadPersistedSceneId().then((id) => {
      if (!cancelled) setInitialSceneId(id);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const themeReady = initialBrightMode !== null && initialSceneId !== null;

  useEffect(() => {
    if ((fontsLoaded || fontError) && themeReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, themeReady]);

  // Precarga el audio del logo reveal de Geometrix al arrancar la app (la
  // pestaña se monta perezosa, así que precargarlo allí llegaba tarde). Con
  // segundos de anticipación, el primer play sincroniza con el FadeIn sin delay.
  useEffect(() => {
    preloadGeometrixIntro();
    void initializePracticeNotifications();
  }, []);

  if (initialBrightMode === null || initialSceneId === null) return null;

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      tokenCache={tokenCache}
      proxyUrl={proxyUrl}
    >
      <ClerkLoaded>
        <SafeAreaProvider>
          <ErrorBoundary>
            <BrightnessProvider initialBrightMode={initialBrightMode}>
            <QueryClientProvider client={queryClient}>
              <ReactQueryAppStateBridge />
              <SoundsProvider>
              <CatalogProvider>
              <MoodQuotesProvider>
              <AuthProvider>
                <CommunityPresenceTracker />
              <InspirationProvider>
                <NotificationsProvider>
                <PremiumProvider>
                <DownloadProvider>
                <PlayerProvider>
                  <GrowthProvider>
                  <AmbientPlayerProvider>
                    <MixerProvider>
                    <MilestonesProvider>
                    <StreakCelebrationProvider>
                    <SaveEventProvider>
                    <UserProfileProvider>
                      <ProfileSync />
                      <GreetingVisibleProvider>
                      <EmojiWidgetProvider>
                      <HomeWeekPreferenceProvider>
                      <TabBarLabelsProvider>
                      <IntencionProvider>
                        <FoldersPlaylistsProvider>
                        <VideosProvider>
                        <DiarioFavoritesProvider>
                          <SceneThemeProvider initialSceneId={initialSceneId}>
                          <GeoUniverseProvider>
                          <RachaProvider>
                          <IntencionDiariaProvider>
                           <RutinaProvider>
                            <ThemedGestureRoot>
                              <AmbientalDurationProvider>
                                <StatusBar hidden />
                                <KeyboardProvider>
                                   <TabBarVisibilityProvider>
                                     <RootLayoutNav />
                                   </TabBarVisibilityProvider>
                                </KeyboardProvider>
                                <StreakCelebrationFlow />
                              </AmbientalDurationProvider>
                            </ThemedGestureRoot>
                           </RutinaProvider>
                          </IntencionDiariaProvider>
                          </RachaProvider>
                          </GeoUniverseProvider>
                          </SceneThemeProvider>
                        </DiarioFavoritesProvider>
                        </VideosProvider>
                        </FoldersPlaylistsProvider>
                      </IntencionProvider>
                      </TabBarLabelsProvider>
                      </HomeWeekPreferenceProvider>
                      </EmojiWidgetProvider>
                      </GreetingVisibleProvider>
                    </UserProfileProvider>
                    </SaveEventProvider>
                    </StreakCelebrationProvider>
                    <MilestoneCelebration />
                    </MilestonesProvider>
                    </MixerProvider>
                  </AmbientPlayerProvider>
                  </GrowthProvider>
                </PlayerProvider>
                </DownloadProvider>
                </PremiumProvider>
              </NotificationsProvider>
              </InspirationProvider>
              </AuthProvider>
              </MoodQuotesProvider>
              </CatalogProvider>
              </SoundsProvider>
            </QueryClientProvider>
            </BrightnessProvider>
          </ErrorBoundary>
        </SafeAreaProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
