/**
 * MixActionsSheet — menú de acciones de una mezcla guardada (3 puntitos).
 *
 * Acciones:
 *  1. Compartir
 *  2. Temporizador  → abre TimerSheet (dentro del mismo Modal, igual que SessionActionsSheet)
 *  3. Marcar como favorita / Quitar de favoritas
 *  4. Añadir a una carpeta   → "Próximamente"
 *  5. Añadir al Playlist     → "Próximamente"
 *  6. Duplicar
 *  7. Eliminar
 */
import { Feather } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import RAnimated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useQueryClient } from "@tanstack/react-query";
import { useShareMix, getGetSharedMixesQueryKey } from "@workspace/api-client-react";
import { getSoundImage } from "@/config/sound-images";
import { type MixPreset, useMixer } from "@/context/MixerContext";
import { useColors } from "@/hooks/useColors";

type Props = {
  mix: MixPreset | null;
  visible: boolean;
  onClose: () => void;
  onDuplicate: (mix: MixPreset) => void;
  onDelete: (mix: MixPreset) => void;
  onEdit?: (mix: MixPreset) => void;
};

const THUMB = 40;
const SHIFT_CLOSED = 24;
const SHIFT_OPEN = 58;
const MAX_STACK = 4;
const SPRING_CFG = { damping: 16, stiffness: 200 } as const;

function MiniStack({ sounds }: { sounds: { id: string }[] }) {
  const visible = sounds.slice(0, MAX_STACK);
  const count = visible.length;

  const isOpen = useSharedValue(false);
  const collapseTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => { if (collapseTimer.current) clearTimeout(collapseTimer.current); }, []);

  // Un animated style por slot (máx 4). Hooks no pueden estar en loops.
  const a0 = useAnimatedStyle(() => ({ left: withSpring(isOpen.value ? 0 * SHIFT_OPEN : 0 * SHIFT_CLOSED, SPRING_CFG) }));
  const a1 = useAnimatedStyle(() => ({ left: withSpring(isOpen.value ? 1 * SHIFT_OPEN : 1 * SHIFT_CLOSED, SPRING_CFG) }));
  const a2 = useAnimatedStyle(() => ({ left: withSpring(isOpen.value ? 2 * SHIFT_OPEN : 2 * SHIFT_CLOSED, SPRING_CFG) }));
  const a3 = useAnimatedStyle(() => ({ left: withSpring(isOpen.value ? 3 * SHIFT_OPEN : 3 * SHIFT_CLOSED, SPRING_CFG) }));
  const slotStyles = [a0, a1, a2, a3];

  // El contenedor crece junto con el spread para no recortar los thumbs
  const containerStyle = useAnimatedStyle(() => {
    const naturalW = THUMB + Math.max(0, count - 1) * SHIFT_CLOSED;
    const openW    = THUMB + Math.max(0, count - 1) * SHIFT_OPEN;
    return { width: withSpring(isOpen.value ? openW : naturalW, SPRING_CFG) };
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

export function MixActionsSheet({ mix, visible, onClose, onDuplicate, onDelete, onEdit }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { togglePresetFavorite } = useMixer();
  const queryClient = useQueryClient();
  const shareMixMutation = useShareMix();

  const [toastVisible, setToastVisible] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const toastAnim = useRef(new Animated.Value(0)).current;
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      setToastVisible(false);
    }
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
      if (closeTimer.current) clearTimeout(closeTimer.current);
    };
  }, [visible]);

  if (!mix) return null;

  const favorited = mix.favorited ?? false;

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
    if (shareMixMutation.isPending) return;
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
    const willAdd = !favorited;
    togglePresetFavorite(mix.id);
    showToast(willAdd ? "Guardada en Favoritas" : "Eliminada de Favoritas", true);
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

        <View style={[styles.divider, { backgroundColor: "rgba(61,14,22,0.40)" }]} />

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
        !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: "rgba(61,14,22,0.40)" },
        { opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Feather name={icon} size={20} color={iconColor ?? colors.foreground} style={styles.actionIcon} />
      <Text style={[styles.actionLabel, { color: iconColor ?? colors.foreground }]}>{label}</Text>
      {right ? (
        <Text style={[styles.actionRight, { color: colors.mutedForeground }]}>{right}</Text>
      ) : (
        <Feather name="chevron-right" size={16} color="rgba(244,218,213,0.25)" />
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.55)" },
  sheet: {
    position: "absolute",
    bottom: 0, left: 0, right: 0,
    backgroundColor: "#27070E",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    overflow: "hidden",
  },
  handle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.5)",
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
    borderWidth: StyleSheet.hairlineWidth, borderColor: "rgba(61,14,22,0.40)",
  },
  toastText: { fontSize: 15, fontWeight: "600" },
});
