import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageSourcePropType,
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import { useColors } from "@/hooks/useColors";
import { useSceneTheme } from "@/context/SceneThemeContext";
import {
  SEARCH_DURATION_RANGES,
  type SearchDurationRangeId,
} from "@/constants/searchDuration";
import {
  getGetSearchTrendsQueryKey,
  useGetSearchTrends,
  useRecordSearchTrendOpen,
} from "@workspace/api-client-react";

export type ContextSearchItem = {
  id: string;
  title: string;
  meta?: string;
  subtitle?: string;
  searchText?: string;
  image?: ImageSourcePropType;
  duration?: number;
};

export type ContextSearchScope = "sleep" | "discover";

type ContextSearchModalProps = {
  visible: boolean;
  onClose: () => void;
  items: ContextSearchItem[];
  placeholder: string;
  emptyTitle: string;
  emptySubtitle: string;
  onSelect: (item: ContextSearchItem) => boolean | void;
  scope?: ContextSearchScope;
  popularTerms?: string[];
  onSearchSelection?: (term: string, item: ContextSearchItem) => void;
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function ContextSearchModal({
  visible,
  onClose,
  items,
  placeholder,
  emptyTitle,
  emptySubtitle,
  onSelect,
  scope,
  popularTerms,
  onSearchSelection,
}: ContextSearchModalProps) {
  const colors = useColors();
  const { theme } = useSceneTheme();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const focusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [query, setQuery] = useState("");
  const [durationRangeId, setDurationRangeId] = useState<SearchDurationRangeId | null>(null);
  const [recentId, setRecentId] = useState<string | null>(null);
  const recentStorageKey = scope ? `resonance_search_recent_${scope}_v1` : null;
  const { data: trendData } = useGetSearchTrends(
    { context: scope ?? "discover" },
    {
      query: {
        queryKey: getGetSearchTrendsQueryKey({ context: scope ?? "discover" }),
        enabled: Boolean(scope) && visible,
        staleTime: 5 * 60_000,
        retry: 1,
      },
    },
  );
  const recordTrendOpen = useRecordSearchTrendOpen();
  const fallbackPopularTerms =
    scope === "sleep"
      ? ["Dormir profundamente", "Ruido blanco", "Historias para dormir"]
      : ["Ansiedad", "Meditación", "Cuencos"];
  const serverPopularTerms = trendData?.terms.map(({ term }) =>
    term.length > 0 ? `${term[0].toLocaleUpperCase("es")}${term.slice(1)}` : term,
  );
  const displayedPopularTerms = (
    popularTerms?.length
      ? popularTerms
      : serverPopularTerms?.length
        ? serverPopularTerms
        : fallbackPopularTerms
  ).slice(0, 3);

  useEffect(() => {
    if (!visible) {
      if (focusTimerRef.current) {
        clearTimeout(focusTimerRef.current);
        focusTimerRef.current = null;
      }
      setQuery("");
      setDurationRangeId(null);
      Keyboard.dismiss();
      return;
    }
    focusTimerRef.current = setTimeout(() => {
      inputRef.current?.focus();
      focusTimerRef.current = null;
    }, 120);
    if (!recentStorageKey) return;
    AsyncStorage.getItem(recentStorageKey)
      .then((value) => setRecentId(value))
      .catch(() => setRecentId(null));
    return () => {
      if (focusTimerRef.current) {
        clearTimeout(focusTimerRef.current);
        focusTimerRef.current = null;
      }
    };
  }, [recentStorageKey, visible]);

  const results = useMemo(() => {
    const term = normalize(query.trim());
    const durationRange = SEARCH_DURATION_RANGES.find((range) => range.id === durationRangeId);
    if (!term && !durationRange) return [];
    return items
      .filter((item) => {
        if (
          durationRange &&
          (item.duration == null || item.duration < durationRange.min || item.duration > durationRange.max)
        ) {
          return false;
        }
        return (
          !term ||
          normalize(item.searchText ?? `${item.title} ${item.meta ?? ""} ${item.subtitle ?? ""}`).includes(term)
        );
      })
      .slice(0, 30);
  }, [durationRangeId, items, query]);

  const recentItem = useMemo(
    () => (recentId ? items.find((item) => item.id === recentId) ?? null : null),
    [items, recentId],
  );

  const close = () => {
    Keyboard.dismiss();
    setQuery("");
    setDurationRangeId(null);
    onClose();
  };

  const selectItem = (item: ContextSearchItem) => {
    const term = query.trim();
    close();
    const selectionResult = onSelect(item);
    const openedSuccessfully = scope ? selectionResult === true : selectionResult !== false;
    if (!openedSuccessfully) return;

    if (recentStorageKey) AsyncStorage.setItem(recentStorageKey, item.id).catch(() => {});
    setRecentId(item.id);
    if (!term) return;

    onSearchSelection?.(term, item);
    if (scope) {
      recordTrendOpen.mutate({
        data: {
          context: scope,
          term,
          sessionId: item.id,
        },
      });
    }
  };

  const clearRecent = () => {
    setRecentId(null);
    if (recentStorageKey) AsyncStorage.removeItem(recentStorageKey).catch(() => {});
  };

  const backgroundColor = theme.gradient[0] as string;

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={close}
      onShow={() => {
        if (focusTimerRef.current) clearTimeout(focusTimerRef.current);
        focusTimerRef.current = setTimeout(() => {
          inputRef.current?.focus();
          focusTimerRef.current = null;
        }, 120);
      }}
    >
      <KeyboardAvoidingView style={styles.root} behavior="padding" keyboardVerticalOffset={0}>
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor }]}>
          {theme.id === "tibet" && (
            <LinearGradient
              colors={theme.gradient as [string, string, ...string[]]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
          )}
        </View>

        <View
          style={[
            styles.header,
            {
              paddingTop: insets.top + 14,
              backgroundColor: theme.id === "tibet" ? "transparent" : backgroundColor,
            },
          ]}
        >
          <View style={styles.searchBar}>
            <Feather name="search" size={17} color={colors.foreground} />
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: colors.foreground }]}
              placeholder={placeholder}
              placeholderTextColor={colors.mutedForeground}
              value={query}
              onChangeText={setQuery}
              returnKeyType="search"
              autoFocus
              autoCorrect={false}
              autoCapitalize="none"
              accessibilityLabel={placeholder}
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery("")} hitSlop={10} accessibilityLabel="Borrar búsqueda">
                <Feather name="x" size={17} color={colors.mutedForeground} />
              </Pressable>
            )}
          </View>
          <Pressable onPress={close} hitSlop={10} style={styles.closeButton} accessibilityLabel="Cerrar búsqueda">
            <Feather name="x" size={19} color={colors.foreground} />
          </Pressable>
        </View>

        {scope && query.trim().length === 0 && durationRangeId === null ? (
          <ScrollView
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.menuContent}
          >
            {recentItem ? (
              <View style={styles.menuSection}>
                <View style={styles.sectionHeader}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Búsqueda reciente</Text>
                  <Pressable onPress={clearRecent} hitSlop={10} accessibilityLabel="Borrar búsqueda reciente">
                    <Text style={[styles.clearLabel, { color: colors.mutedForeground }]}>Borrar</Text>
                  </Pressable>
                </View>
                <Pressable
                  onPress={() => selectItem(recentItem)}
                  style={({ pressed }) => [styles.recentCard, { opacity: pressed ? 0.72 : 1 }]}
                  accessibilityRole="button"
                  accessibilityLabel={`Abrir ${recentItem.title}`}
                >
                  {recentItem.image ? (
                    <Image source={recentItem.image} style={styles.recentThumb} contentFit="cover" />
                  ) : null}
                  <View style={styles.resultCopy}>
                    <Text style={[styles.resultTitle, { color: colors.foreground }]} numberOfLines={2}>
                      {recentItem.title}
                    </Text>
                    <Text style={[styles.resultSubtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {[recentItem.meta, recentItem.subtitle].filter(Boolean).join(" · ")}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
                </Pressable>
              </View>
            ) : null}

            <View style={styles.menuSection}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Búsquedas populares</Text>
              <View style={styles.popularList}>
                {displayedPopularTerms.map((term, index) => (
                  <Pressable
                    key={term}
                    onPress={() => setQuery(term)}
                    style={({ pressed }) => [styles.popularRow, { opacity: pressed ? 0.65 : 1 }]}
                    accessibilityRole="button"
                    accessibilityLabel={`Buscar ${term}`}
                  >
                    <Text style={[styles.popularRank, { color: colors.mutedForeground }]}>{index + 1}</Text>
                    <Text style={[styles.popularTerm, { color: colors.foreground }]}>{term}</Text>
                    <Feather name="arrow-up-right" size={18} color={colors.mutedForeground} />
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.menuSection}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Según la duración</Text>
              <View style={styles.durationGrid}>
                {SEARCH_DURATION_RANGES.map((range) => (
                  <Pressable
                    key={range.id}
                    onPress={() => setDurationRangeId(range.id)}
                    style={({ pressed }) => [
                      styles.durationPill,
                      {
                        borderColor: "rgba(255,255,255,0.3)",
                        backgroundColor: "rgba(255,255,255,0.07)",
                        opacity: pressed ? 0.65 : 1,
                      },
                    ]}
                    accessibilityRole="button"
                    accessibilityLabel={`Filtrar por ${range.label}`}
                  >
                    <Text style={[styles.durationText, { color: colors.foreground }]}>{range.label}</Text>
                  </Pressable>
                ))}
              </View>
            </View>
          </ScrollView>
        ) : query.trim().length === 0 && durationRangeId === null ? (
          <View style={styles.empty}>
            <Feather name="search" size={42} color={colors.mutedForeground} style={styles.emptyIcon} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>{emptyTitle}</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>{emptySubtitle}</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            contentContainerStyle={styles.resultsContent}
            ListHeaderComponent={
              durationRangeId ? (
                <View style={styles.filterHeader}>
                  <Text style={[styles.filterTitle, { color: colors.foreground }]}>
                    {SEARCH_DURATION_RANGES.find((range) => range.id === durationRangeId)?.label}
                  </Text>
                  <Pressable onPress={() => setDurationRangeId(null)} hitSlop={10}>
                    <Text style={[styles.clearLabel, { color: colors.mutedForeground }]}>Quitar filtro</Text>
                  </Pressable>
                </View>
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Feather name="search" size={36} color={colors.mutedForeground} style={styles.emptyIcon} />
                <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Sin resultados</Text>
                <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>Intenta con otro término</Text>
              </View>
            }
            renderItem={({ item }) => (
              <Pressable
                onPress={() => {
                  selectItem(item);
                }}
                style={({ pressed }) => [styles.resultRow, { opacity: pressed ? 0.7 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel={`Abrir ${item.title}`}
              >
                {item.image ? (
                  <Image source={item.image} style={styles.thumb} contentFit="cover" />
                ) : (
                  <View style={[styles.thumb, styles.fallbackThumb, { backgroundColor: colors.card }]}>
                    <Feather name="file-text" size={20} color={colors.mutedForeground} />
                  </View>
                )}
                <View style={styles.resultCopy}>
                  {item.meta && (
                    <Text style={[styles.resultMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {item.meta}
                    </Text>
                  )}
                  <Text style={[styles.resultTitle, { color: colors.foreground }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  {item.subtitle && (
                    <Text style={[styles.resultSubtitle, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {item.subtitle}
                    </Text>
                  )}
                </View>
              </Pressable>
            )}
          />
        )}
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    minHeight: 45,
    borderRadius: 12,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.8)",
    backgroundColor: "rgba(255,255,255,0.09)",
  },
  input: {
    flex: 1,
    fontFamily: "Manrope",
    fontSize: 15,
    padding: 0,
  },
  closeButton: {
    padding: 4,
  },
  empty: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
    paddingBottom: 70,
  },
  emptyIcon: {
    marginBottom: 16,
  },
  emptyTitle: {
    fontFamily: "Manrope",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 8,
  },
  emptySubtitle: {
    fontFamily: "Manrope",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  resultsContent: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  menuContent: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 44,
    gap: 32,
  },
  menuSection: {
    gap: 13,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontFamily: "Manrope",
    fontSize: 19,
    fontWeight: "700",
  },
  clearLabel: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
  },
  recentCard: {
    minHeight: 82,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 8,
    paddingRight: 14,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  recentThumb: {
    width: 66,
    height: 66,
    borderRadius: 13,
  },
  popularList: {
    borderRadius: 18,
    paddingHorizontal: 15,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  popularRow: {
    minHeight: 51,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.13)",
  },
  popularRank: {
    width: 18,
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "700",
  },
  popularTerm: {
    flex: 1,
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "600",
  },
  durationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
  },
  durationPill: {
    minHeight: 42,
    justifyContent: "center",
    paddingHorizontal: 15,
    borderRadius: 21,
    borderWidth: 1,
  },
  durationText: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
  },
  filterHeader: {
    minHeight: 45,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  filterTitle: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
  },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 5,
  },
  thumb: {
    width: 75,
    height: 75,
    borderRadius: 14,
  },
  fallbackThumb: {
    alignItems: "center",
    justifyContent: "center",
  },
  resultCopy: {
    flex: 1,
  },
  resultMeta: {
    fontFamily: "Manrope",
    fontSize: 12,
    marginBottom: 3,
  },
  resultTitle: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 3,
  },
  resultSubtitle: {
    fontFamily: "Manrope",
    fontSize: 12,
  },
});