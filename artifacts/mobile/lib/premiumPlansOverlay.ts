type Opener = () => void;

let rootOpener: Opener | null = null;
const modalOpeners = new Map<symbol, Opener>();

export function registerPremiumPlansOverlay(opener: Opener | null) {
  rootOpener = opener;
}

export function registerPremiumPlansModalHost(id: symbol, opener: Opener) {
  modalOpeners.delete(id);
  modalOpeners.set(id, opener);
  return () => {
    modalOpeners.delete(id);
  };
}

export function openPremiumPlansOverlayGlobal(): boolean {
  const activeModalOpener = Array.from(modalOpeners.values()).at(-1);
  const opener = activeModalOpener ?? rootOpener;
  if (!opener) return false;
  opener();
  return true;
}