import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import {
  getGetNotificationPreferencesQueryKey,
  useGetNotificationPreferences,
  useUpdateNotificationPreferences,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Image as ExpoImage } from "expo-image";
import * as Haptics from "expo-haptics";
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
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useBackOverride } from "@/context/BackOverrideContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useColors } from "@/hooks/useColors";
import { SavedConfirmationBanner } from "@/components/SavedConfirmationBanner";

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

function sameValues(left: string[], right: string[]) {
  if (left.length !== right.length) return false;
  const rightValues = new Set(right);
  return left.every((value) => rightValues.has(value));
}

const CATEGORY_LABELS: Record<string, string> = {
  "meditaciones-guiadas": "Meditación",
  "sonidos-ancestrales": "Sonoterapia",
  "musica-sonidos": "Música",
  ambientales: "Sonidos",
  historias: "Historias",
  charlas: "Reflexiones",
};

function renderCategoryIcon(categoryId: string, color: string) {
  if (categoryId === "meditaciones-guiadas") {
    return (
      <ExpoImage
        source={require("@/assets/images/cat-meditaciones.png")}
        style={styles.meditationIcon}
        contentFit="contain"
        tintColor={color}
      />
    );
  }
  if (categoryId === "sonidos-ancestrales") {
    return (
      <ExpoImage
        source={require("@/assets/images/cat-sesiones.png")}
        style={styles.categoryImageIcon}
        contentFit="contain"
        tintColor={color}
      />
    );
  }
  if (categoryId === "musica-sonidos") {
    return (
      <ExpoImage
        source={require("@/assets/images/cat-musica.png")}
        style={styles.categoryImageIcon}
        contentFit="contain"
        tintColor={color}
      />
    );
  }
  const icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"] =
    categoryId === "ambientales"
      ? "waveform"
      : categoryId === "historias"
        ? "book-open-page-variant"
        : categoryId === "charlas"
          ? "message-text-outline"
          : "bell-outline";
  return <MaterialCommunityIcons name={icon} size={categoryId === "ambientales" ? 28 : 22} color={color} />;
}

function NotificationCategoryCard({
  category,
  selected,
  width,
  height,
  onPress,
}: {
  category: PreferenceOption;
  selected: boolean;
  width: number;
  height: number;
  onPress: () => void;
}) {
  const neutralColor = "rgba(255,255,255,0.82)";
  const selectedColor = "#060A0F";

  return (
    <Pressable
      testID={`notification-category-${category.id}`}
      onPress={onPress}
      accessibilityRole="checkbox"
      accessibilityState={{ checked: selected }}
      style={({ pressed }) => [
        styles.categoryBlock,
        {
          width,
          height,
          borderColor: selected ? "#F9F9F9" : "rgba(241,224,255,0.25)",
          backgroundColor: selected ? "#F9F9F9" : "rgba(0,0,0,0.28)",
        },
        { opacity: pressed ? 0.76 : 1 },
      ]}
    >
      <View style={styles.categoryIcon}>
        {renderCategoryIcon(category.id, selected ? selectedColor : neutralColor)}
      </View>
      <Text
        style={[
          styles.categoryLabel,
          { color: selected ? selectedColor : neutralColor },
        ]}
      >
        {CATEGORY_LABELS[category.id] ?? category.label}
      </Text>
    </Pressable>
  );
}

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
  const { width: windowWidth } = useWindowDimensions();
  const backOverride = useBackOverride();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const preferencesQ = useGetNotificationPreferences({
    query: { queryKey: getGetNotificationPreferencesQueryKey() },
  });
  const queryClient = useQueryClient();
  const updatePreferences = useUpdateNotificationPreferences();
  const response = (preferencesQ.data ?? {}) as PreferencesResponse;

  const categories = useMemo(
    () => readOptions(response.categoryOptions).filter((category) => category.id !== "reflexiones"),
    [response.categoryOptions],
  );
  const editorialTags = useMemo(
    () => readOptions(response.editorialTagOptions),
    [response.editorialTagOptions],
  );
  const categoryCardWidth = Math.floor((windowWidth - 14 * 2 - 9 * 2) / 3);
  const categoryCardHeight = Math.round(categoryCardWidth * 0.66) + 2;
  const serverCategoryIds = response.selectedCategoryIds ?? response.categoryIds ?? [];
  const serverEditorialTags = response.selectedEditorialTags ?? response.editorialTagValues ?? [];
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[] | null>(null);
  const [selectedEditorialTags, setSelectedEditorialTags] = useState<string[] | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccessTrigger, setSaveSuccessTrigger] = useState(0);
  const selectionRef = useRef<Selection | null>(null);
  const confirmedRef = useRef<Selection | null>(null);

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

  async function saveChanges() {
    const target = selectionRef.current;
    if (!target || updatePreferences.isPending) return;
    setSaveError(null);
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
      selectionRef.current = confirmed;
      setSelectedCategoryIds(confirmed.categoryIds);
      setSelectedEditorialTags(confirmed.editorialTags);
      setSaveSuccessTrigger((value) => value + 1);
    } catch {
      setSaveError("No se pudieron guardar tus preferencias. Inténtalo de nuevo.");
    }
  }

  function updateSelection(nextCategories: string[], nextEditorialTags: string[]) {
    const next: Selection = {
      categoryIds: [...nextCategories],
      editorialTags: [...nextEditorialTags],
    };
    selectionRef.current = next;
    setSelectedCategoryIds(nextCategories);
    setSelectedEditorialTags(nextEditorialTags);
    setSaveError(null);
  }

  function toggleCategory(id: string) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const current = selectionRef.current ?? {
      categoryIds: activeCategoryIds,
      editorialTags: activeEditorialTags,
    };
    const next = current.categoryIds.includes(id)
      ? current.categoryIds.filter((value) => value !== id)
      : [...current.categoryIds, id];
    updateSelection(next, current.editorialTags);
  }

  function toggleEditorialTag(id: string) {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    const current = selectionRef.current ?? {
      categoryIds: activeCategoryIds,
      editorialTags: activeEditorialTags,
    };
    const next = current.editorialTags.includes(id)
      ? current.editorialTags.filter((value) => value !== id)
      : [...current.editorialTags, id];
    updateSelection(current.categoryIds, next);
  }

  const isLoading = preferencesQ.isLoading;
  const isError = preferencesQ.isError;
  const hasOptions = categories.length > 0 || editorialTags.length > 0;
  const confirmed = confirmedRef.current;
  const hasUnsavedChanges = !!confirmed && (
    !sameValues(activeCategoryIds, confirmed.categoryIds) ||
    !sameValues(activeEditorialTags, confirmed.editorialTags)
  );
  const saveDisabled =
    !hasUnsavedChanges ||
    updatePreferences.isPending ||
    isLoading ||
    isError ||
    !hasOptions;

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
            <View style={styles.headerContent}>
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
              <Text style={styles.headerDescription}>
                Elige qué contenido quieres recibir cuando haya nuevas sesiones.
              </Text>
            </View>
          </View>

          <ScrollView
            style={styles.scroll}
            contentContainerStyle={{
              paddingTop: 23,
              paddingBottom: bottomPad + 150,
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
                    <Text style={styles.sectionTitle}>Por categoría</Text>
                    <View style={styles.categoryGrid}>
                      {categories.map((category) => {
                        const selected = activeCategoryIds.includes(category.id);
                        return (
                          <NotificationCategoryCard
                            key={category.id}
                            category={category}
                            selected={selected}
                            width={categoryCardWidth}
                            height={categoryCardHeight}
                            onPress={() => toggleCategory(category.id)}
                          />
                        );
                      })}
                    </View>
                  </View>
                )}

                {editorialTags.length > 0 && (
                  <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Por temática</Text>
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
                          </Pressable>
                        );
                      })}
                    </View>
                  </View>
                )}
              </>
            )}
            {saveError && <Text style={styles.error}>{saveError}</Text>}
          </ScrollView>
        </View>
        <Pressable
          onPress={() => void saveChanges()}
          disabled={saveDisabled}
          accessibilityRole="button"
          accessibilityLabel="Guardar cambios"
          accessibilityState={{ disabled: saveDisabled }}
          style={({ pressed }) => [
            styles.saveButton,
            saveDisabled ? styles.saveButtonDisabled : styles.saveButtonEnabled,
            !saveDisabled && pressed && styles.saveButtonPressed,
          ]}
        >
          <Text
            style={[
              styles.saveButtonText,
              saveDisabled ? styles.saveButtonTextDisabled : styles.saveButtonTextEnabled,
            ]}
          >
            Guardar cambios
          </Text>
        </Pressable>
        <SavedConfirmationBanner
          trigger={saveSuccessTrigger}
          bottom={114}
          title="Notificaciones guardadas correctamente"
        />
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  contentShift: { flex: 1, transform: [{ translateY: -5 }] },
  stickyHeader: { zIndex: 10, backgroundColor: "transparent" },
  headerContent: {
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  libraryTabBackHitArea: {
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
    fontSize: 25,
    lineHeight: 30,
    fontWeight: "700",
    color: "#FBFBFB",
    letterSpacing: 0.2,
    marginTop: 24,
  },
  headerDescription: {
    color: "rgba(255,255,255,0.68)",
    fontFamily: "Manrope",
    fontSize: 14,
    lineHeight: 20,
    marginTop: 15,
  },
  scroll: { flex: 1 },
  state: { alignItems: "center", justifyContent: "center", paddingTop: 72, paddingHorizontal: 16 },
  stateTitle: { color: "#FBFBFB", fontFamily: "Manrope", fontSize: 16, fontWeight: "700", textAlign: "center", marginTop: 14 },
  stateBody: { color: "rgba(255,255,255,0.68)", fontFamily: "Manrope", fontSize: 14, lineHeight: 20, textAlign: "center", marginTop: 8 },
  retryButton: { marginTop: 18, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.14)" },
  retryText: { color: "#FBFBFB", fontFamily: "Manrope", fontSize: 14, fontWeight: "700" },
  section: { marginBottom: 29 },
  sectionTitle: { color: "#FBFBFB", fontFamily: "Manrope", fontSize: 16, fontWeight: "700", letterSpacing: 0.1, marginBottom: 13 },
  categoryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 9,
    marginHorizontal: -6,
  },
  categoryBlock: {
    borderWidth: 1,
    borderRadius: 23,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
    overflow: "hidden",
  },
  categoryIcon: { height: 32, alignItems: "center", justifyContent: "center", marginBottom: 5 },
  meditationIcon: { width: 20, height: 20 },
  categoryImageIcon: { width: 24, height: 24 },
  categoryLabel: { fontFamily: "Manrope", fontSize: 12, lineHeight: 17, fontWeight: "600", textAlign: "center" },
  pills: { flexDirection: "row", flexWrap: "wrap", gap: 9 },
  pill: {
    minHeight: 38,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(0,0,0,0.28)",
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  pillSelected: { borderColor: "rgba(255,255,255,0.75)", backgroundColor: "rgba(0,0,0,0.28)" },
  pillLabel: { color: "rgba(255,255,255,0.82)", fontFamily: "Manrope", fontSize: 13 },
  pillLabelSelected: { color: "#F9F9F9" },
  error: { color: "#FFB4B4", fontFamily: "Manrope", fontSize: 13, textAlign: "center", marginTop: 4 },
  saveButton: {
    position: "absolute",
    left: 20,
    right: 20,
    bottom: 50,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  saveButtonDisabled: { backgroundColor: "rgba(249,249,249,0.4)" },
  saveButtonEnabled: { backgroundColor: "#F9F9F9" },
  saveButtonPressed: { opacity: 0.86 },
  saveButtonText: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "700",
  },
  saveButtonTextDisabled: { color: "rgba(249,249,249,0.8)" },
  saveButtonTextEnabled: { color: "#060A0F" },
});