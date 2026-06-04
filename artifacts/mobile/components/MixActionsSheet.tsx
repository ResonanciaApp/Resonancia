/**
 * MixActionsSheet — menú de acciones de una mezcla guardada (3 puntitos).
 *
 * Acciones:
 *  1. Compartir
 *  2. Temporizador  → abre TimerSheet
 *  3. Marcar como favorita / Quitar de favoritas
 *  4. Duplicar
 *  5. Eliminar
 */
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Modal,
  Pressable,
  Share,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { TimerSheet } from "@/components/TimerSheet";
import { getSoundImage } from "@/config/sound-images";
import { type MixPreset, useMixer } from "@/context/MixerContext";
import { useColors } from "@/hooks/useColors";

type Props = {
  mix: MixPreset | null;
  visible: boolean;
  onClose: () => void;
  onDuplicate: (mix: MixPreset) => void;
  onDelete: (mix: MixPreset) => void;
};

const THUMB = 40;
const SHIFT = 24;
const MAX_STACK = 4;

function MiniStack({ sounds }: { sounds: { id: string }[] }) {
  const visible = sounds.slice(0, MAX_STACK);
  const stackWidth = THUMB + Math.max(0, visible.length - 1) * SHIFT;
  return (
    <View style={{ width: stackWidth, height: THUMB, position: "relative" }}>
      {visible.map((s, i) => {
        const img = getSoundImage(s.id);
        return (
          <View
            key={s.id}
            style={[
              styles.stackThumb,
              { left: i * SHIFT, zIndex: i },
            ]}
          >
            {img ? (
              <Image source={img} style={styles.stackThumbImg} resizeMode="cover" />
            ) : (
              <View style={[styles.stackThumbImg, { backgroundColor: "rgba(182,149,95,0.15)" }]} />
            )}
          </View>
        );
      })}
    </View>
  );
}

export function MixActionsSheet({ mix, visible, onClose, onDuplicate, onDelete }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { togglePresetFavorite, sleepTimerRemaining } = useMixer();

  const [showTimer, setShowTimer] = useState(false);

  const [toastVisible, setToastVisible] = useState(false);
  const [toastAdded, setToastAdded] = useState(true);
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) setShowTimer(false);
  }, [visible]);

  if (!mix) return null;

  const favorited = mix.favorited ?? false;

  const timerLabel =
    sleepTimerRemaining === null
      ? "Apagado"
      : sleepTimerRemaining >= 3600
        ? `${Math.round(sleepTimerRemaining / 3600)}h`
        : `${Math.round(sleepTimerRemaining / 60)} min`;

  const showToast = (added: boolean) => {
    setToastAdded(added);
    setToastVisible(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    Animated.sequence([
      Animated.timing(toastAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
      Animated.delay(1400),
      Animated.timing(toastAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setToastVisible(false));
  };

  const handleShare = async () => {
    onClose();
    try {
      await Share.share({ message: `"${mix.name}" — mezcla de Resonancia` });
    } catch {
      // silent
    }
  };

  const handleFavorite = () => {
    const willAdd = !favorited;
    togglePresetFavorite(mix.id);
    showToast(willAdd);
    toastTimer.current = setTimeout(onClose, 2000);
  };

  const handleDelete = () => {
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
    <>
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

          {/* Cabecera */}
          <View style={styles.header}>
            <MiniStack sounds={mix.sounds} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.mixName, { color: colors.foreground }]} numberOfLines={2}>
                {mix.name}
              </Text>
              <Text style={[styles.mixMeta, { color: colors.mutedForeground }]}>
                {mix.sounds.length} sonido{mix.sounds.length !== 1 ? "s" : ""}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Feather name="x" size={20} color={colors.mutedForeground} />
            </Pressable>
          </View>

          <View style={[styles.divider, { backgroundColor: "rgba(255,255,255,0.07)" }]} />

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
            label={favorited ? "Quitar de favoritas" : "Marcar como favorita"}
            iconColor={favorited ? "#E05C5C" : undefined}
            onPress={handleFavorite}
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
              <Feather
                name="heart"
                size={16}
                color={toastAdded ? "#E05C5C" : colors.mutedForeground}
                style={{ marginRight: 8 }}
              />
              <Text style={[styles.toastText, { color: colors.foreground }]}>
                {toastAdded ? "Guardada en Favoritas" : "Eliminada de Favoritas"}
              </Text>
            </Animated.View>
          )}
        </View>

        <TimerSheet visible={showTimer} onClose={() => setShowTimer(false)} />
      </Modal>
    </>
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
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(255,255,255,0.07)" },
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Feather name={icon} size={20} color={iconColor ?? colors.foreground} style={styles.actionIcon} />
      <Text style={[styles.actionLabel, { color: iconColor ?? colors.foreground }]}>{label}</Text>
      {right ? (
        <Text style={[styles.actionRight, { color: colors.mutedForeground }]}>{right}</Text>
      ) : (
        <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.2)" />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: {
    backgroundColor: "#151A23",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    overflow: "hidden",
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignSelf: "center", marginBottom: 16,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 14 },
  mixName: { fontSize: 15, fontWeight: "700", lineHeight: 20, marginBottom: 3 },
  mixMeta: { fontSize: 13 },
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
  actionLabel: { flex: 1, fontSize: 16 },
  actionRight: { fontSize: 14, marginRight: 6 },
  toast: {
    flexDirection: "row", alignItems: "center",
    position: "absolute", bottom: 80, left: 20, right: 20,
    borderRadius: 14, paddingVertical: 14, paddingHorizontal: 16,
    borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(255,255,255,0.1)",
  },
  toastText: { fontSize: 15, fontWeight: "600" },
});
