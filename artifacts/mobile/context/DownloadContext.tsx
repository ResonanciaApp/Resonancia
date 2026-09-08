import { useAuth as useClerkAuth } from "@clerk/expo";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePremium } from "@/context/PremiumContext";
import type { Session } from "@/data/sessions";
import {
  cancelOwnerTransfers,
  clearDownloads,
  downloadOwnerScope,
  downloadSession,
  offlineDownloadsSupported,
  reconcileDownloads,
  removeDownload,
  type OfflineDownload,
} from "@/lib/downloadRepository";
import { showPremiumGate } from "@/lib/premiumGate";

type DownloadContextValue = {
  downloads: OfflineDownload[];
  loading: boolean;
  supported: boolean;
  download: (session: Session) => Promise<void>;
  remove: (id: string) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
};
const DownloadContext = createContext<DownloadContextValue | null>(null);

export function DownloadProvider({ children }: { children: React.ReactNode }) {
  const { getToken, userId } = useClerkAuth();
  const { isPremium } = usePremium();
  const supported = offlineDownloadsSupported();
  const owner = downloadOwnerScope(userId);
  const ownerRef = React.useRef(owner);
  ownerRef.current = owner;
  const [downloads, setDownloads] = useState<OfflineDownload[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const entries = await reconcileDownloads(owner);
    if (ownerRef.current === owner) setDownloads(entries);
  }, [owner]);

  useEffect(() => {
    setLoading(true);
    setDownloads([]);
    refresh()
      .catch((error) => console.warn("[downloads] No se pudo reconciliar:", error))
      .finally(() => setLoading(false));
  }, [refresh, userId]);

  useEffect(
    () => () => {
      void cancelOwnerTransfers(owner);
    },
    [owner],
  );

  const update = useCallback((item: OfflineDownload) => {
    setDownloads((previous) =>
      [item, ...previous.filter((entry) => entry.sessionId !== item.sessionId)]
        .sort((a, b) => +new Date(b.downloadedAt) - +new Date(a.downloadedAt)),
    );
  }, []);

  const download = useCallback(async (session: Session) => {
    if (session.isPremium && !isPremium) {
      showPremiumGate("Activa Premium para descargar esta sesión y escucharla sin conexión.");
      return;
    }
    const token = await getToken().catch(() => null);
    if (ownerRef.current !== owner) return;
    await downloadSession(owner, session, token, (item) => {
      if (ownerRef.current === owner) update(item);
    });
  }, [getToken, isPremium, owner, update]);

  const remove = useCallback(async (id: string) => {
    await removeDownload(owner, id);
    await refresh();
  }, [owner, refresh]);

  const clear = useCallback(async () => {
    await clearDownloads(owner);
    await refresh();
  }, [owner, refresh]);

  const value = useMemo(
    () => ({ downloads, loading, supported, download, remove, clear, refresh }),
    [clear, download, downloads, loading, refresh, remove, supported],
  );

  return <DownloadContext.Provider value={value}>{children}</DownloadContext.Provider>;
}

export function useDownloads() {
  const value = useContext(DownloadContext);
  if (!value) throw new Error("useDownloads must be used within DownloadProvider");
  return value;
}