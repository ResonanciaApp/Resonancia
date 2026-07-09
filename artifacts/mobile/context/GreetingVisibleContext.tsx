import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";

const KEY = "@resonance_greeting_visible";

interface GreetingVisibleContextValue {
  greetingVisible: boolean;
  setGreetingVisible: (v: boolean) => void;
}

const GreetingVisibleContext = createContext<GreetingVisibleContextValue>({
  greetingVisible: true,
  setGreetingVisible: () => {},
});

export function GreetingVisibleProvider({ children }: { children: React.ReactNode }) {
  const [greetingVisible, setVisible] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((val) => {
      if (val !== null) setVisible(val === "true");
    });
  }, []);

  const setGreetingVisible = useCallback((v: boolean) => {
    setVisible(v);
    AsyncStorage.setItem(KEY, String(v));
  }, []);

  return (
    <GreetingVisibleContext.Provider value={{ greetingVisible, setGreetingVisible }}>
      {children}
    </GreetingVisibleContext.Provider>
  );
}

export function useGreetingVisible() {
  return useContext(GreetingVisibleContext);
}
