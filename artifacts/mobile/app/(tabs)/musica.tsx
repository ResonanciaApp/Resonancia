import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router, useFocusEffect } from "expo-router";
import { useMixerPanel } from "@/context/MixerPanelContext";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState, memo } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";

import * as Haptics from "expo-haptics";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";


import { getSoundImage } from "@/config/sound-images";
import { usePremium } from "@/context/PremiumContext";
import { MAX_ACTIVE_SOUNDS, useMixer } from "@/context/MixerContext";
import { useSaveEvent } from "@/context/SaveEventContext";
import { useDrawer } from "@/context/DrawerContext";
import { useUserProfile } from "@/context/UserProfileContext";
import { useTabBarVisibility } from "@/context/TabBarVisibilityContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import {
  type MixSound,
  type SoundCategoryId,
  type SoundTagId,
  SOUNDS,
  SOUND_CATEGORIES,
  SOUND_TAGS,
  hasSoundFile,
  soundMatchesBpm,
} from "@/data/sounds";
import { MOODS, MOOD_SOUND_TAGS, type MoodId } from "@/data/moods";
import {
  DEFAULT_MIXER_BG_PALETTE,
  getMixerBgPalette,
  MIXER_BG_PALETTES,
  type MixerBgPaletteId,
} from "@/data/mixer-bg-palettes";
import {
  DEFAULT_BG_PRESET_ID,
  emitBgPresetChange,
} from "@/config/immersive-presets";
import { MixerSettingsSheet } from "@/components/MixerSettingsSheet";
import { BackPill } from "@/components/BackPill";
import Svg, { Defs, LinearGradient as SvgLG, Stop, Rect } from "react-native-svg";
import { useSounds } from "@/context/SoundsContext";
import { REMOTE_SOUND_MAP, REMOTE_SOUND_IMAGE_MAP } from "@/lib/remoteSoundMap";

// Tamaños fijos de card e imagen — iguales en todos los tiles
const SCREEN_W = Dimensions.get("window").width;
const CARD_W   = Math.floor((SCREEN_W - 28 - 40) / 3); // padding 14×2 + gaps 20×2
const IMG_SIZE  = Math.floor(CARD_W * 0.75) - 5;

// ── Paleta ────────────────────────────────────────────────────────────────────
const GOLD  = "#F9F9F9";
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

type MainTabId =
  | "popular" | "naturaleza" | "ancestrales" | "sintetizadores" | "voces" | "bpm"
  | "ambientales" | "ciudad" | "astrales" | "relatos" | "meditaciones";

const MAIN_TABS: {
  id: MainTabId;
  label: string;
  icon: string;
  color: string;
  categories: SoundCategoryId[] | null;
}[] = [
  { id: "popular",        label: "Populares",  icon: "music-note-eighth", color: "#8C1A2B", categories: null },
  { id: "naturaleza",     label: "Naturales",  icon: "leaf",              color: "#3A9060", categories: ["animales", "bosque", "mar", "fuego", "desierto"] },
  { id: "ancestrales",    label: "Sagrados",   icon: "bell",              color: "#B09040", categories: ["cuencos_tibetanos", "cuencos_cuarzo", "gongs", "campanas_viento", "vientos", "cantos", "percusion"] },
  { id: "sintetizadores", label: "Digital",    icon: "sine-wave",         color: "#3A80B0", categories: ["solfeggio"] },
  { id: "voces",          label: "Voces",      icon: "microphone",        color: "#9060A0", categories: ["mantras"] },
  { id: "bpm",            label: "BPM",        icon: "metronome",         color: "#A04040", categories: ["bpm"] },
  // ── Nuevas pantallas (sin audios todavía) ──
  { id: "ambientales",    label: "Ambientales",  icon: "waveform",        color: "#4A6B8A", categories: [] },
  { id: "ciudad",         label: "Ciudad",       icon: "city-variant",    color: "#6B6B7A", categories: [] },
  { id: "astrales",       label: "Astrales",     icon: "star-four-points",color: "#5A4A8A", categories: [] },
  { id: "relatos",        label: "Relatos",      icon: "book-open-variant",color: "#8A6A4A", categories: [] },
  { id: "meditaciones",   label: "Meditaciones", icon: "meditation",      color: "#4A8A7A", categories: [] },
];

const COUNTS_KEY = "@resonance_sound_play_counts_m3";
const SETTINGS_KEY = "@resonance_mixer_settings_v1";

const MEZ_PLACEHOLDERS = [
  "¿Qué mundo sonoro querés crear hoy?",
  "Diseñá tu paisaje interior...",
  "Cada sonido, un portal hacia la calma",
  "Combiná y creá tu ritual de bienestar",
  "Dejá que los sonidos te lleven lejos",
];

// ── Colores de tab ────────────────────────────────────────────────────────────
const TAB_HEADER_GRADIENT: Record<MainTabId, [string, string, ...string[]]> = {
  popular:        ["#340D1A", "#190913"],
  naturaleza:     ["#0A1A0E", "#0A1A0E", "#0A1A0E"],
  ancestrales:    ["#221510", "#221510", "#221510"],
  sintetizadores: ["#061A2E", "#061A2E", "#061A2E"],
  voces:          ["#220830", "#220830", "#220830"],
  bpm:            ["#0A2020", "#0A2020", "#0A2020"],
  ambientales:    ["#0B1622", "#0B1622", "#0B1622"],
  ciudad:         ["#16161C", "#16161C", "#16161C"],
  astrales:       ["#150F26", "#150F26", "#150F26"],
  relatos:        ["#1E150C", "#1E150C", "#1E150C"],
  meditaciones:   ["#0C1E1A", "#0C1E1A", "#0C1E1A"],
};


/** Gradiente de fondo de contenido en modo "noche" — último stop neutro oscuro (sin bordeaux) */
const TAB_NOCHE_BG: Record<MainTabId, [string, string, ...string[]]> = {
  popular:        ["#340D1A", "#190913"],
  naturaleza:     ["#0A1A0E", "#0A1A0E", "#0A1A0E"],
  ancestrales:    ["#221510", "#221510", "#221510"],
  sintetizadores: ["#061A2E", "#061A2E", "#061A2E"],
  voces:          ["#220830", "#220830", "#220830"],
  bpm:            ["#0A2020", "#0A2020", "#0A2020"],
  ambientales:    ["#0B1622", "#0B1622", "#0B1622"],
  ciudad:         ["#16161C", "#16161C", "#16161C"],
  astrales:       ["#150F26", "#150F26", "#150F26"],
  relatos:        ["#1E150C", "#1E150C", "#1E150C"],
  meditaciones:   ["#0C1E1A", "#0C1E1A", "#0C1E1A"],
};

const TAB_GRADIENT: Record<MainTabId, [string, string]> = {
  popular:        ["#5E1E2D", "#5E1E2D"],
  naturaleza:     ["#3B4933", "#303E27"],
  ancestrales:    ["#A3631F", "#A3631F"],
  sintetizadores: ["#2C62AB", "#2C62AB"],
  voces:          ["#FF6B6B", "#C9184A"],
  bpm:            ["#1A5454", "#0D3535"],
  ambientales:    ["#2E4A66", "#2E4A66"],
  ciudad:         ["#4A4A58", "#4A4A58"],
  astrales:       ["#453A70", "#453A70"],
  relatos:        ["#6B5236", "#6B5236"],
  meditaciones:   ["#2E6658", "#2E6658"],
};

// ── PillTab — estilo Biblioteca (texto + subrayado animado) ──────────────────
const CHIP_ANIM_DURATION = 550;

const PillTab = memo(function PillTab({
  tab, sel, onPress,
}: { tab: (typeof MAIN_TABS)[0]; sel: boolean; onPress: () => void }) {
  const { theme } = useSceneTheme();
  const isAmbientales = tab.id === "ambientales";
  const fgColor = sel
    ? (isAmbientales || theme.id === "indigo" ? "#F9F9F9" : "#0D0A1E")
    : "#FBFBFB";

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [styles.pillTab, theme.id === "tibet" && styles.pillTabTibet, theme.id === "indigo" && styles.pillTabIndigo, sel && { borderWidth: 0 }, { opacity: pressed ? 0.7 : 1 }]}
    >
      {/* Fondo seleccionado */}
      {sel && (
        <LinearGradient
          colors={isAmbientales
            ? ["#357849", "#23522F"]
            : theme.id === "indigo"
              ? ["#784576", "#50326E"]
              : ["#FFFFFF", "#F5F5F5"]}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 999 }]}
        />
      )}

      {/* Texto */}
      <Text style={[styles.pillTabLabel, { color: fgColor }]}>
        {tab.label}
      </Text>
    </Pressable>
  );
});

// ── ContentSlide / SubTabSlide ────────────────────────────────────────────────
const ContentSlide = memo(function ContentSlide({ dir: _dir, children }: { dir: "right" | "left"; children: React.ReactNode }) {
  return <View>{children}</View>;
});

const SubTabSlide = memo(function SubTabSlide({ children }: { children: React.ReactNode }) {
  return <View>{children}</View>;
});

// ── SoundCard ─────────────────────────────────────────────────────────────────
type SoundCardProps = {
  sound: MixSound;
  idx: number;
  active: boolean;
  locked: boolean;
  available: boolean;
  image: ReturnType<typeof getSoundImage> | string;
  borderGradient: [string, string, string];
  textColor?: string;
  bgPaletteId?: string;
  onPress: () => void;
};

const SoundCard = memo(function SoundCard({ sound, idx, active, locked, available, image, borderGradient, textColor, bgPaletteId, onPress }: SoundCardProps) {
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

  const tiltDir = idx % 2 === 0 ? "-5deg" : "5deg";
  const rotate  = anim.interpolate({ inputRange: [0, 1], outputRange: ["0deg", tiltDir] });

  return (
    <Pressable
      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(); }}
      disabled={!available}
      style={[styles.soundCard, { opacity: available ? 1 : 0.45 }]}
    >
      <View style={styles.cardImageWrap}>
        <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ rotate }] }]}>
          {/* Imagen recortada */}
          <View style={styles.cardClipInner}>
            {image ? (
              <Image source={typeof image === "string" ? { uri: image } : image} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : (
              <View style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(212,175,55,0.12)" }]} />
            )}
            {locked && (
              <Image
                source={require("../../assets/images/estrella-premium.png")}
                style={[styles.lockBadge, { width: 20, height: 20 }]}
                contentFit="contain"
              />
            )}
          </View>
          {/* Borde encima de la imagen, rota junto con ella, fade in/out via opacity */}
          <Animated.View
            pointerEvents="none"
            style={[styles.cardBorderRing, { opacity: anim, borderColor: borderGradient[0], borderWidth: bgPaletteId === "arena" ? 6 : 4 }]}
          />
        </Animated.View>
      </View>
      <View style={styles.cardFooter}>
        <Text style={[styles.soundName, textColor ? { color: textColor } : null]} numberOfLines={2}>{sound.name}</Text>
      </View>
    </Pressable>
  );
});

// ── BpmSelector ───────────────────────────────────────────────────────────────
const BPM_OPTIONS: Array<44 | 50 | 68 | 72> = [44, 50, 68, 72];

type BpmSelectorProps = {
  selected: 44 | 50 | 68 | 72 | null;
  locked: 44 | 50 | 68 | 72 | null;
  onSelect: (bpm: 44 | 50 | 68 | 72 | null) => void;
};

const BpmSelector = memo(function BpmSelector({ selected, locked, onSelect }: BpmSelectorProps) {
  const effective = locked ?? selected;
  return (
    <View style={bpmStyles.wrap}>
      <View style={bpmStyles.header}>
        <MaterialCommunityIcons name="metronome" size={14} color="#B8860B" />
        <Text style={bpmStyles.headerText}>Elige el tempo</Text>
        {locked !== null && (
          <View style={bpmStyles.lockedBadge}>
            <MaterialCommunityIcons name="lock-outline" size={11} color="#B8860B" />
            <Text style={bpmStyles.lockedText}>{locked} BPM activo</Text>
          </View>
        )}
      </View>
      <View style={bpmStyles.chips}>
        {BPM_OPTIONS.map((bpm) => {
          const isSel = effective === bpm;
          const isDisabled = locked !== null && locked !== bpm;
          return (
            <Pressable
              key={bpm}
              onPress={() => {
                if (locked !== null) return;
                onSelect(selected === bpm ? null : bpm);
              }}
              style={[
                bpmStyles.chip,
                isSel && bpmStyles.chipSelected,
                isDisabled && bpmStyles.chipDisabled,
              ]}
            >
              {isSel ? (
                <LinearGradient
                  colors={["#FFD166", "#B8860B"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 0, y: 1 }}
                  style={bpmStyles.chipGrad}
                >
                  <Text style={[bpmStyles.chipLabel, { color: "#1A1500" }]}>{bpm}</Text>
                  <Text style={[bpmStyles.chipUnit,  { color: "rgba(26,21,0,0.65)" }]}>BPM</Text>
                </LinearGradient>
              ) : (
                <View style={bpmStyles.chipInner}>
                  <Text style={[bpmStyles.chipLabel, { color: isDisabled ? "rgba(26,30,43,0.25)" : "rgba(26,30,43,0.7)" }]}>{bpm}</Text>
                  <Text style={[bpmStyles.chipUnit,  { color: isDisabled ? "rgba(26,30,43,0.15)" : "rgba(26,30,43,0.4)" }]}>BPM</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>
      <Text style={bpmStyles.hint}>
        {locked !== null
          ? "Ritmos del mismo tempo se sincronizan al beat."
          : "Los ritmos de distintos BPM no se pueden mezclar entre sí."}
      </Text>
    </View>
  );
});

const bpmStyles = StyleSheet.create({
  wrap: {
    marginHorizontal: 0,
    marginBottom: 10,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "rgba(212,175,55,0.06)",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.14)",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 12,
  },
  headerText: {
    fontFamily: "Manrope",
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: "rgba(26,30,43,0.65)",
    letterSpacing: 0.2,
  },
  lockedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "rgba(212,175,55,0.12)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.3)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  lockedText: {
    fontFamily: "Manrope",
    fontSize: 10,
    fontWeight: "700",
    color: "#B8860B",
    letterSpacing: 0.1,
  },
  chips: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 10,
  },
  chip: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(26,30,43,0.12)",
    backgroundColor: "#F4F4F4",
    height: 56,
  },
  chipSelected: {
    borderColor: "#B8860B",
    shadowColor: "#B8860B",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 6,
    elevation: 4,
  },
  chipDisabled: {
    opacity: 0.55,
  },
  chipGrad: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chipInner: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  chipLabel: {
    fontFamily: "Manrope",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.5,
    lineHeight: 24,
  },
  chipUnit: {
    fontFamily: "Manrope",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.3,
    lineHeight: 13,
  },
  hint: {
    fontFamily: "Manrope",
    fontSize: 11,
    color: "rgba(26,30,43,0.4)",
    textAlign: "center",
    lineHeight: 15,
  },
});

// ── PANTALLA ──────────────────────────────────────────────────────────────────
export default function MezcladorScreen() {
  const insets      = useSafeAreaInsets();
  const { isPremium }    = usePremium();
  const { sounds: allSounds, refresh: refreshSounds } = useSounds();
  const { open: openDrawer } = useDrawer();
  const { isMixerOpen, closeMixer } = useMixerPanel();
  const { isActive, toggleSound, activeBpm, bgPaletteId, setBgPaletteId, pauseMix } = useMixer();
  const { lastSavedAt } = useSaveEvent();
  const { theme } = useSceneTheme();
  const mixerWasOpenRef = useRef(false);

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

  const { setTabBarColors, requestHide, showMenu } = useTabBarVisibility();

  // null = ningún tab seleccionado → catálogo completo por secciones
  const [mainTab,        setMainTab]        = useState<MainTabId | null>(null);
  const [subTab,         setSubTab]         = useState<SoundCategoryId | null>(null);
  const [selectedBpm,    setSelectedBpm]    = useState<44 | 50 | 68 | 72 | null>(null);
  const [playCounts,     setPlayCounts]     = useState<Record<string, number>>({});
  const [contentAnimKey, setContentAnimKey] = useState(0);
  const [contentDir,     setContentDir]     = useState<"right" | "left">("right");
  const [subTabAnimKey,  setSubTabAnimKey]  = useState(0);

  // ── Menú inline (3 puntitos) ──
  const [menuOpen, setMenuOpen]   = useState(false);
  const [menuScrolled, setMenuScrolled] = useState(false);
  const [contentScrolled, setContentScrolled] = useState(false);

  const menuSlide = useRef(new Animated.Value(300)).current;
  const menuFade  = useRef(new Animated.Value(0)).current;

  const openMenu = () => {
    setMenuOpen(true);
    setMenuScrolled(false);
    menuSlide.setValue(260);
    menuFade.setValue(0);
    Animated.parallel([
      Animated.timing(menuSlide, { toValue: 0, duration: 260, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      Animated.timing(menuFade,  { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start();
  };

  const closeMenu = () => {
    // Una sola animación: el panel baja (sin fade sutil superpuesto).
    Animated.timing(menuSlide, { toValue: 700, duration: 240, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(() => {
      menuFade.setValue(0);
      setMenuOpen(false);
    });
  };

  // ── Ajustes del Mezclador (filtros: tema + etiquetas) ──
  const [moodFilter,      setMoodFilter]      = useState<MoodId | null>(null);
  const [tagFilters,      setTagFilters]      = useState<SoundTagId[]>([]);
  const settingsLoaded = useRef(false);

  // Carga inicial de los ajustes guardados
  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY)
      .then((raw) => {
        if (raw) {
          const s = JSON.parse(raw);
          // Validar contra los valores actuales (descarta datos obsoletos/corruptos)
          if (s.moodFilter && s.moodFilter in MOOD_SOUND_TAGS) {
            setMoodFilter(s.moodFilter as MoodId);
          }
          if (Array.isArray(s.tagFilters)) {
            const validTags = new Set(SOUND_TAGS.map((t) => t.id));
            setTagFilters(s.tagFilters.filter((t: unknown): t is SoundTagId =>
              typeof t === "string" && validTags.has(t as SoundTagId),
            ));
          }
          if (s.bgPaletteId) setBgPaletteId(getMixerBgPalette(s.bgPaletteId).id);
        }
      })
      .catch(() => {})
      .finally(() => { settingsLoaded.current = true; });
  }, []);

  // Persistencia de los ajustes (tras la carga inicial)
  useEffect(() => {
    if (!settingsLoaded.current) return;
    AsyncStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ moodFilter, tagFilters, bgPaletteId }),
    ).catch(() => {});
  }, [moodFilter, tagFilters, bgPaletteId]);

  const toggleTagFilter = (t: SoundTagId) =>
    setTagFilters((prev) =>
      prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t],
    );

  const clearFilters = () => {
    setMoodFilter(null);
    setTagFilters([]);
    setBgPaletteId(DEFAULT_MIXER_BG_PALETTE);
    AsyncStorage.setItem(
      SETTINGS_KEY,
      JSON.stringify({ moodFilter: null, tagFilters: [], bgPaletteId: DEFAULT_MIXER_BG_PALETTE }),
    ).catch(() => {});
  };

  // Limpia tema + etiquetas de una vez
  const clearForMode = () => {
    setBgPaletteId(DEFAULT_MIXER_BG_PALETTE);
    emitBgPresetChange("oscuro");
    setTagFilters([]);
  };

  const bgPalette = getMixerBgPalette(bgPaletteId);

  // Menú inferior siempre con color neutro (sin cambio por tab)
  useEffect(() => {
    setTabBarColors(null);
  }, [mainTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Al abrir el panel del Mezclador → esconder menú; al cerrar → restaurarlo
  useEffect(() => {
    if (!isMixerOpen) {
      // El Mezclador es un drawer siempre montado: al cerrarlo no pierde foco
      // necesariamente. Detectamos la transición abierto → cerrado para pausar
      // SU mezcla sin tocar el MiniPlayer de sesiones ni borrar su estado.
      if (mixerWasOpenRef.current) pauseMix();
      mixerWasOpenRef.current = false;
      showMenu();
      setTabBarColors(null);
      return;
    }
    mixerWasOpenRef.current = true;
    requestHide();
    setMainTab(null);
    refreshSounds();
    return () => {
      showMenu();
      setTabBarColors(null);
    };
  }, [isMixerOpen, pauseMix, refreshSounds, requestHide, setTabBarColors, showMenu]);

  // Al cambiar de tab (las tabs quedan montadas), restaurar siempre el tab bar;
  // y si se vuelve con el mixer abierto, ocultarlo de nuevo.
  useFocusEffect(
    useCallback(() => {
      if (isMixerOpen) requestHide();
      return () => {
        showMenu();
        setTabBarColors(null);
      };
    }, [isMixerOpen, requestHide, showMenu, setTabBarColors]),
  );

  // Al abandonar la pantalla, pausar sin destruir la mezcla. Se mantiene en
  // memoria para que el miniplayer y el botón Play puedan retomarla después.
  // Este efecto es independiente del estado del panel: abrir/cerrar el panel
  // no debe provocar una pausa accidental.
  useFocusEffect(
    useCallback(() => {
      return () => pauseMix();
    }, [pauseMix]),
  );

  const [bannerIdx,     setBannerIdx]     = useState(0);
  const bannerOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const cycle = () => {
      Animated.timing(bannerOpacity, { toValue: 0, duration: 500, useNativeDriver: true }).start(() => {
        setBannerIdx((i) => (i + 1) % MEZ_PLACEHOLDERS.length);
        Animated.timing(bannerOpacity, { toValue: 1, duration: 500, useNativeDriver: true }).start();
      });
    };
    const t = setInterval(cycle, 3800);
    return () => clearInterval(t);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const topPad    = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleMainTab = (id: MainTabId) => {
    if (id === mainTab) {
      // Des-seleccionar → volver al catálogo completo
      setMainTab(null);
      setSubTab(null);
      setSelectedBpm(null);
      setContentAnimKey((k) => k + 1);
      return;
    }
    const ids = MAIN_TABS.map((t) => t.id);
    setContentDir(mainTab === null || ids.indexOf(id) > ids.indexOf(mainTab) ? "right" : "left");
    setMainTab(id);
    setSubTab(null);
    if (id !== "bpm") setSelectedBpm(null);
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
    if (!hasSoundFile(sound.id) && !REMOTE_SOUND_MAP[sound.id]) return;
    if (sound.isPremium && !isPremium) {
      router.push("/membresia" as never);
      return;
    }
    if (!isActive(sound.id)) {
      // Detectar BPM incompatible antes de llamar a toggleSound (devuelve false
      // por dos motivos distintos: límite de sonidos Y BPM incompatible).
      if (sound.bpm !== undefined && activeBpm !== null && !soundMatchesBpm(sound, activeBpm)) {
        Alert.alert(
          `BPM incompatible`,
          `Ya hay ritmos a ${activeBpm} BPM en tu mezcla. Quitá todos los sonidos rítmicos para cambiar el tempo.`,
        );
        return;
      }
      const ok = toggleSound(sound.id, selectedBpm);
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
    allSounds.filter((s) => hasSoundFile(s.id) || !!REMOTE_SOUND_MAP[s.id])
      .slice()
      .sort((a, b) => (playCounts[b.id] ?? 0) - (playCounts[a.id] ?? 0))
      .slice(0, 50),
    [allSounds, playCounts],
  );

  const currentTabDef    = MAIN_TABS.find((t) => t.id === mainTab);
  const subTabCategories = currentTabDef?.categories ?? null;

  // BPM efectivo para filtrar: activeBpm tiene prioridad (ya hay ritmos sonando),
  // si no, el que el usuario eligió en el selector local.
  const effectiveBpm = activeBpm ?? selectedBpm;

  const displayedSounds = useMemo(() => {
    const base = !subTabCategories
      ? popularSounds
      : allSounds.filter(
          (s) =>
            (subTab ? [subTab] : subTabCategories).includes(s.category as SoundCategoryId) &&
            (mainTab !== "bpm" || effectiveBpm === null || soundMatchesBpm(s, effectiveBpm)),
        );

    const moodTags = moodFilter ? MOOD_SOUND_TAGS[moodFilter] ?? [] : [];
    const activeTags = Array.from(new Set([...moodTags, ...tagFilters]));
    if (activeTags.length === 0) return base;

    // Solo filtrar sonidos que TIENEN tags definidos; los que no tienen tags pasan siempre.
    return base.filter((s) => !s.tags?.length || s.tags.some((t) => activeTags.includes(t)));
  }, [mainTab, subTab, popularSounds, subTabCategories, moodFilter, tagFilters, effectiveBpm]);

  // ── Catálogo completo por secciones (sin tab seleccionado, estilo Insight Timer) ──
  const catalogSections = useMemo(() => {
    if (mainTab !== null) return [];
    const moodTags = moodFilter ? MOOD_SOUND_TAGS[moodFilter] ?? [] : [];
    const activeTags = Array.from(new Set([...moodTags, ...tagFilters]));
    const applyTags = (list: MixSound[]) =>
      activeTags.length === 0
        ? list
        : list.filter((s) => !s.tags?.length || s.tags.some((t) => activeTags.includes(t)));

    return MAIN_TABS.map((tab) => {
      const base = tab.categories === null
        ? popularSounds
        : allSounds.filter(
            (s) =>
              tab.categories!.includes(s.category as SoundCategoryId) &&
              (tab.id !== "bpm" || effectiveBpm === null || soundMatchesBpm(s, effectiveBpm)),
          );
      return { tab, sounds: applyTags(base) };
    }).filter((sec) => sec.sounds.length > 0);
  }, [mainTab, popularSounds, allSounds, moodFilter, tagFilters, effectiveBpm]);

  return (
    <View style={[styles.root, { backgroundColor: theme.solid }]}>
      <LinearGradient
        colors={theme.gradient as [string, string, ...string[]]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
      />
      <StatusBar hidden />

      <View style={styles.inner}>

        {/* ── Zona superior (layout imitando la página de Música) ── */}
        <View style={{ zIndex: 10, backgroundColor: "transparent" }}>
            {/* ── Hero: chevron y ajustes arriba, como en Música ── */}
            <View style={{ height: topPad + 45, position: "relative" }}>
              <View style={{ position: "absolute", left: 20, top: topPad + 3, zIndex: 10 }}>
                <View style={{ width: 40, height: 40, borderRadius: 20, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
                  <BackPill
                    onPress={closeMixer}
                    size={28}
                    bgColor="rgba(255,255,255,0.10)"
                    iconOffsetX={-1}
                    style={{ transform: [{ translateX: -1 }] }}
                  />
                </View>
              </View>
              {/* Título centrado, a la altura del chevron */}
              <View
                pointerEvents="none"
                style={{ position: "absolute", left: 0, right: 0, top: topPad + 3, height: 40, alignItems: "center", justifyContent: "center" }}
              >
                <Text style={[styles.pageTitle, { fontSize: 19, letterSpacing: 0.3 }]}>Mezclador de Sonidos</Text>
              </View>
              <View style={{ position: "absolute", right: 20, top: topPad + 3, zIndex: 10 }}>
                <Pressable
                  onPress={() => openMenu()}
                  style={{ width: 40, height: 40, alignItems: "center", justifyContent: "center" }}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Menú del Mezclador"
                >
                  <MaterialCommunityIcons name="tune-variant" size={22} color="#FBFBFB" />
                </Pressable>
              </View>
            </View>

            {/* ── Espaciador (título original menos 30 px: tabs suben) ── */}
            <View style={{ height: 19 }} />

            {/* ── Tabs en píldora: dos filas con scroll horizontal ── */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.pillRow}
              contentContainerStyle={styles.pillRowContent}
            >
              <View style={{ gap: 12 }}>
                {[
                  MAIN_TABS.slice(0, Math.ceil(MAIN_TABS.length / 2)),
                  MAIN_TABS.slice(Math.ceil(MAIN_TABS.length / 2)),
                ].map((row, i) => (
                  <View key={i} style={{ flexDirection: "row", gap: 11 }}>
                    {row.map((tab) => (
                      <View key={tab.id}>
                        <PillTab
                          tab={tab}
                          sel={mainTab === tab.id}
                          onPress={() => handleMainTab(tab.id)}
                        />
                      </View>
                    ))}
                  </View>
                ))}
              </View>
            </ScrollView>

            {/* ── Banner rotativo — oculto temporalmente ── */}

            {/* ── Sub-tabs eliminados ── */}
            <View style={{ height: 8 }} />

            {/* Divisor sticky: solo visible al hacer scroll.
                Siempre montado (solo cambia opacity) para no alterar el layout
                y evitar rebotes de la grilla al cruzar el umbral de scroll. */}
            <View
              pointerEvents="none"
              style={{
                height: StyleSheet.hairlineWidth,
                backgroundColor: "rgba(255,255,255,0.10)",
                marginHorizontal: -20,
                opacity: contentScrolled ? 1 : 0,
              }}
            />
        </View>

        {/* ── Scroll principal ── */}
        <View style={[styles.scrollBg, { backgroundColor: "transparent" }]}>
        <ScrollView
          style={[styles.scroll, { marginTop: -3 }]}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 200 + bottomPad }]}
          showsVerticalScrollIndicator={false}
          onScroll={(e) => setContentScrolled(e.nativeEvent.contentOffset.y > 2)}
          scrollEventThrottle={16}
        >
          <ContentSlide dir={contentDir}>
            {/* ── Chips de filtros activos ── */}
            {(tagFilters.length > 0 || moodFilter !== null) && (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.activeFilterRow}
                contentContainerStyle={styles.activeFilterRowContent}
              >
                {moodFilter !== null && (() => {
                  const mood = MOODS.find((m) => m.id === moodFilter);
                  return mood ? (
                    <Pressable
                      key="mood"
                      onPress={() => setMoodFilter(null)}
                      style={({ pressed }) => [styles.activeChip, { opacity: pressed ? 0.75 : 1 }]}
                    >
                      <Text style={styles.activeChipText}>{mood.emoji} {mood.label}</Text>
                      <Text style={styles.activeChipX}>✕</Text>
                    </Pressable>
                  ) : null;
                })()}
                {tagFilters.map((tagId) => {
                  const tag = SOUND_TAGS.find((t) => t.id === tagId);
                  return tag ? (
                    <Pressable
                      key={tagId}
                      onPress={() => toggleTagFilter(tagId)}
                      style={({ pressed }) => [styles.activeChip, { opacity: pressed ? 0.75 : 1 }]}
                    >
                      <Text style={styles.activeChipText}>{tag.label}</Text>
                      <Text style={styles.activeChipX}>✕</Text>
                    </Pressable>
                  ) : null;
                })}
              </ScrollView>
            )}
            {mainTab === "bpm" && (
              <BpmSelector
                selected={selectedBpm}
                locked={activeBpm as (44 | 50 | 68 | 72 | null)}
                onSelect={setSelectedBpm}
              />
            )}
            {mainTab === null && catalogSections.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="music-note-off-outline" size={34} color="rgba(26,30,43,0.35)" />
                <Text style={styles.emptyTitle}>Sin sonidos con estos filtros</Text>
                <Text style={styles.emptyHint}>Probá con otra combinación o tocá Limpiar filtros.</Text>
              </View>
            ) : mainTab === null ? (
              /* ── Catálogo completo: secciones por tab ── */
              catalogSections.map((sec) => (
                <View key={sec.tab.id}>
                  <View style={styles.sectionHeaderRow}>
                    <View style={styles.sectionHeaderLine} />
                    <Text style={styles.sectionHeaderText}>{sec.tab.label}</Text>
                    <View style={styles.sectionHeaderLine} />
                  </View>
                  <View style={styles.grid}>
                    {sec.sounds.map((s, i) => (
                      <SoundCard
                        key={`${sec.tab.id}-${s.id}`}
                        sound={s}
                        idx={i}
                        active={isActive(s.id)}
                        locked={!!s.isPremium && !isPremium}
                        available={hasSoundFile(s.id) || !!REMOTE_SOUND_MAP[s.id]}
                        image={getSoundImage(s.id) ?? REMOTE_SOUND_IMAGE_MAP[s.id]}
                        borderGradient={bgPaletteId === "noche" ? ["#FFFFFF", "#FFFFFF", "#FFFFFF"] : [TAB_GRADIENT[sec.tab.id][0], TAB_HEADER_GRADIENT[sec.tab.id][1], TAB_HEADER_GRADIENT[sec.tab.id][2]]}
                        textColor={bgPaletteId === "noche" ? "#FFFFFF" : undefined}
                        bgPaletteId={bgPaletteId}
                        onPress={() => handleSoundPress(s)}
                      />
                    ))}
                  </View>
                </View>
              ))
            ) : displayedSounds.length === 0 ? (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="music-note-off-outline" size={34} color="rgba(26,30,43,0.35)" />
                <Text style={styles.emptyTitle}>
                  {mainTab === "bpm"
                    ? "Los loops BPM llegan pronto"
                    : "Sin sonidos con estos filtros"}
                </Text>
                <Text style={styles.emptyHint}>
                  {mainTab === "bpm"
                    ? "Estamos preparando los audios rítmicos. Vuelve pronto."
                    : "Probá con otra combinación o tocá Limpiar filtros."}
                </Text>
              </View>
            ) : (
              <View style={[styles.grid, { marginTop: 19 }]}>
                {displayedSounds.map((s, i) => (
                  <SoundCard
                    key={s.id}
                    sound={s}
                    idx={i}
                    active={isActive(s.id)}
                    locked={!!s.isPremium && !isPremium}
                    available={hasSoundFile(s.id) || !!REMOTE_SOUND_MAP[s.id]}
                    image={getSoundImage(s.id) ?? REMOTE_SOUND_IMAGE_MAP[s.id]}
                    borderGradient={bgPaletteId === "noche" ? ["#FFFFFF", "#FFFFFF", "#FFFFFF"] : [TAB_GRADIENT[mainTab][0], TAB_HEADER_GRADIENT[mainTab][1], TAB_HEADER_GRADIENT[mainTab][2]]}
                    textColor={bgPaletteId === "noche" ? "#FFFFFF" : undefined}
                    bgPaletteId={bgPaletteId}
                    onPress={() => handleSoundPress(s)}
                  />
                ))}
              </View>
            )}
          </ContentSlide>
        </ScrollView>
        </View>
      </View>

      {/* ── Panel inline (sin backdrop oscuro) ── */}
      <Animated.View
        pointerEvents={menuOpen ? "box-none" : "none"}
        style={[
          styles.menuPanel,
          {
            transform: [{ translateY: menuSlide }],
            opacity: menuFade,
            backgroundColor: theme.solid,
          },
        ]}
      >
        {/* ── Header del panel (solo botón cerrar) ── */}
        <View style={styles.menuPanelHeader}>
          <View style={{ position: "absolute", left: 0, right: 0, bottom: 10, alignItems: "center", transform: [{ translateY: -10 }, { translateX: -5 }] }} pointerEvents="none">
            <Text style={[styles.menuPanelTabText, { fontSize: 24, fontWeight: "700", color: "#f9f9f9" }]}>Filtros</Text>
          </View>
          <View style={{ flex: 1 }} />
          <Pressable onPress={closeMenu} hitSlop={10} style={[styles.menuPanelClose, { transform: [{ translateX: -5 }, { translateY: -20 }] }]}>
            <MaterialCommunityIcons name="close" size={26} color="rgba(255,255,255,0.55)" />
          </Pressable>
        </View>
        {/* Divisor sticky: solo visible al hacer scroll */}
        {menuScrolled && <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: "rgba(255,255,255,0.10)" }} />}

        {(
          /* ── Filtros ── */
          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.menuPanelBody}
            onScroll={(e) => setMenuScrolled(e.nativeEvent.contentOffset.y > 2)}
            scrollEventThrottle={16}
          >
            <Text style={styles.menuSectionTitle}>Etiquetas</Text>
            <View style={styles.menuChipWrap}>
              {SOUND_TAGS.map((tag) => {
                const sel = tagFilters.includes(tag.id);
                return (
                  <Pressable
                    key={tag.id}
                    onPress={() => toggleTagFilter(tag.id)}
                    style={({ pressed }) => [
                      styles.menuChip,
                      { backgroundColor: sel ? "rgba(190,150,80,0.22)" : "rgba(255,255,255,0.07)", borderColor: sel ? GOLD : "rgba(255,255,255,0.18)", opacity: pressed ? 0.8 : 1 },
                    ]}
                  >
                    <Text style={[styles.menuChipText, { color: sel ? GOLD : "rgba(255,255,255,0.9)", fontWeight: sel ? "700" : "500" }]}>
                      {tag.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <Pressable
              onPress={clearForMode}
              disabled={tagFilters.length === 0 && bgPaletteId === DEFAULT_MIXER_BG_PALETTE}
              style={({ pressed }) => [
                styles.menuClearBtn,
                (tagFilters.length === 0 && bgPaletteId === DEFAULT_MIXER_BG_PALETTE) && styles.menuClearBtnDisabled,
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={[styles.menuClearBtnText, (tagFilters.length === 0 && bgPaletteId === DEFAULT_MIXER_BG_PALETTE) && { color: "rgba(255,255,255,0.4)" }]}>
                Limpiar filtros
              </Text>
            </Pressable>
          </ScrollView>
        )}
      </Animated.View>

    </View>
  );
}

const styles = StyleSheet.create({
  root:  { flex: 1, backgroundColor: "#1B060F" },
  inner: { flex: 1, backgroundColor: "transparent", overflow: "hidden" },

  topPanelShadow: {
    zIndex: 10,
    backgroundColor: "#210911",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.38,
    shadowRadius: 4,
    elevation: 8,
  },
  topPanel: { backgroundColor: "transparent" },

  header:    { paddingHorizontal: 20, marginBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8, marginRight: -6 },

  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: 70, paddingHorizontal: 40, gap: 8 },
  emptyTitle: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700", color: "rgba(26,30,43,0.7)", textAlign: "center" },
  emptyHint:  { fontFamily: "Manrope", fontSize: 13, color: "rgba(26,30,43,0.45)", textAlign: "center", lineHeight: 19 },
  pageTitle:    { fontFamily: "Manrope", fontSize: 18, fontWeight: "700", letterSpacing: 0.5, color: "#FBFBFB" },
  pageSubtitle: { fontFamily: "Manrope", fontSize: 13, fontWeight: "400", color: "#F4F4F4", marginTop: 2 },
  heartBtn: {
    width: 40, height: 40, alignItems: "center", justifyContent: "center",
    borderRadius: 12, backgroundColor: "rgba(0,0,0,0.05)",
  },
  headerPillBtn: {
    width: 38, height: 38, alignItems: "center", justifyContent: "center",
  },

  pillRow:        { flexGrow: 0, marginTop: -12, marginBottom: -8, backgroundColor: "transparent" },
  pillRowContent: { flexDirection: "row", gap: 8, paddingHorizontal: 15, paddingTop: 12, paddingBottom: 20 },
  pillTab: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 11.5,
    height: 29,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  pillTabTibet: { backgroundColor: "rgba(0,0,0,0.15)" },
  pillTabIndigo: { backgroundColor: "rgba(42,40,64,0.65)" },
  pillTabLabel:   { fontFamily: "Manrope", fontSize: 11, fontWeight: "400", letterSpacing: 0.3, color: "#F4F4F4" },
  pillTabLabelSel:{ color: "#0D0A1E", fontWeight: "600" },
  pillTabUnderline: {},

  separator: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(0,0,0,0.07)", marginTop: -6 },

  activeFilterRow: { flexGrow: 0 },
  activeFilterRowContent: {
    flexDirection: "row", gap: 8,
    paddingHorizontal: 2, paddingBottom: 12,
  },
  activeChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "rgba(0,0,0,0.1)",
    borderWidth: 1, borderColor: "#827b7a",
  },
  activeChipText: { fontFamily: "Manrope", fontSize: 12, fontWeight: "600", color: "#827b7a" },
  activeChipX:    { fontFamily: "Manrope", fontSize: 11, fontWeight: "700", color: "rgba(130,123,122,0.65)" },

  scrollBg:      { flex: 1 },
  scroll:        { flex: 1, backgroundColor: "transparent" },
  scrollContent: { paddingHorizontal: 14, paddingTop: 0 },

  bannerWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 15,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    gap: 10,
  },
  bannerText: {
    fontFamily: "Manrope",
    flex: 1,
    fontSize: 12,
    color: "rgba(255,255,255,0.88)",
    lineHeight: 18,
    letterSpacing: 0.1,
  },
  bannerBtn: {
    flexShrink: 0,
    backgroundColor: "rgba(233,196,106,0.12)",
    borderWidth: 1,
    borderColor: "rgba(233,196,106,0.28)",
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  bannerBtnText: {
    fontFamily: "Manrope",
    fontSize: 10,
    fontWeight: "600",
    color: "#F9F9F9",
    letterSpacing: 0.2,
  },

  subTabZone: { position: "relative", justifyContent: "center", marginTop: -6 },
  subTabRow:  { flexDirection: "row", gap: 8, paddingTop: 4, paddingBottom: 12, paddingHorizontal: 15 },
  subTabBorderOuter: {},
  subTabBorderSel: {},
  subTab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 13,
    height: 31,
    borderRadius: 999,
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  subTabSel: { borderWidth: 0 },
  subTabText: { fontFamily: "Manrope", fontSize: 13, letterSpacing: 0.3, fontWeight: "400", includeFontPadding: false },

  grid:      { flexDirection: "row", flexWrap: "wrap", columnGap: 20, rowGap: 17, justifyContent: "space-evenly" },

  // ── Encabezado de sección (catálogo completo, estilo Insight Timer) ──
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginTop: 30,
    marginBottom: 22,
    paddingHorizontal: 4,
  },
  sectionHeaderLine: {
    flex: 1,
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  sectionHeaderText: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "600",
    letterSpacing: 0.4,
    color: "#F4F4F4",
  },
  soundCard: { width: CARD_W },
  cardImageWrap: {
    width: IMG_SIZE, height: IMG_SIZE, alignSelf: "center", marginTop: 13,
  },
  cardBorderRing: {
    position: "absolute", top: -3, left: -3, right: -3, bottom: -3,
    borderRadius: 15, borderWidth: 4,
  },
  cardClipInner: {
    flex: 1, borderRadius: 12, overflow: "hidden",
    backgroundColor: "rgba(212,175,55,0.08)",
  },
  cardFooter: { paddingHorizontal: 4, paddingTop: 13, height: 38, overflow: "hidden" },
  soundName:  { fontFamily: "Manrope", fontSize: 11.5, fontWeight: "500", letterSpacing: 0.1, textAlign: "center", color: DARK },
  lockBadge:      { position: "absolute", top: 4, right: 4 },
  activeIconWrap: {
    position: "absolute",
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: "center", justifyContent: "center",
  },
  activeIconCircle: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(0,0,0,0.5)",
    alignItems: "center", justifyContent: "center",
  },

  // ── Menú inline (3 puntitos) ──────────────────────────────────────────────
  menuPanel: {
    position: "absolute",
    top: 0, bottom: 0, left: 0, right: 0,
    zIndex: 50,
    backgroundColor: "#1A1020",
    overflow: "hidden",
  },
  menuPanelHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingTop: 114,
    paddingBottom: 10,
  },
  menuPanelTabs: { flex: 1, flexDirection: "row", gap: 6 },
  menuPanelTab: {
    paddingHorizontal: 18, paddingVertical: 8,
    borderRadius: 999, overflow: "hidden",
    backgroundColor: "rgba(249,249,249,0.10)",
  },
  menuPanelTabSel: { backgroundColor: "#f9f9f9" },
  menuPanelTabText: {
    fontFamily: "Manrope", fontSize: 14, fontWeight: "600",
    color: "#f9f9f9",
  },
  menuPanelTabTextSel: { color: "#06071F", fontWeight: "700" },
  menuPanelClose: {
    width: 32, height: 32, alignItems: "center", justifyContent: "center",
  },
  menuPanelBody: { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 30 },

  menuSectionTitle: {
    fontFamily: "Manrope", fontSize: 13, fontWeight: "700",
    color: "rgba(255,255,255,0.55)", letterSpacing: 0.5,
    textTransform: "uppercase", marginBottom: 12,
  },
  swatchRow:  { flexDirection: "row", gap: 22, marginBottom: 6 },
  swatchItem: { alignItems: "center" },
  swatchCircle: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 2, borderColor: "rgba(0,0,0,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  swatchCircleSel: { borderColor: GOLD },
  swatchCheck:  { fontFamily: "Manrope", fontSize: 14, fontWeight: "900" },
  swatchLabel:  { fontFamily: "Manrope", fontSize: 11, fontWeight: "500" },
  swatchLabelSel: { fontWeight: "700" },

  menuChipWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  menuChip: {
    paddingHorizontal: 14, paddingVertical: 9,
    borderRadius: 999, borderWidth: 1.5,
  },
  menuChipText: { fontFamily: "Manrope", fontSize: 13 },

  menuClearBtn: {
    marginTop: 18, borderRadius: 40, paddingVertical: 13,
    alignItems: "center", backgroundColor: GOLD,
  },
  menuClearBtnDisabled: { backgroundColor: "rgba(190,150,80,0.18)" },
  menuClearBtnText: {
    fontFamily: "Manrope", fontSize: 14, fontWeight: "700", color: "#1B060F",
  },

});
