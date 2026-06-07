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
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
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
const DARK_GRADIENT = ["#151A23", "#0B0F14"] as const;

/** Mismo degradé que el fondo de la pantalla de Inicio. */
const HOME_GRADIENT = ["#090D20", "#080A18", "#06070F"] as const;

/** Flotante Zen — paleta para el sheet del mezclador. */
const WARM = {
  bg: "#0B0F14",
  handle: "rgba(255,255,255,0.12)",
  trackBg: "#151A23",
  trackBorder: "rgba(255,255,255,0.07)",
  sliderThumb: "#FFFFFF",
  sliderTrack: "rgba(255,255,255,0.10)",
  addBorder: "transparent",
  addText: "rgba(255,255,255,0.30)",
  separator: "rgba(255,255,255,0.06)",
  playBg: "transparent",
  playBorder: "transparent",
  playText: "rgba(255,255,255,0.75)",
  saveBg: "transparent",
  saveBorder: "transparent",
  saveText: "rgba(190,150,80,0.80)",
  caption: "rgba(122,143,168,0.7)",
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
            { backgroundColor: HOME_GRADIENT[2], paddingBottom: insets.bottom + 16 },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <LinearGradient
            colors={HOME_GRADIENT}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
            style={styles.sheetGradient}
            pointerEvents="none"
          />
          {/* Handle con PanResponder para arrastrar y cerrar */}
          <View style={styles.handleZone} {...panResponder.panHandlers}>
            <View style={[styles.handle, { backgroundColor: WARM.handle }]} />
          </View>

          <View style={styles.headerRow}>
            <Pressable
              onPress={closeSheet}
              hitSlop={10}
              style={styles.headerBtn}
              accessibilityRole="button"
              accessibilityLabel="Cerrar editor de mezcla"
            >
              <Feather name="chevron-down" size={24} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.title, { color: colors.foreground, flex: 1 }]} numberOfLines={1}>
              {originPreset?.name ?? "Tu mezcla"}
            </Text>
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
                  <Text style={[styles.trackName, { color: colors.foreground }]} numberOfLines={1}>
                    {sound.name}
                  </Text>
                  <VolumeSlider
                    value={active.volume}
                    onChange={(v) => setVolume(sound.id, v)}
                    color={WARM.sliderThumb}
                    trackColor={WARM.sliderTrack}
                  />
                </View>

                <Pressable
                  onPress={() => removeSound(sound.id)}
                  hitSlop={10}
                  style={styles.removeBtn}
                  accessibilityRole="button"
                  accessibilityLabel={`Quitar ${sound.name} de la mezcla`}
                >
                  <Feather name="x" size={16} color={colors.mutedForeground} />
                </Pressable>
              </View>
            ))}

            <Pressable
              onPress={handleAddSounds}
              style={styles.addBtn}
            >
              <Feather name="plus" size={18} color={WARM.addText} />
              <Text style={[styles.addBtnText, { color: WARM.addText }]}>Agregar sonidos</Text>
            </Pressable>
          </ScrollView>

          {/* Separador warm */}
          <View style={[styles.warmSeparator, { backgroundColor: WARM.separator }]} />

          {/* Controles — Flotante Zen */}
          <View style={styles.controlsRow}>
            <Pressable
              onPress={togglePlay}
              style={styles.zenCtrlBtn}
              accessibilityRole="button"
            >
              <Feather name={isPlaying ? "pause" : "play"} size={36} color={WARM.playText} strokeWidth={1} />
              <Text style={styles.zenCtrlLabel}>
                {isPlaying ? "PAUSAR" : "REPRODUCIR"}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleTimerPress}
              style={styles.zenCtrlBtn}
              accessibilityRole="button"
              accessibilityLabel={
                sleepTimerRemaining != null
                  ? "Temporizador de sueño activo"
                  : "Configurar temporizador de sueño"
              }
            >
              <Feather name="clock" size={36} color={WARM.playText} strokeWidth={1} />
              <Text style={styles.zenCtrlLabel}>
                {sleepTimerRemaining != null ? formatTimer(sleepTimerRemaining) : "TIMER"}
              </Text>
            </Pressable>
          </View>

          {/* Guardar / Actualizar — Flotante Zen */}
          <View style={styles.saveRow}>
            {true ? (
              <>
                <Pressable
                  onPress={() => canUpdate ? handleUpdateDirect() : (mixHasChanged && openSaveModal("new"))}
                  style={[styles.zenSaveBtn, { opacity: mixHasChanged ? 1 : 0.35 }]}
                >
                  <Feather name="check" size={14} color={WARM.saveText} />
                  <Text style={[styles.zenSaveBtnText, { color: WARM.saveText }]}>ACTUALIZAR</Text>
                </Pressable>
                <Pressable
                  onPress={() => openSaveModal("new")}
                  style={styles.zenSaveBtn}
                >
                  <MaterialCommunityIcons name="heart-outline" size={14} color={WARM.saveText} />
                  <Text style={[styles.zenSaveBtnText, { color: WARM.saveText }]}>GUARDAR NUEVA</Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                onPress={() => openSaveModal("new")}
                style={styles.zenSaveBtn}
              >
                <Feather name="save" size={14} color={WARM.saveText} />
                <Text style={[styles.zenSaveBtnText, { color: WARM.saveText }]}>GUARDAR MEZCLA</Text>
              </Pressable>
            )}
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
            style={[styles.modalCard, { backgroundColor: colors.background, borderColor: "rgba(182,149,95,0.25)" }]}
            onPress={(e) => e.stopPropagation()}
          >
                <Text style={[styles.modalTitle, { color: colors.foreground }]}>
                  {saveMode === "update" ? "Actualizar mezcla" : "Guardar mezcla"}
                </Text>

                <ScrollView
                  style={styles.modalScroll}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                >
                  <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>Título</Text>
                  <TextInput
                    value={presetName}
                    onChangeText={setPresetName}
                    placeholder="Ej: Lluvia para dormir"
                    placeholderTextColor={colors.mutedForeground}
                    style={[
                      styles.modalInput,
                      { color: colors.foreground, borderColor: "rgba(182,149,95,0.2)", backgroundColor: colors.card },
                    ]}
                    maxLength={40}
                  />

                  <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>Categoría</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.catChips}
                  >
                    {MIX_CATEGORIES.map((cat) => {
                      const selected = mixCategory === cat.id;
                      return (
                        <Pressable
                          key={cat.id}
                          onPress={() => setMixCategory(cat.id)}
                          style={[
                            styles.catChip,
                            {
                              backgroundColor: "#151A23",
                              borderColor: selected
                                ? "rgba(100,185,220,0.45)"
                                : "transparent",
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.catChipText,
                              {
                                color: selected
                                  ? "#FFFFFF"
                                  : colors.mutedForeground,
                              },
                            ]}
                          >
                            {cat.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </ScrollView>

                </ScrollView>

                <View style={styles.modalActions}>
                  <Pressable onPress={cancelSave} style={styles.modalBtn}>
                    <Text style={[styles.modalBtnText, { color: colors.mutedForeground }]}>Cancelar</Text>
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
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    height: "93%",
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
    paddingVertical: 14,
    marginBottom: 10,
  },
  warmSeparator: { height: 1, marginTop: 14, marginBottom: 0, marginHorizontal: -2 },
  thumb: { width: 56, height: 56, borderRadius: 12, overflow: "hidden", borderWidth: 1, borderColor: "#FFFFFF" },
  thumbRadius: { borderRadius: 11 },
  trackInfo: { flex: 1, justifyContent: "center" },
  trackName: { fontSize: 15, fontWeight: "700", marginBottom: 4 },
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

  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 56,
    marginTop: 20,
    marginBottom: 4,
  },
  zenCtrlBtn: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 8,
  },
  zenCtrlLabel: {
    fontSize: 10,
    fontWeight: "400",
    letterSpacing: 2,
    color: "rgba(255,255,255,0.45)",
  },
  // kept for TS compat — no longer rendered
  playBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 50, borderRadius: 14 },
  playBtnText: { fontSize: 15, fontWeight: "700" },
  iconBtn: { height: 50, minWidth: 50, paddingHorizontal: 12, borderRadius: 14, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6 },
  timerText: { fontSize: 12, fontWeight: "700" },

  saveRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    marginTop: 14,
    marginBottom: 2,
  },
  zenSaveBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  zenSaveBtnText: {
    fontSize: 10,
    fontWeight: "400",
    letterSpacing: 2,
  },
  // kept for TS compat — no longer rendered
  saveBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, height: 46, borderRadius: 14 },
  saveBtnFull: { flex: 1 },
  saveBtnText: { fontSize: 14, fontWeight: "600" },

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
    borderWidth: 1,
    padding: 20,
  },
  modalTitle: { fontSize: 17, fontWeight: "700", marginBottom: 14 },
  modalScroll: { maxHeight: 420 },
  modalLabel: { fontSize: 12, fontWeight: "600", marginBottom: 6, marginTop: 12 },
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  modalInputArea: { minHeight: 64, textAlignVertical: "top" },
  catChips: { flexDirection: "row", gap: 8, paddingVertical: 2, paddingRight: 32 },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  catChipText: { fontSize: 12.5, fontWeight: "600" },
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
});
