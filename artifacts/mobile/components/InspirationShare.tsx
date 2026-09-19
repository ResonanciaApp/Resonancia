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
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ViewShot, { releaseCapture } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as Font from "expo-font";

import { InspirationArtwork } from "./InspirationArtwork";
import type { InspirationDay } from "@/types/inspiration";

const STORY_WIDTH = 1080;
const STORY_HEIGHT = 1920;
const INSTAGRAM_SOURCE_APP = process.env.EXPO_PUBLIC_META_APP_ID?.trim();
const WORDMARK = require("@/assets/images/logo-resonancia-new.png");

async function loadWebImage(source: string): Promise<HTMLImageElement> {
  const image = new window.Image();
  image.crossOrigin = "anonymous";
  image.src = source;
  await image.decode();
  return image;
}

function wrappedLines(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const lines: string[] = [];
  for (const paragraph of text.split("\n")) {
    let line = "";
    for (const word of paragraph.trim().split(/\s+/)) {
      if (context.measureText(word).width > maxWidth) {
        if (line) {
          lines.push(line);
          line = "";
        }
        let chunk = "";
        for (const character of word) {
          if (chunk && context.measureText(chunk + character).width > maxWidth) {
            lines.push(chunk);
            chunk = character;
          } else {
            chunk += character;
          }
        }
        line = chunk;
        continue;
      }
      const candidate = line ? `${line} ${word}` : word;
      if (line && context.measureText(candidate).width > maxWidth) {
        lines.push(line);
        line = word;
      } else {
        line = candidate;
      }
    }
    if (line) lines.push(line);
  }
  return lines;
}

async function makeWebImage(day: InspirationDay): Promise<Blob> {
  const content = day.content!;
  await document.fonts.ready;
  await document.fonts.load("700 56px Manrope");
  if (!Font.isLoaded("Manrope")) {
    throw new Error("La tipografía aún no está lista. Vuelve a intentarlo.");
  }
  const image = await loadWebImage(content.imageUrl);
  const canvas = document.createElement("canvas");
  canvas.width = STORY_WIDTH;
  canvas.height = STORY_HEIGHT;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Tu navegador no permite generar la imagen.");

  const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
  const imageWidth = image.naturalWidth * scale;
  const imageHeight = image.naturalHeight * scale;
  const availableX = canvas.width - imageWidth;
  const availableY = canvas.height - imageHeight;
  context.drawImage(
    image,
    availableX * content.imagePositionX / 100,
    availableY * content.imagePositionY / 100,
    imageWidth,
    imageHeight,
  );
  context.fillStyle = `rgba(0,0,0,${Math.max(content.overlayOpacity, 0.28)})`;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const quoteSize = content.quote.length > 360 ? 42 : content.quote.length > 220 ? 48 : 56;
  context.fillStyle = "#F9F9F9";
  context.font = `700 ${quoteSize}px Manrope`;
  context.textAlign = "center";
  context.textBaseline = "middle";
  const lines = wrappedLines(context, content.quote, 820);
  if (lines.length > 12) {
    throw new Error("La frase es demasiado larga para una historia sin recortarse.");
  }
  const lineHeight = Math.round(quoteSize * 1.32);
  const startY = 920 - ((lines.length - 1) * lineHeight) / 2;
  lines.forEach((line, index) => context.fillText(line, canvas.width / 2, startY + index * lineHeight));

  context.font = "600 34px Manrope";
  context.letterSpacing = "9px";
  context.fillText("RESONANCIA", canvas.width / 2, 1660);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("No se pudo generar el archivo PNG.")),
      "image/png",
    );
  });
}

function StoryArtwork({
  day,
  width,
  onReady,
  onFailure,
  onLogoReady,
}: {
  day: InspirationDay;
  width: number;
  onReady?: () => void;
  onFailure?: () => void;
  onLogoReady?: () => void;
}) {
  const content = day.content!;
  const exportScale = width / STORY_WIDTH;
  const isExport = width === STORY_WIDTH;
  return (
    <View
      style={[
        styles.storyArtwork,
        {
          width,
          height: width * 16 / 9,
          borderRadius: isExport ? 0 : 22,
        },
      ]}
    >
      <InspirationArtwork content={content} onReady={onReady} onFailure={onFailure} />
      <View pointerEvents="none" style={styles.storyShade} />
      <View
        pointerEvents="none"
        style={[
          styles.storyQuoteRegion,
          {
            top: 500 * exportScale,
            bottom: 500 * exportScale,
            paddingHorizontal: 120 * exportScale,
          },
        ]}
      >
        <Text
          numberOfLines={12}
          adjustsFontSizeToFit
          minimumFontScale={0.42}
          style={[
            styles.storyQuote,
            {
              fontSize: 60 * exportScale,
              lineHeight: 78 * exportScale,
            },
          ]}
        >
          {content.quote}
        </Text>
      </View>
      <Image
        source={WORDMARK}
        contentFit="contain"
        onDisplay={onLogoReady}
        style={[
          styles.storyLogo,
          {
            width: isExport ? 540 : width * 0.57,
            height: isExport ? 150 : width * 0.16,
            bottom: isExport ? 178 : width * 0.11,
          },
        ]}
      />
    </View>
  );
}

/** Dedicated capture contains only public editorial artwork, the daily quote and RESONANCIA branding. */
export function InspirationShare({ day, onClose }: { day: InspirationDay; onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const capture = useRef<ViewShot>(null);
  const [ready, setReady] = useState(false);
  const [logoReady, setLogoReady] = useState(false);
  const [laidOut, setLaidOut] = useState(false);
  const captureReady = useRef(false);
  const captureFailed = useRef(false);
  const preserveCaptureAfterShare = useRef(false);
  captureReady.current = ready && logoReady && laidOut;
  const [busy, setBusy] = useState<"instagram" | "share" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const file = useRef<File | null>(null);
  const uri = useRef<string | null>(null);
  const alive = useRef(true);
  const previewWidth = Math.min(width - 72, Math.max(220, (height - 320) * 9 / 16));
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
    if (day.content!.quote.trim().length > 520) {
      throw new Error("La frase es demasiado larga para una historia sin recortarse.");
    }
    if (Platform.OS === "web") {
      if (!file.current) {
        const blob = await makeWebImage(day);
        if (!alive.current) throw new Error("La ventana se cerró.");
        file.current = new File([blob], `resonancia-${day.date}.png`, { type: "image/png" });
      }
      return;
    }
    if (uri.current) return;
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

  const shareGeneric = async () => {
    setBusy("share");
    setError(null);
    try {
      await ensureImage();
      if (Platform.OS === "web") {
        if (!file.current) throw new Error("No se pudo preparar la imagen.");
        if (navigator.canShare?.({ files: [file.current] })) {
          await navigator.share({ files: [file.current], title: "Sabiduría diaria · RESONANCIA" });
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
          dialogTitle: "Compartir Sabiduría diaria",
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
        setError("Instagram no está instalado. Puedes usar el botón Compartir.");
      } else if (/Meta App ID missing/i.test(message)) {
        setError("Falta activar la conexión de RESONANCIA con Instagram.");
      } else if (/native module|TurboModule|RNShare/i.test(message)) {
        setError("El acceso directo a Instagram estará disponible después de actualizar la app.");
      } else {
        setError("No se pudo abrir Instagram. Puedes usar el botón Compartir.");
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
          <View style={styles.headerSpacer} />
          <Text style={styles.title}>Compartir</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cerrar"
            onPress={onClose}
            style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}
          >
            <Feather name="x" size={25} color="#F9F9F9" />
          </Pressable>
        </View>

        <View style={styles.previewArea}>
          <StoryArtwork day={day} width={previewWidth} />
        </View>

        {!!error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}

        <View style={styles.actions}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Compartir en tus historias de Instagram"
            disabled={busy !== null}
            onPress={confirmInstagram}
            style={({ pressed }) => [
              styles.actionButton,
              styles.instagramButton,
              (pressed || busy !== null) && styles.pressed,
            ]}
          >
            {busy === "instagram" ? (
              <ActivityIndicator color="#F9F9F9" />
            ) : (
              <>
                <FontAwesome name="instagram" size={23} color="#F9F9F9" />
                <Text style={styles.actionText}>Compartir en tus historias</Text>
              </>
            )}
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Compartir imagen"
            disabled={busy !== null}
            onPress={() => void shareGeneric()}
            style={({ pressed }) => [
              styles.actionButton,
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
              <StoryArtwork
                day={day}
                width={STORY_WIDTH}
                onReady={() => {
                  captureFailed.current = false;
                  setReady(true);
                }}
                onFailure={() => {
                  captureFailed.current = true;
                  setReady(false);
                  setError("No se pudo cargar la imagen. Cierra y vuelve a intentar.");
                }}
                onLogoReady={() => setLogoReady(true)}
              />
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
  },
  headerSpacer: {
    width: 43,
  },
  title: {
    flex: 1,
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
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
  storyArtwork: {
    overflow: "hidden",
    backgroundColor: "#191919",
  },
  storyShade: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.08)",
  },
  storyQuoteRegion: {
    position: "absolute",
    left: 0,
    right: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  storyQuote: {
    width: "100%",
    color: "#F9F9F9",
    fontFamily: "Manrope",
    fontWeight: "700",
    textAlign: "center",
    textShadowColor: "rgba(0,0,0,0.42)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 5,
  },
  storyLogo: {
    position: "absolute",
    alignSelf: "center",
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
  instagramButton: {
    backgroundColor: "#6737C8",
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