import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CategoryInfoPanel } from "@/components/CategoryInfoPanel";
import { SessionActionsSheet } from "@/components/SessionActionsSheet";
import { SessionRow } from "@/components/SessionRow";
import { SessionSortHeader } from "@/components/SessionSortHeader";
import { useCatalog } from "@/context/CatalogContext";
import { useSessionSort } from "@/hooks/useSessionSort";
import { SESSIONS, type Session } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

const H_PAD = 20;
const RATINGS_KEY = "@resonance_ratings";
const ACCENT = "#D4AF37";
const BG_GRADIENT = ["#4A0C0C", "#27070E", "#1B060F"] as const;

type TabDef = {
  label: string;
  value: string;
  icon: string;
  tags: string[];
};

const TABS: TabDef[] = [
  { label: "Gratitud",  value: "Gratitud",  icon: "heart-outline",         tags: ["Gratitud"] },
  { label: "Propósito", value: "Propósito", icon: "star-outline",          tags: ["Propósito"] },
  { label: "Presencia", value: "Presencia", icon: "eye-outline",           tags: ["Presencia", "Mindfulness"] },
  { label: "Silencio",  value: "Silencio",  icon: "volume-off",            tags: ["Silencio"] },
];

const TABS_EXTRA: TabDef[] = [
  { label: "Sabiduría",     value: "Sabiduría",     icon: "lightbulb-outline",       tags: ["Sabiduría"] },
  { label: "Contemplación", value: "Contemplación", icon: "flower-outline",          tags: ["Contemplación"] },
  { label: "Alma",          value: "Alma",           icon: "meditation",              tags: ["Alma"] },
  { label: "Diarias",       value: "Diarias",        icon: "calendar-today",          tags: ["Reflexión Diaria"] },
];

export default function ReflexionesScreen() {
  const colors = useColors();
  const { version } = useCatalog();
  const { sortKey, setSortKey, sortLabel, sortSessions } = useSessionSort();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const tabW = (width - H_PAD * 2 - 8 * 3) / 3.3;

  const [activeTab, setActiveTab] = useState<string>(TABS[0].value);
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

  const reflexionesSessions = useMemo(
    () => SESSIONS.filter((s) => s.categoryId === "reflexiones"),
    [version],
  );

  const tabSessions = useMemo(() => {
    const tab = [...TABS, ...TABS_EXTRA].find((t) => t.value === activeTab);
    const tags = tab?.tags ?? [];
    const list = reflexionesSessions.filter(
      (s) =>
        tags.length === 0 ||
        (Array.isArray((s as any).themeTag) &&
          (s as any).themeTag.some((t: string) => tags.includes(t))),
    );
    return [...list].sort((a, b) => parseInt(b.id) - parseInt(a.id));
  }, [reflexionesSessions, activeTab]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? tabSessions.filter((s) => s.title.toLowerCase().includes(q)) : tabSessions;
  }, [tabSessions, query]);

  const sorted = useMemo(
    () => sortSessions(filtered, ratings),
    [filtered, sortSessions, ratings],
  );

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
        contentContainerStyle={{ paddingBottom: 40 + bottomPad }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: H_PAD, paddingTop: topPad + 8 }]}>
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
                  placeholder="Buscar en Reflexiones…"
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
            <MaterialCommunityIcons name="thought-bubble-outline" size={63} color={ACCENT} />
          </View>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Reflexiones</Text>
          <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
            Contemplaciones y sabiduría para el alma
          </Text>
        </View>

        {/* Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
          contentContainerStyle={[styles.tabRow, { paddingHorizontal: H_PAD }]}
        >
          {[...TABS, ...TABS_EXTRA].map(({ label, value, icon }) => {
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
                  name={icon as never}
                  size={24}
                  color={sel ? "#D4AF37" : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    { color: "#FFFFFF", fontWeight: sel ? "700" : "400" },
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Línea divisora */}
        <View style={[styles.divider, { marginHorizontal: H_PAD }]} />

        {/* Contenido */}
        {filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons
              name={query.trim() ? "magnify" : "thought-bubble-outline"}
              size={32}
              color={colors.mutedForeground}
              style={{ marginBottom: 12 }}
            />
            <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
              {query.trim() ? "Sin resultados" : "Próximamente"}
            </Text>
          </View>
        ) : (
          <View style={{ paddingTop: 24 }}>
            <SessionSortHeader
              title={sortLabel}
              sortKey={sortKey}
              onChange={setSortKey}
              accentColor={ACCENT}
              style={{ paddingHorizontal: H_PAD, marginBottom: 12 }}
            />
            {sorted.map((s) => (
              <SessionRow
                key={s.id}
                session={s}
                rating={ratings[s.id]}
                style={{ marginHorizontal: H_PAD }}
                onActionsPress={() => setActionsSession(s)}
              />
            ))}
          </View>
        )}

        <CategoryInfoPanel
          accentColor={ACCENT}
          heading="¿Qué son las Reflexiones?"
          items={[
            {
              icon: "eye",
              title: "Mirada interior",
              body: "Un espacio para pausar el ruido externo y volver a lo esencial: tus pensamientos, emociones y la sabiduría que ya habita en vos.",
            },
            {
              icon: "wind",
              title: "Contemplación activa",
              body: "A través de palabras, preguntas y silencios guiados, cada reflexión abre una puerta hacia una comprensión más profunda de tu experiencia.",
            },
            {
              icon: "compass",
              title: "Ancla en el presente",
              body: "Las reflexiones te ayudan a integrar lo vivido, clarificar el rumbo y reencontrarte con lo que verdaderamente importa.",
            },
          ]}
          quote="La vida no examinada no merece ser vivida."
          whyItems={[
            { icon: "feather", text: "Porque la claridad surge cuando te detenés a escucharte." },
            { icon: "heart", text: "Porque reflexionar es un acto de amor propio." },
          ]}
        />
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

  header: { alignItems: "center", marginBottom: 29, paddingTop: 4 },
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
  tabBlockActive: {
    backgroundColor: "rgba(212,175,55,0.14)",
  },
  tabLabel: { fontSize: 12, letterSpacing: 0.1, textAlign: "center" },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(74,12,12,0.08)",
    marginTop: 16,
  },

  emptyWrap: { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 16, textAlign: "center" },
});
