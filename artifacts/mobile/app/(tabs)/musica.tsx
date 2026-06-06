import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useLayoutEffect, useMemo, useRef, useState, memo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Alert,
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
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

const BG_GRADIENT = ["#090D20", "#080A18", "#06070F"] as const;
const CARD     = "#151A23";
const GOLD     = "#BE9650";
const FG       = "#EDE1D3";
const MUTED    = "#7A8FA8";
const TAB_PILL = "#1E2733";

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

const NATURE_ICONS: Partial<Record<SoundCategoryId, number>> = {
  animales: require("@/assets/images/nature/animales.png"),
  bosque:   require("@/assets/images/nature/bosque.png"),
  mar:      require("@/assets/images/nature/mar.png"),
  fuego:    require("@/assets/images/nature/fuego.png"),
  desierto: require("@/assets/images/nature/desierto.png"),
};

type MainTabId = "popular" | "naturaleza" | "ancestrales" | "sintetizadores";

const MAIN_TABS: { id: MainTabId; label: string; categories: SoundCategoryId[] | null }[] = [
  { id: "popular",        label: "Todos",     categories: null },
  { id: "naturaleza",     label: "Naturales", categories: ["animales", "bosque", "mar", "fuego", "desierto"] },
  { id: "ancestrales",    label: "Sagrados",  categories: ["cuencos_tibetanos", "cuencos_cuarzo", "gongs", "campanas_viento", "vientos", "cantos", "percusion"] },
  { id: "sintetizadores", label: "Digital",   categories: ["solfeggio", "frecuencias"] },
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
type SoundCardProps = {
  sound: MixSound;
  idx: number;
  active: boolean;
  locked: boolean;
  available: boolean;
  image: ReturnType<typeof getSoundImage>;
  foreground: string;
  onPress: () => void;
};

/**
 * Card de sonido del mezclador. El estado seleccionado (giro + escala + borde
 * blanco) se ANIMA con `anim` (0↔1) en vez de aplicarse de golpe: así al
 * deseleccionar (tap o cierre de la mezcla) la imagen vuelve a su posición con
 * un giro sutil que acompaña al fade, sin saltos. El borde se anima con color
 * (no native driver) junto al transform.
 */
const SoundCard = memo(function SoundCard({
  sound,
  idx,
  active,
  locked,
  available,
  image,
  foreground,
  onPress,
}: SoundCardProps) {
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
    a.start(({ finished }) => {
      if (finished && !active) setDecorated(false);
    });
    return () => a.stop();
  }, [active, anim]);

  const tiltDir = idx % 2 === 0 ? "-5deg" : "5deg";
  const rotate = anim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", tiltDir] });
  const scale = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });
  const borderColor = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(255,255,255,0)", "rgba(255,255,255,1)"],
  });

  return (
    <Pressable
      onPress={onPress}
      disabled={!available}
      style={[styles.soundCard, { opacity: available ? 1 : 0.5 }]}
    >
      <Animated.View
        style={[
          styles.cardImageWrap,
          decorated && styles.cardImageWrapActive,
          { transform: [{ rotate }, { scale }], borderColor },
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
      </Animated.View>
      <View style={styles.cardFooter}>
        <Text style={[styles.soundName, { color: foreground }]} numberOfLines={1}>
          {sound.name}
        </Text>
      </View>
    </Pressable>
  );
});

export default function MiMusicaScreen() {
  const colors    = useColors();
  const insets    = useSafeAreaInsets();
  const { isPremium } = usePremium();
  const { isActive, toggleSound } = useMixer();
  const { lastSavedAt } = useSaveEvent();

  // ── Animación del ♥ al guardar mezcla ──────────────────────────────────────
  // Corazón relleno semitransparente en reposo; fade-in a blanco pleno al guardar.
  // useNativeDriver:true → hilo nativo, sin jank.
  const HEART_DIM  = 0.28;  // opacidad en reposo
  const heartOpacity = useRef(new Animated.Value(HEART_DIM)).current;

  useEffect(() => {
    if (!lastSavedAt) return;
    heartOpacity.stopAnimation(() => {
      heartOpacity.setValue(HEART_DIM);
      Animated.sequence([
        Animated.timing(heartOpacity, { toValue: 1,         duration: 400, useNativeDriver: true }),
        Animated.delay(500),
        Animated.timing(heartOpacity, { toValue: HEART_DIM, duration: 750, useNativeDriver: true }),
      ]).start();
    });
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

  const renderSoundCard = (sound: MixSound, idx: number) => (
    <SoundCard
      key={sound.id}
      sound={sound}
      idx={idx}
      active={isActive(sound.id)}
      locked={!!sound.isPremium && !isPremium}
      available={hasSoundFile(sound.id)}
      image={getSoundImage(sound.id)}
      foreground={colors.foreground}
      onPress={() => handleSoundPress(sound)}
    />
  );

  return (
    <LinearGradient
      style={styles.root}
      colors={BG_GRADIENT}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
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
            {/* Relleno sólido, semitransparente en reposo; se ilumina al guardar */}
            <Animated.View style={{ opacity: heartOpacity }}>
              <MaterialCommunityIcons name="heart" size={24} color={FG} />
            </Animated.View>
          </Pressable>
        </View>

        {/* ── Tab bar — individual pills ── */}
        <View style={styles.tabContent}>
          {MAIN_TABS.map((tab) => {
            const sel = mainTab === tab.id;
            return (
              <Pressable
                key={tab.id}
                onPress={() => handleMainTab(tab.id)}
                style={[styles.tabItem, sel && styles.tabItemActive]}
              >
                <Text
                  numberOfLines={1}
                  style={[styles.tabLabel, { color: "#FFFFFF", fontWeight: sel ? "700" : "400" }]}
                >
                  {tab.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* ── Separador / Sub-tabs sobre la línea ── */}
        {subTabCategories && subTabCategories.length > 1 ? (
          <View style={styles.subTabZone}>
            <View style={styles.subTabLine} pointerEvents="none" />
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
                          backgroundColor: sel ? "rgba(107,154,181,0.14)" : "rgba(255,255,255,0.03)",
                          borderColor: "transparent",
                        },
                      ]}
                    >
                      {SUB_TAB_ICONS[catId] && (
                        <MaterialCommunityIcons
                          name={SUB_TAB_ICONS[catId] as any}
                          size={26}
                          color={sel ? GOLD : MUTED}
                          style={{ marginBottom: 5 }}
                        />
                      )}
                      <Text style={[styles.subTabText, { color: "#FFFFFF" }]}>
                        {cat.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
            </SubTabSlide>
          </View>
        ) : (
          <View style={styles.separator} />
        )}

        {/* ── Scroll principal ── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 200 + bottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Grilla de sonidos — 3 columnas */}
          <ContentSlide key={contentAnimKey} dir={contentDir}>
            <View style={[styles.grid, { marginTop: 14 }]}>
              {displayedSounds.map((s, i) => renderSoundCard(s, i))}
            </View>
          </ContentSlide>
        </ScrollView>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1 },
  inner: { flex: 1 },

  // Header
  header:    { paddingHorizontal: 20, paddingBottom: 16, flexDirection: "row", alignItems: "center" },
  pageTitle: { fontSize: 30, fontWeight: "700", letterSpacing: 0.5, color: "#FFFFFF" },
  pageSub:   { fontSize: 13, color: MUTED, marginTop: 3 },
  heartBtn: {
    width: 42, height: 42, alignItems: "center", justifyContent: "center",
    borderRadius: 21, marginLeft: 12,
  },

  // Tab bar
  tabContent:  { flexDirection: "row", gap: 3, paddingHorizontal: 8, paddingBottom: 12 },
  tabItem: {
    flex: 1,
    flexDirection: "column",
    alignItems: "center",
    gap: 5,
    paddingTop: 20,
    paddingBottom: 18,
    paddingHorizontal: 2,
    borderRadius: 14,
    minWidth: 62,
    borderWidth: 1,
    borderColor: "transparent",
    backgroundColor: "rgba(255,255,255,0.03)",
  },
  tabItemActive: { backgroundColor: "rgba(70,60,200,0.22)", borderColor: "rgba(190,150,80,0.45)" },
  tabLabel: { fontSize: 15, letterSpacing: 0, textAlign: "center" },

  // Separador
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.08)", marginHorizontal: 16 },

  // Scroll
  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 14 },

  // Sub-tabs sobre la línea divisora
  subTabZone: { position: "relative", justifyContent: "center", marginTop: -5 },
  subTabLine: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 0,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  subTabRow: { flexDirection: "row", gap: 8, paddingTop: 4, paddingBottom: 12, paddingHorizontal: 16 },
  subTabPill: {
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: 80,
    height: 80,
    borderRadius: 14,
    borderWidth: 1,
  },
  subTabText: { fontSize: 11, fontWeight: "600", textAlign: "center" },

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
