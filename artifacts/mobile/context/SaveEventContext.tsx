import React, { createContext, useCallback, useContext, useState } from "react";

type SaveEventCtx = {
  lastSavedAt: number | null;
  notifySaved: () => void;
};

const SaveEventContext = createContext<SaveEventCtx>({
  lastSavedAt: null,
  notifySaved: () => {},
});

export function SaveEventProvider({ children }: { children: React.ReactNode }) {
  const [lastSavedAt, setLastSavedAt] = useState<number | null>(null);
  const notifySaved = useCallback(() => setLastSavedAt(Date.now()), []);
  return (
    <SaveEventContext.Provider value={{ lastSavedAt, notifySaved }}>
      {children}
    </SaveEventContext.Provider>
  );
}

export function useSaveEvent() {
  return useContext(SaveEventContext);
}
