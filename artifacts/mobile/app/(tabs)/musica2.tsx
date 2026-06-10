import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, memo } from "react";
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
  useWindowDimensions,
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
const GOLD     = "#BE9650";
const FG       = "#EDE1D3";
const MUTED    = "#7A8FA8";

const SUB_TAB_LABELS: Partial<Record<SoundCategoryId, string>> = {
  cuencos_tibetanos: "Tibetanos",
  cuencos_cuarzo:    "Cuarzo",
  gongs:             "Gongs",
  campanas_viento:   "Campanas",
  vientos:           "Vientos",
  cantos:            "Cantos",
  percusion:         "Percusión",
};

const SUB_TAB_ICON_COLORS: Partial<Record<SoundCategoryId, string>> = {
  animales:   "#F0A875",
  bosque:     "#7DC87A",
  mar:        "#7DC5E8",
  fuego:      "#C4695A",
  desierto:   "#C4A882",
  solfeggio:  "#9A9CCD",
  frecuencias: "#9A9CCD",
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

const NATURE_ICONS: Partial<Record<SoundCategoryId, number>> = {
  animales: require("@/assets/images/nature/animales.png"),
  bosque:   require("@/assets/images/nature/bosque.png"),
  mar:      require("@/assets/images/nature/mar.png"),
  fuego:    require("@/assets/images/nature/fuego.png"),
  desierto: require("@/assets/images/nature/desierto.png"),
};

type MainTabId = "popular" | "naturaleza" | "ancestrales" | "sintetizadores";

const MAIN_TABS: { id: MainTabId; label: string; icon: string; color: string; categories: SoundCategoryId[] | null }[] = [
  { id: "popular",        label: "Todos",     icon: "music-note-eighth", color: "#E8E4DF", categories: null },
  { id: "naturaleza",     label: "Naturales", icon: "leaf",              color: "#6DBF8A", categories: ["animales", "bosque", "mar", "fuego", "desierto"] },
  { id: "ancestrales",    label: "Sagrados",  icon: "bell",              color: "#D4B44A", categories: ["cuencos_tibetanos", "cuencos_cuarzo", "gongs", "campanas_viento", "vientos", "cantos", "percusion"] },
  { id: "sintetizadores", label: "Digital",   icon: "sine-wave",         color: "#6BBCDA", categories: ["solfeggio", "frecuencias"] },
];

const COUNTS_KEY = "@resonance_sound_play_counts";

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
  const c = tab.color;          // color base del tab
  const c50 = c + "80";         // 50% opacidad — para borde y onda
  const c08 = c + "14";         // ~8% opacidad  — para fondo seleccionado
  // Ring — start at 1 (done = invisible)
  const rippleAnim = useRef(new Animated.Value(1)).current;
  // Border flash — useNativeDriver:false (color property)
  const borderAnim = useRef(new Animated.Value(0)).current;
  // Icon flash
  const iconAnim   = useRef(new Animated.Value(0)).current;
  const running    = useRef<Animated.CompositeAnimation | null>(null);

  const triggerLatido = useCallback(() => {
    running.current?.stop();

    // 1. Ring: scale 0.98→1.46, opacity 0.22→0, 1700ms
    rippleAnim.setValue(0);
    running.current = Animated.parallel([
      Animated.timing(rippleAnim, {
        toValue: 1, duration: 1700,
        easing: Easing.out(Easing.ease), useNativeDriver: true,
      }),
      // 3. Icon scale+opacity flash, 550ms
      Animated.sequence([
        Animated.timing(iconAnim, { toValue: 1, duration: 180, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.timing(iconAnim, { toValue: 0, duration: 370, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      ]),
    ]);
    running.current.start();

    // 2. Border overlay flash (opacity only → useNativeDriver: true)
    borderAnim.setValue(0);
    Animated.sequence([
      Animated.timing(borderAnim, { toValue: 1, duration: 200, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(borderAnim, { toValue: 0, duration: 450, easing: Easing.out(Easing.ease), useNativeDriver: true }),
    ]).start();

    onPress();
  }, [rippleAnim, borderAnim, iconAnim, onPress]);

  const rippleScale   = rippleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.98, 1.46] });
  const rippleOpacity = rippleAnim.interpolate({ inputRange: [0, 1], outputRange: [0.22, 0] });

  // Border flash overlay: opacity 0→1→0 sobre el borde de la card
  const borderOverlayOpacity = borderAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  const iconScale   = iconAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] });
  const iconOpacity = iconAnim.interpolate({ inputRange: [0, 1], outputRange: [sel ? 1 : 0.4, 1] });

  return (
    <Pressable
      onPress={triggerLatido}
      style={[
        styles.carouselTile,
        { width: tileW, borderColor: sel ? c50 : "#1C2740" },
        sel && { backgroundColor: c08 },
      ]}
    >
      {/* Onda expansiva — color del tab al 50% */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          styles.rippleRing,
          { borderColor: c50, transform: [{ scale: rippleScale }], opacity: rippleOpacity },
        ]}
      />

      {/* Flash del borde — overlay circular al 50% */}
      <Animated.View
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          styles.borderFlash,
          { borderColor: c50, opacity: borderOverlayOpacity },
        ]}
      />

      {/* Ícono con flash */}
      <Animated.View
        pointerEvents="none"
        style={{ transform: [{ scale: iconScale }], opacity: iconOpacity }}
      >
        <MaterialCommunityIcons
          name={tab.icon as any}
          size={tileW * 0.38}
          color={sel ? c : MUTED}
        />
      </Animated.View>

      {/* Label */}
      <Text
        numberOfLines={1}
        style={[styles.carouselTileLabel, { color: sel ? c : MUTED, fontWeight: sel ? "700" : "400" }]}
      >
        {tab.label}
      </Text>
    </Pressable>
  );
});

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
        {!decorated && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.28)" }]} />
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

// ── PANTALLA DE PRUEBA (copia de Mi Música para experimentar con el header) ──
export default function MiMusicaTestScreen() {
  const colors    = useColors();
  const insets    = useSafeAreaInsets();
  const { isPremium } = usePremium();
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

  const { width }  = useWindowDimensions();
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

      <View style={styles.inner}>

        {/* ── Zona superior ── */}
        <LinearGradient
          colors={BG_GRADIENT}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[styles.topPanel, { paddingTop: topPad + 12 }]}
        >

        {/* ── Header (ÁREA DE PRUEBA — modificar aquí) ── */}
        <View style={styles.header}>
          <View style={styles.headerRow}>
            <Text style={styles.pageTitle}>Mi Música</Text>
            <Pressable
              onPress={() => router.push("/mezclas" as never)}
              style={styles.heartBtn}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Mis mezclas guardadas"
            >
              <MaterialCommunityIcons name="heart" size={18} color="#FFFFFF" />
              <Animated.View pointerEvents="none" style={[styles.heartGlow, { opacity: heartGlow }]}>
                <MaterialCommunityIcons name="heart" size={18} color="#BE9650" />
              </Animated.View>
            </Pressable>
          </View>
          <Text style={styles.pageSub}>Mezclador de sonidos</Text>
        </View>

        {/* ── Carrusel de tabs (estilo Geometrix) ── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          decelerationRate="fast"
          snapToInterval={tileW + TILE_GAP}
          snapToAlignment="start"
          style={styles.carouselScroll}
          contentContainerStyle={[
            styles.carouselContent,
            { paddingLeft: 0, paddingRight: TILE_H_PAD, gap: TILE_GAP },
          ]}
        >
          {MAIN_TABS.map((tab) => (
            <CarouselTile
              key={tab.id}
              tab={tab}
              sel={mainTab === tab.id}
              tileW={tileW}
              onPress={() => handleMainTab(tab.id)}
            />
          ))}
        </ScrollView>

        {/* ── Sub-tabs ── */}
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
                          backgroundColor: sel ? "rgba(190,150,80,0.08)" : "rgba(255,255,255,0.02)",
                          borderColor: sel ? "rgba(190,150,80,0.33)" : "#1C2740",
                        },
                      ]}
                    >
                      {SUB_TAB_ICONS[catId] && (
                        <MaterialCommunityIcons
                          name={SUB_TAB_ICONS[catId] as any}
                          size={26}
                          color={sel ? (SUB_TAB_ICON_COLORS[catId] ?? "#D8B56A") : MUTED}
                          style={{ marginBottom: 5 }}
                        />
                      )}
                      <Text style={[styles.subTabText, { color: sel ? "#FFFFFF" : MUTED }]}>
                        {SUB_TAB_LABELS[catId] ?? cat.label}
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

        </LinearGradient>

        {/* ── Scroll principal ── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 200 + bottomPad }]}
          showsVerticalScrollIndicator={false}
        >
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
  root:     { flex: 1 },
  inner:    { flex: 1 },
  topPanel: {},

  header:    { paddingHorizontal: 20, marginBottom: 18 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pageTitle: { fontSize: 30, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4, color: "#FFFFFF" },
  pageSub:   { fontSize: 13, color: MUTED, marginTop: 0 },
  heartBtn: {
    width: 40, height: 40, alignItems: "center", justifyContent: "center",
    borderRadius: 20, backgroundColor: "rgba(255,255,255,0.03)", marginLeft: 12,
  },
  heartGlow: {
    position: "absolute", left: 0, right: 0, top: 0, bottom: 0,
    alignItems: "center", justifyContent: "center",
  },

  carouselScroll:  { flexGrow: 0, marginTop: 5 },
  carouselContent: { paddingBottom: 12, flexDirection: "row" },
  carouselTile: {
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 1,
    backgroundColor: "rgba(255,255,255,0.02)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 8,
    overflow: "visible",
  },
  rippleRing: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: GOLD,
  },
  borderFlash: {
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(190,150,80,0.67)",
  },
  carouselTileSelected: {
    backgroundColor: "rgba(190,150,80,0.08)",
  },
  carouselTileLabel: { fontSize: 12, letterSpacing: 0.1, textAlign: "center" },

  separator: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.08)", marginTop: 4 },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 14 },

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
    borderRadius: 999,
    borderWidth: 1,
  },
  subTabText: { fontSize: 11, fontWeight: "600", textAlign: "center" },

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
