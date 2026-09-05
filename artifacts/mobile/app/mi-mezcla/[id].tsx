/**
 * Detalle y edición de una mezcla guardada (propia del usuario).
 * Permite cambiar portada, nombre, descripción y reproducir.
 */
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { GoldGradientFill } from "@/components/GoldGradient";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  Alert,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredGlyph } from "@/components/SacredGlyph";
import { CreationCoverPreview } from "@/components/CreationCoverPreview";
import { isIndigoThemeId } from "@/config/scene-themes";
import { formatMixImageLabel, getMixImage, MIX_IMAGE_GALLERY } from "@/config/mix-images";
import { getSoundImage } from "@/config/sound-images";
import { type MixPreset, useMixer } from "@/context/MixerContext";
import { useSounds } from "@/context/SoundsContext";
import { MIX_CATEGORIES, type MixCategory } from "@/data/mix-categories";
import { type GeometryId } from "@/data/geometries";
import { useLoadMix } from "@/hooks/useLoadMix";
import { useLibraryReturnBack } from "@/hooks/useLibraryReturnBack";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { REMOTE_SOUND_IMAGE_MAP } from "@/lib/remoteSoundMap";

const GOLD = "#F9F9F9";
const TEXT = "#FAF0EE";
const MUTED = "#c2c2c2";

const MIX_CATEGORY_LABELS: Record<MixCategory, string> = {
  motivarme: "Meditar",
  concentracion: "Enfocarme",
  dormir: "Descansar",
  trabajar: "Energizarme",
  paz_interior: "Paz interior",
  magico: "Soltar la pena",
};

// ── Portada de mezcla (exportada para usar en biblioteca) ─────────────────────
export function MixCover({
  mix,
  size = 120,
  radius = 16,
  showSoundStack = true,
  placeholderBackgroundColor,
}: {
  mix: Pick<MixPreset, "image" | "coverUri" | "coverGeometryId" | "coverCreationId" | "sounds">;
  size?: number;
  radius?: number;
  showSoundStack?: boolean;
  placeholderBackgroundColor?: string;
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

  const stackedSounds = mix.sounds.slice(0, 3);
  if (showSoundStack && stackedSounds.length > 0) {
    const thumbSize = size * 0.74;
    const shift = stackedSounds.length > 1
      ? (size - thumbSize) / (stackedSounds.length - 1)
      : 0;
    const stackRadius = Math.max(5, radius * 0.78);

    return (
      <View style={[containerStyle, { backgroundColor: "transparent" }]}>
        <View style={{ width: size, height: thumbSize, position: "relative" }}>
          {stackedSounds.map((sound, index) => {
            const localImage = getSoundImage(sound.id);
            const remoteImage = REMOTE_SOUND_IMAGE_MAP[sound.id];
            const source = localImage ?? (remoteImage ? { uri: remoteImage } : undefined);

            return (
              <View
                key={`${sound.id}-${index}`}
                style={{
                  position: "absolute",
                  left: index * shift,
                  top: 0,
                  width: thumbSize,
                  height: thumbSize,
                  zIndex: index,
                  borderRadius: stackRadius,
                  overflow: "hidden",
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.20)",
                  backgroundColor: "#24131D",
                }}
              >
                {source ? (
                  <Image source={source} style={{ width: thumbSize, height: thumbSize }} contentFit="cover" />
                ) : (
                  <LinearGradient
                    colors={["#4D293F", "#24131D"]}
                    style={StyleSheet.absoluteFill}
                  />
                )}
              </View>
            );
          })}
        </View>
      </View>
    );
  }

  return (
    <View
      style={[
        containerStyle,
        placeholderBackgroundColor ? { backgroundColor: placeholderBackgroundColor } : null,
      ]}
    >
      <Feather name="image" size={size * 0.34} color="rgba(249,249,249,0.68)" />
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
  const { id, fromLibrary } = useLocalSearchParams<{ id: string; fromLibrary?: string }>();
  const goBack = useLibraryReturnBack(fromLibrary, "mezclas");

  const { theme, activeSceneId } = useSceneTheme();
  const bgGradient = theme.gradient;

  const { presets, updatePresetMeta, loadedPresetId, isPlaying, togglePlay, deletePreset } = useMixer();
  const { sounds: catalogSounds } = useSounds();
  const loadMix = useLoadMix();

  const mix = useMemo(() => presets.find((p) => p.id === id), [presets, id]);

  const [category, setCategory] = useState<MixCategory>(mix?.category ?? "dormir");
  const [pickerVisible, setPickerVisible] = useState(false);
  const profileBlockBackground = activeSceneId === "tibet"
    ? "rgba(0,0,0,0.15)"
    : isIndigoThemeId(activeSceneId)
      ? "rgba(255,255,255,0.05)"
      : "rgba(255,255,255,0.05)";
  const listenNowBtnColors: [string, string, ...string[]] = isIndigoThemeId(activeSceneId)
    ? ["#784576", "#50326E"]
    : ["#F9F9F9", "#F9F9F9"];

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
          goBack();
        },
      },
    ]);
  }, [mix, id, deletePreset, goBack]);

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
        <Pressable onPress={goBack} hitSlop={12} style={s.iconBtn}>
          <Feather name="arrow-left" size={22} color={TEXT} />
        </Pressable>
        <Text style={s.headerTitle} numberOfLines={1}>{mix.name}</Text>
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
        <View style={s.coverWrap}>
          <Pressable onPress={() => setPickerVisible(true)}>
            <MixCover
              mix={mix}
              size={160}
              radius={20}
              showSoundStack={false}
              placeholderBackgroundColor={profileBlockBackground}
            />
          </Pressable>
          <Pressable style={s.coverEditBadge} onPress={() => setPickerVisible(true)} hitSlop={8}>
            <GoldGradientFill />
            <Feather name="camera" size={14} color="#1B060F" />
          </Pressable>
        </View>

        {/* Categoría */}
        <Text style={s.sectionTitle}>Usa tu mezcla para</Text>
        <View style={s.catGrid}>
          {MIX_CATEGORIES.map((cat) => {
            const selected = category === cat.id;
            return (
              <Pressable
                key={cat.id}
                style={({ pressed }) => [
                  s.catCell,
                  { backgroundColor: profileBlockBackground },
                  selected && s.catCellSelected,
                  { opacity: pressed ? 0.82 : 1 },
                ]}
                onPress={() => {
                  setCategory(cat.id);
                  save({ category: cat.id, categoryChosen: true });
                }}
              >
                {selected && <View style={s.catCellOverlay} />}
                <View style={s.catCellLabelRow}>
                  <Text style={[s.catCellLabel, selected && s.catCellLabelSelected]} numberOfLines={1}>
                    {MIX_CATEGORY_LABELS[cat.id]}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>

        {/* Sonidos usados */}
        <Text style={s.sectionTitle}>Sonidos utilizados</Text>
        <ScrollView
          style={mix.sounds.length > 5 ? s.soundList : undefined}
          nestedScrollEnabled
          scrollEnabled={mix.sounds.length > 5}
          showsVerticalScrollIndicator={mix.sounds.length > 5}
        >
          <View style={s.soundListContent}>
            {mix.sounds.map((activeSound, index) => {
              const sound = catalogSounds.find((candidate) => candidate.id === activeSound.id);
              const localImage = getSoundImage(activeSound.id);
              const remoteImage = REMOTE_SOUND_IMAGE_MAP[activeSound.id];
              const source = localImage ?? (remoteImage ? { uri: remoteImage } : undefined);
              const fallbackName = activeSound.id.replace(/[-_]/g, " ");

              return (
                <View
                  key={`${activeSound.id}-${index}`}
                  style={s.soundRow}
                >
                  <View style={s.soundThumb}>
                    {source ? (
                      <Image source={source} style={StyleSheet.absoluteFill} contentFit="cover" />
                    ) : (
                      <Feather name="image" size={20} color="rgba(249,249,249,0.55)" />
                    )}
                  </View>
                  <Text style={s.soundName} numberOfLines={1}>
                    {sound?.name ?? fallbackName}
                  </Text>
                </View>
              );
            })}
          </View>
        </ScrollView>

      </ScrollView>

      {/* ── Botón flotante Reproducir ──────────────────────────────────────── */}
      <View style={[s.floatingBar, { paddingBottom: insets.bottom + 12 }]}>
        <Pressable
          style={({ pressed }) => [s.playBtn, { opacity: pressed ? 0.85 : 1, overflow: "hidden" }]}
          onPress={handlePlay}
        >
          <LinearGradient
            colors={listenNowBtnColors}
            start={{ x: 0, y: 0 }}
            end={{ x: isIndigoThemeId(activeSceneId) ? 1 : 0, y: isIndigoThemeId(activeSceneId) ? 0 : 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Feather name={isPlayingThis ? "pause" : "play"} size={18} color="#F9F9F9" />
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
    color: "#F9F9F9",
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
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    minHeight: 50,
  },
  catCellSelected: {
    borderColor: "rgba(249,249,249,0.7)",
  },
  catCellOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(249,249,249,0.08)",
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
  sectionTitle: {
    fontFamily: "Manrope",
    color: TEXT,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 17,
  },
  soundList: {
    maxHeight: 300,
  },
  soundListContent: {
    gap: 8,
    paddingBottom: 10,
  },
  soundRow: {
    minHeight: 62,
    borderRadius: 14,
    padding: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "transparent",
  },
  soundThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  soundName: {
    flex: 1,
    fontFamily: "Manrope",
    color: TEXT,
    fontSize: 15,
    fontWeight: "600",
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
