import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Animated, Easing } from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { Feather } from "@expo/vector-icons";
import { useReducedMotion } from "react-native-reanimated";
import { useColors } from "@/hooks/useColors";
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

const CATEGORY_PLACEHOLDERS: Partial<Record<ReflectionCategory, string>> = {
  gratitude: "Ej: Hoy siento gratitud por...",
  clarity: "Ej: Ahora veo con claridad que...",
  calm: "Ej: La calma llega a mi vida cuando...",
  purpose: "Ej: Me conecto con mi propósito cuando...",
  acceptance: "Ej: Cuando acepto lo que sucede, la vida...",
};
const DEFAULT_PLACEHOLDER = "Registra una reflexión...";
const REGISTER_BUTTON_BACKGROUND = "rgba(184, 117, 240, 0.2)";
const REGISTER_BUTTON_ENABLED_BACKGROUND = "rgba(184, 117, 240, 0.45)";
const EXPANSION_DURATION = 610;
const HALO_SIZES = [44, 34, 24] as const;
const HALO_COLORS = [
  "rgba(114, 207, 245, 0.18)",
  "rgba(125, 216, 250, 0.29)",
  "rgba(163, 231, 255, 0.39)",
] as const;

export function InnerSpaceCard({
  focusRequest = 0,
  keepKeyboardOnCategories = false,
  onComposeRequested,
  onInputBlur,
  onMessageSaved,
}: {
  focusRequest?: number;
  keepKeyboardOnCategories?: boolean;
  onComposeRequested?: () => void;
  onInputBlur?: () => void;
  onMessageSaved?: () => void;
}) {
  const colors = useColors();
  const { theme } = useSceneTheme();
  const accent = theme.accent ?? colors.accent;
  const [category, setCategory] = useState<ReflectionCategory | null>(null);
  const [message, setMessage] = useState("");
  const inputRef = useRef<TextInput>(null);
  const placeholderVisibility = useRef(new Animated.Value(1)).current;
  const outgoingPlaceholderOpacity = useRef(new Animated.Value(1)).current;
  const incomingPlaceholderOpacity = useRef(new Animated.Value(0)).current;
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState(DEFAULT_PLACEHOLDER);
  const [incomingPlaceholder, setIncomingPlaceholder] = useState<string | null>(null);
  const [inputActive, setInputActive] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const expandedRef = useRef(false);
  const animatingRef = useRef(false);
  const queuedOpenRef = useRef(false);
  const focusAfterExpandRef = useRef(false);
  const contentHeightRef = useRef(0);
  const reduceMotion = useReducedMotion();
  const heightAnim = useRef(new Animated.Value(0)).current;
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
  const selectedCategoryShadow = reflectionCategoryOptions.find((cat) => cat.id === "gratitude")?.color ?? "#F075B3";
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

  const settlePlaceholder = (placeholder: string) => {
    outgoingPlaceholderOpacity.stopAnimation();
    incomingPlaceholderOpacity.stopAnimation();
    outgoingPlaceholderOpacity.setValue(1);
    incomingPlaceholderOpacity.setValue(0);
    setDisplayedPlaceholder(placeholder);
    setIncomingPlaceholder(null);
  };

  const createMutation = useCreateMyReflection({
    mutation: {
      onSuccess: (created: Reflection) => {
        settlePlaceholder(DEFAULT_PLACEHOLDER);
        setMessage("");
        setCategory(null);
        inputRef.current?.blur();
        setInputActive(false);

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
      }
    }
  });

  const desiredPlaceholder = category
    ? CATEGORY_PLACEHOLDERS[category] ?? DEFAULT_PLACEHOLDER
    : DEFAULT_PLACEHOLDER;
  const messageIsEmpty = message.length === 0;

  useEffect(() => {
    placeholderVisibility.stopAnimation();
    Animated.timing(placeholderVisibility, {
      toValue: messageIsEmpty ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
    return () => placeholderVisibility.stopAnimation();
  }, [messageIsEmpty, placeholderVisibility]);

  useEffect(() => {
    if (displayedPlaceholder === desiredPlaceholder) return;

    outgoingPlaceholderOpacity.stopAnimation();
    incomingPlaceholderOpacity.stopAnimation();
    outgoingPlaceholderOpacity.setValue(1);
    incomingPlaceholderOpacity.setValue(0);
    setIncomingPlaceholder(desiredPlaceholder);

    const frame = requestAnimationFrame(() => {
      Animated.parallel([
        Animated.timing(outgoingPlaceholderOpacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(incomingPlaceholderOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(({ finished }) => {
        if (!finished) return;
        setDisplayedPlaceholder(desiredPlaceholder);
        setIncomingPlaceholder(null);
      });
    });

    return () => {
      cancelAnimationFrame(frame);
      outgoingPlaceholderOpacity.stopAnimation();
      incomingPlaceholderOpacity.stopAnimation();
    };
  }, [
    desiredPlaceholder,
    displayedPlaceholder,
    incomingPlaceholderOpacity,
    outgoingPlaceholderOpacity,
  ]);

  useLayoutEffect(() => {
    if (incomingPlaceholder !== null) return;
    outgoingPlaceholderOpacity.setValue(1);
    incomingPlaceholderOpacity.setValue(0);
  }, [
    displayedPlaceholder,
    incomingPlaceholder,
    incomingPlaceholderOpacity,
    outgoingPlaceholderOpacity,
  ]);

  const requestInputFocus = () => {
    if (freeLimitReached) {
      showPremiumGate(
        `Ya publicaste tus ${FREE_REFLECTIONS_LIMIT} entradas gratuitas. Con Premium puedes seguir sumando reflexiones a tu viaje interior.`,
      );
      return;
    }
    if (inputActive) return;
    if (onComposeRequested) {
      onComposeRequested();
      return;
    }
    setInputActive(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const isSubmitDisabled =
    !category
    || message.trim().length === 0
    || createMutation.isPending
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
    settlePlaceholder(desiredPlaceholder);
    createMutation.mutate({ data: { category, message: message.trim() } });
  };

  const openWall = () => {
    router.push("/mi-espacio-interior");
  };

  const toggleCategory = (nextCategory: ReflectionCategory) => {
    void Haptics.selectionAsync().catch(() => {});
    setCategory((current) => current === nextCategory ? null : nextCategory);
  };

  const focusInput = () => {
    setInputActive(true);
    requestAnimationFrame(() => requestAnimationFrame(() => inputRef.current?.focus()));
  };

  const updateContentHeight = (height: number) => {
    if (height <= 0 || height === contentHeightRef.current) return;
    contentHeightRef.current = height;
    if (expandedRef.current && !animatingRef.current) heightAnim.setValue(height);
  };

  const animateExpansion = (opening: boolean) => {
    if (animatingRef.current || expandedRef.current === opening) return;
    animatingRef.current = true;
    expandedRef.current = opening;
    setExpanded(opening);
    if (!opening) {
      inputRef.current?.blur();
      setInputActive(false);
    }

    if (reduceMotion) {
      heightAnim.setValue(opening ? contentHeightRef.current : 0);
      revealOpacity.setValue(opening ? 1 : 0);
      revealY.setValue(opening ? 0 : -14);
      plusSpin.setValue(0);
      haloValues.forEach((value) => value.setValue(opening ? 0 : 1));
      animatingRef.current = false;
      if (opening && focusAfterExpandRef.current) {
        focusAfterExpandRef.current = false;
        focusInput();
      }
      return;
    }

    plusSpin.setValue(0);
    if (opening) revealY.setValue(-14);

    const animations = [
      Animated.timing(heightAnim, {
        toValue: opening ? contentHeightRef.current : 0,
        duration: EXPANSION_DURATION,
        useNativeDriver: false,
      }),
      Animated.timing(revealOpacity, {
        toValue: opening ? 1 : 0,
        duration: opening ? 380 : 250,
        useNativeDriver: true,
      }),
      opening
        ? Animated.sequence([
            Animated.timing(revealY, { toValue: 6, duration: 400, useNativeDriver: true }),
            Animated.timing(revealY, { toValue: -2, duration: 110, useNativeDriver: true }),
            Animated.timing(revealY, { toValue: 0, duration: 100, useNativeDriver: true }),
          ])
        : Animated.sequence([
            Animated.timing(revealY, { toValue: 6, duration: 100, useNativeDriver: true }),
            Animated.timing(revealY, { toValue: -14, duration: 510, useNativeDriver: true }),
          ]),
      Animated.sequence([
        // La + se repite visualmente cada 90°: 270° son tres ciclos perceptibles.
        Animated.timing(plusSpin, {
          toValue: opening ? -270 : 270,
          duration: 430,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.timing(plusSpin, {
          toValue: opening ? -285 : 285,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(plusSpin, {
          toValue: opening ? -266 : 266,
          duration: 60,
          useNativeDriver: true,
        }),
        Animated.timing(plusSpin, {
          toValue: opening ? -270 : 270,
          duration: 60,
          useNativeDriver: true,
        }),
      ]),
      ...haloValues.map((value, index) =>
        Animated.timing(value, {
          toValue: opening ? 0 : 1,
          duration: opening ? 300 : 240,
          delay: opening ? 0 : index * 100,
          useNativeDriver: true,
        }),
      ),
    ];

    Animated.parallel(animations).start(({ finished }) => {
      if (!finished) return;
      animatingRef.current = false;
      heightAnim.setValue(opening ? contentHeightRef.current : 0);
      plusSpin.setValue(0);
      if (queuedOpenRef.current && !opening) {
        queuedOpenRef.current = false;
        requestAnimationFrame(() => animateExpansion(true));
      } else if (opening && focusAfterExpandRef.current) {
        focusAfterExpandRef.current = false;
        focusInput();
      }
    });
  };

  useEffect(() => {
    if (focusRequest <= 0 || freeLimitReached) return;
    focusAfterExpandRef.current = true;
    if (!expandedRef.current) {
      if (animatingRef.current) queuedOpenRef.current = true;
      else animateExpansion(true);
    } else if (!animatingRef.current) {
      focusAfterExpandRef.current = false;
      focusInput();
    }
  }, [focusRequest, freeLimitReached]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerCopy}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Mi muro expansivo</Text>
          <Text style={[styles.headerDescription, { color: "#A8A8A8" }]}>
            Exprésate y compártelo con el mundo
          </Text>
        </View>
        <Pressable
          style={styles.infoButton}
          onPress={() => animateExpansion(!expandedRef.current)}
          accessibilityRole="button"
          accessibilityLabel={expanded ? "Contraer Mi muro expansivo" : "Expandir Mi muro expansivo"}
          accessibilityState={{ expanded }}
          testID="reflection-wall-toggle"
        >
          {haloValues.map((value, index) => (
            <Animated.View
              key={HALO_SIZES[index]}
              pointerEvents="none"
              style={[
                styles.halo,
                {
                  width: HALO_SIZES[index],
                  height: HALO_SIZES[index],
                  borderRadius: HALO_SIZES[index] / 2,
                  top: (43 - HALO_SIZES[index]) / 2,
                  left: (43 - HALO_SIZES[index]) / 2,
                  backgroundColor: HALO_COLORS[index],
                  opacity: value,
                  transform: [{ scale: value.interpolate({ inputRange: [0, 1], outputRange: [0.1, 1] }) }],
                },
              ]}
            />
          ))}
          <Animated.View
            collapsable={false}
            style={[
              styles.plusGlyph,
              { transform: [{ rotate: plusSpin.interpolate({
                inputRange: [-300, 0, 300],
                outputRange: ["-300deg", "0deg", "300deg"],
              }) }] },
            ]}
          >
            <Feather name="plus" size={23} color="#E5F7FF" />
          </Animated.View>
        </Pressable>
      </View>
      <Animated.View
        style={[styles.expandClip, { height: heightAnim }]}
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
              style={({ pressed }) => [
                styles.gridItem,
                 category === cat.id && styles.selectedGridItem,
                 category === cat.id && { shadowColor: selectedCategoryShadow },
                pressed && styles.pressedCategory,
              ]}
              onPress={() => toggleCategory(cat.id as ReflectionCategory)}
            >
              <Text style={[styles.gridLabel, { color: category === cat.id ? colors.foreground : "#E0E0E0" }]}>{cat.label}</Text>
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
        style={[styles.inputContainer, { backgroundColor: "rgba(0,0,0,0.2)" }, createMutation.isError && { borderColor: colors.destructive }]}
        onPress={requestInputFocus}
      >
        <Animated.View
          pointerEvents="none"
          style={[
            styles.inputPlaceholder,
            { opacity: placeholderVisibility },
          ]}
        >
          <Animated.Text
            style={[
              styles.inputPlaceholderText,
              {
                color: colors.mutedForeground,
                opacity: outgoingPlaceholderOpacity,
              },
            ]}
          >
            {displayedPlaceholder}
          </Animated.Text>
          {incomingPlaceholder ? (
            <Animated.Text
              style={[
                styles.inputPlaceholderText,
                styles.incomingPlaceholder,
                {
                  color: colors.mutedForeground,
                  opacity: incomingPlaceholderOpacity,
                },
              ]}
            >
              {incomingPlaceholder}
            </Animated.Text>
          ) : null}
        </Animated.View>
        <TextInput
          ref={inputRef}
          editable={inputActive}
          pointerEvents={inputActive ? "auto" : "none"}
          onBlur={() => {
            setInputActive(false);
            onInputBlur?.();
          }}
          style={[styles.input, { color: colors.foreground }]}
          multiline
          maxLength={300}
          value={message}
          onChangeText={setMessage}
          textAlignVertical="top"
        />
      </Pressable>
      {createMutation.isError && (
        <Text style={[styles.errorText, { color: colors.destructive }]}>Ocurrió un error al guardar. Inténtalo de nuevo.</Text>
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
          updateContentHeight(18 + y + height);
        }}
      >
        <Pressable
          testID="open-reflection-wall"
          onPress={openWall}
          style={[styles.submitButton, styles.wallButton, { borderColor: REGISTER_BUTTON_BACKGROUND }]}
          accessibilityRole="button"
          accessibilityLabel="Ver muro"
        >
          <Text style={[styles.submitText, { color: "#F9F9F9" }]}>VER MURO</Text>
        </Pressable>
        <Pressable
          testID="save-reflection"
          accessibilityLabel="Registrar"
          accessibilityRole="button"
          style={[
            styles.submitButton,
            { backgroundColor: isSubmitDisabled ? REGISTER_BUTTON_BACKGROUND : REGISTER_BUTTON_ENABLED_BACKGROUND },
            isSubmitDisabled && { opacity: 0.5 },
          ]}
          disabled={isSubmitDisabled}
          onPress={saveMessage}
        >
          <Text style={[styles.submitText, { color: isSubmitDisabled ? "#D4B8F4" : "#F9F9F9" }]}>
            {createMutation.isPending ? "Registrando..." : "REGISTRAR"}
          </Text>
        </Pressable>
      </View>
          </Animated.View>
        </View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.28)",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
    marginBottom: 32,
    overflow: "hidden",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  headerCopy: {
    flex: 1,
    minWidth: 0,
  },
  headerTitle: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
  },
  headerDescription: {
    fontFamily: "Manrope",
    fontSize: 12,
    lineHeight: 17,
    marginTop: 3,
  },
  infoButton: {
    width: 43,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
  },
  halo: {
    position: "absolute",
  },
  plusGlyph: {
    width: 26,
    height: 26,
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
    paddingTop: 18,
  },
  categoriesMask: {
    marginBottom: 20,
    marginHorizontal: -20,
  },
  categoriesScroll: {
    width: "100%",
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 8,
    alignItems: "center",
  },
  gridItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  selectedGridItem: {
    borderColor: "rgba(255,255,255,0.45)",
    backgroundColor: "rgba(0,0,0,0.28)",
    shadowOpacity: 0.22,
    shadowRadius: 8,
  },
  pressedCategory: {
    transform: [{ scale: 0.97 }],
  },
  gridLabel: {
    fontSize: 11,
    fontWeight: "500",
    textAlign: "left",
  },
  inputContainer: {
    borderRadius: 16,
    padding: 12,
    paddingTop: 16,
    // Reserva el espacio del contador retirado; el borde baja 12 px menos
    // y la fila de acciones conserva su posición anterior.
    paddingBottom: 34,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  input: {
    minHeight: 53,
    fontSize: 13,
    lineHeight: 21,
    transform: [{ translateY: -5 }],
  },
  inputPlaceholder: {
    position: "absolute",
    top: 19,
    left: 12,
    right: 12,
  },
  inputPlaceholderText: {
    fontSize: 13,
    lineHeight: 21,
  },
  incomingPlaceholder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
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
  },
  submitButton: {
    flex: 1,
    minHeight: 48,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  wallButton: {
    borderWidth: 1,
    backgroundColor: "transparent",
  },
  submitText: {
    fontSize: 11,
    fontWeight: "600",
  },
});
