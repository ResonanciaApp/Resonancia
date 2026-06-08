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
import { SESSIONS, type AncestralTag, type Session } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

const H_PAD = 20;
const RATINGS_KEY = "@resonance_ratings";
const ACCENT = "#BE9650";
const BG_GRADIENT = ["#090D20", "#080A18", "#06070F"] as const;

type TabDef = {
  label: string;
  value: string;
  icon: string;
  tags: AncestralTag[];
};

const TABS: TabDef[] = [
  { label: "Cuencos",  value: "Cuencos",  icon: "bowl-mix",              tags: ["Cuencos Tibetanos", "Cuencos de Cuarzo", "Mix de Cuencos"] },
  { label: "Gongs",    value: "Gongs",    icon: "record-circle-outline", tags: ["Gongs"] },
  { label: "Campanas", value: "Campanas", icon: "bell-outline",          tags: [] },
  { label: "Vientos",  value: "Vientos",  icon: "weather-windy",         tags: ["Vientos"] },
];

const TABS_EXTRA: TabDef[] = [
  { label: "Cantos",    value: "Cantos",    icon: "account-voice",  tags: ["Cantos"] },
  { label: "Percusión", value: "Percusión", icon: "drum",           tags: ["Percusión"] },
  { label: "Selva",     value: "Selva",     icon: "tree",           tags: ["Selva"] },
  { label: "Mixto",     value: "Mixto",     icon: "layers-triple",  tags: ["Cuencos y Gongs", "Full Instrumentos"] },
];

export default function SonidosAncestalesScreen() {
  const colors = useColors();
  const { version } = useCatalog();
  const { sortKey, setSortKey, sortLabel, sortSessions } = useSessionSort();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  // Cálculo de ancho estilo tiles de Geometrix: muestra 3 tabs y un poco del
  // 4º (divisor 3.3). Gap 8 para igualar la separación de las tabs de Música.
  const tabW = (width - H_PAD * 2 - 8 * 3) / 3.3;

  const [activeTab, setActiveTab] = useState<string>(TABS[0].value);
  const [query, setQuery] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [actionsSession, setActionsSession] = useState<Session | null>(null);

  const searchAnim = useRef(new Animated.Value(0)).current;
  const searchInputRef = useRef<TextInput>(null);
  const inputMaxWidth = width - H_PAD * 2 - 40 - 40 - 16; // backBtn + searchBtn + 2×gap

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

  const ancestralSessions = useMemo(
    () => SESSIONS.filter((s) => s.categoryId === "sonidos-ancestrales"),
    [version],
  );

  const tabSessions = useMemo(() => {
    const tab = [...TABS, ...TABS_EXTRA].find((t) => t.value === activeTab);
    const tags = tab?.tags ?? [];
    const list = ancestralSessions.filter(
      (s) => s.ancestralTag != null && tags.includes(s.ancestralTag),
    );
    return [...list].sort((a, b) => parseInt(b.id) - parseInt(a.id));
  }, [ancestralSessions, activeTab]);

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
                  placeholder="Buscar en Ancestrales…"
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
            <MaterialCommunityIcons name="bowl-mix" size={63} color={ACCENT} />
          </View>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Ancestrales</Text>
          <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
            Cuencos, gongs y frecuencias sagradas
          </Text>
        </View>

        {/* Tabs — una sola fila horizontal, deslizable. Mismo tamaño, border
            radius y lógica que los tiles de Geometrix (cuadrados, 3.3 visibles).
            Colores conservados (icono activo dorado, fondo activo azulado). */}
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
                  color={sel ? "#D6933A" : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: "#FFFFFF",
                      fontWeight: sel ? "700" : "400",
                    },
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
            <Feather
              name={query.trim() ? "search" : "music"}
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
          accentColor={"#C4956A"}
          heading="¿Qué son los sonidos ancestrales?"
          items={[
            {
              icon: "radio",
              title: "Frecuencias que sanan",
              body: "Cuencos tibetanos, campanas y tonos puros que resuenan en el cuerpo a nivel celular, liberando tensión acumulada.",
            },
            {
              icon: "zap",
              title: "Entrás en coherencia",
              body: "El cerebro se sincroniza con las ondas sonoras, induciendo estados de relajación profunda y mayor claridad mental.",
            },
            {
              icon: "globe",
              title: "Tradición milenaria",
              body: "Estas técnicas se usaron durante siglos en tradiciones chamánicas y budistas para ceremonias de sanación y rituales de paso.",
            },
          ]}
          quote="El sonido es el puente entre el mundo visible y el invisible."
          whyItems={[
            { icon: "music", text: "Porque el cuerpo recuerda lo que la mente olvidó." },
            { icon: "wind", text: "Porque la sabiduría ancestral sigue siendo necesaria hoy." },
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
    backgroundColor: "rgba(255,255,255,0.03)",
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
    backgroundColor: "rgba(255,255,255,0.06)",
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
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  tabBlockActive: {
    backgroundColor: "rgba(100,142,195,0.14)",
  },
  tabLabel: { fontSize: 12, letterSpacing: 0.1, textAlign: "center" },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginTop: 16,
  },

  emptyWrap: { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 16, textAlign: "center" },
});
