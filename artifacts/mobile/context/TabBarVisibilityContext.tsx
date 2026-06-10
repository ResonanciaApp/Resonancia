import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

// Niebla (preset claro por defecto) — coincide con el valor inicial de musicTheme="claro"
const DEFAULT_GRADIENT = ["#F4F6FA", "#EAECF2", "#DDE0E8"] as const;

type TabBarVisibility = {
  hidden: boolean;
  requestHide: () => void;
  showMenu: () => void;
  musicTheme: "claro" | "azul";
  setMusicTheme: (t: "claro" | "azul") => void;
  musicGradient: readonly [string, string, string];
  setMusicGradient: (g: readonly [string, string, string]) => void;
};

const TabBarVisibilityContext = createContext<TabBarVisibility>({
  hidden: false,
  requestHide: () => {},
  showMenu: () => {},
  musicTheme: "claro",
  setMusicTheme: () => {},
  musicGradient: DEFAULT_GRADIENT,
  setMusicGradient: () => {},
});

export function TabBarVisibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hidden, setHidden] = useState(false);
  const [musicTheme, setMusicTheme] = useState<"claro" | "azul">("claro");
  const [musicGradient, setMusicGradient] =
    useState<readonly [string, string, string]>(DEFAULT_GRADIENT);
  const requestHide = useCallback(() => setHidden(true), []);
  const showMenu = useCallback(() => setHidden(false), []);
  const value = useMemo(
    () => ({ hidden, requestHide, showMenu, musicTheme, setMusicTheme, musicGradient, setMusicGradient }),
    [hidden, requestHide, showMenu, musicTheme, musicGradient],
  );
  return (
    <TabBarVisibilityContext.Provider value={value}>
      {children}
    </TabBarVisibilityContext.Provider>
  );
}

export const useTabBarVisibility = () => useContext(TabBarVisibilityContext);
