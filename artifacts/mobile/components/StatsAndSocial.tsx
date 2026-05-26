import { View, Text, Pressable, StyleSheet } from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { usePlayer } from "@/context/PlayerContext";
import { useColors } from "@/hooks/useColors";
import { SESSIONS } from "@/data/sessions";

export default function StatsAndSocial() {
  const colors = useColors();
  const { favorites, history } = usePlayer();

  const totalMinutes = history.reduce((acc, entry) => {
    const session = SESSIONS.find((s) => s.id === entry.sessionId);
    return acc + (session?.duration ?? 0);
  }, 0);

  const stats = [
    { icon: "clock" as const,     label: "Recientes",  value: history.length },
    { icon: "activity" as const,  label: "Minutos",    value: totalMinutes || "—" },
    { icon: "heart" as const,     label: "Favoritos",  value: favorites.length },
  ];

  return (
    <View style={styles.wrapper}>
      {/* Stats row */}
      <View style={styles.row}>
        {stats.map(({ icon, label, value }) => (
          <View key={label} style={[styles.card, { backgroundColor: colors.card }]}>
            <Feather name={icon} size={20} color={colors.primary} />
            <Text style={[styles.value, { color: colors.foreground }]}>{value}</Text>
            <Text style={[styles.label, { color: colors.mutedForeground }]}>{label}</Text>
          </View>
        ))}
      </View>

      {/* Social buttons */}
      <View style={styles.btnRow}>
        <Pressable
          style={({ pressed }) => [
            styles.socialBtn,
            { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.75 : 1 },
          ]}
          onPress={() => router.push("/amigos" as never)}
        >
          <Feather name="users" size={16} color={colors.primary} />
          <Text style={[styles.socialText, { color: colors.foreground }]}>Amigos</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.socialBtn,
            { backgroundColor: colors.card, borderColor: colors.border, opacity: pressed ? 0.75 : 1 },
          ]}
          onPress={() => router.push("/grupos" as never)}
        >
          <Feather name="globe" size={16} color={colors.primary} />
          <Text style={[styles.socialText, { color: colors.foreground }]}>Grupos</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 16,
    marginBottom: 8,
    gap: 12,
  },
  row: {
    flexDirection: "row",
    gap: 10,
  },
  card: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 16,
    borderRadius: 16,
    gap: 6,
  },
  value: {
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.3,
  },
  label: {
    fontSize: 12,
  },
  btnRow: {
    flexDirection: "row",
    gap: 10,
  },
  socialBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  socialText: {
    fontSize: 15,
    fontWeight: "600",
  },
});
