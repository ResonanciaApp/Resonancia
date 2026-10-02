import React, { useEffect, useMemo, useState } from "react";
import { AppState, Image as NativeImage, View, useWindowDimensions, type LayoutChangeEvent } from "react-native";
import { runOnJS, useAnimatedReaction, useSharedValue, type SharedValue } from "react-native-reanimated";
import { getGetCommunityPresenceQueryKey, useGetCommunityPresence } from "@workspace/api-client-react";

import { useAuth } from "@/context/AuthContext";
import { useCoverPresetCatalog } from "@/lib/cover-preset-catalog";
import { resolveAvatarUrl } from "@/lib/avatar";
import { ConnectedCommunityCard } from "@/components/ConnectedCommunityCard";

export function ConnectedCommunitySection({ scrollY, contentY, focused }: {
  scrollY: SharedValue<number>;
  contentY: SharedValue<number>;
  focused: boolean;
}) {
  const { height } = useWindowDimensions();
  const { isSignedIn, clerkUserId } = useAuth();
  const catalog = useCoverPresetCatalog("profile");
  const top = useSharedValue(-1);
  const sectionHeight = useSharedValue(0);
  const [visible, setVisible] = useState(false);
  const [foreground, setForeground] = useState(AppState.currentState === "active");
  const [now, setNow] = useState(Date.now);
  useAnimatedReaction(
    () => top.value >= 0 && scrollY.value + height > contentY.value + top.value
      && scrollY.value < contentY.value + top.value + sectionHeight.value,
    (next, previous) => { if (next !== previous) runOnJS(setVisible)(next); },
    [height],
  );
  useEffect(() => {
    const listener = AppState.addEventListener("change", (state) => setForeground(state === "active"));
    return () => listener.remove();
  }, []);
  const active = visible && focused && foreground;
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(timer);
  }, [active]);
  const query = useGetCommunityPresence({
    query: {
      queryKey: [...getGetCommunityPresenceQueryKey(), clerkUserId],
      enabled: active && isSignedIn,
      refetchInterval: active ? 15_000 : false,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: false,
      staleTime: 10_000,
      retry: false,
    },
  });
  const data = isSignedIn ? query.data : undefined;
  const avatars = useMemo(() => (data?.avatars ?? []).flatMap((avatar) => {
    let url = avatar.avatarUrl ? resolveAvatarUrl(avatar.avatarUrl) : null;
    if (!url && avatar.avatarPresetId) {
      const preset = catalog.find((p) => p.id === avatar.avatarPresetId || p.key === avatar.avatarPresetId
        || `profile:${p.key}` === avatar.avatarPresetId);
      if (preset) url = NativeImage.resolveAssetSource(preset.source)?.uri ?? null;
    }
    return url ? [{ id: avatar.id, avatarUrl: url }] : [];
  }), [data?.avatars, catalog]);
  const stale = query.isError || (!!data && Math.max(now, Date.now()) - Date.parse(data.updatedAt) > 30_000);
  const measure = (event: LayoutChangeEvent) => {
    top.value = event.nativeEvent.layout.y;
    sectionHeight.value = event.nativeEvent.layout.height;
  };
  return (
    <View onLayout={measure} testID="home-connected-community" style={{ marginTop: 32 }}>
      <ConnectedCommunityCard
        count={data?.count ?? null}
        avatars={avatars}
        active={active}
        stale={stale}
        loading={isSignedIn && !data && !query.isError}
      />
    </View>
  );
}