/**
 * MixerSheet — editor de la mezcla activa en hoja inferior (estilo Insight Timer).
 * ─────────────────────────────────────────────────────────────────
 * Se monta UNA sola vez a nivel global (app/_layout.tsx) y se abre desde
 * la barra flotante (MiniPlayer) o desde la barra compacta (MixerPanel).
 *
 * Permite: ajustar volumen por pista, reordenar, quitar pistas, agregar
 * más sonidos, reproducir/pausar, temporizador, y guardar / actualizar
 * la mezcla. Si no hay sonidos activos, no renderiza nada.
 * ─────────────────────────────────────────────────────────────────
 */
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import Svg, { Path, Rect } from "react-native-svg";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { GoldGradient, GoldGradientFill } from "@/components/GoldGradient";
import { GhostPill } from "@/components/GhostPill";
import { MilestoneCelebration } from "@/components/MilestoneCelebration";
import { useMilestones } from "@/context/MilestonesContext";
import { router } from "expo-router";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { DURATION, easeOutCubic } from "@/constants/motion";
import {
  Alert,
  Animated,
  Dimensions,
  Easing,
  ImageBackground,
  Modal,
  PanResponder,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { GestureDetector, Gesture, ScrollView as GHScrollView } from "react-native-gesture-handler";
import Reanimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  type SharedValue,
} from "react-native-reanimated";

import { EscenasMixerContent } from "@/app/escenas-mixer";
import { useSaveEvent } from "@/context/SaveEventContext";
import { VolumeSlider } from "@/components/VolumeSlider";
import { DEFAULT_MIX_IMAGE_KEY, MIX_IMAGE_GALLERY, getMixImage } from "@/config/mix-images";
import { getSoundImage } from "@/config/sound-images";
import { MAX_ACTIVE_SOUNDS, useMixer } from "@/context/MixerContext";
import { InmersivoContent } from "@/components/InmersivoMixerModal";
import { usePremium } from "@/context/PremiumContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { isIndigoThemeId } from "@/config/scene-themes";
import { MIX_CATEGORIES, type MixCategory } from "@/data/mix-categories";
import { type MixSound, getSoundById } from "@/data/sounds";
import { useColors } from "@/hooks/useColors";
import { consumeReopenMixer } from "@/utils/immersivo-flags";
import {
  DEFAULT_BG_PRESET_ID,
  DEFAULT_OVERLAY,
  GRADIENT_PRESETS,
  MIXER_BG_KEY,
  MIXER_OVERLAY_KEY,
  subscribeBgPreset,
  subscribeOverlay,
} from "@/config/immersive-presets";

const TIMER_OPTIONS = [15, 30, 45, 60];
const FREE_MIX_PER_CATEGORY = 1;

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

type SaveMode = "new" | "update";

/** Superficie negra translúcida y sobria (botones guardar / temporizador). */
const TRANSLUCENT_SURFACE = "rgba(0,0,0,0.28)";

/** Degradé negro sobrio (miniatura sin imagen + fondo de la hoja). */
const DARK_GRADIENT = ["#27070E", "#1B060F"] as const;

/** Devuelve true si el primer color del gradiente es claro (luminancia media > 100). */
function isLightGradient(g: readonly [string, string, string]): boolean {
  const hex = g[0].replace("#", "");
  if (hex.length !== 6) return false;
  const r = parseInt(hex.slice(0, 2), 16);
  const gr = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (r + gr + b) / 3 > 100;
}

function getDarkestGradientColor(colors: readonly string[]): string {
  let darkest = colors[0] ?? "#000000";
  let darkestLuminance = Number.POSITIVE_INFINITY;

  for (const color of colors) {
    const hex = color.replace("#", "");
    if (hex.length !== 6) continue;
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    if (luminance < darkestLuminance) {
      darkest = color;
      darkestLuminance = luminance;
    }
  }

  return darkest;
}

/** Flotante Zen — paleta para el sheet del mezclador. */
const WARM = {
  bg: "#4A0C0C",
  handle: "rgba(74,12,12,0.08)",
  trackBg: "#27070E",
  trackBorder: "rgba(61,14,22,0.40)",
  sliderThumb: "#FFFFFF",
  sliderTrack: "rgba(255,255,255,0.10)",
  addBorder: "transparent",
  addText: "rgba(255,255,255,0.30)",
  separator: "rgba(61,14,22,0.40)",
  playBg: "transparent",
  playBorder: "transparent",
  playText: "rgba(255,255,255,0.75)",
  saveBg: "transparent",
  saveBorder: "transparent",
  saveText: "rgba(212,175,55,0.80)",
  caption: "#c2c2c2",
} as const;

/** Miniatura cuadrada de la pista: imagen del sonido (fallback degradé negro). */
// ─── Drag-and-drop reorder ────────────────────────────────────────────────────
const ITEM_H = 77; // height of each slot (row content ~69px + gap between items)

type TrackPalette = {
  muted: string; fg: string; sliderThumb: string;
  sliderTrack: string; inputBg: string;
};

interface DraggableTrackRowProps {
  id: string;
  sound: MixSound;
  volume: number;
  n: number;
  orderSV: SharedValue<string[]>;
  draggingId: SharedValue<string>;
  dragOriginSlot: SharedValue<number>;
  dragDeltaY: SharedValue<number>;
  insertAt: SharedValue<number>;
  palette: TrackPalette;
  setVolume: (id: string, v: number) => void;
  removeSound: (id: string) => void;
  onDragStart: () => void;
  onDragEnd: (from: number, to: number) => void;
  breathingIds: string[];
  toggleBreathe: (id: string) => void;
}

function DraggableTrackRow({
  id, sound, volume, n,
  orderSV, draggingId, dragOriginSlot, dragDeltaY, insertAt,
  palette, setVolume, removeSound, onDragStart, onDragEnd,
  breathingIds, toggleBreathe,
}: DraggableTrackRowProps) {
  const isBreathing = breathingIds.includes(id);
  const didActivate = useSharedValue(0);

  const pan = Gesture.Pan()
    .activateAfterLongPress(250)
    .onStart(() => {
      didActivate.value = 1;
      const s = orderSV.value.indexOf(id);
      dragOriginSlot.value = s;
      dragDeltaY.value = 0;
      insertAt.value = s;
      draggingId.value = id;
      runOnJS(onDragStart)();
    })
    .onUpdate((e) => {
      if (didActivate.value !== 1) return;
      dragDeltaY.value = e.translationY;
      const raw = Math.round((dragOriginSlot.value * ITEM_H + e.translationY) / ITEM_H);
      insertAt.value = Math.max(0, Math.min(n - 1, raw));
    })
    .onFinalize(() => {
      if (didActivate.value !== 1) return;
      didActivate.value = 0;
      const orig = dragOriginSlot.value;
      const ins = insertAt.value;
      const newOrder = [...orderSV.value];
      const [moved] = newOrder.splice(orig, 1);
      newOrder.splice(ins, 0, moved);
      orderSV.value = newOrder;
      draggingId.value = "";
      dragDeltaY.value = 0;
      dragOriginSlot.value = -1;
      insertAt.value = -1;
      runOnJS(onDragEnd)(orig, ins);
    });

  const animStyle = useAnimatedStyle(() => {
    const isDragging = draggingId.value === id;
    const mySlot = orderSV.value.indexOf(id);
    if (isDragging) {
      return {
        transform: [{ translateY: dragOriginSlot.value * ITEM_H + dragDeltaY.value }],
        zIndex: 50,
        shadowOpacity: 0.25,
      };
    }
    const orig = dragOriginSlot.value;
    const ins = insertAt.value;
    let effective = mySlot;
    if (draggingId.value !== "" && orig >= 0 && ins >= 0) {
      if (ins <= orig) {
        if (mySlot >= ins && mySlot < orig) effective = mySlot + 1;
      } else {
        if (mySlot > orig && mySlot <= ins) effective = mySlot - 1;
      }
    }
    return {
      transform: [{ translateY: withTiming(effective * ITEM_H, { duration: 180 }) }],
      zIndex: 1,
      shadowOpacity: 0,
    };
  });

  return (
    <Reanimated.View style={[styles.trackRowAbs, animStyle]}>
      <View style={styles.trackRow}>
        <GestureDetector gesture={pan}>
          <View>
            <TrackThumb sound={sound} />
            <Pressable
              onPress={() => removeSound(id)}
              hitSlop={4}
              style={styles.removeBtnOverlay}
              accessibilityRole="button"
              accessibilityLabel={`Quitar ${sound.name} de la mezcla`}
            >
              <Feather name="x" size={16} color="#060A0F" />
            </Pressable>
          </View>
        </GestureDetector>
        <View style={styles.trackInfo}>
          <Text style={[styles.trackName, { color: palette.fg }]} numberOfLines={1}>
            {sound.name}
          </Text>
          <View style={styles.sliderRow}>
            <View style={{ flex: 1 }}>
              <VolumeSlider
                value={volume}
                onChange={(v) => setVolume(id, v)}
                color={palette.sliderThumb}
                trackColor={palette.sliderTrack}
              />
            </View>
            <Pressable
              onPress={() => toggleBreathe(id)}
              hitSlop={8}
              style={[styles.breatheBtn, isBreathing && styles.breatheBtnActive]}
              accessibilityRole="button"
              accessibilityLabel="Respiración de volumen"
            >
              <Feather name="activity" size={17} color={isBreathing ? "#F9F9F9" : palette.muted} />
            </Pressable>
          </View>
        </View>
      </View>
    </Reanimated.View>
  );
}

interface DraggableSoundListProps {
  activeMix: { active: { id: string; volume: number }; sound: MixSound }[];
  palette: TrackPalette;
  setVolume: (id: string, v: number) => void;
  removeSound: (id: string) => void;
  reorderSounds: (from: number, to: number) => void;
  onScrollEnabled: (enabled: boolean) => void;
  breathingIds: string[];
  toggleBreathe: (id: string) => void;
}

function DraggableSoundList({
  activeMix, palette, setVolume, removeSound, reorderSounds, onScrollEnabled,
  breathingIds, toggleBreathe,
}: DraggableSoundListProps) {
  const n = activeMix.length;
  const ids = activeMix.map((x) => x.sound.id);
  const idsKey = ids.join(",");

  const orderSV = useSharedValue<string[]>(ids);
  const draggingId = useSharedValue("");
  const dragOriginSlot = useSharedValue(-1);
  const dragDeltaY = useSharedValue(0);
  const insertAt = useSharedValue(-1);

  const prevIdsKey = useRef(idsKey);
  useEffect(() => {
    if (prevIdsKey.current === idsKey) return;
    prevIdsKey.current = idsKey;
    const cur = orderSV.value;
    const merged = cur.filter((id) => ids.includes(id));
    ids.forEach((id) => { if (!merged.includes(id)) merged.push(id); });
    orderSV.value = merged;
  }, [idsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDragStart = useCallback(() => {
    onScrollEnabled(false);
  }, [onScrollEnabled]);

  const handleDragEnd = useCallback((from: number, to: number) => {
    reorderSounds(from, to);
    onScrollEnabled(true);
  }, [reorderSounds, onScrollEnabled]);

  return (
    <View style={{ height: n * ITEM_H, position: "relative" }}>
      {activeMix.map(({ active, sound }) => (
        <DraggableTrackRow
          key={sound.id}
          id={sound.id}
          sound={sound}
          volume={active.volume}
          n={n}
          orderSV={orderSV}
          draggingId={draggingId}
          dragOriginSlot={dragOriginSlot}
          dragDeltaY={dragDeltaY}
          insertAt={insertAt}
          palette={palette}
          setVolume={setVolume}
          removeSound={removeSound}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          breathingIds={breathingIds}
          toggleBreathe={toggleBreathe}
        />
      ))}
    </View>
  );
}

// ─── TrackThumb ───────────────────────────────────────────────────────────────
function TrackThumb({ sound }: { sound: MixSound }) {
  const image = getSoundImage(sound.id);
  if (image) {
    return <ImageBackground source={image} style={styles.thumb} imageStyle={styles.thumbRadius} />;
  }
  return (
    <LinearGradient
      colors={DARK_GRADIENT}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.thumb}
    />
  );
}

export function MixerSheet() {
  const colors = useColors();
  const insets = useSafeAreaInsets();

  // ── Fondo personalizable ──────────────────────────────────────────────────
  // Por defecto (sin escena elegida) el fondo se enlaza al tema activo de la
  // app (mismo degradado que Inicio, elegido con el loto). Ver `theme` abajo.
  const { theme } = useSceneTheme();
  const [bgPresetId,    setBgPresetId]    = useState<string>(DEFAULT_BG_PRESET_ID);
  const [overlayOpacity, setOverlayOpacity] = useState<number>(DEFAULT_OVERLAY);
  const [bgPickerOpen, setBgPickerOpen] = useState(false);
  const bgPickerY = useRef(new Animated.Value(700)).current;

  const isDefaultBg = bgPresetId === DEFAULT_BG_PRESET_ID;
  const rawBgPreset =
    GRADIENT_PRESETS.find((p) => p.id === bgPresetId) ??
    GRADIENT_PRESETS.find((p) => p.id === DEFAULT_BG_PRESET_ID)!;
  const activeBgPreset = isDefaultBg
    ? { ...rawBgPreset, colors: theme.gradient, image: undefined, isLight: false }
    : rawBgPreset;
  const sheetGradient = activeBgPreset.colors;
  const isLight = activeBgPreset.isLight ?? false;
  /** true cuando hay cualquier escena o color seleccionado (no el fondo por defecto, enlazado al tema) */
  const hasCustomBg = bgPresetId !== DEFAULT_BG_PRESET_ID;
  // Mismo fondo de las pills no seleccionadas de Dormir, adaptado al tema.
  const sleepTabBackground =
    theme.id === "tibet"
      ? "rgba(0,0,0,0.15)"
      : isIndigoThemeId(theme.id)
        ? "rgba(181,211,255,0.057)"
        : "rgba(181,211,255,0.057)";

  // Cargar preset y overlay guardados
  // Nota: "borgona" era el fondo por defecto ANTES de enlazar el fondo al tema
  // activo de Inicio; usuarios con ese valor viejo persistido en AsyncStorage
  // deben re-enlazarse al tema (no quedar pegados al borgoña fijo de antes).
  useEffect(() => {
    AsyncStorage.multiGet([MIXER_BG_KEY, MIXER_OVERLAY_KEY])
      .then(([bg, ov]) => {
        if (bg[1] && bg[1] !== "blanco" && bg[1] !== "borgona") setBgPresetId(bg[1]);
        if (ov[1]) setOverlayOpacity(parseFloat(ov[1]));
      })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Escucha cambios en vivo desde EscenasMixer
  useEffect(() => {
    const unsubBg = subscribeBgPreset((id) => setBgPresetId(id));
    const unsubOv = subscribeOverlay((v) => setOverlayOpacity(v));
    return () => { unsubBg(); unsubOv(); };
  }, []);

  // Nota: el fondo antes tenía una animación de "respiración" (opacity 1↔0.78
  // en loop) que producía una ondulación/vibración sutil y constante — se
  // notaba más con la mezcla sonando (foco visual en la hoja) y se
  // confundía con algo "sincronizado con el sonido". Se retira: bgBreath
  // queda fijo en 1 (fondo estático, sin parpadeo).

  const openBgPicker = () => {
    bgPickerY.setValue(700);
    setBgPickerOpen(true);
    Animated.timing(bgPickerY, { toValue: 0, duration: DURATION.SHEET_OPEN, easing: easeOutCubic, useNativeDriver: true }).start();
  };

  const closeBgPicker = () => {
    Animated.timing(bgPickerY, { toValue: 700, duration: 220, easing: Easing.in(Easing.quad), useNativeDriver: true })
      .start(() => setBgPickerOpen(false));
  };

  const selectBgPreset = (id: string) => {
    setBgPresetId(id);
    AsyncStorage.setItem(MIXER_BG_KEY, id).catch(() => {});
  };

  const palette = {
    handle:         isLight ? "rgba(0,0,0,0.12)"    : WARM.handle,
    sliderThumb:    hasCustomBg ? "rgba(255,255,255,0.90)" : isLight ? "#3b0808" : WARM.sliderThumb,
    sliderTrack:    "rgba(255,255,255,0.10)",
    addText:        "#AAAAC4",
    separator:      isLight ? "rgba(24,2,2,0.10)" : activeBgPreset.image ? "rgba(255,255,255,0.18)" : WARM.separator,
    iconColor:      hasCustomBg ? "rgba(255,255,255,0.90)" : isLight ? "#180202" : "rgba(255,255,255,0.90)",
    fg:             hasCustomBg ? "rgba(255,255,255,0.90)" : isLight ? "#180202" : colors.foreground,
    muted:          isLight ? "rgba(24,2,2,0.45)"  : colors.mutedForeground,
    inputBg:        sleepTabBackground,
    footerCircleBg: sleepTabBackground,
    footerLabel:    "#AAAAC4",
    footerSideIcon: "#AAAAC4",
    headerFg:       "#F4F4F4",
  };
  const { isPremium } = usePremium();
  const [scrollEnabled, setScrollEnabled] = useState(true);

  const {
    activeSounds,
    setVolume,
    removeSound,
    moveSound,
    reorderSounds,
    isPlaying,
    togglePlay,
    pauseMix,
    stopAll,
    presets,
    savePreset,
    updatePreset,
    loadedPresetId,
    sleepTimerRemaining,
    setSleepTimer,
    isSheetOpen,
    closeSheet,
    openImmersivo,
    inmersivoOpen,
    closeImmersivo,
    breathingIds,
    toggleBreathe,
  } = useMixer();

  // Preset del que partió esta edición (sobrevive a cambios de pistas, que
  // resetean loadedPresetId). Permite "Actualizar" aunque se agreguen/quiten
  // sonidos durante la edición.
  const [originId, setOriginId] = useState<string | null>(null);

  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [escenasOpen, setEscenasOpen] = useState(false);
  const [saveMode, setSaveMode] = useState<SaveMode>("new");
  const [presetName, setPresetName] = useState("");
  const [mixDescription, setMixDescription] = useState("");
  const [mixImage, setMixImage] = useState<string>(DEFAULT_MIX_IMAGE_KEY);
  const [mixCategory, setMixCategory] = useState<MixCategory>("dormir");

  const { notifySaved } = useSaveEvent();

  // Valores animados: entrada (slideIn) + fade al guardar
  const sheetOpacity   = useRef(new Animated.Value(1)).current;
  const sheetEnterY    = useRef(new Animated.Value(Dimensions.get("window").height)).current;
  const immersivoFade  = useRef(new Animated.Value(0)).current;
  const saveOverlayOpacity = useRef(new Animated.Value(0)).current;
  const nameCursorOpacity = useRef(new Animated.Value(1)).current;
  const savedToastOpacity = useRef(new Animated.Value(0)).current;
  const savedToastY = useRef(new Animated.Value(12)).current;
  // Dim del fondo: arranca en 0 y se desvanece HACIA dentro junto con el slide,
  // así no aparece de golpe (era el "overlay negro" que flasheaba en tema claro).
  const backdropOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(nameCursorOpacity, { toValue: 0, duration: 500, useNativeDriver: true }),
        Animated.timing(nameCursorOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      ]),
    );
    blink.start();
    return () => blink.stop();
  }, [nameCursorOpacity]);

  // Ref para evitar cierre doble (p.ej. backdrop + gesto simultáneos)
  const closingRef = useRef(false);

  // Cierre animado: desliza hacia abajo + desvanece dim, luego cierra de verdad.
  // Se accede vía ref para que el PanResponder (capturado una sola vez) use
  // siempre la versión actualizada sin necesidad de reconstruirlo.
  const handleAnimatedCloseRef = useRef<(stopAudio?: boolean) => void>(() => {});
  handleAnimatedCloseRef.current = (stopAudio = false) => {
    if (closingRef.current) return;
    closingRef.current = true;
    // Mantener el Modal visible aunque activeSounds se vacíe (caso X + stopAll)
    setForceShowModal(true);
    if (stopAudio) stopAll();
    // Cerrar el estado YA para que MezclaMiniPlayer arranque su colapso al mismo
    // tiempo que la animación del sheet (si llamáramos closeSheet en el callback,
    // el mini-player recibiría la señal 280ms más tarde → desincronizado).
    // El useLayoutEffect bloqueará el reset de sheetEnterY/backdropOpacity
    // mientras closingRef.current === true.
    closeSheet();
    const SCREEN_H = Dimensions.get("window").height;
    Animated.parallel([
      Animated.timing(sheetEnterY, {
        toValue: SCREEN_H,
        duration: DURATION.SHEET_CLOSE,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(backdropOpacity, {
        toValue: 0,
        duration: DURATION.SHEET_CLOSE,
        easing: Easing.in(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start(() => {
      closingRef.current = false;
      setForceShowModal(false);
    });
  };

  // PanResponder para arrastrar hacia abajo y cerrar
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => g.dy > 5,
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) sheetEnterY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80 || g.vy > 0.5) {
          handleAnimatedCloseRef.current();
        } else {
          Animated.timing(sheetEnterY, {
            toValue: 0,
            duration: DURATION.PLAYER,
            easing: easeOutCubic,
            useNativeDriver: true,
          }).start();
        }
      },
    }),
  ).current;

  // Snapshot de la mezcla en el momento en que se abrió la hoja.
  // Se usa para detectar cambios (agregar/quitar/volumen) sin depender de
  // si hay un preset cargado o no.
  const [snapshotSounds, setSnapshotSounds] = useState<{ id: string; volume: number }[]>([]);

  // Al abrir: reset + entrada deslizante desde abajo
  // useLayoutEffect → corre antes del primer paint, evita el frame con opacity=0
  useLayoutEffect(() => {
    if (isSheetOpen) {
      // Limpiar estado residual de sub-paneles: si el sheet se cerró abruptamente
      // (tap en backdrop) mientras el bgPicker o Escenas estaban abiertos, su
      // estado queda en true aunque el modal no sea visible. Al reabrir, el panel
      // aparecería inmediatamente visible y "chocaría" con la animación de entrada.
      setBgPickerOpen(false);
      bgPickerY.setValue(700);
      setEscenasOpen(false);
      sheetOpacity.setValue(1);
      immersivoFade.setValue(0);
      if (consumeReopenMixer()) {
        sheetEnterY.setValue(0);
        backdropOpacity.setValue(1);
      } else {
        sheetEnterY.setValue(Dimensions.get("window").height);
        backdropOpacity.setValue(0);
        Animated.timing(sheetEnterY, {
          toValue: 0,
          duration: DURATION.SHEET_OPEN,
          easing: easeOutCubic,
          useNativeDriver: true,
        }).start();
        Animated.timing(backdropOpacity, {
          toValue: 1,
          duration: 280,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }).start();
      }
      Animated.timing(immersivoFade, {
        toValue: 1,
        duration: 480,
        delay: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }).start();
      setOriginId(loadedPresetId);
      setSnapshotSounds(activeSounds.map((s) => ({ id: s.id, volume: s.volume })));
    } else if (!closingRef.current) {
      // Reset a estado "cerrado": el PRÓXIMO montaje del Modal pinta su primer
      // frame ya fuera de pantalla y sin dim (mata el flash de la escena/overlay
      // negro que aparecía arriba por el translateY=0 residual + dim instantáneo).
      // Guard: si closingRef.current === true la animación de cierre ya está
      // corriendo y maneja los valores ella misma; no interrumpir.
      sheetEnterY.setValue(Dimensions.get("window").height);
      backdropOpacity.setValue(0);
    }
  }, [isSheetOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  const activeMix = useMemo(
    () =>
      activeSounds
        .map((a) => ({ active: a, sound: getSoundById(a.id) }))
        .filter((x): x is { active: typeof x.active; sound: MixSound } => !!x.sound),
    [activeSounds],
  );

  const originPreset = useMemo(
    () => (originId ? presets.find((p) => p.id === originId) : undefined),
    [originId, presets],
  );

  /** Detecta si la mezcla actual difiere del snapshot al abrir la hoja. */
  const mixHasChanged = useMemo(() => {
    if (snapshotSounds.length === 0 && activeSounds.length === 0) return false;
    if (activeSounds.length !== snapshotSounds.length) return true;
    const snapMap = new Map(snapshotSounds.map((s) => [s.id, s.volume]));
    return activeSounds.some((a) => snapMap.get(a.id) !== a.volume);
  }, [activeSounds, snapshotSounds]);

  const handleAddSounds = () => {
    handleAnimatedCloseRef.current();
    router.push("/(tabs)/musica" as never);
  };

  /** Actualiza el preset de origen directamente, sin abrir el modal. */
  const handleUpdateDirect = () => {
    if (!mixHasChanged || !canUpdate || !originId || !originPreset) return;
    updatePreset(originId, {
      name: originPreset.name,
      description: originPreset.description ?? "",
      image: originPreset.image ?? DEFAULT_MIX_IMAGE_KEY,
      category: originPreset.category,
    });
    setSnapshotSounds(activeSounds.map((s) => ({ id: s.id, volume: s.volume })));
    Alert.alert("Mezcla actualizada", "Se guardaron los cambios en tu mezcla.");
  };

  const openSaveModal = (mode: SaveMode) => {
    if (activeSounds.length === 0) return;
    setSaveMode(mode);
    if (mode === "update" && originPreset) {
      setPresetName(originPreset.name);
      setMixDescription(originPreset.description ?? "");
      setMixImage(originPreset.image ?? DEFAULT_MIX_IMAGE_KEY);
      setMixCategory(originPreset.category);
    } else {
      setPresetName("");
      setMixDescription("");
      setMixImage(DEFAULT_MIX_IMAGE_KEY);
      setMixCategory("dormir");
    }
    saveOverlayOpacity.setValue(0);
    setSaveModalOpen(true);
    Animated.timing(saveOverlayOpacity, {
      toValue: 1,
      duration: 220,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  };

  const cancelSave = () => {
    Animated.timing(saveOverlayOpacity, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => setSaveModalOpen(false));
  };

  const showSavedToast = () => {
    savedToastOpacity.stopAnimation();
    savedToastY.stopAnimation();
    savedToastOpacity.setValue(0);
    savedToastY.setValue(12);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(savedToastOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(savedToastY, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1800),
      Animated.parallel([
        Animated.timing(savedToastOpacity, {
          toValue: 0,
          duration: 260,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(savedToastY, {
          toValue: 8,
          duration: 260,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const finishSaveInMixer = (presetId: string) => {
    setOriginId(presetId);
    setSnapshotSounds(activeSounds.map((sound) => ({ id: sound.id, volume: sound.volume })));
    pauseMix();
    notifySaved();
    Animated.timing(saveOverlayOpacity, {
      toValue: 0,
      duration: 200,
      easing: Easing.in(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setSaveModalOpen(false);
      showSavedToast();
    });
  };

  const confirmSave = () => {
    if (saveMode === "update" && originId) {
      // Si el usuario free mueve la mezcla a otra categoría que ya está llena,
      // aplicar el mismo límite que en guardar/duplicar (gating solo UI).
      const movingCategory = originPreset != null && originPreset.category !== mixCategory;
      if (movingCategory) {
        const countInTarget = presets.filter(
          (p) => p.category === mixCategory && p.id !== originId,
        ).length;
        if (!isPremium && countInTarget >= FREE_MIX_PER_CATEGORY) {
          Alert.alert(
            "Mezclas ilimitadas con Premium",
            `En la versión gratuita podés guardar ${FREE_MIX_PER_CATEGORY} mezcla por categoría. Hacete Premium para mover y guardar todas las que quieras.`,
            [
              { text: "Ahora no", style: "cancel" },
              { text: "Ver Premium", onPress: () => router.push("/membresia" as never) },
            ],
          );
          return;
        }
      }
      updatePreset(originId, {
        name: presetName,
        description: mixDescription,
        image: mixImage,
        category: mixCategory,
      });
      finishSaveInMixer(originId);
      return;
    }

    const countInCategory = presets.filter((p) => p.category === mixCategory).length;
    if (!isPremium && countInCategory >= FREE_MIX_PER_CATEGORY) {
      Alert.alert(
        "Mezclas ilimitadas con Premium",
        `En la versión gratuita podés guardar ${FREE_MIX_PER_CATEGORY} mezcla por categoría. Hacete Premium para guardar todas las que quieras.`,
        [
          { text: "Ahora no", style: "cancel" },
          { text: "Ver Premium", onPress: () => router.push("/membresia" as never) },
        ],
      );
      return;
    }
    const savedPresetId = savePreset({
      name: presetName,
      description: mixDescription,
      image: mixImage,
      category: mixCategory,
    });
    if (savedPresetId) finishSaveInMixer(savedPresetId);
  };

  const handleTimerPress = () => {
    const options = [
      ...TIMER_OPTIONS.map((m) => ({
        text: `${m} min`,
        onPress: () => setSleepTimer(m),
      })),
      ...(sleepTimerRemaining != null
        ? [{ text: "Cancelar temporizador", onPress: () => setSleepTimer(null) }]
        : []),
      { text: "Cerrar", style: "cancel" as const },
    ];
    Alert.alert("Temporizador de sueño", "El sonido se detendrá al terminar.", options);
  };

  const handleClear = () => {
    stopAll();
  };

  const { celebrating } = useMilestones();
  const milestoneHoldRef = useRef(false);

  const canShow = isSheetOpen && activeMix.length > 0;
  const canUpdate = originId != null && originPreset != null;

  // Mantiene el Modal visible durante el fade de cierre aunque canShow
  // cambie a false (por stopAll). Se libera al terminar la animación.
  const [forceShowModal, setForceShowModal] = useState(false);
  const baseVisible = canShow || forceShowModal || inmersivoOpen;
  // Mantiene el Modal vivo mientras hay una celebración de hito en curso que
  // NACIÓ con la hoja abierta (si no, la celebración se desmonta a mitad).
  // No abre el Modal por una celebración ajena (p. ej. hito de Geometrix).
  if (baseVisible) milestoneHoldRef.current = true;
  else if (!celebrating) milestoneHoldRef.current = false;
  const modalVisible = baseVisible || (celebrating != null && milestoneHoldRef.current);

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={() => { if (inmersivoOpen) closeImmersivo(); else handleAnimatedCloseRef.current(); }}
    >
      {/* La opacidad envuelve TODA la superficie (backdrop + sheet) para que
          el fade cubra el MixerPanel subyacente sin flashes */}
      <Animated.View style={{ flex: 1, opacity: sheetOpacity }}>
      <Pressable style={styles.backdrop} onPress={() => handleAnimatedCloseRef.current()}>
        <Animated.View
          style={[styles.backdropDim, { opacity: backdropOpacity }]}
          pointerEvents="none"
        />
        <Animated.View
          style={{ transform: [{ translateY: sheetEnterY }] }}
        >
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: sheetGradient[sheetGradient.length - 1], paddingTop: insets.top + 8 },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[StyleSheet.absoluteFill, styles.bgLayerClip]} pointerEvents="none">
            {activeBgPreset.image ? (
              <>
                {/* La imagen sobresale 300px en cada dirección para que `cover` recorte
                    sin dejar strip blanco/negro; el contenedor tiene overflow:hidden
                    (styles.bgLayerClip) para que ese sobrante NO se asome arriba de la
                    hoja durante el slide (era la franja que flasheaba al abrir). */}
                <Image
                  source={activeBgPreset.image}
                  style={{
                    position: "absolute",
                    top: -300, left: -300, right: -300, bottom: -300,
                    borderTopLeftRadius: 20,
                    borderTopRightRadius: 20,
                  }}
                  contentFit="cover"
                />
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    styles.sheetGradient,
                    { backgroundColor: `rgba(8,3,6,${overlayOpacity})` },
                  ]}
                />
              </>
            ) : (
              <LinearGradient
                colors={[...sheetGradient]}
                locations={isDefaultBg ? [0, 1, 1] : undefined}
                start={{ x: 0.5, y: 0 }}
                end={{ x: 0.5, y: 1 }}
                style={styles.sheetGradient}
              />
            )}
          </View>

          {/* Overlay de contraste para escenas con imagen: se suma al overlay
              animado para garantizar legibilidad del contenido sobre paisajes */}
          {activeBgPreset.image && (
            <View
              style={[
                StyleSheet.absoluteFill,
                styles.imageSceneOverlay,
              ]}
              pointerEvents="none"
            />
          )}

          {/* ── Cabecera con fondo propio — solo visible en tema sin imagen ── */}
          <View
            style={[styles.headerBg, { marginTop: -(insets.top + 8), paddingTop: insets.top + 8, backgroundColor: "transparent" }]}
            {...panResponder.panHandlers}
          >
            <View style={[styles.headerRow, { marginTop: -8 }]}>
              <Pressable
                onPress={() => handleAnimatedCloseRef.current()}
                hitSlop={10}
                style={[styles.headerBtn, { marginLeft: -7, backgroundColor: sleepTabBackground }]}
                accessibilityRole="button"
                accessibilityLabel="Cerrar editor de mezcla"
              >
                <Feather name="chevron-down" size={24} color={palette.headerFg} />
              </Pressable>
              <Text style={[styles.title, { color: palette.headerFg, flex: 1, textAlign: "center", fontSize: 15 }]} numberOfLines={1}>
                {originPreset?.name ?? "Tu mezcla"}
              </Text>
              <Pressable
                onPress={() => handleAnimatedCloseRef.current(true)}
                hitSlop={10}
                style={[styles.headerBtn, { marginRight: -8, backgroundColor: sleepTabBackground }]}
                accessibilityRole="button"
                accessibilityLabel="Cerrar mezcla"
              >
                <Feather name="x" size={22} color={palette.headerFg} />
              </Pressable>
            </View>

            {/* Línea divisora sutil */}
          </View>

          <GHScrollView
            style={styles.trackScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            nestedScrollEnabled
            scrollEnabled={scrollEnabled}
          >
            <DraggableSoundList
              activeMix={activeMix}
              palette={palette}
              setVolume={setVolume}
              removeSound={removeSound}
              reorderSounds={reorderSounds}
              onScrollEnabled={setScrollEnabled}
              breathingIds={breathingIds}
              toggleBreathe={toggleBreathe}
            />

            <Pressable
              onPress={handleAddSounds}
              style={styles.addBtn}
            >
              <Feather name="plus" size={18} color={palette.addText} />
              <Text style={[styles.addBtnText, { color: palette.addText }]}>Agregar sonidos</Text>
            </Pressable>
          </GHScrollView>


          {/* Separador sonidos / tab — oculto */}

          {/* ── Footer: Timer | Play | Guardar ── */}
          <View
            style={[
              styles.glassFooter,
              {
                paddingBottom: insets.bottom + 8,
                paddingTop: 12,
                backgroundColor: "transparent",
                borderTopWidth: 0,
              },
            ]}
          >
            {/* Footer: Timer | Play | Guardar + Actualizar */}
            <View style={styles.footerRow}>

              {/* Izquierda: Timer */}
              <Pressable
                onPress={handleTimerPress}
                style={[styles.footerSide, { transform: [{ translateY: -10 }] }]}
                accessibilityRole="button"
                accessibilityLabel={sleepTimerRemaining != null ? "Temporizador activo" : "Configurar temporizador"}
              >
                <View style={[styles.footerTimerCircle, { backgroundColor: palette.footerCircleBg }]}>
                  <MaterialCommunityIcons name="clock" size={29} color={palette.footerSideIcon} />
                </View>
                <Text style={[styles.footerLabel, { color: palette.footerLabel, textAlign: "center" }]}>
                  {sleepTimerRemaining != null ? formatTimer(sleepTimerRemaining) : "Timer para\ndormir"}
                </Text>
              </Pressable>

              {/* Centro: Play/Pause sin label */}
              <Pressable
                onPress={togglePlay}
                style={[styles.footerCenter, { transform: [{ translateY: -20 }] }]}
                accessibilityRole="button"
              >
                <View style={[styles.footerPlayCircle, { backgroundColor: palette.footerCircleBg }]}>
                  <Svg width={45} height={45} viewBox="0 0 48 48" style={{ marginLeft: 2 }}>
                    {isPlaying ? (
                      <>
                        <Rect x="7"  y="5" width="12" height="36" rx="5" ry="5" fill={palette.iconColor} />
                        <Rect x="27" y="5" width="12" height="36" rx="5" ry="5" fill={palette.iconColor} />
                      </>
                    ) : (
                      <Path d="M 13.2 7.1 Q 8 4 8 10 L 8 36 Q 8 42 13.2 38.9 L 34.8 26.1 Q 40 23 34.8 19.9 Z" fill={palette.iconColor} />
                    )}
                  </Svg>
                </View>
              </Pressable>

              {/* Derecha: Guardar */}
              <View style={[styles.footerSide, { transform: [{ translateY: -10 }] }]}>
                <Pressable style={styles.footerSaveBtn} onPress={() => openSaveModal(originPreset ? "update" : "new")}>
                  <View style={[styles.footerHeartCircle, { backgroundColor: palette.footerCircleBg }]}>
                    <MaterialCommunityIcons name="heart" size={29} color={palette.footerSideIcon} />
                  </View>
                  <Text style={[styles.footerLabel, { color: palette.footerLabel, textAlign: "center" }]}>{"Guardar tu\nmezcla"}</Text>
                </Pressable>
              </View>

            </View>
          </View>

        </Pressable>
        </Animated.View>
      </Pressable>

      {/* Popup guardar/actualizar: in-tree (NO es un Modal aparte) para que
          desvanezca DENTRO del mismo contenedor que sheetOpacity → reproductor +
          popup + su dim como UNA sola unidad, sin que el des-oscurecimiento del
          backdrop "frene" al reproductor durante el cierre. */}
      {saveModalOpen && (
        <Animated.View style={[styles.modalOverlay, { opacity: saveOverlayOpacity }]}>
          <Pressable style={StyleSheet.absoluteFill} onPress={cancelSave} />
          <Pressable
            style={[styles.modalCard, { backgroundColor: getDarkestGradientColor(sheetGradient) }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: "#FFFFFF" }]}>Nombra tu mezcla</Text>

            <View style={[styles.modalInput, { backgroundColor: palette.inputBg }]}>
              <Animated.View
                style={[styles.modalNameCursor, { opacity: nameCursorOpacity }]}
                pointerEvents="none"
              />
              <TextInput
                value={presetName}
                onChangeText={setPresetName}
                placeholder="Borrador de mezcla"
                placeholderTextColor={palette.muted}
                style={styles.modalTextInput}
                maxLength={40}
              />
            </View>

            <View style={styles.modalActions}>
              <Pressable onPress={cancelSave} style={[styles.modalBtn, styles.modalCancelBtn]}>
                <Text style={[styles.modalBtnText, { color: palette.muted }]}>Cancelar</Text>
              </Pressable>
              <Pressable
                onPress={confirmSave}
                style={[styles.modalBtn, { overflow: "hidden" }]}
              >
                <GoldGradientFill />
                <Text style={[styles.modalBtnText, { color: colors.primaryForeground, fontWeight: "700" }]}>
                  {saveMode === "update" ? "Actualizar" : "Guardar"}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Animated.View>
      )}
      <Animated.View
        pointerEvents="none"
        style={[
          styles.savedToast,
          {
            bottom: insets.bottom + 122,
            opacity: savedToastOpacity,
            transform: [{ translateY: savedToastY }],
          },
        ]}
      >
        <MaterialCommunityIcons name="heart" size={18} color="#A777D0" />
        <Text style={styles.savedToastText}>Mezcla guardada en Biblioteca</Text>
      </Animated.View>
      {/* ── Picker de fondo: panel deslizante in-tree ── */}
      {bgPickerOpen && (
        <Animated.View
          style={[styles.bgPickerPanel, { transform: [{ translateY: bgPickerY }] }]}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={closeBgPicker} />
          <Pressable
            style={styles.bgPickerCard}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.bgPickerHandle} />
            <View style={styles.bgPickerTitleRow}>
              <Text style={styles.bgPickerTitle}>Elige tu fondo</Text>
              {bgPresetId !== DEFAULT_BG_PRESET_ID && (
                <Pressable
                  onPress={() => selectBgPreset(DEFAULT_BG_PRESET_ID)}
                  style={styles.restablecerBtn}
                  hitSlop={8}
                >
                  <Feather name="rotate-ccw" size={11} color="#C0304A" />
                  <Text style={styles.restablecerText}>Restablecer</Text>
                </Pressable>
              )}
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.bgPickerGrid}
            >
              {GRADIENT_PRESETS.filter((p) => p.id !== DEFAULT_BG_PRESET_ID).map((preset) => {
                const sel = preset.id === bgPresetId;
                return (
                  <Pressable
                    key={preset.id}
                    onPress={() => selectBgPreset(preset.id)}
                    style={[styles.bgPresetCard, sel && styles.bgPresetCardSel, sel && isLight && { borderWidth: 3.5 }]}
                  >
                    {preset.image ? (
                      <>
                        <Image
                          source={preset.image}
                          style={StyleSheet.absoluteFill}
                          contentFit="cover"
                        />
                        {preset.imageOverlay && (
                          <View style={[StyleSheet.absoluteFill, { backgroundColor: preset.imageOverlay, borderRadius: 12 }]} />
                        )}
                      </>
                    ) : (
                      <LinearGradient
                        colors={[...preset.colors]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />
                    )}
                    <Text style={styles.bgPresetEmoji}>{preset.emoji}</Text>
                    <Text style={styles.bgPresetName} numberOfLines={1}>{preset.name}</Text>
                    {sel && (
                      <View style={styles.bgPresetCheck}>
                        <GoldGradientFill />
                        <Feather name="check" size={12} color="#1B060F" />
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>

            <Pressable style={styles.bgPickerDone} onPress={closeBgPicker}>
              <Text style={styles.bgPickerDoneText}>Listo</Text>
            </Pressable>
          </Pressable>
        </Animated.View>
      )}
      </Animated.View>

      {/* Escenas: Modal anidado, sin tocar la navegación → al cerrar vuelve aquí */}
      <Modal
        visible={escenasOpen}
        animationType="slide"
        presentationStyle="fullScreen"
        statusBarTranslucent
        onRequestClose={() => setEscenasOpen(false)}
      >
        <EscenasMixerContent onClose={() => setEscenasOpen(false)} />
      </Modal>

      {/* Modo Inmersivo: absoluteFill dentro del mismo Modal → cero conflictos de capas nativas */}
      {inmersivoOpen && (
        <View style={StyleSheet.absoluteFill}>
          <InmersivoContent />
        </View>
      )}

      {/* Celebración de hitos DENTRO de este Modal: una ventana hermana no
          aparece sobre un Modal ya abierto en iOS (pantalla quedaba bloqueada) */}
      <MilestoneCelebration />
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "transparent",
  },
  backdropDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  bgLayerClip: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  sheet: {
    height: Dimensions.get("window").height,
    paddingHorizontal: 20,
  },
  sheetGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  imageSceneOverlay: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: "rgba(0,0,0,0.59)",
  },
  headerBg: {
    backgroundColor: "transparent",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginHorizontal: -20,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 0,
  },
  headerBtn: { width: 38, height: 38, alignItems: "center", justifyContent: "center", borderRadius: 19, backgroundColor: "rgba(255,255,255,0.10)" },
  headerPillBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center" },
  caption: { fontFamily: "Manrope", fontSize: 10, letterSpacing: 1.8, textTransform: "uppercase", marginBottom: 4, fontWeight: "400" },
  title: { fontFamily: "Manrope", fontSize: 18, fontWeight: "700", letterSpacing: 0.3 },
  subtitle: { fontFamily: "Manrope", fontSize: 12, marginTop: 2 },
  clearText: { fontFamily: "Manrope", fontSize: 12, fontWeight: "400" },
  clearPill: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "400",
    letterSpacing: 0.3,
    color: "#FFFFFF",
  },
  glassFooter: {
    overflow: "hidden",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: "rgba(181,211,255,0.057)",
    backgroundColor: "rgba(255,255,255,0.005)",
  },
  pillAboveFooter: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 4,
  },
  ajustesPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.25)",
    backgroundColor: "rgba(212,175,55,0.07)",
  },
  ajustesPillText: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.2,
  },

  trackScroll: { flex: 1, paddingTop: 30 },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderRadius: 10,
    // El row se extiende a los bordes de la hoja; este inset evita que la
    // miniatura y el botón de quitar queden recortados por el viewport.
    paddingLeft: 27,
    paddingRight: 8,
    paddingVertical: 6,
    marginBottom: 8,
  },
  warmSeparator: { height: 1, marginTop: 14, marginBottom: 0, marginHorizontal: -20, backgroundColor: "rgba(61,14,22,0.40)" },
  headerDivider: { height: 1, marginTop: 4, marginBottom: 4, marginHorizontal: -20 },
  thumb: { width: 57, height: 57, borderRadius: 11, overflow: "hidden", borderWidth: 1, borderColor: "rgba(255,255,255,0.50)" },
  thumbRadius: { borderRadius: 10 },
  removeBtnOverlay: {
    position: "absolute",
    top: -7,
    left: -7,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#F9F9F9",
    alignItems: "center",
    justifyContent: "center",
  },
  trackInfo: { flex: 1, justifyContent: "center", paddingRight: 20 },
  trackName: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700", marginBottom: -2, paddingLeft: 8, marginTop: 6 },
  sliderRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  breatheBtn: {
    width: 27,
    height: 27,
    borderRadius: 13.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  breatheBtnActive: {
    backgroundColor: "rgba(218,212,236,0.15)",
  },
  _reorderPill_unused: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderRadius: 10,
    overflow: "hidden",
  },
  reorderBtn: { width: 34, height: 36, alignItems: "center", justifyContent: "center" },
  reorderDivider: { width: StyleSheet.hairlineWidth, height: 22 },
  removeBtn: { width: 36, height: 36, alignItems: "center", justifyContent: "center" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    height: 40,
    marginTop: 10,
  },
  addBtnText: { fontFamily: "Manrope", fontSize: 10, fontWeight: "400", letterSpacing: 2, textTransform: "uppercase" },

  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginTop: 4,
    marginBottom: 10,
  },
  footerSide: {
    flex: 1,
    alignItems: "center",
    gap: 8,
  },
  footerCenter: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  footerPlayCircle: {
    width: 77,
    height: 77,
    borderRadius: 38.5,
    alignItems: "center",
    justifyContent: "center",
  },
  footerLabel: {
    fontFamily: "Manrope",
    fontSize: 10,
    fontWeight: "400",
    letterSpacing: 1.5,
    textTransform: "uppercase",
  },
  footerSaveBtn: {
    alignItems: "center",
    gap: 6,
  },
  footerHeartCircle: {
    width: 49,
    height: 49,
    borderRadius: 24.5,
    alignItems: "center",
    justifyContent: "center",
  },
  footerTimerCircle: {
    width: 49,
    height: 49,
    borderRadius: 24.5,
    alignItems: "center",
    justifyContent: "center",
  },
  footerUpdateBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingTop: 2,
  },
  footerUpdateText: {
    fontFamily: "Manrope",
    fontSize: 10,
    fontWeight: "400",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    color: "rgba(212,175,55,0.80)",
  },

  // Modal guardar
  modalOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.7)",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 42,
  },
  modalCard: {
    width: "100%",
    borderRadius: 18,
    padding: 20,
    overflow: "hidden",
  },
  modalTitle: { fontFamily: "Manrope", fontSize: 17, fontWeight: "700", marginBottom: 14, textAlign: "center" },
  modalScroll: { maxHeight: 420 },
  modalInput: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 50,
  },
  modalNameCursor: {
    width: 2,
    height: 24,
    borderRadius: 1,
    backgroundColor: "#F9F9F9",
    marginRight: 6,
  },
  modalTextInput: {
    flex: 1,
    padding: 0,
    fontFamily: "Manrope",
    fontSize: 15,
    color: "#FFFFFF",
  },
  modalInputArea: { minHeight: 64, textAlignVertical: "top" },
  catTabRow: { flexDirection: "row", gap: 8, marginTop: 6 },
  catTabBlock: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 13,
    paddingHorizontal: 2,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.35)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  catTabBlockSel: {
    backgroundColor: "rgba(100,142,195,0.14)",
  },
  catTabLabel: { fontFamily: "Manrope", fontSize: 15, textAlign: "center" },
  imgGallery: { gap: 8, paddingVertical: 2 },
  imgThumbWrap: { borderRadius: 12, overflow: "hidden" },
  imgThumb: { width: 64, height: 64, justifyContent: "center", alignItems: "center" },
  imgThumbInner: { borderRadius: 12, borderWidth: 2 },
  imgCheck: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 16,
  },
  modalBtn: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelBtn: {
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.16)",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  modalBtnText: { fontFamily: "Manrope", fontSize: 14, fontWeight: "600" },
  savedToast: {
    position: "absolute",
    alignSelf: "center",
    zIndex: 60,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    maxWidth: "88%",
    minHeight: 42,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 21,
    backgroundColor: "rgba(22,15,40,0.96)",
    borderWidth: 1,
    borderColor: "rgba(167,119,208,0.32)",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.24,
    shadowRadius: 10,
    elevation: 8,
  },
  savedToastText: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "600",
    color: "#F9F9F9",
  },

  // ── Botón Modo Inmersivo ───────────────────────────────────────────────────
  immersivoBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 50,
    backgroundColor: "rgba(212,175,55,0.08)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.22)",
  },
  immersivoBtnLight: {
    backgroundColor: "rgba(61,48,78,0.07)",
    borderColor: "rgba(61,48,78,0.22)",
  },
  immersivoBtnImage: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderColor: "rgba(255,255,255,0.22)",
  },
  immersivoBtnCustom: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderColor: "rgba(255,255,255,0.20)",
  },
  ajustesPillCustom: {
    backgroundColor: "rgba(255,255,255,0.10)",
    borderColor: "rgba(255,255,255,0.20)",
  },
  immersivoIconWrap: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  immersivoIconEye: {
    position: "absolute",
  },
  immersivoBtnText: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
    color: "rgba(212,175,55,0.85)",
    letterSpacing: 0.5,
  },

  // ── Picker de fondo ────────────────────────────────────────────────────────
  bgPickerPanel: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "flex-end",
  },
  bgPickerCard: {
    backgroundColor: "#0F0308",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 1,
    borderColor: "rgba(212,175,55,0.15)",
    paddingHorizontal: 20,
    paddingBottom: 32,
    maxHeight: "80%",
  },
  bgPickerHandle: {
    width: 36,
    height: 3,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 16,
  },
  bgPickerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  bgPickerTitle: {
    fontFamily: "Manrope",
    color: "#FAF0EE",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  restablecerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(140,26,43,0.5)",
    backgroundColor: "rgba(140,26,43,0.12)",
  },
  restablecerText: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "600",
    color: "#C0304A",
    letterSpacing: 0.2,
  },
  bgPickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    paddingBottom: 8,
  },
  bgPresetCard: {
    width: "30.5%",
    height: 90,
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 7,
    borderWidth: 1.5,
    borderColor: "transparent",
  },
  bgPresetCardSel: {
    borderColor: "#F9F9F9",
  },
  bgPresetEmoji: {
    fontFamily: "Manrope",
    fontSize: 20,
    marginBottom: 2,
  },
  bgPresetName: {
    fontFamily: "Manrope",
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.80)",
    letterSpacing: 0.2,
    textAlign: "center",
    paddingHorizontal: 4,
  },
  bgPresetCheck: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  bgPickerDone: {
    marginTop: 14,
    backgroundColor: "rgba(212,175,55,0.12)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.30)",
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: "center",
  },
  bgPickerDoneText: {
    fontFamily: "Manrope",
    color: "#F9F9F9",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  trackRowAbs: {
    position: "absolute",
    left: -20,
    right: -20,
    top: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 8,
  },
});
