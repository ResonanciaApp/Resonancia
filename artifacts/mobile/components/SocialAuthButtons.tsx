import { useSSO } from "@clerk/expo";
import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { router } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import { ActivityIndicator, Platform, Pressable, StyleSheet, Text, View } from "react-native";

WebBrowser.maybeCompleteAuthSession();

const COLORS = {
  card: "#090E17",
  fg: "#EDE1D3",
  muted: "rgba(200, 193, 181, 0.55)",
  border: "rgba(182, 149, 95, 0.25)",
  error: "#D87856",
};

function useWarmUpBrowser() {
  useEffect(() => {
    if (Platform.OS !== "android") return;
    void WebBrowser.warmUpAsync();
    return () => {
      void WebBrowser.coolDownAsync();
    };
  }, []);
}

interface Props {
  /** Where to send the user after a successful OAuth sign-in. */
  redirectTo?: string;
}

export function SocialAuthButtons({ redirectTo = "/(tabs)" }: Props) {
  useWarmUpBrowser();
  const { startSSOFlow } = useSSO();
  const [busy, setBusy] = useState<"google" | "apple" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(
    async (strategy: "oauth_google" | "oauth_apple", which: "google" | "apple") => {
      setError(null);
      setBusy(which);
      try {
        const { createdSessionId, setActive } = await startSSOFlow({
          strategy,
          redirectUrl: AuthSession.makeRedirectUri({ scheme: "mobile" }),
        });
        if (createdSessionId && setActive) {
          await setActive({
            session: createdSessionId,
            navigate: () => {
              router.replace(redirectTo as never);
            },
          });
        } else {
          setError("No se pudo completar el inicio de sesión.");
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (!/cancel/i.test(msg)) {
          setError(msg);
        }
      } finally {
        setBusy(null);
      }
    },
    [startSSOFlow, redirectTo],
  );

  // Apple sign-in only on iOS / web (Clerk supports it there)
  const showApple = Platform.OS === "ios" || Platform.OS === "web";

  return (
    <View style={styles.wrap}>
      <View style={styles.dividerRow}>
        <View style={styles.dividerLine} />
        <Text style={styles.dividerText}>o continuar con</Text>
        <View style={styles.dividerLine} />
      </View>

      <Pressable
        onPress={() => start("oauth_google", "google")}
        disabled={busy !== null}
        style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }, busy && busy !== "google" && { opacity: 0.5 }]}
      >
        {busy === "google" ? (
          <ActivityIndicator color={COLORS.fg} />
        ) : (
          <>
            <Text style={styles.googleG}>G</Text>
            <Text style={styles.btnText}>Continuar con Google</Text>
          </>
        )}
      </Pressable>

      {showApple && (
        <Pressable
          onPress={() => start("oauth_apple", "apple")}
          disabled={busy !== null}
          style={({ pressed }) => [styles.btn, pressed && { opacity: 0.85 }, busy && busy !== "apple" && { opacity: 0.5 }]}
        >
          {busy === "apple" ? (
            <ActivityIndicator color={COLORS.fg} />
          ) : (
            <>
              <Text style={styles.appleIcon}></Text>
              <Text style={styles.btnText}>Continuar con Apple</Text>
            </>
          )}
        </Pressable>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { width: "100%", marginTop: 20, gap: 10 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 6 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { color: COLORS.muted, fontSize: 12, fontFamily: "Inter_400Regular" },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
  },
  btnText: { color: COLORS.fg, fontFamily: "Inter_600SemiBold", fontSize: 15 },
  googleG: { color: "#EA4335", fontSize: 18, fontFamily: "Inter_700Bold" },
  appleIcon: { color: COLORS.fg, fontSize: 18 },
  errorText: { color: COLORS.error, fontSize: 13, marginTop: 6, textAlign: "center" },
});
