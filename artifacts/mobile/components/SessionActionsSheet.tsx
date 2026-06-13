/**
 * SessionActionsSheet — menú de acciones rápidas de una sesión (3 puntitos).
 *
 * Acciones:
 *  1. Compartir
 *  2. Temporizador  → abre TimerSheet
 *  3. Marcar como favorito / Quitar de favoritos
 *  4. Añadir a una carpeta → abre AddToFolderSheet
 */
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
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

import { AddToFolderSheet } from "@/components/AddToFolderSheet";
import { TimerSheet } from "@/components/TimerSheet";
import { BLUR_PLACEHOLDER, IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { usePlayer } from "@/context/PlayerContext";
import { type Session } from "@/data/sessions";
import { getGuideById } from "@/data/guides";
import { useColors } from "@/hooks/useColors";

type Props = {
  session: Session | null;
  visible: boolean;
  onClose: () => void;
};

export function SessionActionsSheet({ session, visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isFavorite, toggleFavorite, sleepTimerRemaining } = usePlayer();

  const [showTimer, setShowTimer] = useState(false);
  const [showFolder, setShowFolder] = useState(false);

  // Favorite toast
  const [toastVisible, setToastVisible] = useState(false);
  const [toastAdded, setToastAdded] = useState(true);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset sub-sheets when main sheet opens
  useEffect(() => {
    if (visible) {
      setShowTimer(false);
      setShowFolder(false);
    }
  }, [visible]);

  if (!session) return null;

  const favorited = isFavorite(session.id);
  const guide = session.guideId ? getGuideById(session.guideId) : null;
  const author = guide?.name ?? "Casa del Cuenco";

  const timerLabel =
    sleepTimerRemaining === null
      ? "Apagado"
      : sleepTimerRemaining >= 3600
        ? `${Math.round(sleepTimerRemaining / 3600)}h`
        : `${Math.round(sleepTimerRemaining / 60)} min`;

  // ── Actions ────────────────────────────────────────────────────────────────

  const showToast = (added: boolean) => {
    setToastAdded(added);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1400),
      Animated.timing(toastAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      setToastVisible(false);
    });
  };

  const handleShare = async () => {
    onClose();
    try {
      await Share.share({
        message: `"${session.title}" — ${session.durationLabel} · Resonancia`,
      });
    } catch {
      // silent
    }
  };

  const handleFavorite = () => {
    const willAdd = !favorited;
    toggleFavorite(session.id);
    showToast(willAdd);
    // Auto-close after toast
    toastTimer.current = setTimeout(onClose, 2000);
  };

  const handleFolder = () => {
    setShowFolder(true);
  };

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onClose}
        statusBarTranslucent
      >
        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={onClose} />

        {/* Sheet */}
        <View style={[styles.sheet, { paddingBottom: insets.bottom + 8 }]}>
          {/* Handle */}
          <View style={styles.handle} />

          {/* Session header */}
          <View style={styles.sessionHeader}>
            <Image
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              source={session.image as any}
              style={styles.sessionThumb}
              placeholder={BLUR_PLACEHOLDER}
              transition={IMAGE_TRANSITION}
              contentFit="cover"
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.sessionTitle, { color: colors.foreground }]} numberOfLines={2}>
                {session.title}
              </Text>
              <Text style={[styles.sessionAuthor, { color: colors.mutedForeground }]} numberOfLines={1}>
                {author} · {session.durationLabel}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: "rgba(61,14,22,0.40)" }]} />

          {/* ── Opciones ── */}
          <ActionRow
            icon="share"
            label="Compartir"
            onPress={handleShare}
            colors={colors}
          />
          <ActionRow
            icon="clock"
            label="Temporizador"
            right={timerLabel}
            onPress={() => setShowTimer(true)}
            colors={colors}
          />
          <ActionRow
            icon={favorited ? "heart" : "heart"}
            label={favorited ? "Quitar de favoritos" : "Marcar como favorito"}
            iconColor={favorited ? "#E05C5C" : undefined}
            onPress={handleFavorite}
            colors={colors}
          />
          <ActionRow
            icon="folder-plus"
            label="Añadir a una carpeta"
            onPress={handleFolder}
            colors={colors}
            last
          />

          {/* Favorite toast */}
          {toastVisible && (
            <Animated.View
              style={[
                styles.toast,
                {
                  backgroundColor: "rgba(27,6,15,0.96)",
                  opacity: toastAnim,
                  transform: [{ translateY: toastAnim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
                },
              ]}
            >
              <Feather
                name="heart"
                size={16}
                color={toastAdded ? "#E05C5C" : colors.mutedForeground}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.toastText, { color: colors.foreground }]}>
                {toastAdded ? "Guardado en Favoritos" : "Eliminado de Favoritos"}
              </Text>
            </Animated.View>
          )}
        </View>

        {/* Sub-sheet: Timer */}
        <TimerSheet
          visible={showTimer}
          onClose={() => setShowTimer(false)}
        />

        {/* Sub-sheet: Add to Folder */}
        {session && (
          <AddToFolderSheet
            visible={showFolder}
            sessionId={session.id}
            onClose={() => setShowFolder(false)}
          />
        )}
      </Modal>

    </>
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
      style={({ pressed }) => [
        styles.actionRow,
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(61,14,22,0.40)" },
        { opacity: pressed ? 0.7 : 1 },
      ]}
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
        <Feather name="chevron-right" size={16} color="rgba(242,231,228,0.25)" />
      )}
    </Pressable>
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
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    marginBottom: 14,
  },
  sessionThumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
  },
  sessionTitle: {
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
    marginBottom: 3,
  },
  sessionAuthor: {
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
  actionRight: {
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
    fontSize: 15,
    fontWeight: "600",
  },
});
