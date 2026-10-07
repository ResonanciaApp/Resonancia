import { Feather } from "@expo/vector-icons";
import { useInfiniteQuery } from "@tanstack/react-query";
import { getGetSharedMixesQueryKey, getSharedMixes, type SharedMix } from "@workspace/api-client-react";
import { LinearGradient } from "expo-linear-gradient";
import { router, Stack, useFocusEffect } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BackPill } from "@/components/BackPill";
import { MixContextMenu, MixRow } from "@/components/CommunityMixesCarousel";
import { CommunityMixRulesSheet } from "@/components/CommunityMixRulesSheet";
import { useAuth } from "@/context/AuthContext";
import { useBackOverride } from "@/context/BackOverrideContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useColors } from "@/hooks/useColors";
import { useMixLike } from "@/hooks/useMixLike";
import { flattenSharedMixesPages, getNextSharedMixesPage } from "@/lib/community-mixes-pagination";

const RowSeparator = () => <View style={styles.separator} />;

export default function MezclasComunidadScreen() {
  const colors = useColors();
  const { theme } = useSceneTheme();
  const { isSignedIn, clerkUserId } = useAuth();
  const goBack = useBackOverride();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [focused, setFocused] = useState(false);
  const [rulesVisible, setRulesVisible] = useState(false);
  const [menuMix, setMenuMix] = useState<SharedMix | null>(null);
  const { toggle } = useMixLike();

  useFocusEffect(useCallback(() => {
    setFocused(true);
    return () => {
      setFocused(false);
      setRulesVisible(false);
      setMenuMix(null);
    };
  }, []));

  const {
    data, isLoading, isError, refetch, isRefetching,
    fetchNextPage, hasNextPage, isFetching, isFetchingNextPage, isFetchNextPageError,
  } = useInfiniteQuery({
    // Separate the infinite shape from generated single-page cache entries.
    queryKey: [...getGetSharedMixesQueryKey(), "infinite", clerkUserId ?? "guest"],
    queryFn: ({ pageParam, signal }) => getSharedMixes({ page: pageParam }, { signal }),
    initialPageParam: 1,
    getNextPageParam: getNextSharedMixesPage,
    enabled: focused,
    staleTime: 30_000,
  });
  const allMixes = useMemo(() => flattenSharedMixesPages(data?.pages), [data?.pages]);

  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetching && !isFetchNextPageError) void fetchNextPage();
  }, [hasNextPage, isFetching, isFetchNextPageError, fetchNextPage]);

  const handleLike = useCallback((mix: SharedMix) => {
    if (!isSignedIn) {
      Alert.alert("Crea tu cuenta", "Necesitas una cuenta para dar me gusta a las mezclas de la comunidad.", [
        { text: "Ahora no", style: "cancel" },
        { text: "Registrarme", onPress: () => router.push("/(auth)/sign-up" as never) },
      ]);
      return;
    }
    toggle(mix);
  }, [isSignedIn, toggle]);

  const handleViewCreator = useCallback((mix: SharedMix) => {
    setMenuMix(null);
    router.push({
      pathname: "/mezcla-creador/[userId]",
      params: { userId: String(mix.author.id), name: mix.author.displayName },
    } as never);
  }, []);

  const renderMix = useCallback(({ item: mix, index }: { item: SharedMix; index: number }) => (
    <MixRow
      mix={mix}
      rank={index + 1}
      colors={colors}
      onPress={() => router.push({ pathname: "/mezcla/[id]", params: { id: String(mix.id) } } as never)}
      onDotsPress={() => setMenuMix(mix)}
      onAuthorPress={() => router.push(`/usuario/${mix.author.id}` as never)}
      favorited={mix.likedByMe}
      onHeartPress={() => handleLike(mix)}
    />
  ), [colors, handleLike]);

  return (
    <>
      <Stack.Screen options={{ contentStyle: { backgroundColor: theme.gradient[0] } }} />
      <LinearGradient
        style={[styles.root, { backgroundColor: theme.solid }]}
        colors={theme.gradient}
        locations={theme.gradientLocations}
        start={theme.gradientStart}
        end={theme.gradientEnd}
      >
        <StatusBar hidden />
        <View style={styles.contentShift}>
          <View style={{ paddingTop: topPad + 4 }}>
            <View style={styles.headerRow}>
              <View style={styles.backSlot}>
                <BackPill
                  onPress={goBack ?? (() => router.canGoBack() ? router.back() : router.replace("/(tabs)" as never))}
                  standardSurface
                  iconOffsetX={-1}
                  style={styles.backButton}
                />
              </View>
              <Text style={styles.title} numberOfLines={1}>Creaciones</Text>
              <Pressable
                testID="community-mix-rules"
                onPress={() => setRulesVisible(true)}
                style={({ pressed }) => [styles.basesButton, { opacity: pressed ? 0.7 : 1 }]}
                accessibilityRole="button"
                accessibilityLabel="Bases: reglas para compartir creaciones"
              >
                <Text style={styles.basesText}>Bases</Text>
              </Pressable>
            </View>
          </View>

          <FlatList
            testID="community-mixes-list"
            style={styles.list}
            data={allMixes}
            keyExtractor={mix => String(mix.id)}
            renderItem={renderMix}
            ItemSeparatorComponent={RowSeparator}
            contentContainerStyle={[styles.listContent, { paddingBottom: 60 + bottomPad }]}
            showsVerticalScrollIndicator={false}
            scrollEnabled={allMixes.length > 0}
            onEndReached={loadMore}
            onEndReachedThreshold={0.5}
            initialNumToRender={12}
            maxToRenderPerBatch={12}
            windowSize={7}
            refreshControl={
              <RefreshControl refreshing={isRefetching && !isFetchingNextPage} onRefresh={() => { void refetch(); }} tintColor={colors.primary} />
            }
            ListEmptyComponent={
              <View style={styles.emptyState}>
                {isLoading ? (
                  <>
                    <ActivityIndicator color={colors.primary} />
                    <Text style={styles.emptyText}>Cargando mezclas…</Text>
                  </>
                ) : isError ? (
                  <>
                    <Text style={styles.emptyText}>No se pudieron cargar las mezclas</Text>
                    <Pressable onPress={() => { void refetch(); }} accessibilityRole="button" style={styles.retryButton}>
                      <Text style={[styles.retryText, { color: colors.primary }]}>Reintentar</Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Feather name="music" size={28} color={colors.primary} />
                    <Text style={styles.emptyText}>Aún no hay mezclas compartidas</Text>
                    <Text style={styles.emptySub}>Sé el primero en compartir tu ambiente sonoro</Text>
                  </>
                )}
              </View>
            }
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={styles.footer}><ActivityIndicator color={colors.primary} /></View>
              ) : isFetchNextPageError ? (
                <View style={styles.footer}>
                  <Text style={styles.emptySub}>No se pudieron cargar más mezclas</Text>
                  <Pressable onPress={() => { void fetchNextPage(); }} accessibilityRole="button" style={styles.retryButton}>
                    <Text style={[styles.retryText, { color: colors.primary }]}>Reintentar</Text>
                  </Pressable>
                </View>
              ) : isError && allMixes.length > 0 ? (
                <View style={styles.footer}>
                  <Text style={styles.emptySub}>No se pudieron actualizar las mezclas</Text>
                  <Pressable onPress={() => { void refetch(); }} accessibilityRole="button" style={styles.retryButton}>
                    <Text style={[styles.retryText, { color: colors.primary }]}>Reintentar</Text>
                  </Pressable>
                </View>
              ) : null
            }
          />
        </View>
        <MixContextMenu mix={menuMix} onClose={() => setMenuMix(null)} onViewCreator={handleViewCreator} colors={colors} />
        <CommunityMixRulesSheet visible={rulesVisible} onClose={() => setRulesVisible(false)} />
      </LinearGradient>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  contentShift: { flex: 1, transform: [{ translateY: -5 }] },
  headerRow: { position: "relative", flexDirection: "row", alignItems: "center", minHeight: 48, paddingHorizontal: 20, paddingBottom: 6, transform: [{ translateY: 8 }] },
  backSlot: { position: "absolute", left: 16, top: -4, width: 48, height: 48, alignItems: "center", justifyContent: "center", zIndex: 20 },
  backButton: { width: 43, height: 43, borderRadius: 21.5 },
  title: { flex: 1, fontFamily: "Manrope", fontSize: 18, lineHeight: 21, fontWeight: "700", color: "#FBFBFB", letterSpacing: 0.2, textAlign: "center", marginHorizontal: 72 },
  basesButton: { position: "absolute", right: 20, top: 4, height: 32, paddingHorizontal: 14, borderRadius: 16, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.16)" },
  basesText: { fontFamily: "Manrope", fontSize: 12, fontWeight: "600", color: "#FBFBFB" },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingTop: 23 },
  separator: { height: 14 },
  emptyState: { alignItems: "center", paddingVertical: 60, gap: 8 },
  emptyText: { fontFamily: "Manrope", fontSize: 14, fontWeight: "600", color: "#FBFBFB", textAlign: "center" },
  emptySub: { fontFamily: "Manrope", fontSize: 12, textAlign: "center", color: "#CFCFCF" },
  footer: { paddingVertical: 24, alignItems: "center", gap: 8 },
  retryButton: { paddingHorizontal: 16, paddingVertical: 10 },
  retryText: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600" },
});
