import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Film, Plus, Trash2, Pencil, X, Loader2, Check,
  ExternalLink, RefreshCw, Upload,
} from "lucide-react";
import {
  useListAdminVideos,
  useCreateAdminVideo,
  useUpdateAdminVideo,
  useDeleteAdminVideo,
  useCreateBunnyUploadUrl,
  useGetBunnyVideoStatus,
  useRequestUploadUrl,
  getListAdminVideosQueryKey,
  getGetBunnyVideoStatusQueryKey,
} from "@workspace/api-client-react";
import type { CatalogVideo } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ── Helpers ────────────────────────────────────────────────────────────────

function resolveThumbnailUrl(raw: string | null | undefined): string | null {
  if (!raw) return null;
  if (raw.startsWith("/objects/")) return `/api/storage${raw}`;
  return raw;
}

function bunnyStatusLabel(status: number): string {
  switch (status) {
    case 0: return "Creado";
    case 1: return "Subido";
    case 2: return "Procesando";
    case 3: return "Transcodificando";
    case 4: return "Listo";
    case 5: return "Error";
    case 6: return "Upload fallido";
    default: return `Estado ${status}`;
  }
}

function bunnyStatusVariant(status: number): "default" | "secondary" | "destructive" | "outline" {
  if (status === 4) return "default";
  if (status === 5 || status === 6) return "destructive";
  return "secondary";
}

// ── Tipos de formulario ────────────────────────────────────────────────────

type VideoForm = {
  title: string;
  subtitle: string;
  description: string;
  durationLabel: string;
  bunnyVideoId: string;
  thumbnailObjectPath: string;
  author: string;
  isPremium: boolean;
  isNew: boolean;
  status: "published" | "draft";
  sortOrder: number;
};

const EMPTY_FORM: VideoForm = {
  title: "",
  subtitle: "",
  description: "",
  durationLabel: "",
  bunnyVideoId: "",
  thumbnailObjectPath: "",
  author: "Casa del Cuenco",
  isPremium: false,
  isNew: false,
  status: "published",
  sortOrder: 0,
};

function videoToForm(v: CatalogVideo): VideoForm {
  return {
    title: v.title,
    subtitle: v.subtitle,
    description: v.description,
    durationLabel: v.durationLabel,
    bunnyVideoId: v.bunnyVideoId,
    thumbnailObjectPath: v.thumbnailObjectPath ?? "",
    author: v.author,
    isPremium: v.isPremium,
    isNew: v.isNew,
    status: v.status as "published" | "draft",
    sortOrder: v.sortOrder,
  };
}

// ── Componente de estado Bunny ─────────────────────────────────────────────

function BunnyStatus({ bunnyVideoId }: { bunnyVideoId: string }) {
  const { data, isLoading, refetch } = useGetBunnyVideoStatus(bunnyVideoId, {
    query: { queryKey: getGetBunnyVideoStatusQueryKey(bunnyVideoId), enabled: !!bunnyVideoId, retry: false },
  });

  if (!bunnyVideoId) return null;

  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      {isLoading ? (
        <Loader2 className="w-3 h-3 animate-spin" />
      ) : data ? (
        <>
          <Badge variant={bunnyStatusVariant(data.status)} className="text-xs py-0 px-2">
            {bunnyStatusLabel(data.status)}
          </Badge>
          {data.ready && data.lengthSeconds != null && (
            <span>{Math.floor(data.lengthSeconds / 60)}:{String(data.lengthSeconds % 60).padStart(2, "0")}</span>
          )}
          <button
            type="button"
            onClick={() => refetch()}
            className="hover:text-foreground transition-colors"
            title="Actualizar estado"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        </>
      ) : (
        <span className="text-destructive">No encontrado en Bunny</span>
      )}
    </div>
  );
}

// ── Fila de video ──────────────────────────────────────────────────────────

function VideoRow({
  video,
  onEdit,
  onDelete,
}: {
  video: CatalogVideo;
  onEdit: (v: CatalogVideo) => void;
  onDelete: (v: CatalogVideo) => void;
}) {
  const thumb = resolveThumbnailUrl(video.thumbnailObjectPath);
  const cdnHost = import.meta.env.VITE_BUNNY_CDN_HOSTNAME;
  const hlsUrl = cdnHost
    ? `https://${cdnHost}/${video.bunnyVideoId}/playlist.m3u8`
    : null;

  return (
    <div className="flex items-center gap-4 px-4 py-3 border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
      <div className="w-24 h-14 rounded-lg overflow-hidden bg-secondary shrink-0">
        {thumb ? (
          <img src={thumb} alt={video.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Film className="w-5 h-5 text-muted-foreground" />
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <p className="font-medium text-sm text-foreground truncate">{video.title}</p>
          {video.isPremium && (
            <Badge variant="outline" className="text-xs py-0 px-2 border-primary/50 text-primary">
              Premium
            </Badge>
          )}
          {video.isNew && (
            <Badge variant="secondary" className="text-xs py-0 px-2">Nuevo</Badge>
          )}
          {video.status === "draft" && (
            <Badge variant="outline" className="text-xs py-0 px-2 text-muted-foreground">
              Borrador
            </Badge>
          )}
        </div>
        {video.subtitle && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">{video.subtitle}</p>
        )}
        <div className="flex items-center gap-3 mt-1">
          <span className="text-xs text-muted-foreground">
            ID Bunny: <code className="bg-secondary px-1 rounded text-xs">{video.bunnyVideoId}</code>
          </span>
          {video.durationLabel && (
            <span className="text-xs text-muted-foreground">{video.durationLabel}</span>
          )}
        </div>
        <BunnyStatus bunnyVideoId={video.bunnyVideoId} />
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {hlsUrl && (
          <a
            href={hlsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            title="Ver URL HLS"
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
        <Button size="icon" variant="ghost" onClick={() => onEdit(video)} title="Editar">
          <Pencil className="w-4 h-4" />
        </Button>
        <Button
          size="icon"
          variant="ghost"
          className="text-destructive hover:text-destructive"
          onClick={() => onDelete(video)}
          title="Eliminar"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

// ── Modal de creación / edición ────────────────────────────────────────────

const UPLOAD_STAGES = ["idle", "creating-bunny", "uploading-video", "done"] as const;
type UploadStage = typeof UPLOAD_STAGES[number];

function VideoFormModal({
  open,
  onClose,
  editingVideo,
  onSuccess,
}: {
  open: boolean;
  onClose: () => void;
  editingVideo: CatalogVideo | null;
  onSuccess: () => void;
}) {
  const isEditing = !!editingVideo;
  const [form, setForm] = useState<VideoForm>(EMPTY_FORM);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [uploadStage, setUploadStage] = useState<UploadStage>("idle");
  const [uploadProgress, setUploadProgress] = useState(0);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setForm(editingVideo ? videoToForm(editingVideo) : EMPTY_FORM);
      setVideoFile(null);
      setThumbFile(null);
      setUploadStage("idle");
      setUploadProgress(0);
    }
  }, [open, editingVideo]);
  const videoInputRef = useRef<HTMLInputElement>(null);
  const thumbInputRef = useRef<HTMLInputElement>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  const { mutateAsync: getBunnyUrl } = useCreateBunnyUploadUrl();
  const { mutateAsync: createVideo } = useCreateAdminVideo();
  const { mutateAsync: updateVideo } = useUpdateAdminVideo();
  const { mutateAsync: requestThumbUrl } = useRequestUploadUrl();

  function setField<K extends keyof VideoForm>(key: K, value: VideoForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function uploadVideoToBunny(file: File, title: string): Promise<string> {
    setUploadStage("creating-bunny");
    const { bunnyVideoId, uploadUrl, uploadHeaders } = await getBunnyUrl({
      data: { title },
    });

    setUploadStage("uploading-video");
    setUploadProgress(0);

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhrRef.current = xhr;
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setUploadProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Upload fallido: ${xhr.status}`));
      };
      xhr.onerror = () => reject(new Error("Error de red al subir el video"));
      xhr.open("PUT", uploadUrl);
      Object.entries(uploadHeaders ?? {}).forEach(([k, v]) => xhr.setRequestHeader(k, v as string));
      xhr.setRequestHeader("Content-Type", "video/*");
      xhr.send(file);
    });

    setUploadStage("done");
    return bunnyVideoId;
  }

  async function uploadThumbnail(file: File): Promise<string> {
    const { uploadURL, objectPath } = await requestThumbUrl({
      data: {
        contentType: file.type,
        size: file.size,
        name: file.name,
      },
    });
    await fetch(uploadURL, { method: "PUT", body: file, headers: { "Content-Type": file.type } });
    return objectPath;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("El título es requerido"); return; }

    try {
      setSaving(true);
      let bunnyId = form.bunnyVideoId;
      let thumbPath: string | null = form.thumbnailObjectPath || null;

      if (!isEditing && videoFile) {
        bunnyId = await uploadVideoToBunny(videoFile, form.title);
        setForm((f) => ({ ...f, bunnyVideoId: bunnyId }));
      }

      if (!bunnyId.trim()) { toast.error("El ID de Bunny es requerido"); return; }

      if (thumbFile) {
        thumbPath = await uploadThumbnail(thumbFile);
      }

      const payload = {
        title: form.title.trim(),
        subtitle: form.subtitle.trim(),
        description: form.description.trim(),
        durationLabel: form.durationLabel.trim(),
        bunnyVideoId: bunnyId.trim(),
        thumbnailObjectPath: thumbPath || null,
        author: form.author.trim() || "Casa del Cuenco",
        isPremium: form.isPremium,
        isNew: form.isNew,
        status: form.status,
        sortOrder: form.sortOrder,
      };

      if (isEditing) {
        await updateVideo({ id: editingVideo.id, data: payload });
        toast.success("Video actualizado");
      } else {
        await createVideo({ data: payload });
        toast.success("Video creado");
      }

      onSuccess();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast.error(msg);
    } finally {
      setSaving(false);
      setUploadStage("idle");
    }
  }

  const inProgress = saving || uploadStage !== "idle";

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v && !inProgress) onClose(); }}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Editar video" : "Nuevo video"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Video file (solo creación) */}
          {!isEditing && (
            <div className="space-y-2">
              <Label>Archivo de video</Label>
              <div
                className="border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => videoInputRef.current?.click()}
              >
                {videoFile ? (
                  <div className="space-y-1">
                    <Check className="w-6 h-6 text-primary mx-auto" />
                    <p className="text-sm font-medium">{videoFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {(videoFile.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Upload className="w-8 h-8 text-muted-foreground mx-auto" />
                    <p className="text-sm text-muted-foreground">
                      Hacé clic para seleccionar el video
                    </p>
                    <p className="text-xs text-muted-foreground">MP4, MOV, MKV — máx. 10 GB</p>
                  </div>
                )}
              </div>
              <input
                ref={videoInputRef}
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => setVideoFile(e.target.files?.[0] ?? null)}
              />

              {/* Progreso de upload */}
              {uploadStage !== "idle" && (
                <div className="space-y-1.5 rounded-lg bg-secondary p-3 text-sm">
                  {uploadStage === "creating-bunny" && (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-primary" />
                      <span>Preparando upload en Bunny...</span>
                    </div>
                  )}
                  {uploadStage === "uploading-video" && (
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between text-xs">
                        <span>Subiendo video...</span>
                        <span className="font-mono font-bold text-primary">{uploadProgress}%</span>
                      </div>
                      <div className="w-full bg-border rounded-full h-1.5">
                        <div
                          className="bg-primary h-1.5 rounded-full transition-all duration-300"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                    </div>
                  )}
                  {uploadStage === "done" && (
                    <div className="flex items-center gap-2 text-primary">
                      <Check className="w-4 h-4" />
                      <span>Video subido — Bunny lo procesará en breve</span>
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">O pegá el ID de Bunny si ya lo subiste</Label>
                <Input
                  placeholder="abc123ef-..."
                  value={form.bunnyVideoId}
                  onChange={(e) => setField("bunnyVideoId", e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Edición: bunnyVideoId solo lectura */}
          {isEditing && (
            <div className="space-y-2">
              <Label>ID de Bunny</Label>
              <div className="flex items-center gap-2">
                <Input
                  value={form.bunnyVideoId}
                  onChange={(e) => setField("bunnyVideoId", e.target.value)}
                />
              </div>
              <BunnyStatus bunnyVideoId={form.bunnyVideoId} />
            </div>
          )}

          {/* Thumbnail */}
          <div className="space-y-2">
            <Label>Thumbnail</Label>
            <div className="flex items-center gap-3">
              {(thumbFile || form.thumbnailObjectPath) && (
                <div className="w-20 h-12 rounded overflow-hidden bg-secondary shrink-0">
                  <img
                    src={thumbFile ? URL.createObjectURL(thumbFile) : resolveThumbnailUrl(form.thumbnailObjectPath) ?? ""}
                    alt="thumbnail"
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => thumbInputRef.current?.click()}
              >
                {form.thumbnailObjectPath || thumbFile ? "Cambiar" : "Seleccionar"} imagen
              </Button>
              {(form.thumbnailObjectPath || thumbFile) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-muted-foreground"
                  onClick={() => { setThumbFile(null); setField("thumbnailObjectPath", ""); }}
                >
                  <X className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
            <input
              ref={thumbInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => setThumbFile(e.target.files?.[0] ?? null)}
            />
            <p className="text-xs text-muted-foreground">
              Si no subís thumbnail, Bunny genera uno automáticamente del frame 0.
            </p>
          </div>

          {/* Campos de metadata */}
          <div className="space-y-2">
            <Label>Título <span className="text-destructive">*</span></Label>
            <Input
              value={form.title}
              onChange={(e) => setField("title", e.target.value)}
              placeholder="Ej: Cuenco en movimiento"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Subtítulo</Label>
            <Input
              value={form.subtitle}
              onChange={(e) => setField("subtitle", e.target.value)}
              placeholder="Ej: Visual sonoro"
            />
          </div>

          <div className="space-y-2">
            <Label>Descripción</Label>
            <Textarea
              value={form.description}
              onChange={(e) => setField("description", e.target.value)}
              placeholder="Descripción del video..."
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Duración (etiqueta)</Label>
              <Input
                value={form.durationLabel}
                onChange={(e) => setField("durationLabel", e.target.value)}
                placeholder="Ej: 12:34"
              />
            </div>
            <div className="space-y-2">
              <Label>Autor</Label>
              <Input
                value={form.author}
                onChange={(e) => setField("author", e.target.value)}
                placeholder="Casa del Cuenco"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Orden</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setField("sortOrder", parseInt(e.target.value, 10) || 0)}
                min={0}
              />
            </div>
            <div className="space-y-2">
              <Label>Estado</Label>
              <div className="flex items-center gap-3 pt-2">
                <Switch
                  checked={form.status === "published"}
                  onCheckedChange={(v) => setField("status", v ? "published" : "draft")}
                />
                <span className="text-sm text-muted-foreground">
                  {form.status === "published" ? "Publicado" : "Borrador"}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="isPremium"
                checked={form.isPremium}
                onCheckedChange={(v) => setField("isPremium", v)}
              />
              <Label htmlFor="isPremium">Premium</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="isNew"
                checked={form.isNew}
                onCheckedChange={(v) => setField("isNew", v)}
              />
              <Label htmlFor="isNew">Nuevo</Label>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose} disabled={inProgress}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={inProgress}>
              {inProgress ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {uploadStage === "uploading-video"
                    ? `${uploadProgress}%`
                    : uploadStage === "creating-bunny"
                    ? "Preparando..."
                    : "Guardando..."}
                </span>
              ) : isEditing ? (
                "Guardar cambios"
              ) : (
                "Crear video"
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ── Página principal ───────────────────────────────────────────────────────

export default function VideosPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useListAdminVideos();
  const { mutateAsync: deleteVideo } = useDeleteAdminVideo();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingVideo, setEditingVideo] = useState<CatalogVideo | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const videos = data?.videos ?? [];

  function openCreate() {
    setEditingVideo(null);
    setModalOpen(true);
  }

  function openEdit(v: CatalogVideo) {
    setEditingVideo(v);
    setModalOpen(true);
  }

  async function handleDelete(v: CatalogVideo) {
    if (!window.confirm(`¿Eliminar "${v.title}"? Esto borra el video de Bunny también.`)) return;
    setDeletingId(v.id);
    try {
      await deleteVideo({ id: v.id });
      toast.success("Video eliminado");
      qc.invalidateQueries({ queryKey: getListAdminVideosQueryKey() });
    } catch {
      toast.error("No se pudo eliminar el video");
    } finally {
      setDeletingId(null);
    }
  }

  function handleSuccess() {
    setModalOpen(false);
    setEditingVideo(null);
    qc.invalidateQueries({ queryKey: getListAdminVideosQueryKey() });
  }

  const cdnHost = import.meta.env.VITE_BUNNY_CDN_HOSTNAME;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Videos</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Videos servidos desde Bunny.net Stream (HLS).
            {!cdnHost && (
              <span className="text-yellow-500 ml-1">
                Falta VITE_BUNNY_CDN_HOSTNAME — las URLs HLS no se mostrarán.
              </span>
            )}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo video
        </Button>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Total", value: videos.length },
          { label: "Publicados", value: videos.filter((v) => v.status === "published").length },
          { label: "Premium", value: videos.filter((v) => v.isPremium).length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-card border border-border rounded-xl p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {/* Lista de videos */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : videos.length === 0 ? (
          <div className="text-center py-16 space-y-3">
            <Film className="w-10 h-10 text-muted-foreground mx-auto" />
            <p className="text-muted-foreground">No hay videos todavía</p>
            <Button onClick={openCreate} variant="outline" size="sm" className="gap-2">
              <Plus className="w-4 h-4" />
              Agregar el primero
            </Button>
          </div>
        ) : (
          videos.map((v) => (
            <VideoRow
              key={v.id}
              video={v}
              onEdit={openEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>

      <VideoFormModal
        open={modalOpen}
        onClose={() => { setModalOpen(false); setEditingVideo(null); }}
        editingVideo={editingVideo}
        onSuccess={handleSuccess}
      />
    </div>
  );
}
