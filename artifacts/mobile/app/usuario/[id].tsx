import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Image as ExpoImage } from "expo-image";
import {
  ActivityIndicator,
  Alert,
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
import { useQueryClient } from "@tanstack/react-query";

import {
  useGetPublicUserProfile,
  getGetPublicUserProfileQueryKey,
  useGetMe,
  useGetFriends,
  getGetFriendsQueryKey,
  useSendFriendRequest,
  getGetFriendRequestsQueryKey,
  useSendUserVibration,
} from "@workspace/api-client-react";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { CLOUDY_GROWTH_DAY_PILL_BACKGROUND, MEMBERSHIP_AURORA } from "@/constants/colors";
import { growthLevels } from "@/data/growthLevels";
import { useColors } from "@/hooks/useColors";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { SceneThemeBackground } from "@/components/SceneThemeBackground";
import { isIndigo2ThemeId } from "@/config/scene-themes";

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
  const actionThemeStyle = isIndigo2ThemeId(theme.id)
    ? { backgroundColor: "rgba(0,0,0,0.16)" }
    : theme.id === "cloudy"
      ? { backgroundColor: "rgba(0,0,0,0.19)" }
      : undefined;
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = Number(id);
  const queryClient = useQueryClient();

  const { data: profile, isLoading, isError } = useGetPublicUserProfile(userId, {
    query: {
      queryKey: getGetPublicUserProfileQueryKey(userId),
      enabled: Number.isInteger(userId) && userId > 0,
      staleTime: 0,
      refetchOnMount: "always",
    },
  });

  const { data: me } = useGetMe();
  const { data: friendsList } = useGetFriends({
    query: { queryKey: getGetFriendsQueryKey(), enabled: !!me?.id },
  });
  const isFriend = profile?.friendshipStatus === "accepted" || (friendsList ?? []).some((f) => f.id === userId);
  const isOwnProfile = me?.id === userId;
  const refreshFriendship = () => Promise.all([
    queryClient.invalidateQueries({ queryKey: getGetFriendsQueryKey() }),
    queryClient.invalidateQueries({ queryKey: getGetFriendRequestsQueryKey() }),
    queryClient.invalidateQueries({ queryKey: getGetPublicUserProfileQueryKey(userId) }),
  ]);
  const addFriend = useSendFriendRequest({
    mutation: {
      onSuccess: refreshFriendship,
      onError: (error) => {
        void refreshFriendship();
        const status = (error as { status?: number }).status;
        Alert.alert("Amistad", status === 409
          ? "Ya existe una amistad o una solicitud con este usuario."
          : "No se pudo enviar la solicitud. Inténtalo nuevamente.");
      },
    },
  });
  const vibration = useSendUserVibration({
    mutation: {
      onError: () => Alert.alert("Vibración", "No se pudo enviar la vibración. Inténtalo nuevamente."),
    },
  });
  const pendingOutgoing = profile?.friendshipStatus === "pending_outgoing";

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const avatarSource = useProfileAvatarSource(
    profile ?? { avatarPresetId: null, avatarUrl: null },
  );

  const HeaderBar = (
    <View style={[styles.headerRow, { paddingHorizontal: H_PAD, paddingTop: topPad + 8 }]}>
      <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
        <Feather name="arrow-left" size={22} color={colors.foreground} />
      </Pressable>
      <Text style={[styles.headerTitle, { color: colors.foreground }]}>Perfil</Text>
      <View style={{ width: 38 }} />
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

          {!isOwnProfile && profile.friendshipStatus !== "self" && (
            <View style={styles.actionsSection}>
              <View style={styles.actionsRow}>
                <Pressable
                  testID="public-profile-add-friend"
                  accessibilityRole="button"
                  disabled={isFriend || pendingOutgoing || addFriend.isPending}
                  onPress={() => addFriend.mutate({ data: { addresseeId: userId } })}
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.actionSurface,
                    actionThemeStyle,
                    { opacity: isFriend || pendingOutgoing || addFriend.isPending ? 0.6 : pressed ? 0.75 : 1 },
                  ]}
                >
                  <Feather name={isFriend ? "user-check" : "user-plus"} size={14} color={colors.foreground} />
                  <Text style={[styles.actionText, { color: colors.foreground }]}>
                    {addFriend.isPending ? "Enviando…" : isFriend ? "Amigos" : pendingOutgoing ? "Solicitud enviada"
                      : profile.friendshipStatus === "pending_incoming" ? "Aceptar amistad" : "Agregar a amigos"}
                  </Text>
                </Pressable>
                <Pressable
                  testID="public-profile-vibration"
                  accessibilityRole="button"
                  disabled={vibration.isPending}
                  onPress={() => vibration.mutate({ userId })}
                  style={({ pressed }) => [
                    styles.actionButton,
                    styles.actionSurface,
                    actionThemeStyle,
                    { opacity: vibration.isPending ? 0.6 : pressed ? 0.75 : 1 },
                  ]}
                >
                  <Feather name="radio" size={14} color={colors.foreground} />
                  <Text style={[styles.actionText, { color: colors.foreground }]}>
                    {vibration.isPending ? "Enviando…" : "Vibración"}
                  </Text>
                </Pressable>
              </View>
              {vibration.isSuccess && vibration.variables?.userId === userId && (
                <Text accessibilityLiveRegion="polite" style={[styles.feedback, { color: colors.foreground }]}>
                  Vibración enviada
                </Text>
              )}
            </View>
          )}

          {/* Mensaje solo para amigos existentes */}
          {!isOwnProfile && isFriend && (
            <Pressable
              testID="public-profile-message"
              onPress={() => router.push(`/chat/${profile.id}` as never)}
              style={({ pressed }) => [
                styles.messagePill,
                styles.actionSurface,
                actionThemeStyle,
                { opacity: pressed ? 0.75 : 1 },
              ]}
            >
              <Feather name="message-circle" size={13} color="#FFFFFF" />
              <Text style={styles.messagePillText}>Enviar mensaje</Text>
            </Pressable>
          )}
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
    justifyContent: "space-between",
    marginBottom: 4,
  },
  headerTitle: { fontFamily: "Manrope", fontSize: 17, fontWeight: "700" },
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
  profileCard: { borderRadius: 24, padding: 24, alignItems: "center", gap: 6 },
  avatarWrapper: { position: "relative", marginBottom: 8 },
  avatarImage: { width: 117, height: 117, borderRadius: 58.5 },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  initials: { fontFamily: "Manrope", fontSize: 40, fontWeight: "700" },
  userName: { fontFamily: "Manrope", fontSize: 20, fontWeight: "700", textAlign: "center" },
  stageName: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700", textAlign: "center" },
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
  longDesc: { fontFamily: "Manrope", fontSize: 14, lineHeight: 21, textAlign: "center", marginTop: 12, paddingHorizontal: 4 },
  actionsSection: { alignSelf: "stretch", gap: 8, marginTop: 18 },
  actionsRow: { flexDirection: "row", gap: 8 },
  actionSurface: {
    height: 40,
    minHeight: 40,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderRadius: 20,
  },
  actionText: { fontFamily: "Manrope", fontSize: 12, fontWeight: "600", flexShrink: 1, textAlign: "center" },
  feedback: { fontFamily: "Manrope", fontSize: 12, textAlign: "center" },
  messagePill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    alignSelf: "stretch",
    marginTop: 18,
    borderRadius: 20,
  },
  messagePillText: { fontFamily: "Manrope", fontSize: 13, color: "#FFFFFF", letterSpacing: 0.1 },
});
