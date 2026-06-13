import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { PurchasesPackage } from "react-native-purchases";

import { SacredBackground } from "@/components/SacredBackground";
import { useSubscription } from "@/lib/revenuecat";

const P = {
  bg0:        "#1B060F",
  bg1:        "#27070E",
  bg2:        "#4A0C0C",
  glow:       "#3D0E16",
  cardBg:     "#27070E",
  cardSelBg:  "#4A0C0C",
  gold:       "#D4AF37",
  goldSoft:   "#D4AF37",
  goldHi:     "#E9C46A",
  textMain:   "#F4DAD5",
  textMuted:  "#FFFFFF",
  border:     "rgba(212,175,55,0.35)",
  borderSel:  "#D4AF37",
  saveBg:     "#3D0E16",
  saveText:   "#E9C46A",
};

const BENEFITS = [
  { icon: "headphones", text: "Acceso ilimitado a todas las sesiones" },
  { icon: "moon", text: "Sección Descanso completa con historias y binaurales" },
  { icon: "mic", text: "Voz Interior — grabaciones ilimitadas" },
  { icon: "heart", text: "Favoritos y diario ilimitados" },
  { icon: "clock", text: "Temporizador de sueño hasta 8 horas" },
  { icon: "download", text: "Descarga para escuchar sin conexión" },
  { icon: "star", text: "Contenido exclusivo para miembros" },
];

/** Calcula el ahorro % del plan anual frente a 12 meses del mensual. */
function computeSavings(
  annual?: PurchasesPackage | null,
  monthly?: PurchasesPackage | null,
): number | null {
  if (!annual || !monthly) return null;
  const a = annual.product.price;
  const m = monthly.product.price;
  if (!a || !m) return null;
  const pct = Math.round((1 - a / (m * 12)) * 100);
  return pct > 0 ? pct : null;
}

const BG_GRADIENT = ["#4A0C0C", "#27070E", "#1B060F"] as const;

export default function MembresiaScreen() {
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [selected, setSelected] = useState<"anual" | "mensual">("anual");
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const {
    offerings,
    isSubscribed,
    isLoading,
    purchase,
    restore,
    isPurchasing,
    isRestoring,
  } = useSubscription();

  const current = offerings?.current;
  const annualPkg = current?.annual ?? null;
  const monthlyPkg = current?.monthly ?? null;
  const selectedPkg = selected === "anual" ? annualPkg : monthlyPkg;

  const annualPrice = annualPkg?.product.priceString;
  const monthlyPrice = monthlyPkg?.product.priceString;
  const savings = computeSavings(annualPkg, monthlyPkg);

  const handleStartPurchase = () => {
    setFeedback(null);
    if (!selectedPkg) {
      setFeedback(
        "Los planes todavía no están disponibles. Inténtalo de nuevo en unos momentos.",
      );
      return;
    }
    setConfirmVisible(true);
  };

  const confirmPurchase = async () => {
    setConfirmVisible(false);
    if (!selectedPkg) return;
    try {
      await purchase(selectedPkg);
      setFeedback(null);
    } catch (err: unknown) {
      const e = err as { userCancelled?: boolean; message?: string };
      if (e?.userCancelled) return;
      setFeedback(e?.message ?? "No se pudo completar la compra. Inténtalo de nuevo.");
    }
  };

  const handleRestore = async () => {
    setFeedback(null);
    try {
      await restore();
      setFeedback("Compras restauradas. Si tenías una suscripción activa, ya está aplicada.");
    } catch {
      setFeedback("No se pudieron restaurar las compras.");
    }
  };

  const ctaPrice =
    selected === "anual" ? annualPrice : monthlyPrice;
  const ctaLabel = isPurchasing
    ? "Procesando…"
    : selected === "anual"
      ? `Comenzar con plan anual${ctaPrice ? ` · ${ctaPrice}` : ""}`
      : `Comenzar con plan mensual${ctaPrice ? ` · ${ctaPrice}` : ""}`;

  return (
        <LinearGradient
      style={styles.root}
      colors={BG_GRADIENT}
      locations={[0, 0.5, 1]}
      start={{ x: 0, y: 0 }}
      end={{ x: 0, y: 1 }}
    >
      <StatusBar barStyle="light-content" />
      <SacredBackground />
      <LinearGradient
        colors={["rgba(214,161,77,0.10)", "rgba(35,66,54,0.08)", "transparent"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
        style={StyleSheet.absoluteFill}
        pointerEvents="none"
      />

      <ScrollView
        contentContainerStyle={{ paddingTop: topPad + 8, paddingBottom: bottomPad + 40 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <Pressable onPress={() => router.back()} style={[styles.back, { marginLeft: 20 }]} hitSlop={12}>
          <Feather name="arrow-left" size={22} color={P.textMain} />
        </Pressable>

        {/* Hero */}
        <View style={styles.hero}>
          <Image
            source={require("../assets/images/estrella-premium.png")}
            style={styles.heroStar}
            contentFit="contain"
          />
          <Text style={[styles.heroTitle, { color: P.textMain }]}>
            Membresía{"\n"}Resonancia
          </Text>
          <LinearGradient
            colors={["transparent", P.goldSoft, "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.divider}
          />
          <Text style={[styles.heroSub, { color: P.textMuted }]}>
            {isSubscribed
              ? "Tu membresía está activa"
              : "Accede a toda la experiencia sonora"}
          </Text>
        </View>

        {isSubscribed ? (
          /* Estado: ya es premium */
          <View style={{ paddingHorizontal: 20 }}>
            <View style={[styles.activeCard, { borderColor: P.border, backgroundColor: P.cardSelBg }]}>
              <View style={styles.activeBadge}>
                <Feather name="check" size={26} color={P.goldHi} />
              </View>
              <Text style={[styles.activeTitle, { color: P.gold }]}>Eres Premium</Text>
              <Text style={[styles.activeSub, { color: P.textMuted }]}>
                Tienes acceso completo a todo el contenido y las funciones de Resonancia.
                Puedes gestionar o cancelar tu suscripción desde la tienda de tu dispositivo.
              </Text>
            </View>
            <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.ctaBtn, { opacity: pressed ? 0.85 : 1 }]}>
              <LinearGradient
                colors={[P.goldHi, P.gold, P.goldSoft]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.ctaGrad}
              >
                <Text style={styles.ctaText}>Volver</Text>
              </LinearGradient>
            </Pressable>
          </View>
        ) : (
          <>
            {/* Plan selector */}
            <View style={[styles.planRow, { paddingHorizontal: 20 }]}>
              {/* Anual */}
              <Pressable
                onPress={() => setSelected("anual")}
                style={({ pressed }) => [
                  styles.planCard,
                  {
                    borderColor: selected === "anual" ? P.borderSel : P.border,
                    backgroundColor: selected === "anual" ? P.cardSelBg : P.cardBg,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                {selected === "anual" && (
                  <LinearGradient
                    colors={[P.goldHi, P.gold]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.bestBadge}
                  >
                    <Text style={styles.bestText}>RECOMENDADO</Text>
                  </LinearGradient>
                )}
                <Text style={[styles.planName, { color: P.textMain }]}>Anual</Text>
                <View style={styles.priceRow}>
                  <Text style={[styles.price, { color: P.gold }]}>{annualPrice ?? "—"}</Text>
                  <Text style={[styles.pricePer, { color: P.textMuted }]}>/año</Text>
                </View>
                <Text style={[styles.planSub, { color: P.goldSoft }]}>Facturación anual</Text>
                {savings != null && (
                  <View style={[styles.saveBadge, { backgroundColor: P.saveBg }]}>
                    <Text style={[styles.saveText, { color: P.saveText }]}>Ahorras {savings}%</Text>
                  </View>
                )}
              </Pressable>

              {/* Mensual */}
              <Pressable
                onPress={() => setSelected("mensual")}
                style={({ pressed }) => [
                  styles.planCard,
                  {
                    borderColor: selected === "mensual" ? P.borderSel : P.border,
                    backgroundColor: selected === "mensual" ? P.cardSelBg : P.cardBg,
                    opacity: pressed ? 0.9 : 1,
                  },
                ]}
              >
                <Text style={[styles.planName, { color: P.textMain }]}>Mensual</Text>
                <View style={styles.priceRow}>
                  <Text style={[styles.price, { color: P.gold }]}>{monthlyPrice ?? "—"}</Text>
                  <Text style={[styles.pricePer, { color: P.textMuted }]}>/mes</Text>
                </View>
                <Text style={[styles.planSub, { color: P.textMuted }]}>Cancela cuando quieras</Text>
              </Pressable>
            </View>

            {/* Benefits */}
            <View style={[styles.benefitsBlock, { paddingHorizontal: 20 }]}>
              <Text style={[styles.benefitsTitle, { color: P.textMain }]}>Todo incluido</Text>
              {BENEFITS.map((b) => (
                <View key={b.text} style={styles.benefitRow}>
                  <View style={[styles.benefitIcon, { backgroundColor: P.cardSelBg, borderColor: P.border }]}>
                    <Feather name={b.icon as any} size={14} color={P.gold} />
                  </View>
                  <Text style={[styles.benefitText, { color: P.textMain }]}>{b.text}</Text>
                </View>
              ))}
            </View>

            {/* CTA */}
            <View style={{ paddingHorizontal: 20 }}>
              {isLoading && !current ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color={P.gold} />
                  <Text style={[styles.legal, { color: P.textMuted, marginTop: 8 }]}>
                    Cargando planes…
                  </Text>
                </View>
              ) : null}

              <Pressable
                disabled={isPurchasing}
                onPress={handleStartPurchase}
                style={({ pressed }) => [styles.ctaBtn, { opacity: pressed || isPurchasing ? 0.85 : 1 }]}
              >
                <LinearGradient
                  colors={[P.goldHi, P.gold, P.goldSoft]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.ctaGrad}
                >
                  <Text style={styles.ctaText}>{ctaLabel}</Text>
                </LinearGradient>
              </Pressable>

              <Pressable onPress={handleRestore} disabled={isRestoring} style={styles.restoreBtn} hitSlop={8}>
                <Text style={[styles.restoreText, { color: P.goldSoft }]}>
                  {isRestoring ? "Restaurando…" : "Restaurar compras"}
                </Text>
              </Pressable>

              {feedback && (
                <Text style={[styles.feedback, { color: P.textMuted }]}>{feedback}</Text>
              )}

              <Text style={[styles.legal, { color: P.textMuted }]}>
                Pago seguro · Se renueva automáticamente · Cancela en cualquier momento
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Modal de confirmación de compra (no usar Alert en modo test) */}
      <Modal visible={confirmVisible} transparent animationType="fade" onRequestClose={() => setConfirmVisible(false)}>
        <Pressable style={styles.modalBackdrop} onPress={() => setConfirmVisible(false)} />
        <View style={styles.modalWrap} pointerEvents="box-none">
          <View style={[styles.modalCard, { backgroundColor: "#10251C", borderColor: P.border }]}>
            <Text style={[styles.modalTitle, { color: P.textMain }]}>Confirmar suscripción</Text>
            <Text style={[styles.modalBody, { color: P.textMuted }]}>
              {selected === "anual"
                ? `Plan anual${annualPrice ? ` · ${annualPrice}/año` : ""}`
                : `Plan mensual${monthlyPrice ? ` · ${monthlyPrice}/mes` : ""}`}
            </Text>
            <View style={styles.modalBtnRow}>
              <Pressable onPress={() => setConfirmVisible(false)} style={({ pressed }) => [styles.modalBtnGhost, { opacity: pressed ? 0.7 : 1 }]}>
                <Text style={[styles.modalBtnGhostText, { color: P.textMuted }]}>Cancelar</Text>
              </Pressable>
              <Pressable onPress={confirmPurchase} style={({ pressed }) => [styles.modalBtnPrimary, { opacity: pressed ? 0.85 : 1 }]}>
                <LinearGradient
                  colors={[P.goldHi, P.gold]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalBtnPrimaryGrad}
                >
                  <Text style={styles.modalBtnPrimaryText}>Confirmar</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  back: { marginBottom: 8, width: 40, height: 40, justifyContent: "center" },
  hero: { paddingHorizontal: 24, paddingVertical: 24, alignItems: "center", marginBottom: 12 },
  heroStar: { width: 44, height: 44, marginBottom: 14 },
  heroTitle: { fontSize: 34, fontWeight: "700", textAlign: "center", lineHeight: 42, marginBottom: 14 },
  divider: { width: 160, height: 1, marginBottom: 14 },
  heroSub: { fontSize: 14, textAlign: "center" },
  planRow: { flexDirection: "row", gap: 12, marginBottom: 32 },
  planCard: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
    gap: 6,
    overflow: "hidden",
  },
  bestBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
  },
  bestText: { color: "#08150F", fontSize: 9, fontWeight: "800", letterSpacing: 1 },
  planName: { fontSize: 18, fontWeight: "700", marginTop: 8 },
  priceRow: { flexDirection: "row", alignItems: "flex-end", gap: 2 },
  price: { fontSize: 30, fontWeight: "700", lineHeight: 34 },
  pricePer: { fontSize: 13, marginBottom: 5 },
  planSub: { fontSize: 11, fontWeight: "500" },
  saveBadge: { borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: "flex-start", marginTop: 4 },
  saveText: { fontSize: 11, fontWeight: "700" },
  benefitsBlock: { marginBottom: 28 },
  benefitsTitle: { fontSize: 16, fontWeight: "700", marginBottom: 16 },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },
  benefitIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitText: { flex: 1, fontSize: 14, lineHeight: 20 },
  loadingRow: { alignItems: "center", marginBottom: 16 },
  ctaBtn: { borderRadius: 50, overflow: "hidden", marginBottom: 14 },
  ctaGrad: { paddingVertical: 16, alignItems: "center" },
  ctaText: { color: "#08150F", fontWeight: "800", fontSize: 16, letterSpacing: 0.3 },
  restoreBtn: { alignItems: "center", paddingVertical: 6, marginBottom: 10 },
  restoreText: { fontSize: 13, fontWeight: "600", textDecorationLine: "underline" },
  feedback: { fontSize: 12.5, textAlign: "center", lineHeight: 18, marginBottom: 12 },
  legal: { fontSize: 11, textAlign: "center", lineHeight: 16 },
  // Estado premium activo
  activeCard: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
  },
  activeBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(214,161,77,0.14)",
    borderWidth: 1.5,
    borderColor: "rgba(214,161,77,0.55)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  activeTitle: { fontSize: 24, fontWeight: "800", marginBottom: 10 },
  activeSub: { fontSize: 13.5, textAlign: "center", lineHeight: 20 },
  // Modal
  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.6)" },
  modalWrap: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 32 },
  modalCard: { width: "100%", borderRadius: 18, borderWidth: 1, padding: 22 },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 8, textAlign: "center" },
  modalBody: { fontSize: 14, textAlign: "center", marginBottom: 20, lineHeight: 20 },
  modalBtnRow: { flexDirection: "row", gap: 12 },
  modalBtnGhost: { flex: 1, borderRadius: 50, paddingVertical: 13, alignItems: "center", borderWidth: 1, borderColor: "rgba(244,218,213,0.15)" },
  modalBtnGhostText: { fontSize: 14, fontWeight: "600" },
  modalBtnPrimary: { flex: 1, borderRadius: 50, overflow: "hidden" },
  modalBtnPrimaryGrad: { paddingVertical: 14, alignItems: "center" },
  modalBtnPrimaryText: { color: "#08150F", fontWeight: "800", fontSize: 14 },
});
