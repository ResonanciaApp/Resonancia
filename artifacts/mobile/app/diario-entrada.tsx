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
import { useDiario } from "@/hooks/useDiario";
import { useColors } from "@/hooks/useColors";

const MAX_CHARS = 5000;

export default function DiarioEntradaScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = Platform.OS === "web" ? 20 : insets.top;
  const bottomPad = Platform.OS === "web" ? 20 : insets.bottom;

  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;
  const { entries, saveEntry, updateEntry, deleteEntry } = useDiario("reflexiones");

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

  const handleSave = async () => {
    if (!canSave) return;
    if (isEditing && id) {
      await updateEntry(id, text);
    } else {
      await saveEntry(text);
    }
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
        <Pressable onPress={() => router.back()} hitSlop={10} style={styles.headerSide}>
          <Feather name="x" size={24} color={colors.foreground} />
        </Pressable>

        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          {isEditing ? "Editar entrada" : "Nueva entrada"}
        </Text>

        <Pressable onPress={handleSave} hitSlop={10} disabled={!canSave} style={styles.headerSide}>
          <Text
            style={[
              styles.saveText,
              { color: canSave ? colors.primary : colors.mutedForeground },
            ]}
          >
            Guardar
          </Text>
        </Pressable>
      </View>

      {/* Cuerpo */}
      <TextInput
        value={text}
        onChangeText={(t) => setText(t.slice(0, MAX_CHARS))}
        placeholder="Escribe aquí…"
        placeholderTextColor="rgba(237,225,211,0.4)"
        multiline
        autoFocus
        style={[styles.input, { color: colors.foreground }]}
        textAlignVertical="top"
      />

      {/* Eliminar (solo edición) */}
      {isEditing && (
        <View style={[styles.footer, { paddingBottom: bottomPad + 10 }]}>
          <Pressable onPress={handleDelete} hitSlop={8} style={styles.deleteBtn}>
            <Feather name="trash-2" size={15} color={colors.mutedForeground} />
            <Text style={[styles.deleteText, { color: colors.mutedForeground }]}>
              Eliminar entrada
            </Text>
          </Pressable>
        </View>
      )}
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
  headerTitle: { fontSize: 16, fontWeight: "700", letterSpacing: 0.2 },
  saveText: { fontSize: 15, fontWeight: "700", textAlign: "right" },
  input: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
    fontSize: 17,
    lineHeight: 26,
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "center",
    paddingVertical: 6,
  },
  deleteText: { fontSize: 13, fontWeight: "600" },
});
