import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Dimensions,
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
import { usePlayer } from "@/context/PlayerContext";
import { SESSIONS, type MeditationTag, type Session } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");
const H_PAD = 20;
const RATINGS_KEY = "@resonance_ratings";

type Tab = "Todos" | MeditationTag;

const TABS: Tab[] = [
  "Todos",
  "Visualización",
  "Escáner Corporal",
  "Soy Consciencia",
  "Mantras",
  "Manifestación",
];

const GUIADAS_SESSIONS = SESSIONS.filter((s) => s.categoryId === "meditaciones-guiadas");

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
  const { playSession, isFavorite, toggleFavorite } = usePlayer();

  const [activeTab, setActiveTab] = useState<Tab>("Todos");
  const [query, setQuery] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const filtered = useMemo(() => {
    let list = GUIADAS_SESSIONS;
    if (activeTab !== "Todos") {
      list = list.filter((s) => s.meditationTag === activeTab);
    }
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter(
        (s) =>
          s.title.toLowerCase().includes(q) ||
          s.subtitle.toLowerCase().includes(q) ||
          (s.meditationTag ?? "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [activeTab, query]);

  const handlePlay = (session: Session) => {
    playSession(session);
    router.push("/player" as never);
  };

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
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.pageTitle, { color: colors.foreground }]}>
              Meditaciones Guiadas
            </Text>
            <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
              Déjate llevar por la voz y el sonido
            </Text>
          </View>
        </View>

        {/* Search bar */}
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
              placeholder={`Busca entre ${GUIADAS_SESSIONS.length} meditaciones`}
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

        {/* Filter Tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.tabsRow, { paddingHorizontal: H_PAD }]}
          style={{ marginBottom: 20 }}
        >
          {TABS.map((tab) => {
            const active = tab === activeTab;
            return (
              <Pressable
                key={tab}
                onPress={() => setActiveTab(tab)}
                style={[
                  styles.tab,
                  {
                    backgroundColor: active ? colors.primary : colors.card,
                    borderColor: active ? colors.primary : "rgba(198,155,79,0.2)",
                  },
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    { color: active ? colors.primaryForeground : colors.mutedForeground },
                  ]}
                >
                  {tab}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Session list — horizontal cards */}
        <View style={{ paddingHorizontal: H_PAD }}>
          {filtered.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Feather name="search" size={32} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Sin resultados{query ? ` para "${query}"` : ""}
              </Text>
            </View>
          ) : (
            filtered.map((session) => {
              const fav = isFavorite(session.id);
              return (
                <Pressable
                  key={session.id}
                  onPress={() => handlePlay(session)}
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

                  {/* Tag badge */}
                  {session.meditationTag && (
                    <View style={[styles.tagBadge, { backgroundColor: "rgba(198,155,79,0.15)", borderColor: "rgba(198,155,79,0.3)" }]}>
                      <Text style={[styles.tagText, { color: colors.accent }]}>
                        {session.meditationTag}
                      </Text>
                    </View>
                  )}

                  <View style={styles.cardContent}>
                    <StarRow sessionId={session.id} />
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
                    </View>
                  </View>

                  {/* Fav + Play */}
                  <View style={styles.cardActions}>
                    <Pressable
                      onPress={() => toggleFavorite(session.id)}
                      hitSlop={8}
                      style={styles.favBtn}
                    >
                      <Feather
                        name="heart"
                        size={16}
                        color={fav ? colors.primary : colors.mutedForeground}
                      />
                    </Pressable>
                    <View style={[styles.playBtn, { backgroundColor: colors.primary }]}>
                      <Feather name="play" size={14} color={colors.primaryForeground} style={{ paddingLeft: 2 }} />
                    </View>
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginBottom: 20,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  pageTitle: {
    fontSize: 26,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  pageSub: {
    fontSize: 12,
    lineHeight: 18,
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

  tabsRow: {
    flexDirection: "row",
    gap: 8,
    paddingBottom: 2,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 24,
    borderWidth: 1,
  },
  tabText: {
    fontSize: 13,
    fontWeight: "600",
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
  tagBadge: {
    position: "absolute",
    left: 78,
    top: 8,
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 8,
    fontWeight: "700",
    letterSpacing: 0.3,
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
  cardActions: {
    paddingRight: 14,
    alignItems: "center",
    gap: 10,
  },
  favBtn: {
    padding: 4,
  },
  playBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#C69B4F",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 4,
  },

  emptyWrap: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
});
