import { Feather } from "@expo/vector-icons";
import { useUser } from "@clerk/expo";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import { DrawerSceneCards } from "@/components/DrawerSceneCards";
import { GrowthCurrentStagePill } from "@/components/GrowthJourney";
import { SceneThemeBackground } from "@/components/SceneThemeBackground";
import { scheduleSceneThemeHaptics } from "@/lib/scene-theme-transition";

import { router } from "expo-router";
import React from "react";
import {
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import RAnimated, { cancelAnimation, runOnJS, useAnimatedStyle, useSharedValue } from "react-native-reanimated";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/context/AuthContext";
import { useDrawer } from "@/context/DrawerContext";
import {
  DRAWER_GESTURE_FAIL_Y,
  dragProgress,
  drawerOffset,
  menuContentOpacity,
  menuContentTranslateY,
  shouldSettleOpen,
} from "@/lib/drawerGeometry";
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
      { id: "profile", label: "Perfil", icon: "user", route: "/(tabs)/profile" },
      { id: "premium", label: "Tu Premium", icon: "star", route: "__overlay:/membresia", color: MEMBERSHIP_AURORA.premium.accent },
      { id: "favorites", label: "Favoritos", icon: "heart", mciIcon: "heart-outline", route: "__overlay:/favoritos-todos" },
      { id: "library", label: "Biblioteca", icon: "book", mciIcon: "bookshelf", route: "__biblioteca_overlay" },
      { id: "history", label: "Historial", icon: "clock", mciIcon: "history", route: "__overlay:/historial" },
      { id: "downloads", label: "Descargas", icon: "download", mciIcon: "download-outline", route: "__overlay:/descargas" },
      { id: "notifications", label: "Notificaciones", icon: "bell", mciIcon: "bell-outline", route: "__overlay:/notificaciones" },
      { id: "mixer", label: "Mezclador", icon: "sliders", mciIcon: "tune-vertical", route: "__mixer", color: "#F9F9F9" },
      { id: "breathing", label: "Respiración", icon: "wind", mciIcon: "weather-windy", route: "/respiracion", color: "#F9F9F9" },
    ],
  },
];

// ── Drawer principal ──────────────────────────────────────────────────────────
export function DrawerMenu() {
  const {
    isOpen: visible,
    close,
    drawerProgress,
    drawerWidth,
    drawerGestureVersion,
    beginDrawerDrag,
    settleDrawerDrag,
    selectFromDrawer,
    openLibFromDrawer,
    openOverlayFromDrawer,
    requestWallCompose,
    requestMoodPicker,
  } = useDrawer();
  const onClose = React.useCallback(() => close(), [close]);
  const onAvatarPress = React.useCallback(() => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft).catch(() => {});
    onClose();
  }, [onClose]);
  const { width: windowWidth } = useWindowDimensions();
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
  const { openMixerFromDrawer } = useMixerPanel();

  const loggedIn = isRegistered || isSignedIn;
  const clerkName =
    clerkUser?.firstName ||
    clerkUser?.fullName ||
    clerkUser?.username ||
    clerkUser?.primaryEmailAddress?.emailAddress ||
    null;

  const topPad = Platform.OS === "web" ? 67 : insets.top;
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  // Menu fijo: nunca se desliza horizontalmente. Solo su contenido aparece
  // con un fade rapido y baja 7 px, derivado del mismo progreso del drawer.
  const contentStyle = useAnimatedStyle(() => ({
    opacity: menuContentOpacity(drawerProgress.value),
    transform: [{ translateY: menuContentTranslateY(drawerProgress.value) }],
  }));
  const dragStart = useSharedValue(1);
  const dragging = useSharedValue(false);
  const gestureVersion = useSharedValue(0);
  const closePan = React.useMemo(
    () => Gesture.Pan()
      .activeOffsetX([-12, 10000])
      .failOffsetY([-DRAWER_GESTURE_FAIL_Y, DRAWER_GESTURE_FAIL_Y])
      .onStart(() => {
        cancelAnimation(drawerProgress);
        dragging.value = true;
        drawerGestureVersion.value += 1;
        gestureVersion.value = drawerGestureVersion.value;
        dragStart.value = drawerProgress.value;
        runOnJS(beginDrawerDrag)(gestureVersion.value);
      })
      .onUpdate((event) => {
        if (gestureVersion.value !== drawerGestureVersion.value) return;
        drawerProgress.value = dragProgress(dragStart.value, event.translationX, drawerWidth.value);
      })
      .onEnd((event) => {
        dragging.value = false;
        if (gestureVersion.value !== drawerGestureVersion.value) return;
        if (Number.isFinite(event.translationX)) {
          drawerProgress.value = dragProgress(dragStart.value, event.translationX, drawerWidth.value);
        }
        settleDrawerDrag(shouldSettleOpen(drawerProgress.value, event.velocityX), gestureVersion.value, event.velocityX);
      })
      .onFinalize(() => {
        if (!dragging.value) return;
        dragging.value = false;
        settleDrawerDrag(dragStart.value >= 0.5, gestureVersion.value);
      }),
    [beginDrawerDrag, dragging, dragStart, drawerGestureVersion, drawerProgress, drawerWidth, gestureVersion, settleDrawerDrag],
  );
  const menuWidth = drawerOffset(windowWidth);

  const localFullName = [username, lastName].filter(Boolean).join(" ");
  const hasLocalName = !!localFullName && localFullName !== "Explorador de Sonido";
  const fullName = hasLocalName ? localFullName : (clerkName || "");
  const initial = (fullName || clerkName || "").charAt(0).toUpperCase() || null;

  // Cada destino se prepara dentro de la superficie frontal que vuelve; el
  // cierre empieza cuando el destino confirma su layout o la ruta cambia.
  const navigate = (route: string) => {
    if (route === "__biblioteca_overlay") {
      selectFromDrawer({ kind: "layout", target: "library", run: () => openLibFromDrawer() });
      return;
    }
    if (route === "__mood_picker") {
      selectFromDrawer({ kind: "afterClose", run: requestMoodPicker });
      return;
    }
    if (route === "__mixer") {
      selectFromDrawer({ kind: "layout", target: "mixer", run: openMixerFromDrawer });
      return;
    }
    if (route === "__profile_compose") {
      selectFromDrawer({
        kind: "route",
        target: "/(tabs)/profile",
        run: () => {
          requestWallCompose();
          router.push("/(tabs)/profile" as never);
        },
      });
      return;
    }
    if (route.startsWith("__overlay:")) {
      const target = route.replace("__overlay:", "");
      selectFromDrawer({ kind: "layout", target, run: () => openOverlayFromDrawer(target) });
      return;
    }
    if (route.startsWith("__cat:")) {
      const target = route.replace("__cat:", "");
      selectFromDrawer({
        kind: "afterClose",
        run: () => {
          if (!openCategoryGlobal(target)) router.push(target as never);
        },
      });
      return;
    }
    selectFromDrawer({ kind: "route", target: route, run: () => router.push(route as never) });
  };

  return (
    <View
      style={StyleSheet.absoluteFill}
      pointerEvents={visible ? "box-none" : "none"}
      accessibilityElementsHidden={!visible}
      importantForAccessibility={visible ? "auto" : "no-hide-descendants"}
      testID="drawer-menu"
    >
      {/* Mismo fondo vigente de Inicio, a pantalla completa: sin panel ni costura. */}
      <SceneThemeBackground />
      <GestureDetector gesture={closePan}>
        <RAnimated.View style={[styles.drawer, { width: menuWidth }, contentStyle]}>
        <View style={styles.drawerInner}>
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
              <Pressable
                onPress={onAvatarPress}
                accessibilityRole="button"
                accessibilityLabel="Cerrar menú"
                testID="drawer-avatar-close"
              >
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

              </Pressable>
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
                    <View testID="drawer-current-stage-pill" style={{ alignSelf: "flex-start", marginTop: 5 }}>
                      <GrowthCurrentStagePill />
                    </View>
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

            </View>

          </View>

          {/* ── Menú scrollable ── */}
          <ScrollView
            showsVerticalScrollIndicator={false}
            style={{ flex: 1 }}
            contentContainerStyle={{ paddingLeft: 23, paddingRight: 17, paddingTop: 16, paddingBottom: bottomPad + 40 }}
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
                          <View style={[styles.itemIcon, { height: item.id === "premium" ? 24 : item.mciIcon ? 26 : 23 }]}>
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

            <View style={styles.scenePositionCompensation}>
              <DrawerSceneCards activeId={activeSceneId} onSelect={selectVisualTheme} />
            </View>
          </ScrollView>
        </View>
        </RAnimated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  drawer: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: 0,
  },
  drawerInner: {
    flex: 1,
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
  itemGroup: { gap: 10, marginTop: 10 },
  scenePositionCompensation: {
    // Eight gaps grew 8px; Perfil (33px) replaces Registro de ánimo (36px).
    // Consume the old 165px spacer, not menu rows or scene card dimensions.
    marginTop: -(8 * 8 - 3),
  },
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
    fontSize: 17,
  },

  item: {
    flexDirection: "row",
    alignItems: "center",
    // Fixed icon slots preserve row heights and centers when the artwork shrinks.
    paddingVertical: 5,
    paddingHorizontal: 0,
    borderRadius: 10,
    gap: 16,
  },
  itemIcon: { width: 26, alignItems: "center", justifyContent: "center" },
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
    fontSize: 17,
    lineHeight: 23,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  itemLabel: {
    fontFamily: "Manrope",
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 23,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
});
