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
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  Alert,
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

import { SaveMixCelebration } from "@/components/SaveMixCelebration";
import { VolumeSlider } from "@/components/VolumeSlider";
import { DEFAULT_MIX_IMAGE_KEY, MIX_IMAGE_GALLERY, getMixImage } from "@/config/mix-images";
import { getSoundImage } from "@/config/sound-images";
import { MAX_ACTIVE_SOUNDS, useMixer } from "@/context/MixerContext";
import { usePremium } from "@/context/PremiumContext";
import { MIX_CATEGORIES, type MixCategory, getCategoryMeta } from "@/data/mix-categories";
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
const DARK_GRADIENT = ["#1C150F", "#080503"] as const;

/** Miniatura circular de la pista: imagen del sonido (fallback degradé negro). */
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

  const [celebration, setCelebration] = useState<{
    category: MixCategory;
    image: string;
  } | null>(null);

  // Al abrir la hoja, recordamos de qué preset partió (si aplica).
  useEffect(() => {
    if (isSheetOpen) setOriginId(loadedPresetId);
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

  const handleAddSounds = () => {
    closeSheet();
    router.push("/(tabs)/musica" as never);
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
    setCelebration({ category: mixCategory, image: mixImage });
  };

  const handleCelebrationDone = () => {
    setCelebration(null);
    closeSheet();
    stopAll();
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

  return (
    <Modal
      visible={canShow}
      transparent
      animationType="slide"
      onRequestClose={closeSheet}
    >
      <Pressable style={styles.backdrop} onPress={closeSheet}>
        <Pressable
          style={[
            styles.sheet,
            { backgroundColor: DARK_GRADIENT[1], paddingBottom: insets.bottom + 16 },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <LinearGradient
            colors={DARK_GRADIENT}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.sheetGradient}
            pointerEvents="none"
          />
          <View style={[styles.handle, { backgroundColor: colors.border }]} />

          <View style={styles.headerRow}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.foreground }]} numberOfLines={1}>
                {originPreset?.name ?? "Tu mezcla"}
              </Text>
              <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
                {activeMix.length}/{MAX_ACTIVE_SOUNDS} sonidos
              </Text>
            </View>
            <Pressable
              onPress={handleClear}
              hitSlop={8}
              style={styles.headerBtn}
              accessibilityRole="button"
              accessibilityLabel="Eliminar mezcla"
            >
              <Text style={[styles.clearText, { color: colors.mutedForeground }]}>Eliminar</Text>
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
                style={[styles.trackRow, { backgroundColor: colors.background, borderColor: colors.border }]}
              >
                <View style={styles.trackTop}>
                  <TrackThumb sound={sound} />

                  <View style={styles.trackInfo}>
                    <Text style={[styles.trackName, { color: colors.foreground }]} numberOfLines={1}>
                      {sound.name}
                    </Text>
                  </View>

                  <View style={[styles.reorderPill, { borderColor: colors.border }]}>
                    <Pressable
                      onPress={() => moveSound(sound.id, "up")}
                      disabled={index === 0}
                      hitSlop={8}
                      style={styles.reorderBtn}
                      accessibilityRole="button"
                      accessibilityLabel={`Subir ${sound.name}`}
                      accessibilityState={{ disabled: index === 0 }}
                    >
                      <Feather
                        name="chevron-up"
                        size={15}
                        color={index === 0 ? colors.border : colors.mutedForeground}
                      />
                    </Pressable>
                    <View style={[styles.reorderDivider, { backgroundColor: colors.border }]} />
                    <Pressable
                      onPress={() => moveSound(sound.id, "down")}
                      disabled={index === activeMix.length - 1}
                      hitSlop={8}
                      style={styles.reorderBtn}
                      accessibilityRole="button"
                      accessibilityLabel={`Bajar ${sound.name}`}
                      accessibilityState={{ disabled: index === activeMix.length - 1 }}
                    >
                      <Feather
                        name="chevron-down"
                        size={15}
                        color={index === activeMix.length - 1 ? colors.border : colors.mutedForeground}
                      />
                    </Pressable>
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
                <VolumeSlider
                  value={active.volume}
                  onChange={(v) => setVolume(sound.id, v)}
                  color={colors.accent}
                  trackColor={colors.secondary}
                />
              </View>
            ))}

            <Pressable
              onPress={handleAddSounds}
              style={[styles.addBtn, { borderColor: colors.border }]}
            >
              <Feather name="plus" size={18} color={colors.primary} />
              <Text style={[styles.addBtnText, { color: colors.primary }]}>Agregar sonidos</Text>
            </Pressable>
          </ScrollView>

          {/* Controles */}
          <View style={styles.controlsRow}>
            <Pressable onPress={togglePlay} style={[styles.playBtn, { backgroundColor: colors.primary }]}>
              <Feather name={isPlaying ? "pause" : "play"} size={20} color={colors.primaryForeground} />
              <Text style={[styles.playBtnText, { color: colors.primaryForeground }]}>
                {isPlaying ? "Pausar" : "Reproducir"}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleTimerPress}
              style={[styles.iconBtn, { borderColor: colors.border, backgroundColor: TRANSLUCENT_SURFACE }]}
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
                color={sleepTimerRemaining != null ? colors.accent : colors.foreground}
              />
              {sleepTimerRemaining != null && (
                <Text style={[styles.timerText, { color: colors.accent }]}>
                  {formatTimer(sleepTimerRemaining)}
                </Text>
              )}
            </Pressable>
          </View>

          {/* Guardar / Actualizar */}
          <View style={styles.saveRow}>
            {canUpdate ? (
              <>
                <Pressable
                  onPress={() => openSaveModal("update")}
                  style={[styles.saveBtn, { backgroundColor: TRANSLUCENT_SURFACE, borderColor: colors.border }]}
                >
                  <Feather name="check" size={16} color={colors.foreground} />
                  <Text style={[styles.saveBtnText, { color: colors.foreground }]}>Actualizar</Text>
                </Pressable>
                <Pressable
                  onPress={() => openSaveModal("new")}
                  style={[styles.saveBtn, { backgroundColor: TRANSLUCENT_SURFACE, borderColor: colors.border }]}
                >
                  <Feather name="save" size={16} color={colors.foreground} />
                  <Text style={[styles.saveBtnText, { color: colors.foreground }]}>Guardar nueva</Text>
                </Pressable>
              </>
            ) : (
              <Pressable
                onPress={() => openSaveModal("new")}
                style={[styles.saveBtn, styles.saveBtnFull, { backgroundColor: TRANSLUCENT_SURFACE, borderColor: colors.border }]}
              >
                <Feather name="save" size={16} color={colors.foreground} />
                <Text style={[styles.saveBtnText, { color: colors.foreground }]}>Guardar mezcla</Text>
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
                style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}
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
                      { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.secondary },
                    ]}
                    maxLength={40}
                  />

                  <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>Descripción</Text>
                  <TextInput
                    value={mixDescription}
                    onChangeText={setMixDescription}
                    placeholder="Opcional: ¿para qué momento es?"
                    placeholderTextColor={colors.mutedForeground}
                    style={[
                      styles.modalInput,
                      styles.modalInputArea,
                      { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.secondary },
                    ]}
                    multiline
                    maxLength={120}
                  />

                  <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>Categoría</Text>
                  <View style={styles.catChips}>
                    {MIX_CATEGORIES.map((cat) => {
                      const selected = mixCategory === cat.id;
                      return (
                        <Pressable
                          key={cat.id}
                          onPress={() => setMixCategory(cat.id)}
                          style={[
                            styles.catChip,
                            {
                              backgroundColor: selected ? colors.primary : colors.secondary,
                              borderColor: selected ? colors.primary : colors.border,
                            },
                          ]}
                        >
                          <Text
                            style={[
                              styles.catChipText,
                              { color: selected ? colors.primaryForeground : colors.foreground },
                            ]}
                          >
                            {cat.label}
                          </Text>
                        </Pressable>
                      );
                    })}
                  </View>

                  <Text style={[styles.modalLabel, { color: colors.mutedForeground }]}>Imagen</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.imgGallery}
                  >
                    {MIX_IMAGE_GALLERY.map((key) => {
                      const selected = mixImage === key;
                      return (
                        <Pressable key={key} onPress={() => setMixImage(key)} style={styles.imgThumbWrap}>
                          <ImageBackground
                            source={getMixImage(key)}
                            style={styles.imgThumb}
                            imageStyle={[
                              styles.imgThumbInner,
                              { borderColor: selected ? colors.primary : "transparent" },
                            ]}
                          >
                            {selected && (
                              <View style={[styles.imgCheck, { backgroundColor: colors.primary }]}>
                                <Feather name="check" size={12} color={colors.primaryForeground} />
                              </View>
                            )}
                          </ImageBackground>
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

          {/* Animación de confirmación al guardar (solo mezclas nuevas) */}
          <SaveMixCelebration
            visible={celebration != null}
            category={celebration ? getCategoryMeta(celebration.category) : undefined}
            imageKey={celebration?.image}
            onDone={handleCelebrationDone}
          />
        </Pressable>
      </Pressable>
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
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  headerBtn: { paddingHorizontal: 4, justifyContent: "center" },
  title: { fontSize: 18, fontWeight: "700", letterSpacing: 0.3 },
  subtitle: { fontSize: 12, marginTop: 2 },
  clearText: { fontSize: 12, fontWeight: "600" },

  trackScroll: { flexGrow: 0 },
  trackRow: {
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 12,
    paddingTop: 11,
    paddingBottom: 4,
    marginBottom: 10,
  },
  trackTop: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
  },
  thumb: { width: 40, height: 40, borderRadius: 20, overflow: "hidden" },
  thumbRadius: { borderRadius: 20 },
  trackInfo: { flex: 1 },
  trackName: { fontSize: 15, fontWeight: "600" },
  reorderPill: {
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
    borderWidth: 1,
    borderStyle: "dashed",
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
  catChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
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
