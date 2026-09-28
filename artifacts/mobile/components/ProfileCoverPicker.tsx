import { Feather } from "@expo/vector-icons";
import { File as FSFile, Paths } from "expo-file-system";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { PROFILE_COVER_OPTIONS, profileCoverSource } from "@/data/profile-cover-options";

async function persistWebCover(uri: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const image = new window.Image();
    image.onload = () => {
      const scale = Math.min(1, 1400 / Math.max(image.width, image.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);
      const context = canvas.getContext("2d");
      if (!context) {
        reject(new Error("No se pudo preparar la imagen."));
        return;
      }
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.78));
    };
    image.onerror = () => reject(new Error("No se pudo abrir la imagen."));
    image.src = uri;
  });
}

type Props = {
  visible: boolean;
  onClose: () => void;
  presetId: string | null;
  photoUri: string | null;
  onSelectPreset: (id: string | null) => void;
  onSelectPhoto: (uri: string) => void;
  gradient: readonly [string, string, ...string[]];
  bottomPad: number;
};

export function ProfileCoverPicker({
  visible,
  onClose,
  presetId,
  photoUri,
  onSelectPreset,
  onSelectPhoto,
  gradient,
  bottomPad,
}: Props) {
  const [libraryPending, setLibraryPending] = useState(false);
  const selectedSource = profileCoverSource(presetId, photoUri);

  const pickFromLibrary = async () => {
    try {
      if (Platform.OS !== "web") {
        const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (!permission.granted) {
          Alert.alert(
            "Permiso necesario",
            "Permite acceder a tus fotos para elegir una portada.",
            permission.canAskAgain ? [{ text: "Entendido" }] : [
              { text: "Cancelar", style: "cancel" },
              { text: "Abrir ajustes", onPress: () => void Linking.openSettings() },
            ],
          );
          return;
        }
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      let persistentUri: string;
      if (Platform.OS === "web") {
        persistentUri = await persistWebCover(asset.uri);
      } else {
        const ext = asset.mimeType === "image/png" ? "png" : asset.mimeType === "image/heic" ? "heic" : "jpg";
        const destination = new FSFile(Paths.document, `profile_cover_${Date.now()}.${ext}`);
        new FSFile(asset.uri).copy(destination);
        persistentUri = destination.uri;
      }
      onSelectPhoto(persistentUri);
    } catch {
      Alert.alert("No se pudo guardar la portada", "Inténtalo nuevamente con otra foto.");
    }
  };

  // iOS waits for the native Modal to finish closing before presenting the photo library.
  const openLibrary = () => {
    setLibraryPending(true);
    onClose();
  };
  useEffect(() => {
    if (Platform.OS === "ios" || visible || !libraryPending) return;
    const frame = requestAnimationFrame(() => {
      setLibraryPending(false);
      void pickFromLibrary();
    });
    return () => cancelAnimationFrame(frame);
  }, [visible, libraryPending]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      onDismiss={() => {
        if (!libraryPending) return;
        setLibraryPending(false);
        requestAnimationFrame(() => void pickFromLibrary());
      }}
    >
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Cerrar selector de portada" />
        <View style={[styles.sheet, { paddingBottom: bottomPad + 16 }]}>
          <LinearGradient colors={gradient as [string, string, ...string[]]} style={StyleSheet.absoluteFill} pointerEvents="none" />
          <View style={styles.preview}>
            {selectedSource ? (
              <Image source={selectedSource} style={StyleSheet.absoluteFill} contentFit="cover" />
            ) : (
              <LinearGradient
                colors={["#29346A", "#221B4E", "#141531"]}
                style={StyleSheet.absoluteFill}
              />
            )}
            <LinearGradient
              colors={["rgba(5,8,24,0.70)", "rgba(5,8,24,0.14)", "rgba(5,8,24,0.36)"]}
              locations={[0, 0.55, 1]}
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View style={styles.handle} pointerEvents="none" />
            <View style={styles.previewHeader}>
              <Text style={styles.title}>Portada</Text>
              <Pressable onPress={onClose} hitSlop={10} style={styles.close} accessibilityRole="button" accessibilityLabel="Cerrar">
                <Feather name="x" size={23} color="#FFFFFF" />
              </Pressable>
            </View>
            {!selectedSource && <Text style={styles.emptyHint}>Elige una imagen para tu perfil</Text>}
          </View>
          <Pressable onPress={openLibrary} style={styles.upload} accessibilityRole="button" accessibilityLabel="Elegir una foto de mi galería">
            <Feather name="image" size={18} color="#F9F9F9" />
            <Text style={styles.uploadText}>Elegir una foto</Text>
          </Pressable>
          <View style={styles.galleryHeading}>
            <Text style={styles.galleryLabel}>ELIGE UNA PORTADA</Text>
            {(presetId || photoUri) && (
              <Pressable onPress={() => onSelectPreset(null)} hitSlop={8} accessibilityRole="button" accessibilityLabel="Quitar portada">
                <Text style={styles.removeText}>Quitar portada</Text>
              </Pressable>
            )}
          </View>
          <FlatList
            data={PROFILE_COVER_OPTIONS}
            keyExtractor={(item) => item.id}
            numColumns={3}
            showsVerticalScrollIndicator={false}
            style={styles.gallery}
            contentContainerStyle={styles.galleryContent}
            columnWrapperStyle={styles.galleryRow}
            renderItem={({ item }) => (
              <Pressable
                onPress={() => onSelectPreset(item.id)}
                style={[styles.tile, presetId === item.id && !photoUri && styles.selectedTile]}
                accessibilityRole="button"
                accessibilityLabel={`Portada: ${item.label}`}
                accessibilityState={{ selected: presetId === item.id && !photoUri }}
              >
                <Image source={item.source} style={styles.tileImage} contentFit="cover" />
                {presetId === item.id && !photoUri && (
                  <View style={styles.check}>
                    <Feather name="check" size={14} color="#FFFFFF" />
                  </View>
                )}
              </Pressable>
            )}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: { height: "76%", minHeight: 490, borderTopLeftRadius: 22, borderTopRightRadius: 22, overflow: "hidden" },
  preview: { height: 220, width: "100%", justifyContent: "flex-end" },
  handle: { position: "absolute", top: 10, alignSelf: "center", width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.6)" },
  previewHeader: { position: "absolute", top: 28, left: 22, right: 18, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  title: { fontFamily: "Manrope", fontSize: 20, fontWeight: "700", color: "#FFFFFF", textShadowColor: "rgba(0,0,0,0.4)", textShadowRadius: 8 },
  close: { width: 43, height: 43, alignItems: "center", justifyContent: "center", borderRadius: 22, backgroundColor: "rgba(0,0,0,0.22)" },
  emptyHint: { color: "#F9F9F9", fontFamily: "Manrope", fontSize: 14, textAlign: "center", marginBottom: 30 },
  upload: { marginTop: 20, minHeight: 44, alignSelf: "center", flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 9, paddingHorizontal: 22, borderRadius: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.24)", backgroundColor: "rgba(0,0,0,0.22)" },
  uploadText: { color: "#F9F9F9", fontFamily: "Manrope", fontSize: 14, fontWeight: "600" },
  galleryHeading: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 24, marginBottom: 12, marginHorizontal: 20 },
  galleryLabel: { color: "rgba(255,255,255,0.68)", fontFamily: "Manrope", fontSize: 11, fontWeight: "700", letterSpacing: 1.2 },
  removeText: { color: "#F9F9F9", fontFamily: "Manrope", fontSize: 12, textDecorationLine: "underline" },
  gallery: { flex: 1, marginHorizontal: 20 },
  galleryContent: { paddingBottom: 12 },
  galleryRow: { gap: 9, marginBottom: 9 },
  tile: { width: "31%", aspectRatio: 1.5, borderRadius: 9, overflow: "hidden", borderWidth: 2, borderColor: "transparent" },
  selectedTile: { borderColor: "#F9F9F9" },
  tileImage: { width: "100%", height: "100%" },
  check: { position: "absolute", bottom: 5, right: 5, width: 21, height: 21, borderRadius: 11, backgroundColor: "rgba(0,0,0,0.72)", alignItems: "center", justifyContent: "center" },
});