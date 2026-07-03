import { useState, useRef } from "react";
import { toast } from "sonner";
import { Upload, Loader2, Plus, Trash2, Pencil, X, Check, Music2, Image } from "lucide-react";
import {
  useGetAdminDescansoSounds,
  useCreateAdminDescansoSound,
  useUpdateAdminDescansoSound,
  useDeleteAdminDescansoSound,
  useRequestUploadUrl,
  getGetAdminDescansoSoundsQueryKey,
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

const CATEGORIES = [
  { id: "binaural",  label: "Sonidos Binaurales" },
  { id: "ambiental", label: "Ambientales"        },
] as const;

type DescansoCategory = typeof CATEGORIES[number]["id"];

interface SoundForm {
  id:                 string;
  label:              string;
  categoryId:         DescansoCategory;
  sortOrder:          string;
  isActive:           boolean;
  audioObjectPath:    string;
  thumbnailObjectPath: string;
}

const EMPTY_FORM: SoundForm = {
  id: "", label: "", categoryId: "binaural", sortOrder: "0",
  isActive: true, audioObjectPath: "", thumbnailObjectPath: "",
};

type Mode = "idle" | "create" | "edit";

function UploadBtn({
  label, accept, folder, onDone, uploading, setUploading,
}: {
  label: string;
  accept: string;
  folder: string;
  onDone: (objectPath: string) => void;
  uploading: boolean;
  setUploading: (v: boolean) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const { mutateAsync: requestUrl } = useRequestUploadUrl();

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const { uploadURL, objectPath } = await requestUrl({
        data: { name: file.name, size: file.size, contentType: file.type },
      });
      await new Promise<void>((res, rej) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", uploadURL);
        xhr.setRequestHeader("Content-Type", file.type);
        xhr.onload  = () => xhr.status < 300 ? res() : rej(new Error(`HTTP ${xhr.status}`));
        xhr.onerror = () => rej(new Error("Network error"));
        xhr.send(file);
      });
      onDone(objectPath);
      toast.success("Archivo subido");
    } catch {
      toast.error("Error al subir el archivo");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <>
      <input ref={fileRef} type="file" accept={accept} className="hidden" onChange={handleFile} />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={() => fileRef.current?.click()}
        className="gap-2"
      >
        {uploading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
        {label}
      </Button>
    </>
  );
}

export default function DescansoSonidosPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useGetAdminDescansoSounds({
    query: { queryKey: getGetAdminDescansoSoundsQueryKey() },
  });
  const { mutateAsync: createSound } = useCreateAdminDescansoSound();
  const { mutateAsync: updateSound } = useUpdateAdminDescansoSound();
  const { mutateAsync: deleteSound } = useDeleteAdminDescansoSound();

  const [mode,          setMode]     = useState<Mode>("idle");
  const [editId,        setEditId]   = useState<string | null>(null);
  const [form,          setForm]     = useState<SoundForm>(EMPTY_FORM);
  const [saving,        setSaving]   = useState(false);
  const [audioUp,       setAudioUp]  = useState(false);
  const [thumbUp,       setThumbUp]  = useState(false);

  const sounds = data?.sounds ?? [];

  function openCreate() {
    setForm(EMPTY_FORM);
    setEditId(null);
    setMode("create");
  }

  function openEdit(s: typeof sounds[number]) {
    setForm({
      id:                   s.id,
      label:                s.label,
      categoryId:           s.categoryId as DescansoCategory,
      sortOrder:            String(s.sortOrder),
      isActive:             s.isActive,
      audioObjectPath:      s.audioObjectPath ?? "",
      thumbnailObjectPath:  s.thumbnailObjectPath ?? "",
    });
    setEditId(s.id);
    setMode("edit");
  }

  function cancel() { setMode("idle"); setEditId(null); }

  const f = (k: keyof SoundForm, v: string | boolean) =>
    setForm((p) => ({ ...p, [k]: v }));

  async function handleSave() {
    if (!form.label.trim() || (mode === "create" && !form.id.trim())) {
      toast.error("ID y nombre son requeridos");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        label:               form.label.trim(),
        categoryId:          form.categoryId,
        sortOrder:           parseInt(form.sortOrder) || 0,
        isActive:            form.isActive,
        audioObjectPath:     form.audioObjectPath || null,
        thumbnailObjectPath: form.thumbnailObjectPath || null,
      };
      if (mode === "create") {
        await createSound({ data: { id: form.id.trim(), ...payload } });
        toast.success("Sonido creado");
      } else {
        await updateSound({ id: editId!, data: payload });
        toast.success("Sonido actualizado");
      }
      await qc.invalidateQueries({ queryKey: getGetAdminDescansoSoundsQueryKey() });
      cancel();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? "Error al guardar";
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm(`¿Eliminar el sonido "${id}"?`)) return;
    try {
      await deleteSound({ id });
      await qc.invalidateQueries({ queryKey: getGetAdminDescansoSoundsQueryKey() });
      toast.success("Sonido eliminado");
    } catch {
      toast.error("Error al eliminar");
    }
  }

  async function handleToggleActive(s: typeof sounds[number]) {
    try {
      await updateSound({ id: s.id, data: { isActive: !s.isActive } });
      await qc.invalidateQueries({ queryKey: getGetAdminDescansoSoundsQueryKey() });
    } catch {
      toast.error("Error al actualizar");
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Sonidos — Descanso</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gestiona los sonidos de la pantalla Descanso
          </p>
        </div>
        {mode === "idle" && (
          <Button onClick={openCreate} className="gap-2">
            <Plus className="w-4 h-4" />
            Nuevo sonido
          </Button>
        )}
      </div>

      {/* ── Formulario ── */}
      {mode !== "idle" && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-5">
          <h2 className="text-lg font-semibold text-foreground">
            {mode === "create" ? "Nuevo sonido" : "Editar sonido"}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {mode === "create" && (
              <div className="space-y-2">
                <Label>ID <span className="text-muted-foreground">(slug único, ej. lluvia_suave)</span></Label>
                <Input
                  value={form.id}
                  onChange={(e) => f("id", e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))}
                  placeholder="lluvia_suave"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label>Nombre</Label>
              <Input
                value={form.label}
                onChange={(e) => f("label", e.target.value)}
                placeholder="Lluvia suave"
              />
            </div>

            <div className="space-y-2">
              <Label>Categoría</Label>
              <Select value={form.categoryId} onValueChange={(v) => f("categoryId", v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Orden</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => f("sortOrder", e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          {/* Audio */}
          <div className="space-y-2">
            <Label>Audio (.m4a / .mp3)</Label>
            <div className="flex items-center gap-3">
              <UploadBtn
                label="Subir audio"
                accept="audio/*"
                folder="descanso-sounds/audio"
                uploading={audioUp}
                setUploading={setAudioUp}
                onDone={(p) => f("audioObjectPath", p)}
              />
              {form.audioObjectPath && (
                <span className="text-xs text-muted-foreground font-mono truncate max-w-xs flex items-center gap-1">
                  <Music2 className="w-3 h-3 shrink-0" />
                  {form.audioObjectPath.split("/").pop()}
                  <button onClick={() => f("audioObjectPath", "")} className="ml-1 text-destructive hover:opacity-70">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
            <Input
              value={form.audioObjectPath}
              onChange={(e) => f("audioObjectPath", e.target.value)}
              placeholder="descanso-sounds/audio/archivo.m4a  (o pegar objectPath)"
              className="text-xs font-mono"
            />
          </div>

          {/* Thumbnail */}
          <div className="space-y-2">
            <Label>Miniatura (imagen)</Label>
            <div className="flex items-center gap-3">
              <UploadBtn
                label="Subir imagen"
                accept="image/*"
                folder="descanso-sounds/thumbnails"
                uploading={thumbUp}
                setUploading={setThumbUp}
                onDone={(p) => f("thumbnailObjectPath", p)}
              />
              {form.thumbnailObjectPath && (
                <span className="text-xs text-muted-foreground font-mono truncate max-w-xs flex items-center gap-1">
                  <Image className="w-3 h-3 shrink-0" />
                  {form.thumbnailObjectPath.split("/").pop()}
                  <button onClick={() => f("thumbnailObjectPath", "")} className="ml-1 text-destructive hover:opacity-70">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
            <Input
              value={form.thumbnailObjectPath}
              onChange={(e) => f("thumbnailObjectPath", e.target.value)}
              placeholder="descanso-sounds/thumbnails/imagen.png  (o pegar objectPath)"
              className="text-xs font-mono"
            />
          </div>

          <div className="flex items-center gap-3">
            <Switch
              id="isActive"
              checked={form.isActive}
              onCheckedChange={(v) => f("isActive", v)}
            />
            <Label htmlFor="isActive">Activo (visible en la app)</Label>
          </div>

          <div className="flex gap-3">
            <Button onClick={handleSave} disabled={saving} className="gap-2">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              Guardar
            </Button>
            <Button variant="ghost" onClick={cancel}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* ── Lista ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : sounds.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <Music2 className="w-10 h-10 mx-auto mb-3 opacity-30" />
          <p className="text-sm">No hay sonidos aún. ¡Crea el primero!</p>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/40">
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Nombre</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">ID</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Categoría</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Audio</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Orden</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Activo</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {sounds.map((s) => {
                const catLabel = CATEGORIES.find((c) => c.id === s.categoryId)?.label ?? s.categoryId;
                return (
                  <tr key={s.id} className="border-b border-border last:border-0 hover:bg-secondary/20 transition-colors">
                    <td className="px-4 py-3 font-medium text-foreground">{s.label}</td>
                    <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{s.id}</td>
                    <td className="px-4 py-3">
                      <Badge variant="secondary">{catLabel}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {s.audioObjectPath ? (
                        <span className="text-xs text-green-400 flex items-center gap-1">
                          <Music2 className="w-3 h-3" />
                          sí
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{s.sortOrder}</td>
                    <td className="px-4 py-3">
                      <Switch
                        checked={s.isActive}
                        onCheckedChange={() => handleToggleActive(s)}
                        className="scale-90"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEdit(s)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(s.id)}
                          className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
