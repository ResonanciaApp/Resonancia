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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { SessionCard } from "@/components/SessionCard";
import { DiarioEntryCard } from "@/components/DiarioEntryCard";
import { useDiarioFavoritesCtx } from "@/context/DiarioFavoritesContext";
import { useIntencion } from "@/context/IntencionContext";
import { usePlayer } from "@/context/PlayerContext";
import { SESSIONS } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("es-ES", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function FavoritesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { favorites } = usePlayer();
  const { favoriteEntries } = useDiarioFavoritesCtx();
  const { favorites: intencionFavorites, removeFavorite: removeIntencionFavorite } = useIntencion();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const favSessions = useMemo(
    () => SESSIONS.filter((s) => favorites.includes(s.id)),
    [favorites],
  );

  // Tags presentes en los favoritos (themeTag + sleepTag únicos)
  const availableTags = useMemo(() => {
    const set = new Set<string>();
    favSessions.forEach((s) => {
      s.themeTag?.forEach((t) => set.add(t));
      if (s.sleepTag) set.add(s.sleepTag);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, "es"));
  }, [favSessions]);

  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  // Si el tag activo desaparece (último fav removido), resetear
  if (activeTag && !availableTags.includes(activeTag)) {
    setActiveTag(null);
  }

  const filteredSessions = useMemo(() => {
    const q = query.trim().toLowerCase();
    return favSessions.filter((s) => {
      if (activeTag && !(s.themeTag?.includes(activeTag as never) || s.sleepTag === activeTag)) {
        return false;
      }
      if (!q) return true;
      const hay = [
        s.title,
        s.description,
        s.categoryLabel,
        s.sleepTag,
        ...(s.themeTag ?? []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return hay.includes(q);
    });
  }, [favSessions, activeTag, query]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: 160 + bottomPad,
          paddingTop: topPad + 12,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerTop}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)" as never))}
            hitSlop={10}
            style={[styles.backBtn, { backgroundColor: colors.card }]}
          >
            <Feather name="chevron-left" size={20} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Favoritos</Text>
          <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
            Tus viajes sonoros y reflexiones guardados
          </Text>
        </View>

        {favSessions.length > 0 && (
          <View
            style={[
              styles.searchWrap,
              { backgroundColor: colors.card },
            ]}
          >
            <Feather name="search" size={16} color={colors.mutedForeground} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Buscar en favoritos…"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.searchInput, { color: colors.foreground }]}
              returnKeyType="search"
              autoCorrect={false}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")} hitSlop={8}>
                <Feather name="x" size={16} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>
        )}

        {/* ── Sesiones ── */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionTitleRow}>
            <Feather name="headphones" size={15} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Sesiones
            </Text>
          </View>

          {favSessions.length === 0 ? (
            <View style={[styles.emptySmall, { backgroundColor: colors.card }]}>
              <Feather name="music" size={20} color={colors.border} />
              <Text style={[styles.emptySmallText, { color: colors.mutedForeground }]}>
                Aún no guardaste sesiones
              </Text>
              <Pressable
                onPress={() => router.push("/(tabs)/explore" as never)}
                style={[styles.emptyLink]}
              >
                <Text style={[styles.emptyLinkText, { color: colors.accent }]}>Explorar</Text>
              </Pressable>
            </View>
          ) : (
            <View>
              <Text style={[styles.countLabel, { color: colors.mutedForeground }]}>
                {filteredSessions.length} de {favSessions.length} sesión{favSessions.length !== 1 ? "es" : ""}
                {activeTag ? ` · ${activeTag}` : ""}
              </Text>

              {availableTags.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.chipsRow}
                  style={styles.chipsScroll}
                >
                  <Pressable
                    onPress={() => setActiveTag(null)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: activeTag === null ? colors.primary : colors.card,
                        borderColor: activeTag === null ? colors.primary : colors.border,
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        { color: activeTag === null ? "#080F0A" : colors.foreground },
                      ]}
                    >
                      Todas
                    </Text>
                  </Pressable>
                  {availableTags.map((tag) => {
                    const active = activeTag === tag;
                    return (
                      <Pressable
                        key={tag}
                        onPress={() => setActiveTag(active ? null : tag)}
                        style={[
                          styles.chip,
                          {
                            backgroundColor: active ? colors.primary : colors.card,
                            borderColor: active ? colors.primary : colors.border,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.chipText,
                            { color: active ? "#080F0A" : colors.foreground },
                          ]}
                          numberOfLines={1}
                        >
                          {tag}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              )}

              {filteredSessions.length === 0 ? (
                <View
                  style={[
                    styles.emptySmall,
                    { backgroundColor: colors.card, marginTop: 8 },
                  ]}
                >
                  <Feather name="filter" size={18} color={colors.border} />
                  <Text style={[styles.emptySmallText, { color: colors.mutedForeground }]}>
                    Ninguna sesión coincide con esta etiqueta.
                  </Text>
                </View>
              ) : (
                filteredSessions.map((s) => (
                  <SessionCard key={s.id} session={s} horizontal />
                ))
              )}
            </View>
          )}
        </View>

        {/* ── Diario ── */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionTitleRow}>
            <Feather name="book-open" size={15} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Diario
            </Text>
          </View>

          {favoriteEntries.length === 0 ? (
            <View style={[styles.emptySmall, { backgroundColor: colors.card }]}>
              <Feather name="heart" size={20} color={colors.border} />
              <Text style={[styles.emptySmallText, { color: colors.mutedForeground }]}>
                Marca entradas con ♥ en el diario
              </Text>
            </View>
          ) : (
            <View style={styles.entriesList}>
              <Text style={[styles.countLabel, { color: colors.mutedForeground }]}>
                {favoriteEntries.length} entrada{favoriteEntries.length !== 1 ? "s" : ""} guardada{favoriteEntries.length !== 1 ? "s" : ""}
              </Text>
              {favoriteEntries.map((entry) => (
                <DiarioEntryCard key={entry.id} entry={entry} />
              ))}
            </View>
          )}
        </View>

        {/* ── Intención del día ── */}
        <View style={styles.sectionBlock}>
          <View style={styles.sectionTitleRow}>
            <Feather name="sun" size={15} color={colors.accent} />
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Intención del día
            </Text>
          </View>

          {intencionFavorites.length === 0 ? (
            <View style={[styles.emptySmall, { backgroundColor: colors.card }]}>
              <Feather name="heart" size={20} color={colors.border} />
              <Text style={[styles.emptySmallText, { color: colors.mutedForeground }]}>
                Marca intenciones con ♥ para guardarlas aquí
              </Text>
            </View>
          ) : (
            <View style={styles.entriesList}>
              <Text style={[styles.countLabel, { color: colors.mutedForeground }]}>
                {intencionFavorites.length} intención{intencionFavorites.length !== 1 ? "es" : ""} guardada{intencionFavorites.length !== 1 ? "s" : ""}
              </Text>
              {intencionFavorites.map((fav) => (
                <View
                  key={fav}
                  style={[styles.intencionCard, { backgroundColor: colors.card }]}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.intencionLabel, { color: colors.mutedForeground }]}>Hoy voy a...</Text>
                    <Text style={[styles.intencionText, { color: colors.foreground }]}>{fav}</Text>
                  </View>
                  <Pressable
                    onPress={() => removeIntencionFavorite(fav)}
                    hitSlop={8}
                    style={[styles.removeBtn, { backgroundColor: colors.card }]}
                  >
                    <Feather name="trash-2" size={14} color={colors.mutedForeground} />
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  headerTop: { marginBottom: 14 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  header: { marginBottom: 20 },
  searchWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === "ios" ? 10 : 6,
    marginBottom: 22,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    padding: 0,
  },
  pageTitle: { fontSize: 30, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },
  pageSub: { fontSize: 13 },

  sectionBlock: { marginBottom: 32 },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", letterSpacing: 0.3 },

  countLabel: { fontSize: 12, marginBottom: 12 },

  emptySmall: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 16,
    borderRadius: 16,
  },
  emptySmallText: { fontSize: 13, flex: 1 },
  emptyLink: {
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  emptyLinkText: { fontSize: 12, fontWeight: "600" },

  entriesList: { gap: 10 },
  intencionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    padding: 16,
  },
  intencionLabel: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 4,
  },
  intencionText: { fontSize: 14, lineHeight: 20 },
  removeBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  chipsScroll: { marginBottom: 14 },
  chipsRow: { gap: 8, paddingRight: 4 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 220,
  },
  chipText: { fontSize: 12, fontWeight: "600" },
});
