import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Image } from "expo-image";
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
import { IconCuencoTibetano } from "@/components/AncestralIcons";
import { usePremium } from "@/context/PremiumContext";
import { useBackAfterClose, useBackOverride } from "@/context/BackOverrideContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useColors } from "@/hooks/useColors";
import { PREMIUM_OFFER_ACCENT, PREMIUM_OFFER_SELECTED_CARD, PREMIUM_OFFER_LOGO_GRADIENT, PREMIUM_OFFER_BACKGROUND, PREMIUM_OFFER_LOCATIONS } from "@/constants/premiumOfferBackground";
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
  const backOverride = useBackOverride();
  const backAfterClose = useBackAfterClose();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { theme } = useSceneTheme();
  const {
    customerInfo,
    offerings,
    isLoading,
    purchase,
    isPurchasing,
    isConfigured,
    customerInfoError,
    refreshCustomerInfo,
    refreshOfferings,
  } = useSubscription();
  const { isPremium } = usePremium();
  const [manageMounted, setManageMounted] = useState(false);
  const [benefitsMounted, setBenefitsMounted] = useState(false);
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null);
  const scrollRef = React.useRef<ScrollView>(null);
  const manageOverlayOpacity = React.useRef(new Animated.Value(0)).current;
  const manageSheetTranslateY = React.useRef(new Animated.Value(520)).current;
  const benefitsOpacity = React.useRef(new Animated.Value(0)).current;
  const benefitsTranslateY = React.useRef(new Animated.Value(620)).current;
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
          || candidate.packageType === "MONTHLY",
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
  const isOfferScreen =
    !isLoading
    && !isPremium
    && !(customerInfoError && (isConfigured || !__DEV__));

  useEffect(() => {
    if (!isOfferScreen) return;
    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollTo({ y: 0, animated: false });
    });
    return () => cancelAnimationFrame(frame);
  }, [isOfferScreen]);

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
  const statusLabel = isPremium ? "Activo" : entitlement ? "Inactivo" : "Sin suscripción";
  const renewalCopy = isPremium && entitlement?.willRenew
    ? priceLabel && billingPeriod
      ? `Se te cobrará ${priceLabel} ${billingPeriod}, de forma automática.`
      : "Tu suscripción se renovará automáticamente al finalizar el período."
    : isPremium
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

  const openBenefits = () => {
    benefitsOpacity.setValue(0);
    benefitsTranslateY.setValue(620);
    setBenefitsMounted(true);
    requestAnimationFrame(() => {
      Animated.parallel([
        Animated.timing(benefitsOpacity, {
          toValue: 1,
          duration: 260,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.spring(benefitsTranslateY, {
          toValue: 0,
          damping: 22,
          stiffness: 170,
          mass: 0.9,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const closeBenefits = () => {
    Animated.parallel([
      Animated.timing(benefitsOpacity, {
        toValue: 0,
        duration: 210,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(benefitsTranslateY, {
        toValue: 620,
        duration: 280,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start(({ finished }) => {
      if (finished) setBenefitsMounted(false);
    });
  };

  return (
    <LinearGradient
      style={styles.root}
      colors={isOfferScreen ? PREMIUM_OFFER_BACKGROUND : backgroundColors}
      locations={
        isOfferScreen
          ? PREMIUM_OFFER_LOCATIONS
          : theme.gradientLocations as unknown as [number, number, ...number[]] | undefined
      }
    >
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {!isOfferScreen ? (
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable
          onPress={backOverride ?? (() => router.back())}
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
      ) : null}

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.content, isOfferScreen && styles.offerScreenContent]}>
          {isOfferScreen ? (
            <View style={[styles.offerInlineHeader, { paddingTop: topPad + 8 }]}>
              <Pressable
                onPress={backOverride ?? (() => router.back())}
                hitSlop={10}
                style={({ pressed }) => [styles.offerCloseButton, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
              >
                <Feather name="x" size={29} color="#FFFFFF" />
              </Pressable>
            </View>
          ) : null}
          {!isOfferScreen ? <View style={styles.premiumHeading}>
            <MaterialCommunityIcons
              name="star"
              size={31}
              color={MEMBERSHIP_AURORA.premium.accent}
            />
            <Text style={styles.premiumTitle}>
              <Text style={styles.premiumTitleBrand}>Resonancia</Text>
              {" Premium"}
            </Text>
          </View> : null}

          {!isLoading && !isPremium && customerInfoError && (isConfigured || !__DEV__) ? (
            <SubscriptionStatusUnavailable
              isConfigured={isConfigured}
              onRetry={() => {
                void Promise.all([refreshCustomerInfo(), refreshOfferings()]);
              }}
            />
          ) : !isLoading && !isPremium ? (
            <PremiumOfferContent
              packages={purchasePackages}
              selectedPackage={selectedPackage}
              onSelect={(item) => setSelectedPackageId(item.identifier)}
              onPurchase={() => void handlePurchase()}
              onOpenBenefits={openBenefits}
              isPurchasing={isPurchasing}
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
                    <Text style={[styles.detailValue, isPremium && styles.activeValue]}>
                      {statusLabel}
                    </Text>
                    {isPremium ? (
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
                    {isPremium && entitlement?.willRenew ? "Próxima renovación" : "Válido hasta"}
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
                onPress={() => closeManageThen(() => {
                  if (backAfterClose) {
                    backAfterClose(() => router.push("/ayuda" as never));
                  } else {
                    router.push("/ayuda" as never);
                  }
                })}
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
                onPress={() => closeManageThen(() => {
                  if (backAfterClose) {
                    backAfterClose(() => router.push("/resonador-postular" as never));
                  } else {
                    router.push("/resonador-postular" as never);
                  }
                })}
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

      {benefitsMounted ? (
        <View style={styles.benefitsOverlay}>
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { opacity: benefitsOpacity }]}
          >
            <BlurView
              intensity={26}
              tint="dark"
              experimentalBlurMethod="dimezisBlurView"
              style={StyleSheet.absoluteFill}
            />
            <View style={styles.benefitsBackdropTint} />
          </Animated.View>

          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={closeBenefits}
            accessibilityLabel="Cerrar beneficios Premium"
          />

          <Animated.View
            style={[
              styles.benefitsDialog,
              {
                opacity: benefitsOpacity,
                transform: [{ translateY: benefitsTranslateY }],
              },
            ]}
          >
            <BlurView
              intensity={42}
              tint="dark"
              experimentalBlurMethod="dimezisBlurView"
              style={StyleSheet.absoluteFill}
              pointerEvents="none"
            />
            <View
              pointerEvents="none"
              style={[StyleSheet.absoluteFill, styles.benefitsDialogTint]}
            />

            <View style={styles.benefitsDialogHeader}>
              <Text style={styles.benefitsDialogTitle}>Tus beneficios</Text>
              <Pressable
                onPress={closeBenefits}
                hitSlop={12}
                style={({ pressed }) => [styles.benefitsDialogClose, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
              >
                <Feather name="x" size={23} color="#F9F9F9" />
              </Pressable>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.benefitsDialogList}
            >
              {SUBSCRIPTION_BENEFITS.map((benefit) => (
                <View key={benefit.icon} style={styles.benefitRow}>
                  <View style={styles.benefitIcon}>
                    <Feather
                      name={benefit.icon}
                      size={20}
                      color={MEMBERSHIP_AURORA.premium.accent}
                    />
                  </View>
                  <Text style={[styles.benefitText, styles.benefitsDialogText]}>
                    {benefit.parts.map((part, index) => (
                      <Text
                        key={`${benefit.icon}-dialog-${index}`}
                        style={"bold" in part && part.bold ? styles.benefitTextBold : undefined}
                      >
                        {part.text}
                      </Text>
                    ))}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </Animated.View>
        </View>
      ) : null}
    </LinearGradient>
  );
}

function getPackageLabel(item: PurchasesPackage) {
  if (item.packageType === "ANNUAL") return "Plan Premium Anual";
  if (item.packageType === "MONTHLY") return "Plan Premium Mensual";
  return item.product.title || "Plan Premium";
}

function getPackagePeriod(item: PurchasesPackage) {
  if (item.packageType === "ANNUAL" || item.product.subscriptionPeriod === "P1Y") {
    return "por año";
  }
  if (item.packageType === "MONTHLY" || item.product.subscriptionPeriod === "P1M") {
    return "por mes";
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
  onOpenBenefits,
  isPurchasing,
  previewMode,
}: {
  packages: PurchasesPackage[];
  selectedPackage?: PurchasesPackage;
  onSelect: (item: PurchasesPackage) => void;
  onPurchase: () => void;
  onOpenBenefits: () => void;
  isPurchasing: boolean;
  previewMode: boolean;
}) {
  const busy = isPurchasing;
  const [previewSelectedId, setPreviewSelectedId] = useState("annual-preview");
  const [giftSelected, setGiftSelected] = useState(false);
  const effectiveSelectedPackage = giftSelected ? undefined : selectedPackage;
  const selectedPeriod = effectiveSelectedPackage ? getPackagePeriod(effectiveSelectedPackage) : null;

  return (
    <>
      <View style={styles.offerBrandOffset} />
      <View style={styles.offerHero}>
        <LinearGradient
          colors={PREMIUM_OFFER_LOGO_GRADIENT}
          locations={[0, 0.5, 1]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.offerLogo}
        >
          <IconCuencoTibetano size={47} color="#FFFFFF" />
        </LinearGradient>
        <Text style={styles.offerBrand}>Resonancia</Text>
      </View>

      <View style={styles.planOffset} />
      {packages.length > 0 ? (
        <View style={styles.planGrid}>
          {packages.map((item) => {
            const selected = !giftSelected && selectedPackage?.identifier === item.identifier;
            return (
              <Pressable
                key={item.identifier}
                onPress={() => {
                  setGiftSelected(false);
                  onSelect(item);
                }}
                disabled={busy}
                accessibilityRole="radio"
                accessibilityState={{ selected, disabled: busy }}
                style={({ pressed }) => [
                  styles.planCard,
                  selected && styles.planCardSelected,
                  pressed && !busy && styles.planCardPressed,
                ]}
              >
                <AnimatedPlanSelection selected={selected} />
                {selected ? <Image
                  source={require("../assets/images/estrella-premium.png")}
                  style={{ width: 24, height: 24 }}
                  contentFit="contain"
                /> : <MaterialCommunityIcons name="star" size={24} color="#F0F0F0" />}
                <View style={styles.planCopy}>
                  <Text style={[
                    styles.planName,
                    selected && styles.planTextSelected,
                    (item.packageType === "ANNUAL" || item.packageType === "MONTHLY")
                      && styles.raisedPlanContent,
                  ]}>
                    {getPackageLabel(item)}
                  </Text>
                </View>
                <View style={styles.planPriceBlock}>
                  <Text style={[
                    styles.planPrice,
                    selected && styles.planTextSelected,
                    (item.packageType === "ANNUAL" || item.packageType === "MONTHLY")
                      && styles.raisedPlanContent,
                  ]}>
                    {item.product.priceString}
                  </Text>
                </View>
              </Pressable>
            );
          })}
          <GiftCardPlanOption
            selected={giftSelected}
            onPress={() => setGiftSelected(true)}
          />
        </View>
      ) : previewMode ? (
        <View style={styles.planGrid}>
          {[
            { id: "monthly-preview", name: "Plan Premium Mensual", price: "$5.990" },
            { id: "annual-preview", name: "Plan Premium Anual", price: "$39.990" },
          ].map((item) => {
            const selected = previewSelectedId === item.id;
            return (
            <Pressable
              key={item.id}
              onPress={() => setPreviewSelectedId(item.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={({ pressed }) => [
                styles.planCard,
                selected && styles.planCardSelected,
                styles.previewPlanCard,
                pressed && styles.planCardPressed,
              ]}
            >
              <AnimatedPlanSelection selected={selected} />
              {selected ? <Image
                source={require("../assets/images/estrella-premium.png")}
                style={{ width: 24, height: 24 }}
                contentFit="contain"
              /> : <MaterialCommunityIcons name="star" size={24} color="#F0F0F0" />}
              <View style={styles.planCopy}>
                <Text style={[
                  styles.planName,
                  selected && styles.planTextSelected,
                  styles.raisedPlanContent,
                ]}>
                  {item.name}
                </Text>
              </View>
              <View style={styles.planPriceBlock}>
                <Text style={[
                  styles.planPrice,
                  selected && styles.planTextSelected,
                  styles.raisedPlanContent,
                ]}>
                  {item.price}
                </Text>
              </View>
            </Pressable>
            );
          })}
          <GiftCardPlanOption
            selected={previewSelectedId === "gift-preview"}
            onPress={() => setPreviewSelectedId("gift-preview")}
          />
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

      <Pressable
        onPress={onPurchase}
        disabled={!effectiveSelectedPackage || busy || previewMode}
        accessibilityRole="button"
        accessibilityLabel={
          effectiveSelectedPackage
            ? `Comenzar Premium, ${effectiveSelectedPackage.product.priceString} ${selectedPeriod}`
            : "Comenzar Premium"
        }
        accessibilityState={{ disabled: !effectiveSelectedPackage || busy || previewMode }}
        style={({ pressed }) => [
          styles.purchaseButton,
          (!effectiveSelectedPackage || busy || previewMode) && styles.purchaseButtonDisabled,
          pressed && effectiveSelectedPackage && !busy && styles.manageButtonPressed,
        ]}
      >
        <View style={[StyleSheet.absoluteFill, { backgroundColor: PREMIUM_OFFER_ACCENT }]} />
        {isPurchasing ? (
          <ActivityIndicator color="#F9F9F9" />
        ) : (
          <Text style={styles.purchaseButtonText}>Comprar</Text>
        )}
      </Pressable>

      {effectiveSelectedPackage ? (
        <Text style={styles.purchaseDisclosure}>
          Se cobrará {effectiveSelectedPackage.product.priceString} {selectedPeriod} y se renovará automáticamente
          hasta que canceles desde tu cuenta de la tienda.
        </Text>
      ) : null}

      <View style={styles.offerFooterActions}>
        <Pressable
          onPress={onOpenBenefits}
          accessibilityRole="button"
          style={({ pressed }) => [styles.discoverPremiumButton, pressed && styles.pressed]}
        >
          <Text style={styles.discoverPremiumText}>Descubre Premium</Text>
        </Pressable>
      </View>
    </>
  );
}

function AnimatedPlanSelection({ selected }: { selected: boolean }) {
  const opacity = React.useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: selected ? 1 : 0,
      duration: 400,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [opacity, selected]);

  return (
    <>
      <View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, styles.planGlassTint]}
      />
      <Animated.View
        pointerEvents="none"
        style={[StyleSheet.absoluteFill, { opacity }]}
      >
        <BlurView
          intensity={38}
          tint="light"
          experimentalBlurMethod="dimezisBlurView"
          style={StyleSheet.absoluteFill}
        />
        <View style={[StyleSheet.absoluteFill, styles.planGlassTintSelected]} />
      </Animated.View>
    </>
  );
}

function GiftCardPlanOption({
  selected,
  onPress,
}: {
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.planCard,
        styles.giftCardPlan,
        selected && styles.planCardSelected,
        pressed && styles.planCardPressed,
      ]}
      accessibilityRole="radio"
      accessibilityLabel="Plan Premium Anual Gift Card"
      accessibilityState={{ selected }}
    >
      <AnimatedPlanSelection selected={selected} />
      {selected ? <Image
        source={require("../assets/images/estrella-premium.png")}
        style={{ width: 24, height: 24 }}
        contentFit="contain"
      /> : <MaterialCommunityIcons name="star" size={24} color="#F0F0F0" />}
      <View style={styles.planCopy}>
        <Text style={[
          styles.planName,
          selected && styles.planTextSelected,
          styles.raisedPlanContent,
        ]}>
          Plan Premium Anual Gift Card
        </Text>
      </View>
      <View style={styles.planPriceBlock}>
        <Text style={[
          styles.planPrice,
          selected && styles.planTextSelected,
          styles.raisedPlanContent,
        ]}>
          $45.990
        </Text>
      </View>
    </Pressable>
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
  offerInlineHeader: {
    minHeight: 62,
    paddingBottom: 8,
    alignItems: "flex-end",
  },
  offerCloseButton: {
    width: 47,
    height: 47,
    borderRadius: 23.5,
    borderWidth: 0,
    borderColor: "transparent",
    backgroundColor: "rgba(0,0,0,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  backButton: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    borderWidth: 0,
    borderColor: "transparent",
    backgroundColor: "rgba(0,0,0,0.16)",
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
  offerScreenContent: {
    paddingTop: 2,
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
    backgroundColor: "rgba(0,0,0,0.16)",
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
  offerBrandOffset: {
    height: 100,
  },
  offerHero: {
    paddingHorizontal: 24,
    paddingTop: 26,
    paddingBottom: 20,
    alignItems: "center",
  },
  subscriptionUnavailable: {
    minHeight: 275,
    overflow: "hidden",
    borderRadius: 19,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.16)",
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
  offerLogo: {
    width: 104,
    height: 104,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    shadowColor: "#8B72F2",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 10,
  },
  offerBrand: {
    color: "#FFFFFF",
    fontFamily: "Manrope",
    fontSize: 20,
    lineHeight: 27,
    fontWeight: "800",
  },
  planGrid: {
    gap: 11,
    transform: [{ translateY: -15 }],
  },
  planOffset: {
    height: 100,
  },
  planCard: {
    width: "100%",
    minHeight: 45,
    overflow: "hidden",
    borderRadius: 21,
    paddingHorizontal: 18,
    paddingVertical: 2,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    backgroundColor: "transparent",
  },
  planCardSelected: {
    backgroundColor: "transparent",
  },
  planGlassTint: {
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  planGlassTintSelected: {
    backgroundColor: PREMIUM_OFFER_SELECTED_CARD,
  },
  previewPlanCard: {
    opacity: 1,
  },
  giftCardPlan: {
    opacity: 1,
  },
  planCardPressed: {
    opacity: 0.82,
  },
  planName: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 13,
    lineHeight: 19,
    fontWeight: "700",
  },
  planTextSelected: {
    color: "#FFFFFF",
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
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "800",
  },
  raisedPlanContent: {
    transform: [{ translateY: -1 }],
  },
  offerUnavailable: {
    minHeight: 90,
    borderRadius: 17,
    paddingHorizontal: 18,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    backgroundColor: "rgba(0,0,0,0.16)",
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
    height: 50,
    marginTop: 27,
    borderRadius: 21,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  purchaseButtonDisabled: {
    opacity: 0.76,
  },
  purchaseButtonText: {
    color: "#FFFFFF",
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "800",
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
    alignItems: "center",
    justifyContent: "center",
  },
  discoverPremiumButton: {
    minHeight: 44,
    justifyContent: "center",
    paddingHorizontal: 18,
  },
  discoverPremiumText: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    textDecorationLine: "underline",
  },
  manageButton: {
    height: 52,
    marginTop: 22,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "#B9822F",
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
  benefitsOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 60,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  benefitsBackdropTint: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.32)",
  },
  benefitsDialog: {
    width: "100%",
    maxWidth: 430,
    maxHeight: "78%",
    overflow: "hidden",
    borderRadius: 27,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.13)",
    backgroundColor: "transparent",
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 18 },
    shadowOpacity: 0.5,
    shadowRadius: 30,
    elevation: 24,
  },
  benefitsDialogTint: {
    backgroundColor: "rgba(0,0,0,0.60)",
  },
  benefitsDialogHeader: {
    minHeight: 72,
    paddingHorizontal: 22,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.13)",
  },
  benefitsDialogTitle: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 18,
    lineHeight: 24,
    fontWeight: "800",
  },
  benefitsDialogClose: {
    position: "absolute",
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  benefitsDialogList: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 18,
  },
  benefitsDialogText: {
    fontSize: 12,
    lineHeight: 18,
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