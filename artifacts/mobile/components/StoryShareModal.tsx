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
  useWindowDimensions,
  View,
} from "react-native";
import { Feather, FontAwesome } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ViewShot, { releaseCapture } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as Font from "expo-font";

export const STORY_WIDTH = 1080;
export const STORY_HEIGHT = 1920;
const INSTAGRAM_SOURCE_APP = process.env.EXPO_PUBLIC_META_APP_ID?.trim();

export interface StoryShareModalProps {
  title?: string;
  onClose: () => void;
  renderArtwork: (width: number, isExport: boolean, callbacks: { onReady?: () => void, onFailure?: () => void, onLogoReady?: () => void }) => React.ReactNode;
  makeWebImage?: () => Promise<Blob>;
  checkConstraints?: () => void;
  captureKey?: string;
  assetKey?: string;
  requiresLogo?: boolean;
  showGenericShare?: boolean;
  previewScale?: number;
  previewOffsetY?: number;
  closeOnLeft?: boolean;
  headerRightAction?: React.ReactNode;
  titleFontSize?: number;
  titleOffsetY?: number;
  headerControlsOffsetY?: number;
  lightInstagramButton?: boolean;
  compactFooter?: boolean;
  children?: React.ReactNode;
}

export function StoryShareModal({
  title = "Compartir",
  onClose,
  renderArtwork,
  makeWebImage,
  checkConstraints,
  captureKey = "default",
  assetKey,
  requiresLogo = false,
  showGenericShare = true,
  previewScale = 1,
  previewOffsetY = 0,
  closeOnLeft = false,
  headerRightAction,
  titleFontSize,
  titleOffsetY = 0,
  headerControlsOffsetY = 0,
  lightInstagramButton = false,
  compactFooter = false,
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
  const previewWidth = Math.min(width - 72, Math.max(220, (height - reservedHeight) * 9 / 16)) * previewScale;
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

  const openInstagramStories = async () => {
    setBusy("instagram");
    setError(null);
    try {
      if (!INSTAGRAM_SOURCE_APP || !/^\d+$/.test(INSTAGRAM_SOURCE_APP)) {
        throw new Error("Meta App ID missing");
      }
      const { default: Share } = await import("react-native-share");
      const instagramInstalled = Platform.OS === "ios"
        ? await Linking.canOpenURL("instagram-stories://share")
        : (await Share.isPackageInstalled("com.instagram.android")).isInstalled;
      if (!instagramInstalled) throw new Error("Instagram is not installed");
      await ensureImage();
      if (!uri.current) throw new Error("No se pudo preparar la imagen para Instagram.");
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

  return (
    <Modal transparent={false} animationType="slide" onRequestClose={onClose}>
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
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                headerControlsOffsetY !== 0 && { transform: [{ translateY: headerControlsOffsetY }] },
                pressed && styles.pressed,
              ]}
            >
              <Feather name="x" size={25} color="#F9F9F9" />
            </Pressable>
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
              style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
            >
              <Feather name="x" size={25} color="#F9F9F9" />
            </Pressable>
          )}
        </View>

        <View
          style={[
            styles.previewArea,
            previewOffsetY !== 0 && { transform: [{ translateY: previewOffsetY }] },
          ]}
        >
          {renderArtwork(previewWidth, false, {
            onReady: () => undefined,
            onFailure: () => {
              setError("No se pudo cargar la vista previa. Elige otro fondo o vuelve a intentar.");
            },
            onLogoReady: () => undefined,
          })}
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
              (pressed || busy !== null) && styles.pressed,
            ]}
          >
            {busy === "instagram" ? (
              <ActivityIndicator color={lightInstagramButton ? "#141414" : "#F9F9F9"} />
            ) : (
              <>
                <FontAwesome name="instagram" size={23} color={lightInstagramButton ? "#141414" : "#F9F9F9"} />
                <Text style={[styles.actionText, lightInstagramButton && styles.actionTextDark]}>
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
                (pressed || busy !== null) && styles.pressed,
              ]}
            >
              {busy === "share" ? (
                <ActivityIndicator color="#F9F9F9" />
              ) : (
                <Text style={styles.actionText}>Compartir</Text>
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
    backgroundColor: "rgba(255,255,255,0.10)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.18)",
  },
  previewArea: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
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
  shareButton: {
    backgroundColor: "#8954EE",
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