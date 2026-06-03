import { Feather } from "@expo/vector-icons";
import { useAuth as useClerkAuth } from "@clerk/expo";
import { useQueryClient } from "@tanstack/react-query";
import {
  getGetConversationsQueryKey,
  getGetFriendRequestsQueryKey,
  getGetFriendsQueryKey,
  getGetMeQueryKey,
  getSearchUsersQueryKey,
  useAcceptFriendRequest,
  useDeclineFriendRequest,
  useGetConversations,
  useGetFriendRequests,
  useGetFriends,
  useGetMe,
  useRemoveFriend,
  useSearchUsers,
  useSendFriendRequest,
  type Conversation,
  type FriendRequest,
  type UserProfile,
  type UserSearchResult,
} from "@workspace/api-client-react";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { useColors } from "@/hooks/useColors";

const AVATAR_PALETTE = ["#D4709A", "#8AAAD4", "#f4c993", "#A8C4A8", "#C8B4E0", "#EDD9B8"];

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "·";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}

function colorFor(id: number): string {
  return AVATAR_PALETTE[Math.abs(id) % AVATAR_PALETTE.length];
}

export default function AmigosScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { isSignedIn, isLoaded } = useClerkAuth();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <ScrollView
        contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: bottomPad + 40, paddingHorizontal: 20 }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={12}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
        </View>

        <Text style={[styles.title, { color: colors.foreground }]}>Amigos</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Conecta con practicantes de tu comunidad
        </Text>

        {!isLoaded ? (
          <View style={{ paddingTop: 40, alignItems: "center" }}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : isSignedIn ? (
          <SignedInAmigos />
        ) : (
          <GuestPrompt />
        )}
      </ScrollView>
    </View>
  );
}

function GuestPrompt() {
  const colors = useColors();
  return (
    <View style={[styles.guestCard, { backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }]}>
      <Feather name="users" size={28} color={colors.primary} />
      <Text style={[styles.guestTitle, { color: colors.foreground }]}>Crea tu cuenta para agregar amigos</Text>
      <Text style={[styles.guestText, { color: colors.mutedForeground }]}>
        Para conectarte con otros practicantes necesitas una cuenta con email. Es gratis y solo tarda un minuto. Tu
        perfil local y tus meditaciones siguen intactos.
      </Text>
      <Pressable
        onPress={() => router.push("/(auth)/sign-up")}
        style={({ pressed }) => [styles.guestBtn, { opacity: pressed ? 0.85 : 1 }]}
      >
        <LinearGradient colors={["#C8C1B5", "#B6955F"]} style={styles.guestBtnGrad}>
          <Text style={styles.guestBtnText}>Crear cuenta</Text>
          <Feather name="arrow-right" size={16} color="#080F0A" />
        </LinearGradient>
      </Pressable>
      <Pressable onPress={() => router.push("/(auth)/sign-in")}>
        <Text style={[styles.guestLink, { color: colors.primary }]}>Ya tengo cuenta — iniciar sesión</Text>
      </Pressable>
    </View>
  );
}

function SignedInAmigos() {
  const colors = useColors();
  const qc = useQueryClient();
  const [search, setSearch] = useState("");

  // Ensure the user row exists server-side (JIT provisioning).
  useGetMe({ query: { queryKey: getGetMeQueryKey(), staleTime: 60_000 } });

  const friendsQ = useGetFriends();
  const requestsQ = useGetFriendRequests({
    query: { queryKey: getGetFriendRequestsQueryKey(), refetchInterval: 30_000 },
  });
  const conversationsQ = useGetConversations({
    query: { queryKey: getGetConversationsQueryKey(), refetchInterval: 15_000 },
  });
  const trimmed = search.trim();
  const searchQ = useSearchUsers(
    { q: trimmed },
    {
      query: {
        queryKey: getSearchUsersQueryKey({ q: trimmed }),
        enabled: trimmed.length >= 2,
      },
    },
  );

  const invalidateAll = () => {
    qc.invalidateQueries({ queryKey: getGetFriendsQueryKey() });
    qc.invalidateQueries({ queryKey: getGetFriendRequestsQueryKey() });
    qc.invalidateQueries({ queryKey: getSearchUsersQueryKey({ q: trimmed }) });
  };

  const sendReq = useSendFriendRequest({
    mutation: { onSuccess: () => invalidateAll() },
  });
  const acceptReq = useAcceptFriendRequest({
    mutation: { onSuccess: () => invalidateAll() },
  });
  const declineReq = useDeclineFriendRequest({
    mutation: { onSuccess: () => invalidateAll() },
  });
  const removeFriend = useRemoveFriend({
    mutation: { onSuccess: () => invalidateAll() },
  });

  const friends = friendsQ.data ?? [];
  const requests = requestsQ.data ?? [];
  const conversations = (conversationsQ.data ?? []).filter((c) => c.lastMessage != null);
  const searchResults = trimmed.length >= 2 ? searchQ.data ?? [] : [];

  const showSearch = trimmed.length >= 2;
  const noResults = showSearch && !searchQ.isLoading && searchResults.length === 0;

  const onRemove = (f: UserProfile) => {
    Alert.alert("Eliminar amigo", `¿Eliminar a ${f.displayName} de tus amigos?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => removeFriend.mutate({ userId: f.id }),
      },
    ]);
  };

  return (
    <>
      <View style={[styles.searchRow, { backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por nombre o usuario..."
          placeholderTextColor={colors.mutedForeground}
          style={[styles.searchInput, { color: colors.foreground }]}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {search.length > 0 && (
          <Pressable onPress={() => setSearch("")} hitSlop={10}>
            <Feather name="x" size={14} color={colors.mutedForeground} />
          </Pressable>
        )}
      </View>

      {showSearch && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Resultados</Text>
          {searchQ.isLoading && <ActivityIndicator color={colors.primary} />}
          {noResults && (
            <Text style={[styles.empty, { color: colors.mutedForeground }]}>
              No encontramos a nadie con “{trimmed}”.
            </Text>
          )}
          {searchResults.map((u) => (
            <SearchResultRow
              key={u.id}
              user={u}
              onAdd={() => sendReq.mutate({ data: { addresseeId: u.id } })}
            />
          ))}
        </View>
      )}

      {!showSearch && requests.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Solicitudes · {requests.length}
          </Text>
          {requests.map((r) => (
            <RequestRow
              key={r.id}
              request={r}
              onAccept={() => acceptReq.mutate({ id: r.id })}
              onDecline={() => declineReq.mutate({ id: r.id })}
            />
          ))}
        </View>
      )}

      {!showSearch && conversations.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Conversaciones</Text>
          {conversations.map((c) => (
            <ConversationRow key={c.friend.id} conversation={c} />
          ))}
        </View>
      )}

      {!showSearch && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Mis amigos · {friends.length}
          </Text>
          {friendsQ.isLoading && <ActivityIndicator color={colors.primary} />}
          {!friendsQ.isLoading && friends.length === 0 && (
            <Text style={[styles.empty, { color: colors.mutedForeground }]}>
              Aún no tienes amigos. Busca a alguien por nombre o usuario.
            </Text>
          )}
          {friends.map((f) => (
            <FriendRow
              key={f.id}
              friend={f}
              onOpen={() => router.push(`/chat/${f.id}` as never)}
              onRemove={() => onRemove(f)}
            />
          ))}
        </View>
      )}
    </>
  );
}

function Avatar({ user }: { user: UserProfile | UserSearchResult }) {
  const tint = colorFor(user.id);
  return (
    <View style={[styles.avatar, { backgroundColor: tint + "33" }]}>
      <Text style={[styles.initials, { color: tint }]}>{initialsFor(user.displayName)}</Text>
    </View>
  );
}

function SearchResultRow({
  user,
  onAdd,
}: {
  user: UserSearchResult;
  onAdd: () => void;
}) {
  const colors = useColors();
  const status = user.friendshipStatus;
  return (
    <View style={[styles.friendRow, { backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }]}>
      <Avatar user={user} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.friendName, { color: colors.foreground }]}>{user.displayName}</Text>
        <Text style={[styles.friendSub, { color: colors.mutedForeground }]}>@{user.username}</Text>
      </View>
      {status === "none" && (
        <Pressable onPress={onAdd} style={styles.acceptBtn}>
          <LinearGradient colors={["#C8C1B5", "#B6955F"]} style={styles.acceptGrad}>
            <Feather name="user-plus" size={14} color="#080F0A" />
          </LinearGradient>
        </Pressable>
      )}
      {status === "pending_outgoing" && (
        <Text style={[styles.statusBadge, { color: colors.mutedForeground }]}>Enviada</Text>
      )}
      {status === "pending_incoming" && (
        <Pressable onPress={onAdd} style={styles.acceptBtn}>
          <LinearGradient colors={["#C8C1B5", "#B6955F"]} style={styles.acceptGrad}>
            <Feather name="check" size={14} color="#080F0A" />
          </LinearGradient>
        </Pressable>
      )}
      {status === "accepted" && (
        <Text style={[styles.statusBadge, { color: colors.primary }]}>Amigos</Text>
      )}
    </View>
  );
}

function RequestRow({
  request,
  onAccept,
  onDecline,
}: {
  request: FriendRequest;
  onAccept: () => void;
  onDecline: () => void;
}) {
  const colors = useColors();
  const requester = request.requester;
  return (
    <View style={[styles.requestCard, { backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)" }]}>
      <Avatar user={requester} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.friendName, { color: colors.foreground }]}>{requester.displayName}</Text>
        <Text style={[styles.friendSub, { color: colors.mutedForeground }]}>@{requester.username}</Text>
      </View>
      <View style={styles.requestBtns}>
        <Pressable style={styles.acceptBtn} onPress={onAccept}>
          <LinearGradient colors={["#C8C1B5", "#B6955F"]} style={styles.acceptGrad}>
            <Feather name="check" size={14} color="#080F0A" />
          </LinearGradient>
        </Pressable>
        <Pressable
          style={[styles.rejectBtn, { borderColor: colors.border }]}
          onPress={onDecline}
        >
          <Feather name="x" size={14} color={colors.mutedForeground} />
        </Pressable>
      </View>
    </View>
  );
}

function FriendRow({
  friend,
  onOpen,
  onRemove,
}: {
  friend: UserProfile;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onOpen}
      onLongPress={onRemove}
      delayLongPress={350}
      style={({ pressed }) => [
        styles.friendRow,
        { backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)", opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Avatar user={friend} />
      <View style={{ flex: 1 }}>
        <Text style={[styles.friendName, { color: colors.foreground }]}>{friend.displayName}</Text>
        <Text style={[styles.friendSub, { color: colors.mutedForeground }]} numberOfLines={1}>
          @{friend.username}
        </Text>
      </View>
      <Feather name="message-circle" size={18} color={colors.accent} />
    </Pressable>
  );
}

function ConversationRow({ conversation }: { conversation: Conversation }) {
  const colors = useColors();
  const { friend, lastMessage, unreadCount } = conversation;
  const preview = lastMessage
    ? lastMessage.sessionId != null
      ? "🎧 Compartió una sesión"
      : lastMessage.body ?? ""
    : "";
  const time = lastMessage ? relativeShort(lastMessage.createdAt) : "";
  return (
    <Pressable
      onPress={() => router.push(`/chat/${friend.id}` as never)}
      style={({ pressed }) => [
        styles.friendRow,
        { backgroundColor: "rgba(255,255,255,0.04)", borderColor: "rgba(255,255,255,0.07)", opacity: pressed ? 0.8 : 1 },
      ]}
    >
      <Avatar user={friend} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <Text style={[styles.friendName, { color: colors.foreground }]} numberOfLines={1}>
            {friend.displayName}
          </Text>
          <Text style={[styles.friendSub, { color: colors.mutedForeground }]}>{time}</Text>
        </View>
        <Text
          style={[
            styles.friendSub,
            { color: unreadCount > 0 ? colors.foreground : colors.mutedForeground },
          ]}
          numberOfLines={1}
        >
          {preview || "·"}
        </Text>
      </View>
      {unreadCount > 0 && (
        <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.unreadText}>{unreadCount > 9 ? "9+" : unreadCount}</Text>
        </View>
      )}
    </Pressable>
  );
}

function relativeShort(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "ahora";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 16, height: 40 },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 6 },
  subtitle: { fontSize: 14, marginBottom: 20 },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 28,
  },
  searchInput: { flex: 1, fontSize: 14 },
  section: { marginBottom: 28, gap: 10 },
  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  empty: { fontSize: 13, paddingVertical: 8 },
  requestCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  initials: { fontSize: 15, fontWeight: "700" },
  friendName: { fontSize: 14, fontWeight: "600", marginBottom: 2 },
  friendSub: { fontSize: 12 },
  requestBtns: { flexDirection: "row", gap: 8 },
  acceptBtn: { width: 34, height: 34, borderRadius: 10, overflow: "hidden" },
  acceptGrad: { flex: 1, alignItems: "center", justifyContent: "center" },
  rejectBtn: { width: 34, height: 34, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  friendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  statusBadge: { fontSize: 12, fontWeight: "600" },
  unreadBadge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  unreadText: { color: "#080F0A", fontSize: 11, fontWeight: "700" },
  guestCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 22,
    alignItems: "center",
    gap: 12,
    marginTop: 8,
  },
  guestTitle: { fontSize: 18, fontWeight: "700", textAlign: "center" },
  guestText: { fontSize: 13, textAlign: "center", lineHeight: 19, marginBottom: 8 },
  guestBtn: { borderRadius: 14, overflow: "hidden", width: "100%" },
  guestBtnGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
  },
  guestBtnText: { color: "#080F0A", fontWeight: "700", fontSize: 15 },
  guestLink: { fontSize: 13, fontWeight: "600", marginTop: 4 },
});
