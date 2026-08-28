import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useCallback, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ContextSearchModal } from "@/components/ContextSearchModal";
import { GeoUniverseBackground } from "@/components/GeoUniverseBackground";
import { SessionCarousel } from "@/components/SessionCarousel";
import { useCatalog } from "@/context/CatalogContext";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import {
  getSessionById,
  getSessionsBySonidosTag,
  getSonidosVisibleSessions,
  type Session,
} from "@/data/sessions";
import { SONIDOS_TAG_CARDS } from "@/data/tags";
import { useColors } from "@/hooks/useColors";

const H_PAD = 19;
const { width: W } = Dimensions.get("window");
const CARD_W = Math.round((W - H_PAD * 2) / 1.85);

function CollectionPill({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pill, { opacity: pressed ? 0.7 : 1 }]}
    >
      <Text style={styles.pillText} numberOfLines={1}>{label}</Text>
    </Pressable>
  );
}

export default function SonidosScreen() {
  const insets = useSafeAreaInsets();
  const colors = useColors();
  const { theme } = useSceneTheme();
  const { isPremium } = usePremium();
  const { version } = useCatalog();
  const {
    currentSession,
    history,
    playSessionInPlaylist,
  } = usePlayer();
  const [searchVisible, setSearchVisible] = useState(false);
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const titleProgress = useRef(new Animated.Value(0)).current;
  const compactRef = useRef(false);

  const collections = useMemo(
    () =>
      SONIDOS_TAG_CARDS.map((tag) => ({
        ...tag,
        sessions: getSessionsBySonidosTag(tag.label),
      })).filter((tag) => tag.sessions.length > 0),
    [version],
  );
  const allSessions = useMemo(() => getSonidosVisibleSessions(), [version]);
  const allIds = useMemo(() => allSessions.map((session) => session.id), [allSessions]);
  const recent = useMemo(() => {
    const allowed = new Set(allIds);
    const seen = new Set<string>();
    const result: Session[] = [];
    for (const item of history) {
      if (seen.has(item.sessionId) || !allowed.has(item.sessionId)) continue;
      const session = getSessionById(item.sessionId);
      if (session) result.push(session);
      seen.add(item.sessionId);
      if (result.length === 10) break;
    }
    return result;
  }, [allIds, history]);

  const openSession = useCallback((session: Session) => {
    const playWithQueue = () => {
      if (currentSession?.id !== session.id) playSessionInPlaylist(session, allIds);
    };
    if (session.skipMiniPlayer) {
      playWithQueue();
      return;
    }
    const directPlayer =
      session.skipDetail !== false &&
      (session.skipDetail === true ||
        ["sonidos-ancestrales", "musica-sonidos"].includes(session.categoryId));
    if (directPlayer) {
      playWithQueue();
      router.push("/player" as never);
      return;
    }
    router.push({
      pathname: "/session/[id]",
      params: { id: session.id, source: "sonidos" },
    } as never);
  }, [allIds, currentSession?.id, playSessionInPlaylist]);

  const searchItems = useMemo(
    () => allSessions.map((session) => ({
      id: session.id,
      title: session.title,
      meta: session.categoryLabel,
      subtitle: session.subtitle,
      searchText: `${session.title} ${session.categoryLabel} ${session.subtitle ?? ""}`,
      image: session.image as number,
    })),
    [allSessions],
  );

  return (
    <LinearGradient colors={theme.gradient} style={styles.root}>
      <StatusBar hidden />
      <GeoUniverseBackground />
      <View style={[styles.fixedHeader, { paddingTop: topPad + 2 }]}>
        <View style={styles.titleRow}>
          <Animated.Text
            style={[
              styles.heroTitle,
              {
                color: colors.foreground,
                opacity: titleProgress.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
              },
            ]}
          >
            Sonidos
          </Animated.Text>
          <Animated.Text
            pointerEvents="none"
            style={[styles.compactTitle, { color: colors.foreground, opacity: titleProgress }]}
          >
            Sonidos
          </Animated.Text>
          <Pressable
            onPress={() => setSearchVisible(true)}
            hitSlop={10}
            style={styles.searchButton}
            accessibilityRole="button"
            accessibilityLabel="Buscar en Sonidos"
          >
            <Feather name="search" size={24} color={colors.foreground} />
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pills}
        >
          {collections.map((collection) => (
            <CollectionPill
              key={collection.id}
              label={collection.label}
              onPress={() => router.push(`/sound-tag/${collection.id}` as never)}
            />
          ))}
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 140 + bottomPad }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(event) => {
          const compact = event.nativeEvent.contentOffset.y > 8;
          if (compact === compactRef.current) return;
          compactRef.current = compact;
          Animated.timing(titleProgress, {
            toValue: compact ? 1 : 0,
            duration: 300,
            useNativeDriver: true,
          }).start();
        }}
      >
        {allSessions.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="headphones" size={30} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>Próximamente</Text>
            <Text style={[styles.emptySubtitle, { color: colors.mutedForeground }]}>
              Las colecciones aparecerán cuando tengan sesiones publicadas.
            </Text>
          </View>
        ) : (
          <>
            {recent.length > 0 && (
              <SessionCarousel
                title="Escuchadas recientemente"
                sessions={recent}
                isPremium={isPremium}
                onPress={openSession}
                style={styles.carousel}
                cardWidth={CARD_W}
                titleSize={18}
                showCardMetadata
              />
            )}
            {collections.map((collection) => (
              <SessionCarousel
                key={collection.id}
                title={collection.label}
                sessions={collection.sessions.slice(0, 5)}
                isPremium={isPremium}
                onPress={openSession}
                style={styles.carousel}
                cardWidth={CARD_W}
                titleSize={18}
                showCardMetadata
                onViewAll={() => router.push(`/sound-tag/${collection.id}` as never)}
              />
            ))}
          </>
        )}
      </ScrollView>

      <ContextSearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        items={searchItems}
        placeholder="Buscar en Sonidos..."
        emptyTitle="Encuentra tu paisaje sonoro"
        emptySubtitle="Busca naturaleza, lluvia, frecuencias o música"
        onSelect={(item) => {
          const session = allSessions.find((candidate) => candidate.id === item.id);
          if (session) openSession(session);
        }}
      />
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  fixedHeader: {
    paddingHorizontal: H_PAD,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  titleRow: {
    minHeight: 52,
    justifyContent: "center",
  },
  heroTitle: {
    fontFamily: "Manrope",
    fontSize: 32,
    lineHeight: 40,
    fontWeight: "700",
  },
  compactTitle: {
    position: "absolute",
    alignSelf: "center",
    fontFamily: "Manrope",
    fontSize: 20,
    fontWeight: "700",
  },
  searchButton: {
    position: "absolute",
    right: 0,
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  pills: { gap: 8, paddingVertical: 8, paddingRight: H_PAD },
  pill: {
    minHeight: 38,
    paddingHorizontal: 16,
    borderRadius: 19,
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  pillText: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
    color: "#F9F9F9",
  },
  scroll: { flex: 1 },
  carousel: {
    marginTop: 38,
    marginBottom: 0,
    paddingHorizontal: H_PAD,
  },
  empty: {
    marginHorizontal: H_PAD,
    marginTop: 70,
    minHeight: 180,
    paddingHorizontal: 30,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  emptyTitle: { fontFamily: "Manrope", fontSize: 17, fontWeight: "700" },
  emptySubtitle: {
    fontFamily: "Manrope",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
  },
});