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
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Image } from "expo-image";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { SacredBackground } from "@/components/SacredBackground";
import { CategoryInfoPanel } from "@/components/CategoryInfoPanel";
import { PremiumBadge } from "@/components/PremiumBadge";
import { SessionCard } from "@/components/SessionCard";
import { usePremium } from "@/context/PremiumContext";
import { SESSIONS, type AncestralTag } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

const H_PAD = 20;
const RATINGS_KEY = "@resonance_ratings";

const ANCESTRAL_SESSIONS = SESSIONS.filter((s) => s.categoryId === "sonidos-ancestrales");

type CategoryDef = {
  tag: AncestralTag;
  image: import("react-native").ImageSourcePropType;
  description: string;
};

const CATEGORIES: CategoryDef[] = [
  { tag: "Cuencos Tibetanos",  image: require("@/assets/images/sessions/session-2.jpg"),              description: "Vibraciones milenarias del Himalaya" },
  { tag: "Cuencos de Cuarzo", image: require("@/assets/images/sessions/session-8.jpg"),              description: "Frecuencias cristalinas de alta pureza" },
  { tag: "Mix de Cuencos",    image: require("@/assets/images/sessions/session-9.jpg"),              description: "Lo mejor de ambos mundos sonoros" },
  { tag: "Gongs",             image: require("@/assets/images/sessions/session-10.jpg"),             description: "Ondas expansivas de transformación" },
  { tag: "Cuencos y Gongs",   image: require("@/assets/images/sessions/session-29.jpg"),             description: "Combinación sagrada de instrumentos" },
  { tag: "Full Instrumentos", image: require("@/assets/images/sessions/ancestral-instrumentos.jpg"), description: "Todos los instrumentos ancestrales" },
];

export default function SonidosAncestalesScreen() {
  const colors = useColors();
  const { isPremium } = usePremium();
  const insets = useSafeAreaInsets();

  const [selectedTag, setSelectedTag] = useState<AncestralTag | null>(null);
  const [ratings, setRatings] = useState<Record<string, number>>({});

  useEffect(() => {
    AsyncStorage.getItem(RATINGS_KEY).then((val) => {
      if (val) setRatings(JSON.parse(val));
    });
  }, []);
  const nuevasSessions = useMemo(
    () => [...ANCESTRAL_SESSIONS].sort((a, b) => parseInt(b.id) - parseInt(a.id)).slice(0, 8),
    []
  );

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filteredSessions = useMemo(() => {
    let list = ANCESTRAL_SESSIONS;
    if (selectedTag) list = list.filter((s) => s.ancestralTag === selectedTag);
    return list;
  }, [selectedTag]);

  const countByTag = useMemo(() => {
    const map: Record<string, number> = {};
    for (const cat of CATEGORIES) {
      map[cat.tag] = ANCESTRAL_SESSIONS.filter((s) => s.ancestralTag === cat.tag).length;
    }
    return map;
  }, []);

  const selectedCat = CATEGORIES.find((c) => c.tag === selectedTag);

  return (
    <View style={[styles.root, { backgroundColor: "#100A05" }]}>
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
              } else {
                router.back();
              }
            }}
            style={styles.backBtn}
          >
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <View style={[styles.catIconCircle, { backgroundColor: "rgba(232,200,122,0.12)", borderColor: "rgba(232,200,122,0.28)" }]}>
            <MaterialCommunityIcons name="bowl-mix" size={22} color="#E8C87A" />
          </View>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>
            {selectedTag ?? "Sonidos Ancestrales"}
          </Text>
          <Text style={[styles.pageSub, { color: "#E8C87A" }]}>
            {selectedTag
              ? selectedCat?.description ?? ""
              : "Cuencos, gongs y frecuencias sagradas"}
          </Text>
        </View>

        {/* ── CATEGORY LIST ── */}
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
                    <Image
                      source={cat.image}
                      style={styles.iconCircle}
                      contentFit="cover"
                      cachePolicy="memory-disk"
                      placeholder={BLUR_PLACEHOLDER}
                      transition={IMAGE_TRANSITION}
                    />
                    <Text style={[styles.catName, { color: colors.foreground }]}>{cat.tag}</Text>
                    <View style={styles.catRight}>
                      <Text style={[styles.catCount, { color: "#E8C87A" }]}>
                        {countByTag[cat.tag] ?? 0}
                      </Text>
                      <Feather name="chevron-right" size={18} color="#E8C87A" />
                    </View>
                  </Pressable>
                );
              })}
            </View>

            <CategoryInfoPanel
              accentColor="#E8C87A"
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

        {/* ── SESSIONS LIST ── */}
        {selectedTag && (
          <>
            <View style={{ paddingHorizontal: H_PAD }}>
              {filteredSessions.length === 0 ? (
                <View style={styles.emptyWrap}>
                  <Feather name="search" size={32} color="#E8C87A" style={{ marginBottom: 12 }} />
                  <Text style={[styles.emptyText, { color: "#E8C87A" }]}>
                    Sin resultados
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
                        backgroundColor: "#130D06",
                        borderColor: "transparent",
                        opacity: pressed ? 0.82 : 1,
                      },
                    ]}
                  >
                    <View>
                    <Image
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      source={session.image as any}
                      style={styles.cardImage}
                    />
                    <PremiumBadge session={session} />
                    </View>
                    <View style={styles.cardContent}>
                      <View style={styles.ratingRow}>
                        <Feather name="star" size={11} color="#E8B96A" />
                        <Text style={styles.cardRating}>
                          {" "}{ratings[session.id] ?? 5}/5
                        </Text>
                      </View>
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
                    <Feather name="chevron-right" size={16} color={colors.border} style={{ marginRight: 14 }} />
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
    overflow: "hidden",
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
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 3,
  },
  cardRating: {
    fontSize: 11,
    fontWeight: "400",
    letterSpacing: 0.3,
    color: "#E8B96A",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 2,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  metaText: {
    fontSize: 11,
  },
  metaDot: {
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
