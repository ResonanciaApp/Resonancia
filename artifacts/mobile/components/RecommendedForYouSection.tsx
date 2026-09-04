import React, { useEffect, useMemo, useRef, useState } from "react";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
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
import { getContentCarouselCardWidth } from "@/constants/carousel";
import { useSceneTheme } from "@/context/SceneThemeContext";

const HORIZONTAL_PAD = 14;
const CARDS_PER_TAB = 5;
const CATEGORY_ICONS: Record<string, React.ComponentProps<typeof MaterialCommunityIcons>["name"]> = {
  "meditaciones-guiadas": "meditation",
  "sonidos-ancestrales": "music-note-eighth",
  "musica-sonidos": "music",
  ambientales: "forest-outline",
  __descanzo__: "weather-night",
  historias: "book-open-page-variant-outline",
  charlas: "account-voice",
  __mezcla__: "tune-variant",
  __geometrix__: "shape-outline",
};

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
  const { activeSceneId } = useSceneTheme();
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

  const discoverCardWidth = getContentCarouselCardWidth(width, HORIZONTAL_PAD);
  const inactiveTabBackground =
    activeSceneId === "tibet"
      ? "rgba(0,0,0,0.15)"
      : activeSceneId === "indigo"
        ? "rgba(42,40,64,0.65)"
        : activeSceneId === "indigo2"
          ? "rgba(255,255,255,0.025)"
          : "rgba(255,255,255,0.05)";
  return (
    <View
      style={[styles.root, { marginBottom }]}
      testID="inicio2-recommended-for-you"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Recomendado para ti</Text>
        <Text style={styles.description}>
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
                 { backgroundColor: inactiveTabBackground },
                 selected && styles.tabSelected,
                { opacity: pressed ? 0.78 : 1 },
              ]}
            >
               {selected && (
                 <LinearGradient
                   colors={["#784576", "#50326E"]}
                   start={{ x: 0, y: 0.5 }}
                   end={{ x: 1, y: 0.5 }}
                   style={StyleSheet.absoluteFill}
                 />
               )}
               <MaterialCommunityIcons
                 name={CATEGORY_ICONS[category.id] ?? "circle-outline"}
                 size={22}
                 color="#FFFFFF"
               />
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
          cardWidth={discoverCardWidth}
          showCardMetadata
          showAuthor={false}
           showImageCategoryPill
          showHeader={false}
        />
      ) : (
        <Text style={styles.empty}>No hay recomendaciones disponibles.</Text>
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
    color: "#acaac2",
  },
  tabs: {
    paddingHorizontal: HORIZONTAL_PAD,
    paddingTop: 17,
    paddingBottom: 17,
    gap: 8,
  },
  tab: {
    height: 51,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    borderRadius: 27,
    gap: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  tabSelected: {
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.5)",
  },
  tabText: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
    color: "#F4F4F4",
  },
  tabTextSelected: {
    color: "#FFFFFF",
  },
  carousel: {
    marginBottom: 0,
    paddingHorizontal: HORIZONTAL_PAD,
  },
  empty: {
    minHeight: 80,
    paddingHorizontal: HORIZONTAL_PAD,
    paddingVertical: 20,
    fontFamily: "Manrope",
    fontSize: 13,
    color: "#acaac2",
  },
});