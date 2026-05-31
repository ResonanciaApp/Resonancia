import { Feather } from "@expo/vector-icons";
import { useUser } from "@clerk/expo";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useRef, useState } from "react";
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

import { useAuth } from "@/context/AuthContext";
import { useDrawer, markDrawerReopenOnHome } from "@/context/DrawerContext";
import { useUserProfile } from "@/context/UserProfileContext";
import { useColors } from "@/hooks/useColors";

const { width } = Dimensions.get("window");
const DRAWER_W = Math.min(width * 0.78, 300);
const ND = Platform.OS !== "web";

type MenuItem = {
  label: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  route: string;
};

const LOGGED_OUT_ITEMS: MenuItem[] = [
  { label: "Crear cuenta",  icon: "user-plus", route: "/(auth)/sign-up" },
  { label: "Iniciar sesión", icon: "log-in",   route: "/(auth)/sign-in" },
  { label: "Premium",     icon: "star",      route: "/membresia" },
  { label: "Favoritos",   icon: "heart",     route: "/favorites" },
  { label: "Amigos",      icon: "users",     route: "/amigos" },
  { label: "Grupos",      icon: "globe",     route: "/grupos" },
];

const LOGGED_IN_ITEMS: MenuItem[] = [
  { label: "Premium",     icon: "star",      route: "/membresia" },
  { label: "Favoritos",   icon: "heart",     route: "/favorites" },
  { label: "Amigos",      icon: "users",     route: "/amigos" },
  { label: "Grupos",      icon: "globe",     route: "/grupos" },
];

const SECONDARY_ITEMS: MenuItem[] = [
  { label: "Invitar a un amigo", icon: "share-2",    route: "/invitar" },
  { label: "Ayuda",              icon: "help-circle", route: "/ayuda" },
  { label: "Configuraciones",    icon: "settings",    route: "/configuraciones" },
  { label: "Resetear app (prueba)", icon: "refresh-cw", route: "/dev-reset" },
];

export function DrawerMenu() {
  const { isOpen: visible, instant, close: onClose } = useDrawer();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isRegistered, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const { username, lastName, photoUri } = useUserProfile();

  const loggedIn = isRegistered || isSignedIn;
  const clerkName =
    clerkUser?.firstName ||
    clerkUser?.fullName ||
    clerkUser?.username ||
    clerkUser?.primaryEmailAddress?.emailAddress ||
    null;
  const clerkPhoto = clerkUser?.imageUrl || null;

  const translateX = useRef(new Animated.Value(-DRAWER_W)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [rendered, setRendered] = useState(visible);

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => {
    if (visible) {
      setRendered(true);
      if (instant) {
        translateX.setValue(0);
        overlayOpacity.setValue(1);
        return;
      }
      Animated.parallel([
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: ND,
          damping: 28,
          stiffness: 200,
          overshootClamping: true,
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
          duration: 220,
          useNativeDriver: ND,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 0,
          duration: 220,
          useNativeDriver: ND,
        }),
      ]).start(({ finished }) => {
        if (finished) setRendered(false);
      });
    }
  }, [visible, translateX, overlayOpacity]);

  if (!rendered) return null;

  const mainItems = loggedIn ? LOGGED_IN_ITEMS : LOGGED_OUT_ITEMS;
  const localFullName = [username, lastName].filter(Boolean).join(" ");
  const hasLocalName = !!localFullName && localFullName !== "Explorador de Sonido";
  const fullName = hasLocalName ? localFullName : (clerkName || "Explorador");
  const displayPhoto = photoUri || clerkPhoto;

  const navigate = (route: string) => {
    onClose();
    markDrawerReopenOnHome();
    router.push(route as never);
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View
        style={[styles.overlay, { opacity: overlayOpacity }]}
        pointerEvents={visible ? "auto" : "none"}
      >
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={["rgba(30,25,20,1)", "rgba(14,12,10,1)"]}
          style={[styles.drawerInner, { paddingTop: topPad + 16, paddingBottom: bottomPad + 24 }]}
        >
          {/* Perfil del usuario (si está logueado) — con X a la derecha */}
          {loggedIn ? (
            <View style={styles.profileSection}>
              {displayPhoto ? (
                <Image source={{ uri: displayPhoto }} style={styles.profilePhoto} contentFit="cover" />
              ) : (
                <View style={styles.profilePhotoFallback}>
                  <Feather name="user" size={22} color="#B6955F" />
                </View>
              )}
              <View style={styles.profileInfo}>
                <Text style={styles.profileName} numberOfLines={1}>{fullName || "Explorador"}</Text>
                <Pressable
                  onPress={() => navigate("/(tabs)/profile")}
                  style={styles.verPerfilBtn}
                >
                  <Text style={styles.verPerfilText}>Ver Perfil</Text>
                  <Feather name="chevron-right" size={11} color="#B6955F" />
                </Pressable>
              </View>
              <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                <Feather name="x" size={20} color="#B6955F" />
              </Pressable>
            </View>
          ) : (
            <View style={styles.closeBtnRow}>
              <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                <Feather name="x" size={20} color="#B6955F" />
              </Pressable>
            </View>
          )}

          {/* Items principales */}
          <View style={styles.itemGroup}>
            {mainItems.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => navigate(item.route)}
                style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
              >
                {item.label === "Premium" ? (
                  <View style={styles.premiumIconCircle}>
                    <Image source={require("../assets/images/estrella-premium.png")} style={{ width: 16, height: 16 }} contentFit="contain" />
                  </View>
                ) : (
                  <View style={styles.itemIcon}>
                    <Feather name={item.icon} size={17} color="#FFFFFF" />
                  </View>
                )}
                <Text style={[styles.itemLabel, { color: item.label === "Premium" ? "#F5EAC8" : "#FFFFFF" }]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={[styles.divider, { backgroundColor: "#B6955F22", marginVertical: 16 }]} />

          {/* Items secundarios */}
          <View style={styles.itemGroup}>
            {SECONDARY_ITEMS.map((item) => (
              <Pressable
                key={item.label}
                onPress={() => navigate(item.route)}
                style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
              >
                <View style={styles.itemIcon}>
                  <Feather name={item.icon} size={17} color="#FFFFFF" />
                </View>
                <Text style={[styles.itemLabel, styles.itemLabelMuted, { color: "#FFFFFF" }]}>{item.label}</Text>
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
    backgroundColor: "rgba(0,0,0,0.78)",
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
    borderRightWidth: 1,
    borderRightColor: "rgba(180,180,180,0.14)",
  },
  closeBtnRow: {
    alignItems: "flex-end",
    marginBottom: 8,
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

  // Perfil
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 16,
    paddingHorizontal: 4,
    marginBottom: 4,
  },
  profilePhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#B6955F",
  },
  profilePhotoFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#B6955F",
    backgroundColor: "rgba(182,149,95,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    color: "#C8C1B5",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  verPerfilBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    alignSelf: "flex-start",
  },
  verPerfilText: {
    color: "#B6955F",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },

  // Items
  itemGroup: { gap: 2 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 14,
  },
  itemPressed: { backgroundColor: "rgba(182,149,95,0.1)" },
  itemIcon: { width: 26, alignItems: "center" },
  premiumIconCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#17352A",
    borderWidth: 1,
    borderColor: "#A97A34",
    alignItems: "center",
    justifyContent: "center",
  },
  premiumIconText: { fontSize: 11, color: "#F0C36A" },
  itemLabel: {
    color: "#C8C1B5",
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  itemLabelMuted: {
    color: "#9E8060",
    fontSize: 14,
  },
});
