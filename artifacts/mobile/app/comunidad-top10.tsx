import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo } from "react";
import { Platform, Pressable, ScrollView, StatusBar, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { SessionCard } from "@/components/SessionCard";
import { SESSIONS } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

function fakePlays(rank: number): string {
  const base = 12_000 - rank * 850 + ((rank * 37) % 250);
  if (base >= 1000) return `${(base / 1000).toFixed(1).replace(".0", "")} mil`;
  return `${base}`;
}

export default function ComunidadTop10Screen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  // Selección deterministica de 10 sesiones — simula popularidad de la comunidad.
  const top10 = useMemo(() => {
    const pool = [...SESSIONS];
    const scored = pool
      .map((s, i) => ({ s, score: ((parseInt(s.id, 10) || i + 1) * 31) % 997 }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .map(({ s }) => s);
    return scored;
  }, []);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: 160 + bottomPad,
          paddingTop: topPad + 12,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerTop}>
          <Pressable
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/(tabs)/profile" as never))}
            hitSlop={10}
            style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="chevron-left" size={20} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Top 10 Comunidad</Text>
          <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
            Las sesiones más escuchadas por la comunidad esta semana
          </Text>
        </View>

        {top10.map((s, idx) => (
          <View key={s.id} style={styles.row}>
            <View style={[styles.rank, { backgroundColor: idx < 3 ? colors.primary : colors.card, borderColor: colors.border }]}>
              <Text style={[styles.rankText, { color: idx < 3 ? "#1A0E06" : colors.foreground }]}>
                {idx + 1}
              </Text>
            </View>
            <View style={styles.cardWrap}>
              <SessionCard session={s} horizontal />
              <Text style={[styles.plays, { color: colors.mutedForeground }]}>
                <Feather name="headphones" size={10} color={colors.mutedForeground} />  {fakePlays(idx)} escuchas
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  headerTop: { marginBottom: 14 },
  backBtn: {
    width: 36, height: 36, borderRadius: 18, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  header: { marginBottom: 20 },
  pageTitle: { fontSize: 28, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },
  pageSub: { fontSize: 13 },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    marginBottom: 14,
  },
  rank: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  rankText: { fontSize: 13, fontWeight: "700" },
  cardWrap: { flex: 1 },
  plays: { fontSize: 11, marginTop: 4, marginLeft: 4, letterSpacing: 0.3 },
});
