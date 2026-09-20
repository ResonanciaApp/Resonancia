import React, { useState, useRef, useEffect, useLayoutEffect } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Animated } from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useCreateMyReflection, type ReflectionCategory } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { REFLECTION_CATEGORY_OPTIONS, CategoryIcon } from "@/constants/reflectionCategories";
import { useReducedMotion } from "react-native-reanimated";

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
  onComposeRequested,
  onMessageSaved,
}: {
  focusRequest?: number;
  onComposeRequested?: () => void;
  onMessageSaved?: () => void;
}) {
  const colors = useColors();
  const [category, setCategory] = useState<ReflectionCategory | null>(null);
  const [message, setMessage] = useState("");
  const [wallLinkHighlighted, setWallLinkHighlighted] = useState(false);
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
  const reducedMotion = useReducedMotion();

  const createMutation = useCreateMyReflection({
    mutation: {
      onSuccess: () => {
        setMessage("");
        setCategory(null);
        inputRef.current?.blur();
        setInputActive(false);
        setWallLinkHighlighted(true);
        qc.invalidateQueries({ predicate: (query) => query.queryKey[0] === '/api/me/reflections' });
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
  const wallLinkColor = wallLinkHighlighted ? "#F9F9F9" : colors.primary;

  const openWall = () => {
    setWallLinkHighlighted(false);
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
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
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
          onBlur={() => setInputActive(false)}
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
        onPress={() => createMutation.mutate({ data: { category: category!, message: message.trim() } })}
      >
        <Text style={[styles.submitText, { color: "#D4B8F4" }]}>{createMutation.isPending ? "Guardando..." : "Guardar mensaje"}</Text>
      </Pressable>

      <Pressable testID="history-link" accessibilityRole="button" accessibilityLabel="Ver muro" onPress={openWall} style={styles.historyLinkContainer}>
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
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.28)",
    padding: 20,
    marginBottom: 24,
    overflow: "hidden",
  },
  header: {
    alignItems: "flex-start",
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "left",
  },
  categoriesScroll: {
    marginBottom: 20,
    marginHorizontal: -20,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 5,
    alignItems: "center",
  },
  gridItem: {
    width: 92,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 15,
    paddingHorizontal: 4,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  pressedCategory: {
    transform: [{ scale: 0.97 }],
  },
  gridLabel: {
    width: "100%",
    fontSize: 12,
    marginTop: 3,
    fontWeight: "500",
    textAlign: "center",
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
    transform: [{ translateY: -3 }],
  },
  inputPlaceholder: {
    position: "absolute",
    top: 16,
    left: 12,
    right: 12,
  },
  inputPlaceholderText: {
    fontSize: 15,
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
    marginBottom: 20,
  },
  submitText: {
    fontSize: 15,
    fontWeight: "600",
  },
  historyLinkContainer: {
    alignItems: "center",
  },
  historyAction: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  historyChevron: {
    transform: [{ translateY: 1 }],
  },
  historyLinkText: {
    fontSize: 13,
    fontWeight: "500",
  },
});
