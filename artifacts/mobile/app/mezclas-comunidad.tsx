import { AntDesign, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { BackPill } from "@/components/BackPill";
import { router } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGetSharedMixes } from "@workspace/api-client-react";
import type { SharedMix } from "@workspace/api-client-react";

import { MixContextMenu } from "@/components/CommunityMixesCarousel";
import { getMixImage } from "@/config/mix-images";
import { MIX_CATEGORIES, type MixCategory } from "@/data/mix-categories";
import { useColors } from "@/hooks/useColors";
import { useSceneTheme } from "@/context/SceneThemeContext";

const { width } = Dimensions.get("window");
const H_PAD = 15;
const GOLD = "#F9F9F9";
const TEXT = "#FBFBFB";
const MUTED = "#c2c2c2";

const GRID_GAP = 12;
const CARD_W = (width - H_PAD * 2 - GRID_GAP) / 2;

type ChipDef = { id: MixCategory; label: string; icon: string; iconFamily?: string };

const CHIPS: ChipDef[] = MIX_CATEGORIES.map((c) => ({
  id: c.id,
  label: c.label,
  icon: c.icon,
  iconFamily: c.iconFamily,
}));

function ChipIcon({ icon, iconFamily, color, size = 15 }: { icon: string; iconFamily?: string; color: string; size?: number }) {
  if (iconFamily === "MaterialCommunityIcons") {
    return <MaterialCommunityIcons name={icon as never} size={size} color={color} />;
  }
  return <Feather name={icon as never} size={size} color={color} />;
}

function Chip({ chip, sel, onPress }: { chip: ChipDef; sel: boolean; onPress: () => void }) {
  const iconColor = sel ? "#1B060F" : GOLD;
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, { opacity: pressed ? 0.7 : 1 }]}>
      <LinearGradient
        colors={sel ? ["#F9F9F9", "#F9F9F9"] : ["rgba(255,255,255,0.055)", "rgba(255,255,255,0.055)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
        <ChipIcon icon={chip.icon} iconFamily={chip.iconFamily} color={iconColor} />
        <Text style={[styles.chipText, sel && styles.chipTextSel]}>{chip.label}</Text>
      </View>
    </Pressable>
  );
}

function MixGridCard({ mix, onPress, onOptions }: { mix: SharedMix; onPress: () => void; onOptions: () => void }) {
  const resolvedImg = mix.image ? getMixImage(mix.image) : undefined;

  return (
    <Pressable onPress={onPress} onLongPress={onOptions} style={({ pressed }) => [gc.card, { width: CARD_W, opacity: pressed ? 0.85 : 1 }]}>
      <View style={gc.imgContainer}>
        {resolvedImg ? (
          <Image source={resolvedImg as number} style={gc.cardImage} contentFit="cover" />
        ) : (
          <LinearGradient colors={["#1B060F", "#2E0A18"]} style={gc.cardImage}>
            <Feather name="music" size={26} color="rgba(212,175,55,0.55)" />
          </LinearGradient>
        )}
        {mix.likes > 0 && (
          <View style={gc.likeBadge}>
            <AntDesign name="heart" size={10} color="#fff" />
            <Text style={gc.likeBadgeText}>{mix.likes}</Text>
          </View>
        )}
      </View>
      <Text style={gc.cardTitle} numberOfLines={2}>{mix.name}</Text>
      <Text style={gc.cardAuthor} numberOfLines={1}>{mix.author.displayName}</Text>
    </Pressable>
  );
}

const gc = StyleSheet.create({
  card: { gap: 6 },
  imgContainer: { width: "100%", aspectRatio: 1, borderRadius: 10, overflow: "hidden" },
  cardImage: { width: "100%", height: "100%", alignItems: "center", justifyContent: "center" },
  cardTitle: { fontFamily: "Manrope", fontSize: 15, fontWeight: "600", color: TEXT, lineHeight: 20 },
  cardAuthor: { fontFamily: "Manrope", fontSize: 13, color: MUTED },
  likeBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(27,6,15,0.72)",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  likeBadgeText: { fontFamily: "Manrope", fontSize: 11, fontWeight: "600", color: "#fff" },
  dotsBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
  },
  dot: { width: 4, height: 4, borderRadius: 2, backgroundColor: "#fff" },
});

export default function MezclasComunidadScreen() {
  const colors = useColors();
  const { theme } = useSceneTheme();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 0 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [activeCategory, setActiveCategory] = useState<MixCategory | null>(null);
  const { data, isLoading } = useGetSharedMixes(
    activeCategory ? { category: activeCategory } : undefined,
  );
  const allMixes = data?.mixes ?? [];
  const [menuMix, setMenuMix] = useState<SharedMix | null>(null);

  const handleViewCreator = useCallback((mix: SharedMix) => {
    setMenuMix(null);
    router.push({
      pathname: "/mezcla-creador/[userId]",
      params: { userId: String(mix.author.id), name: mix.author.displayName },
    } as never);
  }, []);

  const handleOpenMix = useCallback((mix: SharedMix) => {
    router.push({ pathname: "/mezcla/[id]", params: { id: String(mix.id) } } as never);
  }, []);

  const rows = useMemo(() => {
    const out: SharedMix[][] = [];
    for (let i = 0; i < allMixes.length; i += 2) out.push(allMixes.slice(i, i + 2));
    return out;
  }, [allMixes]);

  const scrollY = useRef(new Animated.Value(0)).current;
  const handleScroll = Animated.event(
    [{ nativeEvent: { contentOffset: { y: scrollY } } }],
    { useNativeDriver: true },
  );
  const STICKY_START = 20;
  const STICKY_END   = STICKY_START + 40;
  const stickyOpacity = scrollY.interpolate({
    inputRange: [STICKY_START, STICKY_END],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  return (
    <View style={[styles.root, { backgroundColor: theme.gradient[1] }]}>
      <StatusBar hidden />

      {/* ── Header fijo (BackPill siempre visible) ── */}
      <View style={[styles.header, { paddingTop: topPad + 4 }]}>
        <BackPill onPress={() => router.back()} size={28} bgColor="rgba(255,255,255,0.10)" iconOffsetX={-1} />
      </View>

      <Animated.ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 60 + bottomPad }}
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* ── Título + Descripción ── */}
        <View style={styles.profileCard}>
          <Text style={styles.profileTitle}>Todas las creaciones</Text>
          <Text style={styles.profileDesc}>
            Explora entre universos sonoros
          </Text>
        </View>

        {/* ── Chips de categoría ── */}
        <View style={styles.chipsArea}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.chipRow}
            contentContainerStyle={styles.chipRowContent}
          >
            {CHIPS.map((chip) => (
              <Chip
                key={chip.id}
                chip={chip}
                sel={activeCategory === chip.id}
                onPress={() => setActiveCategory((cur) => (cur === chip.id ? null : chip.id))}
              />
            ))}
          </ScrollView>
        </View>

        {/* ── Grilla de mezclas ── */}
        {!isLoading && allMixes.length === 0 ? (
          <View style={styles.emptyState}>
            <Feather name="music" size={28} color="rgba(212,175,55,0.35)" />
            <Text style={styles.emptyText}>Aún no hay mezclas compartidas</Text>
            <Text style={styles.emptySub}>
              {activeCategory
                ? "No hay mezclas en esta categoría todavía"
                : "Sé el primero en compartir tu ambiente sonoro"}
            </Text>
          </View>
        ) : (
          <View style={styles.gridOuter}>
            {rows.map((row, i) => (
              <View key={i} style={styles.gridRow}>
                {row.map((mix) => (
                  <MixGridCard
                    key={mix.id}
                    mix={mix}
                    onPress={() => handleOpenMix(mix)}
                    onOptions={() => setMenuMix(mix)}
                  />
                ))}
                {row.length === 1 && <View style={{ width: CARD_W }} />}
              </View>
            ))}
          </View>
        )}
      </Animated.ScrollView>

      {/* ── Sticky header (aparece al scrollear) ── */}
      <Animated.View
        pointerEvents="box-none"
        style={[styles.stickyHeader, { paddingTop: topPad, opacity: stickyOpacity, backgroundColor: theme.gradient[0] }]}
      >
        <BackPill onPress={() => router.back()} size={27} bgColor="rgba(255,255,255,0.10)" iconOffsetX={-1} />
        <View style={{ flex: 1, alignItems: "center", paddingTop: 8 }}>
          <Text style={styles.stickyTitle} numberOfLines={1}>Todas las creaciones</Text>
        </View>
        <View style={{ width: 36 }} />
      </Animated.View>

      <MixContextMenu
        mix={menuMix}
        onClose={() => setMenuMix(null)}
        onViewCreator={handleViewCreator}
        colors={colors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#1B060F" },
  scroll: { flex: 1 },

  /* ── Header ── */
  header: { paddingHorizontal: H_PAD, paddingBottom: 8 },

  /* ── Profile card ── */
  profileCard: { marginHorizontal: H_PAD, marginTop: 0, paddingBottom: 14, gap: 6, alignItems: "center" },
  profileTitle: { fontFamily: "Manrope", fontSize: 20, fontWeight: "800", color: TEXT, letterSpacing: 0.3, textAlign: "center" },
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 18,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
    zIndex: 10,
  },
  stickyTitle: { fontFamily: "Manrope", fontSize: 16, fontWeight: "700", color: TEXT, letterSpacing: 0.2 },
  profileDesc: { fontFamily: "Manrope", fontSize: 14, color: "rgba(255,255,255,0.90)", lineHeight: 19, textAlign: "center", maxWidth: 280, marginBottom: 4 },

  /* ── Chips ── */
  chipsArea: { paddingTop: 10, paddingBottom: 15 },
  chipRow: { flexGrow: 0 },
  chipRowContent: { flexDirection: "row", gap: 8, paddingVertical: 2, paddingHorizontal: H_PAD },
  chip: { minWidth: 96, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  chipText: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600", color: TEXT, textAlign: "center" },
  chipTextSel: { color: "#1B060F" },

  /* ── Grid ── */
  gridOuter: { paddingHorizontal: H_PAD, gap: GRID_GAP },
  gridRow: { flexDirection: "row", gap: GRID_GAP },

  /* ── Empty ── */
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 6, paddingHorizontal: H_PAD },
  emptyText: { fontFamily: "Manrope", fontSize: 14, fontWeight: "600", color: TEXT },
  emptySub: { fontFamily: "Manrope", fontSize: 12, textAlign: "center", color: MUTED },
});
