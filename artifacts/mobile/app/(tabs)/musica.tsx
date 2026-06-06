import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState, memo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Alert,
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getSoundImage } from "@/config/sound-images";
import { usePremium } from "@/context/PremiumContext";
import { MAX_ACTIVE_SOUNDS, useMixer } from "@/context/MixerContext";
import { useSaveEvent } from "@/context/SaveEventContext";
import {
  type MixSound,
  type SoundCategoryId,
  SOUNDS,
  SOUND_CATEGORIES,
  hasSoundFile,
} from "@/data/sounds";
import { useColors } from "@/hooks/useColors";

const BG       = "#0B0F14";
const CARD     = "#151A23";
const GOLD     = "#BE9650";
const FG       = "#EDE1D3";
const MUTED    = "#7A8FA8";
const BORDER   = "#1E2733";
const TAB_PILL = "#1E2733";

type MainTabId = "popular" | "naturaleza" | "ancestrales" | "sintetizadores" | "voces";

const MAIN_TABS: { id: MainTabId; label: string; icon: string; categories: SoundCategoryId[] | null }[] = [
  { id: "popular",        label: "Popular",        icon: "trending-up", categories: null },
  { id: "naturaleza",     label: "Naturaleza",     icon: "wind",        categories: ["naturaleza", "agua", "ruidos"] },
  { id: "ancestrales",    label: "Ancestrales",    icon: "bell",        categories: ["cuencos_tibetanos", "cuencos_cuarzo", "gongs", "campanas_viento"] },
  { id: "sintetizadores", label: "Sintetizadores", icon: "sliders",     categories: ["solfeggio", "frecuencias"] },
  { id: "voces",          label: "Voces",          icon: "mic",         categories: ["mantras"] },
];

const COUNTS_KEY = "@resonance_sound_play_counts";

// ── Slide+Fade al cambiar de tab ─────────────────────────────────────────────
const ContentSlide = memo(function ContentSlide({
  dir,
  children,
}: {
  dir: "right" | "left";
  children: React.ReactNode;
}) {
  const slideX  = useRef(new Animated.Value(dir === "right" ? 38 : -38)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useLayoutEffect(() => {
    const anim = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(slideX,  { toValue: 0, duration: 220, useNativeDriver: true }),
    ]);
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateX: slideX }] }}>
      {children}
    </Animated.View>
  );
});

// ── Slide+Fade para sub-tabs al aparecer ─────────────────────────────────────
const SubTabSlide = memo(function SubTabSlide({ children }: { children: React.ReactNode }) {
  const slideX  = useRef(new Animated.Value(-20)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useLayoutEffect(() => {
    const anim = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.timing(slideX,  { toValue: 0, duration: 200, useNativeDriver: true }),
    ]);
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateX: slideX }] }}>
      {children}
    </Animated.View>
  );
});

// ─────────────────────────────────────────────────────────────────────────────
export default function MiMusicaScreen() {
  const colors    = useColors();
  const insets    = useSafeAreaInsets();
  const { isPremium } = usePremium();
  const { isActive, toggleSound } = useMixer();
  const { lastSavedAt } = useSaveEvent();

  // ── Animación del ♥ al guardar mezcla ──────────────────────────────────────
  const heartScale   = useRef(new Animated.Value(1)).current;
  const heartGlow    = useRef(new Animated.Value(0)).current;
  const heartGold    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!lastSavedAt) return;
    heartScale.setValue(1);
    heartGlow.setValue(0);
    heartGold.setValue(0);
    Animated.sequence([
      Animated.parallel([
        Animated.spring(heartScale, { toValue: 1.6, friction: 3, tension: 100, useNativeDriver: true }),
        Animated.timing(heartGlow,  { toValue: 0.35, duration: 180, useNativeDriver: true }),
        Animated.timing(heartGold,  { toValue: 1,    duration: 180, useNativeDriver: true }),
      ]),
      Animated.delay(300),
      Animated.parallel([
        Animated.spring(heartScale, { toValue: 1, friction: 5, tension: 60, useNativeDriver: true }),
        Animated.timing(heartGlow,  { toValue: 0, duration: 600, useNativeDriver: true }),
        Animated.timing(heartGold,  { toValue: 0, duration: 600, useNativeDriver: true }),
      ]),
    ]).start();
  }, [lastSavedAt]); // eslint-disable-line react-hooks/exhaustive-deps

  const [mainTab,        setMainTab]        = useState<MainTabId>("popular");
  const [subTab,         setSubTab]         = useState<SoundCategoryId | null>(null);
  const [playCounts,     setPlayCounts]     = useState<Record<string, number>>({});
  const [contentAnimKey, setContentAnimKey] = useState(0);
  const [contentDir,     setContentDir]     = useState<"right" | "left">("right");
  const [subTabAnimKey,  setSubTabAnimKey]  = useState(0);

  const topPad    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

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
        Alert.alert(
          "Límite alcanzado",
          `Podés mezclar hasta ${MAX_ACTIVE_SOUNDS} sonidos a la vez. Quitá uno para agregar otro.`,
        );
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

  const currentTabDef   = MAIN_TABS.find((t) => t.id === mainTab);
  const subTabCategories = currentTabDef?.categories ?? null;

  const displayedSounds = useMemo(() => {
    if (!subTabCategories) return popularSounds;
    const catFilter = subTab ? [subTab] : subTabCategories;
    return SOUNDS.filter(
      (s) => catFilter.includes(s.category as SoundCategoryId) && hasSoundFile(s.id),
    );
  }, [mainTab, subTab, popularSounds, subTabCategories]);

  const renderSoundCard = (sound: MixSound, idx: number) => {
    const available = hasSoundFile(sound.id);
    const active    = isActive(sound.id);
    const locked    = sound.isPremium && !isPremium;
    const image     = getSoundImage(sound.id);
    const tiltDir   = idx % 2 === 0 ? "-5deg" : "5deg";

    return (
      <Pressable
        key={sound.id}
        onPress={() => handleSoundPress(sound)}
        disabled={!available}
        style={[styles.soundCard, { opacity: available ? 1 : 0.5 }]}
      >
        <View
          style={[
            styles.cardImageWrap,
            active && [
              styles.cardImageWrapActive,
              { transform: [{ rotate: tiltDir }, { scale: 1.05 }] },
            ],
            { borderColor: active ? "#FFFFFF" : "transparent" },
          ]}
        >
          {image ? (
            <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" />
          ) : (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(182,149,95,0.1)" }]} />
          )}
          {locked && (
            <Image
              source={require("../../assets/images/estrella-premium.png")}
              style={[styles.lockBadge, { width: 22, height: 22 }]}
              contentFit="contain"
            />
          )}
        </View>
        <View style={styles.cardFooter}>
          <Text style={[styles.soundName, { color: colors.foreground }]} numberOfLines={1}>
            {sound.name}
          </Text>
        </View>
      </Pressable>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: BG }]}>
      <StatusBar barStyle="light-content" />

      <View style={[styles.inner, { paddingTop: topPad + 22 }]}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.pageTitle}>Mi Música</Text>
            <Text style={styles.pageSub}>Mezclador de sonidos</Text>
          </View>
          <Pressable
            onPress={() => router.push("/mezclas" as never)}
            style={styles.heartBtn}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Mis mezclas guardadas"
          >
            {/* Glow dorado detrás */}
            <Animated.View style={[styles.heartGlow, { opacity: heartGlow }]} />
            {/* Ícono dorado (aparece durante la animación) */}
            <Animated.View style={[StyleSheet.absoluteFill, styles.heartIconAbsolute, { opacity: heartGold }]}>
              <MaterialCommunityIcons name="heart" size={24} color={GOLD} />
            </Animated.View>
            {/* Ícono blanco base */}
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              <MaterialCommunityIcons name="heart" size={24} color={FG} />
            </Animated.View>
          </Pressable>
        </View>

        {/* ── Tab bar — individual pills ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.tabScroll}
          contentContainerStyle={styles.tabContent}
        >
          {MAIN_TABS.map((tab) => {
            const sel = mainTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => handleMainTab(tab.id)}
                style={[styles.tabItem, sel && styles.tabItemActive]}
              >
                <Feather
                  name={tab.icon as any}
                  size={20}
                  color={sel ? GOLD : MUTED}
                  strokeWidth={sel ? 2.2 : 1.8}
                />
                <Text style={[styles.tabLabel, { color: sel ? FG : MUTED, fontWeight: sel ? "700" : "400" }]}>
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* ── Separador ── */}
        <View style={styles.separator} />

        {/* ── Scroll principal ── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 200 + bottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Sub-tabs (si aplica) */}
          {subTabCategories && subTabCategories.length > 1 && (
            <SubTabSlide key={subTabAnimKey}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.subTabRow}
              >
                {subTabCategories.map((catId) => {
                  const cat = SOUND_CATEGORIES.find((c) => c.id === catId);
                  if (!cat) return null;
                  const sel = subTab === catId;
                  return (
                    <Pressable
                      key={catId}
                      onPress={() => setSubTab(sel ? null : catId)}
                      style={[
                        styles.subTabPill,
                        {
                          backgroundColor: sel ? `${GOLD}14` : "rgba(255,255,255,0.05)",
                          borderColor: sel ? `${GOLD}70` : BORDER,
                        },
                      ]}
                    >
                      <Text style={[styles.subTabText, { color: sel ? FG : MUTED }]}>
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </SubTabSlide>
          )}

          {/* Grilla de sonidos — 3 columnas */}
          <ContentSlide key={contentAnimKey} dir={contentDir}>
            <View style={[styles.grid, { marginTop: 14 }]}>
              {displayedSounds.map((s, i) => renderSoundCard(s, i))}
            </View>
          </ContentSlide>
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1 },
  inner: { flex: 1 },

  // Header
  header:    { paddingHorizontal: 20, paddingBottom: 16, flexDirection: "row", alignItems: "center" },
  pageTitle: { fontSize: 20, fontWeight: "700", letterSpacing: -0.4, color: FG },
  pageSub:   { fontSize: 13, color: MUTED, marginTop: 3 },
  heartBtn: {
    width: 42, height: 42, alignItems: "center", justifyContent: "center",
    borderRadius: 21, marginLeft: 12,
  },
  heartGlow: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 21,
    backgroundColor: GOLD,
  },
  heartIconAbsolute: { alignItems: "center", justifyContent: "center" },

  // Tab bar
  tabScroll:   { flexGrow: 0 },
  tabContent:  { flexDirection: "row", gap: 4, paddingHorizontal: 12, paddingBottom: 12 },
  tabItem: {
    flexDirection: "column",
    alignItems: "center",
    gap: 5,
    paddingTop: 10,
    paddingBottom: 8,
    paddingHorizontal: 10,
    borderRadius: 14,
    minWidth: 62,
    backgroundColor: "transparent",
  },
  tabItemActive: { backgroundColor: TAB_PILL },
  tabLabel: { fontSize: 10, letterSpacing: 0.1 },

  // Separador
  separator: { height: 1, backgroundColor: BORDER, marginHorizontal: 16 },

  // Scroll
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 14 },

  // Sub-tabs
  subTabRow: { flexDirection: "row", gap: 8, paddingBottom: 14 },
  subTabPill: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  subTabText: { fontSize: 13, fontWeight: "600" },

  // Grilla de sonidos — 3 columnas uniformes
  grid: { flexDirection: "row", flexWrap: "wrap", columnGap: 10, rowGap: 22, justifyContent: "flex-start" },
  soundCard: { width: "31%" },
  cardImageWrap: {
    width: "77%",
    aspectRatio: 1,
    alignSelf: "center",
    overflow: "hidden",
    borderRadius: 18,
    borderWidth: 3,
    borderColor: "transparent",
  },
  cardImageWrapActive: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
  },
  cardFooter: { paddingHorizontal: 4, paddingTop: 8, paddingBottom: 2 },
  soundName: { fontSize: 12, fontWeight: "600", letterSpacing: 0.1, textAlign: "center" },
  lockBadge: { position: "absolute", top: 4, right: 4 },
});
