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
  onRefreshRecommendations?: () => void;
  style?: StyleProp<ViewStyle>;
};

export function DailyRecommendationsSection({
  sessions,
  onRefreshRecommendations,
  style,
}: Props) {
  const colors = useColors();
  const { theme } = useSceneTheme();
  const recommendations = sessions.slice(0, 3);
  const themeAccent = theme.accent ?? colors.accent;
  const refreshButtonBackground =
    theme.id === "tibet"
      ? "rgba(0,0,0,0.15)"
      : isIndigoThemeId(theme.id)
        ? "rgba(181,211,255,0.057)"
        : theme.id === "indigo2"
          ? "rgba(191,207,255,0.096)"
          : "rgba(181,211,255,0.057)";

  if (recommendations.length < 3) return null;

  return (
    <View style={[styles.section, style]} testID="inicio2-daily-recommendations">
      <Text style={[styles.title, { color: colors.foreground }]}>
        Recomendaciones diarias
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
              hideMeta
              secondaryText={session.categoryLabel}
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
    height: 45,
    borderRadius: 15,
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