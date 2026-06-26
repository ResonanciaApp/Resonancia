import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useRef } from "react";
import {
  Animated,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SessionRow } from "@/components/SessionRow";
import { getMoodById } from "@/data/moods";
import { SESSIONS } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

const H_PAD = 16;
const BG_GRADIENT = ["#2E0510", "#160108"] as const;
const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<(typeof SESSIONS)[number]>);
const STICKY_THRESHOLD = 80;

export default function EstadoAnimoScreen() {
  const { mood: moodId } = useLocalSearchParams<{ mood: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const mood = getMoodById(moodId ?? "");

  const scrollY = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const headerOpacity = scrollY.interpolate({
    inputRange: [STICKY_THRESHOLD - 30, STICKY_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const sessions = (() => {
    if (!mood) return [];
    const themeSet = new Set(mood.themeTags);
    const categorySet = new Set(mood.categoryIds);
    const withTag = SESSIONS.filter((s) => s.themeTag?.some((t) => themeSet.has(t)));
    const withTagIds = new Set(withTag.map((s) => s.id));
    const byCategory = SESSIONS.filter((s) => !withTagIds.has(s.id) && categorySet.has(s.categoryId));
    return [...withTag, ...byCategory];
  })();

  if (!mood) {
    return (
      <LinearGradient colors={BG_GRADIENT} style={styles.root}>
        <Text style={[styles.emptyText, { marginTop: 100 }]}>Estado de ánimo no encontrado.</Text>
      </LinearGradient>
    );
  }

  const ListHeader = (
    <>
      {/* Floating back row — always visible */}
      <View style={[styles.heroHeader, { paddingTop: topPad + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={({ pressed }) => [
            styles.backBtn,
            { backgroundColor: colors.card, borderColor: "rgba(212,175,55,0.20)", opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </Pressable>
      </View>

      {/* Mood chip */}
      <View style={styles.moodChip}>
        <Text style={styles.moodChipEmoji}>{mood.emoji}</Text>
        <Text style={styles.moodChipLabel}>{mood.label}</Text>
        <Pressable onPress={() => router.back()} hitSlop={8} style={styles.chipClose}>
          <Feather name="x" size={14} color="rgba(190,150,80,0.7)" />
        </Pressable>
      </View>

      {sessions.length === 0 && (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyText}>
            No hay sesiones para este estado de ánimo aún.
          </Text>
        </View>
      )}
    </>
  );

  return (
    <LinearGradient colors={BG_GRADIENT} style={styles.root}>
      {/* ── STICKY HEADER ── */}
      <Animated.View
        style={[
          styles.stickyHeader,
          {
            paddingTop: topPad,
            backgroundColor: "#2E0510",
            borderBottomColor: "rgba(212,175,55,0.15)",
            opacity: headerOpacity,
          },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.stickyInner} pointerEvents="box-none">
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            style={({ pressed }) => [styles.ghostPill, { opacity: pressed ? 0.7 : 1 }]}
          >
            <Feather name="arrow-left" size={16} color="#FFFFFF" />
          </Pressable>
          <Text style={[styles.stickyTitle, { color: colors.foreground }]} numberOfLines={1}>
            {mood.emoji}{"  "}{mood.label}
          </Text>
        </View>
      </Animated.View>

      <AnimatedFlatList
        data={sessions}
        keyExtractor={(s) => s.id}
        contentContainerStyle={{ paddingBottom: bottomPad + 100, paddingHorizontal: H_PAD }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        ListHeaderComponent={ListHeader}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        renderItem={({ item }) => <SessionRow session={item} />}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Sticky header
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    borderBottomWidth: 1,
  },
  stickyInner: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: H_PAD,
    paddingBottom: 12,
    paddingTop: 10,
    gap: 12,
  },
  ghostPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 50,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    flexShrink: 0,
  },
  stickyTitle: {
    fontSize: 17,
    fontWeight: "700",
    flex: 1,
  },

  // Hero header area
  heroHeader: {
    paddingHorizontal: H_PAD,
    paddingBottom: 8,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },

  // Mood chip
  moodChip: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    backgroundColor: "rgba(190,150,80,0.12)",
    borderWidth: 1,
    borderColor: "rgba(190,150,80,0.30)",
    borderRadius: 40,
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 6,
    marginBottom: 20,
  },
  moodChipEmoji: { fontSize: 18 },
  moodChipLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#BE9650",
  },
  chipClose: {
    marginLeft: 2,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(190,150,80,0.10)",
    marginLeft: 94,
  },
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 15,
    color: "rgba(237,225,211,0.45)",
    textAlign: "center",
  },
});
