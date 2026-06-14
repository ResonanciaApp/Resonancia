import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
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
const GOLD     = "#D4AF37";
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

type MainTabId = "popular" | "naturaleza" | "ancestrales" | "sintetizadores" | "binaurales" | "voces" | "asmr" | "ruidos" | "bpm";

// ── Color único por tab (estado seleccionado — Diseño C) ──────────────────────
const TAB_COLORS: Record<MainTabId, string> = {
  popular:        "#D6AD5F",
  naturaleza:     "#16A34A",
  ancestrales:    "#FF8A1C",
  sintetizadores: "#3B82F6",
  binaurales:     "#A78BFA",
  voces:          "#FF3CAC",
  asmr:           "#2DD4BF",
  ruidos:         "#38BDF8",
  bpm:            "#9D4EDD",
};

const TAB_GRADIENTS: Record<MainTabId, { from: string; to: string }> = {
  popular:        { from: "#D6AD5F", to: "#B47344" },
  naturaleza:     { from: "#063022", to: "#16A34A" },
  ancestrales:    { from: "#3A1A00", to: "#FF8A1C" },
  sintetizadores: { from: "#08142A", to: "#3B82F6" },
  binaurales:     { from: "#1E1B3A", to: "#A78BFA" },
  voces:          { from: "#3A0D2D", to: "#FF3CAC" },
  asmr:           { from: "#03312E", to: "#2DD4BF" },
  ruidos:         { from: "#08253A", to: "#38BDF8" },
  bpm:            { from: "#201033", to: "#9D4EDD" },
};

const MAIN_TABS: {
  id: MainTabId;
  label: string;
  icon: string;
  color: string;
  categories: SoundCategoryId[] | null;
}[] = [
  { id: "popular",        label: "Populares",   icon: "music-note-eighth", color: "#1A1E2B", categories: null },
  { id: "naturaleza",     label: "Naturaleza",  icon: "leaf",              color: "#3A9060", categories: ["animales", "bosque", "mar", "fuego", "desierto"] },
  { id: "ancestrales",    label: "Ancestrales", icon: "bell",              color: "#B09040", categories: ["cuencos_tibetanos", "cuencos_cuarzo", "gongs", "campanas_viento", "vientos", "cantos", "percusion"] },
  { id: "sintetizadores", label: "Digitales",   icon: "sine-wave",         color: "#3A80B0", categories: ["solfeggio"] },
  { id: "binaurales",     label: "Binaurales",  icon: "activity",          color: "#4A60C0", categories: ["frecuencias"] },
  { id: "voces",          label: "Voces",       icon: "mic",               color: "#9060A0", categories: ["mantras"] },
  { id: "asmr",           label: "ASMR",        icon: "headphones",        color: "#408070", categories: ["asmr"] },
  { id: "ruidos",         label: "Ruidos",      icon: "radio",             color: "#607080", categories: ["ruidos"] },
  { id: "bpm",            label: "BPM",         icon: "music-note-eighth", color: "#A04040", categories: ["bpm"] },
];

const COUNTS_KEY      = "@resonance_sound_play_counts";
const APPEARANCE_KEY  = "@resonance_musica_appearance";

// ── Presets de fondo ──────────────────────────────────────────────────────────
const BG_PRESETS = [
  { id: "niebla", label: "Niebla",  colors: ["#F4F6FA", "#EAECF2", "#DDE0E8"] as const },
  { id: "perla",  label: "Perla",   colors: ["#FDFCFA", "#F2EDEA", "#E8E2DD"] as const },
  { id: "bruma",  label: "Bruma",   colors: ["#EEF4FF", "#E0EBFF", "#CDD9F5"] as const },
];

// ── Presets oscuros ────────────────────────────────────────────────────────────
const DARK_PRESETS = [
  { id: "cosmos",     label: "Cosmos",     colors: ["#4A0C0C", "#27070E", "#1B060F"] as const, selTabBg: "#27070E", accentColor: "#1A3B7A" },
  { id: "noche",      label: "Noche",      colors: ["#080C12", "#0D1520", "#080C12"] as const, selTabBg: "#152535", accentColor: "#1B4080" },
  { id: "indigo",     label: "Índigo",     colors: ["#090B1C", "#0F1438", "#090B1C"] as const, selTabBg: "#1A2560", accentColor: "#2545C0" },
  { id: "crepusculo", label: "Crepúsculo", colors: ["#0E0B16", "#1A1030", "#0E0B16"] as const, selTabBg: "#281A50", accentColor: "#5025B0" },
];

/** Convierte un color hex (#RRGGBB) a rgba(r,g,b,alpha) para interpolaciones Animated. */
function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

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

// ── PillTab — tile cuadrado con ícono degradado ───────────────────────────────
const PillTab = memo(function PillTab({
  tab,
  sel,
  onPress,
}: {
  tab: (typeof MAIN_TABS)[0];
  sel: boolean;
  onPress: () => void;
  isDark?: boolean;
  selBg?: string;
}) {
  return (
    <Pressable onPress={onPress} style={styles.pillTabOuter}>
      <View style={[
        styles.pillTab,
        sel
          ? { backgroundColor: "#4A0C0C", shadowColor: "#7A1515", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.55, shadowRadius: 14, elevation: 10 }
          : { backgroundColor: "rgba(27,6,15,0.30)" },
      ]}>
        {sel && (
          <>
            <LinearGradient
              colors={["#7A1515", "#4A0C0C"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            {/* Brillo sutil encima */}
            <LinearGradient
              colors={["rgba(255,255,255,0.14)", "rgba(255,255,255,0.02)", "transparent"]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            {/* Ring interior */}
            <View
              style={[
                StyleSheet.absoluteFill,
                { margin: 3, borderRadius: 17, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
              ]}
              pointerEvents="none"
            />
          </>
        )}
        {/* Ícono */}
        <View style={styles.pillIconGlow}>
          <MaterialCommunityIcons name={tab.icon as any} size={18} color={sel ? "#F4DAD5" : "#7A1515"} />
        </View>
        <Text numberOfLines={1} style={[styles.pillTabLabel, { color: "#EDDFD5" }]}>
          {tab.label}
        </Text>
      </View>
    </Pressable>
  );
});


// ── AuraPillTab — degradado de imagen + brillo central + ring ─────────────────
const DesignCPillTab = memo(function DesignCPillTab({
  tab,
  sel,
  onPress,
}: {
  tab: (typeof MAIN_TABS)[0];
  sel: boolean;
  onPress: () => void;
}) {
  const grad = TAB_GRADIENTS[tab.id as MainTabId];
  const glowColor = grad.to;

  return (
    <Pressable onPress={onPress} style={styles.pillTabOuter}>
      <View
        style={[
          styles.pillTab,
          sel
            ? {
                backgroundColor: grad.from,
                shadowColor: glowColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.60,
                shadowRadius: 18,
                elevation: 12,
              }
            : { backgroundColor: "rgba(27,6,15,0.30)" },
        ]}
      >
        {sel && (
          <>
            {/* Gradiente principal diagonal (from → to) */}
            <LinearGradient
              colors={[grad.to, grad.from]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
              pointerEvents="none"
            />
            {/* Brillo Aura encima — centro más claro */}
            <LinearGradient
              colors={["rgba(255,255,255,0.26)", "rgba(255,255,255,0.04)", "transparent"]}
              start={{ x: 0.5, y: 0.05 }}
              end={{ x: 0.5, y: 0.90 }}
              style={[StyleSheet.absoluteFill, { borderRadius: 20 }]}
              pointerEvents="none"
            />
            {/* Ring interior sutil */}
            <View
              style={[
                StyleSheet.absoluteFill,
                { margin: 3, borderRadius: 17, borderWidth: 1, borderColor: "rgba(255,255,255,0.18)" },
              ]}
              pointerEvents="none"
            />
          </>
        )}
        <MaterialCommunityIcons
          name={tab.icon as any}
          size={21}
          color={sel ? "rgba(255,255,255,0.95)" : "#D6AD5F"}
        />
        <Text
          numberOfLines={1}
          style={[
            styles.pillTabLabel,
            { color: "#EDDFD5" },
          ]}
        >
          {tab.label}
        </Text>
      </View>
    </Pressable>
  );
});

// ── SubTabPill — hereda gradiente del tab general ────────────────────────────
const SubTabPill = memo(function SubTabPill({
  label, sel, onPress, color, gradFrom,
}: { label: string; sel: boolean; onPress: () => void; isDark?: boolean; selBg?: string; color?: string; gradFrom?: string }) {
  const colorTo   = color    ?? "#D6AD5F";
  const colorFrom = gradFrom ?? "#3A1A00";

  return (
    <Pressable onPress={onPress}>
      <View style={[
        styles.subTabPill,
        { backgroundColor: "rgba(27,6,15,0.30)" },
        sel && {
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.50)",
        },
      ]}>
        <Text style={[styles.subTabText, { color: "#EDDFD5" }]}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
});

// ── ContentSlide / SubTabSlide ────────────────────────────────────────────────
const ContentSlide = memo(function ContentFade({
  animKey,
  dir,
  children,
}: {
  animKey: number;
  dir: "right" | "left";
  children: React.ReactNode;
}) {
  const opacity = useRef(new Animated.Value(0)).current;

  // Reanima al cambiar de tab (animKey) SIN remontar los hijos: la grilla reconcilia
  // por key={s.id}, así los sonidos compartidos entre tabs conservan su imagen montada
  // (las imágenes no se vuelven a decodificar → sin carga escalonada).
  useLayoutEffect(() => {
    opacity.setValue(0);
    const anim = Animated.timing(opacity, { toValue: 1, duration: 220, useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, [animKey, opacity]);

  return (
    <Animated.View style={{ opacity }}>
      {children}
    </Animated.View>
  );
});

const SubTabSlide = memo(function SubTabSlide({ children }: { children: React.ReactNode }) {
  const opacity = useRef(new Animated.Value(0)).current;

  useLayoutEffect(() => {
    const anim = Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true });
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View style={{ opacity }}>
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
  accentColor?: string;
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
  accentColor = SEL_BLUE,
}: SoundCardProps) {
  const anim       = useRef(new Animated.Value(active ? 1 : 0)).current;
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

  const tiltDir   = idx % 2 === 0 ? "-4deg" : "4deg";
  const rotate    = anim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", tiltDir] });
  const scale     = anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] });
  const borderCol = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: ["rgba(255,255,255,0)", "rgba(255,255,255,1)"],
  });

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
          {/* Capa interior: recorte circular de la imagen */}
          <View style={styles.cardClipInner}>
            {image ? (
              <Image
                source={image}
                style={StyleSheet.absoluteFill}
                contentFit="cover"
                cachePolicy="memory-disk"
                transition={0}
                recyclingKey={sound.id}
              />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(212,175,55,0.12)" }]} />
            )}
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
  const { photoUri } = useUserProfile();
  const { open: openDrawer } = useDrawer();
  const { isActive, toggleSound } = useMixer();
  const { lastSavedAt } = useSaveEvent();
  const { requestHide, showMenu, setMusicTheme, setMusicGradient } = useTabBarVisibility();

  // Nota: el menú inferior permanece visible en Mi Música para que la
  // navegación entre pestañas sea consistente.

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
  const [darkPreset,    setDarkPreset]    = useState("noche");
  const [bgDim,         setBgDim]         = useState(0);      // 0-1
  const [bgTheme,       setBgTheme]       = useState<"claro" | "azul">("claro");
  const [settingsOpen,  setSettingsOpen]  = useState(false);
  const sheetAnim      = useRef(new Animated.Value(0)).current;
  const bgPresetRef    = useRef(bgPreset);
  const darkPresetRef  = useRef(darkPreset);
  const bgDimRef       = useRef(bgDim);
  const bgThemeRef     = useRef(bgTheme);
  bgPresetRef.current   = bgPreset;
  darkPresetRef.current = darkPreset;
  bgDimRef.current      = bgDim;
  bgThemeRef.current    = bgTheme;

  // Cargar preferencias guardadas
  useEffect(() => {
    AsyncStorage.getItem(APPEARANCE_KEY).then(raw => {
      if (!raw) return;
      try {
        const { preset, darkPreset: dp, dim, theme } = JSON.parse(raw);
        if (preset) setBgPreset(preset);
        if (dp) setDarkPreset(dp);
        if (typeof dim === "number") setBgDim(dim);
        if (theme === "claro" || theme === "azul") { setBgTheme(theme); setMusicTheme(theme); }
      } catch {}
    }).catch(() => {});
  }, []);

  const saveAppearance = useCallback((preset: string, dp: string, dim: number, theme: string) => {
    AsyncStorage.setItem(APPEARANCE_KEY, JSON.stringify({ preset, darkPreset: dp, dim, theme })).catch(() => {});
  }, []);

  const handleDimChange = useCallback((v: number) => {
    setBgDim(1 - v);
    saveAppearance(bgPresetRef.current, darkPresetRef.current, 1 - v, bgThemeRef.current);
  }, [saveAppearance]);

  const handlePresetChange = useCallback((id: string) => {
    setBgPreset(id);
    saveAppearance(id, darkPresetRef.current, bgDimRef.current, bgThemeRef.current);
  }, [saveAppearance]);

  const handleDarkPresetChange = useCallback((id: string) => {
    setDarkPreset(id);
    saveAppearance(bgPresetRef.current, id, bgDimRef.current, bgThemeRef.current);
  }, [saveAppearance]);

  const handleThemeChange = useCallback((t: "claro" | "azul") => {
    setBgTheme(t);
    setMusicTheme(t);
    saveAppearance(bgPresetRef.current, darkPresetRef.current, bgDimRef.current, t);
  }, [saveAppearance, setMusicTheme]);

  // Sincroniza gradiente activo con el contexto global (para MixerSheet)
  useEffect(() => {
    setMusicGradient(themeGradient);
  }, [bgTheme, bgPreset, darkPreset]); // eslint-disable-line react-hooks/exhaustive-deps

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
  const isDark            = bgTheme === "azul";
  const currentDarkPreset = DARK_PRESETS.find(p => p.id === darkPreset) ?? DARK_PRESETS[0];
  const themeGradient     = isDark ? currentDarkPreset.colors : currentPreset.colors;
  const themeSelBg        = isDark ? currentDarkPreset.selTabBg : DARK;
  const themeAccent       = isDark ? currentDarkPreset.accentColor : SEL_BLUE;
  const themeText    = isDark ? "#F4DAD5" : DARK;
  const themeMuted   = isDark ? "#8A9AB8" : MUTED;
  const themeIconBtn = isDark ? "rgba(61,14,22,0.40)" : "rgba(0,0,0,0.05)";

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
    <View style={styles.root}>
      {/* ── Capa de fondo (gradiente + imagen universo + dim) — un solo fondo continuo ── */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        {/* Degradado raíz: EL fondo único de toda la pantalla */}
        <LinearGradient
          colors={["#4A0C0C", "#27070E", "#1B060F"]}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Imagen del universo en la mitad superior, sobre el degradado raíz */}
        <Image
          source={require("@/assets/images/hero-mezclador.png")}
          style={styles.heroBgImage}
          contentFit="cover"
          contentPosition="center"
        />
        {/* Desvanece la imagen hacia el COLOR EXACTO del bg raíz al 50% (#27070E):
            debajo de la imagen se ve el mismo degradado raíz → sin costura */}
        <LinearGradient
          colors={[
            "rgba(39,7,14,0.70)",
            "rgba(39,7,14,0.35)",
            "rgba(39,7,14,0.45)",
            "rgba(39,7,14,0.65)",
            "rgba(45,8,13,0.90)",
            "#27070E",
          ]}
          locations={[0, 0.22, 0.45, 0.65, 0.85, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.heroBgImage}
        />
        {bgDim > 0.01 && (
          <View
            style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(0,0,0,${(bgDim * 0.55).toFixed(2)})` }]}
          />
        )}
      </View>

      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />

      <View style={styles.inner}>

        {/* ── Zona superior ── */}
        <View style={styles.topPanel}>

          {/* Spacer + título: la imagen del universo vive en la capa de fondo (un solo fondo) */}
          <View style={{ height: 210 + topPad, width: "100%", pointerEvents: "none" }}>
            <View style={[styles.heroTextWrap, { paddingTop: topPad + 6, transform: [{ translateY: -35 }] }]}>
              <Text style={styles.heroTitle}>Mezclador</Text>
            </View>
          </View>

          {/* ── Pills de tabs principales ── */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.pillRow}
            contentContainerStyle={styles.pillRowContent}
          >
            {MAIN_TABS.map((tab) =>
              tab.id === "popular" ? (
                <PillTab
                  key={tab.id}
                  tab={tab}
                  sel={mainTab === tab.id}
                  onPress={() => handleMainTab(tab.id)}
                  isDark={isDark}
                  selBg={themeSelBg}
                />
              ) : (
                <DesignCPillTab
                  key={tab.id}
                  tab={tab}
                  sel={mainTab === tab.id}
                  onPress={() => handleMainTab(tab.id)}
                />
              )
            )}
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
                        selBg={themeSelBg}
                        color={TAB_COLORS[mainTab]}
                        gradFrom={TAB_GRADIENTS[mainTab]?.from}
                      />
                    );
                  })}
                </ScrollView>
              </SubTabSlide>
            </View>
          ) : null}

          {/* <View style={styles.stickyDivider} /> */}
        </View>

        {/* ── Scroll principal ── */}
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 200 + bottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          <ContentSlide animKey={contentAnimKey} dir={contentDir}>
            <View style={[styles.grid, { marginTop: 8 }]}>
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
                  accentColor={themeAccent}
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
                    <View style={[styles.themeSwatch, { backgroundColor: t === "claro" ? "#EAECF2" : "#1B060F" }]} />
                    <Text style={[styles.themeBtnText, sel && { color: GOLD, fontWeight: "700" }]}>
                      {t === "claro" ? "Claro" : "Azul"}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Sección color de fondo — tema oscuro */}
            {bgTheme === "azul" && (
              <>
                <Text style={styles.sheetSection}>COLOR DE FONDO</Text>
                <View style={styles.presetRow}>
                  {DARK_PRESETS.map(p => {
                    const sel = darkPreset === p.id;
                    return (
                      <Pressable key={p.id} onPress={() => handleDarkPresetChange(p.id)} style={styles.presetItem}>
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

    </View>
  );
}

const styles = StyleSheet.create({
  root:     { flex: 1 },
  inner:    { flex: 1 },
  topPanel: { backgroundColor: "transparent" },

  header:    { paddingHorizontal: 15, marginBottom: 0 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  avatarBtn:      { width: 32, height: 32, borderRadius: 16, overflow: "hidden" },
  avatarSmall:    { width: 32, height: 32, borderRadius: 16 },
  avatarFallback: { width: 32, height: 32, borderRadius: 16, backgroundColor: "rgba(212,175,55,0.12)", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(212,175,55,0.25)" },
  pageSuper: { fontSize: 10, letterSpacing: 1.8, color: GOLD, fontWeight: "600", marginBottom: 2 },
  pageTitle: { fontSize: 27, fontWeight: "700", letterSpacing: 0.5, color: DARK },
  pageSubtitle: { fontSize: 13, fontWeight: "400", opacity: 0.55, marginTop: 4 },
  stickyDivider: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(244,218,213,0.15)", marginTop: 10 },

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
    marginTop: 8,
    marginHorizontal: 0,
    backgroundColor: "rgba(212,175,55,0.08)",
  },

  // ── Hero ────────────────────────────────────────────────────────────────────
  heroWrap: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, overflow: "hidden" },
  heroBgImage: { position: "absolute", top: 0, left: 0, right: 0, height: "50%" },
  heroTextWrap: {
    position: "absolute", top: 0, bottom: 12, left: 15, right: 15,
    alignItems: "center", justifyContent: "center",
  },
  heroTitle: { fontSize: 27, fontWeight: "700", letterSpacing: 0.5, color: "#F4DAD5", textAlign: "center" },
  heroSubtitle: { fontSize: 13, fontWeight: "400", color: "rgba(255,255,255,0.90)", marginTop: 6, textAlign: "center", lineHeight: 19 },

  pillRow:        { flexGrow: 0, marginBottom: 4, marginTop: 8 },
  pillRowContent: { flexDirection: "row", gap: 8, paddingHorizontal: 15, paddingVertical: 6 },
  pillTabOuter: {},
  pillTab: {
    alignItems: "center",
    justifyContent: "center",
    width: 85,
    height: 67,
    borderRadius: 20,
    overflow: "hidden",
    gap: 5,
  },
  pillIconGlow: {
    shadowColor: "#D6AD5F",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.28,
    shadowRadius: 7,
    elevation: 3,
  },
  pillTabLabel: { fontSize: 11, letterSpacing: 0.1 },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: 9, paddingTop: 35 },

  subTabZone: { position: "relative", justifyContent: "center", marginTop: -5 },
  subTabRow:  { flexDirection: "row", gap: 8, paddingTop: 4, paddingBottom: 12, paddingHorizontal: 15 },
  subTabPill: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 13,
    height: 35,
    borderRadius: 20,
    overflow: "hidden",
  },
  subTabText: { fontSize: 13, letterSpacing: 0.1 },

  grid:      { flexDirection: "row", flexWrap: "wrap", columnGap: 10, rowGap: 22, justifyContent: "space-evenly" },
  soundCard: { width: "28%" },

  // Wrapper sin transform — contiene la card que rota + ícono fijo + badge
  cardCircleWrapper: {
    width: "79%",
    aspectRatio: 1,
    alignSelf: "center",
  },

  // Capa exterior: sombra dorada (sin overflow: hidden para que la sombra sea visible)
  cardShadowWrap: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 12,
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
  },

  // Anillo de expansión (color se pasa dinámicamente via inline style)
  goldRipple: {
    borderRadius: 12,
    borderWidth: 2,
  },

  // Capa interior: recorte cuadrado de la imagen (overflow: hidden aquí)
  cardClipInner: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "rgba(212,175,55,0.08)",
  },

  activeIconWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  activeIconBadge: {
    width: 34, height: 34,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.62)",
    alignItems: "center",
    justifyContent: "center",
  },

  cardFooter: { paddingHorizontal: 4, paddingTop: 8, paddingBottom: 2 },
  soundName:  { fontSize: 11.5, fontWeight: "600", letterSpacing: 0.1, textAlign: "center", color: DARK },
  lockBadge:  { position: "absolute", top: 4, right: 4, width: 20, height: 20 },
});
