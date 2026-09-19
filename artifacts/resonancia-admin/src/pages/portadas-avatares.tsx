import { useState, useRef, useEffect } from "react";
import {
  useListAdminCoverPresets,
  useCreateAdminCoverPreset,
  useUpdateAdminCoverPreset,
  useDeleteAdminCoverPreset,
  useReorderAdminCoverPresets,
  useCleanupAdminCoverPresetUpload,
  useRequestUploadUrl,
  type CoverPresetScope,
  type CoverPreset,
} from "@workspace/api-client-react";
import { uploadFile } from "@/lib/uploadFile";
import {
  GripVertical,
  ImageIcon,
  Loader2,
  Trash2,
  Upload,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

// Import builtin mobile assets using Vite's glob import
const builtinModules = import.meta.glob(
  "../../../mobile/assets/images/**/*.{jpg,jpeg,png,webp}",
  { eager: true, import: "default" }
);

function getBuiltinPreviewUrl(builtinKey: string | null | undefined): string | null {
  if (!builtinKey) return null;
  for (const [path, url] of Object.entries(builtinModules)) {
    // Exact match of filename without extension
    const filename = path.split("/").pop()?.split(".")[0];
    if (filename === builtinKey) {
      return url as string;
    }
  }
  return null;
}

function previewUrl(path: string | null | undefined, builtinKey?: string | null): string | null {
  if (builtinKey) {
    return getBuiltinPreviewUrl(builtinKey);
  }
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/objects/")) {
    return path.replace(/^\/objects\//, "/api/storage/objects/");
  }
  return path;
}

const SCOPES: { value: CoverPresetScope; label: string; description: string }[] = [
  {
    value: "mix",
    label: "Portadas de Mezclas",
    description: "Imágenes para personalizar las mezclas guardadas.",
  },
  {
    value: "playlist",
    label: "Portadas de Playlists",
    description: "Imágenes para las playlists creadas por los usuarios.",
  },
  {
    value: "profile",
    label: "Avatares de Perfil",
    description: "Avatares predeterminados para los usuarios.",
  },
];

export default function PortadasAvataresPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-20">
      <div>
        <h1 className="text-2xl font-bold">Portadas y avatares</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Administrá las imágenes predeterminadas que los usuarios pueden elegir.
          Podés subir hasta 50 opciones por categoría.
        </p>
      </div>

      {SCOPES.map((scope) => (
        <ScopeSection key={scope.value} scope={scope} />
      ))}
    </div>
  );
}

function ScopeSection({
  scope,
}: {
  scope: { value: CoverPresetScope; label: string; description: string };
}) {
  const query = useListAdminCoverPresets({ scope: scope.value });
  const createPreset = useCreateAdminCoverPreset();
  const updatePreset = useUpdateAdminCoverPreset();
  const deletePreset = useDeleteAdminCoverPreset();
  const reorderPresets = useReorderAdminCoverPresets();
  const cleanupUpload = useCleanupAdminCoverPresetUpload();
  const requestUploadUrl = useRequestUploadUrl();

  const [presets, setPresets] = useState<CoverPreset[]>([]);
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const dragIdx = useRef<number | null>(null);

  useEffect(() => {
    if (!query.data || dirty) return;
    setPresets(query.data.presets);
  }, [dirty, query.data]);

  useEffect(() => {
    if (query.error) {
      toast.error(`Error al cargar ${scope.label}`);
    }
  }, [query.error, scope.label]);

  const maxReached = presets.length >= 50;

  const isMutating = uploading || createPreset.isPending || updatePreset.isPending || deletePreset.isPending || reorderPresets.isPending || cleanupUpload.isPending;
  const isUploadDisabled = maxReached || isMutating || dirty;

  function onDragEnter(index: number) {
    if (dragIdx.current === null || dragIdx.current === index) return;
    setPresets((current) => {
      const next = [...current];
      const [moved] = next.splice(dragIdx.current!, 1);
      next.splice(index, 0, moved);
      dragIdx.current = index;
      return next;
    });
    setDirty(true);
  }

  async function saveOrder() {
    try {
      const ids = presets.map((p) => p.id);
      await reorderPresets.mutateAsync({
        data: {
          scope: scope.value,
          ids,
        },
      });
      setDirty(false);
      toast.success("Orden guardado");
      void query.refetch();
    } catch {
      toast.error("No se pudo guardar el orden");
    }
  }

  async function handleFileUpload(file: File): Promise<string | null> {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona una imagen válida (JPG, PNG, WebP)");
      return null;
    }
    
    setUploading(true);
    try {
      const uploaded = await uploadFile(
        file,
        (args) => requestUploadUrl.mutateAsync(args),
        null
      );
      return uploaded.objectPath;
    } catch {
      toast.error("No se pudo subir la imagen");
      return null;
    } finally {
      setUploading(false);
    }
  }

  async function handleCreate(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = ""; // reset
    if (!file) return;

    if (maxReached) {
      toast.error("Límite de 50 imágenes alcanzado");
      return;
    }

    const objectPath = await handleFileUpload(file);
    if (!objectPath) return;

    try {
      await createPreset.mutateAsync({
        data: {
          scope: scope.value,
          label: file.name.replace(/\.[^/.]+$/, ""), // default label to filename
          objectPath,
        },
      });
      toast.success("Imagen añadida");
      void query.refetch();
    } catch {
      toast.error("Error al crear el registro");
      void cleanupUpload.mutateAsync({ data: { objectPath } }).catch(() => {});
    }
  }

  async function handleReplace(presetId: string, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const objectPath = await handleFileUpload(file);
    if (!objectPath) return;

    try {
      await updatePreset.mutateAsync({
        id: presetId,
        data: {
          objectPath,
        },
      });
      toast.success("Imagen reemplazada");
      void query.refetch();
    } catch {
      toast.error("Error al reemplazar la imagen");
      void cleanupUpload.mutateAsync({ data: { objectPath } }).catch(() => {});
    }
  }

  async function handleDelete(preset: CoverPreset) {
    if (!window.confirm(`¿Borrar la imagen "${preset.label}"?`)) return;
    
    try {
      await deletePreset.mutateAsync({ id: preset.id });
      toast.success("Imagen eliminada");
      void query.refetch();
    } catch {
      toast.error("Error al eliminar la imagen");
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold">{scope.label}</h2>
          <p className="text-sm text-muted-foreground">{scope.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">
            {presets.length} / 50
          </span>
          <label className={`inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground ${isUploadDisabled ? 'pointer-events-none opacity-50' : 'cursor-pointer'}`}>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={isUploadDisabled}
              onChange={handleCreate}
            />
            {uploading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Upload className="mr-2 h-4 w-4" />
            )}
            Subir nueva
          </label>
        </div>
      </div>

      {query.isLoading ? (
        <div className="flex h-32 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : presets.length === 0 ? (
        <div className="flex h-32 flex-col items-center justify-center rounded-lg border border-dashed border-border bg-secondary/20">
          <ImageIcon className="mb-2 h-8 w-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">No hay imágenes configuradas.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {presets.map((preset, index) => {
            const isBuiltin = preset.source === "builtin" && !preset.objectPath;
            return (
              <div
                key={preset.id}
                draggable
                onDragStart={() => {
                  dragIdx.current = index;
                }}
                onDragEnter={() => onDragEnter(index)}
                onDragEnd={() => {
                  dragIdx.current = null;
                }}
                onDragOver={(e) => e.preventDefault()}
                className="flex items-center gap-4 rounded-lg border bg-card px-4 py-3 transition-colors hover:bg-secondary/20"
              >
                <GripVertical className="h-5 w-5 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing" />
                <span className="w-5 shrink-0 text-right text-xs text-muted-foreground">
                  {index + 1}
                </span>
                
                <div className="h-12 w-12 shrink-0 overflow-hidden rounded-md border border-border bg-secondary">
                  {previewUrl(preset.objectPath, preset.builtinKey) ? (
                    <img
                      src={previewUrl(preset.objectPath, preset.builtinKey)!}
                      alt={preset.label}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <p className="text-sm font-medium">{preset.label}</p>
                  {isBuiltin && (
                    <span className="mt-1 inline-flex items-center rounded-sm bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
                      App
                    </span>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <label className={`inline-flex h-8 cursor-pointer items-center justify-center rounded-md px-3 text-xs font-medium transition-colors hover:bg-secondary hover:text-foreground ${isMutating || dirty ? 'pointer-events-none opacity-50 text-muted-foreground' : 'text-muted-foreground'}`}>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => void handleReplace(preset.id, e)}
                      disabled={isMutating || dirty}
                    />
                    Reemplazar
                  </label>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 px-2 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => void handleDelete(preset)}
                    disabled={isMutating || dirty}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      )}
      
      {dirty && (
        <div className="mt-4 flex items-center justify-between rounded-lg bg-secondary/50 px-4 py-3">
          <p className="text-sm text-muted-foreground">
            Has cambiado el orden de las imágenes.
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setPresets(query.data?.presets || []);
                setDirty(false);
              }}
              disabled={reorderPresets.isPending}
            >
              Cancelar
            </Button>
            <Button
              size="sm"
              onClick={() => void saveOrder()}
              disabled={reorderPresets.isPending}
            >
              {reorderPresets.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Guardar orden
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
