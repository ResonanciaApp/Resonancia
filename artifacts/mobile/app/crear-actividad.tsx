import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
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

const TIPOS = [
  { id: "presencial", label: "Presencial", icon: "map-pin" as const, desc: "Encuentro en un lugar físico" },
  { id: "virtual", label: "Virtual", icon: "video" as const, desc: "Por videollamada" },
  { id: "retiro", label: "Retiro", icon: "feather" as const, desc: "Experiencia inmersiva" },
];

const CIUDADES = ["Buenos Aires", "Córdoba", "Rosario", "Mendoza", "Madrid", "Barcelona", "Montevideo", "Ciudad de México"];

export default function CrearActividadScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [titulo, setTitulo] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [tipo, setTipo] = useState("presencial");
  const [ciudad, setCiudad] = useState("");
  const [fecha, setFecha] = useState("");
  const [hora, setHora] = useState("");
  const [capacidad, setCapacidad] = useState("");
  const [lugar, setLugar] = useState("");
  const [showCiudades, setShowCiudades] = useState(false);
  const [step, setStep] = useState<"form" | "preview">("form");

  const tipoData = TIPOS.find(t => t.id === tipo)!;

  if (step === "preview") {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <StatusBar barStyle="light-content" />
        <SacredBackground />
        <ScrollView
          contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: bottomPad + 40, paddingHorizontal: 20 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.headerRow}>
            <Pressable onPress={() => setStep("form")} hitSlop={12}>
              <Feather name="arrow-left" size={22} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.screenTitle, { color: colors.foreground }]}>Vista previa</Text>
            <View style={{ width: 22 }} />
          </View>

          {/* Preview card */}
          <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.primary + "55" }]}>
            <LinearGradient colors={["#4A0C0C", "#27070E", "#1B060F"]} style={styles.previewAccent} />
            <View style={styles.previewInner}>
              <View style={styles.previewTop}>
                <View style={[styles.previewIcon, { backgroundColor: colors.primary + "22" }]}>
                  <Feather name={tipoData.icon} size={24} color={colors.primary} />
                </View>
                <View style={[styles.typeBadge, { backgroundColor: colors.primary + "20" }]}>
                  <Text style={[styles.typeBadgeText, { color: colors.primary }]}>{tipoData.label}</Text>
                </View>
              </View>

              <Text style={[styles.previewTitle, { color: colors.foreground }]}>
                {titulo || "Título de la actividad"}
              </Text>
              <Text style={[styles.previewDesc, { color: colors.mutedForeground }]}>
                {descripcion || "Descripción de la actividad..."}
              </Text>

              <View style={styles.previewMeta}>
                {ciudad ? (
                  <View style={styles.metaRow}>
                    <Feather name="map-pin" size={13} color={colors.accent} />
                    <Text style={[styles.metaText, { color: colors.foreground }]}>{ciudad}</Text>
                  </View>
                ) : null}
                {lugar ? (
                  <View style={styles.metaRow}>
                    <Feather name="home" size={13} color={colors.accent} />
                    <Text style={[styles.metaText, { color: colors.foreground }]}>{lugar}</Text>
                  </View>
                ) : null}
                {fecha ? (
                  <View style={styles.metaRow}>
                    <Feather name="calendar" size={13} color={colors.accent} />
                    <Text style={[styles.metaText, { color: colors.foreground }]}>
                      {fecha}{hora ? ` · ${hora}` : ""}
                    </Text>
                  </View>
                ) : null}
                {capacidad ? (
                  <View style={styles.metaRow}>
                    <Feather name="users" size={13} color={colors.accent} />
                    <Text style={[styles.metaText, { color: colors.foreground }]}>Capacidad: {capacidad} personas</Text>
                  </View>
                ) : null}
              </View>

              {/* Organizer */}
              <View style={[styles.organizerRow, { borderTopColor: colors.border }]}>
                <View style={[styles.orgAvatar, { backgroundColor: colors.primary + "30" }]}>
                  <Text style={[styles.orgInitials, { color: colors.primary }]}>TÚ</Text>
                </View>
                <Text style={[styles.orgName, { color: colors.mutedForeground }]}>Publicado por vos</Text>
              </View>
            </View>
          </View>

          <Text style={[styles.previewHint, { color: colors.mutedForeground }]}>
            Así verán tu actividad los demás miembros de la comunidad.
          </Text>

          <Pressable
            style={({ pressed }) => [styles.publishBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() => router.back()}
          >
            <LinearGradient colors={["#4A0C0C", "#27070E", "#1B060F"]} style={styles.publishGrad}>
              <Feather name="check-circle" size={18} color="#080F0A" />
              <Text style={styles.publishText}>Publicar actividad</Text>
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: bottomPad + 40, paddingHorizontal: 20 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.headerRow}>
            <Pressable onPress={() => router.back()} hitSlop={12}>
              <Feather name="arrow-left" size={22} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.screenTitle, { color: colors.foreground }]}>Nueva actividad</Text>
            <View style={{ width: 22 }} />
          </View>

          {/* Tipo */}
          <Label text="¿Qué tipo de actividad?" colors={colors} />
          <View style={styles.tipoRow}>
            {TIPOS.map((t) => (
              <Pressable
                key={t.id}
                onPress={() => setTipo(t.id)}
                style={[
                  styles.tipoCard,
                  {
                    backgroundColor: tipo === t.id ? colors.primary + "18" : colors.card,
                    borderColor: tipo === t.id ? colors.primary : colors.border,
                  },
                ]}
              >
                <Feather name={t.icon} size={20} color={tipo === t.id ? colors.primary : colors.mutedForeground} />
                <Text style={[styles.tipoLabel, { color: tipo === t.id ? colors.primary : colors.foreground }]}>
                  {t.label}
                </Text>
                <Text style={[styles.tipoDesc, { color: colors.mutedForeground }]}>{t.desc}</Text>
              </Pressable>
            ))}
          </View>

          {/* Título */}
          <Label text="Título" colors={colors} />
          <InputField
            value={titulo}
            onChangeText={setTitulo}
            placeholder="Ej: Baño de Cuencos al Atardecer"
            colors={colors}
            icon="type"
          />

          {/* Descripción */}
          <Label text="Descripción" colors={colors} />
          <View style={[styles.textArea, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              value={descripcion}
              onChangeText={setDescripcion}
              placeholder="Contá de qué se trata, qué van a vivir los participantes..."
              placeholderTextColor={colors.mutedForeground}
              multiline
              numberOfLines={4}
              style={[styles.textAreaInput, { color: colors.foreground }]}
              textAlignVertical="top"
            />
          </View>

          {/* Ciudad */}
          <Label text="Ciudad" colors={colors} />
          <Pressable
            onPress={() => setShowCiudades(v => !v)}
            style={[styles.selectRow, { backgroundColor: colors.card, borderColor: showCiudades ? colors.primary : colors.border }]}
          >
            <Feather name="map-pin" size={15} color={colors.mutedForeground} />
            <Text style={[styles.selectText, { color: ciudad ? colors.foreground : colors.mutedForeground, flex: 1 }]}>
              {ciudad || "Seleccionar ciudad"}
            </Text>
            <Feather name={showCiudades ? "chevron-up" : "chevron-down"} size={16} color={colors.mutedForeground} />
          </Pressable>
          {showCiudades && (
            <View style={[styles.dropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {CIUDADES.map(c => (
                <Pressable
                  key={c}
                  onPress={() => { setCiudad(c); setShowCiudades(false); }}
                  style={[styles.dropdownItem, { borderBottomColor: colors.border }]}
                >
                  <Text style={[styles.dropdownText, { color: ciudad === c ? colors.primary : colors.foreground }]}>{c}</Text>
                  {ciudad === c && <Feather name="check" size={14} color={colors.primary} />}
                </Pressable>
              ))}
            </View>
          )}

          {/* Lugar (solo si presencial o retiro) */}
          {tipo !== "virtual" && (
            <>
              <Label text="Dirección / Lugar" colors={colors} />
              <InputField
                value={lugar}
                onChangeText={setLugar}
                placeholder="Ej: Parque Centenario, Sala Azul"
                colors={colors}
                icon="home"
              />
            </>
          )}

          {/* Fecha y hora */}
          <View style={styles.row2}>
            <View style={{ flex: 1 }}>
              <Label text="Fecha" colors={colors} />
              <InputField value={fecha} onChangeText={setFecha} placeholder="Ej: 31 mayo 2026" colors={colors} icon="calendar" />
            </View>
            <View style={{ flex: 1 }}>
              <Label text="Hora" colors={colors} />
              <InputField value={hora} onChangeText={setHora} placeholder="Ej: 18:30" colors={colors} icon="clock" />
            </View>
          </View>

          {/* Capacidad */}
          <Label text="Capacidad máxima (personas)" colors={colors} />
          <InputField
            value={capacidad}
            onChangeText={setCapacidad}
            placeholder="Ej: 20"
            colors={colors}
            icon="users"
            keyboardType="numeric"
          />

          {/* Preview button */}
          <Pressable
            style={({ pressed }) => [styles.previewBtn, { borderColor: colors.primary, opacity: pressed ? 0.8 : 1 }]}
            onPress={() => setStep("preview")}
          >
            <Feather name="eye" size={16} color={colors.primary} />
            <Text style={[styles.previewBtnText, { color: colors.primary }]}>Ver vista previa</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.publishBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={() => setStep("preview")}
          >
            <LinearGradient colors={["#4A0C0C", "#27070E", "#1B060F"]} style={styles.publishGrad}>
              <Text style={styles.publishText}>Continuar</Text>
              <Feather name="arrow-right" size={18} color="#080F0A" />
            </LinearGradient>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function Label({ text, colors }: { text: string; colors: any }) {
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
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 24, height: 40 },
  screenTitle: { fontSize: 17, fontWeight: "700" },
  label: { fontSize: 12, fontWeight: "600", letterSpacing: 0.4, textTransform: "uppercase", marginBottom: 8, marginTop: 16 },
  tipoRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
  tipoCard: { flex: 1, borderRadius: 14, borderWidth: 1.5, padding: 14, alignItems: "center", gap: 6 },
  tipoLabel: { fontSize: 13, fontWeight: "700" },
  tipoDesc: { fontSize: 10, textAlign: "center" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  inputText: { flex: 1, fontSize: 14 },
  textArea: { borderRadius: 14, borderWidth: 1, padding: 14, minHeight: 100 },
  textAreaInput: { fontSize: 14, lineHeight: 22 },
  selectRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  selectText: { fontSize: 14 },
  dropdown: {
    borderRadius: 14,
    borderWidth: 1,
    overflow: "hidden",
    marginTop: 4,
    marginBottom: 4,
  },
  dropdownItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 13,
    borderBottomWidth: 1,
  },
  dropdownText: { fontSize: 14 },
  row2: { flexDirection: "row", gap: 12 },
  previewBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 14,
    paddingVertical: 13,
    marginTop: 24,
    marginBottom: 12,
  },
  previewBtnText: { fontSize: 14, fontWeight: "600" },
  publishBtn: { borderRadius: 16, overflow: "hidden" },
  publishGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 16 },
  publishText: { color: "#080F0A", fontWeight: "700", fontSize: 16 },
  // Preview styles
  previewCard: { borderRadius: 20, borderWidth: 1.5, overflow: "hidden", marginBottom: 16 },
  previewAccent: { height: 5 },
  previewInner: { padding: 20, gap: 10 },
  previewTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  previewIcon: { width: 50, height: 50, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  typeBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  typeBadgeText: { fontSize: 12, fontWeight: "700" },
  previewTitle: { fontSize: 20, fontWeight: "700", lineHeight: 26 },
  previewDesc: { fontSize: 14, lineHeight: 21 },
  previewMeta: { gap: 8 },
  metaRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  metaText: { fontSize: 13 },
  organizerRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingTop: 14, marginTop: 4, borderTopWidth: 1 },
  orgAvatar: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  orgInitials: { fontSize: 11, fontWeight: "700" },
  orgName: { fontSize: 13 },
  previewHint: { fontSize: 12, textAlign: "center", lineHeight: 18, marginBottom: 24 },
});
