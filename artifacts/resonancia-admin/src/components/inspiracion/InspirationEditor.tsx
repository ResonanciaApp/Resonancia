import React, { useState, useRef, useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import {
  useCreateAdminInspiration,
  useUpdateAdminInspiration,
  usePublishAdminInspiration,
  useUnpublishAdminInspiration,
  useDeleteAdminInspiration,
  useRequestInspirationUpload,
  getGetAdminInspirationWeekQueryKey,
  useGetCatalog,
} from "@workspace/api-client-react";
import { InspirationContent, AdminInspiration, AdminInspirationWeek } from "./types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { Save, UploadCloud, Eye, EyeOff, Trash2, Loader2, Music, AlertCircle } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { getApiErrorCurrentRevision, getApiErrorMessage, getApiErrorStatus } from "./apiError";

const schema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Formato YYYY-MM-DD"),
  quote: z.string().max(2000),
  author: z.string().max(200).nullable(),
  reflection: z.string().max(20000),
  imagePath: z.string().nullable(),
  imagePositionX: z.number().min(0).max(100),
  imagePositionY: z.number().min(0).max(100),
  overlayOpacity: z.number().min(0).max(0.85),
  sessionId: z.string().nullable(),
});

type FormValues = z.infer<typeof schema>;

export function InspirationEditor({
  date,
  inspiration,
  weekData,
  onDirtyChange,
  onCancel,
  onSaved,
}: {
  date: string;
  inspiration: AdminInspiration | null;
  weekData?: AdminInspirationWeek;
  onDirtyChange?: (isDirty: boolean) => void;
  onCancel?: () => void;
  onSaved?: (savedDate: string) => void;
}) {
  const queryClient = useQueryClient();
  const createInspiration = useCreateAdminInspiration();
  const updateInspiration = useUpdateAdminInspiration();
  const publishInspiration = usePublishAdminInspiration();
  const unpublishInspiration = useUnpublishAdminInspiration();
  const deleteInspiration = useDeleteAdminInspiration();
  const requestUpload = useRequestInspirationUpload();
  const { data: catalog } = useGetCatalog();

  const isEditing = !!inspiration;
  const draft = inspiration?.draft;

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const [previewView, setPreviewView] = useState<"portada" | "detalle">("portada");
  const [previewVersion, setPreviewVersion] = useState<"draft" | "published">("draft");
  const [serverConflict, setServerConflict] = useState<AdminInspiration | null>(null);
  const [conflictPending, setConflictPending] = useState(false);
  const [imageLoadFailed, setImageLoadFailed] = useState(false);
  const [imageRetry, setImageRetry] = useState(0);

  const defaultValues: FormValues = {
    date: date,
    quote: draft?.quote ?? "",
    author: draft?.author ?? "",
    reflection: draft?.reflection ?? "",
    imagePath: draft?.imagePath ?? null,
    imagePositionX: draft?.imagePositionX ?? 50,
    imagePositionY: draft?.imagePositionY ?? 50,
    overlayOpacity: draft?.overlayOpacity ?? 0.35,
    sessionId: draft?.sessionId ?? null,
  };

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  // Reset form when date or inspiration changes
  const initDate = useRef<string | null>(null);
  const initRevision = useRef<number | null>(null);

  useEffect(() => {
    // Si cambiamos de slot de fecha, siempre reseteamos
    if (date !== initDate.current) {
      form.reset({
        date: date,
        quote: inspiration?.draft?.quote ?? "",
        author: inspiration?.draft?.author ?? "",
        reflection: inspiration?.draft?.reflection ?? "",
        imagePath: inspiration?.draft?.imagePath ?? null,
        imagePositionX: inspiration?.draft?.imagePositionX ?? 50,
        imagePositionY: inspiration?.draft?.imagePositionY ?? 50,
        overlayOpacity: inspiration?.draft?.overlayOpacity ?? 0.35,
        sessionId: inspiration?.draft?.sessionId ?? null,
      });
      initDate.current = date;
      initRevision.current = inspiration?.revision ?? null;
      setServerConflict(null);
      setConflictPending(false);
    } else if (inspiration && inspiration.revision !== initRevision.current) {
      // Background refetch: solo reseteamos si NO hay conflicto (o si está limpio)
      if (!form.formState.isDirty && !serverConflict) {
        form.reset({
          date: date,
          quote: inspiration.draft.quote ?? "",
          author: inspiration.draft.author ?? "",
          reflection: inspiration.draft.reflection ?? "",
          imagePath: inspiration.draft.imagePath ?? null,
          imagePositionX: inspiration.draft.imagePositionX ?? 50,
          imagePositionY: inspiration.draft.imagePositionY ?? 50,
          overlayOpacity: inspiration.draft.overlayOpacity ?? 0.35,
          sessionId: inspiration.draft.sessionId ?? null,
        });
        initRevision.current = inspiration.revision;
      } else if (form.formState.isDirty && !serverConflict) {
        // Conflicto detectado en background
        setServerConflict(inspiration);
        setConflictPending(false);
      }
    }
  }, [date, inspiration, form, serverConflict]);

  // Si no hay versión publicada, forzamos draft
  useEffect(() => {
    if (!inspiration?.published && previewVersion === "published") {
      setPreviewVersion("draft");
    }
  }, [inspiration?.published, previewVersion]);

  useEffect(() => {
    setImageLoadFailed(false);
  }, [previewVersion, form.watch("imagePath"), inspiration?.published?.imagePath]);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const onFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      toast.error("El archivo supera el máximo de 15 MiB");
      return;
    }
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      toast.error("Formato no permitido. Usa JPEG, PNG o WebP.");
      return;
    }

    try {
      setUploading(true);
      setUploadProgress(0);

      // 1. Request upload URL
      const { uploadURL, objectPath } = await requestUpload.mutateAsync({
        data: {
          name: file.name,
          size: file.size,
          contentType: file.type as "image/jpeg" | "image/png" | "image/webp",
        }
      });

      // 2. Upload via XHR for progress
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;
        xhr.open("PUT", uploadURL);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.timeout = 60000; // 60s timeout

        xhr.upload.onprogress = (ev) => {
          if (ev.lengthComputable) {
            setUploadProgress(Math.round((ev.loaded / ev.total) * 100));
          }
        };
        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            resolve();
          } else {
            reject(new Error("Error al subir archivo"));
          }
        };
        xhr.onerror = () => reject(new Error("Error de red durante subida"));
        xhr.ontimeout = () => reject(new Error("Tiempo de espera agotado"));
        xhr.onabort = () => reject(new Error("Subida cancelada"));
        xhr.send(file);
      });

      // 3. Set the form value to the returned object path
      form.setValue("imagePath", objectPath, { shouldDirty: true });
      toast.success("Imagen subida");
    } catch (err: unknown) {
      toast.error(`Error al subir la imagen: ${getApiErrorMessage(err, "No se pudo completar la subida")}`);
    } finally {
      setUploading(false);
      setUploadProgress(0);
      xhrRef.current = null;
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleCancelUpload = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (xhrRef.current) {
      xhrRef.current.abort();
    }
  };

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getGetAdminInspirationWeekQueryKey() });
  };

  const toDraft = (data: FormValues): InspirationContent => ({
    quote: data.quote,
    author: data.author || null,
    reflection: data.reflection,
    imagePath: data.imagePath,
    imagePositionX: data.imagePositionX,
    imagePositionY: data.imagePositionY,
    overlayOpacity: data.overlayOpacity,
    sessionId: data.sessionId === "none" ? null : data.sessionId,
  });

  const saveDraft = (data: FormValues, explicitRevision?: number) => {
    const currentRev = explicitRevision ?? inspiration?.revision;
    
    if (isEditing && currentRev !== undefined) {
      updateInspiration.mutate({
        id: inspiration.id,
        data: {
          revision: currentRev,
          date: data.date,
          draft: toDraft(data),
        }
      }, {
        onSuccess: (saved) => {
          toast.success(inspiration.deleted ? "Borrador restaurado" : "Borrador guardado");
          setServerConflict(null);
          setConflictPending(false);
          initRevision.current = saved.revision;
          form.reset(data, { keepDirty: false });
          invalidate();
          onSaved?.(saved.date);
        },
        onError: (err: unknown) => {
          if (getApiErrorStatus(err) === 409) {
            const currentRevision = getApiErrorCurrentRevision(err);
            if (currentRevision !== undefined && currentRevision !== inspiration.revision) {
              setConflictPending(true);
              toast.error(getApiErrorMessage(err, "Otra edición más reciente existe. Elige qué versión conservar."));
              invalidate();
            } else {
              setConflictPending(false);
              toast.error(getApiErrorMessage(err, "La fecha ya está ocupada. Elige otra fecha."));
            }
          } else {
            toast.error(getApiErrorMessage(err, "Error al guardar"));
          }
        }
      });
    } else {
      createInspiration.mutate({
        data: {
          date: data.date,
          draft: toDraft(data),
        }
      }, {
        onSuccess: (saved) => {
          toast.success("Inspiración creada");
          form.reset(data, { keepDirty: false });
          invalidate();
          onSaved?.(saved.date);
        },
        onError: (err: unknown) => {
          toast.error(getApiErrorMessage(err, "Error al crear"));
        }
      });
    }
  };

  const onSaveDraft = (data: FormValues) => {
    if (serverConflict || conflictPending) {
      toast.error("Resuelve el conflicto antes de guardar.");
      return;
    }
    saveDraft(data);
  };

  const overwriteServerWithLocal = async () => {
    if (!serverConflict || !(await form.trigger())) return;
    saveDraft(form.getValues(), serverConflict.revision);
  };

  const onPublish = () => {
    if (!inspiration) return;
    
    // Validar antes de publicar
    const currentDraft = form.getValues();
    if (!currentDraft.imagePath || !currentDraft.quote || !currentDraft.reflection) {
      toast.error("Falta contenido esencial (imagen, frase, reflexión) para publicar.");
      setShowPublishConfirm(false);
      return;
    }

    // Si el formulario está sucio, debemos guardar primero o avisar.
    if (form.formState.isDirty) {
      toast.warning("Tienes cambios sin guardar. Guárdalos primero.");
      setShowPublishConfirm(false);
      return;
    }

    if (serverConflict) {
      toast.error("Hay un conflicto en el servidor, resuelve antes de publicar.");
      setShowPublishConfirm(false);
      return;
    }

    publishInspiration.mutate({
      id: inspiration.id,
      data: { revision: inspiration.revision }
    }, {
      onSuccess: () => {
        toast.success("Publicado correctamente");
        setShowPublishConfirm(false);
        invalidate();
      },
      onError: (err: unknown) => {
        if (getApiErrorStatus(err) === 409) {
          toast.error("Conflicto: Recarga e intenta de nuevo");
          invalidate();
        } else {
          toast.error(getApiErrorMessage(err, "Error al publicar"));
        }
      }
    });
  };

  const onUnpublish = () => {
    if (!inspiration || !inspiration.published) return;
    if (form.formState.isDirty) {
      if (!window.confirm("Tienes cambios sin guardar en el borrador. ¿Continuar con la despublicación?")) return;
    }
    unpublishInspiration.mutate({
      id: inspiration.id,
      data: { revision: inspiration.revision }
    }, {
      onSuccess: () => {
        toast.success("Despublicado correctamente");
        invalidate();
      },
      onError: (err: unknown) => {
        if (getApiErrorStatus(err) === 409) {
          toast.error("Conflicto: Recarga e intenta de nuevo");
          invalidate();
        } else {
          toast.error(getApiErrorMessage(err, "Error al despublicar"));
        }
      }
    });
  };

  const onDelete = () => {
    if (!inspiration) return;
    deleteInspiration.mutate({
      id: inspiration.id,
      data: { revision: inspiration.revision }
    }, {
      onSuccess: () => {
        toast.success("Inspiración eliminada (tombstone creado)");
        setShowDeleteConfirm(false);
        invalidate();
        if (onCancel) onCancel();
      },
      onError: (err: unknown) => {
        if (getApiErrorStatus(err) === 409) {
          toast.error("Conflicto: Recarga e intenta de nuevo");
          invalidate();
        } else {
          toast.error(getApiErrorMessage(err, "Error al eliminar"));
        }
      }
    });
  };

  const hasUnsavedChanges = form.formState.isDirty;
  
  useEffect(() => {
    if (onDirtyChange) {
      onDirtyChange(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges, onDirtyChange]);

  const isPending = updateInspiration.isPending || createInspiration.isPending;

  const currentImagePath = form.watch("imagePath");
  const posX = form.watch("imagePositionX");
  const posY = form.watch("imagePositionY");
  const opacity = form.watch("overlayOpacity");
  
  const targetPreview = previewVersion === "published" && inspiration?.published ? inspiration.published : form.watch();
  const previewImagePath = previewVersion === "published" ? targetPreview.imagePath : currentImagePath;
  const previewQuote = targetPreview.quote;
  const previewReflection = targetPreview.reflection;
  const previewPosX = previewVersion === "published" ? targetPreview.imagePositionX : posX;
  const previewPosY = previewVersion === "published" ? targetPreview.imagePositionY : posY;
  const previewOpacity = previewVersion === "published" ? targetPreview.overlayOpacity : opacity;

  const duplicateDays = weekData?.days?.filter((d: any) => 
    d.date !== form.watch("date") && 
    currentImagePath && 
    (d.inspiration?.draft?.imagePath === currentImagePath || d.inspiration?.published?.imagePath === currentImagePath)
  ) || [];
  const hasDuplicateImage = duplicateDays.length > 0;

  const playableSessions = catalog?.sessions?.filter((s: any) => s.status === "published") || [];

  return (
    <div className="flex flex-col h-full bg-card border border-border rounded-xl overflow-hidden shadow-sm">
      <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-muted/20">
        <div>
          <h2 className="text-lg font-semibold flex items-center gap-2">
            Edición: {date}
            {inspiration?.deleted && <span className="text-xs text-destructive bg-destructive/10 px-2 py-0.5 rounded-full font-medium">Eliminado</span>}
            {hasUnsavedChanges && !inspiration?.deleted && <span className="text-xs text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full font-medium">Sin guardar</span>}
          </h2>
          <div className="text-sm text-muted-foreground flex items-center gap-2 mt-1">
            <span>Estado:</span>
            {!inspiration ? (
              <span className="text-muted-foreground">Nuevo</span>
            ) : inspiration.published && !inspiration.deleted ? (
              <span className="text-emerald-500 font-medium flex items-center gap-1"><Eye className="w-3 h-3" /> Publicado</span>
            ) : (
              <span className="text-amber-500 font-medium flex items-center gap-1"><EyeOff className="w-3 h-3" /> Borrador</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {inspiration && !inspiration.deleted && (
            <>
              {inspiration.published ? (
                <Button variant="outline" size="sm" onClick={onUnpublish} disabled={unpublishInspiration.isPending}>
                  Despublicar
                </Button>
              ) : (
                <Button variant="secondary" size="sm" onClick={() => setShowPublishConfirm(true)} disabled={publishInspiration.isPending}>
                  Publicar
                </Button>
              )}
              <Button variant="destructive" size="sm" onClick={() => setShowDeleteConfirm(true)} disabled={deleteInspiration.isPending}>
                <Trash2 className="w-4 h-4 mr-1" /> Eliminar
              </Button>
            </>
          )}
        </div>
      </div>

      {(serverConflict || conflictPending) && (
        <div className="bg-destructive/10 border-b border-destructive/20 p-4 text-destructive">
          <div className="flex flex-col gap-4">
            <div>
            <h3 className="font-bold flex items-center gap-2"><AlertCircle className="w-4 h-4" /> Conflicto de revisión</h3>
            <p className="text-sm opacity-90 mt-1">
              Otra persona ha guardado cambios. Elige explícitamente qué versión conservar.
            </p>
            </div>
            {serverConflict ? (
              <>
                <div className="grid grid-cols-[auto_1fr_1fr] gap-x-3 gap-y-1 text-xs rounded-md border border-destructive/20 p-3 bg-background/60">
                  <strong>Campo</strong><strong>Mi versión</strong><strong>Servidor</strong>
                  <span>Fecha</span><span>{form.getValues("date")}</span><span>{serverConflict.date}</span>
                  <span>Frase</span><span className="whitespace-pre-wrap break-words">{form.getValues("quote") || "—"}</span><span className="whitespace-pre-wrap break-words">{serverConflict.draft.quote || "—"}</span>
                  <span>Reflexión</span><span className="whitespace-pre-wrap break-words">{form.getValues("reflection") || "—"}</span><span className="whitespace-pre-wrap break-words">{serverConflict.draft.reflection || "—"}</span>
                  <span>Imagen</span><span className="break-all">{form.getValues("imagePath") || "—"}</span><span className="break-all">{serverConflict.draft.imagePath || "—"}</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="destructive" onClick={overwriteServerWithLocal} disabled={isPending}>
                    Sobrescribir servidor con mi versión
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {
              form.reset({
                date: serverConflict.date,
                quote: serverConflict.draft.quote ?? "",
                author: serverConflict.draft.author ?? "",
                reflection: serverConflict.draft.reflection ?? "",
                imagePath: serverConflict.draft.imagePath ?? null,
                imagePositionX: serverConflict.draft.imagePositionX ?? 50,
                imagePositionY: serverConflict.draft.imagePositionY ?? 50,
                overlayOpacity: serverConflict.draft.overlayOpacity ?? 0.35,
                sessionId: serverConflict.draft.sessionId ?? null,
              });
              initRevision.current = serverConflict.revision;
              setServerConflict(null);
              setConflictPending(false);
            }}>
                    Descartar mis cambios y cargar servidor
                  </Button>
                </div>
              </>
            ) : (
              <p className="text-sm">Cargando la versión actual del servidor…</p>
            )}
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto p-6 flex flex-col gap-8 lg:flex-row">
        {/* Formulario principal */}
        <div className="flex-1 space-y-6 min-w-[300px]">
          <form id="inspiration-form" onSubmit={form.handleSubmit(onSaveDraft)} className="space-y-6">
            <div className="space-y-2">
              <Label>Fecha</Label>
              <Input
                type="date"
                {...form.register("date")}
                disabled={!!inspiration?.published && !inspiration.deleted}
                className="max-w-[200px]"
              />
              {!!inspiration?.published && !inspiration.deleted && (
                <p className="text-xs text-muted-foreground">Despublica primero para mover la fecha.</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Frase del día (hasta 2000 caracteres)</Label>
              <Textarea
                {...form.register("quote")}
                placeholder="Escribe la frase principal..."
                className="min-h-[100px] resize-y text-lg leading-relaxed"
              />
            </div>

            <div className="space-y-2">
              <Label>Autor / Crédito (Opcional)</Label>
              <Input
                {...form.register("author")}
                placeholder="Ej. Epicteto"
              />
            </div>

            <div className="space-y-2">
              <Label>Reflexión completa</Label>
              <Textarea
                {...form.register("reflection")}
                placeholder="Escribe el texto de la reflexión..."
                className="min-h-[250px] resize-y"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2"><Music className="w-4 h-4 text-muted-foreground" /> Audio relacionado (Opcional)</Label>
              <Controller
                control={form.control}
                name="sessionId"
                render={({ field }) => (
                  <Select
                    value={field.value || "none"}
                    onValueChange={(val) => field.onChange(val === "none" ? null : val)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecciona una sesión de audio" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Ninguno</SelectItem>
                      {playableSessions.map((s: any) => (
                        <SelectItem key={s.id} value={s.id}>{s.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <p className="text-xs text-muted-foreground">La reproducción respetará las reglas Premium del audio original.</p>
            </div>
          </form>
        </div>

        {/* Panel lateral: Imagen y previsualización */}
        <div className="w-full lg:w-[350px] shrink-0 space-y-6">
          <div className="space-y-4 bg-muted/30 p-4 rounded-lg border border-border">
            <div className="flex items-center justify-between">
              <Label className="text-base font-semibold">Visualización</Label>
              <div className="flex flex-col gap-2 items-end">
                {inspiration?.published && (
                  <ToggleGroup type="single" value={previewVersion} onValueChange={(v) => v && setPreviewVersion(v as "draft" | "published")} size="sm">
                    <ToggleGroupItem value="draft" className="text-xs px-2 h-7">Borrador</ToggleGroupItem>
                    <ToggleGroupItem value="published" className="text-xs px-2 h-7">Publicado</ToggleGroupItem>
                  </ToggleGroup>
                )}
                <ToggleGroup type="single" value={previewView} onValueChange={(v) => v && setPreviewView(v as "portada" | "detalle")} size="sm">
                  <ToggleGroupItem value="portada" className="text-xs px-2 h-7">Portada</ToggleGroupItem>
                  <ToggleGroupItem value="detalle" className="text-xs px-2 h-7">Detalle</ToggleGroupItem>
                </ToggleGroup>
              </div>
            </div>
            
            <div className="space-y-2">
              <div 
                className={`relative w-full rounded-lg overflow-hidden border border-border bg-black group flex items-center justify-center ${previewView === "portada" ? "aspect-[9/16]" : "min-h-[500px]"}`}
                onClick={previewVersion === "draft" ? handleUploadClick : undefined}
              >
                {previewImagePath ? (
                  <>
                    {/* Background image */}
                    <div className={`absolute inset-0 ${previewView === "detalle" ? "h-[40%]" : "h-full"}`}>
                      <img 
                        key={`${previewImagePath}-${imageRetry}`}
                        src={`/api/admin/inspirations/image?objectPath=${encodeURIComponent(previewImagePath)}`}
                        alt="Preview"
                        className={`w-full h-full object-cover pointer-events-none ${imageLoadFailed ? "hidden" : ""}`}
                        style={{ objectPosition: `${previewPosX}% ${previewPosY}%` }}
                        onLoad={() => setImageLoadFailed(false)}
                        onError={() => setImageLoadFailed(true)}
                      />
                      {imageLoadFailed && (
                        <div className="absolute inset-0 z-10 bg-zinc-900 flex flex-col items-center justify-center gap-2 p-4 text-center text-white">
                          <AlertCircle className="w-6 h-6 text-destructive" />
                          <p className="text-xs">No se pudo cargar la imagen.</p>
                          <Button size="sm" variant="secondary" onClick={(event) => {
                            event.stopPropagation();
                            setImageLoadFailed(false);
                            setImageRetry((value) => value + 1);
                          }}>Reintentar</Button>
                        </div>
                      )}
                      <div 
                        className="absolute inset-0 pointer-events-none"
                        style={{ backgroundColor: `rgba(0,0,0,${previewOpacity})` }}
                      />
                    </div>
                    
                    {/* Content overlay */}
                    <div className="absolute inset-0 p-6 flex flex-col pointer-events-none text-white">
                      {previewView === "portada" ? (
                        <div className="flex-1 flex flex-col justify-end text-center pb-20 opacity-90 overflow-y-auto">
                           <p className="text-xl font-serif mb-2 whitespace-pre-wrap leading-snug drop-shadow-md">
                             {previewQuote || "Frase de ejemplo para ver contraste"}
                           </p>
                           <p className="text-sm uppercase tracking-widest opacity-80 mt-6">LEER MÁS</p>
                        </div>
                      ) : (
                         <div className="flex-1 flex flex-col mt-[35%] bg-background/95 text-foreground rounded-t-2xl -mx-6 -mb-6 p-6 overflow-y-auto pointer-events-auto shadow-xl border-t border-border backdrop-blur-md">
                           <p className="text-lg font-serif italic whitespace-pre-wrap mb-4">"{previewQuote || "Frase de ejemplo para ver contraste"}"</p>
                           <p className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed">
                            {previewReflection || "Texto de la reflexión se mostrará aquí."}
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                ) : (
                  <div className="text-center p-6 text-muted-foreground">
                    <UploadCloud className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Toca para subir imagen</p>
                    <p className="text-xs mt-1 opacity-70">JPEG, PNG, WebP (Máx 15 MiB)</p>
                  </div>
                )}
                
                {previewVersion === "draft" && (
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                    <span className="text-white text-sm font-medium bg-black/60 px-3 py-1.5 rounded-full backdrop-blur-sm">
                      {previewImagePath ? "Cambiar imagen" : "Subir imagen"}
                    </span>
                  </div>
                )}

                {uploading && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3">
                    <Loader2 className="w-6 h-6 animate-spin text-primary" />
                    <div className="w-3/4 max-w-[150px] bg-muted rounded-full h-1.5 overflow-hidden">
                      <div className="bg-primary h-full transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                    </div>
                    <span className="text-xs font-medium">{uploadProgress}%</span>
                    <Button size="sm" variant="outline" className="mt-2" onClick={handleCancelUpload}>Cancelar</Button>
                  </div>
                )}
              </div>
              
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/jpeg,image/png,image/webp" 
                onChange={onFileSelected}
              />
            </div>

            {hasDuplicateImage && (
              <div className="bg-amber-500/10 border border-amber-500/20 text-amber-500 p-3 rounded-lg text-xs mt-2">
                <strong>Advertencia:</strong> Esta imagen ya se está utilizando en {duplicateDays.length === 1 ? 'otro día' : 'otros días'} de esta semana ({duplicateDays.map((d: any) => format(parseISO(d.date), "EEEE", { locale: es })).join(", ")}).
              </div>
            )}

            {currentImagePath && previewVersion === "draft" && (
              <div className="space-y-4 pt-2">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <Label>Posición X</Label>
                    <span className="text-muted-foreground">{posX}%</span>
                  </div>
                  <Controller
                    control={form.control}
                    name="imagePositionX"
                    render={({ field }) => (
                      <Slider
                        value={[field.value]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={(vals) => field.onChange(vals[0])}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <Label>Posición Y</Label>
                    <span className="text-muted-foreground">{posY}%</span>
                  </div>
                  <Controller
                    control={form.control}
                    name="imagePositionY"
                    render={({ field }) => (
                      <Slider
                        value={[field.value]}
                        min={0}
                        max={100}
                        step={1}
                        onValueChange={(vals) => field.onChange(vals[0])}
                      />
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <Label>Oscurecer fondo</Label>
                    <span className="text-muted-foreground">{Math.round(opacity * 100)}%</span>
                  </div>
                  <Controller
                    control={form.control}
                    name="overlayOpacity"
                    render={({ field }) => (
                      <Slider
                        value={[field.value]}
                        min={0}
                        max={0.85}
                        step={0.05}
                        onValueChange={(vals) => field.onChange(vals[0])}
                      />
                    )}
                  />
                  <p className="text-xs text-muted-foreground leading-tight">
                    Ajusta para asegurar que la frase blanca sea legible sobre la imagen.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 border-t border-border bg-card flex justify-end gap-3 shrink-0">
        {onCancel && (
          <Button variant="ghost" onClick={onCancel} disabled={isPending}>
            Cancelar
          </Button>
        )}
        <Button 
          type="submit" 
          form="inspiration-form" 
          disabled={isPending || uploading || !hasUnsavedChanges || !!serverConflict || conflictPending}
          className="min-w-[150px]"
        >
          {isPending ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Guardando...</>
          ) : (
            <><Save className="w-4 h-4 mr-2" /> Guardar borrador</>
          )}
        </Button>
      </div>

      {/* Dialogs */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar inspiración?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acción eliminará el contenido asociado a la fecha {date}. Si está publicada, dejará de estar disponible inmediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Sí, eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showPublishConfirm} onOpenChange={setShowPublishConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Publicar inspiración?</AlertDialogTitle>
            <AlertDialogDescription>
              El borrador actual se convertirá en la versión pública para la fecha {date}. 
              Recuerda que si la fecha es futura, los usuarios aún no podrán verla hasta que llegue el día.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={onPublish}>
              Publicar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
