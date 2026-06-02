import { Feather, Ionicons } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  Easing,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { VolumeSlider } from "@/components/VolumeSlider";
import { getSoundImage } from "@/config/sound-images";
import { useMixer } from "@/context/MixerContext";
import { usePremium } from "@/context/PremiumContext";
import {
  getSoundById,
  getSoundsByCategory,
  hasSoundFile,
  type MixSound,
  type SoundCategoryId,
} from "@/data/sounds";

const { width } = Dimensions.get("window");

const ACCENT = "#A8C4A8";
const TRACK = "rgba(255,255,255,0.16)";

/** Categorías que se ofrecen para sumar capas en la experiencia naturaleza. */
const PICKER_CATEGORIES: { id: SoundCategoryId; label: string }[] = [
  { id: "naturaleza", label: "Naturaleza" },
  { id: "agua", label: "Agua" },
  { id: "ruidos", label: "Ruidos" },
];

function formatRemaining(seconds: number | null): string {
  if (seconds == null) return "Sin límite";
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

function SoundIcon({ sound, size, color }: { sound: MixSound; size: number; color: string }) {
  if (sound.iconSet === "ionicons") {
    return <Ionicons name={sound.icon as never} size={size} color={color} />;
  }
  return <Feather name={sound.icon as never} size={size} color={color} />;
}

export default function InmersivoScreen() {
  const insets = useSafeAreaInsets();
  const { isPremium } = usePremium();
  const { activeSounds, isPlaying, togglePlay, toggleSound, setVolume, sleepTimerRemaining, stopAll } =
    useMixer();

  const params = useLocalSearchParams<{ title?: string; baseId?: string; extras?: string }>();
  const baseId = typeof params.baseId === "string" && params.baseId ? params.baseId : undefined;
  const title = typeof params.title === "string" ? params.title : undefined;

  // Sin un sonido base válido no hay experiencia que mostrar: limpiar cualquier
  // mezcla heredada y volver, en vez de quedar en una pantalla vacía.
  useEffect(() => {
    if (!baseId) {
      stopAll();
      if (router.canGoBack()) router.back();
    }
  }, [baseId, stopAll]);

  // Imagen de fondo estable = sonido base.
  const bgImage = baseId ? getSoundImage(baseId) : undefined;
  const headerName = (baseId && getSoundById(baseId)?.name) || title || "Sonido natural";

  // Capas extra a sumar al montar (p. ej. pájaros sobre el río). Se agregan de
  // a una por ciclo de render porque toggleSound no se puede encadenar.
  const pendingExtrasRef = useRef<string[]>(
    (() => {
      try {
        const raw = typeof params.extras === "string" ? params.extras : "[]";
        const arr = JSON.parse(raw);
        return Array.isArray(arr) ? arr.filter((x) => typeof x === "string") : [];
      } catch {
        return [];
      }
    })(),
  );

  useEffect(() => {
    if (pendingExtrasRef.current.length === 0) return;
    const next = pendingExtrasRef.current[0];
    pendingExtrasRef.current = pendingExtrasRef.current.slice(1);
    if (next && !activeSounds.some((s) => s.id === next)) {
      toggleSound(next);
    }
  }, [activeSounds, toggleSound]);

  // Si no queda ninguna capa (timer terminó o el usuario las quitó todas),
  // volver a Música y Sonidos. Se evita el disparo inicial con un guard.
  const sawSoundRef = useRef(false);
  useEffect(() => {
    if (activeSounds.length > 0) sawSoundRef.current = true;
    else if (sawSoundRef.current && router.canGoBack()) router.back();
  }, [activeSounds.length]);

  // Fondo con zoom lento (parallax sutil).
  const scale = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.12,
          duration: 18000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 18000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [scale]);

  const [pickerOpen, setPickerOpen] = useState(false);

  const activeLabel = useMemo(() => {
    const names = activeSounds
      .map((s) => getSoundById(s.id)?.name)
      .filter((n): n is string => !!n);
    return names.join(" · ");
  }, [activeSounds]);

  const pickerSounds = useMemo(
    () => PICKER_CATEGORIES.map((c) => ({ ...c, sounds: getSoundsByCategory(c.id) })),
    [],
  );

  const handleAddLayer = (sound: MixSound) => {
    if (!hasSoundFile(sound.id)) return;
    const already = activeSounds.some((s) => s.id === sound.id);
    if (!already && sound.isPremium && !isPremium) {
      setPickerOpen(false);
      router.push("/membresia" as never);
      return;
    }
    toggleSound(sound.id);
  };

  return (
    <View style={styles.root}>
      <StatusBar hidden />

      {/* Fondo animado */}
      <Animated.View style={[StyleSheet.absoluteFill, { transform: [{ scale }] }]}>
        {bgImage ? (
          <ExpoImage
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            source={bgImage as any}
            style={StyleSheet.absoluteFill}
            contentFit="cover"
            cachePolicy="memory-disk"
          />
        ) : (
          <View style={[StyleSheet.absoluteFill, { backgroundColor: "#0B130A" }]} />
        )}
      </Animated.View>
      <LinearGradient
        colors={["rgba(6,11,6,0.55)", "rgba(6,11,6,0.35)", "rgba(6,11,6,0.92)"]}
        locations={[0, 0.45, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.iconBtn} hitSlop={10}>
          <Feather name="chevron-down" size={26} color="#FFFFFF" />
        </Pressable>
        <View style={styles.headerCenter}>
          <Text style={styles.headerKicker}>SONIDOS NATURALEZA</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {headerName}
          </Text>
        </View>
        <View style={styles.iconBtn} />
      </View>

      {/* Centro: tiempo restante + play/pausa */}
      <View style={styles.center}>
        <Text style={styles.remainingLabel}>
          {sleepTimerRemaining == null ? "Reproduciendo" : "Tiempo restante"}
        </Text>
        <Text style={styles.remaining}>{formatRemaining(sleepTimerRemaining)}</Text>

        <Pressable
          onPress={togglePlay}
          style={({ pressed }) => [styles.playBtn, { opacity: pressed ? 0.85 : 1 }]}
        >
          <Feather
            name={isPlaying ? "pause" : "play"}
            size={36}
            color="#0B130A"
            style={isPlaying ? undefined : { marginLeft: 4 }}
          />
        </Pressable>
      </View>

      {/* Panel inferior: mezclador de capas */}
      <View style={[styles.panel, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <View style={styles.panelTop}>
          <View style={{ flex: 1 }}>
            <Text style={styles.panelTitle}>Mezcla</Text>
            {!!activeLabel && (
              <Text style={styles.panelSub} numberOfLines={1}>
                Sonando: {activeLabel}
              </Text>
            )}
          </View>
          <Pressable
            onPress={() => setPickerOpen(true)}
            style={({ pressed }) => [styles.addBtn, { opacity: pressed ? 0.85 : 1 }]}
          >
            <Feather name="plus" size={16} color="#0B130A" />
            <Text style={styles.addBtnText}>Sonido</Text>
          </Pressable>
        </View>

        <ScrollView
          style={{ maxHeight: 184 }}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ gap: 12, paddingTop: 4 }}
        >
          {activeSounds.map((layer) => {
            const sound = getSoundById(layer.id);
            if (!sound) return null;
            return (
              <View key={layer.id} style={styles.layerRow}>
                <View style={styles.layerIcon}>
                  <SoundIcon sound={sound} size={16} color={ACCENT} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.layerName} numberOfLines={1}>
                    {sound.name}
                  </Text>
                  <VolumeSlider
                    value={layer.volume}
                    onChange={(v) => setVolume(layer.id, v)}
                    color={ACCENT}
                    trackColor={TRACK}
                  />
                </View>
                <Pressable
                  onPress={() => toggleSound(layer.id)}
                  style={styles.layerRemove}
                  hitSlop={8}
                >
                  <Feather name="x" size={16} color="rgba(255,255,255,0.6)" />
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      </View>

      {/* Picker de sonidos para sumar capas */}
      <Modal
        visible={pickerOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => setPickerOpen(false)}
      >
        <TouchableWithoutFeedback onPress={() => setPickerOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 24) + 8 }]}>
                <View style={styles.dragHandle} />
                <Text style={styles.modalTitle}>Agregar un sonido</Text>
                <Text style={styles.modalHint}>Suma capas para crear tu mezcla</Text>

                <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                  {pickerSounds.map((cat) => (
                    <View key={cat.id} style={{ marginBottom: 18 }}>
                      <Text style={styles.catLabel}>{cat.label}</Text>
                      <View style={styles.pickerGrid}>
                        {cat.sounds.map((sound) => {
                          const active = activeSounds.some((s) => s.id === sound.id);
                          const available = hasSoundFile(sound.id);
                          const locked = !!sound.isPremium && !isPremium;
                          return (
                            <Pressable
                              key={sound.id}
                              disabled={!available}
                              onPress={() => handleAddLayer(sound)}
                              style={({ pressed }) => [
                                styles.pickerItem,
                                {
                                  backgroundColor: active
                                    ? "rgba(168,196,168,0.22)"
                                    : "rgba(255,255,255,0.06)",
                                  borderColor: active ? ACCENT : "rgba(255,255,255,0.1)",
                                  opacity: !available ? 0.4 : pressed ? 0.8 : 1,
                                },
                              ]}
                            >
                              <SoundIcon
                                sound={sound}
                                size={18}
                                color={active ? ACCENT : "#E8F5E0"}
                              />
                              <Text style={styles.pickerName} numberOfLines={1}>
                                {sound.name}
                              </Text>
                              {!available ? (
                                <Text style={styles.pickerTag}>Próximamente</Text>
                              ) : locked ? (
                                <Feather name="lock" size={11} color="#D6A85B" />
                              ) : active ? (
                                <Feather name="check" size={13} color={ACCENT} />
                              ) : null}
                            </Pressable>
                          );
                        })}
                      </View>
                    </View>
                  ))}
                </ScrollView>

                <Pressable style={styles.doneBtn} onPress={() => setPickerOpen(false)}>
                  <Text style={styles.doneText}>Listo</Text>
                </Pressable>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#060B06" },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1, alignItems: "center" },
  headerKicker: {
    color: "rgba(232,245,224,0.6)",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  headerTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
    letterSpacing: 0.2,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  remainingLabel: {
    color: "rgba(232,245,224,0.65)",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  remaining: {
    color: "#FFFFFF",
    fontSize: 52,
    fontWeight: "200",
    letterSpacing: 1,
    marginBottom: 28,
    fontVariant: ["tabular-nums"],
  },
  playBtn: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: "#E8F5E0",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },

  panel: {
    backgroundColor: "rgba(10,18,9,0.66)",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: "rgba(168,196,168,0.14)",
  },
  panelTop: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  panelTitle: { color: "#FFFFFF", fontSize: 16, fontWeight: "700" },
  panelSub: { color: "rgba(232,245,224,0.6)", fontSize: 12, marginTop: 2 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: ACCENT,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  addBtnText: { color: "#0B130A", fontSize: 13, fontWeight: "700" },

  layerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  layerIcon: {
    width: 34,
    height: 34,
    borderRadius: 12,
    backgroundColor: "rgba(168,196,168,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  layerName: {
    color: "#E8F5E0",
    fontSize: 12,
    fontWeight: "600",
    marginBottom: 6,
  },
  layerRemove: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "flex-end",
  },
  modalSheet: {
    backgroundColor: "rgba(16,26,15,0.99)",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 22,
    paddingTop: 12,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(160,200,140,0.35)",
    alignSelf: "center",
    marginBottom: 18,
  },
  modalTitle: { color: "#FFFFFF", fontSize: 20, fontWeight: "700", marginBottom: 2 },
  modalHint: { color: "rgba(232,245,224,0.6)", fontSize: 12, marginBottom: 18 },
  catLabel: {
    color: ACCENT,
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginBottom: 10,
    textTransform: "uppercase",
  },
  pickerGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    width: (width - 44 - 8) / 2,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 14,
    borderWidth: 1,
  },
  pickerName: { color: "#E8F5E0", fontSize: 13, fontWeight: "600", flex: 1 },
  pickerTag: { color: "rgba(232,245,224,0.5)", fontSize: 9, fontWeight: "600" },
  doneBtn: {
    backgroundColor: ACCENT,
    borderRadius: 16,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 6,
  },
  doneText: { color: "#0B130A", fontSize: 15, fontWeight: "700" },
});
