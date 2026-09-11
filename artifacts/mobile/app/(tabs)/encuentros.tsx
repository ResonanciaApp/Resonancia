import { Feather } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useAuth } from "@/context/AuthContext";
import { useDrawer } from "@/context/DrawerContext";
import { ENCUENTROS } from "@/data/encuentros";
import { EncuentrosResonadoresSection } from "@/components/EncuentrosResonadoresSection";
import { CommunityMixesCarousel } from "@/components/CommunityMixesCarousel";
import { ActivityFeedCard } from "@/components/ActivityFeedCard";
import { ResonadoresSection } from "@/components/ResonadoresSection";
import { useCommunityFeed } from "@/hooks/useCommunityFeed";
import type { CommunityFeedEvent } from "@/lib/communityApi";
import { ContextSearchModal } from "@/components/ContextSearchModal";

const H_PAD = 20;

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

export default function ComunidadScreen() {
  const insets = useSafeAreaInsets();
  const [searchVisible, setSearchVisible] = useState(false);
  const { theme } = useSceneTheme();
  const { clerkUserId } = useAuth();
  const { open: openDrawer } = useDrawer();
  const { events, loading, refresh, refreshing } = useCommunityFeed(clerkUserId);

  const searchItems = useMemo(
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

  const feedOpacity = useRef(new Animated.Value(1)).current;
  const previousRefreshing = useRef(false);
  useEffect(() => {
    if (previousRefreshing.current && !refreshing) {
      Animated.sequence([
        Animated.timing(feedOpacity, { toValue: 0.2, duration: 120, useNativeDriver: true }),
        Animated.timing(feedOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    }
    previousRefreshing.current = refreshing;
  }, [feedOpacity, refreshing]);

  const header = (
    <View>
      <ResonadoresSection marginTop={40} marginBottom={32} />
      <EncuentrosResonadoresSection />
      <View style={styles.mixesSection}>
        <CommunityMixesCarousel />
      </View>
      <View style={styles.feedSection}>
        <Text style={styles.feedTitle}>Ahora en RESONANCIA</Text>
        {loading && (
          <View style={styles.feedState}>
            <ActivityIndicator color="#BE9650" size="large" />
            <Text style={styles.feedLoadingText}>Conectando con la comunidad…</Text>
          </View>
        )}
        {!loading && events.length === 0 && (
          <View style={styles.feedState}>
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
      <View style={styles.feedItem}>
        <ActivityFeedCard event={item} />
      </View>
    ),
    [],
  );

  return (
    <View
      style={[
        styles.root,
        {
          backgroundColor: theme.gradient[0] as string,
          paddingTop: Math.max(insets.top, 40),
        },
      ]}
    >
      <LinearGradient colors={theme.gradient} style={StyleSheet.absoluteFill} />
      <StatusBar hidden />

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Comunidad</Text>
        <View style={styles.headerActions}>
          <Pressable
            onPress={() => setSearchVisible(true)}
            hitSlop={10}
            style={styles.headerButton}
            accessibilityRole="button"
            accessibilityLabel="Buscar en Comunidad"
            testID="community-search-button"
          >
            <Feather name="search" size={22} color="#F9F9F9" />
          </Pressable>
          <Pressable
            onPress={openDrawer}
            hitSlop={10}
            style={styles.headerButton}
            accessibilityRole="button"
            accessibilityLabel="Abrir menú de perfil"
            testID="community-profile-menu-button"
          >
            <Feather name="user" size={22} color="#F9F9F9" />
          </Pressable>
        </View>
      </View>

      <Animated.FlatList
        data={loading || events.length === 0 ? [] : events}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.feedDivider} />}
        ListHeaderComponent={header}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
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
        items={searchItems}
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: H_PAD,
    paddingTop: 19,
    paddingBottom: 20,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: -9,
  },
  headerButton: { padding: 4 },
  headerTitle: {
    fontFamily: "Manrope",
    fontSize: 30,
    fontWeight: "800",
    color: "#F4F4F4",
    letterSpacing: 0.2,
    marginTop: -9,
    transform: [{ translateX: -2 }, { translateY: -2 }],
  },
  mixesSection: { marginTop: 36 },
  feedSection: {
    marginTop: 36,
    paddingHorizontal: H_PAD,
    paddingBottom: 8,
  },
  feedItem: {
    paddingHorizontal: H_PAD,
    paddingVertical: 2.5,
  },
  feedTitle: {
    fontFamily: "Manrope",
    fontSize: 20,
    fontWeight: "700",
    color: "#F9F9F9",
    marginBottom: 14,
  },
  feedState: {
    alignItems: "center",
    paddingVertical: 28,
    gap: 10,
  },
  feedLoadingText: {
    fontFamily: "Manrope",
    fontSize: 13,
    color: "rgba(190,150,80,0.7)",
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
    marginHorizontal: H_PAD,
  },
});