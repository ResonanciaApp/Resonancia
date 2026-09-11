import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
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
} from "react-native";
import { KeyboardAvoidingView } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";

import type { Resonador } from "@/data/resonadores";
import { useColors } from "@/hooks/useColors";
import { useSceneTheme } from "@/context/SceneThemeContext";
import {
  filterResonadores,
  type ResonadorModalityFilter,
} from "@/lib/resonador-search";

type Props = {
  visible: boolean;
  resonadores: Resonador[];
  loading?: boolean;
  error?: boolean;
  onClose: () => void;
};

function FilterPill({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.filterPill,
        selected && styles.filterPillSelected,
        { opacity: pressed ? 0.72 : 1 },
      ]}
      accessibilityRole="button"
      accessibilityState={{ selected }}
    >
      <Text style={[styles.filterPillText, selected && styles.filterPillTextSelected]}>
        {label}
      </Text>
    </Pressable>
  );
}

export function ResonadorSearchModal({
  visible,
  resonadores,
  loading = false,
  error = false,
  onClose,
}: Props) {
  const colors = useColors();
  const { theme, activeSceneId } = useSceneTheme();
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<string | null>(null);
  const [country, setCountry] = useState<string | null>(null);
  const [modality, setModality] = useState<ResonadorModalityFilter | null>(null);

  useEffect(() => {
    if (visible) return;
    setQuery("");
    setRole(null);
    setCountry(null);
    setModality(null);
    Keyboard.dismiss();
  }, [visible]);

  const roles = useMemo(
    () => Array.from(new Set(resonadores.map((item) => item.subtipo))).sort(),
    [resonadores],
  );
  const countries = useMemo(
    () => Array.from(new Set(resonadores.map((item) => item.country).filter(Boolean))).sort(),
    [resonadores],
  );
  const popularSpecialties = useMemo(() => {
    const counts = new Map<string, number>();
    resonadores.forEach((item) => {
      [...item.specialty, ...item.genres].forEach((value) => {
        counts.set(value, (counts.get(value) ?? 0) + 1);
      });
    });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
      .slice(0, 4)
      .map(([value]) => value);
  }, [resonadores]);

  const results = useMemo(() => {
    return filterResonadores(resonadores, { query, role, country, modality });
  }, [country, modality, query, resonadores, role]);

  const hasFilters = Boolean(role || country || modality);
  const close = () => {
    Keyboard.dismiss();
    onClose();
  };
  const openProfile = (item: Resonador) => {
    close();
    router.push(`/resonador-perfil/${item.id}` as never);
  };
  const searchBarSurface =
    activeSceneId === "indigo2"
      ? "rgba(21,13,46,0.70)"
      : activeSceneId === "resonancia"
        ? "rgba(9,11,23,0.70)"
        : "rgba(14,14,23,0.70)";

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={close}
    >
      <KeyboardAvoidingView style={styles.root} behavior="padding" keyboardVerticalOffset={0}>
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: theme.gradient[0] }]}>
          <LinearGradient
            colors={theme.gradient as [string, string, ...string[]]}
            style={StyleSheet.absoluteFill}
          />
        </View>

        <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
          <View style={styles.headerTitleRow}>
            <View>
              <Text style={[styles.headerTitle, { color: colors.foreground }]}>
                Buscar Resonadores
              </Text>
              <Text style={[styles.headerSubtitle, { color: colors.mutedForeground }]}>
                Encuentra a la persona adecuada para ti
              </Text>
            </View>
            <Pressable
              onPress={close}
              hitSlop={10}
              style={styles.closeButton}
              accessibilityLabel="Cerrar búsqueda"
            >
              <Feather name="x" size={22} color={colors.foreground} />
            </Pressable>
          </View>

          <Pressable
            style={[styles.searchBar, { backgroundColor: searchBarSurface }]}
            onPress={() => inputRef.current?.focus()}
            accessibilityRole="search"
          >
            <Feather name="search" size={18} color={colors.foreground} />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              style={[styles.input, { color: colors.foreground }]}
              placeholder="Nombre, especialidad o ubicación..."
              placeholderTextColor={colors.mutedForeground}
              returnKeyType="search"
              autoCorrect={false}
              autoCapitalize="none"
            />
            {query.length > 0 ? (
              <Pressable onPress={() => setQuery("")} hitSlop={10}>
                <Feather name="x" size={17} color={colors.mutedForeground} />
              </Pressable>
            ) : null}
          </Pressable>
        </View>

        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 34 }]}
          ListHeaderComponent={
            <View>
              {query.trim().length === 0 ? (
                <View style={styles.discoverySection}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    Explora por especialidad
                  </Text>
                  <View style={styles.quickGrid}>
                    {popularSpecialties.map((specialty) => (
                      <Pressable
                        key={specialty}
                        onPress={() => setQuery(specialty)}
                        style={({ pressed }) => [
                          styles.quickCard,
                          { opacity: pressed ? 0.7 : 1 },
                        ]}
                      >
                        <Feather name="activity" size={18} color="#BE9650" />
                        <Text style={styles.quickCardText} numberOfLines={2}>
                          {specialty}
                        </Text>
                        <Feather name="arrow-up-right" size={15} color="rgba(249,249,249,0.45)" />
                      </Pressable>
                    ))}
                  </View>
                </View>
              ) : null}

              <View style={styles.filters}>
                <View style={styles.filterHeading}>
                  <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                    Filtrar por rol
                  </Text>
                  {hasFilters ? (
                    <Pressable
                      onPress={() => {
                        setRole(null);
                        setCountry(null);
                        setModality(null);
                      }}
                      hitSlop={8}
                    >
                      <Text style={[styles.clearText, { color: colors.mutedForeground }]}>
                        Limpiar
                      </Text>
                    </Pressable>
                  ) : null}
                </View>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.filterRow}
                >
                  {roles.map((item) => (
                    <FilterPill
                      key={item}
                      label={item}
                      selected={role === item}
                      onPress={() => setRole(role === item ? null : item)}
                    />
                  ))}
                </ScrollView>

                {countries.length > 1 ? (
                  <>
                    <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>
                      Ubicación
                    </Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.filterRow}
                    >
                      {countries.map((item) => (
                        <FilterPill
                          key={item}
                          label={item}
                          selected={country === item}
                          onPress={() => setCountry(country === item ? null : item)}
                        />
                      ))}
                    </ScrollView>
                  </>
                ) : null}

                <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>
                  Modalidad
                </Text>
                <View style={styles.filterRow}>
                  <FilterPill
                    label="Online"
                    selected={modality === "online"}
                    onPress={() => setModality(modality === "online" ? null : "online")}
                  />
                  <FilterPill
                    label="Presencial"
                    selected={modality === "presencial"}
                    onPress={() => setModality(modality === "presencial" ? null : "presencial")}
                  />
                </View>
              </View>

              <View style={styles.resultsHeading}>
                <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                  {query.trim() || hasFilters ? "Resultados" : "Todos los Resonadores"}
                </Text>
                {!loading ? (
                  <Text style={[styles.resultCount, { color: colors.mutedForeground }]}>
                    {results.length}
                  </Text>
                ) : null}
              </View>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <Feather
                name={loading ? "loader" : error ? "wifi-off" : "users"}
                size={34}
                color="rgba(249,249,249,0.38)"
              />
              <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
                {loading
                  ? "Buscando Resonadores..."
                  : error
                    ? "No pudimos cargar los perfiles"
                    : "No encontramos coincidencias"}
              </Text>
              <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
                {error
                  ? "Intenta nuevamente en unos momentos"
                  : "Prueba otra especialidad, nombre o ubicación"}
              </Text>
            </View>
          }
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openProfile(item)}
              style={({ pressed }) => [
                styles.resultCard,
                { opacity: pressed ? 0.72 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Abrir perfil de ${item.name}`}
            >
              <Image source={item.photo} style={styles.avatar} contentFit="cover" />
              <View style={styles.resultCopy}>
                <View style={styles.nameRow}>
                  <Text style={styles.name} numberOfLines={1}>{item.name}</Text>
                  {item.certified ? (
                    <Feather name="check-circle" size={14} color="#BE9650" />
                  ) : null}
                </View>
                <Text style={styles.roleLocation} numberOfLines={1}>
                  {item.subtipo} · {[item.city, item.country].filter(Boolean).join(", ")}
                </Text>
                <View style={styles.specialtyRow}>
                  {item.specialty.slice(0, 2).map((specialty) => (
                    <View key={specialty} style={styles.specialtyPill}>
                      <Text style={styles.specialtyText} numberOfLines={1}>
                        {specialty}
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
              <Feather name="chevron-right" size={20} color="rgba(249,249,249,0.44)" />
            </Pressable>
          )}
        />
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  headerTitleRow: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  headerTitle: {
    fontFamily: "Manrope",
    fontSize: 22,
    fontWeight: "800",
  },
  headerSubtitle: {
    fontFamily: "Manrope",
    fontSize: 12,
    marginTop: 2,
  },
  closeButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    height: 50,
    borderRadius: 25,
    paddingHorizontal: 17,
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    borderWidth: 1,
    borderColor: "rgba(249,249,249,0.08)",
  },
  input: {
    flex: 1,
    fontFamily: "Manrope",
    fontSize: 15,
    paddingVertical: 0,
  },
  content: {
    paddingHorizontal: 16,
  },
  discoverySection: {
    paddingTop: 10,
    marginBottom: 27,
  },
  sectionTitle: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
  },
  quickGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginTop: 14,
  },
  quickCard: {
    width: "48%",
    minHeight: 67,
    borderRadius: 15,
    paddingHorizontal: 13,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(130,96,181,0.12)",
  },
  quickCardText: {
    flex: 1,
    fontFamily: "Manrope",
    fontSize: 12.5,
    lineHeight: 17,
    fontWeight: "600",
    color: "#F9F9F9",
  },
  filters: {
    marginBottom: 28,
  },
  filterHeading: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 13,
  },
  clearText: {
    fontFamily: "Manrope",
    fontSize: 12,
  },
  filterLabel: {
    fontFamily: "Manrope",
    fontSize: 12,
    marginTop: 16,
    marginBottom: 9,
  },
  filterRow: {
    flexDirection: "row",
    gap: 8,
  },
  filterPill: {
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(249,249,249,0.10)",
  },
  filterPillSelected: {
    backgroundColor: "#F9F9F9",
    borderColor: "#F9F9F9",
  },
  filterPillText: {
    fontFamily: "Manrope",
    fontSize: 12.5,
    fontWeight: "600",
    color: "#F9F9F9",
  },
  filterPillTextSelected: {
    color: "#060A0F",
  },
  resultsHeading: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 13,
  },
  resultCount: {
    fontFamily: "Manrope",
    fontSize: 12,
  },
  resultCard: {
    minHeight: 96,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    padding: 13,
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(130,96,181,0.10)",
  },
  avatar: {
    width: 66,
    height: 66,
    borderRadius: 33,
    borderWidth: 1.5,
    borderColor: "rgba(190,150,80,0.50)",
  },
  resultCopy: {
    flex: 1,
    minWidth: 0,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  name: {
    flexShrink: 1,
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "700",
    color: "#F9F9F9",
  },
  roleLocation: {
    fontFamily: "Manrope",
    fontSize: 11.5,
    color: "rgba(249,249,249,0.62)",
    marginTop: 3,
  },
  specialtyRow: {
    flexDirection: "row",
    gap: 5,
    marginTop: 8,
  },
  specialtyPill: {
    maxWidth: "48%",
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 9,
    backgroundColor: "rgba(130,96,181,0.18)",
  },
  specialtyText: {
    fontFamily: "Manrope",
    fontSize: 9.5,
    color: "#F9F9F9",
  },
  empty: {
    alignItems: "center",
    paddingVertical: 50,
    paddingHorizontal: 28,
  },
  emptyTitle: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
    marginTop: 14,
    textAlign: "center",
  },
  emptySubtitle: {
    fontFamily: "Manrope",
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
    textAlign: "center",
  },
});