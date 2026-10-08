import { Feather } from "@expo/vector-icons";
import { useUser } from "@clerk/expo";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { DrawerSceneCards } from "@/components/DrawerSceneCards";
import { SceneThemeBackground } from "@/components/SceneThemeBackground";
import { scheduleSceneThemeHaptics } from "@/lib/scene-theme-transition";

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
import {
  useDrawer,
  DRAWER_W,
  DRAWER_PUSH,
  DRAWER_OVERLAY_PARALLAX_X,
} from "@/context/DrawerContext";
import { DURATION } from "@/constants/motion";
import { MEMBERSHIP_AURORA } from "@/constants/colors";
import { openCategoryGlobal } from "@/context/CategoryOverlayContext";
import { useUserProfile } from "@/context/UserProfileContext";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useCurrentUserAvatarSource } from "@/lib/profile-avatar";
import { useNotifications } from "@/context/NotificationsContext";
import { usePremium } from "@/context/PremiumContext";
import { useMixerPanel } from "@/context/MixerPanelContext";
import { SessionBadgeGlass } from "@/components/SessionDurationBadge";

const ND = Platform.OS !== "web";

type MenuItem = {
  id?: string;
  label: string;
  icon: React.ComponentProps<typeof Feather>["name"];
  mciIcon?: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  route: string;
  color?: string;
};

const INICIO3_SECTIONS: { title: string | null; items: MenuItem[] }[] = [
  {
    title: null,
    items: [
      { id: "premium", label: "Tu Premium", icon: "star", route: "__overlay:/membresia", color: MEMBERSHIP_AURORA.premium.accent },
      { id: "favorites", label: "Favoritos", icon: "heart", mciIcon: "heart-outline", route: "__overlay:/favoritos-todos" },
      { id: "library", label: "Biblioteca", icon: "book", mciIcon: "bookshelf", route: "__biblioteca_overlay" },
      { id: "history", label: "Historial", icon: "clock", mciIcon: "history", route: "__overlay:/historial" },
      { id: "downloads", label: "Descargas", icon: "download", mciIcon: "download-outline", route: "__overlay:/descargas" },
      { id: "notifications", label: "Notificaciones", icon: "bell", mciIcon: "bell-outline", route: "__overlay:/notificaciones" },
      { id: "mixer", label: "Mezclador", icon: "sliders", mciIcon: "tune-vertical", route: "__mixer", color: "#F9F9F9" },
      { id: "breathing", label: "Respiración", icon: "wind", mciIcon: "weather-windy", route: "/respiracion", color: "#F9F9F9" },
      { id: "mood-register", label: "Registro de ánimo", icon: "smile", mciIcon: "emoticon-happy-outline", route: "__mood_picker", color: "#F9F9F9" },
    ],
  },
];

// ── Drawer principal ──────────────────────────────────────────────────────────
export function DrawerMenu() {
  const {
    isOpen: visible,
    drawerAnim,
    close: onClose,
    markInstantNav,
    openLibFromDrawer,
    openOverlay,
    openOverlayFromDrawer,
    overlayParallax,
    drawerTransitionProgress,
    requestWallCompose,
    requestMoodPicker,
  } = useDrawer();
  const insets = useSafeAreaInsets();
  const { isRegistered, isSignedIn } = useAuth();
  const { user: clerkUser } = useUser();
  const { username, lastName } = useUserProfile();
  const avatarSource = useCurrentUserAvatarSource();
  const { activeSceneId, setActiveScene } = useSceneTheme();
  const cancelThemeHaptics = React.useRef<(() => void) | null>(null);
  React.useEffect(() => {
    if (!visible) cancelThemeHaptics.current?.();
    return () => { cancelThemeHaptics.current?.(); };
  }, [visible]);
  const selectVisualTheme = (id: "cloudy" | "indigo2" | "natural" | "pleyades") => {
    if (id === activeSceneId) return;
    cancelThemeHaptics.current?.();
    setActiveScene(id);
    if (ND) {
      cancelThemeHaptics.current = scheduleSceneThemeHaptics(() => {
        void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch((error) => {
          console.warn("[theme] No se pudo ejecutar la háptica suave", error);
        });
      });
    }
  };
  const { unreadCount } = useNotifications();
  const { isPremium, hydrated: premiumHydrated } = usePremium();
  const { openMixer } = useMixerPanel();

  const loggedIn = isRegistered || isSignedIn;
  const clerkName =
    clerkUser?.firstName ||
    clerkUser?.fullName ||
    clerkUser?.username ||
    clerkUser?.primaryEmailAddress?.emailAddress ||
    null;

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
  const dragResetTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  // Nodo de transform ESTABLE entre renders: recrearlo en cada render
  // re-ata el nodo nativo y produce un glitch de un frame al abrir overlays.
  const drawerTranslate = React.useMemo(
    () =>
      Animated.add(
        Animated.add(
          Animated.add(translateX, dragX),
          overlayParallax.interpolate({
            inputRange: [0, 1],
            outputRange: [0, DRAWER_OVERLAY_PARALLAX_X],
          }),
        ),
        drawerTransitionProgress.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -18],
          extrapolate: "clamp",
        }),
      ),
    [translateX, dragX, overlayParallax, drawerTransitionProgress],
  );
  const historyScale = React.useMemo(
    () => drawerTransitionProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.985],
      extrapolate: "clamp",
    }),
    [drawerTransitionProgress],
  );
  const historyOpacity = React.useMemo(
    () => drawerTransitionProgress.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.985],
      extrapolate: "clamp",
    }),
    [drawerTransitionProgress],
  );
  const composedDrawerOpacity = React.useMemo(
    () => Animated.multiply(drawerOpacity, historyOpacity),
    [drawerOpacity, historyOpacity],
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
          if (dragResetTimer.current) clearTimeout(dragResetTimer.current);
          dragResetTimer.current = setTimeout(() => {
            dragX.setValue(0);
            dragResetTimer.current = null;
          }, DURATION.DRAWER + 32);
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
    if (dragResetTimer.current) {
      clearTimeout(dragResetTimer.current);
      dragResetTimer.current = null;
    }
    dragX.stopAnimation();
    dragX.setValue(0);
  }, [dragX, visible]);

  React.useEffect(
    () => () => {
      if (dragResetTimer.current) clearTimeout(dragResetTimer.current);
    },
    [],
  );

  const localFullName = [username, lastName].filter(Boolean).join(" ");
  const hasLocalName = !!localFullName && localFullName !== "Explorador de Sonido";
  const fullName = hasLocalName ? localFullName : (clerkName || "");
  const initial = (fullName || clerkName || "").charAt(0).toUpperCase() || null;

  const navigate = (route: string) => {
    // Overlays sobre el drawer (menú queda abierto debajo)
    if (route === "__biblioteca_overlay") { openLibFromDrawer(); return; }
    if (route === "__mood_picker") {
      onClose();
      requestMoodPicker();
      return;
    }
    if (route === "__mixer") {
      onClose();
      openMixer();
      return;
    }
    if (route === "__profile_compose") {
      markInstantNav();
      onClose();
      requestWallCompose();
      router.push("/(tabs)/profile" as never);
      return;
    }
    if (route.startsWith("__overlay:")) {
      const target = route.replace("__overlay:", "");
      if (["/historial", "/favoritos-todos", "/diario", "/descargas", "/notificaciones", "/amigos", "/grupos", "/membresia"].includes(target)) {
        openOverlayFromDrawer(target);
      } else {
        openOverlay(target);
      }
      return;
    }
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
      <Pressable
        pointerEvents={visible ? "auto" : "none"}
        style={[StyleSheet.absoluteFill, { left: DRAWER_PUSH }]}
        onPress={onClose}
      />

      <Animated.View
        renderToHardwareTextureAndroid
        shouldRasterizeIOS
        {...panResponder.panHandlers}
        style={[
          styles.drawer,
          styles.drawerShadow,
          {
            bottom: 0,
            transform: [{ translateX: drawerTranslate }, { scale: historyScale }],
            opacity: composedDrawerOpacity,
          },
        ]}
      >
        <View style={styles.drawerInner}>
          <SceneThemeBackground />
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
              {avatarSource ? (
                <View style={[styles.profilePhoto, styles.inicio3ProfilePhoto]}>
                  <Image
                    source={avatarSource}
                    style={styles.profilePhotoImage}
                    contentFit="cover"
                  />
                </View>
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

          </View>

          {/* ── Menú scrollable ── */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingHorizontal: 20, paddingTop: 5, paddingBottom: bottomPad + 40 }}
          >
            <View style={styles.inicio3Sections}>
              {INICIO3_SECTIONS.map((section, sectionIndex) => (
                <View
                  key={section.title ?? `drawer-section-${sectionIndex}`}
                >
                  {sectionIndex > 0 && <View style={styles.inicio3SectionDivider} />}
                  {section.title && <Text style={styles.inicio3SectionTitle}>{section.title}</Text>}
                  <View style={styles.itemGroup}>
                    {section.items.map((item) => (
                      <React.Fragment key={item.label}>
                        <Pressable
                          testID={item.id ? `drawer-item-${item.id}` : undefined}
                          onPress={() => navigate(item.route)}
                          style={styles.item}
                          accessibilityLabel={
                            item.id === "premium"
                              ? `${premiumHydrated && !isPremium ? "Prueba" : "Tu"} Premium`
                              : undefined
                          }
                        >
                          <View style={styles.itemIcon}>
                            {item.id === "premium" ? (
                              <Image
                                source={require("../assets/images/estrella-premium.png")}
                                style={styles.premiumMenuStar}
                                contentFit="contain"
                              />
                            ) : item.mciIcon ? (
                              <MaterialCommunityIcons name={item.mciIcon} size={23} color={item.color ?? "#F9F9F9"} />
                            ) : (
                              <Feather name={item.icon} size={20} color={item.color ?? "#F9F9F9"} />
                            )}
                            {item.id === "notifications" && unreadCount > 0 && (
                              <View pointerEvents="none" style={styles.notificationBadge}>
                                <View style={styles.notificationBadgeGlass}>
                                  <SessionBadgeGlass showBlackTint={false} showWhiteTint />
                                </View>
                                <Text style={styles.notificationBadgeText}>
                                  {unreadCount > 9 ? "9+" : unreadCount}
                                </Text>
                              </View>
                            )}
                          </View>
                          {item.id === "premium" ? (
                            <View style={styles.premiumLabelRow}>
                              {premiumHydrated && !isPremium ? (
                                <Text style={[styles.itemLabel, styles.inicio3ItemLabel, styles.premiumPromoNeutral]}>
                                  Prueba
                                </Text>
                              ) : (
                                <Text style={styles.premiumPromoHighlight}>Tu</Text>
                              )}
                              <Text style={styles.premiumPromoHighlight}>Premium</Text>
                            </View>
                          ) : (
                            <Text style={[styles.itemLabel, styles.inicio3ItemLabel, item.color && { color: item.color }]}>
                              {item.label}
                            </Text>
                          )}
                        </Pressable>
                      </React.Fragment>
                    ))}
                  </View>
                </View>
              ))}
            </View>

            <DrawerSceneCards activeId={activeSceneId} onSelect={selectVisualTheme} />
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
    borderWidth: 0,
    overflow: "hidden",
  },
  profilePhotoImage: {
    ...StyleSheet.absoluteFillObject,
    transform: [{ scale: 1.06 }],
  },
  profilePhotoFallback: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 0,
    backgroundColor: "rgba(212,175,55,0.12)",
    alignItems: "center",
    justifyContent: "center",
  },
  profilePhotoGuest: {
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  inicio3ProfilePhoto: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
  },
  profileInfo: {
    flex: 1,
    gap: 3,
    justifyContent: "center",
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
    color: "#F9F9F9",
  },
  // ── Items ──
  itemGroup: { gap: 2, marginTop: 10 },
  inicio3Sections: {
    marginTop: -1,
  },
  inicio3SectionDivider: {
    height: 1,
    marginTop: 24,
    marginBottom: 10,
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
    paddingVertical: 6.5,
    paddingHorizontal: 0,
    borderRadius: 10,
    gap: 14,
  },
  itemIcon: { width: 26, alignItems: "center" },
  notificationBadge: {
    position: "absolute",
    left: -7,
    top: -7,
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  notificationBadgeGlass: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 9,
    overflow: "hidden",
  },
  notificationBadgeText: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 9,
    lineHeight: 11,
    fontWeight: "700",
    textAlign: "center",
  },
  premiumMenuStar: {
    width: 21,
    height: 21,
  },
  premiumLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  premiumPromoNeutral: {
    color: "#F9F9F9",
  },
  premiumPromoHighlight: {
    color: MEMBERSHIP_AURORA.premium.accent,
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  itemLabel: {
    fontFamily: "Manrope",
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "500",
    letterSpacing: 0.2,
  },
});
