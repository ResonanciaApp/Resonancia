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

import { SESSIONS } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

const H_PAD = 20;

const PODCAST_SESSIONS = [...SESSIONS.filter((s) => s.categoryId === "podcast")]
  .sort((a, b) => parseInt(a.id) - parseInt(b.id));

export default function PodcastScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const episodios = useMemo(() => {
    if (!query.trim()) return PODCAST_SESSIONS;
    const q = query.toLowerCase();
    return PODCAST_SESSIONS.filter(
      (s) => s.title.toLowerCase().includes(q) || s.subtitle.toLowerCase().includes(q)
    );
  }, [query]);

  return (
    <View style={[styles.root, { backgroundColor: "#0E1A30" }]}>
      <StatusBar barStyle="light-content" />
      <Image
        source={require("@/assets/images/backgrounds/podcast.jpg")}
        style={StyleSheet.absoluteFill}
        resizeMode="cover"
      />

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
          <View style={[styles.catIconCircle, { backgroundColor: "rgba(138,170,212,0.12)", borderColor: "rgba(138,170,212,0.28)" }]}>
            <Feather name="mic" size={22} color="#8AAAD4" />
          </View>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>PodCast</Text>
          <Text style={[styles.pageSub, { color: "#9DB5D8" }]}>
            Conversaciones que despiertan el alma
          </Text>
        </View>

        {/* Search */}
        <View style={[styles.searchWrap, { paddingHorizontal: H_PAD }]}>
          <View style={[styles.searchBar, { backgroundColor: "rgba(30,42,68,0.55)", borderColor: "rgba(138,170,212,0.22)" }]}>
            <Feather name="search" size={16} color="#9DB5D8" style={{ marginRight: 8 }} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar episodio..."
              placeholderTextColor="#9DB5D8"
              style={[styles.searchInput, { color: colors.foreground }]}
              returnKeyType="search"
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <Feather name="x" size={14} color="#9DB5D8" />
              </Pressable>
            )}
          </View>
        </View>

        {/* Episodes count */}
        <View style={[styles.countRow, { paddingHorizontal: H_PAD }]}>
          <Feather name="mic" size={13} color="#8AAAD4" style={{ marginRight: 6 }} />
          <Text style={[styles.countLabel, { color: colors.foreground }]}>Episodios</Text>
          <Text style={[styles.countNum, { color: "#9DB5D8" }]}>{episodios.length}</Text>
        </View>

        {/* Episodes list */}
        <View style={{ paddingHorizontal: H_PAD }}>
          {episodios.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Feather name="search" size={32} color="#9DB5D8" style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyText, { color: "#9DB5D8" }]}>
                Sin resultados para "{query}"
              </Text>
            </View>
          ) : (
            episodios.map((s, idx) => (
              <Pressable
                key={s.id}
                onPress={() => router.push(`/session/${s.id}` as never)}
                style={({ pressed }) => [
                  styles.episodeCard,
                  { backgroundColor: "rgba(30,42,68,0.55)", borderColor: "rgba(138,170,212,0.22)", opacity: pressed ? 0.82 : 1 },
                ]}
              >
                <Image source={s.image as never} style={styles.episodeImage} />
                <View style={styles.episodeBody}>
                  <View style={styles.episodeNumRow}>
                    <View style={[styles.episodeNumBadge, { backgroundColor: "rgba(138,170,212,0.15)" }]}>
                      <Text style={[styles.episodeNum, { color: "#8AAAD4" }]}>EP {idx + 1}</Text>
                    </View>
                    {s.isNew && (
                      <View style={[styles.episodeNumBadge, { backgroundColor: "rgba(182,149,95,0.18)" }]}>
                        <Text style={[styles.episodeNum, { color: colors.primary }]}>NUEVO</Text>
                      </View>
                    )}
                  </View>
                  <Text style={[styles.episodeTitle, { color: colors.foreground }]} numberOfLines={2}>
                    {s.title}
                  </Text>
                  <Text style={[styles.episodeSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {s.subtitle}
                  </Text>
                  <View style={styles.episodeMeta}>
                    <Feather name="clock" size={11} color={colors.mutedForeground} />
                    <Text style={[styles.episodeMetaText, { color: colors.mutedForeground }]}>
                      {" "}{s.durationLabel}
                    </Text>
                  </View>
                </View>
                <Feather name="chevron-right" size={16} color={colors.border} style={{ marginRight: 14 }} />
              </Pressable>
            ))
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
    alignItems: "center",
    marginBottom: 20,
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

  searchWrap: { marginBottom: 16 },
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

  countRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 14,
  },
  countLabel: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
    flex: 1,
  },
  countNum: {
    fontSize: 13,
    fontWeight: "500",
  },

  episodeCard: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 12,
    minHeight: 110,
  },
  episodeImage: {
    width: 110,
    height: 110,
    resizeMode: "cover",
  },
  episodeBody: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    justifyContent: "center",
    gap: 4,
  },
  episodeNumRow: {
    flexDirection: "row",
    gap: 6,
    marginBottom: 2,
  },
  episodeNumBadge: {
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 3,
  },
  episodeNum: {
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  episodeTitle: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  episodeSub: { fontSize: 11 },
  episodeMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  episodeMetaText: { fontSize: 11 },

  emptyWrap: {
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
  },
});
