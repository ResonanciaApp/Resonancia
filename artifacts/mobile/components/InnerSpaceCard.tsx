import { getThemeStyleId } from "@/config/scene-themes";
import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Animated, Easing, Keyboard } from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { KeyboardController } from "react-native-keyboard-controller";
import Reanimated, {
  Easing as ReanimatedEasing,
  runOnJS,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
import { DiscoverSearchBorder } from "@/components/DiscoverSearchBorder";
import { ReflectionWallPlusIcon, WALL_PLUS_HALO_SIZES as HALO_SIZES } from "@/components/ReflectionWallPlusIcon";
import { ReflectionCategoryTabFill } from "@/components/ReflectionCategoryTabFill";
import { ReflectionCategoryTabLabel, ReflectionCategoryTabBorder } from "@/components/ReflectionCategoryTabLabel";
import {
  REFLECTION_WALL_BORDER_GRADIENT,
  REFLECTION_WALL_BORDER_LOCATIONS,
  CLOUDY_REFLECTION_WALL_BORDER_GRADIENT,
  REFLECTION_WALL_BORDER_START,
  REFLECTION_WALL_BORDER_END,
  REFLECTION_WALL_BORDER_BRIGHTNESS,
} from "@/constants/reflectionWallBorder";
import { useSceneTheme } from "@/context/SceneThemeContext";
import {
  getListMyReflectionsQueryKey,
  useCreateMyReflection,
  useListMyReflections,
  type Reflection,
  type ReflectionCategory,
  type ReflectionsPage,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { useReflectionCategories } from "@/constants/reflectionCategories";
import { useAuth } from "@/context/AuthContext";
import { usePremium } from "@/context/PremiumContext";
import { FREE_REFLECTIONS_LIMIT, showPremiumGate } from "@/lib/premiumGate";

// La + se repite visualmente cada 90°: 270° son tres ciclos perceptibles.
// Tras el giro hay solo tres movimientos: cruce moderado, cruce menor y ajuste final.
const PLUS_ROTATION_STOPS = [
  { angle: 279, duration: 360 },
  { angle: 264, duration: 260 },
  { angle: 272, duration: 240 },
  { angle: 270, duration: 200 },
] as const;
// El panel termina antes que el rebote de la +; el scroll espera solo al panel.
const PANEL_DURATION = 620;
const SCREEN_SETTLE_DURATION = 650;
export const INNER_SPACE_CARD_BOTTOM_MARGIN = 32;
const COMPOSER_BOTTOM_GAP = 28;
const REFLECTION_ACTION_ICON_SIZE = 14;

export function InnerSpaceCard({
  focusRequest = 0,
  keepKeyboardOnCategories = false,
  sectionTitle,
  canonicalVerticalInsets = false,
  sectionBackgroundColor,
  profileVariant = false,
  onCollapsedHeightChange,
  onComposeRequested,
  onInputBlur,
  onMessageSaved,
  onExpandStart,
  onExpandComplete,
}: {
  focusRequest?: number;
  keepKeyboardOnCategories?: boolean;
  sectionTitle?: string;
  canonicalVerticalInsets?: boolean;
  sectionBackgroundColor?: string;
  profileVariant?: boolean;
  onCollapsedHeightChange?: (height: number) => void;
  onComposeRequested?: () => void;
  onInputBlur?: () => void;
  onMessageSaved?: () => void;
  onExpandStart?: () => void;
  onExpandComplete?: (height: number) => void;
}) {
  const colors = useColors();
  const { theme } = useSceneTheme();
  const accent = theme.accent ?? colors.accent;
  const [category, setCategory] = useState<ReflectionCategory | null>(null);
  const [message, setMessage] = useState("");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [signInRequired, setSignInRequired] = useState(false);
  const inputRef = useRef<TextInput>(null);
  const writingTapPendingRef = useRef(false);
  const [inputActive, setInputActive] = useState(false);
  const [inputTouched, setInputTouched] = useState(false);
  const [inputFocusVersion, setInputFocusVersion] = useState(0);
  const [expanded, setExpanded] = useState(false);
  const expandedRef = useRef(false);
  const animatingRef = useRef(false);
  const queuedOpenRef = useRef(false);
  const focusAfterExpandRef = useRef(false);
  const consumedProfileFocusRequestRef = useRef(0);
  const contentHeightRef = useRef(0);
  const reduceMotion = useReducedMotion();
  const closedBorderOpacity = profileVariant ? 0.9 : 0.4;
  const sectionBorderOpacity = useSharedValue(closedBorderOpacity);
  useEffect(() => {
    if (!expandedRef.current && !animatingRef.current) {
      sectionBorderOpacity.value = closedBorderOpacity;
    }
  }, [closedBorderOpacity, sectionBorderOpacity]);
  const sectionBorderStyle = useAnimatedStyle(() => ({ opacity: sectionBorderOpacity.value }));
  const clipHeight = useSharedValue(0);
  const clipStyle = useAnimatedStyle(() => ({ height: clipHeight.value }));
  const reservedHeight = useSharedValue(0);
  const collapseSpacerStyle = useAnimatedStyle(() => ({
    height: Math.max(0, reservedHeight.value - clipHeight.value),
  }));
  const revealOpacity = useRef(new Animated.Value(0)).current;
  const revealY = useRef(new Animated.Value(-14)).current;
  const plusSpin = useRef(new Animated.Value(0)).current;
  const haloValues = useRef(HALO_SIZES.map(() => new Animated.Value(1))).current;
  const qc = useQueryClient();
  const { authLoading, isSignedIn, clerkUserId } = useAuth();
  const { isPremium } = usePremium();
  const {
    options: reflectionCategoryOptions,
    isCatalogError,
    isCatalogEmpty,
  } = useReflectionCategories();
  const freeQuotaParams = { limit: FREE_REFLECTIONS_LIMIT + 1 };
  const { data: freeQuotaData, isLoading: freeQuotaLoading } = useListMyReflections(
    freeQuotaParams,
    {
      query: {
        queryKey: [...getListMyReflectionsQueryKey(freeQuotaParams), clerkUserId],
        enabled: !authLoading && isSignedIn && Boolean(clerkUserId) && !isPremium,
      },
    },
  );
  const freeLimitReached =
    !isPremium && (freeQuotaData?.items.length ?? 0) >= FREE_REFLECTIONS_LIMIT;

  const createMutation = useCreateMyReflection({
    mutation: {
      onSuccess: (created: Reflection) => {
        setSaveError(null);
        setSignInRequired(false);
        setMessage("");
        setCategory(null);
        inputRef.current?.blur();
        setInputActive(false);
        setInputTouched(false);

        const createdAt = new Date(created.createdAt).getTime();
        const reflectionQueries = qc.getQueriesData<ReflectionsPage>({
          predicate: (query) =>
            query.queryKey[0] === "/api/me/reflections"
            && (
              !clerkUserId
              || query.queryKey[query.queryKey.length - 1] === clerkUserId
            ),
        });

        reflectionQueries.forEach(([queryKey, page]) => {
          if (!page) return;
          const params = (
            queryKey.length > 1
            && typeof queryKey[1] === "object"
            && queryKey[1] !== null
          )
            ? queryKey[1] as { category?: ReflectionCategory; from?: string; to?: string }
            : {};
          const categoryMatches = !params.category || params.category === created.category;
          const fromMatches = !params.from || createdAt >= new Date(params.from).getTime();
          const toMatches = !params.to || createdAt < new Date(params.to).getTime();
          if (!categoryMatches || !fromMatches || !toMatches) return;

          qc.setQueryData<ReflectionsPage>(queryKey, {
            ...page,
            items: [
              created,
              ...page.items.filter((item) => item.id !== created.id),
            ],
          });
        });

        void qc.invalidateQueries({
          predicate: (query) => query.queryKey[0] === "/api/me/reflections",
        });
        onMessageSaved?.();
      },
      onError: (error) => {
        const response = error as { status?: number; data?: { error?: string }; message?: string };
        if (response.status === 401) {
          setSignInRequired(true);
          setSaveError("No se pudo validar tu sesión. Vuelve a iniciar sesión para guardar tu reflexión.");
        } else if (response.status === undefined) {
          setSignInRequired(false);
          setSaveError("No se pudo conectar para guardar tu reflexión. Comprueba tu conexión e inténtalo de nuevo.");
        } else {
          setSignInRequired(false);
          setSaveError(response.data?.error ?? "No se pudo guardar la reflexión. Inténtalo de nuevo.");
        }
        console.warn("[Mi muro] No se pudo guardar la reflexión", {
          status: response.status,
          error: response.data?.error,
          detail: response.message,
        });
      },
    }
  });

  const traceWriting = (stage: string) => {
    if (typeof __DEV__ !== "undefined" && __DEV__) {
      console.info("[reflection-wall-keyboard]", stage, {
        active: inputActive,
        expanded: expandedRef.current,
        quotaReached: freeLimitReached,
        nativeFocused: inputRef.current?.isFocused() ?? false,
        keyboardVisible: KeyboardController.isVisible(),
      });
    }
  };

  const requestInputFocus = () => {
    traceWriting("touch");
    if (freeLimitReached) {
      showPremiumGate(
        `Ya publicaste tus ${FREE_REFLECTIONS_LIMIT} entradas gratuitas. Con Premium puedes seguir sumando reflexiones a tu viaje interior.`,
      );
      return;
    }
    setInputTouched(true);
    writingTapPendingRef.current = true;
    if (inputActive) {
      focusInput();
      return;
    }
    if (onComposeRequested) {
      onComposeRequested();
      return;
    }
    focusInput();
  };

  const isSubmitDisabled =
    !category
    || message.trim().length === 0
    || createMutation.isPending
    || authLoading
    || (!isPremium && freeQuotaLoading)
    || freeLimitReached;

  const saveMessage = () => {
    if (!category) return;
    if (freeLimitReached) {
      showPremiumGate(
        `Ya publicaste tus ${FREE_REFLECTIONS_LIMIT} entradas gratuitas. Con Premium puedes seguir sumando reflexiones a tu viaje interior.`,
      );
      return;
    }
    if (authLoading) return;
    if (!isSignedIn) {
      setSignInRequired(true);
      setSaveError("Inicia sesión para guardar tu reflexión. Tu texto sigue aquí.");
      return;
    }
    setSaveError(null);
    setSignInRequired(false);
    createMutation.mutate({ data: { category, message: message.trim() } });
  };

  const openWall = () => {
    router.push("/mi-espacio-interior");
  };

  const toggleCategory = (nextCategory: ReflectionCategory) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
    setCategory((current) => current === nextCategory ? null : nextCategory);
  };

  const focusInput = () => {
    writingTapPendingRef.current = false;
    traceWriting("activate");
    setInputTouched(true);
    setInputActive(true);
    setInputFocusVersion((value) => value + 1);
  };

  useLayoutEffect(() => {
    if (!inputActive || freeLimitReached) return;
    let frame = requestAnimationFrame(() => {
      frame = requestAnimationFrame(() => {
        const input = inputRef.current;
        if (!input || !expandedRef.current) return;
        traceWriting("focus-command");
        // focus() es un no-op si Android mantiene el foco después de ocultar el teclado.
        if (input.isFocused() && !KeyboardController.isVisible()) {
          KeyboardController.setFocusTo("current");
        } else {
          input.focus();
        }
      });
    });
    return () => cancelAnimationFrame(frame);
  }, [inputActive, inputFocusVersion, freeLimitReached]);

  useEffect(() => {
    if (typeof __DEV__ === "undefined" || !__DEV__ || !inputActive) return;
    const subscription = Keyboard.addListener("keyboardDidShow", () => {
      traceWriting("keyboard-shown");
    });
    return () => subscription.remove();
  }, [inputActive]);

  const updateContentHeight = (height: number) => {
    if (height <= 0 || height === contentHeightRef.current) return;
    contentHeightRef.current = height;
    if (expandedRef.current && !animatingRef.current) clipHeight.value = height;
  };

  const animateExpansion = (opening: boolean, followScroll = false) => {
    if (animatingRef.current || expandedRef.current === opening) return;
    animatingRef.current = true;
    expandedRef.current = opening;
    setExpanded(opening);
    sectionBorderOpacity.value = reduceMotion
      ? (opening ? 0.4 : closedBorderOpacity)
      : withTiming(opening ? 0.4 : closedBorderOpacity, {
          duration: PANEL_DURATION,
          easing: ReanimatedEasing.inOut(ReanimatedEasing.quad),
        });
    if (opening && followScroll) {
      onExpandStart?.();
    }
    if (reduceMotion) {
      if (!opening) {
        inputRef.current?.blur();
        setInputActive(false);
        setInputTouched(false);
      }
      reservedHeight.value = 0;
      clipHeight.value = opening ? contentHeightRef.current : 0;
      revealOpacity.setValue(opening ? 1 : 0);
      revealY.setValue(0);
      plusSpin.setValue(0);
      haloValues.forEach((value) => value.setValue(opening ? 0 : 1));
      animatingRef.current = false;
      if (opening && followScroll) {
        requestAnimationFrame(() => {
          if (expandedRef.current) onExpandComplete?.(contentHeightRef.current);
        });
      }
      if (opening && focusAfterExpandRef.current) {
        focusAfterExpandRef.current = false;
        focusInput();
      }
      return;
    }

    plusSpin.setValue(0);
    if (opening) {
      revealOpacity.setValue(0);
      revealY.setValue(-14);
    } else {
      revealY.setValue(0);
    }
    const spinDirection = opening ? -1 : 1;
    const panelTargetHeight = contentHeightRef.current;
    const blurAfterCollapse = () => {
      inputRef.current?.blur();
      setInputActive(false);
      setInputTouched(false);
    };
    let controlsFinished = false;
    let movementFinished = opening;
    const finishWhenSettled = () => {
      if (!controlsFinished || !movementFinished) return;
      animatingRef.current = false;
      clipHeight.value = opening ? contentHeightRef.current : 0;
      if (!opening) revealOpacity.setValue(0);
      plusSpin.setValue(0);
      if (queuedOpenRef.current && !opening) {
        queuedOpenRef.current = false;
        requestAnimationFrame(() => animateExpansion(true));
      } else if (opening && focusAfterExpandRef.current) {
        focusAfterExpandRef.current = false;
        focusInput();
      }
    };
    const finishScreenMovement = () => {
      movementFinished = true;
      finishWhenSettled();
    };
    // Mantiene el alto total mientras se pliega la ventana; al acabar,
    // se libera suavemente el espacio y recién entonces se mueve la pantalla.
    reservedHeight.value = opening ? 0 : panelTargetHeight;
    const animations = [
      ...(opening ? [
        Animated.timing(revealOpacity, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
        Animated.timing(revealY, {
          toValue: 0,
          duration: PANEL_DURATION,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ] : []),
      Animated.sequence(PLUS_ROTATION_STOPS.map((stop, index) =>
        Animated.timing(plusSpin, {
          toValue: spinDirection * stop.angle,
          duration: stop.duration,
          easing: index === 0 ? Easing.out(Easing.cubic) : Easing.inOut(Easing.cubic),
          useNativeDriver: true,
        }),
      )),
      ...haloValues.map((value) =>
        Animated.timing(value, {
          toValue: opening ? 0 : 1,
          duration: opening ? 300 : 420,
          useNativeDriver: true,
        }),
      ),
    ];

    const startControls = () => {
      Animated.parallel(animations).start(({ finished }) => {
        if (!finished) return;
        controlsFinished = true;
        finishWhenSettled();
      });
    };

    const focusAfterPanelOpening = () => {
      if (expandedRef.current && focusAfterExpandRef.current) {
        focusAfterExpandRef.current = false;
        focusInput();
      }
    };

    clipHeight.value = withTiming(opening ? panelTargetHeight : 0, {
      duration: PANEL_DURATION,
      easing: opening ? ReanimatedEasing.out(ReanimatedEasing.cubic) : ReanimatedEasing.inOut(ReanimatedEasing.quad),
    }, (finished) => {
      if (!finished) return;
      if (opening) runOnJS(focusAfterPanelOpening)();
      if (opening && followScroll && onExpandComplete) {
        runOnJS(onExpandComplete)(panelTargetHeight);
      }
      if (!opening) {
        reservedHeight.value = withTiming(0, {
          duration: SCREEN_SETTLE_DURATION,
          easing: ReanimatedEasing.inOut(ReanimatedEasing.quad),
        }, (settled) => {
          if (settled) runOnJS(finishScreenMovement)();
        });
        runOnJS(blurAfterCollapse)();
      }
    });
    // El + y los círculos reaccionan desde el toque, también al cerrar.
    startControls();
  };

  useEffect(() => {
    // En Perfil la expansión pertenece solo al botón +. Una solicitud de foco
    // antigua puede repetirse al actualizarse el cupo y reabrir el panel sola.
    if (focusRequest <= 0) return;
    if (profileVariant) {
      if (consumedProfileFocusRequestRef.current === focusRequest) return;
      consumedProfileFocusRequestRef.current = focusRequest;
      if (!expandedRef.current || !writingTapPendingRef.current) return;
    }
    if (freeLimitReached) return;
    focusAfterExpandRef.current = true;
    if (!expandedRef.current) {
      if (animatingRef.current) queuedOpenRef.current = true;
      else animateExpansion(true);
    } else {
      focusAfterExpandRef.current = false;
      focusInput();
    }
  }, [focusRequest, freeLimitReached, profileVariant]);

  // Absolute children start inside the native border. Extend the decorative
  // stroke by that inset, without changing the card's layout or content.
  const flatBorder = canonicalVerticalInsets && getThemeStyleId(theme.id) === "cloudy";
  const containerBottomInset = flatBorder
    ? styles.cloudyFlushBorder.paddingBottom
    : (profileVariant ? styles.profileWall : canonicalVerticalInsets ? styles.canonicalVerticalInsets : styles.container).paddingBottom + 1;
  const bottomGapExtra = COMPOSER_BOTTOM_GAP - containerBottomInset;
  const registerColor = theme.id === "natural" ? "#073B32"
    : getThemeStyleId(theme.id) === "cloudy" ? "#166494"
      : "#0B1438";
  const sectionBorderInset = canonicalVerticalInsets && !profileVariant && getThemeStyleId(theme.id) === "cloudy" ? 0 : -1;

  return (
    <>
    <View
      style={[styles.container, canonicalVerticalInsets && styles.canonicalVerticalInsets, canonicalVerticalInsets && getThemeStyleId(theme.id) === "cloudy" && styles.cloudyFlushBorder, profileVariant && styles.profileWall, sectionBackgroundColor !== undefined && { backgroundColor: sectionBackgroundColor }, { borderColor: "transparent" }]}
      onLayout={onCollapsedHeightChange ? (event) => {
        if (!expandedRef.current && !animatingRef.current && event.nativeEvent.layout.height > 0) {
          onCollapsedHeightChange(event.nativeEvent.layout.height);
        }
      } : undefined}
    >
      <Reanimated.View
        testID="reflection-section-border"
        pointerEvents="none"
        style={[
          StyleSheet.absoluteFill,
          { top: sectionBorderInset, right: sectionBorderInset, bottom: sectionBorderInset, left: sectionBorderInset },
          sectionBorderStyle,
        ]}
      >
      {canonicalVerticalInsets ? (
        <DiscoverSearchBorder
          borderRadius={profileVariant ? 16 : 24}
          borderWidth={profileVariant ? (expanded ? 1 : 2) : 2}
          brightness={REFLECTION_WALL_BORDER_BRIGHTNESS}
          colors={getThemeStyleId(theme.id) === "cloudy" ? CLOUDY_REFLECTION_WALL_BORDER_GRADIENT : REFLECTION_WALL_BORDER_GRADIENT}
          locations={REFLECTION_WALL_BORDER_LOCATIONS}
          start={REFLECTION_WALL_BORDER_START}
          end={REFLECTION_WALL_BORDER_END}
        />
      ) : (
        <View style={[StyleSheet.absoluteFill, styles.sectionBorder]} />
      )}
      </Reanimated.View>
      <View style={styles.header}>
        <View style={[styles.headerCopy, canonicalVerticalInsets && styles.canonicalHeaderCopy, profileVariant && styles.profileWallHeaderCopy]}>
          {sectionTitle ? (
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>{sectionTitle}</Text>
          ) : null}
          <Text style={[
            styles.headerTitle,
            canonicalVerticalInsets && styles.canonicalHeaderDescription,
            profileVariant && styles.profileWallDescription,
            { color: colors.foreground },
          ]}>¿Qué sientes compartir hoy?</Text>
        </View>
        <Pressable
          style={styles.infoButton}
          onPress={() => {
            writingTapPendingRef.current = false;
            if (profileVariant && expandedRef.current) {
              queuedOpenRef.current = false;
              focusAfterExpandRef.current = false;
            }
            animateExpansion(!expandedRef.current, true);
          }}
          accessibilityRole="button"
          accessibilityLabel={expanded ? "Contraer Mi muro expansivo" : "Expandir Mi muro expansivo"}
          accessibilityState={{ expanded }}
          testID="reflection-wall-toggle"
        >
          <ReflectionWallPlusIcon spin={plusSpin} haloValues={haloValues} expanded={expanded} />
        </Pressable>
      </View>
      <Reanimated.View
        style={[styles.expandClip, clipStyle]}
        pointerEvents={expanded ? "auto" : "none"}
        accessibilityElementsHidden={!expanded}
        importantForAccessibility={expanded ? "auto" : "no-hide-descendants"}
      >
        <View style={styles.expandBody}>
          <Animated.View style={{ opacity: revealOpacity, transform: [{ translateY: revealY }] }}>
      <MaskedView
        style={styles.categoriesMask}
        maskElement={(
          <LinearGradient
            colors={["#000000", "#000000", "transparent"]}
            locations={[0, 0.87, 1]}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={StyleSheet.absoluteFill}
          />
        )}
      >
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          keyboardShouldPersistTaps={
            inputActive || keepKeyboardOnCategories ? "always" : "never"
          }
          keyboardDismissMode={keepKeyboardOnCategories ? "none" : undefined}
          contentContainerStyle={styles.categoriesContent}
          style={styles.categoriesScroll}
        >
           {reflectionCategoryOptions.map((cat) => (
            <Pressable
              key={cat.id}
              testID={`category-${cat.id}`}
              accessibilityLabel={`Categoría ${cat.label}`}
              accessibilityRole="button"
              accessibilityState={{ selected: category === cat.id }}
              style={({ pressed }) => [
                styles.gridItem,
                pressed && styles.pressedCategory,
              ]}
              onPress={() => toggleCategory(cat.id as ReflectionCategory)}
            >
              <ReflectionCategoryTabFill selected={category === cat.id} color={cat.color} selectedOpacity={0.5} blurred={false} reduceMotion={Boolean(reduceMotion)} />
              {category === cat.id && (
                <ReflectionCategoryTabBorder color={cat.color} borderWidth={1} opacity={0.7} />
              )}
              <ReflectionCategoryTabLabel
                label={cat.label}
                selected={category === cat.id}
                textStyle={styles.gridLabel}
                uniformWeight
              />
            </Pressable>
          ))}
        </ScrollView>
      </MaskedView>
       {(isCatalogError || isCatalogEmpty) && (
         <Text style={[styles.catalogNotice, { color: colors.mutedForeground }]}>
           {isCatalogError
             ? "No se pudieron cargar las categorías nuevas. Mostrando las categorías guardadas; inténtalo de nuevo más tarde."
             : "No hay categorías activas disponibles en este momento."}
         </Text>
       )}

      <Pressable
        testID="reflection-writing-box"
        style={[styles.inputContainer, { backgroundColor: "rgba(0,0,0,0.2)" }, saveError && { borderColor: colors.destructive }]}
        onPress={requestInputFocus}
      >
        <TextInput
          testID="reflection-writing-input"
          placeholder={inputTouched ? undefined : "Escribe tu reflexión aquí"}
          placeholderTextColor="#D1D1D1"
          ref={inputRef}
          editable={!freeLimitReached}
          showSoftInputOnFocus={inputActive}
          onPressIn={requestInputFocus}
          onFocus={() => {
            traceWriting("native-focus");
          }}
          onBlur={() => {
            traceWriting("native-blur");
            setInputActive(false);
            setInputTouched(false);
            onInputBlur?.();
          }}
          style={[styles.input, { color: colors.foreground }]}
          multiline
          maxLength={300}
          value={message}
          onChangeText={(text) => {
            setMessage(text);
            if (!signInRequired) setSaveError(null);
          }}
          textAlignVertical="top"
        />
        <Text
          testID="reflection-character-count"
          pointerEvents="none"
          style={[styles.characterCounter, { color: colors.mutedForeground }]}
        >
          {message.length}/300
        </Text>
      </Pressable>
      {saveError && (
        <View>
          <Text style={[styles.errorText, { color: colors.destructive }]}>{saveError}</Text>
          {signInRequired && (
            <Pressable
              onPress={() => router.push("/(auth)/sign-in")}
              accessibilityRole="button"
              accessibilityLabel="Iniciar sesión para guardar la reflexión"
              style={{ alignSelf: "flex-start", paddingVertical: 8 }}
            >
              <Text style={{ color: accent, fontFamily: "Manrope", fontWeight: "700" }}>Iniciar sesión</Text>
            </Pressable>
          )}
        </View>
      )}
      {freeLimitReached && (
        <Text style={[styles.errorText, { color: colors.mutedForeground }]}>
          Ya publicaste tus {FREE_REFLECTIONS_LIMIT} entradas gratuitas. Puedes verlas y editarlas en tu muro.
        </Text>
      )}

      <View
        style={styles.actionRow}
        onLayout={(event) => {
          const { y, height } = event.nativeEvent.layout;
          updateContentHeight(styles.expandBody.paddingTop + y + height + bottomGapExtra);
        }}
      >
        <Pressable
          testID="open-reflection-wall"
          onPress={openWall}
          style={[styles.submitButton, styles.wallButton]}
          accessibilityRole="button"
          accessibilityLabel="Ver muro"
        >
          <Text style={[styles.submitText, { color: "#F9F9F9" }]}>VER MURO</Text>
          <Feather name="arrow-right" size={REFLECTION_ACTION_ICON_SIZE} color="#F9F9F9" />
        </Pressable>
        <Pressable
          testID="save-reflection"
          accessibilityLabel="Registrar"
          accessibilityRole="button"
          style={[
            styles.submitButton,
            { backgroundColor: "#F9F9F9" },
            { opacity: isSubmitDisabled ? 0.5 : 1 },
          ]}
          disabled={isSubmitDisabled}
          onPress={saveMessage}
        >
          <Feather name="message-circle" size={REFLECTION_ACTION_ICON_SIZE} color={registerColor} />
          <Text style={[styles.submitText, { color: registerColor }]}>
            {createMutation.isPending ? "Registrando..." : "REGISTRAR"}
          </Text>
        </Pressable>
      </View>
          </Animated.View>
        </View>
      </Reanimated.View>
    </View>
    <Reanimated.View pointerEvents="none" style={collapseSpacerStyle} />
    </>
  );
}

const styles = StyleSheet.create({
  sectionBorder: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "#FFFFFF",
  },
  container: {
    borderRadius: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backgroundColor: "rgba(0,0,0,0.16)",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    marginBottom: INNER_SPACE_CARD_BOTTOM_MARGIN,
    overflow: "hidden",
  },
  canonicalVerticalInsets: {
    paddingTop: 18,
    paddingBottom: 18,
    marginBottom: 0,
    borderColor: "transparent",
  },
  cloudyFlushBorder: {
    borderWidth: 0,
    // Replace the removed border's space so text and control positions stay unchanged.
    paddingHorizontal: 21,
    paddingTop: 19,
    paddingBottom: 19,
  },
  sectionTitle: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "800",
    marginBottom: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  canonicalHeaderCopy: {
    minHeight: 44,
    justifyContent: "space-between",
  },
  canonicalHeaderDescription: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "400",
  },
  profileWall: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "transparent",
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 18,
  },
  profileWallDescription: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 23,
    transform: [{ translateY: -2 }],
  },
  profileWallHeaderCopy: {
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
  },
  infoButton: {
    width: 43,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
  },
  expandClip: {
    overflow: "hidden",
    marginHorizontal: -20,
  },
  expandBody: {
    position: "absolute",
    top: 0,
    left: 20,
    right: 20,
    paddingTop: 0,
  },
  categoriesMask: {
    marginTop: 13,
    marginBottom: 20,
    marginHorizontal: -20,
  },
  categoriesScroll: {
    width: "100%",
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 12,
    alignItems: "center",
  },
  gridItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 10.5,
    paddingHorizontal: 14.5,
    borderRadius: 999,
    borderWidth: 0,
  },
  pressedCategory: {
    transform: [{ scale: 0.97 }],
  },
  gridLabel: {
    fontSize: 10,
    fontWeight: "500",
    textAlign: "left",
  },
  inputContainer: {
    borderRadius: 16,
    padding: 12,
    paddingTop: 16,
    // Reserva espacio para el contador sin superponerlo al texto.
    paddingBottom: 34,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  input: {
    minHeight: 93,
    fontSize: 15,
    lineHeight: 21,
    transform: [{ translateY: -5 }],
  },
  characterCounter: {
    position: "absolute",
    right: 12,
    bottom: 10,
    fontSize: 12,
    lineHeight: 16,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 12,
    textAlign: "center",
  },
  catalogNotice: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: -10,
    marginBottom: 10,
    textAlign: "center",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 0,
  },
  submitButton: {
    flex: 1,
    minHeight: 42,
    borderRadius: 20,
    flexDirection: "row",
    gap: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  wallButton: {
    borderWidth: 0,
    backgroundColor: "transparent",
    justifyContent: "flex-start",
    transform: [{ translateX: 35 }],
  },
  submitText: {
    fontSize: 11,
    fontWeight: "600",
  },
});