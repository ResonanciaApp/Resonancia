import { Feather } from "@expo/vector-icons";
import { Image as ExpoImage } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Easing,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { VolumeSlider } from "@/components/VolumeSlider";
import { getSoundImage } from "@/config/sound-images";
import { useMixer } from "@/context/MixerContext";
import { getSoundById, hasSoundFile } from "@/data/sounds";

const ACCENT = "#F9F9F9";
const TRACK = "rgba(255,255,255,0.10)";

function formatRemaining(seconds: number | null): string {
  if (seconds == null) return "Sin límite";
  const s = Math.max(0, Math.floor(seconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(sec)}` : `${m}:${pad(sec)}`;
}

export default function InmersivoScreen() {
  const insets = useSafeAreaInsets();
  const { activeSounds, isPlaying, togglePlay, toggleSound, setVolume, sleepTimerRemaining, stopAll } =
    useMixer();

  const params = useLocalSearchParams<{ title?: string; baseId?: string; ambientId?: string }>();
  const baseId = typeof params.baseId === "string" && params.baseId ? params.baseId : undefined;
  const ambientId =
    typeof params.ambientId === "string" && params.ambientId ? params.ambientId : undefined;
  const title = typeof params.title === "string" ? params.title : undefined;

  // Mantener una referencia estable a stopAll para el cleanup de desmontaje.
  const stopAllRef = useRef(stopAll);
  stopAllRef.current = stopAll;

  // Sin un sonido base válido no hay experiencia que mostrar: limpiar cualquier
  // mezcla heredada y volver, en vez de quedar en una pantalla vacía.
  useEffect(() => {
    if (!baseId) {
      stopAll();
      if (router.canGoBack()) router.back();
    }
  }, [baseId, stopAll]);

  // El ambiente viene PRECARGADO en la sesión: se carga como segunda capa una
  // sola vez, en cuanto el sonido base ya está activo. `toggleSound` no se puede
  // encadenar en el mismo tick, por eso se agrega aquí (un ciclo después del base).
  const ambientAddedRef = useRef(false);
  useEffect(() => {
    if (ambientAddedRef.current || !ambientId || !baseId) return;
    if (!hasSoundFile(ambientId)) {
      ambientAddedRef.current = true;
      return;
    }
    if (activeSounds.some((s) => s.id === ambientId)) {
      ambientAddedRef.current = true;
      return;
    }
    if (activeSounds.some((s) => s.id === baseId)) {
      ambientAddedRef.current = true;
      toggleSound(ambientId);
    }
  }, [activeSounds, ambientId, baseId, toggleSound]);

  // Esta pantalla y "Mi Música" son secciones distintas: al cerrar la inmersiva
  // (back, swipe o timer agotado) se detiene la mezcla para que NO aparezca el
  // MiniPlayer "Mi mezcla" en las tabs.
  useEffect(() => {
    return () => {
      stopAllRef.current();
    };
  }, []);

  // Imagen de fondo estable = sonido base.
  const bgImage = baseId ? getSoundImage(baseId) : undefined;
  const headerName = (baseId && getSoundById(baseId)?.name) || title || "Sonido natural";

  // Si no queda ninguna capa (p. ej. timer terminó), volver a Música y Sonidos.
  // Se evita el disparo inicial con un guard.
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

  // Igual que Sonidos Ancestrales (cuencos + voz guía): el BASE suena fijo de
  // fondo y NO lleva barra de volumen. La única capa regulable es el ambiente
  // precargado (grillos, pájaros, etc.). El usuario no elige ni quita capas.
  const ambientLayers = activeSounds.filter((s) => s.id !== baseId);

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
          <LinearGradient colors={["#340D1A", "#190913"]} style={StyleSheet.absoluteFill} />
        )}
      </Animated.View>
      <LinearGradient
        colors={["rgba(27,6,15,0.55)", "rgba(27,6,15,0.35)", "rgba(27,6,15,0.92)"]}
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
          <LinearGradient
            colors={["#884D80", "#884D80"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
          <Feather
            name={isPlaying ? "pause" : "play"}
            size={36}
            color="#1B060F"
            style={isPlaying ? undefined : { marginLeft: 4 }}
          />
        </Pressable>
      </View>

      {/* Panel inferior: SOLO el volumen del ambiente precargado (sin picker,
          sin ícono ni nombre). Título centrado arriba de la barra. El base
          suena fijo y no se lista. Sin ambiente → no se muestra nada. */}
      {ambientLayers.length > 0 && (
        <View style={[styles.panel, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
          <Text style={styles.panelTitle}>Sonido ambiente</Text>

          <View style={{ gap: 14 }}>
            {ambientLayers.map((layer) => (
              <VolumeSlider
                key={layer.id}
                value={layer.volume}
                onChange={(v) => setVolume(layer.id, v)}
                color={ACCENT}
                trackColor={TRACK}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#210911" },

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
    fontFamily: "Manrope",
    color: "#c2c2c2",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 3,
  },
  headerTitle: {
    fontFamily: "Manrope",
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
    fontFamily: "Manrope",
    color: "#c2c2c2",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  remaining: {
    fontFamily: "Manrope",
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
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.3,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 8,
  },

  panel: {
    backgroundColor: "rgba(27,6,15,0.66)",
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderColor: "rgba(61,14,22,0.40)",
  },
  panelTitle: {
    fontFamily: "Manrope",
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 14,
  },
});
