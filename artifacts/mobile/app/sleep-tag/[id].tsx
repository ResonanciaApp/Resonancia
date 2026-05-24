import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React from "react";
import {
  Dimensions,
  Image,
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
import { SLEEP_TAG_CARDS } from "@/data/tags";
import { getSessionsBySleepTag } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");
const H_PAD = 20;
const COL_GAP = 12;
const CARD_W = (width - H_PAD * 2 - COL_GAP) / 2;
const CARD_IMG_H = Math.round(CARD_W * 0.85);

export default function SleepTagDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const tag = SLEEP_TAG_CARDS.find((t) => t.id === id);

  if (!tag) return null;

  const sessions = getSessionsBySleepTag(tag.label);

  const rows: (typeof sessions)[] = [];
  for (let i = 0; i < sessions.length; i += 2) {
    rows.push(sessions.slice(i, i + 2));
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 60 + bottomPad }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={[styles.header, { paddingTop: topPad + 8 }]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={({ pressed }) => [
              styles.backBtn,
              {
                backgroundColor: colors.card,
                borderColor: "rgba(198,155,79,0.2)",
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Feather name="arrow-left" size={18} color={colors.foreground} />
          </Pressable>
        </View>

        {/* ── Title & Description ── */}
        <View style={styles.intro}>
          <View
            style={[
              styles.tagIcon,
              {
                backgroundColor: `${tag.accent}20`,
                borderColor: `${tag.accent}40`,
              },
            ]}
          >
            <Feather name={tag.icon as never} size={20} color={tag.accent} />
          </View>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>
            {tag.label}
          </Text>
          <Text style={[styles.pageDesc, { color: colors.mutedForeground }]}>
            {tag.description}
          </Text>
        </View>

        {/* ── Sessions grid or empty ── */}
        {sessions.length === 0 ? (
          <View style={[styles.emptySlot, { borderColor: colors.border, marginHorizontal: H_PAD }]}>
            <Feather name="moon" size={28} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Próximamente
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Estamos preparando estas sesiones para ti
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {rows.map((row, rowIdx) => (
              <View key={rowIdx} style={styles.row}>
                {row.map((session) => (
                  <Pressable
                    key={session.id}
                    onPress={() => router.push(`/session/${session.id}` as never)}
                    style={({ pressed }) => [
                      styles.card,
                      { width: CARD_W, opacity: pressed ? 0.82 : 1 },
                    ]}
                  >
                    <View
                      style={[
                        styles.cardImg,
                        { height: CARD_IMG_H, backgroundColor: colors.card },
                      ]}
                    >
                      <Image
                        source={session.image as number}
                        style={StyleSheet.absoluteFill}
                        resizeMode="cover"
                      />
                      <View style={styles.durationBadge}>
                        <Text style={styles.durationText}>
                          {session.durationLabel}
                        </Text>
                      </View>
                    </View>
                    <Text
                      style={[styles.cardTitle, { color: colors.foreground }]}
                      numberOfLines={2}
                    >
                      {session.title}
                    </Text>
                    <View style={styles.cardMeta}>
                      <Feather
                        name="clock"
                        size={11}
                        color={colors.mutedForeground}
                      />
                      <Text
                        style={[styles.cardDuration, { color: colors.mutedForeground }]}
                      >
                        {" "}{session.durationLabel}
                      </Text>
                    </View>
                  </Pressable>
                ))}
                {row.length === 1 && <View style={{ width: CARD_W }} />}
              </View>
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
    paddingHorizontal: H_PAD,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  intro: {
    paddingHorizontal: H_PAD,
    paddingBottom: 28,
    paddingTop: 16,
  },
  tagIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  pageTitle: {
    fontSize: 28,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 10,
  },
  pageDesc: {
    fontSize: 14,
    lineHeight: 22,
    maxWidth: 340,
  },

  grid: {
    paddingHorizontal: H_PAD,
    gap: COL_GAP,
  },
  row: {
    flexDirection: "row",
    gap: COL_GAP,
  },

  card: {
    marginBottom: 4,
  },
  cardImg: {
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 8,
  },
  durationBadge: {
    position: "absolute",
    bottom: 7,
    left: 7,
    backgroundColor: "rgba(0,0,0,0.62)",
    borderRadius: 6,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  durationText: {
    color: "#FFFFFF",
    fontSize: 10,
    fontWeight: "600",
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: "700",
    lineHeight: 18,
    marginBottom: 4,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  cardDuration: {
    fontSize: 11,
  },

  emptySlot: {
    marginTop: 8,
    height: 160,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  emptySub: {
    fontSize: 13,
    textAlign: "center",
    paddingHorizontal: 24,
  },
});
