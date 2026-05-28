import { usePathname } from "expo-router";
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

type DrawerCtx = {
  isOpen: boolean;
  instant: boolean;
  open: () => void;
  close: () => void;
};

const Ctx = createContext<DrawerCtx | null>(null);

export function DrawerProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [instant, setInstant] = useState(false);
  const reopenOnHome = useRef(false);

  const pathname = usePathname();
  const prevPath = useRef(pathname);

  useEffect(() => {
    const prev = prevPath.current;
    prevPath.current = pathname;
    if (
      reopenOnHome.current &&
      (pathname === "/" || pathname === "") &&
      prev !== pathname
    ) {
      reopenOnHome.current = false;
      setInstant(true);
      setIsOpen(true);
    }
  }, [pathname]);

  const open = useCallback(() => {
    setInstant(false);
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
    setInstant(false);
  }, []);

  return (
    <Ctx.Provider value={{ isOpen, instant, open, close }}>
      {children}
      {/* Helper to set the reopen flag from DrawerMenu without prop drilling */}
      <ReopenFlagBridge setFlag={(v) => { reopenOnHome.current = v; }} />
    </Ctx.Provider>
  );
}

// Bridge exposes a setter via a module-level ref so DrawerMenu can call it.
let _setReopenFlag: ((v: boolean) => void) | null = null;
function ReopenFlagBridge({ setFlag }: { setFlag: (v: boolean) => void }) {
  useEffect(() => {
    _setReopenFlag = setFlag;
    return () => { _setReopenFlag = null; };
  }, [setFlag]);
  return null;
}

export function markDrawerReopenOnHome() {
  _setReopenFlag?.(true);
}

export function useDrawer() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useDrawer must be used within DrawerProvider");
  return ctx;
}
