export type ShowDirection = "top" | "bottom";

type Listener = (from: ShowDirection) => void;
const listeners = new Set<Listener>();

export const sessionMiniPlayerEvents = {
  /**
   * "top" (default): la barra cae desde arriba — patrón de minimizar
   * el reproductor expandido. "bottom": entra desde abajo con fade
   * (patrón DormirMiniPlayer) — se usa al tocar una sesión skipMiniPlayer.
   */
  triggerShow(from: ShowDirection = "top") {
    listeners.forEach((l) => l(from));
  },
  subscribe(cb: Listener) {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  },
};
