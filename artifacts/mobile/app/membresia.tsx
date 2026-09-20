import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MEMBERSHIP_AURORA } from "@/constants/colors";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useColors } from "@/hooks/useColors";
import {
  REVENUECAT_ENTITLEMENT_IDENTIFIER,
  useSubscription,
} from "@/lib/revenuecat";

const DATE_FORMATTER = new Intl.DateTimeFormat("es-CL", {
  day: "numeric",
  month: "long",
  year: "numeric",
});

function formatSubscriptionDate(value?: string | null) {
  if (!value) return "No disponible";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "No disponible" : DATE_FORMATTER.format(date);
}

function resolvePlanLabel(packageType?: string, subscriptionPeriod?: string | null) {
  if (packageType === "ANNUAL" || subscriptionPeriod === "P1Y") return "Anual";
  if (packageType === "MONTHLY" || subscriptionPeriod === "P1M") return "Mensual";
  return "No disponible";
}

export default function MembresiaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { theme } = useSceneTheme();
  const { customerInfo, offerings, isSubscribed, isLoading } = useSubscription();
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const backgroundColors = theme.gradient as unknown as [string, string, ...string[]];
  const entitlement =
    customerInfo?.entitlements.all?.[REVENUECAT_ENTITLEMENT_IDENTIFIER];

  const activePackage = useMemo(() => {
    if (!entitlement) return undefined;
    return offerings?.current?.availablePackages.find((candidate) => {
      if (candidate.product.identifier !== entitlement.productIdentifier) return false;
      return (
        !entitlement.productPlanIdentifier
        || candidate.product.defaultOption?.id === entitlement.productPlanIdentifier
        || candidate.identifier === entitlement.productPlanIdentifier
      );
    }) ?? offerings?.current?.availablePackages.find(
      (candidate) => candidate.product.identifier === entitlement.productIdentifier,
    );
  }, [entitlement, offerings]);

  const planLabel = resolvePlanLabel(
    activePackage?.packageType,
    activePackage?.product.subscriptionPeriod,
  );
  const renewalDateLabel = formatSubscriptionDate(entitlement?.expirationDate);
  const startDateLabel = formatSubscriptionDate(entitlement?.originalPurchaseDate);
  const priceLabel = activePackage?.product.priceString;
  const billingPeriod =
    planLabel === "Anual" ? "anualmente" : planLabel === "Mensual" ? "mensualmente" : null;
  const statusLabel = isSubscribed ? "Activo" : entitlement ? "Inactivo" : "Sin suscripción";
  const renewalCopy = isSubscribed && entitlement?.willRenew
    ? priceLabel && billingPeriod
      ? `Se te cobrará ${priceLabel} ${billingPeriod}, de forma automática.`
      : "Tu suscripción se renovará automáticamente al finalizar el período."
    : isSubscribed
      ? "La renovación automática está desactivada. Mantendrás el acceso hasta la fecha indicada."
      : "No tienes una suscripción Premium activa.";

  return (
    <LinearGradient
      style={styles.root}
      colors={backgroundColors}
      locations={theme.gradientLocations as unknown as [number, number, ...number[]] | undefined}
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable
          onPress={() => router.back()}
          hitSlop={10}
          style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Volver"
        >
          <Feather
            name="chevron-left"
            size={28}
            color={colors.foreground}
            style={styles.backChevron}
          />
        </Pressable>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>Suscripción</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <View style={styles.premiumHeading}>
          <MaterialCommunityIcons
            name="star"
            size={31}
            color={MEMBERSHIP_AURORA.premium.accent}
          />
          <Text style={styles.premiumTitle}>
            <Text style={styles.premiumTitleBrand}>Resonancia</Text>
            {" Premium"}
          </Text>
        </View>

        <View style={styles.subscriptionCard}>
          {isLoading ? (
            <View style={styles.loadingState}>
              <ActivityIndicator color={MEMBERSHIP_AURORA.premium.accent} />
              <Text style={styles.loadingText}>Cargando tu suscripción…</Text>
            </View>
          ) : (
            <>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Estado</Text>
                <View style={styles.statusValue}>
                  <Text style={[styles.detailValue, isSubscribed && styles.activeValue]}>
                    {statusLabel}
                  </Text>
                  {isSubscribed ? (
                    <View style={styles.activeCheck}>
                      <Feather name="check" size={20} color="#91E2D1" />
                    </View>
                  ) : null}
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Tipo de plan</Text>
                <Text style={styles.detailValue}>{planLabel}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Fecha de inicio</Text>
                <Text style={styles.detailValue}>{startDateLabel}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>
                  {isSubscribed && entitlement?.willRenew ? "Próxima renovación" : "Válido hasta"}
                </Text>
                <Text style={styles.detailValue}>{renewalDateLabel}</Text>
              </View>

              <View style={styles.divider} />

              <View style={styles.billingNote}>
                <View style={styles.infoIcon}>
                  <Feather name="info" size={17} color="#252537" />
                </View>
                <Text style={styles.billingText}>{renewalCopy}</Text>
              </View>
            </>
          )}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 15,
    flexDirection: "row",
    alignItems: "flex-end",
  },
  backButton: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(0,0,0,0.28)",
    alignItems: "center",
    justifyContent: "center",
  },
  backChevron: {
    transform: [{ translateX: -1 }],
  },
  headerTitle: {
    flex: 1,
    fontFamily: "Manrope",
    fontSize: 20,
    lineHeight: 42,
    fontWeight: "700",
    textAlign: "center",
  },
  headerSpacer: {
    width: 43,
    height: 43,
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 18,
  },
  premiumHeading: {
    flexDirection: "row",
    alignItems: "center",
    gap: 11,
    marginBottom: 17,
  },
  premiumTitle: {
    color: MEMBERSHIP_AURORA.premium.accent,
    fontFamily: "Manrope",
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
  },
  premiumTitleBrand: {
    color: "#F9F9F9",
  },
  subscriptionCard: {
    overflow: "hidden",
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  detailRow: {
    minHeight: 65,
    paddingHorizontal: 20,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  detailLabel: {
    flexShrink: 1,
    transform: [{ translateY: -3 }],
    color: "#F4F4F4",
    fontFamily: "Manrope",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "400",
  },
  detailValue: {
    flexShrink: 1,
    transform: [{ translateY: -3 }],
    color: "#FFFFFF",
    fontFamily: "Manrope",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "700",
    textAlign: "right",
  },
  statusValue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  activeValue: {
    color: "#91E2D1",
  },
  activeCheck: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(145,226,209,0.14)",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.13)",
  },
  billingNote: {
    minHeight: 104,
    paddingHorizontal: 20,
    paddingVertical: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F9F9F9",
  },
  billingText: {
    flex: 1,
    color: "#F4F4F4",
    fontFamily: "Manrope",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "400",
  },
  loadingState: {
    minHeight: 180,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  loadingText: {
    color: MEMBERSHIP_AURORA.textSoft,
    fontFamily: "Manrope",
    fontSize: 13,
  },
  pressed: {
    opacity: 0.72,
  },
});