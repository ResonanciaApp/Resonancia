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
import { DiarioFavoritesProvider } from "@/context/DiarioFavoritesContext";
import { IntencionProvider } from "@/context/IntencionContext";
import { PlayerProvider } from "@/context/PlayerContext";
import { UserProfileProvider } from "@/context/UserProfileContext";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;
if (apiUrl) setBaseUrl(apiUrl);

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

/** Always redirects to onboarding once navigation is mounted. */
function OnboardingGate() {
  const segments = useSegments();
  const redirected = useRef(false);

  useEffect(() => {
    if (redirected.current) return;
    if (segments[0] === "onboarding") return;
    const t = setTimeout(() => {
      redirected.current = true;
      router.replace("/onboarding");
    }, 0);
    return () => clearTimeout(t);
  }, [segments]);

  return null;
}

function RootLayoutNav() {
  return (
    <>
      <OnboardingGate />
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
          <PlayerProvider>
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
          </PlayerProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
