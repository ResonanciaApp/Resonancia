import { MaterialCommunityIcons } from "@expo/vector-icons";
import { MoonCrescentIcon } from "@/components/MoonCrescentIcon";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type SceneId = "cloudy" | "indigo2" | "natural" | "pleyades" | "galactic";

type Props = {
  activeId: string;
  onSelect: (id: SceneId) => void;
};

const SCENES: {
  id: SceneId;
  title: string;
  iconColor: string;
  icon: "white-balance-sunny" | "pine-tree" | "diamond-stone" | "star-four-points";
}[] = [
  {
    id: "cloudy",
    title: "Día",
    iconColor: "#BE9650",
    icon: "white-balance-sunny",
  },
  {
    id: "indigo2",
    title: "Noche",
    iconColor: "#B6A1E5",
    icon: "white-balance-sunny",
  },
  { id: "natural", title: "Natural", iconColor: "#7EAA65", icon: "pine-tree" },
  { id: "pleyades", title: "Pleyades", iconColor: "#B6A1E5", icon: "diamond-stone" },
  { id: "galactic", title: "Galactic", iconColor: "#91BBDC", icon: "star-four-points" },
];

export function DrawerSceneCards({ activeId, onSelect }: Props) {
  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>Escena</Text>
      </View>
      <View style={styles.list} accessibilityRole="radiogroup" accessibilityLabel="Escena">
        {[[SCENES[0], SCENES[1], SCENES[4]], SCENES.slice(2, 4)].map((column, columnIndex) => (
          <View key={columnIndex} style={styles.column}>
        {column.map((s) => {
          const selected = s.id === activeId;
          return (
            <Pressable
              key={s.id}
              testID={`drawer-scene-${s.id}`}
              accessibilityRole="radio"
              accessibilityLabel={s.title}
              accessibilityState={{ checked: selected, selected }}
              onPress={() => {
                if (!selected) onSelect(s.id);
              }}
              style={({ pressed }) => [
                styles.row,
                pressed && { opacity: 0.85 },
              ]}
            >
              <View style={styles.iconWrap} pointerEvents="none">
                {s.id === "indigo2" ? (
                  <MoonCrescentIcon size={21} color={selected ? s.iconColor : "#A8A8A8"} />
                ) : (
                  <MaterialCommunityIcons name={s.icon} size={21} color={selected ? s.iconColor : "#A8A8A8"} />
                )}
              </View>
              <Text style={[styles.label, { color: selected ? "#FFFFFF" : "#A8A8A8" }]} numberOfLines={1}>{s.title}</Text>
            </Pressable>
          );
        })}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 2, marginBottom: 4, marginTop: 135, paddingTop: 18, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.10)" },
  title: {
    fontFamily: "Manrope650",
    color: "rgba(255,255,255,0.58)",
    fontSize: 10,
    fontWeight: "400",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6.5,
    paddingHorizontal: 0,
    borderRadius: 10,
    gap: 14,
  },
  list: { marginTop: 10, flexDirection: "row", gap: 12 },
  column: { flex: 1, gap: 2 },
  iconWrap: { width: 26, height: 26, alignItems: "center", justifyContent: "center" },
  label: { fontFamily: "Manrope620", color: "#FFFFFF", fontSize: 12, lineHeight: 20, fontWeight: "400", letterSpacing: 0.2 },
});
