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
import { router, Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { DiarioFavoritesProvider } from "@/context/DiarioFavoritesContext";
import { PlayerProvider } from "@/context/PlayerContext";

const apiUrl = process.env.EXPO_PUBLIC_API_URL;
if (apiUrl) setBaseUrl(apiUrl);

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

const ONBOARDING_KEY = "cdc_onboarding_done";

function RootLayoutNav() {
  return (
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
    </Stack>
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

  const onboardingChecked = useRef(false);

  useEffect(() => {
    if (!fontsLoaded && !fontError) return;
    if (onboardingChecked.current) return;
    onboardingChecked.current = true;

    SplashScreen.hideAsync();

    AsyncStorage.getItem(ONBOARDING_KEY).then((done) => {
      if (!done) {
        router.replace("/onboarding");
      }
    });
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <PlayerProvider>
            <DiarioFavoritesProvider>
              <GestureHandlerRootView>
                <KeyboardProvider>
                  <RootLayoutNav />
                </KeyboardProvider>
              </GestureHandlerRootView>
            </DiarioFavoritesProvider>
          </PlayerProvider>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
