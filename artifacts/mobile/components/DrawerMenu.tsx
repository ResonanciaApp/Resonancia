import { Feather } from "@expo/vector-icons";
import { useUser } from "@clerk/expo";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React from "react";
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
import { useDrawer, DRAWER_W, DRAWER_PUSH } from "@/context/DrawerContext";
import { useUserProfile } from "@/context/UserProfileContext";
import { usePremium } from "@/context/PremiumContext";

const ND = Platform.OS !== "web";

type MenuItem = {
  label: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  route: string;
};

const MAIN_ITEMS: MenuItem[] = [
  { label: "Historial",   icon: "clock",     route: "/historial" },
  { label: "Geometrix",   icon: "hexagon",   route: "/(tabs)/geometrix" },
  { label: "Diario",      icon: "book-open", route: "/diario" },
  { label: "Amigos",      icon: "users",     route: "/amigos" },
  { label: "Grupos",      icon: "globe",     route: "/grupos" },
  { label: "Tu Premium",  icon: "star",      route: "/membresia" },
];

const SECONDARY_ITEMS: MenuItem[] = [
  { label: "Invita a un amigo", icon: "share-2",    route: "/invitar" },
  { label: "Ayuda",             icon: "help-circle", route: "/ayuda" },
  { label: "Configuraciones",   icon: "settings",    route: "/configuraciones" },
];

// ── Chip de estado Premium — Variante A (borde fino) ─────────────────────────
function PremiumChip({ isPremium }: { isPremium: boolean }) {
  if (isPremium) {
    return (
      <View style={chipStyles.chipPremium}>
        <Feather name="star" size={11} color="#D4AF37" />
        <Text style={chipStyles.chipTextPremium}>Premium</Text>
      </View>
    );
  }
  return (
    <View style={chipStyles.chipFree}>
      <Feather name="lock" size={11} color="rgba(242,231,228,0.38)" />
      <Text style={chipStyles.chipTextFree}>Plan Gratuito</Text>
    </View>
  );
}

const chipStyles = StyleSheet.create({
  chipPremium: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.55)",
    marginTop: 6,
    // glow asimétrico — anclado abajo-derecha (65% 60%)
    shadowColor: "#D4AF37",
    shadowOffset: { width: 2, height: 3 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
    elevation: 8,
  },
  chipTextPremium: {
    color: "#D4AF37",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  chipFree: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "rgba(242,231,228,0.18)",
    marginTop: 6,
  },
  chipTextFree: {
    color: "rgba(242,231,228,0.38)",
    fontSize: 11,
    fontWeight: "500",
    letterSpacing: 0.3,
  },
});

// ── Drawer principal ──────────────────────────────────────────────────────────
export function DrawerMenu() {
  const { isOpen: visible, drawerAnim, close: onClose, markInstantNav } = useDrawer();
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

  const translateX = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-DRAWER_PUSH, 0],
  });

  const localFullName = [username, lastName].filter(Boolean).join(" ");
  const hasLocalName = !!localFullName && localFullName !== "Explorador de Sonido";
  const fullName = hasLocalName ? localFullName : (clerkName || "");
  const displayPhoto = photoUri || clerkPhoto;
  const initial = (fullName || clerkName || "").charAt(0).toUpperCase() || null;

  const navigate = (route: string) => {
    markInstantNav();
    onClose();
    router.push(route as never);
  };

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      {visible && (
        <Pressable
          style={[StyleSheet.absoluteFill, { left: DRAWER_PUSH }]}
          onPress={onClose}
        />
      )}

      <Animated.View style={[styles.drawer, visible && styles.drawerShadow, { transform: [{ translateX }] }]}>
        <View style={[styles.drawerInner, { paddingBottom: bottomPad + 24, backgroundColor: "#130107" }]}>

          {/* ── Header de perfil ── */}
          <LinearGradient
            colors={["#2E0510", "#160108"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={[styles.profileHeader, { paddingTop: topPad + 16 }]}
          >
            {/* Fila avatar + nombre + cerrar */}
            <View style={styles.profileSection}>
              {displayPhoto ? (
                <Image source={{ uri: displayPhoto }} style={styles.profilePhoto} contentFit="cover" />
              ) : loggedIn && initial ? (
                <View style={styles.profilePhotoFallback}>
                  <Text style={styles.profileInitial}>{initial}</Text>
                </View>
              ) : (
                <View style={[styles.profilePhotoFallback, !loggedIn && styles.profilePhotoGuest]}>
                  <Feather name="user" size={22} color={loggedIn ? "#D4AF37" : "rgba(242,231,228,0.45)"} />
                </View>
              )}

              <View style={styles.profileInfo}>
                {loggedIn ? (
                  <>
                    <Text style={styles.profileName} numberOfLines={1}>{fullName || "Mi perfil"}</Text>
                    <Pressable onPress={() => navigate("/(tabs)/profile")} style={styles.verPerfilBtn}>
                      <Text style={styles.verPerfilText}>Ver Perfil</Text>
                      <Feather name="chevron-right" size={11} color="#D4AF37" />
                    </Pressable>
                    {/* Chip de estado Premium */}
                    <PremiumChip isPremium={isPremium} />
                  </>
                ) : (
                  <>
                    <Text style={styles.profileNameMuted}>No conectado</Text>
                    <Pressable onPress={() => navigate("/(auth)/sign-in")} style={styles.verPerfilBtn}>
                      <Text style={styles.verPerfilText}>Iniciar sesión</Text>
                      <Feather name="chevron-right" size={11} color="#D4AF37" />
                    </Pressable>
                  </>
                )}
              </View>

              <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                <Feather name="x" size={20} color="#D4AF37" />
              </Pressable>
            </View>
          </LinearGradient>

          {/* Divisor */}
          <View style={styles.headerDivider} />

          {/* ── Menú scrollable ── */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 5 }}
          >
            <View style={styles.itemGroup}>
              {MAIN_ITEMS.map((item) => (
                <Pressable
                  key={item.label}
                  onPress={() => navigate(item.route)}
                  style={({ pressed }) => [styles.item, pressed && styles.itemPressed]}
                >
                  <View style={styles.itemIcon}>
                    {item.label === "Tu Premium" ? (
                      <Image
                        source={require("../assets/images/estrella-premium.png")}
                        style={{ width: 17, height: 17 }}
                        contentFit="contain"
                      />
                    ) : (
                      <Feather name={item.icon} size={17} color="#FFFFFF" />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.itemLabel,
                      item.label === "Tu Premium" && { color: "#D4AF37" },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={[styles.divider, { backgroundColor: "#D4AF3710", marginVertical: 16 }]} />

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
                  <Text style={[styles.itemLabel, styles.itemLabelMuted]}>{item.label}</Text>
                </Pressable>
              ))}
            </View>
          </ScrollView>
        </View>
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
  },
  drawerShadow: {
    shadowColor: "#000",
    shadowOffset: { width: 6, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 20,
  },
  drawerInner: {
    flex: 1,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderRightColor: "rgba(180,180,180,0.10)",
  },

  // ── Header ──
  profileHeader: {
    paddingHorizontal: 20,
    paddingBottom: 24,      // ajustado
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(212,175,55,0.18)",
    marginTop: -25,
    marginBottom: 8,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "flex-start",  // flex-start para que el chip no estire el avatar
    gap: 12,
    paddingTop: 1,
    paddingBottom: 16,
    paddingHorizontal: 4,
  },
  profilePhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#D4AF37",
    marginTop: 2,
  },
  profilePhotoFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#D4AF37",
    backgroundColor: "rgba(212,175,55,0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  profilePhotoGuest: {
    borderColor: "rgba(242,231,228,0.18)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  profileName: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  profileNameMuted: {
    color: "rgba(242,231,228,0.45)",
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  profileInitial: {
    color: "#D4AF37",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  verPerfilBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    alignSelf: "flex-start",
  },
  verPerfilText: {
    color: "#D4AF37",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  closeBtn: {
    width: 32,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },

  // ── Items ──
  itemGroup: { gap: 2 },
  divider: { height: 1, marginBottom: 8 },
  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 14,
  },
  itemPressed: { backgroundColor: "rgba(212,175,55,0.08)" },
  itemIcon: { width: 26, alignItems: "center" },
  itemLabel: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  itemLabelMuted: {
    color: "rgba(242,231,228,0.55)",
    fontSize: 14,
    fontWeight: "400",
  },
});
