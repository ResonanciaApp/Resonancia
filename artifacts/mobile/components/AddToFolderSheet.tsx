import { Feather } from "@expo/vector-icons";
import { GoldGradient, GoldGradientFill } from "@/components/GoldGradient";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

import { useFoldersPlaylists } from "@/context/FoldersPlaylistsContext";
import { useColors } from "@/hooks/useColors";

type Props = {
  visible: boolean;
  sessionId: string;
  onClose: () => void;
};

type Step = "list" | "create";

export function AddToFolderSheet({ visible, sessionId, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { folders, createFolder, addToFolder, removeFromFolder, isInFolder } =
    useFoldersPlaylists();

  const [step, setStep] = useState<Step>("list");
  const [newName, setNewName] = useState("");

  const handleClose = () => {
    setStep("list");
    setNewName("");
    onClose();
  };

  const handleToggle = (folderId: string) => {
    if (isInFolder(folderId, sessionId)) {
      removeFromFolder(folderId, sessionId);
    } else {
      addToFolder(folderId, sessionId);
    }
  };

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    const folder = createFolder(name, sessionId);
    handleClose();
    router.push(`/carpeta/${folder.id}` as never);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={styles.backdrop} onPress={handleClose} />

        <View style={[styles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* ── Paso: Lista de carpetas ── */}
          {step === "list" && (
            <>
              <View style={styles.headerRow}>
                <Text style={[styles.title, { color: colors.foreground }]}>
                  Añadir a la carpeta
                </Text>
                <Pressable onPress={handleClose} style={styles.closeBtn}>
                  <Feather name="x" size={20} color={colors.mutedForeground} />
                </Pressable>
              </View>

              <ScrollView bounces={false} showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
                {folders.length === 0 && (
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                    Todavía no tenés ninguna carpeta
                  </Text>
                )}
                {folders.map((folder) => {
                  const inIt = isInFolder(folder.id, sessionId);
                  return (
                    <Pressable
                      key={folder.id}
                      onPress={() => handleToggle(folder.id)}
                      style={({ pressed }) => [styles.row, { opacity: pressed ? 0.7 : 1 }]}
                    >
                      <View style={[styles.folderIcon, { backgroundColor: "rgba(212,175,55,0.12)" }]}>
                        <Feather name="folder" size={18} color={colors.primary} />
                      </View>
                      <Text style={[styles.rowLabel, { color: colors.foreground }]} numberOfLines={1}>
                        {folder.name}
                      </Text>
                      <Text style={[styles.rowCount, { color: colors.mutedForeground }]}>
                        {folder.sessionIds.length}
                      </Text>
                      {inIt ? (
                        <Feather name="check-circle" size={20} color={colors.primary} />
                      ) : (
                        <Feather name="circle" size={20} color="rgba(244,218,213,0.25)" />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>

              {/* Nueva carpeta */}
              <Pressable
                onPress={() => setStep("create")}
                style={({ pressed }) => [
                  styles.newRow,
                  { borderTopColor: "rgba(61,14,22,0.40)", opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <GoldGradient style={styles.plusCircle}>
                  <Feather name="plus" size={14} color="#1B060F" />
                </GoldGradient>
                <Text style={[styles.newLabel, { color: colors.foreground }]}>
                  Nueva Carpeta
                </Text>
              </Pressable>
            </>
          )}

          {/* ── Paso: Crear carpeta ── */}
          {step === "create" && (
            <>
              <View style={styles.headerRow}>
                <Pressable onPress={() => setStep("list")} style={styles.backBtn}>
                  <Feather name="arrow-left" size={20} color={colors.foreground} />
                </Pressable>
                <Text style={[styles.title, { color: colors.foreground }]}>
                  Nombre de la carpeta
                </Text>
                <Pressable onPress={handleClose} style={styles.closeBtn}>
                  <Feather name="x" size={20} color={colors.mutedForeground} />
                </Pressable>
              </View>

              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="Ej: Para dormir, Para trabajar…"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, {
                  color: colors.foreground,
                  borderColor: "rgba(61,14,22,0.40)",
                  backgroundColor: "rgba(74,12,12,0.08)",
                }]}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleCreate}
                maxLength={40}
              />

              <Pressable
                onPress={handleCreate}
                disabled={!newName.trim()}
                style={({ pressed }) => [
                  styles.createBtn,
                  {
                    backgroundColor: newName.trim() ? undefined : "rgba(212,175,55,0.30)",
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                {newName.trim() ? <GoldGradientFill /> : null}
                <Text style={[styles.createBtnLabel, { color: "#1B060F" }]}>
                  Crear carpeta
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    backgroundColor: "#27070E",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(74,12,12,0.35)",
    alignSelf: "center",
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 8,
  },
  title: {
    flex: 1,
    fontSize: 17,
    fontWeight: "700",
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 20,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(61,14,22,0.40)",
  },
  folderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  rowCount: {
    fontSize: 13,
    marginRight: 4,
  },
  newRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    gap: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  plusCircle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  newLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  createBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    overflow: "hidden",
    alignItems: "center",
    marginBottom: 4,
  },
  createBtnLabel: {
    fontSize: 16,
    fontWeight: "700",
  },
});
