import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Pressable,
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
import { ContextSearchModal } from "@/components/ContextSearchModal";

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_H_PADDING = 20;
const CARD_GAP = 12;
const CARD_W = SCREEN_W - CARD_H_PADDING * 2;
const PILL_H = 68;

function getCommunityEventTitle(event: CommunityFeedEvent): string {
  const { payload, eventType } = event;
  if (typeof payload.sessionName === "string" && payload.sessionName.trim()) return payload.sessionName;
  if (typeof payload.mixName === "string" && payload.mixName.trim()) return payload.mixName;
  if (typeof payload.glyphName === "string" && payload.glyphName.trim()) return payload.glyphName;
  if (eventType === "user_joined") return "Nueva persona en RESONANCIA";
  if (eventType === "mixer_active") return "Creación activa en el Mezclador";
  if (eventType === "geometrix_active") return "Creación activa en Geometrix";
  return "Actividad de la comunidad";
}

function getCommunityEventAction(event: CommunityFeedEvent): string {
  switch (event.eventType) {
    case "session_play":
      return "escuchando una sesión";
    case "mix_shared":
      return "compartió una mezcla";
    case "glyph_shared":
      return "compartió una creación";
    case "mixer_active":
      return "creando en el Mezclador";
    case "geometrix_active":
      return "creando en Geometrix";
    case "user_joined":
      return "se unió a RESONANCIA";
    default:
      return "está en RESONANCIA";
  }
}

export default function EncuentrosScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = PILL_H + Math.max(8, insets.bottom - 10);
  const [activeIndex, setActiveIndex] = useState(0);
  const [calSheetEncuentro, setCalSheetEncuentro] = useState<Encuentro | null>(null);
  const [searchVisible, setSearchVisible] = useState(false);
  const { theme: activeTheme } = useSceneTheme();
  const { clerkUserId } = useAuth();
  const { events, loading: feedLoading, refresh, refreshing } = useCommunityFeed(clerkUserId);

  const communitySearchItems = useMemo(
    () => [
      ...ENCUENTROS.map((encuentro) => ({
        id: `encounter:${encuentro.id}`,
        title: encuentro.titulo,
        meta: "Encuentro Resonador",
        subtitle: encuentro.guia.nombre,
        searchText: [encuentro.titulo, encuentro.descripcion, encuentro.guia.nombre].join(" "),
        image: encuentro.imagen,
      })),
      ...events.map((event) => {
        const displayName =
          typeof event.user.displayName === "string" && event.user.displayName.trim()
            ? event.user.displayName
            : "Alguien";
        const title = getCommunityEventTitle(event);
        return {
          id: `event:${event.id}`,
          title,
          meta: displayName,
          subtitle: getCommunityEventAction(event),
          searchText: [
            displayName,
            event.user.location ?? "",
            event.eventType,
            getCommunityEventAction(event),
            title,
            JSON.stringify(event.payload),
          ].join(" "),
          image: event.user.avatarUrl ? { uri: event.user.avatarUrl } : undefined,
        };
      }),
    ],
    [events],
  );

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
        <ResonadoresSection marginTop={40} marginBottom={32} />

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
        <Pressable
          onPress={() => setSearchVisible(true)}
          hitSlop={10}
          style={styles.headerSearchButton}
          accessibilityRole="button"
          accessibilityLabel="Buscar en Comunidad"
          testID="community-search-button"
        >
          <Feather name="search" size={22} color="#F9F9F9" />
        </Pressable>
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

      <ContextSearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        items={communitySearchItems}
        placeholder="Buscar en Comunidad..."
        emptyTitle="Explora la comunidad"
        emptySubtitle="Busca encuentros, personas y actividades"
        onSelect={(item) => {
          if (item.id.startsWith("encounter:")) {
            router.push(`/encuentro/${item.id.replace("encounter:", "")}` as never);
            return;
          }
          const event = events.find((candidate) => `event:${candidate.id}` === item.id);
          const sessionId = event?.payload.sessionId;
          if (typeof sessionId === "string" && sessionId.length > 0) {
            router.push(`/session/${sessionId}` as never);
          }
        }}
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: CARD_H_PADDING,
    paddingTop: 19,
    paddingBottom: 20,
  },
  headerSearchButton: {
    padding: 4,
    marginTop: -9,
  },
  headerTitle: {
    fontFamily: "Manrope",
    fontSize: 30,
    fontWeight: "800",
    color: "#F4F4F4",
    letterSpacing: 0.2,
    textAlign: "left",
    marginTop: -9,
    transform: [{ translateX: -1 }, { translateY: -3 }],
  },
  carouselTitle: {
    fontFamily: "Manrope",
    fontSize: 20,
    fontWeight: "700",
    color: "#F4F4F4",
    paddingHorizontal: CARD_H_PADDING,
    marginTop: 25,
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
