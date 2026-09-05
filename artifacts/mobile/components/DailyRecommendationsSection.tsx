import React from "react";
import {
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

import { SessionRow } from "@/components/SessionRow";
import type { Session } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { isIndigoThemeId } from "@/config/scene-themes";

type Props = {
  sessions: Session[];
  dayKey: string;
  onRefreshRecommendations?: () => void;
  style?: StyleProp<ViewStyle>;
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

function formatDailyDate(dayKey: string): string {
  const [year, month, day] = dayKey.split("-").map(Number);
  const date = new Date(year, (month || 1) - 1, day || 1);
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
  const sleepTabSurface =
    theme.id === "tibet"
      ? "rgba(0,0,0,0.15)"
      : isIndigoThemeId(theme.id)
        ? "rgba(181,211,255,0.057)"
        : "rgba(181,211,255,0.057)";
  const refreshButtonBackground =
    theme.id === "tibet"
      ? "rgba(0,0,0,0.15)"
      : isIndigoThemeId(theme.id)
        ? "rgba(181,211,255,0.057)"
        : theme.id === "indigo2"
          ? "rgba(255,255,255,0.025)"
          : "rgba(181,211,255,0.057)";

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
          styles.card,
          {
            borderColor: sleepTabSurface,
          },
        ]}
      >
        {recommendations.map((session, index) => (
          <React.Fragment key={session.id}>
            <SessionRow
              session={session}
              imageSize={97}
              hideMeta
              secondaryText={session.categoryLabel}
              showDurationBadge
              showChevron
              authorColor={themeAccent}
              authorFontSize={theme.id === "indigo2" ? 11 : undefined}
              chevronColor={theme.id === "indigo2" ? themeAccent : undefined}
              style={styles.row}
            />
            {index < recommendations.length - 1 && (
              <View style={[styles.divider, { backgroundColor: sleepTabSurface }]} />
            )}
          </React.Fragment>
        ))}
        {onRefreshRecommendations && (
          <>
            <View style={[styles.divider, { backgroundColor: sleepTabSurface }]} />
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
          </>
        )}
      </View>
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
  card: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 16,
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  row: {
    paddingVertical: 16,
  },
  divider: {
    height: 1,
    opacity: 0.75,
  },
  refreshButton: {
    height: 45,
    borderRadius: 15,
    marginVertical: 16,
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