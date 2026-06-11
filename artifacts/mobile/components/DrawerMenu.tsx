import { Feather } from "@expo/vector-icons";
import { useUser } from "@clerk/expo";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Animated,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useDrawer, markDrawerReopenOnHome, DRAWER_W, DRAWER_PUSH } from "@/context/DrawerContext";
import { useUserProfile } from "@/context/UserProfileContext";
import { usePremium } from "@/context/PremiumContext";

const ND = Platform.OS !== "web";

type MenuItem = {
  label: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  route: string;
};

const LOGGED_OUT_ITEMS: MenuItem[] = [
  { label: "Crear cuenta",  icon: "user-plus", route: "/(auth)/sign-up" },
  { label: "Iniciar sesión", icon: "log-in",   route: "/(auth)/sign-in" },
  { label: "Premium",       icon: "star",      route: "/membresia" },
  { label: "Favoritos",     icon: "heart",     route: "/favorites" },
  { label: "Carpetas",      icon: "folder",    route: "/carpetas" },
  { label: "Playlists",     icon: "list",      route: "/playlists" },
  { label: "Amigos",        icon: "users",     route: "/amigos" },
  { label: "Grupos",        icon: "globe",     route: "/grupos" },
];

const LOGGED_IN_ITEMS: MenuItem[] = [
  { label: "Premium",       icon: "star",      route: "/membresia" },
  { label: "Favoritos",     icon: "heart",     route: "/favorites" },
  { label: "Carpetas",      icon: "folder",    route: "/carpetas" },
  { label: "Playlists",     icon: "list",      route: "/playlists" },
  { label: "Amigos",        icon: "users",     route: "/amigos" },
  { label: "Grupos",        icon: "globe",     route: "/grupos" },
];

const SECONDARY_ITEMS: MenuItem[] = [
  { label: "Invitar a un amigo", icon: "share-2",    route: "/invitar" },
  { label: "Ayuda",              icon: "help-circle", route: "/ayuda" },
  { label: "Configuraciones",    icon: "settings",    route: "/configuraciones" },
];

export function DrawerMenu() {
  const { isOpen: visible, drawerAnim, close: onClose } = useDrawer();
  const insets = useSafeAreaInsets();
  const { isRegistered, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const { username, lastName, photoUri } = useUserProfile();
  const { isPremium } = usePremium();

  const loggedIn = isRegistered || isSignedIn;
  const clerkName =
    clerkUser?.firstName ||
    clerkUser?.fullName ||
    clerkUser?.username ||
    clerkUser?.primaryEmailAddress?.emailAddress ||
    null;
  const clerkPhoto = clerkUser?.imageUrl || null;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  // Mount/unmount: mount immediately on open, unmount after close animation finishes
  const [rendered, setRendered] = useState(visible);
  useEffect(() => {
    if (visible) {
      setRendered(true);
    } else {
      const t = setTimeout(() => setRendered(false), 180);
      return () => clearTimeout(t);
    }
  }, [visible]);

  if (!rendered) return null;

  const translateX = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-DRAWER_PUSH, 0],
  });

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
      {/* Tap-outside to close — only active when drawer is open */}
      {visible && (
        <Pressable
          style={[StyleSheet.absoluteFill, { left: DRAWER_PUSH }]}
          onPress={onClose}
        />
      )}

      <Animated.View style={[styles.drawer, { transform: [{ translateX }] }]}>
        <LinearGradient
          colors={["#090D20", "#080A18", "#06070F"]}
          style={[styles.drawerInner, { paddingTop: topPad + 16, paddingBottom: bottomPad + 24 }]}
        >
          {/* Perfil del usuario (si está logueado) — con X a la derecha */}
          {loggedIn ? (
            <View style={styles.profileSection}>
              {displayPhoto ? (
                <Image source={{ uri: displayPhoto }} style={styles.profilePhoto} contentFit="cover" />
              ) : (
                <View style={styles.profilePhotoFallback}>
                  <Feather name="user" size={22} color="#BE9650" />
                </View>
              )}
              <View style={styles.profileInfo}>
                <Text style={styles.profileName} numberOfLines={1}>{fullName || "Explorador"}</Text>
                <Pressable
                  onPress={() => navigate("/(tabs)/profile")}
                  style={styles.verPerfilBtn}
                >
                  <Text style={styles.verPerfilText}>Ver Perfil</Text>
                  <Feather name="chevron-right" size={11} color="#BE9650" />
                </Pressable>
              </View>
              <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                <Feather name="x" size={20} color="#BE9650" />
              </Pressable>
            </View>
          ) : (
            <View style={styles.closeBtnRow}>
              <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                <Feather name="x" size={20} color="#BE9650" />
              </Pressable>
            </View>
          )}

          {/* Items principales + secundarios — scrollable */}
          <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
            <View style={styles.itemGroup}>
              {mainItems.map((item) => (
                <Pressable
                  key={item.label}
                  onPress={() => navigate(item.route)}
                  style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
                >
                  {item.label === "Premium" ? (
                    <View style={styles.itemIcon}>
                      <Image source={require("../assets/images/estrella-premium.png")} style={{ width: 18, height: 18 }} contentFit="contain" />
                    </View>
                  ) : (
                    <View style={styles.itemIcon}>
                      <Feather name={item.icon} size={17} color="#FFFFFF" />
                    </View>
                  )}
                  {item.label === "Premium" ? (
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 7 }}>
                      <Text style={[styles.itemLabel, { color: "#BE9650" }]}>Premium</Text>
                      {isPremium && (
                        <View style={styles.premiumCheck}>
                          <Feather name="check" size={11} color="#5FB98C" />
                        </View>
                      )}
                    </View>
                  ) : (
                    <Text style={[styles.itemLabel, { color: "#FFFFFF" }]}>
                      {item.label}
                    </Text>
                  )}
                </Pressable>
              ))}
            </View>

            <View style={[styles.divider, { backgroundColor: "#BE965010", marginVertical: 16 }]} />

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
          </ScrollView>
        </LinearGradient>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
    width: DRAWER_PUSH,
    shadowColor: "#000",
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 20,
  },
  drawerInner: {
    flex: 1,
    paddingHorizontal: 20,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "rgba(180,180,180,0.10)",
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
    borderColor: "#BE9650",
  },
  profilePhotoFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#BE9650",
    backgroundColor: "rgba(182,149,95,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileInfo: {
    flex: 1,
    gap: 4,
  },
  profileName: {
    color: "#FFFFFF",
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
    color: "#BE9650",
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
  itemPressed: { backgroundColor: "rgba(182,149,95,0.08)" },
  itemIcon: { width: 26, alignItems: "center" },
  premiumCheck: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "rgba(95,185,140,0.14)",
    borderWidth: 1,
    borderColor: "rgba(95,185,140,0.45)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
  },
  itemLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  itemLabelMuted: {
    color: "#9E8060",
    fontSize: 14,
  },
});
