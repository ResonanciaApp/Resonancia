import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useStreak } from "@/hooks/useStreak";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { File as FSFile, Paths } from "expo-file-system";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { GoldGradient, GoldGradientFill } from "@/components/GoldGradient";
import { BackPill } from "@/components/BackPill";
import { router, useFocusEffect, useNavigation } from "expo-router";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  type TextStyle,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaskedView from "@react-native-masked-view/masked-view";
import Svg, { Circle } from "react-native-svg";

import {
  useGetMe,
  getGetMeQueryKey,
  useGetMyFollowCounts,
  getGetMyFollowCountsQueryKey,
  useGetMyExpansorProfile,
  getGetMyExpansorProfileQueryKey,
  useUpdateMyExpansorProfile,
  deleteMyAccount,
  type ExpansorProfile,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { QuickAccessGrid } from "@/components/QuickAccessGrid";
import { SacredBackground } from "@/components/SacredBackground";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { useUserProfile } from "@/context/UserProfileContext";
import { useAuth } from "@/context/AuthContext";
import type { LibraryTab } from "@/context/DrawerContext";
import { usePlayer } from "@/context/PlayerContext";
import { useColors } from "@/hooks/useColors";
import { useDayRollover } from "@/hooks/useDayRollover";
import { getSessionById } from "@/data/sessions";
import { getExpansorById } from "@/data/expansores";
import { uploadLocalFile } from "@/lib/upload";
import { resolveAvatarUrl } from "@/lib/avatar";
import { removeLocalAccountData } from "@/lib/accountData";
import { getListenNowButtonColors } from "@/components/GoldGradient";
import { useGeometrixCreations } from "@/hooks/useGeometrixCreations";
import { InvitarSheet } from "@/components/InvitarSheet";
import { SimplePersonalizeSheet } from "@/components/SimplePersonalizeSheet";
import { BibliotecaScreen, type LibHeaderActions } from "@/components/BibliotecaScreen";
import { HistorialCalendar } from "@/components/HistorialCalendar";
import { ProfileMixCarousel } from "@/components/ProfileMixCarousel";
import { ProfileSettingsSections } from "@/components/ProfileSettingsSections";
import { SonicStreakDays } from "@/components/SonicStreakWave";
import { StickyHeaderSurface } from "@/components/StickyHeaderSurface";
import {
  gradientColors,
  type GeoSettings,
} from "@/data/geometrix-creations";
import { SacredGlyph } from "@/components/SacredGlyph";
import { baseOf, type GeometryId } from "@/data/geometries";
import { GeometrixOverlay } from "@/components/GeometrixToggle";
import { MEMBERSHIP_AURORA, WIDGET_GREEN_SOLID } from "@/constants/colors";

function resizeImageForWeb(uri: string, maxSize: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const w = Math.round(img.width * scale);
      const h = Math.round(img.height * scale);
      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      if (!ctx) { reject(new Error("no ctx")); return; }
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL("image/jpeg", 0.75));
    };
    img.onerror = reject;
    img.src = uri;
  });
}




function isoDow(d: Date): number {
  return (d.getDay() + 6) % 7;
}

const MEMBERSHIP_PLANS = [
  {
    id: "premium",
    name: "Tu Premium",
    eyebrow: "Gestiona tu suscripción y descubre tus beneficios de Resonancia Premium",
    icon: "star" as const,
    colors: MEMBERSHIP_AURORA.premium,
    benefits: [
      "Acceso ilimitado a todas las sesiones",
      "Sonidos y música",
      "Programas de bienestar",
    ],
  },
  {
    id: "plus",
    name: "Desbloquea Premium Plus",
    eyebrow: "Lleva tu experiencia al siguiente nivel",
    icon: "diamond" as const,
    colors: MEMBERSHIP_AURORA.plus,
    benefits: [
      "Experiencias avanzadas",
      "Prácticas de transformación",
      "Contenido exclusivo",
    ],
  },
] as const;

// Premium Plus queda configurado para una futura reactivación, pero por ahora
// Perfil muestra únicamente el plan Premium.
const VISIBLE_MEMBERSHIP_PLANS = MEMBERSHIP_PLANS.filter((plan) => plan.id === "premium");

function WeeklyStreakProgress({
  days,
  completedDays,
  textColor,
}: {
  days: number;
  completedDays: number;
  textColor: string;
}) {
  const size = 132;
  const strokeWidth = 10;
  const radius = 50;
  const center = size / 2;
  const circumference = 2 * Math.PI * radius;
  const gap = 16;
  const segmentLength = (circumference - gap * 3) / 3;
  const filledSegments = Math.max(0, Math.min(3, completedDays));

  return (
    <View style={styles.weeklyStreakSummary}>
      <Text style={[styles.weeklyStreakTitle, { color: textColor }]}>ESTA SEMANA</Text>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {[0, 1, 2].map((index) => {
            const isFilled = index < filledSegments;
            const rotation = -90 + index * 120;
            return (
              <React.Fragment key={index}>
                <Circle
                  cx={center}
                  cy={center}
                  r={radius}
                  fill="none"
                  stroke="rgba(255,255,255,0.14)"
                  strokeWidth={strokeWidth}
                  strokeLinecap="round"
                  strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                  transform={`rotate(${rotation} ${center} ${center})`}
                />
                {isFilled && (
                  <Circle
                    cx={center}
                    cy={center}
                    r={radius}
                    fill="none"
                    stroke="#F4F4F4"
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={`${segmentLength} ${circumference - segmentLength}`}
                    transform={`rotate(${rotation} ${center} ${center})`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </Svg>
        <View style={styles.weeklyStreakCounter}>
          <Text style={[styles.weeklyStreakNumber, { color: textColor }]}>{days}</Text>
          <Text style={[styles.weeklyStreakDaysLabel, { color: textColor }]}>Días</Text>
        </View>
      </View>
    </View>
  );
}

function ProfileMembershipModules({
  secondaryTextColor,
  foregroundColor,
}: {
  secondaryTextColor?: string;
  foregroundColor: string;
}) {
  return (
    <View style={styles.membershipSection}>
      {VISIBLE_MEMBERSHIP_PLANS.map((plan, index) => {
        const isPremium = plan.id === "premium";

        return (
          <React.Fragment key={plan.id}>
            {index > 0 && <View style={styles.membershipSectionDivider} />}
            <View style={styles.membershipCard}>
              <Pressable
                onPress={() => router.push("/membresia")}
                style={({ pressed }) => [
                  styles.membershipCardHeader,
                  isPremium ? styles.membershipCardHeaderPremium : styles.membershipCardHeaderPlus,
                  { opacity: pressed ? 0.78 : 1 },
                ]}
                accessibilityRole="button"
                accessibilityLabel={`Abrir perfil de ${plan.name}`}
              >
                <View
                  style={[
                    styles.membershipIcon,
                    {
                      backgroundColor: "transparent",
                      borderColor: plan.colors.accent,
                      shadowColor: plan.colors.glow,
                    },
                  ]}
                >
                  {isPremium ? (
                    <MaterialCommunityIcons name="star" size={31} color={plan.colors.accent} />
                  ) : (
                    <MaterialCommunityIcons name="diamond-stone" size={23} color={plan.colors.accent} />
                  )}
                </View>
                <View style={styles.membershipCardCopy}>
                  <Text style={[styles.membershipPlanName, { color: plan.colors.accent }]}>
                    {plan.name}
                  </Text>
                  <Text style={[styles.membershipPlanEyebrow, secondaryTextColor && { color: secondaryTextColor }]}>
                    {plan.eyebrow}
                  </Text>
                </View>
                <View style={styles.profileChevronButton}>
                  <Feather
                    name="chevron-right"
                    size={24}
                    color={foregroundColor}
                  />
                </View>
              </Pressable>

            </View>
          </React.Fragment>
        );
      })}
    </View>
  );
}

// ── BgGlyph: renderiza una capa de geometría animada en el fondo del perfil ─
function BgGlyph({
  id,
  settings,
  masterOpacity,
  size,
  index,
}: {
  id: GeometryId;
  settings: GeoSettings;
  masterOpacity: number;
  size: number;
  index: number;
}) {
  const rot   = useRef(new Animated.Value(0)).current;
  const pulse = useRef(new Animated.Value(0)).current;
  const fade  = useRef(new Animated.Value(1)).current;

  const spinning     = settings.rotate || settings.rotateLeft;
  const dir          = settings.rotateLeft ? -1 : 1;
  const safeSpeed    = Number.isFinite(settings.rotateSpeed)
    ? Math.max(0, Math.min(1, settings.rotateSpeed)) : 0.5;
  const spinDuration = ((38000 + index * 6000) / (0.5 + safeSpeed * 2.5)) * 1.6;
  const safeAmount   = Number.isFinite(settings.breatheAmount)
    ? Math.max(0, Math.min(1, settings.breatheAmount)) : 0;
  const breatheDepth = 0.04 + safeAmount * 0.2;
  const safeScale    = Number.isFinite(settings.scale) ? settings.scale : 1;
  const safeZoom     = Number.isFinite(settings.zoom) && settings.zoom > 0 ? settings.zoom : 1;
  const safeThick    = Number.isFinite(settings.thickness) ? settings.thickness : 0;
  // Fórmula idéntica al editor: base × magnitud confirmada → SVG nítido a cualquier zoom.
  const userScale    = 0.4 + safeScale * 0.6;
  const glyphSize    = size * userScale * safeZoom;
  // Trazo constante en píxeles de pantalla (no engorda con zoom): igual que editor.
  const base1px = glyphSize > 0 ? 100 / glyphSize : 1;
  const sw      = base1px * (1 + safeThick * 5);

  useEffect(() => {
    if (spinning) {
      const a = Animated.loop(
        Animated.timing(rot, { toValue: 1, duration: spinDuration, easing: Easing.linear, useNativeDriver: true })
      );
      a.start();
      return () => a.stop();
    }
    rot.setValue(0);
  }, [spinning, spinDuration, rot]);

  useEffect(() => {
    if ((settings.breatheAmount ?? 0) > 0) {
      const a = Animated.loop(
        Animated.sequence([
          Animated.timing(pulse, { toValue: 1, duration: 6000 + index * 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(pulse, { toValue: 0, duration: 6000 + index * 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      a.start();
      return () => a.stop();
    }
    pulse.setValue(0);
  }, [(settings.breatheAmount ?? 0) > 0, index, pulse]);

  useEffect(() => {
    const fadeOn = (settings.fadeLoopAmount ?? 0) > 0;
    if (fadeOn) {
      const safeFadeAmt = Math.max(0, Math.min(1, settings.fadeLoopAmount ?? 0));
      const minOpacity = 1 - safeFadeAmt * 0.85;
      const a = Animated.loop(
        Animated.sequence([
          Animated.timing(fade, { toValue: minOpacity, duration: 4000 + index * 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(fade, { toValue: 1, duration: 4000 + index * 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        ])
      );
      a.start();
      return () => a.stop();
    }
    fade.setValue(1);
  }, [(settings.fadeLoopAmount ?? 0) > 0, index, fade]);

  const layerOpacity = Math.max(0.1, settings.opacity * masterOpacity);
  const rotDeg   = rot.interpolate({ inputRange: [0, 1], outputRange: [`${settings.manualAngle}deg`, `${settings.manualAngle + 360 * dir}deg`] });
  const scalePulse = pulse.interpolate({ inputRange: [0, 1], outputRange: [1 - breatheDepth, 1] });

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFill,
        {
          alignItems: "center",
          justifyContent: "center",
          opacity: (settings.fadeLoopAmount ?? 0) > 0 ? Animated.multiply(fade, layerOpacity) : layerOpacity,
          transform: [
            { rotate: spinning ? rotDeg : `${settings.manualAngle}deg` },
            { scale: (settings.breatheAmount ?? 0) > 0 ? scalePulse : 1 },
          ],
        },
      ]}
      pointerEvents="none"
    >
      <SacredGlyph
        id={id}
        color={settings.color}
        gradient={gradientColors(settings.gradientId)}
        size={glyphSize}
        strokeWidth={sw}
      />
    </Animated.View>
  );
}

export function ProfileScreenBase({
  dedicated = false,
  accountMode = false,
  onBack,
  asTab = false,
  initialLibraryTab,
}: {
  dedicated?: boolean;
  accountMode?: boolean;
  onBack?: () => void;
  asTab?: boolean;
  initialLibraryTab?: LibraryTab | null;
}) {
  const colors = useColors();
  const { theme: activeTheme, activeSceneId } = useSceneTheme();
  const insets = useSafeAreaInsets();
  const { email, logout } = useAuth();
  const { favorites, statEvents } = usePlayer();
  const {
    username,
    lastName,
    location,
    description,
    photoUri,
    expansorId,
    updateProfile,
    setPhotoUri,
  } = useUserProfile();

  const { currentStreak, maxStreak, weekFlags, todayIndex } = useStreak();
  const todayKey = useDayRollover();
  const [statsRangeDays, setStatsRangeDays] = useState<7 | 30 | 90>(30);
  const [statsFilterOpen, setStatsFilterOpen] = useState(false);
  const resourceBlockBackground = activeSceneId === "tibet"
    ? "rgba(0,0,0,0.15)"
    : activeSceneId === "indigo"
      ? "rgba(42,40,64,0.65)"
      : activeSceneId === "indigo2"
        ? "rgba(255,255,255,0.025)"
        : "rgba(255,255,255,0.05)";
  const libraryHeaderButtonBackground = activeSceneId === "indigo"
    ? "rgba(42,40,64,0.65)"
    : "rgba(255,255,255,0.12)";
  const resourceBlockBorder = "rgba(255,255,255,0.1)";
  const progressAccent = activeSceneId === "indigo2" ? colors.accent : "#AAAAC4";
  const indigo2SecondaryText = activeSceneId === "indigo2" ? colors.accent : undefined;

  const expansorData = expansorId ? getExpansorById(expansorId) : undefined;

  const { refetch: refetchMe } = useGetMe({ query: { queryKey: getGetMeQueryKey(), staleTime: 0 } });
  const { data: followCounts } = useGetMyFollowCounts({
    query: { queryKey: getGetMyFollowCountsQueryKey(), staleTime: 30_000 },
  });
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;

  const [libActions, setLibActions] = useState<LibHeaderActions | null>(null);
  const profileScrollRef = useRef<ScrollView>(null);
  const [profileStickyHeaderHeight, setProfileStickyHeaderHeight] = useState(0);
  const navigation = useNavigation();
  useEffect(() => {
    const tabNavigation = navigation as unknown as {
      addListener: (event: "tabPress", callback: () => void) => () => void;
    };
    const unsubscribe = tabNavigation.addListener("tabPress", () => {
      if (dedicated) profileScrollRef.current?.scrollTo({ y: 0, animated: true });
    });
    return unsubscribe;
  }, [dedicated, navigation]);
  useFocusEffect(
    useCallback(() => {
      if (!dedicated) return;
      profileScrollRef.current?.scrollTo({ y: 0, animated: false });
    }, [dedicated]),
  );

  // ── Borde del sticky header: se activa a partir de unos pocos px de scroll ──
  // (umbral en píxeles, no en % del contenido — así funciona igual en tabs
  // cortos que no alcanzan a generar mucho scroll, ej. "Mi Espacio")
  const HEADER_BORDER_THRESHOLD_PX = 8;
  const headerBorderActiveRef = useRef(false);
  const headerBorderAnim = useRef(new Animated.Value(0)).current;
  const profileTitleCompactAnim = useRef(new Animated.Value(0)).current;
  const profileTitleCompactRef = useRef(false);
  const profileLargeTitleOpacity = profileTitleCompactAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 0],
  });
  const handleHeaderScroll = (e: { nativeEvent: { contentOffset: { y: number } } }) => {
    const y = e.nativeEvent.contentOffset.y;
    const shouldShowBorder = y >= HEADER_BORDER_THRESHOLD_PX;
    if (shouldShowBorder !== headerBorderActiveRef.current) {
      headerBorderActiveRef.current = shouldShowBorder;
      Animated.timing(headerBorderAnim, {
        toValue: shouldShowBorder ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
    const shouldCompact = dedicated && y > HEADER_BORDER_THRESHOLD_PX;
    if (shouldCompact !== profileTitleCompactRef.current) {
      profileTitleCompactRef.current = shouldCompact;
      Animated.timing(profileTitleCompactAnim, {
        toValue: shouldCompact ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const { width } = useWindowDimensions();

  // ── Geometrix creations (for profile background picker) ───────────────────
  const { creations: geoCreations, reload: reloadCreations } = useGeometrixCreations();

  // Recarga creaciones cada vez que el tab vuelve al foco (para que una
  // creación guardada en Geometrix aparezca inmediatamente al volver).
  useFocusEffect(
    useCallback(() => {
      reloadCreations();
      refetchMe();
    }, [reloadCreations, refetchMe])
  );

  // ── Expansor profile ──────────────────────────────────────────────────────
  const isExpansor = false;
  const qc = useQueryClient();
  const { data: expansorProfile } = useGetMyExpansorProfile({
    query: {
      queryKey: getGetMyExpansorProfileQueryKey(),
      enabled: isExpansor,
      retry: false,
    },
  });
  const updateExpansorMutation = useUpdateMyExpansorProfile({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({ queryKey: getGetMyExpansorProfileQueryKey() });
        setExpansorEditVisible(false);
      },
    },
  });

  const [dvDescExpanded, setDvDescExpanded] = useState(false);
  const [dvDescOverflows, setDvDescOverflows] = useState(false);
  const [dvLightboxUri, setDvLightboxUri] = useState<string | null>(null);
  const dvCellSize = Math.floor((width - 40 - 32 - 8) / 3);

  // ── Expansor edit sheet ───────────────────────────────────────────────────
  const [expansorEditVisible, setExpansorEditVisible] = useState(false);
  const [epSpecialties, setEpSpecialties] = useState("");
  const [epDescription, setEpDescription] = useState("");
  const [epPhone, setEpPhone] = useState("");
  const [epEmail, setEpEmail] = useState("");
  const [epInstagram, setEpInstagram] = useState("");
  const [epQuote, setEpQuote] = useState("");
  const [epPhotos, setEpPhotos] = useState<string[]>([]);
  const [epPhotoUploading, setEpPhotoUploading] = useState(false);

  function openExpansorEdit() {
    setEpSpecialties((expansorProfile?.specialties ?? []).join(", "));
    setEpDescription(expansorProfile?.description ?? "");
    setEpPhone(expansorProfile?.phone ?? "");
    setEpEmail(expansorProfile?.email ?? "");
    setEpInstagram(expansorProfile?.instagram ?? "");
    setEpQuote(expansorProfile?.quote ?? "");
    setEpPhotos(expansorProfile?.photos ?? []);
    setExpansorEditVisible(true);
  }

  async function pickAndUploadExpansorPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso necesario", "Necesitamos acceso a tu galería para subir fotos.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [4, 5],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;
    const asset = result.assets[0];
    setEpPhotoUploading(true);
    try {
      const ext = asset.uri.split(".").pop()?.split("?")[0] ?? "jpg";
      const objectPath = await uploadLocalFile(asset.uri, "image/jpeg", `expansor_photo_${Date.now()}.${ext}`, asset.fileSize ?? 500_000);
      setEpPhotos((prev) => [...prev, objectPath]);
    } catch {
      Alert.alert("Error", "No se pudo subir la foto. Intentá de nuevo.");
    } finally {
      setEpPhotoUploading(false);
    }
  }

  function removeExpansorPhoto(idx: number) {
    setEpPhotos((prev) => prev.filter((_, i) => i !== idx));
  }

  function saveExpansorProfile() {
    updateExpansorMutation.mutate({
      data: {
        specialties: epSpecialties.split(",").map((s) => s.trim()).filter(Boolean),
        description: epDescription || null,
        phone: epPhone || null,
        email: epEmail || null,
        instagram: epInstagram || null,
        photos: epPhotos,
        quote: epQuote || null,
      },
    });
  }

  // ── Personalize sheet ─────────────────────────────────────────────────────
  const [scrollEnabled, setScrollEnabled] = useState(true);
  const [personalizeVisible, setPersonalizeVisible] = useState(false);
  const [profileGeoActive, setProfileGeoActive] = useState(false);
  const [profileBgGradientId, setProfileBgGradientId] = useState<string | null>(null);
  const [profileBgCreationId, setProfileBgCreationId] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [gradId, creId] = await Promise.all([
          AsyncStorage.getItem("@profile_bg_gradient"),
          AsyncStorage.getItem("@profile_bg_creation"),
        ]);
        if (gradId !== null) setProfileBgGradientId(gradId === "null" ? null : gradId);
        if (creId !== null) setProfileBgCreationId(creId === "null" ? null : creId);
      } catch {}
    })();
  }, []);

  const selectGradient = (id: string | null) => {
    // Seleccionar cualquier swatch (incluso "por defecto") siempre descarta la
    // creación de Geometrix — son mutuamente excluyentes.
    setProfileBgGradientId(id);
    setProfileBgCreationId(null);
    void AsyncStorage.setItem("@profile_bg_gradient", id ?? "null");
    void AsyncStorage.setItem("@profile_bg_creation", "null");
  };
  const selectCreation = (id: string | null) => {
    setProfileBgCreationId(id);
    if (id !== null) setProfileBgGradientId(null);
    void AsyncStorage.setItem("@profile_bg_creation", id ?? "null");
    if (id !== null) void AsyncStorage.setItem("@profile_bg_gradient", "null");
  };
  // ── Sections visibility toggle ────────────────────────────────────────────
  const [sectionsHidden, setSectionsHidden] = useState(false);
  const sectionsAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    AsyncStorage.getItem("@profile_sections_hidden").then((raw) => {
      if (raw === "1") {
        setSectionsHidden(true);
        sectionsAnim.setValue(0);
      }
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const toggleSections = useCallback(() => {
    const next = !sectionsHidden;
    setSectionsHidden(next);
    AsyncStorage.setItem("@profile_sections_hidden", next ? "1" : "0").catch(() => {});
    Animated.timing(sectionsAnim, {
      toValue: next ? 0 : 1,
      duration: 280,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [sectionsHidden, sectionsAnim]);

  // ── Edit modal state ──────────────────────────────────────────────────────
  const [showInvitar, setShowInvitar] = useState(false);
  const [editVisible, setEditVisible] = useState(false);
  const [editNombre, setEditNombre] = useState(username);
  const [editApellido, setEditApellido] = useState(lastName);
  const [editLocation, setEditLocationLocal] = useState(location);
  const [editDesc, setEditDesc] = useState(description);
  const [accountName, setAccountName] = useState(username);
  const [accountAction, setAccountAction] = useState<"delete" | null>(null);
  const accountToastOpacity = useRef(new Animated.Value(0)).current;
  const accountToastY = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    if (accountMode) setAccountName(username);
  }, [accountMode, username]);

  const openEdit = () => {
    setEditNombre(username);
    setEditApellido(lastName);
    setEditLocationLocal(location);
    setEditDesc(description);
    setEditVisible(true);
  };

  const saveEdit = () => {
    updateProfile({
      username: editNombre,
      lastName: editApellido,
      location: editLocation,
      description: editDesc,
    });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditVisible(false);
  };

  const saveAccount = () => {
    updateProfile({ username: accountName });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    accountToastOpacity.stopAnimation();
    accountToastY.stopAnimation();
    accountToastOpacity.setValue(0);
    accountToastY.setValue(12);
    Animated.sequence([
      Animated.parallel([
        Animated.timing(accountToastOpacity, {
          toValue: 1,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(accountToastY, {
          toValue: 0,
          duration: 220,
          easing: Easing.out(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(1800),
      Animated.parallel([
        Animated.timing(accountToastOpacity, {
          toValue: 0,
          duration: 260,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(accountToastY, {
          toValue: 8,
          duration: 260,
          easing: Easing.in(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  };

  const performAccountDeletion = async () => {
    if (accountAction) return;
    setAccountAction("delete");
    try {
      await deleteMyAccount({ confirmation: "ELIMINAR" });
      await removeLocalAccountData();
      await logout();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace("/onboarding");
    } catch (error) {
      console.warn("[Account] deletion failed", error);
      Alert.alert(
        "No se pudo eliminar la cuenta",
        "No cierres sesión. Inténtalo de nuevo para completar la eliminación de forma segura.",
      );
    } finally {
      setAccountAction(null);
    }
  };

  const handleProfileLogout = () => {
    Alert.alert(
      "Cerrar sesión",
      "Saldrás de RESONANCE. Tu progreso queda guardado.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Cerrar sesión",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/onboarding");
          },
        },
      ],
    );
  };

  const handleDeleteAccount = () => {
    if (accountAction) return;
    Alert.alert(
      "Eliminar mi cuenta",
      "Se borrarán tu cuenta, perfil, actividad, biblioteca, mensajes, datos sociales y archivos subidos. Esta acción no se puede deshacer.",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Continuar",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Confirmación final",
              "¿Confirmas que quieres eliminar definitivamente tu cuenta de RESONANCIA?",
              [
                { text: "Cancelar", style: "cancel" },
                {
                  text: "ELIMINAR",
                  style: "destructive",
                  onPress: performAccountDeletion,
                },
              ],
            );
          },
        },
      ],
    );
  };

  // ── Photo picker ──────────────────────────────────────────────────────────
  const pickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permiso necesario", "Necesitamos acceso a tu galería para cambiar la foto.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const tempUri = result.assets[0].uri;
      if (Platform.OS === "web") {
        try {
          const dataUrl = await resizeImageForWeb(tempUri, 320);
          setPhotoUri(dataUrl);
        } catch {
          setPhotoUri(tempUri);
        }
      } else {
        try {
          const ext = tempUri.split(".").pop()?.split("?")[0] ?? "jpg";
          const src = new FSFile(tempUri);
          const dest = new FSFile(Paths.document, `profile_photo.${ext}`);
          src.copy(dest);
          setPhotoUri(dest.uri);
        } catch {
          setPhotoUri(tempUri);
        }
      }
    }
  };


  const personalStats = useMemo(() => {
    const rangeStart = new Date();
    rangeStart.setHours(0, 0, 0, 0);
    rangeStart.setDate(rangeStart.getDate() - (statsRangeDays - 1));
    const rangeStartTime = rangeStart.getTime();
    const now = Date.now();
    let totalMinutes = 0;
    let completedSessions = 0;

    for (const event of statEvents) {
      const playedAt = new Date(event.playedAt).getTime();
      if (!Number.isFinite(playedAt) || playedAt < rangeStartTime || playedAt > now) continue;

      totalMinutes += event.minutes;
      if (event.completed === true) completedSessions += 1;
    }

    return {
      totalMinutes: Math.round(totalMinutes),
      completedSessions,
    };
  }, [statEvents, statsRangeDays, todayKey]);

  // ── Favorite sessions ─────────────────────────────────────────────────────
  const favSessions = favorites
    .map((id) => getSessionById(id))
    .filter(Boolean);


  // ── Fondo activo (degradado de perfil) ────────────────────────────────────
  // Fondo fijo (mismo degradado que Inicio). La personalización de fondo se
  // retiró de la UI (WatercolorBtn); ya no debe tomar el color de una paleta
  // guardada previamente en AsyncStorage (@profile_bg_gradient/@profile_bg_creation).
  const activeBgColors = useMemo((): readonly string[] => {
    return activeTheme.gradient;
  }, [activeTheme]);

  // Creación activa (para renderizar glyphs en el fondo)
  const activeBgCreation = useMemo(
    () => (profileBgCreationId ? (geoCreations.find((c) => c.id === profileBgCreationId) ?? null) : null),
    [profileBgCreationId, geoCreations]
  );
  // Misma base que el editor: canvasSide * 0.96 (portrait → canvasSide = width).
  const glyphSize = width * 0.96;

  // ── Crossfade de fondo ────────────────────────────────────────────────────
  const defaultBg = activeTheme.gradient;
  const [bgFrom, setBgFrom] = useState<readonly string[]>(defaultBg);
  const [bgTo, setBgTo] = useState<readonly string[]>(defaultBg);
  const crossFadeAnim = useRef(new Animated.Value(1)).current;
  const prevBgRef = useRef<readonly string[]>(defaultBg);
  const bgMountedRef = useRef(false);
  // Fade-in del glifo al montar (carga async desde AsyncStorage → aparición suave).
  const glyphMountAnim = useRef(new Animated.Value(0)).current;


  useEffect(() => {
    if (!bgMountedRef.current) {
      bgMountedRef.current = true;
      setBgFrom(activeBgColors);
      setBgTo(activeBgColors);
      crossFadeAnim.setValue(1);
      prevBgRef.current = activeBgColors;
      return;
    }
    const prev = prevBgRef.current;
    const next = activeBgColors;
    if (prev[0] === next[0] && prev[1] === next[1]) return;
    prevBgRef.current = next;
    // 1. Actualizar state: bgFrom = color actual, bgTo = color nuevo
    setBgFrom(prev);
    setBgTo(next);
    // 2. Diferir el reset del Animated.Value hasta que React haya comiteado
    //    el nuevo bgFrom en la capa nativa (evita el flash de un frame).
    const raf = requestAnimationFrame(() => {
      crossFadeAnim.setValue(0);
      Animated.timing(crossFadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }).start();
    });
    return () => cancelAnimationFrame(raf);
  }, [activeBgColors, crossFadeAnim]);

  // Reset SÍNCRONO antes del paint (evita el flash al montar el bloque condicional).
  // useLayoutEffect se ejecuta tras el commit pero antes de que el nativo pinte.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useLayoutEffect(() => { glyphMountAnim.setValue(0); }, [activeBgCreation?.id]);

  // Animación de entrada del glifo (después del paint, sin flash).
  useEffect(() => {
    if (!activeBgCreation) return;
    Animated.timing(glyphMountAnim, {
      toValue: 1,
      duration: 700,
      useNativeDriver: true,
    }).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeBgCreation?.id]);

  if (accountMode) {
    return (
      <View style={styles.root}>
        <LinearGradient
          colors={[activeTheme.gradient[0], activeTheme.gradient[1]]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
        <SacredBackground variant="gradient" noImage />
        <StatusBar barStyle="light-content" />

        <View style={styles.accountContent}>
          <View style={[styles.stickyHeader, { paddingTop: topPad + 8 }]}>
            <View style={[styles.stickyHeaderRow, styles.libraryTabHeaderRow]}>
              <Pressable
                onPress={() => (onBack ? onBack() : router.back())}
                hitSlop={8}
                style={styles.accountBackButton}
                accessibilityRole="button"
                accessibilityLabel="Volver"
              >
                <Feather name="chevron-left" size={27} color="#FBFBFB" />
              </Pressable>
              <Text style={styles.stickyTitleLibraryTab}>Mi cuenta</Text>
              <View style={styles.accountHeaderSpacer} />
            </View>
          </View>

          <KeyboardAvoidingView
            style={styles.accountFormFlex}
            behavior={Platform.OS === "ios" ? "padding" : undefined}
          >
            <ScrollView
              contentContainerStyle={[styles.accountForm, { paddingBottom: bottomPad + 40 }]}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <Pressable
                onPress={pickPhoto}
                style={({ pressed }) => [styles.accountAvatarButton, pressed && styles.accountPressed]}
                accessibilityRole="button"
                accessibilityLabel="Cambiar foto de perfil"
              >
                {photoUri ? (
                  <Image source={{ uri: photoUri }} style={styles.accountAvatar} contentFit="cover" />
                ) : (
                  <View style={[styles.accountAvatar, styles.accountAvatarFallback, { backgroundColor: colors.secondary }]}>
                    <Feather name="user" size={34} color={colors.primary} />
                  </View>
                )}
                <View style={styles.accountAvatarBadge}>
                  <Feather name="camera" size={14} color="#FFFFFF" />
                </View>
              </Pressable>

              <View style={styles.accountField}>
                <Text style={styles.accountFieldLabel}>
                  Correo electrónico
                </Text>
                <View style={styles.accountFieldValueBox}>
                  <Text style={[styles.accountFieldValue, { color: colors.mutedForeground }]}>
                    {email || "No disponible"}
                  </Text>
                </View>
              </View>

              <View style={styles.accountField}>
                <Text style={styles.accountFieldLabel}>
                  Nombre
                </Text>
                <TextInput
                  value={accountName}
                  onChangeText={setAccountName}
                  placeholder="Nombre del usuario"
                  placeholderTextColor={colors.mutedForeground}
                  style={[styles.accountNameInput, { color: colors.foreground }]}
                  autoCapitalize="words"
                  returnKeyType="done"
                />
              </View>

              <Pressable
                onPress={saveAccount}
                disabled={Boolean(accountAction)}
                style={({ pressed }) => [
                  styles.accountSaveButton,
                  { opacity: pressed || accountAction ? 0.78 : 1 },
                ]}
              >
                <LinearGradient
                  colors={getListenNowButtonColors(true)}
                  style={StyleSheet.absoluteFill}
                  start={{ x: 0, y: 0.5 }}
                  end={{ x: 1, y: 0.5 }}
                />
                <Text style={styles.accountSaveButtonText}>Guardar</Text>
              </Pressable>

              <Pressable
                onPress={handleDeleteAccount}
                disabled={Boolean(accountAction)}
                style={({ pressed }) => [
                  styles.accountDeleteButton,
                  { opacity: pressed || accountAction ? 0.65 : 1 },
                ]}
              >
                <Text style={styles.accountDeleteButtonText}>Eliminar cuenta</Text>
              </Pressable>
            </ScrollView>
          </KeyboardAvoidingView>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.accountSavedToast,
              {
                bottom: bottomPad + 24,
                opacity: accountToastOpacity,
                transform: [{ translateY: accountToastY }],
              },
            ]}
          >
            <MaterialCommunityIcons name="ticket-outline" size={20} color="#A777D0" />
            <Text style={styles.accountSavedToastText}>¡Datos actualizados exitosamente!</Text>
          </Animated.View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.root}>
      {/* Fondo anterior — se desvanece */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: crossFadeAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) }]}
        pointerEvents="none"
      >
        <LinearGradient colors={[bgFrom[0], bgFrom[1], ...bgFrom.slice(2)]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
      </Animated.View>
      {/* Fondo nuevo — aparece */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: crossFadeAnim }]}
        pointerEvents="none"
      >
        <LinearGradient colors={[bgTo[0], bgTo[1], ...bgTo.slice(2)]} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} />
      </Animated.View>
      {/* Geometrías de la creación seleccionada — fade-in al montar + crossfade de colores */}
      {activeBgCreation && (
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: glyphMountAnim }]} pointerEvents="none">
          <Animated.View style={[StyleSheet.absoluteFill, { opacity: crossFadeAnim }]} pointerEvents="none">
            {activeBgCreation.active
              .filter((gId) => !activeBgCreation.hiddenIds?.includes(gId))
              .map((gId, i) => {
                const s = activeBgCreation.settings[gId];
                if (!s) return null;
                return (
                  <BgGlyph
                    key={gId}
                    id={gId as GeometryId}
                    settings={s}
                    masterOpacity={activeBgCreation.master.opacity}
                    size={glyphSize}
                    index={i}
                  />
                );
              })}
          </Animated.View>
        </Animated.View>
      )}
      <StatusBar barStyle="light-content" />
      <SacredBackground variant="gradient" noImage />
      <GeometrixOverlay active={profileGeoActive} />

      <View style={styles.contentShift}>
      {/* ── Sticky header (estilo Calm) ── */}
      <View
        onLayout={dedicated ? (event) => {
          const nextHeight = Math.ceil(event.nativeEvent.layout.height);
          setProfileStickyHeaderHeight((current) => current === nextHeight ? current : nextHeight);
        } : undefined}
        style={[
          styles.stickyHeader,
          dedicated && styles.stickyHeaderDedicatedOverlay,
          dedicated && (activeSceneId === "indigo" || activeSceneId === "indigo2") &&
            styles.stickyHeaderFadeOverflow,
          {
            paddingTop: asTab ? topPad + 8 : topPad + 2,
          },
        ]}
      >
        {dedicated && (
          <StickyHeaderSurface
            opacity={profileTitleCompactAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0, 0.96],
            })}
            tint={activeTheme.gradient[0] as string}
            showTint={activeSceneId !== "indigo" && activeSceneId !== "indigo2"}
            showDivider={activeSceneId !== "indigo" && activeSceneId !== "indigo2"}
            blurIntensity={activeSceneId === "indigo" || activeSceneId === "indigo2" ? 85 : undefined}
            showBlackTint={activeSceneId !== "indigo" && activeSceneId !== "indigo2"}
            strongBlur={activeSceneId === "indigo" || activeSceneId === "indigo2"}
            fadeBottom={activeSceneId === "indigo" || activeSceneId === "indigo2"}
          />
        )}
        {!dedicated && activeSceneId !== "indigo" && activeSceneId !== "indigo2" && (
          <Animated.View collapsable={false} style={[styles.stickyHeaderBorder, { opacity: headerBorderAnim }]} />
        )}
        <View style={[
          styles.stickyHeaderRow,
          !dedicated && !asTab && { paddingTop: 25 },
          dedicated && { paddingBottom: 15 },
          asTab && styles.libraryTabHeaderRow,
        ]}>
          {asTab && (
            <Pressable
              onPress={onBack ?? (() => router.navigate("/(tabs)/inicio-copia" as never))}
              hitSlop={6}
              style={styles.libraryTabBackHitArea}
              accessibilityRole="button"
              accessibilityLabel="Volver a Inicio"
            >
              {({ pressed }) => (
                <View
                  style={[
                    styles.libraryTabBackBtn,
                    { backgroundColor: libraryHeaderButtonBackground, opacity: pressed ? 0.7 : 1 },
                  ]}
                >
                  <Feather name="chevron-left" size={26} color="#FBFBFB" />
                </View>
              )}
            </Pressable>
          )}
          {!asTab && !dedicated && (
            <BackPill
              onPress={onBack ?? (() => router.canGoBack() ? router.back() : router.navigate("/(tabs)/inicio8" as never))}
              size={28}
              bgColor={libraryHeaderButtonBackground}
              style={{ transform: [{ translateX: -2 }, { translateY: -50 }] }}
            />
          )}
          <Animated.Text style={[
            styles.stickyTitle,
            dedicated && styles.stickyTitleDedicated,
            !dedicated && !asTab && styles.stickyTitleBiblioteca,
            asTab && styles.stickyTitleLibraryTab,
            dedicated && { opacity: profileLargeTitleOpacity },
          ]}>{dedicated ? "Perfil" : "Biblioteca"}</Animated.Text>
          {dedicated && (
            <Animated.View
              pointerEvents="none"
              style={[styles.compactTitleOverlay, { opacity: profileTitleCompactAnim }]}
            >
              <Text style={styles.compactProfileTitle}>Perfil</Text>
            </Animated.View>
          )}
          {dedicated ? (
            <View style={styles.profileSettingsWrap}>
              <Pressable hitSlop={8} onPress={() => router.push("/configuraciones")}>
                <Feather name="settings" size={23} color="#FBFBFB" />
              </Pressable>
            </View>
          ) : libActions && !libActions.hidden ? (
            <View style={styles.libActionsPill}>
              <Pressable
                onPress={libActions.onSearch}
                hitSlop={10}
                style={[styles.libActionBtn, { backgroundColor: libraryHeaderButtonBackground }]}
                accessibilityRole="button"
                accessibilityLabel="Buscar en Biblioteca"
              >
                <Feather name="search" size={22} color="#f9f9f9" />
              </Pressable>
              <Pressable
                onPress={libActions.onAdd}
                hitSlop={10}
                style={[styles.libActionBtn, { backgroundColor: libraryHeaderButtonBackground }]}
                accessibilityRole="button"
                accessibilityLabel="Crear en Biblioteca"
              >
                <Feather name="plus" size={24} color="#f9f9f9" />
              </Pressable>
            </View>
          ) : (
            <View style={{ width: 25 }} />
          )}
        </View>

      </View>

      {dedicated && (
      <ScrollView
        ref={profileScrollRef}
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: 160 + bottomPad,
          paddingTop: Math.max(profileStickyHeaderHeight, topPad + 56),
          paddingHorizontal: 14,
        }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
        onScroll={handleHeaderScroll}
        scrollEventThrottle={16}
      >
        {/* ── Acciones ── */}
        <View style={[styles.header, { justifyContent: "flex-end" }]}>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            {isExpansor && (
              <Pressable
                onPress={openExpansorEdit}
                style={({ pressed }) => [styles.expansorEditIconBtn, { opacity: pressed ? 0.7 : 1 }]}
                hitSlop={10}
              >
                <Feather name="edit" size={17} color="#F9F9F9" />
              </Pressable>
            )}
          </View>
        </View>

        {/* ── Profile Card ── */}
          <View style={[styles.profileCard, { backgroundColor: resourceBlockBackground }]}>
          <View style={styles.profileIdentityRow}>
            {/* Avatar */}
            <Pressable
              onPress={() => router.push("/mi-perfil")}
              style={styles.avatarWrapper}
              accessibilityRole="button"
              accessibilityLabel="Abrir Mi cuenta"
            >
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <View style={[styles.avatarCircle, { backgroundColor: colors.secondary }]}>
                  <Feather name="user" size={28} color={colors.primary} />
                </View>
              )}
            </Pressable>

            {/* Name + details */}
            <View style={styles.profileDetailsRow}>
              <Pressable
                onPress={() => router.push("/mi-perfil")}
                style={styles.profileDetails}
                accessibilityRole="button"
                accessibilityLabel="Abrir Mi cuenta"
              >
                <Text
                  style={[styles.userName, styles.userNameLeft, { color: colors.foreground }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {username}{lastName ? ` ${lastName}` : ""}
                </Text>

                {email ? (
                  <Text
                    style={[styles.emailText, { color: indigo2SecondaryText ?? "#AAAAC4" }]}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {email}
                  </Text>
                ) : null}

                {location ? (
                  <View style={styles.locationRow}>
                    <Feather name="map-pin" size={12} color={indigo2SecondaryText ?? colors.mutedForeground} />
                    <Text style={[styles.locationText, { color: indigo2SecondaryText ?? colors.mutedForeground }]}>{location}</Text>
                  </View>
                ) : null}
              </Pressable>
              <Pressable
                onPress={() => router.push("/mi-perfil")}
                style={styles.profileChevronButton}
                hitSlop={8}
                accessibilityRole="button"
                accessibilityLabel="Abrir Mi cuenta"
              >
                <Feather name="chevron-right" size={24} color={colors.foreground} />
              </Pressable>
            </View>
          </View>
          <View style={styles.profileCardDivider} />
          <ProfileMembershipModules
            secondaryTextColor={progressAccent}
            foregroundColor={colors.foreground}
          />
        </View>

        {/* ── Racha (solo en el Perfil dedicado) ── */}
        {dedicated && (
          <>
            <View style={styles.weeklyStreakIntro}>
              <Text style={[styles.weeklyStreakIntroTitle, { color: colors.foreground }]}>Tu progreso</Text>
              <Text style={styles.weeklyStreakIntroDescription}>
                Bastan 3 días a la semana para comenzar a transformar tu vida.
              </Text>
            </View>
            <View
              style={[
                styles.streakSection,
                {
                  backgroundColor: resourceBlockBackground,
                  borderWidth: 0,
                  marginBottom: 15,
                },
              ]}
            >
              <View style={styles.streakHeadingRow}>
                <View style={styles.streakHeadingMain}>
                  <View style={styles.streakLotusIcon}>
                    <MaskedView
                      style={styles.streakLotusMask}
                      maskElement={<MaterialCommunityIcons name="spa" size={61} color="#000000" />}
                    >
                      <LinearGradient
                        colors={["#CFCFCF", "#E3E3E3"]}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 0, y: 1 }}
                        style={StyleSheet.absoluteFill}
                      />
                    </MaskedView>
                  </View>
                  <View style={styles.streakHeadingCopy}>
                    <View style={styles.streakTitleRow}>
                      <Text
                        style={[
                          styles.streakCountText,
                          styles.streakCountInline,
                          { color: colors.foreground },
                        ]}
                      >
                        {currentStreak}
                      </Text>
                      <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
                        Días de racha
                      </Text>
                    </View>
                    <Text style={[styles.streakSubtitle, { color: progressAccent }]}>
                      Expande tu consciencia todos los días
                    </Text>
                  </View>
                </View>
              </View>

              <SonicStreakDays
                activeFlags={weekFlags}
                todayIndex={todayIndex}
                idPrefix="profile-streak"
                daysMarginTop={4}
                circleSize={37}
                edgeAligned
                dayLabelColor={activeTheme.accent ?? colors.primary}
                activeBorderColor="#7FB9AB"
              />
            </View>

            <View
              style={[
                styles.personalStatsSection,
                {
                  backgroundColor: resourceBlockBackground,
                  borderWidth: 0,
                },
              ]}
            >
              <View style={styles.personalStatsHeader}>
                <Text style={[styles.personalStatsTitle, { color: colors.foreground }]}>
                  Estadísticas personales
                </Text>
                <Pressable
                  onPress={() => setStatsFilterOpen((open) => !open)}
                  style={styles.statsFilterTrigger}
                  accessibilityRole="button"
                  accessibilityLabel="Elegir filtro de días"
                  accessibilityState={{ expanded: statsFilterOpen }}
                >
                  <Text style={[styles.statsFilterText, { color: progressAccent }]}>
                    Últimos {statsRangeDays} días
                  </Text>
                  <Feather name="chevron-down" size={17} color={progressAccent} />
                </Pressable>
                {statsFilterOpen && (
                  <View style={[styles.statsFilterMenu, { backgroundColor: resourceBlockBackground }]}>
                    {([7, 30, 90] as const).map((days) => (
                      <Pressable
                        key={days}
                        onPress={() => {
                          setStatsRangeDays(days);
                          setStatsFilterOpen(false);
                        }}
                        style={[
                          styles.statsFilterOption,
                          statsRangeDays === days && { backgroundColor: "rgba(152,93,212,0.16)" },
                        ]}
                      >
                        <Text style={[styles.statsFilterText, { color: progressAccent }]}>
                          Últimos {days} días
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                )}
              </View>

              <View style={styles.personalStatsValues}>
                <View style={styles.personalStatItem}>
                  <View style={styles.personalStatMetricRow}>
                    <View style={styles.personalStatIcon}>
                      <MaterialCommunityIcons name="spa" size={22} color={WIDGET_GREEN_SOLID} />
                    </View>
                    <Text style={[styles.personalStatValue, { color: colors.foreground }]}>
                      {`${Math.floor(personalStats.totalMinutes / 60)}h ${personalStats.totalMinutes % 60}m`}
                    </Text>
                  </View>
                  <Text style={[styles.personalStatLabel, { color: progressAccent }]}>
                    TIEMPO DE{"\n"}BIENESTAR
                  </Text>
                </View>
                <View style={[styles.personalStatDivider, { backgroundColor: "rgba(255,255,255,0.1)" }]} />
                <View style={styles.personalStatItem}>
                  <View style={styles.personalStatMetricRow}>
                    <View style={styles.personalStatIcon}>
                      <Feather name="clock" size={20} color={WIDGET_GREEN_SOLID} />
                    </View>
                    <Text style={[styles.personalStatValue, { color: colors.foreground }]}>
                      {personalStats.completedSessions}
                    </Text>
                  </View>
                  <Text style={[styles.personalStatLabel, { color: progressAccent }]}>
                    SESIONES{"\n"}COMPLETADAS
                  </Text>
                </View>
                <View style={[styles.personalStatDivider, { backgroundColor: "rgba(255,255,255,0.1)" }]} />
                <View style={styles.personalStatItem}>
                  <View style={styles.personalStatMetricRow}>
                    <View style={styles.personalStatIcon}>
                      <Feather name="flag" size={20} color={WIDGET_GREEN_SOLID} />
                    </View>
                    <Text style={[styles.personalStatValue, { color: colors.foreground }]}>
                      {maxStreak} {maxStreak === 1 ? "día" : "días"}
                    </Text>
                  </View>
                  <Text style={[styles.personalStatLabel, { color: progressAccent }]}>
                    RACHA{"\n"}MÁXIMA
                  </Text>
                </View>
              </View>
            </View>

            <HistorialCalendar embedded />
            <View style={{ marginTop: 32 }}>
              <ProfileMixCarousel marginBottom={32} />
            </View>
            <ProfileSettingsSections
              sceneId={activeSceneId}
              foreground={colors.foreground}
              mutedForeground={progressAccent}
              accent={activeTheme.accent ?? colors.primary}
              cardBackground={resourceBlockBackground}
              onLogout={handleProfileLogout}
            />

          </>
        )}

        {/* ── Sección Expansor (solo si role === "expansor") ── */}
        {isExpansor && (
          <>
            {/* Banner certificado — fuera del fondo */}
            <View style={[styles.dvCertBanner, { marginTop: -20, marginBottom: 20 }]}>
              <LinearGradient
                colors={["#F9F9F9", "#B8860B"]}
                start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                style={styles.dvCertBannerBar}
              />
              <View style={{ flex: 1, paddingLeft: 12, paddingVertical: 10, justifyContent: "center" }}>
                <MaskedView maskElement={<Text style={styles.dvCertBannerTitle}>EXPANSOR</Text>}>
                  <LinearGradient colors={["#F9F9F9", "#F9F9F9"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
                    <Text style={[styles.dvCertBannerTitle, { opacity: 0 }]}>EXPANSOR</Text>
                  </LinearGradient>
                </MaskedView>
                <Text style={styles.dvCertBannerSub}>Verificado por Resonancia</Text>
              </View>
              <View style={{ paddingRight: 14, justifyContent: "center" }}>
                <View style={styles.dvCertBannerIconBorder}>
                  <View style={styles.dvCertBannerIcon}>
                    <LinearGradient
                      colors={["rgba(212,175,55,0.30)", "rgba(184,134,11,0.20)"]}
                      style={StyleSheet.absoluteFill}
                    />
                    <Text style={styles.dvCertBannerStar}>✦</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.dvExpansorSection}>

              {/* Me especializo en */}
              {(expansorProfile?.specialties ?? []).length > 0 && (
                <View style={{ gap: 10 }}>
                  <Text style={styles.dvServiceTitle}>Me especializo en</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dvSpecialtyWrap}>
                    {(expansorProfile?.specialties ?? []).map((s) => (
                      <View key={s} style={styles.dvSpecialtyChip}>
                        <Text style={styles.dvSpecialtyText}>{s}</Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Mis servicios */}
              {expansorProfile?.description ? (
                <View style={{ gap: 10 }}>
                  <Text style={styles.dvServiceTitle}>Mis servicios</Text>
                  <Text
                    style={styles.dvServiceDesc}
                    numberOfLines={dvDescExpanded ? undefined : 7}
                    onTextLayout={(e) => { if (!dvDescOverflows && e.nativeEvent.lines.length > 7) setDvDescOverflows(true); }}
                  >
                    {expansorProfile.description}
                  </Text>
                  {dvDescOverflows && (
                    <Pressable onPress={() => setDvDescExpanded((v) => !v)} style={({ pressed }) => [styles.dvReadMoreBtn, { opacity: pressed ? 0.7 : 1 }]}>
                      <Text style={styles.dvReadMoreText}>{dvDescExpanded ? "Leer menos" : "Leer más"}</Text>
                      <Feather name={dvDescExpanded ? "chevron-up" : "chevron-down"} size={13} color="#F9F9F9" />
                    </Pressable>
                  )}
                </View>
              ) : null}

              {/* Contacto */}
              {(expansorProfile?.phone || expansorProfile?.email) && (
                <View style={styles.dvContactRow}>
                  {expansorProfile.phone ? (
                    <Pressable onPress={() => Linking.openURL(`tel:${expansorProfile.phone}`)} style={({ pressed }) => [styles.dvActionPill, { opacity: pressed ? 0.75 : 1, flex: 1, justifyContent: "center" }]}>
                      <Feather name="phone" size={13} color="#FFFFFF" />
                      <Text style={styles.dvActionPillText}>Teléfono</Text>
                    </Pressable>
                  ) : null}
                  {expansorProfile.email ? (
                    <Pressable onPress={() => Linking.openURL(`mailto:${expansorProfile.email}`)} style={({ pressed }) => [styles.dvActionPill, { opacity: pressed ? 0.75 : 1, flex: 1, justifyContent: "center" }]}>
                      <Feather name="mail" size={13} color="#FFFFFF" />
                      <Text style={styles.dvActionPillText}>Email</Text>
                    </Pressable>
                  ) : null}
                </View>
              )}

              {/* Instagram */}
              {expansorProfile?.instagram ? (
                <View style={styles.dvContactRow}>
                  <Pressable onPress={() => Linking.openURL(expansorProfile.instagram!)} style={({ pressed }) => [styles.dvActionPill, { opacity: pressed ? 0.75 : 1, flex: 1, justifyContent: "center" }]}>
                    <Feather name="instagram" size={13} color="#FFFFFF" />
                    <Text style={styles.dvActionPillText}>Instagram</Text>
                  </Pressable>
                </View>
              ) : null}

              {/* Placeholder si el perfil está vacío */}
              {!expansorProfile && (
                <Pressable onPress={openExpansorEdit} style={({ pressed }) => [styles.dvEmptyPrompt, { opacity: pressed ? 0.7 : 1 }]}>
                  <Feather name="plus-circle" size={16} color="#F9F9F9" />
                  <Text style={styles.dvEmptyPromptText}>Completa tu perfil expansor</Text>
                </Pressable>
              )}

            </View>

            {/* Galería */}
            {(expansorProfile?.photos ?? []).length > 0 && (
              <View style={styles.dvGallerySection}>
                <View style={styles.dvGalleryGrid}>
                  {(expansorProfile?.photos ?? []).map((objectPath, i) => {
                    const uri = resolveAvatarUrl(objectPath) ?? objectPath;
                    return (
                      <Pressable key={i} onPress={() => setDvLightboxUri(uri)} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
                        <Image
                          source={{ uri }}
                          style={[styles.dvGalleryCell, { width: dvCellSize, height: dvCellSize * 1.3 }]}
                          contentFit="cover"
                        />
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            )}

            {/* Quote */}
            {expansorProfile?.quote ? (
              <View style={styles.dvQuoteWrap}>
                <Text style={styles.dvQuoteText}>"{expansorProfile.quote}"</Text>
              </View>
            ) : null}
          </>
        )}

        {/* ── Secciones colapsables (ocultas con el ojo) ── */}
        <Animated.View style={{ opacity: sectionsAnim, maxHeight: sectionsAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 2400] }), overflow: "hidden" }}>




        </Animated.View>

      </ScrollView>
      )}


      {!dedicated && <BibliotecaScreen embedded initialTab={initialLibraryTab} onHeaderActions={setLibActions} />}
      </View>

      {/* ── Invitar Sheet ── */}
      <InvitarSheet
        visible={showInvitar}
        onClose={() => setShowInvitar(false)}
      />

      {/* ── Personalize Sheet ── */}
      <SimplePersonalizeSheet
        visible={personalizeVisible}
        onClose={() => setPersonalizeVisible(false)}
        selectedBgId={profileBgGradientId}
        onSelectBg={selectGradient}
        geoActive={profileGeoActive}
        onToggleGeo={setProfileGeoActive}
      />

      {/* ── Edit Details Modal ── */}
      <Modal
        visible={editVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditVisible(false)}
      >
        <KeyboardAvoidingView
          style={styles.modalRoot}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <LinearGradient
            colors={activeTheme.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          {/* Modal header */}
          <View style={[styles.modalHeader, { borderBottomColor: colors.border, paddingTop: insets.top + 16 }]}>
            <Pressable onPress={() => setEditVisible(false)} hitSlop={12}>
              <Feather name="x" size={22} color={colors.foreground} />
            </Pressable>
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Editar Detalles</Text>
            <View style={{ width: 22 }} />
          </View>

          <ScrollView
            contentContainerStyle={styles.modalForm}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <ModalField
              label="Nombre"
              value={editNombre}
              onChangeText={setEditNombre}
              placeholder="Tu nombre"
              colors={colors}
            />
            <ModalField
              label="Apellido"
              value={editApellido}
              onChangeText={setEditApellido}
              placeholder="Tu apellido"
              colors={colors}
            />
            <ModalField
              label="Locación"
              value={editLocation}
              onChangeText={setEditLocationLocal}
              placeholder="Ciudad, País"
              colors={colors}
              icon="map-pin"
            />
            <ModalField
              label="Descripción"
              value={editDesc}
              onChangeText={setEditDesc}
              placeholder="Cuéntanos un poco sobre ti..."
              colors={colors}
              multiline
            />

            <Pressable
              onPress={saveEdit}
              style={({ pressed }) => [
                styles.saveBtn,
                { overflow: "hidden", opacity: pressed ? 0.88 : 1 },
              ]}
            >
              <GoldGradientFill />
              <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>Guardar</Text>
            </Pressable>
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Modal edición perfil Expansor ── */}
      <Modal visible={expansorEditVisible} transparent animationType="slide" onRequestClose={() => setExpansorEditVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
          <View style={[styles.epModalBackdrop]}>
            <View style={[styles.epModalSheet, { paddingBottom: bottomPad + 20 }]}>
              {/* Header */}
              <View style={styles.epModalHeader}>
                <Text style={styles.epModalTitle}>Perfil Expansor</Text>
                <Pressable onPress={() => setExpansorEditVisible(false)} hitSlop={12} style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}>
                  <Feather name="x" size={20} color="rgba(250,240,238,0.55)" />
                </Pressable>
              </View>
              <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 14, paddingBottom: 8 }}>
                <View style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Especialidades (separadas por coma)</Text>
                  <View style={[styles.fieldBox, { backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 0 }]}>
                    <TextInput value={epSpecialties} onChangeText={setEpSpecialties} placeholder="Cuencos Tibetanos, Yoga" placeholderTextColor={colors.mutedForeground} style={[styles.fieldInput, { color: colors.foreground }]} />
                  </View>
                </View>
                <View style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Descripción de servicios</Text>
                  <View style={[styles.fieldBox, { backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 0, minHeight: 90, alignItems: "flex-start" }]}>
                    <TextInput value={epDescription} onChangeText={setEpDescription} placeholder="Describe lo que ofrecés..." placeholderTextColor={colors.mutedForeground} style={[styles.fieldInput, { color: colors.foreground, textAlignVertical: "top", paddingTop: 2 }]} multiline numberOfLines={4} />
                  </View>
                </View>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={[styles.fieldWrap, { flex: 1 }]}>
                    <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Teléfono</Text>
                    <View style={[styles.fieldBox, { backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 0 }]}>
                      <Feather name="phone" size={15} color={colors.mutedForeground} />
                      <TextInput value={epPhone} onChangeText={setEpPhone} placeholder="+54 11 1234" placeholderTextColor={colors.mutedForeground} style={[styles.fieldInput, { color: colors.foreground }]} keyboardType="phone-pad" />
                    </View>
                  </View>
                  <View style={[styles.fieldWrap, { flex: 1 }]}>
                    <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Email</Text>
                    <View style={[styles.fieldBox, { backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 0 }]}>
                      <Feather name="mail" size={15} color={colors.mutedForeground} />
                      <TextInput value={epEmail} onChangeText={setEpEmail} placeholder="tu@email.com" placeholderTextColor={colors.mutedForeground} style={[styles.fieldInput, { color: colors.foreground }]} keyboardType="email-address" autoCapitalize="none" />
                    </View>
                  </View>
                </View>
                <View style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Instagram (URL)</Text>
                  <View style={[styles.fieldBox, { backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 0 }]}>
                    <Feather name="instagram" size={15} color={colors.mutedForeground} />
                    <TextInput value={epInstagram} onChangeText={setEpInstagram} placeholder="https://instagram.com/tu_usuario" placeholderTextColor={colors.mutedForeground} style={[styles.fieldInput, { color: colors.foreground }]} autoCapitalize="none" />
                  </View>
                </View>
                <View style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Frase / Quote</Text>
                  <View style={[styles.fieldBox, { backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 0 }]}>
                    <TextInput value={epQuote} onChangeText={setEpQuote} placeholder="Tu frase inspiracional..." placeholderTextColor={colors.mutedForeground} style={[styles.fieldInput, { color: colors.foreground }]} />
                  </View>
                </View>

                {/* ── Galería de fotos ── */}
                <View style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Galería de fotos</Text>
                  <View style={styles.epPhotoGrid}>
                    {epPhotos.map((objectPath, idx) => {
                      const uri = resolveAvatarUrl(objectPath) ?? objectPath;
                      return (
                        <View key={idx} style={styles.epPhotoCell}>
                          <Image source={{ uri }} style={styles.epPhotoCellImg} contentFit="cover" />
                          <Pressable
                            onPress={() => removeExpansorPhoto(idx)}
                            style={styles.epPhotoRemoveBtn}
                            hitSlop={4}
                          >
                            <Feather name="x" size={11} color="#FFFFFF" />
                          </Pressable>
                        </View>
                      );
                    })}
                    {epPhotos.length < 9 && (
                      <Pressable
                        onPress={pickAndUploadExpansorPhoto}
                        disabled={epPhotoUploading}
                        style={({ pressed }) => [styles.epPhotoAddBtn, { opacity: (pressed || epPhotoUploading) ? 0.6 : 1 }]}
                      >
                        {epPhotoUploading
                          ? <ActivityIndicator size="small" color="#F9F9F9" />
                          : <Feather name="plus" size={22} color="#F9F9F9" />
                        }
                      </Pressable>
                    )}
                  </View>
                </View>

                <Pressable
                  onPress={saveExpansorProfile}
                  disabled={updateExpansorMutation.isPending || epPhotoUploading}
                  style={({ pressed }) => [styles.saveBtn, { overflow: "hidden", opacity: (pressed || updateExpansorMutation.isPending || epPhotoUploading) ? 0.75 : 1 }]}
                >
                  <GoldGradientFill />
                  <Text style={[styles.saveBtnText, { color: colors.primaryForeground }]}>
                    {updateExpansorMutation.isPending ? "Guardando..." : "Guardar"}
                  </Text>
                </Pressable>
              </ScrollView>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Lightbox galería Daniela Vega ── */}
      <Modal visible={!!dvLightboxUri} transparent animationType="fade" onRequestClose={() => setDvLightboxUri(null)}>
        <Pressable style={styles.dvLightboxBackdrop} onPress={() => setDvLightboxUri(null)}>
          <Image source={{ uri: dvLightboxUri ?? "" }} style={styles.dvLightboxImage} contentFit="contain" />
          <Pressable onPress={() => setDvLightboxUri(null)} style={[styles.dvLightboxClose, { top: (Platform.OS === "web" ? 20 : insets.top) + 12 }]} hitSlop={12}>
            <Feather name="x" size={20} color="#FFFFFF" />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

// ── Modal field component ────────────────────────────────────────────────────

function ModalField({ label, value, onChangeText, placeholder, colors, icon, multiline }: {
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder: string;
  colors: ReturnType<typeof import("@/hooks/useColors").useColors>;
  icon?: React.ComponentProps<typeof Feather>["name"];
  multiline?: boolean;
}) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <View style={[
        styles.fieldBox,
        { borderColor: colors.border, backgroundColor: "rgba(74,12,12,0.08)" },
        multiline && { minHeight: 90, alignItems: "flex-start" },
      ]}>
        {icon && <Feather name={icon} size={15} color={colors.mutedForeground} style={{ marginTop: multiline ? 2 : 0 }} />}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.mutedForeground}
          style={[styles.fieldInput, { color: colors.foreground }, multiline && { textAlignVertical: "top", paddingTop: 2 }]}
          multiline={multiline}
          numberOfLines={multiline ? 4 : 1}
          returnKeyType={multiline ? "default" : "next"}
        />
      </View>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  contentShift: {
    flex: 1,
    transform: [{ translateY: -5 }],
  },
  scroll: { flex: 1 },

  header: {
    marginBottom: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pageTitle: { fontFamily: "Manrope", fontSize: 28, fontWeight: "800", letterSpacing: 0.5 },

  // ── Sticky header (Panel/Biblioteca/Historial/Registros) ──────────────────
  stickyHeader: {
    zIndex: 10,
    backgroundColor: "transparent",
  },
  stickyHeaderDedicatedOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 30,
    elevation: 30,
  },
  stickyHeaderFadeOverflow: {
    overflow: "visible",
  },
  profileHeaderGlass: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 68,
    overflow: "hidden",
  },
  stickyHeaderBorder: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.035)",
  },
  stickyHeaderRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 10,
  },
  gearBtn: {
    width: 41,
    height: 41,
    borderRadius: 20.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  giftIcon: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    marginRight: 3,
    marginTop: 1,
  },
  stickyTitle: { fontFamily: "Manrope", fontSize: 18, fontWeight: "800", color: "#F4F4F4", letterSpacing: 0.3, flex: 1, textAlign: "center", marginLeft: -4, transform: [{ translateY: 4 }] },
  stickyTitleDedicated: { fontSize: 31, textAlign: "left", marginLeft: 0, transform: [{ translateY: 6 }] },
  profileSettingsWrap: { flexDirection: "row", alignItems: "center", transform: [{ translateY: 6 }] },
  compactTitleOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
  },
  compactProfileTitle: {
    fontFamily: "Manrope",
    fontSize: 18,
    fontWeight: "800",
    color: "#F4F4F4",
    letterSpacing: 0.3,
    textAlign: "center",
    transform: [{ translateY: 4 }],
  },
  stickyTitleBiblioteca: { fontSize: 27, textAlign: "left", position: "absolute", left: 19, top: 25 },
  stickyTitleTab: { fontSize: 30, fontWeight: "800", textAlign: "left", flex: 1, marginLeft: 0, transform: [{ translateY: 3 }] },
  libraryTabHeaderRow: {
    minHeight: 48,
    paddingBottom: 12,
  },
  libraryTabBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  libraryTabBackHitArea: {
    position: "absolute",
    left: 13,
    top: -6,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    elevation: 20,
  },
  stickyTitleLibraryTab: {
    fontFamily: "Manrope",
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    color: "#FBFBFB",
    letterSpacing: 0.2,
    textAlign: "center",
    flex: 1,
    marginLeft: 0,
    transform: [{ translateY: 0 }],
  },
  accountContent: {
    flex: 1,
  },
  accountBackButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  accountHeaderSpacer: {
    width: 36,
    height: 36,
  },
  accountFormFlex: {
    flex: 1,
  },
  accountForm: {
    paddingHorizontal: 24,
    paddingTop: 34,
    gap: 26,
  },
  accountAvatarButton: {
    alignSelf: "center",
    position: "relative",
    marginBottom: 6,
  },
  accountAvatar: {
    width: 112,
    height: 112,
    borderRadius: 56,
  },
  accountAvatarFallback: {
    alignItems: "center",
    justifyContent: "center",
  },
  accountAvatarBadge: {
    position: "absolute",
    right: 2,
    bottom: 2,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#784576",
    borderWidth: 2,
    borderColor: "#1B060F",
  },
  accountPressed: {
    opacity: 0.75,
  },
  accountField: {
    gap: 8,
  },
  accountFieldLabel: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "700",
    color: "#AAAAC4",
  },
  accountFieldValueBox: {
    backgroundColor: "rgba(42,40,64,0.65)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  accountFieldValue: {
    fontFamily: "Manrope",
    fontSize: 15,
    minHeight: 24,
  },
  accountNameInput: {
    fontFamily: "Manrope",
    fontSize: 15,
    minHeight: 42,
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: "rgba(42,40,64,0.65)",
    borderRadius: 10,
    borderWidth: 0,
  },
  accountSaveButton: {
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    marginTop: 4,
  },
  accountSaveButtonText: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  accountDeleteButton: {
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: -8,
    borderRadius: 999,
    borderWidth: 2,
    borderColor: "rgba(42,40,64,0.65)",
  },
  accountDeleteButtonText: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "700",
    color: "#E58B8B",
  },
  accountSavedToast: {
    position: "absolute",
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: "rgba(18,10,24,0.92)",
  },
  accountSavedToastText: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "700",
    color: "#F9F9F9",
  },
  libActionsPill: {
    position: "absolute",
    right: 19,
    top: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 40,
    marginRight: 0,
    marginTop: 0,
    borderRadius: 100,
  },
  libActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  pillRowScroll: { marginTop: 5 },
  pillRow: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
  pillBorder: {},
  pillBorderSel: {},
  pill: {
    flex: 1,
    height: 29,
    paddingHorizontal: 11.5,
    borderRadius: 999,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  pillSel: { borderWidth: 0 },
  pillText: { fontFamily: "Manrope", fontSize: 11, fontWeight: "400", letterSpacing: 0.3, color: "#F4F4F4" },
  pillTextSel: { fontFamily: "Manrope", color: "#2D0D3A", fontWeight: "500" },

  comingSoonWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  comingSoonText: { fontFamily: "Manrope", fontSize: 15, color: "rgba(244,218,213,0.45)", fontWeight: "600" },

  // Registros
  registrosCard: { borderRadius: 16, overflow: "hidden" },
  registrosRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  registrosLabel: { fontFamily: "Manrope", flex: 1, fontSize: 19, fontWeight: "500" },

  settingsBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  // Profile card
  profileCard: {
    borderRadius: 24,
    paddingTop: 24,
    paddingBottom: 24,
    alignItems: "stretch",
    overflow: "hidden",
    marginBottom: 15,
    gap: 0,
  },
  profileIdentityRow: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    gap: 16,
    paddingHorizontal: 24,
  },
  profileDetailsRow: { flex: 1, minWidth: 0, flexDirection: "row", alignItems: "center", gap: 8 },
  profileDetails: { flex: 1, minWidth: 0, alignItems: "flex-start", gap: 6 },
  profileChevronButton: {
    width: 32,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  membershipSection: {
    marginTop: 7,
    marginBottom: 0,
  },
  membershipCard: {
    overflow: "hidden",
    backgroundColor: "transparent",
  },
  profileCardDivider: {
    height: 1,
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.05)",
    marginTop: 20,
    marginBottom: 4,
  },
  membershipSectionDivider: {
    height: 1,
    width: "100%",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  membershipCardHeader: {
    minHeight: 86,
    flexDirection: "row",
    alignItems: "center",
    gap: 13,
    paddingHorizontal: 15,
    paddingVertical: 15,
  },
  membershipCardHeaderPremium: {
    minHeight: 66,
    paddingVertical: 6,
    paddingRight: 24,
  },
  membershipCardHeaderPlus: {
    minHeight: 61,
    paddingVertical: 3.5,
  },
  membershipIcon: {
    width: 54,
    height: 54,
    borderRadius: 27,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 0,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.75,
    shadowRadius: 18,
  },
  membershipCardCopy: {
    minWidth: 0,
    flex: 1,
    paddingRight: 3,
    transform: [{ translateX: -8 }],
  },
  membershipPlanName: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  membershipPlanEyebrow: {
    fontFamily: "Manrope",
    fontSize: 12,
    lineHeight: 16,
    color: MEMBERSHIP_AURORA.textMuted,
    marginTop: 2,
  },
  membershipBenefits: {
    paddingHorizontal: 15,
    paddingBottom: 15,
  },
  membershipBenefitsDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.1)",
    marginBottom: 11,
    marginHorizontal: -15,
  },
  membershipBenefitRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 9,
    marginBottom: 9,
  },
  membershipBenefitText: {
    flex: 1,
    fontFamily: "Manrope",
    fontSize: 13,
    lineHeight: 19,
    color: MEMBERSHIP_AURORA.textSoft,
  },
  membershipManageButton: {
    height: 44,
    borderRadius: 12,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 5,
  },
  membershipActionPressable: {
    borderRadius: 12,
  },
  membershipManageText: {
    fontFamily: "Manrope",
    fontSize: 13,
    fontWeight: "800",
    color: "#152132",
  },
  avatarWrapper: { position: "relative", marginBottom: 0 },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.1)",
  },
  userName: { fontFamily: "Manrope", fontSize: 20, fontWeight: "700", textAlign: "center" },
  userNameLeft: { textAlign: "left" },
  emailText: { fontFamily: "Manrope", fontSize: 12 },
  locationRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  locationText: { fontFamily: "Manrope", fontSize: 12 },
  bioText: { fontFamily: "Manrope", fontSize: 13, lineHeight: 19, textAlign: "center", paddingHorizontal: 8, fontStyle: "italic" },
  bioTextLeft: { textAlign: "left", paddingHorizontal: 0 },
  editBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
    marginTop: 6,
  },
  editBtnText: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600" },

  // Seguidores / Siguiendo
  followCountsRow: { flexDirection: "row", alignItems: "center", marginTop: 14, marginBottom: 4 },
  followCountItem: { alignItems: "center", paddingHorizontal: 20 },
  followCountNum: { fontFamily: "Manrope", fontSize: 18, fontWeight: "700" },
  followCountLabel: { fontFamily: "Manrope", fontSize: 11, marginTop: 1 },
  followCountDivider: { width: 1, height: 28 },

  // Plan card
  planCard: { borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 10 },
  planIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  planTitle: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700", marginBottom: 2 },
  planSub: { fontFamily: "Manrope", fontSize: 12 },
  planMejorar: { flexDirection: "row", alignItems: "center", gap: 2 },
  planMejorarText: { fontFamily: "Manrope", fontSize: 14, fontWeight: "700" },

  // Racha y estadísticas personales
  streakSection: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  streakHeadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 18,
  },
  streakHeadingMain: { flex: 1, flexDirection: "row", alignItems: "center", gap: 16 },
  streakLotusIcon: {
    width: 61,
    height: 61,
    alignItems: "center",
    justifyContent: "center",
  },
  streakLotusMask: {
    width: 61,
    height: 61,
  },
  streakHeadingCopy: { flex: 1, gap: 1 },
  streakTitleRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  sectionTitle: { fontFamily: "Manrope", fontSize: 19, fontWeight: "700", letterSpacing: 0.2 },
  streakSubtitle: { fontFamily: "Manrope", fontSize: 12, lineHeight: 17 },
  streakCountInline: { fontSize: 21 },
  streakCountText: { fontFamily: "Manrope", fontSize: 17, fontWeight: "700" },
  weeklyStreakSummary: {
    alignItems: "center",
  },
  weeklyStreakIntro: {
    width: "100%",
    paddingHorizontal: 2,
    marginTop: 15,
    marginBottom: 12,
  },
  weeklyStreakIntroTitle: {
    fontFamily: "Manrope",
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  weeklyStreakIntroDescription: {
    fontFamily: "Manrope",
    fontSize: 12,
    lineHeight: 17,
    color: MEMBERSHIP_AURORA.textMuted,
  },
  weeklyStreakTitle: {
    fontFamily: "Manrope",
    fontSize: 15,
    fontWeight: "700",
    letterSpacing: 0.9,
    marginBottom: 8,
  },
  weeklyStreakCounter: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    transform: [{ translateY: 10 }],
  },
  weeklyStreakNumber: {
    fontFamily: "Manrope",
    fontSize: 40,
    lineHeight: 43,
    fontWeight: "500",
  },
  weeklyStreakDaysLabel: {
    fontFamily: "Manrope",
    fontSize: 12,
    lineHeight: 15,
    marginTop: -1,
  },
  personalStatsSection: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    marginBottom: 15,
  },
  personalStatsHeader: { gap: 7 },
  personalStatsTitle: { fontFamily: "Manrope", fontSize: 17, fontWeight: "700" },
  statsFilterTrigger: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    gap: 4,
    paddingVertical: 1,
  },
  statsFilterMenu: {
    alignSelf: "flex-start",
    minWidth: 148,
    borderRadius: 12,
    overflow: "hidden",
    marginTop: 1,
  },
  statsFilterOption: { paddingHorizontal: 12, paddingVertical: 9 },
  statsFilterText: { fontFamily: "Manrope", fontSize: 11, fontWeight: "700" },
  personalStatsValues: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: 24,
  },
  personalStatItem: { flex: 1, minWidth: 0, alignItems: "center", gap: 8 },
  personalStatMetricRow: { flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 4 },
  personalStatIcon: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  personalStatDivider: { width: 1, height: 58, marginHorizontal: 4 },
  personalStatValue: { fontFamily: "Manrope", fontSize: 22, fontWeight: "600" },
  personalStatLabel: { fontFamily: "Manrope", fontSize: 10, lineHeight: 15, letterSpacing: 0.35, textAlign: "center" },
  // Membresía
  membershipRow: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 32,
  },
  membershipPlan: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700", marginBottom: 2 },
  membershipSub: { fontFamily: "Manrope", fontSize: 12 },
  membershipAction: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600" },


  // Favoritos
  favRow: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    padding: 10,
    gap: 12,
    marginBottom: 10,
  },
  favImg: { width: 52, height: 52, borderRadius: 10 },
  favInfo: { flex: 1 },
  favTitle: { fontFamily: "Manrope", fontSize: 14, fontWeight: "600", marginBottom: 3 },
  favSub: { fontFamily: "Manrope", fontSize: 12 },

  // Menu
  menuCard: {
    borderRadius: 18,
    overflow: "hidden",
  },
  menuRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 14,
  },
  menuLabel: { fontFamily: "Manrope", flex: 1, fontSize: 15, fontWeight: "500" },

  footer: { fontFamily: "Manrope", textAlign: "center", fontSize: 11, letterSpacing: 1, marginBottom: 8 },

  // Edit modal
  modalRoot: { flex: 1 },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  modalTitle: { fontFamily: "Manrope", fontSize: 17, fontWeight: "700" },
  modalForm: { padding: 24, gap: 20, paddingBottom: 60 },

  // Modal fields
  fieldWrap: { gap: 7 },
  fieldLabel: { fontFamily: "Manrope", fontSize: 11, fontWeight: "700", letterSpacing: 1.2, textTransform: "uppercase" },
  fieldBox: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  fieldInput: { fontFamily: "Manrope", flex: 1, fontSize: 15, backgroundColor: "transparent" },
  saveBtn: { borderRadius: 14, paddingVertical: 16, alignItems: "center", marginTop: 8 },
  saveBtnText: { fontFamily: "Manrope", fontSize: 16, fontWeight: "700" },

  communityRow: { flexDirection: "row", gap: 8, marginBottom: 43 },
  communityCard: {
    flex: 1,
    paddingTop: 14,
    paddingBottom: 12,
    paddingHorizontal: 8,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  communityLabel: { fontFamily: "Manrope", fontSize: 12, fontWeight: "500", textAlign: "center", letterSpacing: 0.2 },

  // Expansor section
  expansorSection: {
    backgroundColor: "rgba(212,175,55,0.06)",
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.18)",
    padding: 16,
    marginBottom: 16,
    gap: 12,
  },
  expansorHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  expansorBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F9F9F9",
    alignItems: "center",
    justifyContent: "center",
  },
  expansorBadgeStar: { fontFamily: "Manrope", fontSize: 14, color: "#1B060F", fontWeight: "800" },
  expansorTitle: { fontFamily: "Manrope", fontSize: 14, fontWeight: "700", color: "#F9F9F9" },
  expansorCertLabel: { fontFamily: "Manrope", fontSize: 11, color: "rgba(212,175,55,0.60)", marginTop: 1 },
  expansorViewBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: "rgba(212,175,55,0.10)",
  },
  expansorViewText: { fontFamily: "Manrope", fontSize: 12, color: "#F9F9F9", fontWeight: "600" },
  expansorSpecWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  expansorChip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: "rgba(74,12,12,0.45)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.20)",
  },
  expansorChipText: { fontFamily: "Manrope", fontSize: 12, color: "#FAF0EE", fontWeight: "500" },
  expansorBio: { fontFamily: "Manrope", fontSize: 13, lineHeight: 20, color: "rgba(255,255,255,0.75)" },
  expansorLinksRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  expansorLinkBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 10,
    backgroundColor: "rgba(212,175,55,0.10)",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.20)",
  },
  expansorLinkText: { fontFamily: "Manrope", fontSize: 12, color: "#F9F9F9", fontWeight: "600" },

  // ── Sección Daniela Vega (expansor) ──
  dvExpansorSection: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 18,
    padding: 16,
    gap: 16,
    marginTop: -11,
    marginBottom: 16,
  },
  dvCertBanner: {
    flexDirection: "row",
    alignItems: "stretch",
    borderRadius: 12,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(212,175,55,0.18)",
    backgroundColor: "rgba(212,175,55,0.05)",
  },
  dvCertBannerBar: { width: 5 },
  dvCertBannerTitle: { fontFamily: "Manrope", fontSize: 13, fontWeight: "800", letterSpacing: 0.4, color: "#F9F9F9" },
  dvCertBannerSub: { fontFamily: "Manrope", fontSize: 11, color: "rgba(255,255,255,0.90)", marginTop: 2 },
  dvCertBannerIconBorder: {
    width: 35, height: 35, borderRadius: 18,
    borderWidth: 1.5, borderColor: "rgba(212,175,55,0.20)", flexShrink: 0,
  },
  dvCertBannerIcon: { flex: 1, borderRadius: 16, overflow: "hidden", alignItems: "center", justifyContent: "center" },
  dvCertBannerStar: { fontFamily: "Manrope", fontSize: 17, color: "rgba(212,175,55,0.90)", fontWeight: "800" },
  dvServiceTitle: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700", color: "#FAF0EE", letterSpacing: 0.2 },
  dvServiceDesc: { fontFamily: "Manrope", fontSize: 13, lineHeight: 20, color: "#F4F4F4" },
  dvReadMoreBtn: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 6, alignSelf: "flex-start" },
  dvReadMoreText: { fontFamily: "Manrope", fontSize: 13, fontWeight: "600", color: "#F9F9F9" },
  dvSpecialtyWrap: { flexDirection: "row", gap: 8, alignItems: "center" },
  dvSpecialtyChip: {
    borderRadius: 20, paddingHorizontal: 14, height: 34, overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.07)", alignItems: "center", justifyContent: "center",
  },
  dvSpecialtyText: { fontFamily: "Manrope", fontSize: 13, color: "#FFFFFF", fontWeight: "400", letterSpacing: 0.1 },
  dvContactRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  dvActionPill: {
    flexDirection: "row", alignItems: "center", gap: 6,
    borderRadius: 20, paddingHorizontal: 14, height: 34, overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  dvActionPillText: { fontFamily: "Manrope", fontSize: 13, fontWeight: "400", color: "#FFFFFF", letterSpacing: 0.1 },
  dvGallerySection: {
    borderRadius: 18, padding: 16, gap: 12, marginBottom: 16,
  },
  dvGalleryGrid: { flexDirection: "row", flexWrap: "wrap", gap: 4 },
  dvGalleryCell: { borderRadius: 10, backgroundColor: "rgba(255,255,255,0.05)" },
  dvQuoteWrap: { alignItems: "center", paddingVertical: 8, paddingHorizontal: 8, marginBottom: 16 },
  dvQuoteText: {
    fontFamily: "Manrope",
    fontSize: 18, fontStyle: "italic", color: "#F6F6F6",
    textAlign: "center", lineHeight: 28, letterSpacing: 0.2,
  },
  dvLightboxBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.92)", alignItems: "center", justifyContent: "center" },
  dvLightboxImage: { width: "100%", height: "80%" },
  dvLightboxClose: {
    position: "absolute", right: 18, width: 38, height: 38, borderRadius: 19,
    backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center",
  },
  dvEmptyPrompt: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingVertical: 12, justifyContent: "center",
  },
  dvEmptyPromptText: { fontFamily: "Manrope", fontSize: 14, color: "#F9F9F9", fontWeight: "600" },
  expansorEditIconBtn: {
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: "rgba(212,175,55,0.10)",
    alignItems: "center", justifyContent: "center",
  },
  epModalBackdrop: {
    flex: 1, backgroundColor: "rgba(0,0,0,0.55)", justifyContent: "flex-end",
  },
  epModalSheet: {
    flex: 1,
    backgroundColor: "#1B060F",
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    paddingTop: 20, paddingHorizontal: 20, gap: 16,
    maxHeight: "90%",
  },
  epModalHeader: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 4,
  },
  epModalTitle: { fontFamily: "Manrope", fontSize: 17, fontWeight: "700", color: "#FAF0EE" },
  epPhotoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  epPhotoCell: {
    width: 80,
    height: 96,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
  },
  epPhotoCellImg: {
    width: "100%",
    height: "100%",
  },
  epPhotoRemoveBtn: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
  },
  epPhotoAddBtn: {
    width: 80,
    height: 96,
    borderRadius: 10,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: "rgba(212,175,55,0.40)",
    backgroundColor: "rgba(212,175,55,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },

  // ── Racha Stats Card ──────────────────────────────────────────────────────
  rachaStatsCard: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 20,
    overflow: "hidden",
  },
  rachaStatsHeader: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.06)",
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rachaStatsTitle: {
    fontFamily: "Manrope",
    fontSize: 22,
    fontWeight: "700",
    letterSpacing: 0.4,
    marginRight: 4,
  },
  rachaWeekPills: {
    flexDirection: "row",
    gap: 6,
    flex: 1,
  },
  rachaWeekPill: {
    flex: 1,
    aspectRatio: 1,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.12)",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
  },
  rachaWeekPillText: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "700",
  },
  rachaWeekSub: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "500",
  },
  rachaStatsRow: {
    flexDirection: "row",
    paddingVertical: 14,
  },
  rachaStatCol: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 4,
    position: "relative",
  },
  rachaStatDivider: {
    position: "absolute",
    left: 0,
    top: "15%",
    bottom: "15%",
    width: 1,
  },
  rachaStatEmoji: {
    fontSize: 18,
    marginBottom: 4,
  },
  rachaStatVal: {
    fontFamily: "Manrope",
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.2,
  },
  rachaStatLabel: {
    fontFamily: "Manrope",
    fontSize: 10,
    fontWeight: "500",
    textAlign: "center",
    marginTop: 2,
  },
  rachaStatSub: {
    fontFamily: "Manrope",
    fontSize: 9,
    marginTop: 1,
  },
});
