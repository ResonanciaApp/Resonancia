import { useState, useRef, useEffect } from "react";
import { toast } from "sonner";
import {
  Plus, Trash2, Pencil, X, GripVertical, ListMusic,
  Image as ImageIcon, Loader2, Check, ChevronDown, ChevronUp,
} from "lucide-react";
import {
  useListAdminPlaylists,
  useCreateAdminPlaylist,
  useUpdateAdminPlaylist,
  useDeleteAdminPlaylist,
  useGetCatalog,
  useRequestUploadUrl,
  getListAdminPlaylistsQueryKey,
} from "@workspace/api-client-react";
import type { CatalogPlaylist } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// ── Tipos ──────────────────────────────────────────────────────────────────

type PlaylistForm = {
  slug: string;
  title: string;
  description: string;
  coverUrl: string | null;
  durationLabel: string;
  savedCount: number;
  sessionIds: string[];
  playlistType: "sessions" | "music";
  sortOrder: number;
  isActive: boolean;
};

const EMPTY_FORM: PlaylistForm = {
  slug: "",
  title: "",
  description: "",
  coverUrl: null,
  durationLabel: "",
  savedCount: 0,
  sessionIds: [],
  playlistType: "sessions",
  sortOrder: 0,
  isActive: true,
};

// ── Helpers ────────────────────────────────────────────────────────────────

const MUSIC_CATEGORY_IDS = ["musica-sonidos", "musica", "ambient"];

function isMusicCategory(categoryId: string) {
  return MUSIC_CATEGORY_IDS.some((id) => categoryId.includes(id));
}

function toSlug(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ── Session Picker ─────────────────────────────────────────────────────────

function SessionPicker({
  selected,
  onChange,
  playlistType,
}: {
  selected: string[];
  onChange: (ids: string[]) => void;
  playlistType: "sessions" | "music";
}) {
  const { data: catalog } = useGetCatalog();
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(true);

  const sessions = (catalog?.sessions ?? []).filter((s) => {
    const isMusic = isMusicCategory(s.categoryId);
    return playlistType === "music" ? isMusic : !isMusic;
  });

  const filtered = search.trim()
    ? sessions.filter(
        (s) =>
          s.title.toLowerCase().includes(search.toLowerCase()) ||
          s.categoryLabel.toLowerCase().includes(search.toLowerCase()),
      )
    : sessions;

  const toggle = (id: string) => {
    onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  };

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-4 py-3 bg-secondary hover:bg-secondary/80 transition-colors"
      >
        <span className="font-medium text-sm text-foreground">
          Sesiones ({selected.length} seleccionadas)
        </span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        )}
      </button>
      {open && (
        <div>
          <div className="px-4 py-3 border-b border-border">
            <Input
              placeholder="Buscar sesión..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="max-h-56 overflow-y-auto divide-y divide-border">
            {filtered.length === 0 && (
              <p className="text-center text-muted-foreground text-sm py-6">
                Sin resultados
              </p>
            )}
            {filtered.map((s) => {
              const checked = selected.includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggle(s.id)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-secondary/50 transition-colors text-left"
                >
                  <div
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 transition-colors ${
                      checked
                        ? "bg-primary border-primary"
                        : "border-border bg-transparent"
                    }`}
                  >
                    {checked && <Check className="w-3 h-3 text-primary-foreground" />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm text-foreground truncate">{s.title}</p>
                    <p className="text-xs text-muted-foreground truncate">
                      {s.categoryLabel} · {s.durationLabel}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
          {selected.length > 0 && (
            <div className="px-4 py-3 bg-secondary/30 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2 font-medium">
                Orden de reproducción:
              </p>
              <div className="space-y-1">
                {selected.map((id, idx) => {
                  const s = sessions.find((x) => x.id === id);
                  return (
                    <div
                      key={id}
                      className="flex items-center gap-2 text-xs text-foreground"
                    >
                      <GripVertical className="w-3 h-3 text-muted-foreground" />
                      <span className="text-muted-foreground w-4">{idx + 1}.</span>
                      <span className="truncate">{s?.title ?? id}</span>
                      <button
                        type="button"
                        onClick={() => toggle(id)}
                        className="ml-auto text-muted-foreground hover:text-destructive"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Cover Upload ───────────────────────────────────────────────────────────

function CoverUpload({
  coverUrl,
  onChange,
}: {
  coverUrl: string | null;
  onChange: (url: string | null) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const { mutateAsync: requestUrl } = useRequestUploadUrl();

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      const { uploadURL, objectPath } = await requestUrl({
        data: {
          name: file.name,
          contentType: file.type,
          size: file.size,
        },
      });
      await fetch(uploadURL, {
        method: "PUT",
        body: file,
        headers: { "Content-Type": file.type },
      });
      const servingUrl = `/api/storage/objects/${objectPath}`;
      onChange(servingUrl);
      toast.success("Imagen subida");
    } catch {
      toast.error("Error al subir la imagen");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-2">
      <Label>Imagen de portada</Label>
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-lg border border-border bg-secondary flex items-center justify-center overflow-hidden shrink-0">
          {coverUrl ? (
            <img
              src={coverUrl}
              alt="Portada"
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="w-6 h-6 text-muted-foreground" />
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
          >
            {uploading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <ImageIcon className="w-4 h-4 mr-2" />
            )}
            {coverUrl ? "Cambiar imagen" : "Subir imagen"}
          </Button>
          {coverUrl && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-muted-foreground"
              onClick={() => onChange(null)}
            >
              <X className="w-3 h-3 mr-1" />
              Quitar
            </Button>
          )}
          <p className="text-xs text-muted-foreground">JPG, PNG · recomendado 800×800 px</p>
        </div>
      </div>
      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
          e.target.value = "";
        }}
      />
    </div>
  );
}

// ── Formulario de playlist ─────────────────────────────────────────────────

function PlaylistForm({
  initial,
  onClose,
  onSaved,
}: {
  initial: PlaylistForm & { id?: number };
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<PlaylistForm>(initial);
  const [saving, setSaving] = useState(false);
  const isEdit = initial.id !== undefined;

  const { mutateAsync: createPlaylist } = useCreateAdminPlaylist();
  const { mutateAsync: updatePlaylist } = useUpdateAdminPlaylist();

  const set = <K extends keyof PlaylistForm>(key: K, value: PlaylistForm[K]) =>
    setForm((p) => ({ ...p, [key]: value }));

  const handleTitleChange = (value: string) => {
    set("title", value);
    if (!isEdit) {
      set("slug", toSlug(value));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) { toast.error("El título es obligatorio"); return; }
    if (!form.slug.trim()) { toast.error("El slug es obligatorio"); return; }
    if (form.sessionIds.length === 0) { toast.error("Agrega al menos una sesión"); return; }

    setSaving(true);
    try {
      const payload = {
        slug: form.slug.trim(),
        title: form.title.trim(),
        description: form.description.trim(),
        coverUrl: form.coverUrl,
        durationLabel: form.durationLabel.trim(),
        savedCount: form.savedCount,
        sessionIds: form.sessionIds,
        playlistType: form.playlistType,
        sortOrder: form.sortOrder,
        isActive: form.isActive,
      };

      if (isEdit) {
        await updatePlaylist({ id: initial.id!, data: payload });
        toast.success("Playlist actualizada");
      } else {
        await createPlaylist({ data: payload });
        toast.success("Playlist creada");
      }
      onSaved();
      onClose();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error;
      toast.error(msg ?? "Error al guardar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label htmlFor="title">Título *</Label>
          <Input
            id="title"
            value={form.title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Para la ansiedad"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="slug">Slug *</Label>
          <Input
            id="slug"
            value={form.slug}
            onChange={(e) => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
            placeholder="para-la-ansiedad"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          placeholder="Breve descripción de la playlist..."
          rows={3}
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-1.5">
          <Label>Tipo</Label>
          <Select
            value={form.playlistType}
            onValueChange={(v) => {
              set("playlistType", v as "sessions" | "music");
              set("sessionIds", []);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sessions">Sesiones</SelectItem>
              <SelectItem value="music">Música</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="durationLabel">Duración</Label>
          <Input
            id="durationLabel"
            value={form.durationLabel}
            onChange={(e) => set("durationLabel", e.target.value)}
            placeholder="3 h 15 m"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sortOrder">Orden</Label>
          <Input
            id="sortOrder"
            type="number"
            min={0}
            value={form.sortOrder}
            onChange={(e) => set("sortOrder", parseInt(e.target.value) || 0)}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 items-center">
        <div className="space-y-1.5">
          <Label htmlFor="savedCount">Guardadas (display)</Label>
          <Input
            id="savedCount"
            type="number"
            min={0}
            value={form.savedCount}
            onChange={(e) => set("savedCount", parseInt(e.target.value) || 0)}
          />
        </div>
        <div className="flex items-center gap-3 pt-6">
          <Switch
            id="isActive"
            checked={form.isActive}
            onCheckedChange={(v) => set("isActive", v)}
          />
          <Label htmlFor="isActive" className="cursor-pointer">
            Activa (visible en la app)
          </Label>
        </div>
      </div>

      <CoverUpload
        coverUrl={form.coverUrl}
        onChange={(url) => set("coverUrl", url)}
      />

      <SessionPicker
        selected={form.sessionIds}
        onChange={(ids) => set("sessionIds", ids)}
        playlistType={form.playlistType}
      />

      <div className="flex gap-3 pt-2 justify-end border-t border-border">
        <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
          Cancelar
        </Button>
        <Button type="submit" disabled={saving}>
          {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          {isEdit ? "Guardar cambios" : "Crear playlist"}
        </Button>
      </div>
    </form>
  );
}

// ── Página principal ───────────────────────────────────────────────────────

export default function PlaylistsPage() {
  const qc = useQueryClient();
  const { data: playlists = [], isLoading } = useListAdminPlaylists();
  const { mutateAsync: deletePlaylist } = useDeleteAdminPlaylist();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<(PlaylistForm & { id?: number }) | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<CatalogPlaylist | null>(null);
  const [deleting, setDeleting] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: getListAdminPlaylistsQueryKey() });

  const openCreate = () => {
    setEditing(EMPTY_FORM);
    setDialogOpen(true);
  };

  const openEdit = (p: CatalogPlaylist) => {
    setEditing({
      id: p.id,
      slug: p.slug,
      title: p.title,
      description: p.description,
      coverUrl: p.coverUrl ?? null,
      durationLabel: p.durationLabel,
      savedCount: p.savedCount,
      sessionIds: p.sessionIds,
      playlistType: p.playlistType as "sessions" | "music",
      sortOrder: p.sortOrder,
      isActive: p.isActive,
    });
    setDialogOpen(true);
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    setDeleting(true);
    try {
      await deletePlaylist({ id: confirmDelete.id });
      toast.success("Playlist eliminada");
      invalidate();
      setConfirmDelete(null);
    } catch {
      toast.error("Error al eliminar");
    } finally {
      setDeleting(false);
    }
  };

  const sorted = [...playlists].sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id);

  return (
    <div className="space-y-6">
      {/* Cabecera */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Playlists de Resonancia</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Colecciones curatoriales que aparecen en el inicio de la app
          </p>
        </div>
        <Button onClick={openCreate} className="gap-2">
          <Plus className="w-4 h-4" />
          Nueva playlist
        </Button>
      </div>

      {/* Tabla */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center text-muted-foreground border border-dashed border-border rounded-xl">
          <ListMusic className="w-10 h-10 mb-3 opacity-30" />
          <p className="font-medium">No hay playlists todavía</p>
          <p className="text-sm mt-1">Crea la primera para que aparezca en el home.</p>
        </div>
      ) : (
        <div className="border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Playlist</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Tipo</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Sesiones</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Orden</th>
                <th className="text-left px-4 py-3 text-muted-foreground font-medium">Estado</th>
                <th className="w-20 px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sorted.map((p) => (
                <tr key={p.id} className="hover:bg-secondary/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md border border-border bg-secondary flex items-center justify-center overflow-hidden shrink-0">
                        {p.coverUrl ? (
                          <img src={p.coverUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <ListMusic className="w-4 h-4 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{p.title}</p>
                        <p className="text-xs text-muted-foreground">{p.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant="outline" className="text-xs">
                      {p.playlistType === "music" ? "Música" : "Sesiones"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.sessionIds.length} sesiones
                    {p.durationLabel ? ` · ${p.durationLabel}` : ""}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{p.sortOrder}</td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={p.isActive ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {p.isActive ? "Activa" : "Inactiva"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1 justify-end">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8"
                        onClick={() => openEdit(p)}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="w-8 h-8 text-destructive hover:text-destructive"
                        onClick={() => setConfirmDelete(p)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dialog crear / editar */}
      <Dialog open={dialogOpen} onOpenChange={(v) => !v && setDialogOpen(false)}>
        <DialogContent className="max-w-2xl max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing?.id !== undefined ? "Editar playlist" : "Nueva playlist"}
            </DialogTitle>
          </DialogHeader>
          {editing && (
            <PlaylistForm
              initial={editing}
              onClose={() => setDialogOpen(false)}
              onSaved={invalidate}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Dialog confirmar eliminación */}
      <Dialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Eliminar playlist</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            ¿Eliminar <span className="font-medium text-foreground">"{confirmDelete?.title}"</span>?
            Esta acción no se puede deshacer.
          </p>
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="outline" onClick={() => setConfirmDelete(null)} disabled={deleting}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting}>
              {deleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Eliminar
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
