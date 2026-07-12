import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePlayer } from "@/context/PlayerContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { getSessionById } from "@/data/sessions";

// ─── Constants ────────────────────────────────────────────────────────────────
const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];
const GOAL_DAYS  = 3;
const RING_R     = 54;
const RING_CX    = 72;
const RING_CY    = 72;
const CIRCUMFERENCE = 2 * Math.PI * RING_R;

function dayKey(d: Date) {
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}
function startOfWeek(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  const dow = copy.getDay();
  copy.setDate(copy.getDate() + (dow === 0 ? -6 : 1 - dow));
  return copy;
}

// ─── Props ────────────────────────────────────────────────────────────────────
interface Props {
  visible: boolean;
  onClose: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ProgresoModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { statEvents } = usePlayer();
  const { theme } = useSceneTheme();

  const grad0 = "#F7CB6B";
  const grad1 = "#FBA980";

  const { weekCount, activeFlags, todayIndex, recentSessions } = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const e of statEvents) {
      const k = dayKey(new Date(e.playedAt));
      byDay.set(k, (byDay.get(k) ?? 0) + (e.minutes ?? 0));
    }
    const today  = new Date();
    const monday = startOfWeek(today);
    const flags: boolean[] = [];
    let weekCnt  = 0;
    let todayIdx = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const met = (byDay.get(dayKey(d)) ?? 0) >= 5;
      flags.push(met);
      if (met) weekCnt++;
      if (dayKey(d) === dayKey(today)) todayIdx = i;
    }

    // Historial: dedup por sessionId (más reciente), luego ordenado por playedAt desc
    const byId = new Map<string, { sessionId: string; playedAt: string }>();
    for (const e of statEvents) {
      const existing = byId.get(e.sessionId);
      if (!existing || new Date(e.playedAt) > new Date(existing.playedAt)) {
        byId.set(e.sessionId, { sessionId: e.sessionId, playedAt: e.playedAt });
      }
    }
    const sorted = [...byId.values()].sort(
      (a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime()
    );
    const sessions = sorted
      .map((e) => getSessionById(e.sessionId))
      .filter((s): s is NonNullable<typeof s> => s != null)
      .slice(0, 20);

    return { weekCount: weekCnt, activeFlags: flags, todayIndex: todayIdx, recentSessions: sessions };
  }, [statEvents]);

  const dashOffset = CIRCUMFERENCE * (1 - weekCount / 7);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <LinearGradient
        colors={["#1B060F", "#27070E", "#1B060F"]}
        style={{ flex: 1 }}
      >
        {/* ── Header ── */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
            <Feather name="x" size={18} color="rgba(255,255,255,0.8)" />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>Tu progreso</Text>
            <Text style={styles.subtitle}>
              Medita al menos {GOAL_DAYS} días a la semana y transforma tu vida
            </Text>
          </View>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Esta semana ── */}
          <Text style={styles.sectionLabel}>ESTA SEMANA</Text>

          {/* ── Círculo de progreso ── */}
          <View style={styles.ringWrap}>
            <Svg width={RING_CX * 2} height={RING_CY * 2}>
              <Defs>
                <SvgGradient id="pmRingGrad" x1="0" y1="0" x2="1" y2="1">
                  <Stop offset="0" stopColor={grad0} stopOpacity="1" />
                  <Stop offset="1" stopColor={grad1} stopOpacity="1" />
                </SvgGradient>
              </Defs>
              {/* Track */}
              <Circle
                cx={RING_CX}
                cy={RING_CY}
                r={RING_R}
                stroke="rgba(255,255,255,0.10)"
                strokeWidth={7}
                fill="none"
              />
              {/* Progress */}
              <Circle
                cx={RING_CX}
                cy={RING_CY}
                r={RING_R}
                stroke="url(#pmRingGrad)"
                strokeWidth={7}
                strokeLinecap="round"
                fill="none"
                strokeDasharray={`${CIRCUMFERENCE}`}
                strokeDashoffset={dashOffset}
                rotation="-90"
                origin={`${RING_CX}, ${RING_CY}`}
              />
            </Svg>
            <View style={styles.ringCenter} pointerEvents="none">
              <Text style={styles.ringCount}>{weekCount}</Text>
              <Text style={styles.ringLabel}>Días</Text>
            </View>
          </View>

          {/* ── Días de la semana ── */}
          <View style={styles.daysRow}>
            {DAY_LABELS.map((label, i) => {
              const met     = activeFlags[i];
              const isToday = i === todayIndex;
              return (
                <View key={i} style={styles.dayCol}>
                  {met ? (
                    <View style={[styles.dayCircle, styles.dayCircleMet]}>
                      <Feather name="check" size={18} color="rgba(255,255,255,0.9)" />
                    </View>
                  ) : isToday ? (
                    <View style={styles.dayCircleToday}>
                      <Svg width={39} height={39} style={StyleSheet.absoluteFill}>
                        <Defs>
                          <SvgGradient id="pmTodayGrad" x1="0.5" y1="0" x2="0.5" y2="1">
                            <Stop offset="0" stopColor={grad0} stopOpacity="0.78" />
                            <Stop offset="1" stopColor={grad1} stopOpacity="0.70" />
                          </SvgGradient>
                        </Defs>
                        <Circle cx={19.5} cy={19.5} r={17.5} stroke="url(#pmTodayGrad)" strokeWidth={2} fill="rgba(255,255,255,0.12)" />
                      </Svg>
                    </View>
                  ) : (
                    <View style={styles.dayCircleInactive} />
                  )}
                  <Text style={[
                    styles.dayLabel,
                    met && styles.dayLabelMet,
                    isToday && !met && styles.dayLabelToday,
                  ]}>
                    {label}
                  </Text>
                </View>
              );
            })}
          </View>

          {/* ── Divider ── */}
          <View style={styles.divider} />

          {/* ── Tus sesiones ── */}
          <Text style={styles.sessionsSectionLabel}>Tus sesiones</Text>

          {recentSessions.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Feather name="headphones" size={28} color="rgba(255,255,255,0.25)" />
              <Text style={styles.emptyText}>
                Aquí aparecerán las sesiones que completes.
              </Text>
            </View>
          ) : (
            <View style={styles.sessionList}>
              {recentSessions.map((session) => (
                <View key={session.id} style={styles.sessionRow}>
                  <Image
                    source={session.image}
                    style={styles.sessionThumb}
                    contentFit="cover"
                  />
                  <View style={styles.sessionInfo}>
                    <Text style={styles.sessionTitle} numberOfLines={1}>
                      {session.title}
                    </Text>
                    <Text style={styles.sessionMeta} numberOfLines={1}>
                      {session.categoryLabel}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          )}
        </ScrollView>
      </LinearGradient>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 8,
  },
  title: {
    fontFamily: "Manrope",
    fontSize: 22,
    fontWeight: "700",
    color: "#F4DAD5",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "400",
    color: "rgba(244,218,213,0.65)",
    textAlign: "center",
    lineHeight: 20,
  },

  content: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 20,
  },

  sectionLabel: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 1.8,
    marginBottom: 20,
  },

  ringWrap: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  ringCenter: {
    position: "absolute",
    alignItems: "center",
    justifyContent: "center",
  },
  ringCount: {
    fontFamily: "Manrope",
    fontSize: 42,
    fontWeight: "700",
    color: "#F4DAD5",
    lineHeight: 46,
  },
  ringLabel: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "400",
    color: "rgba(244,218,213,0.55)",
    marginTop: 2,
  },

  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginBottom: 28,
  },
  dayCol: {
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  dayCircle: {
    width: 39,
    height: 39,
    borderRadius: 19.5,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleMet: {
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  dayCircleToday: {
    width: 39,
    height: 39,
    borderRadius: 19.5,
    alignItems: "center",
    justifyContent: "center",
  },
  dayCircleInactive: {
    width: 37,
    height: 37,
    borderRadius: 18.5,
    backgroundColor: "rgba(255,255,255,0.10)",
  },
  dayLabel: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(255,255,255,0.4)",
  },
  dayLabelMet: {
    color: "#F4DAD5",
  },
  dayLabelToday: {
    color: "#F4DAD5",
  },

  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginBottom: 20,
  },

  sessionsSectionLabel: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(244,218,213,0.8)",
    alignSelf: "flex-start",
    marginBottom: 14,
  },

  emptyWrap: {
    alignItems: "center",
    gap: 12,
    paddingTop: 24,
    opacity: 0.6,
  },
  emptyText: {
    fontFamily: "Manrope",
    fontSize: 13,
    color: "rgba(255,255,255,0.5)",
    textAlign: "center",
  },

  sessionList: {
    width: "100%",
    gap: 4,
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 14,
  },
  sessionThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  sessionInfo: {
    flex: 1,
    gap: 3,
  },
  sessionTitle: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "600",
    color: "#F4DAD5",
  },
  sessionMeta: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "400",
    color: "rgba(244,218,213,0.5)",
  },
});
