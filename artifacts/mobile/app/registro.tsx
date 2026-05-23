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

export default function RegistroScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [nombre, setNombre] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: bottomPad + 40, paddingHorizontal: 24 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back */}
          <Pressable onPress={() => router.back()} style={styles.back} hitSlop={12}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>

          {/* Header */}
          <View style={styles.headerBlock}>
            <Text style={[styles.brand, { color: colors.primary }]}>RESONANCIA</Text>
            <Text style={[styles.title, { color: colors.foreground }]}>Crear cuenta</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              Únete a la comunidad de Casa del Cuenco
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Field label="Nombre completo" value={nombre} onChangeText={setNombre}
              icon="user" placeholder="Tu nombre" colors={colors} />
            <Field label="Correo electrónico" value={email} onChangeText={setEmail}
              icon="mail" placeholder="tu@email.com" keyboardType="email-address" colors={colors} />
            <View>
              <FieldLabel label="Contraseña" colors={colors} />
              <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="lock" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Mínimo 8 caracteres"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showPass}
                  style={[styles.textInput, { color: colors.foreground, flex: 1 }]}
                />
                <Pressable onPress={() => setShowPass(v => !v)} hitSlop={8}>
                  <Feather name={showPass ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
                </Pressable>
              </View>
            </View>
            <View>
              <FieldLabel label="Confirmar contraseña" colors={colors} />
              <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Feather name="lock" size={16} color={colors.mutedForeground} style={styles.inputIcon} />
                <TextInput
                  value={confirm}
                  onChangeText={setConfirm}
                  placeholder="Repetí tu contraseña"
                  placeholderTextColor={colors.mutedForeground}
                  secureTextEntry={!showConfirm}
                  style={[styles.textInput, { color: colors.foreground, flex: 1 }]}
                />
                <Pressable onPress={() => setShowConfirm(v => !v)} hitSlop={8}>
                  <Feather name={showConfirm ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
                </Pressable>
              </View>
            </View>
          </View>

          {/* CTA */}
          <Pressable
            style={({ pressed }) => [styles.ctaBtn, { opacity: pressed ? 0.85 : 1 }]}
          >
            <LinearGradient colors={["#D6A85B", "#C69B4F"]} style={styles.ctaGrad}>
              <Text style={styles.ctaText}>Crear mi cuenta</Text>
            </LinearGradient>
          </Pressable>

          {/* Divider */}
          <View style={styles.dividerRow}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerLabel, { color: colors.mutedForeground }]}>o continuá con</Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          {/* Google */}
          <Pressable style={({ pressed }) => [styles.socialBtn, { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.8 : 1 }]}>
            <Feather name="globe" size={18} color={colors.foreground} />
            <Text style={[styles.socialText, { color: colors.foreground }]}>Continuar con Google</Text>
          </Pressable>

          {/* Login link */}
          <View style={styles.loginRow}>
            <Text style={[styles.loginHint, { color: colors.mutedForeground }]}>¿Ya tenés cuenta?</Text>
            <Pressable>
              <Text style={[styles.loginLink, { color: colors.primary }]}> Iniciar sesión</Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

function FieldLabel({ label, colors }: { label: string; colors: any }) {
  return <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>;
}

function Field({ label, value, onChangeText, icon, placeholder, keyboardType, colors }: any) {
  return (
    <View>
      <FieldLabel label={label} colors={colors} />
      <View style={[styles.inputRow, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name={icon} size={16} color={colors.mutedForeground} style={styles.inputIcon} />
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          keyboardType={keyboardType ?? "default"}
          style={[styles.textInput, { color: colors.foreground }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  back: { marginBottom: 20, width: 40, height: 40, justifyContent: "center" },
  headerBlock: { marginBottom: 32, alignItems: "center" },
  brand: { fontSize: 11, fontWeight: "700", letterSpacing: 3, marginBottom: 16 },
  title: { fontSize: 26, fontWeight: "700", marginBottom: 8, letterSpacing: 0.2 },
  subtitle: { fontSize: 14, textAlign: "center", lineHeight: 20 },
  form: { gap: 16, marginBottom: 28 },
  label: { fontSize: 12, fontWeight: "600", letterSpacing: 0.4, marginBottom: 7, textTransform: "uppercase" },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    gap: 10,
  },
  inputIcon: { width: 20 },
  textInput: { flex: 1, fontSize: 15 },
  ctaBtn: { borderRadius: 16, overflow: "hidden", marginBottom: 24 },
  ctaGrad: { paddingVertical: 16, alignItems: "center" },
  ctaText: { color: "#1A0E06", fontWeight: "700", fontSize: 16, letterSpacing: 0.3 },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1 },
  dividerLabel: { fontSize: 12 },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 14,
    marginBottom: 28,
  },
  socialText: { fontSize: 15, fontWeight: "600" },
  loginRow: { flexDirection: "row", justifyContent: "center" },
  loginHint: { fontSize: 14 },
  loginLink: { fontSize: 14, fontWeight: "700" },
});
