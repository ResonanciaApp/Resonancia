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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
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

import { useSaveEvent } from "@/context/SaveEventContext";
import { VolumeSlider } from "@/components/VolumeSlider";
import { DEFAULT_MIX_IMAGE_KEY, MIX_IMAGE_GALLERY, getMixImage } from "@/config/mix-images";
import { getSoundImage } from "@/config/sound-images";
import { MAX_ACTIVE_SOUNDS, useMixer } from "@/context/MixerContext";
import { usePremium } from "@/context/PremiumContext";
import { MIX_CATEGORIES, type MixCategory } from "@/data/mix-categories";
import { type MixSound, getSoundById } from "@/data/sounds";
import { useColors } from "@/hooks/useColors";
import { GRADIENT_PRESETS, DEFAULT_BG_PRESET_ID, MIXER_BG_KEY } from "@/config/immersive-presets";

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

/** Mismo degradé que el fondo de la pantalla de Inicio. */
const HOME_GRADIENT = ["#4A0C0C", "#27070E", "#1B060F"] as const;


/** Devuelve true si el primer color del gradiente es claro (luminancia media > 100). */
function isLightGradient(g: readonly [string, string, string]): boolean {
  const hex = g[0].replace("#", "");
  if (hex.length !== 6) return false;
  const r = parseInt(hex.slice(0, 2), 16);
  const gr = parseInt(hex.slice(2, 4), 16);
  const b = parseInt(hex.slice(4, 6), 16);
  return (r + gr + b) / 3 > 100;
}

/** Flotante Zen — paleta para el sheet del mezclador. */
const WARM = {
  bg: "#4A0C0C",
  handle: "rgba(74,12,12,0.08)",
  trackBg: "#27070E",
  trackBorder: "rgba(61,14,22,0.40)",
  sliderThumb: "#FFFFFF",
  sliderTrack: "rgba(61,14,22,0.40)",
  addBorder: "transparent",
  addText: "rgba(244,218,213,0.30)",
  separator: "rgba(61,14,22,0.40)",
  playBg: "transparent",
  playBorder: "transparent",
  playText: "rgba(244,218,213,0.75)",
  saveBg: "transparent",
  saveBorder: "transparent",
  saveText: "rgba(212,175,55,0.80)",
  caption: "rgba(242,231,228,0.45)",
} as const;

/** Miniatura cuadrada de la pista: imagen del sonido (fallback degradé negro). */
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
  const isLight = false;

  // ── Fondo personalizable ──────────────────────────────────────────────────
  const [bgPresetId,   setBgPresetId]   = useState<string>(DEFAULT_BG_PRESET_ID);
  const [bgPickerOpen, setBgPickerOpen] = useState(false);
  const bgPickerY = useRef(new Animated.Value(700)).current;
  const bgBreath  = useRef(new Animated.Value(1)).current;

  const activeBgPreset =
    GRADIENT_PRESETS.find((p) => p.id === bgPresetId) ??
    GRADIENT_PRESETS.find((p) => p.id === DEFAULT_BG_PRESET_ID)!;
  const sheetGradient = activeBgPreset.colors;

  // Cargar preset guardado
  useEffect(() => {
    AsyncStorage.getItem(MIXER_BG_KEY)
      .then((id) => { if (id) setBgPresetId(id); })
      .catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Animación de "respiración" del fondo
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(bgBreath, { toValue: 0.78, duration: 5000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(bgBreath, { toValue: 1,    duration: 5000, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openBgPicker = () => {
    bgPickerY.setValue(700);
    setBgPickerOpen(true);
    Animated.spring(bgPickerY, { toValue: 0, tension: 65, friction: 14, useNativeDriver: true }).start();
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
    sliderThumb:    isLight ? "#D4AF37"              : WARM.sliderThumb,
    sliderTrack:    isLight ? "rgba(0,0,0,0.10)"    : WARM.sliderTrack,
    addText:        isLight ? "rgba(0,0,0,0.32)"    : WARM.addText,
    separator:      isLight ? "rgba(0,0,0,0.07)"    : WARM.separator,
    iconColor:      isLight ? "#1A1E2B"             : "#FFFFFF",
    fg:             isLight ? "#1A1E2B"             : colors.foreground,
    muted:          isLight ? "#6B7A96"             : colors.mutedForeground,
    inputBg:        isLight ? "rgba(0,0,0,0.04)"   : "rgba(74,12,12,0.08)",
    footerCircleBg: isLight ? "rgba(0,0,0,0.07)"   : "rgba(74,12,12,0.35)",
    footerLabel:    isLight ? "rgba(0,0,0,0.45)"   : "rgba(244,218,213,0.45)",
  };
  const { isPremium } = usePremium();
  const {
    activeSounds,
    setVolume,
    removeSound,
    moveSound,
    isPlaying,
    togglePlay,
    stopAll,
    presets,
    savePreset,
    updatePreset,
    loadedPresetId,
    sleepTimerRemaining,
    setSleepTimer,
    isSheetOpen,
    closeSheet,
  } = useMixer();

  // Preset del que partió esta edición (sobrevive a cambios de pistas, que
  // resetean loadedPresetId). Permite "Actualizar" aunque se agreguen/quiten
  // sonidos durante la edición.
  const [originId, setOriginId] = useState<string | null>(null);

  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [saveMode, setSaveMode] = useState<SaveMode>("new");
  const [presetName, setPresetName] = useState("");
  const [mixDescription, setMixDescription] = useState("");
  const [mixImage, setMixImage] = useState<string>(DEFAULT_MIX_IMAGE_KEY);
  const [mixCategory, setMixCategory] = useState<MixCategory>("dormir");

  const { notifySaved } = useSaveEvent();

  // Valores animados: entrada (slideIn) + fade al guardar
  const sheetOpacity = useRef(new Animated.Value(1)).current;
  const sheetEnterY  = useRef(new Animated.Value(400)).current;
  const saveOverlayOpacity = useRef(new Animated.Value(0)).current;

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
          closeSheet();
        } else {
          Animated.spring(sheetEnterY, {
            toValue: 0,
            tension: 65,
            friction: 14,
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
  useEffect(() => {
    if (isSheetOpen) {
      sheetOpacity.setValue(1);
      sheetEnterY.setValue(400);
      Animated.spring(sheetEnterY, {
        toValue: 0,
        tension: 65,
        friction: 14,
        useNativeDriver: true,
      }).start();
      setOriginId(loadedPresetId);
      setSnapshotSounds(activeSounds.map((s) => ({ id: s.id, volume: s.volume })));
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
    closeSheet();
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
      setSaveModalOpen(false);
      Alert.alert("Mezcla actualizada", "Se guardaron los cambios en tu mezcla.");
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
    savePreset({
      name: presetName,
      description: mixDescription,
      image: mixImage,
      category: mixCategory,
    });
    notifySaved();
    setForceShowModal(true);
    sheetEnterY.stopAnimation();
    sheetEnterY.setValue(0);
    // stopAll() arranca AL INICIO del fade (no en el callback): así el audio se
    // desvanece (fade-out interno) y las cards de "Mi Música" se deseleccionan
    // —giro/escala de vuelta— ACOMPAÑANDO el fade de la hoja, sin demora ni corte
    // de golpe. El trabajo pesado (pause/remove de players) ya está diferido
    // dentro de stopAll, así que esto no traba el hilo a mitad de la animación.
    stopAll();
    // Fade único de todo el contenedor (reproductor + popup + dim como una sola
    // unidad). Easing.out en vez de lineal: la opacidad baja rápido al inicio
    // para compensar la percepción gamma (a opacidad 0.5 el ojo aún ve ~73% de
    // brillo, por eso un fade lineal parece detenerse al 50%).
    Animated.timing(sheetOpacity, {
      toValue: 0,
      duration: 360,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start(() => {
      setForceShowModal(false);
      setSaveModalOpen(false);
      saveOverlayOpacity.setValue(0);
      closeSheet();
    });
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

  const canShow = isSheetOpen && activeMix.length > 0;
  const canUpdate = originId != null && originPreset != null;

  // Mantiene el Modal visible durante el fade de cierre aunque canShow
  // cambie a false (por stopAll). Se libera al terminar la animación.
  const [forceShowModal, setForceShowModal] = useState(false);
  const modalVisible = canShow || forceShowModal;

  return (
    <Modal
      visible={modalVisible}
      transparent
      animationType="none"
      onRequestClose={closeSheet}
    >
      {/* La opacidad envuelve TODA la superficie (backdrop + sheet) para que
          el fade cubra el MixerPanel subyacente sin flashes */}
      <Animated.View style={{ flex: 1, opacity: sheetOpacity }}>
      <Pressable style={styles.backdrop} onPress={closeSheet}>
        <Animated.View
          style={{ transform: [{ translateY: sheetEnterY }] }}
        >
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: sheetGradient[2], paddingBottom: insets.bottom + 16 },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: bgBreath }]} pointerEvents="none">
            <LinearGradient
              colors={[...sheetGradient]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={styles.sheetGradient}
            />
          </Animated.View>
          {/* Handle con PanResponder para arrastrar y cerrar */}
          <View style={styles.handleZone} {...panResponder.panHandlers}>
            <View style={[styles.handle, { backgroundColor: palette.handle }]} />
          </View>

          <View style={styles.headerRow}>
            <Pressable
              onPress={closeSheet}
              hitSlop={10}
              style={styles.headerBtn}
              accessibilityRole="button"
              accessibilityLabel="Cerrar editor de mezcla"
            >
              <Feather name="chevron-down" size={24} color={palette.fg} />
            </Pressable>
            <Text style={[styles.title, { color: palette.fg, flex: 1 }]} numberOfLines={1}>
              {originPreset?.name ?? "Tu mezcla"}
            </Text>
            <Pressable
              onPress={openBgPicker}
              hitSlop={10}
              style={styles.headerBtn}
              accessibilityRole="button"
              accessibilityLabel="Elegir fondo"
            >
              <MaterialCommunityIcons
                name="palette-outline"
                size={22}
                color={bgPresetId !== DEFAULT_BG_PRESET_ID ? "#E9C46A" : palette.fg}
              />
            </Pressable>
            <Pressable
              onPress={handleClear}
              hitSlop={8}
              style={styles.headerBtn}
              accessibilityRole="button"
              accessibilityLabel="Terminar mezcla"
            >
              <Text style={styles.clearPill}>Cerrar</Text>
            </Pressable>
          </View>

          <View style={[styles.headerDivider, { backgroundColor: palette.separator }]} />

          <ScrollView
            style={styles.trackScroll}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {activeMix.map(({ active, sound }, index) => (
              <View
                key={sound.id}
                style={styles.trackRow}
              >
                <TrackThumb sound={sound} />

                <View style={styles.trackInfo}>
                  <Text style={[styles.trackName, { color: palette.fg }]} numberOfLines={1}>
                    {sound.name}
                  </Text>
                  <VolumeSlider
                    value={active.volume}
                    onChange={(v) => setVolume(sound.id, v)}
                    color={palette.sliderThumb}
                    trackColor={palette.sliderTrack}
                  />
                </View>

                <Pressable
                  onPress={() => removeSound(sound.id)}
                  hitSlop={10}
                  style={styles.removeBtn}
                  accessibilityRole="button"
                  accessibilityLabel={`Quitar ${sound.name} de la mezcla`}
                >
                  <Feather name="x" size={16} color={palette.muted} />
                </Pressable>
              </View>
            ))}

            <Pressable
              onPress={handleAddSounds}
              style={styles.addBtn}
            >
              <Feather name="plus" size={18} color={palette.addText} />
              <Text style={[styles.addBtnText, { color: palette.addText }]}>Agregar sonidos</Text>
            </Pressable>
          </ScrollView>

          {/* Separador sonidos / tab */}
          <View style={styles.warmSeparator} />

          {/* Footer: Timer | Play | Guardar + Actualizar */}
          <View style={styles.footerRow}>

            {/* Izquierda: Timer */}
            <Pressable
              onPress={handleTimerPress}
              style={styles.footerSide}
              accessibilityRole="button"
              accessibilityLabel={sleepTimerRemaining != null ? "Temporizador activo" : "Configurar temporizador"}
            >
              <View style={[styles.footerTimerCircle, { backgroundColor: palette.footerCircleBg }]}>
                <MaterialCommunityIcons name="clock" size={24} color={palette.iconColor} />
              </View>
              <Text style={[styles.footerLabel, { color: palette.footerLabel }]}>
                {sleepTimerRemaining != null ? formatTimer(sleepTimerRemaining) : "Timer"}
              </Text>
            </Pressable>

            {/* Centro: Play/Pause sin label */}
            <Pressable
              onPress={togglePlay}
              style={styles.footerCenter}
              accessibilityRole="button"
            >
              <View style={[styles.footerPlayCircle, { backgroundColor: palette.footerCircleBg }]}>
                <MaterialCommunityIcons
                  name={isPlaying ? "pause" : "play"}
                  size={56}
                  color={palette.iconColor}
                />
              </View>
            </Pressable>

            {/* Derecha: Guardar */}
            <View style={styles.footerSide}>
              <Pressable style={styles.footerSaveBtn} onPress={() => openSaveModal("new")}>
                <View style={[styles.footerHeartCircle, { backgroundColor: palette.footerCircleBg }]}>
                  <MaterialCommunityIcons name="heart" size={24} color={palette.iconColor} />
                </View>
                <Text style={[styles.footerLabel, { color: palette.footerLabel }]}>Guardar</Text>
              </Pressable>
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
            style={[styles.modalCard, { backgroundColor: sheetGradient[2] }]}
            onPress={(e) => e.stopPropagation()}
          >
                <LinearGradient
                  colors={sheetGradient}
                  start={{ x: 0.5, y: 0 }}
                  end={{ x: 0.5, y: 1 }}
                  style={StyleSheet.absoluteFill}
                  pointerEvents="none"
                />
                <Text style={[styles.modalTitle, { color: palette.fg }]}>
                  {saveMode === "update" ? "Actualizar mezcla" : "Guardar mezcla"}
                </Text>

                <ScrollView
                  style={styles.modalScroll}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text style={[styles.modalLabel, { color: palette.muted }]}>Título</Text>
                  <TextInput
                    value={presetName}
                    onChangeText={setPresetName}
                    placeholder="Ej: Lluvia para dormir"
                    placeholderTextColor={palette.muted}
                    style={[
                      styles.modalInput,
                      { color: palette.fg, backgroundColor: palette.inputBg },
                    ]}
                    maxLength={40}
                  />

                  <Text style={[styles.modalLabel, { color: palette.muted }]}>Categoría</Text>
                  <View style={styles.catTabRow} accessibilityRole="tablist">
                    {MIX_CATEGORIES.map((cat) => {
                      const selected = mixCategory === cat.id;
                      return (
                        <Pressable
                          key={cat.id}
                          onPress={() => setMixCategory(cat.id)}
                          style={[styles.catTabBlock, selected && styles.catTabBlockSel]}
                          accessibilityRole="tab"
                          accessibilityState={{ selected }}
                        >
                          <Text
                            numberOfLines={1}
                            style={[styles.catTabLabel, { color: "#FFFFFF", fontWeight: selected ? "700" : "400" }]}
                          >
                            {cat.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                </ScrollView>

                <View style={styles.modalActions}>
                  <Pressable onPress={cancelSave} style={styles.modalBtn}>
                    <Text style={[styles.modalBtnText, { color: palette.muted }]}>Cancelar</Text>
                  </Pressable>
                  <Pressable
                    onPress={confirmSave}
                    style={[styles.modalBtn, { backgroundColor: colors.primary }]}
                  >
                    <Text style={[styles.modalBtnText, { color: colors.primaryForeground, fontWeight: "700" }]}>
                      {saveMode === "update" ? "Actualizar" : "Guardar"}
                    </Text>
                  </Pressable>
                </View>
          </Pressable>
        </Animated.View>
      )}
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
            <Text style={styles.bgPickerTitle}>Elige tu fondo</Text>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.bgPickerGrid}
            >
              {GRADIENT_PRESETS.map((preset) => {
                const sel = preset.id === bgPresetId;
                return (
                  <Pressable
                    key={preset.id}
                    onPress={() => selectBgPreset(preset.id)}
                    style={[styles.bgPresetCard, sel && styles.bgPresetCardSel]}
                  >
                    <LinearGradient
                      colors={[...preset.colors]}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={StyleSheet.absoluteFill}
                    />
                    <Text style={styles.bgPresetEmoji}>{preset.emoji}</Text>
                    <Text style={styles.bgPresetName} numberOfLines={1}>{preset.name}</Text>
                    {sel && (
                      <View style={styles.bgPresetCheck}>
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
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    height: Math.round(Dimensions.get("window").height * 0.93),
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
  },
  sheetGradient: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  handleZone: {
    alignSelf: "stretch",
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 16,
  },
  handle: {
    width: 36,
    height: 3,
    borderRadius: 2,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  headerBtn: { paddingHorizontal: 4, justifyContent: "center" },
  caption: { fontSize: 10, letterSpacing: 1.8, textTransform: "uppercase", marginBottom: 4, fontWeight: "400" },
  title: { fontSize: 18, fontWeight: "700", letterSpacing: 0.3 },
  subtitle: { fontSize: 12, marginTop: 2 },
  clearText: { fontSize: 12, fontWeight: "400" },
  clearPill: {
    fontSize: 13,
    fontWeight: "400",
    letterSpacing: 0.3,
    color: "#FFFFFF",
  },

  trackScroll: { flex: 1 },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 0,
    marginBottom: 15,
  },
  warmSeparator: { height: 1, marginTop: 14, marginBottom: 0, marginHorizontal: -20, backgroundColor: "rgba(61,14,22,0.40)" },
  headerDivider: { height: 1, marginTop: 4, marginBottom: 29, marginHorizontal: -2 },
  thumb: { width: 56, height: 56, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "rgba(244,218,213,0.50)" },
  thumbRadius: { borderRadius: 11 },
  trackInfo: { flex: 1, justifyContent: "center" },
  trackName: { fontSize: 15, fontWeight: "700", marginBottom: -3 },
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
  addBtnText: { fontSize: 10, fontWeight: "400", letterSpacing: 2, textTransform: "uppercase" },

  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    marginTop: 18,
    marginBottom: 6,
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
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  footerLabel: {
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
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  footerTimerCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    paddingHorizontal: 32,
  },
  modalCard: {
    width: "100%",
    borderRadius: 18,
    padding: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#161f33",
  },
  modalTitle: { fontSize: 17, fontWeight: "700", marginBottom: 14 },
  modalScroll: { maxHeight: 420 },
  modalLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6, marginTop: 12 },
  modalInput: {
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
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
  catTabLabel: { fontSize: 15, textAlign: "center" },
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
    justifyContent: "flex-end",
    gap: 8,
    marginTop: 16,
  },
  modalBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  modalBtnText: { fontSize: 14, fontWeight: "600" },

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
    backgroundColor: "rgba(244,218,213,0.25)",
    alignSelf: "center",
    marginTop: 10,
    marginBottom: 16,
  },
  bgPickerTitle: {
    color: "#F4DAD5",
    fontSize: 17,
    fontWeight: "700",
    letterSpacing: 0.3,
    marginBottom: 16,
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
    borderColor: "#D4AF37",
  },
  bgPresetEmoji: {
    fontSize: 20,
    marginBottom: 2,
  },
  bgPresetName: {
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
    backgroundColor: "#D4AF37",
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
    color: "#D4AF37",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
});
