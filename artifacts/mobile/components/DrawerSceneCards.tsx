import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
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
  subtitle: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  iconColor: string;
  image: number;
}[] = [
  {
    id: "cloudy",
    title: "Día",
    subtitle: "Luminoso y energizante",
    icon: "white-balance-sunny",
    iconColor: "#FFD764",
    image: require("../assets/images/scene-day.jpg"),
  },
  {
    id: "indigo2",
    title: "Noche",
    subtitle: "Sereno y contemplativo",
    icon: "moon-waning-crescent",
    iconColor: "#F4F1FF",
    image: require("../assets/images/scene-night.jpg"),
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
      <View style={styles.list} accessibilityRole="radiogroup" accessibilityLabel="Escena">
        {SCENES.map((s) => {
          const selected = s.id === activeId;
          return (
            <View key={s.id} style={selected ? styles.glow : undefined}>
            <Pressable
              testID={`drawer-scene-${s.id}`}
              accessibilityRole="radio"
              accessibilityLabel={`${s.title}, ${s.subtitle}`}
              accessibilityState={{ checked: selected, selected }}
              onPress={() => {
                if (!selected) onSelect(s.id);
              }}
              style={({ pressed }) => [
                styles.card,
                selected ? styles.cardSelected : styles.cardIdle,
                pressed && !selected && { opacity: 0.85 },
              ]}
            >
              <Image source={s.image} style={StyleSheet.absoluteFill} contentFit="cover" contentPosition="right center" />
              <LinearGradient
                pointerEvents="none"
                colors={["rgba(8,10,40,0.45)", "rgba(8,10,40,0.12)", "rgba(8,10,40,0)"]}
                locations={[0, 0.55, 1]}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 1, y: 0.5 }}
                style={StyleSheet.absoluteFill}
              />
              {selected && <View pointerEvents="none" style={[StyleSheet.absoluteFill, { backgroundColor: "rgba(255,255,255,0.08)" }]} />}
              <View style={styles.iconWrap}>
                <MaterialCommunityIcons name={s.icon} size={30} color={s.iconColor} />
              </View>
              <View style={styles.texts}>
                <Text style={styles.cardTitle} numberOfLines={1}>{s.title}</Text>
                <Text style={styles.cardSub} numberOfLines={1}>{s.subtitle}</Text>
              </View>
              <View style={[styles.circle, selected ? styles.circleOn : styles.circleOff]}>
                {selected && <Feather name="check" size={13} color="#2A4A8A" />}
              </View>
            </Pressable>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 2, marginBottom: 12, marginTop: 20, paddingTop: 18, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(255,255,255,0.10)" },
  title: {
    fontFamily: "Manrope",
    color: "rgba(255,255,255,0.58)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
  list: { gap: 10 },
  card: {
    height: 60,
    borderRadius: 16,
    overflow: "hidden",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  cardIdle: { borderWidth: 1, borderColor: "rgba(255,255,255,0.22)" },
  cardSelected: {
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.85)",
    backgroundColor: "rgba(255,255,255,0.14)",
  },
  glow: {
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.14)",
    shadowColor: "#FFFFFF",
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.55,
    shadowRadius: 8,
    elevation: 6,
  },
  iconWrap: { width: 34, alignItems: "center" },
  texts: { flex: 1, minWidth: 0 },
  cardTitle: { fontFamily: "Manrope", color: "#FFFFFF", fontSize: 14, fontWeight: "700", letterSpacing: 0.2 },
  cardSub: { fontFamily: "Manrope", color: "rgba(255,255,255,0.82)", fontSize: 11, fontWeight: "500", marginTop: 2 },
  circle: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  circleOn: { backgroundColor: "rgba(214,232,255,0.95)" },
  circleOff: { borderWidth: 1.5, borderColor: "rgba(255,255,255,0.6)" },
});
