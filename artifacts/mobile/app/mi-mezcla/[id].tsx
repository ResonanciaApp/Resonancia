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
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredGlyph } from "@/components/SacredGlyph";
import { CreationCoverPreview } from "@/components/CreationCoverPreview";
import Animated from "react-native-reanimated";
import { ScrollProgressIndicator, useScrollProgress } from "@/components/ScrollProgressIndicator";
import { isIndigoThemeId } from "@/config/scene-themes";
import { formatMixImageLabel, getMixImage } from "@/config/mix-images";
import { getSoundImage } from "@/config/sound-images";
import { type MixPreset, useMixer } from "@/context/MixerContext";
import { useSounds } from "@/context/SoundsContext";
import { type GeometryId } from "@/data/geometries";
import { useLibraryReturnBack } from "@/hooks/useLibraryReturnBack";
import { useBackOverride } from "@/context/BackOverrideContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useMixerPanel } from "@/context/MixerPanelContext";
import { REMOTE_SOUND_IMAGE_MAP } from "@/lib/remoteSoundMap";
import { IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { catalogImage, useCoverPresetCatalog } from "@/lib/cover-preset-catalog";

const GOLD = "#F9F9F9";
const TEXT = "#FAF0EE";
const MUTED = "#c2c2c2";

// ── Portada de mezcla (exportada para usar en biblioteca) ─────────────────────
export function MixCover({
  mix,
  size = 120,
  radius = 16,
  showSoundStack = true,
  allowDefaultImage = true,
  placeholderBackgroundColor,
}: {
  mix: Pick<MixPreset, "image" | "coverUri" | "coverGeometryId" | "coverCreationId" | "sounds">;
  size?: number;
  radius?: number;
  showSoundStack?: boolean;
  allowDefaultImage?: boolean;
  placeholderBackgroundColor?: string;
}) {
  const catalog = useCoverPresetCatalog("mix");
  const img = mix.image
    ? catalog.find((item) => item.key === mix.image || item.id === mix.image)?.source
      ?? catalogImage("mix", mix.image)
      ?? getMixImage(mix.image, allowDefaultImage)
    : undefined;
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
  const catalog = useCoverPresetCatalog("mix");
  const coverScrollProgress = useScrollProgress(visible);
  const gradientLocations =
    theme.gradientLocations?.length === theme.gradient.length
      ? theme.gradientLocations
      : undefined;

  useEffect(() => {
    if (!visible) return;
    setSelectedImageKey(currentCoverUri ? null : (currentImageKey ?? null));
  }, [currentCoverUri, currentImageKey, visible]);

  const selectedSource = selectedImageKey
    ? catalog.find((item) => item.key === selectedImageKey || item.id === selectedImageKey)?.source
      ?? catalogImage("mix", selectedImageKey)
      ?? getMixImage(selectedImageKey)
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
          locations={gradientLocations}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
        <View style={ms.handle} />
        <View style={ms.coverHeader}>
          <Text style={ms.sheetTitle}>Portada</Text>
          <Pressable
            style={({ pressed }) => [
              ms.coverUploadButton,
              { opacity: pressed ? 0.7 : 1 },
            ]}
            onPress={() => onPickImage(onClose)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Agregar imagen desde la galería"
          >
            <Feather name="image" size={18} color={TEXT} />
          </Pressable>
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
            <Feather name="x" size={22} color={GOLD} />
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

        <View style={ms.presetGrid}>
        <Animated.FlatList
          style={ms.presetGrid}
          onScroll={coverScrollProgress.onScroll}
          onLayout={coverScrollProgress.onLayout}
          onContentSizeChange={coverScrollProgress.onContentSizeChange}
          scrollEventThrottle={16}
           data={catalog}
           keyExtractor={(item) => item.id}
          numColumns={5}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={ms.presetGridContent}
          columnWrapperStyle={ms.presetGridRow}
           renderItem={({ item }) => {
             const source = item.source;
             const selected = item.key === selectedImageKey || item.id === selectedImageKey;
            if (!source) return null;
            return (
              <Pressable
                onPress={() => {
                   setSelectedImageKey(item.key);
                   onPickPreset(item.key);
                }}
                accessibilityRole="button"
                 accessibilityLabel={`Portada: ${item.label || formatMixImageLabel(item.key)}`}
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
        <ScrollProgressIndicator progress={coverScrollProgress} />
        </View>
      </View>
    </Modal>
  );
}

// ── Menú de mezcla (tres puntos) ─────────────────────────────────────────────
function MixMenuSheet({
  visible,
  onClose,
  onShare,
  onEditMix,
  onNameAndData,
}: {
  visible: boolean;
  onClose: () => void;
  onShare: () => void;
  onEditMix: () => void;
  onNameAndData: () => void;
}) {
  const { theme } = useSceneTheme();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;
  const menuBackgroundColor =
    theme.gradient[2] ??
    theme.gradient[theme.gradient.length - 1];

  const actions: {
    icon: React.ComponentProps<typeof Feather>["name"];
    label: string;
    action: () => void;
    destructive?: boolean;
  }[] = [
    { icon: "share", label: "Compartir", action: onShare },
    { icon: "sliders", label: "Editar mezcla", action: onEditMix },
    { icon: "edit-2", label: "Nombre y datos", action: onNameAndData },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={menuSt.backdrop} onPress={onClose} />
      <View
        style={[
          menuSt.sheet,
          { paddingBottom: bottomPad + 8, backgroundColor: menuBackgroundColor },
        ]}
      >
        <View style={menuSt.handle} />
        {actions.map(({ icon, label, action, destructive }) => (
          <Pressable
            key={label}
            style={({ pressed }) => [menuSt.row, { opacity: pressed ? 0.7 : 1 }]}
            onPress={action}
          >
            <Feather name={icon} size={20} color={destructive ? "#E05C5C" : GOLD} />
            <Text style={[menuSt.rowText, destructive && menuSt.rowTextDestructive]}>
              {label}
            </Text>
          </Pressable>
        ))}
      </View>
    </Modal>
  );
}

// ── Nombre y datos de la mezcla ──────────────────────────────────────────────
function EditMixInfoModal({
  visible,
  mix,
  onClose,
  onSave,
  onChangeCover,
  onDelete,
}: {
  visible: boolean;
  mix: MixPreset;
  onClose: () => void;
  onSave: (name: string) => void;
  onChangeCover: () => void;
  onDelete: () => void;
}) {
  const { theme } = useSceneTheme();
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;
  const [draftName, setDraftName] = useState("");

  useEffect(() => {
    if (visible) setDraftName(mix.name);
  }, [mix.name, visible]);

  const handleSave = () => {
    const trimmed = draftName.trim();
    if (!trimmed) return;
    onSave(trimmed);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={infoSt.backdrop}>
        <View style={[infoSt.sheet, { paddingBottom: bottomPad }]}>
          <LinearGradient
            colors={theme.gradient as unknown as [string, string, ...string[]]}
            style={StyleSheet.absoluteFill}
          />
          <View style={infoSt.handle} />
          <View style={infoSt.header}>
            <Pressable onPress={onClose} hitSlop={12} style={infoSt.closeBtn}>
              <Feather name="x" size={20} color={MUTED} />
            </Pressable>
            <Text style={infoSt.title}>Nombre y datos</Text>
            <Pressable onPress={handleSave} hitSlop={12}>
              <Text style={infoSt.saveText}>Guardar</Text>
            </Pressable>
          </View>

          <ScrollView
            style={{ flex: 1 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <Pressable
              style={({ pressed }) => [infoSt.coverRow, { opacity: pressed ? 0.7 : 1 }]}
              onPress={onChangeCover}
            >
              <MixCover mix={mix} size={52} radius={8} showSoundStack={false} />
              <View style={{ flex: 1 }}>
                <Text style={infoSt.coverLabel}>Foto de portada</Text>
                <Text style={infoSt.coverSub}>Toca para cambiar</Text>
              </View>
              <Feather name="chevron-right" size={18} color={MUTED} />
            </Pressable>

            <Text style={infoSt.fieldLabel}>Nombre</Text>
            <TextInput
              style={infoSt.input}
              value={draftName}
              onChangeText={setDraftName}
              placeholder="Nombre de la mezcla"
              placeholderTextColor={MUTED}
              returnKeyType="done"
              onSubmitEditing={handleSave}
              maxLength={60}
            />

            <Pressable
              style={({ pressed }) => [infoSt.deleteBtn, { opacity: pressed ? 0.7 : 1 }]}
              onPress={onDelete}
            >
              <Feather name="trash-2" size={16} color="#E05252" />
              <Text style={infoSt.deleteBtnText}>Eliminar mezcla</Text>
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function MiMezclaScreen({ id: idProp }: { id?: string } = {}) {
  const insets = useSafeAreaInsets();
  const { id: idParam, fromLibrary } = useLocalSearchParams<{ id: string; fromLibrary?: string }>();
  const id = idProp ?? idParam;
  const backOverride = useBackOverride();
  const libraryBack = useLibraryReturnBack(backOverride ? undefined : fromLibrary, "mezclas");
  const goBack = backOverride ?? libraryBack;

  const { theme, activeSceneId } = useSceneTheme();
  const bgGradient = theme.gradient;

  const { presets, updatePresetMeta, deletePreset, loadPreset } = useMixer();
  const { openMixer } = useMixerPanel();
  const { sounds: catalogSounds } = useSounds();

  const mix = useMemo(() => presets.find((p) => p.id === id), [presets, id]);

  const [name, setName] = useState(mix?.name ?? "");
  const [pickerVisible, setPickerVisible] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [editInfoVisible, setEditInfoVisible] = useState(false);
  useEffect(() => {
    if (mix?.name) setName(mix.name);
  }, [mix?.name]);
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

  const handleShare = useCallback(async () => {
    if (!mix) return;
    setMenuVisible(false);
    await Share.share({
      message: `${mix.name}\n${mix.sounds.length} sonido${mix.sounds.length !== 1 ? "s" : ""}`,
    });
  }, [mix]);

  const handleEditMix = useCallback(() => {
    if (!mix) return;
    setMenuVisible(false);
    saveName();
    loadPreset(mix);
    goBack();
    requestAnimationFrame(openMixer);
  }, [goBack, loadPreset, mix, openMixer, saveName]);

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
        <Pressable
          onPress={() => { saveName(); goBack(); }}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Volver a Biblioteca"
          style={({ pressed }) => [
            s.iconBtn,
            s.headerMenuButton,
            { opacity: pressed ? 0.7 : 1 },
          ]}
        >
          <Feather
            name="chevron-left"
            size={28}
            color="#FBFBFB"
            style={{ transform: [{ translateX: -1 }] }}
          />
        </Pressable>
        <Text style={s.headerTitle} numberOfLines={1}>{mix.name}</Text>
        <Pressable
          onPress={() => setMenuVisible(true)}
          hitSlop={12}
          style={[s.iconBtn, s.headerMenuButton]}
          accessibilityRole="button"
          accessibilityLabel="Abrir opciones de la mezcla"
        >
          <Feather name="more-horizontal" size={22} color="#FFFFFF" />
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

        {/* Sonidos usados */}
        <View style={s.soundSectionHeader}>
          <Text style={[s.sectionTitle, s.soundSectionTitle]}>Sonidos utilizados</Text>
        </View>
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

      <MixMenuSheet
        visible={menuVisible}
        onClose={() => setMenuVisible(false)}
        onShare={handleShare}
        onEditMix={handleEditMix}
        onNameAndData={() => {
          setMenuVisible(false);
          setTimeout(() => setEditInfoVisible(true), 300);
        }}
      />

      <EditMixInfoModal
        visible={editInfoVisible}
        mix={mix}
        onClose={() => setEditInfoVisible(false)}
        onSave={(nextName) => {
          setName(nextName);
          save({ name: nextName });
        }}
        onChangeCover={() => {
          setEditInfoVisible(false);
          setTimeout(() => setPickerVisible(true), 300);
        }}
        onDelete={() => {
          setEditInfoVisible(false);
          setTimeout(handleDelete, 300);
        }}
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
    width: 43,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
  },
  headerMenuButton: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    backgroundColor: "rgba(0,0,0,0.16)",
    borderWidth: 0,
    borderColor: "transparent",
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
    color: "#060A0F",
    fontSize: 16,
    fontWeight: "700",
  },
  sectionTitle: {
    fontFamily: "Manrope",
    color: TEXT,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 17,
  },
  soundSectionHeader: {
    alignItems: "flex-start",
    marginTop: 20,
  },
  soundSectionTitle: {
    textAlign: "left",
  },
  soundList: {
    maxHeight: 300,
  },
  soundListContent: {
    gap: 8,
    paddingBottom: 10,
  },
  soundRow: {
    minHeight: 100,
    borderRadius: 14,
    padding: 7,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "transparent",
  },
  soundThumb: {
    width: 86.4,
    height: 86.4,
    borderRadius: 18,
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
    backgroundColor: "rgba(255,255,255,0.1)",
    marginTop: 10, marginBottom: 4,
    transform: [{ translateY: 5 }],
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
    minHeight: 63,
    paddingTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  coverCloseButton: {
    position: "absolute",
    left: 0,
    top: 20,
    width: 43,
    height: 43,
    borderRadius: 21.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.16)",
    borderWidth: 0,
    borderColor: "transparent",
  },
  selectedPreviewSlot: {
    marginTop: 10,
    height: 170,
    alignItems: "center",
    justifyContent: "center",
  },
  selectedPreview: {
    width: 115.5,
    height: 115.5,
    borderRadius: 20,
  },
  coverUploadButton: {
    position: "absolute",
    right: 0,
    top: 20,
    zIndex: 1,
    width: 43,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21.5,
    backgroundColor: "rgba(0,0,0,0.16)",
    borderWidth: 0,
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

const menuSt = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    overflow: "hidden",
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginTop: 10,
    marginBottom: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(61,14,22,0.35)",
  },
  rowText: {
    fontFamily: "Manrope",
    color: TEXT,
    fontSize: 15,
    fontWeight: "600",
  },
  rowTextDestructive: {
    color: "#E05C5C",
  },
});

const infoSt = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },
  sheet: {
    height: "80%",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    overflow: "hidden",
    paddingHorizontal: 20,
  },
  handle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(212,175,55,0.25)",
    marginTop: 10,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontFamily: "Manrope",
    flex: 1,
    textAlign: "center",
    color: TEXT,
    fontSize: 16,
    fontWeight: "700",
  },
  saveText: {
    fontFamily: "Manrope",
    color: GOLD,
    fontSize: 15,
    fontWeight: "700",
  },
  coverRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 14,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(61,14,22,0.35)",
  },
  coverLabel: {
    fontFamily: "Manrope",
    color: TEXT,
    fontSize: 14,
    fontWeight: "600",
  },
  coverSub: {
    fontFamily: "Manrope",
    color: MUTED,
    fontSize: 12,
    marginTop: 2,
  },
  fieldLabel: {
    fontFamily: "Manrope",
    color: MUTED,
    fontSize: 12,
    fontWeight: "600",
    marginTop: 16,
    marginBottom: 6,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    fontFamily: "Manrope",
    backgroundColor: "rgba(0,0,0,0.16)",
    borderRadius: 10,
    padding: 12,
    color: TEXT,
    fontSize: 15,
    borderWidth: 0,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 32,
    marginBottom: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(224,82,82,0.35)",
    backgroundColor: "rgba(224,82,82,0.08)",
  },
  deleteBtnText: {
    fontFamily: "Manrope",
    color: "#E05252",
    fontSize: 15,
    fontWeight: "600",
  },
});
