import React, { useEffect, useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { SessionCarousel } from "@/components/SessionCarousel";
import { useCatalog } from "@/context/CatalogContext";
import { getCategorySessionTags, getCategoryTabs } from "@/data/category-tabs";
import { getSessionsByCategory, type Session } from "@/data/sessions";

const CATEGORY_ID = "charlas";
const HORIZONTAL_PAD = 14;
const CARDS_PER_TAB = 5;

type Props = {
  isPremium: boolean;
  onPress: (session: Session) => void;
  marginBottom?: number;
};

export function ExpandConsciousnessSection({
  isPremium,
  onPress,
  marginBottom = 0,
}: Props) {
  const { width } = useWindowDimensions();
  const { version: catalogVersion } = useCatalog();
  const [activeTab, setActiveTab] = useState<string | null>(null);

  const sessions = useMemo(
    () =>
      getSessionsByCategory(CATEGORY_ID).filter(
        (session) => !session.isPlaceholder,
      ),
    [catalogVersion],
  );
  const categoryTabs = useMemo(
    () => getCategoryTabs(sessions, CATEGORY_ID),
    [sessions],
  );
  const visibleTabs = useMemo(
    () => [null, ...categoryTabs],
    [categoryTabs],
  );

  useEffect(() => {
    if (activeTab !== null && !categoryTabs.includes(activeTab)) {
      setActiveTab(null);
    }
  }, [activeTab, categoryTabs]);

  const activeSessions = useMemo(() => {
    const filtered =
      activeTab === null
        ? sessions
        : sessions.filter((session) =>
            getCategorySessionTags(session, CATEGORY_ID).includes(activeTab),
          );
    return filtered.slice(0, CARDS_PER_TAB);
  }, [activeTab, sessions]);

  const discoverCardWidth = Math.round((width - HORIZONTAL_PAD * 2) / 1.85);

  return (
    <View
      style={[styles.root, { marginBottom }]}
      testID="inicio2-expand-consciousness"
    >
      <View style={styles.header}>
        <Text style={styles.title}>Expande tu consciencia</Text>
        <Text style={styles.description}>
          Charlas que despiertan lo verdadero en ti
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
        accessibilityRole="tablist"
      >
        {visibleTabs.map((tab) => {
          const selected = activeTab === tab;
          const label = tab ?? "Todos";
          return (
            <Pressable
              key={tab ?? "todos"}
              onPress={() => setActiveTab(tab)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              testID={`inicio2-consciousness-tab-${tab ?? "todos"}`}
              style={({ pressed }) => [
                styles.tab,
                selected && styles.tabSelected,
                { opacity: pressed ? 0.78 : 1 },
              ]}
            >
              <Text style={[styles.tabText, selected && styles.tabTextSelected]}>
                {label}
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
          showHeader={false}
        />
      ) : (
        <Text style={styles.empty}>
          Próximamente en Charlas
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
    minHeight: 38,
    justifyContent: "center",
    paddingHorizontal: 17,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(249,249,249,0.42)",
    backgroundColor: "transparent",
  },
  tabSelected: {
    borderColor: "#78221E",
    backgroundColor: "#78221E",
  },
  tabText: {
    fontFamily: "Manrope",
    fontSize: 12,
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