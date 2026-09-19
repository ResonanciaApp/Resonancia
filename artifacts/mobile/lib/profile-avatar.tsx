import { Image } from "expo-image";
import { StyleSheet, Text, View } from "react-native";

import { useCoverPresetCatalog } from "@/lib/cover-preset-catalog";
import {
  resolveProfileAvatarSource,
  type ProfileAvatarRecord,
} from "@/lib/profile-avatar-logic";

export type ProfileAvatarSource = number | { uri: string };

export function useProfileAvatarSource(profile: ProfileAvatarRecord): ProfileAvatarSource | undefined {
  const catalog = useCoverPresetCatalog("profile");
  return resolveProfileAvatarSource(profile, catalog);
}

export function ProfileAvatar({
  profile,
  size = 44,
  fallback,
}: {
  profile: ProfileAvatarRecord;
  size?: number;
  fallback?: string;
}) {
  const source = useProfileAvatarSource(profile);
  return source ? (
    <Image source={source} style={{ width: size, height: size, borderRadius: size / 2 }} contentFit="cover" />
  ) : (
    <View style={[avatarStyles.fallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={avatarStyles.fallbackText}>{fallback?.charAt(0).toUpperCase() ?? "?"}</Text>
    </View>
  );
}

const avatarStyles = StyleSheet.create({
  fallback: { alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.10)" },
  fallbackText: { color: "#F9F9F9", fontWeight: "700" },
});