import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  getGetNotificationPreferencesQueryKey,
  useGetNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useBackOverride } from "@/context/BackOverrideContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useColors } from "@/hooks/useColors";

type PreferenceOption = {
  id: string;
  label: string;
  color?: string;
};

type PreferencesResponse = {
  categoryOptions?: PreferenceOption[];
  editorialTagOptions?: PreferenceOption[];
  selectedCategoryIds?: string[];
  categoryIds?: string[];
  selectedEditorialTags?: string[];
  editorialTagValues?: string[];
};

type Selection = {
  categoryIds: string[];
  editorialTags: string[];
};

const CATEGORY_ICONS: Record<string, React.ComponentProps<typeof MaterialCommunityIcons>["name"]> = {
  "musica-sonidos": "music-note",
  "meditaciones-guiadas": "meditation",
  "sonidos-ancestrales": "bowl-mix",
  ambientales: "leaf",
  historias: "book-open-page-variant",
  charlas: "message-text-outline",
};

function asOption(value: unknown): PreferenceOption | null {
  if (typeof value === "string") return { id: value, label: value };
  if (!value || typeof value !== "object") return null;
  const item = value as { id?: unknown; value?: unknown; label?: unknown; name?: unknown; color?: unknown };
  const id = typeof item.id === "string" ? item.id : typeof item.value === "string" ? item.value : null;
  const label =
    typeof item.label === "string"
      ? item.label
      : typeof item.name === "string"
        ? item.name
        : id;
  return id && label ? { id, label, color: typeof item.color === "string" ? item.color : undefined } : null;
}

function readOptions(value: unknown): PreferenceOption[] {
  return Array.isArray(value)
    ? value.map(asOption).filter((item): item is PreferenceOption => item !== null)
    : [];
}

export default function PersonalizarNotificacionesScreen() {
  const colors = useColors();
  const { theme } = useSceneTheme();
  const insets = useSafeAreaInsets();
  const backOverride = useBackOverride();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const preferencesQ = useGetNotificationPreferences({
    query: { queryKey: getGetNotificationPreferencesQueryKey() },
  });
  const queryClient = useQueryClient();
  const updatePreferences = useUpdateNotificationPreferences();
  const response = (preferencesQ.data ?? {}) as PreferencesResponse;

  const categories = useMemo(() => readOptions(response.categoryOptions), [response.categoryOptions]);
  const editorialTags = useMemo(
    () => readOptions(response.editorialTagOptions),
    [response.editorialTagOptions],
  );
  const serverCategoryIds = response.selectedCategoryIds ?? response.categoryIds ?? [];
  const serverEditorialTags = response.selectedEditorialTags ?? response.editorialTagValues ?? [];
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[] | null>(null);
  const [selectedEditorialTags, setSelectedEditorialTags] = useState<string[] | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const selectionRef = useRef<Selection | null>(null);
  const confirmedRef = useRef<Selection | null>(null);
  const desiredRef = useRef<Selection | null>(null);
  const queueRunningRef = useRef(false);

  useEffect(() => {
    if (!preferencesQ.data || confirmedRef.current) return;
    const initial: Selection = {
      categoryIds: [...serverCategoryIds],
      editorialTags: [...serverEditorialTags],
    };
    selectionRef.current = initial;
    confirmedRef.current = initial;
    setSelectedCategoryIds(initial.categoryIds);
    setSelectedEditorialTags(initial.editorialTags);
  }, [preferencesQ.data, serverCategoryIds, serverEditorialTags]);

  const activeCategoryIds = selectedCategoryIds ?? serverCategoryIds;
  const activeEditorialTags = selectedEditorialTags ?? serverEditorialTags;

  async function drainSaveQueue() {
    if (queueRunningRef.current) return;
    queueRunningRef.current = true;
    setSaveError(null);

    while (desiredRef.current) {
      const target = desiredRef.current;
      desiredRef.current = null;
      try {
        const saved = await updatePreferences.mutateAsync({
          data: {
            selectedCategoryIds: target.categoryIds,
            selectedEditorialTags: target.editorialTags,
          },
        });
        const confirmed: Selection = {
          categoryIds: [...(saved.selectedCategoryIds ?? target.categoryIds)],
          editorialTags: [...(saved.selectedEditorialTags ?? target.editorialTags)],
        };
        queryClient.setQueryData(getGetNotificationPreferencesQueryKey(), saved);
        confirmedRef.current = confirmed;
        if (!desiredRef.current) {
          selectionRef.current = confirmed;
          setSelectedCategoryIds(confirmed.categoryIds);
          setSelectedEditorialTags(confirmed.editorialTags);
        }
      } catch {
        if (!desiredRef.current) {
          const rollback = confirmedRef.current ?? target;
          selectionRef.current = rollback;
          setSelectedCategoryIds(rollback.categoryIds);
          setSelectedEditorialTags(rollback.editorialTags);
          setSaveError("No se pudieron guardar tus preferencias. Inténtalo de nuevo.");
        }
      }
    }

    queueRunningRef.current = false;
    if (desiredRef.current) void drainSaveQueue();
  }

  function save(nextCategories: string[], nextEditorialTags: string[]) {
    const next: Selection = {
      categoryIds: [...nextCategories],
      editorialTags: [...nextEditorialTags],
    };
    selectionRef.current = next;
    desiredRef.current = next;
    setSelectedCategoryIds(nextCategories);
    setSelectedEditorialTags(nextEditorialTags);
    setSaveError(null);
    void drainSaveQueue();
  }

  function toggleCategory(id: string) {
    const current = selectionRef.current ?? {
      categoryIds: activeCategoryIds,
      editorialTags: activeEditorialTags,
    };
    const next = current.categoryIds.includes(id)
      ? current.categoryIds.filter((value) => value !== id)
      : [...current.categoryIds, id];
    save(next, current.editorialTags);
  }

  function toggleEditorialTag(id: string) {
    const current = selectionRef.current ?? {
      categoryIds: activeCategoryIds,
      editorialTags: activeEditorialTags,
    };
    const next = current.editorialTags.includes(id)
      ? current.editorialTags.filter((value) => value !== id)
      : [...current.editorialTags, id];
    save(current.categoryIds, next);
  }

  const isLoading = preferencesQ.isLoading;
  const isError = preferencesQ.isError;
  const hasOptions = categories.length > 0 || editorialTags.length > 0;

  return (
    <>
      <Stack.Screen options={{ contentStyle: { backgroundColor: theme.gradient[0] } }} />
      <LinearGradient
        style={[styles.root, { backgroundColor: theme.solid }]}
        colors={theme.gradient as unknown as [string, string, ...string[]]}
        locations={theme.gradientLocations}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      >
        <StatusBar hidden />
        <View style={styles.contentShift}>
          <View style={[styles.stickyHeader, { paddingTop: topPad + 4 }]}>
            <View style={[styles.stickyHeaderRow, styles.libraryTabHeaderRow]}>
              <Pressable
                onPress={backOverride ?? (() => (router.canGoBack() ? router.back() : router.replace("/(tabs)" as never)))}
                hitSlop={6}
                style={styles.libraryTabBackHitArea}
                accessibilityRole="button"
                accessibilityLabel="Volver"
              >
                {({ pressed }) => (
                  <View style={[styles.libraryTabBackBtn, { opacity: pressed ? 0.7 : 1 }]}>
                    <Feather name="chevron-left" size={28} color="#FBFBFB" style={{ transform: [{ translateX: -1 }] }} />
                  </View>
                )}
              </Pressable>
              <Text style={styles.stickyTitle}>Personalizar notificaciones</Text>
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{
              paddingTop: 23,
              paddingBottom: bottomPad + 40,
              paddingHorizontal: 20,
            }}
            showsVerticalScrollIndicator={false}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.primary} style={styles.state} />
            ) : isError ? (
              <View style={styles.state}>
                <Text style={styles.stateTitle}>No pudimos cargar tus preferencias</Text>
                <Pressable onPress={() => preferencesQ.refetch()} style={styles.retryButton}>
                  <Text style={styles.retryText}>Reintentar</Text>
                </Pressable>
              </View>
            ) : !hasOptions ? (
              <View style={styles.state}>
                <MaterialCommunityIcons name="bell-outline" size={32} color="rgba(255,255,255,0.7)" />
                <Text style={styles.stateTitle}>Aún no hay opciones disponibles</Text>
                <Text style={styles.stateBody}>Cuando haya nuevas categorías o etiquetas editoriales podrás elegirlas aquí.</Text>
              </View>
            ) : (
              <>
                {categories.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notificaciones categorías principales</Text>
                    <View style={styles.categoryGrid}>
                      {categories.map((category) => {
                        const selected = activeCategoryIds.includes(category.id);
                        return (
                          <Pressable
                            key={category.id}
                            testID={`notification-category-${category.id}`}
                            onPress={() => toggleCategory(category.id)}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: selected }}
                            style={({ pressed }) => [
                              styles.categoryBlock,
                              { borderColor: selected ? category.color ?? colors.primary : "rgba(255,255,255,0.16)" },
                              selected && { backgroundColor: `${category.color ?? colors.primary}38` },
                              { opacity: pressed ? 0.76 : 1 },
                            ]}
                          >
                            <MaterialCommunityIcons
                              name={CATEGORY_ICONS[category.id] ?? "bell-outline"}
                              size={24}
                              color={category.color ?? "#F9F9F9"}
                            />
                            <Text style={styles.categoryLabel}>{category.label}</Text>
                            {selected && <Feather name="check" size={16} color="#FBFBFB" style={styles.check} />}
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                )}

                {editorialTags.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Notificaciones tags editoriales</Text>
                    <Text style={styles.sectionDescription}>Elige los temas específicos que quieres seguir.</Text>
                    <View style={styles.pills}>
                      {editorialTags.map((tag) => {
                        const selected = activeEditorialTags.includes(tag.id);
                        return (
                          <Pressable
                            key={tag.id}
                            testID={`notification-editorial-${tag.id}`}
                            onPress={() => toggleEditorialTag(tag.id)}
                            accessibilityRole="checkbox"
                            accessibilityState={{ checked: selected }}
                            style={({ pressed }) => [
                              styles.pill,
                              selected && styles.pillSelected,
                              { opacity: pressed ? 0.74 : 1 },
                            ]}
                          >
                            <Text style={[styles.pillLabel, selected && styles.pillLabelSelected]}>{tag.label}</Text>
                            {selected && <Feather name="check" size={14} color="#FBFBFB" />}
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                )}
              </>
            )}
            {saveError && <Text style={styles.error}>{saveError}</Text>}
            {updatePreferences.isPending && <Text style={styles.saving}>Guardando…</Text>}
          </ScrollView>
        </View>
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  contentShift: { flex: 1, transform: [{ translateY: -5 }] },
  stickyHeader: { zIndex: 10, backgroundColor: "transparent" },
  stickyHeaderRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  libraryTabHeaderRow: { minHeight: 48, paddingBottom: 6, transform: [{ translateY: 8 }] },
  libraryTabBackHitArea: {
    position: "absolute",
    left: 16,
    top: -4,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    elevation: 20,
  },
  libraryTabBackBtn: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    borderWidth: 1.2,
    borderColor: "rgba(241,224,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  stickyTitle: {
    fontFamily: "Manrope",
    fontSize: 18,
    lineHeight: 21,
    fontWeight: "700",
    color: "#FBFBFB",
    letterSpacing: 0.2,
    textAlign: "center",
    flex: 1,
  },
  scroll: { flex: 1 },
  state: { alignItems: "center", justifyContent: "center", paddingTop: 72, paddingHorizontal: 16 },
  stateTitle: { color: "#FBFBFB", fontFamily: "Manrope", fontSize: 16, fontWeight: "700", textAlign: "center", marginTop: 14 },
  stateBody: { color: "rgba(255,255,255,0.68)", fontFamily: "Manrope", fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: 8 },
  retryButton: { marginTop: 18, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.14)" },
  retryText: { color: "#FBFBFB", fontFamily: "Manrope", fontSize: 14, fontWeight: "700" },
  section: { marginBottom: 29 },
  sectionTitle: { color: "#FBFBFB", fontFamily: "Manrope", fontSize: 16, fontWeight: "700", letterSpacing: 0.1, marginBottom: 13 },
  sectionDescription: { color: "rgba(255,255,255,0.66)", fontFamily: "Manrope", fontSize: 13, marginTop: -5, marginBottom: 14 },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  categoryBlock: {
    width: "31.5%",
    minHeight: 103,
    borderWidth: 1,
    borderRadius: 18,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  categoryLabel: { color: "#FBFBFB", fontFamily: "Manrope", fontSize: 12, fontWeight: "700", textAlign: "center", marginTop: 8 },
  check: { position: "absolute", top: 9, right: 9 },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  pill: {
    minHeight: 38,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(255,255,255,0.07)",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  pillSelected: { borderColor: "rgba(255,255,255,0.75)", backgroundColor: "rgba(255,255,255,0.2)" },
  pillLabel: { color: "rgba(255,255,255,0.82)", fontFamily: "Manrope", fontSize: 13 },
  pillLabelSelected: { color: "#FBFBFB", fontWeight: "700" },
  error: { color: "#FFB4B4", fontFamily: "Manrope", fontSize: 13, textAlign: "center", marginTop: 4 },
  saving: { color: "rgba(255,255,255,0.64)", fontFamily: "Manrope", fontSize: 12, textAlign: "center", marginTop: 8 },
});