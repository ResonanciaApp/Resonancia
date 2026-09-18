import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  useDeleteAdminHeroOverride,
  useListAdminHeroOverrides,
  usePublishAdminHeroOverride,
  useRequestHeroOverrideUpload,
  useUnpublishAdminHeroOverride,
  useUpsertAdminHeroOverride,
  useUpdateAdminHeroOverride,
  getListAdminHeroOverridesQueryKey,
} from "@workspace/api-client-react";
import type { AdminHeroOverride, HeroOverrideContent } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import {
  AlertCircle, Film, Image as ImageIcon, Loader2, Trash2, UploadCloud,
} from "lucide-react";
import { getApiErrorMessage, getApiErrorStatus } from "./apiError";
import { AdminInspirationWeek } from "./types";

const imageTypes = ["image/jpeg", "image/png", "image/webp"] as const;
const videoTypes = ["video/mp4", "video/webm"] as const;
const acceptedTypes = [...imageTypes, ...videoTypes];
type MediaType = (typeof acceptedTypes)[number];

function isVideo(contentType: string) {
  return contentType.startsWith("video/");
}

export function HeroOverrideEditor({
  date,
  weekData,
  onDirtyChange,
}: {
  date: string;
  weekData?: AdminInspirationWeek;
  onDirtyChange?: (dirty: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const { data: overrides, isLoading } = useListAdminHeroOverrides();
  const upload = useRequestHeroOverrideUpload();
  const upsert = useUpsertAdminHeroOverride();
  const update = useUpdateAdminHeroOverride();
  const publish = usePublishAdminHeroOverride();
  const unpublish = useUnpublishAdminHeroOverride();
  const remove = useDeleteAdminHeroOverride();
  const [local, setLocal] = useState<HeroOverrideContent | null>(null);
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [conflict, setConflict] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const override = useMemo(
    () => (overrides as AdminHeroOverride[] | undefined)?.find((item) => item.date === date) ?? null,
    [overrides, date],
  );
  const fallbackPath = weekData?.days?.find((day) => day.date === date)?.inspiration?.published?.imagePath;

  useEffect(() => {
    setLocal(override?.draft ?? null);
    setLocalPreviewUrl(null);
    setDirty(false);
    setConflict(false);
  }, [date, override?.id, override?.revision]);

  useEffect(() => onDirtyChange?.(dirty || uploading), [dirty, uploading, onDirtyChange]);

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getListAdminHeroOverridesQueryKey() });
  };

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!acceptedTypes.includes(file.type as MediaType)) {
      toast.error("Formato no permitido. Usa JPEG, PNG, WebP, MP4 o WebM.");
      return;
    }
    const maxBytes = isVideo(file.type) ? 100 * 1024 * 1024 : 15 * 1024 * 1024;
    if (file.size > maxBytes) {
      toast.error(isVideo(file.type) ? "El video supera el máximo de 100 MiB." : "La imagen supera el máximo de 15 MiB.");
      return;
    }
    try {
      setUploading(true);
      setProgress(0);
      const result = await upload.mutateAsync({
        data: { name: file.name, size: file.size, contentType: file.type as MediaType },
      });
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;
        xhr.open("PUT", result.uploadURL);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.upload.onprogress = (event) => event.lengthComputable && setProgress(Math.round(event.loaded / event.total * 100));
        xhr.onload = () => xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error("Error al subir el archivo"));
        xhr.onerror = () => reject(new Error("Error de red durante la subida"));
        xhr.onabort = () => reject(new Error("Subida cancelada"));
        xhr.send(file);
      });
      setLocal({
        media: {
          type: isVideo(file.type) ? "video" : "image",
          objectPath: result.objectPath,
          contentType: file.type as MediaType,
          sizeBytes: file.size,
          generation: null,
        },
        title: local?.title ?? null,
      });
      setLocalPreviewUrl(URL.createObjectURL(file));
      setDirty(true);
      toast.success("Media subida");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "No se pudo subir el archivo"));
    } finally {
      setUploading(false);
      setProgress(0);
      xhrRef.current = null;
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const save = async () => {
    if (!local) {
      toast.error("Sube una imagen o vídeo antes de guardar.");
      return;
    }
    try {
      if (override) {
        await update.mutateAsync({
          id: override.id,
          data: { date, revision: override.revision, draft: local },
        });
      } else {
        await upsert.mutateAsync({ data: { date, draft: local } });
      }
      setDirty(false);
      setConflict(false);
      invalidate();
      toast.success("Borrador del hero guardado");
    } catch (error) {
      if (getApiErrorStatus(error) === 409) {
        setConflict(true);
        toast.error("Hay una revisión más reciente. Recarga los datos antes de sobrescribir.");
      } else toast.error(getApiErrorMessage(error, "No se pudo guardar el hero"));
    }
  };

  const action = async (kind: "publish" | "unpublish" | "delete") => {
    if (!override) return;
    try {
      const data = { id: override.id, data: { revision: override.revision } };
      if (kind === "publish") await publish.mutateAsync(data);
      if (kind === "unpublish") await unpublish.mutateAsync(data);
      if (kind === "delete") {
        if (!window.confirm("¿Eliminar el override del hero para este día?")) return;
        await remove.mutateAsync(data);
        setLocal(null);
      }
      invalidate();
      toast.success(kind === "publish" ? "Hero publicado" : kind === "unpublish" ? "Hero despublicado" : "Override eliminado");
    } catch (error) {
      if (getApiErrorStatus(error) === 409) {
        setConflict(true);
        toast.error("Conflicto de revisión. Recarga y revisa la versión actual.");
        invalidate();
      } else toast.error(getApiErrorMessage(error, "No se pudo completar la acción"));
    }
  };

  const preview = localPreviewUrl
    ?? (local?.media.objectPath
      ? `/api/admin/heroes/asset?objectPath=${encodeURIComponent(local.media.objectPath)}`
      : null);
  const previewContent = local?.media;
  const status = override?.deleted ? "Eliminado · guarda para restaurar" : override?.published ? "Publicado" : override?.draft ? "Borrador" : "Usa Inspiración diaria por defecto";
  const pending = upsert.isPending || update.isPending || publish.isPending || unpublish.isPending || remove.isPending;

  return (
    <section className="rounded-xl border border-border bg-card shadow-sm">
      <div className="border-b border-border bg-muted/20 px-6 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 text-lg font-semibold"><Film className="h-5 w-5 text-primary" />Hero de Inicio</h2>
            <p className="mt-1 text-sm text-muted-foreground">Contenido del hero para el {date}. Si no hay override publicado, la app usa Inspiración diaria.</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-medium ${override?.published ? "bg-emerald-500/10 text-emerald-600" : override?.draft ? "bg-amber-500/10 text-amber-600" : "bg-muted text-muted-foreground"}`}>{status}</span>
        </div>
      </div>
      <div className="grid gap-6 p-6 lg:grid-cols-[1fr_280px]">
        <div className="space-y-4">
          <div className="rounded-lg border border-dashed border-border p-4">
            <Label>Media del hero</Label>
            <p className="mt-1 text-xs text-muted-foreground">JPEG, PNG o WebP hasta 15 MiB · MP4 o WebM hasta 100 MiB</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Button type="button" variant="outline" onClick={() => inputRef.current?.click()} disabled={uploading || pending}><UploadCloud className="mr-2 h-4 w-4" />{previewContent ? "Reemplazar media" : "Subir media"}</Button>
              {uploading && <Button type="button" variant="ghost" onClick={() => xhrRef.current?.abort()}>Cancelar ({progress}%)</Button>}
            </div>
            {uploading && <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>}
            <input ref={inputRef} type="file" className="hidden" accept={acceptedTypes.join(",")} onChange={handleFile} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`hero-title-${date}`}>Título (opcional)</Label>
            <input id={`hero-title-${date}`} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={local?.title ?? ""} onChange={(event) => { setLocal((current) => current ? { ...current, title: event.target.value || null } : current); setDirty(true); }} placeholder="Título del hero" />
          </div>
          {conflict && <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"><AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />Otra persona modificó este hero. Recarga la página para revisar la revisión más reciente antes de guardar.</div>}
          <div className="flex flex-wrap gap-2">
            <Button onClick={save} disabled={!dirty || !local || pending || uploading}>Guardar borrador</Button>
            {override?.published ? <Button variant="outline" onClick={() => action("unpublish")} disabled={pending}>Despublicar</Button> : override?.draft && !override.deleted && <Button variant="secondary" onClick={() => action("publish")} disabled={pending || dirty}>Publicar</Button>}
            {override && <Button variant="destructive" onClick={() => action("delete")} disabled={pending}><Trash2 className="mr-2 h-4 w-4" />Eliminar</Button>}
            {pending && <Loader2 className="h-5 w-5 animate-spin self-center text-muted-foreground" />}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Vista previa</Label>
          <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-muted">
            {previewContent?.type === "video" && preview ? <video key={preview} src={preview} poster={fallbackPath ? `/api/admin/inspirations/image?objectPath=${encodeURIComponent(fallbackPath)}` : undefined} controls className="h-full w-full object-cover" /> : previewContent?.type === "image" && preview ? <img src={preview} alt="Vista previa del hero" className="h-full w-full object-cover" /> : fallbackPath ? <><img src={`/api/admin/inspirations/image?objectPath=${encodeURIComponent(fallbackPath)}`} alt="Inspiración diaria usada como fallback" className="h-full w-full object-cover" /><span className="absolute inset-x-2 bottom-2 rounded bg-black/70 px-2 py-1 text-center text-xs text-white">Se mostrará la imagen de Inspiración diaria</span></> : <div className="flex h-full flex-col items-center justify-center gap-2 p-4 text-center text-muted-foreground"><ImageIcon className="h-8 w-8" /><span className="text-xs">Sin media. Se usará el fallback de Inspiración diaria.</span></div>}
          </div>
          {previewContent?.type === "video" && <p className="text-xs text-muted-foreground">Si el vídeo no puede reproducirse, la app muestra la imagen de Inspiración diaria de este día.</p>}
          {isLoading && <p className="text-xs text-muted-foreground">Cargando estado del hero…</p>}
        </div>
      </div>
    </section>
  );
}