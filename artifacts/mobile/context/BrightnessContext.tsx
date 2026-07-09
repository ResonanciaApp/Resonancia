import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

// ── Helpers de color ──────────────────────────────────────────────────────────
function hexToHsl(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = 0;
  if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
  else if (max === g) h = ((b - r) / d + 2) / 6;
  else h = ((r - g) / d + 4) / 6;
  return [h, s, l];
}
function hslToHex(h: number, s: number, l: number): string {
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1; if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const toHex = (x: number) => Math.round(x * 255).toString(16).padStart(2, "0");
  return `#${toHex(hue2rgb(p, q, h + 1 / 3))}${toHex(hue2rgb(p, q, h))}${toHex(hue2rgb(p, q, h - 1 / 3))}`;
}
/** Aplica +7% saturación y +4% luminosidad al color de fondo para Modo brillante. */
export function applyBrightSat(hex: string): string {
  const [h, s, l] = hexToHsl(hex);
  return hslToHex(h, Math.min(1, s + 0.07), Math.min(1, l + 0.04));
}

const DEFAULT_BRIGHTNESS = 0.5;
const BRIGHT_MODE_BRIGHTNESS = 0.54;
const KEY = "@resonance_bright_mode";

type BrightnessContextValue = {
  brightness: number;
  setBrightness: (v: number) => void;
  brightMode: boolean;
  setBrightMode: (v: boolean) => void;
};

const BrightnessContext = createContext<BrightnessContextValue>({
  brightness: DEFAULT_BRIGHTNESS,
  setBrightness: () => {},
  brightMode: false,
  setBrightMode: () => {},
});

export function BrightnessProvider({ children }: { children: React.ReactNode }) {
  const [brightness, setBrightnessState] = useState(DEFAULT_BRIGHTNESS);
  const [brightMode, setBrightModeState] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((val) => {
      if (val === "true") {
        setBrightModeState(true);
        setBrightnessState(BRIGHT_MODE_BRIGHTNESS);
      }
    });
  }, []);

  const setBrightness = useCallback((v: number) => {
    setBrightnessState(Math.min(1, Math.max(0, v)));
  }, []);

  const setBrightMode = useCallback((v: boolean) => {
    setBrightModeState(v);
    setBrightnessState(v ? BRIGHT_MODE_BRIGHTNESS : DEFAULT_BRIGHTNESS);
    AsyncStorage.setItem(KEY, String(v));
  }, []);

  return (
    <BrightnessContext.Provider value={{ brightness, setBrightness, brightMode, setBrightMode }}>
      {children}
    </BrightnessContext.Provider>
  );
}

export function useBrightness() {
  return useContext(BrightnessContext);
}
