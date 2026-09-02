import React from "react";
import {
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

type Props = {
  sessions: Session[];
  dayKey: string;
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

export function DailyRecommendationsSection({ sessions, dayKey, style }: Props) {
  const colors = useColors();
  const { theme } = useSceneTheme();
  const recommendations = sessions.slice(0, 3);
  const sleepTabSurface =
    theme.id === "tibet"
      ? "rgba(0,0,0,0.15)"
      : theme.id === "indigo"
        ? "rgba(42,40,64,0.65)"
        : "rgba(255,255,255,0.05)";

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
              imageSize={84}
              showCategoryPill
              categoryPillPlain={false}
              categoryPillOutlineColor={sleepTabSurface}
              showDurationBadge
              showChevron
              style={styles.row}
            />
            {index < recommendations.length - 1 && (
              <View style={[styles.divider, { backgroundColor: sleepTabSurface }]} />
            )}
          </React.Fragment>
        ))}
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
    fontSize: 20,
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
});