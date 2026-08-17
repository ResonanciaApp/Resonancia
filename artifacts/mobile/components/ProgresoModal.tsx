import { Feather } from "@expo/vector-icons";
import { useMilestones } from "@/context/MilestonesContext";
import { MilestoneCelebration } from "@/components/MilestoneCelebration";
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
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePlayer } from "@/context/PlayerContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { getSessionById } from "@/data/sessions";
import { SonicStreakWave } from "@/components/SonicStreakWave";

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function ProgresoModal({ visible, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { statEvents } = usePlayer();
  const { statuses: milestones, previewMilestone } = useMilestones();
  const { theme } = useSceneTheme();

  const bgColors = theme.gradient as unknown as [string, string, ...string[]];

  const recentSessions = useMemo(() => {
    const byId = new Map<string, { sessionId: string; playedAt: string }>();
    for (const e of statEvents) {
      const existing = byId.get(e.sessionId);
      if (!existing || new Date(e.playedAt) > new Date(existing.playedAt)) {
        byId.set(e.sessionId, { sessionId: e.sessionId, playedAt: e.playedAt });
      }
    }
    return [...byId.values()]
      .sort((a, b) => new Date(b.playedAt).getTime() - new Date(a.playedAt).getTime())
      .map((e) => getSessionById(e.sessionId))
      .filter((s): s is NonNullable<typeof s> => s != null)
      .slice(0, 20);
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
          </View>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView
          contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* ── Esta semana ── */}
          <Text style={styles.sectionLabel}>ESTA SEMANA</Text>

          {/* ── Ondas + anillo + días (diseño original) ── */}
          <SonicStreakWave />

          {/* ── Divider ── */}
          <View style={styles.divider} />

          {/* ── Hitos ── */}
          <Text style={styles.sessionsSectionLabel}>Hitos</Text>
          <View style={styles.milestoneList}>
            {milestones.map((m) => {
              const done = !!m.unlockedAt;
              return (
                <Pressable
                  key={m.id}
                  onPress={() => previewMilestone(m.id)}
                  style={[styles.milestoneRow, done && styles.milestoneRowDone]}
                >
                  <View style={[styles.milestoneBadge, done && styles.milestoneBadgeDone]}>
                    <Text style={{ fontSize: 18 }}>{m.icon}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.milestoneTitle, done && { color: "#E9C46A" }]} numberOfLines={1}>
                      {m.title}
                    </Text>
                    <Text style={styles.milestoneMeta} numberOfLines={1}>
                      {done && m.unlockedAt
                        ? `Conseguido el ${new Date(m.unlockedAt).toLocaleDateString("es-CL", { day: "numeric", month: "short" })}`
                        : `${m.progress} / ${m.threshold}`}
                    </Text>
                  </View>
                  {done && <Feather name="check" size={16} color="#E9C46A" />}
                </Pressable>
              );
            })}
          </View>

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
        <MilestoneCelebration />
      </LinearGradient>
    </Modal>
  );
}

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
    color: "#F9F9F9",
    textAlign: "center",
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "400",
    color: "#F4F4F4",
    textAlign: "center",
    lineHeight: 20,
  },
  content: {
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  sectionLabel: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "700",
    color: "rgba(255,255,255,0.45)",
    letterSpacing: 1.8,
    marginBottom: 0,
  },
  divider: {
    width: "100%",
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    marginTop: 8,
    marginBottom: 20,
  },
  sessionsSectionLabel: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "600",
    color: "#F9F9F9",
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
  milestoneList: {
    width: "100%",
    gap: 8,
  },
  milestoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(190,150,80,0.05)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  milestoneRowDone: {
    backgroundColor: "rgba(190,150,80,0.10)",
    borderWidth: 1,
    borderColor: "rgba(190,150,80,0.35)",
  },
  milestoneBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  milestoneBadgeDone: {
    backgroundColor: "rgba(190,150,80,0.15)",
  },
  milestoneTitle: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
    color: "#F9F9F9",
  },
  milestoneMeta: {
    fontFamily: "Manrope",
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    marginTop: 2,
  },
  sessionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 14,
  },
  sessionThumb: {
    width: 62,
    height: 62,
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
    color: "#F9F9F9",
  },
  sessionMeta: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "400",
    color: "rgba(244,218,213,0.5)",
  },
});
