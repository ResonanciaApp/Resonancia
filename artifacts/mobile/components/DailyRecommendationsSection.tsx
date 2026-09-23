import React from "react";
import {
  StyleProp,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { CategoryAtmosphericCard } from "@/components/CategoryAtmosphericCard";
import { CinematicFadeSlide } from "@/components/CinematicFadeSlide";
import { SessionRow } from "@/components/SessionRow";
import type { Session } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";
import { useSceneTheme } from "@/context/SceneThemeContext";

type Props = {
  sessions: Session[];
  dayKey?: string;
  style?: StyleProp<ViewStyle>;
  inicio3Compact?: boolean;
  onRefreshRecommendations?: () => void;
};

const CARD_FADE_DURATION = 420;
const CARD_FADE_STAGGER = 90;
const CARD_FADE_TOTAL = CARD_FADE_DURATION + CARD_FADE_STAGGER * 2;

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
  const { theme } = useSceneTheme();
  const recommendations = sessions.slice(0, 3);
  const themeAccent = theme.accent ?? colors.accent;
  const [animationCycle, setAnimationCycle] = React.useState(0);
  const [isRefreshing, setIsRefreshing] = React.useState(false);
  const refreshTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  React.useEffect(() => {
    return () => {
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
    };
  }, []);

  const refreshRecommendations = React.useCallback(() => {
    if (isRefreshing || !onRefreshRecommendations) return;
    setIsRefreshing(true);
    onRefreshRecommendations();
    setAnimationCycle((cycle) => cycle + 1);
    refreshTimerRef.current = setTimeout(() => {
      refreshTimerRef.current = null;
      setIsRefreshing(false);
    }, CARD_FADE_TOTAL);
  }, [isRefreshing, onRefreshRecommendations]);

  if (recommendations.length < 3) return null;

  return (
    <View style={[styles.section, style]} testID="inicio2-daily-recommendations">
      <View style={[styles.headerRow, inicio3Compact && styles.inicio3HeaderShift]}>
        <Text style={[styles.title, { color: colors.foreground }]}>
          Recomendaciones diarias
        </Text>
        <Text style={[styles.date, { color: theme.id === "indigo2" ? colors.accent : colors.mutedForeground }]}>
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
          <React.Fragment key={session.id}>
            <CinematicFadeSlide
              replayKey={`${animationCycle}:${session.id}`}
              delay={index * CARD_FADE_STAGGER}
              duration={CARD_FADE_DURATION}
              translateYFrom={14}
              scaleFrom={0.99}
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
                  imageSize={inicio3Compact ? 81.9 : 103.7}
                  imageOffsetX={inicio3Compact ? 0 : -4}
                  metaText={
                    inicio3Compact
                      ? session.categoryLabel
                      : `${session.categoryLabel} · ${session.durationLabel}`
                  }
                  showDurationBadge={inicio3Compact}
                  showChevron
                  titleFontSize={inicio3Compact ? 15 : undefined}
                  titleFontWeight={inicio3Compact ? "600" : undefined}
                  authorColor={themeAccent}
                  authorFontSize={theme.id === "indigo2" ? 11 : undefined}
                  chevronColor={
                    inicio3Compact
                      ? "#F9F9F9"
                      : theme.id === "indigo2"
                        ? themeAccent
                        : undefined
                  }
                  style={[styles.row, inicio3Compact && styles.inicio3Row]}
                />
              </CategoryAtmosphericCard>
            </CinematicFadeSlide>
            {inicio3Compact && index < recommendations.length - 1 ? (
              <View style={styles.inicio3CardDivider} />
            ) : null}
          </React.Fragment>
        ))}
        {onRefreshRecommendations ? (
          <Pressable
            onPress={refreshRecommendations}
            disabled={isRefreshing}
            accessibilityRole="button"
            accessibilityLabel="Actualizar recomendaciones"
            accessibilityState={{ disabled: isRefreshing, busy: isRefreshing }}
            style={({ pressed }) => [
              styles.refreshButton,
              inicio3Compact && styles.inicio3RefreshButton,
              { opacity: isRefreshing ? 0.72 : pressed ? 0.78 : 1 },
            ]}
          >
            <Text style={styles.refreshButtonText}>Actualizar recomendaciones</Text>
          </Pressable>
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
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  date: {
    flexShrink: 0,
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "400",
  },
  inicio3HeaderShift: {
    transform: [{ translateY: 10 }],
  },
  recommendationsList: {
    gap: 12,
  },
  inicio3RecommendationsList: {
    gap: 0,
    paddingTop: 8,
    paddingBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 16,
    overflow: "hidden",
  },
  recommendationCard: {
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 20,
    backgroundColor: "rgba(184,117,240,0.2)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
  },
  inicio3RefreshButton: {
    marginHorizontal: 11,
    marginBottom: 3,
  },
  refreshButtonText: {
    fontFamily: "Manrope",
    fontSize: 15,
    color: "#F9F9F9",
    fontWeight: "600",
  },
  row: {
    paddingVertical: 9.3,
    paddingHorizontal: 16,
  },
  inicio3Row: {
    paddingVertical: 8.3,
    paddingHorizontal: 11,
  },
});