import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState, useRef } from "react";
import { Alert } from "react-native";

const KEY = "@resonance_home_week_visible";
type Preference = { enabled: boolean; loaded: boolean; saving: boolean; setEnabled: (value: boolean) => Promise<void> };
const Context = createContext<Preference | null>(null);

export function HomeWeekPreferenceProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setVisible] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(KEY).then(value => {
      if (active) setVisible(value !== "false");
    }).catch(error => console.warn("No se pudo cargar Días de racha inicio", error))
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, []);
  async function setEnabled(next: boolean) {
    if (!loaded || pending.current) return;
    pending.current = true;
    setSaving(true);
    setVisible(next);
    try { await AsyncStorage.setItem(KEY, String(next)); }
    catch {
      setVisible(enabled);
      Alert.alert("No se pudo guardar", "Inténtalo de nuevo. Se mantuvo tu configuración anterior.");
    } finally { pending.current = false; setSaving(false); }
  }
  return <Context.Provider value={{ enabled, loaded, saving, setEnabled }}>{children}</Context.Provider>;
}
export function useHomeWeekPreference() {
  const value = useContext(Context);
  if (!value) throw new Error("HomeWeekPreferenceProvider requerido");
  return value;
}
