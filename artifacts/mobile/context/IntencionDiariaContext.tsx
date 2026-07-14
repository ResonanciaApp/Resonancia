import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

const SETTINGS_KEY = "@resonance_settings";

type IntencionDiariaContextValue = {
  intencionDiariaEnabled: boolean;
  setIntencionDiariaEnabled: (v: boolean) => void;
};

const IntencionDiariaContext = createContext<IntencionDiariaContextValue>({
  intencionDiariaEnabled: false,
  setIntencionDiariaEnabled: () => {},
});

export function IntencionDiariaProvider({ children }: { children: React.ReactNode }) {
  const [intencionDiariaEnabled, setEnabledState] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(SETTINGS_KEY).then((raw) => {
      if (!raw) return;
      try {
        const parsed = JSON.parse(raw);
        setEnabledState(parsed.intencionDiariaEnabled === true);
      } catch {}
    });
  }, []);

  const setIntencionDiariaEnabled = (v: boolean) => {
    setEnabledState(v);
    AsyncStorage.getItem(SETTINGS_KEY)
      .then((raw) => {
        const prev = raw ? JSON.parse(raw) : {};
        return AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...prev, intencionDiariaEnabled: v }));
      })
      .catch(() => {
        AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ intencionDiariaEnabled: v })).catch(() => {});
      });
  };

  return (
    <IntencionDiariaContext.Provider value={{ intencionDiariaEnabled, setIntencionDiariaEnabled }}>
      {children}
    </IntencionDiariaContext.Provider>
  );
}

export function useIntencionDiaria() {
  return useContext(IntencionDiariaContext);
}
