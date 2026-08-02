/**
 * Detalle y edición de una mezcla guardada (propia del usuario).
 * Permite cambiar portada, nombre, descripción y reproducir.
 */
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { GoldGradientFill } from "@/components/GoldGradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredGlyph } from "@/components/SacredGlyph";
import { CreationCoverPreview } from "@/components/CreationCoverPreview";
import { formatMixImageLabel, getMixImage, MIX_IMAGE_GALLERY } from "@/config/mix-images";
import { type MixPreset, useMixer } from "@/context/MixerContext";
import { MIX_CATEGORIES, type MixCategory } from "@/data/mix-categories";
import { type GeometryId } from "@/data/geometries";
import { useLoadMix } from "@/hooks/useLoadMix";
import { useSceneTheme } from "@/context/SceneThemeContext";

const GOLD = "#dad4ec";
const TEXT = "#FAF0EE";
const MUTED = "#c2c2c2";

// ── Portada de mezcla (exportada para usar en biblioteca) ─────────────────────
export function MixCover({
  mix,
  size = 120,
  radius = 16,
}: {
  mix: Pick<MixPreset, "image" | "coverUri" | "coverGeometryId" | "coverCreationId">;
  size?: number;
  radius?: number;
}) {
  const img = mix.image ? getMixImage(mix.image) : undefined;
  const containerStyle = {
    width: size,
    height: size,
    borderRadius: radius,
    overflow: "hidden" as const,
    backgroundColor: "rgba(255,255,255,0.055)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  };

  if (mix.coverCreationId) {
    return (
      <View style={containerStyle}>
        <CreationCoverPreview creationId={mix.coverCreationId} size={size} />
      </View>
    );
  }
  if (mix.coverGeometryId) {
    return (
      <View style={containerStyle}>
        <SacredGlyph
          id={mix.coverGeometryId as GeometryId}
          color={GOLD}
          size={size * 0.55}
          strokeWidth={1.4}
          opacity={1}
        />
      </View>
    );
  }
  if (mix.coverUri) {
    return (
      <View style={containerStyle}>
        <Image
          source={{ uri: mix.coverUri }}
          style={{ width: size, height: size }}
          contentFit="cover"
        />
      </View>
    );
  }
  if (img) {
    return (
      <View style={containerStyle}>
        <Image
          source={img as number}
          style={{ width: size, height: size }}
          contentFit="cover"
        />
      </View>
    );
  }
  return (
    <View style={containerStyle}>
      <MaterialCommunityIcons name="tune-variant" size={size * 0.4} color={MUTED} />
    </View>
  );
}

// ── Cover picker sheet ────────────────────────────────────────────────────────
function CoverPickerSheet({
  visible,
  onClose,
  onPickPreset,
  onClearCover,
}: {
  visible: boolean;
  onClose: () => void;
  onPickPreset: (key: string) => void;
  onClearCover: () => void;
}) {
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;

  if (!visible) return null;

  return (
    <Modal visible animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={ms.backdrop} onPress={onClose} />
      <LinearGradient colors={["#190913", "#190913"]} style={[ms.sheet, { paddingBottom: bottomPad + 8 }]}>
        <View style={ms.handle} />
        <Text style={ms.sheetTitle}>Elige una imagen</Text>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 12 }}>
          <View style={ms.gridRow}>
            {MIX_IMAGE_GALLERY.map((key) => {
              const img = getMixImage(key);
              return (
                <Pressable
                  key={key}
                  style={({ pressed }) => [ms.presetThumb, { opacity: pressed ? 0.7 : 1 }]}
                  onPress={() => { onPickPreset(key); onClose(); }}
                >
                  {img ? (
                    <Image source={img as number} style={ms.presetThumbImg} contentFit="cover" />
                  ) : (
                    <View style={[ms.presetThumbImg, { backgroundColor: "rgba(212,175,55,0.15)", alignItems: "center", justifyContent: "center" }]}>
                      <Feather name="image" size={20} color={MUTED} />
                    </View>
                  )}
                  <Text style={ms.presetLabel} numberOfLines={1}>{formatMixImageLabel(key)}</Text>
                </Pressable>
              );
            })}
          </View>
          <Pressable
            style={({ pressed }) => [ms.row, { borderBottomWidth: 0, marginTop: 8, opacity: pressed ? 0.7 : 1 }]}
            onPress={() => { onClearCover(); onClose(); }}
          >
            <Feather name="x-circle" size={20} color={MUTED} />
            <Text style={[ms.rowText, { color: MUTED }]}>Quitar portada</Text>
          </Pressable>
        </ScrollView>
      </LinearGradient>
    </Modal>
  );
}

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function MiMezclaScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { theme } = useSceneTheme();
  const bgGradient = theme.gradient;

  const { presets, updatePresetMeta, loadedPresetId, isPlaying, togglePlay, deletePreset } = useMixer();
  const loadMix = useLoadMix();

  const mix = useMemo(() => presets.find((p) => p.id === id), [presets, id]);

  const [name, setName] = useState(mix?.name ?? "");
  const [description, setDescription] = useState(mix?.description ?? "");
  const [category, setCategory] = useState<MixCategory>(mix?.category ?? "dormir");
  const [pickerVisible, setPickerVisible] = useState(false);

  const isThisLoaded = loadedPresetId === id;
  const isPlayingThis = isThisLoaded && isPlaying;

  const save = useCallback(
    (patch: Parameters<typeof updatePresetMeta>[1]) => {
      if (!id) return;
      updatePresetMeta(id, patch);
    },
    [id, updatePresetMeta],
  );

  const handlePlay = useCallback(() => {
    if (!mix) return;
    if (isThisLoaded) {
      togglePlay();
    } else {
      loadMix(mix);
    }
  }, [mix, isThisLoaded, togglePlay, loadMix]);

  const handleDelete = useCallback(() => {
    Alert.alert("Eliminar mezcla", `¿Eliminar "${mix?.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => {
          deletePreset(id!);
          router.back();
        },
      },
    ]);
  }, [mix, id, deletePreset]);

  if (!mix) {
    return (
      <LinearGradient colors={bgGradient} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: MUTED }}>Mezcla no encontrada</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={bgGradient} style={{ flex: 1 }}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 12 }]}>
        <Pressable onPress={() => router.back()} hitSlop={12} style={s.iconBtn}>
          <Feather name="arrow-left" size={22} color={TEXT} />
        </Pressable>
        <Text style={s.headerTitle} numberOfLines={1}>Mi mezcla</Text>
        <Pressable onPress={handleDelete} hitSlop={12} style={s.iconBtn}>
          <Feather name="trash-2" size={20} color="rgba(224,92,92,0.75)" />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 96 }}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Portada */}
        <Pressable style={s.coverWrap} onPress={() => setPickerVisible(true)}>
          <MixCover mix={mix} size={160} radius={20} />
          <View style={s.coverEditBadge}>
            <GoldGradientFill />
            <Feather name="camera" size={14} color="#1B060F" />
          </View>
        </Pressable>

        {/* Nombre */}
        <Text style={s.label}>Nombre</Text>
        <TextInput
          style={s.input}
          value={name}
          onChangeText={setName}
          onBlur={() => { if (name.trim()) save({ name: name.trim() }); }}
          placeholder="Nombre de tu mezcla"
          placeholderTextColor={MUTED}
          returnKeyType="done"
          onSubmitEditing={() => {
            if (name.trim()) save({ name: name.trim() });
            Keyboard.dismiss();
          }}
        />

        {/* Grid de categorías — fila única */}
        <View style={s.catGrid}>
          {MIX_CATEGORIES.map((cat) => {
            const selected = category === cat.id;
            return (
              <Pressable
                key={cat.id}
                style={({ pressed }) => [s.catCell, selected && s.catCellSelected, { opacity: pressed ? 0.82 : 1 }]}
                onPress={() => {
                  setCategory(cat.id);
                  save({ category: cat.id, categoryChosen: true });
                }}
              >
                {selected && <View style={s.catCellOverlay} />}
                <View style={s.catCellLabelRow}>
                  <Text style={[s.catCellLabel, selected && s.catCellLabelSelected]} numberOfLines={1}>
                    {cat.label}
                  </Text>
                  {selected && <Feather name="check-circle" size={12} color={GOLD} />}
                </View>
              </Pressable>
            );
          })}
        </View>

      </ScrollView>

      {/* ── Botón flotante Reproducir ──────────────────────────────────────── */}
      <View style={[s.floatingBar, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          style={({ pressed }) => [s.playBtn, { opacity: pressed ? 0.85 : 1, overflow: "hidden" }]}
          onPress={handlePlay}
        >
          <GoldGradientFill />
          <Feather name={isPlayingThis ? "pause" : "play"} size={18} color="#1B060F" />
          <Text style={s.playBtnText}>{isPlayingThis ? "Pausar" : "Reproducir mezcla"}</Text>
        </Pressable>
      </View>

      <CoverPickerSheet
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onPickPreset={(key) =>
          save({ image: key, coverUri: undefined, coverGeometryId: undefined, coverCreationId: undefined, categoryChosen: true })
        }
        onClearCover={() =>
          save({ image: undefined, coverUri: undefined, coverGeometryId: undefined, coverCreationId: undefined })
        }
      />
    </LinearGradient>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 8,
  },
  iconBtn: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Manrope",
    flex: 1,
    color: TEXT,
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  coverWrap: {
    alignSelf: "center",
    marginTop: 8,
    marginBottom: 28,
  },
  coverEditBadge: {
    position: "absolute",
    bottom: 8,
    right: 8,
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#1B060F",
  },
  label: {
    fontFamily: "Manrope",
    color: MUTED,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
    fontFamily: "Manrope",
    backgroundColor: "rgba(74,12,12,0.35)",
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(61,14,22,0.6)",
    color: TEXT,
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 20,
  },
  inputMulti: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  floatingBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  playBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 50,
    borderRadius: 25,
  },
  playBtnText: {
    fontFamily: "Manrope",
    color: "#1B060F",
    fontSize: 16,
    fontWeight: "700",
  },
  catGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 28,
  },
  catCell: {
    width: "31%",
    flexGrow: 1,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 2,
    borderColor: "transparent",
    backgroundColor: "rgba(74,12,12,0.35)",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    minHeight: 50,
  },
  catCellSelected: {
    borderColor: GOLD,
  },
  catCellOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(212,175,55,0.10)",
  },
  catCellLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingHorizontal: 4,
  },
  catCellLabel: {
    fontFamily: "Manrope",
    color: MUTED,
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  catCellLabelSelected: {
    color: GOLD,
  },
});

// ── Estilos del picker ────────────────────────────────────────────────────────
const ms = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    maxHeight: "80%",
  },
  handle: {
    alignSelf: "center",
    width: 36, height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(74,12,12,0.35)",
    marginTop: 10, marginBottom: 4,
  },
  sheetTitle: {
    fontFamily: "Manrope",
    color: TEXT,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginVertical: 14,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(61,14,22,0.40)",
  },
  rowText: {
    fontFamily: "Manrope",
    flex: 1,
    color: TEXT,
    fontSize: 15,
  },
  gridRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    justifyContent: "flex-start",
  },
  presetThumb: {
    width: "30%",
    alignItems: "center",
    gap: 4,
  },
  presetThumbImg: {
    width: 80,
    height: 80,
    borderRadius: 12,
  },
  presetLabel: {
    fontFamily: "Manrope",
    color: MUTED,
    fontSize: 11,
    textTransform: "capitalize",
  },
  geoItem: {
    width: "30%",
    alignItems: "center",
    gap: 4,
  },
  geoThumb: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: "rgba(212,175,55,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  geoName: {
    fontFamily: "Manrope",
    color: MUTED,
    fontSize: 11,
    textAlign: "center",
  },
  creationItem: {
    width: "47%",
    alignItems: "center",
    gap: 6,
  },
  creationThumb: {
    width: 100,
    height: 100,
    borderRadius: 12,
    overflow: "hidden",
  },
  creationGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "space-between",
  },
  creationItem2col: {
    width: "47%",
    alignItems: "center",
    gap: 8,
  },
  creationThumb2col: {
    width: "100%",
    aspectRatio: 1,
    borderRadius: 14,
    overflow: "hidden",
  },
});
