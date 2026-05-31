import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
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
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { CategoryInfoPanel } from "@/components/CategoryInfoPanel";
import { PremiumBadge } from "@/components/PremiumBadge";
import { SessionCard } from "@/components/SessionCard";
import { usePremium } from "@/context/PremiumContext";
import { SESSIONS } from "@/data/sessions";
import type { Session } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

const H_PAD = 20;
const ALL_SESSIONS = SESSIONS.filter(
  (s) => s.categoryId === "meditaciones-guiadas" || s.categoryId === "sabiduria-dia"
);
const GUIADAS_SESSIONS = SESSIONS.filter((s) => s.categoryId === "meditaciones-guiadas");

type CategoryDef = {
  tag: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  image: import("react-native").ImageSourcePropType;
  description: string;
  categoryIdFilter?: string;
};

const CATEGORIES: CategoryDef[] = [
  { tag: "No Duales",              icon: "sun",   image: require("@/assets/images/sessions/med-no-duales.jpg"),            description: "Despertar y observación del ser" },
  { tag: "Visualizaciones",        icon: "eye",   image: require("@/assets/images/sessions/med-visualizaciones.jpg"),      description: "Guías para visualizar y crear" },
  { tag: "Mantras",                icon: "radio", image: require("@/assets/images/sessions/med-mantras.jpg"),              description: "Vibración y repetición sagrada" },
  { tag: "Escaneo Corporal",       icon: "user",  image: require("@/assets/images/sessions/med-escaneo-corporal.jpg"),     description: "Conexión y presencia en el cuerpo" },
  { tag: "Manifestación",          icon: "zap",   image: require("@/assets/images/sessions/med-manifestacion.jpg"),        description: "Intención, foco y creación" },
  { tag: "3 Minutos de Sabiduría", icon: "sun",   image: require("@/assets/images/sessions/sab-silencio-interior.jpg"),   description: "Sabiduría condensada en 3 minutos", categoryIdFilter: "sabiduria-dia" },
];


export default function MeditacionesGuiadasScreen() {
  const colors = useColors();
  const { isPremium } = usePremium();
  const insets = useSafeAreaInsets();

  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const nuevasSessions = useMemo(
    () => [...GUIADAS_SESSIONS].sort((a, b) => parseInt(b.id) - parseInt(a.id)).slice(0, 8),
    []
  );

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  // Sessions filtered by selected tag (+ search within tag view)
  const filteredSessions = useMemo(() => {
    let list: typeof ALL_SESSIONS = ALL_SESSIONS;
    if (selectedTag) {
      const cat = CATEGORIES.find((c) => c.tag === selectedTag);
      if (cat?.categoryIdFilter) {
        list = list.filter((s) => s.categoryId === cat.categoryIdFilter);
      } else {
        list = list.filter((s) => (s as Session & { meditationTag?: string }).meditationTag === selectedTag);
      }
    }
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
      if (cat.categoryIdFilter) {
        map[cat.tag] = ALL_SESSIONS.filter((s) => s.categoryId === cat.categoryIdFilter).length;
      } else {
        map[cat.tag] = GUIADAS_SESSIONS.filter((s) => (s as Session & { meditationTag?: string }).meditationTag === cat.tag).length;
      }
    }
    return map;
  }, []);

  const selectedCat = CATEGORIES.find((c) => c.tag === selectedTag);

  return (
    <View style={[styles.root, { backgroundColor: "#060208" }]}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#120C17", "#09050C"]}
        style={StyleSheet.absoluteFill}
      />

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
            <Feather name="eye" size={22} color="#C8B4E0" />
          </View>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>
            {selectedTag ?? "Meditaciones Guiadas"}
          </Text>
          <Text style={[styles.pageSub, { color: "#B49ECB" }]}>
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
                      !isLast && { borderBottomWidth: 1, borderBottomColor: "rgba(182,149,95,0.1)" },
                      { opacity: pressed ? 0.75 : 1 },
                    ]}
                  >
                    {/* Category image */}
                    <Image source={cat.image} style={styles.iconCircle} contentFit="cover" placeholder={BLUR_PLACEHOLDER} transition={IMAGE_TRANSITION} />

                    {/* Name */}
                    <Text style={[styles.catName, { color: colors.foreground }]}>
                      {cat.tag}
                    </Text>

                    {/* Count + chevron */}
                    <View style={styles.catRight}>
                      <Text style={[styles.catCount, { color: "#C8B4E0" }]}>
                        {countByTag[cat.tag] ?? 0}
                      </Text>
                      <Feather name="chevron-right" size={18} color="#C8B4E0" />
                    </View>
                  </Pressable>
                );
              })}
            </View>

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
              <View style={[styles.searchBar, { backgroundColor: "rgba(60,32,82,0.55)", borderColor: "transparent", borderWidth: 0 }]}>
                <Feather name="search" size={16} color="#C8B4E0" style={{ marginRight: 8 }} />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  placeholder="Buscar..."
                  placeholderTextColor="#C8B4E0"
                  style={[styles.searchInput, { color: colors.foreground }]}
                  returnKeyType="search"
                />
                {query.length > 0 && (
                  <Pressable onPress={() => setQuery("")} hitSlop={8}>
                    <Feather name="x" size={14} color="#C8B4E0" />
                  </Pressable>
                )}
              </View>
            </View>

            {/* Sessions */}
            <View style={{ paddingHorizontal: H_PAD }}>
              {filteredSessions.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Feather name="search" size={32} color="#C8B4E0" style={{ marginBottom: 12 }} />
                  <Text style={[styles.emptyText, { color: "#C8B4E0" }]}>
                    Sin resultados{query ? ` para "${query}"` : ""}
                  </Text>
                </View>
              ) : (
                filteredSessions.map((session) => {
                  const locked = !!session.isPremium && !isPremium;
                  return (
                  <Pressable
                    key={session.id}
                    onPress={() => router.push((locked ? "/membresia" : `/session/${session.id}`) as never)}
                    style={({ pressed }) => [
                      styles.card,
                      {
                        backgroundColor: "rgba(255,255,255,0.05)",
                        borderColor: "transparent",
                        borderWidth: 0,
                        opacity: pressed ? 0.82 : 1,
                      },
                    ]}
                  >
                    <View>
                    <Image
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      source={session.image as any}
                      style={styles.cardImage}
                      placeholder={BLUR_PLACEHOLDER}
                      transition={IMAGE_TRANSITION}
                    />
                    <PremiumBadge session={session} />
                    </View>
                    <View style={styles.cardContent}>
                      <Text style={[styles.cardCategory, { color: colors.accent }]}>
                        {session.categoryLabel}
                      </Text>
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
                  );
                })
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
  cardCategory: {
    fontSize: 10,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginBottom: 3,
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
