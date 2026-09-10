import React, { useEffect, useMemo, useRef, useState } from "react";
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

import { SessionCarousel } from "@/components/SessionCarousel";
import {
  getSessionById,
  SESSIONS,
  sortSessionsNewestFirst,
  type Session,
} from "@/data/sessions";
import type { Mood } from "@/data/moods";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { isIndigoThemeId } from "@/config/scene-themes";
import { useColors } from "@/hooks/useColors";
import { usePremium } from "@/context/PremiumContext";

const HORIZONTAL_PAD = 14;
const CARDS_PER_TAB = 5;

const RECOMMENDATION_TABS = [
  { id: "short-meditations", label: "Meditaciones cortas" },
  { id: "by-mood", label: "Según tu estado de ánimo" },
  { id: "new-content", label: "Nuevo contenido" },
  { id: "anxiety-sos", label: "Ansiedad S.O.S" },
  { id: "popular", label: "Populares" },
] as const;

type RecommendationTabId = (typeof RECOMMENDATION_TABS)[number]["id"];

type Props = {
  selectedMoods: Mood[];
  catalogVersion: number;
  onPress: (session: Session) => void;
  marginBottom?: number;
};

export function RecommendedForYouSection({
  selectedMoods = [],
  catalogVersion,
  onPress,
  marginBottom = 0,
}: Props) {
  const { activeSceneId, theme } = useSceneTheme();
  const colors = useColors();
  const { isPremium } = usePremium();
  const [activeTabId, setActiveTabId] = useState<RecommendationTabId>(
    RECOMMENDATION_TABS[0].id,
  );
  const moodSelectionKey = selectedMoods.map((mood) => mood.id).sort().join("|");
  const previousMoodSelectionKey = useRef(moodSelectionKey);

  useEffect(() => {
    if (
      moodSelectionKey &&
      moodSelectionKey !== previousMoodSelectionKey.current
    ) {
      setActiveTabId("by-mood");
    }
    previousMoodSelectionKey.current = moodSelectionKey;
  }, [moodSelectionKey]);

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
    const moodThemes = new Set(
      selectedMoods.flatMap((mood) => mood.themeTags),
    );
    const moodCategories = new Set(
      selectedMoods.flatMap((mood) => mood.categoryIds),
    );
    const byMood = moodSelectionKey
      ? available
        .map((session) => ({
          session,
          themeMatches:
            session.themeTag?.filter((tag) => moodThemes.has(tag)).length ?? 0,
          categoryMatch: moodCategories.has(session.categoryId) ? 1 : 0,
        }))
        .filter(
          ({ themeMatches, categoryMatch }) =>
            themeMatches > 0 || categoryMatch > 0,
        )
        .sort((left, right) => {
          if (left.themeMatches !== right.themeMatches) {
            return right.themeMatches - left.themeMatches;
          }
          if (left.categoryMatch !== right.categoryMatch) {
            return right.categoryMatch - left.categoryMatch;
          }
          return sortSessionsNewestFirst(left.session, right.session);
        })
        .slice(0, CARDS_PER_TAB)
        .map(({ session }) => session)
      : [];
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
      "by-mood": byMood,
    };
  }, [catalogVersion, moodSelectionKey, popularData, selectedMoods]);

  const activeSessions = recommendations[activeTabId];
  const hasRecommendations = Object.values(recommendations).some(
    (sessions) => sessions.length > 0,
  );

  if (!hasRecommendations) return null;

  const tabBackground = activeSceneId === "tibet"
    ? "rgba(0,0,0,0.1)"
    : isIndigoThemeId(activeSceneId)
      ? "rgba(181,211,255,0.1)"
      : activeSceneId === "indigo2"
        ? "rgba(191,207,255,0.1)"
        : "rgba(181,211,255,0.1)";
  return (
    <View
      style={[styles.root, { marginBottom }]}
      testID="inicio2-recommended-for-you"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Recomendado para ti</Text>
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
        <SessionCarousel
          title=""
          sessions={activeSessions.slice(0, CARDS_PER_TAB)}
          isPremium={isPremium}
          onPress={onPress}
          showHeader={false}
          squareTitleAuthorBelow
          categoryGridPresentation
          style={styles.carousel}
        />
      ) : (
        <Text style={[styles.empty, { color: theme.accent ?? colors.accent }]}>
          {activeTabId === "by-mood" && !moodSelectionKey
            ? "Cuéntanos cómo te sientes hoy para recomendarte sesiones."
            : "No hay recomendaciones disponibles."}
        </Text>
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
  tabs: {
    paddingHorizontal: HORIZONTAL_PAD,
    paddingTop: 17,
    paddingBottom: 17,
    gap: 8,
  },
  tab: {
    minHeight: 32,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 17,
    borderRadius: 14,
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
  carousel: {
    marginBottom: 0,
  },
  empty: {
    minHeight: 80,
    paddingHorizontal: HORIZONTAL_PAD,
    paddingVertical: 20,
    fontFamily: "Manrope",
    fontSize: 13,
  },
});