import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Linking,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TurboModuleRegistry,
  useWindowDimensions,
  View,
  type StyleProp,
  type TextStyle,
} from "react-native";
import { Feather, FontAwesome } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ViewShot, { releaseCapture } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as Font from "expo-font";
import Animated, { useAnimatedStyle, useDerivedValue, useSharedValue, type SharedValue } from "react-native-reanimated";
import { fitReflectionPreviewWidth, reflectionPreviewLayout, REFLECTION_GALLERY_EXPANSION } from "@/lib/reflection-gallery-layout";

export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;
const INSTAGRAM_SOURCE_APP = process.env.EXPO_PUBLIC_META_APP_ID?.trim();

export interface StoryShareModalProps {
  title?: string;
  onClose: () => void;
  renderArtwork: (width: number, isExport: boolean, callbacks: { onReady?: () => void, onFailure?: () => void, onLogoReady?: () => void }, previewContext?: { displayScale: SharedValue<number> }) => React.ReactNode;
  previewHeightReduction?: SharedValue<number>;
  makeWebImage?: () => Promise<Blob>;
  checkConstraints?: () => void;
  onBeforeInstagramShare?: () => Promise<void>;
  captureKey?: string;
  assetKey?: string;
  requiresLogo?: boolean;
  showGenericShare?: boolean;
  previewScale?: number;
  previewOffsetY?: number;
  closeOnLeft?: boolean;
  headerLeftAction?: React.ReactNode;
  headerLeftActionGap?: number;
  headerRightAction?: React.ReactNode;
  titleFontSize?: number;
  titleOffsetY?: number;
  headerControlsOffsetY?: number;
  lightInstagramButton?: boolean;
  lightActionButtons?: boolean;
  compactFooter?: boolean;
  closeButtonBackgroundColor?: string;
  instagramActionTextStyle?: StyleProp<TextStyle>;
  embedded?: boolean;
  children?: React.ReactNode;
}

export function StoryShareModal({
  title = "Compartir",
  onClose,
  renderArtwork,
  makeWebImage,
  checkConstraints,
  onBeforeInstagramShare,
  captureKey = "default",
  assetKey,
  requiresLogo = false,
  showGenericShare = true,
  previewScale = 1,
  previewOffsetY = 0,
  previewHeightReduction,
  closeOnLeft = false,
  headerLeftAction,
  headerLeftActionGap = 8,
  headerRightAction,
  titleFontSize,
  titleOffsetY = 0,
  headerControlsOffsetY = 0,
  lightInstagramButton = false,
  lightActionButtons = false,
  compactFooter = false,
  closeButtonBackgroundColor,
  instagramActionTextStyle,
  embedded = false,
  children,
}: StoryShareModalProps) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const capture = useRef<ViewShot>(null);
  const [ready, setReady] = useState(false);
  const [logoReady, setLogoReady] = useState(false);
  const [laidOut, setLaidOut] = useState(false);
  const captureReady = useRef(false);
  const captureFailed = useRef(false);
  const preserveCaptureAfterShare = useRef(false);
  captureReady.current = ready && (!requiresLogo || logoReady) && laidOut;
  const [busy, setBusy] = useState<"instagram" | "share" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const file = useRef<File | null>(null);
  const uri = useRef<string | null>(null);
  const alive = useRef(true);
  const reservedHeight = children
    ? (showGenericShare ? 420 : 350)
    : (showGenericShare ? 320 : 250);
  const defaultPreviewWidth = Math.min(width - 72, Math.max(220, (height - reservedHeight) * 9 / 16)) * previewScale;
  const [previewAreaHeight, setPreviewAreaHeight] = useState<number | null>(null);
  const previewWidth = previewHeightReduction
    ? fitReflectionPreviewWidth(defaultPreviewWidth, previewAreaHeight)
    : defaultPreviewWidth;
  const noReduction = useSharedValue(0);
  const reduction = previewHeightReduction ?? noReduction;
  const displayScale = useDerivedValue(() => reflectionPreviewLayout(previewWidth, reduction.value).scale);
  const previewSizeStyle = useAnimatedStyle(() => ({
    width: previewWidth * displayScale.value,
    height: previewWidth * 16 / 9 * displayScale.value,
  }));
  const previewScaleStyle = useAnimatedStyle(() => ({
    transform: [{ scale: displayScale.value }],
  }));
  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  useEffect(() => () => {
    alive.current = false;
    file.current = null;
    if (uri.current) {
      const capturedUri = uri.current;
      if (preserveCaptureAfterShare.current) {
        setTimeout(() => releaseCapture(capturedUri), 60_000);
      } else {
        releaseCapture(capturedUri);
      }
    }
  }, []);

  const ensureImage = async () => {
    if (checkConstraints) checkConstraints();
    
    if (Platform.OS === "web") {
      if (!file.current) {
        if (!makeWebImage) throw new Error("La versión web no soporta esta función todavía.");
        const blob = await makeWebImage();
        if (!alive.current) throw new Error("La ventana se cerró.");
        file.current = new File([blob], `resonancia-historia.png`, { type: "image/png" });
      }
      return;
    }
    const started = Date.now();
    while (!captureReady.current || !Font.isLoaded("Manrope")) {
      if (!alive.current) throw new Error("La ventana se cerró.");
      if (captureFailed.current) throw new Error("No se pudo cargar la imagen. Cierra y vuelve a intentar.");
      if (Date.now() - started > 15000) {
        throw new Error("La imagen o la tipografía tardan demasiado en cargar. Vuelve a intentarlo.");
      }
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
    await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
    const result = await capture.current?.capture?.();
    if (!result) throw new Error("No se pudo capturar la imagen.");
    if (!alive.current) {
      releaseCapture(result);
      throw new Error("La ventana se cerró.");
    }
    uri.current = result;
  };

  useEffect(() => {
    file.current = null;
    if (uri.current) releaseCapture(uri.current);
    uri.current = null;
  }, [captureKey]);

  useEffect(() => {
    setReady(false);
    captureFailed.current = false;
  }, [assetKey ?? captureKey]);

  const shareGeneric = async () => {
    setBusy("share");
    setError(null);
    try {
      await ensureImage();
      if (Platform.OS === "web") {
        if (!file.current) throw new Error("No se pudo preparar la imagen.");
        if (navigator.canShare?.({ files: [file.current] })) {
          await navigator.share({ files: [file.current], title: "Historia · RESONANCIA" });
        } else {
          const url = URL.createObjectURL(file.current);
          const link = document.createElement("a");
          try {
            link.href = url;
            link.download = file.current.name;
            document.body.appendChild(link);
            link.click();
          } finally {
            link.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
          }
        }
      } else {
        if (!uri.current || !await Sharing.isAvailableAsync()) {
          throw new Error("Compartir imágenes no está disponible en este dispositivo.");
        }
        await Sharing.shareAsync(uri.current, {
          mimeType: "image/png",
          UTI: "public.png",
          dialogTitle: "Compartir historia",
        });
      }
    } catch (cause) {
      if (!(cause instanceof Error && cause.name === "AbortError")) {
        setError(cause instanceof Error ? cause.message : "No se pudo compartir la imagen.");
      }
    } finally {
      if (alive.current) setBusy(null);
    }
  };

  const shareCapturedImageWithSystem = async () => {
    if (!uri.current || !await Sharing.isAvailableAsync()) {
      throw new Error("Compartir imágenes no está disponible en este dispositivo.");
    }
    await Sharing.shareAsync(uri.current, {
      mimeType: "image/png",
      UTI: "public.png",
      dialogTitle: "Compartir historia",
    });
    preserveCaptureAfterShare.current = true;
    onClose();
  };

  const openInstagramStories = async () => {
    setBusy("instagram");
    setError(null);
    try {
      await ensureImage();
      if (!uri.current) throw new Error("No se pudo preparar la imagen para Instagram.");

      if (onBeforeInstagramShare) {
        await onBeforeInstagramShare();
      }

      if (
        !INSTAGRAM_SOURCE_APP
        || !/^\d+$/.test(INSTAGRAM_SOURCE_APP)
        || !TurboModuleRegistry.get("RNShare")
      ) {
        await shareCapturedImageWithSystem();
        return;
      }

      const { default: Share } = await import("react-native-share");
      const instagramInstalled = Platform.OS === "ios"
        ? await Linking.canOpenURL("instagram-stories://share")
        : (await Share.isPackageInstalled("com.instagram.android")).isInstalled;
      if (!instagramInstalled) throw new Error("Instagram is not installed");

      await Share.shareSingle({
        social: Share.Social.INSTAGRAM_STORIES as never,
        appId: INSTAGRAM_SOURCE_APP,
        backgroundImage: uri.current,
        type: "image/png",
      });
      preserveCaptureAfterShare.current = true;
      onClose();
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : String(cause);
      if (/not installed|not available|not found|No Activity/i.test(message)) {
        setError(showGenericShare
          ? "Instagram no está instalado. Puedes usar el botón Compartir."
          : "Instagram no está instalado en este dispositivo.");
      } else if (/Meta App ID missing/i.test(message)) {
        setError("Falta activar la conexión de RESONANCIA con Instagram.");
      } else if (/native module|TurboModule|RNShare/i.test(message)) {
        setError("El acceso directo a Instagram estará disponible después de actualizar la app.");
      } else {
        setError(showGenericShare
          ? "No se pudo abrir Instagram. Puedes usar el botón Compartir."
          : "No se pudo abrir Instagram. Vuelve a intentarlo.");
      }
    } finally {
      if (alive.current) setBusy(null);
    }
  };

  const confirmInstagram = () => {
    if (Platform.OS === "web") {
      setError("Instagram Stories solo está disponible desde la app móvil.");
      return;
    }
    Alert.alert(
      "Abrir Instagram",
      "Se abrirá Instagram con esta imagen lista en el editor de historias.",
      [
        { text: "Cancelar", style: "cancel" },
        { text: "Abrir", onPress: () => void openInstagramStories() },
      ],
    );
  };

  const previewCallbacks = {
    onReady: () => undefined,
    onFailure: () => setError("No se pudo cargar la vista previa. Elige otro fondo o vuelve a intentar."),
    onLogoReady: () => undefined,
  };
  const content = (
    <View
        style={[
          styles.container,
          {
            paddingTop: topInset + 8,
            paddingBottom: Math.max(bottomInset, 16) + 8,
          },
        ]}
      >
        <View style={styles.header}>
          {closeOnLeft ? (
            <View
              style={[
                styles.headerLeft,
                { gap: headerLeftActionGap },
                headerControlsOffsetY !== 0 && { transform: [{ translateY: headerControlsOffsetY }] },
              ]}
            >
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Cerrar"
                onPress={onClose}
                style={({ pressed }) => [
                  styles.closeButton,
                  closeButtonBackgroundColor && { backgroundColor: closeButtonBackgroundColor },
                  pressed && styles.pressed,
                ]}
              >
                <Feather name="x" size={25} color="#F9F9F9" />
              </Pressable>
              {headerLeftAction}
            </View>
          ) : (
            <View style={styles.headerSpacer} />
          )}
          <Text
            pointerEvents="none"
            style={[
              styles.title,
              titleFontSize !== undefined && { fontSize: titleFontSize },
              titleOffsetY !== 0 && { transform: [{ translateY: titleOffsetY }] },
            ]}
          >
            {title}
          </Text>
          {closeOnLeft ? (
            <View
              style={[
                styles.headerRight,
                headerControlsOffsetY !== 0 && { transform: [{ translateY: headerControlsOffsetY }] },
              ]}
            >
              {headerRightAction}
            </View>
          ) : (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                closeButtonBackgroundColor && { backgroundColor: closeButtonBackgroundColor },
                pressed && styles.pressed,
              ]}
            >
              <Feather name="x" size={25} color="#F9F9F9" />
            </Pressable>
          )}
        </View>

        <View
          onLayout={previewHeightReduction ? event => {
            const extra = previewHeightReduction.value;
            // Measure only at rest, never set React state on every animation frame.
            if (extra !== 0 && extra !== REFLECTION_GALLERY_EXPANSION) return;
            const baselineHeight = event.nativeEvent.layout.height + extra;
            setPreviewAreaHeight(current => current === null || Math.abs(current - baselineHeight) > 1 ? baselineHeight : current);
          } : undefined}
          style={[
            styles.previewArea,
            previewOffsetY !== 0 && { transform: [{ translateY: previewOffsetY }] },
          ]}
        >
          {previewHeightReduction ? (
            <Animated.View style={[styles.previewSizeFrame, previewSizeStyle]}>
              <Animated.View style={[{ width: previewWidth, height: previewWidth * 16 / 9 }, previewScaleStyle]}>
                {renderArtwork(previewWidth, false, previewCallbacks, { displayScale })}
              </Animated.View>
            </Animated.View>
          ) : renderArtwork(previewWidth, false, previewCallbacks)}
        </View>

        {children}

        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Compartir en tus historias de Instagram"
            disabled={busy !== null}
            onPress={confirmInstagram}
            style={({ pressed }) => [
              styles.actionButton,
              compactFooter && styles.actionButtonCompact,
              styles.instagramButton,
              lightInstagramButton && styles.instagramButtonLight,
              lightActionButtons && styles.instagramButtonSoftLight,
              (pressed || busy !== null) && styles.pressed,
            ]}
          >
            {busy === "instagram" ? (
              <ActivityIndicator color={lightInstagramButton || lightActionButtons ? "#303030" : "#F9F9F9"} />
            ) : (
              <>
                <FontAwesome
                  name="instagram"
                  size={23}
                  color={lightInstagramButton || lightActionButtons ? "#303030" : "#F9F9F9"}
                />
                <Text
                  style={[
                    styles.actionText,
                    lightInstagramButton && styles.actionTextDark,
                    lightActionButtons && styles.actionTextSoftDark,
                    instagramActionTextStyle,
                  ]}
                >
                  Compartir en tus historias
                </Text>
              </>
            )}
          </Pressable>
          {showGenericShare && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Compartir imagen"
              disabled={busy !== null}
              onPress={() => void shareGeneric()}
              style={({ pressed }) => [
                styles.actionButton,
                compactFooter && styles.actionButtonCompact,
                styles.shareButton,
                lightActionButtons && styles.shareButtonLight,
                (pressed || busy !== null) && styles.pressed,
              ]}
            >
              {busy === "share" ? (
                <ActivityIndicator color={lightActionButtons ? "#303030" : "#F9F9F9"} />
              ) : (
                <Text style={[styles.actionText, lightActionButtons && styles.actionTextSoftDark]}>
                  Compartir
                </Text>
              )}
            </Pressable>
          )}
        </View>

        {Platform.OS !== "web" && (
          <View pointerEvents="none" style={styles.captureStage}>
            <ViewShot
              ref={capture}
              options={{
                format: "png",
                result: "tmpfile",
                width: STORY_WIDTH,
                height: STORY_HEIGHT,
                quality: 1,
              }}
            >
              {renderArtwork(STORY_WIDTH, true, {
                onReady: () => {
                  captureFailed.current = false;
                  setReady(true);
                },
                onFailure: () => {
                  captureFailed.current = true;
                  setReady(false);
                  setError("No se pudo cargar la imagen. Cierra y vuelve a intentar.");
                },
                onLogoReady: () => setLogoReady(true),
              })}
              <View onLayout={() => setLaidOut(true)} style={styles.captureLayoutProbe} />
            </ViewShot>
          </View>
        )}
    </View>
  );

  if (embedded) return content;

  return (
    <Modal transparent={false} animationType="slide" onRequestClose={onClose}>
      {content}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#171719",
    paddingHorizontal: 20,
  },
  header: {
    height: 54,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    position: "relative",
  },
  headerSpacer: {
    width: 43,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    zIndex: 1,
  },
  title: {
    position: "absolute",
    left: 50,
    right: 50,
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  headerRight: {
    minWidth: 43,
    alignItems: "flex-end",
  },
  closeButton: {
    width: 43,
    height: 43,
    borderRadius: 21.5,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(0,0,0,0.16)",
    borderWidth: 0,
    borderColor: "transparent",
  },
  previewArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  previewSizeFrame: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  error: {
    color: "#FFB9B2",
    fontFamily: "Manrope",
    fontSize: 12,
    lineHeight: 17,
    textAlign: "center",
    marginBottom: 10,
    paddingHorizontal: 14,
  },
  actions: {
    gap: 10,
  },
  actionButton: {
    minHeight: 58,
    borderRadius: 29,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  actionButtonCompact: {
    minHeight: 52,
  },
  instagramButton: {
    backgroundColor: "#6737C8",
  },
  instagramButtonLight: {
    backgroundColor: "#F9F9F9",
  },
  instagramButtonSoftLight: {
    backgroundColor: "#E5E5E5",
  },
  shareButton: {
    backgroundColor: "#8954EE",
  },
  shareButtonLight: {
    backgroundColor: "#F9F9F9",
  },
  actionText: {
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 16,
    fontWeight: "700",
  },
  actionTextDark: {
    color: "#141414",
  },
  actionTextSoftDark: {
    color: "#303030",
  },
  pressed: {
    opacity: 0.62,
  },
  captureStage: {
    position: "absolute",
    left: -2400,
    top: 0,
    width: STORY_WIDTH,
    height: STORY_HEIGHT,
  },
  captureLayoutProbe: {
    position: "absolute",
    width: 1,
    height: 1,
  },
});