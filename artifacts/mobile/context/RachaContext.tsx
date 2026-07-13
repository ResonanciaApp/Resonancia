import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

const SETTINGS_KEY = "@resonance_settings";

type RachaContextValue = {
  rachaEnabled: boolean;
  setRachaEnabled: (v: boolean) => void;
};

const RachaContext = createContext<RachaContextValue>({
  rachaEnabled: true,
  setRachaEnabled: () => {},
});

export function RachaProvider({ children }: { children: React.ReactNode }) {
  const [rachaEnabled, setRachaEnabledState] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY).then((raw) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        setRachaEnabledState(parsed.rachaEnabled !== false);
      } catch {}
    });
  }, []);

  const setRachaEnabled = (v: boolean) => {
    setRachaEnabledState(v);
    AsyncStorage.getItem(SETTINGS_KEY)
      .then((raw) => {
        const prev = raw ? JSON.parse(raw) : {};
        return AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...prev, rachaEnabled: v }));
      })
      .catch(() => {
        AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ rachaEnabled: v })).catch(() => {});
      });
  };

  return (
    <RachaContext.Provider value={{ rachaEnabled, setRachaEnabled }}>
      {children}
    </RachaContext.Provider>
  );
}

export function useRacha() {
  return useContext(RachaContext);
}
