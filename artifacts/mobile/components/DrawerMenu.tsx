import { Feather } from "@expo/vector-icons";
import { useUser } from "@clerk/expo";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

import { router } from "expo-router";
import React, { useEffect } from "react";
import {
  Animated,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useDrawer, DRAWER_W, DRAWER_PUSH } from "@/context/DrawerContext";
import { useUserProfile } from "@/context/UserProfileContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useIntencionDiaria } from "@/context/IntencionDiariaContext";
import { useSelectedScene } from "@/context/SelectedSceneContext";
import { SceneAnimationCard, type SceneItem } from "@/components/SceneAnimationCard";
import { SceneAnimationCtaCard } from "@/components/EscenasSheet";
import { useGeometrixCreations } from "@/hooks/useGeometrixCreations";
import type { GeometrixCreation } from "@/data/geometrix-creations";
import type { SceneAnimation } from "@workspace/api-client-react";
import { useGetSceneAnimations } from "@workspace/api-client-react";

const ND = Platform.OS !== "web";

type MenuItem = {
  label: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  route: string;
};

const MAIN_ITEMS: MenuItem[] = [
  { label: "Tu Premium",    icon: "star",      route: "/membresia" },
  { label: "Mis sesiones",  icon: "calendar",  route: "/mis-sesiones" },
  { label: "Historial",     icon: "clock",     route: "/historial" },
  { label: "Diario",        icon: "book-open", route: "/diario" },
  { label: "Amigos",        icon: "users",     route: "/amigos" },
  { label: "Grupos",        icon: "globe",     route: "/grupos" },
];

// ── Sección Escenas (dentro del drawer) ──────────────────────────────────────
const DRAWER_CONTENT_W = DRAWER_PUSH - 40; // ancho real del drawer − paddingHorizontal 20 (ScrollView) × 2 lados
const DRAWER_ANIM_CARD_SIZE = Math.floor((DRAWER_CONTENT_W - 16) / 2);
const DRAWER_ANIM_CARD_H = Math.round(DRAWER_ANIM_CARD_SIZE * 1.32);

/** Convierte una creación de Geometrix al shape mínimo que necesita SceneAnimationCard. */
function creationToSceneItem(c: GeometrixCreation): SceneItem {
  return {
    name: c.name,
    isPremium: false,
    recipe: { active: c.active, master: c.master, settings: c.settings },
  };
}

/** Convierte una creación de Geometrix al tipo SceneAnimation para el contexto. */
function creationToSceneAnimation(c: GeometrixCreation): SceneAnimation {
  return {
    id: parseInt(c.id, 10) || 0,
    name: c.name,
    description: null,
    phrase: null,
    recipe: { active: c.active, master: c.master, settings: c.settings },
    isActive: true,
    isPremium: false,
    sortOrder: 0,
    submittedBy: null,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  } as unknown as SceneAnimation;
}

// ── Drawer principal ──────────────────────────────────────────────────────────
export function DrawerMenu() {
  const { isOpen: visible, drawerAnim, close: onClose, markInstantNav } = useDrawer();
  const insets = useSafeAreaInsets();
  const { isRegistered, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const { username, lastName, photoUri } = useUserProfile();
  const { theme: activeTheme } = useSceneTheme();
  const { intencionDiariaEnabled, setIntencionDiariaEnabled } = useIntencionDiaria();
  const { setBgScene } = useSelectedScene();
  const { data: sceneAnimationsData } = useGetSceneAnimations();
  const geoScenes = sceneAnimationsData?.scenes ?? [];
  const { creations: geometrixCreations, reload: reloadCreations } = useGeometrixCreations();

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

  const drawerOpacity = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const dragX = React.useRef(new Animated.Value(0)).current;

  const panResponder = React.useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, { dx, dy }) =>
        dx < -8 && Math.abs(dx) > Math.abs(dy),
      onPanResponderMove: (_, { dx }) => {
        dragX.setValue(Math.min(0, dx));
      },
      onPanResponderRelease: (_, { dx, vx }) => {
        if (dx < -60 || vx < -0.5) {
          // No resetear dragX aquí: si se hace setValue(0) antes del cierre,
          // el drawer salta de vuelta a abierto y luego cierra (doble movimiento).
          // Dejamos dragX en su posición arrastrada; drawerAnim lleva el panel
          // fuera de pantalla y reseteamos dragX al terminar.
          onClose();
          setTimeout(() => dragX.setValue(0), 440);
        } else {
          Animated.spring(dragX, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
        }
      },
      onPanResponderTerminate: () => {
        Animated.spring(dragX, { toValue: 0, useNativeDriver: true, bounciness: 0 }).start();
      },
    })
  ).current;

  useEffect(() => {
    if (visible) reloadCreations();
  }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

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

      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.drawer, visible && styles.drawerShadow, { transform: [{ translateX: Animated.add(translateX, dragX) }], opacity: drawerOpacity }]}
      >
        <LinearGradient
          style={styles.drawerInner}
          colors={activeTheme.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >

          {/* ── Header de perfil ── */}
          <View style={[styles.profileHeader, { paddingTop: topPad + 16 }]}>
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
                  <Feather name="user" size={22} color={loggedIn ? "#F7CB6B" : "#c2c2c2"} />
                </View>
              )}

              <View style={styles.profileInfo}>
                {loggedIn ? (
                  <>
                    <Text style={styles.profileName} numberOfLines={1}>{fullName || "Mi perfil"}</Text>
                    <Pressable onPress={() => navigate("/mi-perfil")} style={styles.verPerfilBtn}>
                      <Text style={styles.verPerfilText}>Ver Perfil</Text>
                      <Feather name="chevron-right" size={11} color="#F7CB6B" />
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Text style={styles.profileNameMuted}>No conectado</Text>
                    <Pressable onPress={() => navigate("/(auth)/sign-in")} style={styles.verPerfilBtn}>
                      <Text style={styles.verPerfilText}>Iniciar sesión</Text>
                      <Feather name="chevron-right" size={11} color="#F7CB6B" />
                    </Pressable>
                  </>
                )}
              </View>

              <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
                <Feather name="x" size={20} color="#F7CB6B" />
              </Pressable>
            </View>

            {/* Divisor — dentro del gradiente */}
            <View style={styles.headerDivider} />
          </View>

          {/* ── Menú scrollable ── */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 5, paddingBottom: bottomPad + 40 }}
          >
            <View style={[styles.itemGroup, { marginTop: 8 }]}>
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
                      item.label === "Tu Premium" && { color: "#F7CB6B" },
                    ]}
                  >
                    {item.label}
                  </Text>
                </Pressable>
              ))}
            </View>

            <View style={[styles.divider, { backgroundColor: "#F7CB6B10", marginVertical: 16 }]} />

            {/* ── Sección Escenas ── */}
            <View style={styles.controlRow}>
              <MaterialCommunityIcons name="feather" size={17} color="#F4F4F4" style={styles.controlIcon} />
              <Text style={styles.controlLabel}>Activar intención diaria</Text>
              <Switch
                value={intencionDiariaEnabled}
                onValueChange={setIntencionDiariaEnabled}
                trackColor={{ false: "rgba(249,249,249,0.35)", true: "rgba(249,249,249,0.7)" }}
                thumbColor="#f9f9f9"
              />
            </View>

            <View style={{ marginTop: 18 }}>
              <View style={styles.sceneTitleRow}>
                <MaterialCommunityIcons name="star-four-points-outline" size={15} color="rgba(255,255,255,0.8)" />
                <Text style={styles.sceneTitle}>Escenas animadas</Text>
              </View>
              <View style={styles.sceneGrid}>
                {geoScenes.map((scene) => (
                  <SceneAnimationCard
                    key={`admin-${scene.id}`}
                    scene={scene}
                    size={DRAWER_ANIM_CARD_SIZE}
                    height={DRAWER_ANIM_CARD_H}
                    onPress={() => {
                      setBgScene(scene);
                      onClose();
                    }}
                  />
                ))}
                {geometrixCreations.length > 0 && (
                  <View style={styles.sceneSectionRow}>
                    <View style={styles.sceneSectionLine} />
                    <Text style={styles.sceneSectionLabel}>Mis animaciones</Text>
                    <View style={styles.sceneSectionLine} />
                  </View>
                )}
                {geometrixCreations.map((creation) => (
                  <SceneAnimationCard
                    key={`user-${creation.id}`}
                    scene={creationToSceneItem(creation)}
                    size={DRAWER_ANIM_CARD_SIZE}
                    height={DRAWER_ANIM_CARD_H}
                    onPress={() => {
                      setBgScene(creationToSceneAnimation(creation));
                      onClose();
                    }}
                  />
                ))}
                {/* CTA: siempre al final */}
                <View style={styles.ctaDivider} />
                <SceneAnimationCtaCard
                  size={DRAWER_ANIM_CARD_SIZE}
                  height={DRAWER_ANIM_CARD_H}
                  onPress={() => {
                    onClose();
                    router.navigate("/(tabs)/geometrix" as never);
                  }}
                />
              </View>
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
    paddingBottom: 0,
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(212,175,55,0.18)",
    marginTop: -3,
    marginBottom: 0,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
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
    borderColor: "#F7CB6B",
  },
  profilePhotoFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#F7CB6B",
    backgroundColor: "rgba(212,175,55,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  profilePhotoGuest: {
    borderColor: "rgba(250,240,238,0.18)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  profileName: {
    fontFamily: "Manrope",
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  profileNameMuted: {
    fontFamily: "Manrope",
    color: "#c2c2c2",
    fontSize: 14,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  profileInitial: {
    fontFamily: "Manrope",
    color: "#F7CB6B",
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
    fontFamily: "Manrope",
    color: "#F7CB6B",
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
    paddingHorizontal: 0,
    borderRadius: 10,
    gap: 14,
  },
  itemPressed: { backgroundColor: "rgba(212,175,55,0.08)" },
  itemIcon: { width: 26, alignItems: "center" },
  itemLabel: {
    fontFamily: "Manrope",
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
  itemLabelMuted: {
    fontFamily: "Manrope",
    color: "rgba(255,255,255,0.7)",
    fontSize: 14,
    fontWeight: "400",
  },

  // ── Sección Escenas ──
  controlRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(249,249,249,0.075)",
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginTop: 4,
  },
  controlIcon: { width: 20 },
  controlLabel: {
    fontFamily: "Manrope",
    flex: 1,
    fontSize: 14,
    fontWeight: "400",
    color: "#F9F9F9",
  },
  sceneTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginBottom: 10,
  },
  sceneTitle: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "600",
    color: "rgba(255,255,255,0.9)",
    letterSpacing: 0.2,
  },
  ctaDivider: {
    width: "100%",
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.15)",
    marginVertical: 4,
  },
  sceneGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
    paddingBottom: 12,
  },
  sceneSectionRow: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 4,
    marginTop: 4,
    marginBottom: 4,
  },
  sceneSectionLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(190,150,80,0.18)",
  },
  sceneSectionLabel: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "600",
    color: "rgba(190,150,80,0.65)",
    letterSpacing: 1.1,
    textTransform: "uppercase",
  },
});
