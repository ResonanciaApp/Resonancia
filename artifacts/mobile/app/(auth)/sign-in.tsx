import { useSignIn } from "@clerk/expo";
import { LinearGradient } from "expo-linear-gradient";
import { GoldGradientFill } from "@/components/GoldGradient";
import { Link, router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { SocialAuthButtons } from "@/components/SocialAuthButtons";

const COLORS = {
  bg: "#4A0C0C",
  card: "rgba(74,12,12,0.08)",
  primary: "#dad4ec",
  accent: "#dad4ec",
  fg: "#FFFFFF",
  muted: "rgba(200, 193, 181, 0.55)",
  border: "rgba(182, 149, 95, 0.25)",
  error: "#D87856",
};

export default function SignInScreen() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loading = fetchStatus === "fetching";

  const handleSubmit = async () => {
    setSubmitError(null);
    try {
      const { error } = await signIn.password({ emailAddress, password });
      if (error) {
        setSubmitError(error.message || "No pudimos iniciar sesión.");
        return;
      }
      if (signIn.status === "complete") {
        await signIn.finalize({
          navigate: () => {
            router.replace("/(tabs)");
          },
        });
      } else {
        setSubmitError("No se pudo completar el inicio de sesión.");
      }
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Error inesperado.");
    }
  };

  return (
    <LinearGradient colors={["#340D1A", "#190913"]} style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={styles.brand}>RESONANCIA</Text>
            <Text style={styles.title}>Bienvenido de vuelta</Text>
            <Text style={styles.subtitle}>
              Ingresa a tu cuenta para continuar tu práctica
            </Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>Correo electrónico</Text>
            <TextInput
              style={styles.input}
              value={emailAddress}
              onChangeText={setEmailAddress}
              placeholder="tu@email.com"
              placeholderTextColor={COLORS.muted}
              autoCapitalize="none"
              keyboardType="email-address"
              autoComplete="email"
            />
            {errors?.fields?.identifier && (
              <Text style={styles.errorText}>
                {errors.fields.identifier.message}
              </Text>
            )}

            <Text style={[styles.label, { marginTop: 16 }]}>Contraseña</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Tu contraseña"
              placeholderTextColor={COLORS.muted}
              secureTextEntry
              autoComplete="password"
            />
            {errors?.fields?.password && (
              <Text style={styles.errorText}>
                {errors.fields.password.message}
              </Text>
            )}

            {submitError && (
              <Text style={[styles.errorText, { marginTop: 12 }]}>
                {submitError}
              </Text>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.primaryBtn,
                (loading || !emailAddress || !password) && styles.btnDisabled,
                pressed && styles.btnPressed,
              ]}
              onPress={handleSubmit}
              disabled={loading || !emailAddress || !password}
            >
              <GoldGradientFill />
              {loading ? (
                <ActivityIndicator color={COLORS.bg} />
              ) : (
                <Text style={styles.primaryBtnText}>Entrar</Text>
              )}
            </Pressable>

            <SocialAuthButtons />

            <View style={styles.footer}>
              <Text style={styles.footerText}>¿No tienes cuenta? </Text>
              <Link href="/(auth)/sign-up" replace>
                <Text style={styles.footerLink}>Crear una</Text>
              </Link>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, padding: 28, paddingTop: 80, justifyContent: "center" },
  header: { marginBottom: 36, alignItems: "center" },
  brand: {
    color: COLORS.primary,
    fontFamily: "Manrope", fontWeight: "800",
    fontSize: 14,
    letterSpacing: 6,
    marginBottom: 24,
  },
  title: {
    color: COLORS.fg,
    fontFamily: "Manrope", fontWeight: "800",
    fontSize: 28,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontFamily: "Manrope",
    color: COLORS.muted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  form: { width: "100%" },
  label: {
    color: COLORS.fg,
    fontFamily: "Manrope", fontWeight: "500",
    fontSize: 13,
    marginBottom: 8,
    letterSpacing: 0.3,
  },
  input: {
    backgroundColor: COLORS.card,
    borderColor: COLORS.border,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    color: COLORS.fg,
    fontFamily: "Manrope",
    fontSize: 15,
  },
  primaryBtn: {
    overflow: "hidden",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 28,
  },
  primaryBtnText: {
    color: COLORS.bg,
    fontFamily: "Manrope", fontWeight: "600",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  btnDisabled: { opacity: 0.5 },
  btnPressed: { opacity: 0.8 },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: { fontFamily: "Manrope", color: COLORS.muted, fontSize: 14 },
  footerLink: {
    color: COLORS.accent,
    fontSize: 14,
    fontFamily: "Manrope", fontWeight: "600",
  },
  errorText: {
    fontFamily: "Manrope",
    color: COLORS.error,
    fontSize: 13,
    marginTop: 6,
  },
});
