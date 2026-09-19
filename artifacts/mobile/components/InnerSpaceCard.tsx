import React, { useState, useRef, useEffect } from "react";
import { View, Text, TextInput, Pressable, ScrollView, StyleSheet, Animated, Easing } from "react-native";
import { MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { useCreateMyReflection, type ReflectionCategory } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import { REFLECTION_CATEGORIES, CategoryIcon } from "@/constants/reflectionCategories";
import { useReducedMotion } from "react-native-reanimated";

export function InnerSpaceCard() {
  const colors = useColors();
  const [category, setCategory] = useState<ReflectionCategory | null>(null);
  const [message, setMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const qc = useQueryClient();
  const reducedMotion = useReducedMotion();

  const createMutation = useCreateMyReflection({
    mutation: {
      onSuccess: () => {
        setMessage("");
        setCategory(null);
        qc.invalidateQueries({ predicate: (query) => query.queryKey[0] === '/api/me/reflections' });
        showToast();
      }
    }
  });

  useEffect(() => {
    return () => {
      toastAnim.stopAnimation();
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    }
  }, [toastAnim]);

  const showToast = () => {
    setToastVisible(true);
    toastAnim.stopAnimation();
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    if (reducedMotion) {
      toastAnim.setValue(1);
      toastTimerRef.current = setTimeout(() => {
        setToastVisible(false);
        toastTimerRef.current = null;
      }, 4000);
    } else {
      toastAnim.setValue(0);
      Animated.sequence([
        Animated.timing(toastAnim, { toValue: 1, duration: 300, easing: Easing.out(Easing.ease), useNativeDriver: true }),
        Animated.delay(4000),
        Animated.timing(toastAnim, { toValue: 0, duration: 300, easing: Easing.in(Easing.ease), useNativeDriver: true }),
      ]).start(({ finished }) => {
        if (finished) {
          setToastVisible(false);
        }
      });
    }
  };

  const closeToast = () => {
    toastAnim.stopAnimation();
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
      toastTimerRef.current = null;
    }
    setToastVisible(false);
  };

  const isSubmitDisabled = !category || message.trim().length === 0 || createMutation.isPending;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.foreground }]}>Un momento para ti</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesContent}
        style={styles.categoriesScroll}
      >
        {(Object.values(REFLECTION_CATEGORIES)).map((cat) => (
          <Pressable
            key={cat.id}
            testID={`category-${cat.id}`}
            accessibilityLabel={`Categoría ${cat.label}`}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.gridItem,
              category === cat.id && {
                shadowColor: cat.color,
                shadowOpacity: 0.22,
                shadowRadius: 8,
              },
              pressed && styles.pressedCategory,
            ]}
            onPress={() => setCategory(cat.id as ReflectionCategory)}
          >
            <CategoryIcon
              category={cat.id as ReflectionCategory}
              size={18}
              active={category === cat.id}
              neutralWhenInactive
            />
            <Text style={[styles.gridLabel, { color: category === cat.id ? colors.foreground : colors.mutedForeground }]}>{cat.label}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={[styles.inputContainer, { backgroundColor: "rgba(0,0,0,0.2)" }, createMutation.isError && { borderColor: colors.destructive }]}>
        <TextInput
          style={[styles.input, { color: colors.foreground }]}
          placeholder="Escribe tu mensaje aquí..."
          placeholderTextColor={colors.mutedForeground}
          multiline
          maxLength={300}
          value={message}
          onChangeText={setMessage}
          textAlignVertical="top"
        />
        <Text style={[styles.charCount, { color: colors.mutedForeground }]}>{message.length}/300</Text>
      </View>
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

      <Pressable testID="history-link" accessibilityRole="button" accessibilityLabel="Ver mi espacio interior" onPress={() => router.push("/mi-espacio-interior")} style={styles.historyLinkContainer}>
        <View style={styles.historyAction}>
          <Text style={[styles.historyLinkText, { color: colors.primary }]}>Ver mi espacio interior</Text>
          <Feather name="arrow-right" size={14} color={colors.primary} />
        </View>
      </Pressable>

      {toastVisible && (
        <Animated.View style={[styles.toast, { opacity: toastAnim, transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }]}>
          <View style={styles.toastIcon}>
            <MaterialCommunityIcons name="check" size={18} color="#fff" />
          </View>
          <View style={styles.toastContent}>
            <Text style={styles.toastTitle}>Mensaje registrado</Text>
            <Text style={styles.toastMessage}>Tu reflexión ha sido guardada en tu espacio interior.</Text>
          </View>
          <Pressable testID="close-toast" accessibilityLabel="Cerrar mensaje" onPress={closeToast} style={styles.toastClose}>
            <Feather name="x" size={18} color="#AAB9BE" />
          </Pressable>
        </Animated.View>
      )}
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
    alignItems: "center",
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
  },
  categoriesScroll: {
    marginBottom: 20,
    marginHorizontal: -20,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 10,
  },
  gridItem: {
    width: 92,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 16,
  },
  pressedCategory: {
    transform: [{ scale: 0.97 }],
  },
  gridLabel: {
    fontSize: 12,
    marginTop: 8,
    fontWeight: "500",
  },
  inputContainer: {
    borderRadius: 16,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  input: {
    minHeight: 80,
    fontSize: 15,
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
  historyLinkText: {
    fontSize: 13,
    fontWeight: "500",
  },
  toast: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: "#1E2336",
    borderRadius: 16,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  toastIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#5FCA81",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  toastContent: {
    flex: 1,
  },
  toastTitle: {
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  toastMessage: {
    color: "#AAB9BE",
    fontSize: 13,
  },
  toastClose: {
    padding: 4,
  },
});
