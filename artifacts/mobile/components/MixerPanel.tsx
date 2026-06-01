/**
 * MixerPanel — la "mezcla activa" + sus controles + el modal de guardado.
 * ─────────────────────────────────────────────────────────────────
 * Componente compartido entre "Mi Música" y la biblioteca por categoría
 * (app/mezclas/[category].tsx), para que el mezclador aparezca en el
 * mismo lugar donde el usuario abre una mezcla.
 *
 * Si no hay sonidos activos, no renderiza nada.
 * ─────────────────────────────────────────────────────────────────
 */
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
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

import { SaveMixCelebration } from "@/components/SaveMixCelebration";
import { VolumeSlider } from "@/components/VolumeSlider";
import { DEFAULT_MIX_IMAGE_KEY, MIX_IMAGE_GALLERY, getMixImage } from "@/config/mix-images";
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

type Props = {
  /** Categoría actual (si se usa dentro de una pantalla de categoría). */
  currentCategory?: MixCategory;
};

export function MixerPanel({ currentCategory }: Props) {
  const colors = useColors();
  const { isPremium } = usePremium();
  const {
    activeSounds,
    setVolume,
    removeSound,
    isPlaying,
    togglePlay,
    stopAll,
    presets,
    savePreset,
    loadedPresetId,
    sleepTimerRemaining,
    setSleepTimer,
  } = useMixer();

  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [mixDescription, setMixDescription] = useState("");
  const [mixImage, setMixImage] = useState<string>(DEFAULT_MIX_IMAGE_KEY);
  const [mixCategory, setMixCategory] = useState<MixCategory>(currentCategory ?? "dormir");

  // Animación de confirmación al guardar
  const [celebration, setCelebration] = useState<{
    category: MixCategory;
    image: string;
  } | null>(null);

  const activeMix = useMemo(
    () =>
      activeSounds
        .map((a) => ({ active: a, sound: getSoundById(a.id) }))
        .filter((x): x is { active: typeof x.active; sound: MixSound } => !!x.sound),
    [activeSounds],
  );

  const loadedPreset = useMemo(
    () => (loadedPresetId ? presets.find((p) => p.id === loadedPresetId) : undefined),
    [loadedPresetId, presets],
  );

  const handleSavePress = () => {
    if (activeSounds.length === 0) return;
    setPresetName("");
    setMixDescription("");
    setMixImage(DEFAULT_MIX_IMAGE_KEY);
    setMixCategory(currentCategory ?? "dormir");
    setSaveModalOpen(true);
  };

  const confirmSave = () => {
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
    setPresetName("");
    setMixDescription("");
    // Disparamos la animación de confirmación; el cierre real ocurre en onDone.
    setCelebration({ category: mixCategory, image: mixImage });
  };

  const handleCelebrationDone = () => {
    setCelebration(null);
    // El mezclador se cierra (se limpia la mezcla activa) tras guardar.
    // El usuario permanece en la pantalla de Mi Música (no se navega a la categoría).
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

  if (activeMix.length === 0) return null;

  return (
    <>
      <View style={[styles.mixCard, { backgroundColor: "rgba(120,120,120,0.18)", borderColor: colors.border }]}>
        <View style={styles.mixHeader}>
          <Text style={[styles.mixTitle, { color: colors.foreground }]} numberOfLines={1}>
            {loadedPreset?.name ?? "Tu mezcla"} · {activeMix.length}/{MAX_ACTIVE_SOUNDS}
          </Text>
          <Pressable onPress={stopAll} hitSlop={8}>
            <Text style={[styles.clearText, { color: colors.mutedForeground }]}>Limpiar</Text>
          </Pressable>
        </View>

        {activeMix.map(({ active, sound }) => (
          <View key={sound.id} style={styles.sliderRow}>
            <View style={styles.sliderTop}>
              <View style={styles.sliderLabelWrap}>
                <Text style={[styles.sliderLabel, { color: colors.foreground }]}>{sound.name}</Text>
              </View>
              <View style={styles.sliderRight}>
                <Text style={[styles.sliderPercent, { color: colors.accent }]}>
                  {Math.round(active.volume * 100)}%
                </Text>
                <Pressable onPress={() => removeSound(sound.id)} hitSlop={8}>
                  <Feather name="x" size={16} color={colors.mutedForeground} />
                </Pressable>
              </View>
            </View>
            <VolumeSlider
              value={active.volume}
              onChange={(v) => setVolume(sound.id, v)}
              color={colors.accent}
              trackColor={colors.secondary}
            />
          </View>
        ))}

        {/* Controles de la mezcla */}
        <View style={styles.controlsRow}>
          <Pressable onPress={togglePlay} style={[styles.playBtn, { backgroundColor: colors.primary }]}>
            <Feather name={isPlaying ? "pause" : "play"} size={20} color={colors.primaryForeground} />
            <Text style={[styles.playBtnText, { color: colors.primaryForeground }]}>
              {isPlaying ? "Pausar" : "Reproducir"}
            </Text>
          </Pressable>

          <Pressable
            onPress={handleTimerPress}
            style={[styles.iconBtn, { borderColor: colors.border, backgroundColor: colors.secondary }]}
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

          {loadedPresetId == null && (
            <Pressable
              onPress={handleSavePress}
              style={[styles.iconBtn, { borderColor: colors.border, backgroundColor: colors.secondary }]}
            >
              <Feather name="save" size={18} color={colors.foreground} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Modal: guardar mezcla */}
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
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Guardar mezcla</Text>

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
                style={[styles.modalBtn, styles.modalBtnPrimary, { backgroundColor: colors.primary }]}
              >
                <Text style={[styles.modalBtnText, { color: colors.primaryForeground, fontWeight: "700" }]}>
                  Guardar
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Animación de confirmación al guardar */}
      <SaveMixCelebration
        visible={celebration != null}
        category={celebration ? getCategoryMeta(celebration.category) : undefined}
        imageKey={celebration?.image}
        onDone={handleCelebrationDone}
      />
    </>
  );
}

const styles = StyleSheet.create({
  // Mezcla activa
  mixCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 24,
  },
  mixHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  mixTitle: { fontSize: 14, fontWeight: "700", letterSpacing: 0.3, flexShrink: 1, marginRight: 8 },
  clearText: { fontSize: 12, fontWeight: "600" },
  sliderRow: { marginTop: 8 },
  sliderTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  sliderLabelWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  sliderLabel: { fontSize: 14, fontWeight: "500" },
  sliderRight: { flexDirection: "row", alignItems: "center", gap: 12 },
  sliderPercent: { fontSize: 12, fontWeight: "600", minWidth: 34, textAlign: "right" },

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
    height: 48,
    borderRadius: 14,
  },
  playBtnText: { fontSize: 15, fontWeight: "700" },
  iconBtn: {
    height: 48,
    minWidth: 48,
    paddingHorizontal: 12,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  timerText: { fontSize: 12, fontWeight: "700" },

  // Modal
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
  modalBtnPrimary: {},
  modalBtnText: { fontSize: 14, fontWeight: "600" },
});
