import { useState, useRef } from "react";
import { toast } from "sonner";
import { Upload, Loader2, Plus, Trash2, Pencil, X, Check, Music2, Image } from "lucide-react";
import {
  useGetAdminSounds,
  useCreateAdminSound,
  useUpdateAdminSound,
  useDeleteAdminSound,
  useRequestUploadUrl,
  getGetAdminSoundsQueryKey,
  useListAdminSoundCategories,
  useCreateAdminSoundCategory,
  useUpdateAdminSoundCategory,
  useDeleteAdminSoundCategory,
  getListAdminSoundCategoriesQueryKey,
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

const BPM_OPTIONS = [44, 50, 68, 72] as const;

interface FormState {
  soundType: "ambiental" | "bpm" | "";
  id: string;
  name: string;
  categoryId: string;
  isPremium: boolean;
  objectPath: string;
  thumbnailObjectPath: string;
  bpm: string;
  loopBars: string;
  sortOrder: string;
}

const emptyForm = (): FormState => ({
  soundType: "",
  id: "",
  name: "",
  categoryId: "",
  isPremium: false,
  objectPath: "",
  thumbnailObjectPath: "",
  bpm: "",
  loopBars: "",
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

function storageUrl(objectPath: string) {
  return `/api/storage/${objectPath}`;
}

// ── Componente principal ──────────────────────────────────────────────────────

export default function SonidosPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useGetAdminSounds({
    query: { queryKey: getGetAdminSoundsQueryKey() },
  });
  const { data: categoryData } = useListAdminSoundCategories({
    query: { queryKey: getListAdminSoundCategoriesQueryKey() },
  });
  const { mutateAsync: createCategory } = useCreateAdminSoundCategory();
  const { mutateAsync: updateCategory } = useUpdateAdminSoundCategory();
  const { mutateAsync: deleteCategory } = useDeleteAdminSoundCategory();
  const { mutateAsync: createSound } = useCreateAdminSound();
  const { mutateAsync: updateSound } = useUpdateAdminSound();
  const { mutateAsync: deleteSound } = useDeleteAdminSound();
  const { upload: uploadAudio, progress: audioProgress } = useUpload();
  const { upload: uploadThumb, progress: thumbProgress } = useUpload();

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [saving, setSaving] = useState(false);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [thumbFile, setThumbFile] = useState<File | null>(null);
  const [thumbPreview, setThumbPreview] = useState<string | null>(null);
  const [filterCat, setFilterCat] = useState<string>("all");
  const [newCategoryName, setNewCategoryName] = useState("");
  const audioRef = useRef<HTMLInputElement>(null);
  const thumbRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);

  const sounds = data?.sounds ?? [];
  const categories = (categoryData?.categories ?? []) as Array<{
    id: string; label: string; isActive: boolean; sortOrder: number;
  }>;
  const categoryLabel = (c: (typeof categories)[number]) => c.label;
  const filtered = filterCat === "all" ? sounds : sounds.filter((s) => s.categoryId === filterCat);
  const isBpmCategory = form.soundType === "bpm";

  function openCreate() {
    setEditingId(null);
    setForm(emptyForm());
    setAudioFile(null);
    setThumbFile(null);
    setThumbPreview(null);
    setShowForm(true);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    });
  }

  function openEdit(s: (typeof sounds)[number]) {
    setEditingId(s.id);
    setForm({
      soundType: s.categoryId === "bpm" ? "bpm" : "ambiental",
      id: s.id,
      name: s.name,
       categoryId: s.categoryId,
      isPremium: s.isPremium,
      objectPath: s.objectPath ?? "",
      thumbnailObjectPath: s.thumbnailObjectPath ?? "",
      bpm: s.bpm != null ? String(s.bpm) : "",
      loopBars: s.loopBars != null ? String(s.loopBars) : "",
      sortOrder: String(s.sortOrder),
    });
    setAudioFile(null);
    setThumbFile(null);
    setThumbPreview(s.thumbnailObjectPath ? storageUrl(s.thumbnailObjectPath) : null);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setAudioFile(null);
    setThumbFile(null);
    setThumbPreview(null);
  }

  function field(key: keyof FormState, val: string | boolean | string[]) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  function setSoundType(type: "ambiental" | "bpm") {
    setForm((f) => ({
      ...f,
      soundType: type,
      categoryId: type === "bpm" ? "bpm" : (f.categoryId === "bpm" ? "" : f.categoryId),
      bpm: type === "ambiental" ? "" : f.bpm,
      loopBars: type === "ambiental" ? "" : f.loopBars,
    }));
  }

  function onThumbChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    setThumbFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setThumbPreview(url);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.categoryId) { toast.error("Seleccioná una categoría"); return; }
    if (!form.id.trim() || !form.name.trim()) { toast.error("ID y nombre son requeridos"); return; }
    setSaving(true);
    try {
      let objectPath = form.objectPath || null;
      if (audioFile) objectPath = await uploadAudio(audioFile);

      let thumbnailObjectPath = form.thumbnailObjectPath || null;
      if (thumbFile) thumbnailObjectPath = await uploadThumb(thumbFile);

      const bpmVal = isBpmCategory && form.bpm ? parseInt(form.bpm) : null;
      const loopBarsVal = isBpmCategory && form.loopBars ? parseInt(form.loopBars) : null;
      if (editingId) {
        await updateSound({
          id: editingId,
          data: {
            name: form.name,
            categoryId: form.categoryId as never,
            isPremium: form.isPremium,
            objectPath,
            thumbnailObjectPath,
            bpm: bpmVal,
            loopBars: loopBarsVal,
            sortOrder: parseInt(form.sortOrder) || 0,
          },
        });
        toast.success("Sonido actualizado");
      } else {
        await createSound({
          data: {
            id: form.id.trim().toLowerCase().replace(/\s+/g, "_"),
            name: form.name,
            categoryId: form.categoryId as never,
            // Kept only for compatibility with older generated create types;
            // these values are not user-editable legacy fields.
            iconName: "music",
            iconSet: "feather",
            isPremium: form.isPremium,
            objectPath,
            thumbnailObjectPath,
            bpm: bpmVal,
            loopBars: loopBarsVal,
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

  const catLabel = (id: string) => {
    const category = categories.find((c) => c.id === id);
    return category ? categoryLabel(category) : id;
  };

  async function addCategory() {
    const name = newCategoryName.trim();
    if (!name) return;
    try {
      const id = name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
      await createCategory({ data: { id, label: name, sortOrder: categories.length, isActive: true } });
      setNewCategoryName("");
      await qc.invalidateQueries({ queryKey: getListAdminSoundCategoriesQueryKey() });
      toast.success("Categoría creada");
    } catch { toast.error("No se pudo crear la categoría"); }
  }

  async function renameCategory(category: (typeof categories)[number]) {
    const name = prompt("Nuevo nombre de categoría", categoryLabel(category))?.trim();
    if (!name || name === categoryLabel(category)) return;
    try {
      await updateCategory({ id: category.id, data: { label: name } });
      await qc.invalidateQueries({ queryKey: getListAdminSoundCategoriesQueryKey() });
    } catch { toast.error("No se pudo renombrar la categoría"); }
  }

  async function toggleCategory(category: (typeof categories)[number]) {
    try {
      await updateCategory({ id: category.id, data: { isActive: !category.isActive } });
      await qc.invalidateQueries({ queryKey: getListAdminSoundCategoriesQueryKey() });
    } catch { toast.error("No se pudo actualizar la categoría"); }
  }

  async function moveCategory(category: (typeof categories)[number], direction: -1 | 1) {
    const ordered = [...categories].sort((a, b) => a.sortOrder - b.sortOrder);
    const index = ordered.findIndex((c) => c.id === category.id);
    const other = ordered[index + direction];
    if (!other) return;
    try {
      await updateCategory({ id: category.id, data: { sortOrder: index + direction } });
      await qc.invalidateQueries({ queryKey: getListAdminSoundCategoriesQueryKey() });
    } catch { toast.error("No se pudo reordenar"); }
  }

  async function removeCategory(category: (typeof categories)[number]) {
    if (!confirm(`¿Eliminar "${categoryLabel(category)}"?`)) return;
    try {
      await deleteCategory({ id: category.id });
      await qc.invalidateQueries({ queryKey: getListAdminSoundCategoriesQueryKey() });
    } catch { toast.error("No se pudo eliminar la categoría"); }
  }

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
        <Button type="button" onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Nuevo sonido
        </Button>
      </div>

      {/* Gestión de categorías canónicas */}
      <section className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <div>
          <h2 className="font-semibold text-foreground">Categorías del mixer</h2>
          <p className="text-xs text-muted-foreground">Estas categorías aparecen en el selector y en la app.</p>
        </div>
        <div className="flex gap-2">
          <Input value={newCategoryName} onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Nueva categoría" onKeyDown={(e) => e.key === "Enter" && addCategory()} />
          <Button type="button" variant="outline" onClick={addCategory}><Plus className="w-4 h-4 mr-1" />Crear</Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {[...categories].sort((a, b) => a.sortOrder - b.sortOrder).map((category, index) => (
            <div key={category.id} className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-sm ${category.isActive ? "" : "opacity-50"}`}>
              <span>{categoryLabel(category)}</span>
              <button type="button" title="Subir" disabled={index === 0} onClick={() => moveCategory(category, -1)}>↑</button>
              <button type="button" title="Bajar" disabled={index === categories.length - 1} onClick={() => moveCategory(category, 1)}>↓</button>
              <button type="button" title="Renombrar" onClick={() => renameCategory(category)}><Pencil className="w-3 h-3" /></button>
              <button type="button" title={category.isActive ? "Desactivar" : "Activar"} onClick={() => toggleCategory(category)}>
                {category.isActive ? "●" : "○"}
              </button>
              <button type="button" title="Eliminar" onClick={() => removeCategory(category)}><Trash2 className="w-3 h-3" /></button>
            </div>
          ))}
        </div>
      </section>

      {/* Formulario */}
      {showForm && (
        <div ref={formRef} className="bg-card border border-border rounded-2xl p-6 space-y-4 scroll-mt-6">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">
              {editingId ? "Editar sonido" : "Nuevo sonido"}
            </h2>
            <button type="button" onClick={closeForm} className="text-muted-foreground hover:text-foreground">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* ── Tipo de sonido ── */}
            <div className="col-span-full space-y-2">
              <Label>Tipo de sonido</Label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSoundType("ambiental")}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    form.soundType === "ambiental"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <div className="font-semibold text-sm">🌿 Ambiental</div>
                  <div className="text-xs text-muted-foreground mt-1">Textura de fondo, loop continuo</div>
                </button>
                <button
                  type="button"
                  onClick={() => setSoundType("bpm")}
                  className={`p-4 rounded-xl border-2 text-left transition-all ${
                    form.soundType === "bpm"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <div className="font-semibold text-sm">🥁 BPM / Rítmico</div>
                  <div className="text-xs text-muted-foreground mt-1">Loop con tempo sincronizado</div>
                </button>
              </div>
            </div>

            {/* ID */}
            {form.soundType !== "" && (
              <div className="space-y-1">
                <Label>ID (slug único)</Label>
                <Input
                  value={form.id}
                  onChange={(e) => field("id", e.target.value)}
                  placeholder="ej. viento_nuevo"
                  disabled={!!editingId}
                  required
                />
                {!editingId && <p className="text-xs text-muted-foreground">Solo letras minúsculas, números y guiones</p>}
              </div>
            )}

            {/* Nombre */}
            {form.soundType !== "" && (
              <div className="space-y-1">
                <Label>Nombre</Label>
                <Input
                  value={form.name}
                  onChange={(e) => field("name", e.target.value)}
                  placeholder="ej. Viento suave"
                  required
                />
              </div>
            )}

            {/* Categoría canónica */}
            {form.soundType !== "" && (
              <div className="space-y-1">
                <Label>Categoría</Label>
                <Select value={form.categoryId} onValueChange={(v) => field("categoryId", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.filter((c) => c.isActive).map((c) => (
                      <SelectItem key={c.id} value={c.id}>{categoryLabel(c)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* BPM + Compases (solo BPM) */}
            {form.soundType === "bpm" && (
              <>
                <div className="space-y-1">
                  <Label>Tempo</Label>
                  <Select value={form.bpm} onValueChange={(v) => field("bpm", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar BPM" />
                    </SelectTrigger>
                    <SelectContent>
                      {BPM_OPTIONS.map((b) => (
                        <SelectItem key={b} value={String(b)}>{b} BPM</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label>Compases del loop</Label>
                  <Input
                    type="number"
                    value={form.loopBars}
                    onChange={(e) => field("loopBars", e.target.value)}
                    placeholder="ej. 8"
                    min={1}
                  />
                  <p className="text-xs text-muted-foreground">
                    {form.bpm && form.loopBars
                      ? `Loop = ${((60 / Number(form.bpm)) * 4 * Number(form.loopBars)).toFixed(2)} s`
                      : "Número de compases (4/4) del loop"}
                  </p>
                </div>
              </>
            )}

            {/* Orden */}
            {form.soundType !== "" && (
              <div className="space-y-1">
                <Label>Orden</Label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => field("sortOrder", e.target.value)}
                  min={0}
                />
              </div>
            )}

            {/* Premium */}
            {form.soundType !== "" && (
              <div className="space-y-1">
                <Label>Premium</Label>
                <div className="flex items-center gap-3 h-9">
                  <Switch checked={form.isPremium} onCheckedChange={(v) => field("isPremium", v)} />
                  <span className="text-sm text-muted-foreground">{form.isPremium ? "Sí" : "No"}</span>
                </div>
              </div>
            )}

            {/* Audio loop */}
            {form.soundType !== "" && (
            <div className="space-y-1">
              <Label>Audio loop (.m4a / .mp3)</Label>
              <div
                className="border border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => audioRef.current?.click()}
              >
                <input
                  ref={audioRef}
                  type="file"
                  accept="audio/*,.m4a,.mp3,.aac"
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
                    Audio cargado — clic para reemplazar
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Upload className="w-4 h-4" />
                    Clic para seleccionar audio
                  </div>
                )}
                {audioProgress !== null && (
                  <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${audioProgress}%` }} />
                  </div>
                )}
              </div>
            </div>
            )}

            {/* Thumbnail */}
            {form.soundType !== "" && (
            <div className="space-y-1">
              <Label>Thumbnail (imagen)</Label>
              <div
                className="border border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors relative overflow-hidden"
                style={{ minHeight: 88 }}
                onClick={() => thumbRef.current?.click()}
              >
                <input
                  ref={thumbRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={onThumbChange}
                />
                {thumbPreview ? (
                  <div className="flex items-center gap-3">
                    <img src={thumbPreview} alt="preview" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                    <span className="text-xs text-muted-foreground">
                      {thumbFile ? thumbFile.name : "Imagen guardada"} — clic para reemplazar
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                    <Image className="w-4 h-4" />
                    Clic para seleccionar imagen
                  </div>
                )}
                {thumbProgress !== null && (
                  <div className="mt-2 h-1 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${thumbProgress}%` }} />
                  </div>
                )}
              </div>
            </div>
            )}

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
        {categories.filter((c) => sounds.some((s) => s.categoryId === c.id)).map((c) => (
          <button
            key={c.id}
            onClick={() => setFilterCat(c.id)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              filterCat === c.id
                ? "bg-primary/20 text-primary font-medium"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {categoryLabel(c)} ({sounds.filter((s) => s.categoryId === c.id).length})
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
        <div className="bg-card border border-border rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium w-10"></th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Nombre</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Categoría</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">BPM</th>
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
                  {/* Thumbnail */}
                  <td className="px-4 py-2">
                    {s.thumbnailObjectPath ? (
                      <div className="w-[110px] h-[110px] rounded-md overflow-hidden flex-shrink-0">
                        <img
                          src={storageUrl(s.thumbnailObjectPath)}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-[110px] h-[110px] rounded-md bg-secondary flex items-center justify-center flex-shrink-0">
                        <Music2 className="w-4 h-4 text-muted-foreground" />
                      </div>
                    )}
                  </td>
                  {/* Nombre + ID */}
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{s.name}</div>
                    <div className="text-xs text-muted-foreground">{s.id}</div>
                  </td>
                  {/* Categoría */}
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">{catLabel(s.categoryId)}</Badge>
                  </td>
                  {/* BPM */}
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {s.bpm != null ? (
                      <span className="text-foreground font-medium">{s.bpm} BPM</span>
                    ) : "—"}
                    {s.loopBars != null && (
                      <span className="ml-1 opacity-60">/ {s.loopBars} bars</span>
                    )}
                  </td>
                  {/* Audio */}
                  <td className="px-4 py-3">
                    {s.objectPath ? (
                      <span className="text-green-500 text-xs">✓ Cargado</span>
                    ) : (
                      <span className="text-muted-foreground text-xs">Sin audio</span>
                    )}
                  </td>
                  {/* Premium */}
                  <td className="px-4 py-3">
                    <Switch checked={s.isPremium} onCheckedChange={() => togglePremium(s)} />
                  </td>
                  {/* Activo */}
                  <td className="px-4 py-3">
                    <Switch checked={s.isActive} onCheckedChange={() => toggleActive(s)} />
                  </td>
                  {/* Acciones */}
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
