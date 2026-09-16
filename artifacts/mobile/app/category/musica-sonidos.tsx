import { Feather, Ionicons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import MaskedView from "@react-native-masked-view/masked-view";
import { SessionCarousel } from "@/components/SessionCarousel";
import {
  SESSION_CARD_METADATA_HEIGHT_SCALE,
  SessionCardMetadataOverlay,
} from "@/components/SessionCardMetadataOverlay";
import { SessionCard } from "@/components/SessionCard";
import {
  CONTENT_CAROUSEL_HEIGHT_SCALE,
  getContentCarouselCardWidth,
} from "@/constants/carousel";
import { router } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  ActivityIndicator, Animated, Dimensions, Easing, Modal, Platform,
  Pressable, ScrollView, StyleSheet, Text, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GhostPill } from "@/components/GhostPill";
import { SessionActionsSheet } from "@/components/SessionActionsSheet";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { getArtist } from "@/data/artists";
import { getGuide } from "@/data/guides";
import {
  SESSIONS,
  getSessionById,
  sortSessionsNewestFirst,
  type Session,
} from "@/data/sessions";
import { useCatalog } from "@/context/CatalogContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useBackOverride } from "@/context/BackOverrideContext";
import { useCategoryOverlayOptional } from "@/context/CategoryOverlayContext";
import { hexToRgba } from "@/utils/color";
import { isIndigoThemeId } from "@/config/scene-themes";
import { getCategorySessionTags } from "@/data/category-tabs";
import { ContextSearchModal, type ContextSearchItem } from "@/components/ContextSearchModal";

const H_PAD = 14;
const CARD_GAP = 12;
const { width: W } = Dimensions.get("window");
const cardW = (W - H_PAD * 2 - CARD_GAP) / 2;
const FEATURED_CARD_W = getContentCarouselCardWidth(W, H_PAD);
const MUSIC_FEATURED_BASE_W = (W - H_PAD * 2 - 56) * 0.85;
const MUSIC_FEATURED_CARD_W = Math.round(
  MUSIC_FEATURED_BASE_W * 1.25 - 25,
);
const MUSIC_FEATURED_CARD_H = Math.round(
  (MUSIC_FEATURED_CARD_W / (16 / 9)) * 1.1,
);
const GOLD  = "#F9F9F9";
const TEXT  = "#FBFBFB";
const MUTED = "#c2c2c2";

type CatTab   = string;
type SortMode = "recientes" | "nuevas" | "populares";

const SORT_OPTIONS: { id: SortMode; label: string; icon: string }[] = [
  { id: "recientes", label: "Escuchadas recientemente", icon: "clock" },
  { id: "nuevas",    label: "Nuevas sesiones",          icon: "plus-circle" },
  { id: "populares", label: "Las más escuchadas",       icon: "headphones" },
];

function getSessionsForTab(tab: string | null) {
  const all = SESSIONS.filter((s) => s.categoryId === "musica-sonidos");
  const filtered = tab
    ? all.filter((s) => getCategorySessionTags(s, "musica-sonidos").includes(tab))
    : all;
  return filtered.sort(sortSessionsNewestFirst);
}


function SortSheet({ visible, current, onSelect, onClose }: { visible: boolean; current: SortMode; onSelect: (s: SortMode)=>void; onClose: ()=>void }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={[styles.sortSheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={styles.sortSheetHandle} />
        <Text style={styles.sortSheetTitle}>Ordenar por</Text>
        {SORT_OPTIONS.map((opt) => {
          const active = opt.id === current;
          return (
            <Pressable key={opt.id} style={({pressed})=>[styles.sortSheetRow,{opacity:pressed?0.7:1}]} onPress={()=>{ onSelect(opt.id); onClose(); }}>
              <Feather name={opt.icon as never} size={17} color={active?GOLD:MUTED} />
              <Text style={[styles.sortSheetLabel, active&&styles.sortSheetLabelActive]}>{opt.label}</Text>
              {active && <Feather name="check" size={17} color={GOLD} style={{marginLeft:"auto"}} />}
            </Pressable>
          );
        })}
      </View>
    </Modal>
  );
}

function AnimatedTabContent({ animKey, children }: { animKey: string; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    opacity.setValue(0);
    Animated.timing(opacity, { toValue:1, duration:1200, easing:Easing.out(Easing.quad), useNativeDriver:true }).start();
  }, [animKey]); // eslint-disable-line react-hooks/exhaustive-deps
  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}

function Chip({ label, sel, onPress }: { label: string; sel: boolean; onPress: ()=>void }) {
  return (
    <Pressable onPress={onPress} style={({pressed})=>({opacity:pressed?0.7:1})}>
      <Animated.View style={[styles.chip, sel && styles.chipSel]}>
        <Text style={[styles.chipText, sel && styles.chipTextSel]}>{label}</Text>
      </Animated.View>
    </Pressable>
  );
}

function ChipRow({ tabs, activeTab, onSelect }: { tabs: { id: string; label: string }[]; activeTab: CatTab|null|undefined; onSelect:(id:CatTab|null)=>void }) {
  return (
    <View style={styles.chipRowWrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.chipRow} contentContainerStyle={styles.chipRowContent}>
        {tabs.map((t) => (
          <Chip key={t.id} label={t.label} sel={false}
            onPress={() => onSelect(t.id)} />
        ))}
      </ScrollView>
    </View>
  );
}

function CategoryCard({
  session, width: cardWidth=200, horizontal=false, landscape=false, onLongPress, onOptions,
}: {
  session: Session; width?: number; horizontal?: boolean; landscape?: boolean; onLongPress?: ()=>void; onOptions?: ()=>void;
}) {
  const { isPremium } = usePremium();
  const { playSession } = usePlayer();
  const locked   = !!session.isPremium && !isPremium;
  const handlePress = () => {
    if (locked) { router.push("/membresia" as never); return; }
    if (session.skipMiniPlayer) { playSession(session); return; }
    // Música/Sonidos: siempre abre el reproductor (no pantalla de detalle).
    // skipDetail explícito o el default de categoría → player.
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
          <SessionCardMetadataOverlay
            categoryId={session.categoryId}
            durationLabel={session.durationLabel}
            title={session.title}
           showCategoryPill={false}
            showAuthor={false}
            durationBottom={52}
            metaBottom={20}
            metaLeft={18}
            contentLeft={18}
          />
          {locked && <View style={ac.lockDot}><Feather name="lock" size={9} color="#fff" /></View>}
        </View>
      </Pressable>
    );
  }

  if (horizontal) {
    return (
      <Pressable onPress={handlePress} onLongPress={onLongPress} style={({pressed})=>[ac.hRow,{opacity:pressed?0.8:1}]}>
        <View style={ac.hImgWrap}>
          <Image source={session.image} style={ac.hImage} contentFit="cover" />
          <View style={ac.hImgOverlay} />
          {locked&&<View style={ac.lockDot}><Feather name="lock" size={9} color="#fff" /></View>}
        </View>
        <View style={ac.hContent}>
          <Text style={ac.hDuration}>{session.durationLabel}</Text>
          <Text style={ac.hTitle} numberOfLines={2}>{session.title}</Text>
        </View>
      </Pressable>
    );
  }
  return (
    <SessionCard
      session={session}
      width={cardWidth}
      style={{ marginRight: 0 }}
       editorialPresentation
      sleepEditorialContent
      showSleepCategoryPill={false}
      showAuthorAvatar={false}
      onLongPress={onLongPress}
      overridePress={handlePress}
    />
  );
}

const ac = StyleSheet.create({
  hRow:{ flexDirection:"row", alignItems:"center", gap:12, paddingVertical:6, marginBottom:11 },
  hImgWrap:{ width:87, height:87, borderRadius:8, overflow:"hidden" },
  hImgOverlay:{ ...StyleSheet.absoluteFillObject, backgroundColor:"rgba(0,0,0,0.18)" },
  hImage:{ width:87, height:87 },
  hContent:{ flex:1, justifyContent:"center", gap:2 },
  hDuration:{ fontFamily: "Manrope", fontSize:11, fontWeight:"400", color:MUTED },
  hTitle:{ fontFamily: "Manrope", fontSize:13, fontWeight:"600", color:TEXT, lineHeight:18, marginLeft:8 },
  hAuthor:{ fontFamily: "Manrope", fontSize:11, color:MUTED, flex:1 },
  hAuthorRow:{ flexDirection:"row", alignItems:"center", gap:6, marginTop:1 },
  hAuthorAvatar:{ width:20, height:20, borderRadius:10 },
  hDotsBtn:{ paddingLeft:12, paddingRight:4, paddingVertical:8, alignItems:"center", justifyContent:"center", gap:3, flexDirection:"row" },
  hDot:{ width:4, height:4, borderRadius:2, backgroundColor:MUTED },
  card:{gap:6},
  imgContainer:{width:"100%",aspectRatio:1,borderRadius:17,overflow:"hidden"},
  cardImage:{width:"100%",height:"100%"},
  cardTitle:{ fontFamily: "Manrope",fontSize:13,fontWeight:"600",color:TEXT,lineHeight:18},
  cardAuthor:{ fontFamily: "Manrope",fontSize:11,color:"#F4F4F4"},
  durationBadge:{position:"absolute",bottom:8,left:8,borderRadius:8,paddingHorizontal:8,paddingVertical:3},
  durationBadgeText:{ fontFamily: "Manrope",fontSize:11,fontWeight:"600",color:"#fff"},
  lockDot:{position:"absolute",top:6,right:6,width:20,height:20,borderRadius:10,backgroundColor:"rgba(0,0,0,0.55)",alignItems:"center",justifyContent:"center"},
  lCard:{ width:FEATURED_CARD_W },
  lImgWrap:{ width:FEATURED_CARD_W, height:237 * SESSION_CARD_METADATA_HEIGHT_SCALE * CONTENT_CAROUSEL_HEIGHT_SCALE, borderRadius:14, overflow:"hidden" },
  lDurPill:{ position:"absolute", bottom:8, left:8, borderRadius:8, paddingHorizontal:8, paddingVertical:3 },
  
  lDur:{ fontFamily:"Manrope", fontSize:11, fontWeight:"600", color:"#fff" },
  lTitle:{ fontFamily:"Manrope", fontSize:13, fontWeight:"600", color:TEXT, lineHeight:17, marginTop:10 },
  lAuthor:{ fontFamily:"Manrope", fontSize:11, color:MUTED, marginTop:3 },
});

export default function MusicaSonidosScreen() {
  const insets    = useSafeAreaInsets();
  const topPad    = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS==="web" ? 34 : insets.bottom;
  const { version } = useCatalog();
  const { activeSceneId, theme } = useSceneTheme();
  const { history, playSession } = usePlayer();
  const { isPremium } = usePremium();
  const categoryOverlay = useCategoryOverlayOptional();
  const backOverride = useBackOverride();
  const profileSectionBackground = "rgba(0,0,0,0.28)";

  const TABS = useMemo(() => {
    const uniqueTags = [...new Set(
      SESSIONS.filter((s) => s.categoryId === "musica-sonidos")
              .flatMap((s) => getCategorySessionTags(s, "musica-sonidos"))
    )];
    return uniqueTags.map((tag) => ({ id: tag, label: tag }));
  }, [version]);
  const searchItems = useMemo<ContextSearchItem[]>(
    () => getSessionsForTab(null).map((s) => ({
      id: s.id, title: s.title, meta: s.categoryLabel, subtitle: s.durationLabel,
      searchText: `${s.title} ${getCategorySessionTags(s, "musica-sonidos").join(" ")}`,
      image: s.image, duration: s.duration,
    })),
    [version],
  );

  const [activeTab,         setActiveTab]         = useState<CatTab|null>(null);
  const [sort,              setSort]              = useState<SortMode>("recientes");
  const [sortVisible,       setSortVisible]       = useState(false);
  const [searchVisible,     setSearchVisible]     = useState(false);
  const [selectedSession,   setSelectedSession]   = useState<Session|null>(null);
  const [allVisible,        setAllVisible]         = useState(false);
  const slideX = useRef(new Animated.Value(W)).current;
  const closeAll = () => {
    Animated.timing(slideX, { toValue: W, duration: 280, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => setAllVisible(false));
  };
  useEffect(() => {
    if (!allVisible) return;
    slideX.setValue(W);
    Animated.timing(slideX, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [allVisible]); // eslint-disable-line react-hooks/exhaustive-deps

  const scrollRef  = useRef<ScrollView>(null);
  const [stickyHeaderHeight, setStickyHeaderHeight] = useState(0);
  const stickyBorderOpacity = useRef(new Animated.Value(0)).current;
  const stickyBorderActiveRef = useRef(false);
  const useDiscoverStickyStyle = isIndigoThemeId(theme.id) || theme.id === "indigo2";

  const PAGE_SIZE = 20;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const allTabSessions = useMemo(()=>getSessionsForTab(activeTab),[activeTab,version]);

  const recentInCategory = useMemo(() => {
    const tabIds = activeTab !== null ? new Set(allTabSessions.map((s) => s.id)) : null;
    const seen = new Set<string>(); const result: Session[] = [];
    for (const h of history) {
      if (seen.has(h.sessionId)) continue;
      seen.add(h.sessionId);
      const s = getSessionById(h.sessionId);
      if (s && s.categoryId === "musica-sonidos" && (tabIds === null || tabIds.has(s.id))) result.push(s);
      if (result.length === 10) break;
    }
    return result;
  }, [history, activeTab, allTabSessions]);

  const [shuffledSessions, setShuffledSessions] = useState<typeof allTabSessions>([]);
  useEffect(()=>{
    const arr = [...allTabSessions];
    for (let i=arr.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [arr[i],arr[j]]=[arr[j],arr[i]];
    }
    setShuffledSessions(arr);
    setVisibleCount(PAGE_SIZE);
  },[allTabSessions]);

  const featuredSessions = useMemo(
    () => getSessionsForTab(null).filter((session) => session.isFeaturedCategory),
    [version],
  );

  const musicCollections = useMemo(
    () =>
      TABS.map((tab) => ({
        ...tab,
        sessions: getSessionsForTab(tab.id).slice(0, 5),
      })).filter((collection) => collection.sessions.length > 0),
    [TABS, version],
  );

  const openMusicCollection = (tagId: string) => {
    const route = `/category-tag/${encodeURIComponent("musica-sonidos")}/${encodeURIComponent(tagId)}`;
    if (categoryOverlay) {
      categoryOverlay.openCategory(route);
      return;
    }
    router.push(route as never);
  };

  const handleMusicSessionTap = (session: Session) => {
    if (session.isPremium && !isPremium) {
      router.push("/membresia" as never);
      return;
    }
    if (session.skipMiniPlayer) {
      playSession(session);
      return;
    }
    playSession(session);
    router.push("/player" as never);
  };

  const renderContent = () => {
    if (musicCollections.length === 0) return (
      <View style={styles.emptyState}>
        <Feather name="music" size={48} color={GOLD} style={{marginBottom:16}} />
        <Text style={styles.emptyTitle}>Próximamente en Música</Text>
        <Text style={styles.emptySub}>Estamos componiendo los mejores paisajes sonoros.</Text>
      </View>
    );
    return (
      <View style={styles.carouselSections}>
        {featuredSessions.length > 0 ? (
          <SessionCarousel
            title="Contenido destacado"
            sessions={featuredSessions}
            isPremium={isPremium}
            onPress={handleMusicSessionTap}
            onLongPress={setSelectedSession}
            style={{
              marginTop: 33,
              marginBottom: 0,
              paddingHorizontal: H_PAD,
            }}
            disableAmbientalVariant
            whiteMetadataGlass
            showDurationClock
            trailingPeek={20}
            cardWidth={MUSIC_FEATURED_CARD_W}
            cardHeight={MUSIC_FEATURED_CARD_H}
            allowOversizedCardWidth
            cardBorderRadius={16}
            hideCategoryAboveTitle
            titleSize={17}
          />
        ) : null}
        {musicCollections.map((collection, index) => (
          <React.Fragment key={collection.id}>
            {featuredSessions.length > 0 || index > 0 ? (
              <View style={styles.sectionDivider} />
            ) : null}
            <SessionCarousel
              title={collection.label}
              sessions={collection.sessions}
              isPremium={isPremium}
              onPress={handleMusicSessionTap}
              onLongPress={setSelectedSession}
              style={{
                marginTop: index === 0 && featuredSessions.length === 0 ? 33 : 26,
                marginBottom: 0,
                paddingHorizontal: H_PAD,
              }}
              presentation="editorial"
              disableAmbientalVariant
              sleepMetadataBelow
              categoryGridPresentation
              whiteMetadataGlass
              showDurationClock
              sleepBelowMetadataStyle={{ marginTop: 3, transform: [{ translateX: 3 }] }}
              trailingPeek={20}
              cardWidth={Math.round((W - H_PAD - 14) / 1.9)}
              allowOversizedCardWidth
              cardBorderRadius={16}
              hideCategoryAboveTitle
              showSleepCategoryPillWithInlineDuration
              ambientalTitleOnly
              sleepOverlayMetadataStyle={{ transform: [{ translateX: 3 }, { translateY: -1 }] }}
              overlayGradientLocations={[0.18, 0.48, 1]}
              titleSize={17}
              onViewAll={() => openMusicCollection(collection.id)}
            />
          </React.Fragment>
        ))}
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: theme.gradient[theme.gradient.length - 1] as string }]}>
      <LinearGradient
        colors={theme.gradient as unknown as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={{ paddingTop: stickyHeaderHeight, paddingBottom: 140 + bottomPad }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          const borderActive = y > 2;
          if (borderActive !== stickyBorderActiveRef.current) {
            stickyBorderActiveRef.current = borderActive;
            stickyBorderOpacity.stopAnimation();
            Animated.timing(stickyBorderOpacity, {
              toValue: borderActive ? 1 : 0,
              duration: 220,
              useNativeDriver: true,
            }).start();
          }
          const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
          if (contentOffset.y + layoutMeasurement.height >= contentSize.height - 300) {
            setVisibleCount((c) => c + PAGE_SIZE);
          }
        }}
      >

        {/* ── Contenido ── */}
        <AnimatedTabContent animKey="music-carousels">
          {renderContent()}
        </AnimatedTabContent>
      </ScrollView>

      <ContextSearchModal
        visible={searchVisible}
        onClose={() => setSearchVisible(false)}
        items={searchItems}
        scope="sounds"
        contextKey="musica-sonidos"
        popularTerms={TABS.slice(0, 3).map((tab) => tab.label)}
        placeholder="Buscar en Música..."
        emptyTitle="Busca en Música"
        emptySubtitle="Ambient, enteógena, tribal y más."
        onSelect={(item) => {
          const session = getSessionById(item.id);
          if (!session) return false;
          if (session.skipMiniPlayer) { playSession(session); return true; }
          playSession(session);
          router.push("/player" as never);
          return true;
        }}
      />
      <SortSheet visible={sortVisible} current={sort} onSelect={setSort} onClose={() => setSortVisible(false)} />
      <SessionActionsSheet session={selectedSession} visible={!!selectedSession} onClose={() => setSelectedSession(null)} />

      {/* ── Vista "Todas las sesiones" (desliza desde la derecha) ── */}
      <Modal visible={allVisible} transparent animationType="none" onRequestClose={closeAll} statusBarTranslucent>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: theme.gradient[theme.gradient.length - 1] as string, transform: [{ translateX: slideX }] }]}>
          <LinearGradient colors={theme.gradient as unknown as [string, string, ...string[]]} style={StyleSheet.absoluteFill} />
          <View style={{ flexDirection: "row", alignItems: "center", paddingTop: topPad + 14, paddingHorizontal: H_PAD, paddingBottom: 14, gap: 4 }}>
            <Pressable onPress={closeAll} hitSlop={12} style={{ padding: 4 }}>
              <Feather name="chevron-left" size={28} color="#FBFBFB" />
            </Pressable>
            <Text style={{ fontFamily: "Manrope", fontSize: 18, fontWeight: "700", color: "#FBFBFB", flex: 1 }}>Toda la Música y Sonidos</Text>
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
        onLayout={(e) => setStickyHeaderHeight(e.nativeEvent.layout.height)}
        style={[styles.stickyHeader, useDiscoverStickyStyle && styles.stickyHeaderFadeOverflow, { paddingTop: topPad + 2 }]}
      >
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: theme.gradient[0] as string },
          ]}
        />
        <View style={styles.stickyHeaderRow}>
          <View style={styles.stickyHeaderSpacer} />
          <View style={styles.stickyTitleCol}>
            <Text style={styles.stickyTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
              Música
            </Text>
          </View>
          <View style={styles.stickyHeaderSpacer}>
            <Pressable
              onPress={() => setSearchVisible(true)}
              hitSlop={10}
              style={[
                styles.headerSearchButton,
                isIndigoThemeId(theme.id) && { backgroundColor: "rgba(0,0,0,0.28)" },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Buscar en Música"
              testID="music-sticky-search-button"
            >
              <Feather name="search" size={24} color={TEXT} />
            </Pressable>
          </View>
        </View>
        <Pressable
          onPress={backOverride ?? (() => router.back())}
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
        <View style={{ marginTop: 14 }}>
          <ChipRow
            tabs={TABS}
            activeTab={null}
            onSelect={(id) => id && openMusicCollection(id)}
          />
        </View>
         <Animated.View style={[styles.stickyBorder, { opacity: stickyBorderOpacity }]} />
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0B0811" },

  header: { paddingHorizontal: H_PAD, paddingBottom: 10, minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  backBtn: { position: "absolute", left: H_PAD, width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  pageTitle: { fontFamily: "Manrope", fontSize: 18, lineHeight: 24, fontWeight: "700", color: TEXT, letterSpacing: 0.2 },
  stickyHeader: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 20, minHeight: 48, paddingHorizontal: H_PAD, paddingBottom: 6, alignItems: "center", justifyContent: "center" },
  stickyHeaderFadeOverflow: { overflow: "visible" },
  stickyBorder: { position: "absolute", left: 0, right: 0, bottom: 0, height: 1, backgroundColor: "rgba(255,255,255,0.07)" },
  stickyHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 6 },
  stickyHeaderSpacer: { width: 40 },
  stickyTitleCol: { flex: 1, alignItems: "center" },
  stickyTitle: { fontFamily: "Manrope", fontSize: 18, lineHeight: 21, fontWeight: "700", color: TEXT, letterSpacing: 0.2, textAlign: "center" },
  headerBtn: { width: 45, height: 45, alignItems: "center", justifyContent: "center" },
  headerSearchButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.28)" },
  headerTitleCol: { flex: 1, alignItems: "center" },
  headerTitle: { fontFamily: "Manrope", fontSize: 18, fontWeight: "400", color: "#FBFBFB", letterSpacing: 0.2, textAlign: "center", includeFontPadding: false, textAlignVertical: "center" },
  headerSubtitle: { fontFamily: "Manrope", fontSize: 11, color: "#f7f7f7", letterSpacing: 0.3, marginTop: 1, opacity: 0.7 },
  heroOverlayLeft: { position: "absolute", left: H_PAD, zIndex: 10 },
  heroOverlayRight: { position: "absolute", right: H_PAD, zIndex: 10 },

  heroArea: { height: 148, position: "relative" },
  lotoBtn: { width: 45, height: 45, borderRadius: 22.5, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  heroIconFloat: { position: "absolute", bottom: 13, left: 0, right: 0, alignItems: "center", zIndex: 2 },
  heroIconGlow: { borderRadius: 28, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  heroIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#1B060F", borderWidth: 2, borderColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", overflow: "hidden" },

  profileCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingBottom: 14 },
  profileTitle: { fontFamily: "Manrope", fontSize: 27, fontWeight: "700", color: TEXT, letterSpacing: 0.3, textAlign: "left", transform: [{ translateY: -4 }] },
  catIconCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(0,0,0,0.15)", borderWidth: 2, borderColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", transform: [{ translateY: -4 }] },
  profileDesc: { fontFamily: "Manrope", fontSize: 13, color: "rgba(255,255,255,0.90)", lineHeight: 18, textAlign: "center", maxWidth: 280, marginTop: -4, marginBottom: 28 },

  dividerLine: { height: 0 },
  dividerShadow: { height: 12, marginTop: 0 },

  chipsArea: { paddingTop: 0, paddingBottom: 15, overflow: "visible", marginTop: 17, paddingHorizontal: H_PAD },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(212,175,55,0.15)", marginHorizontal: H_PAD, marginTop: 8 },
  chipRowWrapper: { position: "relative", marginHorizontal: -H_PAD },
  chipRowBorder: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.06)", marginTop: 11, marginHorizontal: H_PAD },
  chipRow: { flexGrow: 0 },
  chipRowContent: { flexDirection: "row", gap: 8, paddingVertical: 2, paddingHorizontal: H_PAD },
    chip: { height: 51, paddingHorizontal: 16, borderRadius: 27, overflow: "hidden", flexDirection: "row", gap: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.28)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)" },
  chipTibet: { backgroundColor: "rgba(0,0,0,0.28)" },
  chipIndigo: { backgroundColor: "rgba(0,0,0,0.28)" },
  chipIndigo2Inactive: { backgroundColor: "rgba(0,0,0,0.28)", borderColor: "rgba(255,255,255,0.2)" },
  chipBorder: {},
  chipBorderSel: {},
  chipUnsel: {},
    chipSel: { backgroundColor: "#F9F9F9", borderWidth: 0 },
  chipText: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600", color: TEXT, textAlign: "center" },
  chipTextSel: { fontFamily: "Manrope", color: "#060A0F", fontWeight: "600" },
  chipTextIndigoSel: { color: "#F9F9F9" },

  sectionLabel: { fontFamily: "Manrope", fontSize: 11, fontWeight: "400", color: TEXT, paddingHorizontal: H_PAD, paddingTop: 5, paddingBottom: 4 },
  scroll: { flex: 1 },
  controlRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: H_PAD, paddingTop: 12, paddingBottom: 8 },
  sortBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  sessionGrid: { flexDirection: "row", flexWrap: "wrap", gap: CARD_GAP, paddingHorizontal: H_PAD, marginTop: 18, marginBottom: 6 },
  featuredTitle: { fontFamily: "Manrope", fontSize: 17, fontWeight: "700", color: TEXT, paddingHorizontal: H_PAD, marginTop: 30 },
  featuredRow: { paddingHorizontal: H_PAD, gap: 13, paddingTop: 21 },
  carouselSections: { marginTop: -3 },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    marginHorizontal: H_PAD,
    marginTop: 26,
    backgroundColor: "rgba(249,249,249,0.18)",
  },
  emptyState: { alignItems: "center", paddingTop: 80, paddingHorizontal: H_PAD },
  loadMoreFooter: { alignItems: "center", paddingVertical: 20 },
  emptyTitle: { fontFamily: "Manrope", fontSize: 17, fontWeight: "700", color: TEXT, textAlign: "center", marginBottom: 8 },
  emptySub: { fontFamily: "Manrope", fontSize: 13, color: MUTED, textAlign: "center", lineHeight: 20 },

  sortSheet: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#210911", borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 10, paddingHorizontal: 20 },
  sortSheetHandle: { alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(74,12,12,0.35)", marginBottom: 16 },
  sortSheetTitle: { fontFamily: "Manrope", color: TEXT, fontSize: 15, fontWeight: "700", marginBottom: 12 },
  sortSheetRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(61,14,22,0.40)" },
  sortSheetLabel: { fontFamily: "Manrope", color: MUTED, fontSize: 15, flex: 1 },
  sortSheetLabelActive: { fontFamily: "Manrope", color: TEXT, fontWeight: "600" },
  qsBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  qsSheet: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#142761", borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 10, paddingHorizontal: 20 },
  qsHandle: { alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(212,175,55,0.25)", marginBottom: 14 },
  qsHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  qsThumb: { width: 54, height: 54, borderRadius: 10 },
  qsTitle: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700", color: TEXT, marginBottom: 2 },
  qsSub: { fontFamily: "Manrope", fontSize: 12, color: MUTED },
  qsClose: { padding: 4 },
  qsDivider: { height: 0, marginBottom: 6 },
  qsRow: { flexDirection: "row", alignItems: "center", paddingVertical: 16, gap: 14 },
  qsRowBorder: {},
  qsIcon: { width: 22 },
  qsLabel: { fontFamily: "Manrope", flex: 1, fontSize: 15, color: TEXT },
  headerIconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  chipsShadow: { position: "absolute", left: 0, right: 0, bottom: -7, height: 7 },
});
