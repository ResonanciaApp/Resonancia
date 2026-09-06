import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { SessionCarousel } from "@/components/SessionCarousel";
import { DISCOVER_CONTENT_CATEGORIES } from "@/data/content-categories";
import { getSessionById, SESSIONS, type Session } from "@/data/sessions";
import type { Mood } from "@/data/moods";
import { getTwoCardCarouselCardWidth } from "@/constants/carousel";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { isIndigoThemeId } from "@/config/scene-themes";
import { useColors } from "@/hooks/useColors";

const HORIZONTAL_PAD = 14;
const CARDS_PER_TAB = 5;

type RecommendationsByCategory = Record<string, string[]>;

type Props = {
  selectedMoods: Mood[];
  generation: number;
  catalogStatus: "bundled" | "cached" | "remote";
  catalogVersion: number;
  isPremium: boolean;
  onPress: (session: Session) => void;
  marginBottom?: number;
};

function hashText(value: string): number {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function buildRecommendations(
  selectedMoods: Mood[],
  generation: number,
  previous?: RecommendationsByCategory,
): RecommendationsByCategory {
  const moodKey = selectedMoods.map((mood) => mood.id).sort().join("|") || "initial";
  const preferredCategories = new Set(
    selectedMoods.flatMap((mood) => mood.categoryIds),
  );
  const preferredThemes = new Set(
    selectedMoods.flatMap((mood) => mood.themeTags),
  );

  return Object.fromEntries(
    DISCOVER_CONTENT_CATEGORIES.map((category) => {
      const rankedIds = SESSIONS
        .filter(
          (session) =>
            session.categoryId === category.id && !session.isPlaceholder,
        )
        .map((session) => ({
          session,
          themeMatches:
            session.themeTag?.filter((tag) => preferredThemes.has(tag)).length ?? 0,
          categoryMatch: preferredCategories.has(category.id) ? 1 : 0,
          order: hashText(
            `${category.id}|${moodKey}|${generation}|${session.id}`,
          ),
        }))
        .sort((left, right) => {
          if (left.themeMatches !== right.themeMatches) {
            return right.themeMatches - left.themeMatches;
          }
          if (left.categoryMatch !== right.categoryMatch) {
            return right.categoryMatch - left.categoryMatch;
          }
          return left.order - right.order;
        })
        .map(({ session }) => session.id);

      let ids = rankedIds.slice(0, CARDS_PER_TAB);
      const previousIds = previous?.[category.id] ?? [];
      const sameSelection =
        ids.length === previousIds.length &&
        ids.every((id) => previousIds.includes(id));

      if (sameSelection && rankedIds.length > CARDS_PER_TAB) {
        const replacement = rankedIds.find((id) => !previousIds.includes(id));
        if (replacement) {
          ids = [...ids.slice(0, CARDS_PER_TAB - 1), replacement];
        }
      }

      return [category.id, ids];
    }),
  );
}

export function RecommendedForYouSection({
  selectedMoods,
  generation,
  catalogStatus,
  catalogVersion,
  isPremium,
  onPress,
  marginBottom = 0,
}: Props) {
  const { width } = useWindowDimensions();
  const { activeSceneId, theme } = useSceneTheme();
  const colors = useColors();
  const [activeCategoryId, setActiveCategoryId] = useState(
    DISCOVER_CONTENT_CATEGORIES[0]?.id ?? "",
  );
  const [recommendationIds, setRecommendationIds] =
    useState<RecommendationsByCategory>(() =>
      buildRecommendations(selectedMoods, generation),
    );
  const appliedGeneration = useRef(generation);
  const hydratedCatalogApplied = useRef(catalogStatus !== "bundled");

  useEffect(() => {
    if (appliedGeneration.current === generation) return;
    appliedGeneration.current = generation;
    setRecommendationIds((current) =>
      buildRecommendations(selectedMoods, generation, current),
    );
  }, [generation, selectedMoods]);

  useEffect(() => {
    if (hydratedCatalogApplied.current || catalogStatus === "bundled") return;
    hydratedCatalogApplied.current = true;
    setRecommendationIds(buildRecommendations(selectedMoods, generation));
  }, [catalogStatus, catalogVersion, generation, selectedMoods]);

  const activeSessions = useMemo(
    () =>
      (recommendationIds[activeCategoryId] ?? [])
        .map((id) => getSessionById(id))
        .filter((session): session is Session => Boolean(session)),
    [activeCategoryId, recommendationIds],
  );

  const hasRecommendations = Object.values(recommendationIds).some(
    (ids) => ids.length > 0,
  );

  if (!hasRecommendations) return null;

  const sleepCardWidth = getTwoCardCarouselCardWidth(width, HORIZONTAL_PAD, 45);
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
          En base a tus preferencia y estados de ánimo.
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
        accessibilityRole="tablist"
      >
        {DISCOVER_CONTENT_CATEGORIES.map((category) => {
          const selected = category.id === activeCategoryId;
          return (
            <Pressable
              key={category.id}
              onPress={() => setActiveCategoryId(category.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              testID={`inicio2-recommended-tab-${category.id}`}
              style={({ pressed }) => [
                styles.tab,
                { backgroundColor: selected ? "#F9F9F9" : tabBackground },
                { opacity: pressed ? 0.78 : 1 },
              ]}
            >
              <Text style={[styles.tabText, selected && styles.tabTextSelected]}>
                {category.label}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {activeSessions.length > 0 ? (
        <SessionCarousel
          title=""
          sessions={activeSessions}
          isPremium={isPremium}
          onPress={onPress}
          style={styles.carousel}
          presentation="sleep-category"
          cardWidth={sleepCardWidth}
          cardHeightAdjustment={-25}
          overlayDurationTopLeft
          showHeader={false}
        />
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
  carousel: {
    marginTop: 8,
    marginBottom: 0,
    paddingHorizontal: HORIZONTAL_PAD,
  },
  empty: {
    minHeight: 80,
    paddingHorizontal: HORIZONTAL_PAD,
    paddingVertical: 20,
    fontFamily: "Manrope",
    fontSize: 13,
  },
});