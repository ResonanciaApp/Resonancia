import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

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
