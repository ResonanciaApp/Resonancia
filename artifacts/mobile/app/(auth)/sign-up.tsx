import { useSignUp } from "@clerk/expo";
import { LinearGradient } from "expo-linear-gradient";
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
  bg: "#090F17",
  card: "#151A23",
  primary: "#BE9650",
  accent: "#BE9650",
  fg: "#EDE1D3",
  muted: "rgba(200, 193, 181, 0.55)",
  border: "rgba(182, 149, 95, 0.25)",
  error: "#D87856",
};

export default function SignUpScreen() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const [emailAddress, setEmailAddress] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);

  const loading = fetchStatus === "fetching";

  const handleSubmit = async () => {
    setSubmitError(null);
    try {
      const { error } = await signUp.password({ emailAddress, password });
      if (error) {
        setSubmitError(error.message || "No pudimos crear la cuenta.");
        return;
      }
      await signUp.verifications.sendEmailCode();
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Error inesperado.");
    }
  };

  const handleVerify = async () => {
    setSubmitError(null);
    try {
      await signUp.verifications.verifyEmailCode({ code });
      if (signUp.status === "complete") {
        await signUp.finalize({
          navigate: () => {
            // After sign-up, AuthGate sends new users to /onboarding
            router.replace("/onboarding");
          },
        });
      } else {
        setSubmitError("El código no es válido o ya expiró.");
      }
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Error inesperado.");
    }
  };

  const inVerifyStep =
    signUp.status === "missing_requirements" &&
    signUp.unverifiedFields?.includes("email_address") &&
    (signUp.missingFields?.length ?? 0) === 0;

  return (
    <LinearGradient colors={[COLORS.bg, "#080F0A"]} style={styles.container}>
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
            <Text style={styles.title}>
              {inVerifyStep ? "Verifica tu correo" : "Crea tu cuenta"}
            </Text>
            <Text style={styles.subtitle}>
              {inVerifyStep
                ? `Te enviamos un código a ${emailAddress}`
                : "Empezá tu camino interior"}
            </Text>
          </View>

          {!inVerifyStep ? (
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
              {errors?.fields?.emailAddress && (
                <Text style={styles.errorText}>
                  {errors.fields.emailAddress.message}
                </Text>
              )}

              <Text style={[styles.label, { marginTop: 16 }]}>Contraseña</Text>
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Mínimo 8 caracteres"
                placeholderTextColor={COLORS.muted}
                secureTextEntry
                autoComplete="new-password"
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
                {loading ? (
                  <ActivityIndicator color={COLORS.bg} />
                ) : (
                  <Text style={styles.primaryBtnText}>Continuar</Text>
                )}
              </Pressable>

              {/* Required: Clerk bot protection */}
              <View nativeID="clerk-captcha" />

              <SocialAuthButtons />

              <View style={styles.footer}>
                <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
                <Link href="/(auth)/sign-in" replace>
                  <Text style={styles.footerLink}>Inicia sesión</Text>
                </Link>
              </View>
            </View>
          ) : (
            <View style={styles.form}>
              <Text style={styles.label}>Código de verificación</Text>
              <TextInput
                style={[styles.input, styles.codeInput]}
                value={code}
                onChangeText={setCode}
                placeholder="000000"
                placeholderTextColor={COLORS.muted}
                keyboardType="number-pad"
                autoComplete="one-time-code"
                maxLength={6}
              />
              {errors?.fields?.code && (
                <Text style={styles.errorText}>{errors.fields.code.message}</Text>
              )}
              {submitError && (
                <Text style={[styles.errorText, { marginTop: 12 }]}>
                  {submitError}
                </Text>
              )}

              <Pressable
                style={({ pressed }) => [
                  styles.primaryBtn,
                  (loading || code.length < 6) && styles.btnDisabled,
                  pressed && styles.btnPressed,
                ]}
                onPress={handleVerify}
                disabled={loading || code.length < 6}
              >
                {loading ? (
                  <ActivityIndicator color={COLORS.bg} />
                ) : (
                  <Text style={styles.primaryBtnText}>Verificar</Text>
                )}
              </Pressable>

              <Pressable
                style={({ pressed }) => [
                  styles.secondaryBtn,
                  pressed && styles.btnPressed,
                ]}
                onPress={() => signUp.verifications.sendEmailCode()}
              >
                <Text style={styles.secondaryBtnText}>Reenviar código</Text>
              </Pressable>
            </View>
          )}
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
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 14,
    letterSpacing: 6,
    marginBottom: 24,
  },
  title: {
    color: COLORS.fg,
    fontFamily: "PlayfairDisplay_700Bold",
    fontSize: 28,
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    color: COLORS.muted,
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  form: { width: "100%" },
  label: {
    color: COLORS.fg,
    fontFamily: "Inter_500Medium",
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
    fontFamily: "Inter_400Regular",
    fontSize: 15,
  },
  codeInput: {
    textAlign: "center",
    fontSize: 22,
    letterSpacing: 8,
    fontFamily: "Inter_600SemiBold",
  },
  primaryBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 28,
  },
  primaryBtnText: {
    color: COLORS.bg,
    fontFamily: "Inter_600SemiBold",
    fontSize: 16,
    letterSpacing: 0.5,
  },
  secondaryBtn: {
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  secondaryBtnText: {
    color: COLORS.accent,
    fontFamily: "Inter_500Medium",
    fontSize: 14,
  },
  btnDisabled: { opacity: 0.5 },
  btnPressed: { opacity: 0.8 },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 24,
  },
  footerText: { color: COLORS.muted, fontSize: 14 },
  footerLink: {
    color: COLORS.accent,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  errorText: {
    color: COLORS.error,
    fontSize: 13,
    marginTop: 6,
  },
});
