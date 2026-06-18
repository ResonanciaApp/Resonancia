import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Image as ExpoImage } from "expo-image";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { GoldGradientFill } from "@/components/GoldGradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";
import React from "react";

import {
  useGetPublicUserProfile,
  getGetPublicUserProfileQueryKey,
  useGetMe,
  useGetUserFollowing,
  getGetUserFollowingQueryKey,
  getGetMyFollowCountsQueryKey,
  useFollowUser,
  useUnfollowUser,
  useSendFriendRequest,
  getGetFriendRequestsQueryKey,
  useGetFriends,
  getGetFriendsQueryKey,
  useRemoveFriend,
  useGetExpansorProfile,
  getGetExpansorProfileQueryKey,
} from "@workspace/api-client-react";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { resolveAvatarUrl } from "@/lib/avatar";
import { useColors } from "@/hooks/useColors";

const H_PAD = 20;
const BG_GRADIENT = ["#2E0510", "#160108"] as const;

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

  const [friendRequested, setFriendRequested] = React.useState(false);

  const { data: profile, isLoading, isError } = useGetPublicUserProfile(userId, {
    query: {
      queryKey: getGetPublicUserProfileQueryKey(userId),
      enabled: Number.isInteger(userId) && userId > 0,
    },
  });

  const { data: me } = useGetMe();
  const queryClient = useQueryClient();

  const { data: friendsList } = useGetFriends({
    query: { queryKey: getGetFriendsQueryKey(), enabled: !!me?.id },
  });
  const isFriend = (friendsList ?? []).some((f) => f.id === userId);

  const { data: myFollowing } = useGetUserFollowing(me?.id ?? 0, {
    query: { enabled: !!me?.id, queryKey: getGetUserFollowingQueryKey(me?.id ?? 0) },
  });
  const isFollowing = (myFollowing ?? []).some((u) => u.id === userId);
  const isOwnProfile = me?.id === userId;

  const invalidateFollows = () => {
    if (me?.id) queryClient.invalidateQueries({ queryKey: getGetUserFollowingQueryKey(me.id) });
    queryClient.invalidateQueries({ queryKey: getGetMyFollowCountsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetPublicUserProfileQueryKey(userId) });
  };

  const followMutation = useFollowUser({ mutation: { onSuccess: invalidateFollows } });
  const unfollowMutation = useUnfollowUser({ mutation: { onSuccess: invalidateFollows } });

  const removeFriendMutation = useRemoveFriend({
    mutation: {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetFriendsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPublicUserProfileQueryKey(userId) });
      },
    },
  });

  const sendFriendRequest = useSendFriendRequest({
    mutation: {
      onSuccess: () => {
        setFriendRequested(true);
        queryClient.invalidateQueries({ queryKey: getGetFriendRequestsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetFriendsQueryKey() });
        queryClient.invalidateQueries({ queryKey: getGetPublicUserProfileQueryKey(userId) });
        Alert.alert("¡Listo!", "Solicitud de amistad enviada.");
      },
      onError: (error) => {
        const status = (error as { status?: number })?.status;
        if (status === 409) {
          // Ya existe una relación — refrescamos y actualizamos el estado local
          queryClient.invalidateQueries({ queryKey: getGetFriendsQueryKey() });
          queryClient.invalidateQueries({ queryKey: getGetPublicUserProfileQueryKey(userId) });
          setFriendRequested(true);
        } else {
          Alert.alert("Error", "No se pudo enviar la solicitud.");
        }
      },
    },
  });

  const isExpansor = profile?.role === "expansor";

  const { data: expansorProfile } = useGetExpansorProfile(userId, {
    query: {
      queryKey: getGetExpansorProfileQueryKey(userId),
      enabled: isExpansor && Number.isInteger(userId) && userId > 0,
      retry: false,
    },
  });

  const [epDescExpanded, setEpDescExpanded] = React.useState(false);
  const [epDescOverflows, setEpDescOverflows] = React.useState(false);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

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
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} />
        {HeaderBar}
        <View style={styles.centered}>
          <ActivityIndicator color={colors.primary} />
        </View>
      </View>
    );
  }

  if (isError || !profile) {
    return (
      <View style={styles.root}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} />
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

  const avatarUri = resolveAvatarUrl(profile.avatarUrl);
  const memberSince = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("es", { month: "long", year: "numeric" })
    : null;

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={BG_GRADIENT} style={StyleSheet.absoluteFill} />

      {HeaderBar}

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: bottomPad + 40 }]}
      >
        {/* ── Profile Card — mismo layout que profile.tsx ── */}
        <View style={styles.profileCard}>

          {/* Avatar */}
          <View style={styles.avatarWrapper}>
            {avatarUri ? (
              <ExpoImage
                source={{ uri: avatarUri }}
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

          {/* Nombre */}
          <Text style={[styles.userName, { color: colors.foreground }]}>{profile.displayName}</Text>

          {/* País / ubicación */}
          {profile.location ? (
            <View style={styles.metaRow}>
              <Feather name="map-pin" size={12} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>{profile.location}</Text>
            </View>
          ) : null}

          {/* Handle */}
          <Text style={[styles.handle, { color: colors.mutedForeground }]}>@{profile.username}</Text>

          {/* Miembro desde */}
          {memberSince ? (
            <View style={styles.metaRow}>
              <Feather name="calendar" size={12} color={colors.mutedForeground} />
              <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                Miembro desde {memberSince}
              </Text>
            </View>
          ) : null}

          {/* Seguidores / Siguiendo */}
          <View style={styles.followCountsRow}>
            <View style={styles.followCountItem}>
              <Text style={[styles.followCountNum, { color: colors.foreground }]}>
                {profile.stats.followersCount ?? 0}
              </Text>
              <Text style={[styles.followCountLabel, { color: colors.mutedForeground }]}>seguidores</Text>
            </View>
            <View style={[styles.followCountDivider, { backgroundColor: colors.border ?? "#3D0E16" }]} />
            <View style={styles.followCountItem}>
              <Text style={[styles.followCountNum, { color: colors.foreground }]}>
                {profile.stats.followingCount ?? 0}
              </Text>
              <Text style={[styles.followCountLabel, { color: colors.mutedForeground }]}>siguiendo</Text>
            </View>
          </View>

          {/* ── Pills de acción (solo para perfiles ajenos) ── */}
          {!isOwnProfile && (
            <View style={styles.actionPillsWrap}>
              {/* Fila 1: Seguir + Amistad */}
              <View style={styles.actionPillsRow}>
                {/* Seguir */}
                <Pressable
                  onPress={() => {
                    if (isFollowing) unfollowMutation.mutate({ userId });
                    else followMutation.mutate({ userId });
                  }}
                  style={({ pressed }) => [
                    styles.actionPill,
                    isFollowing && styles.actionPillActive,
                    { opacity: pressed ? 0.75 : 1, flex: 1, justifyContent: "center" },
                  ]}
                >
                  {isFollowing && (
                    <LinearGradient
                      colors={["#D6AD5F", "#B47344"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  <Feather
                    name={isFollowing ? "user-check" : "user-plus"}
                    size={13}
                    color={isFollowing ? "#1B060F" : "#FFFFFF"}
                  />
                  <Text style={[styles.actionPillText, isFollowing && styles.actionPillTextActive]}>
                    {isFollowing ? "Siguiendo" : "Seguir"}
                  </Text>
                </Pressable>

                {/* Amistad */}
                <Pressable
                  onPress={() => {
                    if (isFriend) {
                      Alert.alert(
                        "Eliminar amigo",
                        `¿Querés eliminar a ${profile.displayName} de tus amigos?`,
                        [
                          { text: "Cancelar", style: "cancel" },
                          {
                            text: "Eliminar",
                            style: "destructive",
                            onPress: () => removeFriendMutation.mutate({ userId }),
                          },
                        ]
                      );
                    } else if (friendRequested) {
                      Alert.alert("Solicitud enviada", "Ya enviaste una solicitud de amistad.");
                    } else {
                      sendFriendRequest.mutate({ data: { addresseeId: userId } });
                    }
                  }}
                  style={({ pressed }) => [
                    styles.actionPill,
                    isFriend && styles.actionPillActive,
                    !isFriend && friendRequested && styles.actionPillSent,
                    { opacity: pressed ? 0.75 : 1, flex: 1, justifyContent: "center" },
                  ]}
                >
                  {isFriend && (
                    <LinearGradient
                      colors={["#D6AD5F", "#B47344"]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={StyleSheet.absoluteFill}
                    />
                  )}
                  <Feather
                    name={isFriend ? "user-check" : friendRequested ? "user-x" : "users"}
                    size={13}
                    color={isFriend ? "#1B060F" : friendRequested ? "rgba(242,231,228,0.55)" : "#FFFFFF"}
                  />
                  <Text style={[
                    styles.actionPillText,
                    isFriend && styles.actionPillTextActive,
                    !isFriend && friendRequested && styles.actionPillTextSent,
                  ]}>
                    {isFriend ? "Amigos" : friendRequested ? "Solicitado" : "Amistad"}
                  </Text>
                </Pressable>
              </View>

              {/* Fila 2: Enviar mensaje — solo si son amigos */}
              {isFriend && (
                <Pressable
                  onPress={() => router.push(`/chat/${profile.id}` as never)}
                  style={({ pressed }) => [
                    styles.actionPill,
                    styles.actionPillFull,
                    { opacity: pressed ? 0.75 : 1 },
                  ]}
                >
                  <Feather name="message-circle" size={13} color="#FFFFFF" />
                  <Text style={styles.actionPillText}>Enviar mensaje</Text>
                </Pressable>
              )}
            </View>
          )}
        </View>

        {/* ── Stats card (categoría más escuchada) ── */}
        {profile.stats.topCategoryLabel ? (
          <View style={[styles.topCatCard, { marginHorizontal: H_PAD, backgroundColor: "rgba(74,12,12,0.08)" }]}>
            <Feather name="headphones" size={16} color={colors.accent} />
            <Text style={[styles.topCatLabel, { color: colors.mutedForeground }]}>
              Categoría más escuchada
            </Text>
            <Text style={[styles.topCatValue, { color: colors.foreground }]} numberOfLines={1}>
              {profile.stats.topCategoryLabel}
            </Text>
          </View>
        ) : null}

        {/* ── Sección Expansor (solo si tiene contenido) ── */}
        {isExpansor && expansorProfile && (
          !!(expansorProfile.specialties?.length || expansorProfile.description || expansorProfile.phone || expansorProfile.email || expansorProfile.instagram || expansorProfile.quote)
        ) && (
          <View style={[styles.expansorSection, { marginHorizontal: H_PAD }]}>

            {/* Especialidades */}
            {(expansorProfile?.specialties ?? []).length > 0 && (
              <View style={{ gap: 8 }}>
                <Text style={[styles.epSectionTitle, { color: colors.foreground }]}>Se especializa en</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingRight: 4 }}>
                  {(expansorProfile?.specialties ?? []).map((s) => (
                    <View key={s} style={[styles.epChip, { borderColor: "rgba(212,175,55,0.30)", backgroundColor: "rgba(212,175,55,0.07)" }]}>
                      <Text style={[styles.epChipText, { color: "#D4AF37" }]}>{s}</Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* Descripción */}
            {expansorProfile?.description ? (
              <View style={{ gap: 6 }}>
                <Text style={[styles.epSectionTitle, { color: colors.foreground }]}>Servicios</Text>
                <Text
                  style={[styles.epDesc, { color: colors.mutedForeground }]}
                  numberOfLines={epDescExpanded ? undefined : 5}
                  onTextLayout={(e) => { if (!epDescOverflows && e.nativeEvent.lines.length > 5) setEpDescOverflows(true); }}
                >
                  {expansorProfile.description}
                </Text>
                {epDescOverflows && (
                  <Pressable onPress={() => setEpDescExpanded((v) => !v)} style={({ pressed }) => [styles.epReadMore, { opacity: pressed ? 0.7 : 1 }]}>
                    <Text style={{ fontSize: 13, color: "#D4AF37", fontWeight: "600" }}>{epDescExpanded ? "Leer menos" : "Leer más"}</Text>
                    <Feather name={epDescExpanded ? "chevron-up" : "chevron-down"} size={13} color="#D4AF37" />
                  </Pressable>
                )}
              </View>
            ) : null}

            {/* Contacto */}
            {(expansorProfile?.phone || expansorProfile?.email || expansorProfile?.instagram) && (
              <View style={{ gap: 8 }}>
                <Text style={[styles.epSectionTitle, { color: colors.foreground }]}>Contacto</Text>
                <View style={styles.epContactRow}>
                  {expansorProfile.phone ? (
                    <Pressable onPress={() => Linking.openURL(`tel:${expansorProfile.phone}`)} style={({ pressed }) => [styles.epContactPill, { opacity: pressed ? 0.75 : 1, flex: 1, justifyContent: "center" }]}>
                      <Feather name="phone" size={13} color="#FFFFFF" />
                      <Text style={styles.epContactPillText}>Teléfono</Text>
                    </Pressable>
                  ) : null}
                  {expansorProfile.email ? (
                    <Pressable onPress={() => Linking.openURL(`mailto:${expansorProfile.email}`)} style={({ pressed }) => [styles.epContactPill, { opacity: pressed ? 0.75 : 1, flex: 1, justifyContent: "center" }]}>
                      <Feather name="mail" size={13} color="#FFFFFF" />
                      <Text style={styles.epContactPillText}>Email</Text>
                    </Pressable>
                  ) : null}
                  {expansorProfile.instagram ? (
                    <Pressable onPress={() => Linking.openURL(expansorProfile.instagram!)} style={({ pressed }) => [styles.epContactPill, { opacity: pressed ? 0.75 : 1, flex: 1, justifyContent: "center" }]}>
                      <Feather name="instagram" size={13} color="#FFFFFF" />
                      <Text style={styles.epContactPillText}>Instagram</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            )}

            {/* Quote */}
            {expansorProfile?.quote ? (
              <View style={styles.epQuoteWrap}>
                <Text style={[styles.epQuoteText, { color: colors.mutedForeground }]}>"{expansorProfile.quote}"</Text>
              </View>
            ) : null}

          </View>
        )}
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
  headerTitle: { fontSize: 17, fontWeight: "700" },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(244,218,213,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  centered: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, paddingHorizontal: 32 },
  notFoundTitle: { fontSize: 18, fontWeight: "700" },
  notFoundSub: { fontSize: 14, textAlign: "center", lineHeight: 21 },

  scroll: { paddingTop: 4, gap: 16 },

  /* ── Profile card — sin fondo, igual que profile.tsx ── */
  profileCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    gap: 6,
  },
  avatarWrapper: { position: "relative", marginBottom: 8 },
  avatarImage: { width: 80, height: 80, borderRadius: 40 },
  avatarFallback: { alignItems: "center", justifyContent: "center" },
  initials: { fontSize: 28, fontWeight: "700" },
  userName: { fontSize: 20, fontWeight: "700", textAlign: "center" },
  handle: { fontSize: 13 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12 },

  /* — Seguidores/stats row — */
  followCountsRow: { flexDirection: "row", alignItems: "center", marginTop: 14, marginBottom: 4 },
  followCountItem: { alignItems: "center", paddingHorizontal: 16 },
  followCountNum: { fontSize: 18, fontWeight: "700" },
  followCountLabel: { fontSize: 11, marginTop: 1 },
  followCountDivider: { width: 1, height: 28 },

  /* — Pills de acción — */
  actionPillsWrap: {
    alignSelf: "stretch",
    gap: 8,
    marginTop: 14,
  },
  actionPillsRow: {
    flexDirection: "row",
    gap: 8,
  },
  actionPillFull: {
    alignSelf: "stretch",
    justifyContent: "center",
  },
  actionPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 34,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  actionPillActive: { backgroundColor: "transparent" },
  actionPillSent: { backgroundColor: "rgba(255,255,255,0.04)" },
  actionPillText: {
    fontSize: 13,
    fontWeight: "400",
    color: "#FFFFFF",
    letterSpacing: 0.1,
  },
  actionPillTextActive: { color: "#1B060F", fontWeight: "600" },
  actionPillTextSent: { color: "rgba(242,231,228,0.45)" },

  /* ── Categoría más escuchada ── */
  topCatCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 14,
    padding: 14,
  },
  topCatLabel: { fontSize: 13, flex: 1 },
  topCatValue: { fontSize: 14, fontWeight: "700" },

  /* ── Badge expansor ── */
  expansorBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.35)",
    overflow: "hidden",
  },
  expansorBadgeStar: { fontSize: 10, color: "#D4AF37" },
  expansorBadgeText: { fontSize: 10, fontWeight: "700", letterSpacing: 1.2 },

  /* ── Sección expansor ── */
  expansorSection: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.15)",
    backgroundColor: "rgba(74,12,12,0.08)",
    padding: 16,
    gap: 16,
  },
  epSectionTitle: { fontSize: 13, fontWeight: "700", letterSpacing: 0.3 },
  epChip: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  epChipText: { fontSize: 12, fontWeight: "600" },
  epDesc: { fontSize: 14, lineHeight: 21 },
  epReadMore: { flexDirection: "row", alignItems: "center", gap: 4 },
  epContactRow: { flexDirection: "row", gap: 8 },
  epContactPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 14,
    height: 34,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  epContactPillText: { fontSize: 13, color: "#FFFFFF" },
  epQuoteWrap: { paddingTop: 4 },
  epQuoteText: { fontSize: 13, fontStyle: "italic", lineHeight: 20, textAlign: "center" },
});
