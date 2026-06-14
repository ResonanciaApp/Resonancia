import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState, memo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Alert,
  Animated,
  Easing,
  ImageBackground,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BG_HEADER = require("../../assets/images/mezclador-bg-v3.jpg");

import { getSoundImage } from "@/config/sound-images";
import { usePremium } from "@/context/PremiumContext";
import { MAX_ACTIVE_SOUNDS, useMixer } from "@/context/MixerContext";
import { useSaveEvent } from "@/context/SaveEventContext";
import { useDrawer } from "@/context/DrawerContext";
import { useUserProfile } from "@/context/UserProfileContext";
import {
  type MixSound,
  type SoundCategoryId,
  SOUNDS,
  SOUND_CATEGORIES,
  hasSoundFile,
} from "@/data/sounds";

// ── Paleta Mármol Blanco ──────────────────────────────────────────────────────
const GOLD  = "#D4AF37";
const DARK  = "#1A1E2B";
const MUTED = "#6B7A96";

const SUB_TAB_LABELS: Partial<Record<SoundCategoryId, string>> = {
  cuencos_tibetanos: "Tibetanos",
  cuencos_cuarzo:    "Cuarzo",
  gongs:             "Gongs",
  campanas_viento:   "Campanas",
  vientos:           "Vientos",
  cantos:            "Cantos",
  percusion:         "Percusión",
};

const SUB_TAB_ICONS: Partial<Record<SoundCategoryId, string>> = {
  animales:          "paw",
  bosque:            "tree",
  mar:               "waves",
  fuego:             "fire",
  desierto:          "weather-sunny",
  cuencos_tibetanos: "bowl-mix",
  cuencos_cuarzo:    "circle-outline",
  gongs:             "bell-outline",
  campanas_viento:   "weather-windy",
  vientos:           "weather-windy",
  cantos:            "microphone",
  percusion:         "music-note",
  mantras:           "om",
  solfeggio:         "music-clef-treble",
  frecuencias:       "sine-wave",
  ruidos:            "volume-vibrate",
};

type MainTabId = "popular" | "naturaleza" | "ancestrales" | "sintetizadores" | "binaurales" | "voces" | "asmr" | "ruidos" | "bpm";

const MAIN_TABS: {
  id: MainTabId;
  label: string;
  icon: string;
  color: string;
  categories: SoundCategoryId[] | null;
}[] = [
  { id: "popular",        label: "Todos",      icon: "music-note-eighth", color: "#1A1E2B", categories: null },
  { id: "naturaleza",     label: "Naturales",  icon: "leaf",              color: "#3A9060", categories: ["animales", "bosque", "mar", "fuego", "desierto"] },
  { id: "ancestrales",    label: "Sagrados",   icon: "bell",              color: "#B09040", categories: ["cuencos_tibetanos", "cuencos_cuarzo", "gongs", "campanas_viento", "vientos", "cantos", "percusion"] },
  { id: "sintetizadores", label: "Digital",    icon: "sine-wave",         color: "#3A80B0", categories: ["solfeggio"] },
  { id: "binaurales",     label: "Binaurales", icon: "sine-wave",         color: "#4A60C0", categories: ["frecuencias"] },
  { id: "voces",          label: "Voces",      icon: "microphone",        color: "#9060A0", categories: ["mantras"] },
  { id: "asmr",           label: "ASMR",       icon: "headphones",        color: "#408070", categories: ["asmr"] },
  { id: "ruidos",         label: "Ruidos",     icon: "radio",             color: "#607080", categories: ["ruidos"] },
  { id: "bpm",            label: "BPM",        icon: "metronome",         color: "#A04040", categories: ["bpm"] },
];

const COUNTS_KEY = "@resonance_sound_play_counts_m3";

// ── Colores de tab ────────────────────────────────────────────────────────────
function hexAlpha(hex: string, a: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${a})`;
}

const TAB_TINT: Record<MainTabId, { glow: string }> = {
  popular:        { glow: "#284a86" },
  naturaleza:     { glow: "#43B97F" },
  ancestrales:    { glow: "#FFB347" },
  sintetizadores: { glow: "#7A5CFA" },
  binaurales:     { glow: "#2DD4BF" },
  voces:          { glow: "#FF6B6B" },
  asmr:           { glow: "#0D9488" },
  ruidos:         { glow: "#0EA5E9" },
  bpm:            { glow: "#FFD166" },
};

const TAB_GRADIENT: Record<MainTabId, [string, string]> = {
  popular:        ["#5E1E2D", "#1B090F"],   // borgoña oscuro
  naturaleza:     ["#43B97F", "#0D5C3A"],   // selva esmeralda
  ancestrales:    ["#FFB347", "#E85D04"],   // atardecer cálido
  sintetizadores: ["#7A5CFA", "#3A0CA3"],   // púrpura cósmico
  binaurales:     ["#2DD4BF", "#0E7490"],   // brisa tropical
  voces:          ["#FF6B6B", "#C9184A"],   // coral vibrante
  asmr:           ["#0D9488", "#065F4A"],   // verde esmeralda profundo
  ruidos:         ["#0EA5E9", "#0369A1"],   // azul cielo
  bpm:            ["#FFD166", "#B8860B"],   // sol dorado
};

// ── PillTab ───────────────────────────────────────────────────────────────────
const PillTab = memo(function PillTab({
  tab, sel, onPress,
}: { tab: (typeof MAIN_TABS)[0]; sel: boolean; onPress: () => void }) {
  const c = tab.color;
  return (
    <Pressable onPress={onPress}>
      {sel ? (
        <View style={[styles.pillGlow, { backgroundColor: TAB_GRADIENT[tab.id][0] }]}>
          <LinearGradient
            colors={TAB_GRADIENT[tab.id]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.pillTab}
          >
            <MaterialCommunityIcons name={tab.icon as any} size={17} color="#FFFFFF" />
            <Text numberOfLines={1} style={[styles.pillTabLabel, { color: "#FFFFFF", fontWeight: "700" }]}>
              {tab.label}
            </Text>
          </LinearGradient>
        </View>
      ) : (
        <View style={[styles.pillTab, { backgroundColor: "#F5F4F2", borderWidth: 1, borderColor: "#DEDEDE", opacity: 0.8 }]}>
          <MaterialCommunityIcons name={tab.icon as any} size={17} color="rgba(0,0,0,0.6)" />
          <Text numberOfLines={1} style={[styles.pillTabLabel, { color: "rgba(0,0,0,0.6)", fontWeight: "400" }]}>
            {tab.label}
          </Text>
        </View>
      )}
    </Pressable>
  );
});

// ── CarouselTile ──────────────────────────────────────────────────────────────
const CarouselTile = memo(function CarouselTile({
  tab,
  sel,
  tileW,
  onPress,
}: {
  tab: (typeof MAIN_TABS)[0];
  sel: boolean;
  tileW: number;
  onPress: () => void;
}) {
  const c    = tab.color;
  const c50  = c + "80";
  const c10  = c + "1A";

  const rippleAnim = useRef(new Animated.Value(1)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;
  const iconAnim   = useRef(new Animated.Value(0)).current;
  const running    = useRef<Animated.CompositeAnimation | null>(null);

  const triggerLatido = () => {
    running.current?.stop();
    rippleAnim.setValue(0);
    running.current = Animated.parallel([
      Animated.timing(rippleAnim, { toValue: 1, duration: 1700, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.sequence([
        Animated.timing(iconAnim, { toValue: 1, duration: 180, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(iconAnim, { toValue: 0, duration: 370, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]),
    ]);
    running.current.start();
    borderAnim.setValue(0);
    Animated.sequence([
      Animated.timing(borderAnim, { toValue: 1, duration: 200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(borderAnim, { toValue: 0, duration: 450, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();
    onPress();
  };

  const rippleScale   = rippleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.46] });
  const rippleOpacity = rippleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0] });
  const borderOverlayOpacity = borderAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const iconScale   = iconAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] });
  const iconOpacity = iconAnim.interpolate({ inputRange: [0, 1], outputRange: [sel ? 1 : 0.5, 1] });

  return (
    <Pressable
      onPress={triggerLatido}
      style={[
        styles.carouselTile,
        { width: tileW, borderColor: sel ? c50 : "rgba(0,0,0,0.10)" },
        sel && { backgroundColor: c10 },
      ]}
    >
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.rippleRing, { borderColor: c50, transform: [{ scale: rippleScale }], opacity: rippleOpacity }]}
      />
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.borderFlash, { borderColor: c50, opacity: borderOverlayOpacity }]}
      />
      <Animated.View pointerEvents="none" style={{ transform: [{ scale: iconScale }], opacity: iconOpacity }}>
        <MaterialCommunityIcons
          name={tab.icon as any}
          size={tileW * 0.28 + 3}
          color={sel ? c : MUTED}
        />
      </Animated.View>
      <Text numberOfLines={1} style={[styles.carouselTileLabel, { color: sel ? c : MUTED, fontWeight: sel ? "700" : "400" }]}>
        {tab.label}
      </Text>
    </Pressable>
  );
});

// ── ContentSlide / SubTabSlide ────────────────────────────────────────────────
const ContentSlide = memo(function ContentSlide({ dir, children }: { dir: "right" | "left"; children: React.ReactNode }) {
  const slideX  = useRef(new Animated.Value(dir === "right" ? 38 : -38)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useLayoutEffect(() => {
    const a = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(slideX,  { toValue: 0, duration: 220, useNativeDriver: true }),
    ]);
    a.start();
    return () => a.stop();
  }, []);
  return <Animated.View style={{ opacity, transform: [{ translateX: slideX }] }}>{children}</Animated.View>;
});

const SubTabSlide = memo(function SubTabSlide({ children }: { children: React.ReactNode }) {
  const slideX  = useRef(new Animated.Value(-20)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  useLayoutEffect(() => {
    const a = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(slideX,  { toValue: 0, duration: 200, useNativeDriver: true }),
    ]);
    a.start();
    return () => a.stop();
  }, []);
  return <Animated.View style={{ opacity, transform: [{ translateX: slideX }] }}>{children}</Animated.View>;
});

// ── SoundCard ─────────────────────────────────────────────────────────────────
type SoundCardProps = {
  sound: MixSound;
  idx: number;
  active: boolean;
  locked: boolean;
  available: boolean;
  image: ReturnType<typeof getSoundImage>;
  onPress: () => void;
};

const SoundCard = memo(function SoundCard({ sound, idx, active, locked, available, image, onPress }: SoundCardProps) {
  const anim = useRef(new Animated.Value(active ? 1 : 0)).current;
  const [decorated, setDecorated] = useState(active);

  useEffect(() => {
    if (active) setDecorated(true);
    const a = Animated.timing(anim, {
      toValue: active ? 1 : 0,
      duration: 260,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    });
    a.start(({ finished }) => { if (finished && !active) setDecorated(false); });
    return () => a.stop();
  }, [active, anim]);

  const tiltDir   = idx % 2 === 0 ? "-4deg" : "4deg";
  const rotate    = anim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", tiltDir] });
  const scale     = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });
  const borderCol = anim.interpolate({ inputRange: [0, 1], outputRange: ["rgba(212,175,55,0)", "rgba(212,175,55,1)"] });

  return (
    <Pressable onPress={onPress} disabled={!available} style={[styles.soundCard, { opacity: available ? 1 : 0.45 }]}>
      {/* Capa exterior: transform + sombra (sin overflow:hidden para que borderRadius funcione) */}
      <Animated.View
        style={[
          styles.cardImageWrap,
          decorated && styles.cardImageWrapActive,
          { transform: [{ rotate }, { scale }], borderColor: borderCol },
        ]}
      >
        {/* Capa interior: recorte real de esquinas */}
        <View style={styles.cardClipInner}>
          {image ? (
            <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(212,175,55,0.12)" }]} />
          )}
          {!decorated && (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.15)" }]} />
          )}
          {locked && (
            <Image
              source={require("../../assets/images/estrella-premium.png")}
              style={[styles.lockBadge, { width: 20, height: 20 }]}
              contentFit="contain"
            />
          )}
        </View>
      </Animated.View>
      <View style={styles.cardFooter}>
        <Text style={styles.soundName} numberOfLines={1}>{sound.name}</Text>
      </View>
    </Pressable>
  );
});

// ── PANTALLA ──────────────────────────────────────────────────────────────────
export default function MiMusicaBlancoScreen() {
  const insets   = useSafeAreaInsets();
  const { isPremium }   = usePremium();
  const { photoUri } = useUserProfile();
  const { open: openDrawer } = useDrawer();
  const { isActive, toggleSound } = useMixer();
  const { lastSavedAt } = useSaveEvent();

  const heartGlow = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    if (!lastSavedAt) return;
    heartGlow.stopAnimation(() => {
      heartGlow.setValue(0);
      Animated.sequence([
        Animated.timing(heartGlow, { toValue: 1, duration: 350, useNativeDriver: true }),
        Animated.delay(500),
        Animated.timing(heartGlow, { toValue: 0, duration: 750, useNativeDriver: true }),
      ]).start();
    });
  }, [lastSavedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const [mainTab,        setMainTab]        = useState<MainTabId>("popular");
  const [subTab,         setSubTab]         = useState<SoundCategoryId | null>(null);
  const [playCounts,     setPlayCounts]     = useState<Record<string, number>>({});
  const [contentAnimKey, setContentAnimKey] = useState(0);
  const [contentDir,     setContentDir]     = useState<"right" | "left">("right");
  const [subTabAnimKey,  setSubTabAnimKey]  = useState(0);

  const { width } = useWindowDimensions();
  const topPad    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const TILE_GAP   = 10;
  const TILE_H_PAD = 16;
  const tileW      = (width - TILE_H_PAD * 2 - TILE_GAP * 2) / 3.3;

  const handleMainTab = (id: MainTabId) => {
    if (id === mainTab) return;
    const ids = MAIN_TABS.map((t) => t.id);
    setContentDir(ids.indexOf(id) > ids.indexOf(mainTab) ? "right" : "left");
    setMainTab(id);
    setSubTab(null);
    setContentAnimKey((k) => k + 1);
    setSubTabAnimKey((k) => k + 1);
  };

  useEffect(() => {
    AsyncStorage.getItem(COUNTS_KEY)
      .then((raw) => { if (raw) setPlayCounts(JSON.parse(raw)); })
      .catch(() => {});
  }, []);

  const incrementCount = (soundId: string) => {
    setPlayCounts((prev) => {
      const next = { ...prev, [soundId]: (prev[soundId] ?? 0) + 1 };
      AsyncStorage.setItem(COUNTS_KEY, JSON.stringify(next)).catch(() => {});
      return next;
    });
  };

  const handleSoundPress = (sound: MixSound) => {
    if (!hasSoundFile(sound.id)) return;
    if (sound.isPremium && !isPremium) {
      router.push("/membresia" as never);
      return;
    }
    if (!isActive(sound.id)) {
      const ok = toggleSound(sound.id);
      if (!ok) {
        Alert.alert("Límite alcanzado", `Podés mezclar hasta ${MAX_ACTIVE_SOUNDS} sonidos a la vez. Quitá uno para agregar otro.`);
      } else {
        incrementCount(sound.id);
      }
    } else {
      toggleSound(sound.id);
    }
  };

  const popularSounds = useMemo(() =>
    SOUNDS.filter((s) => hasSoundFile(s.id))
      .slice()
      .sort((a, b) => (playCounts[b.id] ?? 0) - (playCounts[a.id] ?? 0))
      .slice(0, 50),
    [playCounts],
  );

  const currentTabDef    = MAIN_TABS.find((t) => t.id === mainTab);
  const subTabCategories = currentTabDef?.categories ?? null;

  const displayedSounds = useMemo(() => {
    if (!subTabCategories) return popularSounds;
    const catFilter = subTab ? [subTab] : subTabCategories;
    return SOUNDS.filter((s) => catFilter.includes(s.category as SoundCategoryId) && hasSoundFile(s.id));
  }, [mainTab, subTab, popularSounds, subTabCategories]);

  return (
    <ImageBackground source={BG_HEADER} style={styles.root} resizeMode="cover">
      <StatusBar barStyle="light-content" />

      <View style={styles.inner}>

        {/* ── Zona superior ── */}
        <View style={styles.topPanelShadow}>
        <LinearGradient
          colors={["#4A0C0C", "#27070E", "#1B060F"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.topPanel, { paddingTop: topPad + 2 }]}
        >

          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.pageTitle}>Mezclador</Text>
                <Text style={styles.pageSubtitle}>Sonidos de la tierra y el universo.</Text>
              </View>
              <Pressable
                onPress={() => router.push("/mezclas" as never)}
                style={styles.heartBtn}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Mis mezclas guardadas"
              >
                <MaterialCommunityIcons name="cog-outline" size={20} color="#F4DAD5" />
              </Pressable>
            </View>
          </View>

          {/* ── Tabs en píldora ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.pillRow}
            contentContainerStyle={styles.pillRowContent}
          >
            {MAIN_TABS.map((tab) => (
              <PillTab
                key={tab.id}
                tab={tab}
                sel={mainTab === tab.id}
                onPress={() => handleMainTab(tab.id)}
              />
            ))}
          </ScrollView>

          {/* ── Sub-tabs ── */}
          {subTabCategories && subTabCategories.length > 1 ? (
            <View style={styles.subTabZone}>
              <View style={styles.subTabLine} pointerEvents="none" />
              <SubTabSlide key={subTabAnimKey}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subTabRow}>
                  {subTabCategories.map((catId) => {
                    const cat = SOUND_CATEGORIES.find((c) => c.id === catId);
                    if (!cat) return null;
                    const sel = subTab === catId;
                    const grad = TAB_GRADIENT[mainTab];
                    return (
                      <Pressable
                        key={catId}
                        onPress={() => setSubTab(sel ? null : catId)}
                      >
                        {sel ? (
                          <LinearGradient
                            colors={grad}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 0, y: 1 }}
                            style={[styles.subTabPill, { borderWidth: 0 }]}
                          >
                            {SUB_TAB_ICONS[catId] && (
                              <MaterialCommunityIcons
                                name={SUB_TAB_ICONS[catId] as any}
                                size={15}
                                color="#FFFFFF"
                                style={{ marginRight: 5 }}
                              />
                            )}
                            <Text style={[styles.subTabText, { color: "#FFFFFF", fontWeight: "700" }]}>
                              {SUB_TAB_LABELS[catId] ?? cat.label}
                            </Text>
                          </LinearGradient>
                        ) : (
                          <View style={[styles.subTabPill, { backgroundColor: "#F7F7F7", borderColor: "#E8E8E8", opacity: 0.8 }]}>
                            {SUB_TAB_ICONS[catId] && (
                              <MaterialCommunityIcons
                                name={SUB_TAB_ICONS[catId] as any}
                                size={15}
                                color="rgba(0,0,0,0.6)"
                                style={{ marginRight: 5 }}
                              />
                            )}
                            <Text style={[styles.subTabText, { color: "rgba(0,0,0,0.6)" }]}>
                              {SUB_TAB_LABELS[catId] ?? cat.label}
                            </Text>
                          </View>
                        )}
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </SubTabSlide>
            </View>
          ) : (
            <View style={styles.separator} />
          )}

        </LinearGradient>
        </View>

        {/* ── Scroll principal ── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 200 + bottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          <ContentSlide key={contentAnimKey} dir={contentDir}>
            <View style={[styles.grid, { marginTop: 14 }]}>
              {displayedSounds.map((s, i) => (
                <SoundCard
                  key={s.id}
                  sound={s}
                  idx={i}
                  active={isActive(s.id)}
                  locked={!!s.isPremium && !isPremium}
                  available={hasSoundFile(s.id)}
                  image={getSoundImage(s.id)}
                  onPress={() => handleSoundPress(s)}
                />
              ))}
            </View>
          </ContentSlide>
        </ScrollView>
      </View>

      {/* ── Selector de versión (dev) ── */}
      <View pointerEvents="box-none" style={{ position: "absolute", bottom: 110, alignSelf: "center", flexDirection: "row", gap: 6, zIndex: 999 }}>
        {([ ["V1","musica"], ["V2","musica2"], ["V3","musica3"], ["V4","musica4"] ] as [string,string][]).map(([label, route]) => (
          <Pressable key={route} onPress={() => router.replace(`/(tabs)/${route}` as any)}
            style={{ paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999,
              backgroundColor: route === "musica3" ? "rgba(157,78,221,0.8)" : "rgba(0,0,0,0.65)",
              borderWidth: 1, borderColor: route === "musica3" ? "#9D4EDD" : "rgba(255,255,255,0.25)" }}>
            <Text style={{ color: "#FFFFFF", fontSize: 12, fontWeight: "700" }}>{label}</Text>
          </Pressable>
        ))}
      </View>

    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: "#FFFFFF" },
  inner: { flex: 1, backgroundColor: "transparent" },

  topPanelShadow: {
    zIndex: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 16,
    backgroundColor: "#4A0C0C",
  },
  topPanel: {
    backgroundColor: "transparent",
  },

  header:    { paddingHorizontal: 20, marginBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  avatarBtn:      { width: 32, height: 32, borderRadius: 16, overflow: "hidden" },
  avatarSmall:    { width: 32, height: 32, borderRadius: 16 },
  avatarFallback: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(212,175,55,0.12)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(212,175,55,0.25)" },
  pageSuper: { fontSize: 10, letterSpacing: 1.8, color: GOLD, fontWeight: "600", marginBottom: 2 },
  pageTitle: { fontSize: 27, fontWeight: "700", letterSpacing: 0.5, color: "#F4DAD5" },
  pageSubtitle: { fontSize: 13, fontWeight: "400", color: "rgba(244,218,213,0.55)", marginTop: 2 },
  heartBtn:  {
    width: 40, height: 40, alignItems: "center", justifyContent: "center",
    borderRadius: 12, backgroundColor: "rgba(0,0,0,0.05)",
  },
  heartGlow: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" },

  pillRow:        { flexGrow: 0, marginTop: -3, marginBottom: -5, backgroundColor: "transparent" },
  pillRowContent: { flexDirection: "row", gap: 8, paddingHorizontal: 15, paddingTop: 20, paddingBottom: 24 },
  pillGlow: {
    borderRadius: 999,
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.30,
    shadowRadius: 10,
    elevation: 6,
  },
  pillTab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: 104,
    height: 44,
    borderRadius: 999,
    overflow: "hidden",
    gap: 4,
  },
  pillTabLabel: { fontSize: 12, letterSpacing: 0.1, fontWeight: "700" },

  carouselScroll:   { flexGrow: 0, marginTop: 4 },
  carouselContent:  { paddingBottom: 12, flexDirection: "row" },
  carouselTile: {
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "rgba(0,0,0,0.03)",
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
    paddingVertical: 6,
    overflow: "visible",
  },
  rippleRing:  { borderRadius: 999, borderWidth: 1 },
  borderFlash: { borderRadius: 999, borderWidth: 1 },
  carouselTileLabel: { fontSize: 12, letterSpacing: 0.1, textAlign: "center" },

  separator: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(0,0,0,0.07)", marginTop: 14 },

  scroll:        { flex: 1, backgroundColor: "#EDECEA" },
  scrollContent: { paddingHorizontal: 14, paddingTop: 14 },

  subTabZone: { position: "relative", justifyContent: "center", marginTop: 0 },
  subTabLine: {
    position: "absolute", left: 16, right: 16, bottom: 0,
    height: StyleSheet.hairlineWidth, backgroundColor: "rgba(0,0,0,0.07)",
  },
  subTabRow:  { flexDirection: "row", gap: 8, paddingTop: 4, paddingBottom: 12, paddingHorizontal: 16 },
  subTabPill: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 999, borderWidth: 1,
  },
  subTabText: { fontSize: 12, fontWeight: "600" },

  grid:     { flexDirection: "row", flexWrap: "wrap", columnGap: 10, rowGap: 22, justifyContent: "space-evenly" },
  soundCard: { width: "28%" },
  cardImageWrap: {
    width: "79%",
    aspectRatio: 1,
    alignSelf: "center",
    borderRadius: 16,
    borderWidth: 2.5,
    borderColor: "transparent",
  },
  cardClipInner: {
    flex: 1,
    borderRadius: 14,
    overflow: "hidden",
    backgroundColor: "rgba(212,175,55,0.08)",
  },
  cardImageWrapActive: {
    shadowColor: GOLD,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  cardFooter: { paddingHorizontal: 4, paddingTop: 8, paddingBottom: 2 },
  soundName:  { fontSize: 11.5, fontWeight: "600", letterSpacing: 0.1, textAlign: "center", color: DARK },
  lockBadge:  { position: "absolute", top: 4, right: 4 },
});
