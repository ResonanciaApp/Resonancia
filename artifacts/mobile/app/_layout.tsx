import "@/lib/fix-http-assets";
import { Asset } from "expo-asset";
import * as Font from "expo-font";
import { useFonts } from "expo-font";
import { Feather, FontAwesome5, Ionicons, MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { ClerkProvider, ClerkLoaded, useAuth as useClerkAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { QueryClient, QueryClientProvider, focusManager } from "@tanstack/react-query";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import { setCommunityTokenGetter } from "@/lib/communityApi";
import { router, Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import React, { useEffect } from "react";
import { Animated, Dimensions, I18nManager, StyleSheet, Text, TextInput, View, AppState } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { BibliotecaOverlay } from "@/components/BibliotecaOverlay";
import { DrawerScreenOverlay } from "@/components/DrawerScreenOverlay";
import { ChatOverlay } from "@/components/ChatOverlay";
import { DrawerMenu } from "@/components/DrawerMenu";
import { MixerSheet } from "@/components/MixerSheet";
import { EscenasSheet } from "@/components/EscenasSheet";
import { SceneAnimationModal } from "@/components/SceneAnimationModal";
import { SelectedSceneProvider, useSelectedScene } from "@/context/SelectedSceneContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AmbientPlayerProvider } from "@/context/AmbientPlayerContext";
import { SceneThemeProvider, SceneThemeTransitionOverlay, useSceneTheme, loadPersistedSceneId } from "@/context/SceneThemeContext";
import type { SceneId } from "@/context/AmbientPlayerContext";
import { BrightnessProvider, useBrightness, applyBrightSat } from "@/context/BrightnessContext";
import { CatalogProvider } from "@/context/CatalogContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { preloadGeometrixIntro } from "@/lib/geometrixIntro";
import { DiarioFavoritesProvider } from "@/context/DiarioFavoritesContext";
import { FoldersPlaylistsProvider } from "@/context/FoldersPlaylistsContext";
import { VideosProvider } from "@/context/VideosContext";
import { DrawerProvider, useDrawer } from "@/context/DrawerContext";
import { MixerPanelProvider } from "@/context/MixerPanelContext";
import { GeometrixPanelProvider } from "@/context/GeometrixPanelContext";
import { GreetingVisibleProvider } from "@/context/GreetingVisibleContext";
import { IntencionProvider } from "@/context/IntencionContext";
import { MixerProvider } from "@/context/MixerContext";
import { SoundsProvider } from "@/context/SoundsContext";
import { SaveEventProvider } from "@/context/SaveEventContext";
import { MilestonesProvider } from "@/context/MilestonesContext";
import { MilestoneCelebration } from "@/components/MilestoneCelebration";
import { StreakCelebrationProvider } from "@/context/StreakCelebrationContext";
import { StreakCelebrationFlow } from "@/components/StreakCelebrationFlow";
import { PlayerProvider } from "@/context/PlayerContext";
import { GeoUniverseProvider } from "@/context/GeoUniverseContext";
import { RachaProvider } from "@/context/RachaContext";
import { IntencionDiariaProvider } from "@/context/IntencionDiariaContext";
import { PremiumProvider } from "@/context/PremiumContext";
import { UserProfileProvider } from "@/context/UserProfileContext";
import { ProfileSync } from "@/components/ProfileSync";
import { NotificationsProvider } from "@/context/NotificationsContext";
import { DescansoPlayerProvider } from "@/context/DescansoPlayerContext";

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
// app minimizada.
AppState.addEventListener("change", (state) => {
  focusManager.setFocused(state === "active");
});

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

/** GestureHandlerRootView con el color de fondo del tema activo.
 *  Cuando Modo brillante está activo añade un overlay blanco semitransparente
 *  con pointerEvents="none" para no bloquear taps. */
function ThemedGestureRoot({ children }: { children: React.ReactNode }) {
  const { theme } = useSceneTheme();
  const { brightMode } = useBrightness();
  const bg = brightMode ? applyBrightSat(theme.solid) : theme.solid;
  const overlayOpacity = React.useRef(new Animated.Value(brightMode ? 1 : 0)).current;

  React.useEffect(() => {
    Animated.timing(overlayOpacity, {
      toValue: brightMode ? 1 : 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [brightMode]);

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: bg }}>
      {children}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { backgroundColor: "#FFFFFF", opacity: overlayOpacity.interpolate({ inputRange: [0, 1], outputRange: [0, 0.06] }) },
        ]}
      />
    </GestureHandlerRootView>
  );
}

function PushWrapper({ children }: { children: React.ReactNode }) {
  const { drawerAnim, isOpen } = useDrawer();
  const overlayOpacity = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.6],
  });
  return (
    <Animated.View style={{ flex: 1 }}>
      {children}
      <Animated.View
        pointerEvents={isOpen ? "auto" : "none"}
        style={[StyleSheet.absoluteFill, { backgroundColor: "#000", opacity: overlayOpacity }]}
      />
    </Animated.View>
  );
}

function NavStack() {
  // Navegación desde el menú: las pantallas destino del drawer entran sin slide
  // propio (instantáneo), así el único movimiento es el cierre del drawer y no se
  // alcanza a ver Inicio antes de la página. Desde otros lados, slide normal.
  const { instantNav } = useDrawer();
  const { theme } = useSceneTheme();
  const { brightMode } = useBrightness();
  const bg = brightMode ? applyBrightSat(theme.solid) : theme.solid;
  const drawerScreenAnim = instantNav ? "none" : "slide_from_right";
  return (
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: bg },
        }}
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
          name="descanzo-session/[id]"
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
          options={{ headerShown: false, animation: "slide_from_right" }}
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
          name="historial"
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
        <Stack.Screen name="mi-perfil" options={{ headerShown: false, animation: drawerScreenAnim }} />
        <Stack.Screen name="diario" options={{ headerShown: false, animation: drawerScreenAnim }} />
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
      <MixerPanelProvider>
        <GeometrixPanelProvider>
        <DrawerProvider>
          <ApiAuthBridge />
          <AuthGate />
          <PushBridge />
          <PushWrapper>
            <NavStack />
          </PushWrapper>
          <DrawerMenu />
          <BibliotecaOverlay />
          <DrawerScreenOverlay />
          <ChatOverlay />
          <MixerSheet />
          <EscenasSheet />
          <GlobalSceneModal />
        </DrawerProvider>
        </GeometrixPanelProvider>
      </MixerPanelProvider>
    </SelectedSceneProvider>
  );
}

export default function RootLayout() {
  // Cargar explícitamente las tipografías de íconos junto con Manrope.
  // Sin esto dependen de una carga perezosa que en algunos dispositivos
  // Android falla en silencio y los íconos quedan como cajitas (tofu).
  const [fontsLoaded, fontError] = useFonts({
    Manrope: require("../assets/fonts/Manrope.ttf"),
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

  // Resuelve la Escena persistida ANTES de montar SceneThemeProvider, para
  // que el primer render ya use el tema correcto (evita el flash del tema
  // por defecto cuando el usuario había elegido otra Escena).
  const [initialSceneId, setInitialSceneId] = React.useState<SceneId | null>(null);
  useEffect(() => {
    let cancelled = false;
    loadPersistedSceneId().then((id) => {
      if (!cancelled) setInitialSceneId(id);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const themeReady = initialSceneId !== null;

  useEffect(() => {
    if ((fontsLoaded || fontError) && themeReady) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError, themeReady]);

  useEffect(() => {
    const t = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 800);
    return () => clearTimeout(t);
  }, []);

  // Precarga el audio del logo reveal de Geometrix al arrancar la app (la
  // pestaña se monta perezosa, así que precargarlo allí llegaba tarde). Con
  // segundos de anticipación, el primer play sincroniza con el FadeIn sin delay.
  useEffect(() => {
    preloadGeometrixIntro();
  }, []);

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      tokenCache={tokenCache}
      proxyUrl={proxyUrl}
    >
      <ClerkLoaded>
        <SafeAreaProvider>
          <ErrorBoundary>
            <BrightnessProvider>
            <QueryClientProvider client={queryClient}>
              <SoundsProvider>
              <CatalogProvider>
              <AuthProvider>
                <NotificationsProvider>
                <PremiumProvider>
                <PlayerProvider>
                  <AmbientPlayerProvider>
                    <DescansoPlayerProvider>
                    <MixerProvider>
                    <MilestonesProvider>
                    <StreakCelebrationProvider>
                    <SaveEventProvider>
                    <UserProfileProvider>
                      <ProfileSync />
                      <GreetingVisibleProvider>
                      <IntencionProvider>
                        <FoldersPlaylistsProvider>
                        <VideosProvider>
                        <DiarioFavoritesProvider>
                          <SceneThemeProvider initialSceneId={initialSceneId ?? undefined}>
                          <GeoUniverseProvider>
                          <RachaProvider>
                          <IntencionDiariaProvider>
                            <ThemedGestureRoot>
                              <StatusBar hidden />
                              <KeyboardProvider>
                                <RootLayoutNav />
                              </KeyboardProvider>
                              <SceneThemeTransitionOverlay />
                              <StreakCelebrationFlow />
                            </ThemedGestureRoot>
                          </IntencionDiariaProvider>
                          </RachaProvider>
                          </GeoUniverseProvider>
                          </SceneThemeProvider>
                        </DiarioFavoritesProvider>
                        </VideosProvider>
                        </FoldersPlaylistsProvider>
                      </IntencionProvider>
                      </GreetingVisibleProvider>
                    </UserProfileProvider>
                    </SaveEventProvider>
                    </StreakCelebrationProvider>
                    <MilestoneCelebration />
                    </MilestonesProvider>
                    </MixerProvider>
                    </DescansoPlayerProvider>
                  </AmbientPlayerProvider>
                </PlayerProvider>
                </PremiumProvider>
              </NotificationsProvider>
              </AuthProvider>
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
