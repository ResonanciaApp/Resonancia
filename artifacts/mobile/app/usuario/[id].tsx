import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Image as ExpoImage } from "expo-image";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useProfileAvatarSource } from "@/lib/profile-avatar";
import React from "react";

import {
  useGetPublicUserProfile,
  getGetPublicUserProfileQueryKey,
} from "@workspace/api-client-react";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { CLOUDY_GROWTH_DAY_PILL_BACKGROUND, MEMBERSHIP_AURORA } from "@/constants/colors";
import { growthLevels } from "@/data/growthLevels";
import { useColors } from "@/hooks/useColors";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { SceneThemeBackground } from "@/components/SceneThemeBackground";

const H_PAD = 20;
// Product rule: only Intención is active; never derive the stage from day count.
const CURRENT_STAGE = growthLevels[0];

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function UsuarioScreen() {
  const colors = useColors();
  const { theme } = useSceneTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = Number(id);

  const { data: profile, isLoading, isError } = useGetPublicUserProfile(userId, {
    query: {
      queryKey: getGetPublicUserProfileQueryKey(userId),
      enabled: Number.isInteger(userId) && userId > 0,
      staleTime: 0,
      refetchOnMount: "always",
    },
  });


  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const avatarSource = useProfileAvatarSource(
    profile ?? { avatarPresetId: null, avatarUrl: null },
  );

  const HeaderBar = (
    <View style={[styles.headerRow, { paddingHorizontal: H_PAD, paddingTop: topPad + 8 }]}>
      <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
        <Feather name="chevron-left" size={22} color={colors.foreground} />
      </Pressable>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.root, { backgroundColor: theme.gradient[0] as string }]}>
        <StatusBar hidden />
        <SceneThemeBackground />
        {HeaderBar}
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  if (isError || !profile) {
    return (
      <View style={[styles.root, { backgroundColor: theme.gradient[0] as string }]}>
        <StatusBar hidden />
        <SceneThemeBackground />
        {HeaderBar}
        <View style={styles.centered}>
          <Feather name="user-x" size={40} color={colors.mutedForeground} />
          <Text style={[styles.notFoundTitle, { color: colors.foreground }]}>Perfil no disponible</Text>
          <Text style={[styles.notFoundSub, { color: colors.mutedForeground }]}>
            Este perfil no existe o no se pudo cargar.
          </Text>
        </View>
      </View>
    );
  }

  const totalActiveDays = Math.max(0, Math.floor(profile.totalActiveDays ?? 0));
  const longDescription = profile.longDescription?.trim() || null;

  return (
    <View style={[styles.root, { backgroundColor: theme.gradient[0] as string }]}>
      <StatusBar hidden />
      <SceneThemeBackground />

      {HeaderBar}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
      >
        <View style={styles.profileCard}>
          {/* 1. Avatar */}
          <View style={styles.avatarWrapper}>
            {avatarSource ? (
              <ExpoImage
                source={avatarSource}
                style={styles.avatarImage}
                contentFit="cover"
                placeholder={BLUR_PLACEHOLDER}
                transition={IMAGE_TRANSITION}
              />
            ) : (
              <View style={[styles.avatarImage, styles.avatarFallback, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.initials, { color: colors.primary }]}>
                  {initialsFor(profile.displayName)}
                </Text>
              </View>
            )}
          </View>

          {/* 2. Nombre de usuario */}
          <Text testID="public-profile-name" style={[styles.userName, { color: colors.foreground }]}>
            {profile.displayName}
          </Text>

          {/* 3. Días activos acumulados */}
          <View
            testID="public-profile-accumulated-pill"
            style={[
              styles.daysPill,
              theme.id === "cloudy" && { backgroundColor: CLOUDY_GROWTH_DAY_PILL_BACKGROUND },
            ]}
          >
            <MaterialCommunityIcons
              name="spa"
              size={12}
              color={MEMBERSHIP_AURORA.premium.accent}
              style={styles.lotus}
            />
            <Text style={[styles.daysText, { color: colors.foreground }]}>
              {totalActiveDays} días
            </Text>
          </View>

          {/* 4. Etapa actual */}
          <Text testID="public-profile-stage" style={[styles.stageName, { color: colors.foreground }]}>
            {CURRENT_STAGE.name}
          </Text>

          {/* 5. Descripción larga */}
          {longDescription ? (
            <Text testID="public-profile-long-description" style={[styles.longDesc, { color: colors.foreground }]}>
              {longDescription}
            </Text>
          ) : null}

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
    marginBottom: 4,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 32 },
  notFoundTitle: { fontFamily: "Manrope", fontSize: 18, fontWeight: "700" },
  notFoundSub: { fontFamily: "Manrope", fontSize: 14, textAlign: "center", lineHeight: 21 },

  scroll: { paddingTop: 4, gap: 16 },
  profileCard: { borderRadius: 24, paddingVertical: 24, paddingHorizontal: H_PAD, alignItems: "flex-start", gap: 6 },
  avatarWrapper: { position: "relative", marginBottom: 8 },
  avatarImage: { width: 107, height: 107, borderRadius: 53.5 },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  initials: { fontFamily: "Manrope", fontSize: 40, fontWeight: "700" },
  userName: { fontFamily: "Manrope", fontSize: 20, fontWeight: "700", textAlign: "left" },
  stageName: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700", textAlign: "left" },
  daysPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 6,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(151,128,231,0.20)",
  },
  daysText: { fontFamily: "Manrope", fontSize: 10, fontWeight: "600" },
  lotus: { lineHeight: 12, includeFontPadding: false },
  longDesc: { fontFamily: "Manrope", fontSize: 14, lineHeight: 21, textAlign: "left", marginTop: 20 },
});
