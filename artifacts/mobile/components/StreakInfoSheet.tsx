import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { CinematicFadeSlide } from "@/components/CinematicFadeSlide";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { MEMBERSHIP_AURORA, STREAK_INFO_COLORS } from "@/constants/colors";

const WHITE = STREAK_INFO_COLORS.foreground;
const GOLD = MEMBERSHIP_AURORA.premium.accent;
const DURATION = 1400;
const BASE_DELAY = 150;
const HERO_IMAGE = require("../assets/images/streak-practice-lotus.jpg");

type IconKind = "current" | "accumulated" | "longest" | "completed";

const STREAK_DEFINITIONS: { id: IconKind; title: string; description: string }[] = [
  {
    id: "current",
    title: "Racha actual",
    description:
      "Días activos de esta semana, de lunes a domingo. Puedes sumar hasta 7, aunque no sean consecutivos.",
  },
  {
    id: "accumulated",
    title: "Racha acumulada",
    description:
      "Actualmente muestra tu mejor racha de días consecutivos, igual que Racha más larga; no representa el total de días practicados.",
  },
  {
    id: "longest",
    title: "Racha más larga",
    description: "Tu mejor secuencia de días activos consecutivos registrada en la app.",
  },
  {
    id: "completed",
    title: "Rachas completadas",
    description: "Semanas de lunes a domingo en las que completaste los 7 días activos.",
  },
];

const FOOTNOTE = "Un día cuenta como activo al escuchar al menos 3 minutos o completar una sesión.";

function StreakIcon({ kind }: { kind: IconKind }) {
  if (kind === "current") return <MaterialCommunityIcons name="spa" size={26} color={WHITE} />;
  if (kind === "accumulated") return (
    <MaskedView maskElement={<MaterialCommunityIcons name="spa" size={26} color={WHITE} />}>
      <MaterialCommunityIcons
        name="spa"
        size={26}
        color={GOLD}
        style={styles.goldenLotus}
      />
    </MaskedView>
  );
  if (kind === "longest") return <MaterialCommunityIcons name="image-filter-hdr" size={26} color={WHITE} />;
  return <Feather name="check-circle" size={24} color={WHITE} />;
}

export function StreakInfoSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { theme } = useSceneTheme();
  const scrollRef = useRef<ScrollView>(null);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (visible) {
      setCycle((c) => c + 1);
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    }
  }, [visible]);

  if (!visible) return null;

  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const artworkHeight = Math.max(width * 1.1, 470);

  return (
    <Modal
      visible
      animationType="slide"
      transparent={false}
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
      testID="streak-info-modal"
    >
      <LinearGradient
        testID="streak-info-background"
        colors={theme.gradient as unknown as [string, string, ...string[]]}
        locations={theme.gradientLocations as unknown as [number, number, ...number[]] | undefined}
        start={theme.gradientStart}
        end={theme.gradientEnd}
        style={styles.root}
      >
        <View style={[styles.artwork, { height: artworkHeight }]} pointerEvents="none">
          <MaskedView
            style={StyleSheet.absoluteFill}
            maskElement={
              <LinearGradient
                colors={[
                  STREAK_INFO_COLORS.imageMaskTransparent,
                  STREAK_INFO_COLORS.imageMaskOpaque,
                  STREAK_INFO_COLORS.imageMaskOpaque,
                  STREAK_INFO_COLORS.imageMaskTransparent,
                ]}
                locations={[0, 0.2, 0.65, 1]}
                style={styles.root}
              />
            }
          >
            <CinematicFadeSlide
              active={visible}
              replayKey={`bg:${cycle}`}
              duration={DURATION * 1.5}
              scaleFrom={1.06}
              translateYFrom={0}
              style={StyleSheet.absoluteFill}
            >
              <Image
                source={HERO_IMAGE}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                contentPosition="bottom"
              />
            </CinematicFadeSlide>
          </MaskedView>
        </View>
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          bounces={false}
          contentInsetAdjustmentBehavior="never"
          automaticallyAdjustContentInsets={false}
          testID="streak-info-scroll"
          contentContainerStyle={{ paddingBottom: bottomPad + 28 }}
        >
          <View testID="streak-info-hero">
            <View style={[styles.header, { paddingTop: topPad + 8 }]}>
              <Pressable
                onPress={onClose}
                style={styles.headerButton}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Volver al perfil"
                testID="streak-info-close"
              >
                <Feather name="arrow-left" size={23} color={WHITE} />
              </Pressable>
            </View>
            <View style={styles.heroText}>
              <CinematicFadeSlide
                active={visible}
                replayKey={`hero:${cycle}`}
                delay={BASE_DELAY}
                duration={DURATION}
              >
                <Text style={styles.subtitle}>
                  Existen diferentes tipos de rachas que te muestran tu compromiso, constancia y
                  evolución en la app.
                </Text>
              </CinematicFadeSlide>
            </View>
          </View>

          <View testID="streak-info-cards" style={styles.cards}>
            {STREAK_DEFINITIONS.map((item, i) => (
              <CinematicFadeSlide
                key={item.id}
                active={visible}
                replayKey={`card:${cycle}`}
                delay={BASE_DELAY + 400 + i * 180}
                duration={DURATION}
              >
                <View testID={`streak-info-card-${item.id}`} style={styles.card} accessible accessibilityLabel={`${item.title}. ${item.description}`}>
                  <View style={styles.iconWrap}>
                    <StreakIcon kind={item.id} />
                  </View>
                  <View style={styles.cardText}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardDesc}>{item.description}</Text>
                  </View>
                </View>
              </CinematicFadeSlide>
            ))}
            <CinematicFadeSlide
              active={visible}
              replayKey={`foot:${cycle}`}
              delay={BASE_DELAY + 400 + 4 * 180}
              duration={DURATION}
            >
              <Text style={styles.footnote}>{FOOTNOTE}</Text>
            </CinematicFadeSlide>
          </View>
        </ScrollView>

      </LinearGradient>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  artwork: { position: "absolute", top: 0, left: 0, right: 0 },
  header: {
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerButton: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    borderWidth: 1,
    borderColor: STREAK_INFO_COLORS.navigationBorder,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: STREAK_INFO_COLORS.navigationBackground,
  },
  heroText: { paddingHorizontal: 28, paddingTop: 21, alignItems: "center" },
  subtitle: {
    fontFamily: "Manrope",
    fontSize: 15,
    lineHeight: 22,
    color: STREAK_INFO_COLORS.subtitle,
    textAlign: "center",
  },
  cards: { paddingHorizontal: 20, marginTop: 50, gap: 14 },
  card: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    padding: 18,
    borderRadius: 22,
    backgroundColor: STREAK_INFO_COLORS.cardBackground,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: STREAK_INFO_COLORS.iconBackground,
  },
  goldenLotus: {
    textShadowColor: `${GOLD}CC`,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 4,
  },
  cardText: { flex: 1, gap: 4 },
  cardTitle: { fontFamily: "Manrope", fontSize: 17, color: WHITE },
  cardDesc: {
    fontFamily: "Manrope",
    fontSize: 14,
    lineHeight: 20,
    color: STREAK_INFO_COLORS.description,
  },
  footnote: {
    fontFamily: "Manrope",
    fontSize: 13,
    lineHeight: 19,
    color: STREAK_INFO_COLORS.footnote,
    textAlign: "center",
    paddingHorizontal: 12,
    paddingTop: 6,
  },
});
