import React, { useEffect, useRef, useState } from "react";
import {
  getGetAdminHeroSessionSlidesQueryKey,
  useGetAdminHeroSessionSlides,
  useGetCatalog,
  useListAdminHeroDestinations,
  useRequestHeroOverrideUpload,
  useUpdateAdminHeroSessionSlides,
} from "@workspace/api-client-react";
import type { HeroDestinationOptions, HeroOverrideUploadBodyContentType, HeroSessionSlideInput } from "@workspace/api-client-react";
import { useAuth } from "@clerk/react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export const HERO_DESTINATION_TYPES = ["session", "category", "category-internal", "sleep", "sleep-internal", "sounds", "sounds-internal", "mixer", "topics", "topics-internal"] as const;
type DestinationType = (typeof HERO_DESTINATION_TYPES)[number];
type Destination = { id: string; label: string; parentId?: string; source?: "legacy" | "editorial"; type?: DestinationType };
type DraftSlide = {
  position: 2 | 3 | 4; enabled: boolean; sessionId: string; title: string;
  description: string; pillLabel: string; actionLabel: string;
  destinationType: DestinationType; destinationId?: string; destinationParentId?: string; destinationSource?: "legacy" | "editorial"; imageObjectPath?: string; imageUrl?: string;
};
const fallback: DraftSlide[] = [2, 3, 4].map((position) => ({
  position: position as 2 | 3 | 4, enabled: true, sessionId: "", title: "", description: "",
  pillLabel: "", actionLabel: "Escuchar", destinationType: "session",
}));
const destinationNames: Record<DestinationType, string> = {
  session: "Sesión", category: "Categoría", "category-internal": "Pantalla de categoría",
  sleep: "Dormir", "sleep-internal": "Pantalla de Dormir", sounds: "Sonidos",
  "sounds-internal": "Pantalla de Sonidos", mixer: "Mezclador", topics: "Explora por objetivo",
  "topics-internal": "Pantallas Explora por objetivo",
};
function previewUrl(path?: string | null) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/objects/")) return `/api/storage${path}`;
  return path.startsWith("/") ? path : null;
}
function normalizeDestinations(value: any): Destination[] {
  const source = value?.destinations ?? value?.groups ?? value ?? [];
  if (Array.isArray(source) && source.every((item) => item?.destinationType && Array.isArray(item?.options))) {
    return source.flatMap((group) => group.options.map((item: Destination) => ({ ...item, type: group.destinationType })));
  }
  if (Array.isArray(source)) return source.map((item) => ({ ...item, label: item.label ?? item.title ?? item.name }));
  return Object.entries(source).flatMap(([type, items]: [string, any]) =>
    Array.isArray(items) ? items.map((item) => ({ ...item, type, label: item.label ?? item.title ?? item.name })) : []);
}

export function HeroSessionSlidesEditor({ onDirtyChange }: { onDirtyChange?: (dirty: boolean) => void }) {
  const queryClient = useQueryClient();
  const { getToken } = useAuth();
  const { data } = useGetAdminHeroSessionSlides();
  const { data: catalog } = useGetCatalog();
  const update = useUpdateAdminHeroSessionSlides();
  const upload = useRequestHeroOverrideUpload();
  const { data: destinationGroups, isError: destinationsError } = useListAdminHeroDestinations();
  const [slides, setSlides] = useState<DraftSlide[]>(fallback);
  const [revision, setRevision] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [previewUrls, setPreviewUrls] = useState<Record<number, string | null>>({});
  const previewUrlsRef = useRef<Record<number, string | null>>({});
  const [uploading, setUploading] = useState<Record<number, number | undefined>>({});
  const inputRefs = useRef<Record<number, HTMLInputElement | null>>({});

  useEffect(() => {
    if (!data) return;
    setRevision(data.revision);
    setSlides(data.draft.length === 3 ? data.draft.map((slide) => ({
      ...slide, enabled: slide.enabled ?? true, description: slide.description ?? "",
      pillLabel: slide.pillLabel ?? "", position: slide.position as 2 | 3 | 4,
      destinationType: slide.destinationType ?? "session",
      sessionId: slide.sessionId ?? (slide.destinationType === "session" ? slide.destinationId ?? "" : ""), destinationId: slide.destinationId ?? "", destinationSource: slide.destinationSource,
    })) : fallback);
    setDirty(false);
  }, [data?.revision]);
  useEffect(() => { onDirtyChange?.(dirty || Object.keys(uploading).length > 0); }, [dirty, uploading, onDirtyChange]);
  useEffect(() => {
    setDestinations(normalizeDestinations(destinationGroups as HeroDestinationOptions[] | undefined));
  }, [destinationGroups]);
  useEffect(() => {
    if (destinationsError) toast.error("No se pudieron cargar los destinos del Hero.");
  }, [destinationsError]);
  useEffect(() => {
    let cancelled = false;
    const loadImages = async () => {
      const token = await getToken();
      if (!token) return;
      await Promise.all(slides.map(async (slide, index) => {
        if (!slide.imageObjectPath || previewUrls[index]) return;
        try {
          const response = await fetch(`/api/admin/heroes/asset?objectPath=${encodeURIComponent(slide.imageObjectPath)}`, { headers: { Authorization: `Bearer ${token}` } });
          if (!response.ok) return;
          const url = URL.createObjectURL(await response.blob());
          if (!cancelled) setPreview(index, url);
        } catch { /* preview is optional; save validation still applies */ }
      }));
    };
    void loadImages();
    return () => { cancelled = true; };
  }, [getToken, slides, previewUrls]);

  const sessions = (catalog?.sessions ?? []).filter((session) => session.status === "published");
  const setPreview = (index: number, url: string | null) => {
    const previous = previewUrlsRef.current[index];
    if (previous && previous !== url) URL.revokeObjectURL(previous);
    previewUrlsRef.current = { ...previewUrlsRef.current, [index]: url };
    setPreviewUrls((current) => ({ ...current, [index]: url }));
  };
  useEffect(() => () => {
    Object.values(previewUrlsRef.current).forEach((url) => url && URL.revokeObjectURL(url));
  }, []);
  const setSlide = (index: number, patch: Partial<DraftSlide>) => {
    setSlides((current) => current.map((item, i) => i === index ? { ...item, ...patch } : item));
    setDirty(true);
  };
  const uploadImage = async (index: number, file?: File) => {
    if (!file) return;
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) { toast.error("Usa una imagen JPEG, PNG o WebP."); return; }
    if (file.size > 15 * 1024 * 1024) { toast.error("La imagen supera el máximo de 15 MiB."); return; }
    const previousPreview = previewUrlsRef.current[index] ?? null;
    const nextPreview = URL.createObjectURL(file);
    try {
      previewUrlsRef.current = { ...previewUrlsRef.current, [index]: nextPreview };
      setPreviewUrls((current) => ({ ...current, [index]: nextPreview }));
      setUploading((current) => ({ ...current, [index]: 0 }));
      const result = await upload.mutateAsync({ data: { name: file.name, size: file.size, contentType: file.type as HeroOverrideUploadBodyContentType } });
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest(); xhr.open("PUT", result.uploadURL);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (event) => event.lengthComputable && setUploading((current) => ({ ...current, [index]: Math.round(event.loaded / event.total * 100) }));
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error());
        xhr.onerror = () => reject(new Error()); xhr.send(file);
      });
      if (previousPreview) URL.revokeObjectURL(previousPreview);
      setSlide(index, { imageObjectPath: result.objectPath, imageUrl: undefined });
      toast.success(`Imagen del slide ${index + 2} cargada`);
    } catch {
      URL.revokeObjectURL(nextPreview);
      previewUrlsRef.current = { ...previewUrlsRef.current, [index]: previousPreview };
      setPreviewUrls((current) => ({ ...current, [index]: previousPreview }));
      toast.error("No se pudo subir la imagen; se conservó la imagen anterior.");
    }
    finally { if (inputRefs.current[index]) inputRefs.current[index]!.value = ""; setUploading((current) => { const next = { ...current }; delete next[index]; return next; }); }
  };
  const save = async () => {
    if (Object.keys(uploading).length) { toast.error("Espera a que terminen las cargas."); return; }
    if (slides.some((slide) => !slide.title.trim() || !slide.actionLabel.trim())) { toast.error("Completa títulos y botones."); return; }
    if (slides.some((slide) => slide.enabled && !slide.pillLabel.trim())) { toast.error("Completa el texto de la píldora en cada slide activo."); return; }
    if (slides.some((slide) => slide.enabled && slide.destinationType !== "session" && !slide.imageObjectPath)) { toast.error("Los destinos que no son sesiones necesitan una imagen propia."); return; }
    const needsDestinationId = (type: DestinationType) => type === "session" || type === "category" || type === "category-internal" || type === "sleep-internal" || type === "sounds-internal" || type === "topics-internal";
    const isAvailable = (slide: DraftSlide) => {
      if (slide.destinationType === "topics") return !slide.destinationId || destinations.some((item) => item.type === "topics" && item.id === slide.destinationId);
      if (!needsDestinationId(slide.destinationType)) return true;
      if (slide.destinationType === "session") return sessions.some((item) => item.id === slide.sessionId);
      const options = destinations.filter((item) => item.type === slide.destinationType);
      if (slide.destinationType === "category-internal") return destinations.some((item) => item.type === "category" && item.id === slide.destinationParentId) && options.some((item) => item.id === slide.destinationId && item.parentId === slide.destinationParentId && (!slide.destinationSource || item.source === slide.destinationSource));
      if (slide.destinationType === "topics-internal") return destinations.some((item) => item.type === "topics" && item.id === slide.destinationParentId) && options.some((item) => item.id === slide.destinationId && item.parentId === slide.destinationParentId);
      return options.some((item) => item.id === slide.destinationId);
    };
    if (slides.some((slide) => !isAvailable(slide))) { toast.error("Hay un destino seleccionado que ya no está disponible. Elige otra opción."); return; }
    try {
      const payloadSlides: HeroSessionSlideInput[] = slides.map((slide) => ({
        position: slide.position,
        enabled: slide.enabled,
        title: slide.title,
        description: slide.description,
        pillLabel: slide.pillLabel,
        actionLabel: slide.actionLabel,
        destinationType: slide.destinationType,
        ...(slide.destinationType === "session" ? { sessionId: slide.sessionId, destinationId: slide.sessionId } : slide.destinationId ? { destinationId: slide.destinationId } : {}),
        ...(slide.destinationParentId && (slide.destinationType === "category-internal" || slide.destinationType === "topics-internal") ? { destinationParentId: slide.destinationParentId } : {}),
        ...(slide.destinationType === "category-internal" && slide.destinationSource ? { destinationSource: slide.destinationSource } : {}),
        ...(slide.imageObjectPath ? { imageObjectPath: slide.imageObjectPath } : {}),
      }));
      const result = await update.mutateAsync({ data: { revision, slides: payloadSlides } });
      setRevision(result.revision); setDirty(false);
      queryClient.invalidateQueries({ queryKey: getGetAdminHeroSessionSlidesQueryKey() });
      toast.success("Slides del Hero guardados");
    } catch { toast.error("No se pudieron guardar los slides. Recarga y vuelve a intentarlo."); }
  };
  return (
    <details className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <summary className="cursor-pointer text-sm font-semibold" data-testid="toggle-session-hero-slides">Slides 2–4 del Hero</summary>
      <p className="mt-1 text-xs text-muted-foreground">Personaliza destino, píldora e imagen. Las sesiones conservan su portada como fallback.</p>
      {destinationsError && <p className="mt-2 rounded-md bg-destructive/10 px-2 py-1.5 text-xs text-destructive">No se pudieron cargar los destinos disponibles. Recarga el panel antes de publicar.</p>}
      <div className="mt-4 grid gap-4 lg:grid-cols-3">
        {slides.map((slide, index) => {
          const session = sessions.find((item) => item.id === slide.sessionId);
          const typeItems = destinations.filter((item) => item.type === slide.destinationType);
          const categoryParents = destinations.filter((item) => item.type === "category" && !item.parentId);
          const topicParents = destinations.filter((item) => item.type === "topics" && !item.parentId);
          const parents = slide.destinationType === "topics-internal" ? topicParents : categoryParents;
          const children = typeItems.filter((item) => item.parentId === slide.destinationParentId);
          const image = previewUrls[index] ?? previewUrl(slide.imageUrl) ?? (slide.destinationType === "session" ? previewUrl(session?.imageUrl ?? session?.imageKey) : null);
          const needsDestinationId = slide.destinationType === "session" || slide.destinationType === "category" || slide.destinationType === "category-internal" || slide.destinationType === "sleep-internal" || slide.destinationType === "sounds-internal" || slide.destinationType === "topics-internal";
          const unavailable = needsDestinationId && slide.destinationType !== "session" && !!slide.destinationId && !(slide.destinationType === "category-internal" ? destinations.some((item) => item.type === "category" && item.id === slide.destinationParentId) && children.some((item) => item.id === slide.destinationId && (!slide.destinationSource || item.source === slide.destinationSource)) : slide.destinationType === "topics-internal" ? destinations.some((item) => item.type === "topics" && item.id === slide.destinationParentId) && children.some((item) => item.id === slide.destinationId) : typeItems.some((item) => item.id === slide.destinationId));
          return <div key={slide.position} className="space-y-3 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between"><p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Slide {slide.position}</p>
              <label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={!slide.enabled} onChange={(e) => setSlide(index, { enabled: !e.target.checked })} data-testid={`checkbox-block-hero-slide-${slide.position}`} />Bloquear</label></div>
            <div className="space-y-1"><Label>Tipo de destino</Label><select className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm" value={slide.destinationType} onChange={(e) => setSlide(index, { destinationType: e.target.value as DestinationType, destinationId: "", destinationParentId: "", destinationSource: undefined, sessionId: "" })}>
              {HERO_DESTINATION_TYPES.map((type) => <option key={type} value={type}>{destinationNames[type]}</option>)}</select></div>
            {slide.destinationType === "session" ? <select className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm" value={slide.sessionId} onChange={(e) => { const next = sessions.find((item) => item.id === e.target.value); setSlide(index, { sessionId: e.target.value, destinationId: e.target.value, title: slide.title || next?.title || "" }); }} data-testid={`select-hero-session-${slide.position}`}><option value="">Seleccionar sesión…</option>{session && !sessions.some((item) => item.id === session.id) && <option value={session.id}>{session.title}</option>}{sessions.map((item) => <option key={item.id} value={item.id}>{item.categoryLabel} · {item.title}</option>)}</select>
              : needsDestinationId ? <>
                {(slide.destinationType === "category-internal" || slide.destinationType === "topics-internal") && <select className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm" value={slide.destinationParentId ?? ""} onChange={(e) => setSlide(index, { destinationParentId: e.target.value, destinationId: "", destinationSource: undefined })}><option value="">Seleccionar sección…</option>{parents.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>}
                <select className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm"
                  value={slide.destinationType === "category-internal" && slide.destinationId ? JSON.stringify([slide.destinationSource ?? "legacy", slide.destinationId]) : slide.destinationId ?? ""}
                  onChange={(e) => {
                    if (slide.destinationType === "category-internal" && e.target.value) {
                      const [source, id] = JSON.parse(e.target.value) as ["legacy" | "editorial", string];
                      setSlide(index, { destinationId: id, destinationSource: source });
                    } else setSlide(index, { destinationId: e.target.value, destinationSource: undefined });
                  }}>
                  <option value="">Seleccionar destino…</option>
                  {(slide.destinationType === "category-internal" || slide.destinationType === "topics-internal" ? children : typeItems).map((item) => <option key={`${item.source ?? ""}:${item.parentId ?? ""}:${item.id}`} value={slide.destinationType === "category-internal" ? JSON.stringify([item.source ?? "legacy", item.id]) : item.id}>{item.label}{slide.destinationType === "category-internal" ? ` (${item.source === "editorial" ? "Editorial" : "Clásica"})` : ""}</option>)}
                </select>
                {unavailable && <p className="text-xs text-destructive">Este destino ya no está disponible. Selecciona otro.</p>}
              </> : <p className="rounded-md bg-muted px-2 py-2 text-xs text-muted-foreground">Este destino abre su pantalla principal; no requiere seleccionar un elemento.</p>}
            {slide.destinationType === "topics" && <select className="h-10 w-full rounded-md border border-input bg-background px-2 text-sm" value={slide.destinationId ?? ""} onChange={(e) => setSlide(index, { destinationId: e.target.value || undefined })}><option value="">Portada de Explora por objetivo</option>{typeItems.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select>}
            <div className="space-y-1"><Label htmlFor={`hero-pill-${slide.position}`}>Texto de la píldora <span className="text-muted-foreground">({slide.pillLabel.length}/80)</span></Label><input id={`hero-pill-${slide.position}`} maxLength={80} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={slide.pillLabel} onChange={(e) => setSlide(index, { pillLabel: e.target.value })} data-testid={`input-hero-pill-${slide.position}`} />{slide.enabled && !slide.pillLabel.trim() && <p className="text-xs text-destructive">Escribe una etiqueta para publicar este slide.</p>}</div>
            <div className="space-y-1"><Label>Título</Label><input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={slide.title} onChange={(e) => setSlide(index, { title: e.target.value })} /></div>
            <div className="space-y-1"><Label>Descripción</Label><textarea maxLength={300} className="min-h-16 w-full rounded-md border border-input px-3 py-2 text-sm" value={slide.description} onChange={(e) => setSlide(index, { description: e.target.value })} /></div>
            <div className="space-y-1"><Label>Texto del botón</Label><input className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm" value={slide.actionLabel} onChange={(e) => setSlide(index, { actionLabel: e.target.value })} /></div>
            <div className="space-y-2"><Label>Imagen propia</Label><div className="flex gap-2"><Button type="button" variant="outline" onClick={() => inputRefs.current[index]?.click()} disabled={uploading[index] !== undefined}>{slide.imageObjectPath ? "Reemplazar imagen" : "Subir imagen"}</Button>{(slide.imageObjectPath || previewUrls[index]) && <Button type="button" variant="ghost" onClick={() => { setPreview(index, null); setSlide(index, { imageObjectPath: undefined, imageUrl: undefined }); }}>Quitar</Button>}</div><input ref={(element) => { inputRefs.current[index] = element; }} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={(e) => uploadImage(index, e.target.files?.[0])} />{uploading[index] !== undefined && <p className="text-xs text-muted-foreground">Subiendo imagen… {uploading[index]}%</p>}</div>
            <div className="relative aspect-video overflow-hidden rounded-md border border-border bg-muted" data-testid={`preview-hero-session-${slide.position}`}>{image ? <img src={image} alt={`Vista previa del slide ${slide.position}`} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center p-3 text-center text-xs text-muted-foreground">{slide.destinationType === "session" ? "La portada de la sesión se mostrará en la app." : "Este destino necesita una imagen propia."}</div>}<div className="absolute inset-0 bg-gradient-to-t from-black/75 to-transparent" /><div className="absolute inset-x-3 bottom-3 text-white">{slide.pillLabel && <span className="rounded-full bg-white/20 px-2 py-1 text-[10px]">{slide.pillLabel}</span>}<p className="mt-2 text-sm font-semibold">{slide.title || "Sin título"}</p><span className="mt-2 inline-flex rounded-full bg-white px-3 py-1 text-[10px] font-semibold text-black">{slide.actionLabel || "Escuchar"}</span></div></div>
          </div>;
        })}
      </div>
      <Button className="mt-4" onClick={save} disabled={!dirty || update.isPending || Object.keys(uploading).length > 0} data-testid="button-save-hero-session-slides">Guardar slides</Button>
    </details>
  );
}