import { Feather } from "@expo/vector-icons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useDrawerStats } from "@/hooks/useDrawerStats";
import { useDrawer } from "@/context/DrawerContext";

type StatCardProps = {
  icon: React.ComponentProps<typeof Feather>["name"];
  value: string | number;
  label: string;
};

function StatCard({ icon, value, label }: StatCardProps) {
  return (
    <View style={styles.card}>
      <Feather name={icon} size={20} color="#D4AF37" />
      <View style={styles.cardText}>
        <Text style={styles.cardValue}>{value}</Text>
        <Text style={styles.cardLabel}>{label}</Text>
      </View>
    </View>
  );
}

export function DrawerStats() {
  const { sessions, totalTime, activeDays, streak } = useDrawerStats();
  const { close, markInstantNav } = useDrawer();

  const goToProgreso = () => {
    markInstantNav();
    close();
    router.push("/progreso" as never);
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        <StatCard icon="activity"   value={sessions}    label="Sesiones"       />
        <StatCard icon="clock"      value={totalTime}   label="Tiempo total"   />
        <StatCard icon="calendar"   value={activeDays}  label="Días activos"   />
        <StatCard icon="zap"        value={streak > 0 ? `${streak} 🔥` : "—"} label="Racha actual" />
      </View>

      <Pressable onPress={goToProgreso} style={({ pressed }) => [styles.link, pressed && styles.linkPressed]}>
        <Text style={styles.linkText}>Ver estadísticas completas</Text>
        <Feather name="chevron-right" size={13} color="#D4AF37" />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 4,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: "rgba(212,175,55,0.18)",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  card: {
    width: "47.5%",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.08)",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  cardText: {
    gap: 2,
  },
  cardValue: {
    color: "#F4DAD5",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  cardLabel: {
    color: "rgba(255,255,255,0.9)",
    fontSize: 11,
    fontWeight: "400",
    letterSpacing: 0.3,
  },
  link: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 14,
    alignSelf: "flex-start",
  },
  linkPressed: { opacity: 0.6 },
  linkText: {
    color: "#D4AF37",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.2,
  },
});
