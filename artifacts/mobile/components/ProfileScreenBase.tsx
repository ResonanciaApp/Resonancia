import { Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { randomUUID } from "expo-crypto";
import { File as FSFile, Paths } from "expo-file-system";
import { Image } from "expo-image";
import * as Haptics from "expo-haptics";
import * as ImagePicker from "expo-image-picker";
import { LinearGradient } from "expo-linear-gradient";
import { SymbolView } from "expo-symbols";
import { GoldGradient, GoldGradientFill } from "@/components/GoldGradient";
import { BackPill } from "@/components/BackPill";
import Reanimated from "react-native-reanimated";
import { GestureDetector, GestureHandlerRootView } from "react-native-gesture-handler";
import { ScrollProgressIndicator, useScrollProgress } from "@/components/ScrollProgressIndicator";
import { router, useFocusEffect, useNavigation } from "expo-router";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { CardCaptionText as Text } from "@/components/CardCaptionText";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  Switch,
  TextInput,
  type TextStyle,
  useWindowDimensions,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import MaskedView from "@react-native-masked-view/masked-view";

import {
  useGetMe,
  getGetMeQueryKey,
  useGetMyFollowCounts,
  getGetMyFollowCountsQueryKey,
  useGetMyExpansorProfile,
  getGetMyExpansorProfileQueryKey,
  useUpdateMyExpansorProfile,
  deleteMyAccount,
  updateMe,
  type ExpansorProfile,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { QuickAccessGrid } from "@/components/QuickAccessGrid";
import { SacredBackground } from "@/components/SacredBackground";
import { useSceneTheme } from "@/context/SceneThemeContext";
import { getThemeStyleId, isIndigo2ThemeId, isIndigoThemeId } from "@/config/scene-themes";
import { useUserProfile } from "@/context/UserProfileContext";
import { usePremium } from "@/context/PremiumContext";
import { useAuth } from "@/context/AuthContext";
import { useGrowth } from "@/context/GrowthContext";
import type { LibraryTab } from "@/context/DrawerContext";
import { useColors } from "@/hooks/useColors";
import { IMAGE_TRANSITION } from "@/constants/imagePlaceholder";
import { getExpansorById } from "@/data/expansores";
import { uploadLocalFile } from "@/lib/upload";
import { resolveAvatarUrl } from "@/lib/avatar";
import { buildLocalAvatarFilename } from "@/lib/profile-avatar-logic";
import { removeLocalAccountData } from "@/lib/accountData";
import { useGeometrixCreations } from "@/hooks/useGeometrixCreations";
import { InvitarSheet } from "@/components/InvitarSheet";
import { SimplePersonalizeSheet } from "@/components/SimplePersonalizeSheet";
import { MessageDeck } from "@/components/MessageDeck";
import {
  BibliotecaScreen,
  getLibraryTabSurface,
  type LibHeaderActions,
} from "@/components/BibliotecaScreen";
import { ProgressMirrorSections } from "@/components/ProgressMirrorSections";
import { ProfileSettingsSections } from "@/components/ProfileSettingsSections";
import { limitProfileDescription, MAX_PROFILE_DESCRIPTION_LENGTH } from "@/lib/profileDescription";
import { ProfileMembershipBanner } from "@/components/ProfileMembershipBanner";
import { SessionBadgeGlass } from "@/components/SessionDurationBadge";
import { ProfileReflectionWallSection } from "@/components/ProfileReflectionWallSection";
import { MiRutinaSection } from "@/components/MiRutinaSection";
import { ReflectionSavedBanner } from "@/components/ReflectionSavedBanner";
import type { HomeReflectionWallHandle } from "@/components/HomeReflectionWallSection";
import { GrowthJourneySheet } from "@/components/GrowthJourneySheet";
import { GrowthLevelPreviewCard, GrowthCurrentStagePill } from "@/components/GrowthJourney";
import { useCoverPresetCatalogState, type CoverCatalogItem } from "@/lib/cover-preset-catalog";
import { AvatarCategoryMenu, AvatarCategoryTrigger } from "@/components/AvatarCategoryDropdown";
import {
  ALL_AVATARS,
  avatarFilterLabel,
  filterAvatarsByCategory,
  padAvatarGrid,
  reconcileAvatarFilter,
  type AvatarCategoryFilter,
} from "@/lib/profile-avatar-categories";
import {
  gradientColors,
  type GeoSettings,
} from "@/data/geometrix-creations";
import { SacredGlyph } from "@/components/SacredGlyph";
import { baseOf, type GeometryId } from "@/data/geometries";
import { GeometrixOverlay } from "@/components/GeometrixToggle";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { MoonCrescentIcon } from "@/components/MoonCrescentIcon";
import { SleepReminderSheet } from "@/components/SleepReminderSheet";
import { GoldenAvatarSheet } from "@/components/GoldenAvatarSheet";
import { useGrowthJourneySheetMotion } from "@/hooks/useGrowthJourneySheetMotion";
import { useAvatarPickerDismiss } from "@/hooks/useAvatarPickerDismiss";
import { usePreparedAvatarImage } from "@/hooks/usePreparedAvatarImage";
import { drawerDiagnosticEvent } from "@/hooks/useDrawerDiagnostics";
import { StreakInfoSheet } from "@/components/StreakInfoSheet";
import { FilledSunIcon } from "@/components/FilledSunIcon";
import { useMixerPanel } from "@/context/MixerPanelContext";
import { CARD_TEXT_BELOW, MEMBERSHIP_AURORA, getProfileSecondaryTextColor } from "@/constants/colors";

const SHOW_PROFILE_PRACTICE_CARDS = false;
// Separación entre los bloques de progreso en Perfil.
const PROFILE_SECTION_GAP = 21;
const PROFILE_CARD_BOTTOM_PADDING = 20;
const PROFILE_WEEK_TOP_PADDING = 18;

const AvatarCoverCell = React.memo(function AvatarCoverCell({
  preset, selected, locked, disabled, onSelect,
}: {
  preset: CoverCatalogItem; selected: boolean; locked: boolean; disabled: boolean;
  onSelect: (preset: CoverCatalogItem) => void;
}) {
  return (
    <Pressable
      onPress={() => onSelect(preset)}
      accessibilityRole="button"
      accessibilityLabel={`Avatar: ${preset.label}${locked ? ", desbloquear con 1 cupo" : ""}`}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      style={({ pressed }) => [
        styles.accountCoverPresetFrame,
        selected && styles.accountCoverPresetFrameSelected,
        { opacity: pressed ? 0.72 : 1 },
      ]}
    >
      <Image source={preset.source} style={styles.accountCoverPresetPhoto}
        contentFit="cover" cachePolicy="memory-disk" transition={0} />
      {locked && (
        <View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.accountAvatarLockedOverlay]}>
          <MaterialCommunityIcons name="lock" size={16} color="#F9F9F9" accessibilityElementsHidden importantForAccessibility="no" />
        </View>
      )}
    </Pressable>
  );
});

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

function ProfileHeaderActions({
  sticky = false,
  foreground,
  activeSceneId,
  onEdit,
  onSettings,
}: {
  sticky?: boolean;
  foreground: string;
  activeSceneId: string | null;
  onEdit: () => void;
  onSettings: () => void;
}) {
  const backgroundColor = getThemeStyleId(activeSceneId) === "cloudy" ? "rgba(0,0,0,0.19)" : "rgba(0,0,0,0.16)";
  return (
    <View pointerEvents="box-none" style={[styles.profileHeaderActions, sticky && styles.profileStickyHeaderActions]}>
      <Pressable
        onPress={onEdit}
        hitSlop={4}
        style={({ pressed }) => [styles.gearBtn, { backgroundColor, opacity: pressed ? 0.68 : 1 }]}
        accessibilityRole="button"
        accessibilityLabel="Editar detalles en Mi cuenta"
        testID={sticky ? "profile-sticky-edit-details" : "profile-edit-details"}
      >
        <Feather name="edit-2" size={21} color={foreground} />
      </Pressable>
      <Pressable
        onPress={onSettings}
        hitSlop={4}
        style={({ pressed }) => [styles.gearBtn, { backgroundColor, opacity: pressed ? 0.68 : 1 }]}
        accessibilityRole="button"
        accessibilityLabel="Abrir ajustes"
        testID={sticky ? "profile-sticky-open-settings" : "profile-open-settings"}
      >
        <Feather name="settings" size={21} color={foreground} />
      </Pressable>
    </View>
  );
}

export function ProfileScreenBase({
  dedicated = false,
  accountMode = false,
  settingsMode = false,
  onBack,
  asTab = false,
  initialLibraryTab,
}: {
  dedicated?: boolean;
  accountMode?: boolean;
  settingsMode?: boolean;
  onBack?: () => void;
  asTab?: boolean;
  initialLibraryTab?: LibraryTab | null;
}) {
  const colors = useColors();
  const [growthJourneyOpen, setGrowthJourneyOpen] = useState(false);
  const [streakInfoOpen, setStreakInfoOpen] = useState(false);
  useFocusEffect(useCallback(() => () => setStreakInfoOpen(false), []));
  const { isPremium } = usePremium();
  const { openMixer } = useMixerPanel();
  const { theme: activeTheme, activeSceneId } = useSceneTheme();
  const profileSecondaryTextColor = getProfileSecondaryTextColor(activeSceneId);
  const insets = useSafeAreaInsets();
  const { email, logout } = useAuth();
  const growth = useGrowth();
  const avatarSpendRef = useRef(false);
  const {
    username,
    lastName,
    location,
    description,
    lifeMotto,
    photoUri,
    avatarPresetId,
    expansorId,
    updateProfile,
    saveProfile,
    setPhotoUri,
  } = useUserProfile();
  const {
    items: profileCatalog,
    categories: profileCategories,
    authoritativeRevision: profileCatalogRevision,
    refresh: refreshProfileCatalog,
  } = useCoverPresetCatalogState("profile");
  const [avatarFilter, setAvatarFilter] = useState<AvatarCategoryFilter>(ALL_AVATARS);
  const [avatarFilterOpen, setAvatarFilterOpen] = useState(false);
  const filteredProfileCatalog = useMemo(
    () => padAvatarGrid(filterAvatarsByCategory(profileCatalog, avatarFilter), 5),
    [profileCatalog, avatarFilter],
  );
  useEffect(() => {
    // A deleted category returns to Todos only once a fresh catalog confirms it.
    setAvatarFilter((current) => reconcileAvatarFilter(current, profileCategories, profileCatalogRevision > 0));
  }, [profileCategories, profileCatalogRevision]);

  const resourceBlockBackground = "rgba(0,0,0,0.16)";
  const libraryHeaderButtonBackground = getLibraryTabSurface(activeSceneId);
  const resourceBlockBorder = "rgba(255,255,255,0.1)";
  const secondaryAccent = activeTheme.accent ?? colors.accent;
  const expansorData = expansorId ? getExpansorById(expansorId) : undefined;
  const { data: me, refetch: refetchMe } = useGetMe({ query: { queryKey: getGetMeQueryKey(), staleTime: 0 } });
  const selectedAvatarPresetId = avatarPresetId;
  const selectedProfilePreset = selectedAvatarPresetId
    ? profileCatalog.find((preset) => preset.key === selectedAvatarPresetId || preset.id === selectedAvatarPresetId || `profile:${preset.key}` === selectedAvatarPresetId)
    : undefined;
  const { data: followCounts } = useGetMyFollowCounts({
    query: { queryKey: getGetMyFollowCountsQueryKey(), staleTime: 30_000 },
  });
  const topPad = Platform.OS === "web" ? 67 : Math.max(insets.top, 40);
  const bottomPad = Platform.OS === "web" ? 34 : insets.bottom;
  const [libActions, setLibActions] = useState<LibHeaderActions | null>(null);
  const [morningReminderVisible, setMorningReminderVisible] = useState(false);
  const [sleepReminderVisible, setSleepReminderVisible] = useState(false);
  const profileScrollRef = useRef<ScrollView>(null);
  const profileScrollYRef = useRef(0);
  const profileWallRef = useRef<HomeReflectionWallHandle>(null);
  const [profileWallCardHeight, setProfileWallCardHeight] = useState(82);
  const [profileWallComposing, setProfileWallComposing] = useState(false);
  const [profileReflectionSavedTrigger, setProfileReflectionSavedTrigger] = useState(0);
  const handleProfileReflectionSaved = useCallback(() => {
    setProfileReflectionSavedTrigger((current) => current + 1);
  }, []);
  const profileReflectionBannerBottom = 58 + (Platform.OS === "web" ? 8 : insets.bottom) + 15;
  const getProfileScrollY = useCallback(() => profileScrollYRef.current, []);
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
  const profileStickyHeaderOpacity = useRef(new Animated.Value(0)).current;
  const [profileStickyHeaderActive, setProfileStickyHeaderActive] = useState(false);
  const handleHeaderScroll = (e: { nativeEvent: { contentOffset: { y: number } } }) => {
    const y = e.nativeEvent.contentOffset.y;
    const shouldShowBorder = y >= HEADER_BORDER_THRESHOLD_PX;
    if (shouldShowBorder !== headerBorderActiveRef.current) {
      headerBorderActiveRef.current = shouldShowBorder;
      if (dedicated) {
        setProfileStickyHeaderActive(shouldShowBorder);
        profileStickyHeaderOpacity.stopAnimation();
        Animated.timing(profileStickyHeaderOpacity, {
          toValue: shouldShowBorder ? 1 : 0,
          duration: 220,
          useNativeDriver: true,
        }).start();
      }
      Animated.timing(headerBorderAnim, {
        toValue: shouldShowBorder ? 1 : 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const { width, height } = useWindowDimensions();

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
  const [accountDescription, setAccountDescription] = useState(description);
  const [accountDescriptionHeight, setAccountDescriptionHeight] = useState(122);
  const [accountLifeMotto, setAccountLifeMotto] = useState(lifeMotto);
  const [accountPhotoUri, setAccountPhotoUri] = useState(photoUri);
  const [accountAvatarPresetId, setAccountAvatarPresetId] = useState(selectedProfilePreset?.id ?? avatarPresetId);
  const accountSelectedProfilePreset = accountAvatarPresetId
    ? profileCatalog.find((preset) => preset.id === accountAvatarPresetId || preset.key === accountAvatarPresetId || `profile:${preset.key}` === accountAvatarPresetId)
    : undefined;
  const accountCoverHeroSource = useMemo(
    () => accountSelectedProfilePreset?.source ?? (accountPhotoUri ? { uri: accountPhotoUri } : null),
    [accountSelectedProfilePreset?.source, accountPhotoUri],
  );
  const accountCoverHero = usePreparedAvatarImage(accountCoverHeroSource, accountMode);
  const [accountAction, setAccountAction] = useState<"delete" | null>(null);
  const [accountSaving, setAccountSaving] = useState(false);
  const accountSavingRef = useRef(false);
  const accountDraftBaselineRef = useRef<string | null>(null);
  const accountClosedRef = useRef(false);
  const avatarOpeningRef = useRef(false);
  const openAvatarPicker = async () => {
    if (avatarOpeningRef.current || accountSavingRef.current) return;
    avatarOpeningRef.current = true;
    // Reset before native presentation, never while the sheet is moving.
    setAvatarFilter(ALL_AVATARS);
    setAvatarFilterOpen(false);
    try {
      await accountCoverHero.prepare();
    } catch (error) {
      // A broken image must not trap the user outside the selector.
      console.warn("[avatar-cover] No se pudo cargar el avatar al abrir:", error);
    } finally {
      avatarOpeningRef.current = false;
    }
    if (!accountClosedRef.current && !accountSavingRef.current) {
      setAccountPhotoPickerVisible(true);
    }
  };
  const [accountPhotoPickerVisible, setAccountPhotoPickerVisible] = useState(false);
  const [goldenAvatarVisible, setGoldenAvatarVisible] = useState(false);
  const goldenAvatarHeight = Math.max(200, height * 0.85 - 200);
  const goldenAvatarMotion = useGrowthJourneySheetMotion(goldenAvatarVisible && accountPhotoPickerVisible, goldenAvatarHeight);
  const goldenAvatarActive = goldenAvatarVisible || goldenAvatarMotion.rendered;
  const avatarHeaderBackground = getThemeStyleId(activeSceneId) === "cloudy" || activeSceneId === "natural"
    ? "rgba(0,0,0,0.19)" : "rgba(0,0,0,0.16)";
  const closeAvatarPicker = () => {
    if (avatarFilterOpen) setAvatarFilterOpen(false);
    else if (goldenAvatarActive) setGoldenAvatarVisible(false);
    else setAccountPhotoPickerVisible(false);
  };
  const avatarScrollProgress = useScrollProgress(accountPhotoPickerVisible);
  const [avatarGridTop, setAvatarGridTop] = useState(0);
  const avatarPickerMotion = useAvatarPickerDismiss({
    visible: accountPhotoPickerVisible,
    enabled: accountPhotoPickerVisible && !goldenAvatarActive && !avatarFilterOpen,
    sheetHeight: height * 0.85,
    sheetTop: height * 0.15,
    gridTop: avatarGridTop + 39,
    scrollOffset: avatarScrollProgress.offset,
    onClose: () => setAccountPhotoPickerVisible(false),
  });
  const accountAvatarGridRef = useRef<FlatList<(typeof filteredProfileCatalog)[number]>>(null);
  const [accountPhotoLibraryPending, setAccountPhotoLibraryPending] = useState(false);
  useEffect(() => {
    if (!accountPhotoPickerVisible) setGoldenAvatarVisible(false);
  }, [accountPhotoPickerVisible]);
  const selectAvatarFilter = (next: AvatarCategoryFilter) => {
    setAvatarFilterOpen(false);
    if (next === avatarFilter) return;
    setAvatarFilter(next);
    // Reset list scroll (and with it the progress guide) for the new group.
    accountAvatarGridRef.current?.scrollToOffset({ offset: 0, animated: false });
  };
  useEffect(() => {
    accountClosedRef.current = false;
    return () => { accountClosedRef.current = true; };
  }, []);

  useEffect(() => {
    if (accountMode) {
      const draft = JSON.stringify([accountName, accountDescription, accountLifeMotto, accountPhotoUri, accountAvatarPresetId]);
      // A background profile sync must not overwrite unsaved form edits.
      if (accountDraftBaselineRef.current !== null && accountDraftBaselineRef.current !== draft) return;
      accountDraftBaselineRef.current = JSON.stringify([
        username, limitProfileDescription(description), lifeMotto, photoUri, selectedProfilePreset?.id ?? avatarPresetId,
      ]);
      setAccountName(username);
      setAccountDescription(limitProfileDescription(description));
      setAccountLifeMotto(lifeMotto);
      setAccountPhotoUri(photoUri);
      setAccountAvatarPresetId(selectedProfilePreset?.id ?? avatarPresetId);
    } else {
      accountDraftBaselineRef.current = null;
    }
  }, [accountMode, username, description, lifeMotto, photoUri, avatarPresetId]);

  const accountAvatarChanged = accountPhotoUri !== photoUri
    || (accountSelectedProfilePreset?.id ?? accountAvatarPresetId) !== (selectedProfilePreset?.id ?? avatarPresetId);
  const accountHasChanges = accountAvatarChanged
    || accountName.trim() !== username.trim()
    || accountDescription.trim() !== description.trim()
    || accountLifeMotto.trim() !== lifeMotto.trim();
  const accountSaveDisabled = accountSaving || Boolean(accountAction) || !accountHasChanges;

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

  const closeAccount = () => {
    if (accountClosedRef.current) return;
    accountClosedRef.current = true;
    if (onBack) onBack();
    else router.back();
  };

  const requestCloseAccount = () => {
    if (accountSavingRef.current || accountClosedRef.current) return;
    if (!accountHasChanges) {
      closeAccount();
      return;
    }
    Alert.alert(
      "¿Estás seguro/a de que quieres descargar los cambios?",
      undefined,
      [
        { text: "Continuar editando", style: "cancel" },
        { text: "Descartar", style: "destructive", onPress: closeAccount },
      ],
      { cancelable: false },
    );
  };

  const saveAccount = async () => {
    if (accountSaveDisabled || accountSavingRef.current || accountClosedRef.current) return;
    accountSavingRef.current = true;
    setAccountSaving(true);
    try {
      let confirmedAvatarPresetId = accountAvatarPresetId;
      let avatarConfirmation;
      if (accountAvatarChanged && accountAvatarPresetId) {
        // Editorial locks are confirmed at Save, never while previewing a draft.
        avatarConfirmation = await updateMe({ avatarPresetId: accountAvatarPresetId });
        confirmedAvatarPresetId = avatarConfirmation.avatarPresetId ?? null;
      }
      await saveProfile({
        username: accountName,
        description: limitProfileDescription(accountDescription).trim(),
        lifeMotto: accountLifeMotto,
        ...(accountAvatarChanged ? { avatarPresetId: confirmedAvatarPresetId, photoUri: accountPhotoUri } : {}),
      });
      if (avatarConfirmation) {
        qc.setQueryData(getGetMeQueryKey(), avatarConfirmation);
        void qc.invalidateQueries();
      }
    } catch {
      if (!accountClosedRef.current) {
        Alert.alert("No se pudo guardar", "No se pudo completar el guardado. Inténtalo nuevamente.");
        if (accountAvatarChanged && accountAvatarPresetId) void refreshProfileCatalog();
      }
      return;
    } finally {
      accountSavingRef.current = false;
      if (!accountClosedRef.current) setAccountSaving(false);
    }
    if (accountClosedRef.current) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    closeAccount();
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
  const applySelectedPhoto = (uri: string) => {
    if (accountMode) {
      if (accountClosedRef.current || accountSavingRef.current) return;
      setAccountPhotoUri(uri);
      setAccountAvatarPresetId(null);
    } else {
      setPhotoUri(uri);
    }
  };

  const pickPhoto = async () => {
    if (accountMode && (accountClosedRef.current || accountSavingRef.current)) return;
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
      if (accountMode && accountClosedRef.current) return;
      const tempUri = result.assets[0].uri;
      if (Platform.OS === "web") {
        try {
          const dataUrl = await resizeImageForWeb(tempUri, 320);
          applySelectedPhoto(dataUrl);
        } catch {
          applySelectedPhoto(tempUri);
        }
      } else {
        try {
          const src = new FSFile(tempUri);
          const dest = new FSFile(Paths.document, buildLocalAvatarFilename(tempUri, randomUUID()));
          src.copy(dest);
          applySelectedPhoto(dest.uri);
        } catch {
          applySelectedPhoto(tempUri);
        }
      }
    }
  };

  const selectAccountAvatar = (preset: (typeof profileCatalog)[number]) => {
    if (accountSavingRef.current || accountClosedRef.current) return;
    setAccountAvatarPresetId(preset.id);
    setAccountPhotoUri(null);
  };
  const pickAccountAvatarPreset = async (preset: (typeof profileCatalog)[number]) => {
    if (accountSavingRef.current || accountClosedRef.current || avatarSpendRef.current) return;
    if (!preset.isLocked || growth.progress?.unlockedAvatarIds.includes(preset.id) || preset.id === selectedAvatarPresetId) {
      selectAccountAvatar(preset);
      return;
    }
    // Refetch before showing a spend confirmation; offline state cannot authorize a purchase.
    avatarSpendRef.current = true;
    let refreshed: { data?: typeof growth.progress; isError?: boolean };
    try { refreshed = await growth.refresh(); }
    finally { avatarSpendRef.current = false; }
    if (accountClosedRef.current) return;
    if (refreshed.isError || !refreshed.data) {
      Alert.alert("No se pudo verificar", "Conéctate e inicia sesión para consultar tus desbloqueos.");
      return;
    }
    if (refreshed.data.unlockedAvatarIds.includes(preset.id)) {
      selectAccountAvatar(preset);
      return;
    }
    if (refreshed.data.balance < 1) {
      Alert.alert("Avatar bloqueado", "Avanza en Tu camino para ganar desbloqueos y elegir avatares.");
      return;
    }
    const spend = async () => {
      if (avatarSpendRef.current || accountClosedRef.current) return;
      avatarSpendRef.current = true;
      try {
        await growth.unlock(preset.id);
        // The owned avatar remains available even if this profile draft is discarded.
        selectAccountAvatar(preset);
      } catch {
        Alert.alert("No se pudo desbloquear", "Revisa tu conexión y saldo e inténtalo de nuevo. El servidor confirma cada gasto.");
      } finally { avatarSpendRef.current = false; }
    };
    const message = `Usarás 1 de tus ${refreshed.data.balance} desbloqueos. Este avatar quedará disponible para ti.`;
    if (Platform.OS === "web") {
      if (window.confirm(`¿Desbloquear este avatar?\n${message}`)) await spend();
    } else {
      Alert.alert("¿Desbloquear este avatar?", message, [
        { text: "Cancelar", style: "cancel" },
        { text: "Desbloquear", onPress: () => { void spend(); } },
      ]);
    }
  };

  const pickAvatarRef = useRef(pickAccountAvatarPreset);
  pickAvatarRef.current = pickAccountAvatarPreset;
  const selectCoverAvatar = useCallback((preset: CoverCatalogItem) => {
    void pickAvatarRef.current(preset);
  }, []);

  useEffect(() => {
    if (accountPhotoPickerVisible && avatarPickerMotion.opened) {
      void refreshProfileCatalog();
      void growth.refresh();
    }
  }, [accountPhotoPickerVisible, avatarPickerMotion.opened, refreshProfileCatalog]);

  useEffect(() => {
    if (
      Platform.OS === "ios"
      || accountPhotoPickerVisible || avatarPickerMotion.rendered
      || !accountPhotoLibraryPending
    ) return;
    const frame = requestAnimationFrame(() => {
      setAccountPhotoLibraryPending(false);
      void pickPhoto();
    });
    return () => cancelAnimationFrame(frame);
  }, [accountPhotoLibraryPending, accountPhotoPickerVisible, avatarPickerMotion.rendered]);


  // ── Fondo activo (degradado de perfil) ────────────────────────────────────
  // Fondo fijo (mismo degradado que Inicio). La personalización de fondo se
  // retiró de la UI (WatercolorBtn); ya no debe tomar el color de una paleta
  // guardada previamente en AsyncStorage (@profile_bg_gradient/@profile_bg_creation).
  const activeBgColors = activeTheme.gradient;

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

  if (settingsMode) {
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
                <Feather
                  name="chevron-left"
                  size={28}
                  color="#FBFBFB"
                  style={{ transform: [{ translateX: -1 }] }}
                />
              </Pressable>
              <Text style={styles.stickyTitleLibraryTab}>Configuración y ajustes</Text>
              <View style={styles.accountHeaderSpacer} />
            </View>
          </View>

          <ScrollView
            contentContainerStyle={[styles.settingsScreenContent, { paddingBottom: bottomPad + 40 }]}
            showsVerticalScrollIndicator={false}
          >
            <ProfileSettingsSections
              placement="settings"
              sceneId={activeSceneId}
              foreground={colors.foreground}
              mutedForeground={colors.mutedForeground}
              accent={secondaryAccent}
              cardBackground="rgba(0,0,0,0.16)"
              onLogout={handleProfileLogout}
            />
          </ScrollView>
        </View>
      </View>
    );
  }

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
            <View testID="account-header-actions" style={[styles.stickyHeaderRow, styles.libraryTabHeaderRow]}>
              <Pressable
                onPress={requestCloseAccount}
                hitSlop={8}
                style={styles.accountBackButton}
                accessibilityRole="button"
                accessibilityLabel="Cerrar edición"
                testID="account-close"
                disabled={accountSaving}
              >
                <Feather
                  name="x"
                  size={22}
                  color="#FBFBFB"
                />
              </Pressable>
              <Pressable
                testID="account-save"
                onPress={saveAccount}
                disabled={accountSaveDisabled}
                accessibilityRole="button"
                accessibilityState={{ disabled: accountSaveDisabled }}
                style={({ pressed }) => [
                  styles.accountSaveButton,
                  accountSaveDisabled && styles.accountSaveButtonDisabled,
                  !accountSaveDisabled && pressed && styles.accountSaveButtonPressed,
                ]}
              >
                <Text style={[styles.accountSaveButtonText, accountSaveDisabled && styles.accountSaveButtonTextDisabled]}>
                  Guardar
                </Text>
              </Pressable>
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
                onPress={() => void openAvatarPicker()}
                disabled={accountSaving}
                style={({ pressed }) => [styles.accountAvatarButton, pressed && styles.accountPressed]}
                accessibilityRole="button"
                accessibilityLabel="Cambiar foto de perfil"
              >
                {accountPhotoUri ? (
                  <Image source={{ uri: accountPhotoUri }} style={styles.accountAvatar} contentFit="cover" />
                ) : accountSelectedProfilePreset ? (
                  <Image source={accountSelectedProfilePreset.source} style={styles.accountAvatar} contentFit="cover" />
                ) : (
                  <View style={[styles.accountAvatar, styles.accountAvatarFallback, { backgroundColor: colors.secondary }]}>
                    <Feather name="user" size={34} color={colors.primary} />
                  </View>
                )}
                <View style={styles.accountAvatarBadge}>
                  <GoldGradientFill />
                  <Feather name="camera" size={14} color="#1B060F" />
                </View>
              </Pressable>

              <View style={styles.accountField}>
                <Text style={styles.accountFieldLabel}>
                  Nombre
                </Text>
                <TextInput
                  value={accountName}
                  editable={!accountSaving}
                  onChangeText={setAccountName}
                  style={[styles.accountNameInput, { color: colors.foreground }]}
                  autoCapitalize="words"
                  returnKeyType="done"
                />
              </View>

              <View testID="account-life-motto-section" style={styles.accountField}>
                <Text style={styles.accountFieldLabel}>Lema de vida</Text>
                <TextInput
                  testID="account-life-motto-input"
                  value={accountLifeMotto}
                  editable={!accountSaving}
                  onChangeText={setAccountLifeMotto}
                  style={[styles.accountNameInput, { color: colors.foreground }]}
                  accessibilityLabel="Lema de vida"
                  returnKeyType="done"
                />
              </View>

              <View testID="account-description-section" style={styles.accountField}>
                <Text style={styles.accountFieldLabel}>Descripción</Text>
                <TextInput
                  testID="account-description-input"
                  value={accountDescription}
                  editable={!accountSaving}
                  autoCorrect={true}
                  spellCheck={true}
                  onChangeText={(text) => setAccountDescription(limitProfileDescription(text))}
                  style={[styles.accountNameInput, styles.accountDescriptionInput, { color: colors.foreground, height: accountDescriptionHeight }]}
                  multiline
                  scrollEnabled={false}
                  onContentSizeChange={(event) => setAccountDescriptionHeight(Math.max(122, Math.ceil(event.nativeEvent.contentSize.height)))}
                  maxLength={MAX_PROFILE_DESCRIPTION_LENGTH}
                  textAlignVertical="top"
                  accessibilityLabel="Descripción de tu perfil"
                />
              </View>

              <Pressable
                onPress={handleDeleteAccount}
                disabled={Boolean(accountAction) || accountSaving}
                style={({ pressed }) => [
                  styles.accountDeleteButton,
                  { opacity: pressed || accountAction ? 0.65 : 1 },
                ]}
              >
                <Text style={styles.accountDeleteButtonText}>Eliminar cuenta</Text>
              </Pressable>

            </ScrollView>
          </KeyboardAvoidingView>
          <Modal
            visible={accountPhotoPickerVisible || avatarPickerMotion.rendered}
            animationType="none"
            transparent
            statusBarTranslucent
            onShow={() => {
              accountAvatarGridRef.current?.scrollToOffset({ offset: 0, animated: false });
              avatarPickerMotion.onShow();
            }}
            onRequestClose={closeAvatarPicker}
            onDismiss={() => {
              setGoldenAvatarVisible(false);
              if (!accountPhotoLibraryPending) return;
              requestAnimationFrame(() => {
                setAccountPhotoLibraryPending(false);
                void pickPhoto();
              });
            }}
          >
            <GestureHandlerRootView style={styles.accountCoverModalRoot}>
            <Reanimated.View pointerEvents="none" style={[styles.accountCoverBackdrop, avatarPickerMotion.backdropStyle]} />
            <Pressable
              testID="avatar-cover-backdrop-close"
              style={styles.accountCoverBackdropClose}
              onPress={() => setAccountPhotoPickerVisible(false)}
              disabled={!accountPhotoPickerVisible || goldenAvatarActive}
              accessibilityRole="button"
              accessibilityLabel="Cerrar Portada de avatares"
            />
            <GestureDetector gesture={avatarPickerMotion.gesture}>
            <Reanimated.View
              testID="avatar-cover-sheet"
              collapsable={false}
              pointerEvents={goldenAvatarActive ? "none" : "auto"}
              accessibilityElementsHidden={goldenAvatarActive}
              importantForAccessibility={goldenAvatarActive ? "no-hide-descendants" : "auto"}
              style={[styles.accountCoverSheet, avatarPickerMotion.sheetStyle]}
            >
              <LinearGradient
                colors={activeTheme.gradient as unknown as [string, string, ...string[]]}
                style={StyleSheet.absoluteFill}
                pointerEvents="none"
              />
              <View style={{ flex: 1 }}>
              <View style={styles.accountCoverHandle} />
              <View style={styles.accountCoverHeader}>
                <Text style={styles.accountCoverTitle}>Portada</Text>
                <Pressable
                  style={[styles.accountCoverCloseButton, { backgroundColor: avatarHeaderBackground }]}
                  onPress={() => {
                    drawerDiagnosticEvent("avatar:close-x");
                    setAccountPhotoPickerVisible(false);
                  }}
                  disabled={!accountPhotoPickerVisible}
                  hitSlop={4}
                  accessibilityRole="button"
                  accessibilityLabel="Cerrar Portada de avatares"
                  testID="avatar-cover-close"
                >
                  <Feather name="x" size={20} color="#F9F9F9" />
                </Pressable>
                <Pressable
                  style={[styles.accountCoverUploadButton, { backgroundColor: avatarHeaderBackground }]}
                  onPress={() => {
                    setAccountPhotoLibraryPending(true);
                    setAccountPhotoPickerVisible(false);
                  }}
                  hitSlop={4}
                  accessibilityRole="button"
                  accessibilityLabel="Elegir una foto"
                  testID="avatar-cover-upload"
                >
                  <Feather name="image" size={18} color="#F9F9F9" />
                </Pressable>
                <Pressable
                  onPress={() => setGoldenAvatarVisible(true)}
                  style={[styles.accountCoverCelebrationButton, { backgroundColor: avatarHeaderBackground }]}
                  accessibilityRole="button"
                  accessibilityLabel="Abrir Avatar dorado"
                  testID="avatar-cover-celebration"
                  hitSlop={8}
                >
                  <MaterialCommunityIcons name="party-popper" size={22} color="#F9F9F9" />
                </Pressable>
              </View>
              <View style={styles.accountCoverPreviewSlot}>
                {accountSelectedProfilePreset ? (
                  <Image
                    source={accountCoverHero.image ?? accountSelectedProfilePreset.source}
                    style={styles.accountCoverPreview}
                    contentFit="cover"
                    transition={0}
                  />
                ) : accountPhotoUri ? (
                  <Image source={accountCoverHero.image ?? { uri: accountPhotoUri }} style={styles.accountCoverPreview} contentFit="cover" transition={0} />
                ) : (
                  <View
                    style={[
                      styles.accountCoverPreview,
                      styles.accountAvatarFallback,
                      { backgroundColor: colors.secondary },
                    ]}
                  >
                    <Feather name="user" size={34} color={colors.primary} />
                  </View>
                )}
              </View>
              <View
                style={styles.accountCoverPresetGrid}
                onLayout={event => setAvatarGridTop(event.nativeEvent.layout.y)}
              >
              <View style={styles.accountAvatarCategoryRow}>
                <View style={styles.accountAvatarCategoryAnchor}>
                  <AvatarCategoryTrigger
                    label={avatarFilterLabel(avatarFilter, profileCategories)}
                    open={avatarFilterOpen}
                    onPress={() => setAvatarFilterOpen((open) => !open)}
                  />
                </View>
              </View>
              <GestureDetector gesture={avatarPickerMotion.gridGesture}>
              <Reanimated.FlatList
                ref={accountAvatarGridRef}
                style={styles.accountCoverPresetGrid}
                onScroll={avatarScrollProgress.onScroll}
                onLayout={avatarScrollProgress.onLayout}
                onContentSizeChange={avatarScrollProgress.onContentSizeChange}
                scrollEventThrottle={16}
                data={filteredProfileCatalog}
                keyExtractor={(preset) => preset.id}
                numColumns={5}
                initialNumToRender={8}
                maxToRenderPerBatch={2}
                windowSize={3}
                updateCellsBatchingPeriod={avatarPickerMotion.opened ? 80 : 1000}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={[styles.accountCoverPresetGridContent, styles.accountCoverPresetGridContentFiltered, { paddingBottom: bottomPad + 20 }]}
                ListEmptyComponent={
                  <View style={styles.accountAvatarCategoryEmpty} testID="avatar-category-empty">
                    <Text style={styles.accountAvatarCategoryEmptyText}>No hay avatares en esta categoría.</Text>
                    <Pressable
                      onPress={() => selectAvatarFilter(ALL_AVATARS)}
                      accessibilityRole="button"
                      style={[styles.accountAvatarCategoryEmptyButton, { backgroundColor: avatarHeaderBackground }]}
                      testID="avatar-category-empty-all"
                    >
                      <Text style={styles.accountAvatarCategoryEmptyButtonText}>Ver Todos</Text>
                    </Pressable>
                  </View>
                }
                columnWrapperStyle={styles.accountCoverPresetGridRow}
                renderItem={({ item: preset }) => {
                  if (preset.placeholder) return <View style={styles.accountCoverPresetFrame} pointerEvents="none" importantForAccessibility="no" accessibilityElementsHidden />;
                   const selected = preset.id === (accountSelectedProfilePreset?.id ?? accountAvatarPresetId);
                  const locked = Boolean(preset.isLocked && !growth.progress?.unlockedAvatarIds.includes(preset.id) && preset.id !== selectedAvatarPresetId);
                  return (
                    <AvatarCoverCell preset={preset} selected={selected} locked={locked}
                      disabled={accountSaving || growth.spending} onSelect={selectCoverAvatar} />
                  );
                }}
              />
              </GestureDetector>
              <ScrollProgressIndicator progress={avatarScrollProgress} />
              </View>
              </View>
              <AvatarCategoryMenu
                visible={avatarFilterOpen}
                top={avatarGridTop + 39 - 15 + 6}
                right={20}
                categories={profileCategories}
                value={avatarFilter}
                sceneId={activeSceneId}
                onSelect={selectAvatarFilter}
                onDismiss={() => setAvatarFilterOpen(false)}
              />
            </Reanimated.View>
            </GestureDetector>
            <GoldenAvatarSheet motion={goldenAvatarMotion} sheetHeight={goldenAvatarHeight} onClose={() => setGoldenAvatarVisible(false)} />
            </GestureHandlerRootView>
          </Modal>
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
        <LinearGradient
          colors={[bgFrom[0], bgFrom[1], ...bgFrom.slice(2)]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
      </Animated.View>
      {/* Fondo nuevo — aparece */}
      <Animated.View
        style={[StyleSheet.absoluteFill, { opacity: crossFadeAnim }]}
        pointerEvents="none"
      >
        <LinearGradient
          colors={[bgTo[0], bgTo[1], ...bgTo.slice(2)]}
          style={StyleSheet.absoluteFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
        />
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
      {asTab ? (
        <LinearGradient
          colors={activeTheme.gradient as [string, string, ...string[]]}
          locations={activeTheme.gradientLocations}
          start={activeTheme.gradientStart}
          end={activeTheme.gradientEnd}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />
      ) : (
        <SacredBackground variant="gradient" noImage ambientGlowMode="none" />
      )}
      <GeometrixOverlay active={profileGeoActive} />

      <View style={styles.contentShift}>
      {dedicated && (
        <Animated.View
          pointerEvents={profileStickyHeaderActive ? "auto" : "none"}
          style={[
            styles.profileStickyHeader,
            {
              paddingTop: topPad + 2,
              backgroundColor: activeTheme.gradient[0] as string,
              opacity: profileStickyHeaderOpacity,
            },
          ]}
        >
          <View style={styles.profileStickyHeaderRow}>
            <Animated.View
              pointerEvents="none"
              style={[
                styles.profileStickyHeaderTitleGroup,
                {
                  transform: [{
                    translateY: profileStickyHeaderOpacity.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  }],
                },
              ]}
            >
              <Text testID="profile-sticky-title" style={[styles.profileStickyHeaderTitle, { color: colors.foreground }]}>Perfil</Text>
            </Animated.View>
            <ProfileHeaderActions
              sticky
              foreground={colors.foreground}
              activeSceneId={activeSceneId}
              onEdit={() => router.push("/mi-perfil")}
              onSettings={() => router.push("/configuracion-ajustes")}
            />
          </View>
        </Animated.View>
      )}
      {!dedicated && (
        <View
          style={[styles.stickyHeader, { paddingTop: asTab ? topPad + 4 : topPad + 2 }]}
        >
          {!isIndigoThemeId(activeSceneId) && !isIndigo2ThemeId(activeSceneId) && (
            <Animated.View collapsable={false} style={[styles.stickyHeaderBorder, { opacity: headerBorderAnim }]} />
          )}
          <View style={[
            styles.stickyHeaderRow,
            !asTab && { paddingTop: 25 },
            asTab && styles.libraryTabHeaderRow,
            asTab && styles.libraryMainHeaderShift,
          ]}>
            {asTab && (
              <Pressable
                onPress={onBack ?? (() => router.navigate("/(tabs)/inicio3" as never))}
                hitSlop={6}
                style={styles.libraryTabBackHitArea}
                accessibilityRole="button"
                accessibilityLabel="Volver a Inicio"
              >
                {({ pressed }) => (
                  <View
                    style={[
                      styles.libraryTabBackBtn,
                      { backgroundColor: "rgba(0,0,0,0.16)", opacity: pressed ? 0.7 : 1 },
                    ]}
                  >
                    <Feather name="chevron-left" size={28} color="#FBFBFB" style={{ transform: [{ translateX: -1 }] }} />
                  </View>
                )}
              </Pressable>
            )}
            {!asTab && (
              <BackPill
                onPress={onBack ?? (() => router.canGoBack() ? router.back() : router.navigate("/(tabs)/inicio8" as never))}
                size={28}
                bgColor={libraryHeaderButtonBackground}
                standardSurface
                style={{ transform: [{ translateX: -2 }, { translateY: -50 }] }}
              />
            )}
            <Animated.Text style={[
              styles.stickyTitle,
              !asTab && styles.stickyTitleBiblioteca,
              asTab && styles.stickyTitleLibraryTab,
            ]}>Biblioteca</Animated.Text>
            {libActions && !libActions.hidden ? (
            <View style={styles.libActionsPill}>
              <Pressable
                onPress={libActions.onSearch}
                hitSlop={10}
                style={[styles.libActionBtn, { backgroundColor: "rgba(0,0,0,0.16)" }]}
                accessibilityRole="button"
                accessibilityLabel="Buscar en Biblioteca"
              >
                {Platform.OS === "ios" ? (
                  <SymbolView name="magnifyingglass" tintColor="#f9f9f9" size={24} />
                ) : (
                  <Feather name="search" size={24} color="#f9f9f9" />
                )}
              </Pressable>
              <Pressable
                onPress={libActions.onAdd}
                hitSlop={10}
                style={[styles.libActionBtn, { backgroundColor: "rgba(0,0,0,0.16)" }]}
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
      )}

      {dedicated && (
      <KeyboardAwareScrollViewCompat
        scrollRef={profileScrollRef}
        style={styles.scroll}
        contentContainerStyle={{
          paddingBottom: 160 + bottomPad + (profileWallComposing ? 440 : 0),
          paddingTop: topPad + 2,
          paddingHorizontal: 16,
        }}
        showsVerticalScrollIndicator={false}
        scrollEnabled={scrollEnabled}
        onScroll={(event) => {
          profileScrollYRef.current = event.nativeEvent.contentOffset.y;
          handleHeaderScroll(event);
          profileWallRef.current?.finishPendingScroll();
        }}
        onScrollBeginDrag={() => profileWallRef.current?.cancelPendingScroll()}
        onMomentumScrollEnd={() => profileWallRef.current?.finishPendingScroll(true)}
        scrollEventThrottle={16}
        keyboardShouldPersistTaps="handled"
        enabled={!profileWallComposing}
        bottomOffset={165}
        disableScrollOnKeyboardHide
      >
        <View pointerEvents="box-none" style={styles.dedicatedTitleRow}>
          <ProfileHeaderActions
            foreground={colors.foreground}
            activeSceneId={activeSceneId}
            onEdit={() => router.push("/mi-perfil")}
            onSettings={() => router.push("/configuracion-ajustes")}
          />
        </View>

        {/* ── Profile Card ── */}
          <View testID="profile-user-section" style={[styles.profileCard, dedicated && styles.dedicatedProfileCard, isPremium && styles.profileIdentityPreviewCard]}>
          <View
            testID="profile-identity-row"
            style={styles.profileIdentityRow}
          >
            {/* Avatar */}
            <Pressable
              onPress={() => router.push("/mi-perfil")}
              style={styles.avatarWrapper}
              testID="profile-identity-avatar"
              accessibilityRole="button"
              accessibilityLabel="Abrir Mi cuenta"
            >
              {photoUri ? (
                <Image source={{ uri: photoUri }} style={styles.avatarImage} contentFit="cover" />
              ) : selectedProfilePreset ? (
                <Image source={selectedProfilePreset.source} style={styles.avatarImage} contentFit="cover" />
              ) : (
                <View style={[styles.avatarCircle, { backgroundColor: colors.secondary }]}>
                  <Feather name="user" size={28} color={colors.primary} />
                </View>
              )}
              {isPremium && (
                <View testID="profile-avatar-premium-badge" pointerEvents="none" style={styles.avatarPremiumBadge}>
                  <SessionBadgeGlass showBlackTint={false} showWhiteTint />
                  <Image source={require("../assets/images/estrella-premium.png")} style={{ width: 25, height: 25 }} contentFit="contain" />
                </View>
              )}
            </Pressable>

            {/* Name + details */}
            <View
              testID="profile-identity-details"
              style={styles.profileDetails}
            >
              <View testID="profile-identity-title-row" style={styles.profileNameRow}>
              <Pressable
                onPress={() => router.push("/mi-perfil")}
                testID="profile-identity-name"
                accessibilityRole="button"
                accessibilityLabel="Abrir Mi cuenta"
                style={styles.profileNameText}
              >
              <Text
                style={[styles.userName, { color: colors.foreground }]}
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {username}{lastName ? ` ${lastName}` : ""}
              </Text>
              </Pressable>

              </View>

              <GrowthCurrentStagePill />

              {(lifeMotto.trim() !== "" || description.trim() !== "") && (
                <View testID="profile-identity-biography" style={styles.profileBiography}>
                  {lifeMotto.trim() !== "" && (
                    <Text
                      testID="profile-identity-life-motto"
                      style={[styles.profileLifeMotto, { color: colors.foreground }]}
                    >
                      {lifeMotto}
                    </Text>
                  )}

                  {description.trim() !== "" && (
                    <Text
                      testID="profile-identity-description"
                      style={[styles.profileDescription, { color: profileSecondaryTextColor }]}
                    >
                      {description}
                    </Text>
                  )}
                </View>
              )}
            </View>
          </View>
        </View>

        {!isPremium && (
          <View testID="profile-premium-section" style={{ marginBottom: PROFILE_SECTION_GAP }}>
            <ProfileMembershipBanner isPremium={isPremium} foregroundColor={colors.foreground} />
          </View>
        )}

        {false && (
          <View style={styles.wisdomSection}>
            <Text style={[styles.wisdomSectionTitle, { color: colors.foreground }]}>
              Mensaje de los sabios
            </Text>
            <MessageDeck />
          </View>
        )}

        {/* ── Progreso, propósito y rutina (solo en el Perfil dedicado) ── */}
        {dedicated && (
          <>
            <View style={[
              styles.profileProgressSection,
              { marginTop: isPremium ? styles.profileProgressSection.marginTop + 15 : 0 },
            ]}>
              <ProgressMirrorSections
                showSectionBorders={false}
                showPersonalStats={false}
                showStreakWeek
                showCalendar
                calendarTextSizeAdjustment={-2}
                calendarDayTextSizeAdjustment={-3}
                showCalendarCompletedCount
                separateStreakHistory
                centerStreakHistoryCopy
                showStreakHistoryTitle={false}
                showStreakHistoryInfo={false}
                onStreakHistoryPress={() => setStreakInfoOpen(true)}
                weeklySectionTitle="Progreso semanal"
                weeklySectionBackgroundColor="rgba(0,0,0,0.16)"
                weeklySectionHorizontalPadding={20}
                streakContentTranslateY={0}
                streakMarginBottom={PROFILE_SECTION_GAP}
                streakHistoryTopPadding={18}
                streakHistoryDividerOffsetY={0}
                longestStreakLabel="RACHA ACUMULADA"
                secondaryTextColor={profileSecondaryTextColor}
                longestStreakIconColor={MEMBERSHIP_AURORA.premium.accent}
                sectionBackgroundColor="rgba(0,0,0,0.16)"
                sectionHorizontalPadding={20}
                sectionTopPadding={PROFILE_WEEK_TOP_PADDING}
                sectionBottomPadding={18}
                sectionMarginBottom={PROFILE_SECTION_GAP}
                canonicalVerticalInsets
                profileCalendarLayout
                profileStreakIcons
                afterCalendar={
                  <>
                    <View testID="profile-growth-intention" style={{ marginTop: PROFILE_SECTION_GAP }}>
                      <GrowthLevelPreviewCard embedded canonicalVerticalInsets sectionTitle="Tu camino" titleFontSize={17} backgroundColor="rgba(0,0,0,0.16)" onPress={() => setGrowthJourneyOpen(true)} />
                    </View>
                  </>
                }
                onStreakTitlePress={() => router.push("/progreso" as never)}
              />
            </View>

            <MiRutinaSection titleSize={19} addCardHeight={profileWallCardHeight} alignCardGapToWall style={{ marginHorizontal: 0, marginTop: 40, marginBottom: PROFILE_SECTION_GAP }} />

            <ProfileReflectionWallSection
              ref={profileWallRef}
              scrollRef={profileScrollRef}
              getScrollY={getProfileScrollY}
              onComposingChange={setProfileWallComposing}
              onMessageSaved={handleProfileReflectionSaved}
              onCollapsedHeightChange={setProfileWallCardHeight}
              style={{ marginTop: 40, marginBottom: PROFILE_SECTION_GAP }}
            />

            {SHOW_PROFILE_PRACTICE_CARDS && (
            <>
            <Pressable
              onPress={() => setMorningReminderVisible(true)}
              style={({ pressed }) => [
                styles.practiceReminderSection,
                styles.practiceReminderFirst,
                { opacity: pressed ? 0.72 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Administrar recordatorio matutino"
            >
              <View style={styles.practiceReminderIcon}>
                <FilledSunIcon size={24} color="#FFB27D" />
              </View>
              <View style={styles.practiceReminderCopy}>
                <Text style={[styles.practiceReminderTitle, { color: colors.foreground }]}>
                  Recordatorio matutino
                </Text>
                <Text style={[styles.practiceReminderSubtitle, { color: CARD_TEXT_BELOW }]}>
                  Atención plena para tus mañanas
                </Text>
              </View>
              <Feather name="chevron-right" size={22} color={colors.foreground} />
            </Pressable>

            <Pressable
              onPress={() => setSleepReminderVisible(true)}
              style={({ pressed }) => [
                styles.practiceReminderSection,
                styles.practiceReminderMiddle,
                { opacity: pressed ? 0.72 : 1 },
              ]}
              accessibilityRole="button"
              accessibilityLabel="Administrar recordatorio para dormir"
            >
              <View style={styles.practiceReminderIcon}>
                <MoonCrescentIcon color="#C4A8F5" size={30} />
              </View>
              <View style={styles.practiceReminderCopy}>
                <Text style={[styles.practiceReminderTitle, { color: colors.foreground }]}>
                  Recordatorio para dormir
                </Text>
                <Text style={[styles.practiceReminderSubtitle, { color: CARD_TEXT_BELOW }]}>
                  Configura tu hora de descanso
                </Text>
              </View>
              <Feather name="chevron-right" size={22} color={colors.foreground} />
            </Pressable>

            <View style={styles.practiceToolsRow}>
              <Pressable
                onPress={() => openMixer()}
                style={({ pressed }) => [
                  styles.practiceToolCard,
                  { opacity: pressed ? 0.72 : 1 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Abrir Mezclador de sonidos"
              >
                <View style={[styles.practiceReminderIcon, styles.practiceToolIcon]}>
                  <MaterialCommunityIcons name="tune-vertical" size={27} color="#7DD8F5" />
                </View>
                <Text style={[styles.practiceReminderTitle, styles.practiceToolTitle, { color: colors.foreground }]}>
                  Mezclador de sonidos
                </Text>
                <Text style={[styles.practiceReminderSubtitle, styles.practiceToolSubtitle, { color: CARD_TEXT_BELOW }]}>
                  Crea tu propio universo sonoro
                </Text>
              </Pressable>

              <Pressable
                onPress={() => router.push("/respiracion" as never)}
                style={({ pressed }) => [
                  styles.practiceToolCard,
                  { opacity: pressed ? 0.72 : 1 },
                ]}
                accessibilityRole="button"
                accessibilityLabel="Abrir Ejercicios de respiración"
              >
                <View style={[styles.practiceReminderIcon, styles.practiceToolIcon]}>
                  <MaterialCommunityIcons name="weather-windy" size={29} color="#57C785" />
                </View>
                <Text style={[styles.practiceReminderTitle, styles.practiceToolTitle, { color: colors.foreground }]}>
                  Ejercicios de respiración
                </Text>
                <Text style={[styles.practiceReminderSubtitle, styles.practiceToolSubtitle, { color: CARD_TEXT_BELOW }]}>
                  Vuelve al presente y tranquilízate
                </Text>
              </Pressable>
            </View>
            </>
            )}

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

      </KeyboardAwareScrollViewCompat>
      )}


      {!dedicated && <BibliotecaScreen embedded initialTab={initialLibraryTab} onHeaderActions={setLibActions} />}
      </View>

      {dedicated && (
        <ReflectionSavedBanner
          trigger={profileReflectionSavedTrigger}
          bottom={profileReflectionBannerBottom}
          onPress={() => router.push("/mi-espacio-interior")}
        />
      )}

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
                  <View style={[styles.fieldBox, { backgroundColor: "rgba(181,211,255,0.057)", borderWidth: 0 }]}>
                    <TextInput value={epSpecialties} onChangeText={setEpSpecialties} placeholder="Cuencos Tibetanos, Yoga" placeholderTextColor={colors.mutedForeground} style={[styles.fieldInput, { color: colors.foreground }]} />
                  </View>
                </View>
                <View style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Descripción de servicios</Text>
                  <View style={[styles.fieldBox, { backgroundColor: "rgba(181,211,255,0.057)", borderWidth: 0, minHeight: 90, alignItems: "flex-start" }]}>
                    <TextInput value={epDescription} onChangeText={setEpDescription} placeholder="Describe lo que ofrecés..." placeholderTextColor={colors.mutedForeground} style={[styles.fieldInput, { color: colors.foreground, textAlignVertical: "top", paddingTop: 2 }]} multiline numberOfLines={4} />
                  </View>
                </View>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <View style={[styles.fieldWrap, { flex: 1 }]}>
                    <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Teléfono</Text>
                    <View style={[styles.fieldBox, { backgroundColor: "rgba(181,211,255,0.057)", borderWidth: 0 }]}>
                      <Feather name="phone" size={15} color={colors.mutedForeground} />
                      <TextInput value={epPhone} onChangeText={setEpPhone} placeholder="+54 11 1234" placeholderTextColor={colors.mutedForeground} style={[styles.fieldInput, { color: colors.foreground }]} keyboardType="phone-pad" />
                    </View>
                  </View>
                  <View style={[styles.fieldWrap, { flex: 1 }]}>
                    <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Email</Text>
                    <View style={[styles.fieldBox, { backgroundColor: "rgba(181,211,255,0.057)", borderWidth: 0 }]}>
                      <Feather name="mail" size={15} color={colors.mutedForeground} />
                      <TextInput value={epEmail} onChangeText={setEpEmail} placeholder="tu@email.com" placeholderTextColor={colors.mutedForeground} style={[styles.fieldInput, { color: colors.foreground }]} keyboardType="email-address" autoCapitalize="none" />
                    </View>
                  </View>
                </View>
                <View style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Instagram (URL)</Text>
                  <View style={[styles.fieldBox, { backgroundColor: "rgba(181,211,255,0.057)", borderWidth: 0 }]}>
                    <Feather name="instagram" size={15} color={colors.mutedForeground} />
                    <TextInput value={epInstagram} onChangeText={setEpInstagram} placeholder="https://instagram.com/tu_usuario" placeholderTextColor={colors.mutedForeground} style={[styles.fieldInput, { color: colors.foreground }]} autoCapitalize="none" />
                  </View>
                </View>
                <View style={styles.fieldWrap}>
                  <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>Frase / Quote</Text>
                  <View style={[styles.fieldBox, { backgroundColor: "rgba(181,211,255,0.057)", borderWidth: 0 }]}>
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

      {dedicated && (
        <GrowthJourneySheet visible={growthJourneyOpen} onClose={() => setGrowthJourneyOpen(false)} />
      )}
      {dedicated && (
        <StreakInfoSheet visible={streakInfoOpen} onClose={() => setStreakInfoOpen(false)} />
      )}
      {SHOW_PROFILE_PRACTICE_CARDS && (
      <>
      <SleepReminderSheet
        variant="morning"
        visible={morningReminderVisible}
        onClose={() => setMorningReminderVisible(false)}
        onSaved={() => {}}
      />

      <SleepReminderSheet
        visible={sleepReminderVisible}
        onClose={() => setSleepReminderVisible(false)}
        onSaved={() => {}}
      />
      </>
      )}
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
  profileCarouselDivider: {
    height: StyleSheet.hairlineWidth,
    marginTop: 26,
    backgroundColor: "rgba(255,255,255,0.12)",
  },
  profileCarouselAfterDivider: {
    marginTop: 26,
  },
  profileMeditationCarouselDivider: {
    marginHorizontal: 16,
  },
  root: { flex: 1 },
  contentShift: {
    flex: 1,
    transform: [{ translateY: -5 }],
  },
  scroll: { flex: 1 },

  pageTitle: { fontFamily: "Manrope", fontSize: 28, fontWeight: "800", letterSpacing: 0.5 },

  // ── Sticky header (Panel/Biblioteca/Historial/Registros) ──────────────────
  stickyHeader: {
    zIndex: 10,
    backgroundColor: "transparent",
  },
  profileStickyHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.07)",
  },
  profileStickyHeaderRow: {
    position: "relative",
    minHeight: 54,
    alignItems: "flex-start",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingTop: 7,
    paddingBottom: 6,
  },
  profileStickyHeaderActions: {
    position: "absolute",
    right: 16,
    top: 7,
  },
  profileStickyHeaderTitleGroup: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 7,
    height: 43,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
  },
  profileStickyHeaderTitle: {
    fontFamily: "Manrope",
    fontSize: 18,
    lineHeight: 21,
    fontWeight: "700",
    letterSpacing: 0.2,
    textAlign: "center",
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
    paddingHorizontal: 20,
    paddingBottom: 6,
  },
  gearBtn: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    transform: [{ translateX: 1 }],
    borderWidth: 0,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  profileHeaderActions: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: "auto",
    gap: 8,
    transform: [{ translateY: -3 }],
  },
  giftIcon: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    marginRight: 3,
    marginTop: 1,
  },
  stickyTitle: { fontFamily: "Manrope", fontSize: 18, fontWeight: "800", color: "#F4F4F4", letterSpacing: 0.3, flex: 1, textAlign: "center", marginLeft: -4, transform: [{ translateY: 4 }] },
  dedicatedTitleRow: {
    position: "relative",
    zIndex: 2,
    elevation: 2,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 7,
    paddingBottom: 10,
    paddingHorizontal: 16,
    marginHorizontal: -16,
  },
  profileSettingsSections: {
    marginTop: 12,
  },
  settingsScreenContent: {
    paddingTop: 24,
    paddingHorizontal: 16,
  },
  stickyTitleBiblioteca: { fontSize: 27, textAlign: "left", position: "absolute", left: 19, top: 25 },
  stickyTitleTab: { fontSize: 30, fontWeight: "800", textAlign: "left", flex: 1, marginLeft: 0, transform: [{ translateY: 3 }] },
  libraryTabHeaderRow: {
    minHeight: 48,
    paddingBottom: 6,
  },
  libraryMainHeaderShift: {
    transform: [{ translateY: 8 }],
  },
  libraryTabBackBtn: {
    width: 40,
    height: 40,
    backgroundColor: "rgba(0,0,0,0.16)",
    borderRadius: 20,
    borderWidth: 0,
    borderColor: "transparent",
    alignItems: "center",
    justifyContent: "center",
  },
  libraryTabBackHitArea: {
    position: "absolute",
    left: 8,
    top: -4,
    width: 48,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 20,
    elevation: 20,
  },
  stickyTitleLibraryTab: {
    fontFamily: "Manrope",
    fontSize: 18,
    lineHeight: 21,
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
    width: 43,
    height: 43,
    borderRadius: 21.5,
    borderWidth: 0,
    borderColor: "transparent",
    backgroundColor: "rgba(0,0,0,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  accountFormFlex: {
    flex: 1,
  },
  accountHeaderSpacer: { width: 43, height: 43 },
  accountForm: {
    paddingHorizontal: 16,
    paddingTop: 34,
    gap: 26,
  },
  accountAvatarButton: {
    alignSelf: "flex-start",
    position: "relative",
    marginBottom: 6,
  },
  accountAvatar: {
    width: 124,
    height: 124,
    borderRadius: 62,
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
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  accountPressed: {
    opacity: 0.75,
  },
  accountCoverModalRoot: { flex: 1 },
  accountCoverBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "#000000",
  },
  accountCoverBackdropClose: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "15%",
  },
  accountCoverSheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: "85%",
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    overflow: "hidden",
  },
  accountCoverHandle: {
    alignSelf: "center",
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.18)",
    marginTop: 10,
    marginBottom: 4,
  },
  accountCoverHeader: {
    minHeight: 63,
    paddingTop: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  accountCoverTitle: {
    flex: 1,
    fontFamily: "Manrope",
    color: "#F9F9F9",
    fontSize: 16,
    fontWeight: "700",
    textAlign: "center",
  },
  accountCoverPreviewSlot: {
    height: 170,
    marginTop: 10,
    flexShrink: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  accountCoverPreview: {
    width: 115.5,
    height: 115.5,
    borderRadius: 57.75,
  },
  accountCoverCloseButton: {
    position: "absolute",
    left: 0,
    top: 20,
    zIndex: 1,
    width: 43,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21.5,
    borderWidth: 0,
  },
  accountCoverUploadButton: {
    position: "absolute",
    right: 0,
    top: 20,
    zIndex: 1,
    width: 43,
    height: 43,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 21.5,
    borderWidth: 0,
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  accountCoverCelebrationButton: {
    position: "absolute",
    left: 53,
    top: 20,
    zIndex: 1,
    width: 43,
    height: 43,
    borderRadius: 21.5,
    alignItems: "center",
    justifyContent: "center",
  },
  accountCoverPresetGrid: {
    flex: 1,
  },
  accountCoverPresetGridContent: {
    paddingTop: 26,
    paddingBottom: 20,
  },
  accountCoverPresetGridContentFiltered: {
    paddingTop: 20,
  },
  accountAvatarCategoryRow: {
    height: 39,
    alignItems: "flex-end",
    justifyContent: "flex-end",
  },
  accountAvatarCategoryAnchor: {
    alignSelf: "flex-end",
    justifyContent: "flex-end",
    paddingBottom: 15,
    minHeight: 44,
    minWidth: 44,
    zIndex: 21,
  },
  accountAvatarCategoryEmpty: {
    alignItems: "flex-start",
    gap: 14,
    paddingTop: 12,
  },
  accountAvatarCategoryEmptyText: {
    color: "rgba(249,249,249,0.82)",
    fontSize: 15,
    fontFamily: "Inter_400Regular",
  },
  accountAvatarCategoryEmptyButton: {
    height: 36,
    paddingHorizontal: 16,
    borderRadius: 18,
    justifyContent: "center",
  },
  accountAvatarCategoryEmptyButtonText: {
    color: "#F9F9F9",
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  accountCoverPresetGridRow: {
    justifyContent: "space-between",
    marginBottom: 12,
  },
  accountCoverPresetFrame: {
    width: 63,
    height: 63,
    borderRadius: 31.5,
    borderWidth: 2,
    borderColor: "transparent",
    padding: 2,
  },
  accountCoverPresetFrameSelected: {
    borderColor: "#F9F9F9",
  },
  accountAvatarLockedOverlay: {
    top: 4,
    bottom: 4,
    left: 4,
    right: 4,
    borderRadius: 27.5,
    backgroundColor: "rgba(255,255,255,0.4)",
    alignItems: "center",
    justifyContent: "center",
  },
  accountCoverPresetPhoto: {
    flex: 1,
    borderRadius: 27.5,
    overflow: "hidden",
  },
  accountField: {
    gap: 8,
  },
  accountFieldLabel: {
    fontFamily: "Manrope630",
    fontSize: 15,
    color: "#AAAAC4",
  },
  accountFieldValueBox: {
    backgroundColor: "rgba(0,0,0,0.16)",
    height: 48,
    borderRadius: 17,
    paddingHorizontal: 14,
    justifyContent: "center",
  },
  accountFieldValue: {
    fontFamily: "Manrope",
    fontSize: 15,
    minHeight: 24,
  },
  accountNameInput: {
    fontFamily: "Manrope",
    fontSize: 15,
    height: 48,
    paddingHorizontal: 14,
    paddingVertical: 0,
    backgroundColor: "rgba(0,0,0,0.16)",
    borderRadius: 17,
    borderWidth: 0,
  },
  accountDescriptionInput: { height: 122, paddingVertical: 12, lineHeight: 22 },
  accountSaveButton: {
    height: 43,
    paddingHorizontal: 18,
    marginLeft: "auto",
    borderRadius: 999,
    backgroundColor: "#F9F9F9",
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  accountSaveButtonDisabled: {
    backgroundColor: "rgba(249,249,249,0.4)",
  },
  accountSaveButtonPressed: {
    opacity: 0.86,
  },
  accountSaveButtonText: {
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
    color: "#060A0F",
  },
  accountSaveButtonTextDisabled: {
    color: "rgba(249,249,249,0.8)",
  },
  accountDeleteButton: {
    alignSelf: "center",
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginTop: -8,
    borderRadius: 999,
  },
  accountDeleteButtonText: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "700",
    color: "#E58B8B",
  },
  libActionsPill: {
    position: "absolute",
    right: 12,
    top: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    height: 43,
    marginRight: 0,
    marginTop: 0,
    borderRadius: 100,
  },
  libActionBtn: {
    width: 43,
    height: 43,
    backgroundColor: "rgba(0,0,0,0.16)",
    borderRadius: 21.5,
    borderWidth: 0,
    borderColor: "transparent",
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
    backgroundColor: "rgba(181,211,255,0.057)",
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
  registrosCard: {
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "rgba(0,0,0,0.16)",
  },
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
    borderRadius: 19,
    paddingTop: 20,
    paddingBottom: PROFILE_CARD_BOTTOM_PADDING,
    alignItems: "stretch",
    marginTop: 15,
    marginBottom: PROFILE_SECTION_GAP,
    gap: 0,
  },
  // Desplazar el bloque en el flujo para que las secciones siguientes lo acompañen.
  dedicatedProfileCard: { marginTop: 1 - 35 - 8 - 15 },
  // 20 px de padding inferior + 5 px de separación = 25 px hasta el fondo semanal.
  profileIdentityPreviewCard: { marginBottom: 5 },
  wisdomSection: {
    marginBottom: 28,
  },
  wisdomSectionTitle: {
    fontFamily: "Manrope",
    fontSize: 17,
    fontWeight: "700",
    marginBottom: 17,
  },
  profileIdentityRow: {
    flexDirection: "column",
    alignItems: "flex-start",
    width: "100%",
    gap: 7,
    paddingLeft: 3,
    paddingRight: 0,
  },
  profileDetails: { width: "100%", minWidth: 0, alignItems: "flex-start", gap: 6, marginTop: 5 },
  profileBiography: { width: "100%", alignItems: "flex-start", gap: 6, marginTop: 7 },
  avatarWrapper: { position: "relative", marginTop: 3, marginBottom: 0, flexShrink: 0 },
  avatarPremiumBadge: {
    position: "absolute",
    right: 0,
    bottom: 0,
    zIndex: 1,
    width: 32,
    height: 32,
    borderRadius: 16,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarCircle: {
    width: 124,
    height: 124,
    borderRadius: 62,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 124,
    height: 124,
    borderRadius: 62,
  },
  userName: { fontFamily: "Manrope", fontSize: 29, fontWeight: "700", textAlign: "left", marginTop: 0 },
  profileLifeMotto: { fontFamily: "Manrope", fontSize: 18, fontWeight: "700", lineHeight: 27, textAlign: "left", alignSelf: "stretch", marginTop: 7 },
  profileNameRow: { width: "100%", flexDirection: "row", alignItems: "center" },
  profileNameText: { flex: 1, minWidth: 0 },
  profileDescription: { fontFamily: "Manrope", fontSize: 13, lineHeight: 20, color: "#C4C4C4", textAlign: "left", alignSelf: "stretch" },
  locationRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 4 },
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
  planCard: { borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14, flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 10, backgroundColor: "rgba(0,0,0,0.16)" },
  planIconWrap: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  planTitle: { fontFamily: "Manrope", fontSize: 15, fontWeight: "700", marginBottom: 2 },
  planSub: { fontFamily: "Manrope", fontSize: 12 },
  planMejorar: { flexDirection: "row", alignItems: "center", gap: 2 },
  planMejorarText: { fontFamily: "Manrope", fontSize: 14, fontWeight: "700" },

  // Ajustar el margen en el flujo desplaza también todas las secciones posteriores.
  profileProgressSection: {
    marginTop: 2 - 15 + 10 - 6,
    marginBottom: PROFILE_SECTION_GAP,
  },
  practiceReminderSection: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.16)",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  practiceReminderFirst: {
    marginTop: -7,
    marginBottom: 25,
  },
  practiceReminderMiddle: {
    marginBottom: 25,
  },
  practiceToolsRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 53,
  },
  practiceToolCard: {
    flex: 1,
    minHeight: 178,
    paddingHorizontal: 12,
    paddingVertical: 18,
    borderRadius: 19,
    backgroundColor: "rgba(0,0,0,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
  practiceToolIcon: {
    marginRight: 0,
    marginBottom: 12,
  },
  practiceToolTitle: {
    textAlign: "center",
    lineHeight: 19,
  },
  practiceToolSubtitle: {
    marginTop: 6,
    textAlign: "center",
    lineHeight: 17,
  },
  practiceReminderIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  practiceReminderCopy: {
    flex: 1,
    gap: 5,
    transform: [{ translateY: -2 }],
  },
  practiceReminderTitle: {
    fontFamily: "Manrope",
    fontSize: 14,
    fontWeight: "600",
  },
  practiceReminderSubtitle: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "500",
  },
  profileProgressIntro: {
    paddingTop: 10,
    marginBottom: 12,
  },
  profileProgressIntroTitle: {
    fontFamily: "Manrope",
    fontSize: 17,
    fontWeight: "700",
  },
  profileProgressCard: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(0,0,0,0.16)",
    paddingHorizontal: 16,
    paddingTop: 17,
    paddingBottom: 16,
  },
  profileProgressHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 18,
  },
  profileProgressLotus: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  profileProgressCopy: {
    flex: 1,
    minWidth: 0,
  },
  profileProgressHeadline: {
    fontFamily: "Manrope",
    fontSize: 17,
    fontWeight: "700",
  },
  profileProgressSubtitle: {
    fontFamily: "Manrope",
    fontSize: 12,
    lineHeight: 17,
    fontWeight: "400",
    marginTop: 2,
  },
  profileNotificationsSection: {
    marginBottom: 53,
  },
  profileNotificationsCard: {
    minHeight: 66,
    borderRadius: 17,
    backgroundColor: "rgba(0,0,0,0.16)",
    paddingHorizontal: 15,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
  },
  profileNotificationsIcon: {
    width: 32,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 11,
  },
  profileNotificationsCopy: {
    flex: 1,
    minWidth: 0,
  },
  profileNotificationsLabel: {
    fontFamily: "Manrope",
    fontSize: 15.5,
    lineHeight: 21,
    fontWeight: "600",
  },
  profileNotificationsDescription: {
    fontFamily: "Manrope",
    fontSize: 12,
    lineHeight: 17,
  },

  // Estadísticas personales
  personalStatsSection: {
    borderRadius: 17,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
    backgroundColor: "rgba(0,0,0,0.16)",
    padding: 16,
    marginTop: 12,
    marginBottom: 12,
  },
  personalStatsHeader: {
    gap: 7,
  },
  personalStatsTitle: {
    fontFamily: "Manrope",
    fontSize: 17,
    fontWeight: "700",
  },
  personalStatsRangeDropdown: {
    position: "relative",
    alignSelf: "flex-start",
    marginTop: 2,
    zIndex: 2,
  },
  personalStatsRangeTrigger: {
    minHeight: 28,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  personalStatsRangeLabel: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "500",
  },
  personalStatsRangeMenu: {
    position: "absolute",
    top: 30,
    left: 0,
    width: 142,
    padding: 4,
    borderRadius: 10,
    borderWidth: 1,
    zIndex: 10,
    elevation: 10,
  },
  personalStatsRangeOption: {
    minHeight: 34,
    borderRadius: 7,
    paddingHorizontal: 10,
    justifyContent: "center",
  },
  personalStatsRangeOptionText: {
    fontFamily: "Manrope",
    fontSize: 12,
    fontWeight: "500",
  },
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
  statsFilterOption: {
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  statsFilterOptionSelected: {
    backgroundColor: "rgba(152,93,212,0.16)",
  },
  statsFilterText: {
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "700",
  },
  personalStatsValues: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 18,
  },
  personalStatsValuesNoTitle: {
    marginTop: 0,
  },
  personalStatItem: {
    flex: 1,
    minWidth: 0,
    minHeight: 46,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  personalStatIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  personalStatCopy: {
    flex: 1,
    minWidth: 0,
  },
  personalStatDivider: {
    width: 1,
    height: 42,
    marginHorizontal: 10,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  personalStatValue: {
    fontFamily: "Manrope",
    fontSize: 22,
    fontWeight: "600",
  },
  personalStatLabel: {
    fontFamily: "Manrope",
    fontSize: 10,
    lineHeight: 14,
    letterSpacing: 0.35,
    marginTop: 2,
  },
  // Membresía
  membershipRow: {
    borderRadius: 18,
    backgroundColor: "rgba(0,0,0,0.16)",
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
    backgroundColor: "rgba(0,0,0,0.16)",
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
    backgroundColor: "rgba(0,0,0,0.16)",
  },
  streakStatsDivider: {
    height: 1,
    width: "100%",
    marginVertical: 16,
    backgroundColor: "rgba(255,255,255,0.07)",
  },
  profileStreakRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  profileStreakDayWrapper: {
    alignItems: "center",
    gap: 6,
  },
  profileStreakDay: {
    width: 37,
    height: 37,
    borderRadius: 18.5,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  profileStreakDayActive: {
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.45)",
  },
  profileStreakDayLabel: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 11,
    fontWeight: "500",
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
    backgroundColor: "rgba(0,0,0,0.16)",
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
  dvGalleryCell: { borderRadius: 10, backgroundColor: "rgba(181,211,255,0.057)" },
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
    backgroundColor: "rgba(0,0,0,0.16)", alignItems: "center", justifyContent: "center",
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

});
