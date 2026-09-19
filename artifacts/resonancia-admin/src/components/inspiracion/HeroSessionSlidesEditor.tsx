import React, { useEffect, useState } from "react";
import {
  getGetAdminHeroSessionSlidesQueryKey,
  useGetAdminHeroSessionSlides,
  useGetCatalog,
  useUpdateAdminHeroSessionSlides,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

type DraftSlide = { position: 2 | 3 | 4; sessionId: string; title: string; description: string; actionLabel: string };

const fallback: DraftSlide[] = [2, 3, 4].map((position) => ({ position: position as 2 | 3 | 4, sessionId: "", title: "", description: "", actionLabel: "Escuchar" }));

function previewUrl(path: string | null | undefined) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/objects/")) return path.replace(/^\/objects\//, "/api/storage/objects/");
  return path.startsWith("/") ? path : null;
}

export function HeroSessionSlidesEditor({ onDirtyChange }: { onDirtyChange?: (dirty: boolean) => void }) {
  const queryClient = useQueryClient();
  const { data } = useGetAdminHeroSessionSlides();
  const { data: catalog } = useGetCatalog();
  const update = useUpdateAdminHeroSessionSlides();
  const [slides, setSlides] = useState<DraftSlide[]>(fallback);
  const [search, setSearch] = useState<Record<2 | 3 | 4, string>>({ 2: "", 3: "", 4: "" });
  const [revision, setRevision] = useState(0);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (!data) return;
    setRevision(data.revision);
    setSlides(data.draft.length === 3 ? data.draft.map((slide) => ({ ...slide, description: slide.description ?? "", position: slide.position as 2 | 3 | 4 })) : fallback);
    setDirty(false);
  }, [data?.revision]);
  useEffect(() => onDirtyChange?.(dirty), [dirty, onDirtyChange]);

  const sessions = (catalog?.sessions ?? []).filter((session) => session.status === "published");
  const save = async () => {
    if (slides.some((slide) => !slide.sessionId || !slide.title.trim() || !slide.actionLabel.trim())) {
      toast.error("Completa las tres sesiones, títulos y botones.");
      return;
    }
    try {
      const result = await update.mutateAsync({ data: { revision, slides } });
      setRevision(result.revision);
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: getGetAdminHeroSessionSlidesQueryKey() });
      toast.success("Slides del Hero guardados");
    } catch {
      toast.error("No se pudieron guardar los slides. Recarga y vuelve a intentarlo.");
    }
  };

  return (
    <details className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <summary className="cursor-pointer text-sm font-semibold" data-testid="toggle-session-hero-slides">Slides 2–4 del Hero</summary>
      <p className="mt-1 text-xs text-muted-foreground">Elige sesiones publicadas. La portada y la píldora se toman automáticamente de cada sesión.</p>
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {slides.map((slide, index) => {
          const session = sessions.find((item) => item.id === slide.sessionId);
          const cover = previewUrl(session?.imageUrl ?? session?.imageKey);
          const query = search[slide.position].trim().toLocaleLowerCase("es");
          const filteredSessions = query
            ? sessions.filter((item) => `${item.categoryLabel} ${item.title}`.toLocaleLowerCase("es").includes(query))
            : sessions;
          return (
            <div key={slide.position} className="space-y-3 rounded-lg border border-border p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Slide {slide.position}</p>
              <div className="space-y-1">
                <Label htmlFor={`hero-session-${slide.position}`}>Sesión</Label>
                <input
                  type="search"
                  value={search[slide.position]}
                  onChange={(event) => setSearch((current) => ({ ...current, [slide.position]: event.target.value }))}
                  placeholder="Buscar por sesión o categoría"
                  className="h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                  data-testid={`input-search-hero-session-${slide.position}`}
                />
                <select
                  id={`hero-session-${slide.position}`}
                  className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
                  value={slide.sessionId}
                  data-testid={`select-hero-session-${slide.position}`}
                  onChange={(event) => {
                    const next = sessions.find((item) => item.id === event.target.value);
                    setSlides((current) => current.map((item, i) => i === index ? { ...item, sessionId: event.target.value, title: item.title || next?.title || "" } : item));
                    setDirty(true);
                  }}
                >
                  <option value="">Seleccionar sesión…</option>
                  {session && !filteredSessions.some((item) => item.id === session.id) && (
                    <option value={session.id}>{session.categoryLabel} · {session.title}</option>
                  )}
                  {filteredSessions.map((item) => <option key={item.id} value={item.id}>{item.categoryLabel} · {item.title}</option>)}
                </select>
              </div>
              {session && <p className="text-xs text-muted-foreground">Píldora automática: {session.categoryLabel}</p>}
              {slide.sessionId && !session && (
                <p className="text-xs font-medium text-destructive" data-testid={`status-hero-session-unavailable-${slide.position}`}>
                  Esta sesión ya no está disponible. Elige otra para poder guardar.
                </p>
              )}
              <div className="space-y-1">
                <Label htmlFor={`hero-session-title-${slide.position}`}>Título</Label>
                <input id={`hero-session-title-${slide.position}`} data-testid={`input-hero-title-${slide.position}`} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={slide.title} onChange={(event) => { setSlides((current) => current.map((item, i) => i === index ? { ...item, title: event.target.value } : item)); setDirty(true); }} />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`hero-session-description-${slide.position}`}>Descripción</Label>
                <textarea
                  id={`hero-session-description-${slide.position}`}
                  data-testid={`input-hero-description-${slide.position}`}
                  className="min-h-20 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm"
                  maxLength={300}
                  placeholder="Texto opcional debajo del título"
                  value={slide.description}
                  onChange={(event) => {
                    setSlides((current) => current.map((item, i) => i === index ? { ...item, description: event.target.value } : item));
                    setDirty(true);
                  }}
                />
              </div>
              <div className="space-y-1">
                <Label htmlFor={`hero-session-action-${slide.position}`}>Texto del botón</Label>
                <input id={`hero-session-action-${slide.position}`} data-testid={`input-hero-action-${slide.position}`} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={slide.actionLabel} onChange={(event) => { setSlides((current) => current.map((item, i) => i === index ? { ...item, actionLabel: event.target.value } : item)); setDirty(true); }} />
              </div>
              {session && (
                <div className="relative aspect-video overflow-hidden rounded-md border border-border bg-muted" data-testid={`preview-hero-session-${slide.position}`}>
                  {cover ? (
                    <img src={cover} alt={`Vista previa de ${session.title}`} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center px-4 text-center text-xs text-muted-foreground">
                      {session.imageUrl || session.imageKey ? "Portada incluida en la app móvil" : "Esta sesión no tiene portada"}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent" />
                  <div className="absolute inset-x-3 bottom-3 text-white">
                    <span className="rounded-full bg-white/15 px-2 py-1 text-[10px] font-medium uppercase tracking-wide">{session.categoryLabel}</span>
                    <p className="mt-2 line-clamp-2 text-sm font-semibold">{slide.title || session.title}</p>
                    {slide.description && <p className="mt-1 line-clamp-2 text-[11px] text-white/85">{slide.description}</p>}
                    <span className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-black">{slide.actionLabel || "Escuchar"}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <Button className="mt-4" onClick={save} disabled={!dirty || update.isPending} data-testid="button-save-hero-session-slides">Guardar slides</Button>
    </details>
  );
}