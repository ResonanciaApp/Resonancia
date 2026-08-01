import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Dimensions,
  Modal,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { VolumeSlider } from "@/components/VolumeSlider";
import { useMixer } from "@/context/MixerContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import {
  DEFAULT_BG_PRESET_ID,
  DEFAULT_OVERLAY,
  GRADIENT_PRESETS,
  MIXER_BG_KEY,
  emitBgPresetChange,
} from "@/config/immersive-presets";

const TIMER_OPTIONS: Array<{ label: string; value: number | null }> = [
  { label: "Sin límite", value: null },
  { label: "15 min", value: 15 },
  { label: "30 min", value: 30 },
  { label: "45 min", value: 45 },
  { label: "60 min", value: 60 },
  { label: "90 min", value: 90 },
];

const { width: SCREEN_W } = Dimensions.get("window");
const H_PAD = 16;
const CARD_GAP = 12;
// ~2.2 tarjetas visibles → indica que hay más para deslizar
const CARD_W = Math.floor(SCREEN_W / 2.2 - CARD_GAP);
const CARD_H = Math.floor((CARD_W * 4 / 3 + 150) * 0.6);

const THUMB      = 110;
const THUMB_GAP  = 10;

const IMAGE_SCENES = GRADIENT_PRESETS.filter((p) => p.image);
/** Solo escenas de paisajes (con imagen). El color de fondo ya no se elige
 *  manualmente: por defecto se enlaza al tema activo de la app (ver Inicio). */
const ALL_SCENES = IMAGE_SCENES;

/** Pantalla de ruta (fallback si se accede directamente via URL). */
export default function EscenasMixerScreen() {
  return <EscenasMixerContent onClose={() => router.back()} />;
}

export function EscenasMixerContent({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const {
    masterVolume,
    setMasterVolume,
    loadedPresetId: contextBgPresetId,
    sleepTimerRemaining,
    setSleepTimer,
  } = useMixer();
  const { theme } = useSceneTheme();

  const [selectedId, setSelectedId] = useState<string>(
    contextBgPresetId ?? DEFAULT_BG_PRESET_ID,
  );
  const activeBgPreset = GRADIENT_PRESETS.find((p) => p.id === selectedId);
  const [videoEnabled, setVideoEnabled] = useState(false);
  const [previewScene, setPreviewScene] = useState<(typeof IMAGE_SCENES)[0] | null>(null);
  const [timerMinutes, setTimerMinutes] = useState<number | null>(null);
  const [timerOpen, setTimerOpen] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(MIXER_BG_KEY).then((bg) => {
      if (bg) setSelectedId(bg);
    });
  }, []);

  // Sincronizar chip seleccionado con el timer activo
  useEffect(() => {
    if (sleepTimerRemaining == null) {
      setTimerMinutes(null);
    } else {
      const mins = Math.ceil(sleepTimerRemaining / 60);
      const match = TIMER_OPTIONS.find((o) => o.value != null && Math.abs(o.value - mins) <= 2);
      setTimerMinutes(match?.value ?? null);
    }
  }, [sleepTimerRemaining]);

  const applyScene = (id: string) => {
    setSelectedId(id);
    AsyncStorage.setItem(MIXER_BG_KEY, id);
    emitBgPresetChange(id);
  };

  const handleTimerSelect = (v: number | null) => {
    setTimerMinutes(v);
    setSleepTimer(v);
  };

  const handleDelete = () => {
    Alert.alert(
      "¿Quitar escena?",
      "Se volverá al fondo predeterminado del mezclador.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Quitar",
          style: "destructive",
          onPress: () => {
            applyScene(DEFAULT_BG_PRESET_ID);
            setPreviewScene(null);
          },
        },
      ],
    );
  };

  return (
    <>
      <StatusBar hidden />
      <View style={[styles.root, { paddingTop: insets.top }]}>
        {/* Imagen de la escena seleccionada — fondo muy sutil */}
        {activeBgPreset?.image && (
          <Image
            source={activeBgPreset.image}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
        )}
        {/* Overlay claro — cubre bastante pero deja que la imagen se perciba */}
        <LinearGradient
          colors={["rgba(242,243,247,0.82)", "rgba(227,229,235,0.82)"]}
          style={StyleSheet.absoluteFill}
        />
        {/* ── Header ── */}
        <View style={styles.header}>
          <Pressable onPress={onClose} hitSlop={14} style={styles.headerBtn}>
            <Feather name="x" size={22} color="#2A2A2E" />
          </Pressable>
          <Text style={styles.headerTitle}>Escenas</Text>
          <View style={styles.headerBtn} />
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        >
          {/* ── Controles ── */}
          <View style={styles.controlsCard}>

            {/* Volumen de la mezcla */}
            <View style={styles.controlRow}>
              <MaterialCommunityIcons name="volume-high" size={20} color="#555" style={styles.controlIcon} />
              <View style={styles.controlText}>
                <Text style={styles.controlLabel}>Volumen de la mezcla</Text>
                <Text style={styles.controlSub}>Nivel general de todos los sonidos</Text>
              </View>
            </View>
            <View style={styles.sliderWrap}>
              <MaterialCommunityIcons name="volume-low" size={16} color="#999" />
              <View style={styles.sliderFlex}>
                <VolumeSlider
                  value={masterVolume}
                  onChange={setMasterVolume}
                  color="#4A4A5A"
                  trackColor="rgba(255,255,255,0.10)"
                />
              </View>
              <MaterialCommunityIcons name="volume-high" size={16} color="#555" />
            </View>

            <View style={styles.divider} />

            {/* Timer de reproducción */}
            <Pressable style={styles.controlRow} onPress={() => setTimerOpen((v) => !v)}>
              <MaterialCommunityIcons name="timer-outline" size={20} color="#555" style={styles.controlIcon} />
              <View style={styles.controlText}>
                <Text style={styles.controlLabel}>Apagar después de…</Text>
                <Text style={styles.controlSub}>La mezcla se detiene automáticamente</Text>
              </View>
              <View style={styles.timerTrigger}>
                <Text style={styles.timerTriggerLabel}>
                  {TIMER_OPTIONS.find((o) => o.value === timerMinutes)?.label ?? "Sin límite"}
                </Text>
                <MaterialCommunityIcons
                  name={timerOpen ? "chevron-up" : "chevron-down"}
                  size={16}
                  color="#555"
                />
              </View>
            </Pressable>
            {timerOpen && (
              <View style={styles.timerDropdown}>
                {TIMER_OPTIONS.map((opt) => {
                  const active = timerMinutes === opt.value;
                  return (
                    <Pressable
                      key={String(opt.value)}
                      onPress={() => { handleTimerSelect(opt.value); setTimerOpen(false); }}
                      style={[styles.timerDropItem, active && styles.timerDropItemActive]}
                    >
                      <Text style={[styles.timerDropItemText, active && styles.timerDropItemTextActive]}>
                        {opt.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            )}

            <View style={styles.divider} />

            {/* Video toggle */}
            <View style={[styles.controlRow, { opacity: 0.45 }]}>
              <MaterialCommunityIcons name="video-outline" size={20} color="#555" style={styles.controlIcon} />
              <View style={styles.controlText}>
                <Text style={styles.controlLabel}>Video de la escena</Text>
                <Text style={styles.controlSub}>Próximamente — escenas en movimiento</Text>
              </View>
              <Switch
                value={videoEnabled}
                onValueChange={setVideoEnabled}
                disabled
                trackColor={{ false: "#CCC", true: "#F7CB6B" }}
                thumbColor="#FFF"
              />
            </View>

          </View>

          {/* ── Sección escenas ── */}
          <View style={styles.scenesTitleRow}>
            <Text style={styles.sectionTitle}>Escenas</Text>
            {selectedId !== DEFAULT_BG_PRESET_ID && (
              <Pressable
                onPress={() => applyScene(DEFAULT_BG_PRESET_ID)}
                style={({ pressed }) => [styles.restablecerBtn, { opacity: pressed ? 0.7 : 1 }]}
                hitSlop={8}
              >
                <LinearGradient
                  colors={[theme.gradient[0], theme.gradient[1]]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.restablecerDot}
                />
                <Text style={styles.restablecerText}>Restablecer</Text>
              </Pressable>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.slider}
            decelerationRate="fast"
            snapToInterval={CARD_W + CARD_GAP}
            snapToAlignment="start"
          >
            {ALL_SCENES.map((scene) => {
              const active = selectedId === scene.id;
              const hasImage = !!scene.image;
              return (
                <Pressable
                  key={scene.id}
                  onPress={() => hasImage ? setPreviewScene(scene) : applyScene(scene.id)}
                  style={styles.cardWrap}
                >
                  <View style={styles.card}>
                    {hasImage ? (
                      <Image
                        source={scene.image}
                        style={StyleSheet.absoluteFill}
                        contentFit="cover"
                      />
                    ) : (
                      <LinearGradient
                        colors={[...scene.colors]}
                        start={{ x: 0.3, y: 0 }}
                        end={{ x: 0.7, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />
                    )}
                    {active && (
                      <>
                        <View style={[styles.activeOverlay, !hasImage && { backgroundColor: "rgba(0,0,0,0.08)" }]}>
                          <Feather name="check-circle" size={28} color={hasImage ? "#FFF" : "#555"} />
                        </View>
                        <View style={styles.activeBorder} pointerEvents="none" />
                      </>
                    )}
                  </View>
                  <Text style={[styles.cardLabel, active && styles.cardLabelActive]} numberOfLines={1}>
                    {scene.name}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.hint}>
            Toca una escena para previsualizarla antes de elegirla. Sin una
            escena elegida, el fondo usa el tema activo de la app.
          </Text>
        </ScrollView>
      </View>

      {/* ── Preview fullscreen ── */}
      {previewScene && (
        <Modal visible animationType="fade" statusBarTranslucent>
          <View style={styles.previewRoot}>
            <Image
              source={previewScene.image}
              style={[StyleSheet.absoluteFill, { top: -300, left: -300, right: -300, bottom: -300 }]}
              contentFit="cover"
            />
            <View style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(0,0,0,${DEFAULT_OVERLAY})` }]} />

            {/* Top row */}
            <View style={[styles.previewTop, { paddingTop: insets.top + 12 }]}>
              <Pressable onPress={() => setPreviewScene(null)} hitSlop={14} style={styles.previewIconBtn}>
                <Feather name="x" size={24} color="#FFF" />
              </Pressable>
              <Text style={styles.previewTitle}>{previewScene.name}</Text>
              <Pressable onPress={handleDelete} hitSlop={14} style={styles.previewIconBtn}>
                <Feather name="trash-2" size={20} color="#F4F4F4" />
              </Pressable>
            </View>

            {/* Bottom CTA */}
            <View style={[styles.previewBottom, { paddingBottom: insets.bottom + 24 }]}>
              <Pressable
                onPress={() => {
                  applyScene(previewScene.id);
                  setPreviewScene(null);
                }}
                style={[
                  styles.applyBtn,
                  selectedId === previewScene.id && styles.applyBtnActive,
                ]}
              >
                {selectedId === previewScene.id && (
                  <Feather name="check" size={17} color="#F7CB6B" style={{ marginRight: 6 }} />
                )}
                <Text style={[
                  styles.applyBtnText,
                  selectedId === previewScene.id && styles.applyBtnTextActive,
                ]}>
                  {selectedId === previewScene.id ? "Escena activa" : "Elegir esta escena"}
                </Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerBtn: { width: 36, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Manrope", flex: 1, textAlign: "center", fontSize: 17, fontWeight: "700", color: "#1A1A22", letterSpacing: 0.2 },

  scrollContent: { paddingHorizontal: H_PAD, paddingTop: 8 },

  controlsCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 6,
    marginBottom: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.07,
    shadowRadius: 6,
    elevation: 2,
  },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
  },
  controlIcon: { marginRight: 12, width: 22 },
  controlText: { flex: 1 },
  controlLabel: { fontFamily: "Manrope", fontSize: 14, fontWeight: "600", color: "#1A1A22" },
  controlSub: { fontFamily: "Manrope", fontSize: 12, color: "#888", marginTop: 1 },
  sliderWrap: {
    flexDirection: "row",
    alignItems: "center",
    paddingBottom: 10,
    paddingHorizontal: 4,
    gap: 8,
  },
  sliderFlex: { flex: 1 },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  statusBadgeText: { fontFamily: "Manrope", fontSize: 11, fontWeight: "600", color: "#FFF" },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(0,0,0,0.08)", marginHorizontal: -18 },

  timerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timerTriggerLabel: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
    color: "#1A1A22",
    letterSpacing: 0.2,
  },
  timerDropdown: {
    backgroundColor: "rgba(0,0,0,0.055)",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 12,
    marginHorizontal: -4,
  },
  timerDropItem: {
    paddingVertical: 13,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  timerDropItemActive: {
    backgroundColor: "#1A1A22",
  },
  timerDropItemText: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  timerDropItemTextActive: {
    fontFamily: "Manrope",
    color: "#FFF",
    fontWeight: "700",
  },

  scenesTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A22",
    letterSpacing: 0.2,
  },
  restablecerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(140,26,43,0.45)",
    backgroundColor: "rgba(140,26,43,0.1)",
  },
  restablecerDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  restablecerText: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "600",
    color: "#8C1A2B",
    letterSpacing: 0.2,
  },

  slider: {
    flexDirection: "row",
    paddingHorizontal: H_PAD,
    paddingBottom: 4,
    gap: CARD_GAP,
  },
  cardWrap: { width: CARD_W, alignItems: "center" },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#222",
  },
  cardActive: {},
  activeBorder: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 16,
    borderWidth: 3,
    borderColor: "#F7CB6B",
  },
  activeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  gradientFallback: { borderRadius: 14 },
  cardLabel: { fontFamily: "Manrope", marginTop: 6, fontSize: 11, color: "#555", fontWeight: "500", textAlign: "center" },
  cardLabelActive: { fontFamily: "Manrope", color: "#F7CB6B", fontWeight: "700" },

  hint: {
    fontFamily: "Manrope",
    marginTop: 20,
    marginBottom: 8,
    fontSize: 11,
    color: "#AAA",
    textAlign: "center",
    lineHeight: 16,
  },

  thumbRow: {
    flexDirection: "row",
    paddingHorizontal: H_PAD,
    paddingBottom: 4,
    gap: THUMB_GAP,
  },
  thumbWrap: {
    width: THUMB,
    alignItems: "center",
  },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#111",
  },
  thumbLabel: {
    fontFamily: "Manrope",
    marginTop: 6,
    fontSize: 11,
    color: "#555",
    fontWeight: "500",
    textAlign: "center",
    width: THUMB,
  },
  presetBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: "rgba(212,175,55,0.85)",
    borderRadius: 8,
    paddingHorizontal: 5,
    paddingVertical: 2,
  },
  presetBadgeText: {
    fontFamily: "Manrope",
    fontSize: 8,
    fontWeight: "700",
    color: "#1A1A22",
    letterSpacing: 0.3,
  },

  verMasBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  verMasText: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "600",
    color: "#8C1A2B",
  },

  previewRoot: { flex: 1, backgroundColor: "#000" },
  previewTop: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  previewIconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.40)",
    borderRadius: 20,
  },
  previewTitle: {
    fontFamily: "Manrope",
    flex: 1,
    textAlign: "center",
    fontSize: 18,
    fontWeight: "700",
    color: "#FFF",
    letterSpacing: 0.3,
  },
  previewBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: "center",
    paddingHorizontal: 32,
  },
  applyBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FBFBFB",
    borderRadius: 32,
    paddingHorizontal: 32,
    paddingVertical: 16,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 4,
  },
  applyBtnActive: {
    backgroundColor: "rgba(212,175,55,0.15)",
    borderWidth: 1.5,
    borderColor: "#F7CB6B",
  },
  applyBtnText: { fontFamily: "Manrope", fontSize: 16, fontWeight: "700", color: "#1A1A22" },
  applyBtnTextActive: { color: "#F7CB6B" },
});
