import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

type TabBarVisibility = {
  hidden: boolean;
  requestHide: () => void;
  showMenu: () => void;
  musicTheme: "claro" | "azul";
  setMusicTheme: (t: "claro" | "azul") => void;
};

const TabBarVisibilityContext = createContext<TabBarVisibility>({
  hidden: false,
  requestHide: () => {},
  showMenu: () => {},
  musicTheme: "claro",
  setMusicTheme: () => {},
});

export function TabBarVisibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hidden, setHidden] = useState(false);
  const [musicTheme, setMusicTheme] = useState<"claro" | "azul">("claro");
  const requestHide = useCallback(() => setHidden(true), []);
  const showMenu = useCallback(() => setHidden(false), []);
  const value = useMemo(
    () => ({ hidden, requestHide, showMenu, musicTheme, setMusicTheme }),
    [hidden, requestHide, showMenu, musicTheme],
  );
  return (
    <TabBarVisibilityContext.Provider value={value}>
      {children}
    </TabBarVisibilityContext.Provider>
  );
}

export const useTabBarVisibility = () => useContext(TabBarVisibilityContext);
