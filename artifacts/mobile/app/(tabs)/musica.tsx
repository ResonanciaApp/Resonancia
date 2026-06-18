import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
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
  View,
} from "react-native";

import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const BG_HEADER = require("../../assets/images/mezclador-bg-v3.jpg");

import { getSoundImage } from "@/config/sound-images";
import { usePremium } from "@/context/PremiumContext";
import { MAX_ACTIVE_SOUNDS, useMixer } from "@/context/MixerContext";
import { useSaveEvent } from "@/context/SaveEventContext";
import { useDrawer } from "@/context/DrawerContext";
import { useUserProfile } from "@/context/UserProfileContext";
import { useTabBarVisibility } from "@/context/TabBarVisibilityContext";
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
  type MixerBgPaletteId,
} from "@/data/mixer-bg-palettes";
import { MixerSettingsSheet } from "@/components/MixerSettingsSheet";
import { useSounds } from "@/context/SoundsContext";
import { REMOTE_SOUND_MAP, REMOTE_SOUND_IMAGE_MAP } from "@/lib/remoteSoundMap";
import { GoldGradient } from "@/components/GoldGradient";

// ── Paleta ────────────────────────────────────────────────────────────────────
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

type MainTabId = "popular" | "naturaleza" | "ancestrales" | "sintetizadores" | "voces" | "bpm";

const MAIN_TABS: {
  id: MainTabId;
  label: string;
  icon: string;
  color: string;
  categories: SoundCategoryId[] | null;
}[] = [
  { id: "popular",        label: "Todos",      icon: "music-note-eighth", color: "#8C1A2B", categories: null },
  { id: "naturaleza",     label: "Naturales",  icon: "leaf",              color: "#3A9060", categories: ["animales", "bosque", "mar", "fuego", "desierto"] },
  { id: "ancestrales",    label: "Sagrados",   icon: "bell",              color: "#B09040", categories: ["cuencos_tibetanos", "cuencos_cuarzo", "gongs", "campanas_viento", "vientos", "cantos", "percusion"] },
  { id: "sintetizadores", label: "Digital",    icon: "sine-wave",         color: "#3A80B0", categories: ["solfeggio"] },
  { id: "voces",          label: "Voces",      icon: "microphone",        color: "#9060A0", categories: ["mantras"] },
  { id: "bpm",            label: "BPM",        icon: "metronome",         color: "#A04040", categories: ["bpm"] },
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
const TAB_HEADER_GRADIENT: Record<MainTabId, [string, string, string]> = {
  popular:        ["#4A0C0C", "#27070E", "#1B060F"],
  naturaleza:     ["#0E2416", "#0B1A10", "#1B060F"],
  ancestrales:    ["#18130D", "#150E09", "#0E0A04"],
  sintetizadores: ["#061A2E", "#041220", "#1B060F"],
  voces:          ["#250810", "#1A060C", "#1B060F"],
  bpm:            ["#201A04", "#161302", "#1B060F"],
};

const TAB_GRADIENT: Record<MainTabId, [string, string]> = {
  popular:        ["#5E1E2D", "#5E1E2D"],
  naturaleza:     ["#3B4933", "#303E27"],
  ancestrales:    ["#A3631F", "#A3631F"],
  sintetizadores: ["#2C62AB", "#2C62AB"],
  voces:          ["#FF6B6B", "#C9184A"],
  bpm:            ["#FFD166", "#B8860B"],
};

// ── PillTab ───────────────────────────────────────────────────────────────────
const GOLD_BORDER: [string, string] = ["#D4AF37", "#E9C46A"];
/** Borde asimétrico: opaco en el centro, se disuelve hacia los extremos */
const GOLD_BORDER_PILL = ["transparent", "rgba(212,175,55,0.55)", "#E9C46A", "rgba(212,175,55,0.55)", "transparent"] as const;

const PillTab = memo(function PillTab({
  tab, sel, onPress,
}: { tab: (typeof MAIN_TABS)[0]; sel: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress}>
      {sel ? (
        <LinearGradient
          colors={GOLD_BORDER_PILL}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={styles.pillTabBorder}
        >
          <LinearGradient
            colors={TAB_HEADER_GRADIENT[tab.id]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.pillTabInner}
          >
            <MaskedView
              maskElement={
                <View style={styles.pillTabMaskContent}>
                  <MaterialCommunityIcons name={tab.icon as any} size={17} color="black" />
                  <Text numberOfLines={1} style={[styles.pillTabLabel, { color: "black", fontWeight: "700" }]}>
                    {tab.label}
                  </Text>
                </View>
              }
            >
              <LinearGradient
                colors={GOLD_BORDER}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <View style={styles.pillTabMaskContent}>
                  <MaterialCommunityIcons name={tab.icon as any} size={17} color="transparent" />
                  <Text numberOfLines={1} style={[styles.pillTabLabel, { color: "transparent", fontWeight: "700" }]}>
                    {tab.label}
                  </Text>
                </View>
              </LinearGradient>
            </MaskedView>
          </LinearGradient>
        </LinearGradient>
      ) : (
        <View style={[styles.pillTab, {
          backgroundColor: "transparent",
          borderWidth: 1,
          borderColor: "rgba(255,255,255,0.10)",
        }]}>
          <MaterialCommunityIcons name={tab.icon as any} size={17} color="rgba(255,255,255,0.4)" />
          <Text numberOfLines={1} style={[styles.pillTabLabel, { color: "rgba(255,255,255,0.4)", fontWeight: "400" }]}>
            {tab.label}
          </Text>
        </View>
      )}
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
  image: ReturnType<typeof getSoundImage> | string;
  activeColor: string;
  onPress: () => void;
};

const SoundCard = memo(function SoundCard({ sound, idx, active, locked, available, image, activeColor, onPress }: SoundCardProps) {
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
  const r = parseInt(activeColor.slice(1, 3), 16);
  const g = parseInt(activeColor.slice(3, 5), 16);
  const b = parseInt(activeColor.slice(5, 7), 16);
  const borderCol = anim.interpolate({ inputRange: [0, 1], outputRange: [`rgba(${r},${g},${b},0)`, `rgba(${r},${g},${b},1)`] });

  return (
    <Pressable onPress={onPress} disabled={!available} style={[styles.soundCard, { opacity: available ? 1 : 0.45 }]}>
      <Animated.View
        style={[
          styles.cardImageWrap,
          decorated && styles.cardImageWrapActive,
          { transform: [{ rotate }, { scale }], borderColor: borderCol },
        ]}
      >
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
      </Animated.View>
      <View style={styles.cardFooter}>
        <Text style={styles.soundName} numberOfLines={1}>{sound.name}</Text>
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
                  <Text style={[bpmStyles.chipLabel, { color: "#1A1500", fontWeight: "800" }]}>{bpm}</Text>
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
    backgroundColor: "rgba(255,255,255,0.55)",
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
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: -0.5,
    lineHeight: 24,
  },
  chipUnit: {
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 0.3,
    lineHeight: 13,
  },
  hint: {
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
  const { isActive, toggleSound, activeBpm } = useMixer();
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

  const { setTabBarColors } = useTabBarVisibility();

  const [mainTab,        setMainTab]        = useState<MainTabId>("popular");
  const [subTab,         setSubTab]         = useState<SoundCategoryId | null>(null);
  const [selectedBpm,    setSelectedBpm]    = useState<44 | 50 | 68 | 72 | null>(null);
  const [playCounts,     setPlayCounts]     = useState<Record<string, number>>({});
  const [contentAnimKey, setContentAnimKey] = useState(0);
  const [contentDir,     setContentDir]     = useState<"right" | "left">("right");
  const [subTabAnimKey,  setSubTabAnimKey]  = useState(0);

  // ── Ajustes del Mezclador (engranaje) ──
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [moodFilter,      setMoodFilter]      = useState<MoodId | null>(null);
  const [tagFilters,      setTagFilters]      = useState<SoundTagId[]>([]);
  const [bgPaletteId,     setBgPaletteId]     = useState<MixerBgPaletteId>(DEFAULT_MIXER_BG_PALETTE);
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
  };

  const bgPalette = getMixerBgPalette(bgPaletteId);

  // Sincroniza el color del menú inferior con el banner del tab activo
  useEffect(() => {
    if (mainTab === "popular") {
      setTabBarColors(null);
    } else {
      const g = TAB_HEADER_GRADIENT[mainTab];
      setTabBarColors([g[0], g[1]]);
    }
  }, [mainTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // Al volver al Mezclador → "Todos"; refrescar sonidos remotos; al salir → resetear color del menú
  useFocusEffect(
    React.useCallback(() => {
      setMainTab("popular");
      refreshSounds();
      return () => { setTabBarColors(null); };
    }, [setTabBarColors, refreshSounds]),
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

  const topPad    = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const handleMainTab = (id: MainTabId) => {
    if (id === mainTab) return;
    const ids = MAIN_TABS.map((t) => t.id);
    setContentDir(ids.indexOf(id) > ids.indexOf(mainTab) ? "right" : "left");
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

  return (
    <ImageBackground source={BG_HEADER} style={styles.root} resizeMode="cover">
      <StatusBar barStyle="light-content" />

      <View style={styles.inner}>

        {/* ── Zona superior ── */}
        <View style={styles.topPanelShadow}>
          <LinearGradient
            colors={TAB_HEADER_GRADIENT[mainTab]}
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
                <View style={styles.headerActions}>
                  <Pressable
                    onPress={() => setSettingsVisible(true)}
                    style={styles.heartBtn}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel="Ajustes del Mezclador"
                  >
                    <MaterialCommunityIcons name="cog-outline" size={20} color="#F4DAD5" />
                    {(moodFilter !== null || tagFilters.length > 0) && (
                      <GoldGradient style={styles.filterBadge} />
                    )}
                  </Pressable>
                </View>
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

            {/* ── Banner rotativo — oculto temporalmente ── */}

            {/* ── Sub-tabs ── */}
            {(!subTabCategories || subTabCategories.length <= 1) && (
              <View style={{ height: 8 }} />
            )}
            {subTabCategories && subTabCategories.length > 1 ? (
              <View style={styles.subTabZone}>
                <View style={styles.subTabLine} pointerEvents="none" />
                <SubTabSlide key={subTabAnimKey}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.subTabRow}>
                    {subTabCategories.map((catId) => {
                      const cat = SOUND_CATEGORIES.find((c) => c.id === catId);
                      if (!cat) return null;
                      const sel  = subTab === catId;
                      const grad = TAB_HEADER_GRADIENT[mainTab];
                      return (
                        <Pressable key={catId} onPress={() => setSubTab(sel ? null : catId)}>
                          {sel ? (
                            <LinearGradient
                              colors={["rgba(212,175,55,0.35)", "rgba(212,175,55,0.65)", "rgba(212,175,55,0.65)", "rgba(212,175,55,0.35)"]}
                              start={{ x: 0, y: 0.5 }}
                              end={{ x: 1, y: 0.5 }}
                              style={styles.subTabBorderOuter}
                            >
                              <LinearGradient
                                colors={grad}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 0, y: 1 }}
                                style={styles.subTabBorderInner}
                              >
                                <Text style={[styles.subTabText, { color: "#E9C46A", fontWeight: "700" }]}>
                                  {SUB_TAB_LABELS[catId] ?? cat.label}
                                </Text>
                              </LinearGradient>
                            </LinearGradient>
                          ) : (
                            <View style={[styles.subTabPill, { backgroundColor: "transparent", borderColor: "rgba(255,255,255,0.10)" }]}>
                              <Text style={[styles.subTabText, { color: "rgba(255,255,255,0.4)" }]}>
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
        <View style={styles.scrollBg}>
          <LinearGradient
            colors={bgPalette.colors}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: 200 + bottomPad }]}
          showsVerticalScrollIndicator={false}
        >
          <ContentSlide key={contentAnimKey} dir={contentDir}>
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
            {displayedSounds.length === 0 ? (
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
              <View style={[styles.grid, { marginTop: 14 }]}>
                {displayedSounds.map((s, i) => (
                  <SoundCard
                    key={s.id}
                    sound={s}
                    idx={i}
                    active={isActive(s.id)}
                    locked={!!s.isPremium && !isPremium}
                    available={hasSoundFile(s.id) || !!REMOTE_SOUND_MAP[s.id]}
                    image={getSoundImage(s.id) ?? REMOTE_SOUND_IMAGE_MAP[s.id]}
                    activeColor={currentTabDef?.color ?? "#8C1A2B"}
                    onPress={() => handleSoundPress(s)}
                  />
                ))}
              </View>
            )}
          </ContentSlide>
        </ScrollView>
        </View>
      </View>

      <MixerSettingsSheet
        visible={settingsVisible}
        onClose={() => setSettingsVisible(false)}
        moodFilter={moodFilter}
        onMoodChange={setMoodFilter}
        tagFilters={tagFilters}
        onToggleTag={toggleTagFilter}
        bgPaletteId={bgPaletteId}
        onBgPaletteChange={setBgPaletteId}
        onClear={clearFilters}
      />

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
  topPanel: { backgroundColor: "transparent" },

  header:    { paddingHorizontal: 20, marginBottom: 16 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 8 },

  emptyState: { alignItems: "center", justifyContent: "center", paddingTop: 70, paddingHorizontal: 40, gap: 8 },
  emptyTitle: { fontSize: 15, fontWeight: "700", color: "rgba(26,30,43,0.7)", textAlign: "center" },
  emptyHint:  { fontSize: 13, color: "rgba(26,30,43,0.45)", textAlign: "center", lineHeight: 19 },
  pageTitle:    { fontSize: 27, fontWeight: "700", letterSpacing: 0.5, color: "#F4DAD5" },
  pageSubtitle: { fontSize: 13, fontWeight: "400", color: "rgba(244,218,213,0.55)", marginTop: 2 },
  heartBtn: {
    width: 40, height: 40, alignItems: "center", justifyContent: "center",
    borderRadius: 12, backgroundColor: "rgba(0,0,0,0.05)",
  },
  filterBadge: {
    position: "absolute", top: 6, right: 6,
    width: 7, height: 7, borderRadius: 4,
  },

  pillRow:        { flexGrow: 0, marginTop: -3, marginBottom: -5, backgroundColor: "transparent" },
  pillRowContent: { flexDirection: "row", gap: 8, paddingHorizontal: 15, paddingTop: 20, paddingBottom: 24 },
  pillGlow: {
    borderRadius: 999,
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.24,
    shadowRadius: 6,
    elevation: 6,
  },
  pillTab: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    width: 104,
    height: 38,
    borderRadius: 999,
    overflow: "hidden",
    gap: 4,
  },
  pillTabBorder: {
    width: 104,
    height: 38,
    borderRadius: 999,
    padding: 1,
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.60,
    shadowRadius: 7,
    elevation: 0,
  },
  pillTabInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 999,
    overflow: "hidden",
    gap: 4,
  },
  pillTabMaskContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "transparent",
  },
  pillTabLabel: { fontSize: 12, letterSpacing: 0.1, fontWeight: "700" },

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
  activeChipText: { fontSize: 12, fontWeight: "600", color: "#827b7a" },
  activeChipX:    { fontSize: 11, fontWeight: "700", color: "rgba(130,123,122,0.65)" },

  scrollBg:      { flex: 1 },
  scroll:        { flex: 1, backgroundColor: "transparent" },
  scrollContent: { paddingHorizontal: 14, paddingTop: 14 },

  bannerWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 15,
    marginBottom: 10,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    gap: 10,
  },
  bannerText: {
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
    fontSize: 10,
    fontWeight: "600",
    color: "#E9C46A",
    letterSpacing: 0.2,
  },

  subTabZone: { position: "relative", justifyContent: "center", marginTop: -10 },
  subTabLine: {
    position: "absolute", left: 16, right: 16, bottom: 0,
    height: StyleSheet.hairlineWidth, backgroundColor: "rgba(0,0,0,0.07)",
  },
  subTabRow:  { flexDirection: "row", gap: 8, paddingTop: 4, paddingBottom: 12, paddingHorizontal: 16 },
  subTabPill: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, paddingVertical: 5,
    borderRadius: 999, borderWidth: 1,
  },
  subTabBorderOuter: {
    borderRadius: 999,
    padding: 1,
  },
  subTabBorderInner: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 13, paddingVertical: 4,
    borderRadius: 999,
  },
  subTabText: { fontSize: 12, fontWeight: "400" },

  grid:      { flexDirection: "row", flexWrap: "wrap", columnGap: 10, rowGap: 22, justifyContent: "space-evenly" },
  soundCard: { width: "28%" },
  cardImageWrap: {
    width: "79%", aspectRatio: 1, alignSelf: "center",
    borderRadius: 16, borderWidth: 5, borderColor: "transparent",
  },
  cardClipInner: {
    flex: 1, borderRadius: 14, overflow: "hidden",
    backgroundColor: "rgba(212,175,55,0.08)",
  },
  cardImageWrapActive: { borderWidth: 4 },
  cardFooter: { paddingHorizontal: 4, paddingTop: 8, paddingBottom: 2 },
  soundName:  { fontSize: 11.5, fontWeight: "600", letterSpacing: 0.1, textAlign: "center", color: DARK },
  lockBadge:  { position: "absolute", top: 4, right: 4 },
});
