/**
 * VideoActionsSheet — menú de acciones rápidas de un video (3 puntitos).
 *
 * Acciones:
 *  1. Compartir
 *  2. Temporizador  → abre TimerSheet (timer de VideosContext)
 *  3. Marcar como favorito / Quitar de favoritos
 *  4. Añadir a una carpeta → sub-sheet de carpetas de videos
 *  5. Añadir al Playlist → AddVideoToPlaylistSheet
 *  6. Seguir profesor (solo si el video tiene guideId)
 *  7. Ver perfil del profesor (solo si el video tiene guideId)
 */
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { GoldGradient, GoldGradientFill } from "@/components/GoldGradient";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TimerSheet } from "@/components/TimerSheet";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { useFoldersPlaylists } from "@/context/FoldersPlaylistsContext";
import { useVideosState } from "@/context/VideosContext";
import { getGuideById } from "@/data/guides";
import { type VideoItem } from "@/data/videos";
import { useColors } from "@/hooks/useColors";

const FOLLOWED_KEY = "@biblioteca_followed_resonadores";

type Props = {
  video: VideoItem | null;
  visible: boolean;
  onClose: () => void;
};

export function VideoActionsSheet({ video, visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    isVideoFavorite,
    toggleVideoFavorite,
    videoTimerRemaining,
    setVideoTimer,
  } = useVideosState();

  const [showTimer, setShowTimer] = useState(false);
  const [showFolder, setShowFolder] = useState(false);
  const [showPlaylist, setShowPlaylist] = useState(false);

  // Seguir profesor
  const [followedIds, setFollowedIds] = useState<string[]>([]);

  // Toast (favorito / seguir)
  const [toastVisible, setToastVisible] = useState(false);
  const [toastText, setToastText] = useState("");
  const [toastIcon, setToastIcon] = useState<React.ComponentProps<typeof Feather>["name"]>("heart");
  const [toastIconColor, setToastIconColor] = useState<string | undefined>(undefined);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      setShowTimer(false);
      setShowFolder(false);
      setShowPlaylist(false);
      AsyncStorage.getItem(FOLLOWED_KEY).then((raw) => {
        if (raw) {
          try {
            setFollowedIds(JSON.parse(raw));
          } catch {
            setFollowedIds([]);
          }
        } else {
          setFollowedIds([]);
        }
      });
    }
  }, [visible]);

  if (!video) return null;

  const favorited = isVideoFavorite(video.id);
  const guide = video.guideId ? getGuideById(video.guideId) : undefined;
  const author = guide?.name ?? video.author ?? "Casa del Cuenco";
  const isFollowing = guide ? followedIds.includes(guide.id) : false;

  const timerLabel =
    videoTimerRemaining === null
      ? "Apagado"
      : videoTimerRemaining >= 3600
        ? `${Math.round(videoTimerRemaining / 3600)}h`
        : `${Math.round(videoTimerRemaining / 60)} min`;

  // ── Actions ────────────────────────────────────────────────────────────────

  const showToast = (
    text: string,
    icon: React.ComponentProps<typeof Feather>["name"],
    iconColor?: string,
    autoClose = true,
  ) => {
    setToastText(text);
    setToastIcon(icon);
    setToastIconColor(iconColor);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1400),
      Animated.timing(toastAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setToastVisible(false));
    if (autoClose) toastTimer.current = setTimeout(onClose, 2000);
  };

  const handleShare = async () => {
    onClose();
    try {
      await Share.share({
        message: `"${video.title}" — ${video.durationLabel} · Resonancia`,
      });
    } catch {
      // silent
    }
  };

  const handleFavorite = () => {
    const willAdd = !favorited;
    toggleVideoFavorite(video.id);
    showToast(
      willAdd ? "Guardado en Favoritos" : "Eliminado de Favoritos",
      "heart",
      willAdd ? "#E05C5C" : undefined,
    );
  };

  const handleFollow = async () => {
    if (!guide) return;
    const next = isFollowing
      ? followedIds.filter((id) => id !== guide.id)
      : [...followedIds, guide.id];
    setFollowedIds(next);
    await AsyncStorage.setItem(FOLLOWED_KEY, JSON.stringify(next));
    showToast(
      isFollowing ? `Dejaste de seguir a ${guide.name}` : `Ahora sigues a ${guide.name}`,
      isFollowing ? "user-minus" : "user-check",
      isFollowing ? undefined : colors.primary,
      false,
    );
  };

  const handleViewProfile = () => {
    if (!guide) return;
    onClose();
    router.push(`/guiador/${guide.id}` as never);
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <View style={styles.modalRoot}>
        {/* Backdrop */}
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose}>
          <View style={styles.backdrop} />
        </Pressable>

        {/* Sheet */}
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}>
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "#142761" }]} pointerEvents="none" />
          {/* Handle */}
          <View style={styles.handle} />

          {/* Video header */}
          <View style={styles.videoHeader}>
            <Image
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              source={video.thumbnail as any}
              style={styles.videoThumb}
              placeholder={BLUR_PLACEHOLDER}
              transition={IMAGE_TRANSITION}
              contentFit="cover"
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.videoTitle, { color: colors.foreground }]} numberOfLines={2}>
                {video.title}
              </Text>
              <Text style={[styles.videoAuthor, { color: colors.mutedForeground }]} numberOfLines={1}>
                {author} · {video.durationLabel}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {/* ── Opciones ── */}
          <ActionRow icon="share" label="Compartir" onPress={handleShare} colors={colors} />
          <ActionRow
            icon="clock"
            label="Temporizador"
            right={timerLabel}
            onPress={() => setShowTimer(true)}
            colors={colors}
          />
          <ActionRow
            icon="heart"
            label={favorited ? "Quitar de favoritos" : "Marcar como favorito"}
            iconColor={favorited ? "#E05C5C" : undefined}
            onPress={handleFavorite}
            colors={colors}
          />
          <ActionRow
            icon="folder-plus"
            label="Añadir a una carpeta"
            onPress={() => setShowFolder(true)}
            colors={colors}
          />
          <ActionRow
            icon="list"
            label="Añadir al Playlist"
            onPress={() => setShowPlaylist(true)}
            colors={colors}
            last={!guide}
          />
          {guide && (
            <>
              <ActionRow
                icon={isFollowing ? "user-check" : "user-plus"}
                label={isFollowing ? `Siguiendo a ${guide.name}` : "Seguir profesor"}
                iconColor={isFollowing ? colors.primary : undefined}
                onPress={handleFollow}
                colors={colors}
              />
              <ActionRow
                icon="user"
                label="Ver perfil del profesor"
                onPress={handleViewProfile}
                colors={colors}
                last
              />
            </>
          )}

          {/* Toast */}
          {toastVisible && (
            <Animated.View
              style={[
                styles.toast,
                {
                  backgroundColor: "rgba(27,6,15,0.96)",
                  opacity: toastAnim,
                  transform: [
                    {
                      translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }),
                    },
                  ],
                },
              ]}
            >
              <Feather
                name={toastIcon}
                size={16}
                color={toastIconColor ?? colors.mutedForeground}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.toastText, { color: colors.foreground }]}>{toastText}</Text>
            </Animated.View>
          )}
        </View>

        {/* Sub-sheet: Timer (usa el timer de videos) */}
        <TimerSheet
          visible={showTimer}
          onClose={() => setShowTimer(false)}
          sleepTimerRemaining={videoTimerRemaining}
          setSleepTimer={setVideoTimer}
        />

        {/* Sub-sheet: Añadir a carpeta de videos */}
        <AddVideoToFolderSheet
          visible={showFolder}
          videoId={video.id}
          onClose={() => setShowFolder(false)}
        />

        {/* Sub-sheet: Añadir al Playlist */}
        <AddVideoToPlaylistSheet
          visible={showPlaylist}
          videoId={video.id}
          onClose={() => setShowPlaylist(false)}
        />
      </View>
    </Modal>
  );
}

// ─── AddVideoToFolderSheet ────────────────────────────────────────────────────

function AddVideoToFolderSheet({
  visible,
  videoId,
  onClose,
}: {
  visible: boolean;
  videoId: string;
  onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const {
    videoFolders,
    createVideoFolder,
    addVideoToFolder,
    removeVideoFromFolder,
    isVideoInFolder,
  } = useVideosState();

  const [step, setStep] = useState<"list" | "create">("list");
  const [newName, setNewName] = useState("");

  const handleClose = () => {
    setStep("list");
    setNewName("");
    onClose();
  };

  const handleToggle = (folderId: string) => {
    if (isVideoInFolder(folderId, videoId)) {
      removeVideoFromFolder(folderId, videoId);
    } else {
      addVideoToFolder(folderId, videoId);
    }
  };

  const handleCreate = () => {
    const name = newName.trim();
    if (!name) return;
    const folder = createVideoFolder(name, videoId);
    handleClose();
    router.push(`/carpeta-video/${folder.id}` as never);
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
        <Pressable style={subStyles.backdrop} onPress={handleClose} />

        <View style={[subStyles.sheet, { paddingBottom: insets.bottom + 16 }]}>
          <View style={subStyles.handle} />

          {step === "list" && (
            <>
              <View style={subStyles.headerRow}>
                <Text style={[subStyles.title, { color: colors.foreground }]}>
                  Añadir a la carpeta
                </Text>
                <Pressable onPress={handleClose} style={subStyles.closeBtn}>
                  <Feather name="x" size={20} color={colors.mutedForeground} />
                </Pressable>
              </View>

              <ScrollView bounces={false} showsVerticalScrollIndicator={false} style={{ maxHeight: 300 }}>
                {videoFolders.length === 0 && (
                  <Text style={[subStyles.emptyText, { color: colors.mutedForeground }]}>
                    Todavía no tienes ninguna carpeta de videos
                  </Text>
                )}
                {videoFolders.map((folder) => {
                  const inIt = isVideoInFolder(folder.id, videoId);
                  return (
                    <Pressable
                      key={folder.id}
                      onPress={() => handleToggle(folder.id)}
                      style={({ pressed }) => [subStyles.row, { opacity: pressed ? 0.7 : 1 }]}
                    >
                      <View style={[subStyles.folderIcon, { backgroundColor: "rgba(212,175,55,0.12)" }]}>
                        <Feather name="folder" size={18} color={colors.primary} />
                      </View>
                      <Text style={[subStyles.rowLabel, { color: colors.foreground }]} numberOfLines={1}>
                        {folder.name}
                      </Text>
                      <Text style={[subStyles.rowCount, { color: colors.mutedForeground }]}>
                        {folder.videoIds.length}
                      </Text>
                      {inIt ? (
                        <Feather name="check-circle" size={20} color={colors.primary} />
                      ) : (
                        <Feather name="circle" size={20} color="rgba(255,255,255,0.25)" />
                      )}
                    </Pressable>
                  );
                })}
              </ScrollView>

              <Pressable
                onPress={() => setStep("create")}
                style={({ pressed }) => [
                  subStyles.newRow,
                  { borderTopColor: "rgba(61,14,22,0.40)", opacity: pressed ? 0.7 : 1 },
                ]}
              >
                <GoldGradient style={subStyles.plusCircle}>
                  <Feather name="plus" size={14} color="#1B060F" />
                </GoldGradient>
                <Text style={[subStyles.newLabel, { color: colors.foreground }]}>
                  Nueva Carpeta
                </Text>
              </Pressable>
            </>
          )}

          {step === "create" && (
            <>
              <View style={subStyles.headerRow}>
                <Pressable onPress={() => setStep("list")} style={subStyles.closeBtn}>
                  <Feather name="arrow-left" size={20} color={colors.foreground} />
                </Pressable>
                <Text style={[subStyles.title, { color: colors.foreground }]}>
                  Nombre de la carpeta
                </Text>
                <Pressable onPress={handleClose} style={subStyles.closeBtn}>
                  <Feather name="x" size={20} color={colors.mutedForeground} />
                </Pressable>
              </View>

              <TextInput
                value={newName}
                onChangeText={setNewName}
                placeholder="Ej: Rutinas, Respiración…"
                placeholderTextColor={colors.mutedForeground}
                style={[subStyles.input, {
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
                  subStyles.createBtn,
                  {
                    backgroundColor: newName.trim() ? undefined : "rgba(212,175,55,0.30)",
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                {newName.trim() ? <GoldGradientFill /> : null}
                <Text style={[subStyles.createBtnLabel, { color: "#1B060F" }]}>
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

// ─── AddVideoToPlaylistSheet ──────────────────────────────────────────────────

function AddVideoToPlaylistSheet({
  visible,
  videoId,
  onClose,
}: {
  visible: boolean;
  videoId: string;
  onClose: () => void;
}) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { playlists, addVideoToPlaylist, removeVideoFromPlaylist, isVideoInPlaylist } =
    useFoldersPlaylists();

  const handleToggle = (playlistId: string) => {
    if (isVideoInPlaylist(playlistId, videoId)) {
      removeVideoFromPlaylist(playlistId, videoId);
    } else {
      addVideoToPlaylist(playlistId, videoId);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <Pressable style={subStyles.backdrop} onPress={onClose} />

      <View style={[subStyles.sheet, { paddingBottom: insets.bottom + 16 }]}>
        <View style={subStyles.handle} />

        <View style={subStyles.headerRow}>
          <Text style={[subStyles.title, { color: colors.foreground }]}>
            Añadir al Playlist
          </Text>
          <Pressable onPress={onClose} style={subStyles.closeBtn}>
            <Feather name="x" size={20} color={colors.mutedForeground} />
          </Pressable>
        </View>

        <ScrollView bounces={false} showsVerticalScrollIndicator={false} style={{ maxHeight: 340 }}>
          {playlists.length === 0 && (
            <Text style={[subStyles.emptyText, { color: colors.mutedForeground }]}>
              Todavía no tienes ningún ritual. Créalo desde Biblioteca.
            </Text>
          )}
          {playlists.map((pl) => {
            const inIt = isVideoInPlaylist(pl.id, videoId);
            const count = pl.sessionIds.length + (pl.videoIds ?? []).length;
            return (
              <Pressable
                key={pl.id}
                onPress={() => handleToggle(pl.id)}
                style={({ pressed }) => [subStyles.row, { opacity: pressed ? 0.7 : 1 }]}
              >
                <View style={[subStyles.folderIcon, { backgroundColor: "rgba(212,175,55,0.12)" }]}>
                  <Feather name="list" size={18} color={colors.primary} />
                </View>
                <Text style={[subStyles.rowLabel, { color: colors.foreground }]} numberOfLines={1}>
                  {pl.name}
                </Text>
                <Text style={[subStyles.rowCount, { color: colors.mutedForeground }]}>
                  {count}
                </Text>
                {inIt ? (
                  <Feather name="check-circle" size={20} color={colors.primary} />
                ) : (
                  <Feather name="circle" size={20} color="rgba(255,255,255,0.25)" />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>
    </Modal>
  );
}

// ─── ActionRow ────────────────────────────────────────────────────────────────

type Colors = ReturnType<typeof import("@/hooks/useColors").useColors>;

function ActionRow({
  icon,
  label,
  right,
  iconColor,
  onPress,
  last,
  colors,
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
      style={({ pressed }) => [styles.actionRow, { opacity: pressed ? 0.7 : 1 }]}
    >
      <Feather
        name={icon}
        size={20}
        color={iconColor ?? colors.foreground}
        style={styles.actionIcon}
      />
      <Text style={[styles.actionLabel, { color: iconColor ?? colors.foreground }]}>
        {label}
      </Text>
      {right && (
        <Text style={[styles.actionRight, { color: colors.mutedForeground }]}>{right}</Text>
      )}
      {!right && (
        <Feather name="chevron-right" size={16} color="rgba(250,240,238,0.25)" />
      )}
    </Pressable>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  modalRoot: {
    flex: 1,
    justifyContent: "flex-end",
  },
  backdrop: {
    flex: 1,
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
    backgroundColor: "rgba(74,12,12,0.08)",
    alignSelf: "center",
    marginBottom: 16,
  },
  videoHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 14,
  },
  videoThumb: {
    width: 76,
    height: 46,
    borderRadius: 8,
  },
  videoTitle: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 3,
  },
  videoAuthor: {
    fontFamily: "Manrope",
    fontSize: 13,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
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
  actionRight: {
    fontFamily: "Manrope",
    fontSize: 14,
    marginRight: 6,
  },
  toast: {
    flexDirection: "row",
    alignItems: "center",
    position: "absolute",
    bottom: 80,
    left: 20,
    right: 20,
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(61,14,22,0.40)",
  },
  toastText: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "600",
  },
});

const subStyles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  sheet: {
    backgroundColor: "#340D1A",
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
    fontFamily: "Manrope",
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
  emptyText: {
    fontFamily: "Manrope",
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
    fontFamily: "Manrope",
    flex: 1,
    fontSize: 15,
    fontWeight: "500",
  },
  rowCount: {
    fontFamily: "Manrope",
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
