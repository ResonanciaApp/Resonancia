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
  PlayfairDisplay_900Black,
} from "@expo-google-fonts/playfair-display";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { setBaseUrl } from "@workspace/api-client-react";
import { router, Stack, useRootNavigationState, useSegments } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DiarioFavoritesProvider } from "@/context/DiarioFavoritesContext";
import { IntencionProvider } from "@/context/IntencionContext";
import { PlayerProvider } from "@/context/PlayerContext";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;
if (apiUrl) setBaseUrl(apiUrl);

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();
const ONBOARDING_KEY = "cdc_onboarding_done";

/** Handles first-launch redirect once navigation is mounted and ready. */
function OnboardingGate() {
  const rootNavState = useRootNavigationState();
  const segments = useSegments();
  const [onboardingDone, setOnboardingDone] = useState<boolean | null>(null);
  const redirected = useRef(false);

  // Check AsyncStorage once
  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY).then((val) => {
      setOnboardingDone(val === "true");
    });
  }, []);

  // Redirect only after both navigation is ready AND we know the onboarding status
  useEffect(() => {
    if (!rootNavState?.key) return;       // navigator not mounted yet
    if (onboardingDone === null) return;  // still loading from AsyncStorage
    if (redirected.current) return;       // already redirected this session

    const inOnboarding = segments[0] === "onboarding";

    if (!onboardingDone && !inOnboarding) {
      redirected.current = true;
      router.replace("/onboarding");
    }
  }, [rootNavState?.key, onboardingDone, segments]);

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
    PlayfairDisplay_900Black,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <PlayerProvider>
            <IntencionProvider>
              <DiarioFavoritesProvider>
                <GestureHandlerRootView>
                  <KeyboardProvider>
                    <RootLayoutNav />
                  </KeyboardProvider>
                </GestureHandlerRootView>
              </DiarioFavoritesProvider>
            </IntencionProvider>
          </PlayerProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
