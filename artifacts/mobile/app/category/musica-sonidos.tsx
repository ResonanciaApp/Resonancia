import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
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
import { useCatalog } from "@/context/CatalogContext";
import { SESSIONS, type Session, type SoundTag } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

const H_PAD = 20;
const RATINGS_KEY = "@resonance_ratings";

type Tab = SoundTag;

const MUSICA_ACCENT = "#BE9650";

const TABS: { label: string; value: Tab; icon: string }[] = [
  { label: "Ambient",   value: "Música Ambient",   icon: "weather-cloudy"  },
  { label: "Enteógena", value: "Música Enteógena", icon: "leaf"            },
  { label: "Tribal",    value: "Música Tribal",    icon: "ocarina"         },
  { label: "Étnica",    value: "Música Étnica",    icon: "guitar-acoustic" },
];

export default function MusicaSonidosScreen() {
  const colors = useColors();
  const { isPremium } = usePremium();
  const insets = useSafeAreaInsets();
  const { playSession, history } = usePlayer();
  const { version } = useCatalog();

  const [activeTab, setActiveTab] = useState<Tab>("Música Ambient");
  const [query, setQuery] = useState("");
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [actionsSession, setActionsSession] = useState<Session | null>(null);

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
          <View style={[styles.catIconCircle, { backgroundColor: MUSICA_ACCENT + "1A" }]}>
            <ExpoImage
              source={require("../../assets/images/cat-musica.png")}
              style={{ width: 34, height: 34 }}
              tintColor="#BE9650"
              contentFit="contain"
            />
          </View>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Música</Text>
          <Text style={[styles.pageSub, { color: "#FFFFFF" }]}>
            Temas exclusivos para ti
          </Text>
          <View style={styles.searchBar}>
            <Feather name="search" size={17} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="Buscar en Música…"
              placeholderTextColor={colors.mutedForeground}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
            />
          </View>
        </View>

        {/* Tabs — bloques con ícono */}
        <View style={[styles.tabRow, { paddingHorizontal: H_PAD }]}>
          {TABS.map(({ label, value, icon }) => {
            const sel = activeTab === value;
            return (
              <Pressable
                key={value}
                onPress={() => setActiveTab(value)}
                style={[styles.tabBlock, sel && styles.tabBlockActive]}
                accessibilityRole="tab"
                accessibilityState={{ selected: sel }}
              >
                <MaterialCommunityIcons
                  name={icon as any}
                  size={24}
                  color={sel ? "#FFFFFF" : colors.mutedForeground}
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
        </View>

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
    width: 60, height: 60,
    borderRadius: 30,
    alignItems: "center", justifyContent: "center",
    marginBottom: 12,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  pageTitle: { fontSize: 26, fontWeight: "700", letterSpacing: 0.2, marginBottom: 4, textAlign: "center" },
  pageSub: { fontSize: 13, lineHeight: 19, textAlign: "center" },
  searchBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    alignSelf: "stretch",
    backgroundColor: "#151A23",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    marginTop: 18,
  },
  searchInput: { flex: 1, fontSize: 14, padding: 0 },

  tabRow: { flexDirection: "row", gap: 10 },
  tabBlock: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    gap: 8,
    paddingTop: 14,
    paddingBottom: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  tabBlockActive: { backgroundColor: "rgba(107,154,181,0.14)" },
  tabLabel: { fontSize: 12, letterSpacing: 0.1 },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginTop: 16,
  },

  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 0 },
  recentPlaceholder: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderRadius: 14, padding: 16, marginTop: 10, marginBottom: 28,
  },
  placeholderText: { flex: 1, fontSize: 13, lineHeight: 18 },

  emptyWrap: { alignItems: "center", paddingVertical: 60, width: "100%" },
  emptyText: { fontSize: 14, textAlign: "center" },
});
