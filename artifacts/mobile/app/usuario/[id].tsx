import { Feather } from "@expo/vector-icons";
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
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";


import {
  useGetPublicUserProfile,
  getGetPublicUserProfileQueryKey,
  useGetMe,
  useGetUserFollowing,
  getGetUserFollowingQueryKey,
  getGetMyFollowCountsQueryKey,
  useFollowUser,
  useUnfollowUser,
} from "@workspace/api-client-react";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { resolveAvatarUrl } from "@/lib/avatar";
import { useColors } from "@/hooks/useColors";

const H_PAD = 20;
const PHOTO_SIZE = 120;

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

export default function UsuarioScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const userId = Number(id);

  const { data: profile, isLoading, isError } = useGetPublicUserProfile(userId, {
    query: {
      queryKey: getGetPublicUserProfileQueryKey(userId),
      enabled: Number.isInteger(userId) && userId > 0,
    },
  });

  const { data: me } = useGetMe();
  const queryClient = useQueryClient();
  const { data: myFollowing } = useGetUserFollowing(me?.id ?? 0, {
    query: { enabled: !!me?.id, queryKey: getGetUserFollowingQueryKey(me?.id ?? 0) },
  });
  const isFollowing = (myFollowing ?? []).some((u) => u.id === userId);
  const isOwnProfile = me?.id === userId;

  const invalidateFollows = () => {
    if (me?.id) {
      queryClient.invalidateQueries({ queryKey: getGetUserFollowingQueryKey(me.id) });
    }
    queryClient.invalidateQueries({ queryKey: getGetMyFollowCountsQueryKey() });
  };

  const followMutation = useFollowUser({
    mutation: { onSuccess: invalidateFollows },
  });
  const unfollowMutation = useUnfollowUser({
    mutation: { onSuccess: invalidateFollows },
  });

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const Header = (
    <View style={[styles.headerRow, { paddingHorizontal: H_PAD, paddingTop: topPad + 8 }]}>
      <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
        <Feather name="arrow-left" size={22} color={colors.foreground} />
      </Pressable>
    </View>
  );

  if (isLoading) {
    return (
      <View style={[styles.root, { backgroundColor: "#090F17" }]}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={["#11161F", "#090F17"]} style={StyleSheet.absoluteFill} />
        {Header}
        <View style={styles.notFound}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  if (isError || !profile) {
    return (
      <View style={[styles.root, { backgroundColor: "#090F17" }]}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={["#11161F", "#090F17"]} style={StyleSheet.absoluteFill} />
        {Header}
        <View style={styles.notFound}>
          <Feather name="user-x" size={40} color={colors.mutedForeground} />
          <Text style={[styles.notFoundTitle, { color: colors.foreground }]}>Perfil no disponible</Text>
          <Text style={[styles.notFoundSub, { color: colors.mutedForeground }]}>
            Este perfil no existe o no se pudo cargar.
          </Text>
        </View>
      </View>
    );
  }

  const avatarUri = resolveAvatarUrl(profile.avatarUrl);
  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("es", { month: "long", year: "numeric" })
    : null;

  const statCards: { label: string; value: string }[] = [
    { label: "Sesiones", value: profile.stats.totalSessions.toString() },
    {
      label: "Minutos",
      value: profile.stats.totalMinutes > 0 ? profile.stats.totalMinutes.toString() : "—",
    },
    { label: "Amigos", value: profile.stats.friendsCount.toString() },
  ];

  return (
    <View style={[styles.root, { backgroundColor: "#090F17" }]}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={["#11161F", "#090F17"]} style={StyleSheet.absoluteFill} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 120 + bottomPad }}
        showsVerticalScrollIndicator={false}
      >
        {Header}

        {/* Profile */}
        <View style={styles.profile}>
          <View style={styles.photoWrap}>
            {avatarUri ? (
              <ExpoImage
                source={{ uri: avatarUri }}
                style={styles.photo}
                contentFit="cover"
                placeholder={BLUR_PLACEHOLDER}
                transition={IMAGE_TRANSITION}
              />
            ) : (
              <View style={[styles.photo, styles.photoFallback, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.initials, { color: colors.primary }]}>
                  {initialsFor(profile.displayName)}
                </Text>
              </View>
            )}
          </View>

          <Text style={[styles.name, { color: colors.foreground }]}>{profile.displayName}</Text>
          <Text style={[styles.handle, { color: colors.mutedForeground }]}>@{profile.username}</Text>

          {memberSince ? (
            <View style={styles.metaItem}>
              <Feather name="calendar" size={12} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                Miembro desde {memberSince}
              </Text>
            </View>
          ) : null}
        </View>

        {/* Stats */}
        <View style={[styles.statsRow, { paddingHorizontal: H_PAD }]}>
          {statCards.map((stat) => (
            <View key={stat.label} style={[styles.statCard, { backgroundColor: "#151A23" }]}>
              <Text style={[styles.statValue, { color: colors.foreground }]}>{stat.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{stat.label}</Text>
            </View>
          ))}
        </View>

        {profile.stats.topCategoryLabel ? (
          <View style={[styles.section, { paddingHorizontal: H_PAD }]}>
            <View style={[styles.topCatCard, { backgroundColor: "#151A23" }]}>
              <Feather name="headphones" size={16} color={colors.accent} />
              <Text style={[styles.topCatLabel, { color: colors.mutedForeground }]}>
                Categoría más escuchada
              </Text>
              <Text style={[styles.topCatValue, { color: colors.foreground }]} numberOfLines={1}>
                {profile.stats.topCategoryLabel}
              </Text>
            </View>
          </View>
        ) : null}

        {/* Actions */}
        <View style={[styles.section, { paddingHorizontal: H_PAD, marginTop: 20, gap: 10 }]}>
          {!isOwnProfile && (
            <Pressable
              onPress={() => {
                if (isFollowing) {
                  unfollowMutation.mutate({ userId });
                } else {
                  followMutation.mutate({ userId });
                }
              }}
              style={({ pressed }) => [
                styles.followBtn,
                {
                  backgroundColor: isFollowing ? "transparent" : "#BE9650",
                  borderColor: "#BE9650",
                  opacity: pressed ? 0.8 : 1,
                },
              ]}
            >
              <Feather
                name={isFollowing ? "user-check" : "user-plus"}
                size={15}
                color={isFollowing ? "#BE9650" : "#090F17"}
              />
              <Text style={[styles.followBtnText, { color: isFollowing ? "#BE9650" : "#090F17" }]}>
                {isFollowing ? "Siguiendo" : "Seguir"}
              </Text>
            </Pressable>
          )}
          <Pressable
            onPress={() => router.push(`/chat/${profile.id}` as never)}
            style={({ pressed }) => [
              styles.messageBtn,
              { backgroundColor: "#151A23", opacity: pressed ? 0.85 : 1 },
            ]}
          >
            <Feather name="message-circle" size={16} color={colors.primary} />
            <Text style={[styles.messageText, { color: colors.primary }]}>
              Enviar mensaje
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginLeft: -8 },

  profile: { alignItems: "center", paddingHorizontal: H_PAD, marginBottom: 18 },
  photoWrap: { width: PHOTO_SIZE, height: PHOTO_SIZE, marginBottom: 14 },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  photoFallback: { alignItems: "center", justifyContent: "center" },
  initials: { fontSize: 38, fontWeight: "700" },
  name: { fontSize: 24, fontWeight: "700", letterSpacing: 0.3 },
  handle: { fontSize: 14, marginTop: 4 },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 12 },
  metaText: { fontSize: 12 },

  statsRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
  statCard: { flex: 1, borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  statValue: { fontSize: 20, fontWeight: "700" },
  statLabel: { fontSize: 12, marginTop: 4 },

  section: {},
  topCatCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
  },
  topCatLabel: { fontSize: 13 },
  topCatValue: { fontSize: 14, fontWeight: "700", flex: 1, textAlign: "right" },

  followBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderRadius: 999,
    borderWidth: 1.5,
    paddingVertical: 13,
  },
  followBtnText: { fontSize: 15, fontWeight: "700" },

  messageBtn: {
    borderRadius: 999,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  messageText: { fontSize: 15, fontWeight: "700" },

  notFound: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 10 },
  notFoundTitle: { fontSize: 18, fontWeight: "700" },
  notFoundSub: { fontSize: 14, textAlign: "center", lineHeight: 21 },
});
