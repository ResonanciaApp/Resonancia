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
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setBaseUrl } from "@workspace/api-client-react";
import { router, Stack, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AmbientPlayerProvider, useAmbientPlayer } from "@/context/AmbientPlayerContext";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import { DiarioFavoritesProvider } from "@/context/DiarioFavoritesContext";
import { IntencionProvider } from "@/context/IntencionContext";
import { PlayerProvider } from "@/context/PlayerContext";
import { UserProfileProvider } from "@/context/UserProfileContext";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;
if (apiUrl) setBaseUrl(apiUrl);

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

/** Redirects to onboarding only for new (unregistered) users.
 *  Waits for authLoading to resolve before deciding — prevents false
 *  redirects when isRegistered starts as false before AsyncStorage loads. */
function OnboardingGate() {
  const segments = useSegments();
  const redirected = useRef(false);
  const { isRegistered, authLoading } = useAuth();

  useEffect(() => {
    if (authLoading) return;            // wait until AsyncStorage resolved
    if (redirected.current) return;
    if (isRegistered) return;           // returning user — stay on home tabs
    if (segments[0] === "onboarding") return;
    redirected.current = true;
    router.replace("/onboarding");
  }, [segments, isRegistered, authLoading]);

  return null;
}

/** Starts ambient sound once, as soon as auth resolves and user is registered.
 *  Lives at layout level so it fires regardless of which screen is active. */
function AmbientAutoStart() {
  const { startAmbient } = useAmbientPlayer();
  const { isRegistered, authLoading } = useAuth();
  const started = useRef(false);

  useEffect(() => {
    if (authLoading || !isRegistered) return;
    if (started.current) return;
    started.current = true;
    console.warn("[Ambient] AmbientAutoStart firing startAmbient");
    startAmbient();
  }, [authLoading, isRegistered, startAmbient]);

  return null;
}

function RootLayoutNav() {
  return (
    <>
      <OnboardingGate />
      <AmbientAutoStart />
      <Stack screenOptions={{ headerShown: false }}>
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
          name="nuevas-sesiones"
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
      </Stack>
    </>
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

  // Hide splash when fonts are ready
  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  // Fallback: hide splash after 800ms max — never block the user
  useEffect(() => {
    const t = setTimeout(() => SplashScreen.hideAsync(), 800);
    return () => clearTimeout(t);
  }, []);

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
          <PlayerProvider>
            <AmbientPlayerProvider>
            <UserProfileProvider>
            <IntencionProvider>
              <DiarioFavoritesProvider>
                <GestureHandlerRootView>
                  <KeyboardProvider>
                    <RootLayoutNav />
                  </KeyboardProvider>
                </GestureHandlerRootView>
              </DiarioFavoritesProvider>
            </IntencionProvider>
            </UserProfileProvider>
            </AmbientPlayerProvider>
          </PlayerProvider>
          </AuthProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
