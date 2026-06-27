import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useState } from "react";
import {
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

import { GhostPill } from "@/components/GhostPill";
import { SacredBackground } from "@/components/SacredBackground";
import { SessionCard } from "@/components/SessionCard";
import { getSessionsByDescansoTag } from "@/data/sessions";
import { DESCANSO_TAG_CARDS } from "@/data/tags";
import { useColors } from "@/hooks/useColors";

const BG_GRADIENT = ["#2E0510", "#160108"] as const;
const ACCENT = "#8AAAD4";

const { width: SCREEN_W } = Dimensions.get("window");
const H_PAD = 20;
const CARD_W = 148;

export default function DescansoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [filterOpen, setFilterOpen] = useState(false);

  return (
    <LinearGradient
      style={styles.root}
      colors={BG_GRADIENT}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      {/* ── Header fijo ── */}
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <LinearGradient
          colors={["#2E0510", "#160108"]}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.headerRow}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Descanso</Text>
          <GhostPill>
            <Pressable
              hitSlop={10}
              onPress={() => setFilterOpen((v) => !v)}
              style={styles.filterBtn}
            >
              <Feather
                name="sliders"
                size={19}
                color={filterOpen ? ACCENT : colors.foreground}
              />
            </Pressable>
          </GhostPill>
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 140 + bottomPad, paddingTop: 8 }}
        showsVerticalScrollIndicator={false}
      >
        {DESCANSO_TAG_CARDS.map((tag) => {
          const sessions = getSessionsByDescansoTag(tag.label);
          return (
            <View key={tag.id} style={styles.section}>
              {/* Título del carrusel */}
              <View style={styles.catHeader}>
                <View style={styles.catTitleRow}>
                  <Feather name={tag.icon as never} size={15} color={tag.accent} style={{ marginTop: 1 }} />
                  <Text style={[styles.catTitle, { color: colors.foreground }]}>{tag.label}</Text>
                </View>
                <Pressable style={styles.verTodosBtn}>
                  <Text style={[styles.verTodosText, { color: colors.accent }]}>Ver todas</Text>
                  <Feather name="arrow-right" size={13} color={colors.accent} />
                </Pressable>
              </View>

              {/* Carrusel */}
              {sessions.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.carousel}
                >
                  {sessions.map((s) => (
                    <SessionCard key={s.id} session={s} width={CARD_W} />
                  ))}
                </ScrollView>
              ) : (
                <View style={[styles.emptySlot, { borderColor: colors.border }]}>
                  <Feather name="moon" size={22} color={colors.mutedForeground} />
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                    Próximamente
                  </Text>
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { flex: 1 },

  header: {
    paddingHorizontal: H_PAD,
    paddingBottom: 14,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  filterBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },

  section: {
    marginBottom: 32,
  },
  catHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: H_PAD,
    marginBottom: 14,
  },
  catTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flex: 1,
    marginRight: 8,
  },
  catTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  verTodosBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  verTodosText: {
    fontSize: 13,
    fontWeight: "500",
  },

  carousel: {
    paddingLeft: H_PAD,
    paddingRight: 12,
    gap: 12,
  },

  emptySlot: {
    marginHorizontal: H_PAD,
    height: 100,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
  },
});
