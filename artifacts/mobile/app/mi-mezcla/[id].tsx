/**
 * Detalle y edición de una mezcla guardada (propia del usuario).
 * Permite cambiar portada, nombre, descripción y reproducir.
 */
import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
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
import { getSoundImage } from "@/config/sound-images";
import { type MixPreset, useMixer } from "@/context/MixerContext";
import { GEOMETRIES, type GeometryId } from "@/data/geometries";
import { getSoundById } from "@/data/sounds";
import { useGeometrixCreations } from "@/hooks/useGeometrixCreations";
import { useLoadMix } from "@/hooks/useLoadMix";

const BG_GRADIENT = ["#2E0510", "#160108"] as const;
const GOLD = "#D4AF37";
const TEXT = "#FAF0EE";
const MUTED = "rgba(250,240,238,0.45)";

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
    backgroundColor: "rgba(212,175,55,0.12)",
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
type CoverPickerProps = {
  visible: boolean;
  onClose: () => void;
  onPickPreset: (key: string) => void;
  onPickPhoto: () => void;
  onPickGeometry: (geoId: string) => void;
  onPickCreation: (creationId: string) => void;
  onClearCover: () => void;
};

function CoverPickerSheet({
  visible,
  onClose,
  onPickPreset,
  onPickPhoto,
  onPickGeometry,
  onPickCreation,
  onClearCover,
}: CoverPickerProps) {
  const insets = useSafeAreaInsets();
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;
  const [view, setView] = useState<"menu" | "presets" | "geometrix">("menu");
  const { creations } = useGeometrixCreations();

  const handleClose = useCallback(() => {
    setView("menu");
    onClose();
  }, [onClose]);

  if (!visible) return null;

  if (view === "presets") {
    return (
      <Modal visible animationType="slide" transparent onRequestClose={() => { setView("menu"); onClose(); }}>
        <Pressable style={ms.backdrop} onPress={() => { setView("menu"); onClose(); }} />
        <LinearGradient colors={["#2E0510", "#160108"]} style={[ms.sheet, { paddingBottom: bottomPad + 8 }]}>
          <View style={ms.handle} />
          <View style={ms.headerRow}>
            <Pressable onPress={() => setView("menu")} hitSlop={12}>
              <Feather name="arrow-left" size={20} color={MUTED} />
            </Pressable>
            <Text style={ms.sheetTitle}>Elige una imagen</Text>
            <View style={{ width: 28 }} />
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 12 }}>
            <View style={ms.gridRow}>
              {MIX_IMAGE_GALLERY.map((key) => {
                const img = getMixImage(key);
                return (
                  <Pressable
                    key={key}
                    style={({ pressed }) => [ms.presetThumb, { opacity: pressed ? 0.7 : 1 }]}
                    onPress={() => { onPickPreset(key); handleClose(); }}
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
          </ScrollView>
        </LinearGradient>
      </Modal>
    );
  }

  if (view === "geometrix") {
    return (
      <Modal visible animationType="slide" transparent onRequestClose={() => { setView("menu"); onClose(); }}>
        <Pressable style={ms.backdrop} onPress={() => { setView("menu"); onClose(); }} />
        <LinearGradient colors={["#2D1B4E", "#0D0518"]} style={[ms.sheet, { paddingBottom: bottomPad + 8 }]}>
          <View style={ms.handle} />
          <View style={ms.headerRow}>
            <Pressable onPress={() => setView("menu")} hitSlop={12}>
              <Feather name="arrow-left" size={20} color={MUTED} />
            </Pressable>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, flex: 1, justifyContent: "center" }}>
              <Image source={require("@/assets/images/cubo-geometrix.png")} style={{ width: 22, height: 22 }} contentFit="contain" />
              <Text style={ms.sheetTitle}>Portada Geometrix</Text>
            </View>
            <View style={{ width: 28 }} />
          </View>
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingVertical: 12 }}>
            {creations.length === 0 ? (
              <View style={{ paddingVertical: 40, alignItems: "center" }}>
                <Text style={{ color: MUTED, fontSize: 14 }}>No tienes creaciones aún</Text>
                <Text style={{ color: MUTED, fontSize: 12, marginTop: 6, opacity: 0.7 }}>Ve a Geometrix y crea una</Text>
              </View>
            ) : (
              <View style={ms.creationGrid}>
                {creations.map((item) => (
                  <Pressable
                    key={item.id}
                    style={({ pressed }) => [ms.creationItem2col, { opacity: pressed ? 0.7 : 1 }]}
                    onPress={() => { onPickCreation(item.id); handleClose(); }}
                  >
                    <View style={ms.creationThumb2col}>
                      <CreationCoverPreview creationId={item.id} size={150} />
                    </View>
                    <Text style={ms.geoName} numberOfLines={1}>{item.name}</Text>
                  </Pressable>
                ))}
              </View>
            )}
          </ScrollView>
        </LinearGradient>
      </Modal>
    );
  }

  return (
    <Modal visible animationType="slide" transparent onRequestClose={handleClose}>
      <Pressable style={ms.backdrop} onPress={handleClose} />
      <LinearGradient colors={["#2E0510", "#160108"]} style={[ms.sheet, { paddingBottom: bottomPad + 8 }]}>
        <View style={ms.handle} />
        <Text style={ms.sheetTitle}>Portada de la mezcla</Text>
        <Pressable style={({ pressed }) => [ms.row, { opacity: pressed ? 0.7 : 1 }]} onPress={() => setView("presets")}>
          <Feather name="image" size={22} color="#FFFFFF" />
          <Text style={ms.rowText}>Imagen predefinida</Text>
          <Feather name="chevron-right" size={16} color={MUTED} />
        </Pressable>
        <Pressable style={({ pressed }) => [ms.row, { opacity: pressed ? 0.7 : 1 }]} onPress={() => { onPickPhoto(); handleClose(); }}>
          <Feather name="camera" size={22} color="#FFFFFF" />
          <Text style={ms.rowText}>Foto del carrete</Text>
          <Feather name="chevron-right" size={16} color={MUTED} />
        </Pressable>
        <Pressable style={({ pressed }) => [ms.row, { opacity: pressed ? 0.7 : 1, marginLeft: -2 }]} onPress={() => setView("geometrix")}>
          <Image source={require("@/assets/images/cubo-geometrix.png")} style={{ width: 26, height: 26 }} contentFit="contain" />
          <Text style={ms.rowText}>Portada Geometrix</Text>
          <Feather name="chevron-right" size={16} color={MUTED} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [ms.row, { borderBottomWidth: 0, opacity: pressed ? 0.7 : 1 }]}
          onPress={() => { onClearCover(); handleClose(); }}
        >
          <Feather name="x-circle" size={22} color={MUTED} />
          <Text style={[ms.rowText, { color: MUTED }]}>Quitar portada</Text>
        </Pressable>
      </LinearGradient>
    </Modal>
  );
}

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function MiMezclaScreen() {
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const { presets, updatePresetMeta, loadedPresetId, isPlaying, togglePlay, deletePreset } = useMixer();
  const loadMix = useLoadMix();

  const mix = useMemo(() => presets.find((p) => p.id === id), [presets, id]);

  const [name, setName] = useState(mix?.name ?? "");
  const [description, setDescription] = useState(mix?.description ?? "");
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

  const handlePickPhoto = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu galería para elegir una foto.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      save({
        coverUri: result.assets[0].uri,
        image: undefined,
        coverGeometryId: undefined,
        coverCreationId: undefined,
      });
    }
  }, [save]);

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
      <LinearGradient colors={BG_GRADIENT} style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <Text style={{ color: MUTED }}>Mezcla no encontrada</Text>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={BG_GRADIENT} style={{ flex: 1 }}>
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
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 32 }}
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

        {/* Descripción */}
        <Text style={s.label}>Descripción</Text>
        <TextInput
          style={[s.input, s.inputMulti]}
          value={description}
          onChangeText={setDescription}
          onBlur={() => save({ description: description.trim() || undefined })}
          placeholder="Describe tu mezcla (opcional)"
          placeholderTextColor={MUTED}
          multiline
          numberOfLines={3}
          returnKeyType="done"
          blurOnSubmit
        />

        {/* Reproducir */}
        <Pressable
          style={({ pressed }) => [s.playBtn, { opacity: pressed ? 0.85 : 1, overflow: "hidden" }]}
          onPress={handlePlay}
        >
          <GoldGradientFill />
          <Feather name={isPlayingThis ? "pause" : "play"} size={18} color="#1B060F" />
          <Text style={s.playBtnText}>{isPlayingThis ? "Pausar" : "Reproducir mezcla"}</Text>
        </Pressable>

        {/* Sonidos */}
        <Text style={s.label}>Sonidos ({mix.sounds.length})</Text>
        <View style={s.soundsGrid}>
          {mix.sounds.map((snd) => {
            const info = getSoundById(snd.id);
            const img = getSoundImage(snd.id);
            return (
              <View key={snd.id} style={s.soundItem}>
                <View style={s.soundThumb}>
                  {img ? (
                    <Image source={img as number} style={{ width: 52, height: 52 }} contentFit="cover" />
                  ) : (
                    <MaterialCommunityIcons name="music-note" size={22} color={GOLD} />
                  )}
                </View>
                <Text style={s.soundName} numberOfLines={2}>{info?.name ?? snd.id}</Text>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <CoverPickerSheet
        visible={pickerVisible}
        onClose={() => setPickerVisible(false)}
        onPickPreset={(key) =>
          save({ image: key, coverUri: undefined, coverGeometryId: undefined, coverCreationId: undefined })
        }
        onPickPhoto={handlePickPhoto}
        onPickGeometry={(geoId) =>
          save({ coverGeometryId: geoId, image: undefined, coverUri: undefined, coverCreationId: undefined })
        }
        onPickCreation={(cId) =>
          save({ coverCreationId: cId, image: undefined, coverUri: undefined, coverGeometryId: undefined })
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
    color: MUTED,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.8,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 4,
  },
  input: {
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
  playBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    height: 50,
    borderRadius: 25,
    marginBottom: 28,
  },
  playBtnText: {
    color: "#1B060F",
    fontSize: 16,
    fontWeight: "700",
  },
  soundsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  soundItem: {
    width: 72,
    alignItems: "center",
    gap: 6,
  },
  soundThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "rgba(212,175,55,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  soundName: {
    color: MUTED,
    fontSize: 11,
    textAlign: "center",
    lineHeight: 14,
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
