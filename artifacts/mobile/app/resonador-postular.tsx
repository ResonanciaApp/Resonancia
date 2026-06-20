import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import AsyncStorage from "@react-native-async-storage/async-storage";

import { useColors } from "@/hooks/useColors";
import type { ResonadorSubtipo } from "@/data/resonadores";

const BG_GRADIENT = ["#2E0510", "#160108"] as const;
const APPLICATIONS_KEY = "@resonador_applications";
const GOLD = "#D4AF37";
const APORTE_OPTIONS: ResonadorSubtipo[] = ["Voz guía", "Sonoterapeuta", "Músico", "Productor"];

interface PickedAudio {
  uri: string;
  name: string;
  contentType: string;
  sizeBytes: number;
}

export default function ResonadorPostularScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 24 : insets.top;
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [aporte, setAporte] = useState<ResonadorSubtipo | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [services, setServices] = useState("");
  const [audio, setAudio] = useState<PickedAudio | null>(null);
  const [busy, setBusy] = useState(false);

  async function pickAudio() {
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const DocumentPicker = require("expo-document-picker") as typeof import("expo-document-picker");
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
      });
      if (!result.canceled && result.assets[0]) {
        const a = result.assets[0];
        setAudio({
          uri: a.uri,
          name: a.name ?? `audio-${Date.now()}.mp3`,
          contentType: a.mimeType ?? "audio/mpeg",
          sizeBytes: a.size ?? 1,
        });
      }
    } catch {
      Alert.alert("No se pudo abrir el selector", "Intentá de nuevo en un momento.");
    }
  }

  function onSubmit() {
    if (!name.trim()) {
      Alert.alert("Falta tu nombre", "Contanos cómo te llamas.");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("Falta tu teléfono", "Dejanos un teléfono de contacto.");
      return;
    }
    if (!aporte) {
      Alert.alert("Falta tu aporte", "Elegí cómo te gustaría aportar.");
      return;
    }
    if (!audio) {
      Alert.alert("Falta tu muestra", "Subí un audio de muestra de tu arte.");
      return;
    }
    setBusy(true);
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(APPLICATIONS_KEY);
        const prev: unknown[] = raw ? JSON.parse(raw) : [];
        prev.push({
          name: name.trim(),
          phone: phone.trim(),
          aporte,
          services: services.trim(),
          audioName: audio?.name ?? null,
          audioUri: audio?.uri ?? null,
          createdAt: new Date().toISOString(),
        });
        await AsyncStorage.setItem(APPLICATIONS_KEY, JSON.stringify(prev));
      } catch {
        // si falla el guardado local seguimos: no perdemos la confirmación al usuario
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      setBusy(false);
      Alert.alert(
        "¡Postulación recibida!",
        "Guardamos tu información. La casa la revisará y te contactará al teléfono que dejaste.",
        [{ text: "Listo", onPress: () => router.back() }],
      );
    })();
  }

  return (
    <LinearGradient colors={BG_GRADIENT} style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
        <View pointerEvents="none" style={[styles.headerTitleAbs, { top: topPad + 10 }]}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Postúlate como Resonador</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingHorizontal: 18, paddingBottom: bottomPad + 40, paddingTop: 6 }}
        >
          {/* Nombre */}
          <Text style={[styles.label, { color: "rgba(255,255,255,0.8)" }]}>¿Cómo te llamas?</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="user" size={15} color={colors.mutedForeground} />
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Tu nombre"
              placeholderTextColor={colors.mutedForeground}
              selectionColor={GOLD}
              style={[styles.inputText, { color: colors.foreground }]}
            />
          </View>

          {/* Teléfono */}
          <Text style={[styles.label, { color: "rgba(255,255,255,0.8)" }]}>Teléfono</Text>
          <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Feather name="phone" size={15} color={colors.mutedForeground} />
            <TextInput
              value={phone}
              onChangeText={setPhone}
              placeholder="Tu teléfono"
              placeholderTextColor={colors.mutedForeground}
              keyboardType="phone-pad"
              selectionColor={GOLD}
              style={[styles.inputText, { color: colors.foreground }]}
            />
          </View>

          {/* ¿Cómo te gustaría aportar? — dropdown */}
          <Text style={[styles.label, { color: "rgba(255,255,255,0.8)" }]}>¿Cómo te gustaría aportar?</Text>
          <Pressable
            onPress={() => setDropdownOpen((v) => !v)}
            style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <Feather name="music" size={15} color={colors.mutedForeground} />
            <Text
              style={[
                styles.inputText,
                { color: aporte ? colors.foreground : colors.mutedForeground, flex: 1 },
              ]}
            >
              {aporte ?? "Elegí una opción"}
            </Text>
            <Feather name={dropdownOpen ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
          </Pressable>
          {dropdownOpen && (
            <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {APORTE_OPTIONS.map((opt, i) => (
                <Pressable
                  key={opt}
                  onPress={() => {
                    setAporte(opt);
                    setDropdownOpen(false);
                  }}
                  style={[
                    styles.dropdownItem,
                    i < APORTE_OPTIONS.length - 1 && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border },
                  ]}
                >
                  <Text style={[styles.dropdownText, { color: colors.foreground }]}>{opt}</Text>
                  {aporte === opt && <Feather name="check" size={16} color={GOLD} />}
                </Pressable>
              ))}
            </View>
          )}

          {/* Describe tus servicios */}
          <Text style={[styles.label, { color: "rgba(255,255,255,0.8)" }]}>Describe tus servicios</Text>
          <View style={[styles.textareaRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              value={services}
              onChangeText={setServices}
              placeholder="Contanos qué ofreces y tu experiencia..."
              placeholderTextColor={colors.mutedForeground}
              selectionColor={GOLD}
              multiline
              textAlignVertical="top"
              style={[styles.textareaText, { color: colors.foreground }]}
            />
          </View>

          {/* Muéstranos tu arte — audio */}
          <Text style={[styles.label, { color: "rgba(255,255,255,0.8)" }]}>Muéstranos tu arte</Text>
          <Pressable
            onPress={pickAudio}
            style={[styles.audioRow, { backgroundColor: colors.card, borderColor: colors.border }]}
          >
            <View style={[styles.audioIcon, { backgroundColor: colors.primary + "18" }]}>
              <Feather name="music" size={16} color={colors.primary} />
            </View>
            <Text
              style={[styles.audioText, { color: audio ? colors.foreground : colors.mutedForeground }]}
              numberOfLines={1}
            >
              {audio ? audio.name : "Subir un audio de muestra"}
            </Text>
            {audio ? (
              <Pressable onPress={() => setAudio(null)} hitSlop={10}>
                <Feather name="x" size={16} color={colors.mutedForeground} />
              </Pressable>
            ) : (
              <Feather name="plus" size={16} color={colors.primary} />
            )}
          </Pressable>

          {/* Enviar revisión */}
          <Pressable
            onPress={onSubmit}
            disabled={busy}
            style={({ pressed }) => [styles.submitBtn, { opacity: pressed || busy ? 0.85 : 1 }]}
          >
            <LinearGradient
              colors={["#D6AD5F", "#B47344"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.submitText}>{busy ? "Enviando..." : "Enviar revisión"}</Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 18,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(244,218,213,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitleAbs: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 38,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontWeight: "700" },
  label: {
    fontSize: 13,
    fontWeight: "600",
    marginTop: 18,
    marginBottom: 8,
    marginLeft: 2,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    height: 50,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  inputText: {
    flex: 1,
    fontSize: 15,
  },
  dropdown: {
    marginTop: 8,
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownText: { fontSize: 15 },
  textareaRow: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 120,
  },
  textareaText: {
    fontSize: 15,
    minHeight: 96,
  },
  audioRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    height: 56,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
  },
  audioIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  audioText: { flex: 1, fontSize: 15 },
  submitBtn: {
    marginTop: 28,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  submitText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1B060F",
  },
});
