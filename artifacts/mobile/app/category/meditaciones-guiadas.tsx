import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { ZenStonesIcon } from "@/components/ZenStonesIcon";
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
import { SESSIONS } from "@/data/sessions";
import type { Session } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

const H_PAD = 20;
const ICON_COLOR = "#8B82BE";
const RATINGS_KEY = "@resonance_ratings";

type TabDef = {
  label: string;
  value: string;
  icon: string;
  tags: string[];
};

const TABS: TabDef[] = [
  { label: "Observación",      value: "Observación",      icon: "eye-outline",     tags: ["No Duales"] },
  { label: "Visualizaciones",  value: "Visualizaciones",  icon: "creation",        tags: ["Visualizaciones"] },
  { label: "Escaneo Corporal", value: "Escaneo Corporal", icon: "human",           tags: ["Escaneo Corporal"] },
];

export default function MeditacionesGuiadasScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { history } = usePlayer();
  const { version } = useCatalog();

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

  const allSessions = useMemo(
    () => SESSIONS.filter((s) => s.categoryId === "meditaciones-guiadas"),
    [version],
  );

  const tabSessions = useMemo(() => {
    const tab = TABS.find((t) => t.value === activeTab);
    const tags = tab?.tags ?? [];
    return allSessions.filter((s) => {
      const mt = (s as Session & { meditationTag?: string }).meditationTag;
      return mt != null && tags.includes(mt);
    });
  }, [allSessions, activeTab]);

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
          <View style={[styles.catIconCircle, { backgroundColor: ICON_COLOR + "1A" }]}>
            <ZenStonesIcon color={ICON_COLOR} size={42} />
          </View>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Meditaciones</Text>
          <Text style={[styles.pageSub, { color: "#FFFFFF" }]}>
            Déjate llevar por la voz y el sonido
          </Text>
          <View style={styles.searchBar}>
            <Feather name="search" size={17} color={colors.mutedForeground} />
            <TextInput
              style={[styles.searchInput, { color: colors.foreground }]}
              placeholder="Buscar en Meditaciones…"
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
                style={[styles.tabBlock, sel && { backgroundColor: ICON_COLOR + "24" }]}
                accessibilityRole="tab"
                accessibilityState={{ selected: sel }}
              >
                <MaterialCommunityIcons
                  name={icon as never}
                  size={24}
                  color={sel ? ICON_COLOR : colors.mutedForeground}
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
              name={query.trim() ? "search" : "eye"}
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
          accentColor={ICON_COLOR}
          heading="¿Qué es la meditación guiada?"
          items={[
            {
              icon: "mic",
              title: "Una voz te acompaña",
              body: "No estás solo/a. Cada sesión tiene una guía de audio que conduce tu atención paso a paso, sin necesidad de experiencia previa.",
            },
            {
              icon: "activity",
              title: "Entrena tu mente",
              body: "La práctica regular reduce el estrés, mejora el foco y calma el sistema nervioso. Con cada sesión, el silencio interior se hace más accesible.",
            },
            {
              icon: "clock",
              title: "Para cualquier momento",
              body: "Desde 5 minutos hasta una hora, hay sesiones para integrar en cualquier rutina del día.",
            },
          ]}
          quote="La meditación no es vaciar la mente, es aprender a observarla sin juzgarla."
          whyItems={[
            { icon: "heart", text: "Porque todos merecemos un espacio de silencio interior." },
            { icon: "sun", text: "Porque la paz no viene de afuera — se cultiva desde adentro." },
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
