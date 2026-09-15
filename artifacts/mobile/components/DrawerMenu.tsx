import { Feather } from "@expo/vector-icons";
import { useUser } from "@clerk/expo";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";

import { router } from "expo-router";
import React from "react";
import {
  Animated,
  PanResponder,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useDrawer, DRAWER_W, DRAWER_PUSH } from "@/context/DrawerContext";
import { openCategoryGlobal } from "@/context/CategoryOverlayContext";
import { useUserProfile } from "@/context/UserProfileContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useGeometrixPanel } from "@/context/GeometrixPanelContext";
import { useMixerPanel } from "@/context/MixerPanelContext";

const ND = Platform.OS !== "web";

type MenuItem = {
  id?: string;
  label: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  mciIcon?: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  route: string;
};

const INICIO3_SECTIONS: { title: string; items: MenuItem[] }[] = [
  {
    title: "Mi espacio",
    items: [
      { id: "favorites", label: "Favoritos", icon: "heart", mciIcon: "heart-outline", route: "__overlay:/favoritos-todos" },
      { id: "history", label: "Historial", icon: "clock", mciIcon: "history", route: "__overlay:/historial" },
      { id: "downloads", label: "Descargas", icon: "download", mciIcon: "download-outline", route: "/descargas" },
      { id: "library", label: "Biblioteca", icon: "book", mciIcon: "bookshelf", route: "/(tabs)/biblioteca" },
      { id: "mood-register", label: "Registro de ánimo", icon: "smile", mciIcon: "emoticon-happy-outline", route: "__mood_register" },
      { id: "mood-history", label: "Historial estado de ánimo", icon: "activity", mciIcon: "chart-timeline-variant", route: "/historial-emociones" },
    ],
  },
  {
    title: "Herramientas",
    items: [
      { id: "mixer", label: "Mezclador de sonidos", icon: "sliders", mciIcon: "tune-vertical", route: "__mixer" },
      { id: "breathing", label: "Ejercicios de respiración", icon: "wind", mciIcon: "weather-windy", route: "/respiracion" },
      { id: "practice-reminders", label: "Recordatorio de prácticas", icon: "bell", mciIcon: "bell-outline", route: "/notificaciones-practica" },
      { id: "notes", label: "Mis notas", icon: "book-open", mciIcon: "notebook-outline", route: "__overlay:/diario" },
      { id: "geometrix", label: "Geometrix", icon: "hexagon", mciIcon: "hexagon-multiple-outline", route: "__geometrix" },
    ],
  },
];

// ── Drawer principal ──────────────────────────────────────────────────────────
export function DrawerMenu() {
  const { isOpen: visible, drawerAnim, close: onClose, markInstantNav, openLib, openOverlay, overlayParallax, requestMoodPicker } = useDrawer();
  const insets = useSafeAreaInsets();
  const { isRegistered, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const { username, lastName, photoUri } = useUserProfile();
  const { theme: activeTheme } = useSceneTheme();
  const { openGeometrix } = useGeometrixPanel();
  const { openMixer } = useMixerPanel();

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

  const translateX = React.useMemo(() => drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [-DRAWER_PUSH, 0],
  }), [drawerAnim]);

  const drawerOpacity = drawerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const dragX = React.useRef(new Animated.Value(0)).current;

  // Nodo de transform ESTABLE entre renders: recrearlo en cada render
  // re-ata el nodo nativo y produce un glitch de un frame al abrir overlays.
  const drawerTranslate = React.useMemo(
    () =>
      Animated.add(
        Animated.add(translateX, dragX),
        overlayParallax.interpolate({ inputRange: [0, 1], outputRange: [0, -56] }),
      ),
    [translateX, dragX, overlayParallax],
  );

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

  React.useLayoutEffect(() => {
    if (!visible) return;
    dragX.stopAnimation();
    dragX.setValue(0);
  }, [dragX, visible]);

  const localFullName = [username, lastName].filter(Boolean).join(" ");
  const hasLocalName = !!localFullName && localFullName !== "Explorador de Sonido";
  const fullName = hasLocalName ? localFullName : (clerkName || "");
  const displayPhoto = photoUri || clerkPhoto;
  const initial = (fullName || clerkName || "").charAt(0).toUpperCase() || null;

  const navigate = (route: string) => {
    // Overlays sobre el drawer (menú queda abierto debajo)
    if (route === "__biblioteca_overlay") { openLib(); return; }
    if (route === "__mood_register") { onClose(); requestMoodPicker(); return; }
    if (route === "__mixer") { onClose(); openMixer(); return; }
    if (route === "__geometrix") { onClose(); openGeometrix(); return; }
    if (route.startsWith("__overlay:")) { openOverlay(route.replace("__overlay:", "")); return; }
    if (route.startsWith("__cat:")) {
      const target = route.replace("__cat:", "");
      onClose();
      if (openCategoryGlobal(target)) return;
      markInstantNav();
      router.push(target as never);
      return;
    }
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
        style={[
          styles.drawer,
          visible && styles.drawerShadow,
          {
            bottom: 0,
            transform: [{ translateX: drawerTranslate }],
            opacity: drawerOpacity,
          },
        ]}
      >
        <LinearGradient
          style={styles.drawerInner}
          colors={[...activeTheme.gradient] as [string, string, ...string[]]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        >
          <Pressable
            onPress={onClose}
            style={[
              styles.drawerEmptyCloseZone,
              styles.drawerTopCloseZone,
              { height: topPad + 12 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Cerrar menú"
          />
          <Pressable
            onPress={onClose}
            style={[
              styles.drawerEmptyCloseZone,
              styles.drawerBottomCloseZone,
              { height: bottomPad + 24 },
            ]}
            accessibilityRole="button"
            accessibilityLabel="Cerrar menú"
          />

          {/* ── Header de perfil ── */}
          <View style={[styles.profileHeader, { paddingTop: topPad + 16 }]}>
            {/* Fila avatar + nombre + cerrar */}
            <View style={styles.profileSection}>
              {displayPhoto ? (
                <Image
                  source={{ uri: displayPhoto }}
                  style={[styles.profilePhoto, styles.inicio3ProfilePhoto]}
                  contentFit="cover"
                />
              ) : loggedIn && initial ? (
                <View style={[styles.profilePhotoFallback, styles.inicio3ProfilePhoto]}>
                  <Text style={styles.profileInitial}>{initial}</Text>
                </View>
              ) : (
                <View style={[
                  styles.profilePhotoFallback,
                  !loggedIn && styles.profilePhotoGuest,
                  styles.inicio3ProfilePhoto,
                ]}>
                  <Feather name="user" size={22} color={loggedIn ? "#F9F9F9" : "#c2c2c2"} />
                </View>
              )}

              <View style={styles.profileInfo}>
                {loggedIn ? (
                  <>
                    <Pressable
                      onPress={() => navigate("/(tabs)/profile")}
                      style={styles.profileNameRow}
                      accessibilityRole="button"
                      accessibilityLabel="Ver perfil"
                    >
                      <Text style={styles.profileName} numberOfLines={1}>
                        {fullName || "Mi perfil"}
                      </Text>
                    </Pressable>
                    <Pressable
                      onPress={() => navigate("/(tabs)/profile")}
                      style={styles.verPerfilBtn}
                      accessibilityRole="button"
                      accessibilityLabel="Ver perfil"
                    >
                      <Text style={[styles.verPerfilText, styles.inicio3VerPerfilText]}>
                        Ver perfil
                      </Text>
                    </Pressable>
                  </>
                ) : (
                  <>
                    <Text style={styles.profileNameMuted}>No conectado</Text>
                    <Pressable onPress={() => navigate("/(auth)/sign-in")} style={styles.verPerfilBtn}>
                      <Text style={styles.verPerfilText}>Iniciar sesión</Text>
                      <Feather name="chevron-right" size={11} color="#F9F9F9" />
                    </Pressable>
                  </>
                )}
              </View>

              {loggedIn && (
                <Pressable
                  onPress={() => navigate("/(tabs)/profile")}
                  hitSlop={10}
                  style={styles.profileChevronButton}
                  accessibilityRole="button"
                  accessibilityLabel="Ver perfil"
                >
                  <Feather name="chevron-right" size={23} color="#DEDEDE" />
                </Pressable>
              )}
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
            <View style={styles.inicio3Sections}>
              {INICIO3_SECTIONS.map((section, sectionIndex) => (
                <View key={section.title}>
                  {sectionIndex > 0 && <View style={styles.inicio3SectionDivider} />}
                  <Text style={styles.inicio3SectionTitle}>{section.title}</Text>
                  <View style={styles.itemGroup}>
                    {section.items.map((item) => (
                      <Pressable
                        key={item.label}
                        testID={item.id ? `drawer-item-${item.id}` : undefined}
                        onPress={() => navigate(item.route)}
                        style={styles.item}
                      >
                        <View style={styles.itemIcon}>
                          {item.mciIcon ? (
                            <MaterialCommunityIcons name={item.mciIcon} size={24} color="#F9F9F9" />
                          ) : (
                            <Feather name={item.icon} size={21} color="#F9F9F9" />
                          )}
                        </View>
                        <Text style={[styles.itemLabel, styles.inicio3ItemLabel]}>{item.label}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
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
    borderTopRightRadius: 31,
    borderBottomRightRadius: 31,
    overflow: "hidden",
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
  drawerEmptyCloseZone: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 30,
  },
  drawerTopCloseZone: {
    top: 0,
  },
  drawerBottomCloseZone: {
    bottom: 0,
  },

  // ── Header ──
  profileHeader: {
    paddingHorizontal: 20,
    paddingBottom: 0,
  },
  headerDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(212,175,55,0.18)",
    marginTop: 2,
    marginBottom: 0,
  },
  profileSection: {
    position: "relative",
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
    borderColor: "#F9F9F9",
  },
  profilePhotoFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "#F9F9F9",
    backgroundColor: "rgba(212,175,55,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  profilePhotoGuest: {
    borderColor: "rgba(250,240,238,0.18)",
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  inicio3ProfilePhoto: {
    width: 73,
    height: 73,
    borderRadius: 36.5,
    borderWidth: 1,
  },
  profileInfo: {
    flex: 1,
    gap: 3,
  },
  profileName: {
    fontFamily: "Manrope",
    color: "#FFFFFF",
    fontSize: 19,
    fontWeight: "700",
    letterSpacing: 0.2,
    flexShrink: 1,
  },
  profileNameRow: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 3,
  },
  profileChevronButton: {
    width: 32,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateX: 15 }],
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
    color: "#F9F9F9",
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
    color: "#F9F9F9",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.3,
  },
  inicio3VerPerfilText: {
    color: "#C8A6FF",
  },

  // ── Items ──
  itemGroup: { gap: 2 },
  divider: { height: 1, marginBottom: 8 },
  inicio3Sections: {
    marginTop: 8,
  },
  inicio3SectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginVertical: 12,
  },
  inicio3SectionTitle: {
    fontFamily: "Manrope",
    color: "rgba(255,255,255,0.58)",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1.1,
    textTransform: "uppercase",
    marginBottom: 4,
    paddingHorizontal: 2,
  },
  inicio3ItemLabel: {
    fontSize: 14,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 11,
    paddingHorizontal: 0,
    borderRadius: 10,
    gap: 14,
  },
  itemIcon: { width: 26, alignItems: "center" },
  itemLabel: {
    fontFamily: "Manrope",
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
});
