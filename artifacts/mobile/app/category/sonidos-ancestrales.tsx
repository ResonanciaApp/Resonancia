import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
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

import {
  IconCuencoCuarzo,
  IconCuencoTibetano,
  IconCuencosYGongs,
  IconGong,
  IconMixCuencos,
} from "@/components/AncestralIcons";
import { SacredBackground } from "@/components/SacredBackground";
import { SessionCard } from "@/components/SessionCard";
import { SESSIONS, type AncestralTag } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

const H_PAD = 20;

const ANCESTRAL_SESSIONS = SESSIONS.filter((s) => s.categoryId === "sonidos-ancestrales");

type CategoryDef = {
  tag: AncestralTag;
  Icon: React.FC<{ size?: number; color?: string }>;
  description: string;
};

const CATEGORIES: CategoryDef[] = [
  { tag: "Cuencos Tibetanos",                    Icon: IconCuencoTibetano, description: "Vibraciones milenarias del Himalaya" },
  { tag: "Cuencos de Cuarzo",                    Icon: IconCuencoCuarzo,   description: "Frecuencias cristalinas de alta pureza" },
  { tag: "Mix de Cuencos Tibetanos y de Cuarzo", Icon: IconMixCuencos,     description: "Lo mejor de ambos mundos sonoros" },
  { tag: "Gongs",                                Icon: IconGong,           description: "Ondas expansivas de transformación" },
  { tag: "Cuencos y Gongs",                      Icon: IconCuencosYGongs,  description: "Combinación sagrada de instrumentos" },
];

export default function SonidosAncestalesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const [selectedTag, setSelectedTag] = useState<AncestralTag | null>(null);
  const [query, setQuery] = useState("");
  const nuevasSessions = useMemo(
    () => [...ANCESTRAL_SESSIONS].sort((a, b) => parseInt(b.id) - parseInt(a.id)).slice(0, 8),
    []
  );

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filteredSessions = useMemo(() => {
    let list = ANCESTRAL_SESSIONS;
    if (selectedTag) list = list.filter((s) => s.ancestralTag === selectedTag);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (s) => s.title.toLowerCase().includes(q) || s.subtitle.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedTag, query]);

  const countByTag = useMemo(() => {
    const map: Record<string, number> = {};
    for (const cat of CATEGORIES) {
      map[cat.tag] = ANCESTRAL_SESSIONS.filter((s) => s.ancestralTag === cat.tag).length;
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
          <View style={[styles.catIconCircle, { backgroundColor: "rgba(232,200,122,0.12)", borderColor: "rgba(232,200,122,0.28)" }]}>
            <Feather name="disc" size={22} color="#E8C87A" />
          </View>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>
            {selectedTag ?? "Sonidos Ancestrales"}
          </Text>
          <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
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
                      !isLast && { borderBottomWidth: 1, borderBottomColor: "rgba(198,155,79,0.1)" },
                      { opacity: pressed ? 0.75 : 1 },
                    ]}
                  >
                    <View
                      style={[
                        styles.iconCircle,
                        { backgroundColor: "rgba(198,155,79,0.1)", borderColor: "rgba(198,155,79,0.2)" },
                      ]}
                    >
                      <cat.Icon size={22} color={colors.primary} />
                    </View>
                    <Text style={[styles.catName, { color: colors.foreground }]}>{cat.tag}</Text>
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
                  <Feather name="zap" size={14} color={colors.primary} style={{ marginRight: 6 }} />
                  <Text style={[styles.nuevasTitle, { color: colors.foreground }]}>Nuevas Sesiones</Text>
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
          </>
        )}

        {/* ── SESSIONS LIST ── */}
        {selectedTag && (
          <>
            <View style={[{ paddingHorizontal: H_PAD, marginBottom: 16 }]}>
              <View
                style={[
                  styles.searchBar,
                  { backgroundColor: colors.card, borderColor: "rgba(198,155,79,0.18)" },
                ]}
              >
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
                      <Text style={[styles.cardTitle, { color: colors.foreground }]} numberOfLines={2}>
                        {session.title}
                      </Text>
                      <Text style={[styles.cardSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                        {session.subtitle}
                      </Text>
                      <View style={styles.metaRow}>
                        <Feather name="clock" size={11} color={colors.mutedForeground} />
                        <Text style={[styles.metaText, { color: colors.mutedForeground }]}>
                          {" "}{session.durationLabel}
                        </Text>
                        {session.frequency && (
                          <>
                            <Text style={[styles.metaDot, { color: colors.mutedForeground }]}> · </Text>
                            <Text style={[styles.metaText, { color: colors.accent }]}>
                              {session.frequency}
                            </Text>
                          </>
                        )}
                      </View>
                    </View>
                    <Feather name="chevron-right" size={16} color={colors.border} style={{ marginRight: 14 }} />
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
  cardTitle: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 2,
  },
  cardSub: {
    fontSize: 11,
    marginBottom: 4,
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
    paddingHorizontal: H_PAD,
    marginBottom: 14,
  },
  nuevasTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  nuevasCarousel: {
    paddingLeft: H_PAD,
    paddingRight: 12,
    gap: 12,
  },
});
