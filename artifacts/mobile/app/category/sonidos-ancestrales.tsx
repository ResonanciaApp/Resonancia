import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
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
import { usePremium } from "@/context/PremiumContext";
import { usePlayer } from "@/context/PlayerContext";
import { SESSIONS, type AncestralTag, type Session } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

const H_PAD = 20;
const RATINGS_KEY = "@resonance_ratings";

const ANCESTRAL_SESSIONS = SESSIONS.filter((s) => s.categoryId === "sonidos-ancestrales");

type CategoryDef = {
  tag: AncestralTag;
  icon: React.ComponentProps<typeof Feather>["name"];
  description: string;
  longDescription: string;
};

const CATEGORIES: CategoryDef[] = [
  {
    tag: "Cuencos Tibetanos",
    icon: "triangle",
    description: "Vibraciones milenarias del Himalaya",
    longDescription:
      "Los cuencos tibetanos generan tonos ricos y envolventes que aquietan el sistema nervioso. Sus armónicos resuenan en el cuerpo, disolviendo tensión acumulada y llevando la mente a un estado de quietud profunda. Una práctica sagrada presente en tradiciones de sanación desde hace siglos.",
  },
  {
    tag: "Cuencos de Cuarzo",
    icon: "droplet",
    description: "Frecuencias cristalinas de alta pureza",
    longDescription:
      "Los cuencos de cuarzo producen frecuencias puras y cristalinas que se alinean con los centros energéticos del cuerpo. Su vibración limpia y eleva, facilitando estados de meditación profunda, claridad mental y bienestar integral. Ideales para quienes buscan una experiencia más etérea y luminosa.",
  },
  {
    tag: "Mix de Cuencos",
    icon: "wind",
    description: "Lo mejor de ambos mundos sonoros",
    longDescription:
      "Una fusión entre la calidez de los cuencos tibetanos y la pureza de los de cuarzo. Esta combinación abarca un espectro sonoro más amplio, trabajando distintas capas del cuerpo energético en una sola experiencia. Lo mejor de ambos mundos, reunido en sesiones de integración profunda.",
  },
  {
    tag: "Gongs",
    icon: "sun",
    description: "Ondas expansivas de transformación",
    longDescription:
      "Las ondas del gong se expanden como olas, borrando el ruido mental y llevando al oyente a estados profundos de conciencia. Sus frecuencias complejas estimulan el sistema nervioso parasimpático, favorecen la regeneración y liberan emociones estancadas. Una experiencia de transformación a cada escucha.",
  },
  {
    tag: "Cuencos y Gongs",
    icon: "moon",
    description: "Combinación sagrada de instrumentos",
    longDescription:
      "Cuando los cuencos y los gongs se unen, crean un campo sonoro completo que envuelve todo el ser. Los cuencos anidan la mente, los gongs mueven lo que está quieto. Esta combinación es ideal para ceremonias, retiros y sesiones de sanación integral.",
  },
  {
    tag: "Full Instrumentos",
    icon: "layers",
    description: "Todos los instrumentos ancestrales",
    longDescription:
      "La experiencia completa: cuencos tibetanos, cuencos de cuarzo, gongs, campanas y otros instrumentos actuando en conjunto. Una inmersión sonora que abarca todos los niveles, desde la relajación profunda hasta la expansión de la conciencia.",
  },
];

type ActiveTab = "Audios" | "Videos" | "Maestros";
const TABS: ActiveTab[] = ["Audios", "Videos", "Maestros"];

export default function SonidosAncestalesScreen() {
  const colors = useColors();
  const { isPremium } = usePremium();
  const { history } = usePlayer();
  const insets = useSafeAreaInsets();

  const [selectedTag, setSelectedTag] = useState<AncestralTag | null>(null);
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

  const filteredSessions = useMemo(() => {
    let list = ANCESTRAL_SESSIONS;
    if (selectedTag) list = list.filter((s) => s.ancestralTag === selectedTag);
    return [...list].sort((a, b) => parseInt(b.id) - parseInt(a.id));
  }, [selectedTag]);

  const countByTag = useMemo(() => {
    const map: Record<string, number> = {};
    for (const cat of CATEGORIES) {
      map[cat.tag] = ANCESTRAL_SESSIONS.filter((s) => s.ancestralTag === cat.tag).length;
    }
    return map;
  }, []);

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
        message: `Escuchá "${selectedTag}" en Resonancia — sonidos ancestrales para tu bienestar.`,
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
              <View style={styles.catIconCircle}>
                <MaterialCommunityIcons name="bowl-mix" size={44} color="#C4956A" />
              </View>
              <Text style={[styles.pageTitle, { color: colors.foreground }]}>Ancestrales</Text>
              <Text style={[styles.pageSub, { color: "#FFFFFF" }]}>
                Cuencos, gongs y frecuencias sagradas
              </Text>
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
                      <Feather name={cat.icon} size={22} color="#C4956A" />
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
              accentColor="#C4956A"
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
          </>
        )}

        {/* ════════════════════════════════════
            VISTA DETALLE DE SUBCATEGORÍA
        ════════════════════════════════════ */}
        {selectedTag && selectedCat && (
          <>
            {/* Top bar: atrás + compartir */}
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

            {/* Tabs con indicador animado */}
            <View style={[styles.tabBar, { borderBottomColor: "rgba(255,255,255,0.08)", paddingHorizontal: H_PAD }]}>
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
                    { width: indicatorWidth, transform: [{ translateX: indicatorAnim }] },
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
                    <Feather name="music" size={32} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
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
  catIconCircle: {
    width: 56, height: 56,
    borderRadius: 18,
    alignItems: "center", justifyContent: "center",
    marginBottom: 14,
  },
  pageTitle: { fontSize: 26, fontWeight: "700", letterSpacing: 0.2, marginBottom: 6, textAlign: "center" },
  pageSub: { fontSize: 13, lineHeight: 19, textAlign: "center" },

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
  tabItem: { paddingVertical: 10, paddingHorizontal: 4, marginRight: 22 },
  tabLabel: { fontSize: 15, fontWeight: "600" },
  tabIndicator: {
    position: "absolute", bottom: 0, height: 2,
    backgroundColor: "#FFFFFF", borderRadius: 1,
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
