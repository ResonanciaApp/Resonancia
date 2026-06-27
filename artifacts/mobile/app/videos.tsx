import { Feather } from "@expo/vector-icons";
import { Stack, router } from "expo-router";
import React from "react";
import { ActivityIndicator, Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { VideoCard } from "@/components/VideoCard";
import { useVideos } from "@/hooks/useVideos";
import { useColors } from "@/hooks/useColors";

export default function VideosScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { videos, isLoading } = useVideos();

  const topPad = Platform.OS === "web" ? 16 : insets.top;
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <Stack.Screen options={{ headerShown: false }} />
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={({ pressed }) => [styles.backBtn, { opacity: pressed ? 0.7 : 1 }]}
        >
          <Feather name="chevron-left" size={26} color={colors.foreground} />
        </Pressable>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Videos</Text>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 80 + bottomPad, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {isLoading ? (
          <View style={styles.empty}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : videos.length === 0 ? (
          <View style={styles.empty}>
            <Feather name="film" size={36} color={colors.border} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
              Próximamente
            </Text>
            <Text style={[styles.emptySub, { color: colors.mutedForeground }]}>
              Pronto vas a encontrar videos aquí.
            </Text>
          </View>
        ) : (
          videos.map((v) => <VideoCard key={v.id} video={v} horizontal />)
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingBottom: 12,
    gap: 4,
  },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  pageTitle: { fontSize: 24, fontFamily: "OptimaBold", letterSpacing: 0.4 },
  empty: { alignItems: "center", paddingVertical: 80, gap: 10 },
  emptyTitle: { fontSize: 16, fontFamily: "OptimaBold" },
  emptySub: { fontSize: 13, fontFamily: "Jost", textAlign: "center" },
});
