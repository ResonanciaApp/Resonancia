import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useState } from "react";

const SETTINGS_KEY = "@resonance_settings";

type IntencionDiariaContextValue = {
  intencionDiariaEnabled: boolean;
  setIntencionDiariaEnabled: (v: boolean) => void;
  escenasAnimadasEnabled: boolean;
  setEscenasAnimadasEnabled: (v: boolean) => void;
};

const IntencionDiariaContext = createContext<IntencionDiariaContextValue>({
  intencionDiariaEnabled: true,
  setIntencionDiariaEnabled: () => {},
  escenasAnimadasEnabled: false,
  setEscenasAnimadasEnabled: () => {},
});

export function IntencionDiariaProvider({ children }: { children: React.ReactNode }) {
  // Intención diaria: ON por defecto; Escenas animadas (geometrías): OFF por defecto.
  const [intencionDiariaEnabled, setEnabledState] = useState(true);
  const [escenasAnimadasEnabled, setEscenasState] = useState(false);

  // Al entrar a la app, Intención diaria siempre arranca ACTIVADA
  // (y Escenas animadas apagada, porque son mutuamente excluyentes).
  // No se lee el valor guardado: el toggle es por-sesión.

  const persist = (patch: Record<string, boolean>) => {
    AsyncStorage.getItem(SETTINGS_KEY)
      .then((raw) => {
        const prev = raw ? JSON.parse(raw) : {};
        return AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...prev, ...patch }));
      })
      .catch(() => {
        AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(patch)).catch(() => {});
      });
  };

  // Toggles mutuamente excluyentes: activar uno desactiva el otro.
  const setIntencionDiariaEnabled = (v: boolean) => {
    setEnabledState(v);
    if (v) {
      setEscenasState(false);
      persist({ intencionDiariaEnabled: true, escenasAnimadasEnabled: false });
    } else {
      persist({ intencionDiariaEnabled: false });
    }
  };

  const setEscenasAnimadasEnabled = (v: boolean) => {
    setEscenasState(v);
    if (v) {
      setEnabledState(false);
      persist({ escenasAnimadasEnabled: true, intencionDiariaEnabled: false });
    } else {
      persist({ escenasAnimadasEnabled: false });
    }
  };

  return (
    <IntencionDiariaContext.Provider
      value={{ intencionDiariaEnabled, setIntencionDiariaEnabled, escenasAnimadasEnabled, setEscenasAnimadasEnabled }}
    >
      {children}
    </IntencionDiariaContext.Provider>
  );
}

export function useIntencionDiaria() {
  return useContext(IntencionDiariaContext);
}
