import { Feather, Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { VolumeSlider } from "@/components/VolumeSlider";
import { usePremium } from "@/context/PremiumContext";
import { MAX_ACTIVE_SOUNDS, type MixPreset, useMixer } from "@/context/MixerContext";
import {
  type MixSound,
  type SoundIconSet,
  SOUND_CATEGORIES,
  getSoundById,
  getSoundsByCategory,
  hasSoundFile,
} from "@/data/sounds";
import { useColors } from "@/hooks/useColors";

const TIMER_OPTIONS = [15, 30, 45, 60];
const FREE_PRESET_LIMIT = 1;

function SoundIcon({
  iconSet,
  icon,
  size,
  color,
}: {
  iconSet: SoundIconSet;
  icon: string;
  size: number;
  color: string;
}) {
  if (iconSet === "ionicons") {
    return <Ionicons name={icon as never} size={size} color={color} />;
  }
  return <Feather name={icon as never} size={size} color={color} />;
}

function formatTimer(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function MiMusicaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isPremium } = usePremium();
  const {
    activeSounds,
    isActive,
    getVolume,
    toggleSound,
    setVolume,
    removeSound,
    isPlaying,
    togglePlay,
    stopAll,
    presets,
    savePreset,
    loadPreset,
    deletePreset,
    sleepTimerRemaining,
    setSleepTimer,
  } = useMixer();

  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [presetName, setPresetName] = useState("");

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const activeMix = useMemo(
    () =>
      activeSounds
        .map((a) => ({ active: a, sound: getSoundById(a.id) }))
        .filter((x): x is { active: typeof x.active; sound: MixSound } => !!x.sound),
    [activeSounds],
  );

  const handleSoundPress = (sound: MixSound) => {
    if (!hasSoundFile(sound.id)) return; // "Próximamente"
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
      }
    } else {
      toggleSound(sound.id);
    }
  };

  const handleSavePress = () => {
    if (activeSounds.length === 0) return;
    if (!isPremium && presets.length >= FREE_PRESET_LIMIT) {
      Alert.alert(
        "Mezclas ilimitadas con Premium",
        `En la versión gratuita podés guardar ${FREE_PRESET_LIMIT} mezcla. Hacete Premium para guardar todas las que quieras.`,
        [
          { text: "Ahora no", style: "cancel" },
          { text: "Ver Premium", onPress: () => router.push("/membresia" as never) },
        ],
      );
      return;
    }
    setPresetName("");
    setSaveModalOpen(true);
  };

  const confirmSave = () => {
    savePreset(presetName);
    setSaveModalOpen(false);
    setPresetName("");
  };

  const handleLoadPreset = (preset: MixPreset) => {
    // Filtrar: solo sonidos con archivo y accesibles según premium
    const accessible = preset.sounds.filter((s) => {
      const snd = getSoundById(s.id);
      if (!snd || !hasSoundFile(s.id)) return false;
      if (snd.isPremium && !isPremium) return false;
      return true;
    });
    if (accessible.length === 0) {
      const hasLockedPremium = preset.sounds.some(
        (s) => getSoundById(s.id)?.isPremium && !isPremium,
      );
      if (hasLockedPremium) {
        Alert.alert(
          "Mezcla Premium",
          "Esta mezcla usa sonidos exclusivos de Premium.",
          [
            { text: "Ahora no", style: "cancel" },
            { text: "Ver Premium", onPress: () => router.push("/membresia" as never) },
          ],
        );
      } else {
        Alert.alert("Mezcla vacía", "Los sonidos de esta mezcla aún no están disponibles.");
      }
      return;
    }
    loadPreset({ ...preset, sounds: accessible });
  };

  const handleDeletePreset = (preset: MixPreset) => {
    Alert.alert("Eliminar mezcla", `¿Eliminar "${preset.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      { text: "Eliminar", style: "destructive", onPress: () => deletePreset(preset.id) },
    ]);
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

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: 200 + bottomPad,
          paddingTop: topPad + 12,
          paddingHorizontal: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerTop}>
          <Pressable
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/(tabs)" as never)
            }
            hitSlop={10}
            style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="chevron-left" size={20} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={styles.header}>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Mi Música</Text>
          <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
            Combiná sonidos y creá tu mezcla de relajación
          </Text>
        </View>

        {/* ── Mezcla activa ── */}
        {activeMix.length > 0 && (
          <View
            style={[styles.mixCard, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={styles.mixHeader}>
              <Text style={[styles.mixTitle, { color: colors.foreground }]}>
                Tu mezcla · {activeMix.length}/{MAX_ACTIVE_SOUNDS}
              </Text>
              <Pressable onPress={stopAll} hitSlop={8}>
                <Text style={[styles.clearText, { color: colors.mutedForeground }]}>Limpiar</Text>
              </Pressable>
            </View>

            {activeMix.map(({ active, sound }) => (
              <View key={sound.id} style={styles.sliderRow}>
                <View style={styles.sliderTop}>
                  <View style={styles.sliderLabelWrap}>
                    <SoundIcon
                      iconSet={sound.iconSet}
                      icon={sound.icon}
                      size={15}
                      color={colors.accent}
                    />
                    <Text style={[styles.sliderLabel, { color: colors.foreground }]}>
                      {sound.name}
                    </Text>
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
              <Pressable
                onPress={togglePlay}
                style={[styles.playBtn, { backgroundColor: colors.primary }]}
              >
                <Feather
                  name={isPlaying ? "pause" : "play"}
                  size={20}
                  color={colors.primaryForeground}
                />
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

              <Pressable
                onPress={handleSavePress}
                style={[styles.iconBtn, { borderColor: colors.border, backgroundColor: colors.secondary }]}
              >
                <Feather name="save" size={18} color={colors.foreground} />
              </Pressable>
            </View>
          </View>
        )}

        {/* ── Mezclas guardadas ── */}
        {presets.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Mis mezclas</Text>
            {presets.map((preset) => (
              <Pressable
                key={preset.id}
                onPress={() => handleLoadPreset(preset)}
                onLongPress={() => handleDeletePreset(preset)}
                style={[styles.presetRow, { backgroundColor: colors.card, borderColor: colors.border }]}
              >
                <View style={[styles.presetIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name="play" size={14} color={colors.accent} />
                </View>
                <View style={styles.presetInfo}>
                  <Text style={[styles.presetName, { color: colors.foreground }]} numberOfLines={1}>
                    {preset.name}
                  </Text>
                  <Text style={[styles.presetMeta, { color: colors.mutedForeground }]}>
                    {preset.sounds.length} sonido{preset.sounds.length !== 1 ? "s" : ""}
                  </Text>
                </View>
                <Pressable onPress={() => handleDeletePreset(preset)} hitSlop={10}>
                  <Feather name="trash-2" size={16} color={colors.mutedForeground} />
                </Pressable>
              </Pressable>
            ))}
          </View>
        )}

        {/* ── Biblioteca de sonidos ── */}
        {SOUND_CATEGORIES.map((cat) => {
          const sounds = getSoundsByCategory(cat.id);
          if (sounds.length === 0) return null;
          return (
            <View key={cat.id} style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{cat.label}</Text>
              <View style={styles.grid}>
                {sounds.map((sound) => {
                  const available = hasSoundFile(sound.id);
                  const active = isActive(sound.id);
                  const locked = sound.isPremium && !isPremium;
                  return (
                    <Pressable
                      key={sound.id}
                      onPress={() => handleSoundPress(sound)}
                      disabled={!available}
                      style={[
                        styles.soundCard,
                        {
                          backgroundColor: active ? colors.primary : colors.card,
                          borderColor: active ? colors.primary : colors.border,
                          opacity: available ? 1 : 0.45,
                        },
                      ]}
                    >
                      {locked && available && (
                        <View style={styles.lockBadge}>
                          <Feather name="star" size={9} color="#18110C" />
                        </View>
                      )}
                      <SoundIcon
                        iconSet={sound.iconSet}
                        icon={sound.icon}
                        size={22}
                        color={active ? colors.primaryForeground : colors.accent}
                      />
                      <Text
                        style={[
                          styles.soundName,
                          { color: active ? colors.primaryForeground : colors.foreground },
                        ]}
                        numberOfLines={1}
                      >
                        {sound.name}
                      </Text>
                      {!available && (
                        <Text style={[styles.soonText, { color: colors.mutedForeground }]}>
                          Próximamente
                        </Text>
                      )}
                    </Pressable>
                  );
                })}
              </View>
            </View>
          );
        })}
      </ScrollView>

      {/* Modal: nombrar mezcla */}
      <Modal visible={saveModalOpen} transparent animationType="fade" onRequestClose={() => setSaveModalOpen(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setSaveModalOpen(false)}>
          <Pressable
            style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Guardar mezcla</Text>
            <TextInput
              value={presetName}
              onChangeText={setPresetName}
              placeholder="Ej: Para dormir"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.modalInput,
                { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.secondary },
              ]}
              autoFocus
              maxLength={40}
            />
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
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  scroll: { flex: 1 },
  headerTop: { marginBottom: 14 },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  header: { marginBottom: 20 },
  pageTitle: { fontSize: 30, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },
  pageSub: { fontSize: 13, lineHeight: 18 },

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
  mixTitle: { fontSize: 14, fontWeight: "700", letterSpacing: 0.3 },
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

  // Secciones
  section: { marginBottom: 24 },
  sectionTitle: { fontSize: 17, fontWeight: "700", letterSpacing: 0.3, marginBottom: 12 },

  // Presets
  presetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    marginBottom: 8,
  },
  presetIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  presetInfo: { flex: 1 },
  presetName: { fontSize: 14, fontWeight: "600" },
  presetMeta: { fontSize: 12, marginTop: 2 },

  // Grilla de sonidos
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  soundCard: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 6,
  },
  soundName: { fontSize: 12, fontWeight: "600", textAlign: "center" },
  soonText: { fontSize: 9, letterSpacing: 0.2 },
  lockBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#D6A85B",
    alignItems: "center",
    justifyContent: "center",
  },

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
  modalInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
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
