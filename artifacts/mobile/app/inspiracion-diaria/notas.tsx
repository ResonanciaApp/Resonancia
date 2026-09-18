import React from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text } from "react-native";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { InspirationNotes } from "@/components/InspirationNotes";

export default function InspirationNotesIndex() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const colors = useColors();
  return <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ padding: 24, paddingTop: insets.top + 16, paddingBottom: insets.bottom + 40 }}>
      <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace("/inspiracion-diaria")} style={{ paddingVertical: 12 }}><Text style={{ color: colors.foreground }}>‹ Volver</Text></Pressable>
      <InspirationNotes />
    </ScrollView>
  </KeyboardAvoidingView>;
}