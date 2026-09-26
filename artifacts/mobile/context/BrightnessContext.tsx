import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useState } from "react";

const KEY = "@resonance_bright_mode";
const DEFAULT_BRIGHTNESS = 0.5;

/** Aclara un fondo mezclándolo una sola vez con blanco al 7 %. */
export function brightenThemeColor(hex: string): string {
  return `#${[1, 3, 5].map((offset) => {
    const channel = parseInt(hex.slice(offset, offset + 2), 16);
    return Math.round(channel * 0.93 + 255 * 0.07).toString(16).padStart(2, "0");
  }).join("")}`;
}

export async function loadPersistedBrightMode(): Promise<boolean> {
  try {
    return (await AsyncStorage.getItem(KEY)) === "true";
  } catch {
    return false;
  }
}

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

export function BrightnessProvider({ children, initialBrightMode = false }: {
  children: React.ReactNode;
  initialBrightMode?: boolean;
}) {
  const [brightness, setBrightnessState] = useState(DEFAULT_BRIGHTNESS);
  const [brightMode, setBrightModeState] = useState(initialBrightMode);

  const setBrightness = useCallback((v: number) => {
    setBrightnessState(Math.min(1, Math.max(0, v)));
  }, []);

  const setBrightMode = useCallback((v: boolean) => {
    setBrightModeState(v);
    AsyncStorage.setItem(KEY, String(v)).catch(() => {});
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