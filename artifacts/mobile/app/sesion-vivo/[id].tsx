/**
 * Sala de video en vivo — Daily.co
 *
 * Modos de operación:
 * 1. Modo nativo SDK (tras instalar @daily-co/react-native-daily-js y rebuild):
 *    Ver comentario "SDK_NATIVE_INTEGRATION" para activarlo.
 * 2. Modo navegador (modo actual, sin rebuild): abre la dailyRoomUrl en el
 *    navegador del dispositivo. El usuario vuelve a la app al terminar y valora.
 *
 * Uso: navegar con params { roomUrl, sessionId, guideDisplayName }
 * router.push({ pathname: "/sesion-vivo/1", params: { roomUrl, guideDisplayName } })
 */
import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { router, useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Linking,
  Platform,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

/* ── SDK_NATIVE_INTEGRATION ────────────────────────────────────────────────────
 * Cuando se instale @daily-co/react-native-daily-js y se haga rebuild del dev
 * client, descomentar la siguiente línea y el bloque "SDK nativo" más abajo:
 *
 * import Daily, { DailyCall, DailyMediaView } from "@daily-co/react-native-daily-js";
 *
 * El tipo SDK_AVAILABLE cambia a true y la sala usa video nativo en vez del
 * navegador del dispositivo.
 * ─────────────────────────────────────────────────────────────────────────── */

const SDK_AVAILABLE = false; // Cambiar a true tras rebuild con SDK instalado

// ── Paleta (coherente con el resto de la app) ─────────────────────────────────
const WARM_BLACK = "#1B060F";
const BURGUNDY_MID = "#4A0C0C";
const PRIMARY_GOLD = "#D4AF37";
const ACCENT_GOLD = "#E9C46A";
const FOREGROUND = "#F4DAD5";
const MUTED = "rgba(242,231,228,0.55)";
const BORDER = "#3D0E16";
const DESTRUCTIVE = "#E63946";

const RATINGS_KEY = "@live_session_ratings";

// ── Tipos ─────────────────────────────────────────────────────────────────────
type Phase = "lobby" | "in-call" | "rating" | "done";

// ── Pantalla principal ────────────────────────────────────────────────────────
export default function SesionVivoScreen() {
  const { id, roomUrl, guideDisplayName } = useLocalSearchParams<{
    id: string;
    roomUrl?: string;
    guideDisplayName?: string;
  }>();
  const insets = useSafeAreaInsets();

  const [phase, setPhase] = useState<Phase>("lobby");
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const [openingRoom, setOpeningRoom] = useState(false);

  const [rating, setRating] = useState(0);
  const [note, setNote] = useState("");
  const [savingRating, setSavingRating] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const controlsAnim = useRef(new Animated.Value(1)).current;
  const hideControlsTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Animar fade in al entrar
  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, [fadeAnim]);

  const showControls = useCallback(() => {
    Animated.timing(controlsAnim, { toValue: 1, duration: 250, useNativeDriver: true }).start();
    if (hideControlsTimer.current) clearTimeout(hideControlsTimer.current);
    hideControlsTimer.current = setTimeout(() => {
      Animated.timing(controlsAnim, { toValue: 0, duration: 600, useNativeDriver: true }).start();
    }, 4000);
  }, [controlsAnim]);

  useEffect(() => {
    if (phase === "in-call") showControls();
  }, [phase, showControls]);

  // ── SDK_NATIVE_INTEGRATION — callObject lifecycle ─────────────────────────
  // Cuando SDK_AVAILABLE sea true y DailyCall esté importado, inicializar aquí:
  //
  // useEffect(() => {
  //   if (!SDK_AVAILABLE || !roomUrl) return;
  //   const call = Daily.createCallObject();
  //   call.join({ url: roomUrl });
  //   call.on("joined-meeting", () => setPhase("in-call"));
  //   call.on("left-meeting", () => setPhase("rating"));
  //   call.on("error", (e) => console.warn("daily error", e));
  //   return () => { call.leave(); call.destroy(); };
  // }, [roomUrl]);
  // ──────────────────────────────────────────────────────────────────────────

  const handleOpenInBrowser = useCallback(async () => {
    if (!roomUrl) return;
    setOpeningRoom(true);
    try {
      const canOpen = await Linking.canOpenURL(roomUrl);
      if (canOpen) {
        await Linking.openURL(roomUrl);
      }
    } catch {
      // fallo silencioso
    } finally {
      setOpeningRoom(false);
    }
  }, [roomUrl]);

  const handleLeave = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhase("rating");
  }, []);

  const handleToggleMic = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMicOn((v) => !v);
    // SDK_NATIVE_INTEGRATION: call.setLocalAudio(!micOn);
  }, []);

  const handleToggleCam = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCamOn((v) => !v);
    // SDK_NATIVE_INTEGRATION: call.setLocalVideo(!camOn);
  }, []);

  const handleSaveRating = useCallback(async () => {
    if (rating === 0) { router.back(); return; }
    setSavingRating(true);
    try {
      const raw = await AsyncStorage.getItem(RATINGS_KEY);
      const map: Record<string, { stars: number; note: string; date: string }> = raw
        ? JSON.parse(raw)
        : {};
      map[id ?? "unknown"] = {
        stars: rating,
        note: note.trim(),
        date: new Date().toISOString(),
      };
      await AsyncStorage.setItem(RATINGS_KEY, JSON.stringify(map));
    } catch {
      /* silencioso */
    }
    setSavingRating(false);
    router.back();
  }, [id, rating, note]);

  const topPad = insets.top + 12;
  const bottomPad = insets.bottom + 24;

  // ── Pantalla: valoración post-sesión ─────────────────────────────────────
  if (phase === "rating") {
    return (
      <View style={[styles.root, { paddingTop: topPad, paddingBottom: bottomPad }]}>
        <StatusBar hidden />
        <LinearGradient
          colors={[BURGUNDY_MID, WARM_BLACK, WARM_BLACK]}
          locations={[0, 0.35, 1]}
          style={StyleSheet.absoluteFill}
        />

        <Animated.View style={[styles.centeredContainer, { opacity: fadeAnim }]}>
          {/* Icono */}
          <View style={styles.iconCircle}>
            <Feather name="star" size={40} color={PRIMARY_GOLD} />
          </View>

          <Text style={styles.titleText}>
            ¿Cómo fue tu sesión
            {guideDisplayName ? ` con ${guideDisplayName}` : ""}?
          </Text>
          <Text style={styles.subtitleText}>Tu valoración nos ayuda a mejorar</Text>

          {/* Estrellas */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <Pressable
                key={star}
                onPress={() => {
                  setRating(star);
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }}
                hitSlop={8}
                style={styles.starBtn}
              >
                <Feather
                  name="star"
                  size={36}
                  color={star <= rating ? PRIMARY_GOLD : "rgba(212,175,55,0.2)"}
                />
              </Pressable>
            ))}
          </View>

          {/* Nota opcional */}
          <View style={styles.noteContainer}>
            <TextInput
              style={styles.noteInput}
              placeholder="Nota opcional (cómo te sentiste, qué aprendiste…)"
              placeholderTextColor={MUTED}
              value={note}
              onChangeText={setNote}
              multiline
              maxLength={280}
              returnKeyType="done"
              blurOnSubmit
            />
          </View>

          {/* Guardar */}
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={handleSaveRating}
            disabled={savingRating}
          >
            <LinearGradient
              colors={["#D6AD5F", "#B47344"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            {savingRating ? (
              <ActivityIndicator color={WARM_BLACK} size="small" />
            ) : (
              <Text style={styles.primaryBtnText}>
                {rating === 0 ? "Omitir" : "Guardar valoración"}
              </Text>
            )}
          </Pressable>

          <Pressable style={styles.skipBtn} onPress={() => router.back()}>
            <Text style={styles.skipText}>Saltar</Text>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  // ── SDK_NATIVE_INTEGRATION — sala de video nativa ─────────────────────────
  // Cuando SDK_AVAILABLE sea true y la sala esté conectada (phase === "in-call"):
  //
  // return (
  //   <Pressable style={styles.root} onPress={showControls}>
  //     <StatusBar hidden />
  //     <View style={[StyleSheet.absoluteFill, { backgroundColor: WARM_BLACK }]} />
  //     {/* Video del guiador pantalla completa */}
  //     {remoteParticipant && (
  //       <DailyMediaView sessionId={remoteParticipant.session_id}
  //         style={StyleSheet.absoluteFill} objectFit="cover" zOrder={0} />
  //     )}
  //     {/* Miniatura propia esquina inferior derecha */}
  //     {localParticipant && camOn && (
  //       <View style={[styles.selfView, { bottom: bottomPad + 80, right: 16 }]}>
  //         <DailyMediaView sessionId={localParticipant.session_id}
  //           style={{ width: "100%", height: "100%" }} objectFit="cover" mirror zOrder={1} />
  //       </View>
  //     )}
  //     <Animated.View style={[styles.callControls, { bottom: bottomPad, opacity: controlsAnim }]}>
  //       <Pressable style={[styles.controlBtn, !micOn && styles.controlBtnOff]} onPress={handleToggleMic}>
  //         <Feather name={micOn ? "mic" : "mic-off"} size={22} color={micOn ? FOREGROUND : MUTED} />
  //       </Pressable>
  //       <Pressable style={styles.leaveBtn} onPress={handleLeave}>
  //         <Feather name="phone-off" size={22} color="#fff" />
  //       </Pressable>
  //       <Pressable style={[styles.controlBtn, !camOn && styles.controlBtnOff]} onPress={handleToggleCam}>
  //         <Feather name={camOn ? "video" : "video-off"} size={22} color={camOn ? FOREGROUND : MUTED} />
  //       </Pressable>
  //     </Animated.View>
  //   </Pressable>
  // );
  // ──────────────────────────────────────────────────────────────────────────

  // ── Pantalla: lobby / enlace al navegador ─────────────────────────────────
  return (
    <View style={[styles.root, { paddingTop: topPad, paddingBottom: bottomPad }]}>
      <StatusBar hidden />
      <LinearGradient
        colors={[BURGUNDY_MID, WARM_BLACK, WARM_BLACK]}
        locations={[0, 0.3, 1]}
        style={StyleSheet.absoluteFill}
      />

      {/* Anillo de fondo decorativo */}
      <View style={styles.outerRing} />
      <View style={styles.innerRing} />

      <Animated.View style={[styles.centeredContainer, { opacity: fadeAnim }]}>
        {/* Botón cerrar */}
        <Pressable style={styles.closeBtn} onPress={() => router.back()} hitSlop={12}>
          <Feather name="x" size={24} color={FOREGROUND} />
        </Pressable>

        {/* Icono sala */}
        <View style={styles.iconCircle}>
          <LinearGradient
            colors={["rgba(212,175,55,0.15)", "rgba(212,175,55,0.05)"]}
            style={StyleSheet.absoluteFill}
          />
          <Feather name="video" size={36} color={PRIMARY_GOLD} />
        </View>

        <Text style={styles.titleText}>Sesión en vivo</Text>
        {guideDisplayName ? (
          <Text style={styles.subtitleText}>Con {guideDisplayName}</Text>
        ) : null}

        {/* Info estado */}
        {!SDK_AVAILABLE && (
          <View style={styles.infoCard}>
            <Feather name="info" size={13} color={ACCENT_GOLD} style={{ marginRight: 8, marginTop: 1 }} />
            <Text style={styles.infoText}>
              El video integrado estará disponible en la próxima actualización de la app.
              Por ahora la sala se abre en tu navegador.
            </Text>
          </View>
        )}

        {/* Controles de sala (mic/cam pre-sesión) */}
        <View style={styles.preCallControls}>
          <Pressable
            style={[styles.preCallBtn, !micOn && styles.preCallBtnOff]}
            onPress={handleToggleMic}
          >
            <Feather
              name={micOn ? "mic" : "mic-off"}
              size={20}
              color={micOn ? FOREGROUND : MUTED}
            />
            <Text style={[styles.preCallBtnLabel, !micOn && { color: MUTED }]}>
              {micOn ? "Micrófono activo" : "Silenciado"}
            </Text>
          </Pressable>

          <Pressable
            style={[styles.preCallBtn, !camOn && styles.preCallBtnOff]}
            onPress={handleToggleCam}
          >
            <Feather
              name={camOn ? "video" : "video-off"}
              size={20}
              color={camOn ? FOREGROUND : MUTED}
            />
            <Text style={[styles.preCallBtnLabel, !camOn && { color: MUTED }]}>
              {camOn ? "Cámara activa" : "Cámara off"}
            </Text>
          </Pressable>
        </View>

        {/* Botón entrar */}
        {roomUrl ? (
          <Pressable
            style={({ pressed }) => [styles.primaryBtn, { opacity: pressed ? 0.85 : 1 }]}
            onPress={handleOpenInBrowser}
            disabled={openingRoom}
          >
            <LinearGradient
              colors={["#D6AD5F", "#B47344"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
            {openingRoom ? (
              <ActivityIndicator color={WARM_BLACK} size="small" />
            ) : (
              <>
                <Feather name="external-link" size={16} color={WARM_BLACK} style={{ marginRight: 8 }} />
                <Text style={styles.primaryBtnText}>Entrar a la sala</Text>
              </>
            )}
          </Pressable>
        ) : (
          <View style={styles.noRoomCard}>
            <Feather name="alert-circle" size={16} color={MUTED} style={{ marginRight: 8 }} />
            <Text style={styles.noRoomText}>
              La sala aún no está configurada. Contacta a tu guiador.
            </Text>
          </View>
        )}

        {/* Link a valoración manual */}
        <Pressable style={styles.rateManualBtn} onPress={() => setPhase("rating")}>
          <Feather name="check-circle" size={14} color={MUTED} style={{ marginRight: 6 }} />
          <Text style={styles.rateManualText}>Ya terminé — quiero valorar la sesión</Text>
        </Pressable>
      </Animated.View>
    </View>
  );
}

// ── Estilos ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: WARM_BLACK,
  },

  // Decoración de fondo
  outerRing: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 170,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.07)",
    alignSelf: "center",
    top: "20%",
  },
  innerRing: {
    position: "absolute",
    width: 220,
    height: 220,
    borderRadius: 110,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.12)",
    alignSelf: "center",
    top: "26%",
  },

  // Contenedor principal centrado
  centeredContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 16,
  },

  closeBtn: {
    position: "absolute",
    top: 0,
    right: 0,
    padding: 12,
  },

  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.25)",
    overflow: "hidden",
    marginBottom: 8,
  },

  titleText: {
    color: FOREGROUND,
    fontSize: 22,
    fontFamily: "PlayfairDisplay_700Bold",
    textAlign: "center",
  },
  subtitleText: {
    color: MUTED,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },

  infoCard: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "rgba(74,12,12,0.35)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.15)",
    padding: 12,
    alignSelf: "stretch",
    marginTop: 4,
  },
  infoText: {
    flex: 1,
    color: MUTED,
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },

  // Controles pre-llamada (mic/cam toggle)
  preCallControls: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 4,
  },
  preCallBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "rgba(74,12,12,0.2)",
    borderWidth: 1,
    borderColor: BORDER,
  },
  preCallBtnOff: {
    backgroundColor: "rgba(61,14,22,0.35)",
    borderColor: "rgba(212,175,55,0.12)",
  },
  preCallBtnLabel: {
    color: FOREGROUND,
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },

  primaryBtn: {
    height: 54,
    borderRadius: 14,
    overflow: "hidden",
    alignSelf: "stretch",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  primaryBtnText: {
    color: WARM_BLACK,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },

  noRoomCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(74,12,12,0.3)",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
    alignSelf: "stretch",
    marginTop: 4,
  },
  noRoomText: {
    flex: 1,
    color: MUTED,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },

  rateManualBtn: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    marginTop: 4,
  },
  rateManualText: {
    color: MUTED,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },

  // Sala de video (para uso con SDK nativo)
  selfView: {
    position: "absolute",
    width: 100,
    height: 140,
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1.5,
    borderColor: PRIMARY_GOLD,
  },
  callControls: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 24,
    paddingHorizontal: 24,
  },
  controlBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(27,6,15,0.75)",
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: "center",
    justifyContent: "center",
  },
  controlBtnOff: {
    backgroundColor: "rgba(61,14,22,0.75)",
    borderColor: "rgba(212,175,55,0.25)",
  },
  leaveBtn: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: DESTRUCTIVE,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: DESTRUCTIVE,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 8,
    elevation: 8,
  },

  // Rating
  starsRow: {
    flexDirection: "row",
    gap: 12,
    marginVertical: 8,
  },
  starBtn: {
    padding: 4,
  },
  noteContainer: {
    alignSelf: "stretch",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    backgroundColor: "rgba(27,6,15,0.5)",
    paddingHorizontal: 14,
    paddingVertical: 10,
    minHeight: 90,
  },
  noteInput: {
    color: FOREGROUND,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
    textAlignVertical: "top",
  },
  skipBtn: {
    padding: 10,
  },
  skipText: {
    color: MUTED,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
});
