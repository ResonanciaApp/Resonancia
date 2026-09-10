import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  Eye,
  EyeOff,
  Layers3,
  Loader2,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import {
  getListAdminPlaylistCarouselsQueryKey,
  useDeleteAdminPlaylistCarousel,
  useListAdminPlaylistCarousels,
  useUpdateAdminPlaylistCarousel,
  type CatalogPlaylist,
  type PlaylistCarousel,
} from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { PlaylistCarouselForm } from "./PlaylistCarouselForm";

type PlaylistCarouselsViewProps = {
  playlists: CatalogPlaylist[];
  playlistsLoading: boolean;
};

const SURFACES: Array<{
  value: PlaylistCarousel["surface"];
  label: string;
}> = [
  { value: "discover", label: "Descubrir" },
  { value: "sleep", label: "Dormir" },
];

export function PlaylistCarouselsView({
  playlists,
  playlistsLoading,
}: PlaylistCarouselsViewProps) {
  const queryClient = useQueryClient();
  const [editorOpen, setEditorOpen] = useState(false);
  const [editing, setEditing] = useState<PlaylistCarousel | null>(null);
  const [deleting, setDeleting] = useState<PlaylistCarousel | null>(null);

  const {
    data: carousels,
    isLoading,
    isFetching,
    isError,
    error,
  } = useListAdminPlaylistCarousels();

  const updateMutation = useUpdateAdminPlaylistCarousel({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: getListAdminPlaylistCarouselsQueryKey(),
        });
      },
    },
  });

  const deleteMutation = useDeleteAdminPlaylistCarousel({
    mutation: {
      onSuccess: () => {
        void queryClient.invalidateQueries({
          queryKey: getListAdminPlaylistCarouselsQueryKey(),
        });
        setDeleting(null);
        toast.success("Carrusel eliminado; las playlists permanecen intactas");
      },
      onError: (error) => {
        toast.error(error instanceof Error ? error.message : "No se pudo eliminar el carrusel");
      },
    },
  });

  const playlistBySlug = useMemo(
    () => new Map(playlists.map((playlist) => [playlist.slug, playlist])),
    [playlists],
  );

  const grouped = useMemo(() => {
    const rows = carousels ?? [];
    return SURFACES.map((surface) => ({
      ...surface,
      rows: rows
        .filter((carousel) => carousel.surface === surface.value)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id),
    }));
  }, [carousels]);

  const openCreate = () => {
    setEditing(null);
    setEditorOpen(true);
  };

  const openEdit = (carousel: PlaylistCarousel) => {
    setEditing(carousel);
    setEditorOpen(true);
  };

  const closeEditor = () => {
    setEditorOpen(false);
    setEditing(null);
  };

  const toggleActive = async (carousel: PlaylistCarousel) => {
    try {
      await updateMutation.mutateAsync({
        id: carousel.id,
        data: {
          title: carousel.title,
          surface: carousel.surface,
          sortOrder: carousel.sortOrder,
          isActive: !carousel.isActive,
          playlistIds: carousel.playlistIds,
        },
      });
      toast.success(carousel.isActive ? "Carrusel oculto" : "Carrusel visible");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "No se pudo cambiar la visibilidad");
    }
  };

  const handleSaved = () => {
    void queryClient.invalidateQueries({
      queryKey: getListAdminPlaylistCarouselsQueryKey(),
    });
  };

  return (
    <section className="space-y-6" aria-labelledby="playlist-carousels-heading">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h2 id="playlist-carousels-heading" className="text-xl font-semibold text-foreground">
            Carruseles editoriales
          </h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Agrupa playlists para Descubrir y Dormir. Una playlist puede formar parte de varios
            carruseles, con un orden independiente en cada uno.
          </p>
        </div>
        <Button onClick={openCreate} className="shrink-0 gap-2">
          <Plus className="h-4 w-4" />
          Nuevo carrusel
        </Button>
      </div>

      {isError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground">
          No se pudieron cargar los carruseles.{" "}
          {error instanceof Error ? error.message : "Intenta de nuevo más tarde."}
          {carousels && " Se conserva la última lista válida."}
        </div>
      )}

      {isLoading || playlistsLoading ? (
        <div className="flex items-center justify-center rounded-xl border border-border py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : !carousels || carousels.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center text-muted-foreground">
          <Layers3 className="mb-3 h-10 w-10 opacity-30" />
          <p className="font-medium text-foreground">Aún no hay carruseles</p>
          <p className="mt-1 max-w-md text-sm">
            Crea la primera agrupación para publicar playlists en Descubrir o Dormir.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {grouped.map((surface) => (
            <div key={surface.value} className="space-y-3">
              <div className="flex items-center gap-3">
                <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-primary">
                  {surface.label}
                </h3>
                <span className="h-px flex-1 bg-border" />
                <span className="text-xs text-muted-foreground">
                  {surface.rows.length} {surface.rows.length === 1 ? "carrusel" : "carruseles"}
                </span>
              </div>
              {surface.rows.length === 0 ? (
                <p className="rounded-lg border border-dashed border-border px-4 py-5 text-sm text-muted-foreground">
                  No hay carruseles en esta pantalla.
                </p>
              ) : (
                <div className="grid gap-4 xl:grid-cols-2">
                  {surface.rows.map((carousel) => (
                    <div
                      key={carousel.id}
                      className={`rounded-xl border bg-card p-5 transition-colors ${
                        carousel.isActive ? "border-border" : "border-border/70 opacity-75"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <h4 className="truncate font-semibold text-foreground">
                              {carousel.title}
                            </h4>
                            <Badge variant={carousel.isActive ? "default" : "secondary"}>
                              {carousel.isActive ? "Visible" : "Oculto"}
                            </Badge>
                          </div>
                          <p className="mt-1 text-xs text-muted-foreground">
                            Orden {carousel.sortOrder} · {carousel.playlistIds.length}{" "}
                            {carousel.playlistIds.length === 1 ? "playlist" : "playlists"}
                          </p>
                        </div>
                        <div className="flex shrink-0 items-center gap-1">
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => openEdit(carousel)}
                            aria-label={`Editar ${carousel.title}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8"
                            onClick={() => void toggleActive(carousel)}
                            disabled={updateMutation.isPending}
                            aria-label={carousel.isActive ? `Ocultar ${carousel.title}` : `Mostrar ${carousel.title}`}
                          >
                            {carousel.isActive ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => setDeleting(carousel)}
                            aria-label={`Eliminar ${carousel.title}`}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-wrap gap-2">
                        {carousel.playlistIds.length === 0 ? (
                          <span className="text-sm text-muted-foreground">
                            Sin playlists seleccionadas. No se mostrará un encabezado vacío.
                          </span>
                        ) : (
                          carousel.playlistIds.map((slug) => (
                            <span
                              key={slug}
                              className="inline-flex max-w-full items-center gap-2 rounded-md border border-border bg-secondary/50 px-2 py-1 text-xs text-foreground"
                            >
                              {playlistBySlug.get(slug)?.coverUrl && (
                                <img
                                  src={playlistBySlug.get(slug)?.coverUrl ?? ""}
                                  alt=""
                                  className="h-5 w-5 rounded object-cover"
                                />
                              )}
                              <span className="max-w-[15rem] truncate">
                                {playlistBySlug.get(slug)?.title ?? slug}
                              </span>
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {isFetching && !isLoading && (
        <p className="text-right text-xs text-muted-foreground">Actualizando carruseles…</p>
      )}

      <Dialog open={editorOpen} onOpenChange={(open) => !open && closeEditor()}>
        <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar carrusel" : "Nuevo carrusel"}</DialogTitle>
          </DialogHeader>
          <PlaylistCarouselForm
            key={editing?.id ?? "new"}
            initial={editing}
            playlists={playlists}
            onCancel={closeEditor}
            onSaved={handleSaved}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar carrusel</DialogTitle>
          </DialogHeader>
          <p className="text-sm leading-6 text-muted-foreground">
            Vas a eliminar únicamente la agrupación{" "}
            <span className="font-medium text-foreground">“{deleting?.title}”</span>. Sus
            playlists, sesiones, portadas y referencias guardadas permanecerán intactas.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => setDeleting(null)}
              disabled={deleteMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleting && deleteMutation.mutate({ id: deleting.id })}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Eliminar agrupación
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}