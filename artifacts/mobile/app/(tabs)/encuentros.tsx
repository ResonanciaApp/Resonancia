import React, { useCallback, useEffect, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  RefreshControl,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useAuth } from "@/context/AuthContext";
import { EncuentrosResonadoresSection } from "@/components/EncuentrosResonadoresSection";
import { ActivityFeedCard } from "@/components/ActivityFeedCard";
import { ResonadoresSection } from "@/components/ResonadoresSection";
import { useCommunityFeed } from "@/hooks/useCommunityFeed";
import type { CommunityFeedEvent } from "@/lib/communityApi";

const H_PAD = 20;

export default function ComunidadScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useSceneTheme();
  const { clerkUserId } = useAuth();
  const { events, loading, refresh, refreshing } = useCommunityFeed(clerkUserId);

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
      <EncuentrosResonadoresSection />
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

      <View style={styles.header}>
        <Text style={styles.headerTitle}>Comunidad</Text>
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
  headerTitle: {
    fontFamily: "Manrope",
    fontSize: 30,
    fontWeight: "800",
    color: "#F4F4F4",
    letterSpacing: 0.2,
    marginTop: -9,
    transform: [{ translateX: -2 }, { translateY: -2 }],
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