import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, Pressable, FlatList, ActivityIndicator, useWindowDimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useQueryClient } from "@tanstack/react-query";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import {
  useListMyReflectionStories,
  getGetMyReflectionStoryQueryKey,
  getListMyReflectionStoriesQueryKey,
  listMyReflectionStories,
  type ReflectionStory,
} from "@workspace/api-client-react";
import { StoryArtworkFrame } from "@/components/StoryArtworkFrame";
import { resolveProfileAvatarSource } from "@/lib/profile-avatar-logic";
import { useCoverPresetCatalogState } from "@/lib/cover-preset-catalog";
import { useReflectionCategories } from "@/constants/reflectionCategories";

const COLUMN_COUNT = 2;
const CARD_MARGIN = 8;

export default function GalleryScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { theme } = useSceneTheme();
  const { authLoading, isSignedIn, clerkUserId } = useAuth();
  const qc = useQueryClient();
  const { width: windowWidth } = useWindowDimensions();
  const { items: coverCatalog } = useCoverPresetCatalogState("reflection-story");
  const { categories: reflectionCategories } = useReflectionCategories();
  const cardWidth = (windowWidth - 40 - CARD_MARGIN * (COLUMN_COUNT - 1)) / COLUMN_COUNT;
  const limit = 20;
  const queryParams = { limit };
  const requestScope = clerkUserId ?? "signed-out";
  const requestScopeRef = useRef(requestScope);
  const nextRequestRef = useRef<AbortController | null>(null);
  const previousUserRef = useRef<string | null>(null);

  const { data: firstPageData, isLoading: isFirstLoading, isError: isFirstError, refetch: refetchFirst } = useListMyReflectionStories(
    queryParams,
    {
      query: {
        queryKey: [...getListMyReflectionStoriesQueryKey(queryParams), clerkUserId],
        enabled: !authLoading && isSignedIn && Boolean(clerkUserId),
      }
    }
  );

  const [subsequentPages, setSubsequentPages] = useState<any[]>([]);
  const [paginationScope, setPaginationScope] = useState(requestScope);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isFetchingNext, setIsFetchingNext] = useState(false);
  const [fetchNextError, setFetchNextError] = useState(false);

  useEffect(() => {
    requestScopeRef.current = requestScope;
    nextRequestRef.current?.abort();
    nextRequestRef.current = null;
    setPaginationScope(requestScope);
    setSubsequentPages([]);
    setNextCursor(firstPageData?.nextCursor ?? null);
    setIsFetchingNext(false);
    setFetchNextError(false);
  }, [firstPageData?.nextCursor, requestScope]);

  useEffect(() => {
    const previousUserId = previousUserRef.current;
    if (previousUserId && previousUserId !== clerkUserId) {
      void qc.cancelQueries({
        predicate: (query) =>
          query.queryKey[0] === "/api/me/reflection-stories"
          && query.queryKey[query.queryKey.length - 1] === previousUserId,
      });
      qc.removeQueries({
        predicate: (query) =>
          query.queryKey[0] === "/api/me/reflection-stories"
          && query.queryKey[query.queryKey.length - 1] === previousUserId,
      });
    }
    previousUserRef.current = clerkUserId;
    return () => nextRequestRef.current?.abort();
  }, [clerkUserId, qc]);

  const loadMore = useCallback(async () => {
    if (paginationScope !== requestScope || !nextCursor || isFetchingNext || isFirstLoading) return;
    const requestedScope = requestScope;
    const requestedCursor = nextCursor;
    const controller = new AbortController();
    nextRequestRef.current?.abort();
    nextRequestRef.current = controller;
    setIsFetchingNext(true);
    setFetchNextError(false);
    try {
      const res = await listMyReflectionStories({
        limit,
        cursor: requestedCursor,
      }, { signal: controller.signal });
      if (controller.signal.aborted || requestScopeRef.current !== requestedScope) return;
      setSubsequentPages(prev => [...prev, res]);
      setNextCursor(res.nextCursor);
    } catch {
      if (!controller.signal.aborted && requestScopeRef.current === requestedScope) {
        setFetchNextError(true);
      }
    } finally {
      if (nextRequestRef.current === controller) {
        nextRequestRef.current = null;
        setIsFetchingNext(false);
      }
    }
  }, [isFetchingNext, isFirstLoading, nextCursor, paginationScope, requestScope]);

  const items = useMemo(() => {
    const list = [...(firstPageData?.items || [])];
    const visiblePages = paginationScope === requestScope ? subsequentPages : [];
    visiblePages.forEach(page => {
      list.push(...page.items);
    });
    const seen = new Set();
    return list.filter(item => {
      if (seen.has(item.id)) return false;
      seen.add(item.id);
      return true;
    });
  }, [firstPageData, paginationScope, requestScope, subsequentPages]);

  const renderItem = ({ item }: { item: ReflectionStory }) => {
    const bgImageSource = coverCatalog.find(
      (candidate) => candidate.key === item.backgroundPresetKey,
    )?.source;
    // Stories can outlive a category (or arrive before the catalog request
    // finishes). Keep historical stories renderable instead of indexing an
    // undefined legacy presentation.
    const category = reflectionCategories[item.category] ?? reflectionCategories.clarity;
    return (
      <Pressable
        style={[styles.cardWrapper, { width: cardWidth }]}
        accessibilityRole="button"
        accessibilityLabel={`Abrir historia del ${new Date(item.createdAt).toLocaleDateString("es-ES")}`}
        onPress={() => {
          qc.setQueryData(
            [...getGetMyReflectionStoryQueryKey(item.id), clerkUserId],
            item,
          );
          router.push(`/galeria-reflexiones/${item.id}`);
        }}
      >
        <StoryArtworkFrame
          avatarSource={resolveProfileAvatarSource({ avatarUrl: item.avatarImagePath }, [])}
          avatarPosition={item.avatarX != null && item.avatarY != null ? { x: item.avatarX, y: item.avatarY } : undefined}
          message={item.message}
          width={cardWidth}
          bgImageSource={bgImageSource}
          composition={{
            backgroundScale: item.backgroundScale,
            backgroundX: item.backgroundX,
            backgroundY: item.backgroundY,
            textX: item.textX,
            textY: item.textY,
            textScale: item.textScale ?? 1,
          }}
        />
        <View style={styles.cardMetadata}>
          <View style={styles.categoryPill}>
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, { backgroundColor: category.color, opacity: 0.5, borderRadius: 10 }]}
            />
            <Text style={styles.categoryText}>
              {category.label}
            </Text>
          </View>
          <Text style={styles.cardDate}>
            {new Date(item.createdAt).toLocaleDateString("es-ES", { day: "numeric", month: "short" })}
          </Text>
        </View>
      </Pressable>
    );
  };

  const EmptyState = () => (
    <View style={styles.emptyContainer}>
      <Feather name="image" size={48} color={colors.mutedForeground} style={{ marginBottom: 16 }} />
      <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Tu galería está vacía</Text>
      <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
        Tus historias compartidas en Instagram aparecerán aquí.
      </Text>
    </View>
  );

  return (
    <LinearGradient
      colors={theme.gradient as unknown as [string, string, ...string[]]}
      locations={theme.gradientLocations as unknown as [number, number, ...number[]] | undefined}
      style={styles.root}
    >
      <View style={[styles.headerContainer, { paddingTop: Math.max(insets.top, 40) + 8 }]}>
        <Pressable accessibilityLabel="Volver" onPress={() => router.back()} style={[
          styles.backButton,
          { backgroundColor: theme.id === "cloudy" || theme.id === "natural"
            ? "rgba(0,0,0,0.19)"
            : "rgba(0,0,0,0.16)" },
        ]}>
          <Feather name="chevron-left" size={28} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.mainTitle, { color: colors.foreground }]}>Galería</Text>
        <View style={{ width: 44 }} />
      </View>

      {isFirstError ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: colors.destructive }]}>Error al cargar la galería.</Text>
          <Pressable style={styles.retryButton} onPress={() => refetchFirst()}>
             <Text style={{ color: colors.primary }}>Reintentar</Text>
          </Pressable>
        </View>
      ) : isFirstLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : items.length === 0 ? (
        <EmptyState />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id.toString()}
          numColumns={COLUMN_COUNT}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            <View style={{ margin: 20, alignItems: 'center' }}>
               {isFetchingNext && <ActivityIndicator color={colors.primary} />}
               {fetchNextError && (
                 <Pressable onPress={loadMore} style={{ padding: 10 }}>
                   <Text style={{ color: colors.destructive }}>Error al cargar más. Reintentar.</Text>
                 </Pressable>
               )}
            </View>
          }
        />
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  mainTitle: {
    fontSize: 18,
    fontFamily: "Manrope",
    fontWeight: "600",
  },
  centerContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Manrope",
    marginBottom: 12,
  },
  retryButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "Manrope",
    fontWeight: "700",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyText: {
    fontSize: 15,
    fontFamily: "Manrope",
    textAlign: "center",
    lineHeight: 22,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 25,
  },
  cardWrapper: {
    alignItems: "stretch",
  },
  cardMetadata: {
    marginTop: 10,
    alignItems: "flex-start",
  },
  cardDate: {
    marginTop: 8,
    color: "#fff",
    fontSize: 12,
    fontFamily: "Manrope",
    fontWeight: "600",
  },
  categoryPill: {
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    overflow: "hidden",
  },
  categoryText: {
    fontSize: 11,
    fontFamily: "Manrope",
    fontWeight: "500",
    color: "#F9F9F9",
  },
});