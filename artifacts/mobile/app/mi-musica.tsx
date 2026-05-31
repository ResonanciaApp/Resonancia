import { Feather, Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Alert,
  ImageBackground,
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
import { MIX_IMAGE_GALLERY, getMixImage, DEFAULT_MIX_IMAGE_KEY } from "@/config/mix-images";
import { getSoundImage } from "@/config/sound-images";
import { usePremium } from "@/context/PremiumContext";
import { MAX_ACTIVE_SOUNDS, type MixPreset, useMixer } from "@/context/MixerContext";
import { MIX_CATEGORIES, type MixCategory } from "@/data/mix-categories";
import { useLoadMix } from "@/hooks/useLoadMix";
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
const FREE_MIX_PER_CATEGORY = 1;

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
    sleepTimerRemaining,
    setSleepTimer,
  } = useMixer();
  const loadMix = useLoadMix();

  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [presetName, setPresetName] = useState("");
  const [mixDescription, setMixDescription] = useState("");
  const [mixImage, setMixImage] = useState<string>(DEFAULT_MIX_IMAGE_KEY);
  const [mixCategory, setMixCategory] = useState<MixCategory>("dormir");

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
    setPresetName("");
    setMixDescription("");
    setMixImage(DEFAULT_MIX_IMAGE_KEY);
    setMixCategory("dormir");
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
    const savedCategory = mixCategory;
    savePreset({
      name: presetName,
      description: mixDescription,
      image: mixImage,
      category: mixCategory,
    });
    setSaveModalOpen(false);
    setPresetName("");
    setMixDescription("");
    router.push(`/mezclas/${savedCategory}` as never);
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
            Tus mezclas, organizadas por momento
          </Text>
        </View>

        {/* ── Categorías de mezclas ── */}
        <View style={styles.catRow}>
          {MIX_CATEGORIES.map((cat) => (
            <Pressable
              key={cat.id}
              onPress={() => router.push(`/mezclas/${cat.id}` as never)}
              style={styles.catCard}
            >
              <ImageBackground
                source={cat.image}
                style={styles.catImage}
                imageStyle={styles.catImageInner}
              >
                <LinearGradient
                  colors={["rgba(24,17,12,0.10)", "rgba(24,17,12,0.45)", "rgba(24,17,12,0.92)"]}
                  locations={[0, 0.5, 1]}
                  style={styles.cardOverlay}
                />
                <View style={styles.catContent}>
                  <Text style={styles.catLabel} numberOfLines={2}>
                    {cat.label}
                  </Text>
                </View>
              </ImageBackground>
            </Pressable>
          ))}
        </View>

        {/* ── Mezclador ── */}
        <View style={styles.mixerHeader}>
          <Text style={[styles.pageTitle, { color: colors.foreground, fontSize: 24 }]}>
            Mezcla mi música
          </Text>
          <Text style={[styles.pageSub, { color: colors.mutedForeground }]}>
            Combiná sonidos y guardá tu mezcla en una categoría
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
                  const image = getSoundImage(sound.id);

                  const overlay = (
                    <>
                      {/* Degradado para legibilidad del texto */}
                      <LinearGradient
                        colors={
                          active
                            ? ["rgba(198,155,79,0.10)", "rgba(24,17,12,0.20)", "rgba(24,17,12,0.85)"]
                            : ["rgba(24,17,12,0)", "rgba(24,17,12,0.12)", "rgba(24,17,12,0.82)"]
                        }
                        locations={[0, 0.55, 1]}
                        style={styles.cardOverlay}
                      />

                      {locked && (
                        <View style={styles.lockBadge}>
                          <Feather name="star" size={9} color="#18110C" />
                        </View>
                      )}

                      {active && (
                        <View style={[styles.activeBadge, { backgroundColor: colors.primary }]}>
                          <Feather name="check" size={11} color={colors.primaryForeground} />
                        </View>
                      )}

                      <View style={styles.cardContent}>
                        <Text style={styles.soundName} numberOfLines={1}>
                          {sound.name}
                        </Text>
                        {!available && <Text style={styles.soonText}>Próximamente</Text>}
                      </View>
                    </>
                  );

                  return (
                    <Pressable
                      key={sound.id}
                      onPress={() => handleSoundPress(sound)}
                      disabled={!available}
                      style={[
                        styles.soundCard,
                        {
                          backgroundColor: colors.card,
                          borderColor: active ? colors.primary : "rgba(0,0,0,0.25)",
                          borderWidth: active ? 2 : StyleSheet.hairlineWidth,
                        },
                      ]}
                    >
                      {image ? (
                        <ImageBackground
                          source={image}
                          style={styles.cardImage}
                          imageStyle={[styles.cardImageInner, { opacity: available ? 1 : 0.4 }]}
                        >
                          {overlay}
                        </ImageBackground>
                      ) : (
                        <View style={styles.cardImage}>{overlay}</View>
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
  section: { marginBottom: 14 },
  sectionTitle: { fontSize: 17, fontWeight: "700", letterSpacing: 0.3, marginBottom: 10 },

  // Categorías de mezclas
  catRow: { flexDirection: "row", gap: 10, marginBottom: 26 },
  catCard: {
    flex: 1,
    height: 110,
    borderRadius: 16,
    overflow: "hidden",
  },
  catImage: { flex: 1, justifyContent: "flex-end" },
  catImageInner: { borderRadius: 16 },
  catContent: { padding: 10 },
  catLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  mixerHeader: { marginBottom: 18 },

  // Grilla de sonidos
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  soundCard: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
  cardImage: { flex: 1, justifyContent: "flex-end" },
  cardImageInner: { borderRadius: 16 },
  cardOverlay: { ...StyleSheet.absoluteFillObject },
  cardContent: { padding: 8 },
  soundName: {
    fontSize: 12.5,
    fontWeight: "700",
    color: "#FFFFFF",
    textShadowColor: "rgba(0,0,0,0.6)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  soonText: {
    fontSize: 9,
    letterSpacing: 0.2,
    color: "rgba(237,225,211,0.85)",
    marginTop: 2,
  },
  lockBadge: {
    position: "absolute",
    top: 6,
    right: 6,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#D6A85B",
    alignItems: "center",
    justifyContent: "center",
  },
  activeBadge: {
    position: "absolute",
    top: 6,
    left: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
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
