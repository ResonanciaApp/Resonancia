import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { Image as ExpoImage } from "expo-image";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { PremiumBadge } from "@/components/PremiumBadge";
import { SacredGlyph } from "@/components/SacredGlyph";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { useCatalog } from "@/context/CatalogContext";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { chakraMatchesTag, getChakraById } from "@/data/chakras";
import { SESSIONS, type Session } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

const H_PAD = 20;
const GLYPH_CARD = 170;
const GLYPH_SIZE = 120;

export default function ChakraScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isPremium } = usePremium();
  const { playSession } = usePlayer();
  const { version: catalogVersion } = useCatalog();
  const { id } = useLocalSearchParams<{ id: string }>();

  const chakra = getChakraById(id);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const sessions = React.useMemo(() => {
    if (!chakra) return [];
    return SESSIONS.filter((s) => s.themeTag?.some((t) => chakraMatchesTag(chakra, t)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chakra, catalogVersion]);

  if (!chakra) {
    return (
      <View style={[styles.root, { backgroundColor: "#210911" }]}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={["#340D1A", "#190913"]} style={StyleSheet.absoluteFill} />
        <View style={[styles.headerRow, { paddingHorizontal: H_PAD, paddingTop: topPad + 8 }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
        </View>
        <View style={styles.notFound}>
          <Feather name="alert-circle" size={40} color={colors.mutedForeground} />
          <Text style={[styles.notFoundTitle, { color: colors.foreground }]}>Chakra no encontrado</Text>
          <Text style={[styles.notFoundSub, { color: colors.mutedForeground }]}>
            Esta sección no existe o fue removida.
          </Text>
        </View>
      </View>
    );
  }

  const handleSessionPress = (s: Session) => {
    const locked = !!s.isPremium && !isPremium;
    if (locked) { router.push("/membresia" as never); return; }
    if (s.skipMiniPlayer) { playSession(s); return; }
    if (s.skipDetail) { playSession(s); router.push("/player" as never); return; }
    router.push(`/session/${s.id}` as never);
  };

  return (
    <View style={[styles.root, { backgroundColor: "#1B060F" }]}>
      <StatusBar barStyle="light-content" />
      <LinearGradient colors={["#4A0C0C", "#27070E", "#1B060F"]} style={StyleSheet.absoluteFill} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 120 + bottomPad, paddingTop: topPad + 8 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={[styles.headerRow, { paddingHorizontal: H_PAD }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
        </View>

        {/* Glifo + título + descripción */}
        <View style={styles.hero}>
          <View style={styles.glyphCard}>
            <SacredGlyph id={chakra.geometryId} color={chakra.color} size={GLYPH_SIZE} />
          </View>
          <Text style={[styles.name, { color: colors.foreground }]}>{chakra.name}</Text>
          <Text style={[styles.tagLabel, { color: chakra.color }]}>{chakra.tagLabel}</Text>
          <Text style={[styles.description, { color: colors.mutedForeground }]} numberOfLines={2}>
            {chakra.description}
          </Text>
        </View>

        {/* Sesiones */}
        <View style={[styles.section, { paddingHorizontal: H_PAD }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Sesiones</Text>

          {sessions.length === 0 ? (
            <Text style={[styles.empty, { color: colors.mutedForeground }]}>
              Todavía no hay sesiones para este chakra.
            </Text>
          ) : (
            sessions.map((session) => {
              const locked = !!session.isPremium && !isPremium;
              return (
                <Pressable
                  key={session.id}
                  onPress={() => handleSessionPress(session)}
                  style={({ pressed }) => [
                    styles.trackRow,
                    { backgroundColor: "rgba(74,12,12,0.08)", opacity: pressed ? 0.8 : 1 },
                  ]}
                >
                  <View style={styles.trackImgWrap}>
                    <ExpoImage
                      source={session.image as any}
                      style={styles.trackImg}
                      contentFit="cover"
                      placeholder={BLUR_PLACEHOLDER}
                      transition={IMAGE_TRANSITION}
                    />
                    <PremiumBadge session={session} size={16} top={4} right={4} />
                  </View>
                  <View style={styles.trackMeta}>
                    <Text style={[styles.trackTitle, { color: colors.foreground }]} numberOfLines={1}>
                      {session.title}
                    </Text>
                    <Text style={[styles.trackSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {session.categoryLabel} · {session.durationLabel}
                    </Text>
                  </View>
                  <View style={[styles.playBtn, { backgroundColor: "rgba(212,175,55,0.18)" }]}>
                    <Feather name={locked ? "lock" : "play"} size={15} color={colors.primary} />
                  </View>
                </Pressable>
              );
            })
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginLeft: -8 },

  hero: { alignItems: "center", paddingHorizontal: H_PAD, marginBottom: 30 },
  glyphCard: {
    width: GLYPH_CARD,
    height: GLYPH_CARD,
    borderRadius: 25,
    backgroundColor: "rgba(0,0,0,0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  name: { fontFamily: "Manrope", fontSize: 24, fontWeight: "700", letterSpacing: 0.3 },
  tagLabel: { fontFamily: "Manrope", fontSize: 13, fontWeight: "700", letterSpacing: 0.4, marginTop: 6 },
  description: {
    fontFamily: "Manrope",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 14,
  },

  section: {},
  sectionTitle: { fontFamily: "Manrope", fontSize: 20, fontWeight: "700", letterSpacing: 0.5, marginBottom: 12 },
  empty: { fontFamily: "Manrope", fontSize: 14, lineHeight: 21 },

  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 10,
    marginBottom: 10,
  },
  trackImgWrap: { width: 52, height: 52, borderRadius: 10, overflow: "hidden", marginRight: 12 },
  trackImg: { width: 52, height: 52 },
  trackMeta: { flex: 1, marginRight: 10 },
  trackTitle: { fontFamily: "Manrope", fontSize: 14, fontWeight: "700" },
  trackSub: { fontFamily: "Manrope", fontSize: 12, marginTop: 3 },
  playBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },

  notFound: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 10 },
  notFoundTitle: { fontFamily: "Manrope", fontSize: 18, fontWeight: "700" },
  notFoundSub: { fontFamily: "Manrope", fontSize: 14, textAlign: "center", lineHeight: 21 },
});
