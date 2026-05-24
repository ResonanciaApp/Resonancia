import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
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

import { SacredBackground } from "@/components/SacredBackground";
import { SessionCard } from "@/components/SessionCard";
import { getSessionsBySleepTag } from "@/data/sessions";
import { SLEEP_TAG_CARDS } from "@/data/tags";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");

export default function DescansoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 160 + bottomPad, paddingTop: topPad + 12 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <LinearGradient
            colors={["rgba(15,10,30,0)", "rgba(30,18,50,0.0)"]}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.headerIcon}>
            <Feather name="moon" size={20} color="#8AAAD4" />
          </View>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Descanso</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Sonidos y relatos para acompañar tu noche
          </Text>
        </View>

        {/* ── Módulos por etiqueta ── */}
        {SLEEP_TAG_CARDS.map((tag) => {
          const sessions = getSessionsBySleepTag(tag.label);
          return (
            <View key={tag.id} style={styles.section}>
              {/* Título de la etiqueta */}
              <View style={styles.catHeader}>
                <Text style={[styles.catTitle, { color: colors.foreground }]}>{tag.label}</Text>
                <Pressable
                  style={styles.verTodosBtn}
                  onPress={() => router.push(`/sleep-tag/${tag.id}` as never)}
                >
                  <Text style={[styles.verTodosText, { color: colors.accent }]}>Ver todas</Text>
                  <Feather name="arrow-right" size={13} color={colors.accent} />
                </Pressable>
              </View>

              {/* Carrusel de sesiones */}
              {sessions.length > 0 ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.carousel}
                >
                  {sessions.map((s) => (
                    <SessionCard key={s.id} session={s} width={148} />
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },

  header: {
    paddingHorizontal: 22,
    paddingBottom: 28,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(138,170,212,0.12)",
    borderWidth: 1,
    borderColor: "rgba(138,170,212,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  headerTitle: {
    fontSize: 30,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 6,
  },
  headerSub: {
    fontSize: 14,
    lineHeight: 20,
  },

  section: {
    marginBottom: 32,
  },

  catHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 22,
    marginBottom: 14,
  },
  catTitle: {
    fontSize: 16,
    fontWeight: "700",
    letterSpacing: 0.2,
    flex: 1,
    marginRight: 8,
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
    paddingLeft: 22,
    paddingRight: 12,
    gap: 12,
  },

  emptySlot: {
    marginHorizontal: 22,
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
