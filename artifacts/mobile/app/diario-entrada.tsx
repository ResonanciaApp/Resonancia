import { Feather } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { SacredBackground } from "@/components/SacredBackground";
import { usePremium } from "@/context/PremiumContext";
import { useDiario } from "@/hooks/useDiario";
import { useColors } from "@/hooks/useColors";
import { FREE_DIARIO_LIMIT, showPremiumGate } from "@/lib/premiumGate";

const MAX_CHARS = 5000;

export default function DiarioEntradaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 20 : insets.top;
  const bottomPad = Platform.OS === "web" ? 20 : insets.bottom;

  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const { entries, saveEntry, updateEntry, deleteEntry } = useDiario("reflexiones");
  const { isPremium } = usePremium();

  const [text, setText] = useState("");
  const initializedRef = useRef(false);

  // Cargar el texto de la entrada existente una sola vez.
  useEffect(() => {
    if (!isEditing || initializedRef.current) return;
    const existing = entries.find((e) => e.id === id);
    if (existing) {
      setText(existing.text);
      initializedRef.current = true;
    }
  }, [isEditing, id, entries]);

  const canSave = text.trim().length > 0;

  // En modo edición se guarda automáticamente al cerrar (no hay botón "Guardar").
  const handleClose = async () => {
    if (isEditing && id && canSave) {
      await updateEntry(id, text);
    }
    router.back();
  };

  const handleSave = async () => {
    if (!canSave) return;
    if (!isPremium && entries.length >= FREE_DIARIO_LIMIT) {
      showPremiumGate(
        `El diario gratuito permite hasta ${FREE_DIARIO_LIMIT} entradas. Hazte Premium para escribir sin límite.`,
      );
      return;
    }
    await saveEntry(text);
    router.back();
  };

  const handleDelete = () => {
    if (!isEditing || !id) return;
    Alert.alert("Eliminar entrada", "¿Eliminar esta entrada de tu diario?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: async () => {
          await deleteEntry(id);
          router.back();
        },
      },
    ]);
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar barStyle="light-content" />
      <SacredBackground />

      {/* Header */}
      <View style={[styles.header, { paddingTop: topPad + 8 }]}>
        <Pressable onPress={handleClose} hitSlop={10} style={styles.headerSide}>
          <Feather name="x" size={24} color={colors.foreground} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {isEditing ? "Editar entrada" : "Nueva entrada"}
        </Text>

        <View style={[styles.headerSide, styles.headerRight]}>
          {isEditing ? (
            <Pressable onPress={handleDelete} hitSlop={10} style={styles.trashBtn}>
              <Feather name="trash-2" size={20} color={colors.foreground} />
            </Pressable>
          ) : (
            <Pressable onPress={handleSave} hitSlop={10} disabled={!canSave}>
              <Text
                style={[
                  styles.saveText,
                  { color: canSave ? colors.primary : colors.mutedForeground },
                ]}
              >
                Guardar
              </Text>
            </Pressable>
          )}
        </View>
      </View>

      {/* Cuerpo */}
      <TextInput
        value={text}
        onChangeText={(t) => setText(t.slice(0, MAX_CHARS))}
        placeholder="Escribe aquí…"
        placeholderTextColor="rgba(237,225,211,0.4)"
        multiline
        autoFocus
        style={[styles.input, { color: colors.foreground, paddingBottom: bottomPad + 16 }]}
        textAlignVertical="top"
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  headerSide: { minWidth: 64 },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 16,
  },
  trashBtn: { padding: 2 },
  headerTitle: { fontSize: 16, fontWeight: "700", letterSpacing: 0.2 },
  saveText: { fontSize: 15, fontWeight: "700", textAlign: "right" },
  input: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    fontSize: 17,
    lineHeight: 26,
  },
});
