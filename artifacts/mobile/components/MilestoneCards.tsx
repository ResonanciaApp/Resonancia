import { Feather } from "@expo/vector-icons";
import { useMilestones } from "@/context/MilestonesContext";
import React from "react";
import {
  Alert,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  TextStyle,
  View,
  ViewStyle,
} from "react-native";

type Props = {
  style?: StyleProp<ViewStyle>;
  titleStyle?: StyleProp<TextStyle>;
  showTitle?: boolean;
};

export function MilestoneCards({ style, titleStyle, showTitle = true }: Props) {
  const { statuses: milestones, previewMilestone, resetMilestone } = useMilestones();

  return (
    <View style={[styles.container, style]}>
      {showTitle && <Text style={[styles.sectionLabel, titleStyle]}>Hitos</Text>}
      <View style={styles.list}>
        {milestones.map((m) => {
          const done = !!m.unlockedAt;
          return (
            <Pressable
              key={m.id}
              onPress={() => previewMilestone(m.id)}
              onLongPress={() => {
                if (!done) return;
                Alert.alert(
                  "Reiniciar hito",
                  `¿Borrar "${m.title}" para volver a ganarlo?`,
                  [
                    { text: "Cancelar", style: "cancel" },
                    {
                      text: "Borrar",
                      style: "destructive",
                      onPress: () => resetMilestone(m.id),
                    },
                  ],
                );
              }}
              style={[styles.row, done && styles.rowDone]}
              accessibilityRole="button"
              accessibilityLabel={`${m.title}, ${done ? "conseguido" : `${m.progress} de ${m.threshold}`}`}
            >
              <View style={[styles.badge, done && styles.badgeDone]}>
                <Text style={styles.icon}>{m.icon}</Text>
              </View>
              <View style={styles.copy}>
                <Text style={[styles.title, done && styles.titleDone]} numberOfLines={1}>
                  {m.title}
                </Text>
                <Text style={styles.meta} numberOfLines={1}>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
  },
  sectionLabel: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "600",
    color: "#F9F9F9",
    marginBottom: 14,
  },
  list: {
    width: "100%",
    gap: 8,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "rgba(190,150,80,0.05)",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  rowDone: {
    backgroundColor: "rgba(190,150,80,0.10)",
    borderWidth: 1,
    borderColor: "rgba(190,150,80,0.35)",
  },
  badge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  badgeDone: {
    backgroundColor: "rgba(190,150,80,0.15)",
  },
  icon: {
    fontSize: 18,
  },
  copy: {
    flex: 1,
  },
  title: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "600",
    color: "#F9F9F9",
  },
  titleDone: {
    color: "#E9C46A",
  },
  meta: {
    fontFamily: "Manrope",
    fontSize: 11,
    color: "rgba(255,255,255,0.5)",
    marginTop: 2,
  },
});