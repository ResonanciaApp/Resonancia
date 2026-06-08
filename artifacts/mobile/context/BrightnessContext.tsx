import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const BRIGHTNESS_KEY = "@resonance_app_brightness";
const DEFAULT_BRIGHTNESS = 0.5;

type BrightnessContextValue = {
  brightness: number;
  setBrightness: (v: number) => void;
};

const BrightnessContext = createContext<BrightnessContextValue>({
  brightness: DEFAULT_BRIGHTNESS,
  setBrightness: () => {},
});

export function BrightnessProvider({ children }: { children: React.ReactNode }) {
  const [brightness, setBrightnessState] = useState(DEFAULT_BRIGHTNESS);

  useEffect(() => {
    AsyncStorage.getItem(BRIGHTNESS_KEY).then((raw) => {
      if (raw !== null) {
        const parsed = parseFloat(raw);
        if (Number.isFinite(parsed)) setBrightnessState(parsed);
      }
    });
  }, []);

  const setBrightness = useCallback((v: number) => {
    const clamped = Math.min(1, Math.max(0, v));
    setBrightnessState(clamped);
    AsyncStorage.setItem(BRIGHTNESS_KEY, String(clamped)).catch(() => {});
  }, []);

  return (
    <BrightnessContext.Provider value={{ brightness, setBrightness }}>
      {children}
    </BrightnessContext.Provider>
  );
}

export function useBrightness() {
  return useContext(BrightnessContext);
}
