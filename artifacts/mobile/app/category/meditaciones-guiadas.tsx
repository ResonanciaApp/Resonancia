import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Image,
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

import { SacredBackground } from "@/components/SacredBackground";
import { CategoryInfoPanel } from "@/components/CategoryInfoPanel";
import { SessionCard } from "@/components/SessionCard";
import { SESSIONS, type MeditationTag } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

const H_PAD = 20;
const RATINGS_KEY = "@resonance_ratings";

const GUIADAS_SESSIONS = SESSIONS.filter((s) => s.categoryId === "meditaciones-guiadas");

type CategoryDef = {
  tag: MeditationTag;
  icon: React.ComponentProps<typeof Feather>["name"];
  description: string;
};

const CATEGORIES: CategoryDef[] = [
  { tag: "No Duales",        icon: "sun",        description: "Despertar y observación del ser" },
  { tag: "Visualizaciones",  icon: "eye",        description: "Guías para visualizar y crear" },
  { tag: "Mantras",          icon: "radio",      description: "Vibración y repetición sagrada" },
  { tag: "Escaneo Corporal", icon: "user",       description: "Conexión y presencia en el cuerpo" },
  { tag: "Manifestación",    icon: "zap",        description: "Intención, foco y creación" },
];

function StarRow({ sessionId }: { sessionId: string }) {
  const [rating, setRating] = useState(0);
  useEffect(() => {
    AsyncStorage.getItem(RATINGS_KEY).then((val) => {
      if (!val) return;
      const map: Record<string, number> = JSON.parse(val);
      if (map[sessionId]) setRating(map[sessionId]);
    });
  }, [sessionId]);
  return (
    <View style={starStyles.row}>
      {[1, 2, 3, 4, 5].map((star) => (
        <Feather
          key={star}
          name="star"
          size={11}
          color={star <= rating ? "#E8B96A" : "rgba(198,155,79,0.22)"}
        />
      ))}
      {rating === 0 && (
        <Text style={starStyles.noRating}>Sin valorar</Text>
      )}
    </View>
  );
}
const starStyles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 2, marginBottom: 3 },
  noRating: { fontSize: 9, color: "rgba(198,155,79,0.5)", marginLeft: 4, letterSpacing: 0.3 },
});

export default function MeditacionesGuiadasScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [selectedTag, setSelectedTag] = useState<MeditationTag | null>(null);
  const [query, setQuery] = useState("");
  const nuevasSessions = useMemo(
    () => [...GUIADAS_SESSIONS].sort((a, b) => parseInt(b.id) - parseInt(a.id)).slice(0, 8),
    []
  );

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  // Sessions filtered by selected tag (+ search within tag view)
  const filteredSessions = useMemo(() => {
    let list = GUIADAS_SESSIONS;
    if (selectedTag) list = list.filter((s) => s.meditationTag === selectedTag);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (s) => s.title.toLowerCase().includes(q) || s.subtitle.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedTag, query]);

  // Count per tag
  const countByTag = useMemo(() => {
    const map: Record<string, number> = {};
    for (const cat of CATEGORIES) {
      map[cat.tag] = GUIADAS_SESSIONS.filter((s) => s.meditationTag === cat.tag).length;
    }
    return map;
  }, []);

  const selectedCat = CATEGORIES.find((c) => c.tag === selectedTag);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 40 + bottomPad, paddingTop: topPad + 8 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={[styles.header, { paddingHorizontal: H_PAD }]}>
          <Pressable
            onPress={() => {
              if (selectedTag) {
                setSelectedTag(null);
                setQuery("");
              } else {
                router.back();
              }
            }}
            style={styles.backBtn}
          >
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <View style={[styles.catIconCircle, { backgroundColor: "rgba(200,180,224,0.12)", borderColor: "rgba(200,180,224,0.28)" }]}>
            <Feather name="wind" size={22} color="#C8B4E0" />
          </View>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>
            {selectedTag ?? "Meditaciones Guiadas"}
          </Text>
          <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
            {selectedTag
              ? selectedCat?.description ?? ""
              : "Déjate llevar por la voz y el sonido"}
          </Text>
        </View>

        {/* ── CATEGORY LIST view ── */}
        {!selectedTag && (
          <>
            <View style={[styles.catList, { paddingHorizontal: H_PAD }]}>
              {CATEGORIES.map((cat, idx) => {
                const isLast = idx === CATEGORIES.length - 1;
                return (
                  <Pressable
                    key={cat.tag}
                    onPress={() => setSelectedTag(cat.tag)}
                    style={({ pressed }) => [
                      styles.catRow,
                      !isLast && { borderBottomWidth: 1, borderBottomColor: "rgba(198,155,79,0.1)" },
                      { opacity: pressed ? 0.75 : 1 },
                    ]}
                  >
                    {/* Icon circle */}
                    <View style={[styles.iconCircle, { backgroundColor: "rgba(200,180,224,0.1)", borderColor: "rgba(200,180,224,0.22)" }]}>
                      <Feather name={cat.icon} size={20} color="#C8B4E0" />
                    </View>

                    {/* Name */}
                    <Text style={[styles.catName, { color: colors.foreground }]}>
                      {cat.tag}
                    </Text>

                    {/* Count + chevron */}
                    <View style={styles.catRight}>
                      <Text style={[styles.catCount, { color: colors.mutedForeground }]}>
                        {countByTag[cat.tag] ?? 0}
                      </Text>
                      <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                    </View>
                  </Pressable>
                );
              })}
            </View>

            {/* ── Nuevas Sesiones ── */}
            {nuevasSessions.length > 0 && (
              <View style={styles.nuevasSection}>
                <View style={styles.nuevasHeader}>
                  <Text style={[styles.nuevasTitle, { color: colors.foreground }]}>Nuevas Sesiones</Text>
                  <Pressable onPress={() => router.push("/nuevas-sesiones" as never)} hitSlop={8}>
                    <Text style={[styles.verTodas, { color: "#C8B4E0" }]}>Ver todas</Text>
                  </Pressable>
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.nuevasCarousel}
                >
                  {nuevasSessions.map((s) => (
                    <SessionCard key={s.id} session={s} width={148} />
                  ))}
                </ScrollView>
              </View>
            )}

            <CategoryInfoPanel
              accentColor="#C8B4E0"
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

        {/* ── SESSIONS LIST view ── */}
        {selectedTag && (
          <>
            {/* Search bar */}
            <View style={[{ paddingHorizontal: H_PAD, marginBottom: 16 }]}>
              <View style={[styles.searchBar, { backgroundColor: colors.card, borderColor: "rgba(198,155,79,0.18)" }]}>
                <Feather name="search" size={16} color={colors.mutedForeground} style={{ marginRight: 8 }} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Buscar..."
                  placeholderTextColor={colors.mutedForeground}
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

            {/* Sessions */}
            <View style={{ paddingHorizontal: H_PAD }}>
              {filteredSessions.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Feather name="search" size={32} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                    Sin resultados{query ? ` para "${query}"` : ""}
                  </Text>
                </View>
              ) : (
                filteredSessions.map((session) => (
                  <Pressable
                    key={session.id}
                    onPress={() => router.push(`/session/${session.id}` as never)}
                    style={({ pressed }) => [
                      styles.card,
                      {
                        backgroundColor: colors.card,
                        borderColor: "rgba(198,155,79,0.18)",
                        opacity: pressed ? 0.82 : 1,
                      },
                    ]}
                  >
                    <Image
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      source={session.image as any}
                      style={styles.cardImage}
                    />
                    <View style={styles.cardContent}>
                      <StarRow sessionId={session.id} />
                      <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
                        {session.title}
                      </Text>
                      <View style={styles.metaRow}>
                        <Feather name="clock" size={11} color={colors.mutedForeground} />
                        <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                          {" "}{session.durationLabel}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                ))
              )}
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },

  header: {
    alignItems: "center",
    marginBottom: 28,
    paddingTop: 4,
  },
  backBtn: {
    alignSelf: "flex-start",
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  catIconCircle: {
    width: 56,
    height: 56,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 6,
    textAlign: "center",
  },
  pageSub: {
    fontSize: 13,
    lineHeight: 19,
    textAlign: "center",
  },

  // Category list
  catList: {},
  catRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    gap: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  catName: {
    flex: 1,
    fontSize: 17,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
  catRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  catCount: {
    fontSize: 14,
    fontWeight: "500",
  },

  // Search bar
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === "ios" ? 12 : 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
    margin: 0,
  },

  // Session cards
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 12,
    height: 96,
  },
  cardImage: {
    width: 108,
    height: 96,
    resizeMode: "cover",
  },
  cardContent: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: "center",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 4,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 11,
  },

  emptyWrap: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },

  // Nuevas Sesiones
  nuevasSection: {
    marginTop: 32,
    marginBottom: 8,
  },
  nuevasHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: H_PAD,
    marginBottom: 14,
  },
  nuevasTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  verTodas: {
    fontSize: 13,
    fontWeight: "600",
  },
  nuevasCarousel: {
    paddingLeft: H_PAD,
    paddingRight: 12,
    gap: 12,
  },
});
