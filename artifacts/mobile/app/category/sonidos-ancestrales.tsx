import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import MaskedView from "@react-native-masked-view/masked-view";
import Svg, { Path } from "react-native-svg";
import { SessionCarousel } from "@/components/SessionCarousel";
import {
  SESSION_CARD_METADATA_HEIGHT_SCALE,
  SessionCardMetadataOverlay,
} from "@/components/SessionCardMetadataOverlay";
import {
  CONTENT_CAROUSEL_HEIGHT_SCALE,
  getContentCarouselCardWidth,
} from "@/constants/carousel";
import { router } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  ActivityIndicator, Animated, Dimensions, Easing, Keyboard, Modal, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GhostPill } from "@/components/GhostPill";
import { AddToFolderSheet } from "@/components/AddToFolderSheet";
import { AddToPlaylistSheet } from "@/components/AddToPlaylistSheet";
import { TimerSheet } from "@/components/TimerSheet";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { useCatalog } from "@/context/CatalogContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { getSceneTabSurface } from "@/utils/scene-tab";
import { useCategoryOverlay } from "@/context/CategoryOverlayContext";
import { useBackOverride } from "@/context/BackOverrideContext";
import { hexToRgba } from "@/utils/color";
import { getArtist } from "@/data/artists";
import { getGuide } from "@/data/guides";
import { SESSIONS, getSessionById, type Session } from "@/data/sessions";

const { width } = Dimensions.get("window");
const H_PAD = 14;
const RECENT_CARD_W = Math.round((width - H_PAD * 2) / 1.85);
const FEATURED_CARD_W = getContentCarouselCardWidth(width, H_PAD);
const GOLD  = "#F9F9F9";

const TEXT  = "#FBFBFB";
const MUTED = "#c2c2c2";
const GRID_GAP    = 10;
const cellW = (width - H_PAD * 2 - GRID_GAP * 2) / 3;
const cardW = (width - H_PAD * 2 - 20) / 2;
const HERO_H   = 148;

type CatTab   = string;
type SortMode = "recientes" | "nuevas" | "populares";

function TibetanBowlIcon({ size = 20, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 8h18M4.5 8Q4 16 12 17.5Q20 16 19.5 8M9.5 17.5h5"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// Tags agrupados bajo cada tab fija (no generan tab propia si ya están acá)
const TAG_ICONS: Record<string, string> = {
  "cuencos tibetanos":  "disc",
  "cuencos de cuarzo":  "disc",
  "mix de cuencos":     "disc",
  "cuencos y gongs":    "target",
  "gongs":              "target",
  "campanas":           "bell",
  "full instrumentos":  "music",
  "vientos":            "wind",
  "cantos":             "mic",
  "percusión":          "zap",
  "selva":              "feather",
  "tambor":             "zap",
  "didgeridoo":         "wind",
  "flauta":             "wind",
};

const SORT_OPTIONS: { id: SortMode; label: string; icon: string }[] = [
  { id: "recientes", label: "Escuchadas recientemente", icon: "clock" },
  { id: "nuevas",    label: "Nuevas sesiones",          icon: "plus-circle" },
  { id: "populares", label: "Las más escuchadas",       icon: "headphones" },
];

function getSessionsForTab(tab: string | null) {
  const all = SESSIONS.filter((s) => s.categoryId === "sonidos-ancestrales");
  if (!tab) return all;
  return all.filter((s) => s.ancestralTag === tab);
}

function applySort(arr: ReturnType<typeof getSessionsForTab>, sort: SortMode, playCounts: Record<string,number> = {}) {
  if (sort === "nuevas")    return [...arr].sort((a,b) => {
    if (a.isNew && !b.isNew) return -1;
    if (!a.isNew && b.isNew) return 1;
    const aNum = parseInt(a.id); const bNum = parseInt(b.id);
    const aIsNum = !isNaN(aNum);  const bIsNum = !isNaN(bNum);
    if (!aIsNum && bIsNum)  return -1;
    if (aIsNum  && !bIsNum) return  1;
    if (!aIsNum && !bIsNum) {
      const aT = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bT = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bT - aT;
    }
    return bNum - aNum;
  });
  if (sort === "populares") return [...arr].sort((a,b) => (playCounts[b.id]??0) - (playCounts[a.id]??0));
  return arr;
}

// ── Shared sub-components ─────────────────────────────────────────────────────
function SortSheet({ visible, current, onSelect, onClose }: { visible: boolean; current: SortMode; onSelect: (s: SortMode) => void; onClose: () => void }) {
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
            <Pressable key={opt.id} style={({ pressed }) => [styles.sortSheetRow, { opacity: pressed ? 0.7 : 1 }]} onPress={() => { onSelect(opt.id); onClose(); }}>
              <Feather name={opt.icon as never} size={17} color={active ? GOLD : MUTED} />
              <Text style={[styles.sortSheetLabel, active && styles.sortSheetLabelActive]}>{opt.label}</Text>
              {active && <Feather name="check" size={17} color={GOLD} style={{ marginLeft: "auto" }} />}
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
    Animated.timing(opacity, { toValue: 1, duration: 1200, easing: Easing.out(Easing.quad), useNativeDriver: true }).start();
  }, [animKey]); // eslint-disable-line react-hooks/exhaustive-deps
  return <Animated.View style={{ opacity }}>{children}</Animated.View>;
}

function Chip({ label, icon, sel, onPress }: { label: string; icon?: string; sel: boolean; onPress: () => void }) {
  const { theme } = useSceneTheme();
  const contentColor = "#F4F4F4";

  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.chip, theme.id === "tibet" && styles.chipTibet, theme.id === "indigo" && styles.chipIndigo, { borderColor: getSceneTabSurface(theme.id) }, sel && styles.chipSel, { opacity: pressed ? 0.7 : 1 }]}>
      {sel && <LinearGradient colors={["#8C4912", "#7A3C0A"]} start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }} style={StyleSheet.absoluteFill} />}
      <Feather name={(icon ?? "grid") as never} size={22} color={contentColor} />
      <Text style={[styles.chipText, sel && styles.chipTextSel, sel && theme.id === "indigo" && styles.chipTextIndigoSel]}>{label}</Text>
    </Pressable>
  );
}

function ChipRow({ tabs, activeTab, onSelect, onClear }: { tabs: {id: string; label: string; icon?: string}[]; activeTab: CatTab|null; onSelect: (id: CatTab)=>void; onClear: ()=>void }) {
  return (
    <View style={styles.chipRowWrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.chipRow} contentContainerStyle={styles.chipRowContent}>
        <Chip label="Todos" icon="grid" sel={activeTab === null} onPress={onClear} />
        {tabs.map((t) => (
          <Chip key={t.id} label={t.label} icon={t.icon} sel={activeTab === t.id}
            onPress={() => activeTab === t.id ? onClear() : onSelect(t.id)} />
        ))}
      </ScrollView>
    </View>
  );
}

function SearchOverlay({ visible, onClose, categoryId, placeholderTxt }: { visible: boolean; onClose: ()=>void; categoryId: string; placeholderTxt: string }) {
  const [q, setQ]   = useState("");
  const inputRef    = useRef<TextInput>(null);
  const [kbH,setKbH]   = useState(0);
  const [kbOk,setKbOk] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const results = useMemo(() => q.trim().length>=1 ? SESSIONS.filter((s) => s.categoryId===categoryId && s.title.toLowerCase().includes(q.toLowerCase())) : [], [q, categoryId]);
  useEffect(() => {
    if (!visible) { setQ(""); setKbOk(false); setKbH(0); fade.setValue(0); return; }
    const show = Keyboard.addListener("keyboardDidShow", (e) => { setKbH(e.endCoordinates.height); setKbOk(true); Animated.timing(fade,{toValue:1,duration:180,useNativeDriver:true}).start(); });
    const hide = Keyboard.addListener("keyboardDidHide", () => { setKbOk(false); fade.setValue(0); });
    return () => { show.remove(); hide.remove(); };
  }, [visible, fade]);
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose} onShow={() => inputRef.current?.focus()}>
      <View style={[styles.searchModalRoot, { paddingBottom: kbH }]}>
        <View style={styles.searchOverlay}>
          <View style={styles.searchBar}>
            <Feather name="search" size={16} color={MUTED} />
            <TextInput ref={inputRef} style={styles.searchInput} placeholder={placeholderTxt} placeholderTextColor={MUTED} value={q} onChangeText={setQ} returnKeyType="search" />
          </View>
          <Pressable onPress={onClose} style={styles.cancelBtn}><Text style={styles.cancelText}>Cancelar</Text></Pressable>
        </View>
        {q.length===0 && kbOk && (
          <Animated.View style={[styles.searchEmpty, { opacity: fade }]}>
            <Feather name="music" size={48} color={GOLD} style={{ marginBottom: 16 }} />
            <Text style={styles.searchEmptyTitle}>{placeholderTxt}</Text>
          </Animated.View>
        )}
        {results.length>0 && (
          <ScrollView style={{ flex:1, backgroundColor:"#210911" }} contentContainerStyle={{ padding: H_PAD, gap: 9 }} keyboardShouldPersistTaps="handled">
            {results.map((s) => <CategoryCard key={s.id} session={s} horizontal />)}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

function CategoryCard({
  session, width: cardWidth = 200, horizontal = false, landscape = false, onLongPress, onOptions,
}: {
  session: Session; width?: number; horizontal?: boolean; landscape?: boolean; onLongPress?: ()=>void; onOptions?: ()=>void;
}) {
  const { isPremium } = usePremium();
  const { playSession } = usePlayer();
  const locked   = !!session.isPremium && !isPremium;
  const handlePress = () => {
    if (locked) { router.push("/membresia" as never); return; }
    if (session.skipMiniPlayer) { playSession(session); return; }
    // Sonidos Ancestrales: siempre abre el reproductor (no pantalla de detalle).
    playSession(session);
    router.push("/player" as never);
  };
  const authorObj = session.guideId ? getGuide(session.guideId) : getArtist(session.artistId);
  const author = authorObj.name;
  const authorPhoto = authorObj.photo;

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
            authorName={author}
          />
          {locked && <View style={ac.lockDot}><Feather name="lock" size={9} color="#fff" /></View>}
        </View>
      </Pressable>
    );
  }

  if (horizontal) {
    return (
      <Pressable onPress={handlePress} onLongPress={onLongPress} style={({ pressed }) => [ac.hRow, { opacity: pressed?0.8:1 }]}>
        <View style={ac.hImgWrap}>
          <Image source={session.image} style={ac.hImage} contentFit="cover" />
          <View style={ac.hImgOverlay} />
          {locked && <View style={ac.lockDot}><Feather name="lock" size={9} color="#fff" /></View>}
        </View>
        <View style={ac.hContent}>
          <Text style={ac.hDuration}>{session.durationLabel}</Text>
          <Text style={ac.hTitle} numberOfLines={2}>{session.title}</Text>
          {!!author && (
            <View style={ac.hAuthorRow}>
              <Text style={ac.hAuthor} numberOfLines={1}>{author}</Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  }
  return (
    <Pressable onPress={handlePress} onLongPress={onLongPress} style={({ pressed }) => [ac.card, { width: cardWidth, opacity: pressed?0.85:1 }]}>
      <View style={[ac.imgContainer, { height: (cardWidth + 50) * SESSION_CARD_METADATA_HEIGHT_SCALE, aspectRatio: undefined }]}>
        <Image source={session.image} style={ac.cardImage} contentFit="cover" />
        <SessionCardMetadataOverlay
          categoryId={session.categoryId}
          durationLabel={session.durationLabel}
          title={session.title}
          authorName={author}
        />
        {locked && <View style={ac.lockDot}><Feather name="lock" size={9} color="#fff" /></View>}
      </View>
    </Pressable>
  );
}

const ac = StyleSheet.create({
  hRow:{ flexDirection:"row", alignItems:"center", gap:12, paddingVertical:6, marginBottom:11 },
  hImgWrap:{ width:87, height:87, borderRadius:8, overflow:"hidden" },
  hImgOverlay:{ ...StyleSheet.absoluteFillObject, backgroundColor:"rgba(0,0,0,0.18)" },
  hImage:  { width:87, height:87 },
  hContent:{ flex:1, justifyContent:"center", gap:2 },
  hDuration:{ fontFamily: "Manrope", fontSize:11, fontWeight:"400", color:MUTED },
  hDurLabel:{ fontFamily: "Manrope", position:"absolute", bottom:6, left:8, fontSize:13, fontWeight:"700", color:"#fff", textShadowColor:"rgba(0,0,0,0.85)", textShadowOffset:{width:0,height:1}, textShadowRadius:4 },
  hTitle:   { fontFamily: "Manrope", fontSize:13, fontWeight:"600", color:TEXT, lineHeight:18 },
  hAuthor:  { fontFamily: "Manrope", fontSize:11, color:MUTED, flex:1 },
  hAuthorRow:{ flexDirection:"row", alignItems:"center", gap:6, marginTop:1 },
  hAuthorAvatar:{ width:20, height:20, borderRadius:10 },
  hDotsBtn: { paddingLeft:12, paddingRight:4, paddingVertical:8, alignItems:"center", justifyContent:"center", gap:3, flexDirection:"row" },
  hDot: { width:4, height:4, borderRadius:2, backgroundColor: MUTED },
  card:     { gap:6 },
  imgContainer:{ width:"100%", aspectRatio:1, borderRadius:17, overflow:"hidden" },
  cardImage:   { width:"100%", height:"100%" },
  cardTitle:   { fontFamily: "Manrope", fontSize:13, fontWeight:"600", color:TEXT, lineHeight:18 },
  cardAuthor:  { fontFamily: "Manrope", fontSize:11, color:"#F4F4F4" },
  durationBadge:{ position:"absolute", bottom:8, left:8, borderRadius:8, paddingHorizontal:8, paddingVertical:3 },
  durationBadgeText:{ fontFamily: "Manrope", fontSize:11, fontWeight:"600", color:"#fff" },
  lockDot:{ position:"absolute", top:6, right:6, width:20, height:20, borderRadius:10, backgroundColor:"rgba(0,0,0,0.55)", alignItems:"center", justifyContent:"center" },
  lCard:{ width:FEATURED_CARD_W },
  lImgWrap:{ width:FEATURED_CARD_W, height:237 * SESSION_CARD_METADATA_HEIGHT_SCALE * CONTENT_CAROUSEL_HEIGHT_SCALE, borderRadius:14, overflow:"hidden" },
  lDurPill:{ position:"absolute", bottom:8, left:8, borderRadius:8, paddingHorizontal:8, paddingVertical:3 },
  
  lDur:{ fontFamily:"Manrope", fontSize:11, fontWeight:"600", color:"#fff" },
  lTitle:{ fontFamily:"Manrope", fontSize:13, fontWeight:"600", color:TEXT, lineHeight:17, marginTop:10 },
  lAuthor:{ fontFamily:"Manrope", fontSize:11, color:MUTED, marginTop:3 },
});

function SessionQuickSheet({ session, onClose, onPlaylist }: { session: Session|null; onClose:()=>void; onPlaylist:()=>void }) {
  const insets = useSafeAreaInsets();
  const slide  = useRef(new Animated.Value(300)).current;
  const { isFavorite, toggleFavorite, sleepTimerRemaining } = usePlayer();
  const [showTimer,  setShowTimer]  = useState(false);
  const [showFolder, setShowFolder] = useState(false);
  useEffect(() => {
    if (session) { setShowTimer(false); setShowFolder(false); Animated.spring(slide,{toValue:0,useNativeDriver:true,bounciness:0}).start(); }
    else slide.setValue(300);
  }, [session, slide]);
  if (!session) return null;
  const fav = isFavorite(session.id);
  const timerLabel = sleepTimerRemaining === null ? "Apagado" : sleepTimerRemaining >= 3600 ? `${Math.round(sleepTimerRemaining/3600)}h` : `${Math.round(sleepTimerRemaining/60)} min`;
  return (
    <Modal visible={!!session} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={styles.qsBackdrop} onPress={onClose} />
      <Animated.View style={[styles.qsSheet,{paddingBottom:Math.max(insets.bottom,24),transform:[{translateY:slide}]}]}>
        <View style={styles.qsHandle} />
        <View style={styles.qsHeader}>
          <Image source={session.image as never} style={styles.qsThumb} contentFit="cover" />
          <View style={{flex:1}}>
            <Text style={styles.qsTitle} numberOfLines={2}>{session.title}</Text>
            <Text style={styles.qsSub}>{session.categoryLabel} · {session.durationLabel}</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={10} style={styles.qsClose}><Feather name="x" size={20} color={MUTED} /></Pressable>
        </View>
        <View style={styles.qsDivider} />

        <Pressable onPress={() => setShowTimer(true)} style={({pressed})=>[styles.qsRow,{opacity:pressed?0.7:1}]}>
          <Feather name="clock" size={20} color={TEXT} style={styles.qsIcon} />
          <Text style={styles.qsLabel}>Temporizador</Text>
          <Text style={styles.qsRight}>{timerLabel}</Text>
        </Pressable>
        <Pressable onPress={() => {}} style={({pressed})=>[styles.qsRow,{opacity:pressed?0.7:1}]}>
          <Feather name="download" size={20} color={TEXT} style={styles.qsIcon} />
          <Text style={styles.qsLabel}>Descargar</Text>
          <Feather name="chevron-right" size={16} color={MUTED} />
        </Pressable>
        <Pressable onPress={() => { toggleFavorite(session.id); onClose(); }} style={({pressed})=>[styles.qsRow,{opacity:pressed?0.7:1}]}>
          <Feather name="heart" size={20} color={fav?"#E05C5C":TEXT} style={styles.qsIcon} />
          <Text style={[styles.qsLabel,fav&&{color:"#E05C5C"}]}>{fav?"Quitar de favoritos":"Agregar a favoritos"}</Text>
          <Feather name="chevron-right" size={16} color={MUTED} />
        </Pressable>
        <Pressable onPress={() => setShowFolder(true)} style={({pressed})=>[styles.qsRow,{opacity:pressed?0.7:1}]}>
          <Feather name="folder-plus" size={20} color={TEXT} style={styles.qsIcon} />
          <Text style={styles.qsLabel}>Añadir a carpeta</Text>
          <Feather name="chevron-right" size={16} color={MUTED} />
        </Pressable>
        <Pressable onPress={onPlaylist} style={({pressed})=>[styles.qsRow,{opacity:pressed?0.7:1}]}>
          <Feather name="list" size={20} color={TEXT} style={styles.qsIcon} />
          <Text style={styles.qsLabel}>Añadir a una playlist</Text>
          <Feather name="chevron-right" size={16} color={MUTED} />
        </Pressable>

        <View style={styles.qsSepDivider} />
        <Pressable onPress={() => {}} style={({pressed})=>[styles.qsRow,{opacity:pressed?0.7:1}]}>
          <Feather name="alert-circle" size={20} color={MUTED} style={styles.qsIcon} />
          <Text style={[styles.qsLabel,{color:MUTED}]}>Informar un problema</Text>
          <Feather name="chevron-right" size={16} color={MUTED} />
        </Pressable>

        <TimerSheet visible={showTimer} onClose={() => setShowTimer(false)} />
        <AddToFolderSheet visible={showFolder} sessionId={session.id} onClose={() => setShowFolder(false)} />
      </Animated.View>
    </Modal>
  );
}

// ── Pantalla ──────────────────────────────────────────────────────────────────
export default function SonidosAncestalesScreen() {
  const { openCategory } = useCategoryOverlay();
  const insets    = useSafeAreaInsets();
  const topPad    = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS==="web" ? 34 : insets.bottom;
  const { isFavorite, toggleFavorite, history, playSession, favorites } = usePlayer();
  const { isPremium } = usePremium();
  const { version } = useCatalog();
  const { activeSceneId, theme } = useSceneTheme();
  const backOverride = useBackOverride();
  const profileSectionBackground = activeSceneId === "tibet"
    ? "rgba(0,0,0,0.15)"
    : activeSceneId === "indigo"
      ? "rgba(42,40,64,0.65)"
      : "rgba(255,255,255,0.05)";

  // TABS dinámicas: un chip por cada ancestralTag distinto en las sesiones
  const TABS = useMemo(() => {
    const ancestralSessions = SESSIONS.filter((s) => s.categoryId === "sonidos-ancestrales");
    const uniqueTags = [...new Set(ancestralSessions.map((s) => s.ancestralTag).filter(Boolean))] as string[];
    return uniqueTags.map((tag) => ({ id: tag, label: tag, icon: TAG_ICONS[tag.toLowerCase()] }));
  }, [version]);

  const [activeTab,         setActiveTab]         = useState<CatTab|null>(null);
  const [sort,              setSort]              = useState<SortMode>("recientes");
  const [sortVisible,       setSortVisible]       = useState(false);
  const [searchVisible,     setSearchVisible]     = useState(false);
  const [selectedSession,   setSelectedSession]   = useState<Session|null>(null);
  const [playlistSessionId, setPlaylistSessionId] = useState<string|null>(null);
  const [allVisible,        setAllVisible]         = useState(false);
  const slideX = useRef(new Animated.Value(width)).current;
  const closeAll = () => {
    Animated.timing(slideX, { toValue: width, duration: 280, easing: Easing.in(Easing.cubic), useNativeDriver: true }).start(() => setAllVisible(false));
  };
  useEffect(() => {
    if (!allVisible) return;
    slideX.setValue(width);
    Animated.timing(slideX, { toValue: 0, duration: 320, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [allVisible]); // eslint-disable-line react-hooks/exhaustive-deps

  const scrollRef  = useRef<ScrollView>(null);
  const HERO_AREA_H = HERO_H;
  const stickyHeaderOpacity = useRef(new Animated.Value(0)).current;
  const [stickyActive,  setStickyActive]  = useState(false);
  const [chipsOffsetY,  setChipsOffsetY]  = useState(9999);
  useEffect(() => {
    Animated.timing(stickyHeaderOpacity, {
      toValue: stickyActive ? 1 : 0,
      duration: 350,
      useNativeDriver: true,
    }).start();
  }, [stickyActive]);

  const playCounts = useMemo(()=>{ const c:Record<string,number>={}; for (const e of history) c[e.sessionId]=(c[e.sessionId]??0)+1; return c; },[history]);
  const sessions   = useMemo(()=>applySort(getSessionsForTab(activeTab),sort,playCounts),[activeTab,sort,playCounts,version]);
  const sortLabel  = sort==="recientes"?"Escuchadas recientemente":sort==="nuevas"?"Nuevas sesiones":"Las más escuchadas";

  // ── Shuffle por entrada/tab ──
  const allTabSessions = useMemo(()=>getSessionsForTab(activeTab),[activeTab,version]);

  const recentInCategory = useMemo(() => {
    const tabIds = activeTab !== null ? new Set(allTabSessions.map((s) => s.id)) : null;
    const seen = new Set<string>(); const result: Session[] = [];
    for (const h of history) {
      if (seen.has(h.sessionId)) continue;
      seen.add(h.sessionId);
      const s = getSessionById(h.sessionId);
      if (s && s.categoryId === "sonidos-ancestrales" && (tabIds === null || tabIds.has(s.id))) result.push(s);
      if (result.length === 10) break;
    }
    return result;
  }, [history, activeTab, allTabSessions]);

  const favoritesInCategory = useMemo(() => {
    const tabIds = activeTab !== null ? new Set(allTabSessions.map((s) => s.id)) : null;
    const result: Session[] = [];
    for (const id of favorites) {
      const s = getSessionById(id);
      if (s && s.categoryId === "sonidos-ancestrales" && (tabIds === null || tabIds.has(s.id))) result.push(s);
    }
    return result;
  }, [favorites, activeTab, allTabSessions]);

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
    () => (activeTab === null ? allTabSessions.filter((s) => s.isFeaturedCategory) : []),
    [allTabSessions, activeTab]
  );

  const PAGE_SIZE = 20;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [sessions]);
  const visibleSessions = sessions.slice(0, visibleCount);
  const hasMore = visibleCount < sessions.length;

  const renderContent = () => {
    if (shuffledSessions.length===0) return (
      <View style={styles.emptyState}>
        <Feather name="music" size={48} color={GOLD} style={{marginBottom:16}} />
        <Text style={styles.emptyTitle}>Próximamente en {activeTab ? TABS.find((t)=>t.id===activeTab)?.label : "Sonoterapia"}</Text>
        <Text style={styles.emptySub}>Estamos preparando este espacio con las mejores sesiones sonoras.</Text>
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
              {featuredSessions.map((s)=>(
                <CategoryCard key={`feat-${s.id}`} session={s} landscape onLongPress={()=>setSelectedSession(s)} onOptions={()=>setSelectedSession(s)} />
              ))}
            </ScrollView>
          </>
        )}
        {activeTab === null && recentInCategory.length > 0 && (
          <>
            <SessionCarousel
              title="Escuchadas recientemente"
              sessions={recentInCategory}
              isPremium={isPremium}
              onPress={(s) => { if (s.skipMiniPlayer) { playSession(s); return; } if (s.skipDetail) { playSession(s); router.push('/player' as never); return; } playSession(s); openCategory(`/session/${s.id}`); }}
               style={{ marginTop: 33, marginBottom: 0 }}
              cardWidth={RECENT_CARD_W}
              titleSize={18}
              showCardMetadata
            />
          </>
        )}
        {activeTab === null && favoritesInCategory.length > 0 && (
          <>
            <SessionCarousel
              title="Favoritos"
              sessions={favoritesInCategory}
              isPremium={isPremium}
              onPress={(s) => { if (s.skipMiniPlayer) { playSession(s); return; } if (s.skipDetail) { playSession(s); router.push('/player' as never); return; } playSession(s); openCategory(`/session/${s.id}`); }}
               style={{ marginTop: 53, marginBottom: 0 }}
              cardWidth={RECENT_CARD_W}
              titleSize={18}
              showCardMetadata
            />
          </>
        )}
        {activeTab === null && (() => {
          const visibleTabs = TABS.filter((tab) => getSessionsForTab(tab.id).length > 0);
          return visibleTabs.map((tab, idx) => {
            const tabSessions = getSessionsForTab(tab.id);
            const preview = tabSessions.slice(0, 5);
            const hasMore = tabSessions.length > 5;
            const isLast = idx === visibleTabs.length - 1;
            return (
              <React.Fragment key={tab.id}>
                <SessionCarousel
                  title={tab.label}
                  sessions={preview}
                  isPremium={isPremium}
                  onPress={(s) => { if (s.skipMiniPlayer) { playSession(s); return; } if (s.skipDetail) { playSession(s); router.push('/player' as never); return; } playSession(s); openCategory(`/session/${s.id}`); }}
                   style={{ marginTop: 53, marginBottom: 0 }}
                  cardWidth={RECENT_CARD_W}
                  titleSize={18}
                  showCardMetadata
                  onViewAll={hasMore ? () => setActiveTab(tab.id as CatTab) : undefined}
                />
              </React.Fragment>
            );
          });
        })()}
        {activeTab === null && (
          <Pressable
            onPress={() => setAllVisible(true)}
            style={({ pressed }) => [{ flexDirection: "row", alignItems: "center", justifyContent: "center", paddingVertical: 18, gap: 6, marginTop: 4, opacity: pressed ? 0.7 : 1 }]}
          >
            <Text style={{ fontFamily: "Manrope", fontSize: 15, fontWeight: "600", color: "#F9F9F9" }}>Toda la Sonoterapia</Text>
            <Feather name="chevron-right" size={16} color="#F9F9F9" />
          </Pressable>
        )}
        {activeTab !== null && (
          <>
            <View style={styles.sessionGrid}>
              {visibleSessions.map((s)=>(
                <CategoryCard key={s.id} session={s} width={cardW} onLongPress={()=>setSelectedSession(s)} onOptions={()=>setSelectedSession(s)} />
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
      <LinearGradient
        colors={theme.gradient as unknown as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
      />
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
          if (hasMore && contentOffset.y + layoutMeasurement.height >= contentSize.height - 300) {
            setVisibleCount((c) => Math.min(c + PAGE_SIZE, sessions.length));
          }
        }}
      >

        {/* ── Header ── */}
        <View style={[styles.header, { paddingTop: topPad + 8 }]}>
          <Pressable
            onPress={backOverride ?? (() => router.back())}
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
            Sonoterapia
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
            accessibilityLabel="Buscar en Sonoterapia"
            testID="sound-therapy-search-button"
          >
            <Feather name="search" size={24} color={TEXT} />
          </Pressable>
        </View>

        {/* ── Tabs ── */}
        <View style={styles.chipsArea} onLayout={(e) => setChipsOffsetY(e.nativeEvent.layout.y)}>
          <ChipRow tabs={TABS} activeTab={activeTab}
            onSelect={(id) => setActiveTab(id)}
            onClear={() => setActiveTab(null)}
          />
        </View>

        {/* ── Contenido ── */}
        <AnimatedTabContent animKey={activeTab ?? "all"}>
          {renderContent()}
        </AnimatedTabContent>

      </ScrollView>

      {/* ── Sticky header ── */}
      <Animated.View style={[styles.stickyHeader, { paddingTop: topPad + 8, opacity: stickyHeaderOpacity, backgroundColor: theme.gradient[0] }]} pointerEvents={stickyActive ? "auto" : "none"}>
        <View style={styles.stickyHeaderRow}>
          <View style={styles.stickyHeaderSpacer} />
          <View style={styles.stickyTitleCol}>
            <Text style={styles.stickyTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
              Sonoterapia
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
              accessibilityLabel="Buscar en Sonoterapia"
              testID="sound-therapy-sticky-search-button"
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
        <View style={{ marginTop: 19 }}>
          <ChipRow tabs={TABS} activeTab={activeTab} onSelect={setActiveTab} onClear={() => setActiveTab(null)} />
        </View>
        <View style={styles.stickyTabsDivider} />
      </Animated.View>

      <SearchOverlay visible={searchVisible} onClose={() => setSearchVisible(false)} categoryId="sonidos-ancestrales" placeholderTxt="Buscar en Sonoterapia..." />
      <SortSheet visible={sortVisible} current={sort} onSelect={setSort} onClose={() => setSortVisible(false)} />
      <SessionQuickSheet session={selectedSession} onClose={() => setSelectedSession(null)}
        onPlaylist={() => { if (selectedSession) setPlaylistSessionId(selectedSession.id); setSelectedSession(null); }} />
      <AddToPlaylistSheet visible={playlistSessionId !== null} sessionId={playlistSessionId ?? ""} onClose={() => setPlaylistSessionId(null)} />

      {/* ── Vista "Todas las sesiones" (desliza desde la derecha) ── */}
      <Modal visible={allVisible} transparent animationType="none" onRequestClose={closeAll} statusBarTranslucent>
        <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: theme.gradient[theme.gradient.length - 1] as string, transform: [{ translateX: slideX }] }]}>
          <LinearGradient colors={theme.gradient as unknown as [string, string, ...string[]]} style={StyleSheet.absoluteFill} />
          <View style={{ flexDirection: "row", alignItems: "center", paddingTop: topPad + 14, paddingHorizontal: H_PAD, paddingBottom: 14, gap: 4 }}>
            <Pressable onPress={closeAll} hitSlop={12} style={{ padding: 4 }}>
              <Feather name="chevron-left" size={28} color="#FBFBFB" />
            </Pressable>
            <Text style={{ fontFamily: "Manrope", fontSize: 20, fontWeight: "700", color: "#FBFBFB", flex: 1 }}>Toda la Sonoterapia</Text>
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexDirection: "row", flexWrap: "wrap", columnGap: 20, paddingHorizontal: H_PAD, rowGap: 24, paddingTop: 8, paddingBottom: 120 + bottomPad }}>
            {getSessionsForTab(null).map((s) => (
              <CategoryCard key={s.id} session={s} width={cardW} />
            ))}
          </ScrollView>
        </Animated.View>
      </Modal>

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0B0811" },

  header: { paddingHorizontal: H_PAD, paddingBottom: 12, minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "center" },
  backBtn: { position: "absolute", left: H_PAD, width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  pageTitle: { fontFamily: "Manrope", fontSize: 20, lineHeight: 26, fontWeight: "700", color: TEXT, letterSpacing: 0.2 },
  stickyHeader: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 20, minHeight: 48, paddingHorizontal: H_PAD, paddingBottom: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#1B060F" },
  stickyHeaderRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingBottom: 6 },
  stickyTabsDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginHorizontal: -H_PAD, marginTop: 8 },
  stickyHeaderSpacer: { width: 40 },
  stickyTitleCol: { flex: 1, alignItems: "center" },
  stickyTitle: { fontFamily: "Manrope", fontSize: 20, lineHeight: 23, fontWeight: "700", color: TEXT, letterSpacing: 0.2, textAlign: "center" },
  headerBtn: { width: 45, height: 45, alignItems: "center", justifyContent: "center" },
  headerSearchButton: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.12)" },
  headerTitleCol: { flex: 1, alignItems: "center" },
  headerTitle: { fontFamily: "Manrope", fontSize: 20, fontWeight: "400", color: "#FBFBFB", letterSpacing: 0.2, textAlign: "center", includeFontPadding: false, textAlignVertical: "center" },
  headerSubtitle: { fontFamily: "Manrope", fontSize: 11, color: "#f7f7f7", letterSpacing: 0.3, marginTop: 1, opacity: 0.7 },
  heroOverlayLeft: { position: "absolute", left: H_PAD, zIndex: 10 },
  heroOverlayRight: { position: "absolute", right: H_PAD, zIndex: 10 },

  /* ── Hero ── */
  heroArea: { height: HERO_H, position: "relative" },
  lotoBtn: { width: 45, height: 45, borderRadius: 22.5, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  heroIconFloat: { position: "absolute", bottom: 13, left: 0, right: 0, alignItems: "center", zIndex: 2 },
  heroIconGlow: { borderRadius: 28, shadowColor: "#000", shadowOpacity: 0.15, shadowRadius: 14, shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  heroIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#1B060F", borderWidth: 2, borderColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", overflow: "hidden" },

  /* ── Profile card ── */
  profileCard: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 14, paddingBottom: 14 },
  profileTitle: { fontFamily: "Manrope", fontSize: 27, fontWeight: "700", color: TEXT, letterSpacing: 0.3, textAlign: "left", transform: [{ translateY: -4 }] },
  catIconCircle: { width: 42, height: 42, borderRadius: 21, backgroundColor: "rgba(0,0,0,0.15)", borderWidth: 2, borderColor: "rgba(255,255,255,0.1)", alignItems: "center", justifyContent: "center", transform: [{ translateY: -4 }] },
  profileDesc: { fontFamily: "Manrope", fontSize: 13, color: "rgba(255,255,255,0.90)", lineHeight: 18, textAlign: "center", maxWidth: 280, marginTop: -4, marginBottom: 28 },

  /* ── Tabs (línea subrayada) ── */
  chipsArea: { paddingTop: 10, paddingBottom: 5, overflow: "visible", marginTop: 6, paddingHorizontal: H_PAD },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(212,175,55,0.15)", marginHorizontal: H_PAD, marginTop: 0 },
  chipRowWrapper: { position: "relative", marginHorizontal: -H_PAD },
  chipRowBorder: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.06)", marginTop: 11, marginHorizontal: H_PAD },
  chipRow: { flexGrow: 0 },
  chipRowContent: { flexDirection: "row", gap: 8, paddingVertical: 2, paddingHorizontal: H_PAD },
   chip: { height: 46, paddingHorizontal: 16, borderRadius: 27, overflow: "hidden", flexDirection: "row", gap: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 2 },
  chipTibet: { backgroundColor: "rgba(0,0,0,0.15)" },
  chipIndigo: { backgroundColor: "rgba(42,40,64,0.65)" },
  chipBorder: {},
  chipBorderSel: {},
  chipUnsel: {},
   chipSel: {},
  chipText: { fontFamily: "Manrope", fontSize: 15, fontWeight: "600", color: TEXT, textAlign: "center" },
  chipTextSel: { fontFamily: "Manrope", color: "#0D0A1E", fontWeight: "600" },
  chipTextIndigoSel: { color: "#F9F9F9" },

  /* ── Content ── */
  scroll: { flex: 1 },
  controlRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingHorizontal: H_PAD, height: 30 },
  sortBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  sortText: { fontFamily: "Manrope", fontSize: 13, color: MUTED, fontWeight: "500" },
  viewToggleBtn: { padding: 2 },
  gridOuter: { paddingHorizontal: H_PAD, gap: GRID_GAP },
  gridRow: { flexDirection: "row", gap: GRID_GAP },
  sectionLabel: { fontFamily: "Manrope", fontSize: 11, fontWeight: "400", color: TEXT, paddingHorizontal: H_PAD, paddingTop: 5, paddingBottom: 4 },
  sessionGrid: { flexDirection: "row", flexWrap: "wrap", columnGap: 20, paddingHorizontal: H_PAD, rowGap: 24, marginTop: 18, marginBottom: 6 },
  featuredTitle: { fontFamily: "Manrope", fontSize: 17, fontWeight: "700", color: TEXT, paddingHorizontal: H_PAD, marginTop: 30 },
  featuredRow: { paddingHorizontal: H_PAD, gap: 16, paddingTop: 21 },
  emptyState: { alignItems: "center", paddingTop: 80, paddingHorizontal: H_PAD },
  loadMoreFooter: { alignItems: "center", paddingVertical: 20 },
  emptyTitle: { fontFamily: "Manrope", fontSize: 17, fontWeight: "700", color: TEXT, textAlign: "center", marginBottom: 8 },
  emptySub: { fontFamily: "Manrope", fontSize: 13, color: MUTED, textAlign: "center", lineHeight: 20 },

  /* ── Sort sheet ── */
  sortSheet: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#210911", borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 10, paddingHorizontal: 20 },
  sortSheetHandle: { alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(74,12,12,0.35)", marginBottom: 16 },
  sortSheetTitle: { fontFamily: "Manrope", color: TEXT, fontSize: 15, fontWeight: "700", marginBottom: 12 },
  sortSheetRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(61,14,22,0.40)" },
  sortSheetLabel: { fontFamily: "Manrope", color: MUTED, fontSize: 15, flex: 1 },
  sortSheetLabelActive: { fontFamily: "Manrope", color: TEXT, fontWeight: "600" },

  /* ── Quick sheet ── */
  qsBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  qsSheet: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#142761", borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 10, paddingHorizontal: 20 },
  qsHandle: { alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(212,175,55,0.25)", marginBottom: 14 },
  qsHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  qsThumb: { width: 54, height: 54, borderRadius: 10 },
  qsTitle: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700", color: TEXT, marginBottom: 2 },
  qsSub: { fontFamily: "Manrope", fontSize: 12, color: MUTED },
  qsClose: { padding: 4 },
  qsDivider: { height: 0, marginBottom: 6 },
  qsSepDivider: { height: StyleSheet.hairlineWidth, backgroundColor: "#3D0E16", marginVertical: 4 },
  qsRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, gap: 14 },
  qsIcon: { width: 22 },
  qsLabel: { fontFamily: "Manrope", flex: 1, fontSize: 15, color: TEXT },
  qsRight: { fontFamily: "Manrope", fontSize: 13, color: MUTED, marginRight: 4 },

  /* ── Search overlay ── */
  searchModalRoot: { flex: 1, backgroundColor: "#2E0510" },
  searchOverlay: { flexDirection: "row", alignItems: "center", backgroundColor: "#2E0510", paddingTop: Platform.OS === "ios" ? 56 : 36, paddingHorizontal: H_PAD, paddingBottom: 14, gap: 10 },
  searchBar: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FFFFFF", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12 },
  searchInput: { fontFamily: "Manrope", flex: 1, fontSize: 14, color: "#111" },
  cancelBtn: { paddingVertical: 6 },
  cancelText: { fontFamily: "Manrope", color: GOLD, fontSize: 14, fontWeight: "600" },
  searchEmpty: { flex: 1, backgroundColor: "#210911", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  searchEmptyTitle: { fontFamily: "Manrope", fontSize: 18, fontWeight: "700", color: TEXT, textAlign: "center", marginBottom: 10 },
  searchEmptySub: { fontFamily: "Manrope", fontSize: 14, color: MUTED, textAlign: "center", lineHeight: 20 },

  /* ── Compat ── */
  headerIconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  chipsShadow: { position: "absolute", left: 0, right: 0, bottom: -7, height: 7 },
});
