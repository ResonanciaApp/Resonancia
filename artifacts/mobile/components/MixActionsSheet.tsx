/**
 * MixActionsSheet — menú de acciones de una mezcla guardada (3 puntitos).
 *
 * Acciones:
 *  1. Compartir
 *  2. Marcar como favorita / Quitar de favoritas
 *  3. Mover a una carpeta   → paso interno (igual que PlaylistActionsSheet)
 *  4. Duplicar
 *  5. Eliminar
 */
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { DURATION, easeOutCubicRA } from "@/constants/motion";
import RAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useQueryClient } from "@tanstack/react-query";
import { useShareMix, getGetSharedMixesQueryKey } from "@workspace/api-client-react";
import { getSoundImage } from "@/config/sound-images";
import { type MixFolder, type MixPreset, useMixer } from "@/context/MixerContext";
import { useFoldersPlaylists } from "@/context/FoldersPlaylistsContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useColors } from "@/hooks/useColors";

type Props = {
  mix: MixPreset | null;
  folder?: MixFolder | null;
  visible: boolean;
  onClose: () => void;
  onDuplicate: (mix: MixPreset) => void;
  onDelete: (mix: MixPreset) => void;
  onDeleteFolder?: (folder: MixFolder) => void;
  onEdit?: (mix: MixPreset) => void;
};

const THUMB = 40;
const SHIFT_CLOSED = 24;
const SHIFT_OPEN = 58;
const MAX_STACK = 4;
const TIMING_CFG = { duration: DURATION.SHEET_CLOSE, easing: easeOutCubicRA } as const;

function MiniStack({ sounds }: { sounds: { id: string }[] }) {
  const visible = sounds.slice(0, MAX_STACK);
  const count = visible.length;

  const isOpen = useSharedValue(false);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (collapseTimer.current) clearTimeout(collapseTimer.current); }, []);

  // Un animated style por slot (máx 4). Hooks no pueden estar en loops.
  const a0 = useAnimatedStyle(() => ({ left: withTiming(isOpen.value ? 0 * SHIFT_OPEN : 0 * SHIFT_CLOSED, TIMING_CFG) }));
  const a1 = useAnimatedStyle(() => ({ left: withTiming(isOpen.value ? 1 * SHIFT_OPEN : 1 * SHIFT_CLOSED, TIMING_CFG) }));
  const a2 = useAnimatedStyle(() => ({ left: withTiming(isOpen.value ? 2 * SHIFT_OPEN : 2 * SHIFT_CLOSED, TIMING_CFG) }));
  const a3 = useAnimatedStyle(() => ({ left: withTiming(isOpen.value ? 3 * SHIFT_OPEN : 3 * SHIFT_CLOSED, TIMING_CFG) }));
  const slotStyles = [a0, a1, a2, a3];

  // El contenedor crece junto con el spread para no recortar los thumbs
  const containerStyle = useAnimatedStyle(() => {
    const naturalW = THUMB + Math.max(0, count - 1) * SHIFT_CLOSED;
    const openW    = THUMB + Math.max(0, count - 1) * SHIFT_OPEN;
    return { width: withTiming(isOpen.value ? openW : naturalW, TIMING_CFG) };
  });

  const expand = () => {
    isOpen.value = true;
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
    // Auto-colapso tras 4 s si el usuario no toca nada
    collapseTimer.current = setTimeout(() => { isOpen.value = false; }, 4000);
  };

  const collapse = () => {
    isOpen.value = false;
    if (collapseTimer.current) clearTimeout(collapseTimer.current);
  };

  return (
    <Pressable
      onLongPress={expand}
      onPress={() => { if (isOpen.value) collapse(); }}
      delayLongPress={450}
    >
      <RAnimated.View style={[{ height: THUMB, position: "relative" }, containerStyle]}>
        {visible.map((s, i) => {
          const img = getSoundImage(s.id);
          return (
            <RAnimated.View key={s.id} style={[styles.stackThumb, { zIndex: i }, slotStyles[i]]}>
              {img ? (
                <Image source={img} style={styles.stackThumbImg} resizeMode="cover" />
              ) : (
                <View style={[styles.stackThumbImg, { backgroundColor: "rgba(212,175,55,0.15)" }]} />
              )}
            </RAnimated.View>
          );
        })}
      </RAnimated.View>
    </Pressable>
  );
}

export function MixActionsSheet({
  mix, folder = null, visible, onClose, onDuplicate, onDelete, onDeleteFolder, onEdit,
}: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { theme, activeSceneId } = useSceneTheme();
  const sheetSolid =
    activeSceneId === "tibet"
      ? ((theme.gradient[2] ?? "#2d4081") as string)
      : activeSceneId === "indigo"
        ? (theme.gradient[theme.gradient.length - 1] as string)
        : null;
  const sheetGradient = sheetSolid ? ([sheetSolid, sheetSolid] as [string, string]) : theme.gradient;
  const {
    togglePresetFavorite,
    mixFolders,
    addMixToFolder,
    isMixInFolder,
    addMixFolderToFolder,
    isMixFolderInFolder,
    togglePinMixFolder,
    renameMixFolder,
    deleteMixFolder,
  } = useMixer();
  const {
    folders: userFolders,
    addMixToFolder: addMixToUserFolder,
    isMixInFolder: isMixInUserFolder,
  } = useFoldersPlaylists();
  const queryClient = useQueryClient();
  const shareMixMutation = useShareMix();

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [step, setStep] = useState<"main" | "folders" | "rename">("main");
  const [renameInput, setRenameInput] = useState("");

  useEffect(() => {
    if (visible) {
      setToastVisible(false);
      setStep("main");
      setRenameInput(folder?.name ?? "");
    }
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, [visible, folder?.name]);

  if (!mix && !folder) return null;

  const itemKind: "mix" | "folder" = folder ? "folder" : "mix";
  const favorited = mix?.favorited ?? false;

  const getDescendantMixFolderIds = (folderId: string): Set<string> => {
    const result = new Set<string>();
    const visit = (id: string) => {
      const f = mixFolders.find((x) => x.id === id);
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

  const eligibleMixFolders =
    itemKind === "folder" && folder
      ? mixFolders.filter((f) => f.id !== folder.id && !getDescendantMixFolderIds(folder.id).has(f.id))
      : mixFolders;

  const handlePinFolder = () => {
    if (folder) togglePinMixFolder(folder.id);
  };

  const handleStartRenameFolder = () => {
    if (!folder) return;
    setRenameInput(folder.name);
    setStep("rename");
  };

  const handleConfirmRenameFolder = () => {
    const trimmed = renameInput.trim();
    if (folder && trimmed) renameMixFolder(folder.id, trimmed);
    onClose();
  };

  const handleDeleteFolder = () => {
    if (!folder) return;
    Alert.alert("Eliminar carpeta", `¿Eliminar "${folder.name}"? Las mezclas no se borrarán.`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => {
          onClose();
          if (onDeleteFolder) onDeleteFolder(folder);
          else deleteMixFolder(folder.id);
        },
      },
    ]);
  };

  const showToast = (msg: string, autoClose = false) => {
    setToastMsg(msg);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    if (closeTimer.current) clearTimeout(closeTimer.current);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1400),
      Animated.timing(toastAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setToastVisible(false));
    if (autoClose) {
      closeTimer.current = setTimeout(onClose, 2000);
    }
  };

  const handleShareToCommunity = () => {
    if (!mix) return;
    if (shareMixMutation.isPending) return;
    if (!mix.categoryChosen) {
      Alert.alert(
        "Elige una imagen primero",
        "Abre \"Ver / editar detalles\" y selecciona una de las imágenes de la grilla para poder compartir tu mezcla.",
      );
      return;
    }
    if (mix.sounds.length < 2) {
      Alert.alert(
        "Agrega más sonidos",
        "Una mezcla necesita al menos 2 sonidos para compartirse con la comunidad.",
      );
      return;
    }
    shareMixMutation.mutate(
      {
        data: {
          name: mix.name,
          description: mix.description ?? "",
          image: mix.image ?? "",
          category: mix.category as never,
          sounds: mix.sounds.slice(0, 10).map((s) => ({ id: s.id, volume: s.volume })),
        },
      },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetSharedMixesQueryKey() });
          onClose();
          Alert.alert("Mezcla compartida", "Tu mezcla ya aparece en el carrusel de la comunidad en Biblioteca.");
        },
        onError: (err) => {
          const status = (err as { status?: number })?.status;
          if (status === 409) {
            const msg = String((err as { message?: string })?.message ?? "");
            if (/duplic|ya comparti|already/i.test(msg)) {
              Alert.alert(
                "Ya la compartiste",
                "Ya tienes una mezcla con estos mismos sonidos en la comunidad.",
              );
            } else {
              Alert.alert(
                "Límite alcanzado",
                "Llegaste al máximo de mezclas compartidas. Elimina alguna desde el carrusel de la comunidad para compartir otra.",
              );
            }
            return;
          }
          Alert.alert("Error", "No se pudo compartir. Intenta de nuevo.");
        },
      },
    );
  };

  const handleFavorite = () => {
    if (!mix) return;
    const willAdd = !favorited;
    togglePresetFavorite(mix.id);
    showToast(willAdd ? "Guardada en Favoritas" : "Eliminada de Favoritas", true);
  };

  const handleDelete = () => {
    if (!mix) return;
    Alert.alert("Eliminar mezcla", `¿Eliminar "${mix.name}"?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Eliminar",
        style: "destructive",
        onPress: () => {
          onClose();
          onDelete(mix);
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
        <LinearGradient colors={sheetGradient} style={StyleSheet.absoluteFill} pointerEvents="none" />
        <View style={styles.handle} />

        {step === "main" ? (
          <>
            {/* Cabecera */}
            <View style={styles.header}>
              {itemKind === "mix" && mix ? (
                <MiniStack sounds={mix.sounds} />
              ) : (
                <View style={styles.folderHeaderIcon}>
                  <Feather name="folder" size={22} color={colors.primary} />
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.mixName, { color: colors.foreground }]} numberOfLines={2}>
                  {itemKind === "mix" ? mix?.name : folder?.name}
                </Text>
                <Text style={[styles.mixMeta, { color: colors.mutedForeground }]}>
                  {itemKind === "mix"
                    ? `${mix?.sounds.length ?? 0} sonido${mix?.sounds.length !== 1 ? "s" : ""}`
                    : `${folder?.presetIds.length ?? 0} mezcla${folder?.presetIds.length !== 1 ? "s" : ""}`}
                </Text>
              </View>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            {itemKind === "mix" && mix ? (
              <>
                {onEdit && (
                  <ActionRow
                    icon="edit-2"
                    label="Ver / editar detalles"
                    onPress={() => { onClose(); onEdit(mix); }}
                    colors={colors}
                  />
                )}
                <ActionRow
                  icon="users"
                  label={shareMixMutation.isPending ? "Compartiendo..." : "Compartir con la comunidad"}
                  onPress={handleShareToCommunity}
                  colors={colors}
                />
                <ActionRow
                  icon="heart"
                  label={favorited ? "Quitar de favoritas" : "Marcar como favorita"}
                  iconColor={favorited ? "#E05C5C" : undefined}
                  onPress={handleFavorite}
                  colors={colors}
                />
                <ActionRow
                  icon="folder"
                  label="Mover a una carpeta"
                  onPress={() => setStep("folders")}
                  colors={colors}
                />
                <ActionRow
                  icon="copy"
                  label="Duplicar"
                  onPress={() => { onClose(); onDuplicate(mix); }}
                  colors={colors}
                />
                <ActionRow
                  icon="trash-2"
                  label="Eliminar"
                  iconColor="#E05C5C"
                  onPress={handleDelete}
                  colors={colors}
                  last
                />
              </>
            ) : folder ? (
              <>
                <ActionRow
                  icon="bookmark"
                  label={folder.pinned ? "Desfijar" : "Fijar carpeta"}
                  iconColor={folder.pinned ? colors.primary : undefined}
                  onPress={handlePinFolder}
                  colors={colors}
                />
                <ActionRow
                  icon="folder"
                  label="Mover a una carpeta"
                  onPress={() => setStep("folders")}
                  colors={colors}
                />
                <ActionRow
                  icon="edit-2"
                  label="Renombrar la carpeta"
                  onPress={handleStartRenameFolder}
                  colors={colors}
                />
                <ActionRow
                  icon="trash-2"
                  label="Eliminar carpeta"
                  onPress={handleDeleteFolder}
                  colors={colors}
                  last
                />
              </>
            ) : null}
          </>
        ) : step === "folders" ? (
          <>
            <View style={styles.header}>
              <Pressable onPress={() => setStep("main")} style={styles.closeBtn}>
                <Feather name="arrow-left" size={20} color={colors.foreground} />
              </Pressable>
              <Text style={[styles.mixName, { color: colors.foreground, flex: 1, marginBottom: 0 }]}>
                Mover a carpeta
              </Text>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <ScrollView bounces={false} showsVerticalScrollIndicator={false} style={{ maxHeight: 320 }}>
              {eligibleMixFolders.length === 0 && (itemKind !== "mix" || userFolders.length === 0) ? (
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Todavía no tenés ninguna carpeta
                </Text>
              ) : (
                <>
                {itemKind === "mix" && mix && userFolders.map((f) => {
                  const inIt = isMixInUserFolder(f.id, mix.id);
                  return (
                    <Pressable
                      key={f.id}
                      onPress={() => { addMixToUserFolder(f.id, mix.id); onClose(); }}
                      style={({ pressed }) => [styles.folderRow, { opacity: pressed ? 0.7 : 1 }]}
                    >
                      <View style={styles.folderIconBox}>
                        <Feather name="folder" size={18} color={colors.primary} />
                      </View>
                      <Text
                        style={[styles.folderLabel, { color: colors.foreground }]}
                        numberOfLines={1}
                      >
                        {f.name}
                      </Text>
                      {inIt && <Feather name="check" size={16} color={colors.primary} />}
                    </Pressable>
                  );
                })}
                {eligibleMixFolders.map((f) => {
                  const inIt =
                    itemKind === "mix" && mix
                      ? isMixInFolder(f.id, mix.id)
                      : folder
                        ? isMixFolderInFolder(f.id, folder.id)
                        : false;
                  return (
                    <Pressable
                      key={f.id}
                      onPress={() => {
                        if (itemKind === "mix" && mix) addMixToFolder(f.id, mix.id);
                        else if (folder) addMixFolderToFolder(f.id, folder.id);
                        onClose();
                      }}
                      style={({ pressed }) => [styles.folderRow, { opacity: pressed ? 0.7 : 1 }]}
                    >
                      <View style={styles.folderIconBox}>
                        <Feather name="folder" size={18} color={colors.primary} />
                      </View>
                      <Text
                        style={[styles.folderLabel, { color: colors.foreground }]}
                        numberOfLines={1}
                      >
                        {f.name}
                      </Text>
                      {inIt && <Feather name="check" size={16} color={colors.primary} />}
                    </Pressable>
                  );
                })}
                </>
              )}
            </ScrollView>
          </>
        ) : (
          <>
            <View style={styles.header}>
              <Pressable onPress={() => setStep("main")} style={styles.closeBtn}>
                <Feather name="arrow-left" size={20} color={colors.foreground} />
              </Pressable>
              <Text style={[styles.mixName, { color: colors.foreground, flex: 1, marginBottom: 0 }]}>
                Renombrar la carpeta
              </Text>
              <Pressable onPress={onClose} style={styles.closeBtn}>
                <Feather name="x" size={20} color={colors.mutedForeground} />
              </Pressable>
            </View>

            <TextInput
              value={renameInput}
              onChangeText={setRenameInput}
              placeholder="Nombre de la carpeta"
              placeholderTextColor={colors.mutedForeground}
              style={[styles.renameInput, {
                color: colors.foreground,
                borderColor: "rgba(61,14,22,0.40)",
                backgroundColor: "rgba(74,12,12,0.08)",
              }]}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleConfirmRenameFolder}
              maxLength={40}
            />

            <Pressable
              onPress={handleConfirmRenameFolder}
              disabled={!renameInput.trim()}
              style={({ pressed }) => [
                styles.saveBtn,
                { backgroundColor: renameInput.trim() ? colors.primary : "rgba(190,150,80,0.30)", opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Text style={styles.saveBtnLabel}>Guardar</Text>
            </Pressable>
          </>
        )}

        {toastVisible && (
          <Animated.View
            style={[
              styles.toast,
              {
                backgroundColor: "rgba(21,26,35,0.96)",
                opacity: toastAnim,
                transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
              },
            ]}
          >
            <Feather name="check-circle" size={16} color={colors.primary} style={{ marginRight: 8 }} />
            <Text style={[styles.toastText, { color: colors.foreground }]}>{toastMsg}</Text>
          </Animated.View>
        )}
      </View>

    </Modal>
  );
}

type Colors = ReturnType<typeof import("@/hooks/useColors").useColors>;

function ActionRow({
  icon, label, right, iconColor, onPress, last, colors,
}: {
  icon: React.ComponentProps<typeof Feather>["name"];
  label: string;
  right?: string;
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
      {right ? (
        <Text style={[styles.actionRight, { color: colors.mutedForeground }]}>{right}</Text>
      ) : (
        <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.25)" />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    overflow: "hidden",
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.055)",
    alignSelf: "center", marginBottom: 16,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 14 },
  mixName: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700", lineHeight: 20, marginBottom: 3 },
  mixMeta: { fontFamily: "Manrope", fontSize: 13 },
  closeBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  divider: { height: StyleSheet.hairlineWidth, marginBottom: 4 },
  stackThumb: {
    position: "absolute", width: THUMB, height: THUMB,
    borderRadius: 8, overflow: "hidden",
    shadowColor: "#000", shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.4, shadowRadius: 3, elevation: 3,
  },
  stackThumbImg: { width: THUMB, height: THUMB, borderRadius: 8 },
  actionRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14 },
  actionIcon: { width: 30, marginRight: 14 },
  actionLabel: { fontFamily: "Manrope", flex: 1, fontSize: 16 },
  actionRight: { fontFamily: "Manrope", fontSize: 14, marginRight: 6 },
  emptyText: { fontFamily: "Manrope", fontSize: 14, textAlign: "center", paddingVertical: 24 },
  folderRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 13, gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(61,14,22,0.40)",
  },
  folderIconBox: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: "rgba(190,150,80,0.06)",
    alignItems: "center", justifyContent: "center",
  },
  folderLabel: { fontFamily: "Manrope", flex: 1, fontSize: 15, fontWeight: "500" },
  folderHeaderIcon: {
    width: THUMB, height: THUMB, borderRadius: 10,
    backgroundColor: "rgba(190,150,80,0.08)",
    alignItems: "center", justifyContent: "center",
  },
  renameInput: {
    fontFamily: "Manrope",
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 16,
  },
  saveBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
    marginBottom: 4,
  },
  saveBtnLabel: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
    color: "#1B060F",
  },
  toast: {
    flexDirection: "row", alignItems: "center",
    position: "absolute", bottom: 80, left: 20, right: 20,
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(61,14,22,0.40)",
  },
  toastText: { fontFamily: "Manrope", fontSize: 15, fontWeight: "600" },
});
