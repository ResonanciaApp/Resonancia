import { Feather } from "@expo/vector-icons";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  useFoldersPlaylists,
} from "@/context/FoldersPlaylistsContext";
import { useColors } from "@/hooks/useColors";

const GOLD = "#D4AF37";

type Props = {
  itemId: string | null;
  itemKind: "playlist" | "folder" | null;
  visible: boolean;
  onClose: () => void;
};

type Step = "main" | "folders";

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
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(61,14,22,0.40)" },
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Feather name={icon} size={20} color={iconColor ?? colors.foreground} style={styles.actionIcon} />
      <Text style={[styles.actionLabel, { color: iconColor ?? colors.foreground }]}>{label}</Text>
      <Feather name="chevron-right" size={16} color="rgba(244,218,213,0.25)" />
    </Pressable>
  );
}

export function PlaylistActionsSheet({ itemId, itemKind, visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    playlists,
    folders,
    deletePlaylist,
    deleteFolder,
    togglePinPlaylist,
    togglePinFolder,
    addPlaylistToFolder,
    isPlaylistInFolder,
  } = useFoldersPlaylists();

  const [step, setStep] = useState<Step>("main");

  useEffect(() => {
    if (visible) setStep("main");
  }, [visible]);

  if (!itemId || !itemKind) return null;

  const playlist = itemKind === "playlist" ? playlists.find((p) => p.id === itemId) ?? null : null;
  const folder = itemKind === "folder" ? folders.find((f) => f.id === itemId) ?? null : null;
  const item = playlist ?? folder;

  if (!item) return null;

  const isPinned = item.pinned ?? false;
  const title = playlist?.name ?? folder?.name ?? "";

  const folderCount = folder?.playlistIds?.length ?? 0;
  const subtitle =
    itemKind === "playlist"
      ? "Playlist · Casa del Cuenco"
      : `Carpeta · ${folderCount === 0 ? "Vacía" : `${folderCount} playlist${folderCount !== 1 ? "s" : ""}`}`;

  const handlePin = () => {
    if (itemKind === "playlist") togglePinPlaylist(itemId);
    else togglePinFolder(itemId);
    onClose();
  };

  const handleDelete = () => {
    const label = itemKind === "playlist" ? "playlist" : "carpeta";
    Alert.alert(`Eliminar ${label}`, `¿Eliminar "${title}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => {
          onClose();
          if (itemKind === "playlist") deletePlaylist(itemId);
          else deleteFolder(itemId);
        },
      },
    ]);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onClose} />

      <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}>
        <View style={styles.handle} />

        {step === "main" ? (
          <>
            <View style={styles.header}>
              <View style={styles.iconBox}>
                <Feather
                  name={itemKind === "folder" ? "folder" : "list"}
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
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <View style={[styles.divider, { backgroundColor: "rgba(61,14,22,0.40)" }]} />

            <ActionRow
              icon="bookmark"
              label={isPinned ? "Desfijar" : "Fijar playlist"}
              iconColor={isPinned ? GOLD : undefined}
              onPress={handlePin}
              colors={colors}
            />
            {itemKind === "playlist" && (
              <ActionRow
                icon="folder"
                label="Mover a una carpeta"
                onPress={() => setStep("folders")}
                colors={colors}
              />
            )}
            <ActionRow
              icon="trash-2"
              label={itemKind === "playlist" ? "Eliminar playlist" : "Eliminar carpeta"}
              iconColor="#E05C5C"
              onPress={handleDelete}
              colors={colors}
              last
            />
          </>
        ) : (
          <>
            <View style={styles.header}>
              <Pressable onPress={() => setStep("main")} style={styles.closeBtn}>
                <Feather name="arrow-left" size={20} color={colors.foreground} />
              </Pressable>
              <Text style={[styles.itemTitle, { color: colors.foreground, flex: 1 }]}>
                Mover a carpeta
              </Text>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <View style={[styles.divider, { backgroundColor: "rgba(61,14,22,0.40)" }]} />

            <ScrollView bounces={false} showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
              {folders.length === 0 ? (
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Todavía no tenés ninguna carpeta
                </Text>
              ) : (
                folders.map((f) => {
                  const inIt = isPlaylistInFolder(f.id, itemId);
                  return (
                    <Pressable
                      key={f.id}
                      onPress={() => {
                        addPlaylistToFolder(f.id, itemId);
                        onClose();
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
          </>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    backgroundColor: "#27070E",
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
    backgroundColor: "rgba(74,12,12,0.35)",
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
    backgroundColor: "rgba(212,175,55,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 2,
  },
  itemSub: {
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
    flex: 1,
    fontSize: 16,
  },
  emptyText: {
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
    backgroundColor: "rgba(212,175,55,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  folderLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
});
