import { Feather } from "@expo/vector-icons";
import { ZenStonesIcon } from "@/components/ZenStonesIcon";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Animated,
  LayoutChangeEvent,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
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

type CategoryDef = {
  tag: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  description: string;
  longDescription: string;
  categoryIdFilter?: string;
};

const CATEGORIES: CategoryDef[] = [
  {
    tag: "No Duales",
    icon: "sun",
    description: "Despertar y observación del ser",
    longDescription:
      "Las meditaciones no-duales van más allá de la relajación: apuntan directamente a la naturaleza del observador. ¿Quién es el que observa los pensamientos? Esta pregunta, sostenida en silencio, abre una puerta a una experiencia de paz que no depende de las circunstancias.",
  },
  {
    tag: "Visualizaciones",
    icon: "eye",
    description: "Guías para visualizar y crear",
    longDescription:
      "La mente no distingue vívidamente entre lo imaginado y lo real: usa esa plasticidad. Las visualizaciones guiadas activan las mismas redes neuronales que la experiencia directa, permitiendo ensayar estados emocionales, metas y cambios de perspectiva desde dentro.",
  },
  {
    tag: "Mantras",
    icon: "radio",
    description: "Vibración y repetición sagrada",
    longDescription:
      "Un mantra no es una creencia — es una herramienta de enfoque. Su repetición rítmica ancla la atención, calma la mente reactiva y crea una resonancia interna que trasciende el significado literal. La vibración transforma.",
  },
  {
    tag: "Escaneo Corporal",
    icon: "user",
    description: "Conexión y presencia en el cuerpo",
    longDescription:
      "El cuerpo guarda todo lo que la mente procesó — y mucho de lo que no. El escaneo corporal es una práctica de escucha: recorrer cada zona con atención suave, sin juzgar, disolviendo tensiones que se volvieron invisibles de tan habituales.",
  },
  {
    tag: "Manifestación",
    icon: "zap",
    description: "Intención, foco y creación",
    longDescription:
      "Manifestar no es magia — es alinear intención, emoción y acción. Estas meditaciones trabajan la claridad sobre lo que querés, el estado emocional desde el cual lo atraés y la apertura para reconocerlo cuando llega.",
  },
  {
    tag: "3 Minutos de Sabiduría",
    icon: "sun",
    description: "Sabiduría condensada en 3 minutos",
    longDescription:
      "La profundidad no requiere tiempo: requiere presencia. Estos fragmentos condensan enseñanzas de distintas tradiciones en forma accesible, para que la sabiduría no quede solo en los libros sino que se integre en el día a día.",
  },
];

type ActiveTab = "Audios" | "Videos" | "Maestros";
const TABS: ActiveTab[] = ["Audios", "Videos", "Maestros"];

export default function MeditacionesGuiadasScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { history } = usePlayer();
  const { version } = useCatalog();

  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [descExpanded, setDescExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("Audios");
  const [actionsSession, setActionsSession] = useState<Session | null>(null);

  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const [indicatorWidth, setIndicatorWidth] = useState(0);
  const tabLayouts = useRef<{ x: number; width: number }[]>([]);

  const onTabLayout = (idx: number, e: LayoutChangeEvent) => {
    const { x, width } = e.nativeEvent.layout;
    tabLayouts.current[idx] = { x, width };
    if (idx === 0 && indicatorWidth === 0) {
      setIndicatorWidth(width);
      indicatorAnim.setValue(x);
    }
  };

  const selectTab = (tab: ActiveTab, idx: number) => {
    setActiveTab(tab);
    const layout = tabLayouts.current[idx];
    if (layout) {
      setIndicatorWidth(layout.width);
      Animated.spring(indicatorAnim, {
        toValue: layout.x,
        tension: 200,
        friction: 24,
        useNativeDriver: true,
      }).start();
    }
  };

  useEffect(() => {
    AsyncStorage.getItem(RATINGS_KEY).then((val) => {
      if (val) setRatings(JSON.parse(val));
    });
  }, []);

  useEffect(() => {
    setDescExpanded(false);
    setActiveTab("Audios");
    const layout = tabLayouts.current[0];
    if (layout) {
      setIndicatorWidth(layout.width);
      indicatorAnim.setValue(layout.x);
    }
  }, [selectedTag]);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const allSessions = useMemo(
    () => SESSIONS.filter((s) => s.categoryId === "meditaciones-guiadas"),
    [version],
  );

  const filteredSessions = useMemo(() => {
    let list = allSessions;
    if (selectedTag) {
      const cat = CATEGORIES.find((c) => c.tag === selectedTag);
      if (cat?.categoryIdFilter) {
        list = list.filter((s) => s.categoryId === cat.categoryIdFilter);
      } else {
        list = list.filter((s) => (s as Session & { meditationTag?: string }).meditationTag === selectedTag);
      }
    }
    return list;
  }, [allSessions, selectedTag]);

  const countByTag = useMemo(() => {
    const map: Record<string, number> = {};
    for (const cat of CATEGORIES) {
      if (cat.categoryIdFilter) {
        map[cat.tag] = allSessions.filter((s) => s.categoryId === cat.categoryIdFilter).length;
      } else {
        map[cat.tag] = allSessions.filter((s) => (s as Session & { meditationTag?: string }).meditationTag === cat.tag).length;
      }
    }
    return map;
  }, [allSessions]);

  const selectedCat = CATEGORIES.find((c) => c.tag === selectedTag);

  const recentlyPlayed = useMemo(() => {
    if (!selectedTag) return null;
    const subIds = new Set(filteredSessions.map((s) => s.id));
    const entry = [...history]
      .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())
      .find((e) => subIds.has(e.sessionId));
    return entry ? filteredSessions.find((s) => s.id === entry.sessionId) ?? null : null;
  }, [history, filteredSessions, selectedTag]);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Escuchá "${selectedTag}" en Resonancia — meditaciones guiadas para tu bienestar.`,
      });
    } catch {
      // silent
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: "#090F17" }]}>
      <StatusBar barStyle="light-content" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 40 + bottomPad }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ════════════════════════════════════
            VISTA LISTA DE SUBCATEGORÍAS
        ════════════════════════════════════ */}
        {!selectedTag && (
          <>
            <View style={[styles.header, { paddingHorizontal: H_PAD, paddingTop: topPad + 8 }]}>
              <Pressable onPress={() => router.back()} style={styles.backBtn}>
                <Feather name="arrow-left" size={22} color={colors.foreground} />
              </Pressable>
              <View style={styles.titleRow}>
                <View style={[styles.catIconCircle, { backgroundColor: "rgba(139,130,190,0.21)" }]}>
                  <ZenStonesIcon color={ICON_COLOR} size={40} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.pageTitle, { color: colors.foreground }]}>Meditaciones</Text>
                  <Text style={[styles.pageSub, { color: "#FFFFFF" }]}>
                    Déjate llevar por la voz y el sonido
                  </Text>
                </View>
              </View>
            </View>

            <View style={[styles.catList, { paddingHorizontal: H_PAD }]}>
              {CATEGORIES.map((cat, idx) => {
                const isLast = idx === CATEGORIES.length - 1;
                return (
                  <Pressable
                    key={cat.tag}
                    onPress={() => setSelectedTag(cat.tag)}
                    style={({ pressed }) => [
                      styles.catRow,
                      !isLast && { borderBottomWidth: 1, borderBottomColor: "rgba(182,149,95,0.08)" },
                      { opacity: pressed ? 0.75 : 1 },
                    ]}
                  >
                    <View style={styles.iconCircle}>
                      <Feather name={cat.icon} size={22} color={ICON_COLOR} />
                    </View>
                    <Text style={[styles.catName, { color: colors.foreground }]}>{cat.tag}</Text>
                    <View style={styles.catRight}>
                      <Text style={[styles.catCount, { color: colors.foreground }]}>
                        {countByTag[cat.tag] ?? 0}
                      </Text>
                      <Feather name="chevron-right" size={17} color={colors.foreground} />
                    </View>
                  </Pressable>
                );
              })}
            </View>

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
          </>
        )}

        {/* ════════════════════════════════════
            VISTA DETALLE DE SUBCATEGORÍA
        ════════════════════════════════════ */}
        {selectedTag && selectedCat && (
          <>
            {/* Top bar */}
            <View style={[styles.detailTopBar, { paddingTop: topPad + 8, paddingHorizontal: H_PAD }]}>
              <Pressable onPress={() => setSelectedTag(null)} style={styles.iconBtn}>
                <Feather name="arrow-left" size={22} color={colors.foreground} />
              </Pressable>
              <Pressable onPress={handleShare} style={styles.iconBtn}>
                <Feather name="share" size={20} color={colors.foreground} />
              </Pressable>
            </View>

            {/* Título */}
            <Text style={[styles.detailTitle, { color: colors.foreground, paddingHorizontal: H_PAD }]}>
              {selectedTag}
            </Text>

            {/* Descripción colapsable */}
            <Pressable
              onPress={() => setDescExpanded((v) => !v)}
              style={{ paddingHorizontal: H_PAD, marginBottom: 20 }}
            >
              <Text
                style={[styles.detailDesc, { color: colors.foreground }]}
                numberOfLines={descExpanded ? undefined : 3}
              >
                {selectedCat.longDescription}
              </Text>
            </Pressable>

            {/* Tabs */}
            <View style={[styles.tabBar, { borderBottomColor: "rgba(255,255,255,0.08)" }]}>
              {TABS.map((tab, idx) => (
                <Pressable
                  key={tab}
                  onLayout={(e) => onTabLayout(idx, e)}
                  onPress={() => selectTab(tab, idx)}
                  style={styles.tabItem}
                >
                  <Text style={[
                    styles.tabLabel,
                    { color: tab === activeTab ? colors.foreground : colors.mutedForeground },
                  ]}>
                    {tab}
                  </Text>
                </Pressable>
              ))}
              {indicatorWidth > 0 && (
                <Animated.View
                  style={[
                    styles.tabIndicator,
                    { width: indicatorWidth, backgroundColor: ICON_COLOR, transform: [{ translateX: indicatorAnim }] },
                  ]}
                />
              )}
            </View>

            {/* ── Tab: Audios ── */}
            {activeTab === "Audios" && (
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
                {filteredSessions.length === 0 ? (
                  <View style={styles.emptyWrap}>
                    <Feather name="eye" size={32} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
                    <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Próximamente</Text>
                  </View>
                ) : (
                  filteredSessions.map((s) => (
                    <SessionRow
                      key={s.id}
                      session={s}
                      rating={ratings[s.id]}
                      style={{ marginHorizontal: H_PAD }}
                      onActionsPress={() => setActionsSession(s)}
                    />
                  ))
                )}
              </View>
            )}

            {/* ── Tab: Videos ── */}
            {activeTab === "Videos" && (
              <View style={styles.emptyWrap}>
                <Feather name="video" size={36} color={colors.mutedForeground} style={{ marginBottom: 14 }} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Próximamente</Text>
              </View>
            )}

            {/* ── Tab: Maestros ── */}
            {activeTab === "Maestros" && (
              <View style={styles.emptyWrap}>
                <Feather name="users" size={36} color={colors.mutedForeground} style={{ marginBottom: 14 }} />
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>Próximamente</Text>
              </View>
            )}
          </>
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

  header: { alignItems: "center", marginBottom: 28, paddingTop: 4 },
  backBtn: {
    alignSelf: "flex-start",
    width: 40, height: 40,
    alignItems: "center", justifyContent: "center",
    marginBottom: 16,
  },
  titleRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  catIconCircle: {
    width: 56, height: 56,
    borderRadius: 28,
    alignItems: "center", justifyContent: "center",
  },
  pageTitle: { fontSize: 26, fontWeight: "700", letterSpacing: 0.2, marginBottom: 4, textAlign: "left" },
  pageSub: { fontSize: 13, lineHeight: 19, textAlign: "left" },

  catList: {},
  catRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 14 },
  iconCircle: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  catName: { flex: 1, fontSize: 15, fontWeight: "600", letterSpacing: 0.1 },
  catRight: { flexDirection: "row", alignItems: "center", gap: 6 },
  catCount: { fontSize: 13, fontWeight: "500" },

  detailTopBar: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 18,
  },
  iconBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  detailTitle: {
    fontSize: 32, fontWeight: "800", letterSpacing: -0.3,
    lineHeight: 38, marginBottom: 12,
  },
  detailDesc: { fontSize: 14, lineHeight: 21 },

  tabBar: { flexDirection: "row", borderBottomWidth: 1, position: "relative" },
  tabItem: { flex: 1, alignItems: "center", paddingVertical: 10 },
  tabLabel: { fontSize: 15, fontWeight: "600" },
  tabIndicator: { position: "absolute", bottom: 0, height: 2, borderRadius: 1 },

  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 0 },
  recentPlaceholder: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderRadius: 14, padding: 16, marginTop: 10, marginBottom: 28,
  },
  placeholderText: { flex: 1, fontSize: 13, lineHeight: 18 },

  emptyWrap: { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 16, textAlign: "center" },

  guidesSection: { paddingHorizontal: 20, marginTop: 28 },
  guidesTitle: { fontSize: 18, fontWeight: "700", letterSpacing: 0.3, marginBottom: 6 },
  guidesSub: { fontSize: 13, lineHeight: 18, marginBottom: 4 },
});
