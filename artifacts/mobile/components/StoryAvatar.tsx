import React, { useEffect, useState } from "react";
import { Image } from "expo-image";
import { View, StyleSheet } from "react-native";
import { useAuth } from "@clerk/expo";
import type { ProfileAvatarSource } from "@/lib/profile-avatar";

export function StoryAvatar({ source, scale, onReady, onFailure }: {
  source?: ProfileAvatarSource;
  scale: number;
  onReady?: () => void;
  onFailure?: () => void;
}) {
  const { getToken, userId } = useAuth();
  const [credentials, setCredentials] = useState<{ userId: string; token: string }>();
  const uri = typeof source === "object" ? source.uri : "";
  const base = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
  // Never attach the session token to an external avatar URL.
  const protectedUri = /^\/(?:api\/storage\/)?objects\//.test(uri)
    || Boolean(base && uri.startsWith(`${base}/api/storage/objects/`));
  useEffect(() => {
    if (!protectedUri || !userId) return;
    let cancelled = false;
    getToken().then(token => {
      if (cancelled) return;
      if (token) setCredentials({ userId, token });
      else onFailure?.();
    }).catch(() => { if (!cancelled) onFailure?.(); });
    return () => { cancelled = true; };
  }, [getToken, userId, protectedUri, uri]);
  if (!source) return null;
  if (protectedUri && credentials?.userId !== userId) return null;
  const imageSource = protectedUri && typeof source === "object" && credentials
    ? { ...source, headers: { Authorization: `Bearer ${credentials.token}` } } : source;
  return (
    <View style={{ width: 124 * scale, height: 124 * scale, borderRadius: 62 * scale,
      flexShrink: 0, overflow: "hidden" }}>
    <Image
      key={JSON.stringify(source)}
      testID="reflection-story-avatar"
      source={imageSource}
      contentFit="cover"
      onLoad={onReady}
      onError={onFailure}
      style={StyleSheet.absoluteFillObject}
    />
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, {
      backgroundColor: "rgba(0,0,0,0.2)", borderWidth: 1, borderColor: "rgba(255,255,255,0.4)",
      borderRadius: 62 * scale,
    }]} />
    </View>
  );
}
