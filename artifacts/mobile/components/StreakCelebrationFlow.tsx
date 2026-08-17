import AsyncStorage from "@react-native-async-storage/async-storage";
import { Feather, Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";

import {
  REMINDER_SLOT_KEY,
  useStreakCelebration,
} from "@/context/StreakCelebrationContext";
import { usePlayer } from "@/context/PlayerContext";
import { getSessionById } from "@/data/sessions";
import { getArtistById } from "@/data/artists";
import { computeWeekFlags } from "@/utils/stats";

// ── Flujo de celebración al completar el día de racha ───────────────────────
// Pantalla 1: "Día N: ¡Excelente!" + contador circular + semana + Continuar.
// Pantalla 2: recordatorio (Mañana/Tarde/Noche) + calificación de la sesión.
// Marca RESONANCIA: azul marino + dorado.

const NAVY_TOP = "#101A38";
const NAVY_BOTTOM = "#060A0F";
const GOLD = "#BE9650";
const GOLD_BRIGHT = "#D8B675";

const RATINGS_KEY = "@resonance_ratings";
const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];
const GOAL_DAYS = 7;

const RING_SIZE = 150;
const RING_STROKE = 9;
const RING_R = (RING_SIZE - RING_STROKE) / 2;
const RING_C = 2 * Math.PI * RING_R;

type ReminderSlot = "manana" | "tarde" | "noche";
const SLOTS: { id: ReminderSlot; label: string }[] = [
  { id: "manana", label: "Mañana" },
  { id: "tarde", label: "Tarde" },
  { id: "noche", label: "Noche" },
];

export function StreakCelebrationFlow() {
  const { flow, closeFlow } = useStreakCelebration();
  const { statEvents, isFavorite, toggleFavorite } = usePlayer();
  const insets = useSafeAreaInsets();
  const topPad = Math.max(insets.top, 40);

  const [page, setPage] = useState<1 | 2>(1);
  const [slot, setSlot] = useState<ReminderSlot | null>(null);
  const [stars, setStars] = useState(0);
  const [rated, setRated] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Reset al abrir un flujo nuevo
  useEffect(() => {
    if (flow) {
      setPage(1);
      setSlot(null);
      setStars(0);
      setRated(false);
      AsyncStorage.getItem(REMINDER_SLOT_KEY)
        .then((v) => {
          if (v === "manana" || v === "tarde" || v === "noche") setSlot(v);
        })
        .catch(() => {});
    }
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    };
  }, [flow]);

  const week = useMemo(() => computeWeekFlags(statEvents), [statEvents]);

  const weekMessage = useMemo(() => {
    const n = week.weekCount;
    if (n <= 1)
      return "¡Empezaste muy bien! Completa dos días más esta semana para no perder tu racha.";
    if (n < GOAL_DAYS) return `¡Completaste ${n} días esta semana! Sigue así.`;
    return "¡Semana completa! 7 de 7 días, increíble.";
  }, [week.weekCount]);

  if (!flow) return null;

  const session = getSessionById(flow.sessionId);
  const artist = getArtistById(session?.artistId);
  const subtitle = [session?.categoryLabel, artist?.name].filter(Boolean).join(" • ");
  const ringProgress = Math.min(week.weekCount / GOAL_DAYS, 1);

  const pickSlot = (s: ReminderSlot) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSlot(s);
    void AsyncStorage.setItem(REMINDER_SLOT_KEY, s);
    // Punto de enganche: aquí se definirá más adelante qué pasa al elegir
    // un horario (programación de la notificación, etc.).
  };

  const submitRating = async () => {
    if (stars === 0 || rated) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const raw = await AsyncStorage.getItem(RATINGS_KEY);
      const map: Record<string, number> = raw ? JSON.parse(raw) : {};
      map[flow.sessionId] = stars;
      await AsyncStorage.setItem(RATINGS_KEY, JSON.stringify(map));
    } catch {}
    setRated(true);
    closeTimerRef.current = setTimeout(closeFlow, 1100);
  };

  return (
    <Modal visible transparent animationType="fade" onRequestClose={closeFlow}>
      <LinearGradient
        colors={[NAVY_TOP, NAVY_BOTTOM]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      {page === 1 ? (
        <View style={[styles.page1, { paddingTop: topPad + 40, paddingBottom: Math.max(insets.bottom, 20) + 16 }]}>
          <Text style={styles.day1Title}>
            Día {flow.streak}: {flow.streak === 1 ? "¡Excelente!" : "¡Magnífico!"}
          </Text>

          {/* Contador circular */}
          <View style={styles.ringWrap}>
            <Svg width={RING_SIZE} height={RING_SIZE}>
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_R}
                stroke="rgba(255,255,255,0.16)"
                strokeWidth={RING_STROKE}
                fill="none"
              />
              <Circle
                cx={RING_SIZE / 2}
                cy={RING_SIZE / 2}
                r={RING_R}
                stroke={GOLD_BRIGHT}
                strokeWidth={RING_STROKE}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${RING_C}`}
                strokeDashoffset={RING_C * (1 - Math.max(ringProgress, 0.06))}
                transform={`rotate(-90 ${RING_SIZE / 2} ${RING_SIZE / 2})`}
              />
            </Svg>
            <View style={styles.ringCenter}>
              <Text style={styles.ringNumber}>{flow.streak}</Text>
              <Text style={styles.ringLabel}>{flow.streak === 1 ? "Día" : "Días"}</Text>
            </View>
          </View>

          {/* Días de la semana */}
          <View style={styles.weekRow}>
            {DAY_LABELS.map((label, i) => {
              const met = week.flags[i];
              const isToday = i === week.todayIndex;
              return (
                <View key={i} style={styles.dayCol}>
                  <View
                    style={[
                      styles.dayCircle,
                      met && styles.dayCircleMet,
                      !met && isToday && styles.dayCircleToday,
                    ]}
                  >
                    {met ? <Feather name="check" size={17} color="#FFF" /> : null}
                  </View>
                  <Text style={[styles.dayLabel, (met || isToday) && styles.dayLabelActive]}>
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>

          <Text style={styles.weekMessage}>{weekMessage}</Text>

          <View style={{ flex: 1 }} />
          <Pressable
            onPress={() => setPage(2)}
            style={({ pressed }) => [styles.continueBtn, pressed && { opacity: 0.85 }]}
          >
            <Text style={styles.continueText}>Continuar</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ flex: 1 }}>
          {/* Header sticky */}
          <View style={[styles.header, { paddingTop: topPad }]}>
            <Pressable onPress={closeFlow} style={styles.headerBtn} hitSlop={8}>
              <Feather name="x" size={22} color="#FFF" />
            </Pressable>
            <Text style={styles.headerTitle}>¡Muy bien!</Text>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                toggleFavorite(flow.sessionId);
              }}
              style={styles.headerBtn}
              hitSlop={8}
            >
              <Ionicons
                name={isFavorite(flow.sessionId) ? "heart" : "heart-outline"}
                size={22}
                color={isFavorite(flow.sessionId) ? GOLD_BRIGHT : "#FFF"}
              />
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 28, paddingBottom: Math.max(insets.bottom, 20) + 24 }}
            showsVerticalScrollIndicator={false}
          >
            {/* Sesión */}
            {session ? (
              <>
                <Image source={session.image} style={styles.sessionImage} resizeMode="cover" />
                <Text style={styles.sessionTitle}>{session.title}</Text>
                {subtitle ? <Text style={styles.sessionSubtitle}>{subtitle}</Text> : null}
              </>
            ) : null}

            {/* Recordatorio */}
            <View style={styles.bellCircle}>
              <Feather name="bell" size={22} color="#FFF" />
            </View>
            <Text style={styles.reminderTitle}>
              Establece un recordatorio de expansión de consciencia
            </Text>
            <Text style={styles.reminderText}>
              ¡Excelente trabajo! Completaste{" "}
              <Text style={{ fontStyle: "italic", color: "#FFF" }}>
                {flow.minutes} {flow.minutes === 1 ? "minuto" : "minutos"}
              </Text>
              . ¿Cuál es el mejor horario para continuar con tu progreso?
            </Text>
            {SLOTS.map((s) => {
              const selected = slot === s.id;
              return (
                <Pressable
                  key={s.id}
                  onPress={() => pickSlot(s.id)}
                  style={({ pressed }) => [
                    styles.slotBtn,
                    selected && styles.slotBtnSelected,
                    pressed && { opacity: 0.85 },
                  ]}
                >
                  <Text style={[styles.slotText, selected && styles.slotTextSelected]}>
                    {s.label}
                  </Text>
                </Pressable>
              );
            })}

            <View style={styles.divider} />

            {/* Calificación */}
            <Text style={styles.rateTitle}>Califica esta sesión</Text>
            {session ? (
              <View style={styles.rateImageWrap}>
                <Image source={session.image} style={styles.rateImage} resizeMode="cover" />
                <View style={styles.rateImageOverlay}>
                  <Text style={styles.rateImageLabel}>
                    {flow.minutes} {flow.minutes === 1 ? "minuto" : "minutos"}
                  </Text>
                </View>
              </View>
            ) : null}
            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((n) => (
                <Pressable
                  key={n}
                  onPress={() => {
                    if (rated) return;
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setStars(n);
                  }}
                  hitSlop={6}
                >
                  <Ionicons
                    name={n <= stars ? "star" : "star-outline"}
                    size={34}
                    color={GOLD_BRIGHT}
                  />
                </Pressable>
              ))}
            </View>
            <Pressable
              onPress={submitRating}
              disabled={stars === 0 || rated}
              style={({ pressed }) => [
                styles.rateBtn,
                stars === 0 && !rated && { opacity: 0.45 },
                pressed && { opacity: 0.85 },
              ]}
            >
              <Text style={styles.rateBtnText}>
                {rated ? "¡Gracias por tu calificación!" : "Calificar la sesión"}
              </Text>
            </Pressable>
          </ScrollView>
        </View>
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  // ── Página 1 ──
  page1: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 28,
  },
  day1Title: {
    fontFamily: "Manrope",
    fontSize: 32,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
  },
  ringWrap: {
    marginTop: 44,
    width: RING_SIZE,
    height: RING_SIZE,
    alignItems: "center",
    justifyContent: "center",
  },
  ringCenter: {
    position: "absolute",
    alignItems: "center",
  },
  ringNumber: {
    fontFamily: "Manrope",
    fontSize: 46,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 52,
  },
  ringLabel: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "400",
    color: "rgba(255,255,255,0.85)",
    marginTop: -2,
  },
  weekRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignSelf: "stretch",
    marginTop: 48,
  },
  dayCol: {
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleMet: {
    backgroundColor: "rgba(190,150,80,0.35)",
    borderWidth: 1.5,
    borderColor: GOLD_BRIGHT,
  },
  dayCircleToday: {
    borderWidth: 1.5,
    borderColor: GOLD_BRIGHT,
  },
  dayLabel: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.55)",
  },
  dayLabelActive: {
    color: "#FFFFFF",
  },
  weekMessage: {
    fontFamily: "Manrope",
    fontSize: 17,
    lineHeight: 26,
    fontWeight: "400",
    color: "rgba(255,255,255,0.92)",
    textAlign: "center",
    marginTop: 34,
    paddingHorizontal: 8,
  },
  continueBtn: {
    alignSelf: "stretch",
    height: 54,
    borderRadius: 27,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  continueText: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
    color: NAVY_BOTTOM,
  },
  // ── Página 2 ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  headerBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255,255,255,0.10)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontFamily: "Manrope",
    fontSize: 19,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  sessionImage: {
    width: "100%",
    height: 210,
    borderRadius: 16,
    marginTop: 8,
  },
  sessionTitle: {
    fontFamily: "Manrope",
    fontSize: 19,
    fontWeight: "700",
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 14,
  },
  sessionSubtitle: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "400",
    color: "rgba(255,255,255,0.6)",
    textAlign: "center",
    marginTop: 4,
  },
  bellCircle: {
    alignSelf: "center",
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 30,
  },
  reminderTitle: {
    fontFamily: "Manrope",
    fontSize: 21,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 14,
    paddingHorizontal: 10,
  },
  reminderText: {
    fontFamily: "Manrope",
    fontSize: 15,
    lineHeight: 23,
    color: "rgba(255,255,255,0.85)",
    textAlign: "center",
    marginTop: 10,
    paddingHorizontal: 6,
  },
  slotBtn: {
    alignSelf: "stretch",
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.45)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 14,
  },
  slotBtnSelected: {
    borderColor: GOLD_BRIGHT,
    backgroundColor: "rgba(190,150,80,0.22)",
  },
  slotText: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  slotTextSelected: {
    color: GOLD_BRIGHT,
  },
  divider: {
    alignSelf: "stretch",
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.25)",
    marginTop: 30,
  },
  rateTitle: {
    fontFamily: "Manrope",
    fontSize: 21,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    marginTop: 26,
  },
  rateImageWrap: {
    marginTop: 18,
    borderRadius: 16,
    overflow: "hidden",
  },
  rateImage: {
    width: "100%",
    height: 190,
  },
  rateImageOverlay: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "rgba(6,10,15,0.35)",
  },
  rateImageLabel: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  starsRow: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 14,
    marginTop: 22,
  },
  rateBtn: {
    alignSelf: "stretch",
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.45)",
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
  },
  rateBtnText: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
