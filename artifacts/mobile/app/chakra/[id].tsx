import { Feather } from "@expo/vector-icons";
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
const W = Dimensions.get("window").width;
// Cards en 2 columnas — mismas medidas que la grilla de sonidos binaurales de Dormir
const CARD_W = (W - H_PAD * 2 - 14) / 2;

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

        {sessions.length === 0 ? (
          <Text style={[styles.empty, { color: colors.mutedForeground, paddingHorizontal: H_PAD }]}>
            Todavía no hay sesiones para este chakra.
          </Text>
        ) : (
          <View style={styles.sessionGrid}>
            {sessions.map((session) => (
              <Pressable
                key={session.id}
                onPress={() => handleSessionPress(session)}
                style={({ pressed }) => [{ width: CARD_W, opacity: pressed ? 0.85 : 1 }]}
              >
                <View style={[styles.cardImageWrap, { borderRadius: colors.radius - 4 }]}>
                  <Image source={session.image} style={styles.cardImage} contentFit="cover" cachePolicy="memory-disk" />
                </View>
                <Text style={styles.cardLabel} numberOfLines={2}>
                  {session.title}
                </Text>
              </Pressable>
            ))}
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

  name: { fontFamily: "Manrope", fontSize: 22, fontWeight: "700", letterSpacing: 0.3 },
  tagLabel: { fontFamily: "Manrope", fontSize: 13, fontWeight: "700", letterSpacing: 0.4, marginTop: 3 },
  description: {
    fontFamily: "Manrope",
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
    marginTop: 14,
  },

  /* Grilla 2 columnas — mismo estilo que sonidos binaurales de Dormir */
  sessionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    paddingHorizontal: H_PAD,
    rowGap: 35,
    marginBottom: 6,
  },
  cardImageWrap: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 17,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
  },
  cardImage: { width: "100%", height: "100%" },
  cardLabel: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    marginTop: 8,
    paddingHorizontal: 2,
    color: "#FBFBFB",
  },
  empty: { fontFamily: "Manrope", fontSize: 14, lineHeight: 21 },

  notFound: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, gap: 10 },
  notFoundTitle: { fontFamily: "Manrope", fontSize: 18, fontWeight: "700" },
  notFoundSub: { fontFamily: "Manrope", fontSize: 14, textAlign: "center", lineHeight: 21 },
});
