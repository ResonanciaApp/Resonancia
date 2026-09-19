import { useEffect, useRef, useState } from "react";
import {
  type ExploreSection,
  useDeleteAdminExploreSection,
  useGetAdminExploreSections,
  useRequestUploadUrl,
  useUpdateAdminExploreSections,
} from "@workspace/api-client-react";
import {
  ChevronDown,
  Eye,
  EyeOff,
  GripVertical,
  Image as ImageIcon,
  Loader2,
  Save,
  Trash2,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

function previewUrl(path: string | null) {
  if (!path) return null;
  if (/^https?:\/\//i.test(path)) return path;
  if (path.startsWith("/objects/")) {
    return path.replace(/^\/objects\//, "/api/storage/objects/");
  }
  return path;
}

export default function ExplorarPage() {
  const query = useGetAdminExploreSections();
  const updateSections = useUpdateAdminExploreSections();
  const deleteSection = useDeleteAdminExploreSection();
  const requestUploadUrl = useRequestUploadUrl();
  const [sections, setSections] = useState<ExploreSection[]>([]);
  const [dirty, setDirty] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const dragIdx = useRef<number | null>(null);

  useEffect(() => {
    if (!query.data || dirty) return;
    setSections(query.data.sections);
  }, [dirty, query.data]);

  useEffect(() => {
    if (query.error) toast.error("No se pudieron cargar las secciones");
  }, [query.error]);

  function toggleVisible(id: number) {
    setSections((current) =>
      current.map((section) =>
        section.id === id ? { ...section, visible: !section.visible } : section,
      ),
    );
    setDirty(true);
  }

  function onDragEnter(index: number) {
    if (dragIdx.current === null || dragIdx.current === index) return;
    setSections((current) => {
      const next = [...current];
      const [moved] = next.splice(dragIdx.current!, 1);
      next.splice(index, 0, moved);
      dragIdx.current = index;
      return next;
    });
    setDirty(true);
  }

  async function save() {
    try {
      const response = await updateSections.mutateAsync({
        data: {
          sections: sections.map((section, index) => ({
            id: section.id,
            sortOrder: index,
            visible: section.visible,
            coverImagePath: section.coverImagePath,
          })),
        },
      });
      setSections(response.sections);
      setDirty(false);
      toast.success("Otras temáticas guardadas");
    } catch {
      toast.error("No se pudieron guardar los cambios");
    }
  }

  async function uploadCover(sectionId: number, file: File) {
    if (!file.type.startsWith("image/")) {
      toast.error("Selecciona una imagen JPG, PNG o WebP");
      return;
    }
    setUploadingId(sectionId);
    try {
      const { uploadURL, objectPath } = await requestUploadUrl.mutateAsync({
        data: { name: file.name, contentType: file.type, size: file.size },
      });
      const uploaded = await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      if (!uploaded.ok) throw new Error("Upload failed");
      setSections((current) =>
        current.map((section) =>
          section.id === sectionId ? { ...section, coverImagePath: objectPath } : section,
        ),
      );
      setDirty(true);
      toast.success("Portada subida. Presiona Guardar para publicarla.");
    } catch {
      toast.error("No se pudo subir la portada");
    } finally {
      setUploadingId(null);
    }
  }

  async function removeSection(section: ExploreSection) {
    if (!section.canDelete) return;
    if (!window.confirm(`¿Borrar “${section.label}” de Otras temáticas?`)) return;
    try {
      await deleteSection.mutateAsync({ id: section.id });
      setSections((current) => current.filter((item) => item.id !== section.id));
      if (expandedId === section.id) setExpandedId(null);
      toast.success("Card eliminada");
    } catch (error) {
      const apiError = error as { data?: { error?: string } };
      toast.error(apiError.data?.error ?? "No se pudo eliminar la card");
      void query.refetch();
    }
  }

  if (query.isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Explorar — Otras temáticas</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Arrastrá para ordenar. Tocá una card para editar su portada o revisar si puede borrarse.
          </p>
        </div>
        <Button onClick={() => void save()} disabled={!dirty || updateSections.isPending} size="sm">
          {updateSections.isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          <span className="ml-2">Guardar</span>
        </Button>
      </div>

      <div className="space-y-2">
        {sections.map((section, index) => (
          <div
            key={section.id}
            className={`rounded-lg border bg-card transition-opacity ${
              !section.visible ? "opacity-60" : ""
            }`}
          >
            <div
              draggable
              onDragStart={() => {
                dragIdx.current = index;
              }}
              onDragEnter={() => onDragEnter(index)}
              onDragEnd={() => {
                dragIdx.current = null;
              }}
              onDragOver={(event) => event.preventDefault()}
              onClick={() =>
                setExpandedId((current) => (current === section.id ? null : section.id))
              }
              className="flex cursor-pointer select-none items-center gap-3 px-4 py-3"
            >
              <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground active:cursor-grabbing" />
              <span className="w-5 shrink-0 text-right text-xs text-muted-foreground">
                {index + 1}
              </span>
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border bg-secondary">
                {section.coverImagePath ? (
                  <img
                    src={previewUrl(section.coverImagePath) ?? undefined}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <ImageIcon className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
              </div>
              <span className="flex-1 text-sm font-medium">{section.label}</span>
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  toggleVisible(section.id);
                }}
                className="rounded p-1.5 transition-colors hover:bg-secondary"
                title={section.visible ? "Ocultar card" : "Mostrar card"}
              >
                {section.visible ? (
                  <Eye className="h-4 w-4 text-primary" />
                ) : (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
              <ChevronDown
                className={`h-4 w-4 text-muted-foreground transition-transform ${
                  expandedId === section.id ? "rotate-180" : ""
                }`}
              />
            </div>

            {expandedId === section.id && (
              <div className="space-y-4 border-t border-border px-4 py-4">
                <div className="flex items-center gap-4">
                  <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-border bg-secondary">
                    {section.coverImagePath ? (
                      <img
                        src={previewUrl(section.coverImagePath) ?? undefined}
                        alt={`Portada de ${section.label}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <ImageIcon className="h-7 w-7 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="space-y-2">
                    <label className="inline-flex">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        disabled={uploadingId === section.id}
                        onChange={(event) => {
                          const file = event.target.files?.[0];
                          if (file) void uploadCover(section.id, file);
                          event.target.value = "";
                        }}
                      />
                      <span className="inline-flex h-9 cursor-pointer items-center rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-accent">
                        {uploadingId === section.id ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <ImageIcon className="mr-2 h-4 w-4" />
                        )}
                        {section.coverImagePath ? "Cambiar portada" : "Subir portada"}
                      </span>
                    </label>
                    {section.coverImagePath && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-muted-foreground"
                        onClick={() => {
                          setSections((current) =>
                            current.map((item) =>
                              item.id === section.id
                                ? { ...item, coverImagePath: null }
                                : item,
                            ),
                          );
                          setDirty(true);
                        }}
                      >
                        <X className="mr-1 h-3 w-3" />
                        Quitar portada
                      </Button>
                    )}
                    <p className="text-xs text-muted-foreground">
                      JPG, PNG o WebP · recomendado 800×800 px
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 border-t border-border pt-3">
                  <p className="text-xs text-muted-foreground">
                    {section.canDelete
                      ? "Esta temática personalizada no está asociada a ninguna sesión."
                      : section.deleteBlockedReason}
                  </p>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    disabled={!section.canDelete || deleteSection.isPending}
                    onClick={() => void removeSection(section)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Borrar card
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {dirty && (
        <p className="text-center text-xs text-muted-foreground">
          Cambios sin guardar — presioná “Guardar” para aplicarlos en la app.
        </p>
      )}
    </div>
  );
}