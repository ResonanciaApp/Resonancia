import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import React, { useMemo } from "react";
import {
  Dimensions,
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
  Path,
  Stop,
} from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePlayer } from "@/context/PlayerContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import type { SceneTheme } from "@/config/scene-themes";
import { getSessionById } from "@/data/sessions";

// ─── Constants ────────────────────────────────────────────────────────────────
const SCREEN_W   = Dimensions.get("window").width;
const H_PADDED   = 40; // horizontal padding of modal content
const BADGE_W    = SCREEN_W - H_PADDED * 2;
const BADGE_H    = 90;
const BADGE_CY   = BADGE_H / 2;
const BADGE_CX   = BADGE_W / 2;
const CIRCLE_R   = 31;
const WAVE_GAP   = 16; // gap between wave end and circle edge
const WAVE_T     = 36; // period of sine
const WAVE_A     = 6.5; // amplitude
const DAY_LABELS = ["L", "M", "M", "J", "V", "S", "D"];
const GOAL_MIN   = 5;

// ─── Helpers ──────────────────────────────────────────────────────────────────
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
function brightenHex(hex: string, pct: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let hh = 0, s = 0, l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) hh = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) hh = ((b - r) / d + 2) / 6;
    else hh = ((r - g) / d + 4) / 6;
  }
  l = Math.min(1, l + pct / 100);
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const hue2rgb = (t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };
  const rr = Math.round(hue2rgb(hh + 1/3) * 255);
  const gg = Math.round(hue2rgb(hh) * 255);
  const bb = Math.round(hue2rgb(hh - 1/3) * 255);
  return `rgb(${rr},${gg},${bb})`;
}

/** Genera una path de onda sinusoidal usando bezier cuadráticos */
function sineWavePath(startX: number, endX: number, cy: number, T: number, A: number): string {
  let d = `M ${startX.toFixed(1)} ${cy.toFixed(1)}`;
  let x = startX;
  let phase = 0; // 0 = sube, 1 = baja
  while (x < endX - 0.5) {
    const halfT = T / 2;
    const nextX = Math.min(x + halfT, endX);
    const mx = (x + nextX) / 2;
    const my = cy + (phase === 0 ? -A : A);
    d += ` Q ${mx.toFixed(1)} ${my.toFixed(1)} ${nextX.toFixed(1)} ${cy.toFixed(1)}`;
    x = nextX;
    phase = 1 - phase;
  }
  return d;
}

// ─── StreakBadge ──────────────────────────────────────────────────────────────
function StreakBadge({
  weekCount,
  activeFlags,
  todayIndex,
  theme,
}: {
  weekCount: number;
  activeFlags: boolean[];
  todayIndex: number;
  theme: SceneTheme;
}) {
  const c0 = brightenHex(theme.gradient[0], 62);
  const c1 = brightenHex(theme.gradient[0], 48);

  const leftEnd   = BADGE_CX - CIRCLE_R - WAVE_GAP;
  const rightStart = BADGE_CX + CIRCLE_R + WAVE_GAP;

  const leftPath  = sineWavePath(0, leftEnd, BADGE_CY, WAVE_T, WAVE_A);
  const rightPath = sineWavePath(rightStart, BADGE_W, BADGE_CY, WAVE_T, WAVE_A);

  return (
    <View style={{ width: BADGE_W, alignItems: "center", gap: 0 }}>
      {/* ── SVG: ondas + círculo ── */}
      <View style={{ width: BADGE_W, height: BADGE_H }}>
        <Svg width={BADGE_W} height={BADGE_H}>
          <Defs>
            <SvgGradient id="pmCircGrad" x1="0.5" y1="0" x2="0.5" y2="1">
              <Stop offset="0" stopColor={c0} stopOpacity="1" />
              <Stop offset="1" stopColor={c1} stopOpacity="0.85" />
            </SvgGradient>
            <SvgGradient id="pmLeftWave" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0"   stopColor={c0} stopOpacity="0.03" />
              <Stop offset="0.7" stopColor={c0} stopOpacity="0.52" />
              <Stop offset="1"   stopColor={c0} stopOpacity="0.62" />
            </SvgGradient>
            <SvgGradient id="pmRightWave" x1="0" y1="0" x2="1" y2="0">
              <Stop offset="0"   stopColor={c1} stopOpacity="0.62" />
              <Stop offset="0.3" stopColor={c1} stopOpacity="0.52" />
              <Stop offset="1"   stopColor={c1} stopOpacity="0.03" />
            </SvgGradient>
          </Defs>

          {/* Relleno del círculo */}
          <Circle
            cx={BADGE_CX}
            cy={BADGE_CY}
            r={CIRCLE_R}
            fill="rgba(255,255,255,0.09)"
          />
          {/* Borde del círculo */}
          <Circle
            cx={BADGE_CX}
            cy={BADGE_CY}
            r={CIRCLE_R}
            stroke="url(#pmCircGrad)"
            strokeWidth={2}
            fill="none"
          />

          {/* Onda izquierda */}
          <Path
            d={leftPath}
            stroke="url(#pmLeftWave)"
            strokeWidth={1.6}
            strokeLinecap="round"
            fill="none"
          />
          {/* Onda derecha */}
          <Path
            d={rightPath}
            stroke="url(#pmRightWave)"
            strokeWidth={1.6}
            strokeLinecap="round"
            fill="none"
          />
        </Svg>

        {/* Número superpuesto */}
        <View
          style={[StyleSheet.absoluteFill, { alignItems: "center", justifyContent: "center" }]}
          pointerEvents="none"
        >
          <Text style={styles.badgeCount}>{weekCount}</Text>
          <Text style={styles.badgeLabel}>{weekCount === 1 ? "DÍA" : "DÍAS"}</Text>
        </View>
      </View>

      {/* ── Bolitas de días ── */}
      <View style={styles.daysRow}>
        {DAY_LABELS.map((label, i) => {
          const met     = activeFlags[i];
          const isToday = i === todayIndex;
          return (
            <View key={i} style={styles.dayCol}>
              {met ? (
                <View style={styles.dayCircleWrap}>
                  <Svg width={39} height={39} style={StyleSheet.absoluteFill}>
                    <Defs>
                      <SvgGradient id={`pmDg${i}`} x1="0.5" y1="0" x2="0.5" y2="1">
                        <Stop offset="0" stopColor={c0} stopOpacity="0.75" />
                        <Stop offset="1" stopColor={c1} stopOpacity="0.65" />
                      </SvgGradient>
                    </Defs>
                    <Circle cx={19.5} cy={19.5} r={17.5} stroke={`url(#pmDg${i})`} strokeWidth={2} fill="rgba(255,255,255,0.13)" />
                  </Svg>
                  <Feather name="check" size={18} color="rgba(255,255,255,0.9)" />
                </View>
              ) : isToday ? (
                <View style={styles.dayCircleWrap}>
                  <Svg width={39} height={39} style={StyleSheet.absoluteFill}>
                    <Defs>
                      <SvgGradient id="pmDgToday" x1="0.5" y1="0" x2="0.5" y2="1">
                        <Stop offset="0" stopColor={c0} stopOpacity="0.75" />
                        <Stop offset="1" stopColor={c1} stopOpacity="0.65" />
                      </SvgGradient>
                    </Defs>
                    <Circle cx={19.5} cy={19.5} r={17.5} stroke="url(#pmDgToday)" strokeWidth={2} fill="rgba(255,255,255,0.09)" />
                  </Svg>
                </View>
              ) : (
                <View style={styles.dayCircleInactive} />
              )}
              <Text style={[
                styles.dayLabel,
                (met || isToday) && styles.dayLabelActive,
              ]}>
                {label}
              </Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

// ─── ProgresoModal ────────────────────────────────────────────────────────────
interface Props {
  visible: boolean;
  onClose: () => void;
}

export function ProgresoModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { statEvents } = usePlayer();
  const { theme } = useSceneTheme();

  const bgColors = theme.gradient as unknown as [string, string, ...string[]];

  const { weekCount, activeFlags, todayIndex, recentSessions } = useMemo(() => {
    const byDay = new Map<string, number>();
    for (const e of statEvents) {
      const k = dayKey(new Date(e.playedAt));
      byDay.set(k, (byDay.get(k) ?? 0) + (e.minutes ?? 0));
    }
    const today  = new Date();
    const monday = startOfWeek(today);
    const flags: boolean[] = [];
    let weekCnt = 0;
    let todayIdx = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const met = (byDay.get(dayKey(d)) ?? 0) >= GOAL_MIN;
      flags.push(met);
      if (met) weekCnt++;
      if (dayKey(d) === dayKey(today)) todayIdx = i;
    }

    // Historial deduplicado por sesión
    const byId = new Map<string, { sessionId: string; playedAt: string }>();
    for (const e of statEvents) {
      const existing = byId.get(e.sessionId);
      if (!existing || new Date(e.playedAt) > new Date(existing.playedAt)) {
        byId.set(e.sessionId, { sessionId: e.sessionId, playedAt: e.playedAt });
      }
    }
    const sessions = [...byId.values()]
      .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())
      .map((e) => getSessionById(e.sessionId))
      .filter((s): s is NonNullable<typeof s> => s != null)
      .slice(0, 20);

    return { weekCount: weekCnt, activeFlags: flags, todayIndex: todayIdx, recentSessions: sessions };
  }, [statEvents]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <LinearGradient colors={bgColors} style={{ flex: 1 }}>
        {/* ── Header ── */}
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Pressable onPress={onClose} hitSlop={10} style={styles.closeBtn}>
            <Feather name="x" size={18} color="rgba(255,255,255,0.8)" />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.title}>Tu progreso</Text>
            <Text style={styles.subtitle}>
              Medita al menos 3 días a la semana y transforma tu vida
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

          {/* ── Ondas sinusoidales + círculo + días ── */}
          <StreakBadge
            weekCount={weekCount}
            activeFlags={activeFlags}
            todayIndex={todayIndex}
            theme={theme}
          />

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
    paddingBottom: 8,
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
    paddingHorizontal: H_PADDED,
    paddingTop: 16,
  },

  sectionLabel: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 1.8,
    marginBottom: 10,
  },

  // Badge internals
  badgeCount: {
    fontFamily: "Manrope",
    fontSize: 34,
    fontWeight: "700",
    color: "#F9F9F9",
    lineHeight: 38,
    letterSpacing: -0.5,
  },
  badgeLabel: {
    fontFamily: "Manrope",
    fontSize: 8,
    fontWeight: "400",
    color: "rgba(249,249,249,0.65)",
    letterSpacing: 2.2,
    marginTop: 1,
  },

  // Días
  daysRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: BADGE_W,
    marginTop: 14,
    marginBottom: 4,
  },
  dayCol: {
    alignItems: "center",
    gap: 6,
    flex: 1,
  },
  dayCircleWrap: {
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
    backgroundColor: "rgba(255,255,255,0.11)",
    marginTop: 1,
  },
  dayLabel: {
    fontFamily: "Manrope",
    fontSize: 10,
    fontWeight: "600",
    color: "rgba(255,255,255,0.38)",
  },
  dayLabelActive: {
    color: "#F9F9F9",
  },

  // Divider + sesiones
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginTop: 16,
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
