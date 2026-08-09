import React, { createContext, useCallback, useContext, useState } from "react";

type CategoryOverlayCtx = {
  categoryRoute: string | null;
  openCategory: (route: string) => void;
  closeCategory: () => void;
};

const Ctx = createContext<CategoryOverlayCtx | null>(null);

export function CategoryOverlayProvider({ children }: { children: React.ReactNode }) {
  const [categoryRoute, setCategoryRoute] = useState<string | null>(null);
  const openCategory  = useCallback((route: string) => setCategoryRoute(route), []);
  const closeCategory = useCallback(() => setCategoryRoute(null), []);

  const value = React.useMemo(
    () => ({ categoryRoute, openCategory, closeCategory }),
    [categoryRoute, openCategory, closeCategory],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCategoryOverlay() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCategoryOverlay must be used within CategoryOverlayProvider");
  return ctx;
}
