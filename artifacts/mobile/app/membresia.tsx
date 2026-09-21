import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import type { PurchasesPackage } from "react-native-purchases";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MEMBERSHIP_AURORA } from "@/constants/colors";
import { SessionBadgeGlass } from "@/components/SessionDurationBadge";
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

const GIFT_GOLD_COLORS = ["#D8A84F", "#F3D58A", "#B9822F"] as const;

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

const SUBSCRIPTION_BENEFITS = [
  {
    icon: "book-open",
    parts: [
      { text: "Explora " },
      { text: "sin límites", bold: true },
      { text: " nuestra biblioteca de bienestar y transformación." },
    ],
  },
  {
    icon: "download",
    parts: [
      { text: "Descarga", bold: true },
      { text: " tus contenidos favoritos para continuar tu práctica donde estés." },
    ],
  },
  {
    icon: "sliders",
    parts: [
      { text: "Mezclador de sonidos", bold: true },
      { text: " desbloqueado con sonidos de la Tierra y el Universo." },
    ],
  },
  {
    icon: "edit-3",
    parts: [
      { text: "Diario avanzado", bold: true },
      { text: " de reflexiones y generación de historias para Instagram." },
    ],
  },
  {
    icon: "video",
    parts: [
      { text: "Acceso a clases y sesiones " },
      { text: "online", bold: true },
      { text: " con los " },
      { text: "Resonadores", bold: true },
      { text: "." },
    ],
  },
] as const;

export default function MembresiaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { theme } = useSceneTheme();
  const {
    customerInfo,
    offerings,
    isSubscribed,
    isLoading,
    purchase,
    restore,
    isPurchasing,
    isRestoring,
    isConfigured,
    customerInfoError,
    refreshCustomerInfo,
    refreshOfferings,
  } = useSubscription();
  const [manageMounted, setManageMounted] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const manageOverlayOpacity = React.useRef(new Animated.Value(0)).current;
  const manageSheetTranslateY = React.useRef(new Animated.Value(520)).current;
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const backgroundColors = theme.gradient as unknown as [string, string, ...string[]];
  const entitlement =
    customerInfo?.entitlements.all?.[REVENUECAT_ENTITLEMENT_IDENTIFIER];
  const availablePackages = offerings?.current?.availablePackages ?? [];
  const purchasePackages = useMemo(
    () =>
      availablePackages
        .filter((candidate) =>
          candidate.packageType === "ANNUAL"
          || candidate.packageType === "MONTHLY"
          || candidate.packageType === "WEEKLY",
        )
        .sort((a, b) => {
        const rank = (candidate: PurchasesPackage) =>
          candidate.packageType === "ANNUAL"
            ? 0
            : candidate.packageType === "MONTHLY"
              ? 1
              : 2;
        return rank(a) - rank(b);
      }),
    [availablePackages],
  );

  useEffect(() => {
    if (purchasePackages.length === 0) {
      setSelectedPackageId(null);
      return;
    }
    if (selectedPackageId && purchasePackages.some((item) => item.identifier === selectedPackageId)) {
      return;
    }
    const preferred =
      purchasePackages.find((item) => item.packageType === "ANNUAL")
      ?? purchasePackages[0];
    setSelectedPackageId(preferred.identifier);
  }, [purchasePackages, selectedPackageId]);

  const selectedPackage =
    purchasePackages.find((item) => item.identifier === selectedPackageId)
    ?? purchasePackages[0];

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
  const managementURL = customerInfo?.managementURL;

  const handlePurchase = async () => {
    if (!selectedPackage || isPurchasing) return;
    try {
      await purchase(selectedPackage);
    } catch (error) {
      const cancelled =
        typeof error === "object"
        && error !== null
        && "userCancelled" in error
        && Boolean(error.userCancelled);
      if (cancelled) return;
      Alert.alert(
        "No pudimos completar la compra",
        "Revisa tu conexión e inténtalo nuevamente.",
      );
    }
  };

  const handleRestore = async () => {
    if (isRestoring) return;
    try {
      const restoredInfo = await restore();
      const restored =
        restoredInfo.entitlements.active?.[REVENUECAT_ENTITLEMENT_IDENTIFIER] !== undefined;
      Alert.alert(
        restored ? "Compra restaurada" : "No encontramos una suscripción",
        restored
          ? "Tu acceso Premium ya está activo."
          : "Verifica que estés usando la misma cuenta de la tienda con la que realizaste la compra.",
      );
    } catch {
      Alert.alert(
        "No pudimos restaurar tus compras",
        "Revisa tu conexión e inténtalo nuevamente.",
      );
    }
  };

  const openManage = () => {
    manageOverlayOpacity.setValue(0);
    manageSheetTranslateY.setValue(520);
    setManageMounted(true);
    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.timing(manageOverlayOpacity, {
          toValue: 1,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(manageSheetTranslateY, {
          toValue: 0,
          duration: 350,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const closeManage = (action?: () => void) => {
    Animated.parallel([
      Animated.timing(manageOverlayOpacity, {
        toValue: 0,
        duration: 350,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(manageSheetTranslateY, {
        toValue: 520,
        duration: 350,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (!finished) return;
      setManageMounted(false);
      if (action) requestAnimationFrame(action);
    });
  };

  const closeManageThen = (action: () => void) => closeManage(action);

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

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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

          {!isLoading && customerInfoError && (isConfigured || !__DEV__) ? (
            <SubscriptionStatusUnavailable
              isConfigured={isConfigured}
              onRetry={() => {
                void Promise.all([refreshCustomerInfo(), refreshOfferings()]);
              }}
            />
          ) : !isLoading && !isSubscribed ? (
            <PremiumOfferContent
              packages={purchasePackages}
              selectedPackage={selectedPackage}
              onSelect={(item) => setSelectedPackageId(item.identifier)}
              onPurchase={() => void handlePurchase()}
              onRestore={() => void handleRestore()}
              isPurchasing={isPurchasing}
              isRestoring={isRestoring}
              previewMode={!isConfigured && __DEV__}
            />
          ) : (
            <>
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

          <View style={styles.benefitsTitleRow}>
            <Text style={styles.benefitsTitle}>Tu suscripción incluye:</Text>
          </View>
          <View style={styles.benefitsCard}>
            {SUBSCRIPTION_BENEFITS.map((benefit) => (
              <View key={benefit.icon} style={styles.benefitRow}>
                <View style={styles.benefitIcon}>
                  <Feather
                    name={benefit.icon}
                    size={20}
                    color={MEMBERSHIP_AURORA.premium.accent}
                  />
                </View>
                <Text style={styles.benefitText}>
                  {benefit.parts.map((part, index) => (
                    <Text
                      key={`${benefit.icon}-${index}`}
                      style={"bold" in part && part.bold ? styles.benefitTextBold : undefined}
                    >
                      {part.text}
                    </Text>
                  ))}
                </Text>
              </View>
            ))}
          </View>

          <Pressable
            onPress={openManage}
            accessibilityRole="button"
            accessibilityLabel="Gestionar Premium"
            style={({ pressed }) => [
              styles.manageButton,
              pressed && styles.manageButtonPressed,
            ]}
          >
            <LinearGradient
              colors={GIFT_GOLD_COLORS}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={StyleSheet.absoluteFill}
            />
            <Text style={styles.manageButtonText}>Gestionar Premium</Text>
          </Pressable>
            </>
          )}
        </View>
      </ScrollView>

      {manageMounted ? (
        <View style={styles.manageOverlay}>
          <Animated.View
            style={[StyleSheet.absoluteFill, { opacity: manageOverlayOpacity }]}
            pointerEvents="none"
          >
            <BlurView
              intensity={45}
              tint="dark"
              experimentalBlurMethod="dimezisBlurView"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.manageDim} />
          </Animated.View>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => closeManage()}
            accessibilityLabel="Cerrar gestión de suscripción"
          />

          <Animated.View
            style={[
              styles.manageSheet,
              {
                paddingBottom: Math.max(insets.bottom, 20) + 14,
                transform: [{ translateY: manageSheetTranslateY }],
              },
            ]}
          >
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
              <SessionBadgeGlass showBlackTint={false} showWhiteTint />
            </View>

            <View style={styles.neonHandle} />

            <View style={styles.manageSheetHeader}>
              <Text style={styles.manageSheetTitle}>Gestionar suscripción</Text>
              <Pressable
                onPress={() => closeManage()}
                hitSlop={12}
                style={({ pressed }) => [styles.manageClose, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
              >
                <Feather name="x" size={23} color="#F9F9F9" />
              </Pressable>
            </View>

            <View style={styles.manageActions}>
              <ManageActionRow
                icon="life-buoy"
                label="Recibe ayuda"
                onPress={() => closeManageThen(() => router.push("/ayuda" as never))}
              />
              <ManageActionRow
                icon="message-circle"
                label="¿Tienes sugerencias?"
                onPress={() =>
                  closeManageThen(() => {
                    void Linking.openURL(
                      `mailto:hola@resonancia.app?subject=${encodeURIComponent("Sugerencias para Resonancia")}`,
                    );
                  })
                }
              />
              <ManageActionRow
                icon="radio"
                label="¿Quieres ser un Resonador?"
                onPress={() => closeManageThen(() => router.push("/resonador-postular" as never))}
              />
              <ManageActionRow
                icon="x-circle"
                label="Cancelar suscripción"
                isLast
                onPress={() => {
                  if (!managementURL) return;
                  closeManageThen(() => {
                    void Linking.openURL(managementURL);
                  });
                }}
              />
            </View>
          </Animated.View>
        </View>
      ) : null}
    </LinearGradient>
  );
}

function getPackageLabel(item: PurchasesPackage) {
  if (item.packageType === "ANNUAL") return "Plan anual";
  if (item.packageType === "MONTHLY") return "Plan mensual";
  if (item.packageType === "WEEKLY") return "Plan semanal";
  return item.product.title || "Plan Premium";
}

function getPackagePeriod(item: PurchasesPackage) {
  if (item.packageType === "ANNUAL" || item.product.subscriptionPeriod === "P1Y") {
    return "por año";
  }
  if (item.packageType === "MONTHLY" || item.product.subscriptionPeriod === "P1M") {
    return "por mes";
  }
  if (item.packageType === "WEEKLY" || item.product.subscriptionPeriod === "P1W") {
    return "por semana";
  }
  return "por período";
}

function SubscriptionStatusUnavailable({
  isConfigured,
  onRetry,
}: {
  isConfigured: boolean;
  onRetry: () => void;
}) {
  return (
    <View style={styles.subscriptionUnavailable}>
      <View style={styles.subscriptionUnavailableIcon}>
        <Feather name="shield" size={24} color={MEMBERSHIP_AURORA.premium.accent} />
      </View>
      <Text style={styles.subscriptionUnavailableTitle}>
        No pudimos verificar tu suscripción
      </Text>
      <Text style={styles.subscriptionUnavailableText}>
        {isConfigured
          ? "Tu acceso no cambiará por este problema. Revisa tu conexión e inténtalo nuevamente."
          : "Premium no está disponible temporalmente en esta versión de la app."}
      </Text>
      {isConfigured ? (
        <Pressable
          onPress={onRetry}
          accessibilityRole="button"
          style={({ pressed }) => [
            styles.subscriptionRetryButton,
            pressed && styles.manageButtonPressed,
          ]}
        >
          <Text style={styles.subscriptionRetryText}>Intentar nuevamente</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function PremiumOfferContent({
  packages,
  selectedPackage,
  onSelect,
  onPurchase,
  onRestore,
  isPurchasing,
  isRestoring,
  previewMode,
}: {
  packages: PurchasesPackage[];
  selectedPackage?: PurchasesPackage;
  onSelect: (item: PurchasesPackage) => void;
  onPurchase: () => void;
  onRestore: () => void;
  isPurchasing: boolean;
  isRestoring: boolean;
  previewMode: boolean;
}) {
  const busy = isPurchasing || isRestoring;
  const selectedPeriod = selectedPackage ? getPackagePeriod(selectedPackage) : null;

  return (
    <>
      <View style={styles.offerHero}>
        <View style={styles.offerStar}>
          <MaterialCommunityIcons
            name="star-four-points"
            size={31}
            color={MEMBERSHIP_AURORA.premium.accent}
          />
        </View>
        <Text style={styles.offerSubtitle}>
          Accede a más de 500 sesiones creadas para expandir tu consciencia y potenciar tu bienestar
        </Text>
      </View>

      {packages.length > 0 ? (
        <View style={styles.planGrid}>
          {packages.map((item) => {
            const selected = selectedPackage?.identifier === item.identifier;
            const recommended = item.packageType === "ANNUAL";
            return (
              <Pressable
                key={item.identifier}
                onPress={() => onSelect(item)}
                disabled={busy}
                accessibilityRole="radio"
                accessibilityState={{ selected, disabled: busy }}
                style={({ pressed }) => [
                  styles.planCard,
                  selected && styles.planCardSelected,
                  pressed && !busy && styles.planCardPressed,
                ]}
              >
                <View style={[styles.planRadio, selected && styles.planRadioSelected]}>
                  {selected ? <View style={styles.planRadioDot} /> : null}
                </View>
                <View style={styles.planCopy}>
                  <Text style={styles.planName}>{getPackageLabel(item)}</Text>
                  {recommended ? (
                    <View style={styles.recommendedPill}>
                      <Text style={styles.recommendedText}>RECOMENDADO</Text>
                    </View>
                  ) : null}
                </View>
                <View style={styles.planPriceBlock}>
                  <Text style={styles.planPrice}>{item.product.priceString}</Text>
                  <Text style={styles.planPeriod}>{getPackagePeriod(item)}</Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ) : previewMode ? (
        <View style={styles.planGrid}>
          {[
            { id: "annual-preview", name: "Plan anual", recommended: true },
            { id: "monthly-preview", name: "Plan mensual", recommended: false },
          ].map((item) => (
            <View
              key={item.id}
              style={[
                styles.planCard,
                item.recommended && styles.planCardSelected,
                styles.previewPlanCard,
              ]}
            >
              <View style={[styles.planRadio, item.recommended && styles.planRadioSelected]}>
                {item.recommended ? <View style={styles.planRadioDot} /> : null}
              </View>
              <View style={styles.planCopy}>
                <Text style={styles.planName}>{item.name}</Text>
                {item.recommended ? (
                  <View style={styles.recommendedPill}>
                    <Text style={styles.recommendedText}>RECOMENDADO</Text>
                  </View>
                ) : null}
              </View>
              <View style={styles.planPriceBlock}>
                <Text style={styles.previewPlanPrice}>Precio de la tienda</Text>
                <Text style={styles.planPeriod}>
                  {item.recommended ? "por año" : "por mes"}
                </Text>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.offerUnavailable}>
          <Feather name="wifi-off" size={22} color={MEMBERSHIP_AURORA.premium.accent} />
          <View style={styles.offerUnavailableCopy}>
            <Text style={styles.offerUnavailableTitle}>No pudimos cargar los planes</Text>
            <Text style={styles.offerUnavailableText}>
              Revisa tu conexión y vuelve a abrir esta pantalla.
            </Text>
          </View>
        </View>
      )}

      {!previewMode ? <Pressable
        onPress={onPurchase}
        disabled={!selectedPackage || busy}
        accessibilityRole="button"
        accessibilityLabel={
          selectedPackage
            ? `Comenzar Premium, ${selectedPackage.product.priceString} ${selectedPeriod}`
            : "Comenzar Premium"
        }
        accessibilityState={{ disabled: !selectedPackage || busy }}
        style={({ pressed }) => [
          styles.purchaseButton,
          (!selectedPackage || busy) && styles.purchaseButtonDisabled,
          pressed && selectedPackage && !busy && styles.manageButtonPressed,
        ]}
      >
        <LinearGradient
          colors={GIFT_GOLD_COLORS}
          start={{ x: 0, y: 0.5 }}
          end={{ x: 1, y: 0.5 }}
          style={StyleSheet.absoluteFill}
        />
        {isPurchasing ? (
          <ActivityIndicator color="#F9F9F9" />
        ) : (
          <Text style={styles.manageButtonText}>Comenzar Premium</Text>
        )}
      </Pressable> : null}

      {selectedPackage ? (
        <Text style={styles.purchaseDisclosure}>
          Se cobrará {selectedPackage.product.priceString} {selectedPeriod} y se renovará automáticamente
          hasta que canceles desde tu cuenta de la tienda.
        </Text>
      ) : null}

      <View style={styles.offerFooterActions}>
        {!previewMode ? (
          <>
            <Pressable
              onPress={onRestore}
              disabled={busy}
              accessibilityRole="button"
              style={({ pressed }) => [styles.offerFooterButton, pressed && styles.pressed]}
            >
              {isRestoring ? (
                <ActivityIndicator size="small" color="#F9F9F9" />
              ) : (
                <Text style={styles.offerFooterText}>Restaurar compras</Text>
              )}
            </Pressable>
            <View style={styles.offerFooterDot} />
          </>
        ) : null}
        <Pressable
          onPress={() => router.push("/terminos" as never)}
          accessibilityRole="link"
          style={({ pressed }) => [styles.offerFooterButton, pressed && styles.pressed]}
        >
          <Text style={styles.offerFooterText}>Términos de uso</Text>
        </Pressable>
        <View style={styles.offerFooterDot} />
        <Pressable
          onPress={() => router.push("/terminos" as never)}
          accessibilityRole="link"
          style={({ pressed }) => [styles.offerFooterButton, pressed && styles.pressed]}
        >
          <Text style={styles.offerFooterText}>Privacidad</Text>
        </Pressable>
      </View>
    </>
  );
}

function ManageActionRow({
  icon,
  label,
  onPress,
  isLast = false,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  onPress: () => void;
  isLast?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.manageActionRow,
        !isLast && styles.manageActionDivider,
        pressed && styles.manageActionPressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <View style={styles.manageActionIcon}>
        <Feather name={icon} size={20} color="#F9F9F9" />
      </View>
      <Text style={styles.manageActionText}>{label}</Text>
      <Feather name="chevron-right" size={22} color="#F9F9F9" />
    </Pressable>
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
    fontSize: 17,
    lineHeight: 42,
    fontWeight: "700",
    textAlign: "center",
  },
  headerSpacer: {
    width: 43,
    height: 43,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 44,
  },
  content: {
    paddingHorizontal: 24,
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
    minHeight: 63,
    paddingHorizontal: 20,
    paddingVertical: 9,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
  },
  detailLabel: {
    flexShrink: 1,
    transform: [{ translateY: -2 }],
    color: "#F4F4F4",
    fontFamily: "Manrope",
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "400",
  },
  detailValue: {
    flexShrink: 1,
    transform: [{ translateY: -2 }],
    color: "#FFFFFF",
    fontFamily: "Manrope",
    fontSize: 14,
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
    minHeight: 84,
    paddingHorizontal: 20,
    paddingVertical: 8,
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
  benefitsTitleRow: {
    marginTop: 14,
    marginBottom: 17,
    transform: [{ translateY: 16 }],
  },
  benefitsTitle: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "700",
  },
  benefitsCard: {
    paddingVertical: 7,
  },
  benefitRow: {
    minHeight: 76,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 10,
  },
  benefitIcon: {
    width: 42,
    height: 42,
    borderRadius: 10,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(231,185,92,0.15)",
  },
  benefitText: {
    flex: 1,
    paddingRight: 8,
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "400",
  },
  benefitTextBold: {
    fontWeight: "800",
  },
  offerHero: {
    position: "relative",
    overflow: "hidden",
    borderRadius: 19,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 25,
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  subscriptionUnavailable: {
    minHeight: 275,
    overflow: "hidden",
    borderRadius: 19,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  subscriptionUnavailableIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 17,
    backgroundColor: "rgba(231,185,92,0.14)",
  },
  subscriptionUnavailableTitle: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 18,
    lineHeight: 25,
    fontWeight: "800",
    textAlign: "center",
    marginBottom: 9,
  },
  subscriptionUnavailableText: {
    maxWidth: 290,
    color: "#E5E1EB",
    fontFamily: "Manrope",
    fontSize: 13,
    lineHeight: 20,
    textAlign: "center",
  },
  subscriptionRetryButton: {
    minWidth: 190,
    height: 48,
    borderRadius: 14,
    marginTop: 21,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(231,185,92,0.16)",
    borderWidth: 1,
    borderColor: "rgba(231,185,92,0.44)",
  },
  subscriptionRetryText: {
    color: MEMBERSHIP_AURORA.premium.accent,
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "800",
  },
  offerStar: {
    width: 58,
    height: 58,
    borderRadius: 29,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    backgroundColor: "rgba(231,185,92,0.14)",
    borderWidth: 1,
    borderColor: "rgba(231,185,92,0.3)",
  },
  offerSubtitle: {
    maxWidth: 300,
    color: "#E5E1EB",
    fontFamily: "Manrope",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "400",
    textAlign: "center",
  },
  planGrid: {
    marginTop: 16,
    gap: 12,
  },
  planCard: {
    width: "100%",
    minHeight: 92,
    overflow: "hidden",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    paddingHorizontal: 17,
    paddingVertical: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  planCardSelected: {
    borderWidth: 1.5,
    borderColor: MEMBERSHIP_AURORA.premium.accent,
    backgroundColor: "rgba(231,185,92,0.11)",
  },
  previewPlanCard: {
    opacity: 0.9,
  },
  planCardPressed: {
    opacity: 0.82,
  },
  recommendedPill: {
    alignSelf: "flex-start",
    borderRadius: 999,
    paddingHorizontal: 9,
    paddingVertical: 4,
    marginTop: 5,
    backgroundColor: "rgba(231,185,92,0.16)",
  },
  recommendedText: {
    color: MEMBERSHIP_AURORA.premium.accent,
    fontFamily: "Manrope",
    fontSize: 8,
    lineHeight: 11,
    fontWeight: "800",
    letterSpacing: 0.75,
  },
  planRadio: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.35)",
    alignItems: "center",
    justifyContent: "center",
  },
  planRadioSelected: {
    borderColor: MEMBERSHIP_AURORA.premium.accent,
  },
  planRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: MEMBERSHIP_AURORA.premium.accent,
  },
  planName: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  planCopy: {
    flex: 1,
    minWidth: 0,
  },
  planPriceBlock: {
    flexShrink: 0,
    alignItems: "flex-end",
  },
  planPrice: {
    color: "#FFFFFF",
    fontFamily: "Manrope",
    fontSize: 20,
    lineHeight: 27,
    fontWeight: "800",
  },
  previewPlanPrice: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 13,
    lineHeight: 20,
    fontWeight: "700",
  },
  planPeriod: {
    color: "#D3CFD8",
    fontFamily: "Manrope",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "500",
  },
  offerUnavailable: {
    minHeight: 90,
    borderRadius: 17,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(0,0,0,0.28)",
  },
  offerUnavailableCopy: {
    flex: 1,
  },
  offerUnavailableTitle: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
    marginBottom: 3,
  },
  offerUnavailableText: {
    color: "#D3CFD8",
    fontFamily: "Manrope",
    fontSize: 12,
    lineHeight: 18,
  },
  purchaseButton: {
    height: 54,
    marginTop: 25,
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  purchaseButtonDisabled: {
    opacity: 0.52,
  },
  purchaseDisclosure: {
    color: "#D3CFD8",
    fontFamily: "Manrope",
    fontSize: 11,
    lineHeight: 17,
    fontWeight: "400",
    textAlign: "center",
    paddingHorizontal: 8,
    marginTop: 12,
  },
  offerFooterActions: {
    minHeight: 42,
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  offerFooterButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  offerFooterText: {
    color: "#E5E1EB",
    fontFamily: "Manrope",
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "600",
  },
  offerFooterDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "rgba(255,255,255,0.38)",
  },
  manageButton: {
    height: 52,
    marginTop: 22,
    borderRadius: 14,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  manageButtonPressed: {
    opacity: 0.84,
  },
  manageButtonText: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "800",
    textShadowColor: "rgba(0,0,0,0.58)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  manageOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 50,
    justifyContent: "flex-end",
  },
  manageDim: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.42)",
  },
  manageSheet: {
    overflow: "hidden",
    minHeight: 430,
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    borderBottomWidth: 0,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "transparent",
  },
  neonHandle: {
    alignSelf: "center",
    width: 54,
    height: 5,
    borderRadius: 2.5,
    marginBottom: 22,
    backgroundColor: "#E7B95C",
    shadowColor: "#E7B95C",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 9,
    elevation: 8,
  },
  manageSheetHeader: {
    minHeight: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 18,
  },
  manageSheetTitle: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
  },
  manageClose: {
    position: "absolute",
    right: 0,
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  manageActions: {
    overflow: "hidden",
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    backgroundColor: "rgba(255,255,255,0.055)",
  },
  manageActionRow: {
    minHeight: 66,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  manageActionDivider: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.12)",
  },
  manageActionPressed: {
    backgroundColor: "rgba(231,185,92,0.1)",
  },
  manageActionIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  manageActionText: {
    flex: 1,
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "700",
  },
  pressed: {
    opacity: 0.72,
  },
});