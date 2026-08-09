import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { router, useLocalSearchParams } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
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
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import {
  COUNTRY_FLAGS,
  EXPANSOR_SUBTIPO_OPTIONS,
  getExpansorById,
  type Expansor,
  type ExpansorSubtipo,
} from "@/data/expansores";
import { useColors } from "@/hooks/useColors";

const H_PAD = 20;
const GOLD = "#F9F9F9";
const FG = "#FAF0EE";
const MUTED = "rgba(250,240,238,0.50)";
const CARD_BG = "rgba(74,12,12,0.12)";
const INPUT_BG = "rgba(74,12,12,0.10)";

const COUNTRY_OPTIONS = Object.keys(COUNTRY_FLAGS);

export const EXPANSOR_OVERRIDE_KEY = (id: string) =>
  `@resonancia_expansor_overrides_${id}`;

type EditForm = {
  subtipo?: ExpansorSubtipo;
  bio: string;
  city: string;
  country: string;
  servicesDescription: string;
  quote: string;
  phone: string;
  email: string;
  instagram: string;
  linktree: string;
  facebook: string;
  photoUri?: string;
};

function SectionCard({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={[styles.sectionCard, { marginHorizontal: H_PAD }]}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        {hint ? <Text style={styles.sectionHint}>{hint}</Text> : null}
      </View>
      {children}
    </View>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <Text style={styles.fieldLabel}>{children as string}</Text>;
}

export default function ExpansorEditarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const expansor = getExpansorById(id);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<EditForm>(() => ({
    subtipo: expansor?.subtipo,
    bio: expansor?.bio ?? "",
    city: expansor?.city ?? "",
    country: expansor?.country ?? "Argentina",
    servicesDescription: expansor?.servicesDescription ?? "",
    quote: expansor?.quote ?? "",
    phone: expansor?.phone ?? "",
    email: expansor?.email ?? "",
    instagram: expansor?.instagram ?? "",
    linktree: expansor?.linktree ?? "",
    facebook: expansor?.facebook ?? "",
  }));

  useEffect(() => {
    if (!id) return;
    AsyncStorage.getItem(EXPANSOR_OVERRIDE_KEY(id))
      .then((raw) => {
        if (!raw) return;
        const saved: Partial<EditForm> = JSON.parse(raw);
        setForm((prev) => ({ ...prev, ...saved }));
      })
      .catch(() => {});
  }, [id]);

  const set = <K extends keyof EditForm>(key: K, val: EditForm[K]) =>
    setForm((prev) => ({ ...prev, [key]: val }));

  async function pickPhoto() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu galería para cambiar la foto.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      set("photoUri", result.assets[0].uri);
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      await AsyncStorage.setItem(EXPANSOR_OVERRIDE_KEY(id), JSON.stringify(form));
      router.back();
    } catch {
      Alert.alert("Error", "No se pudo guardar. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  const photoSource = form.photoUri
    ? { uri: form.photoUri }
    : expansor?.photo;

  if (!expansor) {
    return (
      <View style={styles.root}>
        <StatusBar hidden />
        <LinearGradient colors={["#340D1A", "#190913"]} style={StyleSheet.absoluteFill} />
        <View style={[styles.headerRow, { paddingHorizontal: H_PAD, paddingTop: topPad + 8 }]}>
          <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
            <Feather name="arrow-left" size={22} color={FG} />
          </Pressable>
        </View>
        <View style={styles.centered}>
          <Text style={[styles.centeredText, { color: colors.mutedForeground }]}>
            Perfil no encontrado
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      <StatusBar hidden />
      <LinearGradient colors={["#340D1A", "#190913"]} style={StyleSheet.absoluteFill} />

      {/* ── Header ── */}
      <View style={[styles.headerRow, { paddingHorizontal: H_PAD, paddingTop: topPad + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={FG} />
        </Pressable>
        <Text style={styles.headerTitle}>Editar perfil</Text>
        <Pressable
          onPress={handleSave}
          disabled={saving}
          style={({ pressed }) => [styles.saveBtn, { opacity: saving || pressed ? 0.7 : 1 }]}
        >
          <Text style={styles.saveBtnText}>{saving ? "Guardando…" : "Guardar"}</Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={0}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: bottomPad + 48, gap: 10 }}
        >
          {/* ── Foto de portada ── */}
          <Pressable onPress={pickPhoto} style={styles.photoSection}>
            {photoSource ? (
              <Image
                source={photoSource}
                style={StyleSheet.absoluteFillObject}
                contentFit="cover"
                placeholder={BLUR_PLACEHOLDER}
                transition={IMAGE_TRANSITION}
              />
            ) : (
              <View style={[StyleSheet.absoluteFillObject, { backgroundColor: "#27070E" }]} />
            )}
            <LinearGradient
              colors={["transparent", "rgba(0,0,0,0.55)"]}
              style={StyleSheet.absoluteFillObject}
            />
            <View style={styles.photoCameraBtn}>
              <Feather name="camera" size={17} color="#FFFFFF" />
              <Text style={styles.photoCameraText}>Cambiar foto</Text>
            </View>
          </Pressable>

          {/* ── Especialidad ── */}
          <SectionCard title="Especialidad" hint="Aparece en tu banner de Expansor">
            <FieldLabel>Tipo de perfil</FieldLabel>
            <View style={styles.pillRow}>
              {EXPANSOR_SUBTIPO_OPTIONS.map((s) => (
                <Pressable
                  key={s}
                  onPress={() => set("subtipo", s)}
                  style={[styles.optionPill, form.subtipo === s && styles.optionPillActive]}
                >
                  <Text
                    style={[
                      styles.optionPillText,
                      form.subtipo === s && styles.optionPillTextActive,
                    ]}
                  >
                    {s}
                  </Text>
                </Pressable>
              ))}
            </View>
          </SectionCard>

          {/* ── Información básica ── */}
          <SectionCard title="Información básica">
            <View style={styles.row2}>
              <View style={{ flex: 1 }}>
                <FieldLabel>Ciudad</FieldLabel>
                <TextInput
                  style={styles.input}
                  value={form.city}
                  onChangeText={(v) => set("city", v)}
                  placeholder="Tu ciudad"
                  placeholderTextColor={MUTED}
                  selectionColor={GOLD}
                />
              </View>
              <View style={{ flex: 1 }}>
                <FieldLabel>País</FieldLabel>
                <TextInput
                  style={styles.input}
                  value={form.country}
                  onChangeText={(v) => set("country", v)}
                  placeholder="Tu país"
                  placeholderTextColor={MUTED}
                  selectionColor={GOLD}
                />
              </View>
            </View>
          </SectionCard>

          {/* ── Tu presentación ── */}
          <SectionCard title="Tu presentación">
            <FieldLabel>Bio</FieldLabel>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={form.bio}
              onChangeText={(v) => set("bio", v)}
              placeholder="Descríbete brevemente…"
              placeholderTextColor={MUTED}
              multiline
              numberOfLines={3}
              selectionColor={GOLD}
              textAlignVertical="top"
            />

            <FieldLabel>Descripción de servicios</FieldLabel>
            <TextInput
              style={[styles.input, styles.inputMulti, { minHeight: 90 }]}
              value={form.servicesDescription}
              onChangeText={(v) => set("servicesDescription", v)}
              placeholder="¿Qué ofreces? Sesiones, talleres, retiros…"
              placeholderTextColor={MUTED}
              multiline
              numberOfLines={4}
              selectionColor={GOLD}
              textAlignVertical="top"
            />

            <FieldLabel>Frase que te define</FieldLabel>
            <TextInput
              style={[styles.input, styles.inputMulti]}
              value={form.quote}
              onChangeText={(v) => set("quote", v)}
              placeholder="Una frase que te represente…"
              placeholderTextColor={MUTED}
              multiline
              numberOfLines={2}
              selectionColor={GOLD}
              textAlignVertical="top"
            />
          </SectionCard>

          {/* ── Contacto ── */}
          <SectionCard title="Contacto">
            <FieldLabel>Teléfono</FieldLabel>
            <View style={styles.inputIconWrap}>
              <Feather name="phone" size={15} color={MUTED} style={styles.inputIconLeft} />
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                value={form.phone}
                onChangeText={(v) => set("phone", v)}
                placeholder="+54 11 0000-0000"
                placeholderTextColor={MUTED}
                keyboardType="phone-pad"
                selectionColor={GOLD}
              />
            </View>

            <FieldLabel>Correo electrónico</FieldLabel>
            <View style={styles.inputIconWrap}>
              <Feather name="mail" size={15} color={MUTED} style={styles.inputIconLeft} />
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                value={form.email}
                onChangeText={(v) => set("email", v)}
                placeholder="hola@tudominio.com"
                placeholderTextColor={MUTED}
                keyboardType="email-address"
                autoCapitalize="none"
                selectionColor={GOLD}
              />
            </View>
          </SectionCard>

          {/* ── Redes sociales ── */}
          <SectionCard title="Redes sociales">
            <FieldLabel>Instagram</FieldLabel>
            <View style={styles.inputIconWrap}>
              <Feather name="instagram" size={15} color={MUTED} style={styles.inputIconLeft} />
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                value={form.instagram}
                onChangeText={(v) => set("instagram", v)}
                placeholder="https://instagram.com/tuperfil"
                placeholderTextColor={MUTED}
                autoCapitalize="none"
                keyboardType="url"
                selectionColor={GOLD}
              />
            </View>

            <FieldLabel>Linktree / Sitio web</FieldLabel>
            <View style={styles.inputIconWrap}>
              <Feather name="link" size={15} color={MUTED} style={styles.inputIconLeft} />
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                value={form.linktree}
                onChangeText={(v) => set("linktree", v)}
                placeholder="https://linktr.ee/tuperfil"
                placeholderTextColor={MUTED}
                autoCapitalize="none"
                keyboardType="url"
                selectionColor={GOLD}
              />
            </View>

            <FieldLabel>Facebook</FieldLabel>
            <View style={styles.inputIconWrap}>
              <Feather name="facebook" size={15} color={MUTED} style={styles.inputIconLeft} />
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                value={form.facebook}
                onChangeText={(v) => set("facebook", v)}
                placeholder="https://facebook.com/tuperfil"
                placeholderTextColor={MUTED}
                autoCapitalize="none"
                keyboardType="url"
                selectionColor={GOLD}
              />
            </View>
          </SectionCard>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  centeredText: { fontFamily: "Manrope", fontSize: 16 },

  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontFamily: "Manrope", fontSize: 17, fontWeight: "700", color: FG },
  saveBtn: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.45)",
  },
  saveBtnText: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600", color: GOLD },

  photoSection: {
    height: 180,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 20,
  },
  photoCameraBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(0,0,0,0.45)",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  photoCameraText: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600", color: "#FFFFFF" },

  sectionCard: {
    borderRadius: 16,
    backgroundColor: CARD_BG,
    borderWidth: 1,
    borderColor: "rgba(61,14,22,0.55)",
    padding: 16,
    gap: 2,
  },
  sectionHeader: { marginBottom: 6 },
  sectionTitle: { fontFamily: "Manrope", fontSize: 20, fontWeight: "700", color: FG, letterSpacing: 0.5 },
  sectionHint: { fontFamily: "Manrope", fontSize: 11, color: MUTED, marginTop: 2 },
  fieldLabel: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "600",
    color: MUTED,
    letterSpacing: 0.5,
    textTransform: "uppercase",
    marginTop: 10,
    marginBottom: 6,
  },

  input: {
    fontFamily: "Manrope",
    backgroundColor: INPUT_BG,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(61,14,22,0.70)",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: FG,
  },
  inputMulti: { minHeight: 70, paddingTop: 10 },
  inputIconWrap: { position: "relative" },
  inputIconLeft: { position: "absolute", left: 12, top: 11, zIndex: 1 },
  inputWithIcon: { paddingLeft: 36 },
  row2: { flexDirection: "row", gap: 10 },

  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  optionPill: {
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(61,14,22,0.80)",
    backgroundColor: INPUT_BG,
  },
  optionPillActive: {
    borderColor: GOLD,
    backgroundColor: "rgba(212,175,55,0.12)",
  },
  optionPillText: { fontFamily: "Manrope", fontSize: 13, color: MUTED },
  optionPillTextActive: { fontFamily: "Manrope", color: GOLD, fontWeight: "600" },
});
