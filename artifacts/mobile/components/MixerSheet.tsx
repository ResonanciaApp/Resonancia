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
const DARK_GRADIENT = ["#0C1828", "#090F17"] as const;

/** Minimal Frost — paleta para el sheet del mezclador. */
const WARM = {
  bg: "#090F17",
  handle: "rgba(255,255,255,0.12)",
  trackBg: "#151A23",
  trackBorder: "rgba(255,255,255,0.07)",
  sliderThumb: "#BE9650",
  sliderTrack: "rgba(190,150,80,0.55)",
  addBorder: "rgba(255,255,255,0.1)",
  addText: "rgba(190,150,80,0.65)",
  separator: "rgba(255,255,255,0.06)",
  playBg: "transparent",
  playBorder: "rgba(255,255,255,0.12)",
  playText: "#FFFFFF",
  saveBg: "transparent",
  saveBorder: "rgba(255,255,255,0.1)",
  saveText: "#FFFFFF",
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
    setSaveModalOpen(true);
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
    setSaveModalOpen(false);
    notifySaved();
    setForceShowModal(true);
    stopAll();
    sheetEnterY.stopAnimation();
    sheetEnterY.setValue(0);
    // El sheet desvanece a la par del modal interno (animationType="fade" ~300ms):
    // mismo arranque (sin delay) y misma velocidad (~350ms, lineal) para que popup
    // y reproductor se disuelvan juntos. El popup, semitransparente durante su fade,
    // deja ver el reproductor desvaneciéndose detrás → transición sincronizada.
    Animated.timing(sheetOpacity, {
      toValue: 0,
      duration: 350,
      easing: Easing.linear,
      useNativeDriver: true,
    }).start(() => {
      setForceShowModal(false);
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
          style={{
            transform: [{ translateY: sheetEnterY }],
          }}
        >
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: WARM.bg, paddingBottom: insets.bottom + 16 },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <View style={[styles.handle, { backgroundColor: WARM.handle }]} />

          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
                {originPreset?.name ?? "Tu mezcla"}
              </Text>
            </View>
            <Pressable
              onPress={handleClear}
              hitSlop={8}
              style={styles.headerBtn}
              accessibilityRole="button"
              accessibilityLabel="Terminar mezcla"
            >
              <Text style={styles.clearPill}>Cerrar</Text>
            </Pressable>
            <Pressable
              onPress={closeSheet}
              hitSlop={8}
              style={styles.headerBtn}
              accessibilityRole="button"
              accessibilityLabel="Cerrar editor de mezcla"
            >
              <Feather name="chevron-down" size={22} color={colors.foreground} />
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
                style={[styles.trackRow, { backgroundColor: WARM.trackBg }]}
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

          {/* Controles */}
          <View style={styles.controlsRow}>
            <Pressable
              onPress={togglePlay}
              style={[styles.playBtn, { backgroundColor: WARM.playBg, borderWidth: 1, borderColor: WARM.playBorder }]}
            >
              <Feather name={isPlaying ? "pause" : "play"} size={20} color={WARM.playText} />
              <Text style={[styles.playBtnText, { color: WARM.playText }]}>
                {isPlaying ? "Pausar" : "Reproducir"}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleTimerPress}
              style={[styles.iconBtn, { borderColor: WARM.playBorder, backgroundColor: WARM.saveBg }]}
              accessibilityRole="button"
              accessibilityLabel={
                sleepTimerRemaining != null
                  ? "Temporizador de sueño activo"
                  : "Configurar temporizador de sueño"
              }
            >
              <Feather
                name="clock"
                size={18}
                color={WARM.playText}
              />
              {sleepTimerRemaining != null && (
                <Text style={[styles.timerText, { color: WARM.playText }]}>
                  {formatTimer(sleepTimerRemaining)}
                </Text>
              )}
            </Pressable>
          </View>

          {/* Guardar / Actualizar */}
          <View style={styles.saveRow}>
            {true ? (
              <>
                <Pressable
                  onPress={() => canUpdate ? handleUpdateDirect() : (mixHasChanged && openSaveModal("new"))}
                  style={[styles.saveBtn, { backgroundColor: WARM.saveBg, borderColor: WARM.saveBorder, opacity: mixHasChanged ? 1 : 0.4 }]}
                >
                  <Feather name="check" size={16} color={WARM.saveText} />
                  <Text style={[styles.saveBtnText, { color: WARM.saveText }]}>Actualizar</Text>
                </Pressable>
                <Pressable
                  onPress={() => openSaveModal("new")}
                  style={[styles.saveBtn, { backgroundColor: WARM.saveBg, borderColor: WARM.saveBorder }]}
                >
                  <MaterialCommunityIcons name="heart" size={16} color="#FFFFFF" />
                  <Text style={[styles.saveBtnText, { color: WARM.saveText }]}>Guardar nueva</Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                onPress={() => openSaveModal("new")}
                style={[styles.saveBtn, styles.saveBtnFull, { backgroundColor: WARM.saveBg, borderColor: WARM.saveBorder }]}
              >
                <Feather name="save" size={16} color={WARM.saveText} />
                <Text style={[styles.saveBtnText, { color: WARM.saveText }]}>Guardar mezcla</Text>
              </Pressable>
            )}
          </View>

          {/* Modal: guardar / actualizar */}
          <Modal
            visible={saveModalOpen}
            transparent
            animationType="fade"
            onRequestClose={() => setSaveModalOpen(false)}
          >
            <Pressable style={styles.modalOverlay} onPress={() => setSaveModalOpen(false)}>
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
                  <Pressable onPress={() => setSaveModalOpen(false)} style={styles.modalBtn}>
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
            </Pressable>
          </Modal>

        </Pressable>
        </Animated.View>
      </Pressable>
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: "85%",
  },
  sheetGradient: {
    ...StyleSheet.absoluteFillObject,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 3,
    borderRadius: 2,
    marginBottom: 18,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 16,
  },
  headerBtn: { paddingHorizontal: 4, justifyContent: "center" },
  caption: { fontSize: 10, letterSpacing: 1.8, textTransform: "uppercase", marginBottom: 4, fontWeight: "400" },
  title: { fontSize: 18, fontWeight: "600", letterSpacing: 0.3 },
  subtitle: { fontSize: 12, marginTop: 2 },
  clearText: { fontSize: 12, fontWeight: "400" },
  clearPill: {
    fontSize: 13,
    fontWeight: "400",
    letterSpacing: 0.3,
    color: "#FFFFFF",
  },

  trackScroll: { flexGrow: 0 },
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
  thumb: { width: 44, height: 44, borderRadius: 10, overflow: "hidden" },
  thumbRadius: { borderRadius: 10 },
  trackInfo: { flex: 1 },
  trackName: { fontSize: 15, fontWeight: "300", marginBottom: 4 },
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
    gap: 8,
    height: 46,
    borderRadius: 14,
    marginTop: 14,
  },
  addBtnText: { fontSize: 14, fontWeight: "600" },

  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginTop: 16,
  },
  playBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 50,
    borderRadius: 14,
  },
  playBtnText: { fontSize: 15, fontWeight: "700" },
  iconBtn: {
    height: 50,
    minWidth: 50,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  timerText: { fontSize: 12, fontWeight: "700" },

  saveRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },
  saveBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    height: 46,
    borderRadius: 14,
    borderWidth: 1,
  },
  saveBtnFull: { flex: 1 },
  saveBtnText: { fontSize: 14, fontWeight: "600" },

  // Modal guardar
  modalOverlay: {
    flex: 1,
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
