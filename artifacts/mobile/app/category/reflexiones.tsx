import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState, useEffect, useMemo, useCallback } from "react";
import {
  ActivityIndicator, Animated, Dimensions, Easing, Keyboard, Modal, Platform,
  Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GhostPill } from "@/components/GhostPill";
import { AddToPlaylistSheet } from "@/components/AddToPlaylistSheet";
import { usePlayer } from "@/context/PlayerContext";
import { usePremium } from "@/context/PremiumContext";
import { getArtist } from "@/data/artists";
import { getGuide } from "@/data/guides";
import { SESSIONS, type Session } from "@/data/sessions";
import { useCatalog } from "@/context/CatalogContext";

const { width } = Dimensions.get("window");
const H_PAD = 15;
const GOLD  = "#D4AF37";
const TEXT  = "#FAF0EE";
const MUTED = "rgba(250,240,238,0.45)";
const HERO_H = 187;
const GRID_GAP    = 10;
const cellW = (width - H_PAD * 2 - GRID_GAP * 2) / 3;
const HERO_IMG = require("@/assets/images/cat-reflexiones-hero.png");

type CatTab   = string;
type SortMode = "recientes" | "nuevas" | "populares";
type ViewMode = "list" | "grid";

const FIXED_TABS: { id: string; label: string; icon?: string }[] = [
  { id: "sabiduria", label: "Sabiduría", icon: "book-open" },
  { id: "asmr",      label: "ASMR",      icon: "headphones" },
  { id: "historias", label: "Historias", icon: "book" },
];

const SORT_OPTIONS: { id: SortMode; label: string; icon: string }[] = [
  { id: "recientes", label: "Escuchadas recientemente", icon: "clock" },
  { id: "nuevas",    label: "Nuevas sesiones",          icon: "plus-circle" },
  { id: "populares", label: "Las más escuchadas",       icon: "headphones" },
];

// Todas las reflexiones se muestran sin filtro de subcategoría por ahora
// (los tabs son visuales — se completará cuando las sesiones tengan podcastTag/sabiduriaTag)
function getSessionsForTab(_tab: string | null) {
  return SESSIONS.filter((s) => s.categoryId === "reflexiones");
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

function SortSheet({ visible, current, onSelect, onClose }: { visible: boolean; current: SortMode; onSelect:(s:SortMode)=>void; onClose:()=>void }) {
  const insets = useSafeAreaInsets();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={[styles.sortSheet,{paddingBottom:Math.max(insets.bottom,16)}]}>
        <View style={styles.sortSheetHandle} />
        <Text style={styles.sortSheetTitle}>Ordenar por</Text>
        {SORT_OPTIONS.map((opt)=>{
          const active = opt.id===current;
          return (
            <Pressable key={opt.id} style={({pressed})=>[styles.sortSheetRow,{opacity:pressed?0.7:1}]} onPress={()=>{ onSelect(opt.id); onClose(); }}>
              <Feather name={opt.icon as never} size={17} color={active?GOLD:MUTED} />
              <Text style={[styles.sortSheetLabel,active&&styles.sortSheetLabelActive]}>{opt.label}</Text>
              {active&&<Feather name="check" size={17} color={GOLD} style={{marginLeft:"auto"}} />}
            </Pressable>
          );
        })}
      </View>
    </Modal>
  );
}

function AnimatedTabContent({ animKey, children }: { animKey: string; children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;
  useEffect(()=>{ opacity.setValue(0); Animated.timing(opacity,{toValue:1,duration:1200,easing:Easing.out(Easing.quad),useNativeDriver:true}).start(); },[animKey]); // eslint-disable-line react-hooks/exhaustive-deps
  return <Animated.View style={{opacity}}>{children}</Animated.View>;
}

function Chip({ label, icon, sel, onPress }: { label: string; icon?: string; sel: boolean; onPress:()=>void }) {
  const iconColor = sel ? "#1B060F" : GOLD;
  return (
    <Pressable onPress={onPress} style={({pressed})=>[styles.chip,{opacity:pressed?0.7:1}]}>
      {sel&&<LinearGradient colors={["#D6AD5F","#B47344"]} start={{x:0,y:0}} end={{x:1,y:0}} style={StyleSheet.absoluteFill} />}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
        {!!icon && <Feather name={icon as any} size={15} color={iconColor} />}
        <Text style={[styles.chipText,sel&&styles.chipTextSel]}>{label}</Text>
      </View>
    </Pressable>
  );
}

function ChipRow({ tabs, activeTab, onSelect, onClear }: { tabs: { id: string; label: string; icon?: string }[]; activeTab: CatTab|null; onSelect:(id:CatTab)=>void; onClear:()=>void }) {
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false}
      style={styles.chipRow} contentContainerStyle={styles.chipRowContent}>
      {tabs.map((t) => (
        <Chip key={t.id} label={t.label} icon={t.icon} sel={activeTab === t.id}
          onPress={() => activeTab === t.id ? onClear() : onSelect(t.id)} />
      ))}
    </ScrollView>
  );
}

function SearchOverlay({ visible, onClose }: { visible: boolean; onClose:()=>void }) {
  const [q,setQ] = useState("");
  const inputRef = useRef<TextInput>(null);
  const [kbH,setKbH]   = useState(0);
  const [kbOk,setKbOk] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const results = useMemo(()=>q.trim().length>=1?SESSIONS.filter((s)=>s.categoryId==="reflexiones"&&s.title.toLowerCase().includes(q.toLowerCase())):[],[q]);
  useEffect(()=>{
    if (!visible) { setQ(""); setKbOk(false); setKbH(0); fade.setValue(0); return; }
    const show = Keyboard.addListener("keyboardDidShow",(e)=>{ setKbH(e.endCoordinates.height); setKbOk(true); Animated.timing(fade,{toValue:1,duration:180,useNativeDriver:true}).start(); });
    const hide = Keyboard.addListener("keyboardDidHide",()=>{ setKbOk(false); fade.setValue(0); });
    return ()=>{ show.remove(); hide.remove(); };
  },[visible,fade]);
  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose} onShow={()=>inputRef.current?.focus()}>
      <View style={[styles.searchModalRoot,{paddingBottom:kbH}]}>
        <View style={styles.searchOverlay}>
          <View style={styles.searchBar}>
            <Feather name="search" size={16} color={MUTED} />
            <TextInput ref={inputRef} style={styles.searchInput} placeholder="Buscar en Reflexiones..." placeholderTextColor={MUTED} value={q} onChangeText={setQ} returnKeyType="search" />
          </View>
          <Pressable onPress={onClose} style={styles.cancelBtn}><Text style={styles.cancelText}>Cancelar</Text></Pressable>
        </View>
        {q.length===0&&kbOk&&(
          <Animated.View style={[styles.searchEmpty,{opacity:fade}]}>
            <Feather name="book-open" size={48} color={GOLD} style={{marginBottom:16}} />
            <Text style={styles.searchEmptyTitle}>Busca en Reflexiones</Text>
            <Text style={styles.searchEmptySub}>Sabiduría, podcast, ASMR e historias.</Text>
          </Animated.View>
        )}
        {results.length>0&&(
          <ScrollView style={{flex:1,backgroundColor:"#160108"}} contentContainerStyle={{padding:H_PAD,gap:9}} keyboardShouldPersistTaps="handled">
            {results.map((s)=><CategoryCard key={s.id} session={s} horizontal />)}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

function CategoryCard({
  session, width: cardWidth=200, horizontal=false, onLongPress,
}: {
  session: Session; width?: number; horizontal?: boolean; onLongPress?: ()=>void;
}) {
  const { isPremium } = usePremium();
  const { playSession } = usePlayer();
  const locked   = !!session.isPremium && !isPremium;
  const handlePress = () => {
    if (locked) { router.push("/membresia" as never); return; }
    if (session.skipDetail) { playSession(session); router.push("/player" as never); return; }
    router.push(`/session/${session.id}` as never);
  };
  const authorObj = session.guideId ? getGuide(session.guideId) : getArtist(session.artistId);
  const author = authorObj.name;
  const authorPhoto = authorObj.photo;

  if (horizontal) {
    return (
      <Pressable onPress={handlePress} onLongPress={onLongPress} style={({pressed})=>[ac.hRow,{opacity:pressed?0.8:1}]}>
        <View style={ac.hImgWrap}>
          <Image source={session.image} style={ac.hImage} contentFit="cover" />
          <View style={ac.hImgOverlay} />
          {locked&&<View style={ac.lockDot}><Feather name="lock" size={9} color="#fff" /></View>}
          <Text style={ac.hDurLabel}>{session.durationLabel}</Text>
        </View>
        <View style={ac.hContent}>
          <Text style={ac.hTitle} numberOfLines={2}>{session.title}</Text>
          {!!author&&(
            <View style={ac.hAuthorRow}>
              <Image source={authorPhoto} style={ac.hAuthorAvatar} contentFit="cover" />
              <Text style={ac.hAuthor} numberOfLines={1}>{author}</Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  }
  return (
    <Pressable onPress={handlePress} onLongPress={onLongPress} style={({pressed})=>[ac.card,{width:cardWidth,opacity:pressed?0.85:1}]}>
      <View style={ac.imgContainer}>
        <Image source={session.image} style={ac.cardImage} contentFit="cover" />
        {locked&&<View style={ac.lockDot}><Feather name="lock" size={9} color="#fff" /></View>}
        <View style={ac.durationBadge}><Text style={ac.durationBadgeText}>{session.durationLabel}</Text></View>
      </View>
      <Text style={ac.cardTitle} numberOfLines={2}>{session.title}</Text>
      {!!author&&<Text style={ac.cardAuthor} numberOfLines={1}>{author}</Text>}
    </Pressable>
  );
}

const ac = StyleSheet.create({
  hRow:{flexDirection:"row",alignItems:"center",gap:12,paddingVertical:6,marginBottom:5},
  hImgWrap:{width:129,height:94,borderRadius:8,overflow:"hidden"},
  hImgOverlay:{...StyleSheet.absoluteFillObject,backgroundColor:"rgba(0,0,0,0.18)"},
  hImage:{width:129,height:94},
  hContent:{flex:1,justifyContent:"center",gap:2},
  hDuration:{fontSize:12,fontWeight:"500",color:"rgba(255,255,255,0.8)"},
  hDurLabel:{position:"absolute",bottom:6,left:8,fontSize:13,fontWeight:"700",color:"#fff",textShadowColor:"rgba(0,0,0,0.85)",textShadowOffset:{width:0,height:1},textShadowRadius:4},
  hTitle:{fontSize:16,fontWeight:"600",color:TEXT,lineHeight:21},
  hAuthor:{fontSize:14,color:MUTED,flex:1},
  hAuthorRow:{flexDirection:"row",alignItems:"center",gap:6,marginTop:1},
  hAuthorAvatar:{width:20,height:20,borderRadius:10},
  card:{gap:6},
  imgContainer:{width:"100%",aspectRatio:1,borderRadius:10,overflow:"hidden"},
  cardImage:{width:"100%",height:"100%"},
  cardTitle:{fontSize:16,fontWeight:"600",color:TEXT,lineHeight:21},
  cardAuthor:{fontSize:14,color:MUTED},
  durationBadge:{position:"absolute",bottom:8,left:8,backgroundColor:"rgba(27,6,15,0.72)",borderRadius:8,paddingHorizontal:8,paddingVertical:3},
  durationBadgeText:{fontSize:11,fontWeight:"600",color:"#fff"},
  lockDot:{position:"absolute",top:6,right:6,width:20,height:20,borderRadius:10,backgroundColor:"rgba(0,0,0,0.55)",alignItems:"center",justifyContent:"center"},
});

function SessionQuickSheet({ session, onClose, onPlaylist, isFavorite, onToggleFavorite }: { session: Session|null; onClose:()=>void; onPlaylist:()=>void; isFavorite:(id:string)=>boolean; onToggleFavorite:(id:string)=>void }) {
  const insets = useSafeAreaInsets();
  const slide  = useRef(new Animated.Value(300)).current;
  useEffect(()=>{ if (session) Animated.spring(slide,{toValue:0,useNativeDriver:true,bounciness:0}).start(); else slide.setValue(300); },[session,slide]);
  if (!session) return null;
  const fav = isFavorite(session.id);
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
        <Pressable onPress={onPlaylist} style={({pressed})=>[styles.qsRow,styles.qsRowBorder,{opacity:pressed?0.7:1}]}>
          <Feather name="list" size={20} color={TEXT} style={styles.qsIcon} />
          <Text style={styles.qsLabel}>Agregar a una Playlist</Text>
          <Feather name="chevron-right" size={16} color={MUTED} />
        </Pressable>
        <Pressable onPress={()=>{ onToggleFavorite(session.id); onClose(); }} style={({pressed})=>[styles.qsRow,{opacity:pressed?0.7:1}]}>
          <Feather name="heart" size={20} color={fav?"#E05C5C":TEXT} style={styles.qsIcon} />
          <Text style={[styles.qsLabel,fav&&{color:"#E05C5C"}]}>{fav?"Quitar de favoritos":"Agregar a favoritos"}</Text>
          <Feather name="chevron-right" size={16} color={MUTED} />
        </Pressable>
      </Animated.View>
    </Modal>
  );
}

export default function ReflexionesScreen() {
  const insets    = useSafeAreaInsets();
  const topPad    = Platform.OS==="web" ? 0 : insets.top;
  const bottomPad = Platform.OS==="web" ? 34 : insets.bottom;
  const { isFavorite, toggleFavorite, history } = usePlayer();
  const { version } = useCatalog();

  // Tabs fijos — se expandirán cuando las sesiones usen podcastTag/sabiduriaTag
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const TABS = useMemo(() => FIXED_TABS, [version]);

  const [activeTab,         setActiveTab]         = useState<CatTab|null>(null);
  const [sort,              setSort]              = useState<SortMode>("recientes");
  const [sortVisible,       setSortVisible]       = useState(false);
  const [viewMode,          setViewMode]          = useState<ViewMode>("list");
  const [searchVisible,     setSearchVisible]     = useState(false);
  const [selectedSession,   setSelectedSession]   = useState<Session|null>(null);
  const [playlistSessionId, setPlaylistSessionId] = useState<string|null>(null);
  const toggleView = useCallback(()=>setViewMode((v)=>(v==="list"?"grid":"list")),[]);

  const scrollY = useRef(new Animated.Value(0)).current;
  const HERO_AREA_H = 238;
  const stickyOpacity = scrollY.interpolate({
    inputRange: [HERO_AREA_H * 0.30, HERO_AREA_H * 0.95],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });
  const [stickyActive, setStickyActive] = useState(false);

  const playCounts = useMemo(()=>{ const c:Record<string,number>={}; for (const e of history) c[e.sessionId]=(c[e.sessionId]??0)+1; return c; },[history]);
  const sessions   = useMemo(()=>applySort(getSessionsForTab(activeTab),sort,playCounts),[activeTab,sort,playCounts,version]);
  const sortLabel  = sort==="recientes"?"Escuchadas recientemente":sort==="nuevas"?"Nuevas sesiones":"Las más escuchadas";

  const PAGE_SIZE = 20;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [sessions]);
  const visibleSessions = sessions.slice(0, visibleCount);
  const hasMore = visibleCount < sessions.length;

  const renderContent = () => {
    if (sessions.length===0) return (
      <View style={styles.emptyState}>
        <Feather name="book-open" size={48} color={GOLD} style={{marginBottom:16}} />
        <Text style={styles.emptyTitle}>Próximamente en Reflexiones</Text>
        <Text style={styles.emptySub}>Estamos curating los mejores episodios y relatos.</Text>
      </View>
    );
    if (viewMode==="grid") {
      const triples:(typeof sessions)[] = [];
      for (let i=0;i<visibleSessions.length;i+=3) triples.push(visibleSessions.slice(i,i+3));
      return (
        <>
          <View style={styles.gridOuter}>
            {triples.map((triple,ri)=>(
              <View key={ri} style={styles.gridRow}>
                {triple.map((s)=>(
                  <CategoryCard key={s.id} session={s} width={cellW} onLongPress={()=>setSelectedSession(s)} />
                ))}
              </View>
            ))}
          </View>
          {hasMore && <View style={styles.loadMoreFooter}><ActivityIndicator size="small" color={MUTED} /></View>}
        </>
      );
    }
    return (
      <>
        <View style={{paddingHorizontal:H_PAD}}>
          {visibleSessions.map((s)=>(
            <CategoryCard key={s.id} session={s} horizontal onLongPress={()=>setSelectedSession(s)} />
          ))}
        </View>
        {hasMore && <View style={styles.loadMoreFooter}><ActivityIndicator size="small" color={MUTED} /></View>}
      </>
    );
  };

  return (
    <View style={styles.root}>
      <LinearGradient colors={["#2E0510","#160108"]} style={StyleSheet.absoluteFill} pointerEvents="none" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 140 + bottomPad }}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={(e) => {
          const y = e.nativeEvent.contentOffset.y;
          scrollY.setValue(y);
          const active = y > HERO_AREA_H * 0.50;
          if (active !== stickyActive) setStickyActive(active);
          const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
          if (hasMore && contentOffset.y + layoutMeasurement.height >= contentSize.height - 300) {
            setVisibleCount((c) => Math.min(c + PAGE_SIZE, sessions.length));
          }
        }}
      >

        {/* ── Hero banner ── */}
        <View style={styles.heroArea}>
          <Image source={HERO_IMG} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="center" />
          <LinearGradient colors={["transparent","rgba(0,0,0,0.28)","rgba(0,0,0,0.60)"]} locations={[0.50,0.80,1]} style={StyleSheet.absoluteFill} />
          {/* Flecha atrás flotante */}
          <View style={[styles.heroOverlayLeft, { top: topPad + 8 }]}>
            <GhostPill style={{ backgroundColor: "#2E0510" }}>
              <Pressable onPress={() => router.back()} hitSlop={10} style={styles.headerBtn}>
                <Feather name="arrow-left" size={22} color="#fff" />
              </Pressable>
            </GhostPill>
          </View>
          {/* Info flotante */}
          <View style={[styles.heroOverlayRight, { top: topPad + 8 }]}>
            <GhostPill style={{ backgroundColor: "#2E0510" }}>
              <Pressable hitSlop={10} style={styles.headerBtn} onPress={() => router.push("/reflexiones-info" as never)}>
                <Feather name="info" size={20} color="rgba(255,255,255,0.85)" />
              </Pressable>
            </GhostPill>
          </View>
          <View style={styles.heroIconFloat}>
            <View style={styles.heroIconCircle}>
              <Feather name="book-open" size={30} color={GOLD} />
            </View>
          </View>
        </View>

        {/* ── Título + Descripción ── */}
        <View style={styles.profileCard}>
          <Text style={styles.profileTitle}>Reflexiones</Text>
          <Text style={styles.profileDesc} numberOfLines={2}>
            Relatos y episodios que invitan a la contemplación del alma.
          </Text>
        </View>

        {/* ── Tabs ── */}
        <View style={styles.chipsArea}>
          <ChipRow tabs={TABS} activeTab={activeTab} onSelect={(id) => setActiveTab(id)} onClear={() => setActiveTab(null)} />
        </View>


        <View style={styles.divider} />

        {/* ── Contenido ── */}
        <AnimatedTabContent animKey={activeTab ?? "all"}>
          <View style={styles.controlRow}>
            <Pressable onPress={() => setSortVisible(true)} style={styles.sortBtn} hitSlop={8}>
              <Feather name="chevrons-down" size={10} color={MUTED} />
              <Text style={styles.sortText}>{sortLabel}</Text>
            </Pressable>
            <View style={{ flexDirection: "row", gap: 8, alignItems: "center" }}>
              <Pressable onPress={() => setSearchVisible(true)} hitSlop={10} style={styles.viewToggleBtn}>
                <Feather name="search" size={15} color={MUTED} />
              </Pressable>
              <Pressable onPress={toggleView} hitSlop={10} style={styles.viewToggleBtn}>
                {viewMode === "list" ? <MaterialCommunityIcons name="view-grid-outline" size={17} color={MUTED} /> : <MaterialCommunityIcons name="view-list-outline" size={17} color={MUTED} />}
              </Pressable>
            </View>
          </View>
          {renderContent()}
        </AnimatedTabContent>
      </ScrollView>

      <SearchOverlay visible={searchVisible} onClose={() => setSearchVisible(false)} />
      <SortSheet visible={sortVisible} current={sort} onSelect={setSort} onClose={() => setSortVisible(false)} />
      <SessionQuickSheet session={selectedSession} onClose={() => setSelectedSession(null)}
        onPlaylist={() => { if (selectedSession) setPlaylistSessionId(selectedSession.id); setSelectedSession(null); }}
        isFavorite={isFavorite} onToggleFavorite={toggleFavorite} />
      <AddToPlaylistSheet visible={playlistSessionId !== null} sessionId={playlistSessionId ?? ""} onClose={() => setPlaylistSessionId(null)} />

      {/* ── Sticky header (aparece con scroll) ── */}
      <Animated.View style={[styles.stickyHeader, { paddingTop: topPad + 8, opacity: stickyOpacity }]} pointerEvents={stickyActive ? "auto" : "none"}>
        <GhostPill>
          <Pressable onPress={() => router.back()} hitSlop={10} style={styles.headerBtn}>
            <Feather name="arrow-left" size={22} color="#fff" />
          </Pressable>
        </GhostPill>
        <Text style={styles.headerTitle}>Reflexiones</Text>
        <GhostPill>
          <Pressable hitSlop={10} style={styles.headerBtn} onPress={() => router.push("/reflexiones-info" as never)}>
            <Feather name="info" size={20} color="rgba(255,255,255,0.85)" />
          </Pressable>
        </GhostPill>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#160108" },

  stickyHeader: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: H_PAD, paddingBottom: 14, backgroundColor: "#2E0510" },
  headerBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitle: { flex: 1, fontSize: 25, fontFamily: "OptimaBold", color: "#fff", letterSpacing: 0.2, textAlign: "center" },
  heroOverlayLeft: { position: "absolute", left: H_PAD, zIndex: 10 },
  heroOverlayRight: { position: "absolute", right: H_PAD, zIndex: 10 },

  heroArea: { height: 238, position: "relative" },
  heroIconFloat: { position: "absolute", bottom: -16, left: 0, right: 0, alignItems: "center", zIndex: 2 },
  heroIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: "rgba(60,5,18,0.85)", borderWidth: 1, borderColor: "rgba(212,175,55,0.60)", alignItems: "center", justifyContent: "center", overflow: "hidden" },

  profileCard: { marginHorizontal: H_PAD, marginTop: 30, paddingBottom: 14, gap: 8, alignItems: "center" },
  profileTitle: { fontSize: 27, fontFamily: "OptimaBold", color: TEXT, letterSpacing: 0.3 },
  profileDesc: { fontSize: 14, fontFamily: "Jost", color: "rgba(255,255,255,0.90)", lineHeight: 19, textAlign: "center", maxWidth: 280, marginTop: 8, marginBottom: 28 },

  dividerLine: { height: 0 },
  dividerShadow: { height: 12, marginTop: 0 },

  chipsArea: { paddingTop: 10, paddingBottom: 5, overflow: "visible", marginTop: -25 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(212,175,55,0.15)", marginHorizontal: H_PAD, marginTop: 8 },
  chipRow: { flexGrow: 0 },
  chipRowContent: { flexDirection: "row", gap: 8, paddingVertical: 2, paddingHorizontal: H_PAD },
  chip: { minWidth: 96, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 999, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden", alignItems: "center", justifyContent: "center" },
  chipText: { fontSize: 14, fontFamily: "Jost", fontWeight: "600", color: TEXT, textAlign: "center" },
  chipTextSel: { color: "#1B060F" },

  scroll: { flex: 1 },
  controlRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: H_PAD, paddingTop: 12, paddingBottom: 8 },
  sortBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  sortText: { fontSize: 13, fontFamily: "Jost", color: MUTED, fontWeight: "500" },
  viewToggleBtn: { padding: 2 },
  gridOuter: { paddingHorizontal: H_PAD, gap: GRID_GAP },
  gridRow: { flexDirection: "row", gap: GRID_GAP },
  emptyState: { alignItems: "center", paddingTop: 80, paddingHorizontal: H_PAD },
  loadMoreFooter: { alignItems: "center", paddingVertical: 20 },
  emptyTitle: { fontSize: 17, fontFamily: "OptimaBold", color: TEXT, textAlign: "center", marginBottom: 8 },
  emptySub: { fontSize: 13, fontFamily: "Jost", color: MUTED, textAlign: "center", lineHeight: 20 },

  sortSheet: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#160108", borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 10, paddingHorizontal: 20 },
  sortSheetHandle: { alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(74,12,12,0.35)", marginBottom: 16 },
  sortSheetTitle: { color: TEXT, fontSize: 15, fontFamily: "OptimaBold", marginBottom: 12 },
  sortSheetRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(61,14,22,0.40)" },
  sortSheetLabel: { color: MUTED, fontSize: 15, fontFamily: "Jost", flex: 1 },
  sortSheetLabelActive: { color: TEXT, fontFamily: "Jost", fontWeight: "600" },
  qsBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  qsSheet: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#160108", borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 10, paddingHorizontal: 20, borderTopWidth: StyleSheet.hairlineWidth, borderColor: "#3D0E16" },
  qsHandle: { alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(212,175,55,0.25)", marginBottom: 14 },
  qsHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  qsThumb: { width: 54, height: 54, borderRadius: 10 },
  qsTitle: { fontSize: 15, fontFamily: "OptimaBold", color: TEXT, marginBottom: 2 },
  qsSub: { fontSize: 12, fontFamily: "Jost", color: MUTED },
  qsClose: { padding: 4 },
  qsDivider: { height: StyleSheet.hairlineWidth, backgroundColor: "#3D0E16", marginBottom: 6 },
  qsRow: { flexDirection: "row", alignItems: "center", paddingVertical: 16, gap: 14 },
  qsRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#3D0E16" },
  qsIcon: { width: 22 },
  qsLabel: { flex: 1, fontSize: 15, fontFamily: "Jost", color: TEXT },
  searchModalRoot: { flex: 1, backgroundColor: "#160108" },
  searchOverlay: { flexDirection: "row", alignItems: "center", backgroundColor: "#160108", paddingTop: Platform.OS === "ios" ? 56 : 36, paddingHorizontal: H_PAD, paddingBottom: 14, gap: 10 },
  searchBar: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FFFFFF", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12 },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Jost", color: "#111" },
  cancelBtn: { paddingVertical: 6 },
  cancelText: { color: GOLD, fontSize: 14, fontFamily: "Jost", fontWeight: "600" },
  searchEmpty: { flex: 1, backgroundColor: "#160108", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  searchEmptyTitle: { fontSize: 18, fontFamily: "OptimaBold", color: TEXT, textAlign: "center", marginBottom: 10 },
  searchEmptySub: { fontSize: 14, fontFamily: "Jost", color: MUTED, textAlign: "center", lineHeight: 20 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerIconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  chipsShadow: { position: "absolute", left: 0, right: 0, bottom: -7, height: 7 },
});
