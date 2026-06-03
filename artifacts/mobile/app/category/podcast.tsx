import { Feather } from "@expo/vector-icons";
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
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CategoryInfoPanel } from "@/components/CategoryInfoPanel";
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
    <View style={[styles.root, { backgroundColor: "#060A0F" }]}>
      <StatusBar barStyle="light-content" />
      <LinearGradient
        colors={["#060A0F", "#060A0F"]}
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
          <Pressable onPress={() => router.back()} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <View style={[styles.catIconCircle, { backgroundColor: "transparent", borderColor: "transparent" }]}>
            <Feather name="mic" size={44} color="#588EC8" />
          </View>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Mezclador</Text>
          <Text style={[styles.pageSub, { color: "#EDE1D3" }]}>
            Conversaciones que despiertan el alma
          </Text>
        </View>

        {/* Search */}
        <View style={[styles.searchWrap, { paddingHorizontal: H_PAD }]}>
          <View style={[styles.searchBar, { backgroundColor: "#090E17", borderColor: "transparent", borderWidth: 0 }]}>
            <Feather name="search" size={16} color="rgba(122,143,168,0.5)" style={{ marginRight: 8 }} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar episodio..."
              placeholderTextColor="rgba(122,143,168,0.45)"
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

        {/* Episodes count */}
        <View style={[styles.countRow, { paddingHorizontal: H_PAD }]}>
          <Feather name="mic" size={13} color={colors.mutedForeground} style={{ marginRight: 6 }} />
          <Text style={[styles.countLabel, { color: colors.foreground }]}>Episodios</Text>
          <Text style={[styles.countNum, { color: colors.mutedForeground }]}>{episodios.length}</Text>
        </View>

        {/* Episodes list */}
        <View style={{ paddingHorizontal: H_PAD }}>
          {episodios.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Feather name="search" size={32} color={colors.mutedForeground} style={{ marginBottom: 12 }} />
              <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                Sin resultados para "{query}"
              </Text>
            </View>
          ) : (
            episodios.map((s, idx) => (
              <React.Fragment key={s.id}>
                <Pressable
                  onPress={() => router.push(`/session/${s.id}` as never)}
                  style={({ pressed }) => [
                    styles.episodeCard,
                    { backgroundColor: "#090E17", borderColor: "transparent", borderWidth: 0, opacity: pressed ? 0.82 : 1 },
                  ]}
                >
                  <ExpoImage
                    source={s.image as never}
                    style={styles.episodeImage}
                    contentFit="cover"
                    transition={0}
                    cachePolicy="memory-disk"
                  />
                  <View style={styles.episodeBody}>
                    <View style={styles.episodeNumRow}>
                      <View style={[styles.episodeNumBadge, { backgroundColor: "rgba(122,143,168,0.12)" }]}>
                        <Text style={[styles.episodeNum, { color: colors.mutedForeground }]}>EP {idx + 1}</Text>
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

                {idx === 0 && (
                  <CategoryInfoPanel
                    accentColor={colors.primary}
                    heading="¿Qué es el PodCast?"
                    items={[
                      {
                        icon: "mic",
                        title: "Conversaciones con propósito",
                        body: "Cada episodio es un encuentro con voces que comparten su mirada sobre el bienestar, la consciencia y el camino interior.",
                      },
                      {
                        icon: "headphones",
                        title: "Para escuchar en cualquier momento",
                        body: "Ideal para acompañar caminatas, viajes o momentos de calma. Audio diseñado para enfocarte sin distracciones.",
                      },
                      {
                        icon: "feather",
                        title: "Inspiración cercana",
                        body: "Historias reales, herramientas prácticas y reflexiones que se quedan resonando mucho después de terminar.",
                      },
                    ]}
                    quote="A veces, escuchar a otro es la mejor forma de escucharte a vos mismo."
                    whyItems={[
                      { icon: "heart", text: "Porque las palabras justas pueden cambiar una mañana entera." },
                      { icon: "sun", text: "Porque crecer también es escuchar." },
                    ]}
                  />
                )}
              </React.Fragment>
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
