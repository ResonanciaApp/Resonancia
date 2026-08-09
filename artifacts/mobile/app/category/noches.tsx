import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { BackPill } from "@/components/BackPill";
import { SessionCarousel } from "@/components/SessionCarousel";
import { SessionActionsSheet } from "@/components/SessionActionsSheet";
import { router } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  ActivityIndicator, Animated, Dimensions, Easing, Modal, Platform,
  Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { SESSIONS, getSessionById, type Session } from "@/data/sessions";
import { useCatalog } from "@/context/CatalogContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { getArtist } from "@/data/artists";
import { getGuide } from "@/data/guides";

const H_PAD   = 20;
const { width: W } = Dimensions.get("window");
const cardW   = (W - H_PAD * 2 - 20) / 2;
const RECENT_CARD_W = Math.round((W - H_PAD * 2) / 1.85);
const ICON_COLOR = "#C87BB5";
const GOLD    = "#F9F9F9";
const TEXT    = "#FBFBFB";
const MUTED   = "#c2c2c2";

type CatTab = string;

type SubDef = {
  tag: string;
  icon: string;
  family: "Feather" | "MaterialCommunityIcons";
};

const SUBCATEGORIES: SubDef[] = [
  { tag: "Guiadas",                icon: "mic",        family: "Feather" },
  { tag: "Música",                 icon: "music",      family: "Feather" },
  { tag: "Sonidos de la Naturaleza", icon: "leaf",     family: "MaterialCommunityIcons" },
  { tag: "Yoga Nidra",             icon: "meditation", family: "MaterialCommunityIcons" },
  { tag: "Música Ambient",         icon: "waveform",   family: "MaterialCommunityIcons" },
  { tag: "Sonidos Ancestrales",    icon: "bowl-mix",   family: "MaterialCommunityIcons" },
];

const NOCHES_SESSIONS = SESSIONS.filter((s) => s.categoryId === "noches");

const matchTag = (s: Session, tag: string) =>
  (s as Session & { meditationTag?: string }).meditationTag === tag ||
  (s as Session & { soundTag?: string }).soundTag === tag ||
  (s as Session & { ancestralTag?: string }).ancestralTag === tag ||
  ((s as Session & { themeTag?: string[] }).themeTag?.includes(tag) ?? false);

function getSessionsForTab(tab: CatTab | null) {
  if (!tab) return NOCHES_SESSIONS;
  return NOCHES_SESSIONS.filter((s) => matchTag(s, tab));
}

function AnimatedTabContent({ animKey, children }: { animKey: string; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    opacity.setValue(0);
    Animated.timing(opacity, { toValue: 1, duration: 1200, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [animKey]); // eslint-disable-line react-hooks/exhaustive-deps
  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}

function Chip({ label, sel, onPress }: { label: string; sel: boolean; onPress: () => void }) {
  const { theme: chipTheme } = useSceneTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, sel && styles.chipSel, { opacity: pressed ? 0.7 : 1 }]}>
      {sel && (chipTheme?.id === "tibet"
        ? <View style={[StyleSheet.absoluteFill, { backgroundColor: "#F9F9F9" }]} />
        : <LinearGradient colors={["rgb(218,212,236)", "rgb(251,169,128)"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
      )}
      <Text style={[styles.chipText, sel && styles.chipTextSel]}>{label}</Text>
    </Pressable>
  );
}

function ChipRow({ tabs, activeTab, onSelect, onClear }: {
  tabs: SubDef[]; activeTab: CatTab | null; onSelect: (id: CatTab) => void; onClear: () => void;
}) {
  return (
    <View style={styles.chipRowWrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.chipRow} contentContainerStyle={styles.chipRowContent}>
        <Chip label="Todos" sel={activeTab === null} onPress={onClear} />
        {tabs.map((t) => (
          <Chip key={t.tag} label={t.tag} sel={activeTab === t.tag}
            onPress={() => activeTab === t.tag ? onClear() : onSelect(t.tag)} />
        ))}
      </ScrollView>
    </View>
  );
}

function CategoryCard({
  session, width: cardWidth = 200, horizontal = false, landscape = false, onLongPress, onOptions,
}: {
  session: Session; width?: number; horizontal?: boolean; landscape?: boolean; onLongPress?: () => void; onOptions?: () => void;
}) {
  const { isPremium } = usePremium();
  const { playSession } = usePlayer();
  const locked = !!session.isPremium && !isPremium;
  const handlePress = () => {
    if (locked) { router.push("/membresia" as never); return; }
    playSession(session);
    router.push("/player" as never);
  };
  const authorObj = session.guideId ? getGuide(session.guideId) : getArtist(session.artistId);
  const author = authorObj.name;

  if (landscape) {
    return (
      <Pressable onPress={handlePress} onLongPress={onLongPress}
        style={({ pressed }) => [ac.lCard, { opacity: pressed ? 0.85 : 1 }]}>
        <View style={ac.lImgWrap}>
          <Image source={session.image} style={StyleSheet.absoluteFill} contentFit="cover" />
          <View style={ac.lDurPill}><Text style={ac.lDur}>{session.durationLabel}</Text></View>
          {locked && <View style={ac.lockDot}><Feather name="lock" size={9} color="#fff" /></View>}
        </View>
        <Text style={ac.lTitle} numberOfLines={2}>{session.title}</Text>
        {!!author && <Text style={ac.lAuthor} numberOfLines={1}>{author}</Text>}
      </Pressable>
    );
  }

  if (horizontal) {
    return (
      <Pressable onPress={handlePress} onLongPress={onLongPress} style={({ pressed }) => [ac.hRow, { opacity: pressed ? 0.8 : 1 }]}>
        <View style={ac.hImgWrap}>
          <Image source={session.image} style={ac.hImage} contentFit="cover" />
          <View style={ac.hImgOverlay} />
          {locked && <View style={ac.lockDot}><Feather name="lock" size={9} color="#fff" /></View>}
        </View>
        <View style={ac.hContent}>
          <Text style={ac.hDuration}>{session.durationLabel}</Text>
          <Text style={ac.hTitle} numberOfLines={2}>{session.title}</Text>
          {!!author && <Text style={ac.hAuthor} numberOfLines={1}>{author}</Text>}
        </View>
      </Pressable>
    );
  }

  return (
    <Pressable onPress={handlePress} onLongPress={onLongPress}
      style={({ pressed }) => [ac.card, { width: cardWidth, opacity: pressed ? 0.85 : 1 }]}>
      <View style={ac.imgContainer}>
        <Image source={session.image} style={ac.cardImage} contentFit="cover" />
        {locked && <View style={ac.lockDot}><Feather name="lock" size={9} color="#fff" /></View>}
        <View style={ac.durationBadge}><Text style={ac.durationBadgeText}>{session.durationLabel}</Text></View>
      </View>
      <Text style={ac.cardTitle} numberOfLines={2}>{session.title}</Text>
      {!!author && <Text style={ac.cardAuthor} numberOfLines={1}>{author}</Text>}
    </Pressable>
  );
}

const ac = StyleSheet.create({
  hRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 6, marginBottom: 11 },
  hImgWrap: { width: 87, height: 87, borderRadius: 8, overflow: "hidden" },
  hImgOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.18)" },
  hImage: { width: 87, height: 87 },
  hContent: { flex: 1, justifyContent: "center", gap: 2 },
  hDuration: { fontFamily: "Manrope", fontSize: 11, color: MUTED },
  hTitle: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600", color: TEXT, lineHeight: 18 },
  hAuthor: { fontFamily: "Manrope", fontSize: 11, color: MUTED },
  card: { gap: 6 },
  imgContainer: { width: "100%", aspectRatio: 1, borderRadius: 17, overflow: "hidden" },
  cardImage: { width: "100%", height: "100%" },
  cardTitle: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600", color: TEXT, lineHeight: 18 },
  cardAuthor: { fontFamily: "Manrope", fontSize: 11, color: "#F4F4F4" },
  durationBadge: { position: "absolute", bottom: 8, left: 8, backgroundColor: "rgba(27,6,15,0.72)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  durationBadgeText: { fontFamily: "Manrope", fontSize: 11, fontWeight: "600", color: "#fff" },
  lockDot: { position: "absolute", top: 6, right: 6, width: 20, height: 20, borderRadius: 10, backgroundColor: "rgba(0,0,0,0.55)", alignItems: "center", justifyContent: "center" },
  lCard: { width: 299 },
  lImgWrap: { width: 299, height: 187, borderRadius: 14, overflow: "hidden" },
  lDurPill: { position: "absolute", bottom: 8, left: 8, backgroundColor: "rgba(27,6,15,0.72)", borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  lDur: { fontFamily: "Manrope", fontSize: 11, fontWeight: "600", color: "#fff" },
  lTitle: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600", color: TEXT, lineHeight: 17, marginTop: 10 },
  lAuthor: { fontFamily: "Manrope", fontSize: 11, color: MUTED, marginTop: 3 },
});

export default function NochesScreen() {
  const insets    = useSafeAreaInsets();
  const topPad    = Platform.OS === "web" ? 0 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const { version } = useCatalog();
  const { theme } = useSceneTheme();
  const { history, playSession, favorites } = usePlayer();
  const { isPremium } = usePremium();

  const TABS = useMemo(
    () => SUBCATEGORIES.filter((sub) => NOCHES_SESSIONS.some((s) => matchTag(s, sub.tag))),
    [version], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const [activeTab,       setActiveTab]       = useState<CatTab | null>(null);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [allVisible,      setAllVisible]      = useState(false);
  const slideX = useRef(new Animated.Value(W)).current;

  const closeAll = () => {
    Animated.timing(slideX, { toValue: W, duration: 280, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => setAllVisible(false));
  };
  useEffect(() => {
    if (!allVisible) return;
    slideX.setValue(W);
    Animated.timing(slideX, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [allVisible]); // eslint-disable-line react-hooks/exhaustive-deps

  const scrollRef = useRef<ScrollView>(null);
  const stickyHeaderOpacity = useRef(new Animated.Value(0)).current;
  const [stickyActive,  setStickyActive]  = useState(false);
  const [chipsOffsetY,  setChipsOffsetY]  = useState(9999);
  useEffect(() => {
    Animated.timing(stickyHeaderOpacity, {
      toValue: stickyActive ? 1 : 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [stickyActive]); // eslint-disable-line react-hooks/exhaustive-deps

  const PAGE_SIZE = 20;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const allTabSessions = useMemo(() => getSessionsForTab(activeTab), [activeTab, version]); // eslint-disable-line react-hooks/exhaustive-deps

  const recentInCategory = useMemo(() => {
    const tabIds = activeTab !== null ? new Set(allTabSessions.map((s) => s.id)) : null;
    const seen = new Set<string>(); const result: Session[] = [];
    for (const h of history) {
      if (seen.has(h.sessionId)) continue;
      seen.add(h.sessionId);
      const s = getSessionById(h.sessionId);
      if (s && s.categoryId === "noches" && (tabIds === null || tabIds.has(s.id))) result.push(s);
      if (result.length === 10) break;
    }
    return result;
  }, [history, activeTab, allTabSessions]);

  const favoritesInCategory = useMemo(() => {
    const tabIds = activeTab !== null ? new Set(allTabSessions.map((s) => s.id)) : null;
    const result: Session[] = [];
    for (const id of favorites) {
      const s = getSessionById(id);
      if (s && s.categoryId === "noches" && (tabIds === null || tabIds.has(s.id))) result.push(s);
    }
    return result;
  }, [favorites, activeTab, allTabSessions]);

  const [shuffledSessions, setShuffledSessions] = useState<typeof allTabSessions>([]);
  useEffect(() => {
    const arr = [...allTabSessions];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    setShuffledSessions(arr);
    setVisibleCount(PAGE_SIZE);
  }, [allTabSessions]);

  const featuredSessions = useMemo(
    () => (activeTab === null ? allTabSessions.filter((s) => s.isFeaturedCategory) : []),
    [allTabSessions, activeTab],
  );

  const renderContent = () => {
    if (shuffledSessions.length === 0) return (
      <View style={styles.emptyState}>
        <Feather name="moon" size={48} color={GOLD} style={{ marginBottom: 16 }} />
        <Text style={styles.emptyTitle}>Próximamente en {activeTab ?? "Noches"}</Text>
        <Text style={styles.emptySub}>Estamos preparando el mejor contenido para tu descanso.</Text>
      </View>
    );
    const visibleSessions = shuffledSessions.slice(0, visibleCount);
    const hasMore = visibleCount < shuffledSessions.length;
    return (
      <>
        {featuredSessions.length > 0 && (
          <>
            <Text style={styles.featuredTitle}>Contenido destacado</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.featuredRow}>
              {featuredSessions.map((s) => (
                <CategoryCard key={`feat-${s.id}`} session={s} landscape
                  onLongPress={() => setSelectedSession(s)} onOptions={() => setSelectedSession(s)} />
              ))}
            </ScrollView>
            <View style={styles.featuredDivider} />
          </>
        )}
        {activeTab === null && recentInCategory.length > 0 && (
          <>
            <SessionCarousel
              title="Escuchadas recientemente"
              sessions={recentInCategory}
              isPremium={isPremium}
              onPress={(s) => { playSession(s); router.push("/player" as never); }}
              style={{ marginTop: 24, marginBottom: 0 }}
              cardWidth={RECENT_CARD_W}
              titleSize={19}
            />
            <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginHorizontal: H_PAD, marginTop: 20, marginBottom: 4 }} />
          </>
        )}
        {activeTab === null && favoritesInCategory.length > 0 && (
          <>
            <SessionCarousel
              title="Favoritos"
              sessions={favoritesInCategory}
              isPremium={isPremium}
              onPress={(s) => { playSession(s); router.push("/player" as never); }}
              style={{ marginTop: 24, marginBottom: 0 }}
              cardWidth={RECENT_CARD_W}
              titleSize={19}
            />
            <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginHorizontal: H_PAD, marginTop: 20, marginBottom: 4 }} />
          </>
        )}
        {activeTab === null && (() => {
          const visibleSubs = TABS.filter((sub) => getSessionsForTab(sub.tag).length > 0);
          return visibleSubs.map((sub, idx) => {
            const tabSessions = getSessionsForTab(sub.tag);
            const preview = tabSessions.slice(0, 5);
            const subHasMore = tabSessions.length > 5;
            const isLast = idx === visibleSubs.length - 1;
            return (
              <React.Fragment key={sub.tag}>
                <SessionCarousel
                  title={sub.tag}
                  sessions={preview}
                  isPremium={isPremium}
                  onPress={(s) => { playSession(s); router.push("/player" as never); }}
                  style={{ marginTop: 24, marginBottom: 0 }}
                  cardWidth={RECENT_CARD_W}
                  titleSize={19}
                  onViewAll={subHasMore ? () => setActiveTab(sub.tag) : undefined}
                />
                {!isLast && <View style={{ height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginHorizontal: H_PAD, marginTop: 20, marginBottom: 4 }} />}
              </React.Fragment>
            );
          });
        })()}
        {activeTab === null && (
          <Pressable
            onPress={() => setAllVisible(true)}
            style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 18, gap: 6, marginTop: 4, opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={{ fontFamily: "Manrope", fontSize: 15, fontWeight: "600", color: GOLD }}>Todas las Noches</Text>
            <Feather name="chevron-right" size={16} color={GOLD} />
          </Pressable>
        )}
        {activeTab !== null && (
          <>
            <View style={styles.sessionGrid}>
              {visibleSessions.map((s) => (
                <CategoryCard key={s.id} session={s} width={cardW}
                  onLongPress={() => setSelectedSession(s)} onOptions={() => setSelectedSession(s)} />
              ))}
            </View>
            {hasMore && <View style={styles.loadMoreFooter}><ActivityIndicator size="small" color={MUTED} /></View>}
          </>
        )}
      </>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.gradient[theme.gradient.length - 1] as string }]}>
      <LinearGradient colors={theme.gradient as unknown as [string, string, ...string[]]} style={StyleSheet.absoluteFill} />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 140 + bottomPad }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          const active = y > chipsOffsetY - topPad - 8;
          if (active !== stickyActive) setStickyActive(active);
          const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
          if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 300) {
            setVisibleCount((c) => c + PAGE_SIZE);
          }
        }}
      >
        {/* ── Hero ── */}
        <View style={styles.heroArea}>
          <View style={[styles.heroOverlayLeft, { top: topPad + 8 }]}>
            <View style={styles.lotoBtn}>
              <BackPill onPress={() => router.back()} size={31} style={{ transform: [{ translateX: -2 }] }} />
            </View>
          </View>
          <View style={[styles.heroIconFloat]}>
            <View style={[styles.heroIconCircle, { borderColor: ICON_COLOR + "33" }]}>
              <Image
                source={require("../../assets/images/cat-noches.png")}
                style={{ width: 42, height: 42 }}
                contentFit="contain"
              />
            </View>
          </View>
        </View>

        {/* ── Título ── */}
        <View style={styles.profileCard}>
          <Text style={styles.profileTitle}>Noches</Text>
        </View>

        {/* ── Chips ── */}
        <View style={styles.chipsArea} onLayout={(e) => setChipsOffsetY(e.nativeEvent.layout.y)}>
          <ChipRow
            tabs={TABS}
            activeTab={activeTab}
            onSelect={(id) => setActiveTab(id)}
            onClear={() => setActiveTab(null)}
          />
        </View>

        {/* ── Contenido ── */}
        <AnimatedTabContent animKey={activeTab ?? "all"}>
          {renderContent()}
        </AnimatedTabContent>
      </ScrollView>

      <SessionActionsSheet session={selectedSession} visible={!!selectedSession} onClose={() => setSelectedSession(null)} />

      {/* ── Vista "Todas las sesiones" (desliza desde la derecha) ── */}
      <Modal visible={allVisible} transparent animationType="none" onRequestClose={closeAll} statusBarTranslucent>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: theme.gradient[theme.gradient.length - 1] as string, transform: [{ translateX: slideX }] }]}>
          <LinearGradient colors={theme.gradient as unknown as [string, string, ...string[]]} style={StyleSheet.absoluteFill} />
          <View style={{ flexDirection: "row", alignItems: "center", paddingTop: topPad + 14, paddingHorizontal: H_PAD, paddingBottom: 14, gap: 4 }}>
            <Pressable onPress={closeAll} hitSlop={12} style={{ padding: 4 }}>
              <Feather name="chevron-left" size={28} color={TEXT} />
            </Pressable>
            <Text style={{ fontFamily: "Manrope", fontSize: 20, fontWeight: "700", color: TEXT, flex: 1 }}>Todas las Noches</Text>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexDirection: "row", flexWrap: "wrap", columnGap: 20, paddingHorizontal: H_PAD, rowGap: 24, paddingTop: 8, paddingBottom: 120 + bottomPad }}>
            {getSessionsForTab(null).map((s) => (
              <CategoryCard key={s.id} session={s} width={cardW} />
            ))}
          </ScrollView>
        </Animated.View>
      </Modal>

      {/* ── Sticky header ── */}
      <Animated.View
        style={[styles.stickyHeader, { paddingTop: topPad + 8, opacity: stickyHeaderOpacity, backgroundColor: theme.gradient[0] }]}
        pointerEvents={stickyActive ? "auto" : "none"}
      >
        <View style={styles.lotoBtn}>
          <BackPill onPress={() => router.back()} size={31} />
        </View>
        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>Noches</Text>
          {activeTab && <Text style={styles.headerSubtitle}>{activeTab}</Text>}
        </View>
        <View style={styles.lotoBtn} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },

  stickyHeader: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: H_PAD, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  headerTitleCol: { flex: 1, alignItems: "center" },
  headerTitle: { fontFamily: "Manrope", fontSize: 18, fontWeight: "400", color: TEXT, letterSpacing: 0.2, textAlign: "center" },
  headerSubtitle: { fontFamily: "Manrope", fontSize: 11, color: "#f7f7f7", letterSpacing: 0.3, marginTop: 1, opacity: 0.7 },

  heroArea: { height: 148, position: "relative", alignItems: "center", justifyContent: "flex-end" },
  heroOverlayLeft: { position: "absolute", left: H_PAD, zIndex: 10 },
  heroIconFloat: { alignItems: "center", paddingBottom: 13, zIndex: 2 },
  heroIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: ICON_COLOR + "1A", borderWidth: 2, alignItems: "center", justifyContent: "center", overflow: "hidden" },
  lotoBtn: { width: 45, height: 45, borderRadius: 22.5, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.035)" },

  profileCard: { marginHorizontal: H_PAD, marginTop: 4, paddingBottom: 14, gap: 8, alignItems: "center" },
  profileTitle: { fontFamily: "Manrope", fontSize: 22, fontWeight: "700", color: TEXT, letterSpacing: 0.3 },

  chipsArea: { paddingTop: 10, paddingBottom: 5, overflow: "visible", marginTop: -2 },
  chipRowWrapper: { position: "relative" },
  chipRow: { flexGrow: 0 },
  chipRowContent: { flexDirection: "row", gap: 8, paddingVertical: 2, paddingHorizontal: H_PAD },
  chip: { height: 31, paddingHorizontal: 14, borderRadius: 999, overflow: "hidden", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  chipSel: { borderWidth: 0 },
  chipText: { fontFamily: "Manrope", fontSize: 13, fontWeight: "700", color: TEXT, textAlign: "center" },
  chipTextSel: { fontFamily: "Manrope", color: "#2D0D3A", fontWeight: "380" as import("react-native").TextStyle["fontWeight"] },

  featuredTitle: { fontFamily: "Manrope", fontSize: 19, fontWeight: "700", color: TEXT, paddingHorizontal: H_PAD, marginTop: 30 },
  featuredRow: { paddingHorizontal: H_PAD, gap: 16, paddingTop: 21 },
  featuredDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginHorizontal: H_PAD, marginTop: 20 },

  sessionGrid: { flexDirection: "row", flexWrap: "wrap", columnGap: 20, paddingHorizontal: H_PAD, rowGap: 24, marginTop: 18, marginBottom: 6 },
  loadMoreFooter: { alignItems: "center", paddingVertical: 20 },

  emptyState: { alignItems: "center", paddingTop: 80, paddingHorizontal: H_PAD },
  emptyTitle: { fontFamily: "Manrope", fontSize: 17, fontWeight: "700", color: TEXT, textAlign: "center", marginBottom: 8 },
  emptySub: { fontFamily: "Manrope", fontSize: 13, color: MUTED, textAlign: "center", lineHeight: 20 },
});
