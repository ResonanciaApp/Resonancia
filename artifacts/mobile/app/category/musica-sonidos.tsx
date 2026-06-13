import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CategoryInfoPanel } from "@/components/CategoryInfoPanel";
import { SessionActionsSheet } from "@/components/SessionActionsSheet";
import { SessionRow } from "@/components/SessionRow";
import { SessionSortHeader } from "@/components/SessionSortHeader";
import { useSessionSort } from "@/hooks/useSessionSort";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { useCatalog } from "@/context/CatalogContext";
import { SESSIONS, type Session, type SoundTag } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

const H_PAD = 20;
const RATINGS_KEY = "@resonance_ratings";

type Tab = SoundTag;

const MUSICA_ACCENT = "#72BF78";

const TABS: { label: string; value: Tab; icon: string }[] = [
  { label: "Ambient",   value: "Música Ambient",   icon: "weather-cloudy"  },
  { label: "Enteógena", value: "Música Enteógena", icon: "leaf"            },
  { label: "Tribal",    value: "Música Tribal",    icon: "ocarina"         },
  { label: "Étnica",    value: "Música Étnica",    icon: "guitar-acoustic" },
];

const BG_GRADIENT = ["#4A0C0C", "#27070E", "#1B060F"] as const;

export default function MusicaSonidosScreen() {
  const colors = useColors();
  const { isPremium } = usePremium();
  const insets = useSafeAreaInsets();
  const { playSession } = usePlayer();
  const { sortKey, setSortKey, sortLabel, sortSessions } = useSessionSort();
  const { version } = useCatalog();
  const { width } = useWindowDimensions();

  const tabW = (width - H_PAD * 2 - 8 * 3) / 3.3;

  const [activeTab, setActiveTab] = useState<Tab>("Música Ambient");
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [actionsSession, setActionsSession] = useState<Session | null>(null);

  const searchAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);
  const inputMaxWidth = width - H_PAD * 2 - 40 - 40 - 16;

  useEffect(() => {
    Animated.timing(searchAnim, {
      toValue: searchOpen ? 1 : 0,
      duration: 220,
      useNativeDriver: false,
    }).start(() => {
      if (searchOpen) searchInputRef.current?.focus();
    });
    if (!searchOpen) setQuery("");
  }, [searchOpen]);

  useEffect(() => {
    AsyncStorage.getItem(RATINGS_KEY).then((val) => {
      if (val) setRatings(JSON.parse(val));
    });
  }, []);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const musicaSessions = useMemo(
    () => SESSIONS.filter((s) => s.categoryId === "musica-sonidos"),
    [version],
  );

  const tabSessions = useMemo(
    () => musicaSessions.filter((s) => s.soundTag === activeTab),
    [musicaSessions, activeTab],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? tabSessions.filter((s) => s.title.toLowerCase().includes(q)) : tabSessions;
  }, [tabSessions, query]);

  const sorted = useMemo(
    () => sortSessions(filtered, ratings),
    [filtered, sortSessions, ratings],
  );

  const handlePress = (session: Session) => {
    if (session.isPremium && !isPremium) {
      router.push("/membresia" as never);
      return;
    }
    playSession(session);
    router.push("/player" as never);
  };

  return (
        <LinearGradient
      style={styles.root}
      colors={BG_GRADIENT}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 120 + bottomPad, paddingTop: topPad + 8 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: H_PAD }]}>
          {/* Fila superior: atrás ← [input animado →] lupa */}
          <View style={styles.topRow}>
            <Pressable onPress={() => router.back()} style={styles.backBtn}>
              <Feather name="arrow-left" size={22} color="#FFFFFF" />
            </Pressable>
            <Animated.View
              style={{
                width: searchAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, inputMaxWidth],
                }),
                opacity: searchAnim.interpolate({
                  inputRange: [0, 0.4, 1],
                  outputRange: [0, 0, 1],
                }),
                overflow: "hidden",
              }}
            >
              <View style={styles.searchBar}>
                <TextInput
                  ref={searchInputRef}
                  style={[styles.searchInput, { color: colors.foreground }]}
                  placeholder="Buscar en Música…"
                  placeholderTextColor={colors.mutedForeground}
                  value={query}
                  onChangeText={setQuery}
                  returnKeyType="search"
                />
              </View>
            </Animated.View>
            <Pressable
              onPress={() => setSearchOpen((v) => !v)}
              style={styles.searchBtn}
            >
              <Feather name="search" size={19} color="#FFFFFF" />
            </Pressable>
          </View>
          <View style={styles.catIconCircle}>
            <ExpoImage
              source={require("../../assets/images/cat-musica.png")}
              style={{ width: 63, height: 63 }}
              contentFit="contain"
            />
          </View>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Música</Text>
          <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
            Temas exclusivos para ti
          </Text>
        </View>

        {/* Tabs — deslizables, 3.3 visibles */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
          contentContainerStyle={[styles.tabRow, { paddingHorizontal: H_PAD }]}
        >
          {TABS.map(({ label, value, icon }) => {
            const sel = activeTab === value;
            return (
              <Pressable
                key={value}
                onPress={() => setActiveTab(value)}
                style={[styles.tabBlock, { width: tabW }, sel && styles.tabBlockActive]}
                accessibilityRole="tab"
                accessibilityState={{ selected: sel }}
              >
                <MaterialCommunityIcons
                  name={icon as any}
                  size={24}
                  color={sel ? MUSICA_ACCENT : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: "#FFFFFF",
                      fontWeight: sel ? "700" : "400",
                    },
                  ]}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Línea divisora entre tabs y sesiones */}
        <View style={[styles.divider, { marginHorizontal: H_PAD }]} />

        {/* Contenido */}
        {filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Feather name="search" size={32} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Sin resultados</Text>
          </View>
        ) : (
          <View style={{ paddingTop: 24 }}>
            <SessionSortHeader
              title={sortLabel}
              sortKey={sortKey}
              onChange={setSortKey}
              accentColor={MUSICA_ACCENT}
              style={{ paddingHorizontal: H_PAD, marginBottom: 12 }}
            />
            {sorted.map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                rating={ratings[s.id]}
                style={{ marginHorizontal: H_PAD }}
                onActionsPress={() => setActionsSession(s)}
                onPress={() => handlePress(s)}
              />
            ))}
          </View>
        )}
      </ScrollView>

      <SessionActionsSheet
        session={actionsSession}
        visible={actionsSession !== null}
        onClose={() => setActionsSession(null)}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },

  header: { alignItems: "center", marginBottom: 25, paddingTop: 4 },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    alignSelf: "stretch",
    marginBottom: 16,
  },
  backBtn: {
    width: 40, height: 40,
    alignItems: "center", justifyContent: "center",
  },
  searchBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(74,12,12,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  catIconCircle: {
    width: 60, height: 60,
    borderRadius: 30,
    alignItems: "center", justifyContent: "center",
    marginBottom: 12,
  },
  pageTitle: { fontSize: 26, fontWeight: "700", letterSpacing: 0.2, marginBottom: 4, textAlign: "center" },
  pageSub: { fontSize: 13, lineHeight: 19, textAlign: "center" },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    backgroundColor: "rgba(74,12,12,0.08)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 7,
    height: 40,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },

  tabScroll: { flexGrow: 0 },
  tabRow: { flexDirection: "row", gap: 8, paddingVertical: 2 },
  tabBlock: {
    aspectRatio: 1,
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: "rgba(74,12,12,0.08)",
  },
  tabBlockActive: { backgroundColor: "rgba(114,191,120,0.14)" },
  tabLabel: { fontSize: 12, letterSpacing: 0.1, textAlign: "center" },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(74,12,12,0.08)",
    marginTop: 16,
  },

  emptyWrap: { alignItems: "center", paddingVertical: 60, width: "100%" },
  emptyText: { fontSize: 14, textAlign: "center" },
});
