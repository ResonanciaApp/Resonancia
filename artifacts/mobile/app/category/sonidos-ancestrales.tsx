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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CategoryInfoPanel } from "@/components/CategoryInfoPanel";
import { SessionActionsSheet } from "@/components/SessionActionsSheet";
import { SessionRow } from "@/components/SessionRow";
import { usePlayer } from "@/context/PlayerContext";
import { useCatalog } from "@/context/CatalogContext";
import { SESSIONS, type AncestralTag, type Session } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

const H_PAD = 20;
const RATINGS_KEY = "@resonance_ratings";
const ACCENT = "#C4956A";

type TabDef = {
  label: string;
  value: string;
  icon: string;
  tags: AncestralTag[];
};

const TABS: TabDef[] = [
  { label: "Cuencos",       value: "Cuencos",       icon: "bowl-mix",       tags: ["Cuencos Tibetanos", "Cuencos de Cuarzo", "Mix de Cuencos"] },
  { label: "Gongs",         value: "Gongs",         icon: "record-circle-outline", tags: ["Gongs"] },
  { label: "Campanas",      value: "Campanas",      icon: "bell-outline",   tags: [] },
  { label: "Mix",           value: "Mix Ancestral", icon: "layers-triple",  tags: ["Cuencos y Gongs", "Full Instrumentos"] },
];

export default function SonidosAncestalesScreen() {
  const colors = useColors();
  const { history } = usePlayer();
  const { version } = useCatalog();
  const insets = useSafeAreaInsets();

  const [activeTab, setActiveTab] = useState<string>(TABS[0].value);
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

  const ancestralSessions = useMemo(
    () => SESSIONS.filter((s) => s.categoryId === "sonidos-ancestrales"),
    [version],
  );

  const tabSessions = useMemo(() => {
    const tab = TABS.find((t) => t.value === activeTab);
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

  const recentlyPlayed = useMemo(() => {
    const subIds = new Set(tabSessions.map((s) => s.id));
    const entry = [...history]
      .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())
      .find((e) => subIds.has(e.sessionId));
    return entry ? tabSessions.find((s) => s.id === entry.sessionId) ?? null : null;
  }, [history, tabSessions]);

  return (
    <View style={[styles.root, { backgroundColor: "#090F17" }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 40 + bottomPad }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: H_PAD, paddingTop: topPad + 8 }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <View style={[styles.catIconCircle, { backgroundColor: ACCENT + "1A" }]}>
            <MaterialCommunityIcons name="bowl-mix" size={34} color={ACCENT} />
          </View>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Ancestrales</Text>
          <Text style={[styles.pageSub, { color: "#FFFFFF" }]}>
            Cuencos, gongs y frecuencias sagradas
          </Text>
          <View style={styles.searchBar}>
            <Feather name="search" size={17} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="Buscar en Ancestrales…"
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
                style={[styles.tabBlock, sel && { backgroundColor: ACCENT + "24" }]}
                accessibilityRole="tab"
                accessibilityState={{ selected: sel }}
              >
                <MaterialCommunityIcons
                  name={icon as never}
                  size={24}
                  color={sel ? ACCENT : colors.mutedForeground}
                />
                <Text
                  style={[
                    styles.tabLabel,
                    {
                      color: sel ? colors.foreground : colors.mutedForeground,
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
            <Text style={[styles.sectionTitle, { color: colors.foreground, paddingHorizontal: H_PAD }]}>
              Escuchado Recientemente
            </Text>
            {recentlyPlayed ? (
              <SessionRow
                session={recentlyPlayed}
                rating={ratings[recentlyPlayed.id]}
                style={{ marginHorizontal: H_PAD, marginTop: 10, marginBottom: 24 }}
                onActionsPress={() => setActionsSession(recentlyPlayed)}
              />
            ) : (
              <View style={[styles.recentPlaceholder, { marginHorizontal: H_PAD, backgroundColor: "#151A23" }]}>
                <Feather name="headphones" size={28} color={colors.mutedForeground} />
                <Text style={[styles.placeholderText, { color: colors.mutedForeground }]}>
                  Aún no escuchaste ninguna sesión en esta categoría
                </Text>
              </View>
            )}

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
              />
            ))}
          </View>
        )}

        <CategoryInfoPanel
          accentColor={ACCENT}
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
    paddingHorizontal: 4,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  tabLabel: { fontSize: 12, letterSpacing: 0.1, textAlign: "center" },
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

  emptyWrap: { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 16, textAlign: "center" },
});
