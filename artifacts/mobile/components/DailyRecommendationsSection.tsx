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
      <Text style={[styles.title, { color: colors.foreground }]}>
        Recomendaciones diarias
      </Text>
      <Text style={[styles.date, { color: theme.id === "indigo2" ? colors.accent : colors.mutedForeground }]}>
        {formatDailyDate(dayKey)}
      </Text>

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
                imageSize={inicio3Compact ? 88.1 : 103.7}
                imageOffsetX={inicio3Compact ? 0 : -4}
                metaText={`${session.categoryLabel} · ${session.durationLabel}`}
                showChevron={!inicio3Compact}
                titleFontSize={inicio3Compact ? 18 : undefined}
                titleFontWeight={inicio3Compact ? "600" : undefined}
                staticPlayBadge={inicio3Compact}
                authorColor={themeAccent}
                authorFontSize={theme.id === "indigo2" ? 11 : undefined}
                chevronColor={theme.id === "indigo2" ? themeAccent : undefined}
                style={[styles.row, inicio3Compact && styles.inicio3Row]}
              />
            </CategoryAtmosphericCard>
            {inicio3Compact && index < recommendations.length - 1 ? (
              <View style={styles.inicio3CardDivider} />
            ) : null}
          </React.Fragment>
        ))}
      </View>
      {onRefreshRecommendations && (
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
    fontSize: 19,
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
  recommendationsList: {
    gap: 12,
  },
  inicio3RecommendationsList: {
    gap: 0,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
    borderRadius: 27,
    overflow: "hidden",
  },
  recommendationCard: {
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  inicio3RecommendationCard: {
    borderRadius: 0,
    backgroundColor: "transparent",
    borderWidth: 0,
    borderColor: "transparent",
  },
  inicio3CardDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  row: {
    paddingVertical: 9.3,
    paddingHorizontal: 16,
  },
  inicio3Row: {
    paddingVertical: 9,
    paddingHorizontal: 11,
  },
  refreshButton: {
    height: 55,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    marginTop: 16,
    paddingHorizontal: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  refreshButtonText: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "600",
    color: "#F9F9F9",
    textAlign: "center",
  },
});