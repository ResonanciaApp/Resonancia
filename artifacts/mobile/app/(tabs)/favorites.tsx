import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { SessionCard } from "@/components/SessionCard";
import { usePlayer } from "@/context/PlayerContext";
import { SESSIONS } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

export default function FavoritesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { favorites } = usePlayer();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const favSessions = SESSIONS.filter((s) => favorites.includes(s.id));

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: 160 + bottomPad,
          paddingTop: topPad + 12,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Favorites</Text>
          <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
            Your saved sound journeys
          </Text>
        </View>

        {favSessions.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyIconBg, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="heart" size={32} color={colors.border} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Your sanctuary awaits
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Save sessions you love to return to them whenever you need stillness.
            </Text>
            <Pressable
              onPress={() => router.push("/(tabs)/explore" as never)}
              style={[styles.exploreBtn, { backgroundColor: colors.primary }]}
            >
              <Text style={[styles.exploreBtnText, { color: colors.primaryForeground }]}>
                Explore Sessions
              </Text>
            </Pressable>
          </View>
        ) : (
          <View>
            <Text style={[styles.countLabel, { color: colors.mutedForeground }]}>
              {favSessions.length} saved session{favSessions.length !== 1 ? "s" : ""}
            </Text>
            {favSessions.map((s) => (
              <SessionCard key={s.id} session={s} horizontal />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  header: {
    marginBottom: 24,
  },
  pageTitle: {
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  pageSub: {
    fontSize: 13,
  },
  countLabel: {
    fontSize: 12,
    marginBottom: 14,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    gap: 16,
  },
  emptyIconBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
  },
  emptySub: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: 20,
  },
  exploreBtn: {
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 30,
    marginTop: 8,
  },
  exploreBtnText: {
    fontSize: 15,
    fontWeight: "700",
  },
});
