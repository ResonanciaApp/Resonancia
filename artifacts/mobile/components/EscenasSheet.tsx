/**
 * EscenasSheet — panel de "Escenas" (sonido ambiente).
 * ─────────────────────────────────────────────────────────────────
 * Flujo de selección:
 *   1. Presionar card → se achica (spring) mientras el dedo está apoyado.
 *   2. Soltar → preview fullscreen sube desde abajo (dentro del mismo Modal)
 *      + sonido de la escena arranca.
 *   3. En preview: ajustar volumen / temporizador; botón "Elegir esta escena".
 *   4. Confirmar → preview baja, vuelve al listado, tema cambia con fade 450ms,
 *      EscenasSheet se cierra solo 900ms después.
 *   5. Cancelar (X) → preview baja, audio revierte a escena anterior.
 *
 * NOTA DE ARQUITECTURA: se usa UN SOLO Modal para todo. Montar un segundo
 * Modal encima del primero no funciona en React Native (el segundo no se
 * muestra). El preview es un Animated.View absoluteFill dentro del mismo Modal.
 * ─────────────────────────────────────────────────────────────────
 */
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { VolumeSlider } from "@/components/VolumeSlider";
import { SceneAnimationCard, type SceneItem } from "@/components/SceneAnimationCard";
import { AMBIENT_SCENES, useAmbientPlayer, type SceneId } from "@/context/AmbientPlayerContext";
import { SCENE_THEMES } from "@/config/scene-themes";
import { useSelectedScene } from "@/context/SelectedSceneContext";
import type { SceneAnimation } from "@workspace/api-client-react";
import { useGetSceneAnimations } from "@workspace/api-client-react";
import { useGreetingVisible } from "@/context/GreetingVisibleContext";
import { useBrightness } from "@/context/BrightnessContext";
import { useIntencionDiaria } from "@/context/IntencionDiariaContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { DURATION, easeOutCubic } from "@/constants/motion";
import { useGeometrixCreations } from "@/hooks/useGeometrixCreations";
import type { GeometrixCreation } from "@/data/geometrix-creations";

const SCREEN_W = Dimensions.get("window").width;
const SCREEN_H = Dimensions.get("window").height;
const SHEET_H_PAD = 24;
const CARD_GAP = 14;
const CARD_W = Math.floor((SCREEN_W - SHEET_H_PAD * 2 - CARD_GAP) / 2);
const CARD_H = Math.floor(CARD_W * 1.1) + 30;
const ANIM_CARD_SIZE = Math.floor((SCREEN_W - SHEET_H_PAD * 2 - 12) / 2 * 0.8) + 31;
const ANIM_CARD_H = Math.round(ANIM_CARD_SIZE * 1.32) - 17;

const WARM_DIVIDER = "rgba(255,255,255,0.055)";

const TIMER_OPTIONS: Array<{ label: string; value: number | null }> = [
  { label: "Sin límite", value: null },
  { label: "15 minutos", value: 15 },
  { label: "30 minutos", value: 30 },
  { label: "45 minutos", value: 45 },
  { label: "60 minutos", value: 60 },
  { label: "90 minutos", value: 90 },
];

/** Convierte una creación de Geometrix al shape mínimo que necesita SceneAnimationCard. */
function creationToSceneItem(c: GeometrixCreation): SceneItem {
  return {
    name: c.name,
    isPremium: false,
    recipe: { active: c.active, master: c.master, settings: c.settings },
  };
}

/** Convierte una creación de Geometrix al tipo SceneAnimation para el contexto. */
function creationToSceneAnimation(c: GeometrixCreation): SceneAnimation {
  return {
    id: parseInt(c.id, 10) || 0,
    name: c.name,
    description: null,
    phrase: null,
    recipe: { active: c.active, master: c.master, settings: c.settings },
    isActive: true,
    isPremium: false,
    sortOrder: 0,
    submittedBy: null,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  } as unknown as SceneAnimation;
}

// ── Card CTA "Crea tu animación" ──────────────────────────────────────────
export function SceneAnimationCtaCard({
  size,
  height,
  onPress,
}: {
  size: number;
  height: number;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        ctaS.wrap,
        { width: size, height: height, opacity: pressed ? 0.75 : 1 },
      ]}
    >
      <LinearGradient
        colors={["rgba(190,150,80,0.10)", "rgba(190,150,80,0.04)"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={[StyleSheet.absoluteFill, { borderRadius: 18 }]}
      />
      <View style={ctaS.card}>
        <Text style={ctaS.plus}>✦</Text>
        <Text style={ctaS.label}>{`Crea tu\nanimación`}</Text>
      </View>
    </Pressable>
  );
}

const ctaS = StyleSheet.create({
  wrap: {
    alignItems: "center",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(190,150,80,0.28)",
    overflow: "hidden",
    justifyContent: "center",
  },
  card: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  plus: {
    fontSize: 28,
    color: "#F7CB6B",
    opacity: 0.85,
  },
  label: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "700",
    color: "#F7CB6B",
    textAlign: "center",
    lineHeight: 18,
    letterSpacing: 0.2,
  },
});

const userS = StyleSheet.create({
  sectionRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 4,
    marginTop: 4,
    marginBottom: 4,
  },
  sectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(190,150,80,0.18)",
  },
  sectionLabel: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(190,150,80,0.65)",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
});

export function EscenasSheet() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { theme, activeSceneId, setActiveSceneWithFade, overlayColors, overlayOpacity } = useSceneTheme();
  const { data: sceneAnimationsData } = useGetSceneAnimations();
  const geoScenes = sceneAnimationsData?.scenes ?? [];
  const { creations: geometrixCreations, reload: reloadCreations } = useGeometrixCreations();
  const { setSelectedScene, setBgScene } = useSelectedScene();
  const {
    currentScene,
    isPlaying,
    isMuted,
    volume,
    setVolume,
    setScene,
    startAmbient,
    isSheetOpen,
    closeSheet,
    sleepTimerRemaining,
    setSleepTimer,
  } = useAmbientPlayer();

  const [timerOpen, setTimerOpen] = useState(false);
  const { intencionDiariaEnabled, setIntencionDiariaEnabled, escenasAnimadasEnabled, setEscenasAnimadasEnabled } = useIntencionDiaria();
  const { greetingVisible, setGreetingVisible } = useGreetingVisible();
  const { brightMode, setBrightMode } = useBrightness();
  // ID de la escena CONFIRMADA (la que muestra el borde blanco en el carrusel).
  // Se actualiza solo cuando el usuario presiona "Elegir escena", NO al abrir el preview.
  const [confirmedSceneId, setConfirmedSceneId] = useState<SceneId>(currentScene.id);
  const timerMinutes =
    sleepTimerRemaining == null
      ? null
      : (TIMER_OPTIONS.find(
          (o) => o.value != null && Math.abs(o.value * 60 - sleepTimerRemaining) <= 90,
        )?.value ?? null);

  // ── Sheet entrance / exit animations ─────────────────────────────────────
  const sheetEnterY = useRef(new Animated.Value(SCREEN_H)).current;

  /** Anima el sheet hacia abajo y luego llama a closeSheet(). */
  const handleClose = useCallback(() => {
    Animated.timing(sheetEnterY, {
      toValue: SCREEN_H,
      duration: 460,
      easing: easeOutCubic,
      useNativeDriver: true,
    }).start(() => closeSheet());
  }, [sheetEnterY, closeSheet]);

  /** Cierra el sheet y navega a la pestaña Geometrix. */
  const handleGoToGeometrix = useCallback(() => {
    Animated.timing(sheetEnterY, {
      toValue: SCREEN_H,
      duration: 380,
      easing: easeOutCubic,
      useNativeDriver: true,
    }).start(() => {
      closeSheet();
      router.navigate("/(tabs)/geometrix");
    });
  }, [sheetEnterY, closeSheet, router]);

  useLayoutEffect(() => {
    if (isSheetOpen) {
      sheetEnterY.setValue(SCREEN_H);
      Animated.timing(sheetEnterY, {
        toValue: 0,
        duration: DURATION.SHEET_OPEN,
        easing: easeOutCubic,
        useNativeDriver: true,
      }).start();
      // Sincronizar el borde con la escena activa al abrir
      setConfirmedSceneId(currentScene.id);
      // Refrescar creaciones del usuario por si se guardó algo en Geometrix
      reloadCreations();
    } else {
      // La animación de cierre ya llevó sheetEnterY a SCREEN_H; solo limpiar estado
      setTimerOpen(false);
      setPreviewScene(null);
      previewSlideY.setValue(SCREEN_H);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSheetOpen]);

  // ── Per-card scale animations ─────────────────────────────────────────────
  const scaleAnims = useRef<Record<string, Animated.Value>>(
    Object.fromEntries(AMBIENT_SCENES.map((s) => [s.id, new Animated.Value(1)])),
  ).current;

  // ── Per-card border fade animations ───────────────────────────────────────
  const borderAnims = useRef<Record<string, Animated.Value>>(
    Object.fromEntries(
      AMBIENT_SCENES.map((s) => [s.id, new Animated.Value(s.id === currentScene.id ? 1 : 0)]),
    ),
  ).current;

  useEffect(() => {
    AMBIENT_SCENES.forEach((s) => {
      Animated.timing(borderAnims[s.id], {
        toValue: s.id === confirmedSceneId ? 1 : 0,
        duration: 700,
        useNativeDriver: false,
      }).start();
    });
  }, [confirmedSceneId]);

  const handlePressIn = (id: SceneId) => {
    Animated.spring(scaleAnims[id], {
      toValue: 0.91,
      useNativeDriver: true,
      speed: 60,
      bounciness: 0,
    }).start();
  };

  const handlePressOut = (id: SceneId) => {
    Animated.spring(scaleAnims[id], {
      toValue: 1,
      useNativeDriver: true,
      speed: 18,
      bounciness: 3,
    }).start();
  };

  // ── Fullscreen preview (dentro del mismo Modal) ───────────────────────────
  const [previewScene, setPreviewScene] = useState<(typeof AMBIENT_SCENES)[0] | null>(null);
  const prevSceneIdRef = useRef<SceneId | null>(null);
  const previewSlideY = useRef(new Animated.Value(SCREEN_H)).current;

  // Arrancar la animación DESPUÉS de que el Animated.View se monte
  useEffect(() => {
    if (!previewScene) return;
    Animated.timing(previewSlideY, {
      toValue: 0,
      duration: 380,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewScene]);

  const handleOpenPreview = (scene: (typeof AMBIENT_SCENES)[0]) => {
    prevSceneIdRef.current = currentScene.id;
    // Posicionar el preview fuera de pantalla antes de montarlo
    previewSlideY.setValue(SCREEN_H);
    setPreviewScene(scene);
    // Arrancar audio inmediatamente
    setScene(scene.id);
    startAmbient();
  };

  const closePreviewAnimated = (onDone?: () => void) => {
    Animated.timing(previewSlideY, {
      toValue: SCREEN_H,
      duration: 300,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      setPreviewScene(null);
      previewSlideY.setValue(SCREEN_H);
      onDone?.();
    });
  };

  const handleCancelPreview = () => {
    // Revertir audio
    const prev = prevSceneIdRef.current;
    if (prev && prev !== previewScene?.id) {
      setScene(prev);
    }
    closePreviewAnimated();
  };

  const handleConfirmScene = (id: SceneId) => {
    setConfirmedSceneId(id);
    closePreviewAnimated(() => {
      // Volver al listado → aplicar fade del tema (el sheet queda abierto)
      setActiveSceneWithFade(id);
    });
  };

  const soundOn = isPlaying && !isMuted;

  return (
    <Modal
      visible={isSheetOpen}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={handleClose}
    >
      {/* ── Listado de escenas ──────────────────────────────────────────────── */}
      <Animated.View
        style={[styles.sheet, { transform: [{ translateY: sheetEnterY }] }]}
      >
        {/* Fondo fijo (tema actual — no cambia durante la transición) */}
        <LinearGradient colors={theme.gradient} style={StyleSheet.absoluteFill} />
        {/* Nuevo tema entrando detrás del contenido — el contenido NUNCA se tapa */}
        {overlayColors && (
          <Animated.View
            style={[StyleSheet.absoluteFill, { opacity: overlayOpacity }]}
            pointerEvents="none"
          >
            <LinearGradient
              colors={[...overlayColors] as [string, string]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        )}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingTop: Math.max(insets.top, 20), paddingBottom: Math.max(insets.bottom, 24) }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable style={styles.closeBtn} onPress={handleClose} hitSlop={10}>
            <Feather name="x" size={26} color="#FFFFFF" />
          </Pressable>
          <Text style={styles.title}>Escenas</Text>

          {/* ── Color picker: 3 rectángulos horizontales ── */}
          <View style={{ marginBottom: 14, marginTop: 20 }}>
            <View style={{ flexDirection: "row", gap: 8, marginTop: 6 }}>
              {AMBIENT_SCENES.filter((s) => !!SCENE_THEMES[s.id as keyof typeof SCENE_THEMES]).map((scene) => {
                const themeData = SCENE_THEMES[scene.id as keyof typeof SCENE_THEMES];
                if (!themeData) return null;
                const isActive = scene.id === activeSceneId;
                return (
                  <Pressable
                    key={scene.id}
                    onPress={() => setActiveSceneWithFade(scene.id)}
                    style={{ flex: 1, alignItems: "center", gap: 6 }}
                    hitSlop={6}
                  >
                    {/* Borde externo (sin overflow:hidden para no recortar el borde) */}
                    <View style={{
                      width: "100%",
                      height: 30,
                      borderRadius: 17,
                      borderWidth: 2,
                      borderColor: isActive ? "rgba(255,255,255,0.75)" : "rgba(255,255,255,0.035)",
                      padding: 2,
                    }}>
                      {/* Relleno con degradado (overflow:hidden para el redondeo interior) */}
                      <View style={{ flex: 1, borderRadius: 13, overflow: "hidden" }}>
                        <LinearGradient
                          colors={[themeData.gradient[0], themeData.gradient[themeData.gradient.length - 1]] as [string, string]}
                          start={{ x: 0, y: 0 }}
                          end={{ x: 1, y: 0 }}
                          style={{ flex: 1 }}
                        />
                      </View>
                    </View>
                    <Text style={{ fontFamily: "Manrope", fontSize: 11, color: isActive ? "#F9F9F9" : "rgba(249,249,249,0.55)", textAlign: "center" }}>
                      {themeData.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>


          {/* Intención diaria (reemplaza la escena animada en Inicio) */}
          <View style={[styles.controlRow, {
            backgroundColor: "rgba(249,249,249,0.075)",
            borderRadius: 14,
            paddingHorizontal: 12,
            marginTop: 20,
          }]}>
            <MaterialCommunityIcons name="feather" size={17} color="#F4F4F4" style={styles.controlIcon} />
            <Text style={styles.controlLabel}>Activar intención diaria</Text>
            <Switch
              value={intencionDiariaEnabled}
              onValueChange={setIntencionDiariaEnabled}
              trackColor={{ false: "rgba(249,249,249,0.35)", true: "rgba(249,249,249,0.7)" }}
              thumbColor="#f9f9f9"
            />
          </View>

          {/* Escenas animadas (geometrías en Inicio) */}
          <View style={[styles.controlRow, {
            backgroundColor: "rgba(249,249,249,0.075)",
            borderRadius: 14,
            paddingHorizontal: 12,
            marginTop: 12,
          }]}>
            <MaterialCommunityIcons name="star-four-points-outline" size={17} color="#F4F4F4" style={styles.controlIcon} />
            <Text style={styles.controlLabel}>Activar escenas animadas</Text>
            <Switch
              value={escenasAnimadasEnabled}
              onValueChange={setEscenasAnimadasEnabled}
              trackColor={{ false: "rgba(249,249,249,0.35)", true: "rgba(249,249,249,0.7)" }}
              thumbColor="#f9f9f9"
            />
          </View>

          {/* ── Escenas animadas: admin curadas + creaciones del usuario + CTA ── */}
          <View style={{ marginTop: 25 }}>
            <View style={[styles.sceneTitleRow, { marginTop: 10 }]}>
              <MaterialCommunityIcons name="star-four-points-outline" size={16} color="rgba(255,255,255,0.8)" />
              <Text style={styles.sceneTitle}>Escenas animadas</Text>
            </View>
            <View
              style={{
                flexDirection: "row",
                flexWrap: "wrap",
                gap: 12,
                marginTop: 4,
                justifyContent: "center",
              }}
            >
              {/* Escenas curadas por el admin (en orden sortOrder) */}
              {geoScenes.map((scene) => (
                <SceneAnimationCard
                  key={`admin-${scene.id}`}
                  scene={scene}
                  size={ANIM_CARD_SIZE}
                  height={ANIM_CARD_H}
                  onPress={() => {
                    setBgScene(scene);
                    handleClose();
                  }}
                />
              ))}
              {/* Creaciones del usuario en Geometrix (más nueva primero) + CTA */}
              {geometrixCreations.length > 0 && (
                <View style={userS.sectionRow}>
                  <View style={userS.sectionLine} />
                  <Text style={userS.sectionLabel}>Mis animaciones</Text>
                  <View style={userS.sectionLine} />
                </View>
              )}
              {geometrixCreations.map((creation) => (
                <SceneAnimationCard
                  key={`user-${creation.id}`}
                  scene={creationToSceneItem(creation)}
                  size={ANIM_CARD_SIZE}
                  height={ANIM_CARD_H}
                  onPress={() => {
                    setBgScene(creationToSceneAnimation(creation));
                    handleClose();
                  }}
                />
              ))}
              {/* CTA: siempre al final */}
              <SceneAnimationCtaCard
                size={ANIM_CARD_SIZE}
                height={ANIM_CARD_H}
                onPress={handleGoToGeometrix}
              />
            </View>
          </View>
        </ScrollView>
      </Animated.View>

      {/* ── Preview fullscreen (mismo Modal, absoluteFill encima) ─────────── */}
      {previewScene != null && (
        <Animated.View
          style={[styles.previewRoot, { transform: [{ translateY: previewSlideY }] }]}
        >
          {/* Imagen de fondo */}
          <Image
            source={previewScene.image}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
          />
          {/* Degradado oscuro */}
          <LinearGradient
            colors={["rgba(0,0,0,0.52)", "rgba(0,0,0,0.78)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Top row */}
          <View style={[styles.previewTop, { paddingTop: Math.max(insets.top, 20) + 10 }]}>
            <Pressable onPress={handleCancelPreview} hitSlop={10} style={styles.previewIconBtn}>
              <Feather name="x" size={28} color="#FFF" />
            </Pressable>
            <Text style={styles.previewTitle}>{previewScene.label}</Text>
          </View>

          {/* CTA anclado al fondo */}
          <View style={[styles.previewBottom, { paddingBottom: insets.bottom + 32 }]}>
            <Pressable
              style={({ pressed }) => [styles.ctaBtn, { opacity: pressed ? 0.82 : 1 }]}
              onPress={() => handleConfirmScene(previewScene.id)}
            >
              <Text style={styles.ctaBtnText}>Elegir escena</Text>
            </Pressable>
          </View>
        </Animated.View>
      )}

    </Modal>
  );
}

const styles = StyleSheet.create({
  // ── Main sheet ─────────────────────────────────────────────────────────────
  sheet: {
    ...StyleSheet.absoluteFillObject,
    paddingHorizontal: SHEET_H_PAD,
  },
  closeBtn: {
    alignSelf: "flex-start",
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  title: {
    fontFamily: "Manrope",
    fontSize: 22,
    fontWeight: "600",
    color: "#F9F9F9",
    textAlign: "center",
    marginBottom: 22,
    marginTop: -33,
  },
  volumeRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 10,
  },
  volumeLabelGroup: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  sliderGroup: {
    width: 175,
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  sliderWrap: { flex: 1 },
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 10,
  },
  controlIcon: { width: 20 },
  controlLabel: {
    fontFamily: "Manrope",
    flex: 1,
    fontSize: 16,
    fontWeight: "400",
    color: "#F9F9F9",
  },
  timerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  timerTriggerLabel: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.6)",
    letterSpacing: 0.3,
  },
  timerDropdown: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    overflow: "hidden",
    marginBottom: 4,
  },
  timerDropItem: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    alignItems: "center",
  },
  timerDropItemActive: {
    backgroundColor: "rgba(212,175,55,0.18)",
  },
  timerDropItemText: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "500",
    color: "#F6F6F6",
  },
  timerDropItemTextActive: {
    fontFamily: "Manrope",
    color: "#F7CB6B",
    fontWeight: "700",
  },
  divider: {
    height: 1,
    backgroundColor: WARM_DIVIDER,
    marginVertical: 12,
  },
  sceneTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 18,
  },
  sceneTitle: {
    fontFamily: "Manrope",
    fontSize: 17,
    fontWeight: "700",
    color: "#F9F9F9",
    letterSpacing: 0.2,
  },
  carousel: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: CARD_GAP,
    paddingBottom: 4,
  },
  cardWrap: {
    width: CARD_W,
    alignItems: "center",
  },
  card: {
    width: CARD_W,
    height: CARD_H,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: "rgba(61,14,22,0.40)",
    overflow: "hidden",
    backgroundColor: "#111",
  },
  cardActive: {
    borderColor: "rgba(255,255,255,0.7)",
    borderWidth: 2,
  },
  cardLabel: {
    fontFamily: "Manrope",
    marginTop: 13,
    fontSize: 14,
    color: "#F4F4F4",
    textAlign: "center",
  },
  cardLabelActive: {
    fontFamily: "Manrope",
    color: "#FFF",
    fontWeight: "600",
  },
  playingBadge: {
    position: "absolute",
    top: 7,
    right: 7,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 10,
    padding: 3,
  },

  // ── Fullscreen preview ──────────────────────────────────────────────────────
  previewRoot: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000",
  },
  previewTop: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  previewIconBtn: {
    width: 52,
    height: 52,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.42)",
    borderRadius: 26,
  },
  previewTitle: {
    fontFamily: "Manrope",
    flex: 1,
    textAlign: "center",
    fontSize: 19,
    fontWeight: "700",
    color: "#FFF",
    letterSpacing: 0.3,
  },
  previewScroll: {
    paddingHorizontal: 24,
    paddingTop: 4,
  },
  previewSection: {
    paddingVertical: 14,
  },
  previewSectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  previewSectionLabel: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "600",
    color: "rgba(255,255,255,0.82)",
  },
  previewSliderRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  previewDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginVertical: 2,
  },
  previewBottom: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    alignItems: "center",
  },
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 100,
    paddingVertical: 18,
    paddingHorizontal: 32,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 14,
    elevation: 8,
  },
  ctaBtnActive: {},
  ctaBtnText: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "600",
    color: "#2D2D2D",
    letterSpacing: 0.15,
  },
});
