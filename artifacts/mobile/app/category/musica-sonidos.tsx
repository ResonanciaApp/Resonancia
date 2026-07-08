import { Feather, Ionicons } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { BackPill } from "@/components/BackPill";
import { router } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useRef, useState, useEffect, useMemo } from "react";
import {
  ActivityIndicator, Animated, Easing, Keyboard, Modal, Platform,
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
import { useSceneTheme } from "@/context/SceneThemeContext";
import { hexToRgba } from "@/utils/color";

const H_PAD = 15;
const GOLD  = "#BE8744";
const TEXT  = "#e8e8e8";
const MUTED = "#c2c2c2";
const HERO_IMG = require("@/assets/images/cat-musica-hero.png");

type CatTab   = string;
type SortMode = "recientes" | "nuevas" | "populares";

const FIXED_TABS: { id: string; label: string; icon?: string }[] = [
  { id: "ambient", label: "Ambient",   icon: "cloud" },
  { id: "enteo",   label: "Enteógena", icon: "feather" },
  { id: "tribal",  label: "Tribal",    icon: "zap" },
  { id: "etnica",  label: "Étnica",    icon: "globe" },
];
const FIXED_SOUND_TAGS = new Set([
  "Música Ambient","Música Enteógena","Música Tribal","Música Étnica",
]);

const SORT_OPTIONS: { id: SortMode; label: string; icon: string }[] = [
  { id: "recientes", label: "Escuchadas recientemente", icon: "clock" },
  { id: "nuevas",    label: "Nuevas sesiones",          icon: "plus-circle" },
  { id: "populares", label: "Las más escuchadas",       icon: "headphones" },
];

function getSessionsForTab(tab: string | null) {
  const all = SESSIONS.filter((s) => s.categoryId === "musica-sonidos");
  if (!tab) return all;
  switch (tab) {
    case "ambient": return all.filter((s) => s.soundTag === "Música Ambient");
    case "enteo":   return all.filter((s) => s.soundTag === "Música Enteógena");
    case "tribal":  return all.filter((s) => s.soundTag === "Música Tribal");
    case "etnica":  return all.filter((s) => s.soundTag === "Música Étnica");
    default:        return all.filter((s) => s.soundTag === tab);
  }
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

function Chip({ label, icon, sel, onPress }: { label: string; icon?: string; sel: boolean; onPress: ()=>void }) {
  const iconColor = sel ? "#1B060F" : "#e8e8e8";
  return (
    <Pressable onPress={onPress} style={({pressed})=>[styles.chip, !sel && styles.chipUnsel, {opacity:pressed?0.7:1}]}>
      <LinearGradient colors={sel?["#F4F4F4","#F4F4F4"]:["rgba(0,0,0,0.14)","rgba(0,0,0,0.14)"]} start={{x:0,y:0}} end={{x:0,y:1}} style={StyleSheet.absoluteFill} />
      <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
        {!!icon && <Feather name={icon as any} size={15} color={iconColor} />}
        <Text style={[styles.chipText, sel&&styles.chipTextSel]}>{label}</Text>
      </View>
    </Pressable>
  );
}

function ChipRow({ tabs, activeTab, onSelect, onClear }: { tabs: { id: string; label: string; icon?: string }[]; activeTab: CatTab|null; onSelect:(id:CatTab)=>void; onClear:()=>void }) {
  return (
    <View style={styles.chipRowWrapper}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        style={styles.chipRow} contentContainerStyle={styles.chipRowContent}>
        {tabs.map((t) => (
          <Chip key={t.id} label={t.label} icon={t.icon} sel={activeTab === t.id}
            onPress={() => activeTab === t.id ? onClear() : onSelect(t.id)} />
        ))}
      </ScrollView>
      <View style={styles.chipRowBorder} />
    </View>
  );
}

function SearchOverlay({ visible, onClose }: { visible: boolean; onClose: ()=>void }) {
  const [q,setQ] = useState("");
  const inputRef = useRef<TextInput>(null);
  const [kbH,setKbH]   = useState(0);
  const [kbOk,setKbOk] = useState(false);
  const fade = useRef(new Animated.Value(0)).current;
  const results = useMemo(()=>q.trim().length>=1?SESSIONS.filter((s)=>s.categoryId==="musica-sonidos"&&s.title.toLowerCase().includes(q.toLowerCase())):[],[q]);
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
            <TextInput ref={inputRef} style={styles.searchInput} placeholder="Buscar en Música..." placeholderTextColor={MUTED} value={q} onChangeText={setQ} returnKeyType="search" />
          </View>
          <Pressable onPress={onClose} style={styles.cancelBtn}><Text style={styles.cancelText}>Cancelar</Text></Pressable>
        </View>
        {q.length===0&&kbOk&&(
          <Animated.View style={[styles.searchEmpty,{opacity:fade}]}>
            <Feather name="music" size={48} color={GOLD} style={{marginBottom:16}} />
            <Text style={styles.searchEmptyTitle}>Busca en Música</Text>
            <Text style={styles.searchEmptySub}>Ambient, enteógena, tribal y más.</Text>
          </Animated.View>
        )}
        {results.length>0&&(
          <ScrollView style={{flex:1,backgroundColor:"#210911"}} contentContainerStyle={{padding:H_PAD,gap:9}} keyboardShouldPersistTaps="handled">
            {results.map((s)=><CategoryCard key={s.id} session={s} horizontal />)}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
}

function CategoryCard({
  session, width: cardWidth=200, horizontal=false, onLongPress, onOptions,
}: {
  session: Session; width?: number; horizontal?: boolean; onLongPress?: ()=>void; onOptions?: ()=>void;
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
          {!!author&&(
            <View style={ac.hAuthorRow}>
              <Text style={ac.hAuthor} numberOfLines={1}>{author}</Text>
            </View>
          )}
        </View>
        <Pressable onPress={onOptions??onLongPress} hitSlop={10} style={ac.hDotsBtn}>
          <View style={ac.hDot} /><View style={ac.hDot} /><View style={ac.hDot} />
        </Pressable>
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
  hRow:{ flexDirection:"row", alignItems:"center", gap:12, paddingVertical:6, marginBottom:11 },
  hImgWrap:{ width:87, height:87, borderRadius:8, overflow:"hidden" },
  hImgOverlay:{ ...StyleSheet.absoluteFillObject, backgroundColor:"rgba(0,0,0,0.18)" },
  hImage:{ width:87, height:87 },
  hContent:{ flex:1, justifyContent:"center", gap:2 },
  hDuration:{ fontSize:11, fontWeight:"400", color:MUTED },
  hTitle:{ fontSize:13, fontWeight:"600", color:TEXT, lineHeight:18 },
  hAuthor:{ fontSize:11, color:MUTED, flex:1 },
  hAuthorRow:{ flexDirection:"row", alignItems:"center", gap:6, marginTop:1 },
  hAuthorAvatar:{ width:20, height:20, borderRadius:10 },
  hDotsBtn:{ paddingLeft:12, paddingRight:4, paddingVertical:8, alignItems:"center", justifyContent:"center", gap:3, flexDirection:"row" },
  hDot:{ width:4, height:4, borderRadius:2, backgroundColor:MUTED },
  card:{gap:6},
  imgContainer:{width:"100%",aspectRatio:1,borderRadius:10,overflow:"hidden"},
  cardImage:{width:"100%",height:"100%"},
  cardTitle:{fontSize:13,fontWeight:"600",color:TEXT,lineHeight:18},
  cardAuthor:{fontSize:11,color:MUTED},
  durationBadge:{position:"absolute",bottom:8,left:8,backgroundColor:"rgba(27,6,15,0.72)",borderRadius:8,paddingHorizontal:8,paddingVertical:3},
  durationBadgeText:{fontSize:11,fontWeight:"600",color:"#fff"},
  lockDot:{position:"absolute",top:6,right:6,width:20,height:20,borderRadius:10,backgroundColor:"rgba(0,0,0,0.55)",alignItems:"center",justifyContent:"center"},
});

function SessionQuickSheet({ session, onClose, onPlaylist, isFavorite, onToggleFavorite }: { session: Session|null; onClose:()=>void; onPlaylist:()=>void; isFavorite:(id:string)=>boolean; onToggleFavorite:(id:string)=>void }) {
  const insets = useSafeAreaInsets();
  const slide  = useRef(new Animated.Value(300)).current;
  useEffect(()=>{
    if (session) Animated.spring(slide,{toValue:0,useNativeDriver:true,bounciness:0}).start();
    else slide.setValue(300);
  },[session,slide]);
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
          <Text style={styles.qsLabel}>Agregar a un Ritual</Text>
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

export default function MusicaSonidosScreen() {
  const insets    = useSafeAreaInsets();
  const topPad    = Platform.OS==="web" ? 0 : insets.top;
  const bottomPad = Platform.OS==="web" ? 34 : insets.bottom;
  const { isFavorite, toggleFavorite, history } = usePlayer();
  const { version } = useCatalog();
  const { theme } = useSceneTheme();

  const TABS = useMemo(() => {
    const extra = Array.from(
      new Set(
        SESSIONS
          .filter((s) => s.categoryId === "musica-sonidos" && s.soundTag && !FIXED_SOUND_TAGS.has(s.soundTag))
          .map((s) => s.soundTag as string)
      )
    ).map((tag) => ({ id: tag, label: tag }));
    return [...FIXED_TABS, ...extra];
  }, [version]);

  const [activeTab,         setActiveTab]         = useState<CatTab|null>(null);
  const [sort,              setSort]              = useState<SortMode>("recientes");
  const [sortVisible,       setSortVisible]       = useState(false);
  const [searchVisible,     setSearchVisible]     = useState(false);
  const [selectedSession,   setSelectedSession]   = useState<Session|null>(null);
  const [playlistSessionId, setPlaylistSessionId] = useState<string|null>(null);

  const scrollRef  = useRef<ScrollView>(null);
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

  const PAGE_SIZE = 20;
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  const allTabSessions = useMemo(()=>getSessionsForTab(activeTab),[activeTab,version]);
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

  const renderContent = () => {
    if (shuffledSessions.length===0) return (
      <View style={styles.emptyState}>
        <Feather name="music" size={48} color={GOLD} style={{marginBottom:16}} />
        <Text style={styles.emptyTitle}>Próximamente en {activeTab ? TABS.find((t)=>t.id===activeTab)?.label : "Música"}</Text>
        <Text style={styles.emptySub}>Estamos componiendo los mejores paisajes sonoros.</Text>
      </View>
    );
    const tabIds = new Set(allTabSessions.map((s)=>s.id));
    const recentEntry = history.find((e)=>tabIds.has(e.sessionId));
    const recentSession = recentEntry ? allTabSessions.find((s)=>s.id===recentEntry.sessionId) : null;
    const recommended = recentSession
      ? shuffledSessions.filter((s)=>s.id!==recentSession.id)
      : shuffledSessions;
    const visibleRec = recommended.slice(0, visibleCount);
    const hasMoreRec = visibleCount < recommended.length;
    return (
      <>
        {recentSession && (
          <>
            <Text style={styles.sectionLabel}>Escuchado recientemente</Text>
            <View style={{paddingHorizontal:H_PAD, marginTop:1}}>
              <CategoryCard session={recentSession} horizontal onLongPress={()=>setSelectedSession(recentSession)} onOptions={()=>setSelectedSession(recentSession)} />
            </View>
          </>
        )}
        <Text style={[styles.sectionLabel, { paddingTop: 23 }]}>Recomendado</Text>
        <View style={{paddingHorizontal:H_PAD, marginTop:1}}>
          {visibleRec.map((s)=>(
            <CategoryCard key={s.id} session={s} horizontal onLongPress={()=>setSelectedSession(s)} onOptions={()=>setSelectedSession(s)} />
          ))}
        </View>
        {hasMoreRec && <View style={styles.loadMoreFooter}><ActivityIndicator size="small" color={MUTED} /></View>}
      </>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: "#1B060F" }]}>

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

        {/* ── Hero banner ── */}
        <View style={styles.heroArea}>
          {/* Flecha atrás flotante */}
          <View style={[styles.heroOverlayLeft, { top: topPad + 8 }]}>
            <GhostPill noBorder style={{ backgroundColor: hexToRgba(theme.gradient[1], 0.7) }}>
              <BackPill onPress={() => router.back()} />
            </GhostPill>
          </View>
          <View style={styles.heroIconFloat}>
            <View style={styles.heroIconGlow}>
              <View style={[styles.heroIconCircle, { backgroundColor: hexToRgba(theme.gradient[1], 0.9) }]}>
                <MaskedView maskElement={<View style={{ width: 32, height: 32, alignItems: "center", justifyContent: "center" }}><Ionicons name="musical-notes-outline" size={32} color="#fff" /></View>}>
                  <LinearGradient colors={["#ecedea", "#f8f8f6", "#dcdbd8"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ width: 32, height: 32 }} />
                </MaskedView>
              </View>
            </View>
          </View>
        </View>

        {/* ── Título + Descripción ── */}
        <View style={styles.profileCard}>
          <Text style={styles.profileTitle}>Música</Text>
          <Text style={styles.profileDesc} numberOfLines={2}>
            Música ambient y tribal para el viaje interior.
          </Text>
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

      <SearchOverlay visible={searchVisible} onClose={() => setSearchVisible(false)} />
      <SortSheet visible={sortVisible} current={sort} onSelect={setSort} onClose={() => setSortVisible(false)} />
      <SessionQuickSheet session={selectedSession} onClose={() => setSelectedSession(null)}
        onPlaylist={() => { if (selectedSession) setPlaylistSessionId(selectedSession.id); setSelectedSession(null); }}
        isFavorite={isFavorite} onToggleFavorite={toggleFavorite} />
      <AddToPlaylistSheet visible={playlistSessionId !== null} sessionId={playlistSessionId ?? ""} onClose={() => setPlaylistSessionId(null)} />

      {/* ── Sticky header (aparece con scroll) ── */}
      <Animated.View style={[styles.stickyHeader, { paddingTop: topPad + 8, opacity: stickyHeaderOpacity, backgroundColor: theme.gradient[0] }]} pointerEvents={stickyActive ? "auto" : "none"}>
        <GhostPill noBorder style={{ backgroundColor: hexToRgba(theme.gradient[1], 0.4) }}>
          <BackPill onPress={() => router.back()} />
        </GhostPill>
        <View style={styles.headerTitleCol}>
          <Text style={styles.headerTitle}>Música</Text>
          {activeTab && (
            <Text style={styles.headerSubtitle}>{TABS.find((t) => t.id === activeTab)?.label}</Text>
          )}
        </View>
        <Pressable hitSlop={10} style={styles.headerBtn} onPress={() => router.push("/musica-info" as never)}>
          <Feather name="info" size={20} color="rgba(255,255,255,0.85)" />
        </Pressable>
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#0B0811" },

  stickyHeader: { position: "absolute", top: 0, left: 0, right: 0, zIndex: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: H_PAD, paddingBottom: 14, backgroundColor: "#1B060F" },
  headerBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center" },
  headerTitleCol: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 18, fontWeight: "400", color: "#e8e8e8", letterSpacing: 0.2, textAlign: "center" },
  headerSubtitle: { fontSize: 11, color: "#f7f7f7", letterSpacing: 0.3, marginTop: 1, opacity: 0.7 },
  heroOverlayLeft: { position: "absolute", left: H_PAD, zIndex: 10 },

  heroArea: { height: 238, position: "relative" },
  heroIconFloat: { position: "absolute", bottom: -87, left: 0, right: 0, alignItems: "center", zIndex: 2 },
  heroIconGlow: { borderRadius: 36 },
  heroIconCircle: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#1B060F", borderWidth: 2, borderColor: "rgba(190,135,68,0.5)", alignItems: "center", justifyContent: "center", overflow: "hidden" },

  profileCard: { marginHorizontal: H_PAD, marginTop: 92, paddingBottom: 14, gap: 5, alignItems: "center" },
  profileTitle: { fontSize: 27, fontWeight: "400", color: TEXT, letterSpacing: 0.3 },
  profileDesc: { fontSize: 12, color: "rgba(255,255,255,0.90)", lineHeight: 17, textAlign: "center", maxWidth: 280, marginTop: 0, marginBottom: 28 },

  dividerLine: { height: 0 },
  dividerShadow: { height: 12, marginTop: 0 },

  chipsArea: { paddingTop: 10, paddingBottom: 5, overflow: "visible", marginTop: -25 },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(212,175,55,0.15)", marginHorizontal: H_PAD, marginTop: 8 },
  chipRowWrapper: { position: "relative" },
  chipRowBorder: { height: StyleSheet.hairlineWidth, backgroundColor: "transparent", marginTop: 11 },
  chipRow: { flexGrow: 0 },
  chipRowContent: { flexDirection: "row", gap: 8, paddingVertical: 2, paddingHorizontal: H_PAD },
  chip: { height: 34, paddingHorizontal: 12, borderRadius: 20, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  chipUnsel: { borderWidth: 2, borderColor: "rgba(255,255,255,0.1)" },
  chipText: { fontSize: 13, fontWeight: "400", color: TEXT, textAlign: "center" },
  chipTextSel: { color: "#1B060F", fontWeight: "600" },

  sectionLabel: { fontSize: 11, fontWeight: "400", color: TEXT, paddingHorizontal: H_PAD, paddingTop: 5, paddingBottom: 4 },
  scroll: { flex: 1 },
  controlRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: H_PAD, paddingTop: 12, paddingBottom: 8 },
  sortBtn: { flexDirection: "row", alignItems: "center", gap: 4 },
  emptyState: { alignItems: "center", paddingTop: 80, paddingHorizontal: H_PAD },
  loadMoreFooter: { alignItems: "center", paddingVertical: 20 },
  emptyTitle: { fontSize: 17, fontWeight: "700", color: TEXT, textAlign: "center", marginBottom: 8 },
  emptySub: { fontSize: 13, color: MUTED, textAlign: "center", lineHeight: 20 },

  sortSheet: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#210911", borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 10, paddingHorizontal: 20 },
  sortSheetHandle: { alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(74,12,12,0.35)", marginBottom: 16 },
  sortSheetTitle: { color: TEXT, fontSize: 15, fontWeight: "700", marginBottom: 12 },
  sortSheetRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(61,14,22,0.40)" },
  sortSheetLabel: { color: MUTED, fontSize: 15, flex: 1 },
  sortSheetLabelActive: { color: TEXT, fontWeight: "600" },
  qsBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  qsSheet: { position: "absolute", bottom: 0, left: 0, right: 0, backgroundColor: "#210911", borderTopLeftRadius: 22, borderTopRightRadius: 22, paddingTop: 10, paddingHorizontal: 20, borderTopWidth: StyleSheet.hairlineWidth, borderColor: "#3D0E16" },
  qsHandle: { alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(212,175,55,0.25)", marginBottom: 14 },
  qsHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  qsThumb: { width: 54, height: 54, borderRadius: 10 },
  qsTitle: { fontSize: 15, fontWeight: "700", color: TEXT, marginBottom: 2 },
  qsSub: { fontSize: 12, color: MUTED },
  qsClose: { padding: 4 },
  qsDivider: { height: StyleSheet.hairlineWidth, backgroundColor: "#3D0E16", marginBottom: 6 },
  qsRow: { flexDirection: "row", alignItems: "center", paddingVertical: 16, gap: 14 },
  qsRowBorder: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "#3D0E16" },
  qsIcon: { width: 22 },
  qsLabel: { flex: 1, fontSize: 15, color: TEXT },
  searchModalRoot: { flex: 1, backgroundColor: "#210911" },
  searchOverlay: { flexDirection: "row", alignItems: "center", backgroundColor: "#210911", paddingTop: Platform.OS === "ios" ? 56 : 36, paddingHorizontal: H_PAD, paddingBottom: 14, gap: 10 },
  searchBar: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#FFFFFF", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 12 },
  searchInput: { flex: 1, fontSize: 14, color: "#111" },
  cancelBtn: { paddingVertical: 6 },
  cancelText: { color: GOLD, fontSize: 14, fontWeight: "600" },
  searchEmpty: { flex: 1, backgroundColor: "#030806", alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  searchEmptyTitle: { fontSize: 18, fontWeight: "700", color: TEXT, textAlign: "center", marginBottom: 10 },
  searchEmptySub: { fontSize: 14, color: MUTED, textAlign: "center", lineHeight: 20 },
  backBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  headerIconBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  chipsShadow: { position: "absolute", left: 0, right: 0, bottom: -7, height: 7 },
});
