import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import React, { useCallback, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useColors } from "@/hooks/useColors";

type Step = "choose" | "email-form" | "verify-email" | "name" | "birthyear";

const CURRENT_YEAR = new Date().getFullYear();
const MIN_AGE = 13;
const YEARS = Array.from({ length: CURRENT_YEAR - MIN_AGE - 1940 + 1 }, (_, i) => 1940 + i).reverse();
const ITEM_H = 56;
const VISIBLE = 5;
const PICKER_H = ITEM_H * VISIBLE;

export default function RegistroScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { register } = useAuth();

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [step, setStep] = useState<Step>("choose");
  const [method, setMethod] = useState<"email" | "apple" | "google">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [passValid, setPassValid] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [birthYear, setBirthYear] = useState(CURRENT_YEAR - 25);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resent, setResent] = useState(false);

  const fadeAnim = useRef(new Animated.Value(1)).current;

  const goTo = useCallback(
    (next: Step) => {
      Animated.sequence([
        Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
        Animated.timing(fadeAnim, { toValue: 1, duration: 180, useNativeDriver: true }),
      ]).start();
      setTimeout(() => setStep(next), 120);
    },
    [fadeAnim]
  );

  const handleSocialAuth = (m: "apple" | "google") => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMethod(m);
    goTo("name");
  };

  const handleEmailContinue = () => {
    if (!email || !passValid) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMethod("email");
    goTo("verify-email");
  };

  const handleResend = () => {
    setResent(true);
    setTimeout(() => setResent(false), 4000);
  };

  const handleNameContinue = () => {
    if (!displayName.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    goTo("birthyear");
  };

  const handleCreateAccount = async () => {
    if (!agreed) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    await register({
      email: method === "email" ? email : null,
      displayName: displayName.trim(),
      birthYear,
      method,
    });
    setLoading(false);
    router.replace("/(tabs)" as never);
  };

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <StatusBar barStyle="light-content" />
      <Animated.View style={[{ flex: 1 }, { opacity: fadeAnim }]}>
        {step === "choose" && (
          <ChooseStep
            topPad={topPad}
            bottomPad={bottomPad}
            colors={colors}
            onApple={() => handleSocialAuth("apple")}
            onGoogle={() => handleSocialAuth("google")}
            onEmail={() => { setMethod("email"); goTo("email-form"); }}
            onBack={() => router.back()}
          />
        )}
        {step === "email-form" && (
          <EmailFormStep
            topPad={topPad}
            bottomPad={bottomPad}
            colors={colors}
            email={email}
            setEmail={setEmail}
            password={password}
            setPassword={(v: string) => {
              setPassword(v);
              setPassValid(v.length >= 8 && /[a-zA-Z]/.test(v) && /[0-9]/.test(v));
            }}
            showPass={showPass}
            setShowPass={setShowPass}
            passValid={passValid}
            onBack={() => goTo("choose")}
            onContinue={handleEmailContinue}
          />
        )}
        {step === "verify-email" && (
          <VerifyEmailStep
            topPad={topPad}
            bottomPad={bottomPad}
            colors={colors}
            email={email}
            resent={resent}
            onResend={handleResend}
            onEdit={() => goTo("email-form")}
            onSkip={() => goTo("name")}
          />
        )}
        {step === "name" && (
          <NameStep
            topPad={topPad}
            bottomPad={bottomPad}
            colors={colors}
            displayName={displayName}
            setDisplayName={setDisplayName}
            onContinue={handleNameContinue}
          />
        )}
        {step === "birthyear" && (
          <BirthYearStep
            topPad={topPad}
            bottomPad={bottomPad}
            colors={colors}
            birthYear={birthYear}
            setBirthYear={setBirthYear}
            agreed={agreed}
            setAgreed={setAgreed}
            loading={loading}
            onCreateAccount={handleCreateAccount}
          />
        )}
      </Animated.View>
    </View>
  );
}

// ── Step: Choose method ──────────────────────────────────────────────────────

function ChooseStep({ topPad, bottomPad, colors, onApple, onGoogle, onEmail, onBack }: any) {
  return (
    <View style={[styles.stepRoot, { paddingTop: topPad + 16, paddingBottom: bottomPad + 32 }]}>
      <View style={styles.stepHeader}>
        <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </Pressable>
      </View>

      <View style={styles.stepContent}>
        <Text style={[styles.stepTitle, { color: colors.foreground }]}>Regístrate</Text>

        <View style={styles.socialStack}>
          {/* Apple */}
          <Pressable
            onPress={onApple}
            style={({ pressed }) => [
              styles.socialBtn,
              { backgroundColor: colors.foreground, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Feather name="smartphone" size={18} color={colors.background} />
            <Text style={[styles.socialBtnText, { color: colors.background }]}>
              Regístrate con Apple
            </Text>
          </Pressable>

          {/* Google */}
          <Pressable
            onPress={onGoogle}
            style={({ pressed }) => [
              styles.socialBtn,
              {
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Text style={[styles.googleG]}>
              <Text style={{ color: "#4285F4" }}>G</Text>
              <Text style={{ color: "#EA4335" }}>o</Text>
              <Text style={{ color: "#FBBC05" }}>o</Text>
              <Text style={{ color: "#34A853" }}>g</Text>
              <Text style={{ color: "#EA4335" }}>l</Text>
              <Text style={{ color: "#4285F4" }}>e</Text>
            </Text>
            <Text style={[styles.socialBtnText, { color: colors.foreground }]}>
              Regístrate con Google
            </Text>
          </Pressable>

          {/* Email */}
          <Pressable
            onPress={onEmail}
            style={({ pressed }) => [
              styles.socialBtn,
              {
                backgroundColor: "transparent",
                borderWidth: 1,
                borderColor: colors.border,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Feather name="mail" size={18} color={colors.mutedForeground} />
            <Text style={[styles.socialBtnText, { color: colors.foreground }]}>
              Regístrate con tu email
            </Text>
          </Pressable>
        </View>

        <Pressable onPress={() => {}} style={styles.loginRow}>
          <Text style={[styles.loginHint, { color: colors.mutedForeground }]}>
            ¿Ya tienes una cuenta?{" "}
          </Text>
          <Text style={[styles.loginLink, { color: colors.primary }]}>Iniciar sesión</Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── Step: Email form ─────────────────────────────────────────────────────────

function EmailFormStep({
  topPad, bottomPad, colors,
  email, setEmail, password, setPassword,
  showPass, setShowPass, passValid,
  onBack, onContinue,
}: any) {
  const canContinue = email.includes("@") && passValid;
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView
        contentContainerStyle={[styles.stepRoot, { paddingTop: topPad + 16, paddingBottom: bottomPad + 40 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.stepHeader}>
          <Pressable onPress={onBack} hitSlop={12} style={styles.backBtn}>
            <Feather name="arrow-left" size={22} color={colors.foreground} />
          </Pressable>
        </View>

        <View style={styles.stepContent}>
          <Text style={[styles.stepTitle, { color: colors.foreground }]}>
            Regístrate con el email
          </Text>

          <View style={styles.emailForm}>
            {/* Email */}
            <View style={[styles.inputBox, { borderColor: email ? colors.primary : colors.border }]}>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="Dirección de correo electrónico"
                placeholderTextColor={colors.mutedForeground}
                keyboardType="email-address"
                autoCapitalize="none"
                style={[styles.inputText, { color: colors.foreground }]}
              />
            </View>

            {/* Password */}
            <View style={[styles.inputBox, { borderColor: colors.border }]}>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Contraseña"
                placeholderTextColor={colors.mutedForeground}
                secureTextEntry={!showPass}
                style={[styles.inputText, { color: colors.foreground, flex: 1 }]}
              />
              <Pressable onPress={() => setShowPass((v: boolean) => !v)} hitSlop={8}>
                <Feather name={showPass ? "eye-off" : "eye"} size={16} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <View style={styles.passHintRow}>
              <View
                style={[
                  styles.passHintDot,
                  { borderColor: passValid ? colors.primary : colors.mutedForeground },
                  passValid && { backgroundColor: colors.primary },
                ]}
              />
              <Text style={[styles.passHintText, { color: passValid ? colors.primary : colors.mutedForeground }]}>
                Utiliza al menos 8 caracteres que incluyan letras y números
              </Text>
            </View>
          </View>

          <Pressable
            onPress={onContinue}
            disabled={!canContinue}
            style={({ pressed }) => [
              styles.continueBtn,
              {
                backgroundColor: canContinue ? colors.primary : "rgba(198,155,79,0.18)",
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={[styles.continueBtnText, { color: canContinue ? colors.primaryForeground : colors.mutedForeground }]}>
              Continuar
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Step: Verify email ───────────────────────────────────────────────────────

function VerifyEmailStep({ topPad, bottomPad, colors, email, resent, onResend, onEdit, onSkip }: any) {
  return (
    <View style={[styles.stepRoot, { paddingTop: topPad + 16, paddingBottom: bottomPad + 32 }]}>
      <View style={styles.verifyContent}>
        <Text style={[styles.verifyTitle, { color: colors.foreground }]}>
          Verifica tu correo electrónico
        </Text>
        <Text style={[styles.verifySub, { color: colors.mutedForeground }]}>
          Por favor haz clic en el enlace que te enviamos a:
        </Text>

        <View style={[styles.emailRow, { backgroundColor: "rgba(198,155,79,0.06)", borderColor: colors.border }]}>
          <Text style={[styles.emailDisplay, { color: colors.foreground }]} numberOfLines={1}>
            {email}
          </Text>
          <Pressable onPress={onEdit} hitSlop={8}>
            <Text style={[styles.editLink, { color: colors.primary }]}>Editar</Text>
          </Pressable>
        </View>
      </View>

      <View style={[styles.verifyBottom, { paddingBottom: bottomPad + 24 }]}>
        <Pressable onPress={onResend} hitSlop={8}>
          <Text style={[styles.resendText, { color: resent ? colors.mutedForeground : colors.primary }]}>
            {resent ? "Email reenviado ✓" : "Reenviar el email"}
          </Text>
        </Pressable>
        <Pressable onPress={onSkip} style={styles.skipLink} hitSlop={8}>
          <Text style={[styles.skipText, { color: "rgba(198,155,79,0.35)" }]}>
            Continuar de todas formas
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── Step: Name ───────────────────────────────────────────────────────────────

function NameStep({ topPad, bottomPad, colors, displayName, setDisplayName, onContinue }: any) {
  const canContinue = displayName.trim().length > 0;
  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.stepRoot, { paddingTop: topPad + 40, paddingBottom: bottomPad + 40 }]}>
        <View style={styles.nameContent}>
          <Text style={[styles.stepTitle, { color: colors.foreground }]}>
            ¿Cómo deberíamos{"\n"}llamarte?
          </Text>
          <Text style={[styles.nameSub, { color: colors.mutedForeground }]}>
            Déjanos saber cómo te gustaría que te llamemos para que podamos personalizar tu experiencia.
          </Text>

          <TextInput
            value={displayName}
            onChangeText={setDisplayName}
            placeholder="Tu nombre"
            placeholderTextColor={"rgba(198,155,79,0.25)"}
            autoFocus
            style={[
              styles.nameInput,
              {
                color: colors.primary,
                borderBottomColor: "rgba(198,155,79,0.3)",
              },
            ]}
          />
        </View>

        <View style={{ paddingHorizontal: 24, paddingBottom: bottomPad + 20 }}>
          <Pressable
            onPress={onContinue}
            disabled={!canContinue}
            style={({ pressed }) => [
              styles.continueBtn,
              {
                backgroundColor: canContinue ? "rgba(60,60,60,0.9)" : "rgba(60,60,60,0.4)",
                opacity: pressed ? 0.85 : 1,
              },
            ]}
          >
            <Text style={[styles.continueBtnText, { color: canContinue ? colors.foreground : colors.mutedForeground }]}>
              Continuar
            </Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Step: Birth year + terms ─────────────────────────────────────────────────

function BirthYearStep({ topPad, bottomPad, colors, birthYear, setBirthYear, agreed, setAgreed, loading, onCreateAccount }: any) {
  const scrollRef = useRef<ScrollView>(null);
  const [selIdx, setSelIdx] = useState(() => YEARS.indexOf(birthYear));

  // Scroll to initial position after layout
  const onLayout = useCallback(() => {
    scrollRef.current?.scrollTo({ y: selIdx * ITEM_H, animated: false });
  }, [selIdx]);

  const onScrollEnd = useCallback(
    (e: any) => {
      const y = e.nativeEvent.contentOffset.y;
      const idx = Math.max(0, Math.min(Math.round(y / ITEM_H), YEARS.length - 1));
      setSelIdx(idx);
      setBirthYear(YEARS[idx]);
    },
    [setBirthYear]
  );

  return (
    <View style={[styles.birthRoot, { paddingTop: topPad + 32 }]}>
      <View style={styles.birthHeader}>
        <Text style={[styles.stepTitle, { color: colors.foreground, textAlign: "center" }]}>
          ¿Cuándo naciste?
        </Text>
        <Text style={[styles.birthSub, { color: colors.mutedForeground }]}>
          Necesitamos esta información para asegurarnos de que nuestra comunidad se mantiene segura
        </Text>
      </View>

      {/* Year picker drum roll */}
      <View style={styles.pickerWrap}>
        {/* Selection highlight bar */}
        <View
          pointerEvents="none"
          style={[styles.pickerHighlight, { borderColor: "rgba(198,155,79,0.22)", backgroundColor: "rgba(198,155,79,0.05)" }]}
        />
        <ScrollView
          ref={scrollRef}
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_H}
          decelerationRate="fast"
          onLayout={onLayout}
          onMomentumScrollEnd={onScrollEnd}
          onScrollEndDrag={onScrollEnd}
          contentContainerStyle={{ paddingVertical: ITEM_H * 2 }}
          style={{ height: PICKER_H }}
        >
          {YEARS.map((year, index) => {
            const dist = Math.abs(index - selIdx);
            const opacity = dist === 0 ? 1 : dist === 1 ? 0.45 : dist === 2 ? 0.2 : 0.08;
            const fontSize = dist === 0 ? 34 : dist === 1 ? 24 : 18;
            const fontWeight: "700" | "400" = dist === 0 ? "700" : "400";
            return (
              <View key={year} style={[styles.yearItem, { height: ITEM_H }]}>
                <Text style={{ color: colors.foreground, fontSize, fontWeight, opacity }}>
                  {year}
                </Text>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Terms + button */}
      <View style={[styles.birthBottom, { paddingBottom: bottomPad + 16, paddingHorizontal: 24 }]}>
        <TouchableOpacity
          onPress={() => { setAgreed((v: boolean) => !v); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
          activeOpacity={0.8}
          style={styles.termsRow}
        >
          <View style={[
            styles.checkbox,
            {
              borderColor: agreed ? colors.primary : colors.mutedForeground,
              backgroundColor: agreed ? "rgba(198,155,79,0.15)" : "transparent",
            },
          ]}>
            {agreed && <Feather name="check" size={12} color={colors.primary} />}
          </View>
          <Text style={[styles.termsText, { color: colors.mutedForeground }]}>
            Al marcar esta casilla, estoy de acuerdo con los{" "}
            <Text style={{ color: colors.primary }}>Términos del servicio</Text>
            {" "}y la{" "}
            <Text style={{ color: colors.primary }}>Política de privacidad</Text>
            {" "}de RESONANCIA
          </Text>
        </TouchableOpacity>

        <Pressable
          onPress={onCreateAccount}
          disabled={!agreed || loading}
          style={({ pressed }) => [
            styles.createBtn,
            {
              backgroundColor: agreed ? colors.primary : "rgba(198,155,79,0.18)",
              opacity: pressed ? 0.88 : 1,
            },
          ]}
        >
          <Text style={[styles.createBtnText, { color: agreed ? colors.primaryForeground : colors.mutedForeground }]}>
            {loading ? "Creando cuenta..." : "Crear cuenta"}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  stepRoot: { flex: 1, paddingHorizontal: 24 },
  stepHeader: { marginBottom: 20 },
  backBtn: { width: 40, height: 40, justifyContent: "center" },
  stepContent: { flex: 1 },

  stepTitle: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 32,
    lineHeight: 36,
  },

  // Choose
  socialStack: { gap: 12 },
  socialBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    borderRadius: 14,
    gap: 10,
  },
  socialBtnText: { fontSize: 15, fontWeight: "600" },
  googleG: { fontSize: 17, fontWeight: "700", letterSpacing: -0.5 },
  loginRow: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: 28,
  },
  loginHint: { fontSize: 14 },
  loginLink: { fontSize: 14, fontWeight: "700" },

  // Email form
  emailForm: { gap: 14, marginBottom: 28 },
  inputBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  inputText: { flex: 1, fontSize: 15 },
  passHintRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  passHintDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    marginTop: 2,
    flexShrink: 0,
  },
  passHintText: { fontSize: 12, lineHeight: 18, flex: 1 },

  // Shared continue button
  continueBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
  },
  continueBtnText: { fontSize: 16, fontWeight: "700" },

  // Verify email
  verifyContent: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  verifyTitle: {
    fontSize: 30,
    fontWeight: "700",
    lineHeight: 38,
    marginBottom: 16,
  },
  verifySub: { fontSize: 15, lineHeight: 22, marginBottom: 24 },
  emailRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  emailDisplay: { fontSize: 15, flex: 1, marginRight: 12 },
  editLink: { fontSize: 14, fontWeight: "600" },
  verifyBottom: {
    alignItems: "center",
    paddingHorizontal: 24,
    gap: 14,
  },
  resendText: { fontSize: 15, fontWeight: "600" },
  skipLink: { marginTop: 4 },
  skipText: { fontSize: 12 },

  // Name
  nameContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  nameSub: { fontSize: 15, lineHeight: 22, marginBottom: 40 },
  nameInput: {
    fontSize: 28,
    fontWeight: "400",
    borderBottomWidth: 1.5,
    paddingBottom: 8,
  },

  // Birthyear
  birthRoot: { flex: 1 },
  birthHeader: { paddingHorizontal: 24, marginBottom: 24 },
  birthSub: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginTop: 12,
  },
  pickerWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  pickerHighlight: {
    position: "absolute",
    top: PICKER_H / 2 - ITEM_H / 2,
    left: 60,
    right: 60,
    height: ITEM_H,
    borderRadius: 10,
    borderWidth: 1,
    zIndex: 1,
    pointerEvents: "none",
  },
  yearItem: {
    alignItems: "center",
    justifyContent: "center",
    width: 240,
  },
  birthBottom: { gap: 16 },
  termsRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
    flexShrink: 0,
  },
  termsText: { fontSize: 12, lineHeight: 18, flex: 1 },
  createBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  createBtnText: { fontSize: 16, fontWeight: "700" },
});
