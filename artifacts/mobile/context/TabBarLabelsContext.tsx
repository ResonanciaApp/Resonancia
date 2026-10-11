import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";

const STORAGE_KEY = "@resonance_tab_bar_labels";
type Preference = {
  enabled: boolean;
  loaded: boolean;
  saving: boolean;
  setEnabled: (enabled: boolean) => Promise<void>;
};
const TabBarLabelsContext = createContext<Preference | null>(null);

export function TabBarLabelsProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then(value => { if (active) setVisible(value === "true"); })
      .catch(error => console.warn("No se pudo cargar la preferencia del tab bar", error))
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, []);
  const setEnabled = useCallback(async (next: boolean) => {
    if (!loaded || pending.current) return;
    pending.current = true;
    setSaving(true);
    setVisible(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, String(next));
    } catch (error) {
      setVisible(enabled);
      console.warn("No se pudo guardar la preferencia del tab bar", error);
      Alert.alert("No se pudo guardar", "Inténtalo de nuevo. Se mantuvo tu configuración anterior.");
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }, [enabled, loaded]);
  const value = useMemo(() => ({ enabled, loaded, saving, setEnabled }), [enabled, loaded, saving, setEnabled]);
  return <TabBarLabelsContext.Provider value={value}>{children}</TabBarLabelsContext.Provider>;
}

export function useTabBarLabels() {
  const preference = useContext(TabBarLabelsContext);
  if (!preference) throw new Error("useTabBarLabels debe usarse dentro de TabBarLabelsProvider");
  return preference;
}
