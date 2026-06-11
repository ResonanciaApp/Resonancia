import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
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
  useWindowDimensions,
  View,
} from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

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
const GOLD  = "#BE9650";
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

type MainTabId = "popular" | "naturaleza" | "ancestrales" | "sintetizadores";

const MAIN_TABS: {
  id: MainTabId;
  label: string;
  icon: string;
  color: string;
  categories: SoundCategoryId[] | null;
}[] = [
  { id: "popular",        label: "Todos",     icon: "music-note-eighth", color: "#1A1E2B", categories: null },
  { id: "naturaleza",     label: "Naturales", icon: "leaf",              color: "#3A9060", categories: ["animales", "bosque", "mar", "fuego", "desierto"] },
  { id: "ancestrales",    label: "Sagrados",  icon: "bell",              color: "#B09040", categories: ["cuencos_tibetanos", "cuencos_cuarzo", "gongs", "campanas_viento", "vientos", "cantos", "percusion"] },
  { id: "sintetizadores", label: "Digital",   icon: "sine-wave",         color: "#3A80B0", categories: ["solfeggio", "frecuencias"] },
];

const COUNTS_KEY = "@resonance_sound_play_counts_m3";

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
  const borderCol = anim.interpolate({ inputRange: [0, 1], outputRange: ["rgba(190,150,80,0)", "rgba(190,150,80,1)"] });

  return (
    <Pressable onPress={onPress} disabled={!available} style={[styles.soundCard, { opacity: available ? 1 : 0.45 }]}>
      <Animated.View
        style={[
          styles.cardImageWrap,
          decorated && styles.cardImageWrapActive,
          { transform: [{ rotate }, { scale }], borderColor: borderCol },
        ]}
      >
        {image ? (
          <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(190,150,80,0.12)" }]} />
        )}
        {!decorated && (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.15)", borderRadius: 999 }]} />
        )}
        {locked && (
          <Image
            source={require("../../assets/images/estrella-premium.png")}
            style={[styles.lockBadge, { width: 20, height: 20 }]}
            contentFit="contain"
          />
        )}
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
    <View style={styles.root}>
      <StatusBar barStyle="dark-content" />

      <View style={styles.inner}>

        {/* ── Zona superior ── */}
        <View style={[styles.topPanel, { paddingTop: topPad + 12 }]}>

          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              {/* Avatar — abre el drawer */}
              <Pressable onPress={() => openDrawer()} hitSlop={8} style={styles.avatarBtn}>
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.avatarSmall} contentFit="cover" />
                ) : (
                  <View style={styles.avatarFallback}>
                    <Feather name="user" size={15} color="#7A8FA8" />
                  </View>
                )}
              </Pressable>

              <Text style={[styles.pageTitle, { flex: 1, marginLeft: 10 }]}>Mi Música</Text>
              <Pressable
                onPress={() => router.push("/mezclas" as never)}
                style={styles.heartBtn}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Mis mezclas guardadas"
              >
                <MaterialCommunityIcons name="heart" size={18} color={DARK} />
                <Animated.View pointerEvents="none" style={[styles.heartGlow, { opacity: heartGlow }]}>
                  <MaterialCommunityIcons name="heart" size={18} color={GOLD} />
                </Animated.View>
              </Pressable>
            </View>
          </View>

          {/* ── Carrusel de tabs ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            decelerationRate="fast"
            snapToInterval={tileW + TILE_GAP}
            snapToAlignment="start"
            style={styles.carouselScroll}
            contentContainerStyle={[styles.carouselContent, { paddingLeft: 0, paddingRight: TILE_H_PAD, gap: TILE_GAP }]}
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
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subTabRow}>
                  {subTabCategories.map((catId) => {
                    const cat = SOUND_CATEGORIES.find((c) => c.id === catId);
                    if (!cat) return null;
                    const sel = subTab === catId;
                    const tabColor = MAIN_TABS.find((t) => t.id === mainTab)?.color ?? GOLD;
                    return (
                      <Pressable
                        key={catId}
                        onPress={() => setSubTab(sel ? null : catId)}
                        style={[
                          styles.subTabPill,
                          {
                            backgroundColor: sel ? tabColor + "12" : "rgba(0,0,0,0.03)",
                            borderColor: sel ? tabColor + "60" : "rgba(0,0,0,0.09)",
                          },
                        ]}
                      >
                        {SUB_TAB_ICONS[catId] && (
                          <MaterialCommunityIcons
                            name={SUB_TAB_ICONS[catId] as any}
                            size={15}
                            color={sel ? tabColor : MUTED}
                            style={{ marginRight: 5 }}
                          />
                        )}
                        <Text style={[styles.subTabText, { color: sel ? tabColor : MUTED }]}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: "#FFFFFF" },
  inner: { flex: 1, backgroundColor: "transparent" },

  topPanel: {
    backgroundColor: "transparent",
    backgroundImage: undefined,
  },

  header:    { paddingHorizontal: 20, marginBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  avatarBtn:      { width: 32, height: 32, borderRadius: 16, overflow: "hidden" },
  avatarSmall:    { width: 32, height: 32, borderRadius: 16 },
  avatarFallback: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(190,150,80,0.12)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(190,150,80,0.25)" },
  pageSuper: { fontSize: 10, letterSpacing: 1.8, color: GOLD, fontWeight: "600", marginBottom: 2 },
  pageTitle: { fontSize: 27, fontWeight: "700", letterSpacing: 0.5, color: DARK },
  heartBtn:  {
    width: 40, height: 40, alignItems: "center", justifyContent: "center",
    borderRadius: 12, backgroundColor: "rgba(0,0,0,0.05)",
  },
  heartGlow: { position: "absolute", left: 0, right: 0, top: 0, bottom: 0, alignItems: "center", justifyContent: "center" },

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

  separator: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(0,0,0,0.07)", marginTop: 4 },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 14 },

  subTabZone: { position: "relative", justifyContent: "center", marginTop: -5 },
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

  grid:     { flexDirection: "row", flexWrap: "wrap", columnGap: 10, rowGap: 22, justifyContent: "flex-start" },
  soundCard: { width: "31%" },
  cardImageWrap: {
    width: "77%",
    aspectRatio: 1,
    alignSelf: "center",
    overflow: "hidden",
    borderRadius: 999,
    borderWidth: 3,
    borderColor: "transparent",
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
