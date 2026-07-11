type Listener = () => void;
const listeners = new Set<Listener>();

export const sessionMiniPlayerEvents = {
  triggerShow() {
    listeners.forEach((l) => l());
  },
  subscribe(cb: Listener) {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
};
