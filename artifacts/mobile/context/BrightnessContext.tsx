import React, { createContext, useCallback, useContext, useState } from "react";

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

  const setBrightness = useCallback((v: number) => {
    setBrightnessState(Math.min(1, Math.max(0, v)));
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
