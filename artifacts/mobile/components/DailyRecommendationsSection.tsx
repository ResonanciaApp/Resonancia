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
import { isIndigoThemeId } from "@/config/scene-themes";

type Props = {
  sessions: Session[];
  dayKey?: string;
  onRefreshRecommendations?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function getDailyRecommendationSurface(
  themeId: Parameters<typeof isIndigoThemeId>[0],
): string {
  return themeId === "tibet"
    ? "rgba(0,0,0,0.15)"
    : isIndigoThemeId(themeId)
      ? "rgba(181,211,255,0.057)"
      : themeId === "indigo2"
        ? "rgba(191,207,255,0.096)"
        : "rgba(181,211,255,0.057)";
}

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
}: Props) {
  const colors = useColors();
  const { theme } = useSceneTheme();
  const recommendations = sessions.slice(0, 3);
  const themeAccent = theme.accent ?? colors.accent;
  const refreshButtonBackground = getDailyRecommendationSurface(theme.id);

  if (recommendations.length < 3) return null;

  return (
    <View style={[styles.section, style]} testID="inicio2-daily-recommendations">
      <Text style={[styles.title, { color: colors.foreground }]}>
        Recomendaciones diarias
      </Text>
      <Text style={[styles.date, { color: theme.id === "indigo2" ? colors.accent : colors.mutedForeground }]}>
        {formatDailyDate(dayKey)}
      </Text>

      <View style={styles.recommendationsList}>
        {recommendations.map((session) => (
          <CategoryAtmosphericCard
            key={session.id}
            categoryId={session.categoryId}
          >
            <SessionRow
              session={session}
              imageSize={97}
              showCategoryPill
              categoryPillShowIconGlyph={false}
              categoryPillIconSize={15}
              showDurationBadge
              showChevron
              authorColor={themeAccent}
              authorFontSize={theme.id === "indigo2" ? 11 : undefined}
              chevronColor={theme.id === "indigo2" ? themeAccent : undefined}
              style={styles.row}
            />
          </CategoryAtmosphericCard>
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
              backgroundColor: refreshButtonBackground,
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
    gap: 15,
  },
  row: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  refreshButton: {
    height: 55,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.15)",
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