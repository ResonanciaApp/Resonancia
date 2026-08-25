import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useAuth } from "@/context/AuthContext";
import { EncuentroCard } from "@/components/EncuentroCard";
import { CalendarioEncuentroSheet } from "@/components/CalendarioEncuentroSheet";
import { ENCUENTROS, type Encuentro } from "@/data/encuentros";
import { CommunityMixesCarousel } from "@/components/CommunityMixesCarousel";
import { ActivityFeedCard } from "@/components/ActivityFeedCard";
import { ResonadoresSection } from "@/components/ResonadoresSection";
import { useCommunityFeed } from "@/hooks/useCommunityFeed";
import type { CommunityFeedEvent } from "@/lib/communityApi";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_H_PADDING = 20;
const CARD_GAP = 12;
const CARD_W = SCREEN_W - CARD_H_PADDING * 2;
const PILL_H = 68;

export default function EncuentrosScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = PILL_H + Math.max(8, insets.bottom - 10);
  const [activeIndex, setActiveIndex] = useState(0);
  const [calSheetEncuentro, setCalSheetEncuentro] = useState<Encuentro | null>(null);
  const { theme: activeTheme } = useSceneTheme();
  const { clerkUserId } = useAuth();
  const { events, loading: feedLoading, refresh, refreshing } = useCommunityFeed(clerkUserId);

  // Fade las cards al completar un refresh
  const feedOpacity = useRef(new Animated.Value(1)).current;
  const prevRefreshing = useRef(false);
  useEffect(() => {
    if (prevRefreshing.current && !refreshing) {
      Animated.sequence([
        Animated.timing(feedOpacity, { toValue: 0.2, duration: 120, useNativeDriver: true }),
        Animated.timing(feedOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    }
    prevRefreshing.current = refreshing;
  }, [refreshing, feedOpacity]);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  ).current;

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 50 }).current;

  function handleCardPress(enc: Encuentro) {
    router.push(`/encuentro/${enc.id}` as never);
  }

  function handleCalendarPress(enc: Encuentro) {
    setCalSheetEncuentro(enc);
  }

  // ── Header element (carrusel + dots + mezclas + feed title/state) ──────
  // Nota: se pasa como ELEMENTO (no componente) para que el FlatList del
  // carrusel no se re-monte cuando cambia activeIndex (perdía el scroll).
  const listHeaderElement = (
      <View>
        <ResonadoresSection marginBottom={32} />

        {/* Título del carrusel */}
        <Text style={styles.carouselTitle}>Encuentros Resonadores</Text>

        {/* Carrusel de encuentros — FlatList horizontal propio */}
        <FlatList
          data={ENCUENTROS}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={false}
          snapToInterval={CARD_W + CARD_GAP}
          snapToAlignment="start"
          decelerationRate="fast"
          contentContainerStyle={styles.carouselContent}
          onViewableItemsChanged={onViewableItemsChanged}
          viewabilityConfig={viewabilityConfig}
          renderItem={({ item }) => (
            <View style={{ width: CARD_W }}>
              <EncuentroCard
                encuentro={item}
                onPress={() => handleCardPress(item)}
                onCalendarPress={() => handleCalendarPress(item)}
              />
            </View>
          )}
        />

        {/* Puntos de paginación */}
        <View style={styles.dots}>
          {ENCUENTROS.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, i === activeIndex ? styles.dotActive : styles.dotInactive]}
            />
          ))}
        </View>

        {/* Mezclas de la comunidad */}
        <View style={{ marginTop: 36 }}>
          <CommunityMixesCarousel />
        </View>

        {/* Feed title + estado */}
        <View style={styles.feedSection}>
          <Text style={styles.feedTitle}>Ahora en RESONANCIA</Text>
          {feedLoading && (
            <View style={styles.feedLoadingWrap}>
              <ActivityIndicator color="#BE9650" size="large" />
              <Text style={styles.feedLoadingText}>Conectando con la comunidad…</Text>
            </View>
          )}
          {!feedLoading && events.length === 0 && (
            <View style={styles.feedEmptyWrap}>
              <Text style={styles.feedEmptyIcon}>✦</Text>
              <Text style={styles.feedEmpty}>
                La comunidad está en silencio{"\n"}vuelve pronto
              </Text>
            </View>
          )}
        </View>
      </View>
  );

  const renderItem = useCallback(
    ({ item }: { item: CommunityFeedEvent }) => (
      <View style={styles.feedItemPad}>
        <ActivityFeedCard event={item} />
      </View>
    ),
    [],
  );

  const ItemSeparator = useCallback(
    () => <View style={styles.feedDivider} />,
    [],
  );

  return (
    <View style={[styles.root, { backgroundColor: activeTheme.gradient[0] as string, paddingTop: Math.max(insets.top, 40) }]}>
      <LinearGradient colors={activeTheme.gradient} style={StyleSheet.absoluteFill} />
      <StatusBar hidden />

      {/* Header fijo */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Comunidad</Text>
      </View>

      {/* Un único FlatList vertical — sin ScrollView wrapper */}
      <Animated.FlatList
        data={feedLoading || events.length === 0 ? [] : events}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ItemSeparatorComponent={ItemSeparator}
        ListHeaderComponent={listHeaderElement}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: tabBarHeight + 24 }}
        style={{ opacity: feedOpacity }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#BE9650"
            colors={["#BE9650"]}
          />
        }
      />

      {/* Sheet calendario */}
      <CalendarioEncuentroSheet
        encuentro={calSheetEncuentro}
        visible={calSheetEncuentro !== null}
        onClose={() => setCalSheetEncuentro(null)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: CARD_H_PADDING,
    paddingTop: 19,
    paddingBottom: 20,
  },
  headerTitle: {
    fontFamily: "Manrope",
    fontSize: 27,
    fontWeight: "800",
    color: "#F4F4F4",
    letterSpacing: 0.2,
    textAlign: "center",
    marginTop: -9,
  },
  carouselTitle: {
    fontFamily: "Manrope",
    fontSize: 18,
    fontWeight: "700",
    color: "#F4F4F4",
    paddingHorizontal: CARD_H_PADDING,
    marginTop: 40,
  },
  carouselContent: {
    paddingHorizontal: CARD_H_PADDING,
    gap: CARD_GAP,
    paddingTop: 24,
  },
  dots: {
    marginTop: 25,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  dot: {
    borderRadius: 4,
  },
  dotActive: {
    width: 20,
    height: 6,
    backgroundColor: "#f9f9f9",
  },
  dotInactive: {
    width: 6,
    height: 6,
    backgroundColor: "rgba(244,244,244,0.35)",
  },
  feedSection: {
    marginTop: 36,
    paddingHorizontal: CARD_H_PADDING,
    paddingBottom: 8,
  },
  feedItemPad: {
    paddingHorizontal: CARD_H_PADDING,
    paddingVertical: 2.5,
  },
  feedTitle: {
    fontFamily: "Manrope",
    fontSize: 20,
    fontWeight: "700",
    color: "#f9f9f9",
    marginBottom: 14,
  },
  feedLoadingWrap: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 12,
  },
  feedLoadingText: {
    fontFamily: "Manrope",
    fontSize: 13,
    color: "rgba(190,150,80,0.7)",
  },
  feedEmptyWrap: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 8,
  },
  feedEmptyIcon: {
    fontSize: 22,
    color: "rgba(190,150,80,0.5)",
  },
  feedEmpty: {
    fontFamily: "Manrope",
    fontSize: 13,
    color: "rgba(244,244,244,0.6)",
    textAlign: "center",
    lineHeight: 20,
  },
  feedDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.14)",
    marginHorizontal: CARD_H_PADDING,
  },
});
