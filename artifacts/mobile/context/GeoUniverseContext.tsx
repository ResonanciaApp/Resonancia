import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";

const STORAGE_KEY = "@resonance_geo_universe";

interface GeoUniverseCtx {
  enabled: boolean;
  setEnabled: (v: boolean) => void;
}

const Ctx = createContext<GeoUniverseCtx>({ enabled: false, setEnabled: () => {} });

export function GeoUniverseProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setEnabledState] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => { if (v === "1") setEnabledState(true); })
      .catch(() => {});
  }, []);

  const setEnabled = (v: boolean) => {
    setEnabledState(v);
    AsyncStorage.setItem(STORAGE_KEY, v ? "1" : "0").catch(() => {});
  };

  return <Ctx.Provider value={{ enabled, setEnabled }}>{children}</Ctx.Provider>;
}

export function useGeoUniverse() {
  return useContext(Ctx);
}
