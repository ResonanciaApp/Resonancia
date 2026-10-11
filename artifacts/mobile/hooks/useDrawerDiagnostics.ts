import { useCallback, useEffect } from "react";
import { Alert, Platform, Share } from "react-native";
import { runOnJS, runOnUI, useFrameCallback, useSharedValue, type SharedValue } from "react-native-reanimated";

// Manual, development-only, memory-only recording. No network/user data.
type Frame = { at: number; gap: number; progress?: number };
let recording = false;
let started = 0;
let jsFrames: Frame[] = [];
let events: { at: number; name: string }[] = [];
let report = "";
let raf = 0;
let timer: ReturnType<typeof setTimeout> | undefined;
let startUI: (() => void) | undefined;
let stopUI: (() => Promise<Frame[]>) | undefined;
let stopping: Promise<void> | undefined;

export function drawerDiagnosticEvent(name: string) {
  if (__DEV__ && recording && events.length < 500) events.push({ at: Date.now() - started, name });
}

function summarize(frames: Frame[]) {
  return {
    samples: frames.length,
    maxGapMs: Math.max(0, ...frames.map(f => f.gap)),
    gapsOver32ms: frames.filter(f => f.gap > 32).length,
    slowFrames: frames.filter(f => f.gap > 32).slice(0, 100).map(f => ({
      ...f, at: f.at - started,
    })),
  };
}

async function stop() {
  if (stopping) return stopping;
  if (!recording) return;
  recording = false;
  cancelAnimationFrame(raf);
  clearTimeout(timer);
  stopping = (async () => {
    const frames = await stopUI?.() ?? [];
    report = JSON.stringify({
      diagnostic: "drawer-timing-v1", mode: "development",
      platform: Platform.OS, osVersion: Platform.Version,
      durationMs: Date.now() - started,
      note: "UI callback timing is not GPU/presentation timing. Compare with a screen recording; instrumentation itself adds some overhead.",
      ui: summarize(frames), js: summarize(jsFrames), events,
    }, null, 2);
  })();
  try { await stopping; } finally { stopping = undefined; }
}

function start() {
  if (recording || stopping || !startUI) return;
  started = Date.now();
  jsFrames = []; events = []; report = "";
  recording = true;
  startUI();
  let previous = Date.now();
  const tick = () => {
    if (!recording) return;
    const now = Date.now();
    if (jsFrames.length < 8000) jsFrames.push({ at: now, gap: now - previous });
    previous = now;
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  timer = setTimeout(() => { void stop(); }, 60_000);
}

export function showDrawerDiagnostics() {
  if (!__DEV__) return;
  Alert.alert("Diagnóstico del menú", recording
    ? "Grabando. Se detiene automáticamente a los 60 segundos."
    : "Inicia el registro, abre y cierra varias veces y vuelve aquí para compartir el informe. No incluye datos personales.", [
    { text: "Cancelar", style: "cancel" },
    ...(recording || stopping ? [] : [{ text: "Iniciar registro", onPress: start }]),
    ...(recording || stopping || report ? [{
      text: "Terminar y compartir",
      onPress: () => {
        void (async () => {
          await stop();
          if (report) await Share.share({ title: "Diagnóstico del drawer", message: report });
        })().catch(() => Alert.alert("No se pudo compartir", "El informe sigue disponible. Inténtalo otra vez."));
      },
    }] : []),
  ]);
}

export function useDrawerDiagnostics(progress: SharedValue<number>) {
  const samples = useSharedValue<Frame[]>([]);
  const sampleFrame = useCallback((info: { timeSincePreviousFrame: number | null }) => {
    "worklet";
    if (!__DEV__) return;
    const sample = { at: Date.now(), gap: info.timeSincePreviousFrame ?? 0, progress: progress.value };
    samples.modify(values => {
      "worklet";
      if (values.length < 8000) values.push(sample);
      return values;
    });
  }, [progress, samples]);
  const frame = useFrameCallback(sampleFrame, false);

  useEffect(() => {
    if (!__DEV__) return;
    let resolvePending: ((frames: Frame[]) => void) | undefined;
    const receive = (values: Frame[]) => { resolvePending?.(values); resolvePending = undefined; };
    startUI = () => { samples.value = []; frame.setActive(true); };
    stopUI = () => new Promise<Frame[]>(resolve => {
      resolvePending = resolve;
      frame.setActive(false);
      runOnUI(() => {
        "worklet";
        runOnJS(receive)(samples.value);
      })();
    });
    return () => {
      recording = false;
      cancelAnimationFrame(raf); clearTimeout(timer);
      frame.setActive(false);
      resolvePending?.([]);
      startUI = undefined; stopUI = undefined;
    };
  }, [frame, samples]);
}
