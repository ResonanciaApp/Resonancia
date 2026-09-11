import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { SymbolView } from "expo-symbols";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useAuth } from "@/context/AuthContext";
import { EncuentrosResonadoresSection } from "@/components/EncuentrosResonadoresSection";
import { ActivityFeedCard } from "@/components/ActivityFeedCard";
import { ResonadoresSection } from "@/components/ResonadoresSection";
import { ResonadorSearchModal } from "@/components/ResonadorSearchModal";
import { useCommunityFeed } from "@/hooks/useCommunityFeed";
import { useResonadores } from "@/hooks/useResonadores";
import type { CommunityFeedEvent } from "@/lib/communityApi";

const H_PAD = 14;

export default function ComunidadScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useSceneTheme();
  const { clerkUserId } = useAuth();
  const { events, loading, refresh, refreshing } = useCommunityFeed(clerkUserId);
  const {
    resonadores,
    isLoading: resonadoresLoading,
    isError: resonadoresError,
  } = useResonadores();
  const [searchVisible, setSearchVisible] = useState(false);

  const feedOpacity = useRef(new Animated.Value(1)).current;
  const previousRefreshing = useRef(false);
  const stickyHeaderOpacity = useRef(new Animated.Value(0)).current;
  const stickyHeaderActiveRef = useRef(false);
  const [stickyHeaderActive, setStickyHeaderActive] = useState(false);
  useEffect(() => {
    if (previousRefreshing.current && !refreshing) {
      Animated.sequence([
        Animated.timing(feedOpacity, { toValue: 0.2, duration: 120, useNativeDriver: true }),
        Animated.timing(feedOpacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      ]).start();
    }
    previousRefreshing.current = refreshing;
  }, [feedOpacity, refreshing]);

  const handleScroll = useCallback((event: {
    nativeEvent: { contentOffset: { y: number } };
  }) => {
    const active = event.nativeEvent.contentOffset.y >= 8;
    if (active === stickyHeaderActiveRef.current) return;
    stickyHeaderActiveRef.current = active;
    setStickyHeaderActive(active);
    stickyHeaderOpacity.stopAnimation();
    Animated.timing(stickyHeaderOpacity, {
      toValue: active ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  }, [stickyHeaderOpacity]);

  const header = (
    <View>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Comunidad</Text>
        <Pressable
          onPress={() => setSearchVisible(true)}
          hitSlop={10}
          style={styles.headerSearchButton}
          accessibilityRole="button"
          accessibilityLabel="Buscar Resonadores"
          testID="community-search-button"
        >
          {Platform.OS === "ios" ? (
            <SymbolView name="magnifyingglass" tintColor="#F4F4F4" size={24} />
          ) : (
            <Feather name="search" size={24} color="#F4F4F4" />
          )}
        </Pressable>
      </View>
      <EncuentrosResonadoresSection titleMarginTop={5} />
      <ResonadoresSection marginTop={36} marginBottom={32} />
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

      <Animated.View
        pointerEvents={stickyHeaderActive ? "auto" : "none"}
        style={[
          styles.stickyHeader,
          {
            paddingTop: Math.max(insets.top, 40) + 2,
            backgroundColor: theme.gradient[0] as string,
            opacity: stickyHeaderOpacity,
          },
        ]}
      >
        <View style={styles.stickyHeaderRow}>
          <Animated.Text
            style={[
              styles.stickyHeaderTitle,
              {
                transform: [{
                  translateY: stickyHeaderOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                }],
              },
            ]}
          >
            Comunidad
          </Animated.Text>
          <Pressable
            onPress={() => setSearchVisible(true)}
            hitSlop={10}
            style={[styles.headerSearchButton, styles.stickySearchButton]}
            accessibilityRole="button"
            accessibilityLabel="Buscar Resonadores"
            testID="community-sticky-search-button"
          >
            {Platform.OS === "ios" ? (
              <SymbolView name="magnifyingglass" tintColor="#F4F4F4" size={24} />
            ) : (
              <Feather name="search" size={24} color="#F4F4F4" />
            )}
          </Pressable>
        </View>
      </Animated.View>

      <Animated.FlatList
        data={loading || events.length === 0 ? [] : events}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        ItemSeparatorComponent={() => <View style={styles.feedDivider} />}
        ListHeaderComponent={header}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 + insets.bottom }}
        style={{ opacity: feedOpacity }}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={refresh}
            tintColor="#BE9650"
            colors={["#BE9650"]}
          />
        }
      />

      <ResonadorSearchModal
        visible={searchVisible}
        resonadores={resonadores}
        loading={resonadoresLoading}
        error={resonadoresError}
        onClose={() => setSearchVisible(false)}
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
    paddingLeft: H_PAD,
    paddingRight: 16,
    paddingTop: 2,
    paddingBottom: 20,
  },
  headerTitle: {
    fontFamily: "Manrope",
    fontSize: 30,
    fontWeight: "800",
    color: "#F4F4F4",
    letterSpacing: 0.2,
    marginTop: 0,
    transform: [{ translateX: -2 }, { translateY: 1 }],
  },
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
  },
  stickyHeaderRow: {
    minHeight: 54,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: H_PAD,
    paddingTop: 7,
    paddingBottom: 10,
  },
  stickyHeaderTitle: {
    fontFamily: "Manrope",
    fontSize: 18,
    fontWeight: "800",
    color: "#F4F4F4",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  headerSearchButton: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
    transform: [{ translateY: 2 }],
  },
  stickySearchButton: {
    position: "absolute",
    top: 0,
    right: 16,
  },
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
    color: "#F9F9F9",
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