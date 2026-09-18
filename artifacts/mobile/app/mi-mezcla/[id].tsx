/**
 * Detalle y edición de una mezcla guardada (propia del usuario).
 * Permite cambiar portada, nombre, descripción y reproducir.
 */
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { GoldGradientFill } from "@/components/GoldGradient";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  FlatList,
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
import { isIndigoThemeId } from "@/config/scene-themes";
import { formatMixImageLabel, getMixImage, MIX_IMAGE_GALLERY } from "@/config/mix-images";
import { getSoundImage } from "@/config/sound-images";
import { type MixPreset, useMixer } from "@/context/MixerContext";
import { useSounds } from "@/context/SoundsContext";
import { MIX_CATEGORIES, MIX_CATEGORY_ACTION_LABELS, type MixCategory } from "@/data/mix-categories";
import { type GeometryId } from "@/data/geometries";
import { useLibraryReturnBack } from "@/hooks/useLibraryReturnBack";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { REMOTE_SOUND_IMAGE_MAP } from "@/lib/remoteSoundMap";
import { IMAGE_TRANSITION } from "@/constants/imagePlaceholder";

const GOLD = "#F9F9F9";
const TEXT = "#FAF0EE";
const MUTED = "#c2c2c2";

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
            const source = remoteImage ? { uri: remoteImage } : localImage;

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
  currentImageKey,
  currentCoverUri,
  onClose,
  onPickImage,
  onPickPreset,
}: {
  visible: boolean;
  currentImageKey?: string;
  currentCoverUri?: string;
  onClose: () => void;
  onPickImage: (closeFn: () => void) => void;
  onPickPreset: (key: string) => void;
}) {
  const { theme } = useSceneTheme();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;
  const topOffset = (Platform.OS === "web" ? 67 : insets.top) + 50;
  const [selectedImageKey, setSelectedImageKey] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setSelectedImageKey(currentCoverUri ? null : (currentImageKey ?? null));
  }, [currentCoverUri, currentImageKey, visible]);

  const selectedSource = selectedImageKey
    ? getMixImage(selectedImageKey)
    : currentCoverUri
      ? { uri: currentCoverUri }
      : undefined;

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={ms.backdrop} onPress={onClose} />
      <View
        style={[
          ms.sheet,
          {
            top: topOffset,
            paddingBottom: bottomPad,
            backgroundColor: theme.gradient[theme.gradient.length - 1],
          },
        ]}
      >
        <LinearGradient
          colors={theme.gradient as unknown as [string, string, ...string[]]}
          locations={theme.gradientLocations}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={ms.handle} />
        <View style={ms.coverHeader}>
          <Text style={ms.sheetTitle}>Portada</Text>
          <Pressable
            onPress={onClose}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Cerrar selector de portada"
            style={({ pressed }) => [
              ms.coverCloseButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Feather name="x" size={18} color={GOLD} />
          </Pressable>
        </View>

        <View style={ms.selectedPreviewSlot}>
          {selectedSource && (
            <Image
              source={selectedSource}
              style={ms.selectedPreview}
              contentFit="cover"
              transition={IMAGE_TRANSITION}
            />
          )}
        </View>

        <Pressable
          style={({ pressed }) => [
            ms.uploadPill,
            { opacity: pressed ? 0.7 : 1 },
          ]}
          onPress={() => onPickImage(onClose)}
          accessibilityRole="button"
          accessibilityLabel="Agregar imagen desde la galería"
        >
          <Feather name="image" size={18} color={GOLD} />
          <Text style={ms.uploadPillText}>Agregar imagen</Text>
        </Pressable>

        <FlatList
          style={ms.presetGrid}
          data={MIX_IMAGE_GALLERY}
          keyExtractor={(key) => key}
          numColumns={5}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={ms.presetGridContent}
          columnWrapperStyle={ms.presetGridRow}
          renderItem={({ item: key }) => {
            const source = getMixImage(key);
            const selected = key === selectedImageKey;
            if (!source) return null;
            return (
              <Pressable
                onPress={() => {
                  setSelectedImageKey(key);
                  onPickPreset(key);
                }}
                accessibilityRole="button"
                accessibilityLabel={`Portada: ${formatMixImageLabel(key)}`}
                accessibilityState={{ selected }}
                style={({ pressed }) => [
                  ms.presetPhotoFrame,
                  selected && ms.presetPhotoFrameSelected,
                  { opacity: pressed ? 0.72 : 1 },
                ]}
              >
                <Image
                  source={source}
                  style={ms.presetPhoto}
                  contentFit="cover"
                  transition={IMAGE_TRANSITION}
                />
              </Pressable>
            );
          }}
        />
      </View>
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

  const { presets, updatePresetMeta, deletePreset } = useMixer();
  const { sounds: catalogSounds } = useSounds();

  const mix = useMemo(() => presets.find((p) => p.id === id), [presets, id]);

  const [category, setCategory] = useState<MixCategory>(mix?.category ?? "dormir");
  const [name, setName] = useState(mix?.name ?? "");
  const [pickerVisible, setPickerVisible] = useState(false);
  useEffect(() => {
    if (mix?.name) setName(mix.name);
  }, [mix?.name]);
  useEffect(() => {
    if (mix?.category) setCategory(mix.category);
  }, [mix?.category]);
  const profileBlockBackground = activeSceneId === "tibet"
    ? "rgba(0,0,0,0.15)"
    : isIndigoThemeId(activeSceneId)
      ? "rgba(181,211,255,0.057)"
      : "rgba(181,211,255,0.057)";
  const save = useCallback(
    (patch: Parameters<typeof updatePresetMeta>[1]) => {
      if (!id) return;
      updatePresetMeta(id, patch);
    },
    [id, updatePresetMeta],
  );

  const saveName = useCallback(() => {
    if (!mix) return;
    const trimmed = name.trim();
    if (!trimmed) {
      setName(mix.name);
      return;
    }
    if (trimmed !== mix.name) save({ name: trimmed });
    setName(trimmed);
  }, [mix, name, save]);

  const handleSave = useCallback(() => {
    saveName();
    goBack();
  }, [saveName, goBack]);

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
        <Pressable onPress={() => { saveName(); goBack(); }} hitSlop={12} style={s.iconBtn}>
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

        {/* Nombre */}
        <Text style={s.sectionTitle}>Nombre de la mezcla</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          onBlur={saveName}
          onSubmitEditing={saveName}
          returnKeyType="done"
          maxLength={60}
          selectTextOnFocus
          style={s.nameInput}
          placeholder="Nombre de la mezcla"
          placeholderTextColor={MUTED}
        />

        {/* Categoría */}
        <Text style={[s.sectionTitle, s.categorySectionTitle]}>Usa tu mezcla para</Text>
        <View style={s.catGrid}>
          {MIX_CATEGORIES.map((cat) => {
            const selected = category === cat.id;
            return (
              <Pressable
                key={cat.id}
                style={({ pressed }) => [
                  s.catCell,
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
                    {MIX_CATEGORY_ACTION_LABELS[cat.id]}
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
              const source = sound?.imageUrl
                ? { uri: sound.imageUrl }
                : (remoteImage ? { uri: remoteImage } : localImage);
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
          onPress={handleSave}
        >
          <LinearGradient
            colors={["#F9F9F9", "#F9F9F9"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Feather name="check" size={18} color="#060A0F" />
          <Text style={s.playBtnText}>Guardar</Text>
        </Pressable>
      </View>

      <CoverPickerSheet
        visible={pickerVisible}
        currentImageKey={mix.image}
        currentCoverUri={mix.coverUri}
        onClose={() => setPickerVisible(false)}
        onPickImage={async (closeFn) => {
          closeFn();
          await new Promise<void>((resolve) => setTimeout(resolve, 350));
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.85,
          });
          if (!result.canceled && result.assets[0]?.uri) {
            save({
              image: undefined,
              coverUri: result.assets[0].uri,
              coverGeometryId: undefined,
              coverCreationId: undefined,
              categoryChosen: true,
            });
          }
        }}
        onPickPreset={(key) =>
          save({ image: key, coverUri: undefined, coverGeometryId: undefined, coverCreationId: undefined, categoryChosen: true })
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
  nameInput: {
    height: 48,
    borderRadius: 100,
    paddingHorizontal: 18,
    backgroundColor: "rgba(0,0,0,0.28)",
    color: TEXT,
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "600",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    marginBottom: 0,
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
    color: "#060A0F",
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
    borderRadius: 27,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "rgba(0,0,0,0.28)",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    minHeight: 50,
  },
  catCellSelected: {
    borderColor: "rgba(255,255,255,0.10)",
    backgroundColor: "#F9F9F9",
  },
  catCellOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "transparent",
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
    color: "#F9F9F9",
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  catCellLabelSelected: {
    color: "#060A0F",
  },
  sectionTitle: {
    fontFamily: "Manrope",
    color: TEXT,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 17,
  },
  categorySectionTitle: {
    marginTop: 40,
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
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    overflow: "hidden",
    backgroundColor: "#190913",
  },
  handle: {
    alignSelf: "center",
    width: 36, height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(74,12,12,0.08)",
    marginTop: 10, marginBottom: 4,
  },
  sheetTitle: {
    fontFamily: "Manrope",
    flex: 1,
    color: TEXT,
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 0,
  },
  coverHeader: {
    minHeight: 36,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  coverCloseButton: {
    position: "absolute",
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  selectedPreviewSlot: {
    height: 170,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedPreview: {
    width: 115.5,
    height: 115.5,
    borderRadius: 20,
  },
  uploadPill: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    gap: 9,
    minWidth: 190,
    minHeight: 42,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 21,
    backgroundColor: "rgba(0,0,0,0.28)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  uploadPillText: {
    fontFamily: "Manrope",
    color: TEXT,
    fontSize: 14,
    fontWeight: "600",
  },
  presetGridContent: {
    paddingTop: 26,
    paddingBottom: 20,
  },
  presetGrid: {
    flex: 1,
  },
  presetGridRow: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  presetPhotoFrame: {
    width: 63,
    height: 63,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: "transparent",
    padding: 2,
  },
  presetPhotoFrameSelected: {
    borderColor: "#F9F9F9",
  },
  presetPhoto: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
  },
});
