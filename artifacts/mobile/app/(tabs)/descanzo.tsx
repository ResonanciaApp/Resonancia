import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
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
import { getSessionsByDescansoTag } from "@/data/sessions";
import { DESCANSO_TAG_CARDS } from "@/data/tags";
import { useColors } from "@/hooks/useColors";

const H_PAD = 20;
const CARD_W = Math.round((Dimensions.get("window").width - 30) / 2.2);

export default function DescansoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const router = useRouter();

  return (
    <LinearGradient
      style={styles.root}
      colors={["#2E0510", "#160108"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 140 + bottomPad, paddingTop: topPad + 10 }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Hero ── */}
        <View style={styles.hero}>
          <Feather name="moon" size={34} color="#D4AF37" style={styles.heroIcon} />
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>Descanso</Text>
          <Text style={[styles.heroSubtitle, { color: colors.mutedForeground }]}>
            El descanso que mereces,{"\n"}encuéntralo aquí.
          </Text>
        </View>

        {/* ── Banner Mezclador ── */}
        <Pressable
          style={({ pressed }) => [styles.bannerWrap, pressed && { opacity: 0.82 }]}
          onPress={() => router.push("/escenas-mixer" as never)}
        >
          <LinearGradient
            style={styles.banner}
            colors={["#3D0E16", "#5C1520"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.bannerIconWrap}>
              <Feather name="moon" size={22} color="#D4AF37" />
            </View>
            <View style={styles.bannerText}>
              <Text style={[styles.bannerTitle, { color: colors.foreground }]}>
                Mezclador para dormir
              </Text>
              <Text style={[styles.bannerSub, { color: colors.mutedForeground }]}>
                Crea tu propia mezcla de sonidos
              </Text>
            </View>
            <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
          </LinearGradient>
        </Pressable>

        {/* ── Carruseles ── */}
        <View style={styles.carouselsWrap}>
          {DESCANSO_TAG_CARDS.map((tag) => {
            const sessions = getSessionsByDescansoTag(tag.label);
            return (
              <View key={tag.id} style={styles.section}>
                <View style={styles.catHeader}>
                  <Text style={[styles.catTitle, { color: colors.foreground }]} numberOfLines={1}>
                    {tag.label}
                  </Text>
                  <Pressable style={styles.verTodosBtn} hitSlop={10}>
                    <Feather name="chevron-right" size={20} color={colors.mutedForeground} />
                  </Pressable>
                </View>

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
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root:   { flex: 1 },
  scroll: { flex: 1 },

  /* Hero */
  hero: {
    alignItems: "center",
    paddingHorizontal: H_PAD,
    paddingBottom: 28,
  },
  heroIcon: {
    marginBottom: 14,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginBottom: 10,
  },
  heroSubtitle: {
    fontSize: 15,
    textAlign: "center",
    lineHeight: 22,
  },

  /* Mezclador banner */
  bannerWrap: {
    marginHorizontal: H_PAD,
    marginBottom: 36,
    borderRadius: 16,
    overflow: "hidden",
  },
  banner: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 18,
    paddingHorizontal: 16,
    gap: 14,
  },
  bannerIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: "rgba(212,175,55,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerText: {
    flex: 1,
  },
  bannerTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginBottom: 3,
  },
  bannerSub: {
    fontSize: 12,
  },

  /* Carruseles */
  carouselsWrap: {
    paddingTop: 6,
  },
  section: {
    marginBottom: 62,
  },
  catHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: H_PAD,
    marginBottom: 14,
  },
  catTitle: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.2,
    flex: 1,
  },
  verTodosBtn: {
    paddingLeft: 8,
  },

  carousel: {
    paddingLeft: H_PAD,
    paddingRight: 6,
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
