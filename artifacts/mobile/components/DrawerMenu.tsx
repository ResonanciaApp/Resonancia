import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");
const DRAWER_W = Math.min(width * 0.78, 300);
const ND = Platform.OS !== "web";

type MenuItem = {
  label: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  route: string;
};

const MAIN_ITEMS: MenuItem[] = [
  { label: "Regístrate", icon: "user-plus", route: "/registro" },
  { label: "Membresía", icon: "star", route: "/membresia" },
  { label: "Tu perfil", icon: "user", route: "/(tabs)/profile" },
  { label: "Actividades Expansivas", icon: "activity", route: "/actividades" },
  { label: "Amigos", icon: "users", route: "/amigos" },
  { label: "Grupos", icon: "globe", route: "/grupos" },
];

const SECONDARY_ITEMS: MenuItem[] = [
  { label: "Invitar a un amigo", icon: "share-2", route: "/invitar" },
  { label: "Ayuda", icon: "help-circle", route: "/ayuda" },
  { label: "Configuraciones", icon: "settings", route: "/configuraciones" },
];

interface Props {
  visible: boolean;
  onClose: () => void;
}

export function DrawerMenu({ visible, onClose }: Props) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const translateX = useRef(new Animated.Value(-DRAWER_W)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: ND,
          damping: 20,
          stiffness: 180,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: ND,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: -DRAWER_W,
          duration: 200,
          useNativeDriver: ND,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 200,
          useNativeDriver: ND,
        }),
      ]).start();
    }
  }, [visible, translateX, overlayOpacity]);

  if (!visible) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {/* Overlay oscuro */}
      <Animated.View
        style={[styles.overlay, { opacity: overlayOpacity }]}
        pointerEvents={visible ? "auto" : "none"}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* Panel lateral */}
      <Animated.View
        style={[
          styles.drawer,
          { transform: [{ translateX }] },
        ]}
      >
        <LinearGradient
          colors={["#241408", "#1A0E06"]}
          style={[styles.drawerInner, { paddingTop: topPad + 16, paddingBottom: bottomPad + 24 }]}
        >
          {/* Header del drawer */}
          <View style={styles.drawerHeader}>
            <Text style={styles.brandText}>RESONANCIA</Text>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Feather name="x" size={20} color="#C69B4F" />
            </Pressable>
          </View>

          {/* Separador */}
          <View style={[styles.divider, { backgroundColor: "#C69B4F22" }]} />

          {/* Items principales */}
          <View style={styles.itemGroup}>
            {MAIN_ITEMS.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => { onClose(); router.push(item.route as never); }}
                style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
              >
                <View style={styles.itemIcon}>
                  <Feather name={item.icon} size={17} color="#C69B4F" />
                </View>
                <Text style={styles.itemLabel}>{item.label}</Text>
              </Pressable>
            ))}
          </View>

          {/* Separador */}
          <View style={[styles.divider, { backgroundColor: "#C69B4F22", marginVertical: 16 }]} />

          {/* Items secundarios */}
          <View style={styles.itemGroup}>
            {SECONDARY_ITEMS.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => { onClose(); router.push(item.route as never); }}
                style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
              >
                <View style={styles.itemIcon}>
                  <Feather name={item.icon} size={17} color="#8A6A3A" />
                </View>
                <Text style={[styles.itemLabel, styles.itemLabelMuted]}>{item.label}</Text>
              </Pressable>
            ))}
          </View>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.55)",
  },
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_W,
    shadowColor: "#000",
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 20,
  },
  drawerInner: {
    flex: 1,
    paddingHorizontal: 20,
  },
  drawerHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  brandText: {
    color: "#C69B4F",
    fontSize: 13,
    fontWeight: "700",
    letterSpacing: 2.5,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    height: 1,
    marginBottom: 8,
  },
  itemGroup: {
    gap: 2,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 14,
  },
  itemPressed: {
    backgroundColor: "rgba(198,155,79,0.1)",
  },
  itemIcon: {
    width: 26,
    alignItems: "center",
  },
  itemLabel: {
    color: "#EDE1D3",
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  itemLabelMuted: {
    color: "#9E8060",
    fontSize: 14,
  },
});
