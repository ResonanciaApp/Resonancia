import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { useMixer } from "@/context/MixerContext";
import { MIX_CATEGORIES } from "@/data/mix-categories";
import { useColors } from "@/hooks/useColors";

const BG   = "#0B0F14";
const FG   = "#EDE1D3";
const MUTED = "#7A8FA8";
const GOLD  = "#BE9650";

export default function MezclasIndexScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { presets } = useMixer();

  const counts = useMemo(() => {
    const map: Record<string, number> = {};
    for (const cat of MIX_CATEGORIES) {
      map[cat.id] = presets.filter((p) => p.category === cat.id).length;
    }
    return map;
  }, [presets]);

  return (
    <View style={[styles.root, { backgroundColor: BG }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <ScrollView
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Feather name="arrow-left" size={22} color={FG} />
          </Pressable>
          <View style={styles.titleWrap}>
            <Feather name="heart" size={16} color={GOLD} style={{ marginRight: 6 }} />
            <Text style={styles.pageTitle}>Mis Mezclas</Text>
          </View>
          <Text style={styles.pageSub}>Tus ambientes guardados</Text>
        </View>

        {/* Category tiles */}
        <View style={styles.tiles}>
          {MIX_CATEGORIES.map((cat) => {
            const count = counts[cat.id] ?? 0;
            return (
              <Pressable
                key={cat.id}
                onPress={() => router.push(`/mezclas/${cat.id}` as never)}
                style={({ pressed }) => [styles.tile, pressed && { opacity: 0.88 }]}
              >
                {/* Background image */}
                <Image
                  source={cat.image}
                  style={StyleSheet.absoluteFill}
                  contentFit="cover"
                />
                {/* Overlay */}
                <View style={[styles.tileOverlay, { backgroundColor: "rgba(6,10,15,0.55)" }]} />

                <View style={styles.tileContent}>
                  <View style={styles.tileTop}>
                    <Text style={styles.tileLabel}>{cat.label}</Text>
                    <View style={[styles.countBadge, { backgroundColor: `${cat.color ?? GOLD}22`, borderColor: `${cat.color ?? GOLD}55` }]}>
                      <Text style={[styles.countText, { color: cat.color ?? GOLD }]}>
                        {count} {count === 1 ? "mezcla" : "mezclas"}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.tileSub} numberOfLines={2}>{cat.subtitle}</Text>
                </View>

                <View style={styles.tileArrow}>
                  <Feather name="chevron-right" size={20} color="rgba(255,255,255,0.55)" />
                </View>
              </Pressable>
            );
          })}
        </View>

        {presets.length === 0 && (
          <View style={styles.empty}>
            <Feather name="heart" size={36} color={MUTED} style={{ marginBottom: 14 }} />
            <Text style={styles.emptyTitle}>Aún no guardaste mezclas</Text>
            <Text style={styles.emptySub}>
              Combiná sonidos en el Mezclador y tocá{" "}
              <Text style={{ color: FG, fontWeight: "700" }}>Guardar nueva</Text>{" "}
              para que aparezcan acá.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  content: { paddingHorizontal: 20 },

  header: { marginBottom: 28 },
  backBtn: { marginBottom: 18 },
  titleWrap: { flexDirection: "row", alignItems: "center", marginBottom: 4 },
  pageTitle: { fontSize: 22, fontWeight: "700", letterSpacing: -0.4, color: FG },
  pageSub: { fontSize: 13, color: MUTED },

  tiles: { gap: 14 },
  tile: {
    height: 130,
    borderRadius: 18,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
  },
  tileOverlay: { ...StyleSheet.absoluteFillObject },
  tileContent: { flex: 1, padding: 16 },
  tileTop: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 6, flexWrap: "wrap" },
  tileLabel: { fontSize: 18, fontWeight: "700", color: FG, letterSpacing: -0.3 },
  countBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 20,
    borderWidth: 1,
  },
  countText: { fontSize: 12, fontWeight: "600" },
  tileSub: { fontSize: 13, color: "rgba(237,225,211,0.7)", lineHeight: 17 },
  tileArrow: { paddingRight: 14, paddingBottom: 14 },

  empty: { marginTop: 48, alignItems: "center", paddingHorizontal: 24 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: FG, marginBottom: 10 },
  emptySub: { fontSize: 14, color: MUTED, textAlign: "center", lineHeight: 21 },
});
