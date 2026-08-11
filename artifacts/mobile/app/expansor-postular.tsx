import { Feather } from "@expo/vector-icons";
import { BackPill } from "@/components/BackPill";
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
import { useSceneTheme } from "@/context/SceneThemeContext";

import { useCreateApplication } from "@workspace/api-client-react";

import { useColors } from "@/hooks/useColors";
import { EXPANSOR_SUBTIPO_OPTIONS, type ExpansorSubtipo } from "@/data/expansores";

const BG_GRADIENT = ["#340D1A", "#190913"] as const;
const GOLD = "#F9F9F9";

export default function ExpansorPostularScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { theme: sceneTheme } = useSceneTheme();
  const topPad = Platform.OS === "web" ? 24 : insets.top;
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;

  const [name, setName] = useState("");
  const [location, setLocation] = useState("");
  const [phone, setPhone] = useState("");
  const [aporte, setAporte] = useState<ExpansorSubtipo | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [services, setServices] = useState("");
  const { mutateAsync: createApplication, isPending: busy } = useCreateApplication();

  function onSubmit() {
    if (!name.trim()) {
      Alert.alert("Falta tu nombre", "Cuéntanos cómo te llamas.");
      return;
    }
    if (!location.trim()) {
      Alert.alert("Falta tu ubicación", "Cuéntanos de dónde eres.");
      return;
    }
    if (!phone.trim()) {
      Alert.alert("Falta tu teléfono", "Déjanos un teléfono de contacto.");
      return;
    }
    if (!aporte) {
      Alert.alert("Falta tu aporte", "Elige cómo te gustaría aportar.");
      return;
    }
    (async () => {
      try {
        await createApplication({
          data: {
            type: "expansor",
            name: name.trim(),
            location: location.trim(),
            phone: phone.trim(),
            aporte,
            services: services.trim() || null,
          },
        });
      } catch {
        Alert.alert(
          "No se pudo enviar",
          "Hubo un problema al enviar tu postulación. Revisa tu conexión e inténtalo de nuevo.",
        );
        return;
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Alert.alert(
        "¡Postulación recibida!",
        "La casa revisará tu información y te contactará al teléfono que dejaste.",
        [{ text: "Listo", onPress: () => router.back() }],
      );
    })();
  }

  return (
    <LinearGradient colors={sceneTheme.gradient as unknown as [string, string, ...string[]]} style={styles.root}>
      <StatusBar hidden />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 10 }]}>
        <BackPill onPress={() => router.back()} size={28} bgColor="rgba(255,255,255,0.10)" iconOffsetX={-1} />
        <View pointerEvents="none" style={[styles.headerTitleAbs, { top: topPad + 10 }]}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Postúlate como Expansor</Text>
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
          <View style={[styles.inputRow, { backgroundColor: "rgba(255,255,255,0.035)", borderColor: "rgba(255,255,255,0.1)" }]}>
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

          {/* Ubicación */}
          <Text style={[styles.label, { color: "rgba(255,255,255,0.8)" }]}>¿De dónde eres?</Text>
          <View style={[styles.inputRow, { backgroundColor: "rgba(255,255,255,0.035)", borderColor: "rgba(255,255,255,0.1)" }]}>
            <Feather name="map-pin" size={15} color={colors.mutedForeground} />
            <TextInput
              value={location}
              onChangeText={setLocation}
              placeholder="Tu ciudad o país"
              placeholderTextColor={colors.mutedForeground}
              selectionColor={GOLD}
              style={[styles.inputText, { color: colors.foreground }]}
            />
          </View>

          {/* Teléfono */}
          <Text style={[styles.label, { color: "rgba(255,255,255,0.8)" }]}>Teléfono</Text>
          <View style={[styles.inputRow, { backgroundColor: "rgba(255,255,255,0.035)", borderColor: "rgba(255,255,255,0.1)" }]}>
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
            style={[styles.inputRow, { backgroundColor: "rgba(255,255,255,0.035)", borderColor: "rgba(255,255,255,0.1)" }]}
          >
            <Feather name="award" size={15} color={colors.mutedForeground} />
            <Text
              style={[
                styles.inputText,
                { color: aporte ? colors.foreground : colors.mutedForeground, flex: 1 },
              ]}
            >
              {aporte ?? "Elige una opción"}
            </Text>
            <Feather name={dropdownOpen ? "chevron-up" : "chevron-down"} size={18} color={colors.mutedForeground} />
          </Pressable>
          {dropdownOpen && (
            <View style={[styles.dropdown, { backgroundColor: "rgba(255,255,255,0.035)", borderColor: "rgba(255,255,255,0.1)" }]}>
              {EXPANSOR_SUBTIPO_OPTIONS.map((opt, i) => (
                <Pressable
                  key={opt}
                  onPress={() => {
                    setAporte(opt);
                    setDropdownOpen(false);
                  }}
                  style={[
                    styles.dropdownItem,
                    i < EXPANSOR_SUBTIPO_OPTIONS.length - 1 && {
                      borderBottomWidth: StyleSheet.hairlineWidth,
                      borderBottomColor: colors.border,
                    },
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
          <View style={[styles.textareaRow, { backgroundColor: "rgba(255,255,255,0.035)", borderColor: "rgba(255,255,255,0.1)" }]}>
            <TextInput
              value={services}
              onChangeText={setServices}
              placeholder="Cuéntanos qué ofreces y tu experiencia..."
              placeholderTextColor={colors.mutedForeground}
              selectionColor={GOLD}
              multiline
              textAlignVertical="top"
              style={[styles.textareaText, { color: colors.foreground }]}
            />
          </View>

          {/* Enviar revisión */}
          <Pressable
            onPress={onSubmit}
            disabled={busy}
            style={({ pressed }) => [styles.submitBtn, { opacity: pressed || busy ? 0.85 : 1 }]}
          >
            <LinearGradient
              colors={["#F9F9F9", "#F9F9F9"]}
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
    backgroundColor: "rgba(255,255,255,0.08)",
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
  headerTitle: { fontFamily: "Manrope", fontSize: 17, fontWeight: "700" },
  label: {
    fontFamily: "Manrope",
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
    fontFamily: "Manrope",
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
  dropdownText: { fontFamily: "Manrope", fontSize: 15 },
  textareaRow: {
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 120,
  },
  textareaText: {
    fontFamily: "Manrope",
    fontSize: 15,
    minHeight: 96,
  },
  submitBtn: {
    marginTop: 28,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  submitText: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
    color: "#1B060F",
  },
});
