import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Alert } from "react-native";

const STORAGE_KEY = "@resonance_emoji_widget_visible";

type EmojiWidgetPreference = {
  enabled: boolean;
  loaded: boolean;
  saving: boolean;
  setEnabled: (enabled: boolean) => Promise<void>;
};

const EmojiWidgetContext = createContext<EmojiWidgetPreference | null>(null);

export function EmojiWidgetProvider({ children }: { children: React.ReactNode }) {
  const [enabled, setVisible] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [saving, setSaving] = useState(false);
  const pending = useRef(false);

  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(STORAGE_KEY)
      .then((value) => {
        if (active) setVisible(value !== "false");
      })
      .catch((error) => console.warn("No se pudo cargar la preferencia del widget emoji", error))
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
      console.warn("No se pudo guardar la preferencia del widget emoji", error);
      Alert.alert("No se pudo guardar", "Inténtalo de nuevo. Se mantuvo tu configuración anterior.");
    } finally {
      pending.current = false;
      setSaving(false);
    }
  }, [enabled, loaded]);

  const value = useMemo(() => ({ enabled, loaded, saving, setEnabled }), [enabled, loaded, saving, setEnabled]);
  return <EmojiWidgetContext.Provider value={value}>{children}</EmojiWidgetContext.Provider>;
}

export function useEmojiWidget() {
  const preference = useContext(EmojiWidgetContext);
  if (!preference) throw new Error("useEmojiWidget debe usarse dentro de EmojiWidgetProvider");
  return preference;
}
