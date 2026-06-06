import { useState, useRef } from "react";
import { toast } from "sonner";
import { Upload, Loader2, Plus, Trash2, Pencil, X, Check, Music2 } from "lucide-react";
import {
  useGetAdminSounds,
  useCreateAdminSound,
  useUpdateAdminSound,
  useDeleteAdminSound,
  useRequestUploadUrl,
  getGetAdminSoundsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Constantes ────────────────────────────────────────────────────────────────

const CATEGORIES = [
  { id: "animales",         label: "Animales" },
  { id: "bosque",           label: "Bosque" },
  { id: "mar",              label: "Mar" },
  { id: "fuego",            label: "Fuego" },
  { id: "desierto",         label: "Desierto" },
  { id: "cuencos_tibetanos", label: "Cuencos Tibetanos" },
  { id: "cuencos_cuarzo",   label: "Cuencos de Cuarzo" },
  { id: "gongs",            label: "Gongs" },
  { id: "campanas_viento",  label: "Campanas de Viento" },
  { id: "mantras",          label: "Mantras" },
  { id: "solfeggio",        label: "Solfeggio" },
  { id: "ruidos",           label: "Ruidos" },
  { id: "frecuencias",      label: "Frecuencias" },
] as const;

type CategoryId = (typeof CATEGORIES)[number]["id"];

const ICON_SETS = ["feather", "ionicons"] as const;

interface FormState {
  id: string;
  name: string;
  categoryId: CategoryId | "";
  iconName: string;
  iconSet: "feather" | "ionicons";
  isPremium: boolean;
  objectPath: string;
  sortOrder: string;
}

const emptyForm = (): FormState => ({
  id: "",
  name: "",
  categoryId: "",
  iconName: "music",
  iconSet: "feather",
  isPremium: false,
  objectPath: "",
  sortOrder: "0",
});

// ── Upload helper ─────────────────────────────────────────────────────────────

function useUpload() {
  const { mutateAsync: requestUrl } = useRequestUploadUrl();
  const [progress, setProgress] = useState<number | null>(null);

  const upload = async (file: File): Promise<string> => {
    setProgress(0);
    const { uploadURL, objectPath } = await requestUrl({
      data: { name: file.name, size: file.size, contentType: file.type },
    });
    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", uploadURL);
      xhr.setRequestHeader("Content-Type", file.type);
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) setProgress(Math.round((e.loaded / e.total) * 100));
      };
      xhr.onload = () => (xhr.status >= 200 && xhr.status < 300 ? resolve() : reject(new Error(`Upload failed: ${xhr.status}`)));
      xhr.onerror = () => reject(new Error("Network error"));
      xhr.send(file);
    });
    setProgress(null);
    return objectPath;
  };

  return { upload, progress };
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function SonidosPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useGetAdminSounds({
    query: { queryKey: getGetAdminSoundsQueryKey() },
  });
  const { mutateAsync: createSound } = useCreateAdminSound();
  const { mutateAsync: updateSound } = useUpdateAdminSound();
  const { mutateAsync: deleteSound } = useDeleteAdminSound();
  const { upload, progress: uploadProgress } = useUpload();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [filterCat, setFilterCat] = useState<string>("all");
  const fileRef = useRef<HTMLInputElement>(null);

  const sounds = data?.sounds ?? [];
  const filtered = filterCat === "all" ? sounds : sounds.filter((s) => s.categoryId === filterCat);

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setAudioFile(null);
    setShowForm(true);
  }

  function openEdit(s: (typeof sounds)[number]) {
    setEditingId(s.id);
    setForm({
      id: s.id,
      name: s.name,
      categoryId: s.categoryId as CategoryId,
      iconName: s.iconName,
      iconSet: s.iconSet as "feather" | "ionicons",
      isPremium: s.isPremium,
      objectPath: s.objectPath ?? "",
      sortOrder: String(s.sortOrder),
    });
    setAudioFile(null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setAudioFile(null);
  }

  function field(key: keyof FormState, val: string | boolean) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.categoryId) { toast.error("Seleccioná una categoría"); return; }
    if (!form.id.trim() || !form.name.trim()) { toast.error("ID y nombre son requeridos"); return; }
    setSaving(true);
    try {
      let objectPath = form.objectPath || null;
      if (audioFile) {
        objectPath = await upload(audioFile);
      }
      if (editingId) {
        await updateSound({
          id: editingId,
          data: {
            name: form.name,
            categoryId: form.categoryId,
            iconName: form.iconName,
            iconSet: form.iconSet,
            isPremium: form.isPremium,
            isActive: true,
            objectPath,
            sortOrder: parseInt(form.sortOrder) || 0,
          },
        });
        toast.success("Sonido actualizado");
      } else {
        await createSound({
          data: {
            id: form.id.trim().toLowerCase().replace(/\s+/g, "_"),
            name: form.name,
            categoryId: form.categoryId,
            iconName: form.iconName,
            iconSet: form.iconSet,
            isPremium: form.isPremium,
            objectPath,
            sortOrder: parseInt(form.sortOrder) || 0,
          },
        });
        toast.success("Sonido creado");
      }
      await qc.invalidateQueries({ queryKey: getGetAdminSoundsQueryKey() });
      closeForm();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(s: (typeof sounds)[number]) {
    try {
      await updateSound({ id: s.id, data: { isActive: !s.isActive } });
      await qc.invalidateQueries({ queryKey: getGetAdminSoundsQueryKey() });
    } catch {
      toast.error("Error al actualizar");
    }
  }

  async function togglePremium(s: (typeof sounds)[number]) {
    try {
      await updateSound({ id: s.id, data: { isPremium: !s.isPremium } });
      await qc.invalidateQueries({ queryKey: getGetAdminSoundsQueryKey() });
    } catch {
      toast.error("Error al actualizar");
    }
  }

  async function handleDelete(s: (typeof sounds)[number]) {
    if (!confirm(`¿Eliminar "${s.name}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteSound({ id: s.id });
      await qc.invalidateQueries({ queryKey: getGetAdminSoundsQueryKey() });
      toast.success("Sonido eliminado");
    } catch {
      toast.error("Error al eliminar");
    }
  }

  const catLabel = (id: string) => CATEGORIES.find((c) => c.id === id)?.label ?? id;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sonidos del Mixer</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {sounds.length} sonido{sounds.length !== 1 ? "s" : ""} registrado{sounds.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo sonido
        </Button>
      </div>

      {/* Formulario */}
      {showForm && (
        <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              {editingId ? "Editar sonido" : "Nuevo sonido"}
            </h2>
            <button type="button" onClick={closeForm} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* ID */}
            <div className="space-y-1">
              <Label>ID (slug único)</Label>
              <Input
                value={form.id}
                onChange={(e) => field("id", e.target.value)}
                placeholder="ej. viento"
                disabled={!!editingId}
                required
              />
              {!editingId && <p className="text-xs text-muted-foreground">Solo letras minúsculas, números y guiones</p>}
            </div>

            {/* Nombre */}
            <div className="space-y-1">
              <Label>Nombre</Label>
              <Input
                value={form.name}
                onChange={(e) => field("name", e.target.value)}
                placeholder="ej. Viento"
                required
              />
            </div>

            {/* Categoría */}
            <div className="space-y-1">
              <Label>Categoría</Label>
              <Select value={form.categoryId} onValueChange={(v) => field("categoryId", v)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar categoría" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Icono */}
            <div className="space-y-1">
              <Label>Ícono</Label>
              <div className="flex gap-2">
                <Input
                  value={form.iconName}
                  onChange={(e) => field("iconName", e.target.value)}
                  placeholder="ej. wind"
                  className="flex-1"
                />
                <Select value={form.iconSet} onValueChange={(v) => field("iconSet", v)}>
                  <SelectTrigger className="w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ICON_SETS.map((s) => (
                      <SelectItem key={s} value={s}>{s}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Orden */}
            <div className="space-y-1">
              <Label>Orden</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => field("sortOrder", e.target.value)}
                min={0}
              />
            </div>

            {/* Premium */}
            <div className="space-y-1">
              <Label>Premium</Label>
              <div className="flex items-center gap-3 h-9">
                <Switch checked={form.isPremium} onCheckedChange={(v) => field("isPremium", v)} />
                <span className="text-sm text-muted-foreground">{form.isPremium ? "Sí" : "No"}</span>
              </div>
            </div>

            {/* Audio MP3 */}
            <div className="space-y-1 md:col-span-2">
              <Label>Audio MP3 (loop)</Label>
              <div
                className="border border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileRef.current?.click()}
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="audio/mpeg,audio/mp3,audio/*"
                  className="hidden"
                  onChange={(e) => setAudioFile(e.target.files?.[0] ?? null)}
                />
                {audioFile ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-foreground">
                    <Music2 className="w-4 h-4 text-primary" />
                    {audioFile.name} ({(audioFile.size / 1024 / 1024).toFixed(1)} MB)
                  </div>
                ) : form.objectPath ? (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Check className="w-4 h-4 text-green-500" />
                    Audio ya cargado — clic para reemplazar
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Upload className="w-4 h-4" />
                    Clic para seleccionar un MP3
                  </div>
                )}
                {uploadProgress !== null && (
                  <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary rounded-full transition-all"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                )}
              </div>
              {form.objectPath && !audioFile && (
                <p className="text-xs text-muted-foreground break-all">Path: {form.objectPath}</p>
              )}
            </div>

            {/* Acciones */}
            <div className="md:col-span-2 flex justify-end gap-3 pt-2">
              <Button type="button" variant="outline" onClick={closeForm}>
                Cancelar
              </Button>
              <Button type="submit" disabled={saving} className="gap-2 min-w-28">
                {saving ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Guardando…</>
                ) : (
                  <><Check className="w-4 h-4" /> {editingId ? "Guardar" : "Crear"}</>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

      {/* Filtro por categoría */}
      <div className="flex items-center gap-2 flex-wrap">
        <button
          onClick={() => setFilterCat("all")}
          className={`px-3 py-1 rounded-full text-sm transition-colors ${
            filterCat === "all"
              ? "bg-primary/20 text-primary font-medium"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Todos ({sounds.length})
        </button>
        {CATEGORIES.filter((c) => sounds.some((s) => s.categoryId === c.id)).map((c) => (
          <button
            key={c.id}
            onClick={() => setFilterCat(c.id)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              filterCat === c.id
                ? "bg-primary/20 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {c.label} ({sounds.filter((s) => s.categoryId === c.id).length})
          </button>
        ))}
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Music2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="font-medium">Sin sonidos</p>
          <p className="text-sm mt-1">Creá el primer sonido con el botón de arriba.</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Nombre</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Categoría</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Ícono</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Audio</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Premium</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Activo</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((s, i) => (
                <tr
                  key={s.id}
                  className={`border-b border-border last:border-0 ${i % 2 === 0 ? "" : "bg-secondary/20"}`}
                >
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.id}</div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">{catLabel(s.categoryId)}</Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-xs">
                    {s.iconName} <span className="opacity-60">({s.iconSet})</span>
                  </td>
                  <td className="px-4 py-3">
                    {s.objectPath ? (
                      <span className="text-green-500 text-xs">✓ Cargado</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">Sin audio</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Switch
                      checked={s.isPremium}
                      onCheckedChange={() => togglePremium(s)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Switch
                      checked={s.isActive}
                      onCheckedChange={() => toggleActive(s)}
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <button
                        type="button"
                        onClick={() => openEdit(s)}
                        className="p-1.5 text-muted-foreground hover:text-foreground rounded-md hover:bg-secondary transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(s)}
                        className="p-1.5 text-muted-foreground hover:text-destructive rounded-md hover:bg-secondary transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
