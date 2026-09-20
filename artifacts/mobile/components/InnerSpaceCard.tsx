import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Animated } from "react-native";
import { Feather } from "@expo/vector-icons";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useSceneTheme } from "@/context/SceneThemeContext";
import {
  useCreateMyReflection,
  type Reflection,
  type ReflectionCategory,
  type ReflectionsPage,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { REFLECTION_CATEGORY_OPTIONS, CategoryIcon } from "@/constants/reflectionCategories";
import { useReducedMotion } from "react-native-reanimated";
import { useAuth } from "@/context/AuthContext";

const CATEGORY_PLACEHOLDERS: Partial<Record<ReflectionCategory, string>> = {
  gratitude: "Ej: Hoy siento gratitud por...",
  clarity: "Ej: Ahora veo con claridad que...",
  calm: "Ej: La calma llega a mi vida cuando...",
  purpose: "Ej: Me conecto con mi propósito cuando...",
  acceptance: "Ej: Cuando acepto lo que sucede, la vida...",
};
const DEFAULT_PLACEHOLDER = "Registra una reflexión...";

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
  const categoryScales = useRef(
    Object.fromEntries(
      REFLECTION_CATEGORY_OPTIONS.map((item) => [item.id, new Animated.Value(1)]),
    ) as Record<ReflectionCategory, Animated.Value>,
  ).current;
  const qc = useQueryClient();
  const { clerkUserId } = useAuth();
  const reducedMotion = useReducedMotion();

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

  useEffect(() => {
    return () => {
      Object.values(categoryScales).forEach((scale) => scale.stopAnimation());
    }
  }, [categoryScales]);

  useEffect(() => {
    if (focusRequest <= 0) return;
    setInputActive(true);
    const frame = requestAnimationFrame(() => {
      const focusFrame = requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(focusFrame);
    });
    return () => cancelAnimationFrame(frame);
  }, [focusRequest]);

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
    if (inputActive) return;
    if (onComposeRequested) {
      onComposeRequested();
      return;
    }
    setInputActive(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };

  const isSubmitDisabled = !category || message.trim().length === 0 || createMutation.isPending;
  const wallLinkColor = "#F9F9F9";

  const saveMessage = () => {
    if (!category) return;
    settlePlaceholder(desiredPlaceholder);
    createMutation.mutate({ data: { category, message: message.trim() } });
  };

  const openWall = () => {
    router.push("/mi-espacio-interior");
  };

  const toggleCategory = (nextCategory: ReflectionCategory) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const scale = categoryScales[nextCategory];
    scale.setValue(1);
    if (!reducedMotion) {
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.1,
          duration: 120,
          useNativeDriver: true,
        }),
        Animated.spring(scale, {
          toValue: 1,
          friction: 3,
          tension: 140,
          useNativeDriver: true,
        }),
      ]).start();
    }
    setCategory((current) => current === nextCategory ? null : nextCategory);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Mi viaje interior</Text>
        <Pressable
          onPress={openWall}
          style={styles.wallHitArea}
          accessibilityRole="button"
          accessibilityLabel="Abrir Muro expansivo"
        >
          <View style={styles.historyAction}>
            <Text style={[styles.historyLinkText, { color: wallLinkColor }]}>Ver muro</Text>
            <Feather
              name="chevron-right"
              size={16}
              color={wallLinkColor}
              style={styles.historyChevron}
            />
          </View>
        </Pressable>
      </View>

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
          keyboardShouldPersistTaps={keepKeyboardOnCategories ? "always" : "never"}
          keyboardDismissMode={keepKeyboardOnCategories ? "none" : undefined}
          contentContainerStyle={styles.categoriesContent}
          style={styles.categoriesScroll}
        >
          {REFLECTION_CATEGORY_OPTIONS.map((cat) => (
            <Pressable
              key={cat.id}
              testID={`category-${cat.id}`}
              accessibilityLabel={`Categoría ${cat.label}`}
              accessibilityRole="button"
              style={({ pressed }) => [
                styles.gridItem,
                category === cat.id && {
                  borderColor: "rgba(255,255,255,0.45)",
                  backgroundColor: "rgba(255,255,255,0.08)",
                  shadowColor: cat.color,
                  shadowOpacity: 0.22,
                  shadowRadius: 8,
                },
                pressed && styles.pressedCategory,
              ]}
              onPress={() => toggleCategory(cat.id as ReflectionCategory)}
            >
              <Animated.View style={{ transform: [{ scale: categoryScales[cat.id] }] }}>
                <CategoryIcon
                  category={cat.id as ReflectionCategory}
                  size={18}
                  active={category === cat.id}
                  neutralWhenInactive
                  inactiveColor="#E0E0E0"
                />
              </Animated.View>
              <Text style={[styles.gridLabel, { color: category === cat.id ? colors.foreground : "#E0E0E0" }]}>{cat.label}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </MaskedView>

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
        <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{message.length}/300</Text>
      </Pressable>
      {createMutation.isError && (
        <Text style={[styles.errorText, { color: colors.destructive }]}>Ocurrió un error al guardar. Inténtalo de nuevo.</Text>
      )}

      <Pressable
        testID="save-reflection"
        accessibilityLabel="Guardar mensaje"
        accessibilityRole="button"
        style={[styles.submitButton, isSubmitDisabled && { opacity: 0.5 }, { backgroundColor: "rgba(184, 117, 240, 0.2)" }]}
        disabled={isSubmitDisabled}
        onPress={saveMessage}
      >
        <Text
          style={[
            styles.submitText,
            { color: isSubmitDisabled ? "#D4B8F4" : "#F9F9F9" },
          ]}
        >
          {createMutation.isPending ? "Guardando..." : "Guardar mensaje"}
        </Text>
      </Pressable>

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
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "left",
  },
  wallHitArea: {
    minHeight: 44,
    marginVertical: -12,
    alignItems: "flex-end",
    justifyContent: "center",
    paddingLeft: 16,
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
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  input: {
    minHeight: 80,
    fontSize: 15,
    lineHeight: 21,
    transform: [{ translateY: -3 }],
  },
  inputPlaceholder: {
    position: "absolute",
    top: 16,
    left: 12,
    right: 12,
  },
  inputPlaceholderText: {
    fontSize: 14,
    lineHeight: 21,
  },
  incomingPlaceholder: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  charCount: {
    fontSize: 11,
    textAlign: "right",
    marginTop: 8,
  },
  errorText: {
    fontSize: 12,
    marginBottom: 12,
    textAlign: "center",
  },
  submitButton: {
    borderRadius: 20,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitText: {
    fontSize: 15,
    fontWeight: "600",
  },
  historyAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    transform: [{ translateY: 2 }],
  },
  historyChevron: {
    transform: [{ translateY: 1 }],
  },
  historyLinkText: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "400",
  },
});
