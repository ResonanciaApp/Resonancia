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
  getResonadorById,
  type ExternalProject,
  type FormacionItem,
  type ResonadorSubtipo,
} from "@/data/resonadores";
import { useColors } from "@/hooks/useColors";

const H_PAD = 20;
const GOLD = "#dad4ec";
const FG = "#FAF0EE";
const MUTED = "rgba(250,240,238,0.50)";
const CARD_BG = "rgba(74,12,12,0.12)";
const INPUT_BG = "rgba(74,12,12,0.10)";

const SUBTIPO_OPTIONS: ResonadorSubtipo[] = ["Voz guía", "Músico", "Sonoterapeuta", "Productor"];
const COUNTRY_OPTIONS = Object.keys(COUNTRY_FLAGS);

const PLATFORM_OPTIONS: ExternalProject["platform"][] = [
  "spotify", "soundcloud", "bandcamp", "youtube", "web",
];
const PLATFORM_LABELS: Record<ExternalProject["platform"], string> = {
  spotify: "Spotify",
  soundcloud: "SoundCloud",
  bandcamp: "Bandcamp",
  youtube: "YouTube",
  web: "Web",
};

export const RESONADOR_OVERRIDE_KEY = (id: string) =>
  `@resonancia_resonador_overrides_${id}`;

type EditForm = {
  name: string;
  subtipo: ResonadorSubtipo;
  city: string;
  country: string;
  bio: string;
  servicesDescription: string;
  quote: string;
  instagram: string;
  linktree: string;
  donationUrl: string;
  projects: ExternalProject[];
  formacion: FormacionItem[];
  photoUri?: string;
  photos: string[];
};

export default function ResonadorEditarScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const resonador = getResonadorById(id);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState<EditForm>(() => ({
    name: resonador?.name ?? "",
    subtipo: resonador?.subtipo ?? "Músico",
    city: resonador?.city ?? "",
    country: resonador?.country ?? "Chile",
    bio: resonador?.bio ?? "",
    servicesDescription: resonador?.servicesDescription ?? "",
    quote: resonador?.quote ?? "",
    instagram: resonador?.instagram ?? "",
    linktree: resonador?.linktree ?? "",
    donationUrl: resonador?.donationUrl ?? "",
    projects: resonador?.projects ? [...resonador.projects] : [],
    formacion: resonador?.formacion ? [...resonador.formacion] : [],
    photos: resonador?.photos ? [...resonador.photos] : [],
  }));

  useEffect(() => {
    if (!id) return;
    AsyncStorage.getItem(RESONADOR_OVERRIDE_KEY(id))
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

  async function pickGridPhoto() {
    if (form.photos.length >= 6) {
      Alert.alert("Límite alcanzado", "Podés agregar hasta 6 fotos en la galería.");
      return;
    }
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permiso requerido", "Necesitamos acceso a tu galería.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      set("photos", [...form.photos, result.assets[0].uri]);
    }
  }

  function removeGridPhoto(index: number) {
    set("photos", form.photos.filter((_, i) => i !== index));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await AsyncStorage.setItem(RESONADOR_OVERRIDE_KEY(id), JSON.stringify(form));
      router.back();
    } catch {
      Alert.alert("Error", "No se pudo guardar. Inténtalo de nuevo.");
    } finally {
      setSaving(false);
    }
  }

  const photoSource = form.photoUri
    ? { uri: form.photoUri }
    : resonador?.photo;

  const addProject = () =>
    set("projects", [...form.projects, { platform: "web" as const, label: "", url: "" }]);
  const removeProject = (i: number) =>
    set("projects", form.projects.filter((_, idx) => idx !== i));
  const updateProject = (i: number, patch: Partial<ExternalProject>) =>
    set("projects", form.projects.map((p, idx) => (idx === i ? { ...p, ...patch } : p)));

  const addFormacion = () =>
    set("formacion", [...form.formacion, { titulo: "", institucion: "", years: "" }]);
  const removeFormacion = (i: number) =>
    set("formacion", form.formacion.filter((_, idx) => idx !== i));
  const updateFormacion = (i: number, patch: Partial<FormacionItem>) =>
    set("formacion", form.formacion.map((f, idx) => (idx === i ? { ...f, ...patch } : f)));

  if (!resonador) {
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

          {/* ── Información básica ── */}
          <SectionCard title="Información básica">
            <FieldLabel>Nombre</FieldLabel>
            <TextInput
              style={styles.input}
              value={form.name}
              onChangeText={(v) => set("name", v)}
              placeholder="Tu nombre artístico"
              placeholderTextColor={MUTED}
              selectionColor={GOLD}
            />

            <FieldLabel>Tipo de perfil</FieldLabel>
            <View style={styles.pillRow}>
              {SUBTIPO_OPTIONS.map((s) => (
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
              placeholder="¿Qué ofreces? Sesiones, talleres, meditaciones…"
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

          {/* ── Redes y apoyo ── */}
          <SectionCard title="Redes y apoyo">
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

            <FieldLabel>URL de apoyo económico</FieldLabel>
            <View style={styles.inputIconWrap}>
              <Feather name="heart" size={15} color={MUTED} style={styles.inputIconLeft} />
              <TextInput
                style={[styles.input, styles.inputWithIcon]}
                value={form.donationUrl}
                onChangeText={(v) => set("donationUrl", v)}
                placeholder="https://cafecito.app/… o similar"
                placeholderTextColor={MUTED}
                autoCapitalize="none"
                keyboardType="url"
                selectionColor={GOLD}
              />
            </View>
          </SectionCard>

          {/* ── Proyectos externos ── */}
          <SectionCard title="Proyectos externos" hint="Spotify, YouTube, Bandcamp…">
            {form.projects.map((proj, i) => (
              <View key={i} style={styles.listItem}>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={{ marginBottom: 8 }}
                >
                  <View style={{ flexDirection: "row", gap: 6 }}>
                    {PLATFORM_OPTIONS.map((p) => (
                      <Pressable
                        key={p}
                        onPress={() => updateProject(i, { platform: p })}
                        style={[
                          styles.optionPillSm,
                          proj.platform === p && styles.optionPillActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.optionPillTextSm,
                            proj.platform === p && styles.optionPillTextActive,
                          ]}
                        >
                          {PLATFORM_LABELS[p]}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>

                <TextInput
                  style={[styles.input, { marginBottom: 6 }]}
                  value={proj.label}
                  onChangeText={(v) => updateProject(i, { label: v })}
                  placeholder="Etiqueta (ej. Mi canal de YouTube)"
                  placeholderTextColor={MUTED}
                  selectionColor={GOLD}
                />

                <View style={styles.listItemRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={proj.url}
                    onChangeText={(v) => updateProject(i, { url: v })}
                    placeholder="https://…"
                    placeholderTextColor={MUTED}
                    autoCapitalize="none"
                    keyboardType="url"
                    selectionColor={GOLD}
                  />
                  <Pressable onPress={() => removeProject(i)} style={styles.removeBtn} hitSlop={8}>
                    <Feather name="trash-2" size={16} color="rgba(250,240,238,0.35)" />
                  </Pressable>
                </View>

                {i < form.projects.length - 1 && <View style={styles.listDivider} />}
              </View>
            ))}

            <Pressable onPress={addProject} style={styles.addBtn}>
              <Feather name="plus" size={14} color={GOLD} />
              <Text style={styles.addBtnText}>Agregar proyecto</Text>
            </Pressable>
          </SectionCard>

          {/* ── Formación y estudios ── */}
          <SectionCard title="Formación y estudios">
            {form.formacion.map((f, i) => (
              <View key={i} style={styles.listItem}>
                <TextInput
                  style={[styles.input, { marginBottom: 6 }]}
                  value={f.titulo}
                  onChangeText={(v) => updateFormacion(i, { titulo: v })}
                  placeholder="Título o certificación"
                  placeholderTextColor={MUTED}
                  selectionColor={GOLD}
                />
                <TextInput
                  style={[styles.input, { marginBottom: 6 }]}
                  value={f.institucion}
                  onChangeText={(v) => updateFormacion(i, { institucion: v })}
                  placeholder="Institución"
                  placeholderTextColor={MUTED}
                  selectionColor={GOLD}
                />
                <View style={styles.listItemRow}>
                  <TextInput
                    style={[styles.input, { flex: 1 }]}
                    value={f.years ?? ""}
                    onChangeText={(v) => updateFormacion(i, { years: v })}
                    placeholder="Años (ej. 2020 — 2022)"
                    placeholderTextColor={MUTED}
                    selectionColor={GOLD}
                  />
                  <Pressable onPress={() => removeFormacion(i)} style={styles.removeBtn} hitSlop={8}>
                    <Feather name="trash-2" size={16} color="rgba(250,240,238,0.35)" />
                  </Pressable>
                </View>

                {i < form.formacion.length - 1 && <View style={styles.listDivider} />}
              </View>
            ))}

            <Pressable onPress={addFormacion} style={styles.addBtn}>
              <Feather name="plus" size={14} color={GOLD} />
              <Text style={styles.addBtnText}>Agregar formación</Text>
            </Pressable>
          </SectionCard>

          {/* ── Galería de fotos ── */}
          <SectionCard title="Galería de fotos" hint="Hasta 6 fotos para tu perfil">
            <View style={styles.gridWrap}>
              {form.photos.map((uri, i) => (
                <View key={i} style={styles.gridCell}>
                  <Image
                    source={{ uri }}
                    style={{ width: "100%", height: "100%" }}
                    contentFit="cover"
                  />
                  <Pressable
                    onPress={() => removeGridPhoto(i)}
                    style={styles.gridRemoveBtn}
                    hitSlop={6}
                  >
                    <Feather name="x" size={12} color="#fff" />
                  </Pressable>
                </View>
              ))}
              {form.photos.length < 6 && (
                <Pressable onPress={pickGridPhoto} style={styles.gridAddCell}>
                  <Feather name="plus" size={22} color={GOLD} />
                  <Text style={styles.gridAddText}>Agregar</Text>
                </Pressable>
              )}
            </View>
          </SectionCard>

          {/* ── Guardar (bottom) ── */}
          <Pressable
            onPress={handleSave}
            disabled={saving}
            style={({ pressed }) => [
              styles.saveBottomBtn,
              { marginHorizontal: H_PAD, opacity: saving || pressed ? 0.7 : 1 },
            ]}
          >
            <LinearGradient
              colors={["#dad4ec", "#f3e7e9"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            <Feather name="check" size={16} color="#1B060F" />
            <Text style={styles.saveBottomBtnText}>
              {saving ? "Guardando…" : "Guardar cambios"}
            </Text>
          </Pressable>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

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

  /* Photo */
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

  /* Section card */
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

  /* Inputs */
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

  /* Option pills */
  pillRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  optionPill: {
    borderRadius: 16,
    paddingHorizontal: 13,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(61,14,22,0.80)",
    backgroundColor: INPUT_BG,
  },
  optionPillSm: {
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: "rgba(61,14,22,0.80)",
    backgroundColor: INPUT_BG,
  },
  optionPillActive: {
    borderColor: GOLD,
    backgroundColor: "rgba(212,175,55,0.10)",
  },
  optionPillText: { fontFamily: "Manrope", fontSize: 13, color: MUTED },
  optionPillTextSm: { fontFamily: "Manrope", fontSize: 12, color: MUTED },
  optionPillTextActive: { fontFamily: "Manrope", color: GOLD, fontWeight: "600" },

  /* Dynamic lists */
  listItem: { marginBottom: 8 },
  listItemRow: { flexDirection: "row", gap: 8, alignItems: "center" },
  listDivider: {
    height: 1,
    backgroundColor: "rgba(61,14,22,0.55)",
    marginVertical: 12,
  },
  removeBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(61,14,22,0.35)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.22)",
    backgroundColor: "rgba(212,175,55,0.04)",
    marginTop: 8,
  },
  addBtnText: { fontFamily: "Manrope", fontSize: 13, color: GOLD, fontWeight: "500" },

  /* Bottom save button */
  saveBottomBtn: {
    height: 50,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    overflow: "hidden",
    marginTop: 8,
  },
  saveBottomBtnText: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700", color: "#1B060F" },
  gridWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  gridCell: {
    width: 88,
    height: 88,
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: CARD_BG,
  },
  gridRemoveBtn: {
    position: "absolute",
    top: 5,
    right: 5,
    backgroundColor: "rgba(0,0,0,0.60)",
    borderRadius: 10,
    width: 20,
    height: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  gridAddCell: {
    width: 88,
    height: 88,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.35)",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    backgroundColor: "rgba(212,175,55,0.04)",
  },
  gridAddText: { fontFamily: "Manrope", fontSize: 10, color: GOLD },
});
