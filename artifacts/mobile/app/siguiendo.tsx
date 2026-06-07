import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router, useLocalSearchParams } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import React from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  useGetUserFollowing,
  getGetUserFollowingQueryKey,
  useGetMe,
  useFollowUser,
  useUnfollowUser,
} from "@workspace/api-client-react";
import { useColors } from "@/hooks/useColors";
import { SacredBackground } from "@/components/SacredBackground";

const BG_GRADIENT = ["#090D20", "#080A18", "#06070F"] as const;

export default function SiguiendoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { userId } = useLocalSearchParams<{ userId?: string }>();

  const { data: me } = useGetMe();
  const targetId = userId ? Number(userId) : me?.id;

  const { data: following, isLoading } = useGetUserFollowing(targetId ?? 0, {
    query: { enabled: !!targetId, queryKey: getGetUserFollowingQueryKey(targetId ?? 0) },
  });

  const { data: myFollowing } = useGetUserFollowing(me?.id ?? 0, {
    query: { enabled: !!me?.id, queryKey: getGetUserFollowingQueryKey(me?.id ?? 0) },
  });

  const followMutation = useFollowUser();
  const unfollowMutation = useUnfollowUser();

  const followingSet = new Set((myFollowing ?? []).map((u) => u.id));

  const isOwn = !userId || Number(userId) === me?.id;
  const title = isOwn ? "Siguiendo" : "Siguiendo";

  return (
    <LinearGradient

      style={styles.root}

      colors={BG_GRADIENT}

      locations={[0, 0.5, 1]}

      start={{ x: 0, y: 0 }}

      end={{ x: 0, y: 1 }}

    >
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
          <Feather name="arrow-left" size={20} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        <View style={{ width: 36 }} />
      </View>

      {isLoading ? (
        <ActivityIndicator color={colors.primary} style={{ marginTop: 60 }} />
      ) : (following ?? []).length === 0 ? (
        <View style={styles.empty}>
          <Feather name="user-plus" size={36} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
          <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
            {isOwn ? "Todavía no seguís a nadie." : "No sigue a nadie aún."}
          </Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 20, paddingTop: 12 }}
          showsVerticalScrollIndicator={false}
        >
          {(following ?? []).map((user) => {
            const isFollowing = followingSet.has(user.id);
            const isMe = user.id === me?.id;
            return (
              <View key={user.id} style={[styles.row, { borderBottomColor: colors.border ?? "#1E2A38" }]}>
                <View style={[styles.avatar, { backgroundColor: colors.card }]}>
                  {user.avatarUrl ? (
                    <Image source={{ uri: user.avatarUrl }} style={StyleSheet.absoluteFill} contentFit="cover" />
                  ) : (
                    <Feather name="user" size={18} color={colors.mutedForeground} />
                  )}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
                    {user.displayName}
                  </Text>
                  <Text style={[styles.username, { color: colors.mutedForeground }]} numberOfLines={1}>
                    @{user.username}
                  </Text>
                </View>
                {!isMe && (
                  <Pressable
                    onPress={() => {
                      if (isFollowing) {
                        unfollowMutation.mutate({ userId: user.id });
                      } else {
                        followMutation.mutate({ userId: user.id });
                      }
                    }}
                    style={({ pressed }) => [
                      styles.followBtn,
                      {
                        backgroundColor: isFollowing ? "transparent" : colors.primary,
                        borderColor: colors.primary,
                        opacity: pressed ? 0.8 : 1,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.followBtnText,
                        { color: isFollowing ? colors.primary : "#090F17" },
                      ]}
                    >
                      {isFollowing ? "Siguiendo" : "Seguir"}
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </ScrollView>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 18, fontWeight: "700" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 80 },
  emptyText: { fontSize: 14, textAlign: "center" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  name: { fontSize: 14, fontWeight: "700" },
  username: { fontSize: 12, marginTop: 1 },
  followBtn: {
    borderRadius: 20,
    borderWidth: 1.5,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  followBtnText: { fontSize: 13, fontWeight: "700" },
});
