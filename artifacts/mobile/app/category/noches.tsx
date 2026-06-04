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
import { usePlayer } from "@/context/PlayerContext";
import { SESSIONS } from "@/data/sessions";
import type { Session } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

const H_PAD = 20;
const ICON_COLOR = "#C87BB5";
const RATINGS_KEY = "@resonance_ratings";

const NOCHES_SESSIONS = SESSIONS.filter((s) => s.categoryId === "noches");

const matchTag = (s: Session, tag: string) =>
  (s as Session & { meditationTag?: string }).meditationTag === tag ||
  (s as Session & { soundTag?: string }).soundTag === tag ||
  (s as Session & { ancestralTag?: string }).ancestralTag === tag ||
  ((s as Session & { themeTag?: string[] }).themeTag?.includes(tag) ?? false);

type SubDef = {
  tag: string;
  icon: string;
  family: "Feather" | "MaterialCommunityIcons";
  description: string;
  longDescription: string;
};

const SUBCATEGORIES: SubDef[] = [
  {
    tag: "Guiadas",
    icon: "mic",
    family: "Feather",
    description: "Voces que te acompañan al dormir",
    longDescription:
      "Una voz suave te acompaña mientras el sueño llega. Sin necesidad de hacer nada, solo seguir las instrucciones y dejar que el cuerpo se relaje por completo. Las sesiones guiadas nocturnas activan el sistema nervioso parasimpático, preparando cuerpo y mente para el descanso profundo.",
  },
  {
    tag: "Música",
    icon: "music",
    family: "Feather",
    description: "Melodías suaves para descansar",
    longDescription:
      "Melodías diseñadas para ralentizar las ondas cerebrales y facilitar la transición al sueño. Sin letras ni ritmos estimulantes, solo capas de sonido que envuelven y acompañan hasta que la conciencia se disuelve suavemente.",
  },
  {
    tag: "Sonidos de la Naturaleza",
    icon: "leaf",
    family: "MaterialCommunityIcons",
    description: "Bosque, lluvia y mar para soltar",
    longDescription:
      "El bosque, la lluvia y el mar tienen un efecto calmante medido: normalizan el ritmo cardíaco y reducen el cortisol. Estas grabaciones crean un entorno sonoro natural que invita al descanso sin distracciones tecnológicas.",
  },
  {
    tag: "Yoga Nidra",
    icon: "meditation",
    family: "MaterialCommunityIcons",
    description: "Relajación profunda y consciente",
    longDescription:
      "Un estado entre el sueño y la vigilia donde el cuerpo se rinde completamente pero la conciencia permanece alerta. Practicado regularmente, equivale a horas de sueño profundo y activa procesos de sanación y reintegración.",
  },
  {
    tag: "Música Ambient",
    icon: "waveform",
    family: "MaterialCommunityIcons",
    description: "Atmósferas envolventes y etéreas",
    longDescription:
      "Atmósferas etéreas sin ritmo ni melodía definida, pensadas para flotar. El ambiente sonoro no dirige, acompaña. Ideal para quienes necesitan silenciar el ruido mental sin estimulación adicional.",
  },
  {
    tag: "Sonidos Ancestrales",
    icon: "bowl-mix",
    family: "MaterialCommunityIcons",
    description: "Cuencos y frecuencias para el descanso",
    longDescription:
      "Cuencos y frecuencias sagradas que resuenan en el campo energético durante el sueño. Su efecto es acumulativo: cuanto más se practican, más profundo y reparador se vuelve el descanso nocturno.",
  },
];

function SubIcon({ sub, size }: { sub: SubDef; size: number }) {
  return sub.family === "MaterialCommunityIcons" ? (
    <MaterialCommunityIcons
      name={sub.icon as React.ComponentProps<typeof MaterialCommunityIcons>["name"]}
      size={size}
      color={ICON_COLOR}
    />
  ) : (
    <Feather
      name={sub.icon as React.ComponentProps<typeof Feather>["name"]}
      size={size}
      color={ICON_COLOR}
    />
  );
}

type ActiveTab = "Audios" | "Videos" | "Maestros";
const TABS: ActiveTab[] = ["Audios", "Videos", "Maestros"];

export default function NochesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { history } = usePlayer();

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

  const filteredSessions = useMemo(() => {
    if (!selectedTag) return NOCHES_SESSIONS;
    return NOCHES_SESSIONS.filter((s) => matchTag(s, selectedTag));
  }, [selectedTag]);

  const countByTag = useMemo(() => {
    const map: Record<string, number> = {};
    for (const sub of SUBCATEGORIES) {
      map[sub.tag] = NOCHES_SESSIONS.filter((s) => matchTag(s, sub.tag)).length;
    }
    return map;
  }, []);

  const selectedSub = SUBCATEGORIES.find((c) => c.tag === selectedTag);

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
        message: `Escuchá "${selectedTag}" en Resonancia — rituales nocturnos para el descanso.`,
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
                <Feather name="moon" size={44} color={ICON_COLOR} />
              </View>
              <Text style={[styles.pageTitle, { color: colors.foreground }]}>Noches</Text>
              <Text style={[styles.pageSub, { color: "#EDE1D3" }]}>
                Prepara tu cuerpo y mente para el descanso
              </Text>
            </View>

            <View style={[styles.catList, { paddingHorizontal: H_PAD }]}>
              {SUBCATEGORIES.map((sub, idx) => {
                const isLast = idx === SUBCATEGORIES.length - 1;
                return (
                  <Pressable
                    key={sub.tag}
                    onPress={() => setSelectedTag(sub.tag)}
                    style={({ pressed }) => [
                      styles.catRow,
                      !isLast && { borderBottomWidth: 1, borderBottomColor: "rgba(182,149,95,0.08)" },
                      { opacity: pressed ? 0.75 : 1 },
                    ]}
                  >
                    <View style={styles.iconCircle}>
                      <SubIcon sub={sub} size={22} />
                    </View>
                    <Text style={[styles.catName, { color: colors.foreground }]}>{sub.tag}</Text>
                    <View style={styles.catRight}>
                      <Text style={[styles.catCount, { color: colors.foreground }]}>
                        {countByTag[sub.tag] ?? 0}
                      </Text>
                      <Feather name="chevron-right" size={17} color={colors.foreground} />
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <CategoryInfoPanel
              accentColor={ICON_COLOR}
              heading="¿Por qué cuidar tus noches?"
              items={[
                {
                  icon: "moon",
                  title: "Un ritual de cierre",
                  body: "Una rutina suave antes de dormir le avisa a tu cuerpo que es hora de soltar. La mente se calma y el sueño llega con más facilidad.",
                },
                {
                  icon: "volume-2",
                  title: "El sonido que relaja",
                  body: "Voces guía, música y sonidos de la naturaleza reducen la rumiación mental y acompañan la transición al descanso profundo.",
                },
                {
                  icon: "activity",
                  title: "Descanso reparador",
                  body: "Dormir mejor mejora tu memoria, tu ánimo y tu energía. El descanso no es un lujo: es la base de tu bienestar.",
                },
              ]}
              quote="El descanso también es una forma de cuidarte."
              whyItems={[
                { icon: "moon", text: "Porque un buen día empieza la noche anterior." },
                { icon: "heart", text: "Porque mereces dormir en paz, sin pantallas ni prisa." },
              ]}
            />
          </>
        )}

        {/* ════════════════════════════════════
            VISTA DETALLE DE SUBCATEGORÍA
        ════════════════════════════════════ */}
        {selectedTag && selectedSub && (
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
                {selectedSub.longDescription}
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
                    <Feather name="moon" size={32} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 18,
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
    backgroundColor: "#EDE1D3", borderRadius: 1,
  },

  sectionTitle: { fontSize: 16, fontWeight: "700", marginBottom: 0 },
  recentPlaceholder: {
    flexDirection: "row", alignItems: "center", gap: 14,
    borderRadius: 14, padding: 16, marginBottom: 28,
  },
  placeholderText: { flex: 1, fontSize: 13, lineHeight: 18 },

  emptyWrap: { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 16, textAlign: "center" },
});
