import { useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, Search, X } from "lucide-react";
import type { CatalogPlaylist } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";

type PlaylistCarouselPickerProps = {
  playlists: CatalogPlaylist[];
  selected: string[];
  onChange: (playlistIds: string[]) => void;
};

export function PlaylistCarouselPicker({
  playlists,
  selected,
  onChange,
}: PlaylistCarouselPickerProps) {
  const [search, setSearch] = useState("");
  const normalizedSearch = search.trim().toLocaleLowerCase();

  const filteredPlaylists = useMemo(() => {
    const sorted = [...playlists].sort((a, b) =>
      a.title.localeCompare(b.title, "es", { sensitivity: "base" }),
    );
    if (!normalizedSearch) return sorted;
    return sorted.filter(
      (playlist) =>
        playlist.title.toLocaleLowerCase().includes(normalizedSearch) ||
        playlist.slug.toLocaleLowerCase().includes(normalizedSearch),
    );
  }, [normalizedSearch, playlists]);

  const togglePlaylist = (slug: string) => {
    if (selected.includes(slug)) {
      onChange(selected.filter((playlistId) => playlistId !== slug));
    } else {
      onChange([...selected, slug]);
    }
  };

  const move = (index: number, direction: -1 | 1) => {
    const target = index + direction;
    if (target < 0 || target >= selected.length) return;
    const next = [...selected];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  const playlistBySlug = new Map(playlists.map((playlist) => [playlist.slug, playlist]));

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      <div className="border-b border-border bg-secondary/30 px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <p className="text-sm font-medium text-foreground">Playlists del carrusel</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Selecciona playlists existentes y define el orden de sus cards.
            </p>
          </div>
          <span className="shrink-0 text-xs text-muted-foreground">
            {selected.length} {selected.length === 1 ? "seleccionada" : "seleccionadas"}
          </span>
        </div>
        <div className="relative mt-3">
          <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre o slug..."
            className="h-9 pl-9 text-sm"
            aria-label="Buscar playlists"
          />
        </div>
      </div>

      <div className="max-h-64 divide-y divide-border overflow-y-auto">
        {filteredPlaylists.length === 0 ? (
          <p className="px-4 py-8 text-center text-sm text-muted-foreground">
            No hay playlists que coincidan con la búsqueda.
          </p>
        ) : (
          filteredPlaylists.map((playlist) => {
            const isSelected = selected.includes(playlist.slug);
            return (
              <button
                key={playlist.slug}
                type="button"
                onClick={() => togglePlaylist(playlist.slug)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-secondary/50"
                aria-pressed={isSelected}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                    isSelected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border"
                  }`}
                  aria-hidden="true"
                >
                  {isSelected && <Check className="h-3 w-3" />}
                </span>
                {playlist.coverUrl ? (
                  <img
                    src={playlist.coverUrl}
                    alt=""
                    className="h-9 w-9 shrink-0 rounded object-cover"
                  />
                ) : (
                  <span className="h-9 w-9 shrink-0 rounded bg-secondary" aria-hidden="true" />
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm text-foreground">{playlist.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {playlist.slug}
                    {!playlist.isActive && " · Inactiva"}
                  </span>
                </span>
              </button>
            );
          })
        )}
      </div>

      {selected.length > 0 && (
        <div className="border-t border-border bg-secondary/20 px-4 py-3">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Orden de las cards</p>
          <div className="space-y-1">
            {selected.map((slug, index) => {
              const playlist = playlistBySlug.get(slug);
              return (
                <div
                  key={slug}
                  className="flex items-center gap-2 rounded-md px-1 py-1 text-sm hover:bg-secondary/60"
                >
                  <span className="w-5 text-center text-xs text-muted-foreground">
                    {index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-foreground">
                    {playlist?.title ?? slug}
                    {!playlist && (
                      <span className="ml-2 text-xs text-muted-foreground">(no encontrada)</span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => move(index, -1)}
                    disabled={index === 0}
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30"
                    aria-label={`Mover ${playlist?.title ?? slug} arriba`}
                  >
                    <ArrowUp className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => move(index, 1)}
                    disabled={index === selected.length - 1}
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-30"
                    aria-label={`Mover ${playlist?.title ?? slug} abajo`}
                  >
                    <ArrowDown className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => togglePlaylist(slug)}
                    className="rounded p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-destructive"
                    aria-label={`Quitar ${playlist?.title ?? slug}`}
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}