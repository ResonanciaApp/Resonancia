import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
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
import Svg, { Defs, Rect, RadialGradient as SvgRadialGradient, Stop } from "react-native-svg";

import { SacredGlyph } from "@/components/SacredGlyph";
import { useCatalog } from "@/context/CatalogContext";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { chakraMatchesTag, getChakraById } from "@/data/chakras";
import { SESSIONS, type Session } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";

const H_PAD = 20;
const GLYPH_SIZE = 120;

export default function ChakraScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isPremium } = usePremium();
  const { playSession, currentSession } = usePlayer();
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

  const handleSessionPress = (s: Session) => {
    const locked = !!s.isPremium && !isPremium;
    if (locked) { router.push("/membresia" as never); return; }
    if (s.skipMiniPlayer) { playSession(s); return; }
    if (s.skipDetail) { playSession(s); router.push("/player" as never); return; }
    router.push(`/session/${s.id}` as never);
  };

  if (!chakra) {
    return (
      <View style={[styles.root, { backgroundColor: "#210911" }]}>
        <StatusBar barStyle="light-content" />
        <LinearGradient colors={["#340D1A", "#190913", "#0D0808"]} style={StyleSheet.absoluteFill} />
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

  return (
    <View style={[styles.root, { backgroundColor: chakra.radialOuter }]}>
      <StatusBar barStyle="light-content" />
      <Svg style={StyleSheet.absoluteFill} viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
        <Defs>
          <SvgRadialGradient id="chakraBg" cx="50" cy="52.5" r="72.5" gradientUnits="userSpaceOnUse">
            <Stop offset="0" stopColor={chakra.radialCenter} stopOpacity="1" />
            <Stop offset="0.9" stopColor={chakra.radialOuter} stopOpacity="1" />
            <Stop offset="1" stopColor={chakra.radialOuter} stopOpacity="1" />
          </SvgRadialGradient>
        </Defs>
        <Rect x="0" y="0" width="100" height="100" fill="url(#chakraBg)" />
      </Svg>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 120 + bottomPad, paddingTop: topPad + 8 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header: atrás + título centrado */}
        <View style={[styles.headerRow, { paddingHorizontal: H_PAD }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={[styles.name, { color: colors.foreground }]}>{chakra.name}</Text>
            <Text style={[styles.tagLabel, { color: chakra.color }]}>Chakra {chakra.subtitle}</Text>
          </View>
          <View style={styles.backBtn} />
        </View>

        {/* Glifo centrado */}
        <View style={styles.hero}>
          <SacredGlyph id={chakra.geometryId} color={chakra.color} size={GLYPH_SIZE} />
          <Text style={[styles.description, { color: colors.mutedForeground }]} numberOfLines={2}>
            {chakra.description}
          </Text>
        </View>

        {/* Bloques informativos */}
        <View style={styles.infoRow}>
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Elemento</Text>
            <MaterialCommunityIcons name="triangle-outline" size={17} color={chakra.color} style={styles.infoIcon} />
            <Text style={[styles.infoValue, { color: colors.foreground }]}>{chakra.element}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Color</Text>
            <View style={[styles.infoDot, { backgroundColor: chakra.color }]} />
            <Text style={[styles.infoValue, { color: colors.foreground }]}>{chakra.colorName}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Mantra</Text>
            <MaterialCommunityIcons name="waveform" size={17} color={chakra.color} style={styles.infoIcon} />
            <Text style={[styles.infoValue, { color: colors.foreground }]}>{chakra.mantra}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoBlock}>
            <Text style={styles.infoLabel}>Ubicación</Text>
            <MaterialCommunityIcons name="map-marker-outline" size={17} color={chakra.color} style={styles.infoIcon} />
            <Text style={[styles.infoValue, { color: colors.foreground }]} numberOfLines={2}>
              {chakra.location}
            </Text>
          </View>
        </View>

        {/* Sesiones recomendadas */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Meditaciones recomendadas</Text>
        </View>

        {sessions.length === 0 ? (
          <Text style={[styles.empty, { color: colors.mutedForeground, paddingHorizontal: H_PAD }]}>
            Todavía no hay sesiones para este chakra.
          </Text>
        ) : (
          <View style={styles.sessionList}>
            {sessions.map((session) => {
              const playing = currentSession?.id === session.id;
              return (
                <Pressable
                  key={session.id}
                  onPress={() => handleSessionPress(session)}
                  style={({ pressed }) => [styles.rowCard, { opacity: pressed ? 0.8 : 1 }]}
                >
                  <Image source={session.image} style={styles.rowImage} contentFit="cover" cachePolicy="memory-disk" />
                  <View style={styles.rowInfo}>
                    <Text style={[styles.rowTitle, { color: colors.foreground }]} numberOfLines={2}>
                      {session.title}
                    </Text>
                    <Text style={[styles.rowMeta, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {session.categoryLabel} · {session.durationLabel}
                    </Text>
                  </View>
                  <View style={[styles.rowPlay, { borderColor: playing ? chakra.color : "rgba(255,255,255,0.25)" }]}>
                    <Feather name={playing ? "pause" : "play"} size={15} color={playing ? chakra.color : "#F4F4F4"} style={playing ? undefined : { marginLeft: 2 }} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  headerRow: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginLeft: -8 },

  headerCenter: { flex: 1, alignItems: "center" },

  hero: { alignItems: "center", paddingHorizontal: H_PAD, marginTop: 18, marginBottom: 26 },

  infoRow: {
    flexDirection: "row",
    alignItems: "stretch",
    marginHorizontal: H_PAD,
    marginBottom: 30,
    borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.18)",
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  infoBlock: { flex: 1, alignItems: "center", gap: 6, paddingHorizontal: 4 },
  infoDivider: { width: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.12)" },
  infoLabel: { fontFamily: "Manrope", fontSize: 11, fontWeight: "500", color: "rgba(244,244,244,0.6)", letterSpacing: 0.3 },
  infoIcon: { height: 18 },
  infoDot: { width: 13, height: 13, borderRadius: 7, marginVertical: 2.5 },
  infoValue: { fontFamily: "Manrope", fontSize: 12.5, fontWeight: "600", textAlign: "center", lineHeight: 16 },
  name: { fontFamily: "Manrope", fontSize: 22, fontWeight: "700", letterSpacing: 0.3 },
  tagLabel: { fontFamily: "Manrope", fontSize: 13, fontWeight: "700", letterSpacing: 0.4, marginTop: 3 },
  description: {
    fontFamily: "Manrope",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 14,
  },

  sectionHeader: { paddingHorizontal: H_PAD, marginBottom: 14 },
  sectionTitle: { fontFamily: "Manrope", fontSize: 18, fontWeight: "700", letterSpacing: 0.3 },

  sessionList: { paddingHorizontal: H_PAD, gap: 14 },
  rowCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(0,0,0,0.15)",
    borderRadius: 16,
    padding: 10,
  },
  rowImage: { width: 74, height: 74, borderRadius: 12 },
  rowInfo: { flex: 1, gap: 4 },
  rowTitle: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700", lineHeight: 20 },
  rowMeta: { fontFamily: "Manrope", fontSize: 12.5, fontWeight: "400" },
  rowPlay: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1.2,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 4,
  },
  empty: { fontFamily: "Manrope", fontSize: 14, lineHeight: 21 },

  notFound: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 10 },
  notFoundTitle: { fontFamily: "Manrope", fontSize: 18, fontWeight: "700" },
  notFoundSub: { fontFamily: "Manrope", fontSize: 14, textAlign: "center", lineHeight: 21 },
});
