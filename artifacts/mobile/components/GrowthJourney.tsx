import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Asset } from "expo-asset";
import React, { useEffect, useState } from "react";
import { Image, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import { CLOUDY_GROWTH_ASCENT_TOGGLE_COLOR, CLOUDY_GROWTH_DAY_PILL_BACKGROUND, CLOUDY_GROWTH_STAGE_LABEL_COLOR, MEMBERSHIP_AURORA, POSITIONED_DAY_GRADIENT } from "@/constants/colors";
import { CinematicFadeSlide } from "@/components/CinematicFadeSlide";
import { getPositionedDayGradient } from "@/components/StreakWeekRow";
import { ascentLevels, growthLevels, type GrowthLevel } from "@/data/growthLevels";
import { useColors } from "@/hooks/useColors";
import { useSceneTheme } from "@/context/SceneThemeContext";

export const GROWTH_ROW_HEIGHT = 205;
const GROWTH_STAGE_ICON_SIZE = 133;
const REWARD_LEVEL_IDS = new Set(["semilla", "crecimiento", "vegetacion", "expansion"]);

const GROWTH_COLORS = {
  line: POSITIONED_DAY_GRADIENT[0],
  current: MEMBERSHIP_AURORA.premium.accent,
  muted: "rgba(196,194,222,0.8)",
  inactiveLine: "rgba(174,161,237,0.28)",
  activeNode: "rgb(174,161,237)",
} as const;

type Status = "current" | "locked";

/** Intención remains the current level until functional progression is enabled. */
export function GrowthCurrentStagePill() {
  const colors = useColors();
  const { theme } = useSceneTheme();
  return (
    <View
      testID="profile-growth-stage-pill"
      style={[
        styles.dayPill,
        styles.bloomDayPill,
        styles.timelineDayPill,
        styles.timelineBloomDayPill,
        { marginBottom: 0, marginTop: 2 },
        theme.id === "cloudy" && { backgroundColor: CLOUDY_GROWTH_DAY_PILL_BACKGROUND },
      ]}
    >
      <Text style={[styles.days, { color: colors.foreground }]}>{growthLevels[0].name}</Text>
    </View>
  );
}

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

export function GrowthLevelImage({ level, profilePreview = false, dimmed = false, size, height, sourceModule }: { level: GrowthLevel; profilePreview?: boolean; dimmed?: boolean; size?: number; height?: number; sourceModule?: number }) {
  const imageModule = sourceModule ?? level.image;
  const fadedStage = sourceModule === undefined && !level.id.startsWith("ascenso-");
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
      style={[styles.imageWrap, sourceModule === undefined && level.id.startsWith("ascenso-") && styles.stageIconSurface, profilePreview && styles.profileImageWrap, size !== undefined && { width: size, height: height ?? size, borderRadius: 0 }]}
      importantForAccessibility="no"
    >
      {source && (
        <Image
          source={source}
          resizeMode={sourceModule !== undefined ? "cover" : "contain"}
          style={[styles.levelImage, fadedStage && styles.fadedStageImage, dimmed && styles.lockedArt]}
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
  backgroundColor,
  titleFontSize,
  sectionTitle,
}: {
  onPress: () => void;
  embedded?: boolean;
  canonicalVerticalInsets?: boolean;
  backgroundColor?: string;
  titleFontSize?: number;
  sectionTitle?: string;
}) {
  const colors = useColors();
  const { theme } = useSceneTheme();
  const level = growthLevels[0];
  const dayLabel = level.startDay === level.endDay
    ? `${level.startDay} días`
    : `${level.startDay}–${level.endDay} días`;

  const dayPill = (
    <PreviewContentEntrance key="intention-days" replayKey="intention-days" delay={420}>
      <View
        testID="intention-preview-day-pill"
        style={[
          styles.dayPill,
          canonicalVerticalInsets && styles.canonicalPreviewPill,
          canonicalVerticalInsets && theme.id === "cloudy" && { backgroundColor: "rgba(0,0,0,0.16)" },
        ]}
      >
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
        titleFontSize !== undefined && { fontSize: titleFontSize },
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
      <Text testID={sectionTitle ? "profile-intention-description" : undefined} style={[styles.previewStory, sectionTitle && styles.titledPreviewStory, { color: colors.mutedForeground }]}>
        {level.story}
      </Text>
    </PreviewContentEntrance>
  );

  const previewContent = (
    <>
      <PreviewContentEntrance replayKey="intention-art" delay={420} style={[styles.previewArt, sectionTitle && styles.profilePreviewArt]}>
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
            {!sectionTitle && dayPill}
            {name}
          </View>
        ) : (
          <>
            {!sectionTitle && dayPill}
            {name}
          </>
        )}
        {story}
      </View>
      {!sectionTitle && <PreviewContentEntrance replayKey="intention-chevron" delay={810}>
        <Feather
          testID={canonicalVerticalInsets ? "profile-intention-chevron" : undefined}
          name="chevron-right"
          size={18}
          color={colors.foreground}
        />
      </PreviewContentEntrance>}
    </>
  );

  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.previewCard,
        embedded && styles.embeddedPreviewCard,
        canonicalVerticalInsets && styles.canonicalPreviewVerticalInsets,
        sectionTitle && styles.titledPreviewCard,
        backgroundColor !== undefined && { backgroundColor },
      ]}
      accessibilityRole="button"
      accessibilityLabel={`${sectionTitle ? `${sectionTitle}. ` : ""}${level.name}, ${dayLabel}. Abrir camino de crecimiento`}
      testID="growth-level-zero-preview"
    >
      {sectionTitle ? (
        <>
          <View style={styles.previewSectionHeader}>
            <Text testID="profile-growth-section-title" accessibilityRole="header" style={[styles.previewSectionTitle, { color: colors.foreground }]}>
              {sectionTitle}
            </Text>
            <Pressable testID="profile-growth-view-all" onPress={onPress} hitSlop={10} accessibilityRole="button" accessibilityLabel="Ver todo Tu camino">
              <Text style={[styles.previewViewAll, { color: colors.foreground }]}>Ver todo</Text>
            </Pressable>
          </View>
          <View style={styles.previewContentRow}>{previewContent}</View>
        </>
      ) : previewContent}
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

function RewardLock({ levelId, color }: { levelId: string; color: string }) {
  return (
    <MaterialCommunityIcons
      testID={`${levelId}-reward-lock`}
      name="lock"
      size={16}
      color={color}
      style={styles.avatarRewardLock}
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}

function GrowthRow({
  level,
  status,
  florecimiento = false,
  onPress,
}: {
  level: GrowthLevel;
  status: Status;
  florecimiento?: boolean;
  onPress?: () => void;
}) {
  const colors = useColors();
  const { theme } = useSceneTheme();
  const dayLabel = level.startDay === level.endDay
    ? `${level.startDay} días`
    : `${level.startDay}–${level.endDay} días`;
  const reward = REWARD_LEVEL_IDS.has(level.id);
  const nodeColor = theme.id === "cloudy" ? "#B5EFFF" : GROWTH_COLORS.activeNode;
  const inactiveNodeColor = theme.id === "cloudy" ? "rgba(181,239,255,0.28)" : GROWTH_COLORS.inactiveLine;
  const content = (
    <View
      style={[styles.row, reward && styles.rewardRow]}
      accessible={!onPress}
      accessibilityLabel={`${level.name}, ${dayLabel} de práctica, ${status === "current" ? "etapa actual" : "por desbloquear"}. ${level.story}${REWARD_LEVEL_IDS.has(level.id) ? " Desbloquea 50 avatares nuevos, por desbloquear." : ""}`}
    >
      <View
        testID={`${level.id}-stage-node`}
        pointerEvents="none"
        style={[
          styles.node,
          {
            borderWidth: status === "current" ? 2 : 0,
            borderColor: nodeColor,
            backgroundColor: status === "current" ? nodeColor : inactiveNodeColor,
            shadowColor: nodeColor,
            shadowOpacity: status === "current" ? 0.8 : 0,
          },
        ]}
      />
      <View testID={`${level.id}-stage-art`} style={[styles.art, florecimiento && styles.bloomArt]}>
        <GrowthLevelImage level={level} dimmed={status === "locked"} />
      </View>
      <View testID={`${level.id}-copy`} style={[styles.copy, reward && styles.rewardCopy]}>
        <View style={status === "locked" && styles.lockedCopy}>
        <View
          testID={`${level.id}-day-pill`}
          style={[
            styles.dayPill,
            florecimiento && styles.bloomDayPill,
            styles.timelineDayPill,
            florecimiento && styles.timelineBloomDayPill,
            theme.id === "cloudy" && { backgroundColor: CLOUDY_GROWTH_DAY_PILL_BACKGROUND },
          ]}
        >
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
        <Text testID={`${level.id}-stage-title`} style={[styles.name, styles.timelineTextOffset, { color: status === "locked" ? GROWTH_COLORS.muted : colors.foreground }]}>
          {level.name}
        </Text>
        <Text testID={`${level.id}-stage-description`} style={[styles.story, styles.timelineTextOffset, { color: status === "locked" ? GROWTH_COLORS.muted : colors.mutedForeground }]}>
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
          <View testID={`${level.id}-reward-content`} style={[styles.rewardContent, styles.avatarRewardContent]}>
          <RewardLock levelId={level.id} color={getPositionedDayGradient(theme.gradient)[0]} />
          <Text
            style={[styles.rewardText, { color: status === "locked" ? GROWTH_COLORS.muted : colors.mutedForeground }]}
            numberOfLines={1}
            adjustsFontSizeToFit
            minimumFontScale={0.6}
            ellipsizeMode="tail"
          >
            {"Desbloquea 50 avatares nuevos"}
          </Text>
          </View>
        </View>
      )}
      </View>
    </View>
  );
  return onPress ? (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Ver detalle de ${level.name}`}
      testID={`growth-stage-${level.id}-open`}
    >
      {content}
    </Pressable>
  ) : content;
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
  const { theme } = useSceneTheme();
  return (
    <View style={[styles.sectionHeading, second && styles.secondStageHeading]}>
      <Text style={[styles.sectionEyebrow, theme.id === "cloudy" && { color: CLOUDY_GROWTH_STAGE_LABEL_COLOR }]}>{eyebrow}</Text>
      <Text
        style={[styles.sectionTitle, { color: colors.foreground }]}
        accessibilityRole="header"
      >
        {title}
      </Text>
    </View>
  );
}

function GrowthTimeline({ children }: { children: React.ReactNode }) {
  const { theme } = useSceneTheme();
  const rows = React.Children.toArray(children);
  return (
    <View style={styles.timeline}>
      <View style={styles.timeline}>
        {rows.length > 1 && (
          <View testID="growth-timeline-line" style={[styles.lineBase, theme.id === "cloudy" && { backgroundColor: "rgba(181,239,255,0.28)" }]} pointerEvents="none" />
        )}
        {rows.slice(0, -1)}
      </View>
      {rows[rows.length - 1]}
    </View>
  );
}

export function GrowthJourney({ onIntentionPress }: { onIntentionPress?: () => void } = {}) {
  const [ascentExpanded, setAscentExpanded] = useState(false);
  const { theme } = useSceneTheme();
  const ascentToggleColor = theme.id === "cloudy" ? CLOUDY_GROWTH_ASCENT_TOGGLE_COLOR : GROWTH_COLORS.line;
  // Visual preview: Intención is the only active level until progression is enabled.

  return (
    <View style={styles.section}>
      <GrowthStageHeading
        eyebrow="PRIMERA ETAPA"
        title="Florecimiento"
      />
      <GrowthTimeline>
        {growthLevels.map((level, index) => (
          <GrowthRow
            key={level.id}
            level={level}
            status={index === 0 ? "current" : "locked"}
            florecimiento
            onPress={level.id === "intencion" ? onIntentionPress : undefined}
          />
        ))}
      </GrowthTimeline>
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
        <Text style={[styles.ascentToggleText, { color: ascentToggleColor }]}>{ascentExpanded ? "Ocultar niveles" : "Próximamente"}</Text>
        <Feather name={ascentExpanded ? "chevron-up" : "chevron-down"} size={16} color={ascentToggleColor} />
      </Pressable>
      {ascentExpanded && (
        <GrowthTimeline>
          {ascentLevels.map((level) => (
            <GrowthRow
              key={level.id}
              level={level}
              status="locked"
            />
          ))}
        </GrowthTimeline>
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
    backgroundColor: "rgba(0,0,0,0.16)",
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  previewArt: { width: 100, height: 100 },
  profilePreviewArt: { width: 96, height: 96 },
  embeddedPreviewCard: { marginHorizontal: 0 },
  titledPreviewCard: { flexDirection: "column", alignItems: "stretch", paddingTop: 18, paddingBottom: 17 },
  previewSectionHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", minHeight: 25 },
  previewSectionTitle: { fontFamily: "Manrope", fontSize: 16, fontWeight: "600" },
  previewViewAll: { fontFamily: "Manrope", fontSize: 13, fontWeight: "400" },
  titledPreviewStory: { transform: [{ translateY: -3 }] },
  previewContentRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  canonicalPreviewVerticalInsets: { paddingTop: 20, paddingBottom: 20, marginVertical: 2, alignItems: "center" },
  canonicalPreviewCopy: { minHeight: 100, justifyContent: "center", gap: 10 },
  canonicalPreviewName: { marginBottom: 0, fontSize: 18, lineHeight: 23 },
  canonicalPreviewPill: { marginBottom: 0, alignSelf: "center", flexDirection: "row", alignItems: "center", gap: 4 },
  canonicalPreviewTitleRow: { flexDirection: "column", alignItems: "flex-start", gap: 10 },
  previewCopy: { flex: 1, minWidth: 0 },
  previewStory: { fontFamily: "Manrope", fontSize: 11, lineHeight: 16 },
  section: {
    marginHorizontal: 16,
    marginTop: 15,
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
    backgroundColor: "rgba(0,0,0,0.16)",
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
    // The track contains all but the last row. Extend to that row's node center.
    top: GROWTH_ROW_HEIGHT / 2 + 1,
    bottom: -(GROWTH_ROW_HEIGHT / 2 + 1),
    width: 2,
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
    left: 40,
    top: 34,
    width: GROWTH_STAGE_ICON_SIZE,
    height: GROWTH_STAGE_ICON_SIZE,
  },
  lockedArt: { opacity: 0.44 },
  bloomArt: { width: GROWTH_STAGE_ICON_SIZE + 4, height: GROWTH_STAGE_ICON_SIZE + 4, left: 38, top: 32 },
  imageWrap: { width: "100%", height: "100%", borderRadius: 67, overflow: "hidden" },
  stageIconSurface: { backgroundColor: "rgba(255,255,255,0.07)" },
  fadedStageImage: { transform: [{ scale: 0.9 }] },
  profileImageWrap: { borderRadius: 67 },
  levelImage: { width: "100%", height: "100%" },
  copy: {
    marginLeft: 196,
    flex: 1,
    justifyContent: "center",
    paddingRight: 1,
  },
  lockedCopy: { opacity: 0.55 },
  rewardRow: { height: "auto", minHeight: GROWTH_ROW_HEIGHT, justifyContent: "flex-start", paddingBottom: 20 },
  rewardCopy: { flex: 0, paddingTop: 34 },
  reward: {
    alignSelf: "stretch",
    transform: [{ translateY: -4 }],
    marginTop: 2,
    minHeight: 50,
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  rewardContent: { flexDirection: "row", alignItems: "center", maxWidth: "100%", flexShrink: 1, paddingLeft: 3, gap: 6 },
  avatarRewardContent: { paddingLeft: 0, flexWrap: "nowrap" },
  avatarRewardLock: { width: 16, height: 16, lineHeight: 16, includeFontPadding: false, flexShrink: 0 },
  rewardText: { flexShrink: 1, minWidth: 0, fontFamily: "Manrope", fontSize: 11, lineHeight: 16 },
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
  // Keep the copy block's total height unchanged when shortening the pill.
  timelineDayPill: { paddingVertical: 2.5, marginBottom: 10 },
  timelineBloomDayPill: { paddingVertical: 4 },
  timelineTextOffset: { transform: [{ translateY: 2 }] },
  bloomLotus: {
    lineHeight: 12,
    includeFontPadding: false,
  },
  story: { fontFamily: "Manrope", fontSize: 11, lineHeight: 16 },
});