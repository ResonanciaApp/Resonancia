import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import {
  PlayfairDisplay_400Regular,
  PlayfairDisplay_700Bold,
} from "@expo-google-fonts/playfair-display";
import { ClerkProvider, ClerkLoaded, useAuth as useClerkAuth } from "@clerk/expo";
import { tokenCache } from "@clerk/expo/token-cache";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setAuthTokenGetter, setBaseUrl } from "@workspace/api-client-react";
import { router, Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { DrawerMenu } from "@/components/DrawerMenu";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AmbientPlayerProvider } from "@/context/AmbientPlayerContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { DiarioFavoritesProvider } from "@/context/DiarioFavoritesContext";
import { DrawerProvider } from "@/context/DrawerContext";
import { IntencionProvider } from "@/context/IntencionContext";
import { PlayerProvider } from "@/context/PlayerContext";
import { PremiumProvider } from "@/context/PremiumContext";
import { UserProfileProvider } from "@/context/UserProfileContext";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;
if (apiUrl) setBaseUrl(apiUrl);

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY!;
const proxyUrl = process.env.EXPO_PUBLIC_CLERK_PROXY_URL || undefined;

SplashScreen.preventAutoHideAsync().catch(() => {});

const queryClient = new QueryClient();

/** Attach Clerk session token to all generated API client requests. */
function ApiAuthBridge() {
  const { getToken } = useClerkAuth();
  useEffect(() => {
    setAuthTokenGetter(() => getToken());
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
    router.replace("/onboarding");
  }, [segments, isRegistered, authLoading]);

  return null;
}

function PushBridge() {
  usePushNotifications();
  return null;
}

function RootLayoutNav() {
  return (
    <DrawerProvider>
      <ApiAuthBridge />
      <AuthGate />
      <PushBridge />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: "#18110C" },
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
          options={{ headerShown: false, presentation: "modal", animation: "slide_from_bottom" }}
        />
        <Stack.Screen
          name="session/[id]"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="category/musica-sonidos"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="category/[id]"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen
          name="medita-tiempo"
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
        <Stack.Screen name="dev-reset" options={{ headerShown: false }} />
        <Stack.Screen
          name="chat/[userId]"
          options={{ headerShown: false, animation: "slide_from_right" }}
        />
        <Stack.Screen name="favorites" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="amigos" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="grupos" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="ayuda" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="invitar" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="configuraciones" options={{ headerShown: false, animation: "slide_from_right" }} />
        <Stack.Screen name="membresia" options={{ headerShown: false, animation: "slide_from_right" }} />
      </Stack>
      <DrawerMenu />
    </DrawerProvider>
  );
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    PlayfairDisplay_400Regular,
    PlayfairDisplay_700Bold,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    const t = setTimeout(() => {
      SplashScreen.hideAsync().catch(() => {});
    }, 800);
    return () => clearTimeout(t);
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
            <QueryClientProvider client={queryClient}>
              <AuthProvider>
                <PremiumProvider>
                <PlayerProvider>
                  <AmbientPlayerProvider>
                    <UserProfileProvider>
                      <IntencionProvider>
                        <DiarioFavoritesProvider>
                          <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#18110C" }}>
                            <KeyboardProvider>
                              <RootLayoutNav />
                            </KeyboardProvider>
                          </GestureHandlerRootView>
                        </DiarioFavoritesProvider>
                      </IntencionProvider>
                    </UserProfileProvider>
                  </AmbientPlayerProvider>
                </PlayerProvider>
                </PremiumProvider>
              </AuthProvider>
            </QueryClientProvider>
          </ErrorBoundary>
        </SafeAreaProvider>
      </ClerkLoaded>
    </ClerkProvider>
  );
}
