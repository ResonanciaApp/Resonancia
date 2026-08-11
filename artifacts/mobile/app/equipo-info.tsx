import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import MaskedView from "@react-native-masked-view/masked-view";
import { GoldGradient } from "@/components/GoldGradient";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useSceneTheme } from "@/context/SceneThemeContext";

// ── Paleta ────────────────────────────────────────────────────────────────────
const GOLD = "#F9F9F9";
const GOLD2 = "#F9F9F9";
const TEXT = "#FAF0EE";
const MUTED = "rgba(250,240,238,0.55)";
const BG: [string, string] = ["#340D1A", "#190913"];
const H_PAD = 18;

const RESONADOR_IMG = require("@/assets/images/banner-resonador.png");
const EXPANSOR_IMG  = require("@/assets/images/banner-expansor.png");

type RoleData = {
  banner: ReturnType<typeof require>;
  titulo: string;
  bajada: string;
  beneficios: { icon: keyof typeof Feather.glyphMap; texto: string }[];
  cta: string;
  emailSubject: string;
  route?: string;
};

const ROLES: RoleData[] = [
  {
    banner: RESONADOR_IMG,
    titulo: "Resonador",
    bajada: "Comparte tu arte sonoro con toda la comunidad.",
    beneficios: [
      { icon: "upload-cloud", texto: "Sube contenido a Resonancia" },
      { icon: "star", texto: "Perfil premium destacado y personalizable" },
      { icon: "dollar-sign", texto: "Recibe pagos por su servicio" },
      { icon: "heart", texto: "Se habilita un botón de donaciones" },
    ],
    cta: "¿Te gustaría ser Resonador?",
    emailSubject: "Quiero ser Resonador",
    route: "/resonador-postular",
  },
  {
    banner: EXPANSOR_IMG,
    titulo: "Expansor",
    bajada: "Expande tu propósito y conecta con la comunidad.",
    beneficios: [
      { icon: "trending-up", texto: "Promociona sus servicios en Resonancia" },
      { icon: "star", texto: "Perfil destacado y personalizable" },
      { icon: "calendar", texto: "Crea eventos públicos a la comunidad" },
    ],
    cta: "¿Te gustaría ser Expansor?",
    emailSubject: "Quiero ser Expansor",
    route: "/expansor-postular",
  },
];

// ── Tarjeta de rol ──────────────────────────────────────────────────────────
function RoleCard({ role, delay }: { role: RoleData; delay: number }) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(24)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 600,
        delay,
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, delay]);

  return (
    <Animated.View style={[styles.card, { opacity, transform: [{ translateY }] }]}>
      {/* Banner */}
      <View style={styles.bannerWrap}>
        <Image source={role.banner} style={StyleSheet.absoluteFill} contentFit="cover" />
        <LinearGradient
          colors={["transparent", "rgba(22,1,8,0.35)", "#16040A"]}
          locations={[0, 0.55, 1]}
          style={StyleSheet.absoluteFill}
        />
        <View pointerEvents="none" style={styles.bannerBorder} />
        <View style={styles.bannerTitleWrap}>
          <MaskedView maskElement={<Text style={styles.bannerTitle}>{role.titulo}</Text>}>
            <GoldGradient>
              <Text style={[styles.bannerTitle, { opacity: 0 }]}>{role.titulo}</Text>
            </GoldGradient>
          </MaskedView>
          <Text style={styles.bannerBajada}>{role.bajada}</Text>
        </View>
      </View>

      {/* Beneficios */}
      <View style={styles.benefits}>
        {role.beneficios.map((b, i) => (
          <View key={i} style={styles.benefitRow}>
            <View style={styles.benefitIcon}>
              <Feather name={b.icon} size={15} color={GOLD} />
            </View>
            <Text style={styles.benefitText}>{b.texto}</Text>
          </View>
        ))}
      </View>

      {/* CTA */}
      <Pressable
        onPress={() =>
          role.route
            ? router.push(role.route as never)
            : Linking.openURL(
                `mailto:hola@resonancia.app?subject=${encodeURIComponent(role.emailSubject)}`,
              )
        }
        style={({ pressed }) => [styles.ctaBtn, { opacity: pressed ? 0.85 : 1 }]}
      >
        <LinearGradient
          colors={["#F9F9F9", "#F9F9F9"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
        <Text style={styles.ctaBtnText}>Quiero ser {role.titulo}</Text>
        <Feather name="arrow-right" size={17} color="#1B060F" />
      </Pressable>
    </Animated.View>
  );
}

// ── Pantalla ──────────────────────────────────────────────────────────────────
export default function EquipoInfoScreen() {
  const insets = useSafeAreaInsets();
  const { theme: sceneTheme } = useSceneTheme();

  return (
    <View style={[styles.root, { backgroundColor: sceneTheme.gradient[0] as string }]}>
      <LinearGradient colors={sceneTheme.gradient as unknown as [string, string, ...string[]]} style={StyleSheet.absoluteFill} />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <Pressable onPress={() => router.back()} style={styles.backBtn} hitSlop={8}>
          <Feather name="arrow-left" size={22} color={TEXT} />
        </Pressable>
        <View pointerEvents="none" style={[styles.headerTitleAbs, { top: insets.top + 10 }]}>
          <Text style={styles.headerTitle}>Únete a Resonancia</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 40, paddingTop: 6 }}
      >
        <Text style={styles.intro}>
          Hay dos formas de formar parte activa de la comunidad. Elige el camino que
          resuena contigo.
        </Text>
        {ROLES.map((role, i) => (
          <RoleCard key={role.titulo} role={role} delay={120 + i * 140} />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#210911" },
  header: {
    paddingHorizontal: H_PAD,
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
  headerTitle: { fontFamily: "Manrope", fontSize: 17, fontWeight: "700", color: TEXT },
  intro: {
    fontFamily: "Manrope",
    fontSize: 14,
    lineHeight: 21,
    color: MUTED,
    paddingHorizontal: H_PAD + 4,
    marginTop: 4,
    marginBottom: 18,
    textAlign: "center",
  },
  card: {
    marginHorizontal: H_PAD,
    marginBottom: 22,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.045)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    overflow: "hidden",
  },
  bannerWrap: {
    width: "100%",
    aspectRatio: 16 / 9,
    justifyContent: "flex-end",
  },
  bannerBorder: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: "rgba(212,175,55,0.45)",
  },
  bannerTitleWrap: {
    paddingHorizontal: 18,
    paddingBottom: 16,
  },
  bannerTitle: {
    fontFamily: "Manrope",
    fontSize: 30,
    fontWeight: "800",
    color: GOLD,
    letterSpacing: 0.5,
  },
  bannerBajada: {
    fontFamily: "Manrope",
    fontSize: 13.5,
    color: "rgba(250,240,238,0.85)",
    marginTop: 4,
  },
  benefits: {
    paddingHorizontal: 18,
    paddingTop: 18,
    paddingBottom: 6,
    gap: 13,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  benefitIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(212,175,55,0.12)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: {
    fontFamily: "Manrope",
    flex: 1,
    fontSize: 14.5,
    color: TEXT,
    lineHeight: 20,
  },
  ctaBtn: {
    marginHorizontal: 18,
    marginTop: 18,
    marginBottom: 18,
    height: 50,
    borderRadius: 25,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    overflow: "hidden",
  },
  ctaBtnText: {
    fontFamily: "Manrope",
    fontSize: 15.5,
    fontWeight: "700",
    color: "#1B060F",
  },
});
