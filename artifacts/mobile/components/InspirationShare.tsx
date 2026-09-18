import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Modal, Platform, Pressable, Text, View, StyleSheet } from "react-native";
import ViewShot, { releaseCapture } from "react-native-view-shot";
import * as Sharing from "expo-sharing";
import * as Font from "expo-font";
import { InspirationArtwork } from "./InspirationArtwork";
import type { InspirationDay } from "@/types/inspiration";
import { formatFullDate } from "@/lib/date-utils";

async function makeWebImage(day: InspirationDay): Promise<Blob> {
  const content = day.content!;
  await document.fonts.ready;
  await document.fonts.load("28px Manrope");
  if (!Font.isLoaded("Manrope")) throw new Error("La tipografía aún no está lista. Vuelve a intentarlo.");
  const image = new window.Image();
  image.crossOrigin = "anonymous";
  image.src = content.imageUrl;
  await image.decode();
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Tu navegador no permite generar la imagen.");
  const wrap = (text: string, size: number) => {
    context.font = `${size}px Manrope`;
    const lines: string[] = [];
    for (const paragraph of text.split("\n")) {
      let line = "";
      for (const word of paragraph.split(/\s+/)) {
        if (context.measureText(`${line} ${word}`.trim()).width > 920 && line) { lines.push(line); line = ""; }
        // Long words/URLs are wrapped too, never clipped.
        for (const char of (line ? " " : "") + word) {
          if (context.measureText(line + char).width > 920) { lines.push(line); line = ""; }
          line += char;
        }
      }
      lines.push(line);
    }
    return lines;
  };
  const quote = wrap(content.quote, 44);
  const author = content.author ? wrap(`— ${content.author}`, 28) : [];
  const date = wrap(formatFullDate(day.date).toUpperCase(), 24);
  const textHeight = date.length * 36 + quote.length * 60 + author.length * 42 + 160;
  canvas.height = Math.max(1080, textHeight + 160);
  const scale = Math.max(canvas.width / image.naturalWidth, canvas.height / image.naturalHeight);
  const w = image.naturalWidth * scale, h = image.naturalHeight * scale;
  context.drawImage(image, (canvas.width - w) * content.imagePositionX / 100, (canvas.height - h) * content.imagePositionY / 100, w, h);
  context.fillStyle = `rgba(0,0,0,${content.overlayOpacity})`;
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#fff";
  context.textBaseline = "top";
  let y = canvas.height - textHeight - 80;
  const draw = (lines: string[], size: number, lineHeight: number) => {
    context.font = `${size}px Manrope`;
    for (const line of lines) { context.fillText(line, 80, y); y += lineHeight; }
    y += 28;
  };
  draw(date, 24, 36); draw(quote, 44, 60); draw(author, 28, 42);
  context.font = "22px Manrope"; context.fillText("RESONANCIA", 80, canvas.height - 70);
  return new Promise((resolve, reject) => canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("No se pudo generar el archivo PNG.")), "image/png"));
}

/** Dedicated capture contains no reflection, controls, audio or private notes. */
export function InspirationShare({ day, onClose }: { day: InspirationDay; onClose: () => void }) {
  const capture = useRef<ViewShot>(null);
  const [ready, setReady] = useState(false);
  const [laidOut, setLaidOut] = useState(false);
  const captureReady = useRef(false);
  const captureFailed = useRef(false);
  captureReady.current = ready && laidOut;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [prepared, setPrepared] = useState(false);
  const file = useRef<File | null>(null);
  const uri = useRef<string | null>(null);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; file.current = null; if (uri.current) releaseCapture(uri.current); }, []);
  const generate = async () => {
    setBusy(true); setError(null);
    try {
      if (Platform.OS === "web") {
        const blob = await makeWebImage(day);
        if (!alive.current) return;
        file.current = new File([blob], `resonancia-${day.date}.png`, { type: "image/png" });
      } else {
        const started = Date.now();
        while (!captureReady.current || !Font.isLoaded("Manrope")) {
          if (!alive.current) return;
          if (captureFailed.current) throw new Error("No se pudo cargar la imagen. Cierra y vuelve a intentar.");
          if (Date.now() - started > 15000) throw new Error("La imagen o la tipografía tardan demasiado en cargar. Vuelve a intentarlo.");
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())));
        const result = await capture.current?.capture?.();
        if (!result) throw new Error("No se pudo capturar la imagen.");
        if (!alive.current) { releaseCapture(result); return; }
        if (uri.current) releaseCapture(uri.current);
        uri.current = result;
      }
      setPrepared(true);
    } catch (cause) { if (alive.current) setError(cause instanceof Error ? cause.message : "No se pudo generar la imagen."); }
    finally { if (alive.current) setBusy(false); }
  };
  const share = async () => {
    setBusy(true); setError(null);
    try {
      if (Platform.OS === "web") {
        if (!file.current) throw new Error("Primero genera la imagen.");
        if (navigator.canShare?.({ files: [file.current] })) await navigator.share({ files: [file.current] });
        else {
          const url = URL.createObjectURL(file.current);
          const link = document.createElement("a");
          try { link.href = url; link.download = file.current.name; document.body.appendChild(link); link.click(); }
          finally { link.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000); }
        }
      } else {
        if (!uri.current || !await Sharing.isAvailableAsync()) throw new Error("Compartir imágenes no está disponible en este dispositivo.");
        await Sharing.shareAsync(uri.current, { mimeType: "image/png", UTI: "public.png", dialogTitle: "Compartir inspiración" });
      }
      onClose();
    } catch (cause) {
      if (cause instanceof Error && cause.name === "AbortError") onClose();
      else setError(cause instanceof Error ? cause.message : "No se pudo compartir la imagen.");
    } finally { if (alive.current) setBusy(false); }
  };
  return <Modal transparent animationType="fade" onRequestClose={onClose}>
    <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,.8)", alignItems: "center", justifyContent: "center", padding: 24 }}>
      <View style={{ width: "100%", maxWidth: 420, padding: 24, borderRadius: 20, backgroundColor: "#222", gap: 20 }}>
        <Text style={{ color: "#fff", fontSize: 21 }}>Compartir inspiración</Text>
        <Text style={{ color: "#ddd" }}>La imagen incluye la frase completa, autor, fecha y RESONANCIA. Nunca incluye tus notas.</Text>
        {busy && <ActivityIndicator color="#fff" />}
        {error && <Text accessibilityRole="alert" style={{ color: "#ffb1a8" }}>{error}</Text>}
        <Pressable disabled={busy} onPress={() => void (prepared ? share() : generate())} style={{ padding: 14, backgroundColor: "#444", borderRadius: 12 }}>
          <Text style={{ color: "#fff" }}>{prepared ? Platform.OS === "web" && file.current && !navigator.canShare?.({ files: [file.current] }) ? "Descargar imagen PNG" : "Compartir imagen PNG" : "Generar imagen"}</Text>
        </Pressable>
        <Pressable onPress={onClose}><Text style={{ color: "#ddd" }}>Cancelar</Text></Pressable>
      </View>
      {Platform.OS !== "web" && <View pointerEvents="none" style={{ position: "absolute", left: -2000, top: 0, width: 720 }}>
        <ViewShot ref={capture} options={{ format: "png", result: "tmpfile" }}>
          <View onLayout={() => setLaidOut(true)} style={{ width: 720, minHeight: 720, backgroundColor: "#191919", padding: 52, justifyContent: "flex-end" }}>
            <InspirationArtwork content={day.content!} onReady={() => { captureFailed.current = false; setReady(true); }} onFailure={() => { captureFailed.current = true; setReady(false); setError("No se pudo cargar la imagen. Cierra y vuelve a intentar."); }} />
            <Text style={[styles.text, { fontSize: 18, marginBottom: 28 }]}>{formatFullDate(day.date).toUpperCase()}</Text>
            <Text style={[styles.text, { fontSize: 30, lineHeight: 42 }]}>{day.content!.quote}</Text>
            {!!day.content!.author && <Text style={[styles.text, { fontSize: 22, marginTop: 24 }]}>— {day.content!.author}</Text>}
            <Text style={[styles.text, { fontSize: 18, marginTop: 48, letterSpacing: 4 }]}>RESONANCIA</Text>
          </View>
        </ViewShot>
      </View>}
    </View>
  </Modal>;
}
const styles = StyleSheet.create({ text: { color: "#fff", fontFamily: "Manrope" } });