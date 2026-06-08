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
  Alert,
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

import { SacredBackground } from "@/components/SacredBackground";
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

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  // Grid 2 columnas.
  const GAP = 14;
  const H_PAD = 20;
  const cardW = (width - H_PAD * 2 - GAP) / 2;
  const previewH = cardW * 0.82;

  function openCreation(c: GeometrixCreation) {
    router.navigate({ pathname: "/(tabs)/geometrix", params: { load: c.id } });
  }

  function startRename(c: GeometrixCreation) {
    setRenaming(c);
    setDraftName(c.name);
  }

  function commitRename() {
    if (renaming) renameCreation(renaming.id, draftName);
    setRenaming(null);
  }

  function confirmDelete(c: GeometrixCreation) {
    Alert.alert(
      "Eliminar creación",
      `¿Eliminar "${c.name}"? Esta acción no se puede deshacer.`,
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Eliminar", style: "destructive", onPress: () => deleteCreation(c.id) },
      ],
    );
  }

  function showActions(c: GeometrixCreation) {
    Alert.alert(c.name, undefined, [
      { text: "Renombrar", onPress: () => startRename(c) },
      { text: "Eliminar", style: "destructive", onPress: () => confirmDelete(c) },
      { text: "Cancelar", style: "cancel" },
    ]);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

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
                borderColor: colors.primary,
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <View style={[styles.newIcon, { backgroundColor: "rgba(190,150,80,0.12)" }]}>
              <Feather name="plus" size={26} color={colors.primary} />
            </View>
            <Text style={[styles.newLabel, { color: colors.primary }]}>Nueva composición</Text>
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
                      name="heart"
                      size={16}
                      color={c.liked ? "#E0989B" : "rgba(255,255,255,0.7)"}
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
});
