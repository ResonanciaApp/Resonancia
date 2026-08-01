import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useQueryClient } from "@tanstack/react-query";

import {
  useCreateSubmission,
  useGetCatalog,
  getGetMySubmissionsQueryKey,
  type CreatorSubmissionAudioInput,
} from "@workspace/api-client-react";

import { SacredBackground } from "@/components/SacredBackground";
import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";
import { uploadLocalFile } from "@/lib/upload";

interface PickedAudio {
  uri: string;
  name: string;
  contentType: string;
  sizeBytes: number;
}

interface PickedImage {
  uri: string;
  name: string;
  contentType: string;
  sizeBytes: number;
}

export default function CrearContenidoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const { isCreator } = useAuth();
  const catalogQ = useGetCatalog();
  const categories = catalogQ.data?.categories ?? [];
  const queryClient = useQueryClient();
  const createMut = useCreateSubmission();

  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [showCats, setShowCats] = useState(false);
  const [duration, setDuration] = useState("");
  const [description, setDescription] = useState("");
  const [isPremium, setIsPremium] = useState(false);
  const [cover, setCover] = useState<PickedImage | null>(null);
  const [mainAudio, setMainAudio] = useState<PickedAudio | null>(null);
  const [secondAudio, setSecondAudio] = useState<PickedAudio | null>(null);
  const [busy, setBusy] = useState(false);

  const selectedCat = categories.find((c) => c.id === categoryId) ?? null;

  if (!isCreator) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <StatusBar hidden />
        <SacredBackground />
        <View style={[styles.gate, { paddingTop: topPad + 40 }]}>
          <Feather name="lock" size={40} color={colors.mutedForeground} />
          <Text style={[styles.gateTitle, { color: colors.foreground }]}>
            Solo para creadores
          </Text>
          <Text style={[styles.gateText, { color: colors.mutedForeground }]}>
            Esta sección es para creadores verificados de la casa. Si querés
            sumarte como creador, escribinos desde Ayuda.
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.gateBtn,
              { borderColor: colors.primary, opacity: pressed ? 0.8 : 1 },
            ]}
            onPress={() => router.back()}
          >
            <Text style={[styles.gateBtnText, { color: colors.primary }]}>Volver</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  async function pickCover() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso necesario", "Necesitamos acceso a tus fotos para la portada.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      quality: 0.9,
    });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      setCover({
        uri: a.uri,
        name: a.fileName ?? `portada-${Date.now()}.jpg`,
        contentType: a.mimeType ?? "image/jpeg",
        sizeBytes: a.fileSize ?? 1,
      });
    }
  }

  async function pickAudio(setter: (a: PickedAudio | null) => void) {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const DocumentPicker = require("expo-document-picker") as typeof import("expo-document-picker");
    const result = await DocumentPicker.getDocumentAsync({
      type: "audio/*",
      copyToCacheDirectory: true,
    });
    if (!result.canceled && result.assets[0]) {
      const a = result.assets[0];
      setter({
        uri: a.uri,
        name: a.name ?? `audio-${Date.now()}.mp3`,
        contentType: a.mimeType ?? "audio/mpeg",
        sizeBytes: a.size ?? 1,
      });
    }
  }

  async function onSubmit() {
    const durationNum = parseInt(duration, 10);
    if (!title.trim() || !subtitle.trim()) {
      Alert.alert("Faltan datos", "El título y el subtítulo son obligatorios.");
      return;
    }
    if (!selectedCat) {
      Alert.alert("Faltan datos", "Elegí una categoría.");
      return;
    }
    if (!durationNum || durationNum < 1) {
      Alert.alert("Faltan datos", "Indicá la duración en minutos.");
      return;
    }
    if (!description.trim()) {
      Alert.alert("Faltan datos", "Agregá una descripción.");
      return;
    }
    if (!mainAudio) {
      Alert.alert("Faltan datos", "Subí al menos el audio principal.");
      return;
    }

    setBusy(true);
    try {
      const audioFiles: CreatorSubmissionAudioInput[] = [];

      const mainPath = await uploadLocalFile(
        mainAudio.uri,
        mainAudio.contentType,
        mainAudio.name,
        mainAudio.sizeBytes,
      );
      audioFiles.push({
        role: "main",
        objectPath: mainPath,
        name: mainAudio.name,
        contentType: mainAudio.contentType,
        sizeBytes: mainAudio.sizeBytes,
      });

      if (secondAudio) {
        const secPath = await uploadLocalFile(
          secondAudio.uri,
          secondAudio.contentType,
          secondAudio.name,
          secondAudio.sizeBytes,
        );
        audioFiles.push({
          role: "ambient",
          objectPath: secPath,
          name: secondAudio.name,
          contentType: secondAudio.contentType,
          sizeBytes: secondAudio.sizeBytes,
        });
      }

      let imageObjectPath: string | null = null;
      if (cover) {
        imageObjectPath = await uploadLocalFile(
          cover.uri,
          cover.contentType,
          cover.name,
          cover.sizeBytes,
        );
      }

      await createMut.mutateAsync({
        data: {
          title: title.trim(),
          subtitle: subtitle.trim(),
          categoryId: selectedCat.id,
          categoryLabel: selectedCat.title,
          duration: durationNum,
          description: description.trim(),
          isPremium,
          imageObjectPath,
          imageContentType: cover?.contentType ?? null,
          imageSizeBytes: cover?.sizeBytes ?? null,
          audioFiles,
        },
      });

      await queryClient.invalidateQueries({ queryKey: getGetMySubmissionsQueryKey() });
      Alert.alert(
        "¡Enviado!",
        "Tu contenido quedó en revisión. Te avisamos cuando lo aprueben.",
        [{ text: "Ver mis envíos", onPress: () => router.replace("/mis-envios" as never) }],
      );
    } catch (err) {
      Alert.alert(
        "No se pudo enviar",
        err instanceof Error ? err.message : "Intentá de nuevo más tarde.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar hidden />
      <SacredBackground />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{
            paddingTop: topPad + 8,
            paddingBottom: bottomPad + 40,
            paddingHorizontal: 20,
          }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Feather name="arrow-left" size={22} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.screenTitle, { color: colors.foreground }]}>
              Subir contenido
            </Text>
            <Pressable onPress={() => router.push("/mis-envios" as never)} hitSlop={12}>
              <Feather name="inbox" size={20} color={colors.primary} />
            </Pressable>
          </View>

          <Label text="Título" colors={colors} />
          <InputField
            value={title}
            onChangeText={setTitle}
            placeholder="Ej: Meditación para soltar el día"
            colors={colors}
            icon="type"
          />

          <Label text="Subtítulo" colors={colors} />
          <InputField
            value={subtitle}
            onChangeText={setSubtitle}
            placeholder="Ej: Respiración consciente"
            colors={colors}
            icon="align-left"
          />

          <Label text="Categoría" colors={colors} />
          <Pressable
            onPress={() => setShowCats((v) => !v)}
            style={[
              styles.selectRow,
              { backgroundColor: colors.card, borderColor: showCats ? colors.primary : colors.border },
            ]}
          >
            <Feather name="grid" size={15} color={colors.mutedForeground} />
            <Text
              style={[
                styles.selectText,
                { color: selectedCat ? colors.foreground : colors.mutedForeground, flex: 1 },
              ]}
            >
              {selectedCat ? selectedCat.title : "Seleccionar categoría"}
            </Text>
            <Feather
              name={showCats ? "chevron-up" : "chevron-down"}
              size={16}
              color={colors.mutedForeground}
            />
          </Pressable>
          {showCats && (
            <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {categories.length === 0 ? (
                <Text style={[styles.dropdownText, { color: colors.mutedForeground, padding: 14 }]}>
                  Cargando categorías…
                </Text>
              ) : (
                categories.map((c) => (
                  <Pressable
                    key={c.id}
                    onPress={() => {
                      setCategoryId(c.id);
                      setShowCats(false);
                    }}
                    style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                  >
                    <Text
                      style={[
                        styles.dropdownText,
                        { color: categoryId === c.id ? colors.primary : colors.foreground },
                      ]}
                    >
                      {c.title}
                    </Text>
                    {categoryId === c.id && <Feather name="check" size={14} color={colors.primary} />}
                  </Pressable>
                ))
              )}
            </View>
          )}

          <Label text="Duración (minutos)" colors={colors} />
          <InputField
            value={duration}
            onChangeText={setDuration}
            placeholder="Ej: 12"
            colors={colors}
            icon="clock"
            keyboardType="numeric"
          />

          <Label text="Descripción" colors={colors} />
          <View style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Contá de qué se trata esta pieza…"
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={4}
              style={[styles.textAreaInput, { color: colors.foreground }]}
              textAlignVertical="top"
            />
          </View>

          <Label text="Portada (opcional)" colors={colors} />
          <Pressable
            onPress={pickCover}
            style={[styles.assetRow, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            {cover ? (
              <Image source={{ uri: cover.uri }} style={styles.coverThumb} />
            ) : (
              <View style={[styles.coverThumb, styles.coverPlaceholder, { backgroundColor: colors.primary + "18" }]}>
                <Feather name="image" size={18} color={colors.primary} />
              </View>
            )}
            <Text style={[styles.assetText, { color: cover ? colors.foreground : colors.mutedForeground, flex: 1 }]}>
              {cover ? cover.name : "Elegir imagen de portada"}
            </Text>
            <Feather name={cover ? "edit-2" : "plus"} size={16} color={colors.primary} />
          </Pressable>

          <Label text="Audio principal" colors={colors} />
          <AudioPicker
            audio={mainAudio}
            onPick={() => pickAudio(setMainAudio)}
            onClear={() => setMainAudio(null)}
            placeholder="Subir audio principal"
            colors={colors}
          />

          <Label text="Audio secundario (ambiente / voz, opcional)" colors={colors} />
          <AudioPicker
            audio={secondAudio}
            onPick={() => pickAudio(setSecondAudio)}
            onClear={() => setSecondAudio(null)}
            placeholder="Subir audio secundario"
            colors={colors}
          />

          <View style={[styles.switchRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.switchTitle, { color: colors.foreground }]}>Contenido premium</Text>
              <Text style={[styles.switchDesc, { color: colors.mutedForeground }]}>
                Solo accesible para usuarios premium.
              </Text>
            </View>
            <Switch
              value={isPremium}
              onValueChange={setIsPremium}
              trackColor={{ false: colors.border, true: colors.primary }}
              thumbColor="#fff"
            />
          </View>

          <Pressable
            disabled={busy}
            style={({ pressed }) => [styles.publishBtn, { opacity: pressed || busy ? 0.85 : 1 }]}
            onPress={onSubmit}
          >
            <LinearGradient colors={["#4A0C0C", "#27070E", "#1B060F"]} style={styles.publishGrad}>
              {busy ? (
                <ActivityIndicator color="#080F0A" />
              ) : (
                <>
                  <Feather name="upload-cloud" size={18} color="#080F0A" />
                  <Text style={styles.publishText}>Enviar a revisión</Text>
                </>
              )}
            </LinearGradient>
          </Pressable>

          <Text style={[styles.hint, { color: colors.mutedForeground }]}>
            Tu contenido pasa por una revisión antes de aparecer en el catálogo.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function AudioPicker({
  audio,
  onPick,
  onClear,
  placeholder,
  colors,
}: {
  audio: PickedAudio | null;
  onPick: () => void;
  onClear: () => void;
  placeholder: string;
  colors: ReturnType<typeof useColors>;
}) {
  return (
    <Pressable
      onPress={onPick}
      style={[styles.assetRow, { backgroundColor: colors.card, borderColor: colors.border }]}
    >
      <View style={[styles.audioIcon, { backgroundColor: colors.primary + "18" }]}>
        <Feather name="music" size={16} color={colors.primary} />
      </View>
      <Text
        style={[styles.assetText, { color: audio ? colors.foreground : colors.mutedForeground, flex: 1 }]}
        numberOfLines={1}
      >
        {audio ? audio.name : placeholder}
      </Text>
      {audio ? (
        <Pressable onPress={onClear} hitSlop={10}>
          <Feather name="x" size={16} color={colors.mutedForeground} />
        </Pressable>
      ) : (
        <Feather name="plus" size={16} color={colors.primary} />
      )}
    </Pressable>
  );
}

function Label({ text, colors }: { text: string; colors: ReturnType<typeof useColors> }) {
  return <Text style={[styles.label, { color: colors.mutedForeground }]}>{text}</Text>;
}

function InputField({ value, onChangeText, placeholder, colors, icon, keyboardType }: any) {
  return (
    <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Feather name={icon} size={15} color={colors.mutedForeground} />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        keyboardType={keyboardType ?? "default"}
        style={[styles.inputText, { color: colors.foreground }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 24,
    height: 40,
  },
  screenTitle: { fontFamily: "Manrope", fontSize: 17, fontWeight: "700" },
  label: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.4,
    textTransform: "uppercase",
    marginBottom: 8,
    marginTop: 16,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  inputText: { fontFamily: "Manrope", flex: 1, fontSize: 14 },
  textArea: { borderRadius: 14, borderWidth: 1, padding: 14, minHeight: 100 },
  textAreaInput: { fontFamily: "Manrope", fontSize: 14, lineHeight: 22 },
  selectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  selectText: { fontFamily: "Manrope", fontSize: 14 },
  dropdown: { borderRadius: 14, borderWidth: 1, overflow: "hidden", marginTop: 4 },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
  dropdownText: { fontFamily: "Manrope", fontSize: 14 },
  assetRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  assetText: { fontFamily: "Manrope", fontSize: 14 },
  coverThumb: { width: 44, height: 44, borderRadius: 10 },
  coverPlaceholder: { alignItems: "center", justifyContent: "center" },
  audioIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    marginTop: 20,
  },
  switchTitle: { fontFamily: "Manrope", fontSize: 14, fontWeight: "600" },
  switchDesc: { fontFamily: "Manrope", fontSize: 12, marginTop: 2 },
  publishBtn: { borderRadius: 16, overflow: "hidden", marginTop: 24 },
  publishGrad: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  publishText: { fontFamily: "Manrope", color: "#080F0A", fontWeight: "700", fontSize: 16 },
  hint: { fontFamily: "Manrope", fontSize: 12, textAlign: "center", lineHeight: 18, marginTop: 14 },
  gate: { alignItems: "center", paddingHorizontal: 32, gap: 14 },
  gateTitle: { fontFamily: "Manrope", fontSize: 18, fontWeight: "700" },
  gateText: { fontFamily: "Manrope", fontSize: 14, textAlign: "center", lineHeight: 21 },
  gateBtn: { borderWidth: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 28, marginTop: 8 },
  gateBtnText: { fontFamily: "Manrope", fontSize: 14, fontWeight: "600" },
});
