/** Only library cards opt into the stationary-background transition. */
export function isLibraryDetailRoute(route: string) {
  return /^\/(?:playlist|editorial-playlist|carpeta|carpeta-mezcla|carpeta-favorito)\/[^/?]+(?:\?|$)/.test(route);
}

export function hasLibrarySlide(params?: object) {
  const value = (params as { librarySlide?: string | string[] } | undefined)?.librarySlide;
  return value === "1" || (Array.isArray(value) && value.includes("1"));
}

export function libraryDetailOptions(params?: object) {
  return hasLibrarySlide(params)
    ? { presentation: "transparentModal" as const, animation: "none" as const, gestureEnabled: false }
    : {};
}
