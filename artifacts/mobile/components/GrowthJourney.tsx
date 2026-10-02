import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Asset } from "expo-asset";
import React, { useEffect, useId, useState } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Defs, RadialGradient, Stop } from "react-native-svg";

import { MEMBERSHIP_AURORA, POSITIONED_DAY_GRADIENT } from "@/constants/colors";
import { CinematicFadeSlide } from "@/components/CinematicFadeSlide";
import { ascentLevels, growthLevels, type GrowthLevel } from "@/data/growthLevels";
import { useColors } from "@/hooks/useColors";

export const GROWTH_ROW_HEIGHT = 205;
const PROFILE_INTENTION_IMAGE = require("../assets/images/growth/00-intencion-profile.png");
const SEMILLA_REWARD_CHEST = require("../assets/images/growth/semilla-reward-chest.png");

const GROWTH_COLORS = {
  line: POSITIONED_DAY_GRADIENT[0],
  current: MEMBERSHIP_AURORA.premium.accent,
  muted: "rgba(196,194,222,0.8)",
  inactiveLine: "rgba(174,161,237,0.28)",
} as const;

type Status = "current" | "locked";

// Metro serves bundled images over the development tunnel. Fetching every row
// at once can time out on device, so download and cache them one at a time.
const growthImageLoads = new Map<number, Promise<string>>();
const growthImageUris = new Map<number, string>();
let growthImageQueue: Promise<unknown> = Promise.resolve();

function loadGrowthImage(module: number): Promise<string> {
  const previous = growthImageLoads.get(module);
  if (previous) return previous;

  const load = growthImageQueue.then(async () => {
    const asset = Asset.fromModule(module);
    if (!asset.localUri) {
      for (let attempt = 0; attempt < 2; attempt++) {
        try {
          await asset.downloadAsync();
          break;
        } catch (error) {
          if (attempt === 1) throw error;
        }
      }
    }
    if (!asset.localUri) throw new Error("La imagen no está disponible en el dispositivo");
    growthImageUris.set(module, asset.localUri);
    return asset.localUri;
  });
  growthImageQueue = load.catch(() => undefined);
  growthImageLoads.set(module, load);
  load.catch(() => growthImageLoads.delete(module));
  return load;
}

function GrowthLevelImage({ level, profilePreview = false }: { level: GrowthLevel; profilePreview?: boolean }) {
  const imageModule = profilePreview ? PROFILE_INTENTION_IMAGE : level.image;
  const [localUri, setLocalUri] = useState(() => growthImageUris.get(imageModule) ?? null);

  useEffect(() => {
    if (Platform.OS === "web") return;
    let mounted = true;
    loadGrowthImage(imageModule)
      .then((uri) => {
        if (mounted) setLocalUri(uri);
      })
      .catch((error) => console.warn(`[GrowthJourney] No se pudo descargar ${level.id}: ${String(error)}`));
    return () => { mounted = false; };
  }, [level.id, imageModule]);

  const source = Platform.OS === "web" ? imageModule : localUri ? { uri: localUri } : null;
  return (
    <View
      testID={profilePreview ? "profile-intention-image" : undefined}
      style={styles.imageWrap}
      importantForAccessibility="no"
    >
      {source && (
        <Image
          source={source}
          resizeMode="cover"
          style={styles.levelImage}
          onError={(event) => console.warn(`[GrowthJourney] No se pudo cargar ${level.id}: ${event.nativeEvent.error}`)}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      )}
    </View>
  );
}

export function GrowthLevelPreviewCard({
  onPress,
  embedded = false,
  canonicalVerticalInsets = false,
}: {
  onPress: () => void;
  embedded?: boolean;
  canonicalVerticalInsets?: boolean;
}) {
  const colors = useColors();
  const glowId = `intention-glow-${useId().replace(/:/g, "")}`;
  const level = growthLevels[0];
  const dayLabel = level.startDay === level.endDay
    ? `${level.startDay} días`
    : `${level.startDay}–${level.endDay} días`;

  const dayPill = (
    <PreviewContentEntrance key="intention-days" replayKey="intention-days" delay={420}>
      <View style={[styles.dayPill, canonicalVerticalInsets && styles.canonicalPreviewPill]}>
        {canonicalVerticalInsets && (
          <MaterialCommunityIcons
            name="spa"
            size={12}
            color={GROWTH_COLORS.current}
            style={styles.bloomLotus}
            accessibilityElementsHidden
            importantForAccessibility="no"
          />
        )}
        <Text style={[styles.days, { color: colors.foreground }]}>{dayLabel}</Text>
      </View>
    </PreviewContentEntrance>
  );
  const nameText = (
    <Text
      style={[
        styles.name,
        canonicalVerticalInsets && styles.canonicalPreviewName,
        { color: colors.foreground },
      ]}
    >
      {level.name}
    </Text>
  );
  const name = (
    <PreviewContentEntrance key="intention-name" replayKey="intention-name" delay={660}>
      {canonicalVerticalInsets ? (
        <View testID="profile-intention-title-row" style={styles.canonicalPreviewTitleRow}>
          {nameText}
          <PreviewContentEntrance replayKey="intention-chevron" delay={810}>
            <Feather name="chevron-right" size={18} color={colors.foreground} />
          </PreviewContentEntrance>
        </View>
      ) : nameText}
    </PreviewContentEntrance>
  );
  const story = (
    <PreviewContentEntrance key="intention-story" replayKey="intention-story" delay={810}>
      <Text style={[styles.previewStory, canonicalVerticalInsets && styles.canonicalPreviewStory, { color: colors.mutedForeground }]}>
        {level.story}
      </Text>
    </PreviewContentEntrance>
  );

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.previewCard,
        embedded && styles.embeddedPreviewCard,
        canonicalVerticalInsets && styles.canonicalPreviewVerticalInsets,
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${level.name}, ${dayLabel}. Abrir camino de crecimiento`}
      testID="growth-level-zero-preview"
    >
      <PreviewContentEntrance replayKey="intention-art" delay={420} style={styles.previewArt}>
        {canonicalVerticalInsets && (
          <View pointerEvents="none" style={styles.intentionGlow} importantForAccessibility="no">
            <Svg testID="profile-intention-glow" width="100%" height="100%" viewBox="0 0 160 160">
              <Defs>
                <RadialGradient id={glowId} cx="50%" cy="50%" r="50%">
                  <Stop offset="0%" stopColor={GROWTH_COLORS.current} stopOpacity={0.065} />
                  <Stop offset="45%" stopColor={GROWTH_COLORS.current} stopOpacity={0.025} />
                  <Stop offset="75%" stopColor={GROWTH_COLORS.current} stopOpacity={0.005} />
                  <Stop offset="100%" stopColor={GROWTH_COLORS.current} stopOpacity={0} />
                </RadialGradient>
              </Defs>
              <Circle cx={80} cy={80} r={80} fill={`url(#${glowId})`} />
            </Svg>
          </View>
        )}
        <GrowthLevelImage level={level} profilePreview={canonicalVerticalInsets} />
      </PreviewContentEntrance>
      <View
        style={[
          styles.previewCopy,
          canonicalVerticalInsets && styles.canonicalPreviewCopy,
        ]}
      >
        {dayPill}
        {name}
        {story}
      </View>
      {!canonicalVerticalInsets && (
        <PreviewContentEntrance replayKey="intention-chevron" delay={810}>
          <Feather name="chevron-right" size={18} color={colors.foreground} />
        </PreviewContentEntrance>
      )}
    </Pressable>
  );
}

function PreviewContentEntrance({
  children,
  delay,
  replayKey,
  style,
}: {
  children: React.ReactNode;
  delay: number;
  replayKey: string;
  style?: { width: number; height: number };
}) {
  return (
    <CinematicFadeSlide
      replayKey={replayKey}
      delay={delay}
      duration={1200}
      scaleFrom={0.97}
      translateYFrom={14}
      style={style}
    >
      {children}
    </CinematicFadeSlide>
  );
}

function GrowthRow({
  level,
  hasNext,
  status,
  florecimiento = false,
}: {
  level: GrowthLevel;
  hasNext: boolean;
  status: Status;
  florecimiento?: boolean;
}) {
  const colors = useColors();
  const dayLabel = level.startDay === level.endDay
    ? `${level.startDay} días`
    : `${level.startDay}–${level.endDay} días`;
  return (
    <View
      style={styles.row}
      accessible
      accessibilityLabel={`${level.name}, ${dayLabel} de práctica, ${status === "current" ? "etapa actual" : "por desbloquear"}. ${level.story}${level.id === "semilla" ? " Desbloquea tu cofre de regalos, por desbloquear." : ""}`}
    >
      {hasNext && (
        <View style={styles.lineBase} pointerEvents="none" />
      )}
      <View
        pointerEvents="none"
        style={[
          styles.node,
          {
            borderWidth: status === "current" ? 2 : 0,
            borderColor: GROWTH_COLORS.current,
            backgroundColor: status === "current" ? GROWTH_COLORS.current : GROWTH_COLORS.inactiveLine,
            shadowColor: GROWTH_COLORS.current,
            shadowOpacity: status === "current" ? 0.8 : 0,
          },
        ]}
      />
      <View style={[styles.art, status === "locked" && styles.lockedArt]}>
        <GrowthLevelImage level={level} />
      </View>
      <View style={[styles.copy, status === "locked" && styles.lockedCopy]}>
        <View style={[styles.dayPill, florecimiento && styles.bloomDayPill]}>
          {florecimiento && (
            <MaterialCommunityIcons
              name="spa"
              size={12}
              color={GROWTH_COLORS.current}
              style={styles.bloomLotus}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
          )}
          <Text style={[styles.days, { color: status === "locked" ? GROWTH_COLORS.muted : colors.foreground }]}>
            {dayLabel}
          </Text>
        </View>
        <Text style={[styles.name, { color: status === "locked" ? GROWTH_COLORS.muted : colors.foreground }]}>
          {level.name}
        </Text>
        <Text style={[styles.story, { color: status === "locked" ? GROWTH_COLORS.muted : colors.mutedForeground }]}>
          {level.story}
        </Text>
        {level.id === "semilla" && (
          <View
            testID="semilla-reward"
            style={styles.reward}
            pointerEvents="none"
            accessibilityState={{ disabled: true }}
          >
            <Image
              testID="semilla-reward-chest"
              source={SEMILLA_REWARD_CHEST}
              resizeMode="contain"
              style={styles.rewardChest}
              accessibilityElementsHidden
              importantForAccessibility="no"
            />
            <Text style={[styles.rewardText, { color: GROWTH_COLORS.muted }]}>
              Desbloquea tu cofre de regalos
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

function GrowthStageHeading({
  eyebrow,
  title,
  second,
}: {
  eyebrow: string;
  title: string;
  second?: boolean;
}) {
  const colors = useColors();
  return (
    <View style={[styles.sectionHeading, second && styles.secondStageHeading]}>
      <Text style={styles.sectionEyebrow}>{eyebrow}</Text>
      <Text
        style={[styles.sectionTitle, { color: colors.foreground }]}
        accessibilityRole="header"
      >
        {title}
      </Text>
    </View>
  );
}

export function GrowthJourney() {
  const [ascentExpanded, setAscentExpanded] = useState(false);
  // Visual preview: Intención is the only active level until progression is enabled.

  return (
    <View style={styles.section}>
      <GrowthStageHeading
        eyebrow="PRIMERA ETAPA"
        title="Florecimiento"
      />
      <View style={styles.timeline}>
        {growthLevels.map((level, index) => (
          <GrowthRow
            key={level.id}
            level={level}
            hasNext={index < growthLevels.length - 1}
            status={index === 0 ? "current" : "locked"}
            florecimiento
          />
        ))}
      </View>
      <View style={styles.stageGap} pointerEvents="none" />
      <GrowthStageHeading
        eyebrow="SEGUNDA ETAPA"
        title="El ascenso"
        second
      />
      <Pressable
        onPress={() => setAscentExpanded((expanded) => !expanded)}
        style={styles.ascentToggle}
        accessibilityRole="button"
        accessibilityLabel={ascentExpanded ? "Ocultar niveles de El ascenso" : "Próximamente, mostrar niveles de El ascenso"}
        accessibilityState={{ expanded: ascentExpanded }}
        testID="growth-ascent-toggle"
      >
        <Text style={styles.ascentToggleText}>{ascentExpanded ? "Ocultar niveles" : "Próximamente"}</Text>
        <Feather name={ascentExpanded ? "chevron-up" : "chevron-down"} size={16} color={GROWTH_COLORS.line} />
      </Pressable>
      {ascentExpanded && (
        <View style={styles.timeline}>
          {ascentLevels.map((level, index) => (
            <GrowthRow
              key={level.id}
              level={level}
              hasNext={index < ascentLevels.length - 1}
              status="locked"
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  previewCard: {
    marginHorizontal: 16,
    paddingHorizontal: 20,
    paddingTop: 17,
    paddingBottom: 15,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.22)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  previewArt: { width: 100, height: 100 },
  intentionGlow: { position: "absolute", width: 130, height: 130, left: -15, top: -15 },
  embeddedPreviewCard: { marginHorizontal: 0 },
  canonicalPreviewVerticalInsets: { paddingTop: 16, paddingBottom: 16, marginVertical: 2, alignItems: "flex-start" },
  canonicalPreviewCopy: { minHeight: 100, alignSelf: "stretch", justifyContent: "space-between" },
  canonicalPreviewName: { flex: 1, marginBottom: 0, fontSize: 18, lineHeight: 23 },
  canonicalPreviewPill: { marginBottom: 0, flexDirection: "row", alignItems: "center", gap: 4, transform: [{ translateY: 2 }] },
  canonicalPreviewStory: { transform: [{ translateY: -2 }] },
  canonicalPreviewTitleRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  previewCopy: { flex: 1, minWidth: 0 },
  previewStory: { fontFamily: "Manrope", fontSize: 11, lineHeight: 16 },
  section: {
    marginHorizontal: 16,
    paddingBottom: 12,
  },
  sectionHeading: { alignItems: "center", marginBottom: 8 },
  secondStageHeading: { marginBottom: 0 },
  stageGap: { height: 73 },
  ascentToggle: {
    alignSelf: "center",
    marginTop: 18,
    marginBottom: 10,
    paddingHorizontal: 18,
    height: 36,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0,0,0,0.22)",
    borderWidth: 1,
    borderColor: GROWTH_COLORS.inactiveLine,
  },
  ascentToggleText: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "600",
    color: GROWTH_COLORS.line,
  },
  sectionEyebrow: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: GROWTH_COLORS.line,
    marginBottom: 5,
  },
  sectionTitle: { fontFamily: "Manrope", fontSize: 23, fontWeight: "700", lineHeight: 30 },
  timeline: { position: "relative" },
  row: { height: GROWTH_ROW_HEIGHT, position: "relative", justifyContent: "center" },
  lineBase: {
    position: "absolute",
    left: 9,
    top: GROWTH_ROW_HEIGHT / 2,
    width: 2,
    height: GROWTH_ROW_HEIGHT,
    backgroundColor: GROWTH_COLORS.inactiveLine,
  },
  node: {
    position: "absolute",
    left: 1,
    top: GROWTH_ROW_HEIGHT / 2 - 8,
    width: 18,
    height: 18,
    borderRadius: 9,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 3,
    zIndex: 2,
  },
  art: {
    position: "absolute",
    left: 25,
    top: 34,
    width: 133,
    height: 133,
  },
  lockedArt: { opacity: 0.44 },
  imageWrap: { width: "100%", height: "100%", borderRadius: 67, overflow: "hidden" },
  levelImage: { width: "100%", height: "100%" },
  copy: {
    marginLeft: 166,
    flex: 1,
    justifyContent: "center",
    paddingRight: 1,
  },
  lockedCopy: { opacity: 0.55 },
  reward: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 12 },
  rewardChest: { width: 44, height: 44, opacity: 0.8 },
  rewardText: { flex: 1, fontFamily: "Manrope", fontSize: 11, lineHeight: 16 },
  name: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700", lineHeight: 20, marginBottom: 6 },
  dayPill: {
    alignSelf: "flex-start",
    backgroundColor: "rgba(151,128,231,0.20)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    borderRadius: 12,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginBottom: 7,
  },
  days: { fontFamily: "Manrope", fontSize: 10, fontWeight: "600" },
  bloomDayPill: { paddingVertical: 5.5, flexDirection: "row", alignItems: "center", gap: 4 },
  bloomLotus: {
    lineHeight: 12,
    includeFontPadding: false,
  },
  story: { fontFamily: "Manrope", fontSize: 11, lineHeight: 16 },
});