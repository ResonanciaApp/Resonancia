import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";
import { useGrupos } from "@/hooks/useGrupos";

const BG_GRADIENT = ["#090D20", "#080A18", "#06070F"] as const;

// ─── Image library ────────────────────────────────────────────────────────────
const GALLERY = [
  require("@/assets/images/sessions/session-1.jpg"),
  require("@/assets/images/sessions/session-2.jpg"),
  require("@/assets/images/sessions/session-1.jpg"),
  require("@/assets/images/sessions/session-4.jpg"),
  require("@/assets/images/sessions/session-5.jpg"),
  require("@/assets/images/sessions/session-4.jpg"),
  require("@/assets/images/sessions/session-7.jpg"),
  require("@/assets/images/sessions/session-8.jpg"),
  require("@/assets/images/sessions/session-9.jpg"),
  require("@/assets/images/sessions/session-10.jpg"),
  require("@/assets/images/sessions/session-5.jpg"),
  require("@/assets/images/sessions/session-7.jpg"),
  require("@/assets/images/sessions/session-8.jpg"),
  require("@/assets/images/sessions/session-9.jpg"),
  require("@/assets/images/sessions/session-10.jpg"),
  require("@/assets/images/sessions/session-20.jpg"),
  require("@/assets/images/sessions/session-27.jpg"),
  require("@/assets/images/sessions/session-2.jpg"),
  require("@/assets/images/sessions/session-1.jpg"),
  require("@/assets/images/sessions/session-20.jpg"),
  require("@/assets/images/sessions/session-27.jpg"),
  require("@/assets/images/sessions/session-28.jpg"),
];

// ─── Fake invite code ─────────────────────────────────────────────────────────
function makeCode(name: string) {
  const slug = name.toLowerCase().replace(/\s+/g, "-").slice(0, 20);
  const rand = Math.random().toString(36).slice(2, 6);
  return `resonancia.app/grupo/${slug}-${rand}`;
}

// ─── Group preview header (shown behind sheets in steps 2+) ──────────────────
function GroupPreview({
  nombre,
  privado,
  imageIdx,
  colors,
}: {
  nombre: string;
  privado: boolean;
  imageIdx: number | null;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
}) {
  const initial = (nombre.trim()[0] ?? "G").toUpperCase();
  return (
    <View style={preview.root}>
      {/* Avatar */}
      {imageIdx !== null ? (
        <Image source={GALLERY[imageIdx]} style={preview.image} />
      ) : (
        <LinearGradient colors={["#090D20", "#080A18", "#06070F"]} style={preview.image}>
          <Text style={preview.initial}>{initial}</Text>
        </LinearGradient>
      )}
      <Text style={preview.name}>{nombre || "Nombre del grupo"}</Text>
      <Text style={preview.meta}>
        {privado ? "PRIVADO" : "PÚBLICO"} · 1 MIEMBRO
      </Text>
      {/* Fake invite row */}
      <View style={preview.inviteRow}>
        <View style={preview.memberDot}>
          <Text style={preview.memberDotText}>T</Text>
        </View>
        <Pressable style={preview.inviteBtn}>
          <Feather name="plus" size={13} color="#FFFFFF" />
          <Text style={preview.inviteBtnText}>Invitar</Text>
        </Pressable>
      </View>
      {/* Fake tab bar */}
      <View style={[preview.tabs, { borderTopColor: "rgba(237,225,211,0.12)" }]}>
        {["Hilo principal", "Biblioteca", "Medita", "Chat"].map((t, i) => (
          <Text key={t} style={[preview.tab, i === 0 && preview.tabActive]}>
            {t}
          </Text>
        ))}
      </View>
    </View>
  );
}

const preview = StyleSheet.create({
  root: { alignItems: "center", paddingTop: 32, paddingBottom: 16, backgroundColor: "#090D20" },
  image: { width: 72, height: 72, borderRadius: 18, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  initial: { fontSize: 28, fontWeight: "700", color: "#FFFFFF" },
  name: { color: "#FFFFFF", fontSize: 18, fontWeight: "700", marginBottom: 4 },
  meta: { color: "rgba(237,225,211,0.55)", fontSize: 12, letterSpacing: 0.8, marginBottom: 14 },
  inviteRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 16 },
  memberDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: "#0F1A2A", alignItems: "center", justifyContent: "center" },
  memberDotText: { color: "#A8C4A8", fontSize: 13, fontWeight: "700" },
  inviteBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(237,225,211,0.12)", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 6 },
  inviteBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  tabs: { flexDirection: "row", width: "100%", borderTopWidth: 1, paddingHorizontal: 16 },
  tab: { paddingVertical: 12, marginRight: 24, color: "rgba(237,225,211,0.4)", fontSize: 14 },
  tabActive: { color: "#FFFFFF", borderBottomWidth: 2, borderBottomColor: "#FFFFFF", fontWeight: "600" },
});

// ─── Bottom sheet wrapper ─────────────────────────────────────────────────────
function BottomSheet({ children, colors }: { children: React.ReactNode; colors: ReturnType<typeof import("@/hooks/useColors").useColors> }) {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, tension: 70, friction: 12 }).start();
  }, [anim]);
  return (
    <Animated.View
      style={[
        sheet.root,
        { backgroundColor: colors.card },
        { transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [300, 0] }) }] },
      ]}
    >
      {children}
    </Animated.View>
  );
}
const sheet = StyleSheet.create({
  root: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 12 },
});

// ─── Main wizard ──────────────────────────────────────────────────────────────
type Step = 1 | 2 | 3 | 4 | 5;

export default function CrearGrupoScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 0 : insets.top;
  const bottomPad = Platform.OS === "web" ? 24 : insets.bottom;

  const { privado: privadoParam } = useLocalSearchParams<{ privado?: string }>();
  const privado = privadoParam === "1";

  const [step, setStep] = useState<Step>(1);
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [imageIdx, setImageIdx] = useState<number | null>(null);
  const [bienvenida, setBienvenida] = useState("");
  const [inviteCode] = useState(() => makeCode(nombre || "grupo"));
  const [saved, setSaved] = useState(false);
  const { saveGrupo } = useGrupos();

  const nameInputRef = useRef<TextInput>(null);
  const remaining = 40 - nombre.length;
  const canNext1 = nombre.trim().length >= 3;

  useEffect(() => {
    if (step === 1) setTimeout(() => nameInputRef.current?.focus(), 200);
  }, [step]);

  // Save group when reaching step 5 (share screen)
  useEffect(() => {
    if (step === 5 && !saved) {
      const code = makeCode(nombre);
      saveGrupo({
        id: `g-${Date.now()}`,
        nombre: nombre.trim(),
        descripcion,
        privado,
        imageIdx,
        bienvenida,
        inviteCode: code,
        creadoEn: Date.now(),
      });
      setSaved(true);
    }
  }, [step, saved, nombre, descripcion, privado, imageIdx, bienvenida, saveGrupo]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `¡Únete a mi grupo "${nombre}" en RESONANCIA!\n\n${inviteCode}`,
        url: `https://${inviteCode}`,
      });
    } catch {}
  }, [nombre, inviteCode]);

  // ── Step 1: Name ─────────────────────────────────────────────────────────────
  if (step === 1) {
    return (
      <KeyboardAvoidingView
        style={styles.root}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <StatusBar barStyle="light-content" />
        <LinearGradient
          style={StyleSheet.absoluteFill}
          colors={BG_GRADIENT}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <View style={{ paddingTop: topPad + 12, paddingHorizontal: 20, flex: 1 }}>
          {/* Close */}
          <Pressable onPress={() => router.back()} hitSlop={12} style={styles.closeBtn}>
            <View style={styles.closeBtnInner}>
              <Feather name="x" size={18} color="#FFFFFF" />
            </View>
          </Pressable>

          <Text style={styles.stepTitle}>¿Cómo se llamará tu grupo?</Text>

          <View style={[styles.nameInputBox, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TextInput
              ref={nameInputRef}
              value={nombre}
              onChangeText={(v) => setNombre(v.slice(0, 40))}
              placeholder="Nombre del Grupo"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.nameInput, { color: colors.foreground }]}
              maxLength={40}
              returnKeyType="done"
              onSubmitEditing={() => canNext1 && setStep(2)}
            />
            <Text style={[styles.nameCounter, { color: remaining < 10 ? "#BE9650" : colors.mutedForeground }]}>
              {remaining}
            </Text>
          </View>
        </View>

        {/* Terminar button pinned to bottom */}
        <View style={[styles.stepFooter, { paddingBottom: bottomPad + 12 }]}>
          <Pressable
            onPress={() => canNext1 && setStep(2)}
            style={[styles.nextBtn, { backgroundColor: canNext1 ? "#DFC76A" : colors.card }]}
            disabled={!canNext1}
          >
            <Text style={[styles.nextBtnText, { color: canNext1 ? "#070E09" : colors.mutedForeground }]}>
              Terminar
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ── Steps 2-5: Group preview + bottom sheet ───────────────────────────────
  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <StatusBar barStyle="light-content" />
        <LinearGradient
          style={StyleSheet.absoluteFill}
          colors={BG_GRADIENT}
          locations={[0, 0.5, 1]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />

      {/* Back arrow top-left */}
      <View style={{ paddingTop: topPad + 8, paddingHorizontal: 16, flexDirection: "row", justifyContent: "space-between" }}>
        <Pressable onPress={() => setStep((s) => Math.max(1, s - 1) as Step)} hitSlop={12}>
          <Feather name="arrow-left" size={22} color="#FFFFFF" />
        </Pressable>
        <Feather name="settings" size={20} color="rgba(237,225,211,0.3)" />
      </View>

      {/* Group preview (visible behind sheet) */}
      <GroupPreview nombre={nombre} privado={privado} imageIdx={imageIdx} colors={colors} />

      {/* Sheet */}
      <View style={{ flex: 1, justifyContent: "flex-end" }}>
        <BottomSheet key={step} colors={colors}>

          {/* ── Step 2: Description ── */}
          {step === 2 && (
            <>
              <View style={styles.sheetTopRow}>
                <Text style={[styles.sheetTitle, { color: colors.foreground }]}>¡Grupo creado!</Text>
                <Pressable onPress={() => setStep(3)} hitSlop={12}>
                  <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Omitir</Text>
                </Pressable>
              </View>
              <Text style={[styles.sheetSub, { color: colors.mutedForeground }]}>
                Agregá una breve descripción para que los demás sepan de qué se trata.
              </Text>
              <TextInput
                value={descripcion}
                onChangeText={setDescripcion}
                placeholder="Agregar una descripción (Opcional)"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.sheetTextarea, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                multiline
                numberOfLines={4}
                maxLength={200}
              />
              <Pressable
                onPress={() => setStep(3)}
                style={[styles.sheetNext, { backgroundColor: "#DFC76A" }]}
              >
                <Text style={[styles.sheetNextText, { color: "#070E09" }]}>Siguiente</Text>
              </Pressable>
              <View style={{ height: bottomPad + 8 }} />
            </>
          )}

          {/* ── Step 3: Image picker ── */}
          {step === 3 && (
            <>
              <View style={styles.sheetTopRow}>
                <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Imagen de Portada</Text>
              </View>
              <Text style={[styles.sheetSub, { color: colors.mutedForeground }]}>
                Asegurate que tu Grupo destaque seleccionando una imagen relevante.
              </Text>
              <ScrollView style={{ maxHeight: 230 }} showsVerticalScrollIndicator={false}>
                <View style={styles.galleryGrid}>
                  {GALLERY.map((src, i) => (
                    <Pressable
                      key={i}
                      onPress={() => setImageIdx(i)}
                      style={[styles.galleryItem, imageIdx === i && styles.galleryItemSelected]}
                    >
                      <Image source={src} style={styles.galleryImg} />
                      {imageIdx === i && (
                        <View style={styles.galleryCheck}>
                          <Feather name="check" size={14} color="#fff" />
                        </View>
                      )}
                    </Pressable>
                  ))}
                </View>
              </ScrollView>
              <View style={[styles.sheetNavRow, { marginTop: 14 }]}>
                <Pressable onPress={() => setStep(2)} style={styles.prevBtn}>
                  <Text style={[styles.prevBtnText, { color: colors.mutedForeground }]}>Anterior</Text>
                </Pressable>
                <Pressable
                  onPress={() => setStep(4)}
                  style={[styles.sheetNext, { flex: 1, backgroundColor: "#DFC76A" }]}
                >
                  <Text style={[styles.sheetNextText, { color: "#070E09" }]}>Siguiente</Text>
                </Pressable>
              </View>
              <View style={{ height: bottomPad + 8 }} />
            </>
          )}

          {/* ── Step 4: Welcome message ── */}
          {step === 4 && (
            <>
              <View style={styles.sheetTopRow}>
                <Text style={[styles.sheetTitle, { color: colors.foreground }]}>Mensaje de Bienvenida</Text>
                <Pressable onPress={() => setStep(5)} hitSlop={12}>
                  <Text style={[styles.skipText, { color: colors.mutedForeground }]}>Omitir</Text>
                </Pressable>
              </View>
              <Text style={[styles.sheetSub, { color: colors.mutedForeground }]}>
                Escribí un mensaje que verán las personas al unirse al grupo.
              </Text>
              <TextInput
                value={bienvenida}
                onChangeText={setBienvenida}
                placeholder="Ej: Bienvenido/a al grupo. Aquí compartimos..."
                placeholderTextColor={colors.mutedForeground}
                style={[styles.sheetTextarea, { backgroundColor: colors.background, color: colors.foreground, borderColor: colors.border }]}
                multiline
                numberOfLines={4}
                maxLength={300}
                blurOnSubmit
                returnKeyType="done"
              />
              <View style={styles.sheetNavRow}>
                <Pressable onPress={() => setStep(3)} style={styles.prevBtn}>
                  <Text style={[styles.prevBtnText, { color: colors.mutedForeground }]}>Anterior</Text>
                </Pressable>
                <Pressable
                  onPress={() => setStep(5)}
                  style={[styles.sheetNext, { flex: 1, backgroundColor: "#DFC76A" }]}
                >
                  <Text style={[styles.sheetNextText, { color: "#070E09" }]}>Siguiente</Text>
                </Pressable>
              </View>
              <View style={{ height: bottomPad + 8 }} />
            </>
          )}

          {/* ── Step 5: Share / Done ── */}
          {step === 5 && (
            <>
              <View style={styles.successIcon}>
                <LinearGradient colors={["#090D20", "#080A18", "#06070F"]} style={styles.successGrad}>
                  <Feather name="check" size={28} color="#070E09" />
                </LinearGradient>
              </View>
              <Text style={[styles.sheetTitle, { color: colors.foreground, textAlign: "center", marginBottom: 8 }]}>
                ¡Tu grupo está listo!
              </Text>
              <Text style={[styles.sheetSub, { color: colors.mutedForeground, textAlign: "center", marginBottom: 20 }]}>
                Compartí el enlace para invitar personas a "{nombre}".
              </Text>

              {/* Invite link box */}
              <View style={[styles.linkBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <Feather name="link" size={14} color={colors.primary} style={{ marginRight: 8 }} />
                <Text style={[styles.linkText, { color: colors.primary }]} numberOfLines={1}>
                  {inviteCode}
                </Text>
              </View>

              {/* Share button */}
              <Pressable onPress={handleShare} style={[styles.sheetNext, { backgroundColor: colors.primary, marginTop: 16 }]}>
                <Feather name="share-2" size={17} color="#070E09" />
                <Text style={[styles.sheetNextText, { color: "#070E09" }]}>Compartir enlace</Text>
              </Pressable>

              {/* Done */}
              <Pressable
                onPress={() => router.back()}
                style={{ marginTop: 12, alignItems: "center", paddingVertical: 12 }}
              >
                <Text style={[styles.skipText, { color: colors.mutedForeground }]}>
                  Ir a Mis Grupos
                </Text>
              </Pressable>
              <View style={{ height: bottomPad + 8 }} />
            </>
          )}
        </BottomSheet>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },

  // Step 1
  closeBtn: { marginBottom: 36, alignSelf: "flex-start" },
  closeBtnInner: { width: 34, height: 34, borderRadius: 17, backgroundColor: "rgba(237,225,211,0.12)", alignItems: "center", justifyContent: "center" },
  stepTitle: { color: "#FFFFFF", fontSize: 24, fontWeight: "700", marginBottom: 24 },
  nameInputBox: {
    flexDirection: "row", alignItems: "center",
    borderRadius: 14, borderWidth: 1,
    paddingHorizontal: 16, paddingVertical: 14,
  },
  nameInput: { flex: 1, fontSize: 16 },
  nameCounter: { fontSize: 13, fontWeight: "600", marginLeft: 8 },
  stepFooter: { paddingHorizontal: 20 },
  nextBtn: { borderRadius: 16, paddingVertical: 16, alignItems: "center" },
  nextBtnText: { fontSize: 16, fontWeight: "700" },

  // Shared sheet styles
  sheetTopRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 },
  sheetTitle: { fontSize: 20, fontWeight: "700" },
  sheetSub: { fontSize: 14, lineHeight: 21, marginBottom: 16 },
  skipText: { fontSize: 14, fontWeight: "600" },
  sheetTextarea: {
    borderWidth: 1, borderRadius: 14,
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 14, minHeight: 100, textAlignVertical: "top",
  },
  sheetNavRow: { flexDirection: "row", gap: 12, marginTop: 14, alignItems: "center" },
  prevBtn: { paddingVertical: 16, paddingHorizontal: 4 },
  prevBtnText: { fontSize: 15, fontWeight: "600" },
  sheetNext: { borderRadius: 16, paddingVertical: 16, alignItems: "center", flexDirection: "row", justifyContent: "center", gap: 8 },
  sheetNextText: { fontSize: 16, fontWeight: "700" },

  // Gallery
  galleryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 6 },
  galleryItem: { borderRadius: 10, overflow: "hidden", position: "relative" },
  galleryItemSelected: { borderWidth: 2.5, borderColor: "#BE9650", borderRadius: 10 },
  galleryImg: { width: 68, height: 68 },
  galleryCheck: { position: "absolute", bottom: 4, right: 4, backgroundColor: "#BE9650", borderRadius: 10, width: 20, height: 20, alignItems: "center", justifyContent: "center" },

  // Success
  successIcon: { alignSelf: "center", marginBottom: 16, borderRadius: 30, overflow: "hidden" },
  successGrad: { width: 60, height: 60, alignItems: "center", justifyContent: "center" },
  linkBox: { flexDirection: "row", alignItems: "center", borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 12 },
  linkText: { fontSize: 13, fontWeight: "600", flex: 1 },
});
