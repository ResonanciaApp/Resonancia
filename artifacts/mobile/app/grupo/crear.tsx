import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import {
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

import { SacredBackground } from "@/components/SacredBackground";
import { useColors } from "@/hooks/useColors";

const TEMAS = [
  { id: "meditacion", label: "Meditación", icon: "wind" as const, color: "#A8C4A8", gradient: ["#3A5438", "#1E2E1C"] as [string, string] },
  { id: "sueno", label: "Sueño", icon: "moon" as const, color: "#C8B4E0", gradient: ["#4A3260", "#251633"] as [string, string] },
  { id: "sonidos", label: "Sonidos", icon: "disc" as const, color: "#E8C87A", gradient: ["#7A5520", "#3E2208"] as [string, string] },
  { id: "espiritualidad", label: "Espiritualidad", icon: "star" as const, color: "#F0CC82", gradient: ["#C49A52", "#7A5C20"] as [string, string] },
  { id: "ansiedad", label: "Ansiedad", icon: "heart" as const, color: "#D4709A", gradient: ["#5A2040", "#2E1020"] as [string, string] },
  { id: "crecimiento", label: "Crecimiento", icon: "trending-up" as const, color: "#8AAAD4", gradient: ["#2A3E5A", "#141E2E"] as [string, string] },
];

export default function CrearGrupoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const { tipo } = useLocalSearchParams<{ tipo?: string }>();

  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [temaId, setTemaId] = useState<string | null>(null);
  const [privado, setPrivado] = useState(tipo === "privado");
  const [reglas, setReglas] = useState<string[]>(["", "", ""]);

  const tema = TEMAS.find((t) => t.id === temaId) ?? TEMAS[0];
  const canSave = nombre.trim().length >= 3;

  const updateRegla = (i: number, val: string) => {
    setReglas((prev) => prev.map((r, idx) => (idx === i ? val : r)));
  };

  const addRegla = () => setReglas((prev) => [...prev, ""]);

  const handleCreate = () => {
    // TODO: persistir en backend
    router.back();
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />
        <SacredBackground />

        {/* Header */}
        <LinearGradient
          colors={tema.gradient}
          style={[styles.header, { paddingTop: topPad + 8 }]}
        >
          <View style={styles.headerTop}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Feather name="arrow-left" size={22} color="#EDE1D3" />
            </Pressable>
            <Text style={styles.headerTitle}>Crear grupo</Text>
            <View style={{ width: 22 }} />
          </View>
          <View style={styles.headerPreview}>
            <View style={[styles.previewIcon, { backgroundColor: tema.color + "22" }]}>
              <Feather name={tema.icon} size={26} color={tema.color} />
            </View>
            <View>
              <Text style={styles.previewName} numberOfLines={1}>
                {nombre.trim() || "Nombre del grupo"}
              </Text>
              <Text style={styles.previewSub}>
                {privado ? "🔒 Privado" : "🌐 Público"} · 1 miembro
              </Text>
            </View>
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 24, paddingBottom: insets.bottom + 100 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Nombre */}
          <Text style={[styles.label, { color: colors.foreground }]}>Nombre del grupo *</Text>
          <TextInput
            value={nombre}
            onChangeText={setNombre}
            placeholder="Ej: Meditadores del amanecer"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.input, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            maxLength={60}
          />
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>{nombre.length}/60</Text>

          {/* Descripción */}
          <Text style={[styles.label, { color: colors.foreground }]}>Descripción</Text>
          <TextInput
            value={descripcion}
            onChangeText={setDescripcion}
            placeholder="¿De qué trata este grupo?"
            placeholderTextColor={colors.mutedForeground}
            style={[styles.inputMulti, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
            multiline
            numberOfLines={3}
            maxLength={200}
          />
          <Text style={[styles.hint, { color: colors.mutedForeground }]}>{descripcion.length}/200</Text>

          {/* Tema / ícono */}
          <Text style={[styles.label, { color: colors.foreground }]}>Tema del grupo</Text>
          <View style={styles.temasGrid}>
            {TEMAS.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => setTemaId(t.id)}
                style={[
                  styles.temaChip,
                  {
                    backgroundColor: temaId === t.id ? t.color + "22" : colors.card,
                    borderColor: temaId === t.id ? t.color : colors.border,
                  },
                ]}
              >
                <Feather name={t.icon} size={14} color={temaId === t.id ? t.color : colors.mutedForeground} />
                <Text
                  style={[
                    styles.temaChipText,
                    { color: temaId === t.id ? t.color : colors.mutedForeground },
                  ]}
                >
                  {t.label}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Privacidad */}
          <Text style={[styles.label, { color: colors.foreground }]}>Privacidad</Text>
          <View style={styles.privRow}>
            <Pressable
              onPress={() => setPrivado(false)}
              style={[
                styles.privOption,
                {
                  backgroundColor: !privado ? colors.primary + "15" : colors.card,
                  borderColor: !privado ? colors.primary : colors.border,
                },
              ]}
            >
              <Feather name="users" size={18} color={!privado ? colors.primary : colors.mutedForeground} />
              <View>
                <Text style={[styles.privTitle, { color: !privado ? colors.primary : colors.foreground }]}>
                  Público
                </Text>
                <Text style={[styles.privSub, { color: colors.mutedForeground }]}>
                  Cualquiera puede unirse
                </Text>
              </View>
            </Pressable>
            <Pressable
              onPress={() => setPrivado(true)}
              style={[
                styles.privOption,
                {
                  backgroundColor: privado ? colors.primary + "15" : colors.card,
                  borderColor: privado ? colors.primary : colors.border,
                },
              ]}
            >
              <Feather name="lock" size={18} color={privado ? colors.primary : colors.mutedForeground} />
              <View>
                <Text style={[styles.privTitle, { color: privado ? colors.primary : colors.foreground }]}>
                  Privado
                </Text>
                <Text style={[styles.privSub, { color: colors.mutedForeground }]}>
                  Solo por invitación
                </Text>
              </View>
            </Pressable>
          </View>

          {/* Reglas */}
          <Text style={[styles.label, { color: colors.foreground }]}>Reglas del espacio</Text>
          <Text style={[styles.hint, { color: colors.mutedForeground, marginTop: -8, marginBottom: 10 }]}>
            Opcionales — ayudan a mantener un espacio sagrado
          </Text>
          {reglas.map((r, i) => (
            <View key={i} style={styles.reglaRow}>
              <View style={[styles.reglaNum, { backgroundColor: colors.primary + "20" }]}>
                <Text style={[styles.reglaNumText, { color: colors.primary }]}>{i + 1}</Text>
              </View>
              <TextInput
                value={r}
                onChangeText={(v) => updateRegla(i, v)}
                placeholder={`Regla ${i + 1}`}
                placeholderTextColor={colors.mutedForeground}
                style={[styles.reglaInput, { backgroundColor: colors.card, borderColor: colors.border, color: colors.foreground }]}
                maxLength={100}
              />
            </View>
          ))}
          {reglas.length < 6 && (
            <Pressable onPress={addRegla} style={styles.addReglaBtn}>
              <Feather name="plus" size={14} color={colors.primary} />
              <Text style={[styles.addReglaText, { color: colors.primary }]}>Agregar regla</Text>
            </Pressable>
          )}
        </ScrollView>

        {/* Save button */}
        <View style={[styles.saveBar, { paddingBottom: insets.bottom + 12, backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <Pressable
            onPress={handleCreate}
            disabled={!canSave}
            style={({ pressed }) => [{ opacity: pressed ? 0.85 : 1, borderRadius: 18, overflow: "hidden" }]}
          >
            <LinearGradient
              colors={canSave ? ["#D6A85B", "#C69B4F"] : [colors.card, colors.card]}
              style={styles.saveBtn}
            >
              <Text style={[styles.saveBtnText, { color: canSave ? "#1A0E06" : colors.mutedForeground }]}>
                Crear grupo
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 20 },
  headerTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  headerTitle: { color: "#EDE1D3", fontSize: 17, fontWeight: "700" },
  headerPreview: { flexDirection: "row", alignItems: "center", gap: 14 },
  previewIcon: { width: 52, height: 52, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  previewName: { color: "#EDE1D3", fontSize: 17, fontWeight: "700", marginBottom: 4, maxWidth: 240 },
  previewSub: { color: "#EDE1D3AA", fontSize: 12 },

  label: { fontSize: 14, fontWeight: "700", marginBottom: 10, marginTop: 20 },
  hint: { fontSize: 11, marginTop: 4, marginBottom: 4 },
  input: {
    borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15,
  },
  inputMulti: {
    borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, minHeight: 80, textAlignVertical: "top",
  },

  temasGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  temaChip: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderWidth: 1, borderRadius: 20,
    paddingHorizontal: 12, paddingVertical: 7,
  },
  temaChipText: { fontSize: 13, fontWeight: "600" },

  privRow: { flexDirection: "row", gap: 12 },
  privOption: {
    flex: 1, borderWidth: 1, borderRadius: 16,
    padding: 14, gap: 8, alignItems: "center",
  },
  privTitle: { fontSize: 14, fontWeight: "700" },
  privSub: { fontSize: 11 },

  reglaRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  reglaNum: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  reglaNumText: { fontSize: 13, fontWeight: "700" },
  reglaInput: {
    flex: 1, borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 12, paddingVertical: 10, fontSize: 14,
  },
  addReglaBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 8, marginBottom: 4 },
  addReglaText: { fontSize: 14, fontWeight: "600" },

  saveBar: {
    position: "absolute", bottom: 0, left: 0, right: 0,
    paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1,
  },
  saveBtn: { borderRadius: 18, paddingVertical: 16, alignItems: "center" },
  saveBtnText: { fontSize: 16, fontWeight: "700" },
});
