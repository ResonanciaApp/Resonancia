import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

/**
 * Controla si la tab bar (menú inferior) está oculta. Lo usa Geometrix para
 * esconder el menú al entrar (más espacio para el lienzo) y la tab bar para
 * deslizarse hacia abajo + mostrar la pestañita de reaparición.
 */
type TabBarVisibility = {
  hidden: boolean;
  requestHide: () => void;
  showMenu: () => void;
};

const TabBarVisibilityContext = createContext<TabBarVisibility>({
  hidden: false,
  requestHide: () => {},
  showMenu: () => {},
});

export function TabBarVisibilityProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [hidden, setHidden] = useState(false);
  const requestHide = useCallback(() => setHidden(true), []);
  const showMenu = useCallback(() => setHidden(false), []);
  const value = useMemo(
    () => ({ hidden, requestHide, showMenu }),
    [hidden, requestHide, showMenu],
  );
  return (
    <TabBarVisibilityContext.Provider value={value}>
      {children}
    </TabBarVisibilityContext.Provider>
  );
}

export const useTabBarVisibility = () => useContext(TabBarVisibilityContext);
