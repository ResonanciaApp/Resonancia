/**
 * "Mis creaciones" (Geometrix) — lista las composiciones guardadas como datos
 * (receta) y permite reabrirlas en el editor, marcarlas como favoritas,
 * renombrarlas o borrarlas. Cada preview se DIBUJA en vivo desde la receta
 * (no es una imagen): mismas capas, colores y opacidades que el editor.
 *
 * Local-first (AsyncStorage). La sincronización con cuenta es un paso futuro.
 */
import { Feather } from "@expo/vector-icons";
import { router, useFocusEffect } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TurboModuleRegistry,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { LinearGradient } from "expo-linear-gradient";

import { useAuth } from "@clerk/expo";

import { useShareGlyph } from "@workspace/api-client-react";

import { SacredGlyph } from "@/components/SacredGlyph";
import { baseOf, type GeometryId } from "@/data/geometries";
import { useColors } from "@/hooks/useColors";
import { useGeometrixCreations } from "@/hooks/useGeometrixCreations";
import {
  bgGradientColors,
  brightnessFactor,
  gradientColors,
  HOME_GRADIENT,
  scaleColors,
  scaleHex,
  type GeometrixCreation,
  type GeoSettings,
} from "@/data/geometrix-creations";

const DANGER = "#ef4444";

// Tamaño en árbol del render oculto que se captura como póster. La captura se
// reescala a 1080×1080 (los SVG escalan nítidos).
const EXPORT_SIZE = 540;

// Fondo premium oscuro: índigos, violetas, azulinos y púrpura (diagonal).
// Oscurecido un 90% (se conserva el 10% del brillo) sobre el degradado original
// ["#14102E","#1C1448","#2A1A5C","#1A1340","#0A0818"].
const CREACIONES_BG = ["#2C1C4F", "#1F113C", "#181234"] as const;

function formatRelative(iso: string): string {
  const then = new Date(iso).getTime();
  const diff = Date.now() - then;
  const min = Math.floor(diff / 60000);
  if (min < 1) return "recién";
  if (min < 60) return `hace ${min} min`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `hace ${hours} h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days} d`;
  return new Date(iso).toLocaleDateString("es", { day: "numeric", month: "short" });
}

/**
 * ¿La composición tiene movimiento? Solo si el movimiento general (panel
 * maestro) está activo y al menos una capa activa gira, respira o tiene fundido
 * cíclico. Si no, la card es estática y no muestra el botón de play.
 */
function hasMotion(c: GeometrixCreation): boolean {
  if (!c.master.motion) return false;
  return c.active.some((id) => {
    const s = c.settings[id];
    return !!s && (s.rotate || s.rotateLeft || (s.breatheAmount ?? 0) > 0 || (s.fadeLoopAmount ?? 0) > 0);
  });
}

/**
 * Capa animada para la preview de la card. Replica el movimiento del editor
 * (giro + respiración + fundido cíclico) pero a tamaño de miniatura. Cuando
 * `playing` es false queda en reposo (igual que la preview estática anterior).
 */
function PreviewGlyph({
  id,
  settings,
  masterOpacity,
  motion,
  index,
  size,
  playing,
}: {
  id: GeometryId;
  settings: GeoSettings;
  masterOpacity: number;
  motion: boolean;
  index: number;
  size: number;
  playing: boolean;
}) {
  const rot = useSharedValue(0);
  const pulse = useSharedValue(0);
  const fade = useSharedValue(1);

  const { rotate, rotateLeft, rotateSpeed, breatheAmount, fadeLoopAmount } = settings;
  const active = playing && motion;
  const spin = (rotate || rotateLeft) && active;
  const breath = (breatheAmount ?? 0) > 0 && active;
  const dir = rotateLeft ? -1 : 1;

  const safeSpeed = Number.isFinite(rotateSpeed) ? Math.max(0, Math.min(1, rotateSpeed)) : 0.5;
  const spinDuration = ((38000 + index * 6000) / (0.5 + safeSpeed * 2.5)) * 1.6;
  const safeAmount = Number.isFinite(breatheAmount) ? Math.max(0, Math.min(1, breatheAmount)) : 0;
  const breatheDepth = 0.04 + safeAmount * 0.2;
  const restAngle = Number.isFinite(settings.manualAngle) ? settings.manualAngle : 0;

  useEffect(() => {
    if (!spin) {
      cancelAnimation(rot);
      rot.value = 0;
      return;
    }
    rot.value = withRepeat(
      withTiming(1, { duration: spinDuration, easing: Easing.linear }),
      -1,
      false,
    );
    return () => cancelAnimation(rot);
  }, [spin, spinDuration, rot]);

  useEffect(() => {
    if (!breath) {
      cancelAnimation(pulse);
      pulse.value = 0;
      return;
    }
    pulse.value = withRepeat(
      withTiming(1, { duration: 6000 + index * 800, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
    return () => cancelAnimation(pulse);
  }, [breath, index, pulse]);

  useEffect(() => {
    const safeFade = Number.isFinite(fadeLoopAmount) ? Math.max(0, Math.min(1, fadeLoopAmount ?? 0)) : 0;
    if (safeFade > 0 && active) {
      const minOpacity = 1 - safeFade * 0.85;
      fade.value = withRepeat(
        withTiming(minOpacity, { duration: 4200 + index * 600, easing: Easing.inOut(Easing.ease) }),
        -1,
        true,
      );
      return () => cancelAnimation(fade);
    }
    cancelAnimation(fade);
    fade.value = withTiming(1, { duration: 400 });
  }, [fadeLoopAmount, active, index, fade]);

  const baseOpacity = Math.max(0.15, settings.opacity * masterOpacity);
  const aStyle = useAnimatedStyle(() => ({
    transform: [
      { rotate: spin ? `${rot.value * 360 * dir}deg` : `${restAngle}deg` },
      { scale: breath ? 1 - breatheDepth + pulse.value * breatheDepth : 1 },
    ],
    opacity: baseOpacity * fade.value,
  }));

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, styles.previewCenter, aStyle]}
      pointerEvents="none"
    >
      <SacredGlyph
        id={id}
        color={settings.color}
        gradient={gradientColors(settings.gradientId)}
        size={size}
        strokeWidth={1 + settings.thickness * 2}
      />
    </Animated.View>
  );
}

export default function GeometrixCreacionesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { creations, deleteCreation, renameCreation, reload } =
    useGeometrixCreations();

  // Refrescar al volver a la pantalla (para ver lo recién guardado).
  useFocusEffect(
    useCallback(() => {
      reload();
    }, [reload]),
  );

  // Modal de renombrar (cross-platform; Alert.prompt es solo iOS).
  const [renaming, setRenaming] = useState<GeometrixCreation | null>(null);
  const [draftName, setDraftName] = useState("");
  // Menú de acciones (3 puntitos), confirmación de borrado y menú al tocar la
  // imagen (Editar/Play), todos con estilo temático.
  const [actionsFor, setActionsFor] = useState<GeometrixCreation | null>(null);
  const [deletingFor, setDeletingFor] = useState<GeometrixCreation | null>(null);
  const [openingFor, setOpeningFor] = useState<GeometrixCreation | null>(null);
  // Card cuya preview está reproduciendo el movimiento en vivo (solo una a la vez).
  const [playingId, setPlayingId] = useState<string | null>(null);
  // Exportar como imagen (póster): elección de formato + render oculto a capturar.
  const [exportChooser, setExportChooser] = useState<GeometrixCreation | null>(null);
  const [exportReq, setExportReq] = useState<{
    creation: GeometrixCreation;
    transparent: boolean;
  } | null>(null);
  const [exporting, setExporting] = useState(false);
  const exportRef = useRef<View>(null);
  const capturingRef = useRef(false);

  const { isSignedIn } = useAuth();
  const shareGlyphMutation = useShareGlyph();
  const [sharingFor, setSharingFor] = useState<GeometrixCreation | null>(null);
  const [shareName, setShareName] = useState("");
  const [sharePosting, setSharePosting] = useState(false);

  async function doShareGlyph() {
    if (!sharingFor) return;
    setSharePosting(true);
    try {
      await shareGlyphMutation.mutateAsync({
        data: {
          name: shareName.trim() || sharingFor.name,
          recipe: {
            active: sharingFor.active,
            master: sharingFor.master,
            settings: sharingFor.settings as Record<string, unknown>,
          },
        },
      });
      setSharingFor(null);
      Alert.alert("¡Publicado!", "Tu composición ya está en el muro de la comunidad.");
    } catch {
      Alert.alert("Error al compartir", "Verificá tu conexión e intentá de nuevo.");
    } finally {
      setSharePosting(false);
    }
  }

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  // Grid 2 columnas.
  const GAP = 14;
  const H_PAD = 20;
  const cardW = (width - H_PAD * 2 - GAP) / 2;
  const previewH = cardW * 0.82;

  function openCreation(c: GeometrixCreation) {
    setOpeningFor(c);
  }

  function startRename(c: GeometrixCreation) {
    setRenaming(c);
    setDraftName(c.name);
  }

  function commitRename() {
    if (renaming) renameCreation(renaming.id, draftName);
    setRenaming(null);
  }

  function showActions(c: GeometrixCreation) {
    setActionsFor(c);
  }

  // Guarda el archivo capturado en la galería; si no hay permiso o módulo,
  // cae al menú de compartir (incluye "Guardar imagen").
  async function saveImage(uri: string) {
    try {
      const MediaLibrary = await import("expo-media-library");
      const perm = await MediaLibrary.requestPermissionsAsync();
      if (perm.granted) {
        await MediaLibrary.saveToLibraryAsync(uri);
        Alert.alert("Listo", "La imagen se guardó en tu galería.");
        return;
      }
    } catch {
      // sin módulo nativo / permiso: continuar con compartir
    }
    try {
      const Sharing = await import("expo-sharing");
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri);
        return;
      }
    } catch {
      // ignore
    }
    Alert.alert(
      "No se pudo descargar",
      "Activá el permiso de fotos para guardar la imagen en tu galería.",
    );
  }

  // Captura del render oculto. Se dispara desde el onLayout del lienzo (cuando
  // ya está montado y medido), no con un timeout fijo (race en dispositivos
  // lentos). Un cerrojo evita capturas solapadas (onLayout puede repetirse).
  async function runCapture() {
    if (capturingRef.current || !exportReq) return;
    const node = exportRef.current;
    if (!node) return;

    // Verificar disponibilidad del módulo nativo ANTES de importar la librería.
    // TurboModuleRegistry.get() devuelve null en lugar de tirar (a diferencia de
    // getEnforcing que lanza un error fatal que el runtime intercepta antes del
    // try/catch). Esto ocurre en Expo Go, que no incluye react-native-view-shot.
    if (!TurboModuleRegistry.get("RNViewShot")) {
      setExportReq(null);
      setExporting(false);
      Alert.alert(
        "Función no disponible en Expo Go",
        "La descarga de imágenes requiere la versión instalada de la app (build nativo). Está disponible una vez publicada en las tiendas.",
      );
      return;
    }

    capturingRef.current = true;
    try {
      // Dos frames para que SVG/Animated terminen de pintar antes de capturar.
      await new Promise<void>((resolve) =>
        requestAnimationFrame(() => requestAnimationFrame(() => resolve())),
      );
      const { captureRef } = await import("react-native-view-shot");
      const uri = await captureRef(node, {
        format: exportReq.transparent ? "png" : "jpg",
        quality: 1,
        width: 1080,
        height: 1080,
      });
      await saveImage(uri);
    } catch {
      Alert.alert(
        "No se pudo generar la imagen",
        "Volvé a intentar en un momento. Si el problema sigue, actualizá la app a la última versión.",
      );
    } finally {
      capturingRef.current = false;
      setExportReq(null);
      setExporting(false);
    }
  }

  function startExport(c: GeometrixCreation, transparent: boolean) {
    setExportChooser(null);
    setExporting(true);
    setExportReq({ creation: c, transparent });
  }

  return (
    <View style={[styles.root, { backgroundColor: "#181234" }]}>
      <StatusBar barStyle="light-content" />

      {/* Render oculto que se captura como póster. Queda detrás del degradado
          opaco de fondo (no visible) pero montado y medible para captureRef.
          PNG → fondo transparente (sin gradiente); JPG → con fondo. */}
      {exportReq && (
        <View pointerEvents="none" style={styles.exportHidden}>
          <View
            ref={exportRef}
            collapsable={false}
            style={styles.exportCanvas}
            onLayout={runCapture}
          >
            {!exportReq.transparent &&
              (() => {
                const c = exportReq.creation;
                const bgFactor = brightnessFactor(c.master.bgBrightness);
                const bgGrad = bgGradientColors(c.master.bgGradientId);
                const bgColors = c.master.bgColor
                  ? ([
                      scaleHex(c.master.bgColor, bgFactor),
                      scaleHex(c.master.bgColor, bgFactor),
                    ] as const)
                  : scaleColors(bgGrad ?? HOME_GRADIENT, bgFactor);
                return (
                  <LinearGradient
                    colors={bgColors as readonly [string, string, ...string[]]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                );
              })()}
            {exportReq.creation.active.map((id, i) => {
              const s = exportReq.creation.settings[id];
              if (!s) return null;
              return (
                <PreviewGlyph
                  key={id}
                  id={baseOf(id)}
                  index={i}
                  settings={s}
                  masterOpacity={exportReq.creation.master.opacity}
                  motion={false}
                  size={EXPORT_SIZE * 0.78}
                  playing={false}
                />
              );
            })}
          </View>
        </View>
      )}
      <LinearGradient
        colors={CREACIONES_BG}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.9, y: 1 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: 100 + bottomPad,
          paddingTop: topPad + 12,
          paddingHorizontal: H_PAD,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/(tabs)/geometrix" as never)
            }
            hitSlop={10}
            style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="arrow-left" size={18} color={colors.foreground} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Feather name="grid" size={18} color={colors.primary} />
            <Text style={[styles.headerTitle, { color: colors.foreground }]}>Mis creaciones</Text>
          </View>
          <Pressable
            onPress={() => router.push("/geometrix-comunidad")}
            hitSlop={10}
            style={[styles.backBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="users" size={18} color={colors.primary} />
          </Pressable>
        </View>

        {creations.length > 0 && (
          <Text style={[styles.count, { color: colors.mutedForeground }]}>
            {creations.length} composici{creations.length === 1 ? "ón" : "ones"}
          </Text>
        )}

        {/* Grid */}
        <View style={[styles.grid, { gap: GAP }]}>
          {/* Card "Nueva composición" */}
          <Pressable
            onPress={() =>
              router.navigate({
                pathname: "/(tabs)/geometrix",
                params: { new: "1" },
              } as never)
            }
            style={({ pressed }) => [
              styles.newCard,
              {
                width: cardW,
                height: previewH + 64,
                borderColor: "#151c3a",
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <View style={[styles.newIcon, { backgroundColor: "rgba(123,100,255,0.15)" }]}>
              <Feather name="plus" size={26} color="#FFFFFF" />
            </View>
            <Text style={[styles.newLabel, { color: "#FFFFFF" }]}>Nueva composición</Text>
          </Pressable>

          {creations.map((c) => {
            // Fondo fiel a la receta: degradado (con brillo) > color sólido (con
            // brillo) > degradado por defecto de Inicio. Mismo criterio que el editor.
            const bgFactor = brightnessFactor(c.master.bgBrightness);
            const bgGrad = bgGradientColors(c.master.bgGradientId);
            const bgColors = c.master.bgColor
              ? ([scaleHex(c.master.bgColor, bgFactor), scaleHex(c.master.bgColor, bgFactor)] as const)
              : scaleColors(bgGrad ?? HOME_GRADIENT, bgFactor);
            const motion = hasMotion(c);
            const isPlaying = playingId === c.id;
            return (
              <Pressable
                key={c.id}
                onPress={() => openCreation(c)}
                onLongPress={() => showActions(c)}
                style={({ pressed }) => [
                  styles.card,
                  { width: cardW, borderColor: "#151c3a", opacity: pressed ? 0.85 : 1 },
                ]}
              >
                {/* Preview en vivo */}
                <View style={[styles.preview, { height: previewH }]}>
                  <LinearGradient
                    colors={bgColors as readonly [string, string, ...string[]]}
                    start={{ x: 0.5, y: 0 }}
                    end={{ x: 0.5, y: 1 }}
                    style={StyleSheet.absoluteFill}
                  />
                  {c.active.map((id, i) => {
                    const s = c.settings[id];
                    if (!s) return null;
                    return (
                      <PreviewGlyph
                        key={id}
                        id={baseOf(id)}
                        index={i}
                        settings={s}
                        masterOpacity={c.master.opacity}
                        motion={c.master.motion}
                        size={previewH * 0.78}
                        playing={isPlaying}
                      />
                    );
                  })}

                  {/* Botón de play: solo en composiciones con movimiento. */}
                  {motion && (
                    <Pressable
                      onPress={(e) => {
                        e.stopPropagation();
                        setPlayingId((prev) => (prev === c.id ? null : c.id));
                      }}
                      hitSlop={8}
                      style={styles.playBtn}
                    >
                      <Feather
                        name={isPlaying ? "pause" : "play"}
                        size={14}
                        color="#F4DAD5"
                        style={isPlaying ? undefined : { marginLeft: 1 }}
                      />
                    </Pressable>
                  )}
                </View>

                {/* Info */}
                <View style={styles.info}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={[styles.name, { color: colors.foreground }]} numberOfLines={1}>
                      {c.name}
                    </Text>
                    <Text style={[styles.meta, { color: colors.mutedForeground }]} numberOfLines={1}>
                      {c.active.length} geometría{c.active.length !== 1 ? "s" : ""} ·{" "}
                      {formatRelative(c.updatedAt)}
                    </Text>
                  </View>
                  <Pressable onPress={() => showActions(c)} hitSlop={10} style={styles.moreBtn}>
                    <Feather name="more-horizontal" size={18} color={colors.mutedForeground} />
                  </Pressable>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Empty state (solo la card "Nueva" cuando no hay nada guardado) */}
        {creations.length === 0 && (
          <Text style={[styles.emptyHint, { color: "#BBA8E8" }]}>
            Armá una composición en Geometrix y tocá "Guardar" para verla acá.
          </Text>
        )}
      </ScrollView>

      {/* Modal de renombrar */}
      <Modal visible={!!renaming} transparent animationType="fade" onRequestClose={() => setRenaming(null)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setRenaming(null)}>
          <Pressable
            style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {}}
          >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Renombrar</Text>
            <TextInput
              value={draftName}
              onChangeText={setDraftName}
              autoFocus
              placeholder="Nombre"
              placeholderTextColor={colors.mutedForeground}
              style={[
                styles.modalInput,
                { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background },
              ]}
              onSubmitEditing={commitRename}
              returnKeyType="done"
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setRenaming(null)} style={styles.modalBtn}>
                <Text style={[styles.modalBtnText, { color: colors.mutedForeground }]}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={commitRename} style={styles.modalBtn}>
                <Text style={[styles.modalBtnText, { color: colors.primary, fontWeight: "700" }]}>
                  Guardar
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Menú de acciones (3 puntitos) — estilo temático navy + dorado. */}
      <Modal
        visible={!!actionsFor}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setActionsFor(null)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setActionsFor(null)}>
          <Pressable style={styles.sheetCard} onPress={() => {}}>
            <LinearGradient
              colors={HOME_GRADIENT}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <Text style={styles.sheetTitle} numberOfLines={1}>
              {actionsFor?.name}
            </Text>
            <Pressable
              style={styles.sheetRow}
              onPress={() => {
                const c = actionsFor;
                setActionsFor(null);
                if (c) startRename(c);
              }}
              accessibilityRole="button"
            >
              <View style={styles.sheetRowIcon}>
                <Feather name="edit-2" size={17} color={colors.primary} />
              </View>
              <Text style={styles.sheetRowText}>Renombrar</Text>
            </Pressable>
            <Pressable
              style={styles.sheetRow}
              onPress={() => {
                const c = actionsFor;
                setActionsFor(null);
                if (c) setExportChooser(c);
              }}
              accessibilityRole="button"
            >
              <View style={styles.sheetRowIcon}>
                <Feather name="download" size={17} color={colors.primary} />
              </View>
              <Text style={styles.sheetRowText}>Descargar</Text>
            </Pressable>
            <Pressable
              style={styles.sheetRow}
              onPress={() => {
                const c = actionsFor;
                setActionsFor(null);
                if (!isSignedIn) {
                  Alert.alert(
                    "Iniciá sesión",
                    "Para compartir en el muro de la comunidad necesitás tener una cuenta.",
                  );
                  return;
                }
                if (c) {
                  setShareName(c.name);
                  setSharingFor(c);
                }
              }}
              accessibilityRole="button"
            >
              <View style={styles.sheetRowIcon}>
                <Feather name="users" size={17} color={colors.primary} />
              </View>
              <Text style={styles.sheetRowText}>Compartir en comunidad</Text>
            </Pressable>
            <Pressable
              style={styles.sheetRow}
              onPress={() => {
                const c = actionsFor;
                setActionsFor(null);
                if (c) setDeletingFor(c);
              }}
              accessibilityRole="button"
            >
              <View style={[styles.sheetRowIcon, styles.sheetRowIconDanger]}>
                <Feather name="trash-2" size={17} color={DANGER} />
              </View>
              <Text style={[styles.sheetRowText, { color: DANGER }]}>Eliminar</Text>
            </Pressable>
            <Pressable
              style={styles.sheetCancel}
              onPress={() => setActionsFor(null)}
              accessibilityRole="button"
            >
              <Text style={styles.sheetCancelText}>Cancelar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Elección de formato para descargar la composición como imagen. */}
      <Modal
        visible={!!exportChooser}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setExportChooser(null)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setExportChooser(null)}>
          <Pressable style={styles.sheetCard} onPress={() => {}}>
            <LinearGradient
              colors={HOME_GRADIENT}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <Text style={styles.sheetTitle} numberOfLines={1}>
              Descargar imagen
            </Text>
            <Pressable
              style={styles.sheetRow}
              onPress={() => exportChooser && startExport(exportChooser, false)}
              accessibilityRole="button"
            >
              <View style={styles.sheetRowIcon}>
                <Feather name="image" size={17} color={colors.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.sheetRowText}>JPG</Text>
                <Text style={styles.sheetRowSub}>Imagen con fondo</Text>
              </View>
            </Pressable>
            <Pressable
              style={styles.sheetRow}
              onPress={() => exportChooser && startExport(exportChooser, true)}
              accessibilityRole="button"
            >
              <View style={styles.sheetRowIcon}>
                <Feather name="layers" size={17} color={colors.primary} />
              </View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Text style={styles.sheetRowText}>PNG</Text>
                <Text style={styles.sheetRowSub}>Fondo transparente</Text>
              </View>
            </Pressable>
            <Pressable
              style={styles.sheetCancel}
              onPress={() => setExportChooser(null)}
              accessibilityRole="button"
            >
              <Text style={styles.sheetCancelText}>Cancelar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Modal de compartir en el muro de la comunidad */}
      <Modal
        visible={!!sharingFor}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setSharingFor(null)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setSharingFor(null)}>
          <Pressable
            style={[styles.modalCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {}}
          >
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>
              Compartir en comunidad
            </Text>
            <Text style={{ fontSize: 13, color: "#BBA8E8", lineHeight: 18 }}>
              Tu composición aparecerá en el muro de Geometrix para que otros la vean y puedan darle me gusta.
            </Text>
            <TextInput
              value={shareName}
              onChangeText={setShareName}
              autoFocus
              placeholder="Nombre de la composición"
              placeholderTextColor={colors.mutedForeground}
              maxLength={40}
              style={[
                styles.modalInput,
                { color: colors.foreground, borderColor: colors.border, backgroundColor: colors.background },
              ]}
              onSubmitEditing={doShareGlyph}
              returnKeyType="send"
            />
            <View style={styles.modalActions}>
              <Pressable onPress={() => setSharingFor(null)} style={styles.modalBtn}>
                <Text style={[styles.modalBtnText, { color: colors.mutedForeground }]}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={doShareGlyph} style={styles.modalBtn} disabled={sharePosting}>
                {sharePosting ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Text style={[styles.modalBtnText, { color: colors.primary, fontWeight: "700" }]}>
                    Publicar
                  </Text>
                )}
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Overlay mientras se genera el póster. */}
      {exporting && (
        <View style={styles.exportOverlay} pointerEvents="auto">
          <View style={styles.exportToast}>
            <ActivityIndicator color={colors.primary} />
            <Text style={styles.exportToastText}>Generando imagen…</Text>
          </View>
        </View>
      )}

      {/* Menú al tocar la imagen de la creación (Editar/Play) — estilo temático. */}
      <Modal
        visible={!!openingFor}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setOpeningFor(null)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setOpeningFor(null)}>
          <Pressable style={styles.sheetCard} onPress={() => {}}>
            <LinearGradient
              colors={HOME_GRADIENT}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <Text style={styles.sheetTitle} numberOfLines={1}>
              {openingFor?.name}
            </Text>
            <Pressable
              style={styles.sheetRow}
              onPress={() => {
                const c = openingFor;
                setOpeningFor(null);
                if (c)
                  router.navigate({
                    pathname: "/(tabs)/geometrix",
                    params: { load: c.id },
                  });
              }}
              accessibilityRole="button"
            >
              <View style={styles.sheetRowIcon}>
                <Feather name="edit-3" size={17} color={colors.primary} />
              </View>
              <Text style={styles.sheetRowText}>Editar</Text>
            </Pressable>
            <Pressable
              style={styles.sheetRow}
              onPress={() => {
                const c = openingFor;
                setOpeningFor(null);
                if (c)
                  router.navigate({
                    pathname: "/(tabs)/geometrix",
                    params: { load: c.id, play: "1" },
                  });
              }}
              accessibilityRole="button"
            >
              <View style={styles.sheetRowIcon}>
                <Feather name="play" size={17} color={colors.primary} />
              </View>
              <Text style={styles.sheetRowText}>Play</Text>
            </Pressable>
            <Pressable
              style={styles.sheetCancel}
              onPress={() => setOpeningFor(null)}
              accessibilityRole="button"
            >
              <Text style={styles.sheetCancelText}>Cancelar</Text>
            </Pressable>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Confirmación de borrado — mismo estilo temático. */}
      <Modal
        visible={!!deletingFor}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setDeletingFor(null)}
      >
        <Pressable style={styles.sheetBackdrop} onPress={() => setDeletingFor(null)}>
          <Pressable style={styles.confirmCard} onPress={() => {}}>
            <LinearGradient
              colors={HOME_GRADIENT}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View style={styles.confirmIcon}>
              <Feather name="trash-2" size={24} color={DANGER} />
            </View>
            <Text style={styles.confirmTitle}>Eliminar creación</Text>
            <Text style={styles.confirmSubtitle}>
              ¿Eliminar <Text style={styles.confirmName}>“{deletingFor?.name}”</Text>? Esta
              acción no se puede deshacer.
            </Text>
            <View style={styles.confirmActions}>
              <Pressable
                style={styles.confirmBtnGhost}
                onPress={() => setDeletingFor(null)}
                accessibilityRole="button"
              >
                <Text style={styles.confirmBtnGhostText}>Cancelar</Text>
              </Pressable>
              <Pressable
                style={styles.confirmBtnDanger}
                onPress={() => {
                  const c = deletingFor;
                  setDeletingFor(null);
                  if (c) {
                    if (playingId === c.id) setPlayingId(null);
                    deleteCreation(c.id);
                  }
                }}
                accessibilityRole="button"
              >
                <Text style={styles.confirmBtnDangerText}>Eliminar</Text>
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

  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", textAlign: "center" },
  count: { fontSize: 13, marginBottom: 14 },

  grid: { flexDirection: "row", flexWrap: "wrap" },

  newCard: {
    borderRadius: 16,
    borderWidth: 1.5,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  newIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  newLabel: { fontSize: 13, fontWeight: "600" },

  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden", backgroundColor: "rgba(123,100,255,0.05)" },
  preview: { width: "100%", overflow: "hidden" },
  previewCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  playBtn: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderWidth: 1,
    borderColor: "rgba(123,100,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },

  info: { flexDirection: "row", alignItems: "center", gap: 8, padding: 10 },
  name: { fontSize: 13, fontWeight: "700", marginBottom: 2 },
  meta: { fontSize: 11 },
  moreBtn: { padding: 2, flexShrink: 0 },

  emptyHint: { fontSize: 13, textAlign: "center", marginTop: 20, lineHeight: 20, paddingHorizontal: 20 },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  modalCard: { width: "100%", borderRadius: 18, borderWidth: 1, padding: 20, gap: 14 },
  modalTitle: { fontSize: 16, fontWeight: "700" },
  modalInput: { borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12, fontSize: 15 },
  modalActions: { flexDirection: "row", justifyContent: "flex-end", gap: 8 },
  modalBtn: { paddingHorizontal: 14, paddingVertical: 8 },
  modalBtnText: { fontSize: 14 },

  // Popups temáticos (navy + dorado) — igual estilo que los de Geometrix.
  sheetBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  sheetCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#151c3a",
    backgroundColor: "#130A3A",
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 4,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F4DAD5",
    paddingHorizontal: 8,
    paddingBottom: 10,
  },
  sheetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 12,
  },
  sheetRowIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(212,175,55,0.12)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.40)",
  },
  sheetRowIconDanger: {
    backgroundColor: "rgba(239,68,68,0.12)",
    borderColor: "rgba(239,68,68,0.4)",
  },
  sheetRowText: { fontSize: 15, fontWeight: "600", color: "#F4DAD5" },
  sheetRowSub: { fontSize: 12, color: "rgba(242,231,228,0.45)", marginTop: 1 },
  exportHidden: {
    position: "absolute",
    left: 0,
    top: 0,
    width: EXPORT_SIZE,
    height: EXPORT_SIZE,
  },
  exportCanvas: {
    width: EXPORT_SIZE,
    height: EXPORT_SIZE,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  exportOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
  exportToast: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 22,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#151c3a",
    backgroundColor: "#130A3A",
  },
  exportToastText: { fontSize: 14, fontWeight: "600", color: "#F4DAD5" },
  sheetCancel: {
    marginTop: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#161f33",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetCancelText: { fontSize: 14, fontWeight: "600", color: "rgba(242,231,228,0.45)" },

  confirmCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#151c3a",
    backgroundColor: "#130A3A",
    overflow: "hidden",
    paddingHorizontal: 22,
    paddingTop: 22,
    paddingBottom: 18,
    alignItems: "center",
    gap: 10,
  },
  confirmIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(239,68,68,0.12)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.4)",
    marginBottom: 2,
  },
  confirmTitle: { fontSize: 19, fontWeight: "700", color: "#F4DAD5" },
  confirmSubtitle: {
    fontSize: 13.5,
    color: "rgba(242,231,228,0.45)",
    textAlign: "center",
    lineHeight: 20,
  },
  confirmName: { color: "#F4DAD5", fontWeight: "600" },
  confirmActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 14,
    alignSelf: "stretch",
  },
  confirmBtnGhost: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#161f33",
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnGhostText: { fontSize: 14, fontWeight: "600", color: "rgba(242,231,228,0.45)" },
  confirmBtnDanger: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: DANGER,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmBtnDangerText: { fontSize: 14, fontWeight: "700", color: "#ffffff" },
});
