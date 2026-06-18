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
const SWATCH_SZ  = 60;

const COLOR_SWATCHES: { id: string; label: string; colors: [string, string] }[] = [
  { id: "borgona",  label: "Borgoña",  colors: ["#6B1828", "#3D0A15"] },
  { id: "cosmos",   label: "Cosmos",   colors: ["#1A2550", "#0D1230"] },
  { id: "nebulosa", label: "Nebulosa", colors: ["#221A5C", "#110D30"] },
  { id: "luna",     label: "Luna",     colors: ["#1A1A40", "#0D0D22"] },
  { id: "oceano",   label: "Océano",   colors: ["#0A2848", "#051422"] },
  { id: "amanecer", label: "Amanecer", colors: ["#6B3800", "#382000"] },
  { id: "selva",    label: "Selva",    colors: ["#0D3010", "#061808"] },
  { id: "fuego",    label: "Fuego",    colors: ["#541200", "#2B0800"] },
];

const IMAGE_SCENES = GRADIENT_PRESETS.filter((p) => p.image);
/** Todas las escenas: primero los degradados (sin imagen), luego las de imagen */
const ALL_SCENES = [
  ...GRADIENT_PRESETS.filter((p) => !p.image && p.isLight && p.id !== DEFAULT_BG_PRESET_ID),
  ...IMAGE_SCENES,
];

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
      <StatusBar barStyle="dark-content" />
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
                  trackColor="rgba(0,0,0,0.12)"
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
                trackColor={{ false: "#CCC", true: "#D4AF37" }}
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
                style={styles.restablecerBtn}
                hitSlop={8}
              >
                <Feather name="rotate-ccw" size={11} color="#8C1A2B" />
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

          {/* ── Color de fondo ── */}
          <View style={[styles.scenesTitleRow, { marginTop: 28 }]}>
            <Text style={styles.sectionTitle}>Color de fondo</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.swatchRow}
          >
            {COLOR_SWATCHES.map((sw) => {
              const active = selectedId === sw.id;
              return (
                <Pressable
                  key={sw.id}
                  onPress={() => applyScene(sw.id)}
                  style={styles.swatchItem}
                >
                  <LinearGradient
                    colors={sw.colors}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[styles.swatchCircle, active && styles.swatchCircleActive]}
                  >
                    {active && <Feather name="check" size={18} color="#FFF" />}
                  </LinearGradient>
                  <Text style={[styles.swatchLabel, active && styles.swatchLabelActive]} numberOfLines={1}>
                    {sw.label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          <Text style={styles.hint}>
            Toca una escena para previsualizarla antes de elegirla.
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
                <Feather name="trash-2" size={20} color="rgba(255,255,255,0.65)" />
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
                  <Feather name="check" size={17} color="#D4AF37" style={{ marginRight: 6 }} />
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
  headerTitle: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "700", color: "#1A1A22", letterSpacing: 0.2 },

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
  controlLabel: { fontSize: 14, fontWeight: "600", color: "#1A1A22" },
  controlSub: { fontSize: 12, color: "#888", marginTop: 1 },
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
  statusBadgeText: { fontSize: 11, fontWeight: "600", color: "#FFF" },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: "rgba(0,0,0,0.08)", marginHorizontal: -18 },

  timerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timerTriggerLabel: {
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
    fontSize: 14,
    fontWeight: "500",
    color: "#333",
  },
  timerDropItemTextActive: {
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
    fontSize: 16,
    fontWeight: "700",
    color: "#1A1A22",
    letterSpacing: 0.2,
  },
  restablecerBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(140,26,43,0.45)",
    backgroundColor: "rgba(140,26,43,0.1)",
  },
  restablecerText: {
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
    borderColor: "#D4AF37",
  },
  activeOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  gradientFallback: { borderRadius: 14 },
  cardLabel: { marginTop: 6, fontSize: 11, color: "#555", fontWeight: "500", textAlign: "center" },
  cardLabelActive: { color: "#D4AF37", fontWeight: "700" },

  hint: {
    marginTop: 20,
    marginBottom: 8,
    fontSize: 11,
    color: "#AAA",
    textAlign: "center",
    lineHeight: 16,
  },

  swatchRow: {
    flexDirection: "row",
    paddingHorizontal: H_PAD,
    paddingBottom: 4,
    gap: 12,
  },
  swatchItem: {
    alignItems: "center",
    gap: 6,
  },
  swatchCircle: {
    width: SWATCH_SZ,
    height: SWATCH_SZ,
    borderRadius: SWATCH_SZ / 2,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "transparent",
  },
  swatchCircleActive: {
    borderColor: "#D4AF37",
    shadowColor: "#D4AF37",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 6,
    elevation: 4,
  },
  swatchLabel: {
    fontSize: 10,
    color: "#888",
    fontWeight: "500",
    textAlign: "center",
    width: SWATCH_SZ,
  },
  swatchLabelActive: {
    color: "#D4AF37",
    fontWeight: "700",
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
    backgroundColor: "rgba(255,255,255,0.92)",
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
    borderColor: "#D4AF37",
  },
  applyBtnText: { fontSize: 16, fontWeight: "700", color: "#1A1A22" },
  applyBtnTextActive: { color: "#D4AF37" },
});
