import React from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { CategoryAtmosphericCard } from "@/components/CategoryAtmosphericCard";
import { SessionRow } from "@/components/SessionRow";
import type { Session } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";
import { useSceneTheme } from "@/context/SceneThemeContext";

type Props = {
  sessions: Session[];
  dayKey?: string;
  onRefreshRecommendations?: () => void;
  style?: StyleProp<ViewStyle>;
  inicio3Compact?: boolean;
};

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
  onRefreshRecommendations,
  style,
  inicio3Compact = false,
}: Props) {
  const colors = useColors();
  const { theme } = useSceneTheme();
  const recommendations = sessions.slice(0, 3);
  const themeAccent = theme.accent ?? colors.accent;

  if (recommendations.length < 3) return null;

  return (
    <View style={[styles.section, style]} testID="inicio2-daily-recommendations">
      <View style={inicio3Compact ? styles.inicio3HeaderShift : undefined}>
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
                titleFontSize={inicio3Compact ? 16 : undefined}
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
            {inicio3Compact && index < recommendations.length - 1 ? (
              <View style={styles.inicio3CardDivider} />
            ) : null}
          </React.Fragment>
        ))}
        {inicio3Compact && onRefreshRecommendations ? (
          <Pressable
            onPress={onRefreshRecommendations}
            accessibilityRole="button"
            accessibilityLabel="Actualizar recomendaciones"
            style={({ pressed }) => [
              styles.refreshButton,
              styles.inicio3RefreshButton,
              { opacity: pressed ? 0.72 : 1 },
            ]}
          >
            <Text style={styles.refreshButtonText}>Actualizar recomendaciones</Text>
          </Pressable>
        ) : null}
      </View>
      {!inicio3Compact && onRefreshRecommendations && (
        <Pressable
          onPress={onRefreshRecommendations}
          accessibilityRole="button"
          accessibilityLabel="Actualizar recomendaciones"
          style={({ pressed }) => [
            styles.refreshButton,
            {
              backgroundColor: "rgba(0,0,0,0.28)",
              opacity: pressed ? 0.72 : 1,
            },
          ]}
        >
          <Text style={styles.refreshButtonText}>Actualizar recomendaciones</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginBottom: 53,
  },
  title: {
    fontFamily: "Manrope",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  date: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "400",
    marginBottom: 27,
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
  row: {
    paddingVertical: 9.3,
    paddingHorizontal: 16,
  },
  inicio3Row: {
    paddingVertical: 8.3,
    paddingHorizontal: 11,
  },
  refreshButton: {
    height: 55,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    marginTop: 16,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  inicio3RefreshButton: {
    marginHorizontal: 11,
    marginBottom: 3,
  },
  refreshButtonText: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
    color: "#F9F9F9",
    textAlign: "center",
  },
});