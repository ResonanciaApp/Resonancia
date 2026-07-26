/**
 * VideoActionsSheet — menú de acciones rápidas de un video (3 puntitos).
 *
 * Acciones:
 *  1. Compartir
 *  2. Temporizador  → abre TimerSheet (timer de VideosContext)
 *  3. Marcar como favorito / Quitar de favoritos
 *  4. Seguir profesor (solo si el video tiene guideId)
 *  5. Ver perfil del profesor (solo si el video tiene guideId)
 */
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TimerSheet } from "@/components/TimerSheet";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
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
    toggleVideoFavorite(video.id);
    onClose();
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

