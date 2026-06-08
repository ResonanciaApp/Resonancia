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
import React, { useCallback, useState } from "react";
import {
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { LinearGradient } from "expo-linear-gradient";

import { SacredGlyph } from "@/components/SacredGlyph";
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
} from "@/data/geometrix-creations";

const DANGER = "#ef4444";

// Fondo premium oscuro: índigos, violetas, azulinos y púrpura (diagonal).
const CREACIONES_BG = ["#14102E", "#1C1448", "#2A1A5C", "#1A1340", "#0A0818"] as const;

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

export default function GeometrixCreacionesScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const { creations, toggleLiked, deleteCreation, renameCreation, reload } =
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

  return (
    <View style={[styles.root, { backgroundColor: "#0A0818" }]}>
      <StatusBar barStyle="light-content" />
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
          <View style={{ width: 38 }} />
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
              router.canGoBack() ? router.back() : router.replace("/(tabs)/geometrix" as never)
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
            <View style={[styles.newIcon, { backgroundColor: "rgba(21,28,58,0.35)" }]}>
              <Feather name="plus" size={26} color="#151c3a" />
            </View>
            <Text style={[styles.newLabel, { color: "#151c3a" }]}>Nueva composición</Text>
          </Pressable>

          {creations.map((c) => {
            // Fondo fiel a la receta: degradado (con brillo) > color sólido (con
            // brillo) > degradado por defecto de Inicio. Mismo criterio que el editor.
            const bgFactor = brightnessFactor(c.master.bgBrightness);
            const bgGrad = bgGradientColors(c.master.bgGradientId);
            const bgColors = c.master.bgColor
              ? ([scaleHex(c.master.bgColor, bgFactor), scaleHex(c.master.bgColor, bgFactor)] as const)
              : scaleColors(bgGrad ?? HOME_GRADIENT, bgFactor);
            return (
              <Pressable
                key={c.id}
                onPress={() => openCreation(c)}
                onLongPress={() => showActions(c)}
                style={({ pressed }) => [
                  styles.card,
                  { width: cardW, borderColor: colors.border, opacity: pressed ? 0.85 : 1 },
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
                  {c.active.map((id) => {
                    const s = c.settings[id];
                    if (!s) return null;
                    return (
                      <View key={id} style={StyleSheet.absoluteFill}>
                        <View style={styles.previewCenter}>
                          <SacredGlyph
                            id={id}
                            color={s.color}
                            gradient={gradientColors(s.gradientId)}
                            size={previewH * 0.78}
                            opacity={Math.max(0.15, s.opacity * c.master.opacity)}
                            strokeWidth={1 + s.thickness * 2}
                          />
                        </View>
                      </View>
                    );
                  })}

                  {/* Like */}
                  <Pressable
                    onPress={() => toggleLiked(c.id)}
                    hitSlop={10}
                    style={styles.likeBtn}
                  >
                    <Feather
                      name="thumbs-up"
                      size={16}
                      color={c.liked ? colors.primary : "rgba(255,255,255,0.7)"}
                      style={c.liked ? undefined : styles.likeIdle}
                    />
                  </Pressable>
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
          <Text style={[styles.emptyHint, { color: colors.mutedForeground }]}>
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
                  if (c) deleteCreation(c.id);
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

  card: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  preview: { width: "100%", overflow: "hidden" },
  previewCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  likeBtn: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  likeIdle: { opacity: 0.9 },

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
    backgroundColor: "#06070F",
    overflow: "hidden",
    paddingHorizontal: 14,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 4,
  },
  sheetTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#EDE1D3",
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
    backgroundColor: "rgba(190,150,80,0.12)",
    borderWidth: 1,
    borderColor: "rgba(190,150,80,0.4)",
  },
  sheetRowIconDanger: {
    backgroundColor: "rgba(239,68,68,0.12)",
    borderColor: "rgba(239,68,68,0.4)",
  },
  sheetRowText: { fontSize: 15, fontWeight: "600", color: "#EDE1D3" },
  sheetCancel: {
    marginTop: 6,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#161f33",
    alignItems: "center",
    justifyContent: "center",
  },
  sheetCancelText: { fontSize: 14, fontWeight: "600", color: "#7A8FA8" },

  confirmCard: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#151c3a",
    backgroundColor: "#06070F",
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
  confirmTitle: { fontSize: 19, fontWeight: "700", color: "#EDE1D3" },
  confirmSubtitle: {
    fontSize: 13.5,
    color: "#7A8FA8",
    textAlign: "center",
    lineHeight: 20,
  },
  confirmName: { color: "#EDE1D3", fontWeight: "600" },
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
  confirmBtnGhostText: { fontSize: 14, fontWeight: "600", color: "#7A8FA8" },
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
