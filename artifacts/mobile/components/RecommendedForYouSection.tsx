import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";

import {
  getGetPopularSessionsQueryKey,
  useGetPopularSessions,
} from "@workspace/api-client-react";

import { CategoryAtmosphericCard } from "@/components/CategoryAtmosphericCard";
import { SessionRow } from "@/components/SessionRow";
import {
  getSessionById,
  SESSIONS,
  sortSessionsNewestFirst,
  type Session,
} from "@/data/sessions";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { isIndigoThemeId } from "@/config/scene-themes";
import { useColors } from "@/hooks/useColors";

const HORIZONTAL_PAD = 14;
const CARDS_PER_TAB = 3;

const RECOMMENDATION_TABS = [
  { id: "short-meditations", label: "Meditaciones cortas" },
  { id: "new-content", label: "Nuevo contenido" },
  { id: "anxiety-sos", label: "Ansiedad S.O.S" },
  { id: "popular", label: "Populares" },
] as const;

type RecommendationTabId = (typeof RECOMMENDATION_TABS)[number]["id"];

type Props = {
  catalogVersion: number;
  onPress: (session: Session) => void;
  marginBottom?: number;
};

export function RecommendedForYouSection({
  catalogVersion,
  onPress,
  marginBottom = 0,
}: Props) {
  const { activeSceneId, theme } = useSceneTheme();
  const colors = useColors();
  const [activeTabId, setActiveTabId] = useState<RecommendationTabId>(
    RECOMMENDATION_TABS[0].id,
  );
  const { data: popularData } = useGetPopularSessions(
    { limit: 30 },
    {
      query: {
        queryKey: getGetPopularSessionsQueryKey({ limit: 30 }),
        staleTime: 5 * 60_000,
      },
    },
  );

  const recommendations = useMemo<Record<RecommendationTabId, Session[]>>(() => {
    const available = SESSIONS.filter((session) => !session.isPlaceholder);
    const newest = [...available].sort(sortSessionsNewestFirst);
    const shortMeditations = available
      .filter((session) => session.categoryId === "meditaciones-guiadas")
      .sort((left, right) =>
        left.duration !== right.duration
          ? left.duration - right.duration
          : sortSessionsNewestFirst(left, right),
      )
      .slice(0, CARDS_PER_TAB);
    const anxiety = newest
      .filter((session) => session.themeTag?.includes("Para la ansiedad"))
      .slice(0, CARDS_PER_TAB);
    const popular = (popularData?.sessions ?? [])
      .map((session) => getSessionById(session.id))
      .filter(
        (session): session is Session =>
          Boolean(session) && !session?.isPlaceholder,
      )
      .slice(0, CARDS_PER_TAB);

    return {
      "short-meditations": shortMeditations,
      "new-content": newest.slice(0, CARDS_PER_TAB),
      "anxiety-sos": anxiety,
      popular,
    };
  }, [catalogVersion, popularData]);

  const activeSessions = recommendations[activeTabId];
  const hasRecommendations = Object.values(recommendations).some(
    (sessions) => sessions.length > 0,
  );

  if (!hasRecommendations) return null;

  const tabBackground = activeSceneId === "tibet"
    ? "rgba(0,0,0,0.15)"
    : isIndigoThemeId(activeSceneId)
      ? "rgba(181,211,255,0.057)"
      : activeSceneId === "indigo2"
        ? "rgba(191,207,255,0.096)"
        : "rgba(181,211,255,0.057)";
  return (
    <View
      style={[styles.root, { marginBottom }]}
      testID="inicio2-recommended-for-you"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Recomendado para ti</Text>
        <Text style={[styles.description, { color: theme.accent ?? colors.accent }]}>
          Contenido seleccionado para acompañar tu momento.
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
        accessibilityRole="tablist"
      >
        {RECOMMENDATION_TABS.map((tab) => {
          const selected = tab.id === activeTabId;
          return (
            <Pressable
              key={tab.id}
              onPress={() => setActiveTabId(tab.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              testID={`inicio2-recommended-tab-${tab.id}`}
              style={({ pressed }) => [
                styles.tab,
                { backgroundColor: selected ? "#F9F9F9" : tabBackground },
                { opacity: pressed ? 0.78 : 1 },
              ]}
            >
              <Text style={[styles.tabText, selected && styles.tabTextSelected]}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {activeSessions.length > 0 ? (
        <View style={styles.recommendationsList}>
          {activeSessions.map((session) => (
            <CategoryAtmosphericCard
              key={session.id}
              categoryId={session.categoryId}
            >
              <SessionRow
                session={session}
                imageSize={97}
                showCategoryPill
                categoryPillPlain={false}
                categoryPillTextOnly
                categoryPillTinted
                categoryPillShowIconGlyph={false}
                categoryPillIconSize={15}
                showDurationBadge
                showChevron
                authorColor={theme.accent ?? colors.accent}
                authorFontSize={theme.id === "indigo2" ? 11 : undefined}
                chevronColor={
                  theme.id === "indigo2"
                    ? theme.accent ?? colors.accent
                    : undefined
                }
                onPress={() => onPress(session)}
                style={styles.row}
              />
            </CategoryAtmosphericCard>
          ))}
        </View>
      ) : (
        <Text style={[styles.empty, { color: theme.accent ?? colors.accent }]}>No hay recomendaciones disponibles.</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    width: "100%",
  },
  header: {
    paddingHorizontal: HORIZONTAL_PAD,
  },
  title: {
    fontFamily: "Manrope",
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: 0.3,
    color: "#FBFBFB",
  },
  description: {
    marginTop: 5,
    fontFamily: "Manrope",
    fontSize: 12,
    lineHeight: 18,
  },
  tabs: {
    paddingHorizontal: HORIZONTAL_PAD,
    paddingTop: 17,
    paddingBottom: 17,
    gap: 8,
  },
  tab: {
    minHeight: 38,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 17,
    borderRadius: 22,
    gap: 8,
    overflow: "hidden",
    borderWidth: 0,
  },
  tabText: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "600",
    color: "#F4F4F4",
  },
  tabTextSelected: {
    color: "#060A0F",
  },
  recommendationsList: {
    paddingHorizontal: HORIZONTAL_PAD,
    gap: 15,
  },
  row: {
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  empty: {
    minHeight: 80,
    paddingHorizontal: HORIZONTAL_PAD,
    paddingVertical: 20,
    fontFamily: "Manrope",
    fontSize: 13,
  },
});