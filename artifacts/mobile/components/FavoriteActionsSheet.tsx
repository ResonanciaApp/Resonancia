import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  Alert,
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

import { useFoldersPlaylists } from "@/context/FoldersPlaylistsContext";
import { usePlayer } from "@/context/PlayerContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { isIndigoThemeId } from "@/config/scene-themes";
import { SESSIONS } from "@/data/sessions";
import { useColors } from "@/hooks/useColors";
import { GoldGradient, GoldGradientFill } from "@/components/GoldGradient";

const GOLD = "#F9F9F9";

type Props = {
  itemId: string | null;
  itemKind: "session" | "folder" | null;
  visible: boolean;
  onClose: () => void;
};

type Step = "main" | "folders" | "create" | "rename";

type Colors = ReturnType<typeof import("@/hooks/useColors").useColors>;

function ActionRow({
  icon,
  label,
  iconColor,
  onPress,
  last,
  colors,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  iconColor?: string;
  onPress: () => void;
  last?: boolean;
  colors: Colors;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.actionRow,
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Feather name={icon} size={20} color={iconColor ?? colors.foreground} style={styles.actionIcon} />
      <Text style={[styles.actionLabel, { color: iconColor ?? colors.foreground }]}>{label}</Text>
      <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.25)" />
    </Pressable>
  );
}

export function FavoriteActionsSheet({ itemId, itemKind, visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { theme, activeSceneId } = useSceneTheme();
  const sheetSolid =
    activeSceneId === "tibet"
      ? ((theme.gradient[2] ?? "#2d4081") as string)
      : isIndigoThemeId(activeSceneId)
        ? (theme.gradient[theme.gradient.length - 1] as string)
        : null;
  const sheetGradient = sheetSolid ? ([sheetSolid, sheetSolid] as [string, string]) : theme.gradient;
  const { toggleFavorite } = usePlayer();
  const {
    favFolders,
    createFavFolder,
    renameFavFolder,
    deleteFavFolder,
    togglePinFavFolder,
    addToFavFolder,
    removeFromFavFolder,
    isInFavFolder,
    addFavFolderToFolder,
    isFavFolderInFolder,
    isFavoritePinned,
    togglePinFavorite,
  } = useFoldersPlaylists();

  const [step, setStep] = useState<Step>("main");
  const [newName, setNewName] = useState("");
  const [renameInput, setRenameInput] = useState("");

  useEffect(() => {
    if (visible) {
      setStep("main");
      setNewName("");
      setRenameInput("");
    }
  }, [visible]);

  if (!itemId || !itemKind) return null;

  const session = itemKind === "session" ? SESSIONS.find((s) => s.id === itemId) ?? null : null;
  const folder = itemKind === "folder" ? favFolders.find((f) => f.id === itemId) ?? null : null;

  if (itemKind === "session" && !session) return null;
  if (itemKind === "folder" && !folder) return null;

  const handleClose = () => {
    setStep("main");
    setNewName("");
    onClose();
  };

  const isPinned = itemKind === "session" ? isFavoritePinned(itemId) : (folder?.pinned ?? false);
  const title = session?.title ?? folder?.name ?? "";

  const folderCount = folder?.sessionIds.length ?? 0;
  const subtitle =
    itemKind === "session"
      ? "Favorito · Casa del Cuenco"
      : `Carpeta · ${folderCount === 0 ? "Vacía" : `${folderCount} favorito${folderCount !== 1 ? "s" : ""}`}`;

  const handlePin = () => {
    if (itemKind === "session") togglePinFavorite(itemId);
    else togglePinFavFolder(itemId);
    handleClose();
  };

  const handleDelete = () => {
    if (itemKind === "session") {
      Alert.alert("Quitar de favoritos", `¿Quitar "${title}" de tus favoritos?`, [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Quitar",
          style: "destructive",
          onPress: () => {
            handleClose();
            toggleFavorite(itemId);
          },
        },
      ]);
    } else {
      Alert.alert("Eliminar carpeta", `¿Eliminar "${title}"? Los favoritos no se borrarán.`, [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Eliminar",
          style: "destructive",
          onPress: () => {
            handleClose();
            deleteFavFolder(itemId);
          },
        },
      ]);
    }
  };

  const handleToggleFolder = (folderId: string) => {
    if (isInFavFolder(folderId, itemId)) {
      removeFromFavFolder(folderId, itemId);
    } else {
      addToFavFolder(folderId, itemId);
    }
  };

  const getDescendantFavFolderIds = (folderId: string): Set<string> => {
    const result = new Set<string>();
    const visit = (id: string) => {
      const f = favFolders.find((x) => x.id === id);
      for (const subId of f?.subFolderIds ?? []) {
        if (!result.has(subId)) {
          result.add(subId);
          visit(subId);
        }
      }
    };
    visit(folderId);
    return result;
  };

  const eligibleFavFolders =
    itemKind === "folder"
      ? favFolders.filter((f) => f.id !== itemId && !getDescendantFavFolderIds(itemId).has(f.id))
      : favFolders;

  const handleStartRename = () => {
    setRenameInput(title);
    setStep("rename");
  };

  const handleConfirmRename = () => {
    const trimmed = renameInput.trim();
    if (trimmed) renameFavFolder(itemId, trimmed);
    handleClose();
  };

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    createFavFolder(name, itemId);
    handleClose();
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
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={handleClose} />
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}>
          <LinearGradient colors={sheetGradient} style={StyleSheet.absoluteFill} pointerEvents="none" />
          <View style={styles.handle} />

          {step === "main" && (
            <>
              <View style={styles.header}>
                <View style={styles.iconBox}>
                  <Feather
                    name={itemKind === "folder" ? "folder" : "heart"}
                    size={22}
                    color={GOLD}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.itemTitle, { color: colors.foreground }]} numberOfLines={2}>
                    {title}
                  </Text>
                  <Text style={[styles.itemSub, { color: colors.mutedForeground }]} numberOfLines={1}>
                    {subtitle}
                  </Text>
                </View>
                <Pressable onPress={handleClose} style={styles.closeBtn}>
                  <Feather name="x" size={20} color={colors.mutedForeground} />
                </Pressable>
              </View>

              <ActionRow
                icon="bookmark"
                label={isPinned ? "Desfijar" : itemKind === "session" ? "Fijar favorito" : "Fijar carpeta"}
                iconColor={isPinned ? GOLD : undefined}
                onPress={handlePin}
                colors={colors}
              />
              <ActionRow
                icon="folder"
                label="Mover a una carpeta"
                onPress={() => setStep("folders")}
                colors={colors}
              />
              {itemKind === "folder" && (
                <ActionRow
                  icon="edit-2"
                  label="Renombrar la carpeta"
                  onPress={handleStartRename}
                  colors={colors}
                />
              )}
              <ActionRow
                icon="trash-2"
                label={itemKind === "session" ? "Eliminar de favoritos" : "Eliminar carpeta"}
                onPress={handleDelete}
                colors={colors}
                last
              />
            </>
          )}

          {step === "folders" && (
            <>
              <View style={styles.header}>
                <Pressable onPress={() => setStep("main")} style={styles.closeBtn}>
                  <Feather name="arrow-left" size={20} color={colors.foreground} />
                </Pressable>
                <Text style={[styles.itemTitle, { color: colors.foreground, flex: 1 }]}>
                  Mover a carpeta
                </Text>
                <Pressable onPress={handleClose} style={styles.closeBtn}>
                  <Feather name="x" size={20} color={colors.mutedForeground} />
                </Pressable>
              </View>

              <ScrollView bounces={false} showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
                {eligibleFavFolders.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                    Todavía no tenés ninguna carpeta
                  </Text>
                ) : (
                  eligibleFavFolders.map((f) => {
                    const inIt =
                      itemKind === "folder" ? isFavFolderInFolder(f.id, itemId) : isInFavFolder(f.id, itemId);
                    return (
                      <Pressable
                        key={f.id}
                        onPress={() => {
                          if (itemKind === "folder") {
                            addFavFolderToFolder(f.id, itemId);
                            handleClose();
                          } else {
                            handleToggleFolder(f.id);
                          }
                        }}
                        style={({ pressed }) => [styles.folderRow, { opacity: pressed ? 0.7 : 1 }]}
                      >
                        <View style={styles.folderIconBox}>
                          <Feather name="folder" size={18} color={GOLD} />
                        </View>
                        <Text
                          style={[styles.folderLabel, { color: colors.foreground }]}
                          numberOfLines={1}
                        >
                          {f.name}
                        </Text>
                        {inIt && <Feather name="check" size={16} color={GOLD} />}
                      </Pressable>
                    );
                  })
                )}
              </ScrollView>

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

          {step === "rename" && (
            <>
              <View style={styles.header}>
                <Pressable onPress={() => setStep("main")} style={styles.closeBtn}>
                  <Feather name="arrow-left" size={20} color={colors.foreground} />
                </Pressable>
                <Text style={[styles.itemTitle, { color: colors.foreground, flex: 1 }]}>
                  Renombrar la carpeta
                </Text>
                <Pressable onPress={handleClose} style={styles.closeBtn}>
                  <Feather name="x" size={20} color={colors.mutedForeground} />
                </Pressable>
              </View>

              <TextInput
                value={renameInput}
                onChangeText={setRenameInput}
                placeholder="Nombre de la carpeta"
                placeholderTextColor={colors.mutedForeground}
                style={[styles.input, {
                  color: colors.foreground,
                  borderColor: "rgba(61,14,22,0.40)",
                  backgroundColor: "rgba(74,12,12,0.08)",
                }]}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleConfirmRename}
                maxLength={40}
              />

              <Pressable
                onPress={handleConfirmRename}
                disabled={!renameInput.trim()}
                style={({ pressed }) => [
                  styles.createBtn,
                  {
                    backgroundColor: renameInput.trim() ? undefined : "rgba(212,175,55,0.30)",
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                {renameInput.trim() ? <GoldGradientFill /> : null}
                <Text style={[styles.createBtnLabel, { color: "#1B060F" }]}>
                  Guardar
                </Text>
              </Pressable>
            </>
          )}

          {step === "create" && (
            <>
              <View style={styles.header}>
                <Pressable onPress={() => setStep("folders")} style={styles.closeBtn}>
                  <Feather name="arrow-left" size={20} color={colors.foreground} />
                </Pressable>
                <Text style={[styles.itemTitle, { color: colors.foreground, flex: 1 }]}>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    overflow: "hidden",
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.055)",
    alignSelf: "center",
    marginBottom: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.055)",
    alignItems: "center",
    justifyContent: "center",
  },
  itemTitle: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 2,
  },
  itemSub: {
    fontFamily: "Manrope",
    fontSize: 13,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginBottom: 4,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
  },
  actionIcon: {
    width: 30,
    marginRight: 14,
  },
  actionLabel: {
    fontFamily: "Manrope",
    flex: 1,
    fontSize: 16,
  },
  emptyText: {
    fontFamily: "Manrope",
    fontSize: 14,
    textAlign: "center",
    paddingVertical: 24,
  },
  folderRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 13,
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(61,14,22,0.40)",
  },
  folderIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(190,150,80,0.06)",
    alignItems: "center",
    justifyContent: "center",
  },
  folderLabel: {
    fontFamily: "Manrope",
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
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
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "600",
  },
  input: {
    fontFamily: "Manrope",
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
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
  },
});
