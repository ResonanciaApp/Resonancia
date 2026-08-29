import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ContextSearchModal } from "@/components/ContextSearchModal";
import { SessionCard } from "@/components/SessionCard";
import { SessionCarousel } from "@/components/SessionCarousel";
import { useBackOverride } from "@/context/BackOverrideContext";
import { useCatalog } from "@/context/CatalogContext";
import { useCategoryOverlayOptional } from "@/context/CategoryOverlayContext";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { CATEGORIES } from "@/data/categories";
import { getSessionsByCategory, type Session } from "@/data/sessions";

const H_PAD = 20;
const { width: W } = Dimensions.get("window");
const CARD_W = (W - H_PAD * 2 - 20) / 2;
const CAROUSEL_CARD_W = Math.round((W - H_PAD * 2) / 1.85);
const TEXT = "#FBFBFB";
const MUTED = "#c2c2c2";

const CATEGORY_TAB_GRADIENTS: Record<string, [string, string]> = {
  ambientales: ["#357849", "#23522F"],
  historias: ["#8F227F", "#691E5E"],
  charlas: ["#953732", "#78221E"],
};

function getSessionTags(session: Session, categoryId: string): string[] {
  const tags = categoryId === "ambientales"
    ? [
        session.sonidosTag,
        ...(session.sonidosTags ?? []),
        session.soundTag,
        ...(session.temaTag ?? []),
      ]
    : [
        session.podcastTag,
        session.sabiduriaTag,
        ...(session.temaTag ?? []),
      ];

  return [...new Set(tags.filter((tag): tag is string => Boolean(tag)))];
}

function Chip({
  label,
  icon,
  selected,
  selectedColors,
  onPress,
}: {
  label: string;
  icon?: React.ComponentProps<typeof Feather>["name"];
  selected: boolean;
  selectedColors: [string, string];
  onPress: () => void;
}) {
  const { theme } = useSceneTheme();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.chip,
        theme.id === "tibet" && styles.chipTibet,
        theme.id === "indigo" && styles.chipIndigo,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      {selected && (
        <LinearGradient
          colors={selectedColors}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <Feather name={icon ?? "tag"} size={22} color="#F4F4F4" />
      <Text style={styles.chipText}>{label}</Text>
    </Pressable>
  );
}

function ChipRow({
  tabs,
  activeTab,
  selectedColors,
  onSelect,
}: {
  tabs: string[];
  activeTab: string | null;
  selectedColors: [string, string];
  onSelect: (tab: string | null) => void;
}) {
  return (
    <View style={styles.chipRowWrapper}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        contentContainerStyle={styles.chipRowContent}
      >
        <Chip
          label="Todos"
          icon="grid"
          selected={activeTab === null}
          selectedColors={selectedColors}
          onPress={() => onSelect(null)}
        />
        {tabs.map((tab) => (
          <Chip
            key={tab}
            label={tab}
            selected={activeTab === tab}
            selectedColors={selectedColors}
            onPress={() => onSelect(activeTab === tab ? null : tab)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

export default function CategoryScreen({ categoryId }: { categoryId?: string } = {}) {
  const { id: routeId } = useLocalSearchParams<{ id: string }>();
  const id = categoryId ?? routeId ?? "";
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { version } = useCatalog();
  const { activeSceneId, theme } = useSceneTheme();
  const { playSession } = usePlayer();
  const { isPremium } = usePremium();
  const backOverride = useBackOverride();
  const categoryOverlay = useCategoryOverlayOptional();

  const category = CATEGORIES.find((candidate) => candidate.id === id);
  const allSessions = useMemo(() => getSessionsByCategory(id), [id, version]);
  const tabs = useMemo(
    () => [...new Set(allSessions.flatMap((session) => getSessionTags(session, id)))],
    [allSessions, id],
  );
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [searchVisible, setSearchVisible] = useState(false);
  const filteredSessions = useMemo(
    () => activeTab === null
      ? allSessions
      : allSessions.filter((session) => getSessionTags(session, id).includes(activeTab)),
    [activeTab, allSessions, id],
  );
  const searchItems = useMemo(
    () => allSessions.map((session) => ({
      id: session.id,
      title: session.title,
      meta: session.categoryLabel,
      subtitle: session.subtitle,
      searchText: [
        session.title,
        session.subtitle,
        session.categoryLabel,
        ...getSessionTags(session, id),
      ].join(" "),
      image: session.image,
    })),
    [allSessions, id],
  );

  const stickyHeaderOpacity = useRef(new Animated.Value(0)).current;
  const [stickyActive, setStickyActive] = useState(false);
  const [chipsOffsetY, setChipsOffsetY] = useState(Number.POSITIVE_INFINITY);

  useEffect(() => {
    Animated.timing(stickyHeaderOpacity, {
      toValue: stickyActive ? 1 : 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [stickyActive, stickyHeaderOpacity]);

  const profileSectionBackground = activeSceneId === "tibet"
    ? "rgba(0,0,0,0.15)"
    : activeSceneId === "indigo"
      ? "rgba(42,40,64,0.65)"
      : "rgba(255,255,255,0.05)";
  const selectedColors = CATEGORY_TAB_GRADIENTS[id] ?? ["#307E91", "#1A5863"];
  const title = category?.title ?? "Categoría";

  const goBack = backOverride ?? (() => router.back());
  const handleSessionPress = (session: Session) => {
    if (session.isPremium && !isPremium) {
      router.push("/membresia" as never);
      return;
    }
    if (session.skipMiniPlayer) {
      playSession(session);
      return;
    }
    if (session.skipDetail) {
      playSession(session);
      router.push("/player" as never);
      return;
    }
    if (categoryOverlay) {
      categoryOverlay.openCategory(`/session/${session.id}`);
      return;
    }
    router.push(`/session/${session.id}` as never);
  };

  const renderSessions = () => {
    if (filteredSessions.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Feather name="headphones" size={48} color="#F9F9F9" style={styles.emptyIcon} />
          <Text style={styles.emptyTitle}>Próximamente en {title}</Text>
          <Text style={styles.emptySub}>
            {category?.subtitle ?? "Estamos preparando nuevas sesiones para ti."}
          </Text>
        </View>
      );
    }

    if (activeTab === null && tabs.length > 0) {
      return (
        <>
          {tabs.map((tab, index) => {
            const tabSessions = allSessions.filter((session) =>
              getSessionTags(session, id).includes(tab),
            );
            return (
              <SessionCarousel
                key={tab}
                title={tab}
                sessions={tabSessions.slice(0, 5)}
                isPremium={isPremium}
                onPress={handleSessionPress}
                onViewAll={tabSessions.length > 5 ? () => setActiveTab(tab) : undefined}
                style={{ marginTop: index === 0 ? 33 : 53, marginBottom: 0 }}
                cardWidth={CAROUSEL_CARD_W}
                titleSize={18}
                showCardMetadata
              />
            );
          })}
        </>
      );
    }

    return (
      <View style={styles.sessionGrid}>
        {filteredSessions.map((session) => (
          <SessionCard
            key={session.id}
            session={session}
            width={CARD_W}
            style={{ marginRight: 0 }}
            showCardMetadata
            showAuthorAvatar={false}
            overridePress={() => handleSessionPress(session)}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.gradient[theme.gradient.length - 1] as string }]}>
      <StatusBar hidden />
      <LinearGradient
        colors={theme.gradient as unknown as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 140 + bottomPad }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(event) => {
          const y = event.nativeEvent.contentOffset.y;
          const active = y > chipsOffsetY - topPad - 8;
          if (active !== stickyActive) setStickyActive(active);
        }}
      >
        <View style={[styles.header, { paddingTop: topPad + 8 }]}>
          <Pressable
            onPress={goBack}
            hitSlop={10}
            style={({ pressed }) => [
              styles.backBtn,
              {
                backgroundColor: profileSectionBackground,
                opacity: pressed ? 0.7 : 1,
                top: topPad + 3,
              },
            ]}
          >
            <Feather name="chevron-left" size={26} color={TEXT} />
          </Pressable>
          <Text style={styles.pageTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
            {title}
          </Text>
          <Pressable
            onPress={() => setSearchVisible(true)}
            hitSlop={10}
            style={[
              styles.headerSearchButton,
              theme.id === "indigo" && { backgroundColor: "rgba(42,40,64,0.65)" },
              { position: "absolute", right: H_PAD, top: topPad + 3 },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Buscar en ${title}`}
          >
            <Feather name="search" size={24} color={TEXT} />
          </Pressable>
        </View>

        <View
          style={styles.chipsArea}
          onLayout={(event) => setChipsOffsetY(event.nativeEvent.layout.y)}
        >
          <ChipRow
            tabs={tabs}
            activeTab={activeTab}
            selectedColors={selectedColors}
            onSelect={setActiveTab}
          />
        </View>

        <Animated.View key={activeTab ?? "all"} style={styles.content}>
          {renderSessions()}
        </Animated.View>
      </ScrollView>

      <Animated.View
        style={[
          styles.stickyHeader,
          {
            paddingTop: topPad + 8,
            opacity: stickyHeaderOpacity,
            backgroundColor: theme.gradient[0] as string,
          },
        ]}
        pointerEvents={stickyActive ? "auto" : "none"}
      >
        <View style={styles.stickyHeaderRow}>
          <View style={styles.stickyHeaderSpacer} />
          <View style={styles.stickyTitleCol}>
            <Text style={styles.stickyTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
              {title}
            </Text>
          </View>
          <View style={styles.stickyHeaderSpacer}>
            <Pressable
              onPress={() => setSearchVisible(true)}
              hitSlop={10}
              style={[
                styles.headerSearchButton,
                theme.id === "indigo" && { backgroundColor: "rgba(42,40,64,0.65)" },
              ]}
              accessibilityRole="button"
              accessibilityLabel={`Buscar en ${title}`}
            >
              <Feather name="search" size={24} color={TEXT} />
            </Pressable>
          </View>
        </View>
        <Pressable
          onPress={goBack}
          hitSlop={10}
          style={({ pressed }) => [
            styles.backBtn,
            {
              backgroundColor: profileSectionBackground,
              opacity: pressed ? 0.7 : 1,
              top: topPad + 2,
            },
          ]}
        >
          <Feather name="chevron-left" size={26} color={TEXT} />
        </Pressable>
        <View style={styles.stickyChipsArea}>
          <ChipRow
            tabs={tabs}
            activeTab={activeTab}
            selectedColors={selectedColors}
            onSelect={setActiveTab}
          />
        </View>
        <View style={styles.stickyTabsDivider} />
      </Animated.View>

      <ContextSearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        items={searchItems}
        placeholder={`Buscar en ${title}...`}
        emptyTitle={`Busca en ${title}`}
        emptySubtitle={category?.subtitle ?? "Encuentra una sesión para ti"}
        onSelect={(item) => {
          const session = allSessions.find((candidate) => candidate.id === item.id);
          if (session) handleSessionPress(session);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  header: {
    paddingHorizontal: H_PAD,
    paddingBottom: 12,
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtn: {
    position: "absolute",
    left: H_PAD,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  pageTitle: {
    fontFamily: "Manrope",
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    color: TEXT,
    letterSpacing: 0.2,
  },
  headerSearchButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  chipsArea: {
    paddingTop: 10,
    paddingBottom: 5,
    marginTop: 6,
    overflow: "visible",
    paddingHorizontal: H_PAD,
  },
  chipRowWrapper: { position: "relative", marginHorizontal: -H_PAD },
  chipRow: { flexGrow: 0 },
  chipRowContent: {
    flexDirection: "row",
    gap: 8,
    paddingVertical: 2,
    paddingHorizontal: H_PAD,
  },
  chip: {
    height: 46,
    paddingHorizontal: 16,
    borderRadius: 27,
    overflow: "hidden",
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  chipTibet: { backgroundColor: "rgba(0,0,0,0.15)" },
  chipIndigo: { backgroundColor: "rgba(42,40,64,0.65)" },
  chipText: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
    color: "#F4F4F4",
    textAlign: "center",
  },
  content: { minHeight: 200 },
  sessionGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    columnGap: 20,
    rowGap: 24,
    paddingHorizontal: H_PAD,
    marginTop: 18,
    marginBottom: 6,
  },
  emptyState: {
    alignItems: "center",
    paddingTop: 80,
    paddingHorizontal: H_PAD,
  },
  emptyIcon: { marginBottom: 16 },
  emptyTitle: {
    fontFamily: "Manrope",
    fontSize: 17,
    fontWeight: "700",
    color: TEXT,
    textAlign: "center",
    marginBottom: 8,
  },
  emptySub: {
    fontFamily: "Manrope",
    fontSize: 13,
    color: MUTED,
    textAlign: "center",
    lineHeight: 20,
  },
  stickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    minHeight: 48,
    paddingHorizontal: H_PAD,
    paddingBottom: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  stickyHeaderRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingBottom: 6,
  },
  stickyHeaderSpacer: { width: 40 },
  stickyTitleCol: { flex: 1, alignItems: "center" },
  stickyTitle: {
    fontFamily: "Manrope",
    fontSize: 20,
    lineHeight: 23,
    fontWeight: "700",
    color: TEXT,
    letterSpacing: 0.2,
    textAlign: "center",
  },
  stickyChipsArea: { width: "100%", marginTop: 19 },
  stickyTabsDivider: {
    width: W,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginTop: 8,
  },
});