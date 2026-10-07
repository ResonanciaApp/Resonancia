import React, { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View, useWindowDimensions } from "react-native";
import { Image } from "expo-image";
import { router, useFocusEffect } from "expo-router";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSharedMixes, getGetSharedMixQueryKey, getGetSharedMixesQueryKey,
  listUserReflectionStories, getListUserReflectionStoriesQueryKey,
  getGetUserReflectionStoryQueryKey, type SharedMix, type ReflectionStory,
} from "@workspace/api-client-react";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { getMixImage } from "@/config/mix-images";
import { catalogImage, useCoverPresetCatalog } from "@/lib/cover-preset-catalog";
import { resolveProfileAvatarSource } from "@/lib/profile-avatar-logic";
import { StoryArtworkFrame } from "@/components/StoryArtworkFrame";
import {
  PROFILE_CAROUSEL_GAP, PROFILE_CAROUSEL_INSET, PROFILE_CAROUSEL_RADIUS, publicProfileCardWidth,
} from "@/lib/public-profile-carousel";

export function PublicProfileCarousels({ userId }: { userId: number }) {
  const colors = useColors();
  const { width: windowWidth } = useWindowDimensions();
  const [viewportWidth, setViewportWidth] = useState(windowWidth);
  const [focused, setFocused] = useState(true);
  useFocusEffect(useCallback(() => {
    setFocused(true);
    return () => setFocused(false);
  }, []));
  const { clerkUserId, isSignedIn } = useAuth();
  const qc = useQueryClient();
  const mixCatalog = useCoverPresetCatalog("mix");
  const storyCatalog = useCoverPresetCatalog("reflection-story");
  const cardWidth = publicProfileCardWidth(viewportWidth);
  const enabled = focused && isSignedIn && Number.isInteger(userId) && userId > 0;
  const mixes = useInfiniteQuery({
    queryKey: [...getGetSharedMixesQueryKey({ author: userId }), clerkUserId, "profile-carousel"],
    queryFn: ({ pageParam }) => getSharedMixes({ author: userId, page: pageParam }),
    initialPageParam: 1,
    getNextPageParam: (last) => last.page * last.pageSize < last.total ? last.page + 1 : undefined,
    enabled,
  });
  const stories = useInfiniteQuery({
    queryKey: [...getListUserReflectionStoriesQueryKey(userId), clerkUserId, "profile-carousel"],
    queryFn: ({ pageParam }) => listUserReflectionStories(userId, { cursor: pageParam, limit: 20 }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled,
    staleTime: 0,
  });
  useFocusEffect(useCallback(() => {
    void qc.invalidateQueries({ queryKey: getListUserReflectionStoriesQueryKey(userId) });
  }, [qc, userId]));
  const mixItems = mixes.data?.pages.flatMap(page => page.mixes) ?? [];
  const storyItems = stories.data?.pages.flatMap(page => page.items) ?? [];

  function status(loading: boolean, error: boolean, empty: boolean, retry: () => unknown, emptyCopy: string) {
    if (loading) return <ActivityIndicator style={styles.status} color={colors.primary} />;
    if (error) return <Pressable onPress={() => retry()} style={styles.status}>
      <Text style={{ color: colors.foreground }}>No se pudo cargar. Toca para reintentar.</Text>
    </Pressable>;
    if (empty) return <Text style={[styles.status, { color: colors.mutedForeground }]}>{emptyCopy}</Text>;
    return null;
  }

  return (
    <View style={styles.root} onLayout={event => setViewportWidth(event.nativeEvent.layout.width)}>
      <Text style={[styles.heading, { color: colors.foreground }]}>Sus mezclas</Text>
      {status(mixes.isPending, mixes.isError && !mixItems.length, !mixItems.length,
        () => mixes.refetch(), "Todavía no hay mezclas compartidas.")}
      <FlatList<SharedMix>
        horizontal
        data={mixItems}
        keyExtractor={mix => String(mix.id)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carousel}
        ItemSeparatorComponent={Separator}
        snapToInterval={cardWidth + PROFILE_CAROUSEL_GAP}
        snapToAlignment="start"
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (mixes.hasNextPage && !mixes.isFetchingNextPage) void mixes.fetchNextPage();
        }}
        ListFooterComponent={mixes.isFetchingNextPage ? <ActivityIndicator color={colors.primary} /> :
          mixes.isFetchNextPageError ? <Pressable onPress={() => mixes.fetchNextPage()}><Text style={{ color: colors.foreground }}>Reintentar</Text></Pressable> : null}
        renderItem={({ item }) => {
          const image = item.image ? mixCatalog.find(p => p.key === item.image || p.id === item.image)?.source
            ?? catalogImage("mix", item.image)
            ?? (/^(https?:\/\/|\/)/.test(item.image)
              ? resolveProfileAvatarSource({ avatarUrl: item.image }, [])
              : getMixImage(item.image)) : undefined;
          return (
            <Pressable accessibilityRole="button" accessibilityLabel={`Abrir mezcla ${item.name}`}
              style={({ pressed }) => [{ width: cardWidth, opacity: pressed ? 0.75 : 1 }]}
              onPress={() => {
                qc.setQueryData([...getGetSharedMixQueryKey(item.id), clerkUserId], item);
                router.push(`/mezcla/${item.id}` as never);
              }}>
              <View style={[styles.squareCover, { width: cardWidth, backgroundColor: colors.card }]}>
                {image ? <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" />
                  : <Text style={[styles.missingCover, { color: colors.mutedForeground }]}>Sin portada</Text>}
              </View>
              <Text numberOfLines={2} style={[styles.mixTitle, { color: colors.foreground }]}>{item.name}</Text>
            </Pressable>
          );
        }}
      />
      <Text style={[styles.heading, styles.reflectionsHeading, { color: colors.foreground }]}>Sus reflexiones</Text>
      {status(stories.isPending, stories.isError && !storyItems.length, !storyItems.length,
        () => stories.refetch(), "Todavía no hay reflexiones públicas.")}
      <FlatList<ReflectionStory>
        horizontal
        data={storyItems}
        keyExtractor={story => String(story.id)}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.carousel}
        ItemSeparatorComponent={Separator}
        snapToInterval={cardWidth + PROFILE_CAROUSEL_GAP}
        snapToAlignment="start"
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (stories.hasNextPage && !stories.isFetchingNextPage) void stories.fetchNextPage();
        }}
        ListFooterComponent={stories.isFetchingNextPage ? <ActivityIndicator color={colors.primary} /> :
          stories.isFetchNextPageError ? <Pressable onPress={() => stories.fetchNextPage()}><Text style={{ color: colors.foreground }}>Reintentar</Text></Pressable> : null}
        renderItem={({ item }) => (
          <Pressable accessibilityRole="button" accessibilityLabel={`Abrir reflexión: ${item.message}`}
            style={({ pressed }) => [{ width: cardWidth, opacity: pressed ? 0.75 : 1 }]}
            onPress={() => {
              qc.setQueryData([...getGetUserReflectionStoryQueryKey(userId, item.id), clerkUserId], item);
              router.push({ pathname: "/reflexion-publica/[id]", params: { id: item.id, userId } } as never);
            }}>
            <View style={styles.storyCover}>
              <StoryArtworkFrame
                width={cardWidth}
                message={item.message}
                bgImageSource={storyCatalog.find(p => p.key === item.backgroundPresetKey)?.source}
                avatarSource={resolveProfileAvatarSource({ avatarUrl: item.avatarImagePath }, [])}
                avatarPosition={item.avatarX != null && item.avatarY != null ? { x: item.avatarX, y: item.avatarY } : undefined}
                composition={item}
              />
            </View>
          </Pressable>
        )}
      />
    </View>
  );
}

function Separator() { return <View style={{ width: PROFILE_CAROUSEL_GAP }} />; }

const styles = StyleSheet.create({
  root: { marginTop: 12 },
  heading: { fontFamily: "Manrope", fontSize: 18, fontWeight: "700", marginHorizontal: PROFILE_CAROUSEL_INSET, marginBottom: 14 },
  reflectionsHeading: { marginTop: 28 },
  carousel: { paddingHorizontal: PROFILE_CAROUSEL_INSET },
  squareCover: { aspectRatio: 1, borderRadius: PROFILE_CAROUSEL_RADIUS, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  storyCover: { borderRadius: PROFILE_CAROUSEL_RADIUS, overflow: "hidden" },
  mixTitle: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600", lineHeight: 18, marginTop: 8, textAlign: "left" },
  status: { marginHorizontal: PROFILE_CAROUSEL_INSET, marginBottom: 14, fontFamily: "Manrope", fontSize: 13 },
  missingCover: { fontFamily: "Manrope", fontSize: 12 },
});
