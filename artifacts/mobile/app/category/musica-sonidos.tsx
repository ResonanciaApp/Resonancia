import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  LayoutChangeEvent,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ArtistCard } from "@/components/ArtistCard";
import { CategoryInfoPanel } from "@/components/CategoryInfoPanel";
import { PremiumBadge } from "@/components/PremiumBadge";
import { getFeaturedArtists } from "@/data/artists";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { SESSIONS, type Session, type SoundTag } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");
const H_PAD = 20;
const GAP = 10;
const COLS = 3;
const CARD_WIDTH = ((width - H_PAD * 2 - GAP * (COLS - 1)) / COLS) * 0.85 + 12;
const IMG_SIZE = CARD_WIDTH - 10;

type Tab = SoundTag;

const TABS: { label: string; value: Tab }[] = [
  { label: "Ambient",   value: "Música Ambient"   },
  { label: "Enteógena", value: "Música Enteógena" },
  { label: "Étnica", value: "Música Étnica" },
];

const PAGE_SIZE = 24;

const TAG_COLORS: Record<SoundTag, { bg: string; text: string }> = {
  "Música Ambient": { bg: "rgba(255,255,255,0.1)", text: "rgba(255,255,255,0.65)" },
  "Música Enteógena": { bg: "rgba(182,149,95,0.18)", text: "rgba(230,195,120,0.9)" },
  "Música Étnica": { bg: "rgba(255,255,255,0.1)", text: "rgba(255,255,255,0.65)" },
};

const TAG_ICONS: Record<SoundTag, React.ComponentProps<typeof Feather>["name"]> = {
  "Música Ambient": "music",
  "Música Enteógena": "zap",
  "Música Étnica": "music",
};

const TAG_BADGE_LABELS: Record<SoundTag, string> = {
  "Música Ambient": "Ambient",
  "Música Enteógena": "Enteógena",
  "Música Étnica": "Étnica",
};

const MUSICA_SESSIONS = SESSIONS.filter((s) => s.categoryId === "musica-sonidos");
const MUSICA_ORDER = new Map(MUSICA_SESSIONS.map((s, i) => [s.id, i]));

export default function MusicaSonidosScreen() {
  const colors = useColors();
  const { isPremium } = usePremium();
  const insets = useSafeAreaInsets();
  const { isFavorite, toggleFavorite, playSession } = usePlayer();

  const featuredArtists = getFeaturedArtists();

  const [activeTab, setActiveTab] = useState<Tab>("Música Ambient");

  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const [indicatorWidth, setIndicatorWidth] = useState(0);
  const tabLayouts = useRef<Record<number, { x: number; width: number }>>({});

  const onTabLayout = (idx: number, e: LayoutChangeEvent) => {
    const { x, width: w } = e.nativeEvent.layout;
    tabLayouts.current[idx] = { x, width: w };
    if (idx === 0) {
      setIndicatorWidth(w);
      indicatorAnim.setValue(x);
    }
  };

  const selectTab = (tab: Tab, idx: number) => {
    setActiveTab(tab);
    const layout = tabLayouts.current[idx];
    if (layout) {
      setIndicatorWidth(layout.width);
      Animated.spring(indicatorAnim, {
        toValue: layout.x,
        useNativeDriver: true,
        tension: 60,
        friction: 9,
      }).start();
    }
  };
  const [query, setQuery] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filtered = useMemo(() => {
    let list = MUSICA_SESSIONS.filter((s) => s.soundTag === activeTab);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter((s) => s.title.toLowerCase().includes(q));
    }
    return list;
  }, [activeTab, query]);

  const visible = filtered;

  return (
    <View style={[styles.root, { backgroundColor: "#090F17" }]}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#090F17", "#090F17"]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: 120 + bottomPad,
          paddingTop: topPad + 8,
        }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        scrollEventThrottle={16}
      >
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: H_PAD }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <View style={[styles.catIconCircle, { backgroundColor: "transparent", borderColor: "transparent" }]}>
            <ExpoImage
              source={require("../../assets/images/cat-musica.png")}
              style={{ width: 44, height: 44 }}
              contentFit="contain"
            />
          </View>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>
            Música
          </Text>
          <Text style={[styles.pageSub, { color: "#FFFFFF" }]}>
            Elige un sonido y conecta con el momento presente
          </Text>
        </View>

        {/* Search */}
        <View style={[styles.searchWrap, { paddingHorizontal: H_PAD }]}>
          <View style={styles.searchBar}>
            <Feather name="search" size={16} color="rgba(122,143,168,0.5)" style={{ marginRight: 8 }} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar frecuencia..."
              placeholderTextColor="rgba(122,143,168,0.45)"
              style={[styles.searchInput, { color: colors.foreground }]}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <Feather name="x" size={14} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Filter Tabs */}
        <View style={[styles.tabBar, { borderBottomColor: "rgba(255,255,255,0.08)", paddingHorizontal: H_PAD }]}>
          {TABS.map(({ label, value }, idx) => (
            <Pressable
              key={value}
              onLayout={(e) => onTabLayout(idx, e)}
              onPress={() => selectTab(value, idx)}
              style={styles.tabItem}
            >
              <Text style={[
                styles.tabLabel,
                { color: value === activeTab ? colors.foreground : colors.mutedForeground },
              ]}>
                {label}
              </Text>
            </Pressable>
          ))}
          {indicatorWidth > 0 && (
            <Animated.View
              style={[
                styles.tabIndicator,
                { width: indicatorWidth, transform: [{ translateX: indicatorAnim }] },
              ]}
            />
          )}
        </View>

        {/* Grid */}
        <View style={[styles.grid, { paddingHorizontal: H_PAD }]}>
          {filtered.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Feather name="search" size={32} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Sin resultados
              </Text>
            </View>
          ) : (
            <View style={styles.gridRow}>
              {visible.map((session) => {
                const fav = isFavorite(session.id);
                const tag = session.soundTag;
                const tagStyle = tag ? TAG_COLORS[tag] : null;
                const tagIcon = tag ? TAG_ICONS[tag] : null;

                return (
                  <Pressable
                    key={session.id}
                    style={({ pressed }) => [
                      styles.card,
                      {
                        width: CARD_WIDTH,
                        backgroundColor: "transparent",
                        borderColor: "transparent",
                        borderWidth: 0,
                        opacity: pressed ? 0.82 : 1,
                      },
                    ]}
                    onPress={() => {
                      if (session.isPremium && !isPremium) {
                        router.push("/membresia" as never);
                      } else {
                        // Música Ambient / Enteógena / Étnica → duración fija
                        playSession(session);
                        router.push("/player" as never);
                      }
                    }}
                  >
                    {/* Full-bleed image */}
                    <View style={[styles.imgWrap, { width: CARD_WIDTH, height: CARD_WIDTH, borderRadius: 16, overflow: "hidden" }]}>
                      <ExpoImage
                        // eslint-disable-next-line @typescript-eslint/no-explicit-any
                        source={session.image as any}
                        style={[styles.img, { width: CARD_WIDTH, height: CARD_WIDTH, borderRadius: 0 }]}
                        contentFit="cover"
                        transition={IMAGE_TRANSITION}
                        cachePolicy="memory-disk"
                        placeholder={BLUR_PLACEHOLDER}
                      />
                      <PremiumBadge session={session} />
                    </View>

                    {/* Title */}
                    <Text
                      style={[styles.cardTitle, { color: colors.foreground }]}
                      numberOfLines={2}
                    >
                      {session.title}
                    </Text>
                  </Pressable>
                );
              })}
              {Array.from({
                length: (COLS - (visible.length % COLS)) % COLS,
              }).map((_, i) => (
                <View key={`ghost-${i}`} style={{ width: CARD_WIDTH }} />
              ))}
            </View>
          )}
        </View>

      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },

  artistsSection: { paddingHorizontal: 20, marginTop: 28 },
  artistsTitle: { fontSize: 18, fontWeight: "700", letterSpacing: 0.3, marginBottom: 6 },
  artistsSub: { fontSize: 13, lineHeight: 18, marginBottom: 4 },

  header: {
    alignItems: "center",
    marginBottom: 24,
    paddingTop: 4,
  },
  backBtn: {
    alignSelf: "flex-start",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  catIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 6,
    textAlign: "center",
  },
  pageSub: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },

  searchWrap: { marginBottom: 16 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#151A23",
    borderRadius: 14,
    borderWidth: 0,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
    margin: 0,
  },

  tabBar: {
    flexDirection: "row",
    borderBottomWidth: 1,
    position: "relative",
    marginBottom: 20,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLabel: { fontSize: 15, fontWeight: "600" },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    height: 2,
    backgroundColor: "#5B9E7A",
    borderRadius: 1,
  },

  grid: {},
  gridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: GAP,
    rowGap: 24,
    justifyContent: "space-between",
  },

  card: {
    borderRadius: 16,
    borderWidth: 0,
    overflow: "hidden",
    alignItems: "center",
    position: "relative",
    marginBottom: 4,
  },
  favBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
    padding: 2,
  },
  imgWrap: {
    position: "relative",
    marginBottom: 0,
    marginTop: 0,
  },
  img: {},
  tagBadge: {
    position: "absolute",
    bottom: 0,
    alignSelf: "center",
    left: "10%",
    right: "10%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 3,
    borderRadius: 10,
  },
  tagText: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  cardTitle: {
    fontSize: 11,
    fontWeight: "600",
    textAlign: "center",
    lineHeight: 15,
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,
  },

  emptyWrap: {
    alignItems: "center",
    paddingVertical: 60,
    width: "100%",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 10,
  },
  modalIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 2,
  },
  modalSub: {
    fontSize: 13,
  },
  modalHint: {
    fontSize: 12,
    marginBottom: 22,
    lineHeight: 18,
  },
  durationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  durationBtn: {
    width: (width - 48 - 20) / 3,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  timerLock: {
    position: "absolute",
    top: 7,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "rgba(214,168,91,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  durationNum: {
    fontSize: 22,
    fontWeight: "700",
    lineHeight: 26,
  },
  durationUnit: {
    fontSize: 11,
    fontWeight: "500",
  },
  cancelBtn: {
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 14,
    fontWeight: "600",
  },
});
