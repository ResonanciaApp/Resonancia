import React, { useState, useRef } from "react";
import {
  Animated,
  FlatList,
  Platform,
  Pressable,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { GhostPill } from "@/components/GhostPill";
import { QUOTES, getQuoteOfTheDay, type Quote } from "@/data/quotes";

const H_PAD   = 16;
const GOLD    = "#dad4ec";
const AUTHOR_COLORS: Record<string, string> = {
  "Jiddu Krishnamurti": "#7B4FA6",
  "Papaji":              "#C4A030",
  "Mooji":               "#3D8C6C",
  "Ramana Maharshi":     "#C46A2A",
  "Alan Watts":          "#2A7AC4",
  "Eckhart Tolle":       "#8C3D6C",
  "Thích Nhất Hạnh":    "#3D6C8C",
  "Osho":                "#C43D3D",
  "Adyashanti":          "#6C8C3D",
  "Rupert Spira":        "#8C6C3D",
  "Nisargadatta Maharaj":"#3D3D8C",
};

function getAuthorInitials(author: string): string {
  const parts = author.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

function getAuthorColor(author: string): string {
  return AUTHOR_COLORS[author] ?? "#7B4FA6";
}

type QuoteItem = Quote & { isWeek: boolean; key: string };

function buildList(): QuoteItem[] {
  const week = getQuoteOfTheDay();
  const all: QuoteItem[] = [{ ...week, isWeek: true, key: "week" }];
  QUOTES.forEach((q, i) => all.push({ ...q, isWeek: false, key: String(i) }));
  return all;
}

const ALL_QUOTES = buildList();

export default function ReflexionesScreen() {
  const insets   = useSafeAreaInsets();
  const topPad   = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [visibleCount] = useState(1);
  const scrollY = useRef(new Animated.Value(0)).current;

  const FADE_START = 100;
  const headerOpacity = scrollY.interpolate({
    inputRange: [FADE_START, FADE_START + 44],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  const visible = ALL_QUOTES.slice(0, visibleCount);

  function renderItem({ item }: { item: QuoteItem }) {
    const initials = getAuthorInitials(item.author);
    const color    = getAuthorColor(item.author);

    return (
      <View style={styles.card}>
        {item.isWeek && (
          <View style={styles.weekBadge}>
            <Feather name="sun" size={11} color={GOLD} />
            <Text style={styles.weekBadgeText}>Esta semana</Text>
          </View>
        )}

        {/* Avatar del autor */}
        <View style={[styles.avatarWrap, { backgroundColor: color + "28", borderColor: color + "60" }]}>
          <Text style={[styles.avatarInitials, { color }]}>{initials}</Text>
        </View>

        {/* Frase */}
        <Text style={styles.quoteText}>"{item.text}"</Text>

        {/* Autor */}
        <Text style={styles.authorText}>— {item.author}</Text>

        {/* Compartir */}
        <Pressable
          onPress={async () => {
            try {
              await Share.share({
                message: `"${item.text}"\n\n— ${item.author}\n\nVía RESONANCIA`,
              });
            } catch {}
          }}
          hitSlop={12}
          style={({ pressed }) => [styles.shareBtn, { opacity: pressed ? 0.5 : 1 }]}
        >
          <Feather name="send" size={15} color="rgba(212,175,55,0.50)" />
        </Pressable>
      </View>
    );
  }

  const ListHeader = (
    <View style={{ paddingTop: topPad + 64, paddingBottom: 16 }}>
      <Text style={styles.pageTitle}>Reflexiones</Text>
      <Text style={styles.pageSubtitle}>Sabiduría de maestros para el camino interior</Text>
    </View>
  );

  return (
    <View style={styles.root}>
      <LinearGradient
        colors={["#340D1A", "#190913"]}
        locations={[0, 1]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <StatusBar hidden />

      {/* Header sticky animado */}
      <Animated.View style={[styles.stickyHeader, { paddingTop: topPad, opacity: headerOpacity }]}>
        <LinearGradient
          colors={["rgba(27,6,15,0.97)", "rgba(27,6,15,0.88)"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.stickyInner}>
          <GhostPill>
            <Pressable onPress={() => router.back()} hitSlop={10} style={styles.pillBtn}>
              <Feather name="arrow-left" size={16} color="#FFFFFF" />
            </Pressable>
          </GhostPill>
          <Text style={styles.stickyTitle} numberOfLines={1}>Reflexiones</Text>
          <View style={{ width: 44 }} />
        </View>
      </Animated.View>

      {/* Flecha flotante siempre visible */}
      <View style={[styles.floatingBack, { top: topPad + 8 }]} pointerEvents="box-none">
        <GhostPill>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.pillBtn}>
            <Feather name="arrow-left" size={16} color="#FFFFFF" />
          </Pressable>
        </GhostPill>
      </View>

      <Animated.FlatList
        data={visible}
        keyExtractor={(item) => item.key}
        renderItem={renderItem}
        ListHeaderComponent={ListHeader}
        ItemSeparatorComponent={() => <View style={{ height: 14 }} />}
        contentContainerStyle={{
          paddingBottom: 100 + bottomPad,
          paddingHorizontal: H_PAD,
        }}
        showsVerticalScrollIndicator={false}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        scrollEventThrottle={16}
      />
    </View>
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
    paddingBottom: 10,
  },
  stickyInner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: H_PAD,
    paddingTop: 10,
    paddingBottom: 12,
  },
  stickyTitle: {
    fontFamily: "Manrope",
    fontSize: 22,
    fontWeight: "700",
    color: "#FFFFFF",
    flex: 1,
    textAlign: "center",
    paddingHorizontal: 8,
  },
  pillBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  // Floating back
  floatingBack: {
    position: "absolute",
    left: H_PAD,
    zIndex: 10,
  },

  // Page header
  pageTitle: {
    fontFamily: "Manrope",
    fontSize: 30,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  pageSubtitle: {
    fontFamily: "Manrope",
    fontSize: 14,
    color: "rgba(255,255,255,0.50)",
    lineHeight: 20,
  },

  // Quote card
  card: {
    backgroundColor: "rgba(72,40,120,0.10)",
    borderRadius: 18,
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 16,
    alignItems: "center",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(212,175,55,0.10)",
  },

  // Badge "Esta semana"
  weekBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "rgba(212,175,55,0.10)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.22)",
  },
  weekBadgeText: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "700",
    color: GOLD,
    letterSpacing: 0.2,
  },

  // Avatar
  avatarWrap: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  avatarInitials: {
    fontFamily: "Manrope",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.5,
  },

  // Quote text
  quoteText: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "600",
    lineHeight: 25,
    color: "#FFFFFF",
    textAlign: "center",
    marginBottom: 14,
  },

  // Author
  authorText: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "500",
    color: "rgba(255,255,255,0.50)",
    textAlign: "center",
    marginBottom: 14,
  },

  // Share
  shareBtn: {
    padding: 4,
    alignSelf: "flex-end",
  },
});
