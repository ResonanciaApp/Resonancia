import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import React from "react";
import { Alert, Pressable, StyleSheet, Text, View } from "react-native";

type SceneId = "cloudy" | "indigo2";

type Props = {
  activeId: string;
  onSelect: (id: SceneId) => void;
};

const SCENES: {
  id: SceneId;
  title: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  iconColor: string;
}[] = [
  {
    id: "cloudy",
    title: "Día",
    icon: "white-balance-sunny",
    iconColor: "#BE9650",
  },
  {
    id: "indigo2",
    title: "Noche",
    icon: "moon-waning-crescent",
    iconColor: "#B6A1E5",
  },
];

function showBrief() {
  Alert.alert(
    "Escena",
    "La escena cambia solo la apariencia de la app: colores y fondos. No modifica el sonido, tus sesiones ni tu contenido.",
    [{ text: "Entendido" }],
  );
}

export function DrawerSceneCards({ activeId, onSelect }: Props) {
  return (
    <View>
      <View style={styles.header}>
        <Text style={styles.title}>Escena</Text>
        <Pressable
          onPress={showBrief}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Información sobre escenas"
          testID="drawer-scene-info"
        >
          <Feather name="info" size={14} color="rgba(255,255,255,0.58)" />
        </Pressable>
      </View>
      <View accessibilityRole="radiogroup" accessibilityLabel="Escena">
        {SCENES.map((s) => {
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
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons name={s.icon} size={23} color={selected ? s.iconColor : "#F9F9F9"} />
              </View>
              <Text style={styles.label} numberOfLines={1}>{s.title}</Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 2, marginBottom: 4, marginTop: 20, paddingTop: 18, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.10)" },
  title: {
    fontFamily: "Manrope",
    color: "rgba(255,255,255,0.58)",
    fontSize: 11,
    fontWeight: "600",
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
  iconWrap: { width: 26, alignItems: "center" },
  label: { fontFamily: "Manrope", color: "#FFFFFF", fontSize: 14, fontWeight: "500", letterSpacing: 0.2 },
});
