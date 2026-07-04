import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useState } from "react";
import {
  Alert,
  FlatList,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useGetSharedMixes, useReportSharedMix } from "@workspace/api-client-react";
import type { SharedMix } from "@workspace/api-client-react";

import { MixContextMenu, MixRow } from "@/components/CommunityMixesCarousel";
import { type MixPreset, useMixer } from "@/context/MixerContext";
import { useColors } from "@/hooks/useColors";

export default function MezclasComunidadScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { data, isLoading } = useGetSharedMixes();
  const allMixes = data?.mixes ?? [];
  const { importPreset, presets } = useMixer();
  const reportMix = useReportSharedMix();

  const [menuMix, setMenuMix] = useState<SharedMix | null>(null);

  const isFavorited = useCallback(
    (mix: SharedMix) => presets.some((p) => p.id === `community-fav-${mix.id}`),
    [presets],
  );

  const handleAddFavorite = useCallback(
    (mix: SharedMix) => {
      if (isFavorited(mix)) {
        Alert.alert("Ya en favoritos", "Esta mezcla ya está en tus mezclas favoritas.");
        return;
      }
      const preset: MixPreset = {
        id: `community-fav-${mix.id}`,
        name: mix.name,
        description: mix.description ?? undefined,
        image: mix.image ?? undefined,
        category: mix.category as MixPreset["category"],
        sounds: mix.sounds.map((s) => ({ id: s.id, volume: s.volume })),
        createdAt: mix.createdAt,
        favorited: true,
      };
      importPreset(preset);
      setMenuMix(null);
      Alert.alert("Guardada", `"${mix.name}" se agregó a tus mezclas favoritas.`);
    },
    [importPreset, isFavorited],
  );

  const handleViewCreator = useCallback((mix: SharedMix) => {
    setMenuMix(null);
    router.push({
      pathname: "/mezcla-creador/[userId]",
      params: { userId: String(mix.author.id), name: mix.author.displayName },
    } as never);
  }, []);

  const handleOpenMix = useCallback((mix: SharedMix) => {
    router.push({ pathname: "/mezcla/[id]", params: { id: String(mix.id) } } as never);
  }, []);

  const handleReport = useCallback(
    (mix: SharedMix) => {
      setMenuMix(null);
      const reasons: { key: "spam" | "inapropiado" | "ofensivo" | "otro"; label: string }[] = [
        { key: "spam", label: "Spam o engañosa" },
        { key: "inapropiado", label: "Contenido inapropiado" },
        { key: "ofensivo", label: "Lenguaje ofensivo" },
        { key: "otro", label: "Otro motivo" },
      ];
      Alert.alert(
        "Reportar mezcla",
        `¿Por qué querés reportar "${mix.name}"?`,
        [
          ...reasons.map((r) => ({
            text: r.label,
            onPress: () =>
              reportMix.mutate(
                { id: mix.id, data: { reason: r.key } },
                {
                  onSuccess: () =>
                    Alert.alert("Gracias", "Recibimos tu reporte. Nuestro equipo lo revisará."),
                  onError: () =>
                    Alert.alert("Ups", "No pudimos enviar el reporte. Intentá de nuevo."),
                },
              ),
          })),
          { text: "Cancelar", style: "cancel" as const },
        ],
      );
    },
    [reportMix],
  );

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />

      <FlatList
        data={allMixes}
        keyExtractor={(m) => String(m.id)}
        contentContainerStyle={{
          paddingTop: topPad + 8,
          paddingBottom: bottomPad + 40,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={styles.header}>
            <Pressable onPress={() => router.back()} hitSlop={10} style={styles.backBtn}>
              <Feather name="chevron-left" size={26} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Explorar Mezclas de la comunidad
            </Text>
          </View>
        }
        ItemSeparatorComponent={() => <View style={{ height: 18 }} />}
        ListEmptyComponent={
          !isLoading ? (
            <View style={styles.emptyState}>
              <Feather name="music" size={28} color="rgba(212,175,55,0.35)" />
              <Text style={[styles.emptyText, { color: colors.foreground }]}>
                Aún no hay mezclas compartidas
              </Text>
              <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
                Sé el primero en compartir tu ambiente sonoro
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <MixRow
            mix={item}
            colors={colors}
            onPress={() => handleOpenMix(item)}
            onDotsPress={() => setMenuMix(item)}
            onAuthorPress={() => handleViewCreator(item)}
          />
        )}
      />

      <MixContextMenu
        mix={menuMix}
        onClose={() => setMenuMix(null)}
        onAddFavorite={handleAddFavorite}
        onViewCreator={handleViewCreator}
        onReport={handleReport}
        colors={colors}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 22,
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
  },
  title: {
    flex: 1,
    fontSize: 20,
    fontWeight: "700",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 60,
    gap: 6,
  },
  emptyText: { fontSize: 14, fontWeight: "600" },
  emptySub: { fontSize: 12, textAlign: "center", paddingHorizontal: 20 },
});
