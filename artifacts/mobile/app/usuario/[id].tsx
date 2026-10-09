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
  useGetUserGrowth, getGetUserGrowthQueryKey,
} from "@workspace/api-client-react";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { MEMBERSHIP_AURORA } from "@/constants/colors";
import { GrowthCurrentStagePill } from "@/components/GrowthJourney";
import { SessionBadgeGlass } from "@/components/SessionDurationBadge";
import { useColors } from "@/hooks/useColors";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { SceneThemeBackground } from "@/components/SceneThemeBackground";

const H_PAD = 16;

export default function UsuarioScreen() {
  const colors = useColors();
  const { theme } = useSceneTheme();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = Number(id);
  const publicGrowth = useGetUserGrowth(String(userId), {
    query: { queryKey: getGetUserGrowthQueryKey(String(userId)), enabled: Number.isInteger(userId) && userId > 0, staleTime: 0 },
  });

  const { data: profile, isLoading, isError } = useGetPublicUserProfile(userId, {
    query: {
      queryKey: getGetPublicUserProfileQueryKey(userId),
      enabled: Number.isInteger(userId) && userId > 0,
      staleTime: 0,
      refetchOnMount: "always",
    },
  });


  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const avatarSource = useProfileAvatarSource(
    profile ?? { avatarPresetId: null, avatarUrl: null },
  );

  const HeaderBar = (
    <View style={[styles.headerRow, { paddingHorizontal: H_PAD + 4, paddingTop: topPad + 8 }]}>
      <Pressable testID="public-profile-back" accessibilityRole="button" accessibilityLabel="Volver" onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
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

  const longDescription = profile.longDescription?.trim() || null;
  const lifeMotto = profile.lifeMotto?.trim() || null;

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
                <Feather name="user" size={28} color={colors.primary} />
              </View>
            )}
            {profile.isPremium === true && (
              <View testID="public-profile-premium-badge" pointerEvents="none" style={styles.avatarPremiumBadge}>
                <SessionBadgeGlass showBlackTint={false} showWhiteTint />
                <MaterialCommunityIcons name="star" size={25} color={MEMBERSHIP_AURORA.premium.accent} />
              </View>
            )}
          </View>

          <View testID="public-profile-identity-details" style={styles.profileDetails}>
            <View style={styles.profileNameRow}>
              <View style={styles.profileNameText}>
                <Text testID="public-profile-name" numberOfLines={1} ellipsizeMode="tail" style={[styles.userName, { color: colors.foreground }]}>
                  {profile.displayName}
                </Text>
              </View>
            </View>

            <GrowthCurrentStagePill stage={publicGrowth.data?.currentStage ?? null} />
            {(lifeMotto || longDescription) && (
              <View style={styles.profileBiography}>
                {lifeMotto && (
                  <Text testID="public-profile-life-motto" style={[styles.profileLifeMotto, { color: colors.foreground }]}>
                    {lifeMotto}
                  </Text>
                )}
                {longDescription && (
                  <Text testID="public-profile-long-description" style={styles.profileDescription}>
                    {longDescription}
                  </Text>
                )}
              </View>
            )}
          </View>
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
    marginBottom: 0,
  },
  backBtn: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    backgroundColor: "rgba(0,0,0,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 32 },
  notFoundTitle: { fontFamily: "Manrope", fontSize: 18, fontWeight: "700" },
  notFoundSub: { fontFamily: "Manrope", fontSize: 14, textAlign: "center", lineHeight: 21 },

  scroll: { paddingTop: 20, paddingHorizontal: H_PAD },
  profileCard: { flexDirection: "column", alignItems: "flex-start", width: "100%", gap: 7, paddingLeft: 3, paddingRight: 0 },
  avatarWrapper: { position: "relative", marginTop: 3, marginBottom: 0, flexShrink: 0 },
  avatarImage: { width: 124, height: 124, borderRadius: 62 },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  avatarPremiumBadge: {
    position: "absolute", right: 0, bottom: 0, zIndex: 1,
    width: 32, height: 32, borderRadius: 16, overflow: "hidden",
    alignItems: "center", justifyContent: "center",
  },
  profileDetails: { width: "100%", minWidth: 0, alignItems: "flex-start", gap: 6, marginTop: 5 },
  profileNameRow: { width: "100%", flexDirection: "row", alignItems: "center" },
  profileNameText: { flex: 1, minWidth: 0 },
  userName: { fontFamily: "Manrope", fontSize: 29, fontWeight: "700", textAlign: "left", marginTop: 0 },
  profileBiography: { width: "100%", alignItems: "flex-start", gap: 6, marginTop: 7 },
  profileLifeMotto: { fontFamily: "Manrope", fontSize: 18, fontWeight: "700", lineHeight: 27, textAlign: "left", alignSelf: "stretch", marginTop: 7 },
  profileDescription: { fontFamily: "Manrope", fontSize: 13, lineHeight: 20, color: "#C4C4C4", textAlign: "left", alignSelf: "stretch" },
});
