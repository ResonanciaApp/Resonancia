import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import {
  useListAdminCoverPresets,
  useCreateAdminCoverPreset,
  useUpdateAdminCoverPreset,
  useDeleteAdminCoverPreset,
  useReorderAdminCoverPresets,
  useCleanupAdminCoverPresetUpload,
  useRequestUploadUrl,
  useUpdateProfileAvatarMemberships,
  getListAdminCoverPresetsQueryKey,
  getListCoverPresetsQueryKey,
  type CoverPresetScope,
  type CoverPreset,
} from "@workspace/api-client-react";
import { uploadFile } from "@/lib/uploadFile";
import {
  GripVertical,
  ChevronDown,
  ImageIcon,
  Loader2,
  Trash2,
  Upload,
  LockKeyhole,
  UnlockKeyhole,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { ProfileAvatarOrderControls } from "@/components/ProfileAvatarOrderControls";
import { movePresetBlock, presetCatalogSignature, samePresetOrder } from "@/lib/cover-preset-order";
import { ProfileAvatarCategoryManager } from "@/components/ProfileAvatarCategoryManager";
import { ProfileAvatarCategoryPicker } from "@/components/ProfileAvatarCategoryPicker";
import { errorMessage, membershipPayload, mergeCategoryIds } from "@/lib/profile-avatar-categories";

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
  if (builtinKey.startsWith("reflection-story-")) {
    const fallbackUrls = Object.entries(builtinModules)
      .filter(([path]) => /-ai\.(jpg|jpeg|png|webp)$/i.test(path))
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([, url]) => url as string);
    if (fallbackUrls.length > 0) {
      const slot = Number.parseInt(builtinKey.slice("reflection-story-".length), 10);
      return fallbackUrls[(Number.isFinite(slot) ? slot - 1 : 0) % fallbackUrls.length] ?? null;
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
  {
    value: "reflection-story",
    label: "Mi viaje interior",
    description: "100 fondos para compartir reflexiones como historias.",
  },
];

export default function PortadasAvataresPage() {
  return (
    <div className="mx-auto max-w-4xl space-y-10 pb-20">
      <div>
        <h1 className="text-2xl font-bold">Portadas y avatares</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Administrá las imágenes predeterminadas que los usuarios pueden elegir.
            Perfil permite hasta 300 avatares. Mezclas y Playlists permiten 50 opciones cada una. Mi viaje interior mantiene 100 posiciones fijas.
        </p>
      </div>

      {SCOPES.map((scope) => (
        <ScopeSection key={scope.value} scope={scope} />
      ))}
    </div>
  );
}

export function ScopeSection({
  scope,
}: {
  scope: { value: CoverPresetScope; label: string; description: string };
}) {
  const query = useListAdminCoverPresets({ scope: scope.value });
  const queryClient = useQueryClient();
  const createPreset = useCreateAdminCoverPreset();
  const updatePreset = useUpdateAdminCoverPreset();
  const deletePreset = useDeleteAdminCoverPreset();
  const reorderPresets = useReorderAdminCoverPresets();
  const cleanupUpload = useCleanupAdminCoverPresetUpload();
  const requestUploadUrl = useRequestUploadUrl();
  const updateMemberships = useUpdateProfileAvatarMemberships();
  const [categoryBusy, setCategoryBusy] = useState(false);
  const categoryBusyRef = useRef(false);

  const [presets, setPresets] = useState<CoverPreset[]>([]);
  const [dirty, setDirty] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [lockingId, setLockingId] = useState<string | null>(null);
  const lockingRef = useRef(false);
  const baselineRef = useRef<CoverPreset[]>([]);
  const savingRef = useRef(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [movePosition, setMovePosition] = useState("");
  const [moveError, setMoveError] = useState<string | null>(null);
  const [checkingOrder, setCheckingOrder] = useState(false);
  const [orderConflict, setOrderConflict] = useState(false);
  
  const dragIdx = useRef<number | null>(null);

  async function handleToggleLock(preset: CoverPreset) {
    if (lockingRef.current || categoryBusyRef.current || isMutating || dirty) return;
    lockingRef.current = true;
    setLockingId(preset.id);
    try {
      const updated = await updatePreset.mutateAsync({ id: preset.id, data: { isLocked: !preset.isLocked } });
      setPresets((current) => current.map((item) => item.id === updated.id ? updated : item));
      await query.refetch();
      toast.success(updated.isLocked ? "Avatar bloqueado" : "Avatar desbloqueado");
    } catch {
      toast.error("No se pudo cambiar el bloqueo del avatar");
    } finally {
      lockingRef.current = false;
      setLockingId(null);
    }
  }

  useEffect(() => {
    if (!query.data) return;
    if (dirty) {
      // Keep the unsaved local order; only refresh category assignments by ID.
      const fresh = query.data.presets;
      setPresets(current => mergeCategoryIds(current, fresh));
      baselineRef.current = mergeCategoryIds(baselineRef.current, fresh);
      return;
    }
    setPresets(query.data.presets);
    baselineRef.current = query.data.presets;
    setSelectedIds(current => new Set([...current].filter(id => query.data!.presets.some(item => item.id === id))));
  }, [dirty, query.data]);

  useEffect(() => {
    if (query.error) {
      toast.error(`Error al cargar ${scope.label}`);
    }
  }, [query.error, scope.label]);

  const isFixedSlots = scope.value === "reflection-story";
  const isProfile = scope.value === "profile";
  const maxSlots = isFixedSlots ? 100 : scope.value === "profile" ? 300 : 50;
  const maxReached = presets.length >= maxSlots;

  const categories = query.data?.categories ?? [];
  const isMutating = categoryBusy || updateMemberships.isPending || checkingOrder || uploading || createPreset.isPending || updatePreset.isPending || deletePreset.isPending || reorderPresets.isPending || cleanupUpload.isPending;
  const isUploadDisabled = maxReached || isMutating || dirty;

  async function refreshCatalog() {
    await query.refetch();
    await queryClient.invalidateQueries({ queryKey: getListCoverPresetsQueryKey({ scope: scope.value }) });
  }

  async function changeMembership(presetIds: string[], categoryId: string, add: boolean) {
    if (!isProfile || categoryBusyRef.current || isMutating || lockingId !== null || presetIds.length === 0) return;
    categoryBusyRef.current = true;
    setCategoryBusy(true);
    try {
      const result = await updateMemberships.mutateAsync(membershipPayload(presetIds, categoryId, add));
      // Never adopt the response order: merge assignments into the local (possibly unsaved) order.
      setPresets(current => mergeCategoryIds(current, result.presets));
      baselineRef.current = mergeCategoryIds(baselineRef.current, result.presets);
      toast.success(add ? "Categoría asignada" : "Categoría retirada");
    } catch (error) {
      toast.error(errorMessage(error, "No se pudieron actualizar las categorías"));
    } finally {
      try { await refreshCatalog(); } catch { toast.error("No se pudo actualizar el catálogo"); }
      categoryBusyRef.current = false;
      setCategoryBusy(false);
    }
  }

  function onDragEnter(index: number) {
    if (isMutating || orderConflict || selectedIds.size > 0) return;
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

  function clearSelection() {
    setSelectedIds(new Set());
    setMovePosition("");
    setMoveError(null);
  }

  function moveSelection() {
    if (isMutating || orderConflict) return;
    const result = movePresetBlock(presets, selectedIds, movePosition);
    if (result.error) {
      setMoveError(result.error);
      return;
    }
    setPresets(result.presets);
    setDirty(!samePresetOrder(result.presets, baselineRef.current));
    clearSelection();
  }

  function cancelOrder() {
    if (isMutating) return;
    setPresets(query.data?.presets ?? baselineRef.current);
    setDirty(false);
    setOrderConflict(false);
    clearSelection();
  }

  async function saveOrder() {
    if (isMutating || savingRef.current || orderConflict) return;
    savingRef.current = true;
    setCheckingOrder(true);
    try {
      if (isProfile) {
        const fresh = await query.refetch();
        if (fresh.error || !fresh.data) throw new Error("Catalog could not be checked");
        if (presetCatalogSignature(fresh.data.presets) !== presetCatalogSignature(baselineRef.current)) {
          setOrderConflict(true);
          toast.error("El catálogo cambió. Cancela este orden para cargar la versión actual y vuelve a aplicar el movimiento.");
          return;
        }
      }
      const ids = presets.map((p) => p.id);
      const saved = await reorderPresets.mutateAsync({
        data: {
          scope: scope.value,
          ids,
          ...(isProfile ? { expectedIds: baselineRef.current.map(item => item.id) } : {}),
        },
      });
      queryClient.setQueryData(getListAdminCoverPresetsQueryKey({ scope: scope.value }), saved);
      baselineRef.current = saved.presets;
      setPresets(saved.presets);
      clearSelection();
      setDirty(false);
      toast.success("Orden guardado");
      void queryClient.invalidateQueries({ queryKey: getListCoverPresetsQueryKey({ scope: scope.value }) });
    } catch (error) {
      if (isProfile && error && typeof error === "object" && "status" in error && error.status === 409) {
        setOrderConflict(true);
        await query.refetch();
        toast.error("El catálogo cambió. Cancela este orden para cargar la versión actual.");
      } else {
        toast.error("No se pudo guardar el orden");
      }
    } finally {
      savingRef.current = false;
      setCheckingOrder(false);
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
      toast.error(`Límite de ${maxSlots} imágenes alcanzado`);
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
    const action = isFixedSlots ? "restaurar el fondo incluido de" : "borrar";
    if (!window.confirm(`¿${action.charAt(0).toUpperCase()}${action.slice(1)} "${preset.label}"?`)) return;
    
    try {
      await deletePreset.mutateAsync({ id: preset.id });
      toast.success(isFixedSlots ? "Fondo incluido restaurado" : "Imagen eliminada");
      void query.refetch();
    } catch {
      toast.error("Error al eliminar la imagen");
    }
  }

  return (
    <div className="rounded-xl border border-border bg-card">
      <button
        type="button"
        className={`flex w-full items-center justify-between gap-4 p-6 text-left ${expanded ? "pb-4" : ""}`}
        aria-expanded={expanded}
        aria-controls={`cover-presets-${scope.value}`}
        onClick={() => setExpanded((value) => !value)}
      >
        <div>
          <h2 className="text-lg font-semibold">{scope.label}</h2>
          <p className="text-sm text-muted-foreground">{scope.description}</p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground" data-testid={`status-cover-presets-${scope.value}`}>
            {presets.length} / {maxSlots}
          </span>
          <ChevronDown className={`h-5 w-5 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} />
        </div>
      </button>

      {expanded && (
        <div id={`cover-presets-${scope.value}`} className="px-6 pb-6">
          {!isFixedSlots && (
            <div className="mb-4 flex justify-end">
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
          )}

          {isProfile && (
            <ProfileAvatarCategoryManager
              categories={categories}
              presets={presets}
              selectedCount={selectedIds.size}
              disabled={(isMutating && !categoryBusy) || lockingId !== null || query.isLoading}
              onBusyChange={busy => { categoryBusyRef.current = busy; setCategoryBusy(busy); }}
              onChanged={refreshCatalog}
              onBulk={(categoryId, add) => void changeMembership([...selectedIds], categoryId, add)}
            />
          )}
          {isProfile && presets.length > 0 && (
            <ProfileAvatarOrderControls
              count={selectedIds.size}
              total={presets.length}
              position={movePosition}
              error={moveError}
              disabled={isMutating || orderConflict}
              onPositionChange={value => { setMovePosition(value); setMoveError(null); }}
              onClear={clearSelection}
              onMove={moveSelection}
            />
          )}
          {orderConflict && (
            <p role="alert" className="mb-4 rounded-lg border border-destructive/40 p-3 text-sm">
              El catálogo cambió en otro lugar. Tu propuesta sigue visible. Pulsa Cancelar para cargar el catálogo actual antes de volver a ordenar.
            </p>
          )}
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
                draggable={!isMutating && !orderConflict && selectedIds.size === 0 && lockingId === null}
                onDragStart={() => {
                  if (isMutating || orderConflict || selectedIds.size > 0) return;
                  dragIdx.current = index;
                }}
                onDragEnter={() => onDragEnter(index)}
                onDragEnd={() => {
                  dragIdx.current = null;
                }}
                onDragOver={(e) => e.preventDefault()}
                className={`flex items-center gap-4 rounded-lg border bg-card px-4 py-3 transition-colors ${isProfile && selectedIds.has(preset.id) ? "border-primary ring-2 ring-primary/40" : "hover:bg-secondary/20"}`}
              >
                {isProfile && (
                    <input
                      type="checkbox"
                      aria-label={`Seleccionar ${preset.label}, posición ${index + 1}`}
                      checked={selectedIds.has(preset.id)}
                      disabled={isMutating || orderConflict}
                      className="h-4 w-4 shrink-0 accent-primary"
                      onChange={event => {
                        const checked = event.target.checked;
                        dragIdx.current = null;
                        setSelectedIds(current => {
                          const next = new Set(current);
                          if (checked) next.add(preset.id); else next.delete(preset.id);
                          return next;
                        });
                        setMoveError(null);
                      }}
                    />
                )}
                <GripVertical className="h-5 w-5 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing" />
                <span className="w-5 shrink-0 text-right text-xs text-muted-foreground">
                  {index + 1}
                </span>
                
                <div className={`relative shrink-0 overflow-hidden border border-border bg-secondary ${isProfile ? "h-24 w-24 rounded-full" : "h-12 w-12 rounded-md"}`}>
                  {previewUrl(preset.objectPath, preset.builtinKey) ? (
                    <img
                      src={previewUrl(preset.objectPath, preset.builtinKey)!}
                      alt={preset.label}
                      loading={isProfile ? "lazy" : undefined}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <ImageIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                  )}
                  {scope.value === "profile" && preset.isLocked && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center" style={{ backgroundColor: "rgba(255,255,255,0.4)" }}>
                      <LockKeyhole className="h-4 w-4 text-[#F9F9F9]" aria-hidden="true" />
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
                  {isProfile && (
                    <ProfileAvatarCategoryPicker
                      label={preset.label}
                      categories={categories}
                      categoryIds={preset.categoryIds ?? []}
                      disabled={isMutating || lockingId !== null}
                      onToggle={(categoryId, add) => void changeMembership([preset.id], categoryId, add)}
                    />
                  )}
                  {scope.value === "profile" && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      aria-label={preset.isLocked ? `Desbloquear ${preset.label}` : `Bloquear ${preset.label}`}
                      title={preset.isLocked ? "Desbloquear avatar" : "Bloquear avatar"}
                      aria-pressed={!!preset.isLocked}
                      disabled={isMutating || dirty || lockingId !== null}
                      onClick={() => void handleToggleLock(preset)}
                    >
                      {lockingId === preset.id ? <Loader2 className="h-4 w-4 animate-spin" /> : preset.isLocked ? <LockKeyhole className="h-4 w-4 text-[#F9F9F9]" /> : <UnlockKeyhole className="h-4 w-4" />}
                    </Button>
                  )}
                  <label className={`inline-flex h-8 cursor-pointer items-center justify-center rounded-md px-3 text-xs font-medium transition-colors hover:bg-secondary hover:text-foreground ${isMutating || dirty ? 'pointer-events-none opacity-50 text-muted-foreground' : 'text-muted-foreground'}`}>
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => void handleReplace(preset.id, e)}
                      disabled={isMutating || dirty}
                    />
                    {isFixedSlots ? "Cambiar fondo" : "Reemplazar"}
                  </label>
                  {(!isFixedSlots || preset.source === "object") && (
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
                  )}
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
                  onClick={cancelOrder}
                  disabled={isMutating}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  onClick={saveOrder}
                  disabled={isMutating || orderConflict}
                >
                  {isMutating ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Guardar orden
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
