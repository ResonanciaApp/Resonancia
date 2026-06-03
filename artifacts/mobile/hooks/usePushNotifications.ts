import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth as useClerkAuth } from "@clerk/expo";
import {
  registerPushToken,
  unregisterPushToken,
} from "@workspace/api-client-react";

const PUSH_TOKEN_KEY = "@resonancia_push_token";

/**
 * Foreground display config — show banner + play sound when a push
 * arrives while the user has the app open. Skipped on web (not supported).
 */
if (Platform.OS !== "web") {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") return;
  await Notifications.setNotificationChannelAsync("default", {
    name: "RESONANCIA",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: "#BE9650",
  });
}

async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === "web") return null;
  try {
    const settings = (await Notifications.getPermissionsAsync()) as {
      granted?: boolean;
      status?: string;
    };
    let granted = settings.granted || settings.status === "granted";
    if (!granted) {
      const req = (await Notifications.requestPermissionsAsync()) as {
        granted?: boolean;
        status?: string;
      };
      granted = Boolean(req.granted) || req.status === "granted";
    }
    if (!granted) return null;
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    const token = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined,
    );
    return token.data;
  } catch {
    return null;
  }
}

function routeForPush(data: Record<string, unknown> | undefined) {
  if (!data) return;
  const kind = typeof data.kind === "string" ? data.kind : null;
  const fromUserId =
    typeof data.fromUserId === "number" ? data.fromUserId : null;
  if (kind === "dm" && fromUserId != null) {
    router.push(`/chat/${fromUserId}`);
  } else if (kind === "friend_request" || kind === "friend_accepted") {
    router.push("/amigos");
  }
}

/**
 * Mount once near the auth root. When the Clerk session is active:
 *  - registers an Expo push token with our backend
 *  - listens for notification taps and routes accordingly
 *  - unregisters the token when the user signs out
 */
export function usePushNotifications() {
  const { isSignedIn, isLoaded } = useClerkAuth();
  const registeredTokenRef = useRef<string | null>(null);

  // Hydrate the last registered token from disk so sign-out after a fresh
  // app start still unregisters it on the server.
  useEffect(() => {
    if (Platform.OS === "web") return;
    AsyncStorage.getItem(PUSH_TOKEN_KEY)
      .then((stored) => {
        if (stored) registeredTokenRef.current = stored;
      })
      .catch(() => {});
  }, []);

  // Register / unregister token on auth changes.
  useEffect(() => {
    if (!isLoaded) return;
    if (Platform.OS === "web") return;

    let cancelled = false;

    if (isSignedIn) {
      (async () => {
        await ensureAndroidChannel();
        const token = await getExpoPushToken();
        if (cancelled || !token) return;
        try {
          await registerPushToken({
            token,
            platform: Platform.OS === "ios" ? "ios" : "android",
          });
          registeredTokenRef.current = token;
          await AsyncStorage.setItem(PUSH_TOKEN_KEY, token).catch(() => {});
        } catch {
          // Network/auth error — silently skip; we'll retry next mount.
        }
      })();
    } else if (registeredTokenRef.current) {
      const token = registeredTokenRef.current;
      registeredTokenRef.current = null;
      AsyncStorage.removeItem(PUSH_TOKEN_KEY).catch(() => {});
      unregisterPushToken({ token }).catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, isLoaded]);

  // Tap handler — runs whether app is foregrounded, backgrounded, or killed.
  useEffect(() => {
    if (Platform.OS === "web") return;
    const sub = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as
          | Record<string, unknown>
          | undefined;
        routeForPush(data);
      },
    );

    // Cold-start tap: app was killed and opened by a notification.
    Notifications.getLastNotificationResponseAsync()
      .then((response) => {
        if (!response) return;
        const data = response.notification.request.content.data as
          | Record<string, unknown>
          | undefined;
        routeForPush(data);
      })
      .catch(() => {});

    return () => sub.remove();
  }, []);
}
