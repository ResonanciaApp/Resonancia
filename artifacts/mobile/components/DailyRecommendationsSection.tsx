import React from "react";
import { getCardTextBelowColor } from "@/constants/colors";
import {
  Animated,
  StyleProp,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { CategoryAtmosphericCard } from "@/components/CategoryAtmosphericCard";
import { CinematicFadeSlide } from "@/components/CinematicFadeSlide";
import { usePressScaleAnimation } from "@/hooks/usePressScaleAnimation";
import { SessionRow } from "@/components/SessionRow";
import type { Session } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { isIndigo2ThemeId } from "@/config/scene-themes";

type Props = {
  sessions: Session[];
  dayKey?: string;
  style?: StyleProp<ViewStyle>;
  inicio3Compact?: boolean;
  onRefreshRecommendations?: () => void;
};

const CARD_FADE_DURATION = 420;
const CARD_FADE_STAGGER = 90;

const WEEKDAYS = [
  "domingo",
  "lunes",
  "martes",
  "miércoles",
  "jueves",
  "viernes",
  "sábado",
];

const MONTHS = [
  "ene.",
  "feb.",
  "mar.",
  "abr.",
  "may.",
  "jun.",
  "jul.",
  "ago.",
  "sep.",
  "oct.",
  "nov.",
  "dic.",
];

function formatDailyDate(dayKey?: string): string {
  const parts = dayKey?.split("-").map(Number);
  const date = parts?.length === 3
    ? new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1)
    : new Date();
  return `${WEEKDAYS[date.getDay()]}, ${date.getDate()} ${MONTHS[date.getMonth()]}`;
}

export function DailyRecommendationsSection({
  sessions,
  dayKey,
  style,
  inicio3Compact = false,
  onRefreshRecommendations,
}: Props) {
  const colors = useColors();
  const { theme, activeSceneId } = useSceneTheme();
  const cardTextBelow = getCardTextBelowColor(activeSceneId);
  const recommendations = sessions.slice(0, 3);
  const themeAccent = theme.accent ?? colors.accent;
  const [animationCycle, setAnimationCycle] = React.useState(0);
  const { scale: buttonScale, animatePress: animateButtonPress } = usePressScaleAnimation();

  const refreshRecommendations = React.useCallback(() => {
    if (!onRefreshRecommendations) return;
    onRefreshRecommendations();
    setAnimationCycle((cycle) => cycle + 1);
  }, [onRefreshRecommendations]);

  if (recommendations.length < 3) return null;

  return (
    <View style={[styles.section, style]} testID="inicio2-daily-recommendations">
      <View style={[styles.headerRow, inicio3Compact && styles.inicio3HeaderShift]}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Recomendaciones diarias
        </Text>
        <Text style={[styles.date, inicio3Compact && styles.inicio3DateLowered, { color: isIndigo2ThemeId(theme.id) ? colors.accent : colors.mutedForeground }]}>
          {formatDailyDate(dayKey)}
        </Text>
      </View>

      <View
        style={[
          styles.recommendationsList,
          inicio3Compact && styles.inicio3RecommendationsList,
        ]}
      >
        {recommendations.map((session, index) => (
          <View key={session.id} style={styles.recommendationGroup}>
            <CinematicFadeSlide
              replayKey={`${animationCycle}:${session.id}`}
              delay={index * CARD_FADE_STAGGER}
              duration={CARD_FADE_DURATION}
              translateYFrom={14}
              scaleFrom={0.97}
            >
              <CategoryAtmosphericCard
                categoryId={session.categoryId}
                style={[
                  styles.recommendationCard,
                  inicio3Compact && styles.inicio3RecommendationCard,
                ]}
              >
                <SessionRow
                  session={session}
                  imageSize={(inicio3Compact ? 81.9 * 1.2 : 103.7) * 0.85}
                  imageOffsetX={inicio3Compact ? 0 : -4}
                  metaText={`${session.categoryLabel} · ${session.durationLabel}`}
                  metaTextColor={cardTextBelow}
                  metaFontSize={10}
                  showChevron
                  titleFontSize={inicio3Compact ? 16.5 : undefined}
                  titleFontWeight={inicio3Compact ? "600" : undefined}
                  authorColor={cardTextBelow}
                  authorFontSize={isIndigo2ThemeId(theme.id) ? 10 : 11}
                  chevronColor={
                    inicio3Compact
                      ? "#F9F9F9"
                      : isIndigo2ThemeId(theme.id)
                        ? themeAccent
                        : undefined
                  }
                  chevronOffsetX={-1}
                  style={[styles.row, inicio3Compact && styles.inicio3Row]}
                />
              </CategoryAtmosphericCard>
            </CinematicFadeSlide>
            {inicio3Compact && index < recommendations.length - 1 ? (
              <View style={styles.inicio3CardDivider} />
            ) : null}
          </View>
        ))}
        {onRefreshRecommendations ? (
          <Animated.View style={{ transform: [{ translateY: -3 }, { scale: buttonScale }] }}>
            <Pressable
              onPress={refreshRecommendations}
              onPressIn={() => animateButtonPress(true)}
              onPressOut={() => animateButtonPress(false)}
              accessibilityRole="button"
              accessibilityLabel="Actualizar recomendaciones"
              style={({ pressed }) => [
                styles.refreshButton,
                inicio3Compact && styles.inicio3RefreshButton,
                { opacity: pressed ? 0.78 : 1 },
              ]}
            >
              <Text style={styles.refreshButtonText}>Actualizar recomendaciones</Text>
            </Pressable>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 53,
  },
  headerRow: {
    marginBottom: 27,
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    flexShrink: 1,
    fontFamily: "Manrope",
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  date: {
    position: "absolute",
    top: 24,
    left: 0,
    flexShrink: 0,
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "400",
  },
  inicio3HeaderShift: {
    marginBottom: 32,
    transform: [{ translateY: -4 }],
  },
  inicio3DateLowered: {
    top: 29,
  },
  recommendationsList: {
    gap: 12,
  },
  inicio3RecommendationsList: {
    gap: 0,
    paddingTop: 8,
    paddingBottom: 8,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.04)",
    borderRadius: 16,
    overflow: "hidden",
    transform: [{ translateY: 7 }],
  },
  recommendationGroup: {
    transform: [{ translateY: 3 }],
  },
  recommendationCard: {
    backgroundColor: "rgba(0,0,0,0.16)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    transform: [{ translateX: 1 }],
  },
  inicio3RecommendationCard: {
    borderRadius: 16,
    backgroundColor: "transparent",
    borderWidth: 0,
    borderColor: "transparent",
  },
  inicio3CardDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: 11,
    marginVertical: 3,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  refreshButton: {
    marginTop: 16,
    marginHorizontal: 5,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 20,
    borderWidth: 0,
    borderColor: "transparent",
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  inicio3RefreshButton: {
    marginHorizontal: 16,
    marginBottom: 3,
  },
  refreshButtonText: {
    fontFamily: "Manrope",
    fontSize: 14,
    color: "#F9F9F9",
    fontWeight: "400",
  },
  row: {
    paddingVertical: 9.3,
    paddingLeft: 22,
    paddingRight: 16,
  },
  inicio3Row: {
    paddingVertical: 8.3,
    paddingLeft: 17,
    paddingRight: 11,
  },
});