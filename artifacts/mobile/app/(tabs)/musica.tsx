import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, memo } from "react";
import { useFocusEffect } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Alert,
  Animated,
  Easing,
  Modal,
  PanResponder,
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
import { useTabBarVisibility } from "@/context/TabBarVisibilityContext";
import { MAX_ACTIVE_SOUNDS, useMixer } from "@/context/MixerContext";
import { useSaveEvent } from "@/context/SaveEventContext";
import {
  type MixSound,
  type SoundCategoryId,
  SOUNDS,
  SOUND_CATEGORIES,
  hasSoundFile,
} from "@/data/sounds";

// ── Paleta Mármol Blanco ──────────────────────────────────────────────────────
const GOLD     = "#BE9650";
const DARK     = "#1A1E2B";
const MUTED    = "#6B7A96";
const SEL_BLUE = "#1A3B7A";   // azul profundo — borde y halo de cards seleccionadas

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

const COUNTS_KEY      = "@resonance_sound_play_counts";
const APPEARANCE_KEY  = "@resonance_musica_appearance";

// ── Presets de fondo ──────────────────────────────────────────────────────────
const BG_PRESETS = [
  { id: "niebla", label: "Niebla",  colors: ["#F4F6FA", "#EAECF2", "#DDE0E8"] as const },
  { id: "perla",  label: "Perla",   colors: ["#FDFCFA", "#F2EDEA", "#E8E2DD"] as const },
  { id: "bruma",  label: "Bruma",   colors: ["#EEF4FF", "#E0EBFF", "#CDD9F5"] as const },
];

// ── Slider de brillo ──────────────────────────────────────────────────────────
function BrightnessSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const trackW = useRef(200);
  const cbRef  = useRef(onChange);
  useEffect(() => { cbRef.current = onChange; });

  const pan = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => true,
    onMoveShouldSetPanResponder:  () => true,
    onPanResponderGrant: (e) => {
      cbRef.current(Math.max(0, Math.min(1, e.nativeEvent.locationX / trackW.current)));
    },
    onPanResponderMove: (e) => {
      cbRef.current(Math.max(0, Math.min(1, e.nativeEvent.locationX / trackW.current)));
    },
  })).current;

  return (
    <View
      style={slStyles.sliderWrap}
      onLayout={e => { trackW.current = e.nativeEvent.layout.width; }}
      {...pan.panHandlers}
    >
      <View style={slStyles.sliderTrack}>
        <View style={[slStyles.sliderFill, { flex: value }]} />
        <View style={{ flex: 1 - value }} />
      </View>
      <View pointerEvents="none" style={[slStyles.sliderThumb, { left: `${value * 100}%` as any }]} />
    </View>
  );
}

const slStyles = StyleSheet.create({
  sliderWrap:  { height: 36, justifyContent: "center", paddingHorizontal: 2 },
  sliderTrack: { height: 5, flexDirection: "row", borderRadius: 999, backgroundColor: "rgba(0,0,0,0.08)", overflow: "hidden" },
  sliderFill:  { backgroundColor: GOLD, borderRadius: 999 },
  sliderThumb: {
    position: "absolute",
    width: 22, height: 22,
    borderRadius: 999,
    backgroundColor: "#FFFFFF",
    borderWidth: 2, borderColor: GOLD,
    top: "50%", marginTop: -11, marginLeft: -11,
    shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.18, shadowRadius: 4, elevation: 3,
  },
});

// ── PillTab con animación Latido adaptada ─────────────────────────────────────
const PillTab = memo(function PillTab({
  tab,
  sel,
  onPress,
  isDark,
}: {
  tab: (typeof MAIN_TABS)[0];
  sel: boolean;
  onPress: () => void;
  isDark?: boolean;
}) {
  const unselBg     = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)";
  const unselBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)";
  const unselText   = isDark ? "#8A9AB8" : MUTED;
  return (
    <Pressable onPress={onPress}>
      <View style={[
        styles.pillTab,
        {
          backgroundColor: sel ? DARK : unselBg,
          borderColor:     sel ? "transparent" : unselBorder,
        },
      ]}>
        <MaterialCommunityIcons name={tab.icon as any} size={15} color={sel ? "#FFFFFF" : (isDark ? "#8A9AB8" : tab.color)} />
        <Text style={[styles.pillTabLabel, { color: sel ? "#FFFFFF" : unselText, fontWeight: sel ? "700" : "500" }]}>
          {tab.label}
        </Text>
      </View>
    </Pressable>
  );
});

// ── SubTabPill con fade ───────────────────────────────────────────────────────
const SubTabPill = memo(function SubTabPill({
  label, sel, onPress, isDark,
}: { label: string; sel: boolean; onPress: () => void; isDark?: boolean }) {
  const unselBg     = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.03)";
  const unselBorder = isDark ? "rgba(255,255,255,0.10)" : "rgba(0,0,0,0.09)";
  const unselText   = isDark ? "#8A9AB8" : MUTED;
  return (
    <Pressable onPress={onPress}>
      <View style={[
        styles.subTabPill,
        {
          backgroundColor: sel ? DARK : unselBg,
          borderColor:     sel ? "transparent" : unselBorder,
        },
      ]}>
        <Text style={[styles.subTabText, { color: sel ? "#FFFFFF" : unselText, fontWeight: sel ? "700" : "600" }]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
});

// ── ContentSlide / SubTabSlide ────────────────────────────────────────────────
const ContentSlide = memo(function ContentSlide({
  dir,
  children,
}: {
  dir: "right" | "left";
  children: React.ReactNode;
}) {
  const slideX  = useRef(new Animated.Value(dir === "right" ? 38 : -38)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const [childReady, setChildReady] = useState(false);

  useLayoutEffect(() => {
    // Arrancar animación en native thread antes de montar hijos pesados
    const anim = Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true }),
      Animated.timing(slideX,  { toValue: 0, duration: 220, useNativeDriver: true }),
    ]);
    anim.start();
    // Diferir el montaje del grid hasta después del primer frame
    const id = setTimeout(() => setChildReady(true), 0);
    return () => { anim.stop(); clearTimeout(id); };
  }, []);

  return (
    <Animated.View style={{ opacity, transform: [{ translateX: slideX }] }}>
      {childReady ? children : null}
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

// ── SoundCard ─────────────────────────────────────────────────────────────────
type SoundCardProps = {
  sound: MixSound;
  idx: number;
  active: boolean;
  locked: boolean;
  available: boolean;
  image: ReturnType<typeof getSoundImage>;
  onPress: () => void;
  textColor?: string;
};

const SoundCard = memo(function SoundCard({
  sound,
  idx,
  active,
  locked,
  available,
  image,
  onPress,
  textColor,
}: SoundCardProps) {
  const anim       = useRef(new Animated.Value(active ? 1 : 0)).current;
  const rippleAnim = useRef(new Animated.Value(0)).current;
  const prevActive = useRef(active);
  const [decorated, setDecorated] = useState(active);

  // Animación de estado (borde, escala, inclinación) — useNativeDriver: false por borderColor
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

  // Onda de expansión dorada — solo al activar (false → true)
  useEffect(() => {
    const wasActive = prevActive.current;
    prevActive.current = active;
    if (active && !wasActive) {
      rippleAnim.setValue(0);
      Animated.timing(rippleAnim, {
        toValue: 1,
        duration: 750,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [active, rippleAnim]);

  const tiltDir   = idx % 2 === 0 ? "-4deg" : "4deg";
  const rotate    = anim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", tiltDir] });
  const scale     = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });
  const borderCol = anim.interpolate({
    inputRange: [0, 1],
    outputRange: ["rgba(26,59,122,0)", "rgba(26,59,122,1)"],
  });

  const rippleScale    = rippleAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.65] });
  const rippleOpacity  = rippleAnim.interpolate({ inputRange: [0, 0.25, 1], outputRange: [0.85, 0.5, 0] });
  const overlayOpacity = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

  return (
    <Pressable onPress={onPress} disabled={!available} style={[styles.soundCard, { opacity: available ? 1 : 0.45 }]}>
      {/* Wrapper sin transform — referencia para overlay y badge */}
      <View style={styles.cardCircleWrapper}>
        {/* Capa exterior: sombra + borde + transform (sin overflow para que la sombra sea visible) */}
        <Animated.View
          style={[
            styles.cardShadowWrap,
            decorated && styles.cardShadowWrapActive,
            { transform: [{ rotate }, { scale }], borderColor: borderCol },
          ]}
        >
          {/* Anillo de expansión — se dispara al activar */}
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              styles.goldRipple,
              { transform: [{ scale: rippleScale }], opacity: rippleOpacity },
            ]}
          />
          {/* Capa interior: recorte circular de la imagen */}
          <View style={styles.cardClipInner}>
            {image ? (
              <Image source={image} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(190,150,80,0.12)" }]} />
            )}
            {/* Overlay oscuro — fade out al activar, fade in al desactivar */}
            <Animated.View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(0,0,0,0.55)", opacity: overlayOpacity }]}
            />
          </View>
        </Animated.View>

        {/* Badge premium — también fuera del transform */}
        {locked && (
          <Image
            source={require("../../assets/images/estrella-premium.png")}
            style={styles.lockBadge}
            contentFit="contain"
          />
        )}
      </View>
      <View style={styles.cardFooter}>
        <Text style={[styles.soundName, textColor ? { color: textColor } : null]} numberOfLines={1}>{sound.name}</Text>
      </View>
    </Pressable>
  );
});

// ── PANTALLA ──────────────────────────────────────────────────────────────────
export default function MiMusicaScreen() {
  const insets          = useSafeAreaInsets();
  const { isPremium }   = usePremium();
  const { isActive, toggleSound } = useMixer();
  const { lastSavedAt } = useSaveEvent();
  const { requestHide, showMenu } = useTabBarVisibility();

  // Esconde el menú al entrar y lo restaura al salir
  useFocusEffect(
    useCallback(() => {
      requestHide();
      return () => showMenu();
    }, [requestHide, showMenu]),
  );

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

  // ── Apariencia ──────────────────────────────────────────────────────────────
  const [bgPreset,      setBgPreset]      = useState("niebla");
  const [bgDim,         setBgDim]         = useState(0);      // 0-1
  const [bgTheme,       setBgTheme]       = useState<"claro" | "azul">("claro");
  const [settingsOpen,  setSettingsOpen]  = useState(false);
  const sheetAnim    = useRef(new Animated.Value(0)).current;
  const bgPresetRef  = useRef(bgPreset);
  const bgDimRef     = useRef(bgDim);
  const bgThemeRef   = useRef(bgTheme);
  bgPresetRef.current = bgPreset;
  bgDimRef.current    = bgDim;
  bgThemeRef.current  = bgTheme;

  // Cargar preferencias guardadas
  useEffect(() => {
    AsyncStorage.getItem(APPEARANCE_KEY).then(raw => {
      if (!raw) return;
      try {
        const { preset, dim, theme } = JSON.parse(raw);
        if (preset) setBgPreset(preset);
        if (typeof dim === "number") setBgDim(dim);
        if (theme === "claro" || theme === "azul") setBgTheme(theme);
      } catch {}
    }).catch(() => {});
  }, []);

  const saveAppearance = useCallback((preset: string, dim: number, theme: string) => {
    AsyncStorage.setItem(APPEARANCE_KEY, JSON.stringify({ preset, dim, theme })).catch(() => {});
  }, []);

  const handleDimChange = useCallback((v: number) => {
    setBgDim(1 - v);
    saveAppearance(bgPresetRef.current, 1 - v, bgThemeRef.current);
  }, [saveAppearance]);

  const handlePresetChange = useCallback((id: string) => {
    setBgPreset(id);
    saveAppearance(id, bgDimRef.current, bgThemeRef.current);
  }, [saveAppearance]);

  const handleThemeChange = useCallback((t: "claro" | "azul") => {
    setBgTheme(t);
    saveAppearance(bgPresetRef.current, bgDimRef.current, t);
  }, [saveAppearance]);

  const openSettings = useCallback(() => {
    setSettingsOpen(true);
    Animated.timing(sheetAnim, { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [sheetAnim]);

  const closeSettings = useCallback(() => {
    Animated.timing(sheetAnim, { toValue: 0, duration: 240, easing: Easing.in(Easing.cubic), useNativeDriver: true })
      .start(() => setSettingsOpen(false));
  }, [sheetAnim]);

  const sheetTranslateY = sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [420, 0] });
  const backdropOpacity = sheetAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });
  const currentPreset   = BG_PRESETS.find(p => p.id === bgPreset) ?? BG_PRESETS[0];

  // Variables derivadas del tema
  const isDark       = bgTheme === "azul";
  const themeGradient = isDark
    ? (["#0B0F14", "#0E1825", "#0B0F14"] as const)
    : currentPreset.colors;
  const themeText    = isDark ? "#EDE1D3" : DARK;
  const themeMuted   = isDark ? "#8A9AB8" : MUTED;
  const themeIconBtn = isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)";

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

  const currentTabDef    = MAIN_TABS.find((t) => t.id === mainTab);
  const subTabCategories = currentTabDef?.categories ?? null;

  const displayedSounds = useMemo(() => {
    if (!subTabCategories) return popularSounds;
    const catFilter = subTab ? [subTab] : subTabCategories;
    return SOUNDS.filter(
      (s) => catFilter.includes(s.category as SoundCategoryId) && hasSoundFile(s.id),
    );
  }, [mainTab, subTab, popularSounds, subTabCategories]);

  return (
    <LinearGradient
      colors={themeGradient}
      locations={[0, 0.4, 1]}
      start={{ x: 0.1, y: 0 }}
      end={{ x: 0.9, y: 1 }}
      style={styles.root}
    >
      {/* Overlay de oscurecimiento — zIndex 0 para quedarse detrás del contenido */}
      {bgDim > 0.01 && (
        <View
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { zIndex: 0, backgroundColor: `rgba(0,0,0,${(bgDim * 0.55).toFixed(2)})` }]}
        />
      )}

      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={[styles.inner, { zIndex: 1 }]}>

        {/* ── Zona superior ── */}
        <View style={[styles.topPanel, { paddingTop: topPad + 12 }]}>

          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.headerRow}>
              <View>
                <Text style={styles.pageSuper}>MI MÚSICA</Text>
                <Text style={[styles.pageTitle, { color: themeText }]}>Mezclador</Text>
              </View>
              <View style={styles.headerBtns}>
                {/* Botón de ajustes de apariencia */}
                <Pressable
                  onPress={openSettings}
                  style={[styles.headerIconBtn, { backgroundColor: themeIconBtn }]}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Ajustes de apariencia"
                >
                  <MaterialCommunityIcons name="tune-vertical" size={18} color={themeText} />
                </Pressable>

                {/* Botón corazón / Mis mezclas */}
                <Pressable
                  onPress={() => router.push("/mezclas" as never)}
                  style={[styles.heartBtn, { backgroundColor: themeIconBtn }]}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Mis mezclas guardadas"
                >
                  <MaterialCommunityIcons name="heart" size={18} color={themeText} />
                  <Animated.View pointerEvents="none" style={[styles.heartGlow, { opacity: heartGlow }]}>
                    <MaterialCommunityIcons name="heart" size={18} color={GOLD} />
                  </Animated.View>
                </Pressable>
              </View>
            </View>
            {/* Línea divisora dorada debajo del título */}
            <View style={styles.titleDivider} />
          </View>

          {/* ── Pills de tabs principales ── */}
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
                isDark={isDark}
              />
            ))}
          </ScrollView>

          {/* ── Sub-tabs (píldoras horizontales) ── */}
          {subTabCategories && subTabCategories.length > 1 ? (
            <View style={styles.subTabZone}>
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
                      <SubTabPill
                        key={catId}
                        label={SUB_TAB_LABELS[catId] ?? cat.label}
                        sel={sel}
                        onPress={() => setSubTab(sel ? null : catId)}
                        isDark={isDark}
                      />
                    );
                  })}
                </ScrollView>
              </SubTabSlide>
            </View>
          ) : null}

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
                  textColor={themeText}
                />
              ))}
            </View>
          </ContentSlide>
        </ScrollView>
      </View>

      {/* ── Panel de ajustes de apariencia ── */}
      <Modal visible={settingsOpen} transparent animationType="none" onRequestClose={closeSettings}>
        {/* Backdrop */}
        <Animated.View style={[StyleSheet.absoluteFill, styles.sheetBackdrop, { opacity: backdropOpacity }]} />
        <Pressable style={StyleSheet.absoluteFill} onPress={closeSettings} />

        {/* Sheet */}
        <Animated.View style={[styles.settingsSheet, { paddingBottom: bottomPad + 24, transform: [{ translateY: sheetTranslateY }] }]}>
          <Pressable onPress={() => {}}>
            {/* Handle */}
            <View style={styles.sheetHandle} />
            <Text style={styles.sheetTitle}>Apariencia</Text>

            {/* Sección tema */}
            <Text style={styles.sheetSection}>TEMA</Text>
            <View style={styles.themeRow}>
              {(["claro", "azul"] as const).map(t => {
                const sel = bgTheme === t;
                return (
                  <Pressable
                    key={t}
                    onPress={() => handleThemeChange(t)}
                    style={[styles.themeBtn, sel && styles.themeBtnActive]}
                  >
                    <View style={[styles.themeSwatch, { backgroundColor: t === "claro" ? "#EAECF2" : "#0B0F14" }]} />
                    <Text style={[styles.themeBtnText, sel && { color: GOLD, fontWeight: "700" }]}>
                      {t === "claro" ? "Claro" : "Azul"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Sección brillo — solo en tema claro */}
            {bgTheme === "claro" && (
              <>
                <Text style={styles.sheetSection}>BRILLO DEL FONDO</Text>
                <View style={styles.sheetBrightnessRow}>
                  <MaterialCommunityIcons name="brightness-4" size={18} color={MUTED} />
                  <View style={{ flex: 1 }}>
                    <BrightnessSlider value={1 - bgDim} onChange={handleDimChange} />
                  </View>
                  <MaterialCommunityIcons name="brightness-7" size={18} color={DARK} />
                </View>

                {/* Sección color de fondo */}
                <Text style={styles.sheetSection}>COLOR DE FONDO</Text>
                <View style={styles.presetRow}>
                  {BG_PRESETS.map(p => {
                    const sel = bgPreset === p.id;
                    return (
                      <Pressable key={p.id} onPress={() => handlePresetChange(p.id)} style={styles.presetItem}>
                        <View style={[styles.presetRing, sel && styles.presetRingActive]}>
                          <LinearGradient
                            colors={p.colors}
                            style={styles.presetBall}
                            start={{ x: 0.2, y: 0 }}
                            end={{ x: 0.8, y: 1 }}
                          />
                        </View>
                        <Text style={[styles.presetLabel, sel && { color: GOLD, fontWeight: "700" }]}>{p.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </>
            )}
          </Pressable>
        </Animated.View>
      </Modal>

    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1 },
  inner:    { flex: 1 },
  topPanel: {},

  header:    { paddingHorizontal: 20, marginBottom: 0 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  pageSuper: { fontSize: 10, letterSpacing: 1.8, color: GOLD, fontWeight: "600", marginBottom: 2 },
  pageTitle: { fontSize: 28, fontWeight: "700", letterSpacing: -0.4, color: DARK },

  headerBtns: { flexDirection: "row", alignItems: "center", gap: 8 },
  headerIconBtn: {
    width: 40, height: 40, alignItems: "center", justifyContent: "center",
    borderRadius: 12, backgroundColor: "rgba(0,0,0,0.05)",
  },
  heartBtn: {
    width: 40, height: 40, alignItems: "center", justifyContent: "center",
    borderRadius: 12, backgroundColor: "rgba(0,0,0,0.05)",
  },
  heartGlow: {
    position: "absolute", left: 0, right: 0, top: 0, bottom: 0,
    alignItems: "center", justifyContent: "center",
  },

  // ── Settings sheet ──────────────────────────────────────────────────────────
  sheetBackdrop: { backgroundColor: "rgba(0,0,0,0.35)" },
  settingsSheet: {
    position: "absolute", left: 0, right: 0, bottom: 0,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 26, borderTopRightRadius: 26,
    paddingHorizontal: 24, paddingTop: 12,
    shadowColor: "#000", shadowOffset: { width: 0, height: -4 }, shadowOpacity: 0.12, shadowRadius: 16, elevation: 20,
  },
  sheetHandle: {
    width: 40, height: 4, borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.12)",
    alignSelf: "center", marginBottom: 20,
  },
  sheetTitle: { fontSize: 18, fontWeight: "700", color: DARK, marginBottom: 24, letterSpacing: -0.3 },
  sheetSection: { fontSize: 10, letterSpacing: 1.5, color: MUTED, fontWeight: "700", marginBottom: 12 },
  sheetBrightnessRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 28 },

  // Pelotas de color de fondo
  themeRow:    { flexDirection: "row", gap: 12, marginBottom: 24 },
  themeBtn: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingVertical: 11,
    borderRadius: 14, borderWidth: 1.5, borderColor: "rgba(0,0,0,0.08)",
    flex: 1,
  },
  themeBtnActive: { borderColor: GOLD },
  themeSwatch: { width: 22, height: 22, borderRadius: 6, borderWidth: 1, borderColor: "rgba(0,0,0,0.12)" },
  themeBtnText: { fontSize: 13.5, fontWeight: "500", color: MUTED },

  presetRow:       { flexDirection: "row", gap: 12, marginBottom: 4, flexWrap: "wrap" },
  presetItem:      { alignItems: "center", gap: 6 },
  presetRing:      { width: 52, height: 52, borderRadius: 999, padding: 3, borderWidth: 2, borderColor: "transparent" },
  presetRingActive:{ borderColor: GOLD },
  presetBall:      { flex: 1, borderRadius: 999 },
  presetLabel:     { fontSize: 10, letterSpacing: 0.3, color: MUTED, fontWeight: "600" },

  titleDivider: {
    height: 1,
    marginTop: 14,
    marginHorizontal: 0,
    backgroundColor: GOLD + "30",
  },

  pillRow:        { flexGrow: 0, marginBottom: 4 },
  pillRowContent: { flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingVertical: 10 },
  pillTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 999,
    borderWidth: 1,
  },
  pillTabLabel: { fontSize: 13, letterSpacing: 0.1 },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 14, paddingTop: 14 },

  subTabZone: { position: "relative", justifyContent: "center", marginTop: -5 },
  subTabRow:  { flexDirection: "row", gap: 8, paddingTop: 4, paddingBottom: 12, paddingHorizontal: 16 },
  subTabPill: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  subTabText: { fontSize: 12, fontWeight: "600" },

  grid:      { flexDirection: "row", flexWrap: "wrap", columnGap: 10, rowGap: 22, justifyContent: "flex-start" },
  soundCard: { width: "31%" },

  // Wrapper sin transform — contiene la card que rota + ícono fijo + badge
  cardCircleWrapper: {
    width: "82%",
    aspectRatio: 1,
    alignSelf: "center",
  },

  // Capa exterior: sombra dorada (sin overflow: hidden para que la sombra sea visible)
  cardShadowWrap: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 2.5,
    borderColor: "transparent",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.28,
    shadowRadius: 10,
    elevation: 6,
  },
  cardShadowWrapActive: {
    borderWidth: 3.5,
    shadowColor: SEL_BLUE,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.55,
    shadowRadius: 14,
    elevation: 10,
  },

  // Anillo de expansión dorado (no tiene overflow:hidden → se expande fuera del círculo)
  goldRipple: {
    borderRadius: 999,
    borderWidth: 2,
    borderColor: SEL_BLUE,
  },

  // Capa interior: recorte circular de la imagen (overflow: hidden aquí)
  cardClipInner: {
    flex: 1,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(190,150,80,0.08)",
  },

  activeIconWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  activeIconBadge: {
    width: 34, height: 34,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.62)",
    alignItems: "center",
    justifyContent: "center",
  },

  cardFooter: { paddingHorizontal: 4, paddingTop: 8, paddingBottom: 2 },
  soundName:  { fontSize: 11.5, fontWeight: "600", letterSpacing: 0.1, textAlign: "center", color: DARK },
  lockBadge:  { position: "absolute", top: 4, right: 4, width: 20, height: 20 },
});
