import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Image,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SESSIONS } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

const PAGE_SIZE = 10;

const ALL_SESSIONS = [...SESSIONS].sort((a, b) => parseInt(b.id) - parseInt(a.id));

export default function NuevasSessionesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const visibleSessions = ALL_SESSIONS.slice(0, visibleCount);
  const hasMore = visibleCount < ALL_SESSIONS.length;

  function loadMore() {
    if (hasMore) setVisibleCount((c) => c + PAGE_SIZE);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      <FlatList
        data={visibleSessions}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{
          paddingTop: topPad + 8,
          paddingBottom: bottomPad + 40,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
        onEndReached={loadMore}
        onEndReachedThreshold={0.3}
        ListHeaderComponent={
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Feather name="arrow-left" size={22} color={colors.foreground} />
            </Pressable>
            <View style={styles.titleBlock}>
              <Text style={[styles.title, { color: colors.foreground }]}>
                Nuevas Sesiones
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                {ALL_SESSIONS.length} sesiones · orden de llegada
              </Text>
            </View>
          </View>
        }
        ListFooterComponent={
          hasMore ? (
            <Pressable
              onPress={loadMore}
              style={[styles.loadMore, { borderColor: colors.border }]}
            >
              <Text style={[styles.loadMoreText, { color: colors.mutedForeground }]}>
                Cargar más
              </Text>
            </Pressable>
          ) : (
            <View style={styles.endWrap}>
              <Feather name="check-circle" size={18} color={colors.mutedForeground} />
              <Text style={[styles.endText, { color: colors.mutedForeground }]}>
                Has llegado al final
              </Text>
            </View>
          )
        }
        renderItem={({ item: session, index }) => (
          <Pressable
            onPress={() => router.push(`/session/${session.id}` as never)}
            style={({ pressed }) => [
              styles.card,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                opacity: pressed ? 0.82 : 1,
              },
            ]}
          >
            <View style={[styles.indexBadge, { backgroundColor: "rgba(182,149,95,0.1)" }]}>
              <Text style={[styles.indexNum, { color: colors.mutedForeground }]}>
                {String(index + 1).padStart(2, "0")}
              </Text>
            </View>
            <Image source={session.image as never} style={styles.cardImage} />
            <View style={styles.cardBody}>
              {session.isNew && (
                <View style={[styles.newBadge, { backgroundColor: colors.primary }]}>
                  <Text style={styles.newBadgeText}>NUEVA</Text>
                </View>
              )}
              <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
                {session.title}
              </Text>
              <Text style={[styles.cardSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                {session.categoryLabel}
              </Text>
              <View style={styles.metaRow}>
                <Feather name="clock" size={11} color={colors.mutedForeground} />
                <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                  {" "}{session.durationLabel}
                </Text>
              </View>
            </View>
            <Feather name="chevron-right" size={16} color={colors.border} style={{ marginRight: 14 }} />
          </Pressable>
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    marginBottom: 24,
    paddingTop: 4,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    alignSelf: "flex-start",
  },
  titleBlock: {},
  title: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
  },

  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    minHeight: 100,
  },
  indexBadge: {
    width: 36,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
  },
  indexNum: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  cardImage: {
    width: 100,
    height: 100,
    resizeMode: "cover",
  },
  cardBody: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: "center",
    gap: 3,
  },
  newBadge: {
    alignSelf: "flex-start",
    borderRadius: 5,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginBottom: 3,
  },
  newBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#090F0B",
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  cardSub: {
    fontSize: 11,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  metaText: {
    fontSize: 11,
  },

  loadMore: {
    marginTop: 20,
    alignSelf: "center",
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
  },
  loadMoreText: {
    fontSize: 13,
    fontWeight: "600",
  },
  endWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 28,
    paddingBottom: 8,
  },
  endText: {
    fontSize: 13,
  },
});
