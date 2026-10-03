import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Asset } from "expo-asset";
import React, { useEffect, useState } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { MEMBERSHIP_AURORA, POSITIONED_DAY_GRADIENT } from "@/constants/colors";
import { CinematicFadeSlide } from "@/components/CinematicFadeSlide";
import { ascentLevels, growthLevels, type GrowthLevel } from "@/data/growthLevels";
import { useColors } from "@/hooks/useColors";

export const GROWTH_ROW_HEIGHT = 205;
const PROFILE_INTENTION_IMAGE = require("../assets/images/growth/00-intencion-profile-square.png");
const REWARD_LEVEL_IDS = new Set(["semilla", "crecimiento", "vegetacion", "expansion"]);

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
      style={[styles.imageWrap, profilePreview && styles.profileImageWrap]}
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
      {nameText}
    </PreviewContentEntrance>
  );
  const story = (
    <PreviewContentEntrance key="intention-story" replayKey="intention-story" delay={810}>
      <Text style={[styles.previewStory, { color: colors.mutedForeground }]}>
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
        <GrowthLevelImage level={level} profilePreview={canonicalVerticalInsets} />
      </PreviewContentEntrance>
      <View
        style={[
          styles.previewCopy,
          canonicalVerticalInsets && styles.canonicalPreviewCopy,
        ]}
      >
        {canonicalVerticalInsets ? (
          <View testID="profile-intention-title-row" style={styles.canonicalPreviewTitleRow}>
            {dayPill}
            {name}
          </View>
        ) : (
          <>
            {dayPill}
            {name}
          </>
        )}
        {story}
      </View>
      <PreviewContentEntrance replayKey="intention-chevron" delay={810}>
        <Feather
          testID={canonicalVerticalInsets ? "profile-intention-chevron" : undefined}
          name="chevron-right"
          size={18}
          color={colors.foreground}
        />
      </PreviewContentEntrance>
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

const REWARD_AVATAR = require("../assets/images/growth/reward-avatar-lotus.png");

function RewardAvatar({ module, levelId }: { module: number; levelId: string }) {
  const [localUri, setLocalUri] = useState(() => growthImageUris.get(module) ?? null);
  useEffect(() => {
    if (Platform.OS === "web") return;
    let mounted = true;
    loadGrowthImage(module)
      .then((uri) => { if (mounted) setLocalUri(uri); })
      .catch((error) => console.warn(`[GrowthJourney] No se pudo cargar el avatar de recompensa: ${String(error)}`));
    return () => { mounted = false; };
  }, [module]);
  const source = Platform.OS === "web" ? module : localUri ? { uri: localUri } : null;
  return (
    <View testID={`${levelId}-reward-avatar`} style={styles.rewardAvatar}>
      {source && (
        <Image
          source={source}
          resizeMode="cover"
          style={styles.levelImage}
          accessibilityElementsHidden
          importantForAccessibility="no"
          onError={(event) => console.warn(`[GrowthJourney] No se pudo mostrar el avatar de recompensa: ${event.nativeEvent.error}`)}
        />
      )}
      <View testID={`${levelId}-reward-overlay`} pointerEvents="none" style={styles.rewardAvatarOverlay}>
        <MaterialCommunityIcons
          testID={`${levelId}-reward-lock`}
          name="lock"
          size={13}
          color={GROWTH_COLORS.muted}
          style={styles.rewardLock}
          accessibilityElementsHidden
          importantForAccessibility="no"
        />
      </View>
    </View>
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
  const reward = REWARD_LEVEL_IDS.has(level.id);
  return (
    <View
      style={[styles.row, reward && styles.rewardRow]}
      accessible
      accessibilityLabel={`${level.name}, ${dayLabel} de práctica, ${status === "current" ? "etapa actual" : "por desbloquear"}. ${level.story}${REWARD_LEVEL_IDS.has(level.id) ? " Desbloquea 50 avatares nuevos, por desbloquear." : ""}`}
    >
      {hasNext && (
        <View style={[styles.lineBase, reward && styles.rewardLine]} pointerEvents="none" />
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
      <View testID={`${level.id}-copy`} style={[styles.copy, reward && styles.rewardCopy]}>
        <View style={status === "locked" && styles.lockedCopy}>
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
        </View>
      {reward && (
        <View
          testID={`${level.id}-reward`}
          style={[styles.reward, status === "locked" && styles.lockedCopy]}
          pointerEvents="none"
          accessibilityState={{ disabled: true }}
        >
          <RewardAvatar module={REWARD_AVATAR} levelId={level.id} />
          <Text
            style={[styles.rewardText, { color: status === "locked" ? GROWTH_COLORS.muted : colors.mutedForeground }]}
            numberOfLines={2}
            adjustsFontSizeToFit
            minimumFontScale={0.75}
            ellipsizeMode="tail"
          >
            Desbloquea 50 avatares nuevos
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
  embeddedPreviewCard: { marginHorizontal: 0 },
  canonicalPreviewVerticalInsets: { paddingTop: 16, paddingBottom: 16, marginVertical: 2, alignItems: "center" },
  canonicalPreviewCopy: { minHeight: 100, justifyContent: "center", gap: 6 },
  canonicalPreviewName: { marginBottom: 0, fontSize: 18, lineHeight: 23 },
  canonicalPreviewPill: { marginBottom: 0, alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 4 },
  canonicalPreviewTitleRow: { flexDirection: "column", alignItems: "flex-start", gap: 6 },
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
  profileImageWrap: { borderRadius: 18 },
  levelImage: { width: "100%", height: "100%" },
  copy: {
    marginLeft: 166,
    flex: 1,
    justifyContent: "center",
    paddingRight: 1,
  },
  lockedCopy: { opacity: 0.55 },
  rewardRow: { height: "auto", minHeight: GROWTH_ROW_HEIGHT, justifyContent: "flex-start", paddingBottom: 20 },
  rewardLine: { height: "100%" },
  rewardCopy: { flex: 0, paddingTop: 34 },
  reward: {
    width: "100%",
    alignSelf: "stretch",
    marginTop: 12,
    minHeight: 50,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  rewardLock: { position: "absolute", left: 3, top: 3, width: 13, height: 13 },
  rewardText: { flex: 1, flexShrink: 1, minWidth: 0, fontFamily: "Manrope", fontSize: 11, lineHeight: 16 },
  rewardAvatarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.22)",
    alignItems: "center",
    justifyContent: "center",
  },
  rewardAvatar: {
    width: 35,
    height: 35,
    flexShrink: 0,
    borderRadius: 17.5,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: "rgba(214,176,92,0.1)",
    backgroundColor: "rgba(0,0,0,0.3)",
  },
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