import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Animated,
  LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CategoryInfoPanel } from "@/components/CategoryInfoPanel";
import { SessionActionsSheet } from "@/components/SessionActionsSheet";
import { SessionRow } from "@/components/SessionRow";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { SESSIONS, type Session, type SoundTag } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

const H_PAD = 20;
const RATINGS_KEY = "@resonance_ratings";

type Tab = SoundTag;

const TABS: { label: string; value: Tab }[] = [
  { label: "Ambient",   value: "Música Ambient"   },
  { label: "Enteógena", value: "Música Enteógena" },
  { label: "Étnica",    value: "Música Étnica"    },
];

const MUSICA_SESSIONS = SESSIONS.filter((s) => s.categoryId === "musica-sonidos");

export default function MusicaSonidosScreen() {
  const colors = useColors();
  const { isPremium } = usePremium();
  const insets = useSafeAreaInsets();
  const { playSession, history } = usePlayer();

  const [activeTab, setActiveTab] = useState<Tab>("Música Ambient");
  const [query, setQuery] = useState("");
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [actionsSession, setActionsSession] = useState<Session | null>(null);

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

  useEffect(() => {
    AsyncStorage.getItem(RATINGS_KEY).then((val) => {
      if (val) setRatings(JSON.parse(val));
    });
  }, []);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const tabSessions = useMemo(
    () => MUSICA_SESSIONS.filter((s) => s.soundTag === activeTab),
    [activeTab],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return tabSessions;
    const q = query.trim().toLowerCase();
    return tabSessions.filter((s) => s.title.toLowerCase().includes(q));
  }, [tabSessions, query]);

  const recentlyPlayed = useMemo(() => {
    const subIds = new Set(tabSessions.map((s) => s.id));
    const entry = [...history]
      .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())
      .find((e) => subIds.has(e.sessionId));
    return entry ? tabSessions.find((s) => s.id === entry.sessionId) ?? null : null;
  }, [history, tabSessions]);

  const handlePress = (session: Session) => {
    if (session.isPremium && !isPremium) {
      router.push("/membresia" as never);
      return;
    }
    playSession(session);
    router.push("/player" as never);
  };

  return (
    <View style={[styles.root, { backgroundColor: "#090F17" }]}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={["#090F17", "#090F17"]} style={StyleSheet.absoluteFill} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 120 + bottomPad, paddingTop: topPad + 8 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: H_PAD }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <View style={styles.catIconCircle}>
            <ExpoImage
              source={require("../../assets/images/cat-musica.png")}
              style={{ width: 44, height: 44 }}
              contentFit="contain"
            />
          </View>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Música</Text>
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

        {/* Tabs */}
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
              style={[styles.tabIndicator, { width: indicatorWidth, transform: [{ translateX: indicatorAnim }] }]}
            />
          )}
        </View>

        {/* Contenido */}
        {filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Feather name="search" size={32} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Sin resultados</Text>
          </View>
        ) : (
          <View style={{ paddingTop: 24 }}>
            {/* Escuchado recientemente */}
            <Text style={[styles.sectionTitle, { color: colors.foreground, paddingHorizontal: H_PAD }]}>
              Escuchado Recientemente
            </Text>
            {recentlyPlayed ? (
              <SessionRow
                session={recentlyPlayed}
                rating={ratings[recentlyPlayed.id]}
                style={{ marginHorizontal: H_PAD, marginTop: 10, marginBottom: 24 }}
                onActionsPress={() => setActionsSession(recentlyPlayed)}
                onPress={() => handlePress(recentlyPlayed)}
              />
            ) : (
              <View style={[styles.recentPlaceholder, { marginHorizontal: H_PAD, backgroundColor: "#151A23" }]}>
                <Feather name="headphones" size={28} color={colors.mutedForeground} />
                <Text style={[styles.placeholderText, { color: colors.mutedForeground }]}>
                  Aún no escuchaste ninguna sesión en esta categoría
                </Text>
              </View>
            )}

            {/* Recientes */}
            <Text style={[styles.sectionTitle, { color: colors.foreground, paddingHorizontal: H_PAD, marginBottom: 10 }]}>
              Recientes
            </Text>
            {filtered.map((s) => (
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },

  header: { alignItems: "center", marginBottom: 24, paddingTop: 4 },
  backBtn: {
    alignSelf: "flex-start",
    width: 40, height: 40,
    alignItems: "center", justifyContent: "center",
    marginBottom: 16,
  },
  catIconCircle: {
    width: 56, height: 56,
    borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    marginBottom: 14,
  },
  pageTitle: { fontSize: 26, fontWeight: "700", letterSpacing: 0.2, marginBottom: 6, textAlign: "center" },
  pageSub: { fontSize: 13, lineHeight: 19, textAlign: "center" },

  searchWrap: { marginBottom: 16 },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#151A23",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0, margin: 0 },

  tabBar: { flexDirection: "row", borderBottomWidth: 1, position: "relative", marginBottom: 0 },
  tabItem: { paddingVertical: 10, paddingHorizontal: 4, marginRight: 22 },
  tabLabel: { fontSize: 15, fontWeight: "600" },
  tabIndicator: {
    position: "absolute", bottom: 0, height: 2,
    backgroundColor: "#FFFFFF", borderRadius: 1,
  },

  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 0 },
  recentPlaceholder: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderRadius: 14, padding: 16, marginBottom: 28,
  },
  placeholderText: { flex: 1, fontSize: 13, lineHeight: 18 },

  emptyWrap: { alignItems: "center", paddingVertical: 60, width: "100%" },
  emptyText: { fontSize: 14, textAlign: "center" },
});
